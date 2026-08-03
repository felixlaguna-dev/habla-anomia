---
id: ha-lrsi
status: closed
deps: [ha-7urx]
links: []
created: 2026-07-22T10:16:27Z
type: feature
priority: 3
assignee: Félix Laguna Teno
tags: [feature, settings]
---
# Session length setting (5/10/15 words per exercise)

BLOCKED BY the settings-polish ticket (T18) — it reorders the settings page this ticket adds to. Do not start until it closes.

CONTEXT: sessions are fixed at 10 words (generateSession(language, type, 10) in src/routes/exercises/[type]/+page.svelte). Elderly users in early recovery fatigue quickly; caregivers asked-for-in-spirit shorter sessions; advanced users may want longer.

TASK:
1. New setting session_length: 5 | 10 | 15 (default 10) — add to AppSettings type, DEFAULTS in src/lib/db/settings.ts, and a settings UI row ("Ejercicios por sesion") with three large option buttons showing the numbers, under the Audio y voz section or a new Ejercicios section (i18n x4).
2. The exercise runner passes settings.session_length to generateSession. Exercises that derive counts from words.length adapt automatically — verify GenerativeNaming (pool sizing) and CategorySorting (per-category split) still behave sanely at 5 and 15 (category-sorting needs >= 2 categories; with 5 words the generator picks fewer categories — confirm it still yields >= 2 or shows its need_more_categories message).
3. Results overlay and progress statistics use total from the actual run — verify nothing hardcodes 10 (grep for the number 10 in the runner + exercises; fix stragglers like slice(0, 10) in the results word chips: make it slice(0, session_length) or just show all).
4. The daily-plan reason strings that mention counts stay count-agnostic (check home page after its redesign).

VERIFY: set 5 -> picture naming runs exactly 5 words; set 15 -> 15 (given enough imaged words); category sorting still works at both; setting persists.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7urx (T18). Do not start until it is closed.

**2026-08-03T08:18:20Z**

## Code Review: APPROVED WITH 1 MINOR ISSUE

**Files reviewed:**
- src/lib/types/index.ts (AppSettings.session_length: 5 | 10 | 15)
- src/lib/db/settings.ts (DEFAULTS, getAllSettings fallback)
- src/routes/settings/+page.svelte (ChipGroup UI)
- src/routes/exercises/[type]/+page.svelte (generateSession call + results screen)
- src/lib/i18n/{es,ca,eu,en}.json (translations)
- src/lib/engine/session-generator.ts (CategorySorting math)
- src/lib/components/exercises/CategorySortingExercise.svelte (bin derivation)
- src/lib/components/exercises/GenerativeNamingExercise.svelte (pool sizing)
- src/routes/+layout.svelte (initDefaults flow)
- src/routes/onboarding/+page.svelte (onboarding skip path)

**Checks:**
- svelte-check (npm run check): PASS — 0 errors, 0 warnings
- vitest (npm test): PASS — 73/73
- Vite build (npm run build): PASS

---

### Issue 1 [MINOR]: CategorySorting drops category bins ~43% of the time at session_length=5

**File:** src/lib/engine/session-generator.ts:84-98
**Problem:** At session_length=5, the generator picks min(4, 5)=4 categories with perCat=max(2, ceil(5/4))=2. Pool = 4 cats x 2 = 8 words, then shuffleArray + slice(0, 5) drops 3 words randomly. Since each category has only 2 words, there is a ~43% probability that both words from at least one category are dropped. The CategorySortingExercise component derives its bins from the actual word list (line 42: `[...new Set(words.flatMap(w => getWordCategories(w)))]`), so the user sees 3 bins instead of the intended 4 about 43% of the time.

At session_length=10 (old default): perCat=3, pool=12, slice to 10 (drop 2). Impossible to empty a category (only drop 2 < 3 perCat). So this is a newly exposed issue.

At session_length=15: perCat=4, pool=16, slice to 15 (drop 1). Also impossible to empty a category.

The exercise still works (minimum 2 categories is always maintained — dropping 2 categories would require excluding 4 words from 8 while keeping 5, which is impossible), but the bin count is inconsistent run-to-run.

**Suggestion:** Reduce category count at low session_length. For example: `Math.min(Math.max(2, Math.ceil(wordCount / 2)), 4)` would give 3 categories at wordCount=5 (perCat=2, pool=6, slice to 5 — only 1 dropped, impossible to empty a bin). Alternatively, keep 4 categories but distribute the slice evenly across categories instead of shuffling all words together.

---

### Verified correct (no issues):

1. **End-to-end data flow:** type (5|10|15) -> DEFAULTS (10) -> getAllSettings() ?? fallback -> exercise runner (s.session_length) -> generateSession (wordCount). Correct.
2. **Existing install upgrade:** initDefaults() runs on every app load in +layout.svelte and seeds session_length:10 for missing keys. getAllSettings() also has ?? DEFAULTS.session_length fallback. Both paths correct.
3. **CategorySorting at session_length=15:** 4 cats x 4 perCat = 16, slice to 15. Correct.
4. **GenerativeNaming distractors:** distractorCount = max(4, 8 - words.length) always yields 4. Pool = words + 4. Correct.
5. **ChipGroup conversions:** String(5) -> '5', Number('5') -> 5. Correct for all three options.
6. **as const on sessionLengthOptions:** Fine. The readonly literal-typed array maps cleanly to ChipOption[].
7. **slice(0, 10) removal in results screen:** Correct and necessary — at session_length=15 the old cap would hide 5 words.
8. **No hardcoded 10 remaining in the exercise flow.** The recent10 on the home page is about averaging session accuracy (unrelated).

### Nit: Unrelated package-lock.json noise
The diff removes 'peer: true' from 11 packages in package-lock.json. package.json is unchanged. This is noise from a different npm version. Not a bug, but ideally should be in a separate commit.

**2026-08-03T08:22:02Z**

Implemented: session_length setting (5/10/15) in AppSettings, ChipGroup selector in settings page, exercise runner uses settings.session_length, CategorySorting category count scales with wordCount to prevent empty bins. Reviewed and clean.
