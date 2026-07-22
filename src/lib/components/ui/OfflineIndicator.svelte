<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let isOffline = $state(false);
  let showOnlineFlash = $state(false);

  onMount(() => {
    if (!browser) return;

    isOffline = !navigator.onLine;

    const goOffline = () => {
      isOffline = true;
      showOnlineFlash = false;
    };

    const goOnline = () => {
      isOffline = false;
      showOnlineFlash = true;
      setTimeout(() => {
        showOnlineFlash = false;
      }, 3000);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  });
</script>

{#if isOffline}
  <div class="offline-banner" role="status" aria-live="polite">
    <span class="offline-dot"></span>
    Sin conexión — modo offline
  </div>
{/if}

{#if showOnlineFlash}
  <div class="online-banner" role="status" aria-live="polite">
    <span class="online-dot"></span>
    En línea
  </div>
{/if}

<style>
  .offline-banner {
    position: fixed;
    bottom: var(--above-bottom-nav);
    left: 50%;
    transform: translateX(-50%);
    background: var(--offline-banner);
    color: white;
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: var(--shadow-md);
    white-space: nowrap;
  }

  .online-banner {
    position: fixed;
    bottom: var(--above-bottom-nav);
    left: 50%;
    transform: translateX(-50%);
    background: var(--online-banner);
    color: white;
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: var(--shadow-md);
    animation: fadeOut 3s ease forwards;
    white-space: nowrap;
  }

  .offline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    flex-shrink: 0;
  }

  .online-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    flex-shrink: 0;
  }

  @keyframes fadeOut {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
