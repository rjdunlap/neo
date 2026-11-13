# 2026-11-13 — Puzzle Pals level 8, one big piece at lap (PR #1611)

**Changed:** Puzzle Pals level 8, lap's first (order 8, 1, 2; entry level 8): one big piece, a touch anywhere hops it home, the next strip slides in; lap's opening line at levels 1 and 2 says tap, not drag.
**Ran:** typecheck; full `npm test` (6824 passed, one registry entry-level failure fixed with `entryLevels`, then puzzle-pals and registry tests re-run green, 53); `BROWSER_SUITE=fourth FOURTH_ONLY=puzzle PUZZLE_LEVELS=8,1` (level 8 at lap, upright 768x1024 and sideways: background, placed-piece, frame and far let-go touches, record [0,0], sticker; level 1 passed); `fingerdemo` `FINGER_ONLY=puzzle-pals FINGER_LEVELS=8 FINGER_BAND=lap` (3.8 s); a game-reviewer read with no hard findings.
**Not run:** build (no shared files or assets changed), offline, world.
