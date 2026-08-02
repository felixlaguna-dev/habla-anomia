<script lang="ts">
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getAllSettings } from '$lib/db/settings';
  import { awaitSeedReady } from '$lib/db/words';
  import { getTodaysFailures } from '$lib/db/attempts';
  import { db } from '$lib/db/database';
  import { getWordCategories, type Word, type Language, type ExerciseType, type Category } from '$lib/types';
  import { EXERCISE_REGISTRY, type ExerciseMeta } from '$lib/exercises/registry';
  import { EXERCISE_COMPONENTS } from '$lib/components/exercises';
  import { ExerciseIcon, Spinner } from '$lib/components/ui';
  import { playCompleteFeedback } from '$lib/utils/feedback';
  import { browser } from '$app/environment';

  // --- Types ---
  interface FailureGroup {
    type: ExerciseType;
    meta: ExerciseMeta;
    words: Word[];
    remainingWords: Word[];
    category?: Category;
  }

  type Phase = 'loading' | 'exercising' | 'summary' | 'empty';

  // --- State ---
  let phase = $state<Phase>('loading');
  let groups = $state<FailureGroup[]>([]);
  let currentGroupIndex = $state(0);
  let settings = $state<Awaited<ReturnType<typeof getAllSettings>> | null>(null);
  let allWords = $state<Word[]>([]);

  // --- Derived ---
  let currentGroup = $derived(groups[currentGroupIndex]);
  let exerciseMeta = $derived(currentGroup?.meta);

  let titleKey = $derived(
    exerciseMeta ? `exercises.${exerciseMeta.i18nKey}.name` : 'review.title'
  );

  let ExerciseComponent = $derived(currentGroup ? EXERCISE_COMPONENTS[currentGroup.type] : null);

  let cumulativeCleared = $state(0);

  let totalStarted = $derived(groups.reduce((sum, g) => sum + g.words.length, 0));
  let totalRemaining = $derived(groups.reduce((sum, g) => sum + g.remainingWords.length, 0));
  let totalCleared = $derived(cumulativeCleared + (totalStarted - totalRemaining));
  let overallProgress = $derived(
    groups.length > 0
      ? Math.round(((currentGroupIndex + 1) / groups.length) * 100)
      : 0
  );

  // --- Init ---
  onMount(() => {
    if (!browser) return;
    let destroyed = false;

    (async () => {
      try {
        await awaitSeedReady();
        if (destroyed) return;
        settings = await getAllSettings();
        if (destroyed) return;

        // allWords and failures query independent tables — fan out
        const [words, failures] = await Promise.all([
          db.words.where('language').equals(settings.language).toArray(),
          getTodaysFailures(settings.language)
        ]);
        if (destroyed) return;
        allWords = words;

        if (failures.size === 0) {
          phase = 'empty';
          return;
        }

        const built = buildGroups(failures);
        if (built.length === 0) {
          phase = 'empty';
          return;
        }

        groups = built;
        currentGroupIndex = 0;
        phase = 'exercising';
      } catch (e) {
        if (!destroyed) console.warn('Failed to load failures:', e);
      }
    })();

    return () => { destroyed = true; };
  });

  /**
   * Convert the failures map into ordered FailureGroups, handling exercise-
   * specific requirements:
   * - generative-naming: split by category (the exercise shows one category prompt)
   * - category-sorting: skip if < 2 categories among the failed words
   * Groups follow EXERCISE_REGISTRY order for a predictable sequence.
   */
  function buildGroups(failures: Map<ExerciseType, Word[]>): FailureGroup[] {
    const result: FailureGroup[] = [];
    for (const meta of EXERCISE_REGISTRY) {
      const words = failures.get(meta.type);
      if (!words || words.length === 0) continue;

      if (meta.type === 'generative-naming') {
        // Split by first category so each mini-session has a coherent prompt
        const byCat = new Map<Category, Word[]>();
        for (const word of words) {
          const cat = getWordCategories(word)[0];
          if (!cat) continue;
          const arr = byCat.get(cat) ?? [];
          arr.push(word);
          byCat.set(cat, arr);
        }
        for (const [cat, catWords] of byCat) {
          result.push({ type: meta.type, meta, words: catWords, remainingWords: [], category: cat });
        }
      } else if (meta.type === 'category-sorting') {
        const cats = new Set(words.flatMap(w => getWordCategories(w)));
        if (cats.size >= 2) {
          result.push({ type: meta.type, meta, words, remainingWords: [] });
        }
      } else {
        result.push({ type: meta.type, meta, words, remainingWords: [] });
      }
    }
    return result;
  }

  // --- Completion handling ---
  function handleExerciseComplete(e: {
    score: number;
    total: number;
    details?: Array<{ word: Word; correct: boolean }>;
  }) {
    const incorrect = e.details?.filter(d => !d.correct).map(d => d.word) ?? [];
    groups[currentGroupIndex].remainingWords = incorrect;

    const nextIndex = currentGroupIndex + 1;
    if (nextIndex >= groups.length) {
      playCompleteFeedback();
      phase = 'summary';
    } else {
      currentGroupIndex = nextIndex;
    }
  }

  function handleRetryRemaining() {
    // Accumulate words cleared this round before rebuilding groups
    cumulativeCleared += totalStarted - totalRemaining;
    groups = groups
      .filter(g => g.remainingWords.length > 0)
      .map(g => ({ ...g, words: g.remainingWords, remainingWords: [] }));
    currentGroupIndex = 0;
    phase = 'exercising';
  }

  function goBack() {
    goto(`${base}/`);
  }
