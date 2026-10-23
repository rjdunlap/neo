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
