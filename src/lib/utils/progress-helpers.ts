/**
 * Shared helpers for progress-related pages (progress + report).
 *
 * These functions are used by both the interactive progress page and the
 * printable therapist report, so changes to accuracy thresholds, weekday
 * formatting, or date formatting propagate to both automatically.
 */

import type { Language } from '$lib/types';

export const TREND_ARROWS: Record<'improving' | 'stable' | 'declining', string> = {
  improving: '↗',
  stable: '→',
  declining: '↘'
};

/** Format an accuracy fraction (0-100) as "NN%". */
export function formatAccuracy(acc: number): string {
  return `${Math.round(acc)}%`;
}

/** Accuracy → CSS colour token (≥80 success, ≥50 warning, else error). */
export function accuracyColor(acc: number): string {
  if (acc >= 80) return 'var(--success)';
  if (acc >= 50) return 'var(--warning)';
  return 'var(--error)';
}

/** Build the exercises.<type>.name i18n key from an exercise type slug. */
export function getExerciseName(type: string): string {
  return `exercises.${type.replace(/-/g, '_')}.name`;
}

// One narrow-weekday formatter per locale (construction is costlier than format)
const weekdayFmt = new Map<Language, Intl.DateTimeFormat>();

/** Single-letter weekday initial, locale-aware. dateStr is YYYY-MM-DD. */
export function weekdayInitial(dateStr: string, lang: Language): string {
  let fmt = weekdayFmt.get(lang);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(lang, { weekday: 'narrow' });
    weekdayFmt.set(lang, fmt);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return fmt.format(new Date(y, m - 1, d));
}

/** Locale-aware date formatting with optional year. */
export function formatDate(date: Date, lang: Language, withYear = false): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(lang, {
    day: 'numeric',
    month: 'short',
    ...(withYear && { year: 'numeric' })
  });
}
