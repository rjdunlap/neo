# 2026-11-13 — Splish Splash hint accounting, slice 2 (PR #1624)

**Changed:** parts levels 3–8: the seven-second glow is free; the second counted miss on one question lights it and counts one hint. Two rule tests; the `early` bath loop asserts both.
**Ran:** `npm run typecheck` clean; `npx vitest run src/games/splish-splash` 15/15; `EARLY_ONLY=bath` passed levels 1–9 (level 3: second miss gives misses 2, hints 1, glow lit; level 4: a 7.6 s quiet wait before the wrong drag gives glow lit, 0 misses, 0 hints).
**Flake:** the first bath run, with the level-4 quiet wait placed after the wrong drag, scored an extra miss ([2, 0] for [1, 0]) at a level the output did not keep. The wait may have let the four-second nag gap lapse before scrubbing, so it was moved before the wrong drag; the repeat with the old order and the run with the new order both passed.
**Not run:** full `npm test`, build (no shared files or assets changed), `fingerdemo` (bot and demonstrated action unchanged).
