# Verification 2026-10-15 (archived entries)

## 2026-10-15 — Duckling Parade destination and cancellation

- [PR #391](https://github.com/rjdunlap/neo/pull/391), branch `codex/duckling-parade-steering`, worker `01a1411e-24fa-7b30-9214-8ffecd67319d`, dispatch `duckling-steering-20261015T195026Z`: local palette destination ring and cancelled/lost steering cleanup at existing 1–10; tap walking, palm rejection, generator/accounting and saves retained.
- Tested claim `630eb8a` plus final game/browser diff; integrated docs-only origin `9c610b1` before publication, preserving this proof. Typecheck and all seven Duckling Parade rule tests passed. Browser script syntax, Markdown links and diff checked.
- Passed `GAME_URL=http://localhost:5193 BROWSER_SUITE=arcade ARCADE_ONLY=parade ARCADE_LEVELS=10 PARADE_STEERING=1 npm run test:browser` at 19:54:51 UTC: clamped/fading noninteractive cue; walking after release; cancellation, lost capture, window exit, zero-button stale move, blur/visibility, outside release, unrelated/old finger, fourth-touch palm rejection; portrait and destroy cleanup; level 10 wrong choice/hint, pond, expected [2,1] result/sticker and finish cleanup. No page errors. Portrait screenshot visually reviewed.
- `test-results/parade-steering-probe.mjs` showed off-canvas pointerdown cannot hit Pixi; fixture now starts on canvas then moves outside for clamping. Disabling cancellation made the regression fail at `pointercancel`; restored the identical verified source. `BROWSER_SUITE=fingerdemo FINGER_ONLY=duckling-parade FINGER_LEVELS=10` on the same URL passed cleanly in 17.0 seconds at 19:55:39 UTC.
- Not run: build (local code-drawn/input change), broad suites, other levels, offline, real hardware. Real iPad finger/cancel feel and child understanding remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device). Owned Vite stopped after checks.


## 2026-10-15 — Duckling Parade truthful support

- [PR #389](https://github.com/rjdunlap/neo/pull/389), `codex/duckling-parade-support`, worker `01a140eb-497f-7df2-b83e-64f6f9253a42`, dispatch `duckling-support-20261015T185456Z`: support slice 1 at existing 1–10. Variable-color descriptions, tap/lead how-to, level-10 spare/exclusion speech and combined-total extra-arrival wording; rules/accounting, steering/art, bands/saves retained.
- Tested `9abb803` plus scoped source/browser diff (base `d8d056d`, claim `841323b`): typecheck and 28 focused rule/how-to/support tests passed. Support assertions cover variable palettes, taps across 1–10, exclusion and combined total after a partial delivery. Browser script syntax passed.
- Passed `BROWSER_SUITE=arcade ARCADE_ONLY=parade ARCADE_LEVELS=6 GAME_URL=http://localhost:5192 npm run test:browser` at 19:00:35 UTC: two wrong-color misses/one hint, first delivery of one, second batch with one extra, total-versus-batch speech parameters/text, extra back in meadow, [3,1] saved accounting and one sticker; no page errors.
- Fixture failures were diagnosed by `test-results/parade-support-probe.mjs`: bottom-left pet intercepted the second pickup; random spawn pickups could prefill the line. Final harness restores an uncollected starting fixture and separates eligible/wrong ducks, then uses real taps/arrival rules. Product steering and accounting were not changed. Owned Vite stopped; links/diff checked.
- Not run: build (shared text only, no shared behavior), ghost finger (demonstrated action unchanged), other levels/browser suites, portrait, world/couch/offline. Prior level-10 play/demo evidence retained. Real iPad speech, intended pickup and child understanding remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device).

## 2026-10-15 — Memory Match level-12 clock definition

