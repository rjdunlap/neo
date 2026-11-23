# 2026-11-22 — Lasso Loops level 8, Make the number (PR #2025)

**Changed:** school level 8 (target 13–36 from jars of ten and a leaf, a tick, free undo, counted misses and a glow hint), 17 voice lines, two how-to steps, `lassoLayout` `make` flag; fixes for leaf fireflies on turning the screen at levels 3, 4, 6 and 7. `game-reviewer` found nothing serious; its two low findings were fixed.
**Ran:** typecheck; lint; `npm run build`; `npm test` (482 files, 17,952 passed, 1 skipped) before the review fixes, then the game's 68 tests after; `BROWSER_SUITE=shortlist SHORTLIST_ONLY=lasso FROM_LEVEL=7 TO_LEVEL=8` (level 7 regression; level 8 on a 390 × 844 phone through to the sticker, then turned sideways mid-round); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lasso-loops FINGER_LEVELS=8` (11.5 s); one upright screenshot (not committed).
**Not run:** offline, `world`, browser plays of levels 1–6 (unit tests cover the shared refactor).
