<script lang="ts">
  import { t } from '$lib/i18n';
  import { browser } from '$app/environment';
  import { Card } from '$lib/components/ui';

  const APP_VERSION = '1.1.0';

  const exerciseDescriptions = [
    { key: 'picture_naming', icon: '🖼️', color: '#3b82f6' },
    { key: 'semantic_features', icon: '🧠', color: '#8b5cf6' },
    { key: 'phonological_cueing', icon: '🔊', color: '#06b6d4' },
    { key: 'category_sorting', icon: '📂', color: '#f59e0b' },
    { key: 'generative_naming', icon: '💡', color: '#10b981' },
    { key: 'word_matching', icon: '🔗', color: '#ef4444' },
    { key: 'sentence_completion', icon: '✍️', color: '#6366f1' },
    { key: 'opposites_synonyms', icon: '↔️', color: '#ec4899' }
  ];
</script>

<svelte:head>
  <title>{$t('about.title')} · {$t('app.name')}</title>
</svelte:head>

<section class="about-page">
  <header class="page-header fade-in">
    <h1 class="page-title">{$t('about.title')}</h1>
  </header>

  <!-- What is anomia -->
  <section class="about-section">
    <Card>
      <h2 class="section-heading">{$t('about.what_is_anomia')}</h2>
      <p class="about-text">{$t('about.anomia_description')}</p>
    </Card>
  </section>

  <!-- How exercises help -->
  <section class="about-section">
    <Card>
      <p class="section-heading section-intro">{$t('about.exercises_help')}</p>
      <div class="exercise-list stagger-children">
        {#each exerciseDescriptions as exercise}
          <div class="exercise-item">
            <span class="exercise-emoji" style="background: {exercise.color}20; color: {exercise.color}" aria-hidden="true">{exercise.icon}</span>
            <div class="exercise-info">
              <h3 class="exercise-title">{$t(`exercises.${exercise.key}.name`)}</h3>
              <p class="exercise-desc">{$t(`exercises.${exercise.key}.description`)}</p>
            </div>
          </div>
        {/each}
      </div>
    </Card>
  </section>

  <!-- Version info -->
  <section class="about-section">
    <Card>
      <div class="version-info">
        <span class="version-label">{$t('settings.version')}</span>
        <span class="version-value">v{APP_VERSION}</span>
      </div>
      <div class="developer-info">
        <div class="dev-detail">
          <span class="dev-label">Tecnología</span>
          <span class="dev-value">SvelteKit + PWA</span>
        </div>
        <div class="dev-detail">
          <span class="dev-label">Datos</span>
          <span class="dev-value">IndexedDB (local)</span>
        </div>
        <div class="dev-detail">
          <span class="dev-label">Licencia</span>
          <span class="dev-value">Código abierto</span>
        </div>
      </div>
      <p class="credits-text">
        Hecho con ❤️ para personas con afasia y anomia.
        Desarrollado con SvelteKit y tecnologías web abiertas.
      </p>
    </Card>
  </section>
</section>

<style>
  .about-page {
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

  .about-section {
    /* spacing handled by flex gap */
  }

  .section-heading {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
    margin-bottom: var(--space-md);
  }

  .about-text {
    font-size: var(--font-size-base);
    color: var(--text-dim);
    line-height: 1.7;
  }

  .section-intro {
    color: var(--text-dim);
    font-weight: 400;
    font-size: var(--font-size-base);
    line-height: 1.6;
  }

  /* Exercise list */
  .exercise-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .exercise-item {
    display: flex;
    gap: var(--space-md);
    align-items: flex-start;
  }

  .exercise-emoji {
    font-size: 1.75rem;
    line-height: 1;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    text-align: center;
  }

  .exercise-info {
    flex: 1;
    min-width: 0;
  }

  .exercise-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    margin-bottom: 2px;
  }

  .exercise-desc {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    line-height: 1.5;
  }

  /* Version */
  .version-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--border);
  }

  .version-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .version-value {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    background: var(--surface-2);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
  }

  /* Developer info */
  .developer-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--border);
  }

  .dev-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dev-label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dev-value {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-dim);
  }

  .credits-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    line-height: 1.6;
    text-align: center;
  }
</style>
