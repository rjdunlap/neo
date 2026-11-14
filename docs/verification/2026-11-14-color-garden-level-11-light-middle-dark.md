# 2026-11-14 — Color Garden level 11 Light, middle, dark (PR #1664)

**Changed:** `color-garden`: level 11, three baskets of one color's tones (blue, red, green or purple per round), 9 balloons and flowers; tones from the palette; level 7's two blues keep their look; pre-K window now 4, 5, 6, 7, 8, 11.
**Ran:** typecheck; full `npm test` (351 files); Color Garden rule tests (every tone present, one hue, all four hues across seeds, adjacent-tone contrast at least 1.5, each item nearest its own basket, level 7 fixed-seed deal pinned); `BROWSER_SUITE=originals ORIGINALS_ONLY=garden GARDEN_LEVELS=11` (two wrong drops then the glow hint, score [2,1]); `BROWSER_SUITE=fingerdemo FINGER_ONLY=color-garden FINGER_LEVELS=11` at pre-K (33 s); one portrait screenshot; `game-reviewer` found no defects.
**Not run:** `npm run build` (no shared files or assets changed), any other suite.
