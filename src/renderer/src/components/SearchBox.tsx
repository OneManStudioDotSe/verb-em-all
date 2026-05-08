import React from 'react'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ value, onChange }: SearchBoxProps): React.JSX.Element {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search verbs..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')} title="Clear">
          ×
        </button>
      )}
    </div>
  )
}
