# Campsite level 1 (definition)

**Status:** ready to build level 1, *Pitch the tents*. [Definition PR #1917](https://github.com/rjdunlap/neo/pull/1917).

Campsite (`campsite`) is the PP6 touch puzzle from the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order). Pitch three little tents, one beside each tree. The counted signs say how many tents belong in each row and column, and every tent needs space around it. The player uses the counts to rule out squares and looks for the last space beside a tree. Finish with the campers coming out of their tents.

One board per round. Use `school: { min: 1, max: 1 }`, `upright: true`, a logic challenge and the Puzzle Peaks land. Larger puzzles, a school ladder and a grown-up band need their own definition. Reuse the existing land paging and check every band's capacity, including alongside Bunny Patches if it ships first. Co-play: one person calls a count and the other pitches the tent. At a table: draw four by four squares and use buttons for tents.

## Board and rules

Number rows from the top and columns from the left, starting at 1. The dots below are empty grass, and T marks a tree. Show every clue from the start, with numerals plus tent pips and a clear zero.

| Row | C1 | C2 | C3 | C4 | Tents |
| --- | --- | --- | --- | --- | --- |
| R1 | T | · | · | · | 2 |
| R2 | · | · | T | T | 0 |
| R3 | · | · | · | · | 1 |
| R4 | · | · | · | · | 0 |
| Tents | 0 | 1 | 1 | 1 | |

The opening is an authored fixture with no tent given. Use it on replay as well. Keep the board, validation and hint sequence in `logic.ts`. A completed board has three tents on grass, exactly the given row and column totals, and no pair of tents meeting along an edge or at a corner. The validator must find a one-to-one pairing across shared edges from the three trees to the three tents. Trees stay fixed. A tent can be next to several trees and still serve one, provided every tree gets its own tent. Keep pairing independent of placement order. This follows the [reference rules for Tents](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/tents.html).

The unique answer is R1C2, R3C3 and R1C4. Visible deductions in help order:

1. The top-left tree has two grass neighbours. Row 2 needs zero tents, leaving R1C2.
2. The tree at R2C3 can use R1C3 or R3C3. R1C3 touches the first tent, so pitch at R3C3.
3. Row 3 now has its tent, so the right-hand tree at R2C4 gets R1C4.

R1C2, R1C3 and R3C4 meet the counts and can be paired with the trees. The touching rule rejects that board. Keep it as the wrong answer for scripted play.

## Touch, feedback and help

- Tap grass to pitch a tent and tap an existing tent to pack it away. Give immediate press feedback. A tree tap freely highlights its orthogonal neighbours and replays “A tent goes right beside this tree.” Show three tent icons above the board, with unused tents filled in. At three tents, a fourth grass tap prompts “Pack up a tent to move it” and leaves the board as it is.
- Update the count signs with the current and required pips. Use outlines and a gentle wobble to mark any touching pair. Temporary conflicts, tree replays and taking a tent back are free. Count signs are readouts. The pet's instruction names the counts and the corner rule, and the opening shows a tree's eligible sides.
- Tap **Check camp** to judge. With fewer than three tents, replay how many are left to pitch for free. A new full wrong arrangement counts one miss. For each such arrangement, remember that it was checked for the duration of the round. Replay the same feedback on repeated checks. Check in this order and explain the first applicable reason: tents touching, a row or column with the wrong count, then trees unable to receive distinct tents. In the third case, outline the trees competing for the same tent or the tree with no eligible tent.
- **Show a hint** counts once per press through the coach. With a tent outside the unique solution, glow the first such tent in row order and say why to pack it up. Otherwise glow the first unfilled tent square in the deduction order. Explain using the visible board. If an earlier deduction is needed for the explanation, highlight the relevant count or tree as well. After two misses show the same guidance automatically, counting one hint when it first appears. Remove stale glows after an edit and keep supported completion available. A correct three-tent check pitches the pennants, then calls `ctx.finish({ misses, hints })` once for the round.
- Put instruction and feedback in `voice.ts`. Use `ctx.instruct` for “Pitch one tent beside each tree. Match the tent counts. Leave space so no tents touch, even at the corners.” A level-scoped how-to card shows a corner clash and the ghost finger demonstrates the three deductions and Check camp with ordinary taps. No dragged pieces, timer or separate save state.

## Layout and verification for the build

Keep the whole board upright and sideways. For a 4×4 board the 100-unit tiles occupy 400×400. Place row signs along the right and column signs along the top. Keep the three-tent supply and Check camp below the top shell controls and above the reserved caption and guide area. Check camp and other interactive controls each need at least 100 units. Use the shell's Help and leave its hit area clear. Fit the board and controls using `view`, and keep the same arrangement through resize.

Use the [scaffold](../NEW-GAME.md) with the school band. Meadow Pens already teaches counting grid area and accepts many shapes; Campsite uses counts as constraints on tent locations. Bunny Patches' planned row, column and patch rule is also a no-touching puzzle, while Campsite has unequal totals and shared-edge tree pairing. Critter Crossing is about discovering a rule from examples; Domino Pond is about covering patches with two-cell pieces. A separate small module preserves those games' actions.

- Rules: enumerate the 286 ways to choose three of the 13 grass squares and confirm one solution. Test diagonal touching, a count mismatch, competition for a single tent, and a valid pairing where a tent touches two trees. Verify the authored hint sequence, including removal of a misplaced tent. Test that partial and repeated checks are free, the second distinct miss gives guided feedback, and Check camp completes exactly once, even with help.
- Layout: check landscape and upright at 768×1024 and a taller view, with caption, guide and shell button clearance. Check Puzzle Peaks paging through the land tests.
- New-game tier: typecheck, unit tests, build for registration and spoken content, and one filtered browser play at level 1. In the browser check the authored wrong board, one hint, a revision and one sticker, and review an upright screenshot. Run `fingerdemo` for the deduction sequence. Write the game page and regenerate the game docs.

Expected implementation includes `src/games/campsite/`, its rule and layout tests, the land registry and generated barrels, a browser case, title voice preparation and the game page.
