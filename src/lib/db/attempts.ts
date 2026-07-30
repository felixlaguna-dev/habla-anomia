import { db } from './database';
import type { Attempt, Language, ExerciseType, Category, Word } from '$lib/types';
import { getWordCategories } from '$lib/types';

/**
 * Record a new attempt. Returns the auto-generated id.
 */
export async function recordAttempt(
  attempt: Omit<Attempt, 'id'>
): Promise<number> {
  return db.attempts.add(attempt as Attempt);
}

/**
 * Get all attempts for a given word, ordered by timestamp descending.
 */
export async function getAttemptsByWord(wordId: string): Promise<Attempt[]> {
  return db.attempts
    .where('word_id')
    .equals(wordId)
    .reverse()
    .sortBy('timestamp');
}

/**
 * Get all attempts on a specific date (YYYY-MM-DD) for a language.
 */
export async function getAttemptsByDate(
  date: string,
  language: Language
): Promise<Attempt[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return db.attempts
    .where('language')
    .equals(language)
    .filter(a => {
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return ts >= dayStart && ts <= dayEnd;
    })
    .toArray();
}

/**
 * Get all attempts for a specific exercise type in a language.
 */
export async function getAttemptsByExercise(
  exerciseType: ExerciseType,
  language: Language
): Promise<Attempt[]> {
  return db.attempts
    .where({ exercise_type: exerciseType, language })
    .toArray();
}

/**
 * Get the most recent N attempts for a language.
 */
export async function getRecentAttempts(
  count: number,
  language: Language
): Promise<Attempt[]> {
  return db.attempts
    .where('language')
    .equals(language)
    .reverse()
    .sortBy('timestamp')
    .then(arr => arr.slice(0, count));
}

/**
 * Calculate accuracy grouped by category for a language.
 * Returns an array of { category, accuracy, correct, total }.
 */
export async function getAccuracyByCategory(
  language: Language
): Promise<Array<{ category: Category; accuracy: number; correct: number; total: number }>> {
  const attempts = await db.attempts
    .where('language')
    .equals(language)
    .toArray();

  // Join with words to get categories (multi-category: credit all categories)
  const wordCategories = new Map<string, Category[]>();
  const wordIds = [...new Set(attempts.map(a => a.word_id))];

  // Batch-fetch word categories
  await Promise.all(
    wordIds.map(async (wid) => {
      const word = await db.words.get(wid);
      if (word) wordCategories.set(wid, getWordCategories(word));
    })
  );

  // Group by category — each word credits ALL its categories
  const grouped = new Map<Category, { correct: number; total: number }>();

  for (const attempt of attempts) {
    const cats = wordCategories.get(attempt.word_id);
    // Skip orphaned attempts whose word was removed from the seed. seedWords()
    // keeps attempts as history but drops the word row, so these have no
    // categories to credit. Verified: the join tolerates missing words.
    if (!cats) continue;
    for (const cat of cats) {
      const entry = grouped.get(cat) ?? { correct: 0, total: 0 };
      entry.total++;
      if (attempt.correct) entry.correct++;
      grouped.set(cat, entry);
    }
  }

  const results: Array<{ category: Category; accuracy: number; correct: number; total: number }> = [];
  for (const [category, { correct, total }] of grouped) {
    results.push({
      category,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      correct,
      total
    });
  }

  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Calculate accuracy grouped by exercise type for a language.
 * Returns an array of { exercise_type, accuracy, correct, total }.
 */
export async function getAccuracyByExercise(
  language: Language
): Promise<Array<{ exercise_type: ExerciseType; accuracy: number; correct: number; total: number }>> {
  const attempts = await db.attempts
    .where('language')
    .equals(language)
    .toArray();

  const grouped = new Map<ExerciseType, { correct: number; total: number }>();

  for (const attempt of attempts) {
    const entry = grouped.get(attempt.exercise_type) ?? { correct: 0, total: 0 };
    entry.total++;
    if (attempt.correct) entry.correct++;
    grouped.set(attempt.exercise_type, entry);
  }

  const results: Array<{ exercise_type: ExerciseType; accuracy: number; correct: number; total: number }> = [];
  for (const [exercise_type, { correct, total }] of grouped) {
    results.push({
      exercise_type,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      correct,
      total
    });
  }

  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Get daily accuracy over the last N days for charts.
 * Returns an array of { date, accuracy, correct, total }.
 */
export async function getAccuracyOverTime(
  days: number,
  language: Language
): Promise<Array<{ date: string; accuracy: number; correct: number; total: number }>> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const attempts = await db.attempts
    .where('language')
    .equals(language)
    .filter(a => {
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return ts >= startDate;
    })
    .toArray();

  // Group by date string YYYY-MM-DD
  const grouped = new Map<string, { correct: number; total: number }>();

  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = formatDate(d);
    grouped.set(key, { correct: 0, total: 0 });
  }

  for (const attempt of attempts) {
    const ts = attempt.timestamp instanceof Date ? attempt.timestamp : new Date(attempt.timestamp);
    const key = formatDate(ts);
    const entry = grouped.get(key);
    if (entry) {
      entry.total++;
      if (attempt.correct) entry.correct++;
    }
  }

  const results: Array<{ date: string; accuracy: number; correct: number; total: number }> = [];
  for (const [date, { correct, total }] of grouped) {
    results.push({
      date,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      correct,
      total
    });
  }

  return results;
}

