<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, setSetting, initDefaults } from '$lib/db';
  import { Card, Button, ChipGroup, Modal, Toast } from '$lib/components/ui';
  import { applyAppearance } from '$lib/utils/appearance';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import { LANGUAGES, type Language, type AppSettings } from '$lib/types';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { speechLangFor } from '$lib/utils/tts.svelte';

  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);
  let showDeleteModal = $state(false);

  // Toast state
  interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info'; }
  let toasts = $state<ToastItem[]>([]);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    // Replace any existing toasts so they never overlap at the same position
    const id = Date.now() + Math.random();
    toasts = [{ id, message, type }];
  }
  function dismissToast(id: number) {
    toasts = toasts.filter(t => t.id !== id);
  }

  // TTS preview
  let previewSynthesis: SpeechSynthesisService | null = $state(null);
  let isPreviewing = $state(false);

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

  onMount(() => {
    loadSettings();
    if (SpeechSynthesisService.isSupported()) {
      previewSynthesis = new SpeechSynthesisService();
    }
    return () => previewSynthesis?.destroy();
  });

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    await setSetting(key, value);

    const updated = { ...settings, [key]: value };
    settings = updated;

    // Apply appearance changes live (theme / text size / high contrast).
    if (key === 'theme' || key === 'text_size' || key === 'high_contrast') {
      applyAppearance(updated);
    }

    // Apply UI language changes immediately
    if (key === 'ui_language') {
      locale.set(value as Language);
    }
  }

  async function handleExport() {
    if (!browser) return;
    try {
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
      showToast($t('settings.export_success'));
    } catch (e) {
      console.error('Export failed:', e);
      showToast($t('settings.export_error'), 'error');
    }
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

        // Validate that the file has expected keys with correct types
        if (!Array.isArray(data.attempts) || !Array.isArray(data.sessions) || !Array.isArray(data.spacedRepetition)) {
          showToast($t('settings.import_invalid'), 'error');
          return;
        }

        const { db } = await import('$lib/db/database');

        if (Array.isArray(data.settings)) {
          for (const s of data.settings) {
            await db.settings.put(s);
          }
        }
        await db.attempts.bulkPut(data.attempts);
        await db.sessions.bulkPut(data.sessions);
        await db.spacedRepetition.bulkPut(data.spacedRepetition);

        // Re-run defaults so any new settings (e.g. ui_language) missing from
        // the imported file get seeded — the resolver copies content language
        // as the UI language default for backward compatibility.
        await initDefaults();
        await loadSettings();

        showToast($t('settings.import_success', { count: data.sessions.length }));
      } catch (e) {
        console.error('Import failed:', e);
        showToast($t('settings.import_error'), 'error');
      }
    };
    input.click();
  }

  async function handleClearAll() {
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!browser) return;
    showDeleteModal = false;
    try {
      const { db } = await import('$lib/db/database');
      await db.attempts.clear();
      await db.sessions.clear();
      await db.spacedRepetition.clear();
      showToast($t('settings.data_deleted'));
    } catch (e) {
      console.error('Delete failed:', e);
      showToast($t('settings.delete_error'), 'error');
    }
  }

  function previewSpeech() {
    if (!previewSynthesis || !settings) return;
    previewSynthesis.setRate(settings.speech_rate);
    isPreviewing = true;
    previewSynthesis.speak($t('settings.voice_sample'), speechLangFor(settings.ui_language)).finally(() => {
      isPreviewing = false;
    });
  }

  async function restartOnboarding() {
    await setSetting('onboarding_complete', false);
    await goto(`${base}/onboarding`, { replaceState: true });
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

    <div class="settings-cards">
    <!-- Card 0: UI Language (first — elderly users need it findable) -->
    <Card>
      <div class="card-section">
        <h2 class="card-heading">{$t('settings.ui_language')}</h2>

        <div class="lang-grid" role="listbox" aria-label={$t('settings.ui_language')}>
          {#each LANGUAGES as opt (opt.value)}
            <button
              class="lang-btn"
              class:lang-btn-active={settings.ui_language === opt.value}
              role="option"
              aria-selected={settings.ui_language === opt.value}
              onclick={() => updateSetting('ui_language', opt.value)}
            >
              {opt.label}
            </button>
          {/each}
        </div>

        {#if settings.ui_language !== settings.language}
          <p class="content-lang-note">{$t('settings.words_spanish_only')}</p>
        {/if}
      </div>
    </Card>

    <!-- Card 1: Appearance -->
    <Card>
      <div class="card-section">
        <h2 class="card-heading">{$t('settings.appearance')}</h2>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.text_size')}</span>
          <div class="setting-control">
            <ChipGroup
              options={textSizeOptions.map(o => ({ value: o.value, label: $t(o.labelKey) }))}
              selectedValue={settings.text_size}
              onchange={(value: string) => updateSetting('text_size', value as AppSettings['text_size'])}
            />
          </div>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.theme')}</span>
          <div class="setting-control">
            <ChipGroup
              options={themeOptions.map(o => ({ value: o.value, label: $t(o.labelKey) }))}
              selectedValue={settings.theme}
              onchange={(value: string) => updateSetting('theme', value as AppSettings['theme'])}
            />
          </div>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.high_contrast')}</span>
          <div class="setting-control">
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
              <span class="toggle-label-text">{settings.high_contrast ? $t('common.yes') : $t('common.no')}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Card 2: Audio & voice -->
    <Card>
      <div class="card-section">
        <h2 class="card-heading">{$t('settings.audio_voice')}</h2>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.sound_effects')}</span>
          <div class="setting-control">
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
              <span class="toggle-label-text">{settings.sound_enabled ? $t('common.yes') : $t('common.no')}</span>
            </button>
          </div>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.speak_buttons')}</span>
          <div class="setting-control">
            <button
              class="toggle-switch"
              class:toggle-on={settings.speak_buttons_enabled}
              onclick={() => updateSetting('speak_buttons_enabled', !settings!.speak_buttons_enabled)}
              role="switch"
              aria-checked={settings.speak_buttons_enabled}
              aria-label={$t('settings.speak_buttons')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.speak_buttons_enabled ? $t('common.yes') : $t('common.no')}</span>
            </button>
          </div>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.speech_rate')}</span>
          <div class="setting-control slider-control">
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
          <button
            class="preview-btn"
            onclick={previewSpeech}
            disabled={isPreviewing || !previewSynthesis}
            aria-label={$t('settings.preview_voice')}
          >
            {isPreviewing ? $t('settings.playing') : $t('settings.preview_voice')}
          </button>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.haptic_feedback')}</span>
          <div class="setting-control">
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
              <span class="toggle-label-text">{settings.haptic_enabled ? $t('common.yes') : $t('common.no')}</span>
            </button>
          </div>
        </div>

        <div class="setting-divider"></div>

        <div class="setting-row">
          <span class="setting-name">{$t('settings.timer_enabled')}</span>
          <div class="setting-control">
            <button
              class="toggle-switch"
              class:toggle-on={settings.timer_enabled}
              onclick={() => updateSetting('timer_enabled', !settings!.timer_enabled)}
              role="switch"
              aria-checked={settings.timer_enabled}
              aria-label={$t('settings.timer_enabled')}
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label-text">{settings.timer_enabled ? $t('common.yes') : $t('common.no')}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Card 3: Data -->
    <Card>
      <div class="card-section">
        <h2 class="card-heading">{$t('settings.data')}</h2>

        <div class="data-buttons">
          <Button variant="secondary" fullWidth onclick={handleExport} aria-label={$t('progress.export')}>
            {$t('progress.export')}
          </Button>
          <Button variant="secondary" fullWidth onclick={handleImport} aria-label={$t('progress.import')}>
            {$t('progress.import')}
          </Button>
          <button
            class="delete-data-btn"
            onclick={handleClearAll}
            aria-label={$t('progress.clear_data')}
          >
            {$t('progress.clear_data')}
          </button>
        </div>
      </div>
    </Card>

    <!-- Card 4: About -->
    <Card>
      <div class="card-section">
        <button class="about-link" onclick={() => goto(`${base}/about`)} aria-label={$t('settings.about')}>
          <span>{$t('settings.about')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div class="setting-divider"></div>

        <button class="about-link" onclick={restartOnboarding} aria-label={$t('onboarding.restart')}>
          <span>{$t('onboarding.restart')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </Card>
    </div>
  </section>
{/if}

<!-- Delete confirmation modal -->
<Modal open={showDeleteModal} title={$t('settings.delete_title')} onclose={() => { showDeleteModal = false; }}>
  <div class="modal-body">
    <p class="modal-message">{$t('settings.delete_body')}</p>
    <div class="modal-buttons">
      <Button variant="secondary" size="md" onclick={() => { showDeleteModal = false; }}>
        {$t('common.cancel')}
      </Button>
      <Button variant="danger" size="md" onclick={confirmDelete}>
        {$t('settings.delete_confirm')}
      </Button>
    </div>
  </div>
</Modal>

<!-- Toasts -->
{#each toasts as toast (toast.id)}
  <Toast message={toast.message} type={toast.type} ondismiss={() => dismissToast(toast.id)} />
{/each}

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

  /* Card section layout */
  .card-section {
    padding: var(--space-sm);
  }

  .card-heading {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text);
    margin: 0 0 var(--space-md) 0;
    padding: 0 var(--space-xs);
  }

  /* Language selector */
  .lang-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
    padding: 0 var(--space-xs);
  }

  .lang-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface-2);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-family);
    transition: border-color var(--transition-fast), background var(--transition-fast);
    touch-action: manipulation;
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

  .content-lang-note {
    margin: var(--space-sm) var(--space-xs) 0;
    padding: var(--space-sm);
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    line-height: 1.4;
  }

  /* Setting rows */
  .setting-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-xs);
  }

  .setting-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
  }

  .setting-control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .setting-divider {
    height: 1px;
    background: var(--border);
    margin: var(--space-xs) var(--space-xs);
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
  .slider-control {
    width: 100%;
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

  /* Speech preview button */
  .preview-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-xs) var(--space-lg);
    background: var(--primary);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-base);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    align-self: flex-start;
    transition: opacity var(--transition-fast);
    touch-action: manipulation;
  }

  .preview-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .preview-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
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
    padding: var(--space-md) var(--space-xs);
    cursor: pointer;
    min-height: var(--touch-min);
    font-family: var(--font-family);
  }

  /* Data buttons */
  .data-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: 0 var(--space-xs);
  }

  /* Delete data button */
  .delete-data-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--error);
    color: white;
    border: none;
    border-radius: var(--radius-full);
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

  .delete-data-btn:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: 2px;
  }

  /* Modal */
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .modal-message {
    font-size: var(--font-size-base);
    color: var(--text-dim);
    line-height: 1.5;
    margin: 0;
  }

  .modal-buttons {
    display: flex;
    gap: var(--space-sm);
  }

  .modal-buttons > :global(*) {
    flex: 1;
  }

  /* Tablet: bigger targets, wider toggles */
  @media (min-width: 768px) {
    .page-title {
      font-size: var(--font-size-3xl);
    }

    .card-heading {
      font-size: var(--font-size-xl);
    }

    .setting-name {
      font-size: var(--font-size-lg);
    }

    .toggle-track {
      width: 64px;
      height: 36px;
      border-radius: 18px;
    }

    .toggle-thumb {
      width: 28px;
      height: 28px;
    }

    .toggle-on .toggle-thumb {
      transform: translateX(28px);
    }

    .toggle-label-text {
      font-size: var(--font-size-lg);
    }

    .slider {
      height: 8px;
    }

    .slider::-webkit-slider-thumb {
      width: 28px;
      height: 28px;
    }

    .slider::-moz-range-thumb {
      width: 28px;
      height: 28px;
    }

    .slider-value {
      font-size: var(--font-size-xl);
    }

    .preview-btn {
      font-size: var(--font-size-lg);
    }

    .about-link {
      font-size: var(--font-size-lg);
    }
  }

  /* Landscape tablet: 2-column card grid */
  @media (min-width: 768px) and (orientation: landscape) {
    .settings-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-lg);
      align-items: start;
    }

    /* Language and data sections span full width */
    .settings-cards > :first-child,
    .settings-cards > :nth-last-child(2) {
      grid-column: 1 / -1;
    }
  }
</style>
