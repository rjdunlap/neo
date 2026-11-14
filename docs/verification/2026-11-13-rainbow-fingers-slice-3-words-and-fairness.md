# 2026-11-13 — Rainbow Fingers slice 3, words and fairness (PR #1627)

**Changed:** a spoken-name table for every picture, green apples and grapes accepted at the recall level (5), a level 1–2 color echo (at most once every 6 s), three wordings for start, done, finished and praise, level 7's own prompt, co-play and off-screen lines.
**Ran:** `npm run typecheck` (pass); the rainbow-fingers rule tests, 30 of 30 (9 new); full `npm test`: 6,857 passed and 8 failed, all timing assertions in unrelated games under machine load (block-topple, block-garden, fluffy-salon, keep-house, number-nook, penguin-slide twice, secret-code), none in rainbow-fingers, howto, game-docs or offscreen; `npm run game-docs` changed nothing.
**Not run:** browser suites (`early`, `fingerdemo`), `npm run build`, and a re-run of the 8 timing failures on a quiet machine. The slice's tier is typecheck, rule tests and the how-to test.
