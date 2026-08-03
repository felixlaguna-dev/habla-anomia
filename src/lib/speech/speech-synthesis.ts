// Web Speech API — Speech Synthesis (Text-to-Speech) abstraction
// Uses slower default rate (0.8) suitable for elderly users / therapy context.

/**
 * Voice-name substrings that are known to sound good in Spanish.
 * Used as a tie-breaker when auto-selecting a voice: if one voice name
 * contains one of these tokens it is preferred over a generic match.
 * "Monica" and "Paulina" are the Apple/Google high-quality es voices.
 */
const PREFERRED_VOICE_NAMES = [
  'Google',
  'Microsoft',
  'Monica',
  'Paulina',
] as const;

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null;
  private currentRate: number = 0.8;
  private currentPitch: number = 1.0;
  private currentVoiceUri: string | null = null;
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
   * Pick the best available voice for a BCP-47 language tag.
   *
   * Uses a numeric priority score so one sort replaces a multi-tier filter chain.
   * Higher score wins; ties are broken alphabetically by voice name for determinism.
   *
   * Score weights (additive):
   *   +60  exact lang match (e.g. "es-ES")
   *   +30  lang-prefix match (e.g. "es" — always present when exact matches)
   *    +6  localService (avoids network-dependent remote voices)
   *    +3  preferred engine name (Google, Microsoft, Monica, Paulina)
   *
   * Returns null when no voice matches even the prefix.
   */
  selectBestVoice(language: string): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;
    const voices = this.synthesis.getVoices();
    if (voices.length === 0) return null;

    const langPrefix = language.split('-')[0];

    const scored = voices
      .filter((v) => v.lang === language || v.lang.startsWith(langPrefix))
      .map((v) => ({
        v,
        score:
          (v.lang === language ? 60 : 0) +
          (v.lang.startsWith(langPrefix) ? 30 : 0) +
          (v.localService ? 6 : 0) +
          (PREFERRED_VOICE_NAMES.some((n) => v.name.includes(n)) ? 3 : 0),
      }))
      .sort((a, b) => b.score - a.score || a.v.name.localeCompare(b.v.name));

    return scored[0]?.v ?? null;
  }

  /**
   * Speak the given text aloud. Returns a promise that resolves when speech finishes.
   * Cancels any currently active speech before starting.
   *
   * @param voiceOverride If provided, use this voiceURI for this utterance only
   *   (does not change the persisted preference — used for per-voice preview).
   */
  async speak(text: string, language: string = 'es-ES', voiceOverride?: string | null): Promise<void> {
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

      // Voice resolution: per-call override → user preference → auto-select.
      const voices = this.synthesis!.getVoices();
      const uri = voiceOverride || this.currentVoiceUri;
      const chosen =
        (uri ? voices.find((v) => v.voiceURI === uri) : undefined) ??
        this.selectBestVoice(language);

      if (chosen) {
        utterance.voice = chosen;
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
      utterance.onend = function (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) {
        clearInterval(keepAlive);
        originalOnEnd?.call(this, ev);
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

  /**
   * Set the preferred voice by its voiceURI.
   * Pass null/empty to revert to automatic selection.
   */
  setVoiceUri(uri: string | null): void {
    this.currentVoiceUri = uri || null;
  }

  /** Wait for the voices list to be populated (resolves immediately if already loaded). */
  waitForVoices(): Promise<void> {
    return this.voicesReady;
  }

  /**
   * Subscribe to voice-list changes. The callback fires when the browser
   * populates or updates the voice list (voiceschanged event).
   * Returns an unsubscribe function.
   */
  onVoicesChanged(callback: () => void): () => void {
    if (!this.synthesis) return () => {};
    const handler = () => callback();
    this.synthesis.addEventListener('voiceschanged', handler);
    return () => this.synthesis?.removeEventListener('voiceschanged', handler);
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
