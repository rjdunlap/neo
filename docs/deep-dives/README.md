# Game deep dives

**Decided (the developer, 2026-10-10):** give every island game its own session that researches similar games in its genre and expands its levels and ladder across the age bands. This page is the tracker and the procedure. Each game's findings and ladder go in `docs/deep-dives/<game-id>.md`, written from the [template](TEMPLATE.md). The roadmap's [chunk 14](../ROADMAP.md#next-up) points here.

A deep dive turns the ladder rounds in [IDEAS.md](../IDEAS.md#short-ladder-audit-2026-10-09) (the audit, round two and round three) into one researched plan per game. Those rows are its starting point, not its limit. The [rules for every activity](../../AGENTS.md#rules-for-every-activity) still hold: more quantity is welcome (the developer's direction of 2026-10-10), while speed, timers, clutter, extra memory load and anything that punishes stay out.

## One session, one game

1. **Claim it.** Fetch `origin`, then check this table, open pull requests and unmerged branches for the same game ID. Pick the first **not started** game in the lowest wave unless the grown-up names one. Make the first commit on a feature branch set its row to **in progress** with the branch name, and publish a draft pull request straight away so other sessions see the claim. One game per session; a game whose code another branch is changing waits.
2. **Read what is there.** The game's `index.ts`, `logic.ts` and tests, its [GAMES.md](../GAMES.md) entry, its how-to card in `src/content/howto.ts`, its levels table for each band, its voice lines, its couch entry if it has one (`src/couch/catalog.ts`), and every mention in [IDEAS.md](../IDEAS.md) and the [roadmap](../ROADMAP.md). Write down the current ladder level by level, and what each round draws from (the content pools).
3. **Research the genre.** Look at five to ten similar games: classics, current touch apps, educational software and board or physical play. Include the references the game already names. For each, note what its progression does (new rules, content, modes, what it holds back) and what it does that Puddle Island must not (timers, lives, streaks, ads). Note any learning standards or a developmental source when the game teaches a school skill. Cite links. A reference is inspiration, not a design.
4. **Design the ladder.** Cover every band the game serves, plus any band it could open:
   - **Fresh content** inside existing levels.
   - **New levels appended on top**, never renumbered.
   - **Openings to a younger band** from level 1.
   - **Levels below level 1**, marked as waiting on the [level-order decisions](../ROADMAP.md#waiting-on-the-developer).

   For each level write:
   - its first round;
   - what she decides;
   - how a mistake or an experiment is handled, and the hint;
   - what a rule test asserts;
   - its cost and couplings (art, voice, the ghost-finger bot, couch, journal, the picnic).

   Say which band window each level falls in. Mark anything that needs a decision from the developer, and add that decision to the roadmap's "Waiting on the developer".
5. **Write it up** as `docs/deep-dives/<game-id>.md` from the [template](TEMPLATE.md), ending with an ordered list of build slices, each sized for one session.
6. **Build the first slice if time allows.** The cheapest ready slice, verified at its [verification-budget](../../AGENTS.md#verification-budget) tier. If no time remains, the write-up alone is a complete deep dive.
7. **Update the docs and close the row.**
   - Set the row's status and link its deep dive.
   - Point the game's rows in the IDEAS ladder rounds at the deep dive.
   - Add its build slices to the roadmap's chunk 14 list.
   - If something was built, update its README row, GAMES.md entry, how-to card and VERIFICATION entry, as [AGENTS.md](../../AGENTS.md#documentation-and-git) routes them.

**Status values:** **not started**; **in progress** (a branch is on it); **designed** (the write-up is merged and slices are waiting); **building** (slices are being built from the write-up); **done** (every slice the write-up calls ready is built, or deliberately left).

## Suggested order (non-binding)

The waves are a suggestion; the grown-up can name any game.

- **Wave 1: one round repeats today.** Tangram Town, Story Steps, Robot Path, Goodnight Room, Opposites and Puzzle Pals. These also deliver [chunk 13](../ROADMAP.md#more-to-play-in-every-band)'s first content slices.
- **Wave 2: her own band soon.** Lap and toddler favorites for a child about to turn one: Bubble Pop, Peekaboo Barn, Animal Snack, Splish Splash, Jelly Drums, Rainbow Fingers, Stamp Studio and Pet Says. Their levels below level 1 wait on the level-order decisions, so settle those early.
- **Wave 3: the school core.** Counting, number and letter ladders that carry her longest: Duck Pond, Frog Hop, Market Stall, Word Monsters, Letter Trails, Pattern Train, Memory Match and Clock Tower.
- **Wave 4: everything else**, in any order.

## Tracker

Bands: L lap, T toddler, P preschool, K pre-K, S school. "Top level" is the highest level in the game's plan on 2026-10-10. It changes as slices land, so the deep dive records the current one.

| Game | ID | Bands | Top level | Wave | Status | Branch / PR | Deep dive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Animal Snack | `animal-snack` | LTP | 5 | 2 | not started | — | — |
| Beat Builder | `beat-builder` | PKS | 5 | 4 | not started | — | — |
| Block Tower | `block-tower` | LTPKS | 6 | 4 | not started | — | — |
| Bounce Back | `bounce-back` | LTPK | 5 | 4 | not started | — | — |
| Bouncy Launch | `bouncy-launch` | LTPKS | 6 | 4 | not started | — | — |
| Bubble Pop | `bubble-pop` | LTPKS | 11 | 2 | in progress | `claude/adoring-albattani-euqsnp` | — |
| Bug Builder | `bug-builder` | TPKS | 7 | 4 | not started | — | — |
| Bumper Garden | `bumper-garden` | LTPK | 5 | 4 | not started | — | — |
| Chain Reaction | `chain-reaction` | KS | 6 | 4 | not started | — | — |
| Clap the Syllables | `clap-syllables` | PK | 4 | 4 | not started | — | — |
| Clock Tower | `clock-tower` | KS | 6 | 3 | not started | — | — |
| Color Garden | `color-garden` | TPK | 6 | 4 | not started | — | — |
| Critter Crossing | `critter-crossing` | KS | 5 | 4 | not started | — | — |
| Critter Sort | `critter-sort` | KS | 5 | 4 | not started | — | — |
| Dot Link | `dot-link` | LTPK | 5 | 4 | not started | — | — |
| Duck Pond | `duck-pond` | LTPKS | 10 | 3 | not started | — | — |
| Duckling Parade | `duckling-parade` | LTPK | 8 | 4 | not started | — | — |
| Egg Catch | `egg-catch` | LTPKS | 6 | 4 | not started | — | — |
| Feelings Faces | `feelings-faces` | LTPK | 7 | 4 | not started | — | — |
| Ferry Jam | `ferry-jam` | KS | 6 | 4 | not started | — | — |
| Fluffy Salon | `fluffy-salon` | LTPK | 5 | 4 | not started | — | — |
| Frog Hop | `frog-hop` | PKS | 6 | 3 | not started | — | — |
| Garden Grow | `garden-grow` | LTP | 5 | 4 | not started | — | — |
| Garden Rows | `garden-rows` | KS | 6 | 4 | not started | — | — |
| Goodnight Room | `goodnight-room` | LTP | 4 | 1 | building (slice 1 built) | `claude/sweet-babbage-zq5bz6` ([PR 84](https://github.com/rjdunlap/neo/pull/84)) | [goodnight-room.md](goodnight-room.md) |
| Habitat Helpers | `habitat-helpers` | PKS | 6 | 4 | not started | — | — |
| Inchworm Measure | `inchworm` | KS | 6 | 4 | not started | — | — |
| Jelly Drums | `jelly-drums` | LTPKS | 9 | 2 | not started | — | — |
| Lasso Loops | `lasso-loops` | PKS | 5 | 4 | not started | — | — |
| Lemonade Stand | `lemonade-stand` | S | 4 | 4 | not started | — | — |
| Letter Trails | `letter-trails` | PKS | 8 | 3 | not started | — | — |
| Light Lab | `light-lab` | KS | 6 | 4 | not started | — | — |
| Little Helpers | `little-helpers` | LTPKS | 6 | 4 | not started | — | — |
| Mail Carrier | `mail-carrier` | LTPKS | 7 | 4 | not started | — | — |
| Market Stall | `market-stall` | PKS | 7 | 3 | not started | — | — |
| Memory Match | `memory-match` | PKS | 10 | 3 | not started | — | — |
| Monster Munch | `monster-munch` | LTPKS | 8 | 4 | not started | — | — |
| Opposites | `opposites` | LTPK | 4 | 1 | designed | `claude/zealous-cerf-vmw320` ([PR 87](https://github.com/rjdunlap/neo/pull/87)) | [opposites.md](opposites.md) |
| Owl Walk Home | `owl-walk` | TPK | 4 | 4 | not started | — | — |
| Pattern Train | `pattern-train` | PKS | 12 | 3 | not started | — | — |
| Peekaboo Barn | `peekaboo-barn` | LTPK | 8 | 2 | not started | — | — |
| Peekaround Island | `peekaround-island` | TPKS | 5 | 4 | not started | — | — |
| Peg Garden | `peg-garden` | LTPK | 5 | 4 | not started | — | — |
| Penguin Slide | `penguin-slide` | PKS | 5 | 4 | not started | — | — |
| Pet Kitchen | `pet-kitchen` | TPKS | 8 | 4 | not started | — | — |
| Pet Says | `pet-says` | LTPK | 5 | 2 | not started | — | — |
| Photo Safari | `photo-safari` | LTPKS | 6 | 4 | not started | — | — |
| Picture Graph | `picture-graph` | KS | 6 | 4 | not started | — | — |
| Pixel Pictures | `pixel-pictures` | PKS | 5 | 4 | not started | — | — |
| Puzzle Pals | `puzzle-pals` | LTPKS | 7 | 1 | designed | `claude/zealous-franklin-64zmgc` ([PR 89](https://github.com/rjdunlap/neo/pull/89)) | [puzzle-pals.md](puzzle-pals.md) |
| Quick Tricks | `quick-tricks` | TPKS | 6 | 4 | not started | — | — |
| Rainbow Fingers | `rainbow-fingers` | LTPKS | 6 | 2 | not started | — | — |
| Ramp Race | `ramp-race` | KS | 4 | 4 | not started | — | — |
| Rhyme Time | `rhyme-time` | KS | 4 | 4 | not started | — | — |
| Rhythm Neighbors | `rhythm-neighbors` | LTPKS | 6 | 4 | not started | — | — |
| Robot Path | `robot-path` | KS | 10 | 1 | designed | `claude/roadmap-item-14-game-d0rjma` ([PR 82](https://github.com/rjdunlap/neo/pull/82)) | [robot-path.md](robot-path.md) |
| Roundup | `roundup` | LTPK | 6 | 4 | not started | — | — |
| Scoop Shop | `scoop-shop` | LTPKS | 6 | 4 | not started | — | — |
| Secret Code | `secret-code` | KS | 6 | 4 | not started | — | — |
| Seesaw Balance | `seesaw-balance` | TPKS | 9 | 4 | not started | — | — |
| Shape Sorter | `shape-sorter` | TPK | 7 | 4 | not started | — | — |
| Sink or Float | `sink-float` | LTPKS | 6 | 4 | not started | — | — |
| Size Parade | `size-parade` | TPKS | 8 | 4 | not started | — | — |
| Song Maker | `song-maker` | LTPKS | 7 | 4 | not started | — | — |
| Sound Garden | `sound-garden` | LTPK | 6 | 4 | not started | — | — |
| Splish Splash | `splish-splash` | LTPK | 8 | 2 | not started | — | — |
| Stamp Studio | `stamp-studio` | LTPKS | 6 | 2 | not started | — | — |
| Stop and Go | `stop-and-go` | LTP | 4 | 4 | not started | — | — |
| Story Steps | `story-steps` | TPKS | 7 | 1 | designed | `claude/charming-mayer-27wh8m` ([PR 81](https://github.com/rjdunlap/neo/pull/81)) | [story-steps.md](story-steps.md) |
| Tangram Town | `tangram-town` | TPKS | 6 | 1 | building (slice 1 built) | `claude/eager-babbage-wexkzg` ([PR 79](https://github.com/rjdunlap/neo/pull/79)) | [tangram-town.md](tangram-town.md) |
| Teddy Doctor | `teddy-doctor` | LTPKS | 6 | 4 | not started | — | — |
| Treasure Map | `treasure-map` | KS | 5 | 4 | not started | — | — |
| Weather Wardrobe | `weather-wardrobe` | LTPK | 6 | 4 | not started | — | — |
| Word Monsters | `word-monsters` | LTPKS | 7 | 3 | not started | — | — |
The six couch-only grown-up puzzles (Sudoku Garden, Lantern Lights, Picture Logic, Word Search, Pond Conga and Island Bridges) are not on the island, so they are not in this table. A deep dive for one follows the same steps once Profiles stage 3 brings it onto the map.
