---
id: ha-e3bc
status: closed
deps: []
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [pwa, ui]
---
# PWA manifest fixes: unlock orientation, proper maskable icons, coherent brand colors

CONTEXT: PWA metadata contradicts the product:
- static/manifest.json sets orientation "portrait" — but the app ships extensive landscape-tablet CSS (home, settings, progress, exercise layouts all have orientation:landscape media queries). An installed PWA is thus LOCKED to portrait and those layouts are unreachable — tablets are the primary target device.
- Icons: only icon-192.png (820 bytes) and icon-512.png (2.6 KB), with the plain 512 reused as maskable WITHOUT safe-zone padding — Android adaptive icons will crop it.
- Brand colors disagree: manifest theme_color #4f46e5 (indigo), background_color #1a1a2e, meta theme-color #4f46e5, while the app really uses --primary #3b82f6 on --bg #0f172a (or light equivalents).

TASK:
1. Set orientation to "any".
2. Produce a proper icon set from a single source SVG (static/favicon.svg exists as a start; if it is too plain, design a simple bold glyph — a speech bubble with "H" — flat, 2 colors, readable at 48px): export 192, 512, and a dedicated maskable 512 with 20 percent safe-zone padding (icon content within the inner 80 percent). Add them to manifest icons with correct purpose fields ("any" vs "maskable" as separate entries). Use a script (sharp) checked into scripts/ so icons are reproducible.
3. Align colors: manifest background_color = the light theme --bg value; theme_color = --primary; update the hardcoded meta theme-color in src/routes/+layout.svelte to match (or make it theme-reactive if trivial).
4. Add basic shortcuts to the manifest (optional but nice): "Empezar ejercicio" -> /exercises/picture-naming, "Progreso" -> /progress (mind the /habla-anomia base path on GitHub Pages — use relative URLs as the manifest is served from the app root).
5. Verify: npm run build; Lighthouse PWA audit (or Chrome devtools Application tab) shows installable, maskable icon passes the maskable preview, orientation unlocked; test landscape on a tablet or emulation after install if possible.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T19:06:42Z**

Implemented: orientation=any; maskable icon set from single SVG (scripts/generate-icons.mjs, sharp) — pixel-verified full-bleed + content within inner 80% safe zone; theme_color/meta theme-color aligned to --primary (#3b82f6) and made theme-reactive via getComputedStyle(--primary) in applyAppearance (theme.css stays single source); duplicate meta theme-color removed (now only in app.html); shortcuts added with relative URLs (exercises/picture-naming, progress) so the /habla-anomia base path resolves correctly.

FLAGS (not changed, for user/reviewer):
1) background_color=#f8fafc per ticket spec, but app defaults to DARK theme (--bg #0f172a) -> PWA launch splash will flash light-before-dark, and theme_color(dark)/background_color(light) are inconsistent. If splash coherence matters, set background_color=#0f172a. Left as-is because the ticket explicitly says 'light theme --bg value'.
2) PRE-EXISTING (out of scope): the service worker never registers — vite-plugin-pwa emits registerSW.js but nothing imports virtual:pwa-register and the script is not injected into the HTML, so swRegistered=false and the PWA is NOT installable in practice. This blocks the ticket's 'shows installable' verification. Recommend a follow-up ticket to wire SW registration. Verified npm run build + npm run check (0 errors, 7 warnings = baseline).
