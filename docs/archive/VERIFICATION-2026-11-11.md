# Verification 2026-11-11 (archived entries)

## 2026-11-11 — Snowball Merge slice 3, level 5 The ice rock (PR #1495)

**Changed:** `ROCK` in `logic.ts` (`slide` splits lines at it and reports `rocked`); level 5 plan and grown-up range 1–5; `scripts/snowball-merge-boards.ts` level-5 band (route 8–11, rock never in the centre) and three more frozen boards; the ice-block art, the `snowball.rock` pet line, a level-scoped how-to step. Levels 1–4 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (345 files, 6598 passed; snowball-merge 10 rule tests); `npm run build`; `BROWSER_SUITE=snowball` (levels 1, 4 and 5 at 390 × 844: the rock stays put, the rock line is said on the first slide against it, one sticker, 0 misses, 0 hints; portrait screenshot `snowball-merge-5-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=5` (13.2 s); docs checks.
**Not run:** offline, `world`, other suites.

## 2026-11-11 — Phone polish: the way in, the six's level lines and the result (PR #1496)

**Changed:** `chooser.css` phone layouts (upright: one-line title below the sun, Add a player as a row on screen, two cards across from two players; sideways: a whole card with its Couch play) and the sun beside the short heading; `levelLine` cuts a grown-up card's level line on the six at a clause or word instead of shrinking it, and names wrap inside the cell; `dailySpots` puts a daily result's next game between Again and Back on a tall view; no house on a phone's daily result.
**Ran:** `npm run typecheck`; `npm test` (345 files, 6602 passed; new tests for `levelLine` over every touch game's levels and for `dailySpots` at three upright views); `npm run build`; `BROWSER_SUITE=phonefit` (new: title one line and below the gear, Add a player on screen, next game between Again and Back, no house) and `BROWSER_SUITE=profiles` at port 5191; screenshots of the chooser with 0–3 players, the six and a daily result at 390 × 844, 844 × 390, 360 × 640 and 320 × 568, reviewed.
**Not run:** `world` (no route changed), offline (no persistence or asset change), `phone`, couch suites. Chrome only.

## 2026-11-11 — Sorting Machine levels 8–9, Festival Signals and Fix the lantern (PR #1497)

**Changed:** `sorting-machine` levels 8 and 9 at the grown-up band (`order: [3, 9, 8]`, school unchanged): a flat four-slot machine (`flat.ts`, `festival.ts`, `festival-art.ts`, `accepted.ts` with the 24 accepted machines); the game is now `upright: true`; the two `howto.test.ts` loops walk `levelsInOrder`.
**Ran:** typecheck; `npm test` (347 files, 6625 passed, 1 skipped; `flat.test.ts` 17 tests re-deriving the accepted set over all 2,005,696 fillings, `upright.test.ts` 9); `npm run build`; `BROWSER_SUITE=festivalsignals` (new: level 9 at grown-up, a failed Check = one miss, Help twice, a second miss and the glow, the wire moved, Undo, Send, passes with 2 misses and 4 hints; level 8, an incomplete Check free, the ghost finger builds it, 0/0; portrait 768 × 1024 and landscape screenshots reviewed); `BROWSER_SUITE=uprightgames PHONE_ONLY=sorting-machine` (390 × 844 touch phone, real touches: level 3 in 5 touches, level 8 in 19, one sticker each; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sorting-machine FINGER_LEVELS=8 FINGER_BAND=grownup` (19.3 s).
**Not run:** `sortingmachine` (levels 1–3 code unchanged), `world`, offline, couch suites, `fingerdemo` at 9 (the rule test plays level 9's plan). Chrome automation only.

## 2026-11-11 — Snowball Merge slice 4, level 6 Build a snowman (PR #1498)

**Changed:** `Goal` (one number or several snowballs), `SNOWMAN`, `complete`, `overshot` and a goal-aware `solve` in `logic.ts`; level 6 plan and grown-up range 1–6; `scripts/snowball-merge-boards.ts` level-6 band (route 6–9) and three more frozen boards; the stacked-snowman finish, the `snowball.over` join-too-many line with Undo lighting on its own, three voice lines and a level-scoped how-to. The goal is three 16s rather than the dive's 32 and 16 (the latter can never be overshot). Levels 1–5 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (347 files, 6635 passed, 1 skipped; snowball-merge 14 rule tests); `BROWSER_SUITE=snowball` (level 6 at 390 × 844: one join too many, Undo lights and takes it back, three 16s stacked in one column, one sticker, 0 misses, 1 hint; screenshots `snowball-merge-6-portrait` and `snowball-merge-6-snowman`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=6` (10.0 s); docs checks.
**Not run:** `npm run build` (no shared file or asset changed; CI builds), offline, `world`, other suites. The three new voice lines have no pre-rendered clip; device speech is the fallback.

## 2026-11-11 — Rule Machine levels 5–6 (AB2) definition (docs only, PR #1499)

**Changed:** new [definition](../definitions/rule-machine-5-6.md) of Rule Machine level 5 *Backwards* and level 6 *Two machines* in two build batches (rule-machine 3, then 4); the study, packet, batch plans, READY, study backlog and roadmap point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built); the case counts in the definition were enumerated by a throwaway script, and the builds' rule tests are the proof.

## 2026-11-11 — Picture Bytes (H6) definition (docs only)

**Changed:** new [definition](../definitions/picture-bytes.md) of Pixel Pictures levels 11 *Ones and zeros* and 12 *A whole picture* in two build batches (pixel-pictures 5, then 6); the study, packet, batch plans, dive, READY and the study backlog point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`; the definition's `levelsInOrder` helper and the `woods` suite's Pixel Pictures case were confirmed present in the source.
**Not run:** typecheck, unit tests, build and browser suites (nothing built).

## 2026-11-11 — Memory Desk (H8) definition (docs only, PR #1504)

**Changed:** new [definition](../definitions/memory-desk.md) of a proposed school game, Memory Desk, levels 1–3 (*Keep one*, *Open or shut*, *Fix the desk*), kept separate from Parcel Programs for those levels, in two build batches (memory-desk 1, then 2); the study, packet, ideas, batch plans, READY and the study backlog point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built).

## 2026-11-11 — Snowball Merge slice 5, level 7 A wider field (PR #1501)

**Changed:** per-board field size (`sizeOf`), `routeMap`/`routeFrom` (a distance map built once per round that the scene now reads hints from at every level), level 7 plan on a 4×4 board and grown-up range 1–7; `scripts/snowball-merge-boards.ts` level-7 band (route 12–16) and three more frozen boards; `snowballLayout(v, size)`; a level-7 how-to step. Levels 1–6 plans and boards pinned unchanged.
**Ran:** `npm run typecheck`; `npm test` (347 files, 6638 passed, 1 skipped; snowball-merge 17 rule tests, the map agreeing with `solve` on every reachable board of the 3×3 boards and the authored 4×4 one, a 1-in-7 sample of the other three; `upright-batch-4` for the 4×4 layout); `npm run build`; `BROWSER_SUITE=snowball SNOWBALL_LEVELS=7` (390 × 844: 16 cells, one glow counted as one hint, hints finish in the map's 13 slides, one sticker, 0 misses, 1 hint; portrait and landscape screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=snowball-merge FINGER_LEVELS=7` (15.3 s).
**Not run:** the other `snowball` blocks (levels 1, 4, 5, 6, land launch; their hints now come from the map and only unit tests cover that), `uprightgames`, `world`, offline, couch suites. The harness viewport is not a touch phone, so the real upright layout is covered by the unit test only.
