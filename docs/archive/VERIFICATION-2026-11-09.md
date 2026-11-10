# Verification 2026-11-09 (archived entries)

## 2026-11-09 — Number Nook slice 6: level 7 The fifteen (PR #1432)

The seeded 4×4 starts exactly 30 slides from the goal. A 60,000-node exact search gives way to a route through the top row, left column and remaining 3×3. Tested `d3e8d3ca` plus the working diff.
Typecheck, build, scoped ESLint and Prettier, catalog generation and 22 Number Nook tests passed. The tests cover 25 exact starts, 90 detours that preserve completed borders, a hard fixture under 350 ms, and 87-unit upright and 102-unit sideways cells.
At `GAME_URL=http://localhost:5199`, `BROWSER_SUITE=numbernook NOOK_LEVELS=7` passed the refused tap, line slide, Undo and Start over, a 60-move detour, truthful fallback speech, one counted hint across two requests and one sticker. Reviewed the 768×1024 portrait. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=7` passed in 43.3 s.
PR CI caught a 843-character how-to card above the 840-character limit. Shortened two level 7 steps; focused how-to, catalog and barrel tests passed (25 passed, one skipped). The shared `howto` browser suite stopped at its unrelated controller count (23 expected, 26 found). An isolated probe confirmed the level 7 card, demo and 104/124-unit buttons fit in both orientations.
Fresh game review found no blocking issue. Offline and real-device touch and speech were not run.
