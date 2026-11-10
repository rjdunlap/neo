# Verification 2026-11-09 (archived entries)

## 2026-11-09 — Number Nook slice 6: level 7 The fifteen (PR #1432)

The seeded 4×4 starts exactly 30 slides from the goal. A 60,000-node exact search gives way to a route through the top row, left column and remaining 3×3. Tested `d3e8d3ca` plus the working diff.
Typecheck, build, scoped ESLint and Prettier, catalog generation and 22 Number Nook tests passed. The tests cover 25 exact starts, 90 detours that preserve completed borders, a hard fixture under 350 ms, and 87-unit upright and 102-unit sideways cells.
At `GAME_URL=http://localhost:5199`, `BROWSER_SUITE=numbernook NOOK_LEVELS=7` passed the refused tap, line slide, Undo and Start over, a 60-move detour, truthful fallback speech, one counted hint across two requests and one sticker. Reviewed the 768×1024 portrait. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=7` passed in 43.3 s.
PR CI caught a 843-character how-to card above the 840-character limit. Shortened two level 7 steps; focused how-to, catalog and barrel tests passed (25 passed, one skipped). The shared `howto` browser suite stopped at its unrelated controller count (23 expected, 26 found). An isolated probe confirmed the level 7 card, demo and 104/124-unit buttons fit in both orientations.
Fresh game review found no blocking issue. Offline and real-device touch and speech were not run.

## 2026-11-09 — Jar Sort slices 4–5: levels 11 and 12 (PR #1433)

Level 11 uses three cups and an exact picture goal. Level 12 moves the matching run at the top of a jar, up to the receiving jar's capacity. Tested `a4095493` plus the working diff.
Typecheck, 17 Jar Sort rules, the full unit suite (329 files, 6307 passed, 5 skipped), scoped formatting and lint, link checks and build passed. An independent exact search agreed on the shortest length of all 36 new puzzles.
At `GAME_URL=http://localhost:5193`, `BROWSER_SUITE=jarsort JAR_SORT_LEVELS=11,12` passed two full-cup refusals and one hint, both picture boards, a full run moved in one action, undo and one sticker per round. Reviewed the 768×1024 level 11 portrait.
`BROWSER_SUITE=fingerdemo FINGER_ONLY=jar-sort FINGER_LEVELS=11,12 FINGER_BAND=school` finished in 12.9 and 31.0 demo seconds. The new voice lines describe only the on-screen rules and use device speech. Offline, iPad touch and speech, and child play were outside the checks run.

## 2026-11-09 — Daily playtest slice: a phone is Today's six alone (PR #1434)

On a phone the root opens Today's six instead of Home; the hatch lays out upright; the six page uses the width upright and re-picks on a turn; Play all and a next-of-six tile on a daily round's result; a grown-up's playtest notes (`SaveData.playtest`, a plain-HTML sheet, copy as text); a manifest shortcut to `?daily`. Tested `a4095493` plus the working diff.
Typecheck and build passed. `npm test`: 330 files and 6,319 tests passed; `scripts/lint-config.test.mjs` could not load `eslint` in this worktree's `node_modules` (left to PR CI). New tests cover the notes' repair and bounds, `nextOfSix`, `phoneSized`, the save field and the hatch's narrow layout.
At `GAME_URL=http://localhost:5187`, `BROWSER_SUITE=phonefit` passed with its upright root pass changed for the phone-only root: the chooser opens the six, no All games, Play all and the pencil are there, a card is at least 110 px wide (was about 75), the result offers the next of the six, and a note saves. By hand in the app's browser pane at 390 × 844: a new player's hatch with no turn prompt, the six page, Play all into Number Nook, the result's next tile into Word Search, a note saved, and a turn re-picking the six. The offline check passed against the served build (on all interfaces; `vite preview` on `localhost` alone refused `127.0.0.1`).
Not run: a real phone (touch emulation only; a sideways width of 844 is not touch-emulated in the pane, so the sideways phone root was not seen), the clipboard on iOS, `home`, `world`. The spoken `daily.done` line still mentions the tiles button a phone no longer draws.

