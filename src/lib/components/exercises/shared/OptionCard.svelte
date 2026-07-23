<script lang="ts">
  // One multiple-choice option. The answer is a single button; the speak
  // affordance is a SIBLING button inside the wrapper div — no nested buttons,
  // which keeps the HTML valid (fixes the svelte-check a11y warning).
  import type { CardState } from '$lib/utils/exercise-helpers';
  import { t } from '$lib/i18n';
  import SpeakButton from './SpeakButton.svelte';

  type Props = {
    text: string;
    state?: CardState;
    disabled?: boolean;
    speakEnabled?: boolean;
    isSpeaking?: boolean;
    onselect?: () => void;
    onspeak?: (text: string) => void;
  };

  let {
    text,
    state = 'default',
    disabled = false,
    speakEnabled = false,
    isSpeaking = false,
    onselect,
    onspeak,
  }: Props = $props();
</script>

<div
  class="option-card"
  class:default={state === 'default'}
  class:selected={state === 'selected'}
  class:correct={state === 'correct'}
  class:incorrect={state === 'incorrect'}
>
  <button
    type="button"
    class="option-button"
    {disabled}
    aria-label={text}
    onclick={() => onselect?.()}
  >
    <span class="option-text">{text}</span>
  </button>
  {#if speakEnabled}
    <SpeakButton
      size="inline"
      {disabled}
      {isSpeaking}
      label={$t('common.listen')}
      onclick={() => onspeak?.(text)}
    />
  {/if}
</div>

<style>
  .option-card {
    display: flex;
    align-items: stretch;
    gap: var(--space-xs, 4px);
    min-height: 72px;
    padding: var(--space-xs, 4px);
    background: var(--surface, #f9fafb);
    border: 3px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    transition: all var(--transition-fast, 0.15s);
  }

  .option-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: var(--space-md, 16px) var(--space-lg, 24px);
    font-size: var(--font-size-lg, 20px);
    font-weight: 600;
    font-family: var(--font-family, sans-serif);
    color: var(--text, #1f2937);
    background: transparent;
    border: none;
    text-align: center;
    line-height: 1.4;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
  }

  .option-text {
    font-size: var(--font-size-lg, 20px);
  }

  .option-card:has(.option-button:hover:not(:disabled)) {
    border-color: var(--primary, #3b82f6);
    background: var(--primary-light, #eff6ff);
    box-shadow: var(--shadow-md);
  }

  .option-card:has(.option-button:active:not(:disabled)) {
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

  .option-card.correct .option-button {
    color: #fff;
  }

  .option-card.incorrect {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.1);
    animation: shake 0.5s ease-in-out;
  }

  .option-button:disabled {
    cursor: default;
  }

  .option-button:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  @keyframes correctPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.03);
    }
    100% {
      transform: scale(1);
    }
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
</style>
