# Verb 'em all — Feature Ideas Backlog

Brainstormed during Session 1 (2026-04-01). These are creative, bold, and sometimes weird ideas for future versions of the app. Organized by theme.

---

## 🐣 Creature & Companion

### Verbagotchi (DONE)
A Tamagotchi-style digital creature that lives in the app. It grows and evolves as you catch verbs, and gets hungry over time if you neglect it. If left in critical condition for >24h, it escapes by randomly uncatching one of your collected words. Stages: Hatchling → Verblet → Verbion → Verbzilla.

### Verb Familiar
Give the creature a name and personality. Different name choices unlock different ASCII art variants (gothic, pixel, alien). The creature reacts to the types of verbs you catch — catch many "destruction" verbs and it grows spikes; catch "speech" verbs and it sprouts a speech bubble.

### Mood Contagion
The creature's mood affects the app's color scheme. Happy creature = warm yellows. Sick creature = desaturated palette. Critical creature = everything pulses red.

---

## 📅 Daily Rituals

### Daily Verb of the Day (DONE)
Each day, a random uncaught verb is highlighted with a "Today's Hunt" badge. Catching it within 24h awards bonus XP or a special golden badge. Resets at midnight.

### Streak Tracker
Count consecutive days where at least one verb was caught. Display a streak counter in the header (🔥 5 days). Breaking the streak triggers a dramatic animation.

---

## 🧠 Learning & Discovery

### AI-Generated Etymology
On each word card, a small expandable section with AI-generated etymology — where the word came from, its Latin/Greek roots, and a fun historical usage example. Powered by an external API call (optional, on-demand).

### Verb Relationships
Visual graph showing which verbs are semantically related. Clicking a verb highlights its "verb neighbors" in a mini-network view.

### Word Map
2D scatter plot of all 187 verbs, clustered by semantic similarity (run k-means on pre-computed embeddings). Click a cluster to filter the main list.

---

## 🎮 Gamification

### Quiz Mode
A timed multiple-choice quiz: shown a definition, pick the right verb from 4 options. Or vice versa. Tracks a personal high score. Option to only quiz from already-caught verbs.

### Verb Chains
Minigame: given a starting verb and an ending verb, construct a chain of verbs where each adjacent pair shares a thematic or phonetic link. Share your chain with others.

---

## 👥 Social & Sharing

### Collaborative Leaderboard
Optional cloud sync (privacy-first, anonymous by default). See global catch counts — how many people worldwide have caught "Orchestrating" today. Show trending verbs.

### Share Card Generator
One-click "Share my progress" button that generates a beautiful PNG card: your caught count, top 3 most-caught words, Verbagotchi level, and a QR code linking to the app. Shareable to social media.

### "Word of the Day" Email/Notification
Daily push notification (macOS native) with one uncaught verb and its definition. Tapping the notification opens the app focused on that word.

---

## ✨ Visual & UX Polish

### Dark / Light / Solarized Themes
Toggle between dark (current neo-brutal), light neo-brutal, and a solarized retro palette. Theme selection saved to preferences.

### Customizable Accent Color
Let users pick their primary accent from a curated palette. The word cards and celebration overlay adopt the chosen color throughout.

### Typewriter Mode
When you open the catch modal, your note appears letter-by-letter with a typewriter sound effect (optional, togglable).

### History Timeline
A dedicated "Timeline" tab showing all catches in chronological order — a diary of your vocabulary journey. Scroll back through time to see when you first caught "Bootstrapping."

### Animated Word Reveal
In the "not caught" list, words render with a scanline/glitch animation on first load — as if being decoded from a secret signal.

---

## 🔧 Power User Features

### Custom Word Lists
Allow users to add their own words to hunt, with custom emoji, description, and category. Store in a separate `custom-words.json` file.

### Quick Catch CLI
A companion CLI tool (`verb-catch <word>`) that can be run from the terminal to catch a word without opening the GUI. Useful during deep coding sessions.

### Auto-Tag From Context
When a verb is caught via the session watcher, automatically pre-fill the note field with the surrounding sentence from the Claude response where it was found.

### Statistics Dashboard (DONE)
A stats screen showing: most-caught verb, catch rate by day of week, most active hour, categories breakdown (pie chart), and a heatmap calendar of activity (GitHub-style green squares).

---

## 🤪 Weird & Experimental

