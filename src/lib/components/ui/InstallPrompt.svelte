<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  let deferredPrompt: BeforeInstallPromptEvent | null = $state(null);
  let showBanner = $state(false);
  let dismissed = $state(false);

  onMount(() => {
    if (!browser) return;

    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('installBannerDismissed');
    if (wasDismissed) {
      dismissed = true;
      return;
    }

    // Only show on 2nd+ visit
    const visitCount = parseInt(sessionStorage.getItem('visit-count') || '0', 10);
    sessionStorage.setItem('visit-count', String(visitCount + 1));
    if (visitCount < 1) return; // 0-indexed: 0 = first visit, 1+ = 2nd+ visit

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      showBanner = true;
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  });

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showBanner = false;
    }
    deferredPrompt = null;
  }

  function handleDismiss() {
    showBanner = false;
    dismissed = true;
    sessionStorage.setItem('installBannerDismissed', 'true');
  }
</script>

{#if showBanner && !dismissed}
  <div class="install-banner" role="banner">
    <div class="install-content">
      <span class="install-icon">📲</span>
      <div class="install-text">
        <strong>Instalar Habla Anomia</strong>
        <span>Añade la app a tu pantalla de inicio para acceso rápido</span>
      </div>
      <div class="install-actions">
        <button class="btn-install" onclick={handleInstall}>Instalar</button>
        <button class="btn-dismiss" onclick={handleDismiss} aria-label="Cerrar">✕</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .install-banner {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: white;
    padding: 0.75rem 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    overflow: hidden;
    width: 100%;
    max-width: 100vw;
  }

  .install-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 768px;
    margin: 0 auto;
  }

  .install-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .install-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .install-text strong {
    font-size: 0.95rem;
  }

  .install-text span {
    font-size: 0.8rem;
    opacity: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .install-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .btn-install {
    background: white;
    color: #4f46e5;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    min-height: 44px;
    min-width: 44px;
    flex-shrink: 0;
  }

  .btn-install:hover {
    background: #f0f0ff;
  }

  .btn-dismiss {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.7;
    padding: 0.25rem;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-dismiss:hover {
    opacity: 1;
  }
</style>
