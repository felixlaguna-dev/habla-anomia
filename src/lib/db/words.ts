import { db } from './database';
import type { Word, Language, Category } from '$lib/types';
import { getWordCategories } from '$lib/types';
import { getSetting, setSetting } from './settings';

/**
 * Global promise that resolves once the word bank has been seeded.
 * Layout calls resolveSeedReady() after seeding.
 * Exercise pages call awaitSeedReady() before querying words.
 */
let seedReadyResolve: () => void;
const seedReadyPromise = new Promise<void>((resolve) => {
  seedReadyResolve = resolve;
});

export function resolveSeedReady(): void {
  seedReadyResolve();
}

export async function awaitSeedReady(timeout = 15000): Promise<void> {
  const timer = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('DB seed timeout')), timeout)
  );
  await Promise.race([seedReadyPromise, timer]);
}

/**
 * Get all words in a given category for a language.
 * Checks if the category is in the word's categories array.
 */
export async function getWordsByCategory(
  category: Category,
  language: Language
): Promise<Word[]> {
  return db.words
    .where('language')
    .equals(language)
    .filter(w => getWordCategories(w).includes(category))
    .toArray();
}

/**
 * Get words whose difficulty falls within [min, max] for a language.
 */
export async function getWordsByDifficulty(
  min: number,
  max: number,
  language: Language
): Promise<Word[]> {
  return db.words
    .where('language').equals(language)
    .filter(w => w.difficulty >= min && w.difficulty <= max)
    .toArray();
}

/**
 * Get random words for exercises. Optionally filter by category.
 */
export async function getRandomWords(
  count: number,
  language: Language,
  category?: Category
): Promise<Word[]> {
  let collection = db.words.where('language').equals(language);

  const total = await collection.count();
  if (total === 0) return [];

  // If requesting more words than exist, return all shuffled
  if (count >= total) {
    let all = await collection.toArray();
    if (category) all = all.filter(w => getWordCategories(w).includes(category));
    return shuffleArray(all);
  }

  // Pick a random starting offset and wrap around to get enough words
  const offset = Math.floor(Math.random() * total);
  const result: Word[] = [];

  // First batch: from offset to end
  let firstBatch = await collection.offset(offset).limit(count).toArray();
  if (category) firstBatch = firstBatch.filter(w => getWordCategories(w).includes(category));
  result.push(...firstBatch);

  // If we didn't get enough, wrap around from the beginning
  if (result.length < count) {
    const remaining = count - result.length;
    let secondBatch = await db.words.where('language').equals(language).limit(remaining).toArray();
    if (category) secondBatch = secondBatch.filter(w => getWordCategories(w).includes(category));
    result.push(...secondBatch);
  }

  return shuffleArray(result).slice(0, count);
}

/**
 * Look up a single word by its id.
 */
export async function getWordById(id: string): Promise<Word | undefined> {
  return db.words.get(id);
}

/**
 * Seed/sync the word bank from a source list, keyed by `seed_version_<lang>`.
 *
 * Version-gated upsert semantics so existing installs receive edits and
 * removals rather than being stuck with the first seed forever:
 *   - Fast path: when the stored version equals `version` AND the on-disk word
 *     count matches the source, skip entirely.
 *   - Sync path: upsert ALL source words (overwrites edited fields), delete DB
 *     words in the language whose id is absent from the source, prune
 *     spacedRepetition rows that reference those removed ids, then store the
 *     new version.
 *
 * Attempts (history) and spacedRepetition entries for words that still exist
 * are never touched — user progress survives.
 */
export async function seedWords(words: Word[], version: number): Promise<void> {
  if (words.length === 0) return;

  const languages = [...new Set(words.map(w => w.language))];

  await db.transaction('rw', db.words, db.spacedRepetition, db.settings, async () => {
    for (const lang of languages) {
      const langWords = words.filter(w => w.language === lang);
      const versionKey = `seed_version_${lang}`;
      const storedVersion = await getSetting<number>(versionKey);
      // One index-only read: the id list feeds both the fast-path count check
      // and the removed-id diff in syncLanguage().
      const existingIds = await db.words.where('language').equals(lang).primaryKeys();

      // Fast path: same version and count → nothing to sync. The count clause
      // also catches add/remove changes if WORDS_ES_VERSION wasn't bumped.
      if (storedVersion === version && existingIds.length === langWords.length) {
        continue;
      }

      await syncLanguage(langWords, new Set(existingIds));
      await setSetting(versionKey, version);
    }
  });
}

/**
 * Upsert all source words and drop DB words/SR entries that no longer exist in
 * the source. `existingIds` is the pre-sync id set (captured by the caller), so
 * removed ids = existing − source. Runs inside the caller's transaction.
 */
async function syncLanguage(langWords: Word[], existingIds: Set<string>): Promise<void> {
  // Upsert: overwrites edited words, adds new ones.
  await db.words.bulkPut(langWords);

  const sourceIds = new Set(langWords.map(w => w.id));
  const removedIds = [...existingIds].filter(id => !sourceIds.has(id));

  if (removedIds.length > 0) {
    await db.words.bulkDelete(removedIds);
    // Prune spaced-repetition progress for removed words. Attempts are kept as
    // historical record (getAccuracyByCategory skips attempts whose word is
    // gone — see src/lib/db/attempts.ts).
    await db.spacedRepetition
      .where('word_id')
      .anyOf(removedIds)
      .delete();
  }
}

/**
 * List all distinct categories that have words for a given language.
 */
export async function getCategories(language: Language): Promise<Category[]> {
  const words = await db.words
    .where('language')
    .equals(language)
    .toArray();

  const categorySet = new Set<Category>();
  for (const w of words) {
    for (const cat of getWordCategories(w)) {
      categorySet.add(cat);
    }
  }

  return [...categorySet].sort();
}

/**
 * Search words by text (case-insensitive partial match) within a language.
 */
export async function searchWords(
  query: string,
  language: Language
): Promise<Word[]> {
  const lowerQuery = query.toLowerCase();
  return db.words
    .where('language')
    .equals(language)
    .filter(w => w.word.toLowerCase().includes(lowerQuery))
    .toArray();
}

/** Fisher-Yates shuffle */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
