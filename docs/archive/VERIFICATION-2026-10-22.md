# Verification 2026-10-22 (archived entries)

## 2026-10-22 — Stop and Go varied phases and vehicles (slice 2)

- [PR #751](https://github.com/rjdunlap/neo/pull/751), `claude/stop-and-go-phases`, code `ff052b90`; `src/games/stop-and-go/` only: seeded green and red phases (`cycleFor`), six code-drawn vehicles, sticker pool, headlamp blink scaled about its centre. No rule, voice or how-to change.
- Passed `npm run typecheck`; `npx vitest run src/games/stop-and-go` (11 tests, including 400 seeds bounding each phase, a non-green stretch under 6 s, the hand finishing send and walk, all six vehicles reachable).
- Passed at http://localhost:5743 (Vite `--strictPort`, the tree of that commit): `BROWSER_SUITE=woods WOODS_ONLY=go FROM_LEVEL=2` levels 2, 3 and 4 (misses, glow hint, saved score and sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=stop-and-go FINGER_LEVELS=2` finished in 12.1 s. A portrait 768x1024 probe screenshot at levels 4 and 2 (`test-results/stop-and-go-vehicles.png`, not committed) showed digger, car, bike, van, tractor and bus legible, with faces and no overlap in the queue.
- Not run: full `npm test` and build (no shared files changed; CI runs both), device and child checks (vehicle readability on an iPad is open).

## 2026-10-22 — Bumper Garden level 8, Not this color (slice 5)

- [PR #757](https://github.com/rjdunlap/neo/pull/757), `claude/bumper-not-this-color`, tested on base `554e3e24` plus the branch; `src/games/bumper-garden/`: `not` color plan with sleepy asked-color flowers (never wanted, a bump only chimes), pre-K order `[3, 4, 6, 8, 5, 9]`, voice lines `bumper.not` / `bumper.again-not`, how-to lines for level 8, harness level 8 in the `next` suite.
- Passed `npm run typecheck`; `npx vitest run src/games/bumper-garden src/content/howto.test.ts src/games/registry.test.ts` 62 passed (new: asked color strictly fewest, at least 2 wanted, no sleepy flower wanted, every wanted flower reachable by an aimed launch on all three tables over 60 seeds; ladder order; ghost-finger plan test includes level 8).
- Passed `BROWSER_SUITE=next NEXT_ONLY=bumper BUMPER_LEVELS=8` at http://localhost:5382/classic/ in portrait (pond table, 5 launches, two misses, one hint, sticker, a sleepy-bump check); screenshot `test-results/browser/bumper-garden-8.png` reviewed, sleepy flowers read clearly. Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=bumper-garden FINGER_LEVELS=8` in 10.9 s.
- Not run: `npm run build` (no shared files or assets; CI builds), other suites. Open: whether a pre-K child reads "not" from the sleeping flowers ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-22 — Inchworm Measure level 7 definition (measurement-units M1, docs only)

- [PR #767](https://github.com/rjdunlap/neo/pull/767), `claude/define-big-worms`: defined Inchworm Measure level 7 *Big worms, little worms* ([definition](../definitions/big-worms-little-worms.md)); batch plan, READY, study backlog and the study's slices updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only). Open: the M2 build; nothing is built.
