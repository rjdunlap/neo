# 2026-11-23 — Brain Break levels 7-8 Count by (PR #2091)

**Changed:** `brain-break` levels 7–8 (Count by): `Trail` model, rule sign, count-back, voice lines, `LEVELS.grownup.max` 8; levels 1–6 draw the same boards for the same seeds.
**Ran:** typecheck; vitest `src/games/brain-break`, `src/content`, `src/games/registry` (pass after `npm run game-docs`); `BROWSER_SUITE=brainbreak` extended to level 8 (wrong taps, auto hint, sign names a rule not a rank, labels fit, portrait screenshot, one sticker) passed; `fingerdemo` with `FINGER_ONLY=brain-break FINGER_LEVELS=8` passed in 45 s.
**Not run:** build, offline and other suites (no shared files changed).
