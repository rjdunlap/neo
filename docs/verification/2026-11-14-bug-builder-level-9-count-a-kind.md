# 2026-11-14 — Bug Builder level 9 Count a kind (PR #1675)

**Changed:** a new Bug Builder level 9 (count mode with a kind sign: one color or one shape, a tray of four stamps with two of the kind, wrong-kind stamps refused with a miss and a naming line, bot, how-to); pre-K order is now 4, 5, 8, 9, 6, 7. A review fix made shape-sign marks filled.
**Ran:** `npm run typecheck`; full `npm test` (351 files, 7,053 passed, 1 skipped) after `npm run game-docs`; bug-builder rule tests (20); `BROWSER_SUITE=expansion EXPANSION_ONLY=bug BUG_LEVELS=9` at 390×844 (two wrong kinds = 2 misses and 1 hint with the tray glow, the kind counted, check finishes, saved [2,1], a sticker; portrait screenshot `test-results/browser/expansion/bug-builder-9-portrait.png` of a shape sign, reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=bug-builder FINGER_LEVELS=9` finished in 9.7 s.
**Not run:** `npm run build` (no shared files or assets changed; PR CI runs it), other suites, offline.
