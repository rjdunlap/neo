# 2026-11-21 — Number Trails level 7, Ten and some more (PR #1945)

**Changed:** Number Trails level 7: PLANS row 7 draws 10 to 19, the 1 slides left and the second digit is traced beside it, display-only ten-frames (a second stacked frame for 11 to 19), school window 5 to 7, new voice lines `nt.teen`, `nt.ones`, `nt.ten`.
**Ran:** typecheck; `npm test` (463 files, 17380 passed, 1 skipped, 5 new rule tests); `BROWSER_SUITE=numbertrails NT_LEVEL=7` on a 390x844 upright phone viewport (drew 16: the 1, it slid aside, one wander = misses 1 hints 0, two frames at 128-unit cells, sticker; screenshots of the second digit and the frames reviewed, no page errors); `fingerdemo` (`FINGER_ONLY=number-trails FINGER_LEVELS=7 FINGER_BAND=school`, 14.0 s).
**Not run:** `npm run build` (no shared files or assets changed), other suites, offline.
