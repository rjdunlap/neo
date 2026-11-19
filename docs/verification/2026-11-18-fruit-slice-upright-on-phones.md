# 2026-11-18 — Fruit Slice upright on phones (PR #1834)

**Changed:** Fruit Slice plays upright at levels 1–11. `boardScale(view)` scales the 820-wide board (positions and hit circles together, counts unchanged) to fit the 768-wide upright area (about 0.888; 1 sideways), and two or three hanging fruit hang farther apart upright (0.3/0.7 and 0.2/0.5/0.8) so drifting neighbours keep their circles apart. The sweep flagged only the bowl's drawn height (its tap area is 160); the real overflow was the board's width and the hanging-fruit overlap. `upright: true` is set and the registry list holds 69 games.
**Ran:** `npm run typecheck`; eslint and prettier on `src/games/fruit-slice`; vitest for `src/games/fruit-slice` and `registry.test.ts` (165 passed), including the new `upright.test.ts` (levels 1–11 on phone, small, tall, captioned and short views; sideways unchanged).
**Ran:** `BROWSER_SUITE=uprightsweep PHONE_BANDS=all` (fruit-slice) before the flag; `BROWSER_SUITE=uprightgames` at school 5, 7, 8, 9 and 10, preschool 2 and 11, toddler 1, all completed with one sticker each; a level 9 screenshot was looked at. Headless Chrome only.
**Not run:** full build, offline, the other suites.
