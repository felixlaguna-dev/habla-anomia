<script lang="ts">
  import { page } from '$app/stores';
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, initDefaults, seedWords } from '$lib/db';
  import { WORDS_ES } from '$lib/data/words-es';
  import { browser } from '$app/environment';

  let textClass = $state('');
  let themeClass = $state('');

  onMount(async () => {
    if (!browser) return;
    await initDefaults();
    const settings = await getAllSettings();
    // Apply theme class
    themeClass = settings.theme === 'light' ? 'light-theme' : '';
    // Apply text size class
    if (settings.text_size === 'large') textClass = 'text-size-large';
    else if (settings.text_size === 'xlarge') textClass = 'text-size-xlarge';
    // Set locale
    locale.set(settings.language);
    // Seed words if needed
    await seedWords(WORDS_ES);
  });

  // Check if we're in an active exercise — hide nav if so
  let hideNav = $derived(
    $page.url.pathname.startsWith('/exercises/') &&
    $page.url.pathname.split('/').length === 4 &&
    $page.url.pathname !== '/exercises/'
  );

  const navItems = [
    { path: '/', labelKey: 'nav.home', icon: 'home' },
    { path: '/exercises', labelKey: 'nav.exercises', icon: 'exercises' },
    { path: '/progress', labelKey: 'nav.progress', icon: 'progress' },
    { path: '/settings', labelKey: 'nav.settings', icon: 'settings' }
  ] as const;

  function isActive(path: string): boolean {
    if (path === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(path);
  }
</script>

<div class="app-shell {themeClass} {textClass}">
  <main class="main-content">
    {@render children()}
  </main>

  {#if !hideNav}
    <nav class="bottom-nav" aria-label="Main navigation">
      <div class="nav-inner">
        {#each navItems as item}
          {@const active = isActive(item.path)}
          <a
            href={item.path}
            class="nav-item"
            class:active
            aria-current={active ? 'page' : undefined}
          >
            <span class="nav-icon" aria-hidden="true">
              {#if item.icon === 'home'}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              {:else if item.icon === 'exercises'}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              {:else if item.icon === 'progress'}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 20V10"/>
                  <path d="M12 20V4"/>
                  <path d="M6 20v-6"/>
                </svg>
              {:else if item.icon === 'settings'}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              {/if}
            </span>
            <span class="nav-label">{$t(item.labelKey)}</span>
          </a>
        {/each}
      </div>
    </nav>
  {/if}
</div>

<style>
  .app-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: var(--space-md);
    max-width: 768px;
    width: 100%;
    margin: 0 auto;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    z-index: 100;
    padding-bottom: var(--safe-bottom);
    box-shadow: var(--shadow-lg);
  }

  .nav-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    max-width: 768px;
    margin: 0 auto;
    height: 64px;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: var(--touch-min);
    min-height: var(--touch-min);
    text-decoration: none;
    color: var(--text-muted);
    transition: color var(--transition-fast);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
  }

  .nav-item:active {
    transform: scale(0.95);
  }

  .nav-item.active {
    color: var(--primary);
  }

  .nav-item.active .nav-label {
    font-weight: 600;
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
  }

  .nav-label {
    font-size: var(--font-size-sm);
    line-height: 1.2;
    white-space: nowrap;
  }
</style>
