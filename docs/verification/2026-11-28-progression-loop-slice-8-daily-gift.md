# 2026-11-28 — Progression loop slice 8: the daily gift

**Changed:**
- `src/content/gift.ts` (new, pure): `claimGift` (an earning band only, 10 shells once a local day, never stacking, within the largest balance), `cleanGift`. `SaveData.gift` with defaults and repair; `store.claimGift`.
- `DailyScene.enter` claims the day's gift and shows "+10 shells · today's gift" under the title; the all-six pill now stacks under it when both come at once (`showBonus`).
- `lodge` and `friendPage` take an optional `Origin`, and their Back goes there through `goToOrigin` (Today's six when none), so the island-games thread's Home can open them and get Back to Home.
- Docs: the definition's slice 8 (the school band waits for the developer), DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` (566 files, 20,757 passed, 5 skipped) before the origin change, then `src/app`, `src/progress` and the gift tests after it; `npm run build`. Headless Chromium as an iPhone 13 upright: a grown-up's first visit to the six that day added 10 shells, then the all-six bonus 25 (35 in all); the lodge opened and its Back returned to the six.

**Not run:** no browser suite. Chrome emulation is not a real phone.
