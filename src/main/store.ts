import Store from 'electron-store'
import type { StorageSchema, CaughtRecord, CatchEvent, VerbagotchiData } from '../shared/types'

export const store = new Store<StorageSchema>({
  name: 'verb-data',
  defaults: {
    caught: {},
    monitoringEnabled: false,
    verbagotchi: { criticalSince: null },
    accentColor: '#f5e642',
    theme: 'dark',
    hideDock: false
  }
})

export function catchWordInStore(wordId: string, note: string): CaughtRecord {
  const caught = store.get('caught')
  const existing: CaughtRecord = caught[wordId] ?? { wordId, catchCount: 0, history: [] }
  const newEvent: CatchEvent = { caughtAt: new Date().toISOString(), note }
  const updated: CaughtRecord = {
    ...existing,
    catchCount: existing.catchCount + 1,
    history: [...existing.history, newEvent]
  }
  store.set(`caught.${wordId}`, updated)
  return updated
}

export function uncatchWordInStore(wordId: string): void {
  const caught = store.get('caught')
  const next = { ...caught }
  delete next[wordId]
  store.set('caught', next)
}

export function getVerbagotchiData(): VerbagotchiData {
  return store.get('verbagotchi')
}

export function saveVerbagotchiCriticalSince(ts: string | null): void {
  store.set('verbagotchi', { criticalSince: ts })
}

export function getAccentColor(): string {
  return store.get('accentColor')
}

export function setAccentColor(color: string): void {
  store.set('accentColor', color)
}

export function getTheme(): string {
  return store.get('theme')
}

export function setTheme(t: string): void {
  store.set('theme', t)
}

export function getHideDock(): boolean {
  return store.get('hideDock')
}

export function setHideDock(hide: boolean): void {
  store.set('hideDock', hide)
}
