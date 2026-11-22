# 2026-11-21 — Market Stall level 8, How much is in the purse? (PR #1959)

**Changed:** school level 8 (plan mode `purse`, `PLANS[7]`): three purses a round, three number cards (total, coin count, neighbour), tap-a-coin value, named misses, a count-on hint after two misses; six `shop.purse.*` voice lines, how-to lines, rule tests, the `woods` shop loop's purse branch.
**Ran:** typecheck; `npm test` (467 files, 17448 passed); prettier and eslint on changed files; `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=8` passed (coin heard, coin-count and near cards missed, hint with the right card lit, score [2,1], portrait screenshot at 390x844); `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=8 FINGER_BAND=school` passed (7.4 s). `game-reviewer`: no blocking findings.
**Not run:** `npm run build` (no shared files or assets changed); offline; a level 1 play (existing levels unchanged).
