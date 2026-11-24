# 2026-11-24 — Garden Grow level 7 colours from the pool

**Changed:** `makeRequests` in `src/games/garden-grow/logic.ts` now draws level 7's colour from all six seeds with the seeded RNG (never the same request twice running) instead of cycling red, yellow, blue; one new rule test; the game page and dive updated.
**Ran:** `npm run typecheck`; `npx vitest run src/games/garden-grow` (12 passed, including the new test that all six colours appear and first colours vary); `BROWSER_SUITE=woods WOODS_ONLY=grow FROM_LEVEL=7` against a dev server with speech off (levels 7 and 8 passed, tested at the commit that changed `logic.ts`).
**Not run:** `fingerdemo` (the bot and demonstrated action are unchanged), build, offline, full suite.
