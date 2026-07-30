---
id: ha-kk63
status: closed
deps: []
links: [ha-y5qv, ha-cicu, ha-rabj]
created: 2026-07-29T21:05:40Z
type: feature
priority: 2
assignee: Félix Laguna Teno
tags: [ui, scroll, categories, feedback]
---
# Category row scroll affordance (fade + arrow)

Users were unaware that the category list on the dashboard can be scrolled horizontally, missing categories that were off-screen. Add visual affordances to signal scrollability.

## Design

## Problem
The .category-row (src/routes/+page.svelte:521-528) uses overflow-x: auto with scroll-snap but has ZERO visual affordances — no fade, no arrows, no hint text. Users with aphasia may not discover scrolling.

## Approach
1. **Edge fade gradient:** Add a pseudo-element or gradient overlay on the right edge of .category-row that fades from transparent to the background color. Use a scroll event listener (or CSS scroll-driven animation if supported) to hide the fade when scrolled to the end, and optionally show a left fade when scrolled past the start.
2. **Arrow button:** Add a small circular chevron-right button positioned at the right edge of the category section. On tap, smooth-scroll the row by one viewport width. Hide the arrow when scrolled to the end (scrollLeft + clientWidth >= scrollWidth - threshold).
3. **CSS:** Use mask-image or a positioned gradient div for the fade. Use --surface-1 (background) for the fade color. Arrow button min 48px touch target, positioned absolutely or as a sibling.
4. **Performance:** Use a single scroll listener with requestAnimationFrame throttling, or CSS-only scroll-driven animations (@scroll-timeline / animation-timeline: scroll()) where supported.

## Acceptance Criteria

- [ ] Right-edge fade gradient visible when categories overflow and are not scrolled to end
- [ ] Fade disappears when scrolled to the right end
- [ ] Arrow button visible when scrollable, hidden when at end
- [ ] Arrow tap smooth-scrolls the row
- [ ] Both affordances work on mobile and tablet
- [ ] No layout shift or reflow when affordances appear/disappear

