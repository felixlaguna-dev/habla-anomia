import { writable, derived } from 'svelte/store';
import es from './es.json';
import ca from './ca.json';
import eu from './eu.json';
import en from './en.json';
import type { Language } from '$lib/types';

const translations: Record<Language, typeof es> = { es, ca, eu, en };

// Store for current locale
export const locale = writable<Language>('es');

// Derived translation helper
export const t = derived(locale, ($locale) => {
  const messages = translations[$locale] || translations.es;
  return (key: string, params?: Record<string, string>): string => {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], messages);
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v),
      value
    );
  };
});
