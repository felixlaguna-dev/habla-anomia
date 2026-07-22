import { db } from './database';
import type { Session, Language } from '$lib/types';

/**
 * Create a new session and return its auto-generated id.
 */
export async function startSession(language: Language): Promise<number> {
  return db.sessions.add({
    started_at: new Date(),
    exercises_completed: 0,
    accuracy: 0,
    language,
    exercise_types: []
  });
}

/**
 * Finalize a session with final accuracy and exercise count.
 */
export async function endSession(
  id: number,
  accuracy: number,
  exercisesCompleted: number
): Promise<void> {
  await db.sessions.update(id, {
    ended_at: new Date(),
    accuracy,
    exercises_completed: exercisesCompleted
  });
}

/**
 * Get recent sessions for a language, most recent first.
 */
export async function getSessions(
  language: Language,
  limit: number = 20
): Promise<Session[]> {
  return db.sessions
    .where('language')
    .equals(language)
    .reverse()
    .sortBy('started_at')
    .then(arr => arr.slice(0, limit));
}

/**
 * Get a single session by id.
 */
export async function getSessionById(id: number): Promise<Session | undefined> {
  return db.sessions.get(id);
}

/**
 * Get daily stats for the last N days for charts.
 * Returns an array of { date, sessions, exercises, accuracy, words_practiced }.
 */
export async function getDailyStats(
  days: number,
  language: Language
): Promise<Array<{
  date: string;
  sessions: number;
  exercises: number;
  accuracy: number;
  words_practiced: number;
}>> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await db.sessions
    .where('language')
    .equals(language)
    .filter(s => {
      const ts = s.started_at instanceof Date ? s.started_at : new Date(s.started_at);
      return ts >= startDate;
    })
    .toArray();

  // Also get attempts for unique words count per day
  const attempts = await db.attempts
    .where('language')
    .equals(language)
    .filter(a => {
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return ts >= startDate;
    })
    .toArray();

  // Initialize all days in range
  const grouped = new Map<string, {
    sessions: number;
    totalExercises: number;
    totalAccuracy: number;
    accuracyCount: number;
    wordIds: Set<string>;
  }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    grouped.set(formatDate(d), {
      sessions: 0,
      totalExercises: 0,
      totalAccuracy: 0,
      accuracyCount: 0,
      wordIds: new Set()
    });
  }

  for (const session of sessions) {
    const ts = session.started_at instanceof Date ? session.started_at : new Date(session.started_at);
    const key = formatDate(ts);
    const entry = grouped.get(key);
    if (entry) {
      entry.sessions++;
      entry.totalExercises += session.exercises_completed;
      if (session.ended_at) {
        entry.totalAccuracy += session.accuracy;
        entry.accuracyCount++;
      }
    }
  }

  for (const attempt of attempts) {
    const ts = attempt.timestamp instanceof Date ? attempt.timestamp : new Date(attempt.timestamp);
    const key = formatDate(ts);
    const entry = grouped.get(key);
    if (entry) {
      entry.wordIds.add(attempt.word_id);
    }
  }

  const results: Array<{
    date: string;
    sessions: number;
    exercises: number;
    accuracy: number;
    words_practiced: number;
  }> = [];

  for (const [date, data] of grouped) {
    results.push({
      date,
      sessions: data.sessions,
      exercises: data.totalExercises,
      accuracy: data.accuracyCount > 0 ? data.totalAccuracy / data.accuracyCount : 0,
      words_practiced: data.wordIds.size
    });
  }

  return results;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
