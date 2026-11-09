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
