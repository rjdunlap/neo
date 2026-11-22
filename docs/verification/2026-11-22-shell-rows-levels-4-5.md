# 2026-11-22 — Shell Rows levels 4-5 (PR #2000)

**Changed:** Shell Rows levels 4 (*Two ways to win*) and 5 (*Play it out*), school 1–5; ten `sr.*` voice lines and nine new clips (184 KB); level-scoped how-to; the `shellrows` suite learned levels 4 and 5 behind `SHELL_LEVELS` (e.g. `SHELL_LEVELS=4,5`; default plays all). Tested at 8018302af plus a one-line nudge fix after review.
**Ran:** typecheck; full `npm test` (rule tests recount the level-4 pool: 24 classes, 17 with one fork square; wrong-square replies 48/19/9; level-5 rule-follower rates 31/51.5/17.4); `BROWSER_SUITE=shellrows SHELL_LEVELS=4,5` on an upright phone 390x844 (level 5 lost on purpose, rewound with 1 miss, then a tie), pass; `fingerdemo` `FINGER_ONLY=shell-rows FINGER_LEVELS=4,5 FINGER_BAND=school`, pass; build; `test:offline` against a preview, pass.
**Not run:** levels 1–3 browser play (unchanged code paths, unit tests cover them); batch `shell-rows 3` (not built).
