# Inchworm Measure

<!-- generated: from src/games/inchworm; edit the text below the end mark (npm run game-docs) -->

**ID:** `inchworm` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** measuring, length, units, comparing

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1, 2, 7 |
| school | 1, 2, 7, 9, 3, 4, 8, 5, 6, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Lay inchworms end to end along a leaf, and count them |
| 2 | Measure with worms, then pick how many worms long |
| 3 | Measure two things: which is longer, and by how many worms? |
| 4 | Read a ruler, even when the pencil does not start at 0 |
| 5 | Two things on one ruler, starting at different marks: how much longer is one? |
| 6 | Two things end to end on the ruler: how long are they together? |
| 7 | Measure one thing with big worms, then little worms: which number did the little worms make? |
| 8 | The broken ruler: no 0 to start from, so count the spaces it covers |
| 9 | One worm, hop by hop: tap it along, then count the chalk marks |
| 10 | Longer than the ruler: lay a short ruler twice, then add the two parts |

<!-- end generated -->

**Starts as:** lay inchworms end to end along a leaf and count them

**Grows into:** say how many worms long, compare two lengths, read a ruler even when the thing doesn't start at 0, then use the ruler for how much longer one thing is and how long two are end to end, then measure one stick with big worms and with little worms and say which count the little worms made, then (school) read a ruler whose left end is snapped off and count the spaces, not the marks; five fresh things (crayon, carrot, rope, paintbrush, feather) and a sand-pit long jump in one level-3 round, then (school) tap one worm hop by hop along a thing, chalk a tick for each hop and count the hops, then (school) slide a short ruler along a thing longer than the ruler, chalk where it ends, and add the two readings

## Design notes

*After measuring with nonstandard units and classroom rulers.* Drag inchworms from a bucket onto a leaf, pencil, snake or stick; they snap end to end with no gaps or overlaps. Levels: lay worms along a leaf and count them; measure, then pick how many worms long; measure two things and say which is longer and by how many worms; read a ruler, where every other question starts past 0 and the number at the end is offered as the tempting wrong answer; use the ruler to find **how much longer** one of two things is when they start at different marks (the gap between the ends is the tempting wrong answer, and only differs from the true answer when the starts differ; rule-tested); and put **two things end to end** on the ruler and say how long they are together (the mark where all of it stops, or where the first one stops, is the tempting wrong answer). A worm that would hang off the end, or a wrong number, is a gentle miss with a spoken hint (count again; count the spaces; it did not start at 0; count the extra spaces); two misses glow the right number, the thing's end, the ruler spaces it covers, or, for "how much longer", a ring around the extra part of the longer thing.

**Fresh things and the long jump (batch inchworm 1).** Five things join the old ones (crayon, carrot, rope, paintbrush, feather; code-drawn, each with a voice word), and no thing repeats in consecutive rounds (levels 1–7 keep their seeded lengths and starts, pinned by a test). One of level 3's three rounds is a long jump in a sand pit: Bunny's and Duck's jumps run from the take-off board to their footprints, and she measures each with worms (lines `worm.jump`, `worm.jumpmuch`, `worm.pastprints`).

**Level 10, *Longer than the ruler* (school only; school order 1, 2, 7, 9, 3, 4, 8, 5, 6, 10, max 10; pre-K stays 1, 2, 7).** A short ruler (4-6 long, labelled 0 to n) is dragged under a thing from ruler + 1 to 2 x ruler long. First she lays it with 0 at the thing's start; a chalk mark with its number shows where that lay ended; then she lays it again with 0 at the chalk mark. Three pads follow: the whole length, the second part alone and one next to the whole. A drop away from the next place slides the ruler back (no miss). The second part alone is one miss ("That is the second part. Add the first {n}."); the other wrong pad is one miss ("Count the spaces: {n}, then the rest"). Two misses light both parts and ring the chalk mark. Lines `worm.slide`, `worm.slidemark`, `worm.slidehow`, `worm.secondpart`, `worm.firstthenrest`. The how-to demonstration drags the ruler twice, then taps. Same idea as measuring longer than one unit by moving it along and adding.

**Level 9, *One worm, hop by hop* (school only; school order 1, 2, 7, 9, 3, 4, 8, 5, 6, max 9; pre-K stays 1, 2, 7).** Three rounds, lengths 3–8, never the same length or thing twice running. One worm waits with its nose at the thing's start; each tap inches it one worm-length and chalks a white tick at that mark (none at 0). The worm stops by itself at the end, and extra taps do nothing (no miss). Then three pads (the count and two near it) ask how many hops. A wrong pad is one miss ("Count the chalk marks again: one for every hop"); two misses glow the right pad and number the ticks. Right: "The {what} is {n} hops long!" (lines `worm.hop`, `worm.hops`, `worm.hoplong`, `worm.chalk`). The ruler-size pads (74 units, bottom row) are used. The how-to demonstration plays one thing. Same measuring idea as laying many worms, with one worm and its marks left behind.

**Level 8, *The broken ruler* (school only; school order 1, 2, 7, 3, 4, 8, 5, 6, max 8).** The ruler is snapped at 2–5 with a jagged edge and centred; the thing starts at or after the break and ends by 10. The pads are the spaces, the end mark and length + 1 (four distinct answers). The end mark is the tempting wrong answer and its miss line names the break; length + 1 says "Count the spaces, not the marks"; two misses light the spaces. The ghost finger is unchanged.

**Level 7, *Big worms, little worms* (pre-K top; school after level 2).** Four sticks a round. She lays big (orange, double-length) worms on the upper copy of a stick, then little worms on the lower copy, each row's count appearing at its end; then two number pads (in seeded shuffled order) ask which number the little worms made (sticks 3 and 4 sometimes ask the big worms' number). A worm dropped on a full row is refused (one miss, the worm goes home); a drop away from both rows is free; a wrong pad is one miss with a spoken hint that the stick did not change. Two misses on a stick glow the right pad and draw a see-through big worm over the first two little worms. The "Now measure with little worms" instruction waits for the last count to finish. Smaller unit, bigger count; the stick never changes. The how-to card's demonstration measures one stick only (up to nine drags a stick would overrun the finger-demo limit), so it shows a "little" question. Co-play: before the little worms go down, guess together whether their number will be bigger.

**A right answer's line never holds the next measure (U7 fix batch 24, 2026-11-12).** At levels 2–10 the right pad's line starts and the next thing to measure is built at once, the measurement playing over it. Its instruction waits for the line, the guide or her first touch: on the ruler levels a pad tap before the question is heard says it and is not judged; a worm drop, hop or ruler lay stops it being said by itself, though the guide still says it. The last measure's line is heard out before `worm.done`. Level 1 is unchanged.
