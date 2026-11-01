# Verification 2026-10-31 (archived entries)

## 2026-10-31 — Water Road 4–5 definition (AM3, docs only)

- [PR #1035](https://github.com/rjdunlap/neo/pull/1035), branch `claude/define-water-road-4-5`: [definition](../definitions/water-road.md#levels-45-am3-downhill-all-the-way-over-the-valley) (level 4 Downhill all the way, level 5 Over the valley; pre-K range 2–4, school 3–5), a batch plan in [GAME-BATCHES](../GAME-BATCHES.md#water-road-2-downhill-all-the-way-and-over-the-valley); READY, backlog, roadmap, ideas, packet and study point to it. Nothing built, no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the building session's source check of the aqueduct lines; the build runs the new-interaction tier.

## 2026-10-31 — Spinner Fair 1–5 definition (CS1, docs only)

- [PR #1036](https://github.com/rjdunlap/neo/pull/1036), branch `claude/define-spinner-fair`: [definition](../definitions/spinner-fair.md) (levels 1–5 of a new game; preschool 1–2, pre-K 2–3, school 3–5; Counting Cove becoming 14 games), two batch plans in [GAME-BATCHES](../GAME-BATCHES.md#spinner-fair-1-spin-see-and-pick), READY, backlog, roadmap and study updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the builds run the new-game tier (batch 1) and the new-interaction tier (batch 2); device checks (spinner tapping, "still the better chance", sure/maybe/no way faces, wedge grab size, critter speech) stay open at the build.

## 2026-10-31 — Keep House levels 5–6 (medieval life ML3)

- [PR #1038](https://github.com/rjdunlap/neo/pull/1038), branch `claude/keep-house-5-6`, code at `c7bc3cac` (tested at its parent plus a no-op deletion): level 5 Read the ruin and level 6 Stone or timber (school 4–6), from the [definition](../definitions/keep-house.md#levels-56-ml3-read-the-ruin-stone-or-timber).
- Ran: `npm run typecheck`; keep-house rule tests 36 passed; full `npm test` 3,791 passed with 2 failures that pass in isolation (the fluffy-salon frame-rate test and the unchanged keep-house level-4 hint search, both timeouts under full-suite load); `npm run build`.
- Ran: `BROWSER_SUITE=keephouse KEEPHOUSE_FROM=5` on `http://localhost:5929`: level 5 a look, one label wrong twice (2/1, glow followed), second ruin clean, saved 2/1; level 6 other build kept twice (0/1), fitting build, saved 0/1; portrait screenshots of each. `BROWSER_SUITE=fingerdemo FINGER_ONLY=keep-house FINGER_LEVELS=5,6` passed.
- Not run: levels 1–4 browser play (unchanged), offline check. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md#keep-house-levels-56-ml3-2026-10-30): clues read or elimination, the shared hearth noticed, the years followed, device speech, the unchecked history lines.

## 2026-10-31 — Rule Machine 1–4 definition (AB1, docs only)

- [PR #1039](https://github.com/rjdunlap/neo/pull/1039), branch `claude/define-rule-machine`: [definition](../definitions/rule-machine.md) (levels 1–4 of a new game; pre-K 1, school 2–4; Puzzle Peaks becoming 14 games), two batch plans in [GAME-BATCHES](../GAME-BATCHES.md#rule-machine-1-the-hat-machine-and-one-more-goes-in), READY, backlog, roadmap, ideas and study updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the builds run the new-game tier (batch 1) and the new-interaction tier (batch 2); device checks (pre-K reading of the three pictures, whether the free first guess feels like a game, five cars and a table on an iPad portrait, "twice as many" as rows of counters, device speech for "take one away") stay open at the build.

## 2026-10-31 — Tide Line 1–4 definition (oceans study slice 1, docs only)

- [PR #1042](https://github.com/rjdunlap/neo/pull/1042), branch `claude/define-tide-line`: [definition](../definitions/tide-line.md) (levels 1–4 of a new game; lap 1, toddler 1–2, preschool 2–3, pre-K 3–4; Bubble Beach becoming 13 games), two batch plans in [GAME-BATCHES](../GAME-BATCHES.md#tide-line-1-come-in-go-out-and-stop-at-the-line), READY, backlog, roadmap, ideas, study and packet updated; S1 source check done in the definition.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the builds run the new-game tier (batch 1) and the new-interaction tier (batch 2); device checks (a lap child pulling the wave, a toddler placing a pail, the seaweed line in sunlight, pre-K telling the in-between picture from high and low, device speech for "anemone") stay open at the build.

## 2026-10-31 — Water Road levels 4–5 (ancient-mediterranean AM3)

- [PR #1043](https://github.com/rjdunlap/neo/pull/1043), branch `claude/water-road-4-5`, tested commit `bb7a2e2d` on base `8551cbeb`: levels 4 and 5 (prek 2–4, school 3–5), batch water-road 2 ([build note](COMPLETED-2026-10-09.md#water-road-levels-45-greece-and-rome-am3-2026-10-31)).
- Ran: `npm run typecheck`; `npm test` 3828 passed in 283 files (24 new `water.test.ts` rule tests); `npm run build`. Browser, `GAME_URL=http://localhost:5820`: `BROWSER_SUITE=waterflow` passed (pre-K level 4 1/0, school level 4 2/1, level 5 1/1, a four-span valley portrait screenshot); `fingerdemo` `FINGER_ONLY=water-road FINGER_LEVELS=4,5 FINGER_BAND=school` clean (9.7 s, 19.7 s) and `FINGER_LEVELS=4 FINGER_BAND=prek` clean (6.6 s).
- Review: game-reviewer found no defects; two polish items fixed.
- Not run: the offline check (no persistence or asset change), the `waterroad` suite for levels 1–3 (code unchanged), an iPad, device speech, a child. Open: the [device checks](../DEVICE-CHECKS.md#water-road-levels-45-am3-2026-10-31).

## 2026-10-31 — River Tablets levels 4–5 (ancient river civilizations AR3, first part)

- [PR #1044](https://github.com/rjdunlap/neo/pull/1044), branch `claude/river-tablets-4-5`, tested at `25b661dc`: level 4 *A ten is a different mark* and level 5 *Check the delivery* (school 3–5), from the [definition](../definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree). The history line shipped as the softer fallback (no museum or KS2 source was reachable: BBC Bitesize unreachable, the Met essay 429).
- Ran: `npm run typecheck`; river-tablets rule tests 54 passed (19 new); full `npm test` 282 files / 3,826 tests at `8292e2a3` (river-tablets and content tests 209 after the fix commit); `npm run build` at `8292e2a3`.
- Ran: `BROWSER_SUITE=rivertablets FROM_LEVEL=4` on `http://localhost:5908`: level 4 yard count, a crate opened then a wrong Hand in, a second wrong (glow, one hint), the glow followed to a match, the second cart written the long way and accepted, saved 2/1; level 5 one wrong number then right answers, 1/0; portrait screenshots of both. `BROWSER_SUITE=fingerdemo FINGER_ONLY=river-tablets FINGER_LEVELS=4,5` passed (level 4 24.1 s after the fix, level 5 7.9 s).
- `game-reviewer` found a crate open/close rebuild that could strand a commit, the ghost finger's strip spot and Help during a finished cart; all fixed. Not run: restoring the old crate code to watch the check fail, levels 1–3 browser replay (unchanged), the offline check.
- Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md#river-tablets-levels-46-ar3-2026-10-30): a ten read as a crate or pressed as ten small marks, the three verdict pictures without their names, device speech for counts to 32.

## 2026-10-31 — Attic Finds levels 5–6 (Same job and right for the job, H4)

- [PR #1045](https://github.com/rjdunlap/neo/pull/1045), branch `claude/attic-finds-5-6`, tested at `c862d756` on base `fdf4cfa3`: level 5 *Same job* (pre-K, school) and level 6 *Right for the job* (school) from the [definition](../definitions/same-job.md): free tries, a three-slot cart, Check (failing thing one miss, left-out thing not a miss, hint once per job).
- Ran: `npm run typecheck`; full `npm test` 283 files / 3,863 tests (attic-finds rule tests 41, new block: rule purity, sets, context, all 8 subsets per job for Check, 500 seeds per level, hints once per job, bands, layout at four views); `npm run build`.
- Ran: `BROWSER_SUITE=atticjobs` on `http://localhost:5976`: level 5 free failing try, failing Check (one miss), partial Check (one more), done; level 6 requested hint on water counted once; portrait screenshot. `fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=5,6 FINGER_BAND=school` clean (30.2 s, 38.2 s).
- `game-reviewer` findings fixed (relayout deferred until animations end, Start again cancels old animations, pointer guards, try no longer blocks input during speech). Not run: a browser probe of resize or Start again mid-animation (code review only), pre-K level 5 browser play (same screen), offline check.
- Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): the hoop's missing floor read before or after trying, "every one" understood or needs one-more, the water drip at iPad size, device speech of the 27 new lines.

## 2026-10-31 — Patchwork Conservatory definition (genetics G7, docs only)

- [PR #1046](https://github.com/rjdunlap/neo/pull/1046), branch `claude/define-patchwork-conservatory`: [definition](../definitions/patchwork-conservatory.md) (Sprout Shuffle levels 7–8, two-locus guarantee brief), two batch plans in [GAME-BATCHES](../GAME-BATCHES.md#sprout-shuffle-1-which-pairs-always-make-spotted) (Hidden Sprouts level 4 and Patchwork 7–8).
- Ran: `node scripts/check-links.mjs` and `git diff --check`; source check against OpenStax Biology 2e 12.3 (opened 2026-10-31).
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the builds (new-levels tier for level 4, new-interaction tier for 7–8, after level 6); the device and person checks listed in the definition (tile marks by ear and eye, "always" across two lenses, the trap as discovery).

## 2026-10-31 — Second Chance Shed 5–6 definition (nature-sustainability N3, docs only)

- [PR #1047](https://github.com/rjdunlap/neo/pull/1047), branch `claude/define-second-chance-shed-5-6`: [definition](../definitions/second-chance-shed-5-6.md) (a friend's request, whole-plan check with the cart bell, the greedy-fails case at level 6), batch plan [second-chance-shed 2](../GAME-BATCHES.md#second-chance-shed-2-someone-needs-it); Beach Day Pack-up weighed and kept as a proposed picnic set for levels 2–4.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-interaction tier) with its source check of the item fits; the person and device checks listed in the definition's check tier.

## 2026-10-31 — Second Chance Shed levels 5–6 (nature-sustainability N3)

- [PR #1057](https://github.com/rjdunlap/neo/pull/1057), branch `claude/second-chance-shed-5-6`: the laid-out cart, friends' requests and the bell for school levels 5–6 (`plan.ts`, `logic.ts`, art, voice, how-to card); batch second-chance-shed 2.
- Ran (tested at the branch tip, Vite dev on http://localhost:5335): typecheck; `npm test` 3884 passed before the last small edits, then 234 content/shed/registry tests after them (57 shed rule tests: 500-seed level 5/6 rounds, unique level-6 pairing, greedy failing with pencils first in at least half per case, help leads somewhere from random plans, layout at five views); `BROWSER_SUITE=shedplan` (level 5 free ring, tin in Remake 1 miss, unchanged ring free, tin to the friend, saved 1/0; level 6 tempting plan, tin on the wrong friend, 2 misses and glow, Show a hint then Show me one, saved 2/2; portrait screenshot); `fingerdemo` `FINGER_ONLY=second-chance-shed FINGER_LEVELS=5,6 FINGER_BAND=school` (27.8 s, 25.7 s); `npm run build`. The first shedplan run caught a buried-thing grab (the script now puts the tin in Remake last).
- Source check (the definition's gate): tin reused whole for pencils is consistent with [EPA Reducing and Reusing Basics](https://www.epa.gov/recycle/reducing-and-reusing-basics); tin and steel cans are a standard accepted metal in [EPA's standardized terms](https://19january2025snapshot.epa.gov/circulareconomy/standardized-terms-materials-accepted-municipal-recycling-programs), so Remake taking the tin holds on "our island"; a seedling needs a pot with a drainage hole per [Mississippi State University Extension](https://extension.msstate.edu/blog/so-why-do-plant-containers-have-drain-holes); box as a bed and the cloth bag fitting nothing are picture-reading choices with no factual claim.
- Not run: other suites, the offline check. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#second-chance-shed-levels-56-nature-sustainability-n3-2026-10-31)): bubble reading, tin to a friend versus Remake, fairness of the tempting plan, device speech, buried things on an iPad.

## 2026-10-31 — Drop's Journey 1–3 definition (weather-water slice 8, docs only)

- [PR #1048](https://github.com/rjdunlap/neo/pull/1048), branch `claude/define-drops-journey`: [definition](../definitions/drops-journey.md) (a new game, levels 1–3; preschool 1, pre-K 1–2, school 2–3; Tinker Lab, fallback Bubble Beach; five places, lawful moves by driver, one uphill can't-go card at level 3), batch plan [drops-journey 1](../GAME-BATCHES.md#drops-journey-1-where-can-the-drop-go-send-it-to-the-snow-and-can-it-go-there), READY, backlog, study, packet, ideas and oceans study updated; Drift Cards now eligible.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier) with its S1 source check of every speech line; device and person checks in the definition's check tier (a four-year-old following the dotted drop, iPad speech for "vapour", a school-age child explaining why a can't-go card is wrong).

## 2026-10-31 — Forecast Detective 1–2 definition (weather-water slice 9, docs only)

- [PR #1049](https://github.com/rjdunlap/neo/pull/1049), branch `claude/define-forecast-detective`: [definition](../definitions/forecast-detective.md) (a new game, levels 1–2; school 1–2; Tinker Lab, fallback Cozy Village; a pretend valley's wind rule, possible weathers after every clue, *Can't tell yet*), batch plan [forecast-detective 1](../GAME-BATCHES.md#forecast-detective-1-which-way-is-the-wind-and-a-postcard-didnt-come), READY, backlog, study, packet and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Sources opened and listed in the definition: NOAA JetStream air masses and weather models, NSIDC snow.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier) with its S1 source check of every speech line; person and device checks in the definition's check tier (a school-age child opening clues on purpose, whether *Can't tell yet* feels like a win, iPad speech for "Lighthouse Isle", tween and parent appeal).

## 2026-10-31 — Drift Cards 1–3 definition (oceans slice 6, docs only)

- [PR #1050](https://github.com/rjdunlap/neo/pull/1050), branch `claude/define-drift-cards`: [definition](../definitions/drift-cards.md) (a new game, levels 1–3; school 1–3; Bubble Beach, fallback Tinker Lab; a pretend current map, predict the landing, choose the boat, find the fogged current from returned cards; wooden cards not bottles, 1992 spill counts unused), batch plans [drift-cards 1](../GAME-BATCHES.md#drift-cards-1-where-will-it-wash-up-and-send-it-to-a-friend) and [2](../GAME-BATCHES.md#drift-cards-2-find-the-hidden-current), READY, backlog, study, packet and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Sources opened and listed in the definition, including NatureBridge's 2015 Elwha drift-card study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the builds (new-game then new-interaction tier) with their S1 source check of every speech line; person and device checks in the definition's check tier (reading arrows cell by cell, the two-cell trace, level 3 as detective work, iPad speech for "South-west").

## 2026-10-31 — Philosophy and reasoning subject research (docs only)

- [PR #1051](https://github.com/rjdunlap/neo/pull/1051), branch `claude/research-philosophy-reasoning`: [study](../deep-dives/subjects/philosophy-reasoning.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#philosophy-and-reasoning-recommendations) (a new game, Not Always: claims about picture cards on screen, tap the card that breaks the claim, *Every one!* stamp, mended claim; a question card and a co-play role follow), tracker, backlog, READY, ideas and roadmap updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the PR1 definition, the build's source check, and the person check (does a four-year-old listen to the claim or tap the odd one out; does a grown-up use the question card beyond one exchange).

## 2026-10-31 — Not Always 1–3 definition (philosophy-reasoning PR1, docs only)

- [PR #1052](https://github.com/rjdunlap/neo/pull/1052), branch `claude/define-not-always`: [definition](../definitions/not-always.md) (a new game, levels 1–3; pre-K 1–2, school 1–3; Story Grove, fallback Puzzle Peaks; claims about picture cards on screen, tap the breaker, *Every one!* stamp, mended claim), batch plan [not-always 1](../GAME-BATCHES.md#not-always-1-not-all-of-them-every-one-and-say-it-better), READY, backlog, study, packet and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier); person and device checks in the definition's check tier (breaker from the claim versus the odd one out, sign pictograms without words, wing clarity on an iPad).

## 2026-10-31 — Media literacy subject research (docs only)

- [PR #1053](https://github.com/rjdunlap/neo/pull/1053), branch `claude/research-media-literacy`: [study](../deep-dives/subjects/media-literacy.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#media-literacy-recommendations) (a new game, Notice Board: match the stamp to the maker, tap the friend who saw it, to tell or to sell; a "Who made this?" card and a hand-frame co-play role follow; two Photo Safari modes handed to its dive), tracker, backlog, READY, ideas, roadmap and device checks updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Sources: NAMLE, RI.K, RI.4 and ISTE opened; the rest from search summaries or recall, marked in the study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the ML1 definition and three [person checks](../DEVICE-CHECKS.md#notice-board-media-literacy-study-2026-10-31-proposed-nothing-built).

## 2026-10-31 — Strategy games subject research (docs only)

- [PR #1055](https://github.com/rjdunlap/neo/pull/1055), branch `claude/research-strategy-games`: [study](../deep-dives/subjects/strategy-games.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#strategy-games-recommendations) (a new game, Shell Rows: one-move puzzles on a 3 by 3 sand grid with a show-me-why replay; a table-games card, forks and a whole match, then Last Pebble follow; Seed Bowls held for a cultural-source review), tracker, backlog, READY, ideas, roadmap and device checks updated.
- Ran: `git fetch origin --prune`, `scripts/overlap.sh strategy-games` (no claim), `node scripts/check-links.mjs` and `git diff --check`. Sources: MP1, MP7, NRICH *Got It* notes and the Oware article opened; the rest from search summaries or recall, marked in the study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the SG1 definition and three [person checks](../DEVICE-CHECKS.md#shell-rows-strategy-games-study-2026-10-31-proposed-nothing-built).

## 2026-10-31 — Spinner Fair levels 1–3 (chance-statistics CS1)

- [PR #1058](https://github.com/rjdunlap/neo/pull/1058), branch `claude/spinner-fair-levels-1-3`: new game `spinner-fair` in Counting Cove (14 games), levels 1–3; batch spinner-fair 1.
- Ran (tested at e3ebcbba, Vite dev on http://localhost:5347): typecheck; full `npx vitest run` 3903 tests, the one failure (voice-clip manifest) fixed by rendering the title clip, rerun of clips, content and registry 181/181, spinner-fair rule tests 19/19, lands test passing with 14 games; `BROWSER_SUITE=spinnerfair` PASS (level 1 to its sticker 0/0; portrait level 3 with two wrong picks, 2 misses, 1 hint and the glow, ten spins, second pick, saved 2/1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=spinner-fair FINGER_LEVELS=3` PASS (44.2 s, pre-K); `npm run build`; portrait glow screenshot (test-results/browser/spinnerfair/); the portrait bars screenshot was taken on the earlier commit with the same layout. game-reviewer: no blocking bugs (the touch-down jiggle during a spin fixed; the repeated idle spin kept as defined).
- Source check: "chance" and "a better chance" consistent with [CCSS 7.SP.C.5](https://www.thecorestandards.org/Math/Content/7/SP/C/5/) and [Illustrative Mathematics](https://tasks.illustrativemathematics.org/content-standards/7/SP/C/5) (unlikely / neither / likely); "fair", "sure", "maybe", "no way" stay with batch 2; England's Year 2 vocabulary not checked (no probability in Key Stage 1).
- Not run: the landscape screenshot, level 2 in the browser (rules unit-tested), `fingerdemo` at levels 1–2, the offline check. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#spinner-fair-levels-13-chance-statistics-cs1-2026-10-31)): preschool six-spin reading, pre-K "still the better chance", device speech; the toddler check stays open.

## 2026-10-31 — Tide Line levels 1–2 (oceans slice 1)

- [PR #1059](https://github.com/rjdunlap/neo/pull/1059), branch `claude/tide-line-1-2`: new game `tide-line` in Bubble Beach (13 games), levels 1–2 and the shared `src/art/shore.ts`; batch tide-line 1.
- Ran (tested at b63fee70 on base e025bcae, Vite dev on http://localhost:5330): typecheck; full `npm test` 285 files / 3,938 tests (the clip test failed until the title clip was rendered with `scripts/voice-clips/render.mjs`); 35 rule tests (500 seeds where seeded, layout at four views); `npm run build`; `BROWSER_SUITE=tideline` PASS, rerun after the review fixes (level 1 by two pulls 0/0; level 2 two floats then the glow, a dry pail in portrait and a second dry pail, saved 2 misses/1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=tide-line FINGER_LEVELS=1,2` PASS (level 1 lap 8.2 s, level 2 toddler 14.1 s; before the review fixes, which did not touch the bot's targets); one portrait screenshot of level 2 with the glow and one landscape probe of level 1. game-reviewer: nothing serious, four small fixes applied.
- Not run: offline check (no persistence change). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#tide-line-levels-12-oceans-study-slice-1-2026-10-31)): a one-year-old pulling or tapping the wave, a toddler holding a pail, the seaweed line in sunlight on an iPad, device speech for "anemone".

## 2026-10-31 — Number structure subject research (docs only)

- [PR #1060](https://github.com/rjdunlap/neo/pull/1060), branch `claude/research-number-structure`: [study](../deep-dives/subjects/number-structure.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#number-structure-recommendations) (Orchard Rows 4–6: equal rows with the leftover in the basket, every way to plant a number, the basket that only makes one row; a grouping card, Lunch boxes and Two frogs follow; hundreds and decimals stay sketches), tracker, backlog, READY, ideas, roadmap and device checks updated.
- Ran: `git fetch origin --prune`, a search of pull requests and remote branches for the subject (no claim), `node scripts/check-links.mjs` and `git diff --check`. Sources: CCSS 3.OA, 4.OA, 6.NS, 2.NBT, 5.NBT, NRICH *Factors and Multiples Game* notes and the Melbourne decimals table opened; the rest from search summaries or recall, marked in the study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the NS1 definition and three [person checks](../DEVICE-CHECKS.md#orchard-rows-46-number-structure-study-2026-10-31-proposed-nothing-built).

## 2026-10-31 — Notice Board 1–3 definition (media-literacy ML1, docs only)

- [PR #1061](https://github.com/rjdunlap/neo/pull/1061), branch `claude/define-notice-board`: [definition](../definitions/notice-board.md) (a new game, levels 1–3; pre-K 1–2, school 1–3; Cozy Village, fallback Tinker Lab; match the stamp to the maker, tap the friend who saw it, to tell or to sell), batch plan [notice-board 1](../GAME-BATCHES.md#notice-board-1-who-made-it-who-saw-it-to-tell-or-to-sell), READY, backlog, study and packet updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier); person and device checks in the definition's check tier (witness from the memory picture versus the friend nearest the poster, basket by price versus maker's words, badge and place pictures at bubble size on an iPad).

## 2026-10-31 — Shell Rows 1–3 definition (strategy-games SG1, docs only)

- [PR #1062](https://github.com/rjdunlap/neo/pull/1062), branch `claude/define-shell-rows`: [definition](../definitions/shell-rows.md) (a new game, levels 1–3; pre-K 1–2, school 1–3; Puzzle Peaks, paging; finish the row, stop the row, win first, with a show-me-why replay), batch plan [shell-rows 1](../GAME-BATCHES.md#shell-rows-1-finish-the-row-stop-the-row-win-first), READY, backlog, study and packet updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`; a throwaway enumeration script counted the pool classes (39, 69 and 81 for levels 1–3).
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier); the study's person checks (does a five-year-old look at the pet's pebbles at level 2, does the replay read as a lesson, device speech for "three in a row").

## 2026-10-31 — Orchard Rows 4–6 definition (number-structure NS1, docs only)

- [PR #1063](https://github.com/rjdunlap/neo/pull/1063), branch `claude/define-orchard-rows-4-6`: [definition](../definitions/orchard-rows.md) (levels 4–6 on the built game; school; equal rows, every way, only one long row; the study's ladder changed at four points), batch plan [orchard-rows 1](../GAME-BATCHES.md#orchard-rows-1-equal-rows-every-way-only-one-long-row), READY, backlog, study, packet and roadmap updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-interaction tier); the study's four person checks (leftover saplings used or arrows pressed at random, "every way" as collection or test, "one long row" without the word *prime*, deal lines in device speech), opened at the build.

## 2026-10-31 — Literature and meaning subject research (docs only)

- [PR #1064](https://github.com/rjdunlap/neo/pull/1064), branch `claude/research-literature-meaning`: [study](../deep-dives/subjects/literature-meaning.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#literature-and-meaning-recommendations) (Thought Bubbles 1–3: what she wants, where he will look, how we know; a story-talk card, two-bubble stories and Who is telling? follow; folktale versions wait for a reviewer), tracker, backlog, READY, ideas, roadmap and device checks updated.
- Ran: `git fetch origin --prune`, `scripts/overlap.sh` (no claim), `node scripts/check-links.mjs` and `git diff --check`. Sources: CCSS RL.K, RL.2, RL.3, RL.6 and the Kendeou et al. 2008 abstract opened; the rest from search summaries or recall, marked in the study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the LM1 definition and three [person checks](../DEVICE-CHECKS.md#thought-bubbles-literature-meaning-study-2026-10-31-proposed-nothing-built).

## 2026-10-31 — Thought Bubbles 1–3 definition (literature-meaning LM1, docs only)

- [PR #1065](https://github.com/rjdunlap/neo/pull/1065), branch `claude/define-thought-bubbles`: [definition](../definitions/thought-bubbles.md) (a new game, levels 1–3; pre-K 1–2, school 1–3; Story Grove, paging; what she wants, where he will look, how we know), batch plan [thought-bubbles 1](../GAME-BATCHES.md#thought-bubbles-1-what-does-she-want-where-will-he-look-how-do-we-know), READY, backlog, study, packet and roadmap updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier); the four person and device checks in the definition (the bubble read as "what he thinks", the window story fair after the away story, *show me how you know* as treasure or test, the reach at iPad size).

## 2026-10-31 — Drop's Journey levels 1–3 (weather-water slice 8)

- [PR #1066](https://github.com/rjdunlap/neo/pull/1066), branch `claude/drops-journey-1-3`: new game `drops-journey` in Tinker Lab (21 games), levels 1–3; batch drops-journey 1.
- Ran (tested at 5226669e on base e09b6cf8, Vite dev on http://localhost:5818): typecheck; full `npm test` 286 files / 3,970 tests; 32 rule tests (300-seed offered-card enumeration, shortest-route hint, layout at four views and 2–5 cards); `npm run build`; `BROWSER_SUITE=dropsjourney` PASS, rerun after a review fix (level 1 three stops with a mid-move tap ignored 0/0; level 2 in portrait sea to cloud to snow with the vapour screenshot 0/0; level 3 two can't-go cards, glow, requested hint, four moves, 2 misses/1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=drops-journey FINGER_LEVELS=1,3` PASS (7.0 s, 9.2 s). game-reviewer: two minor speech-cut findings fixed (a stop's line finishes before the postcard, request or leaf line).
- Source check (S1): [USGS water cycle for schools, advanced](https://water.usgs.gov/edu/watercycle-kids-adv.html) supports the sun driving evaporation (about 90% from oceans), sublimation straight to vapour, snowmelt, rain soaking in as groundwater, groundwater flowing into rivers, snow when cold, oceans, ice and ground as large stores, and invisible vapour condensing; it does not call groundwater discharge slow (so "slowly" was dropped) and gives no residence times. [USGS condensation](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle) supports vapour usually invisible, rising air cooling into cloud droplets, and droplets growing and falling as precipitation. Every shipped line is supported.
- Not run: the offline check (no persistence change). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#drops-journey-levels-13-weather-water-slice-8-2026-10-31)): a four-year-old reading the dotted drop, iPad speech for "vapour", a school-age child explaining a can't-go card.

## 2026-10-31 — Forecast Detective levels 1–2 (weather-water slice 9)

- [PR #1069](https://github.com/rjdunlap/neo/pull/1069), branch `claude/forecast-detective-1-2`: new game `forecast-detective` in Tinker Lab (22 games), school levels 1–2; batch forecast-detective 1.
- Ran (play tested at 05e4b374 on base f7dbc7fc, Vite dev on http://localhost:5888): typecheck; full unit run before the final fixes 3,997 tests with four count/clip failures, then fixed (27 forecast-detective rule tests; registry, lands, how-to, land-pages, capacity and voice-clips 220 tests pass); `BROWSER_SUITE=forecastdetective` PASS and re-run after the review fixes (level 1: free not-yet Check, free repeat, snowy ruled out by warm, sunny ruled out by a postcard, glow with crossed cards, rainy to the reveal, saved 2 misses/1 hint; level 2 in portrait 768×1024: missing flap stays shut, overclaimed sunny, Can't tell yet, saved 1/0); `BROWSER_SUITE=fingerdemo FINGER_ONLY=forecast-detective FINGER_LEVELS=1,2` PASS (15.5 s, 16.3 s); `npm run build`. game-reviewer: four small defects, all fixed. Screenshots: level 1 glow landscape, level 2 portrait.
- Source check (S1, opened 2026-10-31): [NSIDC science of snow](https://nsidc.org/learn/parts-cryosphere/snow/science-snow) (snow forms at or below 0 °C, can reach the ground slightly above, generally will not form at 5 °C or more, so the two thermometer readings and "It's warm, so it can't snow" hold only inside the drawn model); NOAA JetStream air masses (motion follows upper-air flow with no single prevailing direction, so the wind rule stays a disclosed pretend rule); NOAA JetStream weather models (radiosondes, satellites and surface observations; generally accurate out about four days with growing run-to-run differences beyond, supporting "forecasters use lots of measurements and computer models, and forecasts are still sometimes wrong"). Every line kept; none says weather always comes from one direction, gives a chance or percentage, or mentions storms or safety.
- Not run: the offline check (no persistence change) and other suites; the alternating-two-wrong-cards repeat-Check fix was not separately browser-probed. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#forecast-detective-levels-12-weather-water-slice-9-2026-10-31)): a school-age child opening clues on purpose, whether Can't tell yet feels like a win, iPad speech for "Lighthouse Isle", tween and parent appeal.

## 2026-10-31 — Food and fiber systems subject research (docs only)

- [PR #1067](https://github.com/rjdunlap/neo/pull/1067), branch `claude/research-food-fiber-systems`: [study](../deep-dives/subjects/food-fiber-systems.md) and [packet](../deep-dives/subjects/RECOMMENDATIONS.md#food-and-fiber-systems-recommendations) (Maker Lane 1–3: a bundle that changes form at each maker, who can use it now, where did it begin; a grown-ups' label card and co-play role follow; Maker Lane 4–5 after 1–3 are played; a plan puzzle and goods from far away stay sketches), tracker, backlog, READY, ideas, roadmap and device checks updated.
- Ran: `git fetch origin --prune`, `scripts/overlap.sh` for the subject (no claim), `node scripts/check-links.mjs` and `git diff --check`. Sources: the NALO booklet, England's D&T programme, the Australian Curriculum food-and-fibre page, ACER's survey article, the Maine State Museum wool PDF and Wikipedia's Dyeing opened; the rest from search summaries, marked in the study.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the FS1 definition and three [person checks](../DEVICE-CHECKS.md#maker-lane-food-fiber-systems-study-2026-10-31-proposed-nothing-built).

## 2026-10-31 — Maker Lane 1–3 definition (food-fiber-systems FS1, docs only)

- [PR #1068](https://github.com/rjdunlap/neo/pull/1068), branch `claude/define-maker-lane`: [definition](../definitions/maker-lane.md) (a new game, levels 1–3; toddler 1, preschool 1–2, pre-K 2–3, school 2–3; Cozy Village, fallback Painted Canyon; who can use it now, where did it begin), batch plan [maker-lane 1](../GAME-BATCHES.md#maker-lane-1-along-the-lane-who-can-use-it-now-where-did-it-begin), READY, backlog, study, packet, tracker and roadmap updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-game tier); the person, device and review checks in the definition (a four-year-old's sheep-for-the-sock pick and whether the replay changes the next one, the thought bubble versus trying every stall, the grown-ups' label card, the named agricultural-literacy or textile review).

## 2026-10-31 — Lemonade Stand deep dive (docs only)

- [PR #1070](https://github.com/rjdunlap/neo/pull/1070), branch `claude/dive-lemonade-stand`: [dive](../deep-dives/lemonade-stand.md) (levels 5 *Two lemon boats*, 6 *Best buy*, 7 *A typical sunny day*; a pre-K opening and a journal chart as decisions), batch plan [lemonade-stand 1](../GAME-BATCHES.md#lemonade-stand-1-two-lemon-boats), READY, backlog, tracker, ideas, two subject studies and waiting-on-developer updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (nothing built). Open: the build (new-interaction tier); the existing Lemonade Stand device checks and the dive's person checks (whether "for 2 lemons" reads as cheaper per cup, whether levelling towers feels fair).

## 2026-10-31 — Pixel Pictures deep dive (docs only)

- [PR #1071](https://github.com/rjdunlap/neo/pull/1071), branch `claude/dive-pixel-pictures`: [dive](../deep-dives/pixel-pictures.md). Found levels 2 and 6 repeat exactly (the pool equals the pictures shown) and level 6 has no colour-logic solvability check, so its hint and bot walk reading order. Four slices queued ([batches](../GAME-BATCHES.md#pixel-pictures-1-fresh-pictures-and-colour-logic): fresh pictures and colour logic, levels 7–8, level 9 entry, level 10 own picture); the toddler opening is filed in [waiting-on-developer](../WAITING-ON-DEVELOPER.md); tracker, READY, backlog and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the four builds; the dive's person checks (second mirror line read as a rule, sixteen squares for a four-square model, colour pick before tapping at three or four).

## 2026-10-31 — Garden Rows deep dive (docs only)

- [PR #1072](https://github.com/rjdunlap/neo/pull/1072), branch `claude/dive-garden-rows`: [dive](../deep-dives/garden-rows.md). Three slices queued ([batches](../GAME-BATCHES.md#garden-rows-1-seeded-flower-sets-and-mend-the-bed): seeded flower sets and level 7 Mend the bed, levels 8–9 Hedge boxes, level 10 One row); Two-flower beds stays a later level 11.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.

## 2026-10-31 — Ferry Jam deep dive (docs only)

- [PR #1073](https://github.com/rjdunlap/neo/pull/1073), branch `claude/dive-ferry-jam-2`: [dive](../deep-dives/ferry-jam.md). Found the hint fires on a raw slide count rather than lack of progress, and each harbor pool sits at the bottom of its plan's range. Four slices queued ([batches](../GAME-BATCHES.md#ferry-jam-1-fair-hints-and-fuller-harbors): fair hints and fuller harbors, level 7 rocks, level 8 two ferries, levels 9–10 pre-K entry and who's in the way); the preschool opening is filed in [waiting-on-developer](../WAITING-ON-DEVELOPER.md); tracker, READY, backlog and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the four builds.

## 2026-10-31 — Caravan Days levels 6–7 definition (china-india-silk-road CS4, docs only)

- [PR #1074](https://github.com/rjdunlap/neo/pull/1074), branch `claude/define-caravan-days-6-7`: [definition](../definitions/caravan-days.md#levels-67-cs4-mountains-or-sand-a-well-every-days-walk) of level 6 (mountains or sand, either road accepted, a day card before Go) and level 7 (a well every day's walk, fewest wells by search, any minimal placement accepted); the reviewer gate is now the building session's source check. Study, packet, backlog, [batch caravan-days 3](../GAME-BATCHES.md#caravan-days-3-mountains-or-sand-and-a-well-every-days-walk), READY and roadmap updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the build and its device checks.

## 2026-10-31 — Habitat Helpers deep dive (docs only)

- [PR #1075](https://github.com/rjdunlap/neo/pull/1075), branch `claude/dive-habitat-helpers`: [dive](../deep-dives/habitat-helpers.md). Three slices queued ([batches](../GAME-BATCHES.md#habitat-helpers-1-equivalent-pieces-and-pooled-gardens): equivalent pieces and pooled gardens, level 7 Something changed (the ecosystems study's F3), levels 8–9 the rocky shore); the toddler opening is filed in [waiting-on-developer](../WAITING-ON-DEVELOPER.md); tracker, READY, backlog, ideas and the oceans and ecosystems studies updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.

## 2026-10-31 — Inchworm Measure deep dive (docs only)

- [PR #1076](https://github.com/rjdunlap/neo/pull/1076), branch `claude/dive-inchworm`: [dive](../deep-dives/inchworm.md). Three slices queued ([batches](../GAME-BATCHES.md#inchworm-1-fresh-things-and-the-broken-ruler): fresh things and the broken ruler, level 9 one worm hop by hop, level 10 longer than the ruler); the centimetre ruler and the preschool opening are filed in [waiting-on-developer](../WAITING-ON-DEVELOPER.md); tracker, READY, backlog, ideas and the measurement and ancient-Mediterranean studies updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.

## 2026-10-31 — Island Bridges deep dive (docs only)

- [PR #1077](https://github.com/rjdunlap/neo/pull/1077), branch `claude/dive-island-bridges`: [dive](../deep-dives/island-bridges.md). Four slices queued ([batches](../GAME-BATCHES.md#island-bridges-1-a-small-sea-to-start-and-named-hints): a small sea to start and named hints, level 6 keep them joined, level 7 up to three planks, couch course Joined Seas); the school opening is a queued definition; tracker, READY, backlog and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the four builds.

## 2026-10-31 — Drift Cards levels 1–2 (oceans slice 6)

- [PR #1078](https://github.com/rjdunlap/neo/pull/1078), branch `claude/drift-cards-1-2`: new game `drift-cards` in Bubble Beach (14 games), school levels 1–2; batch drift-cards 1.
- Ran (tested at 12d3e0c8 on base 035164c0, Vite dev on http://localhost:5797): typecheck; full `npm test` 288 files / 4,021 tests (24 drift rule tests: 300-seed finiteness, no crossing over about 10,000 random seas, accounting, four-view layout); `npm run build`; `BROWSER_SUITE=driftcards` (level 1 free first guess wrong, two counted wrongs, glow, saved 2 misses/1 hint; level 2 wrong boat to the penguin and back, then a right boat, portrait screenshot mid-drift, saved 1/0), re-run after the review fixes; `fingerdemo` `FINGER_ONLY=drift-cards` levels 1 (22.9 s) and 2 (24.7 s). game-reviewer: no serious defects; fixed the beach touch-down press and the wrong-beach trace length.
- Source check (S1, opened 2026-10-31): NatureBridge Elwha 2015 drift-card study (4x6 inch orange plywood, biodegradable, finders report by email) supports `drift.real`; NOAA Ocean Service "What is a current?" (driven by wind, water density differences and tides) supports the how-to note, reworded to wind, tides and differences in the water; the NOAA Ocean Exploration page was not reopened. No line names a real ocean, spill or rubbish.
- Not run: offline check. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#drift-cards-levels-12-oceans-slice-6-2026-10-31)): a card mid-drift during a rotation finishes at its old coordinates (rare, self-corrects on the next card); the device and person checks below.

## 2026-10-31 — Lantern Lights deep dive (docs only)

- [PR #1079](https://github.com/rjdunlap/neo/pull/1079), branch `claude/dive-lantern-lights`: [dive](../deep-dives/lantern-lights.md). Three slices queued ([batches](../GAME-BATCHES.md#lantern-lights-1-a-6-by-6-pond): a 6 by 6 pond at levels 7–8 with the portrait counts fix, named hints and Show me a short way, lily-pad ponds at level 9); the school opening is a queued definition and three-colour lanterns a later one; tracker, READY, backlog and ideas updated.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built). Open: the three builds.
