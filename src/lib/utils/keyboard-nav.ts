/**
 * Reusable Svelte 5 action for keyboard navigation in exercise components.
 *
 * Key bindings:
 *   1-4       Select the corresponding option (1 = first, 2 = second, …)
 *   Enter     Confirm / advance when feedback is showing
 *   Space     Toggle hint (where applicable)
 *   Escape    Skip the current question
 *
 * Usage in a Svelte 5 component:
 *   ```svelte
 *   <div use:keyboardNav={keyboardNavParams}>…</div>
 *   ```
 */

export type KeyboardNavParams = {
  /** Returns the current feedback state (e.g. 'none' | 'correct' | 'incorrect'). */
  getFeedbackState: () => string;

  /** How many numbered options are available (1-4). Number keys beyond this are ignored. */
  optionCount: number;

  /** Called when the user presses a number key (1→index 0, 2→index 1, …). Only fires when feedback is 'none'. */
  onSelectOption: (index: number) => void;

  /** Called when the user presses Enter. Fires regardless of feedback state (useful for advancing early). */
  onConfirm: () => void;

  /** Called when the user presses Space. Only fires when feedback is 'none'. */
  onToggleHint?: () => void;

  /** Called when the user presses Escape. Fires regardless of feedback state. */
  onSkip: () => void;

  /** When false, all keyboard handling is disabled (e.g. exercise is finished or not started). */
  isActive?: boolean;
};

function keyboardNav(node: HTMLElement, params: KeyboardNavParams) {
  function handleKey(e: KeyboardEvent) {
    const {
      getFeedbackState,
      optionCount,
      onSelectOption,
      onConfirm,
      onToggleHint,
      onSkip,
      isActive = true,
    } = params;

    if (!isActive) return;

    // Don't capture keys when focus is inside an input / textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) {
      return;
    }

    const feedbackState = getFeedbackState();
    const canSelect = feedbackState === 'none';

    // Number keys 1-4 → select option
    if (canSelect && e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key, 10) - 1; // 0-based
      if (index < optionCount) {
        e.preventDefault();
        onSelectOption(index);
        return;
      }
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onConfirm();
        break;

      case ' ':
        if (canSelect && onToggleHint) {
          e.preventDefault();
          onToggleHint();
        }
        break;

      case 'Escape':
        e.preventDefault();
        onSkip();
        break;
    }
  }

  node.addEventListener('keydown', handleKey);
  node.setAttribute('tabindex', '0');

  return {
    update(newParams: KeyboardNavParams) {
      // Replace params reference — the next handleKey call will use newParams
      params = newParams;
    },
    destroy() {
      node.removeEventListener('keydown', handleKey);
    },
  };
}

export { keyboardNav };
