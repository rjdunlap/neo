# Robot Path

<!-- generated: from src/games/robot-path; edit the text below the end mark (npm run game-docs) -->

**ID:** `robot-path` · **Land:** Tinker Lab · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, sequencing, spatial-reasoning, loops

| Band | Levels, easiest first |
| --- | --- |
| preschool | 16, 1, 2 |
| pre-K | 1–6 |
| school | 4–15 |

| Level | Plays like |
| --- | --- |
| 1 | One or two steps straight to the star |
| 2 | A short program with a turn |
| 3 | Plan across a bigger grid |
| 4 | Plan around rocks |
| 5 | Take a longer path around rocks |
| 6 | Plan up to eight steps |
| 7 | Repeat a step: tap an arrow again to go further ("right ×4, down ×2") |
| 8 | A winding path in four counted moves |
| 9 | A loop: repeat "right, down" up a staircase |
| 10 | A longer loop body: "right ×2, down ×2", twice |
| 11 | Where will it stop? |
| 12 | Fix the program |
| 13 | Pick up the apple on the way |
| 14 | Mend the loop |
| 15 | A routine: use the same steps twice |
| 16 | Drive the robot: each arrow moves it one step |

<!-- end generated -->

**Starts as:** driving the robot to a star with arrow taps

**Grows into:** three boards per programming level, explained bumps and short runs, hints that keep alternative shortest routes, turns, rocks, programs of up to eight steps, counted steps ("right ×4"), loops that repeat the program, then predict where a shown program stops, fix a short program, pass the apple on the way to the star, mend a looped program, then a routine: a purple Do this row called from Start here (school)

## Design notes

**Level 16, Drive the robot (preschool, entry level).** No program and no play button: `drive-scene.ts` (`DriveRobot`) moves the robot one cell per arrow tap. A rock or the edge stops it with a small wobble (the rock says "Oops, a rock, {name}! Let us go around."), never a miss; the round ends on the star ("Right on the star!", reused clip text). Four 3 × 3 boards (`DRIVE_PLANS`), star two steps away, one rock each, seeded pick. The hint rings the next arrow of a shortest route (`driveNext`); ghost-finger autotouch and the couch stick/bot also drive. Preschool `order` is `[16, 1, 2]` and the module has `entryLevels: [16]`. Tests: the "Drive the robot (level 16)" describe in `logic.test.ts`, the upright layout test, the `DRIVE_ONLY=1` robot browser suite. Next unbuilt part of dive slice 9: One step, then play.

Preschool plays levels 16, 1 and 2, the last two being rock-free 3 × 3 boards with routes of one to three steps; pre-K keeps levels 1–6 and school keeps 4–15 (couch stays 4–6). A visible arrow program, a play button, and editable steps. Programming levels 1–10 each draw from three seeded boards. Level 1 offers one or two straight steps; the first six levels add turns, grid size, rocks, and longer routes. Every board has a tested solution within its program limit. Levels 7–8 hold *counted* steps: tapping the same arrow again makes "right ×4", so a long route fits in two or four slots. Levels 9–10 add a purple loop button that repeats the whole program ×2–×4 (a staircase is "right, down, ×4"). Each level has an authored solution; rule tests check that it works and that the plain route doesn't fit the slots without the new idea. Playback lights up the slot being carried out (step-through), and step-level hints preserve any shortest route she has started; counted/looped hints follow the authored solution: the arrow to tap again, the next arrow, the loop button, or clear. An empty program asks for arrows without a miss. A failed run counts one miss: a collision jiggles the robot and says "A bump!", while a program ending on open ground says it needs more steps. Two misses add one hint. At level 11, a shown step or counted program asks where the robot will stop; tapping a square is an unscored prediction, then the robot plays it out. At school level 12, she watches a short counted program once for free, selects the step that needs fixing, and changes it so the robot reaches the star; the first hint glows on the slot to change. At school level 13, an apple sits on the 5 × 5 board (three boards, counted slots, four-slot limit) and the robot must pass over it on the way to the star; a run that reaches the star without it stops with "You forgot the apple", the apple glows, and counts one miss, and the hint leads to the next arrow of a route through the apple. School level 14, *Mend the loop*, shows one of three 5 × 5 looped programs (repeat limit two) already built; the first run is a free watch that stops short. Two boards are mended by one more turn of the loop (any count at or above it reaches the star) and one by one more step in a body slot, with the level-12 select-a-slot control beside the loop button. A mend that still fails is a miss, and after two misses the glow leads back from any edit toward the star (an over-counted slot glows Clear). Boards are authored per level; couch play still uses it as a team game.

Upright on a phone, its layout is the pure `robotLayout` in `layout.ts` (tested over levels 1–14, every board and plan, on four upright views): the grid (cell up to 128) is centered between Home and the controls, the four arrows lie in one row beneath it (the loop button a fifth on loop levels), then the program slots (2 rows of 4 when the limit is above 4) with play at the end of the last row, placed up from the bottom edge. On a tall phone the 5 × 5 grid leaves some empty space above the arrows.

**Level 15, A routine (school).** Rules, editor and hints are in `routine.ts`, the scene in `routine-scene.ts`, the upright layout in `routineLayout` (`layout.ts`); tests are `routine.test.ts` and `upright.test.ts`. A purple **Do this** row and a **Start here** row; the call tile in Start here runs Do this. Two authored corridors are picked by the seeded rng: Around the middle (Do this prefilled right, down) and Down the steps (empty routine). Undo is built; Clear is not on this level. Tries are free and incomplete runs cost nothing; a bump is a miss. After two misses the next button glows (the slot, then the tile) through `routinePress`. Both rows stay visible in both phone orientations. Gap: the packet's "first board on entry" was not built; the board is simply the seeded pick.

**Challenge course (`The Star Mazes`, `course.ts`).** Five frozen mazes in `src/games/robot-path/course.ts` (version 1; two 4 × 4 `steps` boards, three 5 × 5 `counts` boards), par `[6, 7, 9, 14, 15]` (total 51) computed by `shortestPath`. Pre-play arrow edits are free; pressing Play counts every step walked (including a bump) and saves via `progress()`. Two failed runs or pausing for a hint glow the next button and mark the run assisted. `routes: true` replays each board's shortest path via `autoplay()`.
