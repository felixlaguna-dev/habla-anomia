<script lang="ts">
  type Props = {
    variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
    size?: 'md' | 'lg' | 'xl';
    disabled?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    onclick?: (e: MouseEvent) => void;
    'aria-label'?: string;
    children?: import('svelte').Snippet;
  };

  let {
    variant = 'primary',
    size = 'lg',
    disabled = false,
    fullWidth = false,
    loading = false,
    onclick,
    'aria-label': ariaLabel,
    children,
  }: Props = $props();

  let baseStyles = $derived.by(() => {
    const sizeMap = {
      md: 'min-height:48px;padding:10px 20px;font-size:var(--font-size-base);border-radius:var(--radius-md);',
      lg: 'min-height:56px;padding:12px 28px;font-size:var(--font-size-lg);border-radius:var(--radius-md);',
      xl: 'min-height:64px;padding:14px 36px;font-size:var(--font-size-xl);border-radius:var(--radius-lg);',
    };

    const variantMap = {
      primary: `background:var(--primary);color:#fff;border:2px solid var(--primary);`,
      secondary: `background:var(--surface-2);color:var(--text);border:2px solid var(--border);`,
      success: `background:var(--success);color:#fff;border:2px solid var(--success);`,
      ghost: `background:transparent;color:var(--text);border:2px solid transparent;`,
      danger: `background:var(--error);color:#fff;border:2px solid var(--error);`,
    };

    return `
      display:inline-flex;align-items:center;justify-content:center;gap:8px;
      font-family:var(--font-family);font-weight:600;cursor:pointer;
      transition:background var(--transition-fast),transform var(--transition-fast),box-shadow var(--transition-fast);
      -webkit-user-select:none;user-select:none;
      touch-action:manipulation;
      ${sizeMap[size]}
      ${variantMap[variant]}
      ${fullWidth ? 'width:100%;' : ''}
      ${disabled || loading ? 'opacity:0.5;pointer-events:none;' : ''}
    `;
  });

  function handleClick(e: MouseEvent) {
    if (disabled || loading) return;
    onclick?.(e);
  }
</script>

<button
  style={baseStyles}
  {disabled}
  onmousedown={(e) => !disabled && !loading && (e.currentTarget.style.transform = 'scale(0.97)')}
  onmouseup={(e) => (e.currentTarget.style.transform = '')}
  onmouseleave={(e) => (e.currentTarget.style.transform = '')}
  onclick={handleClick}
  aria-busy={loading || undefined}
  aria-label={ariaLabel}
>
  {#if loading}
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      style="animation:spin 1s linear infinite;"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" stroke-dashoffset="10" />
    </svg>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  button:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }
  button:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }
</style>
