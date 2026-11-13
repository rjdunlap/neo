# 2026-11-13 — pyramid-solitaire level 7 The classic pyramid (PR #1598)

**Changed:** `pyramid-solitaire` gains level 7: seven rows, 28 cards from one pack, strict rule, no shelf, dial 30–70%; grown-up range 1–7. Levels 1–6 deal identically (`dealCandidate` unchanged). Upright rows close up to at least 64 on a short view; sideways the three buttons stand in a column left of the pyramid (rows 72 apart). Level-scoped how-to step; voice unchanged.
**Ran:** `npm run typecheck`; full `npm test` (351 files passed, including the level-7 rule test and the upright and sideways layout tests in `upright-batch-3`); `BROWSER_SUITE=pyramid PYRAMID_LEVELS=7` headless (passed; portrait 768×1024 and landscape 1024×768 screenshots); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pyramid-solitaire FINGER_LEVELS=7` (passed, 35.9 s).
**Measured:** 300 seeds on a Mac: undialled median clear rate 50%, 275 hold a dead end; dialled all 300 in band (median 50%), at most 94 positions (test bound 146), slowest deal about 1 ms.
**Not run:** `npm run build` (no shared files or assets changed), offline, other suites.
