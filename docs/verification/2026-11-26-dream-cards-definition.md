# 2026-11-26 — Dream Cards definition (PR #2258)

**Changed:** docs only: [the definition](../definitions/dream-cards.md) of Dream Cards level 1, a new school-only game on Story Grove, the social-emotional study's claim line, its study-backlog row and a Next ten line for the build. The deal counts (28 valid deals of 400; 26 with 6 fitting pairs, 2 with 7) were derived by enumeration against the fit table written in the definition.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** code checks (no code changed); the build session runs the new-game tier named in the definition.
