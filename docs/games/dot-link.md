# Dot Link

<!-- generated: from src/games/dot-link; edit the text below the end mark (npm run game-docs) -->

**ID:** `dot-link` · **Land:** Rainbow Meadow · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** colors, fine-motor, counting, planning

| Band | Levels, easiest first |
| --- | --- |
| lap | 12, 1 |
| toddler | 1, 11, 2 |
| preschool | 2–4 |
| pre-K | 3–9 |
| school | 8–10 |

| Level | Plays like |
| --- | --- |
| 1 | Tap dots to pop them |
| 2 | Draw a line between two dots of the same color |
| 3 | Pop 8 dots of one color |
| 4 | Make three chains of 4 dots |
| 5 | Close a square to clear a whole color, twice |
| 6 | Make three chains of exactly 5 dots |
| 7 | Two colors: pop 6 of one color and 4 of another |
| 8 | Same, different: draw three lines that follow the color pattern |
| 9 | Make ten: lines of dots that add up to exactly 10 |
| 10 | Clear the garden: pop every dot in as few lines as you can |
| 11 | Find my buddy: link the two wiggling dots |
| 12 | One big dot: a touch anywhere pops it |

<!-- end generated -->

**Starts as:** tap dots to pop them; lap opens with one big dot, where a touch anywhere pops it

**Grows into:** join two dots of one color, pop one color, chains of four, close a square, then make chains of exactly five, pop two colors to their own numbers, and draw lines that follow a color pattern (the school window opens at level 8), then build exactly ten from several lines and clear a frozen garden in as few lines as she can; toddlers can start at level 11, joining the one wiggling pair on a 3×3 board; lap opens at level 12, one big dot at a time

## Design notes

*After Two Dots and Candy Crush.* Tap dots to pop them, then drag a line through neighboring dots of one color; new dots drop in from the top. Later levels ask for one color, chains of four, and a closed square that clears every dot of that color. Pre-K level 6 asks for exactly five neighboring dots in a line, three times; a shorter, longer or closed line pops but does not count, and gets a gentle reminder. A move that counts always exists. Every color also carries an always-on mark drawn inside its dot (red heart, blue drop, yellow star, green leaf, purple moon), so color is never the only cue; the marks change no rule or level.

**Level 11 (toddler), Find my buddy:** a 3×3 board of two colors where one adjacent same-color pair wiggles from the first second. Draw between them, in either direction or as a longer line through both, and only that pair pops; a new pair lights after the refill. Four buddies finish the round. Any other same-color line shakes, does not pop, boings, says a hint (`dots.buddyhint`) and counts one miss; a cross-color drag does nothing. The wiggle is the level, not a hint, so there is no idle or two-miss hint here and hints stay 0. Toddler plays 1, 11, 2 in that order, with level 11 as the entry for a toddler who has not finished the game; the board scales up to 1.4× so each dot's catch area is about 137 units.

**Level 12 (lap), One big dot:** a 3×3 board that starts with one big dot (drawn 1.5×) in the middle. The whole view is the touch: the dot nearest the finger pops, a fresh one grows in its place and one more place fills (middle, then sides, then corners); eight pops finish the round, and a touch sparkles under the finger. Nothing can be wrong, waiting counts no hint, and hints stay 0. It is appended as level 12 (IDs 7–10 stay reserved for the dive) and first in lap's order, `[12, 1]`; it is an entry level, so a saved 12 carried into toddler starts at toddler's level 1. Level 1's tap-mode idle bob now clears on the next pop, and the card's goal reads "Pop dots, then link dots of the same color." The voice line is `dots.big`.

**Level 7 (pre-K), Two colors:** a 5×5 board of four colors. A sign at the right names two colors with a number each (6 and 4) and shows a row of little dots per color that fill as hers pop. A line of either named color counts toward its own number, capped at it, so a loop may overshoot; a line of another color pops but counts nothing (one miss, `dots.notthat`), and a line of a color already full pops and counts one miss with `dots.twofull` ("We have enough ... dots"). `dots.two` names the goal and `dots.twonext` says when the first color is done. Two misses glow a line of the color still needed (a hint); `ensureMove` keeps such a line on the board, so every seeded round finishes (300 seeds in the rule test). The how-to card has a level-7 step. It is pre-K's top level, window 3–7; levels 1–6 and the grown-up pins are unchanged.

**Level 8 (pre-K, school), Same, different:** a 5×5 board of three colors with a pictured color pattern (two of the round's colors, A B A B) on a sign: above the board when the view is upright, at its right otherwise. She draws one line through neighbors that follows the pattern in turn, starting on its first color and at least four long (it may keep repeating); while she draws, a pattern line crosses colors and never closes a loop, the sign's dot for the color needed next bobs and the line is colored piece by piece. Any line of two or more pops; one that breaks the pattern, is too short or starts on the second color counts one miss with `dots.follow` ("Follow the colors, starting on red: red, blue, red, blue!"). Three lines finish. Two misses (and twelve idle seconds) glow a real pattern line, and a glow lit before a pop moves to a move on the refilled board in every mode. `ensureMove` paints the sign along a row when none stands (300 seeded rounds finish in three lines, rule test). Reading: a line drawn backward (starting on the second color) is a miss, since the dive makes the first dot's color the decision. Pre-K window 3–8, and level 8 opens the school window (decided 2026-10-14); the how-to card has a level-8 step.

**Level 9 (pre-K, school), Make ten:** a 5×5 board of four colors and a big 10 sign with a ten-frame (above the board when upright, at its right otherwise). Every same-color line adds its dots to the frame, filled in the line's color, with the line being drawn shown faintly ahead; she builds exactly ten from several lines (4 + 3 + 3, 5 + 5, 2 + 8). A line cannot grow past what is left: it stops there and says "Only 3 more!" (one miss per line, and the line still counts); with one left a single dot pops by a tap; loops do not close. Two misses and twelve idle seconds glow `tenLine`, an exact finishing line when the board has one, else the longest that fits (also the demo); a line that counts never lights a second-miss glow and a clean one resets the misses. 300 seeded rounds have a counting line for every remainder 10..1 and finish on exactly ten (rule test). School window 8–9 and a stretch at the top of pre-K (3–9); the how-to card has a level-9 step.

**Level 10 (school), Clear the garden:** a frozen 4×4 board of three colors with no refill: popped dots leave gaps and the dots above fall. She clears every dot in as few lines as she can. A tap pops a single dot and counts as a line, so every board clears and nothing is a failure; a loop (any line that closes on one of its own dots, as `step` allows) pops every dot of that color. Undo (beside a Lines card, which stands above the board when upright and at its right otherwise) takes back a line, free and never a miss. There are 24 boards frozen by `scripts/dot-link-gardens.mjs`: an exact breadth-first solver gives the fewest lines (4 or 5), a player who always draws the line popping the most needs at least two more, and at most 6,000 positions are searched. Misses stay 0; the idle glow (12 s) is the hint, the first line of a fewest route from the board as it stands (Undo is dimmed with no line to take back). After clearing the card shows "N lines / fewest M" with a gold star when they match (`dots.gardenbest` or `dots.gardendone`), never a score. School window 8–10 (pre-K stays 3–9); the how-to card has a level-10 step.
