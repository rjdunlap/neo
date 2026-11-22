# 2026-11-22 — Define Swing Pals level 10, A row of three (PR #2005)

**Changed:** new definition `docs/definitions/swing-pals-row-of-three.md` (after a throwaway `swingLayout` probe: three equal columns fail on upright phones, a fitted row at 12° passes every view; numbers from layout code, not a device); the Swing Pals dive (ladder row, row-of-three bullets, slice 4, corrects "the long rope's two swings" to three), the level 9 definition's pointer; READY (Next ten line removed, one build line queued) and the docs map.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** code checks (docs only; nothing built); no game was opened or played.
