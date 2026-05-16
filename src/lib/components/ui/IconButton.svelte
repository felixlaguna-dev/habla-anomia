<script lang="ts">
  type Props = {
    icon: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'md' | 'lg' | 'xl';
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
  };

  let {
    icon,
    label,
    variant = 'secondary',
    size = 'lg',
    disabled = false,
    onclick,
  }: Props = $props();

  let sizeMap = {
    md: 'min-width:48px;min-height:48px;',
    lg: 'min-width:56px;min-height:56px;',
    xl: 'min-width:64px;min-height:64px;',
  };

  let iconSizeMap = { md: 20, lg: 24, xl: 28 };

  let variantMap = {
    primary: `background:var(--primary);color:#fff;border:2px solid var(--primary);`,
    secondary: `background:var(--surface-2);color:var(--text);border:2px solid var(--border);`,
    ghost: `background:transparent;color:var(--text);border:2px solid transparent;`,
  };

  let rootStyle = $derived(`
    display:inline-flex;align-items:center;justify-content:center;
    border-radius:var(--radius-md);cursor:pointer;
    touch-action:manipulation;
    transition:background var(--transition-fast),transform var(--transition-fast);
    ${sizeMap[size]}
    ${variantMap[variant]}
    ${disabled ? 'opacity:0.5;pointer-events:none;' : ''}
  `);

  let svgSize = $derived(iconSizeMap[size]);
</script>

<button
  style={rootStyle}
  {disabled}
  onclick={onclick}
  aria-label={label}
>
  <svg
    width={svgSize}
    height={svgSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {@html icon}
  </svg>
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
    transform: scale(0.95);
  }
</style>
