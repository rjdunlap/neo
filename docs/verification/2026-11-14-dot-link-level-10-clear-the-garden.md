# 2026-11-14 — Dot Link level 10, Clear the garden (PR #1655)

**Changed:** `dot-link` level 10 *Clear the garden* (school window 8–10): a frozen 4×4 three-color board, no refill, cleared in as few lines as she can; 24 boards from `scripts/dot-link-gardens.mjs` (fewest 4 or 5 by the exact solver); free Undo; Lines card with a star at the fewest. Review fixes: the hint is found once and kept, Undo is dimmed with nothing to take back.
**Ran:** typecheck; full `npm test` (351 files, 6971 passed); 28 dot-link rule tests; `BROWSER_SUITE=batch BATCH_ONLY=dots DOTS_LEVELS=10` on a 390×844 phone portrait (hint line, a tap, Undo restores the board, then the fewest route, 4 of 4 lines, star; score [0 misses, 1 hint]); `BROWSER_SUITE=fingerdemo FINGER_ONLY=dot-link FINGER_LEVELS=10 FINGER_BAND=school` passed, rerun after the review fix.
**Not run:** `npm run build` (no shared files or assets changed), other dots levels (unchanged), offline.
