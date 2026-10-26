# Running, building and releasing

## Prerequisites

- **Node.js** 20 or later and **npm** 10 or later
- **Git**
- macOS for the DMG build (electron-builder can only sign and build DMGs on a Mac)
- For Windows installers built on a Mac: Wine (`brew install --cask wine-stable`)

---

## Development

```bash
npm install
npm run dev
```

The app opens automatically. Renderer changes (React, CSS) hot-reload; main-process changes
need a restart.

> **"Error: Electron uninstall" on `npm run dev`.** Recent npm versions (11.20+) refuse to run
> package install scripts until you approve them, so the Electron binary is never downloaded.
> Fix it once with:
>
> ```bash
> npm install-scripts approve electron esbuild fsevents electron-winstaller
> npm rebuild electron
> ```
>
> If `node_modules/electron/dist` is still missing afterwards, run the installer directly:
> `node node_modules/electron/install.js`. Approval is per Electron version, so repeat this
> after an Electron upgrade.

---

## Type checking

```bash
npm run typecheck        # main + preload, then renderer
npm run typecheck:node   # main + preload only
npm run typecheck:web    # renderer only
```

There is no test suite yet. `npm run typecheck` and `npm run build` are the verification bar,
plus `npm run package:mac` for anything that touches packaging.

---

## Production build

```bash
npm run build      # → out/main, out/preload, out/renderer
npm run preview    # preview the production renderer bundle
```

---

## Packaging

### macOS (DMG, Apple Silicon + Intel)

```bash
npm run package:mac
```

Produces in `dist-release/`:

```
Verb 'em all-1.0.0-arm64.dmg
Verb 'em all-1.0.0-x64.dmg
```

What happens, driven by `electron-builder.yml`:

- `out/**` is packed into the asar; `resources/icon.png` and `resources/tray-icon.png` are
  copied next to it via `extraResources` (the app reads them with `process.resourcesPath`).
- The app is signed with the hardened runtime and `resources/entitlements.mac.plist`, using
  whatever signing identity electron-builder finds in your keychain. A Developer ID
  Application certificate produces a distributable build; an Apple Development certificate
  (or none at all) produces a build that runs locally but that Gatekeeper rejects on other
  machines until the user right-clicks → Open. To build unsigned on purpose:
  `CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac`.
- Notarization runs only when `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID`
  are set; otherwise electron-builder logs "skipped macOS notarization" and continues.

To notarize locally:

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"   # from appleid.apple.com
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run package:mac
```

### Windows (NSIS installer)

```bash
npm run package:win      # → dist-release/Verb 'em all-1.0.0-x64.exe
```

`resources/icon.ico` is already in the repo. The installer is unsigned; Windows SmartScreen
will warn until the project has a code-signing certificate. The tray menu is macOS-only.

### Both

```bash
npm run package:all
```

---

## Releasing to GitHub

`.github/workflows/release.yml` builds the macOS DMGs and attaches them to a GitHub Release
whenever a `v*` tag is pushed:

```bash
# 1. bump "version" in package.json, commit
# 2. tag and push
git tag v1.0.0
git push origin main --tags
```

The workflow runs typecheck and build, then `electron-builder --mac`, then creates the release
with auto-generated notes (or uploads to it if it already exists). `ci.yml` runs typecheck and
build on every push and pull request.

### Optional: signed and notarized releases

Add these repository secrets and the same workflow produces a notarized build:

| Secret | Value |
|---|---|
| `MAC_CERT_P12` | Base64 of your Developer ID Application `.p12` (`base64 -i cert.p12 \| pbcopy`) |
| `MAC_CERT_PASSWORD` | The `.p12` password |
| `APPLE_ID` | Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for that Apple ID |
| `APPLE_TEAM_ID` | 10-character team ID |

Without them the workflow sets `CSC_IDENTITY_AUTO_DISCOVERY=false` and ships an unsigned DMG;
say so in the release notes so users know to right-click → Open (the README explains it).

---

## App icon

| File | Format | Size | Used for |
|---|---|---|---|
| `resources/icon.png` | PNG | 512×512 (1024 recommended) | macOS icns, dev dock icon |
| `resources/icon.ico` | ICO | 16–256 px | Windows installer and taskbar |
| `resources/tray-icon.png` | PNG, grayscale + alpha | 512×512, rendered at 18 px | macOS tray template image |

To regenerate the ICO from the PNG without ImageMagick: resize with `sips -z N N` for
256/128/64/48/32/16 and pack the PNGs into an ICO (the format accepts PNG frames directly).

---

## Where user data lives

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/verb-em-all/verb-data.json` |
| Windows | `%APPDATA%\verb-em-all\verb-data.json` |
| Linux | `~/.config/verb-em-all/verb-data.json` |

Data survives app updates. To reset, delete `verb-data.json`.

---

## Environment variables

| Variable | Description |
|---|---|
| `ELECTRON_RENDERER_URL` | Set by electron-vite in dev mode; points the window at the Vite dev server |
| `CSC_IDENTITY_AUTO_DISCOVERY` | Set to `false` to skip macOS signing |
| `CSC_LINK`, `CSC_KEY_PASSWORD` | Signing certificate for CI builds |
| `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` | Enable notarization |

No `.env` file is used.
