# 2026-11-12 — Draw the Pattern level 1: a touch anywhere draws (PR #1585)

**Changed:** `draw-the-pattern` level 1 (toy-test P4): a touch anywhere except the picture draws at the nearest place on the paper (`toPaper`, `PAPER_INSET`), a drag off the paper runs along its edge, and a touch during the pet's turn or a strip's flight rings a bell and puffs stars without counting; the how-to card line and the `drawpattern` suite's level 1 follow. Levels 2 and up unchanged.
**Ran:** `npm run typecheck`; `npx vitest run src/games/draw-the-pattern` (49 passed); `BROWSER_SUITE=drawpattern DRAW_LEVELS=1 npm run test:browser` (Playwright headless, PASS: a tap during the pet's turn answered and uncounted, a tap off the paper made one mark and one lift); `npm run game-docs` (no changes).
**Not run:** `fingerdemo` (the demonstrated action is unchanged), `npm run build` (no shared files), other levels.
