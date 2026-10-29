# Architecture

## Overview

Verb 'em all is an Electron desktop app built with electron-vite, React and TypeScript. It lets
users track interesting verbs they encounter during development, "catching" them with notes and
timestamps, and wraps that in a small game (the Verbagotchi creature, a star map, sound).

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Desktop shell | Electron 45 | Cross-platform native app |
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
│   │   ├── transcripts.ts    # Recently active transcripts + tail reads (startup scan)
│   │   ├── recorder.ts       # The expect relay script for spinner verbs (tested in tests/recorder.test.ts)
│   │   └── resources.ts      # resourcePath(): dev vs packaged location of runtime assets
│   ├── preload/
│   │   └── index.ts          # contextBridge → window.electronAPI
│   ├── shared/
│   │   ├── types.ts          # Interfaces used by both main and renderer
│   │   └── shellhook.ts      # `claude` recorder function + add/remove for shell profiles
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx              # React entry
│           ├── App.tsx               # Root component, owns all global state
│           ├── env.d.ts              # window.electronAPI type declaration
│           ├── assets/fonts/         # Bundled woff2 fonts (+ README with licenses)
│           ├── styles/global.css     # All styles; design tokens + theme overrides
│           ├── data/
│           │   ├── words.ts          # Hardcoded 193-verb list
│           │   ├── palette.ts        # 10 accent colours with shadow pairs
│           │   └── sortWords.ts      # Pure sort for the word grid (title, category, catches)
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
│               ├── ConstellationView.tsx # "Cosmos" tab: static SVG star map, pan/zoom, twinkle + creature overlay
│               ├── DetectionPanel.tsx    # Auto-detected verbs
│               ├── MonitorHint.tsx       # How to turn on monitoring, or "listening" while nothing is spotted
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
│                   ├── ClaudeHelpModal.tsx   # Claude Code setup help + shell function on/off
│                   ├── ColorPickerModal.tsx
│                   ├── HowToUseModal.tsx
│                   ├── ShareCardModal.tsx    # Canvas-rendered PNG
│                   ├── ShellHookModal.tsx    # Consent to add the spinner-verb shell function
│                   └── StatsModal.tsx
├── resources/
│   ├── icon.png                  # 512×512 app icon (macOS icns is generated from it)
│   ├── icon.ico                  # Windows icon (16–256 px)
│   ├── tray-icon.png             # Monochrome template image for the macOS tray
│   └── entitlements.mac.plist    # Hardened-runtime entitlements for signing
├── tests/                        # vitest: detector, transcripts, recorder, shellhook, words, palette, sortWords
├── _docs/                        # ARCHITECTURE, RUNNING, IDEAS, PROMPT_HISTORY, screenshots/ (README tour)
├── .github/workflows/            # ci.yml (typecheck+test+build), release.yml (DMG on tag)
├── CLAUDE.md
├── electron.vite.config.ts
├── electron-builder.yml
└── package.json
```

---

## Data flow

### Startup

1. Main process launches. `applyDockVisibility()` hides the Dock icon if `hideDock` is set and
   `refreshRelay()` rewrites or removes the spinner-verb relay script.
2. The `BrowserWindow` is created; `registerIpcHandlers()` sets up all channels.
3. `buildAppMenu()` creates the native menu; `createTray()` sets up the macOS tray.
4. If monitoring was enabled in the last session, `startMonitoring()` resumes.
5. Renderer loads, React mounts `<App />`.
6. `useStorage` fetches the full `caught` map; `App` loads accent colour and theme and applies
   them to `<html>` (CSS custom properties and `data-theme`), fetches the Claude status and,
   when monitoring is on, calls `monitor:scanRecent` to pick up sessions already running.
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
  → renderer calls 'monitor:scanRecent' (on launch if enabled, and when turned on):
      scanRecentSessions() reads the last 256 KB of transcripts modified in the past hour,
      returns the verb IDs directly (at launch the renderer may not be listening for events
      yet) and moves those files' read positions to their end
  → chokidar watches ~/.claude/projects (depth 4) for .jsonl/.json changes
  → on change: readNewBytes() reads only appended bytes
      → extractTextFromJsonlLine() pulls text + thinking blocks
      → detectWords() runs one pre-compiled regex per verb (words ≥ 5 chars)
  → clipboard polled every 2 s: clipboard.readText() → detectWords()
  → writes ~/.verb-em-all/record.exp ("recording on" marker), polls ~/.verb-em-all/tty/*.log every 1 s:
      read + truncate each log → detectSpinnerVerbs() strips ANSI codes, matches "Verb…"
  → new IDs sent once per session via 'words:detected'
  → DetectionPanel shows them for quick catching (★ Catch / Catch all new for new verbs,
    outlined ↻ Again / Catch all again for verbs already caught)
```

