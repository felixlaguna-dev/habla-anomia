# Habla Anomia

Free, open-source PWA for anomia (aphasia) rehabilitation.

## Commands
- `make dev` — local dev server on :5173
- `make up` — Docker build + serve on :3020
- `make build` — Docker build only
- `npm run build` — Vite production build (output to `build/`)

## Architecture
- SvelteKit static SPA (`ssr: false`, `adapter-static` with fallback)
- All data in IndexedDB via Dexie.js — no backend
- PWA with Service Worker (VitePWA + Workbox)
- i18n with Svelte stores (es primary, ca/eu/en available)
- Web Speech API for TTS (text-to-speech speak buttons in all exercises, toggled via settings)
- SM-2 spaced repetition engine with daily streaks

## Key Paths
- Exercises: `src/lib/components/exercises/` (8 types, all multiple-choice / tap-to-select)
- Word bank: `src/lib/data/words-es.ts` (~523 words across 20 categories, multi-category `categories: Category[]`). All words have images.
- Database: `src/lib/db/` (Dexie v3 schema — multi-category, no `category` index. Tables: words, attempts, sessions, settings, spacedRepetition)
- Engine: `src/lib/engine/` (session-generator, spaced-repetition, statistics)
- UI components: `src/lib/components/ui/` (shared accessibility-first components; see `index.ts` for the full list)
- Speech: `src/lib/speech/speech-synthesis.ts` (TTS — text-to-speak)
- Utils: `src/lib/utils/sounds.ts` (Web Audio API sound effects)
- Keyboard nav: `src/lib/utils/keyboard-nav.ts` (useKeyboardNav Svelte action, all 8 exercises)
- Exercise helpers: `src/lib/utils/exercise-helpers.ts` (shared restart/completion/feedback logic)
- Path helpers: `src/lib/utils/paths.ts` (centralized route paths)

## Conventions
- Svelte 5 runes only: `$state`, `$props`, `$derived`, `$effect`
- CSS variables from `src/lib/styles/theme.css` — no Tailwind
- Min 56px touch targets on all interactive elements
- All user-facing strings via `$t('key')` from i18n (NO hardcoded strings)
- Language: code/comments in English, UI in Spanish
- All exercises use multiple choice / tap-to-select (aphasia patients can't type — never require typing or speech input)
- Sound effects for correct/incorrect/completion via Web Audio API
- Timer component: use `seconds={durationSeconds}` (NOT bare `{seconds}`)
- Tablet: all 8 exercises have `@media (min-width: 768px)` responsive CSS (side-by-side, multi-column)
- Speak buttons: `speakButtonsEnabled` prop on all 8 exercises (default `true`), controlled by `speak_buttons_enabled` setting

## Wiki
- Entity page: `~/wiki/entities/habla-anomia.md`
- Concepts: `~/wiki/concepts/svelte-5-pitfalls.md`

## Adding exercises
1. Create component in `src/lib/components/exercises/`
2. Add to barrel export `index.ts`
3. Add route mapping in `src/routes/exercises/[type]/+page.svelte`
4. Add translations to all locale files (`src/lib/i18n/*.json`)
5. Add exercise card to `src/routes/exercises/+page.svelte`
6. Use multiple choice / tap-to-select (never require typing)

## Adding words
Edit `src/lib/data/words-es.ts`. Each word needs: id, word, **categories** (array of Category enum), language, image_url, definition, features, phonetic, difficulty, tags, sentence, opposite, synonyms. Words can belong to multiple categories (e.g., `categories: ['food', 'nature']`).
