# 2026-11-15 — Frog Hop couch reaches levels 7–10 (PR #1700)

**Changed:** the Frog Hop couch trip's stops now play levels 3, 5, 7, 8, 11 and 12 (was 3, 3, 4, 5, 6, 6), with five couch voice-line swaps and a `COUCH_ONLY=frog-hop` block in the `couchgames` suite.
**Ran:** `npm run typecheck`; `npx vitest run src/couch src/content src/games/frog-hop` (31 files, 310 tests); `BROWSER_SUITE=couchgames COUCH_ONLY=frog-hop` (stops 2–5 played from the real table, plan mode asserted at each, one wrong landing at stop 5, child's save untouched).
**Not run:** full `npm test`, build, full `couch`/`couchcourse`, offline and a screenshot (not needed at the couch-catalog tier).
