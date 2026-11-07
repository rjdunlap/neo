# Paint Mixer

<!-- generated: from src/games/paint-mixer; edit the text below the end mark (npm run game-docs) -->

**ID:** `paint-mixer` · **Land:** Counting Cove · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** counting, comparing, number-sense, operations

| Band | Levels, easiest first |
| --- | --- |
| school | 1–6 |

| Level | Plays like |
| --- | --- |
| 1 | Copy the row |
| 2 | Twice as much |
| 3 | Fill to the line |
| 4 | Any amount, two ways |
| 5 | Three pots: keep three counts in step to the line |
| 6 | Which jars match: compare ratios from their labels |

<!-- end generated -->

**Starts as:** tap a pot to pour a drop into the bucket until its colour is the sample jar's, the way a recipe scales

**Grows into:** levels 1–6: copy the sample jar's row of drops (1:1, 1:2 or 2:1 of two paints), then make twice as much with two rows, then fill to a dashed line while a ratio table gains a column per complete batch (a stray pot stands with the pair; the pet says "for every 1 red, 2 yellow"), then any whole multiple of one sample and a second, different amount of the same colour, then (5) three pots to the line (red, yellow or blue with white in a three-row table), then (6) which of four lidded jars, labelled with two counts, match the sample; two buckets a round (level 4: two ways), each a different pair (orange, pink, sky blue, purple). Undo, Tip out and Check; tapping the jar says the recipe (free). Only a Check that does not match is a miss (it names the pot with too much or an empty bucket), and the second miss on a bucket glows the next useful control (one hint); one row at level 2 or 3 is "more, the same way" and the same amount again at level 4 is named (neither a miss), a stray drop on Check is a miss naming it; the pause sheet's Show me lights the glow, then pours the rest as a ghost. Level 6 reveals a jar by its lid (the first lid in a case is its one hint; an empty Check is free). A level-5 bucket that matched files one of six paint-shelf colours in the journal (six permanent entries). Levels 7–8, the palette unlock and the Mixing Room not built. Counting Cove

## Design notes

*Levels 1–6 · after the ratio and proportion study; [definition](../definitions/paint-mixer.md).* A sample jar shows a colour and its recipe as a row of drops; four pots (red, yellow, blue, white, each with a shape mark) sit below a bucket. Tap a pot to pour a drop; the bucket's colour is the drop-weighted mean of the pots in linear RGB, so equal ratios are the same colour. The bucket's drop rows show complete copies of the sample's row, outlined missing places and loose drops (wrapped in rows of six). Undo takes back the last drop, Tip out empties the bucket, Check compares; tapping the jar says the recipe (free). A round has two buckets, each a different authored pair (red and yellow orange, red and white pink, blue and white sky blue, red and blue purple; cream is withheld).

Levels (school only, 1–2): 1 "Copy the row": the recipe is 1:1, 1:2 or 2:1 of the pair and the bucket holds one row; 2 "Twice as much": the pool adds 1:3 and the bucket holds two rows, so the sample shows one row and she makes twice the drops of each. One row on Check at level 2 is "more, the same way" and not a miss.

Levels 3–4: 3 "Fill to the line": the pool is 1:2, 2:1, 1:3, 3:1, 2:3 and 3:2 over the four pairs; a dashed fill line at 3 batches (totals 3–4) or 2 (total 5); rows stack bottom-up and a row's places appear when its first drop arrives; a stray pot (one the pair does not use, at a seeded place) stands with the pair; the ratio table (a column per complete batch, k × the sample, emptying when Undo breaks a batch) sits under the recipe row in landscape and right of the jar in portrait; the pet says "For every {a} {potA}, {b} {potB}" at each bucket's start and on a jar tap; one row below the line is "more, the same way, up to the line" (not a miss), and a stray drop on Check is a miss naming it. 4 "Any amount, two ways": one sample and any whole multiple matches (the first way is starred on its table column), the bucket empties itself and asks for a different amount; the same amount again is named, not a miss; a wrong Check names the pot farthest from the nearest unused multiple. Two buckets a round at level 3; two matches end a level 4 round.

Levels 5–6 ([definition](../definitions/paint-mixer-5-6.md)): 5 "Three pots": the sample is three pots (red+yellow+white or red+blue+white, in 1:2:1, 2:1:1 or 1:1:2), the line two or three batches deep (8 or 12 drops), no stray pot, and a three-row table (the jar column rises one table row in landscape, the bucket drops one in portrait); the pet says "for every a, b and c". 6 "Which jars match": a sample jar, its recipe row and a table showing column 1, and four lidded jars each labelled with two counts (matches are k times the base, k 1 to 4; the others are half right, added to or swapped). Tap a jar body to choose it (free); tap its lid (the top 100 by 60) to open it, which shows the label against the table (fills to column k and rings it, circles the second count against column k's number, or circles the first count and shows the first row). Check with the wrong set is one miss naming the leftmost wrong jar; an empty Check is free; the second miss opens the named jar's lid and a glow leads to the next jar to change, then Check. The first lid opened in a case is that case's one hint; a second Help is the supported finish. Two cases a round. A level-5 bucket that matched files its paint in the journal's paint shelf: six permanent entries (peach, coral, blush, lavender, rose, lilac; ids `paint-mixer:<name>`). The palette unlock is not built.

Misses and hints: only a Check that does not match is a miss. It names the pot farthest from the target as too much ("Too much red") or "one more", and an empty bucket says "start with one {pot}". The second miss on a bucket glows the next useful control (the pot of the first missing place, Undo for a loose last drop, Tip out for a buried loose drop, Check when it matches) and counts one hint for that bucket. The pause sheet's Show me lights the glow (one hint) and a second press pours the rest as a ghost, one tap a second, with no extra hint. Nothing is kept; one sticker per round. At levels 3–4 one hint per way; the glow aims at the smallest unused multiple that keeps her rows, and Show me's ghost pour is long enough for a bucket of strays. Not built: levels 5–8 and the Mixing Room.
