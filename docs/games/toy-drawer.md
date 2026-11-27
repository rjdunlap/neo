# Toy Drawer

<!-- generated: from src/games/toy-drawer; edit the text below the end mark (npm run game-docs) -->

**ID:** `toy-drawer` · **Land:** Cozy Village · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, area

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–3 |
| school | 2–4 |

| Level | Plays like |
| --- | --- |
| 1 | A roomy 4 × 3 drawer, three toys: put each one somewhere it fits |
| 2 | A snug drawer, four or five toys: moving one makes room for another |
| 3 | The Turn button: a toy has to be turned to fit |
| 4 | Toys already in the drawer, one waiting: take one out and move it to make room |

<!-- end generated -->

**Starts as:** a pretend toy drawer is open and a tray of toys waits beside it (a long train, a big bear, a little ball): she drags each toy in, moves them around to make room, and taps the green check to close the drawer, learning that things of different sizes share a limited space.

**Grows into:** levels 1–3: a roomy 4 × 3 drawer with three toys and spare cells; a snug drawer (4 × 3 or 5 × 3) with four or five toys where the first toy placed can block a later one; then the Turn button, where at least one toy cannot fit unturned in any packing. Level 4, school only: three toys are already in a 4 × 3 or 4 × 4 drawer and the fourth waits in the tray with no place (turned or not), so she takes one out, moves it and fits the newcomer; the hand names the toy to take out, and Start over returns to the opening arrangement (nothing is ever counted as a miss). Later irregular shapes are in the [definition](../definitions/toy-drawer.md).

## Design notes

*Levels 1–3 · [definition](../definitions/toy-drawer.md) · routines and self-care study follow-up.* There is no single right layout: every arrangement that keeps the toys inside the drawer without overlapping is accepted, and spare cells are expected. `logic.ts` holds the rules (cells, toys as rectangles, `legal`, `turnToy`, an exhaustive backtracking `solve` that keeps as many current placements as it can, and `nextHint`); every authored case is proved solvable by the tests, and every level 3 case is proved unsolvable unturned.

**Misses and help.** Nothing is ever a miss: a toy that will not fit slides back with a gentle boing and the full cells flash, and Close drawer pressed early is a spoken nudge. The yellow hand shows a ghost where a toy fits when the layout can still be finished, or pulses the placed toy to take out when the layout blocks completion, never a ghost on a place that cannot be finished. Help counts once per round, however often it is asked for: the hand shows itself after two bounced drops of one toy at level 1 and three at levels 2 and 3. One sticker per round, with or without help; nothing is saved.

**Input.** Drag a toy in (a green footprint shows the nearest legal place within one cell), or tap the toy and then tap the drawer. A toy comes out by dragging it to the tray or tapping it and then tapping the tray. Turn (level 3 only) turns the toy picked up last, in the tray or in the drawer (it keeps its top-left cell, shifts by one cell if it must, and is refused gently if it cannot); Undo reverses any number of moves and Start over empties the drawer.

**Sizes.** The drawer's cells are 120 units, never shrunk. Toys waiting in the tray are drawn smaller (60 units a cell sideways, 70 upright) so a five-toy set fits the narrow sideways tray, but each keeps a touch area of at least 100 units and grows to full size when picked up; the layout test packs every case with every toy turned or not on the upright phone views and the sideways ones. Upright-ready.
