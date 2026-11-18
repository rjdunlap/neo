# 2026-11-18 — Melt and Freeze level 6, Will it melt? (PR #1803)

**Changed:** `melt-freeze` level 6 (mode `predict`): she taps a picture card for what the sun will do to one thing, then the sun, and sees it melt or stay; a guess is never a miss (0 misses, 0 hints). Levels 1–4 keep their original five things as an explicit list, two substances (lolly, shell) and one journal entry (`melt-freeze:lolly`, the journal now 86 entries) are added, and preschool and pre-K gain the level. Level 7 is not built.

**Ran:** Typecheck; `npm test` (366 files, 8102 passed, 1 skipped); `BROWSER_SUITE=meltfreeze` (levels 5, 1, 3, 4 and level 6: the sun waits for a guess, a changed mind, one surprise, an uncounted hint, 0/0, the lolly journal entry; portrait screenshot at 768×1024); `BROWSER_SUITE=fingerdemo FINGER_ONLY=melt-freeze FINGER_LEVELS=6` (19.7 s); `npm run build`.

**Not run:** Offline, `world` and every other browser suite.
