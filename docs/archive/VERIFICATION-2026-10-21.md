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
