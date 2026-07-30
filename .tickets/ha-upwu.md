---
id: ha-upwu
status: closed
deps: [ha-b6kc]
links: []
created: 2026-07-22T10:13:47Z
type: feature
priority: 1
assignee: Félix Laguna Teno
tags: [i18n, ux, settings]
---
# Add UI language selector; decouple UI language from (Spanish-only) content language

BLOCKED BY the responsive-overflow ticket (T12) — it restructures the settings chips this ticket extends. Do not start until it closes.

CONTEXT: the app ships 4 UI locales (es/ca/eu/en; src/lib/i18n/) and a working locale store, and settings/+page.svelte updateSetting even has a language branch — but there is NO language selector anywhere in the UI. Catalan/Basque/English users cannot switch. Meanwhile the WORD BANK exists only in Spanish (WORDS_ES seeded in +layout.svelte), and every DB query filters by settings.language — so if language were switched to ca/eu/en, every exercise would break with "No hay palabras". The two concepts must be decoupled.

TASK:
1. Data model: split into ui_language (locale for chrome/instructions) and keep the existing language setting as CONTENT language, which stays pinned to es for now. Migration: on first load after update, if language is set, copy it to ui_language default. All i18n locale.set calls use ui_language; all word/session/attempt queries keep using the content language (es).
2. Settings UI: add an "Idioma" section (place it FIRST in settings — elderly users need it findable) with 4 large option buttons: Espanol / Catala / Euskara / English, each labeled in ITS OWN language (never translated — a Catalan speaker lost in a Spanish UI must recognize Catala). Selecting applies live via locale.set and persists.
3. Under the selector show a small note (i18n key, shown only when ui_language is not es): in the selected language, "Los ejercicios de palabras estan disponibles solo en espanol por ahora" (translate properly per locale).
4. While in settings: replace ALL hardcoded UI strings found in the audit with i18n keys in the 4 locale files: the Si/No toggle labels (settings/+page.svelte lines ~211, 237, 258, 298, 319), the delete confirm label "Seguro? Toca de nuevo" (lines ~342-344), OfflineIndicator strings "Sin conexion - modo offline" / "En linea" (OfflineIndicator.svelte lines ~39, 47), InstallPrompt aria-label Cerrar (line ~70).
5. Verify each of the 4 locales end to end: switch to English -> whole chrome switches (home, settings, progress, dialogs), exercises still load Spanish words and work; switch back.

FINAL STEP: close this ticket with tk close so dependent tickets become ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-b6kc. UNBLOCKS: ha-7urx (settings polish) and ha-5i08 (onboarding). FINAL STEP: tk close ha-upwu, then verify with tk ready.

**2026-07-30T10:20:40Z**

## Reuse Review (REUSE issues only)

