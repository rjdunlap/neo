# 2026-11-24 — Sudoku Garden lens above the thumb (PR #2134)

**Changed:** On a bed whose squares are under 44 CSS px (the 9 × 9 bed on an upright phone, 42.7 px), a finger on the bed shows the square under it in a ring above the thumb (its number, or its pencil marks), following the finger and going on lift; lifting chooses the square the finger ended on, so a press can slide to a neighbour. The bed keeps its size. The thumbs test lists the game as lensed, and the READY line is removed.

**Ran (2026-11-24, this Mac, `origin/main` plus the branch):** `npm run typecheck`; `npx vitest run src/games/sudoku-garden src/games/grownup-thumbs.test.ts` (69 passed); `BROWSER_SUITE=sudokutouch` against a dev server on http://localhost:5471 with `VITE_SPEECH=off` (passed, no page errors).

**Not run:** a screenshot of the lens itself (the suite's taps do not hold a finger down), `fingerdemo` (taps unchanged), full `npm test` and build here (CI runs them), a real phone.
