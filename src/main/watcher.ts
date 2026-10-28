import { BrowserWindow, clipboard } from 'electron'
import { homedir } from 'os'
import { join } from 'path'
import {
  openSync, readSync, statSync, closeSync, existsSync, mkdirSync, readdirSync,
  readFileSync, writeFileSync, truncateSync, rmSync
} from 'fs'
import chokidar, { type FSWatcher } from 'chokidar'
import { detectWords, detectSpinnerVerbs, extractTextFromJsonlLine } from './detector'
import { hasCurrentShellHook, addShellHook, removeShellHook } from '../shared/shellhook'
import { recentTranscripts, readTail } from './transcripts'
import type { ClaudeStatus } from '../shared/types'

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects')
const CLIPBOARD_INTERVAL_MS = 2000
const RECORDER_DIR = join(homedir(), '.verb-em-all')
const RECORDER_PATH = join(RECORDER_DIR, 'record.exp')
const RELAY_PATH = join(RECORDER_DIR, 'relay.exp')
const TTY_DIR = join(RECORDER_DIR, 'tty')
const TERMINAL_INTERVAL_MS = 1000
const SHELL_PROFILES = ['.zshrc', '.bashrc'].map((f) => join(homedir(), f))
// Sessions whose transcript changed this recently count as still running when monitoring starts
const RECENT_SESSION_MS = 60 * 60 * 1000
const RECENT_TAIL_BYTES = 256 * 1024

// Spinner verbs are only drawn on screen, never written to transcripts. The `claude` shell
// function (SHELL_HOOK) always runs Claude Code through this expect script (relay.exp, kept
// while the function is installed), which relays the session through a pseudo-terminal,
// forwards window resizes and appends the output to tty/<pid>.log while the app is
// monitoring. The app reads and empties those logs. Every second the relay checks for
// record.exp, which exists only while monitoring is on: it stops logging when the app stops
// and resumes when it starts again, so sessions started or left open while the app was
// closed are caught once it opens, and nothing is recorded in between. record.exp holds the
// same script so shells still using the previous function (which ran record.exp) keep working.
const RECORDER_SCRIPT = `# Written by Verb 'em all while monitoring is on; removed when it stops.
set dir [file join $env(HOME) .verb-em-all]
set log [file join $dir tty "[pid].log"]
log_user 0
proc follow {} {
  global dir log
  catch {
    if {![file exists [file join $dir record.exp]]} {
      log_file
    } elseif {![file exists $log]} {
      file mkdir [file dirname $log]
      log_file
      log_file -a $log
    }
  }
  after 1000 follow
}
follow
set stty_init "rows [stty rows] columns [stty columns]"
spawn -noecho {*}$argv
trap { stty rows [stty rows] columns [stty columns] < $spawn_out(slave,name) } WINCH
interact
catch wait result
log_file
file delete $log
exit [lindex $result 3]
`


// Byte positions per file so we only read newly appended content
const filePositions = new Map<string, number>()
// Word IDs already sent this session so we don't spam the same detection
const alreadySent = new Set<string>()

let fsWatcher: FSWatcher | null = null
let clipboardTimer: ReturnType<typeof setInterval> | null = null
let terminalTimer: ReturnType<typeof setInterval> | null = null
let lastClipboard = ''
let _mainWindow: BrowserWindow | null = null

function sendDetected(ids: string[]): void {
  const fresh = ids.filter((id) => !alreadySent.has(id))
  if (fresh.length === 0 || !_mainWindow || _mainWindow.isDestroyed()) return
  fresh.forEach((id) => alreadySent.add(id))
  _mainWindow.webContents.send('words:detected', fresh)
}

function readNewBytes(filePath: string): string {
  try {
    const stat = statSync(filePath)
    const lastPos = filePositions.get(filePath) ?? 0
    if (stat.size <= lastPos) return ''
    const length = stat.size - lastPos
    const buf = Buffer.alloc(length)
    const fd = openSync(filePath, 'r')
    readSync(fd, buf, 0, length, lastPos)
    closeSync(fd)
    filePositions.set(filePath, stat.size)
    return buf.toString('utf8')
  } catch {
    return ''
  }
}

function handleFileChange(filePath: string): void {
  if (!filePath.endsWith('.jsonl') && !filePath.endsWith('.json')) return
  const newContent = readNewBytes(filePath)
  if (!newContent) return

  const text = newContent
    .split('\n')
    .map(extractTextFromJsonlLine)
    .join('\n')

  const found = detectWords(text)
  if (found.length > 0) sendDetected(found)
}

function startSessionWatcher(): void {
  // Ensure the directory exists (Claude Code might not have run yet)
  if (!existsSync(CLAUDE_PROJECTS_DIR)) {
    try { mkdirSync(CLAUDE_PROJECTS_DIR, { recursive: true }) } catch { /* ok */ }
  }

  fsWatcher = chokidar.watch(CLAUDE_PROJECTS_DIR, {
    persistent: true,
    ignoreInitial: true,
    depth: 4,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 }
  })

  fsWatcher.on('change', handleFileChange)
  fsWatcher.on('add', handleFileChange)
}

async function startClipboardWatcher(): Promise<void> {
  try { lastClipboard = await clipboard.readText() } catch { lastClipboard = '' }

  clipboardTimer = setInterval(async () => {
    let current: string
    try { current = await clipboard.readText() } catch { return }
    if (!current || current === lastClipboard || current.length < 10) return
    lastClipboard = current
    const found = detectWords(current)
    if (found.length > 0) sendDetected(found)
  }, CLIPBOARD_INTERVAL_MS)
}

