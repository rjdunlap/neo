# Block Garden, levels 1–8 (definition)

Defined 2026-10-17 for [chunk 26](../ROADMAP.md#chunks) (gaps against popular mobile games), from the [IDEAS candidate](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default that the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** drag a shaped seed tray onto a garden bed. When a row or a column is completely planted, it bursts into flowers and the flowers are picked, which empties that line again. Sleeping buds sit in some squares of the bed, and **every bud has to bloom**. The learning goal is **spatial planning with shapes that do not turn**: seeing which gap a shape fills, choosing which of several shapes to use, and placing things in an order that leaves room. Nothing falls and there is no clock. Every garden is a finite puzzle with a goal and a known solution, so the genre's usual ending ("nothing fits, game over") never happens. A stuck bed is met with an undo.

## References

| Reference | What it shows | What Block Garden takes or rejects |
| --- | --- | --- |
| Block Blast! ([2025's most-downloaded mobile game, about 356 million installs, AppMagic via PocketGamer.biz](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025)) | Three pieces at a time, no rotation, full rows and columns clear. Its endless mode ends when none of the three pieces fits. Its level-based Adventure mode is recalled, not sourced, and so is its board size of 8×8 | Takes the drag, the three-piece tray, rows and columns clearing, and the fixed piece shapes. Takes the idea of a goal per level from the recalled Adventure mode. Rejects the endless game-over, scores, combos, ads and boosters |
| [1010!](https://apps.apple.com/us/app/-/id911793120) (Gram Games, 2014) | The genre's origin: a 10×10 board, three pieces, no clock, play until nothing fits | Confirms that the IDEAS row's 10×10 board is 1010!'s. Block Garden keeps boards at 5×5 to 8×8 so cells stay large ([Screen](#screen-and-controls)) |
| Woodoku-style block sudoku, e.g. [BlockSudoku](https://apps.apple.com/us/app/-/id1665911009) (store listing, weighted lightly) | A 9×9 board where 3×3 boxes clear as well as lines | Rejected for now. Box clears are a Sudoku Garden-style later mode ([decision 5](#open-decisions)) |
| Tetris, through [Okagaki and Frensch (1994)](https://cdgr.ucsb.edu/node/730) and Sims and Mayer (2002) | Six hours of Tetris made older adolescents faster at mental rotation and visualization. Sims and Mayer found skilled players' advantage limited to Tetris-like shapes, so the gain is narrow | The island set Tetris aside for its real-time pressure ([IDEAS](../IDEAS.md#candidates)). Block Garden keeps the shapes and drops the falling and the speed. It claims practice with planning shapes on its own board, not a general spatial gain |
| Levine, Ratliff, Huttenlocher and Cannon (2012), [*Early puzzle play*](https://dreme.stanford.edu/?p=1836), *Developmental Psychology* 48, 530–542 | Children seen doing puzzles at ages 2–4, and doing them more often, did better on a 2D shape-transformation task at 4½. The study is correlational | Supports a pre-K entry with large shapes and a single gap. It also supports the co-play line, because the study counted parents' spatial talk |

## Overlap

- **Toy Drawer: Make it Fit** ([IDEAS](../IDEAS.md#candidates)) fits objects into a drawer and keeps them. Nothing clears. **Tangram Town** composes a pictured silhouette. **Shape Sorter** matches a shape to its hole. **Gem Swap** matches and drops, and **Jar Sort** is about stacking order. Only Block Garden plants and then empties lines, so a placement can make room for the next one.
- **Sudoku Garden** keeps line rules about numbers. Block Garden's lines are about filling space, and its box-clear mode stays a proposal.

## The model

- **The bed** is `n × n` squares, stored as one integer bitmask per row (at most 8 bits). That avoids the 32-bit limit IDEAS flags for Marble Jump. A square is empty, **planted** (by her), a **stone** (part of the starting bed) or a **bud** (a stone with a sleeping bud).
- **A piece** is a fixed set of squares from a shape library: monomino, dominoes, I-, L- and corner trominoes, the 2×2 square, and I-, L-, J-, T-, S- and Z-tetrominoes, so every shape's mirror image is in the library. Levels 7–8 add the I-pentomino, the 3×3 corner and the 3×3 square. **A piece never turns.** Each orientation is its own library shape, as in Block Blast and 1010!.
- **A placement** puts a piece at an anchor where every square lands on an empty square inside the bed. Then every full row and full column empties **at once**, and a square in both lines is counted once. Buds in emptied squares bloom.
- **The tray** shows at most three pieces. At levels 1–5 the round's whole set is in the tray at once. At levels 6–8 a fixed sequence of six or nine pieces arrives three at a time, and the next three appear when the tray is empty. Small seed packets under the tray show how many are still to come. Any piece in the tray can be used in any order.
- **Goal:** at levels 1–7, every bud has bloomed. At level 8 (*Clear the whole garden*), every square is empty. A garden finishes the moment its goal is met, and any pieces left over go back to the shed. Using every piece is never required.
- **Generation, levels 1–4.** `makeGarden(plan, rng)` in `logic.ts` builds each bed backward. It picks the lines the solution will clear, then cuts the squares the pieces will fill out of those lines as a random tiling from the plan's shape list. The rest of those lines become stones. Buds go on stones that the planned solution empties, and clutter stones go elsewhere. The planned placements are then replayed with `place`, because an earlier clear can remove a square a later line was counting on. A candidate is kept only if the replay meets the goal and it passes `solve` and the plan's filter. Otherwise it is retried, up to 50 times. Each plan also has one authored fallback bed, and a test asserts the fallback is never needed over 500 seeds.
- **Gardens, levels 5–8.** These come from a frozen, solver-checked list in `puzzles.ts`, as Jar Sort's and Gem Swap's do, with at least 12 gardens per level. Their filters (a piece that fits only after a clear, sequences that need later trays, an empty bed with no clutter) are a poor fit for one backward pass. A round picks one garden with `ctx.rng`, and may apply a seeded left–right mirror that swaps each piece for its mirror shape. A mirror keeps par.
- **The planned solution is kept** in the round state. Until she leaves it, the hint reads from that plan, so levels 7–8 do not depend on a search that might hit its cap. **Par** is the solver's fewest placements. It is never shown to her.
- `logic.ts` holds plain functions: `fits(bed, piece, anchor)`, `place(bed, piece, anchor)` (returns the new bed and the emptied lines), `goalMet(bed, goal)`, `solve(state, cap)` (iterative deepening with a memo over the bed rows plus the remaining pieces; returns a shortest list of placements or `null`, and reports when it hits the cap), `hintPlacement(state, history)`, `nearestAnchor(bed, piece, point)`, `gardenLayout(plan, view)`, `planFor(level)`, `makeGarden` and the `puzzles.ts` list.

## Screen and controls

- **Square sizes.** Levels 1–6 use 100-unit squares on a 5×5 or 6×6 bed, so a 6×6 bed is 600 units square. Levels 7–8 are played only at the `grownup` band and use 72-unit squares on an 8×8 bed, 576 units square. That is above the grown-up floor of 64. No band ever gets a 7×7 bed at 100 units, because 700 would not fit a landscape view under the header.
- **Layout** (`gardenLayout`, tested at the four standard views):
  - **Landscape 1024 × 768.** The bed sits at x 170–770, y 64–664 (y 64–640 for 8×8). The shell's Home and `?` are at x 62, so the bed can rise beside them. The tray is a column at x 800–1004, with three slots of 180 × 180 units at y 190–730. Undo is a `RoundButton` (radius 54) centered at (902, 120).
  - **Portrait 768 × 1024.** The bed is at x 84–684, y 128–728. The tray is a row of three 180-unit slots at y 770–950, starting at x 170, so the pet's corner stays clear. Undo is at the right end of the header row.
  - **Reach.** A piece's bottom edge rides 40 units above the finger, so planting in the bottom row puts the finger 40 below the bed. The bed therefore ends at least 80 above `view.h`: in landscape the finger is at 704, or 680 on 8×8, against 768. That keeps a finger clear of the screen edge and the iPad's home-indicator swipe.
  - Taller views center the extra space. In the tray, pieces are drawn at 40 units per square, so the largest piece (3×3) is 120 units wide. Each **slot**, not the piece, is the touch target.
  - The test asserts that no two hit areas overlap, that slots are at least 120 units, that squares are at least 100 units (72 at levels 7–8), that the finger position for every anchor (the piece's bottom + 40) stays 40 or more inside `view.h`, that nothing enters the pet's corner or the shell's corner buttons, and that everything stays inside `view`.
- **Pick up and carry.** On touch-down in a slot, the piece grows at once to board size with a soft pop and starts to follow the finger through `src/engine/drag.ts`. The piece's **bottom edge rides 40 units above the finger**, so a hand never hides it. That uses `drag.ts`'s existing `lift` option, set to 40 plus half the piece's height, with no engine change.
- **Snap and shadow.** While dragging, `nearestAnchor` takes the anchor under the piece's top-left square and rounds it to the nearest square. If that placement does not fit, it tries fitting anchors within 0.6 of a square and picks the closest. When a placement fits, a soft **shadow** shows on the bed where the piece will land, and every line it would complete shimmers. When nothing fits nearby, there is no shadow.
- **Drop.** Lifting over a shadow plants the piece: sprout pops, then a pentatonic run (`src/audio/notes.ts`) as each completed line blooms, from one end to the other. Lifting with no shadow springs the piece back to its slot. Taps during the 0.5 s bloom are ignored. Cancelling, leaving the screen, resizing and a lost release also return the piece to its slot.
- **Bud lines are tinted at levels 1–2.** Every row and column that holds an unbloomed bud is softly striped, which shows which lines need filling. From level 3 they are not tinted.
- **Undo** is unlimited and free, and dim when there is nothing to take back. It takes back the last placement, including any blooms, and puts the piece back in the tray. At levels 6–8 that can return an earlier tray. **Start again** is in the pause sheet. Neither counts for anything. The IDEAS row's "reshuffle" does not exist on the island ([decision 4](#open-decisions)).
- **Speech:** `ctx.instruct` gives the instruction, and the corner pet repeats it. Navigation never needs reading.
- **Feel:** a calm existing music style, not `silenced`. The beds, stones, buds, flowers and seed trays are drawn with Pixi `Graphics` in `palette.ts` colors. Pieces in a set differ by **shape and pattern**, not color alone. Picked flowers fly into a basket in the corner. That is decoration, and nothing is saved.

## Levels

| ID | Name (`describeLevel`) | Bed · square | Tray | Buds · goal | Par | Gardens per round | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Finish one row | 5×5 · 100 | 2 pieces, one needed | 1–2 buds in one line | 1 | 2 | One placement finishes it; bud lines tinted |
| 2 | Rows and columns | 5×5 · 100 | 3 pieces | 2 buds in a row and a column | 2 | 2 | Needs one row and one column cleared; tinted |
| 3 | Two lines with one piece | 6×6 · 100 | 3 pieces | 2–3 buds | 2–3 | 2 | Every solution has a placement that clears a row and a column together |
| 4 | Pick the right pieces | 6×6 · 100 | 3 pieces | 2–3 buds | 2 | 2 | At least one tray piece is in no shortest solution, and a solution that uses it is longer or does not exist |
| 5 | Make room first | 6×6 · 100 | 3 pieces | 3 buds | 3 | 2 | Some piece in every solution fits nowhere on the starting bed. The order is forced: a clear has to make room |
| 6 | Two trays | 6×6 · 100 | 6 in sequence | 3–4 buds | 4–6 | 1 | Needs pieces from both trays |
| 7 | The big garden | 8×8 · 72 | 9 in sequence | 4–6 buds | 7–9 | 1 | Uses at least one pentomino or 3×3 piece; needs all three trays |
| 8 | Clear the whole garden | 8×8 · 72 | 9 in sequence | no buds; empty the bed | 6–9 | 1 | The starting bed has 8–16 stones, and an empty bed is reachable |

**Bands (`BandLevels`):** `prek: { min: 1, max: 3 }`, `school: { min: 2, max: 6 }`, `grownup: { min: 5, max: 8 }`. There is no `order`, and there are no lap, toddler or preschool levels. Levels 7–8 are only in the grown-up range, which keeps their 72-unit squares off the child bands.

### First rounds

Rows and columns are numbered from 0 at the top left.

- **Level 1, garden 1 (authored, always first):** a 5×5 bed with stones at row 2, columns 0–2. The stone at column 1 has a bud. The tray holds a horizontal domino and a 2×2 square. "Fill the row to wake the bud." Row 2 is striped. Placing the domino at columns 3–4 clears the row, and the flower blooms. The square also finishes the row if it covers columns 3–4, and anywhere else it is a free extra move that cannot block the gap. **Garden 2** is seeded: a column version with a vertical domino or tromino.
- **Level 2:** two seeded gardens. A bud sits in a row and another in a column, each one piece short of full, with one extra piece in the tray.
- **Level 3:** the first level without tinting. An L-shaped gap sits where a row and a column cross, and the L-tromino fills both at once. The pet says, "One piece can finish two lines."
- **Level 4:** seeded gardens from its plan. **Levels 5–8:** seeded picks from the frozen list, as in the table.

## Accounting, help and finishing

- **Never a miss:** any legal placement, including one that makes the goal unreachable; a drop outside the bed; putting a piece back; undo; Start again; and repeating the instruction. Planting is exploration.
- **A refused drop** is lifting a piece whose center is over the bed when no shadow is showing. The piece springs back with a gentle boing and a spoken reason: "It needs an empty space just its shape." At **levels 1–2 it is never a miss**. From **level 3 it is one miss**, because the shadow has already shown that it does not fit there.
- **The two-miss glow:** at a garden's second miss, and every second miss after that, the hint piece glows in its slot and its shadow appears at the hint anchor until she plants something. Each glow counts `hints++` once.
- **The wander hint:** after `max(4, 2 × par)` placements since the garden began or since the last hint, without finishing, the same glow appears and `hints++`. Couch play never offers this hint.
- **The hint placement** (`hintPlacement`) is the first placement of a shortest solution from the current state. The search is a bounded `solve`, capped at 200,000 states. If it hits the cap, it falls back to **undo**: it steps back through her own history to the most recent state with a known solution, and the undo arrow glows.
- **Stuck:** when no tray piece fits anywhere, when the pieces are used up, or when the bounded search proves no solution remains, the pet says, "No room for this one! Let's take one back," and the undo arrow pulses. This is never a miss and never a hint. If the search only ran out of states, nothing is claimed.
- **Finish:** once every garden in the round is done, the basket of flowers goes to the land's host. Then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed.
- **Adaptation** follows the unchanged shell rule. Levels 1–2 can produce hints but not misses. That counts as adaptation, not evidence of mastery, the same as other free-error levels.

## Rule tests (`logic.test.ts`)

- **`fits` and `place`:** a placement is legal only if every square lands empty and inside the bed. Full rows and columns empty together, and a square in both is emptied once. `place` and then undo restores the exact bed. Squares are conserved: planted cells minus emptied cells equals the change in filled count.
- **`goalMet`:** holds exactly when no bud is unbloomed, or, at level 8, when the bed is empty.
- **Generation** (levels 1–4), for each plan over 500 seeds:
  - every garden is well formed: the bed matches the plan's size, the goal is not already met, and no line starts full;
  - it is solvable, and par is inside the plan's range;
  - it passes the plan filter from the table;
  - the same seed gives the same garden;
  - the authored fallback is never used (levels 1–4).
- **The frozen list** (levels 5–8): every garden is well formed and solvable, its par is inside its plan's range, it passes its plan filter, its stored solution replays to the goal, level-8 beds hold no buds, and the mirror of every garden is also solvable with the same par.
- **`hintPlacement`:** from many states reachable on each plan's gardens, the placement is legal and lowers the shortest remaining solution by exactly one, or the result is undo at a proven dead end. The worst level-8 case runs under the 200,000-state cap in a stated time on Node (the test records it; the target is under 150 ms). Hitting the cap returns the history fallback, never nothing.
- **Dead end:** a constructed bed where nothing fits reports stuck, and undo leads back to a solvable state.
- **`nearestAnchor`:** returns a fitting anchor within 0.6 of a square or none, and never an anchor where the piece does not fit.
- **Layout:** `gardenLayout` at the four views for every plan, against the size assertions above.
- **Registry, lands and how-to tests** pass with the new game, including Rainbow Meadow still fitting on one screen.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`, and `autotouch()` drags the hint placement's piece from its slot to the anchor along the solver's shortest solution from the current bed, aiming so the snapped shadow lands on that anchor. It never demonstrates a refused drop. The bot also stands in for the scripted play's solve.
- **How-to card** (`src/content/howto.ts`). Goal: "Plant shapes until every bud blooms."
  - Steps: "Drag a seed tray from the side onto the bed. A shadow shows where it lands" (all levels); "A full row or column blooms, and its flowers are picked" (all levels); "The striped lines still need filling" `{ from: 1, to: 2 }`; "When these three are planted, three more arrive" `{ from: 6, to: 8 }`; "Empty the whole bed" `{ from: 8, to: 8 }`.
  - Finish: "Every bud has bloomed" `{ from: 1, to: 7 }`, and "The bed is empty" `{ from: 8, to: 8 }`.
  - Note: "Shapes never turn. The round arrow takes back a planting, as often as you like, and planting is never counted against her." Plus a `LevelLine` from 3 to 8: "A shape dropped where it cannot fit is counted for her level."
- **Voice lines** under `block-garden.*`: `intro`, `instruct`, `instruct-clear` (level 8), `two-lines` (level 3), `refuse`, `bloom`, `next-tray`, `stuck`, `hint`, `done`. `{pet}` is optional.
- **Registration:**
  - ID `block-garden`, name "Block Garden", spoken title `game.block-garden`.
  - Region (subject) `puzzle-peaks`. Skills `['spatial-planning', 'shape-composition', 'planning']`.
  - Home land **Rainbow Meadow**, the shapes land. It has 7 games today, and would reach 8 with Jar Sort, 9 with Sprout Shuffle and 10 with this one. The largest land has 13 today.
  - Grown-ups see it in Rainbow Meadow at their band, as they see Marble Jump in Puzzle Peaks.
  - The hub icon is a 2×2 bed with one flower blooming. The sticker is a seeded flower basket.
- **Co-play:** one person points at a gap, and the other finds the shape that fills it. Say "row" and "column" aloud, as in the Levine study. **Off-screen:** cut paper shapes from squared paper and fill a drawn 5×5 grid, without turning them.
- **Couch:** none in the first build. It is a later candidate: a cursor moves the carried piece over the bed and a button plants it, with Gem Swap's `liveController` pattern and a frozen course of gardens.
- **Rework couplings:** none required. The basket of flowers is a natural input for a later project, such as decorating the welcome adventure's [home base](../rework/README.md#learning-belongs-in-the-story), and flower kinds could become collectable garden looks. Nothing is saved or unlocked by this slice, and any such use is the rework's to define.

## Check tier

New-game tier. Run typecheck and unit tests (all the rule properties above, plus the registry, lands and how-to tests). Then make one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8, with one refused drop at level 3 or above and one hint. Take one portrait screenshot at level 6. Run `fingerdemo` at level 1 and at level 8, because a drag bot has to land the snap. Run `npm run build`, because the registry, lands, voice and how-to files change.

Device checks stay open:

- whether a pre-K child can carry a piece with the 40-unit lift;
- 72-unit squares for a grown-up on a phone;
- whether the shadow is read without being explained.

## Open decisions

Each has a default that the build uses. None blocks it.

1. **Bands.** Default: pre-K 1–3, school 2–6 and grown-up 5–8, in Rainbow Meadow. The alternative is the IDEAS row's grown-up-only game in Lantern Lake (it would be the 13th game there), which drops levels 1–4.
2. **Rotation.** Default: none, as in Block Blast and 1010!. Each orientation is its own shape. The alternative is a rotate button for grown-ups only, which needs its own solver branch and a hint for turning.
3. **Refused-drop accounting.** Default: free at levels 1–2, one miss from level 3. The alternative is never a miss, with help only from the wander hint.
4. **No reshuffle.** Default: no reshuffle on the island. Every garden is solvable, and undo and Start again cover recovery. IDEAS's reshuffle "that counts as a try" belongs to a later couch or endless mode.
5. **Later modes.** Box clears (3×3 boxes on a 9×9 bed, the block-sudoku form) and the endless run stay proposals. If built, the endless run would be opt-in, with no game-over screen.
6. **Couch play** later, as above. It is not part of this build.
