# Verification 2026-10-21 (archived entries)

## 2026-10-21 — Weather Wardrobe: every touch counts at level 1 and the level-7 card (slice 1)

- Built on `claude/weather-wardrobe-every-touch` ([PR #682](https://github.com/rjdunlap/neo/pull/682), commit `3f6e65dc`): level 1 grass answers per weather and worn items are wiggled and named (neither changes the weather or counts toward the finish), the pack step is `{ from: 6, to: 6 }`, the dead remove-phase line is gone; new rule test for item names and distinct grass answers.
- Ran `npm run typecheck` (clean) and `npm test` (189 files, 2032 tests pass).
- Dev server http://localhost:5534: `BROWSER_SUITE=fourth FOURTH_ONLY=weather` levels 1–6 passed (level 1 now taps the grass and a worn item and asserts both answered with the weather unchanged); `BROWSER_SUITE=wardrobe7` passed (undress path refactored); `BROWSER_SUITE=fingerdemo FINGER_ONLY=weather-wardrobe FINGER_LEVELS=1` clean in 10.8 s.
- Not run: build (no shared files or assets), the offline check, a portrait screenshot. The burst art (puddle, snow, flower) was asserted, not reviewed by eye.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): iPad touch feel, device speech for the named clothes, and whether a toddler tries the grass.

## 2026-10-21 — Peg Garden: every touch answers (slice 1)

- Built on `claude/peg-garden-every-touch` (tip `f2a4cfa1`): whole-screen touch on the island, bubbles on every touch at levels 1–3, a queued pearl at level 1, no drift and a stall guard plus ledge ring at level 3, hint reset, fixed 1/240 s steps for dropped pearls, a window `pointercancel` listener, and a true how-to card.
- Ran `npm run typecheck` (clean), `npx vitest run src/games/peg-garden src/content` (105 pass) and `npm run build`.
- Vite dev servers on random ports, at the tip minus its last couch-only hit-area guard: `BROWSER_SUITE=batch BATCH_ONLY=pegs` levels 1–5 passed twice (sea tap, queued pearl, ledge ring, cancelled aim asserted; it is the item-12 flaky case); `BROWSER_SUITE=fingerdemo FINGER_ONLY=peg-garden FINGER_LEVELS=1,3` clean in 21.9 s and 8.2 s.
- Open: `BROWSER_SUITE=couchgames COUCH_ONLY=peg-garden` failed 1 of 3 runs on the branch (bot never finished: 1 hint, 44–57 misses) while origin/main's game code passed 4 of 4; cause not established, and the final guarded code's couchgames was not run. Not run: the offline check, device play.

## 2026-10-21 — Puddle Gobble levels 1–8

- Built on `claude/puddle-gobble` ([PR #687](https://github.com/rjdunlap/neo/pull/687), base origin/main `2a739fc9` plus the branch): new game `puddle-gobble` in Bubble Beach (now 8 games), levels 1–8; the accounting counts a miss only when aimed (a deliberate choice beyond the definition, recorded in the [definition](../definitions/puddle-gobble.md)).
- `npm run typecheck` clean; `npm test` 191 files, 2059 tests passed before the final tweaks, and after them 2058 of 2059 (one 5 s timeout in the untouched Penguin Slide level-8 test under load; it passes 21/21 alone); the game's 20 rule tests cover fit and growth, refusals, authored rounds, 500-seed generation without fallback, no dead end at levels 1–7, level 8 exact totals and a reachable dead end, the hint reaching the pail within 8 steps, a zero-refusal bot over 200 seeds per plan and layout at four views. `npm run build` passed.
- Dev server http://localhost:5436: `BROWSER_SUITE=puddlegobble` passed six runs in a row after two fixes the browser play found (a let-go thing landing back under the puddle stayed disarmed, so the hint looped; a game-moved target and pass-over soaks were counted as aimed misses): level 1 by taps, level 8 with a too-big touch (no miss), a refused overshoot and a requested hint, and a level 4 portrait screenshot (`test-results/browser/puddle-gobble-4-portrait.png`). `BROWSER_SUITE=fingerdemo FINGER_ONLY=puddle-gobble` passed at level 1 (14.0 s) and level 8 (11.1 s).
- Not run: the offline check, the `world` suite, any device or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): tap-to-lead without help for a toddler, tier 1 versus tier 2 with dots on an iPad, and whether the spoken "Too big yet" while steering feels like a scold.

## 2026-10-21 — Roundup level 11 Come along (slice 4)

- [PR #688](https://github.com/rjdunlap/neo/pull/688), `claude/roundup-come-along`, code commit `80a3ccda` on base `531324d7`: the follow mode for lap and toddler, 80% gate, fifteen-second drift and one hint, thirty-second trot-home kept; lap `[1, 11]`, toddler `[1, 11, 10, 2, 3]`.
- `npm run typecheck` clean; roundup, content and registry unit tests passed (130). Full `npm test` had two unrelated timing failures under load (ferry-jam "hint is quick in biggest harbor", fluffy-salon "slowest frame rate") that pass alone (22/22): known load flakes.
- `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=11` at `http://localhost:5328` passed: lap led by a real finger (0 misses, 0 hints), toddler left idle so the drift brings everyone home (0 misses, 1 hint); one sticker each. `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=11,10` clean: level 11 (lap) 4.3 s, level 10 (toddler) 7.4 s. One portrait (768×1024) screenshot of level 11 mid-lead reviewed: herd, ring and wide gate clear of the pet and corner buttons.
- Not run: build (no shared assets), full arcade suite, world, offline, device/child checks. Whether a one-year-old reads the herd as following and drags slowly enough is open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-10-21 — Attic Finds levels 1–2

- Built on `claude/attic-finds` ([PR #693](https://github.com/rjdunlap/neo/pull/693), base `origin/main` 7fd14b76, tested commit e7bde7dc): new game `attic-finds` in Story Grove (now 11 games), levels 1–2; the "rub along it" crank gesture and tap-then-slot-tap for a looked chip are not built ([definition](../definitions/attic-finds.md)).
- `npm run typecheck` clean; `npm test` 194 files, 2125 tests passed (19 new rule tests: objects, evidence, trials, 500-seed rounds, accounting, layout at four views). `npm run build` passed.
- Dev server http://localhost:5575: `BROWSER_SUITE=atticfinds` passed (level 1 free prediction then two wrong picks = 0 misses, 1 hint; level 2 empty Check free, door Check = 1 miss, requested hint twice = 1 hint; portrait level 2 screenshot with the rod in the magnifier, layout clear). `BROWSER_SUITE=fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=1,2` passed (22.7 s, 24.5 s).
- Not run: the offline check, `world`, any iPad or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): crank and Turn readable for a three-year-old, the back-side rod reading as connected, device speech of the clue lines.

## 2026-10-21 — Fossil Dig levels 1–2

- Built on `claude/fossil-dig` (base `origin/main` d3ba284b plus branch commits through 397e8ec6; PR link not recorded here): new game `fossil-dig` in Tinker Lab (now 12 games), pre-K levels 1–2 ([definition](../definitions/fossil-dig.md)); deviations are in the [archive note](COMPLETED-2026-10-09.md#fossil-dig-levels-12-2026-10-21).
- `npm run typecheck` clean; `npm test` 2149 of 2149 passed (24 new rule tests: cases, rounds over 500 seeds, dust reveal at most twelve pats, tiling, reach, flags, accounting, layout at four views, two levels and three sites). `npm run build` passed. A game-reviewer pass fixed the restart guards (Start again stops old continuations; the edge line is spoken only at level 2).
- Dev server http://localhost:5956: `BROWSER_SUITE=fossildig` passed (level 1 early flag free, wrong flag and wrong leaf = 2 misses; level 2 requested hint twice = 1 hint, wrong leaf 1 miss; portrait screenshot with the magnifier). `BROWSER_SUITE=fingerdemo FINGER_ONLY=fossil-dig FINGER_LEVELS=1,2` passed (14.3 s, 19.0 s).
- Not run: the offline check, `world`, any iPad or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the dusty stone read as "rub me", teeth before the magnifier, the flag-of-the-square idea without the pet's line, device speech of the leaf names.

## 2026-10-21 — Lost Layers levels 1–2

- Built on `claude/lost-layers` ([PR #697](https://github.com/rjdunlap/neo/pull/697)): new game `lost-layers` in Bubble Beach (now 9 games), school levels 1–2 ([definition](../definitions/lost-layers.md)); deviations are in the [archive note](COMPLETED-2026-10-09.md#lost-layers-levels-12-2026-10-21).
- `npm run typecheck` clean; `npm test` 196 files, 2173 tests passed (24 new rule tests: columns, validity over all 120 triples, level-1 ambiguity, level-2 resolution, ties iff valid, scripted rounds, glows finish their steps, layout at four views). `npm run build` passed.
- Dev server http://localhost:5554: `BROWSER_SUITE=lostlayers` passed (level 1 red It fits = 1 miss, Can't tell hidden then free, one-story claim = 2nd miss with the other fit stamped, requested hint twice = 1 hint, bot 2/1; level 2 free preview, wavy look = 1 miss, bot 1/0; portrait level 2 with the lens open and landscape screenshots). `BROWSER_SUITE=fingerdemo FINGER_ONLY=lost-layers FINGER_LEVELS=1,2` passed (12.1 s, 10.0 s).
- Not run: the offline check, `world`, any iPad or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): wavy line read as missing rock, Can't tell as honest, dragging a 180x100 piece, device speech of creature names and "Shell Cove".

## 2026-10-21 — Roundup level 7 Leave the cows (slice 5)

- [PR #698](https://github.com/rjdunlap/neo/pull/698), branch `codex/roundup-leave-cows`; tested base `13304503` plus slice diff, upstream `0223d869`. Two pigs/mud and two bunnies/carrots are penned; two cows stay out. Pre-K 3–7, truthful instruction/rejection/finish speech and needed-only hints.
- `npm run typecheck` passed; 65 focused tests passed across Roundup rules, how-to, difficulty and registry (300 seeded outsider herds; completion ignores outsiders; preserved bands/pins).
- http://localhost:5187: `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=7` passed with saved `[2,1]`, both pens full, cows loose, needed animals/gates glowing after two misses, cow-specific speech and one sticker. First attempt checked a cow during its hop-out; a small transition probe confirmed loose after 0.8 seconds, and the assertion now waits for that correction.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=7` passed cleanly in 16.1 seconds, no misses/hints/page errors. Landscape screenshot reviewed.
- Not run: build, full units, other browser levels/suites, offline, portrait, iPad speech or child play (new-level tier). No save/assets/navigation changes; unrelated Peg Garden timeout remains out of scope.

## 2026-10-21 — Trackway Tales levels 1–3

- Built on `claude/trackway-tales` ([PR #699](https://github.com/rjdunlap/neo/pull/699), tested commit b28df6c5): new game `trackway-tales` in Story Grove (now 12 games; Bubble Beach and Tinker Lab fail their scenery tests), school levels 1–3 ([definition](../definitions/trackway-tales.md)); deviations are in the [archive note](COMPLETED-2026-10-09.md#trackway-tales-levels-13-2026-10-21).
- `npm run typecheck` clean; `npm test` 197 files, 2209 tests passed (36 new rule tests: stamping, fitting, mismatch kinds, the puddle, Can't tell right once and wrong once, rounds over 500 seeds, accounting, hints, layout in four views). `npm run build` passed.
- Dev server http://localhost:5491: `BROWSER_SUITE=trackwaytales` passed (level 1 replay, scrub, wrong hop Check = 1 miss, requested hint twice = 1 hint, bot finish; level 3 L3-pause fitting card free then bot Can't tell 0/0; L3-switch wrong Can't tell = 1 miss then finish; level 3 portrait screenshot). `BROWSER_SUITE=fingerdemo FINGER_ONLY=trackway-tales FINGER_LEVELS=1,2,3` passed (7.7 s, 13.1 s, 16.9 s).
- Not run: the offline check, `world` (no navigation or persistence change), any iPad or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): practice strip read as "mine to try" against the mud as the record, toe legibility on an iPad, Can't tell landing as satisfying, device speech of "trackway".

## 2026-10-21 — Discovery D3 the stop card

- Built on `claude/discovery-d3-stop-card` ([PR #701](https://github.com/rjdunlap/neo/pull/701), tested commit a0909a78): with how-to cards on the Little surprises mix opens each stop's own card with the stop row and Skip (wide fallback at 1024×768), card Back ends the mix, Home goes to the next-up stop's card (`mixReturn`), the header picture repeats the title on every intro ([definition](../definitions/combined-preview.md)).
- `npm run typecheck` clean; `npm test` 197 files, 2220 tests passed; `npm run build` passed. A one-off fit probe (Bubble Pop, Sing-Along Barn, Fill and Dump at every lap and toddler level; 1024×768, 768×1024, 844×390, 390×844) fit all 22 cards per view with Play, Back and Skip inside (worst margin 14 landscape, 36 portrait).
- Dev server http://localhost:5204: `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` passed (stop card from the mix spot with no round built, tile and title speech through captured device speech, result Home to Barn's card, Skip to Fill and Dump, Back ends the mix, then the D2a sheet flow with cards off); `DISCOVERY_ONLY=direct-next` passed.
- `BROWSER_SUITE=world` fails at the known `hatchingAndMap` `pip.rig.mesh.filters` assertion (also on unchanged main); with it relaxed locally the full suite passed. `npm run test:offline` passed against preview http://localhost:5349 after matching `classic-cpjCpGSd.js` to dist.
- Not run: couch, picnic, device or iPad speech, a child's understanding of the stop row and Skip.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): reach, Skip and tile understanding, device speech of the mix lines.

## 2026-10-21 — Cut Along levels 1–8

- Built on `claude/cut-along` ([PR #702](https://github.com/rjdunlap/neo/pull/702)): new game `cut-along` in Painted Canyon (now 5 games), levels 1–8, every open decision at its default; commit `f4358a3f`.
- `npm run typecheck` clean; `npm test` 198 files, 2247 tests, and the game's 27 rule tests cover the fit and corridor floor (at least 30 units in the four standard views), no-skipping chords at corners, stretch separation, both ways round completable, the bot route completing, wobble not picking a way (shown failing on the old rule), level-1 marks at least 110×140 without overlap, one fit per level-8 board with a spoken difference, and seeds. `npm run build` passed.
- Dev server http://localhost:5250: `BROWSER_SUITE=cutalong` passed: level 1 by taps (0 misses, 0 hints), level 3 two strays (two misses, glow, one hint, progress kept), level 5 a circle counterclockwise then clockwise in a second round, level 6 portrait screenshot reviewed (`test-results/browser/cut-along-6-portrait.png`), level 8 a wrong outline (one miss, slit closed) then the fitting outlines; stickers awarded, no page errors. `BROWSER_SUITE=fingerdemo FINGER_ONLY=cut-along` passed at levels 1 and 7 (7.9 s, 9.8 s) and 5 and 8 (11.7 s, 10.7 s).
- Not run: other suites, the offline check, any iPad or child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the corridor floor for a toddler's finger, whether the scissors hide the line ahead, whether level 8's choice reads to a five-year-old.

## 2026-10-21 — Little Helpers: every touch answers (slice 1)

- Built on `claude/little-helpers-every-touch` ([PR #703](https://github.com/rjdunlap/neo/pull/703), base `b61395ce` plus the branch commit `7bce1c06`): a full-screen touch sends a helper at level 1, a hop and squeak while busy, a grass wave at 2–6, a shrug and `helpers.busy` with no helpers left, a zero-helper whistle as a nudge not a miss, every bunch fruit into the basket.
- `npm run typecheck` clean; vitest on `src/content`, `src/games/little-helpers` and `src/games/registry` (12 files, 128 tests) passed; `npm run build` passed.
- Dev server http://localhost:5692: `BROWSER_SUITE=batch BATCH_ONLY=helpers` levels 1–5 passed (sky tap at 1, touches while busy, whistle with nobody sent and a grass tap, no miss); `BROWSER_SUITE=woods WOODS_ONLY=helpers` level 6 passed (every bunch fruit in the basket); `BROWSER_SUITE=fingerdemo FINGER_ONLY=little-helpers FINGER_LEVELS=1` clean in 23.3 s. A landscape screenshot of level 5's basket was reviewed.
- Not run: the full unit suite, other browser suites, a portrait screenshot, the offline check.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a one-year-old notices the hop and wave, and whether the shrug reads; not established by automation.

## 2026-10-21 — Draw the Pattern levels 1–8

- Built on `claude/draw-the-pattern` ([PR #704](https://github.com/rjdunlap/neo/pull/704), base `bd885a39` plus the branch): new game `draw-the-pattern` in Painted Canyon (6 games), lap 1–2 to pre-K 5–8; a shared change to `canyonPlan` (a 0.75-size spring when the full one finds no room) is covered by `canyon.test.ts` but not visually checked. Levels 7–8 candidate pairs changed from the definition to one-up, one-down pairs.
- `npm run typecheck` clean; `npm test` 199 files, 2277 tests passed on the final code (the game's 27 rule tests include one that undecided ways wait at `forkOf`); `npm run build` passed.
- Dev server http://localhost:5848: `BROWSER_SUITE=drawpattern` passed: level 1 by marks and a pat, level 3 two strays (one miss, then glow and one hint, progress kept), level 4 a circle counterclockwise and clockwise, level 5 portrait screenshot (`test-results/browser/draw-the-pattern-5-portrait.png`), level 8 a wrong candidate (one miss, stroke resets) then finished with misses 1, hints 0; no page errors. `BROWSER_SUITE=fingerdemo FINGER_ONLY=draw-the-pattern FINGER_LEVELS=1,7` passed (20.9 s, 19.3 s).
- Not run: world suite, the offline check, a visual check of the canyon's smaller spring.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the 30-unit corridor on a two-year-old's zigzag, whether the crayon hides the dashes, level 5's stepping stones for a three-year-old, whether level 7's faint candidates read as a choice, level 8's narrow units for a four-year-old's finger.

## 2026-10-21 — Monster Munch: a truthful card (slice 1)

- Built on `claude/monster-munch-truthful-card` ([PR #705](https://github.com/rjdunlap/neo/pull/705), code `f772d7c7` and `0b044f1e` on `bd885a39`): two rounds at levels 1-2, counted bites at 1 and 4-6, monster taps feed at 1, a wrong pad counts one tummy (level 8 counts the tray), hint lines per target, a short drop says "Hm?" and the monster leans, a truthful card.
- `npm run typecheck` clean; `npm test` 198 files, 2251 tests passed (includes the `munchHint` rule test).
- Dev server http://localhost:5969: `BROWSER_SUITE=third MUNCH_LEVELS=1,2,4,7` passed (scores 1: 0/0, 2: 0/0, 4: 2/1, 7: 3/1; stickers saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=monster-munch FINGER_LEVELS=1` clean in 18.2 s.
- Not run: build, other suites, the offline check, a portrait screenshot.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether per-bite counting keeps pace with fast feeding on iPad speech, and whether the ringed tummy count and the monster's lean read; a child.

## 2026-10-21 — Who Am I? Z2: shared cast art move

- Built on `claude/who-am-i-z2-art` ([PR #707](https://github.com/rjdunlap/neo/pull/707), `cd49bdd8` on `058c49c6`): `src/art/animals.ts` holds `frogArt`, `penguinArt`, `turtleArt(size)` and `fishArt(color: Swatch)`; drawing bodies are byte-identical (removed/added line comparison of the diff) and Frog Hop, Penguin Slide, Mossy Path and Bubble Pop import them.
- `npm run typecheck` clean; `npm test` 199 files, 2278 tests passed; `npm run build` passed.
- Dev server http://localhost:5240: `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=1`, `mossypath` (levels 1 and 3, land launch and return), `woods WOODS_ONLY=penguin FROM_LEVEL=1 TO_LEVEL=1` and `originals ORIGINALS_ONLY=scenes` (Bubble Pop shore, bath, night, sea) passed.
- Not run: `fingerdemo` (no bot or interaction changed), screenshots (bodies unchanged), the offline check, a device.

## 2026-10-21 — Rhythm Neighbors: support truth and a real pool (slice 1)

- Built on `claude/rhythm-neighbors-support-truth` ([PR #708](https://github.com/rjdunlap/neo/pull/708), `e23d8eab` on `e4c941ea`): `PLANS` keyed by level ID, `levels` as a `BandLevels` table, twelve reply shapes with varied calls that never match, a croaking teal frog (`sfx.ribbit`), a joinable finale, free levels ending after eight taps with an idle wiggle, the 2.5 s pause rule at levels 5–6 (no miss), the extra-tap cap fix, level-scoped how-to finish and notes.
- `npm run typecheck` clean; seven Rhythm Neighbors rule tests passed (plan keys, all twelve shapes seen across seeds, distinct replies, calls never matching, knock-count rule at 3–4, alternation, finale bounds, pause threshold against `judgeEcho`, ghost finger still passes `judgeEcho`); `npm test` 199 files, 2282 tests passed; `npm run build` passed.
- Dev server http://localhost:5871: `BROWSER_SUITE=creative CREATIVE_ONLY=rhythm` levels 1–6 passed (scores [0,0] free, [2,1] turn levels; free levels finish by eight taps; a 3 s mid-reply pause empties the reply with no miss, proved by disabling the rule and watching "Rhythm pause 1/0" fail, then restoring). `BROWSER_SUITE=fingerdemo FINGER_ONLY=rhythm-neighbors FINGER_LEVELS=1,6` passed (6.4 s, 35.2 s).
- Not run: couch suites (bot and `control()` unchanged), the offline check, a portrait screenshot, a device; open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): the teal ribbit on an iPad speaker and the eight-tap end and idle wiggle with a one-year-old.

## 2026-10-21 — Roundup level 8 Make it fair (slice 6)

- [PR #709](https://github.com/rjdunlap/neo/pull/709), branch `claude/roundup-make-it-fair`; tested commit `c7a68b3a`. Pre-K 3–8: an even herd of 6 or 8, two pens, any equal non-zero split rings true, a wrong bell is a miss that names the counts, `sfx.seesaw` on every bell.
- `npm run typecheck` passed; `npx vitest run src/games/roundup src/content src/games/registry` passed (139 tests: herd shape, every equal split accepted, fuller/emptier named, extras level the pens, help reaches half each, pre-K 3–8).
- http://localhost:5230: `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=8` passed (no number on the sign, empty-pen bell, unequal bell, two-wrong-bell hint, 30-second idle help leaving level pens alone, fair finish speech, one sticker; saved `[2,1]`); landscape screenshot reviewed (3 and 3 under a board above two mud pens). The idle-help check was shown to fail without its guard.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=8` finished in 26.2 s (run before the idle-help guard; the bot path is unchanged by it).
- Not run: build, full unit suite, portrait, other suites, offline, iPad speech or the seesaw sound by ear, child play (new-level tier).

## 2026-10-21 — Seesaw Balance level 11 Two boxes

- [PR #710](https://github.com/rjdunlap/neo/pull/710), branch `claude/seesaw-two-boxes`, commits `a1b27c7a` and `c0c4a608` on base `c12d4b51`. School 6–11: `pair` mode, two pairs of a reading and a weighing, free closer moves, a free round-box wiggle, one glow per pair after two tips, a once-judged quick burst of moves.
- `npm run typecheck` and `npm run build` passed; `npx vitest run src/games/seesaw-balance` passed (13 tests, 6 new: generation over 300 seeds, unique goal and path length, progress classes, the finger's tip sequence, hints narrowing the gap in 2,400 wandering states, a seed-7 fingerprint that levels 1–10 are unchanged); `npx vitest run src/content src/games/registry.test.ts src/progress` passed (16 files, 256 tests).
- http://localhost:5908: `BROWSER_SUITE=woods WOODS_ONLY=twoboxes` passed three times (once before the burst guard, twice after) in portrait 768×1024: a wrong pad on the reading, the round box touched, two widening tips then the glow, put back, a quick two-block burst judged once, saved score [1,1] and a sticker. With the guard briefly removed the burst assertion failed. Screenshots `test-results/browser/seesaw-balance-11-glow.png` and `seesaw-balance-11.png`.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=seesaw-balance FINGER_LEVELS=11` passed in 58.7 s of the 75 s allowed.
- Not run: full unit suite, other browser suites, offline, iPad speech, a child. The Woodland Picnic pins level 7 and is unaffected. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the tagged box read as its number, the orange hatbox read as different, the "closer" line.

## 2026-10-21 — RW07 Welcome a New Friend definition (docs only)

- [PR #711](https://github.com/rjdunlap/neo/pull/711), branch `claude/rw07-welcome-definition`: new [WELCOME-BUILD.md](../rework/WELCOME-BUILD.md) defining RW07 as three slices (record, page, Continue, `pretty` and `yummy`; the song step; the ending, adoption and basket bed) with five recorded defaults. Routed into WORK-ITEMS, READY, ROADMAP chunk 30 and WAITING-ON-DEVELOPER.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (results in the PR). No code changed, so no typecheck, unit, browser or offline run.
- Open: nothing built or played; slice 2 waits on the hello-song decision. No coverage-summary row changed.

## 2026-10-21 — RW07 slice 1: Welcome a New Friend (record, page, Continue, pretty and yummy)

- [PR #712](https://github.com/rjdunlap/neo/pull/712), branch `claude/rw07-welcome-slice1`: `projects.welcome` with repair, `go.project` and `ProjectScene`, Home's Continue, the `project` member of `StoryRound`, voice lines, and a new `welcome` browser suite. The `home` suite's stale Explore assertion (RW13 added locations) narrowed to the first two ids.
- Ran at `2eb18d2c` (dev http://localhost:5254, preview http://localhost:5949): typecheck; `npm test` 200 files, 2302 tests; build; `BROWSER_SUITE=welcome`, `home` and `picnic` passed; `npm run test:offline` passed. Landscape and portrait welcome page and Home with Continue reviewed by screenshot.
- Not run: `world` (classic only gained a `project` to map stub), device speech, iPad, a child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a child understands the invitation and step cards; how the asks and done lines sound.

## 2026-10-21 — Size Parade: support truth (slice 1)

- Built on `claude/size-parade-support-truth` ([PR #714](https://github.com/rjdunlap/neo/pull/714)): comparative words at two friends (`size.wrong.pick`), every touch answered (sky or ground hop and repeat; `size.spot` for a friend on the wrong spot), pitch inverted so big is low, `paradeLayout()` with a no-overlap test (the portrait-overlap gap was a misreading: the logical view is at least 1024 wide), pinned size steps, the card's wording, and `SIZE_LEVELS`/`SIZE_PORTRAIT` filters.
- Ran at the branch tip (Vite http://localhost:5226): `npm run typecheck`; `npx vitest run src/games/size-parade src/content src/games/registry` (141 tests pass); `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=1,7 SIZE_PORTRAIT=1` passed (misses/hints [2,1], one sticker each; level 7 portrait screenshot reviewed, five friends and no overlap); `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=7` finished in 13.5 s.
- Not run: build (no shared files or assets), the full unit suite, other suites.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): iPad touch feel, device speech for the new lines, and whether a child hears big-low as natural.

## 2026-10-21 — Chain Reaction level 9 Two marbles

- Built on `claude/chain-reaction-two-marbles` ([PR #715](https://github.com/rjdunlap/neo/pull/715)): a red and a blue marble on one 5x4 board, both must ring their own bell (`works()`), free one-marble experiments with both trails, counted hint, school order `[3, 4, 5, 6, 9]`, new `chain.two-*` voice lines and how-to steps, a `chainPlay` level-9 case and `CHAIN_LEVELS` default 1,6,7,8,9.
- Ran at commit dfe5ce1c (Vite http://localhost:5583): `npm run typecheck`; vitest for chain-reaction (14 tests, two new level-9 rule tests over 300 and 120 seeds), `src/content`, `src/games/registry` and `src/progress` (266 pass); `BROWSER_SUITE=machines CHAIN_LEVELS=9` passed (free experiment with both trails, counted hint, both machines, one sticker, score [0,1], portrait fit; landscape and portrait screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=chain-reaction FINGER_LEVELS=9` clean in 26.5 s.
- Regression (the refactor touches run, trail, replay, hint and bot at every level): `CHAIN_LEVELS=1,6,7,8` passed, `fingerdemo` at levels 1 and 6 clean in 14.0 s and 24.1 s, full `npm test` 200 files / 2309 tests passed.
- Not run: build, other suites, offline, an iPad, a child.
- Open: whether a school child tells the two marbles and bells apart (color plus dot) and follows both runs; pre-K opening for level 9 stays an open choice.

## 2026-10-21 — Pet Kitchen: support truth (slice 1)

- Built on `claude/pet-kitchen-support-truth` ([PR #716](https://github.com/rjdunlap/neo/pull/716)): `serveTrouble` names why a serve missed (too few pieces `kitchen.short` before empty plates `kitchen.empty`, else the existing lines; two serves before the cut glow the cut that works), a touch on the uncut food wiggles it and repeats the instruction, the cut buttons bounce after six quiet seconds, level 7's fair serve counts the pieces aloud (`kitchen.fraction-count`), and the how-to's open ranges close.
- Ran (Vite http://localhost:5522): `npm run typecheck`; `npm test` (200 files, 2311 tests pass, two new rule tests for `serveTrouble` and `countAloud`); `npm run build` (before the ordering fix, which touched only game files); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pet-kitchen FINGER_LEVELS=1,7` clean (level 1 toddler 8.4 s, level 7 school 5.8 s).
- Tested commit `3cfbba55`. One-off Playwright probe (`test-results/pk-probe.mjs`, not committed), rerun on that commit: level 1 two uncut serves glowed the visible halves button with no `kitchen.recut` (2/1); level 2 poke free with wiggle and instruction, cut button bounced after quiet, halves on empty plates said `kitchen.short` as the first miss, the second miss said only `kitchen.recut` (misses/hints 2/1, no `kitchen.fair`); level 7 empty serve said `kitchen.empty`, a three-quarters serve was counted aloud and finished with a sticker, no page errors.
- Not run: the `creative` suite's kitchen case, a portrait screenshot, device speech of the counted line.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): a toddler's reaction to the wiggle and bounce, and the counted line's speech on an iPad.

## 2026-10-21 — Fluffy Salon: support truth (slice 1)

- Built on `claude/fluffy-salon-support-truth` ([PR #717](https://github.com/rjdunlap/neo/pull/717), tested commit `5d47d40b`, base `ac153189`): level 3's hint counts time without progress (`helps`, `QUIET_HINT = 15`), a touch off the fur giggles, the pet asks for the mirror in free play (`salon.mirror`), the mirror no longer appears at level 3 (a latent bug that counted a miss), "a little more" with the old-colour glow (`salon.more-color`), a true how-to.
- Ran (Vite http://localhost:5345): `npm run typecheck`; `npx vitest run src/games/fluffy-salon src/content` 118 passed (new tests for `moreLine`, `oldStrands`, `helps`); `BROWSER_SUITE=batch BATCH_ONLY=salon TO_LEVEL=3` levels 1-3 passed (level 3 no-mirror assertion seen failing with the old reveal restored; level 3 play 22 s, was about 80 s); `BROWSER_SUITE=fingerdemo FINGER_ONLY=fluffy-salon FINGER_LEVELS=3` clean in 18.9 s.
- One-off probe (`test-results/salon-glow-probe.mjs`, not a suite): level 4 with 16 of 26 strands in the asked colour and the mirror tapped gave misses 1, hints 0, glow set; a screenshot showed the glow.
- Not run: `npm run build`, levels 4-5 in the suite, other suites.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the giggle, device speech of the two new lines, the glow on an iPad.

## 2026-10-21 — Little Conductor level 3: Two pictured requests (music M3)

- Built on `claude/little-conductor-m3` ([PR #718](https://github.com/rjdunlap/neo/pull/718)): the listener's sign, pad audition, Check, a wrong Check that names the requested pace, a once-per-half requested hint, bands toddler 1–2, preschool 1–3, pre-K 2–3, and the `conductor` suite's level 3.
- Tested commit `698731cc` plus a one-line idle-pulse guard in the next commit (typecheck and the 49 little-conductor and how-to tests re-run on it). `npm run typecheck`; full `npm test` (200 files, 2322 tests pass); `npm run build` passed.
- Ran (Vite http://localhost:5665): `BROWSER_SUITE=conductor CONDUCTOR_LEVELS=3` passed (Check with no pick, a wrong Check with the pick kept, the hint asked twice counted once, both halves matched, one sticker); the portrait screenshot `little-conductor-3-portrait` was reviewed (sign above the listener, glowing hint pad, wrong pick framed). `BROWSER_SUITE=fingerdemo FINGER_ONLY=little-conductor FINGER_LEVELS=3` finished in 18.1 s.
- Not run: a landscape level-3 screenshot, the real Esc to pause-sheet route (`askForHint` called directly), a levels 1–2 regression play (paths unchanged; layout tests cover them), the offline check, a device, a child.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a preschooler reads the sign as the thing to match, and whether a bunny friend in the band blurs the rabbit pad.

## 2026-10-21 — Animal Snack: a far barn on the horizon (visual identity V1 slice 3)

- Built on `claude/animal-snack-far-barn` ([PR #719](https://github.com/rjdunlap/neo/pull/719), code `90598fac`): `farBarnAt` in the game's `logic.ts`, `drawFarBarn` extracted to `src/art/scenery.ts` (the Barnyard scene calls it, same output), drawn first in `drawDecor`.
- Ran (Vite http://localhost:5647, stopped): `npm run typecheck`; `npx vitest run src/games/animal-snack` 15 pass (three new: 60–80 tall on the horizon at five views, never in a friend's tap circle, the orchard tree, the bubble/bell band or off screen, orchard null at 1024 and right at 1365; dropping one friend's circle made two fail, then restored); full `npm test`; `npm run build`; `BROWSER_SUITE=woods WOODS_ONLY=snack` levels 1–5 (1m31s, no page errors).
- A probe took a portrait (768×1024 meadow) and landscape (1024×768 dusk, plus the suite's garden) screenshot: barn visible, clear of the friends.
- Not run: `fingerdemo` (bot unchanged), `world`, the offline check, a device.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether a child recognises the land without its label.

## 2026-10-21 — Egg Catch: a miss that teaches and hens that wait (slice 2)

- Built on `claude/egg-catch-miss-teaches` ([PR #720](https://github.com/rjdunlap/neo/pull/720), tested at `d75e51d1`): levels 2–3 boing and "Peep! Slide under the next one." on a missed brown egg, a hay glow under the next brown egg's lane after two misses, and `HenPace` so hens lay only while someone plays (an unplayed landing is no miss); bots touch once per new egg.
- Ran (Vite http://localhost:5734): `npm run typecheck`; `npx vitest run src/games/egg-catch src/content` 121 pass (idle round lays one egg with no miss at levels 2 and 3, busy play never lands unplayed, a look-away costs at most one or two eggs, the second egg waits for play, glow lane equals the next brown egg over 100 seeds at both levels).
- `BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=2 TO_LEVEL=3` passed (both levels score 2 misses, 1 hint, sticker saved, no page errors; run on `1fb7bc31`, which differs only in glow draw order and bot nudges). `BROWSER_SUITE=fingerdemo FINGER_ONLY=egg-catch FINGER_LEVELS=2,3` passed (24.3 s, 16.8 s); `BROWSER_SUITE=couchgames COUCH_ONLY=egg-catch` passed.
- A portrait probe (768×1024, toddler level 2): 15 s idle laid 1 egg, 0 misses, hens settled; two played misses then gave the hint and the glow under the falling egg's lane (screenshot checked).
- Not run: build (no shared files or assets changed), full unit suite, other suites, offline.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether resting hens after a still, caught egg read as a pause; whether the glow is visible on an iPad; a child's reaction.

## 2026-10-21 — Discovery D5a Make my mix definition (docs only)

- PR #721, branch `claude/define-make-my-mix`: new [make-my-mix.md](../definitions/make-my-mix.md) defining D5a, an in-memory lineup editor for the Little surprises mix (hold the mix spot, one to five stops, repeats allowed, no save). Routed into ROADMAP (chunk 19, D5a row), DISCOVERY, READY, WAITING-ON-DEVELOPER and the D2a and D3 definitions' couplings.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. No code changed, so no typecheck, unit, browser or offline run.
- Open: nothing built or played; five decisions have leans the build follows. No coverage-summary row changed.

## 2026-10-21 — Song Maker authored motifs (slice 3)

- [PR #723](https://github.com/rjdunlap/neo/pull/723), `codex/song-maker-authored-motifs`, tested `adb515d6` plus slice diff: twelve authored motifs per existing copy shape; rests preserved, seeded selection excludes three recent motifs within the loaded profile's session; demonstrations leave history alone. Frozen level-4 Missing Melody shape and bot unchanged.
- Passed `npm run typecheck`; `npx vitest run src/games/song-maker/logic.test.ts` (9 tests): frozen plans, twelve distinct motifs each, exact authored columns/rests, multiple pitches, at most one leap, home endings, deterministic short-window exclusion, pool coverage, copies and right-tap bot completion of every motif.
- Level-4 screenshot at http://localhost:5189, 1024×768, reviewed: five shadows and authored first-beat rest on 6×4, grid/pet clear; no page errors. Local artifact `test-results/song-motifs-level4.png` (ignored). Initial probe needed the harness's hatched test profile; Chromium required process access outside the sandbox.
- Passed 18 how-to tests (`npx vitest run src/content/howto.test.ts`), links and diff check. No new voice lines needed; the existing copy instruction remains true, and the how-to names the quiet beat.
- Not run: `fingerdemo` (bot unchanged), full units, build, play suites, offline, portrait, device or child checks (content tier). No new levels/interactions/story changes.

## 2026-10-21 — Discovery D5a: Make my mix

- [PR #724](https://github.com/rjdunlap/neo/pull/724), `claude/make-my-mix`, base `8610cf8e` plus the branch commits: hold the mix spot (0.6 s) to open a mix table, edit a one-to-five-stop lineup (add, repeat, reorder, remove, reset), Play it; in memory only, no game ID.
- Passed `npm run typecheck`, `npm run build`, `npm test` (2349 of 2350; the one failure is a hint-search timing cap in `block-garden/logic.test.ts` under full-suite load, unrelated, a known flake). New: `my-mix.test.ts` (14, table targets in four views at every count) and five cases in `mix-flow.test.ts`.
- Passed `BROWSER_SUITE=discovery DISCOVERY_ONLY=my-mix` (hold, add/repeat/full, reorder, remove, four-stop mix, Skip, finish, result tile, Explore keeps lineup, profile switch resets) and `DISCOVERY_ONLY=mix` unchanged, at http://localhost:5540; landscape and portrait table screenshots reviewed.
- Not run: `world`, offline, the subject-layout hold in a browser (unit-level only), a gamepad closing the table (not implemented). Open in DEVICE-CHECKS: a grown-up finding the hold, a child's reaction.

## 2026-10-21 — Sound Garden: the whole cast sings (slice 2)

- [PR #725](https://github.com/rjdunlap/neo/pull/725), `claude/sound-garden-whole-cast`, code commit `30ce109f`: level 1 seats a seeded five of six singers, each with its listening role (pitched frog, quick bunny, slow turtle); the how-to's `finish` is level-scoped.
- Passed `npx tsc --noEmit`, and vitest for `src/games/sound-garden`, `src/content` and the registry (14 files, 154 tests; cast, role and tempo-gap rules over 100 seeds).
- Passed `BROWSER_SUITE=batch BATCH_ONLY=garden` at http://localhost:5687, levels 1-6, no page errors; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sound-garden FINGER_LEVELS=1` finished in 19.4 s (lap). A landscape level-1 screenshot was reviewed (a seed without the turtle).
- Not run: build (no shared files or assets), a portrait screenshot, the full unit suite. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): bunny against turtle and the pitched ribbit on an iPad speaker, a child's reaction.

## 2026-10-21 — Fill and Dump level 7, Which holds more?

- [PR #727](https://github.com/rjdunlap/neo/pull/727), `codex/fill-dump-capacity`, tested `ec4aace1` plus slice diff (includes upstream `dc194279`): three distinct obvious capacity pairs, free guess → conserved pour → answer; preschool top only. Levels 1–6 retain their rules; shared pour helpers accept the receiver capacity with the old default of one.
- Passed typecheck and production build. `npm test -- --maxWorkers=2`: 202 files, 2,354 passed / 4 skipped. After the final feedback/default-source cleanup, the build/typecheck and 64 focused Fill and Dump/how-to/difficulty tests passed again. New properties cover ratios/distinctness/seed, both overflow and room left, conservation through arbitrary pours and repeated recovery, unscored guesses/partial checks, post-evidence-only misses, one hint per pair, supported completion, bands and non-overlapping 100-unit targets in four views.
- Passed `GAME_URL=http://localhost:5193 BROWSER_SUITE=originals ORIGINALS_ONLY=fill FILL_LEVELS=7`: smaller-container guess, partial check, overflow, repeated pour, two wrong answers/one hint, three pairs, one sticker, history reload, no page errors. Portrait `test-results/browser/fill-dump-7-portrait.png` reviewed: vessels, tray/evidence glow and controls clear of pet.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=fill-dump FINGER_LEVELS=7` at the same URL: clean round in 22.6 demo seconds. The final feedback cleanup leaves its gesture/plan unchanged.
- Initial unrestricted full units overloaded the machine (unrelated Fluffy Salon and Block Garden timing failures); stopped, bounded run passed. An editor-triggered Vite reload interrupted the first browser completion after the screenshot; frozen-source reruns passed.
- Not run: other gameplay suites, world, offline (no persistence, navigation or asset changes), iPad/device speech or child play. [Device check](../DEVICE-CHECKS.md) remains open. Owned server stopped at closeout.

## 2026-10-21 — Teddy Doctor: weigh and measure (slice 2)

- [PR #728](https://github.com/rjdunlap/neo/pull/728), `claude/teddy-doctor-weigh-measure`, commit `db23dbd1` on `42f37c87`: levels 5 (card) and 6 (told) draw three distinct check-up steps of five (a scale on the feet, a height chart on the head join heart, temperature, ears); consecutive patients never repeat the same steps in order; the tray holds that check-up's three tools. Level IDs, bands and accounting unchanged; no care claim.
- Passed typecheck and `npx vitest run src/games/teddy-doctor src/content` (132 tests: distinct steps, tray equals steps, consecutive differ, five checks on five parts, every step and all ten sets occur in 300 seeds, demonstration parts).
- Passed `BROWSER_SUITE=next NEXT_ONLY=doctor FROM_LEVEL=5` at `http://localhost:5702` on the final code (level 5 and 6 plays with differing steps, 2 misses/1 hint, sticker) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=teddy-doctor FINGER_LEVELS=5` (finished in 25.8 s). Portrait probe (768×1024) of both new shows reviewed: star on the cat's ears, scale beside the feet, clear of tray and pet.
- Not run: build (no shared files or assets), other suites, device speech of "weigh me" and "see how tall I am" (no [device check](../DEVICE-CHECKS.md) added). Server stopped.

## 2026-10-21 — Scoop Shop: pools and a serve tune (slice 2)

- [PR #729](https://github.com/rjdunlap/neo/pull/729), `claude/scoop-shop-pools`, commit `b999e558` on `0d33df0f`: eight customers, a cup and a waffle bowl beside the cone, three window scenes, flavour thank-yous and the serve tune; `dressShop` is drawn after the orders so no rule, accounting or how-to card changed.
- Passed `npm run typecheck` and `npx vitest run src/games/scoop-shop src/content src/games/registry` (14 files, 149 tests; `dressShop` over 200 seeds: valid kinds and scenes, no repeat in a row, every kind and scene appears).
- Passed at `http://localhost:5230`: `BROWSER_SUITE=fingerdemo FINGER_ONLY=scoop-shop FINGER_LEVELS=5` (finished in 26.8 s) and `BROWSER_SUITE=arcade ARCADE_ONLY=scoop` (levels 1–6, wrong scoops, hint glow, peeking, one sticker each). A level-5 probe in portrait (768×1024) reviewed cup, cone and bowl; landscape screenshots reviewed all three window scenes.
- Not run: build (no shared files or assets), device speech of the flavour names, a child's reaction to a cup or bowl at tub scale (both added to the [device checks](../DEVICE-CHECKS.md)).

## 2026-10-21 — Roundup level 9 Fill it up (slice 7)

- [PR #731](https://github.com/rjdunlap/neo/pull/731), `codex/roundup-fill`, tested `797c73dc` plus the slice diff (upstream `37874317`): one pen asking 4 or 5 starts with 1–3 home and six loose; present-count/remainder support, pre-K 3–9.
- Passed typecheck and 54 focused tests (`src/games/roundup/logic.test.ts src/games/registry.test.ts src/content/howto.test.ts`): every target/start combination, seeded solvability/spares, exact bell counts, preserved IDs/windows, adaptation and level-scoped cards.
- Passed `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=9 GAME_URL=http://localhost:5194`: initial prefill, two short bells with ordered recount/remainder, counted glow, updated-count idle hint, extra correction, exact finish and one sticker (saved `[3,2]`); no page errors.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=9` at the same URL: clean completion in 18.3 s. Browser evidence uses isolated profiles; real saves untouched.
- First deployment of `77e24e7a` failed only on two stale pre-K-8 expectations in `roundup/levels.test.ts`, omitted from the initial focused list. Test-only follow-up `codex/roundup-fill-tests` updates those and adds level-9 next-offer/card assertions. Passed all 58 tests with `npx vitest run src/games/roundup src/games/registry.test.ts src/content/howto.test.ts`. Gameplay unchanged; browser evidence reused.
- Links and diff check passed. Not run: build, other gameplay suites, world/offline (no shared engine, navigation, persistence or assets changed), portrait (not required by this new-level tier), device speech or child play ([open check](../DEVICE-CHECKS.md)). Server stopped at closeout.

## 2026-10-21 — A better voice V0 (chunk 29)

- [PR #734](https://github.com/rjdunlap/neo/pull/734), `claude/better-voice-v0`, commit `80199672` on base `2f25be9f`: `chooseVoice` prefers Premium/Enhanced, on-device English voices and avoids novelty and old MacinTalk voices; the grown-ups' page names the voice in use and how to download a better one.
- Passed typecheck, full `npm test` (203 files, 2,370 tests, 8 new voice-choice tests) and `npm run build`.
- Probe `test-results/voice-note-probe.mjs` on Vite `http://localhost:5344`, headless Chromium: held the gear on Who's playing?; the note read "Speaking: Samantha, the device's standard voice…" (41 English voices on this Mac); screenshot inspected.
- Not run: browser suites (the panel change is one static note, no navigation or persistence change), offline check, any iPad or Enhanced/Premium voice ([open check](../DEVICE-CHECKS.md)).

## 2026-10-21 — Roundup level 12 Big and little (slice 8)

- [PR #736](https://github.com/rjdunlap/neo/pull/736), `codex/roundup-size`, tested `eaa57807` plus slice diff; integrated `cb27d66d` queue docs only. Three pigs of each size, matching pens/speech/hints, pre-K ordered through 12.
- Passed typecheck and all 60 tests in `src/games/roundup`, `src/games/registry.test.ts` and `src/content/howto.test.ts`: seeded balanced herds, size-specific gates/completion, preserved bands/IDs, adaptation and card.
- Passed `GAME_URL=http://localhost:5196 BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=12`: scales, centred 170-unit hit diameters, two wrong-size gates, truthful speech/glow, exact finish, saved `[2,1]` and one sticker; no page errors.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=12` at that URL: clean finish in 23.8 s. Portrait `test-results/browser/roundup-12-portrait.png` inspected: size contrast, matching signs, gates and pet clearance.
- Passed links/diff. Not run: build, broader suites/world/offline (new-level tier; no engine/navigation/persistence/assets changes). iPad speech/readability and child play remain [open](../DEVICE-CHECKS.md).

## 2026-10-21 — Roundup two shepherds (slice 9)

- [PR #737](https://github.com/rjdunlap/neo/pull/737), `claude/roundup-two-shepherds`, tested `f0725fa3` (base `769d0514`) at http://localhost:5312. Every finger on the grass shoos at levels 2–12 (capped pushes, nearest-finger follow, one ring per finger, palm rejection, lost-touch drop); the co-play line is a role.
- Passed typecheck and `npx vitest run src/games src/content` (150 files, 1703 tests, including a new `fleeFrom`/`nearestFinger` test).
- Passed `BROWSER_SUITE=arcade ARCADE_ONLY=roundup ARCADE_LEVELS=3` (two-pointer probe: tracked 2, rings 2, second finger alone moved an animal 64.6, after a cancelled touch 1 left, a fourth contact ignored as a palm (3 tracked), all lifted left 0; score 0,0) and `ARCADE_LEVELS=11` (lap 0,0 and toddler 0,1 drift).
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=roundup FINGER_LEVELS=3`: clean in 19.5 s.
- Not run: build (no shared files), full suites, offline. Real two-handed play on an iPad is [open](../DEVICE-CHECKS.md).

## 2026-10-21 — Shape Sorter level 9, Tap and in it goes (slice 2)

- [PR #738](https://github.com/rjdunlap/neo/pull/738), `claude/shape-sorter-tap-in`, tested `4a760035` (base `e16771d4`) at http://localhost:5905. Level 9 (a quick unmoved touch hops its piece into the one circle hole; drags still work; 0 misses, 0 hints) and the lap band; toddler `order [9, 1, 2, 3, 4, 5]`.
- Passed typecheck and full `npm test` (203 files, 2375 tests, including the new tap rule, three-taps-from-any-seed and band-window tests).
- Passed `BROWSER_SUITE=originals ORIGINALS_ONLY=shapes SHAPE_LEVELS=1,9`: level 1, then level 9 at lap and at toddler in portrait (opening screenshot `shape-sorter-9-start-portrait`).
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=shape-sorter FINGER_LEVELS=9`: clean at lap in 7.0 s.
- Not run: `npm run build` (no shared assets changed), device speech, a child's reaction. A window `pointercancel` on a short unmoved touch hops the piece in (harmless at 9); a later tap-in level that counts misses should examine it. An iPad check is [open](../DEVICE-CHECKS.md).

## 2026-10-21 — Fractions subject research landed

- [PR #480](https://github.com/rjdunlap/neo/pull/480)'s research (2026-10-16, `codex/fractions-subject-research`) re-applied on current `main`, 936 commits on: the study as written; its tracker row, wave-E line, notebook rows and definition packet moved to where those now live ([RECOMMENDATIONS.md](../deep-dives/subjects/RECOMMENDATIONS.md#fractions-recommendations) and the roadmap's subject table).
- Sources as recorded in the study: CCSS 1.G/2.G, 3.NF–5.NF, 6.NS; IES guide; NAEYC; six digital references and Fraction Talks. No reference game was played.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: code checks (docs-only tier).

## 2026-10-21 — Egg Catch notes, colours and hatching basket (slice 3)

- [PR #740](https://github.com/rjdunlap/neo/pull/740), `codex/egg-catch-colours`; tested `c7595ddb` plus slice diff, based on `72461c90`. Lane notes, catchable shell colours at 1–2 and gathered-eggs hatching ending; rules/levels/accounting unchanged.
- Passed `npm run typecheck`; `npx vitest run src/games/egg-catch src/content/howto.test.ts src/content/voice-script.test.ts`: 31 tests (13 Egg Catch / 18 how-to; no separate voice-script test file). Includes 200-seed bot timing with coloured shells, catchable hint lanes, distance from white, and brown/white-only rule streams.
- `node test-results/egg-colours-probe.mjs`, isolated Chromium at `http://localhost:5197/classic/`, portrait 768×1024: real level-2 touches, six gathered eggs, zero misses/hints, one saved sticker, no page errors. Inspected `test-results/browser/egg-colours-level2-portrait.png` and `egg-colours-ending-portrait.png`: blue-green falling shell and six peeping chicks/cracked shells, pet clear.
- Probe setup corrected logical-to-screen touch scaling; interrupted attempts were not game failures. Source frozen for final successful run. Comments added after the unit pass do not change its evidence.
- Local build, broad/browser suites, offline, physical iPad/audio/speech/child play not run (content tier). Upstream `8ca0ac75` adds PR tests/build and an AGENTS wait-for-pass rule only; integrated as `4f72a733`, gameplay proof reused. PR tests/build passed on `2bb3bb02` (run 39682115924); subsequent upstream `efabf001` is fractions research/docs only, with both verification entries preserved. Required CI is repeated on the integrated PR before merge. Existing device checks remain open; route/pair endings share the finale, but no separate route/pair browser play was run.

## 2026-10-21 — RW08 cutover definition (docs only)

- Branch `claude/rw08-cutover-definition` (PR #743): [RW08-CUTOVER.md](../rework/RW08-CUTOVER.md), with three build slices (Explore's four entries; the library, stories and rest of Home; the `classic/` cutover, waiting on the developer) and five defaults. Also the RW08 row, READY, WAITING-ON-DEVELOPER and the roadmap row.
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Nothing built. Not run: unit tests, browser suites, offline check, device, child play. Packet claims come from a source audit at `03e20c70`, not from play.

## 2026-10-21 — RW08 slice 1: Explore's four entries

- Branch `claude/rw08-explore-entries` (PR #744), base `origin/main` 50525377 plus the branch: `ExploreScene` entries (Places, Favorites, All games paged, Family play), the `{ explore }` origin, `go.explore`, the result's Back to [origin] beside a Home house at the root.
- Ran `npm run typecheck`; `npm test` (204 files, 2387 tests, new `explore.test.ts` and `exploreGridLayout` five-view test); `npm run build`; `BROWSER_SUITE=home` at a dev server (entries, Places to Counting Cove and back, All games page 2 to a game and the result's Back to All games and Home, an older-age favorite at school band with no re-pin, empty Favorites, Family play to couch and back in landscape and portrait; six screenshots inspected); `npm run test:offline` against the matched preview.
- Not run: `world`, `couch`, `picnic` (classic and couch code unchanged). No iPad, device speech or child check ([DEVICE-CHECKS](../DEVICE-CHECKS.md)). Open: couch's leave button still says "Back to the island" for an Explore origin.

## 2026-10-21 — RW08 slice 2: the library, the mix, the birthday and the gear

- Branch `claude/rw08-library` (PR #745), tested at commit `ec77fd7a`: the library from creature play (`LibraryScene`, `go.library()`, `{ library: true }` origin), Little surprises leading All games' first page at lap and toddler (`placeAtRoot`), the shared birthday rule on Home and the grown-ups' gear on Home.
- Ran `npm run typecheck`; `npm test` (206 files, 2391 tests; new `birthday.test.ts`, `library.test.ts`, explore pages with the mix lead, origin library and `placeAtRoot`, home-layout gear corner and books clearance); `npm run build`; `BROWSER_SUITE=home` at a dev server (birthday once, gear with the link below it, books to library to journal and Back, a Windy blanket step at the root saved once and Back to the library and creature play, Little surprises on All games page 1 to its sheet, a stop, the round's Home back to All games page 1 with the sheet, Back ends the mix, plus the slice 1 steps; screenshots of the library, All games with the mix, and Home's birthday); the offline check against a matched production preview (asset names matched `dist`), passed.
- Not run: `picnic` (it drives `classic/`; the Windy step ran inside `home`), `world`, `couch`. No iPad, device speech of the new lines or child check ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-21 — Feelings Faces level 9, Poke a feeling (slice 2)

- [PR #746](https://github.com/rjdunlap/neo/pull/746), `claude/feelings-faces-poke`, commit `cebc704b` on `16f34a7b`: lap entry level 9 (tap the pet, it shows the next feeling of a six-tap cycle, hug after sad, sticker at the end); `LEVELS` became a `BandLevels` table with lap order `[9, 1, 2]` and `entryLevels: [9]`; new line `feel.poke`; card, bot and a `feelpoke` suite.
- Passed `npm run typecheck` and `npm test` (206 files, 2394 tests, including three new level-9 rule tests: every feeling within five taps, hug follows sad exactly once a cycle, six taps end; lap order, landing and next level 9; other bands land a saved 9 at their minimum).
- Passed `BROWSER_SUITE=feelpoke` at `http://localhost:5698/classic/` (portrait 768×1024, lap, six real pokes: happy, surprised, sleepy, sad, happy, surprised; sticker; history level 9 with 0 misses and 0 hints); portrait screenshot `test-results/browser/feelings-faces-9-portrait.png` inspected (surprised face, stars, no bubbles). Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=feelings-faces FINGER_LEVELS=9` in 11.5 s.
- Not run: build (no shared files or assets), other suites. Open: whether a one-year-old taps the pet from a lap ([device check](../DEVICE-CHECKS.md)).

## 2026-10-21 — Egg Catch level 8 Under the hen (slice 4)

- [PR #748](https://github.com/rjdunlap/neo/pull/748), `codex/egg-catch-under-hen`, tested as `fe996336` plus the slice diff on base `29666592`. Only toddler level 8: lane hops under the fluffed/clucking hen, five eggs, wrong-lane teaching, order `[1, 8, 2]` and safe entry landing. Lap/couch windows unchanged.
- Passed typecheck; `npm test`: 206 files, 2393 passed / 4 skipped; includes changing seeded cues, forgiving nearest-lane taps, only the calling lane releasing an egg, toddler stepping/landing and the scoped how-to (49 focused tests). Passed final `npm run build` (shared how-to/voice and synthesized cluck).
- Passed `BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=8 TO_LEVEL=8 GAME_URL=http://localhost:5197`: isolated portrait 768×1024, idle hen waits, wide shelf/hay taps move the basket, two wrong lanes keep the egg and light one hint, five changing cues caught, saved history 2 misses / 1 hint and sticker, no page errors. Inspected `test-results/browser/egg-catch-8-hint-portrait.png`: calling hen and glowing hay, basket/pet clear.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=egg-catch FINGER_LEVELS=8` at the same URL: clean in 13.9 s. Browser harness now lists level 8 explicitly alongside 1–5; 6–7 remain slice 6 scope. A small `test-results/egg-lanes-probe.mjs` diagnosed portrait input scaling; the harness now uses `toGlobal` for its lane taps. The first lane test also exposed the old layout's narrower lanes; the new layout passes ±95-unit taps.
- Not run: broader browser suites, offline (no persistence/assets/navigation changes), physical iPad/speech/audio/child play. Existing device checks extended for the new cue and lane hops. Browser evidence predates only harness-default/comment/docs edits; game source unchanged afterward.

## 2026-10-21 — Garden Grow growth stages and wet soil (slice 2)

- [PR #749](https://github.com/rjdunlap/neo/pull/749), `claude/garden-grow-stages`, code `3f679d3b` on base `05929ab5`; `src/games/garden-grow/index.ts` only: staged bloom (stem, leaves, bud, open head) and wet-soil overlay on rain. No rule, accounting, voice, how-to or level change.
- Passed typecheck; vitest garden-grow plus `src/content` (15 files, 139 tests).
- Passed `BROWSER_SUITE=woods WOODS_ONLY=grow FROM_LEVEL=1` (levels 1-7, no page errors) at http://localhost:5921; `BROWSER_SUITE=fingerdemo FINGER_ONLY=garden-grow FINGER_LEVELS=1,7` clean in 11.0 s and 41.0 s. A portrait 768×1024 probe at level 2 showed buds on stems with leaves, dark wet soil, then open heads.
- Not run: build (no shared files), device or child play. Open: whether a one-year-old notices the wet soil with sound off (existing person check stays open).

## 2026-10-21 — Mail Carrier seeded street, the cart and a mirrored map (slice 2)

- `claude/mail-carrier-street`, code `8b4d5383` on base `a1a63aeb`; `src/games/mail-carrier/` (`logic.ts`, `index.ts`, tests) and the woods suite: seeded roofs, chimneys and window boxes, one mailbox colour away from the doors, the duck on the street, the pet's cart, and a woods map mirrored half the time. No level ID, range, voice or how-to change.
- Passed typecheck; `npx vitest run src/games/mail-carrier` (17 tests, including 300-seed checks of the mailbox colour, the seven-neighbour pool and the mirrored map's edges); `BROWSER_SUITE=batch BATCH_ONLY=mail` (levels 1-5, wrong taps, hint, scores, stickers) at http://localhost:5995.
- Passed `BROWSER_SUITE=woods WOODS_ONLY=mailmap FROM_LEVEL=6 MAIL_MIRRORED=1` (levels 6-8 all mirrored, level 7 in portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=mail-carrier FINGER_LEVELS=1,6` clean in 19.4 s and 14.2 s. Screenshots inspected: street levels 2 (mid-delivery) and 4, mirrored level 6 portrait and level 7 landscape.
- Not run: full `npm test` and build (no shared, voice, how-to or asset files changed; CI runs both), the `woodland` story suite, the unmirrored woods orientation (`MAIL_MIRRORED=0`). Open on a device: [cart readability](../DEVICE-CHECKS.md#open-items) and whether a toddler confuses the mailbox colour with a door.

## 2026-10-21 — Sing-Along Barn eighth tune, Ring Around the Rosie

- [PR #752](https://github.com/rjdunlap/neo/pull/752), `claude/sing-barn-ring-around`, code `5cc8d91c` on base `bd5fd036`; `src/games/sing-along-barn/`, voice lines and the how-to card: tune `ring` (13-note opening, 8-note verse), the eighth level 5-6 card.
- Passed `npm run typecheck`; `npx vitest run src/games/sing-along-barn src/content/howto src/content/voice` (54 tests, including two new rule tests: lyric, answers and verse ends; do-mi-sol-la only with "down" lowest).
- Passed `BROWSER_SUITE=singalong` at http://localhost:5509/classic/ on `5cc8d91c`: a Ring Around the Rosie level-1 round (one sticker, 0 misses, 0 hints) and a level-5 upright check that all eight cards are at least 100 units, on screen and not touching, with the rose card singing `ring` (screenshot `test-results/browser/sing-along-barn-5-eight-cards-portrait.png`). The suite's relaunch-until-tune helper went from 20 to 60 tries (20 missed Old MacDonald once with eight tunes) and prints the tunes drawn on failure.
- Not run: `npm run build` (CI runs it), `fingerdemo` (the bot always taps the first card; unaffected), device speech and a grown-up singing the tune (open in DEVICE-CHECKS).

## 2026-10-21 — Egg Catch level 9 One gate (slice 5)

- [PR #754](https://github.com/rjdunlap/neo/pull/754), `codex/egg-catch-one-gate`, implementation `09ec9e2d`; tested `aeece839` plus slice diff, base `e4041ed1`. Only stable level 9: one gate/two exits, deliberate release, four successful eggs, supported wrong-way learning; preschool/pre-K put 9 before 4.
- Passed `npm run typecheck`; `npx vitest run src/games/egg-catch/logic.test.ts src/progress/difficulty.test.ts src/content/howto.test.ts`: 3 files / 51 tests, including target variety, single-flip solvability, hint/bot agreement, adaptation, entry landing and existing IDs.
- Passed `BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=9 TO_LEVEL=9 GAME_URL=http://localhost:5198`: portrait play, egg waits through a long look, exactly one gate/two exits, two wrong routes, one hint, four catches, saved history/sticker and no page errors. Inspected `test-results/browser/egg-catch-9.png`: fork, basket/hay, arrow, companion and four-egg ending clear.
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=egg-catch FINGER_LEVELS=9` at the same URL: preschool bot clean in 25.8 s. Source frozen during successful plays. Links and `git diff --check` passed; server stopped.
- Retry-boundary follow-up: target variety also holds when retries wrap the seeded list. Typecheck and the same 51 tests passed on `4dea4ee2` plus this rule diff; the first six targets used by the play and first four used by the demo are unchanged, so browser evidence is reused.
- Not run: extra local build, broad suites, offline (source new-level tier); iPad speech/audio and child play remain open. No lap/couch remapping, repair, flip-flop or decisions. Required PR tests/build passed on final implementation `c1da2c89` ([run 39709317844](https://github.com/rjdunlap/neo/actions/runs/39709317844)); this docs-only closeout reuses its gameplay evidence.

## 2026-10-21 — Weather Wardrobe more items, one slot each (slice 2)

- [PR #755](https://github.com/rjdunlap/neo/pull/755), `claude/weather-wardrobe-items`; `src/games/weather-wardrobe/`: sandals, rain hat, earmuffs and a blue puffy coat, `SLOTS` and `outfitFor`, level 5 always three, sticker pool pinned to the original eight.
- Passed `npm run typecheck`; `npx vitest run src/games/weather-wardrobe src/content/howto` (26 tests; new: one item per slot over 200 seeds for every plan, level 5 always three over 300 seeds, change rounds remove what was just put on, sticker pool pinned). Full `npm test` 2409 of 2410: the one failure is Block Garden's level-8 `hintPlacement` time-cap test (timing under load; that file is untouched).
- Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=weather-wardrobe FINGER_LEVELS=5,7` at http://localhost:5650 (level 5 in 16.5 s, level 7 in 26.8 s), run before the final coat recolor (art only). Reviewed portrait 768×1024 screenshots of every new item worn (snowy: scarf, puffy coat, earmuffs, mittens; rainy: rain hat, raincoat, umbrella, sandals).
- Not run: `npm run build` (no shared files changed), the `fourth` and `wardrobe7` suites, an iPad look at the new items (open in DEVICE-CHECKS).

## 2026-10-21 — Bouncy Launch level 9, Between two flights (slice 6)

- [PR #756](https://github.com/rjdunlap/neo/pull/756), `claude/bouncy-between-flights`, tested on base `f225960c` plus the branch; `src/games/bouncy-launch/`: school order 4, 5, 7, 6, 9, 12, three unscored rounds (two watched pulls plant numbered flags, the middle pull is predicted), voice lines `launch.between-watch`, `launch.between`, `launch.between-why`, how-to lines for level 9. Watched pulls never count misses or hints and never file the bigger-pull journal entry.
- Passed `npm run typecheck`; bouncy-launch logic, registry and content tests (178; new: midpoint triples strictly between with gap of at least 2, every shown pull lands on its own cloud inside the leash, 300 seeds three distinct sets with no repeated middle and deterministic, bot pull and judge). Full `npm test` 2415 of 2416: the one failure was block-garden `hintPlacement` at 2064 ms against its 2000 ms cap under full-suite load, 33 of 33 passing alone.
- Passed `BROWSER_SUITE=arcade ARCADE_ONLY=launch FROM_LEVEL=9 TO_LEVEL=9` at http://localhost:5880 (a pad tap during a watched pull ignored, portrait keeps the middle pull, both numbered flags and rings, first guess deliberately different, 0 misses and 0 hints, no journal observation, one sticker); portrait screenshot reviewed. Passed `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch FINGER_LEVELS=9` in 27.8 s.
- Not run: `npm run build` (no shared assets), other suites; the one wrong answer and one hint step is not applicable (unscored, no hint control). Open: whether a school child reads the rings, and iPad speech ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-21 — Roadmap reconciliation and study dispatch

- Docs-only cleanup on `codex/roadmap-study-queue`, base `554e3e24`: corrected shipped game/rework summaries, retired stale art/demo statements, and separated blocked work from routine picks.
- Added [study backlog](../STUDY-BACKLOG.md): 45 completed studies with named next actions, 20 eligible subject studies, five reviewer-dependent subjects and 26 unstarted game dives. Existing builds/claims remain distinct from definitions.
- Refilled READY to ten; three study definitions and one research slot per refill when eligible, with first resulting builds promoted into content slots. Both routines use the shared ROADMAP/READY selection rules; coordinator state and active workers were not changed.
- Passed relative Markdown links, queue/backlog coverage and duplicate-entry assertions, and `git diff --check` on the documentation diff.
- Not run: typecheck, unit/browser/build/offline suites (docs-only tier); CI still supplies the required PR tests/build. Device/child checks and developer/reviewer gates remain open.

## 2026-10-21 — Same-game level batches

- Docs-only change on `codex/coherent-game-batches`: regrouped 96 existing game/content tasks into 48 same-game implementation batches; Who Am I remains standalone and Species Comeback remains blocked.
- Added GAME-BATCHES with every original scope, source link, special check and gate; READY still has ten dispatch entries and the three-definition/one-research cadence. Original level IDs and dive subtask numbering stay unchanged.
- Updated AGENTS, roadmap, workflow, study closeout, Claude docs-keeper and the 18 affected dives: one worker/claim/PR per declared batch, combined admission estimate and proportionate shared checks, resume unfinished batches in the same worker. Coordinator checkpoint/ledger unchanged.
- Passed Markdown links, exact original-task coverage/uniqueness and Next ten composition assertions, plus `git diff --check`.
- Not run: local game tests/typecheck/build/browser/offline (docs-only tier). Required PR CI supplies tests/build; cache/token savings are unmeasured and existing device/reviewer decisions remain open.

## 2026-10-21 — Ribbon Workshop definition (fractions R1, docs only)

- [PR #760](https://github.com/rjdunlap/neo/pull/760), `claude/define-ribbon-workshop`: new [definition](../definitions/ribbon-workshop.md) for Ribbon Workshop levels 1–3 (school, new game); the study's IDs 2–4 became 1–3 and later rungs moved to 6 and 7.
- Updated READY (definition line out, build line in), GAME-BATCHES, the study backlog, the fractions study, its recommendation row, the subject tracker, the idea notebook and WAITING-ON-DEVELOPER (defaults for five open decisions).
- Ran `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, unit tests, build, browser, offline (docs only). The R2 build does not exist, so no play, ghost finger, iPad or child check applies yet.
