# Verification 2026-10-20 (archived entries)

## 2026-10-20 — Ramp Race truthful support (inquiry Q2)

- Built the [Q1 definition](../definitions/ramp-race-support.md) ([PR #624](https://github.com/rjdunlap/neo/pull/624), commit cca1599b): `classifyFair`, `fairRepair` and `fairLine` in `logic.ts`; `rampTouch` in fair mode never returns null, so the ghost finger repairs any unfair pair within three taps; at level 4 the second unfair Check turns on a corrective glow on the orange lane (`ramp.fairhint`), a wrong-only pair hears `ramp.wrong.*`, and the finish lines, how-to card and co-play tip are truthful. Accounting is unchanged (level 4's hint on every unfair Check from the second is recorded, not fixed).
- Ran `npm run typecheck` (clean); `npx vitest run src/games/ramp-race src/content/howto` (26 passed, with four new rule tests); `npx vitest run src/content src/games/registry` (passed).
- Ran `BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=4` (both-changed then wrong-only Check with their spoken lines, the glow, a third unfair Check counted as a hint with no re-announcement, the repaired pair ringing go, the glow cleared on the next question, final score [3, 2]; screenshot `test-results/browser/ramp-race-4.png`) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ramp-race FINGER_LEVELS=4` (clean, 16.8 s), both at `http://localhost:5796`.
- Not run: build (no shared asset changed), browser play of levels 1–3 (interaction unchanged; finish line and card text only), navigation, offline, device speech.
- Open: whether a child connects the orange glow to "change this" and whether device speech reads half-marks ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the level-4 hint count per question stays with [inquiry decision 1](../deep-dives/subjects/inquiry.md#decisions-for-the-developer).

## 2026-10-20 — Fill and Dump count sign (slice 1)

- Built [slice 1](../deep-dives/fill-dump.md#build-slices-in-order) ([PR #626](https://github.com/rjdunlap/neo/pull/626), commit 5a596101): at levels 3–4 a dot card left of the basket fills as fruit goes in and shows extras below it (`countSign` in `logic.ts`, `CountSignCard` in `index.ts`, two how-to lines, the `originals` fill case now asserts the extras appear and leave); check and accounting unchanged; levels 1–2 and 5 have no sign.
- Ran `npm run typecheck` (clean); `npx vitest run src/games/fill-dump src/content` (105 passed, with the new count-sign rule test); `GAME_URL=http://localhost:5471 BROWSER_SUITE=originals ORIGINALS_ONLY=fill FILL_LEVELS=3,4 node scripts/browser-check.mjs` (levels 3 and 4, level 4 in portrait; `test-results/browser/fill-dump-4.png` reviewed: the sign sits clear of the corner buttons).
- Not run: fill levels 1, 2 and 5 (unchanged code), `fingerdemo` (the bot's action is unchanged), build (no shared file or asset changed), any device check.
- Open: a person has not watched a toddler read the sign.

## 2026-10-20 — Roundup support truth (slice 1)

- Built [slice 1](../deep-dives/roundup.md#build-slices-in-order) ([PR #627](https://github.com/rjdunlap/neo/pull/627), commit 7786d03e): the trot-home counts a hint, dot signs at levels 5-6, level 1 answers grass and sign taps without a miss, pens' totals spoken at a right bell, per-round seeded start layout, one how-to note.
- Ran `npm run typecheck` (clean); `npx vitest run src/games/roundup src/content` (94 passed, new startSpots, signDots and singular-animals tests); `GAME_URL=http://localhost:5392 BROWSER_SUITE=arcade ARCADE_ONLY=roundup` on the working tree (all six levels passed; `test-results/browser/roundup-6.png` shows dot signs). Two script fixes were needed first (tap whichever animal is still loose; stop the overshoot loop when none is): earlier runs failed at levels 1 and 5 on the old fixed-layout assumptions.
- Not run: `fingerdemo` (bot unchanged), build (no shared asset), device checks.
- Open: whether a lap child notices the grass hop, and how the spoken totals sound on a device.

## 2026-10-20 — Song Maker support truth (slice 1)

- Built [slice 1](../deep-dives/song-maker.md#build-slices-in-order) ([PR #628](https://github.com/rjdunlap/neo/pull/628), commit 72d2b51f): each bead's hit area is its whole grid cell (levels 5–6 were about 91–92 units, now at least 101 in 1024×768), `songLayout(plan, view)` moved into `logic.ts`, and the levels 1–2 how-to note is conditional on two lit jellies. IDs and accounting unchanged.
- Ran `npm run typecheck` (clean); `npx vitest run src/games/song-maker src/content` (10 files, 93 passed; new test: every level's cell at least 100 and the grid inside its margins in 1024×768, 1024×1365 portrait and 1660×768); `GAME_URL=http://localhost:5409 BROWSER_SUITE=fourth FOURTH_ONLY=song` (levels 1–7 passed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=song-maker FINGER_LEVELS=6` (clean, 10.0 s); a one-off probe tapping a level-6 song note 0.47 cell off-centre diagonally lit it with no miss (cell 101.1).
- Not run: restoring the old rule to watch a check fail (the attempt errored from an HMR reload, inconclusive), build (no shared file or asset changed), device touch check.
- Open: whether the larger beads feel right under a small finger on an iPad.

## 2026-10-20 — Rework at the site root, island game at `classic/`

- Two-page build (`claude/routines-art-rework-deploy-90743f`, base `c54308f3`): the root boots the creature preview (`src/rework.ts`) with an "Island games" link; `classic/` boots the island (`src/main.ts`) with its own manifest and an explicit root service worker. Harnesses add `classic/` to a bare `GAME_URL`. READY gains RW13 (island revamp location packet) and RW06 definitions and RW05 slice 2.
- Ran typecheck, `npm test` (163 files, 1528 passed), `npm run build`, `test:offline` against the production preview on port 4391 (bare origin, so `classic/`; passed twice, before and after the manifest change), `BROWSER_SUITE=world` on dev port 5391 (passed, 7:57), and one root screenshot in the browser pane.
- Not run: other suites (no game changed), an iPad home-screen install from `classic/`.
- Open: on the iPad, a copy saved from the old root URL now opens the preview; re-add it from `classic/`.

## 2026-10-20 — RW13 island revamp location packet (docs only)

- Defined RW13 in [the packet](../rework/ISLAND-REVAMP.md) on `claude/rw13-island-revamp-packet` ([PR #631](https://github.com/rjdunlap/neo/pull/631)): the eleven land IDs kept with an ecosystem each, five proposed game moves (none made yet), residents, backdrop art queue R23/R26 and ordered build slices; WORK-ITEMS, READY and QUEUE updated.
- Ran `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean). Typecheck, unit tests, build and browser suites not run: no code changed.
- Open: slice 1 is next; the generated backdrops (R23, R26) stay blocked on the art decision.

## 2026-10-20 — RW05 slice 1: the collection model and Friends

- Built on `claude/rw05-collection-friends-400e40` ([PR #630](https://github.com/rjdunlap/neo/pull/630)): save v3 `creatures`, `store.meet/choose`, the species table and `Companion`, the R08/R18 egg hatch, Friends from the treehouse basket, the guide, chooser and island scenes on the companion. Differences from the packet (preview kept, no mood-follows-play, hue rotation not tint, portrait cards, Back only, v2 profiles meet the egg again) are in [the packet](../rework/CREATURE-COLLECTION.md#built-slice-1-2026-10-20).
- Tested at `199994ed`/`3da459ad` on dev port 5193 and a production preview on 4193: typecheck clean, `npm test` (165 files, 1547 tests), `npm run build`; `world` (after one harness fix: it read the old pip's `spec.color`); the new `friends` suite (hatch Mochi, river Pebble via `kit.store.meet`, basket, Friends, preview saves nothing, Come with me, reload, second profile, reset/undo; four screenshots); `early` filtered `EARLY_ONLY=bath` (Splish Splash 1-9, passed on the rerun; the first run hit the known level-7 harness flake); `shortlist` filtered `says` (Pet Says 1-5); `test:offline` (seeds a v3 save with two friends; sprites, portraits, card paper and egg precached).
- Not run: couch suites (only constructor calls changed), `fingerdemo`, other game suites, any device check.
- Open: [device checks](../DEVICE-CHECKS.md) (boot cost, hue filter, speech, recognition, basket, eight colours); slice 2 moves the ten large-pet games.

## 2026-10-20 — RW06 prep: wearables fit

- Cut the nine R04–R05 wearables at `--shrink 3` (new `--hole` option), added `wearables.ts`, per-species wear tables and `IllustratedCreature.pin/unpin`, and a root-preview button cycling items and outfits on the illustrated column ([PR #632](https://github.com/rjdunlap/neo/pull/632); verdict in [the fit](../../src/art/creatures/wearables/README.md#the-fit-on-the-pilot-three)).
- Ran typecheck (clean), `npx vitest run src/art/creatures scripts/creature-art` (55 passed, new `wearables.test.ts`), the pilot sprites re-cut byte-identical, one preview probe of every look in landscape and portrait (no console errors) at `http://localhost:5731`, and `npm run build` (99 precache entries, 9.0 MB after merging RW05 slice 1, wearables about 1.0 MB); after the merge also full `npm test` (166 files, 1561 tests) and a preview re-probe.
- Not run: browser suites (no island code changed), offline check, iPad look, a child's reaction.
- Open: angle misfits go to queue row R19 for re-drawing.

## 2026-10-20 — RW02b step 3: the second-wave six

- Prepared Tote, Trill, Dapple, Bramble, Mossback and Lumen (40 PNGs in `src/art/creatures/cast/`), rigged them in `src/art/creatures/cast.ts` and added the dev-only preview `/?cast` ([PR #633](https://github.com/rjdunlap/neo/pull/633); [result](../rework/GENERATED-CREATURE-PILOT.md#step-3-result-2026-10-20)).
- Ran typecheck (clean), `npx vitest run src/art/creatures scripts/creature-art` (7 files, 99 tests), a preview probe at 1024 x 768 and 768 x 1024 on a dev server (every creature reacts to a real tap, touch radius 115-153 units, mood and dress buttons work, misfits marked, no page errors), and `npm run build` (99 precache entries, 9244 KiB, no cast assets or preview code in `dist/`).
- Not run: full `npm test`, browser suites, offline check (no production asset or navigation change); no iPad look, frame rate with six meshes not measured, child appeal not established.
- Open: the scarf on side-on species reads as a throat band (R19); alt poses are stills only; hit circles and slots read by eye.

## 2026-10-20 — RW13 slice 1: catalog moves and Painted Canyon

- Built on `claude/rw13-catalog-moves` ([PR #634](https://github.com/rjdunlap/neo/pull/634), code `5b33f8f3` on `a2d1613b`): five `LANDS` moves (owl-walk to Story Grove, habitat-helpers to Rainbow Meadow, sink-float to Bubble Beach, sing-along-barn and orchard-rows to Barnyard) and Paint Pier renamed Painted Canyon in `lands.ts`, `world.ts` and the `subject.art` line.
- Ran `npm run typecheck` (clean), `npm test` (1604 of 1605; every lands and registry test passed, including the layout at every band) and `npm run build`. The one failure was the RW02b illustrated tote "never tears the picture" test in `src/art/creatures/cast.test.ts` (expected 2.225 < 2), unchanged code from #633; it passed once and failed on two isolated reruns, so it is recorded as a known flake.
- Not run: browser suites (no membership expectation broke, so the conditional `world` visit was not needed), offline check, any device look.
- Open: the map still draws a pier landmark for the Painted Canyon land (`pier()` in `src/art/lands.ts`) until the backdrop slices; the tote flake is undiagnosed.

## 2026-10-20 — Algebra and balance subject study (docs only)

- Docs only: [study](../deep-dives/subjects/algebra-balance.md) on `claude/subject-algebra-balance-finish` ([PR #621](https://github.com/rjdunlap/neo/pull/621)), superseding the claim in [PR #604](https://github.com/rjdunlap/neo/pull/604). Anchors opened as listed in the study (CCSS 1.OA–8.F, England's algebra statements, Knuth et al. 2006 through its abstract, DragonBox, Function Machine and Zoombinis pages); the PhET pages gave only titles and no reference game was played.
- Proposes Rule Machine (levels 1–8), Box Balance (13+), Seesaw Balance 18, Pattern Train *Two trains* and Fruit Sums *Both trees*. Packet in [RECOMMENDATIONS.md](../deep-dives/subjects/RECOMMENDATIONS.md#algebra-and-balance-recommendations); tracker, roadmap, IDEAS and WAITING rows updated.
- Ran `node scripts/check-links.mjs` and `git diff --check`. Typecheck, unit tests, build, browser suites and `fingerdemo` not run: no code changed.
- Open: the eight developer decisions (new game vs Pattern Train, plotted-log grid, land, 7–8 placement, Box Balance's home, first-prediction rule, reviewer, hat wearable); no child, parent, educator or device involved.

## 2026-10-20 — RW13 slice 2: Rainbow Meadow at the root

- Built on `claude/rw13-rainbow-meadow` ([PR #635](https://github.com/rjdunlap/neo/pull/635), code `d608a0b1` on `da7e0876`): `LocationScene`, the `LandOptions` seam in `LandScene`, the meadow backdrop (`meadow.ts`), the root's `land`/`hub` routes in `src/rework.ts`, and a flower button on the creature preview. `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (1606 of 1607; the one failure was the RW02b tote test in `src/art/creatures/cast.test.ts`, a load flake that passed alone, 44 of 44; the meadow test passed 2 of 2) and `npm run build` (99 precache entries).
- Root probe (one-off Playwright script, dev server): entry, meadow button, resident and three games with the signpost, tap resident (suggested color-garden), launch it, held Home back to the location, Home back to the preview, in 1024×768 and 768×1024 with no page errors; the "Island games" link is hidden in the location. `BROWSER_SUITE=world` passed (classic, about 7 minutes); `npm run test:offline` passed on the preview, plus a root offline probe (cached, reload offline, meadow opens with the illustrated sprout).
- Not run: an iPad or other device look, real speech, a child's reaction, the other locations.

## 2026-10-20 — RW06 definition, playable home and customization

- Docs only on `claude/rw06-definition` ([PR #636](https://github.com/rjdunlap/neo/pull/636)): the RW06 packet [HOME.md](../rework/HOME.md), two slice lines in READY.md, the RW06 work-item row and a defaults row in WAITING-ON-DEVELOPER.md.
- Ran `node scripts/check-links.mjs` and `git diff --check` (results in the closeout report).
- Open: nothing built; no code, browser or device checks. The four defaults await the developer in WAITING-ON-DEVELOPER.md.

## 2026-10-20 — RW06 slice 1: the saved look and dressing

- Built on `claude/rw06-dress` ([PR #637](https://github.com/rjdunlap/neo/pull/637), tested at `c92a51d3` on `797dd0c9`): `look.worn` with `cleanWorn` and `store.wear`, the dressed `Companion`, the guide leaving off the `held` slot, `DressScene`, `go.dress`, `go.friends(previewId?)` and Friends' Dress button. See [HOME.md](../rework/HOME.md#built-slice-1-2026-10-20).
- Ran `npm run typecheck`, `npm test` (169 files, 1614 tests, with save-repair, store, guide-footprint and `dressLayout` tests), `npm run build` (wearable PNGs in the precache); dev server on 5993, preview on 5285 (bundle confirmed current).
- `BROWSER_SUITE=dress` passed (the new case, including the guide-only check on bubble-pop and a second profile undressed), `BROWSER_SUITE=world` and `BROWSER_SUITE=friends` passed, and `npm run test:offline` passed.
- Not run: large-pet game regressions (unchanged, still a `Critter`), couch suites.
- Open: [device checks](../DEVICE-CHECKS.md) (the hanger icon, items on an iPad, speech, frame rate with a dressed rig, a child's reaction); Friends cards and chooser portraits stay undressed; the ten large-pet games wait for RW05 slice 2.

## 2026-10-20 — RW06 slice 2: Home and creature play at the root

- Built on `claude/rw06-home` ([PR #638](https://github.com/rjdunlap/neo/pull/638), tested at `44633f94` on `f787f736`): the root boots to the chooser, `HomeScene`, `PlayScene` with the ball, the Home backdrop (webp, precached), `App.creatureWorld`, the preview at `?preview`. See [HOME.md](../rework/HOME.md#built-slice-2-2026-10-20).
- Ran `npm run typecheck`, `npm test` (170 files, 1617 tests, with `homeLayout` in five views; run before the last ball-play tweak, which typecheck and the `home` case then covered), `npm run build` (100 precache entries, 9414.81 KiB, includes `home-day-*.webp`); dev server on 5232, preview on 5233.
- `BROWSER_SUITE=home` passed (new), `BROWSER_SUITE=world` passed (classic unaffected), `npm run test:offline` passed against the matched production preview (classic); a one-off production probe of the root: the service worker cached the webp, an offline reload shows the chooser, no page errors.
- Not run: couch suites, `friends` and `dress` suites (changed only by the root-only Home button; the `home` case covers it), large-pet regressions.
- Open: [device checks](../DEVICE-CHECKS.md) (the ball, the people and house pictures, speech, frame rate with a dressed rig on the backdrop).

## 2026-10-20 — RW13 slice 3: Counting Cove at the root

- Built on `claude/rw13-counting-cove` ([PR #639](https://github.com/rjdunlap/neo/pull/639), code `f48ee8da` on `f8f85164`): `cove.ts` (`covePlan`/`drawCove`), `cove.test.ts` and one `LOCATIONS` entry (`counting-cove`, resident the illustrated River). `classic/` and shared files are unchanged.
- Ran `npm run typecheck` (clean) and `npm test` (171 files, 1619 tests passed; a later placement tweak re-ran the scenes tests, 4 of 4, and typecheck, both passing).
- Root probe (one-off Playwright script, dev server, fresh profile): `go.land('counting-cove')` shows the cove with the River resident, tap the resident, launch the first game (duck-pond), Home back to the cove, `go.hub` to Home, in 1024×768 and 768×1024 with no page errors; both screenshots reviewed.
- Not run: `npm run build` (no shared files), `world`, the offline check, an iPad look, real speech, a child's reaction.
- Open: Home's Explore still opens Rainbow Meadow only, so the cove has no button entry until the Explore picker slice (see [READY.md](../READY.md)).

## 2026-10-20 — RW13: the Explore picker of built locations

- Built on `claude/rw13-explore-picker` ([PR #640](https://github.com/rjdunlap/neo/pull/640), code `e3339ea5`): `ExploreScene` at the root, `exploreLayout` in `home-layout.ts` with a unit test, voice line `explore.pick`, the `home` case updated; `classic/` navigation unchanged.
- Ran `npm run typecheck`, `npm test` (171 files, 1620 tests passed) and `npm run build`.
- Ran `BROWSER_SUITE=home` at the root (http://localhost:5571): Explore to the picker (rainbow-meadow and counting-cove, island link hidden, screenshot `explore`), Back to Home (link shown), Explore, Counting Cove card, location, Home; passed. Production offline check (http://localhost:5656, served build matched `dist` `main-BIDP_T3s.js`) passed.
- Not run: `world` (classic navigation unchanged), an iPad touch or speech check, a child's reaction.

## 2026-10-20 — RW13 slice 4: Puzzle Peaks at the root

- Built on `claude/rw13-puzzle-peaks` ([PR #641](https://github.com/rjdunlap/neo/pull/641), code `403ad277`): `peaks.ts`, `peaks.test.ts`, one `LOCATIONS` entry (`puzzle-peaks`, resident the illustrated glider) and a `hostScale(box)` export in `LandScene.ts` (a shared file). `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (1622 of 1623; the known `cast.test.ts` tote flake passed alone, 44 of 44) and `npm run build` (passed). The peaks test fails if the host scale is raised.
- Root probe (one-off script `test-results/peaks-probe.mjs`, http://localhost:5238, landscape and portrait): the Explore list holds rainbow-meadow, counting-cove and puzzle-peaks; `go.land('puzzle-peaks')` shows the glider resident; tap it; tap puzzle-pals into the game; leave back to the location; no page errors. Screenshots reviewed at preschool and school landscape.
- Not run: `world`, the `home` suite, the offline check (no persistence, asset or navigation change beyond one location entry), an iPad look, real speech, a child's reaction.

## 2026-10-20 — RW13 slice 5: Bubble Beach at the root

- Built on `claude/rw13-bubble-beach` ([PR #643](https://github.com/rjdunlap/neo/pull/643), code `fec8e873`): `beach.ts`, `beach.test.ts`, one `LOCATIONS` entry (`bubble-beach`, no resident: the land's duck host) and an optional `Place.resident` in `LocationScene.ts` (a shared file). `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (1625 of 1626; the known `cast.test.ts` tote flake passed alone, 44 of 44) and `npm run build` (passed).
- Root probe (one-off `test-results/beach-probe.mjs`, http://localhost:5205, landscape and portrait): Explore lists four locations; `go.land('bubble-beach')` shows the duck host and 5 games; tap the host; tap bubble-pop into the game; leave back to the location; no page errors. Screenshots reviewed in both orientations (small pools overlapped at full size, fixed by scaling each to its box).
- Open: Explore is full at `EXPLORE_MAX` 4. Not run: `world`, the `home` suite, the offline check (no persistence or asset change), an iPad look, real speech, a child's reaction.

## 2026-10-20 — RW13 slice 6: Music Mountain at the root

- Built on `claude/rw13-music-mountain` ([PR #644](https://github.com/rjdunlap/neo/pull/644), code `0db0b51e`): `mountain.ts`, `mountain.test.ts`, one `LOCATIONS` entry (`music-mountain`, no resident: the land's bear host), and the Explore picker in rows of up to four (`EXPLORE_MAX` 4 to 11, `exploreLayout` in `home-layout.ts`; `LocationScene.ts` also changed). `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (174 files, 1629 tests pass; the home-layout test checks 1-11 cards in five views) and `npm run build` (passed).
- Root probe (one-off `test-results/mm-probe.mjs`, http://localhost:5504, landscape and portrait): Explore lists five locations in two rows (3+2); the Music Mountain card opens the location (bear host, no resident); `go.game('jelly-drums', …)` into the game and leaving returns to the location; no page errors. Screenshots of the location in both orientations and of Explore reviewed.
- Open: Explore holds every location now. Not run: `world`, the offline check, an iPad look, real speech, a child's reaction.

## 2026-10-20 — RW13 slice 7: Painted Canyon at the root

- Built on `claude/rw13-painted-canyon` ([PR #645](https://github.com/rjdunlap/neo/pull/645), code `b36dc9ae`, base `70fcd86c`): `canyon.ts`, `canyon.test.ts`, one `LOCATIONS` entry (`treehouse`, no resident: the land's cat host); `LocationScene.ts` also changed. `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (174 of 175 files, 1631 of 1632 tests; the one failure, the RW02b illustrated tote "never tears the picture" in `cast.test.ts`, worstStretch 2.109, is a known load-sensitive flake that passed twice alone), the canyon test (3/3 after the last edit) and `npm run build` (passed).
- Root probe (one-off `test-results/pc-probe.mjs`, http://localhost:5647, landscape and portrait): Explore lists six locations; the Painted Canyon card opens the location (cat host, no resident); `go.game('stamp-studio', …)` into the game and leaving returns to the location; no page errors. Screenshots of both orientations reviewed.
- Not run: `world`, the offline check, an iPad look, real speech, a child's reaction.

## 2026-10-20 — RW13 slice 8: Cozy Village at the root

- Built on `claude/rw13-cozy-village` ([PR #646](https://github.com/rjdunlap/neo/pull/646), code `c75e4687`, base `da6f32ee`): `village.ts`, `village.test.ts`, one `LOCATIONS` entry (`cozy-village`, no resident: the land's squirrel host); `LocationScene.ts` also changed. `classic/` is unchanged.
- Ran `npm run typecheck` (clean), `npm test` (176 files, 1635 tests; one intermittent failure in unchanged creature-art code, "pins the face and body, moves the part's tip, and never tears the picture through idle and repeated taps" from `illustrated-suite.ts`, passed on 2 of 3 reruns of `src/art/creatures`: a known flake on unchanged code) and `npm run build` (passed).
- Root probe (one-off `test-results/cv-probe.mjs`, http://localhost:5837, landscape and portrait): Explore lists seven locations; the Cozy Village card opens the location (squirrel host, no resident); `go.game('scoop-shop', …)` into the game and leaving returns to the location; no page errors. Screenshots of both orientations reviewed.
- Not run: `world`, the offline check, an iPad look, real speech, a child's reaction.

## 2026-10-20 — RW13 slice 9: Story Grove at the root

- Built on `claude/rw13-story-grove` ([PR #647](https://github.com/rjdunlap/neo/pull/647)): `grove.ts`, `grove.test.ts`, one `LOCATIONS` entry (`story-grove`, no resident: the land's purple bunny host), and the optional `LandOptions.backdrop`/`headingColor` seam in `LandScene.ts` and `LocationScene.ts` (night sky at the root only; `classic/` keeps its day backdrop).
- Ran `npm run typecheck` (clean), `npm test` (1638 of 1639; the known RW02b tote flake in `src/art/creatures/cast.test.ts`, unchanged code, passed alone 44/44; a `peaks.test.ts` failure in one `src/app/scenes/` run passed alone and in the full run) and `npm run build` (passed; shared scene files changed).
- Root probe (one-off `test-results/sg-probe.mjs`, http://localhost:5743, landscape and portrait): Explore lists eight locations; the Story Grove card opens the location (bunny host, no resident); `go.game('owl-walk', …)` with the land origin and leaving returns to the location; no page errors. Screenshots of both orientations reviewed (heading reads, spots and host clear).
- Not run: `world`, the offline check, an iPad look, a child's reaction.

## 2026-10-20 — RW13 slice 10: Tinker Lab at the root

- Built on `claude/rw13-tinker-lab` ([PR #648](https://github.com/rjdunlap/neo/pull/648), code `0217222c`, base `3101e913`): `lab.ts`, `lab.test.ts`, one `LOCATIONS` entry (`tinker-lab`, no resident: the land's blue cat host); the cave backdrop and cream heading go through the existing `backdrop`/`headingColor` seam at the root only (`classic/` keeps its day); `LocationScene.ts` also changed.
- Ran `npm run typecheck` (clean), `npx vitest run src/app/scenes/lab.test.ts` (4 passed), `npm test` (1642 of 1643; a `peaks.test.ts` glider-loop-on-screen failure on untouched illustrated art, passed alone: a known flake) and `npm run build` (passed; a shared scene file changed).
- Root probe (one-off `test-results/tl-probe.mjs`, http://localhost:5368, landscape and portrait): Explore lists nine locations; the Tinker Lab card opens the location (cat host, no resident); `go.game('light-lab', …)` with the land origin and leaving returns to the location; no page errors. Screenshots of both orientations reviewed (heading reads on the dark ceiling, spots and host clear).
- Not run: `world`, the offline check, an iPad look, a child's reaction.

## 2026-10-20 — RW13 slice 11: Barnyard and Lantern Lake at the root

- Built on `claude/rw13-barnyard-lake` ([PR #649](https://github.com/rjdunlap/neo/pull/649), code `0dc10208`, base `bac7435b`): `farm.ts`, `lakeside.ts`, `farm.test.ts`, two `LOCATIONS` entries (`barnyard`, `lantern-lake`, no resident: the land's cow and purple cat hosts); `barnyardFence` is now exported from `barnyard.ts`; `LocationScene.ts` also changed. The last slice of the RW13 packet.
- Ran `npm run typecheck` (clean), `npm test` (1647 of 1648; the known RW02b tote flake in `cast.test.ts` on untouched code, passed alone 44/44) and `npm run build` (passed; a shared scene file changed).
- Root probe (one-off `test-results/loc-probe.mjs`, http://localhost:5329, landscape and portrait, both lands): Explore lists eleven locations; each card opens the location (land host, no resident); `go.game('orchard-rows')` and `go.game('tile-pairs', 'grownup')` with the land origin and leaving return to the location; no page errors. Screenshots reviewed (barnyard landscape: orchard, hay and hens clear of the spots; Lantern Lake portrait, full grown-up field: water strip, floating lanterns, garlands, posts, reeds).
- Not run: `world`, the offline check, an iPad look, a child's reaction.

## 2026-10-20 — Little Conductor levels 1–2 (music M2)

- Built on `claude/little-conductor-m2` (tested commit `2c76c4a4`, base `2ad76211`): new game `little-conductor` in Music Mountain, levels 1–2, new `conductor` browser suite, `sfx.pluck` and a gain on `sfx.drum`.
- Ran `npm run typecheck` (clean) and `npx vitest run src/games/little-conductor` (20 tests: motifs, pace-independent notes, 500 seeded random-tap runs with no skipped or repeated beat, change within one beat, call-off, listen again, both heard gates, bot reaches the gate, layout at four views and two levels). Full `npm test` passed except five known load timeouts in untouched games (ferry-jam, peg-garden, penguin-slide), which pass alone with a 30 s timeout.
- `BROWSER_SUITE=conductor` (http://localhost:5213) passed at levels 1 and 2: early Done, a change inside a beat, the heard gate, the bow, one sticker, history `[level, 0, 0]`; portrait screenshot `test-results/browser/little-conductor-2-portrait.png`. `BROWSER_SUITE=fingerdemo FINGER_ONLY=little-conductor` passed at levels 1 and 2 (11.9 s each). `npm run build` passed.
- Not run: `smoke`, `world`, the offline check (no navigation or persistence change). Open on a device ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): 60 against 90 on an iPad speaker, a two-year-old reading the pads and pending ring, drum masking the melody, device speech, fast heard as winning.

## 2026-10-20 — Jar Sort levels 1–8

- Built on `claude/jar-sort-build` (PR #651, base `0e2677f5`): new game `jar-sort` in Rainbow Meadow, levels 1–8, new `jarsort` browser suite, frozen solver-checked boards, a one-board demonstration.
- Ran `npm run typecheck` (clean) and `npm test` (all pass; four unrelated tests timed out under parallel load and pass alone: ferry-jam frozen harbors, peg-garden launcher, penguin-slide level 8, RW02b cast). The 10 jar-sort rule tests pass (slowest frozen-board search 93 ms). `npm run build` passed.
- `BROWSER_SUITE=jarsort` (Vite http://localhost:5927) passed: level 1's authored boards solved by taps, a free refused move and a ground set-down, level 3 (two refused moves = 2 misses and 1 hint), a drag move, undo, level 7 portrait screenshot `test-results/browser/jar-sort-7-portrait.png`, level 8 mats solved by taps, one sticker per round.
- After review, fixed a resize during a fruit's hop leaving the round busy (the pieces are placed again when it lands) and made a system `pointercancel` put a carried fruit back; added a long-wander hint timing test (11 rule tests; worst hint 10 ms, no undo fallback); `jarsort` re-passed on http://localhost:5612.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=jar-sort` at levels 1 and 8 (16.6 s, 49.8 s, before the one-board demonstration change) and at level 4 after it (25.1 s).
- Not run: the offline check, `world`, the phone suites. Open on a device ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): fruit legibility at capacity 4, whether a preschooler reads lit jars, whether undo is found unprompted.

## 2026-10-20 — Egg Catch: roll when ready at levels 4–5

- Built on `claude/egg-catch-roll-when-ready` (PR #652, code commit `dac8f977`, base `31d5129c`): the egg at levels 4–5 waits for the green arrow instead of rolling on a clock; `routeTouch` bot moves, `egg.route`/`egg.sort` lines, how-to steps and note, `eggs` browser case.
- Ran `npm run typecheck` (clean) and `npm test` (181 files, 1680 tests pass, including the new `routeTouch` rule test).
- `BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=4 TO_LEVEL=5` (Vite http://localhost:5795) passed: 2 misses and 1 hint at each level, the egg still waiting after 4.5 s, no page errors. `BROWSER_SUITE=fingerdemo FINGER_ONLY=egg-catch FINGER_LEVELS=4,5` clean in 30.5 s and 36.8 s.
- Portrait probe at level 5 (768×1024): egg still held after 5 s, arrow clear of Home and the pet, no page errors.
- Not run: `npm run build`, `world`, the offline check, couch (uses only levels 2–3, untouched). Open: an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-20 — Block Garden levels 1–8

- Built on `claude/block-garden` (PR #655, tested commit `0448a289`, base `c2206318`; `blockgarden` rerun at `c6cfd607` after a fix: a tap on a tall piece's slot upright had counted as a refused drop, now free and asserted): new game `block-garden` in Rainbow Meadow, levels 1–8, new `blockgarden` browser case, runtime-generated gardens at 1–4 and frozen solver-checked gardens at 5–8, a drag-bot demonstration.
- Ran `npm run typecheck` (clean), `npx vitest run src/games/block-garden` (33 rule tests pass) and full `npm test` (1713 tests pass on rerun; the first run had one failure in a creature rig test, "pins the face and body … never tears the picture", in untouched code; it passed alone and on rerun, recorded as a flake). The worst level-8 off-plan hint search measured about 320 ms on Node.
- `BROWSER_SUITE=blockgarden` (Vite http://localhost:5856) passed: levels 1 and 8 planted by drags with no misses or hints and a sticker each, two refused drops at level 3 (two misses, one hint), the hinted piece planted, undo, level 6 portrait screenshot `test-results/browser/block-garden-6-portrait.png`. `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-garden` passed at level 1 (prek, 3.9 s) and level 8 (grownup, 23.2 s). `npm run build` passed.
- Not run: `world`, the offline check, an iPad. Open: carrying a piece with the 40-unit lift, 72-unit squares on a phone, the shadow, and the level 8 hint search time on a device ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-20 — Sound Garden: fair, varied listening (slice 1)

- Built on `claude/sound-garden-fair-listening` (PR #656, code commit `21e35c01`): seeded sounds for levels 2–4 and 6 (`makeSounds`), equal-span fast/slow, varied high/low and up/down, `PLANS` keyed by level ID, how-to level-6 step capped.
- Ran `npm run typecheck` (clean), `npx vitest run src/games/sound-garden src/content` (96 tests pass, including the new rule tests: answers differ only in the asked attribute, notes on the scale and in span, sounds vary and are deterministic per seed) and `npm run build` (passes).
- `BROWSER_SUITE=batch BATCH_ONLY=garden` levels 1–6 passed (Vite http://localhost:5450): a wrong pair and a hint on each listening level.
- Not run: `fingerdemo` (bot unchanged), `world`, the offline check, an iPad. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether she judges high/low by sound or by the tile's height, and the quiet-games and clarity rows.

## 2026-10-20 — Domino Run levels 1–8

- Built on `claude/domino-run` (PR #659, tested commit `cd11a6f7`): new game `domino-run` in Bubble Beach, levels 1–8 (tipping rule, tray, stalls never a miss, glow hint after the second stall), new `dominorun` browser suite, a ghost-finger bot.
- Ran `npm run typecheck` (clean) and full `npm test` (183 files, 1730 tests pass; 13 new domino-run rule tests: the tipping rule, the authored first lines' exact solutions, 500 seeds across the 8 plans never using the fallback, hint-following from every placement state, layout at four views). `npm run build` passed.
- `BROWSER_SUITE=dominorun` (Vite http://localhost:5209) passed: level 1 by taps, level 8 with a stalled run (0 misses), one requested hint, drags, and a level 5 portrait screenshot (`test-results/browser/domino-run-5-portrait.png`). `BROWSER_SUITE=fingerdemo FINGER_ONLY=domino-run` passed at level 1 (toddler, 5.0 s) and level 8 (school, 13.6 s).
- Not run: `world`, the offline check, an iPad. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a toddler finds tap-to-hop at level 2, whether the stall ring reads as "here is the gap", and whether three dot faces tell sizes apart on an iPad.

## 2026-10-20 — Teddy Doctor: the whole patient counts (slice 1)

- Built on `claude/teddy-doctor-support-truth` (PR #660, commit `427d63b3`, base `bf88b3d1`): at level 1 any touch on the patient bandages the nearest remaining boo-boo and the patient says the part (`doctor.patched`); how-to wording fixed (levels 2–3 drag, level 6 capped); `LEVELS` moved to `logic.ts`.
- Ran `npm run typecheck` (clean); `npx vitest run src/games/teddy-doctor src/content/howto.test.ts src/games/registry.test.ts` passed (new rules: every band's levels map to their own plan; the level-1 tap reaches a remaining boo-boo from anywhere on the body, all patients and subsets).
- `BROWSER_SUITE=next NEXT_ONLY=doctor FROM_LEVEL=1` (Vite http://localhost:5464) passed levels 1–6, level 1 now also tapping the patient far from every boo-boo; `BROWSER_SUITE=fingerdemo FINGER_ONLY=teddy-doctor FINGER_LEVELS=1` passed (14.1 s).
- Not run: `npm run build`, full `npm test`, `world`, the offline check, an iPad. Open: taps during the spoken line are still dropped (gated on V2's person check); on the last boo-boo two thank-yous can run back to back.

## 2026-10-20 — RW02b follow-up: the river's head turns

- Built on `claude/rw02b-river-head` (PR #663, base `2107f058`): `river-nohead.png` prepared (plates cut in the shared box, no drift check; the six river expressions re-cut byte-identical) and the river rigged as a body mesh plus a 24 × 14 head mesh bending about the throat; `illustrated.ts` hooks are additive, the other species unchanged. The sprout's arm half is dropped because R25 ended missing.
- Ran `npm run typecheck` (clean), `npm test` (183 files, 1737 tests pass; an earlier targeted run had the recorded `cast.test.ts` tote-stretch flake once, green on rerun), `npx vitest run scripts/creature-art` (16 pass) and `npm run build` (precache 102 entries, 9748 KiB; `river-nohead.png` now ships). New river tests: plate size and head removed inside the base outline within 4 px; head travels (> 12 px) while cut vertices move only with the back wave; no frame step of 4 px or more, no stretch of 1.5 or more; no plate pixel exposed at the furthest look either way.
- Probe `test-results/rw02b-river-probe.mjs` of `/?preview` (http://localhost:5440, 1024 × 768 and 768 × 1024): river layered, head travel up to 43 sprite px on a touch, no page errors; zoomed stills at rest and fully lifted show no exposed neck cap or double outline.
- Not run: any browser suite (no game changed), `world`, the offline check, an iPad. Open: a minor seam where the cut crosses the cream/caramel edge and the chest contour; frame rate and the turn on a device ([device check](../DEVICE-CHECKS.md)).
