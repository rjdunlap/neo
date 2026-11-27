# 2026-11-27 — Dream Cards level 3 definition

**Changed:** docs only: [the definition](../definitions/dream-cards-own-picture.md) of Dream Cards level 3, *Make your own dream picture*, and a Next ten line for its build. The counts it quotes (27 stamps; 24 inviting four clues and 3 inviting all six; 8,100 stamp, decoy-pair and clue-triple combinations, of which 1,464 are valid and every stamp has between 41 and 134) were computed with a throwaway script over the `FITS` table in `src/games/dream-cards/logic.ts` and the nine part tables in the definition. The first draft of the stamp rule (most parts agree) left two stamps with no valid deal, so the definition uses the union and records why. Next ten holds one line and Queued holds none; the refill source is the dives' build-slice lists, not done here.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** code checks (no code changed); the build session runs the tier named in the definition.
