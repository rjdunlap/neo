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

## 2026-10-22 — Stamp Studio levels 8–9, Trace Prints (deep-time D3)

- [PR #777](https://github.com/rjdunlap/neo/pull/777), `claude/trace-prints`, tested `047814b2` (plus guard-only `e46ce8f8`) on base `b02b6337`: `TracePrints` mud tray, level 8 leaf prints (lap) and level 9 two feet (toddler); the print margin is `max(across / 2, farthest reach) + 5`, a deviation from the definition.
- Ran `npm run typecheck`; `npm test` (2459 passed); Stamp Studio tests (39 passed; new rule tests for levels 1-7 unchanged, bands and landing, a print on the mud at three paper sizes, duck vs paw aspect at least 15%, finish once and the demo reaching the finish with both makers, pair line once including undo, no fossil wording, finish tests for 8 and 9); `npm run build`.
- Served at `http://localhost:5930`: `BROWSER_SUITE=creative CREATIVE_ONLY=stamps STAMP_LEVELS=8,9` passed (eight pats end level 8, both makers plus back and green arrows at 9, prints inside the mud in portrait, scores 0/0, stickers); `BROWSER_SUITE=fingerdemo FINGER_ONLY=stamp-studio FINGER_LEVELS=8,9` passed (12.0 s, 11.3 s); a one-off probe showed the level 8 and 9 how-to cards fit portrait 768×1024.
- Not run: `world`, offline, couch (unaffected), Stamp Studio levels 1-7 browser loop (class unchanged). Open: a one-year-old and a two-year-old with the prints and the makers ([DEVICE-CHECKS](../DEVICE-CHECKS.md#stamp-studio-trace-prints-levels-89)).

## 2026-10-22 — Sound Garden listening direction and visible echoes (slices 3–4)

- [PR #779](https://github.com/rjdunlap/neo/pull/779), `codex/sound-garden-direction-echo`; tested `4dcbb461` plus working diff, on `http://localhost:5203/classic/`. Level 7 up/down/same and level 5 dots, twelve rhythms, tree response and per-tap hints; one batch, no later levels.
- Ran typecheck; 76 focused Sound Garden/Rhythm Neighbors/how-to/registry/difficulty tests passed; build passed. Initial full run: 2455 passed, 4 skipped, one Rhythm Neighbors pool-count failure. Preserving its original eight-pattern export fixed that failure; its focused rules now pass. Required CI will establish the full final tree.
- `BROWSER_SUITE=batch BATCH_ONLY=garden SOUND_LEVELS=5,7` passed: free replay, two misses/one hint, per-tap drum lights, fading dots, tree wake, all answers, completion/accounting/sticker; level 7 portrait inspected with three separate full-size choices. Pool export correction preserves the same twelve Sound Garden patterns and does not invalidate the touch evidence.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=sound-garden FINGER_LEVELS=5,7`: levels 5 and 7 clean in 34.2 s and 22.3 s, no page errors. Inspected level 5 layout and level 7 portrait. No page errors in touch play.
- Not run: world, offline, stories, couch (no navigation/assets/persistence/story/control changes). iPad audio/speech, dot interpretation and child understanding remain open in [DEVICE-CHECKS](../DEVICE-CHECKS.md#sound-garden-listening-direction-and-visible-echoes-levels-7-and-5).

## 2026-10-22 — Second Chance Shed 1–4 definition (nature-sustainability N1, docs only)

- [PR #781](https://github.com/rjdunlap/neo/pull/781), `claude/define-second-chance-shed`: defined Second Chance Shed levels 1–4 ([definition](../definitions/second-chance-shed.md)); READY, game batches, study backlog, nature study, recommendations, waiting-on-developer and ideas updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (nothing built). Open: the build N2, which merges only after the developer's item-table review (definition decision 1).

## 2026-10-22 — Sand Table levels 1–3 definition (earth-materials E1, docs only)

- [PR #782](https://github.com/rjdunlap/neo/pull/782), `claude/define-sand-table`: defined Sand Table dry play, levels 1–3 ([definition](../definitions/sand-table.md)); READY, game batches, study backlog, earth-materials study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (nothing built). Open: the build E2 (no review gate; six open decisions all have defaults).

## 2026-10-22 — Sound Garden One big friend (level 8)

- [PR #784](https://github.com/rjdunlap/neo/pull/784), `codex/sound-garden-big-friend`; tested `6f8d5e51` plus working diff at `http://localhost:5205/classic/`. Docs-only main integration `6654bf20` preserves this evidence. Only batch 2 / dive slice 5: lap entry 8 before 1, broad touch field, four-tap handoffs and twelve-song finish.
- Passed typecheck, 72 focused Sound Garden/difficulty/how-to/registry tests, full units (2459 passed, four skipped), build. After the final ending-only guard, typecheck/focused rules/build and the level-8 play passed again; no changes to the bot action.
- `BROWSER_SUITE=batch BATCH_ONLY=garden SOUND_LEVELS=8` passed portrait, grass-edge taps, quick taps through handoffs, zero misses/hints, saved sticker and ending. Initial run used logical coordinates as CSS pixels; a small view-scale probe identified the harness error, corrected with `toGlobal`. No page errors.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=sound-garden FINGER_LEVELS=8` clean in 15.6 s. Inspected `test-results/browser/sound-garden-8-portrait.png`: large friend and clear shell/pet corners.
- Not run: world, offline, stories, couch (no route, asset, save-format or controller changes). iPad audio/speech and child's understanding remain open in [DEVICE-CHECKS](../DEVICE-CHECKS.md#sound-garden-one-big-friend-level-8). Level-1 every-touch retrofit and #733 preserved.

## 2026-10-22 — Integers study (subject research, docs only)

- [PR #785](https://github.com/rjdunlap/neo/pull/785), `claude/subject-integers`: [integers study](../deep-dives/subjects/integers.md) (Sea Lift 1–3 recommended first); tracker, packet, roadmap table, backlog, READY, IDEAS and Frog Hop's G3 note updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only); nothing is built or registered.
- Open: device speech for "−3" ("below the water", "minus" or "negative"), a mathematics educator's read of the level-4 cards and level-6/7 wording; no reference game was played.

## 2026-10-22 — Sound Garden pitch drawing and copying (levels 9–10)

- [PR #788](https://github.com/rjdunlap/neo/pull/788), batch 3 / dive slices 6–7 only; tested `0c399ec9` plus working diff at `http://localhost:5207/classic/`. Coordinator and Adventure Walk integrations (`10e0a6fd`) were docs only and preserve this evidence. Six snapped pitches, creative release-to-note and direction copying with alternative pitches.
- Passed typecheck, 74 focused rule/difficulty/how-to/registry tests and build. Full units first passed 2460 tests / four skipped with one how-to wording failure; corrected wording and all 19 how-to tests passed. PR CI on `35826ecc` passed all 208 files: 2461 tests passed / four skipped, and production build.
- `BROWSER_SUITE=batch BATCH_ONLY=garden SOUND_LEVELS=9,10` passed endpoints, cancellation, second-finger rejection, twelve creative notes, two wrong contours/one stem hint, valid alternative pitches, ending/stickers and portrait. Initial attempt was interrupted by HMR; frozen-source replay passed. Follow-up at level 10 also passed an actual replay-bird tap using `toGlobal` coordinates and asserting the bird answers.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=sound-garden FINGER_LEVELS=9,10` clean: 19.6 s / 37.5 s, no misses, hints or page errors. Both portrait images inspected: clear controls, singers and companion clearance.
- Not run: world, offline, stories and couch (unaffected). iPad audio/speech and child understanding remain open in [device checks](../DEVICE-CHECKS.md#sound-garden-pitch-drawing-and-copying-levels-910); gated level-1 retrofit, other levels and #733 untouched.

## 2026-10-22 — Adventure Walk levels 1–3 definition (movement-exercise, docs only)

- [PR #786](https://github.com/rjdunlap/neo/pull/786), `claude/define-adventure-walk`: defined Adventure Walk levels 1–3 ([definition](../definitions/adventure-walk.md)); READY, game batches, study backlog, movement study, recommendations and ideas updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the build AW2 (screen-only, no review gate; six open decisions all have defaults); movement invitations stay reviewer-gated.

## 2026-10-22 — Rain Garden levels 1–3 definition (weather-water slice 1, docs only)

- [PR #790](https://github.com/rjdunlap/neo/pull/790), `claude/define-rain-garden`: defined Rain Garden levels 1–3 ([definition](../definitions/rain-garden.md)); READY, study backlog, weather-water study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`; both passed.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the developer's registration/bands/land call, a science reader for the explanation lines (recommended), all device checks.

## 2026-10-22 — Ready for Adventure levels 1–3 definition (routines-self-care slice 1, docs only)

- [PR #791](https://github.com/rjdunlap/neo/pull/791), `claude/define-ready-for-adventure`: defined Ready for Adventure levels 1–3 ([definition](../definitions/ready-for-adventure.md)); READY (build RA2 promoted), study backlog, routines study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the build RA2 (no review gate; five open decisions all have defaults), all device checks.

## 2026-10-22 — Recipe Workshop levels 1–3 definition (cooking-recipes slice C1, docs only)

- [PR #792](https://github.com/rjdunlap/neo/pull/792), `claude/define-recipe-workshop`: defined Recipe Workshop levels 1–3 ([definition](../definitions/recipe-workshop.md)); READY (build C2–C4 queued as one batch), batch plan, study backlog, cooking study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the build C2–C4 (no review gate; five open decisions all have defaults), all device and person checks (the definition's check tier lists them).

## 2026-10-22 — Area, volume and space study (subject research, docs only)

- [PR #793](https://github.com/rjdunlap/neo/pull/793), `claude/subject-area-volume-space`: [study](../deep-dives/subjects/area-volume-space.md) (Meadow Pens 1–3 recommended first); tracker, packet, roadmap table, backlog, READY (Next ten refilled), IDEAS and the Bug Builder and Tangram Town hand-off notes updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only); nothing is built or registered.
- Open: device speech for "perimeter"; a mathematics educator's read of the level-2, 4 and 5 distractors and the M rungs; no reference game was played.

## 2026-10-22 — Meadow Pens levels 1–3 definition (area-volume-space slice 1, docs only)

- [PR #794](https://github.com/rjdunlap/neo/pull/794), `claude/define-meadow-pens`: defined Meadow Pens levels 1–3 ([definition](../definitions/meadow-pens.md)); READY (build queued), batch plan, study backlog, study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the level-2 card-table review (merge gate), device speech of the counts, all person checks.

## 2026-10-22 — Playdate Workshop levels 1–3 definition (social-emotional slice 1, docs only)

- [PR #795](https://github.com/rjdunlap/neo/pull/795), `claude/define-playdate-workshop`: defined Playdate Workshop levels 1–3 ([definition](../definitions/playdate-workshop.md)); READY, study backlog, study, recommendations, tracker, ideas and waiting-on-developer updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the developer's identity/registration and land call (the build waits on it), early-childhood/SEL and accessibility review of the requests, all device and child checks.

## 2026-10-22 — Per-band off-screen lines definition (off-screen-companions slices 1–3, docs only)

- [PR #796](https://github.com/rjdunlap/neo/pull/796), `claude/define-off-screen-lines`: defined slices 1–3 as one batch ([definition](../definitions/off-screen-lines.md)); READY, study backlog, study, recommendations, tracker, ideas and waiting-on-developer updated.
- Re-audit on `origin/main` `5a4bf744`: 113 `offScreen` lines, 59 reaching lap or toddler.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only, nothing built). Open: the developer's answer to the small-objects row (the build's merge waits on it), reviewer for any new under-3, bath, food, water or sun line.

## 2026-10-22 — Teddy Doctor patient choice and check-up rules (batch 1, slices 3–4)

- [PR #798](https://github.com/rjdunlap/neo/pull/798), `codex/teddy-patient-order`: level 7 choose a hurt friend then bandage; level 8 accepts all check-up orders that keep the spoken rules. Defaults only, #733 preserved.
- Proof: `1e994162` plus working diff, `http://localhost:5209/classic/`; typecheck, 30 focused rule/how-to tests, full `npx vitest run --maxWorkers=4` (2463 pass, four skipped), build, links and diff check. Initial unconstrained full run had three failures under load; unchanged-code rerun passed.
- `BROWSER_SUITE=next NEXT_ONLY=doctor FROM_LEVEL=7` passed level 7 (logged probe copy of the harness), wrong friend twice, hint, all three pairs, portrait, saved 2/1 and sticker. Level 8 completed its actions but exposed a test-driver extra action at completion; the driver guard was fixed. `FROM_LEVEL=8` then passed both patients, alternative valid order, two misses/one hint, reward, no page errors.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=teddy-doctor FINGER_LEVELS=7,8`: both clean, 16.3 / 24.9 seconds, no page errors. Pair portrait `test-results/browser/teddy-doctor-7-pair-portrait.png` inspected; faces, boo-boo and separated targets readable.
- Not run: world, offline, stories and couch (unaffected). Open: real iPad speech of ordering words, toddler patient choice and all child/device observations; broader bands and care/creature decisions remain gated.

## 2026-10-22 — Estimation study (subject research, docs only)

- [PR #799](https://github.com/rjdunlap/neo/pull/799), `claude/estimation-research`: [study](../deep-dives/subjects/estimation.md) (Lasso Loops 6 *About how many?* recommended first); tracker, packet, roadmap table, backlog, READY (definition line replaces the research line) and IDEAS updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only); nothing is built or registered.
- Open: whether a six-year-old changes a guess after the benchmark jar, whether "about 30" is understood when spoken, and the guess sign in portrait; no reference game was played.

## 2026-10-22 — Lasso Loops 6 About how many? definition (estimation E1, docs only)

- [PR #800](https://github.com/rjdunlap/neo/pull/800), `claude/define-lasso-about-how-many`: [definition](../definitions/lasso-loops-about-how-many.md); READY (build line replaces the definition line), batch plan, backlog, estimation study and trackers updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser (docs only); nothing is built.
- Open: the guess sign in portrait and a child's play of level 6 (decision 2 for level 7) remain unchecked.

## 2026-10-22 — Scoop Shop younger entries (batch 1, slices 3–4)

- [PR #802](https://github.com/rjdunlap/neo/pull/802): level 10 Any scoop (one scoop of anything per customer), level 11 Who wanted pink? (two customer pictures, prepared cone, retained waiting friend). Lap/toddler/preschool teaching order and entry landing preserve saved IDs; later levels and decisions excluded.
- Proof on `ab60d82d` plus the implementation diff, `http://localhost:5211/classic/`: typecheck, 29 focused rule/band tests, full unit suite **2467 passed / 4 skipped** (`--maxWorkers=4`), build passed. Normal large-bundle and listener-count warnings only.
- `BROWSER_SUITE=arcade ARCADE_ONLY=scoop ARCADE_LEVELS=10,11`: 10 passed; 11 initially exposed a driver offset error (screen offsets on a scaled customer). `test-results/scoop-probe.mjs` logged the old picture tap at local y −583, outside the −500 hit area; the correct transformed tap counted a miss. Fixed driver coordinates; filtered `ARCADE_LEVELS=11` passed body/picture taps, free cone exploration, wrong customer twice, glow, saved 2/1, retained waiting friend and one sticker. Level 10 saved 0/0 and one sticker. No page errors.
- Portraits `test-results/browser/scoop-shop-10-portrait.png` and `scoop-shop-11-portrait.png` inspected: legible scoop/heart and separate customer pictures, clear pet and shell controls. `BROWSER_SUITE=fingerdemo FINGER_ONLY=scoop-shop FINGER_LEVELS=10,11`: clean in **13.9 / 13.3 seconds**, no misses, hints or page errors.
- Links and diff check at closeout. World/offline/picnic/couch not run (unaffected); iPad touch/speech and child understanding remain open in DEVICE-CHECKS.
