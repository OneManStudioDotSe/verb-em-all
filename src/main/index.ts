import { app, shell, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { buildAppMenu } from './menu'
import { createTray } from './tray'
import { startMonitoring } from './watcher'
import { store } from './store'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 700,
    minHeight: 500,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // On macOS: hide to tray instead of quitting when the window is closed
  mainWindow.on('close', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (process.platform === 'darwin' && !(app as any).isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Flag so the tray "Quit" item can fully exit
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      // already typed in @types/node but we need it on app
    }
  }
}
// Attach isQuitting to app object for the close handler above
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(app as any).isQuitting = false

app.on('before-quit', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(app as any).isQuitting = true
})

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(join(app.getAppPath(), 'resources/icon.png'))
    if (!dockIcon.isEmpty()) app.dock?.setIcon(dockIcon)
  }

  const mainWindow = createWindow()
  registerIpcHandlers(mainWindow)
  buildAppMenu()
  createTray(mainWindow)
  // Resume monitoring if it was enabled in the last session
  if (store.get('monitoringEnabled')) {
    startMonitoring(mainWindow)
  }

  app.on('activate', () => {
    // macOS: clicking dock icon re-shows the window
    mainWindow.show()
    mainWindow.focus()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
