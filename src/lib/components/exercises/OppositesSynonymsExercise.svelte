<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type ExerciseMode = 'opposites' | 'synonyms';
  type InputMode = 'choice' | 'open';

  type Props = {
    words: Word[];
    language?: Language;
    mode?: ExerciseMode;
    inputMode?: InputMode;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean }> }) => void;
  };

  let {
    words: rawWords,
    language = 'es' as Language,
    mode = 'opposites',
    inputMode = 'choice',
    onComplete,
  }: Props = $props();

  // Filter out words without required fields depending on mode
  let words = $derived.by(() => {
    if (mode === 'opposites') {
      return rawWords.filter(w => w.opposite);
    } else {
      return rawWords.filter(w => w.synonyms && w.synonyms.length > 0);
    }
  });

  // State
  let currentIndex = $state(0);
  let selectedIndex = $state<number | null>(null);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let correctIndex = $state(0);
  let options = $state<string[]>([]);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let startTime = $state(Date.now());

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(((currentIndex) / words.length) * 100);
  let isFinished = $derived(currentIndex >= words.length);

  // Language code for speech
  let speechLang = $derived(
    language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US'
  );

  // Get the correct answer for the current mode
  let correctAnswer = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'opposites') {
      return currentWord.opposite || '';
    } else {
      // Synonyms: pick first synonym
      return currentWord.synonyms?.[0] || '';
    }
  });

  // All valid answers for the current mode (for open input matching)
  let validAnswers = $derived.by(() => {
    if (!currentWord) return [];
    if (mode === 'opposites') {
      return currentWord.opposite ? [currentWord.opposite.toLowerCase()] : [];
    } else {
      return (currentWord.synonyms || []).map(s => s.toLowerCase());
    }
  });

  // Build prompt text
  let promptText = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'opposites') {
      return `${$t('exercises.opposites_synonyms.opposite_of')} '${currentWord.word}'?`;
    } else {
      return `${$t('exercises.opposites_synonyms.synonym_of')} '${currentWord.word}'?`;
    }
  });

  // Build choice options
  function buildOptions() {
    if (!currentWord || !correctAnswer) return;

    // Gather distractors from other words
    const distractorPool: string[] = [];

    for (const w of words) {
      if (w.id === currentWord.id) continue;
      if (mode === 'opposites' && w.opposite) {
        distractorPool.push(w.opposite);
      } else if (mode === 'synonyms' && w.synonyms && w.synonyms.length > 0) {
        distractorPool.push(w.synonyms[0]);
      }
      // Also add words themselves as distractors
      distractorPool.push(w.word);
    }

    // Shuffle and pick 3 unique distractors
    const shuffled = [...new Set(distractorPool)].sort(() => Math.random() - 0.5);
    const distractors = shuffled.filter(d =>
      d.toLowerCase() !== correctAnswer.toLowerCase() &&
      !validAnswers.includes(d.toLowerCase())
    ).slice(0, 3);

    // If not enough distractors, add placeholders
    while (distractors.length < 3) {
      distractors.push(`—${distractors.length + 1}—`);
    }

    const allOptions = [correctAnswer, ...distractors];

    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    options = allOptions;
    correctIndex = allOptions.findIndex(o => o.toLowerCase() === correctAnswer.toLowerCase());
  }

  // Initialize options when currentWord changes
  $effect(() => {
    if (currentWord) {
      selectedIndex = null;
      feedbackState = 'none';
      if (inputMode === 'choice') {
        buildOptions();
      }
    }
  });

  // Choice mode handlers
  function handleSelectChoice(index: number) {
    if (feedbackState !== 'none') return;
    selectedIndex = index;

    const isCorrect = options[index]?.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      feedbackState = 'correct';
      score++;
      results.push({ word: currentWord, correct: true });
      recordAndAdvance(true, options[index]);
    } else {
      feedbackState = 'incorrect';
      results.push({ word: currentWord, correct: false });
      recordAndAdvance(false, options[index]);
    }
  }

  // Open mode handlers
  function handleOpenAnswer(response: string) {
    if (!currentWord || feedbackState === 'correct') return;

    const cleaned = response.trim().toLowerCase();
    const correct = validAnswers.includes(cleaned) || cleaned === correctAnswer.toLowerCase();

    if (correct) {
      feedbackState = 'correct';
      score++;
      results.push({ word: currentWord, correct: true });
      recordAndAdvance(true, response);
    } else {
      feedbackState = 'incorrect';
    }
  }

  async function recordAndAdvance(correct: boolean, response: string) {
    const responseTime = Date.now() - startTime;

    await recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'opposites-synonyms' as ExerciseType,
      correct,
      response,
      response_time_ms: responseTime,
      timestamp: new Date(),
      language,
    });

    const quality = correct ? 5 : 0;
    await updateAfterAttempt(currentWord.id, language, quality);

    if (correct) {
      setTimeout(nextWord, 1200);
    } else {
      setTimeout(nextWord, 2000);
    }
  }

  function skipWord() {
    results.push({ word: currentWord, correct: false });
    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'opposites-synonyms' as ExerciseType,
      correct: false,
      response: '',
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });
    updateAfterAttempt(currentWord.id, language, 0);
    nextWord();
  }

  function nextWord() {
    feedbackState = 'none';
    selectedIndex = null;
    startTime = Date.now();
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  // Card state helper for choice mode
  function getCardState(index: number): 'default' | 'selected' | 'correct' | 'incorrect' {
    if (feedbackState === 'none') {
      return selectedIndex === index ? 'selected' : 'default';
    }
    if (index === correctIndex) return 'correct';
    if (index === selectedIndex && feedbackState === 'incorrect') return 'incorrect';
    return 'default';
  }

  // Encouragement
  const encouragementKeys = [
    'feedback.correct',
    'feedback.well_done',
    'feedback.excellent',
    'feedback.keep_going',
  ];
  let encouragement = $derived(encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)]);
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <div class="exercise-container" role="region" aria-label={promptText}>
    <!-- Progress bar -->
    <ProgressBar value={progress} label={`${currentIndex + 1} ${$t('common.of')} ${words.length}`} showPercentage />

    <!-- Mode badge -->
    <div class="mode-badge">
      {#if mode === 'opposites'}
        <span class="badge-icon">↔️</span>
        <span class="badge-text">{$t('exercises.opposites_synonyms.opposites')}</span>
      {:else}
        <span class="badge-icon">≡</span>
        <span class="badge-text">{$t('exercises.opposites_synonyms.synonyms')}</span>
      {/if}
    </div>

    <!-- Prompt -->
    <div class="prompt-area">
      <p class="prompt-text">{promptText}</p>
    </div>

    <!-- Feedback -->
    {#if feedbackState === 'correct'}
      <div class="feedback correct" role="status">
        <span>✅</span>
        <span>{$t(encouragement)}</span>
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status">
        <span>❌</span>
        <span>
          {#if mode === 'opposites'}
            {$t('feedback.the_answer_was', { answer: currentWord.opposite || correctAnswer })}
          {:else}
            {$t('feedback.the_answer_was', { answer: correctAnswer })}
          {/if}
        </span>
      </div>
    {/if}

    <!-- Choice mode -->
    {#if inputMode === 'choice'}
      <div class="options-grid">
        {#each options as option, i}
          {@const state = getCardState(i)}
          <button
            class="option-card"
            class:default={state === 'default'}
            class:correct={state === 'correct'}
            class:incorrect={state === 'incorrect'}
            onclick={() => handleSelectChoice(i)}
            disabled={feedbackState !== 'none'}
            aria-label={option}
          >
            <span class="option-text">{option}</span>
          </button>
        {/each}
      </div>

    <!-- Open mode -->
    {:else}
      <div class="answer-area">
        {#if feedbackState !== 'correct'}
          <SpeechInput
            language={speechLang}
            placeholder={mode === 'opposites'
              ? $t('exercises.opposites_synonyms.opposite_of')
              : $t('exercises.opposites_synonyms.what_means_same')}
            onresult={handleOpenAnswer}
          />
        {/if}

        {#if feedbackState === 'incorrect'}
          <button class="skip-button" onclick={skipWord} aria-label={$t('common.next')}>
            ⏭️ {$t('common.next')}
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if isFinished}
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>
    <p class="summary-score">{$t('feedback.score')}: {score} / {words.length}</p>
    <div class="summary-details">
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          {#if mode === 'opposites' && result.word.opposite}
            <span class="result-answer">→ {result.word.opposite}</span>
          {:else if mode === 'synonyms' && result.word.synonyms?.[0]}
            <span class="result-answer">→ {result.word.synonyms[0]}</span>
          {/if}
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .error-text {
    font-size: var(--font-size-lg, 20px);
    color: var(--error, #ef4444);
    text-align: center;
    margin: 0;
  }

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

  /* Mode badge */
  .mode-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-xs, 4px) var(--space-md, 16px);
    background: var(--surface-2, #f3f4f6);
    border-radius: var(--radius-full, 999px);
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
  }

  .badge-icon {
    font-size: 20px;
  }

  /* Prompt area */
  .prompt-area {
    width: 100%;
    padding: var(--space-lg, 24px);
    background: var(--surface, #f9fafb);
    border-radius: var(--radius-lg, 16px);
    border: 2px solid var(--border, #e5e7eb);
    text-align: center;
  }

  .prompt-text {
    font-size: var(--font-size-xl, 24px);
    font-weight: 800;
    color: var(--text, #1f2937);
    margin: 0;
    line-height: 1.4;
  }

  /* Feedback */
  .feedback {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--radius-md, 12px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    animation: fadeIn 0.3s ease;
  }

  .feedback.correct {
    background: var(--success, #22c55e);
    color: #fff;
  }

  .feedback.incorrect {
    background: var(--surface-2, #fee2e2);
    color: var(--error, #ef4444);
  }

  /* Options grid */
  .options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .option-card {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    padding: var(--space-md, 16px) var(--space-lg, 24px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: var(--surface, #f9fafb);
    border: 3px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    color: var(--text, #1f2937);
    cursor: pointer;
    transition: all var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
    text-align: center;
    line-height: 1.4;
  }

  .option-card:hover:not(:disabled) {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
    box-shadow: var(--shadow-md);
  }

  .option-card:active:not(:disabled) {
    transform: scale(0.98);
  }

  .option-card.correct {
    border-color: var(--success, #22c55e);
    background: var(--success, #22c55e);
    color: #fff;
    animation: correctPulse 0.6s ease;
  }

  .option-card.incorrect {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
    color: var(--error, #ef4444);
    animation: shake 0.5s ease-in-out;
  }

  .option-card:disabled {
    cursor: default;
  }

  .option-text {
    font-size: var(--font-size-lg, 20px);
  }

  /* Answer area (open mode) */
  .answer-area {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  .skip-button {
    min-height: 56px;
    min-width: 56px;
    padding: 12px 24px;
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: transparent;
    color: var(--text-muted, #6b7280);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition: background var(--transition-fast, 0.15s), transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
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

  .summary-details {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }

  .result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--radius-md, 12px);
    font-size: var(--font-size-base, 16px);
    gap: var(--space-sm, 8px);
  }

  .result-row.pass {
    background: rgba(34, 197, 94, 0.1);
  }

  .result-row.fail {
    background: rgba(239, 68, 68, 0.1);
  }

  .result-word {
    font-weight: 600;
    color: var(--text, #1f2937);
    flex: 1;
  }

  .result-answer {
    color: var(--text-muted, #6b7280);
    font-size: var(--font-size-sm, 14px);
    flex: 1;
    text-align: center;
  }

  .result-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
</style>
