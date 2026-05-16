<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type Props = {
    words: Word[];
    language: Language;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; cuesUsed: number }> }) => void;
  };

  let { words, language = 'es' as Language, onComplete }: Props = $props();

  // State
  let currentIndex = $state(0);
  let cuesRevealed = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; cuesUsed: number }>>([]);
  let startTime = $state(Date.now());
  let isSpeaking = $state(false);

  // Speech synthesis
  let synthesis: SpeechSynthesisService | null = $state(null);

  $effect(() => {
    if (SpeechSynthesisService.isSupported()) {
      synthesis = new SpeechSynthesisService();
    }
    return () => {
      synthesis?.destroy();
      synthesis = null;
    };
  });

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived((currentIndex / words.length) * 100);
  let isFinished = $derived(currentIndex >= words.length);

  let speechLang = $derived(language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US');

  // Cue levels (0-5)
  let revealedCues = $derived.by(() => {
    if (!currentWord) return [];
    const cues: Array<{ label: string; value: string }> = [];

    if (cuesRevealed >= 1) {
      cues.push({
        label: $t('exercises.phonological_cueing.first_sound', { value: currentWord.phonetic.first_sound }),
        value: currentWord.phonetic.first_sound,
      });
    }
    if (cuesRevealed >= 2) {
      cues.push({
        label: $t('exercises.phonological_cueing.syllable_count', { value: String(currentWord.phonetic.syllables) }),
        value: String(currentWord.phonetic.syllables),
      });
    }
    if (cuesRevealed >= 3) {
      cues.push({
        label: $t('exercises.phonological_cueing.rhyming_word', { value: currentWord.phonetic.rhyming_word }),
        value: currentWord.phonetic.rhyming_word,
      });
    }
    if (cuesRevealed >= 4) {
      cues.push({
        label: $t('exercises.phonological_cueing.first_phonemes', { value: currentWord.phonetic.first_phonemes }),
        value: currentWord.phonetic.first_phonemes,
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

  async function speakWord(word: string) {
    if (synthesis && !isSpeaking) {
      isSpeaking = true;
      await synthesis.speak(word, speechLang);
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
      // Reset after a moment so they can try again
      setTimeout(() => {
        feedbackState = 'none';
      }, 1500);
    }
  }

  async function handleCorrect() {
    feedbackState = 'correct';
    // Score: 5 for 0 cues, 4 for 1, etc. Minimum 0.
    const pointsEarned = Math.max(0, 5 - cuesRevealed);
    score += pointsEarned;
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
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function handleImageError() {
    imageError = true;
  }

  // Encouragement messages
  const encouragementPool = [
    'feedback.correct',
    'feedback.well_done',
    'feedback.excellent',
    'feedback.keep_going',
  ];

  let encouragement = $derived(
    encouragementPool[Math.floor(Math.random() * encouragementPool.length)]
  );
</script>

{#if !isFinished && currentWord}
  <div class="exercise-container">
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {words.length}</span>
    </div>

    <!-- Image area -->
    <div class="image-area" class:correct-flash={feedbackState === 'correct'} class:shake={feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={currentWord.image_url}
          alt=""
          class="exercise-image"
          onerror={handleImageError}
        />
      {:else}
        <div class="image-fallback">
          <span class="fallback-letter">{currentWord.word[0].toUpperCase()}</span>
        </div>
      {/if}
    </div>

    <!-- Cue levels visual indicator -->
    <div class="cue-indicators">
      {#each Array(5) as _, i}
        <div
          class="cue-dot"
          class:revealed={i < cuesRevealed}
          title={i < cuesRevealed ? 'Revelado' : 'Pista ' + (i + 1)}
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
                <span class="speaking-badge">🔊 Reproduciendo...</span>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Feedback -->
    {#if feedbackState === 'correct'}
      <div class="feedback correct" role="status">
        <span class="feedback-icon">✅</span>
        <span class="feedback-text">{$t(encouragement)}</span>
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status">
        <span class="feedback-icon">🔄</span>
        <span class="feedback-text">{$t('feedback.try_again')}</span>
      </div>
    {/if}

    <!-- Answer input + controls -->
    {#if feedbackState !== 'correct'}
      <div class="answer-area">
        <SpeechInput
          language={speechLang}
          placeholder={$t('exercises.picture_naming.type_answer')}
          onresult={checkAnswer}
        />

        <div class="button-row">
          <button
            class="cue-button"
            onclick={showNextCue}
            disabled={!canShowMoreCues}
          >
            💡 {$t('exercises.phonological_cueing.another_hint')}
            <span class="cue-count">({cuesRevealed}/5)</span>
          </button>

          <button class="skip-button" onclick={skipWord}>
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
    <p class="summary-score">{$t('feedback.score')}: {score} / {words.length * 5}</p>
    <div class="summary-details">
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          {#if result.cuesUsed > 0}
            <span class="result-cues">💡×{result.cuesUsed}</span>
          {:else}
            <span class="result-cues">⭐ Sin pistas</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .exercise-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 16px);
    padding: var(--space-md, 16px);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
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
    border-radius: var(--radius-lg, 16px);
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
</style>