Spinner verbs ("Whirring…") are only drawn in the terminal, never written to transcripts. The
user opts in to a `claude` shell function (`SHELL_HOOK` in `src/shared/shellhook.ts`) that runs
interactive sessions through `expect -f ~/.verb-em-all/relay.exp claude …`. `refreshRelay()`
writes `relay.exp` while the current function is installed (on launch and in `setShellHook()`)
and deletes it otherwise, so the relay is in place even while the app is closed. Only the
current block counts as installed (`hasCurrentShellHook()`): an older one is offered again and
replaced. Turning monitoring on without it opens `ShellHookModal`; on consent,
`monitor:setShellHook` → `setShellHook()` appends the block (between `# >>> verb-em-all >>>`
markers) to `~/.zshrc` and `~/.bashrc` (whichever exist; `~/.zshrc` if neither), and removes
exactly that block when turned off from `ClaudeHelpModal`. macOS only (`/usr/bin/expect`).
The script relays the session through a pseudo-terminal, forwards window resizes (macOS
`script` does not, which garbles the TUI) and appends the output to `tty/<pid>.log`, deleting
it on exit. Logs are opened in append mode, so the app can truncate them mid-session.
`stopMonitoring()` (also called on quit) deletes `record.exp` and the `tty/` folder. Each
relay checks every second whether `record.exp` exists: it stops logging when it is gone and
reopens its log when it is back, so sessions started or left open while the app was closed
are caught once it opens, and nothing is recorded while it is off. `record.exp` holds the same
script so shells still on the previous function (which ran `record.exp` directly) keep working.

The header's **Claude indicator** calls `monitor:getClaudeStatus` on load and every 30 s. It
scans `~/.claude/projects/*/` for `.jsonl` transcripts (stops at 50) and shows green when any
exist; red opens `ClaudeHelpModal` with setup instructions and a re-check button. The modal
also adds or removes the spinner-verb shell function.

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
StorageSchema   // { caught, monitoringEnabled, verbagotchi, accentColor, theme, hideDock }
ClaudeStatus    // { found, transcripts, dir, recording, shellHook } — ~/.claude/projects scan, recorded terminal sessions, shell function installed
WordViewModel   // WordItem + isCaught, catchCount, latestCatchDate, history
```

`WordCategory` has seven values: `motion`, `cognition`, `creation`, `technical`, `social`,
`cooking`, `speech`. Adding a category means adding a word, a constellation zone in
`ConstellationView.tsx`, a scale/waveform/ambient case in `useSoundEngine.ts` and a colour in
`StatsModal.tsx`; the `Record<WordCategory, …>` maps make the compiler point at each spot.

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
| `settings:getHideDock` / `settings:setHideDock` | renderer → main | `boolean` (macOS: hides/shows the Dock icon) |
| `settings:getOpenAtLogin` / `settings:setOpenAtLogin` | renderer → main | `boolean` (OS login item via `app.setLoginItemSettings`; not stored in electron-store) |
| `monitor:scanRecent` | renderer → main | `string[]` (verb IDs from transcripts active in the last hour; empty when monitoring is off) |
| `monitor:getClaudeStatus` | renderer → main | `ClaudeStatus` (`found`, `transcripts`, `dir`, `recording`, `shellHook`) |
| `monitor:setShellHook` | renderer → main | `boolean` (adds/removes the `claude` function in shell profiles; returns whether it is installed) |
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
  "theme": "dark",
  "hideDock": false
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

### Animation and CPU

While any animation runs, Chromium renders a frame on every display refresh (120 Hz on
ProMotion screens), and a changed pixel inside an SVG re-rasterises the whole SVG, blur
filters included. A blinking dot alone cost ~15% of a core; Cosmos idled at ~65%. Rules:

- No looping CSS animation in a resting state. Loops are reserved for alarms (critical
  Verbagotchi, detection-panel pulse), and `:root[data-focused='false']` pauses every
  animation while the window is in the background (`App.tsx` sets the attribute).
- Cosmos draws a static SVG. The twinkle glows (four phase layers) and the roaming creature
  live in an HTML overlay mapped to viewBox units, stepped by one 10 Hz timer that stops when
  the window loses focus. Changing their opacity/transform only recomposites.
- No `will-change: transform` on anything that gets zoomed: it freezes the raster at the
  starting scale, so zooming in looks blurry.

Measured with `ps` CPU time across all app processes, idle, focused: Chase List ~2% of a
core, Cosmos ~8%; Cosmos in the background ~2%.
