<script lang="ts">
  // "Escucha y elige" — auditory comprehension exercise.
  //
  // The app SPEAKS a word (no text shown). The patient taps the matching image
  // among 4 image options. TTS is the core mechanic: if unavailable the
  // exercise tile on the home page is disabled, and this component shows a
  // fallback message as a safety net.
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { resolveImageUrl, buildDistractors } from '$lib/utils/exercise-helpers';
  import type { CardState } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { ExerciseShell, FeedbackBanner, FEEDBACK_TIMINGS } from './shared';
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

  const EXERCISE_TYPE = 'listen-choose' as ExerciseType;
  const ttsSupported = SpeechSynthesisService.isSupported();

  // --- State ---
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  // 0 = no attempts, 1 = first wrong tap (retry flash), 2 = second wrong tap (reveal).
  let attemptsUsed = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
  let trialRecorded = $state(false);

  // --- TTS ---
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  // Svelte 5 runs $effect before onMount. Guard the auto-speak effect with
  // ttsReady so the first word isn't silently dropped (synthesis is null
  // until init() runs in onMount). See ~/wiki/concepts/svelte-5-pitfalls.md.
  let ttsReady = $state(false);
  onMount(() => {
    tts.init();
    ttsReady = true;
    return () => {
      tts.destroy();
      wordTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));

  // --- Options ---
  let optionWords = $state<Word[]>([]);
  let selectedIndex = $state<number | null>(null);

  let currentWord = $derived(words[currentIndex]);
  let correctOptionIndex = $derived(optionWords.findIndex((w) => w.id === currentWord?.id));
  let isFinished = $derived(currentIndex >= words.length);

  const wordTimer = createCancellableTimer();

  // Rebuild options + reset per-word state when the current word changes.
  // Auto-speak the word once TTS is ready — this is the core mechanic.
  $effect(() => {
    wordTimer.clear();
    if (!ttsReady || !currentWord) return;
    optionWords = buildDistractors(currentWord, words, allWords, 'word');
    selectedIndex = null;
    feedbackState = 'none';
    trialRecorded = false;
    attemptsUsed = 0;
    startTime = Date.now();
    // Auto-play the spoken word on round start.
    speak();
  });

  function speak() {
    tts.speak(currentWord?.word, speechLang);
  }

  // Record the first tap for the current word exactly once; retries are no-ops.
  function recordCurrentTrial(correct: boolean, response: string) {
    if (!currentWord || trialRecorded) return;
    trialRecorded = true;
    results.push({ word: currentWord, correct });
    recordTrial({
      wordId: currentWord.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response,
      responseTimeMs: Date.now() - startTime,
    });
  }

  // Selection with retry: first wrong tap records + allows one retry after
  // auto-replay (correct answer NOT revealed); second wrong tap reveals and
  // advances.
  function handleSelectChoice(index: number) {
    if (feedbackState !== 'none' || !currentWord) return;
    selectedIndex = index;
    const selectedWord = optionWords[index];
    const correct = !!selectedWord && selectedWord.id === currentWord.id;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    if (correct) {
      recordCurrentTrial(true, selectedWord?.word ?? '');
      wordTimer.schedule(nextWord, FEEDBACK_TIMINGS.correctAdvance);
    } else {
      if (attemptsUsed === 0) {
        // First wrong tap: record, flash (no reveal), then auto-replay + retry.
        recordCurrentTrial(false, selectedWord?.word ?? '');
        attemptsUsed = 1;
        wordTimer.schedule(() => {
          feedbackState = 'none';
          selectedIndex = null;
          // Auto-replay the word for the retry attempt.
          speak();
        }, FEEDBACK_TIMINGS.incorrectRetryReset);
      } else {
        // Second wrong tap: reveal and advance.
        attemptsUsed = 2;
        wordTimer.schedule(nextWord, FEEDBACK_TIMINGS.incorrectRevealAdvance);
      }
    }
  }

  function skipWord() {
    if (!currentWord) return;
    recordCurrentTrial(false, '');
    nextWord();
  }

  function nextWord() {
    wordTimer.clear();
    tts.cancel();
    currentIndex++;
    if (currentIndex >= words.length) {
      oncomplete?.({ score, total: words.length, details: results });
    }
  }

  // Card visual states computed locally (not via shared getCardState) so the
  // first-wrong flash hides the correct answer during the retry window.
  // Only the second-wrong reveal highlights the correct card.
  let cardStates = $derived<CardState[]>(computeCardStates());

  function computeCardStates(): CardState[] {
    return optionWords.map((_, i): CardState => {
      if (feedbackState === 'none') {
        return selectedIndex === i ? 'selected' : 'default';
      }
      if (feedbackState === 'correct') {
        return i === selectedIndex ? 'correct' : 'default';
      }
      // feedbackState === 'incorrect'
      if (attemptsUsed <= 1) {
        // First-wrong flash: show selected as wrong, DON'T reveal correct.
        return i === selectedIndex ? 'incorrect' : 'default';
      }
      // Second-wrong reveal: show both selected-wrong and correct.
      if (i === correctOptionIndex) return 'correct';
      if (i === selectedIndex) return 'incorrect';
      return 'default';
    });
  }

  // Whether the correct card's word label should be visible.
  let showCorrectLabel = $derived(
    feedbackState === 'correct' ||
    (feedbackState === 'incorrect' && attemptsUsed >= 2),
  );

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(optionWords.length, 4),
    onSelectOption: (index) => handleSelectChoice(index),
    onConfirm: () => {
      if (feedbackState === 'correct') nextWord();
      else if (feedbackState === 'incorrect' && attemptsUsed >= 2) nextWord();
    },
    onSkip: skipWord,
    isActive: !isFinished && !!currentWord,
  });
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !ttsSupported}
  <div class="exercise-error">
    <span class="error-icon" aria-hidden="true">🔊</span>
    <p class="error-text">{$t('exercises.listen_choose.needs_tts')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={$t('exercises.listen_choose.name')}
    {keyboardNavParams}
    active={!isFinished}
  >
    <!-- Replay button (central mechanic, not an accessory) -->
    <button
      type="button"
      class="replay-button"
      class:playing={tts.isSpeaking}
      onclick={speak}
      disabled={tts.isSpeaking}
      aria-label={$t('exercises.listen_choose.listen_again')}
    >
      <span class="replay-icon" aria-hidden="true">{tts.isSpeaking ? '🔊' : '🔈'}</span>
      <span class="replay-text">{$t('exercises.listen_choose.listen_again')}</span>
    </button>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={currentWord.word}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={speak}
        />
      {:else if feedbackState === 'incorrect' && attemptsUsed >= 2}
        <FeedbackBanner
          state="incorrect"
          text={$t('exercises.listen_choose.correct_word_was', { word: currentWord.word })}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner state="incorrect" icon="🔄" text={$t('feedback.try_again')} />
      {/if}
    </div>

    <!-- 2×2 grid of image cards (no text labels during trial).
         Image fallback: the letter div sits behind the img via z-index;
         if the img fails it just hides itself, revealing the fallback. -->
    <div class="card-grid">
      {#each optionWords as optionWord, i}
        <div
          class="image-card"
          class:selected={cardStates[i] === 'selected'}
          class:correct={cardStates[i] === 'correct'}
          class:incorrect={cardStates[i] === 'incorrect'}
        >
          <button
            type="button"
            class="card-button"
            onclick={() => handleSelectChoice(i)}
            disabled={feedbackState !== 'none'}
            aria-label={$t('exercises.listen_choose.option_label', { n: String(i + 1) })}
          >
            <div class="card-image-wrapper">
              <img
                src={resolveImageUrl(optionWord.image_url)}
                alt=""
                class="card-image"
                onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div class="card-letter-fallback">
                <span>?</span>
              </div>
            </div>
            <!-- Show the word only after the round is resolved -->
            {#if showCorrectLabel && cardStates[i] === 'correct'}
              <span class="card-label">{optionWord.word}</span>
            {/if}
          </button>
        </div>
      {/each}
    </div>

    <!-- Skip -->
    {#if feedbackState === 'none'}
      <button type="button" class="exercise-skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
        ⏭️ {$t('common.skip')}
      </button>
    {/if}
  </ExerciseShell>
{/if}

<style>
  /* Replay button — exercise-specific, not in shared CSS */
  .replay-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs, 4px);
    min-width: 72px;
    min-height: 72px;
    padding: var(--space-md, 16px) var(--space-xl, 24px);
    background: var(--primary, #3b82f6);
    color: #fff;
    border: none;
    border-radius: var(--radius-full, 9999px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    font-family: var(--font-family, sans-serif);
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  .replay-button:hover:not(:disabled) {
    background: var(--primary-hover, #2563eb);
  }

  .replay-button:active:not(:disabled) {
    transform: scale(0.96);
  }

  .replay-button:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .replay-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 3px;
  }

  .replay-button.playing {
    animation: replay-pulse 1s ease-in-out infinite;
  }

  .replay-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .replay-text {
    font-size: var(--font-size-base, 16px);
    line-height: 1.2;
  }

  @keyframes replay-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
</style>
