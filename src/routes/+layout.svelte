<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, initDefaults } from '$lib/db/settings';
  import { seedWords } from '$lib/db/words';
  import { WORDS_ES } from '$lib/data/words-es';
  import BottomNav from '$lib/components/ui/BottomNav.svelte';

  let { children } = $props();

  let themeClass = $state('');
  let textSizeClass = $state('');

  onMount(async () => {
    await initDefaults();
    const settings = await getAllSettings();

    themeClass = settings.theme === 'light' ? 'light-theme' : '';
    textSizeClass = settings.text_size === 'large' ? 'text-size-large' : settings.text_size === 'xlarge' ? 'text-size-xlarge' : '';

    locale.set(settings.language);
    await seedWords(WORDS_ES);
  });

  let hideNav = $derived($page.url.pathname.startsWith('/exercises/') && $page.url.pathname.split('/').length === 4 && $page.url.pathname !== '/exercises/');

  const navItems = [
    { path: '/', labelKey: 'nav.home', icon: 'home' },
    { path: '/exercises', labelKey: 'nav.exercises', icon: 'exercises' },
    { path: '/progress', labelKey: 'nav.progress', icon: 'progress' },
    { path: '/settings', labelKey: 'nav.settings', icon: 'settings' }
  ];

  function isActive(path: string): boolean {
    if (path === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(path);
  }
</script>

<div class="app-shell {themeClass} {textSizeClass}">
  <main class="main-content">
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
  }

  .light-theme {
    background: var(--bg-primary-light, #f8fafc);
    color: var(--text-primary-light, #1e293b);
  }

  .main-content {
    flex: 1;
    padding: 1rem;
    padding-bottom: 5rem;
    max-width: 768px;
    width: 100%;
    margin: 0 auto;
  }

  .text-size-large {
    font-size: 1.15rem;
  }

  .text-size-xlarge {
    font-size: 1.35rem;
  }
</style>
