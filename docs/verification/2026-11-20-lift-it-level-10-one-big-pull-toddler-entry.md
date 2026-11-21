# 2026-11-20 — Lift It level 10, One big pull (toddler entry)

**Changed:** level 10 (plan id 10, `LEVELS.toddler` 10–10, `entryLevels` [10], toddler added to the bands), voice line `lift-it.instruct-one-pull`, how-to entries, rule tests, `liftit` browser case.
**Ran:** typecheck; vitest `src/games src/content src/progress src/app` (399 files, 16616 tests, including registry, lands and how-to tests); `BROWSER_SUITE=liftit FROM_LEVEL=10`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=lift-it FINGER_LEVELS=10`. All passed.
**Not run:** `npm run build` (game files only), offline, the full `liftit` suite for the older levels.
