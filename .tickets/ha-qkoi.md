---
id: ha-qkoi
status: closed
deps: [ha-klrd]
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ui, ux, exercises]
---
# Exercise screen layout polish: fill tablet space, fit phone fold, focus ring, hint consistency

BLOCKED BY the migrate-all-exercises ticket (T14) — layout polish must land on the shared shell, not on 8 legacy layouts. Do not start until it closes.

CONTEXT: screenshot QA on tablet (768x1024 and 1024x768) shows every exercise squeezed into the top ~40 percent of the screen with a huge dead area below; on phones the image + question + 4 options do not fit and the patient must scroll to see options. Also: the exercise page h1 receives programmatic focus on load (for screen readers) and paints a big blue focus ring around the title on every load — visual noise.

TASK (all in the shared ExerciseShell / runner page so all 8 benefit):
1. Vertical rhythm: make the exercise fill the viewport height (flex column, min-height 100dvh minus header) — image area flexes, options anchor comfortably below, hint/skip row at the bottom. On tablets scale UP: image up to ~45vh, option buttons min 72px tall, font-size-xl. No dead half-screen.
2. Phone: everything visible without scrolling for 4-option exercises at 375x667 — reduce image max-height (~30vh) so options are above the fold; if it cannot fit, options take priority over image size.
3. Focus ring: keep heading focus for screen readers but suppress the visible ring for programmatic focus (heading gets outline:none on :focus while retaining :focus-visible styles elsewhere; or focus a visually-hidden live region instead).
4. Hint/cue counter consistency: today three styles exist — "Pista (5 de 5)" counting down, "Otra pista (0/5)" counting up, "(4 restantes)". Standardize on one pattern everywhere: button label "Pista" plus counter "N de M usadas" (i18n key with params in all 4 locales), and 5 unlabeled indicator dots get aria-labels + a visible legend tooltip-free (small text under dots: "Pistas usadas: N de M").
5. Unify Pista/Saltar button styling across themes (screenshot shows Pista as gray chip in dark but bright primary blue in light) — one secondary-button style from theme tokens in both themes.
6. Verify all 8 exercises at 375x667, 768x1024, 1024x768 in dark and light: no scroll needed to answer (except semantic-features 5-step which may scroll), no focus ring flash, consistent hint UI.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-klrd (T14). Do not start until it is closed.
