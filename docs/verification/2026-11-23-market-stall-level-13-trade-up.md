# 2026-11-23 — Market Stall level 13, Trade up (PR #2086)

**Changed:** Added equal-value coin exchanges, Undo, a fixed-total slate and hints for the next useful exchange or Undo. The level sits between 11 and 12 in school order.
**Ran:** On `e3399d5ef` plus the working diff, typecheck, 212 focused tests (one skipped), scoped lint and format, production build and the precache check for all four new Kokoro clips passed.
**Browser:** `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=13 GAME_URL=http://127.0.0.1:5293` passed at 390 × 625 in touch-enabled Chromium. Checked a full opening heap, free invalid Trade, early bells, Undo on a stuck eight-shell heap, selection through rotation, the final heap lock and one sticker with zero misses and two hints. Reviewed the portrait screenshot.
**Ghost finger:** `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=13 FINGER_BAND=school` finished in 48.9 s before the final awning placement adjustment.
**Not run:** Offline play and the full `woods` suite.
