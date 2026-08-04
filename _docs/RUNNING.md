# Running & Building

## Prerequisites

- **Node.js** 18 or later ([nodejs.org](https://nodejs.org))
- **npm** 9 or later (bundled with Node.js)
- **Git**

For **Windows builds on Mac** (cross-compilation): install Wine via Homebrew:
```bash
brew install --cask wine-stable
```

---

## Development

```bash
# Install dependencies (first time only)
npm install

# Start in development mode (hot-reload)
npm run dev
```

The app opens automatically. Changes to renderer code (React components, CSS) reload instantly via HMR. Changes to main process code require a restart.

---

## Type Checking

```bash
# Check all TypeScript (main + renderer)
npm run typecheck

# Check only main process / preload
npm run typecheck:node

# Check only renderer
npm run typecheck:web
```

---

## Production Build

Compiles TypeScript and bundles everything without packaging:

```bash
npm run build
```

Output goes to `out/`. Preview the production renderer build:

```bash
npm run preview
```

---

## Packaging

### Mac (DMG — Intel + Apple Silicon)

```bash
npm run package:mac
```

Produces:
```
dist-release/
  Verb 'em all-1.0.0-arm64.dmg   (Apple Silicon)
  Verb 'em all-1.0.0.dmg          (Intel)
```

**Requirements:**
- Must run on macOS
- `resources/icon.png` must exist (1024×1024 px, PNG)
- For notarization (distributing outside App Store), you need an Apple Developer account and code signing setup in `electron-builder.yml`

### Windows (NSIS Installer)

```bash
npm run package:win
```

Produces:
```
dist-release/
  Verb 'em all Setup 1.0.0.exe
```

**Requirements:**
- `resources/icon.ico` must exist (multi-size ICO file)
- Can be built on macOS (requires Wine, see Prerequisites above)

### Both platforms

```bash
npm run package:all
```

---

## App Icon

Before packaging, add your icon files to `resources/`:

| File | Format | Size | Used for |
|---|---|---|---|
| `resources/icon.png` | PNG | 1024×1024 | Mac DMG |
| `resources/icon.ico` | ICO | Multi-size (16/32/48/256) | Windows installer + taskbar |

To convert a PNG to ICO on Mac:
```bash
brew install imagemagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

---

## Where User Data Lives

| Platform | Path |
|---|---|
| Mac | `~/Library/Application Support/verb-em-all/verb-data.json` |
| Windows | `%APPDATA%\verb-em-all\verb-data.json` |
| Linux | `~/.config/verb-em-all/verb-data.json` |

Data survives app updates. To reset, delete `verb-data.json`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `ELECTRON_RENDERER_URL` | Set automatically by electron-vite in dev mode — points renderer at Vite dev server |

No `.env` file needed.
