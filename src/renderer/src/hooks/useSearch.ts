import { useMemo } from 'react'
import type { WordViewModel } from '../../../shared/types'

export function useSearch(words: WordViewModel[], query: string): WordViewModel[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return words
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
    )
  }, [words, query])
}
