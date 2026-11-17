# 2026-11-17 — Upright batch 6: drift-cards, word-glue and four partial games (PR #1765)

**Changed:** `drift-cards` and `word-glue` are `upright: true` (drift-cards' `cornerButtons` keeps a 120 × 210 left column clear upright); `beat-builder`, `pattern-train`, `pixel-pictures` and `orchard-rows` use `uprightLevels` for the levels the sweep measured fitting; new `src/games/upright-batch-6.test.ts` (every level of the two whole games on three upright phone views plus a 375 × 601 one); the sweep gained `PHONE_LEVELS=all` and a `culprits` list.
**Ran:** `npm run typecheck`; full `npm test` (passed, after `npm run game-docs`); the `uprightsweep` with `PHONE_LEVELS=all` on the six games at 390 × 844, before the flags were set.
**Not run:** `npm run build`, offline, `fingerdemo` (no bot targets moved), a sweep rerun after the flags were set; beat-builder has no unit layout test (its layout is inline), so its levels rest on the sweep alone.
