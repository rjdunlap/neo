# 2026-11-14 — Rainbow Fingers level 8 Finish the color wheel

**Changed:** `rainbow-fingers` level 8 (six-petal wheel, `paint.wheel*` lines, level-8 how-to step); school range 5–8; review fixes (primary outline textures freed in `destroy`, bowl emptied after each petal).
**Ran:** typecheck; full `npm test` (351 files, 7117 passed); `BROWSER_SUITE=early EARLY_ONLY=paint FROM_LEVEL=8 TO_LEVEL=8` passed (2 misses, 1 hint, every petal, sticker) and re-run after the review fixes; `BROWSER_SUITE=fingerdemo FINGER_ONLY=rainbow-fingers FINGER_LEVELS=8` passed (33.5 s), re-run after the fixes; screenshots at 844x390 phone landscape and 768x1024 portrait checked by eye (wheel clear of pots, pet and buttons).
**Not run:** `npm run build` (no shared files or assets changed), other suites, offline.
**Note:** the wheel is laid out once and is not re-laid out if the logical view changes mid-round.
