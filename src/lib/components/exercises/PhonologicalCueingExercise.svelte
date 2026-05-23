<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { resolveImageUrl, generateOptions, getCardState } from '$lib/utils/exercise-helpers';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type Props = {
    words: Word[];
    language: Language;
   speechRate?: number;
   speakButtonsEnabled?: boolean;
   onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; cuesUsed: number }> }) => void;
    onRestart?: () => void;
  };

  let { words, language = 'es' as Language, speechRate = 0.8, speakButtonsEnabled = true, onComplete, onRestart }: Props = $props();

  // State
  let currentIndex = $state(0);
  let cuesRevealed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; cuesUsed: number }>>([]);
  let startTime = $state(Date.now());

  // Multiple choice state
  let options = $state<string[]>([]);
  let selectedIndex = $state<number | null>(null);
  let correctOptionIndex = $state(0);

  // TTS synthesis
  let isSpeaking = $state(false);
  let synthesis: SpeechSynthesisService | null = $state(null);
  
  onMount(() => {
    if (SpeechSynthesisService.isSupported()) {
      synthesis = new SpeechSynthesisService();
      synthesis.setRate(speechRate);
    }
    return () => synthesis?.destroy();
  });
  
  $effect(() => synthesis?.setRate(speechRate));

  let speechLang = $derived(language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US');

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(Math.round(((currentIndex + 1) / words.length) * 100));
  let isFinished = $derived(currentIndex >= words.length);

  // Rebuild options when word changes
  $effect(() => {
    if (currentWord) {
      const opts = generateOptions(currentWord.word, words.map(w => w.word));
      options = opts;
      correctOptionIndex = opts.indexOf(currentWord.word);
      selectedIndex = null;
    }
  });

  // Cue levels (0-5)
  let revealedCues = $derived.by(() => {
    if (!currentWord) return [];
    const cues: Array<{ label: string; value: string }> = [];

    if (cuesRevealed >= 1) {
      const firstSound = currentWord.phonetic?.first_sound ?? '—';
      cues.push({
        label: $t('exercises.phonological_cueing.first_sound', { value: firstSound }),
        value: firstSound,
      });
    }
    if (cuesRevealed >= 2) {
      const syllables = currentWord.phonetic?.syllables ?? '—';
      cues.push({
        label: $t('exercises.phonological_cueing.syllable_count', { value: String(syllables) }),
        value: String(syllables),
      });
    }
    if (cuesRevealed >= 3) {
      const rhyming = currentWord.phonetic?.rhyming_word ?? '—';
      cues.push({
        label: $t('exercises.phonological_cueing.rhyming_word', { value: rhyming }),
        value: rhyming,
      });
    }
    if (cuesRevealed >= 4) {
      const phonemes = currentWord.phonetic?.first_phonemes ?? '—';
      cues.push({
        label: $t('exercises.phonological_cueing.first_phonemes', { value: phonemes }),
        value: phonemes,
      });
    }
    if (cuesRevealed >= 5) {
      cues.push({
        label: $t('exercises.phonological_cueing.full_word', { value: currentWord.word }),
        value: currentWord.word,
      });
      // Speak the word
      speakWord(currentWord.word);
    }
    return cues;
  });

  let canShowMoreCues = $derived(cuesRevealed < 5);
  let maxCuesReached = $derived(cuesRevealed >= 5);

  async function speakWord(word?: string) {
    const text = word ?? currentWord?.word;
    if (synthesis && !isSpeaking && text) {
      isSpeaking = true;
      await synthesis.speak(text, speechLang);
      isSpeaking = false;
    }
  }

  function showNextCue() {
    if (canShowMoreCues) {
      cuesRevealed++;
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
      feedbackState = 'incorrect';
      playIncorrectSound();
      // Reset after a moment so they can try again
      setTimeout(() => {
        feedbackState = 'none';
      }, 1500);
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
      feedbackState = 'incorrect';
      playIncorrectSound();
      setTimeout(() => {
        feedbackState = 'none';
        selectedIndex = null;
      }, 1500);
    }
  }

  async function handleCorrect() {
    feedbackState = 'correct';
    playCorrectSound();
    score++;
    results.push({ word: currentWord, correct: true, cuesUsed: cuesRevealed });

    const responseTime = Date.now() - startTime;

    await recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'phonological-cueing' as ExerciseType,
      correct: true,
      response: currentWord.word,
      cue_level_used: cuesRevealed > 0 ? cuesRevealed : undefined,
      response_time_ms: responseTime,
      timestamp: new Date(),
      language,
    });

    const quality = Math.max(0, 5 - cuesRevealed);
    await updateAfterAttempt(currentWord.id, language, quality);

    setTimeout(() => {
      nextWord();
    }, 1500);
  }

  function skipWord() {
    results.push({ word: currentWord, correct: false, cuesUsed: cuesRevealed });

    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'phonological-cueing' as ExerciseType,
      correct: false,
      response: '',
      cue_level_used: cuesRevealed > 0 ? cuesRevealed : undefined,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });

    updateAfterAttempt(currentWord.id, language, 0);
    nextWord();
  }

  function nextWord() {
    feedbackState = 'none';
    cuesRevealed = 0;
    imageError = false;
    startTime = Date.now();
    selectedIndex = null;
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    currentIndex = 0;
    cuesRevealed = 0;
    feedbackState = 'none';
    imageError = false;
    score = 0;
    results = [];
    startTime = Date.now();
    selectedIndex = null;
    isSpeaking = false;
  }

  function handleImageError() {
    imageError = true;
  }

  function handleRestart() {
    restart();
    onRestart?.();
  }

  // Keyboard navigation params
  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(options.length, 4),
    onSelectOption: (index) => handleSelectChoice(index),
    onConfirm: () => {
      if (feedbackState !== 'none' && feedbackState !== 'correct') nextWord();
    },
    onToggleHint: showNextCue,
    onSkip: skipWord,
    isActive: !isFinished && !!currentWord,
  });

  // Encouragement messages
  function getRandomEncouragement() {
    const msgs = [$t('feedback.correct'), $t('feedback.well_done'), $t('feedback.excellent'), $t('feedback.keep_going'), $t('feedback.great_effort')];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <div class="exercise-container" role="region" aria-label={$t('exercises.phonological_cueing.another_hint')} use:keyboardNav={keyboardNavParams}>
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {words.length}</span>
    </div>

    <!-- Image area -->
    <div class="image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt="Imagen del ejercicio"
          class="exercise-image"
          onerror={handleImageError}
        />
      {:else}
        <div class="image-fallback">
          <span class="fallback-letter">{currentWord.word?.[0]?.toUpperCase() ?? '?'}</span>
        </div>
      {/if}
    </div>

    <!-- Cue levels visual indicator -->
    <div class="cue-indicators">
      {#each Array(5) as _, i}
        <div
          class="cue-dot"
          class:revealed={i < cuesRevealed}
          title={i < cuesRevealed ? $t('exercises.phonological_cueing.revealed') : $t('exercises.phonological_cueing.hint_n', {n: String(i + 1)})}
        ></div>
      {/each}
    </div>

    <!-- Revealed cues -->
    {#if revealedCues.length > 0}
      <div class="cues-area">
        {#each revealedCues as cue, i}
          <div class="cue-card" class:latest={i === revealedCues.length - 1}>
            <span class="cue-icon">
              {#if i < 4}🔊{:else}🗣️{/if}
            </span>
            <span class="cue-text">{cue.label}</span>
            {#if i === 4}
              {#if isSpeaking}
                <span class="speaking-badge">🔊 {$t('exercises.phonological_cueing.playing')}</span>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Feedback -->
    {#if feedbackState === 'correct'}
      <div class="feedback correct" role="status" aria-live="polite">
        <span class="feedback-icon">✅</span>
       <span class="feedback-text">{getRandomEncouragement()}</span>
       {#if speakButtonsEnabled}
       <button class="speak-btn" onclick={() => speakWord()} disabled={isSpeaking} aria-label="Listen">
         {isSpeaking ? '🔊…' : '🔊'}
       </button>
       {/if}
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status" aria-live="polite">
        <span class="feedback-icon">🔄</span>
        <span class="feedback-text">{$t('feedback.try_again')}</span>
      </div>
    {/if}

    <!-- Answer input + controls -->
    {#if feedbackState !== 'correct'}
      <div class="answer-area">
          <!-- Multiple choice grid -->
          <div class="options-grid">
            {#each options as option, i}
              {@const state = getCardState(i, feedbackState, selectedIndex, correctOptionIndex)}
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
                {#if speakButtonsEnabled}
                  <button class="speak-btn-inline" onclick={(e) => { e.stopPropagation(); speakWord(option); }} disabled={isSpeaking} aria-label={$t('common.listen')}>
                    🔊
                  </button>
                {/if}
              </button>
            {/each}
          </div>

        <div class="button-row">
          <button
            class="cue-button"
            onclick={showNextCue}
            disabled={!canShowMoreCues}
            aria-label={$t('exercises.phonological_cueing.another_hint')}
          >
            💡 {$t('exercises.phonological_cueing.another_hint')}
            <span class="cue-count">({cuesRevealed}/5)</span>
          </button>

          <button class="skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
            ⏭️ {$t('common.skip')}
          </button>
        </div>
      </div>
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
         {#if speakButtonsEnabled}
         <button class="speak-btn" onclick={() => speakWord(result.word.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
           {isSpeaking ? '🔊…' : '🔊'}
         </button>
         {/if}
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          {#if result.cuesUsed > 0}
            <span class="result-cues">💡×{result.cuesUsed}</span>
          {:else}
            <span class="result-cues">⭐ {$t('exercises.phonological_cueing.no_hints')}</span>
          {/if}
        </div>
      {/each}
    </div>
    <button class="back-to-exercises-btn" onclick={() => goto(`${base}/exercises`)}>
      ← {$t('common.back_to_exercises')}
    </button>
    <button class="restart-btn" onclick={handleRestart}>
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

  /* Progress bar */
  .progress-bar-container {
    width: 100%;
    position: relative;
    height: 32px;
    background: var(--surface-2, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--primary, #3b82f6);
    transition: width 0.4s ease;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: var(--font-size-sm, 14px);
    font-weight: 600;
    color: var(--text, #1f2937);
  }

  /* Image */
  .image-area {
    width: 100%;
    max-width: 300px;
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
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-light, #93c5fd), var(--primary, #3b82f6));
  }

  .fallback-letter {
    font-size: 64px;
    font-weight: 800;
    color: #fff;
  }

  /* Cue indicators */
  .cue-indicators {
    display: flex;
    gap: var(--space-sm, 8px);
    align-items: center;
  }

  .cue-dot {
    width: 16px;
    height: 16px;
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
    animation: slideIn 0.3s ease;
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

  .feedback-icon {
    font-size: 24px;
  }

  .feedback-text {
    font-size: var(--font-size-lg, 20px);
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

  .cue-button,
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
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .cue-button {
    background: var(--surface-2, #f3f4f6);
    color: var(--text, #1f2937);
  }

  .cue-button:hover:not(:disabled) {
    background: var(--primary-light, #eff6ff);
    border-color: var(--primary, #3b82f6);
  }

  .cue-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cue-count {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
  }

  .skip-button {
    background: transparent;
    color: var(--text-muted, #6b7280);
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
  }

  /* Animations */
  .correct-flash {
    box-shadow: 0 0 0 4px var(--success, #22c55e), 0 0 24px rgba(34, 197, 94, 0.3) !important;
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }

  /* Summary */
  .summary {
    text-align: center;
  }

  .summary-icon {
    font-size: 64px;
  }

  .summary-title {
    font-size: var(--font-size-xl, 24px);
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
    font-size: var(--font-size-lg, 20px);
    color: var(--primary, #3b82f6);
    font-weight: 700;
    margin: 0;
  }

  .summary-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 400px;
  }

  .result-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
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
    flex: 1;
    text-align: left;
    font-weight: 600;
    text-transform: capitalize;
  }

  .result-cues {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
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

  .speak-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-md, 8px);
    transition: background var(--transition-fast, 0.15s);
    line-height: 1;
  }
  .speak-btn:hover {
    background: var(--surface-2, rgba(255,255,255,0.1));
  }
  .speak-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .speak-btn-inline {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 2px 4px;
    margin-left: 0.3rem;
    border-radius: var(--radius-sm, 4px);
    line-height: 1;
    opacity: 0.7;
    transition: opacity var(--transition-fast, 0.15s);
  }
  .speak-btn-inline:hover {
    opacity: 1;
  }
  .speak-btn-inline:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* Tablet layout: image+cues left, options right */
  @media (min-width: 768px) {
    .exercise-container:not(.summary) {
      max-width: none;
      display: grid;
      grid-template-columns: 280px 1fr;
      align-items: start;
    }

    .progress-bar-container {
      grid-column: 1 / -1;
    }

    .image-area {
      grid-column: 1;
      grid-row: 2 / span 20;
      max-width: none;
      width: 100%;
      max-height: 350px;
      aspect-ratio: auto;
      align-self: start;
    }

    .cue-indicators,
    .cues-area,
    .feedback,
    .answer-area {
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

    .options-grid {
      grid-template-columns: 1fr 1fr;
    }

    .answer-area {
      max-width: none;
    }
  }
</style>
