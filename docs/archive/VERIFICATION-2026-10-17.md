# Verification 2026-10-17 (archived entries)

## 2026-10-17 — RW03 home and navigation packet

- Docs/prototype only, [PR #501](https://github.com/rjdunlap/neo/pull/501), `codex/rw03-home-navigation`, source audit `97efae1` plus queue-only integration `023d4c4`. [Packet](../rework/HOME-NAVIGATION.md), [wireframe](../rework/home-navigation.html); no production routes or creature-art files changed.
- Chromium inspection at `http://127.0.0.1:5193/docs/rework/home-navigation.html`, 1024×768 and 768×1024: collection selection, interrupted/completed sample project, lap sample Next game → original workshop, index page return, couch caller return and profile reset passed; no page errors. One-off probe `test-results/rw03-probe.mjs` is ignored, not a committed suite.
- Reviewed [landscape](../rework/concepts/rw03-landscape.png) and [portrait](../rework/concepts/rw03-portrait.png) document snapshots; visible buttons ≥104 px and no horizontal overflow in portrait. This is a scrolling wireframe, not proof of a production canvas layout or input cancellation. Real game/save/speech/controller behavior is simulated or described.
- Passed Markdown links/anchors and `git diff --check`. Typecheck, unit tests, build, game/world/couch suites and offline not run: production code unchanged. Real-child/device navigation observations remain open in [device checks](../DEVICE-CHECKS.md). Preview server stopped after inspection.

## 2026-10-17 — Ramp Race support definition (Q1)

- Defined the truthful Ramp Race support packet in [the definition](../definitions/ramp-race-support.md): accurate level 1–4 goal, steps, finish and miss wording, plus an idempotent corrective glow and recovery demo after an unfair pair. Accounting unchanged.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser, offline and fingerdemo not run: no code changed.
- Open: the Q2 build; device speech for the half-marks; whether a child understands the glow. Neither is established by this docs-only entry.

## 2026-10-17 — Sprout Shuffle G1 definition

- Defined Sprout Shuffle levels 1–3 in [the definition](../definitions/sprout-shuffle.md): one-locus rules, four-route tables, Check/help/finish and layouts. Docs only; no code, registration, voice, save or band change. G2 stays blocked on four developer decisions (reviewer, school entry, level 1 accounting, home land), each with a proposal.
- Ran `node scripts/check-links.mjs` and `git diff --check` (both passed: links ok, no whitespace errors). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the developer decisions; biology/education model review; the G2 build.

## 2026-10-17 — RW04 welcome adventure definition

- Defined Welcome a New Friend in [the packet](../rework/WELCOME-ADVENTURE.md) from a source audit at `84e1433`: Stamp Studio, Pet Kitchen and Song Maker ranges, which rounds report a creation, which Pet Kitchen levels fix their plates, and how a story round's creation is (not) kept today. Docs only; no code, save, voice or band change.
- Ran `node scripts/check-links.mjs` and `git diff --check`. Typecheck, unit tests, build, browser, offline and fingerdemo not run: no code changed.
- Open: the developer's hello-song level decision; RW05/RW06 before RW07; observed play and learning.

## 2026-10-17 — Fill and Dump deep dive

- Docs only: [deep dive](../deep-dives/fill-dump.md) on `claude/fill-dump-deep-dive` ([PR #513](https://github.com/rjdunlap/neo/pull/513)). Audited levels 1–5, pools and gaps (silent tip window, dead grass taps, spoken-only count, flat silent pour, open-ended level-5 how-to lines); opened IM K lesson 9, CDC milestones via Understood, Lovevery, Playvolution and *Where's My Water?*; others marked search summary or recalled.
- Five ready slices added to the roadmap; four decisions to WAITING; V3 pour feel and the busy-window acknowledgment stay gated.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Astronomy subject research

- Added the [astronomy study](../deep-dives/subjects/astronomy.md): opened NGSS 5-ESS1-1, MS-ESS1-1/2 and HS-ESS1-1/2/3 (via page source), NASA/OpenStax/Chandra/Webb/Space Place science pages, two full papers (Agan 2004, Starakis and Halkia 2014), two abstracts and eight references. Snippet-only items are marked. Far Lights is the first ladder; eclipses, seasons, clusters and two-view cases extend Moon Window and Observatory Files.
- Updated the subject tracker, Space link, notebook rows, roadmap [Astronomy recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#astronomy-recommendations), developer decisions and device checks. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: astronomy-educator review (inverse-square toy, halo convention, toy parallax, tilt, season and cluster models), placement, exploration accounting, older entry; no reference app played.

## 2026-10-17 — Chemistry subject research

- Added the [chemistry study](../deep-dives/subjects/chemistry.md) (Bond Beads ladder; Island Bridges molecule seas; review-gated Weigh It and Stir and See reaction modes).
- Opened at source: NGSS 5-PS1-1 and MS-PS1-1/5/6, the NRC Appendix A progression (its grade columns were unclear), the SpaceChem educator guide (text extracted from the PDF) and an RSC Education conservation-of-mass article. Sokobond, Opus Magnum, PhET and the misconception papers come from search summaries only.
- Updated the subject tracker, the Matter link, the notebook row, roadmap [Chemistry recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#chemistry-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks.
- Open: chemistry-educator review (molecule list, model limits, reaction art), placement, older entry, layout audit of the 9-bead case; no reference game played.

## 2026-10-17 — Song Maker deep dive

- Wrote [the Song Maker deep dive](../deep-dives/song-maker.md): a source audit of levels 1–7 and their pools; computed gaps (levels 5–6 hit areas about 91–92 units, a free round that can end without a keepable song, creative rounds stepping up, the inline level table, no sol on any grid); nine precedents and NCAS references; proposed levels 8–13, including M4 *answer the phrase* as level 9; nine ordered slices. Three are ready (roadmap ready list 7–9); D1–D6 are added to WAITING-ON-DEVELOPER.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the developer decisions; the computed target sizes are unmeasured on a device; no child has heard a question-and-answer round.

## 2026-10-17 — Jar Sort definition

- Defined Jar Sort levels 1–8 in [the definition](../definitions/jar-sort.md): one-piece-per-move model, frozen solver-checked boards, computed jar layout, lit targets at 1–2, refused-move and wander accounting, bounded hint search with an undo fallback, bot, how-to and registration; five references cited.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the six defaulted decisions; the layout numbers and hint time bound are computed, not measured; no child has played it.

## 2026-10-17 — Ramp Race Trial Shelf / One Change definition (Q3)

- Defined Ramp Race levels 5–6 in [the definition](../definitions/ramp-race-trial-shelf.md): stacked record cards, free paw guesses, a locked control lane with both-changed starts, once-per-question hints, a ghost-finger plan and a frozen layout. Not built; Q4 waits on Q2 and inquiry decisions 1–2 plus the lane policy.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser, offline and fingerdemo not run: no code changed.
- Open: the build, and whether a child reads the cards as *her* runs and tells a guess from a record (device checks when Q4 builds).

## 2026-10-17 — Egg Catch deep dive

- Docs only: [deep dive](../deep-dives/egg-catch.md) on `claude/dive-egg-catch` ([PR #517](https://github.com/rjdunlap/neo/pull/517)). Audited levels 1–7 and pools; gaps: levels 4–5 roll on a 3.5/2 s clock, a near-silent level-2 miss with no glow, hens laying while nobody plays, level 1's silent mid-fall taps, level 6's counted predictions, `Math.random` in `hatch`, the `eggs` browser loop stopping at 5.
- Opened the Big Bird's Egg Catch manual, Mario Wiki's *Egg*, TechCrunch on Turing Tumble, CDC 1-year milestones and CSTA/NGSS sources; Kaboom!, Gravity Maze, GraviTrax and Pipe Mania marked search summary or recalled.
- Seven ready slices added to the roadmap; five decisions to WAITING; level-1 every-touch waits on V2.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Splish Splash slice 1, words and guards

- [PR #519](https://github.com/rjdunlap/neo/pull/519), `claude/splish-words-guards`, code at `80f8ce9` on `origin/main` `d35dad9`: palm brush (1.6) on levels 1–2, phrase table, naming at first touch and as parts go clean, free-play nudge after 8 s, bounded how-to notes; accounting and level ids unchanged.
- Passed `npm run typecheck` and `npm test` (160 files, 1470 tests, including new phrase, namer, nudge, brush and scrub-path rule tests and the how-to guarded-ladder test); Vite at `http://localhost:5991`.
- `BROWSER_SUITE=early EARLY_ONLY=bath`: run 1 passed levels 1–6 and failed level 7 ("wrong part not noticed"); run 2 passed 1–4 and failed level 5 `[2, 0]` (the recorded flake). A probe played level 5 three times (3/3 `[1, 0]`) and level 7 three times (2/3): the failure had the harness pick `tummy` as the wrong part while `nose` was asked, and the nose splotch lies within the tummy's reach, so the game forgives it by design (unchanged parts code; a harness flake).
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=splish-splash FINGER_LEVELS=1,2` passed (12.7 s, 16.0 s).
- Not run: build, screenshots, offline. Open: device speech for the new lines, the brush on a small hand, the 8 s nudge ([device check](../DEVICE-CHECKS.md)).

## 2026-10-17 — Block Garden definition

- Defined Block Garden levels 1–8 in [the definition](../definitions/block-garden.md): fixed-shape placement with row and column clears, every bud to bloom (level 8 empties the bed), gardens built backward at 1–4 and frozen at 5–8, all solver-checked, the computed layout with 100-unit squares (72 at the grown-up levels 7–8), refused-drop and wander accounting, bounded hint search with an undo fallback, a drag bot, the how-to card and registration; five references cited.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the six defaulted decisions; the layout numbers and hint time bound are computed, not measured; no child has played it.

## 2026-10-17 — Cells and microbes subject research

- Added the [cells-and-microbes study](../deep-dives/subjects/cells-microbes.md): opened NGSS MS-LS1-1/2, MS-LS2-3 and 5-PS1-1 (via page source), the England science programmes, Siegal et al. 2011, Timmis et al. 2020, the Riedel-Kruse biotic-games paper, Foldscope, NSTA pages and three digital references. Search-summary-only and recalled items are marked. Puddle Lens is the first ladder; Zoom Walk, Leaf Litter Window and Photo Safari take content borrows.
- Updated the subject tracker, notebook row, roadmap [Cells and microbes recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#cells-and-microbes-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: biology/scale review, identity beside Zoom Walk, placement, exploration accounting, older entry; no reference app played.

## 2026-10-17 — Sound Garden deep dive

- Docs only: [deep dive](../deep-dives/sound-garden.md) on `claude/dive-sound-garden` ([PR #521](https://github.com/rjdunlap/neo/pull/521)). Audited levels 1–6; gaps: one fixed sound per answer, fast/slow confounded with count and length, answer creatures never heard (turtle absent, off-scale croak), silent busy taps (V2), a hidden echo rhythm, an unbounded how-to step.
- Opened the Electroplankton, Loopimal, Toca Band (ACCM) and Blob Opera pages; Chrome Music Lab, Rhythm Heaven, classroom standards and the pitch-word, beat and relative-pitch studies are search summaries; JumpStart Music and Simon recalled.
- Seven ready slices added to the roadmap; four decisions to WAITING; level 1's every-touch retrofit waits on V2.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Domino Run definition

- Defined Domino Run levels 1–8 in [the definition](../definitions/domino-run.md): a one-lane slot model with reach by size and a one-size-bigger push rule (a toy rule, labelled), forks with two bells, a gong only a giant rings, authored first lines with their solutions worked out, seeded generation with plan filters, stall-as-experiment accounting with a glow after two stalls, a drag bot, the how-to card and registration in Bubble Beach; six references cited (Whitehead via a secondary source).
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the five defaulted decisions; layout numbers are computed, not measured; no child has played it.

## 2026-10-17 — Dot Link level 11, Find my buddy

- [PR #524](https://github.com/rjdunlap/neo/pull/524), `claude/dot-link-buddy`, code commit `5d1bf4e` on `7a3bb6b`: toddler entry level 11 (3×3 two-color board, one lit adjacent pair that wiggles; four buddies; a wrong same-color line is one miss with `dots.buddyhint`, no hint mode). Toddler `order` `[1, 11, 2]`, `entryLevels: [11]`.
- Ran `npm run typecheck` (pass); dot-link logic, registry and content tests (114 pass). Full `npm test` had 4 failures (ferry-jam, peg-garden, penguin-slide) under machine load that passed on an isolated rerun: timing flake on unchanged code.
- `BROWSER_SUITE=batch BATCH_ONLY=dots DOTS_LEVELS=11` passed at `http://localhost:5490`: one wrong pair = 1 miss and no pop, then four buddies, saved [1, 0], sticker. `BROWSER_SUITE=fingerdemo FINGER_ONLY=dot-link FINGER_LEVELS=11` clean in 9.1 s. One portrait screenshot (768×1024) reviewed by eye.
- Not run: `npm run build` (no shared assets), other dot-link levels, offline check. Open: a toddler's drag on device ([device checks](../DEVICE-CHECKS.md)).

## 2026-10-17 — Teddy Doctor deep dive

- Docs only: [deep dive](../deep-dives/teddy-doctor.md) on `claude/dive-teddy-doctor` ([PR #525](https://github.com/rjdunlap/neo/pull/525)). Audited levels 1–6; gaps: level 1 taps dropped during the instruction and silent away from a boo-boo, how-to says "tap" for the level 2–3 drags, an unbounded level 6 step, lap's level 2 drag unwatched.
- Opened Common Sense Media (Toca Doctor, Toca Pet Doctor, Dr. Panda's Hospital), the Daniel Tiger episode archive, the Teddybear Hospital cohort study and the CDC 18-month page; Doc McStuffins, BMJ review and others are search summaries; JumpStart's Dress Teddy and Pokémon Center recalled.
- Four ready slices added to the roadmap; one decision row to WAITING (new ailments wait on the body/health practical-care review); level 1 taps during the spoken line wait on V2.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Fruit Slice definition

- Defined Fruit Slice levels 1–8 in [the definition](../definitions/fruit-slice.md): closed-form slow arcs (no engine), a swept-segment slice test, tap at 1 and swipe from 2, one kind, only fruit, stop-and-send counts, two kinds, a straight line through exactly N still fruit, pieces by twos; at most one miss per stroke, a glow after two, a trace bot, the how-to card and Bubble Beach. Fractions rungs deferred to the fractions study (#480).
- References: Fruit Ninja (App Store 4+, Common Sense 7+), Math Master's press release and Toca Kitchen 2's parent page were opened; the Zen-mode clock is from a fan page and the Aziz gesture papers from a search summary only (403).
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the five defaulted decisions; arc and hang numbers are computed, not felt; no child has played it.

## 2026-10-17 — Engineering design subject research

- Added the [engineering-design study](../deep-dives/subjects/engineering-design.md): opened NGSS 3-5 and MS ETS1, the 7 Principles of Universal Design, the Johnson, Kelly and Cunningham (2021) abstract and the Poly Bridge 2 store page; K-2 ETS1, England D&T and Beck et al. reused from the inventions study; Lottero-Perdue, Bagiati and Evangelou, ITEEA STEL and several references from search summaries only, marked. Welcome Ways is the first ladder; Gadget Bench, Wobble Works and Sink or Float take levels.
- Updated the subject tracker, notebook row, roadmap [Engineering design recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#engineering-design-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: identity beside Habitat Helpers, accounting, placement, cast, access-representation review, 13+ registration; no reference game played.

## 2026-10-17 — Mirror Brush fold button definition

- Defined Rainbow Fingers' fold page in [the definition](../definitions/mirror-brush-fold.md): a seeded page type at level 2 (no new level ID), a 104-unit fold button after the first mark, a swing-press-open print through a wet layer, so only paint added since the last fold is mirrored, no misses or counted hints, a nudge wiggle, the bot, how-to lines and pure `mirrorX`/`foldMarks`/`pageKind` rules. Prediction stays with Bug Builder's *Fold a friend*.
- References: Tullet's *Mix It Up!* (Publishers Weekly and Kirkus reviews, from a search summary), butterfly blots (UGA), *Silk* (National Math Festival page, search summary), the dive's symmetry apps.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: decision 0 (a fold button in Rainbow Fingers reverses part of the approved no-button lean) gates the build; two defaulted decisions; no child has seen a fold.

## 2026-10-17 — Shape Buddies level 3 definition

- Defined Shape Buddies' two-shapes-combined level in [the definition](../definitions/shape-buddies-combined.md): a wide gap where a flat friend (near half) and a cup friend (far half) hold hands into a spoon; the existing `bridge`/`receiver` docks move side by side, `PLANS[3]` accepts only Flat, a pure `failureLine` picks four new spoken failures, misses stay 0, per-role hints, the guidance-driven bot, how-to `LevelLine`, pre-K and school 1–3.
- References: Snipperclips, Thinkrolls 1 (App Store), The Incredible Machine (MobyGames), Crayon Physics Deluxe (Steam), from search summaries.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: two defaulted decisions (pre-K window, a level 4); no child has played it.

## 2026-10-17 — Garden Grow deep dive

- [PR #530](https://github.com/rjdunlap/neo/pull/530), `claude/dive-garden-grow`, docs only: [deep dive](../deep-dives/garden-grow.md) with the ladder for levels 1–7 today, fresh content (true how-to, growth stages, flower kinds) and appended levels 8 *Grow it up* (lap) and 9–11 rows, columns and same in every row (pre-K).
- Found reading the code: uncapped how-to steps at 5 and 7, level 3's untrue take-out step, level 7 always solved by filling every bed, no words for full beds or a seed taken out. Recorded, not fixed.
- Opened Common Sense Media (Sago Mini Farm, Toca Nature, Toca Lab: Plants, Plants HD), GamePressure's Viva Piñata guide, the Nico & Nor App Store page, NGSS K-LS1-1 and the CDC 15-month page; the Viva Piñata wiki (402), Tenderleaf, First Orchard and 2-LS2-1 are search summaries; Stardew Valley/Harvest Moon recalled.
- Seven ready slices added to the roadmap; one decision row to WAITING. Under the Soil and the other subject modes stay with their own definitions.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Making media subject research

- Added the [making-media study](../deep-dives/subjects/making-media.md). Opened: Media Arts pre-K, K and grade 5 at a third-party mirror (trimmed quotes marked), ISTE 1.6, Common Core SL.2.5 and W.K.6, EYFS Development Matters, the Breyer (2002) thesis abstract, and the Flipnote Studio and Stop Motion Studio pages. Media Arts grades 2 and 8, Toontastic and the young-children film studies came from search summaries or citations only, or were not opened, and are marked. Movie Night is the first ladder. Pixel Flipbook, Song Maker's kept tune and a family card cover the tracker's flipbook, recorded song and stop-motion.
- Updated the subject tracker, notebook row, roadmap [Making media recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#making-media-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: identity and placement, premiere accounting, 13+ registration, flipbook storage, cast. No reference game was played.

## 2026-10-17 — Jelly Drums slice 1 remainder, guards and tunes

- Listen-again note button on echo levels 4–9 (counts no miss or hint), echo levels instruct `jelly.echo`, `tunesOf`/`drawTune` (shapes plus Hot Cross Buns, Mary, Jingle Bells; songs checked against letter-note charts found by web search; Oh! Susanna left out), idle nudge on levels 1–3, bounded how-to lines. Commit 435ba0a, PR #529.
- Ran `npm run typecheck`; `npx vitest run src/games/jelly-drums src/content src/games/registry` (11 files, 118 tests); `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` on a Vite dev server (levels 1–10, no page errors; run was before the final 50-unit button move); one portrait 768×1024 screenshot at level 9 after the move.
- Not run: `fingerdemo` (bot and `jellyToTap` untouched), build, offline.
- Open: whether the button is found, device speech for song titles, whether the nudge is welcome ([DEVICE-CHECKS](../DEVICE-CHECKS.md)); Oh! Susanna and the invitation tune unbuilt.

## 2026-10-17 — Discovery D2a Little surprises definition

- Defined the three-game mix in [the definition](../definitions/little-surprises.md): a lap/toddler home-spot mix spot (the story-spot slot), a preview sheet, Next stop/Skip/All done in D1b's result rectangles with D1b's offer suppressed, every route back to the home spot reopening the preview, a no-bonus ending, and a session/item/round token table reusing `DiscoveryMemory`'s owner + epoch guard. Source audited on `d0d5b65`.
- References: Just Dance 2023 playlist help, WarioWare, Khan Academy Kids (search summary), YouTube Kids autoplay controls (Google support), Xbox AG 116.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build and browser not run: no code changed.
- Open: four non-gating leans (name, no hide switch, post-RW08 placement, Home reopening the preview); a child's grasp of Next stop vs Next level is a person check.

## 2026-10-17 — Stop and Go deep dive

- Docs only: [deep dive](../deep-dives/stop-and-go.md) on `claude/dive-stop-and-go` ([PR #535](https://github.com/rjdunlap/neo/pull/535)). Audited levels 1–4; gaps: the lap car ignores taps, back cars silent, the hint rings the light instead of the car or feet, the walk hint never resets, "Great driving" at the walk level, colour the only state cue, one fixed rhythm, no help when idle at the crossing.
- Opened Common Sense Media (Traffic Rush), Wikipedia (Mini Motorways), iGameMom (Sago Mini Road Trip), the dance-mat go/no-go study (PMC6805719), the Red Light, Purple Light 2019 trial record and Maryland Zero Deaths' pedestrian page; LEGO DUPLO World, Horn Book, Crossy Crash and Traffic Jelly are search summaries; NHTSA refused the fetch; Red Light Green Light, Frogger/Crossy Road and toy traffic lights recalled.
- Five ready slices added to the roadmap; one decision row to WAITING (walk signal waits on the safety reviewer).
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## Worker dispatch records (execution queue)

Coordinator dispatch notes from [the execution queue](../EXECUTION-QUEUE.md), moved out of the live verification log on 2026-10-17.

### 2026-10-17 — Discovery direct-next dispatch

Reconciled completed [Safari actions #474](https://github.com/rjdunlap/neo/pull/474), confirmed merge and released its slot. Fresh allowance and overlap admitted only [D1b](../DISCOVERY.md#d1b-build-packet-one-direct-next-game) to worker `01a1477f-58b2-7ca2-8607-1975042bf5eb`; existing named worktree is a clean placeholder at old main with no unique commits. Queue records changed reset identities, scope and pending proof. Docs-only source links/anchor and `git diff --check` passed; no gameplay checks rerun.

## 2026-10-17 — Robots and automation subject research

- Added the [robots-and-automation study](../deep-dives/subjects/robots-automation.md): opened the CSTA 2026 PDF (EK/E1/E2-SOC-HU-15, E2-SYS-HW-11, E3-PRO-PD-04, E5-SYS-HW-12, MS-SYS-HW-31, MS-SOC-CE-45, S2-PHY-IO-02; printed pages), NGSS Appendix G, Levy and Mioduser (2010), Hallström (2021), the Hokayem et al. (2020) abstract, Treasureworld, and Autonauts, shapez, Opus Magnum, micro:bit, KIBO and CS Unplugged pages; Kempton (1986), KIBO sensors and Opus Magnum metrics marked recalled or secondhand. Helper House is the first ladder.
- Updated the subject tracker, notebook row, roadmap [Robots and automation recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#robots-and-automation-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: identity beside Sorting Machine, accounting, toddler entry, placement, older registration, model and card review; no reference game played.

## 2026-10-17 — Pile Match definition

- Defined Pile Match levels 1–8 in [the definition](../definitions/pile-match.md): 2D layered heap with a top-only freedom rule, a tray derived from the piece mask (3-slot asked basket at 1–2, 5 slots from 3), free put-back, kinds assigned in consecutive triples along a clearing route so no state dead-ends, computed portrait-fit layout, wrong-kind and full-tray accounting, hint order, bot, how-to and registration; six references cited.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the six defaulted decisions; layout numbers and the hint time bound are computed, not measured; no child has played it.

## 2026-10-17 — Bolt Boards definition

- Defined Bolt Boards levels 1–7 in [the definition](../definitions/bolt-boards.md): discrete pinned/hanging/down board poses computed exactly (a hanging center lies below its bolt), a covered-bolt rule, a toolbox model at 1–5 that provably never dead-ends, open-hole parking at 6–7 with a capped breadth-first hint, a layout test over every reachable pose, accounting, bot, how-to and registration (Barnyard); six references cited.
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the six defaulted decisions; fit numbers are computed, not measured; no child has played it.

## 2026-10-17 — Weather Wardrobe deep dive

- Docs only: [deep dive](../deep-dives/weather-wardrobe.md) on `claude/dive-weather-wardrobe` ([PR #538](https://github.com/rjdunlap/neo/pull/538)). Audited levels 1–7; gaps: the level-7 card still says pack for a trip, level 7 undressing is always everything, lap window holds a boing level, level 1 ignores most touches, a miss shows nothing, the trip never happens, sunny's "everything" is two, a dead undress voice line, the known `{name}` off-screen bug.
- Opened BridgingApps (Sago Mini Babies Dress Up), Kids Academy, Common Sense Media (Tinybop Weather), Easterseals (iDress for Weather), Pre-K Pages and NGSS K-ESS2-1/K-ESS3-2; Daniel Tiger (mirror 404), Pokémon GO weather (Bulbapedia 403) and Animal Crossing are search summaries; Dress Teddy and the felt weather bear recalled.
- Eight ready slices added to the roadmap; one decision row to WAITING.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Executive function subject research

- Added the [executive-function study](../deep-dives/subjects/executive-function.md): opened Diamond (2013) and Diamond and Lee (2011) at PMC, the Kassai et al. (2019) abstract, Scionti et al. (2020), the FTC Lumosity release, CASEL self-management, Harvard's activities-guide landing page and Wikipedia's Simon and Tower of London pages. Not opened: Head Start ELOF (403; P-ATL codes from third-party alignments), EYFS (404), the Harvard chapter PDFs (no text extraction), Rush Hour's page (403).
- Updated the subject tracker, roadmap [Executive function recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#executive-function-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: wording rule, Scoop Shop window, Pancake Stack identity/accounting/placement, Critter Sort switch accounting; no reference game played; no transfer claimed.

## 2026-10-17 — Rainbow Fingers slice 2, every touch counts, pots, nudge

- Changed (`9dcc0257`): levels 1–2 count every lifted touch (pat, hold, drag) toward the frame, a pat splats a 100-across flower, pots are 104 across at 104 spacing with ink marks (`potLayout` keeps clear of the pet), and a blank spot sparkles after 8 quiet seconds. Hint accounting (decision 5) not built.
- Ran: `npm run typecheck`; rainbow-fingers logic and how-to tests (5 new rule tests) pass. Full `npm test` had 3–4 five-second timeouts in unchanged solver tests under load (load average 7); rerun alone all passed except penguin-slide "level 8 combines useful snow stops…", a known load flake on unchanged code.
- Browser (http://localhost:5568, 5831): `early` paint levels 1–2 pass (level 1 finishes on five pats alone); `fingerdemo` `rainbow-fingers` levels 1,2 pass (25.9 s, 30.5 s) and 6,7 pass (25.5 s, 13.9 s). One portrait screenshot (view 1024×1365) of level 2: seven marked pots in one row, clear of the pet.
- Not run: `npm run build`, `early` levels 3–7, device checks (a one-year-old's pat and the 104-unit pot stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## 2026-10-17 — Puddle Gobble definition

- Defined Puddle Gobble levels 1–8 in [the definition](../definitions/puddle-gobble.md): a rain puddle on Bubble Beach soaks up things that fit (tiers 1–4, count-based growth, so levels 1–7 never dead-end), too-big things never block or count, smallest first at 5, numbers at 6, sums at 7 and an exact pail total with a free let-go at 8; accounting, bot, how-to and registration; five references cited (Hole.io, Donut County, Katamari Damacy, Feeding Frenzy recalled, Piaget/Pink Tower summaries).
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the five defaulted decisions; sizes and fit are computed, not measured; no child has played it.

## 2026-10-17 — Peg Garden deep dive

- Docs only: [deep dive](../deep-dives/peg-garden.md) on `claude/dive-peg-garden` ([PR #541](https://github.com/rjdunlap/neo/pull/541)). Audited levels 1–5; gaps: taps during a fall and beside the board do nothing, level 3 has no stall guard and counts drift as error, its hint marks the bud not the drop spot and never clears, any shot blooms numbered buds, no `pointercancel`, level 1's card finish is wrong.
- Opened Peggle, Pachinko and Galton board (Wikipedia) and NGSS K-PS2-1; Peggle Blast reviews, Plinko, Sushi Cat, Hape Pound and Tap Bench, object permanence boxes and GraviTrax are search summaries; Gorillas recalled.
- Six ready slices added to the roadmap; one decision row to WAITING.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Nature and sustainability subject research

- Added the [nature-and-sustainability study](../deep-dives/subjects/nature-sustainability.md): opened NGSS K-ESS3-3, 5-ESS3-1 and MS-ESS3-3, England science Y1/Y2/Y4, EPA's recycling, composting and waste-hierarchy pages, Sobel's essay page, Çoruhlu and Er Nas (2018), and Terra Nil, Alba, Eco and Animal Crossing sources; EYFS, NAAEE and Sesame Go Green marked recalled or from search summaries. Second Chance Shed (the Trash Sort seed) is the first ladder.
- Updated the subject tracker, the notebook's Trash Sort row, roadmap [Nature and sustainability recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#nature-and-sustainability-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: overlap with Critter Sort, item/card review, placement, older registration and framing; no reference game played.

## 2026-10-17 — Swing Pals definition

- Defined Swing Pals levels 1–6 in [the definition](../definitions/swing-pals.md): a small-swing pendulum on three hooks (beats 1.0, 1.5 and 2.0 s; weight and height never change the beat), pushes that never lower height with a latched bell (1–3, no misses), then pick the hook so her friend swings along with the pet's, with weight (5) and height (6) as tempting variables; accounting, bot, how-to, layout figures (computed) and registration (Rainbow Meadow); six references cited (NGSS 3-PS2-2, PhET Pendulum Lab, Galileo recalled, Case and Swanson citation only, STEMIE, Master of Swing).
- Ran `node scripts/check-links.mjs` and `git diff --check` (docs only). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: the five defaulted decisions; layout is computed, not measured; no child has played it.

## 2026-10-17 — Stamp Studio slice 4, Play the picture

- Changed: a music-note button at levels 3–6 plays the picture's stamps left to right (`playOrder`, pentatonic pitch by height, at most 5.5 s); nothing scored, saved picture unchanged.
- Ran: `npm run typecheck`; `npx vitest run src/games/stamp-studio src/content` (117 passed, including the `playOrder` rule tests and a finish.test.ts lifecycle test that failed on the first version when the button stayed visible after finishing); `BROWSER_SUITE=creative CREATIVE_ONLY=stamps STAMP_LEVELS=2,3,6` on http://localhost:5302 passed (presses play, every stamp sounds once in x-order, no button where the plan has no play); one portrait probe at level 4 (768×1024) showed the button clear of help and pet.
- Not run: build (no shared files or assets changed), `fingerdemo` (bot unchanged). Open: device audio and whether a child links height to pitch ([device check](../DEVICE-CHECKS.md)).

## 2026-10-17 — Little Helpers deep dive

- Docs only: [deep dive](../deep-dives/little-helpers.md) on `claude/dive-little-helpers` ([PR #546](https://github.com/rjdunlap/neo/pull/546)). Audited levels 1–6; gaps: taps while busy and on the grass or waiting helpers do nothing, level 6 teams are equal by construction (she only counts the total), level 5 shows the total not the gap, the dots never fill, level 2 alternates 1, 2, only one fruit of a bunch reaches the basket, an empty crowd plays the miss sound, helper hit areas overlap. Make ten is gated: Duck Pond 10 already does it.
- Opened the Pikmin Wiki (Carry, Lift), Hi Ho! Cherry-O and Lemmings (Wikipedia), Common Sense Media's Moose Math review and Common Core K.OA and 3.OA; Pikmin Bloom, Count Your Chickens, the Montessori spindle box, Numberblocks World and Khan Academy Kids are search summaries.
- Seven ready slices added to the roadmap; one decision row to WAITING.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.

## 2026-10-17 — Visual art subject research

- Added the [visual-art study](../deep-dives/subjects/visual-art.md) on `claude/subject-visual-art` ([PR #547](https://github.com/rjdunlap/neo/pull/547)): opened England art and design KS1–3, EYFS expressive arts, Core Arts visual arts K/2/4/7 (Washington's adoption on Common Planner), the NCAS anchors, NPS weaving patterns and MIT's weaving-in-Scratch page; Lowenfeld, Gardner, VTS, Jacquard and the reference games are search summaries; Head Start ELOF returned 403.
- Little Loom first; Picture Talk card; Gallery Walk later. Updated the tracker, notebook, roadmap [Visual art recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#visual-art-recommendations) and a decision row. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks.
- Open: identity and Paint Pier capacity, accounting, kept cloth, styles/traditions review, Gallery Walk art; no reference game played.

## 2026-10-17 — Ready list moved to its own file

- Docs only: the roadmap's 68-line numbered **Ready to build now** list became [READY.md](../READY.md): a **Next ten** in priority order (the eligible RW05 definition first, then the slices the old list led with) and a **Queued** section grouped by game, unnumbered so a deleted line leaves no gap; every line keeps its wording, check tier and dive link, and the four lines that named other lines by number now name the slice instead.
- The roadmap's section is a one-paragraph pointer and its pick steps read from Next ten, with the refill rule moving Queued lines up below five; the stale "lines 7–16 were added" sentence is gone. Repointed the execution queue's selection table, the deep-dive procedure's step 7, the rework brief and work items, the 2026-10-15 cleanup archive, AGENTS.md (document table row added) and the docs-keeper agent.
- Ran `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean). Typecheck, unit tests, build, browser and fingerdemo not run: no code changed.
- Open: nothing; the next closeout exercises the new delete-and-move-up rule.

## 2026-10-17 — Archive verification entries by script

- Docs tooling only: `scripts/archive-verification.mjs` moves dated entries above the coverage summary into `docs/archive/VERIFICATION-<entry date>.md` (older than the newest date by default, `--before`, `--keep=N`, `--dry-run`), re-bases their relative links, spawns `check-links.mjs --fix-moved` per archive touched and ends with a full link check; it exits 2 on a parse problem and 1 on broken links.
- Ran it once on the merged tree with `--before=2026-10-17 --keep=15`: 27 entries moved into the new [Verification 2026-10-17](VERIFICATION-2026-10-17.md), 15 stay live; links in the execution queue, the RW03 packet and a completed-work file were repointed.
- Moved all 37 `###` worker dispatch sections (2026-10-13 to 2026-10-17; the brief named four) from below the summary into the dated archive files under a dispatch-records heading; nothing linked to their anchors. The coverage summary and the "Never established" paragraph stay.
- Passed `node scripts/check-links.mjs` (links ok) and `git diff --check`; a second `--dry-run` reports nothing to move. AGENTS.md's "Checks run" bullet and the README now point at the script.
- Not run: typecheck, unit tests, build and browser suites (no game code or shared TypeScript changed). Not covered: entries whose heading is not `## YYYY-MM-DD — title` fail the parse on purpose; two entries with the same heading in one archive file would shift an anchor (the script warns).

## 2026-10-17 — Monster Munch deep dive

- Docs only: [deep dive](../deep-dives/monster-munch.md) on `claude/dive-monster-munch` ([PR #549](https://github.com/rjdunlap/neo/pull/549)). Audited levels 1–8; gaps: the card says the monster counts aloud at 1 and 4–5 (it does not) and rings a bell at 7 (there is none), a wrong pad promises counting that never happens, one generic hint line, lap monster taps feed nothing, single rounds at 1–2, silent short drops.
- Opened Wikipedia (Cookie Monster Munch), Feed the Monster listings, Moose Math (App Store, Common Sense), Toca Kitchen 2 (Toca Boca, Microsoft Store), My Very Hungry Caterpillar, Gracie & Friends Breakfast Time and Common Core K.CC and 3.OA; Atari modes, Moose Juice details and PhET are search summaries; Hungry Hungry Hippos and the Frydman and Bryant finding recalled.
- Six ready slices queued in [READY.md](../READY.md); one decision row to WAITING.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, browser or device checks.
