# Verification 2026-10-30 (archived entries)

## 2026-10-30 — Puppet Stage levels 1–3 (theatre and puppetry TP1)

- [PR #1028](https://github.com/rjdunlap/neo/pull/1028), branch `claude/puppet-stage-1-3`: new game `puppet-stage` (Music Mountain, 7 games) plus the shared `voice.sayIn` / `ctx.sayIn` device-speech preset path. Tested at the branch head with Vite on a random port in 5200–5999.
- Ran: typecheck; `npm test` 282 files, 3,763 tests passed; `npm run build` passed; a fresh-context game review found no defects.
- `BROWSER_SUITE=puppetstage` passed: level 1 three pops, a drag and Bow (0/0); level 2 the wrong puppet twice (2 misses, glow, 1 hint) and voice asks; level 3 the free try, a wrong bubble (1/0), a portrait screenshot. `fingerdemo` with `FINGER_ONLY=puppet-stage` clean at lap level 1 (10.5 s) and pre-K level 3 (12.2 s), and with `FINGER_LEVELS=2` at toddler (10.0 s). Fixed in the build: the ghost finger's lift left the level-1 floor touch held, the bot tried a blocked puppet, and the portrait front row sat under the bubbles.
- Not run: `phone`, `howto` suites. Open: the four [device checks](../DEVICE-CHECKS.md#puppet-stage-levels-13-tp1-2026-10-27) (iPad voice pitch and distinct presets, a one-year-old's reaction, a three-year-old hearing "the sleepy way", portrait comfort of the 140-unit puppets); real speech and a child's play are not established.

## 2026-10-30 — Caravan Days 4–5 definition (CS3, docs only)

- [PR #1029](https://github.com/rjdunlap/neo/pull/1029), branch `claude/define-caravan-days-4-5`: [definition](../definitions/caravan-days.md#levels-45-cs3-swap-at-the-stop-worth-more-far-away) (level 4 Swap at the stop, level 5 Worth more far away; school range 3–5), a batch plan in [GAME-BATCHES](../GAME-BATCHES.md#caravan-days-2-swap-at-the-stop-and-worth-more-far-away); READY, backlog, roadmap, ideas, packet and study point to it. Nothing built, no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the building session's source check of the history lines; the build runs the new-interaction tier; the three [device checks](../DEVICE-CHECKS.md#caravan-days-levels-45-cs3-2026-10-30) wait for the built levels.

## 2026-10-30 — River Tablets 4–6 definition (AR3, docs only)

- [PR #1030](https://github.com/rjdunlap/neo/pull/1030), branch `claude/define-river-tablets-4-6`: [definition](../definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree) (level 4 a ten-mark, level 5 check the delivery, level 6 two tablets disagree; school range 3–6), batch plans [river-tablets 2](../GAME-BATCHES.md#river-tablets-2-a-ten-mark-and-check-the-delivery) and [3](../GAME-BATCHES.md#river-tablets-3-two-tablets-disagree); READY, backlog, roadmap, packet and study point to it. Nothing built, no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the building session's source check of the history line; each build runs the new-interaction tier; the four [device checks](../DEVICE-CHECKS.md#river-tablets-levels-46-ar3-2026-10-30) wait for the built levels.

## 2026-10-30 — Size Parade levels 12 and 15 (insert a friend and order shades)

- [PR #1031](https://github.com/rjdunlap/neo/pull/1031), branch `claude/size-parade-insert-shades`, tested commit `1f8e4992`: level 12 *Where does this one go?* (nearest-gap insert into an ordered line) and level 15 *Darkest first* (five shades, new `shade` swatch on `CritterSpec`); pre-K `order [5, 6, 11, 7, 8, 12, 15]`, school `order [7, 8, 12, 15]`.
- Ran at `GAME_URL=http://localhost:5587`: `npm run typecheck`; full `npm test` (282 files, 3,772 tests; Size Parade rules 25, including insert-gap, layout and reason properties over 300 seeds and three views, and shade luminance and neighbour contrast >= 1.35); `npm run build` (shared art changed).
- `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=12,15`: sky tap, off-line drop and line-friend touch free at 12; two wrong gaps = 1 hint; finished with [2 misses, 1 hint] saved; portrait screenshots of 12 and 15 reviewed; level 12 re-run after the review fixes. `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=12,15` passed (17.9 s, 31.0 s).
- `game-reviewer`: three low findings, fixed. Not run: other suites (unchanged), couch suites, the production offline check, an iPad, a child.
- Open: the shades on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-30 — Pet Kitchen 13 (Who has more?)

- [PR #1032](https://github.com/rjdunlap/neo/pull/1032), branch `claude/pet-kitchen-who-has-more`, play tested at `abc89096`: level 13 *Who has more?* (school) and the `pet-kitchen:half`, `:quarter` and `:third` journal entries.
- Ran: `npm run typecheck`; full `npm test` (3,777 passed at the prior commit; Pet Kitchen rules 21 plus journal tests); `npm run build`. `BROWSER_SUITE=creative CREATIVE_ONLY=kitchen KITCHEN_LEVELS=13` at `http://localhost:5515` (halves serve miss, quarters, one wrong "more" with overlay, right plate, score [2,0]), rerun after the overlay fix; `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-kitchen FINGER_LEVELS=13` passed (14.1 s); portrait screenshots (768x1024) reviewed.
- `game-reviewer`: one cosmetic fix (servings slide back after the overlay). Not run: other kitchen levels' browser play (their journal reporting is unit-tested only), the offline check, an iPad, a child.
- Open: leftover quarter and bubble legibility ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-30 — Sprout Shuffle level 3 (could be or always, genetics G3)

- [PR #1033](https://github.com/rjdunlap/neo/pull/1033), branch `claude/sprout-shuffle-g3`, tested at `25309fc9`: level 3 (Aa × Aa, four built buds, "sometimes" or "always" claim cards, free Try one); school range now 1–3.
- Ran: `npm run typecheck`; full `npm test` (282 files, 3,783 passed; 19 Sprout Shuffle rule tests incl. level 3); `npm run build`. `BROWSER_SUITE=sproutshuffle` at `http://localhost:5497` (levels 1–3: level 3 four built buds, two free Try one draws, wrong "always" Check = 1 miss, "sometimes" finishes, saved 1 miss/0 hints; portrait screenshot). `BROWSER_SUITE=fingerdemo FINGER_ONLY=sprout-shuffle FINGER_LEVELS=3` clean in 29.8 s.
- `game-reviewer`: no defects. Not run: the offline check (no persistence or asset change), other suites, device speech, an iPad, a child.
- Open: whether a child grasps sometimes versus always, and the claim cards' small marks at card size ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-30 — Keep House 5–6 definition (ML3, docs only)

- [PR #1034](https://github.com/rjdunlap/neo/pull/1034), branch `claude/define-keep-house-5-6`: [definition](../definitions/keep-house.md#levels-56-ml3-read-the-ruin-stone-or-timber) (level 5 Read the ruin, level 6 Stone or timber; school range 4–6), a batch plan in [GAME-BATCHES](../GAME-BATCHES.md#keep-house-2-read-the-ruin-and-stone-or-timber); READY, backlog, roadmap, ideas, packet and study point to it. Nothing built, no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the building session's source check of the history lines; the build runs the new-interaction tier.

## 2026-10-30 — Caravan Days levels 4–5 (swap at the stop and worth more far away, CS3)

- [PR #1037](https://github.com/rjdunlap/neo/pull/1037), branch `claude/caravan-days-4-5`, build commit `d2a8e4dd`: levels 4 and 5 for school (range 3–5), batch caravan-days 2 ([build note](COMPLETED-2026-10-09.md#caravan-days-levels-45-china-india-and-the-silk-road-cs3-2026-10-30)).
- Ran: `npm run typecheck` clean; caravan-days rule tests 37 pass (level 4 plan and all four pick sequences, level 5 plan, totals, reversal and bot order, layout at four views, a voice-slot test); full `npm test` 3789/3793, the 4 timeouts (bumper-garden, keep-house, penguin-slide) are unrelated games under machine load and pass alone (69/69); `npm run build` passed.
- Browser: `GAME_URL=http://localhost:5191 BROWSER_SUITE=caravandays CARAVAN_FROM=4` passed (level 4: Go before picking free, a decoy Go a miss, asked help a hint, right goods on both roads, saved 1/1; level 5: Go before looking free, the smaller load a miss, asked help a hint, the better load reversing between cases, saved 1/1; a portrait screenshot of each); `BROWSER_SUITE=fingerdemo FINGER_ONLY=caravan-days FINGER_LEVELS=4,5` clean in 17.5 s and 17.3 s.
- Not run: levels 1–3 browser play (unchanged; `CARAVAN_FROM` defaults to 1 so the full case still covers them), the offline check, an iPad, a child. Open: the three [device checks](../DEVICE-CHECKS.md#caravan-days-levels-45-cs3-2026-10-30), including the withdraw clause. Code review (game-reviewer, fresh context): no blocking findings; its notes that a wrong good stays picked after a miss and that Go sends the last-looked load match the definition and were kept.

## 2026-10-30 — Critter Daily reference review (docs only)

- Branch `claude/critter-daily-research-d94b87`: [docs/CRITTER-DAILY.md](../CRITTER-DAILY.md), a review of critterdaily.com's six animal-led puzzles and how their animals are drawn and animated, with six proposals (P1–P6), plus a pointer in [IDEAS](../IDEAS.md#critter-daily-review-2026-10-30).
- Seen: the home page and one Burrow practice round in the browser pane; every game's page, stylesheet and script read; a local pose sheet rendered in the session scratchpad (not committed).
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, tests, build, browser suites (docs only).
