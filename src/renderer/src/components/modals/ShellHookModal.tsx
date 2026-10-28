import React, { useState } from 'react'
import { SHELL_HOOK } from '../../../../shared/shellhook'

interface ShellHookModalProps {
  onEnable: () => Promise<boolean>
  onClose: () => void
}

/** Asks before adding the spinner-verb recorder function to the user's shell profile. */
export function ShellHookModal({ onEnable, onClose }: ShellHookModalProps): React.JSX.Element {
  const [result, setResult] = useState<'added' | 'failed' | null>(null)

  const enable = async (): Promise<void> => {
    setResult((await onEnable()) ? 'added' : 'failed')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-info" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">◉</span>
            <div>
              <div className="modal-title">Catch spinner verbs too?</div>
              <div className="modal-version">one change to your shell profile</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {result === null && (
          <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p>
              The verbs Claude Code shows while it works (<em>Discombobulating…</em>) are only
              drawn in the terminal, never saved to transcripts. To catch them, Verb 'em all can
              add this to your <code>~/.zshrc</code> (and <code>~/.bashrc</code> if you have one):
            </p>
            <pre className="modal-code">{SHELL_HOOK}</pre>
            <p>
              Every <code>claude</code> session you start then runs through a small relay
              (<code>expect</code>). Only while monitoring is on does it write the session's screen
              output to a temporary file in <code>~/.verb-em-all</code>, which the app reads and
              empties every second, so a session you started while the app was closed is caught
              as soon as you open it. Nothing is written while the app is closed. You can remove it
              any time from the <strong>claude</strong> indicator in the header.
            </p>
          </div>
        )}
        {result === 'added' && (
          <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p>
              Added. Open a new terminal tab (or restart VS Code's terminal) and start{' '}
              <code>claude</code>. Sessions that are already open are not recorded.
            </p>
          </div>
        )}
        {result === 'failed' && (
          <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p>
              Your shell profile could not be changed. Check that <code>~/.zshrc</code> is
              writable and try again from the <strong>claude</strong> indicator in the header.
            </p>
          </div>
        )}

        <div className="modal-actions">
          {result === null ? (
            <>
              <button className="btn" onClick={onClose}>Not now</button>
              <button className="btn btn-confirm" onClick={enable}>Add to my shell</button>
            </>
          ) : (
            <button className="btn btn-confirm" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
