# 2026-11-24 — Brain Break levels 9-10 (PR #2099)

**Changed:** `brain-break` levels 9–10 (Smallest first, Below zero): rank model reused with `makeValues`, two new voice start lines with clips, `LEVELS.grownup.max` 10; levels 1–8 draw the same boards for the same seeds.
**Ran:** typecheck; rule tests for levels 9–10 (full `npm test` failed only on a stale how-to card length and voice clips, both fixed); `BROWSER_SUITE=brainbreak` at levels 1, 6, 8 and 10 (wrong taps, hint, portrait screenshot) passed; `fingerdemo` with `FINGER_ONLY=brain-break FINGER_LEVELS=10` passed in 45.7 s.
**Not run:** build, offline and other suites (no shared files changed).
