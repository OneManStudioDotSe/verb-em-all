import React, { useMemo } from 'react'
import type { CaughtRecord } from '../../../shared/types'
import { WORDS } from '../data/words'

interface TimelineEntry {
  caughtAt: string
  wordId: string
  note: string
  catchNumber: number
  emoji: string
  word: string
}

interface TimelineViewProps {
  caughtMap: Record<string, CaughtRecord>
  searchQuery: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function TimelineView({ caughtMap, searchQuery }: TimelineViewProps): React.JSX.Element {
  const entries = useMemo(() => {
    const wordMap = Object.fromEntries(WORDS.map((w) => [w.id, w]))
    const all: TimelineEntry[] = []

    for (const [wordId, record] of Object.entries(caughtMap)) {
      const wordItem = wordMap[wordId]
      if (!wordItem) continue
      record.history.forEach((event, idx) => {
        all.push({
          caughtAt: event.caughtAt,
          wordId,
          note: event.note,
          catchNumber: idx + 1,
          emoji: wordItem.emoji,
          word: wordItem.word
        })
      })
    }

    all.sort((a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime())
    return all
  }, [caughtMap])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter((e) => e.word.toLowerCase().includes(q) || e.note.toLowerCase().includes(q))
  }, [entries, searchQuery])

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>()
    for (const entry of filtered) {
      const date = entry.caughtAt.slice(0, 10)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(entry)
    }
    return [...map.entries()]
  }, [filtered])

  if (entries.length === 0) {
    return (
      <div className="timeline-empty">
        No catches yet — go hunt some verbs!
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="timeline-empty">
        No entries match &ldquo;{searchQuery}&rdquo;
      </div>
    )
  }

  return (
    <div className="timeline">
      {groups.map(([date, dayEntries]) => (
        <div key={date} className="timeline-group">
          <div className="timeline-date-header">{formatDateHeader(date)}</div>
          <div className="timeline-entries">
            {dayEntries.map((entry, i) => (
              <div key={`${entry.wordId}-${entry.caughtAt}-${i}`} className="timeline-entry">
                <div className="timeline-time">{formatTime(entry.caughtAt)}</div>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-emoji">{entry.emoji}</span>
                  <span className="timeline-word">{entry.word}</span>
                  {entry.catchNumber > 1 && (
                    <span className="timeline-nth">×{entry.catchNumber}</span>
                  )}
                  {entry.note && (
                    <span className="timeline-note">&ldquo;{entry.note}&rdquo;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
