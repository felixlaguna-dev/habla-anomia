/**
 * Haptic feedback (vibration) using the Vibration API.
 * Mirrors the sounds.ts caching pattern: read the setting once at exercise
 * start, then check the cache on every tap without hitting IndexedDB.
 */

import { getAllSettings } from '$lib/db';

// Cached so we don't hit IndexedDB on every answer tap. Refreshed at exercise
// start (see refreshHapticSetting) — null means "not loaded yet".
let cachedHapticEnabled: boolean | null = null;

/**
 * Re-read `haptic_enabled` from the DB and cache it. Call once when an exercise
 * mounts so the setting is current for the whole session without per-tap reads.
 */
export async function refreshHapticSetting(): Promise<void> {
  try {
    const settings = await getAllSettings();
    cachedHapticEnabled = settings?.haptic_enabled ?? false;
  } catch {
    cachedHapticEnabled = false;
  }
}

async function isHapticEnabled(): Promise<boolean> {
  if (cachedHapticEnabled === null) {
    await refreshHapticSetting();
  }
  return cachedHapticEnabled ?? false;
}

function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Gentle vibration for correct answers and completions.
 * Single short pulse — barely noticeable but confirms the tap registered.
 */
export async function vibrateSuccess(): Promise<void> {
  if (!(await isHapticEnabled()) || !isVibrationSupported()) return;
  navigator.vibrate(30);
}

/**
 * Stronger double-pulse vibration for incorrect answers.
 * Pattern: vibrate 80ms, pause 40ms, vibrate 80ms.
 */
export async function vibrateError(): Promise<void> {
  if (!(await isHapticEnabled()) || !isVibrationSupported()) return;
  navigator.vibrate([80, 40, 80]);
}
