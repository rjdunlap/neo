# 2026-11-25 — U7d fix batch 2, first part: domino-run and fruit-slice never hold the next board on a praise line

**Changed:** `fruit-slice` level 9 and `domino-run` (every level) no longer hold the next board on the praise line: `slice.cover-yes` and the ring line start, the board changes over them (0.8 s for the last halves at level 9; the dominoes stand up and slide away at Domino Run) and the next instruction cuts them. The last board's line is still heard out.
**Ran:** `npm run typecheck`; `npx vitest run src/games/fruit-slice src/games/domino-run` (217 passed); `BROWSER_SUITE=fruitslice FRUIT_LEVELS=7,9` and `BROWSER_SUITE=dominorun`, both PASS on a speech-off dev server.
**Not run:** the full `npm test` (left to PR CI), build, offline; no real-phone feel check of the shorter pause between boards.
