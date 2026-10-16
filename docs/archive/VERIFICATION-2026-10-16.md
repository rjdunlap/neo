# Verification 2026-10-16 (archived entries)

## 2026-10-16 — Critter Sort worked example

- [PR #418](https://github.com/rjdunlap/neo/pull/418), `claude/critter-sort-worked-example` (bff1137): a worked example at levels 1, 2, 3 and 5; two harness fixes (the `woods` sort loop plays `plan.rounds`; `fingerdemo` `FINGER_LEVELS` picks a band whose order has the level).
- Ran `npm run typecheck` and `npx vitest run src/games/critter-sort src/content` (87 passed; new rule test: examples in their own places, at least two loose, bot and hint never touch one, 200 seeds per level).
- Passed `GAME_URL=http://localhost:5961 BROWSER_SUITE=woods WOODS_ONLY=sort` levels 1–4, and level 5 with `FROM_LEVEL=5` after the loop fix; `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=1,2,3,5` clean (12.1, 12.1, 12.2 s at pre-K; 25.2 s at school for 5). One portrait screenshot at level 3 (768×1024) shows the bear in the middle.
- Not run: build (no shared assets), the full unit suite, the other suites. Device speech for the two new lines is open in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## 2026-10-16 — Woodland Picnic definition

- [PR #424](https://github.com/rjdunlap/neo/pull/424), `claude/woodland-picnic-definition`; docs only. Levels (Mail Carrier 6, Seesaw Balance 7, Beat Builder 3) checked against each game's school range in source at `562b97c`.
- Ran the link check and `git diff --check`. No code checks (docs only).
- Open: the build itself, with its story/navigation/save tier checks, is not started.

## 2026-10-15 — Data and AI literacy subject research

- Docs-only study on base `1dea66f` plus scoped working diff: [study](../deep-dives/subjects/data-ai-literacy.md), seven candidate/mode ideas, six-level first-game proposal, older/family cases, tracker/notebook/roadmap updates.
- Opened official standards, primary research and seven reference activities; failed full-paper/lesson-PDF extraction is explicit. No reference games played.
- Passed `node scripts/check-links.mjs` and `git diff --check`; older log entries archived with inbound links updated.
- Not run: typecheck, tests, build, browsers or hardware; no code changed. Audience appeal, independent understanding and transfer remain unestablished.
- [PR #431](https://github.com/rjdunlap/neo/pull/431); publication explicitly authorized on 2026-10-16 after the initial approval-review block. Integrated main `1dea66f`; checks apply to research commit `8384fbd` plus these publication-link edits.

## 2026-10-16 — Critter Sort level 8 A new sign

- [PR #428](https://github.com/rjdunlap/neo/pull/428), `codex/critter-sort-eight`, dispatch `critter-sort-eight-20261016T071003Z`: tested base `76e5cfd` plus implementation diff. School appends ID 8; same six sort twice under different pictured/spoken rules; one sticker after both passes. Existing IDs/pins and pre-K unchanged.
- Passed typecheck, 46 focused game/registry/how-to tests and build (existing chunk warning). The 300-seed level-8 test proves deterministic, distinct nontrivial splits, both-pass bot/hint selection and reachable hoop/mat answers.
- At `http://localhost:5188`, `BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=8 TO_LEVEL=8` passed same-node/critters identity across both sorts, changed sign, free grass, two misses/one hint, no completion before mat placement, saved result/sticker and no page errors. Landscape and portrait screenshots reviewed.
- At the same URL, `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=8` sorted both passes cleanly in 30.0 s. Initial sandbox Chromium bootstrap blocked; isolated browser run with native permissions passed. Links and diff checked after closeout edits; owned Vite stopped.
- Not run: full units, other levels/suites, world/offline (no navigation/persistence changes), iPad speech/touch and child interpretation; device checks remain open.

## 2026-10-16 — Market Stall pips and a teaching hint

- [PR #429](https://github.com/rjdunlap/neo/pull/429), `claude/market-stall-pips-hint`: tested commit `2b84c8c` minus a later pip-radius enlargement (geometry only; unit tests re-run), base `1dea66f`. Levels 1–3 coins show ink pips (five to a row) under a smaller numeral on a stall-only layer; at levels 3, 5 and 7 the two-miss hint first says a strategy line. Hint counting, `coinArt`, icon and sticker unchanged.
- Passed typecheck; `npx vitest run src/games/market-stall src/content src/games/registry` (106 tests, incl. pip geometry and teach-line legality; the pinned sticker/`coinArt` snapshot still passes); build.
- At `http://localhost:5827`, `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=2` passed levels 2–7 (misses, hint coins, a second way, saved score and sticker, no page errors); it ran before the pip radius was enlarged. Portrait 768×1024 screenshot at level 3 (5, 2, 1 on the mat): pips legible and matching the tag's dots.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=3` clean in 24.0 s.
- Not run: full unit suite, other browser suites, offline; device speech, iPad legibility and whether a preschooler matches pips to tag dots (already [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device)).

## 2026-10-16 — Sink or Float level 7 definition

- Docs only ([PR #432](https://github.com/rjdunlap/neo/pull/432), `claude/sink-float-make-it-float`): [Make it float](../definitions/make-it-float.md) defined as Sink or Float level 7 (school), routed to the roadmap's ready list, the idea notebook and the physics notes.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code checks apply; nothing is built.
- Open: the build itself (new-interaction tier, `fingerdemo` at level 7); device speech and a child's reaction stay unchecked.

## 2026-10-16 — Missing Melody definition

- Docs only: [definitions/missing-melody.md](../definitions/missing-melody.md) defines chunk 7's preschool story episode (entry from Bumpy Hills; Song Maker 4, Sound Garden 2, Sing-Along Barn 3; no typed story result). Levels checked against each game's range in source at `239296f`.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code or browser checks; nothing built.
- Open: the build, after the Woodland Picnic (chunk 22), with its story/navigation/save tier checks.
## 2026-10-16 — Critter Sort level 9 This but not that

- [PR #436](https://github.com/rjdunlap/neo/pull/436), `codex/critter-sort-nine`, worker `01a143f7-ff89-7560-8b89-30f08aa4e88a`, dispatch `critter-sort-nine-20261016T090734Z`: tested base `a9c650e` plus implementation diff. One A/not-B hoop, both-part speech, explicit mat and two diagrams; school appends 9, IDs/pins and pre-K preserved.
- Passed typecheck, 47 focused Critter Sort/registry/how-to tests, and build (existing chunk warning). Across 400 seeds, level 9 accepts exactly A and not B, includes accepted/A-and-B/neither witnesses, avoids the previous pair, and has reachable hint/bot destinations in both views.
- `GAME_URL=http://localhost:5189 BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=9 TO_LEVEL=9`: both diagrams, one hoop, evidence categories, free grass, two misses/one hint, correct glow, mandatory mat completion, saved result/sticker and no page errors. Landscape and portrait screenshots reviewed.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=9` clean in 28.3 s. Initial sandbox launch blocked by Chromium bootstrap permissions; isolated run outside sandbox passed. Links and diff checked; owned Vite stopped after checks.
- Not run: full unit suite, other browser suites, world/offline (no save/navigation/assets change), device speech/iPad/child checks. Device checks remain open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-16 — Tangram Town ship picture

- [PR #434](https://github.com/rjdunlap/neo/pull/434), `claude/tangram-ship` (90799ef): a four-piece ship (hull, upright rectangle mast, a triangle sail each side) joins level 5's pool, now five; twenty-three pictures. No rule, band or save change.
- Ran `npm run typecheck` and `npx vitest run src/games/tangram-town src/games/registry` (29 passed: overlap, picture box, pool membership, any-order fill, pool sizes).
- One real-input probe (`test-results/ship-probe.mjs`, Vite at `http://localhost:5497`, school band, level 5 pinned, portrait 768x1024): one wrong drop counted one miss, every piece selected, turned and dragged home, round finished with a sticker, no page errors; start and built screenshots reviewed.
- Not run: build (no shared files), the `creative` suite, `fingerdemo` (bot unchanged), a device, a child.
## 2026-10-16 — Garden Rows couch play

- [PR #433](https://github.com/rjdunlap/neo/pull/433), `claude/garden-rows-couch` (0e03cb2): Garden Rows joins couch play (ring over the bed, seed packets on a press, `autoplay()`, twin face-off on wrong plantings, last unlock tier); touch play unchanged.
- Ran `npm run typecheck` and `npx vitest run src/couch src/games/garden-rows src/content` (161 passed; the howto test's bot-game count is now 25).
- Passed `GAME_URL=http://localhost:5528 BROWSER_SUITE=couchgames COUCH_ONLY=garden-rows` twice (the second on 0e03cb2): intro, controller diagram lights with the bot, bot round through `control()`, one stop saved, sticker, child save untouched, no page errors. A probe screenshot (level 3, 1024x768) shows the ring on an empty spot with the packets open.
- Not run: full `npm test`, build, full `couch`/`couchcourse` (trip and course code unchanged), offline, a portrait couch view, a real controller or TV.

## 2026-10-16 — Shape Buddies level 2 definition

- [PR #440](https://github.com/rjdunlap/neo/pull/440), `claude/shape-buddies-step-definition`: docs only. Defines Shape Buddies level 2 *A step down* in [the definition](../definitions/shape-buddies.md#level-2-a-step-down-defined-2026-10-16); nothing built.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, unit or browser checks.

## 2026-10-16 — Critter Sort level 11 How many?

- [PR #439](https://github.com/rjdunlap/neo/pull/439), `codex/critter-sort-eleven`, worker `01a14435-4fa4-75c2-bc0c-802e92b789e9`, dispatch `critter-sort-eleven-20261016T101434Z`: tested base `feeafa8` plus implementation diff. School appends 11, skips reserved 10, IDs/pins and pre-K preserved.
- Passed typecheck, 48 focused Critter Sort/registry/how-to tests, and build (existing chunk warning). Across 300 seeds, counts match `placeOf`, parts have 1/2/3 critters, every part can be largest, and counting targets are distinct/reachable in landscape and portrait.
- `GAME_URL=http://localhost:5191 BROWSER_SUITE=woods WOODS_ONLY=sort FROM_LEVEL=11 TO_LEVEL=11`: two mandatory sorts and comparisons, every critter tapped/count badges truthful, repeated taps free, two comparison misses/one hint, resize/replay, saved result/sticker and no page errors. Count-badge landscape and portrait screenshots reviewed.
- Same URL: `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=11` clean in 52.8 s: sorts, counts every part and chooses the largest in both diagrams. Links and diff checked; owned Vite stopped after checks.
- Not run: full units, other browser suites, world/offline (no save/navigation/assets change), device speech/iPad/child checks. Open person/device checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).
