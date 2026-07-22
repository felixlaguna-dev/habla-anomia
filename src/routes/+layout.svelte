<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, initDefaults } from '$lib/db/settings';
  import { seedWords, resolveSeedReady } from '$lib/db/words';
  import { WORDS_ES, WORDS_ES_VERSION } from '$lib/data/words-es';
  import { manifestUrl } from '$lib/utils/paths';
  import { applyAppearance } from '$lib/utils/appearance';
  import BottomNav from '$lib/components/ui/BottomNav.svelte';
  import InstallPrompt from '$lib/components/ui/InstallPrompt.svelte';
  import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';

  let { children } = $props();

  onMount(async () => {
    await initDefaults();
    const settings = await getAllSettings();

    // Appearance classes live on <html> (see applyAppearance) so the
    // text-size setting actually scales the rem-based UI.
    applyAppearance(settings);

    locale.set(settings.language);
    try {
      await seedWords(WORDS_ES, WORDS_ES_VERSION);
    } catch (err) {
      console.error('Word bank seed failed; exercises will use whatever is in the DB.', err);
    } finally {
      resolveSeedReady();
    }
  });

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

<div class="app-shell">
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
    /* Follow the theme tokens set on <html> by applyAppearance(). */
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    width: 100%;
  }

  /* Phone: comfortable padding + clearance for fixed bottom nav */
  .main-content {
    flex: 1;
    padding: 1rem;
    padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom, 0px) + 1rem);
    width: 100%;
    margin: 0 auto;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
  }

  /* Tablet portrait: wider, bigger padding for larger nav */
  @media (min-width: 768px) {
    .main-content {
      padding: 1.25rem 1.5rem;
      padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom, 0px) + 1.5rem);
    }
  }

  /* Tablet landscape: more side padding */
  @media (min-width: 768px) and (orientation: landscape) {
    .main-content {
      padding: 1.25rem 2rem;
      padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom, 0px) + 1.5rem);
    }
  }
</style>
