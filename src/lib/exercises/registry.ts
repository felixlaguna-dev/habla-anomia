import type { ExerciseType } from '$lib/types';

/**
 * Metadata for a single exercise type — the single source of truth for
 * exercise identity (icon, color, i18n key, image dependency).
 *
 * - `icon` is SVG path data for a 24×24 viewBox, stroke style
 *   (stroke-width 2, round caps/joins) matching the icons in BottomNav.
 * - `color` is a CSS variable reference (`var(--exercise-<type>)`) backed by
 *   tokens defined in `src/lib/styles/theme.css`.
 */
export interface ExerciseMeta {
  type: ExerciseType;
  /** i18n key under `exercises.*` (e.g. `picture_naming` → `exercises.picture_naming.name`). */
  i18nKey: string;
  /** SVG path data (24×24 viewBox, stroke style). */
  icon: string;
  /** CSS variable reference for the exercise accent color. */
  color: string;
  /** Whether the exercise requires words with images. */
  imageDependent: boolean;
}

/**
 * All exercise types in canonical display order.
 * Add new exercises here — this drives home, about, the runner, and the
 * image-dependency flag everywhere.
 */
export const EXERCISE_REGISTRY: ExerciseMeta[] = [
  {
    type: 'picture-naming',
    i18nKey: 'picture_naming',
    icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M7.5 8.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0z M4.5 17l4-4 3 3 4-4 4 4',
    color: 'var(--exercise-picture-naming)',
    imageDependent: true
  },
  {
    type: 'semantic-features',
    i18nKey: 'semantic_features',
    icon: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 M17.599 6.5a3 3 0 0 0 .399-1.375 M6.003 5.125A3 3 0 0 0 6.401 6.5',
    color: 'var(--exercise-semantic-features)',
    imageDependent: true
  },
  {
    type: 'phonological-cueing',
    i18nKey: 'phonological_cueing',
    icon: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z M16 9a5 5 0 0 1 0 6 M19.364 18.364a9 9 0 0 0 0-12.728',
    color: 'var(--exercise-phonological-cueing)',
    imageDependent: true
  },
  {
    type: 'category-sorting',
    i18nKey: 'category_sorting',
    icon: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    color: 'var(--exercise-category-sorting)',
    imageDependent: true
  },
  {
    type: 'generative-naming',
    i18nKey: 'generative_naming',
    icon: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4',
    color: 'var(--exercise-generative-naming)',
    imageDependent: false
  },
  {
    type: 'word-matching',
    i18nKey: 'word_matching',
    icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    color: 'var(--exercise-word-matching)',
    imageDependent: false
  },
  {
    type: 'sentence-completion',
    i18nKey: 'sentence_completion',
    icon: 'M12 20h9 M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z M15 5l3 3',
    color: 'var(--exercise-sentence-completion)',
    imageDependent: false
  },
  {
    type: 'opposites-synonyms',
    i18nKey: 'opposites_synonyms',
    icon: 'M8 3 4 7l4 4 M4 7h16 M16 21l4-4-4-4 M20 17H4',
    color: 'var(--exercise-opposites-synonyms)',
    imageDependent: false
  }
];

const REGISTRY_BY_TYPE = new Map<ExerciseType, ExerciseMeta>(
  EXERCISE_REGISTRY.map((meta) => [meta.type, meta])
);

/** Look up metadata for an exercise type. Returns undefined for unknown types. */
export function getExerciseMeta(type: ExerciseType): ExerciseMeta | undefined {
  return REGISTRY_BY_TYPE.get(type);
}

/** Exercises that require words with images — derived from the registry so it cannot drift. */
export const IMAGE_DEPENDENT_EXERCISES: ExerciseType[] = EXERCISE_REGISTRY.filter(
  (meta) => meta.imageDependent
).map((meta) => meta.type);
