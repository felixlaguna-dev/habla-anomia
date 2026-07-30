---
id: ha-rm3a
status: closed
deps: [ha-7so7]
links: []
created: 2026-07-22T10:16:27Z
type: feature
priority: 3
assignee: Félix Laguna Teno
tags: [feature, exercises]
---
# New exercise: El intruso (odd one out)

BLOCKED BY the shared exercise toolkit ticket (T10). Build on ExerciseShell/OptionGrid/recordTrial. Do not start until it closes.

CONTEXT: "odd one out" (el intruso) is a standard semantic categorization task that exercises category boundaries — complements category-sorting (which asks WHERE a word belongs) by asking WHICH does not belong. Zero new content needed.

SPEC — "El intruso":
1. Round: show 4 large image+word cards: 3 from ONE category, 1 from a DIFFERENT category (the intruder). Prompt: "Cual no pertenece al grupo?" (with opening inverted question mark, i18n x4). Patient taps the intruder.
2. Selection: correct (tapped the intruder) -> banner + a one-line explanation reinforcing the category ("Correcto: el platano no es un animal"); incorrect -> reveal policy: highlight the real intruder, brief explanation, advance. recordTrial the intruder word (the trial word_id = the intruder id, so SR reinforces the discriminated word).
3. Generation (in the component from the words prop + allWords): for each of 10 rounds pick a base category with >= 3 imaged words, sample 3, then pick the intruder from a DIFFERENT category — prefer semantically DISTANT categories early (use a small hardcoded distance table: food vs vehicles = easy) and NEARER ones at higher difficulty if the adaptive ticket merged (food vs nature = harder); keep it simple: two tiers, distant for words difficulty <= 2, near otherwise.
4. Layout: 2x2 grid of image cards (min 120px each, word label under image); phone-first sizing per the layout-polish standards.
5. Full wiring checklist per CLAUDE.md + registry entry (type "odd-one-out", name "El intruso", short name "Intruso", image-dependent true).

VERIFY: 10 rounds play cleanly at 375 and 768; the intruder is never accidentally ALSO a member of the base category (multi-category words! filter candidates whose categories intersect the base category — words have categories arrays, use getWordCategories); appears in progress stats.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7so7 (T10). Do not start until it is closed.

**2026-07-30T08:55:07Z**

## Code Review: REUSE issues only (scoped)

Reviewed OddOneOutExercise.svelte + diff for duplication with existing shared code. Scope per request: REUSE only (no lint/test run).

### Finding 1 — getCardState reimplemented (HIGH)
File: src/lib/components/exercises/OddOneOutExercise.svelte:281-289
The local getCardState(index) reimplements the shared getCardState(index, feedbackState, selectedIndex, correctIndex) from src/lib/utils/exercise-helpers.ts:36-48. Logic is identical (none->selected/default; index===correct->correct; selected&&incorrect->incorrect). The only difference is it closes over currentRound/feedbackState/selectedIndex instead of taking them as params — currentRound.intruderIndex is the correctIndex. It also SHADOWS the shared name, which is confusing.
Fix: delete the local fn, import the shared one, call getCardState(i, feedbackState, selectedIndex, currentRound.intruderIndex) in the template (OptionGrid.svelte already does exactly this).
Cost: ~10 lines of divergent logic; if feedback scoring rules change (e.g. partial reveal), this copy silently drifts.

### Finding 2 — Image + letter-fallback pattern duplicated for the 3rd time (MEDIUM)
File: OddOneOutExercise.svelte:345-355 (markup) and 427-462 (CSS: .card-image-wrapper / .card-image / .card-letter-fallback)
The image-with-gradient-letter-fallback is the SAME pattern as:
  - shared exercise-common.css .exercise-image-area .stimulus-image + .image-fallback + .fallback-letter (used by PictureNaming, PhonologicalCueing, SemanticFeatures)
  - CategorySortingExercise .item-image-wrapper + .item-image + .item-letter-fallback
OddOneOut reinvents it a third time rather than extending the shared area. Note the sizing DRIFT: fallback letter is 72px in exercise-common.css and CategorySorting, but 48px/64px in OddOneOut — an unintended inconsistency.
Cost: ~40 lines of copy-pasted CSS; the fallback letter now renders at 3 different sizes across the app.

