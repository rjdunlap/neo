# 2026-11-28 — Progression loop slice 5: Today's six extras

**Changed:**
- `src/content/sixes.ts` (new, pure): `recordAllSix` (an earning band only, once a day, 25 shells within the largest balance), `cleanSixes`, `resultOn` (clean, help or none for a card today), `shareLine` (Wordle-style squares, no game names), `monthGrid` (weeks from Monday), `keyOf`. `SaveData.sixes` with defaults and repair; `store.recordAllSix`.
- `DailyScene.flourish` records a grown-up's all-six day and shows "+25 shells · all six" under the title with the new balance; the lantern sheet passes today's results.
- `src/ui/stamps-sheet.ts`: titled "Lanterns" from the six, with Today (share line, Copy through the share sheet or clipboard), a month calendar with a lantern on each all-six day, then the stamps. Styles in `src/style.css`.
- Docs: the definition's slice 5, todays-six's "Across days" row, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` (559 files, 20,637 passed, 5 skipped); `npm run build`. Headless Chromium as an iPhone 13 upright: picked Grown-up, seeded three earlier lantern days, gave each of the six a round today (two with misses), reopened the six: the pill and a balance of 25 showed, the save held the day; the sheet showed "🟩🟨🟩🟩🟨🟩 6/6" and November with lanterns on the 3rd, 4th, 17th and 28th.

**Not run:** no browser suite; the Copy button's share sheet needs a real phone.
