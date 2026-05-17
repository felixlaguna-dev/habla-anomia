<script lang="ts">
 import { t } from '$lib/i18n';
 import { recordAttempt } from '$lib/db/attempts';
 import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
 import { base } from '$app/paths';
 import type { Word, Language, ExerciseType } from '$lib/types';

  type Props = {
    words: Word[];
    language: Language;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean; selectedCategory: string }> }) => void;
  };

  let { words, language = 'es' as Language, onComplete }: Props = $props();

  // Derive categories from the word list
  let categories = $derived([...new Set(words.map(w => w.category))]);

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
  let progress = $derived((currentIndex / shuffledItems.length) * 100);
  let isFinished = $derived(currentIndex >= shuffledItems.length);

  function selectCategory(category: string) {
    if (!currentItem || feedbackState === 'correct') return;

    selectedCategory = category;
    const correct = currentItem.category === category;

    if (correct) {
      handleCorrect(category);
    } else {
      handleIncorrect();
    }
  }

  async function handleCorrect(category: string) {
    feedbackState = 'correct';
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

  function getCategoryBinStyle(index: number, isCorrect: boolean) {
    const c = categoryColors[index % categoryColors.length];
    return `background:${c.bg};border-color:${isCorrect ? '#22c55e' : c.border};`;
  }

 function translateCategory(category: string): string {
   const key = `categories.${category}`;
   const translated = $t(key);
   // If no translation found, return the original category name
   return translated === key ? category : translated;
 }

  function resolveImageUrl(url: string): string {
    if (!url) return '';
    if (base && url.startsWith('/')) return base + url;
    return url;
  }
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
  <div class="exercise-container" role="region" aria-label={$t('exercises.category_sorting.correct')}>
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: {progress}%"></div>
      <span class="progress-text">{currentIndex + 1} {$t('common.of')} {shuffledItems.length}</span>
    </div>

    <!-- Category bins at top -->
    <div class="bins-row">
      {#each categories as category, i}
        <div
          class="category-bin"
          class:correct-bin={feedbackState === 'correct' && currentItem.category === category}
          style={getCategoryBinStyle(i, feedbackState === 'correct' && currentItem.category === category)}
        >
          <span class="bin-label">{translateCategory(category)}</span>
          {#if binItems[category] && binItems[category].length > 0}
            <span class="bin-count">{binItems[category].length}</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Current item card -->
    <div class="item-card" class:shake={feedbackState === 'incorrect'} class:correct-flash={feedbackState === 'correct'}>
     <div class="item-image-wrapper">
       <img
          src={resolveImageUrl(currentItem.image_url)}
         alt=""
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
      <div class="feedback correct" role="status">
        ✅ {$t('exercises.category_sorting.correct')}
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status">
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
          class:selected={selectedCategory === category && feedbackState === 'incorrect'}
        >
          <span class="btn-text">{translateCategory(category)}</span>
        </button>
      {/each}
    </div>

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
          <span class="result-category">📁 {translateCategory(result.word.category)}</span>
        </div>
      {/each}
    </div>
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
    max-width: 700px;
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

  /* Category bins */
  .bins-row {
    display: flex;
    gap: var(--space-sm, 8px);
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .category-bin {
    flex: 1;
    min-width: 120px;
    min-height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: var(--space-sm, 8px) var(--space-xs, 4px);
    border: 2px dashed;
    border-radius: var(--radius-md, 12px);
    transition: all 0.3s ease;
  }

  .category-bin.correct-bin {
    border-style: solid;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
    transform: scale(1.05);
  }

  .bin-label {
    font-size: var(--font-size-sm, 14px);
    font-weight: 700;
    text-transform: capitalize;
  }

  .bin-count {
    font-size: var(--font-size-xs, 12px);
    opacity: 0.7;
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
    min-width: 140px;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md, 16px) var(--space-sm, 8px);
    border: 3px solid;
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    font-family: var(--font-family, sans-serif);
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    text-transform: capitalize;
    touch-action: manipulation;
    user-select: none;
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
    animation: shake 0.4s ease-in-out;
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
</style>