### Finding 3 — shake + correctPulse keyframes duplicated for the 4th time (MEDIUM)
File: OddOneOutExercise.svelte:510-522 (@keyframes correctPulse, @keyframes shake)
These exact animations already exist in: shared exercise-common.css (exercise-shake), CategorySortingExercise (shake, correctPulse), OptionCard.svelte (shake, correctPulse). OddOneOut is now the 4th copy.
Cost: if animation timing is tuned for accessibility (e.g. reduced-motion), 4 files must be edited; they will inevitably drift.

### Finding 4 — Card-state + card skeleton reimplements OptionCard (MEDIUM, architectural)
File: OddOneOutExercise.svelte:331-367 (template) and 396-502 (.image-card / .card-button / .selected / .correct / .incorrect)
The wrapper-div + class:${state} + inner button + sibling SpeakButton structure is identical to the shared OptionCard.svelte skeleton (the sibling-not-nested SpeakButton is the a11y pattern OptionCard was built to enforce). The .image-card.selected/.correct/.incorrect rules (lines 487-502) are near-identical to OptionCard's .option-card.selected/.correct/.incorrect. OptionGrid even exposes a twoColumns prop that matches OddOneOut's 2x2 grid.
Why not drop-in: OptionCard is text-only, so the image can't be slotted today. 
Suggestion: add an image-capable variant (or a slot to OptionCard) so image exercises stop rebuilding the state-styled card + sibling SpeakButton from scratch.
Cost: ~110 lines of template/CSS duplicating OptionCard's contract; any a11y/STATE change to the card pattern must be applied in two places.

### Q2 answer — translateCategory is NOT duplicated here (informational)
OddOneOut does not display category names, so it does not copy CategorySortingExercise's local translateCategory (CategorySorting:159-163). No action in OddOneOut. Separately, CategorySorting's translateCategory is itself a candidate for extraction to a shared util if a future exercise needs category labels.

### Q1 answer — no existing groupWordsByCategory helper (informational)
The by-category scan at OddOneOutExercise.svelte:125-131 (Map<Category, Word[]>) does not duplicate an existing util — db/words.ts only has getWordsByCategory (DB query) and getCategoryWordCounts (Map<Category, number>). But the per-category scan loop now appears in 4 places (db/words.ts x2, db/attempts.ts, OddOneOut). Candidate for a shared groupWordsByCategory(words): Map<Category, Word[]> in exercise-helpers.ts. Not blocking.

### Correctly reused (no issue)
- getWordCategories from $lib/types (line 5)
- shuffleArray, resolveImageUrl from exercise-helpers
- ExerciseShell, FeedbackBanner, SpeakButton, FEEDBACK_TIMINGS from ./shared
- .exercise-skip-button class from shared exercise-common.css (line 372) — good, this is the right pattern (note: CategorySorting still uses its own .skip-button, an older inconsistency)
- recordTrial, createCancellableTimer, useTts

### Verdict
Needs fixes before merge: Finding 1 (getCardState) is a clear, cheap win — delete the local shadow and call the shared helper. Findings 2-4 are structural duplication that should at least be tracked; the cheapest unblocking refactor is an image-capable OptionCard variant, which would eliminate Findings 2/3/4 together. Lint/tests not run (out of scope for this REUSE-only review).

**2026-07-30T08:56:07Z**

## Code Review: EFFICIENCY issues only (scoped)

Reviewed `OddOneOutExercise.svelte` + full diff for wasted work. Scope per request: efficiency only. No lint/test run.

Data: pool ~374 words, 20 categories (largest: food=77, household=58), 25 multi-category words. Session = 10 rounds (N=10).

### Finding 1 — Category Map rebuilt from scratch for every intruder (HIGH)
File: `src/lib/components/exercises/OddOneOutExercise.svelte:124-131`
`generateRound` is called once per intruder (N=10) by `generateRounds` (line 162). Each call rebuilds the full `byCategory: Map<Category, Word[]>` by iterating the ENTIRE pool (~374 words). That is ~3,740 map insertions across 10 calls for work that only needs to be done ONCE — the pool is identical for every round.
Cheaper alternative: pre-group the pool into a `Map<Category, Word[]>` ONCE (in `generateRounds`, or as a $derived) and pass it into `generateRound`. Per-intruder code then only filters the pre-built buckets, not the raw pool.

