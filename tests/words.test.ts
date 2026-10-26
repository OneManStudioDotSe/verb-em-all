import { describe, it, expect } from 'vitest'
import { WORDS } from '../src/renderer/src/data/words'
import type { WordCategory } from '../src/shared/types'

const CATEGORIES: WordCategory[] = [
  'motion', 'speech', 'cognition', 'creation', 'social', 'technical', 'cooking'
]

describe('word list', () => {
  it('has 193 verbs', () => {
    expect(WORDS).toHaveLength(193)
  })

  it('has unique ids and unique words', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length)
    expect(new Set(WORDS.map((w) => w.word.toLowerCase())).size).toBe(WORDS.length)
  })

  it('only uses known categories', () => {
    for (const w of WORDS) expect(CATEGORIES).toContain(w.category)
  })

  it('has an emoji and a description on every entry', () => {
    for (const w of WORDS) {
      expect(w.emoji.length).toBeGreaterThan(0)
      expect(w.description.trim().length).toBeGreaterThan(0)
    }
  })
})
