<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, setSetting } from '$lib/db';
  import { Card, Button, ChipGroup, Modal } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import type { Language, AppSettings } from '$lib/types';

  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let showClearModal = $state(false);

  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'ca', label: 'Català' },
    { value: 'eu', label: 'Euskara' },
    { value: 'en', label: 'English' }
  ];

  const textSizeOptions = [
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

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    await setSetting(key, value);

    // Update local state
    settings = { ...settings!, [key]: value };

    // Apply theme changes immediately
    if (key === 'theme') {
      const root = document.querySelector('.app-shell');
      if (root) {
        root.classList.toggle('light-theme', value === 'light');
      }
    }

    // Apply text size changes immediately
    if (key === 'text_size') {
      const root = document.querySelector('.app-shell');
      if (root) {
        root.classList.remove('text-size-large', 'text-size-xlarge');
        if (value === 'large') root.classList.add('text-size-large');
        else if (value === 'xlarge') root.classList.add('text-size-xlarge');
      }
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
    const { db } = await import('$lib/db/database');
    await db.attempts.clear();
    await db.sessions.clear();
    await db.spacedRepetition.clear();
    showClearModal = false;
  }
</script>

<svelte:head>
  <title>{$t('settings.title')} · {$t('app.name')}</title>
</svelte:head>

{#if loading}
  <div class="loading-container">
    <p class="loading-text">{$t('common.loading')}</p>
  </div>
{:else if settings}
  <section class="settings-page">
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
            selected={settings.language}
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
            selected={settings.text_size}
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
            selected={settings.theme}
            onchange={(value: string) => updateSetting('theme', value as AppSettings['theme'])}
          />
        </div>
      </Card>
    </section>

    <!-- Speech recognition toggle -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.speech_recognition')}</h2>
      <Card>
        <div class="setting-content">
          <div class="toggle-row">
            <span class="toggle-status">{settings.speech_enabled ? '✓' : '✗'}</span>
            <Button
              variant={settings.speech_enabled ? 'primary' : 'secondary'}
              onclick={() => updateSetting('speech_enabled', !settings!.speech_enabled)}
            >
              {settings.speech_enabled ? $t('common.finish') : $t('common.start')}
            </Button>
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
            <span class="slider-value">{settings.speech_rate.toFixed(1)}x</span>
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
            <span class="toggle-status">{settings.sound_enabled ? '✓' : '✗'}</span>
            <Button
              variant={settings.sound_enabled ? 'primary' : 'secondary'}
              onclick={() => updateSetting('sound_enabled', !settings!.sound_enabled)}
            >
              {settings.sound_enabled ? $t('common.finish') : $t('common.start')}
            </Button>
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
            <span class="toggle-status">{settings.haptic_enabled ? '✓' : '✗'}</span>
            <Button
              variant={settings.haptic_enabled ? 'primary' : 'secondary'}
              onclick={() => updateSetting('haptic_enabled', !settings!.haptic_enabled)}
            >
              {settings.haptic_enabled ? $t('common.finish') : $t('common.start')}
            </Button>
          </div>
        </div>
      </Card>
    </section>

    <!-- About link -->
    <section class="setting-section">
      <Card>
        <button class="about-link" onclick={() => goto('/about')}>
          <span>{$t('settings.about')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </Card>
    </section>

    <!-- Data management -->
    <section class="setting-section">
      <h2 class="setting-label">{$t('settings.title')}</h2>
      <div class="data-buttons">
        <Button variant="secondary" fullWidth onclick={handleExport}>
          {$t('progress.export')}
        </Button>
        <Button variant="secondary" fullWidth onclick={handleImport}>
          {$t('progress.import')}
        </Button>
        <Button variant="danger" fullWidth onclick={() => (showClearModal = true)}>
          {$t('progress.clear_data')}
        </Button>
      </div>
    </section>
  </section>
{/if}

{#if showClearModal}
  <Modal onclose={() => (showClearModal = false)}>
    <div class="modal-content">
      <p class="modal-text">{$t('progress.confirm_clear')}</p>
      <div class="modal-actions">
        <Button variant="secondary" onclick={() => (showClearModal = false)}>
          {$t('common.cancel')}
        </Button>
        <Button variant="danger" onclick={handleClearAll}>
          {$t('progress.clear_data')}
        </Button>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
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
    justify-content: space-between;
  }

  .toggle-status {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text);
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

  /* Modal */
  .modal-content {
    text-align: center;
    padding: var(--space-lg);
  }

  .modal-text {
    font-size: var(--font-size-lg);
    color: var(--text);
    margin-bottom: var(--space-lg);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
  }
</style>
