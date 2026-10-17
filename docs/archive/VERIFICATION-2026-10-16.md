# Verification 2026-10-16 (archived entries)

## 2026-10-16 — Woodland Picnic

- [PR #479](https://github.com/rjdunlap/neo/pull/479), `claude/woodland-picnic`, code at `f57b77c` on `origin/main` `2d7e623`: the second Island Errand (school, from Wonder Woods); new save field `stories.woodland`, story-ID store methods, `go.woodland`, `StoryRound` union.
- Passed `npm run typecheck`, `npm test` (154 files, 1416 tests, including save migration, store story and woodland content tests with story levels inside each game's school range) and `npm run build`.
- `BROWSER_SUITE=woodland` (new) passed at `http://localhost:5173`: entry only in Wonder Woods, story spot first, portrait cards, real Mail Carrier 6 round with a wrong house, Seesaw left mid-round and finished with help, Beat Builder 3 on `PicnicStage`, reload resume, ending and one photo, one sticker per round, retelling, Home; screenshots `woodland-start-portrait.png`, `woodland-finale.png`. `picnic` and `world` passed as regressions.
- Production offline check passed against the current build (`assets/index-gguiz4Kg.js` confirmed, preview `http://localhost:4173`) after its fixture was updated to expect the untold woodland telling.
- Open: device speech and the picnic beat on an iPad, a child playing it ([device check](../DEVICE-CHECKS.md)).

## 2026-10-16 — Subject docs publication reconciliation

- Reconciled with `origin/main` at `786889a`, retaining completed inquiry, genetics, daily-life-long-ago and deep-time studies. New research rows remain unstarted; broader evolution is a follow-up scope rather than a claim that genetics research is unfinished.
- Recorded the final discussion’s acoustics/optics/wind, oceanography and other physics/cross-subject ideas as proposed scopes, not new build-ready work. Rechecked local Markdown links/anchors and diff whitespace after reconciliation; no code checks required.

## 2026-10-16 — Further subject and progression gaps

- Compared the expanded tracker, built catalog descriptions and family experience matrix; opened primary CCSS measurement/base-ten/reading and NGSS cell/natural-selection pages. Recorded source limits in the gap audit.
- Added unstarted measurement-units and cells-microbes rows. Clarified decimals, evolution and everyday geography scope, plus connected-text reading and other expansions within existing research. No game or completed deep-research session implied; dispatch order retained.
- Local Markdown links/anchors and `git diff --check` passed. Docs only; no code/build/browser/device checks, full developmental/competitor review or scientific validation.

## 2026-10-16 — Astronomy follow-up research brief

- Recorded the requested astronomy follow-up as not started, linked to the completed Space study and roadmap. Scope: stars/life cycles, galaxies, telescopes/observational evidence, deeper eclipse/season models; existing Space candidate identities and overlaps retained.
- Local Markdown links/anchors and `git diff --check` passed. Setup only: no external research, completed subject study, implementation, code/build/browser/device checks or scientific review claimed.

## 2026-10-16 — Chemistry follow-up research brief

- Recorded the requested chemistry follow-up as not started, linked to the completed Matter study and roadmap. Brief covers atoms/molecules, reactions/conservation and possible acids/bases extension, audience/overlap questions, and SpaceChem as a requested reference.
- Official SpaceChem description inspected through search output; educator guide only seen in search summary. No game played, curriculum anchors opened, full subject research or implementation claimed in this setup pass.
- Local Markdown links/anchors and `git diff --check` passed. Docs only; code/build/browser/device checks not run.

## 2026-10-16 — Writing and typing research gaps

- Checked composition/Letter Trails coverage and opened primary CCSS W.3.6, W.4.6 and grade-1 Language text. Added unstarted keyboarding/editing and spelling/sentence research rows; clarified composition versus handwriting and touchscreen versus hardware input boundaries in the follow-up audit.
- Local Markdown links/anchors and `git diff --check` passed. Docs only; no code, browser, device or learning-transfer checks. Full developmental/teaching research remains open.

## 2026-10-16 — Scientific inquiry subject research

- Added [inquiry study](../deep-dives/subjects/inquiry.md): opened curriculum/developmental sources, six game/app references (PhET shell-only), two physical references, every audience, existing-game overlap, Ramp Race 5–8 proposals and ordered definition/build slices. Recorded failed source opens and support/accounting gaps without fixing code.
- Updated subject tracker, candidate notebook, roadmap recommendations/ready definitions and developer decisions. Passed local relative-link/anchor checks and `git diff --check`. No tests, build or browser suites run: docs-only research; no iPad/child/teen observations or transfer established.
- Initial tree clean; overlap check found no inquiry claim. Publication was initially blocked by automatic approval review; the developer explicitly authorized publication on 2026-10-16. Integrated ten upstream commits before final docs checks, preserving both Photo Safari verification entries. No open PRs, including drafts, were present at publication review. Feature branch: `codex/inquiry-subject-research`.

## 2026-10-16 — Photo Safari waving and swimming

- [PR #474](https://github.com/rjdunlap/neo/pull/474), `codex/safari-actions`, dispatch `safari-actions-20261016T222436Z`; tested `ad09b31` plus implementation diff. Docs-only upstream integration `3c53157` changes no game dependencies.
- Typecheck, 21 focused Photo Safari/journal tests and production build passed (existing chunk-size advisory). Across 500 seeds per mode: swimming is pond-only, all eligible actions appear as targets, conjunction clues stay fair and negation distractors share a land-safe action.
- `GAME_URL=http://localhost:5204 BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=3 npm run test:browser` passed wrong photos, automatic hint/glow, album, saved `[2,1]`, sticker and no page errors.
- Isolated `test-results/safari-actions.mjs` completed a seeded level-3 round with both new actions, verified both saved journal ids and no page errors. Reviewed `test-results/safari-waving.png` and `safari-swimming.png`: raised paw and bobbing swimmer/ripples are clear. Actor art is included in album textures and journal pictures; existing texture ownership retained.
- Not run: wider browser suites/offline (unchanged navigation/persistence), device speech, iPad and child response. Initial sandbox Chromium launches failed; approved isolated launches passed. Owned Vite stopped after checks.

## 2026-10-16 — Photo Safari level 5 both clues

- [PR #472](https://github.com/rjdunlap/neo/pull/472), `codex/safari-five`, dispatch `safari-five-20261016T212806Z`; tested `36cead5` plus implementation diff (includes docs-only coordinator dispatch `c78436c`). Existing level 5 only; IDs/pins, ranges, other levels, actions, journal and saves retained.
- Passed typecheck and 26 focused Photo Safari/how-to tests. New conjunction regression fails on the old generator (only one place match); across 300 seeds the repaired level has two name/action matches, two name/place matches and exactly one full match. Shared-level geometry rules cover four views, 150-unit separation, 100-unit targets and nearest-body resolution independent of draw order. Build passed with existing chunk-size advisory.
- `GAME_URL=http://localhost:5203 BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=5 npm run test:browser` passed two wrong same-place photos, hint/glow, album, saved `[2,1]`, sticker and no page errors. Reviewed `test-results/browser/photo-safari-5-portrait.png`: separated animals at two broad places; pet/corner controls clear.
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=photo-safari FINGER_LEVELS=5` passed cleanly in 14.2 s with no page errors. Shared input receiver follows the target animal. Links/diff passed; owned Vite server stopped.
- Not run: other browser games/levels, world/offline (no navigation, persistence or asset changes), iPad/device speech or child play; [device checks](../DEVICE-CHECKS.md) remain open.

## 2026-10-16 — Chain Reaction level 7 Tap to turn

- [PR #448](https://github.com/rjdunlap/neo/pull/448), `codex/chain-reaction-tap-turn`, claim `f702157` on base `e0a88f4` plus implementation diff (docs-only dispatch `c334599` integrated at `63bf7d7`, no game dependency changes): two preplaced ramp taps, unsolved seeded boards, exact flip solver/hints, pre-K order `[7,8,1,2,3]` and entry IDs `[7,8]`; existing IDs/pins, school range and bands retained.
- Passed `npm run typecheck`; 47 focused tests (`npx vitest run src/games/chain-reaction/logic.test.ts src/games/registry.test.ts src/content/howto.test.ts`), including 200 seeded two-board rounds and every flip state's independently traced outcome, plus hint/bot progress and entry/pin checks. `npm run build` passed (existing chunk-size advisory).
- `GAME_URL=http://localhost:5194 BROWSER_SUITE=machines CHAIN_LEVELS=7 npm run test:browser` passed: failed experiment/trail with zero misses, one requested hint, real ramp taps, both machines, saved result `[0,1]`, exactly one sticker and portrait fit/100-unit areas. Reviewed `test-results/browser/chain-reaction-7-portrait.png` (board, controls and pet clear).
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=chain-reaction FINGER_LEVELS=7` passed cleanly in 13.2 s, through real taps. Both browser checks had no page errors. Initial sandbox Chromium launch was blocked; the authorized unsandboxed local run passed.
- Not run: full units, other game levels/suites, world/offline (no navigation, save or asset contract changes), device speech/touch or child observation; these remain [device checks](../DEVICE-CHECKS.md). Owned Vite stopped after checks.

## 2026-10-16 — Animal Snack busy-touch acknowledgment

- [PR #446](https://github.com/rjdunlap/neo/pull/446), `claude/animal-snack-busy-touch`, commit `64191bf` on base `caf0f0d`: pure `busyTouch(busy, finished, target)` in `logic.ts`; while busy, a tapped animal pokes with a tick and an uneaten snack wiggles its inner drawing; no voice, food or miss, nothing queued.
- `npm run typecheck`; `npx vitest run src/games/animal-snack` (10 passed, including the new `busyTouch` test).
- `GAME_URL=http://localhost:5863 BROWSER_SUITE=woods WOODS_ONLY=snack` passed levels 1–5 with new assertions: level 2 second snack tap mid-eat wiggles and feeds nothing (fed 1, no misses or hints, node scale 1.2); level 3 round 2 wrong animal 150 ms after the right one is not a miss. Level-2 check fails with the wiggle removed.
- Not run: `fingerdemo` (bot unchanged), build (no shared files), portrait screenshot. Open ([device checks](../DEVICE-CHECKS.md)): whether the wiggle reads as "wait" to a child.


## 2026-10-16 — Critter Sort worked example

- [PR #418](https://github.com/rjdunlap/neo/pull/418), `claude/critter-sort-worked-example` (bff1137): a worked example at levels 1, 2, 3 and 5; two harness fixes (the `woods` sort loop plays `plan.rounds`; `fingerdemo` `FINGER_LEVELS` picks a band whose order has the level).
- Ran `npm run typecheck` and `npx vitest run src/games/critter-sort src/content` (87 passed; new rule test: examples in their own places, at least two loose, bot and hint never touch one, 200 seeds per level).
- Passed `GAME_URL=http://localhost:5961 BROWSER_SUITE=woods WOODS_ONLY=sort` levels 1–4, and level 5 with `FROM_LEVEL=5` after the loop fix; `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=1,2,3,5` clean (12.1, 12.1, 12.2 s at pre-K; 25.2 s at school for 5). One portrait screenshot at level 3 (768×1024) shows the bear in the middle.
- Not run: build (no shared assets), the full unit suite, the other suites. Device speech for the two new lines is open in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## 2026-10-16 — Woodland Picnic definition

- [PR #424](https://github.com/rjdunlap/neo/pull/424), `claude/woodland-picnic-definition`; docs only. Levels (Mail Carrier 6, Seesaw Balance 7, Beat Builder 3) checked against each game's school range in source at `562b97c`.
- Ran the link check and `git diff --check`. No code checks (docs only).
- Open: the build itself, with its story/navigation/save tier checks, is not started.

## 2026-10-15 — Data and AI literacy subject research

- Docs-only study on base `1dea66f` plus scoped working diff: [study](../deep-dives/subjects/data-ai-literacy.md), seven candidate/mode ideas, six-level first-game proposal, older/family cases, tracker/notebook/roadmap updates.
- Opened official standards, primary research and seven reference activities; failed full-paper/lesson-PDF extraction is explicit. No reference games played.
- Passed `node scripts/check-links.mjs` and `git diff --check`; older log entries archived with inbound links updated.
- Not run: typecheck, tests, build, browsers or hardware; no code changed. Audience appeal, independent understanding and transfer remain unestablished.
- [PR #431](https://github.com/rjdunlap/neo/pull/431); publication explicitly authorized on 2026-10-16 after the initial approval-review block. Integrated main `1dea66f`; checks apply to research commit `8384fbd` plus these publication-link edits.

## 2026-10-16 — Critter Sort level 8 A new sign

- [PR #428](https://github.com/rjdunlap/neo/pull/428), `codex/critter-sort-eight`, dispatch `critter-sort-eight-20261016T071003Z`: tested base `76e5cfd` plus implementation diff. School appends ID 8; same six sort twice under different pictured/spoken rules; one sticker after both passes. Existing IDs/pins and pre-K unchanged.
- Passed typecheck, 46 focused game/registry/how-to tests and build (existing chunk warning). The 300-seed level-8 test proves deterministic, distinct nontrivial splits, both-pass bot/hint selection and reachable hoop/mat answers.
- At `http://localhost:5188`, `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=8 TO_LEVEL=8` passed same-node/critters identity across both sorts, changed sign, free grass, two misses/one hint, no completion before mat placement, saved result/sticker and no page errors. Landscape and portrait screenshots reviewed.
- At the same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=8` sorted both passes cleanly in 30.0 s. Initial sandbox Chromium bootstrap blocked; isolated browser run with native permissions passed. Links and diff checked after closeout edits; owned Vite stopped.
- Not run: full units, other levels/suites, world/offline (no navigation/persistence changes), iPad speech/touch and child interpretation; device checks remain open.

## 2026-10-16 — Market Stall pips and a teaching hint

- [PR #429](https://github.com/rjdunlap/neo/pull/429), `claude/market-stall-pips-hint`: tested commit `2b84c8c` minus a later pip-radius enlargement (geometry only; unit tests re-run), base `1dea66f`. Levels 1–3 coins show ink pips (five to a row) under a smaller numeral on a stall-only layer; at levels 3, 5 and 7 the two-miss hint first says a strategy line. Hint counting, `coinArt`, icon and sticker unchanged.
- Passed typecheck; `npx vitest run src/games/market-stall src/content src/games/registry` (106 tests, incl. pip geometry and teach-line legality; the pinned sticker/`coinArt` snapshot still passes); build.
- At `http://localhost:5827`, `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=2` passed levels 2–7 (misses, hint coins, a second way, saved score and sticker, no page errors); it ran before the pip radius was enlarged. Portrait 768×1024 screenshot at level 3 (5, 2, 1 on the mat): pips legible and matching the tag's dots.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=3` clean in 24.0 s.
- Not run: full unit suite, other browser suites, offline; device speech, iPad legibility and whether a preschooler matches pips to tag dots (already [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device)).

## 2026-10-16 — Sink or Float level 7 definition

- Docs only ([PR #432](https://github.com/rjdunlap/neo/pull/432), `claude/sink-float-make-it-float`): [Make it float](../definitions/make-it-float.md) defined as Sink or Float level 7 (school), routed to the roadmap's ready list, the idea notebook and the physics notes.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code checks apply; nothing is built.
- Open: the build itself (new-interaction tier, `fingerdemo` at level 7); device speech and a child's reaction stay unchecked.

## 2026-10-16 — Missing Melody definition

- Docs only: [definitions/missing-melody.md](../definitions/missing-melody.md) defines chunk 7's preschool story episode (entry from Bumpy Hills; Song Maker 4, Sound Garden 2, Sing-Along Barn 3; no typed story result). Levels checked against each game's range in source at `239296f`.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code or browser checks; nothing built.
- Open: the build, after the Woodland Picnic (chunk 22), with its story/navigation/save tier checks.
## 2026-10-16 — Critter Sort level 9 This but not that

- [PR #436](https://github.com/rjdunlap/neo/pull/436), `codex/critter-sort-nine`, worker `01a143f7-ff89-7560-8b89-30f08aa4e88a`, dispatch `critter-sort-nine-20261016T090734Z`: tested base `a9c650e` plus implementation diff. One A/not-B hoop, both-part speech, explicit mat and two diagrams; school appends 9, IDs/pins and pre-K preserved.
- Passed typecheck, 47 focused Critter Sort/registry/how-to tests, and build (existing chunk warning). Across 400 seeds, level 9 accepts exactly A and not B, includes accepted/A-and-B/neither witnesses, avoids the previous pair, and has reachable hint/bot destinations in both views.
- `GAME_URL=http://localhost:5189 BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=9 TO_LEVEL=9`: both diagrams, one hoop, evidence categories, free grass, two misses/one hint, correct glow, mandatory mat completion, saved result/sticker and no page errors. Landscape and portrait screenshots reviewed.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=9` clean in 28.3 s. Initial sandbox launch blocked by Chromium bootstrap permissions; isolated run outside sandbox passed. Links and diff checked; owned Vite stopped after checks.
- Not run: full unit suite, other browser suites, world/offline (no save/navigation/assets change), device speech/iPad/child checks. Device checks remain open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-16 — Tangram Town ship picture

- [PR #434](https://github.com/rjdunlap/neo/pull/434), `claude/tangram-ship` (90799ef): a four-piece ship (hull, upright rectangle mast, a triangle sail each side) joins level 5's pool, now five; twenty-three pictures. No rule, band or save change.
- Ran `npm run typecheck` and `npx vitest run src/games/tangram-town src/games/registry` (29 passed: overlap, picture box, pool membership, any-order fill, pool sizes).
- One real-input probe (`test-results/ship-probe.mjs`, Vite at `http://localhost:5497`, school band, level 5 pinned, portrait 768x1024): one wrong drop counted one miss, every piece selected, turned and dragged home, round finished with a sticker, no page errors; start and built screenshots reviewed.
- Not run: build (no shared files), the `creative` suite, `fingerdemo` (bot unchanged), a device, a child.
## 2026-10-16 — Garden Rows couch play

- [PR #433](https://github.com/rjdunlap/neo/pull/433), `claude/garden-rows-couch` (0e03cb2): Garden Rows joins couch play (ring over the bed, seed packets on a press, `autoplay()`, twin face-off on wrong plantings, last unlock tier); touch play unchanged.
- Ran `npm run typecheck` and `npx vitest run src/couch src/games/garden-rows src/content` (161 passed; the howto test's bot-game count is now 25).
- Passed `GAME_URL=http://localhost:5528 BROWSER_SUITE=couchgames COUCH_ONLY=garden-rows` twice (the second on 0e03cb2): intro, controller diagram lights with the bot, bot round through `control()`, one stop saved, sticker, child save untouched, no page errors. A probe screenshot (level 3, 1024x768) shows the ring on an empty spot with the packets open.
- Not run: full `npm test`, build, full `couch`/`couchcourse` (trip and course code unchanged), offline, a portrait couch view, a real controller or TV.

## 2026-10-16 — Shape Buddies level 2 definition

- [PR #440](https://github.com/rjdunlap/neo/pull/440), `claude/shape-buddies-step-definition`: docs only. Defines Shape Buddies level 2 *A step down* in [the definition](../definitions/shape-buddies.md#level-2-a-step-down-defined-2026-10-16); nothing built.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, unit or browser checks.

## 2026-10-16 — Critter Sort level 11 How many?

- [PR #439](https://github.com/rjdunlap/neo/pull/439), `codex/critter-sort-eleven`, worker `01a14435-4fa4-75c2-bc0c-802e92b789e9`, dispatch `critter-sort-eleven-20261016T101434Z`: tested base `feeafa8` plus implementation diff. School appends 11, skips reserved 10, IDs/pins and pre-K preserved.
- Passed typecheck, 48 focused Critter Sort/registry/how-to tests, and build (existing chunk warning). Across 300 seeds, counts match `placeOf`, parts have 1/2/3 critters, every part can be largest, and counting targets are distinct/reachable in landscape and portrait.
- `GAME_URL=http://localhost:5191 BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=11 TO_LEVEL=11`: two mandatory sorts and comparisons, every critter tapped/count badges truthful, repeated taps free, two comparison misses/one hint, resize/replay, saved result/sticker and no page errors. Count-badge landscape and portrait screenshots reviewed.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=11` clean in 52.8 s: sorts, counts every part and chooses the largest in both diagrams. Links and diff checked; owned Vite stopped after checks.
- Not run: full units, other browser suites, world/offline (no save/navigation/assets change), device speech/iPad/child checks. Open person/device checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-16 — Letter Trails show the way, arrows, rising tune and looks

- [PR #442](https://github.com/rjdunlap/neo/pull/442), `claude/letter-trails-show-the-way` (code `9c50949` on base `e1020db`), levels 1–8, no new level: the second wandering drag on a stroke (still one hint) makes the firefly fly the next stretch (up to 12 checkpoints) and return; a start arrow beside each stroke; the firefly's note climbs a pentatonic step per fifth of a stroke; teal, rainbow, glitter or sand ink per round, drawn after the word. How-to card updated.
- Ran `npm run typecheck`; `vitest run src/games/letter-trails` (16 passed, 6 new: shown path equals the next checkpoints and ends at the stroke's end, one hint per stroke, arrow at the start along the first segment, tune climbs 0 to 4 and never falls, every look appears, a look never changes the word); `src/content` and registry tests (95 passed); `npm run build`.
- `GAME_URL=http://localhost:5245 BROWSER_SUITE=letters` passed (level 1 with two wanders, one hint and the firefly back at its checkpoint; 4; 7; 8 Zoë-Rose; 8 A–Z); landscape screenshot of the shown way (sand) and one portrait probe at level 5 showing the start arrow (rainbow) reviewed.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=letter-trails FINGER_LEVELS=1,4` clean (9.5 s, 7.8 s).
- Not run: the full unit suite, other suites, world, offline. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): device speech and feel, whether a child follows the shown way, the rising tune on an iPad.

## 2026-10-16 — Chain Reaction level 8 Which bell?

- [PR #441](https://github.com/rjdunlap/neo/pull/441), `claude/chain-reaction-which-bell` (tested at the final branch tip, merged with `origin/main` `725c597`): new level 8 prediction (a finished machine, three bells, tap one then run; a different bell is never a miss; agreeing ramps reach a corner, disagreeing ones return under the cup, some machines add an unreached ramp, and a 200-seed test proves the answers vary); pre-K `{ 1, 8, order [8, 1, 2, 3] }`, `entryLevels [8]`; how-to scoped to 8 and 1–6; five `chain.predict-*` lines; `chainPlay` gained level 8 and `CHAIN_LEVELS`.
- Ran `npm run typecheck`; `vitest run src/games src/content` (127 files, 1111 tests passed); after the variety fix, Chain Reaction, registry and content tests (105 passed, three level-8 rule tests).
- `GAME_URL=http://localhost:5812 BROWSER_SUITE=machines CHAIN_LEVELS=8` passed (rerun after the fix): run-before-pick prompt, uncounted help, wrong bell with trail and 0 misses/0 hints, three machines, one sticker, landscape and portrait screenshots reviewed. `CHAIN_LEVELS=1,6` regression passed before the fix (levels 1–6 untouched by it).
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=chain-reaction FINGER_LEVELS=8` clean in 19.5 s.
- Not run: build (no shared assets), world, offline, iPad, device speech, a child. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-16 — Market Stall more stalls

- [PR #444](https://github.com/rjdunlap/neo/pull/444), `codex/market-stalls`, dispatch `market-stalls-20261016T121134Z`; tested `9f5c724` plus implementation diff (base `c1c438f`). Fruit/flower/balloon stalls vary awning, goods and keeper; existing payment behavior and sticker recipes retained.
- Typecheck, 47 focused Market Stall/registry/how-to tests and build passed. Stock drawings and tags fit four views (1024×768, 1366×768, 768×1024, 844×390), clear of pet/mat; sticker seeds 0–99 and shared coin snapshots unchanged.
- `GAME_URL=http://localhost:5193 BROWSER_SUITE=smoke SMOKE_ONLY=market-stall` passed levels 1, 4, 7: stray taps, how-to and portrait, no page errors. Chromium needed sandbox escalation at startup.
- Isolated `test-results/market-stalls-proof.mjs`: all three stalls, distinct paired spoken names, rendered stock/mat/pet clearance; fruit/flower landscape and balloon portrait screenshots reviewed (`test-results/browser/market-stall-{fruit,flower,balloon}.png`). Probe corrected to read serialized Bounds min/max fields; no game defect.
- Links/diff checked; owned Vite stopped after proof. Not run: full units, gameplay/ghost-finger suites (unchanged interaction), world/offline, iPad/device speech/child checks; [device gaps](../DEVICE-CHECKS.md) stay open.

## 2026-10-16 — Duckling Parade ABB level 11

- [PR #445](https://github.com/rjdunlap/neo/pull/445), `claude/duckling-abb-eleven`, commit `6b384e4` on base `99d659a`: level 11 ABB parade (`repeatedPair: 'abb'`), school range 9–11, how-to lines and a 300-seed rule test; levels 9/10 unchanged.
- `npm run typecheck`; `npx vitest run src/games/duckling-parade src/games/registry src/content/howto` (46 passed); `npm run build`.
- On `http://localhost:5235` (dev, this worktree): `BROWSER_SUITE=arcade ARCADE_ONLY=parade ARCADE_LEVELS=11` passed (walking, joining, refusals with 2 misses and 1 hint, pond, score and sticker; screenshot `test-results/browser/duckling-parade-11.png` shows A B B A B B); `BROWSER_SUITE=fingerdemo FINGER_ONLY=duckling-parade FINGER_LEVELS=11` clean in 19.0 s.
- Not run: full unit suite, portrait screenshot, world/offline. Open ([device checks](../DEVICE-CHECKS.md)): ABB on a real iPad by a school-age child.

## 2026-10-16 — Sing-Along Barn Bounce High, Bounce Low

- [PR #450](https://github.com/rjdunlap/neo/pull/450), `claude/sing-barn-bounce-high` (cc25875, base `06a62c1`): the seventh tune, `bounce`, on mi, sol, la; seeded in every level's pool and the seventh card (a red ball) in the level 5-6 chooser, now seven cards at 0.5; voice lines, how-to and `describeLevel` updated.
- Passed `npm run typecheck`; vitest `sing-along-barn`, `src/content` and registry (129 tests, incl. two new Bounce tests: lyric, answers and verse ends; mi, sol, la only with "high" above "low"); `npm run build`.
- At `http://localhost:5379`, `BROWSER_SUITE=singalong` passed with a new level-1 Bounce round (10 + 10 notes, no misses or hints); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn FINGER_LEVELS=5,6` passed (54.2 s, 36.2 s); a portrait 768x1024 probe screenshot of the level-6 seven-card chooser (cards about 104 logical tall, pet clear).
- Not run: full unit suite, world/offline, a grown-up singing the tune against the taps (notes from the standard form; sources confirm only the three notes; [device check](../DEVICE-CHECKS.md)), device speech, a child's play.

## 2026-10-16 — Clap the Syllables level 6 Beat train

- [PR #449](https://github.com/rjdunlap/neo/pull/449), `claude/clap-beat-train` (f2b6a07, base `fff0166`): school plays 5-6; drag three pictures into train cars, fewest claps first, ties either way; new rules `fitsCar`, `nextForTrain`, `trainCounts`; level-6 how-to lines plus bounded level 4/5 steps.
- Passed `npx tsc --noEmit`; `vitest src/games/clap-syllables src/content` 99 tests (four new train tests: any loading order, ties, hint/ghost fits the next car over 200 seeds, generation over 500 seeds); `vitest src/games src/content` 1130 earlier; `npm run build` (shared voice and how-to files changed).
- At `http://localhost:5710`, `BROWSER_SUITE=clap CLAP_LEVELS=6` passed (two wrong cars: 2 misses, 1 hint and glow; free empty drop; three trains; one sticker; portrait fit); screenshots `clap-6` and `clap-6-portrait` reviewed. `BROWSER_SUITE=fingerdemo FINGER_ONLY=clap-syllables FINGER_LEVELS=6` passed in 47.8 s.
- Not run: levels 1-5 browser play (interactions unchanged), world/offline, iPad or device speech, a child's play ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-16 — Clap the Syllables level 9 Clap along short

- [PR #454](https://github.com/rjdunlap/neo/pull/454), `codex/clap-syllables-short`, dispatch `clap-short-20261016T151435Z`; tested `c0df9c3` (base `03e4f92`, including docs-only dispatch #453) plus implementation diff. Two seeded words, one/two beats; preschool order `[9,1,2]`, entry `[9]`, existing IDs/pins and other bands preserved.
- Passed typecheck, 59 focused tests (`clap-syllables/logic.test.ts`, registry and how-to), then 18 how-to tests after correcting the new support wording. 200-seed short-round generation and finger-count properties, entry/band landing and progression tested. Final build passed (existing chunk-size advisory).
- `GAME_URL=http://localhost:5196 BROWSER_SUITE=clap CLAP_LEVELS=9 npm run test:browser` passed: both guided words, quiet-time support replay free, bead per actual tap, result `[9,0,0]`, one sticker, portrait bounds. Reviewed `test-results/browser/clap-9-portrait.png`: picture, beads, pad, pet and corner controls clear. First passing probe had a no-op picture tap; tightened to prove the actual automatic replay and reran successfully.
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=clap-syllables FINGER_LEVELS=9` passed cleanly in 10.0 s. No page errors in either final passing run; owned Vite stopped after checks. Links and diff checked.
- Not run: full units, other levels/suites, world/offline (no save/navigation/assets changes), iPad/device speech/child play; [device checks](../DEVICE-CHECKS.md) remain open. No wrong answer or hint is possible in guided clap-along.

## 2026-10-16 — Clap the Syllables level 8 Longer or shorter?

- [PR #452](https://github.com/rjdunlap/neo/pull/452), `codex/clap-syllables-comparison`, tested `896b63e` (claim `88f0e8f`, base `42d18fd`, docs-only dispatch #451 integrated) plus implementation diff. Four seeded unequal pairs, alternating more/fewer; truthful whole-word counts, free replay, matching support and finger. School order `[5,6,8]`; other bands/IDs/pins unchanged.
- Passed typecheck, 57 focused tests (`clap-syllables/logic.test.ts`, registry, how-to); final how-to wording checked again (18 tests). Rule properties cover 500 seeds, uniqueness, both directions/answer positions, exact hint/finger answers and school order. Final `npm run build` passed (existing chunk-size advisory).
- `GAME_URL=http://localhost:5195 BROWSER_SUITE=clap CLAP_LEVELS=8 npm run test:browser` passed: four comparisons, free replay, two misses/one correct answer glow, actual taps via finger target, saved result `[8,2,1]`, exactly one sticker and portrait target bounds. Reviewed `test-results/browser/clap-8-portrait.png`: pictures, pet and corner controls clear.
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=clap-syllables FINGER_LEVELS=8` passed cleanly in 23.5 s. No page errors in either passing run. First attempt interrupted by a how-to HMR reload; repeated after source edits stopped. Owned Vite stopped after checks.
- Not run: full unit suite, levels 1–6 browser replays (existing evidence retained), world/offline (no navigation/save/assets changes), device speech/touch or child observation; [device checks](../DEVICE-CHECKS.md) remain open. Level 9 and other exclusions remain unbuilt. Links and diff checked.

## 2026-10-16 — Ecosystems subject research

- Docs only, base `1dea66f`, branch `codex/ecosystems-subject-research`: [study](../deep-dives/subjects/ecosystems.md), subject tracker, candidate notebook and roadmap definition packets. Data/AI literacy already had an uncommitted study elsewhere; ecosystems had no overlapping claim.
- Opened Head Start/NGSS anchors, NAEYC guidance, five digital and two physical references; unavailable research papers/PBS/LTER pages are marked as leads, redirects or failures, with no claimed effect estimates. No reference games played.
- Passed relative Markdown links (`node scripts/check-links.mjs`) and `git diff --check`. No typecheck/unit/build/browser/offline checks (research-only tier); no code changed or servers started.
- Pre-merge backlog refresh preserved the merged data/AI study, records 18 researched subjects and waves A–C researched, recognizes the independent earth-materials claim, and names body-health next. Integrated current main; links and diff checks passed again.
- Open: biology/content review, destination/ranges, free-trace adaptation, practical-card review, actual device/child/older-family play and learning transfer. Remote push/draft PR was initially rejected by automatic approval review; the developer subsequently authorized publishing the research branch and draft PR.

## 2026-10-16 — Photo Safari 7 Two clues, no name

- [PR #470](https://github.com/rjdunlap/neo/pull/470), `codex/safari-two-clues`, dispatch `safari-two-clues-20261016T201906Z`; tested `6e0eb30` plus implementation diff, including docs-only dispatch `7851b8a`. School range 4–7; earlier IDs/pins, younger ranges, level 5, journal and texture lifecycle retained.
- Passed typecheck, 7 Photo Safari rules and all 1408 unit tests; after adding pin/range and overlapping-circle boundary assertions, 26 focused Photo Safari/registry tests passed. Across 300 seeds, two action and two place matches yield one conjunction; four views check 160-unit spacing, 100-unit target areas, overlapping nearest taps and draw-order independence. Build passed with existing chunk-size advisory.
- `GAME_URL=http://localhost:5202 BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=4,7 npm run test:browser` passed: two wrong photos, automatic hint/glow, four-photo album, saved `[2,1]`, sticker, no page errors. Reviewed `test-results/browser/photo-safari-7-portrait.png`: two clear shared places, four separated animals, clear pet/corner controls.
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=photo-safari FINGER_LEVELS=7` passed cleanly in 14.4 s. Initial stalled demo was interrupted; a small probe found no actor tap listener and one shared-layer listener. Added the shared receiver while keeping the target tap. A source-comment HMR interrupted the next run; the frozen-source run above passed. Typecheck/build repeated after the receiver fix.
- Links/diff checked; owned server stopped after checking. Not run: other browser levels/suites, world/offline (navigation, persistence and assets unchanged), iPad speech/touch or child understanding. [Device checks](../DEVICE-CHECKS.md) remain open.

## 2026-10-16 — Photo Safari texture cleanup

- [PR #468](https://github.com/rjdunlap/neo/pull/468), `codex/safari-textures`, dispatch `safari-textures-20261016T192305Z`; tested `9f106b5` plus only the Photo Safari implementation diff. Integrated docs-only dispatch through `8d6a8d8`; no game dependencies changed.
- Passed `npm run typecheck` and `npx vitest run src/games/photo-safari/logic.test.ts` (5 tests).
- `GAME_URL=http://localhost:5201 BROWSER_SUITE=batch BATCH_ONLY=safari FROM_LEVEL=6 npm run test:browser` passed: two wrong snaps, existing hint/glow, four photos, album finale, saved `[2,1]` and sticker; no page errors. Initial sandbox Chromium launch denied, unsandboxed local run passed.
- Isolated `test-results/safari-textures.mjs` passed in-flight and partial-album exits: generated texture and GPU source destroyed, ownership array empty, repeated destroy safe, no page errors. Restoring the original empty `destroy` inside the test instance failed the release assertion, as expected.
- Not run: build/full units/world/offline/other games (no shared files, assets, saves or navigation changes), fingerdemo (bot/action unchanged), device or child checks. Existing device evidence remains open. Owned Vite stopped after checks.

## 2026-10-16 — Bouncy Launch 12 Planet Hop

- [PR #466](https://github.com/rjdunlap/neo/pull/466), `codex/planet-hop-12`, dispatch `planet-hop-20261016T182105Z`; tested claim `6f46532` (base `30233f5`) plus implementation diff; docs-only dispatch through `bbd5edf` integrated. School-only 12, same-pull toy-gravity comparison, three seeded pairs, unscored prediction/counted requested help. Existing IDs/pins, 1–7, younger bands, journal/saves and Cloud Hopper v1 preserved.
- Passed typecheck, 54 focused logic/course/registry/how-to tests, all 1405 unit tests and build. After adding explicit school order, younger-band/pin and top-level clamping assertions, registry's 18 tests passed. Course constants and landing mapping pinned; 300 seeds check distinct safe flags, both worlds, clear past/before separation and bot regions.
- `GAME_URL=http://localhost:5199 BROWSER_SUITE=arcade ARCADE_ONLY=launch FROM_LEVEL=12 TO_LEVEL=12 npm run test:browser` passed: three pairs, first guess deliberately different, actual pause-sheet hint, zero misses/one hint, saved sticker and no page errors. Reviewed `test-results/browser/bouncy-launch-12-portrait.png`: spring/pet, numbered flag and clear planet scenery/regions. The first play proved the shell lacked a child-level hint label; optional `Game.hintLabel` connects this level only, and the same regression passed after repair.
- Same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch FINGER_LEVELS=12` passed in 19.5 s without page errors. Sandbox Chromium launch failed before checking; elevated execution passed. Build ran because voice/how-to and the optional shell hint contract changed (existing chunk advisory).
- Links and diff checked; owned Vite stopped after checking. Not run: other game plays, full couch/world/offline (no couch, navigation, persistence or asset changes), iPad speech/sound/touch or child play. [Device checks](../DEVICE-CHECKS.md) stay open. Publication/deployment recorded separately in the queue.

## 2026-10-16 — Zoo animals subject research

- Docs only, base `ee89b32`, branch `claude/zoo-animals-subject`, [PR #462](https://github.com/rjdunlap/neo/pull/462): [study](../deep-dives/subjects/zoo-animals.md), subject tracker row, three notebook candidates and the roadmap packet. No overlapping claim found by `scripts/overlap.sh`.
- Opened NGSS K-LS1-1, 2-LS4-1, 3-LS3-1, 3-LS4-3 and MS-LS2-5, the England science programmes of study, two Smithsonian National Zoo pages, an OSU teacher page and a study record; AZA pages (403) and SAFE figures are marked search-only and unused. No reference games played.
- Passed relative Markdown links (`node scripts/check-links.mjs`) and `git diff --check`. No typecheck/unit/build/browser/offline checks (research-only tier); no code changed or servers started.
- Follow-up after the developer's habitat-kit decision (no zoo land): a [kit order](../deep-dives/subjects/zoo-animals.md#habitat-kits-order-lands-and-cast-swaps) with the lands each dresses and the games that swap cast; links and diff checked again.
- Open: a named reviewer for the trait table and conservation lines, captivity/extinction framing, how a kit shows (variant, time of day or permanent), Species Comeback's band, and any child, device or older-family play.

## 2026-10-16 — Barnyard land identity V1

- [PR #460](https://github.com/rjdunlap/neo/pull/460), `codex/barnyard-land-identity`, dispatch `barnyard-identity-20261016T171305Z`; tested `d4abb5b` plus scene/art diff. Integrated docs-only upstream through `3f261c5`. Only the Barnyard land scenery and first-session three-note greeting; input/layout/navigation/music loop untouched.
- Typecheck and final production build passed (existing chunk-size advisory). Full units initially had 10 failures under default parallel load; `npm test -- --maxWorkers=4` passed 1400/1401, with only unchanged Penguin Slide level-8 generation exceeding 5 s. That test passed alone (`-t 'level 8 combines useful' --maxWorkers=1`); focused lands tests passed 14/14 including all bands/four views. No game rule changes.
- `node test-results/barnyard-identity-probe.mjs`, isolated Chromium at `http://localhost:5198`: landscape/portrait reviewed, decorative event/layer order, real cow body touch, notes `[3,5,7]` on first entry only, repeat after session reset, other land unchanged and exit cancellation passed with no page errors. Earlier probes corrected a feet tap and HMR duplicate-module/reset interruption; final frozen-code run clean.
- Reviewed `test-results/barnyard-landscape.png` and `barnyard-portrait.png`: subdued barn, fence/straw above game row, visible pail beside cow, pet and corner controls clear. Owned Vite stopped. Links and diff checked.
- Not run: world/offline (no navigation/persistence/assets changes), game browser suites (no games changed), iPad/child recognition or audible device review; [device checks](../DEVICE-CHECKS.md) stay open.

## 2026-10-16 — Standards audit for new subject sessions

- Docs only, base `bff537a`, branch `claude/educational-game-subjects-1da8ca`: [standards audit](../deep-dives/subjects/standards-audit.md) and 20 new **not started** rows in the [subject tracker](../deep-dives/subjects.md#mathematics) (mathematics, language and literacy, languages/arts/thinking/natural world, including `zoo-animals`).
- Opened the Common Core math domain navigation, 6.RP and the practice standards, the ELA strand index and the ACTFL goal areas. Head Start ELOF (403), EYFS, IB PYP, C3, Core Arts, Jump$tart and zoo-program NGSS alignments came from search summaries and are marked secondary.
- Passed `node scripts/check-links.mjs` and `git diff --check`. No code changed; no typecheck, unit, build or browser runs (docs-only tier).
- Open: every new row's anchors must be opened at source by its own session; language choice, sign-language review and a zoo destination are developer decisions.

## 2026-10-16 — Body and health subject research

- Docs only, base `1fd4d39`, branch `codex/body-health-subject-research`, [PR #458](https://github.com/rjdunlap/neo/pull/458): [study](../deep-dives/subjects/body-health.md), subject tracker, candidate notebook, roadmap packets and open developer decisions. Twenty subject studies now recorded; inquiry is the next unclaimed science row.
- Opened Head Start/NGSS/NHES/NIH anchors, five first-party digital references and the PBS physical senses activity. Unopened BrainPOP/tactile-set pages remain leads; no reference games played. Practical care, sleep, food and hygiene advice remain explicit research/review gaps.
- Passed `node scripts/check-links.mjs` and `git diff --check`. No code/assets/scripts changed, servers started, or typecheck/unit/build/browser/offline runs (docs-only tier).
- Open: candidate identity/overlap, physiology/content and practical-card review, exact ranges/land capacity, exploration/adaptation, actual device/child/older-family experience and learning transfer. No game, new band or health guidance implemented.

## 2026-10-16 — Earth materials subject research

- Docs-only study: opened NGSS 2-ESS2-1, 4-ESS1-1/ESS2-1, MS-ESS2-1/2/3, USGS/NRCS and NAEYC guidance; five digital precedents plus physical references. Access failures and unplayed products explicitly marked.
- Proposed Sand Table dry-first ladder, Fossil Dig evidence round, Outcrop Detective event/ambiguity cases, later candidates and existing-game boundaries; every audience L–G and all three parent forms answered. Tracker/notebook/roadmap updated.
- Relative Markdown links and `git diff --check` passed. No implementation or reference-game play. No typecheck, unit tests, build, browser/offline or device checks run (docs-only tier).
- Open: geology/model and practical-card review, creative adaptation, band/land placement, device comfort, independent use, tween/parent appeal and transfer. Publication status is separate from this local research.

## 2026-10-16 — Tangram Town broom picture

- [PR #456](https://github.com/rjdunlap/neo/pull/456), branch `codex/tangram-two-piece-picture`, dispatch `tangram-picture-20261016T161705Z`; tested claim `33e2e4e` (base `d255ef9`) plus game diff; docs-only dispatch #455 integrated at `1e28b9c` without game changes. One two-piece broom, existing levels 1–3 only; pools 6/8/9, other pools unchanged.
- Passed `npm run typecheck` and `npx vitest run src/games/tangram-town/logic.test.ts` (14 tests). Dedicated handle/brush contact, non-overlap, bounds and pool-membership proof; existing all-picture seeded tests prove hint/bot completion, valid turns and both placement orders.
- `node test-results/tangram-broom-probe.mjs`, isolated Chromium at `http://localhost:5197`, forced a seeded broom in level 3: real quarter-turn taps and drags, no misses/hints, ordinary sticker and no page errors. Reviewed `test-results/tangram-broom-portrait.png`: joined shapes, pet, tray and controls clear. Sandbox initially prevented Chromium launch; elevated launch passed.
- How-to remains accurate (picture-independent drag/turn instructions). No new levels or interaction, so broad suites, build/offline and separate ghost-finger browser run not run; seeded bot rule coverage passed. No iPad, actual device speech or child-recognition evidence; existing person checks stay open. Owned Vite stopped after checking; links and diff checked.

## 2026-10-16 — Genetics subject research

- Docs only, base `2402c57`, branch `codex/genetics-subject-research`, [PR #476](https://github.com/rjdunlap/neo/pull/476): [study](../deep-dives/subjects/genetics.md), subject tracker, three notebook candidates, roadmap definitions and developer decisions. Current origin showed inquiry already researched; overlap check found no genetics claim.
- Opened four NGSS trait/inheritance anchors, NHGRI/NAEYC, six first-party digital descriptions/guides and Utah's paper activity. Developmental evidence is an indexed abstract only; game-shell/access failures are explicit. No reference games played.
- Passed `node scripts/check-links.mjs` and `git diff --check`. No code changes; no typecheck, tests, build, browser/offline or servers (research-only tier).
- Open: biology/wording review, exploration accounting, school/13+ entry and land fit; device/child/tween/parent understanding, demand and learning transfer unestablished. Nothing implemented.

## 2026-10-16 — Everyday life long ago subject research

- [PR #477](https://github.com/rjdunlap/neo/pull/477), `codex/daily-life-long-ago-subject-research`: added [study](../deep-dives/subjects/daily-life-long-ago.md) with opened curriculum/developmental/material-culture sources, five first-party digital references and physical precedents, every audience, eight candidates, an Attic Finds ladder and ordered definition/build slices. Real-history/community review and access/coverage gaps remain explicit.
- Updated tracker, notebook and roadmap; cross-linked the earlier Attic Finds proposal to prevent duplicate definitions. Initial tree clean; overlap found genetics claimed and this subject unclaimed. Integrated merged genetics research at `533437d`; preserved its proposals. Docs only: local relative links/anchors and `git diff --check` checked. No tests, build, browser suites, device/child/teen observations, practical-card review or learning-transfer claims.

## 2026-10-16 — Deep time subject research

- Docs only, base `2d7e623`, claim `2d53873`, `codex/deep-time-subject-research`, [PR #478](https://github.com/rjdunlap/neo/pull/478): [study](../deep-dives/subjects/deep-time.md), tracker, candidate notebook, roadmap definitions and developer decisions. Initial tree clean; no overlapping deep-time work; daily-life research already complete in PR #477.
- Opened four NGSS anchors, NAEYC, NPS/NHM/AMNH/Smithsonian sources, five first-party digital descriptions and NPS physical kit/program descriptions. Head Start and Identification Adventure access failures explicit; reference apps not played.
- Shared Fossil Dig E5/D1 first; Trackway Tales/Lost Layers and existing-game packs remain proposals, answering every audience and all parent forms. No ready-build additions or source changes.
- Passed `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, unit tests, build, browser/offline; no servers (research-only tier).
- Open: paleontology/model and practical-card review, extinction framing, creative/uncertain adaptation, exact ranges/land/identity, actual device/child use, older appeal and learning transfer. Publication is separate from local checks.

## 2026-10-16 — Additional subject gap review

- Compared the current tracker, original standards audit and existing game coverage with opened primary CCSS, National Core Arts Standards and National Agriculture in the Classroom pages. Added three unstarted research rows and an overlap/source review; no subject study or build is claimed complete.
- Explicit scope recommendations for geometry, visual art and engineering remain within their existing sessions. Research/build dispatch order unchanged.
- Passed local Markdown links/anchors and `git diff --check`. Docs only; no code tests, build, browser or device checks run. Developmental/competitor research and detailed agriculture outcomes remain for full sessions.

## 2026-10-16 — Subject docs completed-work cleanup

- Clarified that designed subject rows mean completed research, removed researched waves from the suggested research backlog, and refreshed the standards audit after the zoo study and language/habitat decisions.
- Updated space/physics references for built Planet Hop school level 12 and life-science/zoo references for Photo Safari’s built clues and actions. Other proposed modes, habitat kits and reviewer decisions remain open; dated research evidence is retained.
- Passed local Markdown links/anchors (`node scripts/check-links.mjs`) and `git diff --check`. Docs only; no code tests, build, browser or device checks run.
