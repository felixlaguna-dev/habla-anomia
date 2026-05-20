<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, setSetting } from '$lib/db';
  import { Card, Button, ChipGroup } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import type { Language, AppSettings } from '$lib/types';

  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let deleteConfirming = $state(false);
  let deleteConfirmTimer: ReturnType<typeof setTimeout> | null = null;

  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'ca', label: 'Català' },
    { value: 'eu', label: 'Euskara' },
    { value: 'en', label: 'English' }
  ];

  const textSizeOptions = [
    { value: 'small', labelKey: 'settings.small' },
    { value: 'normal', labelKey: 'settings.normal' },
    { value: 'large', labelKey: 'settings.large' },
    { value: 'xlarge', labelKey: 'settings.extra_large' }
  ];

  const themeOptions = [
    { value: 'dark', labelKey: 'settings.dark' },
    { value: 'light', labelKey: 'settings.light' }
  ];

  async function loadSettings() {
    if (!browser) return;
    settings = await getAllSettings();
    loading = false;
  }

  onMount(loadSettings);

  function getFontScaleClass(textSize: string): string {
    switch (textSize) {
      case 'small': return 'text-small';
      case 'normal': return 'text-medium';
      case 'large': return 'text-large';
      case 'xlarge': return 'text-extra-large';
      default: return 'text-medium';
    }
  }

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    await setSetting(key, value);

    // Update local state
    settings = { ...settings!, [key]: value };

    const root = document.querySelector('.app-shell');
    if (!root) return;

    // Apply theme changes immediately
    if (key === 'theme') {
      root.classList.toggle('light-theme', value === 'light');
    }

    // Apply text size changes immediately
    if (key === 'text_size') {
      root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large', 'text-size-large', 'text-size-xlarge');
      root.classList.add(getFontScaleClass(value as string));
    }

    // Apply high contrast changes immediately
    if (key === 'high_contrast') {
      root.classList.toggle('high-contrast', value as boolean);
    }

    // Apply language changes immediately
    if (key === 'language') {
      locale.set(value as Language);
    }
  }

  async function handleExport() {
    if (!browser) return;
    const { db } = await import('$lib/db/database');
    const data = {
      attempts: await db.attempts.toArray(),
      sessions: await db.sessions.toArray(),
      spacedRepetition: await db.spacedRepetition.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habla-anomia-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!browser) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { db } = await import('$lib/db/database');
        if (data.settings) {
          for (const s of data.settings) {
            await db.settings.put(s);
          }
        }
        await loadSettings();
      } catch (e) {
        console.error('Import failed:', e);
      }
    };
    input.click();
  }

  async function handleClearAll() {
    if (!browser) return;

    if (!deleteConfirming) {
      // First tap: enter confirmation mode
      deleteConfirming = true;
      if (deleteConfirmTimer) clearTimeout(deleteConfirmTimer);
      deleteConfirmTimer = setTimeout(() => {
        deleteConfirming = false;
      }, 3000);
      return;
    }

    // Second tap within 3 seconds: actually delete
    deleteConfirming = false;
    if (deleteConfirmTimer) {
      clearTimeout(deleteConfirmTimer);
      deleteConfirmTimer = null;
    }
    const { db } = await import('$lib/db/database');
    await db.attempts.clear();
    await db.sessions.clear();
    await db.spacedRepetition.clear();
  }
</script>

<svelte:head>
  <title>{$t('settings.title')} · {$t('app.name')}</title>
</svelte:head>

