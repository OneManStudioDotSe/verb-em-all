import { describe, it, expect } from 'vitest'
import { detectWords, detectSpinnerVerbs, extractTextFromJsonlLine } from '../src/main/detector'
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

describe('detectSpinnerVerbs', () => {
  // Bytes recorded from a real Claude Code session
  const whirring = '\x1b[H\r\x1b[2C\x1b[17B\x1b[38;2;215;119;87mWhirring\x1b[38;2;235;159;127m…\x1b[38;2;215;119;87m \x1b'
  const bootstrapping = '\x1b[49m\x1b[38;2;215;119;87m·\x1b[3GBootstrapping… \r\x1b[62C'

  it('finds verbs split by colour codes or after the spinner glyph', () => {
    expect(detectSpinnerVerbs(whirring + bootstrapping).sort()).toEqual(['bootstrapping', 'whirring'])
  })

  it('handles apostrophes and ignores case', () => {
    expect(detectSpinnerVerbs("✻ BEBOPPIN'…")).toEqual(['beboppin'])
  })

  it('needs the ellipsis and a whole known verb', () => {
    expect(detectSpinnerVerbs('Whirring along')).toEqual([])
    expect(detectSpinnerVerbs('\x1b[11G\x1b[38;2;215;119;87mr…')).toEqual([])
    expect(detectSpinnerVerbs('Loading…')).toEqual([])
  })

  it('does not glue text across cursor moves or titles', () => {
    expect(detectSpinnerVerbs('Whir\x1b[5Gring…')).toEqual([])
    expect(detectSpinnerVerbs('\x1b]0;Whir\x07ring…')).toEqual([])
  })
})
