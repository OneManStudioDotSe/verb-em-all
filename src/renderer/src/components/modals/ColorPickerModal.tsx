import React from 'react'
import { ACCENT_PALETTE } from '../../data/palette'

interface ColorPickerModalProps {
  currentColor: string
  onSelect: (color: string, shadow: string) => void
  onClose: () => void
}

export function ColorPickerModal({ currentColor, onSelect, onClose }: ColorPickerModalProps): React.JSX.Element {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-color-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">🎨</span>
            <div>
              <div className="modal-title">Accent Color</div>
              <div className="modal-subtitle">Pick your primary highlight color</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="color-palette">
          {ACCENT_PALETTE.map((entry) => (
            <button
              key={entry.color}
              className={`color-swatch${entry.color === currentColor ? ' selected' : ''}`}
              style={{
                background: entry.color,
                boxShadow: `3px 3px 0 ${entry.shadow}`
              }}
              title={entry.label}
              onClick={() => {
                onSelect(entry.color, entry.shadow)
                onClose()
              }}
            >
              {entry.color === currentColor && <span className="color-swatch-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="color-palette-labels">
          {ACCENT_PALETTE.map((entry) => (
            <span
              key={entry.color}
              className="color-label"
              style={{ color: entry.color === currentColor ? entry.color : 'var(--text-muted)' }}
            >
              {entry.label}
            </span>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
