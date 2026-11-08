# Gem Swap

<!-- generated: from src/games/gem-swap; edit the text below the end mark (npm run game-docs) -->

**ID:** `gem-swap` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** space · **Plays by:** touch and controller · **Ghost finger:** yes

**Skills:** spatial-planning, cause-and-effect

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–8 |

| Level | Plays like |
| --- | --- |
| 1 | Six gems: one swap clears two lines |
| 2 | Twelve gems: plan two swaps and falling lines |
| 3 | Fifteen gems: plan three swaps through the gaps |
| 4 | Eighteen gems: plan four swaps and cascades |
| 5 | Twenty-four gems: plan five swaps on a six-by-six tray |
| 6 | One swap, a long line: find the swap that clears four or more |
| 7 | Stones that stay: gems above a grey stone rest on it |
| 8 | Iced gems: clear a line beside an iced gem to thaw it |

<!-- end generated -->

**Starts as:** swap occupied neighbours to make matching lines of three and clear a finite tray

**Grows into:** seven untimed levels with 6/12/15/18/24 gems (level 5 on a 6×6 tray), a level 6 of one swap with a long line, and a level 7 where grey stones stay put and gems rest on them, falling cascades, 20 solver-checked trays per step, three seeded looks, exact shortest-route hints, Undo and Restart; couch score is swaps over par; no refill or turn limit

## Design notes

*Stones (level 7).* A grey stone never moves, clears or swaps; it is a floor that splits its column, so gems above it rest on it and gems below fall separately. Tapping a stone ticks, says the stone line once until the next swap, keeps the selection, and is not a miss or a hint. Levels 1–6 have no stones and fall exactly as before.

*Touch and controller · after match-three swap puzzles.* Clear a finite tray by swapping two occupied neighbours into horizontal or vertical lines of at least three matching shapes. Colors also have distinct shapes. Lines disappear together, gems fall straight down, and falling lines clear in visible cascades. No gems refill the tray, no turn limit ends it, and an exact shortest route is shown as “best”. One cleared tray is a round and earns one shell sticker.

Each round also draws a look (lantern night, autumn, first snow). Cleared gems pulse, survivors fall to their landing row with a small squash, and cascade waves pop on rising pentatonic steps. Four steps use 4×4 trays with 6 and 12 gems (pars 1 and 2), then 5×5 trays with 15 and 18 (pars 3 and 4). Each has 20 frozen, solver-checked trays (three hand-made, 17 built backwards by `scripts/gem-swap-trays.mjs`, with a dead-end first swap and a falling line at steps 2–4); the seeded draw picks one, reflects it left/right and permutes the six shapes/colors. The first step clears two lines with one swap; deeper trays require planning through the gaps and cascades. The finite solver accepts alternative clearing routes. Hint outlines a swap on a shortest route from the current position; if the position has no clearing route, the spoken explanation offers Undo/Restart and Hint restores the original solvable tray.

Tap a gem then its neighbour, or use the D-pad and bottom button; selecting a distant gem changes the selection, tapping the selected gem cancels, and tapping a hole does nothing. A neighbouring swap that makes no line stays put with a gentle boing and spoken explanation and counts as a miss. Two consecutive rejected swaps show one clearing hint; repeated requests while that hint is visible do not count again. Undo restores the last accepted swap or restart, with no miss and without reducing accepted swaps. Restart counts as help and keeps the swap count. Both bots choose from the same solver through real input. On the couch, face-off uses identical seeded trays and compares accepted swaps over the starting par (lower wins); there is no frozen course or saved unfinished tray yet.
