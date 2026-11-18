# 2026-11-18 — Younger-band games' questions on ctx.instruct, second session (PR #1790)

**Changed:** TotoLogic P3 slice 3, the second ten games that reach school from bands younger than pre-K (bug-builder to egg-catch, alphabetical): Cut Along level 11's `cut.place` ("Now carry it into the picture. Put it anywhere you like!") moved from `ctx.say` to `ctx.instruct` while the piece is carried; the other nine were read and needed nothing or kept `say` on purpose.
**Ran:** `npm run typecheck`; `npx vitest run src/games/cut-along src/content` (23 files, 293 tests passed, 1 skipped); on a headless Chromium run, `BROWSER_SUITE=cutalong CUT_LEVELS=11` passed (a tap between shapes, a stray and a hint, one drop off the picture, two placed). It is a regression play; it does not assert the caption text.
**Not run:** full unit suite and build locally (CI runs both on the PR), offline, `fingerdemo` (the demonstrated action did not change).
