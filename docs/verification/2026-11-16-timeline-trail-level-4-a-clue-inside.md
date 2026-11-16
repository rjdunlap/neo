# 2026-11-16 — Timeline Trail level 4 A clue inside (PR #1709)

**Changed:** `timeline-trail` level 4 A clue inside (the shore and the tree on one line, a little round picture of the other place on every card, `fittingGaps`/`compareFaces`, merged-line flipbook, `trail.instruct.4` and `trail.clue`, how-to step, bands pre-K 1–4 and school 2–4, the 'the an empty shore' caption fix, the `timelinetrail` suite extended).
**Ran:** `npm run typecheck`; `npm test` (353 files, 7211 passed, 1 skipped); `BROWSER_SUITE=timelinetrail` (level 4: two wrong gaps lighting the gap, 2 misses and 1 hint; a free tap on a clue card; portrait screenshot `timeline-trail-4-portrait`; finish saved 2/1) passed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=timeline-trail FINGER_LEVELS=4` passed (8.3 s, pre-K).
**Not run:** `npm run build` (no shared files or assets changed), other suites, the offline check.
