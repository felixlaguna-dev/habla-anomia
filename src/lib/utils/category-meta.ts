import type { Category } from '$lib/types';
import { CATEGORIES } from '$lib/types';

/**
 * Stable accent color per category, used by the "Practicar una categoría" tiles
 * and headers. A small curated palette cycled by the category's canonical index
 * in {@link CATEGORIES}. These are decorative accent colors (white glyph on a
 * solid fill), not theme tokens, so they stay constant across light/dark themes.
 */
const PALETTE: readonly string[] = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6'  // teal
];

/** Deterministic accent color for a category. */
export function categoryColor(category: Category): string {
  return PALETTE[CATEGORIES.indexOf(category) % PALETTE.length];
}
