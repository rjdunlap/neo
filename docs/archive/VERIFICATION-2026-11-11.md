# Verification 2026-11-11 (archived entries)

## 2026-11-11 — Snowball Merge slice 3, level 5 The ice rock (PR #1495)

**Changed:** `ROCK` in `logic.ts` (`slide` splits lines at it and reports `rocked`); level 5 plan and grown-up range 1–5; `scripts/snowball-merge-boards.ts` level-5 band (route 8–11, rock never in the centre) and three more frozen boards; the ice-block art, the `snowball.rock` pet line, a level-scoped how-to step. Levels 1–4 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (345 files, 6598 passed; snowball-merge 10 rule tests); `npm run build`; `BROWSER_SUITE=snowball` (levels 1, 4 and 5 at 390 × 844: the rock stays put, the rock line is said on the first slide against it, one sticker, 0 misses, 0 hints; portrait screenshot `snowball-merge-5-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=5` (13.2 s); docs checks.
**Not run:** offline, `world`, other suites.

## 2026-11-11 — Phone polish: the way in, the six's level lines and the result (PR #1496)

**Changed:** `chooser.css` phone layouts (upright: one-line title below the sun, Add a player as a row on screen, two cards across from two players; sideways: a whole card with its Couch play) and the sun beside the short heading; `levelLine` cuts a grown-up card's level line on the six at a clause or word instead of shrinking it, and names wrap inside the cell; `dailySpots` puts a daily result's next game between Again and Back on a tall view; no house on a phone's daily result.
**Ran:** `npm run typecheck`; `npm test` (345 files, 6602 passed; new tests for `levelLine` over every touch game's levels and for `dailySpots` at three upright views); `npm run build`; `BROWSER_SUITE=phonefit` (new: title one line and below the gear, Add a player on screen, next game between Again and Back, no house) and `BROWSER_SUITE=profiles` at port 5191; screenshots of the chooser with 0–3 players, the six and a daily result at 390 × 844, 844 × 390, 360 × 640 and 320 × 568, reviewed.
**Not run:** `world` (no route changed), offline (no persistence or asset change), `phone`, couch suites. Chrome only.

## 2026-11-11 — Sorting Machine levels 8–9, Festival Signals and Fix the lantern (PR #1497)

**Changed:** `sorting-machine` levels 8 and 9 at the grown-up band (`order: [3, 9, 8]`, school unchanged): a flat four-slot machine (`flat.ts`, `festival.ts`, `festival-art.ts`, `accepted.ts` with the 24 accepted machines); the game is now `upright: true`; the two `howto.test.ts` loops walk `levelsInOrder`.
**Ran:** typecheck; `npm test` (347 files, 6625 passed, 1 skipped; `flat.test.ts` 17 tests re-deriving the accepted set over all 2,005,696 fillings, `upright.test.ts` 9); `npm run build`; `BROWSER_SUITE=festivalsignals` (new: level 9 at grown-up, a failed Check = one miss, Help twice, a second miss and the glow, the wire moved, Undo, Send, passes with 2 misses and 4 hints; level 8, an incomplete Check free, the ghost finger builds it, 0/0; portrait 768 × 1024 and landscape screenshots reviewed); `BROWSER_SUITE=uprightgames PHONE_ONLY=sorting-machine` (390 × 844 touch phone, real touches: level 3 in 5 touches, level 8 in 19, one sticker each; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sorting-machine FINGER_LEVELS=8 FINGER_BAND=grownup` (19.3 s).
**Not run:** `sortingmachine` (levels 1–3 code unchanged), `world`, offline, couch suites, `fingerdemo` at 9 (the rule test plays level 9's plan). Chrome automation only.

## 2026-11-11 — Snowball Merge slice 4, level 6 Build a snowman (PR #1498)

**Changed:** `Goal` (one number or several snowballs), `SNOWMAN`, `complete`, `overshot` and a goal-aware `solve` in `logic.ts`; level 6 plan and grown-up range 1–6; `scripts/snowball-merge-boards.ts` level-6 band (route 6–9) and three more frozen boards; the stacked-snowman finish, the `snowball.over` join-too-many line with Undo lighting on its own, three voice lines and a level-scoped how-to. The goal is three 16s rather than the dive's 32 and 16 (the latter can never be overshot). Levels 1–5 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (347 files, 6635 passed, 1 skipped; snowball-merge 14 rule tests); `BROWSER_SUITE=snowball` (level 6 at 390 × 844: one join too many, Undo lights and takes it back, three 16s stacked in one column, one sticker, 0 misses, 1 hint; screenshots `snowball-merge-6-portrait` and `snowball-merge-6-snowman`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=6` (10.0 s); docs checks.
**Not run:** `npm run build` (no shared file or asset changed; CI builds), offline, `world`, other suites. The three new voice lines have no pre-rendered clip; device speech is the fallback.

## 2026-11-11 — Rule Machine levels 5–6 (AB2) definition (docs only, PR #1499)

**Changed:** new [definition](../definitions/rule-machine-5-6.md) of Rule Machine level 5 *Backwards* and level 6 *Two machines* in two build batches (rule-machine 3, then 4); the study, packet, batch plans, READY, study backlog and roadmap point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built); the case counts in the definition were enumerated by a throwaway script, and the builds' rule tests are the proof.

## 2026-11-11 — Picture Bytes (H6) definition (docs only)

**Changed:** new [definition](../definitions/picture-bytes.md) of Pixel Pictures levels 11 *Ones and zeros* and 12 *A whole picture* in two build batches (pixel-pictures 5, then 6); the study, packet, batch plans, dive, READY and the study backlog point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`; the definition's `levelsInOrder` helper and the `woods` suite's Pixel Pictures case were confirmed present in the source.
**Not run:** typecheck, unit tests, build and browser suites (nothing built).

## 2026-11-11 — Memory Desk (H8) definition (docs only, PR #1504)

**Changed:** new [definition](../definitions/memory-desk.md) of a proposed school game, Memory Desk, levels 1–3 (*Keep one*, *Open or shut*, *Fix the desk*), kept separate from Parcel Programs for those levels, in two build batches (memory-desk 1, then 2); the study, packet, ideas, batch plans, READY and the study backlog point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built).

## 2026-11-11 — Snowball Merge slice 5, level 7 A wider field (PR #1501)

**Changed:** per-board field size (`sizeOf`), `routeMap`/`routeFrom` (a distance map built once per round that the scene now reads hints from at every level), level 7 plan on a 4×4 board and grown-up range 1–7; `scripts/snowball-merge-boards.ts` level-7 band (route 12–16) and three more frozen boards; `snowballLayout(v, size)`; a level-7 how-to step. Levels 1–6 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (347 files, 6638 passed, 1 skipped; snowball-merge 17 rule tests, the map agreeing with `solve` on every reachable board of the 3×3 boards and the authored 4×4 one, a 1-in-7 sample of the other three; `upright-batch-4` for the 4×4 layout); `npm run build`; `BROWSER_SUITE=snowball SNOWBALL_LEVELS=7` (390 × 844: 16 cells, one glow counted as one hint, hints finish in the map's 13 slides, one sticker, 0 misses, 1 hint; portrait and landscape screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=7` (15.3 s).
**Not run:** the other `snowball` blocks (levels 1, 4, 5, 6, land launch; their hints now come from the map and only unit tests cover that), `uprightgames`, `world`, offline, couch suites. The harness viewport is not a touch phone, so the real upright layout is covered by the unit test only.

## 2026-11-11 — Rule Machine level 5 Backwards (algebra-balance AB2, batch rule-machine 3, PR #1502)

**Changed:** level 5 (school range now 2–5): each machine wears its card, a wanted car stands at the chute's end and she sends the car that went in; a wrong car runs, its row is written, one miss, the pet says more or fewer, two wrong glow the right car; the take-away rule icon now draws one crossed counter per counter taken.
**Ran:** `npm run typecheck`; `npm test` (347 files, 6645 passed, 1 skipped; the rule-machine file has 55 tests, 7 new for level 5: an increasing pool with at least five valid inputs, every tray by enumeration, direction, 300 seeded rounds, accounting, layout equal to level 2, lines exist); `npm run build`; `BROWSER_SUITE=rulemachine RM_LEVELS=5` at `http://localhost:5647/classic/` (portrait 768×1024, speech off, on the final code): two wrong cars on the first wanted car (2 misses, rows written, glow, 1 hint), then four right cars, saved 2/1; `fingerdemo` (`FINGER_ONLY=rule-machine FINGER_LEVELS=5`) passed, run before the icon-only art change and not rerun; portrait screenshot reviewed. Source check: "went in / came out" and the inverse framing against CCSS 4.OA.C.5 and England's Year 2 statement.
**Not run:** offline, `world`, other suites, a replay of levels 1–4 (unchanged, last recorded passing); CCSS 3.OA.D.9 and 5.OA not re-fetched.

## 2026-11-11 — Pixel Pictures level 11 Ones and zeros (H7, batch pixel-pictures 5, PR #1503)

**Changed:** school level 11 (order 3, 4, 5, 6, 7, 8, 11, 10): four bit cards, a free arrow and a check write a row of squares under a key card; three seeded rows, a failed check is a miss, every second one a hint; new `bits.ts`, rules in `logic.ts`, six voice lines, a level-scoped how-to and ghost finger.
**Ran:** `npm run typecheck`; full `npm test` (then the pixel-pictures and `src/content` tests again after the how-to fix and formatting: 226 passed; 9 new level-11 rule tests incl. layouts at landscape, portrait, phone and notch); `BROWSER_SUITE=woods WOODS_ONLY=bits` at 390 × 844 to the sticker (6 misses, 3 hints: two failed checks then the glow; four failed checks with the glowing card flipped as help; free flips and arrow asserted) and once at 1024 × 768; upright screenshot reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures FINGER_LEVELS=11` (20.7 s); `npm run build`. Wording source check: the lines say only "ones and zeros / cards / row / key"; no external source re-fetched.
**Not run:** offline, `world`, a replay of levels 1–10 (unchanged code paths). Chrome automation only.

## 2026-11-11 — Rule Machine level 6 Two machines (algebra-balance AB2, batch rule-machine 4, PR #1505)

**Changed:** level 6 (school range now 2–6): two pairs a round; one car goes through two machines by itself, she predicts the next car on pads, then builds a pair from a shelf of four for a wanted in → out (the watched pair reversed, any fitting pair accepted, the first pair per target free, glow after two counted misses, one hint per pair); new `chain.ts`, chain rules in `logic.ts`, ten voice lines, a level-6 how-to step.
**Ran:** `npm run typecheck` (rerun after the review fix); `npm test` (347 files, 6661 passed, 1 skipped; the rule-machine file has 62 tests, 7 new for level 6: chain, 51 cases by enumeration, every pair of every case over 8 seeds for shelf, fitting and help within four moves, 300 seeded rounds, accounting, layout at four views, lines exist), run before the review fix, which changed only tap detection in `chain.ts`; `npm run build` (also before the fix); `BROWSER_SUITE=rulemachine RM_LEVELS=6` at `http://localhost:5368/classic/` (portrait 768×1024, speech off, on the final code): a wrong pad (1 miss), the watched order free, two more non-fitting pairs (2 misses, glow, 1 hint), help followed to a fitting pair, second pair straight, saved 3/1; `fingerdemo` (`FINGER_ONLY=rule-machine FINGER_LEVELS=6`) passed (27.6 s), run before the review fix and not rerun; portrait screenshot while building reviewed. Source check: CCSS 5.OA.A.2 and 5.OA.A.1 (one rule then another in a stated order) and 3.OA.D.9.
**Not run:** offline, landscape browser play (layout is unit-tested at four views), a replay of levels 1–5, a browser drag (as opposed to tap) placement of cards, `world`, `npm test` and `build` after the review fix.

## 2026-11-11 — Pixel Pictures level 12 A whole picture (batch pixel-pictures 6, PR #1506)

**Changed:** school level 12 (order 3, 4, 5, 6, 7, 8, 11, 12, 10): the four cards write a 4×4 one-colour picture a row at a time beside a preview board; two of five pictures per round, an empty row is right as it stands, the reveal then `pixel.bits.same`, the last picture kept; `bitsPicture` in `bits.ts`, `bitRowsOf` and the level-12 `bitsLayout`, three voice lines, how-to steps.
**Ran:** `npm run typecheck`; full `npm test` (347 files, 6664 passed, 1 skipped); `BROWSER_SUITE=woods WOODS_ONLY=bits12` at 390 × 844 upright (two pictures, an empty row checked without a flip, two failed checks = 2 misses and 1 hint with the glow, saved score [2, 1], sticker, picture offered and kept; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures FINGER_LEVELS=12 FINGER_BAND=school` passed (56.7 s).
**Not run:** `npm run build` locally (CI runs it), offline, other suites, a replay of levels 1–11 (unchanged paths). Chrome automation only.

## 2026-11-11 — Memory Desk level 1 Keep one (H8, batch memory-desk 1, PR #1507)

**Changed:** new school game `memory-desk` in Tinker Lab (29 games; school pages as four pages of 7, lands tests held the default land): rules in `logic.ts` (copies never empty their source, `contrastSeen`, seeded briefs, `deskLayout`), scene, art, voice lines, how-to card, one rendered title clip, `upright: true`. Help after the contrast points at the tick and counts no hint.
**Ran:** `npm run typecheck`; full `npm test` (348 files, 6687 passed, 1 skipped, 23 memory-desk rule tests, `contrastSeen` against a brute force of every history up to six presses); `BROWSER_SUITE=memorydesk` (dim Done, empty Keep and Show, copies, one Help, Undo, the contrast, portrait and landscape screenshots, one sticker saved 0 misses / 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=memory-desk` (level 1, about 8 s); `npm run build`. The play caught a dim-Done nudge asking for a missing line id (fixed).
**Not run:** offline, `world`, other browser suites. Chrome automation only.

## 2026-11-11 — Memory Desk levels 2–3 Open or shut and Fix the desk (H8, batch memory-desk 2, PR #1510)

**Changed:** `memory-desk` range is now school 1–3: `HatchDesk` (`hatch.ts`), hatch rules and `hatchLayout` in `logic.ts`, hatch, trace, sign, turtle and step art, 24 new `md.*` voice lines (device speech, no rendered clips), how-to steps for levels 2–3. Check after a hatch change is one miss; every second failed Check on a brief glows the hatch `helpFor` names and counts one hint; Help is one hint a press.
**Ran:** `npm run typecheck`; full `npm test` (348 files, 6717 passed, 1 skipped; the memory-desk file now has 46 tests: transition table, exhaustive solutions, help convergence, seeds, layout at six views with two and three steps); `npm run build`; `BROWSER_SUITE=memorydesk` (level 1 as before; level 2: untouched Check nudge, Undo, two Steps, a failed Check = 1 miss, the same hatches checked again = no second miss, a second failed Check after a change = glow + 1 hint, both briefs passed, history 2 misses / 1 hint; level 3: untouched nudge, Help twice per repair, Step to fill her row, portrait and landscape screenshots, history 0 misses / 4 hints); `BROWSER_SUITE=fingerdemo FINGER_ONLY=memory-desk FINGER_LEVELS=2,3` (16.1 s and 12.0 s). The play caught Help's glow ending before its slow run did; the `game-reviewer` pass found a repeated Check counting a second miss and a glow that kept its old place after a turn of the screen (all fixed; `memorydesk` rerun after the fixes, `fingerdemo` not rerun since the bot's path does not touch them).
**Not run:** `world`, offline, other browser suites, the full release flow. Chrome automation only.

## 2026-11-11 — Tile Pairs deep dive (docs only, PR #1508)

**Changed:** new [dive](../deep-dives/tile-pairs.md) (seeded pairing, Peek, two more looks, levels 7–9, three decisions); the tracker, study backlog, READY and batch plans (tile-pairs 1 and 2) point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the game was read, not played).

## 2026-11-11 — Pok Pok P1, one rainbow one direction (Song Maker, Jelly Drums, tune plaque; PR #1509)

**Changed:** `PITCH_COLORS` and `pitchColor(rank, count)` in `src/audio/notes.ts` (red lowest, blue highest); Song Maker's rows and hub icon now run red at the bottom to blue at the top; Jelly Drums (unchanged on screen) and the treehouse tune plaque read the same table. A kept tune stores rows and columns, so saves are unaffected. Sound Garden and Beat Builder are not pitch-coloured and were left alone. `notes.test.ts` checks the direction for 3, 4 and 5 pitches and that the three users keep no table of their own.
**Ran:** `npm run typecheck`; `npm test`; `BROWSER_SUITE=fourth FOURTH_ONLY=song` (Song Maker levels 1–7; a level-5 screenshot shows blue top row to red bottom row on the board and the card); `BROWSER_SUITE=fingerdemo FINGER_ONLY=song-maker` (levels 1 and 7); `npm run build` (shared files changed). Chrome automation only.
**Not run:** offline, `world`, `creations-room` (the plaque's colours were not looked at in a browser), any Jelly Drums play (no on-screen change).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Bubble Beach (docs only, PR #1511)

**Changed:** new [page](../definitions/toy-test-lap-openings.md) (the five toy-test questions answered from the code for Bubble Beach's eight lap games, a words-off list, the other lap games listed by land); READY's P4 line and seven new lap-opening lines; a progress line under P4 in `docs/POK-POK.md`.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the eight games were read, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Music Mountain (docs only, PR #1512)

**Changed:** the Music Mountain table (five games: `jelly-drums`, `sound-garden`, `puppet-stage`, `rhythm-neighbors`, `song-maker`) and its words-off list on the [toy-test page](../definitions/toy-test-lap-openings.md); two READY lines (`rhythm-neighbors`, `song-maker`; `jelly-drums`, `sound-garden` and `puppet-stage` get none); the P4 line and progress counts (13 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the five games were read from the code, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Painted Canyon (docs only, PR #1513)

**Changed:** the Painted Canyon table (five games: `rainbow-fingers`, `fluffy-salon`, `stamp-studio`, `draw-the-pattern`, `gear-garden`) and its words-off list (all five) on the [toy-test page](../definitions/toy-test-lap-openings.md); three READY lines (`draw-the-pattern`, `stamp-studio`, `gear-garden`; `rainbow-fingers` and `fluffy-salon` get none); the P4 line and progress counts (18 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the five games were read from the code, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Barnyard (docs only, PR #1514)

**Changed:** the Barnyard table (six games: `peekaboo-barn`, `duckling-parade`, `roundup`, `egg-catch`, `animal-snack`, `sing-along-barn`) and its words-off list (five, `egg-catch` partly) on the [toy-test page](../definitions/toy-test-lap-openings.md); four READY lines (`egg-catch`, `animal-snack`, `duckling-parade`, `roundup`; `peekaboo-barn` and `sing-along-barn` get none); the P4 line and progress counts (24 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the six games were read from the code, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Counting Cove (docs only, PR #1515)

**Changed:** the Counting Cove table (five games: `duck-pond`, `monster-munch`, `little-helpers`, `pet-kitchen`, `fill-dump`) and its words-off list (four voice-off, `duck-pond` partly) on the [toy-test page](../definitions/toy-test-lap-openings.md); three READY lines (`duck-pond`, `pet-kitchen`, `monster-munch`; `little-helpers` and `fill-dump` get none); the P4 line and progress counts (29 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the five games were read from the code at `origin/main` `892834eb`, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Cozy Village (docs only, PR #1517)

**Changed:** the Cozy Village table (eight games: `splish-splash`, `feelings-faces`, `weather-wardrobe`, `scoop-shop`, `mail-carrier`, `teddy-doctor`, `stop-and-go`, `pet-says`) and its words-off list on the [toy-test page](../definitions/toy-test-lap-openings.md); six READY lines (`teddy-doctor`, `scoop-shop`, `stop-and-go`, `mail-carrier`, `feelings-faces`, `pet-says`); the P4 line and progress counts (37 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the eight games were read from the code at `origin/main` `7f12c562`, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Rainbow Meadow (docs only, PR #1518)

**Changed:** the Rainbow Meadow table (six games: `shape-sorter`, `color-garden`, `dot-link`, `garden-grow`, `swing-pals`, `sand-table`) and its words-off list on the [toy-test page](../definitions/toy-test-lap-openings.md); four READY lines (`dot-link`, `color-garden`, `sand-table`, `shape-sorter`; `garden-grow` and `swing-pals` need none); the P4 line and progress counts (43 of 57 read).
**Ran:** `node scripts/check-links.mjs` (links ok); `git diff --check` (clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the six games were read from the code at `origin/main` `bd67aa66`, not played or timed; the readings were done by six parallel reader agents and key claims spot-checked against the code).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Puzzle Peaks (docs only, PR #1519)

**Changed:** the Puzzle Peaks table (two games: `size-parade` level 16, `puzzle-pals` level 1) and its words-off list on the [toy-test page](../definitions/toy-test-lap-openings.md); two READY lines (`puzzle-pals`, `size-parade`); the P4 line and progress counts (45 of 57 read).
**Ran:** `node scripts/check-links.mjs` and `git diff --check` (links ok; diff check clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the two games were read from the code at `origin/main` `d4fbbb71`, not played or timed).

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Story Grove (docs only, PR #1520)

**Changed:** the Story Grove table (six games: `word-monsters` 1, `photo-safari` 1, `goodnight-room` 1, `opposites` 1, `attic-finds` 3, `word-glue` 1) and its words-off list on the [toy-test page](../definitions/toy-test-lap-openings.md); six READY lines (`goodnight-room`, `photo-safari`, `word-monsters`, `word-glue`, `opposites`, `attic-finds`); the P4 line and progress counts (51 of 57 read).
**Ran:** `node scripts/check-links.mjs` and `git diff --check` (links ok; diff check clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the six games were read from the code at `origin/main` `d80b14e9`, not played or timed).

## 2026-11-11 — Tile Pairs slice 1, a fresh pairing and a visible uncovering (PR #1522)

**Changed:** `tile-pairs` `logic.ts` (`seededRoute`, a per-level `clear` band and `deal` over up to 40 seeded routes at 60 play-outs each), `logic.test.ts` (the frozen hash test for levels 1–3 replaced by property tests) and `index.ts` (a pair lifts and fades, freed tiles pulse, "pairs open" in the tally); no shared file, voice, how-to, level table or couch change.
**Ran:** `npm run typecheck`; `npx vitest run src/games/tile-pairs` (9 passed); `BROWSER_SUITE=tilepairs TILE_LEVELS=3` (mismatch, hint, undo, shuffle, resize, one sticker, return to Lantern Lake) with the portrait screenshot read for the tally. Measured over seeds 1–100 a level on a Mac: kept boards re-measure at 100/99/97/96/87/82% over 200 play-outs, at most 3 exhausted candidate lists, worst deal 24 ms.
**Not run:** `fingerdemo` (the bot's actions do not change), `npm run build` (no shared file or asset changed; CI builds), couch suites, offline. The lift and pulse are transient and were not captured in a still.

## 2026-11-11 — Pok Pok P4, the toy test for lap openings: Tinker Lab (docs only, PR #1524)

**Changed:** the Tinker Lab table (six games: `bouncy-launch` 1, `seesaw-balance` 12, `block-tower` 1, `moon-window` 1, `vine-snip` 1, `far-lights` 1), its words-off list and a closing "Every land is read" section on the [toy-test page](../definitions/toy-test-lap-openings.md); five READY lines (`far-lights`, `bouncy-launch`, `moon-window`, `seesaw-balance`, `vine-snip`); the P4 line left Next ten and the progress count is 57 of 57, so the audit is done.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the six games were read from the code at `origin/main` `353daaba`, not played or timed).

## 2026-11-11 — TotoLogic reviewed again after playing it (docs only, PR #1523)

**Changed:** [TOTOLOGIC.md](../TOTOLOGIC.md) rewritten from play: the screen table and a table of what each category holds, the verdicts, P1–P5 each with an "after play" note (P3, the caption for readers, now first), P6 (tap to fill) withdrawn as a misread screenshot, and three new proposals (P7 say why after a right answer, P8 a drawn total on Market Stall's counter, P9 a read-through of how drag games count a miss); its pointers in IDEAS, the grown-ups' page definition, the Rainbow Fingers row (corrected), new rows in the Market Stall and Pattern Train dives, the tap-then-place lines in POK-POK and READY, and one sound-off clause on the phone playtest list.
**Ran:** `node scripts/check-links.mjs` and `git diff --check` (links ok; diff check clean).
**Not run:** typecheck, unit tests, build and browser suites (nothing built). TotoLogic 1.0.0 (14) was played on the developer's Android phone by the assistant over USB, with the phone muted and speech transcribed by software; no child played, and the island's side of each comparison was read from the code at `origin/main` `353daaba`, not played.

## 2026-11-11 — Tile Pairs slice 2, Peek under the stack (PR #1525)

**Changed.** Peek fades covering tile bodies and shows every picture in a stack in layer order. The touch button, P and top controller button toggle it. Choosing a tile closes Peek and preserves the selection and counters. How-to and voice explain the view.

**Ran.** At base `18b1c19c` plus the feature diff, `npm run typecheck`, `npm run build`, `npm run format:check`, lint, `npm run game-docs`, and `npm test` passed (6,717 tests, five skipped). Against `GAME_URL=http://localhost:5195`, `BROWSER_SUITE=tilepairs TILE_LEVELS=5` passed (Peek, P, closing tap, pair, mismatch, hint and round finish). Reviewed the 390 × 844 emulated portrait screenshot. `BROWSER_SUITE=couchgames COUCH_ONLY=tile-pairs` passed (top button and P toggle, counters preserved). Reviewed the laptop how-to screenshot.

**Not run.** `fingerdemo` and offline checks. Demonstrated actions, assets, persistence and navigation were unchanged.

## 2026-11-11 — Pok Pok P3, tap the piece then the place: a definition (docs only, PR #1521)

**Changed:** new [definition](../definitions/tap-then-place.md) (opt-in `tapToPlace` for `draggable()`, eight requirements, rule tests, three slices); the P3 section of POK-POK; READY (the P3 line became P3a in Next ten; P3b and P3c queued under the Pok Pok review).
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built; the definition was written from the code at `origin/main` `d80b14e9`).

## 2026-11-11 — Phone playtest tools kept (scripts and docs, PR #1527)

**Changed:** the eleven zsh helpers that played TotoLogic over USB, now in `scripts/android-playtest/` with their working folder and speech model set by `PLAYTEST_DIR` and `WHISPER_MODEL`; a [session guide section](../SESSION-GUIDE.md#playing-an-app-on-the-developers-android-phone) with setup, the tools and the rules that go with them; a routing line for reviews of other games.
**Ran:** `zsh -n` on each; `shot`, `ui`, `tap`, `swipe`, `trace` and `findcolor` against a stand-in `adb` and a saved screenshot; `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** the edited copies against the phone (it was unplugged; the originals ran all day on 2026-11-11), so `hear`, `look`, `act`, `both` and `vid` are syntax-checked only. No app code changed: no typecheck, unit tests, build or browser suites locally.

## 2026-11-11 — Pok Pok P3a, the tap-then-place engine path, Hat Band moved onto it

**Changed:** `src/engine/drag.ts` (opt-in `tapToPlace`, `onCancel`, `TAP_TRAVEL`, `heldPlace()`, `cancelHeld()`, handle `held`/`placing`/`tapped`/`cancel()`), `src/engine/input.ts` (`onTap` `place`), `GameScene` and `App` (a hold ends when a card, the pause sheet or a pad takes the round), Hat Band onto the engine path.
**Ran:** `npm run typecheck`; `npm test` (348 files, 6731 passed, 1 skipped; `src/engine/drag.test.ts` 17 tests: the definition's seven assertions plus the root/ground listener, the function-valued option and `onCancel`); `npm run build` (436 precache entries); `BROWSER_SUITE=hatband HAT_LEVELS=1,3` (level 1 landscape: Done on the empty stage cancels a hold and still reminds, drag onto a friend, tap-hold lifts at the rack place, a second tap or a tap on empty ground puts it down and it returns, tap hat then friend puts it on, gate, bow, one sticker; level 3 portrait: tap-place both, replace, a held hat swaps in on a tap on a worn hat, a tap on a worn hat takes it off, both stars, bow, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=hat-band` (levels 1 and 4 finished). Chrome automation only.
**Not run:** `couchgames` (Hat Band's pad path untouched), `world`, offline (no persistence, assets or navigation change), level 4 of the `hatband` suite (Build a song untouched).

## 2026-11-11 — Pok Pok P3b, Block Garden takes tap-then-place (PR #1528)

**Changed:** `src/games/block-garden/index.ts` (tray pieces set `tapToPlace` as a function; a still tap holds a piece in its slot at tray size, the next tap on the bed plants it from the tapped point; a hold that ends without a place goes home through `onCancel`; `lifted` flag so a tap-place skips `liftFor`), `scripts/browser/suites/block-garden-play.mjs` (a `GARDEN_LEVELS=tap` part).
**Ran:** `npm run typecheck`; `npx vitest run src/games/block-garden src/engine/drag` (2 files, 78 tests); `BROWSER_SUITE=blockgarden GARDEN_LEVELS=tap` (level 12 at 390×844: a tapped piece held in its slot at tray size, let go and switched for free, one wrong place = one miss and the piece back home, every piece planted by tap-then-tap, 1 miss 0 hints, one sticker, no page errors); portrait screenshot `block-garden-12-phone-held` viewed. Chrome automation only.
**Not run:** `npm run build` (no shared files or assets changed), the rest of the `blockgarden` suite, `fingerdemo` (bot and card unchanged), offline, couch.

## 2026-11-11 — Pok Pok P3c, Tangram Town levels 1–3 take tap-then-place (PR #1529)

**Changed:** `src/games/tangram-town/index.ts` (tray pieces at levels 1–3 set `tapToPlace` as a function; a still tap holds the piece at its tray home, the next tap on a shadow places it from the tapped point; the turn and help buttons end the hold; a placed piece is `eventMode 'none'`), `scripts/browser/suites/creative-batch.mjs` (a `TANGRAM_TAP=only|skip` part).
**Ran:** `npm run typecheck`; `npx vitest run src/games/tangram-town src/engine/drag.test.ts` (31 tests); `BROWSER_SUITE=creative CREATIVE_ONLY=tangram TANGRAM_TAP=only` (level 1 at 390×844 by taps: hold, let go, switch, help button, one wrong shadow = one miss, empty ground free, both pieces placed, [1 miss, 1 hint], one sticker; screenshot `tangram-town-1-phone-held`); `TANGRAM_TAP=skip TO_LEVEL=3` (the drag plays of levels 1–3). Chrome automation only.
**Not run:** the full unit suite locally (CI runs it), `npm run build` (no shared files or assets changed), `fingerdemo` (card and bot unchanged), couch, offline, levels 4–8 browser plays. The placed-piece `eventMode` change was not shown to fail without it.

## 2026-11-11 — Pyramid Solitaire deep dive (docs only, PR #1530)

**Changed:** research and design only: `docs/deep-dives/pyramid-solitaire.md`, the tracker and backlog rows, READY, GAME-BATCHES and IDEAS. No code changed.
**Measured:** the dive's figures came from a Node 26 script kept outside the repository that imports the game's `logic.ts` and `random.ts` unchanged (1,000 seeds a level; 200–500 for the candidate variants; 300 rounds a level for the dial bands).
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** typecheck, unit tests, build and every browser suite (docs-only tier).

## 2026-11-11 — U7d fix batch 3: puddle-lens, sea-lift and sink-float never hold a tap on a right answer's line (PR #1532)

**Changed:** `puddle-lens` (pressed names and right-answer lines, levels 3–8), `sea-lift` (the thanks, `sealift.aboard`) and `sink-float` (`sink.right`, `sink.surprise`, `sink.salt-right`) start the line and move on instead of awaiting it; each browser suite gained one R4 assertion (`lens` level 5: next drop within 1.5 s; `sealift` level 1: next ask within 3.3 s, was about 4.7 s; `fourth` sink level 3: next thing within 5.6 s, was about 7 s), and `fourth.mjs` gained a `SINK_LEVELS` filter.
**Ran (Chromium headless, speech off):** `npm run typecheck`; the three games' rule tests (5 files, 169 tests); `BROWSER_SUITE=sealift`; `BROWSER_SUITE=fourth FOURTH_ONLY=sink SINK_LEVELS=3`; `BROWSER_SUITE=lens` (levels 1, 4, 5, 6, 7, 8). All passed.
**Not run:** `fingerdemo` (no bot's timing code changed), build (no shared file changed; CI builds), the full unit suite locally (CI runs it), Sink or Float level 9 in a browser (no suite plays the salt level; one awaited line moved). Nothing was timed with real speech.
