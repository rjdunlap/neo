# Verification 2026-11-04 (archived entries)

## 2026-11-04 — Island Bridges school opening definition (docs only)

- [PR #1196](https://github.com/rjdunlap/neo/pull/1196): [definition](../definitions/island-bridges-school-opening.md) for `school` playing levels 5 then 1 at 100-unit cells; the batch `island-bridges 5`; the dive's slice 5 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new entry with a layout change) and the definition's person checks (a nine-to-twelve-year-old on the 5 by 5 sea, the named hint lines, cell and button fit on an iPad), added to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when built.

## 2026-11-04 — Lantern Lights school opening definition (docs only)

- [PR #1197](https://github.com/rjdunlap/neo/pull/1197): [definition](../definitions/lantern-lights-school-opening.md) for `school` playing levels 1 and 2 at 3 by 3; the batch `lantern-lights 4`; the dive's slice 4 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new band entry, no layout change) and the definition's person checks (a seven-year-old on level 1, the nudge timing, whether level 2 is a fair top), added to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when built.

## 2026-11-04 — Inchworm level 10 Longer than the ruler (inchworm batch 3)

- [PR #1198](https://github.com/rjdunlap/neo/pull/1198), head `6de1c56e`: level 10 (mode `slide`, school only), the `worm` how-to step, five voice lines, the bot drag-drag-tap.
- Ran (Vite dev http://localhost:5983, `VITE_SPEECH=off`): typecheck; full `npm test` 300 files, 4,766 tests; `BROWSER_SUITE=woods WOODS_ONLY=worm FROM_LEVEL=10 TO_LEVEL=10` in portrait 768x1024 PASS (stray drop no lay and no miss, lay at 0 with chalk, lay at the mark, second-part pad one miss, other wrong pad two misses and a hint with both parts and the mark lit, answers, sticker; screenshots inchworm-10-chalk and inchworm-10-hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=inchworm FINGER_LEVELS=10` clean 6.2 s. The first browser run caught a page error after the last round (`placeSlider` read a missing measure), fixed with a guard before commit. `game-reviewer`: no findings.
- Not run: build (no shared files or assets), landscape, offline, iPad or child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md) level 10 entry.

## 2026-11-04 — Island Bridges school opening (island-bridges batch 5)

- [PR #1199](https://github.com/rjdunlap/neo/pull/1199), commit `65a05e91` on base `9e58c20c`: `school` joins Island Bridges (order `[5, 1]`), 100-unit cells and buttons at school through `touchLayout`, `bridges.trouble`, `bridges.done-school`; the existing `bridgestouch` level 5 and 1 cases now pin the grown-up band.
- Ran: typecheck; `npm test` 300 files, 4,770 tests; `BROWSER_SUITE=bridgestouch BRIDGES_ONLY=school` (dev `http://localhost:5368`) PASS: level 5 with a stray plank turning an island red (`bridges.trouble` once), a hint, the school finale and a sticker; level 1 to the sticker; logged 1024x768 level 5 cell 100, sea 201,134,500, buttons 108x100 at x 723, level 1 cell 100, sea 152,34,700, buttons at x 874; portrait 1024x1365 cell 100, sea 152,332,700 (screenshots bridges-school-5-red, bridges-school-1-portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=island-bridges FINGER_LEVELS=1 FINGER_BAND=school` PASS 9.5 s; `npm run build`.
- Not run: the unchanged grown-up `bridgestouch` cases (only their band was pinned), offline check, iPad or child. Open: three person checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Lantern Lights school opening (lantern-lights batch 4)

- [PR #1200](https://github.com/rjdunlap/neo/pull/1200), commit `c4a2f913` on base `86464430`: `school` joins Lantern Lights (levels 1–2), `lantern.go-school`, `lantern.stuck-school` via `stuckAt`, how-to and co-play text without "four".
- Ran: typecheck; `npm test` 300 files, 4,774 tests; `BROWSER_SUITE=lanterntouch LANTERN_ONLY=school` (dev `http://localhost:5961`) PASS: school level 1 at 1024x768 (cell 116, pond 348, buttons 164x107, portrait also at least 100), the nudge once at 8 presses and not at 7, 0 misses, one hint, portrait screenshot `lantern-lights-school-1-portrait`, a sticker; level 2 par 4 to the sticker. `BROWSER_SUITE=fingerdemo FINGER_ONLY=lantern-lights FINGER_LEVELS=2 FINGER_BAND=school` PASS (20.3 s); `npm run build` passed.
- Not run: the unchanged grown-up `lanterntouch` cases, couchgames (couch unchanged), offline check, iPad or child. Open: three person checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Picture Graph level 11 What the graph can say (picture-graph batch 5)

- [PR #1201](https://github.com/rjdunlap/neo/pull/1201) (tested commit `b885cc52`): new school level 11 (`claim` mode: a finished graph, a claim and yes, no and can't-say stamps), voice `graph.claim.*`, how-to steps from 11; can't-say claims are first, hungriest and sleepiest, not the dive's biggest and fastest.
- Ran (dev server `http://localhost:5332/classic/`, `VITE_SPEECH=off`): typecheck; `npm test` 300 files, 4,780 tests (picture-graph rule tests 43); one scripted 768x1024 school play of level 11 (two wrong stamps on a can't-say claim: misses 1 then 2, the named bar lit, hint 1 with the can't-say stamp glowing; then every claim to the sticker, no page errors) with a portrait screenshot; `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-graph FINGER_LEVELS=11` pass (9.5 s); `npm run build` pass.
- Review: `game-reviewer` found no problems.
- Not run: landscape screenshot (layout unit-tested at 1024x768, 1366x1024, 1600x768, 768x1024, 1024x1365), device or child check. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md) (whether a six-year-old understands "the graph can't say").

## 2026-11-04 — Island Bridges couch course Joined Seas (island-bridges batch 4)

- [PR #1202](https://github.com/rjdunlap/neo/pull/1202), commit `96fc4dd6`: a second Island Bridges course (`joined`, five frozen level-6 seas, par 84, created at level 6) beside Island Hopping, voice `couch.course.joined`; the eight `couch-*.mjs` suites' course lists gained `joined`, and `couch-bridges.mjs` asserts the Joined Seas card.
- Ran (dev `http://localhost:5840`): typecheck; `npx vitest run src/games/island-bridges src/couch` 10 files, 114 tests; `BROWSER_SUITE=couchgames COUCH_ONLY=island-bridges` PASS (intro, controller lighting, bot round, save); one probe (Puzzle shelf, Joined Seas, Play): card "par 84", HUD "Sea 1 of 5 · 0 planks so far · this sea's fewest 12 · course minimum 84", the hint walk on sea 1 gave six forced hints then a `joined` one, no page errors.
- Not run: the full `couchbridges` suite (its new card assertion and updated list), the other `couch-*` suites whose course-list assertions changed, a full bot run of Joined Seas to its badges, `npm run build`, a real controller or TV.

## 2026-11-04 — Pixel Pictures level 9 Two colours, small (pixel-pictures batch 3)

- [PR #1203](https://github.com/rjdunlap/neo/pull/1203): level 9, a 4×4 two-colour copy (four pictures, three a round), `order` preschool [1, 9, 2] and pre-K [1, 9, 2, 3], `entryLevels: [9]`; the two-colour glow now also selects the square's colour on levels 2 and 9.
- Ran (dev `http://localhost:5607`): typecheck; `npm test` 300 files, 4,785 tests; `BROWSER_SUITE=woods WOODS_ONLY=pixels FROM_LEVEL=9 TO_LEVEL=9` (portrait 768×1024, two misses, glow with colour, three pictures, score [2, 1], sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures FINGER_LEVELS=9` clean at preschool, 40.2 s.
- Not run: `npm run build` (no shared or asset changes), a person or device check that a 3–4-year-old finds the colour pick natural.

## 2026-11-04 — Ferry Jam levels 9 and 10 Pre-K entry and who's in the way (ferry-jam batch 4)

- [PR #1204](https://github.com/rjdunlap/neo/pull/1204) (branch `claude/ferry-jam-prek-in-the-way`): pre-K level 9 (one boat in the way) and level 10 (the pet asks which boat blocks; wrong tap is a miss, two glow the blocker); pre-K order `[9, 1, 10, 2, 3, 4]`, `entryLevels: [9, 10]`.
- Ran (base 40e48664 plus this branch; Vite `http://localhost:5298`, `VITE_SPEECH=off`): typecheck; `npm test` 300 files, 4,789 tests; one scripted 768x1024 play: level 9 bot to sticker (saved [9,0,0]); level 10 a drag of a wrong boat = miss 1 with no slide, a wrong tap = miss 2 + hint 1 + glow, blocker tap answers, bot finishes both harbors (saved [10,2,1]), question screenshot reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=ferry-jam FINGER_LEVELS=9,10` pass (11.6 s, 18.8 s).
- Review: `game-reviewer` one low finding (praise set as the repeated instruction), fixed afterwards with typecheck and ferry/content tests re-run; the browser play was not re-run for that one-line voice change.
- Not run: `npm run build` (no shared or asset change), couch suites (couch levels unchanged), any iPad or child check. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Read & Do levels 8–9 Mend the sign definition (docs only)

- [PR #1206](https://github.com/rjdunlap/neo/pull/1206): [definition](../definitions/read-do-mend-the-sign.md) for levels 8–9 *Mend the sign* (KE1), the batch `read-do 4`, the dive's slice 4 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build, and the person and device checks the definition lists.

## 2026-11-04 — Lantern Lights named hints and Show me a short way (lantern-lights batch 2)

- [PR #1207](https://github.com/rjdunlap/neo/pull/1207), commit `f6c33e21` on base `e25c1921`: `namedHint` (`lantern.hint-one` / `lantern.hint-many`), the after-pond Show me a short way and Next pond buttons on touch, `lantern.after`, how-to hint step and finish line.
- Ran: typecheck; full `npm test` (passed after a how-to card length fix); `GAME_URL=http://localhost:5288 BROWSER_SUITE=lanterntouch LANTERN_ONLY=3` PASS (hint was `lantern.hint-one`, pond lit, replay 4 presses = par counting nothing, portrait screenshot mid-replay, Next pond, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lantern-lights FINGER_LEVELS=3` PASS in 17.1 s; `game-reviewer` fixes applied afterwards (spoken cue, All done label, flip only changed lanterns).
- Not run: full `lanterntouch` (levels 8, 1, 6, school), live key/pad switch while waiting, couch suites (couch path unchanged), build (no shared assets), offline, iPad or child. Open: the replay-button and named-hint person check in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Light Lab Split the sunbeam definition (docs only)

- [Definition](../definitions/light-lab-split.md) for level 12 (school only, after batch light-lab 5), [PR #1208](https://github.com/rjdunlap/neo/pull/1208).
- Ran: a throwaway generator probe (400 seeds at 7×5: all accepted within the 500-attempt budget, mean 3.5 attempts, at most 7 tiltables, start floor held; not committed); links and `git diff --check`.
- Not run: code checks (no code changed).

## 2026-11-04 — Penguin Slide level 13 Two penguins (dive slice 5)

- Built [PR #1209](https://github.com/rjdunlap/neo/pull/1209) at 68cac695 on base 01d6ff45: school top level 13, a second penguin the player chooses by tap (controller action button), each stopping the other.
- Ran (`GAME_URL` http://localhost:5680): typecheck; `npm test` 300 files, 4794 tests (new level-13 rule test: generation, best 4-7, pal placement, both needed, solver's first step solves in best, every route switches penguin, `movePair` never passes the other); `BROWSER_SUITE=woods WOODS_ONLY=penguin FROM_LEVEL=13 TO_LEVEL=13` pass (wasted slides, arrow as one hint, tap-to-choose with no move counted, both ponds, score [0,1], portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=13` clean 20.9 s; `BROWSER_SUITE=couchgames COUCH_ONLY=penguin-slide` pass (course boards only, no pal); a one-off probe of the controller path at 13 (action chooses, direction slides, undo restores) passed; `game-reviewer` no findings.
- Not run: build (no shared assets), offline, device play; the `slide.pals` line mentions only tapping, not the action button. Couch course for 13 not built.

## 2026-11-04 — Quick Tricks third show definition (docs only)

- [Definition](../definitions/quick-tricks-third-show.md) for level 9 (music box crank, fill the cups, loop the fireflies; batch quick-tricks 4), [PR #1210](https://github.com/rjdunlap/neo/pull/1210).
- Ran: links and `git diff --check`.
- Not run: code checks (no code changed).

## 2026-11-04 — Word Search school opening definition (docs only)

- [Definition](../definitions/word-search-school-opening.md) for school level 8 (four picture words across on a 6 by 6 grid; batch word-search 5), [PR #1211](https://github.com/rjdunlap/neo/pull/1211).
- Ran: links and `git diff --check`.
- Not run: code checks (no code changed).

## 2026-11-04 — Pixel Pictures level 10 My own picture (pixel-pictures batch 4)

- [PR #1212](https://github.com/rjdunlap/neo/pull/1212): level 10, a free blank 5×5 with four paints, tap paints or empties, Done after four squares, no misses or hints; kept creation is the existing pixel shape; `order` pre-K [1, 9, 2, 3, 10], school [3, 4, 5, 6, 7, 8, 10].
- Ran (tested commit a2ecd4f2 on origin/main b1e3fb8f; local Vite, random port): typecheck; `npm test` 300 files, 4,796 tests (pixel-pictures 14, incl. fewer than four squares cannot finish, tap empties, kept creation equals the board, order/step, bot draws the heart from empty and from strays); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures FINGER_LEVELS=10` PASS at pre-K, 19.7 s; one Playwright probe at 768×1024 and 390×844 portrait (Done hidden at three squares, tap empties, Done at four, no misses, keep, kept size 5 equals the board, one sticker; screenshots reviewed, paints and Done clear of the pet and corner buttons).
- Not run: `creations` (shape unchanged), `npm run build` (no shared or asset changes), a person or device check that a pre-K child finds Done and empty-on-tap natural ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-04 — Vine Snip levels 1–3 (vine-snip slice 1)

- [PR #1213](https://github.com/rjdunlap/neo/pull/1213): new game `vine-snip` (Tinker Lab; lap 1, toddler 1–2, preschool 1–3, pre-K 2–3, school 3); closed-form vines in `logic.ts`, scene, one voice clip, how-to card, new `vinesnip` suite; Tinker Lab tests updated (23 games, school pages 8, 7, 7).
- Ran (tested commit c8b64f67; Vite on port 5810): typecheck; `npm test` 301 files, 4,814 tests (18 new rule tests, level 3 window at least 0.433 s over 500 seeds); `BROWSER_SUITE=vinesnip` (level 1 three taps 0/0; level 3 portrait: far-turnaround miss, requested hint, three timed snips, saved 1/1; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=vine-snip` at level 3 (2.9 s) and levels 1,2 (2.1 s, 4.4 s); `npm run build`. `game-reviewer`: no blocking findings.
- Not run: person or device checks (a toddler connecting the tap to the drop, whether 0.4 s windows suit a four-year-old, iPad feel), in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Block Topple levels 1–3 (new game, slice 1)

- [PR #1214](https://github.com/rjdunlap/neo/pull/1214): new game `block-topple` in Tinker Lab (preschool 1–2, pre-K 1–3, school 2–3): a sling pull, a toy flight, one tipping rule, thumps that are never misses, a dotted-arc hint after two misses; rules in `logic.ts` with rule tests; how-to card with ghost finger.
- Ran: typecheck; `npm test` (all pass after fixing a how-to wording and rendering the title clip with `scripts/voice-clips/render.mjs`); `npm run build`.
- Ran (`GAME_URL` http://localhost:5617, passed on c8278fb1): `BROWSER_SUITE=blocktopple`: level 1 three solver pulls (0/0); level 3 in portrait a short shot and a hill shot (2 misses), the dotted path, three tips, saved 2/1; one portrait screenshot reviewed.
- Ran: `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-topple FINGER_LEVELS=3` passed (5.8 s) on 35f2db9a; the later commit only changed `down()` to kill the spring-back tween.
- Open: levels 4–5 are not built; whether a four-year-old can aim by angle from the trail and full-stretch pull comfort on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-04 — Light Lab levels 8–9 Place a mirror and Two to place (light-lab batch 3)

- [PR #1215](https://github.com/rjdunlap/neo/pull/1215): school levels 8 (6×4, one fixed wrong mirror, one tray mirror, 3 puzzles) and 9 (7×4, two tray mirrors, a rock on the sun's row, 2 puzzles); tray drag, placed-mirror turns, sun tap with a mirror in the tray as a spoken reminder (no miss), cell hint; school range 2–9; four voice lines, how-to steps, ghost-finger drag.
- Ran (tested commit f69db1d8; Vite `http://localhost:5737`): typecheck; light-lab rule tests (15, five new: every board needs every tray mirror, first hint is an answer cell, hints from the start and from random drops reach an answer, nearest-answer steps, mirrored boards); full `npm test` 301 files, 4,819 tests; `npm run build`; one-off 768x1024 portrait probe at level 8 (drop off the board returned to the tray, sun with the tray full no miss, wrong cell then two missed shines gave 2 misses, 1 hint and a glowing cell, played to the finish) and level 9 to its finish with no page errors, screenshots of the glowing cell and the tray; `BROWSER_SUITE=fingerdemo FINGER_ONLY=light-lab FINGER_LEVELS=8,9` PASS (19.4 s, 18.3 s). `game-reviewer`: no defects.
- Not run: landscape screenshot (tray bottom computed at about 683 of 768), iPad or device, a child playing, couch play (unchanged, levels 4–6).

## 2026-11-04 — Habitat Helpers levels 8–9 The rocky shore (habitat-helpers batch 3)

- [PR #1216](https://github.com/rjdunlap/neo/pull/1216): school levels 8 (high rock or rock pool, two rounds) and 9 (three places, a crab, an anemone and barnacles) in a separate `shore.ts` scene; school range 4–9; the wave button as a free test, a sand glow when the hint sends a friend back, misses always 0; `habitat.shore*` voice lines (device speech), how-to steps, `shoreTouch`/`shoreHint` bot.
- Ran (tested commit 7db85f4e's tree; Vite `http://localhost:5498`): typecheck; full `npm test` 302 files, 4,853 tests (hand-listed accepted sets for 8 and 9, the hint reaches an accepted shore from every reachable start, the bot finishes every seed); `npm run build`; one-off probe `test-results/hh-shore-probe.mjs`: level 8 with the anemone on the high rock first (two free tests, glow with 1 hint, fix, round 2, sticker) and level 9 at 768x1024 portrait (crab on the high rock a free test, round 2 barnacle fills the pool, anemone boing, barnacle back to the sand, sticker; 0 page errors); `BROWSER_SUITE=fingerdemo FINGER_ONLY=habitat-helpers FINGER_LEVELS=8,9` PASS (23.4 s, 30.4 s); one portrait screenshot with the tray.
- Not run: the follow-up sand-glow commit 3b85ffc4 beyond the unit tests, a landscape screenshot, iPad or device, a child playing.

## 2026-11-04 — Lantern Lights lily-pad ponds, level 9 (lantern-lights batch 3)

- [PR #1217](https://github.com/rjdunlap/neo/pull/1217), base `04576c7c`: level 9 with a lily-pad mask through the rules, four authored shapes, pad art with a free tap, `lantern.pads`, how-to step, `LANTERN_ONLY=9` case.
- Ran (branch head): typecheck; full `npm test` 302 files pass; rule tests with a brute force on every shape and the free-dimension cap; `GAME_URL=http://localhost:5869 BROWSER_SUITE=lanterntouch LANTERN_ONLY=9` PASS (rerun after the pad-tap fix; portrait screenshot `test-results/browser/lanterntouch/lantern-lights-9-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lantern-lights FINGER_LEVELS=9` PASS (22.8 s); `BROWSER_SUITE=couchgames COUCH_ONLY=lantern-lights` PASS.
- Not run: build (no shared assets), the other `lanterntouch` cases, offline, iPad or a child playing; pad art and the tap feel are unchecked on a device.

## 2026-11-04 — Light Lab couch course Sunbeam Run (light-lab batch 2)

- [PR #1218](https://github.com/rjdunlap/neo/pull/1218), commit `d80a8246` on base `92e3bfae`: a Light Lab puzzle-shelf course (`sunbeams`, five frozen boards, par [2, 2, 3, 4, 4] from the solver, minimum 15, played at level 6); new suite `couchsunbeams`; the other couch suites' course lists gained `sunbeams`.
- Ran (Vite dev `http://localhost:5797/classic/`): typecheck; `npm test` 303 files pass (a first run had four failing files under load from a parallel session, the rerun passed all 303 and the couch, light-lab and content subset passed alone); `BROWSER_SUITE=couchsunbeams` PASS (shelf par 15, course page, a counted turn and turn-back, two missed shines with the glow and run helped, reload resume with tries kept, a perfect bot run of 15 with one sticker and both badges); `BROWSER_SUITE=couchgames COUCH_ONLY=light-lab` PASS.
- Not run: the other couch course suites (only their list assertion changed), `npm run build` (no shared assets), offline, a TV or real controller.
- Open: no "Start this board again" or "Watch the best routes" in Sunbeam Run (possible follow-ups).

## 2026-11-04 — Peekaround Island level 5 Who will be in front? (peekaround-island batch 2)

- Built [PR #1219](https://github.com/rjdunlap/neo/pull/1219) at c6fc384f: a free picture-card guess of who will be in front before level 5's half turn (no miss, hint or glow), `frontAfterHalfTurn`, a bot branch, and the picture card spaced by count (fixes level 3's four-picture overlap on narrow screens).
- Ran (`GAME_URL` http://localhost:5193, `VITE_SPEECH=off`): typecheck; `npx vitest run src/games/peekaround-island src/content` 180 passed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaround-island FINGER_LEVELS=5` pass (18.2 s, pre-K); `BROWSER_SUITE=woods WOODS_ONLY=peek FROM_LEVEL=3` levels 3, 4, 5 pass (level 5 in portrait: one wrong guess leaves counts unchanged, then a right one, tiles do not overlap, both cards screenshotted); `game-reviewer` no blockers.
- Not run: build (no shared files or assets), other suites, device speech of `around.predict` and `around.cameround` (no clips, device speech fallback). Open: the pet's repeatable instruction stays "who will be in front?" after the guess until the next pair.

## 2026-11-04 — Picture Logic level 5 a small 5 by 5 and level 7 a harder 15 by 15 (picture-logic batch 2)

- Built [PR #1220](https://github.com/rjdunlap/neo/pull/1220) at 63101707 (base f17c16cc): level 5 (Pixel Pictures' seven line-solvable 5 by 5 pictures, 96-unit squares, whole, no Slide) played first and level 7 (a new `HARD_15` bank of five pictures needing 7 to 10 passes against the easier 15 by 15's most of 5); order `[5, 1, 2, 3, 4, 7]`, `entryLevels: [5]`, range 1–7; the how-to slide step covers level 7; couch trip and courses unchanged.
- Ran (`GAME_URL` http://localhost:5922): typecheck; full `npm test` 303 files, 4865 tests pass; `BROWSER_SUITE=picturetouch PICTURE_LEVELS=5,7` pass (size, whole or sliding, 64-unit targets, one hint, to the sticker with one hint; level 5 portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-logic FINGER_LEVELS=5,7` pass (level 5 in 7.8 s, level 7 in 53.6 s of 75 s).
- Not run: build (no shared files or assets), couch suites (unchanged), a real iPad. Open: the crab and the rabbit are drawn a little off-centre.

## 2026-11-04 — Light Lab level 10 Where's the mirror? (light-lab batch 4)

- [PR #1221](https://github.com/rjdunlap/neo/pull/1221): school level 10, a `find` mode on a 6×4 board (three boards): a cloud hides the one mirror on the sun's row, she taps its cell; a wrong cell is a miss with a pale blue ghost beam, the second miss glows the sun's row and the flower's column; school range 2–10; couch and autoplay move a ring, the ghost finger taps the crossing; three voice lines, how-to steps.
- Ran (tested commit `c9960ad5`, base `38dfa8c8`; Vite `http://localhost:5447`, `/classic/`): typecheck; light-lab rule tests (24, four new: board shape over 400 seeds, exactly one consistent cloud cell with hint lines crossing at it, every wrong cell's ghost beam leaves without waking the flower, mirror spots vary); full `npm test`; `npm run build`; one-off 768×1024 portrait probe (wrong cloud on the sun's row with its ghost beam, a second wrong cloud giving misses 2 / hints 1 with the lines crossing at the mirror, three boards to the sticker, score [2, 1]) with three screenshots reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=light-lab FINGER_LEVELS=10` clean 9.8 s. `game-reviewer`: three minor findings fixed, probe re-run clean.
- Not run: `woods` (covers levels 1–7 only), `couchgames` (couch levels unchanged), landscape screenshot, iPad or device speech.

## 2026-11-04 — Peekaround Island level 6 Who can't see it? (peekaround-island batch 3)

- [PR #1222](https://github.com/rjdunlap/neo/pull/1222) at c32b55c6: new `see` mode (pre-K 3–6, school 4–6): a picture on the island, she taps the friend across the tree; a tapped friend turns to the front (`turnToFront`); three scenes (picture at right, behind, left); the picture is never at the front (the friend across would be behind the crown, untappable).
- Ran (`GAME_URL` http://localhost:5790): typecheck; full `npm test` 303 files, 4871 tests pass; a one-off Playwright probe at level 6, pre-K, portrait 768×1024 (first scene picture behind; a wrong friend turns, miss 1; the same friend again, miss 2, hint 1, glow ring on the friend across; then three right taps, finished with 2 misses and 1 hint, no page errors; screenshot `test-results/peek6-glow.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaround-island FINGER_LEVELS=6` PASS (10.2 s); `game-reviewer` no defects.
- Not run: build (no shared assets), the `woods` peek case at level 6 (not extended), device speech of the new lines (no clips, device speech fallback), iPad.

## 2026-11-04 — Pond Conga level 7 Choose the order (pond-conga batch 2)

- [PR #1223](https://github.com/rjdunlap/neo/pull/1223): level 7 (13 by 9, 6 pads, nine bites in three groups of three, eaten in any order, par over orders); new voice lines `conga.order`, `conga.order-touch`; how-to card with a level-7 step; grown-up range 1 to 7; not on the couch trip.
- Ran (Vite dev server http://localhost:5945): typecheck clean; full `npm test` (303 files) passed after one how-to wording fix, then howto and pond-conga tests 58 passed; pond-conga rules 39 tests, including a brute-force par check over all orders on 12 seeds, that order matters, a hint to a best-order bite and whole-group demo ponds. `BROWSER_SUITE=fingerdemo FINGER_ONLY=pond-conga FINGER_LEVELS=7` passed (16.3 s). `BROWSER_SUITE=congatouch CONGA_LEVELS=7` passed (three bites shown, a longer first order with 0 misses, one hint to a best-order bite, 12 steps over the fewest, one sticker, portrait screenshot `conga-touch-7-portrait`, targets at least 64).
- Not run: build (no assets or shared files beyond voice and how-to), congatouch levels 1 and 6 (unchanged), couch suites (couch paths unchanged), iPad or a person (still open in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-04 — Picture Logic level 6 Two colours (picture-logic batch 3)

- [PR #1224](https://github.com/rjdunlap/neo/pull/1224): level 6 (five 10 by 10 pictures in blue plus one warm colour, each solved by `colorLineSolvable`); two colour pots, coloured clues, a wrong-colour fill that is not a miss and a hint naming it; order `[5, 1, 2, 3, 6, 4, 7]`; new `picture.go-colours*`, `picture.hint-*-colour` voice lines; how-to level-6 step. Couch trip (levels 1–3) and courses (3–4) never reach 6.
- Ran (`GAME_URL` http://localhost:5625): typecheck; full `npm test` 303 files pass (picture-logic 41 tests, with a two-colour describe: bank, deductions, hints from empty to par, wrong-colour fix, brushes, line status, reasons, touch frame at 64 units in four views); `BROWSER_SUITE=picturetouch PICTURE_LEVELS=6` pass (two pots, wrong-colour fill 0 misses, hint ringing it and switching pot, portrait 768x1024 targets and screenshot, to the sticker, history [6,0,1]); `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-logic FINGER_LEVELS=6` pass (46.3 s); `npm run build`.
- Not run: couch suites (couch unchanged), a real iPad. Open: whether blue and yellow/orange clue numbers read apart on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); colour hint lines do not say how to reach the second colour by keys.

## 2026-11-04 — Light Lab level 11 Through, bounce or stop? (light-lab batch 5)

- [PR #1225](https://github.com/rjdunlap/neo/pull/1225): level 11 for pre-K and school, three free guesses of a clear, cloudy, blocking or shiny thing then two judged choices (wake, shade, bounce); orders pre-K [1,2,3,4,11], school [2,3,4,11,5..10]; `light.materials` and `light.mat.*` voice lines, how-to steps, a torch sentence in the off-screen suggestion.
- Ran (tested commit `d9d76893`; Vite `http://localhost:5449`, `VITE_SPEECH=off`): typecheck; `npm test` with 30 light-lab tests passing (the new level-11 rule tests included); the full run timed out in five tests of unrelated games (block-garden, fluffy-salon, keep-house, penguin-slide) under machine load, and all 118 of those tests passed when re-run alone; `BROWSER_SUITE=woods WOODS_ONLY=materials` PASS (school portrait, a mismatched guess with no miss, the dim beam and shadow wash screenshot `light-lab-11-portrait`, two wrong picks giving [2, 1] with the glow, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=light-lab FINGER_LEVELS=11` PASS (pre-K, 20.1 s). `game-reviewer`: one audio-timing finding fixed.
- Not run: `npm run build` (no shared files or assets changed), couch suites (couch unchanged), landscape screenshot, iPad, device speech. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Pond Conga level 8 Step by step (pond-conga batch 3)

- [PR #1226](https://github.com/rjdunlap/neo/pull/1226): level 8 (11 by 7, 2 pads, 5 bites, no pace; one step per swipe stroke, touch, D-pad press or button, 0.18 s glide; entry level, order `[8,1,…,7]`); voice `conga.steps`, `conga.steps-touch`; how-to steps rescoped; not on the couch trip.
- Ran (tested commit `82d57588`, base `f02afe94`; Vite `http://localhost:5902`): typecheck; full `npm test` 303 files, 4,898 tests pass; `BROWSER_SUITE=congatouch CONGA_LEVELS=8` pass (still for 2 s and after a bump, touch and swipe steps, one bump, a sticker, portrait screenshot, a live pad press is one step); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pond-conga FINGER_LEVELS=8` pass (30.0 s); `BROWSER_SUITE=couchgames COUCH_ONLY=pond-conga` pass. `game-reviewer`: no defects.
- Not run: `npm run build` (CI runs it), congatouch levels 1, 6 and 7 (unchanged), an iPad or a person (the stepped feel is added to the Pond Conga [device check](../DEVICE-CHECKS.md)).

## 2026-11-04 — Peekaround Island level 7 What does the duck see? (peekaround-island batch 4)

- [PR #1227](https://github.com/rjdunlap/neo/pull/1227) at 58742a8e: new `view` mode (pre-K 3–7, school 4–7): three friends right, behind and left of the tree, one named; three picture cards (270×220, live mini scenes in Containers) show each friend's side; a wrong card turns the island to that friend (miss), the glow rings the right card after two misses. The island sits lower at this level (y = max(0.6h, 586)).
- Ran (base origin/main bb34f9b0, `GAME_URL` http://localhost:5789): typecheck; full `npm test` 303 files, 4902 tests pass; a one-off Playwright probe at school level 7, portrait (two wrong cards with turns, glow and hint on the second, three right cards, finished with 2 misses and 1 hint, no page errors) and a 1024×768 landscape screenshot (cards end at y≈236, crown top ≈250); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaround-island FINGER_LEVELS=7` PASS (prek, 9.7 s); `npm run build` OK.
- Not run: device speech of the new lines, an iPad, a child's reaction.

## 2026-11-04 — Quick Tricks level 7 Two at once (quick-tricks batch 2)

- [PR #1228](https://github.com/rjdunlap/neo/pull/1228) at d85087b2 (base 22bfabfc): level 7 in show one doubled (three friends and two leaves, two socks from five, narrow and wide gaps with three planks); pre-K 2–7, school 5–7.
- Ran: typecheck; full `npm test` 303 files, 4910 tests pass before the final reviewer fixes, then the game's 19 rule tests after them; `BROWSER_SUITE=next NEXT_ONLY=tricks FROM_LEVEL=7` passed (portrait 768×1024, 3 misses / 2 hints, one saved sticker, screenshot `test-results/browser/next/quick-tricks-two-at-once.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=quick-tricks FINGER_LEVELS=7` PASS 27.9 s.
- The game-reviewer findings (hidden small leaf, rain unchanged below 7, plank spacing) were fixed.
- Not run: `npm run build` (no shared assets; CI runs it), landscape, an iPad, a child's reaction.

## 2026-11-04 — Quick Tricks level 8 A tiny show (quick-tricks batch 3)

- [PR #1232](https://github.com/rjdunlap/neo/pull/1232) at the branch head (`claude/quick-tricks-tiny-show`, dev server http://localhost:5893): level 8, the two-trick toddler entry (nothing counts); toddler order 8, 1, preschool order 8, 1–4, `entryLevels: [8]`.
- Ran: typecheck; full `npm test` 303 files, 4939 tests pass; `BROWSER_SUITE=next NEXT_ONLY=tricks FROM_LEVEL=8` passed (toddler, portrait 768×1024: leaf in front kept the friend dry and floated up, short stretch free, past-halfway snapped, 0/0 saved, bow, one sticker, screenshot `test-results/browser/next/quick-tricks-tiny-show-bow.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=quick-tricks FINGER_LEVELS=8 FINGER_BAND=toddler` finished in 13.3 s; `npm run build` passed (new voice line). The game-reviewer found no defects.
- Not run: an iPad, the ten-quiet-seconds re-say in the browser, landscape, a rendered voice clip for `tricks.start-two` (device speech is the fallback), a child's reaction.

## 2026-11-04 — Light Lab level 12 Split the sunbeam (light-lab batch 6)

- [PR #1229](https://github.com/rjdunlap/neo/pull/1229): level 12 for school, a half-mirror splitting the beam into two dim arms that each wake a flower; school range 2–12, order [2,3,4,11,5..10,12]; `light.split`, `light.split.yay`, `light.miss.*` and `light.hint.split` voice lines, how-to steps, a window-pane torch sentence in the off-screen suggestion.
- Ran (tested commit `9df8efa5`, base `22bfabfc`; Vite `http://localhost:5678/classic/`): typecheck; `npm test` 303 files and 4,914 tests pass (42 light-lab tests, 12 new: `traceAll` against `trace` on levels 1–10, the split rule, generator, split required, fair start, hints reach an answer in exactly `minTurns`, mirror image, `whyNot` reasons with voice lines, ladder); one scripted portrait play (768×1024) of level 12 at school: two missed shines (`light.miss.unsplit` each), the glow as one hint, both puzzles solved, sticker, history level 12 / misses 2 / hints 1, no page errors, screenshot mid-shine showing both dim arms and both flowers awake; `BROWSER_SUITE=fingerdemo FINGER_ONLY=light-lab FINGER_LEVELS=12` PASS 15.5 s. `game-reviewer`: no blocking findings.
- Not run: `npm run build` (only listed files changed), couch suites (couch unaffected), 1024×768 landscape (the 7×5 board is the existing level 4–7 board), iPad, device speech. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-04 — Pond Conga level 9 A long conga (pond-conga batch 4)

- [PR #1230](https://github.com/rjdunlap/neo/pull/1230): level 9 (11 by 7, 6 pads, 8 bites, 2.6 steps a second; starts 7 ducklings long in an L; tail in the way on at least 4 of 8 legs; par still the open-water bound); grown-up `order` `[8,1,…,7,9]`, entry 8; not on the couch trip; no new voice lines; how-to level 8 rescoped, two level-9 steps.
- Ran (base `73564551`, Vite `http://localhost:5650`): typecheck; `npx vitest run src/games/pond-conga` 47 pass (new 'level 9, a long conga' describe); registry and `src/content` tests 203 pass; `BROWSER_SUITE=congatouch CONGA_LEVELS=9` pass (7 ducklings and 8 bites at the start, portrait targets and screenshot, a 3-step bump into the tail with no duckling lost, then a sticker, misses 1 hints 0); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pond-conga FINGER_LEVELS=9` pass (25.3 s). `game-reviewer`: no findings.
- Not run: `npm run build` (no shared files or assets), `couchgames` (couch path unchanged), an iPad or a person (whether the long tail feels like planning rather than a trap at 2.6 steps a second is added to the Pond Conga [device check](../DEVICE-CHECKS.md)).

## 2026-11-04 — Peekaround Island level 8 From the sky (peekaround-island batch 5)

- [PR #1231](https://github.com/rjdunlap/neo/pull/1231) at c971be41: new `sky` mode (school 4–8; pre-K unchanged at 3–7): three map cards (true, mirror, quarter-turned) with a boat on her side; mirror miss names the swapped friends, turned miss turns the island to match and back, a wrong map counts once, ring and hint after two misses; three scenes (all in sight, one hidden of three, one hidden of four).
- Ran (base origin/main f3587fb1, `GAME_URL` http://localhost:5875): typecheck; full `npm test` 303 files, 4934 tests pass incl. 7 new level-8 rule tests; one-off Playwright probe at school level 8 (mirror miss, repeat mirror not counted, turned miss with the island turned to -1 and back to 0, [misses, hints, hinting] = [2, 1, true], three scenes to the sticker, no page errors); logged 1024×768 layout (crown top 210 vs card bottom 200, shadow bottom 731 < 768, boat at (512, 710)); portrait 768×1024 screenshot of the three maps; `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaround-island FINGER_LEVELS=8` PASS (9.0 s); `game-reviewer` found no defects.
- Not run: `npm run build` (no shared assets or files), the `woods` suite (levels 1–7 unchanged), device speech of the new lines, an iPad, a child's reaction ([device checks](../DEVICE-CHECKS.md)).

## 2026-11-04 — Pond Conga school opening, levels 10 and 11 (pond-conga batch 5)

- [PR #1233](https://github.com/rjdunlap/neo/pull/1233): `school` joins `pond-conga`; level 10 (6 by 4, no pads, 3 bites) and level 11 (7 by 4, 2 pads, 4 bites), step by step at 100-unit cells, 210 by 100 buttons, `entryLevels` `[8, 10, 11]`; tap toward a touch; a bump is a refused step (miss, `conga.bonk-school`), dots on the second bump without a hint; voice `conga.go-school` and `conga.bonk-school`, how-to steps, co-play and off-screen text.
- Ran (commit `411c28c6`, plus a cosmetic follow-up moving the bump puff to the refused side, rule tests only; Vite `http://localhost:5435/classic/`): typecheck; pond-conga rule tests 54 pass, registry and content tests pass; full `npm test` had 5 failures in unrelated games (block-garden, fluffy-salon, keep-house, penguin-slide) that pass when re-run alone (load timeouts); `npm run build` passes.
- One-off scripted school play: level 10 at 1024 by 768 (cells 100, pond 600 by 400 at x 212 y 132, buttons 210 by 100 at x 294 and 520, y 548); two bumps into the bank (line stayed, misses 1 then 2, dots on the second, hints 0), a tap on the leader did nothing, a tap-toward step ate a bite, played to the sticker. Level 11 upright (1024 by 1365 logical): cells 100, pond 700 by 400 at x 162 y 132, played by taps to the sticker with 0 misses; one portrait screenshot looked right. `BROWSER_SUITE=fingerdemo FINGER_ONLY=pond-conga FINGER_LEVELS=10,11 FINGER_BAND=school` pass (14.4 s, 25.2 s).
- Not run: `couchgames` (couch path untouched), grown-up `fingerdemo` (grown-up paths unchanged), device speech of the new lines, an iPad or a child (whether a six-year-old starts from the instruction, whether a refused step reads as blocked, and the tail on the 7 by 4 pond are in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).
