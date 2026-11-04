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
