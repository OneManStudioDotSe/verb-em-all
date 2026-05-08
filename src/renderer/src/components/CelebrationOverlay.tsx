import React, { useState, useEffect, useMemo, useRef } from 'react'
import type { WordViewModel } from '../../../shared/types'

interface CelebrationOverlayProps {
  word: WordViewModel
  onDismiss: () => void
}

const CONFETTI_COLORS = [
  '#f5e642', '#00f5d4', '#f542d4', '#42f587',
  '#f5a742', '#4287f5', '#f54242', '#ffffff'
]

interface ConfettiPiece {
  id: number
  left: string
  color: string
  size: number
  duration: number
  delay: number
  shape: 'square' | 'circle' | 'rect'
}

const AUTO_DISMISS_MS = 3000
const FADE_MS = 500

export function CelebrationOverlay({ word, onDismiss }: CelebrationOverlayProps): React.JSX.Element {
  const [fading, setFading] = useState(false)
  const fadingRef = useRef(false)

  function dismiss(): void {
    if (fadingRef.current) return
    fadingRef.current = true
    setFading(true)
    setTimeout(onDismiss, FADE_MS)
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [])

  const confetti: ConfettiPiece[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      duration: 1.8 + Math.random() * 2,
      delay: Math.random() * 0.8,
      shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)]
    }))
  }, [])

  return (
    <div className={`celebration-overlay${fading ? ' fading' : ''}`} onClick={dismiss}>
      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.shape === 'rect' ? p.size * 2 : p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '0',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}

      {/* Central celebration content */}
      <div className="celebration-content" onClick={(e) => e.stopPropagation()}>
        <div className="celebration-label">You caught it!</div>
        <div className="celebration-emoji">{word.emoji}</div>
        <div className="celebration-word">{word.word}</div>
        <div className="celebration-caught-text">★ Caught! ★</div>
        <div className="celebration-dismiss">click anywhere to continue</div>
      </div>
    </div>
  )
}
