<script lang="ts">
  // Small TTS affordance used inside options, feedback, prompts and summaries.
  // Kept as its own button (never nested inside the answer button) so the HTML
  // stays valid and both controls are independently focusable.
  import { t } from '$lib/i18n';

  type Props = {
    onclick?: (e: MouseEvent) => void;
    disabled?: boolean;
    isSpeaking?: boolean;
    size?: 'normal' | 'inline';
    label?: string;
  };

  let {
    onclick,
    disabled = false,
    isSpeaking = false,
    size = 'normal',
    label,
  }: Props = $props();
</script>

<button
  type="button"
  class="speak-btn"
  class:inline={size === 'inline'}
  {disabled}
  aria-label={label ?? $t('common.listen')}
  {onclick}
>
  <span class="icon" aria-hidden="true">{isSpeaking ? '🔊…' : '🔊'}</span>
</button>

<style>
  .speak-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md, 12px);
    color: var(--text, #1f2937);
    cursor: pointer;
    line-height: 1;
    touch-action: manipulation;
    transition:
      background var(--transition-fast, 0.15s),
      opacity var(--transition-fast, 0.15s);
  }

  .speak-btn:hover:not(:disabled) {
    background: var(--surface-2, rgba(0, 0, 0, 0.06));
  }

  .speak-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .speak-btn:focus-visible {
    outline: 3px solid var(--primary-light, #93c5fd);
    outline-offset: 2px;
  }

  .icon {
    font-size: 1.4rem;
  }

  .inline .icon {
    font-size: 1rem;
  }
</style>
