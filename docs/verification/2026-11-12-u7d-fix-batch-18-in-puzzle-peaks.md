# 2026-11-12 — U7d fix batch 18 in Puzzle Peaks (PR #1558)

**Changed:** Peekaround Island levels 1–8, Penguin Slide level 11 and Rule Machine levels 3–5 open the next move during spoken feedback. The guide can say a waiting question in Peekaround Island and Rule Machine.

**Ran:** `npm run typecheck`; 114 focused tests across the three games; `woods` with `WOODS_ONLY=peek` at levels 2 and 5 and `WOODS_ONLY=penguin` at level 11; `rulemachine` with `RM_LEVELS=3,4,5`. Each browser play asserted that the next move was available before a four-second test delay on its feedback expired. The `fingerdemo` suite completed Peekaround Island levels 5 and 8, Penguin Slide level 11 and Rule Machine level 5. Browser checks used the speech-off development server.

**Not run locally:** full unit suite, production build or offline suite. Real speech timing was outside these checks.
