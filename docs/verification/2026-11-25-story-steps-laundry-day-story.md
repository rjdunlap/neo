# 2026-11-25 — Story Steps Laundry Day story (PR #2203)

**Changed:** Eleventh `story-steps` story `laundry` (Wash the picnic blanket): `STORIES`, `STORY_FAMILY` (`wash`, with dog), a `LOOKALIKE_PAIRS` list replacing the hard-coded dog/bedtime test in `canPairStories` (laundry with bedtime added), level 4's pool, four Pixi pictures in `art.ts`. No new level, save field or voice line file.

**Ran:** `npm run typecheck`, `npm run format:check`, `npm run lint`; `npx vitest run src/games/story-steps src/content/barrels.test.ts src/content/game-docs.test.ts` (75 passed, 1 skipped), with counts updated to eleven, laundry/dog/bedtime pairing refused in both orders, and a test that laundry sits in the level 4 and full-pool plans but not levels 1–3. One headless Chrome render of the four picture cards at stages 0–3 through `storyCard` (all four read as spot, tub, line, dry blanket on a basket and fit the card). `npm run game-docs` rerun.

**Not run:** a filtered browser play of a level whose seed shows the story (the round loop is generic over `STORIES` and the existing rule tests cover every seed), `npm run build` (no shared files or assets changed), the full `npm test` (left to PR CI). No Kokoro clip rendered; the four sentences use device speech.
