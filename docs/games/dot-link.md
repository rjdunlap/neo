# Dot Link

<!-- generated: from src/games/dot-link; edit the text below the end mark (npm run game-docs) -->

**ID:** `dot-link` · **Land:** Rainbow Meadow · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** colors, fine-motor, counting, planning

| Band | Levels, easiest first |
| --- | --- |
| lap | 12, 1 |
| toddler | 1, 11, 2 |
| preschool | 2–4 |
| pre-K | 3–6 |

| Level | Plays like |
| --- | --- |
| 1 | Tap dots to pop them |
| 2 | Draw a line between two dots of the same color |
| 3 | Pop 8 dots of one color |
| 4 | Make three chains of 4 dots |
| 5 | Close a square to clear a whole color, twice |
| 6 | Make three chains of exactly 5 dots |
| 11 | Find my buddy: link the two wiggling dots |
| 12 | One big dot: a touch anywhere pops it |

<!-- end generated -->

**Starts as:** tap dots to pop them

**Grows into:** join two dots of one color, pop one color, chains of four, close a square, then make chains of exactly five; toddlers can start at level 11, joining the one wiggling pair on a 3×3 board

## Design notes

*After Two Dots and Candy Crush.* Tap dots to pop them, then drag a line through neighboring dots of one color; new dots drop in from the top. Later levels ask for one color, chains of four, and a closed square that clears every dot of that color. Pre-K level 6 asks for exactly five neighboring dots in a line, three times; a shorter, longer or closed line pops but does not count, and gets a gentle reminder. A move that counts always exists. Every color also carries an always-on mark drawn inside its dot (red heart, blue drop, yellow star, green leaf, purple moon), so color is never the only cue; the marks change no rule or level.

**Level 11 (toddler), Find my buddy:** a 3×3 board of two colors where one adjacent same-color pair wiggles from the first second. Draw between them, in either direction or as a longer line through both, and only that pair pops; a new pair lights after the refill. Four buddies finish the round. Any other same-color line shakes, does not pop, boings, says a hint (`dots.buddyhint`) and counts one miss; a cross-color drag does nothing. The wiggle is the level, not a hint, so there is no idle or two-miss hint here and hints stay 0. Toddler plays 1, 11, 2 in that order, with level 11 as the entry for a toddler who has not finished the game; the board scales up to 1.4× so each dot's catch area is about 137 units.
