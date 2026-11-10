# Verification 2026-11-10 (archived entries)

## 2026-11-10 — Sand Table level 4 *Where did it go?*, earth-materials E4

Changed: `sand-table` level 4 (school {3,4}): breeze rule and answers in `logic.ts`, scene, art, 13 voice lines, how-to, `sandtable` suite extended; reviewer fixes (pads ignore taps during a puff, ticks, no stale glow line after Start again).
Ran: `npm run typecheck`; `npm test` (332 files, 6388 passed, 1 skipped; rerun after the reviewer fixes); `BROWSER_SUITE=sandtable` (levels 1, 3, 4; level 4 portrait: tray tap before the puff, Breeze, one wrong pad, dotted-path hint, right pad, saved 1 miss / 1 hint; portrait screenshot after the puff); `fingerdemo` at level 4 school (6.6 s); `npm run build`. Source check repeated, unchanged.
Not run: browser play after the reviewer fixes, offline, device speech, iPad, a child.

## 2026-11-10 — Frog Hop Fraction Landings levels 9–10, fractions R3 (PR #1449)

Changed: `frog-hop` levels 9 `frac-hop` and 10 `frac-match` (school only, school now 3–10, no `order`), skill `fractions`, rules in `logic.ts`, new voice lines, how-to, `woods` hop range to level 10.
Ran: `npm run typecheck`; `npm test` (332 files, 6396 passed; typecheck plus the frog-hop and content tests again after a final voice-line tweak); `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=9,10` (level 9: two wrong pads, the hint, five answers; level 10: one wrong pad, the flag, two wrong cards, the hint, score [3,1]; landscape and portrait screenshots of 10); `BROWSER_SUITE=fingerdemo FINGER_ONLY=frog-hop FINGER_LEVELS=9,10 FINGER_BAND=school`.
Not run: `npm run build` (no shared src file changed), couch, world, offline, device speech of the fraction words, an iPad, a child.
