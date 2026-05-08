# Verb 'em all — Claude Code Context

## What this project is

A "Catch 'em all" style Electron desktop app for tracking interesting verbs encountered during development. Users search a hardcoded list of 187 unusual verbs, mark them as "caught" with notes and timestamps, and build their personal vocabulary collection. Features a Verbagotchi creature, session monitoring, statistics, and a shareable progress card.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop shell | Electron 41 |
| Build tool | electron-vite 5 |
| UI | React 19 + TypeScript 6 |
| Storage | electron-store v8 (CJS, atomic JSON) |
| Packaging | electron-builder 26 |

> **Dependency constraints:** `electron-store` must stay at v8 and `chokidar` at v3 — both are CJS-only packages; their newer major versions are ESM-only and incompatible with the CommonJS main process bundle. `electron-vite` v5 supports vite ≤7, NOT vite 8.

---

## Essential Commands

```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build → out/
npm run typecheck        # Check all TypeScript
npm run package:mac      # Build Mac DMG
npm run package:win      # Build Windows NSIS installer
```

---

## Project Structure (critical files)

```
src/
  main/
    index.ts        # BrowserWindow setup, app lifecycle, tray hide-on-close
    ipc.ts          # All IPC handlers
    store.ts        # electron-store instance + helpers
    menu.ts         # Native app menu
    tray.ts         # macOS system tray (quick-catch menu)
    watcher.ts      # Claude session file + clipboard monitoring
    detector.ts     # Word detection regex engine
  preload/
    index.ts        # contextBridge → window.electronAPI
  shared/
    types.ts        # TypeScript interfaces (WordItem, CaughtRecord, etc.)
  renderer/src/
    App.tsx         # Root component, owns all global state
    data/
      words.ts      # Hardcoded 187-verb list — edit here to add/remove verbs
      palette.ts    # Accent colour palette (10 entries with shadow pairs)
    hooks/
      useStorage.ts       # IPC read/write abstraction
      useSearch.ts        # Filtering logic
      useVerbagotchi.ts   # Creature state machine (health, evolution, escape)
    components/           # UI components
    styles/
      global.css    # All styles — CSS custom properties for design tokens
```

---

## IPC Contract

The renderer communicates with the main process exclusively through `window.electronAPI` (defined in `src/preload/index.ts`):

| Method | Direction | Description |
|---|---|---|
| `getAllCaught()` | renderer → main | Returns full caught map from store |
| `catchWord(wordId, note)` | renderer → main | Appends catch event, returns updated record |
| `uncatchWord(wordId)` | renderer → main | Removes word from caught map |
| `getAppVersion()` | renderer → main | Returns app version string |
| `isMonitoringEnabled()` | renderer → main | Returns monitoring state |
| `setMonitoringEnabled(enabled)` | renderer → main | Toggles Claude session monitoring |
| `getVerbagotchiData()` | renderer → main | Returns `{ criticalSince }` persistence data |
| `saveVerbagotchiCriticalSince(ts)` | renderer → main | Persists critical timestamp (or null) |
| `getAccentColor()` | renderer → main | Returns stored accent colour hex string |
| `setAccentColor(color)` | renderer → main | Persists accent colour choice |
| `onShowHowToUse(cb)` | main → renderer | Fires when Help > How to Use clicked |
| `onShowAbout(cb)` | main → renderer | Fires when Help > About clicked |
| `onWordsDetected(cb)` | main → renderer | Fires with detected word IDs from watcher |
| `removeAllListeners(channel)` | renderer | Removes all listeners for a channel |

**Never** use `ipcRenderer` directly in renderer code — always go through `window.electronAPI`.

---

## Data Model

```typescript
// src/shared/types.ts
WordItem          // Static: id, word, emoji, description, category
CatchEvent        // { caughtAt: ISO8601, note: string }
CaughtRecord      // { wordId, catchCount, history: CatchEvent[] }
VerbagotchiData   // { criticalSince: string | null }
StorageSchema     // { caught, monitoringEnabled, verbagotchi, accentColor }
WordViewModel     // WordItem + isCaught, catchCount, latestCatchDate, history
```

Storage file location:
- **Mac**: `~/Library/Application Support/verb-em-all/verb-data.json`
- **Windows**: `%APPDATA%\verb-em-all\verb-data.json`

---

## Design System

Neo-brutal aesthetic — dark background, bright accents, thick borders, offset shadows, zero border-radius. All tokens in `global.css`:

```css
--accent-y: #f5e642   /* yellow — primary, user-customisable */
--accent-c: #00f5d4   /* cyan — secondary, focus, monitoring */
--accent-m: #f542d4   /* magenta — caught state */
--accent-g: #42f587   /* green — success */
--shadow-y: #5c550d   /* shadow for primary accent, updates with --accent-y */
--bg:       #0f0f0f
--surface:  #1a1a1a
```

`--accent-y` and `--shadow-y` are overridden at runtime via `document.documentElement.style.setProperty()` when the user changes their accent colour. The 10-colour palette is defined in `src/renderer/src/data/palette.ts`.

Fonts: Space Grotesk (display) + JetBrains Mono (mono) — loaded from Google Fonts in `index.html`.

---

## Key Features

- **187-verb list** with emoji, description, and category per verb
- **Catch + Uncatch**: catch with notes, uncatch from Caught tab or Verbagotchi panel
- **Claude session monitoring**: watches `~/.claude/projects/**/*.jsonl` + clipboard every 2s for verb matches; shows DetectionPanel for quick catching
- **Verbagotchi**: ASCII art creature; health decays over 7 days without catches; 4 evolution levels (hatchling/verblet/verbion/verbzilla); escape mechanic uncatches a random word after 24h critical
- **Statistics dashboard**: heatmap, category breakdown, day-of-week bars, top catches, recent activity
- **Share Card**: Canvas-rendered 800×440 PNG showing progress, top 3 catches, and Verbagotchi level; downloadable
- **Accent Color picker**: 10-colour palette, persisted to store, applied via CSS custom properties
- **History Timeline**: chronological view of all catch events with date grouping, searchable
- **macOS tray**: quick-catch menu without opening the full window

---

## Adding Verbs

Edit `src/renderer/src/data/words.ts`. Each entry needs:

```typescript
{
  id: 'unique-id',        // used as storage key — never change after first run
  word: 'theword',
  emoji: '🔤',
  description: 'One sentence definition',
  category: 'motion' | 'speech' | 'cognition' | 'destruction' | 'creation' | 'social' | 'archaic' | 'technical'
}
```

**Never change an existing `id`** — it's the key in the persistent storage. If you need to rename a word, keep the original `id`.

---

## Docs

- `docs/ARCHITECTURE.md` — full architecture, data flow, IPC table, storage schema
- `docs/RUNNING.md` — prerequisites, build commands, icon requirements
- `docs/IDEAS.md` — feature ideas backlog
- `docs/PROMPT_HISTORY.md` — log of all user prompts during development

---

## Known Constraints

- Word list is hardcoded (no UI to add custom verbs)
- No word deletion from storage (once caught, always in history)
- Google Fonts require an internet connection in dev; consider self-hosting for offline use
- Share Card canvas font rendering requires Google Fonts to be loaded (`document.fonts.ready`)
