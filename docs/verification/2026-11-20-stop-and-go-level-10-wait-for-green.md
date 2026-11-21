# 2026-11-20 — Stop and Go level 10, Wait for green (PR #1923)

**Changed:** toddler level 10 (mode `wait`, `WAIT_PLAN`): one car, a two-lamp light on seeded 4–5 s phases, a red tap a rumble and `go.wait`, never a miss or hint; toddler order `[1, 10, 2]`, `entryLevels: [9, 10]`; voice, how-to card, rule tests, browser case.
**Ran:** typecheck; vitest for `src/games/stop-and-go`, `src/content`, registry and `src/progress` (440 passed); `BROWSER_SUITE=woods WOODS_ONLY=go FROM_LEVEL=9` (levels 9 and 10 passed, headless, port 5617); one 4:3 screenshot.
**Not run:** `npm run build`; `fingerdemo` (the ghost finger reuses the car-at-front-until-green logic through `GO_TARGET.wait = 'car'`); offline.
