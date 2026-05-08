import React, { useMemo } from 'react'
import type { CaughtRecord, WordCategory } from '../../../../shared/types'
import { WORDS } from '../../data/words'

interface StatsModalProps {
  caughtMap: Record<string, CaughtRecord>
  onClose: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CATEGORY_COLORS: Record<WordCategory, string> = {
  motion:      'var(--accent-y)',
  speech:      'var(--accent-c)',
  cognition:   '#b042f5',
  destruction: '#f54242',
  creation:    'var(--accent-g)',
  social:      '#f5a742',
  archaic:     '#888888',
  technical:   'var(--accent-m)',
  cooking:     '#42c5f5'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function StatsModal({ caughtMap, onClose }: StatsModalProps): React.JSX.Element {
  const stats = useMemo(() => {
    const allEvents: { caughtAt: string; wordId: string }[] = []
    for (const [wordId, record] of Object.entries(caughtMap)) {
      for (const event of record.history) {
        allEvents.push({ caughtAt: event.caughtAt, wordId })
      }
    }

    const totalUnique = Object.keys(caughtMap).length
    const totalCatches = allEvents.length
    const completionPct = Math.round((totalUnique / WORDS.length) * 100)

    // Most caught word
    const topEntry = Object.entries(caughtMap).sort((a, b) => b[1].catchCount - a[1].catchCount)[0]
    const mostCaughtWord = topEntry ? WORDS.find((w) => w.id === topEntry[0]) : null
    const mostCaughtCount = topEntry ? topEntry[1].catchCount : 0

    // Category breakdown
    const categoryData: Record<string, { total: number; caught: number }> = {}
    for (const word of WORDS) {
      if (!categoryData[word.category]) categoryData[word.category] = { total: 0, caught: 0 }
      categoryData[word.category].total++
      if (caughtMap[word.id]) categoryData[word.category].caught++
    }

    // Day of week (0 = Sun)
    const dayCount = Array(7).fill(0) as number[]
    for (const event of allEvents) {
      dayCount[new Date(event.caughtAt).getDay()]++
    }
    const maxDay = Math.max(...dayCount, 1)

    // Hour of day
    const hourCount = Array(24).fill(0) as number[]
    for (const event of allEvents) {
      hourCount[new Date(event.caughtAt).getHours()]++
    }
    const maxHour = Math.max(...hourCount, 1)
    const peakHourMax = Math.max(...hourCount)
    const peakHour = peakHourMax > 0 ? hourCount.indexOf(peakHourMax) : null

    // Top 5 most caught
    const top5 = Object.entries(caughtMap)
      .sort((a, b) => b[1].catchCount - a[1].catchCount)
      .slice(0, 5)
      .map(([id, record]) => ({ word: WORDS.find((w) => w.id === id), catchCount: record.catchCount }))
      .filter((x) => x.word)

    // Recent catches (latest 8 events)
    const recent = allEvents
      .sort((a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime())
      .slice(0, 8)
      .map((e) => ({ word: WORDS.find((w) => w.id === e.wordId), caughtAt: e.caughtAt }))
      .filter((x) => x.word)

    return {
      totalUnique, totalCatches, completionPct,
      mostCaughtWord, mostCaughtCount,
      categoryData, dayCount, maxDay,
      hourCount, maxHour, peakHour,
      top5, recent
    }
  }, [caughtMap])

  // Activity heatmap: last 70 days (10 weeks × 7 days)
  // grid-auto-flow: column fills column-by-column — each column = one week
  const heatmapCells = useMemo(() => {
    const catchesByDate: Record<string, number> = {}
    for (const record of Object.values(caughtMap)) {
      for (const event of record.history) {
        const date = event.caughtAt.slice(0, 10)
        catchesByDate[date] = (catchesByDate[date] ?? 0) + 1
      }
    }
    const now = new Date()
    const cells: { date: string; count: number }[] = []
    for (let i = 69; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      cells.push({ date: key, count: catchesByDate[key] ?? 0 })
    }
    const maxCount = Math.max(...cells.map((c) => c.count), 1)
    return { cells, maxCount }
  }, [caughtMap])

  const isEmpty = stats.totalCatches === 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-stats" onClick={(e) => e.stopPropagation()}>
        <div className="modal-info-header">
          <div className="modal-header">
            <span className="modal-emoji">📊</span>
            <div>
              <div className="modal-title">Statistics</div>
              <div className="modal-subtitle">Your verb hunting journey</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {isEmpty ? (
          <div className="stats-empty">No catches yet — go hunt some verbs!</div>
        ) : (
          <>
            {/* ── Totals ── */}
            <div className="stats-totals">
              <div className="stats-metric">
                <div className="stats-metric-value">{stats.totalUnique}</div>
                <div className="stats-metric-label">unique caught</div>
              </div>
              <div className="stats-metric">
                <div className="stats-metric-value">{stats.totalCatches}</div>
                <div className="stats-metric-label">total catches</div>
              </div>
              <div className="stats-metric">
                <div
                  className="stats-metric-value"
                  style={{ color: stats.completionPct === 100 ? 'var(--accent-g)' : 'var(--accent-y)' }}
                >
                  {stats.completionPct}%
                </div>
                <div className="stats-metric-label">complete</div>
              </div>
              {stats.mostCaughtWord && (
                <div className="stats-metric">
                  <div className="stats-metric-value stats-metric-value--word">
                    {stats.mostCaughtWord.emoji} {stats.mostCaughtWord.word}
                  </div>
                  <div className="stats-metric-label">top verb ×{stats.mostCaughtCount}</div>
                </div>
              )}
            </div>

            {/* ── Activity heatmap ── */}
            <div className="modal-section">
              <h3>Activity — last 10 weeks</h3>
              <div className="stats-heatmap">
                {heatmapCells.cells.map((cell) => (
                  <div
                    key={cell.date}
                    className="stats-heatmap-cell"
                    title={`${cell.date}: ${cell.count} catch${cell.count !== 1 ? 'es' : ''}`}
                    style={{
                      background:
                        cell.count === 0
                          ? 'var(--surface-2)'
                          : `rgba(0, 245, 212, ${0.25 + (cell.count / heatmapCells.maxCount) * 0.75})`
                    }}
                  />
                ))}
              </div>
              <div className="stats-heatmap-legend">
                <span>less</span>
                {[0.25, 0.5, 0.75, 1].map((o) => (
                  <div
                    key={o}
                    className="stats-heatmap-cell"
                    style={{ background: `rgba(0, 245, 212, ${o})` }}
                  />
                ))}
                <span>more</span>
              </div>
            </div>

            {/* ── Category breakdown ── */}
            <div className="modal-section">
              <h3>By Category</h3>
              <div className="stats-cat-bars">
                {Object.entries(stats.categoryData)
                  .sort((a, b) => b[1].caught - a[1].caught)
                  .map(([cat, data]) => (
                    <div key={cat} className="stats-cat-row">
                      <div className="stats-cat-label">{cat}</div>
                      <div className="stats-cat-track">
                        <div
                          className="stats-cat-fill"
                          style={{
                            width: `${(data.caught / data.total) * 100}%`,
                            background: CATEGORY_COLORS[cat as WordCategory] ?? 'var(--accent-y)'
                          }}
                        />
                      </div>
                      <div className="stats-cat-count">
                        {data.caught}/{data.total}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* ── Day of week ── */}
            <div className="modal-section">
              <h3>Catches by Day of Week</h3>
              <div className="stats-dow">
                {DAYS.map((day, i) => (
                  <div key={day} className="stats-dow-col">
                    <div className="stats-dow-track">
                      <div
                        className="stats-dow-fill"
                        style={{ height: `${(stats.dayCount[i] / stats.maxDay) * 100}%` }}
                      />
                    </div>
                    <div className="stats-dow-label">{day}</div>
                    <div className="stats-dow-count">{stats.dayCount[i]}</div>
                  </div>
                ))}
                <div className="stats-dow-col stats-dow-col--spacer" />
                <div className="stats-peak">
                  <span className="stats-peak-label">peak hour</span>
                  <span className="stats-peak-value">
                    {stats.peakHour !== null ? `${stats.peakHour.toString().padStart(2, '0')}:00` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Top 5 most caught ── */}
            {stats.top5.length > 1 && (
              <div className="modal-section">
                <h3>Most Caught</h3>
                <div className="stats-top">
                  {stats.top5.map(({ word, catchCount }, i) => (
                    <div key={word!.id} className="stats-top-row">
                      <span className="stats-top-rank">#{i + 1}</span>
                      <span className="stats-top-emoji">{word!.emoji}</span>
                      <span className="stats-top-word">{word!.word}</span>
                      <span className="stats-top-count">×{catchCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recent catches ── */}
            <div className="modal-section">
              <h3>Recent Catches</h3>
              <div className="stats-recent">
                {stats.recent.map((item, i) => (
                  <div key={i} className="stats-recent-row">
                    <span className="stats-recent-emoji">{item.word!.emoji}</span>
                    <span className="stats-recent-word">{item.word!.word}</span>
                    <span className="stats-recent-date">{formatDate(item.caughtAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-confirm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
