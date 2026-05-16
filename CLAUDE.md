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
- Web Speech API for voice input (Safari + Chrome)

## Key Paths
- Exercises: `src/lib/components/exercises/` (8 types)
- Word bank: `src/lib/data/words-es.ts` (200+ words)
- Database: `src/lib/db/` (Dexie tables: words, attempts, sessions, settings)
- Engine: `src/lib/engine/` (session-generator, spaced-repetition, statistics)
- UI components: `src/lib/components/ui/`
- Speech: `src/lib/speech/` + `src/lib/components/speech/`

## Conventions
- Svelte 5 runes only: `$state`, `$props`, `$derived`, `$effect`
- CSS variables from `src/lib/styles/theme.css` — no Tailwind
- Min 56px touch targets on all interactive elements
- All user-facing strings via `$t('key')` from i18n
- Language: code/comments in English, UI in Spanish

## Adding exercises
1. Create component in `src/lib/components/exercises/`
2. Add to barrel export `index.ts`
3. Add route mapping in `src/routes/exercises/[type]/+page.svelte`
4. Add translations to all locale files (`src/lib/i18n/*.json`)
5. Add exercise card to `src/routes/exercises/+page.svelte`

## Adding words
Edit `src/lib/data/words-es.ts`. Each word needs: id, word, category, language, image_url, definition, features, phonetic, difficulty, tags, sentence, opposite, synonyms.
