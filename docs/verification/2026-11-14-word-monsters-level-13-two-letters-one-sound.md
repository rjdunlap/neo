# 2026-11-14 — Word Monsters level 13 Two letters, one sound (PR #1681)

**Changed:** Word Monsters level 13 (mode `team`): a team monster wearing two letters (sh, ch, th, ck) fills one sound box; nine words, four new pictures, new voice lines, one how-to step; the team's touch area hugs its body (review fix).
**Ran:** `npm run typecheck`; `npm test` (351 files pass); `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=13` passed (390x844 phone portrait: two misses, a hint, the box-tap hint, placed monsters do not overlap, screenshots at 390x844, 844x390 and 1024x768 plus the team in its box); `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=13 FINGER_BAND=school` passed in 33 s.
**Not run:** `npm run build` (no shared files or assets changed); offline.
**Coverage row:** `batch` in [the summary](../VERIFICATION.md#coverage-summary).
