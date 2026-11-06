# Mossy Path: first playable slice

Built 2026-10-13 on `codex/mossy-path`; [PR #285](https://github.com/rjdunlap/neo/pull/285). Source: `src/games/mossy-path/`, with registry, land, voice, how-to and browser integration. [Build notes](../archive/COMPLETED-2026-10-09.md#mossy-path-first-slice-2026-10-13); [verification](../archive/VERIFICATION-2026-10-13.md#2026-10-13--mossy-path-first-slice).

**Fun action and purpose:** each step of a turtle blooms a moss tile. Plan a route that visits every tile exactly once and ends at the pictured pond. This is path coverage, distinct from Penguin Slide's sliding and Robot Path's programming.

**Band and ladder:** school, levels 1–3. First a seven-tile winding corridor; then a three-by-four open patch with route choices; then a four-by-four patch with two rocks and bottlenecks. Seeded reflections and rotations vary the boards without changing saved level IDs. Targets remain at least 100 logical units in portrait and landscape.

**Rules and finish:** tap an adjacent unvisited tile. The starting tile already blooms. The pond accepts the final step only after all moss blooms. Any complete valid route earns the shell's one sticker. Tapping the turtle is free; non-adjacent, already-visited and early-pond taps receive specific spoken guidance and a gentle boing. Two consecutive misses show help. Legal route experiments and dead ends are free.

**Revision and help:** Undo takes back one step; Start over restores the same board. Both preserve misses and hints. An exact search finds a completing route from the current path. If none exists, help outlines Undo until a completing prefix is restored, then outlines the next tile. Repeating help on the same path counts once. The ghost finger uses the same tap controls, including undo for recovery.

**Verification:** test seeded solvability, every tile/end constraint, alternative routes, dead-end recovery and hint progress. Run typecheck/unit tests/build, the filtered `mossypath` scripted play at levels 1 and 3 (misses, hint, undo, reward, land/home and portrait), `fingerdemo` filtered to this game, and filtered navigation/offline checks because catalog navigation changes. Real iPad feel, device speech and child play remain open.

## Levels 4–7, *find the way* (definition, PP1)

Defined 2026-11-06 on `claude/define-mossy-path-4-7` (docs only), from the [puzzle-pages study's ladder](../deep-dives/subjects/puzzle-pages.md#a-first-games-ladder-mossy-path-find-the-way). **Built 2026-11-06** on `claude/mossy-path-4-7` ([PR #1312](https://github.com/rjdunlap/neo/pull/1312); [build note](../archive/COMPLETED-2026-10-09.md#mossy-path-levels-47-find-the-way-2026-11-06)). Deviations: `entryLevels` is `[4, 5, 6]`, not `[4, 5]`, because the registry test requires every level a band places first (school's 6) to be an entry level (landing is unchanged); one added voice line, `moss.hint-maze` ("The gold tile is the way to go."), since `moss.hint` talks about blooming all the moss; the turtle turning its head toward a far tap is not drawn (only the adjacent-tile pulse).

**Fun action and purpose.** The same turtle on the same moss tiles, but the patch is now a hedge maze: walk the turtle to the pond. Levels 1–3 ask her to *cover* every tile; levels 4–7 ask her to *find the way*: which branch reaches the pond, looking ahead from a fork before stepping, and (level 7) doing two goals in order. It opens Mossy Path to toddler, preschool and pre-K, which have no maze anywhere on the island (the study's best-evidenced gap). It is not Penguin Slide (slides to a wall), Robot Path (a programmed sequence) or Treasure Map (directions on a map).

**Source check (this session).** Opened at the source: Völter and Call 2014, *Cognition* 130(2), 186–203 ([abstract](https://research-portal.st-andrews.ac.uk/en/publications/younger-apes-and-human-children-plan-their-moves-in-a-maze-task/)): 24 children of 4 and 5 in a decision-tree maze with traps; 5-year-olds planned up to two steps ahead, 4-year-olds one, and the children's difficulty was shifting attention across a sequence of subgoals. Miyata, Watanabe and Minagawa 2014, *PLoS One* 9(12) e115292 ([opened](https://pmc.ncbi.nlm.nih.gov/articles/PMC4270727/)): 29 children of 39–70 months on a touchscreen grid with two or three goals and **no barriers**, so it is route ordering, not a maze; the nearer goal was taken first by 71% of the younger and 83% of the older group, and children often "travel straight ahead until being forced to change directions". The [Kumon *Easy Mazes* listing](https://www.abebooks.com/9781933241241/Book-Easy-Mazes-Kumon-1933241241/plp) (opened) labels it 2–4 and places it after tracing ("more advanced tracing exercises"): a publisher label, not evidence. What this supports: level 4 is tracing-like following, level 6 asks for one step of look-ahead (four), level 7 for two plus an ordered pair of goals (five and up), with the nearer goal (the berry) on the way, matching what children of that age choose. Still a gap: nothing found on maze planning below 3, so level 4 at toddler is a following game, not a planning claim; nothing here says mazes improve planning.

### Boards

**Representation.** The existing `Board` (`rows`, `cols`, open `tiles`, `start`, `pond`) is kept: a maze is a *block maze* whose open tiles are the moss corridors and whose other cells are hedges (drawn as low clipped hedges, `eventMode: 'none'`, as the rocks are). Two tiles connect when they are orthogonal neighbours and both open, as `adjacent` already says. A new optional `berry?: number` is used only at level 7. Each maze level has a **frozen set of three authored boards** (`MAZES[level]`, written as rows of `S`, `P`, `B`, `.` and `#` in `logic.ts`); a seed picks one and applies a left–right and/or top–bottom flip. **No transpose** at levels 4–7 (see layout). A frozen set rather than a generator: every board's properties are checked exactly by test, and dead-end depth is easier to author than to constrain.

**Size and the 100-unit floor.** Maze boards are at most **4 rows by 7 columns**. The current `resize` (`cell = min(132, (h − 330)/rows, (w − 320)/cols)`) then gives at least 100.6 units on the 1024 × 768 view (a 5-row board would give 87.6, a transposed 4 × 7 62.6, so neither is allowed); wider and taller views only grow it. Level 4 and 5 boards are 3 × 5 (132 units). Mossy Path is not upright-ready, so the upright view does not apply.

**Worked examples** (one board of each set; checked this session to be trees with the stated forks and branch depths; the build adds two more per level with the same properties):

| Level | Board (rows, top first) | Route | Forks on the route and what hangs off them |
| --- | --- | --- | --- |
| 4 *Follow the moss* | `S....` `####.` `P....` | 11 tiles, a U | none |
| 5 *Which way?* | `##..#` `S..#P` `##...` | 7 tiles | one fork; the wrong branch is 2 tiles long, its end in sight |
| 6 *Look before you go* | `#.#.#.#` `S......` `######.` `P......` | 15 tiles | three forks, each with a one-tile dead end |
| 7 *Snack on the way* | `#.##B##` `.......` `##.###.` `S....#P` | 11 tiles to the pond, berry 2 off the route | a wrong branch that forks again (stem one tile, two one-tile arms: two steps of look-ahead), a two-tile dead end, and the berry's spur, which comes before the pond |

**Board properties (every board in every set, every flip):** the open tiles form a tree (connected, tiles − 1 connections), so there is exactly one route between any two tiles; level 4 has no fork; level 5 has exactly one fork with a wrong branch of at most two tiles and no fork inside it; level 6 has two or three forks on the route, every wrong branch exactly one tile; level 7 has at least one wrong branch with a fork inside it (two steps of look-ahead) and no wrong branch deeper than three tiles; the berry is on a spur off the route (not on the route, not in a wrong branch), and its fork is nearer the start along the route than the pond, so the nearer goal comes first; start, pond and berry are distinct open tiles, and the pond is a leaf.

### Moving: forward, back and drag

At levels 4–7 the **trail is the turtle's current route from the start** (`path`, a simple path in the tree). Levels 1–3 keep their rules unchanged.

- **Forward:** a tap on an open tile adjacent to the turtle and not on the trail steps there; the tile blooms and the trail line grows.
- **Back:** a tap on the tile the turtle just came from (`path[length − 2]`) steps back: free, never a miss, and not the Undo button (it has the same effect). A tap on any **earlier** trail tile walks the turtle back to it one step at a time (about 0.15 s a step, taps ignored while walking): also free. A tile backed out of loses its flowers and keeps a faint paw print, which means nothing to the rules (she can see where she has been).
- **Ignored:** a tap on the turtle, on a hedge (hedges take no touches) or on a tile not adjacent to the turtle and not on the trail. At levels 4–5 an ignored far tap is silent: the turtle turns its head toward it and the tiles beside the turtle pulse once. At levels 6–7 it says the existing `moss.far` with the same pulse. **No far tap is a miss at levels 4–7** (a far tap is an input slip, not a route decision; levels 1–3 still count it).
- **Drag stepping (the new interaction), levels 4–7:** one finger down anywhere on the grid and slid. Whenever the finger enters a cell (the nearest cell centre within half a cell) that is a forward or back step from the turtle, that step happens exactly as a tap would; cells that are neither are passed over silently, so a finger that runs ahead does nothing until it comes back beside the turtle. The grid takes a single `pointerdown` over the board's rectangle (hit area in its local units); the first pointer owns the drag and every other pointer is ignored until it lifts (palm rejection); release, release outside, the finger leaving the canvas and cancellation all end it (Pixi 8 never forwards `pointercancel`, so listen for it on the canvas, per the [pitfalls](../DESIGN.md#input-and-rendering-pitfalls)); `destroy()` removes the listeners. A tap is a drag that enters no new cell, so tapping keeps working. Levels 1–3 stay tap-only.

**What the pond and berry do.** Levels 4–6: stepping onto the pond finishes. Level 7: stepping onto the berry tile collects it (it hops onto the turtle's shell, `moss.berry`) and it stays collected when she walks back; a step onto the pond **without** the berry is refused (the turtle stays, the pond ripples, `moss.snack`).

### Accounting, help and finishing

| Level | Misses | Help |
| --- | --- | --- |
| 4 | none possible | no Hint, Undo or Start over buttons; after 4 s with no step the next tile on the route glows (a pace cue, never counted as a hint) |
| 5 | none possible: the wrong branch is exploration; at its end the turtle sniffs the hedge, says `moss.hedge` and the tile behind it glows | as level 4 |
| 6 | stepping from the route into a wrong branch: a soft boing and `moss.stop`, **once per wrong branch per round** (its entrance tile is remembered; walking in again, Undo and Start over never re-count it) | Hint, Undo and Start over buttons as at levels 1–3. Two misses with no new route tile in between glow the next tile and count one hint, as levels 1–3 do; the Hint button lights the next tile toward the goal and counts once per trail (the existing `helped` set) |
| 7 | as level 6 for each wrong branch (entering the stem counts; choosing an arm inside it does not count again), plus a pond step without the berry: boing and `moss.snack`, **counted once per round**; later tries speak but do not count | as level 6 |

- **The goal and the next tile.** The goal is the berry while it is uncollected (level 7), else the pond. The next tile is the first tile of the tree's unique route from the turtle to the goal: inside a dead end it is the step back; on the route it is the next route tile. `nextToward(board, at, goal)` in `logic.ts` does this; the Hint button's glow, the pace cue and the bot all use it.
- **The miss counter for help** at levels 6–7 resets only when the turtle steps onto a route tile it has not stood on this round (progress), not on a back step, so two wrong branches tried in a row bring the glow.
- **Undo and Start over** (levels 6–7) keep misses, hints and the remembered branches; Start over also puts the berry back.
- **Finish:** reaching the pond (with the berry at level 7) finishes the round through `ctx.finish({ misses, hints })`; the shell gives the one sticker, including with help. `moss.done-maze` replaces `moss.done` at levels 4–7.
- Most toddler and preschool rounds are smooth (0 misses), so they step up as the adaptation rule says; level 4 → 5 at preschool is intended.

### Bands, order and land

`BandLevels`: `toddler: { min: 4, max: 4 }`, `preschool: { min: 4, max: 5 }`, `prek: { min: 5, max: 6 }`, `school: { min: 1, max: 7, order: [6, 1, 7, 2, 3] }`; `bands` gains `toddler`, `preschool` and `prek`; no lap or grown-up. School's order puts the one-step maze first, then the fork-free seven-tile coverage corridor (level 1), then the two-goal maze (level 7, which is harder than a corridor but easier than open-patch coverage), then levels 2 and 3. `entryLevels: [4, 5]`: without it, a preschooler with a saved 4 who turns 6 would land, by `clamp`'s nearest ID in school's order, on 3 (|3 − 4| = 1 beats |6 − 4| = 2), the hardest coverage board; with it `landing` starts school at 6. A pre-K level 6 is in school's order and carries over unchanged; a toddler 4 in preschool and a preschool 4 or 5 in pre-K clamp to 5 by `min..max`. `describeLevel` names: 4 "Follow the moss: one winding path to the pond", 5 "Which way? One fork", 6 "Look before you go: dead ends one step deep", 7 "Snack on the way: get the berry, then the pond".

Mossy Path stays in Puzzle Peaks. The land already holds 16 games (more than `LAND_SPOTS`, so it pages); toddler, preschool and pre-K pages gain it, and the build runs the lands test to prove every page still fits at every band. Its `region` and `challenge` (`space`) are unchanged; `skills` gain `'maze-planning'`.

### Screen

Heading by level: levels 4–5 "Walk the turtle to the pond", 6 "Find the way to the pond", 7 "Get the berry, then the pond"; the status line at levels 4–7 drops counts and shows nothing at 4–5, and the berry picture (empty, then filled) at 7. Hedges are drawn as clipped green hedges taller than the moss so the corridors read without colour alone; the pond is the existing pond, the berry a red berry with a leaf. Levels 4–5 hide the button row; levels 6–7 keep it where it is. Touch-down: a tile lifts under the finger at once and a step plays the existing `sfx.pop`; a back step plays `sfx.tick`; a refused pond plays the boing.

### Voice lines (`src/content/voice-script.ts`)

`moss.maze` (instruct, levels 4–6): "Help the turtle find the way to the pond. Tap or slide along the moss." `moss.maze-berry` (instruct, level 7): "The turtle wants a berry snack on the way. Get the berry first, then go to the pond." `moss.hedge`: "Hedges all around. Let's turn back." `moss.stop`: "That way stops at the hedge. Look for the way that keeps going." `moss.snack`: "The pond can wait. Get the berry first!" `moss.berry`: "Yum, a berry! Now to the pond." `moss.done-maze`: "The turtle found the way to the pond!" Existing lines keep their meaning; `moss.go` stays the levels 1–3 instruction.

### Rule tests (`logic.test.ts`)

- Every board of every maze set, under every allowed flip: the open tiles form a tree; start, pond (and berry) are open, distinct, and the pond is a leaf; the level's fork and branch-depth properties above hold; the berry lies on a spur whose fork is before the pond along the route; at most 4 rows and 7 columns, and `min(132, (768 − 330)/rows, (1024 − 320)/cols) ≥ 100`.
- `makeBoard(level, rng)` for levels 4–7 never transposes, and the same seed gives the same board.
- Moves: forward and back steps are accepted, a tap on an earlier trail tile walks back to it, far and hedge taps change nothing, and the pond refuses without the berry at level 7.
- Accounting: entering each wrong branch counts exactly one miss at levels 6–7, and walking in again, Undo and Start over never re-count; levels 4–5 can never produce a miss; the berry-less pond step counts once per round.
- `nextToward` from every open tile, with and without the berry, is adjacent to the turtle and strictly closer (in tree distance) to the goal; following it from the start reaches the berry (level 7) and then the pond with no miss, and from inside every dead end it leads out.
- The bot's plan (below) finishes every board with zero misses and zero hints.

### Ghost finger, how-to card and registration

- **Bot (`autotouch`).** Level 4: one `{ trace, via }` stroke along the whole route from the turtle to the pond, so the card shows the drag. Levels 5–7: taps on `nextToward`'s tile, `pause` 0.4, so the hand shows looking ahead (it never enters a wrong branch). Level 7's demonstration is about 15 taps, well inside the 75 s a finger demonstration gets.
- **How-to card** (`src/content/howto.ts`, steps scoped with `to`/`from` level ranges, not "later levels"): levels 1–3 keep their three steps, now scoped `to: 3`; for levels 4–5 (`from: 4, to: 5`) "Tap or slide along the moss to walk the turtle to the pond. Wrong turns are free: walk back the way you came."; for level 6 (`from: 6, to: 6`) "Look ahead at each fork. A step into a dead end counts once; Hint lights the way."; for level 7 (`from: 7`) "Collect the berry first, then reach the pond." Its goal and note are reworded to cover both kinds; the note states the maze accounting from the table above.
- **Registration:** `levels`, `entryLevels`, `bands`, `skills`, `describeLevel`; `coplayHint` and `offScreen` gain a maze sentence ("Draw a maze with one wrong turn for each other; trace it with a finger first.").
- **Browser case:** the `mossypath` case in `scripts/browser-check.mjs` gains level 4 (a drag along the route), level 7 (one wrong-branch miss, a Hint, the berry, then the pond) and a portrait screenshot of level 7; `fingerdemo` filtered to `mossy-path` at levels 4 and 7.

### Check tier

New interaction on an existing game, with new bands: typecheck, unit tests (rules above plus the registry, lands and how-to tests), then **one** filtered `mossypath` play at levels 4 and 7 (a drag, a miss, a hint, the berry, finish) and one portrait screenshot, then `BROWSER_SUITE=fingerdemo` filtered to `mossy-path` at levels 4 and 7 (`FINGER_LEVELS=4,7`). Run `npm run build` only if shared files change (they should not). Not established by these checks: iPad drag feel, device speech and a child's play; record them in [DEVICE-CHECKS](../DEVICE-CHECKS.md).

**Cost:** one build session (new levels and bands on an existing game plus drag stepping).
