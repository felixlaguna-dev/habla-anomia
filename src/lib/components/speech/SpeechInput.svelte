<script lang="ts">
  import { SpeechRecognitionService, type SpeechErrorDetail } from '$lib/speech';
  import { t } from '$lib/i18n';

  type Props = {
    language?: string;
    placeholder?: string;
    onresult?: (transcript: string) => void;
    disabled?: boolean;
    class?: string;
  };

  let {
    language = 'es-ES',
    placeholder = $t('speech.placeholder'),
    onresult,
    disabled = false,
    class: className = '',
  }: Props = $props();

  // State
  let isListening = $state(false);
  let hasSpeechSupport = $state(false);
  let interimTranscript = $state('');
  let inputText = $state('');
  let errorMessage = $state('');
  let recognition: SpeechRecognitionService | null = $state(null);

  // Initialize speech recognition once
  $effect(() => {
    hasSpeechSupport = SpeechRecognitionService.isSupported();
    if (hasSpeechSupport && !recognition) {
      recognition = new SpeechRecognitionService(language);

      recognition.on('start', () => {
        isListening = true;
        errorMessage = '';
      });

      recognition.on('result', (transcript: string) => {
        inputText = transcript;
        interimTranscript = '';
        isListening = false;
        onresult?.(transcript);
      });

      recognition.on('interim', (text: string) => {
        interimTranscript = text;
      });

      recognition.on('end', () => {
        isListening = false;
        interimTranscript = '';
      });

      recognition.on('error', (detail: SpeechErrorDetail) => {
        isListening = false;
        interimTranscript = '';
        // Don't show permission errors if already granted — Chrome sometimes fires these spuriously
        if (detail.code === 'not-allowed') {
          // Check if we've already been granted permission — avoid repeated error messages
          if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
              if (result.state === 'granted' || result.state === 'prompt') {
                // Permission is fine — this is a Chrome quirk, don't show error
                errorMessage = '';
              } else {
                errorMessage = $t('speech.errors.' + detail.code);
              }
            }).catch(() => {
              errorMessage = $t('speech.errors.' + detail.code);
            });
          } else {
            errorMessage = $t('speech.errors.' + detail.code);
          }
        } else if (detail.code !== 'aborted' && detail.code !== 'no-speech') {
          // Don't show errors for aborted or no-speech (these are normal)
          errorMessage = $t('speech.errors.' + detail.code);
        }
      });
    }
  });

  // Re-sync language when prop changes (don't recreate the service)
  $effect(() => {
    recognition?.setLanguage(language);
  });

  function toggleListening() {
    if (!recognition || disabled) return;
    if (isListening) {
      recognition.stop();
    } else {
      errorMessage = '';
      recognition.start();
    }
  }

  function handleSubmit() {
    const text = inputText.trim();
    if (!text || disabled) return;
    onresult?.(text);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Microphone SVG path
  const micIcon = `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>`;

  const sendIcon = `<line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>`;
</script>

<div class="speech-input {className}" class:disabled>
  <!-- Input row -->
  <div class="input-row">
    <input
      type="text"
      {placeholder}
      {disabled}
      bind:value={inputText}
      onkeydown={handleKeydown}
      aria-label={$t('speech.answer')}
    />

    {#if hasSpeechSupport}
      <button
        class="mic-btn"
        class:listening={isListening}
        {disabled}
        onclick={toggleListening}
        aria-label={isListening ? $t('speech.stop_listening') : $t('speech.speak')}
        title={isListening ? $t('speech.stop_listening') : $t('speech.speak')}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          {@html micIcon}
        </svg>
      </button>
    {/if}

    <button
      class="submit-btn"
      {disabled}
      onclick={handleSubmit}
      aria-label={$t('speech.submit_answer')}
      title={$t('speech.submit')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {@html sendIcon}
      </svg>
    </button>
  </div>

  <!-- Interim transcript display -->
  {#if interimTranscript}
    <p class="interim">{interimTranscript}</p>
  {/if}

  <!-- Listening indicator -->
  {#if isListening}
    <p class="status">🎙️ {$t('speech.listening')}</p>
  {/if}

  <!-- Error message -->
  {#if errorMessage}
    <p class="error" role="alert">{errorMessage}</p>
  {/if}
</div>

<style>
  .speech-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .input-row input {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    padding: 12px 16px;
    font-size: var(--font-size-lg);
    font-family: var(--font-family);
    color: var(--text);
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .input-row input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .input-row input::placeholder {
    color: var(--text-muted);
  }

  .mic-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    color: var(--text);
    border: 2px solid var(--border);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast),
      box-shadow var(--transition-fast);
    touch-action: manipulation;
    flex-shrink: 0;
  }

  .mic-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }

  .mic-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .mic-btn.listening {
    background: var(--error);
    border-color: var(--error);
    color: #fff;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: var(--primary);
    color: #fff;
    border: 2px solid var(--primary);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast),
      box-shadow var(--transition-fast);
    touch-action: manipulation;
    flex-shrink: 0;
  }

  .submit-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-md);
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .disabled .mic-btn,
  .disabled .submit-btn,
  .mic-btn:disabled,
  .submit-btn:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .interim {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-base);
    color: var(--text-muted);
    font-style: italic;
  }

  .status {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-base);
    color: var(--primary-light);
    font-weight: 600;
    animation: pulse-text 1.5s ease-in-out infinite;
  }

  .error {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--error);
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
  }

  @keyframes pulse-text {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
