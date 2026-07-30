---
id: ha-wuk0
status: closed
deps: [ha-nay0]
links: []
created: 2026-07-22T10:16:27Z
type: feature
priority: 3
assignee: Félix Laguna Teno
tags: [feature, progress]
---
# Printable therapist progress report (print-to-PDF)

BLOCKED BY the progress-cleanup ticket (T17) — it owns the progress page structure this ticket extends. Do not start until it closes.

CONTEXT: speech therapists and family caregivers need to SEE progress between visits. The app stores everything locally; the only export is a raw JSON blob. A printable, readable report is the missing piece (print-to-PDF covers PDF without any library).

TASK:
1. Add a "Informe para el terapeuta" button on the progress page (i18n x4) that navigates to /progress/report — a clean, print-optimized page.
2. Report content (all from existing helpers — getWeeklySummary, getCategoryBreakdown, getExerciseBreakdown, getSRStats, getStreakInfo, getSessions): patient-free header (NO name — the app stores none; just date range + app name), last-30-days summary (sessions, distinct words practiced, overall accuracy, streak), accuracy by exercise table, accuracy by category table (sorted weakest first — that is what a therapist acts on), words mastered/learning/new counts, and the 14-day accuracy mini-chart (reuse the component from the progress ticket).
3. Print CSS: @media print — white background, black text, no nav/buttons, A4-friendly margins, page-break-inside avoid on tables. A visible "Imprimir" button (window.print()) on screen, hidden in print. The bottom nav must not render on the printed page.
4. Add a small note line on the report: generated on <date> by Habla Anomia (localized date via ui_language).
5. Data beyond 30 days: keep scope to 30 days; note in code comments where to extend.

VERIFY: with seeded/self-played data, open the report, Chrome print preview -> 1-2 clean A4 pages, readable in black and white, tables not split mid-row; localized in all 4 UI languages; route works under the /habla-anomia base path (use the paths helpers for any internal links).
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-nay0 (T17). Do not start until it is closed.
