---
id: ha-nwmq
status: closed
deps: []
links: [ha-6bvb]
created: 2026-07-22T10:10:54Z
type: bug
priority: 0
assignee: Félix Laguna Teno
tags: [bug, perf, pwa]
---
# Stop precaching 194 MB of word images in the service worker

CONTEXT: the PWA precaches ALL word images at install time: build/sw.js contains ~1060 precache entries; static/images/words is ~194 MB. vite.config.ts workbox block: globPatterns includes webp (line ~30), maximumFileSizeToCacheInBytes was raised to 4 MiB specifically to let ~1.7 MB word images in, and includeAssets lists images/words/*.webp. First install therefore downloads ~194 MB — brutal for elderly users on tablets with limited data/storage, and can blow browser storage quotas. The same images are ALSO covered by a runtime CacheFirst route (redundant).

TASK (in vite.config.ts):
1. Remove webp (and png if only used by images) from workbox globPatterns so word images are NOT precached. Keep js, css, html, svg, ico, json, woff2. Keep navigateFallback 200.html.
2. Remove images/words/*.webp from includeAssets.
3. Lower maximumFileSizeToCacheInBytes back to 2 MiB (only app-shell assets remain).
4. KEEP (and verify) the runtime caching route for /images/words/ with CacheFirst — raise maxEntries to 600 (there are 533 images) and keep long expiration, so images cache lazily as the patient encounters them and then work offline.
5. Icons (static/icons/*) and favicon must still be precached (small).
6. Delete 3 orphan files no word references (~4 MB dead weight): static/images/words/curiosity_children.jpg, two_kids_nature.jpg, cantante_temp.jpg. Verify with grep that nothing in src or src/lib/data/words-es.ts references them before deleting.

VERIFY: npm run build; inspect build/sw.js — precache manifest should contain NO images/words entries and total precache should be under ~5 MB. Serve the build (make up, http://localhost:3020), load an exercise online, then set browser devtools offline and confirm: app shell + previously-seen images still work offline; unseen images show the existing letter-fallback placeholder rather than a broken image (exercises have has_image filtering and letter fallbacks; verify one gracefully-degraded case).

FUTURE (separate ticket exists): an optional "download all images" toggle could restore full offline preloading once images are optimized. Do not build it here.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

UNBLOCKS (together with ha-klrd): ha-k3ej (docs rewrite). FINAL STEP: tk close ha-nwmq, then verify with tk ready.

**2026-07-22T21:54:45Z**

DONE. vite.config.ts: removed webp+png from globPatterns, dropped images/words/*.webp from includeAssets, lowered maximumFileSizeToCacheInBytes to 2 MiB, raised word-images runtime route maxEntries 500->600 (soft LRU cap, no rotting count). Deleted 3 orphan jpgs (~4MB). build/sw.js verified: precache 55 entries / ~0.8MB (was ~1060 / ~194MB), 0 images/words, icons+favicon+manifest still precached, runtime CacheFirst route intact (maxEntries:600). npm run build OK; npm run check 0 errors / 7 pre-existing warnings. Simplify (4 agents) + adversarial review (6 checks) both converged clean.

CAVEAT (pre-existing, separate, untracked): the SW never registers in the prod build — app never imports virtual:pwa-register and no injectRegister — so the full offline browser test in VERIFY could not run. Also generateSession returns empty for brand-new users despite 523 seeded words (adaptive-difficulty floor), blocking UI-level exercise verification. Neither is caused by this change (config-only + orphan deletion); both warrant their own tickets.
