# Verification 2026-10-28 (archived entries)

## 2026-10-28 — Size Parade Who fits (level 11)

- [PR #1023](https://github.com/rjdunlap/neo/pull/1023), branch `claude/size-parade-who-fits`, tested commit `40ede5d0`: level 11 *Who fits?* (bed, chair, bowl, door each fitting one of three friends; too big and too little tried on screen); preschool `order [3, 4, 17, 10, 5, 6, 11]`, pre-K `{ min 5, max 11, order [5, 6, 11, 7, 8] }`.
- Ran at `GAME_URL=http://localhost:5637` (Vite `--strictPort`): `npm run typecheck`; `npx vitest run src/games/size-parade` (16 passed, 5 new: prop multiples, one fit per prop and every rank once over 300 seeds, varied deals keep `MIN_RATIO` and the bot finds the fit, the bed overhang rule, band orders); full `npm test` (279 files, 3,707 tests); `npm run build`.
- `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=11 SIZE_PORTRAIT=1`: sky tap free, two wrong tries = 2 misses and 1 hint, round finished with a sticker, landscape and portrait screenshots. `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=11` passed (8.3 s). A probe captured just-right and too-big poses for each prop (reviewed by eye). A bug found and fixed in the play: fit mode fell into the drag branch of `deal()`, so friends took no taps.
- `game-reviewer` found no defects. Not run: other Size Parade levels (unchanged interactions), couch suites, the production offline check, an iPad, a child.
- Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md).
