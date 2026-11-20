# Domino Pond

<!-- generated: from src/games/domino-pond; edit the text below the end mark (npm run game-docs) -->

**ID:** `domino-pond` · **Land:** Puzzle Peaks · **Ages:** pre-K–grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Count dots, Add pairs, Compare totals

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1 |
| school | 2 |
| grown-up | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Match the dots on both ends of two stepping stones. |
| 2 | Lay stones so each row adds up to its number. |
| 3 | Lay stones so each column meets its comparison sign. |

<!-- end generated -->

**Starts as:** Turn and lay two stepping stones to match the dots on both ends.

**Grows into:** Fill rows to exact totals and build columns that meet fewer-than, equal-to and more-than clues.

## Design notes

- Puzzle Peaks has one round for each supported band. Pre-K matches ordered dot pairs. School makes two row totals and can span rows with a single stone. Grown-ups meet three column clues. The guide reads the grown-up thresholds aloud.
- Select a tray stone, turn it with the curved arrow and tap a marked anchor cell. Tapping either half of a laid stone returns it to the tray. Undo restores the board before the last placement or lift.
- A legal placement with the wrong dots counts a miss on level 1. On levels 2–3 a full board counts a miss only when checked and the first unmet clue lights up. A second check needs a board edit. Out-of-bounds taps, blocked placements and trial moves are free.
- Help and every second miss show a useful placement or highlight a stone to lift. The solver keeps as many existing placements as it can. Any valid full tiling lets the duck cross and earns one sticker.
- All three levels open upright. The smallest targets are 100 logical units, or 50.8 CSS pixels at 390 × 844. The [definition](../definitions/domino-pond.md) records example boards and the generation rules.
