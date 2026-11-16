# 2026-11-15 — Peekaboo Barn level 15 Guess who (PR #1708)

**Changed:** Five two-clue questions with four animals each. One animal matches both, two match one each, and the last matches neither. Portrait displays two rows, and two misses light up the answer once. School now reaches level 15.

**Ran:** Typecheck, scoped ESLint and 39 Peekaboo Barn tests. The full local unit run passed 7,195 tests and hit an unrelated Bolt Boards timing assertion (21.2 ms against a 20 ms threshold). That test passed on an isolated retry. `originals` with `ORIGINALS_ONLY=peekaboo PEEK_LEVELS=15` passed at 390 × 844: five answers, both decoy replies, a tap during the ask that counted no miss, one glow hint, a saved score of two misses and one hint, and one sticker. Inspected the portrait screenshot. `fingerdemo` at level 15 in school finished in 20.9 seconds.

**Not run locally:** Production build, offline suite, and other browser suites.
