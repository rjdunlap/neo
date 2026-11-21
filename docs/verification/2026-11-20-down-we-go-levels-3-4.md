# 2026-11-20 — Down We Go levels 3-4 (PR #1918)

**Changed:** `down-we-go` levels 3-4 (clear and cloudy coves with a free prediction and a logbook; a covered dial with three dial cards, each knot leaves half): rules, layout, art, voice, how-to, browser case; school band now 2-4, pre-K unchanged.
**Ran:** typecheck; unit tests for `src/games/down-we-go` and `src/content` (266 passed); `npm run build`; `BROWSER_SUITE=downwego` (level 3: other prediction first, free; level 4: free first wrong card, one counted wrong, right cards) with screenshots. Levels 1-2 parts of the suite passed in an earlier run of the same code.
**Not run:** `fingerdemo` at level 4; a screenshot re-check after the logbook moved to x=118 and the dial cards got a dark blue fill; the offline suite.
