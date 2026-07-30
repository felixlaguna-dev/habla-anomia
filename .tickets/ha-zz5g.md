---
id: ha-zz5g
status: closed
deps: [ha-7so7]
links: []
created: 2026-07-22T10:16:27Z
type: feature
priority: 3
assignee: Félix Laguna Teno
tags: [feature, exercises]
---
# New exercise: Verdadero o falso (yes/no semantic feature verification)

BLOCKED BY the shared exercise toolkit ticket (T10). Build on ExerciseShell/OptionGrid/recordTrial. Do not start until it closes.

CONTEXT: for patients with severe aphasia, even 4-option choice is hard; binary yes/no feature verification is the classic easier rung (Semantic Feature Analysis verification step). All data needed already exists in each word features field (category, function, location, properties, associations) — no new content required.

SPEC — "Verdadero o falso":
1. Round: show the word IMAGE + its written word (this exercise is about semantic knowledge, not retrieval) + ONE statement, e.g. true statements generated as "Es un/una <category-singular>" (from categories i18n), "Sirve para <function>" (features.function), "Se encuentra en <location>". False statements: take the same templates filled from a DIFFERENT word of a DIFFERENT category (buildDistractors-style sourcing from allWords). 50/50 true/false mix, shuffled.
2. Answer: two GIANT buttons side by side: "Si" (check icon, success color) and "No" (cross icon, error color), each min 96px tall — this exercise targets the most impaired users; make targets enormous and spacing generous.
3. 10 statements per session across up to 10 words (1 statement per word, standard generator; image-dependent type).
4. Feedback: correct -> standard banner; incorrect -> show the truth plainly ("No: la manzana no se encuentra en el garaje") with TTS speak of the correction, then advance (reveal policy, no retry). recordTrial with the statement as the response string.
5. Statement grammar: Spanish gender/number for "un/una" is hard to derive — sidestep by using template forms that avoid agreement where possible ("Categoria: Animales - verdadero o falso?" style is acceptable fallback; prefer natural sentences ONLY where the features text already reads naturally when substituted; inspect 10 sample words and pick templates that read correctly for the actual data, note the chosen templates in the ticket when closing).
6. Full wiring checklist as documented in CLAUDE.md + registry entry (type "yes-no", name "Verdadero o falso", short name "Si o No").

VERIFY: 10-round session plays cleanly; statements read as natural Spanish for at least 20 sampled words; giant buttons pass 96px; appears in progress accuracy-by-exercise.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7so7 (T10). Do not start until it is closed.

**2026-07-30T11:55:25Z**

CHOSEN TEMPLATES (inspected against actual word data): Category: 'Es de la categoría: {label}' uses i18n category labels. Location: 'Se encuentra en: {location}'. Function: 'Su función es: {function}'. All three use impersonal constructions avoiding el/la gender agreement. Exercise type: yes-no, color: #a855f7, imageDependent: true.
