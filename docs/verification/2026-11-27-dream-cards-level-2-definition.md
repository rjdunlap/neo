# 2026-11-27 — Dream Cards level 2 definition

**Changed:** docs only: [the definition](../definitions/dream-cards-two-clues.md) of Dream Cards level 2, *Two clues for one picture*, and a Next ten line for its build. The deal counts it quotes (84 dealt clue pairs: 68 with one picture fitting both and 16 with two; 200 ordered picture-and-two-clue triples over the 28 valid deals, 14 deals with 6, 12 with 8, 2 with 10) were computed from the `FITS` table in `src/games/dream-cards/logic.ts`. Next ten now holds one line and Queued holds none; the refill source is the dives' build-slice lists, not done here.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** code checks (no code changed); the build session runs the new-levels tier named in the definition.
