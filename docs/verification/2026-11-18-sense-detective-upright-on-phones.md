# 2026-11-18 — Sense Detective upright on phones (PR #1823)

Sense Detective plays upright at levels 1–5. The exhibit layout reserves space for the toy cards, replayable clues, the ear that appears at level 4, and the two sense choices at level 5. Look clears the question mark at every level. The scene uses the layout's target sizes for hit areas, and a falling clue or returning parcel settles in its current slot after rotation.

- The baseline `BROWSER_SUITE=uprightsweep PHONE_ONLY=sense-detective PHONE_BANDS=all` on `140f9b946` found Look encroaching on Help at levels 2 and 4. All five levels opened.
- Typecheck and 80 focused tests passed (one skipped), including every level across seven views and the later clue and response layouts. Scoped ESLint and formatting passed.
- At `GAME_URL=http://localhost:5193`, `BROWSER_SUITE=uprightgames PHONE_ONLY=sense-detective PHONE_SHOTS=1` passed with `PHONE_BAND=prek PHONE_LEVELS=1` and `PHONE_BAND=school PHONE_LEVELS=2,3,4,5`. All five levels finished by Chromium touch at 390 × 844 and awarded one sticker each (3, 4, 7, 7 and 8 touches). Reviewed screenshots at every level, including level 4's ear and level 5's two choice cards.
- A level 4 Chromium touch probe rotated from 844 × 390 to 390 × 844 as the first clue dropped. The clue landed in the portrait slot. Both replays, the revealed ear, a wrong Check, a requested hint and completion worked. The saved round recorded one miss, one hint and a Sense Detective sticker.
- Local production build, offline and separate ghost-finger suites were skipped. The touch runs used the ghost finger's moves as input coordinates.
