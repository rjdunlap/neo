# 2026-11-17 — Ribbon Workshop plays upright on a phone (PR #1763)

**Changed:** `ribbon-workshop` is `upright: true`; all three scenes (bench, Whole Switch, Ribbon Cases) draw their sideways layout into a container scaled to the 768-wide area (`frame.ts`; identity on a sideways view); `trayLayout` gained an optional left edge; new upright layout tests (four phone views) in `src/games/upright-catch-up.test.ts`; the registry's upright list (30); new `RIBBON_LEVELS=upright` play in the `ribbon` suite.
**Ran:** `npm run typecheck`; `npm test` (359 files, 7,697 tests passed); `BROWSER_SUITE=ribbon RIBBON_LEVELS=upright` passed on a 390 × 844 touch phone at levels 1, 6 and 7 (layout fit assertion, ghost-finger finish; screenshots of all three looked at).
**Not run:** `npm run build`, offline, the rest of the `ribbon` suite, `fingerdemo`, other suites.
