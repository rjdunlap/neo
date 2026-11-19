# 2026-11-19 — Duck Pond upright on phones (PR #1865)

**Changed:** Duck Pond plays upright at every level (`upright: true`). The layout in `logic.ts` (`pondCenter`, `padSpot`, `bankSpot`, `signSpot`, `enterY`, `pondDrawRx`, and `frameSeats(n, upright)`) is view-aware: the pond (780 wide, clipped at the right edge of the 768 view before) draws inside the view and hangs from the bottom edge, the sign stands above it, waiting ducks stand four to a row, the pads centre in the width the guide leaves, and level 15's twenty seats stack in two ten-frames on a taller pond. New `upright.test.ts` covers levels 1–15 and five views.
**Ran:** `npm run typecheck`, eslint, and the Duck Pond tests (603 passed).
**Ran:** `BROWSER_SUITE=uprightgames` on Duck Pond by real touches: preschool 3, 5, 6, 7, school 8–11, 14, 15 and lap 12, 13 completed; screenshots of levels 11, 14, 15 and 8 viewed (fit, no clipping). Headless Chrome only.
**Not run:** build, other suites, offline, real device.
