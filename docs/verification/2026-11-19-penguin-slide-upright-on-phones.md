# 2026-11-19 — Penguin Slide upright on phones (PR #1853)

**Changed:** Penguin Slide plays upright (`upright: true`). Its layout is a pure `layout.ts` (`pondLayout`): sideways is unchanged; held upright the pond sits clear of Home and help, and the undo button rests beneath the ice instead of at x+w+70, which was off the 768-wide edge for the 6- and 7-column ponds.
**Ran:** `npm run typecheck`; vitest for Penguin Slide (new `upright.test.ts` over every pond size, 5×4, 6×4, 6×5 and 7×5, on five upright views) and the registry (98 passed).
**Ran:** `BROWSER_SUITE=uprightgames` for school levels 2, 5, 12 and 13 and preschool levels 1 and 11 by real touches, each completing with one sticker; an upright screenshot of level 13 viewed. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, full suites.
