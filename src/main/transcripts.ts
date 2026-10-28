import { readdirSync, statSync, openSync, readSync, closeSync } from 'fs'
import { join } from 'path'

/** Transcript files (.jsonl) modified at or after `since` (ms epoch), up to `depth` levels below `dir`. */
export function recentTranscripts(dir: string, since: number, depth = 3): string[] {
  const found: string[] = []
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return found }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (depth > 1) found.push(...recentTranscripts(path, since, depth - 1))
    } else if (entry.name.endsWith('.jsonl')) {
      try { if (statSync(path).mtimeMs >= since) found.push(path) } catch { /* removed meanwhile */ }
    }
  }
  return found
}

/** The last `bytes` of a file, starting at a line boundary so no half line is returned. */
export function readTail(filePath: string, bytes: number): string {
  try {
    const size = statSync(filePath).size
    const start = Math.max(0, size - bytes)
    const buf = Buffer.alloc(size - start)
    const fd = openSync(filePath, 'r')
    readSync(fd, buf, 0, buf.length, start)
    closeSync(fd)
    const text = buf.toString('utf8')
    return start === 0 ? text : text.slice(text.indexOf('\n') + 1)
  } catch {
    return ''
  }
}
