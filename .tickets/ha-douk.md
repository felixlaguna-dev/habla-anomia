---
id: ha-douk
status: closed
deps: [ha-1wg2]
links: []
created: 2026-07-22T10:16:27Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [infra, testing]
---
# Add vitest unit tests (engine + word-data validation) and wire tests plus e2e into CI

BLOCKED BY the type-check ticket (T5) — CI must be green on check before adding more gates. Do not start until it closes.

CONTEXT: zero unit tests exist (no test runner in package.json); e2e specs exist under e2e/ (own package.json, Docker-based run.sh against port 3020 or GH Pages) but CI (.github/workflows/ci.yml) runs neither. The engine logic (SM-2, session generation) and the 523-word dataset are exactly the kind of thing that silently regresses.

TASK:
1. Add vitest as a devDependency + "test": "vitest run" script (config in vite.config.ts test block or vitest.config.ts; node environment is fine — engine code only touches Dexie, so mock the db module or refactor pure parts; prefer testing PURE functions and extract where needed WITHOUT changing behavior).
2. Unit tests (src/lib/**/*.test.ts):
   - spaced-repetition: SM-2 math — quality>=3 grows interval (1 -> 6 -> round(6*ef)), quality<3 resets interval to 1 and keeps ease factor, ease floor 1.3, boolean back-compat (true=5/false=0).
   - session-generator: shuffleArray preserves elements; difficulty capping rules IF the adaptive-difficulty ticket merged (check tk show; otherwise skip and note).
   - statistics: calculateImprovementTrend thresholds (improving/stable/declining, <2 active days = stable).
   - word data validation (the highest-value test — pure, no mocks): import WORDS_ES and assert for EVERY word: unique id; categories nonempty and every value in the Category union; language es; sentence (when present) contains the blank marker "_____"; phonetic.syllables >= 1; difficulty 1-5; when has_image is not false, the image file exists on disk under static (use fs + the image_url path) — this permanently catches the accessories-style data drift and missing-image regressions.
3. CI: add npm test to .github/workflows/ci.yml (same container pattern as build/check).
4. E2E in CI: add a job (or step) that builds the docker image, serves it, and runs the existing e2e/run.sh against it (self-hosted runner already available per current workflow; reuse the compose flow from Makefile: make up then e2e/run.sh). If the e2e specs are stale and fail on unrelated assertions, fix ONLY clear staleness (selectors/text that changed) and note anything deeper in this ticket notes instead of rewriting suites.

ACCEPTANCE: npm test green locally with the word-data suite actually validating all 523 words; CI runs check + unit tests + e2e and fails on regression.
CONVENTIONS (apply to all work): Svelte 5 runes only (state/props/derived/effect). All user-facing strings via the t() i18n helper with keys added to ALL 4 locale files (src/lib/i18n/es.json, ca.json, eu.json, en.json). Use CSS variables from src/lib/styles/theme.css, never hardcoded hex. Min 56px touch targets. Exercises are tap-only multiple choice (aphasia patients cannot type). Before closing: npm run build must succeed (and npm run check must not get WORSE than before your change).


## Notes

**2026-07-22T10:17:17Z**

BLOCKED BY ha-1wg2 (T5). Do not start until it is closed.
