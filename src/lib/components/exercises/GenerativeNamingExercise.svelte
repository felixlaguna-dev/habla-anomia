<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import Timer from '$lib/components/ui/Timer.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type Props = {
    words: Word[];
    language?: Language;
    category?: string;
    durationSeconds?: number;
    onComplete?: (results: { score: number; total: number; wordsFound: string[]; details: Array<{ word: Word; correct: boolean }> }) => void;
  };

  let {
    words,
    language = 'es' as Language,
    category,
    durationSeconds = 60,
    onComplete,
  }: Props = $props();

  // State
  let running = $state(false);
  let started = $state(false);
  let finished = $state(false);
  let selectedWords = $state<Set<string>>(new Set());
  let error = $state('');

  // Category derived from words
  let categoryName = $derived(category || (words.length > 0 ? (words[0].features?.category ?? words[0].category ?? '') : ''));

  // Build a lookup set of valid words in this category (lowercase)
  let validWordSet = $derived.by(() => {
    const set = new Set<string>();
    for (const w of words) {
      set.add(w.word.trim().toLowerCase());
    }
    return set;
  });

  // Build the word pool: mix valid words with distractors from other categories
  // We need a bigger pool of all words to draw distractors from
  // Since we only have `words` (category words), we'll reuse them shuffled + add filler
  let wordPool = $derived.by(() => {
    // The pool consists of the valid words + some "decoy" words generated from partial matches
    // Since we only have category words, we create the pool from the words themselves
    // plus their synonyms/opposites as distractors if available
    const pool: Array<{ word: string; isValid: boolean }> = [];

    // Add all valid words
    for (const w of words) {
      pool.push({ word: w.word, isValid: true });
    }

    // Add distractors: synonyms, opposites from within the word list
    const distractorSet = new Set<string>();
    for (const w of words) {
      if (w.opposite && !validWordSet.has(w.opposite.toLowerCase())) {
        distractorSet.add(w.opposite);
      }
      if (w.synonyms) {
        for (const s of w.synonyms) {
          if (!validWordSet.has(s.toLowerCase())) {
            distractorSet.add(s);
          }
        }
      }
    }

    // Add some distractors
    const distractors = [...distractorSet].sort(() => Math.random() - 0.5).slice(0, Math.max(4, 8 - words.length));
    for (const d of distractors) {
      pool.push({ word: d, isValid: false });
    }

    // If we still don't have enough for a good pool, pad with generic decoys
    while (pool.length < 8 && pool.length > 0) {
      pool.push({ word: `—${pool.length}—`, isValid: false });
    }

    // Shuffle
    return pool.sort(() => Math.random() - 0.5);
  });

  // Score: number of unique valid words selected
  let validWordsFound = $derived(
    [...selectedWords].filter(w => validWordSet.has(w.toLowerCase()))
  );

  let score = $derived(validWordsFound.length);

  let progressPercent = $derived(
    started && !finished ? ((validWordsFound.length) / Math.max(words.length, 1)) * 100 : 0
  );

  function startExercise() {
    started = true;
    running = true;
  }

  function handleTimeout() {
    running = false;
    finished = true;
    finalize();
  }

  function toggleWord(word: string) {
    if (!running) return;
    const cleaned = word.trim().toLowerCase();

    if (selectedWords.has(cleaned)) {
      selectedWords.delete(cleaned);
      selectedWords = new Set(selectedWords); // trigger reactivity
      return;
    }

    selectedWords.add(cleaned);
    selectedWords = new Set(selectedWords); // trigger reactivity
    error = '';
  }

  function isSelected(word: string): boolean {
    return selectedWords.has(word.trim().toLowerCase());
  }

  function isWordValid(word: string): boolean {
    return validWordSet.has(word.trim().toLowerCase());
  }

  function getWordState(word: string): 'unselected' | 'selected-valid' | 'selected-invalid' {
    const cleaned = word.trim().toLowerCase();
    if (!selectedWords.has(cleaned)) return 'unselected';
    return validWordSet.has(cleaned) ? 'selected-valid' : 'selected-invalid';
  }

  function finishEarly() {
    running = false;
    finished = true;
    finalize();
  }

  function finalize() {
    // Record attempt for each valid word found
    for (const foundWord of validWordsFound) {
      const matchedWord = words.find(w => w.word.trim().toLowerCase() === foundWord);
      if (matchedWord) {
        recordAttempt({
          word_id: matchedWord.id,
          exercise_type: 'generative-naming' as ExerciseType,
          correct: true,
          response: foundWord,
          response_time_ms: durationSeconds * 1000,
          timestamp: new Date(),
          language,
        });
        updateAfterAttempt(matchedWord.id, language, 5);
      }
    }

    // Record misses for words not found
    for (const w of words) {
      if (!validWordsFound.includes(w.word.trim().toLowerCase())) {
        recordAttempt({
          word_id: w.id,
          exercise_type: 'generative-naming' as ExerciseType,
          correct: false,
          response: '',
          response_time_ms: durationSeconds * 1000,
          timestamp: new Date(),
          language,
        });
        updateAfterAttempt(w.id, language, 0);
      }
    }

    const details = words.map(w => ({
      word: w,
      correct: validWordsFound.includes(w.word.trim().toLowerCase()),
    }));

    onComplete?.({
      score: validWordsFound.length,
      total: words.length,
      wordsFound: validWordsFound,
      details,
    });
  }

  function restart() {
    running = false;
    started = false;
    finished = false;
    selectedWords = new Set();
    error = '';
  }

  // Category display name with uppercase
  let categoryLabel = $derived(categoryName.toUpperCase());
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !started}
  <!-- Start screen -->
  <div class="exercise-container" role="region" aria-label={$t('exercises.generative_naming.name_all', { category: categoryLabel })}>
    <div class="start-icon">🏷️</div>
    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>
    <p class="description">{$t('exercises.generative_naming.description')}</p>

    <div class="timer-preview">
      <Timer seconds={durationSeconds} running={false} showProgress={true} />
    </div>

    <button class="start-btn" onclick={startExercise} aria-label={$t('common.start')}>
      {$t('common.start')}
    </button>
  </div>
{:else if !finished}
  <!-- Active exercise: tap-to-select word pool -->
  <div class="exercise-container">
    <!-- Progress -->
    <ProgressBar value={progressPercent} label={`${validWordsFound.length} / ${words.length}`} showPercentage />

    <!-- Category prompt -->
    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>

    <!-- Timer -->
    <Timer seconds={durationSeconds} {running} ontimeout={handleTimeout} showProgress={true} />

    <!-- Word count -->
    <div class="word-count">
      <span class="count-label">{$t('exercises.generative_naming.words_found')}:</span>
      <span class="count-value">{validWordsFound.length}</span>
    </div>

    <!-- Tap-to-select word pool -->
    <div class="word-pool">
      {#each wordPool as item}
        {@const state = getWordState(item.word)}
        <button
          class="pool-word"
          class:unselected={state === 'unselected'}
          class:selected-valid={state === 'selected-valid'}
          class:selected-invalid={state === 'selected-invalid'}
          onclick={() => toggleWord(item.word)}
          disabled={!running}
          aria-label={item.word}
          aria-pressed={isSelected(item.word)}
        >
          {#if state === 'selected-valid'}
            <span class="word-check">✓</span>
          {:else if state === 'selected-invalid'}
            <span class="word-cross">✗</span>
          {/if}
          <span class="pool-word-text">{item.word}</span>
        </button>
      {/each}
    </div>

    <!-- Error message -->
    {#if error}
      <p class="error-msg" role="alert">{error}</p>
    {/if}

    <!-- Finish early button -->
    <button class="finish-btn" onclick={finishEarly} aria-label={$t('common.next')}>
      {$t('common.next')} →
    </button>
  </div>
{:else}
  <!-- Results screen -->
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>

    <p class="summary-score">
      {$t('feedback.score')}: {validWordsFound.length} / {words.length}
    </p>

    {#if validWordsFound.length > 0}
      <div class="found-words">
        <h3>{$t('exercises.generative_naming.words_found')}</h3>
        <div class="word-list">
          {#each validWordsFound as word}
            <span class="word-chip valid">{word}</span>
          {/each}
        </div>
      </div>
    {/if}

    {#if validWordsFound.length >= 5}
      <p class="encouragement">{$t('exercises.generative_naming.well_done')} 🌟</p>
    {/if}
    <button class="back-to-exercises-btn" onclick={() => window.location.href = '/exercises'}>
      ← {$t('common.back_to_exercises')}
    </button>
    <button class="restart-btn" onclick={restart}>
      🔄 {$t('common.restart')}
    </button>
  </div>
{/if}

<style>
  .exercise-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 16px);
    padding: var(--space-md, 16px);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* Start screen */
  .start-icon {
    font-size: 64px;
    line-height: 1;
  }

  .category-title {
    font-size: var(--font-size-xl, 24px);
    font-weight: 800;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }

  .description {
    font-size: var(--font-size-base, 16px);
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }

  .timer-preview {
    padding: var(--space-md, 16px) 0;
  }

  .start-btn {
    min-height: 64px;
    min-width: 56px;
    padding: 14px 48px;
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    font-family: var(--font-family, sans-serif);
    background: var(--primary, #3b82f6);
    color: #fff;
    border: 2px solid var(--primary, #3b82f6);
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    transition: background var(--transition-fast, 0.15s), transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .start-btn:hover {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }

  .start-btn:active {
    transform: scale(0.97);
  }

  /* Word count */
  .word-count {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .count-label {
    font-size: var(--font-size-lg, 20px);
    color: var(--text-muted, #6b7280);
  }

  .count-value {
    font-size: var(--font-size-2xl, 28px);
    font-weight: 800;
    color: var(--primary, #3b82f6);
  }

  /* Word pool grid */
  .word-pool {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm, 8px);
    width: 100%;
    max-width: 500px;
  }

  @media (min-width: 400px) {
    .word-pool {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .pool-word {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 56px;
    padding: 12px 16px;
    font-size: var(--font-size-lg, 20px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: var(--surface, #f9fafb);
    color: var(--text, #1f2937);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition: all var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
    text-align: center;
    box-sizing: border-box;
    word-break: break-word;
  }

  .pool-word:hover:not(:disabled) {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
  }

  .pool-word:active:not(:disabled) {
    transform: scale(0.97);
  }

  .pool-word.unselected {
    background: var(--surface, #f9fafb);
    border-color: var(--border, #e5e7eb);
  }

  .pool-word.selected-valid {
    background: var(--success, #22c55e);
    border-color: var(--success, #22c55e);
    color: #fff;
  }

  .pool-word.selected-invalid {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--error, #ef4444);
    color: var(--error, #ef4444);
  }

  .pool-word:disabled {
    cursor: default;
    opacity: 0.7;
  }

  .word-check {
    font-size: 16px;
    font-weight: 700;
  }

  .word-cross {
    font-size: 16px;
    font-weight: 700;
  }

  .pool-word-text {
    font-size: var(--font-size-lg, 20px);
  }

  /* Finish button */
  .finish-btn {
    min-height: 56px;
    min-width: 56px;
    padding: 12px 36px;
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    font-family: var(--font-family, sans-serif);
    background: var(--primary, #3b82f6);
    color: #fff;
    border: 2px solid var(--primary, #3b82f6);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition: background var(--transition-fast, 0.15s), transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .finish-btn:hover {
    filter: brightness(1.1);
  }

  .finish-btn:active {
    transform: scale(0.97);
  }

  /* Word list (results) */
  .word-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm, 8px);
    justify-content: center;
    width: 100%;
    max-width: 500px;
  }

  .word-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: var(--surface-2, #f3f4f6);
    border-radius: var(--radius-full, 999px);
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text, #1f2937);
  }

  .word-chip.valid {
    background: var(--success, #22c55e);
    color: #fff;
  }

  .error-text {
    font-size: var(--font-size-lg, 20px);
    color: var(--error, #ef4444);
    text-align: center;
    margin: 0;
  }

  .error-msg {
    font-size: var(--font-size-sm, 14px);
    color: var(--error, #ef4444);
    margin: 0;
    animation: fadeIn 0.3s ease;
  }

  /* Summary */
  .summary {
    gap: var(--space-lg, 24px);
  }

  .summary-icon {
    font-size: 64px;
    line-height: 1;
  }

  .summary-title {
    font-size: var(--font-size-2xl, 28px);
    font-weight: 800;
    color: var(--text, #1f2937);
    margin: 0;
  }

  .summary-score {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--primary, #3b82f6);
    margin: 0;
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs, 4px);
  }

  .score-number {
    font-size: 48px;
    font-weight: 800;
    color: var(--primary, #3b82f6);
    line-height: 1;
  }

  .score-label {
    font-size: var(--font-size-lg, 20px);
    color: var(--text-muted, #6b7280);
  }

  .found-words {
    width: 100%;
    text-align: center;
  }

  .found-words h3 {
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    margin: 0 0 var(--space-sm, 8px) 0;
  }

  .encouragement {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--success, #22c55e);
    margin: 0;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .back-to-exercises-btn {
    margin-top: var(--space-lg, 24px);
    padding: var(--space-md, 16px) var(--space-xl, 32px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    background: var(--primary, #3b82f6);
    color: #fff;
    border: none;
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    min-height: 56px;
    touch-action: manipulation;
  }

  .restart-btn {
    margin-top: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    font-size: var(--font-size-md, 16px);
    font-weight: 600;
    background: var(--surface-2, #e5e7eb);
    color: var(--text, #1f2937);
    border: none;
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    min-height: 48px;
    touch-action: manipulation;
  }
</style>
