# Verification 2026-11-03 (archived entries)

## 2026-11-03 — Orchard Rows deep dive (docs only)

- [PR #1133](https://github.com/rjdunlap/neo/pull/1133), branch `ccr-73906eb2-r3nm6v`: [dive](../deep-dives/orchard-rows.md). Fresh orchards and baskets queued ([batch](../GAME-BATCHES.md#orchard-rows-2-fresh-orchards-and-baskets)); levels 7–9 *a path through the orchard* (distributive property, the split at ten) queued as a definition. Tracker, READY, batches, backlog, IDEAS, roadmap and the estimation study's E4 pointer updated; the last unstarted game dive.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the batch and the definition.

## 2026-11-03 — Picture Graph fair meadows, a visible first pick and hints that show why (picture-graph batch 1)

- [PR #1138](https://github.com/rjdunlap/neo/pull/1138): fair single-critter placement, the level-4 lift, the taller-bar distractor, why-hints (dashed line and glowing blocks), `bear`, seeded meadows.
- Ran: typecheck; picture-graph rule tests, 19 passed (placement sweep, 4 views by 300 seeds; taller distractor; `sameTap`/`sameHint`; `whyBlocks`; bear; bot same path); `src/content` and registry tests, 190 passed; build; `BROWSER_SUITE=woods WOODS_ONLY=graph FROM_LEVEL=4` levels 4–7 passed on http://localhost:5353 (level 4 double tap free; level 7 taller pick and a second wrong answer, misses/hints 4/2, why-hint screenshot).
- Not run: `fingerdemo` (bot taps unchanged), browser play of levels 1–3, offline.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): does the lift read as "picked"; does the dashed line explain "more".

## 2026-11-03 — Picture Logic fresh pictures and named hints (picture-logic batch 1)

- [PR #1139](https://github.com/rjdunlap/neo/pull/1139): eight easier and eight harder 10 by 10 pictures and five 15 by 15, banks split by measured passes; fill/cross hints carry a reason (`done`, `full`, `overlap`, `fits`) with five voice lines (device speech, no clips).
- Ran (code a1e79178 plus review fix 9cc44bf8): typecheck; `npm test` 297 files / 4493 tests passed; picture-logic and content tests 197 passed after the fix (bank sizes, unique drawings, pass split, every named reason holds on its line, a mutation failed the overlap test); one scripted level-2 play on http://localhost:5937 at 1024x768 (one hint gave a `full` reason with its banner line, then to the sticker, 0 misses / 1 hint, no page errors); one portrait 768x1024 level-4 screenshot (longest overlap line fits in two lines above the paper).
- Not run: `fingerdemo` (bot unchanged), build (no assets), couch suites (couch untouched), a registered browser suite (the play was a one-off probe).
- Open: no spoken clips rendered for the new lines; a real device speech check.

## 2026-11-03 — Pond Conga duck-friendly food and a seeded bank (pond-conga batch 1)

- [PR #1140](https://github.com/rjdunlap/neo/pull/1140): each round has a seeded duck food (peas, sweetcorn or oats, `foodArt`) and a reed bank edge from `pondLook` (reads a clone of the RNG, so ponds are unchanged); a course's ponds cycle the food; voice, how-to, couch catalog and Crumb Trail card wording lost bread. No new level.
- Ran (commit 34d448d2): typecheck; `npm test` 4497 passed (pond-conga rule tests: seeded look, pond unchanged by the look, all foods and edges appear, course food cycle); `npm run build`; `BROWSER_SUITE=congatouch` on http://localhost:5609 (levels 1 and 6, a bump, a hint, Start over, a sticker each); portrait 768x1024 screenshots of pea, sweetcorn and oat ponds with reeds on different edges reviewed.
- Not run: `fingerdemo` (bot unchanged), couch suites (couch logic unchanged).
- Open: how the food art reads on an iPad and the TV ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Quick Tricks truthful accounting, a seeded cast and a bow (quick-tricks batch 1)

- [PR #1141](https://github.com/rjdunlap/neo/pull/1141): a leaf below the friend is free at level 1; show one has a seeded friend, crosser (new snail and ladybug) and monster colour with per-critter lines; show two has seeded `Critter` friends, a mailbox flag, cheers, a berry gulp, no yellow arrow at Picnic Places, a ten-second nudge and a cast bow. No new level.
- Ran (commit 1cfc6ba2, base 87ae28a1, Vite on http://localhost:5558, `VITE_SPEECH=off`): typecheck; `src/games/quick-tricks` and `src/content` 20 files / 178 tests; `BROWSER_SUITE=next NEXT_ONLY=tricks` levels 1–6 (level 1 now 2/1, show two 4/2, waits for the bow; re-run `FROM_LEVEL=4` passed after the review fixes); `BROWSER_SUITE=fingerdemo FINGER_ONLY=quick-tricks FINGER_LEVELS=1,4` clean 18.9 s and 24.7 s; portrait probe screenshots of the mailbox with its flag up and the level-6 picnic critters, and suite screenshots of both bows; `npm run build`.
- Not run: the full unit suite (CI), the offline check, device or child checks.
- Open: the free low leaf, the hidden yellow arrow and show-two critter readability ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Read & Do fresh words and pictures (read-do batch 1)

- [PR #1142](https://github.com/rjdunlap/neo/pull/1142): level 1 draws three of five colours (red, blue, yellow, green, pink) with seeded hats; level 2 is three rounds (big, small, a seeded third) on a seeded animal from duck, cat, pig and dog; level 3 plays all four sentences for a seeded pair of animals; 15 words, new voice lines green, pink, pig, dog (device speech). No new level.
- Ran (commit 4c6ed7ac, Vite on http://localhost:5371, classic): `npm run typecheck`; read-do rule tests plus content and registry tests 196 passed; `npm run build`; `BROWSER_SUITE=readdo READ_LEVELS=1,2,3` passed (signs seen: level 1 red/pink/yellow, level 2 small pig/big cat/small dog, level 3 cat+pig; two misses, one hint, a sticker each level). A first run was killed by an HMR reload from a mid-run edit, not a code failure. `game-reviewer` found no code issues.
- Not run: `fingerdemo` (bot unchanged), the offline check, device speech for the new words.
- Open: iPad speech for green, pink, pig and dog and a child's reading ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Rhyme Time fresh families: bug, sock and snail (rhyme-time batch 1)

- [PR #1143](https://github.com/rjdunlap/neo/pull/1143): seven new code-drawn pictures plus `rock` and `pail` from the shore art; families ug, ock and ail (38 pictures, fifteen families, eight three-word families); riddle pool re-pinned 102 to 178; an `ARGUABLE` guard keeps arguable fits from being the neutral or mate. No new level.
- Ran: `npm run typecheck`; `npx vitest run src/games/rhyme-time` 13 passed (the guard test fails with the old neutral rule restored); `BROWSER_SUITE=woods WOODS_ONLY=rhyme FROM_LEVEL=4` on http://localhost:5299 passed at commit 1ffda591 (first shelf mug rug bug dish; the later `ARGUABLE` change does not touch odd mode); a one-off probe screenshot of all nine pictures looked right.
- Not run: `fingerdemo` (bot unchanged), `npm run build`, the full unit suite.
- Open: a child's reaction to the new pictures ([DEVICE-CHECKS](../DEVICE-CHECKS.md) if wanted; none added).

## 2026-11-03 — Secret Code fair rows, a hint that keeps up and three doors (secret-code batch 1)

- [PR #1144](https://github.com/rjdunlap/neo/pull/1144): misses count only from past tries still drawn above the door (level 7 only the shown clues); the faint-stone hint is redrawn after every later try with no new hint; gray reads "no more of that stone"; seeded door, gate or chest per door. No new level, bot unchanged.
- Ran: `npm run typecheck`; `npx vitest run src/games/secret-code src/content` 177 passed (hidden-row, refreshed-hint and door tests); one scripted level-5 landscape play on http://localhost:5798/classic/ at 32ba685c: tries 1-5 gave misses 0,0,0,0,1 (try 5 repeated on-screen try 2), try 6 repeated scrolled-away try 1 with no miss, try 7 opened; second door one on-screen repeat miss, then to the sticker, no page errors; portrait screenshots of the gate and chest.
- Not run: `fingerdemo` (bot unchanged), `npm run build`, the full unit suite (CI runs it), device or child checks.

---

## 2026-11-03 — Shape Buddies what grows: three seeds and sprouts (shape-buddies batch 1)

- [PR #1145](https://github.com/rjdunlap/neo/pull/1145): art only; each round draws a seeded bean, sunflower seed or acorn with its own sprout via `looks(rng)` (friend colours unchanged); bot, rules, voice and how-to card unchanged.
- Ran: `npm run typecheck`; shape-buddies rule tests and `src/content` tests, 185 passed (colours unchanged over 200 seeds, all three kinds appear); one-off Playwright probe on a dev server at http://localhost:5206 (base `5176da36` plus branch): level 1 at prek, portrait 768 by 1024, one failing Try (no miss), then the bot's intents to the sticker on acorn and sunflower rounds, misses 0, hints 0, one sticker; portrait screenshots of the sunflower seed at start and its sprout. `game-reviewer`: no defects.
- Not run: `npm run build` (no shared files or assets), `fingerdemo` (bot unchanged), device or child checks.
- Open: whether the three seeds read as different on the iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

---

## 2026-11-03 — Sing-Along Barn Twinkle and Wheels on the Bus (sing-along-barn batch 1)

- [PR #1146](https://github.com/rjdunlap/neo/pull/1146): two new tunes (ten in all); Twinkle uses the own-notes exception (`Phrase.semitones`, `OWN_NOTES`, `sfx.marimbaMidi`, guarded by a test); the short Wheels on the Bus is all pentatonic; level 5–6 chooser is ten cards in two rows; voice lines and how-to card updated.
- Ran, base origin/main `d0b2d458` plus the branch, server http://localhost:5940: `npm run typecheck`; full unit suite, 297 files, 4520 tests; `BROWSER_SUITE=singalong SING_ONLY=tunes` (a Wheels round at level 1, then ten cards upright at level 5 with Twinkle chosen and sung through 3 verses, one sticker each, 0 misses, 0 hints; portrait screenshot `test-results/browser/singalong/sing-along-barn-5-ten-cards-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sing-along-barn FINGER_LEVELS=5` (53.4 s); `npm run build`.
- Not run: the full `singalong` suite (other tunes and levels unchanged), device and child checks.
- Open: fa on the iPad marimba and a grown-up singing along to both tunes ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

---

## 2026-11-03 — Sink or Float fresh things (sink-float batch 1)

- [PR #1147](https://github.com/rjdunlap/neo/pull/1147): five new things (feather, marble, log, ice cube, paper clip; obvious pool 7, full pool 14) with art, journal entries and voice lines; property tests replace the pinned-draws test.
- Ran: `npm run typecheck`; full unit suite, 297 files, 4522 tests; `BROWSER_SUITE=fourth FOURTH_ONLY=sink-fresh`, server http://localhost:5262 (level 4 round rock, marble, boat, duck, ball with two wrong sorts and the glow, 2 misses/1 hint; level 6 round feather, ice, boat, marble, rock, ball, guesses, sticker); portrait screenshot reviewed. A game-reviewer pass found no defects.
- Not run: `npm run build` (CI runs it on the PR), `fingerdemo` (bot unchanged), couch level 6 (same slot), the marble recolour was not re-shot.
- Open: do "ice cube" and "paper clip" sound right in device speech, and a child's reaction ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

---

## 2026-11-03 — Sudoku Garden a 4 by 4 bed to start (sudoku-garden batch 1)

- [PR #1148](https://github.com/rjdunlap/neo/pull/1148): level 7 (`Size` 4 with 2 by 2 boxes, 10 blanks, grade 1, `order` `[7, 1, 2, 3, 4, 5, 6]`, `entryLevels: [7]`); couch, how-to card and voice unchanged.
- Ran (tree at the branch commit, server http://localhost:5662): `npm run typecheck`; `npx vitest run src/games/sudoku-garden` 33 passed (`geometry(4)`; 300 seeds of level 7 unique, 10 blanks, grade 1; hints finish it; a wrong number found by the first hint); registry/content/progress tests 331 passed; `BROWSER_SUITE=sudokutouch SUDOKU_ONLY=7` (4 by 4, a wrong number = 1 miss, erase, one hint, 64-unit targets both ways, one sticker, history level 7 misses 1 hints 1; portrait screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=sudoku-garden FINGER_LEVELS=7` (30.3 s). A game-reviewer pass found no code defects.
- Not run: full unit suite, `npm run build` (no shared files or assets), `sudokutouch` levels 1 and 6 (unchanged), `couchgames` (couch untouched).
- Open: the four tray tiles sit in the three-column grid (4 alone on a second row); iPad feel of the 4 by 4 entry ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

---

## 2026-11-03 — Treasure Map fresh maps and true hints (treasure-map batch 1)

- [PR #1149](https://github.com/rjdunlap/neo/pull/1149): seeded level 1 headers (`headersFor`) and map dressing, level 4 first-leg hint (`map.stepshint`), level 5 `map.cluehint`, how-to level-3 tap step; finds, bot and couch boards unchanged.
- Ran (tree at the branch tip on base 447bcdf4, server http://localhost:5269): `npm run typecheck`; `npx vitest run src/games/treasure-map` 8 passed (4 new); `npx vitest run src/content` 168 passed; `BROWSER_SUITE=woods WOODS_ONLY=map` levels 1-5 passed (two wrong digs, one hint each, sticker), level-1 portrait and level-4 hint screenshots reviewed; `npm run build` passed; game-reviewer found no defects.
- Not run: `fingerdemo` (bot unchanged), couch suites (boards unchanged), device speech of the new lines (no rendered clips; device speech fallback; [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Word Search fresh themes and root families (word-search batch 1)

- [PR #1150](https://github.com/rjdunlap/neo/pull/1150): six everyday themes, root families *port* and *spect* drawn only for plans they fill (`themesFor`), the root line once per grid, RAIN out of weather.
- Ran (base 123c2df6, Vite http://localhost:5650/classic/, VITE_SPEECH=off): `npm run typecheck`; `npx vitest run src/games/word-search` 19 passed; `npx vitest run src/content src/audio` 184 passed; `npm run build`; one level-1 play (probe `test-results/ws-root-probe.mjs`, root theme forced by seed): one wrong line, five words, root line said once, sticker, no page errors, landscape screenshot reviewed; game-reviewer found no defects.
- Not run: full unit suite, `fingerdemo` (bot unchanged), `wordsearchtouch`, couch suites, device speech of "spect" (open in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Sprout Shuffle level 5 Hidden Sprouts (genetics G6)

- [PR #1151](https://github.com/rjdunlap/neo/pull/1151): the covered-plant case with a plain tester, every fitting candidate accepted, "both" as a right answer, counterexample fan, glow and Show me, a free Try one; `school` range 1–5.
- Ran (tested commit 34e7f833, base 5177ea40, Vite http://localhost:5963): `npm run typecheck`; `npm test` 297 files / 4548 tests passed (before the review fixes; sprout and content tests, 209, passed after them); `npm run build`; 12 new rule tests (41 in the sprout-shuffle logic file).
- Ran: `BROWSER_SUITE=sproutshuffle SPROUT_LEVELS=5` in both cases (Aa then AA, after the review fixes): water, two wrong Checks (fan, glow hint), Show me, both-could, a free Try one, water again, finish, saved 2 misses / 2 hints; portrait and landscape screenshots reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=sprout-shuffle FINGER_LEVELS=5` clean 17.4 s. A game-reviewer pass was made and its findings fixed.
- Not run: device or child checks (whether a ten-year-old reads "both could" as a right answer, rings against spots on the iPad label, device speech of the new lines; [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Ramp Race level 7 What can we tell? (inquiry Q5)

- [PR #1152](https://github.com/rjdunlap/neo/pull/1152): claim tiles over two shelf cards, wrong-claim part pulse, confounded repair replacing card B; `tellLayout(view)`; school range 1–7; voice `ramp.tell.*`/`claim.*`/`why.*`, how-to level 7.
- Ran (head e96cc95d, base 507e8906, Vite http://localhost:5773): `npm run typecheck`; `npx vitest run src/games/ramp-race src/content src/games/registry` 20 files, 217 tests (ramp-race 27); `BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=6 TO_LEVEL=7` (level 7: nudge with no tile, free tile changes, two wrong claims then the tile glow, locked blue lane, a confounded repair miss, the fair repair, score [3,1], sticker; level 6 regression); `BROWSER_SUITE=fingerdemo FINGER_ONLY=ramp-race FINGER_LEVELS=7` 19.9 s; portrait screenshot reviewed. `game-reviewer` findings fixed.
- Not run: `npm run build` (only voice-script and how-to shared files changed), full `npm test` (CI), device or child checks.
- Open: whether a child reads the tiles as "only this changed", treats "we can't tell" as an answer, and device speech of "can't" ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Robot Path level 14 Mend the loop (dive slice 7)

- [PR #1153](https://github.com/rjdunlap/neo/pull/1153): `MEND_PLANS` (three looped repair boards, two mended by the loop count, one by a body slot), `repairPress` glow for levels 12 and 14, school range 4–14, voice `robot.mend`/`robot.mend.hint`/`robot.fix.clear`, how-to `from: 14`, `robot` suite plays 1–14.
- Ran (commit ddc1eeaf, Vite http://localhost:5601, VITE_SPEECH=off): typecheck; vitest `src/games/robot-path` (19 rules: single edit, at least half by loop count, glow leads to the star from broken, after Clear and after a wrong edit) and `src/content` + `src/games` (registry range 14); `BROWSER_SUITE=robot FROM_LEVEL=14 TO_LEVEL=14` (loop-count board: free watch, unchanged run, wrong mend, glow on Clear, mended loop; portrait screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=robot-path FINGER_LEVELS=14 FINGER_BAND=school` in 8.9 s. game-reviewer: no blocking defects; Clear-hint wording fixed.
- Not run: build (no shared files or assets), other levels' robot play, couch (stays 4–6), device or child checks.
- Open: whether a school child reads a loop well enough to mend it rather than rebuild it ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Peg Garden flaky touch suite diagnosed and fixed

- Changed: reproduced `BATCH_ONLY=pegs` failing 3/3 on 906fa732. Game fixes: aimed shots (levels 4 and 5) now step in the fixed samples that `simulate()`, `aimAt`, the guide and the ghost finger use; a pearl let go during the last praise no longer counts a miss or hint (aimed firing waits for `allReached`). Couch bot settles on its chosen angle. Suite: far drops chosen by simulation, aimed loop stops once every ask is reached.
- Ran (dev server localhost:5761, `VITE_SPEECH=off`, commits ab17b137/45678c3c; 2cfda1b5 only drops an else): typecheck; `npx vitest run src/games/peg-garden src/couch` 100 passed; `BROWSER_SUITE=batch BATCH_ONLY=pegs` levels 1–7 passed 3 times in a row, scores exactly 0,0 / 0,0 / 2,1; `fingerdemo` `FINGER_ONLY=peg-garden FINGER_LEVELS=4,5` 21.0 s / 23.7 s; `BROWSER_SUITE=couchgames COUCH_ONLY=peg-garden` 37 s (failed after the stepping change until the bot fix, passed on old code).
- Not run: build (no shared files or assets), levels 8+ in the pegs suite, iPad or device, a child's play.

## 2026-11-03 — Jelly Drums names, twists and co-play (dive slice 2)

- [PR #1155](https://github.com/rjdunlap/neo/pull/1155): free-play color/size names (`JellyNamer`) and `jelly.lowhigh`, level 2 fan answers, level 3 scale sparkle (`ScaleWatch`, garland twinkle only, no bonus bulb), one added co-play line, how-to steps for levels 2 and 3.
- Ran: typecheck; vitest `src/games/jelly-drums` (21 rules), `src/content` and registry; `BROWSER_SUITE=fingerdemo FINGER_ONLY=jelly-drums FINGER_LEVELS=1,2,3` passed at 89334790 (http://localhost:5441; 28.9, 37.9, 46.6 s); a one-off probe at toddler portrait 768×1024 (level 2: three fan answers in 12 notes; level 3: sparkle on 0-1-2; low-and-high said once; no page errors). game-reviewer's three findings fixed; the review follow-up (a097e025, speech gating) got rule tests only, no browser rerun.
- Not run: build (no shared files or assets), device speech for the color words, a child's reaction.
- Open: per-band co-play lines (shell type change); device checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-03 — Puppet Stage levels 4–6 definition (TP2, docs only)

- [PR #1156](https://github.com/rjdunlap/neo/pull/1156): [definition](../definitions/puppet-stage-4-6.md) of three story cards, a live shown-only premiere and the batch puppet-stage 2 check tier; nothing built.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Nothing else run.
- Open: the build and its checks; four device and person checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-03 — Bouncy Launch level 8 Near or far (dive slice 4)

- [PR #1157](https://github.com/rjdunlap/neo/pull/1157), code commit 98a3e175: toddler and preschool level 8 (two big clouds, ±0.2 windows, five near/far shots), `entryLevels: [8]`, voice, how-to; `game-reviewer` no findings.
- Ran: `npm run typecheck`; full `npm test` 297 files, 4578 tests; bouncy-launch rule tests and registry tests (a test pins Cloud Hopper's `CLOUDS`); one-off Playwright probe (dev server localhost:5599, `VITE_SPEECH=off`) at toddler in portrait 768x1024 and landscape 1024x768: real drags, two deliberate misses (2 misses, 1 hint, preview on), five landings to the sticker, no page errors; portrait screenshot reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=bouncy-launch FINGER_LEVELS=8` clean 18.5 s.
- Not run: `npm run build` (CI builds), couch suites (unchanged), any device.
- Open: whether a toddler or preschooler drags a little versus a lot, and the clouds read as targets ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Orchard Rows fresh orchards and baskets (batch orchard-rows 2)

- [PR #1158](https://github.com/rjdunlap/neo/pull/1158), code commit 1d8fee7e: level 1–3 pools widened (2×2, 4×2, 4×3, 5×2, 4×4, 5×3, all within 5×5), level 2 never pairs a shape with its turn, level 4's second basket draws 14 or 21 too; `game-reviewer` no findings.
- Ran: `npm run typecheck`; `npx vitest run src/games/orchard-rows` 23 passed (pools, level 2 pairing and every shape drawn over 300 seeds; level 4 second-basket set, two right row counts, leftover opening). The level 2 guard was removed once and the test failed at seed 1 (2×5 with 5×2), then restored.
- Not run: any browser play or `fingerdemo` (rules tier; the bot reads the same rules), `npm run build`, any device.

## 2026-11-03 — Puppet Stage levels 4–6 story cards and the premiere (batch puppet-stage 2)

- [PR #1159](https://github.com/rjdunlap/neo/pull/1159), code commits bae19b8c and cbbdd976: levels 4–6 (pre-K 3–5, school 4–6), 33 voice lines, how-to, off-screen, `puppetstory` suite; `game-reviewer` two findings, fixed.
- Ran: `npm run typecheck`; 49 puppet-stage rule tests; full `npm test` 4599 passed (297 files) at bae19b8c; `npm run build`; `BROWSER_SUITE=puppetstory` at cbbdd976 (server localhost:5637, `VITE_SPEECH=off`): level 4 three off-card bobs then glow 0/1, level 5 card 2 first twice 2/1 with glow, level 6 portrait card 1, early The end 1/0 with Bow, rest to the cheer and Bow; one portrait screenshot of level 6 mid-show; `fingerdemo` `FINGER_ONLY=puppet-stage FINGER_LEVELS=4,5,6 FINGER_BAND=school` 7.0, 10.9, 16.3 s.
- Not run: offline check, couch suites (no couch), the levels 1–3 suite (unchanged), device speech.
- Open: four device checks ([DEVICE-CHECKS](../DEVICE-CHECKS.md#puppet-stage-levels-46-tp2-2026-11-03)).

## 2026-11-03 — Vine Snip definition (docs only)

- Added [the definition](../definitions/vine-snip.md) (levels 1–5, two build slices); the earlier sketch is superseded; roadmap rows 25 and 27, READY, IDEAS and PHYSICS-GAMES updated.
- Ran: `node scripts/check-links.mjs`, `git diff --check`. No code checks, by tier (nothing built).
- Open: the definition's three device checks (tap-to-drop for a toddler, swing "keep going" on an iPad, 0.4 s windows for a four-year-old).

## 2026-11-03 — RW09 definition (docs only, PR #1162)

- Added [the packet](../rework/LEARNING-RECAP.md) defining RW09 slice 1 (intention table, step evidence record, plain-HTML recap); work items, roadmap row 30, READY, the study backlog and the Welcome packet updated.
- Ran: `node scripts/check-links.mjs`, `git diff --check`. No code checks, by tier (nothing built).
- Open: the slice itself.

## 2026-11-03 — Attic Finds level 9 Mend the exhibit (batch attic-finds 4)

- Added school level 9 (caption strips and the question slot on the bird-box case; `exhibit.ts`, `cases.ts`, 16 voice lines, how-to step) and raised the PWA per-file precache bound from 5 to 6 MiB (the routes bundle reached 5,253,129 bytes).
- Ran at `2c54175f` on base `origin/main` `04dcd79f` (dev http://localhost:5191, preview http://localhost:4191): typecheck; `npm test` all 298 files passed; `BROWSER_SUITE=atticcase` PASS (level 9 empty Check free; starting captions with the useful paper one miss and the love strip reopens; captions fixed with the copy paper second miss, glow, one hint, the copy hops back; a strip open across the portrait turn; then right, 2 misses, 1 hint, one sticker; landscape glow and portrait screenshots); `fingerdemo` `FINGER_ONLY=attic-finds FINGER_LEVELS=9` PASS (18.5 s); `npm run build`; `npm run test:offline` (root and classic) PASS. `game-reviewer`: no high or medium findings; scale reset on Start again fixed.
- Not run: device speech of the new lines, a child's play. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-03 — RW09 slice 1 learning evidence and the Welcome recap (PR #1163)

- Added `src/learning/` (intention table, `classify`), a bounded `projects.welcome.evidence` record per step, and the grown-ups' recap table in `src/parent/panel.ts`; `welcome` suite extended.
- Ran at `16b71efb` on base `cf1b177f`: typecheck; `npm test` 300 files, 4,625 tests (before a last recap wording-order tweak; recap tests 6/6 after); `npm run build`; `BROWSER_SUITE=welcome` PASS twice (dev server localhost:5498; opens the gear after yummy with one wrong cut and pretty left mid-round, reads supported, opened, lit notes and "2 of 3 steps done", portrait screenshot `welcome-recap-portrait`); production `npm run test:offline` PASS, root and classic (preview localhost:5408).
- Not run: `world` (no route change), iPad, device speech. Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): whether grown-ups find the recap useful and read it as intended.

## 2026-11-03 — Block Topple definition (docs only)

- Added [the definition](../definitions/block-topple.md) (levels 1–5, two build slices); the earlier sketch is superseded; roadmap rows 25–27, READY, IDEAS and PHYSICS-GAMES updated.
- Ran: `node scripts/check-links.mjs`, `git diff --check`. No code checks, by tier (nothing built).
- The window numbers in the definition come from a sampled estimate script, not tests.
- Open: the build slices and the definition's device checks.
