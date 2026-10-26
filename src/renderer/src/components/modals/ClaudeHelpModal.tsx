import React, { useState } from 'react'
import type { ClaudeStatus } from '../../../../shared/types'

// Runs `claude` through the app's recorder when it is installed (monitoring on) and the
// session is interactive; otherwise it is plain `claude`.
const SHELL_FUNCTION = `claude() {
  if [ -t 0 ] && [ -t 1 ] && [ -f ~/.verb-em-all/record.exp ]; then
    expect -f ~/.verb-em-all/record.exp claude "$@"
  else
    command claude "$@"
  fi
}`

interface ClaudeHelpModalProps {
  status: ClaudeStatus
  onClose: () => void
  onRecheck: () => void
}

export function ClaudeHelpModal({ status, onClose, onRecheck }: ClaudeHelpModalProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const copyShellFunction = (): void => {
    navigator.clipboard.writeText(SHELL_FUNCTION).then(() => setCopied(true))
  }

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

        <div className="modal-section">
          <h3>Catch spinner verbs</h3>
          <p>
            The verbs Claude Code shows while it works (<em>Discombobulating…</em>) are only
            drawn in the terminal, never saved to transcripts. To catch them, add this to your{' '}
            <code>~/.zshrc</code> or <code>~/.bashrc</code> and open a new terminal tab:
          </p>
          <pre className="modal-code">{SHELL_FUNCTION}</pre>
          <button className="btn" onClick={copyShellFunction}>{copied ? 'Copied' : 'Copy'}</button>
          <p style={{ marginTop: 8 }}>
            It works in iTerm, Terminal and VS Code. While monitoring is on, each{' '}
            <code>claude</code> session's screen output goes to a temporary file in{' '}
            <code>~/.verb-em-all</code> that the app reads and empties every second. Turning
            monitoring off or quitting the app deletes it, and new sessions run unrecorded.
          </p>
          <p style={{ marginTop: 8 }}>
            {status.recording > 0
              ? `Recording ${status.recording} terminal session${status.recording === 1 ? '' : 's'} now.`
              : 'No terminal session is being recorded right now.'}
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onRecheck}>Check again</button>
          <button className="btn btn-confirm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
