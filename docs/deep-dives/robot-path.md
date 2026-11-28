# Robot Path deep dive

*ID `robot-path` · bands pre-K, school · levels 1–12 on 2026-10-10 · session `claude/roadmap-item-14-game-d0rjma` ([PR 82](https://github.com/rjdunlap/neo/pull/82))*

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
| 11 | 5 × 5, one blocking rock, shown step or counted program | prediction | school | read a program, predict its stopping cell, then watch |

**What a round draws from.** Levels 1–10 each use one authored board; level 11 picks one of two authored prediction boards; level 12 picks one of three authored repair boards with the round's seeded RNG. Replaying a level with the same seed shows the same board. The program limit makes the idea necessary (the rule tests assert that the plain route does not fit the slots on levels 7–10 and that the given solution does). The hint follows a known solution (the breadth-first shortest route on levels 1–6, an authored one above).

**Couplings.** A how-to card (goal, two steps, and one `LevelLine` each from level 7 and level 9) with a ghost-finger bot (`autotouch()`, built on `nextPress`). A couch entry at school's levels 4–6 as a **team** stop (`play: 'together'`, `faceoff: 'team'`: authored boards would be a path a second player had watched). No journal entry, no picnic step, no sticker art beyond the robot. Voice: `robot.start`, `robot.counts`, `robot.loop`, `robot.wrong`, `robot.hint`, `robot.clear`.

**Known gaps.**
- **"A bump!" is said for every miss**, including a program that simply stopped short of the star without touching anything. The robot never shows where or why it stopped.
- **Playing an empty program does nothing**, silently.
- **The hint can ask her to clear a good program.** `nextPress` checks her program against one known route, so a different valid route (very common on 4 × 4 boards with few rocks) is told to start over.
- **One board on levels 1–10**, so a replay or a pin repeats the exact puzzle; this remains the main reason to add a pool.
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

None of these renumbers a saved level. The school window widens as levels are appended. Levels 11, 12, 13 and 14 are built; level 15 remains proposed and run in difficulty order.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | **Where will it stop?** | school (and pre-K's top if wanted) | A finished program sits in the slots (steps, then counted); the robot waits. She taps the cell where it will end up, then presses play to watch | reading a program she did not write: trace it in her head | A prediction is never a miss (experiment). Right: "You knew!"; wrong: the robot walks and the pet says where it stopped. The round ends after the watch. No hint beyond lighting the first slot | the shown program ends on a cell that is not the star and not the cell a "reverse reading" or "ignore the rocks" would give (so a wrong tracing differs from a right one); its end cell is on the board; at least one board per mode | New `PredictPlan` type, a cell-tap layer over the grid (cells are 100 units at most; check a 5 × 5 grid keeps 100-unit taps), no finish through `run()`. The bot taps the right cell then play. A `LevelLine` how-to |
| 12 | **Fix the program** (built 2026-10-10) | school | A finished counted program runs from the first tap on play (a free watch) and stops short. Exactly one slot is wrong; she selects it and taps the same arrow once to add the missing step | debugging: find the short slot and fix it | The free watch is not a miss. A repair that still fails is a miss with the robot showing where. After two misses the wrong slot glows (a hint). Tapping a slot selects it instead of deleting what follows; clear still empties | each authored board's broken program fails; exactly one one-slot edit reaches the star; the first failure occurs on the slot to edit; no other single-slot edit is required for the hint to lead somewhere | Slot taps select rather than truncate on this level. Three authored boards. Couch stays at levels 4–6 |
| 13 | **Pick it up on the way** (built 2026-10-15) | school (pre-K top if wanted) | A basket (or apple) sits on the grid; the program must pass through it before it ends on the star | one more constraint: a waypoint | A run that reaches the star without the apple is a miss: "You forgot the apple" and the apple glows. Hint: the ring leads to the first arrow of a route through it | the solution passes through the waypoint; the plain shortest route to the star does not (otherwise the constraint is empty); the waypoint is not a rock | `runPath` records visited cells; goal needs `via?: Cell`; art: an apple in `props.ts` style; the hint solution comes from a search over (cell, visited) states |
| 14 | **Mend the loop** (built 2026-11-03) | school | A looped program ("right ×2, down ×1, ×3") nearly reaches the star; one body slot or the repeat count is wrong | debugging inside a loop | Same free watch, same single-edit hint; the loop count is a possible fix | like 12, plus: a count change alone fixes at least half the authored boards | Reuses 12's control and level 9–10's loop UI |
| 15 | **A routine** | school | The purple Do this row has two arrows. The player places its call tile twice in Start here, with a right arrow between them | reuse the same steps from a new square | An incomplete program gets spoken guidance; a bump or short walk counts a miss | each winning walk uses at least two calls | [Build packet](#level-15-a-routine); two routine slots keep reuse necessary on both 4 × 4 boards |
| — | *Conditions* | — | "If a rock is ahead, turn right", repeat until the star | rules that depend on what the robot sees | — | — | **Sketch only**, not scheduled: it is a new language (a sensor, a repeat-until) and belongs to a later band (see the roadmap's E2 horizon). Needs its own definition of ready |

Levels 11–14 stay at 5 × 5 so the school band's targets are never smaller than today; the program row keeps 4 per row.

### Level 15, A routine

The robot needs the same short route twice. The player puts that route in a purple **Do this** row and uses a matching call tile in the **Start here** row. The robot follows the routine from wherever it is, then returns to the next main tile. Level 15 extends school from 4–14 to 4–15. Couch play stays at 4–6.

**Two boards.** Start at `(0,0)` on a 4 × 4 grid. Each row below is a corridor from start to star. Every unlisted cell is blocked. Use the first board on entry to the level, and let the seeded selector vary subsequent rounds. Each solved board is one round.

| Board | Open cells in walking order | Starting routine | Example winning program |
| --- | --- | --- | --- |
| Around the middle | `(0,0) (1,0) (1,1) (2,1) (3,1) (3,2)` | Right, Down | Do this, Right, Do this |
| Down the steps | `(0,0) (0,1) (1,1) (1,2) (2,2) (2,3)` | Empty | Routine Right, Down; main Down, Do this, Do this |

There are three main slots and two routine slots, one arrow per tile. With two routine slots, one call and two single arrows cover at most four steps. Each star is at least five steps away. The first round leaves the main row empty with its first slot selected, so the player can try a call before writing a routine. The second round starts with its first routine slot selected. Accept any legal program that reaches the star. For example, on Down the steps, routine Down, Right and main Do this, Do this, Down also works.

**Editor and playback.** The main row takes arrows and calls. The routine row takes arrows. Tap a filled slot to replace it or the next empty slot to append. Each edit advances selection within that row if there is a next slot. Undo restores the previous edit and selection across both rows, including replacement of a prefilled arrow. Both rows remain visible during playback. Highlight the top-level tile and the current routine arrow together during a call, then move the highlight to the next main tile. Run from the start, stop at the first wall, star or end of the program, and preserve both rows for revision. Rotation preserves the editor state and playback position. Use one-level expansion with source slot indices and the existing movement and stop rules. Validate the editor limits before expansion and let the expanded walk play beyond the three main slots.

On an empty routine, tapping its call for a main slot prompts “Put an arrow in Do this first.” The main row stays as it was. With the routine selected, tapping the call lights the main row and prompts “Put the purple tile in Start here.” Play with an empty main row points to its first slot. These incomplete edits and empty runs are free. A programmed run that bumps or stops short counts one miss. Show the stopping cell, play the gentle boing and describe what happened. After two misses, or on Help, guide one edit at a time toward a winning program. Prefer a winning program that retains the most filled slots, with a stable tie break. Light the slot, then its tile, and keep the suggestion stable until an edit. If the current program already wins, light Play. Completion uses the standard one-sticker path, including after help.

**Phone layout and teaching.** Use a shared purple call mark in the palette, the main row and the routine heading, alongside spoken row names and a visible selection outline. Keep all slot, palette, Undo and Play hit boxes at least 100 logical units and clear of Back, Help, the guide and captions. On a short upright phone, try the board beside a compact editor with both program rows above a wrapped palette of four arrows and the call tile. Reserve the bottom-right for Undo and Play if the caption bubble needs the middle-left. On a short sideways phone, put the passive board right of the caption bubble and the editor controls above or below it. The grid is a playback display, so its cells can fit the available space. Check actual bounds with captions enabled in both orientations before keeping the arrangement.

Scope the how-to steps to level 15. On the prefilled board say “Tap the purple tile to use these two arrows. Put a right arrow after it. Then use the purple tile again.” On an empty board say “Put two arrows in Do this. Use the purple tile in Start here to run them from where the robot is.” The ghost finger uses actual editor targets. It fills the chosen board's two rows, skips correct prefilled arrows and presses Play. Co-play away from the screen: draw two arrows on a paper tile and follow them from two starting squares, with the player calling when to do the pair.

**Build checks.** Use the new-interaction tier and cover both boards. Enumerate legal row pairs and assert each board has a winner, all winning walks actually invoke the routine at least twice, empty and nested calls cannot run, and trace indices stay on the main call until its body finishes. Exercise hint progress from wrong edits in either row and verify that school alone gains level 15. Run `BROWSER_SUITE=robot FROM_LEVEL=15 TO_LEVEL=15` for free incomplete input, a failed run, Help, Undo, rotation with captions, and one sticker on each board. Capture the short upright layout. Run `BROWSER_SUITE=fingerdemo FINGER_ONLY=robot-path FINGER_BAND=school FINGER_LEVELS=15` for the two-row demo.

### Younger-band openings

- **Preschool at levels 1–2.** Both are 3 × 3 boards with two or three steps (arrows, a star, no rocks). Add `preschool` to `bands` with `levels: { min: 1, max: 2 }`. The how-to card is already scoped to levels and needs no change; the voice is the same line. A rule test confirms the registry's band table (a game's bands, ranges and descriptions agree) and that a child at those levels has no more than four arrow buttons and four slots (level 2 keeps one spare slot). Person check: whether a three- or four-year-old can hold "add arrows, then play" as two actions (Bee-Bot is aimed at early years from about this age, Robot Turtles at 4+). Cost: a bands line and tests. **Ready.** (The roadmap's earlier idea; 2 levels is the smaller opening, 3 once level 3 has been played by a child.)
- **Toddler and lap.** Not served; the "drive the robot" level below could reach a toddler but is a different game from a program, and Light Lab 1–2 already holds that live idea. Left out until a toddler has played the drive level.

### Levels below level 1 (waiting on the level-order decisions)

These are placed by [`order`, which may skip IDs](../DESIGN.md) (built). If the cheap option is chosen (a younger band gets its own appended slice ordered easy to hard), they are ids above the school top, held by `preschool` only.

- **Drive the robot.** No program and no play button: each arrow tap moves the robot one cell with a step sound; a star two cells away; a rock that only stops the robot gently ("oops, let us go around"). No misses are possible and the round ends on the star. Rule test: any tap sequence keeps the robot on the board and off the rocks; the star is reachable; completion needs the robot on the star. Cost: a `live` mode that skips the queue and play button, plus a bot that taps the shortest route. Mirrors Light Lab 1–2.
- **One step, then play.** The first program: one slot, one arrow, play. A 3 × 3 board with the star one step away. Teaches "arrows go in, then press play" before any plan. Rule test: the slot limit is 1 and the shortest route is 1. No misses are likely; a wrong arrow is the normal miss.

### Left out on purpose

- Timers, fewest-block stars, ranks and race modes (Cargo-Bot and Kodable shortest-code goals): the rules exclude pressure and ranking.
- Free drawing of her own board or sharing boards: needs a creation slot and bounded repair; belongs to a "make your own course" game, not here.
- Text code, variables and typed commands: not for this audience.
- Conditions in this round: see the sketch row.
- Memory versions (hide the program, replay it from memory): extra memory load.

## Decisions for the developer

1. **Level order of the new levels.** Levels 11–14 are built. Level 15 A routine follows Mend the loop as the final school level.
2. **A routine by band.** Level 15 is school only, per the October 23 decision below.
3. **Level 12's slot control.** Built: tapping a slot selects it instead of deleting it and everything after. Level 14 can reuse this control; other levels retain delete-the-rest.
4. **Preschool at levels 1–2.** Ready; includes a person check. Also: which is the right moment for the drive and one-step-then-play levels (they wait on the level-order decisions).
5. **Couch.** The school window 4–6 stays a team stop. Do the new levels (which need select and predict controls) belong on the couch at all? Lean: no, leave couch at 4–6.

**Decided 2026-10-23 (on the developer's delegation):** build 14 Mend the loop, then 15 A routine as the last school level (a child playing level 12 becomes a later person check, not a gate); couch play stays at 4–6.

## Build slices, in order

1. **Say what happened** (built 2026-10-11, [PR #151](https://github.com/rjdunlap/neo/pull/151)): the bump/stopped-short/empty messages, the hint that prefers a consistent known route, three new voice lines. Rule tests for `nextPress` on alternative valid routes. Tier: game rules plus typecheck; the voice test; one scripted play at level 6.
2. **Three boards per level** (built 2026-10-11, [PR #149](https://github.com/rjdunlap/neo/pull/149)): `boards` per level, a seeded pick, the board-property tests for all ten levels. Tier: typecheck and the game's rule tests; `scripts/browser-check.mjs` `robots()` reads board geometry, so check it still plays (`BROWSER_SUITE=robot`).
3. **Preschool at levels 1–2** (built 2026-10-11, [PR #154](https://github.com/rjdunlap/neo/pull/154); person check remains): bands and registry tests. Tier: typecheck and the registry/bands tests.
4. **Level 11, where will it stop?** (built 2026-10-10): a cell-tap layer for two shown programs (individual and counted steps), an unscored prediction and playback to the actual stopping square. Rule tests check that the correct stop differs from skipping the rock and reading the arrows backwards; the ghost finger predicts and plays it. Typecheck, rule tests, `robot` filtered to level 11 and `fingerdemo` at level 11.
5. **Level 12, fix the program** (built 2026-10-10): three counted repair boards, the free first watch, select-a-slot editing, and a hint on the slot to change. Typecheck, logic tests, the filtered level-12 browser play, and the level-12 ghost-finger demo passed.
6. **Level 13, pick it up on the way** (built 2026-10-15, branch `claude/robot-path-pick-it-up`, [PR #347](https://github.com/rjdunlap/neo/pull/347)): an optional `via` apple waypoint on `RobotPlan`, `VIA_PLANS` (three 5 × 5 boards, counted slots, limit 4), a new stop `forgot` ("You forgot the apple", the apple glows, one miss), the school range now 4–13, how-to lines, voice lines `robot.via` and `robot.forgot`. Typecheck, 15 Robot Path logic tests, 92 registry/content tests, the filtered level-13 browser play and the level-13 ghost-finger demo passed (see [VERIFICATION](../VERIFICATION.md)); the `robot` suite now plays 1–13 by default.
7. **Level 14, mend the loop** (built 2026-11-03, branch `claude/robot-path-mend-the-loop`, [PR #1153](https://github.com/rjdunlap/neo/pull/1153)): `MEND_PLANS`, three 5 × 5 looped boards shown already built (limit 2) with a free first watch; two are mended by one more turn of the loop (any count at or above it reaches the star), one by one more step in a body slot; `repairPress` leads the glow back from any edit for levels 12 and 14; school range 4–14; voice lines `robot.mend`, `robot.mend.hint`, `robot.fix.clear`; how-to steps `from: 14`; the `robot` suite plays 1–14. Typecheck, 19 Robot Path rule tests, the level-14 browser play and the level-14 ghost-finger demo passed; a school child mending rather than rebuilding is an open person check.
8. **Level 15, a routine** ([definition](#level-15-a-routine) complete, [PR #1912](https://github.com/rjdunlap/neo/pull/1912); **built**, PR [#1919](https://github.com/rjdunlap/neo/pull/1919); first board on entry built): two program rows, a call tile, two corridors, revision and ghost finger.
9. **Drive the robot, one step then play** (first half **built 2026-11-28**: level 16, Drive the robot, `drive-scene.ts`, preschool order `[16, 1, 2]`, `entryLevels: [16]`; **claimed 2026-11-28, project thread:** One step, then play, level 17) (the level-order question is settled by the [2026-10-23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules): each entry takes the next free stable ID, placed with `order` and `entryLevels`, no renumbering).

## What was built in this session

Levels 11, Where will it stop?, and 12, Fix the program, are built. Level 12 shows a counted program, gives a free first watch, then asks the player to select its short slot and add a step. Three authored boards have exactly one single-slot repair. Checks are recorded in [VERIFICATION.md](../VERIFICATION.md); iPad target sizing, device speech and child play remain open.

## Slice 2 build note (2026-10-11)

Programming levels 1–10 now each draw from three seeded boards. The original is retained, a diagonal reflection varies the known route, and a third board varies the goal or rock layout. Level 3 uses a new goal instead of a duplicate reflection. Level 1 has only two two-step straight goals from its fixed corner; its third goal is one straight step away, preserving the no-turn opening. Levels 2–3 also admit shorter routes within their existing budgets. Rocks, grid sizes, controls and slot limits stay scoped to their existing modes; the counted and loop solutions still need their compact programs. Prediction and repair pools at 11–12 are unchanged.

All 30 boards have valid geometry, a working route and ghost-finger completion tests from an empty or wrong program; seeded draws reach all three boards and repeat from the same seed. The level-6 regression play, portrait new-board review and level-10 demonstration passed. Device and child play remain open. Slice 1’s spoken feedback and alternative-route hints are now built (2026-10-11). Empty Play asks for arrows without a miss; blocked runs jiggle and explain the bump, while short runs wait at their last square for an explanation. Step-level hints preserve every shortest-route prefix; counted and looped modes retain their authored teaching solution. The level-6 regression and ghost-finger checks passed; actual device speech remains unchecked.

## Slice 3 build note (2026-10-11)

Preschool now plays existing levels 1–2 through an explicit band table; pre-K remains 1–6 and school 4–12. All six preschool boards are rock-free 3 × 3 grids solvable in one to three steps. Level 2 keeps its existing four-slot budget, including one spare slot; the proposal’s three-slot claim was inaccurate. Tests cover every preschool board, range/adaptation bounds and Tinker Lab visibility/fit. The level-scoped how-to, voice and ghost finger already support these unchanged levels. Child understanding and iPad play remain open.
