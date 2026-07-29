import { describe, it, expect } from 'vitest';
import {
  clampLevel,
  targetDifficultyFromAccuracy,
  computeEMAUpdate,
  wordDifficultyWeight,
  weightedSampleByDifficulty,
  DifficultyTracker,
  MIN_LEVEL,
  MAX_LEVEL,
  EMA_ALPHA,
  GAUSSIAN_SIGMA,
  STREAK_CORRECT_THRESHOLD,
  STREAK_WRONG_THRESHOLD,
  STREAK_CORRECT_BOOST,
  STREAK_WRONG_PENALTY,
} from './adaptive-difficulty';

describe('clampLevel', () => {
  it('clamps values below 1.0 to 1.0', () => {
    expect(clampLevel(0)).toBe(MIN_LEVEL);
    expect(clampLevel(-5)).toBe(MIN_LEVEL);
    expect(clampLevel(0.99)).toBe(MIN_LEVEL);
  });

  it('clamps values above 5.0 to 5.0', () => {
    expect(clampLevel(6)).toBe(MAX_LEVEL);
    expect(clampLevel(100)).toBe(MAX_LEVEL);
    expect(clampLevel(5.01)).toBe(MAX_LEVEL);
  });

  it('passes through values within [1.0, 5.0]', () => {
    expect(clampLevel(1.0)).toBe(1.0);
    expect(clampLevel(3.5)).toBe(3.5);
    expect(clampLevel(5.0)).toBe(5.0);
  });
});

describe('targetDifficultyFromAccuracy', () => {
  it('maps < 60% to 1.5', () => {
    expect(targetDifficultyFromAccuracy(0)).toBe(1.5);
    expect(targetDifficultyFromAccuracy(59.9)).toBe(1.5);
  });

  it('maps 60–75% to 2.5', () => {
    expect(targetDifficultyFromAccuracy(60)).toBe(2.5);
    expect(targetDifficultyFromAccuracy(74.9)).toBe(2.5);
  });

  it('maps 75–85% to 3.5', () => {
    expect(targetDifficultyFromAccuracy(75)).toBe(3.5);
    expect(targetDifficultyFromAccuracy(84.9)).toBe(3.5);
  });

  it('maps ≥ 85% to 4.5', () => {
    expect(targetDifficultyFromAccuracy(85)).toBe(4.5);
    expect(targetDifficultyFromAccuracy(100)).toBe(4.5);
  });
});

describe('computeEMAUpdate', () => {
  it('blends target with old level using alpha', () => {
    // α=0.3: 0.3 * 3.0 + 0.7 * 1.0 = 0.9 + 0.7 = 1.6
    expect(computeEMAUpdate(1.0, 3.0)).toBeCloseTo(1.6, 5);
  });

  it('uses default alpha of 0.3', () => {
    const withDefault = computeEMAUpdate(2.0, 4.0);
    const explicit = computeEMAUpdate(2.0, 4.0, EMA_ALPHA);
    expect(withDefault).toBe(explicit);
  });

  it('clamps the result to [1.0, 5.0]', () => {
    expect(computeEMAUpdate(1.0, 0)).toBe(MIN_LEVEL);
    expect(computeEMAUpdate(5.0, 100)).toBe(MAX_LEVEL);
  });
});

describe('wordDifficultyWeight', () => {
  it('returns 1.0 when difficulty equals level', () => {
    expect(wordDifficultyWeight(3, 3)).toBeCloseTo(1.0, 5);
    expect(wordDifficultyWeight(5, 5)).toBeCloseTo(1.0, 5);
  });

  it('returns lower weights for distance from level', () => {
    const atLevel = wordDifficultyWeight(3, 3);
    const off1 = wordDifficultyWeight(4, 3);
    const off2 = wordDifficultyWeight(5, 3);
    expect(off1).toBeLessThan(atLevel);
    expect(off2).toBeLessThan(off1);
    expect(off2).toBeGreaterThan(0);
  });

  it('is symmetric around the level', () => {
    expect(wordDifficultyWeight(2, 3)).toBeCloseTo(wordDifficultyWeight(4, 3), 5);
  });

  it('matches the Gaussian formula exp(-(diff-level)²/(2σ²))', () => {
    const expected = Math.exp(-((5 - 3) ** 2) / (2 * GAUSSIAN_SIGMA ** 2));
    expect(wordDifficultyWeight(5, 3)).toBeCloseTo(expected, 5);
  });
});

