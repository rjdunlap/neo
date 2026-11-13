# 2026-11-12 — pyramid-solitaire level 5 Lift the cover (PR #1584)

**Changed:** `pyramid-solitaire` gains level 5: five rows with a new rule, an open card lifts with the one card still lying on it when they make 13; grown-up range 1–5, dial 40–80%. Levels 1–4 deal byte-identically (200 seeds each, snapshotted before and after). Two voice lines, a level-scoped how-to, no layout change.
**Ran:** `npm run typecheck`; vitest for `src/games/pyramid-solitaire`, `src/games/registry`, `src/games/upright-batch-3`, `src/content` (pass); `BROWSER_SUITE=pyramid PYRAMID_LEVELS=5` twice (wrong cover sum 11+6 counted a miss, 2 cover lifts, one sticker; portrait and landscape screenshots); `fingerdemo` (`FINGER_ONLY=pyramid-solitaire FINGER_LEVELS=5 FINGER_BAND=grownup`, 18.9 s); `npm run build`; format check.
**Measured:** 300 seeds on a Mac: undialled median clear rate 100%; dialled 298/300 in band (median 67%), top card not a king on 157, 290 cannot clear without a lift, at most 30 positions, slowest deal 5 ms.
**Not run:** other browser suites (unchanged). Full `npm test` locally had 8 timing-bound failures in seven other games' files under machine load; CI decides.