### Finding 2 — safePool scan + double getWordCategories per word per intruder (HIGH)
File: `src/lib/components/exercises/OddOneOutExercise.svelte:118-131`
For each intruder, the code does two full O(P) passes over the pool:
  - Line 118-122: `safePool = pool.filter(...)` — calls `getWordCategories(w)` for every pool word (374 calls/intruder).
  - Line 126-131: byCategory build — calls `getWordCategories(w)` AGAIN for every safePool word.
Total across 10 intruders: ~7,240 `getWordCategories` calls. The function is cheap (property access) but the array allocations (`filter` creates a new ~350-element array each time, 10 times) are the real waste.
Cheaper alternative: compute a `Map<string, Category[]>` (wordId -> categories) ONCE for the pool, then reuse it in both passes. Better still, combine the two passes into one: filter AND group in a single loop, avoiding the intermediate safePool allocation entirely.

### Finding 3 — Full Fisher-Yates shuffle of entire category bucket just to pick 3 (MEDIUM)
File: `src/lib/components/exercises/OddOneOutExercise.svelte:143`
`shuffleArray(baseWords).slice(0, 3)` shuffles the ENTIRE bucket to extract 3 words. For 'food' (77 words) or 'household' (58), that is 77/58 swap iterations per round when only 3 are needed. Average bucket ~19 words.
Cheaper alternative: partial Fisher-Yates — swap only 3 random indices to the front, then slice. O(k) where k=3 instead of O(bucket_size). Or use `sample(baseWords, 3)` if a helper exists.

### Finding 4 — Pool spread allocated on every effect run (LOW)
File: `src/lib/components/exercises/OddOneOutExercise.svelte:199`
`const pool = [...words, ...allWords]` allocates a ~374-element array copy. This runs once per effect invocation. In the current route it effectively runs once (see Finding 5), so cost is negligible (~374 copies once). Not worth optimizing unless the effect is found to re-run.
Cheaper alternative: if Finding 1 is applied (pre-grouped Map), the spread becomes unnecessary — group directly from `[...words, ...allWords]` or concatenate with `.concat()`.

### Finding 5 — Effect double-generation risk is LOW in practice (INFO)
File: `src/lib/components/exercises/OddOneOutExercise.svelte:197-204`
The $effect tracks both `words` and `allWords`. If both changed after mount in different ticks, rounds would regenerate twice. In the CURRENT route (`src/routes/exercises/[type]/+page.svelte:68-97`) this does NOT happen: `loading` stays true until both props are set (words at line 81, allWords at line 92, loading=false at line 97), and the component is behind `{:else if loading}`. The `{#key words}` wrapper (line 287) destroys/recreates the component on words change rather than re-running the effect. So the effect runs once per mount.
Risk: latent. A future consumer that mounts the component before allWords resolves would trigger double-generation (first with allWords=[], then again). Worth a comment or an early-return guard if allWords is empty and expected to load.

### Summary
The dominant waste is Findings 1+2: the category grouping is O(N*P) when it could be O(P+N*k). With N=10 and P=374 the absolute cost (~7k property accesses + ~3.5k map inserts) won't cause a visible jank, but it is pure redundant work that scales linearly with session length and word bank size. Pre-grouping the pool once and passing the Map into `generateRound` eliminates both issues with minimal code change.

Tests: not run (efficiency-scoped review).
Linter: not run (efficiency-scoped review).

**2026-07-30T08:56:24Z**

## Altitude Review (depth/layer placement)

Scoped to the 5 altitude questions. Lint: svelte-check 0 errors / 0 warnings. Tests: 73/73 pass. Build: OK. These findings are about WHERE logic lives, not duplication (covered by the prior REUSE note) — though Q4/Q5 overlap.

