# 2026-11-24 — Jelly Drums level 11, Backwards (PR #2112)

**Changed:** Jelly Drums level 11, Backwards (pre-K 5–9 and 11, school 8, 9 and 11): each tune played back last note first, with a rewind arrow and two new voice clips.
**Ran:** typecheck; full `npm test` (passes, after rendering the two new clips); the new Backwards rule-test block; `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` levels 1–11 (level 11 screenshot checked, arrow visible); `BROWSER_SUITE=fingerdemo FINGER_ONLY=jelly-drums FINGER_LEVELS=11 FINGER_BAND=prek`.
**Not run:** build, offline, other suites.