- Docs only, `codex/memory-clock-definition`, [PR #369](https://github.com/rjdunlap/neo/pull/369), dispatch `memory-clock-definition-20261015T124701Z`. The [Same time packet](../deep-dives/memory-match.md#level-12-definition-same-time) defines readable numbered faces, seeded three-pair selection, exact matches, replay/misses/help, complete ending and future implementation proof. Level 12 remains unbuilt; no bands/order table, couch, saves or other levels changed.
- Inspected current Memory Match plans/input/accounting and Clock Tower hand/speech/mini-face code at `7a02cab` (source `7e4e957` plus claim and coordinator docs). Existing approval applies; unresolved developer decisions and iPad/person checks remain open. No new research/learning claim.
- Ran local Markdown links/anchors and `git diff --check` on that base plus this docs diff; rotated the oldest three live dated entries with links repaired. These prove documentation consistency only.
- Not run: typecheck, units, build, browser/fingerdemo/offline, actual speech/touch or child play (docs-only tier). Next: separately admitted implementation/proof under the packet; this worker stops after publication.

## 2026-10-15 — Peg Garden bloom guaranteed finish

- Uncommitted work on `worktree-bridge-cse_01BPZDVHcagJedLDXgwJSyZx`, `src/games/peg-garden/`: on the bloom level, after `STALL_AT` (2) pearls in a row that wake no new flower, the next tap's pearl is let go over a waiting flower (`dropAt`) instead of the tapped x. No level or band change.
- Ran `npm run typecheck` and `npx vitest run src/games/peg-garden` (5 pass, including "finishes a bloom level even when the same spot is tapped every time", which fails without the nudge).
- Not run: any browser play, `fingerdemo`, a portrait screenshot. No coverage-summary row changed (none covers Peg Garden's rules).

## 2026-10-15 — Letter Trails journal entries

- [PR #363](https://github.com/rjdunlap/neo/pull/363), `claude/letter-trails-journal`. 26 `letter-trails:<LETTER>` journal entries with voice lines and art (`letterPicture`), filed via `RoundResult.discoveries` only for letters whose picture was shown.
- Ran `npm run typecheck`; vitest `src/content`, `src/games/letter-trails`, `src/progress`, `src/ui` (197 pass); `BROWSER_SUITE=letters` passed on a local dev server, with a new assertion that a letter-trails entry is filed in the journal.
- Not run: portrait screenshot of the journal with the 26 new cards, build, device speech, actual iPad or child play.

## 2026-10-15 — Jelly Drums distinct tunes in a round

- [PR #362](https://github.com/rjdunlap/neo/pull/362), `claude/jelly-drums-distinct-tunes`. Echo levels 4–9 never repeat a tune within a round: `makeTune` takes a `played` list and `index.ts` keeps it. Only this part of deep-dive slice 1 is built; the listen-again target, bounded how-to, `TUNES` table and nudge remain ready.
- Ran `npm run typecheck` and `npx vitest run src/games/jelly-drums` (9 pass, including the new distinct-tunes rule test).
- Not run: browser play or `fingerdemo` for Jelly Drums, build, the full unit suite, actual iPad or child play. No coverage-summary row changed (the Jelly Drums row records the level-10 pass).


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

## 2026-10-15 — Chain Reaction trail and watch-again

- Branch `claude/chain-reaction-trail`: after a missed run a faint red path (alpha 0.35) of the marble's last run stays until the next run or machine; tapping the blue start cup (120 by 104 hit area) replays it, changing no misses or hints. Rules unchanged; how-to step updated; the `machines` suite's level 6 now asserts the trail and replay.
- Ran: typecheck; Chain Reaction unit tests (7 pass); `BROWSER_SUITE=machines` (passed); `fingerdemo` with `FINGER_ONLY=chain-reaction` (both levels passed).
- Not run: build, offline check, a device or a child. Open: whether a small hand finds the cup to replay.

## 2026-10-15 — Day by Day count another weather

- [PR #361](https://github.com/rjdunlap/neo/pull/361), `codex/day-by-day-other-weather`, dispatch `day-by-day-other-weather-20261015T104630Z`. Stable 5 records a week, asks two varied relative-day questions, then counts a seeded sunny/cloudy/rainy category with authored totals 0–7. School order [2, 4, 10, 3, 5]; free marks/replays, matching-record/answer glow after two misses. Sunny-only 3 and its RNG stream preserved.
- Tested claim `4a5b94b` plus scoped source/browser diff: typecheck, 55 targeted Day by Day/registry/how-to/difficulty tests and shared-content build passed. Coverage: zero/nonzero totals, seeded categories, unique answers, sunny-only 3, ordering and birthday/pin landing.
- Passed `BROWSER_SUITE=week WEEK_LEVELS=5 GAME_URL=http://localhost:5176 npm run test:browser` at 10:53:19 UTC: real naming/placing/weather/tally taps, retries, 5 misses/2 hints, reversible free marks, saved sticker and interrupted speech exit; no page errors. Reviewed `test-results/browser/day-by-day-5-tally-portrait.png`: seven sunny records/total 7, hint outlines, full-size choices, text and pet clear.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day FINGER_LEVELS=5 GAME_URL=http://localhost:5176 npm run test:browser` at 10:54:17 UTC: school 5 finished cleanly in 45.1 s; seed 7 requests rainy with zero matches. Initial Chromium sandbox startup blocked; isolated outside-sandbox runs passed. Owned Vite stopped; links/diff/browser syntax passed.
- Not run: unchanged level-3 browser play (rule assertions cover it), broad/world/offline suites, actual iPad speech/touch/controller or child play. No persistence/navigation changes; device fit and understanding remain open.

## 2026-10-15 — Animal Snack bites

- [PR #366](https://github.com/rjdunlap/neo/pull/366), `claude/animal-snack-bites`: [deep dive](../deep-dives/animal-snack.md) slice 2. Each snack is eaten in three shrinking bites (`BITE_SIZES` 0.7/0.4/0) with a synthesized sound per food (`BITE` in `logic.ts`, `sfx.bite`), crumb puffs and an animal poke per bite. No rule or level change.
- Ran `npm run typecheck`, `npx vitest run src/games/animal-snack` (9 pass, including a test that every food has a bite sound) and `BROWSER_SUITE=woods WOODS_ONLY=snack` on levels 1-5 (http://localhost:5517, branch commit): passed.
- Not run: `fingerdemo`, a portrait screenshot, full suites. The bite sounds have not been heard on a device ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-15 — Day by Day Weather Window

- [PR #365](https://github.com/rjdunlap/neo/pull/365), `codex/day-by-day-weather-window`, worker `01a13f60-c5dd-7de1-89f2-2c5254f96483`, dispatch `day-by-day-weather-window-20261015T114231Z`. Stable school 6 supplies two full-size week pages, rainy comparison and sunny equality questions, replayable summaries/separate confirm, free page marks and one hint after two misses per question. School order [2, 4, 10, 3, 5, 6]; other modes/bands/persistence unchanged.
- Tested claim `f84c0e5` plus scoped source/browser diff: `npm run typecheck`, `npm test` (1,313 tests, 151 files) and shared-content `npm run build` passed. Rule tests assert seeded immutable valid weeks, unique true summaries, equality including zero, balanced A/B and answer positions, all records inspectable, control layout, ordering/pins and birthday landing.
- Passed `BROWSER_SUITE=week WEEK_LEVELS=6 GAME_URL=http://localhost:5176 npm run test:browser` at 11:52:14 UTC: real taps on all fourteen records/both pages, free replay/reversible marks/summary selection, confirm-only misses, 5 misses/2 bounded hints, two-question finish and one saved sticker, interrupted speech exit, no page errors. Reviewed `test-results/browser/day-by-day-6-window-portrait.png`: full-size targets, question/picture, records, summaries, arrow and pet clear.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day FINGER_LEVELS=6 GAME_URL=http://localhost:5176 npm run test:browser` at 11:53:10 UTC: school 6 finished cleanly in 26.8 seconds, zero misses/hints and no page errors. Owned Vite stopped; browser syntax, local links and diff check passed. Integrated coordinator docs-only `b6cda87`; source proof retained. Broad/world/offline checks not run (no shared navigation/persistence change); no iPad, device speech, real touch or child play. [Device questions](../DEVICE-CHECKS.md#needs-a-person-or-a-device) remain open.

## 2026-10-15 — Opposites level 5 Which two?

- Code, `claude/opposites-which-two`, [PR #370](https://github.com/rjdunlap/neo/pull/370): pre-K `spot` mode (five cards, one opposite pair, three decoys from distinct families, 3 rounds; pre-K window now 3–5). School window and levels 6–10 not built.
- Ran typecheck and the full `npm test` (151 files, 1315 tests pass), including the new spot rules: exactly one pair, three decoys in distinct families, the bot taps the two right cards.
- Ran `BROWSER_SUITE=woods WOODS_ONLY=opp FROM_LEVEL=5` (one wrong pair, glow hint, saved score and sticker; one landscape screenshot) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=opposites FINGER_LEVELS=5` (12.3 s), both pass.
- Not run: portrait screenshot, build, iPad, device speech, child play.

## 2026-10-15 — Sing-Along Barn sixth tune, The Itsy Bitsy Spider

- Code, `claude/sing-along-itsy-bitsy`, [PR #371](https://github.com/rjdunlap/neo/pull/371): tune `itsy` (first line only, "The itsy bitsy spider climbed up the water spout"); six cards in the level 5-6 chooser, scaled 0.5 to fit a 768 upright view; seeded pool of six.
- Ran `npm run typecheck`; vitest sing-along-barn, content and registry (124 pass); `BROWSER_SUITE=singalong` pass including the new itsy round (0 misses, 0 hints); `fingerdemo` for `sing-along-barn` at level 6 passed (35.9 s).
- Not run: portrait screenshot of the six-card chooser (fit is layout math only), build, iPad, device speech and melody against a printed source (added to [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-15 — Memory Match 12 Same time

- [PR #373](https://github.com/rjdunlap/neo/pull/373), `codex/memory-match-same-time`, dispatch `memory-clock-build-20261015T135031Z`. Tested `5c44128` plus scoped source/browser diff: school clock bridge 12, order [8, 12, 9, 10, 11], unchanged old IDs/levels/pins and couch/save behavior.
- Passed typecheck, 16 Memory Match rules plus 47 how-to/registry/difficulty tests, and build (shared voice/how-to changed). Rules cover 24-time reachability, distinct hours, mixed minutes, deterministic decks, exact pair/value/side agreement, labels, continuous hand geometry, ordering and valid saved IDs.
- Passed `GAME_URL=http://localhost:5187 BROWSER_SUITE=memory MEMORY_LEVELS=12 npm run test:browser` at 13:56:59 UTC: real taps, free replay/unseen exploration, exactly two known misses, one stable seen-only hint through unrelated exploration, supported finish/saved sticker and leaving during comparison/speech; no page errors. Actual face/text/card bounds passed in four viewports; portrait/landscape exposed-board and all 24 times reviewed (`test-results/browser/memory-clock-{portrait,landscape,all-times}.png`).
- Passed same URL with `BROWSER_SUITE=fingerdemo FINGER_ONLY=memory-match FINGER_LEVELS=12` at 13:57:28 UTC: 11.0 s, zero misses/hints. Initial Chromium sandbox launch blocked; isolated outside-sandbox run passed. Initial new fit assertion mixed CSS/logical coordinates; small geometry probe confirmed root scale, corrected test then passed without a game layout change.
- Not run: unchanged old-level browser plays, full unit/browser/world/couch/offline suites, real iPad speech/touch or child play. Device legibility/reveal comfort and bridge value remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device); browser evidence establishes no independent clock understanding. Server stopped after checks; links/diff checks passed.

## 2026-10-15 — Clap the Syllables solo wait ring

- [PR #374](https://github.com/rjdunlap/neo/pull/374), `claude/clap-syllables-wait-ring`: in solo (level 2) a ring round the hands pad fills over the 1.5 s pause after her last clap, so she can see when the word is about to be counted. Pure `waitFill` in `logic.ts`, drawn in `index.ts`; no rule change.
- Passed typecheck, `vitest src/games/clap-syllables` (15 tests, including `waitFill`) and `BROWSER_SUITE=clap` on the dev server.
- Not run: a screenshot of the ring, a portrait view, build, `fingerdemo`, an iPad or child check. Whether the ring reads clearly to a small child is [open](../DEVICE-CHECKS.md).

## 2026-10-15 — Bug Builder bigger pool and hint that points

- `claude/bug-builder-pool-hint`: deep-dive slice 1 (rules and a small glow). `BUG_TOKENS` is 12 (indexes 0-5 unchanged); `pickTokens` draws `plan.colors` distinct tokens by seed (plans of 4 or fewer keep all shapes and colors different); `bugPuzzle` returns `tokens`. On the second wrong drop the hint also rings the twin across the line (mirror) or the same place on the model (copy); mirror adds the line `bug.hintMirror`.
- Ran: `npm run typecheck`; `vitest run src/games src/content` 1068 passed (new tests: pool size and distinct, copy not symmetric, mirror exact reflection); `BROWSER_SUITE=expansion EXPANSION_ONLY=bug` levels 1-7 (drag, wrong drop, hint, finish, sticker) on a dev server.
- Not run: a reviewed portrait or hint screenshot, build, `fingerdemo`, a device or a child.
- Open: the one-hint-per-round accounting decision stays as is (hints per spot).

## 2026-10-15 — Clock Tower visible appointments

- [PR #381](https://github.com/rjdunlap/neo/pull/381), `codex/clock-visible-appointments`, dispatch `clock-appointments-20261015T154626Z`. Tested base `6adc865` plus scoped source/browser diff: only existing level 5, three pictured pretend appointments with analog/digital time evidence and separate free replay, four distinct seeded target times, six existing pictures. Other modes/levels/bands/saves and old icon/sticker drawings retained.
- Passed typecheck, 27 focused Clock Tower/how-to tests and build (shared voice/how-to changed). Across 200 seeds: repeatability, three distinct pictures/times, one matching answer, four different targets, all 24 hour/half-hour targets and all six pictures at all times reached, speech/labels from appointment data; icon/sticker snapshots pass.
- Passed `BROWSER_SUITE=woods WOODS_ONLY=clock CLOCK_LEVELS=5` at `http://localhost:5189`: all twelve free replays do not submit/change counts, labels match task evidence, two wrong choices count [2,1], four right choices finish/save one sticker; no page errors. Reviewed `test-results/browser/clock-tower-5-appointments-portrait.png`: all three picture/replay cards legible and clear of pet; baseline landscape play passed.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=clock-tower FINGER_LEVELS=5` at the same URL, clean 12.9 s. Initial sandboxed Chromium launch failed on macOS Mach permission; isolated outside-sandbox runs passed. Owned Vite server stopped. Links/diff checked.
- Not run: other levels' browser plays, full unit/browser/world/couch/offline suites (unchanged areas). Real iPad speech, finger comfort, pretend-plan comprehension and child learning remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device); new appointment art and later slices/decisions are separate.

## 2026-10-15 — Market Stall name the coin

- [PR #378](https://github.com/rjdunlap/neo/pull/378), branch `claude/market-stall-name-coin`: levels 2 and 3 only. The first tap of a coin new at that level (the 2 at level 2, the 5 at level 3) has the pet say "That is a two. It is worth two." in place of the count, and the purse coin pulses; once per game start; not a miss or hint. `coinToName` in `src/games/market-stall/logic.ts`, line `shop.name`.
- Passed `npm run typecheck`; 88 tests in `src/games/market-stall` and `src/content`; `BROWSER_SUITE=woods WOODS_ONLY=shop` levels 1–7 on a dev server.
- Not run: screenshot, `fingerdemo`, build, device speech. Pips and the teaching hint (deep-dive slice 2 remainder) are not built.

## 2026-10-15 — Memory Match fraction squares

- [PR #377](https://github.com/rjdunlap/neo/pull/377), `codex/memory-fraction-squares`, dispatch `memory-fraction-art-20261015T144931Z`. Tested base `c69ed5c` plus the four-file Memory Match source/test diff. Existing level 11 only: seeded rotations and equal-area masks; same three values/pairs, other levels/bands/order, accounting, couch and saves.
- Passed `npm run typecheck` and `npx vitest run src/games/memory-match/logic.test.ts` (16 tests). Across 200 seeds: exact same-whole tiling/area and numerator, pair sides/labels, repeatability, all eight rotations and every legal shaded mask, actual rotated drawing within card bounds. Existing icon/sticker snapshots pass.
- Reviewed one exposed level-11 portrait at `http://localhost:5188` using `node test-results/memory-fraction-art.mjs`; three picture/name pairs readable, rotated square clear of card edges and pet; no page errors. Screenshot `test-results/browser/memory-fraction-11-portrait.png`. Chromium's sandbox launch failed; the isolated outside-sandbox capture passed. Owned Vite server stopped.
- Existing level-11 how-to audited and remains accurate. Not run: browser round, ghost finger, build, broader unit/browser/world/couch/offline suites (content tier, unchanged interaction/shared behavior). Real iPad speech/contrast/touch and child fraction understanding remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device). Links/diff checked.

## 2026-10-15 — Time and change subject research

- [PR #385](https://github.com/rjdunlap/neo/pull/385), `claude/time-change-research`: [study](../deep-dives/subjects/time-change.md), tracker row, notebook rows (Timeline Trail, Island Archive, Attic Finds) and [roadmap packets](../ROADMAP.md#time-and-change-recommendations). Opened C3 D2.His (NCSS PDF pp. 45–48), England KS1–2, Colorado preschool History 1, Busby Grant and Suddendorf (abstract), Tillman (abstract), Barton (abstract), Major Fun's Timeline review, the Unpacking GDC report, Guidepost Montessori and the Pitt Rivers session sheet; Storyteller, toy sorts and StoryCorps from search excerpts only.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs only).
- Not run or open: no reference game played; no study of under-fives learning historical sequence from a game; tween/parent appeal untested; real-object content and page cards need a named reviewer.

## 2026-10-15 — Clock Tower hour-change and fives explanations

- [PR #383](https://github.com/rjdunlap/neo/pull/383), `codex/clock-explanations`, worker `01a14077-2c25-7402-a0cf-36796d3cf1d7`, dispatch `clock-explanations-20261015T164756Z`. Only slice 3 remainder: old/new hour-change explanation at 6; zero/60-minute speech, spoken fives and help arc at 7. Reuses #358’s 3/6 exposure rules; four tasks, modes, target sizes, accounting, bands/pins/saves and icon/stickers retained.
- Passed typecheck and 29 targeted Clock Tower/how-to tests: all 24 hour/half-hour changes including 11→12 and 12→1, unchanged minutes, forward hand endpoints, target-derived count/label/speech and existing seeded exposure/art snapshots. Regression tested `881eddb` plus final scoped source/browser diff. Integrated unrelated Tangram #384 as `d6216f7`; no Clock Tower dependency changed. Build and ghost finger passed on that integrated base plus the same diff.
- Passed `BROWSER_SUITE=woods WOODS_ONLY=clock CLOCK_LEVELS=6,7 GAME_URL=http://localhost:5190 npm run test:browser` at 16:58:47 UTC: free replay, old/new times and forward animation endpoint, zero-labelled rim and target arc, two misses/one hint, four correct tasks and one saved sticker per round; no page errors. Portraits `test-results/browser/clock-tower-{6,7}-explanation-portrait.png` reviewed: overlays/labels readable, bell/hand guide/pet clear.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=clock-tower FINGER_LEVELS=6,7` at the same URL at 17:00:12 UTC: clean 18.4 s / 23.8 s, zero misses/hints and no page errors. Initial regression timeouts were diagnosed by `test-results/clock-explanation-probe.mjs`: animation finished while duplicated feedback speech was still pending; explanations now replace duplicate wrong/success/help lines, without widening the browser wait. Isolated Chromium ran outside the sandbox. Owned Vite stopped; syntax/links/diff checked.
- Not run: unchanged level 3 browser play, broader unit/browser/world/couch/offline suites. No navigation/persistence/assets change. Real iPad speech/touch and child understanding remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device); new levels, appointment art and unresolved decisions excluded.

## 2026-10-15 — Tangram Town shovel picture

- [PR #384](https://github.com/rjdunlap/neo/pull/384), `codex/tangram-shovel-picture`. Tested base `1fc7729`, claim `cdfc7cd` and scoped source diff: a rectangle handle/trapezoid blade picture in existing levels 1–3 (pools 5/7/8; twenty-two pictures total). Other pools, rules, bands, saves and help unchanged; existing how-to remains accurate.
- Passed `npm run typecheck` and `npx vitest run src/games/tangram-town/logic.test.ts` (13 tests): every pooled picture's bounds/no overlap, seeded trays, useful hints and ghost-finger solution rules.
- Passed `node test-results/tangram-shovel.mjs` at `http://localhost:5191`, forcing shovel in an isolated runtime level-3 pool: real taps, quarter turns and drags finish with zero misses/hints, one saved sticker and no page errors. Portrait `test-results/browser/tangram-shovel-portrait.png` reviewed: connected handle/blade reads as shovel, controls and pet clear.
- Initial Chromium sandbox startup denied; elevated isolated run passed. Initial probe released before the existing 0.45 s piece-return completed (one miss); 550 ms waits passed without a product fix. Owned Vite server stopped; links/diff checked.
- Not run: build, full suites or `fingerdemo` (content-only tier). Real iPad touch/speech, picture recognition and child play remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device).

## 2026-10-15 — Duckling Parade deep dive

- [PR #387](https://github.com/rjdunlap/neo/pull/387), `codex/duckling-parade-deep-dive`, dispatch `duckling-dive-20261015T175326Z`: audited existing 1–10, five band windows, generation/accounting, speech/how-to, ghost finger and no couch entry; corrected stale tracker ceiling.
- [Write-up](../deep-dives/duckling-parade.md) compares six precedents and learning references, defines presentation and bounded ready/gated slices. Meerca evidence is first-party search excerpts (open returned 403); other reference pages/PDF opened. None played.
- Ran Markdown links/anchors and `git diff --check`; docs only. No tests, build or browser suites run. Existing recorded level-10 evidence retained, not rerun.
- Open: real-iPad speech/control/color and child reaction; count aid/accounting, proposed continuation/mapping/authoring and lap-entry decisions. No implementation or developer decision resolved.

## 2026-10-15 — Discovery direct-next definition

- [PR #395](https://github.com/rjdunlap/neo/pull/395), `codex/discovery-d1a`: froze the [D1b packet](../DISCOVERY.md#d1b-build-packet-one-direct-next-game); audited result/layout, route/origin, completion-based suggestions, player-memory reset and all three module band ladders against `cbf6391`. Integrated docs-only coordinator dispatch `0eed4f5`.
- Specified pictured controls in both orientations, eligibility/selection memory, current band/pin/ordered level and return rules, empty/stale recovery, files and exact future proof. Roadmap now selects D1b; queue preserves dispatch and worker identity.
- Ran `node scripts/check-links.mjs` and `git diff --check`; docs only. No runtime files changed.
- Not run: typecheck, tests, build, browser/world/offline or screenshots. Future regression rows are requirements, not passing evidence; iPad speech/reach and child understanding remain open.

## 2026-10-15 — Inventions subject research

- [PR #392](https://github.com/rjdunlap/neo/pull/392), `claude/inventions-research`: [study](../deep-dives/subjects/inventions.md), tracker row, notebook Gadget Bench and Workshop Cases rows and [roadmap packets](../ROADMAP.md#inventions-recommendations). Opened NGSS ETS1 (K-2, 3-5, MS), England D&T KS1–3 and history KS1, Beck et al. 2014 (*Frontiers*, full text), the Smithsonian's Wright brothers testing page, Inventioneers, and the Gizmos & Gadgets and Bad Piggies articles; Beck 2011, German and Defeyter, Spark!Lab, the Cardboard Challenge and printing history from search excerpts only. C3 cited from the time-change session, not reopened.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs only).
- Not run or open: no reference game played; EiE, Spark!Lab and Exploratorium pages failed to open; tween/parent appeal untested; real-invention content and page cards need a named reviewer.

## 2026-10-15 — Lands stage C1b group 3, three games switch live

- Code, `claude/lands-c1b-group-3`, [PR #396](https://github.com/rjdunlap/neo/pull/396) (7c828b7 on 9e7e35e): `bouncy-launch`, `ferry-jam` and `penguin-slide` are `liveController`; `touchReturned()` restores touch (spring up, undo buttons back, a key-held boat put back); a squashed spring no longer counts toward the "bigger pull" journal entry. `livekeys` now covers eleven games and takes `LIVE_ONLY`.
- Ran `npm run typecheck`, `npm test` (152 files, 1330 tests) and `npm run build`, all passing.
- Ran `BROWSER_SUITE=livekeys LIVE_ONLY=bouncy-launch,ferry-jam,penguin-slide` (GAME_URL=http://localhost:5657): bouncy-launch L3, ferry-jam L3, penguin-slide L2 each touch, keys, touch, keys, touch, passing. Removing Ferry Jam's put-back made it fail ("ferry-jam puts a key-held boat back at a finger"); restored.
- Not run: the other eight livekeys games (code unchanged), world, offline, couch/couchgames (couch path unchanged: `ctx.couch` keeps the controller layout), a real pad or iPad.
