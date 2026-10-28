import React, { useState } from 'react'

const DISMISS_KEY = 'monitorHintDismissed'

interface MonitorHintProps {
  monitoringEnabled: boolean
  onTurnOn: () => void
  onShowHelp: () => void
}

/** One-line pointer to Claude monitoring: how to start it, or that it is listening. */
export function MonitorHint({ monitoringEnabled, onTurnOn, onShowHelp }: MonitorHintProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  if (monitoringEnabled) {
    return (
      <div className="monitor-hint listening">
        <span className="detection-pulse" />
        <span className="monitor-hint-text">
          Listening to Claude Code and your clipboard. Spotted verbs appear here.
        </span>
        <button className="btn-detection-dismiss-all" onClick={onShowHelp}>How it works</button>
      </div>
    )
  }

  if (dismissed) return null

  function dismiss(): void {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="monitor-hint">
      <span className="monitor-hint-text">
        <strong>Auto-catch from Claude Code:</strong> turn on monitoring (○ in the header) and the
        verbs Claude uses in your sessions pop up here for one-click catching.
      </span>
      <button className="btn-detection-catchall" onClick={onTurnOn}>Turn on</button>
      <button className="btn-detection-dismiss-all" onClick={onShowHelp}>How it works</button>
      <button className="btn-detection-dismiss" onClick={dismiss} title="Hide this hint">✕</button>
    </div>
  )
}
