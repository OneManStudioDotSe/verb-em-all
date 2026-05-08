# Architecture

## Overview

Verb 'em all is an Electron desktop app built with electron-vite, React, and TypeScript. It lets users track interesting verbs they encounter during development — "catching" them with notes and timestamps.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Desktop shell | Electron 41 | Cross-platform native app |
| Build tool | electron-vite 5 | HMR in dev, handles main/preload/renderer split cleanly |
| UI | React 19 + TypeScript 6 | Component model matches the tab/modal/list structure |
| Persistent storage | electron-store v8 | Atomic JSON writes, correct OS paths, CJS-compatible |
| Packaging | electron-builder | DMG (Mac) and NSIS installer (Windows) |
| Fonts | Space Grotesk + JetBrains Mono | Loaded via Google Fonts CDN in index.html |

> **Dependency constraints:** `electron-store` must stay at v8 and `chokidar` at v3 — both are CJS-only packages; their newer major versions (v9+/v4+) are ESM-only and incompatible with the CommonJS main process bundle.

---

## Process Architecture

Electron runs two OS processes:

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│       Main Process          │      │      Renderer Process         │
│   (Node.js / full access)   │      │    (Chromium / sandboxed)     │
│                             │      │                               │
│  src/main/index.ts          │      │  src/renderer/src/App.tsx     │
│  src/main/ipc.ts            │◄────►│  src/renderer/src/...         │
│  src/main/menu.ts           │ IPC  │                               │
│  src/main/tray.ts           │      │  window.electronAPI           │
│  src/main/watcher.ts        │      └──────────────────────────────┘
│  src/main/detector.ts       │
│  src/main/store.ts          │
│  electron-store             │
└─────────────────────────────┘
               ▲
               │ contextBridge
               ▼
┌─────────────────────────────┐
│      Preload Script         │
│  src/preload/index.ts       │
│  (runs in renderer context  │
│   but with Node access)     │
└─────────────────────────────┘
```

The **preload script** is the secure bridge: it exposes a typed `window.electronAPI` object to the renderer via `contextBridge`, with no direct Node access leaking in.

---

## Directory Structure

```
verb-em-all/
├── src/
│   ├── main/
│   │   ├── index.ts          # BrowserWindow creation, app lifecycle, tray hide-on-close
│   │   ├── ipc.ts            # All ipcMain.handle() registrations
│   │   ├── store.ts          # electron-store instance + helpers (catch, uncatch, verbagotchi, accent)
│   │   ├── menu.ts           # Native application menu
│   │   ├── tray.ts           # macOS system tray (quick-catch menu)
│   │   ├── watcher.ts        # Claude session file + clipboard monitoring
│   │   └── detector.ts       # Word detection regex engine
│   ├── preload/
│   │   └── index.ts          # contextBridge → window.electronAPI
│   ├── shared/
│   │   └── types.ts          # TypeScript interfaces used by both main and renderer
│   └── renderer/
│       ├── index.html        # HTML entry point
│       └── src/
│           ├── main.tsx      # React entry, mounts <App />
│           ├── App.tsx       # Root component, owns all global state
│           ├── env.d.ts      # window.electronAPI type declaration
│           ├── styles/
│           │   └── global.css        # All styles — CSS custom properties for design tokens
│           ├── data/
│           │   ├── words.ts          # Hardcoded 187-verb list
│           │   └── palette.ts        # Accent colour palette (10 entries with shadow pairs)
│           ├── hooks/
│           │   ├── useStorage.ts     # IPC storage read/write
│           │   ├── useSearch.ts      # Filtering logic
│           │   └── useVerbagotchi.ts # Creature state machine (health, evolution, escape)
│           └── components/
│               ├── AppMenuButton.tsx     # Header menu dropdown
│               ├── CatchCounter.tsx      # Catch count badge
│               ├── CatchModal.tsx        # Catch-word dialog with note input
│               ├── CelebrationOverlay.tsx # Full-screen confetti on catch
│               ├── DetectionPanel.tsx    # Auto-detected words from monitoring
│               ├── EscapeOverlay.tsx     # Verbagotchi escape drama screen
│               ├── SearchBox.tsx         # Live search input
│               ├── SortBar.tsx           # Sort controls
│               ├── TabBar.tsx            # Tab switcher (Chase / Caught / Timeline)
│               ├── TimelineView.tsx      # Chronological catch history with date grouping
│               ├── Verbagotchi.tsx       # ASCII art creature panel
│               ├── WordCard.tsx          # Individual verb card
│               ├── WordList.tsx          # Responsive grid of cards
│               └── modals/
│                   ├── AboutModal.tsx        # App info modal
│                   ├── ColorPickerModal.tsx  # Accent colour palette picker
│                   ├── HowToUseModal.tsx     # Tutorial modal
│                   ├── ShareCardModal.tsx    # Canvas-based PNG share card generator
│                   └── StatsModal.tsx        # Statistics dashboard
├── docs/
│   ├── ARCHITECTURE.md       # This file
│   ├── IDEAS.md              # Feature ideas backlog
│   ├── RUNNING.md            # How to run and build
│   └── PROMPT_HISTORY.md     # Development prompt log
├── resources/
│   └── icon.png              # 1024×1024 app icon (required for packaging)
├── CLAUDE.md
├── electron.vite.config.ts
├── electron-builder.yml
└── package.json
```

---

## Data Flow

### Startup
1. Electron main process launches, creates `BrowserWindow`
2. `registerIpcHandlers()` sets up storage channels
3. `buildAppMenu()` creates the native menu; `createTray()` sets up macOS tray
4. If monitoring was enabled in last session, `startMonitoring()` resumes
5. Renderer loads, React mounts `<App />`
6. `useStorage` hook calls `window.electronAPI.getAllCaught()`
7. IPC returns full `caught` map from electron-store
8. Accent colour is loaded from store and applied to CSS custom properties
9. `App.tsx` derives `WordViewModel[]` by merging static word list with storage data

### Catching a Verb
```
User clicks "Catch it!"
  → App.tsx sets catchingWord state
  → CatchModal renders
  → User enters note, clicks Confirm
  → handleConfirmCatch(note)
  → window.electronAPI.catchWord(wordId, note)   [preload]
  → ipcRenderer.invoke('storage:catchWord', ...)  [preload → main]
  → ipcMain.handle reads/updates store            [main]
  → returns updated CaughtRecord
  → App.tsx updates caughtMap state               [no re-fetch needed]
  → React re-renders, word moves to Caught tab
  → CelebrationOverlay fires confetti
