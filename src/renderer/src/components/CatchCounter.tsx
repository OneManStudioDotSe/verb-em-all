import React from 'react'

interface CatchCounterProps {
  count: number
}

export function CatchCounter({ count }: CatchCounterProps): React.JSX.Element | null {
  if (count === 0) return null
  return (
    <span className="catch-counter">
      <span className="catch-counter-icon">★</span>
      {count}×
    </span>
  )
}
