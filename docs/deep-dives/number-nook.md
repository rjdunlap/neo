# Number Nook deep dive

*ID `number-nook` · band grown-up · levels 1–3 on 2026-11-07 · session `claude/dive-number-nook` ([PR #1370](https://github.com/rjdunlap/neo/pull/1370))*

## The game today

*Updated after slice 1: the board pools, the glide, green in-place tiles, the once-counted visible hint, looks and the fewest-slides line are built; the "Known gaps" below that slice 1 closed are marked in "What was built". The text of "Content pools" and "Rules today" describes the game before slice 1. Levels and the grown-up range 1–3 are unchanged.*

A grown-up plays the classic sliding-number puzzle. She taps a numbered tile beside the empty space, and the tile slides into the gap. The round ends when the numbers read in row order with the gap at the bottom right. A small goal picture sits beside the board, and tiles already in their goal place are drawn teal. The puzzle is **planning a route for the empty space**: a tile can only be moved by bringing the gap round to it, so putting one tile in place often has to disturb another for a while. The game is in Lantern Lake (its `region` is `puzzle-peaks`) and is touch only, with no entry in `src/couch/catalog.ts`. It is `upright: true` (phone batch 1). Younger players reach it behind the land's signpost and play level 1.

| Level | Plan name (`describeLevel`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Four spaces: one small loop | grown-up | Which way round the loop, 4 slides |
| 2 | Six spaces: plan around two rows | grown-up | An 8-slide route on a 2 by 3 board |
| 3 | Nine spaces: weave rows and columns | grown-up | A 14-slide route on the 3 by 3 board |
| 4 | Eight spaces: two long rows | grown-up | An exactly 18-slide route on a 2 by 4 board (slice 3) |

`BandLevels`: `grownup 1–4` (level 4 added by slice 3), no `order`, no `entryLevels`.

**Content pools.** `makeBoard` picks a board at exactly the level's shortest distance (4, 8, 14) from a full reverse breadth-first search of the shape, cached per shape (12, 360 and 181,440 reachable boards). I counted the pools for this dive with a scratch port of `logic.ts`. Level 1 has only **2** boards, `3 1 / 2 _` and `2 3 / 1 _`, and they are mirror images: it is one puzzle. Level 2 has **12** boards. Level 3 has **1,893**. Across distances the 2 by 2 board reaches 6 slides at most, the 2 by 3 board 21 and the 3 by 3 board 31 (2 boards); this matches the published maximum for the 8-puzzle.

**Rules today.** Tapping a tile beside the gap slides it (`sfx.pop`), on touch-down through `onTap`. Every legal slide is free exploration and adds one to the slide count. Tapping a tile not beside the gap boings, says `nook.miss` and **counts a miss**; every second miss outlines a tile on a shortest route and counts a hint. Hint outlines the next tile of a shortest route from the current board (`solutionStep`), so it still leads somewhere after any exploration, and says `nook.hint`. Undo and Start over restore a board and keep slides, misses and hints. Solving says `nook.done` and calls `ctx.finish({ misses, hints })`. The ghost-finger bot taps the shortest-route tile. Rule tests cover the state counts, exact seeded distances, hints after any legal slide on 2 by 3, refused moves, and the upright layout.

**Known gaps.**
- **Level 1 is a single puzzle** and level 2 has 12 boards, so replay is thin below level 3.
- **No motion.** A slide redraws every tile at once, so the eye cannot follow which tile moved. That matters most on 3 by 3, where she has to track the gap.
- **A Hint tap while a hint is showing counts again** (`showHint` adds one to `hints` each time). Gem Swap and Marble Jump count a visible hint once.
- **A tap in line with the gap is a miss.** *(Closed by slice 2: a tap in the gap's row or column slides the line; only a diagonal or other-row tap is a miss.)* Most digital versions (Simon Tatham's *Fifteen*, below) slide every tile between the gap and the tap. A grown-up who taps two tiles away in the gap's row is making a sensible move, and here it is a counted miss.
- **"Green" is teal.** `nook.go`, the status line and the how-to card say green tiles are in place, and `numberArt` draws them with `swatch.teal`. Either the word or the swatch should change.
- Nothing after finishing says how her route compares with the shortest one, although the exact distance from the start is known.
- `nook.go` is three sentences.
- Person checks ([device checks](../DEVICE-CHECKS.md)): real-iPad touch and speech, whether the goal picture is read without help, and adult enjoyment of 3 by 3.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [The 15 puzzle](https://en.wikipedia.org/wiki/15_puzzle) (Noyes Chapman, 1870s; the 8-puzzle and 24-puzzle) | Classic sliding toy | Bigger boards (3 by 3, 4 by 4, 5 by 5). Johnson and Story (1879) proved half of all arrangements cannot be solved. The 8-puzzle needs at most 31 single-tile moves and the 15 puzzle at most 80. Finding a *shortest* solution on large boards is NP-hard | The 4 by 4 as the ladder's top; the parity fact, as the reason boards are always generated by sliding back from a goal | Sam Loyd's $1,000 "14-15" challenge: an unsolvable board offered as a puzzle |
| [*Fifteen*](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/fifteen.html) in Simon Tatham's Portable Puzzle Collection | Free digital version | Any width and height. A click in the gap's row or column "will move as many tiles as necessary to move the space to the mouse pointer"; `h` gives a suggested move, and pressing it repeatedly solves the board, "it may scramble your progress while doing so" | **Line slides** on a tap in line with the gap; rectangular boards (2 by 4, 3 by 4) as steps between square ones | A hint that undoes her progress without saying so |
| [Klotski](https://en.wikipedia.org/wiki/Klotski) and [Rush Hour](https://en.wikipedia.org/wiki/Rush_Hour_(puzzle)) (ThinkFun) | Sliding-block puzzles | Blocks of different sizes; Rush Hour's 40 cards climb from beginner to expert | A curated climb in small steps; a different **goal** is a new puzzle on the same rule. The island's own [Ferry Jam](ferry-jam.md) already owns blocks of different sizes in lanes | Card numbers shown as a grade |
| Picture sliding puzzles (Tile Savvy, as named in the [IDEAS](../IDEAS.md) Slide Picture seed) | Picture version | The same rule with a picture cut into tiles; the picture tells you where each piece goes | The picture board as the door to a younger band, using Puzzle Pals' code-drawn textures | — |
| [Iterative deepening A*](https://en.wikipedia.org/wiki/Iterative_deepening_A*) (Korf, 1985) | The standard solver | Exact shortest routes for boards too large to search fully, guided by how far each tile is from home | The solver for 3 by 4 and 4 by 4 hints, with measured cost (below) | — |
| Paper tiles on a tray (the game's `offScreen` line) | Physical play | One square left empty | Already in the game | — |

This is not a school skill for a grown-up, so there is no learning standard. Row order is only the label: the skill is the planning and revision the [executive-function study](subjects/executive-function.md) lists for the grown-up band. The wording must not claim any brain-training benefit (AGENTS). A school-age picture or small-number opening would touch counting order (kindergarten counting sequence, [K.CC](https://www.thecorestandards.org/Math/Content/K/CC/)), but that is a decision (below).

## What makes sense here

The rule is complete and the hints are exact. The best gains come in three steps. First, **variety and feel**: more boards at levels 1 and 2, visible slides, fair hint counting. Second, **the input grown-ups expect**: line slides. Third, **bigger and different boards that keep the same movement rule**: a longer rectangle, a goal she has to read, then 3 by 4 and the classic fifteen. The arc for a grown-up runs from a one-loop warm-up (1) to the 8-puzzle (3), then to boards where routing the gap round a long row matters (4), where the goal itself changes (5), and on to the full 15 puzzle (7).

**Measured search costs** (scratch port, Node on the developer's Mac). Full search works for every board up to 2 by 4 (20,160 boards, at most 36 slides from home) and for 3 by 3. A second 3 by 3 goal of the other parity is another 181,440 boards; both fit in one 9!-byte array indexed by permutation rank. 3 by 4 (about 240 million boards) and 4 by 4 (about 10 trillion) need iterative-deepening A* with Manhattan distance plus linear conflict. With 20 boards each: 3 by 4 boards 18–34 slides from home solved in at most 8 ms, and after a 200-slide wander (up to 44 from home) in at most 269 ms. 4 by 4 boards from 60-slide wanders (26–48 from home) took 41 ms on average and 151 ms at worst; from 120-slide wanders (34–50 from home), 399 ms on average and 3.2 s at worst (a board 48 from home); from 400-slide wanders (40–60), 2 s on average and 10.5 s at worst. So a 4 by 4 hint after a long wander cannot rely on an exact search. These are Node timings on a Mac; hint latency in iPad Safari at levels 6 and 7 still needs a device check.

Three references are left out. A slide limit or par to beat is a target she could miss, so the shortest route is an information line after finishing. An unsolvable board (Loyd) is never shown: every board is made by sliding back from its own goal. Timed or race modes are a pressure the island does not use.

## Experience and presentation

- **First unsupported action:** on level 1 she can tap any tile. Only the two tiles beside the gap move, and a far tap boings with a spoken reason. With the slice 1 pool, level 1 starts 3, 4 or 5 slides from home, so whichever way round she goes she sees the loop work.
- **Touch and consequence:** the slide starts on touch-down. The tile glides into the gap in about 0.15 s with a soft wooden `tick`, and the old cell becomes the gap. A tile that lands in its goal place turns green with a pentatonic note that rises one step for each tile now in place, and falls back when one leaves. A refused tap nudges the tapped tile 6 units towards the gap and back, then boings. A tap during a glide is queued once.
- **Variety without a rule change:** the wider pools at levels 1–2 and three seeded looks, all from palette swatches: lantern paper (purple tiles on cream, today's look), driftwood (`wood` tiles with `ink` numbers on a `brown` tray), and sea glass (`blue` and `teal` tiles on a `white` tray). A concrete feel example in existing Pixi `Graphics`: each tile is today's rounded `tile()` with a 4-unit lighter top edge (`wood.light` on driftwood) and a 2-unit shadow line under it, so a gliding tile reads as a block sliding in a groove, not a redraw.
- **Reasoning versus memory and motor:** targets are 87–136 units and still, and nothing is timed. The challenge is foreseeing where the gap must travel. A hint shows one tile, not a route, so she still plans the rest.
- **Supported ending:** a hint leads somewhere from any board, and every round ends solved with a sticker. After finishing, a quiet status line gives the slides she used and the fewest from the start (exact for levels 1–6; on level 7 only when the search finished). It grades nothing.
- **Co-play:** two grown-ups agree on the next tile before either taps, which the existing coplay hint already says; on a 4 by 4 one can own the top row and the other the rest. No code is needed.
- **Off-screen:** the existing offScreen line (paper squares on a tray) stays.
- **Needs a person:** whether line slides are found without being told; whether the level 5 goal picture is read before she starts sliding; whether 4 by 4 on an iPad is satisfying or tedious; real-device speech.

## Proposed ladder

### Fresh content inside existing levels

- **Board pools.** Level 1 draws from boards 3–5 slides from home (6 boards, 3 up to reflection), level 2 from 7–9 (40 boards). Level 3 keeps 14 (1,893). Every board is still drawn from the reverse search, so it is solvable and its distance is exact. Level names do not change; GAMES.md's and the README row's "exactly 4/8/14" becomes "4 (3–5), 8 (7–9) and 14". A rule test asserts at least 4 distinct level 1 boards and 20 level 2 boards over 80 seeds, and every board within its stated range.
- **Motion:** the glide, the in-place note, the refusal nudge and one queued tap, as above.
- **Looks:** three seeded looks.
- **Fair hint counting:** a Hint tap while that hint is showing repeats `nook.hint` and does not count again.
- **Green means green:** `numberArt` uses `swatch.green` for a tile in place, so the words stay true.
- **The fewest-slides line** after finishing.

### A change to the existing interaction

**Line slides.** Tapping a tile in the gap's row or column slides it and every tile between it and the gap, as in Tatham's *Fifteen*. Each tile moved counts one slide, so the count stays in single-tile moves and matches the fewest-slides line. Undo takes back the whole line slide. A tap that is neither in the gap's row nor its column still boings and counts a miss, with `nook.miss` reworded ("Tap a tile in the same row or column as the empty space"). The hint stays one tile, and the bot is unchanged. A rule test asserts that a line slide equals the same single slides in order, that diagonal and other-row taps are refused, and that the board is never changed by a refused tap.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *Eight spaces: two long rows* | grown-up | A 2 by 4 board 18 slides from home (788 boards) | Routing the gap along a long row without undoing the left end | As today; exact hints from a full search of 20,160 boards | Every seeded board is exactly 18 from home; hints shorten the route after any legal slide; levels 1–3 boards unchanged | `PLANS` row; `planFor` clamp reads the table length; layout check at 4 columns (87-unit cells upright, at least 64); how-to stays true; `fingerdemo` at 4 |
| 5 | *Nine spaces: read the new goal* | grown-up | A 3 by 3 board whose goal is **column order** (`1 4 7 / 2 5 8 / 3 6 _`), shown in the goal picture and spoken by `nook.columns`. This goal is in the other half of the arrangements, so its boards come from their own reverse search, 14 slides away | Reading the goal before planning; a tile can look in place by row order and not be | Green follows the goal shown. Hints come from that goal's table | Every board reaches its own goal at the stated distance; `solved` and green use the level's goal; levels 1–4 unchanged | `goal`, `solved` and the tables take the goal; one 9!-byte array (rank-indexed) holds both 3 by 3 goals instead of two string maps; goal picture already drawn from `goal()`; one voice line; how-to step |
| 6 | *Twelve spaces* | grown-up | A 3 by 4 board 24 slides from home, made by sliding back from home and checked by the solver | A longer plan where the top row is placed first and then protected | As today; Hint uses iterative-deepening A*. Measured at most 8 ms on fresh boards and 269 ms after a long wander | The solver's distance for each seeded board is 24; every hint step lowers the solver's distance by one; a test time budget over boards up to 44 from home | The solver in `logic.ts` (about 40 lines); layout at 3 by 4; the bot calls the same solver; `fingerdemo` at 6 is 24 taps |
| 7 | *The fifteen* | grown-up | The classic 4 by 4, about 30 slides from home | The full 15 puzzle at a size grown-ups know | Hint first tries an exact search with a node budget (fresh boards near 30 from home measured well under 151 ms in Node; boards 48 from home can take seconds). Over budget it falls back to a **row-by-row** hint: the next tile of the top row, then the left column, then the 3 by 4 solver, so it always leads somewhere but is not always shortest. `nook.hint` already says "a shortest way", so it needs a second line for the fallback. The fewest-slides line is shown only when it is exact | Seeded boards are within the stated range; the row-by-row hint never moves a tile out of a finished row and always finishes the board; worst hint under the time budget | Node-budgeted solver plus the row-by-row helper; layout at 4 by 4 (87-unit cells upright); one voice line; after level 6 |

### Younger-band openings

A **picture board** (the IDEAS Slide Picture seed) could open the game to `school` and perhaps pre-K. A code-drawn scene from Puzzle Pals' textures is cut into 2 by 2 or 2 by 3 tiles, and the picture says where each piece goes, so no number order is needed. It would be a new easy entry before level 1, using `order` and `entryLevels`, with 100-unit tiles (2 by 3 fits at 116 units upright) and a one-sentence instruction. This waits on a decision.

### Easier entries and levels between existing ones

None for the grown-up band: level 1 is already a one-loop warm-up. The jump from 2 by 3 to 3 by 3 (8 to 14 slides) is not a wall, so level 4 is appended on top in plain number order.

### Left out on purpose

- A slide limit, par to beat, stars or a timer. The fewest-slides line stays information only.
- Unsolvable boards or a "prove it can't be done" level. The parity fact can live in the grown-up page's how-to note, not as a trap.
- A hint that solves the whole board, or one that scrambles her progress without saying so (Tatham's repeated `h`).
- Blocks of different sizes; Ferry Jam owns those.
- A 5 by 5 board: search costs grow sharply and the targets would drop near 64 units upright.

## Decisions for the developer

1. **Open Number Nook to the school band with picture boards (a new easy entry before level 1)?** Lean: yes, after a school-age child plays level 1 once on the iPad. It costs Puzzle Pals' texture cutting, `order`/`entryLevels`, 100-unit tiles and one voice line. It overlaps the IDEAS Slide Picture seed, which would then become this entry rather than a new game.
2. **A controller or couch course for Number Nook?** Lean: skip. Couch play retires at Lands stage E, and the D-pad moving the gap is the same action as tapping.

Slices 1–6 go ahead regardless.

## Build slices, in order

1. **Built.** **Board pools, motion, looks and fair hints.** The 3–5 and 7–9 pools, the glide with one queued tap, the refusal nudge, the rising in-place note, three seeded looks, green for in-place tiles, a visible hint counted once, and the fewest-slides line. Checks: typecheck, rule tests (pool sizes and ranges, hint counted once), one filtered `numbernook` play at level 1 with one portrait screenshot in a new look, `fingerdemo` at 1 (the bot now waits for the glide); build only if shared files change.
2. **Built.** **Line slides.** The multi-tile tap, its undo and slide count, and the reworded `nook.miss` and how-to step. Checks: change to the existing interaction: typecheck, rule tests (a line slide equals its single slides, refused taps leave the board alone), one browser play at level 3 with one line slide and one refused diagonal tap; no `fingerdemo`, since the bot's actions do not change.
3. **Built.** **Level 4 *Eight spaces: two long rows*.** The 2 by 4 plan, `planFor` reading the table length, range 1–4. Checks: new level on the existing interaction: typecheck, rule and registry/how-to tests and an upright layout test at 4 columns, one browser play of 4, `fingerdemo` at 4.
4. **Level 5 *Nine spaces: read the new goal*.** Goal-aware `goal`/`solved`/tables, the rank-indexed array, `nook.columns`, how-to step, range 1–5. Checks: model change: typecheck, rule tests with levels 1–4 unchanged, one browser play of 5 with one portrait screenshot, `fingerdemo` at 5, build.
5. **Level 6 *Twelve spaces*.** The iterative-deepening solver with a test time budget, the 3 by 4 layout, range 1–6. Checks: typecheck, rule tests (exact distance, every hint lowers it, time budget), one browser play of 6, one portrait screenshot, `fingerdemo` at 6.
6. **Level 7 *The fifteen*.** The node-budgeted search, the row-by-row fallback and its voice line, range 1–7. After slice 5. Checks: new hint model: typecheck, rule tests (fallback never breaks a finished row and always finishes, worst hint under budget), one scripted play of 7 with one wander and one hint, one portrait screenshot, `fingerdemo` at 7, build.

The school opening and a couch course (decisions 1–2) are gated and stay out of the ready list.

## What was built in this session

Nothing: research and design only. Board counts and solver timings came from a scratch port of `logic.ts` outside the repository. Ran `node scripts/check-links.mjs` and `git diff --check`.

**Slice 1 built.** `PLANS` now has `near`/`far` instead of `depth`; `pool(level)` returns the boards 3–5 slides from home on level 1 (6 boards), 7–9 on level 2 (40) and exactly 14 on level 3 (1,893), and `inPlace(board)` lists the tiles in their goal place. The tapped tile glides into the gap in 0.15 s (soft `sfx.tick`) with one tap queued during a glide, and the gliding tile draws above the new gap square. A refused tap nudges the tile 6 units toward the gap and back before the boing (still a counted miss). A pentatonic bell rises one step per tile in place and falls when one leaves. Three seeded looks: lantern paper, driftwood and sea glass. Tiles in place are now green (`swatch.green`), as is the goal picture, so the word "green" is true. A Hint tap while a hint shows repeats `nook.hint` without counting again, also after the second-miss hint. After finishing, the status reads "N slides · the fewest from the start: M". The bot waits for the glide and the how-to card is updated. Still open from "Known gaps": line slides (slice 2), the three-sentence `nook.go`, and the person checks.
Ran: `npm run typecheck`; unit tests for `src/games/number-nook` (pool sizes 6/40/1,893, at least 4 and 20 distinct boards over 80 seeds on levels 1 and 2, every board within range, `inPlace`), `src/content` and `src/games/registry` (how-to card fit); `BROWSER_SUITE=numbernook` passed twice (the second after the glide layering fix) at levels 1 and 3 with one wrong tap, two Hint taps counted once, the glide, undo, start over, the fewest-slides line, one sticker each, and a 768×1024 portrait screenshot at level 1 in the driftwood look; `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=1` (4.1 s). "Hint counted once" is proven by the browser play, not a unit test, because the counting lives in `index.ts`. Not run: build (no shared files changed), device touch and speech checks.

**Slice 2 built.** `lineSlide(board, cols, at)` in `logic.ts` returns `{board, steps}` (cells slid nearest the gap first) for a tap in the gap's row or column, and null otherwise. The scene glides every moved tile one cell together, adds one slide per tile moved (so the count stays in single-tile moves and matches the fewest-slides line), and pushes one history entry so Undo takes back the whole line. Taps outside the gap's row or column still boing and count a miss; `nook.miss` now reads "That tile cannot reach the gap. Tap a tile in the same row or column as the empty space." How-to card step 1 and the Undo step are reworded (trimmed to the 840-character limit). Hint stays one tile, the bot is unchanged, and the levels and range 1–3 are unchanged.
Ran: `npm run typecheck`; unit tests for `src/games/number-nook` (new: a line slide equals the same single slides in order over 400 boards per shape on 2×2, 2×3 and 3×3, step count equals distance, one-tile line slides equal `slide`; diagonal, other-row, row-edge-wrap, blank and off-board taps return null and leave the board unchanged), `src/games/registry` and `src/content` (226 passed, how-to card fit); `BROWSER_SUITE=numbernook` passed (refused tap is now a diagonal tile; at level 3 one two-tile line slide glides both, counts two slides, is not a miss, and Undo restores the whole line; levels 1 and 3 finished with one sticker each; 768×1024 portrait screenshot at level 1, driftwood look). Not run: `fingerdemo` (bot unchanged), build (no shared files), device touch and speech.

**Slice 3 built.** `PLANS` gains a 2 by 4 plan exactly 18 slides from home (pool 788 boards; the full reverse search covers 20,160 boards and supplies exact hints), `planFor` clamps with `PLANS.length - 1`, and `LEVELS` is `grownup 1–4`. Upright at 768×1024 the 4-column cells are 87 units (the grown-up 64 floor); sideways at 1024×768 they are 136. `howto.ts`, `voice.ts`, the bot and line slides are unchanged and stay true. The `numbernook` browser suite now takes `NOOK_LEVELS` (default 1,3,4), runs line slides at levels 3 and up and takes a portrait screenshot at level 4 too.
Ran (2026-11-08): `npm run typecheck`; unit tests for `src/games/number-nook` (11: 2×4 state count 20,160, `pool(4)` = 788, seeded boards on levels 1–3 pinned unchanged, seeded level-4 boards exactly 18 slides and walked to solved by hints, hints shorten after any legal slide over the whole 2×4 table, line slides on 2×4, upright layout at 4 columns with the 64 floor and cells of at least 87, sideways layout with the tray clear of the goal picture), `src/content` and `src/games/registry` (how-to fit, game docs current); `BROWSER_SUITE=numbernook NOOK_LEVELS=4` passed (a wrong diagonal tap is one miss, a hint counted once, glide, undo, start over, a two-tile line slide, a 768×1024 portrait in the driftwood look, a solve with the fewest-slides line, one sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=4` passed (25.6 s). Not run: build (no shared files or assets changed), offline, device touch and speech.
