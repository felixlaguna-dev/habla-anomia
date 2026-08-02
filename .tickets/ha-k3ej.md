---
id: ha-k3ej
status: closed
deps: [ha-klrd, ha-nwmq]
links: []
created: 2026-07-22T10:16:27Z
type: chore
priority: 3
assignee: Félix Laguna Teno
tags: [docs]
---
# Rewrite README and CLAUDE.md to match post-refactor reality

BLOCKED BY: migrate-all-exercises (T14) and the precache ticket (T3) — the docs must describe the POST-refactor architecture. Do not start until both close.

CONTEXT: README.md and CLAUDE.md have drifted from reality and will drift further as the ticket wave lands. Current known lies in README: "Voice input - speech recognition for users who struggle with typing" (feature was deliberately removed), "200+ Spanish words" (523), project structure lists speech/ as containing synthesis+recognition, features list omits the actual differentiators (fully tap-based, spaced repetition, streaks). CLAUDE.md: references src/routes/exercises/+page.svelte as the exercise-card location but that file does not exist (the route is a redirect; cards live on the home page or wherever the home-redesign put them); "11 words still pending images" may be resolved by the image ticket (check).

TASK:
1. Rewrite README.md truthfully: what the app is, the exercise list (including any new exercises that have merged — check the registry), the real feature set (offline PWA, IndexedDB local-only, spaced repetition, streaks, adaptive difficulty if merged, tap-only accessibility rationale, 4 UI languages with Spanish content), quick start (make dev / make up), tech stack, project structure matching the post-toolkit tree (exercises/shared/, registry), deployment note (GitHub Pages under /habla-anomia base path), license.
2. Update CLAUDE.md: fix the adding-exercises checklist to the real steps (component on the toolkit, registry entry, route mapping, i18n x4, tests if the test ticket merged, WORDS_ES_VERSION bump rule from the seed ticket, image standards from the image-quality ticket, npm run check gate). Correct all paths and counts. Keep it terse — CLAUDE.md is instructions, not marketing.
3. Cross-check every claim against the tree before writing it (word count via grep -c "id: 'es-" src/lib/data/words-es.ts; exercise count via the registry; commands via Makefile/package.json).
4. Keep both files free of emoji noise except where already established (README exercise table emoji are fine to keep or replace with plain text — choose consistency).

VERIFY: every command in both docs actually runs; every path exists; word/exercise counts match reality on the day of closing.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-klrd (T14) AND ha-nwmq (T3). Do not start until both are closed.
