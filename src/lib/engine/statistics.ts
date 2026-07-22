import type { Language, ExerciseType, DailyStats } from '$lib/types';
import { getAccuracyOverTime, getAccuracyByCategory, getAccuracyByExercise } from '$lib/db/attempts';
import { getDailyStats as getDBDailyStats } from '$lib/db/sessions';
import { getStreakInfo } from '$lib/db/streaks';

/**
 * Produce a weekly summary covering the last 7 days.
 */
export async function getWeeklySummary(language: Language): Promise<{
  totalSessions: number;
  totalExercises: number;
  overallAccuracy: number;
  wordsPracticed: number;
  dailyBreakdown: DailyStats[];
}> {
  const DAYS = 7;
  const rawStats = await getDBDailyStats(DAYS, language);
  const streakInfo = await getStreakInfo();

  // Transform raw DB rows into DailyStats objects
  const dailyBreakdown: DailyStats[] = rawStats.map(row => ({
    date: row.date,
    sessions: row.sessions,
    exercises: row.exercises,
    accuracy: Math.round(row.accuracy * 100) / 100,
    words_practiced: row.words_practiced,
    streak: 0 // filled below
  }));

  // Attach the current streak (from the settings store) to each day.
  // Per-day streak history isn't tracked; the same live value is used for all.
  for (const day of dailyBreakdown) {
    day.streak = streakInfo.current;
  }

  // Aggregate totals
  let totalSessions = 0;
  let totalExercises = 0;
  let totalAccuracyWeight = 0;
  let accuracyDays = 0;
  let wordsPracticed = 0;

  // Track unique words across all days
  const allWordIds = new Set<string>();

  for (const day of dailyBreakdown) {
    totalSessions += day.sessions;
    totalExercises += day.exercises;
    wordsPracticed += day.words_practiced;
    if (day.sessions > 0) {
      totalAccuracyWeight += day.accuracy;
      accuracyDays++;
    }
  }

  const overallAccuracy =
    accuracyDays > 0
      ? Math.round((totalAccuracyWeight / accuracyDays) * 100) / 100
      : 0;

  return {
    totalSessions,
    totalExercises,
    overallAccuracy,
    wordsPracticed,
    dailyBreakdown
  };
}

/**
 * Accuracy per category with attempt counts.
 */
export async function getCategoryBreakdown(language: Language): Promise<
  {
    category: string;
    accuracy: number;
    attempts: number;
  }[]
> {
  const data = await getAccuracyByCategory(language);

  return data.map(d => ({
    category: d.category,
    accuracy: Math.round(d.accuracy * 100) / 100,
    attempts: d.total
  }));
}

/**
 * Accuracy per exercise type with attempt counts.
 */
export async function getExerciseBreakdown(language: Language): Promise<
  {
    exercise: string;
    accuracy: number;
    attempts: number;
  }[]
> {
  const data = await getAccuracyByExercise(language);

  return data.map(d => ({
    exercise: d.exercise_type,
    accuracy: Math.round(d.accuracy * 100) / 100,
    attempts: d.total
  }));
}

/**
 * Determine whether performance is improving, stable, or declining by
 * comparing the average accuracy of the first half of the given daily
 * accuracy points to the second half. Days with no attempts (`total === 0`)
 * are ignored, and fewer than two active days reads as "stable".
 */
export function calculateImprovementTrend(
  dailyAccuracy: ReadonlyArray<{ accuracy: number; total: number }>
): 'improving' | 'stable' | 'declining' {
  // Filter out days with no attempts
  const active = dailyAccuracy.filter(d => d.total > 0);

  if (active.length < 2) return 'stable';

  const mid = Math.floor(active.length / 2);
  const firstHalf = active.slice(0, mid);
  const secondHalf = active.slice(mid);

  const avgFirst = average(firstHalf.map(d => d.accuracy));
  const avgSecond = average(secondHalf.map(d => d.accuracy));

  const THRESHOLD = 5; // percentage-point threshold for "stable"

  if (avgSecond - avgFirst > THRESHOLD) return 'improving';
  if (avgFirst - avgSecond > THRESHOLD) return 'declining';
  return 'stable';
}

// ─── Helpers ────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
