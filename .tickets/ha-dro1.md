---
id: ha-dro1
status: closed
deps: [ha-2t4m]
links: []
created: 2026-07-22T10:16:27Z
type: chore
priority: 3
assignee: Félix Laguna Teno
tags: [i18n, chore]
---
# About page: full i18n + registry metadata + privacy note

BLOCKED BY the exercise-metadata-registry ticket (T28). Do not start until it closes.

CONTEXT: the About page (src/routes/about/+page.svelte) hardcodes Spanish strings outside i18n and duplicates exercise metadata that now lives in the registry.

TASK:
1. Replace the local exerciseDescriptions map with EXERCISE_REGISTRY lookups (icons become the registry SVGs — after this, zero emoji exercise icons anywhere).
2. Move every hardcoded string to i18n keys in ALL 4 locale files: Tecnologia / SvelteKit + PWA / Datos / IndexedDB (local) / Licencia / Codigo abierto labels (lines ~65-75) and the credits paragraph (lines ~77-80). Translate meaningfully (ca/eu/en), not machine-gibberish — keep sentences short.
3. The exercise list on About should also show each exercise short description from the existing exercises.*.description i18n keys instead of any duplicated text.
4. Version display: verify the __APP_VERSION__ declaration from the type-check ticket renders the git hash correctly in dev ("dev") and CI builds (real hash) — do not duplicate version constants (single source per that ticket).
5. Add one short paragraph (i18n x4) crediting that all data stays on the device — privacy is a selling point for a health app: "Todos tus datos se guardan solo en tu dispositivo. Nada se envia a internet."

VERIFY: switch through the 4 UI languages — About fully translates; icons match home; npm run check clean for this file.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-2t4m (T28). Do not start until it is closed.

**2026-07-29T23:03:05Z**

## Code Review: NEEDS FIXES (1 major, 3 minor)

**Files reviewed:** src/routes/about/+page.svelte, src/lib/i18n/{es,en,ca,eu}.json
**Checks:** svelte-check 0 errors (7 pre-existing warnings unrelated), npm run build PASS, vitest 73/73 PASS.
**i18n key consistency:** All 4 locales have identical about.* key sets. Translations are meaningful/human-quality (es/en/ca/eu). No machine gibberish.

---

### MAJOR 1 — 'SvelteKit + PWA' still hardcoded (acceptance criterion missed)
**File:** src/routes/about/+page.svelte:11
**Problem:** `value: 'SvelteKit + PWA'` is a hardcoded string. The ticket explicitly lists 'SvelteKit + PWA' among the strings to move to i18n. Worse, it is inconsistent: 'IndexedDB (local)' (also a tech proper noun) WAS moved to i18n as about.data_value, but 'SvelteKit + PWA' was not.
**Suggestion:** Add about.technology_value to all 4 locale files (es/en/ca: 'SvelteKit + PWA', eu: 'SvelteKit + PWA' — proper noun, same in all) and use $t('about.technology_value') on line 11; OR revert about.data_value to a literal so both are treated the same.

### MINOR 2 — Orphaned settings.version key (dead i18n key x4)
**File:** src/lib/i18n/{es,en,ca,eu}.json
**Problem:** The about page was switched from $t('settings.version') to $t('about.version'), but settings.version still exists in ALL 4 locale files and is now referenced nowhere in src/ (grep confirmed 0 usages). This is a duplicated/dead key.
**Suggestion:** Remove settings.version from all 4 locale files; OR drop about.version and keep reusing settings.version (it was fine where it was).

### MINOR 3 — {#each} keyed by translated string
**File:** src/routes/about/+page.svelte:62
**Problem:** `{#each devDetails as detail (detail.label)}` uses the localized label as the each-block key. When the user switches locale, all labels change, so Svelte tears down and recreates every dev-detail DOM node unnecessarily.
**Suggestion:** Add a stable id field to each detail object, e.g. { id: 'tech', label: $t(...), value: ... } and key on detail.id.

### MINOR 4 (pre-existing) — Unused 'browser' import
**File:** src/routes/about/+page.svelte:3
**Problem:** `import { browser } from '$app/environment'` is imported but never used. Pre-existing (not introduced by this diff) but still present.
**Suggestion:** Remove the import.

---
No other hardcoded user-facing strings found. CSS tokens all resolve in theme.css. No duplicate CSS properties. JSON valid in all 4 files.
