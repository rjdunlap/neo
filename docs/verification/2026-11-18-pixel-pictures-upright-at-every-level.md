# 2026-11-18 — Pixel Pictures upright at every level (PR #1809)

**Changed:** Pixel Pictures plays upright at levels 1–12. The 100-unit grid cells keep their size, the copy model sits above the board, the logic clues have room at the left, and the paint row clears the frame. Levels 11 and 12 use their existing bit-card layout.
**Ran:** Typecheck and 171 focused rule, layout and registry tests on the worktree based on `4d07d2ad3`. `BROWSER_SUITE=uprightsweep PHONE_ONLY=pixel-pictures PHONE_LEVELS=all PHONE_BANDS=all` at `http://localhost:5319` checked 12 levels at 390 × 844 with no flagged targets or page errors. Reviewed the contact sheet, including the grid-only levels recorded as “look.” The sweep uses the development override before the upright flag is set.
**Ran:** After setting `upright: true`, `BROWSER_SUITE=uprightgames PHONE_ONLY=pixel-pictures PHONE_BAND=school PHONE_LEVELS=6` at the same URL completed the color-clue round in 43 Chromium touches and awarded one sticker.
**Not run:** Local production build, offline, or other browser suites.
