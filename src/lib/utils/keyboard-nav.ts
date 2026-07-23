/**
 * Reusable Svelte 5 action for keyboard navigation in exercise components.
 *
 * Key bindings:
 *   1-4       Select the corresponding option (1 = first, 2 = second, …)
 *   Enter     Confirm / advance when feedback is showing
 *   Space     Toggle hint (where applicable)
 *   Escape    Skip the current question
 *
 * The listener is attached to `document` (gated by `isActive`) so shortcuts
 * work the moment an exercise mounts — without needing to Tab into the region
 * first, and without racing against page-level focus management. `isActive`
 * keeps a mounted-but-finished exercise from swallowing keys.
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
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
      return;
    }

    // Defer to interactive controls that live OUTSIDE the exercise region (e.g.
    // the page's back button): let them handle Enter/Space natively instead of
    // hijacking activation. Controls INSIDE the region still bubble through, and
    // focus on body / headings still drives the shortcuts (no Tab needed).
    if ((tag === 'BUTTON' || tag === 'A') && !node.contains(target)) {
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

  // document-level so shortcuts are active on mount without focusing the region.
  document.addEventListener('keydown', handleKey);
  // Keep the region Tab-reachable for keyboard / AT users.
  node.setAttribute('tabindex', '0');

  return {
    update(newParams: KeyboardNavParams) {
      // Replace params reference — the next handleKey call will use newParams
      params = newParams;
    },
    destroy() {
      document.removeEventListener('keydown', handleKey);
    },
  };
}

export { keyboardNav };
