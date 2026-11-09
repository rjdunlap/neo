# Number Nook

<!-- generated: from src/games/number-nook; edit the text below the end mark (npm run game-docs) -->

**ID:** `number-nook` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, planning, number-order

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–7 |

| Level | Plays like |
| --- | --- |
| 1 | Four spaces: one small loop |
| 2 | Six spaces: plan around two rows |
| 3 | Nine spaces: weave rows and columns |
| 4 | Eight spaces: two long rows |
| 5 | Nine spaces: read the new goal |
| 6 | Twelve spaces |
| 7 | The fifteen |

<!-- end generated -->

**Starts as:** tap a numbered tile beside the gap to put a 2 by 2 board in row order

**Grows into:** seven untimed levels, from a 2×2 loop to the classic 4×4 puzzle exactly 30 slides from home, with a 3×3 column-order challenge along the way. Hints and Undo let the player revise the plan.

## Design notes

*Touch only · spatial planning and numerical order, after sliding-tile puzzles.* Tap a numbered tile in the empty square's row or column to slide it, and every tile between it and the gap, one cell toward the gap. Match the miniature, in row order at levels 1–4 and 6–7, and down columns at level 5, with the gap at bottom-right. Correctly placed tiles turn green. One solved board finishes through the shell with one sticker, including with help.

The first four steps use 2×2, 2×3, 3×3 and 2×4 boards, drawn from the supplied seed from a pool of boards 3–5 slides from the goal (6 boards), 7–9 (40), exactly 14 (1,893) and exactly 18 (788, on the 2×4's 20,160 reachable boards). Level 5 returns to 3×3 with the goal `1 4 7 / 2 5 8 / 3 6 _`, exactly 14 slides away; its instruction and how-to ask the player to read down columns. Green tiles, in-place notes, completion, hints and the ghost finger all follow that round's goal. Both 3×3 goals share a 9!-byte permutation-ranked distance array, with parity keeping their reachable positions separate; earlier seeded boards are unchanged. Level 6 returns to row order on a 3×4 board. A seeded 24-slide walk supplies candidates, and iterative-deepening A* verifies their exact starting distance. The same search finds a shortest hint after exploration. The how-to card and spoken instruction suggest placing the top row first, then working in the lower two rows. The four-column boards at levels 4 and 6 have 87-unit cells upright at 768×1024 and 136-unit cells sideways at 1024×768, above the grown-up 64-unit floor.

Level 7 uses a seeded 4×4 board with a verified 30-slide shortest route. If Hint reaches its 60,000-node search limit, it guides the player through the top row, then the left column, then solves the remaining 3×3 exactly. That route keeps completed borders in place. The hint follows the same plan until the player takes a different route, uses Undo or starts over. Its spoken line describes the highlighted tile as a move toward the goal. The level has 87-unit cells upright at 768×1024 and 102-unit cells sideways at 1024×768.

The tapped tile glides in 0.15 s with one tap queued, a refused tile nudges toward the gap, a rising bell marks tiles in place (drawn green), and three seeded looks (lantern paper, driftwood, sea glass) vary the board. A Hint tap while a hint shows repeats it without counting again, and after finishing the status shows her slides beside the fewest from the start. Hints use shortest routes from reverse-search tables at levels 1–5 and exact search at level 6. Legal slides are free exploration. A line slide glides every moved tile together and counts one slide per tile, so the count matches the fewest-slides line; Undo takes back the whole line. Tapping a tile outside the gap's row and column (a diagonal or other-row tile) gives a gentle boing and a spoken explanation, counts one miss, and after each second miss shows a counted hint. A requested Hint also counts support. Undo and Start over preserve moves, misses and hints while restoring a previous or initial board; they do not themselves add a miss or hint. The how-to card's ghost finger plays through the real taps using the same hint rules.
