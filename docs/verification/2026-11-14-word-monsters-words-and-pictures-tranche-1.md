# 2026-11-14 — Word Monsters words and pictures tranche 1 (PR #1649)

**Changed:** `word-monsters`: `WORDS` (levels 5–6) 7 to 19 words, `FAMILIES` (level 7) 5 to 8 (`en`, `et`, `ug` added), 24 new code-drawn pictures in `pictures.ts` (a typed record, so a missing picture fails typecheck), the level 7 sun now shown; rule tests for vowel balance, families and a picture for every asked word.
**Ran:** typecheck; eslint and prettier on the game; full `npm test` (351 files, 6,951 passed, 1 skipped); `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-monsters FINGER_LEVELS=5,7` passed (level 5 31.4 s, level 7 34.3 s); headless screenshot sheet of all 43 pictures, reviewed (borrowed pictures at half size, mop head behind its bucket and hop arc behind the frog fixed, then re-rendered and checked).
**Not run:** `npm run build` (no shared files or assets changed), any other browser suite, device speech.