## 2026-11-09 — Lift It slices 4–5, Three ropes (PR #1437)

At school levels 7 and 8, hang both wheels and tap the crate ring to move the tied end and pull up with three supporting strands. Level 8 adds exact paws and knots cards. Tested `f5e21a28` plus the working diff; checked the ideal pulley rule against [OpenStax Physics 9.3](https://openstax.org/books/physics/pages/9-3-simple-machines).
Typecheck, build, link and diff checks, scoped ESLint and Prettier, and 223 focused game and content tests passed (1 skipped). The 34 Lift It rules cover 500 seeds, exact cards, fallback rounds and 100-unit ring clearance at 768×1024 and 1024×768. An earlier full local run caught a landscape overlap since corrected and an unrelated Bolt Boards timing failure that passed in isolation.
`BROWSER_SUITE=liftit FROM_LEVEL=7` passed a failed tug, a repeat counted once, one hint and a sticker. Reviewed the 768×1024 portrait with three separate strands. `FROM_LEVEL=8` passed the two-paw and nine-knot cards, one wrong card and a sticker. Filtered `fingerdemo` finished levels 7 and 8 in 66.4 and 62.5 demo seconds.
Open checks are real iPad play and device speech. The offline suite and older Lift It browser levels were outside this pass.

## 2026-11-09 — Marble Jump slice 4: level 9 A bigger triangle (PR #1428)

Changed: level 9, a six-row 21-hole triangle (20 marbles, all 21 starts clear), range 1–9; a closer-packed `boardLayout` (hit circles still 78 across); a frozen `BIG_FEWEST` table for the fewest-moves line; recovery cost measured (worst cold dead-end check about 5,000 boards, 2 ms).
Ran: `npm run typecheck`; `npm test` (331 files, 6328 passed; a first run under load had 8 timeouts, a clean rerun passed); `BROWSER_SUITE=marblejump` (adds level 9 at 1024×768 and 768×1024: bottom row above the buttons, one miss, one hint, finish with the moves line, one sticker; two screenshots); `fingerdemo` with `FINGER_ONLY=marble-jump FINGER_LEVELS=9` (45.1 s); `npm run build`.
Not run: offline. The `marble.go9` line is not rendered as a clip; device speech and enjoyment open.

## 2026-11-09 — Pile Match slice 2, level 9 A smaller tray (PR #1438)

School level 9 replays level 7's 18-piece heap with a four-place tray (count by threes to 18). Added `tray: 3 | 4 | 5`; school band is now 5–9; no voice-line or bot changes.

Ran: `npm run typecheck`; `npm test` (331 files, 6330 tests; 17 Pile Match rule tests: every board clears along its route at `t = 4` with the tray never above 2, a full four-place tray is reachable, hint search at levels 8 and 9 under 250 ms, hints legal and non-looping); `BROWSER_SUITE=pilematch` (level 9 four slots drawn, tray filled to four with no three, one refused tap = one miss, screenshot, solved by the ghost finger's choices, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pile-match FINGER_LEVELS=9` (26.8 s).

Not run: build (no shared files or assets changed), offline, `world`. Open: iPad play of the four-place tray.

## 2026-11-09 — Pile Match slice 3, level 11 Any three in a little pile (PR #1441)

Preschool and pre-K level 11: six pieces, two kinds, two layers, five-place tray, free play like level 3 (nothing is a miss). `entryLevels: [11]` keeps a carried level 11 from entering school at 9. No voice-line or bot changes.

Ran: `npm run typecheck`; `npm test` (331 files, 6343 tests; 19 Pile Match rule tests: level 11 shapes never fill a 5-place tray, 4 + 2 layers, no shape shared with levels 2/4, band orders, `stepLevel` 3 to 11 to 4, `landing(11, school)` = 5); `BROWSER_SUITE=pilematch` (levels 1, 8, 9, 11, 4; level 11 covered touch and three put-backs uncounted, tray at most 4, 0 misses 0 hints, sticker, sand-look screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pile-match FINGER_LEVELS=11 FINGER_BAND=prek` (9.9 s).

Not run: build (no shared files or assets changed), offline. Open: iPad play.

## 2026-11-09 — Pile Match slice 4, level 10 Look closely (PR #1444)

School level 10: twelve pieces of four look-alike kinds (two shapes in two colours) on two layers, five-place tray; a blue feather and a white sock join the kinds; a full-tray refusal names colour and shape.

Ran: `npm run typecheck`; `npm test` (331 files, 6346 tests; 24 Pile Match rule tests); `BROWSER_SUITE=pilematch` (level 10 upright: tray filled to five, one refused tap counted once and named by colour and shape, portrait screenshot, solved by taps); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pile-match FINGER_LEVELS=10` (17.8 s); `npm run build`; an ad-hoc screenshot confirmed the feather and sock art reads.
Not run: offline, `world`, any iPad or device check. Open: colour-blind reading of the level 10 pairs, a six-year-old's interest and device speech are in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-09 — Block Garden slice 5: level 12 Mind the snails (PR #1439)

Changed: level 12 is level 7's 8×8 bed with two snails (`snails: 2`); `snailGarden` loops over the snails, 24 frozen gardens (levels 5–8, 10, 11 regenerated byte-identical); grown-up `order` ends 11, 12; no new voice line.
Ran: `npm run typecheck`; `npx vitest run src/games/block-garden` (61 passed); registry/content tests (224 passed, 1 skipped); `BROWSER_SUITE=blockgarden GARDEN_LEVELS=12` (sideways 1024×768: worried snail, two refused snail drops = two misses, hint lit once and planted, snails kept, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-garden FINGER_LEVELS=12 FINGER_BAND=grownup` (19.6 s).
Not run: build, full `npm test`, other suites, any iPad or device check. Open: the I5 piece overhangs its tray card at 1024×768 (level 7's existing tray drawing).

## 2026-11-09 — Fraction Landings definition, fractions R3 (docs only, PR #1440)

Changed: new [definition](../definitions/frog-hop-fraction-landings.md) for two school Frog Hop levels, FL1 `frac-hop` and FL2 `frac-match` (tick model, cases, named misses, rule tests, tier); READY, the fractions study, the Frog Hop dive (G2 retired into it, IDs "next free when built") and the study docs updated. Nothing is built.
Ran: `node scripts/check-links.mjs` and `git diff --check` (both passed). Not run: typecheck, tests, any browser or device check; no new source opened. Open: the build, device speech of the fraction words and whether a six-year-old enjoys FL1 (person checks).

## 2026-11-09 — Second Chance Shed Picnic Loop 7–8 definition, nature-sustainability N4 (docs only, PR #1442)

Changed: new [definition](../definitions/second-chance-shed-7-8.md) for school levels 7–8 (cups across picnics, two-place wash tub, big mug in place of the study's jar, two authored cases at level 8); READY, the study, backlog row and [batch second-chance-shed 3](../GAME-BATCHES.md#second-chance-shed-3-picnic-loop).
Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, tests, build, any browser or device check; nothing was implemented. Open: the build, its picnic-set source check, and the person and device checks in the definition's check tier.

## 2026-11-09 — Sand Table level 4 definition, earth-materials E3 (docs only)

Changed: new [definition](../definitions/sand-table-sediment.md) for school level 4 *Where did it go?* (one-puff breeze rule, three authored hills in two directions, answer is the bay that gained); READY, the study, backlog row, Sand Table's definition and page. Sources opened: Geological Society of London "By wind" and University of Arizona HiRISE pages; the USGS eolian page returned 403 and the NPS White Sands PDF was unreadable.
Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, tests, build, any browser or device check; nothing was implemented. Open: the E4 build and its source re-check.

## 2026-11-09 — Second Chance Shed Picnic Loop 7–8 built, nature-sustainability N4 (PR #1445)

Changed: school levels 7–8 *Picnic Loop* on `second-chance-shed` (`picnic.ts` scene, picnic rules and layout in `logic.ts`, art, `shed.picnic.*` voice, how-to steps, 32 rule tests in `picnic.test.ts`, browser suite `shedpicnic`); school range now {4–8}.
Ran: `npm run typecheck`; `npm test` (332 files, 6378 passed, 1 skipped); `BROWSER_SUITE=shedpicnic` (level 7: unwashed carry 1 miss, unchanged ring free, washes, finish 1/0; level 8 case A: promise miss, empty-seat ring free, painter waiting second miss and glow, portrait screenshot, Show a hint then Show me one handing the mug over, ghost finger to the finish 2/2); `BROWSER_SUITE=fingerdemo FINGER_ONLY=second-chance-shed FINGER_LEVELS=7,8 FINGER_BAND=school` (31.5 s, 53.6 s); `npm run build`; `node scripts/check-links.mjs`.
Source check (the definition's gate): washable cups and mugs over disposable ones is consistent with EPA, [Reduce, Reuse, Recycle: What you can do](https://www.epa.gov/recycle/what-you-can-do); the one-use cups' material is never named, so no bin rule is implied.
Not run: other suites, the offline check, case B in the browser (rule tests cover it).

## 2026-11-09 — Snowball Merge deep dive (docs only, PR #1447)

Changed: new [deep dive](../deep-dives/snowball-merge.md) (five build slices, three developer decisions); the dive tracker, study backlog, READY (slices queued, research line removed, the phone-upright grown-up batches line moved into Next ten) and the waiting-on-developer list updated. Nothing is built.
Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, tests, any browser or device check. Open: the three decisions (school opening, couch course, swipe) and a person's play of level 1 on the iPad.

## 2026-11-09 — Grown-up upright games batch 2 (chunk 31, PR #1448)

Added upright phone play for Hat Band, Crossword, Picture Logic, Tile Pairs, Gem Swap and Lantern Lights. Tested base `415bf158` plus the working diff.
Typecheck, formatting, build, lint and 327 targeted tests passed across 15 files (one skipped), including layout at the reference, small, inset and short phone fixtures. In the initial full unit run, a stale generated-doc check and Secret Code’s timing check failed. Both passed in the targeted rerun after regenerating the docs.
At `GAME_URL=http://localhost:5196`, `BROWSER_SUITE=uprightgames PHONE_ONLY=hat-band,crossword,picture-logic,tile-pairs,gem-swap,lantern-lights` passed. Chromium touches started Check in Hat Band 4 after four touches. Crossword 5/6, Picture Logic 5/7, Tile Pairs 1/6, Gem Swap 1/8 and Lantern Lights 1/9 each finished with one sticker.
One screenshot per game reviewed at 390 × 844. Smallest targets, rounded to CSS pixels, were 51 for Hat Band, Tile Pairs and Lantern Lights, and 45 for Crossword, Picture Logic and Gem Swap. The Picture Logic test also checked the controller layout width.
Hat Band’s encore exceeded the 90-second headless cutoff on initial attempts, so its sticker is unverified. [Real-phone playtest](DEVICE-CHECKS-2026-11-09.md#grown-up-upright-games-batch-2) remains open. Offline verification was outside this layout slice. After integrating Frog Hop from `6b202ea1`, typecheck, 85 targeted tests and link checks passed. The upright play evidence still applies to the same six games.

## 2026-11-09 — Mossy Path slice 2, level 8 *A little patch*

Changed: `mossy-path` level 8 (pre-K, school; five frozen `PATCHES`, a free far tap with pulse), registry `order`s, how-to steps and level-7 line caps.
Ran: `npm run typecheck`; `npm test` (332 files, 6401 passed); `npm run build`; `BROWSER_SUITE=mossypath MOSSY_ONLY=patch` (free far tap with pulse, counted visited tap, portrait screenshot with cells at least 100, finish, one sticker) PASS; `BROWSER_SUITE=fingerdemo FINGER_ONLY=mossy-path FINGER_LEVELS=8` PASS (pre-K, 6.3 s).
Not run: other suites, offline, an iPad, a child.

## 2026-11-09 — Fruit Sums slice 5, level 7 *A times leaf* (PR #1451)

Changed: `fruit-sums` level 7 (school, last in order): plus, take-away and times leaves, composite targets up to 24, fruit up to 12; new lines `fsums.times`, `fsums.start7`.
Ran: `npm run typecheck`; `npm test` (333 files, 6435 passed; 76 fruit-sums rule tests, layout tests at five views include level 7); `BROWSER_SUITE=fruitsums FROM_LEVEL=7` (portrait 768×1024, a wrong product as a miss, a times way, a way with another sign, screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=fruit-sums FINGER_LEVELS=7` (14.2 s).
Not run: `npm run build` (no shared file changed), other suites, device speech of the new lines (no clips yet), an iPad, a child.

## 2026-11-09 — Docs streamlined for the phone-playtest focus (docs only, PR #1452)

**Changed:** device, child and controller checks are parked ([DEVICE-CHECKS](../DEVICE-CHECKS.md) is one short page; its 616 items are in [the archive](DEVICE-CHECKS-2026-11-09.md)); [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) is two rows; the roadmap, READY, AGENTS.md, the session guide, the docs-keeper agent and the dive template name the phone focus and stop repeating either list; 82 coverage caveats lost their device-only clauses; [OBSERVATIONS](../OBSERVATIONS.md) and the README's phone section describe the playtest loop; four loose docs and the removed roadmap text moved to [the archive](README.md).

**Ran:** `node scripts/check-links.mjs` (links ok) and `git diff --check`. No code changed and no code checks ran locally; CI runs `npm test` and the build on the PR.

## 2026-11-09 — Grown-up upright games batch 3 (chunk 31, PR #1454)

**Changed:** `block-garden`, `logic-grid`, `species-comeback` and `pyramid-solitaire` set `upright: true` (all bands) with upright layouts (`pyramidLayout`, `comebackLayout`, `caseLayout`/`slidingLayout`, a `gardenLayout` guard); the `uprightgames` suite now plays drag intents. Smallest targets at 390 × 844: Pyramid Solitaire 51 px, Block Garden beds 36.6 px, Logic Grid squares and Species Comeback cards 32.5 px (the 64-unit grown-up minimum, as sideways).

**Ran:** `npm run typecheck`; `npm test` (334 files, all pass after `npm run game-docs`), including the new `upright-batch-3.test.ts` (16 tests on the phone, small, tall and short upright views; Block Garden at all 12 levels); `BROWSER_SUITE=uprightgames PHONE_ONLY=pyramid-solitaire,species-comeback,block-garden,logic-grid` on a 390 × 844 touch phone: block-garden 5 and 12, logic-grid 7 and 8, pyramid-solitaire 1 and 3, species-comeback 1 and 3 each finished with one sticker; top-level screenshots reviewed, and child levels of Logic Grid (1, 5, 6) and Block Garden (prek 1, school) screenshotted upright.

**Not run:** `npm run build` (only game files and one browser suite changed; CI builds), `fingerdemo` (the upright play covers the bots' targets), offline.

## 2026-11-09 — Grown-up upright games batch 4 (chunk 31, PR #1457)

**Changed:** `log-roll`, `marble-jump` and `snowball-merge` set `upright: true`; `logRollLayout(v, floor)` and `snowballLayout(v)` are exported layouts (Log Roll's floor starts at y 230 and centres in the tall view; Snowball cells grow to 160 upright); Marble Jump's `boardLayout` already fit. Smallest targets at 390 × 844: Log Roll and Snowball Merge 100 units = 51 px, Marble Jump 78 units = 39.6 px (as sideways). The grown-up upright pool is 19 games.

**Ran:** `npm run typecheck`; `npm test` (336 files, 6469 tests, all pass), including the new `upright-batch-4.test.ts` (every Log Roll floor and its mirror, both Marble Jump boards with holes 78 apart, Snowball's field at 390 × 844, 375 × 667, 430 × 932 with insets and 375 × 601); `BROWSER_SUITE=uprightgames PHONE_ONLY=log-roll,marble-jump,snowball-merge` on a 390 × 844 touch phone: each game finished with one sticker (marble-jump 1 in 4 touches and 9 in 38; log-roll 1 in 4 and 7 in 12; snowball-merge 1 in 3 and 3 in 8); top-level screenshots reviewed.

**Not run:** `npm run build` (no shared files or assets changed; CI builds), `fingerdemo` (the bots tap nodes by reference), other suites.

## 2026-11-09 — Lap and toddler upright games, batch 5 (chunk 31)

**Changed:** `bubble-pop`, `sing-along-barn`, `animal-snack`, `size-parade`, `far-lights` and `stamp-studio` set `upright: true` (25 upright-ready games); new layouts `spawnBox`, `spotEdges`/`snackXs`, `rowXs`/`cardSpots`, a Far Lights upright layout (it was a dark screen upright) and `stampLayout`; `GameScene.placeTip` moves the lap and toddler tip below Home upright. Sideways layouts unchanged.
**Ran:** `npm run typecheck`; full `npm test` (337 files, 6493 passed, 1 skipped), including the new `upright-batch-5.test.ts` (every game at 390 × 844, 375 × 667, 430 × 932 with a notch and a short 375 × 601: 100-unit minimum, smallest target at least 50 px at 390 × 844); `npm run build`; one upright screenshot per game at 390 × 844 on the dev server without `?uprightall` (no turn prompt, no page errors): bubble-pop 14, sing-along-barn 6 and 3, animal-snack 5 and 1, size-parade 15, far-lights 6, stamp-studio 6 and 9; far-lights 1, 5 and 8 also with `?uprightall` after the fix.
**Not run:** `BROWSER_SUITE=uprightgames` (it plays only grown-up-band games), `phonefit`, offline (no manifest, asset or persistence change), `fingerdemo` (bots read live node positions; no rule change).

## 2026-11-09 — Crossword keeps the clue direction (PR #1455)

A square tap keeps Across or Down where available. Two consecutive taps on a crossing switch direction, including after typing moved the cursor there.

Ran on `2b0467e3` plus the working diff: typecheck, 71 Crossword rule tests (both new cases failed before the fix), and a 390 × 844 Chromium probe at `GAME_URL=http://localhost:5199` on level 6. Touch selection, a physical-keyboard event and an on-screen key entered two Down letters in the right squares. Two taps switched the clue to Across.

At the same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=crossword FINGER_LEVELS=5,6 FINGER_BAND=grownup` finished levels 5 and 6 (37.5 s and 51.5 s).

The broader `crossword` browser suite and offline checks were not run for this typing fix.

## 2026-11-09 — Upright sweep of the early-school games (chunk 31, PR #1456)

**Changed:** a dev-server-only `?uprightall` switch in `GameScene` (absent from the build; no match in `dist`) and the `uprightsweep` browser suite, which plays every school-band game not yet `upright` at its top school level on a 390 × 844 touch phone and sorts it by measured target size. No game became upright.
**Ran:** `npm run typecheck`; `npm test` (335 files, 6455 tests pass); `npm run build`; `BROWSER_SUITE=phonefit` passed (the turn prompt still shows over a not-ready game without the switch); `BROWSER_SUITE=uprightsweep` over all 124 games (pass) plus filtered reruns. Result: 57 fit, 37 small fix, 28 need a layout, 1 not judged, 1 not a phone game; the "look" group was judged by eye from thumbnails, and `fruit-sums` flipped between runs. Lists: [the sweep](../definitions/phone-portrait.md#the-upright-sweep-built-2026-11-09).
**Not run:** offline and `world` (no persistence, asset or navigation change).