/**
 * Get today's failed words grouped by exercise type.
 *
 * A word is included for a given exercise type if its most recent attempt
 * today for that type was incorrect. Words that were later answered correctly
 * (in a retry or a new session) are excluded — only still-failing words
 * surface so the review card disappears once everything is cleared.
 *
 * Resolves word_ids to full Word objects via db.words.bulkGet; orphaned attempts
 * (word removed from seed) are silently dropped.
 */
export async function getTodaysFailures(
  language: Language
): Promise<Map<ExerciseType, Word[]>> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const attempts = await db.attempts
    .where('language')
    .equals(language)
    .filter(a => {
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return ts >= todayStart && ts <= todayEnd;
    })
    .toArray();

  // Track the latest attempt per (word_id, exercise_type). Dexie's filter
  // result isn't guaranteed sorted by timestamp, so we compare explicitly.
  // Single map — the key is only for dedup; wordId/exerciseType are read
  // from the value so we never parse the key string back apart.
  interface LatestAttempt { ms: number; correct: boolean; wordId: string; exerciseType: ExerciseType; }
  const latest = new Map<string, LatestAttempt>();
  for (const a of attempts) {
    const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const ms = ts.getTime();
    const key = `${a.word_id}::${a.exercise_type}`;
    const prev = latest.get(key);
    if (!prev || ms > prev.ms) {
      latest.set(key, { ms, correct: a.correct, wordId: a.word_id, exerciseType: a.exercise_type });
    }
  }

  // Group still-failing word_ids by exercise type
  const failingByType = new Map<ExerciseType, Set<string>>();
  for (const { correct, wordId, exerciseType } of latest.values()) {
    if (correct) continue;
    if (!failingByType.has(exerciseType)) failingByType.set(exerciseType, new Set());
    failingByType.get(exerciseType)!.add(wordId);
  }

  // Resolve word_ids to Word objects in a single bulkGet round-trip
  const allWordIds = [...new Set([...failingByType.values()].flatMap(s => [...s]))];
  const wordMap = new Map<string, Word>();
  for (const word of await db.words.bulkGet(allWordIds)) {
    if (word) wordMap.set(word.id, word);
  }

  const result = new Map<ExerciseType, Word[]>();
  for (const [exType, wordIds] of failingByType) {
    const words = [...wordIds].map(id => wordMap.get(id)).filter((w): w is Word => !!w);
    if (words.length > 0) result.set(exType, words);
  }

  return result;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
