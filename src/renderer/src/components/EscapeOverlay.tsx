import React, { useState, useEffect } from 'react'
import type { WordViewModel } from '../../../shared/types'

interface EscapeOverlayProps {
  word: WordViewModel
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 6000
const FADE_MS = 600

export function EscapeOverlay({ word, onDismiss }: EscapeOverlayProps): React.JSX.Element {
  const [fading, setFading] = useState(false)

  function dismiss(): void {
    if (fading) return
    setFading(true)
    setTimeout(onDismiss, FADE_MS)
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`escape-overlay${fading ? ' fading' : ''}`} onClick={dismiss}>
      <div className="escape-content" onClick={(e) => e.stopPropagation()}>
        <pre className="escape-creature">{'  \\(>.<)/\n   {???}\n   // \\\\'}</pre>
        <div className="escape-warning">⚠ VERBAGOTCHI ESCAPED!</div>
        <div className="escape-word">
          <span className="escape-word-emoji">{word.emoji}</span>
          <span className="escape-word-text">{word.word}</span>
        </div>
        <div className="escape-subtitle">
          was uncaught. Feed your creature!
        </div>
        <div className="escape-dismiss">click anywhere to continue</div>
      </div>
    </div>
  )
}
