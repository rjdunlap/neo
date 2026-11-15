# 2026-11-15 — Animal Snack level 8 Their own snacks (PR #1701)

**Changed:** `animal-snack` level 8 (`pairs` mode and rules, a two-row spot in all four scenes, the dot sign, four voice lines, how-to line, `LEVELS.prek` 5–8, the `woods` suite's level 8 branch).
**Ran:** typecheck; full `npm test` (352 files, 7180 passed, 1 skipped) before the final review fix, then the animal-snack rule tests (29 passed) after it; `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=8` passed, run again after the review fix (wrong food is 1 miss, too many plus the bell is 2 misses and 1 hint, an extra returns to its pile, the glow lands on the bell, 390x844 phone screenshots of all four scenes and a 1024x768 meadow, saved score 2/1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=8` passed (42.9 s).
**Not run:** `npm run build` (no shared files or assets changed), offline.