### Q1 — Round generation belongs in session-generator, not the component (HIGH)
File: src/lib/components/exercises/OddOneOutExercise.svelte:86-166 (findBaseCategory, generateRound, generateRounds)
The round-construction logic (intruder viability check, base-category selection via the distance table, 3-word sampling) is in the component. But the established pattern for any exercise with structural word-selection constraints is a special case in generateSession():
  - category-sorting (session-generator.ts:83-99) — needs >=2 categories, picks them and fetches per-category
  - opposites-synonyms (session-generator.ts:102-134) — needs words with opposite/synonym data
  - generative-naming (session-generator.ts:137-162) — needs a category with enough words
odd-one-out has the same kind of constraint (each intruder needs a non-overlapping base category with >=3 imaged words) but falls through to the GENERIC pipeline. Consequence: the generator can return 10 words from a single weak category (step-2 fill) whose intruders silently fail generateRound() -> null and get filtered out (line 165), yielding fewer than 10 rounds with no signal to the runner. The generator also applies sortByDifficulty (line 247) as if these were normal cue words, but the component re-derives difficulty tiers from intruder.difficulty (line 138) — two separate difficulty concepts in two layers that don't coordinate.
Deeper fix: add an odd-one-out branch in generateSession() that picks intruders guaranteed to have a viable base category (querying getCategoryWordCounts for >=3 non-overlapping words), and returns SessionPlan.words = intruders. The component keeps only presentation: shuffle 4 cards, render, score. This matches the category-sorting split exactly. Note: the ticket spec (line 21) explicitly asked for component-level generation, so this is a spec-level architecture divergence to flag, not an implementer error.

### Q2 — Distance table is domain data marooned in a view file (MEDIUM, downstream of Q1)
File: OddOneOutExercise.svelte:45-73 (DISTANT_PAIRS, NEAR_PAIRS)
The semantic-distance pairs are domain/model data (which categories are far/near), not presentation. They currently live inside a .svelte file. Two angles:
  - If Q1 is adopted (generation moves to the engine), the table MUST move too — session-generator.ts cannot import from a .svelte file, and the existing session-generator.test.ts could then unit-test round viability against the table.
  - Even if generation stays in the component, the table is at the wrong altitude: it encodes clinical/linguistic knowledge (semantic distance for anomia rehab) and belongs in a .ts module, e.g. src/lib/engine/category-distance.ts or src/lib/data/category-distance.ts, where it can be reviewed/tested independently of the UI.
Deeper fix: extract to src/lib/engine/category-distance.ts exporting DISTANT_PAIRS / NEAR_PAIRS (or a findBaseCategory(intruderCats, availableCats, useNear) helper). No other consumer exists today, but the table is the kind of data that will want tuning by a clinician without touching component markup.

### Q3 — Record<ExerciseType, string> in dashboard is CORRECTLY placed (NO ISSUE)
File: src/routes/+page.svelte:139-151 (reasonMap)
The exhaustive Record<ExerciseType, string> is the right altitude. It forces a COMPILE ERROR when a new ExerciseType is added without a reason string — exactly the safety you want. A default/fallback (Map.get() ?? generic) would silently hide missing entries. The runtime fallback at line 159 (reasonMap[type] || $t('dashboard.phonological_practice')) is a belt-and-suspenders safety net, not the primary mechanism. No change needed; this is the pattern other exercise-keyed maps should follow.

### Q4 — getCardState local method is at the wrong altitude (MEDIUM, overlaps REUSE note Finding 1)
File: OddOneOutExercise.svelte:281-289
The local getCardState(index) reimplements the shared getCardState(index, feedbackState, selectedIndex, correctIndex) from exercise-helpers.ts:36-48 (which OptionGrid.svelte:39 already calls). Card-state derivation is a shared scoring concern, not view logic — it belongs in the helper layer. currentRound.intruderIndex is the correctIndex. Deeper fix: delete the local fn, import the shared one, call getCardState(i, feedbackState, selectedIndex, currentRound.intruderIndex). Cheap, unblocking.

