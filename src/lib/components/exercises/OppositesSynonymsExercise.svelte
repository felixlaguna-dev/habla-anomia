<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { shuffleArray, getCardState } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playFeedback } from '$lib/utils/feedback';
  import { ExerciseShell, OptionGrid, FeedbackBanner, SpeakButton, FEEDBACK_TIMINGS } from './shared';
  import './shared/exercise-common.css';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';

  type ExerciseMode = 'opposites' | 'synonyms';

  type Props = {
    words: Word[];
    allWords?: Word[];
    language?: Language;
    mode?: ExerciseMode;
    speechRate?: number;
    speakButtonsEnabled?: boolean;
    oncomplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean }> }) => void;
    onrestart?: () => void;
  };

  let {
    words: rawWords,
    allWords = [],
    language = 'es' as Language,
    mode: modeProp = 'opposites' as ExerciseMode,
    speechRate = 0.8,
    speakButtonsEnabled = true,
    oncomplete,
    onrestart,
  }: Props = $props();

  const EXERCISE_TYPE = 'opposites-synonyms' as ExerciseType;

  // Auto-detect mode based on available word data
  let mode = $derived.by(() => {
    const hasOpposites = rawWords.some((w) => w.opposite && w.opposite !== '');
    if (modeProp === 'opposites' && !hasOpposites) return 'synonyms';
    if (modeProp === 'synonyms' && !rawWords.some((w) => w.synonyms && w.synonyms.length > 0)) return 'opposites';
    return modeProp;
  });

  // Filter out words without required fields depending on mode
  let words = $derived.by(() => {
    if (mode === 'opposites') {
      return rawWords.filter((w) => w.opposite && w.opposite !== '');
    }
    return rawWords.filter((w) => w.synonyms && w.synonyms.length > 0);
  });

  // --- State ---
  let currentIndex = $state(0);
  let selectedIndex = $state<number | null>(null);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let options = $state<string[]>([]);
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

  // The correct answer for the current mode
  let correctAnswer = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'opposites') return currentWord.opposite || '';
    return currentWord.synonyms?.[0] || '';
  });

  // All valid answers (case-insensitive) — any synonym counts, not just the first
  let validAnswers = $derived.by(() => {
    if (!currentWord) return [];
    if (mode === 'opposites') {
      return currentWord.opposite ? [currentWord.opposite.toLowerCase()] : [];
    }
    return (currentWord.synonyms || []).map((s) => s.toLowerCase());
  });

  let promptText = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'opposites') {
      return `${$t('exercises.opposites_synonyms.opposite_of')} '${currentWord.word}'?`;
    }
    return `${$t('exercises.opposites_synonyms.synonym_of')} '${currentWord.word}'?`;
  });

  // Build multiple-choice options. Distractors come from other words'
  // opposites/synonyms in the session, padded from the full word bank so we
  // never emit placeholder ("---") tappable answers.
  function buildOptions() {
    if (!currentWord || !correctAnswer) return;

    const distractorPool: string[] = [];
    const pool = [...rawWords, ...allWords];

    for (const w of pool) {
      if (w.id === currentWord.id) continue;
      if (mode === 'opposites' && w.opposite) {
        distractorPool.push(w.opposite);
      } else if (mode === 'synonyms' && w.synonyms?.length) {
        distractorPool.push(w.synonyms[0]);
      }
      distractorPool.push(w.word);
    }

    const shuffled = shuffleArray([...new Set(distractorPool)]);
    const distractors = shuffled
      .filter((d) => d.toLowerCase() !== correctAnswer.toLowerCase() && !validAnswers.includes(d.toLowerCase()))
      .slice(0, 3);

    options = shuffleArray([correctAnswer, ...distractors]);
  }

  // Reset per-word state when the current word changes.
  $effect(() => {
    if (!currentWord) return;
    advanceTimer.clear();
    selectedIndex = null;
    feedbackState = 'none';
    startTime = Date.now();
    buildOptions();
  });

  let correctIndex = $derived(options.findIndex((o) => o.toLowerCase() === correctAnswer.toLowerCase()));

  // Pending feedback→advance timer (reveal mode: one tap per word).
  const advanceTimer = createCancellableTimer();

  function handleSelect(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;

    // Any valid synonym/opposite scores correct, not just the primary.
    const isCorrect = validAnswers.includes(options[index]?.toLowerCase() ?? '');
    const word = currentWord;

    feedbackState = isCorrect ? 'correct' : 'incorrect';
    playFeedback(isCorrect);

    results.push({ word, correct: isCorrect });
    recordTrial({
      wordId: word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct: isCorrect,
      response: options[index] ?? '',
      responseTimeMs: Date.now() - startTime,
    });

    advanceTimer.schedule(
      nextWord,
      isCorrect ? FEEDBACK_TIMINGS.correctAdvance : FEEDBACK_TIMINGS.incorrectRevealAdvance,
    );
  }

  function skipWord() {
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
    if (currentIndex >= words.length) {
      oncomplete?.({ score, total: words.length, details: results });
    }
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
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={promptText}
    {keyboardNavParams}
    tabletColumns="1fr 1fr"
    active={!isFinished}
  >
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
      {#if speakButtonsEnabled}
        <SpeakButton isSpeaking={tts.isSpeaking} onclick={() => speak(currentWord.word)} />
      {/if}
    </div>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={$t('feedback.the_answer_was', { answer: correctAnswer })}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak(correctAnswer)}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner
          state="incorrect"
          text={$t('feedback.the_answer_was', { answer: correctAnswer })}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak(correctAnswer)}
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

    <!-- Skip -->
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

<style>
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

  .prompt-area {
    width: 100%;
    padding: var(--space-lg, 24px);
    background: var(--surface, #f9fafb);
    border-radius: var(--radius-lg, 16px);
    border: 2px solid var(--border, #e5e7eb);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm, 8px);
  }

  .prompt-text {
    font-size: var(--font-size-xl, 24px);
    font-weight: 800;
    color: var(--text, #1f2937);
    margin: 0;
    line-height: 1.4;
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

  .skip-button:hover:not(:disabled) {
    background: var(--surface-2, #f3f4f6);
  }

  .skip-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Tablet: prompt left, options right (grid provided by ExerciseShell) */
  @media (min-width: 768px) {
    .mode-badge,
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
