# Ferry Jam

<!-- generated: from src/games/ferry-jam; edit the text below the end mark (npm run game-docs) -->

**ID:** `ferry-jam` · **Land:** Puzzle Peaks · **Ages:** pre-K–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** planning, spatial-reasoning, problem-solving, sequencing

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 9, 1, 10, 2, 3, 4 |
| school | 3–8 |

| Level | Plays like |
| --- | --- |
| 1 | A 4 by 4 harbor: move a boat or two out of the ferry's way |
| 2 | A 4 by 4 harbor that takes a few more slides |
| 3 | A 5 by 5 harbor with more boats |
| 4 | A busier 5 by 5 harbor: plan the slides in order |
| 5 | A 6 by 6 harbor |
| 6 | A crowded 6 by 6 harbor: a long way to the dock |
| 7 | Rocks in the harbor: a 5 by 5 with a rock that never moves, so a boat has to wait somewhere else |
| 8 | Two ferries: a 5 by 5 where a yellow ferry leaves by a bottom dock, so one ferry has to go first to free the other |
| 9 | One boat in the way: a 4 by 4 harbor where one slide of one boat lets the ferry out |
| 10 | Who's in the way? Tap the boat in front of the ferry, then slide it and the boat that stops it |

<!-- end generated -->

**Starts as:** drag boats along their lanes in a small harbor so the red ferry can reach the dock; nothing is a mistake, and undo is always there

**Grows into:** bigger harbors (4 by 4, 5 by 5, 6 by 6) that need more slides in a planned order, with a glowing next slide when slides stop getting closer, then (school level 7) rocks that never move, then (level 8) two ferries, red and yellow, that each sail away at their own dock; for pre-K, level 9 (one boat in the way) opens the ladder and level 10 first asks which boat is in the ferry's way

## Design notes

*After ThinkFun's Rush Hour Jr.* Drag boats along their lanes in a small harbor so the red ferry can reach the dock; a boat stops at the next boat or the wall. Harbors grow from small to 4 by 4, 5 by 5 and 6 by 6, needing more slides in a planned order. Nothing is a mistake and the round arrow takes back the last slide. Harbors come from a frozen, solver-checked list, each solvable within its plan's slides. Each harbor has a table of fewest slides from every layout (built while the board is hidden, touch play only); a glowing boat shows the solver's next slide after as many slides in a row as the harbor's fewest (at least 6) without a new best distance, and a fresh trail starts after each hint; undo takes the undone slide off the trail, and key or pad play on the island feeds it too. Harbors fill each plan's range (level 1 has eight of its 21 at 3 slides). School level 7, **Rocks in the harbor** (school range now 3–7; pre-K unchanged 1–4), adds rocks: a rock fills one cell in a row beside the ferry's, never moves, and stops boats like a wall. Fifteen frozen 5 by 5 harbors with 4 or 5 boats need 6 to 9 slides, and each is tested so that taking its rock away shortens the fewest way. Touching or dragging a rock wobbles it with a knock, and the first time each round the pet says what a rock is (`ferry.rock`); that is never a miss or a hint. Level 7 opens with `ferry.start.rocks`; the stuck hint is unchanged, and the couch course and trip stay at levels 3 to 6. School level 8, **Two ferries** (school range now 3–8; pre-K unchanged 1–4), puts a second, upright yellow ferry in a 5 by 5 harbor with its dock below its column, beside the red ferry's dock on the right. A ferry that reaches its dock sails away at once and frees its cells; the harbor is done when both have sailed, and undo is cleared when the first ferry sails. Sixteen frozen harbors with 3 to 5 other boats need 5 to 8 slides (fewest 5, 6, 7 and 8 four each; yellow first in 9, red first in 7); each starts with the ferries in each other's way, and on the fewest way the first to sail is the one that blocked the other. The two-ferry distance table searches backward over kept edges, since a sailed ferry never returns. Nothing is a miss and the stuck hint is unchanged. Level 8 opens with `ferry.both`, and `ferry.one` follows the first sail; keyboard focus skips a sailed ferry. The couch stays at levels 3 to 6 on purpose. Pre-K now runs `[9, 1, 10, 2, 3, 4]` (range 1–10; school stays 3–8, and 9 and 10 are `entryLevels`, so a school landing on either starts at 3). Level 9, **One boat in the way**, is a 4 by 4 harbor with one upright boat across the ferry's row and one other boat; fourteen frozen harbors, two a round, nothing is a mistake, and it opens with `ferry.start.one`. Level 10, **Who's in the way?**, is a 4 by 4 harbor with 2 or 3 boats where exactly one blocker cannot leave the ferry's row in one slide (`blockers`, `clearsInOne`); fourteen frozen harbors (seven at 3 slides, seven at 4), two a round. On every harbor the pet asks first (`ferry.who`) and slides wait: tapping the blocker answers (`ferry.yes`, then `ferry.start` is the repeated instruction); tapping another boat, or touching one to drag it, is a miss with a boing and `ferry.notway`; two misses glow the blocker as one hint; tapping the ferry asks again with no miss. Slides afterwards are free with the usual stuck hint. Keys answer with the highlighted boat; the bot and the ghost finger answer first. In the solver's units (which count the ferry's own final slide) level 9's fewest is 2 and level 10's is 3 or 4. Co-play: one of you slides the boats lying sideways, the other the ones standing up, and talk about which has to go first.

**On the couch (Harbor Rush).** Grown-ups play its 5 by 5 and 6 by 6 harbors (levels 3 to 6) with a controller: the stick moves a highlight to the nearest boat in the direction pushed, the bottom button picks it up and later sets it down, the stick slides a held boat along its lane one cell at a time, and the left button puts a held boat back for nothing (or, with nothing held, takes the last slide back; it stays counted). A boat moved any distance is one slide, counted when it ends somewhere new. The pause menu has **Show a hint** (the solver's next slide; on the couch the automatic hint is off, and a shown hint marks a challenge run as helped) and **Start this harbor again** (slides kept). `boatToward` and `focusPath` in `logic.ts` are the highlight's rules, tested to reach every boat in every harbor of the game. One puzzle-shelf course, **Busy Harbors** (five frozen harbors with fewest slides 8, 10, 12, 16 and 18, par 64), with **Watch the best routes** after a first finish; a trip climbs levels 3 to 6 and a face-off compares slides over the fewest. The round arrow is not drawn on the couch.
