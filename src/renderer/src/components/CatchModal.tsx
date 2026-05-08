import React, { useState, useEffect } from 'react'
import type { WordViewModel } from '../../../shared/types'

interface CatchModalProps {
  word: WordViewModel | null
  onConfirm: (note: string) => void
  onClose: () => void
}

export function CatchModal({ word, onConfirm, onClose }: CatchModalProps): React.JSX.Element | null {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (word) setNote('')
  }, [word])

  useEffect(() => {
    if (!word) return
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onConfirm(note.trim()); setNote('') }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [word, note, onClose, onConfirm])

  if (!word) return null

  function handleConfirm(): void {
    onConfirm(note.trim())
    setNote('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-emoji">{word.emoji}</span>
          <div>
            <div className="modal-title">{word.word}</div>
            <div className="modal-subtitle">{word.description}</div>
          </div>
        </div>

        <div>
          <div className="modal-label">Where did you catch it? (optional)</div>
          <textarea
            className="modal-textarea"
            placeholder="e.g. 'Found in the React docs while reading about useCallback...'"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
            rows={3}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-confirm" onClick={handleConfirm}>
            Caught! ★
          </button>
        </div>
      </div>
    </div>
  )
}
