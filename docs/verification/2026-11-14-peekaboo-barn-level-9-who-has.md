# 2026-11-14 — Peekaboo Barn level 9 Who has…? (PR #1688)

**Changed:** Peekaboo Barn level 9 (mode `clue`, opens school 9–9, prek 6–9): find the one of three animals a feeling or part clue describes; a wrong tap says a true fact about that animal; two misses wiggle the right cover. How-to step for level 9.
**Ran:** `npm run typecheck`; `npm test` (351 files, 7123 tests; six new rule tests in `logic.test.ts`: a unique holder over 400 seeds × 5 questions, part words from `CRITTERS`, asks never name the answer); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=9` (two wrong taps, wiggle hint, score 2/1, sticker, asks by clue only; the suite now expects 10 history entries); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaboo-barn FINGER_LEVELS=9` (20.4 s); a 390×844 phone-portrait probe (sleepy bear's closed eyes and cow's floppy ears readable; the places sit small along the bottom under a mostly empty sky, as at every level).
**Observation:** extending the find-mode R4 timing check to clue mode once read one question at 2.6–5 s (typically 2.1 s, bound 2.6 s); a direct probe of 20 questions never reproduced it, so the R4 check stays find-only.
**Not run:** `npm run build` (no shared files or assets changed); offline; other suites.
**Coverage row:** `Peekaboo Barn content and cover support (originals, fingerdemo)` in [the summary](../VERIFICATION.md#coverage-summary).
