<script lang="ts">
  // Common wrapper for an active exercise: renders the progress header
  // ("N de M" + ProgressBar), hosts the keyboardNav region, focuses it on mount
  // for Tab reachability / AT focus, and refreshes the cached sound setting for
  // the session. (Keyboard shortcuts are captured at the document level by the
  // keyboardNav action, so they work regardless of focus.)
  //
  // On tablet (>=768px), passing `tabletColumns` turns the body into a CSS grid
  // with those columns, so each exercise can place its own elements into a
  // side-by-side layout without restyling this component.
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import { refreshSoundSetting } from '$lib/utils/sounds';

  type Props = {
    current: number;
    total: number;
    ariaLabel: string;
    keyboardNavParams: KeyboardNavParams;
    /** grid-template-columns applied to the body at >=768px (e.g. "280px 1fr"). */
    tabletColumns?: string;
    active?: boolean;
    children: Snippet;
  };

  let {
    current,
    total,
    ariaLabel,
    keyboardNavParams,
    tabletColumns,
    active = true,
    children,
  }: Props = $props();

  let el = $state<HTMLElement>();
  let progress = $derived(total > 0 ? Math.round(((current + 1) / total) * 100) : 0);
  let label = $derived(`${current + 1} ${$t('common.of')} ${total}`);

  onMount(() => {
    refreshSoundSetting();
    // Focus the region so keyboard shortcuts work immediately. preventScroll
    // avoids the page jumping past the exercise header on mount.
    el?.focus({ preventScroll: true });
  });
</script>

<div
  class="exercise-shell"
  bind:this={el}
  role="region"
  aria-label={ariaLabel}
  use:keyboardNav={keyboardNavParams}
>
  <ProgressBar value={progress} {label} showPercentage />
  <div class="exercise-body" class:tablet-grid={!!tabletColumns} style="--tablet-columns: {tabletColumns}">
    {@render children()}
  </div>
</div>

<style>
  .exercise-shell {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
    padding: var(--space-md, 16px);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .exercise-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 16px);
    width: 100%;
  }

  @media (min-width: 768px) {
    .exercise-shell {
      max-width: none;
    }

    .exercise-body.tablet-grid {
      display: grid;
      grid-template-columns: var(--tablet-columns);
      grid-auto-flow: dense;
      align-items: start;
    }
  }

  /* The region receives programmatic focus purely to capture keyboard
     shortcuts — it is not an interactive control, so suppress the focus ring
     for programmatic/mouse focus while keeping it for keyboard tab focus. */
  .exercise-shell:focus:not(:focus-visible) {
    outline: none;
  }
</style>
