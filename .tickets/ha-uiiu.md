---
id: ha-uiiu
status: closed
deps: [ha-7so7]
links: []
created: 2026-07-22T10:13:47Z
type: feature
priority: 2
assignee: Félix Laguna Teno
tags: [feature, exercises, tts]
---
# New exercise: Escucha y elige (spoken word to picture matching)

BLOCKED BY the shared exercise toolkit ticket (T10) — build this ON the toolkit (ExerciseShell, OptionGrid, recordTrial, useTts). Do not start until it closes.

CONTEXT: all 8 current exercises are visual-first. Aphasia therapy also needs AUDITORY comprehension work (spoken word -> picture matching), and the app already has everything required: TTS (SpeechSynthesisService), 500+ images, and the multiple-choice toolkit. This is the highest-value new exercise.

SPEC — "Escucha y elige" (listen and choose):
1. Round: the app SPEAKS a word (auto-play on round start + a large replay button "Escuchar otra vez" with a speaker icon, min 72px — replay is central to the mechanic, not an accessory). NO text of the word is shown (that is the point). The patient taps the matching image among 4 image options (2x2 grid of large image cards, min 120px, from the same buildDistractors pool logic — distractor images from other session words + allWords fallback).
2. Correct: standard FeedbackBanner + show the written word under the image + speak praise per existing pattern. Incorrect: record via recordTrial policy, allow ONE retry after replaying the word automatically, then reveal.
3. 10 words per session via the standard generator; word images required (this is an image-dependent exercise — add its type to IMAGE_DEPENDENT_EXERCISES in src/lib/types/index.ts).
4. If TTS is unavailable (SpeechSynthesisService.isSupported() false), the exercise tile shows disabled state with a tooltip-free note (i18n x4: "Necesita voz del dispositivo").
5. Wiring checklist (CLAUDE.md documents it, plus the metadata module if merged): new component src/lib/components/exercises/ListenChooseExercise.svelte; barrel export in index.ts; route mapping + ExerciseType union ("listen-choose") in src/lib/types/index.ts; session-generator passthrough works via default path (verify needsImage filter picks up the new type); i18n block exercises.listen_choose (name "Escucha y elige", short_name "Escucha", description) in ALL 4 locales; home grid + about page entries; exercise metadata module entry (icon: an ear or speaker SVG, its own color).
6. Attempts record exercise_type "listen-choose" and integrate automatically with progress accuracy-by-exercise (verify it appears there after a run).

VERIFY: full run end to end on phone + tablet viewports; works offline for already-cached images; results overlay correct.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-7so7 (T10). Do not start until it is closed.

**2026-07-30T09:35:58Z**

## Reuse Review: NEEDS FIXES (CSS duplication)

Scope: reviewed ListenChooseExercise.svelte + all modified files for REUSE only (not correctness). The script-level toolkit reuse is good — ExerciseShell, FeedbackBanner, useTts, recordTrial, getCardState, createCancellableTimer are all correctly reused. The problem is CSS.

### Finding 1 (MAJOR): ~150 lines of image-card-grid CSS copy-pasted from OddOneOutExercise
File: src/lib/components/exercises/ListenChooseExercise.svelte, lines 343-498
Summary: The entire card-grid / image-card / card-button / card-image-wrapper / card-image / card-letter-fallback / card-label / hover-states / card-states / focus / keyframes / tablet media-query block is a near-exact copy of OddOneOutExercise.svelte lines 390-545.
Concrete cost: diff -w shows only ~6 lines of CSS actually differ (align-items/gap on .image-card, min-height on wrapper, z-index on image/fallback). The other ~150 lines are identical. This is precisely the duplication that exercise-common.css was created to eliminate — its header comment says 'This eliminates ~150 lines of copy-pasted CSS per exercise.' The 2x2 image-card-grid pattern should be promoted to exercise-common.css (or a shared ImageCardGrid component) so both OddOneOut and ListenChoose consume it. Right now any future tweak to card styling must be applied in two places.

