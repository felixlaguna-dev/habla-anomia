<script lang="ts">
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getAllSettings, startSession, endSession, updateStreak } from '$lib/db';
  import { awaitSeedReady } from '$lib/db/words';
  import { db } from '$lib/db/database';
  import { generateSession } from '$lib/engine/session-generator';
  import { browser } from '$app/environment';
  import { playCompleteSound } from '$lib/utils/sounds';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { Spinner } from '$lib/components/ui';
  import type { ExerciseType, Language, Word, AppSettings, Category } from '$lib/types';
  import { CATEGORIES } from '$lib/types';

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
  // Optional "?category=" restricts the session to one semantic field
  // (entry point: "Practicar una categoría" chooser). Invalid values are ignored.
  let routeCategory = $derived.by(() => {
    const raw = $page.url.searchParams.get('category');
    return raw && CATEGORIES.includes(raw as Category) ? (raw as Category) : undefined;
  });
  let settings = $state<AppSettings | null>(null);
  let words = $state<Word[]>([]);
  let loading = $state(true);
  let sessionId = $state<number | null>(null);
  let showResults = $state(false);
  let results = $state({ correct: 0, total: 0, accuracy: 0 });
  let correctWords = $state<Word[]>([]);
  let incorrectWords = $state<Word[]>([]);
  let showConfetti = $state(false);
  let planCategory: string | undefined = $state();
  let allWords = $state<Word[]>([]);

  // TTS for results overlay
  let resultSynthesis: SpeechSynthesisService | null = $state(null);
  let speakingWord = $state<string | null>(null);

  function speakWord(word: string, lang: Language) {
    if (!resultSynthesis) return;
    speakingWord = word;
    resultSynthesis.speak(word, lang);
    // Clear after estimated duration
    setTimeout(() => { speakingWord = null; }, 1500);
  }

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
    // Wait for DB to finish seeding words before querying
    await awaitSeedReady();
    const s = await getAllSettings();
    settings = s;

    const plan = await generateSession(
      s.language,
      exerciseType,
      10,
      routeCategory ? { category: routeCategory } : {}
    );
    words = plan.words;
    planCategory = plan.category;

    // Load all words for cross-category distractors
    allWords = await db.words.where('language').equals(s.language).toArray();

    const id = await startSession(s.language);
    sessionId = id;

    loading = false;
  }

  onMount(initExercise);

  onMount(() => {
    if (SpeechSynthesisService.isSupported()) {
      resultSynthesis = new SpeechSynthesisService();
    }
    return () => resultSynthesis?.destroy();
  });

  // Focus management: move focus to heading after page loads for screen readers
  onMount(() => {
    setTimeout(() => {
      const heading = document.querySelector('h1.exercise-title') as HTMLElement | null;
      heading?.focus();
    }, 100);
  });

  async function handleComplete(e: { score: number; total: number; details?: Array<{ word: Word; correct: boolean }> }) {
    const { score: correct, total } = e;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    results = { correct, total, accuracy };
    showResults = true;

    // Play completion sound
    playCompleteSound();

    // Confetti for high scores
    if (accuracy >= 80) {
      showConfetti = true;
    }

    // Separate correct and incorrect words
    correctWords = [];
    incorrectWords = [];

    if (e.details && e.details.length > 0) {
      for (const d of e.details) {
        if (d.correct) {
          correctWords.push(d.word);
        } else {
          incorrectWords.push(d.word);
        }
      }
    }

    if (sessionId !== null) {
      await endSession(sessionId, accuracy, total);
      // Session is finalized — drop the id so a "retry mistakes" run can't
      // overwrite this row. The retry's per-word attempts are still recorded
      // independently; broadening retry into its own session is ha-aslk's call.
      sessionId = null;
    }

    // Update streak
    await updateStreak();
  }

  async function handleRestart() {
    // End current session if one is open
    if (sessionId !== null) {
      await endSession(sessionId, 0, 0);
      sessionId = null;
    }
    // Re-initialize with a fresh session and new words
    loading = true;
    await initExercise();
  }

  function goBack() {
    // From "Practicar una categoría": return to that category's chooser rather
    // than bouncing through /exercises → home.
    if (routeCategory) goto(`${base}/practice/${routeCategory}`);
    else goto(`${base}/exercises`);
  }

  function handleCloseResults() {
    showResults = false;
    showConfetti = false;
    goto(`${base}/`);
  }

  function handleRetryMistakes() {
    showResults = false;
    showConfetti = false;
    if (incorrectWords.length > 0) {
      words = [...incorrectWords];
      incorrectWords = [];
      correctWords = [];
      results = { correct: 0, total: 0, accuracy: 0 };
    }
  }

  function getEncouragement(accuracy: number): string {
    if (accuracy >= 90) return $t('feedback.excellent');
    if (accuracy >= 70) return $t('feedback.very_good');
    if (accuracy >= 50) return $t('feedback.good_job');
    return $t('feedback.keep_practicing');
  }

  function getStarRating(accuracy: number): string {
    if (accuracy >= 90) return '⭐⭐⭐';
    if (accuracy >= 70) return '⭐⭐';
    if (accuracy >= 50) return '⭐';
    return '';
  }

  function getAccuracyColor(accuracy: number): string {
    if (accuracy >= 80) return 'var(--success, #10b981)';
    if (accuracy >= 50) return 'var(--warning, #f59e0b)';
    return 'var(--error, #ef4444)';
  }