</script>

<svelte:head>
  <title>{$t('review.title')} · {$t('app.name')}</title>
</svelte:head>

<section class="review-page">
  {#if phase === 'loading'}
    <Spinner label={$t('common.loading')} />

  {:else if phase === 'empty'}
    <div class="empty-state">
      <span class="empty-icon" aria-hidden="true">✅</span>
      <p class="empty-message">{$t('review.no_failures')}</p>
      <button class="primary-btn" onclick={goBack}>
        {$t('review.back_home')}
      </button>
    </div>

  {:else if phase === 'exercising' && currentGroup && ExerciseComponent}
    <header class="review-header">
      <button class="back-btn" onclick={goBack} aria-label={$t('common.back')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="header-text">
        {#if exerciseMeta}
          <span class="title-icon" aria-hidden="true">
            <ExerciseIcon meta={exerciseMeta} size={22} />
          </span>
        {/if}
        <div class="header-titles">
          <h1 class="review-title-heading" tabindex="-1">{$t(titleKey)}</h1>
          <span class="group-progress">
            {$t('review.group_progress', {
              current: String(currentGroupIndex + 1),
              total: String(groups.length)
            })}
          </span>
        </div>
      </div>
      <div class="header-spacer"></div>
    </header>

    <!-- Overall progress bar across all groups -->
    <div class="overall-progress" role="progressbar" aria-valuenow={overallProgress} aria-valuemin="0" aria-valuemax="100">
      <div class="overall-progress-bar" style="width: {overallProgress}%"></div>
    </div>

    <div class="exercise-content slide-up">
      {#key currentGroup.words}
        <ExerciseComponent
          words={currentGroup.words}
          {allWords}
          language={settings?.language || 'es'}
          category={currentGroup.category}
          speechRate={settings?.speech_rate ?? 0.8}
          timerEnabled={settings?.timer_enabled ?? false}
          speakButtonsEnabled={settings?.speak_buttons_enabled ?? true}
          oncomplete={handleExerciseComplete}
          onrestart={() => {}}
        />
      {/key}
    </div>

  {:else if phase === 'summary'}
    <div class="summary-overlay" role="dialog" aria-modal="true" aria-label={$t('review.title')}>
      <div class="summary-card scale-in">
        {#if totalRemaining === 0}
          <div class="celebration-emoji" aria-hidden="true">🎉</div>
          <h2 class="summary-title">{$t('review.all_cleared')}</h2>
          <div class="summary-score">
            <span class="score-value" style="color: var(--success)">
              {totalCleared}
            </span>
            <span class="score-label">{$t('review.cleared', { count: String(totalCleared) })}</span>
          </div>
        {:else}
          <h2 class="summary-title">{$t('review.title')}</h2>
          <div class="summary-stats">
            <div class="stat-row">
              <span class="stat-icon" aria-hidden="true">✅</span>
              <span>{$t('review.cleared', { count: String(totalCleared) })}</span>
            </div>
            <div class="stat-row">
              <span class="stat-icon" aria-hidden="true">📌</span>
              <span>{$t('review.remaining', { count: String(totalRemaining) })}</span>
            </div>
          </div>
          <button class="primary-btn retry-btn" onclick={handleRetryRemaining}>
            🔁 {$t('review.retry_remaining', { count: String(totalRemaining) })}
          </button>
        {/if}

        <button class="secondary-btn" onclick={goBack}>
          {$t('common.finish')}
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .review-page {
    padding-bottom: var(--space-xl);
    min-height: 50vh;
  }

  .review-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
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
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .title-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .review-title-heading {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
    margin: 0;
    min-width: 0;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    outline: none;
  }

  .group-progress {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    font-weight: 500;
  }

  .header-spacer {
    width: var(--touch-min);
    flex-shrink: 0;
  }

  .overall-progress {
    height: 4px;
    background: var(--surface-2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: var(--space-md);
  }

  .overall-progress-bar {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: width var(--transition-normal, 300ms) ease;
  }

  .exercise-content {
    margin-top: var(--space-sm);
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-2xl);
    text-align: center;
    min-height: 40vh;
  }

  .empty-icon {
    font-size: 3rem;
    line-height: 1;
  }

  .empty-message {
    color: var(--text);
    font-size: var(--font-size-xl);
    font-weight: 700;
    line-height: 1.5;
  }

  /* Summary overlay */
  .summary-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: var(--space-lg);
    overflow-y: auto;
  }

  .summary-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-2xl);
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .celebration-emoji {
    font-size: 4rem;
    line-height: 1;
  }

  .summary-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
  }

  .summary-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  .score-value {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
  }

  .score-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .summary-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    text-align: left;
    width: 100%;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--text);
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-lg);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .primary-btn:active {
    background: var(--primary-hover);
  }

  .retry-btn {
    background: var(--warning);
  }

  .retry-btn:active {
    opacity: 0.8;
  }

  .secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: transparent;
    color: var(--text-dim);
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-base);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    transition: color var(--transition-fast);
    width: 100%;
  }

  .secondary-btn:active {
    color: var(--text);
  }

  /* Tablet */
  @media (min-width: 768px) {
    .summary-card {
      max-width: 480px;
      padding: var(--space-3xl, 3rem);
    }

    .score-value {
      font-size: 4rem;
    }

    .summary-title {
      font-size: 2rem;
    }
  }
</style>