### Finding 2 (MAJOR): @keyframes shake added as a 5th copy
File: src/lib/components/exercises/ListenChooseExercise.svelte, lines 472-478
Summary: The identical shake keyframe now exists in 5 places: theme.css:316 (with a reusable .shake utility class at line 258), exercise-common.css:189 (as exercise-shake), OptionCard.svelte:147, OddOneOutExercise.svelte:518, and now here.
Concrete cost: 7 lines of dead-weight duplication. theme.css already exports a global .shake utility class; alternatively exercise-common.css already has the same animation as exercise-shake.

### Finding 3 (MAJOR): @keyframes correctPulse added as a 4th copy
File: src/lib/components/exercises/ListenChooseExercise.svelte, lines 466-470
Summary: Identical correctPulse keyframe now in 4 places: OptionCard.svelte:135, CategorySortingExercise.svelte:456, OddOneOutExercise.svelte:512, and now here.
Concrete cost: 5 lines duplicated. This animation is shared by every card-style exercise and belongs in exercise-common.css alongside the existing exercise-shake keyframe.

### Finding 4 (MINOR): @keyframes pulse duplicated from theme.css
File: src/lib/components/exercises/ListenChooseExercise.svelte, lines 461-464
Summary: Byte-for-byte identical to theme.css:300 (which already provides a .pulse utility class at line 229). PhonologicalCueingExercise.svelte:382 has the same duplicate.
Concrete cost: 4 lines. Could use the existing .pulse class or a shared keyframe.

### Finding 5 (MINOR): recordCurrentTrial boilerplate repeated across 6 exercises
File: src/lib/components/exercises/ListenChooseExercise.svelte, lines 100-113
Summary: The guard-on-trialRecorded + push-to-results + recordTrial() pattern is copy-pasted in 6 exercises (this one, OddOneOut, CategorySorting, PictureNaming, PhonologicalCueing, SentenceCompletion). Each only differs in how it extracts the target word and response string.
Concrete cost: ~12 lines per exercise (~72 lines total). A shared helper like recordFirstTrial(currentWord, correct, response, ctx) would centralize this. Lower priority than the CSS findings since the logic differences are real.

RECOMMENDATION: Findings 1-3 should be fixed before merge — they add ~160 lines of pure duplication in a single file and create a two-place maintenance burden for the card grid. Finding 4 is trivial. Finding 5 is optional.

**2026-07-30T10:02:26Z**

## Round-2 Adversarial Review: 1 CRITICAL (regression from fix #1)

Scope: verified all 6 round-1 fixes in ListenChooseExercise.svelte + tts.svelte.ts, then hunted for new issues introduced by the fixes. Reproduced findings against Svelte 5.19.2's actual reactivity runtime.

### NEW CRITICAL — infinite re-speak loop introduced by the ttsReady fix
File: src/lib/components/exercises/ListenChooseExercise.svelte:88-99 (the per-word $effect that calls speak())
Root cause: the auto-speak $effect calls tts.speak() -> useTts.speak(), whose guard `if (!synthesis || isSpeaking || !text) return;` READS the reactive `isSpeaking` $state. Because the read happens synchronously inside the $effect, Svelte 5 adds isSpeaking as a dependency of the effect. speak() then sets isSpeaking=true; when speech finishes its `finally { isSpeaking = false; }` runs, which re-triggers the effect, which calls speak() again -> the word repeats forever.

Why fix #1 caused this: before the ttsReady guard, the effect ran pre-onMount with synthesis===null, so speak() short-circuited on `!synthesis` BEFORE the isSpeaking read (no tracking, no loop — but also no first-word speak, which was issue #1). The ttsReady fix correctly defers the effect until synthesis is non-null, which means speak() now proceeds past `!synthesis` and reads isSpeaking -> the loop is now live.

