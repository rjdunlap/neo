# 2026-11-20 — Robot Path level 15 A routine (PR #1919)

**Changed:** Robot Path level 15 for school (bands 4–15; prek, preschool and couch unchanged): two-row routine editor, call tile, two corridors, Undo, one-edit hints, ghost finger, `routineLayout`, registry level-range fix.
**Ran:** typecheck; full `npm test` (after the registry fix and `npm run game-docs`); `BROWSER_SUITE=robot FROM_LEVEL=15 TO_LEVEL=15` (free incomplete tries, Undo, two bump misses, glow, rotation 768x1024 and 1024x768 keeping both rows, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=robot-path FINGER_BAND=school FINGER_LEVELS=15` (6.6 s). Chrome automation only.
**Not run:** build, offline, other suites; caption-on screenshots (layout unit-tested at upright views including the captioned view). Gap: "first board on entry" from the packet was not built.
