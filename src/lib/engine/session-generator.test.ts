import { describe, it, expect } from 'vitest';
import { sortByDifficulty } from './session-generator';
import type { Word } from '$lib/types';

/** Minimal factory for Word objects — only fields used by the sort matter. */
function makeWord(id: string, difficulty: 1 | 2 | 3 | 4 | 5): Word {
  return {
    id,
    word: id,
    categories: ['animals'],
    language: 'es',
    image_url: `/images/${id}.webp`,
    definition: '',
    features: { category: '', function: '', location: '', properties: '', associations: '' },
    phonetic: { first_sound: '', syllables: 1, rhyming_word: '', first_phonemes: '' },
    difficulty,
    tags: [],
  };
}

describe('sortByDifficulty', () => {
  it('sorts words ascending by difficulty', () => {
    const words = [
      makeWord('d5', 5),
      makeWord('d1', 1),
      makeWord('d3', 3),
      makeWord('d2', 2),
      makeWord('d4', 4),
    ];
    const result = sortByDifficulty(words);
    expect(result.map(w => w.difficulty)).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserves all elements', () => {
    const words = Array.from({ length: 10 }, (_, i) => makeWord(`w${i}`, ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5));
    const result = sortByDifficulty(words);
    expect(new Set(result.map(w => w.id))).toEqual(new Set(words.map(w => w.id)));
  });

  it('does not mutate the original array', () => {
    const words = [makeWord('a', 3), makeWord('b', 1)];
    const snapshot = words.map(w => w.id);
    sortByDifficulty(words);
    expect(words.map(w => w.id)).toEqual(snapshot);
  });
});