### Finding 1 — REUSE: language selector reimplements ChipGroup/Chip
File: src/routes/settings/+page.svelte:152-174 (markup) + :435-481 (CSS)
The page ALREADY imports `ChipGroup` (line 5) and uses it two cards below for text_size (line 184) and theme (line 197) — the identical option-selection pattern. The new `.lang-grid`/`.lang-btn` hand-rolls what ChipGroup + Chip already provide: `role=listbox` container, per-option `role=option`, `aria-selected`, active-class toggle, and the focus-visible outline (`outline: 3px solid var(--primary-light); outline-offset: 2px;` — byte-identical to Chip.svelte:55-57).
Cost: ~64 duplicated lines; two parallel listbox implementations on one page, so any a11y/active-state fix must be applied twice.
Existing helper to use instead: `ChipGroup` (src/lib/components/ui/ChipGroup.svelte) + `Chip` (src/lib/components/ui/Chip.svelte). Note the visual divergence is real (2-col grid, full-width, --touch-min 56px, primary-light active vs Chip's 40px pill/primary), so the correct move is to EXTEND ChipGroup with a layout/size variant, not to drop it in verbatim.

### Finding 2 — (answers focus #3) Migration block is dead code, not a duplication
File: src/lib/db/settings.ts:79-88
The migration does NOT duplicate the DEFAULTS loop — it intentionally reads a sibling setting (`language`) rather than a static default, which the loop cannot do. HOWEVER, because `ui_language:'es'` was added to DEFAULTS (line 6), the loop at :71-77 now seeds `ui_language='es'` FIRST inside the same transaction. The subsequent check `if (!hasUiLanguage)` at :82 is therefore always false, so the migration never runs. Net effect: existing ca/eu/en users get their UI flipped to Spanish instead of inheriting their content language. To make the intended migration work, exclude ui_language from the DEFAULTS-seeding loop (or run the migration before the loop).
Not flagged as a style/lint issue; raised because it is the direct answer to 'does the migration duplicate existing logic' — it collides with it.

**2026-07-30T10:27:18Z**

## Adversarial Code Review — branch ha-upwu vs origin/master

**Build:** PASS (svelte-check 0 errors, npm run build succeeds)
**i18n completeness:** PASS — all new keys present in all 4 locales
**Migration logic:** PASS — correctly fixed in commit 238f6b7 (moved inside the DEFAULTS loop's `!existing` block; verified for both fresh and upgrading installs)

---

### CRITICAL — Active language button fails WCAG contrast in ALL themes

**File:** `src/routes/settings/+page.svelte:454-457`
**Severity:** CRITICAL (accessibility)

`.lang-btn-active` uses `background: var(--primary-light); color: var(--primary)` — two adjacent shades of blue. Measured contrast ratios:

| Theme | Ratio | WCAG AA (4.5:1) |
|---|---|---|
| Dark (default) | 1.45:1 | FAIL |
| Light | 1.41:1 | FAIL |
| High-contrast dark | 1.41:1 | FAIL |
| High-contrast light | 1.30:1 | FAIL |

The selected language's text is nearly illegible against its own background. This is especially damaging in high-contrast mode — the mode designed for low-vision users.

The existing `Chip` component (`src/lib/components/ui/Chip.svelte:23`) uses `background: var(--primary); color: #fff` which achieves 3.7-6.7:1. The new button deviates from this established pattern.

**Fix:** Change `.lang-btn-active` to:
```css
.lang-btn-active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
```

---

### MEDIUM — Import of old backups snaps UI to Spanish

**File:** `src/routes/settings/+page.svelte:87-92` (`handleImport`)

Importing a backup from before this feature (no `ui_language` key) writes all old settings then calls `loadSettings()`. `getAllSettings()` defaults the missing `ui_language` to `'es'`. If the backup had `language: 'ca'`, the user's UI flips to Spanish instead of inheriting their content language.

**Fix:** Call `await initDefaults()` after the import loop and before `loadSettings()` — it will detect the missing `ui_language` and default it to the existing `language` value.

---

### MEDIUM — Touch targets are 48px, below the 56px convention

**File:** `src/routes/settings/+page.svelte:440`
`.lang-btn` uses `min-height: var(--touch-min)` which resolves to 48px (theme.css:89). CLAUDE.md mandates min 56px. This matches every other button in the app (pre-existing token discrepancy), but the new buttons inherit the gap.

**Fix:** Either bump `--touch-min` to 56px globally (affects all components), or set `min-height: 56px` on `.lang-btn` specifically.

---

### LOW — English offline string is redundant

**File:** `src/lib/i18n/en.json:315`
`"offline_mode": "Offline — offline mode"` repeats "offline". Compare es: "Sin conexión — modo offline".

**Fix:** Use "No connection — offline mode" or just "Offline mode".

---

### Verified correct (no issues)

- Migration in `initDefaults()`: works for fresh installs (both `language` and `ui_language` seed to 'es') and upgrading installs (`ui_language` inherits existing `language` value). The first-commit dead-code bug was properly fixed in 238f6b7.
- `LANGUAGES` constant: correctly exported from `types/index.ts`, correctly imported in settings page.
- `OfflineIndicator.svelte`: correctly imports `t` from `/i18n` and uses `\$t('offline.offline_mode')` / `\$t('offline.online')`.
- Settings selector: correctly binds to `settings.ui_language`, calls `updateSetting('ui_language', ...)`, which calls `locale.set()`.
- All `settings.language` usages (`+page.svelte:67`, `review-failures`, `practice/[category]`) are content queries — correctly left unchanged.
- `locale.set()` only called with `ui_language` in layout and settings — correct decoupling.
- CSS at 375px: 2-column grid fits comfortably (each button ~160px wide).
- CSS at 768px landscape: language card (first-child) and data card (last-child) correctly span full width; appearance and audio cards are side-by-side.

**2026-07-30T10:33:43Z**

IMPLEMENTED: UI language selector + content/UI decoupling.

Changes:
1. Data model: added ui_language to AppSettings (defaults to 'es'). Migration in initDefaults resolves ui_language from existing content language for upgrading installs (same pattern as theme/prefersDark).
2. Layout: locale.set now uses settings.ui_language; all word/session/attempt queries still use settings.language (es).
3. Settings UI: new Idioma card placed FIRST with 4 buttons (Español/Català/Euskara/English) labeled in their own language. Active state uses primary bg + white text (WCAG AA). Content-language note shown when ui ≠ content language.
4. Replaced ALL hardcoded strings: Si/No toggles → common.yes/no, delete confirm → settings.confirm_delete, OfflineIndicator → offline.offline_mode/online, InstallPrompt aria-label → common.close.
5. New i18n keys in all 4 locales: common.yes/no, settings.ui_language/confirm_delete/words_spanish_only, offline.offline_mode/online.
6. Extracted LANGUAGES constant to types/index.ts (mirrors CATEGORIES pattern).
7. Import handler calls initDefaults() to seed ui_language from imported backups.

Verified: npm run build OK, svelte-check 0 errors/0 warnings, 73/73 tests pass. Reviews converged (2 rounds simplify + adversarial).
