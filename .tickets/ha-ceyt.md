---
id: ha-ceyt
status: closed
deps: [ha-7urx]
links: []
created: 2026-07-22T10:16:27Z
type: feature
priority: 3
assignee: Félix Laguna Teno
tags: [feature, tts, settings]
---
# TTS voice picker and smarter automatic voice selection

BLOCKED BY the settings-polish ticket (T18) — it establishes the settings sections and toast patterns this ticket uses. Do not start until it closes.

CONTEXT: TTS voice selection (src/lib/speech/speech-synthesis.ts lines ~67-72) picks the FIRST voice matching the language with no quality preference — on many devices that is a robotic remote voice, and for Catalan/Basque there is often NO matching voice at all, so the browser default (Spanish/English) reads ca/eu text with wrong phonetics, silently.

TASK:
1. Improve automatic selection in speech-synthesis.ts: prefer (in order) localService voices, then names containing known-good engines (Google, Microsoft, Monica, Paulina — keep the list as a documented constant), then any exact-lang match, then prefix match. Keep it deterministic.
2. Voice picker in settings (Audio y voz section): a select/listbox of available voices for the CONTENT language (es) via the existing getVoices(language), each row showing voice name + a play button speaking a sample at current rate. Persist choice as setting tts_voice_uri (voiceURI); speech-synthesis honors it when set and falls back gracefully when the voice disappears (device change).
3. Voices load asynchronously (voiceschanged) — the picker must handle the empty-then-populated transition (the service already has waitForVoices logic; expose it).
4. No-voice warning: when zero voices match the content language, show a small warning row in settings (i18n x4: "Tu dispositivo no tiene voz en espanol; el audio puede sonar incorrecto").
5. All exercise TTS paths (useTts helper) automatically use the chosen voice — single code path through SpeechSynthesisService.

VERIFY: on desktop Chrome (has multiple es voices): picker lists them, sample plays per-voice, chosen voice persists and is audibly used in exercises; simulate no-voice (filter to an impossible lang temporarily) -> warning shows, app does not crash.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7urx (T18). Do not start until it is closed.
