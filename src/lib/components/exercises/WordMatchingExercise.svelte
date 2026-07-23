<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import {
    resolveImageUrl,
    buildDistractors,
    optionTextFor,
    type DistractorKind,
  } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { ExerciseShell, OptionGrid, FeedbackBanner, SpeakButton, ExerciseSummary, FEEDBACK_TIMINGS } from './shared';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';

  type MatchingMode = 'word-to-definition' | 'definition-to-word' | 'image-to-word';

  type Props = {
    words: Word[];
    allWords?: Word[];
    language?: Language;
    speechRate?: number;
    speakButtonsEnabled?: boolean;
    mode?: MatchingMode;
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
    mode = 'word-to-definition',
    oncomplete,
    onrestart,
  }: Props = $props();

  const EXERCISE_TYPE = 'word-matching' as ExerciseType;
  // Options show definitions in word-to-definition mode, words otherwise.
  const optionKind: DistractorKind = mode === 'word-to-definition' ? 'definition' : 'word';

  // --- State ---
  let currentIndex = $state(0);
  let selectedIndex = $state<number | null>(null);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let optionWords = $state<Word[]>([]);
  let options = $derived(optionWords.map((w) => optionTextFor(w, optionKind)));
  let correctIndex = $derived(optionWords.findIndex((w) => w.id === currentWord?.id));
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());

  // --- TTS ---
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => {
      tts.destroy();
      advanceTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));

  function speak(text?: string) {
    tts.speak(text ?? currentWord?.word, speechLang);
  }

  let currentWord = $derived(words[currentIndex]);
  let isFinished = $derived(currentIndex >= words.length);

  // Rebuild options + reset per-word state when the current word changes.
  $effect(() => {
    if (!currentWord) return;
    advanceTimer.clear();
    optionWords = buildDistractors(currentWord, words, allWords, optionKind);
    selectedIndex = null;
    feedbackState = 'none';
    startTime = Date.now();
  });

  let promptText = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'word-to-definition') return currentWord.word;
    if (mode === 'definition-to-word') return currentWord.definition;
    return '';
  });

  let promptLabel = $derived.by(() => {
    if (mode === 'word-to-definition') return $t('exercises.word_matching.match_definition');
    if (mode === 'definition-to-word') return $t('exercises.word_matching.match_word');
    return $t('exercises.word_matching.select_answer');
  });

  // Pending feedback→advance timer. Cleared on advance / word change so an early
  // Enter or skip can't fire nextWord twice (which would silently drop a word).
  const advanceTimer = createCancellableTimer();

  function handleSelect(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;
    const correct = index === correctIndex;
    const word = currentWord;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    results.push({ word, correct });
    recordTrial({
      wordId: word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response: options[index] ?? '',
      responseTimeMs: Date.now() - startTime,
    });

    advanceTimer.schedule(
      nextWord,
      correct ? FEEDBACK_TIMINGS.correctAdvance : FEEDBACK_TIMINGS.incorrectRevealAdvance,
    );
  }

  function skipWord() {
    // Reveal mode: skipping during the feedback window is a no-op — the trial
    // is already recorded and a queued advance is pending.
    if (!currentWord || feedbackState !== 'none') return;
    const word = currentWord;
    results.push({ word, correct: false });
    recordTrial({
      wordId: word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct: false,
      response: '',
      responseTimeMs: Date.now() - startTime,
    });
    nextWord();
  }

  function nextWord() {
    advanceTimer.clear();
    currentIndex++;
    startTime = Date.now();
    if (currentIndex >= words.length) {
      oncomplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    advanceTimer.clear();
    currentIndex = 0;
    selectedIndex = null;
    feedbackState = 'none';
    results = [];
    startTime = Date.now();
  }

  function handleRestart() {
    restart();
    onrestart?.();
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(options.length, 4),
    onSelectOption: (index) => handleSelect(index),
    onConfirm: () => {
      if (feedbackState !== 'none') nextWord();
    },
    onSkip: skipWord,
    isActive: !isFinished && !!currentWord,
  });

  function getRandomEncouragement() {
    const msgs = [
      $t('feedback.correct'),
      $t('feedback.well_done'),
      $t('feedback.excellent'),
      $t('feedback.keep_going'),
      $t('feedback.great_effort'),
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={$t('exercises.word_matching.select_answer')}
    {keyboardNavParams}
    tabletColumns="1fr 1fr"
    active={!isFinished}
  >
    <!-- Prompt label -->
    <p class="prompt-label">{promptLabel}</p>

    <!-- Prompt display -->
    <div class="prompt-area">
      {#if mode === 'image-to-word'}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('exercises.word_matching.select_answer')}
          class="prompt-image"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      {:else}
        <p class="prompt-text">{promptText}</p>
        {#if speakButtonsEnabled}
          <SpeakButton isSpeaking={tts.isSpeaking} onclick={() => speak(currentWord.word)} />
        {/if}
      {/if}
    </div>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={getRandomEncouragement()}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak()}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner
          state="incorrect"
          text={$t('feedback.the_answer_was', { answer: options[correctIndex] ?? '' })}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak(options[correctIndex])}
        />
      {/if}
    </div>

    <!-- Options -->
    <div class="options-slot">
      <OptionGrid
        {options}
        {feedbackState}
        {selectedIndex}
        {correctIndex}
        disabled={feedbackState !== 'none'}
        speakEnabled={speakButtonsEnabled}
        isSpeaking={tts.isSpeaking}
        onselect={handleSelect}
        onspeak={speak}
      />
    </div>

    <!-- Skip button -->
    <button
      type="button"
      class="skip-button"
      onclick={skipWord}
      disabled={feedbackState !== 'none'}
      aria-label={$t('common.skip')}
    >
      ⏭️ {$t('common.skip')}
    </button>
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
    gap: var(--space-lg, 24px);
    padding: var(--space-md, 16px);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
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

  .prompt-area {
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm, 8px);
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

  .skip-button {
    min-height: 56px;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    font-size: var(--font-size-md, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: transparent;
    color: var(--text-muted, #6b7280);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
  }

  .skip-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Tablet layout: prompt left, options right (the grid is provided by ExerciseShell) */
  @media (min-width: 768px) {
    .prompt-label,
    .feedback-slot,
    .skip-button {
      grid-column: 1 / -1;
    }

    .prompt-area {
      grid-column: 1;
    }

    .options-slot {
      grid-column: 2;
    }
  }
</style>
