# 2026-11-20 — Mystery Grid level 8 thumb-size upright layout

**Changed:** On an upright phone, level 8 (Who came first?) now uses the level 7 layout: 88-unit squares (44.7 px) and 88-unit written clue cards (were 64 units, 32.5 px), the L sliding under a window, a drag on a square or a header panning it. The two levels share `phoneLayout`.
**Ran:** typecheck; the `logic-grid`, upright-batch-3 and grownup-thumbs unit tests (layout clear of Home, Help and the caption at every clue count; thumb table updated); `BROWSER_SUITE=logicgrid LOGICGRID_FROM=8 LOGICGRID_PHONE=1` (level 8 play to the sticker, header drag, a miss and a hint, landscape and portrait).
**Not run:** build, offline, level 8 screenshot review, level 1–7 browser plays (level 7 layout code was moved, not changed; its unit test passed).
