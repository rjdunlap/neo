# 2026-11-21 — Block Tower level 7 definition (docs only, PR #1943)

**Changed:** new definition `docs/definitions/block-tower-mend.md` (level 7, Mend the leaning tower; dive slice 6); the Block Tower dive's slice 6 and level 7 row point at it, a READY Queued line for the build and one for the level 6 unscored-experiment fix (decided 2026-10-23, still counted in `settled()`), Next ten line 360 removed and refilled with 400 and 410 from Queued, and a docs map line.
**Ran:** the numbers in the definition's task table were enumerated with the game's `topples` rule in a scratch script; `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** code, unit tests, build and browser checks (nothing built).
