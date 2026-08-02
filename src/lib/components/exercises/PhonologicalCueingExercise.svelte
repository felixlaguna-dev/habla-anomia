<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { resolveImageUrl, buildDistractors } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { ExerciseShell, OptionGrid, FeedbackBanner, FEEDBACK_TIMINGS } from './shared';
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
      details: Array<{ word: Word; correct: boolean; cuesUsed: number }>;
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

  const EXERCISE_TYPE = 'phonological-cueing' as ExerciseType;

  // --- State ---
  let currentIndex = $state(0);
  let cuesRevealed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let results = $state<Array<{ word: Word; correct: boolean; cuesUsed: number }>>([]);
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
    imageError = false;
    startTime = Date.now();
  });

  // Cue levels (0-5)
  let revealedCues = $derived.by(() => {
    if (!currentWord) return [];
    const cues: Array<{ label: string; value: string }> = [];

    if (cuesRevealed >= 1) {
      const firstSound = currentWord.phonetic?.first_sound ?? '—';
      cues.push({ label: $t('exercises.phonological_cueing.first_sound', { value: firstSound }), value: firstSound });
    }
    if (cuesRevealed >= 2) {
      const syllables = currentWord.phonetic?.syllables ?? '—';
      cues.push({ label: $t('exercises.phonological_cueing.syllable_count', { value: String(syllables) }), value: String(syllables) });
    }
    if (cuesRevealed >= 3) {
      const rhyming = currentWord.phonetic?.rhyming_word ?? '—';
      cues.push({ label: $t('exercises.phonological_cueing.rhyming_word', { value: rhyming }), value: rhyming });
    }
    if (cuesRevealed >= 4) {
      const phonemes = currentWord.phonetic?.first_phonemes ?? '—';
      cues.push({ label: $t('exercises.phonological_cueing.first_phonemes', { value: phonemes }), value: phonemes });
    }
    if (cuesRevealed >= 5) {
      cues.push({ label: $t('exercises.phonological_cueing.full_word', { value: currentWord.word }), value: currentWord.word });
    }
    return cues;
  });

  let canShowMoreCues = $derived(cuesRevealed < 5);
  let hintLabel = $derived($t('exercises.hints_used', { used: String(cuesRevealed), total: '5' }));
  let legendLabel = $derived($t('exercises.hints_legend', { used: String(cuesRevealed), total: '5' }));

  function showNextCue() {
    if (!canShowMoreCues) return;
    cuesRevealed++;
    // Speak the word exactly once, when the patient advances TO the final
    // cue (full word). Kept out of the `revealedCues` derived so an unrelated
    // recompute can't trigger a stray speak.
    if (cuesRevealed === 5) {
      speak(currentWord?.word);
    }
  }

  // Record the first tap for the current word exactly once; retries are no-ops.
  function recordCurrentTrial(correct: boolean, response: string) {
    if (!currentWord || trialRecorded) return;
    trialRecorded = true;
    const word = currentWord;
    const cues = cuesRevealed;
    results.push({ word, correct, cuesUsed: cues });
    recordTrial({
      wordId: word.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response,
      hintsUsed: cues,
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
    if (correct) playCorrectSound();
    else playIncorrectSound();

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
    cuesRevealed = 0;
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
    onToggleHint: showNextCue,
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
    ariaLabel={$t('exercises.phonological_cueing.another_hint')}
    {keyboardNavParams}
    tabletColumns="280px 1fr"
    active={!isFinished}
  >
    <!-- Image area -->
    <div class="exercise-image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('a11y.exercise_image')}
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

    <!-- Cue level indicators + legend in one compact row -->
    <div class="cue-header" role="group" aria-label={legendLabel}>
      <div class="cue-indicators">
        {#each Array(5) as _, i}
          <div
            class="cue-dot"
            class:revealed={i < cuesRevealed}
            role="img"
            aria-label={i < cuesRevealed ? $t('exercises.phonological_cueing.revealed') : $t('exercises.phonological_cueing.hint_n', { n: String(i + 1) })}
          ></div>
        {/each}
      </div>
      <span class="hint-counter" aria-hidden="true">{legendLabel}</span>
    </div>

    <!-- Revealed cues -->
    {#if revealedCues.length > 0}
      <div class="cues-area">
        {#each revealedCues as cue, i}
          <div class="cue-card" class:latest={i === revealedCues.length - 1}>
            <span class="cue-icon" aria-hidden="true">{#if i < 4}🔊{:else}🗣️{/if}</span>
            <span class="cue-text">{cue.label}</span>
            {#if i === 4 && tts.isSpeaking}
              <span class="speaking-badge">🔊 {$t('exercises.phonological_cueing.playing')}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

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

    <!-- Answer input + controls -->
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
            onclick={showNextCue}
            disabled={!canShowMoreCues}
            aria-label={`${$t('exercises.phonological_cueing.another_hint')} — ${hintLabel}`}
          >
            💡 {$t('exercises.phonological_cueing.another_hint')}
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
  /* Cue header: indicators + legend in one compact row */
  .cue-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    width: 100%;
    max-width: 450px;
    justify-content: center;
  }

  /* Cue indicators */
  .cue-indicators {
    display: flex;
    gap: var(--space-xs, 4px);
    align-items: center;
  }

  .cue-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--surface-2, #e5e7eb);
    border: 2px solid var(--border, #d1d5db);
    transition: all 0.3s ease;
  }

  .cue-dot.revealed {
    background: var(--primary, #3b82f6);
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  }

  /* Cues area */
  .cues-area {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 450px;
  }

  .cue-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    background: var(--surface-2, #f3f4f6);
    border-radius: var(--radius-md, 12px);
    animation: exercise-slide-in 0.3s ease;
    min-height: 48px;
  }

  .cue-card.latest {
    background: var(--primary-light, #eff6ff);
    border: 2px solid var(--primary, #3b82f6);
    font-weight: 600;
  }

  .cue-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .cue-text {
    font-size: var(--font-size-base, 16px);
    color: var(--text, #1f2937);
    flex: 1;
  }

  .speaking-badge {
    font-size: var(--font-size-sm, 14px);
    color: var(--primary, #3b82f6);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Tablet: image+cues left, options right (grid provided by ExerciseShell) */
  @media (min-width: 768px) {
    .exercise-image-area {
      grid-column: 1;
      grid-row: 1 / span 20;
      max-height: 350px;
      aspect-ratio: auto;
      align-self: start;
    }

    .cue-header,
    .cues-area,
    .feedback-slot,
    .exercise-answer-area {
      grid-column: 2;
    }

    .cues-area {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--space-xs, 6px);
      max-width: none;
    }

    .cue-card {
      flex: 1 1 calc(50% - 6px);
      min-width: 0;
    }

    .exercise-answer-area {
      max-width: none;
    }
  }
</style>
