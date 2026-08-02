<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType, Category } from '$lib/types';
  import { getWordCategories } from '$lib/types';
  import { shuffleArray } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { setSetting } from '$lib/db/settings';
  import Timer from '$lib/components/ui/Timer.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import OptionCard from './shared/OptionCard.svelte';

  interface PoolItem {
    word: string;
    isValid: boolean;
    categoryKey?: string;
  }

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
    timerEnabled = false,
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
  let challengeMode = $state(timerEnabled);
  let distractorNote = $state<{ word: string; categoryKey: string } | null>(null);
  let startTime = $state(0);
  let finalized = false;

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

  // Word pool: mix valid words with cross-category distractors.
  // Distractors carry their real category key for teaching feedback.
  let wordPool = $derived.by(() => {
    const pool: PoolItem[] = [];
    for (const w of words) pool.push({ word: w.word, isValid: true });

    const targetCats = new Set(words.flatMap((w) => getWordCategories(w)));
    const otherCategoryWords = allWords.filter(
      (w) => !validWordSet.has(w.word.trim().toLowerCase()) && !getWordCategories(w).some((c: Category) => targetCats.has(c)),
    );
    const distractorCount = Math.max(4, 8 - words.length);
    const shuffled = shuffleArray([...otherCategoryWords]).slice(0, distractorCount);
    for (const d of shuffled) {
      const cat = getWordCategories(d)[0];
      pool.push({ word: d.word, isValid: false, categoryKey: cat });
    }

    return shuffleArray(pool);
  });

  let validWordsFound = $derived([...selectedWords].filter((w) => validWordSet.has(w.toLowerCase())));
  let progressPercent = $derived(started && !finished ? (validWordsFound.length / Math.max(words.length, 1)) * 100 : 0);

  // Auto-clear distractor teaching note after 3 seconds
  $effect(() => {
    if (!distractorNote) return;
    const timer = setTimeout(() => {
      distractorNote = null;
    }, 3000);
    return () => clearTimeout(timer);
  });

  function startExercise() {
    started = true;
    running = true;
    startTime = Date.now();
  }

  function handleTimeout() {
    running = false;
    finished = true;
    finalize();
  }

  function handleSelectWord(item: PoolItem) {
    if (!running) return;
    const cleaned = item.word.trim().toLowerCase();

    if (validWordSet.has(cleaned)) {
      const next = new Set(selectedWords);
      if (next.has(cleaned)) {
        next.delete(cleaned);
      } else {
        next.add(cleaned);
      }
      selectedWords = next;

      // Auto-complete when all valid words are found
      if (next.size === validWordSet.size) {
        running = false;
        finished = true;
        finalize();
      }
    } else {
      // Distractor: show teaching feedback instead of a bare red X
      distractorNote = { word: item.word, categoryKey: item.categoryKey ?? '' };
    }
  }

  function wordState(word: string): 'default' | 'correct' | 'incorrect' {
    const cleaned = word.trim().toLowerCase();
    if (selectedWords.has(cleaned)) {
      return validWordSet.has(cleaned) ? 'correct' : 'incorrect';
    }
    // Flash incorrect for the distractor being shown in the teaching note
    if (distractorNote && distractorNote.word.trim().toLowerCase() === cleaned) {
      return 'incorrect';
    }
    return 'default';
  }

  function finishEarly() {
    if (finished) return;
    running = false;
    finished = true;
    finalize();
  }

  async function toggleChallengeMode() {
    challengeMode = !challengeMode;
    // Persist choice via the repurposed timer_enabled setting
    await setSetting('timer_enabled', challengeMode);
  }

  function finalize() {
    if (finalized) return;
    finalized = true;
    const elapsedMs = Date.now() - startTime;
    const foundSet = new Set(validWordsFound);

    // Record one trial per target word: correct if found, incorrect if missed
    for (const w of words) {
      const found = foundSet.has(w.word.trim().toLowerCase());
      recordTrial({
        wordId: w.id,
        exerciseType: EXERCISE_TYPE,
        language,
        correct: found,
        response: found ? w.word : '',
        responseTimeMs: elapsedMs,
      });
    }

    const details = words.map((w) => ({
      word: w,
      correct: foundSet.has(w.word.trim().toLowerCase()),
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
    optionCount: Math.min(wordPool.length, 9),
    onSelectOption: (index) => {
      if (wordPool[index]) handleSelectWord(wordPool[index]);
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

  let distractorFeedbackText = $derived.by(() => {
    if (!distractorNote) return '';
    const catKey = `categories.${distractorNote.categoryKey}`;
    const translated = $t(catKey);
    const catLabel = translated && translated !== catKey ? translated : distractorNote.categoryKey;
    return $t('exercises.generative_naming.distractor_note', {
      word: distractorNote.word,
      category: catLabel,
    });
  });
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !started}
  <!-- Start screen -->
  <div
    class="exercise-container"
    role="region"
    aria-label={$t('exercises.generative_naming.find_all', { category: categoryLabel })}
  >
    <div class="start-icon" aria-hidden="true">🏷️</div>
    <h2 class="category-title">
      {$t('exercises.generative_naming.find_all', { category: categoryLabel })}
    </h2>
    <p class="description">{$t('exercises.generative_naming.description')}</p>

    <!-- Challenge mode toggle -->
    <button
      type="button"
      class="challenge-toggle"
      class:toggle-on={challengeMode}
      onclick={toggleChallengeMode}
      role="switch"
      aria-checked={challengeMode}
      aria-label={$t('exercises.generative_naming.challenge_mode')}
    >
      <span class="toggle-track">
        <span class="toggle-thumb"></span>
      </span>
      <span class="toggle-text">
        <span class="toggle-label">{$t('exercises.generative_naming.challenge_mode')}</span>
        <span class="toggle-desc">{$t('exercises.generative_naming.challenge_mode_desc')}</span>
      </span>
    </button>

    {#if challengeMode}
      <div class="timer-preview">
        <Timer seconds={durationSeconds} running={false} showProgress={true} />
      </div>
    {/if}

    <button
      type="button"
      class="start-btn"
      onclick={startExercise}
      aria-label={$t('common.start')}
    >
      {$t('common.start')}
    </button>
  </div>
{:else if !finished}
  <!-- Active exercise: tap-to-select word pool -->
  <div class="exercise-container" use:keyboardNav={keyboardNavParams}>
    <ProgressBar
      value={progressPercent}
      label={$t('exercises.generative_naming.words_found_count', {
        found: String(validWordsFound.length),
        total: String(words.length),
      })}
      showPercentage
    />

    <h2 class="category-title">
      {$t('exercises.generative_naming.find_all', { category: categoryLabel })}
    </h2>

    {#if challengeMode}
      <Timer seconds={durationSeconds} {running} ontimeout={handleTimeout} showProgress={true} />
    {/if}

    {#if distractorFeedbackText}
      <div class="distractor-feedback shake" role="alert">
        {distractorFeedbackText}
      </div>
    {/if}

    <!-- Word pool -->
    <div class="word-pool">
      {#each wordPool as item}
        <OptionCard
          text={item.word}
          state={wordState(item.word)}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onselect={() => handleSelectWord(item)}
          onspeak={speak}
        />
      {/each}
    </div>

    <button
      type="button"
      class="finish-btn"
      onclick={finishEarly}
      aria-label={$t('exercises.generative_naming.finish')}
    >
      {$t('exercises.generative_naming.finish')}
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

  /* Challenge mode toggle */
  .challenge-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--space-sm, 8px);
    min-height: 56px;
    touch-action: manipulation;
    font-family: var(--font-family, sans-serif);
  }

  .challenge-toggle:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
    border-radius: var(--radius-sm, 8px);
  }

  .toggle-track {
    display: inline-flex;
    align-items: center;
    width: 52px;
    height: 30px;
    border-radius: 15px;
    background: var(--border, #e5e7eb);
    transition: background var(--transition-fast, 0.15s);
    flex-shrink: 0;
  }

  .challenge-toggle.toggle-on .toggle-track {
    background: var(--primary, #3b82f6);
  }

  .toggle-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    margin-left: 3px;
    transition: transform var(--transition-fast, 0.15s);
    box-shadow: var(--shadow-sm);
  }

  .challenge-toggle.toggle-on .toggle-thumb {
    transform: translateX(22px);
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .toggle-label {
    font-size: var(--font-size-base, 16px);
    font-weight: 700;
    color: var(--text, #1f2937);
  }

  .toggle-desc {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
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

  /* Distractor teaching note — uses global .shake animation from theme.css */
  .distractor-feedback {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid var(--error, #ef4444);
    border-radius: var(--radius-md, 12px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    font-size: var(--font-size-base, 16px);
    color: var(--text, #1f2937);
    text-align: center;
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
