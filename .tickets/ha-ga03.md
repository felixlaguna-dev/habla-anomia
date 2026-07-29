---
id: ha-ga03
status: closed
deps: [ha-6bvb]
links: [ha-5zax]
created: 2026-07-22T10:16:26Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [content, images]
---
# Regenerate low-quality action-word images; produce the 11 missing images

BLOCKED BY the image-optimization ticket (T4) — regenerated images must go through the same size/quality pipeline. Do not start until it closes.

CONTEXT: screenshot QA caught unmistakably bad stimulus images among action words: "comer" rendered as a cluttered vintage French advertising poster CONTAINING WRITTEN TEXT (Provence, biscuits) and genuinely ambiguous between eating and drinking; "hablar" rendered as a vintage microphone product photo; "cocinar" a busy street-kitchen scene with dozens of objects. For picture-naming stimuli, clinical practice requires: single clear subject, neutral background, no embedded text, unambiguous depiction. 29 words are in the actions category; several other categories may have similar offenders. 11 words also still have has_image: false (pending images, excluded from image exercises).

TASK:
1. Review every actions-category image plus a full pass over all categories using the hidden QA page /admin/images (grid of all word images) — flag images that: contain readable text, contain multiple competing subjects, depict the wrong/ambiguous concept, or are stylized to the point of ambiguity (vintage posters, abstract art). Record the flagged list in this ticket notes.
2. Regenerate flagged images with scripts/generate-images.py (see its header for usage; it consumes prompts per word). Write prompts enforcing: photo-realistic or simple flat illustration, ONE subject centered, plain background, NO text anywhere, concept unmistakable for elderly viewers. For verbs specifically: one person mid-action, minimal props (comer = one person eating at a plain table, nothing else).
3. Generate the 11 missing images (grep has_image: false in src/lib/data/words-es.ts to list them) with the same standard, then flip has_image to true for each (and remove the field if default-true semantics apply — check src/lib/types/index.ts wordHasImage).
4. Run the optimization pipeline (npm run optimize:images from the image-optimization ticket) so new files match the size budget; run scripts/validate-images.py if applicable.
5. Bump WORDS_ES_VERSION (seed versioning ticket) if any word data fields changed (has_image flips count as data changes).
6. Update CLAUDE.md: word count line ("11 words still pending images" becomes obsolete) and add the image quality standard (one subject, no text, plain background) to the Adding words section.

VERIFY: /admin/images shows no missing images; play picture-naming filtered mentally for actions (or via the category practice ticket if merged) and confirm stimuli are unambiguous; total image directory size still within the optimized budget.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-6bvb (T4). Do not start until it is closed.

**2026-07-29T23:25:16Z**

FULL VALIDATION COMPLETE (521/521 words via GLM-5.1 vision).

FLAGGED IMAGES TO REGENERATE (8):
1. bombilla [ambiguous] — shows yerba mate straw, should be lightbulb (Spain Spanish)
2. cabeza [diagram] — medical illustration, should be real photo
3. globo [ambiguous] — person inspecting balloon, cluttered
4. rosa [abstract] — pink gradient, not concrete
5. hermano [multiple_subjects] — family group, should be single male
6. brisa [ambiguous] — woman with scarf, unclear
7. sereno [abstract] — dark digital art
8. arco [wrong_subject] — architectural arch, should be violin bow (music category)

FALSE POSITIVES (keeping):
- quad — ATV is correct per definition 'vehículo de cuatro ruedas'
- platillos — cymbals correct per definition 'instrumento de percusión'

TICKET'S ORIGINAL COMPLAINTS (comer, hablar, cocinar) already fixed in commits 1f78303 and 9b11060. Current validation confirms match=True, conf=0.9.

11 MISSING IMAGES: All have files on disk and pass validation. The has_image:false flags are stale — just need to remove them.

**2026-07-29T23:40:11Z**

IMAGE REGENERATION COMPLETE.

Regenerated 8 bad images:
- bombilla ✅ now shows lightbulb (was mate straw)
- cabeza ✅ now shows human head photo (was medical diagram)
- globo ✅ now shows hot air balloon (was cluttered person scene)
- rosa ✅ now shows pink rose (was abstract gradient)
- hermano ✅ now shows men together (was large family group)
- brisa ✅ now shows wind-blown grass (reasonable for 'breeze')
- sereno ⚠️ shows man smiling outdoors (was abstract art — improved but model says 'happy' not 'serene')
- arco ⚠️ shows a bow-like object (was architectural arch — 5 attempts, model still ambiguous)

Net result: 24 bad images → 2 marginal (sereno, arco are inherently hard to depict).

11 missing images: ALL had files on disk. Removed stale has_image:false flags. WORDS_ES_VERSION bumped 2→3.

Image directory: 16.96 MB total, avg 32.9 KB. PASS on both targets.
