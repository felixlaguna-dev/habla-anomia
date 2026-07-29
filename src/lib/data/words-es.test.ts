import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { WORDS_ES, WORDS_ES_VERSION } from './words-es';
import { CATEGORIES } from '$lib/types';

const VALID_CATEGORIES = new Set<string>(CATEGORIES);
const STATIC_DIR = resolve(process.cwd(), 'static');

/**
 * Word-bank dataset integrity suite.
 *
 * Each test iterates all 523 words internally and reports every offender in the
 * assertion message. This keeps the suite at ~10 test nodes (fast) while still
 * pin-pointing exactly which word(s) fail.
 */

describe('WORDS_ES dataset integrity', () => {
  it('has a positive version number', () => {
    expect(WORDS_ES_VERSION).toBeGreaterThan(0);
  });

  it('has at least 520 words', () => {
    expect(WORDS_ES.length).toBeGreaterThanOrEqual(520);
  });

  it('every word has a unique id', () => {
    const ids = WORDS_ES.map(w => w.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(dupes)], `duplicate ids: ${[...new Set(dupes)].join(', ')}`).toHaveLength(0);
  });

  it('every word.word is non-empty', () => {
    const bad = WORDS_ES.filter(w => !w.word || w.word.trim() === '').map(w => w.id);
    expect(bad, `empty word strings: ${bad.join(', ')}`).toHaveLength(0);
  });

  it('every word has non-empty categories with valid Category values', () => {
    const bad: string[] = [];
    for (const word of WORDS_ES) {
      if (!word.categories || word.categories.length === 0) {
        bad.push(`${word.id}: empty categories`);
        continue;
      }
      for (const cat of word.categories) {
        if (!VALID_CATEGORIES.has(cat)) {
          bad.push(`${word.id}: invalid category "${cat}"`);
        }
      }
    }
    expect(bad, `invalid categories:\n${bad.join('\n')}`).toHaveLength(0);
  });

  it('every word has language "es"', () => {
    const bad = WORDS_ES.filter(w => w.language !== 'es').map(w => `${w.id}: lang="${w.language}"`);
    expect(bad, `wrong language:\n${bad.join('\n')}`).toHaveLength(0);
  });

  it('every word has difficulty 1–5', () => {
    const bad = WORDS_ES.filter(w => w.difficulty < 1 || w.difficulty > 5).map(w => `${w.id}: difficulty=${w.difficulty}`);
    expect(bad, `invalid difficulty:\n${bad.join('\n')}`).toHaveLength(0);
  });

  it('every word has phonetic.syllables ≥ 1', () => {
    const bad = WORDS_ES.filter(w => w.phonetic.syllables < 1).map(w => `${w.id}: syllables=${w.phonetic.syllables}`);
    expect(bad, `invalid syllables:\n${bad.join('\n')}`).toHaveLength(0);
  });

  it('every word has a non-empty definition', () => {
    const bad = WORDS_ES.filter(w => !w.definition || w.definition.trim() === '').map(w => w.id);
    expect(bad, `empty definitions: ${bad.join(', ')}`).toHaveLength(0);
  });

  it('every word with a sentence has the blank marker "_____"', () => {
    const bad = WORDS_ES
      .filter(w => w.sentence && !w.sentence.includes('_____'))
      .map(w => `${w.id}: "${w.sentence}"`);
    expect(bad, `sentences missing blank marker:\n${bad.join('\n')}`).toHaveLength(0);
  });

  it('every word image file exists on disk (unless has_image=false)', () => {
    const missing = WORDS_ES
      .filter(w => w.has_image !== false)
      .filter(w => !existsSync(join(STATIC_DIR, w.image_url)))
      .map(w => `${w.id} → ${w.image_url}`);
    expect(missing, `missing image files:\n${missing.join('\n')}`).toHaveLength(0);
  });

  it('enough words have opposites and synonyms for the opposites-synonyms exercise', () => {
    const withOpposite = WORDS_ES.filter(w => w.opposite && w.opposite !== '').length;
    const withSynonyms = WORDS_ES.filter(w => w.synonyms && w.synonyms.length > 0).length;
    // session-generator.ts requires ≥ 3 words with opposites for the exercise to run
    expect(withOpposite, 'need ≥ 3 words with opposites').toBeGreaterThanOrEqual(3);
    expect(withSynonyms, 'need ≥ 3 words with synonyms').toBeGreaterThanOrEqual(3);
  });
});
