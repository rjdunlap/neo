# 2026-11-12 — Tile Pairs level 9 Wide stack (PR #1582)

**Changed:** `tile-pairs` level 9: 30 tiles (6 × 3 base, 4 × 2 raised, 2 × 2 on top), six pictures, no flowers, deal band 0.45–0.9; `solve` takes an optional node counter; Shuffle keeps to four rows of six and raises up to six extras past 24 tiles; how-to flower step at level 8 only.
**Ran:** `npm run typecheck`; the game's rule tests (14 pass, including the under-20,000-node dead-end test); `BROWSER_SUITE=tilepairs TILE_LEVELS=9 TILE_LOOKS=off` (pass after the shuffle fix; portrait and landscape-shuffled screenshots; shuffled board stays above the buttons); `BROWSER_SUITE=fingerdemo FINGER_ONLY=tile-pairs FINGER_LEVELS=9` (pass, 41 s, before the reshuffle change; the bot is unchanged).
**Measured:** 100 seeds all in band, raw routes 17–97% clear (median 70%), worst deal 24 ms; worst random play-out about 5,000 states, 2.6 ms, on a Mac, not a phone.
**Not run:** build (no shared files or assets), full `npm test` (CI runs it), couch suites, offline, `world`, `lands`.
