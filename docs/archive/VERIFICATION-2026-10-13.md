# Verification history — 2026-10-13

## 2026-10-13 — Bouncy Launch last flight slice 3

- [PR #275](https://github.com/rjdunlap/neo/pull/275), claim `604bd31`, tested `fa15356` plus game/how-to/browser diff. Integrated coordinator dispatch `f918350` (docs only). Fading prior-flight arc, retained level-6 numbered flags, and compare miss ring at the last successful pull's radius; physics, course, bands and scoring unchanged.
- Typecheck, 24 focused Bouncy Launch/how-to tests and production build passed. `GAME_URL=http://localhost:5194 BROWSER_SUITE=arcade ARCADE_ONLY=launch FROM_LEVEL=5 TO_LEVEL=6` passed actual pulls, two compare misses/one preview hint, ring/arc/fade/resize assertions, retained flags, different prediction, saved scores/stickers and no page errors. First exact-float assertion corrected to tolerance; the passing run is authoritative.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch FINGER_LEVELS=5,6` at the same URL passed clean in 18.9/15.1 demo seconds. Bot unchanged. `test-results/last-flight-probe.mjs` inspected landscape compare and portrait prediction evidence; initial probe ran before profile readiness, corrected to harness setup. Both screenshots reviewed: ring/arc/flag clear, numbered flag above its cloud, shown pull preserved on resize.
- Markdown links retain one existing IDEAS anchor failure; changed links and diff check pass. Session server stopped. Not run: full units/browser suites, couch/course/offline (no changed rules, assets, persistence or navigation). Device speech, gesture comfort and child understanding remain open in DEVICE-CHECKS. Slice-2 notes/skies, new levels/bands and unresolved decisions excluded.

## 2026-10-13 — Jelly Drums level 10 (One big jelly)

- Built (on `claude/jelly-drums-one-big-jelly`, base `1c04ffc`): lap-only level 10, placed first (`order: [10,1,2,3]`, `entryLevels: [10]`). One big red low jelly; a touch anywhere sings the nearest awake jelly; jellies wake at 6, 10, 14 and 18 touches; 24 finish; no miss, no hint.
- Typecheck; full `npm test` passed (1,225 tests), including the new wake-plan rule tests.
- `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` passed levels 1–10 (loop now to 10, history count 10) at `GAME_URL=http://localhost:5391`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=jelly-drums FINGER_LEVELS=10` passed in 34.6 demo seconds. Portrait screenshots of the lone jelly and of three awake jellies reviewed.
- Not run: `npm run build`, the offline check, iPad, device speech, a child. Open: whether a one-year-old swats or looks first, and whether she waits ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

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

## 2026-10-13 — Five puzzles take keys and a finger in one round (Lands stage C1b, group 1)

- Built [PR #273](https://github.com/rjdunlap/neo/pull/273): picture-logic, island-bridges, pond-conga, sudoku-garden and word-search are `liveController`; an optional `Game.touchReturned()` (called by `GameScene` at the first pointerdown after keys) puts their touch layout back, so keys and a finger alternate in one round.
- `npx tsc --noEmit` clean; `npm test` 1,205 of 1,211 passed on the first run (ferry-jam, fluffy-salon, peg-garden and penguin-slide timed out under load while a browser suite ran; those four files pass alone, 44 tests); `input-in-use.test.ts` now lists seventeen live games.
- New `BROWSER_SUITE=livekeys` (port 5291, headless Chromium): each of the five at its first couch-played level goes touch → key → touch → key → touch with the touch layer visible again, no page errors; `congatouch` passed after the change.
- Not run: the other four touch suites, `world`, build, offline (no shared assets or navigation changed). Open: a real keyboard or pad on a device; groups 2 and 3 of C1b (tile-pairs, gem-swap, lantern-lights; ferry-jam, penguin-slide, bouncy-launch); the cursor ring stays drawn after a finger returns.

## 2026-10-13 — How-to intro card fits at Beat Builder's long levels

- Beat Builder's level 3 card ended at 871 of 768 units (`howto` failure on `origin/main`): its four steps, finish and note ran 920 characters in a 588-unit column beside the demonstration window, with empty space under the window. Changed: Beat Builder's step and note text trimmed (levels 1, 3, 5, 8, 9), rows below the demonstration now run the full card width, and the window may shrink to 0.7 of its size (280 units, over the 240 floor); a new unit test caps a card at 840 characters across every game and level.
- Ran: typecheck; `src/content` vitest (79 passed); `BROWSER_SUITE=howto` with `HOWTO_ONLY=beat-builder HOWTO_LEVEL=1,5,8,9` and then the full `howto` suite (90 games, landscape and portrait) at `GAME_URL=http://localhost:5291`, all passed. Not run: the other suites (no shared logic besides the intro card's layout).

## 2026-10-13 — Sing-Along Barn second tune (Hot Cross Buns)

- Built [PR #277](https://github.com/rjdunlap/neo/pull/277): each round sings Old MacDonald (notes unchanged) or *Hot Cross Buns*, drawn from the round's seed (`pickTune` in `logic.ts`; the song is now a `Tune`). Hot Cross Buns is E D C twice, then "One a penny, two a penny, hot cross buns" for each friend, who answers on the last "buns" and stays at the door about 0.7 s (6 + 11 notes per friend). No new level; no saved level or pin moved; she does not pick the tune yet.
- Typecheck; `npx vitest run src/games/sing-along-barn src/content src/games/registry` passed (18 rule tests in `sing-along-barn`: Old MacDonald unchanged, one note per syllable, pentatonic only, one answer per verse, the seeded draw gives both tunes).
- `BROWSER_SUITE=singalong` (now relaunches until a round sings the tune under test; new Hot Cross Buns level-2 round and a portrait screenshot) passed at `GAME_URL=http://localhost:5191` on the branch commit; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn` passed (level 1 32.5 s, level 3 53.6 s, under the 75 s limit).
- Not run: `npm run build` (no shared files changed), iPad, device speech, a child. Open: the Hot Cross Buns notes were written from the tune's standard form and match two web sources (pianocoda.com, C major, public domain; singing-bell.com "C pentatonic"), not a printed score ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-13 — Focus rings on the map and the lands (Lands stage C2)

- Built [PR #271](https://github.com/rjdunlap/neo/pull/271): `src/app/screen-keys.ts` (`SpotFocus`, `ScreenKeys`) gives the map and every land a focus ring on keys or a pad, `App.input` shares an `InputInUse`, Backspace or B backs out of a land, and the pause sheet's buttons get a visible `:focus-visible` outline. The chooser's Enter still opens couch play; the home spots, picnic, stickers, treehouse, journal and hatching have no ring yet.
- Tested on base `e96fca8` plus the working diff at `GAME_URL=http://localhost:5191`: typecheck; `npm test` 141 files, 1,210 tests (new `screen-keys.test.ts`, 7 cases); `npm run build`; `BROWSER_SUITE=world` passed (about 9.5 minutes).
- New `BROWSER_SUITE=landkeys` passed: the ring is hidden for a finger, the first key only shows it, arrows move it, Backspace does nothing on the map, a held Enter (with auto-repeat) through map-to-land does not act in the land, Enter on the host suggests a game, a tap works with the ring showing and hides it, Backspace returns to the map; one landscape and one portrait screenshot of each ring inspected.
- Not run: production offline check (no persistence, asset or route change), `couch`/`couchcourse`. Open: a real keyboard or pad on an iPad or TV ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); Chrome automation only synthesises keys.

## 2026-10-13 — Bouncy Launch level 7 (Feed the friend)

- Uncommitted tree on `main` at `e671bf3`; pre-K and school only (prek order 3,4,7,5; school 4,5,7,6). A seeded bunny or duck stands on the grass (three shots, spots in 0.12-0.92 of the strip, at least 0.2 apart); landing within +-0.09 feeds it; a miss says short or long, the arc and a puff ring stay, and two misses count one hint with the preview and a pull ring. Numbered 7 (next free ID); the deep dive's number 8 is now free for Near or far.
- Typecheck and the full unit suite (142 files, 1230 tests) passed, including new rule tests: spots seeded, in range and apart; every spot reachable inside the leash; a correction from a miss lands; the bot's pull feeds every friend.
- `GAME_URL=http://localhost:5291 BROWSER_SUITE=arcade ARCADE_ONLY=launch FROM_LEVEL=7 TO_LEVEL=7` passed four times (two misses, one hint, then every friend fed); portrait screenshot checked. `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch` passed (level 1 in 12.7 s, level 7 in 12.3 s).
- Not run: build, offline, world, couch. Open: a real iPad pull, device speech for the new lines, a child's reaction.

## 2026-10-13 — Pyramid Solitaire first slice and local-build audit

- [PR #282](https://github.com/rjdunlap/neo/pull/282), claim `0db5c75`, base `56132bc` plus working diff: touch-only Lantern Lake practice pyramids, three seeded face-up steps, exact clearing/recovery hints, free revision, spoken/how-to support and ghost finger.
- Own-worktree `npm ci` completed; `npm test` passed 143 files / 1,234 tests; 49 focused rules/registry/lands/how-to tests passed again after the registry assertion; final `npm run build` passed including typecheck (existing bundle-size warning).
- `GAME_URL=http://localhost:5188 BROWSER_SUITE=pyramid` passed first/last actual taps, required mismatched pair, hint/repeated hint, Undo/Start over, legal dead-end recovery, portrait targets/screenshots, one sticker each, land launch and held-home interruption. An earlier harness call treated the home button as a function; corrected before the authoritative final pass.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=pyramid-solitaire` passed levels 1/3 clean in 7.4/19.3 demo seconds. Portrait screenshots inspected. No world/offline/couch/full release or device checks run; iPad comfort, speech and enjoyment remain open.
- Docs audit records source evidence for local Snowball Merge, original six-level and duplicate three-level Marble Jump, and Log Roll in [LOCAL-GAME-BUILDS.md](../LOCAL-GAME-BUILDS.md). These await integration and are excluded from catalog counts; Number Nook is integrated. Their game checks were not rerun here. Markdown links/anchors and `git diff --check` passed; oldest dated entry rotated into the existing archive and moved links repaired.

## 2026-10-13 — Brain Break number-order first slice

- [PR #284](https://github.com/rjdunlap/neo/pull/284), base `dee1439`, claim `8459be6` plus working diff: new Lantern Lake touch/mouse game, seeded 1–9/16/25 boards, visible/spoken target, checked stones, counted help and a ghost finger. Number order is built; color words and quick sums remain proposals.
- `npm run typecheck`, 30 targeted Brain Break/registry/lands tests, `npm test -- --maxWorkers=2` (144 files / 1,237 tests), and `npm run build` passed. The default 144-worker unit run had nine resource/timeouts; bounded concurrency resolved them.
- `GAME_URL=http://localhost:5184 BROWSER_SUITE=brainbreak` passed levels 1/3, two wrong taps and automatic hint, manual hint, free checked-stone taps, portrait and one sticker per round, with no page errors. Portrait screenshot reviewed: board, pet and help clear.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=brain-break` passed levels 1/3 clean in 14.4/43.2 demonstration seconds. Server stopped after checks; origin/main overlap recheck remained `dee1439`, with only this slice's PR claiming Brain Break.
- Not run: `world`, offline, couch or device checks (existing shell; no persistence, assets or navigation logic changed). iPad target feel, number legibility, device speech and grown-up enjoyment remain open. Markdown links and `git diff --check` checked at closeout; oldest live entry rotated to the existing archive.

## 2026-10-13 — Mossy Path first slice

- [PR #285](https://github.com/rjdunlap/neo/pull/285), base `4af7354`, claim `a2a7757` plus working diff: school levels 1–3 in Puzzle Peaks, path coverage, free revision/dead ends, exact-search recovery, counted help and a real-tap ghost finger.
- `npm run typecheck`, all 1,241 tests in 145 files, 49 focused rules/catalog tests and `npm run build` passed.
- `GAME_URL=http://localhost:5187 BROWSER_SUITE=mossypath` passed level 1/3 gameplay assertions: two wrong taps, automatic/requested/repeated help, Undo/Start over preserving support, free dead ends, hint recovery and one sticker each. Its final navigation step timed out because it tapped held Home; isolated probe confirmed a tap stays in the round and a 750 ms hold returns. Corrected `MOSSY_ONLY=navigation` passed land launch/return with no page errors.
- Same URL: `fingerdemo FINGER_ONLY=mossy-path` passed levels 1/3 clean in 7.8/17.3 s; `lands LANDS_ONLY=puzzle-peaks` passed all six bands landscape and lap/school/grownup portrait, signpost/host/twinkle. Game portrait and landscape screenshots reviewed: targets at least 100 logical units, board/buttons and pet clear.
- `GAME_URL=http://localhost:4187 npm run test:offline` passed against matched production asset `index-BqWRULCQ.js`: cached reload/assets, map/home, how-to/Play, generic existing-game completion/reward/save, picnic, creations and journal. This does not establish Mossy Path play offline specifically.

## 2026-10-13 — Sing-Along Barn level 6 (the whole Old MacDonald verse)

- Built level 6 (pre-K now 3–6): like level 5 with two friends, and Old MacDonald is the whole verse (the moo-moo lines, then the first line again; the friend sounds on every moo); 47 notes per friend, 59 for one, 106 for two. Hot Cross Buns unchanged. The how-to demonstration sings the short form with one friend (the full verse at the card's finger pace overran 75 s on the first attempt), so it does not show the moo-moo lines.
- Typecheck; vitest for `sing-along-barn`, registry and content passed. One scripted portrait play of level 6 (full Old MacDonald, two friends, 106 taps, sticker, no page errors). `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn FINGER_LEVELS=6` passed at 36.1 s (limit 75 s).
- Not run: `npm run build`, the offline check, the `singalong` suite (not extended for level 6), a screenshot of level 6, device speech, iPad, a child. Open: the moo-moo melody was written from memory of the tune's shape, not a printed score ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).
