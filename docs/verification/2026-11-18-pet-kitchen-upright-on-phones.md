# 2026-11-18 — Pet Kitchen upright on phones

**Changed:** Pet Kitchen plays upright (`upright: true`, added to the registry test's upright list). Its layout is now a pure `kitchenLayout(view)` in `layout.ts`: held upright the round-ending Serve arrow stands above the counter's right end instead of at the top of a tall phone, the food, plates and bowl sit lower, and the round buttons are radius 52 (104 across; the sweep had flagged 96 at level 14). Level 10's 67-unit drawn look piece (150-unit tap radius) was flagged but is fine.
**Ran:** `npm run typecheck`; `npx vitest run src/games` (280 files pass), including the new `upright.test.ts` (all 15 levels, each moment, five upright views).
**Ran:** `BROWSER_SUITE=uprightsweep PHONE_BANDS=all` before the flag; then `BROWSER_SUITE=uprightgames PHONE_BAND=school` levels 5, 12, 13, 14 and 15 with `PHONE_SHOTS=1`: all completed with one sticker each; screenshots looked at (content mid-screen, arrow near the bottom). Headless Chrome only.
**Not run:** full build, offline, other browser suites, any real phone.
