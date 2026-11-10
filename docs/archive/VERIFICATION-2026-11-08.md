# Verification 2026-11-08 (archived entries)

## 2026-11-08 — Number Nook slice 2: line slides (PR #1415)

Changed: `lineSlide` in `logic.ts`; a tap in the gap's row or column slides every tile between it and the gap, glides them together, counts one slide per tile and is one Undo step; other taps still miss; `nook.miss` and how-to steps 1 and Undo reworded. Bot, Hint, levels and range 1–3 unchanged.
Ran: `npm run typecheck`; number-nook rule tests (line slide equals its single slides over 400 boards per shape, step count equals distance, refused taps return null and leave the board alone) plus `src/content` and registry tests (226 passed, how-to card fit); `BROWSER_SUITE=numbernook` (diagonal refused tap; level 3 two-tile line slide, two slides, not a miss, Undo restores the line; levels 1 and 3 finished, one sticker each; 768×1024 portrait at level 1, driftwood).
Not run: `fingerdemo` (bot unchanged), build (no shared files), offline, device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-08 — Log Roll slice 3: level 5 Lay it in the cradle (PR #1416)

Changed: level 5 (grown-up range 1–5): four frozen 6×5 floors at depth 10 (3, 4, 3, 4 upright starts; cradles across and along) finishing lying across two cradle stones; standing on one says `log.cradle` with no miss; four new voice lines, level-scoped how-to step and finish; levels 1–4 regenerate byte-identical.
Ran: `npm run typecheck`; `npm test` (329 files); `BROWSER_SUITE=logroll` (levels 1, 4 and 5, upright stop on a cradle at 5, landscape screenshot `log-roll-cradle-stand`); `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=5` (14.4 s).
Not run: build (CI), offline, portrait screenshot at 5. Open: depth 10 is a choice for a person to judge; device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-08 — Jar Sort slice 3: level 10 A little jar to park in (PR #1417)

Changed: `JarPlan.caps` (per-jar capacities) and level 10 (five jars, caps 4, 4, 4, 4, 2, three kinds, par 8–12, one board per round, 20 frozen boards that each need the little jar); levels 1–9 keys unchanged; mixed-height layout; voice line `jar.refuse-little`; how-to card step; school `order` ends 8, 10.
Ran: `npm run typecheck`; `npm test` (329 files, 6240 passed, 1 skipped); `BROWSER_SUITE=jarsort` (level 10 upright: two fruit fill the little jar with no lid, a third refused as one miss, undo twice, solved by taps, sticker, `jar-sort-10-portrait` screenshot); `fingerdemo` with `FINGER_ONLY=jar-sort FINGER_LEVELS=10 FINGER_BAND=school` (35.8 s); `npm run build`; game-reviewer found no defects.
Not run: offline, other suites. Open: device checks; `jar.refuse-little` is device speech, not rendered.

## 2026-11-08 — Number Nook slice 3: level 4 Eight spaces: two long rows

Changed: a 2 by 4 plan exactly 18 slides from home (pool 788 of 20,160 boards, exact hints from the full reverse search); `planFor` clamps with `PLANS.length - 1`; range 1–4. Upright cells are 87 units on the grown-up 64 floor, sideways 136. How-to, voice, bot and line slides unchanged. The `numbernook` suite takes `NOOK_LEVELS` (default 1,3,4).
Ran: `npm run typecheck`; number-nook tests (11: state count, `pool(4)` = 788, levels 1–3 boards pinned unchanged, level-4 boards exactly 18 and walked to solved by hints, hints shorten after any legal slide, line slides on 2×4, upright and sideways layouts), `src/content` and registry tests (how-to fit, game docs current); `BROWSER_SUITE=numbernook NOOK_LEVELS=4` (wrong diagonal tap one miss, hint once, glide, undo, start over, two-tile line slide, 768×1024 portrait in driftwood, solve with the fewest-slides line, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=4` (25.6 s).
Not run: build (no shared files or assets changed), offline, device touch and speech ([DEVICE-CHECKS.md](../DEVICE-CHECKS.md)).

## 2026-11-08 — Fruit Sums slice 3: level 5 Clear the tree (PR #1419)

Changed: level 5 (six fruit make three pairs to a target of 6–10, each right pair into a basket, round ends when the tree is empty; counted by fruit, no "same way" verdict); `solutions`, `hintWay` and `hintGlow` take a `gone` array; school `order` [1, 5, 2, 4, 3]; found-ways line scales to width; voice lines `fsums.start5`, `right5`, `again5`, `done5`; how-to card scoped by level.
Ran: `npm run typecheck`; `npm test` (329 files, 6253 passed, 1 skipped; includes the no-dead-end invariant, counting by fruit, gone-aware hints, following the glow from any state, basket layout at five views); `BROWSER_SUITE=fruitsums FROM_LEVEL=5` (portrait 768×1024, one wrong pair as a miss, three pairs into the basket, tree empty, one sticker, `fruit-sums-5-portrait-basket`); `fingerdemo` with `FINGER_ONLY=fruit-sums FINGER_LEVELS=5` (15.8 s, clean); game-reviewer, no defects.
Not run: build (no shared files or assets changed), levels 1–4 in a browser, offline, the level-5 hint glow in a browser (unit-tested only), iPad, device speech or child play.

## 2026-11-08 — Gem Swap slice 4: level 7 Stones that stay (PR #1420)

Changed: level 7 (5×5, 15 gems, par 4, grown-up range 1–7) with a fixed grey stone (`STONE = -2`) that splits its column for `fall` and `drops`; 20 generated trays (levels 1–6 byte for byte unchanged); a stone tap ticks, says `gem-swap.stone` once until the next swap, and is no miss or hint; new voice, help text and how-to step.
Ran: `npm run typecheck`; `npm test` (329 files, 6255 tests; stone fall/drops/swap/clear cases, every level-7 tray's stones, stones fixed on every shortest route, hint search under 2000 nodes, levels 1–6 equal to the old gravity); `BROWSER_SUITE=gemswap` (levels 1 and 7, refused stone tap, portrait screenshot `gem-swap-7-portrait` at 768×1024); `BROWSER_SUITE=fingerdemo FINGER_ONLY=gem-swap FINGER_LEVELS=7` (11.1 s); `npm run build`; game-reviewer review (stone line repetition fixed).
Not run: device speech, a person's play, couch suites (couch unchanged). Open: whether the stones read at a glance, in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## 2026-11-08 — Gem Swap slice 5: level 8 Iced gems (PR #1423)

Changed: level 8 (5×5, 15 gems, par 4, grown-up range 1–8) with iced gems (kind + `ICE`; swappable only after a line clears orthogonally beside them, thawed per wave before the fall); 20 generated trays (levels 1–7 byte for byte unchanged); an iced tap ticks, says `gem-swap.iced` once until the next swap, no miss; frost drawing, instruction `gem-swap.ice`, help line and level-8 how-to step.
Ran: `npm run typecheck`; `npm test` (329 files; ice rules and an independent ice-rule BFS confirming par 4 and ice-free par 3; one stale game-docs failure fixed by `npm run game-docs`); `BROWSER_SUITE=gemswap` (levels 1 and 8, refused iced tap, portrait screenshot at 8; passed twice, before and after a frost redraw); `BROWSER_SUITE=fingerdemo` gem-swap level 8 (10.7 s, before the frost redraw; bot unchanged); `npm run build`.
Not run: offline, `couchgames` (trip mapping unchanged), device speech, a person's play. Level 7's stone tap is now covered by unit tests only. Open: whether the frost reads at a glance, in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).

## 2026-11-08 — Block Garden slice 3: level 10 See what comes next (PR #1421)

Changed: level 10 (level 6's two trays and six pieces, par 4–6, new `preview: true` flag) draws the next tray faded in cards, and a tap or lift of a faded piece wiggles it with `block-garden.comes-next`, never a miss; 24 frozen gardens with a `nextTrap` filter (levels 5–8 regenerated byte-identical); school `order [2, 9, 3, 4, 5, 10, 6]`, grown-up `[5, 10, 6, 7, 8]`; `gardenLayout` gains `next` rects; how-to step; `blockgarden` suite level 10 section.
Ran: `npm run typecheck`; full `npm test` (329 files, after `npm run game-docs`); `npm run build`; `BROWSER_SUITE=blockgarden GARDEN_LEVELS=10` (portrait and landscape screenshots, a tapped and a dragged faded piece, one refused drop = one miss, planted by drags, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-garden FINGER_LEVELS=10` (11.8 s); game-reviewer: no blocking findings.
Open: the level 10 play passed 4 of 5 runs; one run after the landscape fix failed an assertion whose message `tail` cut off, and three further runs passed. Recorded as an intermittent failure of unknown cause. Not run: levels 1–9 of the `blockgarden` suite (unchanged), offline, any device check.

## 2026-11-08 — Marble Jump slice 3: level 8 The gold marble (PR #1422)

Changed: level 8 (nine marbles, one gold that must be last; 540 pairs on 255 boards, a jump over gold on offer from the start) with gold carried through `solve`, `recovery` and `fewestMoves`; a jump over gold is refused with `marble.gold` and one miss; range 1–8, levels 1–7 draws unchanged. Also made the `marblejump` suite relaunch level 7 until it draws a pair with an off-star finish (a pre-existing flake).
Ran: `npm run typecheck`; `npm test` (329 files, 6265 tests); `BROWSER_SUITE=marblejump` (levels 1, 2, 6, 7, 8 with one refused jump over gold, one hint, gold finish, portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=marble-jump FINGER_LEVELS=8` (18.8 s); game-reviewer, no blocking findings.
Not run: build, offline. New voice lines are not rendered as clips; device speech and enjoyment open.

## 2026-11-08 — Lift It slice 2: replay button and the helping paw (PR #1424)

Changed: replay button from level 3 up (hauls the last delivered parcel again, the pet counting each knot aloud; never changes line, misses or hints, awards nothing) and the pet's paw riding the handle on the level 1–2 hint; new voice lines `lift-it.replay` and `lift-it.knot-n`; a button-clearance layout test at four views.
Ran: `npm run typecheck`; `npm test` (329 files, 6271 tests); `npm run build`; `BROWSER_SUITE=liftit` (level 1 hint with paw and one hint counted, level 6 wrong rig plus hint, level 3 autumn portrait, level 4 portrait taps replay with line, misses, hints and rig unchanged and one sticker; screenshot `lift-it-4-replay-portrait`).
Not run: `fingerdemo` (bot's actions unchanged), offline. New voice lines are not rendered as clips; device speech of the counting and whether the button reads as "again" are open.

## 2026-11-08 — Fruit Sums slice 4: level 6 Three fruit (PR #1425)

Changed: level 6 (three fruit in three boxes joined by two plus signs, target 11–18, two different triples; same three in any order is the same way; a two-fruit check is no miss; hint glows a make-ten pair, then the third fruit, then the check); school `order` [1, 5, 2, 4, 3, 6]; voice lines `fsums.start6`, `fill6`, `third`, `right6`, `wrong6`, `done6`; how-to card scoped by level; `fruitsums` gained `FROM_LEVEL=6`.
Ran: `npm run typecheck`; `npm test` (329 files, 6282 passed, 1 skipped); `BROWSER_SUITE=fruitsums FROM_LEVEL=6` (portrait 768×1024, two-fruit check as no miss, two wrong threes, one hint followed through, reordered triple as the same way, two ways, one sticker, `fruit-sums-6-portrait-hint`); `fingerdemo` at 6 (13.9 s); game-reviewer, no defects.
Not run: build (no shared files or assets changed), levels 1–5 in a browser, offline, iPad, device speech or child play.

## 2026-11-08 — Block Garden slice 4: level 11 Mind the snail (PR #1426)

Changed: level 11 adds a snail mask (`Bed.keep`): a drop that would empty the snail's stone goes home with a boing and `block-garden.snail`, counted as a miss; the shadow over the snail's line shows blue and a worried snail. Levels 1–10 search unchanged; 24 frozen gardens.
Ran: `npm run typecheck`; `npm test` (block-garden and content tests 236 passed; the only failure was stale game docs, since regenerated by `npm run game-docs`); `BROWSER_SUITE=blockgarden GARDEN_LEVELS=11` (portrait 768×1024, worried-snail shadow screenshot, two refused snail drops = two misses, hint lit once and planted, rest by drags, snail kept, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=block-garden FINGER_LEVELS=11` (12.5 s); `npm run build`.
Not run: offline, other suites, landscape, any iPad or device check; new voice line not rendered as a clip.

## 2026-11-08 — Lift It slice 3: level 9 How many paws? (PR #1427)

Changed: level 9 (school, between 4 and 5): any rig, paw prints hidden until she answers, one paws card after a handle tap on any rig, no knots card; free tugs, a wrong card is a miss that lights the right one and the pet says the count; new lines `lift-it.instruct-paws` and `lift-it.count-paws-one`; how-to card widened to 3–9; the `liftit` suite gained a level 9 play.
Ran: `npm run typecheck`; `npm test` (329 files, 6293 passed, 1 skipped; 28 lift-it rule tests); `BROWSER_SUITE=liftit FROM_LEVEL=9` (paws hidden until the card, wrong card = one miss, free tug on a too-heavy rig, requested hint glows the right card once, round finished with 1 miss 1 hint; landscape screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=lift-it FINGER_LEVELS=9` (43.0 s); `npm run build`.
Not run: the full `liftit` suite for levels 1–6 (unchanged paths), offline, a portrait screenshot of 9, device speech of the new lines.

## 2026-11-08 — Log Roll soft moss and the stone bridge (PR #1429)

Levels 6–7 add moss footprint rules and a standing switch with persistent bridge state, exact forward hints, Undo/restart and spoken support. Tested `ad6e71b8` plus the working diff on `codex/log-roll-moss-bridge`; floor regeneration is byte-identical.
Ran: typecheck; 14 Log Roll rules (levels 1–5 unchanged, exact hints against independent BFS, no stranded revisions, hint budget); `npm test` (329 files, 6294 passed/5 skipped); build; format check, lint and lint prune.
Browser at `GAME_URL=http://localhost:5196`: `BROWSER_SUITE=logroll LOG_ROLL_LEVELS=6,7` passed moss/edge refusals, lying switch, standing press, Undo lowering, restart, double hint counted once and one sticker each; portraits 6/7 and raised bridge reviewed, landscapes captured. `BROWSER_SUITE=fingerdemo FINGER_ONLY=log-roll FINGER_LEVELS=6,7` finished cleanly in 11.5/17.4 s.
Not run: offline (no persistence, navigation or asset change), iPad or child play; existing person/device gates remain open. Fresh game review found no issues.

## 2026-11-08 — Number Nook slice 4: level 5 Read the new goal (PR #1430)

Level 5 adds a 3×3 column-order goal, exactly 14 slides from the start; tile colors/notes, completion, hints, miniature, instruction, how-to and ghost finger follow that goal. The two 3×3 goals share a 9!-byte distance array; levels 1–4 retain their seeds. Tested `c51283d0` plus the working diff on `codex/number-nook-column-goal`.
Ran: typecheck; 14 Number Nook rules (125 seeded boards, frozen levels 1–4, both table initialization orders, all 181,440 alternate-goal states with legal distance-decreasing hints and exploratory edges); 217 content/registry tests passed, 1 skipped; build; format check, lint and suppression prune. Fresh game review found no issues.
Browser at `GAME_URL=http://localhost:5196`: `BROWSER_SUITE=numbernook NOOK_LEVELS=5` passed refused tap, hint counted once, glide, Undo/restart, line slide, correct column target and one sticker; the 768×1024 portrait was reviewed. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=5` finished cleanly in 20.4 s.
The new spoken numerical order was checked against the drawn goal and arithmetic rules; no new curriculum claim. Not run: full local unit suite, offline (no persistence, navigation or external asset changes), real-device speech or person acceptance; existing gates remain open. Publication status is recorded by the owning session.

## 2026-11-08 — Number Nook slice 5: level 6 Twelve spaces (PR #1431)

The 3×4 row-order board starts exactly 24 slides from the goal. The hint and ghost finger use the same exact iterative-deepening search, with level-specific spoken and on-card guidance. Tested `82f30bd9` plus the working diff on `codex/number-nook-twelve-spaces`.
Ran `npm run typecheck`, `npm run format:check`, `npm run lint` and 234 focused rule, content and registry tests (1 skipped). The tests check seed determinism, legal decreasing hints, a breadth-first reference search, 350 ms per hint on detours up to 44 slides away, and layout. Independent rules review checked 97,800 states through depth 17 and 1,000 seeds. Game review found no blocking issues.
`BROWSER_SUITE=numbernook NOOK_LEVELS=6` passed the refused tap, a repeated hint counted once, whole-line slide and Undo, restart, the 24-slide optimum and one sticker. Reviewed the 768×1024 portrait. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=6` finished cleanly in 34.5 s.
The full suite and production build run in PR CI. Offline and real-device touch and speech were outside the local check tier.
