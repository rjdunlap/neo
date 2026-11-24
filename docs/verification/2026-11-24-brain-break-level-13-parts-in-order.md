# 2026-11-24 — Brain Break level 13, Parts in order (PR #2110)

**Changed:** Brain Break level 13 (grown-up, 3×3): nine fractions and decimals between 0 and 2, smallest first, from a curated pool with spoken forms. It reuses the `brain.order.*` lines and adds one start line with a rendered clip.
**Ran:** Typecheck, prettier, eslint on the game and full `npm test` (the clip manifest test passed after rendering the new clip). `BROWSER_SUITE=brainbreak BRAINBREAK_ONLY=parts` played level 13 with a wrong tap, a hint, a checked stone and one sticker; the 390×844 portrait screenshot showed the labels fit. `BROWSER_SUITE=fingerdemo FINGER_ONLY=brain-break FINGER_LEVELS=13` passed in 16.3 s.
**Not run:** Build, offline, other browser suites.
