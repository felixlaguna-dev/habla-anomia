<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { ProgressBar } from '$lib/components/ui';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type MatchingMode = 'word-to-definition' | 'definition-to-word' | 'image-to-word';

  type Props = {
    words: Word[];
    language?: Language;
    mode?: MatchingMode;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean }> }) => void;
  };

  let {
    words,
    language = 'es' as Language,
    mode = 'word-to-definition',
    onComplete,
  }: Props = $props();

  // State
  let currentIndex = $state(0);
  let selectedIndex = $state<number | null>(null);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let correctIndex = $state(0);
  let options = $state<{ text: string; word: Word }[]>([]);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let startTime = $state(Date.now());

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(((currentIndex) / words.length) * 100);
  let isFinished = $derived(currentIndex >= words.length);

  // Build options for current word
  function buildOptions() {
    if (!currentWord) return;

    const correctAnswer = getCorrectAnswer(currentWord);

    // Get 3 distractors from same category or any words
    const otherWords = words.filter(w => w.id !== currentWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3);

    // If not enough distractors, fill with generic options
    while (distractors.length < 3) {
      distractors.push({
        ...currentWord,
        id: `distract-${distractors.length}`,
        word: `---`,
        definition: '---',
      });
    }

    const allOptions = [
      { text: correctAnswer, word: currentWord },
      ...distractors.map(d => ({ text: getDistractorText(d), word: d })),
    ];

    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    options = allOptions;
    correctIndex = allOptions.findIndex(o => o.word.id === currentWord.id);
  }

  function getCorrectAnswer(word: Word): string {
    if (mode === 'word-to-definition') {
      return word.definition;
    } else if (mode === 'definition-to-word') {
      return word.word;
    } else {
      // image-to-word: show word
      return word.word;
    }
  }

  function getDistractorText(word: Word): string {
    if (mode === 'word-to-definition') {
      return word.definition;
    } else {
      return word.word;
    }
  }

  // Initialize options when currentWord changes
  $effect(() => {
    if (currentWord) {
      selectedIndex = null;
      feedbackState = 'none';
      buildOptions();
    }
  });

  // Prompt text shown at top
  let promptText = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'word-to-definition') {
      return currentWord.word;
    } else if (mode === 'definition-to-word') {
      return currentWord.definition;
    } else {
      // image-to-word
      return '';
    }
  });

  let promptLabel = $derived.by(() => {
    if (mode === 'word-to-definition') {
      return $t('exercises.word_matching.match_definition');
    } else if (mode === 'definition-to-word') {
      return $t('exercises.word_matching.match_word');
    } else {
      return $t('exercises.word_matching.select_answer');
    }
  });

  function handleSelect(index: number) {
    if (feedbackState !== 'none') return;
    selectedIndex = index;

    const isCorrect = index === correctIndex;

    if (isCorrect) {
      feedbackState = 'correct';
      score++;
      results.push({ word: currentWord, correct: true });

      const responseTime = Date.now() - startTime;

      recordAttempt({
        word_id: currentWord.id,
        exercise_type: 'word-matching' as ExerciseType,
        correct: true,
        response: options[index].text,
        response_time_ms: responseTime,
        timestamp: new Date(),
        language,
      });
      updateAfterAttempt(currentWord.id, language, 5);

      setTimeout(nextWord, 1200);
    } else {
      feedbackState = 'incorrect';
      results.push({ word: currentWord, correct: false });

      recordAttempt({
        word_id: currentWord.id,
        exercise_type: 'word-matching' as ExerciseType,
        correct: false,
        response: options[index].text,
        response_time_ms: Date.now() - startTime,
        timestamp: new Date(),
        language,
      });
      updateAfterAttempt(currentWord.id, language, 1);

      setTimeout(nextWord, 2000);
    }
  }

  function nextWord() {
    currentIndex++;
    startTime = Date.now();
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  let cardState = $derived.by(() => {
    return (index: number): 'default' | 'selected' | 'correct' | 'incorrect' | 'reveal' => {
      if (feedbackState === 'none') {
        return selectedIndex === index ? 'selected' : 'default';
      }
      if (index === correctIndex) return 'correct';
      if (index === selectedIndex && feedbackState === 'incorrect') return 'incorrect';
      return 'default';
    };
  });

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
  <div class="exercise-container" role="region" aria-label={$t('exercises.word_matching.select_answer')}>
    <!-- Progress bar -->
    <ProgressBar value={progress} label={`${currentIndex + 1} ${$t('common.of')} ${words.length}`} showPercentage />

    <!-- Prompt label -->
    <p class="prompt-label">{promptLabel}</p>

    <!-- Prompt display -->
    <div class="prompt-area">
      {#if mode === 'image-to-word'}
        <img
          src={currentWord.image_url}
          alt={$t('exercises.word_matching.select_answer')}
          class="prompt-image"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      {:else}
        <p class="prompt-text">{promptText}</p>
      {/if}
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
        <span>{$t('feedback.the_answer_was', { answer: options[correctIndex]?.text || '' })}</span>
      </div>
    {/if}

    <!-- Options -->
    <div class="options-grid">
      {#each options as option, i}
        {@const state = cardState(i)}
        <button
          class="option-card"
          class:default={state === 'default'}
          class:selected={state === 'selected'}
          class:correct={state === 'correct'}
          class:incorrect={state === 'incorrect'}
          onclick={() => handleSelect(i)}
          disabled={feedbackState !== 'none'}
          aria-label={option.text}
        >
          <span class="option-text">{option.text}</span>
        </button>
      {/each}
    </div>
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
  }

  .prompt-label {
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Prompt area */
  .prompt-area {
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg, 24px);
    background: var(--surface, #f9fafb);
    border-radius: var(--radius-lg, 16px);
    border: 2px solid var(--border, #e5e7eb);
  }

  .prompt-text {
    font-size: var(--font-size-2xl, 28px);
    font-weight: 800;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }

  .prompt-image {
    max-width: 250px;
    max-height: 200px;
    object-fit: contain;
    border-radius: var(--radius-md, 12px);
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

  .option-card.selected {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
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
  }

  .result-icon {
    font-size: 20px;
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
