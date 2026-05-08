import { ipcMain, app, BrowserWindow } from 'electron'
import { store, catchWordInStore, uncatchWordInStore, getVerbagotchiData, saveVerbagotchiCriticalSince, getAccentColor, setAccentColor, getTheme, setTheme } from './store'
import { rebuildTrayMenu } from './tray'
import { startMonitoring, stopMonitoring, clearDetectedWord } from './watcher'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('storage:getAllCaught', () => {
    return store.get('caught')
  })

  ipcMain.handle(
    'storage:catchWord',
    (_event, { wordId, note }: { wordId: string; note: string }) => {
      const updated = catchWordInStore(wordId, note)
      clearDetectedWord(wordId) // allow re-detection after catching
      rebuildTrayMenu()
      return updated
    }
  )

  ipcMain.handle('storage:uncatchWord', (_event, wordId: string) => {
    uncatchWordInStore(wordId)
    rebuildTrayMenu()
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('monitor:isEnabled', () => {
    return store.get('monitoringEnabled')
  })

  ipcMain.handle('monitor:setEnabled', (_event, enabled: boolean) => {
    store.set('monitoringEnabled', enabled)
    if (enabled) {
      startMonitoring(mainWindow)
    } else {
      stopMonitoring()
    }
    return enabled
  })

  ipcMain.handle('verbagotchi:getData', () => {
    return getVerbagotchiData()
  })

  ipcMain.handle('verbagotchi:saveCriticalSince', (_event, ts: string | null) => {
    saveVerbagotchiCriticalSince(ts)
  })

  ipcMain.handle('settings:getAccentColor', () => {
    return getAccentColor()
  })

  ipcMain.handle('settings:setAccentColor', (_event, color: string) => {
    setAccentColor(color)
  })

  ipcMain.handle('settings:getTheme', () => {
    return getTheme()
  })

  ipcMain.handle('settings:setTheme', (_event, t: string) => {
    setTheme(t)
  })
}
