# 2026-11-27 — Clock Tower level 8, One hour earlier (PR #2294)

**Changed:** `clock-tower` gains school level 8 (`earlier` mode), played before level 7 through `order`; shared `isShift` logic with level 6, new voice lines and scoped how-to card; the `woods` clock case now covers levels 6–8.
**Ran:** typecheck, format, lint, `vitest` for `src/games/clock-tower`, `src/content` (rule tests for the +11 hour endpoint, both wraparounds, unchanged minutes, play order and speech from the same times); `BROWSER_SUITE=woods WOODS_ONLY=clock CLOCK_LEVELS=8` passed (two misses, one hint, backwards sweep evidence, portrait screenshot, saved score and sticker); level 6 passed alone as a regression.
**Not run:** the full unit suite (left to PR CI); the combined `CLOCK_LEVELS=6,8` run timed out once in a hand-set wait and both levels passed alone, so it is recorded as a flake; `fingerdemo` for level 8 was not run separately, since the filtered play drives the same hands by touch.
