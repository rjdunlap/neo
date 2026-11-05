# Verification 2026-11-05 (archived entries)

## 2026-11-05 — Treasure Map level 7 How far? (treasure-map batch 3)

- [PR #1245](https://github.com/rjdunlap/neo/pull/1245) (tested commit 29fec660 `claude/treasure-map-how-far`; Vite `http://localhost:5794`, `VITE_SPEECH=off`): school level 7, a hidden chest on a 4 by 4 map found from footprint-stack distances; ruled-out digs are misses with a reason; 5 new voice lines, level-scoped how-to step.
- Ran: typecheck; full `npm test` 304 files, 5,021 tests pass (before the review fix; after it vitest on `src/games/treasure-map` and `src/content`, 193 pass); `BROWSER_SUITE=woods WOODS_ONLY=map FROM_LEVEL=7 TO_LEVEL=7` pass (two fitting digs, a ruled-out miss, its free re-tap, a free re-dig, second miss and the glow, score [2,1], sticker; portrait screenshot `test-results/browser/woods/treasure-map-7-footprints-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=7` pass in 14.5 s; `npm run build`.
- Not run: levels 1–6 regression play, `couchgames` (couch unchanged), offline check, an iPad or a child ([device check](../DEVICE-CHECKS.md): whether footprint stacks read as distance).

## 2026-11-05 — Treasure Map level 8 Slide it (treasure-map batch 4)

- [PR #1250](https://github.com/rjdunlap/neo/pull/1250) (tested commits b08654a5, then 8a462140 `claude/treasure-map-slide-it`; Vite `http://localhost:5818`): school level 8, a three-square raft slides by a vector on a 5 by 5 map; she taps the flag's landing, then picks the slid outline among three cards; named reasons for misses.
- Ran: typecheck; full `npm test` 304 files, 5,046 tests pass (before the hint-glow fix; treasure-map rule tests rerun after); `BROWSER_SUITE=woods WOODS_ONLY=map FROM_LEVEL=8 TO_LEVEL=8` pass, rerun after the fix (wrong square, free map tap, turned-over card miss and hint, free re-tap, three rafts, score [2,1]; portrait screenshot `treasure-map-8-outline-cards-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=8` pass in 12.3 s.
- Not run: `npm run build` (no shared assets), levels 1-7 regression play, `couchgames` (couch unchanged), offline check, an iPad or a child ([device check](../DEVICE-CHECKS.md): whether the outline cards read as the same shape slid).

## 2026-11-05 — Secret Code level 9 Be the door (secret-code batch 3)

- [PR #1246](https://github.com/rjdunlap/neo/pull/1246) (tested commit `a25241c6` `claude/secret-code-be-the-door`; Vite `http://localhost:5249`): school level 9, she makes a code and marks the pet's tries with discs; eight new voice lines; level-scoped how-to steps; couch guarded off.
- Ran: typecheck; full `npm test` 304 files pass (after trimming the card under the 840-character limit); `npx vitest run src/games/secret-code` 15 tests (pet cracks all 64 codes within six tries); `BROWSER_SUITE=woods WOODS_ONLY=code FROM_LEVEL=9 TO_LEVEL=9` pass (part-made check waits, two wrong marks give misses 2 hints 1, glow, both codes, sticker, saved [2,1]; portrait screenshot `test-results/browser/woods/secret-code-9-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=secret-code FINGER_LEVELS=9` pass in 52.3 s; `npm run build`.
- Not run: other levels' plays (unchanged), couch, an iPad or a child ([device check](../DEVICE-CHECKS.md) not added). The pet's tally recap is not spoken and the bubble is three dots.

## 2026-11-05 — Read & Do levels 8–9 Mend the sign (read-do batch 4)

- [PR #1247](https://github.com/rjdunlap/neo/pull/1247) (tested commit `f37dbc80` on base `cb0a0bdb`; Vite `http://localhost:5230`): school levels 8 and 9, authored broken signs acted out, fixed by one insert or take-out (8) or a held swap (9); four new voice lines; `game-reviewer` found nothing.
- Ran: typecheck; full `npm test` 304 files, 5,033 tests pass (9 new read-do rule tests: printed outcomes, never already right, intended fixes, level 9 needs a swap, seeded rounds, first hint, six-step glow from every reachable sign, `resolveDrop`, layout at 7–9, voice); `BROWSER_SUITE=readdo READ_LEVELS=8,9` pass (level 8: two unchanged Sends give 2 misses, 1 hint, glow, sticker; level 9: real held swap in portrait with preview screenshot, sticker with 0/0); `BROWSER_SUITE=fingerdemo FINGER_ONLY=read-do FINGER_LEVELS=8,9` pass (32.1 s, 33.1 s); `npm run build`.
- Not run: an iPad or a child (three checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md)): swap versus insert comfort in portrait, whether the act-out reads as a funny mistake, device speech for `read.mend.*`.

## 2026-11-05 — Shape Buddies level 5 A cup on the ledge (shape-buddies batch 3)

- [PR #1248](https://github.com/rjdunlap/neo/pull/1248) (tested commit `4f76c6af` on base `8b2c6ee8`; Vite `http://localhost:5737/classic/`): pre-K and school level 5, a rocky crack whose ledge holds a cup, solved by a bridge plus a cup at the catch or by one cup on the ledge; three new voice lines; `game-reviewer` found no defects.
- Ran: typecheck; full `npm test` 304 files pass (27 shape-buddies rule tests, 5 new for level 5; how-to length test passes); one scripted play at school 768 by 1024 portrait: round 1 a plain friend in the gap fell, then a Cup in the gap caught and planted (misses 0, hints 0); round 2 a Flat at the gap alone failed, then a Cup at the catch caught and planted; sticker awarded, no page errors, portrait screenshot of the ledge reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=shape-buddies FINGER_LEVELS=5` pass (pre-K, 9.1 s); `npm run build` passed.
- Not run: an iPad, device speech or a child (add whether the ledge reads as "something under the cup" to the Shape Buddies person check in [DEVICE-CHECKS](../DEVICE-CHECKS.md)); the buddies suite at levels 1–4 unchanged.

## 2026-11-05 — Shape Buddies level 6 Which way round? (shape-buddies batch 4)

- [PR #1253](https://github.com/rjdunlap/neo/pull/1253) (tested commit `58cc7fb1` on base `c9fe0617`; Vite `http://localhost:5371/classic/`): school-only level 6, the stream mirrored with a Turn button; three new voice lines; `game-reviewer` found one cosmetic defect (the cup tipped away from the pot when mirrored), fixed afterwards with typecheck only.
- Ran: typecheck; full `npm test` 304 files / 5056 tests pass (32 shape-buddies rule tests, 5 new for level 6); `BROWSER_SUITE=buddies BUDDIES_ONLY=6` pass at school (unturned slope twice gave `buddies.turnSlope` twice, bridge glow, hint 1, Turn, catch, sticker, misses 0 hints 1; two portrait screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=shape-buddies FINGER_LEVELS=6` pass (school, 16.4 s); `npm run build` passed.
- Not run: an iPad, device speech or a child (whether a school child chooses Turn without prompting is in [DEVICE-CHECKS](../DEVICE-CHECKS.md)); the buddies suite at levels 1–5 unchanged; the review fix was checked by typecheck only.

## 2026-11-05 — Secret Code level 10 One slot (secret-code batch 4)

- [PR #1249](https://github.com/rjdunlap/neo/pull/1249) (branch `claude/secret-code-one-slot`, through the glow-clear fix; Vite `http://localhost:5547/classic/`): preschool level 10, one slot with a gray crossing a stone out of the tray; preschool `order` [10, 1]; four new voice lines; Secret Code on the preschool Puzzle Peaks page.
- Ran: typecheck; full `npm test` 304 files, 5041 tests (lands, registry and how-to tests; level-10 rules: every door opens within 3 tries, a gray crosses out exactly that stone, the preschool order and landing); `BROWSER_SUITE=fingerdemo FINGER_ONLY=secret-code FINGER_LEVELS=10 FINGER_BAND=preschool` pass in 21.7 s; one portrait play at preschool level 10 (768 by 1024; one wrong stone gave a gray cross and a dimmed stone; two taps on the crossed stone gave 2 misses and 1 hint with the glow and faint stone; three doors to the finish; no page errors); a 1024 by 768 screenshot of the preschool Puzzle Peaks page with Secret Code and the signpost on one page. A game-reviewer pass found the glow not cleared at the finale; fixed.
- Not run: build (no shared assets), couch suites (couch unchanged), an iPad or a child; the gray-cross check is in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-05 — Sudoku Garden Fill marks on big beds (sudoku-garden batch 2)

- [PR #1251](https://github.com/rjdunlap/neo/pull/1251) (branch `claude/sudoku-garden-fill-marks`; tested commit 0c1dd6ac plus the bloom follow-up; Vite `http://localhost:5275/classic/`): a free Fill marks button on 9 by 9 beds (levels 4–6) that pencils every candidate row by row and keeps her marks; new voice line and how-to step.
- Ran: typecheck; full `npm test` 304 files, 5051 tests (new rules: offered only on 9 by 9 plans, marks equal candidates, the answer is never ruled out, her marks kept, a placement leaves marks equal to candidates); one scripted play of level 4 at 1180 by 820 and 820 by 1180 (Fill marks made every empty square's marks equal its candidates, her own mark kept, a right placement cleared that digit from its peers; 0 misses, 0 hints, 1 entry; smallest target 64 landscape, 72 portrait) with one screenshot each. game-reviewer: no blocking findings; one nit fixed (a bloom stops the sweep).
- Not run: `fingerdemo` (bot unchanged), build (no shared assets; the voice clip is not rendered, so device speech speaks it), `couchgames` (couch unchanged), an iPad or a person.
- Open: whether Fill marks feels like help or like the game playing for her ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Treasure Map level 9 One line (treasure-map batch 5)

- [PR #1254](https://github.com/rjdunlap/neo/pull/1254) (tested commit 74127ba2 `claude/treasure-map-one-line`; Vite `http://localhost:5298`, `VITE_SPEECH=off`): level 9, the preschool opening (3 by 3 map, any square in the named row or column); Treasure Map is now on the preschool Rainbow Meadow page; 5 new voice lines, level-scoped how-to step.
- Ran: typecheck; full `npm test` 304 files, 5,060 tests pass (new rule tests: every square in the named line accepted and no other, alternation, no repeated line, fresh headers, band order windows, a carried 9 landing at school level 1); a one-off probe (`test-results/tm9-probe.mjs`, not in the harness) at preschool in 768 by 1024 portrait: find 1 one wrong then right, find 2 right, find 3 two wrongs (glow, one hint) then right, find 4 right, sticker saved with misses 3 hints 1, no page errors; screenshots `test-results/browser/tm9/level9-glow-portrait.png` and `rainbow-meadow-preschool.png`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=9 FINGER_BAND=preschool` pass in 6.8 s; `game-reviewer`: no defects.
- Not run: `npm run build` (no shared assets), voice clips for the new lines (device speech is the fallback), `couchgames` (couch unchanged), offline check, levels 1-8 regression play, an iPad or a child ([device check](../DEVICE-CHECKS.md): whether a four-year-old taps a line on purpose).

## 2026-11-05 — Treasure Map levels 10–11 Across the river and Mirror twin (treasure-map batch 6)

- [PR #1260](https://github.com/rjdunlap/neo/pull/1260) (tested commit 580a3da8 on base 3b0f49a7 `claude/treasure-map-across-river`; Vite `http://localhost:5565`): school levels 10 (a river and a road as axes, squares in words) and 11 (the mirror twin across either); eleven new `map.*` lines, how-to steps 10–11; the sign sits above the map by view height, not the definition's `v.w` rule.
- Ran: typecheck; full `npm test` 305 files, 5,090 tests pass (treasure-map 37 rule tests, 7 new); `npm run build`; a scripted school probe (`test-results/tm-river-probe.mjs`, not in the harness): level 10 with one wrong-side and one wrong-count dig (2 misses, 1 hint) then right to finished, level 11 with one same-side tap (1 miss) then right to finished, no page errors; screenshots of level 10 at 1024 by 768 (sign beside) and 1024 by 1365 (sign above); `BROWSER_SUITE=fingerdemo FINGER_ONLY=treasure-map FINGER_LEVELS=10,11 FINGER_BAND=school` passed.
- Not run: `couchgames` (couch unchanged), device speech of the new lines (no clips rendered), levels 1–9 regression play, offline check, a child ([device check](../DEVICE-CHECKS.md)).

## 2026-11-05 — Secret Code couch course The Code Doors (secret-code batch 6)

- [PR #1255](https://github.com/rjdunlap/neo/pull/1255) (tested commit `9c96fd2c`; Vite `http://localhost:5754/`): five frozen codes at levels 4, 4, 5, 5, 6, par 16 from `solverTries`; `CourseInfo.reference` makes the couch pages say par; one voice line; the couch suites' course lists gain codedoors. `game-reviewer` found no defects.
- Ran: typecheck; full `npm test`; `npm run build`; `BROWSER_SUITE=couchcodedoors` (shelf and course page say par 16, a counted and saved try, reload resume with the try kept, a bot run at exactly 16 under each door's own plan with one sticker and both badges); `BROWSER_SUITE=couchgames COUCH_ONLY=secret-code`.
- Not run: the full `couch` and `couchcourse` suites (only the course-list assertion changed), touch `fingerdemo` (touch play unchanged), an iPad, a controller in hand or a person.

## 2026-11-05 — Shape Buddies level 7 One friend, one job (shape-buddies batch 5)

- [PR #1256](https://github.com/rjdunlap/neo/pull/1256) (code commit `52b2f041` on base `6f5be0d1`; Vite `http://localhost:5416/classic/`): preschool level 7 (one friend, fixed plank, cup at the catch), pre-K `order [7, 1, 2, 3, 4, 5]` and `entryLevels [7]`, Shape Buddies on Tinker Lab's preschool page; `game-reviewer` found no defects.
- Ran: typecheck; full `npm test` 305 files / 5071 tests pass (4 new level-7 rule tests, one registry test); one-off scripted play at preschool 768 by 1024 portrait (`test-results/sb7-probe.mjs`, not in the `buddies` suite): friend 2, park 2 and bridge dock off stage, select of the second friend refused, Flat dragged to the catch failed with 0 misses, Help gave 1 hint, Cup caught, plant to sticker, no page errors, a portrait screenshot of the plank and caught seed, and the Tinker Lab preschool page 2 screenshot; `BROWSER_SUITE=fingerdemo FINGER_ONLY=shape-buddies FINGER_LEVELS=7 FINGER_BAND=preschool` pass in 9.7 s.
- Not run: `npm run build` (CI runs it), the `buddies` suite (no level 7 case; other interactions unchanged), an iPad, device speech or a child (whether a preschooler links "Cup" to "catch" is in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Secret Code level 12 Swap seats (secret-code batch 7)

- [PR #1258](https://github.com/rjdunlap/neo/pull/1258) (tested commit `f3aee772`; Vite `http://localhost:5579`): school level 12 with a Two of us / Just me seat question, `swapResult` and `quickCode`, school `order` [2, 3, 4, 9, 12, 5, 6, 7, 8, 11], seven new voice lines; level 9's tray now stays hidden while she marks. `game-reviewer` found no defects.
- Ran: typecheck; full `npm test` pass after the how-to card trim (28 secret-code tests: `swapResult` never smooth, 64 codes cracked by `nextMove` within six, `quickCode` leaves the rng untouched, school order); `BROWSER_SUITE=woods WOODS_ONLY=code FROM_LEVEL=12 TO_LEVEL=12` pass (Two of us in portrait: wrong mark a miss, seat 2 ignored clue no miss, swap, ignored clue a miss, 2 misses 1 hint, sticker; screenshots `secret-code-12-seats-portrait` and `secret-code-12-lid-portrait`); `FROM_LEVEL=9 TO_LEVEL=9` regression pass; `BROWSER_SUITE=fingerdemo FINGER_ONLY=secret-code FINGER_LEVELS=12` pass in 60.4 s of the 75 s limit; `npm run build`.
- Not run: couch (not offered at 12), the offline check, an iPad or a child (whether a six-year-old marks a grown-up's tries honestly is in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Sing-Along Barn level 7 Finish the line (sing-along-barn batch 2)

- [PR #1259](https://github.com/rjdunlap/neo/pull/1259) (Vite `http://localhost:5260`, `VITE_SPEECH=off`): toddler and preschool level 7 with a seeded `GAPS` pause before each friend's last note (Hot Cross Buns, Rain, Itsy Bitsy, Twinkle), a picture card, 0.8 s hold, `barn.finish`; `order` toddler [1,2,3,7], preschool [2,3,7]. `game-reviewer` found a race (a finished word's hide could collapse the next pause's picture), fixed with a pause counter.
- Ran: typecheck; full `npm test` after shortening the level-7 how-to card; 50 sing-along-barn rule tests (plans, order, gap table, gaps on each last syllable, none elsewhere, seeded tune); `BROWSER_SUITE=singalong SING_ONLY=finish` pass twice, the second after the fix (toddler portrait, Twinkle: three fast taps held at the pause, then sang through, one sticker, 0/0); one portrait screenshot reviewed (picture clear of the barn; beads sit under the transient grown-up tip, pre-existing); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn FINGER_LEVELS=7` pass in 37.2 s; `npm run build`.
- Not run: the other `singalong` parts (unchanged), couch (no couch form), an iPad or a child ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).
