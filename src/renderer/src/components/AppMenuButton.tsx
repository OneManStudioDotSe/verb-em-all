import React, { useState, useEffect, useRef } from 'react'

interface AppMenuButtonProps {
  onShowHowToUse: () => void
  onShowAbout: () => void
  onShowStats: () => void
  onShowShareCard: () => void
  onShowColorPicker: () => void
  onToggleTheme: () => void
  currentTheme: string
  hideDock: boolean
  onToggleHideDock?: () => void // undefined on non-macOS
}

export function AppMenuButton({
  onShowHowToUse,
  onShowAbout,
  onShowStats,
  onShowShareCard,
  onShowColorPicker,
  onToggleTheme,
  currentTheme,
  hideDock,
  onToggleHideDock
}: AppMenuButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  function handleItem(fn: () => void): void {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="app-menu-btn"
        onClick={() => setOpen((v) => !v)}
        title="Menu"
        aria-label="App menu"
      >
        ≡
      </button>

      {open && (
        <div className="app-menu-dropdown">
          <button className="app-menu-item" onClick={() => handleItem(onShowStats)}>
            📊 Statistics
          </button>
          <button className="app-menu-item" onClick={() => handleItem(onShowShareCard)}>
            📤 Share Card
          </button>
          <div className="app-menu-divider" />
          <button className="app-menu-item" onClick={() => handleItem(onShowColorPicker)}>
            🎨 Accent Color
          </button>
          <button className="app-menu-item" onClick={() => handleItem(onToggleTheme)}>
            {currentTheme === 'claude' ? '🌙 Dark Theme' : '☀️ Claude Theme'}
          </button>
          {onToggleHideDock && (
            <button className="app-menu-item" onClick={() => handleItem(onToggleHideDock)}>
              {hideDock ? '🖥 Show in Dock' : '⚡ Menu Bar Only'}
            </button>
          )}
          <div className="app-menu-divider" />
          <button className="app-menu-item" onClick={() => handleItem(onShowHowToUse)}>
            📖 How to Use
          </button>
          <div className="app-menu-divider" />
          <button className="app-menu-item" onClick={() => handleItem(onShowAbout)}>
            ⚡ About
          </button>
        </div>
      )}
    </div>
  )
}
