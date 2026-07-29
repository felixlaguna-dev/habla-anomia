<script lang="ts">
  import { t } from '$lib/i18n';
  import { Card, ExerciseIcon } from '$lib/components/ui';
  import { EXERCISE_REGISTRY } from '$lib/exercises/registry';

  const APP_VERSION: string = __APP_VERSION__ ?? '0.0.0';
  const GIT_HASH: string = __APP_GIT_HASH__ ?? 'dev';

  const devDetails = $derived([
    { id: 'technology', label: $t('about.technology'), value: $t('about.technology_value') },
    { id: 'data', label: $t('about.data'), value: $t('about.data_value') },
    { id: 'license', label: $t('about.license'), value: $t('about.license_value') },
  ]);
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
        {#each EXERCISE_REGISTRY as exercise (exercise.type)}
          <div class="exercise-item">
            <span class="exercise-icon-box" aria-hidden="true">
              <ExerciseIcon meta={exercise} size={28} />
            </span>
            <div class="exercise-info">
              <h3 class="exercise-title">{$t(`exercises.${exercise.i18nKey}.name`)}</h3>
              <p class="exercise-desc">{$t(`exercises.${exercise.i18nKey}.description`)}</p>
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
        <span class="version-label">{$t('about.version')}</span>
        <span class="version-value">v{APP_VERSION} ({GIT_HASH})</span>
      </div>
      <div class="developer-info">
        {#each devDetails as detail (detail.id)}
          <div class="dev-detail">
            <span class="dev-label">{detail.label}</span>
            <span class="dev-value">{detail.value}</span>
          </div>
        {/each}
      </div>
      <p class="credits-text">{$t('about.credits')}</p>
      <p class="credits-text privacy-text">{$t('about.privacy_note')}</p>
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

  .exercise-icon-box {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
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

  .privacy-text {
    color: var(--text-dim);
    margin-top: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface-2);
    border-radius: var(--radius-md);
  }
</style>
