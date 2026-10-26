/// <reference types="vite/client" />

import type { CaughtRecord, VerbagotchiData, ClaudeStatus } from '../../shared/types'

declare global {
  interface Window {
    electronAPI: {
      platform: string
      getAllCaught: () => Promise<Record<string, CaughtRecord>>
      catchWord: (wordId: string, note: string) => Promise<CaughtRecord>
      uncatchWord: (wordId: string) => Promise<void>
      getAppVersion: () => Promise<string>
      onShowHowToUse: (callback: () => void) => void
      onShowAbout: (callback: () => void) => void
      onCaughtFromTray: (callback: (wordId: string, record: CaughtRecord) => void) => void
      isMonitoringEnabled: () => Promise<boolean>
      setMonitoringEnabled: (enabled: boolean) => Promise<boolean>
      onWordsDetected: (callback: (wordIds: string[]) => void) => void
      getClaudeStatus: () => Promise<ClaudeStatus>
      getVerbagotchiData: () => Promise<VerbagotchiData>
      saveVerbagotchiCriticalSince: (ts: string | null) => Promise<void>
      getAccentColor: () => Promise<string>
      setAccentColor: (color: string) => Promise<void>
      getTheme: () => Promise<string>
      setTheme: (t: string) => Promise<void>
      getHideDock: () => Promise<boolean>
      setHideDock: (hide: boolean) => Promise<boolean>
      removeAllListeners: (channel: string) => void
    }
  }
}
