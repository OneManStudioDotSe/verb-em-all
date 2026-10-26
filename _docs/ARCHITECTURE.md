# Architecture

## Overview

Verb 'em all is an Electron desktop app built with electron-vite, React and TypeScript. It lets
users track interesting verbs they encounter during development, "catching" them with notes and
timestamps, and wraps that in a small game (the Verbagotchi creature, a star map, sound).

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Desktop shell | Electron 41 | Cross-platform native app |
| Build tool | electron-vite 5 | HMR in dev, handles main/preload/renderer split cleanly |
| UI | React 19 + TypeScript 6 | Component model matches the tab/modal/list structure |
| Persistent storage | electron-store v8 | Atomic JSON writes, correct OS paths, CJS-compatible |
| Packaging | electron-builder 26 | DMG (macOS) and NSIS installer (Windows) |
| Fonts | Space Grotesk + JetBrains Mono | Bundled woff2 in `src/renderer/src/assets/fonts/` |
| Audio | Web Audio API | Procedural; no audio assets |

> **Dependency constraints:** `electron-store` must stay at v8 and `chokidar` at v3. Both are
> CJS-only packages; their newer majors (v9+/v4+) are ESM-only and incompatible with the
> CommonJS main-process bundle. `electron-vite` 5 supports vite 7, not 8.

---

## Process architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│       Main process          │      │      Renderer process         │
│   (Node.js / full access)   │      │   (Chromium, sandboxed)       │
│                             │      │                               │
│  src/main/index.ts          │      │  src/renderer/src/App.tsx     │
│  src/main/ipc.ts            │◄────►│  src/renderer/src/...         │
│  src/main/menu.ts           │ IPC  │                               │
│  src/main/tray.ts           │      │  window.electronAPI           │
│  src/main/watcher.ts        │      └──────────────────────────────┘
│  src/main/detector.ts       │
│  src/main/store.ts          │
│  src/main/resources.ts      │
└─────────────────────────────┘
               ▲
               │ contextBridge
               ▼
