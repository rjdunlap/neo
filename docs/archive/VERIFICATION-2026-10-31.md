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
