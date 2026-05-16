// Web Speech API — Speech Recognition abstraction
// Handles Chrome (webkitSpeechRecognition) and Safari (SpeechRecognition) differences.
// Requires HTTPS (or localhost) and user microphone permission.

export type SpeechEventType = 'result' | 'interim' | 'error' | 'end' | 'start';

export interface SpeechErrorDetail {
  code: string; // 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'unknown'
  message: string;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private shouldRestart = false; // Safari auto-restart guard
  private callbacks: Map<SpeechEventType, Function[]> = new Map();

  constructor(language: string = 'es-ES') {
    // Feature detection — Chrome uses webkit prefix
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionAPI) return; // No support — methods become no-ops

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = language;
    this.recognition.continuous = false; // Single utterance for therapy exercises
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    // --- Event handlers ---

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.emit('result', finalTranscript.trim());
      }
      if (interimTranscript) {
        this.emit('interim', interimTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      const detail: SpeechErrorDetail = this.normalizeError(event.error);
      this.emit('error', detail);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('end', undefined);

      // Safari workaround: auto-restart if we expected to still be listening
      // Safari sometimes stops recognition after ~60s even with continuous=true,
      // but since we use continuous=false this mainly guards against unexpected early stops.
      if (this.shouldRestart) {
        try {
          this.recognition.start();
          // If start succeeds, onstart will fire and set isListening=true
        } catch {
          // If restart fails (e.g. another instance already running), give up
          this.shouldRestart = false;
        }
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('start', undefined);
    };
  }

  // --- Public API ---

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  start(): void {
    if (!this.recognition) return;
    if (this.isListening) return; // Already listening — avoid InvalidStateError
    try {
      this.shouldRestart = false;
      this.recognition.start();
    } catch {
      // May throw if called too quickly after stop — safe to ignore
    }
  }

  stop(): void {
    if (!this.recognition) return;
    this.shouldRestart = false;
    try {
      this.recognition.stop();
    } catch {
      // May throw if not currently listening — safe to ignore
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Register an event callback. Returns an unsubscribe function.
   */
  on(event: SpeechEventType, callback: Function): () => void {
    const listeners = this.callbacks.get(event) || [];
    listeners.push(callback);
    this.callbacks.set(event, listeners);

    return () => {
      const current = this.callbacks.get(event) || [];
      this.callbacks.set(
        event,
        current.filter((cb) => cb !== callback)
      );
    };
  }

  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  destroy(): void {
    this.stop();
    this.callbacks.clear();
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onstart = null;
      this.recognition = null;
    }
  }

  // --- Internals ---

  private emit(event: SpeechEventType, data: any): void {
    const listeners = this.callbacks.get(event) || [];
    for (const cb of listeners) {
      try {
        cb(data);
      } catch {
        // Swallow callback errors to keep recognition running
      }
    }
  }

  private normalizeError(errorCode: string): SpeechErrorDetail {
    const messages: Record<string, string> = {
      'no-speech': 'No se detectó voz. Intenta de nuevo.',
      'audio-capture': 'No se encontró micrófono. Verifica tu dispositivo.',
      'not-allowed': 'Permiso de micrófono denegado. Actívalo en ajustes.',
      network: 'Error de red. Verifica tu conexión a internet.',
      aborted: 'Reconocimiento cancelado.',
    };
    return {
      code: errorCode || 'unknown',
      message: messages[errorCode] || 'Error desconocido en el reconocimiento de voz.',
    };
  }
}
