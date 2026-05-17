import { getSetting, setSetting } from './settings';

const KEY_LAST_ACTIVE = 'lastActiveDate';
const KEY_CURRENT_STREAK = 'currentStreak';
const KEY_LONGEST_STREAK = 'longestStreak';

export interface StreakInfo {
  current: number;
  longest: number;
  lastActive: string | null;
}

/**
 * Get today's date as YYYY-MM-DD in local time.
 */
function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date as YYYY-MM-DD in local time.
 */
function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Update the streak after a session is completed.
 *
 * - If lastActiveDate is today → do nothing (already counted)
 * - If lastActiveDate is yesterday → increment currentStreak
 * - If lastActiveDate is older → reset to 1
 * - If no lastActiveDate → set to 1 (first ever)
 * Always update longestStreak if currentStreak beats it.
 */
export async function updateStreak(): Promise<void> {
  const today = todayISO();
  const yesterday = yesterdayISO();

  const lastActive: string | null = await getSetting<string>(KEY_LAST_ACTIVE);
  let currentStreak: number = (await getSetting<number>(KEY_CURRENT_STREAK)) ?? 0;
  let longestStreak: number = (await getSetting<number>(KEY_LONGEST_STREAK)) ?? 0;

  if (lastActive === today) {
    // Already active today, nothing to do
    return;
  }

  if (lastActive === yesterday) {
    // Consecutive day
    currentStreak++;
  } else {
    // Streak broken or first session ever
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await setSetting(KEY_LAST_ACTIVE, today);
  await setSetting(KEY_CURRENT_STREAK, currentStreak);
  await setSetting(KEY_LONGEST_STREAK, longestStreak);
}

/**
 * Get current streak info.
 */
export async function getStreakInfo(): Promise<StreakInfo> {
  const current: number = (await getSetting<number>(KEY_CURRENT_STREAK)) ?? 0;
  const longest: number = (await getSetting<number>(KEY_LONGEST_STREAK)) ?? 0;
  const lastActive: string | null = await getSetting<string>(KEY_LAST_ACTIVE);

  return { current, longest, lastActive };
}
