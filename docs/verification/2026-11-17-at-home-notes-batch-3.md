# 2026-11-17 — At-home notes batch 3 (PR #1757)

**Changed:** Notice and Say lines in `AT_HOME_NOTES` for eight more games (Recipe Workshop, Song Maker, Sound Garden, Egg Catch, Bumper Garden, Goodnight Room, Seesaw Balance, Relay Woods), so the table holds 24 games; Treehouse now has a toddler game with notes, so the toddler nothing-played starters are Bounce Back, Jelly Drums and Recipe Workshop (lap, preschool, pre-K and school unchanged). Strings tier: no game behaviour.
**Ran:** `npm run typecheck`; `npx vitest run src/content/athome.test.ts src/content/offscreen.test.ts` (23 of 23, athome 16 of 16); Prettier check on both files; the tests bite: a Notice "Can {name} keep their beat yet?" failed the Notice rule test and was restored.
**Not run:** the `athome` browser case (it pins lap and school only, and no pinned starter changed), build, full `npm test` (CI runs both on the PR) and every other suite.
