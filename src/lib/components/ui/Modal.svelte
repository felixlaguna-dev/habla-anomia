<script lang="ts">
  type Props = {
    open?: boolean;
    title?: string;
    onclose?: () => void;
    children?: import('svelte').Snippet;
  };

  let { open = false, title = '', onclose, children }: Props = $props();

  let previouslyFocused: HTMLElement | null = $state(null);

  $effect(() => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement;
      // Focus first focusable element after render
      setTimeout(() => {
        const modal = document.getElementById('modal-dialog');
        if (modal) {
          const focusable = modal.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      }, 50);
    } else if (previouslyFocused) {
      previouslyFocused.focus();
      previouslyFocused = null;
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose?.();
      return;
    }
    if (e.key === 'Tab') {
      // Focus trap
      const modal = document.getElementById('modal-dialog');
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose?.();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:var(--space-md);background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);"
    onkeydown={handleKeydown}
    onclick={handleBackdropClick}
  >
    <div
      id="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);
        width:100%;max-width:480px;max-height:90dvh;overflow-y:auto;
        padding:var(--space-xl);
      "
      onclick={(e) => e.stopPropagation()}
    >
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
        {#if title}
          <h2 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text);margin:0;">{title}</h2>
        {/if}
        <button
          onclick={onclose}
          aria-label="Close dialog"
          style="
            display:flex;align-items:center;justify-content:center;
            min-width:48px;min-height:48px;
            background:transparent;border:none;color:var(--text-dim);
            font-size:var(--font-size-2xl);cursor:pointer;
            border-radius:var(--radius-sm);
          "
        >
          ✕
        </button>
      </div>
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
{/if}

<style>
  button:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }
</style>
