# 2026-11-12 — Tile Pairs level 8 Flower friends (PR #1579)

**Changed:** `tile-pairs` level 8: the crown with five ordinary pictures and four different flower tiles in a shared petal frame; `matches()` pairs any two flowers, deals and Shuffle keep flowers in twos, clear band [0.45, 0.9]; flower-with-other-picture line, its own spoken instruction and a level-scoped how-to step. Levels 1–7 deal the same boards as `origin/main` (seeds 1–100).
**Ran:** `npm run typecheck`; full `npm test` (350 files; two how-to failures fixed by folding the step), then `npx vitest run src/games/tile-pairs src/content` (216 passed) after the review fix; `BROWSER_SUITE=tilepairs TILE_LEVELS=8 TILE_LOOKS=off` (flower-with-other mismatch, hint, undo, shuffle, resize, one sticker, return to Lantern Lake); `BROWSER_SUITE=fingerdemo FINGER_ONLY=tile-pairs FINGER_LEVELS=8` (31.0 s); `npm run build`; portrait screenshots of level 8 (all four flowers).
**Measured:** kept clear rates 45–90%, median 68%, mean 1.35 candidates over 100 seeds on a Mac, not a phone.
**Not run:** couch suites, offline, `world`, `lands` (no shared code or navigation changed).
