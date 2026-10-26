# Verb 'em all — Working guidelines

This file is about **how we work on this project**. For what the code does, see
[README.md](README.md) (features, install), [_docs/ARCHITECTURE.md](_docs/ARCHITECTURE.md)
(processes, IPC, storage, design tokens), [_docs/RUNNING.md](_docs/RUNNING.md) (dev, build,
package, release) and [_docs/IDEAS.md](_docs/IDEAS.md) (feature backlog, with DONE markers).
Keep those files, not this one, updated whenever features, the data layer or the release
process change. Log every user prompt in [_docs/PROMPT_HISTORY.md](_docs/PROMPT_HISTORY.md)
right after it is given (prompts only, not responses).

## Project context (what we build, for whom)

Verb 'em all is an Electron desktop app (macOS first, Windows build available) that turns
vocabulary building into a game: a hardcoded list of 187 unusual verbs that developers
"catch" with a note and timestamp, a Tamagotchi-style creature (the Verbagotchi) that feeds
on catches, optional monitoring of Claude Code session transcripts and the clipboard for
auto-detection, plus statistics, a timeline, a star-map "Cosmos" view, a shareable PNG card,
procedural sound and a macOS tray quick-catch menu.

It is a single-user, offline, local-only app: no accounts, no network calls, no telemetry.
All data is one JSON file written by electron-store. Audience: developers who enjoy words
and want a playful side-app while they work.

## Stack and hard constraints

| Layer | Tech |
|---|---|
| Desktop shell | Electron 45 |
| Build | electron-vite 5 (vite 7) |
| UI | React 19 + TypeScript 6 |
| Storage | electron-store v8 |
| Packaging | electron-builder 26 |

- `electron-store` must stay at v8 and `chokidar` at v3: newer majors are ESM-only and break
  the CommonJS main-process bundle. `electron-vite` 5 supports vite 7, not 8.
- The renderer talks to the main process **only** through `window.electronAPI`
  (`src/preload/index.ts`). Never import `ipcRenderer` in renderer code.
- Word `id`s in `src/renderer/src/data/words.ts` are storage keys. Never change an existing id.
- Fonts are bundled under `src/renderer/src/assets/fonts/`; do not reintroduce CDN links.
- Runtime assets (tray/dock icons) are read via `resourcePath()` in `src/main/resources.ts`
  and shipped through `extraResources` in `electron-builder.yml`. Files outside `out/` are
  not in the packaged app unless listed there.

## Essential commands

```bash
npm run dev          # dev server + Electron with HMR
npm run typecheck    # main/preload + renderer
npm test             # vitest (tests/)
npm run build        # production bundle → out/
npm run package:mac  # DMGs → dist-release/ (see _docs/RUNNING.md for signing)
```

## AI and software development guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from
[Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876).

### 1. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them; don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what's confusing, ask.

### 2. Simplicity first

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked, no abstractions for single-use code, no
  "flexibility" that wasn't requested, no error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments or formatting. Match existing style.
- Remove imports/variables/functions that *your* change made unused. Mention, don't delete,
  pre-existing dead code.
- Every changed line should trace directly to the user's request.

### 4. Goal-driven execution

**Define success criteria. Loop until verified.**

- "Fix the bug" → reproduce it first, then make the reproduction pass.
- For multi-step tasks state a brief plan with a verification per step.

## Ideation loop

When brainstorming or planning, offer alternatives that favour simplicity, creativity and
bold design. State tradeoffs. Push to start small with a solid base and expand iteratively;
do not accept many tasks or one big complicated feature in a single pass. For design work,
ask for screenshots, inspiration links, palettes and font pairings rather than defaulting to
generic patterns. The app's look is **neo-brutal**: dark background, bright accents, thick
borders, offset shadows, no border radius. All tokens live in `global.css`.

## Conventions

- **Naming**: simple, consistent, industry-standard names for files, variables and folders.
  Components are `PascalCase.tsx`, hooks `useX.ts`, main-process modules `lowercase.ts`.
- **Layout**: stand-alone components with minimal inter-dependencies. `App.tsx` owns global
  state; components receive props.
- **Theming**: a single CSS file holds all design tokens; a theme is a `[data-theme]` block
  that overrides them. Accent colour is applied at runtime via CSS custom properties.
- **Code shape**: minimum code that solves the problem; match existing style.

## Guardrails

**Never:**

- Commit on your own. Always let me review the diff and give the go-ahead before `git commit`,
  and never push without separate approval.
- Commit signing certificates, `.p12` files, Apple credentials or API keys. Signing and
  notarization secrets live only in GitHub Actions secrets (see `_docs/RUNNING.md`).
- Add network calls, telemetry or remote fonts. The app is local-only by design.
- Change the storage schema (`StorageSchema` in `src/shared/types.ts`) or an existing word id
  without discussing migration first: user data on disk depends on both.
- Force-push to `main` or rewrite published history without explicit approval.

**Always:**

- Run `npm run typecheck`, `npm test` and `npm run build` before calling anything done. Add a
  test in `tests/` when you touch pure logic (detector, data, helpers).
- Verify UI changes in both the dark and the Claude theme.
- Run `npm run package:mac` when a change touches `electron-builder.yml`, `resources/`,
  main-process asset loading or anything else that only shows up in a packaged app.

## Definition of done

- [ ] `npm run typecheck`, `npm test` and `npm run build` pass.
- [ ] Packaging verified when the change affects packaging (see above).
- [ ] UI changes checked in both themes.
- [ ] Regressions you introduce are fixed without waiting for feedback, without looping.
- [ ] Docs updated: README feature table, `_docs/ARCHITECTURE.md` (IPC, schema, components),
      `_docs/RUNNING.md` (build/release), `_docs/IDEAS.md` DONE markers, `_docs/PROMPT_HISTORY.md`.
- [ ] Suggest a commit/PR title under 70 characters.

## Roles and escalation

**Act without stopping:** bug fixes with a clear reproduction, additive features scoped to a
single component, behaviour-preserving refactors, documentation updates.

**Stop and ask first:** storage schema changes, word-id changes, anything touching the
session/clipboard watcher's scope (privacy-sensitive), Electron major upgrades, adding a new
dependency (check its license first), signing/notarization setup, publishing a release.

## Release and versioning

- `package.json` `version` follows SemVer: patch for fixes, minor for additive features, major
  for breaking storage changes (confirm major bumps with me). Bump it in the PR for the change.
- A release is a git tag `vX.Y.Z` on `main`; `.github/workflows/release.yml` builds the DMGs
  and attaches them to a GitHub Release. Tagging is my call, never yours.