describe('weightedSampleByDifficulty', () => {
  const items = [
    { difficulty: 1, id: 'a' },
    { difficulty: 2, id: 'b' },
    { difficulty: 3, id: 'c' },
    { difficulty: 4, id: 'd' },
    { difficulty: 5, id: 'e' },
  ];

  it('returns all items when pool size ≤ n', () => {
    const result = weightedSampleByDifficulty(items.slice(0, 3), 5, 5);
    expect(result).toHaveLength(3);
    expect(new Set(result.map(r => r.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('returns exactly n items when pool > n', () => {
    const result = weightedSampleByDifficulty(items, 3, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty for empty pool', () => {
    expect(weightedSampleByDifficulty([], 3, 3)).toEqual([]);
  });

  it('returns unique items (no duplicates)', () => {
    const result = weightedSampleByDifficulty(items, 5, 5);
    const ids = result.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('DifficultyTracker', () => {
  it('starts at the given level', () => {
    const tracker = new DifficultyTracker(2.5);
    expect(tracker.effectiveLevel).toBe(2.5);
    expect(tracker.streak).toBe(0);
  });

  it('boosts after STREAK_CORRECT_THRESHOLD correct in a row', () => {
    const tracker = new DifficultyTracker(2.0);
    tracker.processResults([true, true, true]); // 3 correct = threshold
    expect(tracker.effectiveLevel).toBeCloseTo(2.0 + STREAK_CORRECT_BOOST, 5);
  });

  it('penalizes after STREAK_WRONG_THRESHOLD wrong in a row', () => {
    const tracker = new DifficultyTracker(3.0);
    tracker.processResults([false, false]); // 2 wrong = threshold
    expect(tracker.effectiveLevel).toBeCloseTo(3.0 - STREAK_WRONG_PENALTY, 5);
  });

  it('does not boost below the correct threshold', () => {
    const tracker = new DifficultyTracker(2.0);
    tracker.processResults([true, true]); // only 2 correct < 3 threshold
    expect(tracker.effectiveLevel).toBe(2.0);
  });

  it('resets streak after boost', () => {
    const tracker = new DifficultyTracker(2.0);
    tracker.processResults([true, true, true, true, true, true]); // 2 boosts
    expect(tracker.effectiveLevel).toBeCloseTo(2.0 + 2 * STREAK_CORRECT_BOOST, 5);
  });

  it('clamps effective level to MAX_LEVEL', () => {
    const tracker = new DifficultyTracker(4.5);
    // 3 correct → +0.5 = 5.0
    tracker.processResults([true, true, true]);
    expect(tracker.effectiveLevel).toBe(MAX_LEVEL);
    // 3 more correct → stays clamped at 5.0
    tracker.processResults([true, true, true]);
    expect(tracker.effectiveLevel).toBe(MAX_LEVEL);
  });

  it('clamps effective level to MIN_LEVEL', () => {
    const tracker = new DifficultyTracker(1.2);
    tracker.processResults([false, false]); // -0.5 → 0.7 → clamped to 1.0
    expect(tracker.effectiveLevel).toBe(MIN_LEVEL);
  });

  it('mixed results reset streaks', () => {
    const tracker = new DifficultyTracker(2.0);
    // correct, wrong, correct, wrong, correct — no streak reaches threshold
    tracker.processResults([true, false, true, false, true]);
    expect(tracker.effectiveLevel).toBe(2.0);
  });
});
