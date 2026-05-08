import React, { useState, useEffect } from 'react'

interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps): React.JSX.Element {
  const [version, setVersion] = useState('...')

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion)
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-info" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">⚡</span>
            <div>
              <div className="modal-title">Verb 'em all</div>
              <div className="modal-version">v{version}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <p>
            A personal vocabulary Pokédex for developers. Catch interesting verbs in the wild,
            record where you found them, and build your collection.
          </p>
        </div>

        <div className="modal-section">
          <h3>Developer</h3>
          <p>Your Name</p>
          <p style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>your.website</span>
          </p>
        </div>

        <div className="modal-section">
          <h3>Built with</h3>
          <ul>
            <li>Electron + React + TypeScript</li>
            <li>electron-vite for fast dev builds</li>
            <li>electron-store for persistent storage</li>
            <li>Neo-brutal design aesthetic</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button className="btn btn-confirm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
