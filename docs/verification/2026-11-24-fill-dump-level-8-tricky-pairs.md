# 2026-11-24 — Fill Dump level 8, Tricky pairs (PR #2120)

**Changed:** Fill Dump level 8 (pre-K, new window `{5, 7, 8}`): three tall-thin against short-wide pairs 15–30% apart on level 7's capacity game, with a spoken line after each correct answer.
**Ran:** typecheck; vitest on `src/games/fill-dump`, `src/progress`, `src/content`; `BROWSER_SUITE=originals ORIGINALS_ONLY=fill FILL_LEVELS=7,8` (level 8: free guess, full pour, two wrong answers giving one hint, portrait screenshot, bot finishes three pairs, score [2,1]); `BROWSER_SUITE=fingerdemo FINGER_ONLY=fill-dump FINGER_LEVELS=8 FINGER_BAND=prek`. All passed.
**Not run:** `npm run build`; full suites.
