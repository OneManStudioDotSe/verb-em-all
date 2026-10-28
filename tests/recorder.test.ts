import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawn, spawnSync, type ChildProcess } from 'child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { RECORDER_SCRIPT } from '../src/main/recorder'
import { SHELL_HOOK } from '../src/shared/shellhook'
import { detectSpinnerVerbs } from '../src/main/detector'

// Runs the real relay in a pseudo-terminal, so it needs macOS's expect (CI runs on Linux)
const hasExpect = spawnSync('which', ['expect']).status === 0
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

let home: string
let session: ChildProcess | null = null
const recorderDir = (): string => join(home, '.verb-em-all')
const ttyLogs = (): string[] => {
  try { return readdirSync(join(recorderDir(), 'tty')).filter((f) => f.endsWith('.log')) } catch { return [] }
}

/** Runs `command` inside a pseudo-terminal, like a terminal tab would. */
function startInTerminal(command: string): void {
  session = spawn('expect', ['-c', `set timeout 60; spawn -noecho ${command}; expect eof`], {
    env: { ...process.env, HOME: home, PATH: `${join(home, 'bin')}:${process.env.PATH}` },
    stdio: 'ignore',
    detached: true
  })
}

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'verb-recorder-'))
  mkdirSync(join(home, 'bin'))
  mkdirSync(recorderDir())
  // Stand-in for Claude Code: draws a spinner line a few times a second
  writeFileSync(
    join(home, 'bin', 'claude'),
    '#!/bin/sh\necho "plain:$*"\n[ -n "$1" ] && exit 0\nfor i in $(seq 1 60); do printf "\\r\\033[38;5;174m✻ Flibbertigibbeting…\\033[0m (esc to interrupt)"; sleep 0.2; done\n',
    { mode: 0o755 }
  )
  writeFileSync(join(recorderDir(), 'relay.exp'), RECORDER_SCRIPT)
})

afterEach(() => {
  if (session?.pid) try { process.kill(-session.pid) } catch { /* already gone */ }
  session = null
  rmSync(home, { recursive: true, force: true })
})

describe.skipIf(!hasExpect)('spinner-verb relay', () => {
  it('records only while monitoring is on (record.exp present)', async () => {
    startInTerminal(`expect -f ${join(recorderDir(), 'relay.exp')} claude`)

    // App closed: the session runs, nothing is written
    await sleep(2500)
    expect(ttyLogs()).toEqual([])

    // App opens and starts monitoring: the running session starts logging within ~1 s
    writeFileSync(join(recorderDir(), 'record.exp'), RECORDER_SCRIPT)
    await sleep(2500)
    const logs = ttyLogs()
    expect(logs).toHaveLength(1)
    const recorded = readFileSync(join(recorderDir(), 'tty', logs[0]), 'utf8')
    expect(detectSpinnerVerbs(recorded)).toEqual(['flibbertigibbeting'])

    // App quits (what stopMonitoring does): logging stops and is not recreated
    rmSync(join(recorderDir(), 'record.exp'))
    rmSync(join(recorderDir(), 'tty'), { recursive: true, force: true })
    await sleep(2500)
    expect(existsSync(join(recorderDir(), 'tty'))).toBe(false)
  }, 20_000)

  it('the shell function sends terminal sessions through the relay', async () => {
    writeFileSync(join(recorderDir(), 'record.exp'), RECORDER_SCRIPT)
    startInTerminal(`zsh -f -c {${SHELL_HOOK}\nclaude}`)
    await sleep(2500)
    expect(ttyLogs()).toHaveLength(1)
  }, 15_000)

  it('the shell function runs plain claude outside a terminal (scripts, pipes)', () => {
    writeFileSync(join(recorderDir(), 'record.exp'), RECORDER_SCRIPT)
    const out = spawnSync('zsh', ['-f', '-c', `${SHELL_HOOK}\nclaude --version`], {
      env: { ...process.env, HOME: home, PATH: `${join(home, 'bin')}:${process.env.PATH}` },
      encoding: 'utf8',
      timeout: 20_000
    })
    expect(out.stdout.split('\n')[0]).toBe('plain:--version')
    expect(ttyLogs()).toEqual([])
  }, 25_000)

  it('the shell function falls back to plain claude when the relay is gone', () => {
    rmSync(join(recorderDir(), 'relay.exp'))
    writeFileSync(join(recorderDir(), 'record.exp'), RECORDER_SCRIPT)
    const out = spawnSync('expect', ['-c', `log_user 1; spawn -noecho zsh -f -c {${SHELL_HOOK}\nclaude --check}; expect "plain:--check"; exit 0`], {
      env: { ...process.env, HOME: home, PATH: `${join(home, 'bin')}:${process.env.PATH}` },
      encoding: 'utf8',
      timeout: 20_000
    })
    expect(out.stdout).toContain('plain:--check')
    expect(ttyLogs()).toEqual([])
  }, 25_000)
})
