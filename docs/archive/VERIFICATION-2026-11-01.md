# Verification 2026-11-01 (archived entries)

## 2026-11-01 — Size Parade level 13 Hidden heights (size-parade batch 4, slice 9)

- [PR #1083](https://github.com/rjdunlap/neo/pull/1083), branch `claude/size-parade-hidden-heights`, base `origin/main` dce3c468: school level 13 (boots behind a fence, pair tests that swap, a gate on a sorted line, a bubble-sort bot).
- Ran: `npm run typecheck`; full `npm test` 288 files / 4027 tests passed (31 size-parade rule tests, every permutation of 4 and 5 for the pair test, the sweep and the hint path); `npm run build`; `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=13` (free sky tap and pair test, two shut gates = 2 misses/1 hint, bot finishes, portrait screenshot) passed, and again after review fixes; `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=13 FINGER_BAND=school` passed, 53.7 s. `game-reviewer`: two low findings fixed (progress circle filled late; hint speech after the reason). Server http://localhost:5617, stopped.
- Not run: device and child checks (whether a six-year-old plans pair tests rather than mashing; the demo's length on the card), in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-01 — Penguin Slide deep dive (docs only)

- [PR #1086](https://github.com/rjdunlap/neo/pull/1086), branch `claude/dive-penguin-slide`: [dive](../deep-dives/penguin-slide.md). Five slices queued (fair ponds and seeded looks; levels 10 *Three fish*, 11 *Where will it stop?*, 12 *A block onto the star*, 13 *Two penguins*); tracker, READY, backlog and WAITING-ON-DEVELOPER (toddler opening) updated.
- Ran: a throwaway probe of 300 seeds per level (deleted) found ponds where a slide strands the penguin (level 1: 29, level 2: 44, level 3: 36, level 4: 53 of 300) and 145 of 300 level-1 ponds solved in one slide; `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites; nothing played (docs tier, no code changed). Open: the builds.

## 2026-11-01 — Picture Graph deep dive (docs only)

- [PR #1087](https://github.com/rjdunlap/neo/pull/1087), branch `claude/dive-picture-graph`: [dive](../deep-dives/picture-graph.md). Five slices queued (fair meadows; levels 8 *Line them up*, 9 *A key of five*, 10 *Two pictures, one meadow*, 11 *What the graph can say*) with batch plans picture-graph 1–5; tracker, READY, backlog, ideas, four subject studies and WAITING-ON-DEVELOPER (preschool opening) updated.
- Ran: a throwaway probe (5,000 rounds a level at 1024×768, deleted) found two critters overlapping in 10.7% of level-7 rounds, 0.1% at level 3 and none at levels 1–2; `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, no code changed). Open: the builds; the level-11 person check.

## 2026-11-01 — Picture Logic deep dive (docs only)

- [PR #1089](https://github.com/rjdunlap/neo/pull/1089), branch `claude/dive-picture-logic`: [dive](../deep-dives/picture-logic.md). Three slices queued (fresh pictures and named hints; level 5 a small 5 by 5 with level 7 a harder 15 by 15; level 6 *Two colours*, after Pixel Pictures batch 1) with batch plans picture-logic 1–3; tracker, READY, backlog and ideas updated. No developer decision.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.

## 2026-11-01 — Pond Conga deep dive (docs only)

- [PR #1090](https://github.com/rjdunlap/neo/pull/1090), branch `claude/dive-pond-conga`: [dive](../deep-dives/pond-conga.md). Four slices queued (duck-friendly food and a seeded bank; level 7 *Choose the order*; level 8 *Step by step*; level 9 *A long conga*) with batch plans pond-conga 1–4, plus a school-opening definition; tracker, READY, backlog, ideas and waiting list updated. One developer decision: whether a bonk counts as a miss for adaptation.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the four builds.

## 2026-11-01 — Quick Tricks deep dive (docs only)

- [PR #1092](https://github.com/rjdunlap/neo/pull/1092), branch `claude/dive-quick-tricks`: [dive](../deep-dives/quick-tricks.md). Three slices queued (truthful accounting, a seeded cast and a bow for the second show; level 7 *Two at once*; level 8 *A tiny show*, the toddler entry) with batch plans quick-tricks 1–3, plus a third-show definition; tracker, READY, backlog, ideas and waiting list updated. Two developer decisions: a lap toy shelf, and retiring the couch chunk 9 candidate.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.

## 2026-11-01 — Read & Do deep dive (docs only)

- [PR #1094](https://github.com/rjdunlap/neo/pull/1094), branch `claude/dive-read-do`: [dive](../deep-dives/read-do.md). Two builds queued (batch read-do 1, fresh words and pictures; batch read-do 2, levels 4–6 *Capital and stop*) and definitions queued for *Make the sign* (level 7) and *Mend the sign* (levels 8–9); tracker, READY, batches, backlog, ideas and the two subject studies updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the two builds and two definitions.

## 2026-11-01 — Rhyme Time deep dive (docs only)

- [PR #1095](https://github.com/rjdunlap/neo/pull/1095), branch `claude/dive-rhyme-time`: [dive](../deep-dives/rhyme-time.md). Four builds queued (batches rhyme-time 1–4: fresh families, level 8 *Silly pairs*, the level 9 preschool opening, level 10 *Rhyme baskets*); *Change the start* stays a sketch; tracker, READY, batches, backlog, ideas, the poetry study and device checks updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the four builds and the two device checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#rhyme-time-dive-2026-11-01-proposed-nothing-built)).

## 2026-11-01 — Secret Code deep dive (docs only)

- [PR #1096](https://github.com/rjdunlap/neo/pull/1096), branch `claude/dive-secret-code`: [dive](../deep-dives/secret-code.md). Six builds queued (batches secret-code 1–6: fair rows and a refreshed hint, level 8 *Four slots*, level 9 *Be the door*, the level 10 preschool opening, level 11 *A bigger detective door*, the couch course *The Code Doors*) and the maker/breaker definition after level 9; tracker, READY, batches, backlog, ideas, roadmap and device checks updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the six builds and the three device checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#secret-code-dive-2026-11-01-proposed-levels-not-yet-built)).

## 2026-11-01 — Shape Buddies deep dive (docs only)

- [PR #1097](https://github.com/rjdunlap/neo/pull/1097), branch `claude/dive-shape-buddies`: [dive](../deep-dives/shape-buddies.md). Five builds queued (batches shape-buddies 1–5: what grows, level 4 *Down and catch*, level 5 *A cup on the ledge*, level 6 *Which way round?*, the level 7 preschool opening) and the shared-roles definition after batch 5; tracker, READY, batches, backlog, ideas, roadmap and device checks updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the five builds and the four device checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#shape-buddies-dive-2026-11-01-proposed-levels-not-yet-built)).

## 2026-11-01 — Sing-Along Barn deep dive (docs only)

- [PR #1098](https://github.com/rjdunlap/neo/pull/1098), branch `claude/dive-sing-along-barn`: [dive](../deep-dives/sing-along-barn.md). Three builds queued (batches sing-along-barn 1–3: tunes with their own notes, level 7 *Finish the line*, level 8 *Which one finishes it?*); slices 4–5 stay in the dive. Tracker, READY, batches, backlog, ideas, roadmap, poetry study notes, device checks and the GAMES song count (eight) updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds and the four device checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#sing-along-barn-dive-2026-11-01-proposed-new-tunes-and-levels-not-yet-built)).

## 2026-11-01 — Rule Machine levels 1–2 (algebra-balance AB1)

- [PR #1091](https://github.com/rjdunlap/neo/pull/1091), branch `claude/rule-machine-1-2`: new game `rule-machine` in Puzzle Peaks (14 games), pre-K level 1 and school level 2; batch rule-machine 1.
- Ran (tested at 4a1c763e, Vite dev on http://localhost:5821, `VITE_SPEECH=off`): typecheck; 25 rule tests with the registry, lands, how-to and content tests (215 passed); `BROWSER_SUITE=rulemachine` three consecutive passes after a script race fix (level 1 at pre-K a free wrong first guess, two counted wrongs and the glow, saved 2 misses/1 hint; portrait level 2 one wrong pad after two rows, saved 1/0; screenshots of the glow and the portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=rule-machine FINGER_LEVELS=2` (43 s); `npm run build`; `game-reviewer`, its two findings fixed (a resize during the car's hop could softlock; the truth now shows beside her pick).
- Full `npm test` ran once: 6 failures: timing tests in other games (penguin-slide, block-garden, fluffy-salon, keep-house) that passed in isolation under machine load (flakes), and the voice-clip test, which needed the new title's Kokoro clip (rendered with `scripts/voice-clips/render.mjs`; clip tests 4 passed).
- Not run: offline check, level-1 finger demo. Source check of the "went in / came out" and "one more / two more" wording against CCSS 3.OA.D.9, 4.OA.C.5 and England Year 6 not done (open).
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#rule-machine-levels-14-algebra-balance-ab1-2026-11-01-and-2026-11-02)): the device and person checks there.

## 2026-11-01 — Sprout Shuffle level 4, which pairs always make spotted (genetics G5)

- [PR #1093](https://github.com/rjdunlap/neo/pull/1093), branch `claude/sprout-shuffle-4`: `sprout-shuffle` level 4 (school range 1–4), batch sprout-shuffle 1; new `pairs.ts`, pair pools and counterexamples in `logic.ts`, 16 `sprout.*` voice lines on device speech.
- Ran (Vite dev on http://localhost:5643, `VITE_SPEECH=off`): typecheck; 29 Sprout Shuffle rule tests (10 new); howto and registry tests 41/41; `BROWSER_SUITE=sproutshuffle SPROUT_LEVELS=4` (free magnifier fan, two wrong Checks with counterexample and glow, accepted pairs, saved 2 misses/1 hint; landscape and portrait screenshots reviewed), re-passed after the review fix; `FINGER_ONLY=sprout-shuffle FINGER_LEVELS=4` clean 3.4 s; `game-reviewer` (no rule findings; two cosmetic races fixed).
- Full `npm test` 4095/4099: four time-bounded tests in other games (block-garden, fluffy-salon, keep-house, penguin-slide) failed under load and passed 110/110 on an isolated rerun.
- Source check of the counterexample lines: they follow standard single-gene complete-dominance Punnett results (AA×aa, AA×Aa, AA×AA all dominant; Aa×aa half recessive; Aa×Aa a quarter; aa×aa all recessive), as in introductory Mendelian sources such as Khan Academy and Britannica; lines remain draft.
- Not run: build (CI runs it), levels 1–3 suite (unchanged code), offline. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#from-the-delegated-decisions-2026-10-23)): pair-card wording by ear and on iPad, magnifier discoverability, whether two accepted pairs read as both right.

## 2026-11-01 — Household Casebook definition (everyday-life-long-ago H5, docs only)

- [PR #1100](https://github.com/rjdunlap/neo/pull/1100), branch `claude/define-household-casebook`: [definition](../definitions/household-casebook.md) of Attic Finds levels 7 *Two sources*, 8 *What can we tell?* and 9 *Mend the exhibit* (school only, one invented bird-box case). Study, packet, backlog, ideas, READY and [batches attic-finds 3 and 4](../GAME-BATCHES.md#attic-finds-3-two-sources-and-what-can-we-tell) updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the two builds and the device checks the definition lists.

## 2026-11-01 — Sink or Float deep dive (docs only)

- [PR #1101](https://github.com/rjdunlap/neo/pull/1101), branch `claude/dive-sink-or-float`: [dive](../deep-dives/sink-float.md). Two builds queued (batches sink-float 1 *Fresh things* and 2 *Big and small*); level 10 *Salty or fresh* definition queued; level 11 waits for the Garden Raft definition. Tracker, READY, batches, backlog, ideas and the oceans, recommendations and engineering handoffs updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the builds and the device question whether a toddler predicts at level 3.

## 2026-11-01 — Sudoku Garden deep dive (docs only)

- [PR #1102](https://github.com/rjdunlap/neo/pull/1102), branch `claude/dive-sudoku-garden`: [dive](../deep-dives/sudoku-garden.md). Four slices queued ([batches](../GAME-BATCHES.md#sudoku-garden-1-a-4-by-4-bed-to-start): a 4 by 4 bed to start, fill marks on big beds, a crossing pair of rows, patchwork beds); cage beds are a queued definition.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the four builds.

## 2026-11-01 — Treasure Map deep dive (docs only)

- [PR #1103](https://github.com/rjdunlap/neo/pull/1103), branch `claude/dive-treasure-map`: [dive](../deep-dives/treasure-map.md). Five slices queued ([batches](../GAME-BATCHES.md#treasure-map-1-fresh-maps-and-true-hints): fresh maps and true hints, *Write the card*, *How far?*, *Slide it*, the preschool *One line*); *Across the river* (levels 10–11) is a queued definition. Tracker, READY, batches, backlog, ideas, roadmap and the area-volume-space handoffs updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the five builds and the definition.

## 2026-11-01 — Word Search deep dive (docs only)

- [PR #1104](https://github.com/rjdunlap/neo/pull/1104), branch `claude/dive-word-search`: [dive](../deep-dives/word-search.md). Four slices queued ([batches](../GAME-BATCHES.md#word-search-1-fresh-themes-and-root-families): fresh themes and root families, *A small grid to start*, *A message in the leftovers*, *Just the theme*); the school opening is a queued definition. Tracker, READY, batches, backlog, ideas and the vocabulary study handoffs updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the four builds and the definition.

## 2026-11-01 — Not Always levels 1–3 (philosophy-reasoning PR1)

- Branch `claude/not-always-1-3`: new game `not-always` in Story Grove (17 games), pre-K 1–2 and school 1–3; batch not-always 1. Critter Sort's `hatArt` moved to `src/art/props.ts` (looks unchanged).
- Ran (commit 44faac49 on base 205a5d4e, Vite dev on http://localhost:5648): typecheck; full unit suite 4128 passed (29 Not Always rule tests: authored rounds, 300-seed rows per level, decoy, mends, accounting, hint targets finish every round, layout at four views); `npm run build`; `BROWSER_SUITE=notalways` (pre-K level 1 two fitting cards then glow then breaker 2/1; portrait level 2 false stamp then true claim 1/0; level 3 free card tap, one false mend, then true 1/0; screenshots of level 1, portrait level 2 and level 3 mends); `BROWSER_SUITE=fingerdemo FINGER_ONLY=not-always FINGER_LEVELS=2,3` (7.3 s, 8.5 s).
- `game-reviewer` found two minor issues, fixed (mend reading token, narrow-view rows); rule tests re-ran, the browser play was not re-run after them.
- Not run: offline check, any device or child check.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#not-always-philosophy-reasoning-study-2026-10-31-levels-13-built-2026-11-01)): the person and device checks there.

## 2026-11-01 — Caravan Days levels 6–7 (china-india-silk-road CS4)

- Branch `claude/caravan-days-wells` ([PR #1106](https://github.com/rjdunlap/neo/pull/1106)): batch caravan-days 3, school range 3–7; level 6 `pass` (road band, day card, Go) and level 7 `wells` (switchback road, tap-to-dig); the `caravandays` browser case gained `CARAVAN_FROM=6`.
- Ran (commit 8a2ccef5): typecheck; 44 caravan-days rule tests (7 new: level 6 plans, verdicts and bot over 300 seeds, level 7 plans, full subset enumeration over 100 seeds, layout at four views); full `npm test` 291 files / 4135 tests; `npm run build`; `BROWSER_SUITE=caravandays CARAVAN_FROM=6` on a private Vite port (level 6 Go before both free, slower road with a wrong count a miss, help a hint, its right count accepted, portrait screenshot, saved 1/1; level 7 Done empty free, one well a miss, help a hint, fewest placement plus an extra accepted, portrait screenshot, saved 1/1); `fingerdemo` `FINGER_ONLY=caravan-days FINGER_LEVELS=6,7 FINGER_BAND=school` 19.4 s and 19.7 s.
- `game-reviewer`: no blocking findings. History lines source-checked against Wikipedia (Caravanserai, Edicts of Ashoka).
- Not run: other suites, offline check, device checks.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#caravan-days-levels-67-cs4-2026-11-01)): snow day and road length, the switchback in portrait, fewer wells, device speech for day and hoofprint slots.
