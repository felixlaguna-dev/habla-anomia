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
  role="listbox"
  aria-label="Selection options"
  style="display:flex;gap:var(--space-sm);overflow-x:auto;padding:var(--space-sm) 0;-webkit-overflow-scrolling:touch;scrollbar-width:thin;"
>
  {#each options as opt (opt.value)}
    <Chip
      label={opt.label}
      active={selectedValue === opt.value}
      onclick={() => onchange?.(opt.value)}
    />
  {/each}
</div>
