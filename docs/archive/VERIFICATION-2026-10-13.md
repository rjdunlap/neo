# Verification history — 2026-10-13

## 2026-10-13 — Island Bridges by touch (Lands stage D)

- Built [PR #256](https://github.com/rjdunlap/neo/pull/256): Island Bridges plays by touch at all four levels (tap the water between two islands, Take off switch, Hint, Start over; targets of 64 units or more, beside the sea or under it), a ghost finger, a touch how-to card and spoken lines, `edgeAt`/`waterOf`/`headStart` in `logic.ts`. The couch layout and rules are unchanged.
- Typecheck; full vitest passed (139 files, 1,168 tests, four new `touch` rule tests: every cell of water belongs to its bridge, a shared cell gives the bridge with planks, the bot's point is its own, the demonstration's head start). Browser runs at `GAME_URL=http://localhost:5197`: new `BROWSER_SUITE=bridgestouch` (levels 1 and 4: a stray plank is one miss, Take off lifts it free, one hint, start over, one sticker each, targets of 64 or more sideways and upright, from Lantern Lake and leaving mid-round); `fingerdemo FINGER_ONLY=island-bridges` (9.4 s and 10.5 s); `howto HOWTO_ONLY=island-bridges` (the first text overflowed the card by under 4 units and was shortened); `couchgames COUCH_ONLY=island-bridges`; `lands` (its controller-only count now comes from the registry instead of a literal one, which each puzzle's touch slice would have had to edit; Sudoku's was 4, Word Search's 3). Screenshots checked: the 11 by 11 sea sideways and a 7 by 7 sea upright.
- `npm run build` passed. `bridgestouch` passed five runs in a row after the first run's test fix (a stray plank's bridge could be the first bridge the test then laid on). Not run: `couchbridges` (couch code path unchanged), `world`, offline. Open: a real iPad and finger on the 64-unit water, device speech for the two new lines, and whether a stray plank should count as a miss at all (the couch rule, carried over).

## 2026-10-13 — Block Tower mirrored reach definition (docs only)

- Defined [slice 5 at existing level 6](../deep-dives/block-tower.md#build-slices-in-order), [PR #254](https://github.com/rjdunlap/neo/pull/254): signed table half-plane, canonical outward coordinates, reflected drop/solver/hint/bot domain and one seeded right/left side order across the original two tasks. Definition ready; implementation unbuilt.
- Retained `(2 blocks, 4 eighths)` then `(3 blocks, 5 eighths)`, immediate stable prefixes, early reach, strict support edges, current misses/one hint per task, band/level IDs and one shell reward. No open developer decision was resolved.
- Source audit/definition on base `7c7e17c`, claim `59195ce` plus final docs diff; read current rules, reach interaction/accounting and existing rule tests without executing or changing them. Tracker and queue identify the same definition/dispatch.
- Checked local Markdown files/anchors and `git diff --check`; future mirror properties and filtered reach/demo/portrait checks are specified as implementation exit evidence, not claimed as passed.
- Not run: typecheck, unit tests, build, browser, demos or offline (docs-only tier). No source, scripts, assets, tests, storage or runtime changes; no servers started. Existing device speech, iPad dragging and child-fit checks remain open.

## 2026-10-13 — Sudoku Garden by touch (Lands stage B)

- Built [PR #252](https://github.com/rjdunlap/neo/pull/252): Sudoku Garden plays by touch at all six levels (square tap, number tray, Marks, Erase, Hint, Start over; targets of 64 units or more beside the bed or under it), a ghost finger, a touch how-to card and spoken line, `GameContext.demo` with `shortBed` for the demonstration. The couch layout and rules are unchanged.
- Typecheck; full vitest passed (139 files, 1,160 tests, one new: `shortBed`); `npm run build` passed. Browser runs at `GAME_URL=http://localhost:5192`: new `BROWSER_SUITE=sudokutouch` (levels 1 and 6: a wrong number is one miss, Erase takes it out, Marks, one hint, start over, one sticker each; every cell and tray target at least 64 units and apart, sideways and upright); `fingerdemo FINGER_ONLY=sudoku-garden` (33.5 s and 32.6 s; before `shortBed`, level 1 took 45 s and level 6 could not finish inside 75); `howto HOWTO_ONLY=sudoku-garden` (the first text overflowed the card by 4 units with the demonstration window, so it was shortened); `couchgames COUCH_ONLY=sudoku-garden`; `lanterntouch` and `lands` (Lantern Lake) after changing their controller-only example to Picture Logic and four controller-only puzzles. Screenshots checked: the 9 by 9 bed sideways and upright.
- The `howto` suite was stale on `main` (fifteen couch games became twenty-three; its demonstration block picked controller-only games that open couch play) and was repaired here. Not run: `couchbeds` (couch code path unchanged), `world`, offline. Open: a real iPad and finger on the 64-unit squares, device speech for the new line, and the wrong-digit miss decision.


## 2026-10-13 — Penguin Slide 8 and Tangram Town 7

- [PR #262](https://github.com/rjdunlap/neo/pull/262), base `e2f04ff`, claim `ec3a2f5` plus implementation diff: useful block/snow stops with two fish at Penguin 8; alternative square/two-triangle house-wall covers at Tangram 7. School maxima 8/7; younger bands, saved IDs/pins and courses preserved.
- Typecheck and 38 focused Penguin/Tangram/how-to tests passed; production build passed on final source. Rules cover seeded solvability, useful block/snow choices, equal wall geometry, every compatible partial cover, either completion and helpful non-overlapping choices. Initial five-second Penguin batch timeout followed adding the richer generator; a 20-seed probe passed under one second and the two 150-seed aggregate tests now allow 15 seconds. The first five-step Penguin card was shortened to four and passed.
- `GAME_URL=http://localhost:5198 BROWSER_SUITE=creative CREATIVE_ONLY=tangram FROM_LEVEL=6 TO_LEVEL=7` passed fixed-slot regression plus both level-7 covers, wrong-shape misses, automatic and requested help, free unused-square drop, compatible triangle hint, portrait and saved results/stickers. `BROWSER_SUITE=woods WOODS_ONLY=penguin FROM_LEVEL=8 TO_LEVEL=8` passed pushes/snow, undo, one hint, both ponds and saved result/sticker. No page errors.
- Same URL: `fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=8` and `FINGER_ONLY=tangram-town FINGER_LEVELS=7` passed cleanly in 18.1/13.8 demo seconds. Both portrait screenshots reviewed: clear board/tray, spare pieces, pet and controls. No unchanged suites repeated.
- Local Markdown file/anchor checks and `git diff --check` passed; session server stopped. Not run: full local units, world, couch/courses or offline (no navigation/save/asset changes). Actual iPad input/speech and child understanding of alternative covers and combined stops remain open.


## 2026-10-13 — Penguin Slide level 7: two fish and a block

- [PR #261](https://github.com/rjdunlap/neo/pull/261), base `9d3eb4b`, claim `e2ec5d7` plus implementation diff: two 6×5 ponds, two fish, one movable block, four rocks, no soft snow and 4–6 shortest slides. School maximum 7; younger windows and saved IDs/pins unchanged.
- Typecheck, focused Penguin/how-to tests (26 passed), and production build passed. Rules cover all plans/seeds, disjoint objects, shortest solutions, useful block pushes (frozen blocks worsen or prevent completion), hints and actual ghost-finger tap directions; new top-level test collects both fish with decreasing solution distance and a push.
- `GAME_URL=http://localhost:5198 BROWSER_SUITE=woods WOODS_ONLY=penguin FROM_LEVEL=7 TO_LEVEL=7` passed: tap steering, bumps, pushes, wandering/one hint, undo, both ponds, saved result and sticker, no page errors.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=7` passed cleanly in 19.8 demo seconds. Portrait `test-results/browser/penguin-slide-7-portrait.png` reviewed: block/fish/rocks and undo clear of pet/corner buttons.
- Local Markdown file links and `git diff --check` passed; session server stopped after checks. Not run: full local units, world, couchcourses or offline (existing interaction, no navigation/save/asset changes). Real iPad taps, device speech and child planning remain open.


## 2026-10-13 — Tangram Town robot picture

- [PR #260](https://github.com/rjdunlap/neo/pull/260), base `eca0d43`, claim `7adc8b1` plus implementation diff: robot at existing levels 5–6, seventeen pictures across pools of 4–9. Content/level description only; interaction, bands and saves preserved.
- `npm run typecheck` and `npm test -- src/games/tangram-town/logic.test.ts` passed (8 tests across every authored picture: non-overlap, bounds, pool contracts, seeded trays, hints and ghost-finger solutions).
- `node test-results/tangram-robot.mjs` at `GAME_URL=http://localhost:5198` forced the robot in an isolated context, then used real quarter-turn taps/drags at 5 and 6: both completed with zero misses/hints and no page errors. Initial probe timed out; a per-piece logging probe with 600 ms settlement waits completed every slot. Chromium required sandbox escalation.
- `test-results/tangram-robot.png` reviewed: square head, body and separate feet read clearly, with the completed picture clear of controls/tray. Local Markdown links and `git diff --check` passed; session server stopped after checks.
- Not run: full units/build/browser suites, standalone fingerdemo, world/offline (game data only; existing geometry/bot rule tests cover the new content). Real iPad/child recognition and speech remain open.


## 2026-10-13 — Block Tower mirrored reach at level 6

- [PR #259](https://github.com/rjdunlap/neo/pull/259), base `4ead39a`, claim `1fa37ca` plus implementation diff: seeded opposite table edges at existing level 6, canonical snapping and reflected table/star/drag/help/bot/fall. Original tasks, accounting, saved IDs/bands and one reward preserved.
- Typecheck, full unit suite (139 files / 1,178 tests), focused Tower rules (17 tests; exhaustive offered prefixes up to both budgets, strict support, mirror projection/rounding, frozen side orders, solver/help recovery and early reach) and production build passed. After the resize-only change, focused rules/typecheck/build passed; unchanged rules/full-suite evidence reused.
- `GAME_URL=http://localhost:5194 BROWSER_SUITE=shortlist SHORTLIST_ONLY=tower FROM_LEVEL=6 TO_LEVEL=6 TOWER_SEED=7` and `TOWER_SEED=1` passed opposite side orders, cancellation, landing lock/resize, top lifting, a topple and full-short miss, one counted hint, top recovery and exactly one saved result/sticker. Seed 7 passed again on final code with hint-resize assertion; no page errors.
- Same URL: `fingerdemo FINGER_ONLY=block-tower FINGER_LEVELS=6 TOWER_SEED=1` / `7` clean in 15.5 / 15.6 demo seconds. Left-edge portrait reviewed: table extends inward, blocks/star/help clear of pet and controls. `test-results/tower-hint-resize.mjs` first failed on stale hint position, then passed after projection during resize. Initial short-stack browser assertion ran before speech/help finished; waiting for idle corrected it.
- Markdown file/anchor checks and `git diff --check` passed. Session server stopped after checks. Not run: world, couch or offline (no route/save/asset contract changes). Device speech, iPad dragging and child understanding of the mirrored edge remain open.

