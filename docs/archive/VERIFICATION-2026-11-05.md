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

## 2026-11-05 — Sink or Float level 9 Big and small (sink-float batch 2)

- [PR #1261](https://github.com/rjdunlap/neo/pull/1261) (base `a68c4fb3` plus the branch; Vite `http://localhost:5789`, `VITE_SPEECH=off`): `SINK_PLANS` keyed by level ID, `order` bands (pre-K 4, 5, 9, 6; school 5, 6, 9, 7), level 9 with three seeded size pairs, twig and pebble art, how-to `from: 9` steps. `game-reviewer` found no defects; its cosmetic note (the last pair's fade) was fixed.
- Ran: typecheck; full `npm test` (305 files, 5,093 tests) including the keyed-plan, order, pair and seeded-pair rule tests; a scripted school play of level 9 in 768×1024 portrait (one surprise guess on the first pair, then right guesses; 0/0, no discoveries, no page errors) with portrait screenshots; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sink-float FINGER_LEVELS=9` PASS at pre-K (19.8 s); `npm run build`.
- Not run: `couchgames` (outside the tier), an iPad or a child ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Sudoku Garden level 8 A crossing pair of rows (sudoku-garden batch 3)

- [PR #1263](https://github.com/rjdunlap/neo/pull/1263) (branch `claude/sudoku-garden-crossing-rows`): grown-up top level 8, the `xwing` technique (tier 4) on 12 authored, solver-checked `WING_BEDS` shown a new way per round; hint rings the four corners and lights the two lines; voice line `sudoku.hint-xwing`; how-to step.
- Ran: typecheck; full `npm test` 305 files, 5097 tests (before a last hint-rule tweak; afterwards the sudoku-garden and content tests, 215, and typecheck); `npm run build`; `BROWSER_SUITE=sudokutouch SUDOKU_ONLY=8` (X-Wing hint on hint 35, one sticker; an earlier run failed when a bed never named the X-Wing, hence the three-bed retry); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sudoku-garden FINGER_LEVELS=8` pass in 34.2 s; portrait screenshot `test-results/browser/sudokutouch/sudoku-touch-8-xwing-portrait.png`.
- Not run: `couchgames` (couch untouched), offline check, an iPad or a person.
- Open: whether the X-Wing hint is clear to a grown-up (person check, [DEVICE-CHECKS](../DEVICE-CHECKS.md)); on about 30% of beds the hint path never names the X-Wing.

## 2026-11-05 — Sing-Along Barn level 8 Which one finishes it? (sing-along-barn batch 3)

- [PR #1264](https://github.com/rjdunlap/neo/pull/1264) (base `a626368d` plus the branch; Vite `http://localhost:5598`): preschool and pre-K level 8, a seeded rhyming-picture pick at the pause (`RHYMES`, `RIMES`, `rhymeSides`), a miss and a second-miss glow, `finish()` now reports misses and hints. `game-reviewer` found no blocking issues; its two minor points were fixed.
- Ran: typecheck; full `npm test` (305 files, 5,105 tests); one-off probe `test-results/barn8.mjs` (not a suite): preschool with two wrong picks (misses 2, hints 1, glow, sky and in-hold taps not counted, sides as seeded, to the sticker) and pre-K clean (0/0), on Rain and on Ring (two-syllable "posies"); one portrait screenshot of the glow; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn FINGER_LEVELS=8` pass in 40.6 s; `npm run build`.
- Not run: the `singalong` suite (unchanged parts), Twinkle at level 8 in the browser (unit-tested), device speech of the rhyme lines, an iPad or a child ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Shape Buddies level 8 Your friend, my friend (shape-buddies batch 6)

- [PR #1265](https://github.com/rjdunlap/neo/pull/1265) (tested commit `1515fd49` on base `7a9e0c5f`; Vite `http://localhost:5787` with `VITE_SPEECH=off`): level 8 (pre-K and school), the seat question, turn rule and `sharedResult`, `twoArt()` moved to `src/art/seats.ts`; `game-reviewer` found a tap-jitter turn pass, a tilted wobble and a wrong fallback line, all fixed in `1515fd49`.
- Ran: typecheck; `npm test` 305 files / 5115 tests pass (on `9e212fb8`; after the fix the shape-buddies rule tests 46/46); `npm run build`; `BROWSER_SUITE=buddies BUDDIES_ONLY=8` pass (pre-K Two of us: seat question, dimmed-friend wobble with no miss, drops pass the turn, a failed Try hands the turn to friend 1, cup catches, `buddies.shared`, one sticker, saved level 8 misses 0 hints 1; portrait screenshot `test-results/browser/buddies/shape-buddies-8-seats-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=shape-buddies FINGER_LEVELS=8` pass (pre-K, 14.7 s); Secret Code regression `FINGER_ONLY=secret-code FINGER_LEVELS=12 FINGER_BAND=school` pass (60.5 s, through its seat question).
- Not run: Secret Code's full suite, an iPad, device speech or a child (whether two people take turns without a grown-up policing it, and whether pre-K hears "your partner" as the other person, are in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Sudoku Garden level 9 Patchwork beds (sudoku-garden batch 4)

- [PR #1266](https://github.com/rjdunlap/neo/pull/1266) (branch `claude/sudoku-garden-patchwork-beds`): grown-up level 9, a 6 by 6 bed of irregular six-square patches from eight authored `PATCH_LAYOUTS`, with outlined and tinted patches, patch-first only-place hints, voice lines `sudoku.go-patch` and `sudoku.go-patch-touch`, and a how-to step; order now `[7, 1, 2, 3, 9, 4, 5, 6, 8]`.
- Ran: typecheck; `npm test` 305 files, 5122 tests (sudoku-garden rule tests 49); one-off Playwright probe `test-results/sg9-probe.mjs` (portrait 768 by 1024, Vite on port 5956 with `VITE_SPEECH=off`): one wrong number (1 miss), hints until "In this patch, the 5 has only one square left", the bed finished, no page errors, one portrait screenshot; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sudoku-garden FINGER_LEVELS=9` pass in 32.8 s; `BROWSER_SUITE=couchgames COUCH_ONLY=sudoku-garden` pass.
- Not run: `npm run build` (no shared files or assets changed), the `sudokutouch` suite at level 9 (the probe played it), the other levels' regression plays, rendered voice clips for the two new lines (device speech fallback), an iPad.
- Open: whether patch borders and tints read on an iPad at 64-unit squares (person check, [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Sink or Float level 10 Salty or fresh, definition (docs only)

- [PR #1267](https://github.com/rjdunlap/neo/pull/1267): new [definition](../definitions/salty-or-fresh.md) for level 10 (school, salt mode, two tanks); READY, dive, batch plan and study backlog updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs only).
- Open: the build (batch sink-float 3) is queued; no play or device check yet.

## 2026-11-05 — Backlog audit: dives for games built from definitions

- **What changed (docs only):** the deep-dive tracker covered only the 85 games registered by mid-October. Of the 81 registered since, most have a subject study that plans their next slice; 21 have neither, so they gained tracker rows as waves 5–7 (lap/toddler first) and rows in the study backlog. READY gained five game dives, five study follow-up definitions and two builds that were ready but unlisted (Helper House level 4, Hat Band 1–3).
- **Ran:** `node scripts/check-links.mjs` (links ok) and `git diff --check`. No code checks (docs tier).
- **Follow-up, same day:** the developer asked for the recommendations to be made without waiting. Six defined new games were admitted on their October 23 defaults (Far Lights, Seed Travelers, Rain Garden, Playdate Workshop, Circuit Garden, Measuring Post). Next ten was filled to ten.
- **Open:** waves 6–7 dives queue only through the tracker; Weights Case still waits on Box Balance; each new game's source check and lands test run at build time.

## 2026-11-05 — Word Search level 6 A message in the leftovers (word-search batch 3)

- [PR #1269](https://github.com/rjdunlap/neo/pull/1269): level 6 (8 by 8, nine words, up to eight stones, the leftovers spell a themed message revealed at the last word); `makeGrid` output for levels 1-5 unchanged.
- Ran: `npm run typecheck`; `npm test` (305 files, 5126 tests pass, with new rule tests: plan shape, messages plain and block-free, every theme x 24 seeds leftovers equal the message with at most eight stones outside every word, a line through a stone is never a word); one scripted level 6 play (one wrong line, one hint, all words, reveal, sticker; misses 1, hints 1) at 768x1024 and 1024x768 with screenshots; `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-search FINGER_LEVELS=6` PASS (11.1 s); `npm run build`; game-reviewer (three minor layout findings, fixed).
- Not run: `couchgames` (levels 1-5 grids proved byte-identical over 60 seeds each, trip stays on 1-3); device speech of the slotted message line; a real iPad.
- Open: a person hearing the message line on the iPad.

## 2026-11-05 — Word Search level 7 Just the theme (word-search batch 4)

- [PR #1279](https://github.com/rjdunlap/neo/pull/1279): level 7 (10 by 10, six hidden words shown as a theme and length blanks, free non-word lines, a two-step hint); levels 1-6 behaviour unchanged after a reviewer-found repeat-line regression was fixed.
- Ran (base origin/main 83d96717 plus the branch): `npm run typecheck`; `npm test` (5247+ tests pass, with new rule tests: level 7 plan and themes, every everyday theme x 12 seeds hides each word once with no stray theme word, blanks, a free line never a miss, repeat rules, hint progression, voice lines never name the word); `npm run build`; a headless scripted play at 768x1024 (a free stray line with misses 0, two hints on one word, letter then ring, all six words to the sticker, no console errors) with a portrait screenshot of the blanks and a 1024x768 screenshot of an eight-letter blank; `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-search FINGER_LEVELS=7` PASS (13.1 s); game-reviewer (two findings, fixed and replayed).
- Not run: `couchgames` (`makeGrid`'s non-hidden path unchanged); a real iPad; device speech of the new lines.
- Open: a person hearing the level 7 lines and playing the blanks on the iPad.

## 2026-11-05 — Vine Snip levels 4–5 Which vine stays? and Two friends (vine-snip slice 2)

- [PR #1270](https://github.com/rjdunlap/neo/pull/1270): level 4 (one fruit, two or three vines, keep the one that feeds the friend) and level 5 (two fruits, two friends, wrong-side and straight misses, keep glow, Grow back regrows every fruit); bands pre-K 2–4, school 3–5; vine gap 100 units, not the definition's 140 (see its build decisions).
- Ran: `npm run typecheck`; `npm test` 305 files, 5131 tests pass (before the review fix; afterwards vine-snip and content tests, 196); `BROWSER_SUITE=vinesnip` (dev server port 5655, `VITE_SPEECH=off`, commit `348fd91e`): levels 1 and 3 regression, level 4 portrait screenshot with the keep glow, level 5 with a wrong-side keep miss, Grow back free, both lines fed, saved 1 miss 0 hints; `BROWSER_SUITE=fingerdemo FINGER_ONLY=vine-snip` at levels 2 (4.4 s), 4 (6.7 s) and 5 (11.0 s, rerun after the review fix).
- Not run: the `vinesnip` suite after the glow colour tweak and the two review fixes (glow kept for the other fruit at level 5; the straight-drop line), though `fingerdemo` 5 and unit tests were rerun; `npm run build` (CI runs it); an iPad.
- Open: a person checking that a four-to-five-year-old reads which vine stays, and two simultaneous fruits on an iPad ([definition](../definitions/vine-snip.md)).

## 2026-11-05 — Block Topple level 4 Hit it high (block-topple slice 2)

- [PR #1271](https://github.com/rjdunlap/neo/pull/1271): level 4 (three lines: short wide stack, tall thin tower, wide stack that tips only from a push at least 150 high) and the golden band after two thumps at every level; bands pre-K 1–4, school 2–4. Level 5 not built (needs redefinition, see the [definition](../definitions/block-topple.md#slice-2-as-built-2026-11-05-level-4-built-level-5-not-built)).
- Ran (commit `2ec5e77c`): `npm run typecheck`; `npm test` 305 files, all pass (after the how-to wording fix); `GAME_URL=http://localhost:5482 BROWSER_SUITE=blocktopple TOPPLE_LEVELS=4`: portrait level 4, two thumps 0 misses, golden band 1 hint, three tips shaped wide, tall, wide, saved 0/1, screenshot `block-topple-4-portrait-band`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-topple FINGER_LEVELS=4` passed in 5.7 s.
- Not run: `npm run build` (no shared assets changed beyond content files covered by unit tests); levels 1 and 3 replays (interaction unchanged); an iPad.
- Open: a person checking that "high up tips it" reads from the thumps and the golden band ([device checks](../DEVICE-CHECKS.md)).

## 2026-11-05 — Block Topple level 5 Count the basket (block-topple slice 3)

- [PR #1277](https://github.com/rjdunlap/neo/pull/1277): level 5 (red fruit on level 4's lines, a woven tray, three number pads with total±1; wrong count is one miss per line with the pet counting aloud, a second wrong tap glows the right pad); school range 2–5; the `blocktopple` case defaults to levels 1,3,4,5.
- Ran (first implementation commit on base `5d66c487`; a later commit only adds pad press feedback and rule tests): `npm run typecheck`; `npm test` 307 files, 5241 tests pass (43 rule tests); `GAME_URL=http://localhost:5274 BROWSER_SUITE=blocktopple TOPPLE_LEVELS=5`: portrait, two wrong counts on line 1 (1 miss, counted aloud), glowing pad (1 hint), three tips with right counts, saved 1/1, screenshot `block-topple-5-portrait-tray`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-topple FINGER_LEVELS=5` in 7.9 s.
- Not run: `npm run build` (no shared assets), landscape screenshot, levels 1–4 replay (unchanged), an iPad.
- Open: whether a six-year-old counts on or recounts, and whether the pads slow the shooting ([device checks](../DEVICE-CHECKS.md)).

## 2026-11-05 — Brain Break levels 4–6 Sums in order

- [PR #1272](https://github.com/rjdunlap/neo/pull/1272): grownup ladder 1–6; levels 4–5 show sums, level 6 sums and take-aways (at least ten each); a lit stone shows its total; voice `brain.sums.start/try/hint`; how-to card scoped by level. Base `origin/main` `09ad4ad6`.
- Ran: `npm run typecheck`; full `npm test` passed; `GAME_URL=http://localhost:5313 BROWSER_SUITE=brainbreak` (levels 1 and 6: two wrong taps then outline and hint, Hint, lit stone shows its total, every label at most 88 wide, portrait screenshot, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=brain-break FINGER_LEVELS=6` passed in 42.6 s.
- Not run: `npm run build` (no shared assets); device speech of the new lines; an iPad.
- Open: the spoken lines `brain.sums.*` are unheard on a device; no device check was added by this slice.

## 2026-11-05 — Far Lights levels 1–4 (astronomy slice 2)

- [PR #1273](https://github.com/rjdunlap/neo/pull/1273): new game `far-lights` (Tinker Lab, now 25 games; lap 1, toddler 1–2, preschool 2–3, pre-K 3–4, school 4); title clip rendered; land-count tests updated. Tested at commit `e48a245d`.
- Ran: `npm run typecheck`; full `npm test` (4 failures before the land-count fix: clip, how-to wording, two land counts, all fixed; affected files then 25 files, 254 tests pass; far-lights rule tests 33); `GAME_URL=http://localhost:5357 BROWSER_SUITE=farlights` (level 1 three taps 0/0; level 3 portrait wrong tap 1/0 with screenshot; level 4 too-bright Check, Show a hint twice counted once, Check, board two 1/1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=far-lights FINGER_LEVELS=1,2,4` (14.6 s, 11.3 s, 12.0 s); `npm run build`. Review fixes (hint glide leaving the game busy, lights draggable at the level-2 finish) re-passed `farlights` and `fingerdemo` 2,4.
- Not run: the offline check, couch suites, `world`; an iPad and device speech.
- Open: a lap child's tap-to-halo link, a toddler's one-finger drag, halo read as brighter not bigger, an astronomy reviewer ([device checks](../DEVICE-CHECKS.md#far-lights-levels-14-astronomy-slice-2-2026-11-05)).

## 2026-11-05 — Seed Travelers levels 1–3 (life-science slice 2)

- [PR #1275](https://github.com/rjdunlap/neo/pull/1275): new game `seed-travelers` (Rainbow Meadow, now 16 games; toddler 1–2, preschool 1–3, pre-K 2–3); title clip rendered; a help glow over the carrier that swallowed taps was fixed with `eventMode: 'none'`; `game-reviewer` found two guard gaps (finish line and close-up across a restart or resize), fixed.
- Ran (Vite on port 5732, `VITE_SPEECH=off`, at `dc3eb856` or its parent with only guard edits after): `npm run typecheck`; full `npm test` 5232 pass (two failures, the clip manifest and the toddler off-screen line, fixed afterwards; one Secret Code timing flake passed alone); rule tests 58; `npm run build`; `BROWSER_SUITE=seeds` (level 1 bellows, one Replay, basket 0/0; level 3 portrait: plume and critter stay, Show a hint twice counted once, both delivered 0/1, one screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=seed-travelers` (levels 1 and 3); `BROWSER_SUITE=smoke SMOKE_ONLY=seed-travelers` (levels 1–3).
- Not run: `world`, couch, the offline check; level 2 only in smoke and the rule tests; an iPad and device speech.
- Open: [device checks](../DEVICE-CHECKS.md#seed-travelers-levels-13-life-science-slice-2-2026-11-05).

## 2026-11-05 — Draw the Pattern deep dive (docs only)

Changed: the dive `docs/deep-dives/draw-the-pattern.md`, the tracker row, READY, WAITING-ON-DEVELOPER, STUDY-BACKLOG and the GAMES.md lap wording. Ran: `node scripts/check-links.mjs` and `git diff --check`. Nothing else run (no code touched). Open: nothing.

## 2026-11-05 — Draw the Pattern fresh pictures (slice 1)

- [PR #1286](https://github.com/rjdunlap/neo/pull/1286): seeded piece pools of three per stroke at levels 1–4 and 6, 20 new `draw.picture.*` lines, underneath pieces drawn first (a house no longer covers its window); strokes, rules and the bot unchanged.
- Ran (commit `8eea9fd7` on base `d13a21e5`; Vite on port 5431): `npm run typecheck`; `npm test` 308 files, 5312 pass, including three new rule tests (each pool three distinct pieces with a voice line; a 200-seed sweep reaches every piece with identical strokes at levels 2, 3, 4, 6; each piece only on its own stroke kind); a Playwright probe in portrait 768×1024 of level 3 (teeth and sea; one stray, one hint; misses 1, hints 1) and level 6 (ribbon, present, bow; one hint) to the finish; a 1024×768 gallery of every new piece reviewed by eye; `game-reviewer` overlap findings (road/candles, washing/rain, wheel/smoke) fixed.
- Not run: `fingerdemo` (bot unchanged), `npm run build`, any browser suite. Open: the device check for levels 1–8.

## 2026-11-05 — Puddle Lens levels 5–6 definition (docs only)

Changed: a levels 5–6 section in `docs/definitions/puddle-lens.md`, the cells-microbes dive row, READY and STUDY-BACKLOG. Ran: `node scripts/check-links.mjs` and `git diff --check`, both passed. No code checks. The biology model had a session source check only, with no separate biology reviewer (2026-10-23 decision). Open: whether a six-year-old waits for the evidence or guesses, and how the iPad says the button names (device speech).

## 2026-11-05 — Sense Detective levels 3–5 definition (docs only)

Changed: a levels 3–5 section in `docs/definitions/sense-detective.md` (with build slices B4a and B4b), the body-health dive rows, READY and STUDY-BACKLOG. Ran: `node scripts/check-links.mjs` and `git diff --check`, both clean. No code checks (docs tier). Open: nothing built or registered; the build checks are written in the definition's build slices.

## 2026-11-05 — Puzzle pages study (docs only)

Changed: a new subject study `docs/deep-dives/subjects/puzzle-pages.md` (newspaper and activity-book puzzles, four research passes), its tracker row, RECOMMENDATIONS packet, STUDY-BACKLOG and roadmap rows, an IDEAS section with five proposals, design-note links on READY's crossword and logic-grid definitions and a READY line for Mossy Path's maze opening (PP1). Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs tier). Open: nothing built; NYT, Puzzmo, the Guardian and The Times sites were blocked, so their claims are search summaries.

## 2026-11-05 — Puddle Lens levels 5–6 (cells-microbes slice 3b)

Changed: levels 5 *Alive or can't tell yet* and 6 *One cell or many* in `src/games/puddle-lens/` (logic, art, scene, rule tests), `lens.*` voice lines, how-to card and the `lens` browser suite; school range `{4,4}` to `{4,6}`.
- Ran (tested commit `22bee707` on base `98c2fbcd`, `GAME_URL=http://localhost:5595`): `npm run typecheck`; full `npm test` (308 files, 5294 tests on an earlier run; a later run had two timing failures in block-topple and fluffy-salon under load that passed on re-run); puddle-lens rule tests 87; `BROWSER_SUITE=lens` (level 5: two free early answers, one miss at stop 3, a counted hint to stop 4, saved 1/1; level 6: a free tray, a wrong tray, saved 1/0; portrait 768×1024 and landscape 1024×768 screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=puddle-lens FINGER_LEVELS=5,6` (14.4 s, 24.8 s); `npm run build`. `game-reviewer` findings fixed.
- Open: level-5 co-play and off-screen tip not built; offline and `world` not run; the [device checks](../DEVICE-CHECKS.md) (a six-year-old waiting for evidence, "can't tell yet" as a real answer, iPad button-name speech) stay open.

## 2026-11-05 — Sense Detective levels 3–4 (B4a)

Changed: levels 3 *Which could it be?* and 4 *Narrow it down* (`checkSet`, parcels, so-far step, per-parcel help), bands pre-K 1–3 and school 2–4, eight voice lines, how-to card.
- Ran (commit `b7605908`, dev server port 5727): `npm run typecheck`; sense-detective rule tests (41) plus registry and `src/content` tests (20 files, 245 pass before the last fix; sense-detective rerun 41 pass after); `BROWSER_SUITE=sensedetective` levels 1–4 (L3 portrait one-more, a miss, two parcels, 1/0; L4 so-far, listen, miss, requested hint, 1/1) pass after the fix; `fingerdemo FINGER_ONLY=sense-detective FINGER_LEVELS=3,4` clean (16.5 s, 13.1 s); one portrait screenshot `test-results/browser/sensedetective/sense-detective-3-two-selected-portrait.png`; `npm run build` passed before a game-only fix.
- Not run: offline check, `world`; no iPad or child (whether a five-year-old reads "every toy it could be" as several taps is open); no web source check (no new sense language).

## 2026-11-05 — Sink or Float level 10 Salty or fresh (sink-float batch 3)

Changed: school level 10 (`salt.ts` `SaltTanks`, `SALT_DEPTHS`/`floatsIn`/`saltRoundFor` in `logic.ts`, egg, shaker and waterline art, 15 `sink.salt-*` lines, how-to), PR #1285.
- Ran (commit `d25fbace`, dev server port 5687): `npm run typecheck`; `npm test` (308 files, 5309 pass before the review fix; sink-float 14/14 after); `BROWSER_SUITE=fourth FOURTH_ONLY=sink10` (part 1, a tank tap before the eggs settle ignored, two wrong tanks on the egg question = 2 misses/1 hint, a direct `control()` two-tank ring on the duck question, sticker, round saved [2, 1]; portrait 1024×1365 and landscape screenshots); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sink-float` level 1 (lap) 12.0 s and level 10 (school) 36.1 s, run before the small review fix, which does not touch the bot path; `npm run build`. A game-reviewer pass found two issues (stale hint after a right tap, mashing counting several misses), both fixed.
- Not run: `couchgames` (couch levels unchanged); a real island key press (`control()` called directly, as at level 7); no iPad or child.

## 2026-11-05 — Sudoku Garden level 10 Cage beds (sudoku-garden batch 5)

- [PR #1287](https://github.com/rjdunlap/neo/pull/1287): level 10 (6 by 6, every square in a dashed sum cage, 6 givens, 30 blanks, `cage-last` and `cage-sets`, cage hints, sum labels and moved marks, `isSolved` checks sums).
- Ran (commit `86b614b1`, dev server port 5715): `npm run typecheck`; `npx vitest run src/games/sudoku-garden src/content src/games/registry.test.ts` (267 pass, 13 new level-10 rule tests); `BROWSER_SUITE=sudokutouch SUDOKU_ONLY=10` PASS (new case: 92-unit squares, a wrong number, marks, a two-square cage filled off its sum red and spoken with no extra miss, Start over, a cage-last hint, portrait and landscape 64-unit targets, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sudoku-garden FINGER_LEVELS=10` PASS (30.9 s); `npm run build`.
- Not run: `couchgames` (geometry unchanged for non-cage beds); controller play of level 10; a real iPad.
- Open: whether sum labels and dashes read on an iPad at 92 units, and whether a grown-up new to cage puzzles finds the first cage without the card ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-05 — Word Search school opening, level 8 (word-search batch 5)

- [PR #1288](https://github.com/rjdunlap/neo/pull/1288): school band added; level 8 is a 6 by 6 grid with four picture words across (100-unit squares, picture tiles and buttons), a free tile tap, a ring from the second miss, new lines `wordsearch.go-school`, `miss-school` and `word`.
- Ran (tested at `b6a4356a`, Vite on port 5197, `VITE_SPEECH=off`): `npm run typecheck`; `npm test` (308 files, 5318 pass); `npm run build`; a one-off scripted school play at 1024×768 and 1024×1365 (squares 600×600 at cell 100, tiles and buttons 100 units, two wrong lines, ring after the second, a tile tap counting nothing, one Hint, all words, sticker; history misses 2, hints 1; no page errors; screenshots in ignored `test-results/`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=word-search FINGER_LEVELS=8 FINGER_BAND=school` PASS (11.4 s). The game-reviewer's one suggestion (fewer repeated ring lines) landed in `9dbe5497`, speech-only and not re-played.
- Not run: `couchgames` (couch untouched), device speech, a real iPad.
- Open: the three school-opening checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md); a second school level.

## 2026-11-05 — Helper House level 4 Chilly nook (RA3)

- [PR #1289](https://github.com/rjdunlap/neo/pull/1289): heater and thermometer, `[zone] → on` and `[zone] → off` rows, warmth 2–4 goal, school band 2–4, voice lines `hh.*.4`, how-to step, `HH_LEVELS` in the `helperhouse` case.
- Ran (commit `b401e617` plus `f9949ecc`'s one-token glow fix, covered by a new unit test; port 5332): `npm run typecheck`; `npm test` (308 files, 5338 tests); Helper House rule tests (36); `BROWSER_SUITE=helperhouse HH_LEVELS=4` PASS (cool dragged, hot tapped, two too-warm days, off-row glow with one hint, portrait screenshot, Show me to warm, finish 0 misses/2 hints); `BROWSER_SUITE=fingerdemo FINGER_ONLY=helper-house FINGER_LEVELS=4` (11.5 s); `npm run build`.
- Not run: the on-row (never-warms) glow in the browser (unit-tested only); the offline check; other suites; a real iPad.
- Open: thermometer, heater and friend moods on an iPad, and the science-educator read of the warmth wording ([DEVICE-CHECKS](../DEVICE-CHECKS.md#helper-house-level-4)).

## 2026-11-05 — Crossword definition (docs only)

Changed: a new `docs/definitions/crossword.md` (levels 1–6, Story Grove), READY (the definition line replaced by the levels 1–2 build), the puzzle-pages dive, STUDY-BACKLOG, roadmap, IDEAS and the recommendations packet (PR #1290). Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs tier). Open: nothing built; device speech of letter names and whether a four-year-old sees one letter serve two words stay for a person.

## 2026-11-05 — Logic grid definition (docs only)

Changed: a new `docs/definitions/logic-grid.md` (Mystery Grid, levels 1–8, Puzzle Peaks), READY (the definition line replaced by the levels 1–2 build), the puzzle-pages dive and IDEAS (PR #1291). Ran: `node scripts/check-links.mjs` and `git diff --check`, both passed. No code checks (docs tier). Open: nothing built; the levels 1–2 build is queued.

## 2026-11-05 — Phone held upright, shell slice 1 with batch 1 (chunk 31)

Changed: the 768 × 1024 upright design area, `Scene.uprightArea` and `GameModule.upright`, Today's six upright-first, `resultSpots`, both manifests `any`, and six upright-ready grown-up games (word-search, sudoku-garden, island-bridges, pond-conga, brain-break, number-nook) (PR #1293). Ran: typecheck; `npm test` (305 of 312 files first run, the 7 load timeouts passed alone, one real daily-test stub fixed); `npm run build`; `BROWSER_SUITE=phonefit` with the new upright root pass (dev server port 5366; Home, Today's six, island-bridges, result screenshots); a one-off probe of all six games at their top level at 390 × 844 (no off-screen targets or errors); `npm run test:offline` on a preview of the current build (root and classic passed); `game-reviewer` (no blockers, the iPad-portrait finding fixed).
Open: `fingerdemo` not run (the bots tap game objects, not positions); no real phone (the [upright device check](../DEVICE-CHECKS.md) is open; feedback picks batch 2); `world` not run.
