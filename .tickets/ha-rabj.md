---
id: ha-rabj
status: closed
deps: []
links: [ha-y5qv, ha-cicu, ha-kk63]
created: 2026-07-29T21:05:53Z
type: feature
priority: 1
assignee: Félix Laguna Teno
tags: [engine, review, feedback]
---
# Repeat-failed practice mode (today's mistakes)

Users need a way to practice words they got wrong today. Add a 'review mistakes' mode that collects today's failed words grouped by exercise type, runs a sequential session through all groups, and removes words as they're answered correctly. Retryable until zero failures remain.

## Design

## Problem
The existing 'Retry Mistakes' button only re-runs incorrect words from the current session in-memory. There's no way to practice failures across all of today's sessions/exercises in one go. No existing query for 'recently failed words.'

## Approach
1. **Query today's failures:** Add a function getTodaysFailures(language) in src/lib/db/attempts.ts that queries attempts where correct=false AND timestamp is today, grouped by exercise_type. Returns a Map<ExerciseType, Word[]>.
2. **Dashboard card:** On the dashboard (src/routes/+page.svelte), if todaysFailures is non-empty, show a card between the daily plan and the category section: '⚠ Tienes N fallos hoy — Repasar fallos (N) →'. Hide card when no failures.
3. **New route:** /review-failures or /exercises/repeat-failed. Passes the grouped failed words to the runner.
4. **Sequential session runner:** A new mode in the exercise runner (src/routes/exercises/[type]/+page.svelte or a new +page.svelte) that:
   - Iterates through exercise types that have failures
   - For each type, runs the exercise with that type's failed words
   - When a word is answered correctly, removes it from the pool (don't show again in this mode)
   - Incorrect words stay in the pool
   - At the end of all types, show results: 'X cleared, Y remain' with 'Retry remaining (Y)' button
   - Loop until zero remain or user exits
5. **SR + attempts:** Getting a word right records a new attempt (correct=true) and updates SM-2. This means a word cleared in repeat-failed won't necessarily be due tomorrow.
6. **Same word, multiple types:** If 'gato' was failed in both picture-naming and phonological-cueing, it appears in both groups and must be cleared in each independently.

## Acceptance Criteria

- [ ] getTodaysFailures() queries today's incorrect attempts grouped by exercise type
- [ ] Dashboard card appears when there are today's failures, hidden otherwise
- [ ] Sequential session runs through each exercise type's failed words
- [ ] Correctly answered words removed from retry pool
- [ ] Incorrect words remain; session can be retried until zero remain
- [ ] Correct answers update SM-2 and record new attempts
- [ ] Same word failed in multiple types appears in each type's group
- [ ] Card disappears from dashboard when all failures cleared

