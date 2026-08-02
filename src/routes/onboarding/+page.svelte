<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import { getAllSettings, setSetting, DEFAULTS } from '$lib/db/settings';
  import { applyAppearance } from '$lib/utils/appearance';
  import { Spinner } from '$lib/components/ui';
  import { LANGUAGES, type Language, type AppSettings } from '$lib/types';

  const TOTAL_STEPS = 3;

  let step = $state(1);
  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let headingEl: HTMLElement | undefined = $state();

  const textSizeOptions: { value: AppSettings['text_size']; fontPx: string; labelKey: string }[] = [
    { value: 'small', fontPx: '0.9rem', labelKey: 'settings.small' },
    { value: 'normal', fontPx: '1.15rem', labelKey: 'settings.normal' },
    { value: 'large', fontPx: '1.5rem', labelKey: 'settings.large' },
    { value: 'xlarge', fontPx: '1.9rem', labelKey: 'settings.extra_large' },
  ];

  const themeOptions: { value: AppSettings['theme']; labelKey: string }[] = [
    { value: 'light', labelKey: 'settings.light' },
    { value: 'dark', labelKey: 'settings.dark' },
  ];

  onMount(async () => {
    if (!browser) return;
    try {
      settings = await getAllSettings();
    } catch {
      settings = { ...DEFAULTS };
    } finally {
      loading = false;
    }
  });

  /** Update a setting, apply live side-effects, and persist to IDB. */
  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    settings = { ...settings, [key]: value };
    if (key === 'ui_language') locale.set(value as Language);
    if (key === 'theme' || key === 'text_size') applyAppearance(settings);
    await setSetting(key, value);
  }

  async function focusHeading() {
    await tick();
    headingEl?.focus();
  }

  async function next() {
    if (step < TOTAL_STEPS) {
      step++;
      await focusHeading();
    }
  }

  async function back() {
    if (step > 1) {
      step--;
      await focusHeading();
    }
  }

  async function finish() {
    await setSetting('onboarding_complete', true);
    await goto(`${base}/`, { replaceState: true });
  }

  async function skip() {
    if (!settings) return;
    // Apply defaults in memory, call applyAppearance once, then persist in parallel
    settings = { ...settings, ui_language: DEFAULTS.ui_language, text_size: DEFAULTS.text_size, theme: DEFAULTS.theme };
    locale.set(DEFAULTS.ui_language);
    applyAppearance(settings);
    await Promise.all([
      setSetting('ui_language', DEFAULTS.ui_language),
      setSetting('text_size', DEFAULTS.text_size),
      setSetting('theme', DEFAULTS.theme),
    ]);
    await finish();
  }
</script>

<svelte:head>
  <title>{$t('onboarding.welcome')} · {$t('app.name')}</title>
</svelte:head>

