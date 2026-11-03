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
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#drift-cards-levels-13-oceans-slice-6-2026-10-31-level-3-built-2026-11-02)): detective work versus trial and error, reading arrows cell by cell, "South-west" in iPad speech.

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
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#rule-machine-levels-14-algebra-balance-ab1-2026-11-01-and-2026-11-02)): fairness of the covered machine and "two cards still fit", card pictures and Peek on an iPad, the wording check.

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
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#thought-bubbles-literature-meaning-study-2026-10-31-levels-13-built-2026-11-02)): the four person and device checks there.

## 2026-11-02 — Maker Lane levels 1–3 (food-fiber-systems FS1)

- [PR #1123](https://github.com/rjdunlap/neo/pull/1123): new game `maker-lane` (Cozy Village; toddler 1, preschool 1–2, pre-K 2–3, school 2–3); sheep and hen art moved to `src/art/animals.ts`. Tested commit `52a6bbd5` on base `3b1d19b2`, `GAME_URL` http://localhost:5952.
- Ran: `npm run typecheck`; full `npx vitest run` before the review fixes (all passed except the voice-clip and how-to wording tests, both then fixed), then maker-lane and `src/content` (194 tests, 26 new rule tests) after the fixes; River Tablets and Keep House unit tests (109) after the art move; `npm run build`.
- Browser: `BROWSER_SUITE=makerlane` (toddler level 1 free tap on a maker who is not waving, then the waving makers 0/0; portrait preschool level 2 two refused makers, bubbles, glow, then the right makers 2/1; pre-K level 3 sheep for the sock with replay, dimmed card and the scarf beside the sock, then the cotton plant 1/0), re-run after the review fixes; `fingerdemo` `FINGER_ONLY=maker-lane FINGER_LEVELS=2,3` (21.6 s and 17.6 s, before the review fixes, which did not change the bot).
- Not run: offline check (no persistence or navigation change); no iPad or device speech check; FS3 (the grown-ups' card) not built.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#maker-lane-food-fiber-systems-study-2026-10-31-levels-13-built-2026-11-02)): whether a four-year-old picks the sheep for the sock and the replay changes her next pick, whether the thought bubble tells her which maker comes next, and the agricultural-literacy or textile review of the makers' pictures and lines.

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
