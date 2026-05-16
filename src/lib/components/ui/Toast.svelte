<script lang="ts">
  type Props = {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    ondismiss?: () => void;
  };

  let {
    message,
    type = 'info',
    duration = 4000,
    ondismiss,
  }: Props = $props();

  let visible = $state(true);

  let typeStyles = $derived.by(() => {
    const map = {
      success: `background:var(--success-bg);color:var(--success);border:1px solid var(--success);`,
      error: `background:var(--error-bg);color:var(--error);border:1px solid var(--error);`,
      info: `background:var(--surface-2);color:var(--text);border:1px solid var(--border);`,
    };
    return map[type];
  });

  $effect(() => {
    visible = true;
    const timer = setTimeout(() => {
      visible = false;
      setTimeout(() => ondismiss?.(), 300); // wait for animation
    }, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible !== undefined}
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    style="
      position:fixed;bottom:calc(80px + var(--safe-bottom));left:50%;
      transform:translateX(-50%) translateY({visible ? '0' : '100%'});
      min-width:min(90vw,400px);max-width:90vw;
      padding:var(--space-md) var(--space-lg);
      border-radius:var(--radius-md);box-shadow:var(--shadow-lg);
      font-size:var(--font-size-base);font-weight:600;
      display:flex;align-items:center;gap:var(--space-sm);
      transition:transform 0.3s ease;z-index:100;
      pointer-events:auto;
      {typeStyles}
    "
  >
    <span style="flex:1;">{message}</span>
    <button
      onclick={() => { visible = false; setTimeout(() => ondismiss?.(), 300); }}
      aria-label="Dismiss notification"
      style="
        background:transparent;border:none;color:inherit;
        font-size:var(--font-size-xl);cursor:pointer;
        min-width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;
      "
    >
      ✕
    </button>
  </div>
{/if}
