# Habla Anomia

Free, open-source PWA for anomia (aphasia) rehabilitation.

## Commands
- `make dev` — local dev server on :5173
- `make up` — Docker build + serve on :3020
- `make build` — Docker build only
- `npm run build` — Vite production build (output to `build/`)
- `npm run check` — svelte-check type checking
- `npm test` — vitest unit tests

## Architecture
- SvelteKit static SPA (`ssr: false`, `adapter-static` with `200.html` fallback)
- All data in IndexedDB via Dexie.js v4 (schema v3) — no backend
- PWA with Service Worker (VitePWA + Workbox)
- i18n with Svelte stores (es primary, ca/eu/en available)
- Web Speech API for TTS only (text-to-speak, no speech recognition)
- SM-2 spaced repetition engine with daily streaks and adaptive difficulty

## Key Paths
- Exercises: `src/lib/components/exercises/` (11 types, all multiple-choice / tap-to-select)
- Shared exercise components: `src/lib/components/exercises/shared/` (ExerciseShell, OptionCard, OptionGrid, FeedbackBanner, SpeakButton, exercise-common.css)
- Exercise registry: `src/lib/exercises/registry.ts` (single source of truth for exercise identity — type, i18nKey, icon SVG path, color token, imageDependent, requiresTts; rendered via `ExerciseIcon` from `src/lib/components/ui/`)
- Word bank: `src/lib/data/words-es.ts` (523 words across 20 categories, multi-category `categories: Category[]`). All words have images.
- Database: `src/lib/db/` (Dexie v4, schema v3 — multi-category, no `category` index. Tables: words, attempts, sessions, settings, spacedRepetition. Streaks stored as settings key-values.)
- Engine: `src/lib/engine/` (session-generator, spaced-repetition, adaptive-difficulty, statistics)
- UI components: `src/lib/components/ui/` (shared accessibility-first components; see `index.ts` for the full list)
- Speech: `src/lib/speech/speech-synthesis.ts` (TTS only — text-to-speak, no speech recognition)
- Utils: `src/lib/utils/sounds.ts` (Web Audio API sound effects)
- Keyboard nav: `src/lib/utils/keyboard-nav.ts` (useKeyboardNav Svelte action, all exercises)
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
- Tablet: all exercises have `@media (min-width: 768px)` responsive CSS (side-by-side, multi-column)
- Speak buttons: `speakButtonsEnabled` prop on all exercises (default `true`), controlled by `speak_buttons_enabled` setting

## Wiki
- Entity page: `~/wiki/entities/habla-anomia.md`
- Concepts: `~/wiki/concepts/svelte-5-pitfalls.md`

## Adding exercises
1. Create component in `src/lib/components/exercises/`
2. Add to barrel export `index.ts` in the same directory
3. Add to `EXERCISE_REGISTRY` in `src/lib/exercises/registry.ts` (type, i18nKey, icon SVG path, color token, imageDependent, requiresTts) and add the matching `--exercise-<type>` token to `src/lib/styles/theme.css`
4. Add route mapping in `src/routes/exercises/[type]/+page.svelte`
5. Add translations to all locale files (`src/lib/i18n/*.json` — es, ca, eu, en)
6. Use multiple choice / tap-to-select (never require typing)
7. Run `npm run check` and `npm run build` before committing — both must pass

## Adding words
Edit `src/lib/data/words-es.ts`. Each word needs: id, word, **categories** (array of Category enum), language, image_url, definition, features, phonetic, difficulty, tags, sentence, opposite, synonyms. Words can belong to multiple categories (e.g., `categories: ['food', 'nature']`).

**Image quality standard** — stimulus images for picture-naming must be: ONE clear subject centered, plain/neutral background, NO text anywhere in the image, photo-realistic (not illustrations/diagrams/abstract art), unambiguous for elderly viewers. For verbs: one person mid-action with minimal props. For objects: single item, product-photography style. Run `npm run optimize:images` after adding new images; use `scripts/validate-images.py` to batch-check quality via vision API.

**Adding, editing, or removing any word requires bumping `WORDS_ES_VERSION`** at the top of the file (increment by 1). `seedWords()` syncs the DB to the source on load when the version changes — existing installs won't pick up edits/removals otherwise. Removing words also prunes their `spacedRepetition` entries; `attempts` are kept as history.
