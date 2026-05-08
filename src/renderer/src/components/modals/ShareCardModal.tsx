import React, { useEffect, useRef, useState } from 'react'
import type { CaughtRecord } from '../../../../shared/types'
import { WORDS } from '../../data/words'
import { findAccentEntry } from '../../data/palette'

interface ShareCardModalProps {
  caughtMap: Record<string, CaughtRecord>
  accentColor: string
  onClose: () => void
}

const CARD_W = 800
const CARD_H = 440
const SHADOW = 8

function getEvolutionLabel(count: number): string {
  if (count >= 75) return 'VERBZILLA'
  if (count >= 30) return 'VERBION'
  if (count >= 10) return 'VERBLET'
  return 'HATCHLING'
}

async function drawCard(
  canvas: HTMLCanvasElement,
  caughtCount: number,
  totalWords: number,
  top3: Array<{ word: string; emoji: string; catchCount: number; description: string }>,
  levelLabel: string,
  accent: string,
  shadow: string
): Promise<void> {
  await document.fonts.ready

  const ctx = canvas.getContext('2d')!
  const CW = CARD_W
  const CH = CARD_H

  // ── Neo-brutal shadow layer ──────────────────────────────────────────
  ctx.fillStyle = shadow
  ctx.fillRect(SHADOW, SHADOW, CW, CH)

  // ── Card background ──────────────────────────────────────────────────
  ctx.fillStyle = '#0f0f0f'
  ctx.fillRect(0, 0, CW, CH)

  // ── Card border ──────────────────────────────────────────────────────
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.strokeRect(1.5, 1.5, CW - 3, CH - 3)

  // ── Vertical divider ─────────────────────────────────────────────────
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(390, 44)
  ctx.lineTo(390, CH - 44)
  ctx.stroke()

  // ══════════════════════════════════════════════════════════════════════
  // LEFT COLUMN  (x: 36 → 370)
  // ══════════════════════════════════════════════════════════════════════

  // App title
  ctx.fillStyle = accent
  ctx.font = 'bold 34px "JetBrains Mono", monospace'
  ctx.fillText("verb'em all", 36, 60)

  // Thin horizontal rule
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(36, 76)
  ctx.lineTo(370, 76)
  ctx.stroke()

  // Big caught count
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 86px "Space Grotesk", sans-serif'
  ctx.fillText(String(caughtCount), 36, 178)

  // "/ N verbs caught"
  ctx.fillStyle = '#666666'
  ctx.font = '15px "JetBrains Mono", monospace'
  ctx.fillText(`/ ${totalWords} verbs caught`, 36, 200)

  // Progress bar
  const BAR_X = 36
  const BAR_Y = 222
  const BAR_W = 284
  const BAR_H = 10
  const pct = totalWords > 0 ? caughtCount / totalWords : 0

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H)
  if (pct > 0) {
    ctx.fillStyle = accent
    ctx.fillRect(BAR_X, BAR_Y, Math.round(BAR_W * pct), BAR_H)
  }
  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H)

  // Completion %
  ctx.fillStyle = accent
  ctx.font = 'bold 11px "JetBrains Mono", monospace'
  ctx.fillText(`${Math.round(pct * 100)}% COMPLETE`, BAR_X, BAR_Y + 24)

  // Verbagotchi level badge (pill)
  const BADGE_X = 36
  const BADGE_Y = 280
  const BADGE_W = 170
  const BADGE_H = 24
  ctx.fillStyle = accent
  ctx.fillRect(BADGE_X, BADGE_Y, BADGE_W, BADGE_H)
  ctx.fillStyle = '#0f0f0f'
  ctx.font = 'bold 10px "JetBrains Mono", monospace'
  const badgeText = `VERBAGOTCHI: ${levelLabel}`
  ctx.fillText(badgeText, BADGE_X + 8, BADGE_Y + 16)

  // ══════════════════════════════════════════════════════════════════════
  // RIGHT COLUMN  (x: 406 → 764)
  // ══════════════════════════════════════════════════════════════════════

  ctx.fillStyle = '#444444'
  ctx.font = 'bold 9px "JetBrains Mono", monospace'
  ctx.fillText('TOP CATCHES', 406, 60)

  const ROW_H = 82
  const ROW_START_Y = 76

  top3.forEach((item, i) => {
    const y = ROW_START_Y + i * ROW_H

    // Row separator
    if (i > 0) {
      ctx.strokeStyle = '#1e1e1e'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(406, y)
      ctx.lineTo(764, y)
      ctx.stroke()
    }

    // Rank number
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 11px "JetBrains Mono", monospace'
    ctx.fillText(`#${i + 1}`, 406, y + 26)

    // Emoji
    ctx.font = '26px serif'
    ctx.fillText(item.emoji, 424, y + 30)

    // Word name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px "JetBrains Mono", monospace'
    const wordTrunc = item.word.length > 18 ? item.word.slice(0, 17) + '…' : item.word
    ctx.fillText(wordTrunc, 460, y + 24)

    // Description
    ctx.fillStyle = '#555555'
    ctx.font = 'italic 10px "Space Grotesk", sans-serif'
    const descTrunc = item.description.length > 42 ? item.description.slice(0, 41) + '…' : item.description
    ctx.fillText(descTrunc, 460, y + 40)

    // Catch count badge
    ctx.fillStyle = accent
    ctx.font = 'bold 11px "JetBrains Mono", monospace'
    ctx.fillText(`×${item.catchCount}`, 460, y + 60)
  })

  if (top3.length === 0) {
    ctx.fillStyle = '#333333'
    ctx.font = '13px "JetBrains Mono", monospace'
    ctx.fillText('No catches yet.', 406, 120)
  }

  // ══════════════════════════════════════════════════════════════════════
  // BOTTOM BAR
  // ══════════════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#1e1e1e'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(36, CH - 44)
  ctx.lineTo(CW - 36, CH - 44)
  ctx.stroke()

  ctx.fillStyle = '#333333'
  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.fillText('verb\'em all  •  catch interesting verbs in the wild', 36, CH - 22)

  const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  ctx.textAlign = 'right'
  ctx.fillText(dateStr, CW - 36, CH - 22)
  ctx.textAlign = 'left'
}

export function ShareCardModal({ caughtMap, accentColor, onClose }: ShareCardModalProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  const caughtCount = Object.keys(caughtMap).length
  const totalWords = WORDS.length
  const levelLabel = getEvolutionLabel(caughtCount)
  const { shadow } = findAccentEntry(accentColor)

  const top3 = Object.entries(caughtMap)
    .sort((a, b) => b[1].catchCount - a[1].catchCount)
    .slice(0, 3)
    .map(([id, record]) => {
      const w = WORDS.find((x) => x.id === id)
      return w ? { word: w.word, emoji: w.emoji, catchCount: record.catchCount, description: w.description } : null
    })
    .filter(Boolean) as Array<{ word: string; emoji: string; catchCount: number; description: string }>

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCard(canvas, caughtCount, totalWords, top3, levelLabel, accentColor, shadow).then(() =>
      setReady(true)
    )
  }, [accentColor])

  function handleDownload(): void {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `verb-em-all-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-share" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">📤</span>
            <div>
              <div className="modal-title">Share Card</div>
              <div className="modal-subtitle">Download your progress as a PNG</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="share-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={CARD_W + SHADOW}
            height={CARD_H + SHADOW}
            className={`share-canvas${ready ? ' ready' : ''}`}
          />
          {!ready && <div className="share-canvas-loading">Rendering…</div>}
        </div>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>Close</button>
          <button className="btn btn-confirm" onClick={handleDownload} disabled={!ready}>
            ↓ Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
