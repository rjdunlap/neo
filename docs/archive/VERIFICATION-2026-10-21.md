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
