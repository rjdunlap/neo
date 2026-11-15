# 2026-11-14 — Lemonade Stand level 6 Best buy (PR #1685)

**Changed:** `lemonade-stand` level 6 *Best buy* (`PLANS[5]`, `RATE_OFFERS`, rate wrong-boat and help lines, two-row sign, level-6 how-to step); school max 6.
**Ran:** typecheck; the game's rule tests (6 new level-6 tests, 34 in the file) plus content and registry tests; `BROWSER_SUITE=woods WOODS_ONLY=lemon FROM_LEVEL=6` passed on a 390x844 phone portrait viewport with a pinned 2-for-2 against 6-for-3 morning (six lemons read as two rows of three); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lemonade-stand FINGER_LEVELS=6` passed.
**Not run:** `npm run build` (no shared files or assets changed), offline, the full unit suite.
**Note:** on phone portrait the jetty boats are drawn small (the level-5 layout, unchanged); a candidate for a later phone polish note.
