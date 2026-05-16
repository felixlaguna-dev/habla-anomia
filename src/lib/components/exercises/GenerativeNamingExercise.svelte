<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
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
  let addedWords = $state<string[]>([]);
  let manualInput = $state('');
  let error = $state('');

  // Category derived from words
  let categoryName = $derived(category || (words.length > 0 ? words[0].features.category : ''));

  // Build a lookup set of valid words in this category (lowercase)
  let validWordSet = $derived.by(() => {
    const set = new Set<string>();
    for (const w of words) {
      set.add(w.word.trim().toLowerCase());
    }
    return set;
  });

  // Score: number of unique valid words
  let score = $derived.by(() => {
    return addedWords.filter(w => validWordSet.has(w.toLowerCase())).length;
  });

  let validWordsFound = $derived(
    addedWords.filter(w => validWordSet.has(w.toLowerCase()))
  );

  let progressPercent = $derived(
    started && !finished ? ((validWordsFound.length) / Math.max(words.length, 1)) * 100 : 0
  );

  // Language code for speech
  let speechLang = $derived(
    language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US'
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

  function addWord(word: string) {
    const cleaned = word.trim().toLowerCase();
    if (!cleaned) return;

    // Check for duplicates
    if (addedWords.includes(cleaned)) {
      error = 'Esa palabra ya la dijiste';
      setTimeout(() => { error = ''; }, 2000);
      return;
    }

    addedWords = [...addedWords, cleaned];
    error = '';
  }

  function handleSpeechResult(transcript: string) {
    // Split on common delimiters and add each word
    const parts = transcript.split(/[\s,;.]+/).filter(Boolean);
    for (const part of parts) {
      addWord(part);
    }
  }

  function handleManualAdd() {
    if (!manualInput.trim()) return;
    addWord(manualInput);
    manualInput = '';
  }

  function handleManualKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualAdd();
    }
  }

  function finalize() {
    // Record an aggregate attempt for generative naming
    const validCount = validWordsFound.length;
    const totalAvailable = words.length;
    const correct = validCount > 0;

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
      score: validCount,
      total: totalAvailable,
      wordsFound: validWordsFound,
      details,
    });
  }

  // Category display name with uppercase
  let categoryLabel = $derived(categoryName.toUpperCase());
</script>

{#if !started}
  <!-- Start screen -->
  <div class="exercise-container">
    <div class="start-icon">🏷️</div>
    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>
    <p class="description">{$t('exercises.generative_naming.description')}</p>

    <div class="timer-preview">
      <Timer {seconds} running={false} showProgress={true} />
    </div>

    <button class="start-btn" onclick={startExercise}>
      {$t('common.start')}
    </button>
  </div>
{/if}

{#if started && !finished}
  <!-- Active exercise -->
  <div class="exercise-container">
    <!-- Progress -->
    <ProgressBar value={progressPercent} label={`${validWordsFound.length} / ${words.length}`} showPercentage />

    <!-- Category prompt -->
    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>

    <!-- Timer -->
    <Timer {seconds} {running} ontimeout={handleTimeout} showProgress={true} />

    <!-- Word count -->
    <div class="word-count">
      <span class="count-label">{$t('exercises.generative_naming.words_found')}:</span>
      <span class="count-value">{validWordsFound.length}</span>
    </div>

    <!-- Live word list -->
    {#if addedWords.length > 0}
      <div class="word-list">
        {#each addedWords as word, i}
          <span
            class="word-chip"
            class:valid={validWordSet.has(word.toLowerCase())}
          >
            {word}
            {#if validWordSet.has(word.toLowerCase())}
              <span class="word-check">✓</span>
            {/if}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Error message -->
    {#if error}
      <p class="error-msg" role="alert">{error}</p>
    {/if}

    <!-- Input area -->
    <div class="input-area">
      <SpeechInput
        language={speechLang}
        placeholder={$t('exercises.generative_naming.add_word')}
        onresult={handleSpeechResult}
      />

      <div class="manual-row">
        <input
          type="text"
          class="manual-input"
          bind:value={manualInput}
          onkeydown={handleManualKeydown}
          placeholder={$t('exercises.generative_naming.add_word')}
        />
        <button class="add-btn" onclick={handleManualAdd} disabled={!manualInput.trim()}>
          +
        </button>
      </div>
    </div>
  </div>
{/if}

{#if finished}
  <!-- Results screen -->
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('exercises.generative_naming.results_title')}</h2>

    <div class="score-display">
      <span class="score-number">{validWordsFound.length}</span>
      <span class="score-label">
        {$t('exercises.generative_naming.you_found', { count: validWordsFound.length })}
      </span>
    </div>

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

  /* Word list */
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
    animation: popIn 0.3s ease;
  }

  .word-chip.valid {
    background: var(--success, #22c55e);
    color: #fff;
  }

  .word-check {
    font-size: 14px;
    font-weight: 700;
  }

  .error-msg {
    font-size: var(--font-size-sm, 14px);
    color: var(--error, #ef4444);
    margin: 0;
    animation: fadeIn 0.3s ease;
  }

  /* Input area */
  .input-area {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  .manual-row {
    display: flex;
    gap: var(--space-sm, 8px);
    align-items: center;
  }

  .manual-input {
    flex: 1;
    min-height: 56px;
    padding: 12px 16px;
    font-size: var(--font-size-lg, 20px);
    font-family: var(--font-family, sans-serif);
    color: var(--text, #1f2937);
    background: var(--surface, #f9fafb);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    outline: none;
    transition: border-color var(--transition-fast, 0.15s);
  }

  .manual-input:focus {
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 0 0 3px var(--primary-light, #eff6ff);
  }

  .manual-input::placeholder {
    color: var(--text-muted, #6b7280);
  }

  .add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    min-height: 56px;
    width: 56px;
    height: 56px;
    font-size: var(--font-size-2xl, 28px);
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

  .add-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .add-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
