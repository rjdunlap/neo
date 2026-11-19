# 2026-11-19 — Day by Day upright on phones (PR #1846)

**Changed:** Both scenes use pure view layouts. Upright play fits all seven full-size records in two rows, including each Weather Window tab. The week-turn path follows the calendar when it reflows. A short view sets the answer row above the caption bubble and the confirmation arrow beside it.
**Ran:** Typecheck, 106 focused tests (including every level across six upright views, the short caption and the sideways fixtures), scoped lint and format, generated game metadata, links and diff. Baseline `uprightsweep` flagged all seven levels at 390 × 844.
**Ran:** Stock `uprightgames` completed pre-K level 1 with one sticker. The school pass timed out on level 2 after 25 valid touches at the 120-second deadline. A Chromium rerun with shortened muted speech waits completed all seven levels with real touches and one sticker each. Reviewed screenshots from each level. At 390 × 625, Weather Window with ordinary speech timing and captions retained the Week B mark through rotation, then recorded two misses, one hint and one sticker.
**Not run locally:** Production build, offline and separate `fingerdemo` suite.
