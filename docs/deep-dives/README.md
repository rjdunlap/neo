# Game deep dives

**Decided (the developer, 2026-10-10):** give every island game its own session that researches similar games in its genre and expands its levels and ladder across the age bands. This page is the tracker and the procedure. Each game's findings and ladder go in `docs/deep-dives/<game-id>.md`, written from the [template](TEMPLATE.md). The roadmap's [chunk 14](../ROADMAP.md#next-up) points here.

**A deep dive session is research and ideation only: documents, no code.** Do not edit anything under `src/`, `scripts/` or `public/`, do not add or change tests, and do not build any slice, however small or ready it looks. The output is the write-up and the doc updates in step 7, nothing else. Building comes later, in its own session that the grown-up starts from the write-up's slices. If a bug, a trap or a missing guard turns up, write it into the write-up's known gaps or build slices instead of fixing it, and run no browser suites or tests (the docs-only tier in [Verification budget](../../AGENTS.md#verification-budget) applies: links and `git diff --check`). If the grown-up asks in the prompt for a slice to be built, that request overrides this paragraph.

A deep dive turns the ladder rounds in [IDEAS.md](../IDEAS.md#short-ladder-audit-2026-10-09) (the audit, round two and round three) into one researched plan per game. Those rows are its starting point, not its limit. The [rules for every activity](../../AGENTS.md#rules-for-every-activity) still hold: more quantity is welcome (the developer's direction of 2026-10-10), while speed, timers, clutter, extra memory load and anything that punishes stay out.

The [family experience review](../FAMILY-EXPERIENCE.md) adds a design lens: what makes the action pleasurable, what varies on replay, how presentation explains the consequence, and whether making, exploring or shared roles deserve more depth. Its suggested game sessions are unclaimed alternatives when the grown-up selects one; they do not silently reorder the waves or change a designed/building row. Cross-game discovery, art and family-role studies are separate system definitions, not completed game deep dives.

## One session, one game

1. **Claim it.** Fetch `origin`, then check this table, open pull requests and unmerged branches for the same game ID. Pick the first **not started** game in the lowest wave unless the grown-up names one. Make the first commit on a feature branch set its row to **in progress** with the branch name, and publish a draft pull request straight away so other sessions see the claim. One game per session; a game whose code another branch is changing waits.
2. **Read what is there.** The game's `index.ts`, `logic.ts` and tests, its [GAMES.md](../GAMES.md) entry, its how-to card in `src/content/howto.ts`, its levels table for each band, its voice lines, its couch entry if it has one (`src/couch/catalog.ts`), and every mention in [IDEAS.md](../IDEAS.md) and the [roadmap](../ROADMAP.md). Write down the current ladder level by level, and what each round draws from (the content pools).
3. **Research the genre.** Look at five to ten similar games: classics, current touch apps, educational software and board or physical play. Include the references the game already names. For each, note what its progression does (new rules, content, modes, what it holds back) and what it does that Puddle Island must not (timers, lives, streaks, ads). Note any learning standards or a developmental source when the game teaches a school skill. Cite links. A reference is inspiration, not a design.
4. **Design the ladder.** Cover every band the game serves, plus any band it could open:
   - **Fresh content** inside existing levels.
   - **New levels appended on top**, never renumbered.
   - **Openings to a younger band** from level 1.
   - **Easier entries or levels between existing ones**, appended with stable IDs and placed using the built band's `order`; declare `entryLevels` for appended easy entry IDs so birthdays land safely. Remaining content, band and accounting decisions stay under [Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer).

   For each level write:
   - its first round;
   - what she decides;
   - how a mistake or an experiment is handled, and the hint;
   - what a rule test asserts;
   - its cost and couplings (art, voice, the ghost-finger bot, couch, journal, the picnic).

   Say which band window each level falls in. Mark anything that needs a decision from the developer, and add that decision to the roadmap's "Waiting on the developer".
   Also write a small **experience and presentation** section: the first unsupported action; touch acknowledgment and the visible consequence; the content/arrangement variety; cognitive challenge versus motor precision; a supported ending and replay path; solo/co-play roles where meaningful; and what a person or device still needs to judge. Creative choice and prediction stay distinct from wrong answers. Include one concrete art/feel example using the existing code-drawn tools, not a request for a global rendering rewrite.
5. **Write it up** as `docs/deep-dives/<game-id>.md` from the [template](TEMPLATE.md), ending with an ordered list of build slices, each sized for one session.
6. **Do not build.** The write-up alone is a complete deep dive. Order the build slices so the first is cheap and ready, and say which checks it would need, so the next session can start it at once.
7. **Update the docs and close the row.**
   - Set the row's status and link its deep dive.
   - Point the game's rows in the IDEAS ladder rounds at the deep dive.
   - Add its build slices to the roadmap's chunk 14 list.
   - Add a short VERIFICATION entry (docs only: what changed and that links and `git diff --check` ran).

**Status values:** **not started**; **in progress** (a branch is on it); **designed** (the write-up is merged and slices are waiting); **building** (slices are being built from the write-up); **done** (every slice the write-up calls ready is built, or deliberately left).

## Suggested order (non-binding)

The waves are a suggestion; the grown-up can name any game.

- **Wave 1: one round repeats today.** Tangram Town, Story Steps, Robot Path, Goodnight Room, Opposites and Puzzle Pals. These also deliver [chunk 13](../ROADMAP.md#more-to-play-in-every-band)'s first content slices.
- **Wave 2: her own band soon.** Lap and toddler favorites for a child about to turn one: Bubble Pop, Peekaboo Barn, Animal Snack, Splish Splash, Jelly Drums, Rainbow Fingers, Stamp Studio and Pet Says. Easier appended entries can now use `order` and `entryLevels`; follow each write-up's remaining content and band decisions.
- **Wave 3: the school core.** Counting, number and letter ladders that carry her longest: Duck Pond, Frog Hop, Market Stall, Word Monsters, Letter Trails, Pattern Train, Memory Match and Clock Tower.
- **Wave 4: everything else**, in any order.

## Tracker

Bands: L lap, T toddler, P preschool, K pre-K, S school, G grown-up. "Top level" is the highest level in the game's plan on 2026-10-10 (the six games built after that, Day by Day, Fill and Dump, Orchard Rows, Read & Do, Shape Buddies and Sing-Along Barn, were added on 2026-10-13 with their level at that date). It changes as slices land, so the deep dive records the current one.

| Game | ID | Bands | Top level | Wave | Status | Branch / PR | Deep dive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Animal Snack | `animal-snack` | LTP | 5 | 2 | building (slice 1 built: words, count sign, how-to, nudge, nearest taps) | `codex/animal-snack-counted-words` ([PR 160](https://github.com/rjdunlap/neo/pull/160)); `claude/roadmap-item-14-game-content-fno5j7` ([PR 99](https://github.com/rjdunlap/neo/pull/99)) | [animal-snack.md](animal-snack.md) |
| Beat Builder | `beat-builder` | PKS | 5 | 4 | designed; support and authored-phrase slices 1–3 built; woodland stage built ([PR #197](https://github.com/rjdunlap/neo/pull/197)) ([PR #196](https://github.com/rjdunlap/neo/pull/196)); proposed 6–9 and younger openings need decisions | `codex/beat-builder-deep-dive` ([PR #190](https://github.com/rjdunlap/neo/pull/190)) | [beat-builder.md](beat-builder.md) |
| Block Tower | `block-tower` | LTPKS | 6 | 4 | designed; slices 1–4 built; slice 5 mirrored reach at existing 6 built; proposed 7–9, experiments and younger entries need decisions | `codex/block-tower-mirrored-reach` ([PR #259](https://github.com/rjdunlap/neo/pull/259)); definition ([PR #254](https://github.com/rjdunlap/neo/pull/254)); prediction ([PR #244](https://github.com/rjdunlap/neo/pull/244)); reach ([PR #216](https://github.com/rjdunlap/neo/pull/216)); support ([PR #213](https://github.com/rjdunlap/neo/pull/213)) | [block-tower.md](block-tower.md) |
| Bounce Back | `bounce-back` | LTPK | 5 | 4 | designed; truthful words and rule guards ready; a gentler miss, courts and level 6 need decisions | `codex/bounce-back-deep-dive` | [bounce-back.md](bounce-back.md) |
| Bouncy Launch | `bouncy-launch` | LTPKS | 6 | 4 | slices 1, 3 and 5 (Feed the friend, built as level 7) built; notches/notes remain (device listen decision); near-or-far entry (8), lap pull, a second spring variable and magnet support need decisions | `codex/bouncy-launch-last-flight` ([PR #275](https://github.com/rjdunlap/neo/pull/275)) | [bouncy-launch.md](bouncy-launch.md) |
| Bubble Pop | `bubble-pop` | LTPKS | 14 | 2 | building (slices 1–3, the target sign and levels 12–14 built) | `codex/bubble-pop-number-dots` ([PR 159](https://github.com/rjdunlap/neo/pull/159)); `claude/bubble-pop-sign-and-counting` ([PR #203](https://github.com/rjdunlap/neo/pull/203)); [PR #206](https://github.com/rjdunlap/neo/pull/206) | [bubble-pop.md](bubble-pop.md) |
| Bug Builder | `bug-builder` | TPKS | 7 | 4 | not started | — | — |
| Bumper Garden | `bumper-garden` | LTPK | 5 | 4 | not started | — | — |
| Chain Reaction | `chain-reaction` | KS | 6 | 4 | not started | — | — |
| Clap the Syllables | `clap-syllables` | PK | 4 | 4 | not started | — | — |
| Clock Tower | `clock-tower` | KS | 7 | 3 | building (slice 1 built: truthful words and control support) | `codex/clock-tower-support` ([PR #165](https://github.com/rjdunlap/neo/pull/165)); `codex/clock-tower-deep-dive` ([PR 156](https://github.com/rjdunlap/neo/pull/156)) | [clock-tower.md](clock-tower.md) |
| Color Garden | `color-garden` | TPK | 6 | 4 | not started | — | — |
| Critter Crossing | `critter-crossing` | KS | 5 | 4 | not started | — | — |
| Critter Sort | `critter-sort` | KS | 5 | 4 | not started | — | — |
| Day by Day | `day-by-day` | KS | 3 | 4 | not started (first slice built; [definition](../day-by-day.md)) | — | — |
| Dot Link | `dot-link` | LTPK | 5 | 4 | not started | — | — |
| Duck Pond | `duck-pond` | LTPKS | 11 | 3 | designed | `claude/roadmap-item-14-game-content-uh41js` ([PR 114](https://github.com/rjdunlap/neo/pull/114)) | [duck-pond.md](duck-pond.md) |
| Duckling Parade | `duckling-parade` | LTPK | 8 | 4 | not started | — | — |
| Egg Catch | `egg-catch` | LTPKS | 6 | 4 | not started | — | — |
| Feelings Faces | `feelings-faces` | LTPK | 7 | 4 | not started | — | — |
| Ferry Jam | `ferry-jam` | KS | 6 | 4 | not started | — | — |
| Fill and Dump | `fill-dump` | LTP | 5 | 4 | not started (built after the gap review; pour mode built) | — | — |
| Fluffy Salon | `fluffy-salon` | LTPK | 5 | 4 | not started | — | — |
| Frog Hop | `frog-hop` | PKS | 7 | 3 | designed | `claude/roadmap-item-14-game-content-kg2ryl` ([PR 116](https://github.com/rjdunlap/neo/pull/116)) | [frog-hop.md](frog-hop.md) |
| Garden Grow | `garden-grow` | LTP | 5 | 4 | not started | — | — |
| Garden Rows | `garden-rows` | KS | 6 | 4 | not started | — | — |
| Goodnight Room | `goodnight-room` | LTP | 4 | 1 | building (levels 1–9 built); next tent/boat content and level 10 as defined in its dive | `claude/sweet-babbage-zq5bz6` ([PR 84](https://github.com/rjdunlap/neo/pull/84)); level 9 ([PR #239](https://github.com/rjdunlap/neo/pull/239)); earlier build history in the write-up | [goodnight-room.md](goodnight-room.md) |
| Habitat Helpers | `habitat-helpers` | PKS | 6 | 4 | not started | — | — |
| Inchworm Measure | `inchworm` | KS | 6 | 4 | not started | — | — |
| Island Bridges | `island-bridges` | G | 4 | 4 | not started (controller-only on the island: touch not built) | — | — |
| Jelly Drums | `jelly-drums` | LTPKS | 9 | 2 | designed (One big jelly built as level 10) | `claude/fervent-keller-f86ol8` ([PR 104](https://github.com/rjdunlap/neo/pull/104)) | [jelly-drums.md](jelly-drums.md) |
| Lantern Lights | `lantern-lights` | G | 6 | 4 | not started (island touch built 2026-10-13) | — | — |
| Lasso Loops | `lasso-loops` | PKS | 5 | 4 | not started | — | — |
| Lemonade Stand | `lemonade-stand` | S | 4 | 4 | not started | — | — |
| Letter Trails | `letter-trails` | PKS | 8 | 3 | building (slice 1 built) | `claude/tender-faraday-xt9q70` ([PR 122](https://github.com/rjdunlap/neo/pull/122)); slice 1: `codex/letter-trails-capital-start` ([PR #172](https://github.com/rjdunlap/neo/pull/172)) | [letter-trails.md](letter-trails.md) |
| Light Lab | `light-lab` | KS | 7 | 4 | not started | — | — |
| Little Helpers | `little-helpers` | LTPKS | 6 | 4 | not started | — | — |
| Mail Carrier | `mail-carrier` | LTPKS | 7 | 4 | not started | — | — |
| Market Stall | `market-stall` | PKS | 7 | 3 | building (slice 1 built: guards and named misses) | `claude/exciting-ride-je8lip` ([PR 118](https://github.com/rjdunlap/neo/pull/118)); slice 1: `codex/market-stall-support` ([PR #163](https://github.com/rjdunlap/neo/pull/163)) | [market-stall.md](market-stall.md) |
| Memory Match | `memory-match` | PKS | 11 | 3 | building (spoken support and shape/friend/fruit decks built; dot layouts next) | `codex/memory-familiar-decks` ([PR #264](https://github.com/rjdunlap/neo/pull/264)); `codex/memory-match-spoken-support` ([PR #170](https://github.com/rjdunlap/neo/pull/170)); `codex/memory-match-deep-dive` ([PR 153](https://github.com/rjdunlap/neo/pull/153)) | [memory-match.md](memory-match.md) |
| Monster Munch | `monster-munch` | LTPKS | 8 | 4 | not started | — | — |
| Opposites | `opposites` | LTPK | 4 | 1 | slice 1 built (twelve pairs, fairness) | `claude/zealous-cerf-vmw320` ([PR 87](https://github.com/rjdunlap/neo/pull/87)) | [opposites.md](opposites.md) |
| Owl Walk Home | `owl-walk` | TPK | 4 | 4 | building (slices 1–4 built 2026-10-13: tap the stone, owls with their own players, choose an owl, fly home, counted hops); lap entry, color or shape, the grown-up seat and levels 7–8 next | `claude/owl-walk-stone-taps` (dive: [PR #248](https://github.com/rjdunlap/neo/pull/248)) | [owl-walk.md](owl-walk.md) |
| Orchard Rows | `orchard-rows` | S | 3 | 4 | not started (levels 1–3 built) | — | — |
| Pattern Train | `pattern-train` | PKS | 12 | 3 | building (slice 1 built) | `claude/pattern-train-deep-dive` ([PR 139](https://github.com/rjdunlap/neo/pull/139)); slice 1: `claude/pattern-train-slice-1` ([PR 141](https://github.com/rjdunlap/neo/pull/141)); slice 2: `claude/pattern-train-level-11`; slice 3: `claude/pattern-train-tunnel`; slice 4 pool: `claude/pattern-train-families`; slice 5: `claude/pattern-train-odd-car`; slice 6: `claude/pattern-train-same-pattern` | [pattern-train.md](pattern-train.md) |
| Peekaboo Barn | `peekaboo-barn` | LTPK | 8 | 2 | designed | `claude/zen-gauss-qmbqb6` ([PR 96](https://github.com/rjdunlap/neo/pull/96)) | [peekaboo-barn.md](peekaboo-barn.md) |
| Peekaround Island | `peekaround-island` | TPKS | 5 | 4 | not started | — | — |
| Peg Garden | `peg-garden` | LTPK | 5 | 4 | not started | — | — |
| Penguin Slide | `penguin-slide` | PKS | 5 | 4 | not started | — | — |
| Pet Kitchen | `pet-kitchen` | TPKS | 8 | 4 | not started | — | — |
| Pet Says | `pet-says` | LTPK | 5 | 2 | building (slice 1 built) | `codex/pet-says-guards` ([PR 161](https://github.com/rjdunlap/neo/pull/161)); `claude/roadmap-item-14-game-content-ghbpi1` ([PR 112](https://github.com/rjdunlap/neo/pull/112)) | [pet-says.md](pet-says.md) |
| Photo Safari | `photo-safari` | LTPKS | 6 | 4 | not started | — | — |
| Picture Graph | `picture-graph` | KS | 6 | 4 | not started | — | — |
| Picture Logic | `picture-logic` | G | 4 | 4 | not started (controller-only on the island: touch not built) | — | — |
| Pixel Pictures | `pixel-pictures` | PKS | 5 | 4 | not started | — | — |
| Pond Conga | `pond-conga` | G | 6 | 4 | not started (controller-only on the island: touch not built) | — | — |
| Puzzle Pals | `puzzle-pals` | LTPKS | 7 | 1 | designed; slice 2 built; slice 1 fairness built locally 2026-10-14 on `codex/puzzle-pals-visible-cues`, awaiting publication; lid person-dependent | `claude/zealous-franklin-64zmgc` ([PR 89](https://github.com/rjdunlap/neo/pull/89)) | [puzzle-pals.md](puzzle-pals.md) |
| Quick Tricks | `quick-tricks` | TPKS | 6 | 4 | not started | — | — |
| Rainbow Fingers | `rainbow-fingers` | LTPKS | 7 | 2 | designed | `claude/roadmap-item-14-game-content-0zaz9u` ([PR 107](https://github.com/rjdunlap/neo/pull/107)) | [rainbow-fingers.md](rainbow-fingers.md) |
| Ramp Race | `ramp-race` | KS | 4 | 4 | not started | — | — |
| Read & Do | `read-do` | KS | 3 | 4 | not started (levels 1–3 built) | — | — |
| Rhyme Time | `rhyme-time` | KS | 4 | 4 | not started | — | — |
| Rhythm Neighbors | `rhythm-neighbors` | LTPKS | 6 | 4 | not started | — | — |
| Robot Path | `robot-path` | PKS | 12 | 1 | building (boards slice 2 and levels 11–12 built; preschool slice 3 built; next waypoint slice 6) | `codex/robot-path-level-12-fix-program` (level 11: `codex/robot-path-where-will-it-stop`, [PR 100](https://github.com/rjdunlap/neo/pull/100)); slice 2: `codex/robot-path-board-pool` ([PR #149](https://github.com/rjdunlap/neo/pull/149)); slice 3: `codex/robot-path-preschool` ([PR #154](https://github.com/rjdunlap/neo/pull/154)) | [robot-path.md](robot-path.md) |
| Roundup | `roundup` | LTPK | 6 | 4 | not started | — | — |
| Scoop Shop | `scoop-shop` | LTPKS | 6 | 4 | not started | — | — |
| Secret Code | `secret-code` | KS | 6 | 4 | not started | — | — |
| Seesaw Balance | `seesaw-balance` | TPKS | 9 | 4 | not started | — | — |
| Shape Buddies | `shape-buddies` | KS | 1 | 4 | not started (solo level 1 built; [definition](../definitions/shape-buddies.md)) | — | — |
| Shape Sorter | `shape-sorter` | TPK | 7 | 4 | not started | — | — |
| Sink or Float | `sink-float` | LTPKS | 6 | 4 | not started | — | — |
| Sing-Along Barn | `sing-along-barn` | LTPK | 4 | 4 | not started (built: Old MacDonald, levels 1–3, [PR #219](https://github.com/rjdunlap/neo/pull/219); Hot Cross Buns, [PR #277](https://github.com/rjdunlap/neo/pull/277); level 4, [PR #278](https://github.com/rjdunlap/neo/pull/278); Mary Had a Little Lamb, 2026-10-13) | — | — |
| Size Parade | `size-parade` | TPKS | 8 | 4 | not started | — | — |
| Song Maker | `song-maker` | LTPKS | 7 | 4 | not started | — | — |
| Sound Garden | `sound-garden` | LTPK | 6 | 4 | not started | — | — |
| Splish Splash | `splish-splash` | LTPK | 8 | 2 | designed | `claude/roadmap-item-14-game-content-jtnvee` ([PR 102](https://github.com/rjdunlap/neo/pull/102)) | [splish-splash.md](splish-splash.md) |
| Stamp Studio | `stamp-studio` | LTPKS | 6 | 2 | designed (slice 1 built; colors/sizes next) | `claude/roadmap-item-14-game-content-unyq86` ([PR 110](https://github.com/rjdunlap/neo/pull/110)) ; slice 1a: [PR #175](https://github.com/rjdunlap/neo/pull/175); slice 1b: [PR #176](https://github.com/rjdunlap/neo/pull/176); slice 1c1: [PR #179](https://github.com/rjdunlap/neo/pull/179); remainder: [PR #184](https://github.com/rjdunlap/neo/pull/184) | [stamp-studio.md](stamp-studio.md) |
| Stop and Go | `stop-and-go` | LTP | 4 | 4 | not started | — | — |
| Story Steps | `story-steps` | TPKS | 11 | 1 | building (slices 1–5 built) | `claude/charming-mayer-27wh8m` ([PR 81](https://github.com/rjdunlap/neo/pull/81)); slice 1: `claude/story-steps-ten-stories`; slice 2: `codex/story-steps-choose-cause` ([PR 138](https://github.com/rjdunlap/neo/pull/138)); slice 3: `codex/story-steps-repair` ([PR #168](https://github.com/rjdunlap/neo/pull/168)); slice 4: `codex/story-steps-untangle-ten` ([PR #186](https://github.com/rjdunlap/neo/pull/186)); slice 5: `codex/story-steps-predict-eleven` ([PR #187](https://github.com/rjdunlap/neo/pull/187)) | [story-steps.md](story-steps.md) |
| Sudoku Garden | `sudoku-garden` | G | 6 | 4 | not started (controller-only on the island: touch not built) | — | — |
| Tangram Town | `tangram-town` | TPKS | 6 | 1 | building (picture batches, alternative covers at 7 and turn/check repair at 8 built; flip/kept-picture decisions remain) | `claude/eager-babbage-wexkzg` ([PR 79](https://github.com/rjdunlap/neo/pull/79)); slice 3: `codex/tangram-spoken-shapes` ([PR 157](https://github.com/rjdunlap/neo/pull/157)); picture batch: `codex/tangram-more-pictures` ([PR 166](https://github.com/rjdunlap/neo/pull/166)); level 7: `codex/penguin8-tangram7` ([PR #262](https://github.com/rjdunlap/neo/pull/262)); repair 8: `codex/penguin9-tangram8` ([PR #263](https://github.com/rjdunlap/neo/pull/263)) | [tangram-town.md](tangram-town.md) |
| Teddy Doctor | `teddy-doctor` | LTPKS | 6 | 4 | not started | — | — |
| Treasure Map | `treasure-map` | KS | 5 | 4 | not started | — | — |
| Weather Wardrobe | `weather-wardrobe` | LTPK | 6 | 4 | not started | — | — |
| Word Monsters | `word-monsters` | LTPKS | 8 | 3 | designed | `claude/roadmap-item-14-game-content-msedsy` ([PR 120](https://github.com/rjdunlap/neo/pull/120)) | [word-monsters.md](word-monsters.md) |
| Word Search | `word-search` | G | 4 | 4 | not started (controller-only on the island: touch not built) | — | — |
The six grown-up puzzles (Sudoku Garden, Lantern Lights, Picture Logic, Word Search, Pond Conga and Island Bridges) are island games for the `grownup` band (G) in Lantern Lake as of 2026-10-13, so they are in this table. Only Lantern Lights has touch; a deep dive for one of the others should plan its touch slice with the rest of its ladder.
