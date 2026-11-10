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
- Open: four device checks ([DEVICE-CHECKS](DEVICE-CHECKS-2026-11-09.md#puppet-stage-levels-46-tp2-2026-11-03)).

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

## 2026-11-03 — Brain Break Sums in order definition (docs only)

- Defined Brain Break levels 4–6 *Sums in order* in [the definition](../definitions/brain-break.md#sums-in-order-levels-46-definition-2026-11-03): the same in-order search with sum and take-away labels; colour words stay a proposal; ROADMAP step 9 and chunk 8, READY (queued build) and IDEAS updated.
- Ran: `node scripts/check-links.mjs`, `git diff --check`. No code checks, by tier (nothing built).
- Open: the queued build and its checks.

## 2026-11-03 — Pixel Pictures levels 7 Both ways and 8 Twice as big (pixel-pictures batch 2)

- [PR #1166](https://github.com/rjdunlap/neo/pull/1166): level 7 `mirror2` (six four-fold 6×6 pictures) and level 8 `big` (five 3×3 models at double size); school range 3–8.
- Ran (commit 2861b292, Vite dev on http://localhost:5849, stopped): typecheck; vitest pixel-pictures rules (11) with howto, lands and registry (69 passed); `BROWSER_SUITE=woods WOODS_ONLY=pixels FROM_LEVEL=7 TO_LEVEL=8` (two misses give [2,1], glow asserted: one square at 7, one whole block at 8, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=pixel-pictures FINGER_LEVELS=7,8` clean 51.3 s and 47.5 s; one portrait screenshot of level 8 reviewed. `game-reviewer`: no bugs.
- Not run: build and full unit suite (CI runs both). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): device and child checks on the mirror and double-size levels.

## 2026-11-03 — Garden Rows levels 8–9 Hedge boxes (garden-rows batch 2)

- [PR #1167](https://github.com/rjdunlap/neo/pull/1167): `'boxes'` rule (each flower once per row, column and 2x2 hedge box), levels 8 and 9, school range 3-9, voice `rows.boxes`/`rows.clash-box`, how-to step `from: 8`.
- Ran (commit e4a70954, Vite dev on http://localhost:5936, `VITE_SPEECH=off`, stopped): typecheck; vitest garden-rows and content (19 files, 191 tests; 23 Garden Rows rule tests: box beds valid with one solution over 80 seeds, no throw over 300 seeds, box clash, hint and bot reach the solution); `BROWSER_SUITE=gardenrows GARDEN_ROWS_ONLY=boxes` (level 8 portrait: box-only repeat = 1 miss, both spots flash, bot finishes both beds, saved [8,1,0]; level 9 sticker saved [9,0,0]; portrait screenshot reviewed); `fingerdemo` `FINGER_ONLY=garden-rows FINGER_LEVELS=9 FINGER_BAND=school` clean 25.6 s. `game-reviewer`: no blocking findings.
- Not run: build, full unit suite, level 7 and level 3 suite sections (unchanged), couch suites. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): hedges read as boxes on an iPad, a child understanding the box rule.

## 2026-11-03 — Garden Rows level 10 One row (garden-rows batch 3)

- [PR #1171](https://github.com/rjdunlap/neo/pull/1171): level 10 (a row of three, two planted), non-square beds, Garden Rows opens preschool (order 10, 1; entry level 10), voice `rows.one`, how-to step and note.
- Ran (base 61dfc1fd plus the diff, Vite dev on http://localhost:5191): typecheck; full units 300 files / 4,646 tests; the rule test for a clash at the last column shown failing with the old square `bed.length` rule and passing with the fix; the registry test for the preschool order and landing; `BROWSER_SUITE=fingerdemo FINGER_ONLY=garden-rows FINGER_LEVELS=10 FINGER_BAND=preschool` clean 10.7 s; `BROWSER_SUITE=lands LANDS_ONLY=puzzle-peaks`: every land page fits at every band (landscape; lap, school and grownup portrait, preschool included), then the run failed at the later Lantern Lake assertion "no puzzle needs a controller now" (1 !== 0). Lantern Lake is not touched by this change and that part last passed 2026-10-13; recorded as open, not investigated.
- One-off probe (`test-results/garden-rows-one-row.mjs`, 768x1024 portrait): a new 3-year-old at preschool started at level 10; two repeat plantings were 2 misses, 1 hint with the glow on the empty spot and the right packet; three beds with gaps 2, 1, 0; round finished; no page errors; screenshots of the hint and of the preschool Puzzle Peaks page with Garden Rows on it. `game-reviewer`: one wording fix applied.
- Not run: build (no shared assets), couch suites (couch unchanged). Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): a four-year-old reading "missing from this row" without the voice; the Lantern Lake `lands` assertion.

## 2026-11-03 — Ferry Jam level 7 Rocks in the harbor (ferry-jam batch 2)

- [PR #1169](https://github.com/rjdunlap/neo/pull/1169): rocks (`x`, `Harbor.rocks`) that never move, 15 frozen 5x5 harbors (4-5 boats, fewest 6-9), level 7 for school (range 3-7), `ferry.rock` and `ferry.start.rocks`, how-to step scoped to 7.
- Ran (commit df24bb4f merged with docs-only `origin/main` e9a793d5, Vite dev http://localhost:5710/classic/): typecheck; `npm test` 300 files, 4,641 tests (28 ferry-jam rule tests: rocks never slide, rock beside the ferry's row, every rock matters, `focusPath` reaches every boat at level 7); one scripted play of level 7 at school, portrait 768x1024 (a drag on the rock shook it, layout unchanged, 0 misses; solved by 6 real drags; one sticker, 0 misses, 0 hints, no page errors; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=ferry-jam FINGER_LEVELS=7` passed (14.5 s). `game-reviewer`: no findings.
- Not run: build (no shared files or assets), couch suites (couch unchanged, levels 3-6). Open: an iPad and a child meeting a rock ([DEVICE-CHECKS](../DEVICE-CHECKS.md) if one is added).

## 2026-11-03 — Habitat Helpers level 7 Something changed (habitat-helpers batch 2)

- [PR #1170](https://github.com/rjdunlap/neo/pull/1170): level 7 for school (range 4-7), two rounds of a changed garden, need buttons with the game's first counted miss, a repair tray, five new rule tests, new voice ids and a how-to step scoped to 7.
- Ran (base `origin/main` 61dfc1fd plus the branch, Vite dev http://localhost:5391, stopped): typecheck; `npm test` 300 files, 4,646 tests (habitat rules 20); `BROWSER_SUITE=habitat HABITAT_LEVELS=7` (portrait 768x1024: two wrong needs = 2 misses and the glow with 1 hint, right need, seed grass tested twice free then the pond-reeds glow with 1 hint, restore, the bot plays the second change, one sticker, history 2 misses/2 hints, no overlaps, pet clear; one screenshot `habitat-helpers-7-before-card-portrait`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=habitat-helpers FINGER_LEVELS=7` clean 16.4 s; `npm run build`. `game-reviewer`: no blocking findings.
- Not run: the full `habitat` suite (levels 1-6 unchanged), offline. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): level 7 at pre-K and the before card on an iPad.

## 2026-11-03 — Today's six daily shuffle definition (docs only)

- Developer request 2026-11-03: Today's six (the `?daily` trial, [PR #1088](https://github.com/rjdunlap/neo/pull/1088)) becomes the daily shuffle: a Home button, preset levels by band, an eligibility rule, seven kinds of challenge and Play all. [Definition](../definitions/todays-six.md), D10 in the roadmap's [discovery actions](../ROADMAP.md#discovery-actions), READY's first line, the waiting row narrowed to what is still the developer's call.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. No code changed, so no code checks.
- Open: the three slices' checks run when each lands.

## 2026-11-03 — Inchworm level 9 One worm, hop by hop (inchworm batch 2)

- [PR #1172](https://github.com/rjdunlap/neo/pull/1172): level 9 for school (order `[1, 2, 7, 9, 3, 4, 8, 5, 6]`, max 9; pre-K unchanged), mode `hop` with tap-a-worm hops, chalk ticks and three count pads, new voice lines, a how-to step scoped to 9, and the `worm` case extended to level 9.
- Ran (head 557892c5, Vite dev http://localhost:5575, stopped): typecheck; full `npm test` 300 files, 4,652 tests (before the review fix; inchworm and content tests 195 passed after it); `BROWSER_SUITE=woods WOODS_ONLY=worm FROM_LEVEL=9 TO_LEVEL=9` in portrait 768x1024 (taps, no pads until the end, end tap no miss, two wrong pads = 2 misses and the glow, numbered ticks; screenshots `inchworm-9-mid-hop`, `inchworm-9-hint`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=inchworm FINGER_LEVELS=9` clean 6.9 s. `game-reviewer`: no blocking findings; two minor fixes applied.
- Not run: `npm run build` (no shared files or assets changed), landscape play, offline. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): level 9 on an iPad and at pre-K; a child's counting of hops; a resize mid-hop draws the new tick about 0.3 s early.

## 2026-11-03 — Today's six slice 1: Home entry and preset levels (D10)

- [PR #1174](https://github.com/rjdunlap/neo/pull/1174) (commits 1d151e74, 17423a92): Home's Today's six button, `?daily` once after the chooser, Back to Home, preset levels for every band with pins and a dot row, `GameModule.daily?: false` (only `goodnight-room`), card rounds recording with `adapt` off, the grown-ups' line.
- Ran: typecheck; full `npm test` 4,661 tests (daily, registry and home-layout tests updated); `npm run build`; `BROWSER_SUITE=home` PASS (dev server, working tree at 17423a92); one-off portrait 768x1024 probe on a preschool/prek profile (Home, six, card 0 word-glue level 3, saved level stayed 1, tick on that card only, Back to Home; `?daily` then six then Back; no page errors; Home and six screenshots reviewed); production `OFFLINE_SUITE=root` PASS on a fresh build preview.
- Not run: the classic offline suite (island route unchanged), a lap/toddler Home screenshot, a grown-up card screenshot. The probe finished its round by calling `finish()`, not by playing it. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): iPad play from Home.

## 2026-11-03 — Today's six slice 2: kinds of challenge (D10)

- [PR #1175](https://github.com/rjdunlap/neo/pull/1175): `GameModule.challenge` (seven `CHALLENGE_KINDS`) on all 163 touch games, kind-first `dailySix` pick preferring a new land, the pet in the card page's guide corner and an all-six flourish (nothing recorded or awarded).
- Ran: typecheck; `daily` and registry tests (44); full `npm test` 4,664 tests (300 files); a 365-day probe (six distinct kinds every day, at least 5 lands at lap/toddler, 6 at older bands); one portrait 768x1024 screenshot at pre-K with all six ticked (six lands, pet in the corner, no page errors).
- Not run: build and offline check (no assets or navigation changed), browser suites; the star burst was not captured (screenshot about 2 s after entry). Open: iPad and a child's reaction ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Scoop Shop levels 8 Change of mind and 9 Top first (EF1b first batch, PR #1176)

- Changed: school levels 8 and 9 (order `[5, 12, 13, 6, 8, 9]`), six voice lines, friend peek and glow hint, level-scoped how-to steps; finishes the Codex draft from #977.
- Ran: typecheck; scoop-shop rule, content, registry and lands tests (214) and the updated difficulty test; full `npm test` 4,664 passed, 5 failed (difficulty, fixed; speed limits in block-garden, ferry-jam, fluffy-salon, keep-house under load average 10-16; ferry-jam's distance table still 537 ms against 500 ms when re-run alone, untouched code, known load flake); `npm run build`; `BROWSER_SUITE=arcade ARCADE_ONLY=scoop ARCADE_LEVELS=8,9` (orders, bounced scoops, hint glow, peeks, saved score, one sticker each, after two suite fixes: waiting for the ~11 s setup, one frame for the glow); `BROWSER_SUITE=fingerdemo FINGER_ONLY=scoop-shop FINGER_LEVELS=8,9` clean (34.7 s, 29.7 s); portrait screenshot of level 9 reviewed.
- Not run: device speech on an iPad (bottom/middle/top and colour clarity), a child playing it ([DEVICE-CHECKS](../DEVICE-CHECKS.md)). CI to confirm the load-flaky speed tests.

## 2026-11-03 — Sprout Shuffle level 6 Which plant could tell us? (genetics G5)

- [PR #1177](https://github.com/rjdunlap/neo/pull/1177): the bench of an `AA` and an `aa` tester; the spotted one cannot tell (no miss), the plain one gives the record and one choice; `school` range 1–6.
- Ran (tested commit 7435e00e, base 67975420): `npm run typecheck`; full `npm test`; `npm run build`; a scripted probe (Vite http://localhost:5711, landscape 1024x768 and portrait 768x1024): spotted tester first (no miss, 8 buds), then plain, one wrong Check (1 miss), Show me (1 hint), sticker, in the two-spot-copies case and (landscape) the plain-sprout case.
- Ran: `BROWSER_SUITE=fingerdemo FINGER_ONLY=sprout-shuffle FINGER_LEVELS=6` clean 11.2 s and `FINGER_LEVELS=5` clean 17.2 s (regression). `game-reviewer`: no blocking findings; one wording fix applied.
- Not run: the `sproutshuffle` suite (level 6 is not in it), other suites, offline. Headless frames ran about half speed under machine load; no failure attributable to the game. Open: whether the spotted tester's explanation lands and whether "can't tell" reads as finished ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Orchard Rows levels 7–9 definition (docs only)

- [PR #1178](https://github.com/rjdunlap/neo/pull/1178): [definition](../definitions/orchard-rows-path.md) for levels 7–9 *a path through the orchard* (own scene, model, layout, pads, accounting, voice, how-to, bot, rule tests, check tier), the batch `orchard-rows 3`, the dive's slice 2 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build, and the person and device checks the definition lists.

## 2026-11-03 — Read & Do level 7 Make the sign definition (docs only)

- [PR #1179](https://github.com/rjdunlap/neo/pull/1179): [definition](../definitions/read-do-make-the-sign.md) for level 7 *Make the sign* (WC3), the batch `read-do 3`, the dive's slice 3 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build, and the person and device checks the definition lists.

## 2026-11-03 — Island Bridges level 6 Keep them joined (island-bridges batch 2)

- [PR #1180](https://github.com/rjdunlap/neo/pull/1180), `claude/island-bridges-2` (code `762b4f31`): level 6 with the `closesOff` isolation rule behind an `isolation` flag (levels 1-5, couch and Island Hopping unchanged), and the level-6-only `joined` hint ([dive slice 2](../deep-dives/island-bridges.md#build-slices-in-order)).
- Ran (Vite dev, `VITE_SPEECH=off`, port 5741): typecheck; full `npm test` 300 files / 4683 tests on `07c30b0b`; after the review fix, island-bridges, registry and content tests 231 passed; `BROWSER_SUITE=bridgestouch BRIDGES_ONLY=6` on `07c30b0b` (13 hints to a joined step, group of 3) and `762b4f31` (10 hints, group of 2): its line and group, portrait screenshot, one sticker with 0 misses; `BROWSER_SUITE=fingerdemo FINGER_ONLY=island-bridges FINGER_LEVELS=6` clean in 10.5 s.
- Review (`game-reviewer`): no soundness bug; the scope leak (joined hint on every level) was fixed.
- Not run: `npm run build` (no shared assets), couch suites (couch unchanged), levels 1-5 touch plays.
- Open: whether the dashed-ring hint reads clearly on an iPad ([device checks](../DEVICE-CHECKS.md)); with two closing bridges the hint draws one.

## 2026-11-03 — Picture Graph level 8 Line them up (picture-graph batch 2)

- [PR #1181](https://github.com/rjdunlap/neo/pull/1181): new pre-K/school level 8 (shore things lined into a tray, which row has the most, school "how many more"), registry order and `entryLevels [8]`, voice `graph.line.*`, how-to steps, shore art.
- Ran: typecheck; `npm test` 300 files, 4,685 tests passed (before the last resize fix; rule tests rerun after it); new rule tests (plans, shores, questions incl. taller choice, hint links and glow, tray layout at 1024×768, 1024×1365, 1366×1024, 1180×820, bot) and the registry order/entry test; one Playwright probe on a dev server playing level 8 at pre-K (landscape) and school (768×1024 portrait): early row tap free, double tap places once, two wrong rows gave misses 2 hints 1 with lines and glow, wrong taller pad at school, both shores to the sticker, no page errors; portrait tray screenshot reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-graph FINGER_LEVELS=8` clean at pre-K (27.0 s) and school (38.2 s); `npm run build`.
- Review: `game-reviewer` found no blocking defects; a row tap during "how many more" is silent (left as is).
- Not run: device or person checks. Open: whether a four-year-old lines up and compares without being told what "most" means, and iPad tray tap feel ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Penguin Slide level 10 Three fish (dive slice 2)

- [PR #1182](https://github.com/rjdunlap/neo/pull/1182) (code `099b4efa`): school level 10 (7×5, three fish, five rocks, best 5–8 slides, two ponds; generation rejects a pond where one first slide eats two fish), school range 2–10, voice `slide.three`, how-to step; bot unchanged (solver).
- Ran: typecheck; `npx vitest run src/games/penguin-slide` 27 passed (new 300-seed level-10 test and `eatsTwoFromStart` unit test); `src/content` and registry 200 passed; one scripted school play of level 10 on a dev server (`VITE_SPEECH=off`, one-off probe): wandered until the yellow arrow showed (hints 1), followed it to the sticker, saved level 10, misses 0, hints 1, no page errors; `BROWSER_SUITE=fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=10` passed (21.4 s).
- Not run: build (no shared assets), portrait screenshot, `woods` suite (its Penguin Slide play still stops at 9), device check. Open: whether a school-age child plans the order of three fish without the arrow.

## 2026-11-03 — Orchard Rows levels 7–9 A path through the orchard (batch orchard-rows 3)

- [PR #1183](https://github.com/rjdunlap/neo/pull/1183) (tested commit `f81019be` on base `aac009d6`): school levels 7–9 in a new `PathOrchard` scene (`path.ts`), path model and layout in `logic.ts`, skill `distributive property`, voice `orchard.path*`, how-to steps 7–9 (level-4 note bounded to 4–6); the open decisions took their defaults.
- Ran: typecheck; `npm test` all pass (36 Orchard Rows rule tests); `npm run build`; `BROWSER_SUITE=orchard ORCHARD_LEVELS=7,8,9` on `http://localhost:5746` (level 7: sign ask, two wrong part pads = 2 misses and 1 hint glow, glowing pad, sign recount, finish [2,1]; level 8: arrow at the range end free, down, path laid at 2, finish [0,0]; level 9 in portrait to its sticker); level 7 rerun after a `game-reviewer` fix (the finished orchard stays drawn through the join line); `fingerdemo` `FINGER_ONLY=orchard-rows FINGER_LEVELS=7,8,9` passed (13.1, 28.4, 10.3 s; level 8 rerun after the fix). Screenshots in `test-results/browser/orchard/` (`-7-glow`, `-8-laid`, `-9-portrait-signs`).
- Not run: offline check, other suites. Open: device speech of "rows of" and skip counts, and the four person checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-03 — Sprout Shuffle levels 7–8 Patchwork Conservatory (genetics G7)

- [PR #1184](https://github.com/rjdunlap/neo/pull/1184): school levels 7–8 in a new `conservatory.ts` (bench, two pots, spots and rim lenses, leaf Check, level 8 free "Another way?" and Finish), rules in `logic.ts`, `school` range 1–8.
- Ran (tested commit 3b8f7cd5, base 05e0e9d7): `npm run typecheck`; full `npm test` (300 files, 4718 tests; 13 new rule tests); `npm run build`; a scripted probe on Vite http://localhost:5652 (`VITE_SPEECH=off`): level 7 landscape (1 miss with rim counterexample, then 2 misses and the glow, accepted pair, finished misses 2 hints 1), level 8 portrait (lens screenshot, free failing Check, found plan refused free, second plan, two beds, 0 misses/hints), portrait level 7 fan at full scale; no page errors.
- Ran: `BROWSER_SUITE=fingerdemo FINGER_ONLY=sprout-shuffle FINGER_LEVELS=7,8` clean, level 7 15.3 s and level 8 15.9 s. `game-reviewer`: fixed a sub-100-unit portrait fan and Finish pressable mid-animation.
- Not run: the `sproutshuffle` suite (7–8 not in it), other suites, offline. The definition's source check (OpenStax 12.3, NGSS MS-LS3-2) was not reopened. Open: a drag held through a rotation is not cancelled; person and device checks in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

## 2026-11-03 — Island Bridges level 7 Up to three planks (batch island-bridges 3)

- Changed: level 7 (9 by 9, 12–14 islands, bridges of up to three planks, numbers to 12), `Layout.max` in the solver, base-36 picture encoding, order `[5, 1, 2, 6, 7, 3, 4]`, voice `bridges.go-three`/`-touch`, a how-to step, and `BRIDGES_ONLY=7`; review fix: the generator's hint walk no longer uses keep-them-joined.
- Ran (Vite dev, port 5947; browser runs on `8277be85`, the final rule fix `42ad9ada` changed only generator filtering and tests): typecheck; full `npm test` 300 files / 4709 tests; island-bridges rule tests 36 including a brute force over every 0..max assignment at two and three planks (shown to fail with the solver capped at two); `BROWSER_SUITE=bridgestouch BRIDGES_ONLY=7` (portrait: three taps lay a triple, a fourth bumps with no miss, triple-bridge screenshot, one sticker with 0 misses and 0 hints); `BROWSER_SUITE=fingerdemo FINGER_ONLY=island-bridges FINGER_LEVELS=7` (9.9 s); `BROWSER_SUITE=couchgames COUCH_ONLY=island-bridges`; `npm run build`.
- Open: bridgestouch levels 1–6 not re-run (unchanged); no iPad or finger.

## 2026-11-03 — Penguin Slide level 11 Where will it stop? (dive slice 3)

- [PR #1187](https://github.com/rjdunlap/neo/pull/1187) (code `766a0e3a` plus the restart fix): preschool/pre-K level 11 (predict the stop of three shown slides, never a miss), order `[1, 2, 11]` / `[1, 2, 11, 3, 4]`, school `entryLevels [11]`, voice `slide.predict*`, scoped how-to steps, a woods case.
- Ran: typecheck; `npm test` 300 files, 4729 tests; Penguin Slide rule tests (33, rerun after the restart fix); `BROWSER_SUITE=woods WOODS_ONLY=penguin FROM_LEVEL=11 TO_LEVEL=11` pass (preschool portrait: one wrong prediction without a miss, right ones, both ponds, score [0, 0], sticker; screenshot `test-results/browser/woods/penguin-slide-11-portrait.png`); `BROWSER_SUITE=fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=11` clean at preschool (15.1 s); `npm run build`. `game-reviewer` found a restart mid-prediction keeping its step; fixed.
- Not run: offline check, couch suites (couch never plays 11), the restart path in a browser. Open: whether a preschooler predicts before seeing "it keeps going" ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Picture Graph level 9 A key of five (picture-graph batch 3)

- [PR #1188](https://github.com/rjdunlap/neo/pull/1188) (tested commit `360b577c`): new school level 9 (`fives`: three tally cards in whole fives, key block = a group of five, build one block per group, then how many more), voice `graph.buildfives`/`recountfives`/`morefives`/`fives`, how-to steps.
- Ran (dev server `http://localhost:5381`, `VITE_SPEECH=off`): typecheck; `npx vitest run src/games/picture-graph src/content src/games/registry` 232 passed, including six new level-9 rule tests (counts in whole fives, choices, finger, hint blocks, card layout at four views); `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-graph FINGER_LEVELS=9` pass (36.8 s); one 768x1024 scripted play of level 9: eight blocks on one bar (miss 1), again (miss 2, hint 1, card glow), rebuilt, blocks pad (miss 3), right answer, second graph, no page errors; portrait screenshots reviewed.
- Review: `game-reviewer` found nothing.
- Not run: `npm run build` (no shared files or assets changed), full `npm test` (CI runs it), device or child check. Open: iPad feel and a child reading a tally group as one block are unchecked.

## 2026-11-03 — Light Lab level 11 Through, bounce or stop? definition (docs only)

- [PR #1189](https://github.com/rjdunlap/neo/pull/1189): [definition](../definitions/light-lab-materials.md) for level 11 (materials toy rule, three free guesses then two judged choices, pre-K order [1,2,3,4,11], school order [2,3,4,11,5..10]), the batch `light-lab 5`, the dive's slice 5 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new-interaction tier), and the person and device checks the definition lists.

## 2026-11-03 — Peekaround Island level 8 From the sky definition (docs only)

- [PR #1191](https://github.com/rjdunlap/neo/pull/1191): [definition](../definitions/peekaround-from-the-sky.md) for level 8 (school only, school range 4–8, pre-K unchanged at 7), the batch `peekaround-island 5`, the dive's slice 5 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new-interaction tier, after batch 4) and the person and device checks the definition lists.

## 2026-11-03 — Penguin Slide level 12 A block onto the star (dive slice 4)

- [PR #1190](https://github.com/rjdunlap/neo/pull/1190) (code `8220cd6f`, wording-only voice change `2370c3f9`): school level 12 (one block onto a star on 6×5 ponds with snow that changes the best route, no fish, no misses), school `order` [2..10, 12], shared `solved()` in `logic.ts`, voice `slide.star*`, how-to level-12 steps, a woods case.
- Ran (Vite dev, `VITE_SPEECH=off`, port 5278): typecheck; `npm test` 300 files, 4740 tests (registry ladder test updated); `BROWSER_SUITE=woods WOODS_ONLY=penguin FROM_LEVEL=12 TO_LEVEL=12` pass (dead end played, stuck line and undo glow, undo, both ponds, misses 0, sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=penguin-slide FINGER_LEVELS=12` pass (17.8 s); one portrait screenshot (stuck block in the corner, glowing undo) reviewed. `game-reviewer`: no defects.
- Not run: `npm run build` (no shared assets), couch suites (courses unchanged), device check. Open: whether a school-age child reads a star as the block's goal ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-11-03 — Sudoku Garden level 10 cage beds definition (docs only)

- [PR #1192](https://github.com/rjdunlap/neo/pull/1192): [definition](../deep-dives/sudoku-garden.md#cage-beds-level-10-definition-2026-11-03) for level 10 (a 6 by 6 bed with sums in the cages; 9 by 9 cages left out on a measured fit), the batch `sudoku-garden 5`, the dive's slice 5 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new-interaction tier) and the iPad check of the sum labels and dashes at 92 units ([DEVICE-CHECKS](../DEVICE-CHECKS.md) when built).

## 2026-11-03 — Picture Graph level 10 Two pictures, one meadow (picture-graph batch 4)

- [PR #1193](https://github.com/rjdunlap/neo/pull/1193) (tested commit `d4554d2d`): new school level 10 (`pair` mode, scene `compare.ts`: a tally card and three finished graphs, pick the two that show the same counts, a keyed graph and an equal-height trap), voice `graph.pair.key`/`graph.pair.look`, how-to steps from 10.
- Ran (dev server `http://localhost:5365/classic/`): typecheck; picture-graph rule tests 37 passed and content plus registry tests 238 passed; one scripted level 10 play (lift and lower free, keyed+trap pair = miss, plain+trap = second miss and the hint, both rounds, sticker, no page errors) with 768x1024 screenshots; `BROWSER_SUITE=fingerdemo FINGER_ONLY=picture-graph FINGER_LEVELS=10` pass (6.3 s).
- Review: `game-reviewer` found nothing.
- Not run: `npm run build` (CI runs it), device or child check. Open: iPad feel and whether a child learns to read the key rather than trust "the keyed graph is always right".

## 2026-11-03 — Scoop Shop level 7 Two cones (EF1b second batch, PR #1194)

- [PR #1194](https://github.com/rjdunlap/neo/pull/1194) (branch `claude/scoop-shop-two-cones`, third commit): school level 7 *Two cones*: two friends with hidden picture orders, free cone selection separate from the friend peek, per-cone misses/glow/peek, either service order; voice `scoop.two-cones`/`scoop.order-single`/`scoop.order-pair`; how-to steps from 7.
- Ran (dev server `http://localhost:5219`, `VITE_SPEECH=off`): typecheck; `npm test` 300 files, 4753 tests pass (rule tests: 360-pair enumeration, determinism, wrong scoops never mutate either stack, every route finishes, per-cone help caps, layout targets at least 100 and disjoint at three sizes); `npm run build`; `BROWSER_SUITE=arcade ARCADE_ONLY=scoop ARCADE_LEVELS=7` pass (two wrong scoops and glow, peek keeps the choice and counts once, repeat free, scoop during peek refused, switch keeps the partial stack, both serves, score `[2,2]`, one sticker, portrait screenshot); `BROWSER_SUITE=fingerdemo FINGER_ONLY=scoop-shop FINGER_LEVELS=7 FINGER_BAND=school` pass (13.8 s).
- Review: `game-reviewer` found nothing medium or above.
- Not run: other Scoop Shop levels' browser plays (unchanged apart from the shared support refactor, covered by unit tests), offline check, any iPad or child check. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md) (outline, peek and two hidden requests on iPad portrait; speech of the two request lines).

## 2026-11-03 — Ferry Jam level 8 Two ferries (ferry-jam batch 3)

- [PR #1195](https://github.com/rjdunlap/neo/pull/1195) (branch `claude/ferry-jam-two-ferries`): school level 8 with a second, upright yellow ferry; each ferry sails away at its dock; 16 frozen 5x5 harbors, fewest 5-8; school range 3-8.
- Ran (tested commit 737e7d06, play rerun after the c8cc00d9 review fixes; Vite `http://localhost:5767/`, `VITE_SPEECH=off`): typecheck; Ferry Jam rule tests 35 (7 new two-ferry tests); `npm test` 300 files, 4760 tests; `npm run build`; one scripted 768x1024 play of level 8 to its sticker with the yellow ferry sailing first, 0 misses and 0 hints, bottom-dock screenshots reviewed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=ferry-jam FINGER_LEVELS=8` pass (17.7 s).
- Review: `game-reviewer` found cosmetic issues only; two fixed (sail tween from the dock cell, how-to undo wording), one left (a couch restart after a sail tweens the ferry in from past the dock; couch never plays level 8).
- Not run: couch suites (catalog unchanged), offline check, any iPad or child check. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md).
