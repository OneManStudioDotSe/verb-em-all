import React from 'react'
import type { WordViewModel } from '../../../shared/types'
import { WordCard } from './WordCard'

interface WordListProps {
  words: WordViewModel[]
  onCatch: (word: WordViewModel) => void
  onUncatch: (word: WordViewModel) => void
  emptyMessage: string
  onHover?: (word: WordViewModel) => void
}

export function WordList({ words, onCatch, onUncatch, emptyMessage, onHover }: WordListProps): React.JSX.Element {
  if (words.length === 0) {
    const [headline, sub] = emptyMessage.includes(' — ')
      ? emptyMessage.split(' — ')
      : [emptyMessage, null]
    return (
      <div className="word-list">
        <div className="word-list-empty">
          <span className="word-list-empty-headline">{headline}</span>
          {sub && <span className="word-list-empty-sub">{sub}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="word-list">
      {words.map((word) => (
        <WordCard
          key={word.id}
          word={word}
          onCatch={() => onCatch(word)}
          onUncatch={() => onUncatch(word)}
          onHover={onHover ? () => onHover(word) : undefined}
        />
      ))}
    </div>
  )
}
