# 2026-11-19 — Little Helpers upright on phones

**Changed:** Little Helpers plays upright at every level (`upright: true`). Its layout was pulled into a pure `layout.ts` (`helpersLayout`, `crowdHome`, `carryPitch`) with the sideways plan pinned identical by a test; upright the crowd hangs up from the bottom edge in two rows, the fruit sits above it with the ring badge and whistle over that, the destination is bottom right, and single-fruit carriers queue at a 100 pitch (teams keep their 50 step).
**Ran:** `npm run typecheck`; prettier; eslint on the folder; the Little Helpers and registry unit tests, including the new per-level `upright.test.ts` (all 9 levels, 3 seeds, 5 views), which found one real fault (seven strong carriers at a 98 pitch, fixed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=little-helpers`: school 5–8 and toddler 1, 2, 9 played to completion by real touches, one sticker each; screenshots of levels 7 and 8 viewed. Headless Chrome only. `GAME_URL` must end in `/classic/` (the suite opens `/`).
**Not run:** build, full suites, the upright sweep, offline.
