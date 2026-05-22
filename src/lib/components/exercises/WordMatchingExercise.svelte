<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { recordAttempt } from '$lib/db/attempts';
  import { updateAfterAttempt } from '$lib/engine/spaced-repetition';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import SpeechInput from '$lib/components/speech/SpeechInput.svelte';
  import { ProgressBar } from '$lib/components/ui';
  import { playCorrectSound, playIncorrectSound } from '$lib/utils/sounds';
  import { resolveImageUrl, getCardState } from '$lib/utils/exercise-helpers';
  import { keyboardNav } from '$lib/utils/keyboard-nav';
  import type { KeyboardNavParams } from '$lib/utils/keyboard-nav';
  import type { Word, Language, ExerciseType } from '$lib/types';

  type MatchingMode = 'word-to-definition' | 'definition-to-word' | 'image-to-word';

  type Props = {
    words: Word[];
    language?: Language;
    speechEnabled?: boolean;
    speechRate?: number;
    mode?: MatchingMode;
    onComplete?: (results: { score: number; total: number; details: Array<{ word: Word; correct: boolean }> }) => void;
    onRestart?: () => void;
  };

  let {
    words,
    language = 'es' as Language, speechEnabled = true, speechRate = 0.8,
    mode = 'word-to-definition',
    onComplete,
    onRestart,
  }: Props = $props();

  // State
  let currentIndex = $state(0);
  let selectedIndex = $state<number | null>(null);
  let feedbackState = $state<'none' | 'correct' | 'incorrect'>('none');
  let correctIndex = $state(0);
  let options = $state<{ text: string; word: Word }[]>([]);
  let score = $state(0);
  let results = $state<Array<{ word: Word; correct: boolean }>>([]);
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

  // inputMode concept (not used in UI for this exercise)
  let inputMode = $derived<'choice' | 'open'>(speechEnabled ? 'open' : 'choice');
  let speechLang = $derived(language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : language === 'eu' ? 'eu-ES' : 'en-US');

  // Derived
  let currentWord = $derived(words[currentIndex]);
  let progress = $derived(Math.round(((currentIndex + 1) / words.length) * 100));
  let isFinished = $derived(currentIndex >= words.length);

  // Build options for current word
  function buildOptions() {
    if (!currentWord) return;

    const correctAnswer = getCorrectAnswer(currentWord);

    // Get 3 distractors from same category or any words
    const otherWords = words.filter(w => w.id !== currentWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3);

    // If not enough distractors, fill with generic options
    while (distractors.length < 3) {
      distractors.push({
        ...currentWord,
        id: `distract-${distractors.length}`,
        word: `---`,
        definition: '---',
      });
    }

    const allOptions = [
      { text: correctAnswer, word: currentWord },
      ...distractors.map(d => ({ text: getDistractorText(d), word: d })),
    ];

    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    options = allOptions;
    correctIndex = allOptions.findIndex(o => o.word.id === currentWord.id);
  }

  function getCorrectAnswer(word: Word): string {
    if (mode === 'word-to-definition') {
      return word.definition ?? '';
    } else if (mode === 'definition-to-word') {
      return word.word ?? '';
    } else {
      // image-to-word: show word
      return word.word ?? '';
    }
  }

  function getDistractorText(word: Word): string {
    if (mode === 'word-to-definition') {
      return word.definition ?? '---';
    } else {
      return word.word ?? '---';
    }
  }

  // Initialize options when currentWord changes
  $effect(() => {
    if (currentWord) {
      selectedIndex = null;
      feedbackState = 'none';
      buildOptions();
    }
  });

  // Prompt text shown at top
  let promptText = $derived.by(() => {
    if (!currentWord) return '';
    if (mode === 'word-to-definition') {
      return currentWord.word;
    } else if (mode === 'definition-to-word') {
      return currentWord.definition;
    } else {
      // image-to-word
      return '';
    }
  });

  let promptLabel = $derived.by(() => {
    if (mode === 'word-to-definition') {
      return $t('exercises.word_matching.match_definition');
    } else if (mode === 'definition-to-word') {
      return $t('exercises.word_matching.match_word');
    } else {
      return $t('exercises.word_matching.select_answer');
    }
  });

  function handleSelect(index: number) {
    if (feedbackState !== 'none') return;
    selectedIndex = index;

    const isCorrect = index === correctIndex;

    if (isCorrect) {
      feedbackState = 'correct';
      playCorrectSound();
      score++;
      results.push({ word: currentWord, correct: true });

      const responseTime = Date.now() - startTime;

      recordAttempt({
        word_id: currentWord.id,
        exercise_type: 'word-matching' as ExerciseType,
        correct: true,
        response: options[index].text,
        response_time_ms: responseTime,
        timestamp: new Date(),
        language,
      });
      updateAfterAttempt(currentWord.id, language, 5);

      setTimeout(nextWord, 1200);
    } else {
      feedbackState = 'incorrect';
      playIncorrectSound();
      results.push({ word: currentWord, correct: false });

      recordAttempt({
        word_id: currentWord.id,
        exercise_type: 'word-matching' as ExerciseType,
        correct: false,
        response: options[index].text,
        response_time_ms: Date.now() - startTime,
        timestamp: new Date(),
        language,
      });
      updateAfterAttempt(currentWord.id, language, 1);

      setTimeout(nextWord, 2000);
    }
  }

  function skipWord() {
    results.push({ word: currentWord, correct: false });
    recordAttempt({
      word_id: currentWord.id,
      exercise_type: 'word-matching' as ExerciseType,
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
    currentIndex++;
    startTime = Date.now();
    if (currentIndex >= words.length) {
      onComplete?.({ score, total: words.length, details: results });
    }
  }

  function restart() {
    currentIndex = 0;
    selectedIndex = null;
    feedbackState = 'none';
    score = 0;
    results = [];
    startTime = Date.now();
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

  function handleMatchResult(response: string) {
    if (feedbackState !== 'none' || !currentWord) return;
    const cleaned = response.trim().toLowerCase();
    // Find a matching option
    const matchedIndex = options.findIndex(opt => opt.text.trim().toLowerCase() === cleaned);
    if (matchedIndex >= 0) {
      handleSelect(matchedIndex);
    }
    // If no match, the user can try again or use tap buttons
  }

  // Keyboard navigation params
  let keyboardNavParams = $derived<KeyboardNavParams>({
    getFeedbackState: () => feedbackState,
    optionCount: Math.min(options.length, 4),
    onSelectOption: (index) => handleSelect(index),
    onConfirm: () => {
      // During feedback, advance to next word immediately
      if (feedbackState !== 'none') nextWord();
    },
    onSkip: skipWord,
    isActive: !isFinished && !!currentWord,
  });

  // Encouragement
  function getRandomEncouragement() {
    const msgs = [$t('feedback.correct'), $t('feedback.well_done'), $t('feedback.excellent'), $t('feedback.keep_going'), $t('feedback.great_effort')];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

</script>

{#if words.length === 0}
  <div class="exercise-container">
    <p class="error-text">{$t('common.no_words')}</p>
  </div>
{:else if !isFinished && currentWord}
  <div class="exercise-container" role="region" aria-label={$t('exercises.word_matching.select_answer')} use:keyboardNav={keyboardNavParams}>
    <!-- Progress bar -->
    <ProgressBar value={progress} label={`${currentIndex + 1} ${$t('common.of')} ${words.length}`} showPercentage />

    <!-- Prompt label -->
    <p class="prompt-label">{promptLabel}</p>

    <!-- Prompt display -->
    <div class="prompt-area">
      {#if mode === 'image-to-word'}
        <img
          src={resolveImageUrl(currentWord.image_url)}
          alt={$t('exercises.word_matching.select_answer')}
          class="prompt-image"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      {:else}
        <p class="prompt-text">{promptText}</p>
        <button class="speak-btn" onclick={() => speakWord(currentWord.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
          {isSpeaking ? '🔊…' : '🔊'}
        </button>
      {/if}
    </div>

    <!-- Feedback -->
    {#if feedbackState === 'correct'}
      <div class="feedback correct" role="status" aria-live="polite">
        <span>✅</span>
        <span>{getRandomEncouragement()}</span>
        <button class="speak-btn" onclick={() => speakWord()} disabled={isSpeaking} aria-label="Listen">
          {isSpeaking ? '🔊…' : '🔊'}
        </button>
      </div>
    {:else if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status" aria-live="polite">
        <span>❌</span>
        <span>{$t('feedback.the_answer_was', { answer: options[correctIndex]?.text || '' })}</span>
        <button class="speak-btn" onclick={() => speakWord(options[correctIndex]?.text)} disabled={isSpeaking} aria-label={$t('common.listen')}>
          {isSpeaking ? '🔊…' : '🔊'}
        </button>
      </div>
    {/if}

    <!-- Options -->
    {#if inputMode === 'open' && feedbackState === 'none'}
      <SpeechInput
        language={speechLang}
        placeholder={$t('exercises.word_matching.type_answer')}
        onresult={handleMatchResult}
        disabled={feedbackState !== 'none'}
      />
    {/if}
    <div class="options-grid">
      {#each options as option, i}
        {@const state = getCardState(i, feedbackState, selectedIndex, correctIndex)}
        <button
          class="option-card"
          class:default={state === 'default'}
          class:selected={state === 'selected'}
          class:correct={state === 'correct'}
          class:incorrect={state === 'incorrect'}
          onclick={() => handleSelect(i)}
          disabled={feedbackState !== 'none'}
          aria-label={option.text}
        >
          <span class="option-text">{option.text}</span>
        </button>
      {/each}
    </div>

    <!-- Skip button -->
    <button class="skip-button" onclick={skipWord} aria-label={$t('common.skip')}>
      ⏭️ {$t('common.skip')}
    </button>
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
      {#each results as result, i}
        <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
          <span class="result-word">{result.word.word}</span>
          <button class="speak-btn" onclick={() => speakWord(result.word.word)} disabled={isSpeaking} aria-label={$t('common.listen')}>
            {isSpeaking ? '🔊…' : '🔊'}
          </button>
          <span class="result-icon">{result.correct ? '✅' : '❌'}</span>
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
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .prompt-label {
    font-size: var(--font-size-base, 16px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-align: center;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Prompt area */
  .prompt-area {
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg, 24px);
    background: var(--surface, #f9fafb);
    border-radius: var(--radius-lg, 16px);
    border: 2px solid var(--border, #e5e7eb);
  }

  .prompt-text {
    font-size: var(--font-size-2xl, 28px);
    font-weight: 800;
    color: var(--text, #1f2937);
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }

  .prompt-image {
    max-width: 250px;
    max-height: 200px;
    object-fit: contain;
    border-radius: var(--radius-md, 12px);
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

  /* Options grid */
  .options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .option-card {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    padding: var(--space-md, 16px) var(--space-lg, 24px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: var(--surface, #f9fafb);
    border: 3px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    color: var(--text, #1f2937);
    cursor: pointer;
    transition: all var(--transition-fast, 0.15s);
    touch-action: manipulation;
    user-select: none;
    text-align: center;
    line-height: 1.4;
  }

  .option-card:hover:not(:disabled) {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
    box-shadow: var(--shadow-md);
  }

  .option-card:active:not(:disabled) {
    transform: scale(0.98);
  }

  .option-card.selected {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
  }

  .option-card.correct {
    border-color: var(--success, #22c55e);
    background: var(--success, #22c55e);
    color: #fff;
    animation: correctPulse 0.6s ease;
  }

  .option-card.incorrect {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
    color: var(--error, #ef4444);
    animation: shake 0.5s ease-in-out;
  }

  .option-card:disabled {
    cursor: default;
  }

  .option-text {
    font-size: var(--font-size-lg, 20px);
  }

  /* Summary */
  .summary {
    gap: var(--space-lg, 24px);
  }

  .summary-icon {
    font-size: 64px;
    line-height: 1;
  }

  .summary-title {
    font-size: var(--font-size-2xl, 28px);
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
    font-size: var(--font-size-xl, 24px);
    font-weight: 700;
    color: var(--primary, #3b82f6);
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
    justify-content: space-between;
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
    font-weight: 600;
    color: var(--text, #1f2937);
  }

  .result-icon {
    font-size: 20px;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  .skip-button {
    min-height: 48px;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    font-size: var(--font-size-md, 16px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    background: transparent;
    color: var(--text-muted, #6b7280);
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 12px);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
  }

  .skip-button:hover {
    background: var(--surface-2, #f3f4f6);
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
