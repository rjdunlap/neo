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

## 2026-10-22 — Peg Garden numbered buds, shot trail, shell tray and board themes (slices 2-3)

- [PR #770](https://github.com/rjdunlap/neo/pull/770), `claude/peg-garden-buds-and-themes`, code `3fd33664` on base `6daa9a47`: only the asked numeral blooms at levels 4-5, a faint last-shot trail, a shell tray, four board shapes and three backdrops (couch keeps the first look); how-to card and `pegs` browser case updated.
- Passed `npm run typecheck`; `npm test` (206 files, 2431 tests); peg-garden rule tests (12, including shape spacing and room, no wedge on the newer shapes, `pickTheme` covering every shape and backdrop, `blooms()`, tray slots). At http://localhost:5604: `BROWSER_SUITE=batch BATCH_ONLY=pegs FROM_LEVEL=4 TO_LEVEL=5` (level 4 score 3,1; level 5 score 2,1; level 5 failed twice before the script used the game's `aimAt` margins); `BROWSER_SUITE=couchgames COUCH_ONLY=peg-garden` passed before and after the edits; one probe screenshot per backdrop (landscape shallows level 4, landscape reef level 3, portrait 768x1024 kelp level 5).
- Not run: `fingerdemo` (aim bot unchanged), levels 1-3 browser play, `npm run build` (no shared files or assets changed), device or child play.
- Open: gap 12 (a pearl can wedge near the wall on the `rows` shape the couch keeps, or balance on a bud, until the 10-second cutoff; [dive](../deep-dives/peg-garden.md#the-game-today)).

## 2026-10-22 — Stamp Studio Trace Prints definition (deep-time D3, docs only)

- [PR #771](https://github.com/rjdunlap/neo/pull/771), `claude/define-trace-prints`: defined Stamp Studio levels 8–9 *Trace Prints* ([definition](../definitions/trace-prints.md)); batch plan, READY, study backlog, waiting-on-developer, the deep-time study, recommendations and the Stamp Studio dive updated.
- Ran `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean).
- Not run: typecheck, unit tests, build, browser (docs only). Open: the build; nothing is built.

## 2026-10-22 — Same Kind, Different Sprouts definition (genetics G4, docs only)

- [PR #772](https://github.com/rjdunlap/neo/pull/772), `claude/define-same-kind-sprouts`: defined Critter Sort levels 12–13 ([definition](../definitions/same-kind-different-sprouts.md)), choosing Critter Sort over Photo Safari; batch plan, READY, study backlog, the genetics study, recommendations and the Critter Sort dive updated.
- Ran `node scripts/check-links.mjs` and `git diff --check` (results in the closeout report).
- Not run: typecheck, unit tests, build, browser (docs only). Open: the build; nothing is built.

## 2026-10-22 — Lid and Lever definition (daily-life-long-ago H3, docs only)

- [PR #773](https://github.com/rjdunlap/neo/pull/773), `claude/define-lid-and-lever`: defined Attic Finds levels 3 *Up and down* and 4 *Peek inside* ([definition](../definitions/lid-and-lever.md)); batch plan, READY, study backlog, waiting-on-developer, the daily-life-long-ago study, recommendations and the Attic Finds dive updated.
- Ran `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean).
- Not run: typecheck, unit tests, build, browser (docs only). Open: the build and every device check named in the definition; nothing is built.

## 2026-10-22 — What can we tell? definition (inquiry Q5, docs only)

- [PR #774](https://github.com/rjdunlap/neo/pull/774), `claude/define-what-can-we-tell`: defined Ramp Race level 7 ([definition](../definitions/what-can-we-tell.md)); inquiry study, recommendations, study backlog, waiting-on-developer, READY and the Trial Shelf definition updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`; a node one-off over the ramp model confirmed the case pools (17 confounded pairs after one tie, 6 where the shorter ramp went farther, 18 controlled) and that every confounded pair repairs in at most 2 taps with 4 fair repairs.
- Not run: typecheck, unit tests, build, browser (nothing built). Open: the build, which waits on Q4 and inquiry decisions 1–2 extended to level 7.

## 2026-10-22 — Ribbon Workshop levels 1-3 (fractions R2)

- Branch `claude/ribbon-workshop`, commit `291ed66b` on base `02671f92`: new game `ribbon-workshop` (school, Counting Cove's twelfth game), with registry, lands, voice, how-to card and the `ribbon` browser case.
- Ran `npm run typecheck`; the full unit suite (207 files, 2444 tests, 11 new rule tests: solvable, accepted compositions equal brute force, snip required at levels 2-3, undo, hint, capacity, seeded rounds 0-199, accounting, voice, tray layout); `npm run build`; `BROWSER_SUITE=ribbon` at `http://localhost:5429/classic/` (level 1: empty Check free, two misses then glow and one hint, finished `[1,2,1]` as the caller reported it; level 3 portrait: two halves too long is a miss, return, scissors, snip, quarter, finished `[3,1,0]`); `fingerdemo` with `FINGER_ONLY=ribbon-workshop` at levels 1 and 3 (3.6 s, 6.1 s); `smoke` with `SMOKE_ONLY=ribbon-workshop`.
- Not run: `world`, couch, offline (not affected). Open: iPad touch, device speech and a child's response ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-22 — Inchworm level 7, Big worms, little worms (measurement M2)

- [PR #776](https://github.com/rjdunlap/neo/pull/776), `claude/inchworm-big-worms`, commit `6d7d2a63` on base `e3a7002b`: Inchworm level 7 (pre-K `{1..7, order [1,2,7]}`, school `{1..7, order [1,2,7,3,4,5,6]}`), how-to card, voice lines; the `woods` `worm` case now honours `FROM_LEVEL`/`TO_LEVEL` (default 1-7) and its `lay()` helper converts logical to screen coordinates.
- Ran `npm run typecheck`; vitest for Inchworm logic (15 tests, levels 1-6 generation pinned to its pre-change seed-7 output), `howto` and registry (54 passed).
- Served at `http://localhost:5995/classic/`: `BROWSER_SUITE=woods WOODS_ONLY=worm FROM_LEVEL=7 TO_LEVEL=7` passed in portrait (one overhang drop, one wrong pad, glow and see-through big worm, score [2,1], sticker); `FROM_LEVEL=1 TO_LEVEL=3` rerun after the `lay()` change, passed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=inchworm FINGER_LEVELS=6,7` clean (6: 5.1 s, 7 at pre-K: 22.1 s; the demonstration measures one stick). Portrait screenshot of step c reviewed.
- Not run: full `npm test` and `npm run build` locally (CI runs both), worm levels 4-6 browser plays, `world`, offline, couch (unaffected). Open: iPad size and device speech ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).
