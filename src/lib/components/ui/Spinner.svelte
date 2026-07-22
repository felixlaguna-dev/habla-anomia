<script lang="ts">
  type Props = {
    /** Spinner diameter as a CSS length. */
    size?: string;
    /** Optional caption shown beneath the spinner. */
    label?: string;
  };

  let { size = '40px', label }: Props = $props();
</script>

<div class="spinner-wrap" role="status" aria-live="polite">
  <div class="spinner" style="--spinner-size: {size}" aria-hidden="true"></div>
  {#if label}<span class="spinner-label">{label}</span>{/if}
</div>

<style>
  .spinner-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    min-height: 40vh;
  }

  .spinner {
    width: var(--spinner-size);
    height: var(--spinner-size);
    border: 3px solid var(--surface-2);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner-label {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
