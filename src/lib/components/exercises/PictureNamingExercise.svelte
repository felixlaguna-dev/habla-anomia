<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { resolveImageUrl, buildDistractors } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { ExerciseShell, OptionGrid, FeedbackBanner, ExerciseSummary, FEEDBACK_TIMINGS } from './shared';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';

  type Props = {
    words: Word[];
    allWords?: Word[];
    language?: Language;
    speechRate?: number;
    speakButtonsEnabled?: boolean;
    oncomplete?: (results: {
      score: number;
      total: number;
      details: Array<{ word: Word; correct: boolean; hintsUsed: number }>;
    }) => void;
    onrestart?: () => void;
  };

  let {
    words,
    allWords = [],
    language = 'es' as Language,
    speechRate = 0.8,
    speakButtonsEnabled = true,
    oncomplete,
    onrestart,
  }: Props = $props();

  const EXERCISE_TYPE = 'picture-naming' as ExerciseType;

  // --- State ---
  let currentIndex = $state(0);
  let hintsUsed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let results = $state<Array<{ word: Word; correct: boolean; hintsUsed: number }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
  // Exactly one attempt is recorded per word (see recordTrial policy).
  let trialRecorded = $state(false);

  // --- TTS ---
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => {
      tts.destroy();
      wordTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));

  function speak(text?: string) {
    tts.speak(text ?? currentWord?.word, speechLang);
  }

  // --- Options ---
  let optionWords = $state<Word[]>([]);
  let options = $derived(optionWords.map((w) => w.word));
  let selectedIndex = $state<number | null>(null);

  let currentWord = $derived(words[currentIndex]);
  let correctOptionIndex = $derived(optionWords.findIndex((w) => w.id === currentWord?.id));
  let isFinished = $derived(currentIndex >= words.length);

  // Rebuild options + reset per-word state when the current word changes.
  $effect(() => {
    if (!currentWord) return;
    wordTimer.clear();
    optionWords = buildDistractors(currentWord, words, allWords, 'word');
    selectedIndex = null;
    feedbackState = 'none';
    trialRecorded = false;
    imageError = false;
    startTime = Date.now();
  });

  // --- Hints ---
  let revealedHints = $derived.by(() => {
    const hints: string[] = [];
    if (!currentWord) return hints;
    if (hintsUsed >= 1) {
      hints.push($t('exercises.picture_naming.hints.category', { value: currentWord.features?.category ?? '—' }));
    }
    if (hintsUsed >= 2) {
      hints.push($t('exercises.picture_naming.hints.first_letter', { value: currentWord.word?.[0]?.toUpperCase() ?? '—' }));
    }
    if (hintsUsed >= 3) {
      hints.push($t('exercises.picture_naming.hints.syllables', { value: String(currentWord.phonetic?.syllables ?? '—') }));
    }
    if (hintsUsed >= 4) {
      hints.push($t('exercises.picture_naming.hints.rhymes_with', { value: currentWord.phonetic?.rhyming_word ?? '—' }));
    }
    if (hintsUsed >= 5) {
      hints.push($t('exercises.picture_naming.hints.answer_is', { value: currentWord.word }));
    }
    return hints;
  });

  let canShowMoreHints = $derived(hintsUsed < 5);

  function showHint() {
    if (canShowMoreHints) hintsUsed++;
  }

  // Record the first tap for the current word exactly once; retries are no-ops.
  function recordCurrentTrial(correct: boolean, response: string) {
    if (!currentWord || trialRecorded) return;
    trialRecorded = true;
    const word = currentWord;
    const hints = hintsUsed;
    results.push({ word, correct, hintsUsed: hints });
    recordTrial({
      wordId: word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response,
      hintsUsed: hints,
      responseTimeMs: Date.now() - startTime,
    });
  }

  // Pending per-word timer (advance on correct, reset on incorrect). Cleared on
  // advance / word change so an early Enter or Escape can't fire it twice (which
  // would double-advance or reset the next word's state).
  const wordTimer = createCancellableTimer();

  // --- Selection (retry mode: wrong first tap is recorded, then the user can retry) ---
  function handleSelectChoice(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;
    const selectedWord = optionWords[index];
    const correct = !!selectedWord && selectedWord.id === currentWord.id;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    recordCurrentTrial(correct, selectedWord?.word ?? '');

    if (correct) {
      wordTimer.schedule(nextWord, FEEDBACK_TIMINGS.correctAdvance);
    } else {
      // Reset after the flash so the user gets another attempt (unrecorded).
      wordTimer.schedule(() => {
        feedbackState = 'none';
        selectedIndex = null;
      }, FEEDBACK_TIMINGS.incorrectRetryReset);
    }
  }

  function skipWord() {
    if (!currentWord) return;
    recordCurrentTrial(false, '');
    nextWord();
  }

  function nextWord() {
    wordTimer.clear();
    hintsUsed = 0;
    currentIndex++;
    if (currentIndex >= words.length) {
      oncomplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    wordTimer.clear();
    currentIndex = 0;
    results = [];
    feedbackState = 'none';
    hintsUsed = 0;
    imageError = false;
    selectedIndex = null;
    startTime = Date.now();
  }

  function handleRestart() {
    restart();
    onrestart?.();
  }

  function handleImageError() {
    imageError = true;
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(options.length, 4),
    onSelectOption: (index) => handleSelectChoice(index),
    onConfirm: () => {
      if (feedbackState === 'incorrect') nextWord();
    },
    onToggleHint: showHint,
    onSkip: skipWord,
    isActive: !isFinished && !!currentWord,
  });
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={$t('exercises.picture_naming.what_is_this')}
    {keyboardNavParams}
    tabletColumns="280px 1fr"
    active={!isFinished}
  >
    <!-- Image area -->
    <div class="image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('exercises.picture_naming.what_is_this')}
          class="exercise-image"
          onerror={handleImageError}
        />
      {:else}
        <div class="image-fallback">
          <span class="fallback-letter">{currentWord.word?.[0]?.toUpperCase() ?? '?'}</span>
          <span class="fallback-hint" aria-hidden="true">📷</span>
        </div>
      {/if}
    </div>

    <!-- Prompt -->
    <p class="prompt">{$t('exercises.picture_naming.what_is_this')}</p>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={currentWord.word}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak()}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner state="incorrect" icon="🔄" text={$t('feedback.try_again')} />
      {/if}
    </div>

    <!-- Hints -->
    {#if revealedHints.length > 0}
      <div class="hints-area">
        {#each revealedHints as hint, i}
          <div class="hint-chip" class:latest={i === revealedHints.length - 1}>
            {hint}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Answer input -->
    {#if feedbackState !== 'correct'}
      <div class="answer-area">
        <OptionGrid
          {options}
          {feedbackState}
          {selectedIndex}
          correctIndex={correctOptionIndex}
          disabled={feedbackState !== 'none'}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          twoColumns
          onselect={handleSelectChoice}
          onspeak={speak}
        />

        <div class="button-row">
          <button
            type="button"
            class="hint-button"
            onclick={showHint}
            disabled={!canShowMoreHints}
            aria-label={$t('exercises.picture_naming.hint')}
          >
            💡 {$t('exercises.picture_naming.hint')} ({5 - hintsUsed} {$t('common.of')} 5)
          </button>

          <button type="button" class="skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
            ⏭️ {$t('common.skip')}
          </button>
        </div>
      </div>
    {/if}
  </ExerciseShell>
{/if}

{#if isFinished}
  <ExerciseSummary
    {score}
    total={words.length}
    {results}
    speakEnabled={speakButtonsEnabled}
    isSpeaking={tts.isSpeaking}
    onSpeak={speak}
    onrestart={handleRestart}
  />
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
  }

  /* Image area */
  .image-area {
    width: 100%;
    max-width: 350px;
    aspect-ratio: 1;
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
    background: var(--surface, #f9fafb);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.3s ease;
  }

  .exercise-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: var(--space-md, 16px);
  }

  .image-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm, 8px);
    background: linear-gradient(135deg, var(--primary-light, #93c5fd), var(--primary, #3b82f6));
  }

  .fallback-letter {
    font-size: 72px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }

  .fallback-hint {
    font-size: 32px;
  }

  .prompt {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
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
    transition:
      background var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
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

  .hint-button:focus-visible,
  .skip-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  .correct-flash {
    box-shadow:
      0 0 0 4px var(--success, #22c55e),
      0 0 24px rgba(34, 197, 94, 0.3);
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-8px);
    }
    40% {
      transform: translateX(8px);
    }
    60% {
      transform: translateX(-4px);
    }
    80% {
      transform: translateX(4px);
    }
  }

  /* Tablet layout: image left, options right (the grid is provided by ExerciseShell) */
  @media (min-width: 768px) {
    .image-area {
      grid-column: 1;
      grid-row: 1 / span 20;
      max-width: none;
      width: 100%;
      max-height: 350px;
      aspect-ratio: auto;
      align-self: start;
    }

    .prompt,
    .feedback-slot,
    .hints-area,
    .answer-area {
      grid-column: 2;
    }

    .answer-area {
      max-width: none;
    }
  }
</style>
