<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { buildDistractors } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playFeedback } from '$lib/utils/feedback';
  import { ExerciseShell, OptionGrid, FeedbackBanner, SpeakButton, FEEDBACK_TIMINGS } from './shared';
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

  const EXERCISE_TYPE = 'sentence-completion' as ExerciseType;

  // --- State ---
  let currentIndex = $state(0);
  let hintsUsed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let results = $state<Array<{ word: Word; correct: boolean; hintsUsed: number }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
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
    startTime = Date.now();
  });

  // Sentence with blank
  let sentenceParts = $derived.by(() => {
    if (!currentWord?.sentence) return { before: '', after: '' };
    const parts = currentWord.sentence.split('_____');
    return { before: parts[0] || '', after: parts[1] || '' };
  });

  let isRevealed = $derived(hintsUsed >= 4);

  // Hint ladder
  let revealedHints = $derived.by(() => {
    const hints: string[] = [];
    if (!currentWord) return hints;

    if (hintsUsed >= 1) {
      hints.push($t('exercises.sentence_completion.hints.letters', { value: String(currentWord.word?.length ?? 0) }));
    }
    if (hintsUsed >= 2) {
      hints.push($t('exercises.sentence_completion.hints.starts_with', { value: currentWord.word?.[0]?.toUpperCase() ?? '—' }));
    }
    if (hintsUsed >= 3) {
      hints.push($t('exercises.sentence_completion.hints.ends_with', { value: currentWord.word?.[currentWord.word.length - 1]?.toUpperCase() ?? '—' }));
    }
    if (hintsUsed >= 4) {
      hints.push($t('exercises.sentence_completion.hints.answer', { value: currentWord.word }));
    }
    return hints;
  });

  let canShowMoreHints = $derived(hintsUsed < 4);
  let hintLabel = $derived($t('exercises.hints_used', { used: String(hintsUsed), total: '4' }));

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

  // Pending per-word timer.
  const wordTimer = createCancellableTimer();

  // --- Selection (retry mode) ---
  function handleSelectChoice(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;
    const selectedWord = optionWords[index];
    const correct = !!selectedWord && selectedWord.id === currentWord.id;

    feedbackState = correct ? 'correct' : 'incorrect';
    playFeedback(correct);

    recordCurrentTrial(correct, selectedWord?.word ?? '');

    if (correct) {
      wordTimer.schedule(nextWord, FEEDBACK_TIMINGS.correctAdvance);
    } else {
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
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={$t('exercises.sentence_completion.fill_blank')}
    {keyboardNavParams}
    tabletColumns="1fr 1fr"
    active={!isFinished}
  >
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
              {#if speakButtonsEnabled}
                <SpeakButton size="inline" isSpeaking={tts.isSpeaking} onclick={() => speak(currentWord.word)} />
              {/if}
            {:else}
              ___________
            {/if}
          </span>
          <span class="sentence-part">{sentenceParts.after}</span>
        </p>
      {:else}
        <p class="sentence-fallback">
          {$t('exercises.sentence_completion.complete_sentence')}: <strong>{currentWord.word}</strong>
          {#if speakButtonsEnabled}
            <SpeakButton size="inline" isSpeaking={tts.isSpeaking} onclick={() => speak(currentWord.word)} />
          {/if}
        </p>
      {/if}
    </div>

    <!-- Feedback -->
    {#if feedbackState !== 'none'}
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
    {/if}

    <!-- Hints -->
    {#if revealedHints.length > 0}
      <div class="exercise-hints">
        {#each revealedHints as hint, i}
          <div class="exercise-hint-chip" class:latest={i === revealedHints.length - 1}>
            {hint}
          </div>
        {/each}
      </div>
    {/if}

    <!-- If fully revealed, show the answer and a next button -->
    {#if isRevealed && feedbackState !== 'correct'}
      <div class="revealed-message">
        <p>
          {$t('feedback.the_answer_was', { answer: currentWord.word })}
          {#if speakButtonsEnabled}
            <SpeakButton size="inline" isSpeaking={tts.isSpeaking} onclick={() => speak(currentWord.word)} />
          {/if}
        </p>
      </div>
      <button type="button" class="next-btn" onclick={skipWord} aria-label={$t('common.next')}>
        {$t('common.next')} →
      </button>
    {:else if feedbackState !== 'correct'}
      <!-- Answer input -->
      <div class="exercise-answer-area">
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

        <div class="exercise-button-row">
          <button
            type="button"
            class="exercise-action-button"
            onclick={showHint}
            disabled={!canShowMoreHints}
            aria-label={`${$t('exercises.sentence_completion.hint')} — ${hintLabel}`}
          >
            💡 {$t('exercises.sentence_completion.hint')}
          </button>

          <button type="button" class="exercise-skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
            ⏭️ {$t('common.skip')}
          </button>
        </div>
        <span class="hint-counter" aria-hidden="true">{hintLabel}</span>
      </div>
    {/if}
  </ExerciseShell>
{/if}

<style>
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
    padding: var(--space-sm, 8px) var(--space-md, 16px);
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

  .sentence-part { color: var(--text, #1f2937); }

  .blank {
    display: inline-flex;
    align-items: center;
    gap: 4px;
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

  /* Revealed message */
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
    transition:
      background var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .next-btn:hover { filter: brightness(1.1); }
  .next-btn:active { transform: scale(0.97); }
  .next-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Tablet: sentence left, options right (grid provided by ExerciseShell) */
  @media (min-width: 768px) {
    .sentence-area {
      padding: var(--space-lg, 24px);
    }

    .section-title,
    .feedback-slot,
    .exercise-hints,
    .revealed-message,
    .next-btn {
      grid-column: 1 / -1;
    }

    .sentence-area { grid-column: 1; }

    .exercise-answer-area {
      grid-column: 2;
      max-width: none;
    }
  }
</style>
