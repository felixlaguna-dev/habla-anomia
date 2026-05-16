<script lang="ts">
  import { t } from '$lib/i18n';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type Props = {
    words: Word[];
    language: Language;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; featuresCorrect: number }> }) => void;
  };

  let { words, language = 'es' as Language, onComplete }: Props = $props();

  // State
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; featuresCorrect: number }>>([]);
  let startTime = $state(Date.now());

  // Feature tracking for current word
  let currentFeatureIndex = $state(0);
  let answeredFeatures = $state<Record<string, boolean>>({});
  let showNamingPrompt = $state(false);
  let namingCorrect = $state<boolean | null>(null);

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived((currentIndex / words.length) * 100);
  let isFinished = $derived(currentIndex >= words.length);

  let speechLang = $derived(language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US');

  // Feature prompts in order
  let featurePrompts = $derived.by(() => {
    if (!currentWord) return [];
    return [
      { key: 'category', prompt: $t('exercises.semantic_features.category_prompt'), answer: currentWord.features.category },
      { key: 'function', prompt: $t('exercises.semantic_features.function_prompt'), answer: currentWord.features.function },
      { key: 'location', prompt: $t('exercises.semantic_features.location_prompt'), answer: currentWord.features.location },
      { key: 'properties', prompt: $t('exercises.semantic_features.properties_prompt'), answer: currentWord.features.properties },
      { key: 'associations', prompt: $t('exercises.semantic_features.associations_prompt'), answer: currentWord.features.associations },
    ];
  });

  let allFeaturesAnswered = $derived(currentFeatureIndex >= featurePrompts.length);
  let currentPrompt = $derived(featurePrompts[currentFeatureIndex]);
  let featuresCorrectCount = $derived(Object.values(answeredFeatures).filter(Boolean).length);

  function checkFeatureAnswer(response: string) {
    if (!currentPrompt) return;

    const cleaned = response.trim().toLowerCase();
    const target = currentPrompt.answer.trim().toLowerCase();

    // Flexible matching: check if response contains the answer or vice versa
    const correct = cleaned === target ||
      cleaned.includes(target) ||
      target.includes(cleaned) ||
      levenshtein(cleaned, target) <= 2;

    answeredFeatures[currentPrompt.key] = correct;

    if (!correct) {
      feedbackState = 'incorrect';
      // Briefly show incorrect, then move on
      setTimeout(() => {
        feedbackState = 'none';
        advanceFeature();
      }, 1200);
    } else {
      feedbackState = 'correct';
      setTimeout(() => {
        feedbackState = 'none';
        advanceFeature();
      }, 800);
    }
  }

  function advanceFeature() {
    currentFeatureIndex++;
    if (currentFeatureIndex >= featurePrompts.length) {
      showNamingPrompt = true;
    }
  }

  function skipFeature() {
    answeredFeatures[currentPrompt.key] = false;
    advanceFeature();
  }

  function checkNamingAnswer(response: string) {
    if (!currentWord) return;

    const cleaned = response.trim().toLowerCase();
    const target = currentWord.word.trim().toLowerCase();
    const correct = cleaned === target;

    namingCorrect = correct;

    if (correct) {
      score += 5;
    }

    // Calculate features score
    const featCorrect = Object.values(answeredFeatures).filter(Boolean).length;
    score += featCorrect;

    results.push({
      word: currentWord,
      correct,
      featuresCorrect: featCorrect,
    });

    const responseTime = Date.now() - startTime;

    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'semantic-features' as ExerciseType,
      correct,
      response: cleaned,
      response_time_ms: responseTime,
      timestamp: new Date(),
      language,
    });

    const quality = correct ? (featCorrect >= 4 ? 5 : featCorrect >= 2 ? 4 : 3) : (featCorrect >= 3 ? 2 : 0);
    updateAfterAttempt(currentWord.id, language, quality);

    setTimeout(() => {
      nextWord();
    }, 1500);
  }

  function skipNaming() {
    const featCorrect = Object.values(answeredFeatures).filter(Boolean).length;

    results.push({
      word: currentWord,
      correct: false,
      featuresCorrect: featCorrect,
    });

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
    startTime = Date.now();
    currentIndex++;
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function handleImageError() {
    imageError = true;
  }

  // Simple Levenshtein distance for fuzzy matching
  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
</script>

{#if !isFinished && currentWord}
  <div class="exercise-container">
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {words.length}</span>
    </div>

    <!-- Image area -->
    <div class="image-area" class:correct-flash={namingCorrect === true} class:shake={namingCorrect === false}>
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

    <!-- Feature cards -->
    <div class="features-area">
      {#each featurePrompts as feat, i}
        <div
          class="feature-card"
          class:answered={i < currentFeatureIndex || (showNamingPrompt)}
          class:current={i === currentFeatureIndex && !showNamingPrompt}
          class:correct-answer={answeredFeatures[feat.key] === true}
          class:wrong-answer={answeredFeatures[feat.key] === false}
          class:pending={i > currentFeatureIndex && !showNamingPrompt}
        >
          <div class="feature-status">
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
          <div class="feature-content">
            <span class="feature-prompt">{feat.prompt}</span>
            {#if answeredFeatures[feat.key] === false}
              <span class="feature-reveal">{feat.answer}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Current feature input -->
    {#if !allFeaturesAnswered && currentPrompt && feedbackState !== 'incorrect'}
      <div class="input-area">
        <SpeechInput
          language={speechLang}
          placeholder={currentPrompt.prompt}
          onresult={checkFeatureAnswer}
        />
        <button class="skip-button" onclick={skipFeature}>
          ⏭️ {$t('common.skip')}
        </button>
      </div>
    {/if}

    <!-- Brief incorrect feedback for features -->
    {#if feedbackState === 'incorrect' && !showNamingPrompt}
      <div class="feedback incorrect" role="status">
        <span>{$t('feedback.try_again')}</span>
        <span class="correct-answer-hint">→ {currentPrompt.answer}</span>
      </div>
    {/if}

    <!-- Brief correct feedback for features -->
    {#if feedbackState === 'correct' && !showNamingPrompt}
      <div class="feedback correct" role="status">
        ✅ {$t('feedback.correct')}
      </div>
    {/if}

    <!-- Naming prompt -->
    {#if showNamingPrompt && namingCorrect === null}
      <div class="naming-area">
        <p class="naming-prompt">{$t('exercises.semantic_features.now_name_it')}</p>
        <SpeechInput
          language={speechLang}
          placeholder={$t('exercises.picture_naming.type_answer')}
          onresult={checkNamingAnswer}
        />
        <button class="skip-button" onclick={skipNaming}>
          ⏭️ {$t('common.skip')}
        </button>
      </div>
    {/if}

    <!-- Naming feedback -->
    {#if namingCorrect === true}
      <div class="feedback correct" role="status">
        ✅ {$t('feedback.correct')}
      </div>
    {:else if namingCorrect === false}
      <div class="feedback incorrect" role="status">
        ❌ {$t('feedback.the_answer_was', { answer: currentWord.word })}
      </div>
    {/if}
  </div>
{/if}

{#if isFinished}
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>
    <p class="summary-score">{$t('feedback.score')}: {score}</p>
    <div class="summary-details">
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          <span class="result-features">📋 {result.featuresCorrect}/5</span>
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
    max-width: 280px;
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

  /* Feature cards */
  .features-area {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 500px;
  }

  .feature-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--radius-md, 12px);
    background: var(--surface-2, #f3f4f6);
    transition: all 0.3s ease;
    min-height: 48px;
  }

  .feature-card.current {
    background: var(--primary-light, #eff6ff);
    border: 2px solid var(--primary, #3b82f6);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
  }

  .feature-card.correct-answer {
    background: rgba(34, 197, 94, 0.1);
  }

  .feature-card.wrong-answer {
    background: rgba(239, 68, 68, 0.05);
  }

  .feature-card.pending {
    opacity: 0.5;
  }

  .feature-status {
    font-size: 20px;
    flex-shrink: 0;
    width: 28px;
    text-align: center;
  }

  .feature-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .feature-prompt {
    font-size: var(--font-size-base, 16px);
    font-weight: 500;
    color: var(--text, #1f2937);
  }

  .feature-reveal {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
    font-style: italic;
  }

  /* Input area */
  .input-area {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  /* Naming */
  .naming-area {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
    animation: fadeIn 0.5s ease;
  }

  .naming-prompt {
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    color: var(--primary, #3b82f6);
    text-align: center;
    margin: 0;
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

  .correct-answer-hint {
    font-weight: 400;
    font-size: var(--font-size-base, 16px);
    color: var(--text-muted, #6b7280);
  }

  .skip-button {
    min-height: 56px;
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
    user-select: none;
    transition: background var(--transition-fast, 0.15s);
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
  }

  /* Animations */
  .correct-flash {
    box-shadow: 0 0 0 4px var(--success, #22c55e) !important;
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
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

  .result-features {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
  }
</style>
