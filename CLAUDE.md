# Space Lists - Working guidelines

This file is about **how we work on this project**, not what the code does. For
architecture, data models, screens, and current feature status, see
[FEATURES.md](FEATURES.md), [ROADMAP.md](ROADMAP.md), and [GOING_LIVE.md](GOING_LIVE.md) —
keep those files, not this one, updated whenever the data layer, screens, or release
readiness change.

## AI and software development guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Project context (what we build, for whom)

Space Lists is a Flutter mobile app (iOS/Android) for organizing personal interests —
movies, series, music, books, comics, stocks, crypto, locations, notes, beers, and wines —
into lists with a "Space" visual theme (glassmorphism, animated starfield, dark/light
Nebula theming). It's aimed at individuals who want a single, richer alternative to generic
note/list apps, with category-specific tracking (watch status, reading progress, tasting
notes, etc.) instead of plain checkboxes.

Storage is offline-first: Isar for local persistence, syncing to Firestore under anonymous
Firebase Auth. See `GOING_LIVE.md` for the current state of that sync/persistence layer
(several "done" features are UI-only and don't yet persist) and `FEATURES.md`/`ROADMAP.md`
for what's shipped vs. planned.

## Ideation loop

When brainstorming ideas or going through the planning phase, always offer alternatives that are focusing of simplicity, creativity and bold design choices. Help me understand the tradeoffs of the ideas I present. Bounce ideas back and forth with me until we reach consensus about the way forward. Always state the tradeoffs and always push me to start small, with a solid base of code and features and then expand to add more features, abilities and improvements. Do not let me push for too many tasks at the same time or for big, complicated features at a single pass, but instead push and insist on building iterationally and little by little until we have reached the desired final feature we are working on.

If an idea is genuinely unclear, ask (don't guess) and then continue to implement it. At the end, verify that it matches the initial and decided scope and then verify it (see Definition of Done).

Regarding the design of what we are working on, always ask me for screenshots, screen grabs, links with inspiration, color palettes, font combinations, links with similar ideas and in general push me to provide input for the design rather than use generic AI designs and patterns.

## Conventions (stack / naming / layout)

**Naming**:
We are aiming for simplified, consistent and industry-established way of naming files, variables, classes and folders.
The project uses a system of components and modules that are consistently named and themed via a single file that contains the related variables, definitions and classes. This makes the complete change of the UI a matter of changing a single file, thus easy to experiment with different design languages, add new components and modules and mix-and-match them at the project.

**Layout**: The project uses a components-based approach to the items related with the layout of the project. These components are stand-alone, isolated in terms of the functionality they offer and as minimal as possible when it comes to inter-dependencies with other components.

**Code shape**: minimum code that solves the problem — no speculative abstractions, no config/flexibility that wasn't asked for. Touch only what the task requires; match existing style even where you'd personally do it differently. If you notice unrelated dead code or drift, mention it rather than fixing it unprompted.

## Guardrails

These are the guardrails that should always be respected in the project.

**Never:**

- Commit code on your own — always let me review the diff and give the go-ahead before
  you run `git commit`, and never push without separate approval either.
- Commit `.env`, `*.db`, service-account/Admin SDK credentials, or anything containing real
  API keys or secrets. (Client-side Firebase config files like `google-services.json` and
  `GoogleService-Info.plist` are public client identifiers and are fine to commit.)
- Disable or route around Firestore security rules or Firebase Auth to unblock a task. Flag
  the gap instead of quietly working around it — e.g. `firestore.rules` not existing yet is
  a tracked gap (see `GOING_LIVE.md`), not precedent for adding another unenforced path.
- Force-push to `main` or rewrite published history without explicit approval.

**Always:**

- Run `flutter analyze` and any related tests before calling anything done. (There is no
  `test/` directory yet — flag this as a gap rather than silently skipping verification.)
- Test UI changes in both light and dark themes.

## Definition of done

Turn the task into a verifiable goal before starting, not after: a bug fix means a failing test that reproduces it and then passes; a feature means stated success criteria you can check against when you're done.

Before claiming that a task or feature is completed, do the following:

- [ ] Run `flutter analyze` and any related tests involved directly or indirectly with the feature, task, fix or bug we worked on.
- [ ] Evaluate if a full build (`flutter build apk` / `flutter build ios`) is needed to verify the change, versus running the app directly (`flutter run`) — only do the full build when the change touches native/build config, not for pure Dart/UI work.
- [ ] UI changes verified in both light and dark themes.
- [ ] If you introduce regression errors, fix them directly without my feedback and make sure that you don't get stuck in a loop with these regressions.
- [ ] `FEATURES.md`/`ROADMAP.md` updated when a feature's status changes; note new findings in `GOING_LIVE.md` if relevant to release readiness.
- [ ] Suggest commit PR title for the included changes of your work and keep the PR title under 70 characters.

## Roles & escalation

**Act without stopping:** bug fixes with a clear reproduction, additive features scoped to a single area, behavior-preserving refactors, documentation updates.

**Stop and ask first:** Isar schema or migration changes, anything touching Firebase Auth/session logic, changes to data retention or the biometric-lock behavior, deleting user data, force-push or history rewrite, adding a new dependency (check its license before adding), rotating or regenerating secrets, deploying or publishing to the App Store/Play Store.

When a decision is genuinely the user's to make, ask — don't guess and move on.

## Release / versioning

- `pubspec.yaml`'s `version:` follows SemVer — bump it as part of the PR for the change.
- Version bumps: patch for fixes, minor for additive features, major for breaking data/schema changes. Confirm major bumps with the user rather than deciding alone.
