# 2026-11-21 — Egg Catch level 13, Sorting gate (PR #1961)

**Changed:** `egg-catch` level 13 (school; `LEVELS.school` order `[4, 5, 6, 7, 10, 11, 13]`): sorting gate, rule tests, scene, how-to card, ghost finger, four `egg.*` clips (1949 clips now, about 107 KB added); the finale lays more than eight gathered eggs in two rows; `difficulty.test.ts` school ladder covers 11 to 13.
**Ran:** typecheck; full `npm test` (two tests the change had to update were fixed, then passing); `BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=13 TO_LEVEL=13` passed (2 misses, 1 hint: tap-to-place, wrong placement twice on the low board, hint followed) with portrait screenshots at 768×1024; `BROWSER_SUITE=fingerdemo FINGER_ONLY=egg-catch FINGER_LEVELS=13 FINGER_BAND=school` passed (60.1 s); `npm run build`; `npm run test:offline` on the production preview passed (2154 assets).
**Not run:** other browser suites (code they cover is unchanged).
