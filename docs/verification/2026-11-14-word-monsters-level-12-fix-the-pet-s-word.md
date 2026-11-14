# 2026-11-14 — Word Monsters level 12 Fix the pet’s word (PR #1666)

**Changed:** School level 12. Find and lift one wrong letter from the pet’s word, then replace it. Three pictured word pairs cover the first, middle and last slots in shuffled order.
**Ran:** Typecheck and 68 focused tests, including 300 seeded rounds. `BROWSER_SUITE=batch BATCH_ONLY=monsters MONSTER_LEVELS=12` at 390×844 verified free replay and first check, two misses before the lift hint, an occupied-slot drop and a wrong replacement, all three repairs, saved [3,1] and a sticker. Screenshot at `test-results/browser/batch/word-monsters-12-portrait.png`. `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=12` finished in 21.0 s with zero misses and hints.
**Not run locally:** Full unit suite and production build (PR CI), other browser suites and offline.
