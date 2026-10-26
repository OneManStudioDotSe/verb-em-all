import React from 'react'
import type { WordViewModel } from '../../../shared/types'

interface DetectionPanelProps {
  detectedWords: WordViewModel[]
  onCatch: (word: WordViewModel) => void
  onCatchAll: (words: WordViewModel[]) => void
  onDismiss: (wordId: string) => void
  onDismissAll: () => void
}

export function DetectionPanel({
  detectedWords,
  onCatch,
  onCatchAll,
  onDismiss,
  onDismissAll
}: DetectionPanelProps): React.JSX.Element | null {
  if (detectedWords.length === 0) return null

  const newOnes = detectedWords.filter((w) => !w.isCaught)
  const seenOnes = detectedWords.filter((w) => w.isCaught)

  return (
    <div className="detection-panel">
      <div className="detection-panel-header">
        <div className="detection-panel-title">
          <span className="detection-pulse" />
          Spotted in Claude
          <span className="detection-count">{detectedWords.length}</span>
        </div>
        <div className="detection-panel-actions">
          {newOnes.length > 1 && (
            <button
              className="btn-detection-catchall"
              onClick={() => onCatchAll(newOnes)}
              title="Catch all new words without notes"
            >
              Catch all new ({newOnes.length})
            </button>
          )}
          {seenOnes.length > 1 && (
            <button
              className="btn-detection-catchall again"
              onClick={() => onCatchAll(seenOnes)}
              title="Catch every verb you already have once more, without notes"
            >
              Catch all again ({seenOnes.length})
            </button>
          )}
          <button className="btn-detection-dismiss-all" onClick={onDismissAll} title="Dismiss all">
            Clear
          </button>
        </div>
      </div>

      <div className="detection-cards">
        {detectedWords.map((word) => (
          <div key={word.id} className={`detection-card${word.isCaught ? ' already-caught' : ''}`}>
            <span className="detection-card-emoji">{word.emoji}</span>
            <span className="detection-card-word">{word.word}</span>
            {word.isCaught && (
              <span className="detection-card-badge">caught ×{word.catchCount}</span>
            )}
            <button
              className={`btn-detection-catch${word.isCaught ? ' again' : ''}`}
              onClick={() => onCatch(word)}
              title={word.isCaught ? 'Catch again' : 'Catch it!'}
            >
              {word.isCaught ? '↻ Again' : '★ Catch'}
            </button>
            <button
              className="btn-detection-dismiss"
              onClick={() => onDismiss(word.id)}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
