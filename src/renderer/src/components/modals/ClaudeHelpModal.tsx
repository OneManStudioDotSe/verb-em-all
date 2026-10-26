import React from 'react'
import type { ClaudeStatus } from '../../../../shared/types'

interface ClaudeHelpModalProps {
  status: ClaudeStatus
  onClose: () => void
  onRecheck: () => void
}

export function ClaudeHelpModal({ status, onClose, onRecheck }: ClaudeHelpModalProps): React.JSX.Element {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-info" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">{status.found ? '◉' : '○'}</span>
            <div>
              <div className="modal-title">Claude Code detection</div>
              <div className="modal-version">
                {status.found
                  ? `${status.transcripts}${status.transcripts >= 50 ? '+' : ''} transcripts found`
                  : 'no transcripts found'}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {status.found ? (
          <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p>
              Claude Code transcripts are visible, so monitoring can pick verbs out of your
              sessions. Turn it on with the <strong style={{ color: 'var(--accent-c)' }}>○</strong>{' '}
              button in the header.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
              <h3>What the app looks for</h3>
              <p>
                Claude Code writes every session to a transcript file under
              </p>
              <pre className="modal-code">{status.dir}</pre>
              <p>That folder is empty or missing on this machine, so there is nothing to watch yet.</p>
            </div>

            <div className="modal-section">
              <h3>How to fix it</h3>
              <ul>
                <li>
                  Install Claude Code if you have not: <code>npm install -g @anthropic-ai/claude-code</code>,
                  then run <code>claude</code> once inside any project folder.
                </li>
                <li>Finish or continue a session. The transcript appears as soon as Claude replies.</li>
                <li>
                  Using the desktop app or an IDE extension instead of the terminal? Make sure
                  they are signed in with the same user account; they share the same folder.
                </li>
                <li>Click <strong>Check again</strong> below. The indicator turns on when a transcript is found.</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                Clipboard monitoring works regardless: copy any text and matching verbs are
                spotted.
              </p>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onRecheck}>Check again</button>
          <button className="btn btn-confirm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
