# Verification 2026-10-23 (archived entries)

## 2026-10-23 — Peg Garden level 8 Big buds (slice 4)

- Branch `claude/peg-garden-big-buds`: new `big` mode (four huge buds, radius 60, diamond), plans keyed by ID, lap order `[8, 1]`, toddler `[8, 1, 2]`, `entryLevels [8]`, voice line `peg.big`, how-to lines for level 8.
- Ran: typecheck; `npx vitest run src/games src/content src/progress` (2009 pass, with new rule tests for clear spacing, reachability under drift, no trapped pearl, stall guard); `BROWSER_SUITE=batch BATCH_ONLY=pegs FROM_LEVEL=8 TO_LEVEL=8` passed (score 0, 0); `fingerdemo` `FINGER_ONLY=peg-garden FINGER_LEVELS=8` finished in 4.3 s; one landscape screenshot reviewed.
- Not run: portrait screenshot, `npm run build`, couch suites (couch keeps its own catalog levels), iPad/device.
- Open: whether a toddler touches the huge buds and enjoys the bloom ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-23 — Mail Carrier batch 2: spoken map clues and both street sides

- [#856](https://github.com/rjdunlap/neo/pull/856), levels 13 then 11 / dive slices 6–7; worker `01a16798-fe98-7152-9f20-edd4b6fd4189`, base `d33c4784` plus batch working diff (coordinator-only queue merge `b7cff469` does not change tested code).
- Ran: typecheck; full `npm test` (211 files, 2558 passed, 4 skipped); build; 27 Mail Carrier tests including 300 seeds × both clue orientations, independent geometry/uniqueness margins, parity/order/letter targets and fallback layout properties.
- Browser at `http://localhost:5198`: `BROWSER_SUITE=batch BATCH_ONLY=mail MAIL_LEVELS=11` and `BROWSER_SUITE=woods WOODS_ONLY=mailmap MAIL_LEVELS=13 MAIL_MIRRORED=1` passed, each saved `[2,1]` and a sticker; wrong parity and order at 11; Hazel replay free at 13. Reviewed portrait `mail-carrier-11-portrait.png` and clue map `mail-carrier-13.png`: four houses per side retained, separate 176-unit targets. Six-house fallback unit-tested.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=13,11`: clean completion in 14.0/17.6 s. Links and diff whitespace checked. Logs/screenshots remain in ignored `test-results/`.
- Not run: offline, world/story/couch suites (no persistence, assets, navigation, story or couch behavior changed); actual iPad speech/touch and child play remain [open](../DEVICE-CHECKS.md). Later levels and #733 untouched.

## 2026-10-23 — Monster Munch batch 1 (part): lap 9 Big bites and toddler 10 One of each (slices 3–4)

- [#857](https://github.com/rjdunlap/neo/pull/857), `claude/monster-munch-variety-entries`; tested on the branch commit (pushed before closeout). Slice 2 (foods, monsters, places) not built.
- Ran: typecheck; `vitest src/games src/content src/progress` (162 files, 2015 tests passed).
- Browser at `http://localhost:5517`: `BROWSER_SUITE=third MUNCH_LEVELS=9,10` (harness extended in `scripts/browser-check.mjs`) passed with the expected scores 9: `[0,0]`, 10: `[2,1]`; landscape screenshots reviewed.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=monster-munch FINGER_LEVELS=9,10`: clean completion in 12.5 s (lap) and 23.7 s (toddler).
- Not run: portrait screenshot, build, offline, iPad touch and speech, child play ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Garden Grow batch 2: rows, columns and equal rows (slices 5–7)

- [PR #859](https://github.com/rjdunlap/neo/pull/859), `claude/garden-grow-rows-columns`: pre-K levels 9 Rows of colors, 10 Columns of colors and 11 Same in every row (order `[6, 7, 9, 10, 11]`), with rule tests, how-to steps, voice lines and a bot that reuses the packet in hand.
- Ran: typecheck; `npx vitest run src/games src/content` (157 files passed).
- Browser: `BROWSER_SUITE=fingerdemo FINGER_ONLY=garden-grow FINGER_LEVELS=9,10,11` clean (52, 55 and 26 s of the 75 s budget); one scripted pre-K play of 9–11 (two wrong rains = 2 misses and 1 hint each, then the bot finished 9 and 11; level 10 not awaited to the end in the script, the `fingerdemo` finished it); landscape 1024×768 screenshots of 9 and 11.
- Not run: portrait screenshot, level 10 screenshot, `npm run build`, offline, iPad touch, device speech, child play ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Pet Kitchen batch 1: meal variety and lap tap-sharing (slices 2–3)

- [PR #860](https://github.com/rjdunlap/neo/pull/860), `claude/pet-kitchen-meals-lap`: critter friends who eat, seeded sandwich or pie, fraction bubble at 7, banana, level 10 *One for you, one for me* and the lap band (toddler `order [10, 1]`, picnic lap level 1→10).
- Ran: typecheck; full `npm test` (211 files, 2572 passed); `npm run build`.
- Browser: `BROWSER_SUITE=creative CREATIVE_ONLY=kitchen` levels 1–10 (misses/hints `[2,1]` for 1–9, `[0,0]` for 10, no page errors, portrait screenshot of 10 reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-kitchen` levels 2, 7, 10 clean (14.8/7.5/8.7 s).
- Not run: the `picnic` suite's sandwiches step (its unit test passes), offline, iPad touch, device speech, child play ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Pet Kitchen batch 2 part A: levels 11-12 (slices 4–5)

- [PR #879](https://github.com/rjdunlap/neo/pull/879), `claude/pet-kitchen-same-or-not`: level 11 *Same or not the same?* (piece areas, lopsided cut, overlay miss, `kitchen.recut-other`) and level 12 *Two pizzas, three friends* (`leftover` trouble); orders exclude level 14, still open.
- Ran: typecheck; `npx vitest run src/games src/content src/progress` (165 files pass, new rule tests in `src/games/pet-kitchen/logic.test.ts`); `npm run build`.
- Browser: `BROWSER_SUITE=creative CREATIVE_ONLY=kitchen FROM_LEVEL=11` passed (harness extended to level 12); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-kitchen FINGER_LEVELS=11,12` passed (9.9 s, 19.8 s); one portrait screenshot of level 11's start.
- Not run: screenshot of the overlay, the `picnic` suite, offline, iPad touch, device speech, child play ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Sense Detective levels 1–2 (new game, B2)

- [PR #861](https://github.com/rjdunlap/neo/pull/861), `claude/sense-detective-build`: Look or Listen to find the parcel's toy; registered as the 13th Tinker Lab game, pre-K levels 1–2 and school level 2.
- Ran: typecheck; `npx vitest run src/games src/content` (158 files, 1920 tests, including 29 new logic tests: toy table, possible set, rounds over 500 seeds, check / not-yet / miss, bot, layout at four views); `npm run build`.
- Browser: `BROWSER_SUITE=sensedetective` (level 1, then level 2 in portrait) passed; `fingerdemo FINGER_ONLY=sense-detective` levels 1 and 2 clean (6.3 s, 8.1 s); one portrait screenshot.
- Not run: real device, device speech, a child reading the badges ([open](../DEVICE-CHECKS.md)); the full browser suites.

## 2026-10-23 — Sand Table levels 1–3 (new game, E2)

- Branch `claude/sand-table-1-3`: dry sand pour, scoop and flag; registered as the 12th Rainbow Meadow game (Bubble Beach and Treehouse failed their `src/app/scenes/*.test.ts` decor counts), lap 1, toddler 1–2, preschool 2–3, pre-K 3.
- Ran: typecheck; `npx vitest run src/games/sand-table` (30 tests); full `npm test`; `npm run build`.
- Browser: `BROWSER_SUITE=sandtable` (level 1 pour, scoop, flag; level 3 in portrait with spill to pail and back, empty-bucket pour, requested hint, Show; saved score 0/0) passed at `http://localhost:5487`; one portrait screenshot reviewed; `fingerdemo FINGER_ONLY=sand-table` levels 1, 2, 3 passed (10–15 s each).
- Known failure, not from this change: `src/app/scenes/lab.test.ts` (Tinker Lab decor `bench` count 0 at pre-K, n=12) fails since Sense Detective joined that land; open, needs a decor fix.
- Not run: iPad or device checks, a child with the tray, real-sand comparison ([open](../DEVICE-CHECKS.md)); the offline production check (no persistence change).

## 2026-10-23 — Adventure Walk levels 1–3 (new game, AW2)

- Branch `claude/adventure-walk-1-3` (PR #867): choose or follow the way past three landmarks; registered as the 11th Barnyard game (Rainbow Meadow and Story Grove failed their `src/app/scenes/*.test.ts` decor counts), toddler 1, preschool 1–2, pre-K 2–3, school 3.
- Ran: typecheck (clean); vitest on game, registry, content and scenes (adventure-walk logic tests over 500 seeds); `npm run build`.
- Browser: `BROWSER_SUITE=adventurewalk` (level 1 free choices; level 3 in portrait with a wrong way, badge replay, requested hint, calls, saved score 1/1) passed; `fingerdemo FINGER_ONLY=adventure-walk` levels 1 and 3 passed (9.9 s, 11.4 s); one portrait screenshot reviewed.
- Known failure, not from this change: `src/app/scenes/lab.test.ts` (Tinker Lab decor, pre-K landscape n=12) fails on `origin/main` before this game was added.
- Not run: iPad or device speech (are "across" and "around" distinct), a toddler reading two dotted paths ([open](../DEVICE-CHECKS.md)); the offline production check.

## 2026-10-23 — Sorting Machine definition (H1, docs only)

- [PR #871](https://github.com/rjdunlap/neo/pull/871), `claude/define-sorting-machine`: [definition](../definitions/sorting-machine.md), READY (define line replaced by the H2 build line), backlog, notebook, study.
- Defined: Boolean model with an `incomplete` state, levels 1–3 with frozen briefs, free Send versus counted Check, help and supported finish, level 1 adaptation default, rule tests, bot, card, voice, registration.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, units, build, browser or device checks (docs only).
- Open: CS-educator read, decisions 1–5 in the definition.

## 2026-10-23 — Helper House definition (RA1, docs only)

- [PR #872](https://github.com/rjdunlap/neo/pull/872), `claude/define-helper-house`: [definition](../definitions/helper-house.md), READY (define line replaced by the RA2 build line), backlog, notebook, study.
- Defined: the 12-step four-phase day model, sensor and zone tables, levels 1–4 with frozen goals and accepted boards, free Watch with the same-failure-twice glow, `misses` always 0, help and supported finish, rule tests including the overlap property, bot, card, voice, registration.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, units, build, browser or device checks (docs only).
- Open: science-educator read, decisions 1–7 in the definition.

## 2026-10-23 — Gadget Bench definition (I1, docs only)

- `claude/define-gadget-bench`: [definition](../definitions/gadget-bench.md), READY (define line replaced by the I2 build line), batch plan, backlog row, inventions study.
- Defined: the part/socket/condition model with `runPath` and `passingDesigns`, levels 1–3 with authored rounds, free Try and Give-as-claim accounting with the same-condition glow, speech, rule tests including the position-matters overlap proof against Habitat Helpers, bot, card, registration, and a measured land table (Tinker Lab full at pre-K and school; Treehouse takes six more).
- Ran: a throwaway `landLayout` probe (four views; not committed), `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, units, build, browser or device checks (docs only).
- Open: home land (decision 1) and accounting (decision 2); children's and parents' reactions.

## 2026-10-23 — Tinker Lab decor test fix (CI red on every PR and `main`)

- Branch `ccr-9ee6eaa7-5euwv0`: `src/app/scenes/lab.test.ts` failed deterministically (`prek landscape n=12`, no bench) since Sense Detective became the lab's 13th game, which turned every pull request check and every deploy red. In the 12- and 13-game landscape layouts (pre-K, school, grown-up) the touch areas fill the whole cave floor, so `labPlan` has no room for any decor, at any size.
- Changed tests only: the bench and pool minimums now apply where the floor leaves a clearing (`hasRoom` in `src/app/scenes/decor-room.ts`, sized to the smallest bench and pool `labPlan` tries plus a fifth to spare); on-screen, off-touch-area, no-overlap and determinism checks still run on every layout, and a count check requires that most layouts are furnished. Removing benches from `labPlan` makes the test fail again.
- Ran: typecheck; full `npm test` (214 files, 2654 passed, 4 skipped).
- Open: the other nine land decor tests (`beach`, `canyon`, `cove`, `farm`, `grove`, `meadow`, `mountain`, `peaks`, `village`) keep their own fixed decor minimums and still act as a hidden capacity limit when a land gains a game; `hasRoom` is there to gate them the same way when one fails.

## 2026-10-23 — Mail Carrier 14: Three letters, your way

- [PR #874](https://github.com/rjdunlap/neo/pull/874), `codex/mail-carrier-compare-routes`: only batch3 / dive slice8. Three stops in any order, two bags, optional unscored second walk, counted return, one sticker. Level15 and developer decisions untouched; implementation complete; publication checks below.
- Tested `6ffddf16` plus the level14 working diff at `http://localhost:5199/classic/`. Ran typecheck, build,28 Mail Carrier rule tests;300 seeds × six orders prove valid recipients/edges, different round-trip lengths, one stone per edge, comparison directions and bot plans.
- Full `npm test`:213 files passed,2654 tests passed,4 skipped; one failure in unchanged `src/app/scenes/lab.test.ts:40` (prek landscape n=12 has no bench). Same failure on coordinator docs-only #873 CI; lab source/test/land mappings unchanged in this PR. Required CI on implementation `200a3daa` ([run39978526935](https://github.com/rjdunlap/neo/actions/runs/39978526935)) failed only this same assertion; CI build skipped after unit failure (local build passed). Resolved upstream by #877 (`68cc9b0d`); publication resume integrated that tests-only fix and passed typecheck plus32 Mail Carrier/Tinker Lab tests. Required CI is rerunning. Mail gameplay code is unchanged from `200a3daa`, so its play/demo proof is reused; no unrelated repair here.
- `BROWSER_SUITE=woods WOODS_ONLY=mailmap MAIL_LEVELS=14`: passed arbitrary order/undo, two misses/one hint, counted office return, a shorter free second walk, no comparison scoring, skip on second bag and one history/sticker. Portrait plan/choice screenshots inspected; no page errors.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=14`: clean completion in31.3s. Broader browser, offline and device checks not run (no persistence/assets/navigation change); real iPad speech and whether the optional comparison feels welcome remain person checks.

## 2026-10-23 — Ready for Adventure levels 1–3 (new game, RA2)

- Branch `claude/ready-for-adventure` ([PR #868](https://github.com/rjdunlap/neo/pull/868)): get parade props ready, pack them, watch the parade; registered as the 12th Barnyard game (Cozy Village at 12 failed `village.test.ts` decor, Music Mountain failed `mountain.test.ts` at 7), region cozy-village, toddler 1, preschool 1–2, pre-K 2–3.
- Ran: typecheck (clean); full `npm test` on the tree merged with `origin/main` at 68cc9b0d (all pass; one load-timing `block-garden` search-cap case failed once and passed alone; the earlier `lab.test.ts` failure was fixed on main by #877); `npm run build`.
- Browser: `BROWSER_SUITE=readyadventure` (level 1 pack; level 3 in portrait with an early pack miss, requested hint and its assisted tap, drags, the parade, saved score 1/1) passed at port 5611; `fingerdemo FINGER_ONLY=ready-for-adventure` level 1 finished in 10.3 s and level 3 in 16.8 s, clean.
- Not run: iPad or device speech, a toddler choosing drag or tap ([open](../DEVICE-CHECKS.md)); `world` and the offline production check.

## 2026-10-23 — Mail Carrier 15: Make the key

- [PR #881](https://github.com/rjdunlap/neo/pull/881), `codex/mail-carrier-make-key`: only batch4 / level15 / dive slice9; five key pairs followed by two deliveries, one round/sticker. Built and verified; publication tracked in the linked PR.
- Tested base `5c2ef9fe` plus level15 working diff at `http://localhost:5195/classic/`; integrated coordinator docs-only main `025bd512` as `787b81b0` without gameplay changes. Typecheck,29 Mail Carrier rule tests and build passed;300 seeds prove unique sign/house mappings, correct neighbours, two distinct recipients and valid delivery bot targets.
- Full units:213 files passed,2657 tests passed,4 skipped; one unchanged Block Garden off-plan search timing assertion failed (`logic.test.ts:233`, under2000ms). One isolated probe passed all33 Block Garden tests; timing flake retained, no unrelated fix. Required implementation CI [run39995153836](https://github.com/rjdunlap/neo/actions/runs/39995153836) passed all214 test files and build on `09c2387d`; only documentation changed afterward.
- `BROWSER_SUITE=woods WOODS_ONLY=mailmap MAIL_LEVELS=15`: passed free pre-row house tap/row replay, two mismatched pairs/one glow, all five filled rows before letters appear, two deliveries, one saved history/sticker; no page errors. Reviewed `test-results/browser/mail-carrier-15-wet-key-portrait.png`: neighbours, all wet rows and separate houses visible in portrait.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=15`: clean26.4s completion, no misses/hints/page errors. Earlier demo interrupted by integration reload is not proof. Broader browser and offline not run (no persistence/assets/navigation changes); real iPad speech/touch feel and child response remain open.

## 2026-10-23 — Seesaw Balance batch 1: truthful support and varied weighing props (slices 1–2)

- [PR #858](https://github.com/rjdunlap/neo/pull/858), `claude/seesaw-support-truth`: tap-to-hop friends at levels 1–2, glow that rings the next block when the tray is under, friend faces per weight, present wrappings and parcel/crate boxes at 6–7; IDs and windows unchanged.
- `npm run typecheck` clean; vitest seesaw-balance, content and registry files 173 passed (new: distinct faces per round, pools, scale by weight, wrappings, looks).
- `BROWSER_SUITE=next NEXT_ONLY=seesaw` levels 1–7 passed on the second run; the first run stopped at level 7 with a page-state dump and no page errors, not reproduced (possible timing flake). Probe: tapping a lifting friend at level 1 hopped it to the empty tray with no miss. Portrait screenshots of level 4 (wrappings) and level 6 (crate).
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=seesaw-balance` levels 1 and 6 passed (25.9 s, 40.8 s).
- Not run: `npm run build`, offline check, an iPad or real touch.

## 2026-10-23 — Size Parade levels 17 and 10 (slices 4–5)

- [PR #862](https://github.com/rjdunlap/neo/pull/862), `claude/size-parade-variety-lap`: level 17 *Two in a line* and level 10 *Big, middle, little* (middle cue, middle-asking rows), windows and how-to card updated.
- Ran: typecheck; size-parade rule tests; `npm test` at the time failed only `lab.test.ts` (Tinker Lab, fixed on main by #877); after merging `origin/main` re-ran typecheck and the size-parade tests.
- Browser: `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=10,17` passed (sky tap, two wrong picks then a hint, finish, `[2,1]`, portrait screenshot of 10 reviewed); `fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=10,17` clean (5.8 s, 4.7 s).
- Not run: build locally (CI builds), offline, iPad or a child ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Little Helpers batch 2: teams, crowd split and strong helpers

- [PR #863](https://github.com/rjdunlap/neo/pull/863), `claude/little-helpers-teams`, commit `d4cd9652`: level 6 teams she builds, level 7 Everyone helps (pre-K 3–7, school), level 8 Strong helpers (school 5–8) (slices 4, 6, 7).
- Ran: typecheck; `npx vitest run src/games/little-helpers src/content src/games/registry` (175 passed, new rule tests); full `npm test` 2607 passed, 1 failed: `src/app/scenes/lab.test.ts` (Tinker Lab prek landscape n=12), which fails identically on the unchanged base (pre-existing, unrelated).
- Browser at `http://localhost:5437`: `BROWSER_SUITE=woods WOODS_ONLY=helpers` levels 6, 7 (portrait) and 8: wrong whistles, 2 misses and 1 hint, saved score, sticker; screenshots checked. `BROWSER_SUITE=fingerdemo FINGER_ONLY=little-helpers FINGER_LEVELS=6,7,8` passed (51, 51 and 42 s).
- Not run: `npm run build`, couch suites, offline, iPad touch, hearing the new voice lines on a device, child play ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — RW14 polish packet, ChatGPT art batch and the art inbox script

- [PR #885](https://github.com/rjdunlap/neo/pull/885), `claude/polish-nav-art-backlog`: [POLISH.md](../rework/POLISH.md) (audit and ten slices), [ChatGPT batch](../rework/art-requests/CHATGPT-BATCH.md), [IMPORT.md](../rework/art-requests/IMPORT.md), and `scripts/art/import-inbox.mjs` with its rules in `inbox-core.mjs`; no `src/` change.
- Ran: `scripts/art/inbox-core.test.mjs` (8 tests), `npm test` (217 files pass), a smoke run of the script on copies of existing originals (one refused for size, three filed with manifest rows, the backdrop prepared at 150 KB with its card, the duck set cut by `prepare-sprite.mjs`), reverted afterwards; links and `git diff --check`.
- Audit screenshots: root and `classic/` at 1024 × 768 and 768 × 1024 on the dev server (scripted Chromium, `test-results/polish/`, not committed).
- Not run: typecheck and build (no `src/` change), browser suites, iPad.

## 2026-10-23 — R22 duck pilot source art

- [PR #888](https://github.com/rjdunlap/neo/pull/888), `codex/art-r22`: only duck base and portrait; five built-in imagegen calls, two chosen untouched originals, no missing files.
- Tested base `773ba231` plus images/docs diff; dimensions and source SHA-256 equality passed; 2,432,234 bytes total.
- Reviewed full size and at 120 px on white and a temporary sky-blue composite; closed outline, crest, feet, eye treatment and source identity checked.
- Exact prompts, candidate rejection and padding/near-white background caveats in [R22 proof](../rework/concepts/generated/R22-PROMPTS.md). Links and diff checks passed.
- Not run: local typecheck/tests/build/browser/offline (source art/docs only); preparation, rigging, integration, device acceptance and child judgement remain separate. Required PR CI tracked in #888.

## 2026-10-23 — Fluffy Salon levels 6 and 7: Pat the fluff and Snip snip (slices 3–4)

- [PR #864](https://github.com/rjdunlap/neo/pull/864), `claude/fluffy-salon-pat-snip`: lap and toddler `order [6, 1, 7, 2]`, range 1–7, `entryLevels [6, 7]`; level 6 (no buttons, floof shake, big mirror, self-finish) and level 7 (grow and snip buttons, long curly start, free-play mirror), no miss or hint at either.
- Ran: typecheck; `npm test` (then failed only the shared `lab.test.ts` bench assertion, fixed on main by #877; after merging `origin/main` at `74c1009e`, 217 files and 2702 tests pass); new `logic.test.ts` tests; registry test updated.
- Browser: `BROWSER_SUITE=batch BATCH_ONLY=salon FROM_LEVEL=6` passed (the `salon` case now covers 6 and 7, default `TO_LEVEL` 7); `fingerdemo` `FINGER_ONLY=fluffy-salon FINGER_LEVELS=6,7` clean (10.4 s, 10.8 s); one landscape screenshot of level 7 reviewed.
- Not run: portrait screenshot, offline check, real device or touch ([open](../DEVICE-CHECKS.md) if a person should pat the fluff).
