# 2026-11-19 — Second Chance Shed upright on phones

**Changed:** Second Chance Shed plays upright at every level (`upright: true`). Levels 1–4 (`shedLayout`) already fit; the planned cart (5–6, `planLayout`) and the picnic board (7–8, new `uprightPicnicLayout`) got upright branches hung up from the bottom edge (friends above the places with the bell at their right, the cart row above them, five things at a 132 pitch; a 768 × 1024 picnic plan with the shelf row clear of Home).
**Ran:** `npm run typecheck`; eslint; the Second Chance Shed folder unit tests (129 passed), including the new `upright.test.ts` (every level, 3 seeds, 5 views).
**Ran:** `BROWSER_SUITE=uprightgames` at 390 × 844: toddler 1, 2, prek 3, 4 and school 5–8 played to completion by real touches, one sticker each; screenshots of levels 6 and 8 viewed. Headless Chrome only.
**Not run:** build, the full unit suite, offline.
