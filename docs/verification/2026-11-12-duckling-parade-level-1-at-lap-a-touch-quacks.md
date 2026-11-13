# 2026-11-12 — Duckling Parade level 1 at lap: a touch quacks (PR #1593)

**Changed:** `duckling-parade` level 1 at lap only: Mama quacks and hops at every touch-down anywhere; one duckling waits at the start and each next one pops out 0.6 s after the one before joins (`nextToShow`); the fifteen-second glow counts no hint at lap. Toddler's level 1 is unchanged. The `arcade` suite's parade loop takes `PARADE_BAND` and `ARCADE_ONLY=parade`, and at lap asserts one duckling out, a quack from a sky tap, the glow with 0 hints and each next duckling coming out.
**Ran:** `npm run typecheck`; `npx vitest run src/games/duckling-parade` (15 passed); `BROWSER_SUITE=arcade ARCADE_ONLY=parade ARCADE_LEVELS=1` at lap (saved [0,0], one sticker); the same with `PARADE_BAND=toddler` (saved [0,0]).
**Not run:** full `npm test` (CI runs it); `npm run build` (no shared files or assets changed); `fingerdemo` (the card's demonstrated action is unchanged).
