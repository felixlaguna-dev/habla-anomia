/**
 * Sound effects using the Web Audio API.
 * Generates tones programmatically — no audio files needed.
 */

import { getAllSettings } from '$lib/db';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

async function isSoundEnabled(): Promise<boolean> {
  try {
    const settings = await getAllSettings();
    return settings?.sound_enabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Play a single tone.
 */
function playTone(frequency: number, durationMs: number, type: OscillatorType, startDelayMs: number = 0): void {
  const ctx = getContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelayMs / 1000);

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startDelayMs / 1000);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (startDelayMs + durationMs) / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const startTime = ctx.currentTime + startDelayMs / 1000;
  oscillator.start(startTime);
  oscillator.stop(startTime + durationMs / 1000);
}

// Musical note frequencies
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A3 = 220.00;

/**
 * Play a pleasant ascending chime for correct answers (C5 → E5, sine wave).
 */
export async function playCorrectSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  playTone(C5, 200, 'sine', 0);
  playTone(E5, 200, 'sine', 200);
}

/**
 * Play a gentle low buzz for incorrect answers (A3, triangle wave).
 */
export async function playIncorrectSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  playTone(A3, 300, 'triangle', 0);
}

/**
 * Play a celebratory 3-note ascending chime for exercise completion (C5 → E5 → G5).
 */
export async function playCompleteSound(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  playTone(C5, 200, 'sine', 0);
  playTone(E5, 200, 'sine', 250);
  playTone(G5, 400, 'sine', 500);
}
