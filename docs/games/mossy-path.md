# Mossy Path

<!-- generated: from src/games/mossy-path; edit the text below the end mark (npm run game-docs) -->

**ID:** `mossy-path` · **Land:** Puzzle Peaks · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, planning, path-coverage, maze-planning

| Band | Levels, easiest first |
| --- | --- |
| lap | 12 |
| toddler | 4 |
| preschool | 4–5 |
| pre-K | 5, 6, 8 |
| school | 6, 8, 1, 7, 9, 2, 10, 3, 11 |

| Level | Plays like |
| --- | --- |
| 1 | A winding trail: bloom every tile |
| 2 | An open patch: plan a route through every tile |
| 3 | Two rocks: visit fourteen tiles through narrow passages |
| 4 | Follow the moss: one winding path to the pond |
| 5 | Which way? One fork |
| 6 | Look before you go: dead ends one step deep |
| 7 | Snack on the way: get the berry, then the pond |
| 8 | A little patch: bloom every tile |
| 9 | Two snacks: both berries, then the pond |
| 10 | Plan, then go: draw the way, then the turtle walks it |
| 11 | Thick moss: some tiles need two visits |
| 12 | Turtle walk: any touch steps the turtle to the pond |

<!-- end generated -->

**Starts as:** tap or drag a turtle along moss tiles: levels 1–3 (school) bloom every tile once and reach the pond last, with Undo and Start over; levels 4–7 and 9 (toddler to school) find the way through hedge mazes, walking back freely from a wrong branch; level 10 (school) draws the whole route as paw prints, then taps the turtle to walk it; level 11 (school) is coverage where thick tufts are crossed twice; level 12 (lap) is a straight corridor where any touch anywhere steps the turtle to the pond

