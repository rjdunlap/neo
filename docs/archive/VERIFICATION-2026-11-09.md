# Verification 2026-11-09 (archived entries)

## 2026-11-09 — Number Nook slice 6: level 7 The fifteen (PR #1432)

The seeded 4×4 starts exactly 30 slides from the goal. A 60,000-node exact search gives way to a route through the top row, left column and remaining 3×3. Tested `d3e8d3ca` plus the working diff.
Typecheck, build, scoped ESLint and Prettier, catalog generation and 22 Number Nook tests passed. The tests cover 25 exact starts, 90 detours that preserve completed borders, a hard fixture under 350 ms, and 87-unit upright and 102-unit sideways cells.
At `GAME_URL=http://localhost:5199`, `BROWSER_SUITE=numbernook NOOK_LEVELS=7` passed the refused tap, line slide, Undo and Start over, a 60-move detour, truthful fallback speech, one counted hint across two requests and one sticker. Reviewed the 768×1024 portrait. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=7` passed in 43.3 s.
PR CI caught a 843-character how-to card above the 840-character limit. Shortened two level 7 steps; focused how-to, catalog and barrel tests passed (25 passed, one skipped). The shared `howto` browser suite stopped at its unrelated controller count (23 expected, 26 found). An isolated probe confirmed the level 7 card, demo and 104/124-unit buttons fit in both orientations.
Fresh game review found no blocking issue. Offline and real-device touch and speech were not run.

## 2026-11-09 — Jar Sort slices 4–5: levels 11 and 12 (PR #1433)

Level 11 uses three cups and an exact picture goal. Level 12 moves the matching run at the top of a jar, up to the receiving jar's capacity. Tested `a4095493` plus the working diff.
Typecheck, 17 Jar Sort rules, the full unit suite (329 files, 6307 passed, 5 skipped), scoped formatting and lint, link checks and build passed. An independent exact search agreed on the shortest length of all 36 new puzzles.
At `GAME_URL=http://localhost:5193`, `BROWSER_SUITE=jarsort JAR_SORT_LEVELS=11,12` passed two full-cup refusals and one hint, both picture boards, a full run moved in one action, undo and one sticker per round. Reviewed the 768×1024 level 11 portrait.
`BROWSER_SUITE=fingerdemo FINGER_ONLY=jar-sort FINGER_LEVELS=11,12 FINGER_BAND=school` finished in 12.9 and 31.0 demo seconds. The new voice lines describe only the on-screen rules and use device speech. Offline, iPad touch and speech, and child play were outside the checks run.
