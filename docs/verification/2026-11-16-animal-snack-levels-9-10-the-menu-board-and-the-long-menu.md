# 2026-11-16 — Animal Snack levels 9-10 The menu board and The long menu

**Changed:** `animal-snack` levels 9 and 10 (the menu board, `board` plans, `boardLines` and `boardBox`, three voice lines, how-to lines, `LEVELS.school` 8–10 and `school` in `bands`, the `woods` suite's level 9–10 branch).
**Ran:** typecheck; vitest for `src/games/animal-snack` and `src/content` (236 passed); `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=9 TO_LEVEL=10` passed (levels 9 and 10, free line reading, the 390×844 board fit); `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=9,10 FINGER_BAND=school` passed.
**Not run:** `npm run build` (no shared files or assets changed), other suites.
