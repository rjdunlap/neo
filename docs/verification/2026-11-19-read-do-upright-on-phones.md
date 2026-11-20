# 2026-11-19 — Read & Do upright on phones (PR #1888)

**Changed:** Read & Do opens upright across levels 1–9. The three scenes use pure layouts in `src/games/read-do/layout.ts`. Short phones keep the picture choices and word trays above the caption bubble, with Show it and Send below it, beside the guide. The punctuation stamp settles at its new socket or resting position after rotation. The game page also corrects the school range and describes the sideways button layout.

**Ran:** Local typecheck, scoped Prettier and ESLint, generated game docs, link and diff checks. The game and registry suites include all nine levels across six upright views, covering ordinary portrait, a tall safe-area view, the caption strip, and the short-phone caption bubble.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=read-do PHONE_BAND=school PHONE_LEVELS=1,2,3,4,5,6,7,8,9` at 390 × 844 on `f38fcf51b`. All nine levels completed with one sticker each. Reviewed all openings, then centered the short signs on levels 1 and 2 and rechecked those levels with `PHONE_LEVELS=1,2`.

**Ran:** At 390 × 625, a focused Chromium touch probe covered caption clearance in levels 6 and 9, stamp placement and rotation, two rejected Sends and one hint in level 9, retained words through rotation, and a sticker for each completed level. Reviewed both screenshots. The dev server ran at `http://localhost:5208`.

**Not run:** Local production build, offline, and a separate ghost-finger run. The filtered upright suite uses its coordinates to drive native Chromium touches.
