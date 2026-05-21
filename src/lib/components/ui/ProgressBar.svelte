<script lang="ts">
  type Props = {
    value?: number;
    label?: string;
    showPercentage?: boolean;
    color?: string;
  };

  let { value = 0, label = '', showPercentage = false, color = 'var(--primary)' }: Props = $props();

  let clamped = $derived(Math.max(0, Math.min(100, value)));
</script>

<div style="display:flex;flex-direction:column;gap:6px;">
  {#if label || showPercentage}
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      {#if label}
        <span style="font-size:var(--font-size-base);font-weight:600;color:var(--text);">{label}</span>
      {/if}
      {#if showPercentage}
        <span style="font-size:var(--font-size-base);font-weight:700;color:var(--text-dim);">{Math.round(clamped)}%</span>
      {/if}
    </div>
  {/if}

  <div
    role="progressbar"
    aria-valuenow={Math.round(clamped)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label || 'Progress'}
    style="
      width:100%;height:16px;
      background:var(--surface-2);border-radius:var(--radius-full);
      overflow:hidden;
    "
  >
    <div
      style="
        height:100%;width:{clamped}%;
        background:{color};
        transition:width 0.4s ease;
      "
    ></div>
  </div>
</div>