{#if loading}
  <div class="loading-container">
    <div class="loading-content">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-text">{$t('common.loading')}</p>
    </div>
  </div>
{:else if settings}
  <section class="settings-page" aria-label={$t('settings.title')}>
    <header class="page-header">
      <h1 class="page-title">{$t('settings.title')}</h1>
    </header>

    <!-- Language -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.language')}</h2>
      <Card>
        <div class="setting-content">
          <ChipGroup
            options={languageOptions.map(o => ({ value: o.value, label: o.label }))}
            selectedValue={settings.language}
            onchange={(value: string) => updateSetting('language', value as Language)}
          />
        </div>
      </Card>
    </section>

    <!-- Text size -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.text_size')}</h2>
      <Card>
        <div class="setting-content">
          <ChipGroup
            options={textSizeOptions.map(o => ({ value: o.value, label: $t(o.labelKey) }))}
            selectedValue={settings.text_size}
            onchange={(value: string) => updateSetting('text_size', value as AppSettings['text_size'])}
          />
        </div>
      </Card>
    </section>

    <!-- Theme -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.theme')}</h2>
      <Card>
        <div class="setting-content">
          <ChipGroup
            options={themeOptions.map(o => ({ value: o.value, label: $t(o.labelKey) }))}
            selectedValue={settings.theme}
            onchange={(value: string) => updateSetting('theme', value as AppSettings['theme'])}
          />
        </div>
      </Card>
    </section>

    <!-- High contrast toggle -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.high_contrast')}</h2>
      <Card>
        <div class="setting-content">
          <div class="toggle-row">
            <button
              class="toggle-switch"
              class:toggle-on={settings.high_contrast}
              onclick={() => updateSetting('high_contrast', !settings!.high_contrast)}
              role="switch"
              aria-checked={settings.high_contrast}
              aria-label={$t('settings.high_contrast')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.high_contrast ? 'Sí' : 'No'}</span>
            </button>
          </div>
        </div>
      </Card>
    </section>

    <!-- Speech recognition toggle -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.speech_recognition')}</h2>
      <Card>
        <div class="setting-content">
          <div class="toggle-row">
            <button
              class="toggle-switch"
              class:toggle-on={settings.speech_enabled}
              onclick={() => updateSetting('speech_enabled', !settings!.speech_enabled)}
              role="switch"
              aria-checked={settings.speech_enabled}
              aria-label={$t('settings.speech_recognition')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.speech_enabled ? 'Sí' : 'No'}</span>
            </button>
          </div>
        </div>
      </Card>
    </section>

    <!-- Speech rate -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.speech_rate')}</h2>
      <Card>
        <div class="setting-content">
          <div class="slider-container">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speech_rate}
              oninput={(e: Event) => updateSetting('speech_rate', parseFloat((e.target as HTMLInputElement).value))}
              class="slider"
              aria-label={$t('settings.speech_rate')}
            />
            <span class="slider-value" aria-atomic="true">{settings.speech_rate.toFixed(1)}x</span>
          </div>
        </div>
      </Card>
    </section>

    <!-- Sound effects -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.sound_effects')}</h2>
      <Card>
        <div class="setting-content">
          <div class="toggle-row">
            <button
              class="toggle-switch"
              class:toggle-on={settings.sound_enabled}
              onclick={() => updateSetting('sound_enabled', !settings!.sound_enabled)}
              role="switch"
              aria-checked={settings.sound_enabled}
              aria-label={$t('settings.sound_effects')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.sound_enabled ? 'Sí' : 'No'}</span>
            </button>
          </div>
        </div>
      </Card>
    </section>

    <!-- Haptic feedback -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.haptic_feedback')}</h2>
      <Card>
        <div class="setting-content">
          <div class="toggle-row">
            <button
              class="toggle-switch"
              class:toggle-on={settings.haptic_enabled}
              onclick={() => updateSetting('haptic_enabled', !settings!.haptic_enabled)}
              role="switch"
              aria-checked={settings.haptic_enabled}
              aria-label={$t('settings.haptic_feedback')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.haptic_enabled ? 'Sí' : 'No'}</span>
            </button>
          </div>
        </div>
      </Card>
    </section>

    <!-- About link -->
    <section class="setting-section">
      <Card>
        <button class="about-link" onclick={() => goto(`${base}/about`)} aria-label={$t('settings.about')}>
          <span>{$t('settings.about')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </Card>
    </section>

    <!-- Data management -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.title')}</h2>
      <div class="data-buttons">
        <Button variant="secondary" fullWidth onclick={handleExport} aria-label={$t('progress.export')}>
          {$t('progress.export')}
        </Button>
        <Button variant="secondary" fullWidth onclick={handleImport} aria-label={$t('progress.import')}>
          {$t('progress.import')}
        </Button>
        <button
          class="delete-data-btn"
          class:confirming={deleteConfirming}
          onclick={handleClearAll}
          aria-label={deleteConfirming ? '¿Seguro? Toca de nuevo' : $t('progress.clear_data')}
        >
          {deleteConfirming ? '⚠️ ¿Seguro? Toca de nuevo' : $t('progress.clear_data')}
        </button>
      </div>
    </section>
  </section>
{/if}

<style>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface-2);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
  }

  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-xl);
  }

  .page-header {
    margin-bottom: var(--space-sm);
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
  }

  .setting-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .setting-label {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-dim);
    padding-left: var(--space-xs);
  }

  .setting-content {
    padding: var(--space-sm);
  }

  /* Toggle row */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Toggle switch button */
  .toggle-switch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-xs);
    min-height: var(--touch-min);
    font-family: var(--font-family);
    touch-action: manipulation;
    -webkit-user-select: none;
    user-select: none;
  }

  .toggle-track {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    background: var(--surface-3);
    border-radius: 14px;
    transition: background var(--transition-fast);
    border: 2px solid var(--border);
    flex-shrink: 0;
  }

  .toggle-on .toggle-track {
    background: var(--primary);
    border-color: var(--primary);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--text-dim);
    transition: transform var(--transition-fast), background var(--transition-fast);
    box-shadow: var(--shadow-sm);
  }

  .toggle-on .toggle-thumb {
    transform: translateX(24px);
    background: #ffffff;
  }

  .toggle-label-text {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-dim);
    min-width: 2ch;
    text-align: center;
  }

  .toggle-on .toggle-label-text {
    color: var(--primary);
  }

  .toggle-switch:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* Slider */
  .slider-container {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .slider {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--surface-3);
    border-radius: 3px;
    outline: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    border: 2px solid var(--surface);
    box-shadow: var(--shadow-sm);
  }

  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    border: 2px solid var(--surface);
  }

  .slider-value {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text);
    min-width: 3ch;
    text-align: right;
  }

  /* About link */
  .about-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    color: var(--text);
    font-size: var(--font-size-base);
    padding: var(--space-md);
    cursor: pointer;
    min-height: var(--touch-min);
  }

  /* Data buttons */
  .data-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* Delete data button with double-tap confirm */
  .delete-data-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--error, #ef4444);
    color: white;
    border: none;
    border-radius: var(--radius-full, 999px);
    font-size: var(--font-size-lg);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }

  .delete-data-btn:active {
    opacity: 0.8;
  }

  .delete-data-btn.confirming {
    animation: flashRed 0.5s ease-in-out infinite alternate;
    background: #b91c1c;
    font-weight: 800;
  }

  @keyframes flashRed {
    0% { background: #b91c1c; }
    100% { background: #ef4444; transform: scale(1.02); }
  }

</style>
