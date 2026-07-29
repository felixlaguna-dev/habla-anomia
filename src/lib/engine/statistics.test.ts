import { describe, it, expect } from 'vitest';
import { calculateImprovementTrend } from './statistics';

type DataPoint = { accuracy: number; total: number };

describe('calculateImprovementTrend', () => {
  it('returns "stable" for fewer than 2 active days', () => {
    const data: DataPoint[] = [{ accuracy: 80, total: 10 }];
    expect(calculateImprovementTrend(data)).toBe('stable');
  });

  it('returns "stable" for 0 active days', () => {
    const data: DataPoint[] = [
      { accuracy: 0, total: 0 },
      { accuracy: 0, total: 0 },
    ];
    expect(calculateImprovementTrend(data)).toBe('stable');
  });

  it('returns "stable" when days with total=0 are filtered out', () => {
    // Only 1 active day after filtering → stable
    const data: DataPoint[] = [
      { accuracy: 90, total: 5 },
      { accuracy: 0, total: 0 },
      { accuracy: 0, total: 0 },
    ];
    expect(calculateImprovementTrend(data)).toBe('stable');
  });

  it('returns "improving" when second half accuracy is >5 points higher', () => {
    const data: DataPoint[] = [
      { accuracy: 50, total: 10 },
      { accuracy: 50, total: 10 },
      { accuracy: 80, total: 10 },
      { accuracy: 80, total: 10 },
    ];
    expect(calculateImprovementTrend(data)).toBe('improving');
  });

  it('returns "declining" when first half accuracy is >5 points higher', () => {
    const data: DataPoint[] = [
      { accuracy: 80, total: 10 },
      { accuracy: 80, total: 10 },
      { accuracy: 50, total: 10 },
      { accuracy: 50, total: 10 },
    ];
    expect(calculateImprovementTrend(data)).toBe('declining');
  });

  it('returns "stable" when difference is exactly 5 (boundary)', () => {
    const data: DataPoint[] = [
      { accuracy: 50, total: 10 },
      { accuracy: 55, total: 10 },
    ];
    // avgSecond - avgFirst = 55 - 50 = 5, threshold is >5, so stable
    expect(calculateImprovementTrend(data)).toBe('stable');
  });

  it('returns "stable" when difference is exactly -5 (boundary)', () => {
    const data: DataPoint[] = [
      { accuracy: 55, total: 10 },
      { accuracy: 50, total: 10 },
    ];
    expect(calculateImprovementTrend(data)).toBe('stable');
  });

  it('returns "improving" for a small difference above threshold', () => {
    const data: DataPoint[] = [
      { accuracy: 50, total: 10 },
      { accuracy: 56, total: 10 },
    ];
    expect(calculateImprovementTrend(data)).toBe('improving');
  });

  it('handles odd number of active days (floor split)', () => {
    // 5 active days: first 2 vs last 3
    const data: DataPoint[] = [
      { accuracy: 40, total: 10 },
      { accuracy: 40, total: 10 },
      { accuracy: 80, total: 10 },
      { accuracy: 80, total: 10 },
      { accuracy: 80, total: 10 },
    ];
    // avgFirst = 40, avgSecond = 80 → improving
    expect(calculateImprovementTrend(data)).toBe('improving');
  });
});
