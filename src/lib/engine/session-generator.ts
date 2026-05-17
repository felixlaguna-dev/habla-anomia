import type { Language, ExerciseType, Category, Word } from '$lib/types';
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

  // ── Special handling for category-sorting: need ≥2 categories ──
  if (exerciseType === 'category-sorting') {
    const categories = await pickCategories(language, Math.min(4, wordCount));
    if (categories.length < 2) {
      return { exerciseType, words: [] };
    }
    const perCat = Math.max(2, Math.ceil(wordCount / categories.length));
    const sortingWords: Word[] = [];
    for (const cat of categories) {
      const catWords = shuffleArray(await getWordsByCategory(cat, language)).slice(0, perCat);
      sortingWords.push(...catWords);
    }
    return { exerciseType, words: shuffleArray(sortingWords).slice(0, wordCount) };
  }

  // ── Special handling for generative-naming: need a category ──
  if (exerciseType === 'generative-naming') {
    const allCats = await getAllPopulatedCategories(language);
    if (allCats.length === 0) {
      return { exerciseType, words: [] };
    }
    const cat = allCats[Math.floor(Math.random() * allCats.length)];
    const catWords = await getWordsByCategory(cat, language);
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
    if (word) {
      selectedIds.add(id);
      words.push(word);
    }
  }

  // ── 2. Fill from weak categories ─────────────────────────────────────
  if (words.length < wordCount) {
    const weakCategories = await getWeakCategories(language, 3);
    for (const cat of weakCategories) {
      if (words.length >= wordCount) break;
      const catWords = await getWordsByCategory(cat, language);
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
    const randomWords = await getRandomWords(remaining * 2, language);
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
 * Generate a recommended daily plan comprising multiple sessions:
 *
 *   - Picture naming with due SR words (10 words)
 *   - SFA session with weak-category words (5 words)
 *   - Category sorting session (8 words, mixed categories)
 *   - Review session – generative naming or word matching (10 words)
 */
export async function generateDailyPlan(language: Language): Promise<SessionPlan[]> {
  const plans: SessionPlan[] = [];

  // 1. Picture naming with due words
  const pictureNaming = await generateSession(language, 'picture-naming', 10);
  plans.push(pictureNaming);

  // 2. SFA session – pick one weak category and use its words
  const weakCategories = await getWeakCategories(language, 1);
  const sfaCategory = weakCategories[0];
  if (sfaCategory) {
    const catWords = await getWordsByCategory(sfaCategory, language);
    const sfaWords = shuffleArray(catWords).slice(0, 5);
    plans.push({
      exerciseType: 'semantic-features',
      words: sfaWords,
      category: sfaCategory
    });
  } else {
    // No weak categories yet – use random words
    const randomWords = await getRandomWords(5, language);
    plans.push({
      exerciseType: 'semantic-features',
      words: randomWords
    });
  }

  // 3. Category sorting – mix words from two categories
  const categories = weakCategories.length >= 2
    ? weakCategories.slice(0, 2)
    : await pickCategories(language, 2);
  const sortingWords: Word[] = [];
  for (const cat of categories) {
    const catWords = await getWordsByCategory(cat, language);
    sortingWords.push(...shuffleArray(catWords).slice(0, 4));
  }
  plans.push({
    exerciseType: 'category-sorting',
    words: shuffleArray(sortingWords).slice(0, 8),
    category: categories[0]
  });

  // 4. Review session – alternate between generative naming and word matching
  const reviewType: ExerciseType = Math.random() < 0.5
    ? 'generative-naming'
    : 'word-matching';
  const reviewSession = await generateSession(language, reviewType, 10);
  plans.push(reviewSession);

  return plans;
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
 */
async function getAllPopulatedCategories(language: Language): Promise<Category[]> {
  const words = await db.words
    .where('language')
    .equals(language)
    .toArray();
  const categorySet = new Set<Category>();
  for (const w of words) {
    categorySet.add(w.category);
  }
  return [...categorySet].sort();
}

/**
 * Pick N distinct categories from the word bank (randomly).
 */
async function pickCategories(
  language: Language,
  count: number
): Promise<Category[]> {
  const all = await getAllPopulatedCategories(language);
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
