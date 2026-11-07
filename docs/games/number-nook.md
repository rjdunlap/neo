# Number Nook

<!-- generated: from src/games/number-nook; edit the text below the end mark (npm run game-docs) -->

**ID:** `number-nook` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, planning, number-order

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Four spaces: one small loop |
| 2 | Six spaces: plan around two rows |
| 3 | Nine spaces: weave rows and columns |

<!-- end generated -->

**Starts as:** tap a numbered tile beside the gap to put a 2 by 2 board in row order

**Grows into:** three untimed steps: 2 by 2, 2 by 3 and 3 by 3, exactly 4/8/14 slides from the goal; shortest-route Hint, Undo and Start over; touch only

## Design notes

*Touch only · spatial planning and numerical order, after sliding-tile puzzles.* Tap a numbered tile beside the empty square to slide it into the gap. Arrange the numbers in row order with the gap at bottom-right; the miniature shows the goal, and correctly placed tiles turn green. One solved board finishes through the shell with one sticker, including with help.

Three steps use 2×2, 2×3 and 3×3 boards, drawn from the supplied seed at exactly 4, 8 and 14 slides from the goal. Exhaustive reverse search supplies a shortest route from every reachable position, including after exploration; Hint outlines the next tile on that route. Legal slides are free exploration. Tapping a tile that is not beside the gap gives a gentle boing and a spoken explanation, counts one miss, and after each second miss shows a counted hint. A requested Hint also counts support. Undo and Start over preserve moves, misses and hints while restoring a previous or initial board; they do not themselves add a miss or hint. The how-to card's ghost finger plays through the real taps using the same shortest-route rule. No controller or couch course is built for this slice.
