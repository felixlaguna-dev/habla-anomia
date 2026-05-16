<script lang="ts">
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAllSettings, startSession, endSession } from '$lib/db';
  import { generateSession } from '$lib/engine/session-generator';
  import { browser } from '$app/environment';
  import type { ExerciseType, Language, Word, AppSettings } from '$lib/types';

  import {
    PictureNamingExercise,
    SemanticFeaturesExercise,
    PhonologicalCueingExercise,
    CategorySortingExercise,
    GenerativeNamingExercise,
    WordMatchingExercise,
    SentenceCompletionExercise,
    OppositesSynonymsExercise
  } from '$lib/components/exercises';

  let exerciseType = $derived($page.params.type as ExerciseType);
  let settings = $state<AppSettings | null>(null);
  let words = $state<Word[]>([]);
  let loading = $state(true);
  let sessionId = $state<number | null>(null);
  let showResults = $state(false);
  let results = $state({ correct: 0, total: 0, accuracy: 0 });

  // Resolve component in script block, not template
  let ExerciseComponent = $derived.by(() => {
    const map: Record<string, any> = {
      'picture-naming': PictureNamingExercise,
      'semantic-features': SemanticFeaturesExercise,
      'phonological-cueing': PhonologicalCueingExercise,
      'category-sorting': CategorySortingExercise,
      'generative-naming': GenerativeNamingExercise,
      'word-matching': WordMatchingExercise,
      'sentence-completion': SentenceCompletionExercise,
      'opposites-synonyms': OppositesSynonymsExercise
    };
    return map[exerciseType] || null;
  });

  let titleKey = $derived(
    `exercises.${exerciseType.replace(/-/g, '_')}.name`
  );

  async function initExercise() {
    if (!browser) return;
    const s = await getAllSettings();
    settings = s;

    const plan = await generateSession(s.language, exerciseType, 10);
    words = plan.words;

    const id = await startSession(s.language);
    sessionId = id;

    loading = false;
  }

  onMount(initExercise);

  async function handleComplete(e: { score: number; total: number }) {
    const { score: correct, total } = e;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    results = { correct, total, accuracy };
    showResults = true;

    if (sessionId !== null) {
      await endSession(sessionId, accuracy, total);
    }
  }

  function handleCloseResults() {
    showResults = false;
    goto('/exercises');
  }
</script>

<svelte:head>
  <title>{$t(titleKey)} · {$t('app.name')}</title>
</svelte:head>

<section class="exercise-page">
  <header class="exercise-header">
    <button class="back-btn" onclick={() => goto('/exercises')} aria-label={$t('common.back')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="header-text">
      <h1 class="exercise-title">{$t(titleKey)}</h1>
    </div>
    <div class="header-spacer"></div>
  </header>

  {#if loading}
    <div class="loading-container">
      <p class="loading-text">{$t('common.loading')}</p>
    </div>
  {:else if words.length > 0 && ExerciseComponent}
    <div class="exercise-content">
      <ExerciseComponent
        {words}
        language={settings?.language || 'es'}
        oncomplete={handleComplete}
      />
    </div>
  {:else}
    <div class="loading-container">
      <p class="error-text">No words available for this exercise.</p>
    </div>
  {/if}
</section>

{#if showResults}
  <div class="results-overlay" role="dialog" aria-modal="true" aria-label={$t('feedback.exercise_complete')}>
    <div class="results-card">
      <h2 class="results-title">{$t('feedback.exercise_complete')}</h2>

      <div class="results-score">
        <span class="score-value">{results.accuracy}%</span>
        <span class="score-label">{$t('feedback.score')}</span>
      </div>

      <div class="results-detail">
        <span>{$t('feedback.correct')}: {results.correct} / {results.total}</span>
      </div>

      <button class="results-close-btn" onclick={handleCloseResults}>
        {$t('common.finish')}
      </button>
    </div>
  </div>
{/if}

<style>
  .exercise-page {
    padding-bottom: var(--space-xl);
  }

  .exercise-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--touch-min);
    height: var(--touch-min);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }

  .back-btn:active {
    background: var(--surface-2);
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .exercise-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-spacer {
    width: var(--touch-min);
    flex-shrink: 0;
  }

  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
  }

  .loading-text {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
  }

  .error-text {
    color: var(--error);
    text-align: center;
  }

  .exercise-content {
    margin-top: var(--space-md);
  }

  .results-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: var(--space-lg);
  }

  .results-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-2xl);
    text-align: center;
    max-width: 360px;
    width: 100%;
    box-shadow: var(--shadow-lg);
  }

  .results-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
    margin-bottom: var(--space-lg);
  }

  .results-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
  }

  .score-value {
    font-size: var(--font-size-4xl);
    font-weight: 700;
    color: var(--primary);
  }

  .score-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .results-detail {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-xl);
  }

  .results-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-lg);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .results-close-btn:active {
    background: var(--primary-hover);
  }
</style>
