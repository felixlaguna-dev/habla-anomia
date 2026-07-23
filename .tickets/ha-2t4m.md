---
id: ha-2t4m
status: closed
deps: []
links: []
created: 2026-07-22T10:16:27Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ui, refactor]
---
# Unified exercise metadata registry (icons, colors, names) replacing emoji maps

CONTEXT: exercise identity (icon, color, name) is duplicated and INCONSISTENT: src/routes/+page.svelte exerciseTypes map (lines ~36-45) vs src/routes/about/+page.svelte exerciseDescriptions (lines ~9-18) disagree on 3 icons (phonological cueing is a speaker on about but letters on home; sentence completion pencil vs memo; opposites arrows vs recycle) and both hardcode hex colors. The runner page and results screens have no access to any of it.

TASK:
1. Create src/lib/exercises/registry.ts — the single source of truth: export interface ExerciseMeta { type: ExerciseType; i18nKey: string; icon: string; color: string; imageDependent: boolean } and export const EXERCISE_REGISTRY: ExerciseMeta[] with all 8 (plus a getExerciseMeta(type) helper). icon = an inline SVG path string (24x24 viewBox, stroke style matching BottomNav icons — draw simple distinct glyphs: picture frame, brain, sound waves, folder, lightbulb, link, pencil-line, opposing arrows). color = reference to a CSS variable name or a hex that gets added to theme.css as --exercise-<type> tokens (prefer tokens; add the 8 tokens to theme.css with the current home-page hues).
2. Replace the maps in home (+page.svelte) and about (+page.svelte) with registry lookups; render icons as inline SVG (same technique BottomNav uses) instead of emoji. Font-size/layout stays as-is otherwise (bigger visual redesign is the home-redesign ticket; if that merged first, adapt to its structure).
3. Derive IMAGE_DEPENDENT_EXERCISES (src/lib/types/index.ts) from the registry (or move the constant into the registry and update the 2 importers: session-generator, types re-export) so the flag cannot drift.
4. The exercise runner title area (src/routes/exercises/[type]/+page.svelte) shows the registry icon+color next to the title for orientation.
5. New-exercise checklist in CLAUDE.md gains a step: add the exercise to the registry.

ACCEPTANCE: home, about, and the runner render identical icon/color per exercise from one module; no emoji exercise icons remain; grep confirms the old maps are gone.

FINAL STEP: close this ticket with tk close so dependent tickets become ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

UNBLOCKS: ha-dro1 (about i18n) and contributes to ha-oq1j (home redesign). FINAL STEP: tk close ha-2t4m, then verify with tk ready.

**2026-07-23T08:18:29Z**

Implemented: src/lib/exercises/registry.ts (ExerciseMeta + EXERCISE_REGISTRY + getExerciseMeta + EXERCISE_TYPES + derived IMAGE_DEPENDENT_EXERCISES), ExerciseIcon.svelte owns the tinted tile (variant tinted/solid, modeled on CategoryIcon), 8 --exercise-* tokens in theme.css. Replaced emoji/hex maps in home/about/runner/practice; deleted src/lib/data/exercise-meta.ts (master's interim version). IMAGE_DEPENDENT_EXERCISES moved out of types into the registry. /simplify (4 agents) + adversarial review converged. npm run check 0 errors (7 pre-existing warnings), npm run build green, puppeteer visual QA confirms all 4 pages.
