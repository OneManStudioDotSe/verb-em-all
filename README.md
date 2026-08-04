# Verb 'em All

> Gotta catch 'em all — but for words.

## TL;DR

A "Pokémon-style" Electron desktop app for collecting unusual verbs you encounter while coding. Browse 187 hand-picked verbs, mark them as "caught" with notes, and watch your vocabulary Verbagotchi creature grow. Includes auto-detection in Claude session files and clipboard, stats, a share card, and a macOS tray menu.

---

## What it does

**Verb 'em All** turns vocabulary building into a game. Every time you come across an interesting verb — in docs, code reviews, or Claude conversations — you can "catch" it. Each catch earns points toward levelling up your Verbagotchi creature and expands your personal collection.

### Core loop

1. **Search** — browse or filter 187 unusual verbs (e.g. *obfuscate*, *elide*, *subsume*)
2. **Catch** — mark a verb as caught, optionally adding a note and context
3. **Collect** — build your caught list, track how many times you've seen each word
4. **Watch your creature** — the Verbagotchi hatches, evolves, and escapes if you neglect it

### Features

| Feature | Description |
|---|---|
| **187-verb list** | Hand-curated unusual verbs with emoji, definition, and category |
| **Catch & uncatch** | Catch with optional notes; full catch history preserved |
| **Auto-detection** | Watches `~/.claude/projects/**/*.jsonl` and clipboard every 2s for matching verbs |
| **Detection panel** | Pops up when verbs are spotted in your Claude session — one-click catching |
| **Verbagotchi** | ASCII creature that hatches → evolves → escapes based on your catch activity |
| **Statistics** | Activity heatmap, category breakdown, day-of-week bars, top catches |
| **History timeline** | Chronological view of every catch event, searchable |
| **Share card** | Generates a downloadable 800×440 PNG snapshot of your progress |
| **Accent color** | 10-color neo-brutal palette, persisted per user |
| **macOS tray** | Quick-catch menu without opening the full window |

---

## Screenshots

_Coming soon._

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 41 |
| Build tool | electron-vite 5 |
| UI | React 19 + TypeScript |
| Storage | electron-store v8 (atomic JSON) |
| Packaging | electron-builder 26 |

Design aesthetic: **neo-brutal** — dark background, bright accents, thick borders, offset shadows, no border radius.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### Install & run

```bash
git clone https://github.com/your-username/verb-em-all.git
cd verb-em-all
npm install
npm run dev
```

### Build

```bash
npm run build            # Production bundle → out/
npm run package:mac      # macOS DMG
npm run package:win      # Windows NSIS installer
```

---

## Data storage

Catches are stored in a local JSON file — no server, no account required.

- **macOS**: `~/Library/Application Support/verb-em-all/verb-data.json`
- **Windows**: `%APPDATA%\verb-em-all\verb-data.json`

---

## Verb categories

Verbs are tagged into 8 categories: `motion`, `speech`, `cognition`, `destruction`, `creation`, `social`, `archaic`, `technical`.

---

## License

MIT
