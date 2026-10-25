# Verification 2026-10-24 (archived entries)

## 2026-10-24 — RW07 slice 3: Welcome a New Friend's ending, adoption and basket bed

- `store.adoptWelcome`, the ending in `ProjectScene`, shared `singTune()`, and the basket bed in `PlayScene` ([PR #908](https://github.com/rjdunlap/neo/pull/908)). The tune plays once at the arrival and on a tap, not on the loop as the packet said.
- Ran on `9fc608e2`: typecheck; `npm test` (221 files, 2749 passed); `npm run build`; `BROWSER_SUITE=welcome` and `BROWSER_SUITE=home` on `http://localhost:5962` (full flow to the ending and naming, leave adopts no one, Continue replays, Ripple joins and Home has no Continue, bed shows her picture and wakes to her tune, reload, Friends lists her, Come with me leaves the bed empty, pre-K has no bed, toddler no Continue; portrait ending and landscape bed screenshots reviewed).
- Failed: `npm run test:offline` against `vite preview --port 4758` (current build), twice at "Finished a new minigame while offline", the failure already open since RW14 slice 8; the offline reload and cached open passed. Not a pass.
- Not run: `world`, `picnic`, couch. Open: arrival, naming by tap at 3-4, the bed and device speech with a child ([device check](../DEVICE-CHECKS.md)).

## 2026-10-24 — Sprout Shuffle G2 placement check (blocked; docs only)

- [PR #912](https://github.com/rjdunlap/neo/pull/912), `claude/sprout-shuffle-g2`: the G2 build stopped at its placement condition; the blocker and a location-capacity definition line are recorded in READY, the genetics dive and the definition.
- Probe: with a stub `sprout-shuffle` module registered (school only), `npx vitest run src/content/lands.test.ts src/app/scenes/ src/app/nav-meaning.test.ts` was run once in each of the 11 lands. Every land failed. Rainbow Meadow failed `meadow.test.ts` at prek and school 4:3 landscape: 0 flowers, against a minimum of 6, and a free-cell grid found no 40-unit gap from y≈120 down. Tinker Lab and Puzzle Peaks failed `lands.test.ts` because `landLayout` returned null. Every other land failed its scene test, including small lands through the added signpost (Painted Canyon at preschool n=7, Music Mountain at toddler n=6).
- Not run: typecheck, the unit suite, build and the browser checks. The stub and code were backed out, so only docs changed.
- Open: the location-capacity definition, then G2 itself.

## 2026-10-24 — Photo Safari levels 8, 9 and 12 (slices 5–7)

- [PR #913](https://github.com/rjdunlap/neo/pull/913), `claude/photo-safari-5-7`, tested at `17fd6491` on a local Vite dev server: school 8 What changed?, school 9 Is it true? and the toddler Who is sleeping? entry (12).
- Ran: typecheck; 175 unit tests (photo-safari logic 17, with new act/changed/true rule tests, registry and content); `BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=8,9,12` (two misses and one hint each, album, saved score, sticker, portrait screenshots of 8 and 9; level 9 re-run after the judge-phase tap fix); `BROWSER_SUITE=fingerdemo FINGER_ONLY=photo-safari FINGER_LEVELS=8,9,12` clean (24.7, 20.2, 13.1 s). `game-reviewer` found one defect (animal taps while judging), fixed.
- Not run: build (no shared files or assets changed), offline, the unchanged levels.
- Open: a toddler on entry 12, a child comparing the pinned photo at 8 and understanding 9's claims and thumbs on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); the lap fewer-animals entry waits on a person check.

## 2026-10-24 — Location capacity definition (docs only)

- [PR #914](https://github.com/rjdunlap/neo/pull/914), `claude/location-capacity`: [definition](../definitions/location-capacity.md) of pages for a full land; no code changed.
- Probe: a throwaway vitest probe of `landLayout`, `visibleIn` and `olderIn` on `origin/main` `edd6a74b`, deleted afterward. 4:3 landscape binds at 14 spots, Rainbow Meadow's scenery fails at 14, and portrait and phone fit 23 or more.
- Ran: `node scripts/check-links.mjs` and `git diff --check`. Not run: typecheck, unit tests, build, browser (docs only).
- Open: the build.

## 2026-10-24 — Location capacity: pages for a full land

- [PR #915](https://github.com/rjdunlap/neo/pull/915), `claude/location-pages` on `origin/main` `af1b3074`: `LAND_SPOTS = 13`, balanced pages with arrows in `landLayout`, a page in the land origin, and a capacity sweep (`landLayouts`) in all ten location tests; Beach, Painted Canyon and Music Mountain reworked with `scanPlace`.
- Ran: `npm run typecheck`; `npm test` (222 files, all passing); `BROWSER_SUITE=lands` (every page of every land, all bands landscape, lap/school/grownup portrait, arrow touch areas); `BROWSER_SUITE=world` (first run failed on two harness expectations of the old `{ land }` origin, updated to `{ land, page: 0 }`; rerun PASS); `npm run build`; `npm run test:offline` against `vite preview --port 5444` (served `classic-BU0HtDNI.js` matched `dist`). Dev server `http://localhost:5298`.
- Scripted look (Tinker Lab at school, root): pages 6+6; the next arrow turns to page 1; a game launched there returns to page 1; the host's suggestion turns back to page 0; portrait page 1 fine; no page errors.
- Not run: couch suites (untouched). Open: iPad check of the arrows (no fitting section in [device checks](../DEVICE-CHECKS.md) yet).

## 2026-10-24 — Pond Typing levels 1–3 (KE2 part 1)

- `claude/pond-typing` at `aa4f38a3`: new keyboard-only couch game `pond-typing` (school 1–3), the typed-letter channel (`CouchControls.typed`, `GameModule.typing`), couch registration, the Bubble Pond course and the island course route; home Story Grove (after merging #915's land pages; it failed Story Grove's drawing test before them).
- Ran: typecheck; `npm test` 2779 passed (224 files, with 20 new rule tests in `pond-typing/{logic,course}.test.ts` and 3 in `couch-input.test.ts`); `BROWSER_SUITE=couchgames COUCH_ONLY=pond-typing` (intro, level-1 bot round, save; the bot's typing checked instead of key lighting); one Playwright probe: island `go.game('pond-typing')` opens the course page, two wrong keys gave 1 miss and 1 hint with the key glowing, the right key popped, no page errors, portrait screenshot reviewed; `npm run build`.
- Not run: offline check, `world`, `lands` suite (the land fit was checked by the registry and lands unit tests), a real laptop keyboard or a child. Open: levels 4–6, picture words, the Show the key toggle; [device check](../DEVICE-CHECKS.md#pond-typing-levels-13-ke2-2026-10-24).

## 2026-10-24 — Species Comeback levels 1–3 (Lantern Lake)

- `claude/species-comeback-land` ([PR #733](https://github.com/rjdunlap/neo/pull/733)) on base `origin/main` `119870cd`: new grown-up game `species-comeback` (levels 1–3; family tree of invented pond turtles, release sites at level 3), home Lantern Lake as its 13th game, now that #915's land pages let it page (the earlier Barnyard placement is reverted); decision 1's source check is in the [definition](../definitions/species-comeback.md).
- Ran: typecheck; `npm test` 226 files, 2801 tests passed; `npm run build`; `BROWSER_SUITE=comeback` on `http://localhost:5920` (level 1 forbidden pair, undo, early Spring, one requested hint; level 3 unsuitable site; portrait sites; 64-unit cards; one sticker each) passed; `BROWSER_SUITE=fingerdemo FINGER_ONLY=species-comeback` levels 1 and 3 clean (9.1 s, 15.2 s).
- Not run: offline check, `lands` suite (land fit covered by the registry and lands unit tests), an iPad. Open: level 4, the printed recovery card; [device check](../DEVICE-CHECKS.md#species-comeback-levels-13-2026-10-24).

## 2026-10-24 — Ramp Race level 5, Trial Shelf (inquiry Q4 part 1)

- `claude/ramp-race-q4` ([PR #918](https://github.com/rjdunlap/neo/pull/918)): school level 5 (record cards A and B, locked first ramp, same-height nudge, free paw guess, farther-card taps over two pairs); shared files touched were only `voice-script.ts` and `howto.ts`.
- Ran: typecheck; `npx vitest run src/games/ramp-race src/content src/games/registry` (16 files, 174 tests passed); `BROWSER_SUITE=woods WOODS_ONLY=ramp FROM_LEVEL=5` on `http://localhost:5612` (locked first ramp, same-height nudge, free guess, two wrong cards then the ring, score [2,1], sticker) passed, and again after the review fixes; `BROWSER_SUITE=fingerdemo FINGER_ONLY=ramp-race FINGER_LEVELS=5` passed in 24.2 s; portrait screenshot `test-results/browser/ramp-race-5-cards-portrait.png` reviewed.
- Not run: build (only `voice-script.ts` and `howto.ts` changed), offline check, an iPad. Open: level 6 (One Change); [device check](../DEVICE-CHECKS.md).

## 2026-10-24 — Food Web Workshop levels 1–3 (ecosystems F2)

- `claude/food-web-workshop` ([PR #919](https://github.com/rjdunlap/neo/pull/919)): new school game in Rainbow Meadow (13 games there); base `origin/main` 2dfeeb7c plus the branch. Source check (web search, read as summaries; all six records pass, no wording changed): r1 clover is a caterpillar host plant ([UF/IFAS](https://mrec.ifas.ufl.edu/lsolab/caterpillars)); r2 caterpillars are the main prey at bluebird nests ([Vermont Center for Ecostudies](https://vtecostudies.org/blog/got-caterpillars-new-research-finds-theyre-essential-for-eastern-bluebirds), [great tit study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8683465/)); r3 garden snails eat dandelion and other weeds ([CFIA](https://inspection.canada.ca/en/plant-health/invasive-species/nematodes-snails-and-others/european-brown-garden-snail/fact-sheet), [feeding study](https://spasb.ro/index.php/public_html/article/view/1184); weakest: forage, not a ranked preference); r4 thrushes eat snails ([Eton College](https://collections.etoncollege.com/on-the-spot-some-thoughts-about-thrushes/), [WWT](https://www.wwt.org.uk/news-and-stories/news/the-crunch-of-snail-shells); "the bird" kept generic); r5, r6 rabbits eat clover and dandelion ([Ohio DNR via Dublin, Ohio](https://search.library.wisc.edu/digital/AG65AV6OBR2TSI8G/text/AXB6YXFQSWUSIA8J), [UMD Extension](https://www.extension.umd.edu/resource/eastern-cottontail-rabbits-gardens-and-home-landscapes-fs-2024-0703)).
- Ran: typecheck; `npm test` (228 files, 2858 tests, including 26 food-web rule tests); `npm run build`; on `http://localhost:5279`: `BROWSER_SUITE=foodweb` (level 1 extra arrow, one miss, Undo, matching web, [1,0]; level 2 turn by drag, portrait targets of 100 units or more, [0,0]; level 3 one requested hint, [0,1]), `BROWSER_SUITE=fingerdemo FINGER_ONLY=food-web-workshop` (levels 1 and 3, 12.5 s each) and `BROWSER_SUITE=smoke SMOKE_ONLY=food-web-workshop` (levels 1–3) passed. game-reviewer fixes (station tap area 97 to 107 tall, a tick for a drag refused during the miss line) were made after the browser runs; only rule tests and typecheck were rerun.
- Not run: world, couch, offline suites, an iPad. Open: [device check](../DEVICE-CHECKS.md) (far-station drags, device speech of the `web.*` lines, whether a child reads the arrow as intended); levels 4–5 are later slices.

## 2026-10-24 — Grown-up puzzle misses: Sudoku Garden, Island Bridges, Picture Logic

- `claude/grownup-puzzle-misses` ([PR #920](https://github.com/rjdunlap/neo/pull/920)), tested commit 7c33d40b on base `origin/main` 7f55ad94: Sudoku Garden's wrong digit boings, rings the square red and speaks `sudoku.wrong` (at most once per four seconds); a stray plank (Island Bridges) and a stray fill (Picture Logic) count 0 misses; touch and couch; Lantern Lights unchanged. The browser harness's course-list assertions gained `typing` (stale since Pond Typing).
- Ran: typecheck; vitest for the three games and `src/content` (216 pass); on `http://localhost:5380` `BROWSER_SUITE` `sudokutouch` (red ring), `bridgestouch`, `picturetouch`, `couchpictures`, `couchbridges` and `couchbeds` passed (`sudokutouch` and `couchbeds` on 7c33d40b, the rest on a9a435bd with the same code for those games).
- Not run: build (no shared or asset change), `fingerdemo` (bot unaffected), an iPad. Open: [device check](../DEVICE-CHECKS.md) for the spoken wrong-digit line.

## 2026-10-24 — Better voice V2 part 1: build-time Kokoro clips

- `claude/better-voice-v1` ([PR #921](https://github.com/rjdunlap/neo/pull/921)), commit 10a2eba7 on base `origin/main` b379b9e9: `scripts/voice-clips/` renders 215 slot-free clips (shell lines, Bubble Pop, Duck Pond); `voice.ts` plays them on a new `voiceOut` bus with device-speech fallback.
- Ran: typecheck; `npm test` (230 files, 2864 tests, including the manifest/file/settings test and the clip lookup test); `npm run build` (precache 390 entries, 215 m4a in `dist` and `sw.js`); `npm run test:offline` PASSED on `vite preview --port 4817` (served `classic-DXt0k59h.js` matched `dist`); an offline probe found all 215 clips in the service-worker cache and fetched one offline (200).
- Dev probe on `http://localhost:5743` (Playwright Chromium): a clip decoded (1.41 s), "Home!" played by clip with no device speech, `stop()` resolved a playing clip in about 240 ms, an unrendered line used device speech.
- Not run: any browser suite (no navigation or game change), an iPad. Open: [device check](../DEVICE-CHECKS.md) for clip playback, loudness against music and the voice.

## 2026-10-24 — Monster Munch foods, monsters and places (slice 2)

- `claude/monster-munch-foods` ([PR #924](https://github.com/rjdunlap/neo/pull/924)), code commit 47412abc on base 348224bc: a five-food pool (one per round at 4–5 and 7–8, two unlike foods at 6), five monster colours with horns or crest and one or two eyes, three places, sticker drawn from the same pools, `{kind}` in the sharing lines, the card naming the foods.
- Ran: `npm run typecheck`; `npm test` 230 files / 2872 tests passed (before a one-line look-alike addition, then the 18 Monster Munch rule tests passed again); `BROWSER_SUITE=third MUNCH_LEVELS=6,8` passed on `http://localhost:5720` (the first try failed only because the harness fed cookies; fixed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=monster-munch FINGER_LEVELS=6,8` clean in 31.5 s and 31.9 s; one level-6 landscape screenshot reviewed.
- Not run: `npm run build` (no shared assets), a portrait screenshot, browser play of levels 4, 5 and 7 (rule tests cover them), an iPad or device speech for the new food names.

## 2026-10-24 — Rhythm Neighbors level 9, Knock a call (slice 4)

- `claude/rhythm-neighbors-knock-a-call` ([PR #925](https://github.com/rjdunlap/neo/pull/925)), tested commit 667ff289: she knocks a one-to-five-knock call on the big tree; one frog answers with the gaps flipped or reversed (1.6 s quiet ends a call, the fifth knock ends it at once); three calls finish, no misses or hints.
- Ran: `npm run typecheck`; `npm test` 230 files / 2877 tests passed (14 Rhythm Neighbors logic tests, including exhaustive `reply`/`gapsOf` shapes and ghost timing); `BROWSER_SUITE=creative CREATIVE_ONLY=rhythm FROM_LEVEL=1` on `http://localhost:5602` passed levels 1-9 after the review fix (level 9: a one-knock call, a quiet spell recording nothing, a five-knock call ending at once, three calls, 0 misses/hints); portrait screenshot `test-results/browser/rhythm-neighbors-9.png` inspected; `BROWSER_SUITE=fingerdemo FINGER_ONLY=rhythm-neighbors FINGER_LEVELS=9` clean at toddler in 25.3 s (run before the review fix, which does not touch level 9's path).
- Not run: `npm run build` (no shared files or assets), offline check. Open: whether a 1.6 s quiet feels right to a toddler on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-24 — Rhyme Riddles, Rhyme Time levels 5–7 (PW1)

- `claude/rhyme-riddles` ([PR #927](https://github.com/rjdunlap/neo/pull/927)), tested commit fd99e5e8: prek levels 1, 2, 3, 5 and school 2–7; levels 5–6 two-clue riddles with a mate/trap miss, level 7 build-the-riddle with chips and a mouth Guess button. Sources: RF.K.2; fish as food (USDA MyPlate via [NMSU](https://pubs.nmsu.edu/_e/E143/)); bats ([Smithsonian](https://www.si.edu/spotlight/bats)); other tags checked against the drawings.
- Ran: `npm run typecheck`; `npx vitest run src/content src/games/rhyme-time src/games/registry.test.ts` 170 passed (16 files); a scripted Playwright probe on `http://localhost:5957/classic/` (not committed): level 6 mate miss then trap miss (misses 2, hint 1, answer glows, bot finishes), level 7 empty Guess free, fun-wrong guesses, chips glow (misses 0, hints 1), level 5 at prek by bot, 0 page errors, portrait screenshots of the level-6 shelf and a level-7 glow; `BROWSER_SUITE=fingerdemo FINGER_ONLY=rhyme-time FINGER_LEVELS=5,6,7` passed (8.0/8.3/16.8 s), re-run at 5,7 after review fixes. `game-reviewer`: two minor findings fixed (chip row clears the corner pet; motions start from the card's slot).
- Not run: `npm run build` (no shared files or assets), full `npm test`, world/offline. Open (the tag table had the session source check, S1, in place of an outside review): iPad and device speech ([DEVICE-CHECKS](../DEVICE-CHECKS.md) not yet updated).

## 2026-10-24 — Peg Garden levels 6 and 7, Into the cup and Plant a bud (slices 5–6)

- `claude/peg-garden-cup-and-bud` ([PR #923](https://github.com/rjdunlap/neo/pull/923)), tested commit 3b16f5e6 on base daa7b531: level 6 four cups with a count-saying miss and a two-miss full-path glow; level 7 drag seeds onto rings, run the pearl, free look, planted misses count, two misses outline one ring. Dev server `http://localhost:5318`.
- Ran: `npm run typecheck`; `npm test` 230 files / 2898 tests passed (seven new level-7 rule tests: bare run misses, hinted ring reaches, single and pair plantings, ring spacing, button vs dishes, determinism, `snapPlace`, game stepping equals `plantRun`); `BROWSER_SUITE=batch BATCH_ONLY=pegs` at 6 and at `FROM_LEVEL=7 TO_LEVEL=7` passed (stray water tap drops nothing, free look, two misses give hint 2,1, stray seeds home); `fingerdemo` `FINGER_ONLY=peg-garden` at 6 and 7 passed (7 in 7.2 s); portrait 820×1180 screenshot of level 7 reviewed. `game-reviewer` fixes: touch layer re-enabling, a second run during praise, button over pearl, planting order.
- Not run: `npm run build` (no shared files or assets), `couchgames` (couch levels unchanged), `howto` (known failure before this work: "twenty-three island games can also be played with a controller" 26 !== 23). Open: iPad and a child's play not established.

## 2026-10-24 — Who Am I? levels 1–3 (zoo animals Z3)

- `claude/who-am-i-z3` ([PR #928](https://github.com/rjdunlap/neo/pull/928)), tested on the dev server `http://localhost:5617` at the commit before docs (5e1cf42d minus docs): new game in Barnyard, levels 1–3, Owl Walk's owl moved into `src/art/animals.ts`, a Kokoro clip for the title.
- Ran: `npm run typecheck`; `npm test` 231 files / 2933 tests passed (35 new rule tests in `src/games/who-am-i/logic.test.ts`, plus registry, lands, how-to and voice-clip tests); `BROWSER_SUITE=whoami` passed (level 1 wrong friend then the fit, saved 1,0; level 3 keeps-tap miss, requested hint, three clues, a free peek, portrait screenshot, saved 1,1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=who-am-i` level 1 (prek) 7.8 s and level 3 (school) 16.0 s; `npm run build` passed. game-reviewer fixes: taps judged during a clue change, stale help after a clue advanced, 90 to 100-unit clue thumbnails.
- Not run: Owl Walk's filtered suite after the owl art move (typecheck proves the pure move), offline check, level 2 in the browser. Open: iPad speech, a child's reading of face-down cards and picture signs ([DEVICE-CHECKS](../DEVICE-CHECKS.md#who-am-i-levels-13-zoo-animals-z3-2026-10-24)).

## 2026-10-24 — Second Chance Shed levels 1–4 (nature-sustainability N2)

- `claude/second-chance-shed` ([PR #930](https://github.com/rjdunlap/neo/pull/930)), tested on the dev server `http://localhost:5918` (since stopped) at base origin/main 70018b00 plus the branch: new game in Cozy Village (13 games), levels 1–4, one Kokoro clip for the title line.
- Item-table source check (decision 1; replaces the developer review, decided 2026-10-23): worm bin rows (banana peel, apple core, carrot top as greens; dry leaf as browns) match [EPA, Composting at Home](https://www.epa.gov/recycle/composting-home), which also excludes meat, dairy, oils and glossy paper, none of which appear; shelf rows (sturdy box, flowerpot tub, cloth bag) are consistent with [EPA, Reducing and Reusing Basics](https://www.epa.gov/recycle/reducing-and-reusing-basics), and the box is always drawn whole (condition decides); mending rows (teddy button, cart wheel, kite tail) are repair of a toy missing one part with no disposal claim; Remake rows (squashed can, crayon stubs, bottle caps) are island inventions, and no voice line or card says a real plant makes them, while the how-to note tells grown-ups to check their town's recycling and compost rules; paper, the tin with a lid, glass, batteries and EPA-excluded foods are confirmed absent.
- Ran: `npm run typecheck`; `npm test` 232 files / 2968 tests passed (then the game's rule tests 36/36 after review fixes); `BROWSER_SUITE=shed` passed (level 1 empty-yard drop uncounted then every scrap fed, score 0/0; level 4 one wrong place = 1 miss, Show a hint = 1 hint and glow, portrait screenshot with four places in two rows, finish 1/1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=second-chance-shed` level 1 14.5 s and level 4 32.1 s; `npm run build`. game-reviewer fixes: a restart could count an item's hint twice; stale reason speech after a restart.
- Not run: offline check (only a new clip asset changed), levels 2 and 3 in the browser. "Show me one" carries the item by a game tween, not the drawn ghost hand. Open: a two-year-old's first drag, pictured keys without speech, whole against squashed, device speech, Remake mistaken for a real bin ([DEVICE-CHECKS](../DEVICE-CHECKS.md#second-chance-shed-levels-14-nature-sustainability-n2-2026-10-24)).
