# 2026-11-14 — Bug Builder level 8 Count the spots (PR #1672)

**Changed:** a new Bug Builder level 8 (count mode: bare bug, count sign, any stamp in any place, lift-off tap, check button, bot, how-to step); preschool and pre-K order windows gain it.
**Ran:** `npm run typecheck`; full `npm test` (351 files, 7,038 passed); `BROWSER_SUITE=expansion EXPANSION_ONLY=bug BUG_LEVELS=8` at 390×844 (off-bug drop free, over-count with no miss, a second stamp on a filled place ignored, two wrong checks = 2 misses and 1 hint with the extra stamp glowing, lift-off by tap, right check finishes, saved [2,1], a sticker; portrait screenshot `test-results/browser/expansion/bug-builder-8-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=bug-builder FINGER_LEVELS=8` finished in 7.7 s.
**Not run:** `npm run build` (no shared files or assets changed; PR CI runs it), other suites, offline.
