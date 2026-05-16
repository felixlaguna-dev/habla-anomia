<script lang="ts">
  type Props = {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onclick?: () => void;
    variant?: 'default' | 'success' | 'warning' | 'error';
  };

  let {
    label,
    active = false,
    disabled = false,
    onclick,
    variant = 'default',
  }: Props = $props();

  let variantStyles = $derived.by(() => {
    if (!active) {
      return `background:var(--surface-2);color:var(--text-dim);border:2px solid var(--border);`;
    }
    const map = {
      default: `background:var(--primary);color:#fff;border:2px solid var(--primary);`,
      success: `background:var(--success-bg);color:var(--success);border:2px solid var(--success);`,
      warning: `background:var(--warning-bg);color:var(--warning);border:2px solid var(--warning);`,
      error: `background:var(--error-bg);color:var(--error);border:2px solid var(--error);`,
    };
    return map[variant];
  });

  let rootStyle = $derived(`
    display:inline-flex;align-items:center;justify-content:center;
    min-height:40px;padding:8px 20px;
    border-radius:var(--radius-full);
    font-size:var(--font-size-base);font-weight:600;font-family:var(--font-family);
    cursor:pointer;touch-action:manipulation;white-space:nowrap;
    transition:background var(--transition-fast),transform var(--transition-fast);
    ${variantStyles}
    ${disabled ? 'opacity:0.4;pointer-events:none;' : ''}
  `);
</script>

<button
  style={rootStyle}
  {disabled}
  onclick={onclick}
  role="option"
  aria-selected={active || undefined}
  aria-label={label}
>
  {label}
</button>

<style>
  button:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }
  button:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  button:active:not(:disabled) {
    transform: scale(0.96);
  }
</style>
