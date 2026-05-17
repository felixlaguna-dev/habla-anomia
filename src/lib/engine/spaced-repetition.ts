import { db } from '$lib/db/database';
import type { Language, SpacedRepetitionEntry } from '$lib/types';

// SM-2 algorithm parameters
const MIN_EASE = 1.3;
const INITIAL_INTERVAL = 1; // 1 day
const DEFAULT_EASE = 2.5;

/**
 * Get word IDs that are due for review (next_review <= now), up to `count`.
 * Also includes words that have NO SR card yet (new words are always "due").
 */
export async function getDueWords(language: Language, count: number): Promise<string[]> {
  const now = new Date();
  const dueIds: string[] = [];

  // 1. Get words with existing SR entries that are due
  const dueEntries = await db.spacedRepetition
    .where('language')
    .equals(language)
    .filter(e => {
      const reviewDate = e.next_review instanceof Date ? e.next_review : new Date(e.next_review);
      return reviewDate <= now;
    })
    .limit(count)
    .toArray();

  for (const entry of dueEntries) {
    dueIds.push(entry.word_id);
  }

  if (dueIds.length >= count) return dueIds.slice(0, count);

  // 2. Fill remaining slots with words that have NO SR card yet (new words = due)
  const srWordIds = new Set(
    (await db.spacedRepetition
      .where('language')
      .equals(language)
      .toArray()
    ).map(e => e.word_id)
  );

  const allWords = await db.words
    .where('language')
    .equals(language)
    .toArray();

  for (const w of allWords) {
    if (dueIds.length >= count) break;
    if (!srWordIds.has(w.id) && !dueIds.includes(w.id)) {
      dueIds.push(w.id);
    }
  }

  return dueIds;
}

/**
 * Update the spaced repetition entry for a word after an attempt.
 *
 * Uses a simplified SM-2 approach:
 *   correct (boolean) → true means interval grows, false means interval resets to 1 day.
 *   Internally maps: correct=true → quality=5, correct=false → quality=0
 */
export async function updateAfterAttempt(
  wordId: string,
  language: Language,
  correct: boolean
): Promise<void> {
  const quality = correct ? 5 : 0;

  // Try compound index first, fall back to filter
  let entry = await db.spacedRepetition
    .where('[word_id+language]')
    .equals([wordId, language] as any)
    .first();

  if (!entry) {
    entry = await db.spacedRepetition
      .where('language')
      .equals(language)
      .filter(e => e.word_id === wordId)
      .first();
  }

  if (!entry) {
    // Auto-initialise then recurse once
    await initializeSR(wordId, language);
    return updateAfterAttempt(wordId, language, correct);
  }

  let { interval, ease_factor, repetitions } = entry;

  if (quality >= 3) {
    // Successful recall – advance schedule
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions++;

    // Adjust ease factor per SM-2 formula
    ease_factor =
      ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease_factor < MIN_EASE) {
      ease_factor = MIN_EASE;
    }
  } else {
    // Failed recall – restart schedule
    repetitions = 0;
    interval = 1;
    // Ease factor is intentionally NOT reset so the word isn't punished indefinitely
  }

  // Compute next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await db.spacedRepetition.update(entry.id!, {
    interval,
    ease_factor,
    repetitions,
    next_review: nextReview
  });
}

/**
 * Create an initial spaced repetition entry for a word.
 * If one already exists this is a no-op.
 * next_review is set to NOW (immediately due) so new words appear in sessions.
 */
export async function initializeSR(
  wordId: string,
  language: Language
): Promise<void> {
  // Check for existing entry via compound index, fall back to filter
  let existing = await db.spacedRepetition
    .where('[word_id+language]')
    .equals([wordId, language] as any)
    .first();

  if (!existing) {
    existing = await db.spacedRepetition
      .where('language')
      .equals(language)
      .filter(e => e.word_id === wordId)
      .first();
  }

  if (existing) return; // already initialised

  // New words are immediately due (next_review = now)
  const entry: Omit<SpacedRepetitionEntry, 'id'> = {
    word_id: wordId,
    next_review: new Date(),
    interval: INITIAL_INTERVAL,
    ease_factor: DEFAULT_EASE,
    repetitions: 0,
    language
  };

  await db.spacedRepetition.add(entry as SpacedRepetitionEntry);
}

/**
 * Get aggregate stats about spaced repetition progress for a language.
 * Now includes "new" words (those with no SR card at all).
 */
export async function getSRStats(language: Language): Promise<{
  due: number;
  learning: number;
  mastered: number;
  new: number;
}> {
  const now = new Date();
  const all = await db.spacedRepetition
    .where('language')
    .equals(language)
    .toArray();

  let due = 0;
  let learning = 0;
  let mastered = 0;

  for (const entry of all) {
    const reviewDate =
      entry.next_review instanceof Date
        ? entry.next_review
        : new Date(entry.next_review);

    if (reviewDate <= now) {
      due++;
    }

    if (entry.repetitions < 3) {
      learning++;
    } else if (entry.repetitions >= 5) {
      mastered++;
    }
  }

  // Count words with no SR entry = "new"
  const srWordIds = new Set(all.map(e => e.word_id));
  const allWords = await db.words
    .where('language')
    .equals(language)
    .toArray();
  const newCount = allWords.filter(w => !srWordIds.has(w.id)).length;

  return { due, learning, mastered, new: newCount };
}

/**
 * Return the next scheduled review date for a word, or null if no SR entry exists.
 */
export async function getNextReviewDate(
  wordId: string
): Promise<Date | null> {
  const entry = await db.spacedRepetition
    .filter(e => e.word_id === wordId)
    .first();

  if (!entry) return null;

  return entry.next_review instanceof Date
    ? entry.next_review
    : new Date(entry.next_review);
}
