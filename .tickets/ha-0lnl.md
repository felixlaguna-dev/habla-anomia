---
id: ha-0lnl
status: closed
deps: [ha-klrd]
links: []
created: 2026-07-22T10:13:47Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [ux, exercises]
---
# Rework Nombrar por categoria: untimed by default, teaching feedback, opt-in challenge mode

BLOCKED BY the migrate-all-exercises ticket (T14) — rework the migrated version, not the legacy file. Do not start until it closes.

CONTEXT: GenerativeNaming (src/lib/components/exercises/GenerativeNamingExercise.svelte) is the odd one out: a 60-second countdown multi-select where the patient taps every word belonging to a category from a mixed pool. Problems observed: it is the ONLY timed exercise (time pressure is contraindicated for many aphasia patients and the setting timer_enabled sounds global but only affects this), distractor taps just flash red with no explanation, invalid picks and missed words are recorded but the patient gets no learning moment, and the intro screen underexplains ("Nombra todo lo que puedas de: X" — but you TAP, not name).

REWORK (keep the category-fluency concept):
1. Untimed by default: the round simply shows "Encuentra todas las palabras de: <category>" with a live counter "Encontradas: N de M" (target count VISIBLE — patients need to know when they are done). The exercise ends when all M found or the patient taps "Terminar".
2. "Modo desafio" (challenge mode): an optional toggle ON THE INTRO SCREEN (default off, remembers last choice in a setting) that enables the 60s timer for patients who want it. The global timer_enabled setting dies here: repurpose it as the default value of this toggle, and relabel it in settings to "Modo desafio con tiempo (Nombrar por categoria)" so it stops sounding global (i18n x4).
3. Distractor feedback that teaches: tapping a non-member shows a brief inline note naming its real category ("Tijeras es de: Herramientas" — build from word categories + i18n) instead of a bare red X.
4. Intro screen rewording (i18n x4): explain the actual action ("Toca todas las palabras que pertenecen a la categoria").
5. End state: reuse the standard oncomplete flow (score = found, total = M). Missed words are listed in the results overlay incorrect section (details array) so retry-mistakes works for this exercise too.
6. Fix the Timer component interval churn while here: src/lib/components/ui/Timer.svelte tears down and recreates its interval every tick because the countdown effect reads remaining (line ~25-53); restructure so the interval is created once per running-state change (store remaining via untrack or use setInterval with functional update).

VERIFY: full run untimed (find-all + terminar early), full run in challenge mode (timeout path), distractor notes correct, results overlay integration, timer no longer drifts (log ticks over 60s and compare wall clock within ~1s).
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-klrd (T14). Do not start until it is closed.
