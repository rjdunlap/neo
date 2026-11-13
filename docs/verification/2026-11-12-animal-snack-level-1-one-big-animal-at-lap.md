# 2026-11-12 — Animal Snack level 1: one big animal at lap

**Changed:** `animal-snack` level 1 (lap only, the `oneBig` plan) opens with one big animal; a touch anywhere feeds the nearest animal, a touch while it eats or friends walk in only squishes with a tick and counts nothing, and two friends walk in after the second and fourth snacks (six snacks finish); new line `snack.big` (device speech, no rendered clip); the level 1 how-to step is rewritten. The `woods` snack case gained a level 1 play and a `TO_LEVEL` filter.
**Ran:** `npx tsc --noEmit` (clean); vitest `src/games/animal-snack`, `src/content`, `src/progress` (371 passed, 1 skipped); `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=1 TO_LEVEL=1` PASS twice (before and after the big animal grew from scale 0.95 to 1.1) with a 390×844 portrait screenshot `animal-snack-1-portrait`.
**Checked by typecheck and rule tests only:** the re-layout after a walk-in (a resize mid-walk leaves no animal off-screen), not a browser rerun.
**Not run:** `npm run build` (no shared files or assets changed), `fingerdemo` (the ghost finger still taps an animal), offline.
