# 2026-11-12 — U7d: `sayWaitingAsk` in the batch 3 to 6 games

**Changed:** seven games implement the optional `Game.sayWaitingAsk()`, so a guide tap while a right answer's line plays says the waiting ask instead of repeating the previous request: `melt-freeze`, `drift-cards`, `fruit-slice`, `fluffy-salon`, `cut-along`, `look-it-up` and `peekaboo-barn` (`fluffy-salon`'s and `peekaboo-barn`'s `askNow` now return a boolean). `tide-line` is unchanged on purpose: its stored instruction does not change between strips.
**Ran:** `npm run typecheck`; the seven games' rule tests (7 files, 225 tests); `BROWSER_SUITE=meltfreeze`, with a new level 3 assertion (a guide tap during the next request's wait returns true and clears the unasked flag; a second returns false).
**Not run:** browser plays of the other six games (the same three-line method over existing ask code), `fingerdemo` (no bot change), `npm run build` (no shared file changed).
