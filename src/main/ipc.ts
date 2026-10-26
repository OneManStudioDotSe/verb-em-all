import { ipcMain, app, BrowserWindow } from 'electron'
import { store, catchWordInStore, uncatchWordInStore, getVerbagotchiData, saveVerbagotchiCriticalSince, getAccentColor, setAccentColor, getTheme, setTheme, getHideDock, setHideDock } from './store'
import { rebuildTrayMenu } from './tray'
import { startMonitoring, stopMonitoring, clearDetectedWord, getClaudeStatus } from './watcher'

/** macOS only: hide the dock icon so the app lives in the menu bar. */
export function applyDockVisibility(hide: boolean): void {
  if (process.platform !== 'darwin' || !app.dock) return
  if (hide) app.dock.hide()
  else app.dock.show()
}

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

  ipcMain.handle('settings:getHideDock', () => {
    return getHideDock()
  })

  ipcMain.handle('settings:setHideDock', (_event, hide: boolean) => {
    setHideDock(hide)
    applyDockVisibility(hide)
    return hide
  })

  ipcMain.handle('monitor:getClaudeStatus', () => {
    return getClaudeStatus()
  })
}
