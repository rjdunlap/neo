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
