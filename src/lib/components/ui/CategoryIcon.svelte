<script lang="ts" module>
  export type CategoryIconSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Category } from '$lib/types';
  import { categoryColor } from '$lib/utils/category-meta';
  import { t } from '$lib/i18n';

  type Props = {
    category: Category;
    size?: CategoryIconSize;
  };

  let { category, size = 'md' }: Props = $props();

  // Use the translated label's first letter so the initial matches the user's
  // locale (e.g. "A" for Animales / Animals / Animaliak).
  let label = $derived($t(`categories.${category}`));
  let initial = $derived((label?.[0] ?? '?').toUpperCase());
  let color = $derived(categoryColor(category));
</script>

<span class="cat-icon cat-{size}" style="--cat-color: {color}" aria-hidden="true">
  {initial}
</span>

<style>
  .cat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: var(--cat-color);
    color: #fff;
    font-weight: 800;
    line-height: 1;
    flex-shrink: 0;
    font-family: var(--font-family);
    /* Subtle depth so the tile reads as a tappable element, not flat text. */
    box-shadow: var(--shadow-sm);
  }

  .cat-sm {
    width: 2rem;
    height: 2rem;
    font-size: 0.9rem;
    border-radius: var(--radius-sm);
  }

  .cat-md {
    width: 2.75rem;
    height: 2.75rem;
    font-size: 1.25rem;
  }

  .cat-lg {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.75rem;
  }
</style>
