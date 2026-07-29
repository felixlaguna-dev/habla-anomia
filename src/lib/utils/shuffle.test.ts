import { describe, it, expect } from 'vitest';
import { shuffleArray } from './shuffle';

describe('shuffleArray', () => {
  it('preserves all elements (set equality)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffleArray(input);
    expect(new Set(result)).toEqual(new Set(input));
    expect(result).toHaveLength(input.length);
  });

  it('preserves all elements on strings', () => {
    const input = ['perro', 'gato', 'abeja', 'agua', 'pan'];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffleArray(input);
    expect(input).toEqual(snapshot);
  });

  it('handles single-element arrays', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  it('handles empty arrays', () => {
    expect(shuffleArray([])).toEqual([]);
  });
});
