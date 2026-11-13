# Color Garden

<!-- generated: from src/games/color-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `color-garden` · **Land:** Rainbow Meadow · **Ages:** lap–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** colors, sorting, fine-motor

| Band | Levels, easiest first |
| --- | --- |
| lap | 10, 9 |
| toddler | 9, 1, 2, 3, 4, 5 |
| preschool | 3–8 |
| pre-K | 4–8 |

| Level | Plays like |
| --- | --- |
| 1 | One basket: practice dragging |
| 2 | Sort 6 fruits into 2 colors |
| 3 | Sort 6 fruits into 3 colors |
| 4 | Sort 8 fruits into 4 colors |
| 5 | Sort 10 fruits into 5 colors |
| 6 | Sort 12 fruits, balloons and flowers into 6 colors |
| 7 | Sort 8 balloons and flowers into light blue and dark blue |
| 8 | Sort 8 fruits and balloons by color or by kind, as the sign says |
| 9 | Tap four fruits: each hops to its own color basket |
| 10 | One big fruit: a touch anywhere hops it to its color basket, and the next one grows |

<!-- end generated -->

**Starts as:** tap four fruits into their own two color baskets; lap opens with one big fruit, where a touch anywhere sends it hopping

**Grows into:** lap opens at level 10, one big fruit at a time; six colors with balloons and flowers; light and dark blue; color or kind, by a sign

## Design notes

Level 10, *One big fruit*, is the lap entry (lap order `[10, 9]`; an entry level, so a saved 10 carried into toddler plays 9): one big fruit (1.6×, about 175 units) in the middle of the canopy, and a whole-view layer takes every touch. The fruit hops into its own color's basket with a tick, the color word, then the bell and stars, and the next fruit grows from nothing on that touch. Six fruit, two colors taking turns. After about six quiet seconds the fruit wiggles, and no hint is counted; no misses or hints are possible. The ghost finger touches the grass.

Level 9, *Tap and it hops*, is the toddler entry (lap opened here before level 10): tap any of four fruits in two colors and it hops into its own basket while the pet names the color. Every choice works; no misses or hints are possible. Lap plays only 9; toddler follows 9 → 1 → 2 → 3 → 4 → 5, preserving old saved IDs and pins. Sort fruit, balloons and flowers into baskets by color; level 1 is dragging practice with one basket, growing to six colors. Level 6 mixes fruit (the color's own fruit), balloons and flowers in one round, with all three kinds in every round, so the kind of thing no longer gives the color away. Level 7 (preschool and pre-K) has two blue baskets, a light one and a dark one, and eight balloons and flowers to sort by shade; a wrong basket gets the usual boing and a spoken hint naming the shade, with a glow after two misses. Level 8, *Color or kind* (preschool 3–8, pre-K 4–8; toddler uses 9, then 1–5), sorts eight items made from two rainbow colors, each as a fruit and a balloon. A sign at the top right says the rule for the round, shown as two swatches or as a fruit and a balloon icon: sort by color into two color baskets, or by kind into a fruit basket and a balloon basket (icon on a plain cloth). The rule is random per seed. A wrong basket gets the usual boing and a spoken hint naming the rule (`garden.kind.wrong` for kind), with a glow after two misses.
