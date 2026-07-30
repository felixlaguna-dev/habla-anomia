/**
 * Reusable Svelte 5 action that tracks horizontal scroll overflow state.
 *
 * Reports whether the element can scroll left/right via `onScrollChange`,
 * re-evaluating on both scroll events and container resize. Use it to drive
 * scroll affordance UI (edge fades, arrow buttons).
 *
 * Usage:
 *   ```svelte
 *   <div use:scrollAffordance={{ onScrollChange: (l, r) => { ... } }}>
 *   ```
 */
export type ScrollAffordanceParams = {
  /** Called on mount, scroll, and resize with the current overflow state. */
  onScrollChange: (canScrollLeft: boolean, canScrollRight: boolean) => void;
};

export function scrollAffordance(node: HTMLElement, params: ScrollAffordanceParams) {
  const threshold = 2; // px — avoids float rounding at exact edges

  function update() {
    params.onScrollChange(
      node.scrollLeft > threshold,
      node.scrollLeft + node.clientWidth < node.scrollWidth - threshold,
    );
  }

  update();
  node.addEventListener('scroll', update, { passive: true });
  const ro = new ResizeObserver(update);
  ro.observe(node);

  return {
    update(newParams: ScrollAffordanceParams) {
      params = newParams;
    },
    destroy() {
      node.removeEventListener('scroll', update);
      ro.disconnect();
    },
  };
}