</script>

<svelte:head>
  <title>{$t(titleKey)} · {$t('app.name')}</title>
</svelte:head>

<section class="exercise-page">
  <header class="exercise-header">
    <button class="back-btn" onclick={goBack} aria-label={$t('common.back')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="header-text">
      <h1 class="exercise-title" tabindex="-1">{$t(titleKey)}</h1>
    </div>
    <div class="header-spacer"></div>
  </header>

  {#if loading}
    <Spinner label={$t('common.loading')} />
  {:else if words.length > 0 && ExerciseComponent}
    <div class="exercise-content slide-up">
      <!-- Keying on `words` forces a fresh component instance on "retry
           mistakes" (which swaps in a new failed-words array): without it the
           child keeps its completed-run currentIndex and re-renders the stale
           internal summary instead of restarting. -->
      {#key words}
        <ExerciseComponent
          {words}
          {allWords}
          language={settings?.language || 'es'}
          category={planCategory}
          speechRate={settings?.speech_rate ?? 0.8}
          timerEnabled={settings?.timer_enabled ?? true}
          speakButtonsEnabled={settings?.speak_buttons_enabled ?? true}
          oncomplete={handleComplete}
          onrestart={handleRestart}
        />
      {/key}
    </div>
  {:else}
    <div class="error-container">
      <span class="error-icon" aria-hidden="true">😕</span>
      <p class="error-message">{$t('common.no_words')}</p>
      <button class="retry-btn" onclick={() => goto(`${base}/exercises`)}>
        ↩ {$t('common.back')}
      </button>
    </div>
  {/if}
</section>

{#if showResults}
  <div class="results-overlay" role="dialog" aria-modal="true" aria-label={$t('feedback.exercise_complete')}>
    <!-- Confetti overlay -->
    {#if showConfetti}
      <div class="confetti-container" aria-hidden="true">
        {#each { length: 30 } as _, i}
          <div
            class="confetti-piece"
            style="
              left: {Math.random() * 100}%;
              animation-delay: {Math.random() * 0.5}s;
              background: hsl({Math.random() * 360}, 80%, 60%);
              width: {6 + Math.random() * 8}px;
              height: {6 + Math.random() * 8}px;
              animation-duration: {1.5 + Math.random() * 1.5}s;
            "
          ></div>
        {/each}
      </div>
    {/if}

    <div class="results-card scale-in">
      <h2 class="results-title">{$t('feedback.exercise_complete')}</h2>

      {#if showConfetti}
        <div class="celebration-emoji" aria-hidden="true">🎉</div>
      {/if}

      <!-- Star rating -->
      {#if getStarRating(results.accuracy)}
        <div class="star-rating" aria-hidden="true">{getStarRating(results.accuracy)}</div>
      {/if}

      <!-- Large accuracy display -->
      <div class="results-score">
        <span class="score-value" style="color: {getAccuracyColor(results.accuracy)}">
          {results.accuracy}%
        </span>
        <span class="score-label">{$t('feedback.score')}</span>
      </div>

      <!-- Encouragement -->
      <p class="encouragement" style="color: {getAccuracyColor(results.accuracy)}">
        {getEncouragement(results.accuracy)}
      </p>

      <!-- Detail -->
      <div class="results-detail">
        <span>{$t('feedback.correct')}: {results.correct} / {results.total}</span>
      </div>

      <!-- Word breakdown -->
      {#if correctWords.length > 0}
        <div class="word-breakdown">
          <h3 class="breakdown-title correct-title">✅ {$t('feedback.correct')} ({correctWords.length})</h3>
          <div class="word-chips">
            {#each correctWords.slice(0, 10) as word}
              <button class="word-chip correct-chip" class:speaking={speakingWord === word.word} onclick={() => speakWord(word.word, settings?.language ?? 'es')}>
                {word.word}{#if settings?.speak_buttons_enabled ?? true} 🔊{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if incorrectWords.length > 0}
        <div class="word-breakdown">
          <h3 class="breakdown-title incorrect-title">❌ {$t('feedback.incorrect')} ({incorrectWords.length})</h3>
          <div class="word-chips">
            {#each incorrectWords.slice(0, 10) as word}
              <button class="word-chip incorrect-chip" class:speaking={speakingWord === word.word} onclick={() => speakWord(word.word, settings?.language ?? 'es')}>
                {word.word}{#if settings?.speak_buttons_enabled ?? true} 🔊{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="results-actions">
        {#if incorrectWords.length > 0}
          <button class="retry-btn" onclick={handleRetryMistakes}>
            🔄 {$t('feedback.retry_mistakes')}
          </button>
        {/if}
        <button class="results-close-btn" onclick={handleCloseResults}>
          {$t('common.finish')}
        </button>
      </div>
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
    /* Allow the title to wrap to 2 lines on narrow screens instead of truncating */
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .header-spacer {
    width: var(--touch-min);
    flex-shrink: 0;
  }

  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-2xl);
    text-align: center;
    min-height: 40vh;
  }

  .error-container .error-icon {
    font-size: 3rem;
    line-height: 1;
  }

  .error-container .error-message {
    color: var(--text);
    font-size: var(--font-size-xl);
    font-weight: 700;
    line-height: 1.5;
  }

  .error-container .retry-btn {
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
    touch-action: manipulation;
  }

  .error-container .retry-btn:active {
    background: var(--primary-hover);
  }

  .exercise-content {
    margin-top: var(--space-md);
  }

  /* Results overlay */
  .results-overlay {
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

  .results-card {
    background: var(--surface);
    border-radius: var(--radius-xl);
    padding: var(--space-2xl);
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 1;
  }

  .celebration-emoji {
    font-size: 4rem;
    line-height: 1;
    margin-bottom: var(--space-md);
  }

  .star-rating {
    font-size: 2.5rem;
    line-height: 1;
    letter-spacing: 0.25em;
    margin-bottom: var(--space-sm);
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
    margin-bottom: var(--space-sm);
  }

  .score-value {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
  }

  .score-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .encouragement {
    font-size: var(--font-size-xl);
    font-weight: 700;
    margin-bottom: var(--space-md);
  }

  .results-detail {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-lg);
  }

  /* Word breakdown */
  .word-breakdown {
    margin-bottom: var(--space-md);
    text-align: left;
  }

  .breakdown-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    margin-bottom: var(--space-xs);
  }

  .correct-title {
    color: var(--success, #10b981);
  }

  .incorrect-title {
    color: var(--error, #ef4444);
  }

  .word-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .word-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    font-family: var(--font-family);
    transition: opacity var(--transition-fast);
  }

  .word-chip:active {
    opacity: 0.7;
  }

  .word-chip.speaking {
    opacity: 0.6;
  }

  .correct-chip {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success, #10b981);
  }

  .incorrect-chip {
    background: rgba(239, 68, 68, 0.15);
    color: var(--error, #ef4444);
  }

  /* Actions */
  .results-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--warning, #f59e0b);
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

  .retry-btn:active {
    opacity: 0.8;
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
    font-family: var(--font-family);
    cursor: pointer;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .results-close-btn:active {
    background: var(--primary-hover);
  }

  /* Confetti */
  .confetti-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 201;
    overflow: hidden;
  }

  .confetti-piece {
    position: absolute;
    top: -10px;
    border-radius: 2px;
    animation: confettiFall linear both;
  }

  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg) scale(0.3);
      opacity: 0;
    }
  }
</style>
