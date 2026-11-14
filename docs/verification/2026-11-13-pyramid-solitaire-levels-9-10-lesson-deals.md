# 2026-11-13 — pyramid-solitaire levels 9–10: lesson deals (PR #1637)

**Changed:** `pyramid-solitaire` levels 9 *One way in* and 10 *Count the copies* deal from frozen pools (`pools.ts`, written by `scripts/pyramid-lesson-search.mjs`); a stranded card is outlined after a losing removal on levels 9–10 and `pyramid.lesson` follows the blocked line; grown-up `order` `[1, 2, 9, 3, 10, 4, 5, 6, 7, 8]`; how-to step from level 9. Levels 1–8 deal identically (FNV test).
**Ran:** `npm run typecheck`; `npm test` (351 files, 6905 passed); `npm run build`; `BROWSER_SUITE=pyramid PYRAMID_LEVELS=9,10` (each level: a losing opening pair, blocked line then lesson naming the stranded card, outline survives a portrait resize, Undo restores, then hint, revision, full clear and one sticker; portrait lesson screenshots); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pyramid-solitaire FINGER_LEVELS=9,10` (12.3 s and 18.9 s). A game-reviewer pass found no bugs.
**Measured:** pool random-play clear rates: level 9 all 17%, level 10 25–50% (median 50%); only 16 level-9 shapes appear in two million seeds.
**Not run:** offline, `world`, other suites (not touched); no device speech for `pyramid.lesson`.
