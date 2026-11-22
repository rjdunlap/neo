# Garden Rows level 11 — The bee counts tall flowers

Defined 2026-11-22 for puzzle-pages PP4. One school touch level in the existing Puzzle Peaks game (`garden-rows`), after Hedge boxes. Append ID 11 and give school the explicit order `[3, 4, 5, 6, 7, 8, 9, 11]`. ID 10 belongs to the preschool opening. The later Two-flower beds proposal can take a fresh ID when defined.

## What she does

Choose a short, medium or tall flower packet, then tap a soil square. Plant one of each height in each row and column. The bee can stop at any gate and look straight along its row or column. A flower is visible from the gate if it is taller than every flower before it. Each gate shows how many the bee wants to see. The same line can look different from its other end. This is a spatial deduction with the familiar Garden Rows planting action. The [Robertson Program's Skyscrapers lesson](https://www.oise.utoronto.ca/robertson/lesson-plans/skyscrapers) uses cube stacks and opposite views for the same comparison.

In the level-specific how-to, start with a separate three-spot strip. From the left, show medium, short, tall. The bee sees medium and tall. Move the bee to the other end so the tall one hides both smaller flowers. Let her replay this freely. In the round, tap a gate to highlight its line from the near end and hear its goal (“From here I want to see two flowers”). A small side view places blossoms at three distinct heights, with stalks and shared ground. Trace the visible tops and dim the hidden ones. In an incomplete line show empty spots as gaps and omit the seen total until every spot is planted. The printed gate number and spoken goal always describe the target.

## One bed per round

The first seed uses one of these two authored boards, picked with the scene RNG. No board timer or rotation of the rules. A seed holds its board, clues and given throughout the round. Each of the twelve gate clues is present from the start.

| Board | Finished rows, top to bottom | Fixed flower | Top | Bottom | Left | Right |
| --- | --- | --- | --- | --- | --- | --- |
| A | `123 / 231 / 312` | Row 2, column 1 is medium | 3, 2, 1 | 1, 2, 2 | 3, 2, 1 | 1, 2, 2 |
| B | `132 / 213 / 321` | Row 2, column 2 is short | 3, 1, 2 | 1, 2, 2 | 2, 2, 1 | 2, 1, 3 |

Heights are 1, 2 and 3. Top and bottom clues are listed left to right. Left and right clues are listed top to bottom. Walk from each active gate inward to count. Each board has one solution among the 12 possible 3×3 Latin squares with its fixed flower and all clues. Recompute the visible counts on the player's bed when checking. Keep clue order and the gate-to-line mapping in pure logic so the same traversal drives the explanation and the rule.

A tap on a planted editable spot lifts that flower, as in Garden Rows. Mark the fixed flower with the same visual treatment as existing givens. Reject a repeated height in the row or column with the existing gentle clash response and count one miss. Taps on givens, removal, packet selection, gate inspection and replay are free. Let a locally legal planting stand until she chooses to revise it. Enable **Ask the bee** when the bed is full. A check with mismatched clues focuses the first failing gate in top, bottom, left, right order and explains the difference (“I can see one. This gate asks for two”). Count one miss for that rejected arrangement. Rechecking the same arrangement gives the explanation without another miss, including if she lifts and replants the same flowers. The attempt history is round-local. The first valid check flies the bee around the bed and finishes one round through `ctx.finish`, with one sticker.

## Hints and revision

After two counted misses, glow the relevant gate and show one next action. A requested help through the guide can show the same action before any miss. Count each newly shown action once per hint activation. Replaying the visible hint or tapping its gate only repeats the explanation. Keep the action stable until its target is acted on or a board edit invalidates it.

Start each draft with a gate marked three whose line has no given, the left gate of row 1 on board A or the top gate of column 1 on board B. Point out that the nearest flower must be short so all three can be seen. Work along that increasing line one spot at a time, then continue with missing heights in rows and columns. A gate marked one can also explain a forced tall flower in its nearest spot. Select steps against the unique solution of the actual givens and clues. If any editable flower differs from that solution, prompt her to lift the first one, scanning the teaching line from its gate and then the rest in row-major order. Otherwise plant the first blank in that same order. After the teaching line, explain a missing height in the row or column when forced there, or use a gate whose two clue counts and existing plants narrow the possible orders. When a single line leaves more than one order, show the crossing line as well. Correct plants stay in place, and following the sequence reaches a valid board from every legal partial bed.

## Phone layout and build proof

Keep the bed centred and all four ranks of gates aligned with their rows or columns. Allow a 500-logical-unit square for the three 100-unit cells and a 100-unit gate lane on each side. Leave the four corners free of hits. Put the three height packets, Ask the bee and side view below on upright phones, with Ask the bee alongside the side view only where each has enough width. Give each gate, cell, packet and Ask the bee at least 100 logical units of touch area, clear of Home, Help, guide and captions. In landscape, put the packets, check and preview beside the bed, use the caption-adjusted view and check the left-side caption clearance. A rotation preserves the selected packet, open gate, hint, board and accounting. The garden, selected gate and visible flower tops remain distinguishable without colour alone.

Use the existing Garden Rows planting and lift interactions, shell completion and seeded round setup. Add the level-scoped spoken lines, how-to and ghost finger in that game's folder. The demo opens a gate, shows why one flower is hidden, then plants from a gate-three deduction and finishes with Ask the bee. Co-play can build a line of three stacks and count the tops from both ends.

- Rule tests cover all 12 Latin squares for each authored board, edge orientation, the two directions of one line, incomplete and complete checks, uniqueness, repeat-check accounting, and convergence of lift/plant hints from legal partial beds. Preserve existing levels and assert school progresses from 9 to 11 while preschool still starts at 10.
- Typecheck and unit tests, including Garden Rows upright targets for every supported phone view and the rotated caption layout. Add one filtered `gardenrows` level-11 play on board A (use board B’s full grid for a legal planting that fails the gate check) with a wrong full bed, repeated check, one hint, revision, rotation and one sticker. Inspect one short upright screenshot with the side view showing and run `fingerdemo` filtered to Garden Rows 11. Build if shared files or assets change.
