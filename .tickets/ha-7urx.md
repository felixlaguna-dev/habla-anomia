---
id: ha-7urx
status: closed
deps: [ha-upwu]
links: [ha-0au3]
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ux, settings]
---
# Settings UX polish: modal delete confirm, feedback toasts, voice preview, real haptics

BLOCKED BY the language-selector ticket (T13) — it restructures the settings page this ticket polishes. Do not start until it closes.

CONTEXT: settings work but several interactions are wrong for elderly users, and two settings are placebo:
- "Borrar datos" uses a double-tap-within-3s confirm with a hardcoded warning label — easy to mis-trigger, no explicit cancel.
- Export/import give NO feedback (silent success, console-only errors).
- "Vibracion" (haptic_enabled) is stored but navigator.vibrate is never called anywhere — a placebo toggle.
- Speech rate slider has no way to hear the effect.
- The Toast component (src/lib/components/ui/Toast.svelte) and Modal exist but are unused.

TASK:
1. Replace the double-tap delete with the Modal component: title "Borrar todos los datos?", body explaining it deletes progress but not the app, explicit red confirm "Borrar todo" + neutral cancel "Cancelar" (i18n x4). On success show a Toast "Datos borrados".
2. Export: after download show Toast "Datos exportados"; on failure show error Toast. Import: validate the JSON (has words/attempts/sessions keys), show success Toast with counts ("Importadas N sesiones") or a clear error Toast; never silently fail. Also fix Toast.svelte's always-true visibility check (line ~37) while touching it.
3. Implement haptics for real: create src/lib/utils/haptics.ts with vibrateError(pattern ~[80,40,80]) and vibrateSuccess([30]) gated on haptic_enabled (cache the setting like sounds.ts does after the toolkit ticket) + navigator.vibrate support check; call on incorrect answers (stronger) and exercise completion (gentle) from the shared FeedbackBanner/recordTrial path. If the toolkit ticket is not merged when you start, wire haptics inside it instead — coordinate via ticket notes.
4. Speech rate: add a "Probar" button next to the slider that speaks a fixed sample sentence (i18n x4: "Hola, esta es mi voz") at the current rate using SpeechSynthesisService.
5. Reorder sections for elderly priority: Idioma, Apariencia (text size first), Audio y voz, Datos, Acerca de.

VERIFY on a real Android device or DevTools sensor emulation for vibrate if possible (desktop Chrome supports navigator.vibrate as no-op — at minimum assert no crash); all dialogs/toasts localized in 4 locales; delete flow requires explicit modal confirm.

FINAL STEP: close this ticket with tk close so dependent tickets become ready.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-upwu. UNBLOCKS: ha-lrsi (session length) and ha-ceyt (voice picker). FINAL STEP: tk close ha-7urx, then verify with tk ready.
