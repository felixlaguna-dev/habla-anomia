import { db } from './database';
import type { Word, Language, Category } from '$lib/types';

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
    .filter(w => w.categories.includes(category))
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
    if (category) all = all.filter(w => w.categories.includes(category));
    return shuffleArray(all);
  }

  // Pick a random starting offset and wrap around to get enough words
  const offset = Math.floor(Math.random() * total);
  const result: Word[] = [];

  // First batch: from offset to end
  let firstBatch = await collection.offset(offset).limit(count).toArray();
  if (category) firstBatch = firstBatch.filter(w => w.categories.includes(category));
  result.push(...firstBatch);

  // If we didn't get enough, wrap around from the beginning
  if (result.length < count) {
    const remaining = count - result.length;
    let secondBatch = await db.words.where('language').equals(language).limit(remaining).toArray();
    if (category) secondBatch = secondBatch.filter(w => w.categories.includes(category));
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
 * Bulk insert a word bank. Checks if the words are already seeded by
 * verifying the count for the given language matches — if so, skips.
 */
export async function seedWords(words: Word[]): Promise<void> {
  if (words.length === 0) return;

  const languages = [...new Set(words.map(w => w.language))];

  await db.transaction('rw', db.words, async () => {
    for (const lang of languages) {
      const langWords = words.filter(w => w.language === lang);
      const existingCount = await db.words.where('language').equals(lang).count();

      if (existingCount >= langWords.length) {
        // Already seeded for this language
        continue;
      }

      // Only insert words that don't already exist
      const existingIds = new Set(
        (await db.words.where('language').equals(lang).toArray()).map(w => w.id)
      );
      const newWords = langWords.filter(w => !existingIds.has(w.id));

      if (newWords.length > 0) {
        await db.words.bulkAdd(newWords);
      }
    }
  });
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
    for (const cat of w.categories) {
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
