---
id: ha-nw16
status: closed
deps: []
links: []
created: 2026-07-22T10:10:54Z
type: bug
priority: 0
assignee: Félix Laguna Teno
tags: [bug, exercises, core]
---
# Fix exercise completion callbacks (oncomplete/onrestart prop casing breaks results, sessions, streaks)

CONTEXT: Habla Anomia is a SvelteKit static SPA (PWA) for aphasia rehab. The exercise runner page mounts one of 8 exercise components and passes completion callbacks.

THE BUG (the most important bug in the app): the parent passes callbacks in lowercase while every child declares them in camelCase, so the callbacks are ALWAYS undefined:
- Parent: src/routes/exercises/[type]/+page.svelte lines 228-229 passes oncomplete={handleComplete} and onrestart={handleRestart}
- All 8 components in src/lib/components/exercises/*.svelte declare props onComplete / onRestart (e.g. PictureNamingExercise.svelte lines 20-21) and invoke onComplete?.(...) / onRestart?.()

Svelte 5 matches props by exact name, so in every exercise these are undefined. CONSEQUENCES: handleComplete never runs, therefore the results overlay + confetti + playCompleteSound + endSession + updateStreak + retry-mistakes are all dead; every DB session row stays open forever (ended_at never set); streaks never advance; the home dashboard "Hoy completados" and "Precision" can never move. Users currently only see each exercise's internal summary screen.

TASK:
1. In all 8 exercise components (PictureNaming, SemanticFeatures, PhonologicalCueing, CategorySorting, GenerativeNaming, WordMatching, SentenceCompletion, OppositesSynonyms), rename the props onComplete -> oncomplete and onRestart -> onrestart (type declaration, destructuring, and every call site). Lowercase is the correct direction because it matches Svelte 5 DOM-like callback conventions and the parent already uses it.
2. GenerativeNamingExercise passes a details array shape check: parent handleComplete expects { score, total, details?: Array<{word, correct}> }. Verify each component passes score/total (and details where it already builds them) with those exact key names.
3. Note: after this fix, when an exercise finishes, BOTH the parent results overlay (fixed position, z-index 200) and the exercise internal summary render; the overlay covers the summary, which is acceptable for now (full removal of internal summaries happens in the migrate-exercises ticket). Verify the overlay actually covers the viewport on phone 375px and tablet 768px.
4. Manually verify end-to-end in the browser (make dev, http://localhost:5173): complete a Picture Naming run -> results overlay appears with score, sound plays, closing it navigates home, home now shows 1 completado and nonzero accuracy, and a streak badge appears. Also verify "Reintentar errores" appears after a run with mistakes and restarts with only the failed words.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

UNBLOCKS: ha-aslk (session lifecycle). FINAL STEP of this ticket: after all acceptance criteria pass, run: tk close ha-nw16 — then verify with: tk ready — that ha-aslk now appears as ready.

**2026-07-22T20:35:52Z**

Started: fixing prop casing (onComplete/onRestart -> oncomplete/onrestart) across all 8 exercises + ExerciseSummary for consistency with shared-component callback convention (OptionGrid onselect/onspeak).

**2026-07-22T21:28:28Z**

DONE. Fix applied + verified end-to-end (20/20 puppeteer checks on isolated dev server):

1) Renamed props onComplete->oncomplete, onRestart->onrestart across all 8 exercises + shared/ExerciseSummary.svelte (type decl, destructure, all call sites). Lowercase matches Svelte 5 DOM-like callback convention (same as OptionGrid onselect/onspeak) and the parent's existing binding.
2) Parent +page.svelte: wrapped <ExerciseComponent> in {#key words} so 'Reintentar errores' remounts with fresh state (was showing stale internal summary because child currentIndex stayed at completed length). Simplified from an initial runId counter per /simplify review.
3) Parent handleComplete: null sessionId after endSession so a retry run can't overwrite the finalized session row (adversarial review found retry corrupted stats 7/10->3/3).

Verified: results overlay, session ended_at SET, streak advances, home updates, retry restarts with exactly the failed words (label '1 de 3'), session row preserved across retry (10 ex / 70%), and oncomplete fires across picture-naming + opposites-synonyms + sentence-completion + phonological-cueing. npm run check 0 errors; npm run build OK.

Out of scope (deferred): internal ExerciseSummary still renders under the overlay (accepted per ticket pt 3; removal in migrate-exercises ticket); session lifecycle on tab-close/navigation (ha-aslk); onSpeak/onspeak casing split in FeedbackBanner (cosmetic, separate cleanup).
