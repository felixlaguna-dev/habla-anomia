---
id: ha-iw2c
status: closed
deps: []
links: []
created: 2026-07-22T10:16:26Z
type: feature
priority: 2
assignee: Félix Laguna Teno
tags: [feature, ux, engine]
---
# Category practice mode: pick a category to train

CONTEXT: patients and caregivers often want to drill ONE semantic field ("today we practice food words") — a standard speech-therapy pattern. Today the app always auto-picks words; there is no user control.

SPEC — "Practicar una categoria":
1. Entry point: a section on the home page below the exercise grid — "Practicar una categoria" with a horizontal row of large category tiles (icon + Spanish label from the categories.* i18n keys). Categories listed = those with at least 8 words with images for the content language (use getCategories + a count filter; helper in src/lib/db/words.ts).
2. Tapping a category opens a simple chooser (route /practice/[category] or a modal — prefer a route for back-button friendliness): shows the category name + 3 big exercise choices that work well per-category: Nombrar imagenes, Escucha y elige (if merged; hide if the exercise type does not exist yet), Completar frases. Each starts that exercise restricted to the category.
3. Plumbing: generateSession (src/lib/engine/session-generator.ts) gains an optional options param { category?: Category }; when set, all selection pools filter to that category (due words from it first, then random within it). The exercise runner page reads a ?category= query param (or route param) and passes it through.
4. Session rows should note the category if trivially possible (sessions table has no category field — do NOT migrate the schema for this; skip persistence).
5. Category tiles need icons: reuse the exercise metadata module pattern or a simple map of category -> emoji-free SVG or a colored initial tile; keep it consistent with the app icon language.

VERIFY: pick Alimentos -> picture naming shows only food words; back button returns to home cleanly; a category with too few imaged words never appears in the row; works at 375 and 768 widths.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).

