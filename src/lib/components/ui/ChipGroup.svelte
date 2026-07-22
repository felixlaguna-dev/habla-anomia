<script lang="ts">
  import Chip from './Chip.svelte';

  type ChipOption = { label: string; value: string };

  type Props = {
    options: ChipOption[];
    selectedValue?: string;
    onchange?: (value: string) => void;
  };

  let { options, selectedValue = '', onchange }: Props = $props();
</script>

<div
  class="chip-group"
  role="listbox"
  aria-label="Selection options"
>
  {#each options as opt (opt.value)}
    <Chip
      label={opt.label}
      active={selectedValue === opt.value}
      onclick={() => onchange?.(opt.value)}
    />
  {/each}
</div>

<style>
  .chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    padding: var(--space-sm) 0;
  }
</style>
