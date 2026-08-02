---
id: ha-oq1j
status: closed
deps: [ha-aslk, ha-b6kc, ha-2t4m]
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ux, ui, home]
---
# Home dashboard redesign: primary CTA first, truthful stats, honest daily plan

BLOCKED BY: session-lifecycle (T7), responsive-overflow fixes (T12), and the exercise metadata module (T28-metadata). Do not start until all three are closed.

CONTEXT: the home dashboard (src/routes/+page.svelte) is the daily entry point for an elderly aphasia patient, and it currently front-loads branding instead of action, and lies in several places:
- The stat labeled "Palabras practicadas" actually shows the SESSION count (line ~201) — and getSessions caps at 100 so it also clamps.
- Plan items are marked completed by INDEX (class:completed={i < todayCompleted}) — completing picture-naming three times marks all three plan slots done even if the other exercises were never touched.
- Plan "reasons" are a hardcoded map mostly unrelated to reality ("Practica con pistas de sonido" shown for picture naming regardless).
- The greeting renders "Buenos dias!" without the opening inverted exclamation (template appends a bare "!"); Spanish requires it.
- Above the fold: greeting, title, tagline, THEN stats, THEN the plan — the primary action is a small pill button far down.

REDESIGN (keep it calm and readable, this is a health app for elderly users):
1. Lead with action: a single hero card at top — "Continuar con: <next recommended exercise>" with a HUGE start button (full width, min 72px tall). Next = first uncompleted plan item today. Greeting stays as one modest line (with correct inverted punctuation via a single i18n string like "Buenos dias" composed correctly — put the punctuation IN the i18n value, not the template). Demote title/tagline to small text or remove (the app name is in the install icon; patients know where they are).
2. Truthful stats row (all three visible at every width — T12 fixed the clipping): Hoy (exercises completed today / plan size), Racha (days), Precision (avg of last 10 COMPLETED sessions). Rename the mislabeled stat: show "Sesiones" or compute real distinct words practiced (from attempts table — getDailyStats already computes words_practiced per day; reuse).
3. Honest plan: mark a plan item completed only when a session of THAT exercise type was completed today (sessions now record exercise_types — T7). Reasons must be computed, not canned: due-word count for SR-driven picks (N palabras para repasar), the actual weakest category name for category-driven picks (Refuerza: <category label>), or "Nuevo para ti" for never-tried types. Delete the fake reasonMap.
4. Keep the all-exercises grid below (using the shared exercise metadata module for icon/color/label) with its corner-badge icons made legible (at least 1.5rem glyph inside a 2.5rem tile, not the current 0.7rem emoji-in-a-dot).
5. Empty/new-user state: if no sessions ever, replace stats with a friendly single-line invitation (key exists: dashboard.no_sessions_yet).

VERIFY at 375/768/1024-landscape, dark+light: no truncation, hero readable, plan completion updates live after finishing an exercise (complete one and return home).
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-aslk (T7), ha-b6kc (T12), ha-2t4m (T28-metadata). Do not start until all three closed.
