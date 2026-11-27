# 2026-11-26 — Duck Pond level 16 definition (PR #2255)

**Changed:** docs only: [the definition](../definitions/duck-pond-every-way.md) of Duck Pond level 16, *Every way*, the dive's slice 9 line, and a Next ten line for the build. The definition was checked against `src/games/duck-pond/logic.ts` (plans, `LEVELS`, `splitSeats`, `duckMove`) and the voice file.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** code checks (no code changed); the build session runs the new-interaction tier named in the definition.
