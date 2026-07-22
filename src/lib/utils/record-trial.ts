// Single source of truth for persisting an exercise trial.
//
// Every exercise trial resolves to exactly one call here — no component should
// call recordAttempt / updateAfterAttempt directly. This keeps the analytics +
// SM-2 scheduling contract identical across all 8 exercise types.

import { recordAttempt } from '$lib/db/attempts';
import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
import type { ExerciseType, Language } from '$lib/types';

export interface TrialInput {
  wordId: string;
  exerciseType: ExerciseType;
  language: Language;
  /** Whether the user's FIRST tap was correct. Retries never change this. */
  correct: boolean;
  /** What the user selected / the correct word (empty string on skip). */
  response: string;
  /** Hint or cue levels consumed before the first tap. */
  hintsUsed?: number;
  responseTimeMs: number;
  /**
   * Explicit SM-2 quality (0-5). Omit to use the standard policy below.
   * Pass an explicit value only for exercises whose quality model is richer
   * than "correct minus hints" (e.g. partial credit on multi-feature trials).
   */
  quality?: number;
}

/**
 * Standard SM-2 quality for a trial: full 5 with no hints, reduced by one per
 * hint/cue used, floored at 1 when the first tap is correct; 0 on any incorrect
 * outcome (wrong first tap, skip, or timeout) so the card is rescheduled as a
 * missed recall.
 */
export function qualityForTrial(correct: boolean, hintsUsed = 0): number {
  return correct ? Math.max(1, 5 - hintsUsed) : 0;
}

/**
 * Record a single trial: one attempt row + one SM-2 update, run in parallel
 * (they write to independent tables and share no data).
 *
 * POLICY — every trial records exactly one attempt:
 *  - Correctness is decided by the FIRST tap. A wrong first tap records
 *    `correct: false`; retrying afterwards is practice only and creates no
 *    further attempts and does not revise the recorded result.
 *  - Quality defaults to `qualityForTrial`; pass `quality` to override.
 */
export async function recordTrial(input: TrialInput): Promise<void> {
  const {
    wordId,
    exerciseType,
    language,
    correct,
    response,
    hintsUsed = 0,
    responseTimeMs,
    quality,
  } = input;

  const resolvedQuality = quality ?? qualityForTrial(correct, hintsUsed);

  await Promise.all([
    recordAttempt({
      word_id: wordId,
      exercise_type: exerciseType,
      correct,
      response,
      cue_level_used: hintsUsed > 0 ? hintsUsed : undefined,
      response_time_ms: responseTimeMs,
      timestamp: new Date(),
      language,
    }),
    updateAfterAttempt(wordId, language, resolvedQuality),
  ]);
}
