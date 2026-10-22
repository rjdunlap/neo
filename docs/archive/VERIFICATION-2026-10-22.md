# Verification 2026-10-22 (archived entries)

## 2026-10-22 — Stop and Go varied phases and vehicles (slice 2)

- [PR #751](https://github.com/rjdunlap/neo/pull/751), `claude/stop-and-go-phases`, code `ff052b90`; `src/games/stop-and-go/` only: seeded green and red phases (`cycleFor`), six code-drawn vehicles, sticker pool, headlamp blink scaled about its centre. No rule, voice or how-to change.
- Passed `npm run typecheck`; `npx vitest run src/games/stop-and-go` (11 tests, including 400 seeds bounding each phase, a non-green stretch under 6 s, the hand finishing send and walk, all six vehicles reachable).
- Passed at http://localhost:5743 (Vite `--strictPort`, the tree of that commit): `BROWSER_SUITE=woods WOODS_ONLY=go FROM_LEVEL=2` levels 2, 3 and 4 (misses, glow hint, saved score and sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=stop-and-go FINGER_LEVELS=2` finished in 12.1 s. A portrait 768x1024 probe screenshot at levels 4 and 2 (`test-results/stop-and-go-vehicles.png`, not committed) showed digger, car, bike, van, tractor and bus legible, with faces and no overlap in the queue.
- Not run: full `npm test` and build (no shared files changed; CI runs both), device and child checks (vehicle readability on an iPad is open).