### Q5 — Image card belongs in the shared layer, not inline (MEDIUM, overlaps REUSE note Finding 4)
File: OddOneOutExercise.svelte:331-367 (template) + 396-502 (CSS)
The .image-card (wrapper-div + state classes + inner button + sibling SpeakButton + selected/correct/incorrect/hover/shake/correctPulse) is OptionCard.svelte's exact contract with an image+label instead of text. It is presentation infrastructure that the shared/ layer was built to own (OptionCard, OptionGrid). Deeper fix: add an image-capable variant in shared/ (e.g. ImageOptionCard.svelte, or an optional image/slot on OptionCard) so the state-styled-card + sibling-SpeakButton a11y pattern has one home. This would also give OddOneOut the OptionGrid twoColumns layout for free and eliminate the duplicated keyframes/state CSS. The CategorySorting .item-image-wrapper pattern is a related but separate stimulus-display concern (single image, not a choice card) — don't conflate the two.

### Verdict
Q1 is the substantive altitude finding: round generation is a layer below where the architecture puts exercise-specific generation constraints, and the spec sanctioned it. Q2 is downstream of Q1. Q3 is correctly placed. Q4/Q5 restate the reuse findings from the altitude angle (shared-helper layer, shared-presentation layer). Recommend addressing Q1 + Q4 before merge; Q2/Q5 can be tracked as follow-up refactors.

**2026-07-30T08:56:54Z**

## Code Review: SIMPLIFICATION FINDINGS

svelte-check: 0 errors, 0 warnings
Build: PASS

Reviewed OddOneOutExercise.svelte + full diff (9 files). Focused on simplification only.

### Issue 1: [Dead Data] baseCategory stored in Round but never read
File: OddOneOutExercise.svelte
Lines: 78 (interface field), 159 (return value)
Problem: `baseCategory` is computed by `findBaseCategory()` and used locally at line 142 to look up `baseWords`. After that it is stored in the Round interface and returned — but it is NEVER read via `currentRound.baseCategory` anywhere (not in template, not in any function).
Simpler: Remove `baseCategory: Category` from the Round interface (line 78) and from the return object (line 159). Keep the local const at line 139.

### Issue 2: [Copy-Paste] Local getCardState reimplements shared helper
File: OddOneOutExercise.svelte
Lines: 281-289
Problem: The local `getCardState(index)` duplicates the shared `getCardState(index, feedbackState, selectedIndex, correctIndex)` from exercise-helpers.ts (lines 36-48) — identical logic, used by all other exercises via OptionGrid/OptionCard. The only variation is a `!currentRound` guard, which is redundant since the template is already inside `:else if !isFinished && currentRound`.
Simpler: Import `getCardState` from exercise-helpers and call it inline in the markup: `getCardState(i, feedbackState, selectedIndex, currentRound.intruderIndex)`. Delete the local function.

### Issue 3: [Dead Code] Dedup guard in generateRound can never fire
File: OddOneOutExercise.svelte
Lines: 145-154
Problem: The `seen` Set / dedup loop guards against duplicate ids in `[...three, intruder]`. But safePool (line 118) already excludes the intruder by id AND any word with overlapping categories. The `three` words come from a single category bucket built from safePool — all unique, none is the intruder. The comment itself says "shouldn't happen."
Simpler: Replace lines 145-154 with `const cards = [...three, intruder]` and drop the `if (cards.length < 4) return null` check.

### Issue 4: [Redundant State] startTime set twice on init
File: OddOneOutExercise.svelte
Line: 203
Problem: `startTime = Date.now()` is set in the init effect (line 203) AND in the per-round reset effect (line 217). When `words` changes, the init effect fires → `rounds`/`currentIndex` change → `currentRound` recomputes → per-round effect fires and overwrites `startTime`. Line 203 is always dead.
Simpler: Remove `startTime = Date.now()` from line 203. The per-round effect at line 217 covers it.

---

### NOT ISSUES (verified):

