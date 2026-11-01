# Penguin Slide deep dive

*ID `penguin-slide` · bands preschool 1–2, pre-K 1–4, school 2–9 · levels 1–9 on 2026-11-01 · session `claude/dive-penguin-slide` ([PR #1086](https://github.com/rjdunlap/neo/pull/1086))*

## The game today

She taps the ice on one side of the penguin and it slides that way until a snowy rock, the pond's edge or a patch of soft snow stops it, eating any fish it passes. The learning purpose is planning a few moves ahead with a stopping rule: where will it stop, and what could make it stop somewhere else? Ice blocks (from level 6) are pushed to make new stopping places. Puddle Island has it in Puzzle Peaks.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | 5×4, one fish, three rocks, 1–2 slides (3 ponds) | preschool, pre-K | Which way to slide (half the ponds are one slide) |
| 2 | 6×4, one fish, four rocks, 2–3 slides (3 ponds) | preschool, pre-K, school | A two-step route: where the first slide stops |
| 3 | 6×5, one fish, five rocks, 3–4 slides (3 ponds) | pre-K, school | A longer route round the rocks |
| 4 | 6×5, two fish in any order, 3–5 slides (2 ponds) | pre-K (top), school | Which fish first |
| 5 | 7×5, two fish, two soft-snow patches, 4–6 slides; snow must change the best route | school | Using snow as a mid-ice stop |
| 6 | 6×5, one fish, one ice block, 3–5 slides; the block must matter | school | Where to park a block |
| 7 | 6×5, two fish, one block, 4–6 slides | school | Park a block for a two-fish route |
| 8 | 6×5, two fish, one block, one snow, 4–6 slides | school | Both kinds of stop together |
| 9 | Four authored paired-block ponds, reflected by the seed, 6–9 slides | school (top) | Two blocks, each needed |

**Content pools.** Levels 1–8 are generated: a shuffled grid gives the start, rocks, snow, fish and blocks, kept only when a breadth-first search over (penguin, fish eaten, block places) finds the planned shortest route, and (5, 8) when the snow changes it or (6–8) when freezing the blocks makes it longer or impossible. Level 9 draws from four authored ponds with four reflections each (16 boards). Art is fixed: one penguin, one orange fish, one grey snowy rock, one snow puff, one ice block, on a pale ice floor with 100-unit cells.

**Mistakes and help.** Sliding is exploration: there are no misses, and a tap that moves nothing is a bump. Undo (the round arrow) steps back one slide and puts eaten fish back. Three slides beyond the shortest bring a bobbing yellow arrow for a best next slide (one hint a round, spoken "Follow the yellow arrow"); when no route is left the undo button glows and the pet says so.

**Checked for this dive.** A probe of 300 seeds per level (a throwaway vitest file, not kept) walked every state reachable from the start and asked the solver whether the fish were still reachable from it:

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ponds where some slide strands the penguin | 29 | 44 | 36 | 53 | 44 | 135 | 160 | 160 | 231 |
| Ponds where only one opening slide moves | 11 | 12 | 25 | 16 | 19 | 24 | 23 | 26 | 69 |

At level 1, 145 of 300 ponds are solved in one slide. A dead end is fair at school with blocks (a parked block is a real commitment, and undo is the answer), but at preschool and pre-K about one pond in seven can leave a three-year-old stranded behind a rock, waiting for a grown-up to read the glowing undo; the couch's Pond Practice already promises "no dead ends".

**Known gaps.** (1) The dead ends above, at levels 1–4. (2) The how-to note says the yellow arrow appears "when help is asked for"; it appears by itself after three extra slides and counts as a hint. (3) Every pond looks the same: one fish, one rock shape. (4) Nothing shows a shorter way after a long route, so a finished round does not teach the better plan. Person checks: the Wonder Woods device row ([DEVICE-CHECKS](../DEVICE-CHECKS.md)) covers the tap-the-ice direction and block planning. **Couch:** three frozen courses (Pond Practice, The Five Ponds, The Frozen Ponds), scored by slides over par; face-offs use `excess`.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Ricochet Robots](https://en.wikipedia.org/wiki/Ricochet_Robots) (Alex Randolph, 1999; [rules](https://www.riograndegames.com/wp-content/uploads/2013/02/RicochetRobots.pdf)) | Board game | Four robots slide until a wall or another robot; a target tile does not stop them; the board stays and targets change | **Another mover as a stopper**: a second penguin that parks as a stop for the first; targets that do not stop the slide | The race against an hourglass and shouted bids |
| [Atomix](https://en.wikipedia.org/wiki/Atomix_(video_game)) (1990) | Computer puzzle | Atoms slide until they hit a wall or another atom; build a molecule shape | Using one mover as a temporary stopper for another; a goal that is a place for an object, not the hero | The per-level time limit |
| Pokémon Gold and Silver's [Ice Path](https://bulbapedia.bulbagarden.net/wiki/Ice_Path) | Dungeon puzzle | Ice floors you slide across until a boulder; later rooms add pushable boulders | The original reference; boulders pushed to make a stop (already level 6) | Being trapped with no way back but walking out |
| [Chip's Challenge](https://en.wikipedia.org/wiki/Chip%27s_Challenge) (1989) | Tile puzzle | Ice and force floors mixed with keys, blocks and monsters; level passwords | Mixing slide and step tiles as a later idea | Deaths, timers, monsters |
| [Pengo](https://en.wikipedia.org/wiki/Pengo_(video_game)) (1982) and [Sokoban](https://en.wikipedia.org/wiki/Sokoban) | Arcade / push puzzle | Pengo's blocks slide until they hit something; Sokoban asks for boxes on marked squares | **A block onto a mark** (the box goal), with snow or a rock making the stop | Enemies; Sokoban's unrecoverable corners without undo |
| [Iced In](https://www.commonsensemedia.org/app-reviews/iced-in) (iOS) | Touch puzzle | Slide ice blocks onto switches to free penguins | Block-to-target goals with a penguin theme | Its steep difficulty curve (Common Sense's note) |
| [Tickles Penguin](https://ticklesstudio.itch.io/tickles-penguin) and [Slide On Ice](https://toucharcade.com/games/slide-on-ice) | Small touch puzzles | Swipe a penguin across an icy maze to a goal; "finish without mistakes" | Short mazes as quick variety | Mistake-free challenges, ads |
| Curling, shuffleboard, a toy car pushed across the floor | Physical play | Where does it stop, and what stops it? | The off-screen idea (already the card's) and the prediction mode below | — |

**Learning references.** The skill is planning with a known rule, close to the CSTA K–12 standards' grade K–2 **1A-AP-08** (model a process by creating and following an algorithm) and **1A-AP-14** (find and fix errors, here with undo) ([standards](https://csteachers.org/k12standards/)); the prediction mode is Common Core **K.G.1**'s position words (*beside*, *next to*) in motion. Preschool planning research with the Tower of London puts look-ahead of two or three moves around age four to five, which matches the 1–2 and 2–3 slide windows; we make no other claim.

## What makes sense here

The game's rule is already rich; its ladder grows by **what stops the slide** (rocks, snow, blocks) and **what the goal is** (a fish, two fish, a block's place). The next rungs add one each:

- **Three fish** is the audit's long-standing next board ([short-ladder audit](../archive/IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md#short-ladder-audit-2026-10-09)): an order to plan, no new rule.
- **Where will it stop?** turns the co-play hint ("guess together where the penguin will stop") into a mode for pre-K and preschool: predict the stopping place, then watch. A prediction is never a miss.
- **A block onto the star** (Sokoban, Iced In, Atomix) moves the goal from the penguin to the block: a school step that reuses the push.
- **Two penguins** (Ricochet Robots): either penguin can slide, and each is a stopper for the other. The richest top for school.

Left out: timers, move limits that end a round, stars or medals for par on touch (the couch keeps its score), deaths or cracks in the ice that sink the penguin, and any dark or scary hole.

The long arc: preschool slides and predicts, pre-K plans two fish and predicts in mazes, school plans with stops it makes (blocks, then the other penguin), and the couch's courses keep the frozen boards for grown-ups.

## Experience and presentation

- **First unsupported action.** Tapping the ice beside the penguin: the slide always happens, and where it stops is the lesson.
- **Pleasure and feedback.** Touch-down shows nothing today: add a soft scuff ring on the tapped side of the penguin at touch-down (code-drawn, two arcs, 0.15 s), then the slide's whoosh. The fish gulp and the stop's little bump give the consequence. Readiness returns when the penguin settles.
- **Art and feel example.** Seeded rock looks from existing tools: the snowy rock, a small igloo (a `Graphics` dome with three block arcs), and a snowman (two `puffs` circles with a carrot triangle). All are rocks with the same hit cell and stop rule. Fish come in three seeded colours (orange, pink, teal from `swatch`). No new sound: the stop bump is a pentatonic tick from `src/audio/notes.ts`.
- **Variety on replay.** Generated ponds already vary; looks vary by seed without changing a rule.
- **Reasoning versus reading, memory and precision.** No reading. Memory load is the route so far; undo and the arrow keep it low. Precision: any tap on that side of the penguin counts (the `tapDirection` split), so motor control is not tested.
- **Supported completion and stopping.** Every round finishes: the arrow after three extra slides, the glowing undo when stranded. A round is two or three ponds.
- **Co-play.** Prediction mode makes the card's hint concrete: one player predicts, the other slides. On the couch, the split-directions idea in IDEAS (one player owns left and right) stays a proposal there.
- **Person or device questions.** Does a preschooler understand "it keeps going" before level 11's predictions, or only after? Does a stranded penguin with a glowing undo read without a grown-up? Is the igloo read as a stopper?

## Proposed ladder

### Fresh content inside existing levels

- **No dead ends below the blocks (levels 1–4).** Generation rejects a pond when any state reachable from the start cannot reach every fish (the probe's walk, in `logic.ts`). Level 5 keeps its dead ends: soft snow is school and undo is taught there.
- **Level 1 holds two slides most of the time.** Keep 1–2 slides, but allow at most one of the three ponds to be a single slide, so a preschooler still meets a two-step route.
- **Seeded looks.** Rock looks (snowy rock, igloo, snowman) and fish colours, chosen per pond by seed; the stop rule and cells are unchanged.
- **The how-to note** says the arrow appears after a few extra slides, not "when help is asked for".

### New levels on top

Numbers are planned in build order; if slices land out of order, the next free ID is used and the table here is corrected.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Three fish | school (top becomes 10) | 7×5, three fish, five rocks, 5–8 slides, two ponds | The order to eat three fish | No misses; arrow after three extra slides; undo | Every pond has three fish, best within 5–8, no pond where two fish lie on one slide from the start, every fish reachable; 300 seeds generate within the attempt cap | Plan row, one voice line (`slide.three`), how-to step; bot unchanged (solver) |
| 11 | Where will it stop? | preschool (after 2), pre-K (after 2) | 5×4, one fish, three rocks; a big yellow arrow beside the penguin shows a direction, and she taps the cell where she thinks it will stop; then the penguin slides | A stopping place, before seeing it | A prediction is never a miss: a right one sparkles the cell; a wrong one leaves her ring where it was and the pet names what stopped it ("It slid past! The rock stopped it.") with that rock bouncing. After three predictions, the last slide eats the fish | The shown direction always moves the penguin; the stop cell differs from the next cell in at least two of three predictions (so "beside" is not always right); targets are whole cells at 100 units | New tap interaction on cells (`onTap` on the board, nearest cell); voice lines; `order` for preschool [1, 2, 11] and pre-K [1, 2, 11, 3, 4], with `entryLevels` unchanged; ghost finger taps the stop cell; with keys or a pad (the game is `liveController`) the arrow keys move a prediction ring and the action button confirms; misses 0, hints 0 by design |
| 12 | A block onto the star | school | 6×5, one block, a star mark on the ice, three rocks, one snow patch; no fish | Where the block must be pushed from so it stops on the star | No misses; arrow after three extra slides shows the next move (a slide or a push); undo glows when the block is stuck against an edge away from the star | Every pond: the block's goal is reachable, the star is never on a cell the block cannot stop on, best within 3–6, freezing the block like a rock makes it impossible | The goal predicate in `solve` becomes "fish eaten and blocks on stars"; star art; `slide.star` line; bot reads the same solver |
| 13 | Two penguins | school (top) | 6×5, two penguins (one with a scarf), one fish, four rocks; tap a penguin to choose it (it lifts), then tap the ice beside it | Which penguin to move, and where a parked penguin makes a stop | No misses; the arrow appears on the penguin to move next; undo steps back one slide of either | Every pond needs both penguins (with one penguin frozen like a rock, the fish is out of reach or the route is longer); best 4–7; either penguin eating the fish finishes | Solver state gains a second mover; selection is a new interaction (a lifted penguin, 100-unit targets); scarf art from `penguinArt`; bot picks then taps; a couch course later |

### Younger-band openings

**Toddler, a one-slide pond** (needs a decision): a 4×3 pond, the fish always one slide away in a straight line, any tap that way slides and eats; nothing counted. It would open `toddler` on a game whose rule is "it keeps going"; it is a band addition, so the audit in AGENTS (band mappings, places, voice, birthdays) comes with it. Recorded for the developer in [Waiting on the developer](../WAITING-ON-DEVELOPER.md).

### Easier entries and levels between existing ones

Level 11 is the easier entry between 2 and 3 for preschool and pre-K, placed with `order` (stable ID, nothing renumbered). No other entry is needed: level 1 already opens preschool.

### Left out on purpose

Par stars on touch, move limits, cracking ice or holes, monsters (Chip's Challenge), hourglasses (Ricochet Robots), a maze of hundreds of cells, and "make your own pond" (a creative builder that keeps a pond would need the treehouse's keep contract and a definition of its own; it stays an idea).

## Decisions for the developer

- **Toddler opening** (above): open `toddler` with a one-slide pond, or keep Penguin Slide preschool and up.

## Build slices, in order

1. **Fair ponds and seeded looks** (existing-interaction tier: typecheck, rule tests for no dead ends at 1–4 over 300 seeds and at most one single-slide pond at level 1, one filtered regression play at levels 1 and 4; bot unchanged, no `fingerdemo`): the no-dead-end walk in `makePuzzle` for levels 1–4, the single-slide cap, seeded rock looks and fish colours, the touch-down scuff ring and the how-to note wording.
2. **Level 10, Three fish** (new-level tier: typecheck, rule tests, one play of level 10 with one hint, `fingerdemo` at 10): after slice 1 (shares `makePuzzle`).
3. **Level 11, Where will it stop?** (new-interaction tier: typecheck, unit tests including the `order` and lands tests, one scripted play at preschool with one wrong prediction then two right, one portrait screenshot, `fingerdemo` at 11, one build): after slice 2 for the level number.
4. **Level 12, A block onto the star** (new-rule tier: typecheck, rule tests, one play of level 12 with a stuck block and undo, `fingerdemo` at 12, one portrait screenshot): after slice 3.
5. **Level 13, Two penguins** (new-interaction tier: typecheck, rule tests, one play with a selection change and one hint, one portrait screenshot, `fingerdemo` at 13, `BROWSER_SUITE=couchgames` filtered to Penguin Slide since the controller needs a select button): after slice 4. Its couch course is a later line.

## What was built in this session

Nothing: research and ideation only. Checks: `node scripts/check-links.mjs` and `git diff --check`; the dead-end probe ran once as a throwaway test file and was deleted.
