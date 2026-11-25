# 2026-11-24 — Robot Path level 15 opens on the first board

**Changed:** Level 15 (A routine) now opens on the first board, "Around the middle", which teaches the call with a prefilled routine; later rounds in the same visit use the seeded pick. Playing any other level ends the visit.
**Ran:** `npm run typecheck`, `npm run format:check`, `npm run lint`, `npx vitest run src/games/robot-path` (99 passed, two new entry tests), `BROWSER_SUITE=robot FROM_LEVEL=15 TO_LEVEL=15` (passed).
**Not run:** the full unit suite (left to PR CI), `fingerdemo` (the bot and demonstrated action did not change), build and offline (no shared files or assets changed).
