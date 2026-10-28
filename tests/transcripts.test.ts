import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { recentTranscripts, readTail } from '../src/main/transcripts'

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
