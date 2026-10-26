export type WordCategory =
  | 'motion'
  | 'speech'
  | 'cognition'
  | 'creation'
  | 'social'
  | 'technical'
  | 'cooking'

export interface WordItem {
  id: string
  word: string
  emoji: string
  description: string
  category: WordCategory
  imagePath?: string
}

export interface CatchEvent {
  caughtAt: string // ISO 8601
  note: string
}

export interface CaughtRecord {
  wordId: string
  catchCount: number
  history: CatchEvent[]
}

export interface VerbagotchiData {
  criticalSince: string | null // ISO 8601 timestamp when health entered critical, or null
}

export interface StorageSchema {
  caught: Record<string, CaughtRecord>
  monitoringEnabled: boolean
  verbagotchi: VerbagotchiData
  accentColor: string
  theme: string
  hideDock: boolean
}

export interface ClaudeStatus {
  found: boolean      // ~/.claude/projects exists and holds at least one transcript
  transcripts: number // .jsonl files seen (capped scan)
  dir: string
  recording: number   // terminal sessions currently recorded for spinner verbs
}

export interface WordViewModel extends WordItem {
  isCaught: boolean
  catchCount: number
  latestCatchDate?: string
  history: CatchEvent[]
}
