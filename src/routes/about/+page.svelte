<script lang="ts">
  import { t } from '$lib/i18n';
  import { browser } from '$app/environment';
  import { Card } from '$lib/components/ui';

  const APP_VERSION = '1.0.0';

  const exerciseDescriptions = [
    { key: 'picture_naming', icon: '🖼️' },
    { key: 'semantic_features', icon: '🧠' },
    { key: 'phonological_cueing', icon: '🔊' },
    { key: 'category_sorting', icon: '📂' },
    { key: 'generative_naming', icon: '💡' },
    { key: 'word_matching', icon: '🔗' },
    { key: 'sentence_completion', icon: '✍️' },
    { key: 'opposites_synonyms', icon: '↔️' }
  ];
</script>

<svelte:head>
  <title>{$t('about.title')} · {$t('app.name')}</title>
</svelte:head>

<section class="about-page">
  <header class="page-header">
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
      <h2 class="section-heading">{$t('about.exercises_help')}</h2>
      <div class="exercise-list">
        {#each exerciseDescriptions as exercise}
          <div class="exercise-item">
            <span class="exercise-emoji" aria-hidden="true">{exercise.icon}</span>
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
        <span class="version-value">{APP_VERSION}</span>
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
    width: 40px;
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

  .credits-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    line-height: 1.6;
    text-align: center;
  }
</style>
