---
id: ha-m2z7
status: closed
deps: [ha-aslk]
links: []
created: 2026-07-22T10:10:54Z
type: task
priority: 1
assignee: Félix Laguna Teno
tags: [ux, exercises, navigation]
---
# Exit confirmation dialog mid-exercise + fix nav chrome and back-navigation bugs

BLOCKED BY the session-lifecycle ticket (T7) — it introduces the delete-open-session-on-abandon behavior this ticket builds on.

CONTEXT: during an exercise the back arrow (src/routes/exercises/[type]/+page.svelte line ~200) immediately calls goto(base + /exercises) which is a redirect page (src/routes/exercises/+page.ts) that bounces to home. An elderly patient can lose a 10-word run with one accidental tap, with no confirmation.

ALSO TWO NAV BUGS:
1. The bounce: back goes to /exercises which 302-redirects to /. FIX: go directly to base + /.
2. The bottom nav is supposed to hide during exercises but the check in src/routes/+layout.svelte (hideNav derived, lines 44-47) tests p.startsWith("/exercises/") and path-segment count === 3, which BREAKS on the GitHub Pages deployment where base is /habla-anomia (pathname /habla-anomia/exercises/x has 4 segments and does not start with /exercises/). FIX: compare against base-prefixed paths (use the base import) so nav hiding works both locally and deployed.

TASK:
1. Fix both nav bugs above.
2. Add an exit-confirmation dialog when the user taps back mid-exercise (i.e. exercise started, not finished, at least 1 word seen): use the existing Modal component (src/lib/components/ui/Modal.svelte — currently unused, focus-trap ready). Copy (add i18n keys to all 4 locales under common.*): title "Salir del ejercicio?" (with opening inverted question mark), body "Perderas el progreso de este ejercicio.", confirm "Salir", cancel "Continuar". Buttons min 56px tall, confirm styled neutral (NOT red — leaving is a valid choice, do not scare elderly users).
3. On confirm: delete the open session (function from T7) and goto home. On cancel: close dialog, stay.
4. If the exercise has not started (still loading) or is finished (results overlay visible), back exits directly without dialog.

VERIFY: make dev — mid-exercise back shows the dialog, Escape/cancel stays, confirm leaves cleanly with no dangling session row; bottom nav is hidden during an exercise and visible elsewhere; test with BASE_PATH set (BASE_PATH=/habla-anomia npm run build && npx vite preview or the docker flow) to confirm the deployed-path behavior.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-aslk (referenced as T7 in the description). Do not start until tk show ha-aslk reports closed.
