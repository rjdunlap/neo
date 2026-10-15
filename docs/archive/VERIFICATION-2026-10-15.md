# Verification 2026-10-15 (archived entries)

## 2026-10-15 — Day by Day level 4 A day beside any day

- [PR #350](https://github.com/rjdunlap/neo/pull/350), branch `claude/day-by-day-neighbor-l4`: level 4 (`ANCHOR_LEVEL`, `relativeQuestions`): two seeded different anchors, one tomorrow and one yesterday in shuffled order, no tally; pre-K order [1, 2, 4] range 1–4, school order [2, 4, 3] range 2–4; voice `week.tomorrowany`, `yesterdayany`, `tomorrowhint`, `yesterdayhint`; level-scoped how-to lines. Levels 1–3 unchanged.
- Passed `npx tsc --noEmit`; vitest day-by-day, content and registry (new rule test: opposite directions, distinct anchors, all seven anchors reachable both ways, levels 2–3 unchanged); `BROWSER_SUITE=week WEEK_LEVELS=4` on localhost:5437 (real taps, retries, hint, seven records, sticker).
- `fingerdemo` (`FINGER_ONLY=day-by-day FINGER_LEVELS=4`): passed (prek, 44.3 s).
- Not run: build, portrait screenshot, device speech. Known gap: a hint glows only the answer card, not the adjacent pair the study proposed.

## 2026-10-15 — Peekaboo Barn level 16 One door

- [PR #331](https://github.com/rjdunlap/neo/pull/331), branch `claude/peekaboo-one-door`: lap entry placed first (lap `order` [16, 1, 2], `entryLevels` [16]); one big house, a touch anywhere opens it (a new animal each time, never repeating), it opens by itself after 6 s untouched and that self-opening does not count; six touched reveals, no misses or hints. `howto.test.ts` now iterates `levelsInOrder`.
- Passed `npm run typecheck`; full vitest (1279 pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=16,2` (self-opening uncounted, a far-corner touch counts; the original-six history count is now 9); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaboo-barn FINGER_LEVELS=16` finished in 18.8 s.
- Not run: a portrait screenshot, build, and the person check (whether a one-year-old swats or looks first).

## 2026-10-15 — Critter Crossing level 7 Settle it

- [PR #332](https://github.com/rjdunlap/neo/pull/332), branch `claude/critter-crossing-settle-it` (uncommitted working diff over `5d05927`): school now levels 2–7. Level 7 starts with two critters already tried (one crossed, one waited) leaving the rule and a lookalike standing; of the four waiting critters at least one splits the two and at least one does not. A critter both pictures answer alike is a free try with `cross.same` (never a miss); two such tries glow a splitter (one hint). Guess wakes at 3 tries (the two count).
- Passed `npx tsc --noEmit`; vitest `src/games` + `src/content` (120 files, 1026 tests, including the new "level 7, settle it" rule tests); `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-crossing FINGER_LEVELS=7` in 21.7 s; one scripted portrait play (820x1100) at level 7: two same-answer tries, a hint glow (hints 1, misses 0), then a splitter crossed; screenshot reviewed.
- Not run: the how-to demonstration watched by eye, build, offline, a landscape screenshot, play by a child on an iPad, and device speech for `cross.settle` and `cross.same`.

## 2026-10-15 — Goodnight Room a note per friend

- [PR #333](https://github.com/rjdunlap/neo/pull/333), branch `claude/goodnight-friend-notes` (uncommitted working diff over `1176f47`): slice 10, first half. Each friend has its own pentatonic bell step (`NOTE_STEP` in `src/games/goodnight-room/logic.ts`), played when she says goodnight, replacing the note that rose with the count. The finale is unchanged. The yawn nudge is not built.
- Passed `npx tsc --noEmit` and the Goodnight Room unit tests (12 pass, including the new "distinct notes per room" test).
- Not run: browser play, a listen on a device, build, offline.

## 2026-10-15 — Duck Pond level 12 Bye-bye ducks

- Changed: a `bye` plan at level 12 in `src/games/duck-pond` (five ducks, tap one to wave it off, counted down, all swim back; lap and toddler entry), [PR #334](https://github.com/rjdunlap/neo/pull/334). Departing ducks take no taps.
- Ran: `npm run typecheck`; `npx vitest run src/games` (1028 passed); `BROWSER_SUITE=originals ORIGINALS_ONLY=ducks DUCK_LEVELS=12` (also portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=duck-pond FINGER_LEVELS=12` clean in 28.2 s.
- Not run: build, device or child check; the screenshot was not reviewed visually. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-15 — Tangram Town pine (level 6)

- Added one picture, `pine` (roof over an upside-down hull on a square trunk), to level 6's silhouette pool only (`src/games/tangram-town/logic.ts`); level 4 needs a triangle pair so it is not there. Pictures are now twenty by the count of `PICTURES` keys.
- Ran: `npm run typecheck` clean; `npx vitest run src/games/tangram-town` 13 passed (the existing every-picture fits, never-overlaps and fills tests cover the new picture).
- Not run: browser play, `creative` filter, `fingerdemo` and the one screenshot of the new art the content tier asks for.
- Open: how the pine looks on screen, and a real-device play; neither is established.

## 2026-10-14 — Recovered grown-up games and session cleanup

- [PR #336](https://github.com/rjdunlap/neo/pull/336): integrated Snowball Merge (three levels), canonical Marble Jump (six, plus duplicate’s repeated-visible-hint guard) and Log Roll (three). Marble Jump is in Puzzle Peaks, Log Roll in Tinker Lab and Snowball Merge in Lantern Lake; full-size land targets preserved. [Source/recovery audit](SESSION-CLEANUP-2026-10-14.md).
- Ran: typecheck; full unit run (149 files, 1,295 tests); focused game rules/registry/how-to/lands (6 files, 56 tests); build passed (existing bundle-size warning). At `http://localhost:5187`, filtered `marblejump` 1/6, `logroll` 1/3 and `snowball` 1/3 passed, including invalid/inert actions, requested help, revision, placement/routes and portrait; all three portrait images visually reviewed.
- Source first/top ghost-finger passes retained in [historical evidence](LOCAL-GAME-BUILDS-2026-10-13.md); bots unchanged and demos not rerun. No world, couch, offline, iPad, device-speech or human-enjoyment check claimed. Documentation links/diff checked during closeout.
- Final cleanup: 55 worktrees audited, 41 removed with durable backups/recovery refs; primary checkout clean on current `main`. Twelve locked session/coordinator worktrees plus primary/current retained. All identified completed unique features merged; documentation links/diff passed.

## 2026-10-15 — Robot Path level 13 Pick it up on the way

- [PR #347](https://github.com/rjdunlap/neo/pull/347), branch `claude/robot-path-pick-it-up`: school level 13 (school range now 4–13): an apple `via` waypoint on `RobotPlan`, `VIA_PLANS` (three 5 × 5 boards, counted slots, limit 4), a new stop `forgot` ("You forgot the apple", the apple glows, one miss), how-to lines, voice lines `robot.via` and `robot.forgot`; the `robot` browser suite now plays 1–13 by default.
- Passed `npm run typecheck`, the Robot Path logic tests (15) with registry and content tests (92), `BROWSER_SUITE=robot FROM_LEVEL=13 TO_LEVEL=13` (portrait, a forgot miss, one bump hint, the solution) and `FINGER_ONLY=robot-path FINGER_LEVELS=13` (clean in 18.2 s); one portrait screenshot (`test-results/browser/robot-path-13.png`) reviewed.
- Not run: the full unit suite after the final tweak (typecheck only), `npm run build`, other levels, iPad, device speech, a child.

## 2026-10-15 — How computers work subject research

- Docs only, researched at `ee323ff` (base `3e68822` plus the claim) and docs diff on `codex/how-computers-work-research`, [PR #345](https://github.com/rjdunlap/neo/pull/345): [study](../deep-dives/subjects/how-computers-work.md), tracker, [roadmap packets](../ROADMAP.md#how-computers-work-recommendations), notebook and decision/device records. Sorting Machine first, Festival Signals older case, Picture Bytes in Pixel Pictures, then Memory Desk; fourteen subjects researched.
- Opened CSTA 2026/historical 2017, ISTE, early-childhood/unplugged guidance, Boolean/memory technical references, five first-party digital descriptions and Turing Tumble. Rocky's Boots/Robot Odyssey originals, NandGame and Field Guide access gaps are explicit. No reference game played or learning/appeal/transfer result established.
- Ran: local Markdown links/anchors and `git diff --check` (docs-only tier); oldest live entry rotated with links repaired. No source, tests, assets, game, server or practical card.
- Not run: typecheck, units, build, browser/offline, hardware/speech or child/parent play. Exploratory-round adaptation, model review, ranges/placement and independent use remain open; practical cards retain named review.

## 2026-10-14 — Energy and waves subject research

- Docs only, researched at `d37faa2`, integrated upstream `69fcf4d` plus docs diff on `codex/energy-waves-subject-research`, [PR #343](https://github.com/rjdunlap/neo/pull/343): [study](../deep-dives/subjects/energy-waves.md), tracker, [roadmap packets](../ROADMAP.md#energy-and-waves-recommendations), notebook and decision/device records. Circuit Garden first, its older lantern workshop next, Wave Ribbon second new-game candidate; light/sound additions reuse existing identities. Thirteen subjects researched.
- Opened NGSS/Head Start, NAEYC, ACS/Exploratorium, ASA wave guidance, a PhET author commentary and six digital descriptions with indexed/shell/failed-source limits explicit. No reference played, experiment run or learning/appeal/transfer result established.
- Ran: local Markdown links/anchors and `git diff --check` (docs-only tier); rotated the three oldest live entries with links repaired. No code, practical card or server.
- Not run: typecheck, unit tests, build, browser/offline, hardware/speech or child/parent play. Model review, proposed ranges/placement and independent use remain open; practical electrical/magnet/string cards require named review.

## 2026-10-15 — Day by Day deep dive

- Docs only at `ae77222` plus the documentation diff, integrated with coordinator checkpoint `6f43874`; branch `codex/day-by-day-deep-dive`, [PR #349](https://github.com/rjdunlap/neo/pull/349). [Study](../deep-dives/day-by-day.md) audits levels 1–3, pools, support/accounting and first-slice definition; five reference activities, proposed stable IDs 4–10 and eight bounded build slices. First five slices ready; preschool, months and daylight gated.
- Primary publisher/educator descriptions and NGSS anchors opened; no reference played. Links to tracker, notebook, roadmap, decisions/device checks and queue updated. No implementation or learning/appeal claims.
- Ran: `node scripts/check-links.mjs` and `git diff --check`; scoped diff contains documentation only. Rotated two older live entries with moved-anchor links repaired.
- Not run: typecheck, units, build, browser/offline, iPad speech/touch or child/co-play. These are research proposals; no game mode built and no server started.

## 2026-10-15 — Color Garden level 8 Color or kind

- [PR #351](https://github.com/rjdunlap/neo/pull/351), branch `claude/color-garden-color-or-kind`: `PLANS[7]` `{ rule: true }`, eight items from two rainbow colors, each as fruit and balloon; a sign top-right (two swatches or fruit and balloon icons) names the rule, then two color baskets or a fruit and a balloon basket (icon on a plain cloth); rule random per seed; preschool 3-8, pre-K 4-8, toddler stays 1-5; voice `garden.rule.color`/`kind`, `garden.is.fruit`/`balloon`, `garden.kind.wrong`; how-to step from level 8.
- Passed `npx tsc --noEmit`; vitest color-garden, content and registry (99 pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=garden` (levels 1-8, script extended to 8); `fingerdemo` (`FINGER_ONLY=color-garden`): level 8 finished in 29 s with no wrong move; one landscape screenshot reviewed.
- Not run: portrait screenshot, device speech, build, `smoke` and `howto` suites.

## 2026-10-15 — Day by Day show the week turning

- [PR #353](https://github.com/rjdunlap/neo/pull/353), `codex/day-by-day-week-art`; dispatch `day-by-day-week-art-20261015T084300Z`. Levels 1–3: noninteractive placement thread, settling weather stamps, Sunday–Monday return/evidence outlines and three seeded garden treatments; rules, RNG stream, target sizes, accounting and bot actions preserved. Level 4 retained.
- Tested `abc0ad2` plus scoped game/presentation/browser diff: typecheck and eight focused Day by Day rule/presentation tests passed (including cosmetic RNG isolation, all three treatments and wrap geometry).
- Passed `BROWSER_SUITE=week WEEK_LEVELS=2 GAME_URL=http://localhost:5176 npm run test:browser` (08:49:35 UTC): free naming, wrong confirmations/weather, 3 misses/1 hint, seven records, one saved sticker and interrupted speech exit; no page errors. Sandbox launch failed before play; outside-sandbox isolated run passed. Reviewed `test-results/browser/day-by-day-2-wrap-portrait.png` and the landscape image: return path, records, choices and pet clear.

## 2026-10-15 — Bumper Garden truthful how-to and bloom count

- [PR #355](https://github.com/rjdunlap/neo/pull/355): deep-dive slice 1. Level 2 (bloom) now says the running count as each flower blooms (`ctx.say('count')`, the color levels' call) in `src/games/bumper-garden/index.ts`; the how-to card's step 1 is `to: 1` and the finish line is per level (`src/content/howto.ts`).
- Ran: `npm run typecheck` passed; `vitest run src/content src/games/bumper-garden src/games/registry` 98 passed.
- Not run: browser play of level 2 (a one-line change reusing the color-mode count call), `fingerdemo`, a device or a child.
- Open: whether the count reads well at the 1.2 s relaunch pace.

## 2026-10-15 — Day by Day count beside the record

- [PR #357](https://github.com/rjdunlap/neo/pull/357), `codex/day-by-day-record-bridge`, dispatch `day-by-day-record-bridge-20261015T094230Z`. Stable 10 supplies a seeded immutable week, three baseline outlined suns, reversible free marks/replay and one correct total to finish; school order [2, 4, 10, 3], entry [10]. No schema change or additional mode.
- Tested claim `a388c39` plus scoped implementation diff: typecheck, 119 focused rule/presentation/registry/how-to/difficulty/store/profile tests and production build passed (existing chunk-size warning). Ordering, entry/birthday landing, stable saved/pinned IDs, immutable evidence and 1–4 plan preservation covered.
- Passed `BROWSER_SUITE=week WEEK_LEVELS=10 GAME_URL=http://localhost:5176 npm run test:browser` at 09:47:05 UTC: supplied tally start, zero baseline hints, free reversible non-sun marks, immutable records, three wrong totals/one hint, one correct total finishes despite incorrect marks, saved sticker and interrupted-speech exit. Chromium sandbox launch failed before play; isolated outside-sandbox play passed with no page errors.
- Reviewed `test-results/browser/day-by-day-10-record-portrait.png`: all records, sun outlines, 100-unit logical targets, numbers, text and pet clear. Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day FINGER_LEVELS=10 GAME_URL=http://localhost:5176 npm run test:browser` at 09:47:41 UTC: school 10 finished cleanly in 7.2 s. Owned Vite server stopped.
- Links, diff and browser syntax checks at closeout. Not run: unchanged game plays, broad/world/offline suites, iPad touch/device speech or child play; existing device checks stay open.

## 2026-10-15 — Clock Tower levels 3 and 6 coverage

- [PR #358](https://github.com/rjdunlap/neo/pull/358), branch `claude/clock-tower-coverage`: rules only in `src/games/clock-tower/logic.ts`. Level 3 (half past) always asks half past at least once per round, in a random slot; level 6 (one hour later) always includes a start at 11 and one at 12 (the 11 to 12 and 12 to 1 wraparounds). Four distinct tasks per round kept.
- Ran: typecheck; Clock Tower vitest (9 pass); the new coverage test was shown failing on the old rule.
- Not run: browser play, `fingerdemo` (no UI, bot or shared change), a device. Open: the deep dive's animated explanations and level 7 examples.
