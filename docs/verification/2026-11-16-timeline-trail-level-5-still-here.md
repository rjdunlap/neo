# 2026-11-16 — Timeline Trail level 5 Still here (PR #1721)

**Changed:** `timeline-trail` level 5 Still here (school band 2–5): two later places (village green, bread oven) with `shows` on every stage, the still-here ribbon and three chips, two extra voice lines, how-to step, ghost finger; a review fix so turning the screen mid-drag no longer destroys the chip in hand.
**Ran:** `npm run typecheck`; the game's rule tests (32 pass, including 500 seeds of the "more is later" guess misplacing a card) and full `npm test`; `BROWSER_SUITE=timelinetrail` (level 5: one wrong gap, a free chip drop away from the ribbon, the grand chip then tapped again for one miss, Show a hint, portrait and landscape screenshots, still-here chip pinned; saved 2 misses, 1 hint; levels 2–4 still pass); `BROWSER_SUITE=fingerdemo FINGER_ONLY=timeline-trail FINGER_LEVELS=5`; `npm run build`.
**Not run:** `world`, `picnic`, couch and offline suites, the full finger-demo sweep.
