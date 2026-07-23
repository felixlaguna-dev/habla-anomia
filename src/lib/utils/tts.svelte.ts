// Shared text-to-speech helper for exercises.
//
// Wraps SpeechSynthesisService so the ~20-line init/destroy/setRate/speak block
// is not copy-pasted into every exercise. `isSpeaking` is reactive so templates
// can disable speak buttons while an utterance is in flight.

import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
import type { Language } from '$lib/types';

/** Map an app language code to a BCP-47 tag the Web Speech API understands. */
export function speechLangFor(language: Language): string {
  switch (language) {
    case 'ca':
      return 'ca-ES';
    case 'eu':
      return 'eu-ES';
    case 'en':
      return 'en-US';
    default:
      return 'es-ES';
  }
}

/**
 * Create a TTS controller bound to the calling component's lifecycle.
 *
 * Call `init()` in onMount (return `destroy()` from it), keep the rate in sync
 * via an `$effect`, and `speak()` on demand. The controller is a plain object;
 * `isSpeaking` is exposed as a getter so it stays reactive in templates.
 */
export function useTts() {
  let isSpeaking = $state(false);
  let synthesis: SpeechSynthesisService | null = null;
  let currentRate = 0.8;

  function init(): void {
    if (SpeechSynthesisService.isSupported()) {
      synthesis = new SpeechSynthesisService();
      synthesis.setRate(currentRate);
    }
  }

  function destroy(): void {
    synthesis?.destroy();
    synthesis = null;
    isSpeaking = false;
  }

  function setRate(rate: number): void {
    currentRate = rate;
    synthesis?.setRate(rate);
  }

  async function speak(text: string | undefined, lang: string): Promise<void> {
    if (!synthesis || isSpeaking || !text) return;
    isSpeaking = true;
    try {
      await synthesis.speak(text, lang);
    } finally {
      isSpeaking = false;
    }
  }

  return {
    init,
    destroy,
    setRate,
    speak,
    get isSpeaking(): boolean {
      return isSpeaking;
    },
  };
}
