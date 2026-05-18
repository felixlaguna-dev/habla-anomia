import { base } from '$app/paths';

/**
 * Resolve an image URL by prepending the SvelteKit base path.
 * Needed for GitHub Pages or other deployments where the app lives under a subdirectory.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (base && url.startsWith('/')) return base + url;
  return url;
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array without mutating the input.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate multiple-choice options for a correct word.
 * Shuffles and picks `count` distractors from `allWords`, then shuffles everything together.
 */
export function generateOptions(
  correctWord: string,
  allWords: string[],
  count: number = 3,
): string[] {
  const correct = correctWord.trim().toLowerCase();
  const others = allWords
    .filter((w) => w.trim().toLowerCase() !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  return shuffleArray([correctWord, ...others]);
}

/** Feedback states used across exercises. */
export type FeedbackState = 'none' | 'correct' | 'incorrect';

/** Visual state of a choice card. */
export type CardState = 'default' | 'selected' | 'correct' | 'incorrect';

/**
 * Determine the visual state of a multiple-choice card.
 * Shared logic used by most exercise components.
 */
export function getCardState(
  index: number,
  feedbackState: FeedbackState,
  selectedIndex: number | null,
  correctIndex: number,
): CardState {
  if (feedbackState === 'none') {
    return selectedIndex === index ? 'selected' : 'default';
  }
  if (index === correctIndex) return 'correct';
  if (index === selectedIndex && feedbackState === 'incorrect') return 'incorrect';
  return 'default';
}