{#if loading}
  <Spinner label={$t('common.loading')} />
{:else if settings}
  <section class="onboarding-page" aria-label={$t('onboarding.welcome')}>
    <!-- Step indicator -->
    <div class="step-indicator" role="status" aria-live="polite">
      <span class="step-text">{$t('onboarding.step', { current: String(step), total: String(TOTAL_STEPS) })}</span>
      <div class="step-dots" aria-hidden="true">
        {#each Array(TOTAL_STEPS) as _, i (i)}
          <span class="step-dot" class:step-dot-active={i + 1 === step}></span>
        {/each}
      </div>
    </div>

    <!-- Skip button (hidden on final step — finish button is the natural completion) -->
    {#if step < TOTAL_STEPS}
      <button class="skip-btn" onclick={skip} aria-label={$t('common.skip')}>
        {$t('common.skip')}
      </button>
    {/if}

    <div class="step-content">
      {#if step === 1}
        <!-- Step 1: Language -->
        <h1 class="step-title" bind:this={headingEl} tabindex="-1">{$t('onboarding.choose_language')}</h1>
        <div class="lang-grid" role="group" aria-label={$t('onboarding.choose_language')}>
          {#each LANGUAGES as opt (opt.value)}
            <button
              class="lang-btn"
              class:lang-btn-active={settings.ui_language === opt.value}
              aria-pressed={settings.ui_language === opt.value}
              onclick={() => updateSetting('ui_language', opt.value)}
            >
              {opt.label}
            </button>
          {/each}
        </div>
      {:else if step === 2}
        <!-- Step 2: Text size (buttons rendered AT their actual size) -->
        <h1 class="step-title" bind:this={headingEl} tabindex="-1">{$t('onboarding.choose_text_size')}</h1>
        <div class="text-size-list" role="group" aria-label={$t('onboarding.choose_text_size')}>
          {#each textSizeOptions as opt (opt.value)}
            <button
              class="text-size-btn"
              class:text-size-btn-active={settings.text_size === opt.value}
              aria-pressed={settings.text_size === opt.value}
              onclick={() => updateSetting('text_size', opt.value)}
            >
              <span class="text-size-preview" style="font-size: {opt.fontPx};">{$t(opt.labelKey)}</span>
            </button>
          {/each}
        </div>
      {:else if step === 3}
        <!-- Step 3: Theme + Welcome -->
        <div class="welcome-block">
          <h1 class="step-title" bind:this={headingEl} tabindex="-1">{$t('onboarding.welcome')}</h1>
          <p class="welcome-message">{$t('onboarding.welcome_message')}</p>
        </div>

        <h2 class="step-subtitle">{$t('onboarding.choose_theme')}</h2>
        <div class="theme-previews" role="group" aria-label={$t('onboarding.choose_theme')}>
          {#each themeOptions as opt (opt.value)}
            <button
              class="theme-card"
              class:theme-card-active={settings.theme === opt.value}
              class:theme-card-light={opt.value === 'light'}
              class:theme-card-dark={opt.value === 'dark'}
              aria-pressed={settings.theme === opt.value}
              onclick={() => updateSetting('theme', opt.value)}
            >
              <div class="theme-mock">
                <div class="theme-mock-header">
                  <span class="theme-mock-dot"></span>
                  <span class="theme-mock-dot"></span>
                  <span class="theme-mock-dot"></span>
                </div>
                <div class="theme-mock-body">
                  <div class="theme-mock-line"></div>
                  <div class="theme-mock-line theme-mock-line-short"></div>
                  <div class="theme-mock-btn"></div>
                </div>
              </div>
              <span class="theme-card-label">{$t(opt.labelKey)}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Navigation buttons -->
    <div class="nav-buttons">
      {#if step > 1}
        <button class="nav-btn nav-back" onclick={back} aria-label={$t('common.back')}>
          {$t('common.back')}
        </button>
      {/if}
      {#if step < TOTAL_STEPS}
        <button class="nav-btn nav-next" onclick={next} aria-label={$t('common.next')}>
          {$t('common.next')}
        </button>
      {:else}
        <button class="nav-btn nav-finish" onclick={finish} aria-label={$t('onboarding.lets_start')}>
          {$t('onboarding.lets_start')}
        </button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .onboarding-page {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 2rem);
    padding: var(--space-md) var(--space-sm) var(--space-lg);
    max-width: 600px;
    margin: 0 auto;
    position: relative;
  }

  /* Step indicator */
  .step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  .step-text {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .step-dots {
    display: flex;
    gap: var(--space-sm);
  }

  .step-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--surface-3);
    transition: background var(--transition-fast), transform var(--transition-fast);
  }

  .step-dot-active {
    background: var(--primary);
    transform: scale(1.3);
  }

  /* Skip button */
  .skip-btn {
    position: absolute;
    top: var(--space-md);
    right: var(--space-sm);
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: var(--font-size-base);
    font-family: var(--font-family);
    padding: var(--space-sm) var(--space-md);
    min-height: var(--touch-min);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    touch-action: manipulation;
  }

  .skip-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* Step content */
  .step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xl);
    padding-top: var(--space-md);
  }

  .step-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
    text-align: center;
    margin: 0;
  }

  .step-subtitle {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-dim);
    text-align: center;
    margin: 0;
  }

  /* Language buttons */
  .lang-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    width: 100%;
  }

  .lang-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    padding: var(--space-md) var(--space-lg);
    background: var(--surface-2);
    border: 3px solid var(--border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-family);
    transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
    touch-action: manipulation;
  }

  .lang-btn:active {
    transform: scale(0.97);
  }

  .lang-btn-active {
    border-color: var(--primary);
    background: var(--primary);
    color: #ffffff;
  }

  .lang-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  /* Text size buttons */
  .text-size-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
  }

  .text-size-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    padding: var(--space-md) var(--space-lg);
    background: var(--surface-2);
    border: 3px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-family);
    font-weight: 600;
    transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
    touch-action: manipulation;
  }

  .text-size-btn:active {
    transform: scale(0.98);
  }

  .text-size-btn-active {
    border-color: var(--primary);
    background: var(--primary);
    color: #ffffff;
  }

  .text-size-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  /* The label inside each button is rendered at the actual font size
     the option represents, so the choice is self-demonstrating. */
  .text-size-preview {
    line-height: 1.2;
  }

  /* Welcome block */
  .welcome-block {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .welcome-message {
    font-size: var(--font-size-lg);
    color: var(--text-dim);
    line-height: 1.6;
    margin: 0;
    max-width: 480px;
  }

  /* Theme preview cards */
  .theme-previews {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    width: 100%;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-sm);
    background: var(--surface-2);
    border: 3px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-family: var(--font-family);
    transition: border-color var(--transition-fast), transform var(--transition-fast);
    touch-action: manipulation;
  }

  .theme-card:active {
    transform: scale(0.97);
  }

  .theme-card-active {
    border-color: var(--primary);
    border-width: 3px;
  }

  .theme-card:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  /* Mini theme mock — a small card that looks like a window */
  .theme-mock {
    border-radius: var(--radius-md);
    overflow: hidden;
    min-height: 100px;
  }

  /* Light preview card: force light theme colors via preview tokens.
     Label color is intentionally NOT overridden — it uses var(--text)
     from .theme-card-label so it stays legible regardless of active theme. */
  .theme-card-light .theme-mock {
    background: var(--preview-light-bg);
    border: 1px solid var(--preview-light-border);
  }
  .theme-card-light .theme-mock-header {
    background: var(--preview-light-surface);
  }
  .theme-card-light .theme-mock-dot,
  .theme-card-light .theme-mock-line,
  .theme-card-light .theme-mock-line-short {
    background: var(--preview-light-border);
  }
  .theme-card-light .theme-mock-btn {
    background: var(--preview-light-accent);
  }

  /* Dark preview card: force dark theme colors via preview tokens */
  .theme-card-dark .theme-mock {
    background: var(--preview-dark-bg);
    border: 1px solid var(--preview-dark-border);
  }
  .theme-card-dark .theme-mock-header {
    background: var(--preview-dark-surface);
  }
  .theme-card-dark .theme-mock-dot,
  .theme-card-dark .theme-mock-line,
  .theme-card-dark .theme-mock-line-short {
    background: var(--preview-dark-border);
  }
  .theme-card-dark .theme-mock-btn {
    background: var(--preview-dark-accent);
  }

  .theme-mock-header {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
  }

  .theme-mock-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .theme-mock-body {
    padding: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }

  .theme-mock-line {
    height: 6px;
    border-radius: 3px;
    width: 80%;
  }

  .theme-mock-line-short {
    height: 6px;
    border-radius: 3px;
    width: 50%;
  }

  .theme-mock-btn {
    height: 14px;
    width: 40px;
    border-radius: 4px;
    margin-top: 4px;
  }

  .theme-card-label {
    text-align: center;
    font-size: var(--font-size-lg);
    font-weight: 600;
    padding: var(--space-xs) 0;
  }

  /* Navigation buttons */
  .nav-buttons {
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-xl);
    padding-bottom: var(--space-md);
  }

  .nav-btn {
    flex: 1;
    min-height: 72px;
    padding: var(--space-md) var(--space-xl);
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-lg);
    font-weight: 700;
    font-family: var(--font-family);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
    touch-action: manipulation;
  }

  .nav-btn:active {
    transform: scale(0.98);
  }

  .nav-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  .nav-back {
    background: var(--surface-3);
    color: var(--text);
  }

  .nav-next,
  .nav-finish {
    background: var(--primary);
    color: #ffffff;
  }

  /* Tablet */
  @media (min-width: 768px) {
    .onboarding-page {
      max-width: 700px;
      padding: var(--space-lg) var(--space-md) var(--space-xl);
    }

    .step-title {
      font-size: var(--font-size-3xl);
    }

    .step-subtitle {
      font-size: var(--font-size-xl);
    }

    .lang-btn {
      min-height: 88px;
      font-size: var(--font-size-2xl);
    }

    .text-size-btn {
      min-height: 88px;
    }

    .welcome-message {
      font-size: var(--font-size-xl);
    }

    .nav-btn {
      min-height: 80px;
      font-size: var(--font-size-xl);
    }
  }
</style>
