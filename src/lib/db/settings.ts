import { db } from './database';
import type { AppSettings, Language } from '$lib/types';

const DEFAULTS: AppSettings = {
  language: 'es' as Language,
  text_size: 'normal',
  theme: 'dark',
  high_contrast: false,
  speech_enabled: true,
  speech_rate: 0.8,
  sound_enabled: true,
  haptic_enabled: true,
  speak_buttons_enabled: true,
  timer_enabled: true,
  onboarding_complete: false
};

/**
 * Get a single setting value by key. Returns null if not found.
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : null;
}

/**
 * Save a setting value by key.
 */
export async function setSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value });
}

/**
 * Get all settings as an AppSettings object, filling in defaults for missing keys.
 */
export async function getAllSettings(): Promise<AppSettings> {
  const allRows = await db.settings.toArray();
  const settingsMap = new Map(allRows.map(r => [r.key, r.value]));

  return {
    language: settingsMap.get('language') ?? DEFAULTS.language,
    text_size: settingsMap.get('text_size') ?? DEFAULTS.text_size,
    theme: settingsMap.get('theme') ?? DEFAULTS.theme,
    high_contrast: settingsMap.get('high_contrast') ?? DEFAULTS.high_contrast,
    speech_enabled: settingsMap.get('speech_enabled') ?? DEFAULTS.speech_enabled,
    speech_rate: settingsMap.get('speech_rate') ?? DEFAULTS.speech_rate,
    sound_enabled: settingsMap.get('sound_enabled') ?? DEFAULTS.sound_enabled,
    haptic_enabled: settingsMap.get('haptic_enabled') ?? DEFAULTS.haptic_enabled,
    speak_buttons_enabled: settingsMap.get('speak_buttons_enabled') ?? DEFAULTS.speak_buttons_enabled,
    timer_enabled: settingsMap.get('timer_enabled') ?? DEFAULTS.timer_enabled,
    onboarding_complete: settingsMap.get('onboarding_complete') ?? DEFAULTS.onboarding_complete
  };
}

/**
 * Initialize default settings if they don't already exist.
 * Only writes keys that are not already present in the database.
 */
export async function initDefaults(): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const existing = await db.settings.get(key);
      if (!existing) {
        await db.settings.put({ key, value });
      }
    }
  });
}
