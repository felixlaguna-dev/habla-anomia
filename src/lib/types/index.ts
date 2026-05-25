// Core types for Habla Anomia

export type Language = 'es' | 'ca' | 'eu' | 'en';

export type ExerciseType =
  | 'picture-naming'
  | 'semantic-features'
  | 'phonological-cueing'
  | 'category-sorting'
  | 'generative-naming'
  | 'word-matching'
  | 'sentence-completion'
  | 'opposites-synonyms';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type Category =
  | 'animals'
  | 'food'
  | 'household'
  | 'body-parts'
  | 'clothing'
  | 'vehicles'
  | 'tools'
  | 'professions'
  | 'colors'
  | 'actions'
  | 'places'
  | 'emotions'
  | 'nature'
  | 'family'
  | 'weather'
  | 'school'
  | 'technology'
  | 'sports'
  | 'music'
  | 'toys';

/**
 * Safely get a word's categories array.
 * Handles legacy words that still have `category` (string) instead of `categories` (array).
 */
export function getWordCategories(word: { categories?: Category[]; category?: Category }): Category[] {
  if (word.categories && Array.isArray(word.categories)) return word.categories;
  if (word.category) return [word.category];
  return [];
}

export interface SemanticFeatures {
  category: string;
  function: string;
  location: string;
  properties: string;
  associations: string;
}

export interface PhoneticCues {
  first_sound: string;
  syllables: number;
  rhyming_word: string;
  first_phonemes: string;
}

export interface Word {
  id: string;
  word: string;
  categories: Category[];
  /** @deprecated Legacy field from v1-v2. Use getCategories() instead. */
  category?: Category;
  language: Language;
  image_url: string;
  /** Whether a real image file exists. Defaults to true. Words without images are excluded from image-dependent exercises (PictureNaming, SemanticFeatures, PhonologicalCueing, CategorySorting). */
  has_image?: boolean;
  definition: string;
  features: SemanticFeatures;
  phonetic: PhoneticCues;
  difficulty: DifficultyLevel;
  tags: string[];
  sentence?: string;
  opposite?: string;
  synonyms?: string[];
}

/** Exercises that require an image (words without images are excluded). */
export const IMAGE_DEPENDENT_EXERCISES: ExerciseType[] = [
  'picture-naming',
  'semantic-features',
  'phonological-cueing',
  'category-sorting',
];

/** Check if a word has a usable image. */
export function wordHasImage(word: Word): boolean {
  return word.has_image !== false;
}

export interface Attempt {
  id?: number;
  word_id: string;
  exercise_type: ExerciseType;
  correct: boolean;
  response: string;
  cue_level_used?: number;
  response_time_ms?: number;
  timestamp: Date;
  language: Language;
}

export interface Session {
  id?: number;
  started_at: Date;
  ended_at?: Date;
  exercises_completed: number;
  accuracy: number;
  language: Language;
  exercise_types: ExerciseType[];
}

export interface SpacedRepetitionEntry {
  id?: number;
  word_id: string;
  next_review: Date;
  interval: number;
  ease_factor: number;
  repetitions: number;
  language: Language;
}

export interface AppSettings {
  language: Language;
  text_size: 'small' | 'normal' | 'large' | 'xlarge';
  theme: 'dark' | 'light';
  high_contrast: boolean;
  speech_rate: number;
  sound_enabled: boolean;
  haptic_enabled: boolean;
  speak_buttons_enabled: boolean;
  timer_enabled: boolean;
  onboarding_complete: boolean;
}

export interface ExerciseConfig {
  type: ExerciseType;
  title_key: string;
  description_key: string;
  icon: string;
  estimated_minutes: number;
}

export interface DailyStats {
  date: string;
  sessions: number;
  exercises: number;
  accuracy: number;
  words_practiced: number;
  streak: number;
}
