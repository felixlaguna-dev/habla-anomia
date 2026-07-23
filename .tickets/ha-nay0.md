---
id: ha-nay0
status: closed
deps: []
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ux, progress, stats]
---
# Progress page: remove dead code, truthful labels, 14-day accuracy chart + trend

CONTEXT: the progress page (src/routes/progress/+page.svelte, 667 lines) works but carries dead code and two dishonest labels, and shows no evolution over time (the single most motivating stat for rehab patients and their families).

TASK:
1. Remove dead code: unused imports calculateImprovementTrend + ProgressBar (lines ~4, 16), never-true showClearModal + its whole Modal block (lines ~357-371), unreferenced handleExport/handleImport/handleClearData (lines ~96-151 — settings owns these now), unused totalWords state.
2. Fix labels: "Precision general" actually shows LAST-7-DAYS accuracy (getWeeklySummary) — either relabel to "Precision (7 dias)" via i18n or compute true overall from all attempts; pick relabel (cheaper, clearer).
3. Dates render via toLocaleDateString(undefined,...) = browser locale, mismatching the app locale — pass the app ui_language.
4. Add a simple accuracy-over-time view: last 14 days as vertical bars (getAccuracyOverTime(14) exists in src/lib/db/attempts.ts) — pure CSS/SVG bars, no chart library. Days with no attempts render as empty slots. Label with weekday initials in the app locale. Color bars by the existing accuracy color rule (>=80 success, >=50 warning, else error).
5. Wire calculateImprovementTrend (src/lib/engine/statistics.ts) to show one line above the chart: "Tendencia: mejorando / estable / bajando" with an arrow, i18n in 4 locales.
6. Session history rows should now show WHICH exercise each session was (sessions record exercise_types after the lifecycle ticket; if that ticket is not merged yet, render gracefully when the array is empty).
7. Keep the friendly empty state.

VERIFY: with real data (play a few exercises across 2 days if possible, or temporarily seed fake sessions in dev console): chart renders, trend label sane, labels truthful, no dead imports remain (svelte-check unused warnings for this file = 0).

FINAL STEP: close this ticket with tk close so the therapist-report ticket becomes ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

UNBLOCKS: ha-wuk0 (therapist report). FINAL STEP: tk close ha-nay0, then verify with tk ready.

**2026-07-22T20:29:18Z**

DONE: 14-day accuracy chart (getAccuracyOverTime) + trend label (calculateImprovementTrend) wired on progress page; relabeled overall_accuracy to 'Precision (7 dias)'; locale-aware dates (formatDate/weekdayInitial take UI locale); removed dead code (ProgressBar/Modal imports, showClearModal+modal block, handleExport/handleImport/handleClearData, totalWords). Verified: svelte-check 0 errors (7 pre-existing warnings unrelated), build OK, chart renders 14 bars with correct trend/labels via puppeteer. Merged to master dcd6ad9.