**Grows into:** three coverage plans each at levels 1–3 (corridors, open patches, rocks); level 8, *a little patch*, five small boards (2 × 3 to 3 × 3) where a far tap is free; then six frozen hedge mazes per level 4–7, level 7 collecting the berry before the pond; level 9, *two snacks*, six 4 × 7 mazes with two berries eaten in either order before the pond; level 10, *plan, then go*, three 4 × 7 mazes where she draws the route first and the turtle then walks it; level 11, *thick moss*, four boards (3 × 4 and 4 × 4) where each thick tuft is crossed twice and a first visit to one is never a miss; level 12, *turtle walk*, three straight corridors of 3 to 5 steps (lap's only level) where any touch steps the turtle once, with no misses or hints; exact-search and next-tile hints

## Design notes

Held upright, the widest mazes fit seven 104-unit tiles across. Undo, Hint and Start over sit beside the pet, below the caption bubble on short phones. Turning the screen during a press leaves the drawn route ready to finish.

*toddler–school, levels 1–7 · path-coverage puzzle (1–3) and hedge mazes (4–7).* Tap an adjacent unvisited moss tile: the turtle steps there and a flower blooms. Visit every tile exactly once and reach the pictured pond last; any valid complete route earns one sticker. The starting tile already blooms. Level 1 follows a short winding corridor, level 2 opens a patch with route choices, and level 3 threads tiles around rocks (three frozen plans each). Seeded reflections and rotations vary each board. This asks for coverage, distinct from Penguin Slide's stopping places and Robot Path's programs.

Tapping the turtle is free. Non-adjacent, visited and early-pond taps give specific spoken guidance and a gentle boing; two consecutive misses reveal counted help. Legal experiments and dead ends are free. Undo removes one step and Start over restores the same board, preserving misses and hints. Exact-search help outlines a completing next tile, or Undo until the path can be completed; repeated help on the same path counts once. The how-to's ghost finger uses the same taps. Co-play swaps the planner and mover after Undo; off-screen play walks a toy turtle over a paper grid.

**Levels 4–7, *find the way* (toddler to school).** The same turtle and moss, but the patch is a hedge maze: walk to the pond. Six frozen mazes per level (a seeded pick, flipped left–right or top–bottom, never transposed). One grid pad takes taps and drag stepping (the first finger owns the slide); a tap or drag back onto the trail walks the turtle back 0.15 s a step, free, and faint paw prints mark where it has been. Level 4 (toddler, preschool) follows one way with no miss, no buttons and a pace cue after 4 s that is not a hint; level 5 (preschool, pre-K) adds forks, a wrong branch being free exploration; level 6 (pre-K, school) counts a miss once per wrong branch per round; level 7 (school) collects a berry (badge in the status line) before the pond, and the berry-less pond is refused, counted once per round. Hint lights the next tile toward the pond, counted once per trail (`moss.hint-maze`). Bands: toddler 4, preschool 4–5, pre-K 5–6, school 1–7 in order 6, 1, 7, 2, 3 (`entryLevels` 4, 5, 6). Skills add maze planning. **Looks.** Each round seeds a season (spring, autumn with amber hedge leaves, snow with snowy hedge tops) and a berry (red, blueberry, strawberry); flower petals vary by season. Levels 1–3 draw one of three frozen plans each, all within 4 × 4 so cells stay at least 100 units; level 2 includes an open 3 × 3 (not a 2 × 5, whose transposed cells would be too small) and level 3 keeps the original one-route two-rock plan. **Level 8, *a little patch* (pre-K order 5, 6, 8; school order 6, 8, 1, 7, 2, 3).** Coverage on one of five frozen small boards (2 × 3, 2 × 4, two rocked 3 × 3s, an open 3 × 3), flipped and rotated; a transposed 2 × 5 was rejected because its cells fall under 100 units. A far tap is free: it pulses the tiles she can step to and says `moss.far`; visited and early-pond taps still count. A child tapping only far tiles never reaches the automatic two-miss help (the Hint button and pulse remain). Not drawn: the turtle turning its head to a far tap (only the adjacent-tile pulse).

**Level 10, *plan, then go* (school, order 6, 8, 1, 7, 9, 2, 10, 3).** Three frozen 4 × 7 tree mazes (flipped, never transposed), no berry, dead ends up to two tiles deep and one wrong branch that forks again. She slides or taps from the turtle to draw dotted paw prints: a tile beside the plan's end adds, the second-last tile erases, a far tap pulses and says `moss.far`; drawing is never a miss. Tapping the turtle walks the plan at 0.25 s a tile. A plan that reaches the pond finishes; one that enters a wrong branch counts one miss per branch per round (boing, `moss.stop`) and the turtle can walk back free; one that ends short stops and waits (`moss.plan-more`). Hint draws the next three tiles toward the pond as gold prints, counted once per trail (`moss.hint-plan`). Undo erases the last print first, then steps the turtle back; Start over clears the plan. A cancelled press never sends the turtle off, and a press on the turtle that drifts away keeps the plan. The bot traces the route, then taps the turtle.

**Level 11, *thick moss* (school, order 6, 8, 1, 7, 9, 2, 10, 3, 11).** Four frozen boards (`THICK`; `Board.thick`): 3 × 4 open, pond 8, tuft 5; 3 × 4 open, pond 10, tuft 7; 4 × 4 rock 6, pond 15, tufts 9 and 10; 4 × 4 rock 5, start 1, pond 3, tufts 6 and 10; the pool is drawn at random, flipped and transposed like levels 1–3. Every tuft is crossed twice, every other tile once, pond last. The solver counts visits (two bitmasks, memoised by both and the turtle's tile). A first visit to a tuft is never a miss; far, bloomed-tile and early-pond taps count as levels 1–3; stepping back onto a once-visited tuft is a legal second visit. Hint (exact completion), Undo and Start over as levels 1–3. A tuft is tall leaning blades, flattened after the first visit, and blooms with an extra centre flower after the second, so the state reads by shape, not colour. Voice: `moss.thick` once per round on the first flattened tuft and the instruct line `moss.thick-go`.

**Level 12, *turtle walk* (lap).** Appended, lap only (`lap` 12–12, `entryLevels` 12; `isTurtleWalk`, `walkStep` in `logic.ts`). `MAZES[12]` holds three straight one-row corridors of 3–5 steps, flipped left–right, never transposed. The grid pad's hit area is the whole view, so a touch anywhere (an empty corner too) steps the turtle one tile toward the pond; nothing is a miss and there is no hint, and Undo, Hint and Start over are hidden. A pace-cue glow on the next tile after 4 s idle is not a hint. Voice: the instruct line `moss.walk`; the how-to and `coplayHintLap` show a parent's tap alternating with hers. Nothing is filed in the journal and toddler stays at level 4.
