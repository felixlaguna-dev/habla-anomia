import type { Language, ExerciseType, Category, Word, DifficultyLevel, Attempt } from '$lib/types';
import { getWordCategories, wordHasImage, IMAGE_DEPENDENT_EXERCISES } from '$lib/types';
import { getDueWords } from './spaced-repetition';
import { getRandomWords, getWordsByCategory, getWordById, getCategoryWordCounts } from '$lib/db/words';
import { getAccuracyByCategory, getRecentAttempts } from '$lib/db/attempts';
import { db } from '$lib/db/database';

export interface SessionPlan {
  exerciseType: ExerciseType;
  words: Word[];
  category?: Category;
}

/** Optional constraints for {@link generateSession}. */
export interface SessionOptions {
  /**
   * Restrict every selection pool to one semantic category. When set, due words
   * come from that category first, then random words within it; the weak-
   * category step is skipped (it would just re-select the same category).
   */
  category?: Category;
}

/** Number of past attempts used to gauge the user's current level. */
const LEVEL_ATTEMPT_WINDOW = 50;

/**
 * Map a rolling accuracy (0-100) to the highest word difficulty (1-5) the user
 * is ready for. Pure: no DB access, safe to unit-test directly.
 *
 *   < 60   → 2 (early recovery)
 *   60-75  → 3
 *   75-85  → 4
 *   >= 85  → 5
 *
 * The no-history default (max 2) lives in {@link getUserMaxDifficulty}; here a
 * caller passing accuracy 0 already gets 2.
 */
export function maxDifficultyFromAccuracy(accuracy: number): DifficultyLevel {
  if (accuracy < 60) return 2;
  if (accuracy < 75) return 3;
  if (accuracy < 85) return 4;
  return 5;
}

/**
 * Highest word difficulty (1-5) the user should see in new sessions, derived
 * from rolling accuracy over their last {@link LEVEL_ATTEMPT_WINDOW} attempts
 * for `language`.
 *
 * Pass `attempts` explicitly to keep the call pure for tests; when omitted the
 * recent attempts are read from the DB. Exported so the UI can surface the
 * user's current level later.
 */
export async function getUserMaxDifficulty(
  language: Language,
  attempts?: Attempt[]
): Promise<DifficultyLevel> {
  const recent = attempts ?? await getRecentAttempts(LEVEL_ATTEMPT_WINDOW, language);
  if (recent.length === 0) return 2;
  const correct = recent.filter(a => a.correct).length;
  const accuracy = (correct / recent.length) * 100;
  return maxDifficultyFromAccuracy(accuracy);
}

/**
 * Keep only words at or below `cap`. If that leaves fewer than `needed`, relax
 * the cap one level at a time (up to 5) so an early-stage user still gets a
 * full session rather than a short one — the floor never shrinks a session.
 * Pure and deterministic; the caller shuffles/sorts the result.
 */
export function applyDifficultyFloor(
  words: Word[],
  cap: DifficultyLevel,
  needed: number
): Word[] {
  if (words.length <= needed) return words;
  let current = cap;
  while (current < 5) {
    const filtered = words.filter(w => w.difficulty <= current);
    if (filtered.length >= needed) return filtered;
    current = (current + 1) as DifficultyLevel;
  }
  return words;
}

/**
 * Order words easy-to-hard. Shuffle first so the subsequent stable sort keeps a
 * random order within each difficulty bucket — variety session-to-session, but
 * always progressing from easy to hard within a session.
 */
