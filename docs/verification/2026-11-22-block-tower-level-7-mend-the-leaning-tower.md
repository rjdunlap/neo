# 2026-11-22 — Block Tower level 7 Mend the leaning tower (PR #1991)

**Changed:** Block Tower level 7 (school, order 5, 7, 6): mend rules and tasks in `logic.ts`, the ropes screen in `index.ts`, four new voice lines with four rendered clips (about 104 KB), how-to card, ghost-finger bot, upright walk. Task T3 is `[0,3,9]`, not the definition's `[0,4,5]`.
**Ran:** typecheck, `npm test` (471 files), lint, prettier check, `npm run build`, `npm run test:offline` against a preview server; `BROWSER_SUITE=shortlist SHORTLIST_ONLY=tower FROM_LEVEL=7 TO_LEVEL=7` (let go before a move, cancelled drag, two unscored tumbles with replay, Try again and undo, glowing place, both mended; 0 misses, 1 hint, one sticker; portrait screenshots); `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-tower FINGER_LEVELS=7 FINGER_BAND=school` (12.5 s).
**Not run:** other browser suites (not affected).
