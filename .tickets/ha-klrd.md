---
id: ha-klrd
status: closed
deps: [ha-7so7]
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [refactor, exercises]
---
# Migrate all remaining exercises to the shared toolkit; single results UI; delete duplication

BLOCKED BY the shared exercise toolkit ticket (T10) — the toolkit and two migrated pilots (PictureNaming, WordMatching) define the pattern this ticket replicates. Do not start until it closes. Read both pilot files first and copy their structure exactly.

CONTEXT: 6 exercises remain on the old copy-paste structure: SemanticFeatures, PhonologicalCueing, CategorySorting, GenerativeNaming, SentenceCompletion, OppositesSynonyms (src/lib/components/exercises/). Each carries duplicated TTS init, speak helpers, option grids with INVALID nested buttons, feedback overlays, star-rating summaries and ~400 lines of copy-pasted CSS.

TASK — migrate all 6 to the toolkit (ExerciseShell, OptionGrid/OptionCard, FeedbackBanner, useTts, recordTrial, buildDistractors):
1. Preserve each exercise mechanic exactly (hint ladders, cue levels, category bins, the semantic 4-step flow, generative multi-select+timer) — this is a refactor, not a redesign. Preserve the bug fixes from the exercise-logic ticket (T9).
2. Unify wrong-answer policy via recordTrial everywhere: first tap recorded; retry-capable exercises (Picture, Phonological, Sentence, Category) keep allowing retry AFTER recording; reveal-style exercises (WordMatching, Opposites, Semantic feature steps) keep reveal-then-advance. All 8 must now write an attempt row for wrong answers (today 4 silently drop them, skewing all analytics).
3. Unify feedback timings through FeedbackBanner constants (correct 1500 ms; reveal 2000 ms; retry-reset 1500 ms) replacing the current 800/1000/1200/1500/2000 scatter.
4. DELETE each exercise internal summary screen — on finish, call oncomplete and let the runner results overlay (src/routes/exercises/[type]/+page.svelte) be the single results UI. Add a "Repetir ejercicio" button to that overlay (calls the existing onrestart flow) since the internal summaries were the only restart entry point.
5. Delete now-dead code inside these files: checkAnswer leftovers (Phonological ~133, Sentence ~146), handleNamingResult (Semantic ~155), displaySentence (Sentence ~91), getRandomEncouragement copies, unused attempts/maxHintsReached/maxCuesReached state, per-file keyframes now provided by shared CSS.
6. Fix remaining hardcoded strings in these files: alt="Imagen del ejercicio" (Semantic ~304, Phonological ~286, Category ~247) and aria-label="Listen" (6 files) -> i18n keys (common.listen exists; add an a11y.exercise_image key to the 4 locales).
7. GenerativeNaming specifics: pool items are divs with role=button and no keyboard handler — OptionCard fixes this; keep its Timer + ProgressBar usage.

ACCEPTANCE: all 8 exercises playable end to end with attempts recorded per policy; svelte-check button-in-button warnings = 0; total LOC under src/lib/components/exercises/ reduced by at least 40 percent (baseline ~6,700); no exercise shows its own summary screen; results overlay offers Repetir + Reintentar errores + Terminar.

FINAL STEP: close this ticket with tk close so dependent tickets become ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7so7. UNBLOCKS: ha-qkoi (layout polish), ha-0lnl (generative rework), ha-k3ej (docs rewrite; also needs ha-nwmq). FINAL STEP: tk close ha-klrd, then verify with tk ready.
