<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { resolveImageUrl, buildDistractors } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playFeedback } from '$lib/utils/feedback';
  import { ExerciseShell, OptionGrid, FeedbackBanner, FEEDBACK_TIMINGS } from './shared';
  import './shared/exercise-common.css';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';

  type Props = {
    words: Word[];
    allWords?: Word[];
    language?: Language;
    speechRate?: number;
    ttsVoiceUri?: string | null;
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
    ttsVoiceUri = null,
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
  $effect(() => tts.setVoiceUri(ttsVoiceUri));

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
  let hintLabel = $derived($t('exercises.hints_used', { used: String(hintsUsed), total: '5' }));

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
    playFeedback(correct);

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
  <div class="exercise-error">
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
    <div class="exercise-image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('exercises.picture_naming.what_is_this')}
          class="stimulus-image"
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

    <!-- Answer input -->
    {#if feedbackState !== 'correct'}
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
            aria-label={`${$t('exercises.picture_naming.hint')} — ${hintLabel}`}
          >
            💡 {$t('exercises.picture_naming.hint')}
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
  /* Picture naming uses a larger image than the default 300px */
  .exercise-image-area {
    max-width: 350px;
  }

  .prompt {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
  }

  /* Tablet: image left, options right (grid provided by ExerciseShell) */
  @media (min-width: 768px) {
    .exercise-image-area {
      grid-column: 1;
      grid-row: 1 / span 20;
      max-width: 350px;
      max-height: 350px;
      aspect-ratio: auto;
      align-self: start;
    }

    .prompt,
    .feedback-slot,
    .exercise-hints,
    .exercise-answer-area {
      grid-column: 2;
    }

    .exercise-answer-area {
      max-width: none;
    }
  }
</style>
