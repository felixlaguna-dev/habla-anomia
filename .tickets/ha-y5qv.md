---
id: ha-y5qv
status: closed
deps: []
links: [ha-cicu, ha-kk63, ha-rabj]
created: 2026-07-29T21:05:36Z
type: feature
priority: 1
assignee: Félix Laguna Teno
tags: [ui, daily-plan, feedback]
---
# Daily checkmark indicator on exercises done today

Users couldn't tell which exercises they had already done today, sometimes doing the daily exercise twice. Add a faint checkmark overlay on the exercise icon in both the daily plan and the all-exercises chip grid when that exercise type has been completed today.

## Design

## Problem
The dashboard tracks 'done today' via a positional heuristic (i < todayCompleted count), not by actual exercise type. The session.exercise_types field is always [] — never populated. The all-exercises chip grid has no done indicator at all.

## Approach
1. **Fix session tracking:** Populate session.exercise_types with the actual type on endSession() (src/lib/db/sessions.ts:20-30). The type is known from the route param in src/routes/exercises/[type]/+page.svelte.
2. **Query today's completed types:** On dashboard load, query sessions where ended_at is today and extract exercise_types to build a Set of completed types.
3. **Daily plan items:** Replace the positional heuristic (i < todayCompleted) with checking if the plan item's exercise type is in today's completed set.
4. **Chip grid checkmark:** Add a checkmark overlay (sticker style) on ExerciseIcon in the chip grid when the type is in today's completed set. Use faint success-green coloring.

## Acceptance Criteria

- [ ] session.exercise_types is populated with actual type on endSession()
- [ ] Daily plan items show completed state based on actual exercise type, not positional count
- [ ] Chip grid shows faint checkmark overlay on ExerciseIcon for types done today
- [ ] Checkmark only appears for completed sessions (ended_at set), not abandoned ones
- [ ] Checkmark resets at midnight (next day)

