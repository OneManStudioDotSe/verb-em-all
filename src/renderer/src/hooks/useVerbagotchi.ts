import { useState, useEffect, useRef } from 'react'
import type { CaughtRecord, VerbagotchiData, WordViewModel } from '../../../shared/types'
import { WORDS } from '../data/words'

export type VerbagotchiState = 'thriving' | 'content' | 'hungry' | 'sick' | 'critical' | 'dead'
export type EvolutionLevel = 'hatchling' | 'verblet' | 'verbion' | 'verbzilla'

export interface VerbagotchiStatus {
  health: number
  state: VerbagotchiState
  level: EvolutionLevel
  levelName: string
  caughtCount: number
  animFrame: number
  lastFedAgo: string
  escapedWord: WordViewModel | null
  clearEscapedWord: () => void
}

const HOURS_TO_DEATH = 168 // 7 days

function getEvolutionLevel(count: number): EvolutionLevel {
  if (count >= 75) return 'verbzilla'
  if (count >= 30) return 'verbion'
  if (count >= 10) return 'verblet'
  return 'hatchling'
}

function getState(health: number): VerbagotchiState {
  if (health <= 0) return 'dead'
  if (health <= 20) return 'critical'
  if (health <= 40) return 'sick'
  if (health <= 60) return 'hungry'
  if (health <= 80) return 'content'
  return 'thriving'
}

function formatTimeAgo(ms: number): string {
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(ms / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(ms / 86400000)
  return `${days}d ago`
}

export function useVerbagotchi(
  caughtMap: Record<string, CaughtRecord>,
  uncatchWordFn: (wordId: string) => Promise<void>
): VerbagotchiStatus {
  const [animFrame, setAnimFrame] = useState(0)
  const [criticalSince, setCriticalSince] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [escapedWord, setEscapedWord] = useState<WordViewModel | null>(null)
  const criticalSinceRef = useRef<string | null>(null)
  const escapeCheckedRef = useRef(false)
  const escapeInProgressRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Load persisted criticalSince on mount
  useEffect(() => {
    window.electronAPI.getVerbagotchiData().then((data: VerbagotchiData) => {
      criticalSinceRef.current = data.criticalSince
      setCriticalSince(data.criticalSince)
      setDataLoaded(true)
    })
  }, [])

  // Animation frame toggle
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimFrame((f) => (f === 0 ? 1 : 0))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Derive health from caughtMap
  const caughtCount = Object.keys(caughtMap).length
  const level = getEvolutionLevel(caughtCount)
  const levelNames: Record<EvolutionLevel, string> = {
    hatchling: 'HATCHLING',
    verblet: 'VERBLET',
    verbion: 'VERBION',
    verbzilla: 'VERBZILLA'
  }

  let lastCatchTime = 0
  for (const record of Object.values(caughtMap)) {
    for (const event of record.history) {
      const t = new Date(event.caughtAt).getTime()
      if (t > lastCatchTime) lastCatchTime = t
    }
  }

  const now = Date.now()
  const baseTime = lastCatchTime > 0 ? lastCatchTime : now
  const hoursSinceFeed = (now - baseTime) / 3600000
  const health = Math.max(0, Math.round(100 - (hoursSinceFeed / HOURS_TO_DEATH) * 100))
  const state = getState(health)
  const lastFedAgo = lastCatchTime > 0 ? formatTimeAgo(now - lastCatchTime) : 'never'

  // Persist criticalSince transitions
  useEffect(() => {
    if (!dataLoaded) return

    const isCriticalOrDead = state === 'critical' || state === 'dead'

    if (isCriticalOrDead && !criticalSinceRef.current) {
      const ts = new Date().toISOString()
      criticalSinceRef.current = ts
      setCriticalSince(ts)
      window.electronAPI.saveVerbagotchiCriticalSince(ts)
    } else if (!isCriticalOrDead && criticalSinceRef.current) {
      criticalSinceRef.current = null
      setCriticalSince(null)
      window.electronAPI.saveVerbagotchiCriticalSince(null)
      escapeCheckedRef.current = false
    }
  }, [state, dataLoaded])

  // Escape mechanic: if critical for >24h, uncatch a random word
  useEffect(() => {
    if (!dataLoaded) return
    if (escapeCheckedRef.current) return
    if (escapeInProgressRef.current) return
    if (!criticalSinceRef.current) return
    if (state !== 'critical' && state !== 'dead') return

    const criticalMs = now - new Date(criticalSinceRef.current).getTime()
    if (criticalMs < 24 * 3600000) return

    const caughtIds = Object.keys(caughtMap)
    if (caughtIds.length === 0) return

    escapeCheckedRef.current = true
    escapeInProgressRef.current = true

    const randomId = caughtIds[Math.floor(Math.random() * caughtIds.length)]
    const wordItem = WORDS.find((w) => w.id === randomId)
    if (!wordItem) {
      escapeInProgressRef.current = false
      return
    }

    const record = caughtMap[randomId]
    uncatchWordFn(randomId).then(() => {
      if (!mountedRef.current) return
      const vm: WordViewModel = {
        ...wordItem,
        isCaught: false,
        catchCount: record?.catchCount ?? 1,
        latestCatchDate: record?.history.at(-1)?.caughtAt,
        history: record?.history ?? []
      }
      setEscapedWord(vm)
      criticalSinceRef.current = null
      setCriticalSince(null)
      window.electronAPI.saveVerbagotchiCriticalSince(null)
      escapeInProgressRef.current = false
    })
  }, [criticalSince, state, dataLoaded, caughtMap])

  return {
    health,
    state,
    level,
    levelName: levelNames[level],
    caughtCount,
    animFrame,
    lastFedAgo,
    escapedWord,
    clearEscapedWord: () => setEscapedWord(null)
  }
}
