<script module lang="ts">
  // Standard feedback timings (ms) — the single source of truth for all
  // exercises. Import these instead of hand-rolling setTimeout durations.
  export const FEEDBACK_TIMINGS = {
    /** Correct: show the banner, then advance. */
    correctAdvance: 1500,
    /** Incorrect (reveal mode): show the correct answer, then advance. */
    incorrectRevealAdvance: 2000,
    /** Incorrect (retry mode): flash, then reset so the user can retry. */
    incorrectRetryReset: 1500,
  } as const;
</script>

<script lang="ts">
  // Correct / incorrect banner. Content varies per exercise, so the text and
  // optional speak affordance are passed in; only the styling + timing table
  // live here.
  import SpeakButton from './SpeakButton.svelte';
  import { t } from '$lib/i18n';

  type Props = {
    state: 'correct' | 'incorrect';
    text: string;
    icon?: string;
    speakEnabled?: boolean;
    isSpeaking?: boolean;
    onSpeak?: () => void;
  };

  let {
    state,
    text,
    icon = state === 'correct' ? '✅' : '❌',
    speakEnabled = false,
    isSpeaking = false,
    onSpeak,
  }: Props = $props();
</script>

<div class="feedback {state}" role="status" aria-live="polite">
  <span class="feedback-icon" aria-hidden="true">{icon}</span>
  <span class="feedback-text">{text}</span>
  {#if speakEnabled}
    <SpeakButton disabled={isSpeaking} {isSpeaking} label={$t('common.listen')} onclick={() => onSpeak?.()} />
  {/if}
</div>

<style>
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
    background: var(--error-bg, #fee2e2);
    color: var(--error, #ef4444);
  }

  .feedback-icon {
    font-size: 24px;
  }

  .feedback-text {
    font-size: var(--font-size-lg, 20px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
