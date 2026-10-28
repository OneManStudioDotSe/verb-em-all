import type { WordViewModel } from '../../../shared/types'
import type { SortConfig } from '../components/SortBar'

export function sortWords(words: WordViewModel[], config: SortConfig): WordViewModel[] {
  return [...words].sort((a, b) => {
    let cmp = 0
    if (config.field === 'title') {
      cmp = a.word.localeCompare(b.word)
    } else if (config.field === 'category') {
      cmp = a.category.localeCompare(b.category) || a.word.localeCompare(b.word)
    } else if (config.field === 'catches') {
      // Ties stay alphabetical in both directions
      cmp = a.catchCount - b.catchCount
      if (cmp === 0) return a.word.localeCompare(b.word)
    }
    return config.dir === 'asc' ? cmp : -cmp
  })
}
