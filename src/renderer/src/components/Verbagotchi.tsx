import React, { useState } from 'react'
import type { CaughtRecord } from '../../../shared/types'
import { useVerbagotchi, type VerbagotchiState, type EvolutionLevel } from '../hooks/useVerbagotchi'
import { EscapeOverlay } from './EscapeOverlay'

interface VerbagotchiProps {
  caughtMap: Record<string, CaughtRecord>
  onUncatch: (wordId: string) => Promise<void>
}

// ── ASCII art ──────────────────────────────────────────────────────────────
// Each entry: [frameA, frameB] for animation; sick / critical use overrides

const EYES: Record<VerbagotchiState, [string, string]> = {
  thriving: ['^.^', '^-^'],
  content:  ['-.-', '-.~'],
  hungry:   ['o.o', 'O.O'],
  sick:     ['x.x', 'x_x'],
  critical: ['X_X', '>.<'],
  dead:     ['@_@', '@_@']
}

function buildArt(level: EvolutionLevel, state: VerbagotchiState, frame: number): string {
  const [eyeA, eyeB] = EYES[state]
  const eye = frame === 0 ? eyeA : eyeB

  switch (level) {
    case 'hatchling':
      return frame === 0
        ? `   .--.\n  (${eye})\n  /):(\ \n  " " "`
        : `   .--.\n  (${eye})\n  \\):(/\n  " " "`

    case 'verblet':
      return frame === 0
        ? `  \\(${eye})/\n   (| |)\n   /| |\\`
        : `  \\(${eye})/\n   (| |)\n   // \\\\`

    case 'verbion':
      return frame === 0
        ? `  ≋(${eye})≋\n  {[###]}\n  /  |  \\`
        : `  ≋(${eye})≋\n  {[###]}\n  \\\\  |  //`

    case 'verbzilla':
      return frame === 0
        ? ` ☆\\(${eye})/☆\n  \\/###\\/\n   ≋≋|≋≋`
        : ` ★\\(${eye})/★\n  \\/###\\/\n   ≋≋≋≋≋`
  }
}

// ── Health bar ─────────────────────────────────────────────────────────────

function healthColor(health: number): string {
  if (health > 60) return 'var(--accent-c)'
  if (health > 30) return 'var(--accent-y)'
  return '#ff4444'
}

// ── State labels ────────────────────────────────────────────────────────────

const STATE_LABEL: Record<VerbagotchiState, string> = {
  thriving: '★ thriving',
  content:  '· content',
  hungry:   '~ hungry',
  sick:     '✗ sick',
  critical: '⚠ CRITICAL',
  dead:     '💀 GONE'
}

const LEVEL_EMOJI: Record<EvolutionLevel, string> = {
  hatchling: '🥚',
  verblet:   '🐣',
  verbion:   '🐉',
  verbzilla: '🌋'
}

// ── Component ────────────────────────────────────────────────────────────────

export function Verbagotchi({ caughtMap, onUncatch }: VerbagotchiProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const { health, state, level, levelName, caughtCount, animFrame, lastFedAgo, escapedWord, clearEscapedWord } =
    useVerbagotchi(caughtMap, onUncatch)

  const art = buildArt(level, state, animFrame)
  const barColor = healthColor(health)
  const isCritical = state === 'critical' || state === 'dead'

  return (
    <>
      <div className={`verbagotchi-panel verbagotchi--${state}${collapsed ? ' verbagotchi-panel--collapsed' : ''}`}>
        {/* Collapsed bar */}
        {collapsed ? (
          <div className="verbagotchi-collapsed" onClick={() => setCollapsed(false)} title="Expand Verbagotchi">
            <span className="verbagotchi-collapsed-emoji">{LEVEL_EMOJI[level]}</span>
            <span className="verbagotchi-collapsed-name">{levelName}</span>
            <span className="verbagotchi-collapsed-sep">·</span>
            <div className="verbagotchi-health-bar-wrap verbagotchi-health-bar-wrap--sm">
              <div
                className="verbagotchi-health-bar-fill"
                style={{ width: `${health}%`, background: barColor }}
              />
            </div>
            <span className="verbagotchi-collapsed-pct">{health}%</span>
            <button
              className="verbagotchi-chevron"
              onClick={(e) => { e.stopPropagation(); setCollapsed(false) }}
              title="Expand"
            >
              ▼
            </button>
          </div>
        ) : (
          /* Expanded panel */
          <div className="verbagotchi-expanded">
            <div className="verbagotchi-top-row">
              <div className="verbagotchi-level-badge">
                {LEVEL_EMOJI[level]} {levelName}
              </div>
              <button
                className="verbagotchi-chevron"
                onClick={() => setCollapsed(true)}
                title="Collapse"
              >
                ▲
              </button>
            </div>

            <div className="verbagotchi-stage">
              <pre className={`verbagotchi-ascii verbagotchi-ascii--${level}${isCritical ? ' verbagotchi-ascii--critical' : ''}`}>
                {art}
              </pre>
            </div>

            <div className={`verbagotchi-state-label verbagotchi-state--${state}`}>
              {STATE_LABEL[state]}
            </div>

            <div className="verbagotchi-health-block">
              <div className="verbagotchi-health-head">
                <span className="verbagotchi-health-label">Health</span>
                <span className="verbagotchi-health-pct" style={{ color: barColor }}>{health}%</span>
              </div>
              <div className="verbagotchi-health-bar-wrap">
                <div
                  className="verbagotchi-health-bar-fill"
                  style={{ width: `${health}%`, background: barColor }}
                />
              </div>
            </div>

            <div className="verbagotchi-stats">
              <div className="verbagotchi-stat">
                <span className="verbagotchi-stat-label">Caught</span>
                <span className="verbagotchi-stat-value">{caughtCount}</span>
              </div>
              <div className="verbagotchi-stat verbagotchi-stat--right">
                <span className="verbagotchi-stat-label">Last fed</span>
                <span className="verbagotchi-stat-value">{lastFedAgo}</span>
              </div>
            </div>

            {isCritical && (
              <div className="verbagotchi-warning">
                ⚠ Feed your creature! Catch verbs before it escapes.
              </div>
            )}
          </div>
        )}
      </div>

      {escapedWord && (
        <EscapeOverlay word={escapedWord} onDismiss={clearEscapedWord} />
      )}
    </>
  )
}
