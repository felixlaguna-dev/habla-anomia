<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType, Category } from '$lib/types';
  import { getWordCategories } from '$lib/types';
  import { resolveImageUrl, shuffleArray } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playFeedback } from '$lib/utils/feedback';
  import { ExerciseShell, FeedbackBanner, SpeakButton, FEEDBACK_TIMINGS } from './shared';
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
      details: Array<{ word: Word; correct: boolean; selectedCategory: Category | null }>;
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

  const EXERCISE_TYPE = 'category-sorting' as ExerciseType;

  // Derive categories from the word list (flatten multi-category)
  let categories = $derived([...new Set(words.flatMap((w) => getWordCategories(w)))]);
  let hasEnoughCategories = $derived(categories.length >= 2);

  // --- State ---
  let shuffledItems = $state<Word[]>([]);
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let results = $state<Array<{ word: Word; correct: boolean; selectedCategory: Category | null }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
  let selectedCategory = $state<Category | null>(null);
  let trialRecorded = $state(false);
  let binItems = $state<Record<string, Word[]>>({});

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
    tts.speak(text ?? currentItem?.word, speechLang);
  }

  // Initialize shuffled items once
  // Re-initialise when words change (restart/retry swaps the array).
  $effect(() => {
    wordTimer.clear();
    shuffledItems = shuffleArray([...words]);
    const bins: Record<string, Word[]> = {};
    for (const cat of categories) bins[cat] = [];
    binItems = bins;
    currentIndex = 0;
    results = [];
    selectedCategory = null;
    feedbackState = 'none';
    trialRecorded = false;
    startTime = Date.now();
  });

  let currentItem = $derived(shuffledItems[currentIndex]);
  let isFinished = $derived(currentIndex >= shuffledItems.length);

  // Pending per-word timer.
  const wordTimer = createCancellableTimer();

  function recordCurrentTrial(correct: boolean, response: string) {
    if (!currentItem || trialRecorded) return;
    trialRecorded = true;
    const item = currentItem;
    results.push({ word: item, correct, selectedCategory: selectedCategory });
    recordTrial({
      wordId: item.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response,
      responseTimeMs: Date.now() - startTime,
    });
  }

  function selectCategory(category: Category) {
    if (!currentItem || feedbackState === 'correct') return;

    selectedCategory = category;
    const correct = getWordCategories(currentItem).includes(category);

    feedbackState = correct ? 'correct' : 'incorrect';
    playFeedback(correct);

    recordCurrentTrial(correct, category);

    if (correct) {
      binItems[category] = [...(binItems[category] || []), currentItem];
      wordTimer.schedule(nextItem, FEEDBACK_TIMINGS.correctAdvance);
    } else {
      wordTimer.schedule(() => {
        feedbackState = 'none';
        selectedCategory = null;
      }, FEEDBACK_TIMINGS.incorrectRetryReset);
    }
  }

  function skipItem() {
    if (!currentItem) return;
    recordCurrentTrial(false, '');
    nextItem();
  }

  function nextItem() {
    wordTimer.clear();
    currentIndex++;
    if (currentIndex >= shuffledItems.length) {
      oncomplete?.({ score, total: shuffledItems.length, details: results });
    }
  }

  // Category colors for visual distinction
  const categoryColors = [
    { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
    { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  ];

  function getCategoryStyle(index: number): string {
    const c = categoryColors[index % categoryColors.length];
    return `background:${c.bg};border-color:${c.border};color:${c.text};`;
  }

  function translateCategory(category: Category): string {
    const key = `categories.${category}`;
    const translated = $t(key);
    return translated === key ? category : translated;
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(categories.length, 4),
    onSelectOption: (index) => {
      if (categories[index]) selectCategory(categories[index]);
    },
    onConfirm: () => {
      if (feedbackState === 'incorrect') nextItem();
    },
    onSkip: skipItem,
    isActive: !isFinished && !!currentItem,
  });
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !hasEnoughCategories}
  <div class="exercise-error">
    <p class="error-text">{$t('exercises.category_sorting.need_more_categories')}</p>
  </div>
{:else if !isFinished && currentItem}
  <ExerciseShell
    current={currentIndex}
    total={shuffledItems.length}
    ariaLabel={$t('exercises.category_sorting.name') + ': ' + currentItem.word}
    {keyboardNavParams}
    tabletColumns="260px 1fr"
    active={!isFinished}
  >
    <!-- Current item card -->
    <div class="item-card" class:shake={feedbackState === 'incorrect'} class:correct-flash={feedbackState === 'correct'}>
      <div class="item-image-wrapper">
        <img
          src={resolveImageUrl(currentItem.image_url)}
          alt={$t('a11y.exercise_image')}
          class="item-image"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div class="item-letter-fallback">
          <span>{currentItem.word[0].toUpperCase()}</span>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={$t('exercises.category_sorting.correct')}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak()}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner state="incorrect" icon="🔄" text={$t('exercises.category_sorting.wrong')} />
      {/if}
    </div>

    <!-- Category buttons (speak button is a sibling, not nested) -->
    <div class="category-buttons">
      {#each categories as category, i}
        <div
          class="category-card"
          style={getCategoryStyle(i)}
          class:selected={selectedCategory === category && feedbackState === 'none'}
          class:correct-btn={feedbackState === 'correct' && getWordCategories(currentItem).includes(category)}
          class:incorrect-btn={feedbackState === 'incorrect' && selectedCategory === category}
        >
          <button
            type="button"
            class="category-btn"
            style={getCategoryStyle(i)}
            onclick={() => selectCategory(category)}
            disabled={feedbackState === 'correct'}
            aria-label={translateCategory(category)}
          >
            <span class="btn-text">{translateCategory(category)}</span>
          </button>
          {#if speakButtonsEnabled}
            <SpeakButton
              size="inline"
              disabled={tts.isSpeaking}
              isSpeaking={tts.isSpeaking}
              onclick={() => speak(translateCategory(category))}
            />
          {/if}
        </div>
      {/each}
    </div>

    <!-- Skip -->
    {#if feedbackState !== 'correct'}
      <button type="button" class="skip-button" onclick={skipItem} aria-label={$t('common.skip')}>
        ⏭️ {$t('common.skip')}
      </button>
    {/if}
  </ExerciseShell>
{/if}

<style>
  /* Item card */
  .item-card {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1;
    border-radius: var(--radius-lg, 16px);
    background: var(--surface, #f9fafb);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
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

  /* Category buttons */
  .category-buttons {
    display: flex;
    gap: var(--space-sm, 8px);
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .category-card {
    flex: 1;
    min-width: 8rem;
    display: flex;
    align-items: stretch;
    gap: var(--space-xs, 4px);
    padding: var(--space-xs, 4px);
    border: 3px solid;
    border-radius: var(--radius-lg, 16px);
    transition:
      filter var(--transition-fast, 0.15s),
      box-shadow var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
  }

  .category-btn {
    flex: 1;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm, 8px);
    border: none;
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    font-family: var(--font-family, sans-serif);
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    touch-action: manipulation;
    user-select: none;
    line-height: 1.2;
    text-align: center;
  }

  .category-card:hover:not(:has(.category-btn:disabled)) {
    filter: brightness(1.05);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  .category-card:has(.category-btn:active:not(:disabled)) {
    transform: scale(0.97);
  }

  .category-card:has(.category-btn:disabled) {
    opacity: 0.5;
  }

  .category-card.selected {
    border-color: var(--primary, #3b82f6);
    filter: brightness(0.95);
  }

  .category-card.correct-btn {
    border-color: var(--success, #22c55e) !important;
    background: var(--success, #22c55e) !important;
    animation: correctPulse 0.6s ease;
  }

  .category-card.correct-btn .category-btn {
    color: #fff !important;
  }

  .category-card.incorrect-btn {
    border-color: var(--error, #ef4444) !important;
    background: rgba(239, 68, 68, 0.15) !important;
    animation: shake 0.5s ease-in-out;
  }

  .category-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
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

  .skip-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Animations */
  .correct-flash {
    box-shadow:
      0 0 0 4px var(--success, #22c55e),
      0 0 24px rgba(34, 197, 94, 0.3) !important;
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-8px);
    }
    40% {
      transform: translateX(8px);
    }
    60% {
      transform: translateX(-4px);
    }
    80% {
      transform: translateX(4px);
    }
  }

  @keyframes correctPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Tablet: image left, category buttons right (grid provided by ExerciseShell) */
  @media (min-width: 768px) {
    .item-card {
      grid-column: 1;
      grid-row: 1 / span 20;
      align-self: start;
    }

    .feedback-slot,
    .category-buttons,
    .skip-button {
      grid-column: 2;
    }

    .category-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm, 8px);
    }
  }
</style>