function readTerminalLogs(): void {
  let files: string[]
  try { files = readdirSync(TTY_DIR).filter((f) => f.endsWith('.log')) } catch { return }
  for (const f of files) {
    const filePath = join(TTY_DIR, f)
    try {
      const raw = readFileSync(filePath, 'utf8')
      if (!raw) continue
      // The recorder appends, so emptying the file keeps it small without losing its place
      truncateSync(filePath, 0)
      const found = detectSpinnerVerbs(raw)
      if (found.length > 0) sendDetected(found)
    } catch { /* session ended mid-read */ }
  }
}

/** Keep the relay in place exactly while the current shell function is installed. */
export function refreshRelay(): void {
  try {
    if (isShellHookInstalled()) {
      mkdirSync(RECORDER_DIR, { recursive: true })
      writeFileSync(RELAY_PATH, RECORDER_SCRIPT)
    } else {
      rmSync(RELAY_PATH, { force: true })
    }
  } catch { /* reported via getClaudeStatus */ }
}

/**
 * Verbs in Claude Code sessions active in the last hour, read from the end of their
 * transcripts, so sessions already running when monitoring starts are caught too.
 * Returned to the renderer directly: at launch it may not be listening for events yet.
 */
export function scanRecentSessions(): string[] {
  if (!fsWatcher) return [] // monitoring is off
  const found = new Set<string>()
  for (const file of recentTranscripts(CLAUDE_PROJECTS_DIR, Date.now() - RECENT_SESSION_MS)) {
    const text = readTail(file, RECENT_TAIL_BYTES).split('\n').map(extractTextFromJsonlLine).join('\n')
    detectWords(text).forEach((id) => found.add(id))
    // Later changes to this file are read from here on, not from the start
    try { filePositions.set(file, statSync(file).size) } catch { /* removed meanwhile */ }
  }
  found.forEach((id) => alreadySent.add(id))
  return [...found]
}

function startTerminalWatcher(): void {
  try {
    mkdirSync(TTY_DIR, { recursive: true })
    writeFileSync(RECORDER_PATH, RECORDER_SCRIPT)
  } catch { return }
  terminalTimer = setInterval(readTerminalLogs, TERMINAL_INTERVAL_MS)
}

export function startMonitoring(mainWindow: BrowserWindow): void {
  _mainWindow = mainWindow
  alreadySent.clear()
  filePositions.clear()
  startSessionWatcher()
  startClipboardWatcher()
  startTerminalWatcher()
}

export function stopMonitoring(): void {
  if (fsWatcher) {
    fsWatcher.close()
    fsWatcher = null
  }
  if (clipboardTimer) {
    clearInterval(clipboardTimer)
    clipboardTimer = null
  }
  if (terminalTimer) {
    clearInterval(terminalTimer)
    terminalTimer = null
  }
  // No recorder means new `claude` sessions run unrecorded; open sessions stop logging
  rmSync(RECORDER_PATH, { force: true })
  rmSync(TTY_DIR, { recursive: true, force: true })
  filePositions.clear()
  alreadySent.clear()
}

/** Call this after a word is caught so it can be re-detected if it appears again later. */
export function clearDetectedWord(wordId: string): void {
  alreadySent.delete(wordId)
}

/** Can we see Claude Code transcripts on this machine? Scans two levels deep, stops early. */
export function getClaudeStatus(): ClaudeStatus {
  let transcripts = 0
  if (existsSync(CLAUDE_PROJECTS_DIR)) {
    try {
      for (const project of readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true })) {
        if (!project.isDirectory()) continue
        for (const f of readdirSync(join(CLAUDE_PROJECTS_DIR, project.name))) {
          if (f.endsWith('.jsonl')) transcripts++
          if (transcripts >= 50) break
        }
        if (transcripts >= 50) break
      }
    } catch { /* unreadable: report what we have */ }
  }
  let recording = 0
  try { recording = readdirSync(TTY_DIR).filter((f) => f.endsWith('.log')).length } catch { /* none */ }
  return { found: transcripts > 0, transcripts, dir: CLAUDE_PROJECTS_DIR, recording, shellHook: isShellHookInstalled() }
}

function readProfile(path: string): string | null {
  try { return readFileSync(path, 'utf8') } catch { return null }
}

export function isShellHookInstalled(): boolean {
  return SHELL_PROFILES.some((p) => hasCurrentShellHook(readProfile(p) ?? ''))
}

/**
 * Add or remove the `claude` function in the user's shell profiles. Adds it to every
 * profile that exists (creating ~/.zshrc, the macOS default, if none do); removes it
 * from all of them. Returns whether it is installed afterwards.
 */
export function setShellHook(enabled: boolean): boolean {
  const existing = SHELL_PROFILES.filter((p) => readProfile(p) !== null)
  const targets = enabled ? (existing.length > 0 ? existing : [SHELL_PROFILES[0]]) : existing
  for (const p of targets) {
    const text = readProfile(p) ?? ''
    const next = enabled ? addShellHook(text) : removeShellHook(text)
    if (next !== text) {
      try { writeFileSync(p, next) } catch { /* read-only profile: reported via the result */ }
    }
  }
  refreshRelay()
  return isShellHookInstalled()
}
