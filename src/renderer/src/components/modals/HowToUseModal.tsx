import React from 'react'

interface HowToUseModalProps {
  onClose: () => void
}

const Y = { color: 'var(--accent-y)' }
const M = { color: 'var(--accent-m)' }
const C = { color: 'var(--accent-c)' }

export function HowToUseModal({ onClose }: HowToUseModalProps): React.JSX.Element {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-info" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">📖</span>
            <div className="modal-title">How to Use</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h3>The idea</h3>
          <p>
            Verb 'em all is your personal vocabulary Pokédex. Whenever you encounter an interesting
            verb in the wild — in docs, articles, code comments, anywhere — come here and catch it.
          </p>
        </div>

        <div className="modal-section">
          <h3>Chase List</h3>
          <p>
            The <strong style={Y}>Chase List</strong> tab shows every verb still out there. Search
            by name, description or category, and sort by title or category.
          </p>
        </div>

        <div className="modal-section">
          <h3>Catching a verb</h3>
          <ul>
            <li>Find the verb you encountered and click <strong style={Y}>Catch it!</strong></li>
            <li>Optionally add a note about where you found it.</li>
            <li>Confirm and enjoy the celebration.</li>
            <li>Catch the same verb again any time — every encounter is recorded.</li>
          </ul>
        </div>

        <div className="modal-section">
          <h3>Caught, Timeline and Cosmos</h3>
          <ul>
            <li>
              <strong style={M}>Caught</strong> is your collection, sortable by title, category or
              number of catches. You can release a verb from here if you change your mind.
            </li>
            <li>
              <strong style={Y}>Timeline</strong> is a day-by-day diary of every catch and note.
            </li>
            <li>
              <strong style={C}>✦ Cosmos</strong> draws all verbs as a star map grouped by category.
              Caught verbs shine; drag to pan, scroll to zoom, click a star to catch it.
            </li>
          </ul>
        </div>

        <div className="modal-section">
          <h3>Verbagotchi</h3>
          <p>
            The creature in the corner feeds on catches. It evolves as your collection grows and gets
            hungry if you stop catching: a week without a catch and it is gone, and after a day in
            critical condition it escapes with one of your verbs. Keep it fed.
          </p>
        </div>

        <div className="modal-section">
          <h3>Auto-detection</h3>
          <p>
            Click <strong style={C}>○</strong> in the header to monitor your Claude Code session
            transcripts and clipboard. Matching verbs show up in a panel above the list for one-click
            catching. Everything is read locally; nothing leaves your computer. The{' '}
            <strong style={C}>claude</strong> pill next to it is green when transcripts are found;
            click it for help if it is red, or to set up catching the spinner verbs Claude Code
            shows in your terminal.
          </p>
        </div>

        <div className="modal-section">
          <h3>Menu, sound and tray</h3>
          <ul>
            <li><strong style={Y}>≡</strong> opens Statistics, the Share Card, Accent Color and Theme.</li>
            <li><strong style={Y}>♪</strong> turns on procedural sound: each verb has its own signature.</li>
            <li>On macOS, the ⚡ tray icon offers a Quick Catch menu without opening the window.</li>
            <li>Prefer a menu-bar-only app? Choose <strong style={Y}>Menu Bar Only</strong> in ≡ to hide the Dock icon.</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button className="btn btn-confirm" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  )
}
