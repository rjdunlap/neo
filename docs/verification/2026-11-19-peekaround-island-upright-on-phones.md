# 2026-11-19 — Peekaround Island upright on phones (PR #1851)

**Changed:** Peekaround Island plays upright (`upright: true`). Its layout is a pure `layout.ts` (`islandCenter`, `arrowSpots`, `cardSpots`, `shoreSpots`): the turning arrows (they sat at ±400 from the island centre, off the 768-wide view) now sit beneath the island; level 7's three 270-wide view cards go two to a row, with the island lower to clear the second row; picture tiles and sky maps start clear of Home and help (x 125 and up); level 5's four shore friends stand two to a row. Sideways is unchanged.
**Ran:** `npm run typecheck`; eslint and prettier; vitest for Peekaround Island (new `upright.test.ts` over every level on five views: phone, small, tall, captioned and 360 × 800) and the registry (98 passed).
**Ran:** `BROWSER_SUITE=uprightgames` for Peekaround Island levels 1–8 (toddler 1–2, pre-K 3, school 4–8) by real touches, each completing with one sticker; upright screenshots of levels 1, 5 and 7 viewed. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other browser suites.
