<script lang="ts">
  import { SpeechRecognitionService, type SpeechErrorDetail } from '$lib/speech';

  type Props = {
    language?: string;
    placeholder?: string;
    onresult?: (transcript: string) => void;
    disabled?: boolean;
    class?: string;
  };

  let {
    language = 'es-ES',
    placeholder = 'Toca para hablar o escribe aquí...',
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

  // Lifecycle
  $effect(() => {
    hasSpeechSupport = SpeechRecognitionService.isSupported();
    if (hasSpeechSupport) {
      recognition = new SpeechRecognitionService(language);
      recognition.setLanguage(language);

      const unsubStart = recognition.on('start', () => {
        isListening = true;
        errorMessage = '';
      });

      const unsubResult = recognition.on('result', (transcript: string) => {
        inputText = transcript;
        interimTranscript = '';
        isListening = false;
      });

      const unsubInterim = recognition.on('interim', (text: string) => {
        interimTranscript = text;
      });

      const unsubEnd = recognition.on('end', () => {
        isListening = false;
        interimTranscript = '';
      });

      const unsubError = recognition.on('error', (detail: SpeechErrorDetail) => {
        isListening = false;
        interimTranscript = '';
        errorMessage = detail.message;
      });

      return () => {
        unsubStart();
        unsubResult();
        unsubInterim();
        unsubEnd();
        unsubError();
        recognition?.destroy();
        recognition = null;
      };
    }
  });

  // Re-sync language when prop changes
  $effect(() => {
    recognition?.setLanguage(language);
  });

  function toggleListening() {
    if (!recognition || disabled) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  function handleSubmit() {
    const text = inputText.trim();
    if (!text || disabled) return;
    onresult?.(text);
  }

  function handleInput(e: Event) {
    const el = e.target as HTMLInputElement;
    inputText = el.value;
    errorMessage = '';
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
      value={inputText}
      oninput={handleInput}
      onkeydown={handleKeydown}
      aria-label="Respuesta"
    />

    {#if hasSpeechSupport}
      <button
        class="mic-btn"
        class:listening={isListening}
        {disabled}
        onclick={toggleListening}
        aria-label={isListening ? 'Dejar de escuchar' : 'Hablar'}
        title={isListening ? 'Dejar de escuchar' : 'Hablar'}
      >
        <svg
          width="28"
          height="28"
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
      aria-label="Enviar respuesta"
      title="Enviar"
    >
      <svg
        width="24"
        height="24"
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
    <p class="status">🎙️ Escuchando...</p>
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
    gap: var(--space-sm);
  }

  .input-row input {
    flex: 1;
    min-height: 56px;
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
    min-width: 56px;
    min-height: 56px;
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
    min-width: 56px;
    min-height: 56px;
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
