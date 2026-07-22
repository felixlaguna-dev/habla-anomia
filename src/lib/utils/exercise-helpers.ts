// URL helpers have moved to paths.ts — re-export for backwards compat
export { resolveImageUrl, resolveUrl } from './paths';

import { getWordCategories, type Word } from '$lib/types';

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

/** What a multiple-choice option displays for a given word. */
export type DistractorKind = 'word' | 'definition' | 'category';

/**
 * The display text for an option of the given kind. Centralised so option
 * building and rendering never disagree about what a card shows.
 */
export function optionTextFor(word: Word, kind: DistractorKind): string {
  if (kind === 'definition') return (word.definition ?? '').trim();
  if (kind === 'category') return (word.features?.category ?? '').trim();
  return (word.word ?? '').trim();
}

/**
 * Build multiple-choice options (including the correct word) for an item.
 *
 * Distractors are drawn first from `sessionWords`, padded from `allWords` when
 * the session cannot supply enough. Same-category words are preferred for closer
 * difficulty; the full pool is used as a fallback. Options are de-duplicated by
 * their displayed text and NEVER include placeholder ("---") entries — if the
 * word bank is too small, fewer than `count + 1` options are returned.
 */
export function buildDistractors(
  correct: Word,
  sessionWords: Word[],
  allWords: Word[],
  kind: DistractorKind = 'word',
  count = 3,
): Word[] {
  const correctText = optionTextFor(correct, kind).toLowerCase();
  const correctCats = new Set(getWordCategories(correct));

  // Merge session + all words once, precomputing each entry's display text and
  // categories so later filtering / picking never recomputes them.
  const pool = [...new Map([...sessionWords, ...allWords].map((w) => [w.id, w])).values()]
    .map((w) => ({ word: w, text: optionTextFor(w, kind).toLowerCase(), cats: getWordCategories(w) }))
    .filter((e) => e.word.id !== correct.id && e.text !== '' && e.text !== correctText);

  // Prefer same-category distractors for closer difficulty; fall back to any.
  const sameCategory = pool.filter((e) => e.cats.some((c) => correctCats.has(c)));
  const source = sameCategory.length >= count ? sameCategory : pool;

  const picked: Word[] = [];
  const seen = new Set<string>();
  for (const entry of shuffleArray(source)) {
    if (picked.length >= count) break;
    if (!seen.has(entry.text)) {
      seen.add(entry.text);
      picked.push(entry.word);
    }
  }

  return shuffleArray([correct, ...picked]);
}
