# 2026-11-14 — Word Monsters level 11 Say it slowly (PR #1661)

**Changed:** `word-monsters`: level 11, mode `slow`: level 6's drag into three empty boxes with only the word said; a box-row tap says each sound (one hint per word); school window now 5, 6, 7, 8, 10, 11; how-to step.
**Ran:** typecheck; Word Monsters rule tests and `src/content` tests (214 passed, 1 skipped); `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=11` on a 390x844 phone portrait (two wrong drops then the glow, a picture tap not a miss or hint, a box tap twice counted one hint, saved score [2,2], screenshot `test-results/browser/batch/word-monsters-11-portrait.png`), rerun after the review fix; `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=11` passed in 33.3 s.
**Not run:** `npm run build` (no shared files or assets changed), full `npm test` (CI runs it), any other suite.
