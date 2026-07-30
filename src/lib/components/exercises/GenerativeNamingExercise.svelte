<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType, Category } from '$lib/types';
  import { getWordCategories } from '$lib/types';
  import { shuffleArray } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import Timer from '$lib/components/ui/Timer.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import OptionCard from './shared/OptionCard.svelte';

  type Props = {
    words: Word[];
    allWords?: Word[];
    speechRate?: number;
    speakButtonsEnabled?: boolean;
    timerEnabled?: boolean;
    language?: Language;
    category?: string;
    durationSeconds?: number;
    oncomplete?: (results: {
      score: number;
      total: number;
      wordsFound: string[];
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
    timerEnabled = true,
    category,
    durationSeconds = 60,
    oncomplete,
    onrestart,
  }: Props = $props();

  const EXERCISE_TYPE = 'generative-naming' as ExerciseType;

  // --- State ---
  let running = $state(false);
  let started = $state(false);
  let finished = $state(false);
  let selectedWords = $state<Set<string>>(new Set());

  // --- TTS ---
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => tts.destroy();
  });
  $effect(() => tts.setRate(speechRate));

  function speak(text?: string) {
    tts.speak(text, speechLang);
  }

  // Category derived from words
  let categoryName = $derived(
    category || (words.length > 0 ? (words[0].features?.category ?? getWordCategories(words[0])[0] ?? '') : ''),
  );

  // Lookup set of valid words (lowercase)
  let validWordSet = $derived.by(() => {
    const set = new Set<string>();
    for (const w of words) set.add(w.word.trim().toLowerCase());
    return set;
  });

  // Word pool: mix valid words with cross-category distractors
  let wordPool = $derived.by(() => {
    const pool: Array<{ word: string; isValid: boolean }> = [];
    for (const w of words) pool.push({ word: w.word, isValid: true });

    const targetCats = new Set(words.flatMap((w) => getWordCategories(w)));
    const otherCategoryWords = allWords.filter(
      (w) => !validWordSet.has(w.word.trim().toLowerCase()) && !getWordCategories(w).some((c: Category) => targetCats.has(c)),
    );
    const distractorCount = Math.max(4, 8 - words.length);
    const shuffled = shuffleArray([...otherCategoryWords]).slice(0, distractorCount);
    for (const d of shuffled) pool.push({ word: d.word, isValid: false });

    return shuffleArray(pool);
  });

  let validWordsFound = $derived([...selectedWords].filter((w) => validWordSet.has(w.toLowerCase())));
  let score = $derived(validWordsFound.length);
  let progressPercent = $derived(started && !finished ? (validWordsFound.length / Math.max(words.length, 1)) * 100 : 0);

  function startExercise() {
    started = true;
    running = true;
  }

  function handleTimeout() {
    running = false;
    finished = true;
    finalize();
  }

  function toggleWord(word: string) {
    if (!running) return;
    const cleaned = word.trim().toLowerCase();
    const next = new Set(selectedWords);
    if (next.has(cleaned)) next.delete(cleaned);
    else next.add(cleaned);
    selectedWords = next;
  }

  function wordState(word: string): 'default' | 'correct' | 'incorrect' {
    const cleaned = word.trim().toLowerCase();
    if (!selectedWords.has(cleaned)) return 'default';
    return validWordSet.has(cleaned) ? 'correct' : 'incorrect';
  }

  function finishEarly() {
    running = false;
    finished = true;
    finalize();
  }

  function finalize() {
    // Record one trial per word: correct if found, incorrect if missed.
    for (const w of words) {
      const found = validWordsFound.includes(w.word.trim().toLowerCase());
      recordTrial({
        wordId: w.id,
        exerciseType: EXERCISE_TYPE,
        language,
        correct: found,
        response: found ? w.word : '',
        responseTimeMs: durationSeconds * 1000,
      });
    }

    const details = words.map((w) => ({
      word: w,
      correct: validWordsFound.includes(w.word.trim().toLowerCase()),
    }));

    oncomplete?.({
      score: validWordsFound.length,
      total: words.length,
      wordsFound: validWordsFound,
      details,
    });
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => 'none',
    optionCount: Math.min(wordPool.length, 4),
    onSelectOption: (index) => {
      if (wordPool[index]) toggleWord(wordPool[index].word);
    },
    onConfirm: finishEarly,
    onSkip: finishEarly,
    isActive: started && !finished,
  });

  let categoryLabel = $derived.by(() => {
    const key = `categories.${categoryName}`;
    const translated = $t(key);
    return translated && translated !== key ? translated.toUpperCase() : categoryName.toUpperCase();
  });
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !started}
  <!-- Start screen -->
  <div class="exercise-container" role="region" aria-label={$t('exercises.generative_naming.name_all', { category: categoryLabel })}>
    <div class="start-icon" aria-hidden="true">🏷️</div>
    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>
    <p class="description">{$t('exercises.generative_naming.description')}</p>

    {#if timerEnabled}
      <div class="timer-preview">
        <Timer seconds={durationSeconds} running={false} showProgress={true} />
      </div>
    {/if}

    <button type="button" class="start-btn" onclick={startExercise} aria-label={$t('common.start')}>
      {$t('common.start')}
    </button>
  </div>
{:else if !finished}
  <!-- Active exercise: tap-to-select word pool -->
  <div class="exercise-container" use:keyboardNav={keyboardNavParams}>
    <ProgressBar value={progressPercent} label={`${validWordsFound.length} / ${words.length}`} showPercentage />

    <h2 class="category-title">
      {$t('exercises.generative_naming.name_all', { category: categoryLabel })}
    </h2>

    {#if timerEnabled}
      <Timer seconds={durationSeconds} {running} ontimeout={handleTimeout} showProgress={true} />
    {/if}

    <div class="word-count">
      <span class="count-label">{$t('exercises.generative_naming.words_found')}:</span>
      <span class="count-value">{validWordsFound.length}</span>
    </div>

    <!-- Word pool: OptionCard per item (fixes keyboard handler + nested button issues) -->
    <div class="word-pool">
      {#each wordPool as item}
        <OptionCard
          text={item.word}
          state={wordState(item.word)}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onselect={() => toggleWord(item.word)}
          onspeak={speak}
        />
      {/each}
    </div>

    <button type="button" class="finish-btn" onclick={finishEarly} aria-label={$t('common.next')}>
      {$t('common.next')} →
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

  /* Start screen */
  .start-icon {
    font-size: 64px;
    line-height: 1;
  }

  .category-title {
    font-size: var(--font-size-xl, 24px);
    font-weight: 800;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }

  .description {
    font-size: var(--font-size-base, 16px);
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }

  .timer-preview {
    padding: var(--space-md, 16px) 0;
  }

  .start-btn {
    min-height: 64px;
    min-width: 56px;
    padding: 14px 48px;
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    font-family: var(--font-family, sans-serif);
    background: var(--primary, #3b82f6);
    color: #fff;
    border: 2px solid var(--primary, #3b82f6);
    border-radius: var(--radius-lg, 16px);
    cursor: pointer;
    transition:
      background var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .start-btn:hover {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }

  .start-btn:active {
    transform: scale(0.97);
  }

  .start-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Word count */
  .word-count {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .count-label {
    font-size: var(--font-size-lg, 20px);
    color: var(--text-muted, #6b7280);
  }

  .count-value {
    font-size: var(--font-size-2xl, 28px);
    font-weight: 800;
    color: var(--primary, #3b82f6);
  }

  /* Word pool grid */
  .word-pool {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm, 8px);
    width: 100%;
    max-width: 500px;
  }

  /* Finish button */
  .finish-btn {
    min-height: 56px;
    min-width: 56px;
    padding: 12px 36px;
    font-size: var(--font-size-lg, 20px);
    font-weight: 700;
    font-family: var(--font-family, sans-serif);
    background: var(--primary, #3b82f6);
    color: #fff;
    border: 2px solid var(--primary, #3b82f6);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    transition:
      background var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
  }

  .finish-btn:hover {
    filter: brightness(1.1);
  }

  .finish-btn:active {
    transform: scale(0.97);
  }

  .finish-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Tablet: wider container, more columns for word pool */
  @media (min-width: 768px) {
    .exercise-container {
      max-width: none;
    }

    .word-pool {
      grid-template-columns: repeat(4, 1fr);
      max-width: none;
      gap: var(--space-xs, 6px);
    }
  }

  @media (min-width: 1024px) {
    .word-pool {
      grid-template-columns: repeat(5, 1fr);
    }
  }
</style>
