---
id: ha-cicu
status: closed
deps: []
links: [ha-y5qv, ha-kk63, ha-rabj]
created: 2026-07-29T21:05:47Z
type: feature
priority: 1
assignee: Félix Laguna Teno
tags: [engine, difficulty, feedback]
---
# Gradual adaptive difficulty ramp (per-exercise-type EMA)

Difficulty should adapt gradually per exercise type. Currently getUserMaxDifficulty() is a hard cap computed from 50-attempt rolling accuracy. Replace with a per-exercise-type float level (1.0-5.0) updated via EMA after each session, using weighted probability for word selection instead of a hard cap.

## Design

## Problem
Current model: getUserMaxDifficulty() (src/lib/engine/session-generator.ts:56) computes a hard cap from last 50 attempts accuracy. applyDifficultyFloor() (line 73) filters pool to words at or below cap. This is binary — words above the cap never appear.

## Desired model
Difficulty is a probability weight, not a hard filter. The level persists per exercise type and adapts smoothly via EMA.

## Approach
1. **Storage:** Store per-exercise-type float levels in settings KV as a JSON object: { 'picture-naming': 1.0, 'semantic-features': 1.0, ... }. New users start at 1.0 for all types.
2. **EMA update:** After each session ends, compute session accuracy → map to a target difficulty (same thresholds: <60% → target 1-2, 60-75% → 2-3, etc.) → newLevel = α * target + (1-α) * oldLevel. Use α = 0.3 (moderate responsiveness). Store updated level.
3. **Word selection weighting:** Replace applyDifficultyFloor() with a weighted sampling. Use the level as the center of a Gaussian-like distribution over difficulty 1-5. E.g., level 2.5 → difficulty-2 and -3 words most probable, difficulty-1 and -4 less, difficulty-5 rare. Implement as: weight_i = exp(-(diff_i - level)² / (2σ²)), σ ≈ 0.8.
4. **Within-session nudging:** Track consecutive correct/wrong during the session. 3 correct in a row → effective level +0.5. 2 wrong in a row → effective level −0.5. Clamp to [1.0, 5.0]. Reset effective level to stored level at session start.
5. **Replace getUserMaxDifficulty:** The old function becomes a fallback/initialization helper. applyDifficultyFloor() is replaced by weighted sampling.

## Acceptance Criteria

- [ ] Per-exercise-type difficulty levels stored in settings KV as floats (1.0-5.0)
- [ ] New users start at 1.0 for all types
- [ ] After each session, level updates via EMA (α=0.3)
- [ ] Word selection uses weighted probability centered on the level (Gaussian-like)
- [ ] Within-session: +0.5 on 3-correct streak, -0.5 on 2-wrong streak, clamped to [1.0, 5.0]
- [ ] Existing users migrated: seed levels from current getUserMaxDifficulty() result
- [ ] Word list still sorted easy-to-hard within session (sortByDifficulty unchanged)

