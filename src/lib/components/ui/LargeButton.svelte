<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    onclick: (e: MouseEvent) => void;
    label: string;
    variant?: 'primary' | 'secondary' | 'success';
    disabled?: boolean;
    children?: Snippet;
  };

  let {
    onclick,
    label,
    variant = 'primary',
    disabled = false,
    children,
  }: Props = $props();

  let variantStyles = $derived.by(() => {
    const map = {
      primary: 'background:var(--primary);color:#fff;border:2px solid var(--primary);',
      secondary:
        'background:var(--surface-2);color:var(--text);border:2px solid var(--border);',
      success: 'background:var(--success);color:#fff;border:2px solid var(--success);',
    };
    return map[variant];
  });

  let rootStyle = $derived(`
    display:inline-flex;align-items:center;justify-content:center;gap:10px;
    min-width:48px;min-height:48px;
    padding:14px 20px;
    font-family:var(--font-family);font-size:var(--font-size-lg);font-weight:600;
    border-radius:var(--radius-lg);
    cursor:pointer;touch-action:manipulation;
    transition:background var(--transition-fast),transform var(--transition-fast),box-shadow var(--transition-fast);
    -webkit-user-select:none;user-select:none;
    width:100%;max-width:100%;box-sizing:border-box;
    ${variantStyles}
    ${disabled ? 'opacity:0.5;pointer-events:none;' : ''}
  `);
</script>

<button
  {disabled}
  style={rootStyle}
  {onclick}
  aria-label={label}
>
  {#if children}
    <span class="icon-wrapper" aria-hidden="true">
      {@render children()}
    </span>
  {/if}
  <span class="btn-label">{label}</span>
</button>

<style>
  button:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  button:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }

  button:active:not(:disabled) {
    transform: scale(0.97);
  }

  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-label {
    line-height: 1.2;
    overflow: hidden;
  }
</style>
