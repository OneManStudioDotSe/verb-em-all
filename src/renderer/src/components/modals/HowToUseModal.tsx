import React from 'react'

interface HowToUseModalProps {
  onClose: () => void
}

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
            The <strong style={{ color: 'var(--accent-y)' }}>Chase List</strong> tab shows all verbs
            that are still out there waiting to be caught. Use the search box to find one by name,
            description, or category.
          </p>
        </div>

        <div className="modal-section">
          <h3>Catching a verb</h3>
          <ul>
            <li>Find the verb you encountered in the Chase List.</li>
            <li>Click <strong style={{ color: 'var(--accent-y)' }}>Catch it!</strong></li>
            <li>Optionally add a note about where you found it.</li>
            <li>Confirm — it's yours forever.</li>
          </ul>
        </div>

        <div className="modal-section">
          <h3>Caught tab</h3>
          <p>
            The <strong style={{ color: 'var(--accent-m)' }}>Caught</strong> tab shows your
            collection. Each card shows when you last caught it and your total catch count. You can
            catch the same verb multiple times — every encounter is worth recording.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn btn-confirm" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  )
}
