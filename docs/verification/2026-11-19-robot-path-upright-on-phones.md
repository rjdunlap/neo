# 2026-11-19 — Robot Path upright on phones

**Changed:** Robot Path plays upright (`upright: true`). Its layout is a pure `layout.ts` (`robotLayout`). Held upright the grid (cell up to 128, centered between Home and the controls) is on top, the four arrows lie in one row beneath it (the loop button a fifth on loop levels), then the program slots (2 rows of 4 when the limit is above 4), with the play button at the end of the last slot row, all placed up from the bottom edge. Sideways and the non-upright narrow layout are unchanged.
**Ran:** `npm run typecheck`; vitest for `src/games/robot-path` and the registry test, including the new `upright.test.ts` over levels 1–14, every board and plan, on four upright views, which passed first time.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=robot-path PHONE_BAND=school` levels 4, 9, 11, 12, 13 and 14 by real touches, each completing with one sticker; screenshots viewed. On a tall phone some empty space remains between the 5 × 5 grid and the arrows, left as is. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, full unit suite.
