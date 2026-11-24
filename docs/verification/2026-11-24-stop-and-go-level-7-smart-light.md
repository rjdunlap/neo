# 2026-11-24 — Stop and Go level 7 Smart light (PR #2102)

**Changed:** Stop and Go level 7, Smart light (school window 7–7): three rule cards per crossing, `simulate()` in `logic.ts`, scene `SmartLight` in `smart.ts`, shared drawing split into `art.ts`; 10 new voice clips.
**Ran:** typecheck, eslint, full `npm test` (200-seed rule tests and generated docs pass); `BROWSER_SUITE=woods WOODS_ONLY=go FROM_LEVEL=7` (two wrong cards give 2 misses and a glow, then 3 crossings clear, score [2,1]); `fingerdemo` at level 7 school (16.8 s); one landscape screenshot reviewed.
**Not run:** build, offline, a portrait screenshot (the game uses the sideways layout, not upright-ready).
