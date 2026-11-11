# Number Trails

<!-- generated: from src/games/number-trails; edit the text below the end mark (npm run game-docs) -->

**ID:** `number-trails` · **Land:** Counting Cove · **Ages:** preschool–pre-K · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** numerals, counting, fine-motor, writing

| Band | Levels, easiest first |
| --- | --- |
| preschool | 4, 1, 2 |
| pre-K | 2, 3, 5 |

| Level | Plays like |
| --- | --- |
| 1 | Trace 1 to 5, then watch that many appear and count them |
| 2 | Trace 0 to 9, then watch that many appear and count them |
| 3 | Trace 0 to 9, then tap to wake exactly that many from a bigger group |
| 4 | First numbers: trace 1, 2, 3 or 7 in one stroke, then watch that many appear |
| 5 | Write how many: count a group of 0 to 9, tap the numeral that tells how many, then trace it |

<!-- end generated -->

**Starts as:** follow a firefly along a numeral, starting at the green ring and arrow (at preschool, *First numbers*: just 1, 2, 3 or 7), then watch that many things pop up and count them

**Grows into:** numerals 1 to 5 (level 1), then 0 to 9, then tap to wake exactly that many from a bigger group of sleepers, then (level 5, *Write how many*) count a group first, pick the numeral card that tells how many and trace it

## Design notes

*After Letter Trails and the numeral-formation charts of the common handwriting programmes.* Follow the firefly along a numeral from the green ring, in the direction of the arrow; a numeral of two parts (4, 5, 9) takes two touches. Wandering off the corridor is a gentle miss (boing, a spoken "come back to the firefly") and a glow after two on one stroke. When the numeral is done, that many things (one of eight kinds: duck, apple, star, orange, lemon, pear, flower or shell, one kind a round) pop up one at a time, in rows, two rows, pairs or a ring, and are counted aloud, "that is 4 stars!". Level 4, *First numbers*, is the preschool start: only 1, 2, 3 and 7, each a single stroke from the top, on level 1's wide 0.1 trail, and the things appear by themselves (no waking); a saved 4 lands on pre-K's first level (2) after a birthday. Level 1 draws 1 to 5, level 2 all of 0 to 9 (zero ends with "there are none", no things); at level 3 the things are asleep, three more than the numeral, and she taps them awake and counts; the round ends by itself at the numeral, so the rest stay asleep and nothing she taps is a miss. Level 5, *Write how many* (pre-K, after 3), turns the round around: a group of 0 to 9 things waits under a "?" (zero is an empty pail), she taps each to count it aloud (a small number marks each; counting taps are never wrong), then three numeral cards appear along the bottom, right of the corner guide: the count, a neighbour (one more or one less) and a digit children often write backwards (`cardsFor`, drawn after the round so a seed keeps it). A wrong card is one miss: a boing, and the pet counts the group again ("that is 3 apples!", or "zero" for the pail); the second wrong card on the round glows the right one and counts one hint. The right card hides the group and the usual trace begins; when the numeral is written, the group comes back beside it. A stuck stroke (two wanders) sends the firefly flying the next stretch of trail by itself, leaving dots, and the ring still lights; the ink is one of four seeded looks (teal, rainbow, gold glitter, sand) and a rising marimba climbs one step per fifth of a stroke. It shares Letter Trails' stroke tracer (`advanceTrace`, `sampleStroke`, `traceWaypoints`); the digit table is `digits.ts`. **The stroke forms are an interim convention (simple common forms, every stroke starting at the top), not yet checked against Handwriting Without Tears' printed chart:** the convention was decided 2026-10-23 (Handwriting Without Tears; a building session checks the digits against its chart, not yet done; see [Letter Trails decisions](../deep-dives/letter-trails.md#decisions-for-the-developer)). The [deep dive](../deep-dives/number-trails.md) plans the next slices.
