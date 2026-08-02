<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, initDefaults } from '$lib/db/settings';
  import { cleanupAbandonedSessions } from '$lib/db/sessions';
  import { seedWords, resolveSeedReady } from '$lib/db/words';
  import { WORDS_ES, WORDS_ES_VERSION } from '$lib/data/words-es';
  import { manifestUrl, stripBase } from '$lib/utils/paths';
  import { applyAppearance } from '$lib/utils/appearance';
  import BottomNav from '$lib/components/ui/BottomNav.svelte';
  import InstallPrompt from '$lib/components/ui/InstallPrompt.svelte';
  import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';
  import { Spinner } from '$lib/components/ui';

  let { children } = $props();

  // Gates rendering until settings load and the onboarding redirect check
  // completes — prevents flashing the dashboard before redirecting first-run
  // users to the wizard.
  let ready = $state(false);

  /** Seed the word bank and sweep orphaned sessions. Safe to fire-and-forget. */
  async function runSeeding() {
    try {
      await seedWords(WORDS_ES, WORDS_ES_VERSION);
    } catch (err) {
      console.error('Word bank seed failed; exercises will use whatever is in the DB.', err);
    } finally {
      // Sweep orphaned sessions before unblocking page init — awaited so it
      // can't race with a new startSession() call in the exercise page.
      await cleanupAbandonedSessions().catch(() => {});
      resolveSeedReady();
    }
  }

  onMount(async () => {
    let settings;
    try {
      await initDefaults();
      settings = await getAllSettings();
    } catch (err) {
      console.error('Settings load failed; continuing with defaults.', err);
      ready = true;
      runSeeding();
      return;
    }

    // Appearance classes live on <html> (see applyAppearance) so the
    // text-size setting actually scales the rem-based UI.
    applyAppearance(settings);

    locale.set(settings.ui_language);

    // First-run onboarding redirect: if onboarding is incomplete and the user
    // is not already on /onboarding (or on the exempt /admin route), send them
    // through the wizard. Seeding still runs in the background so it's ready
    // by the time they finish. The ready gate stays closed until the redirect
    // completes, preventing a flash of the dashboard.
    if (browser && !settings.onboarding_complete) {
      const path = stripBase($page.url.pathname);
      if (path !== '/onboarding' && !path.startsWith('/admin')) {
        runSeeding();
        await goto(`${base}/onboarding`, { replaceState: true });
        ready = true;
        return;
      }
    }

    ready = true;
    await runSeeding();
  });

  let hideNav = $derived.by(() => {
    // Strip the base prefix so nav hiding works both locally (base = '')
    // and deployed (base = '/habla-anomia').
    const path = stripBase($page.url.pathname);
    return (path.startsWith('/exercises/') && path.split('/').length === 3)
      || path.endsWith('/review-failures')
      || path.endsWith('/progress/report')
      || path === '/onboarding';
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
</svelte:head>

<a href="#main-content" class="skip-to-content">{$t('a11y.skip_to_content')}</a>

{#if !hideNav}
  <InstallPrompt />
{/if}
<OfflineIndicator />

<div class="app-shell">
  <main id="main-content" class="main-content" class:no-bottom-nav={hideNav}>
    {#if ready}
      {@render children()}
    {:else}
      <Spinner />
    {/if}
  </main>

  {#if ready && !hideNav}
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

  /* Exercise pages hide the bottom nav — reclaim its clearance so the
     exercise fills the viewport instead of leaving a dead band at the
     bottom. Keep only safe-area for home indicators. */
  .main-content.no-bottom-nav {
    padding-bottom: var(--safe-bottom, 0px);
  }
</style>
