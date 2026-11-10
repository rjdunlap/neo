# Verification 2026-11-02 (archived entries)

## 2026-11-02 — Attic Finds levels 7–8 two sources and what can we tell (H5)

- [PR #1116](https://github.com/rjdunlap/neo/pull/1116): `attic-finds` levels 7 *Two sources* and 8 *What can we tell?* (school {2..8, order [2,5,6,7,8]}); new `case.ts` and `cases.ts`.
- Ran (Vite dev on http://localhost:5430, base origin/main bc267ed7, `VITE_SPEECH=off`): typecheck; full `npm test` 294 files / 4294 tests; Attic Finds and content rule tests 224; `BROWSER_SUITE=atticcase` (free read, wrong level-7 Check one miss with both copies back, then right; level 8 Seaside "shows it" twice, glow and one hint, then right; one sticker each) before and after the review fixes; `fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=7,8` clean (23.0 s, 22.1 s, speech off, so real-speech timing at level 8 is longer and unmeasured); one portrait level-8 screenshot with stamps pressed.
- `game-reviewer` fixes: slotted-copy hit area under 100 units, the level-8 hint line for can't-tell rows, the unused shows-it/none-shows lines (now spoken), copies rebuilt mid-drag on resize. Left open (minor): a resize during a Check leaves papers at old positions until the animation ends.
- Not run: build (no shared assets changed; CI runs it), offline, device or child checks. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): papers' pictures without the pet, *Can't tell* understanding, the poster read, device speech.

## 2026-11-02 — Drift Cards level 3 (oceans slice 6, batch drift-cards 2)

- [PR #1119](https://github.com/rjdunlap/neo/pull/1119): level 3 *Find the hidden current* (fogged 2×2 patch, three patch cards, Check, replay); school now 1–3.
- Ran (Vite on http://localhost:5951, `VITE_SPEECH=off`, base origin/main bc267ed7 plus this branch): typecheck; 36 Drift Cards rule tests (12 new, re-run after the review fixes); full `npm test` 4291 passed (before the review fixes); `npm run build`; `BROWSER_SUITE=driftcards` (levels 1–2 unchanged; level 3 in portrait: B a miss, B again free, C second miss and glow, A and replay, saved 2/1); `fingerdemo` `FINGER_LEVELS=3` `drift-cards` (37.4 s); one portrait screenshot reviewed.
- S1 voice check: NOAA "What is a current?" (opened 2026-11-02) supports wind, density and tides but not seasons, so `drift.limits` was reworded. `game-reviewer` fixes: duplicate hand cards and unresized cards on the replay, a stale fog-cell trace, restart forgetting tried patches.
- Not run: offline check, other suites.
- Open ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#drift-cards-levels-13-oceans-slice-6-2026-10-31-level-3-built-2026-11-02)): detective work versus trial and error, reading arrows cell by cell, "South-west" in iPad speech.

## 2026-11-02 — Size Parade level 14 The measuring ribbon (size-parade batch 5, slice 10)

- [PR #1118](https://github.com/rjdunlap/neo/pull/1118): school-only level 14 (bank and stump friends, a vertical-only ribbon that snaps within 12 units to the top of a head, then tap the taller); school `order [7, 8, 12, 13, 14, 15]`; ten `size.ribbon*` voice lines; how-to card scoped 14-14.
- Ran (commit 95342fb7, base origin/main bc267ed7, Vite on http://localhost:5526): typecheck; full `npm test` 293 files / 4286 tests (38 Size Parade rule tests incl. 300-seed pair properties, snap, layout at 1024×768, 768×1024, 844×390); `npm run build`; `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=14` (guess, a short pull stays, an 8-unit-off drop snaps, two wrong taps = 2 misses/1 hint, one sticker, portrait screenshot; rerun after the review fix); `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=14 FINGER_BAND=school` clean in 32.7 s.
- `game-reviewer` fix: a resize during the ribbon's float home left it off its lane (low severity); the browser run was repeated after it.
- Not run: offline check, other suites, iPad, a child's reaction.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether she reads the mark against the head and trusts the ribbon over the eye.

## 2026-11-02 — Rule Machine levels 3–4 (algebra-balance AB1, batch rule-machine 2)

- [PR #1120](https://github.com/rjdunlap/neo/pull/1120): `rule-machine` school range 2–4: *What does it do?* (rule shelf) and *Covered machine* (trap cars, Peek).
- Ran (commit ae2baa61, Vite on http://localhost:5563): typecheck; 41 rule tests (enumerated over shelves and feeding orders, 300 seeds); full `npm test` on the first commit, then rule-machine plus content tests (209) after a layout tweak; `npm run build`; `BROWSER_SUITE=rulemachine RM_LEVELS=3,4` (landscape level 3 wrong card then right, 1/0; portrait level 4 with early and still-open card taps uncounted, trap car first, a ruled-out card, Peek, the settling car and last pad, 1 miss/1 hint; level 4 re-run after the review fix); `BROWSER_SUITE=fingerdemo FINGER_ONLY=rule-machine FINGER_LEVELS=3,4` (49.9 s, 18.0 s); screenshots of level 3 shelf and portrait level 4.
- `game-reviewer` fixes: the cover now returns when the card hangs after an unused Peek; the pet repeats level 2's ask after the card hangs.
- Not run: levels 1–2 browser play (unchanged paths), offline check, the CCSS/England wording source check.
- Open ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#rule-machine-levels-14-algebra-balance-ab1-2026-11-01-and-2026-11-02)): fairness of the covered machine and "two cards still fit", card pictures and Peek on an iPad, the wording check.

## 2026-11-02 — Orchard Rows levels 4–6 (number-structure NS1, batch orchard-rows 1)

- [PR #1121](https://github.com/rjdunlap/neo/pull/1121): `orchard-rows` school levels 4 *Equal rows*, 5 *Every way*, 6 *Only one long row*; new `baskets.ts`, model and bot in `logic.ts`.
- Ran (merge commit 482f0780 = origin/main + branch, Vite dev on http://localhost:5259, `VITE_SPEECH=off`): typecheck; `npm test` 294 files / 4311 tests (Orchard Rows rules 22, 17 new: deal, factors, 60 prime sets, 300-seed determinism, accounting, help reaches a right answer, 100-seed bot with no misses, layout at four views with cells of 18 or more); `BROWSER_SUITE=orchard ORCHARD_LEVELS=4,5,6` (L4 arrows free, Plant on a leftover twice = 2 misses and 1 hint with glow, glow followed to the sticker; L5 portrait, a shape planted twice free, one-long-row screenshot; L6 wrong basket 1 miss, repeat claim free); `fingerdemo FINGER_ONLY=orchard-rows FINGER_LEVELS=4,5,6` clean (10.9, 16.0, 8.5 s); `npm run build`.
- `game-reviewer` fixes: arrows live during a leftover reason, a tap mid-deal finishes it, range-end tick and wobble, one long-row line.
- Not run: levels 1–3 regression play (unchanged class), phone and landscape screenshots beyond the case's, offline. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): leftover use, every-way feel, *prime*, device speech of "rows of"; reduced-motion deal not built.

## 2026-11-02 — Paint Mixer levels 5–6 definition (ratio-proportion RP2)

- [PR #1117](https://github.com/rjdunlap/neo/pull/1117): docs only, [definition](../definitions/paint-mixer-5-6.md) for `paint-mixer` levels 5–6 and the paint shelf; routed through READY, batches, backlog, study and packet.
- Ran: a throwaway script reimplementing the built mix and Oklab distance measured the three-pot mixes and the jar-label distances; `node scripts/check-links.mjs`; `git diff --check`.
- No code checks (docs only); the numbers are the definition's, not a browser play.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): at the build, whether six shelf colours read as six on an iPad, whether one-more-of-each is seen, whether a child reads a label as two counts, whether the circled count in a reveal is understood without speech (listed in the definition, not yet added to DEVICE-CHECKS).

## 2026-11-02 — Thought Bubbles levels 1–3 (literature-meaning LM1)

- [PR #1122](https://github.com/rjdunlap/neo/pull/1122), branch `claude/thought-bubbles-1-3`: new game `thought-bubbles` in Story Grove (18 games), pre-K 1–2 and school 1–3; batch thought-bubbles 1. Title clip `game.thought-bubbles` rendered; other `thought.*` lines are device speech.
- Ran (HEAD of the branch, Vite dev on http://localhost:5741, `VITE_SPEECH=off`): typecheck; full units 4366 passed with 5 failures (four load timeouts in unchanged block-garden, fluffy-salon, keep-house, penguin-slide that passed alone, 110/110, and the voice-clip coverage test, fixed by rendering the title clip); voice clips, registry, lands, how-to and thought-bubbles tests 219/219 (25 rule tests); `npm run build` (precache 423 entries).
- `BROWSER_SUITE=thoughtbubbles` (`thought-bubbles-play.mjs`): pre-K level 1 two wrong cards, glow, apple (2/1); portrait school level 2 away story miss and replay, then start place, then a watching story (1/0); level 3 wrong reason, rain, free vase tap, clouds (1/0). `fingerdemo` `FINGER_ONLY=thought-bubbles FINGER_LEVELS=2,3` clean (34.7 s, 17.3 s). The play found the second-miss glow lighting only after the speech; fixed.
- Not run: offline check (no persistence or navigation change), other suites, any device or child check.
- Open ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#thought-bubbles-literature-meaning-study-2026-10-31-levels-13-built-2026-11-02)): the four person and device checks there.

## 2026-11-02 — Maker Lane levels 1–3 (food-fiber-systems FS1)

- [PR #1123](https://github.com/rjdunlap/neo/pull/1123): new game `maker-lane` (Cozy Village; toddler 1, preschool 1–2, pre-K 2–3, school 2–3); sheep and hen art moved to `src/art/animals.ts`. Tested commit `52a6bbd5` on base `3b1d19b2`, `GAME_URL` http://localhost:5952.
- Ran: `npm run typecheck`; full `npx vitest run` before the review fixes (all passed except the voice-clip and how-to wording tests, both then fixed), then maker-lane and `src/content` (194 tests, 26 new rule tests) after the fixes; River Tablets and Keep House unit tests (109) after the art move; `npm run build`.
- Browser: `BROWSER_SUITE=makerlane` (toddler level 1 free tap on a maker who is not waving, then the waving makers 0/0; portrait preschool level 2 two refused makers, bubbles, glow, then the right makers 2/1; pre-K level 3 sheep for the sock with replay, dimmed card and the scarf beside the sock, then the cotton plant 1/0), re-run after the review fixes; `fingerdemo` `FINGER_ONLY=maker-lane FINGER_LEVELS=2,3` (21.6 s and 17.6 s, before the review fixes, which did not change the bot).
- Not run: offline check (no persistence or navigation change); no iPad or device speech check; FS3 (the grown-ups' card) not built.
- Open ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#maker-lane-food-fiber-systems-study-2026-10-31-levels-13-built-2026-11-02)): whether a four-year-old picks the sheep for the sock and the replay changes her next pick, whether the thought bubble tells her which maker comes next, and the agricultural-literacy or textile review of the makers' pictures and lines.

## 2026-11-02 — Lemonade Stand level 5 Two lemon boats (lemonade-stand batch 1)

- [PR #1124](https://github.com/rjdunlap/neo/pull/1124): `lemonade-stand` school level 5 (boat pick, boat help and insight, co-play hint).
- Ran (origin/main 05a1736f + branch, final tested commit 14f87c8e, Vite dev on http://localhost:5818): typecheck; `npm test` 296 files / 4404 tests (Lemonade Stand rules 28); `BROWSER_SUITE=woods WOODS_ONLY=lemon FROM_LEVEL=5` (portrait, two wrong boats = 2 misses, lightbulb then stays at 2 misses and 1 hint, day-2 lightbulb = 2 hints, saved score 2/2, card costs, jetty screenshot; re-run after the review fixes); `fingerdemo FINGER_ONLY=lemonade-stand FINGER_LEVELS=5` clean 36.7 s (before the review fixes, which touched only speech wording and an instruction guard); `npm run build`.
- `game-reviewer`: two small findings fixed.
- Not run: other woods levels, offline. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): "for 2 lemons" as cheaper per cup, four boat mornings in a row.

## 2026-11-02 — Pixel Pictures fresh pictures and colour logic (pixel-pictures batch 1)

- [PR #1125](https://github.com/rjdunlap/neo/pull/1125): level 2 pool 3 to 6, level 6 pool 2 to 5 behind `colorLineSolvable`, level-6 hint and ghost finger by colour logic.
- Ran (code commit 09dd70db, Vite dev on http://localhost:5957, stopped): typecheck; `npx vitest run src/games/pixel-pictures` 8 tests; picture-logic 27 tests; `BROWSER_SUITE=woods WOODS_ONLY=pixels FROM_LEVEL=6`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures` level 1 clean 31.5 s, level 6 clean 61.6 s (was 59.1 s).
- `game-reviewer`: no blocking findings.
- Not run: build (no shared files), full unit suite, level 2 browser play (interaction unchanged). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): older child on the logic levels.

---

## 2026-11-02 — Garden Rows seeded flower sets and level 7 Mend the bed (garden-rows batch 1)

- [PR #1126](https://github.com/rjdunlap/neo/pull/1126): seeded flower sets per bed; level 7 Mend the bed (school 3–7); new `gardenrows` suite.
- Ran (origin/main 023bf491 + branch, Vite dev on http://localhost:5997, `VITE_SPEECH=off`): typecheck; Garden Rows rules 16 passed (300-seed mend assertions, 50-seed every-kind coverage, hint and bot convergence); src/couch + registry + garden-rows 109; src/content 184; scripts tests 51; `BROWSER_SUITE=gardenrows` (level 7 portrait: free lift, two repeat replants = 2 misses, glow, both beds mended, 2 misses/1 hint; level 3 non-default flower sets); `BROWSER_SUITE=fingerdemo FINGER_ONLY=garden-rows FINGER_LEVELS=7` 18.8 s; portrait screenshot reviewed.
- `game-reviewer`: no bugs; its note (silent full-but-unsolved bed) was fixed with the `rows.mend` line afterwards (rule tests rerun, browser not rerun).
- Not run: full unit suite (CI), build (no shared assets), couch suites (couch unchanged). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): school-age child on Mend the bed; flower sets on the iPad.

---

## 2026-11-02 — Ferry Jam fair hints and fuller harbors (ferry-jam batch 1)

- [PR #1127](https://github.com/rjdunlap/neo/pull/1127): progress-based hint (`stuck`, per-harbor distance table), 26 more frozen harbors, co-play hint; no new level, bot unchanged.
- Ran: typecheck; Ferry Jam rule tests 22 passed (incl. course tests); a one-off real-drag Playwright probe at school level 6 (`test-results/ferry-probe.mjs`, Vite on port 5800, origin/main 7b86fe18 + branch): wandering back and forth earned exactly one hint at slide = patience (13 on one harbor, 17 on another) with the glow, then finished to a sticker with 1 hint; a longer route (22 slides on a 14-fewest harbor, 27 on a 17) earned no hint and finished to a sticker.
- `game-reviewer`: its undo, keyboard and performance findings were fixed.
- Not run: `fingerdemo` (bot unchanged), build (no shared files), full unit suite (CI), device or child checks.

---

## 2026-11-02 — Habitat Helpers equivalent pieces and pooled gardens (habitat-helpers batch 1)

- [PR #1128](https://github.com/rjdunlap/neo/pull/1128) (code `cefeceee`): four new single-role pieces, seeded per-role picks at levels 1–3, level 4 drawn from four pooled prediction gardens; no new level, no voice or how-to change, bot unchanged.
- Ran: typecheck; `npx vitest run src/games/habitat-helpers` 15 passed (200-seed level-3 one-working-set test, every two-piece garden enumerated); `BROWSER_SUITE=habitat` against Vite on port 5874 passed at `cefeceee` (levels 1, 3, 4, 6 incl. portrait; level 3 relaunched until a new piece showed, one incomplete test and glow, screenshot `habitat-helpers-3-portrait`; level 4 no repeat); `npm run build` passed; art probe screenshot of the four new pieces.
- Not run: `fingerdemo` (bot unchanged), full unit suite locally (CI runs it), device or child checks.

---

## 2026-11-02 — Inchworm fresh things, the long jump and level 8 The broken ruler (inchworm batch 1)

- [PR #1129](https://github.com/rjdunlap/neo/pull/1129) (code `07dbf233`): five new things, a sand-pit long-jump round at level 3, and school level 8 *The broken ruler*; how-to card updated, bot unchanged.
- Ran (Vite dev on http://localhost:5949, `VITE_SPEECH=off`): typecheck; `npx vitest run src/games/inchworm src/content src/games/registry` 20 files / 211 tests passed; `BROWSER_SUITE=woods WOODS_ONLY=worm FROM_LEVEL=8 TO_LEVEL=8` passed (end mark then marks-counted, 2 misses, 1 hint, glow; portrait screenshot of the broken ruler); `WOODS_ONLY=worm FROM_LEVEL=3 TO_LEVEL=3` passed (one jump round, screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=inchworm FINGER_LEVELS=8` clean in 5.1 s; `npm run build`; `game-reviewer` found no defects.
- Not run: full unit suite locally (CI runs it), device or child checks. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a school child reads the spaces rather than the end mark; whether the sand pit reads as two jumps.

---

## 2026-11-02 — Island Bridges a small sea to start and named hints (island-bridges batch 1)

- [PR #1130](https://github.com/rjdunlap/neo/pull/1130) (code `2c9791b3`): level 5 (5 by 5, 4–6 islands, counting finishes it, an island with one neighbour; order `[5, 1, 2, 3, 4]`) and forced hints that name why (`full`, `last-way`, `every-way`); how-to card unchanged.
- Ran (Vite dev on http://localhost:5728): typecheck; island-bridges rule tests 27 passed (level 5 over 300 seeds; named hints over 300 seeds with independent arithmetic, each reason occurring, a hand-built case per reason); registry/content/couch unit tests 288 passed; `BROWSER_SUITE=bridgestouch BRIDGES_ONLY=5` passed (entry at 5, hint line matched its reason, 64-unit targets both ways, portrait screenshot, one sticker, 0 misses, 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=island-bridges FINGER_LEVELS=5` clean in 6.7 s. The play ran one commit before the last, which only reordered a filter ahead of the solve (same puzzles).
- Not run: full `bridgestouch` (levels 1 and 4 unchanged), couch suites (couch unaffected), `npm run build`, full unit suite locally (CI runs it), device or child checks.

---

## 2026-11-02 — Lantern Lights a 6 by 6 pond (lantern-lights batch 1)

- [PR #1131](https://github.com/rjdunlap/neo/pull/1131) (code `5e20da96`): levels 7-8 (6 by 6 ponds, par exactly 7 and 12, one winning set) and the portrait counts line above the pond when the side room is under 240 units; how-to step for level 7 and up.
- Ran (Vite dev on http://localhost:5393): typecheck; `src/games/lantern-lights` 19 tests (including 200 seeds at levels 7-8 for exactly one winning set and the par); `src/content` and `src/games/registry` 190 tests; `BROWSER_SUITE=lanterntouch LANTERN_ONLY=8` (level 8, one hint, counts above the pond upright and beside it sideways, one sticker, 0 misses/1 hint); `FINGER_ONLY=lantern-lights FINGER_LEVELS=8` ghost finger clean in 38.3 s; the portrait screenshot `test-results/browser/lanterntouch/lantern-lights-8-portrait.png` reviewed.
- Not run: `npm run build` (no shared files or assets), couch suites (course and trips unchanged), full `npm test` (CI runs it), iPad or device check of whether the 6 by 6 pond is fun.

## 2026-11-02 — Light Lab fair starts, nearest hints and a sun on either side (light-lab batch 1)

- [PR #1132](https://github.com/rjdunlap/neo/pull/1132) (code `6f8cfb1b`): start floors (`startWrong`, `startDark`), hints from the nearest answer, and the sun on either side at levels 3-7; no new levels.
- Ran (Vite dev on http://localhost:5949): typecheck; Light Lab rule tests, 10 passed (floors over 400 seeds a level, hints taking exactly the fewest turns from the start and mid-play, a spare-mirror shortcut, mirror invariance, sides by level); `input-in-use` and couch unit tests, 78 passed; a one-off probe at level 6 in portrait with a right-hand sun (sun in the last column, two missed shines giving 2 misses, 1 hint and a glowing mirror, hints taking exactly `needed` turns, one sticker saved as [2,1]; screenshot `test-results/browser/ll-right-sun/light-lab-6-right-sun-hint.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=light-lab FINGER_LEVELS=6` clean in 18.7 s; `BROWSER_SUITE=woods WOODS_ONLY=light FROM_LEVEL=6` passed levels 6-7; game-reviewer found no defects.
- Not run: full unit suite (CI), build (no shared files or assets), `couchgames` (the couch course is batch 2), device checks.

## 2026-11-02 — Lasso Loops, teens, decades and a fresh meadow (lasso-loops batch 2)

- [PR #1134](https://github.com/rjdunlap/neo/pull/1134): level 1 seeds 6–9 fireflies (six jars kept), level 3 draws 1–3 jars with an occasional no-ones round, level 4 mixes a teen, a decade and 21–39 (level 6 unchanged), swapped pad only when both digits are there; three new voice lines.
- Ran (Vite dev on http://localhost:5959, branch head): typecheck; Lasso Loops rule tests, 10 passed; `src/content` and registry tests, 190 passed (how-to 19 after a wording fix); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=lasso FROM_LEVEL=4 TO_LEVEL=4` (relaunches until a decade; wrong loops, ringed hint, one wrong total, no leaf, portrait question screenshot reviewed: three jars of ten, pads 40/30/31); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lasso-loops FINGER_LEVELS=4 LASSO_DECADE=1` (seed 12, clean 15.0 s). `game-reviewer` found only the how-to wording, fixed.
- Not run: full unit suite (CI), build (no shared assets), other suites, device checks.

## 2026-11-02 — Peekaround Island truthful support and real choices (peekaround-island batch 1)

- [PR #1136](https://github.com/rjdunlap/neo/pull/1136): level 4 has three shore friends and three requests, each leaving a wrong spot, with all three words; level 5 pairs are always behind + next to (the turn always names someone; "in front of" is only said); the level-2 hint rings the arrows while the friend is hidden and the friend once in view; level-scoped how-to; `lap` dropped from `LEVELS`.
- Ran (commit d5a0be8f, base d53e56df, Vite on http://localhost:5690): typecheck; Peekaround rule tests, 6 passed (the two new placement tests fail with the old request rule restored); `src/content` and registry tests, 190 passed; `BROWSER_SUITE=woods WOODS_ONLY=peek FROM_LEVEL=2` levels 2-5 passed (ring on arrows while hidden, on the friend once in view); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaround-island FINGER_LEVELS=4,5` clean (8.7 s, 15.7 s); one landscape screenshot of level 5.
- Not run: build (CI), portrait screenshot, offline, device or child checks.

## 2026-11-02 — Paint Mixer levels 5–6 and the paint shelf (batch paint-mixer 3)

- [PR #1135](https://github.com/rjdunlap/neo/pull/1135): `paint-mixer` levels 5 (three pots) and 6 (which jars match) and six journal paint-shelf entries; sample generalised to n pots, new `shelf.ts` and `jars.ts`; base `origin/main` d53e56df, server http://localhost:5197 (`VITE_SPEECH=off`).
- Ran: typecheck; `npm test` 4,480 pass (a first run had four timing-sensitive tests in other games fail under load, a rerun passed); 88 Paint Mixer rule tests (levels 1-4 seed-identical); build; `BROWSER_SUITE=paintmixer PAINT_LEVELS=5,6` twice (second after review fixes: level 5 extra drop, Undo, rows, portrait, both recipes on the shelf; level 6 empty Check free, wrong jar twice, lid reveal, portrait with lid open, right set); `fingerdemo` `FINGER_ONLY=paint-mixer FINGER_LEVELS=5,6` (32.6 s, 12.5 s).
- Not run: levels 1-4 browser play (covered by the seed-identical test), offline check.
- Open ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#paint-mixer-levels-56)): shelf colours as six, one-more-of-each, labels as two counts, the circled count without speech, lid zone versus jar.

## 2026-11-02 — Penguin Slide fair ponds and seeded looks (penguin-slide batch 1)

- [PR #1137](https://github.com/rjdunlap/neo/pull/1137): no dead-end ponds at levels 1–4, at most one single-slide pond in a level-1 round, seeded rock looks and fish colours, a touch-down scuff ring, reworded how-to note.
- Ran: typecheck; `src/games/penguin-slide` and `src/content` tests, 193 passed (dead-end detector, 300 seeds at levels 1–4, level-1 single-slide cap with singles still occurring, looks coverage); `BROWSER_SUITE=woods WOODS_ONLY=penguin` levels 1–9 passed at 9fcdf608 (Vite on http://localhost:5641); one portrait probe at level 4 eyeballed the igloo and snowman.
- Not run: the scuff-colour-only commit was not re-played; `fingerdemo` (bot unchanged), build and full units (CI), offline.
- Open: whether the igloo reads as a stopper and whether the scuff shows on an iPad (device).
