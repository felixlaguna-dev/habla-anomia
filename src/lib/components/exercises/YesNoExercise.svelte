<script lang="ts">
  // "Verdadero o falso" — binary yes/no semantic feature verification.
  //
  // The easiest exercise type: the patient sees a word IMAGE + its written word
  // and ONE statement about it (category, location, or function). They press
  // "Sí" or "No" — two giant buttons, min 96px tall, designed for the most
  // severely impaired users. 50/50 true/false mix. Incorrect answers reveal the
  // truth with TTS and advance (no retry).

  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { getWordCategories, CATEGORIES } from '$lib/types';
  import { resolveImageUrl, shuffleArray } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { ExerciseShell, FeedbackBanner, SpeakButton, FEEDBACK_TIMINGS } from './shared';
  import './shared/exercise-common.css';
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
      details: Array<{ word: Word; correct: boolean }>;
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

  const EXERCISE_TYPE = 'yes-no' as ExerciseType;

  // ── Statement types ──────────────────────────────────────────────────
  type StatementType = 'category' | 'location' | 'function';

  interface Round {
    word: Word;
    /** The statement shown to the user. */
    statement: string;
    /** Whether the statement is true for this word. */
    isTrue: boolean;
    /** The true statement — used for feedback correction text. */
    correctionText: string;
    /** Which feature dimension the statement tests. */
    statementType: StatementType;
  }

  /** Build the statement text for a feature type + value. */
  function statementText(type: StatementType, value: string): string {
    switch (type) {
      case 'category':
        return $t('exercises.yes_no.statement_category', { value });
      case 'location':
        return $t('exercises.yes_no.statement_location', { value });
      case 'function':
        return $t('exercises.yes_no.statement_function', { value });
    }
  }

  /** Get the feature value for a statement type from a word. */
  function featureValue(word: Word, type: StatementType): string {
    switch (type) {
      case 'category':
        // features.category is a Category key like 'animals'; resolve to i18n label.
        return $t(`categories.${word.features.category}`);
      case 'location':
        return word.features.location;
      case 'function':
        return word.features.function;
    }
  }

  /**
   * Find a plausible false value for a statement.
   * - category: pick any category different from the word's own
   * - location/function: pick the feature from a different word in a different category
   */
  function falseValue(word: Word, type: StatementType, pool: Word[]): string | null {
    const wordCats = new Set(getWordCategories(word));

    if (type === 'category') {
      const otherCats = CATEGORIES.filter((c) => !wordCats.has(c));
      if (otherCats.length === 0) return null;
      return $t(`categories.${shuffleArray(otherCats)[0]}`);
    }

    // location / function: source from a word with no category overlap
    const correctVal = featureValue(word, type).trim().toLowerCase();
    const candidates = pool.filter((w) => {
      if (w.id === word.id) return false;
      if (getWordCategories(w).some((c) => wordCats.has(c))) return false;
      const val = featureValue(w, type).trim();
      return val !== '' && val.toLowerCase() !== correctVal;
    });
    if (candidates.length === 0) return null;
    return featureValue(shuffleArray(candidates)[0], type);
  }

  /**
   * Generate rounds: one statement per session word.
   * Statement type is randomised per word; true/false is balanced ~50/50
   * across the session (shuffled, then assigned in order).
   */
  function generateRounds(sessionWords: Word[], pool: Word[]): Round[] {
    const types: StatementType[] = ['category', 'location', 'function'];

    // Build a true/false mask: aim for 50/50, shuffle so they interleave.
    const n = sessionWords.length;
    const trueCount = Math.ceil(n / 2);
    const mask: boolean[] = [
      ...Array(trueCount).fill(true),
      ...Array(n - trueCount).fill(false),
    ];
    const shuffledMask = shuffleArray(mask);

    // Deduplicate pool (session + allWords) once for false-statement sourcing.
    const dedupedPool = [...new Map([...sessionWords, ...pool].map((w) => [w.id, w])).values()];

    const rounds: Round[] = [];

    for (let i = 0; i < sessionWords.length; i++) {
      const word = sessionWords[i];
      const isTrue = shuffledMask[i];
      const stmtType = shuffleArray(types)[0];
      const trueVal = featureValue(word, stmtType);

      // Skip words with empty feature values for this type.
      if (!trueVal || !trueVal.trim()) continue;

      const correctionText = statementText(stmtType, trueVal);

      let statement: string;
      let actualIsTrue = isTrue;
      if (isTrue) {
        statement = correctionText;
      } else {
        const falseVal = falseValue(word, stmtType, dedupedPool);
        if (falseVal === null) {
          // Can't build a false statement — fall back to true for this word.
          actualIsTrue = true;
          statement = correctionText;
        } else {
          statement = statementText(stmtType, falseVal);
        }
      }

      rounds.push({
        word,
        statement,
        isTrue: actualIsTrue,
        correctionText,
        statementType: stmtType,
      });
    }

    return rounds;
  }

  // ── State ──
  let rounds = $state<Round[]>([]);
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let selectedAnswer = $state<boolean | null>(null); // true = Sí, false = No
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
  let trialRecorded = $state(false);
  let imageError = $state(false);

  // ── TTS ──
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => {
      tts.destroy();
      roundTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));

  const roundTimer = createCancellableTimer();

  // Generate rounds when the word list changes (init / restart / retry).
  $effect(() => {
    roundTimer.clear();
    rounds = generateRounds(words, allWords);
    currentIndex = 0;
    results = [];
  });

  let currentRound = $derived(rounds[currentIndex]);
  let isFinished = $derived(currentIndex >= rounds.length);
  let hasEnoughRounds = $derived(rounds.length > 0);

  // Reset per-round state when the round changes.
  $effect(() => {
    if (!currentRound) return;
    roundTimer.clear();
    selectedAnswer = null;
    feedbackState = 'none';
    trialRecorded = false;
    imageError = false;
    startTime = Date.now();
  });

  function recordCurrentTrial(correct: boolean) {
    if (!currentRound || trialRecorded) return;
    trialRecorded = true;
    results.push({ word: currentRound.word, correct });
    recordTrial({
      wordId: currentRound.word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response: selectedAnswer === null ? '' : selectedAnswer ? 'sí' : 'no',
      responseTimeMs: Date.now() - startTime,
    });
  }

  function answer(userSaysYes: boolean) {
    if (!currentRound || feedbackState !== 'none') return;
    selectedAnswer = userSaysYes;
    const correct = userSaysYes === currentRound.isTrue;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    recordCurrentTrial(correct);

    if (correct) {
      roundTimer.schedule(nextRound, FEEDBACK_TIMINGS.correctAdvance);
    } else {
      // Speak the correction, then advance (reveal policy, no retry).
      if (speakButtonsEnabled) {
        tts.speak(currentRound.correctionText, speechLang);
      }
      roundTimer.schedule(nextRound, FEEDBACK_TIMINGS.incorrectRevealAdvance);
    }
  }

  function skipRound() {
    if (!currentRound) return;
    recordCurrentTrial(false);
    nextRound();
  }

  function nextRound() {
    roundTimer.clear();
    tts.cancel();
    if (isFinished) return;
    currentIndex++;
    if (currentIndex >= rounds.length) {
      oncomplete?.({ score, total: rounds.length, details: results });
    }
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: 2, // 1 = Sí, 2 = No
    onSelectOption: (index) => answer(index === 0), // 0 = Sí, 1 = No
    onConfirm: () => {
      if (feedbackState === 'correct' || feedbackState === 'incorrect') nextRound();
    },
    onSkip: skipRound,
    isActive: !isFinished && !!currentRound,
  });

  // Feedback banner text for incorrect responses.
  let feedbackText = $derived.by(() => {
    if (!currentRound) return '';
    if (feedbackState === 'correct') {
      return $t('exercises.yes_no.correct');
    }
    // Incorrect: show the correct answer with the true statement.
    if (currentRound.isTrue) {
      return $t('exercises.yes_no.correction_true', { text: currentRound.correctionText });
    }
    return $t('exercises.yes_no.correction_false', { text: currentRound.correctionText });
  });

  function speakCorrection() {
    if (!currentRound) return;
    tts.speak(currentRound.correctionText, speechLang);
  }

  function speakWord() {
    if (!currentRound) return;
    tts.speak(currentRound.word.word, speechLang);
  }
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !hasEnoughRounds}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentRound}
  <ExerciseShell
    current={currentIndex}
    total={rounds.length}
    ariaLabel={$t('exercises.yes_no.name')}
    {keyboardNavParams}
    active={!isFinished}
  >
    <!-- Word image + label -->
    <div class="stimulus-area">
      <div class="exercise-image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
        {#if !imageError}
          <img
            src={resolveImageUrl(currentRound.word.image_url)}
            alt={currentRound.word.word}
            class="stimulus-image"
            onerror={() => { imageError = true; }}
          />
        {:else}
          <div class="image-fallback">
            <span class="fallback-letter">{currentRound.word.word[0]?.toUpperCase() ?? '?'}</span>
            <span class="fallback-hint" aria-hidden="true">📷</span>
          </div>
        {/if}
      </div>
      <div class="word-label-row">
        <span class="word-label">{currentRound.word.word}</span>
        {#if speakButtonsEnabled}
          <SpeakButton
            size="inline"
            disabled={tts.isSpeaking}
            isSpeaking={tts.isSpeaking}
            onclick={speakWord}
          />
        {/if}
      </div>
    </div>

    <!-- Statement -->
    <div class="statement-card" class:true={currentRound.isTrue && feedbackState !== 'none'} class:false={!currentRound.isTrue && feedbackState !== 'none'}>
      <p class="statement-prompt">{$t('exercises.yes_no.prompt')}</p>
      <p class="statement-text">{currentRound.statement}</p>
    </div>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={feedbackText}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={speakWord}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner
          state="incorrect"
          text={feedbackText}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={speakCorrection}
        />
      {/if}
    </div>

    <!-- Giant Yes / No buttons -->
    <div class="answer-buttons">
      <button
        type="button"
        class="answer-btn yes-btn"
        class:correct={feedbackState === 'correct' && currentRound.isTrue}
        class:incorrect={feedbackState === 'incorrect' && selectedAnswer === true}
        onclick={() => answer(true)}
        disabled={feedbackState !== 'none'}
        aria-label={$t('exercises.yes_no.yes')}
      >
        <span class="answer-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span class="answer-label">{$t('exercises.yes_no.yes')}</span>
      </button>
      <button
        type="button"
        class="answer-btn no-btn"
        class:correct={feedbackState === 'correct' && !currentRound.isTrue}
        class:incorrect={feedbackState === 'incorrect' && selectedAnswer === false}
        onclick={() => answer(false)}
        disabled={feedbackState !== 'none'}
        aria-label={$t('exercises.yes_no.no')}
      >
        <span class="answer-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="answer-label">{$t('exercises.yes_no.no')}</span>
      </button>
    </div>

    <!-- Skip -->
    {#if feedbackState === 'none'}
      <button type="button" class="exercise-skip-button" onclick={skipRound} aria-label={$t('common.skip')}>
        ⏭️ {$t('common.skip')}
      </button>
    {/if}
  </ExerciseShell>
{/if}

<style>
  /* Stimulus area: image + word label */
  .stimulus-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .word-label-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .word-label {
    font-size: var(--font-size-2xl, 30px);
    font-weight: 700;
    color: var(--text, #f1f5f9);
    text-align: center;
  }

  /* Statement card */
  .statement-card {
    width: 100%;
    max-width: 500px;
    padding: var(--space-lg, 24px) var(--space-md, 16px);
    background: var(--surface, #1e293b);
    border: 3px solid var(--border, #475569);
    border-radius: var(--radius-lg, 16px);
    text-align: center;
    transition:
      border-color var(--transition-fast, 0.15s),
      background var(--transition-fast, 0.15s);
  }

  .statement-card.true {
    border-color: var(--success, #22c55e);
    background: rgba(34, 197, 94, 0.1);
  }

  .statement-card.false {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
  }

  .statement-prompt {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-dim, #94a3b8);
    margin: 0 0 var(--space-xs, 4px) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .statement-text {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #f1f5f9);
    margin: 0;
    line-height: 1.4;
  }

  /* Giant Yes/No buttons — min 96px tall, designed for severe aphasia */
  .answer-buttons {
    display: flex;
    gap: var(--space-md, 16px);
    width: 100%;
    max-width: 500px;
  }

  .answer-btn {
    flex: 1;
    min-height: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs, 4px);
    padding: var(--space-md, 16px);
    border: 4px solid;
    border-radius: var(--radius-lg, 16px);
    font-family: var(--font-family, sans-serif);
    font-weight: 800;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    transition:
      background var(--transition-fast, 0.15s),
      border-color var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
  }

  .yes-btn {
    background: rgba(34, 197, 94, 0.15);
    border-color: var(--success, #22c55e);
    color: var(--success, #22c55e);
  }

  .no-btn {
    background: rgba(239, 68, 68, 0.15);
    border-color: var(--error, #ef4444);
    color: var(--error, #ef4444);
  }

  .answer-btn:hover:not(:disabled) {
    transform: scale(1.02);
  }

  .answer-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .answer-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 3px;
  }

  .answer-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* Feedback visual states */
  .answer-btn.correct {
    opacity: 1;
    background: rgba(34, 197, 94, 0.3);
    border-color: var(--success, #22c55e);
    animation: correctFlash 0.6s ease;
  }

  .answer-btn.incorrect {
    opacity: 1;
    background: rgba(239, 68, 68, 0.3);
    border-color: var(--error, #ef4444);
    animation: shakeBtn 0.5s ease-in-out;
  }

  .answer-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .answer-label {
    font-size: var(--font-size-2xl, 30px);
    line-height: 1;
  }

  /* Animations */
  @keyframes correctFlash {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes shakeBtn {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }

  /* Tablet: side-by-side layout via ExerciseShell tabletColumns */
  @media (min-width: 768px) {
    .stimulus-area {
      max-width: 350px;
    }

    .answer-buttons {
      max-width: 600px;
    }

    .answer-btn {
      min-height: 120px;
    }

    .answer-label {
      font-size: var(--font-size-3xl, 40px);
    }

    .statement-card {
      max-width: 600px;
    }

    .statement-text {
      font-size: var(--font-size-2xl, 30px);
    }
  }
</style>
