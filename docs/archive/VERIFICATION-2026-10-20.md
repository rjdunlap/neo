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