### Verb ASMR Mode
The app plays a soft keyboard click or typewriter sound for each letter as you type in the search box. Optional, deeply satisfying.

### Glitch Art Mode
A toggle that randomly corrupts a small portion of the word descriptions with glitchy Unicode characters, simulating a "corrupted data" aesthetic. Purely cosmetic.

### Haunted Words
Verbs that haven't been caught in >30 days develop a slowly pulsing "haunted" aura on their card. The longer uncaught, the more dramatic the visual effect.

### Verb Oracle
Click "Consult the Oracle" to have the app pick a random uncaught word and display it with dramatic ambient animation. The Oracle speaks — you must catch what it chooses.

### Reverse Mode
The app hides all word names and only shows descriptions. You have to identify which word matches. A guessing game built into the normal browsing experience.

---

## Session 2 — Bold & Non-Conformist Ideas (2026-04-19)

A second brainstorm focused on surprising, emotionally resonant, and visually unexpected features.

---

## 💀 Consequence & Drama

### The Verb Graveyard
Escaped words don't silently disappear — they get a tombstone in a dedicated Graveyard tab, complete with epitaph, date of loss, and how many times the word was caught before escaping. Resurrect a word by catching it twice in a row. Dark, ritualistic, and memorable. Deepens the escape mechanic with zero new infrastructure.

### Endangered Word Alerts
A random 3–5 verbs per week are flagged "ENDANGERED" — pulsing red border, countdown timer. If not caught within 48h of their endangered window, they go dormant (hidden from the grid for 30 days). Creates urgency and makes the word list feel alive and unpredictable.

---

## 🌌 Visual Reinvention

### Verb Constellation Map
Replace (or complement) the flat word grid with a zoomable, draggable star map. Caught verbs become lit stars; categories form named constellations. The Verbagotchi roams between them. Uncaught words are dim distant stars. Changes the entire spatial metaphor of the app.

### Verb Rune Tattoo System
Each caught verb unlocks a tiny procedural rune — a unique SVG glyph derived from the word's characters. These tattoos get embedded directly into the creature's ASCII art body, visibly accumulating with every catch. The creature literally *becomes* your vocabulary. The creature portrait is exportable as art.

---

## 🌙 Time-Based Mechanics

### Nocturnal Mode
After midnight, the app shifts into "Night Hunt" mode: eerie palette (deep indigo + ghost-white), 10 special night-only verbs appear that are unreachable during the day, and the creature grows restless and more animated. Rewards night-owl users with exclusive content.

---

## 🧬 Depth & Progression

### Verb Rarity Tiers
Assign rarity to words based on actual English frequency: **Common / Rare / Epic / Legendary**. Legendary verbs require special conditions to catch (3x detection, night-only, monitoring-only, etc.). Display rarity as a gem/star badge on the word card. Makes catching "gallivant" feel categorically different from catching "ululate." Reframes the entire word list without changing infrastructure.

### Adversarial Rival Creature
At Verbzilla level (75 catches), a rival "Verbivore" spawns and periodically threatens to steal one of your rarest catches. You defend by catching a new verb within a time window. Miss it, and the word is stolen — appearing in the Graveyard with a "stolen" marker. The first meaningful late-game tension.

---

## 🤖 AI-Powered Surprises

### Verbagotchi's Living Diary
The creature auto-generates a first-person micro-diary entry each day, weaving caught verbs into actual sentences via Claude API. Entry style shifts with creature health — poetic when thriving, fragmentary when sick, corrupted gibberish when critical. Creature escape corrupts past entries. Entries are readable in a new "Diary" section of the Timeline.

### Verb DNA Splicing Lab
Unlocks at 50 catches: combine any two caught verbs into a fictional hybrid — blended name, composite emoji, AI-generated definition (Claude API). Stored in a secret "Mutations" tab. These mutations don't count toward progress but are personal, bizarre, shareable artifacts. Example: "scintillate" + "harangue" → "scintillangue 🌩️ — to berate someone with dazzling eloquence."

---

## 🔊 Sensory Design

### Sound Signature per Word
Each category gets a distinct ambient drone layer when browsing. Catching a word plays a short procedurally-shaped audio event — tone derived from the word's character codes, shaped by category. Built with Web Audio API, no assets required. Silent by default, toggleable. Would make verb-em-all the first word-collection app with its own sonic identity.
