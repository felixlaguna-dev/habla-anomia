// Web Speech API — Speech Synthesis (Text-to-Speech) abstraction
// Uses slower default rate (0.8) suitable for elderly users / therapy context.

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null;
  private currentRate: number = 0.8;
  private currentPitch: number = 1.0;
  private voicesReady: Promise<void>;

  constructor() {
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis || null : null;

    // Voices may not be loaded immediately — especially on Safari / Chrome mobile
    // Create a promise that resolves when voices are available
    let resolveVoices: () => void;
    this.voicesReady = new Promise<void>((resolve) => {
      resolveVoices = resolve;
    });

    if (this.synthesis) {
      // If voices already loaded (some browsers load synchronously)
      if (this.synthesis.getVoices().length > 0) {
        resolveVoices!();
      } else {
        const onVoicesChanged = () => {
          if (this.synthesis!.getVoices().length > 0) {
            resolveVoices!();
            this.synthesis!.removeEventListener('voiceschanged', onVoicesChanged);
          }
        };
        this.synthesis.addEventListener('voiceschanged', onVoicesChanged);

        // Fallback timeout — some browsers never fire voiceschanged
        setTimeout(() => resolveVoices!(), 3000);
      }
    } else {
      resolveVoices!();
    }
  }

  // --- Public API ---

  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /**
   * Speak the given text aloud. Returns a promise that resolves when speech finishes.
   * Cancels any currently active speech before starting.
   */
  async speak(text: string, language: string = 'es-ES'): Promise<void> {
    if (!this.synthesis) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Wait for voices to be loaded
    await this.voicesReady;

    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = this.currentRate;
      utterance.pitch = this.currentPitch;

      // Try to pick a voice matching the language
      const voices = this.synthesis!.getVoices();
      const langPrefix = language.split('-')[0];
      const matchedVoice =
        voices.find((v) => v.lang === language) ||
        voices.find((v) => v.lang.startsWith(langPrefix));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        // "interrupted" or "canceled" happen when cancel() is called — resolve gracefully
        if (e.type === 'error' && (e as any).error === 'canceled') {
          resolve();
        } else {
          resolve(); // Don't reject — keep calling code simple
        }
      };

      this.synthesis!.speak(utterance);

      // Chrome quirk: long utterances can pause after ~15s without this workaround.
      // Periodically call resume() to keep synthesis alive.
      const keepAlive = setInterval(() => {
        if (!this.synthesis!.speaking) {
          clearInterval(keepAlive);
          return;
        }
        this.synthesis!.resume();
      }, 10000);

      // Clean up interval when speech ends
      const originalOnEnd = utterance.onend;
      utterance.onend = () => {
        clearInterval(keepAlive);
        originalOnEnd?.();
      };
    });
  }

  /** Stop any currently active speech. */
  stop(): void {
    this.synthesis?.cancel();
  }

  setRate(rate: number): void {
    this.currentRate = Math.max(0.1, Math.min(2.0, rate));
  }

  getRate(): number {
    return this.currentRate;
  }

  setPitch(pitch: number): void {
    this.currentPitch = Math.max(0.1, Math.min(2.0, pitch));
  }

  /** Get available voices filtered by language prefix (e.g. 'es' matches 'es-ES', 'es-MX'). */
  getVoices(language: string): SpeechSynthesisVoice[] {
    const langPrefix = language.split('-')[0];
    return (this.synthesis?.getVoices() || []).filter((v) =>
      v.lang.startsWith(langPrefix)
    );
  }

  destroy(): void {
    this.stop();
    this.synthesis = null;
  }
}
