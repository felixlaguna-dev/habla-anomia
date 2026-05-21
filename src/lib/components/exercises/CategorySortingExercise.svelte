<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { resolveImageUrl } from '$lib/utils/exercise-helpers';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import type { Word, Language, ExerciseType } from '$lib/types';
  import { getWordCategories } from '$lib/types';

  type Props = {
    words: Word[];
    language: Language;
    speechEnabled?: boolean;
    speechRate?: number;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; selectedCategory: string }> }) => void;
    onRestart?: () => void;
  };

  let { words, language = 'es' as Language, speechEnabled = true, speechRate = 0.8, onComplete, onRestart }: Props = $props();

  // Derive categories from the word list (flatten multi-category)
  let categories = $derived([...new Set(words.flatMap(w => getWordCategories(w)))]);

  // Validate that words span at least 2 categories
  let hasEnoughCategories = $derived(categories.length >= 2);

  // Shuffle items on init
  let shuffledItems = $state<Word[]>([]);
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let incorrectAttempt = $state(false);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean; selectedCategory: string }>>([]);
  let startTime = $state(Date.now());
  let selectedCategory = $state<string | null>(null);

  // Track items sorted into each category bin (for visual feedback)
  let binItems = $state<Record<string, Word[]>>({});

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

  // inputMode concept (not used in UI for this exercise)
  let inputMode = $derived<'choice' | 'open'>(speechEnabled ? 'open' : 'choice');
  let speechLang = $derived(language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US');

  // Initialize
  $effect(() => {
    shuffledItems = [...words].sort(() => Math.random() - 0.5);
    const bins: Record<string, Word[]> = {};
    for (const cat of categories) {
      bins[cat] = [];
    }
    binItems = bins;
  });

  // Derived
  let currentItem = $derived(shuffledItems[currentIndex]);
  let progress = $derived(Math.round(((currentIndex + 1) / shuffledItems.length) * 100));
  let isFinished = $derived(currentIndex >= shuffledItems.length);

  function selectCategory(category: string) {
    if (!currentItem || feedbackState === 'correct') return;

    selectedCategory = category;
    const correct = getWordCategories(currentItem).includes(category);

    if (correct) {
      handleCorrect(category);
    } else {
      handleIncorrect();
    }
  }

  async function handleCorrect(category: string) {
    feedbackState = 'correct';
    playCorrectSound();
    incorrectAttempt = false;
    score++;
    results.push({ word: currentItem, correct: true, selectedCategory: category });

    // Add item to bin
    binItems[category] = [...(binItems[category] || []), currentItem];

    const responseTime = Date.now() - startTime;

    await recordAttempt({
      word_id: currentItem.id,
      exercise_type: 'category-sorting' as ExerciseType,
      correct: true,
      response: category,
      response_time_ms: responseTime,
      timestamp: new Date(),
      language,
    });

    await updateAfterAttempt(currentItem.id, language, 5);

    setTimeout(() => {
      nextItem();
    }, 1000);
  }

  function handleIncorrect() {
    feedbackState = 'incorrect';
    playIncorrectSound();
    incorrectAttempt = true;

    // Shake briefly, then reset so they can try again
    setTimeout(() => {
      feedbackState = 'none';
    }, 800);
  }

  function skipItem() {
    if (!currentItem) return;

    results.push({ word: currentItem, correct: false, selectedCategory: selectedCategory || '' });

    recordAttempt({
      word_id: currentItem.id,
      exercise_type: 'category-sorting' as ExerciseType,
      correct: false,
      response: selectedCategory || '',
      response_time_ms: Date.now() - startTime,
      timestamp: new Date(),
      language,
    });

    updateAfterAttempt(currentItem.id, language, 0);
    nextItem();
  }

  function nextItem() {
    feedbackState = 'none';
    incorrectAttempt = false;
    selectedCategory = null;
    startTime = Date.now();
    currentIndex++;
    if (currentIndex >= shuffledItems.length) {
      onComplete?.({ score, total: shuffledItems.length, details: results });
    }
  }

  function restart() {
    currentIndex = 0;
    feedbackState = 'none';
    incorrectAttempt = false;
    score = 0;
    results = [];
    startTime = Date.now();
    selectedCategory = null;
    const bins: Record<string, Word[]> = {};
    for (const cat of categories) {
      bins[cat] = [];
    }
    binItems = bins;
    shuffledItems = [...words].sort(() => Math.random() - 0.5);
  }

  // Category colors for visual distinction
  const categoryColors = [
    { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
    { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  ];

  function getCategoryStyle(index: number) {
    const c = categoryColors[index % categoryColors.length];
    return `background:${c.bg};border-color:${c.border};color:${c.text};`;
  }

  function translateCategory(category: string): string {
   const key = `categories.${category}`;
   const translated = $t(key);
   // If no translation found, return the original category name
   return translated === key ? category : translated;
 }

  function handleRestart() {
    restart();
    onRestart?.();
  }

  async function speakWord(word?: string) {
    const text = word ?? currentItem?.word;
    if (synthesis && !isSpeaking && text) {
      isSpeaking = true;
      await synthesis.speak(text, speechLang);
      isSpeaking = false;
    }
  }

  function handleCategoryResult(response: string) {
    if (!currentItem || feedbackState === 'correct') return;
    const cleaned = response.trim().toLowerCase();
    // Match against translated and raw category names
    const matchedCategory = categories.find(cat => {
      const translated = translateCategory(cat).toLowerCase();
      return translated === cleaned || cat.toLowerCase() === cleaned;
    });
    if (matchedCategory) {
      selectCategory(matchedCategory);
    }
    // If no match, the user can try again or use tap buttons
  }

  // Keyboard navigation params
  // Number keys 1-N map to category indices
  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(categories.length, 4),
    onSelectOption: (index) => {
      if (categories[index]) selectCategory(categories[index]);
    },
    onConfirm: () => {
      // No-op: auto-advances on correct
    },
    onSkip: skipItem,
    isActive: !isFinished && !!currentItem,
  });
</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !hasEnoughCategories}
  <div class="exercise-container">
    <p class="error-text">{$t('exercises.category_sorting.need_more_categories')}</p>
  </div>
{:else if !isFinished && currentItem}
  <div class="exercise-container" role="region" aria-label={$t('exercises.category_sorting.name') + ': ' + (currentItem ? currentItem.word : '')} use:keyboardNav={keyboardNavParams}>
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {shuffledItems.length}</span>
    </div>

    <!-- Current item card -->
    <div class="item-card" class:shake={feedbackState === 'incorrect'} class:correct-flash={feedbackState === 'correct'}>
     <div class="item-image-wrapper">
       <img
          src={resolveImageUrl(currentItem.image_url)}
         alt="Imagen del ejercicio"
          class="item-image"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div class="item-letter-fallback">
          <span>{currentItem.word[0].toUpperCase()}</span>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    {#if feedbackState === 'correct'}
      <div class="feedback correct" role="status" aria-live="polite">
        ✅ {$t('exercises.category_sorting.correct')}
        <button class="speak-btn" onclick={() => speakWord()} disabled={isSpeaking} aria-label="Listen">
          {isSpeaking ? '🔊…' : '🔊'}
        </button>
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status" aria-live="polite">
        🔄 {$t('exercises.category_sorting.wrong')}
      </div>
    {/if}

    <!-- Category tap buttons -->
    <div class="category-buttons">
      {#each categories as category, i}
        <button
          class="category-btn"
          style={getCategoryStyle(i)}
          onclick={() => selectCategory(category)}
          disabled={feedbackState === 'correct'}
          class:selected={selectedCategory === category && feedbackState === 'none'}
          class:correct-btn={feedbackState === 'correct' && getWordCategories(currentItem).includes(category)}
          class:incorrect-btn={feedbackState === 'incorrect' && selectedCategory === category}
          aria-label={translateCategory(category)}
        >
          <span class="btn-text">{translateCategory(category)}</span>
        </button>
      {/each}
    </div>

    {#if inputMode === 'open'}
      <SpeechInput
        language={speechLang}
        placeholder={$t('exercises.category_sorting.type_answer')}
        onresult={handleCategoryResult}
        disabled={feedbackState === 'correct'}
      />
    {/if}

    <!-- Skip button -->
    {#if feedbackState !== 'correct'}
      <button class="skip-button" onclick={skipItem}>
        ⏭️ {$t('common.skip')}
      </button>
    {/if}
  </div>
{/if}

{#if isFinished}
  <div class="exercise-container summary">
    <div class="summary-icon">🎉</div>
    <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>
    <!-- Star rating -->
    <div class="star-rating">
      {#if shuffledItems.length > 0 && (score / shuffledItems.length) >= 0.9}
        ⭐⭐⭐ {$t('feedback.excellent')}
      {:else if shuffledItems.length > 0 && (score / shuffledItems.length) >= 0.7}
        ⭐⭐ {$t('feedback.very_good')}
      {:else if shuffledItems.length > 0 && (score / shuffledItems.length) >= 0.5}
        ⭐ {$t('feedback.good_job')}
      {:else}
        {$t('feedback.keep_practicing')}
      {/if}
    </div>
    <p class="summary-score">
      {$t('feedback.score')}: {score} / {shuffledItems.length}
    </p>

    <!-- Results by category -->
    <div class="summary-bins">
      {#each categories as category, i}
        <div class="summary-bin" style={getCategoryStyle(i)}>
          <span class="summary-bin-label">{translateCategory(category)}</span>
          <span class="summary-bin-items">
            {#if binItems[category] && binItems[category].length > 0}
              {binItems[category].map(w => w.word).join(', ')}
            {:else}
              —
            {/if}
          </span>
        </div>
      {/each}
    </div>

    <!-- Detailed results -->
    <div class="summary-details">
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
          <span class="result-category">📁 {translateCategory(getWordCategories(result.word)[0])}</span>
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
    max-width: 700px;
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

  /* Item card */
  .item-card {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1;
    border-radius: var(--radius-lg, 16px);
    background: var(--surface, #f9fafb);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: box-shadow 0.3s ease;
  }

  .item-image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .item-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: var(--space-md, 16px);
    position: relative;
    z-index: 1;
  }

  .item-letter-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-light, #93c5fd), var(--primary, #3b82f6));
    z-index: 0;
  }

  .item-letter-fallback span {
    font-size: 72px;
    font-weight: 800;
    color: #fff;
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

  /* Category buttons */
  .category-buttons {
    display: flex;
    gap: var(--space-sm, 8px);
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .category-btn {
    flex: 1;
    min-width: 70px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm, 8px) var(--space-xs, 4px);
    border: 3px solid;
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    font-family: var(--font-family, sans-serif);
    font-size: var(--font-size-base, 16px);
    font-weight: 700;
    text-transform: capitalize;
    touch-action: manipulation;
    user-select: none;
    word-break: break-word;
    hyphens: auto;
    line-height: 1.2;
    text-align: center;
    transition: transform var(--transition-fast, 0.15s), box-shadow var(--transition-fast, 0.15s),
      filter var(--transition-fast, 0.15s);
  }

  .category-btn:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
  }

  .category-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .category-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .category-btn.selected {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
  }

  .category-btn.correct-btn {
    border-color: var(--success, #22c55e);
    background: var(--success, #22c55e);
    color: #fff;
    animation: correctPulse 0.6s ease;
  }

  .category-btn.incorrect-btn {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.15);
    color: var(--error, #ef4444);
    animation: shake 0.5s ease-in-out;
  }

  .btn-text {
    font-size: var(--font-size-lg, 20px);
  }

  /* Skip button */
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
    box-shadow: 0 0 0 4px var(--success, #22c55e), 0 0 24px rgba(34, 197, 94, 0.3) !important;
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

  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
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

  .summary-bins {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 500px;
  }

  .summary-bin {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border: 2px solid;
    border-radius: var(--radius-md, 12px);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-bin-label {
    font-weight: 700;
    text-transform: capitalize;
  }

  .summary-bin-items {
    font-size: var(--font-size-sm, 14px);
    opacity: 0.8;
  }

  .summary-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
    width: 100%;
    max-width: 400px;
    margin-top: var(--space-md, 16px);
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

  .result-category {
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
</style>
