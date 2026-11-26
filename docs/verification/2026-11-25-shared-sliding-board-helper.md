# 2026-11-25 — Shared sliding-board helper (PR #2157)

**Changed:** The clamp, centre-on-a-point and point-in-window code that Island Bridges, Word Search and Picture Logic each carried moved into `src/engine/slide.ts` (`clampSlide`, `slideCentering`, `pointInSlideWindow`); the three games call it and no size or behaviour changed.
**Ran:** `src/engine/slide.test.ts` (new) and the three games' existing unit tests (132 tests); typecheck, lint, format check; `BROWSER_SUITE=bridgestouch`, `wordsearchtouch` and `picturetouch` (all pass, including sliding to every square and the held stroke at the edge).
**Not run:** Logic Grid (its slide drag is a different mechanism and was left as it is), the full `npm test` (left to PR CI), build, offline, real phone.
