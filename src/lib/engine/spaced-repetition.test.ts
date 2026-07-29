import { describe, it, expect } from 'vitest';
import {
  computeSM2Update,
  normalizeQuality,
  MIN_EASE,
  DEFAULT_EASE,
  INITIAL_INTERVAL,
  type SM2State,
} from './spaced-repetition';

describe('normalizeQuality', () => {
  it('maps true → 5', () => {
    expect(normalizeQuality(true)).toBe(5);
  });

  it('maps false → 0', () => {
    expect(normalizeQuality(false)).toBe(0);
  });

  it('passes through valid integers 0–5', () => {
    for (let q = 0; q <= 5; q++) {
      expect(normalizeQuality(q)).toBe(q);
    }
  });

  it('clamps values above 5 to 5', () => {
    expect(normalizeQuality(10)).toBe(5);
    expect(normalizeQuality(100)).toBe(5);
  });

  it('clamps negative values to 0', () => {
    expect(normalizeQuality(-1)).toBe(0);
    expect(normalizeQuality(-50)).toBe(0);
  });
});

describe('computeSM2Update — successful recall (quality ≥ 3)', () => {
  it('first success (reps=0): interval → 1', () => {
    const state: SM2State = { interval: INITIAL_INTERVAL, ease_factor: DEFAULT_EASE, repetitions: 0 };
    const result = computeSM2Update(state, 5);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('second success (reps=1): interval → 6', () => {
    const state: SM2State = { interval: 1, ease_factor: DEFAULT_EASE, repetitions: 1 };
    const result = computeSM2Update(state, 5);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('third success (reps=2): interval → round(prevInterval × ease)', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const result = computeSM2Update(state, 5);
    expect(result.interval).toBe(15); // round(6 * 2.5) = 15
    expect(result.repetitions).toBe(3);
  });

  it('subsequent successes keep multiplying by ease', () => {
    let state: SM2State = { interval: 1, ease_factor: 2.5, repetitions: 0 };
    // Simulate 4 successes. Ease factor increases by 0.1 each perfect recall,
    // so the interval growth accelerates: 1 → 6 → 16 → 45.
    for (const expected of [1, 6, 16, 45]) {
      state = computeSM2Update(state, 5);
      expect(state.interval).toBe(expected);
    }
  });

  it('increases ease factor on perfect recall (quality=5)', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const result = computeSM2Update(state, 5);
    // EF formula: EF + 0.1 - (5-5)*(0.08 + (5-5)*0.02) = EF + 0.1
    expect(result.ease_factor).toBeCloseTo(2.6, 5);
  });

  it('decreases ease factor on marginal pass (quality=3)', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const result = computeSM2Update(state, 3);
    // EF formula: 2.5 + 0.1 - 2*(0.08 + 2*0.02) = 2.5 + 0.1 - 0.24 = 2.36
    expect(result.ease_factor).toBeCloseTo(2.36, 5);
  });

  it('adjusts ease for quality=4 between q=3 and q=5', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const result = computeSM2Update(state, 4);
    // EF formula: 2.5 + 0.1 - 1*(0.08 + 1*0.02) = 2.5 + 0.1 - 0.10 = 2.5
    expect(result.ease_factor).toBeCloseTo(2.5, 5);
  });

  it('never lets ease factor drop below 1.3', () => {
    let state: SM2State = { interval: 6, ease_factor: 1.35, repetitions: 5 };
    // Quality=3 repeatedly to drive EF down
    state = computeSM2Update(state, 3);
    // 1.35 + 0.1 - 2*(0.08 + 0.04) = 1.35 + 0.1 - 0.24 = 1.21 → clamped to 1.3
    expect(state.ease_factor).toBe(MIN_EASE);
  });
});

describe('computeSM2Update — failed recall (quality < 3)', () => {
  it('resets interval to 1', () => {
    const state: SM2State = { interval: 15, ease_factor: 2.5, repetitions: 5 };
    const result = computeSM2Update(state, 0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('keeps the ease factor unchanged', () => {
    const state: SM2State = { interval: 15, ease_factor: 2.36, repetitions: 5 };
    const result = computeSM2Update(state, 0);
    expect(result.ease_factor).toBe(2.36);
  });

  it('keeps the ease factor unchanged at quality=2', () => {
    const state: SM2State = { interval: 15, ease_factor: 2.0, repetitions: 3 };
    const result = computeSM2Update(state, 2);
    expect(result.ease_factor).toBe(2.0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });
});

describe('computeSM2Update — boolean back-compat path', () => {
  it('true behaves as quality=5', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const fromBool = computeSM2Update(state, normalizeQuality(true));
    const fromInt = computeSM2Update(state, 5);
    expect(fromBool).toEqual(fromInt);
  });

  it('false behaves as quality=0', () => {
    const state: SM2State = { interval: 6, ease_factor: 2.5, repetitions: 2 };
    const fromBool = computeSM2Update(state, normalizeQuality(false));
    const fromInt = computeSM2Update(state, 0);
    expect(fromBool).toEqual(fromInt);
  });
});
