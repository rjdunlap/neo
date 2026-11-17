# 2026-11-17 — At-home notes batch 2 (PR #1754)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for eight more games (Pixel Pictures, Peekaboo Barn, Duck Pond, Swap Meet, Dot Link, Photo Safari, Bouncy Launch, Word Search), so all 11 lands have a game with notes; the nothing-played starters are now Bounce Back, Jelly Drums and Peekaboo Barn at lap and toddler and Bounce Back, Jelly Drums and Pixel Pictures from preschool up, and the lap kit line ends with a blanket. `src/content/athome.test.ts` pins the new starters and kit and requires notes in every land (at least 16 games); the `athome` browser case pins the same.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts` (16 of 16); `BROWSER_SUITE=athome` (one case) on a dev server with speech off.
**Not run:** full `npm test` and `npm run build` locally (CI runs both on the PR), `world`, offline, `fingerdemo`, the game suites and the full `grownups` suite.
