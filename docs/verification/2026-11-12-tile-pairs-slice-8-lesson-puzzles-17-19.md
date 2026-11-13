# 2026-11-12 — tile-pairs slice 8: lesson puzzles 17-19 (PR #1589)

**Changed:** `tile-pairs` levels 17 *Twins on twins*, 18 *Three free copies*, 19 *Crossed stacks* (designed boards in `puzzles.ts` from `scripts/tile-pairs-pool.mjs`'s placement search), the lesson voice lines, the grown-up band's `order`, a level-scoped Peek and lesson step on the how-to card; `tilepairs` suite gains a lesson block.
**Ran:** `npm run typecheck`; tile-pairs rule tests and the upright layout test (all level IDs); howto test; `BROWSER_SUITE=tilepairs TILE_LEVELS=19` (losing pair taken with no miss, stuck line then lesson line, undo restores, portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=tile-pairs FINGER_LEVELS=17`; `npm run build`. Full `npm test`: 8 failures, all timing tests in other games under machine load (block-garden, block-topple, fluffy-salon, keep-house, number-nook, penguin-slide, secret-code), passed on rerun; one real failure (the how-to card step limit) was fixed.
**Measured:** placement search, 8 boards kept of 54 (twins), 1,826 (three) and 5,240 (crossed) seeded placements.
**Not run:** other browser suites, offline, couch suites.
- Review fixes: the lesson line plays only after a dead end left by the first pair; the how-to lesson step mentions Shuffle; the filtered tilepairs play at 19 re-passed.
