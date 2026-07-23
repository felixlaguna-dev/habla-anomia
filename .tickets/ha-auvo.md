---
id: ha-auvo
status: closed
deps: []
links: [ha-7so7]
created: 2026-07-22T10:10:54Z
type: bug
priority: 1
assignee: Félix Laguna Teno
tags: [bug, exercises, scoring]
---
# Fix exercise scoring/content bugs (category list drift, 1-option questions, synonym scoring, derived side effect)

CONTEXT: four scoring/content bugs inside exercise components that mark patients wrong incorrectly or show broken choices. These are surgical fixes to CURRENT components (the big toolkit refactor happens in other tickets; keep these fixes minimal so they can be cherry-picked into the migration).

BUG 1 — SemanticFeaturesExercise.svelte line ~81: hardcoded ALL_CATEGORIES array is out of sync with the real Category union (missing school/technology/sports/music/toys). Category-question distractors therefore never include those, and words from them can produce degenerate questions. FIX: derive the list from the actual type — export a CATEGORIES: Category[] constant from src/lib/types/index.ts (single source of truth listing all 20) and import it here (and anywhere else that hardcodes category lists — grep for a few).

BUG 2 — SemanticFeaturesExercise.svelte lines ~102-119: non-category feature questions collect distractor values from the other session words and slice(0,3) with NO padding — when session words share feature values, the patient can be shown a 1-option or 2-option "choice". FIX: pad from allWords (already passed as a prop by the runner but unused here) until 4 total options; only if the whole bank cannot supply enough, show fewer but never fewer than 2.

BUG 3 — OppositesSynonymsExercise.svelte line ~96: in synonym mode only synonyms[0] counts as correct even though validAnswers collects all synonyms; a patient tapping a listed valid synonym that happens to be another option is marked WRONG. FIX: treat any member of validAnswers as correct when it is the selected option; ensure buildOptions never places two valid answers in the same option set (filter validAnswers out of distractor pool).

BUG 4 — PhonologicalCueingExercise.svelte lines ~104-111: revealedCues is a derived that SPEAKS (calls speakWord) when cue level 5 is reached — a side effect inside derived, a Svelte 5 anti-pattern that can fire on unrelated recomputes. FIX: move the speak call to the event handler that increments the cue level (speak when advancing TO level 5), leaving the derived pure.

VERIFY: play semantic-features until a function/location question appears — always 4 tappable options; play opposites in synonym mode (temporarily force mode = synonyms) and confirm alternate synonyms score correct; cue level 5 still speaks the word exactly once. npm run check does not get worse.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).

