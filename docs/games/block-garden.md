# Block Garden

<!-- generated: from src/games/block-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `block-garden` · **Land:** Rainbow Meadow · **Ages:** pre-K–grown-up · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, shape-composition, planning

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1, 2, 9, 3 |
| school | 2, 9, 3, 4, 5, 10, 6, 11 |
| grown-up | 5, 10, 6, 7, 8, 11, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Finish one row |
| 2 | Rows and columns |
| 3 | Two lines with one piece |
| 4 | Pick the right pieces |
| 5 | Make room first |
| 6 | Two trays |
| 7 | The big garden |
| 8 | Clear the whole garden |
| 9 | Corner with stripes |
| 10 | See what comes next |
| 11 | Mind the snail |
| 12 | Mind the snails |

<!-- end generated -->

**Starts as:** drag shaped seed pieces onto a garden bed; a full row or column blooms and empties, until every bud blooms; a faint shadow shows where a piece will land

**Grows into:** a bud on a line that needs two rows, then crossings, a corner gap and a decoy, then the corner gap again with stripes (level 9, a gentle step before level 3 for pre-K), then a look at the next tray before the two-tray level (level 10), then a snail whose stone a line must not empty (level 11), then big frozen gardens with two snails (level 12 for grown-ups) and big frozen gardens where level 8 empties the whole bed; free undo, solver-checked gardens, no rotation

## Design notes

*After Block Blast and 1010!, calm and finite; [definition](../definitions/block-garden.md).* Drag a shaped seed piece from the tray onto the garden bed (a faint shadow follows the lifted piece and shows where it would land). A row or column planted all the way across blooms and empties, which opens room for the next piece; every bud on the bed has to bloom, and level 8 empties the whole bed. Nothing falls, nothing is timed, and pieces are never rotated. Every garden is solvable and par is its shortest planting. Levels 1–4 are built at runtime from templates (one straight gap; a crossing row and column each one domino short; a corner-shaped crossing gap with an optional third row that can only bloom after the column empties; two rows with straight gaps plus a decoy), each checked by the solver, with an authored fallback. Levels 5–8 are 14 frozen, solver-checked gardens each (block templates; level 5 has a two-row piece that fits nowhere until the row above blooms). A round shows its garden under one of the square's eight symmetries. A round ends with one sticker, with or without help. A free, unlimited undo takes back any planting; Start again is in the pause sheet.

Levels: 1–2 tinted bud lines show which line a piece completes; 9 is level 3's corner gardens (same generator and filter) with those stripes on and refused drops free, placed between 2 and 3 (pre-K `[1, 2, 9, 3]`, school `[2, 9, 3, 4, 5, 10, 6]`, `entryLevels: [9]` so a grown-up still lands at 5); 10 is level 6's two trays and six pieces with the next tray drawn faded in cards instead of packets (a tap on one says it comes next, never a miss), placed between 5 and 6 (grown-up `[5, 10, 6, 7, 8]`); 3 two lines at once; 4–8 bigger beds with more pieces, level 8 emptying the bed. Pre-K plays 1–3, school 2–10, grown-up 5–10. Squares are 100 units at levels 1–6 and 72 at 7–8 (grown-up only).

Misses and hints: a refused drop (a shape where it cannot fit) springs back with a gentle boing and a spoken reason; it is free at levels 1–2 and one miss from level 3. Every second miss glows the hint planting (one hint), and after `max(4, 2 × par)` plantings with no solution the hint glows as well. While she follows the stored solution the hint reads it directly; off the plan it runs a bounded search (`SEARCH_CAP` 30,000 generated states) and, past the cap, steps back to her latest state on the stored solution. After each planting a 4,000-state search looks for a dead end; "Stuck! Let's take one back" pulses the undo arrow and is never a miss or a hint. Touch only; no couch play.

Looks and flowers: each round draws one of four looks, chosen with the seeded RNG after the garden so a look never changes a garden. Morning is the original; autumn has a woven-fence rim, moss-capped stones, orange buds and leaf-coloured confetti with leaves flying to the basket; rain has a blue rim, shining stones, blue buds and droplet bursts; evening has a purple rim, fireflies, darker soil, purple buds, a lantern glow on woken buds and a marimba run an octave lower. Buds bloom into one of four flower kinds (poppy, tulip, daisy, sunflower) by bud place (`flowerAt`), and woken flowers stay peeking out of the basket (the newest 7). Levels 5–8 now have 24 frozen gardens each (the first 14 unchanged), and levels 1–2 rounds are three gardens instead of two.
