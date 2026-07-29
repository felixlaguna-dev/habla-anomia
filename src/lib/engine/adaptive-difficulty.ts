/**
 * Gradual adaptive difficulty — per-exercise-type EMA with Gaussian-weighted
 * word selection and within-session streak nudging.
 *
 * Replaces the old hard-cap model with a smooth, probabilistic approach:
 *
 * - Each exercise type has a float level (1.0–5.0) persisted in settings KV.
 * - After every session the level updates via EMA (α = 0.3) from session accuracy.
 * - Word selection uses the level as the center of a Gaussian weight distribution
 *   over difficulty 1–5, so harder words become progressively more likely as the
 *   level rises rather than being gated by a hard cap.
 * - During a session, consecutive-correct/wrong streaks nudge an effective level
 *   up/down (within-session adaptation signal that does not persist).
 */

import type { ExerciseType, Language } from '$lib/types';
import { EXERCISE_TYPES } from '$lib/exercises/registry';
import { getSetting, setSetting } from '$lib/db/settings';
import { getRecentAttempts } from '$lib/db/attempts';

// ─── Constants ───────────────────────────────────────────────────────────

/** EMA smoothing factor — moderate responsiveness (30% new, 70% old). */
export const EMA_ALPHA = 0.3;

/** Width of the Gaussian weight distribution over word difficulty. */
export const GAUSSIAN_SIGMA = 0.8;

/** Streak thresholds for within-session nudging. */
export const STREAK_CORRECT_THRESHOLD = 3;
export const STREAK_WRONG_THRESHOLD = 2;

/** Level adjustments applied on streak events. */
export const STREAK_CORRECT_BOOST = 0.5;
export const STREAK_WRONG_PENALTY = 0.5;

export const MIN_LEVEL = 1.0;
export const MAX_LEVEL = 5.0;

/** Settings KV key for the per-exercise-type difficulty levels. */
const SETTINGS_KEY = 'difficulty_levels';

// ─── Pure functions ──────────────────────────────────────────────────────

/** Clamp a level to the valid range [1.0, 5.0]. */
export function clampLevel(level: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/**
 * Map a session accuracy (0–100) to a target difficulty level for EMA updates.
 * Returns a float at the center of each band so the EMA has a clear target:
 *
 *   < 60  → 1.5
 *   60–75 → 2.5
 *   75–85 → 3.5
 *   ≥ 85  → 4.5
 *
 * For legacy migration, `targetDifficultyFromAccuracy(accuracy) + 0.5` yields
 * the same integer levels (2–5) the old hard-cap system used.
 */
export function targetDifficultyFromAccuracy(accuracy: number): number {
  if (accuracy < 60) return 1.5;
  if (accuracy < 75) return 2.5;
  if (accuracy < 85) return 3.5;
  return 4.5;
}

/**
 * Apply EMA: blend a target onto an old level.
 * `newLevel = α * target + (1 − α) * oldLevel`
 */
export function computeEMAUpdate(
  oldLevel: number,
  target: number,
  alpha: number = EMA_ALPHA
): number {
  return clampLevel(alpha * target + (1 - alpha) * oldLevel);
}

/**
 * Gaussian weight for a word of `wordDifficulty` given the current `level`.
 * `weight = exp(−(diff − level)² / (2σ²))`
 *
 * A word exactly at the level gets weight 1.0; words further away get
 * progressively less. With σ = 0.8, difficulty ±1 from the level still
 * carries ~45% weight, while ±2 drops to ~4%.
 */
export function wordDifficultyWeight(
  wordDifficulty: number,
  level: number,
  sigma: number = GAUSSIAN_SIGMA
): number {
  return Math.exp(-((wordDifficulty - level) ** 2) / (2 * sigma * sigma));
}

/**
 * Pick `n` items from `pool` via weighted sampling without replacement.
 *
 * Each item's selection probability is proportional to its Gaussian weight
 * centered on `level`. This replaces the old hard-cap filter: instead of
 * "words above level X never appear," harder words are rare but possible,
 * and become more frequent as the level rises.
 *
 * Pure aside from RNG — deterministic given the same random sequence.
 */
export function weightedSampleByDifficulty<T extends { difficulty: number }>(
  pool: T[],
  level: number,
  n: number,
  sigma: number = GAUSSIAN_SIGMA
): T[] {
  if (pool.length <= n) return [...pool];

  const weighted = pool.map(item => ({
    item,
    weight: wordDifficultyWeight(item.difficulty, level, sigma)
  }));

  const result: T[] = [];
  const remaining = [...weighted];

  for (let i = 0; i < n && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let r = Math.random() * totalWeight;
    let pickedIdx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].weight;
      if (r <= 0) {
        pickedIdx = j;
        break;
      }
    }
    result.push(remaining[pickedIdx].item);
    remaining.splice(pickedIdx, 1);
  }

  return result;
}

// ─── DB-backed functions ─────────────────────────────────────────────────

