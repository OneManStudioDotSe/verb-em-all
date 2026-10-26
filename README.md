# Verb 'em All

> Gotta catch 'em all — but for words.

A Pokémon-style desktop app for collecting unusual verbs you meet while coding. Browse 187
hand-picked verbs, catch them with a note, and watch your Verbagotchi creature grow. Optional
auto-detection reads your Claude Code session transcripts and clipboard so verbs find you.
Everything stays on your machine: no account, no network, no telemetry.

---

## Download

**macOS (Apple Silicon and Intel):** grab the latest DMG from the
[Releases page](https://github.com/OneManStudioDotSe/verb-em-all/releases), open it and drag
*Verb 'em all* to Applications.

If the build is not notarized (releases list whether it is), macOS will say the app "cannot be
verified" on first launch. Right-click the app, choose **Open**, then **Open** again; or run:

```bash
xattr -dr com.apple.quarantine "/Applications/Verb 'em all.app"
```

**Windows:** no prebuilt installer yet. Build one yourself with `npm run package:win` (see
[_docs/RUNNING.md](_docs/RUNNING.md)). The tray quick-catch menu is macOS-only; everything
else works on Windows.

**From source:**

```bash
git clone https://github.com/OneManStudioDotSe/verb-em-all.git
cd verb-em-all
npm install
npm run dev          # run it
npm run package:mac  # or build your own DMG into dist-release/
```

---

## What it does

### Core loop

1. **Chase** — browse or live-search the Chase List of verbs still out there.
2. **Catch** — mark a verb as caught, optionally with a note about where you found it.
3. **Collect** — the Caught tab tracks every verb and how many times you have met it.
4. **Feed the creature** — the Verbagotchi hatches, evolves and escapes if you neglect it.

### Features

| Feature | Description |
|---|---|
| **187-verb list** | Hand-curated verbs with emoji, one-line definition and category |
| **Catch & release** | Catch with an optional note; every catch is kept in a per-verb history. Release a verb from the Caught tab |
| **Live search & sort** | Filter by name, definition or category; sort by title, category or catch count |
| **Celebration** | Full-screen confetti on every catch |
| **Auto-detection** | Watches `~/.claude/projects/**/*.jsonl` and the clipboard (every 2 s) for matching verbs |
| **Detection panel** | Spotted verbs appear above the list for one-click catching, catch-all or dismiss |
| **Verbagotchi** | ASCII creature with four evolution stages. Health drains over seven days without a catch; after 24 h in critical condition it escapes with one of your verbs |
| **Timeline** | Day-grouped diary of every catch and note, searchable |
| **Cosmos** | Zoomable, draggable star map of all verbs grouped into named constellations by category; caught verbs shine and the creature roams between them |
| **Statistics** | 70-day activity heatmap, category breakdown, day-of-week and hour bars, top catches, recent activity |
| **Share card** | Downloadable 800×440 PNG snapshot of your progress, rendered on a canvas |
| **Sound** | Optional procedural audio (Web Audio, no sound files): a hover tone and a catch "spell" unique to each verb, plus per-category ambient drones in Cosmos |
| **Accent colour** | 10-colour neo-brutal palette, persisted |
| **Themes** | Default dark neo-brutal theme and a warm "Claude" theme |
| **macOS tray** | Quick-catch menu for uncaught verbs without opening the window; closing the window hides it to the tray |

### Verb categories

`motion`, `cognition`, `creation`, `technical`, `social`, `cooking`, `speech`. Each category has
its own constellation in Cosmos and its own musical scale in the sound engine.

---

## Privacy

Catches are stored in a single local JSON file:

- **macOS**: `~/Library/Application Support/verb-em-all/verb-data.json`
- **Windows**: `%APPDATA%\verb-em-all\verb-data.json`
- **Linux**: `~/.config/verb-em-all/verb-data.json`

Auto-detection is off by default. When you turn it on (the `○` button in the header) the app
reads newly appended lines of your Claude Code transcripts and polls the clipboard, matches
them against the verb list locally, and discards the text. Nothing is sent anywhere. Fonts are
bundled, so the app never contacts a CDN.

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 41 |
| Build tool | electron-vite 5 |
| UI | React 19 + TypeScript 6 |
| Storage | electron-store v8 (atomic JSON) |
| Packaging | electron-builder 26, GitHub Actions release workflow |

Design: **neo-brutal** — dark background, bright accents, thick borders, offset shadows, no
border radius. Fonts: Space Grotesk and JetBrains Mono, bundled.

More in [_docs/ARCHITECTURE.md](_docs/ARCHITECTURE.md), [_docs/RUNNING.md](_docs/RUNNING.md)
and the ideas backlog in [_docs/IDEAS.md](_docs/IDEAS.md).

---

## License

Apache License 2.0. See [LICENSE](LICENSE). Bundled fonts are under the SIL Open Font License.
