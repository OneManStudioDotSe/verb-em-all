import { describe, it, expect } from 'vitest'
import { detectWords, extractTextFromJsonlLine } from '../src/main/detector'
import { WORDS } from '../src/renderer/src/data/words'

const sample = WORDS.find((w) => w.word.length >= 6)!

describe('detectWords', () => {
  it('finds a verb regardless of case and returns its id', () => {
    const text = `We spent the day ${sample.word.toUpperCase()} the backlog.`
    expect(detectWords(text)).toContain(sample.id)
  })

  it('respects word boundaries', () => {
    expect(detectWords(`x${sample.word}y`)).not.toContain(sample.id)
  })

  it('returns each id at most once', () => {
    const text = `${sample.word} ${sample.word} ${sample.word}`
    const found = detectWords(text)
    expect(found.filter((id) => id === sample.id)).toHaveLength(1)
  })

  it('returns nothing for empty or tiny input', () => {
    expect(detectWords('')).toEqual([])
    expect(detectWords('ab')).toEqual([])
  })
})

describe('extractTextFromJsonlLine', () => {
  it('pulls text and thinking blocks from an assistant message', () => {
    const line = JSON.stringify({
      message: {
        content: [
          { type: 'text', text: 'hello' },
          { type: 'thinking', thinking: 'pondering' },
          { type: 'tool_use', name: 'ignored' }
        ]
      }
    })
    expect(extractTextFromJsonlLine(line)).toBe('hello\npondering')
  })

  it('handles flat text / thinking objects', () => {
    expect(extractTextFromJsonlLine(JSON.stringify({ text: 'a' }))).toBe('a')
    expect(extractTextFromJsonlLine(JSON.stringify({ thinking: 'b' }))).toBe('b')
  })

  it('returns non-JSON lines unchanged', () => {
    expect(extractTextFromJsonlLine('plain text')).toBe('plain text')
  })
})
