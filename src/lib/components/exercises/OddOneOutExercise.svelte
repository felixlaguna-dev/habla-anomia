<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType, Category } from '$lib/types';
  import { getWordCategories } from '$lib/types';
  import { resolveImageUrl, shuffleArray, getCardState } from '$lib/utils/exercise-helpers';
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
    ttsVoiceUri?: string | null;
    speakButtonsEnabled?: boolean;
    oncomplete?: (results: {
      score: number;
      total: number;
      details: Array<{ word: Word; correct: boolean }>;
    }) => void;
    onrestart?: () => void;
  };

  let {
    words,
    allWords = [],
    language = 'es' as Language,
    speechRate = 0.8,
    ttsVoiceUri = null,
    speakButtonsEnabled = true,
    oncomplete,
    onrestart,
  }: Props = $props();

  const EXERCISE_TYPE = 'odd-one-out' as ExerciseType;

  // ── Semantic distance table ──────────────────────────────────────────
  // Distant pairs are conceptually far apart → easy discrimination.
  // Near pairs are conceptually close → harder discrimination.
  // Two tiers per spec: distant for word difficulty ≤ 2, near otherwise.
  const DISTANT_PAIRS: Array<[Category, Category]> = [
    ['food', 'vehicles'],
    ['animals', 'tools'],
    ['clothing', 'vehicles'],
    ['body-parts', 'food'],
    ['emotions', 'household'],
    ['weather', 'tools'],
    ['professions', 'nature'],
    ['toys', 'body-parts'],
    ['music', 'vehicles'],
    ['technology', 'animals'],
    ['sports', 'emotions'],
    ['places', 'food'],
    ['actions', 'technology'],
    ['colors', 'vehicles'],
    ['family', 'tools'],
    ['school', 'vehicles'],
  ];

  const NEAR_PAIRS: Array<[Category, Category]> = [
    ['food', 'nature'],
    ['animals', 'nature'],
    ['clothing', 'household'],
    ['body-parts', 'emotions'],
    ['tools', 'household'],
    ['vehicles', 'places'],
    ['weather', 'nature'],
    ['colors', 'nature'],
    ['sports', 'toys'],
    ['school', 'technology'],
    ['music', 'emotions'],
    ['family', 'emotions'],
    ['actions', 'sports'],
    ['professions', 'school'],
    ['food', 'animals'],
  ];

  interface Round {
    cards: Word[];
    intruderIndex: number;
    intruder: Word;
  }

  /**
   * Pick a base category for the intruder using the distance table.
   * Falls back to any available category not overlapping the intruder.
   */
  function findBaseCategory(
    intruderCats: Category[],
    availableCats: Set<Category>,
    useNear: boolean,
  ): Category | null {
    const pairs = useNear ? NEAR_PAIRS : DISTANT_PAIRS;
    const candidates = new Set<Category>();
    for (const [a, b] of pairs) {
      if (intruderCats.includes(a) && availableCats.has(b)) candidates.add(b);
      if (intruderCats.includes(b) && availableCats.has(a)) candidates.add(a);
    }
    if (candidates.size > 0) {
      return shuffleArray([...candidates])[0];
    }
    // Fallback: any available category (all are already non-overlapping
    // with the intruder — generateRound skips intruder categories).
    const fallback = shuffleArray([...availableCats]);
    return fallback[0] ?? null;
  }

  /**
   * Build a single round: 3 words from one category + the intruder.
   * Returns null if a valid round can't be constructed.
   * `byCategory` is pre-grouped once by `generateRounds` and reused across
   * all intruders to avoid rebuilding the Map per call.
   */
  function generateRound(intruder: Word, byCategory: Map<Category, Word[]>): Round | null {
    const intruderCats = getWordCategories(intruder);
    if (intruderCats.length === 0) return null;

    // For each category, find safe words (no category overlap with the
    // intruder). Multi-category words like { categories: ['food', 'nature'] }
    // must not appear as a "base" word if the intruder is also in 'food'.
    const catsWithThree = new Set<Category>();
    const safeByCat = new Map<Category, Word[]>();
    for (const [cat, words] of byCategory) {
      if (intruderCats.includes(cat)) continue;
      const safe = words.filter((w) =>
        w.id !== intruder.id &&
        !getWordCategories(w).some((c) => intruderCats.includes(c)),
      );
      if (safe.length >= 3) {
        catsWithThree.add(cat);
        safeByCat.set(cat, safe);
      }
    }
    if (catsWithThree.size === 0) return null;

    const useNear = intruder.difficulty > 2;
    const baseCategory = findBaseCategory(intruderCats, catsWithThree, useNear);
    if (!baseCategory) return null;

    const three = shuffleArray(safeByCat.get(baseCategory)!).slice(0, 3);
    const shuffled = shuffleArray([...three, intruder]);
    const intruderIndex = shuffled.findIndex((c) => c.id === intruder.id);

    return { cards: shuffled, intruderIndex, intruder };
  }

  function generateRounds(intruders: Word[], pool: Word[]): Round[] {
    // Pre-group the pool by category once so each generateRound call
    // iterates the grouped map instead of rescanning the full pool.
    const byCategory = new Map<Category, Word[]>();
    for (const w of pool) {
      for (const cat of getWordCategories(w)) {
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(w);
      }
    }

    return intruders
      .map((w) => generateRound(w, byCategory))
      .filter((r): r is Round => r !== null);
  }

  // ── State ──
  let rounds = $state<Round[]>([]);
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let selectedIndex = $state<number | null>(null);
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());
  let trialRecorded = $state(false);

  // ── TTS ──
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => {
      tts.destroy();
      roundTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));
  $effect(() => tts.setVoiceUri(ttsVoiceUri));

  function speak(text?: string) {
    tts.speak(text ?? currentRound?.intruder.word, speechLang);
  }

  const roundTimer = createCancellableTimer();

  // Generate rounds when the word list changes (init / restart / retry).
  $effect(() => {
    roundTimer.clear();
    // Deduplicate: session `words` are a subset of `allWords` (both from the
    // same Dexie table), so a naive spread would double-count every session
    // word in the category map, producing duplicate cards.
    const pool = [...new Map([...words, ...allWords].map((w) => [w.id, w])).values()];
    rounds = generateRounds(words, pool);
    currentIndex = 0;
    results = [];
  });

  let currentRound = $derived(rounds[currentIndex]);
  let isFinished = $derived(currentIndex >= rounds.length);
  let hasEnoughRounds = $derived(rounds.length > 0);

  // Reset per-round state when the round changes.
  $effect(() => {
    if (!currentRound) return;
    roundTimer.clear();
    selectedIndex = null;
    feedbackState = 'none';
    trialRecorded = false;
    startTime = Date.now();
  });

  function recordCurrentTrial(correct: boolean) {
    if (!currentRound || trialRecorded) return;
    trialRecorded = true;
    const intruder = currentRound.intruder;
    const response =
      selectedIndex !== null ? currentRound.cards[selectedIndex].word : '';
    results.push({ word: intruder, correct });
    recordTrial({
      wordId: intruder.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response,
      responseTimeMs: Date.now() - startTime,
    });
  }

  function selectCard(index: number) {
    if (!currentRound || feedbackState !== 'none') return;
    selectedIndex = index;
    const correct = index === currentRound.intruderIndex;

    feedbackState = correct ? 'correct' : 'incorrect';
    playFeedback(correct);

    recordCurrentTrial(correct);

    if (correct) {
      roundTimer.schedule(nextRound, FEEDBACK_TIMINGS.correctAdvance);
    } else {
      // Reveal mode: show the intruder, then advance.
      roundTimer.schedule(nextRound, FEEDBACK_TIMINGS.incorrectRevealAdvance);
    }
  }

  function skipRound() {
    if (!currentRound) return;
    recordCurrentTrial(false);
    nextRound();
  }

  function nextRound() {
    roundTimer.clear();
    if (isFinished) return;
    currentIndex++;
    if (currentIndex >= rounds.length) {
      oncomplete?.({ score, total: rounds.length, details: results });
    }
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: 4,
    onSelectOption: (index) => selectCard(index),
    onConfirm: () => {
      if (feedbackState === 'correct' || feedbackState === 'incorrect') nextRound();
    },
    onSkip: skipRound,
    isActive: !isFinished && !!currentRound,
  });

  // Card visual states derived via the shared getCardState so feedback
  // scoring stays consistent with all other exercises.
  let cardStates = $derived(
    currentRound
      ? currentRound.cards.map((_, i) =>
          getCardState(i, feedbackState, selectedIndex, currentRound.intruderIndex),
        )
      : [],
  );
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !hasEnoughRounds}
  <div class="exercise-error">
    <p class="error-text">{$t('exercises.odd_one_out.need_more_words')}</p>
  </div>
{:else if !isFinished && currentRound}
  <ExerciseShell
    current={currentIndex}
    total={rounds.length}
    ariaLabel={$t('exercises.odd_one_out.name')}
    {keyboardNavParams}
    active={!isFinished}
  >
    <!-- Prompt -->
    <p class="prompt">{$t('exercises.odd_one_out.prompt')}</p>

    <!-- Feedback -->
    <div class="feedback-slot">
      {#if feedbackState === 'correct'}
        <FeedbackBanner
          state="correct"
          text={$t('exercises.odd_one_out.correct', { word: currentRound.intruder.word })}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak()}
        />
      {:else if feedbackState === 'incorrect'}
        <FeedbackBanner
          state="incorrect"
          text={$t('exercises.odd_one_out.incorrect_reveal', { word: currentRound.intruder.word })}
        />
      {/if}
    </div>

    <!-- 2×2 grid of image cards -->
    <div class="card-grid">
      {#each currentRound.cards as card, i}
        <div
          class="image-card"
          class:selected={cardStates[i] === 'selected'}
          class:correct={cardStates[i] === 'correct'}
          class:incorrect={cardStates[i] === 'incorrect'}
        >
          <button
            type="button"
            class="card-button"
            onclick={() => selectCard(i)}
            disabled={feedbackState !== 'none'}
            aria-label={card.word}
          >
            <div class="card-image-wrapper">
              <img
                src={resolveImageUrl(card.image_url)}
                alt={card.word}
                class="card-image"
                onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div class="card-letter-fallback">
                <span>{card.word[0]?.toUpperCase() ?? '?'}</span>
              </div>
            </div>
            <span class="card-label">{card.word}</span>
          </button>
          {#if speakButtonsEnabled}
            <SpeakButton
              size="inline"
              disabled={tts.isSpeaking}
              isSpeaking={tts.isSpeaking}
              onclick={() => speak(card.word)}
            />
          {/if}
        </div>
      {/each}
    </div>

    <!-- Skip -->
    {#if feedbackState === 'none'}
      <button type="button" class="exercise-skip-button" onclick={skipRound} aria-label={$t('common.skip')}>
        ⏭️ {$t('common.skip')}
      </button>
    {/if}
  </ExerciseShell>
{/if}

<style>
  .prompt {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm, 8px);
    width: 100%;
    max-width: 500px;
  }

  .image-card {
    display: flex;
    align-items: stretch;
    gap: var(--space-xs, 4px);
    padding: var(--space-xs, 4px);
    background: var(--surface, #f9fafb);
    border: 3px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    transition:
      border-color var(--transition-fast, 0.15s),
      box-shadow var(--transition-fast, 0.15s),
      transform var(--transition-fast, 0.15s);
  }

  .card-button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs, 4px);
    min-height: 56px;
    padding: var(--space-sm, 8px);
    background: transparent;
    border: none;
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    font-family: var(--font-family, sans-serif);
  }

  .card-image-wrapper {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: var(--radius-md, 12px);
    overflow: hidden;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: var(--space-xs, 4px);
    position: relative;
    z-index: 1;
  }

  .card-letter-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-light, #93c5fd), var(--primary, #3b82f6));
    z-index: 0;
  }

  .card-letter-fallback span {
    font-size: 48px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }

  .card-label {
    font-size: var(--font-size-md, 16px);
    font-weight: 600;
    color: var(--text, #1f2937);
    text-align: center;
    line-height: 1.3;
  }

  /* Hover / active */
  .image-card:has(.card-button:hover:not(:disabled)) {
    border-color: var(--primary, #3b82f6);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  .image-card:has(.card-button:active:not(:disabled)) {
    transform: scale(0.97);
  }

  .image-card:has(.card-button:disabled) {
    opacity: 0.95;
  }

  /* Card states */
  .image-card.selected {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
  }

  .image-card.correct {
    border-color: var(--success, #22c55e);
    background: rgba(34, 197, 94, 0.15);
    animation: correctPulse 0.6s ease;
  }

  .image-card.incorrect {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
    animation: shake 0.5s ease-in-out;
  }

  .card-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  /* Animations */
  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  /* Tablet: keep 2×2 grid but enlarge cards */
  @media (min-width: 768px) {
    .card-grid {
      max-width: 600px;
      gap: var(--space-md, 16px);
    }

    .card-image {
      padding: var(--space-md, 16px);
    }

    .card-letter-fallback span {
      font-size: 64px;
    }

    .card-label {
      font-size: var(--font-size-lg, 20px);
    }
  }
</style>
