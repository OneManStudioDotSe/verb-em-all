import { Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { store, catchWordInStore } from './store'
import { resourcePath } from './resources'
import { WORDS } from '../renderer/src/data/words'

let tray: Tray | null = null
let _mainWindow: BrowserWindow | null = null

const MAX_TRAY_VERBS = 25

export function createTray(mainWindow: BrowserWindow): void {
  if (process.platform !== 'darwin') return

  _mainWindow = mainWindow

  // Load monochrome tray icon (grayscale PNG); fall back to text title
  let icon = nativeImage.createEmpty()
  try {
    const raw = nativeImage.createFromPath(resourcePath('tray-icon.png'))
    if (!raw.isEmpty()) {
      icon = raw.resize({ width: 18, height: 18 })
      icon.setTemplateImage(true)
    }
  } catch {
    // No icon file yet — will use text title below
  }

  tray = new Tray(icon)
  if (icon.isEmpty()) tray.setTitle('⚡')
  tray.setToolTip("Verb 'em all")

  // Left-click: show/focus the main window
  tray.on('click', () => {
    if (!_mainWindow) return
    if (_mainWindow.isVisible()) {
      _mainWindow.focus()
    } else {
      _mainWindow.show()
    }
  })

  rebuildTrayMenu()
}

export function rebuildTrayMenu(): void {
  if (!tray || process.platform !== 'darwin') return

  const caught = store.get('caught')
  const uncaught = WORDS.filter((w) => !caught[w.id] || caught[w.id].catchCount === 0)
  const shown = uncaught.slice(0, MAX_TRAY_VERBS)
  const remaining = uncaught.length - shown.length

  const verbItems = shown.map((w) => ({
    label: `${w.emoji}  ${w.word}`,
    click: () => {
      const record = catchWordInStore(w.id, '')
      // Notify renderer if the window is open
      if (_mainWindow && !_mainWindow.isDestroyed()) {
        _mainWindow.webContents.send('verb:caught-from-tray', w.id, record)
      }
      rebuildTrayMenu()
    }
  }))

  const overflowItem =
    remaining > 0
      ? [
          {
            label: `… and ${remaining} more — open app for the full list`,
            enabled: false
          }
        ]
      : []

  const catchSection =
    uncaught.length > 0
      ? [
          {
            label: `Quick Catch  (${uncaught.length} remaining)`,
            enabled: false
          },
          ...verbItems,
          ...overflowItem
        ]
      : [{ label: '🏆  All verbs caught!', enabled: false }]

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Verb 'em all",
      click: () => {
        if (!_mainWindow) return
        _mainWindow.show()
        _mainWindow.focus()
      }
    },
    { type: 'separator' },
    ...catchSection,
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])

  tray.setContextMenu(menu)
}
