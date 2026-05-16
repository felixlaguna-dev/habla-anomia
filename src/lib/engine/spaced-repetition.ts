import { db } from '$lib/db/database';
import type { Language, SpacedRepetitionEntry } from '$lib/types';

// SM-2 algorithm parameters
const MIN_EASE = 1.3;
const INITIAL_INTERVAL = 1; // 1 day
const DEFAULT_EASE = 2.5;

/**
 * Get word IDs that are due for review (next_review <= now), up to `count`.
 */
export async function getDueWords(language: Language, count: number): Promise<string[]> {
  const now = new Date();
  const entries = await db.spacedRepetition
    .where('language')
    .equals(language)
    .filter(e => {
      const reviewDate = e.next_review instanceof Date ? e.next_review : new Date(e.next_review);
      return reviewDate <= now;
    })
    .limit(count)
    .toArray();
  return entries.map(e => e.word_id);
}

/**
 * Update the spaced repetition entry for a word after the user rates their recall quality.
 *
 * Quality scale (SM-2):
 *   0 – complete failure, no recall
 *   1 – incorrect, but recognised upon seeing the answer
 *   2 – incorrect, but the answer seemed easy to recall
 *   3 – correct with serious difficulty
 *   4 – correct with some hesitation
 *   5 – perfect recall
 *
 * If quality >= 3 the interval grows; otherwise the word is reset to the
 * beginning of its schedule (repetitions back to 0, interval back to 1 day)
 * but the ease factor is *not* reset so the word won't punished indefinitely.
 */
export async function updateAfterAttempt(
  wordId: string,
  language: Language,
  quality: number
): Promise<void> {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, quality));

  // Fetch or create the entry
  let entry = await db.spacedRepetition
    .where('[word_id+language]')
    .equals([wordId, language] as any)
    .first();

  // Dexie compound index not declared, so fall back to filter
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
    return updateAfterAttempt(wordId, language, quality);
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
    // Ease factor is intentionally NOT reset
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
 */
export async function initializeSR(
  wordId: string,
  language: Language
): Promise<void> {
  // Check for existing entry
  const existing = await db.spacedRepetition
    .where('language')
    .equals(language)
    .filter(e => e.word_id === wordId)
    .first();

  if (existing) return; // already initialised

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + INITIAL_INTERVAL);

  const entry: Omit<SpacedRepetitionEntry, 'id'> = {
    word_id: wordId,
    next_review: nextReview,
    interval: INITIAL_INTERVAL,
    ease_factor: DEFAULT_EASE,
    repetitions: 0,
    language
  };

  await db.spacedRepetition.add(entry as SpacedRepetitionEntry);
}

/**
 * Get aggregate stats about spaced repetition progress for a language.
 */
export async function getSRStats(language: Language): Promise<{
  due: number;
  learning: number;
  mastered: number;
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

  return { due, learning, mastered };
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