┌─────────────────────────────┐
│      Preload script         │
│  src/preload/index.ts       │
└─────────────────────────────┘
```

The renderer runs with `sandbox: true` and `contextIsolation: true`. The **preload script** is
the only bridge: it exposes a typed `window.electronAPI` object via `contextBridge`. Renderer
code never touches `ipcRenderer` directly.

---

## Directory structure

```
verb-em-all/
├── src/
│   ├── main/
│   │   ├── index.ts          # BrowserWindow creation, app lifecycle, hide-to-tray on close
│   │   ├── ipc.ts            # All ipcMain.handle() registrations
│   │   ├── store.ts          # electron-store instance + helpers
│   │   ├── menu.ts           # Native application menu
│   │   ├── tray.ts           # macOS system tray (quick-catch menu)
│   │   ├── watcher.ts        # Claude session file + clipboard monitoring
│   │   ├── detector.ts       # Word detection regex engine
│   │   └── resources.ts      # resourcePath(): dev vs packaged location of runtime assets
│   ├── preload/
│   │   └── index.ts          # contextBridge → window.electronAPI
│   ├── shared/
│   │   └── types.ts          # Interfaces used by both main and renderer
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx              # React entry
│           ├── App.tsx               # Root component, owns all global state
│           ├── env.d.ts              # window.electronAPI type declaration
│           ├── assets/fonts/         # Bundled woff2 fonts (+ README with licenses)
│           ├── styles/global.css     # All styles; design tokens + theme overrides
│           ├── data/
│           │   ├── words.ts          # Hardcoded 187-verb list
│           │   └── palette.ts        # 10 accent colours with shadow pairs
│           ├── hooks/
│           │   ├── useStorage.ts     # IPC storage read/write
│           │   ├── useSearch.ts      # Filtering
│           │   ├── useVerbagotchi.ts # Creature state machine (health, evolution, escape)
│           │   └── useSoundEngine.ts # Web Audio synthesis: hover, catch, ambient
│           └── components/
│               ├── AppMenuButton.tsx     # ≡ header menu
│               ├── CatchCounter.tsx
│               ├── CatchModal.tsx        # Catch dialog with note input
│               ├── CelebrationOverlay.tsx
│               ├── ConstellationView.tsx # "Cosmos" tab: SVG star map, pan/zoom, creature path
│               ├── DetectionPanel.tsx    # Auto-detected verbs
│               ├── EscapeOverlay.tsx     # Verbagotchi escape screen
│               ├── SearchBox.tsx
│               ├── SortBar.tsx
│               ├── TabBar.tsx            # Chase List / Caught / Timeline / ✦ Cosmos
│               ├── TimelineView.tsx      # Day-grouped catch history
│               ├── Verbagotchi.tsx       # ASCII creature panel
│               ├── WordCard.tsx
│               ├── WordList.tsx          # Responsive grid
│               └── modals/
│                   ├── AboutModal.tsx
│                   ├── ColorPickerModal.tsx
│                   ├── HowToUseModal.tsx
│                   ├── ShareCardModal.tsx    # Canvas-rendered PNG
│                   └── StatsModal.tsx
├── resources/
│   ├── icon.png                  # 512×512 app icon (macOS icns is generated from it)
│   ├── icon.ico                  # Windows icon (16–256 px)
│   ├── tray-icon.png             # Monochrome template image for the macOS tray
│   └── entitlements.mac.plist    # Hardened-runtime entitlements for signing
├── _docs/                        # ARCHITECTURE, RUNNING, IDEAS, PROMPT_HISTORY
├── .github/workflows/            # ci.yml (typecheck+build), release.yml (DMG on tag)
├── CLAUDE.md
├── electron.vite.config.ts
├── electron-builder.yml
└── package.json
```

---

## Data flow

### Startup

1. Main process launches, creates the `BrowserWindow`.
2. `registerIpcHandlers()` sets up all channels.
3. `buildAppMenu()` creates the native menu; `createTray()` sets up the macOS tray.
4. If monitoring was enabled in the last session, `startMonitoring()` resumes.
5. Renderer loads, React mounts `<App />`.
6. `useStorage` fetches the full `caught` map; `App` loads accent colour and theme and applies
   them to `<html>` (CSS custom properties and `data-theme`).
7. `App.tsx` derives `WordViewModel[]` by merging the static word list with storage data.

### Catching a verb

```
User clicks "Catch it!"
  → App sets catchingWord → CatchModal renders
  → user enters note, confirms → handleConfirmCatch(note)
  → soundEngine.playCatch(word)                      [if sound enabled]
  → window.electronAPI.catchWord(wordId, note)       [preload]
  → ipcMain 'storage:catchWord' updates store        [main]
      → clears the word from the watcher's "already sent" set
      → rebuilds the tray menu
  → returns updated CaughtRecord → App updates caughtMap
  → word moves to Caught tab, CelebrationOverlay fires
```

### Claude session monitoring

```
Monitoring enabled (header ○ button)
  → startMonitoring(mainWindow)
  → chokidar watches ~/.claude/projects (depth 4) for .jsonl/.json changes
  → on change: readNewBytes() reads only appended bytes
      → extractTextFromJsonlLine() pulls text + thinking blocks
      → detectWords() runs one pre-compiled regex per verb (words ≥ 5 chars)
  → clipboard polled every 2 s: clipboard.readText() → detectWords()
  → new IDs sent once per session via 'words:detected'
  → DetectionPanel shows them for quick catching