/**
 * Read all per-exercise-type difficulty levels from settings KV.
 * Returns an empty object if never set (call `getDifficultyLevel` to
 * lazily initialize / migrate).
 */
export async function getDifficultyLevels(): Promise<Record<string, number>> {
  const stored = await getSetting<Record<string, number>>(SETTINGS_KEY);
  return stored ?? {};
}

/**
 * Get the difficulty level for a single exercise type.
 *
 * If no level is stored for the type yet, this triggers a one-time lazy
 * migration: seeds all uninitialized exercise types from the user's rolling
 * accuracy (matching the legacy accuracy→difficulty thresholds). New users
 * with no attempt history start at 1.0 across the board.
 */
export async function getDifficultyLevel(
  exerciseType: ExerciseType,
  language?: Language
): Promise<number> {
  const levels = await getDifficultyLevels();
  const existing = levels[exerciseType];
  if (existing !== undefined) return existing;

  // Seed missing types from accuracy, falling back to MIN_LEVEL for new users.
  const lang = language ?? 'es';
  const recent = await getRecentAttempts(50, lang);
  let seedLevel: number;
  if (recent.length > 0) {
    const correct = recent.filter(a => a.correct).length;
    const accuracy = (correct / recent.length) * 100;
    seedLevel = targetDifficultyFromAccuracy(accuracy) + 0.5;
  } else {
    seedLevel = MIN_LEVEL;
  }

  // Seed all uninitialized types with the same value.
  const updated = { ...levels };
  for (const type of EXERCISE_TYPES) {
    if (updated[type] === undefined) {
      updated[type] = seedLevel;
    }
  }
  await setSetting(SETTINGS_KEY, updated);
  return updated[exerciseType];
}

/**
 * Persist all difficulty levels.
 */
export async function setDifficultyLevels(
  levels: Record<string, number>
): Promise<void> {
  await setSetting(SETTINGS_KEY, levels);
}

/**
 * Update a single exercise type's level via EMA after a session ends.
 *
 * Reads the stored level, maps session accuracy to a target, and applies
 * the EMA blend: `newLevel = α * target + (1−α) * oldLevel`. Streak nudging
 * stays within-session only — the EMA uses the stored level so the ramp
 * stays gradual.
 *
 * Returns the new stored level.
 */
export async function updateDifficultyAfterSession(
  exerciseType: ExerciseType,
  sessionAccuracy: number
): Promise<number> {
  const levels = await getDifficultyLevels();
  const oldLevel = levels[exerciseType] ?? MIN_LEVEL;
  const target = targetDifficultyFromAccuracy(sessionAccuracy);
  const newLevel = computeEMAUpdate(oldLevel, target);
  await setDifficultyLevels({ ...levels, [exerciseType]: newLevel });
  return newLevel;
}

// ─── Within-session streak tracker ───────────────────────────────────────

/**
 * Tracks correct/wrong streaks during a session and adjusts an effective
 * difficulty level. The effective level starts at the stored level and is
 * nudged by streak events:
 *
 * - 3 correct in a row → +0.5
 * - 2 wrong in a row   → −0.5
 *
 * Both clamp to [1.0, 5.0]. The effective level is a within-session signal
 * for real-time difficulty adaptation — it does not feed the EMA update,
 * which uses the stored level so the difficulty ramp stays gradual.
 *
 * The tracker processes the ordered sequence of attempt results after the
 * session completes — see `processResults` for batch replay.
 */
export class DifficultyTracker {
  private _level: number;
  private _streak: number = 0;

  constructor(initialLevel: number) {
    this._level = clampLevel(initialLevel);
  }

  /** Current effective level (adjusted by streaks). */
  get effectiveLevel(): number {
    return this._level;
  }

  /** Current streak count (positive = correct streak, negative = wrong streak). */
  get streak(): number {
    return this._streak;
  }

  /** Record a correct answer; returns the new effective level. */
  private onCorrect(): number {
    if (this._streak < 0) this._streak = 0;
    this._streak++;
    if (this._streak >= STREAK_CORRECT_THRESHOLD) {
      this._level = clampLevel(this._level + STREAK_CORRECT_BOOST);
      this._streak = 0;
    }
    return this._level;
  }

  /** Record a wrong answer; returns the new effective level. */
  private onWrong(): number {
    if (this._streak > 0) this._streak = 0;
    this._streak--;
    if (-this._streak >= STREAK_WRONG_THRESHOLD) {
      this._level = clampLevel(this._level - STREAK_WRONG_PENALTY);
      this._streak = 0;
    }
    return this._level;
  }

  /**
   * Replay an ordered sequence of correct/wrong results through the tracker.
   * Used at session end to compute the effective level from the full attempt
   * history of the session.
   */
  processResults(results: boolean[]): number {
    for (const correct of results) {
      if (correct) this.onCorrect();
      else this.onWrong();
    }
    return this._level;
  }
}
