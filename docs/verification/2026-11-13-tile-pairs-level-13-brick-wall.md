# 2026-11-13 — tile-pairs level 13: Brick wall (PR #1636)

**Changed:** `tile-pairs` level 13 *Brick wall · half steps* (26 tiles on half-step positions: five raised tiles each resting on two below, three more on those); `free()` now uses overlap, with whole-step boards unchanged; peek stacks keyed on the floor of x; blocked tiles greyed on half-step boards; how-to step; grown-up `order` ends 11, 12, 13.
**Ran:** `npm run typecheck`; `npm test` (all pass, after the first run caught the how-to card step limit; includes a test of the old rule on random masks of every earlier layout and a fingerprint pinning levels 11-12); `BROWSER_SUITE=tilepairs TILE_LEVELS=13` (a raised brick tapped 40 units left of its middle, over the seam below it; phone portrait screenshot and 768×1024 portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=tile-pairs FINGER_LEVELS=13` (37.2 s). A game-reviewer pass found no defects.
**Measured:** over 300 seeded routes random play clears 8-100%, median 68%, 204 of 300 in the band [0.45, 0.9]; 100 seeds deal in band and clear.
**Not run:** `npm run build` (no shared files or assets changed), other browser suites, `couchgames` (no pad mapping change), offline.
