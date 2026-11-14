# 2026-11-14 — Word Monsters level 10 Last sound (PR #1652)

**Changed:** `word-monsters`: level 10 (the dive's level 9, renumbered because lap took 9), mode `last`: a pictured word is said, three monsters, she taps the one for its last sound; school window now 5, 6, 7, 8, 10; how-to step; the batch suite gained `MONSTER_LEVELS`.
**Ran:** typecheck; full `npm test` (351 files, 6,960 passed); `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=10` on a 390x844 phone portrait (two wrong taps then the glow, a picture tap not counted as a miss, saved score [2,1], screenshot `test-results/browser/batch/word-monsters-10-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=10` passed in 5.9 s.
**Not run:** `npm run build` (no shared files or assets changed), any other browser suite.
