# 2026-11-23 — Shadow Play levels 1–2 (PR #2035)

**Changed:** New grown-up game `shadow-play` in Lantern Lake (Tinker Lab, space): place three cut-outs between a lamp and a screen so their shadow fills the outline. Levels 1–2, with the clip prefix `shadow` added to `scripts/voice-clips/clips.mjs`.

**Ran (2026-11-23, this Mac, commit 4d737cc95 plus docs):** typecheck, format check, lint, `npm test` (488 files, 18,051 tests, all passing). The game's own 29 tests re-derive the pool counts 44,496 and 30,516 by brute force and cover the scale at each mark, each shape's part, both filters, the only accepted arrangement, a wrong arrangement always naming a rail, the hint walk, miss counting, the rail layout and voice coverage of 306 lines. `npm run build` (precache 6,653 entries).

**Ran in Chromium (headless):** `BROWSER_SUITE=shadowplay` at 390 × 625 with captions via the Lantern Lake page route: level 1's two boards by drag and by tap with 0 misses; level 2 a wrong Light counted once, lit again free, Help twice counted once, rotation kept the arrangement and hint, one sticker per round, return to the same land page. `BROWSER_SUITE=fingerdemo` for `shadow-play` at levels 1 and 2 passed (3.5 s and 9.1 s). Upright screenshot looked at (not committed).

**Not run:** the offline suite, `world`, any other browser suite.
