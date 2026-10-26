import { app, shell, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { buildAppMenu } from './menu'
import { createTray } from './tray'
import { startMonitoring } from './watcher'
import { store } from './store'
import { resourcePath } from './resources'

// Set by before-quit so the macOS close handler lets the window actually close
let isQuitting = false

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
      sandbox: true,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // On macOS: hide to tray instead of quitting when the window is closed
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
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

app.on('before-quit', () => {
  isQuitting = true
})

app.whenReady().then(() => {
  // Packaged builds get their dock icon from the bundle's icon.icns; this only
  // matters in development where Electron's default icon would show instead.
  if (process.platform === 'darwin' && !app.isPackaged) {
    const dockIcon = nativeImage.createFromPath(resourcePath('icon.png'))
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
