<script lang="ts">
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { getAllSettings } from '$lib/db';
  import type { ExerciseType, AppSettings } from '$lib/types';

  const exerciseTypes: ExerciseType[] = [
    'picture-naming',
    'semantic-features',
    'phonological-cueing',
    'category-sorting',
    'generative-naming',
    'word-matching',
    'sentence-completion',
    'opposites-synonyms'
  ];

  // Map exercise type to i18n key base
  function getI18nKey(type: ExerciseType): string {
    return `exercises.${type.replace(/-/g, '_')}`;
  }

  // SVG icon paths for each exercise type
  const exerciseIcons: Record<ExerciseType, string> = {
    'picture-naming': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    'semantic-features': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    'phonological-cueing': 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
    'category-sorting': 'M4 6h16M4 10h16M4 14h16M4 18h16',
    'generative-naming': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    'word-matching': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    'sentence-completion': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    'opposites-synonyms': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
  };
</script>

<svelte:head>
  <title>{$t('exercises.title')} · {$t('app.name')}</title>
</svelte:head>

<section class="exercises-page">
  <header class="page-header">
    <h1 class="page-title">{$t('exercises.title')}</h1>
    <p class="page-subtitle">{$t('exercises.select_exercise')}</p>
  </header>

  <div class="exercise-grid">
    {#each exerciseTypes as type}
      {@const i18nBase = getI18nKey(type)}
      <button
        class="exercise-card-btn"
        onclick={() => goto(`/exercises/${type}`)}
        aria-label={$t(`${i18nBase}.name`)}
      >
        <Card>
          <div class="exercise-card-content">
            <div class="exercise-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d={exerciseIcons[type]}/>
              </svg>
            </div>
            <h2 class="exercise-name">{$t(`${i18nBase}.name`)}</h2>
            <p class="exercise-desc">{$t(`${i18nBase}.description`)}</p>
          </div>
        </Card>
      </button>
    {/each}
  </div>
</section>

<style>
  .exercises-page {
    padding-bottom: var(--space-xl);
  }

  .page-header {
    margin-bottom: var(--space-lg);
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .page-subtitle {
    color: var(--text-dim);
    font-size: var(--font-size-base);
  }

  .exercise-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .exercise-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .exercise-card-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    color: inherit;
    width: 100%;
    border-radius: var(--radius-md);
    transition: transform var(--transition-fast);
  }

  .exercise-card-btn:active {
    transform: scale(0.97);
  }

  .exercise-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
  }

  .exercise-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    color: var(--primary);
  }

  .exercise-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    line-height: 1.3;
  }

  .exercise-desc {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    line-height: 1.4;
  }
</style>
