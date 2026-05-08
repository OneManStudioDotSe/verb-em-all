import React from 'react'

export type TabId = 'notCaught' | 'caught' | 'timeline' | 'constellation'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  caughtCount: number
  notCaughtCount: number
  totalEvents: number
}

export function TabBar({
  activeTab,
  onTabChange,
  caughtCount,
  notCaughtCount,
  totalEvents
}: TabBarProps): React.JSX.Element {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === 'notCaught' ? 'active' : ''}`}
        onClick={() => onTabChange('notCaught')}
      >
        Chase List
        <span className="tab-badge">{notCaughtCount}</span>
      </button>
      <button
        className={`tab-btn caught ${activeTab === 'caught' ? 'active' : ''}`}
        onClick={() => onTabChange('caught')}
      >
        Caught
        <span className="tab-badge">{caughtCount}</span>
      </button>
      <button
        className={`tab-btn timeline ${activeTab === 'timeline' ? 'active' : ''}`}
        onClick={() => onTabChange('timeline')}
      >
        Timeline
        {totalEvents > 0 && <span className="tab-badge">{totalEvents}</span>}
      </button>
      <button
        className={`tab-btn constellation ${activeTab === 'constellation' ? 'active' : ''}`}
        onClick={() => onTabChange('constellation')}
      >
        ✦ Cosmos
      </button>
    </div>
  )
}
