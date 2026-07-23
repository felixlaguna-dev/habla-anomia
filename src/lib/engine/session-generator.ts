import type { Language, ExerciseType, Category, Word } from '$lib/types';
import { getWordCategories, wordHasImage } from '$lib/types';
import { IMAGE_DEPENDENT_EXERCISES } from '$lib/exercises/registry';
import { getDueWords } from './spaced-repetition';
import { getRandomWords, getWordsByCategory, getWordById } from '$lib/db/words';
import { getAccuracyByCategory } from '$lib/db/attempts';
import { db } from '$lib/db/database';

export interface SessionPlan {
  exerciseType: ExerciseType;
  words: Word[];
  category?: Category;
}

/**
 * Generate a single exercise session.
 *
 * Priority order:
 *   1. Due words from the spaced repetition queue
 *   2. Words from the user's weakest categories
 *   3. Random words to fill the remaining slots
 *
 * The final word list is shuffled.
 */
export async function generateSession(
  language: Language,
  exerciseType: ExerciseType,
  wordCount: number = 10
): Promise<SessionPlan> {
  const selectedIds = new Set<string>();
  const words: Word[] = [];
  const needsImage = IMAGE_DEPENDENT_EXERCISES.includes(exerciseType);

  // ── Special handling for category-sorting: need ≥2 categories ──
  if (exerciseType === 'category-sorting') {
    const categories = await pickCategories(language, Math.min(4, wordCount), needsImage);
    if (categories.length < 2) {
      return { exerciseType, words: [] };
    }
    const perCat = Math.max(2, Math.ceil(wordCount / categories.length));
    const sortingWords: Word[] = [];
    for (const cat of categories) {
      const catWords = shuffleArray(await getWordsByCategory(cat, language))
        .filter(w => !needsImage || wordHasImage(w))
        .slice(0, perCat);
      sortingWords.push(...catWords);
    }
    return { exerciseType, words: shuffleArray(sortingWords).slice(0, wordCount) };
  }

  // ── Special handling for opposites-synonyms: need words with opposite data ──
  if (exerciseType === 'opposites-synonyms') {
    // Prefer words with opposites (core exercise), fall back to words with synonyms
    const withOpposite = await db.words
      .where('language')
      .equals(language)
      .filter((w: Word) => !!(w.opposite && w.opposite !== '') && (!needsImage || wordHasImage(w)))
      .toArray();

    if (withOpposite.length >= 3) {
      return { exerciseType, words: shuffleArray(withOpposite).slice(0, wordCount) };
    }

    // Fallback: use words with synonyms
    const withSynonyms = await db.words
      .where('language')
      .equals(language)
      .filter((w: Word) => !!(w.synonyms && w.synonyms.length > 0) && (!needsImage || wordHasImage(w)))
      .toArray();

    if (withSynonyms.length === 0) {
      return { exerciseType, words: [] };
    }

    return {
      exerciseType,
      words: shuffleArray(withSynonyms).slice(0, wordCount)
    };
  }

  // ── Special handling for generative-naming: need a category ──
  if (exerciseType === 'generative-naming') {
    const allCats = await getAllPopulatedCategories(language, needsImage);
    if (allCats.length === 0) {
      return { exerciseType, words: [] };
    }
    const cat = allCats[Math.floor(Math.random() * allCats.length)];
    const catWords = (await getWordsByCategory(cat, language))
      .filter(w => !needsImage || wordHasImage(w));
    return {
      exerciseType,
      words: shuffleArray(catWords).slice(0, wordCount),
      category: cat
    };
  }

  // ── 1. Priority: due words from spaced repetition ────────────────────
  const dueIds = await getDueWords(language, wordCount);
  for (const id of dueIds) {
    if (selectedIds.size >= wordCount) break;
    const word = await getWordById(id);
    if (word && (!needsImage || wordHasImage(word))) {
      selectedIds.add(id);
      words.push(word);
    }
  }

  // ── 2. Fill from weak categories ─────────────────────────────────────
  if (words.length < wordCount) {
    const weakCategories = await getWeakCategories(language, 3);
    for (const cat of weakCategories) {
      if (words.length >= wordCount) break;
      const catWords = (await getWordsByCategory(cat, language))
        .filter(w => !needsImage || wordHasImage(w));
      const shuffled = shuffleArray(catWords);
      for (const w of shuffled) {
        if (words.length >= wordCount) break;
        if (!selectedIds.has(w.id)) {
          selectedIds.add(w.id);
          words.push(w);
        }
      }
    }
  }

  // ── 3. Fill remaining with random words ──────────────────────────────
  if (words.length < wordCount) {
    const remaining = wordCount - words.length;
    // Fetch more than needed to allow for overlap filtering
    let randomWords = await getRandomWords(remaining * 2, language);
    if (needsImage) randomWords = randomWords.filter(wordHasImage);
    for (const w of randomWords) {
      if (words.length >= wordCount) break;
      if (!selectedIds.has(w.id)) {
        selectedIds.add(w.id);
        words.push(w);
      }
    }
  }

  return {
    exerciseType,
    words: shuffleArray(words)
  };
}

/**
 * Return the categories with the lowest accuracy for a given language.
 * Falls back to categories with the fewest attempts, then random order.
 */
export async function getWeakCategories(
  language: Language,
  count: number = 3
): Promise<Category[]> {
  const accuracyData = await getAccuracyByCategory(language);

  // Sort by accuracy ascending (weakest first), break ties by most attempts
  const sorted = [...accuracyData].sort((a, b) => {
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return b.total - a.total;
  });

  const weak = sorted.slice(0, count).map(d => d.category);

  // If no accuracy data yet, return random categories from the word bank
  if (weak.length === 0) {
    const allCategories = await getAllPopulatedCategories(language);
    return shuffleArray(allCategories).slice(0, count);
  }

  return weak;
}

// ─── Internal helpers ────────────────────────────────────────────────────

/**
 * Get all categories that actually have words in the DB for a given language.
 * If needsImage is true, only counts words that have images.
 */
async function getAllPopulatedCategories(language: Language, needsImage: boolean = false): Promise<Category[]> {
  const words = await db.words
    .where('language')
    .equals(language)
    .toArray();
  const categorySet = new Set<Category>();
  for (const w of words) {
    if (needsImage && !wordHasImage(w)) continue;
    for (const cat of getWordCategories(w)) {
      categorySet.add(cat);
    }
  }
  return [...categorySet].sort();
}

/**
 * Pick N distinct categories from the word bank (randomly).
 * If needsImage is true, only picks categories that have image-bearing words.
 */
async function pickCategories(
  language: Language,
  count: number,
  needsImage: boolean = false
): Promise<Category[]> {
  const all = await getAllPopulatedCategories(language, needsImage);
  return shuffleArray(all).slice(0, count);
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
