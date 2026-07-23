<script lang="ts">
  import type { ExerciseMeta } from '$lib/exercises/registry';

  type Props = {
    meta: ExerciseMeta;
    /** Glyph size in px. The tinted tile fills its parent box. */
    size?: number;
    /** `tinted` = soft accent wash (default); `solid` = filled accent with white glyph. */
    variant?: 'tinted' | 'solid';
  };

  let { meta, size = 24, variant = 'tinted' }: Props = $props();
</script>

<span class="ex-icon" class:solid={variant === 'solid'} style="--ex-color: {meta.color}" aria-hidden="true">
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d={meta.icon} />
  </svg>
</span>

<style>
  /* Fills the parent box (which owns width/height/border-radius), so each page
     keeps its layout/responsive sizing while the tinting lives in one place. */
  .ex-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: color-mix(in srgb, var(--ex-color, var(--primary)) 14%, transparent);
    color: var(--ex-color, var(--primary));
  }

  .ex-icon.solid {
    background: var(--ex-color, var(--primary));
    color: #fff;
  }
</style>
