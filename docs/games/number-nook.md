# Number Nook

<!-- generated: from src/games/number-nook; edit the text below the end mark (npm run game-docs) -->

**ID:** `number-nook` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, planning, number-order

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Four spaces: one small loop |
| 2 | Six spaces: plan around two rows |
| 3 | Nine spaces: weave rows and columns |
| 4 | Eight spaces: two long rows |

<!-- end generated -->

**Starts as:** tap a numbered tile beside the gap to put a 2 by 2 board in row order

**Grows into:** three untimed steps: 2 by 2, 2 by 3 and 3 by 3, 4 (3–5), 8 (7–9) and 14 slides from the goal; shortest-route Hint, Undo and Start over; touch only

## Design notes

*Touch only · spatial planning and numerical order, after sliding-tile puzzles.* Tap a numbered tile in the empty square's row or column to slide it, and every tile between it and the gap, one cell toward the gap. Arrange the numbers in row order with the gap at bottom-right; the miniature shows the goal, and correctly placed tiles turn green. One solved board finishes through the shell with one sticker, including with help.

Three steps use 2×2, 2×3 and 3×3 boards, drawn from the supplied seed from a pool of boards 3–5 slides from the goal (6 boards), 7–9 (40) and exactly 14 (1,893). The tapped tile glides in 0.15 s with one tap queued, a refused tile nudges toward the gap, a rising bell marks tiles in place (drawn green), and three seeded looks (lantern paper, driftwood, sea glass) vary the board. A Hint tap while a hint shows repeats it without counting again, and after finishing the status shows her slides beside the fewest from the start. Exhaustive reverse search supplies a shortest route from every reachable position, including after exploration; Hint outlines the next tile on that route. Legal slides are free exploration. A line slide glides every moved tile together and counts one slide per tile, so the count matches the fewest-slides line; Undo takes back the whole line. Tapping a tile outside the gap's row and column (a diagonal or other-row tile) gives a gentle boing and a spoken explanation, counts one miss, and after each second miss shows a counted hint. A requested Hint also counts support. Undo and Start over preserve moves, misses and hints while restoring a previous or initial board; they do not themselves add a miss or hint. The how-to card's ghost finger plays through the real taps using the same shortest-route rule. No controller or couch course is built for this slice.