I reproduced this directly against Svelte's internal client reactivity runtime (source/effect/get/set/effect_root/flush_sync). With the exact useTts.speak shape, run+speak counts climb without bound on every speech-end: 2 -> 4 -> 6 -> 8 -> ... (never terminates).

User-visible impact (when TTS is available — the only case the main UI renders):
1. The spoken word repeats endlessly, once per speech duration.
2. Each cycle the effect also runs wordTimer.clear() (cancelling any scheduled advance/feedback), rebuilds optionWords via buildDistractors (cards reshuffle every cycle), and resets feedbackState/attemptsUsed/selectedIndex/startTime. So a correct or incorrect tap is wiped out on the next cycle and its scheduled advance is cancelled — the user can never complete a word. The exercise is non-functional.

Fix (minimal): wrap the speak() call so it is not tracked:
```js
import { untrack } from 'svelte';
...
$effect(() => {
  wordTimer.clear();
  if (!ttsReady || !currentWord) return;
  ...
  untrack(() => speak());
});
```
untrack is a public export ('svelte'). This removes isSpeaking from the effect's dependency graph while keeping the ttsReady/currentWord deps. (Alternative: move auto-speak out of the per-word setup effect entirely.)

### Related LOW (same root cause as a symptom) — isSpeaking flag can be clobbered on skip-during-speech
File: src/lib/utils/tts.svelte.ts:60-68 (speak finally) + ListenChooseExercise.nextWord():163
The new tts.cancel() in nextWord() sets isSpeaking=false synchronously, but the in-flight speak()'s `finally { isSpeaking = false; }` resolves asynchronously after the browser fires the canceled utterance's error event. If the user skips mid-speech, the next word's speak() starts (isSpeaking=true) and the OLD finally can then run and set isSpeaking=false during the new speech. Observable: replay button re-enables and the pulse animation stops mid-word. Browser-timing-dependent and rare; non-blocking. A generation-token guard in the finally (only clear if still the current utterance) would fix both this and harden the loop fix.

### Verification of the 5 round-1 fixes (all correct)
1. ttsReady guard — mechanically correct (effect re-runs when ttsReady flips because it reads ttsReady; Svelte-5-effect-before-onMount confirmed by project wiki). BUT it is what enables the CRITICAL loop above; the guard is necessary and not sufficient — pair it with untrack.
2. attemptsUsed 0->1 (flash, no reveal) -> 2 (reveal) — correct. Exactly one retry; user cannot get stuck (reset callback clears feedbackState to 'none' and re-enables buttons; Escape always works; Enter is correctly a no-op during the flash). recordCurrentTrial's once-only guard means the first attempt is what gets scored (intended first-attempt policy).
3. tts.cancel() in nextWord() — present and correct (verified cancel() in tts.svelte.ts:50-53 calls synthesis.stop() and resets isSpeaking). Fixes skip-mid-speech dropping the next word. (See related LOW above.)
4. onConfirm gated on attemptsUsed >= 2 — correct for all feedback states: 'correct' advances, 'incorrect'+reveal advances, 'incorrect'+flash and 'none' are no-ops. No double-advance (nextWord clears the timer first).
5. wordTimer.clear() before null guard — correct; prevents a stale queued callback firing when currentWord becomes undefined at the end.

### Checks
- svelte-check: 0 errors, 0 warnings.
- vitest: 73/73 pass (engine/utils only — no component tests exercise this, which is why the loop wasn't caught).
- Note: the UI can't be exercised in the integration harness due to the pre-existing 'fresh IDB empty exercise session' issue, so the loop is not caught by existing automation.

Recommendation: the CRITICAL loop must be fixed (untrack the speak call in the effect) before this can be merged. Everything else is solid.

**2026-07-30T10:05:19Z**

Implemented Escucha y elige (listen-choose) — 10th exercise type. Built on shared toolkit with requiresTts registry property. Fixed critical auto-speak loop (untrack), retry reveal logic, keyboard nav. Adversarial review converged after 2 rounds. npm run check + build pass.
