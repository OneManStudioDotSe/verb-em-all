import { describe, it, expect } from 'vitest'
import { sortWords } from '../src/renderer/src/data/sortWords'
import type { WordViewModel } from '../src/shared/types'

const word = (w: string, catchCount: number, category = 'motion'): WordViewModel =>
  ({ id: w.toLowerCase(), word: w, emoji: '', description: '', category, isCaught: catchCount > 0, catchCount, history: [] }) as WordViewModel

const words = [word('Bravo', 1), word('Alpha', 3), word('Delta', 1), word('Charlie', 4)]
const names = (ws: WordViewModel[]): string[] => ws.map((w) => w.word)

describe('sortWords', () => {
  it('catches desc (the default for that field) lists the most-caught verbs first', () => {
    expect(names(sortWords(words, { field: 'catches', dir: 'desc' }))).toEqual(['Charlie', 'Alpha', 'Bravo', 'Delta'])
  })

  it('catches asc lists the least-caught first, ties still alphabetical', () => {
    expect(names(sortWords(words, { field: 'catches', dir: 'asc' }))).toEqual(['Bravo', 'Delta', 'Alpha', 'Charlie'])
  })

  it('title sorts alphabetically and reverses on desc', () => {
    expect(names(sortWords(words, { field: 'title', dir: 'asc' }))).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
    expect(names(sortWords(words, { field: 'title', dir: 'desc' }))).toEqual(['Delta', 'Charlie', 'Bravo', 'Alpha'])
  })
})