```

### Claude Session Monitoring
```
Monitoring enabled
  → startMonitoring(mainWindow)
  → chokidar watches ~/.claude/projects/**/*.jsonl
  → File change: readNewBytes() → extractTextFromJsonlLine() → detectWords()
  → clipboard poll every 2s: clipboard.readText() → detectWords()
  → matched IDs sent via mainWindow.webContents.send('words:detected', ids)
  → preload forwards to renderer
  → DetectionPanel shows word cards for quick catching
```

### Accent Colour Theming
```
User opens Menu → Accent Color
  → ColorPickerModal shows 10-colour palette
  → User clicks swatch
  → document.documentElement.style.setProperty('--accent-y', color)
  → document.documentElement.style.setProperty('--shadow-y', shadow)
  → window.electronAPI.setAccentColor(color) persists to store
  → Entire UI updates via CSS cascade — no re-render needed
```

---

## Data Models

Defined in `src/shared/types.ts` (imported by both main and renderer):

```typescript
WordItem        // Static word definition (id, word, emoji, description, category)
CatchEvent      // Single catch occurrence: { caughtAt: ISO8601, note: string }
CaughtRecord    // Per-word storage: { wordId, catchCount, history: CatchEvent[] }
VerbagotchiData // Creature persistence: { criticalSince: string | null }
StorageSchema   // Root store shape:
                //   { caught, monitoringEnabled, verbagotchi, accentColor }
WordViewModel   // Derived: WordItem + caught state merged for UI rendering
```

---

## IPC Channels

| Channel | Direction | Description | Returns |
|---|---|---|---|
| `storage:getAllCaught` | renderer → main | Full caught map | `Record<string, CaughtRecord>` |
| `storage:catchWord` | renderer → main | Append catch event | `CaughtRecord` |
| `storage:uncatchWord` | renderer → main | Remove word from caught | `void` |
| `app:getVersion` | renderer → main | App version string | `string` |
| `monitor:isEnabled` | renderer → main | Monitoring state | `boolean` |
| `monitor:setEnabled` | renderer → main | Toggle monitoring | `boolean` |
| `verbagotchi:getData` | renderer → main | Creature persistence data | `VerbagotchiData` |
| `verbagotchi:saveCriticalSince` | renderer → main | Persist critical timestamp | `void` |
| `settings:getAccentColor` | renderer → main | Stored accent colour | `string` |
| `settings:setAccentColor` | renderer → main | Persist accent colour | `void` |
| `menu:showHowToUse` | main → renderer | Native menu event | — |
| `menu:showAbout` | main → renderer | Native menu event | — |
| `verb:caught-from-tray` | main → renderer | Tray quick-catch event | `wordId, CaughtRecord` |
| `words:detected` | main → renderer | Session/clipboard detection | `string[]` (word IDs) |

---

## Storage

electron-store writes a JSON file to the OS-appropriate config directory:

- **Mac**: `~/Library/Application Support/verb-em-all/verb-data.json`
- **Windows**: `%APPDATA%\verb-em-all\verb-data.json`
- **Linux**: `~/.config/verb-em-all/verb-data.json`

Schema (current):
```json
{
  "caught": { "<wordId>": { "wordId": "", "catchCount": 0, "history": [] } },
  "monitoringEnabled": false,
  "verbagotchi": { "criticalSince": null },
  "accentColor": "#f5e642"
}
```

---

## Design System

Neo-brutal aesthetic defined entirely in `global.css` via CSS custom properties:

| Token | Default | Usage |
|---|---|---|
| `--accent-y` | `#f5e642` | Primary accent — buttons, active tab, title. **User-customisable.** |
| `--accent-c` | `#00f5d4` | Secondary — focus states, monitoring, category pills |
| `--accent-m` | `#f542d4` | Caught state, caught tab, catch counter |
| `--accent-g` | `#42f587` | Success / completion |
| `--shadow-y` | `#5c550d` | Shadow for primary accent elements. Updates with `--accent-y`. |
| `--bg` | `#0f0f0f` | Window background |
| `--surface` | `#1a1a1a` | Card backgrounds |
| `--shadow-offset` | `4px` | Neo-brutal offset shadow distance |

`--accent-y` and `--shadow-y` are overridden at runtime via `document.documentElement.style.setProperty(...)` when the user changes their accent colour. All other tokens remain static.
