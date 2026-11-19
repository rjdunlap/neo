# 2026-11-19 — Market Stall upright on phones (PR #1844)

**Changed:** Market Stall plays upright (`upright: true`). Held upright the whole stall moves down the tall screen (awning at 220 or lower, clear of Home; counter at the larger of 580 and 45% of the height, capped so its front stays above the purse) instead of sitting at the top above an empty lower half. `purseFor`, `AWNING`, `COIN_HIT`, `BELL_HIT` and `MAT_BOX` moved into `logic.ts`; the awning is drawn from `awningTop`. Sideways is unchanged.
**Ran:** `npm run typecheck`; vitest for Market Stall (new `upright.test.ts` over every level on five upright views plus 360 × 800, passed first time) and the registry (108 tests passed).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=market-stall PHONE_BAND=school PHONE_LEVELS=3,5,7 PHONE_SHOTS=1`, all three levels completed with one sticker each; the level 5 screenshot looked at (stall mid-screen, purse at the foot, nothing overlapping). Headless Chrome only.
**Not run:** `uprightsweep`, build, offline.
