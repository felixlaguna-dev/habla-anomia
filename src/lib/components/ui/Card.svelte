<script lang="ts">
  type Props = {
    title?: string;
    subtitle?: string;
    padding?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    onclick?: (e: MouseEvent) => void;
    children?: import('svelte').Snippet;
  };

  let {
    title = '',
    subtitle = '',
    padding = 'md',
    hoverable = false,
    onclick,
    children,
  }: Props = $props();

  let padMap = {
    sm: 'padding:var(--space-sm);',
    md: 'padding:var(--space-lg);',
    lg: 'padding:var(--space-xl);',
  };

  let rootStyles = $derived(`
    background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
    box-shadow:var(--shadow-sm);
    ${padMap[padding]}
    ${hoverable ? 'transition:transform var(--transition-fast),box-shadow var(--transition-fast);' : ''}
    ${onclick ? 'cursor:pointer;' : ''}
  `);
</script>

<div
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
  style={rootStyles}
  onclick={onclick}
  onkeydown={(e) => { if (onclick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onclick(e as any); } }}
  aria-label={title || undefined}
>
  {#if title || subtitle}
    <div style="margin-bottom:{title && children ? 'var(--space-md)' : '0'};">
      {#if title}
        <h3 style="font-size:var(--font-size-lg);font-weight:700;color:var(--text);margin:0;">{title}</h3>
      {/if}
      {#if subtitle}
        <p style="font-size:var(--font-size-sm);color:var(--text-dim);margin-top:4px;">{subtitle}</p>
      {/if}
    </div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  div:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }
  div[role="button"]:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  div[role="button"]:active {
    transform: translateY(0);
  }
</style>
