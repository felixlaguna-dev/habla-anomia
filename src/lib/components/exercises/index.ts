import type { ExerciseType } from '$lib/types';

import PictureNamingExercise from './PictureNamingExercise.svelte';
import SemanticFeaturesExercise from './SemanticFeaturesExercise.svelte';
import PhonologicalCueingExercise from './PhonologicalCueingExercise.svelte';
import CategorySortingExercise from './CategorySortingExercise.svelte';
import GenerativeNamingExercise from './GenerativeNamingExercise.svelte';
import WordMatchingExercise from './WordMatchingExercise.svelte';
import SentenceCompletionExercise from './SentenceCompletionExercise.svelte';
import OppositesSynonymsExercise from './OppositesSynonymsExercise.svelte';
import OddOneOutExercise from './OddOneOutExercise.svelte';

export {
  PictureNamingExercise,
  SemanticFeaturesExercise,
  PhonologicalCueingExercise,
  CategorySortingExercise,
  GenerativeNamingExercise,
  WordMatchingExercise,
  SentenceCompletionExercise,
  OppositesSynonymsExercise,
  OddOneOutExercise
};

/**
 * Maps exercise types to their Svelte components — single source of truth so
 * both the exercise runner and the review-failures page stay in sync when
 * exercises are added.
 */
export const EXERCISE_COMPONENTS: Record<ExerciseType, any> = {
  'picture-naming': PictureNamingExercise,
  'semantic-features': SemanticFeaturesExercise,
  'phonological-cueing': PhonologicalCueingExercise,
  'category-sorting': CategorySortingExercise,
  'generative-naming': GenerativeNamingExercise,
  'word-matching': WordMatchingExercise,
  'sentence-completion': SentenceCompletionExercise,
  'opposites-synonyms': OppositesSynonymsExercise,
  'odd-one-out': OddOneOutExercise
};
