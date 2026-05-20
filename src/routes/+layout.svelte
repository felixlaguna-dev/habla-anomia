<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, initDefaults } from '$lib/db/settings';
  import { seedWords, resolveSeedReady } from '$lib/db/words';
  import { WORDS_ES } from '$lib/data/words-es';
  import { manifestUrl } from '$lib/utils/paths';
  import BottomNav from '$lib/components/ui/BottomNav.svelte';
  import InstallPrompt from '$lib/components/ui/InstallPrompt.svelte';
  import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';

  let { children } = $props();

  let themeClass = $state('');
  let textSizeClass = $state('');
  let highContrastClass = $state('');

  onMount(async () => {
    await initDefaults();
    const settings = await getAllSettings();

    themeClass = settings.theme === 'light' ? 'light-theme' : '';
    textSizeClass = getFontScaleClass(settings.text_size);
    highContrastClass = settings.high_contrast ? 'high-contrast' : '';

    locale.set(settings.language);
    await seedWords(WORDS_ES);
    resolveSeedReady();
  });

  function getFontScaleClass(textSize: string): string {
    switch (textSize) {
      case 'small': return 'text-small';
      case 'normal': return 'text-medium';
      case 'large': return 'text-large';
      case 'xlarge': return 'text-extra-large';
      default: return 'text-medium';
    }
  }

  let hideNav = $derived.by(() => {
    const p = $page.url.pathname;
    return p.startsWith('/exercises/') && p.split('/').length === 3;
  });

  const navItems = [
    { path: `${base}/`, labelKey: 'nav.home', icon: 'home' },
    { path: `${base}/progress`, labelKey: 'nav.progress', icon: 'progress' },
    { path: `${base}/settings`, labelKey: 'nav.settings', icon: 'settings' }
  ];

  function isActive(path: string): boolean {
    if (path === `${base}/`) return $page.url.pathname === `${base}/` || $page.url.pathname === base || $page.url.pathname === base + '/';
    return $page.url.pathname.startsWith(path);
  }
</script>

<svelte:head>
  <title>Habla Anomia — {$t('app.tagline')}</title>
  <link rel="manifest" href={manifestUrl()} />
  <meta name="theme-color" content="#4f46e5" />
</svelte:head>

<a href="#main-content" class="skip-to-content">{$t('a11y.skip_to_content')}</a>

<InstallPrompt />
<OfflineIndicator />

<div class="app-shell {themeClass} {textSizeClass} {highContrastClass}">
  <main id="main-content" class="main-content">
    {@render children()}
  </main>

  {#if !hideNav}
    <BottomNav {navItems} {isActive} />
  {/if}
</div>

<style>
  .app-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary, #0f172a);
    color: var(--text-primary, #f1f5f9);
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
  }

  .light-theme {
    background: var(--bg-primary-light, #f8fafc);
    color: var(--text-primary-light, #1e293b);
  }

  .main-content {
    flex: 1;
    padding: 1rem;
    padding-bottom: calc(64px + var(--safe-bottom, 0px) + 5rem);
    max-width: 768px;
    width: 100%;
    margin: 0 auto;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
  }
</style>