export function sortByDifficulty(words: Word[]): Word[] {
  return shuffleArray(words).sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Pick the `n` easiest words from a pool: filter to the cap (relaxing via the
 * floor if the pool can't otherwise supply `n`), order easy-to-hard, and take
 * the first `n`. Convenience over {@link applyDifficultyFloor} +
 * {@link sortByDifficulty}.
 */
function pickByDifficulty(words: Word[], cap: DifficultyLevel, n: number): Word[] {
  return sortByDifficulty(applyDifficultyFloor(words, cap, n)).slice(0, n);
}

/**
 * Generate a single exercise session.
 *
 * Priority order:
 *   1. Due words from the spaced repetition queue (these BYPASS the difficulty
 *      cap — if SM-2 says a hard word is due, the user has seen it before)
 *   2. Words from the user's weakest categories
 *   3. Random words to fill the remaining slots
 *
 * Candidate pools (except due words) are filtered to the user's current
 * difficulty level (see {@link getUserMaxDifficulty}), relaxing only when a
 * pool can't otherwise fill the session. The final word list is ordered
 * easy-to-hard so sessions ramp up gently.
 *
 * When `options.category` is set, every pool is restricted to that one
 * semantic field — due words from it first, then random words within it, and
 * the weak-category step is skipped.
 */
export async function generateSession(
  language: Language,
  exerciseType: ExerciseType,
  wordCount: number = 10,
  options: SessionOptions = {}
): Promise<SessionPlan> {
  const { category } = options;
  const selectedIds = new Set<string>();
  const words: Word[] = [];
  const needsImage = IMAGE_DEPENDENT_EXERCISES.includes(exerciseType);
  const maxDifficulty = await getUserMaxDifficulty(language);
  const inCategory = (w: Word) => !category || getWordCategories(w).includes(category);

  // ── Special handling for category-sorting: need >= 2 categories ──
  // A single forced category can't populate ≥ 2 bins, so this exercise ignores
  // `options.category` (the practice chooser never offers it with one anyway).
  if (exerciseType === 'category-sorting') {
    const categories = await pickCategories(language, Math.min(4, wordCount), needsImage);
    if (categories.length < 2) {
      return { exerciseType, words: [] };
    }
    const perCat = Math.max(2, Math.ceil(wordCount / categories.length));
    const sortingWords: Word[] = [];
    for (const cat of categories) {
      const catWords = (await getWordsByCategory(cat, language))
        .filter(w => !needsImage || wordHasImage(w));
      // The component re-shuffles presentation, so keep a shuffle here to avoid
      // biasing which category gets trimmed when slicing to wordCount.
      const capped = applyDifficultyFloor(catWords, maxDifficulty, perCat);
      sortingWords.push(...shuffleArray(capped).slice(0, perCat));
    }
    return { exerciseType, words: shuffleArray(sortingWords).slice(0, wordCount) };
  }

  // ── Special handling for opposites-synonyms: need words with opposite data ──
  if (exerciseType === 'opposites-synonyms') {
    // Prefer words with opposites (core exercise), fall back to words with synonyms
    const withOpposite = await db.words
      .where('language')
      .equals(language)
      .filter((w: Word) => !!(w.opposite && w.opposite !== '') && (!needsImage || wordHasImage(w)) && inCategory(w))
      .toArray();

    // Viability check is on the raw pool: applyDifficultyFloor only ever
    // narrows (or relaxes back to the full set), so a non-empty pool stays
    // non-empty, and >= 3 here implies >= 3 after capping.
    if (withOpposite.length >= 3) {
      return { exerciseType, words: pickByDifficulty(withOpposite, maxDifficulty, wordCount), category };
    }

    // Fallback: use words with synonyms
    const withSynonyms = await db.words
      .where('language')
      .equals(language)
      .filter((w: Word) => !!(w.synonyms && w.synonyms.length > 0) && (!needsImage || wordHasImage(w)) && inCategory(w))
      .toArray();

    if (withSynonyms.length === 0) {
      return { exerciseType, words: [], category };
    }

    return {
      exerciseType,
      words: pickByDifficulty(withSynonyms, maxDifficulty, wordCount),
      category
    };
  }

  // ── Special handling for generative-naming: need a category ──
  if (exerciseType === 'generative-naming') {
    // Honor a forced category; otherwise pick one at random.
    if (category) {
      const catWords = (await getWordsByCategory(category, language))
        .filter(w => !needsImage || wordHasImage(w));
      return {
        exerciseType,
        words: pickByDifficulty(catWords, maxDifficulty, wordCount),
        category
      };
    }
    const allCats = await getAllPopulatedCategories(language, needsImage);
    if (allCats.length === 0) {
      return { exerciseType, words: [] };
    }
    const cat = allCats[Math.floor(Math.random() * allCats.length)];
    const catWords = (await getWordsByCategory(cat, language))
      .filter(w => !needsImage || wordHasImage(w));
    return {
      exerciseType,
      words: pickByDifficulty(catWords, maxDifficulty, wordCount),
      category: cat
    };
  }

  // When drilling a category, its pool is fetched lazily on first fill (see the
  // loop below) so returning users whose due words already fill the session
  // never pay the fetch. The difficulty floor is applied once at the widest band
  // needed, not per iteration.
  let flooredCategoryPool: Word[] | null = null;

  // ── 1. Priority: due words from spaced repetition (bypass cap) ───────
  // SM-2 already deemed these due — the user has seen them, so difficulty is
  // secondary to review timing. When drilling a category, only due words from
  // it qualify.
  const dueIds = await getDueWords(language, wordCount);
  for (const id of dueIds) {
    if (selectedIds.size >= wordCount) break;
    const word = await getWordById(id);
    if (word && (!needsImage || wordHasImage(word)) && inCategory(word)) {
      selectedIds.add(id);
      words.push(word);
    }
  }

  // ── 2. Fill from weak categories ─────────────────────────────────────
  // Skipped when drilling a single category — "weak categories" has no meaning
  // for a user-chosen field, and the random fill below already covers it.
  if (!category && words.length < wordCount) {
    const weakCategories = await getWeakCategories(language, 3);
    // Gather the full weak pool (deduped — words can span categories) so the
    // floor check sees the real number of usable words. Fetch in parallel.
    const catWordLists = await Promise.all(
      weakCategories.map(cat => getWordsByCategory(cat, language))
    );
    const weakPoolMap = new Map<string, Word>();
    for (const catWords of catWordLists) {
      for (const w of catWords) {
        if ((!needsImage || wordHasImage(w)) && !weakPoolMap.has(w.id)) {
          weakPoolMap.set(w.id, w);
        }
      }
    }
    const remaining = wordCount - words.length;
    const capped = applyDifficultyFloor([...weakPoolMap.values()], maxDifficulty, remaining);
    for (const w of shuffleArray(capped)) {
      if (words.length >= wordCount) break;
      if (!selectedIds.has(w.id)) {
        selectedIds.add(w.id);
        words.push(w);
      }
    }
  }

  // ── 3. Fill remaining with random words ──────────────────────────────
  // When drilling a category, draw from its (lazily-fetched, once-floored)
  // pool; otherwise refetch in a loop so a window that overlaps heavily with
  // already-chosen due/weak words gets another draw instead of leaving the
  // session short. Each random fetch is floored to the user's level (relaxing
  // only when an easy fetch can't cover the remaining slots). The guard bounds
  // work when the bank is genuinely too small to fill — we never loop forever.
  let guard = 0;
  while (words.length < wordCount && guard++ < 4) {
    const remaining = wordCount - words.length;
    let randomWords: Word[];
    if (category) {
      if (flooredCategoryPool === null) {
        const pool = (await getWordsByCategory(category, language))
          .filter(w => !needsImage || wordHasImage(w));
        flooredCategoryPool = applyDifficultyFloor(pool, maxDifficulty, wordCount);
      }
      randomWords = flooredCategoryPool;
    } else {
      randomWords = await getRandomWords(remaining * 2, language);
      if (needsImage) randomWords = randomWords.filter(wordHasImage);
      randomWords = applyDifficultyFloor(randomWords, maxDifficulty, remaining);
    }
    for (const w of shuffleArray(randomWords)) {
      if (words.length >= wordCount) break;
      if (!selectedIds.has(w.id)) {
        selectedIds.add(w.id);
        words.push(w);
      }
    }
  }

  return {
    exerciseType,
    words: sortByDifficulty(words),
    category
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
 * All categories that actually have words in the DB for a given language
 * (optionally image-bearing). Delegates to the shared tally in the db layer so
 * the "scan the language, count by category" loop has one home.
 */
async function getAllPopulatedCategories(language: Language, needsImage: boolean = false): Promise<Category[]> {
  const counts = await getCategoryWordCounts(language, needsImage);
  return [...counts.keys()].sort();
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