- Two `\` blocks (lines 197-204, 211-218): structurally necessary, NOT mergeable. Init effect depends on `words` (fires on restart); per-round effect depends on `currentRound` (fires on each `currentIndex++` advance). Merging would break per-round resets. Other exercises use one effect because they build options per-word — OddOneOut pre-generates rounds.

- `onrestart` declared but never called (lines 26, 36): CONSISTENT with all 8 exercises. `grep -rn 'onrestart('` across every exercise returns zero hits. Vestigial prop in the shared pattern, not OddOneOut-specific.

- `generateRound` complexity: acceptable after removing dead code (issues 1+3 trim ~10 lines). Core logic is a constraint-satisfaction problem with clean early returns.

**2026-07-30T09:07:15Z**

## Adversarial Review: CORRECTNESS (depth pass)

svelte-check: 0 errors, 0 warnings. Build: PASS. Tests: 73/73 PASS.
Reviewed OddOneOutExercise.svelte for correctness bugs across all 7 focus areas.

---

### BUG 1 (HIGH) — Duplicate cards in the 4-card grid (non-deduplicated pool)

**File:** `OddOneOutExercise.svelte:191-192` (init effect) + `generateRounds:148-154` (byCategory build)

The pool is built as `const pool = [...words, ...allWords]` with NO de-duplication. Session `words` are ALWAYS a subset of `allWords` — both come from the same Dexie `db.words` table (`generateSession` at session-generator.ts:175-241 queries `getWordById`/`getRandomWords`/`getWordsByCategory`, all backed by `db.words`; the route loads `allWords = db.words.where('language').equals(...).toArray()` at +page.svelte:92). Every session word therefore appears TWICE in the pool, and thus TWICE in each of its `byCategory` buckets.

When `generateRound` picks 3 base words via `shuffleArray(safeByCat.get(baseCategory)!).slice(0, 3)`, the same word id can be selected twice, producing two identical cards (same image, same label). The intruder is NOT affected (filtered by id), but 2 of the 3 base cards can collapse to the same word.

**Quantified impact** (Monte Carlo, 5000 sessions, realistic category sizes):
- Per-round rate: 1.17%
- Per-10-round-session rate: ~11% chance of at least one duplicate round
- Worst case: small base categories (colors=11, emotions=12, family=12) with 1-2 session-word duplicates → 25-42% per-round duplicate probability for those buckets.

**Fix:** de-duplicate the pool by id before grouping, exactly as `buildDistractors` already does in exercise-helpers.ts:84:
```ts
const pool = [...new Map([...words, ...allWords].map((w) => [w.id, w])).values()];
```

---

### CONCERN 1 (MEDIUM) — 'actions' category missing from BOTH distance tables

**File:** `OddOneOutExercise.svelte:45-73` (DISTANT_PAIRS, NEAR_PAIRS)

The `actions` category appears in neither table. 29 words (out of 523) have `actions` as their only category (comer, beber, dormir, correr, etc. — core anomia-rehab verbs). These intruders ALWAYS fall through to the random fallback in `findBaseCategory`, bypassing the distant/near difficulty discrimination entirely. The spec's two-tier difficulty model (distant for difficulty ≤ 2, near otherwise) is silently defeated for these words.

Also missing (partial):
- DISTANT_PAIRS missing: colors (11 words), family (11), school (21) → these fall through when `useNear=false`
- NEAR_PAIRS missing: professions (22) → falls through when `useNear=true`

**Fix:** add `actions` to both tables; add colors/family/school to DISTANT; add professions to NEAR. Pick pairs that are semantically meaningful for the discrimination task.

---

### CONCERN 2 (LOW) — No defensive guard against double `oncomplete`

**File:** `OddOneOutExercise.svelte:254-260` (`nextRound`)

`nextRound` increments `currentIndex` and calls `oncomplete` when `currentIndex >= rounds.length`, but does NOT early-return if already past the end. In practice, the timer is cleared and `keyboardNavParams.isActive` flips to false after the Svelte flush, making a double-fire very unlikely. But `nextRound` has three call sites (timer callback, `onConfirm`, `skipRound`), and a one-line guard is cheap insurance:
```ts
function nextRound() {
  roundTimer.clear();
  if (currentIndex >= rounds.length) return; // already finished
  currentIndex++;
  if (currentIndex >= rounds.length) {
    oncomplete?.({ score, total: rounds.length, details: results });
  }
}
```

---

### NIT 1 — Redundant filter in `findBaseCategory` fallback

**File:** `OddOneOutExercise.svelte:100-103`

The fallback filters `[...availableCats].filter((c) => !intruderCats.includes(c))`, but `availableCats` IS `catsWithThree` from generateRound:121-131, which already excludes every category in `intruderCats` (via `if (intruderCats.includes(cat)) continue`). The filter is dead code. Harmless but misleading — suggests `availableCats` might contain intruder categories when it can't.

---

### Verified CORRECT (no issue)

1. **Multi-category safety (the spec's main VERIFY concern):** CORRECT. `generateRound` skips intruder categories (`if (intruderCats.includes(cat)) continue` at line 122) AND filters safe words whose categories intersect the intruder (`!getWordCategories(w).some((c) => intruderCats.includes(c))` at line 125). The intruder can never be a member of the base category, even for multi-category words like `{categories: ['food','nature']}`. `findBaseCategory` only picks from `catsWithThree` which is pre-filtered. This is solid.

2. **Timing / `onConfirm`:** CORRECT. Both 'correct' and 'incorrect' feedback advance via Enter (reveal mode, no retry — matches spec). `roundTimer.clear()` in `nextRound` prevents double-advance from timer+keyboard overlap.

3. **Two $effect blocks:** CORRECT, no race. Init effect (tracks `words`/`allWords`) fires on mount/restart; per-round effect (tracks `currentRound`) fires on each advance. Ordering is init→per-round (Svelte runs effects in definition order). Merging them would break per-round resets — the split is structurally necessary (confirmed by prior SIMPLIFICATION review).

4. **Score reporting:** CORRECT. `score` is $derived from `results`; `recordCurrentTrial` pushes to `results` before `nextRound` reads `score`. `results.length === rounds.length` (every round records exactly one trial via the `trialRecorded` guard). `details: results` is read synchronously by the runner.

5. **`recordTrial` exactly-once:** CORRECT. `trialRecorded` guard in `recordCurrentTrial` prevents double-recording. Reset to `false` by the per-round effect on advance. All three paths (correct, incorrect, skip) record exactly once.

6. **Edge cases:** Empty `allWords` → pool is just `words`, works (fewer base candidates). Words with no categories → `getWordCategories` returns `[]`, `generateRound` returns null (line 114), filtered out. Difficulty 2 vs 3 → `useNear = difficulty > 2` matches spec (≤2 distant, >2 near).

7. **Accessibility:** Card `aria-label={card.word}` is adequate (image alt matches). `disabled={feedbackState !== 'none'}` correctly prevents double-taps. Skip button hidden during feedback (Escape still works via keyboard nav — advances, consistent with Enter).

**2026-07-30T09:13:31Z**

## Adversarial Review Pass 2: CORRECTNESS RE-VERIFICATION

svelte-check: 0 errors, 0 warnings. Build: PASS. Tests: 73/73 PASS.
Reviewed OddOneOutExercise.svelte to verify all 4 prior fixes and hunt for remaining correctness bugs.

---

### FIX 1 (Duplicate cards) — VERIFIED CORRECT
Line 201: `const pool = [...new Map([...words, ...allWords].map((w) => [w.id, w])).values()];`
Map keyed by word id produces unique-by-id pool. Last value wins (allWords entries override identical words entries — they are the same data anyway). Matches the pattern in buildDistractors (exercise-helpers.ts:84). Traced the deduped pool through byCategory build (line 154-160): each word appears exactly once per category bucket. shuffleArray(...).slice(0,3) on a bucket can no longer select the same word twice. The intruder is separately filtered by id (line 130). The 4-card grid is now always 4 distinct words.

### FIX 2 (Missing categories in distance tables) — VERIFIED CORRECT
DISTANT_PAIRS additions (lines 58-61): actions/technology, colors/vehicles, family/tools, school/vehicles. All valid Category values; all semantically distant pairs.
NEAR_PAIRS additions (lines 77-79): actions/sports, professions/school, food/animals. All valid; all semantically near.
Coverage check: both tables now cover all 20 categories (verified programmatically). No intruder will silently fall through to the random fallback due to a missing table entry.

### FIX 3 (isFinished guard in nextRound) — VERIFIED CORRECT
Lines 263-270: `if (isFinished) return;` early-exits before incrementing. Traced all scenarios:
  - Mid-session advance: isFinished is false, guard passes, currentIndex++, new round begins. CORRECT.
  - Final-round advance: isFinished is false, guard passes, currentIndex++ == rounds.length, oncomplete fires. CORRECT.
  - Double-call (timer + keyboard overlap): second call sees isFinished=true, early-returns. No double-oncomplete. CORRECT.
Cannot block legitimate advancement: isFinished is only true when currentIndex >= rounds.length, which means no round exists to advance to. Reading a $derived in an event handler returns the fresh value (Svelte 5 signals are lazy-but-current).

### FIX 4 (Dead filter in findBaseCategory fallback) — VERIFIED CORRECT
Lines 107-109: filter removed, replaced with accurate comment. availableCats IS catsWithThree (from generateRound line 125-137), which already excludes every intruder category via `if (intruderCats.includes(cat)) continue`. The removed filter was dead code. Correct deletion.

---

### NEW BUGS FROM CLEANUPS — NONE FOUND

Checked the three cleanups applied alongside the fixes:

1. **Pre-grouped byCategory** (lines 118, 151-165): generateRounds builds the Map once and passes it to each generateRound call. safeByCat is built per-intruder from the pre-grouped buckets. No duplication, no stale data. The $assertion `safeByCat.get(baseCategory)!` (line 144) is safe because baseCategory always comes from catsWithThree, and safeByCat has an entry for every cat in catsWithThree.

2. **Shared getCardState** (lines 285-291): imports from exercise-helpers, calls with correct arg order (i, feedbackState, selectedIndex, currentRound.intruderIndex). Signature matches the shared function exactly.

3. **Removed baseCategory from Round interface** (lines 82-86): baseCategory is now a local const (line 141) used only to look up safeByCat, never stored. Round interface has cards/intruderIndex/intruder only.

---

### cardStates REACTIVITY — CORRECT
Lines 285-291: $derived reads currentRound, feedbackState, selectedIndex, and currentRound.intruderIndex. All are tracked signals. Recomputes on any of: round advance (currentRound changes identity), user tap (selectedIndex changes), feedback transition (feedbackState changes). Verified the template reads cardStates[i] only inside the `:else if !isFinished && currentRound` guard, so currentRound is guaranteed non-null there.

---

### ROUND LIFECYCLE TRACE — NO INCONSISTENCIES

Traced init -> tap -> feedback -> advance -> next round -> completion:
1. Mount: init effect fires (pool deduped, rounds built, currentIndex=0, results=[]). Per-round effect fires (timer cleared, selectedIndex/feedbackState/trialRecorded/startTime reset).
2. selectCard(i): guards on feedbackState==='none'. Sets selectedIndex, feedbackState, plays sound, recordCurrentTrial (trialRecorded guard -> exactly-once). Schedules nextRound via roundTimer.
3. Timer fires -> nextRound: clears timer, isFinished guard passes, currentIndex++. Per-round effect fires for new currentRound, resets all per-round state.
4. Final round: nextRound increments to == rounds.length, oncomplete fires with score (read synchronously from results, which had the last push before nextRound). details: results is the full array.
5. Double-fire blocked: isFinished now true, any subsequent nextRound call early-returns.

No race conditions. No state leaks between rounds. No double-recording. No double-oncomplete.

---

### MINOR OBSERVATIONS (non-blocking, no action required)

- **NIT**: Line 142 `if (!baseCategory) return null;` is defensive dead code. findBaseCategory can only return null when availableCats (catsWithThree) is empty, but line 138 already checked `catsWithThree.size === 0` and returned. Harmless safety net — leaving it is fine.
- **INFO**: The component does not filter words by has_image. It relies on the session generator excluding non-image words upstream (registry marks odd-one-out as imageDependent:true). If a non-image word slips through, the image onerror handler hides the img and the letter fallback displays — not a crash, just degraded UX. Consistent with other image-dependent exercises.
- **INFO**: onrestart prop is declared (line 26) but never called internally. Verified this is consistent across ALL 9 exercise components (grep confirms zero internal callers anywhere). The parent route uses {#key words} to force remount on restart instead.

---

### VERDICT: CLEAN — APPROVED

All 4 fixes are correct. No new bugs introduced by the cleanups. cardStates reactivity is correct. Round lifecycle has no state inconsistencies. All 20 categories covered in both distance tables. Tests/lint/build all green.
