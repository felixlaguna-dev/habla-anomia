<script lang="ts">
  type Props = {
    seconds: number;
    running?: boolean;
    ontimeout?: () => void;
    showProgress?: boolean;
  };

  let { seconds, running = false, ontimeout, showProgress = true }: Props = $props();

  let remaining = $state(seconds);

  let urgent = $derived(remaining <= 10);
  let progressPercent = $derived(seconds > 0 ? (remaining / seconds) * 100 : 0);
  let displayMinutes = $derived(Math.floor(remaining / 60));
  let displaySeconds = $derived(String(remaining % 60).padStart(2, '0'));

  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Reset when seconds prop changes
  $effect(() => {
    remaining = seconds;
  });

  $effect(() => {
    // Clean up any existing interval
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (running && remaining > 0) {
      intervalId = setInterval(() => {
        if (remaining <= 1) {
          remaining = 0;
          if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
          }
          ontimeout?.();
        } else {
          remaining--;
        }
      }, 1000);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  });
</script>

<div
  role="timer"
  aria-label="Time remaining: {displayMinutes} minutes {displaySeconds} seconds"
  aria-live={urgent ? 'assertive' : 'off'}
  style="display:flex;flex-direction:column;align-items:center;gap:var(--space-sm);"
>
  {#if showProgress}
    <!-- Circular progress -->
    <div style="position:relative;width:120px;height:120px;">
      <svg width="120" height="120" viewBox="0 0 120 120" style="transform:rotate(-90deg);">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" stroke-width="8" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={urgent ? 'var(--error)' : 'var(--primary)'}
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray={2 * Math.PI * 52}
          stroke-dashoffset={2 * Math.PI * 52 * (1 - progressPercent / 100)}
          style="transition:stroke-dashoffset 1s linear,stroke var(--transition-fast);"
        />
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <span
          style="
            font-size:var(--font-size-2xl);font-weight:700;
            color:{urgent ? 'var(--error)' : 'var(--text)'};
            font-variant-numeric:tabular-nums;
            transition:color var(--transition-fast);
          "
        >
          {displayMinutes}:{displaySeconds}
        </span>
      </div>
    </div>
  {:else}
    <span
      style="
        font-size:var(--font-size-3xl);font-weight:700;
        color:{urgent ? 'var(--error)' : 'var(--text)'};
        font-variant-numeric:tabular-nums;
        transition:color var(--transition-fast);
      "
    >
      {displayMinutes}:{displaySeconds}
    </span>
  {/if}
</div>
