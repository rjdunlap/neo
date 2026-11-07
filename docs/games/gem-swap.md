# Gem Swap

<!-- generated: from src/games/gem-swap; edit the text below the end mark (npm run game-docs) -->

**ID:** `gem-swap` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch and controller · **Ghost finger:** yes

**Skills:** spatial-planning, cause-and-effect

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Six gems: one swap clears two lines |
| 2 | Twelve gems: plan two swaps and falling lines |
| 3 | Fifteen gems: plan three swaps through the gaps |
| 4 | Eighteen gems: plan four swaps and cascades |

<!-- end generated -->

**Starts as:** swap occupied neighbours to make matching lines of three and clear a finite tray

**Grows into:** four untimed levels with 6/12/15/18 gems, falling cascades, three seeded board templates per step, exact shortest-route hints, Undo and Restart; couch score is swaps over par; no refill or turn limit

## Design notes

*Touch and controller · after match-three swap puzzles.* Clear a finite tray by swapping two occupied neighbours into horizontal or vertical lines of at least three matching shapes. Colors also have distinct shapes. Lines disappear together, gems fall straight down, and falling lines clear in visible cascades. No gems refill the tray, no turn limit ends it, and an exact shortest route is shown as “best”. One cleared tray is a round and earns one shell sticker.

Four steps use 4×4 trays with 6 and 12 gems (pars 1 and 2), then 5×5 trays with 15 and 18 (pars 3 and 4). Each has three frozen, solver-checked templates; the seeded draw picks one, reflects it left/right and permutes the six shapes/colors. The first step clears two lines with one swap; deeper trays require planning through the gaps and cascades. The finite solver accepts alternative clearing routes. Hint outlines a swap on a shortest route from the current position; if the position has no clearing route, the spoken explanation offers Undo/Restart and Hint restores the original solvable tray.

Tap a gem then its neighbour, or use the D-pad and bottom button; selecting a distant gem changes the selection, tapping the selected gem cancels, and tapping a hole does nothing. A neighbouring swap that makes no line stays put with a gentle boing and spoken explanation and counts as a miss. Two consecutive rejected swaps show one clearing hint; repeated requests while that hint is visible do not count again. Undo restores the last accepted swap or restart, with no miss and without reducing accepted swaps. Restart counts as help and keeps the swap count. Both bots choose from the same solver through real input. On the couch, face-off uses identical seeded trays and compares accepted swaps over the starting par (lower wins); there is no frozen course or saved unfinished tray yet.
