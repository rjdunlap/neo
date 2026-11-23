# 2026-11-23 — Shadow Play levels 3–4 (PR #2038)

**Changed:** Shadow Play adds turns and chip swaps in Lantern Lake. Direct touch on the numbered marks slides the cut-outs at the turning levels. Swaps carry both settings and Help clears a prior selection before identifying the two chips. A cancelled or rotated drag keeps the committed arrangement. The 88-unit turn area is 44.7 CSS px on the measured upright phone, and the swap chips are 100 units.

**Ran (base 6472492cd plus this PR's changes):** Typecheck, 118 focused tests across the rule, layout, voice, registry, lands, how-to and voice asset checks, generated game docs, scoped formatting and lint, links and diff. Tests reproduced the 51,627 and 38,050 unique-board pools. An independent 96-column enumeration reproduced both totals and walked 114,688 starts without undoing an earlier solved rail. The production build passed and precached all 86 new Kokoro clips.

**Ran in Chromium at `http://127.0.0.1:5241`:** `BROWSER_SUITE=shadowplay` reached levels 1–4 through Lantern Lake at 390 × 625 with captions, then rotated to 625 × 390 and back. Level 3 checked a cancelled drag and a sideways numbered-mark tap next to the handle. Level 4 checked clearing a chip, a repeated wrong Light, two Help taps counting once, a selected chip surviving rotation, and a swap carrying a turned piece and its mark. Each level awarded one sticker and returned to its land page. Reviewed the level 4 portrait screenshot. `BROWSER_SUITE=fingerdemo FINGER_ONLY=shadow-play FINGER_BAND=grownup FINGER_LEVELS=4` passed in 7.8 s.

**Not run locally:** The full unit suite, standalone offline play and other browser suites.
