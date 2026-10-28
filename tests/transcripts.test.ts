import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { recentTranscripts, readTail, scanTranscripts } from '../src/main/transcripts'

let dir: string
const now = Date.now()
const touch = (path: string, ageMs: number, body = '{}\n'): void => {
  writeFileSync(path, body)
  utimesSync(path, (now - ageMs) / 1000, (now - ageMs) / 1000)
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'verb-transcripts-'))
  mkdirSync(join(dir, 'project-a', 'subagents'), { recursive: true })
  touch(join(dir, 'project-a', 'live.jsonl'), 5 * 60_000)
  touch(join(dir, 'project-a', 'subagents', 'agent.jsonl'), 10 * 60_000)
  touch(join(dir, 'project-a', 'old.jsonl'), 3 * 3600_000)
  touch(join(dir, 'project-a', 'notes.txt'), 0)
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('recentTranscripts', () => {
  it('finds only .jsonl files modified since the cutoff, including nested ones', () => {
    const found = recentTranscripts(dir, now - 3600_000).map((p) => p.slice(dir.length)).sort()
    expect(found).toEqual(['/project-a/live.jsonl', '/project-a/subagents/agent.jsonl'])
  })

  it('returns nothing for a missing folder', () => {
    expect(recentTranscripts(join(dir, 'nope'), 0)).toEqual([])
  })
})

describe('readTail', () => {
  it('returns a small file whole', () => {
    const path = join(dir, 'small.jsonl')
    writeFileSync(path, 'line one\nline two\n')
    expect(readTail(path, 1024)).toBe('line one\nline two\n')
  })

  it('starts at a line boundary when it cuts a large file', () => {
    const path = join(dir, 'large.jsonl')
    writeFileSync(path, 'a'.repeat(100) + '\n' + 'tail line\n')
    expect(readTail(path, 15)).toBe('tail line\n')
  })

  it('returns an empty string for a missing file', () => {
    expect(readTail(join(dir, 'missing.jsonl'), 10)).toBe('')
  })
})

describe('scanTranscripts', () => {
  const said = (text: string): string =>
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) + '\n'
  // Tool output is not something Claude said, so its words are not detected
  const toolOutput = (text: string): string =>
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: text }] } }) + '\n'

  it('finds verbs Claude wrote in recently active sessions only', () => {
    const scan = mkdtempSync(join(tmpdir(), 'verb-scan-'))
    mkdirSync(join(scan, 'project'))
    touch(join(scan, 'project', 'live.jsonl'), 60_000, said('Still kerfuffling with the config loader.'))
    touch(join(scan, 'project', 'old.jsonl'), 3 * 3600_000, said('A hullaballooing build this morning.'))
    const { verbs, files } = scanTranscripts(scan, now - 3600_000, 64 * 1024)
    expect(verbs).toEqual(['kerfuffling'])
    expect(files.map((f) => f.slice(scan.length))).toEqual(['/project/live.jsonl'])
    rmSync(scan, { recursive: true, force: true })
  })

  it('does not misread a line cut off by the tail limit as plain text', () => {
    const scan = mkdtempSync(join(tmpdir(), 'verb-scan-'))
    const last = said('Now kerfuffling.')
    // Read whole, this tool-output line is JSON and ignored; cut in half it would look like text
    touch(join(scan, 'cut.jsonl'), 0, toolOutput('x'.repeat(500) + ' Flibbertigibbeting') + last)
    expect(scanTranscripts(scan, now - 60_000, 1024 * 1024).verbs).toEqual(['kerfuffling'])
    expect(scanTranscripts(scan, now - 60_000, last.length + 40).verbs).toEqual(['kerfuffling'])
    rmSync(scan, { recursive: true, force: true })
  })
})
