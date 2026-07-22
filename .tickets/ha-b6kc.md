---
id: ha-b6kc
status: closed
deps: []
links: []
created: 2026-07-22T10:10:54Z
type: bug
priority: 1
assignee: Félix Laguna Teno
tags: [bug, ui, responsive]
---
# Fix responsive overflow/truncation bugs found in screenshot QA

CONTEXT: screenshot QA at 375x667 (phone), 768x1024 and 1024x768 (tablet) found these concrete layout bugs. Fix each; keep changes small and CSS-first. Test at exactly those 3 viewports plus 360px.

BUG LIST:
1. Home stats grid clips the third card: at 375px the "Precision" card is cut off / hidden (src/routes/+page.svelte .stats-grid is repeat(3,1fr) with overflow:hidden). FIX: allow cards to shrink (min-width:0 on grid children, smaller padding at <400px) so all three always fit; never hide a stat.
2. Home plan labels are ellipsis-truncated ("Nombrar ima...", "Practica con pista...") because .plan-label/.plan-reason force nowrap. For word-finding patients, truncated words are actively harmful. FIX: allow wrapping to 2 lines (overflow-wrap normal, remove white-space:nowrap), keep the Empezar button aligned top.
3. Settings text-size ChipGroup overflows: at 375px "Grande" and "Muy grande" are clipped off-screen with no scroll affordance (src/lib/components/ui/ChipGroup.svelte is a nowrap horizontal row). FIX: let chips wrap to multiple rows (flex-wrap) — never hide options.
4. Landscape tablet home: the 2-column plan grid clips the second card at the right edge (1024x768). Inspect .plan-list landscape media query in +page.svelte for an overflow (grid wider than main-content padding allows); fix so both columns fit fully.
5. CategorySortingExercise: category buttons break words mid-word rendering "Escu ela", "Clim a", "Alim ento s" — find the word-break/width CSS on the category button labels and fix (min-width, overflow-wrap:normal, no word-break:break-all). Labels must wrap only at spaces.
6. Category labels render in Title Case ("Partes Del Cuerpo") due to text-transform:capitalize somewhere in CategorySorting styles; Spanish uses sentence case: "Partes del cuerpo". Remove the transform; the i18n strings are already correctly cased.
7. Exercise page header title truncates ("Caracteristicas sem..."). FIX: allow the h1 to wrap to 2 lines on narrow screens instead of ellipsis (src/routes/exercises/[type]/+page.svelte .exercise-title).
8. Toast.svelte and OfflineIndicator.svelte anchor at hardcoded bottom offsets (5rem / 80px) that can collide with the 64-72px BottomNav; anchor them to a shared calc using the same nav height + safe-area variables the layout uses.

ACCEPTANCE: at 360, 375, 768, 1024x768 — no horizontal page scroll anywhere, no clipped interactive elements, no mid-word breaks, all text readable. Include a quick before/after note per bug in the ticket notes when closing.

FINAL STEP: close this ticket with tk close so dependent tickets become ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

UNBLOCKS: ha-upwu (language selector) and contributes to ha-oq1j (home redesign). FINAL STEP: tk close ha-b6kc, then verify with tk ready.

**2026-07-22T18:31:32Z**

BEFORE/AFTER (verified at 360/375/768/1024x768 via headless chromium — 0 horizontal overflow, no clipped elements, no mid-word breaks, all text readable; npm run build OK, svelte-check 0 errors):
1. Stats grid: BEFORE 3rd card clipped (overflow:hidden + 1fr). AFTER minmax(0,1fr) + removed overflow:hidden; all 3 cards visible; stat-label wraps (no ellipsis); Card padding reduced via new --card-pad var at <400px.
2. Plan labels: BEFORE 'Nombrar ima...' / 'Practica con pista...' (nowrap+ellipsis). AFTER overflow-wrap:break-word, full text shown; plan-item aligns flex-start (Empezar button top-aligned).
3. ChipGroup: BEFORE 'Grande'/'Muy grande' clipped off-screen (overflow-x:auto nowrap). AFTER flex-wrap:wrap, all options visible (measured 2-3 rows).
4. Landscape plan grid: BEFORE 2nd card clipped at right edge. AFTER repeat(2, minmax(0,1fr)); both columns fit (measured 467px each at 1024x768).
5. Category buttons: BEFORE 'Escu ela'/'Clim a' mid-word breaks (word-break:break-word + hyphens:auto + 70px min-width). AFTER word-break removed, min-width 8rem, flex-wrap:wrap; labels wrap only at spaces.
6. Category labels: BEFORE 'Partes Del Cuerpo' (text-transform:capitalize). AFTER capitalize removed from .category-btn + .summary-bin-label; i18n sentence case respected. (Kept capitalize on .result-word — words stored lowercase.)
7. Exercise title: BEFORE 'Caracteristicas sem...' (nowrap+ellipsis). AFTER -webkit-line-clamp:2 + overflow-wrap; title wraps to 2 lines.
8. Toast/OfflineIndicator: BEFORE hardcoded bottom:80px/5rem. AFTER anchored to shared --above-bottom-nav token (calc of new --bottom-nav-height[64/72px] + --safe-bottom + --space-sm), also consumed by layout + BottomNav.
