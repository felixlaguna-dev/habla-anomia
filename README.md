# Habla Anomia

**Free, open-source web app for anomia (aphasia) rehabilitation.**

A fully offline Progressive Web App with 8 evidence-based exercises, adaptive difficulty, and accessibility-first design — built for elderly users recovering from aphasia.

## Exercises

| Exercise | Description |
|----------|-------------|
| 🖼️ **Picture Naming** | Identify objects from images with progressive hints |
| 🧠 **Semantic Features** | Describe objects by category, function, location, properties, associations |
| 🔊 **Phonological Cueing** | Progressive sound-based hints (first sound → syllables → rhyming → full word) |
| 📂 **Category Sorting** | Sort items into the correct categories |
| 💡 **Generative Naming** | Name as many items in a category as possible within 60 seconds |
| 🔗 **Word Matching** | Match words to definitions, images, or other words |
| ✍️ **Sentence Completion** | Fill in the missing word in context |
| ↔️ **Opposites & Synonyms** | Practice antonyms and synonyms |

## Features

- **Fully offline** — works without internet after first load (PWA with Service Worker)
- **No server required** — all data stored locally in IndexedDB
- **Voice input** — speech recognition for users who struggle with typing
- **Adaptive difficulty** — spaced repetition algorithm prioritizes words needing practice
- **Accessibility-first** — extra-large text options, high contrast, minimum 56px touch targets
- **i18n-ready** — Spanish (primary), Catalan, Basque, English
- **Tablet-optimized** — designed for tablets and mobile phones

## Quick Start

```bash
# Development
make dev

# Docker build & run
make up

# Visit
open http://localhost:3020
```

## Tech Stack

- **SvelteKit** (static adapter) — SPA with client-side rendering
- **TypeScript** — full type safety
- **Dexie.js** — IndexedDB wrapper for local persistence
- **Web Speech API** — voice input + text-to-speech feedback
- **VitePWA** — Service Worker generation with Workbox
- **Docker + nginx** — production serving

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── exercises/    # 8 exercise components
│   │   ├── speech/       # SpeechInput, synthesis
│   │   └── ui/           # Button, Card, Modal, Timer, etc.
│   ├── data/             # Word bank (200+ Spanish words)
│   ├── db/               # Dexie database layer
│   ├── engine/           # Session generator, spaced repetition, statistics
│   ├── i18n/             # Translations (es, ca, eu, en)
│   ├── speech/           # Web Speech API abstraction
│   ├── styles/           # Theme CSS variables
│   └── types/            # TypeScript type definitions
├── routes/               # SvelteKit pages
│   ├── exercises/        # Exercise selection + individual exercises
│   ├── progress/         # Statistics dashboard
│   ├── settings/         # User preferences
│   └── about/            # Educational content
└── app.css               # Global styles
```

## License

MIT
