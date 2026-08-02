# Habla Anomia

**Free, open-source PWA for anomia (aphasia) rehabilitation.**

A fully offline Progressive Web App with evidence-based exercises, adaptive spaced repetition, daily streaks, and accessibility-first design — built for elderly users recovering from aphasia. No account, no server, no internet required after first load.

## Exercises

All exercises are tap-to-select multiple choice — the app never requires typing or speech input.

| Exercise | Description |
|----------|-------------|
| 🖼️ **Picture Naming** | Identify objects from images |
| 🧠 **Semantic Features** | Describe objects by category, function, location, properties |
| 🔊 **Phonological Cueing** | Progressive sound-based hints (first sound → syllables → rhyming) |
| 📂 **Category Sorting** | Sort items into the correct categories |
| 💡 **Generative Naming** | Tap all words that belong to a category within 60 seconds |
| 🔗 **Word Matching** | Match words to their definitions |
| ✍️ **Sentence Completion** | Fill in the missing word in context |
| ↔️ **Opposites & Synonyms** | Practice antonyms and synonyms |
| 🔍 **Odd One Out** | Find the word that doesn't belong in the group |
| 👂 **Listen & Choose** | Listen to a word (TTS) and pick the matching image |
| ✓ **Yes / No** | Decide whether a statement about an image is true or false |

## Features

- **Fully offline** — PWA with Service Worker; works without internet after first load
- **No backend** — all data stored locally in IndexedDB; no account needed
- **Spaced repetition** — SM-2 algorithm prioritises words the patient struggles with, schedules reviews at optimal intervals
- **Daily streaks** — encourages consistent practice
- **Adaptive difficulty** — word difficulty adjusts based on performance history
- **Accessibility-first** — extra-large text options, high contrast, large touch targets, keyboard navigation
- **Text-to-speech** — speak buttons on every exercise (Web Speech API, toggleable via settings)
- **4 UI languages** — Spanish (primary content), Catalan, Basque, English
- **500+ Spanish words** across 20 categories with photo-realistic images
- **Sound effects** — Web Audio API feedback for correct/incorrect/completion
- **Tablet-optimised** — responsive layout for tablets and mobile phones

## Quick Start

```bash
# Local dev server (http://localhost:5173)
make dev

# Docker build & serve (http://localhost:3020)
make up

# Production build only (output to build/)
npm run build
```

## Tech Stack

- **SvelteKit + Svelte 5** — client-side SPA (static adapter)
- **TypeScript** — full type safety
- **Dexie.js** — IndexedDB wrapper for local persistence
- **Web Speech API** — text-to-speech only
- **VitePWA + Workbox** — Service Worker generation
- **Docker + nginx** — production serving

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── exercises/    # Exercise components + shared/ (Shell, Options, Feedback, SpeakButton)
│   │   └── ui/           # Button, Card, Modal, Timer, BottomNav, Charts, etc.
│   ├── data/             # Word bank (500+ Spanish words, 20 categories)
│   ├── db/               # Dexie database layer
│   ├── engine/           # Session generator, spaced repetition, adaptive difficulty, statistics
│   ├── exercises/        # Exercise registry (single source of truth)
│   ├── i18n/             # Translations (es, ca, eu, en)
│   ├── speech/           # TTS abstraction (speech-synthesis.ts)
│   ├── styles/           # Theme CSS variables
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Sounds, keyboard nav, helpers, paths, timer
├── routes/               # SvelteKit pages (home, exercises, progress, settings, about, etc.)
└── app.css               # Global styles
```

## Deployment

The app deploys to **GitHub Pages** via GitHub Actions. The production build is configured via `.github/workflows/deploy.yml` with the correct base path. A self-hosted Docker setup (`make up`) serves on port 3020 via nginx. CI runs type checking, unit tests, build verification, and Playwright E2E tests on every push/PR to master.

## License

MIT
