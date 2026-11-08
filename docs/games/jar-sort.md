# Jar Sort

<!-- generated: from src/games/jar-sort; edit the text below the end mark (npm run game-docs) -->

**ID:** `jar-sort` · **Land:** Rainbow Meadow · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** planning, sorting, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1, 2, 9, 3 |
| pre-K | 2, 9, 3, 4, 5 |
| school | 4, 5, 6, 7, 8, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Two kinds, two jars to fill |
| 2 | Two kinds, taller jars |
| 3 | Three kinds, one spare jar |
| 4 | Three kinds, two spare jars |
| 5 | Four kinds |
| 6 | Four kinds, one spare jar: plan ahead |
| 7 | Five kinds |
| 8 | Every fruit has its jar |
| 9 | Three kinds, bright jars |
| 10 | A little jar to park in |

<!-- end generated -->

**Starts as:** tap a jar to lift its top fruit, tap another to drop it; two kinds in three jars, lit jars show where it fits

**Grows into:** taller jars, three to five kinds with spare jars, a little jar that holds only two, a board you must plan ahead, and jars on picture mats where each fruit must reach its own; free undo, three pantry looks, seven fruits, frozen solver-checked boards

## Design notes

*After Water Sort and Ball Sort; [definition](../definitions/jar-sort.md).* Tap a jar to lift its top fruit, then tap another jar to drop it, or drag it from jar to jar. A fruit goes on the same kind or into an empty jar with room, one piece per move; tapping the ground or the lifted jar sets it back. Seven fruits (strawberry, blueberry, orange, pear, plum, cherries, lemon) have distinct silhouettes, so color is never the only cue; a board uses at most five kinds. A code-drawn pantry (wall, window, a shelf with a striped cloth under each row) comes in three seeded looks, morning sun, rain and evening lamp, each with its own lid colour (red, blue, purple). A full one-kind jar gets a lid; finished boards turn to jam and the jars slide off screen. A round of one or two boards ends with one sticker, with or without help. Boards are frozen and solver-checked (level 1 is four authored pairs (each two moves then three; the seed picks a pair); 20 per level from 2; level 6 boards defeat a greedy solver). A free, unlimited undo (the round arrow, bottom right) takes back any move.

Levels: 1 two kinds in three jars; 2 taller jars; 3 three kinds with one spare jar; 9 (placed between 2 and 3) three kinds in four jars of three with the lit target jars back; 4 two spare jars; 5 four kinds; 6 four kinds with one spare jar (plan ahead); 7 five kinds in seven jars (two rows); 8 four jars on picture mats, each fruit's lid only on its own mat ("The pears go in the pear jar"); 10 five jars where the last, little jar holds only two and never takes a lid, so each board needs it as a place to park. Preschool plays 1, 2, 9, 3 in that order, pre-K 2, 9, 3, 4, 5, school 4–8 and 10. Lit target jars show where a lifted fruit fits at levels 1–2 and 9. A child saved at 9 who moves to school lands on level 4 (`entryLevels`).

Misses and hints: a refused move (full jar, or a different fruit on top) springs back with a gentle boing and a spoken reason; it is free at levels 1–2 and 9 and one miss at levels 3–8 and 10 (the little jar says "The little jar holds two."). Every second miss on a board glows the hint move's two jars (one hint). After `max(8, 2 × par)` legal moves with no solution, the hint move glows as well. The hint is found by a state search capped at 200,000 states, falling back to undo. When no move is left, or the search proves there is no way through, the pet says "Stuck! Let's take one back" and the undo arrow pulses; that is never a miss or a hint. Moving fruit anywhere legal, undo and set-downs are never counted. A ghost finger taps along the solver's path (the demonstration plays one board). Touch only; no couch play.
