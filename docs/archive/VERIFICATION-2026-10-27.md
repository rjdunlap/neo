# Verification 2026-10-27 (archived entries)

## 2026-10-27 — Moon Window levels 1–3 (space slice 2)

- [PR #1004](https://github.com/rjdunlap/neo/pull/1004), branch `claude/moon-window-1-3`, tested commit `6becf05c`, server `http://localhost:5617`: new game in Tinker Lab (now 18), levels 1–3, a Kokoro title clip; Tinker Lab pages at school as 9 and 8.
- Ran: `npm run typecheck`; `npx vitest run src/games/moon-window` 20 tests (model, ellipse area within 2 %, orientation, 500 seeds per level, authored rounds, accounting, layout at landscape/portrait/phone/notch, miss slide spot); full `npm test` 3457 tests after the two Tinker Lab count tests moved to 18 entries / 9+8 pages; `npm run build`.
- `BROWSER_SUITE=moonwindow` passed twice (after the card widening and after review fixes): level 2 wrong slice one miss, same wrong again ignored, Show a hint twice on board 2 one hint, saved 1/1; level 3 authored more, portrait screenshot reviewed (both Moons one size, request card above, pet corner clear), a wrong most-on-less one miss, seeded third, saved 1/0.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=moon-window FINGER_LEVELS=1,3` passed (level 1 lap 7.1 s, level 3 preschool 2.5 s). A game-reviewer pass found the landscape miss slide covering the other card and a hint during the right-card animation; both fixed.
- Not run: offline check, `world`, iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#moon-window-levels-13-space-slice-2-2026-10-27).

## 2026-10-27 — Sea Lift levels 4–5: How far? and Twin stops (integers IN2)

- [PR #1005](https://github.com/rjdunlap/neo/pull/1005), branch `claude/sea-lift-4-5`, commit `70bddd35`, server `http://localhost:5471`: levels 4 (number cards) and 5 (twin stops) of `sea-lift`; the level-4 card table source-checked (DfE Year 6, CCSS 6.NS.C.6.a/7.c/8, Illustrative Mathematics task 290; [definition](../definitions/sea-lift-4-5.md)).
- Ran: `npm run typecheck`; 21 sea-lift rule tests (500 seeds per level: card distinctness and range, one-side rule, right card in every position, twin round rules, check/hint/supported-finish scripts, `cardLayout` at four views); full `npm test` 3465 passed (265 files); `npm run build`.
- `BROWSER_SUITE=sealift` passed on the final code (levels 1–3 as before; level 4: landing and card-number taps free, one wrong card one miss and dims, Show a hint once, right card sends the lift; level 5: own stop free, wrong stop one miss, twin, dock case; level 4 portrait 768×1024 reviewed). The first run timed out in the unchanged level-1 sticker wait under load; two later runs passed.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=sea-lift FINGER_LEVELS=4,5` clean (9.7 s, 7.8 s), run before a review fix that only guards level-4 landing taps and two visual tweaks; not rerun. game-reviewer found a level-4 landing read as a card (fixed, suite assertion added).
- Not run: iPad touch, device speech of the new lines, a child's reaction. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#sea-lift-levels-45).

## 2026-10-27 — Sorting Machine levels 1–2 (how-computers-work H2)

- [PR #1007](https://github.com/rjdunlap/neo/pull/1007), branch `claude/sorting-machine-1-2`, on `origin/main` `bbb9169f` (commits `88891a3d`, `f014a9e5`), server `http://localhost:5437`: new game `sorting-machine` (school, Tinker Lab, now 19 games), levels 1–2 ([definition](../definitions/sorting-machine.md)).
- Ran: `npm run typecheck`; 28 rule tests in `logic.test.ts`; full `npm test` 3517 passed (two Tinker Lab count tests updated to 19; the voice-clip manifest test satisfied by rendering the title clip with Kokoro); `npm run build`.
- `BROWSER_SUITE=sortingmachine` passed twice (levels 1 and 2: both doors, a dim Done ignored, an incomplete Check free, a wrong sensor twice with the glow, Help twice, portrait screenshot); an earlier run was killed by an HMR reload while the clip manifest was written (not a game bug). `BROWSER_SUITE=fingerdemo FINGER_ONLY=sorting-machine` passed at levels 1 and 2 (11.1 s, 8.7 s). game-reviewer found no must-fix; its finale-guard note was fixed.
- Not run: iPad touch, device speech, a child's play, `world`/offline. The CS-educator read of the spoken lines and card was done in-session (no electricity, power or circuit wording). Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#sorting-machine-levels-12).

## 2026-10-27 — Helper House levels 1–3

- [PR #1011](https://github.com/rjdunlap/neo/pull/1011), branch `claude/helper-house-1-3`: new game `helper-house` (preschool–school, Cozy Village, now 17 games) levels 1–3 ([definition](../definitions/helper-house.md)); `vite.config.ts` precache per-file bound raised from 4 to 5 MiB because the routes bundle passed 4 MiB.
- Ran: `npm run typecheck`; `npx vitest run src/games/helper-house` 22 rule tests (step model, scripts, board space and accepted sets, level-3 overlap, glow/help/offer tally, bot moves, layout in both orientations); registry, lands, how-to and voice tests; `npm run build`. Full `npm test` after the title clip was rendered: 272 files, 3539 tests passed (before the clip, only the clips coverage test failed).
- `BROWSER_SUITE=helperhouse` on `GAME_URL=http://localhost:5417` passed (level 1: two failing days, one glow and one hint, a dragged eye into the door socket, finish 0/1; level 3: Step pauses after one step, resume, Show me twice is one hint, finish 0/1; landscape and portrait screenshots). `BROWSER_SUITE=fingerdemo FINGER_ONLY=helper-house FINGER_LEVELS=1,3` passed (10.6 s, 18.3 s). game-reviewer's findings (finale tap soft-lock, double-firing step phase, Show me charging for a no-op, missing door sound, restart in undo history) were fixed before these checks.
- Production offline check (`npm run test:offline`, `GAME_URL=http://localhost:5418`, served bundle matched `dist/index.html`) passed for the 5 MiB precache bound: root Home → Explore → Counting Cove offline twice with progress kept, and classic's reload, 397 cached assets, lands map, how-to card, a new game's completion and reward, the Windy Picnic, treehouse and journal offline across reloads.
- Not run: other suites, `world`, iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#helper-house-levels-13).

## 2026-10-27 — Sprout Shuffle levels 1–2 (genetics G2)

- [PR #1014](https://github.com/rjdunlap/neo/pull/1014), branch `claude/sprout-shuffle-1-2`: new game `sprout-shuffle` (school, Rainbow Meadow, now 15 games) levels 1–2 ([definition](../definitions/sprout-shuffle.md)); the placement check (meadow flower test, lands capacity sweep) passes with the game added.
- Ran on tested commit `de078060` (code; the title clip followed in `41b3cbd2`), `GAME_URL=http://localhost:5417`: `npm run typecheck`; full `npm test` (273 files; 13 new rule tests: looks, four routes, look counts, support/always, accepted sets and counterexamples, 200 seeded setups, next-step walk). The PR's first CI run failed one test, the rendered-clip coverage of `game.sprout-shuffle`; `scripts/voice-clips/render.mjs` rendered the one missing clip and the clip test and `npm run build` (405 precache entries) then passed.
- `BROWSER_SUITE=sproutshuffle` passed twice (levels 1 and 2: cross-slot spring-back, swap, four buds, missing bud from its lit tiles, wrong Check = 1 miss, second = 2 misses/1 hint with glow, Show me and a free second press, finish saved 2/2; landscape level 1 and portrait level 2 screenshots reviewed). `BROWSER_SUITE=fingerdemo FINGER_ONLY=sprout-shuffle` passed (12.8 s, 14.8 s). game-reviewer found no blockers; its two notes were fixed in the tested commit.
- Not run: other suites, the offline check (navigation unchanged), an iPad. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#needs-a-person-or-a-device) (device speech, tile legibility, the "about 9 and up" watched prototype).

## 2026-10-27 — Gadget Bench levels 1–3 (inventions I2)

- [PR #1012](https://github.com/rjdunlap/neo/pull/1012), branch `claude/gadget-bench-1-3`, commit `d42a1b84` plus the working tree, Vite `http://localhost:5431`, preview `http://localhost:5432`: new game `gadget-bench` (preschool 1, pre-K 1–3, school 2–3, Painted Canyon, now 11 games; [definition](../definitions/gadget-bench.md)). The PWA precache bound in `vite.config.ts` went from 4 to 5 MiB (the routes bundle is 4,199,491 bytes).
- Ran: `npm run typecheck`; 27 rule tests (runPath, authoring, levels 1–3 over 500 seeds, help, Tally, layout in landscape, portrait and phone, nextMove); registry, lands, how-to and off-screen tests; full `npm test` 3,544 passed (two failures fixed: the Painted Canyon count and the missing title clip); `npm run build`.
- `BROWSER_SUITE=gadgetbench` passed: level 1 free failing Try, wrong Give one miss, right Give, saved 1/0; level 2 the pet's demonstration, free failing Try of the unchanged cart, a float swapped in by a real drag, Give, rounds 2–3 by drags, saved 0/0; level 3 swapped-placement Try free, landscape and portrait screenshots, Show a hint one hint, the right build, saved 0/1. `BROWSER_SUITE=fingerdemo FINGER_ONLY=gadget-bench FINGER_LEVELS=1,2,3` passed (27 s, 46 s, 40 s). `npm run test:offline` at `http://localhost:5432` passed (production root and classic, 397 cached assets). game-reviewer found six issues, all fixed before the commit.
- Not run: iPad, device speech, a child's play. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#gadget-bench-levels-13-inventions-i2-2026-10-27).

## 2026-10-27 — Timeline Trail levels 1–3 (time-change T2)

- [PR #1013](https://github.com/rjdunlap/neo/pull/1013), branch `claude/timeline-trail-1-3`: new game `timeline-trail` (preschool–school, Barnyard, now 14 games) levels 1–3 ([definition](../definitions/timeline-trail.md)); title clip rendered. Level 4 not built.
- Ran on tested commit `9dd29295`, then again after the review fixes in `b1acf4cd` (finger-travel taps, the level-1 long-ago line, one place bag a session: typecheck, 20 rule tests, the `timelinetrail` suite and the demos at 1 and 3 reran and passed), `GAME_URL=http://localhost:5631`: `npm run typecheck`; full `npm test` (274 files, 3,568 tests; 16 new rule tests: places table and voice per stage, place bag, 500 seeded rounds per level, one valid gap per card over every legal build order, reasons, ghost-finger order, accounting, layout at landscape and portrait iPad views); the first local run failed only the rendered-clip coverage of `game.timeline-trail` until the one clip was rendered; `npm run build` (406 precache entries, 15,350 KiB).
- `BROWSER_SUITE=timelinetrail`: level 2 (one wrong gap = 1 miss, the same gap again nothing more, Show a hint twice = 1 hint, valid gap, finish saved 1/1); level 3 (free caption tap, three drags oldest first, portrait screenshot of the two-row line, finish 0/0). `BROWSER_SUITE=fingerdemo FINGER_ONLY=timeline-trail FINGER_LEVELS=1,2,3` passed (3.9 s, 5.5 s, 9.6 s). A probe screenshot of level 1 and its flipbook was reviewed.
- Not run: the offline check, other suites, an iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#timeline-trail-levels-13).

## 2026-10-27 — River Tablets 1–3 definition (ancient river civilizations AR1)

- [PR #1015](https://github.com/rjdunlap/neo/pull/1015), branch `claude/define-river-tablets`: docs only. [Definition](../definitions/river-tablets.md) for levels 1–3 and a batch plan in `docs/GAME-BATCHES.md`; the study, backlog, recommendations, roadmap, ideas and ready lists point to it. Nothing built; no code changed.
- Ran: `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean).
- Not run: typecheck, tests, build, browser suites, device (docs only).

## 2026-10-27 — River Tablets levels 1–3 (ancient river civilizations AR2)

- [PR #1019](https://github.com/rjdunlap/neo/pull/1019), branch `claude/river-tablets-1-3`: new game `river-tablets` (preschool 1–2, pre-K 2–3, school 3; Story Grove, now 16 games) levels 1–3 ([definition](../definitions/river-tablets.md)); nothing kept, no save change; one history line source-checked this session. Levels 4–6 not defined.
- Ran on the working diff over `origin/main` `da6fb4b9`, `GAME_URL=http://localhost:5417` (Vite `--strictPort`): `npm run typecheck`; `npx vitest run src/games/river-tablets src/games/registry.test.ts src/content/lands.test.ts src/content/howto.test.ts src/content/offscreen.test.ts` (96 passed; 32 River Tablets rule tests: plans over 300 seeds, level-1 invariants, crack, hint and toggle properties, row acceptance and read-back, layout at landscape and portrait); full `npm test` 3,624 passed, the rendered-clip coverage failing until the title clip "River Tablets!" was rendered (rendered with `scripts/voice-clips/render.mjs`), and block-garden hint timing and penguin-slide timeout failing only under load beside browser suites and passing alone (44/44); `npm run build` passed.
- `BROWSER_SUITE=rivertablets` (passed twice, before and after the review fixes): level 1 a token per sheep, a wobble while a sheep walks, the tip, saved 0/0, landscape screenshot; level 2 peek, one mark short, two wrong cracks (miss, then glow and hint), the glowing cell then a match, the second envelope exact, portrait screenshot, saved 2/1; level 3 a wrong row (miss), the same good wrong again (moved mark, hint, glow), every good in its row, saved 2/1. `BROWSER_SUITE=fingerdemo FINGER_ONLY=river-tablets` passed at level 1 (preschool, 9.5 s) and level 3 (school, 19.5 s).
- `game-reviewer` in a fresh context; fixed a cell press bubbling to the ball's peek, a rotation mid-envelope losing the tokens inside the ball, the heading glow following the waiting good, and Help ignored during an animation.
- Not run: the production offline check (no persistence or navigation change), other suites, an iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#river-tablets-levels-13).

## 2026-10-27 — Caravan Days 1–3 definition (CS1, docs only)

- [PR #1016](https://github.com/rjdunlap/neo/pull/1016), branch `claude/define-caravan-days`: docs only. [Definition](../definitions/caravan-days.md) for levels 1–3 and a batch plan in `docs/GAME-BATCHES.md`; the study, backlog, recommendations, roadmap, ideas and ready lists point to it. Nothing built; no code changed.
- Ran: `node scripts/check-links.mjs` and `git diff --check`, run by the session after this closeout.
- Not run: typecheck, tests, build, browser suites (docs only). Open: the build (CS2) runs the new-game tier; device checks are named in the definition.

## 2026-10-27 — Keep House A–3 definition (medieval life ML1, docs only)

- [PR #1017](https://github.com/rjdunlap/neo/pull/1017), branch `claude/define-keep-house`: docs only. [Definition](../definitions/keep-house.md) for saved levels 1–4 and a batch plan in `docs/GAME-BATCHES.md`; the study, backlog, recommendations, roadmap, ideas and ready lists point to it. Nothing built; no code changed.
- Ran: `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean).
- Not run: typecheck, tests, build, browser suites, device (docs only). Open: the build (ML2) runs the new-game tier.
