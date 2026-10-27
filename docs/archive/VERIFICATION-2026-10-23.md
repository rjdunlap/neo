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

## 2026-10-23 — Waiting on the developer: every open question decided on delegation

- [PR #886](https://github.com/rjdunlap/neo/pull/886), `claude/waiting-decisions`: the developer asked for every open question to be decided and acted on. 178 of 182 rows decided by [standing rules](DECISIONS-2026-10-23.md#standing-rules) and each row's lean; each decision is recorded in its source (about 130 docs) and in the [record](DECISIONS-2026-10-23.md). [Waiting](../WAITING-ON-DEVELOPER.md) keeps 4 questions (the `classic/` deletion, two on-device name lists, the first language's family reviewer).
- Follow-on edits: READY ungated (11 lines) with 12 builds queued; 48 former gates moved to [DEVICE-CHECKS](../DEVICE-CHECKS.md#from-the-delegated-decisions-2026-10-23); AGENTS.md allows build-time Kokoro voice clips, a Sing-Along Barn tune exception and a grown-up wording rule; ROADMAP chunk 16, D4a and D4b set ready.
- Ran: `node scripts/check-links.mjs`, `git diff --check`. Docs only; no code checks.
- Not checked: each source edit was written by a subagent from its row and read back only by link check and spot checks, not line by line.

## 2026-10-23 — Critter Sort levels 12–13: Same Kind, Different Sprouts (G4)

- [PR #865](https://github.com/rjdunlap/neo/pull/865), `claude/critter-sort-sprouts`: little plants sorted by a stated big plant's leaf shape and petal marks, one hoop (12) then overlapping hoops with a leaf mat (13); pre-K and school.
- Ran: typecheck; `critter-sort`, `howto` and registry vitest; full `npm test`: 2602 pass, 1 fail in `src/app/scenes/lab.test.ts` (Tinker Lab "prek landscape n=12"), which failed identically on `origin/main` then and was fixed there by [#877](https://github.com/rjdunlap/neo/pull/877); rerun green after merging `origin/main`.
- Browser: `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=12 TO_LEVEL=13` passed (wrong drops, hint, completion); portrait screenshot of 13 checked visually (the big plant moved above the example after the first look); `fingerdemo FINGER_ONLY=critter-sort` at levels 1, 12 and 13 passed.
- Not run: build (no shared files), `world`, couch, offline; device speech and a child reading the plants ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — R23 Rainbow Meadow source art

- [PR #891](https://github.com/rjdunlap/neo/pull/891), `codex/art-r23`: five built-in imagegen calls, chosen untouched `land-meadow-5.png`, no missing source.
- Tested `d30d7fff` plus art/docs diff; 1536 × 1024 RGB, 1,670,501 bytes; source/repository hash equality passed.
- Reviewed full size, 120 px and static 1024 × 768 / 768 × 1024 cover previews with illustrative 100 px circles; about 38% horizon, clear ground; peripheral clipping caveats in [exact prompts/proof](../rework/concepts/generated/R23-PROMPTS.md).
- Ran links and diff checks; required PR CI tracked in #891. No source cleanup or import/preparation.
- Not run: local typecheck/tests/build/browser/offline (source art/docs only), actual in-game layout, device/child judgement; integration remains separate.

## 2026-10-23 — Stop and Go levels 5-6 Whose light? and Busy crossing (slices 4-5)

- [PR #869](https://github.com/rjdunlap/neo/pull/869), `claude/stop-and-go-whose-light`: level 5 (two lanes, own lights) and level 6 (eight arriving cars, thought clouds, idle point also at level 4); pre-K 3-6, preschool 2-5; voice lines, how-to steps, `go` browser case.
- Ran: typecheck; `npm test` then failed only `src/app/scenes/lab.test.ts` (Tinker Lab, fixed on main by [#877](https://github.com/rjdunlap/neo/pull/877)); after merging `origin/main` (`2cd835b9`) typecheck clean and `npm test` 2708 passed.
- Browser (port 5437): `BROWSER_SUITE=woods WOODS_ONLY=go FROM_LEVEL=5` played levels 5, 6 and 9 (a wrong answer and a hint at 5, a both-green miss at 6); `fingerdemo FINGER_LEVELS=4,5,6` clean in 8.1 / 11.5 / 17.4 s; landscape screenshots reviewed. After the merge, the same filter at `http://localhost:5541` passed 5, 6 and 9 again.
- Not run: portrait screenshot, `npm run build`, iPad or device speech (the lane-specific red lines and the idle-point line).

## 2026-10-23 — Typing Land reference review

- `claude/typing-land-review-88a7ed`: [docs/TYPING-LAND.md](../TYPING-LAND.md), a review of higopage's Typing Land against the island's rules with seven proposals (P1–P7), plus pointers in [IDEAS](../IDEAS.md#typing-land-review-2026-10-23), the [keyboarding study](../deep-dives/subjects/keyboarding-editing.md#similar-games-and-tools) and the [Pond Typing definition](../definitions/pond-typing.md).
- Ran: the browser edition played in the app's browser pane through setup, the tutorial, World 1 lesson 1 (three mini-games, the result) and the World 1, 2 and 6 maps; store, official and review pages opened; `node scripts/check-links.mjs` and `git diff --check`.
- Not run: no code changed; no sound heard (headless pane); later worlds, Challenge mode and the manual PDF not opened.

## 2026-10-23 — Attic Finds levels 3–4 Lid and Lever (H3)

- Branch `claude/attic-lid-lever` (PR #870): a giant-handle interaction in `attic-finds` (lap 3, toddler 3–4, `entryLevels` [3, 4]); peek door 220 units wide at (-40, 30); Finish after 3 turns; 0 misses and 0 hints.
- Ran: typecheck; vitest on `src/games` and `src/content` (160 files pass); `npm run build`. Full `npm test` has one failure, `src/app/scenes/lab.test.ts` "prek landscape n=12", which also fails with the attic-finds bands reverted (not from this change). After merging `origin/main` (`1ca63fc6`, which has the lab fix [#877](https://github.com/rjdunlap/neo/pull/877)): typecheck clean, `npm test` 2716 of 2717 with only Block Garden's level-8 timing cap failing under machine load; that file passed on rerun (unchanged code, known flake).
- Browser (Vite port 5437, stopped): `BROWSER_SUITE=atticlever` (fast swats make one turn plus one queued, Finish absent until turn 3, level 4 door free, Finish ends 0/0) passed; `fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=3,4` passed (7.3 s, 9.4 s); portrait screenshot of level 4 reviewed.
- Not run: `world`, offline check, iPad, device speech, a lap or toddler child ([open](../DEVICE-CHECKS.md)).

## 2026-10-23 — Weather Wardrobe batch 2: the trip happens and level 9 Which sky? (slices 5–6)

- [PR #876](https://github.com/rjdunlap/neo/pull/876): level 6 unpacks the suitcase, the pet wearing each weather's two items in forecast order; new level 9 *Which sky?* (toddler `[2, 9, 3, 4]`, preschool `[3, 9, 4, 5]`, `entryLevels: [8, 9]`). Wind (slice 7) not built.
- Ran: typecheck; `vitest` src/games, src/content, src/progress, src/app (all pass except `src/app/scenes/lab.test.ts` Tinker Lab, which also fails on unchanged `origin/main`); new `BROWSER_SUITE=wardrobe9` (grey scene, wrong sky twice with consequence, hint, three rounds, saved round, 2 misses and 1 hint) and `BROWSER_SUITE=wardrobe6` (trip unpacks two items per weather); `fingerdemo` `FINGER_ONLY=weather-wardrobe FINGER_LEVELS=9` (6.4 s); one portrait screenshot of level 9 reviewed.
- Not run: wind, `world`, `npm run build`, offline check, iPad/device.
- Open: whether the trip reads as a payoff and how level 9 plays for a toddler ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-23 — RW14 slice 1: first run on the island

- HatchScene uses Home's backdrop, grass position and a full-companion-height egg, with a soft plate behind colour/name controls; step order and saved result unchanged ([PR #895](https://github.com/rjdunlap/neo/pull/895)).
- Tested base `841999e3` plus the source/browser diff, `GAME_URL=http://localhost:5199`, `BROWSER_SUITE=home HOME_ONLY=first-run`: 1024×768 and 768×1024 backdrop/egg feet/height, four taps, ≥100-unit controls, colour/preset/custom name, save and reload passed; no page errors. Two portrait images reviewed (egg and colour plate).
- Typecheck/build passed. Full unit run: 2708 passed, four skipped, five failures in untouched Fluffy Salon, Bumper Garden, Penguin Slide and Bolt Boards; one filtered rerun of those four files passed all 64 tests (transient failures; no game code/test changes).
- Diff/link checks passed. No new assets, persistence or route changes; `world`, offline, couch and full-release suites not run under the scoped shell tier. No iPad, actual speech/touch or child-response claim.

## 2026-10-23 — Oceans study (subject research, docs only)

- [PR #849](https://github.com/rjdunlap/neo/pull/849), `claude/confident-gates-lvnhu9`: [study](../deep-dives/subjects/oceans.md), tracker, packet, roadmap, notebook, backlog, READY (research line replaced by the Tide Line definition) and a Waiting row.
- Opened: California's copy of NGSS 2-ESS2-2/3, 4-ESS2-2, 5-ESS2-2, MS-ESS2-6 and K-ESS3-3; the NOAA Ocean Literacy poster; two Common Sense Media reviews; Sobel's essay; a Smithsonian pre-K zones lesson. Search summaries only: tide-misconception studies, aquarium touch-pool rules, Ocean Conservancy data card, currents activities, Georgia Aquarium depths, Endless Ocean/Abzu/Beyond Blue.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, units, build, browser or device checks (docs only); nothing implemented.
- Open: an ocean reviewer, Ocean Literacy Guide V3.1, any NGSS tide expectation, Bubble Beach placement (a 14th game), decisions 1–9 in the study.

## 2026-10-23 — RW14 slice 2: residents in six locations

- The six second-wave creatures became the residents of Bubble Beach, Music Mountain, Painted Canyon, Cozy Village, Story Grove and Tinker Lab (`src/creatures/resident.ts`, `LOCATIONS`), with a poke reaction and hello line each; her own friend stands in where it is the resident's species, and the guide hides there. The 36 expression sprites ship as WebP (920 KB) ([PR #898](https://github.com/rjdunlap/neo/pull/898)).
- Ran: typecheck; `npm test` (217 files, 2720 tests, including the six location tests through `residentProblems`); `npm run build` (precache 174 entries, 11532.26 KiB, zero cast PNGs in `dist/assets`).
- Browser: `BROWSER_SUITE=home HOME_ONLY=residents RESIDENT_LAND=bubble-beach` at `http://localhost:5564`, passed twice (before and after Tote's fit changed from 0.85 to 0.95). `npm run test:offline` against `vite preview --port 5546` of the current build passed (167 cached assets).
- Not run: the other five locations in the browser, `world`, `picnic`, couch suites (unchanged). Open for a person: an iPad, real speech of the six hello lines and the child's reaction ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-10-23 — RW14 slice 3: one meaning per button

- At the root every house goes Home and every leaving control is a back arrow with its origin's picture (round hold, how-to card, result, location with a new house beside Back); root Back/Home speak their label on press; buttons carry `meaning`, and `src/app/nav-meaning.test.ts` presses them ([PR #899](https://github.com/rjdunlap/neo/pull/899)).
- Ran: typecheck; `npm test` (218 files, 2729 tests); `npm run build` (precache 174 entries, 11534.22 KiB). Regression proof: pointing the location house at `goHome` failed the route test, then restored.
- Browser: `GAME_URL=http://localhost:5883 BROWSER_SUITE=home HOME_ONLY=buttons` passed (Counting Cove Back and house in landscape and portrait, house at least 100 and left of the heading, how-to Back, round Back, result Back to the location, house to Home); five screenshots reviewed.
- Not run: `world`, offline (no persistence or asset change), iPad or device speech. Open: location keep-out rects not widened for the house; Home itself not in the route test.

## 2026-10-23 — RW14 slice 5: the result stands in its place

- At the root the result draws its origin's sky and hills (or Home's backdrop with no origin) under a lighter veil; a story round and `classic/` keep flat cream; result buttons unchanged ([PR #901](https://github.com/rjdunlap/neo/pull/901)).
- Ran (commit 125d13c9 on base fcb5d306): typecheck; `npm test` (219 files, 2732 tests, including `result-backdrop.test.ts`); `npm run build` (precache 174 entries, 11535.20 KiB).
- Browser: `GAME_URL=http://localhost:5344 BROWSER_SUITE=home HOME_ONLY=result` passed (Duck Pond from Counting Cove's spot on the cove sky with Back to the cove, from a Story Grove origin on the night sky, and with no origin on the home backdrop, at 1024×768 and 768×1024; Again and Back at their formulas; no page errors); six screenshots reviewed.
- Not run: offline (no new assets), `picnic` (stories untouched), `world`, `fingerdemo`, device. Open: an origin with a picture is not shown until slice 4's loader; location scenery is not drawn behind the result.

## 2026-10-23 — RW14 slice 7: buttons and cards with a finish

- One code-drawn finish (shadow, rim, two-tone face, highlight) and a press squash with a release spring for root buttons and cards; the "Island games" pill is a picture door; hit areas unchanged ([PR #902](https://github.com/rjdunlap/neo/pull/902)).
- Ran (commit e741893b on base eea1741e): typecheck; `npm test` (220 files, 2736 tests, including `finish.test.ts` hit-area checks); `npm run build`.
- Browser: `GAME_URL=http://localhost:5743 BROWSER_SUITE=home HOME_ONLY=buttons` passed; portrait screenshots of Home, Explore and Places at 768×1024 reviewed.
- Not run: offline (no assets or persistence changed), `world`, `fingerdemo`, device. Open: the door has no spoken label; PR #900's Arcade cards do not use the finish.

## 2026-10-23 — RW14 slice 6: the duck pilot

- [PR #904](https://github.com/rjdunlap/neo/pull/904): prepared chosen R22 base/portrait; Duck Pond alone uses the base still with bob/squash for round, icon and stickers. Hit circles and rules unchanged; shared texture survives instance destruction.
- Tested base `917eb6d9` plus the final source diff, frozen at `http://localhost:5202` (temporary snapshot, own Vite cache). Typecheck, all 10 Duck Pond rules and production build passed (175 precache entries, 11762.20 KiB; base bundled, portrait not bundled).
- Browser: `BROWSER_SUITE=originals ORIGINALS_ONLY=ducks DUCK_LEVELS=1,11,12` passed (first/deepest/entry, two misses and one hint at 11, reveal/sentence, completion and saved reward); loaded sprites and original 72/53-radius circles asserted. Portrait `test-results/browser/duck-pond-12-illustrated-portrait.png` reviewed. An earlier run was interrupted by Vite reloading a nested unrelated worktree; frozen rerun passed. The snapshot warned that symlinked local font files were outside its serving allow list, so screenshots may use fallback text; the illustrated texture and geometry checks passed, and the production build has its bundled fonts.
- Demo: `BROWSER_SUITE=fingerdemo FINGER_ONLY=duck-pond FINGER_LEVELS=11,12` clean in 69.3/27.4 seconds of the demo clock. Scoped production offline probe `node test-results/duck-pilot-offline.mjs` at `http://localhost:4202` passed: isolated classic reload and precached duck fetch/decode (451×486), no page errors; root/classic entry filenames matched current dist and duck base is in the precache.
- Not run: full offline/story/treehouse, world, couch or other duck games (unchanged); no iPad, device speech or child check. Broader art judgement stays open in DEVICE-CHECKS. No new generation.

## 2026-10-23 — RW14 slice 8: the last place first

- Per-profile `explore.last` (default null, repaired on load) set when a location opens from Places at the root; Explore shows a postcard of it above the four entries only after a visit ([PR #905](https://github.com/rjdunlap/neo/pull/905)).
- Ran: typecheck; `npm test` (220 files, 2738 passed, 1 failed: the block-garden hint-search timing test on untouched code, 33/33 on a filtered rerun); src/app, src/creatures, src/progress 286 passed after a final rename; `npm run build`.
- Browser: `GAME_URL=http://localhost:5622 BROWSER_SUITE=home HOME_ONLY=last-place` passed twice (second after a layout tweak); landscape and portrait screenshots.
- Failed: `npm run test:offline` against `vite preview --port 5531` (served `main-CIe7D08c.js` matches `dist`), twice at "Finished a new minigame while offline": the offline reload and Monster Munch's cached open worked but the scripted cookie taps did not finish the toddler round, likely stale after Monster Munch's band-table change `c49948e9` (not touched here). Open, not a pass.
- Not run: `world`, `fingerdemo`, device. Open: the postcard's location returns to Places, not Explore.

## 2026-10-23 — RW14 slice 9: moving between screens

- `App.show` renders the leaving scene to a texture, destroys it at once, then grows from the tapped box, shrinks into a returned box or crossfades (0.35 s / 0.3 s); rules in `src/app/transition.ts` ([PR #906](https://github.com/rjdunlap/neo/pull/906)). Classic shares `App`.
- Ran on `52273ee9`: typecheck; `npm test` (221 files, 2744 passed); `npm run build`; `BROWSER_SUITE=home` with `HOME_ONLY=buttons` and `HOME_ONLY=last-place` (dev server `http://localhost:5353`); full `BROWSER_SUITE=world` (it has no filter) on port 5233, passed (about 6 minutes) after one harness fix: its grown-ups' recolor check read `pip.rig.mesh.filters`, and since the illustrated companion `recolor` filters `rig.skin` (the first run stopped there).
- Probe (`test-results/rw14ms-probe.mjs`, ignored) froze the ticker mid-change: Places to Counting Cove grow, cove spot to Duck Pond grow, round Back shrink, cove Back shrink into its Places card, Places to Home fade; no cream frame, a tap during a change swallowed, no page errors.
- Not run: offline check (no assets or persistence changed), `fingerdemo`. Open: DOM-overlay scenes still snap; iPad smoothness and snapshot cost ([device check](../DEVICE-CHECKS.md)).

## 2026-10-23 — RW07 slice 2: Welcome a New Friend's song step

- Third card with Song Maker 2 (`freeBelowRange`, the test-guarded exception), her tune as a `TunePlaque`, and `welcome.done.song` or `welcome.done.song-hum` when fewer than two notes are kept ([PR #907](https://github.com/rjdunlap/neo/pull/907)).
- Ran on `0b36dd8e` (base `5ca0ee69`): typecheck; `npm test` (221 files, 2745 passed); `npm run build`; `BROWSER_SUITE=welcome` on `http://localhost:5713` (one-note song says the hum line and stores nothing; replay with 14 tapped jellies keeps the tune, Song Maker level unmoved, treehouse unchanged; portrait and landscape screenshots reviewed).
- Not run: `home`, `picnic`, offline (Home, `GameScene` and the save format unchanged). Open: device speech of the new lines and the hum line with a child ([device check](../DEVICE-CHECKS.md)); slice 3 not built.

## 2026-10-23 — RW05 slice 2b: Splish Splash and Weather Wardrobe on the companion rig

- `ctx.companion()` in both games, fewer parts per species (rule test: asked parts lie outside each other's reach), species-sized garments; `ctx.petSpec` and `companionSpec()` removed ([PR #909](https://github.com/rjdunlap/neo/pull/909)).
- Ran on `2889eadf` (dev server `http://localhost:5643`): typecheck; `npm test` (221 files, 2752 passed); `npm run build`; `BROWSER_SUITE=early EARLY_ONLY=bath` levels 1-9 on the sprout and, with `BATH_SPECIES=glider`, the glider; `BROWSER_SUITE=fourth FOURTH_ONLY=weather` levels 1-6 and 8 on sprout, glider and river (`WARDROBE_SPECIES`; the first sprout run timed out once at start with no other error and passed twice on rerun: likely a first-load flake); `wardrobe7` on glider and river; `fingerdemo` for `splish-splash` and `weather-wardrobe` at levels 1 and 9.
- Screenshots reviewed: bath level 6 on all three species, wardrobe levels 1 (rain, snow) and 5 on all three, level 7 glider portrait. `game-reviewer`: no blocking issues.
- Not run: offline check (no persistence or asset change), `world`, couch suites (CouchScene and the demo only lost a constructor field; the demo unit test passes). Open: iPad check of the sprout's smaller cheek and ear splotches and the river and glider garments, and a child's read of hats on side-on faces ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-23 — Measurement M3–M5 definition packets (docs only)

- [PR #911](https://github.com/rjdunlap/neo/pull/911), `codex/measurement-m3-m5`: Measuring Post 1–4 and one provisional Weights Case; study/READY/backlog/queue closeout.
- Source: claim parent plus docs-only upstream dispatch integration; no runtime, registration or asset changes.
- Passed: repository Markdown links/anchors and `git diff --check`; reviewed finite records, equal/common-unit alternatives and both-pan witness arithmetic.
- Open: Box Balance-first M5 finalization, placement/capacity and separate build admission; all implementation, search execution, layout/device/child observations remain pending.
- Not run locally: typecheck, unit tests, build or browser checks (docs-only tier); PR CI runs separately as publication requires.

## 2026-10-23 — Cue Studio levels 1–2 (programming P2)

- `claude/cue-studio` ([PR #917](https://github.com/rjdunlap/neo/pull/917)) on base `origin/main` `3c88988d`: new pre-K game `cue-studio` (Wave and Turn cards, one then two slots, Play, Step, Undo, a complete-run-only Finish and counted-once help; free creation, so misses are always 0), home Tinker Lab (14 games; the school view pages 7 + 6, land-pages test updated). Plain words only (Wave, Turn, Play, Step, Undo); no computer-science terms are claimed.
- Ran: typecheck; `npx vitest run` 226 files passed, with 26 new rule tests in `src/games/cue-studio/logic.test.ts`; `npm run build`; `BROWSER_SUITE=cuestudio` on `http://localhost:5991` (levels 1 and 2: empty Play and Finish inert, a full shelf, select-and-replace, an edit invalidating Finish, Undo, Step completing a run, help counted once, a helped play, portrait targets of 100 units or more, portrait and landscape screenshots, one sticker per round) passed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=cue-studio` clean (5.5 s, 14.5 s). `game-reviewer` found no bugs; two minor fixes applied.
- Not run: `lands`, `howto` and `smoke` suites (harness unchanged; the lands unit test passed), offline check, an iPad. Open: level 3 (P3); [device check](../DEVICE-CHECKS.md#cue-studio-levels-12-2026-10-23).