```

### Verbagotchi

- Health = 100 − (hours since last catch / 168) × 100. States: thriving, content, hungry,
  sick, critical (≤ 20), dead (0).
- Level by number of caught verbs: hatchling (0), verblet (10), verbion (30), verbzilla (75).
- When the state first becomes critical, `criticalSince` is persisted. If still critical
  24 h later, a random caught verb is uncaught and `EscapeOverlay` is shown.

### Theming

- Accent colour: `ColorPickerModal` → `--accent-y` and `--shadow-y` set on `<html>` →
  `settings:setAccentColor` persists the hex.
- Theme: `AppMenuButton` toggles `dark` ↔ `claude` → `data-theme` on `<html>` →
  `settings:setTheme` persists. A theme is a `[data-theme="…"]` block in `global.css` that
  overrides the tokens.

---

## Data models

Defined in `src/shared/types.ts`:

```typescript
WordItem        // Static: id, word, emoji, description, category, imagePath?
CatchEvent      // { caughtAt: ISO8601, note: string }
CaughtRecord    // { wordId, catchCount, history: CatchEvent[] }
VerbagotchiData // { criticalSince: string | null }
StorageSchema   // { caught, monitoringEnabled, verbagotchi, accentColor, theme }
WordViewModel   // WordItem + isCaught, catchCount, latestCatchDate, history
```

`WordCategory` lists nine categories; the current word list uses seven (`motion`,
`cognition`, `creation`, `technical`, `social`, `cooking`, `speech`). `archaic` and
`destruction` are defined, have constellation zones and sound scales, but contain no words yet.

---

## IPC channels

| Channel | Direction | Returns |
|---|---|---|
| `storage:getAllCaught` | renderer → main | `Record<string, CaughtRecord>` |
| `storage:catchWord` | renderer → main | `CaughtRecord` |
| `storage:uncatchWord` | renderer → main | `void` |
| `app:getVersion` | renderer → main | `string` |
| `monitor:isEnabled` / `monitor:setEnabled` | renderer → main | `boolean` |
| `verbagotchi:getData` | renderer → main | `VerbagotchiData` |
| `verbagotchi:saveCriticalSince` | renderer → main | `void` |
| `settings:getAccentColor` / `settings:setAccentColor` | renderer → main | `string` / `void` |
| `settings:getTheme` / `settings:setTheme` | renderer → main | `string` / `void` |
| `menu:showHowToUse`, `menu:showAbout` | main → renderer | — |
| `verb:caught-from-tray` | main → renderer | `wordId, CaughtRecord` |
| `words:detected` | main → renderer | `string[]` (word IDs) |

---

## Storage

electron-store writes `verb-data.json` to the OS config directory:

- **macOS**: `~/Library/Application Support/verb-em-all/verb-data.json`
- **Windows**: `%APPDATA%\verb-em-all\verb-data.json`
- **Linux**: `~/.config/verb-em-all/verb-data.json`

```json
{
  "caught": { "<wordId>": { "wordId": "", "catchCount": 0, "history": [] } },
  "monitoringEnabled": false,
  "verbagotchi": { "criticalSince": null },
  "accentColor": "#f5e642",
  "theme": "dark"
}
```

Sound on/off is session-only and not persisted.

---

## Runtime assets and packaging

`electron-builder.yml` packages only `out/**` into the asar. Files the running app needs at
runtime (`icon.png` for the dev dock icon, `tray-icon.png`) are listed under `extraResources`
and resolved with `resourcePath()` in `src/main/resources.ts`, which returns
`process.resourcesPath/<file>` in a packaged app and `<repo>/resources/<file>` in development.
The macOS build uses the hardened runtime with `resources/entitlements.mac.plist`; signing and
notarization are described in `RUNNING.md`.

---

## Design system

Neo-brutal aesthetic defined entirely in `global.css` via CSS custom properties:

| Token | Dark default | Usage |
|---|---|---|
| `--accent-y` | `#f5e642` | Primary accent. **User-customisable.** |
| `--accent-c` | `#00f5d4` | Secondary: focus states, monitoring, category pills |
| `--accent-m` | `#f542d4` | Caught state, caught tab, catch counter |
| `--accent-g` | `#42f587` | Success / completion |
| `--shadow-y` | `#5c550d` | Shadow for primary accent elements; updates with `--accent-y` |
| `--bg` / `--surface` | `#0f0f0f` / `#1a1a1a` | Window and card backgrounds |
| `--shadow-offset` | `4px` | Offset-shadow distance |

The `[data-theme="claude"]` block re-defines background, border, accent and text tokens for the
warm Claude theme. Fonts: `--font-display` (Space Grotesk) and `--font-mono` (JetBrains Mono),
loaded via `@font-face` from the bundled files.
