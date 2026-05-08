import React from 'react'
import type { TabId } from './TabBar'

export type SortField = 'title' | 'category' | 'catches'
export type SortDir = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  dir: SortDir
}

interface SortBarProps {
  config: SortConfig
  activeTab: TabId
  onChange: (config: SortConfig) => void
}

interface SortOption {
  field: SortField
  label: string
  tabs: TabId[]
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'title', label: 'Title', tabs: ['notCaught', 'caught'] },
  { field: 'category', label: 'Type', tabs: ['notCaught', 'caught'] },
  { field: 'catches', label: 'Catches', tabs: ['caught'] }
]

export function SortBar({ config, activeTab, onChange }: SortBarProps): React.JSX.Element {
  const available = SORT_OPTIONS.filter((o) => o.tabs.includes(activeTab))

  function handleClick(field: SortField): void {
    if (config.field === field) {
      onChange({ field, dir: config.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ field, dir: field === 'catches' ? 'desc' : 'asc' })
    }
  }

  return (
    <div className="sort-bar">
      <span className="sort-label">Sort:</span>
      {available.map((opt) => {
        const isActive = config.field === opt.field
        const arrow = isActive ? (config.dir === 'asc' ? ' ↑' : ' ↓') : ''
        return (
          <button
            key={opt.field}
            className={`sort-btn${isActive ? ' active' : ''}`}
            onClick={() => handleClick(opt.field)}
          >
            {opt.label}
            {isActive && <span className="sort-dir">{arrow}</span>}
          </button>
        )
      })}
    </div>
  )
}
