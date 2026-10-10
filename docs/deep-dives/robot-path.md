# Robot Path deep dive

*ID `robot-path` · bands pre-K, school · levels 1–10 on 2026-10-10 · session `claude/roadmap-item-14-game-d0rjma` ([PR 82](https://github.com/rjdunlap/neo/pull/82))*

## The game today

She builds a short program out of arrow buttons (up, right, down, left), presses play, and a robot walks it across a grid from the top-left corner to a star. Tapping a program slot takes that slot and everything after it back out; the clear button empties the program. The robot always starts at the top-left cell, so a board is only a size, a goal and rocks. Playback walks the program one step at a time and lights the slot being carried out. A run that does not reach the star is a miss: the robot stops where it bumped or ran out of steps, the pet says "A bump! Let us change our path and try again.", the robot walks back to the start, and the program stays for editing. At two misses one hint is counted and a ring appears on the next useful button, from a known solution (clear, the arrow to tap again, the next arrow, the loop button, then play).

| Level | Plan (`ROBOT_PLANS`) | Mode | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- |
| 1 | 3 × 3, star two steps straight along the top, 3 slots | steps | pre-K (1–6) | which way, twice |
| 2 | 3 × 3, star two right and one down, 4 slots | steps | pre-K | where to turn |
| 3 | 4 × 4, star at (2, 2), 5 slots | steps | pre-K | a longer route, two directions |
| 4 | 4 × 4, two rocks, 6 slots | steps | pre-K, school (4–10) | a route around obstacles |
| 5 | 4 × 4, two rocks, star at (1, 3), 7 slots | steps | pre-K, school | a longer detour |
| 6 | 4 × 4, four rocks, star in the far corner, 8 slots | steps | pre-K, school | a walled-in route |
| 7 | 5 × 5, a wall of four rocks, 2 slots | counts | school | "right ×4, down ×2": repeat a step |
| 8 | 5 × 5, a winding path, 4 slots | counts | school | four counted moves in order |
| 9 | 5 × 5, a staircase of rocks, 2 slots + loop | loop | school | "right, down", then ×4 |
| 10 | 5 × 5, rocks, 3 slots + loop | loop | school | a two-step body ("right ×2, down ×2"), then ×2 |

**What a round draws from.** Nothing: it is **one authored board per level**, ten boards in all. Nothing uses the round's seeded RNG, so a replayed level is the same board. The program limit makes the idea necessary (the rule tests assert that the plain route does not fit the slots on levels 7–10 and that the given solution does). The hint follows a known solution (the breadth-first shortest route on levels 1–6, an authored one above).

**Couplings.** A how-to card (goal, two steps, and one `LevelLine` each from level 7 and level 9) with a ghost-finger bot (`autotouch()`, built on `nextPress`). A couch entry at school's levels 4–6 as a **team** stop (`play: 'together'`, `faceoff: 'team'`: authored boards would be a path a second player had watched). No journal entry, no picnic step, no sticker art beyond the robot. Voice: `robot.start`, `robot.counts`, `robot.loop`, `robot.wrong`, `robot.hint`, `robot.clear`.

**Known gaps.**
- **"A bump!" is said for every miss**, including a program that simply stopped short of the star without touching anything. The robot never shows where or why it stopped.
- **Playing an empty program does nothing**, silently.
- **The hint can ask her to clear a good program.** `nextPress` checks her program against one known route, so a different valid route (very common on 4 × 4 boards with few rocks) is told to start over.
- **One board per level**, so a replay or a pin repeats the exact puzzle; this is the main reason to add a pool.
- The school band's window starts at level 4, so the first school round is already "plan around rocks". A school child who meets counts at level 7 has never seen a program shorter than the route.
- **Reading and repair are untouched.** She only writes programs. She never has to read one that someone else wrote, or find an error in it.
- Person checks still open: a pre-K child on the real iPad (slot and arrow sizes), and the picture of "loop" for a six-year-old.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Robot Turtles](https://thrumsvet.co.uk/products/thinkfun-robot-turtles-game/222909158/) (ThinkFun; ages 4+, [reviewer's notes](https://curiouscoders.substack.com/p/five-board-games-for-teaching-coding)) | board game | Forward, left and right cards played one at a time to a jewel; then obstacles (ice walls) and harder cards; later a "function frog" card replaces a repeated sequence of cards; an adult "Turtle Mover" sets the layout; a Bug card takes back a move | **play the program as a small routine** (the frog is the "do this" box); the grown-up as the robot (a co-play prompt); undo that costs nothing | the physical card race between players |
| [Lightbot: Code Hour](https://apps.apple.com/app/lightbot-one-hour-coding/id873943739) (App Store listing) | app | 20 puzzles in three sets: 8 basics, 6 procedures, 6 loops; a failed program is simply edited again; later conditionals | **the order basics → procedures → loops**: a routine box (procedure) before the loop is a reasonable split; the developer fixed a procedures level that was too hard by swapping it for a simpler one, a warning for our routine level | its tile heights and lighting task |
| [Kodable](https://www.kodable.com/coding-for-kids) (planets by concept; [Common Sense review](https://www.commonsensemedia.org/app-reviews/kodable)) | app, ages 4–8 | sequencing first (kindergarten), then conditionals, then loops framed as "shorten your code" instead of dragging the same arrow many times | **loops as shortening** (our counts level 7 already does it); sequencing before everything; conditionals at the grade 1–2 level | its paid worlds and reading prompts |
| [Code.org Course B, Angry Birds maze](https://studio.code.org/s/courseb-2024/lessons/3) and the Express Course's "Debugging in Maze" ([lesson plans PDF](https://lesson-plans.code.org/express-2022/20220907165703/Express-Course-2022.pdf)) | school course | build a sequence of blocks to reach the pig; later a lesson hands out pre-written code with mistakes, and children step through it to find them | **debugging as its own lesson**: a finished program with a visible failure and a fix (our level 12); **step through to find the error** (our playback already lights each slot) | block coding with reading |
| [Bee-Bot / Blue-Bot](https://www.tts-group.co.uk/early-years/ict/programming/) (TTS; ages 3–7 floor robots) | toy robot with story mats | key a short program of forward, back, left and right, then press Go; themed mats (a fairy-tale, a wildlife garden) turn it into a story; the first focus is a simple program one step at a time | **a prop on the way**: collect a thing, then the star (level 14 below); **one step at a time for the youngest**, the opening in "Levels below 1"; story mats as goal art | the physical mat |
| [Cargo-Bot](https://blogs.ubc.ca/centre/2013/08/05/cargo-bot/) (Two Lives Left, iPad; aimed at grades 5–12) | iPad puzzle | each routine has 8 slots; programs can call other programs; commands that depend on a crate's color; star ratings for the shortest program | **a slot cap that makes reuse necessary**; a routine other routines call. Our slot limit already works this way | star ratings for the fewest blocks (no ranks here); the conditionals on crate color |
| [ScratchJr debugging challenges](https://www.tes.com/en-ie/teaching-resource/scratch-jr-debugging-challenges-12988286) (a teacher's printable pack, not an app feature) | worksheet pack | spot and fix a broken block sequence | the same exercise as the fix level, confirmed as something children age 5–7 do | the printable form |
| Existing references in this repo: Light Lab's live beam for levels 1–2 and its plan-then-run model; Sink or Float and Bouncy Launch for unscored predictions | island games | see [GAMES](../GAMES.md) | **live first, plan later** (the "drive" level), and **predict before you watch** (level 11) | their art |

**Standards and development.** The Computer Science Teachers Association's K–2 standards ask children to develop programs with sequences and simple loops (1A-AP-10) and to debug, "identify and fix", errors in a program that includes sequences and simple loops (1A-AP-14); a child describing the steps taken and choices made in building a program is 1A-AP-15 ([CSTA K–12 standards PDF](https://csteachers.org/wp-content/uploads/2025/03/csta-k-12-computer-science-standards-revised.pdf)). That is exactly our levels 1–10 (sequence, loop) and the new fix level (debug). The next step, grades 3–5, adds events, conditionals and subprograms (named routines), which the routine level approaches. These standards describe what a classroom covers; none of them is evidence about what a pre-K child on an iPad can do.

## What makes sense here

- **Quantity first.** One board per level is the thinnest ladder of any game with ten levels. Three boards per level costs only authored data and the same rule tests, and it fixes "replay shows the same puzzle".
- **The next idea is repair and reading, not a bigger grid.** The grid already holds 5 × 5; her decision becomes *what is wrong with this program*, then *what will it do*, then *what must it also pass through*, then *reuse a named chunk*.
- **Mistakes teach.** Debugging is the learning goal, so a failed run is information. The first run of a program someone else wrote is a free watch, never a miss. A repair that does not work is a normal miss, with the failure shown where it happened.
- **No score for short programs.** Cargo-Bot's star ratings and Kodable's shortest-code goals are left out; the slot limit already asks for compactness without ranking.
- **Left for later or elsewhere:** conditions ("if a rock is ahead, turn"; needs a sensor and a repeat-until, a new language), a free grid editor, drawing her own board, and a variable-start robot.
- **Long-term arc.** Preschool: drive the robot yourself, then one program of one or two arrows. Pre-K: arrows, turns, rocks, longer routes. School: say how many (counts), repeat (loop), predict, repair, collect on the way, and finally name a routine. Beyond, in the [Skywatch Isles](../ROADMAP.md) pilot: one reusable routine and small conditions.

## Proposed ladder

### Fresh content inside existing levels

**Three boards per level, drawn with the round's seeded RNG** (`plan: RobotPlan` becomes a `boards: RobotPlan[]` per level; `describeLevel` names the idea, not one board). Properties a test asserts for every board, so more boards are a few lines of data:

- the robot starts at (0, 0) and the goal is not a rock, and every rock is inside the grid;
- levels 1–6: the shortest route has at least one fewer step than the slot limit allows and no more than the limit, and the level's own idea holds (levels 4–6 need a detour around a rock: the straight "right/down" order is blocked; levels 1–3 have no rocks);
- levels 7–10: the authored solution works, the plain route does not fit the slots, and (loop levels) the compressed route does not fit either, exactly the existing tests, applied to every board;
- the three boards of a level differ in shape (the goal's cell and the rock layout) and do not share a first move that decides the board, so a replay is not memorized;
- the ghost-finger bot (`nextPress`) reaches the star on every board, from nothing and after a wrong first step.

Also, optional polish with a voice cost: the goal can be a star, an apple, a flower or a moon (a seeded pick of goal art), spoken as "the star" only if the line says it; leave the instruction wording "the goal" or add four voice lines.

**Fix the three gaps in the first slice** (cheap, no new level): say what happened. If the run ends against a rock or the edge, the robot jiggles at the bump and says "A bump!". If the program ends in open ground, the robot waits and the pet says "It stopped here. It needs more steps." (a new `robot.short` line). An empty program says "Tap some arrows first." (`robot.empty`). The hint prefers the known route that her program is already a prefix of before asking her to clear, so a good alternative is never thrown away. Tests: `nextPress` never asks to clear a program that is a prefix of any shortest route; a program that ends short is told apart from a bump.

### New levels on top

None of these renumbers a saved level. The school window is `{ min: 4, max: ROBOT_PLANS.length }` and widens by itself when a plan is appended. All are proposals, not built. Levels run in difficulty order; the roadmap's earlier "11, Fix the program" is now **12** (see decision 1).

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | **Where will it stop?** | school (and pre-K's top if wanted) | A finished program sits in the slots (steps, then counted); the robot waits. She taps the cell where it will end up, then presses play to watch | reading a program she did not write: trace it in her head | A prediction is never a miss (experiment). Right: "You knew!"; wrong: the robot walks and the pet says where it stopped. The round ends after the watch. No hint beyond lighting the first slot | the shown program ends on a cell that is not the star and not the cell a "reverse reading" or "ignore the rocks" would give (so a wrong tracing differs from a right one); its end cell is on the board; at least one board per mode | New `PredictPlan` type, a cell-tap layer over the grid (cells are 100 units at most; check a 5 × 5 grid keeps 100-unit taps), no finish through `run()`. The bot taps the right cell then play. A `LevelLine` how-to |
| 12 | **Fix the program** | school | A finished program runs from the first tap on play (a free watch) and the robot bumps a rock or stops short. Exactly one slot is wrong; she taps it, taps an arrow to change its direction (or the same arrow again for one more step), and plays again | debugging: find the wrong slot from where the robot stopped and the lit slot, and fix it | The free watch is not a miss. A repair that still fails is a miss with the robot showing where. After two misses the wrong slot glows (a hint). Tapping a slot selects it instead of deleting what follows; a long press or the clear button still empties | each authored board's broken program fails, a single slot edit (a direction change or a count ±1) reaches the star, and the lit slot at the first failure is the slot or a slot after the slot to edit; no other single-slot edit is required for the hint to lead somewhere | Slot taps change meaning on this level (select, not truncate), so the slot control and the bot learn a "change slot" step. Authored boards, three per mode. Couch: a team entry stays on levels 4–6 until `control()` learns select |
| 13 | **Pick it up on the way** | school (pre-K top if wanted) | A basket (or apple) sits on the grid; the program must pass through it before it ends on the star | one more constraint: a waypoint | A run that reaches the star without the apple is a miss: "You forgot the apple" and the apple glows. Hint: the ring leads to the first arrow of a route through it | the solution passes through the waypoint; the plain shortest route to the star does not (otherwise the constraint is empty); the waypoint is not a rock | `runPath` records visited cells; goal needs `via?: Cell`; art: an apple in `props.ts` style; the hint solution comes from a search over (cell, visited) states |
| 14 | **Mend the loop** | school | A looped program ("right ×2, down ×1, ×3") nearly reaches the star; one body slot or the repeat count is wrong | debugging inside a loop | Same free watch, same single-edit hint; the loop count is a possible fix | like 12, plus: a count change alone fixes at least half the authored boards | Reuses 12's control and level 9–10's loop UI |
| 15 | **A routine** | school | A second program row ("do this", purple); the main row has a "do this" call button. The route is a chunk that repeats with something in between: "do this, right, do this" | reuse a named chunk, not just the same count | A call before the routine has any steps is just ignored with a gentle nudge; wrong run is a miss | the authored solution needs ≥ 2 calls; the main row alone, without a routine, does not fit the slot limits; the routine row is bounded (3 slots) | **Define first.** Two program rows, a call button, call-depth of one (a routine cannot call itself), bot, how-to, a couch decision. This is the biggest slice; Lightbot's procedure set shows it is the hardest step, so keep boards few and the first one trivial |
| — | *Conditions* | — | "If a rock is ahead, turn right", repeat until the star | rules that depend on what the robot sees | — | — | **Sketch only**, not scheduled: it is a new language (a sensor, a repeat-until) and belongs to a later band (see the roadmap's E2 horizon). Needs its own definition of ready |

Levels 11–14 stay at 5 × 5 so the school band's targets are never smaller than today; the program row keeps 4 per row.

### Younger-band openings

- **Preschool at levels 1–2.** Both are 3 × 3 boards with two or three steps (arrows, a star, no rocks). Add `preschool` to `bands` with `levels: { min: 1, max: 2 }`. The how-to card is already scoped to levels and needs no change; the voice is the same line. A rule test confirms the registry's band table (a game's bands, ranges and descriptions agree) and that a child at those levels has no more than four arrow buttons and three slots. Person check: whether a three- or four-year-old can hold "add arrows, then play" as two actions (Bee-Bot is aimed at early years from about this age, Robot Turtles at 4+). Cost: a bands line and tests. **Ready.** (The roadmap's earlier idea; 2 levels is the smaller opening, 3 once level 3 has been played by a child.)
- **Toddler and lap.** Not served; the "drive the robot" level below could reach a toddler but is a different game from a program, and Light Lab 1–2 already holds that live idea. Left out until a toddler has played the drive level.

### Levels below level 1 (waiting on the level-order decisions)

These wait on [how levels are ordered for a band](../ROADMAP.md#waiting-on-the-developer) and on whether a range may skip. If the cheap option is chosen (a younger band gets its own appended slice ordered easy to hard), they are ids above the school top, held by `preschool` only.

- **Drive the robot.** No program and no play button: each arrow tap moves the robot one cell with a step sound; a star two cells away; a rock that only stops the robot gently ("oops, let us go around"). No misses are possible and the round ends on the star. Rule test: any tap sequence keeps the robot on the board and off the rocks; the star is reachable; completion needs the robot on the star. Cost: a `live` mode that skips the queue and play button, plus a bot that taps the shortest route. Mirrors Light Lab 1–2.
- **One step, then play.** The first program: one slot, one arrow, play. A 3 × 3 board with the star one step away. Teaches "arrows go in, then press play" before any plan. Rule test: the slot limit is 1 and the shortest route is 1. No misses are likely; a wrong arrow is the normal miss.

### Left out on purpose

- Timers, fewest-block stars, ranks and race modes (Cargo-Bot and Kodable shortest-code goals): the rules exclude pressure and ranking.
- Free drawing of her own board or sharing boards: needs a creation slot and bounded repair; belongs to a "make your own course" game, not here.
- Text code, variables and typed commands: not for this audience.
- Conditions in this round: see the sketch row.
- Memory versions (hide the program, replay it from memory): extra memory load.

## Decisions for the developer

1. **Level order of the new levels.** I propose **11 Where will it stop?, 12 Fix the program, 13 Pick it up on the way, 14 Mend the loop, 15 A routine**, in difficulty order. The roadmap's chunk 12 item names "Robot Path 11, Fix the program"; moving it to 12 is a doc-only change if you agree. If you would rather keep fix at 11, prediction becomes 12.
2. **Is a pre-K or school robot player expected to reach "A routine" (level 15)?** It is the biggest slice and the first one that introduces a second program row. Lean: build 11–14 first, and decide 15 after a child has played 12.
3. **Level 12's slot control.** Tapping a slot selects it (instead of deleting it and everything after). Lean: yes on levels 12 and 14 only, because the other levels' delete-the-rest is understood and the grown-up card already says it.
4. **Preschool at levels 1–2.** Ready; includes a person check. Also: which is the right moment for the drive and one-step-then-play levels (they wait on the level-order decisions).
5. **Couch.** The school window 4–6 stays a team stop. Do the new levels (which need select and predict controls) belong on the couch at all? Lean: no, leave couch at 4–6.

## Build slices, in order

1. **Say what happened** (ready): the bump/stopped-short/empty messages, the hint that prefers a consistent known route, three new voice lines. Rule tests for `nextPress` on alternative valid routes. Tier: game rules plus typecheck; the voice test; one scripted play at level 6.
2. **Three boards per level** (ready): `boards` per level, a seeded pick, the board-property tests for all ten levels. Tier: typecheck and the game's rule tests; `scripts/browser-check.mjs` `robots()` reads board geometry, so check it still plays (`BROWSER_SUITE=robot`).
3. **Preschool at levels 1–2** (ready, person check afterwards): bands and registry tests. Tier: typecheck and the registry/bands tests.
4. **Level 12, fix the program** (ready, after 2): the select-a-slot control, free first watch, authored boards, hint lit slot. New-level tier: rule tests, `fingerdemo` at the new level, one scripted play.
5. **Level 11, where will it stop?** (ready): cell-tap layer, unscored prediction. Same tier.
6. **Level 13, pick it up on the way** (ready): waypoint rule and art. Same tier.
7. **Level 14, mend the loop** (after 4).
8. **Level 15, a routine** (define first: the two-row UI, the call button and the bot).
9. **Drive the robot, one step then play** (waits on the level-order decisions).

## What was built in this session

Nothing in the game. This session wrote the write-up and updated the tracker and the roadmap. No checks were run beyond a link check of the docs; the game's code was read, not changed.
