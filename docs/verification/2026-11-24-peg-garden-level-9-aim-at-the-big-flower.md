# 2026-11-24 — Peg Garden level 9, Aim at the big flower (PR #2105)

**Changed:** Peg Garden level 9 (`FLOWER_PLAN`, mode `flower`): one golden bud among 12 plain ones, three shots, whole path shown, a missed shot is no miss; preschool and pre-K orders; how-to steps; three voice lines with clips.
**Ran:** typecheck; full `npm test` (19057 passed, after the clips were rendered), including the new `logic.test.ts` block (reachability with margin at every place on every shape, spacing, determinism); `BROWSER_SUITE=batch BATCH_ONLY=pegs FROM_LEVEL=9 TO_LEVEL=9` (0 misses, 1 hint); `fingerdemo` `FINGER_ONLY=peg-garden FINGER_LEVELS=9` (finished in 11.0 s); one landscape phone screenshot at 844 x 390 (the game is landscape-only on phones).
**Not run:** production build, offline, other browser suites.
