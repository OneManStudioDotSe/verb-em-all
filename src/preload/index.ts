import { contextBridge, ipcRenderer } from 'electron'
import type { CaughtRecord, VerbagotchiData, ClaudeStatus } from '../shared/types'

const electronAPI = {
  // Platform
  platform: process.platform,

  // Storage
  getAllCaught: (): Promise<Record<string, CaughtRecord>> =>
    ipcRenderer.invoke('storage:getAllCaught'),

  catchWord: (wordId: string, note: string): Promise<CaughtRecord> =>
    ipcRenderer.invoke('storage:catchWord', { wordId, note }),

  uncatchWord: (wordId: string): Promise<void> =>
    ipcRenderer.invoke('storage:uncatchWord', wordId),

  // App info
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  // Menu-triggered events (main → renderer)
  onShowHowToUse: (callback: () => void): void => {
    ipcRenderer.on('menu:showHowToUse', callback)
  },

  onShowAbout: (callback: () => void): void => {
    ipcRenderer.on('menu:showAbout', callback)
  },

  // Tray-triggered catch (main → renderer)
  onCaughtFromTray: (callback: (wordId: string, record: CaughtRecord) => void): void => {
    ipcRenderer.on('verb:caught-from-tray', (_event, wordId, record) => callback(wordId, record))
  },

  // Session / clipboard monitoring
  isMonitoringEnabled: (): Promise<boolean> => ipcRenderer.invoke('monitor:isEnabled'),
  setMonitoringEnabled: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('monitor:setEnabled', enabled),
  onWordsDetected: (callback: (wordIds: string[]) => void): void => {
    ipcRenderer.on('words:detected', (_event, ids) => callback(ids))
  },
  getClaudeStatus: (): Promise<ClaudeStatus> => ipcRenderer.invoke('monitor:getClaudeStatus'),
  setShellHook: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('monitor:setShellHook', enabled),

  // Verbagotchi
  getVerbagotchiData: (): Promise<VerbagotchiData> => ipcRenderer.invoke('verbagotchi:getData'),
  saveVerbagotchiCriticalSince: (ts: string | null): Promise<void> =>
    ipcRenderer.invoke('verbagotchi:saveCriticalSince', ts),

  // Accent colour
  getAccentColor: (): Promise<string> => ipcRenderer.invoke('settings:getAccentColor'),
  setAccentColor: (color: string): Promise<void> => ipcRenderer.invoke('settings:setAccentColor', color),

  // Theme
  getTheme: (): Promise<string> => ipcRenderer.invoke('settings:getTheme'),
  setTheme: (t: string): Promise<void> => ipcRenderer.invoke('settings:setTheme', t),

  // Dock icon (macOS)
  getHideDock: (): Promise<boolean> => ipcRenderer.invoke('settings:getHideDock'),
  setHideDock: (hide: boolean): Promise<boolean> => ipcRenderer.invoke('settings:setHideDock', hide),

  // Launch at login
  getOpenAtLogin: (): Promise<boolean> => ipcRenderer.invoke('settings:getOpenAtLogin'),
  setOpenAtLogin: (open: boolean): Promise<boolean> => ipcRenderer.invoke('settings:setOpenAtLogin', open),

  // Cleanup
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
