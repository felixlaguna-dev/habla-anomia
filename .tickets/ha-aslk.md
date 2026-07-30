---
id: ha-aslk
status: closed
deps: [ha-nw16]
links: []
created: 2026-07-22T10:10:54Z
type: bug
priority: 1
assignee: Félix Laguna Teno
tags: [bug, data, db]
---
# Session lifecycle: record exercise type; fix abandon, restart and retry pollution

BLOCKED BY the completion-callback ticket (T1) — do not start until it is closed; sessions must actually END before lifecycle polish makes sense.

CONTEXT: session rows (Dexie table sessions) are created by startSession() when an exercise mounts (src/routes/exercises/[type]/+page.svelte initExercise) and closed by endSession(id, accuracy, total) in handleComplete. Session type: src/lib/types/index.ts (Session).

PROBLEMS TO FIX (all in src/routes/exercises/[type]/+page.svelte and src/lib/db/sessions.ts):
1. exercise_types is ALWAYS an empty array — startSession never receives the type and endSession never sets it. Session history therefore cannot say which exercise was run. FIX: pass exerciseType to startSession and store exercise_types: [exerciseType].
2. handleRestart calls endSession(sessionId, 0, 0) — this marks an ABANDONED run as a completed session with 0 percent accuracy, poisoning the home accuracy average and the progress history. FIX: add deleteSession(id) to sessions.ts and DELETE the open session on restart instead.
3. Abandoning mid-exercise (back button, navigation away, tab close) leaves an open session forever. FIX: on component destroy (onDestroy or effect cleanup), if the session has not ended, delete it. A session should only persist once ended via handleComplete.
4. handleRetryMistakes reuses the already-ended sessionId — the retry run then calls endSession on the SAME id, overwriting the original result. FIX: start a NEW session (same exercise type) when retrying mistakes.
5. In getSessions consumers, sessions with ended_at are treated as completed — after fixes above that stays the rule; add a one-line comment in sessions.ts documenting the invariant: open sessions are transient and deleted on abandon.

VERIFY (manual, make dev): complete an exercise -> exactly one session row with ended_at set, correct exercise_types and accuracy. Restart mid-run -> no zero-percent rows. Leave mid-run via back -> no lingering open rows (inspect IndexedDB in devtools). Retry mistakes -> a second session row.

FINAL STEP: close this ticket with tk close so dependent tickets become ready (they are listed in this ticket notes).
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-nw16. UNBLOCKS: ha-m2z7 (exit confirmation) and ha-oq1j (home redesign; also needs ha-b6kc + ha-2t4m). FINAL STEP: tk close ha-aslk, then verify with tk ready.
