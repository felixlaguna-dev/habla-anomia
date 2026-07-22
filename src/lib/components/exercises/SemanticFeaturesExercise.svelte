<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { resolveImageUrl, shuffleArray, buildFeatureDistractors } from '$lib/utils/exercise-helpers';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { CATEGORIES } from '$lib/types';
  import type { Word, Language, ExerciseType, SemanticFeatures } from '$lib/types';

  type Props = {
    words: Word[];
    /** Full word bank for the active language — used to pad distractors when
     *  session words share feature values (otherwise options can collapse). */
    allWords?: Word[];
    language: Language;
   speechRate?: number;
   speakButtonsEnabled?: boolean;
   onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; featuresCorrect: number }> }) => void;
    onRestart?: () => void;
  };

  let { words, allWords = [], language = 'es' as Language, speechRate = 0.8, speakButtonsEnabled = true, onComplete, onRestart }: Props = $props();

  // State
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; featuresCorrect: number }>>([]);
  let startTime = $state(Date.now());

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

  // Feature tracking
  let currentFeatureIndex = $state(0);
  let answeredFeatures = $state<Record<string, boolean>>({});
  let showNamingPrompt = $state(false);
  let namingCorrect = $state<boolean | null>(null);

  // Multiple choice options for current feature
  let currentOptions = $state<string[]>([]);
  let selectedOption = $state<string | null>(null);

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(Math.round(((currentIndex + 1) / words.length) * 100));
  let isFinished = $derived(currentIndex >= words.length);

  // Feature prompts in order
  let featurePrompts = $derived.by(() => {
    if (!currentWord) return [];
    return [
      { key: 'category', prompt: $t('exercises.semantic_features.category_prompt'), answer: currentWord.features.category },
      { key: 'function', prompt: $t('exercises.semantic_features.function_prompt'), answer: currentWord.features.function },
      { key: 'location', prompt: $t('exercises.semantic_features.location_prompt'), answer: currentWord.features.location },
      { key: 'properties', prompt: $t('exercises.semantic_features.properties_prompt'), answer: currentWord.features.properties },
    ];
  });

  let allFeaturesAnswered = $derived(currentFeatureIndex >= featurePrompts.length);
  let currentPrompt = $derived(featurePrompts[currentFeatureIndex]);
  let featuresCorrectCount = $derived(Object.values(answeredFeatures).filter(Boolean).length);

  // Generate multiple choice options from other words' features
  $effect(() => {
    if (!currentPrompt || !words.length) {
      currentOptions = [];
      return;
    }

    const correctAnswer = currentPrompt.answer;
    const key = currentPrompt.key;

    let wrongOptions: string[];

    if (key === 'category') {
      // Category questions: draw distractors from every category (CATEGORIES
      // is the single source of truth, so none are ever missing).
      wrongOptions = shuffleArray(CATEGORIES.filter(c => c !== correctAnswer)).slice(0, 3);
    } else {
      // Feature questions: prefer session words, then pad from the full bank
      // so shared feature values never collapse the choice below 4 options.
      wrongOptions = buildFeatureDistractors(
        key as keyof SemanticFeatures,
        correctAnswer,
        currentWord?.id,
        words,
        allWords,
      );
    }

    // Combine correct + wrong, shuffle
    const options = shuffleArray([correctAnswer, ...wrongOptions]);
    currentOptions = options;
    selectedOption = null;
  });

  function selectOption(option: string) {
    if (feedbackState !== 'none' || !currentPrompt) return;
    selectedOption = option;

    const correct = option === currentPrompt.answer;
    answeredFeatures[currentPrompt.key] = correct;

    if (correct) {
      feedbackState = 'correct';
      playCorrectSound();
      setTimeout(() => {
        feedbackState = 'none';
        advanceFeature();
      }, 800);
    } else {
      feedbackState = 'incorrect';
      playIncorrectSound();
      setTimeout(() => {
        feedbackState = 'none';
        advanceFeature();
      }, 1200);
    }
  }

  function advanceFeature() {
    currentFeatureIndex++;
    selectedOption = null;
    if (currentFeatureIndex >= featurePrompts.length) {
      showNamingPrompt = true;
    }
  }

  function handleNamingResult(response: string) {
    if (!currentWord || namingCorrect !== null) return;
    const cleaned = response.trim().toLowerCase();
    const target = currentWord.word.trim().toLowerCase();
    selectNamingAnswer(cleaned === target ? currentWord.word : response);
  }

  function selectNamingAnswer(word: string) {
    if (!currentWord || namingCorrect !== null) return;

    const correct = word === currentWord.word;
    namingCorrect = correct;

    const featCorrect = Object.values(answeredFeatures).filter(Boolean).length;
    if (correct) score++;

    results.push({ word: currentWord, correct, featuresCorrect: featCorrect });

    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'semantic-features' as ExerciseType,
      correct,
      response: word,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });

    const quality = correct ? (featCorrect >= 3 ? 5 : featCorrect >= 2 ? 4 : 3) : (featCorrect >= 2 ? 2 : 0);
    updateAfterAttempt(currentWord.id, language, quality);

    setTimeout(() => nextWord(), 1500);
  }

  function skipNaming() {
    const featCorrect = Object.values(answeredFeatures).filter(Boolean).length;
    results.push({ word: currentWord, correct: false, featuresCorrect: featCorrect });

    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'semantic-features' as ExerciseType,
      correct: false,
      response: '',
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });
    updateAfterAttempt(currentWord.id, language, 0);
    nextWord();
  }

  function nextWord() {
    feedbackState = 'none';
    imageError = false;
    currentFeatureIndex = 0;
    answeredFeatures = {};
    showNamingPrompt = false;
    namingCorrect = null;
    selectedOption = null;
    startTime = Date.now();
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    currentIndex = 0;
    feedbackState = 'none';
    imageError = false;
    score = 0;
    results = [];
    startTime = Date.now();
    currentFeatureIndex = 0;
    answeredFeatures = {};
    showNamingPrompt = false;
    namingCorrect = null;
    selectedOption = null;
  }

  function handleImageError() {
    imageError = true;
  }

  function handleRestart() {
    restart();
    onRestart?.();
  }

  async function speakWord(word?: string) {
    const text = word ?? currentWord?.word;
    if (synthesis && !isSpeaking && text) {
      isSpeaking = true;
      await synthesis.speak(text, speechLang);
      isSpeaking = false;
    }
  }

  // Generate naming word choices
  let namingOptions = $derived.by(() => {
    if (!currentWord || !words.length) return [];
    const correct = currentWord.word;
    const others = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  });

  // Keyboard navigation params
  // Adapts between feature-step and naming-step modes
  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: showNamingPrompt
      ? Math.min(namingOptions.length, 4)
      : Math.min(currentOptions.length, 4),
    onSelectOption: (index) => {
      if (showNamingPrompt && namingOptions[index]) {
        selectNamingAnswer(namingOptions[index]);
      } else if (currentOptions[index]) {
        selectOption(currentOptions[index]);
      }
    },
    onConfirm: () => {
      // No-op: auto-advances via timeouts
    },
    onSkip: skipNaming,
    isActive: !isFinished && !!currentWord && namingCorrect === null,
  });
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <div class="exercise-container" role="region" aria-label={$t('exercises.semantic_features.now_name_it')} use:keyboardNav={keyboardNavParams}>
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {words.length}</span>
    </div>

    <!-- Image area -->
    <div class="image-area" class:correct-flash={namingCorrect === true} class:shake={namingCorrect === false}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt="Imagen del ejercicio"
          class="exercise-image"
          onerror={handleImageError}
        />
      {:else}
        <div class="image-fallback">
          <span class="fallback-letter">{currentWord.word[0].toUpperCase()}</span>
        </div>
      {/if}
    </div>

    <!-- Feature cards (progress indicator) -->
    <div class="features-bar">
      {#each featurePrompts as feat, i}
        <div
          class="feature-dot"
          class:correct-answer={answeredFeatures[feat.key] === true}
          class:wrong-answer={answeredFeatures[feat.key] === false}
          class:current={i === currentFeatureIndex && !showNamingPrompt}
          class:pending={i > currentFeatureIndex && !showNamingPrompt}
        >
          {#if answeredFeatures[feat.key] === true}
            ✅
          {:else if answeredFeatures[feat.key] === false}
            ❌
          {:else if i === currentFeatureIndex && !showNamingPrompt}
            🔵
          {:else}
            ⬜
          {/if}
        </div>
      {/each}
    </div>

    <!-- Feature multiple choice -->
    {#if !allFeaturesAnswered && currentPrompt && (feedbackState as string) === 'none'}
      <div class="question-area">
        <p class="question-prompt">{currentPrompt.prompt}</p>
        <div class="options-grid">
          {#each currentOptions as option}
            <button
              class="option-btn"
              class:selected={selectedOption === option}
              class:is-correct={(feedbackState as string) !== 'none' && option === currentPrompt.answer}
              class:is-wrong={(feedbackState as string) === 'incorrect' && selectedOption === option && option !== currentPrompt.answer}
              onclick={() => selectOption(option)}
              disabled={(feedbackState as string) !== 'none'}
            >
              {currentPrompt.key === 'category' ? $t('categories.' + option) : option}
              {#if speakButtonsEnabled}
                <button class="speak-btn-inline" onclick={(e) => { e.stopPropagation(); speakWord(option); }} disabled={isSpeaking} aria-label={$t('common.listen')}>
                  🔊
                </button>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Feedback -->
    {#if feedbackState === 'correct' && !showNamingPrompt}
      <div class="feedback correct" role="status" aria-live="polite">
       ✅ {$t('feedback.correct')}
       {#if speakButtonsEnabled}
       <button class="speak-btn" onclick={() => speakWord()} disabled={isSpeaking} aria-label="Listen">
         {isSpeaking ? '🔊…' : '🔊'}
       </button>
       {/if}
      </div>
    {/if}

    {#if feedbackState === 'incorrect' && !showNamingPrompt}
      <div class="feedback incorrect" role="status" aria-live="polite">
        ❌ {$t('feedback.try_again')} → {currentPrompt.key === 'category' ? $t('categories.' + currentPrompt.answer) : currentPrompt.answer}
      </div>
    {/if}

    <!-- Naming prompt — also multiple choice -->
    {#if showNamingPrompt && namingCorrect === null}
      <div class="naming-area">
        <p class="naming-prompt">{$t('exercises.semantic_features.now_name_it')}</p>
          <div class="options-grid naming-grid">
            {#each namingOptions as option}
              <button
                class="option-btn naming-btn"
                class:is-correct={namingCorrect !== null && option === currentWord.word}
                class:is-wrong={namingCorrect === false && option !== currentWord.word}
                onclick={() => selectNamingAnswer(option)}
                disabled={namingCorrect !== null}
              >
                {option}
                {#if speakButtonsEnabled}
                  <button class="speak-btn-inline" onclick={(e) => { e.stopPropagation(); speakWord(option); }} disabled={isSpeaking} aria-label={$t('common.listen')}>
                    🔊
                  </button>
                {/if}
              </button>
            {/each}
          </div>
        <button class="skip-button" onclick={skipNaming}>
          ⏭️ {$t('common.skip')}
        </button>
      </div>
    {/if}

    <!-- Naming feedback -->
    {#if namingCorrect === true}
      <div class="feedback correct" role="status" aria-live="polite">
       ✅ {$t('feedback.correct')}
       {#if speakButtonsEnabled}
       <button class="speak-btn" onclick={() => speakWord(currentWord.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
         {isSpeaking ? '🔊…' : '🔊'}
       </button>
       {/if}
     </div>
   {:else if namingCorrect === false}
     <div class="feedback incorrect" role="status" aria-live="polite">
       ❌ {$t('feedback.the_answer_was', { answer: currentWord.word })}
       {#if speakButtonsEnabled}
       <button class="speak-btn" onclick={() => speakWord(currentWord.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
         {isSpeaking ? '🔊…' : '🔊'}
       </button>
       {/if}
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
      {#each results as result}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
         <span class="result-word">{result.word.word}</span>
         {#if speakButtonsEnabled}
         <button class="speak-btn" onclick={() => speakWord(result.word.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
           {isSpeaking ? '🔊…' : '🔊'}
         </button>
         {/if}
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          <span class="result-features">📋 {result.featuresCorrect}/4</span>
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
    max-width: 250px;
    aspect-ratio: 1;
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
    background: var(--surface, #f9fafb);
    display: flex;
    align-items: center;
    justify-content: center;
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

  /* Feature dots */
  .features-bar {
    display: flex;
    gap: var(--space-sm, 8px);
    justify-content: center;
  }

  .feature-dot {
    font-size: 24px;
    transition: transform 0.2s ease;
  }

  .feature-dot.current {
    transform: scale(1.3);
  }

  /* Question area */
  .question-area {
    width: 100%;
    max-width: 500px;
  }

  .question-prompt {
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0 0 var(--space-sm, 8px) 0;
  }

  /* Options grid */
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .option-btn {
    min-height: 56px;
    padding: 12px 16px;
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: var(--surface, #f9fafb);
    color: var(--text, #1f2937);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition: all 0.2s ease;
    touch-action: manipulation;
    user-select: none;
    text-align: center;
    box-sizing: border-box;
  }

  .option-btn:hover:not(:disabled) {
    background: var(--primary-light, #eff6ff);
    border-color: var(--primary, #3b82f6);
  }

  .option-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .option-btn.selected {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
  }

  .option-btn.is-correct {
    background: rgba(34, 197, 94, 0.15);
    border-color: var(--success, #22c55e);
    color: var(--success, #22c55e);
  }

  .option-btn.is-wrong {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--error, #ef4444);
    color: var(--error, #ef4444);
  }

  .option-btn:disabled {
    cursor: default;
  }

  .option-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Naming area */
  .naming-area {
    width: 100%;
    max-width: 500px;
  }

  .naming-prompt {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0 0 var(--space-sm, 8px) 0;
  }

  .naming-grid {
    grid-template-columns: 1fr 1fr;
  }

  .naming-btn {
    font-size: var(--font-size-lg, 20px);
    min-height: 64px;
  }

  .skip-button {
    width: 100%;
    min-height: 48px;
    margin-top: var(--space-sm, 8px);
    padding: 12px 24px;
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: transparent;
    color: var(--text-muted, #6b7280);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    touch-action: manipulation;
  }

  /* Feedback */
  .feedback {
    display: flex;
    align-items: center;
    justify-content: center;
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
    background: rgba(239, 68, 68, 0.1);
    color: var(--error, #ef4444);
  }

  /* Summary */
  .summary {
    padding-top: var(--space-xl, 32px);
  }

  .summary-icon {
    font-size: 64px;
    text-align: center;
  }

  .summary-title {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
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
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }

  .summary-details {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }

  .result-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--radius-md, 12px);
    background: var(--surface-2, #f3f4f6);
  }

  .result-row.pass {
    background: rgba(34, 197, 94, 0.1);
  }

  .result-row.fail {
    background: rgba(239, 68, 68, 0.05);
  }

  .result-word {
    flex: 1;
    font-weight: 600;
    font-size: var(--font-size-base, 16px);
  }

  .result-icon {
    font-size: 20px;
  }

  .result-features {
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

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Tablet layout: image left, features/naming right */
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

    .features-bar,
    .question-area,
    .feedback,
    .naming-area {
      grid-column: 2;
    }

    .question-area {
      max-width: none;
    }

    .question-area .options-grid {
      grid-template-columns: 1fr 1fr;
    }

    .naming-grid {
      grid-template-columns: 1fr 1fr;
    }

    .naming-area {
      max-width: none;
    }
  }
</style>
