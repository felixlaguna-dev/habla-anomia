import type { ExerciseType } from '$lib/types';

/**
 * Display metadata (emoji icon, accent color, i18n key suffix) for each
 * exercise type. Single source of truth so the icon/color for a given exercise
 * can't drift between the dashboard, the about page, and the category-practice
 * chooser.
 *
 * These are decorative accent colors (white glyph on a soft tinted background),
 * not theme tokens, so they stay constant across light/dark themes — the same
 * convention the dashboard has always used for its exercise chips.
 */
export interface ExerciseMeta {
  type: ExerciseType;
  /** i18n key suffix, e.g. `picture_naming` → `exercises.picture_naming.name`. */
  key: string;
  icon: string;
  color: string;
}

/** All exercise metadata in canonical display order. */
export const EXERCISES: ExerciseMeta[] = [
  { type: 'picture-naming', key: 'picture_naming', icon: '🖼️', color: '#3b82f6' },
  { type: 'semantic-features', key: 'semantic_features', icon: '🧠', color: '#8b5cf6' },
  { type: 'phonological-cueing', key: 'phonological_cueing', icon: '🔤', color: '#06b6d4' },
  { type: 'category-sorting', key: 'category_sorting', icon: '📂', color: '#f59e0b' },
  { type: 'generative-naming', key: 'generative_naming', icon: '💡', color: '#10b981' },
  { type: 'word-matching', key: 'word_matching', icon: '🔗', color: '#ef4444' },
  { type: 'sentence-completion', key: 'sentence_completion', icon: '📝', color: '#6366f1' },
  { type: 'opposites-synonyms', key: 'opposites_synonyms', icon: '🔄', color: '#ec4899' }
];

const BY_TYPE = new Map<ExerciseType, ExerciseMeta>(EXERCISES.map((e) => [e.type, e]));

/** Look up the metadata for a single exercise type. */
export function exerciseMeta(type: ExerciseType): ExerciseMeta {
  const meta = BY_TYPE.get(type);
  if (!meta) throw new Error(`No exercise metadata for ${type}`);
  return meta;
}
