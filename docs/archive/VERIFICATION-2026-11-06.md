# Verification 2026-11-06 (archived entries)

## 2026-11-06 — Mystery Grid (logic-grid) level 5

- [PR #1301](https://github.com/rjdunlap/neo/pull/1301): level 5 *Who, where and what* (school): two 3 x 3 blocks sharing the friend rows, a different-person clue and a hat clue, kite; an 'apart' step in the rule solver; narrower clue cards and a caption strip; `lg.*` voice lines, how-to card.
- Ran (branch tip `a99772bd` on base `54979a97`; port 5580, Vite dev): `npm run typecheck`; `npm test` (all passed after a how-to length fix; logic-grid and how-to tests 72 passed); `BROWSER_SUITE=logicgrid LOGICGRID_FROM=5` PASS (ruled-out yes 1 miss, Help 1 hint, 1024 x 768 and 768 x 1024 fit with targets at least 96 and clear of the pet, bot to the sticker, 1/1 saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=5` PASS (24.1 s). The browser play ran just before the final review fix (caption limited to one clue, how-to wording), which was re-checked by unit tests only.
- Not run: `npm run build` (no shared files or assets), levels 1-4 of the suite (unchanged), the offline check, a real iPad.
- Open: device speech of slotted level-5 lines ([DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-5-2026-11-06)).

## 2026-11-06 — Mystery Grid (logic-grid) level 6

- [PR #1304](https://github.com/rjdunlap/neo/pull/1304): level 6 *This one or that one* (school): one 4 x 4 block with not, either-or and neither-nor clues, a fourth hat, `told()` in the rule solver, `lg.*` voice lines, how-to step; `LOGICGRID_FROM=6`.
- Ran (tested commit `0f0a23ed`, base `e93e08cf`; port 5286, Vite dev): `npm run typecheck`; `npx vitest run src/games/logic-grid src/content src/games/registry` 276 passed (logic-grid 66); `BROWSER_SUITE=logicgrid LOGICGRID_FROM=6` PASS (either-or-ruled-out yes 1 miss, Help 1 hint, 1024 x 768 and 768 x 1024 fit at least 96 units clear of the pet, bot to the sticker, 1/1 saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=6` PASS (31.1 s). The review's caption-overlap nit was fixed and re-played.
- Not run: `npm run build` (no shared files or assets), plays of levels 1-5 (logic unchanged, tests guard their boards), the offline check, a real iPad.
- Open: device speech of slotted either/neither clues ([DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-6-2026-11-06)).

## 2026-11-06 — Mystery Grid (logic-grid) level 7

- [PR #1307](https://github.com/rjdunlap/neo/pull/1307): level 7 *Case file* (grown-up): three linked 4 x 4 blocks, written clue list, a 'link' step in the rule solver, `lg.*` voice lines, how-to step; `LOGICGRID_FROM=7`.
- Ran (tested commit `6aed60f0`, base `c03bbc74`; port 5236, Vite dev): `npm run typecheck`; `npm test` (315 files, 5555 tests, 11 new level-7 rule tests, 80 in the game's file); `npm run build`; `BROWSER_SUITE=logicgrid LOGICGRID_FROM=7` PASS (48 cells, one ruled-out yes counted, one Help hint, landscape and portrait fit at least 64 units clear of the pet, bot to the sticker, saved 1 miss 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid` PASS (levels 1 and 7, 10.1 s and 22.3 s). game-reviewer found no defects.
- Not run: level 8, the offline check, a real iPad. Note: landscape needs 1008 units across, so a side safe-area inset would push the clue column off the edge (not reachable at the 1024 minimum view).
- Open: device speech of slotted written clues (person check).

## 2026-11-06 — Mystery Grid (logic-grid) level 8

- [PR #1310](https://github.com/rjdunlap/neo/pull/1310): level 8 *Who came first?* (grown-up): three 5 x 5 blocks, a time row, 'order' and 'pair' solver steps, the sliding window; `LOGICGRID_FROM=8`.
- Ran (tested commit `e7536148`, base `734291c2`; port 5743, Vite dev): `npm run typecheck`; `npm test` (316 files, 5605 tests, 8 new level-8 rule tests); `npm run build`; `BROWSER_SUITE=logicgrid LOGICGRID_FROM=8` PASS (75 squares, 7-9 clues with order and pair, landscape and portrait fit at 64 clear of the pet, a header drag slides, a hidden square takes no mark, one counted miss, one Help hint in view, bot to the sticker, saved 1 miss 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=8` clean in 27.2 s. Screenshots `test-results/browser/logicgrid/logic-grid-8-landscape.png` and `-portrait.png`.
- Not run: levels 1-7 browser plays (their code moved cells into a body container and headers into strips at zero offset with no mask; unit tests cover rules), the offline check.
- Open: device speech of the slotted level-8 clues and a real iPad slide (person/device, in [DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-8-2026-11-06)).

## 2026-11-06 — Draw the Pattern level 9 Slanting lines

- [PR #1299](https://github.com/rjdunlap/neo/pull/1299): `draw-the-pattern` level 9 (pre-K, order 5, 9, 6, 7, 8): rain `\` lines, then an X becoming a kite or treasure mark; new voice lines, how-to level-9 step, `DRAW_LEVELS` filter in the `drawpattern` case.
- Ran (commit `b333110a`; port 5309, Vite dev): `npm run typecheck`; `npm test` (314 files, 5440 tests; level-9 rule tests: diagonals at least 0.4 in x and y, the X crosses once, X rings at least 2 ring radii apart in every view, order 5 to 9 to 6, both pictures reachable); `BROWSER_SUITE=drawpattern DRAW_LEVELS=9` PASS (two strays: 1 miss, glow, 1 hint, finish, picture screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=draw-the-pattern FINGER_LEVELS=9 FINGER_BAND=prek` PASS; a probe screenshot of the kite and treasure pictures.
- Not run: `npm run build` (no shared files or assets), other levels' browser plays (unchanged), a real iPad.
- Open: a four-year-old's finger on the short slanting lines ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-06 — Draw the Pattern level 10 Dot to dot

- [PR #1306](https://github.com/rjdunlap/neo/pull/1306): `draw-the-pattern` level 10 (lap order 1, 10; toddler order 1, 10, 2, 3; `entryLevels: [10]`): six dots at least 120 units apart on a long line then a zigzag, tap or drag to draw, no misses or hints; voice line, how-to step, ghost finger on the dots, `DRAW_LEVELS=10`. A review found a picture tap during the dot tween restarting the pet's redraw; fixed by one guard.
- Ran (Vite on http://localhost:5802): `npm run typecheck`; `npx vitest run src/games/draw-the-pattern` 48 passed (11 new level-10 tests: spacing and hit circles in four views, order, `nextDot` walk, pools reached, voice, `stepLevel` toddler 10 to 2 and lap 1 to 10); `src/content` and `src/games/registry` 210 passed; `BROWSER_SUITE=drawpattern DRAW_LEVELS=10` PASS (lap in portrait with a stray tap and drag, no misses; taps; one drag along the zigzag; portrait screenshot; toddler round, then level 2); `BROWSER_SUITE=fingerdemo FINGER_ONLY=draw-the-pattern FINGER_LEVELS=10` PASS (9.0 s, lap).
- The picture-tap guard came after the browser runs (unit tests re-run only).
- Not run: `npm run build` (no shared files or assets), other levels' browser plays, a real iPad.
- Open: whether a one-year-old taps the shining dot and the 120-unit dot suits her finger ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-06 — Crossword level 4 Say what it is

- [PR #1300](https://github.com/rjdunlap/neo/pull/1300): `crossword` level 4 (school 2-4): 15 drawn picture words with riddles, one four-word criss-cross, speaker clue squares (free riddle), Show me (one hint, once per word), level-4 how-to lines, a `FROM_LEVEL` filter on the browser suite.
- Ran (branch tip before docs, base `42dc4dc0`; port 5684): `npm run typecheck`; `npm test` (314 files, 5448 tests); `BROWSER_SUITE=crossword FROM_LEVEL=4` PASS (speaker tap free, Show me 1 hint once, wrong full word 1 miss, Show me, bank and Help clear in landscape and portrait, sticker with 1 miss, 1 hint; screenshot `crossword-4-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=crossword FINGER_LEVELS=4` PASS (33.9 s). game-reviewer fixes: three ambiguous riddles (moon, hen, boat); a dimmed Show me repeats the word.
- Not run: build (no assets), levels 1-3 replay (unchanged), the offline check, a real iPad.
- Open: device speech of the riddles ([device check](../DEVICE-CHECKS.md)); riddles are mostly animal-sound clues, so the difficulty is the spelling.

## 2026-11-06 — Helper House levels 5–7 definition (docs only)

Changed: `docs/definitions/helper-house.md` (new "Levels 5–7 (RA4)" section), READY (the definition line replaced by the level 5 build and a queued levels 6–7 line), the robots-automation dive and STUDY-BACKLOG (PR #1302). Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs tier). Open: nothing built; the level 5 build is next.

## 2026-11-06 — Rain Garden levels 1–3 (weather-water slices 2–3)

Changed: new game `rain-garden` (Tinker Lab's 26th; PR #1303, commit b2121326 on base 94612892), its `raingarden` browser suite, pinned land-count tests. Source check: EPA CADDIS "Urbanization – stormwater runoff" (impervious surfaces cut infiltration and raise runoff) and USGS Water Science School runoff and infiltration pages (soil like a sponge, saturated or paved ground sheds water downhill) support the toy model; real soaking is slower and depends on wetness, as the how-to note says. Ran: typecheck; full `npm test` 315 files / 5,508 tests before the reviewer-fix commit (afterwards 45 rain-garden rule tests and typecheck); `npm run build`; `BROWSER_SUITE=raingarden` (levels 1 toddler, 2 in portrait, 3; 0/0, 0/4 bookmark, leaf 0/1); `fingerdemo` `FINGER_ONLY=rain-garden` (level 1 toddler 6.6 s, level 3 school 17.3 s); one portrait screenshot at level 2; game-reviewer pass, fixes applied. Not run: offline check, other suites. Open: four device and person checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#rain-garden-levels-13-weather-water-slices-23-2026-11-06)).

## 2026-11-06 — Helper House level 5 Where does it look? (RA4)

Changed: `helper-house` level 5 (school only, range 2–5; sun sensor under the lamp reads the lamp's own light, only the roof works), voice lines `hh.instruct.5`, `hh.lamp-flickers`, `hh.help.sensor.5`, how-to step, `HH_LEVELS=5` in the `helperhouse` case ([PR #1305](https://github.com/rjdunlap/neo/pull/1305), base `5d14de16` plus branch commits).
Ran: `npm run typecheck`; `npm test` (315 files, 5530 tests; Helper House `logic.test.ts` 45 tests, 9 new for level 5: per-socket readings, hand-run traces, exactly roof accepted over 4 boards, overlap, failures, glow and help, ghost finger, socket spacing at least 140); `GAME_URL=http://localhost:5206 BROWSER_SUITE=helperhouse HH_LEVELS=5` (flicker twice, one hint and sensor glow, drag to shed, portrait screenshot, Show me to roof, finish 0 misses/2 hints); `FINGER_ONLY=helper-house FINGER_LEVELS=5 FINGER_BAND=school` (19.1 s). `game-reviewer`: no blocking findings.
Not run: `npm run build` (CI runs it), other suites, `world`, offline check.
Open: whether the flicker reads as the lamp's own fault on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md#helper-house-level-5)).

## 2026-11-06 — Helper House levels 6–7 The comfy line and Calm heater (RA4)

Changed: `helper-house` levels 6–7 (school range 2–7; the gauge line, the guess and truth line, the two lines and the click jar), voice lines `hh.*`, how-to steps, ghost finger, `HH_LEVELS=6,7` in the `helperhouse` case ([PR #1311](https://github.com/rjdunlap/neo/pull/1311), tip `813c0c0b`).
Ran: `npm run typecheck`; `npm test` (316 files, 5619 tests; Helper House `logic.test.ts` 59 tests, which also corrected two claims in the definition); `GAME_URL=http://localhost:5981 BROWSER_SUITE=helperhouse HH_LEVELS=6,7` (level 6 hare guess, glow, one hint, drag to gap 2, Show me to 3, finish 0/2; level 7 eleven pebbles, off line glows, a tap above, a portrait screenshot, Show me to off 4, finish 0/2; rerun after the review fixes); `FINGER_ONLY=helper-house FINGER_LEVELS=6,7` (6 in 10.8 s, 7 in 18.7 s); `npm run build`. `game-reviewer`: three fixes applied (truth line awaited, glow redraws yellow at once, the guess closes when the line moves).
Not run: other suites, the offline check.
Open: whether a six-year-old reads the jar as fewer clicks, and whether the guess, truth line and climb strip land on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md#helper-house-levels-67)); the science-educator read of the warmth wording.

## 2026-11-06 — Crossword levels 5-6 Written clues and The mini

- [PR #1308](https://github.com/rjdunlap/neo/pull/1308): `crossword` grown-up levels 5-6 (`grown.ts`, `grownup.ts`, `clues.ts`), A-Z keyboard, 44 clued words, six frozen minis, voice lines `cw.five`/`cw.six`/`cw.clue`/`cw.circled`/`cw.solved`, how-to card widened.
- Ran (tip `2bdbc023`; port 5575, `VITE_SPEECH=off`): `npm run typecheck`; `npm test` (316 files, 5,594 tests; new `grown.test.ts`, 39 rule tests: data and clues, the generator never fails over about 200 seeds per theme, minis fully checked and symmetric, numbering, typing, the judging re-check rule, Help solves any grid); a one-off Playwright probe at level 5 landscape 1024 x 768 and level 6 upright 768 x 1024 (wrong full grid 1 miss with the square circled, retype re-checked once for 2 misses, Help finished the round, hardware typing and Backspace worked, no page errors; screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=crossword FINGER_LEVELS=5,6` PASS (37.0 s, 51.3 s).
- Review: `game-reviewer` found hardware keys unguarded; fixed.
- Not run: `npm run build`, the levels 1-4 suites (unchanged path), a `crossword` suite case for levels 5-6, the offline check.
- Open: device speech of the clues and a hardware keyboard on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md#crossword-levels-1-2-2026-11-05)).

## 2026-11-06 — Mossy Path levels 4–7 find the way (PP1)

- [PR #1312](https://github.com/rjdunlap/neo/pull/1312): `mossy-path` levels 4–7 (three frozen hedge mazes each, tree logic, grid pad with tap and drag stepping, walk-back, berry at level 7), bands toddler 4, preschool 4–5, pre-K 5–6, school 1–7; `entryLevels` 4, 5, 6; voice lines `moss.maze`…`moss.hint-maze`; how-to card scoped by level.
- Ran (server http://localhost:5448, `VITE_SPEECH=off`): `npm run typecheck`; `npx vitest run src/games src/content` (all pass; `mossy-path` logic tests 14/14, 11 new); `BROWSER_SUITE=mossypath` PASS (levels 1 and 3 unchanged; level 4 one slide, 0 misses; level 7 wrong-branch miss, free re-entry, Hint counted once, berry then pond, sticker; portrait cell at least 100 and screenshot; land launch/home return); `BROWSER_SUITE=fingerdemo FINGER_ONLY=mossy-path FINGER_LEVELS=4,7` PASS (6.2 s toddler, 16.2 s school).
- Not run: `npm run build` (no shared files or assets), the offline check, other suites.
- Open: iPad drag feel, device speech, a child's play ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the turtle's head-turn toward a far tap is not drawn.

## 2026-11-06 — Rain Garden level 4 definition (docs only)

Changed: `docs/definitions/rain-garden.md` (new "Level 4, two-socket downhill route" section), READY (definition line replaced by the level 4 build), the weather-water dive and STUDY-BACKLOG (PR #1313). Source check: EPA green-infrastructure types and USGS runoff pages, opened this session. Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs tier). Open: nothing built; the level 4 build is next.

## 2026-11-06 — Define Bond Beads 5–8 (docs only)

Changed: `docs/definitions/bond-beads.md` (new "Levels 5–8" section), chemistry dive slice 4, RECOMMENDATIONS row, READY (definition line replaced by the levels 5–6 build, levels 7–8 queued) and STUDY-BACKLOG (PR #1314). Source check: PubChem CIDs 962, 222, 297, 783, 977 and 280 via PUG REST; reactions from Wikipedia as secondary sources (Methane page read in part). Ran: `node scripts/check-links.mjs`, `git diff --check`, and a throwaway vitest layout probe (not committed): `beadLayout` fits 6–7 beads everywhere, 8 nowhere, 9 only in portrait. Open: nothing built; level 8's 9-bead case needs a layout fix or is cut; no device or person check.

## 2026-11-06 — Define Welcome Ways 5–7 (docs only)

Changed: `docs/definitions/welcome-ways.md` (new "Levels 5–7" section and check tier), the engineering-design dive slice 2, READY (definition line replaced by the levels 5–7 build) and STUDY-BACKLOG (PR #1315). Ran: `node scripts/check-links.mjs` and `git diff --check`. No code checks (docs tier). Open: nothing built; the levels 5–7 build is next.

## 2026-11-06 — Rain Garden level 4 two-socket downhill route (weather-water slice 4)

Changed: `rain-garden` level 4 (PR #1316, commits 4ffe7b67 and e7ec3b28 on base 8c0b18e7): level-4 model in `logic.ts`, new scene `route.ts`, two art pieces, new voice lines, how-to steps, the `raingarden` browser case (`FROM_LEVEL`, level-4 portrait block). Ran: `npm run typecheck`; full `npm test` 316 files / 5,656 tests (72 rain-garden rule tests: conservation, outcome table, judge equals solutions, causes, seeded starts over all 12 variant/start/side combinations, hints strictly closer within two steps, accounting, bot from every start, layout in 4 views with 2 marked beds and mirror); `npm run build`; `BROWSER_SUITE=raingarden FROM_LEVEL=4` (port 5321) before and after the review fix: try, wrong Check 1 miss, same arrangement again no miss, Show me flips the top bed 1 hint, flip the low bed, Check passes, saved [1,1]; portrait screenshot `test-results/browser/raingarden/rain-garden-4-portrait-wrong-check.png` reviewed; `fingerdemo` `FINGER_ONLY=rain-garden FINGER_LEVELS=4` (21.6 s). `game-reviewer` pass, two findings fixed. Not run: levels 1-3 browser blocks (unchanged code, earlier evidence reused), offline check. Open: three device and person checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#rain-garden-level-4-weather-water-slice-4-2026-11-06)).

## 2026-11-06 — Bond Beads levels 5–6 (chemistry slice 4)

Changed: `bond-beads` levels 5–6 (N bead, named cards, double holds; PR #1317, tested at 282a3df0 plus the README edit, server http://localhost:5335). Ran: `npm run typecheck`; full `npm test` (116 bond-beads tests: levels 5–6 enumeration, names, doubles, hints over every reachable state, 500 random sequences, layout 2–7 beads); `npm run build`; `BROWSER_SUITE=bondbeads BOND_LEVELS=5-6` (level 5 water first, N bead, one miss and one hint; level 6 oxygen double by two carries, one tap halves it, carbon dioxide portrait screenshot, 0/0); `BROWSER_SUITE=fingerdemo FINGER_ONLY=bond-beads FINGER_LEVELS=5,6` (27.7 s, 29.7 s). Source re-check: PubChem PUG REST for the six molecule CIDs matched the definition. `game-reviewer`: no blocking issues.
Open: no iPad, device speech or child check ([DEVICE-CHECKS](../DEVICE-CHECKS.md#bond-beads-levels-56-chemistry-slice-4-2026-11-06)); offline not run; levels 7–8 not built.

## 2026-11-06 — Welcome Ways levels 5–7

Changed: `welcome-ways` school range 3–7: kind-tagged sockets, switchback board (level 5), side strips with Teeter and Duck (6–7), repair ties prefer the design that meets the stop socket's need, voice, how-to, ghost finger, `WELCOME_ONLY=deep` (PR #1318, commit 99b5ca07 on origin/main dfc82771, Vite dev on :5998 with `VITE_SPEECH=off`).
Ran: `npm run typecheck`; `npm test` (316 files, 5,695 tests) including new enumeration (27/81/81), walker, hint-from-every-design at levels 1–7, accounting and layout fit at four views with insets; `npm run build`; `BROWSER_SUITE=welcomeways WELCOME_ONLY=deep` (Bear at the small landing, one hint, Duck under two rails, Teeter on two ramps, supported finishes; screenshots level 5 landscape, level 6 landscape and portrait); `BROWSER_SUITE=fingerdemo FINGER_ONLY=welcome-ways FINGER_LEVELS=5,6,7` (18.5 s, 30.6 s, 26.1 s). `game-reviewer`: no defects.
Not run: `WELCOME_ONLY=play`/`routes` (levels 1–4 unchanged, their unit tests pass untouched) and the offline check. Open: iPad, device speech for "Teeter" and "perch", drag comfort on the wide strips, and whether a six-year-old reads the rail/perch conflict from the pictures ([device check](../DEVICE-CHECKS.md)).

## 2026-11-06 — Swing Pals deep dive (docs only)

Changed: `docs/deep-dives/swing-pals.md` and its tracker, READY, backlog and waiting-on-developer rows (PR #1319); no code. Ran: `node scripts/check-links.mjs`; `git diff --check`. Open: nothing built; three decisions wait on the developer ([list](../WAITING-ON-DEVELOPER.md)).

## 2026-11-06 — Hat Band levels 1–3 (new game, music M5)

Changed: new game `hat-band` (Music Mountain's eighth; PR #1320, commit 578490ab on base origin/main 8971c43a): `logic.ts` score clock and wear/solo/heard-gate rules, scene, voice lines, how-to card with ghost finger, registry/lands entries, `hatband` browser case, one Kokoro clip (`game.hat-band`). Source check (S1): the only spoken or how-to claims are that drum hats play a beat without notes and tune hats play notes, checked against the definition's cited Toca Band, BANDIMAL and Musical Me! reviews and enforced by the role-difference rule test; no other factual claims.
Ran (Vite dev on http://localhost:5282, `VITE_SPEECH=off`): `npm run typecheck`; hat-band rule tests 34/34; registry, lands, howto, content and voice-clip tests (21 files, 248 tests); `npm run build`; `BROWSER_SUITE=hatband` (level 1 landscape: empty-stage Done, drag, tap-then-tap, early Done while a part joins, heard gate, bow, one sticker 0/0; level 3 portrait: replace, both spotlights, alone then together, 0/0; screenshots `hat-band-1-landscape`, `hat-band-3-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=hat-band FINGER_LEVELS=1,2,3` (14.7 s, 20.7 s, 21.5 s). `game-reviewer` findings (tap judged by hat travel, dim hat on the rack, repeated hat naming) fixed and both suites re-run green. Full `npm test` showed only timing failures in unchanged games (penguin-slide, secret-code; block-garden, block-topple, fluffy-salon, keep-house under load average about 8 and passing alone): known load flakes.
Not run: offline check (no persistence change). Open: iPad speaker, speech and a child's reading of the hats ([device checks](../DEVICE-CHECKS.md)). Deviation: a hat counts as heard alone when it is the only part sounding for a whole loop, solo or not.

## 2026-11-06 — Define Gadget Bench level 4, Fix-It Day (docs only)

Changed: Gadget Bench definition gained level 4 (a longer three-condition path with a bump/puddle conflict, fixed by a new paddle-wheels part; school range becomes {2,4}) and its check tier; READY, the inventions and engineering-design dives and the study backlog updated.
Ran: `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean). No code checks (docs tier).
Open: the build (new level on the existing interaction, `fingerdemo` at 4) is queued in READY; decision 5 in the definition has defaults, not blockers.

## 2026-11-06 — Gadget Bench level 4, Fix-It Day (PR #1330)

Changed: new level 4 in `src/games/gadget-bench/` (paddle wheels, yesterday's cart under a faded path, uncounted conflict line, same-condition glow, scene, voice lines, how-to; school range 2–4) and the `BENCH_LEVELS` filter on the `gadgetbench` browser case. Tested commit 7ad01ae9.
Ran: `npm run typecheck`; `npx vitest run src/games/gadget-bench src/games/registry src/content/howto` 95 passed; `BROWSER_SUITE=gadgetbench BENCH_LEVELS=4` passed on Vite at http://localhost:5977 (free Try stops at the new puddle, the float stops at the bump with the conflict line spoken once and uncounted, a failing Give one miss, help names the paddle wheels, paddle wheels pass, rounds 2–3 built and given, saved [1 miss, 0 hints]) with one portrait screenshot; `BROWSER_SUITE=fingerdemo FINGER_ONLY=gadget-bench FINGER_LEVELS=4 FINGER_BAND=school` passed (46.9 s).
Not run: `npm run build` (only the game folder, voice script and how-to changed); levels 1–3 browser replay (unchanged; rule tests show level 1–3 help and `runPath` unchanged).
Open: device checks (two stops at one socket as a conflict; how the iPad says "paddle wheels") are in [DEVICE-CHECKS](../DEVICE-CHECKS.md#gadget-bench-levels-13-inventions-i2-2026-10-27).
