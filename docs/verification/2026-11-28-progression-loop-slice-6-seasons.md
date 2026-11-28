# 2026-11-28 — Progression loop slice 6: seasons

**Changed:**
- `src/content/seasons.ts` (new, pure): four-week seasons from Monday 5 January 2026 (`seasonOf`, `seasonDays`), four goals (10 all-six days 60 shells, 12 games 40, 50 rounds 40, 6 stamps 40), `progress`, `settle` (each goal paid once a season, the keepsake when all four are paid), `countRound` (earning band only), `cleanSeasons`, `SEASON_SHORT`. `SaveData.seasons` with defaults and repair; `store.countSeasonRound`; `store.recordAllSix` settles the season too.
- `GameScene.finish` counts the round toward its season after the stamps; the result adds the bonus to "+N shells" and a lantern pill ("Season goal: 50 rounds", or a count).
- The Lanterns sheet shows "This season" with its dates, each goal's count, shells and lantern, then the keepsakes.
- Docs: the definition's slice 6, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` before rebasing onto the newer main (560 files, 20,643 passed, 5 skipped) and the progression tests after it; `npm run build`. Headless Chromium as an iPhone 13 upright: with a save at 49 rounds and 11 games this season, one finished round showed "+115 shells", two stamps and "2 season goals met", and the save held both goals paid; the sheet listed the season (Nov 9 – Dec 6) with counts and a seeded keepsake.

**Not run:** no browser suite. Chrome emulation is not a real phone.
