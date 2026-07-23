<script lang="ts">
  import type { ExerciseMeta } from '$lib/exercises/registry';

  type Props = {
    meta: ExerciseMeta;
    size?: number;
  };

  let { meta, size = 24 }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={meta.icon} />
</svg>
