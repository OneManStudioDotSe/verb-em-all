import React, { useState } from 'react'
import type { WordViewModel } from '../../../shared/types'
import { CatchCounter } from './CatchCounter'

interface WordCardProps {
  word: WordViewModel
  onCatch: () => void
  onUncatch: () => void
  onHover?: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function WordCard({ word, onCatch, onUncatch, onHover }: WordCardProps): React.JSX.Element {
  const [confirmingUncatch, setConfirmingUncatch] = useState(false)

  function handleUncatchClick(): void {
    if (confirmingUncatch) {
      setConfirmingUncatch(false)
      onUncatch()
    } else {
      setConfirmingUncatch(true)
    }
  }

  function handleBlur(): void {
    setConfirmingUncatch(false)
  }

  return (
    <div className={`word-card ${word.isCaught ? 'is-caught' : ''}`} onMouseEnter={onHover}>
      <div className="word-card-top">
        <div className="word-card-emoji">{word.emoji}</div>

        <div className="word-card-body">
          <div className="word-card-header">
            <span className="word-card-word">{word.word}</span>
            <span className="word-card-category">{word.category}</span>
          </div>
          <p className="word-card-description">{word.description}</p>
        </div>
      </div>

      <div className="word-card-footer">
        {word.isCaught && word.latestCatchDate ? (
          <div className="word-card-meta">
            <CatchCounter count={word.catchCount} />
            <span className="word-card-date">Last: {formatDate(word.latestCatchDate)}</span>
          </div>
        ) : (
          <span />
        )}

        <div className="word-card-actions">
          {word.isCaught ? (
            <>
              <button className="btn btn-catch-again" onClick={onCatch} title="Catch again">
                ↻ Again
              </button>
              <button
                className={`btn btn-uncatch${confirmingUncatch ? ' confirming' : ''}`}
                onClick={handleUncatchClick}
                onBlur={handleBlur}
                title={confirmingUncatch ? 'Click again to confirm' : 'Release this verb'}
              >
                {confirmingUncatch ? 'Sure?' : '✕'}
              </button>
            </>
          ) : (
            <button className="btn btn-catch" onClick={onCatch}>
              Catch it!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
