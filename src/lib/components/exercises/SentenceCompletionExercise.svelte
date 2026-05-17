<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type InputMode = 'choice' | 'open';

  type Props = {
    words: Word[];
    language?: Language;
    inputMode?: InputMode;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; hintsUsed: number }> }) => void;
  };

  let {
    words,
    language = 'es' as Language,
    inputMode = 'choice',
    onComplete,
  }: Props = $props();

  // State
  let currentIndex = $state(0);
  let hintsUsed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; hintsUsed: number }>>([]);
  let startTime = $state(Date.now());

  // Multiple choice state
  let options = $state<string[]>([]);
  let selectedIndex = $state<number | null>(null);
  let correctOptionIndex = $state(0);

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(((currentIndex) / words.length) * 100);
  let isFinished = $derived(currentIndex >= words.length);

  // Language code for speech
  let speechLang = $derived(
    language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US'
  );

  // Generate distractor options
  function generateOptions(correct: string, allWords: Word[], count: number = 3): string[] {
    const others = allWords
      .filter(w => w.word !== correct)
      .map(w => w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }

  // Rebuild options when word changes
  $effect(() => {
    if (currentWord && inputMode === 'choice') {
      const opts = generateOptions(currentWord.word, words);
      options = opts;
      correctOptionIndex = opts.indexOf(currentWord.word);
      selectedIndex = null;
    }
  });

  // Sentence with blank
  let sentenceParts = $derived.by(() => {
    if (!currentWord?.sentence) return { before: '', after: '' };
    const parts = currentWord.sentence.split('_____');
    return {
      before: parts[0] || '',
      after: parts[1] || '',
    };
  });

  let displaySentence = $derived.by(() => {
    if (!currentWord?.sentence) return '';
    return currentWord.sentence;
  });

  // Hint levels
  let revealedHints = $derived.by(() => {
    const hints: Array<{ label: string; value: string }> = [];
    if (!currentWord) return hints;

    if (hintsUsed >= 1) {
      hints.push({
        label: $t('exercises.sentence_completion.hints.letters', { value: String(currentWord.word?.length ?? 0) }),
        value: '',
      });
    }
    if (hintsUsed >= 2) {
      hints.push({
        label: $t('exercises.sentence_completion.hints.starts_with', { value: currentWord.word?.[0]?.toUpperCase() ?? '—' }),
        value: '',
      });
    }
    if (hintsUsed >= 3) {
      hints.push({
        label: $t('exercises.sentence_completion.hints.ends_with', { value: currentWord.word?.[currentWord.word.length - 1]?.toUpperCase() ?? '—' }),
        value: '',
      });
    }
    if (hintsUsed >= 4) {
      hints.push({
        label: $t('exercises.sentence_completion.hints.answer', { value: currentWord.word }),
        value: '',
      });
    }
    return hints;
  });

  let canShowMoreHints = $derived(hintsUsed < 4);
  let isRevealed = $derived(hintsUsed >= 4);

  function showHint() {
    if (canShowMoreHints) {
      hintsUsed++;
    }
  }

  function checkAnswer(response: string) {
    if (!currentWord || feedbackState === 'correct') return;

    const cleaned = response.trim().toLowerCase();
    const target = currentWord.word.trim().toLowerCase();
    const correct = cleaned === target;

    if (correct) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  }

  function handleSelectChoice(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;

    const selected = options[index]?.toLowerCase();
    const correct = selected === currentWord.word.toLowerCase();

    if (correct) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  }

  async function handleCorrect() {
    feedbackState = 'correct';
    playCorrectSound();
    score++;
    results.push({ word: currentWord, correct: true, hintsUsed });

    const responseTime = Date.now() - startTime;

    await recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'sentence-completion' as ExerciseType,
      correct: true,
      response: currentWord.word,
      cue_level_used: hintsUsed > 0 ? hintsUsed : undefined,
      response_time_ms: responseTime,
      timestamp: new Date(),
      language,
    });

    const quality = Math.max(0, 5 - hintsUsed);
    await updateAfterAttempt(currentWord.id, language, quality);

    setTimeout(nextWord, 1500);
  }

  function handleIncorrect() {
    feedbackState = 'incorrect';
    playIncorrectSound();
    setTimeout(() => {
      feedbackState = 'none';
      selectedIndex = null;
    }, 1500);
  }

  function skipWord() {
    results.push({ word: currentWord, correct: false, hintsUsed });
    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'sentence-completion' as ExerciseType,
      correct: false,
      response: '',
      cue_level_used: hintsUsed > 0 ? hintsUsed : undefined,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });
    updateAfterAttempt(currentWord.id, language, 0);
    nextWord();
  }

  function nextWord() {
    feedbackState = 'none';
    hintsUsed = 0;
    startTime = Date.now();
    selectedIndex = null;
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    currentIndex = 0;
    score = 0;
    results = [];
    feedbackState = 'none';
    hintsUsed = 0;
    selectedIndex = null;
    startTime = Date.now();
  }

  // Card state helper for choice mode
  function getCardState(index: number): 'default' | 'selected' | 'correct' | 'incorrect' {
    if (feedbackState === 'none') {
      return selectedIndex === index ? 'selected' : 'default';
    }
    if (index === correctOptionIndex) return 'correct';
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
  <div class="exercise-container" role="region" aria-label={$t('exercises.sentence_completion.fill_blank')}>
    <!-- Progress bar -->
    <ProgressBar value={progress} label={`${currentIndex + 1} ${$t('common.of')} ${words.length}`} showPercentage />

    <!-- Title -->
    <h2 class="section-title">{$t('exercises.sentence_completion.fill_blank')}</h2>

    <!-- Sentence display -->
    <div class="sentence-area">
      {#if currentWord.sentence}
        <p class="sentence">
          <span class="sentence-part">{sentenceParts.before}</span>
          <span class="blank" class:filled={feedbackState === 'correct' || isRevealed}>
            {#if feedbackState === 'correct' || isRevealed}
              {currentWord.word}
            {:else}
              ___________
            {/if}
          </span>
          <span class="sentence-part">{sentenceParts.after}</span>
        </p>
      {:else}
        <p class="sentence-fallback">{$t('exercises.sentence_completion.complete_sentence')}: <strong>{currentWord.word}</strong></p>
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
        <span>🔄</span>
        <span>{$t('feedback.try_again')}</span>
      </div>
    {/if}

    <!-- Hints -->
    {#if revealedHints.length > 0}
      <div class="hints-area">
        {#each revealedHints as hint, i}
          <div class="hint-chip" class:latest={i === revealedHints.length - 1}>
            <span>{hint.label}</span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Input -->
    {#if feedbackState !== 'correct'}
      <div class="answer-area">
        {#if inputMode === 'choice'}
          <!-- Multiple choice grid -->
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
        {:else}
          <!-- Open input mode (speech/text) -->
          <SpeechInput
            language={speechLang}
            placeholder={$t('exercises.sentence_completion.fill_blank')}
            onresult={checkAnswer}
            disabled={isRevealed}
          />
        {/if}

        <div class="button-row">
          <button
            class="hint-button"
            onclick={showHint}
            disabled={!canShowMoreHints}
            aria-label={$t('exercises.picture_naming.hint')}
          >
            💡 {$t('exercises.picture_naming.hint')} ({4 - hintsUsed} {$t('exercises.sentence_completion.remaining')})
          </button>

          <button class="skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
            ⏭️ {$t('common.skip')}
          </button>
        </div>
      </div>
    {/if}

    <!-- If fully revealed, auto-advance -->
    {#if isRevealed && feedbackState !== 'correct'}
      <div class="revealed-message">
        <p>{$t('feedback.the_answer_was', { answer: currentWord.word })}</p>
      </div>
      <button class="next-btn" onclick={skipWord} aria-label={$t('common.next')}>
        {$t('common.next')} →
      </button>
    {/if}
  </div>
{/if}

{#if isFinished}
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>
    <!-- Star rating -->
    <div class="star-rating">
      {#if words.length > 0 && (score / words.length) >= 0.9}
        ⭐⭐⭐ {$t('feedback.excellent')}
      {:else if words.length > 0 && (score / words.length) >= 0.7}
        ⭐⭐ {$t('feedback.very_good')}
      {:else if words.length > 0 && (score / words.length) >= 0.5}
        ⭐ {$t('feedback.good_job')}
      {:else}
        {$t('feedback.keep_practicing')}
      {/if}
    </div>
    <p class="summary-score">{$t('feedback.score')}: {score} / {words.length}</p>
    <div class="summary-details">
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          {#if result.hintsUsed > 0}
            <span class="result-hints">💡×{result.hintsUsed}</span>
          {/if}
        </div>
      {/each}
    </div>
    <button class="back-to-exercises-btn" onclick={() => window.location.href = '/exercises'}>
      ← {$t('common.back_to_exercises')}
    </button>
    <button class="restart-btn" onclick={restart}>
      🔄 {$t('common.restart')}
    </button>
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

  .section-title {
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
  }

  /* Sentence area */
  .sentence-area {
    width: 100%;
    padding: var(--space-lg, 24px);
    background: var(--surface, #f9fafb);
    border-radius: var(--radius-lg, 16px);
    border: 2px solid var(--border, #e5e7eb);
    box-sizing: border-box;
  }

  .sentence {
    font-size: var(--font-size-xl, 24px);
    font-weight: 600;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
    line-height: 1.6;
  }

  .sentence-part {
    color: var(--text, #1f2937);
  }

  .blank {
    display: inline-block;
    min-width: 100px;
    border-bottom: 3px solid var(--primary, #3b82f6);
    color: var(--primary, #3b82f6);
    font-weight: 800;
    text-align: center;
    transition: all 0.3s ease;
    padding: 0 4px;
  }

  .blank.filled {
    border-bottom-color: var(--success, #22c55e);
    color: var(--success, #22c55e);
    background: rgba(34, 197, 94, 0.1);
    border-radius: var(--radius-sm, 4px);
  }

  .sentence-fallback {
    font-size: var(--font-size-lg, 20px);
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
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

  /* Hints */
  .hints-area {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 400px;
  }

  .hint-chip {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    background: var(--surface-2, #f3f4f6);
    border-radius: var(--radius-md, 12px);
    font-size: var(--font-size-base, 16px);
    color: var(--text-muted, #6b7280);
    animation: slideIn 0.3s ease;
  }

  .hint-chip.latest {
    color: var(--primary, #3b82f6);
    font-weight: 600;
    background: var(--primary-light, #eff6ff);
  }

  /* Answer area */
  .answer-area {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  /* Options grid (multiple choice) */
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

  .button-row {
    display: flex;
    gap: var(--space-sm, 8px);
    justify-content: center;
    flex-wrap: wrap;
  }

  .hint-button,
  .skip-button {
    min-height: 56px;
    min-width: 56px;
    padding: 12px 24px;
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition: background var(--transition-fast, 0.15s), transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .hint-button {
    background: var(--surface-2, #f3f4f6);
    color: var(--text, #1f2937);
  }

  .hint-button:hover:not(:disabled) {
    background: var(--primary-light, #eff6ff);
    border-color: var(--primary, #3b82f6);
  }

  .skip-button {
    background: transparent;
    color: var(--text-muted, #6b7280);
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
  }

  .hint-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Revealed */
  .revealed-message {
    padding: var(--space-md, 16px);
    background: rgba(59, 130, 246, 0.1);
    border-radius: var(--radius-md, 12px);
    text-align: center;
  }

  .revealed-message p {
    margin: 0;
    font-size: var(--font-size-lg, 20px);
    font-weight: 600;
    color: var(--primary, #3b82f6);
  }

  .next-btn {
    min-height: 56px;
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

  .next-btn:hover {
    filter: brightness(1.1);
  }

  .next-btn:active {
    transform: scale(0.97);
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

  .star-rating {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    text-align: center;
    margin: var(--space-sm, 8px) 0;
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

  .result-hints {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
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
