/**
 * Combined feedback helpers — sound + haptic in one call.
 *
 * Exercises call these instead of importing from both sounds.ts and haptics.ts,
 * so adding a future feedback channel (e.g. visual flash) only needs one edit here.
 */

import { playCorrectSound, playIncorrectSound, playCompleteSound } from './sounds';
import { vibrateSuccess, vibrateError, refreshHapticSetting } from './haptics';
import { refreshSoundSetting } from './sounds';

/**
 * Refresh both sound and haptic cached settings. Call once on exercise mount.
 */
export async function refreshFeedbackSettings(): Promise<void> {
  await Promise.all([refreshSoundSetting(), refreshHapticSetting()]);
}

/**
 * Play sound + vibration for a correct or incorrect answer.
 */
export function playFeedback(correct: boolean): void {
  if (correct) {
    playCorrectSound();
    vibrateSuccess();
  } else {
    playIncorrectSound();
    vibrateError();
  }
}

/**
 * Play sound + gentle vibration for exercise completion.
 */
export function playCompleteFeedback(): void {
  playCompleteSound();
  vibrateSuccess();
}
