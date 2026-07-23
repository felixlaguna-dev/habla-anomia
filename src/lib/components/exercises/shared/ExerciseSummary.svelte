<script lang="ts">
  // End-of-exercise summary screen: star rating, score, per-word results with
  // speak buttons, and the back / restart actions. Extracted because the two
  // pilots (and soon the remaining 6 exercises) rendered this identically.
  // The migration ticket will eventually fold this into the runner's results
  // overlay; until then it stays a self-contained shared screen.
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { Button } from '$lib/components/ui';
  import type { Word } from '$lib/types';
  import SpeakButton from './SpeakButton.svelte';

  export type SummaryResult = { word: Word; correct: boolean; hintsUsed?: number };

  type Props = {
    score: number;
    total: number;
    results: SummaryResult[];
    speakEnabled?: boolean;
    isSpeaking?: boolean;
    onSpeak?: (word: string) => void;
    onrestart?: () => void;
  };

  let {
    score,
    total,
    results,
    speakEnabled = false,
    isSpeaking = false,
    onSpeak,
    onrestart,
  }: Props = $props();

  let ratio = $derived(total > 0 ? score / total : 0);
  let rating = $derived.by(() => {
    if (ratio >= 0.9) return { stars: '⭐⭐⭐', label: $t('feedback.excellent') };
    if (ratio >= 0.7) return { stars: '⭐⭐', label: $t('feedback.very_good') };
    if (ratio >= 0.5) return { stars: '⭐', label: $t('feedback.good_job') };
    return { stars: '', label: $t('feedback.keep_practicing') };
  });
</script>

<div class="exercise-summary">
  <div class="summary-icon" aria-hidden="true">🎉</div>
  <h2 class="summary-title">{$t('feedback.exercise_complete')}</h2>
  <div class="star-rating">{rating.stars} {rating.label}</div>
  <p class="summary-score" aria-atomic="true">{$t('feedback.score')}: {score} / {total}</p>
  <div class="summary-details">
    {#each results as result}
      <div class="result-row" class:pass={result.correct} class:fail={!result.correct}>
        <span class="result-word">{result.word.word}</span>
        {#if speakEnabled}
          <SpeakButton {isSpeaking} onclick={() => onSpeak?.(result.word.word)} />
        {/if}
        <span class="result-icon" aria-hidden="true">{result.correct ? '✅' : '❌'}</span>
        {#if result.hintsUsed && result.hintsUsed > 0}
          <span class="result-hints">💡×{result.hintsUsed}</span>
        {/if}
      </div>
    {/each}
  </div>
  <div class="summary-actions">
    <Button variant="primary" size="lg" onclick={() => goto(`${base}/exercises`)}>
      ← {$t('common.back_to_exercises')}
    </Button>
    <Button variant="secondary" size="md" onclick={onrestart}>
      🔄 {$t('common.restart')}
    </Button>
  </div>
</div>

<style>
  .exercise-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 16px);
    padding: var(--space-md, 16px);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
  }

  .summary-icon {
    font-size: 64px;
    line-height: 1;
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
    color: var(--text, #1f2937);
    text-transform: capitalize;
  }

  .result-icon {
    font-size: 20px;
  }

  .result-hints {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-muted, #6b7280);
  }

  .summary-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm, 8px);
    margin-top: var(--space-lg, 24px);
  }
</style>
