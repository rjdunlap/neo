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
