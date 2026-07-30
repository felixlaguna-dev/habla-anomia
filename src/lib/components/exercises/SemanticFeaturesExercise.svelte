<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Word, Language, ExerciseType, SemanticFeatures } from '$lib/types';
  import { resolveImageUrl, shuffleArray, buildFeatureDistractors, buildDistractors } from '$lib/utils/exercise-helpers';
  import { useTts, speechLangFor } from '$lib/utils/tts.svelte';
  import { recordTrial } from '$lib/utils/record-trial';
  import { createCancellableTimer } from '$lib/utils/timer';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { ExerciseShell, OptionGrid, FeedbackBanner, FEEDBACK_TIMINGS } from './shared';
  import './shared/exercise-common.css';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import { CATEGORIES } from '$lib/types';

  type Props = {
    words: Word[];
    allWords?: Word[];
    language?: Language;
    speechRate?: number;
    speakButtonsEnabled?: boolean;
    oncomplete?: (results: {
      score: number;
      total: number;
      details: Array<{ word: Word; correct: boolean; featuresCorrect: number }>;
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

  const EXERCISE_TYPE = 'semantic-features' as ExerciseType;

  // --- State ---
  let currentIndex = $state(0);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let imageError = $state(false);
  let results = $state<Array<{ word: Word; correct: boolean; featuresCorrect: number }>>([]);
  let score = $derived(results.filter((r) => r.correct).length);
  let startTime = $state(Date.now());

  // Feature tracking
  let currentFeatureIndex = $state(0);
  let answeredFeatures = $state<Record<string, boolean>>({});
  let showNamingPrompt = $state(false);
  let namingCorrect = $state<boolean | null>(null);

  // --- TTS ---
  const tts = useTts();
  let speechLang = $derived(speechLangFor(language));
  onMount(() => {
    tts.init();
    return () => {
      tts.destroy();
      stepTimer.clear();
    };
  });
  $effect(() => tts.setRate(speechRate));

  function speak(text?: string) {
    tts.speak(text ?? currentWord?.word, speechLang);
  }

  let currentWord = $derived(words[currentIndex]);
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

  // --- Phase options ---
  // Feature-step options: translated strings (category names or feature values)
  let featureOptions = $state<string[]>([]);
  let selectedFeatureIndex = $state<number | null>(null);

  function displayOption(option: string, key: string): string {
    return key === 'category' ? $t('categories.' + option) : option;
  }

  // Build feature options when the feature step changes
  $effect(() => {
    if (!currentPrompt || !words.length) {
      featureOptions = [];
      return;
    }

    const correctAnswer = currentPrompt.answer;
    const key = currentPrompt.key;
    let wrongOptions: string[];

    if (key === 'category') {
      wrongOptions = shuffleArray(CATEGORIES.filter((c) => c !== correctAnswer)).slice(0, 3);
    } else {
      wrongOptions = buildFeatureDistractors(
        key as keyof SemanticFeatures,
        correctAnswer,
        currentWord?.id,
        words,
        allWords,
      );
    }

    const rawOptions = shuffleArray([correctAnswer, ...wrongOptions]);
    // Translate category names for display; keep raw answers for scoring.
    featureOptions = rawOptions.map((o) => displayOption(o, key));
    selectedFeatureIndex = null;
  });

  let featureCorrectIndex = $derived(featureOptions.indexOf(displayOption(currentPrompt?.answer ?? '', currentPrompt?.key ?? '')));

  // Naming-step options
  let namingWords = $state<Word[]>([]);
  let namingOptions = $derived(namingWords.map((w) => w.word));
  let namingSelectedIndex = $state<number | null>(null);
  let namingCorrectIndex = $derived(namingWords.findIndex((w) => w.id === currentWord?.id));

  $effect(() => {
    if (!showNamingPrompt || !currentWord) return;
    namingWords = buildDistractors(currentWord, words, allWords, 'word');
    namingSelectedIndex = null;
  });

  // Reset per-word state when the current word changes
  $effect(() => {
    if (!currentWord) return;
    stepTimer.clear();
    currentFeatureIndex = 0;
    answeredFeatures = {};
    showNamingPrompt = false;
    namingCorrect = null;
    imageError = false;
    feedbackState = 'none';
    startTime = Date.now();
  });

  // Pending step timer (reveal-then-advance for both feature and naming steps).
  const stepTimer = createCancellableTimer();

  // --- Feature step handler (reveal-then-advance) ---
  function selectFeatureOption(index: number) {
    if (feedbackState !== 'none' || !currentPrompt) return;
    selectedFeatureIndex = index;

    const selectedText = featureOptions[index];
    const correctText = displayOption(currentPrompt.answer, currentPrompt.key);
    const correct = selectedText === correctText;
    answeredFeatures[currentPrompt.key] = correct;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    stepTimer.schedule(() => {
      feedbackState = 'none';
      advanceFeature();
    }, correct ? FEEDBACK_TIMINGS.correctAdvance : FEEDBACK_TIMINGS.incorrectRevealAdvance);
  }

  function advanceFeature() {
    currentFeatureIndex++;
    selectedFeatureIndex = null;
    if (currentFeatureIndex >= featurePrompts.length) {
      showNamingPrompt = true;
    }
  }

  // --- Naming step handler (reveal-then-advance, records the trial) ---
  function selectNamingChoice(index: number) {
    if (namingCorrect !== null || !currentWord) return;
    namingSelectedIndex = index;

    const selectedWord = namingWords[index];
    const correct = !!selectedWord && selectedWord.id === currentWord.id;
    namingCorrect = correct;

    feedbackState = correct ? 'correct' : 'incorrect';
    if (correct) playCorrectSound();
    else playIncorrectSound();

    const featCorrect = featuresCorrectCount;
    // Richer quality model: partial credit based on features answered correctly.
    const quality = correct
      ? featCorrect >= 3 ? 5 : featCorrect >= 2 ? 4 : 3
      : featCorrect >= 2 ? 2 : 0;

    results.push({ word: currentWord, correct, featuresCorrect: featCorrect });
    recordTrial({
      wordId: currentWord.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct,
      response: selectedWord?.word ?? '',
      quality,
      responseTimeMs: Date.now() - startTime,
    });

    stepTimer.schedule(nextWord, correct ? FEEDBACK_TIMINGS.correctAdvance : FEEDBACK_TIMINGS.incorrectRevealAdvance);
  }

  function skipNaming() {
    if (!currentWord || namingCorrect !== null) return;
    namingCorrect = false;

    const featCorrect = featuresCorrectCount;
    results.push({ word: currentWord, correct: false, featuresCorrect: featCorrect });
    recordTrial({
      wordId: currentWord.id,
      exerciseType: EXERCISE_TYPE,
      language,
      correct: false,
      response: '',
      quality: featCorrect >= 2 ? 2 : 0,
      responseTimeMs: Date.now() - startTime,
    });

    nextWord();
  }

  function nextWord() {
    stepTimer.clear();
    currentIndex++;
    if (currentIndex >= words.length) {
      oncomplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    stepTimer.clear();
    currentIndex = 0;
    results = [];
    feedbackState = 'none';
    imageError = false;
    currentFeatureIndex = 0;
    answeredFeatures = {};
    showNamingPrompt = false;
    namingCorrect = null;
    startTime = Date.now();
  }

  function handleImageError() {
    imageError = true;
  }

  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: showNamingPrompt
      ? Math.min(namingOptions.length, 4)
      : Math.min(featureOptions.length, 4),
    onSelectOption: (index) => {
      if (showNamingPrompt) selectNamingChoice(index);
      else if (featureOptions.length) selectFeatureOption(index);
    },
    onConfirm: () => {},
    onSkip: showNamingPrompt ? skipNaming : () => {},
    isActive: !isFinished && !!currentWord && namingCorrect === null,
  });
</script>

{#if words.length === 0}
  <div class="exercise-error">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <ExerciseShell
    current={currentIndex}
    total={words.length}
    ariaLabel={$t('exercises.semantic_features.now_name_it')}
    {keyboardNavParams}
    tabletColumns="280px 1fr"
    active={!isFinished}
  >
    <!-- Image area -->
    <div class="exercise-image-area" class:correct-flash={namingCorrect === true} class:shake={namingCorrect === false || feedbackState === 'incorrect'}>
      {#if !imageError}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('a11y.exercise_image')}
          class="stimulus-image"
          onerror={handleImageError}
        />
      {:else}
        <div class="image-fallback">
          <span class="fallback-letter">{currentWord.word?.[0]?.toUpperCase() ?? '?'}</span>
          <span class="fallback-hint" aria-hidden="true">📷</span>
        </div>
      {/if}
    </div>

    <!-- Feature dots (progress indicator) -->
    <div class="features-bar">
      {#each featurePrompts as feat, i}
        <div
          class="feature-dot"
          class:correct-answer={answeredFeatures[feat.key] === true}
          class:wrong-answer={answeredFeatures[feat.key] === false}
          class:current={i === currentFeatureIndex && !showNamingPrompt}
          class:pending={i > currentFeatureIndex && !showNamingPrompt}
          aria-hidden="true"
        >
          {#if answeredFeatures[feat.key] === true}✅{:else if answeredFeatures[feat.key] === false}❌{:else if i === currentFeatureIndex && !showNamingPrompt}🔵{:else}⬜{/if}
        </div>
      {/each}
    </div>

    <!-- Feature question prompt -->
    {#if !allFeaturesAnswered && currentPrompt && feedbackState === 'none'}
      <p class="question-prompt">{currentPrompt.prompt}</p>
    {/if}

    <!-- Feedback for feature step -->
    <div class="feedback-slot">
      {#if feedbackState !== 'none' && !showNamingPrompt && currentPrompt}
        <FeedbackBanner
          state={feedbackState}
          text={feedbackState === 'correct'
            ? $t('feedback.correct')
            : $t('feedback.the_answer_was', { answer: displayOption(currentPrompt.answer, currentPrompt.key) })}
        />
      {/if}
    </div>

    <!-- Feature options -->
    {#if !allFeaturesAnswered && currentPrompt}
      <OptionGrid
        options={featureOptions}
        {feedbackState}
        selectedIndex={selectedFeatureIndex}
        correctIndex={featureCorrectIndex}
        disabled={feedbackState !== 'none'}
        speakEnabled={speakButtonsEnabled}
        isSpeaking={tts.isSpeaking}
        twoColumns
        onselect={selectFeatureOption}
        onspeak={speak}
      />
    {/if}

    <!-- Naming prompt -->
    {#if showNamingPrompt && namingCorrect === null}
      <p class="naming-prompt">{$t('exercises.semantic_features.now_name_it')}</p>
    {/if}

    <!-- Naming feedback -->
    <div class="feedback-slot">
      {#if namingCorrect === true}
        <FeedbackBanner
          state="correct"
          text={currentWord.word}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak()}
        />
      {:else if namingCorrect === false}
        <FeedbackBanner
          state="incorrect"
          text={$t('feedback.the_answer_was', { answer: currentWord.word })}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={() => speak(currentWord.word)}
        />
      {/if}
    </div>

    <!-- Naming options -->
    {#if showNamingPrompt && namingCorrect === null}
      <div class="naming-grid">
        <OptionGrid
          options={namingOptions}
          feedbackState={namingCorrect === true ? 'correct' : namingCorrect === false ? 'incorrect' : 'none'}
          selectedIndex={namingSelectedIndex}
          correctIndex={namingCorrectIndex}
          disabled={namingCorrect !== null}
          speakEnabled={speakButtonsEnabled}
          isSpeaking={tts.isSpeaking}
          twoColumns
          onselect={selectNamingChoice}
          onspeak={speak}
        />
        <button type="button" class="exercise-skip-button" onclick={skipNaming} aria-label={$t('common.skip')}>
          ⏭️ {$t('common.skip')}
        </button>
      </div>
    {/if}
  </ExerciseShell>
{/if}

<style>
  .features-bar {
    display: flex;
    gap: var(--space-sm, 8px);
    justify-content: center;
  }

  .feature-dot {
    font-size: 24px;
    transition: transform 0.2s ease;
  }

  .feature-dot.current { transform: scale(1.3); }

  .question-prompt,
  .naming-prompt {
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
  }

  .naming-grid {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  @media (min-width: 768px) {
    .exercise-image-area {
      grid-column: 1;
      grid-row: 1 / span 20;
      max-width: 250px;
      max-height: 350px;
      aspect-ratio: auto;
      align-self: start;
    }

    .features-bar,
    .question-prompt,
    .naming-prompt,
    .feedback-slot,
    .naming-grid {
      grid-column: 2;
    }
  }
</style>
