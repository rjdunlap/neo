# Shape Sorter

<!-- generated: from src/games/shape-sorter; edit the text below the end mark (npm run game-docs) -->

**ID:** `shape-sorter` · **Land:** Rainbow Meadow · **Ages:** lap–pre-K · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** shapes, fine-motor, spatial

| Band | Levels, easiest first |
| --- | --- |
| lap | 9 |
| toddler | 9, 1, 2, 10, 3, 4, 5 |
| preschool | 3, 4, 5, 6, 7, 11 |
| pre-K | 5, 6, 7, 11, 8, 12, 13, 14 |

| Level | Plays like |
| --- | --- |
| 1 | 1 shape, color-matched holes |
| 2 | 2 shapes, color-matched holes |
| 3 | 3 shapes, color-matched holes |
| 4 | 4 shapes, color-matched holes |
| 5 | 4 shapes, plain holes |
| 6 | 5 shapes, all one color, big and little |
| 7 | 6 shapes, all one color, big and little, tilted |
| 8 | hear a shape clue, then find it |
| 9 | tap a shape and it hops in |
| 10 | 2 shapes, plain holes |
| 11 | one shape in three sizes: big, middle, little |
| 12 | tap to turn each shape, then carry it to its upright hole |
| 13 | sort shapes into curves or corners |
| 14 | count corners: 0, 3, 4, 5 or 6; different shapes share a hole |

<!-- end generated -->

**Starts as:** tap a shape and it hops in; one circle hole, every touch answered

**Grows into:** two plain holes, then up to eleven shapes in two sizes, one color, tilted pieces, three sizes of one shape, spoken shape clues, then tap to turn pieces, sort curves/corners and count corners into shared numbered holes

## Design notes

Level 9, *Tap and in it goes*, is the lap and toddler entry: one circle hole and three pieces, each in its own colour; tap a piece (a touch let go quickly, barely moved) and it hops up and over into the hole, or drag it there as before. Every touch answers as at level 1 (box giggle, floor wiggle that names the nearest piece, a far drop plops home); nothing can be wrong, so misses and hints stay 0. Lap plays only 9 as its own branch: one big circle (about 130 units across) waits beside the box and the other two are out of sight; a touch on the floor, wall or box, or any let-go of the circle however long held or far moved, hops it in, and the next circle rolls in from the right edge because she touched and says "circle" (a touch while it rolls makes the box giggle); three circles finish the round and nothing counts as a miss. Toddler's level 9 keeps the three pieces on the floor and follows 9 → 1 → 2 → 3 → 4 → 5, preserving old saved IDs and pins. Level 10, *Round or square*, is a toddler step (toddler order 9 → 1 → 2 → 10 → 3 → 4 → 5): two plain-rimmed holes, a circle and a square, and four pieces in their own colors, so only the outline says which hole. Levels 1–8 grow from one circle hole to six plain holes, one color, and tilted pieces. The pool is eleven shapes (the classic six plus oval, rectangle, diamond, pentagon and trapezoid): level 6 deals five holes per seed with circle and square always in, levels 7 and 8 deal six with at least one curve and two straight-sided kinds; a square and a diamond never share a lid, and at level 8 look-alikes (circle/oval, star/pentagon, diamond/trapezoid) are kept apart so each clue names one shape. At levels 6–7 pieces come a little smaller or bigger (a kind dealt twice comes once of each), any size fits its hole, and once a round the box says "Big or little, a star is a star!" The one color is drawn from seven (the rainbow less orange). On the 2nd, 5th and 8th swallow at levels 5–7 the box adds a free property fact ("Three corners, yum!"). Level 11, *Big, middle, little* (preschool order 3, 4, 5, 6, 7, 11; pre-K 5, 6, 7, 11, 8, 12, 13, 14): one shape in three sizes, three holes in one row, three pieces; a piece goes only in the hole of its size. Too big says "Too big for that one!"; a little piece on a bigger hole says it would rattle; both count a miss, and every second miss glows the right-size hole (one hint). Bells ring by size, little high. At level 1 every touch answers and nothing can be wrong: a tap on the box makes it gulp and giggle, a tap on the floor or the wall wiggles the nearest waiting piece and names it, and a piece let go far from the hole plops while the box leans toward it. From level 2 a wrong hole boings with a head shake and one spoken hint (at most once every three seconds); every second miss since the last glow lights the right hole for four seconds (one hint), whichever pieces were tried. At pre-K level 8, she listens for a shape's properties, such as three corners, and finds that shape among the holes. A shape dropped in its own hole that is not the one asked for is named ("That's the square! We're looking for the shape with three corners"), then bounces back as one miss. Level 12, *Turn it to fit*: four one-color pieces, square, triangle, hexagon and star, with a circle replacing one on some seeds. The corner shapes start turned out of fit; tap to turn 30° in place, then carry to an upright hole. Symmetric turns fit within ±15° (square 90°, triangle 120°, hexagon 60°, star 72°; circle any angle). A right shape at the wrong angle waits at its hole and jiggles with “Turn it!”, one miss; two orientation misses on that piece align it, one hint (the same hint if a glow is also due), and it still needs carrying into the hole. Turning is free. Wrong holes keep their usual return and glow support. Cancellation submits neither a turn nor a drop; a second finger cannot steal the first touch. The demonstration taps until aligned, then drags. Level 13, *Corners or curves*: six one-color pieces go into two wide mouths, round with a circle sign for curves and zigzag with a triangle sign for corners. Both classes appear each round; hearts are excluded because they mix curves and corners. Level 14, *Count the corners*, is pre-K’s top: seven one-color pieces share holes with numerals and dots for 0, 3, 4, 5 and 6. At least two different four-corner kinds share the 4 hole each round. Circles and ovals have zero; stars (ten corners) and hearts are excluded. A wrong target sends the piece home, boings and names its property or counts its corners; every second miss lights its target (one hint). The lit count target’s dots brighten in order, repeating during the four-second glow; zero pulses without dots. The ghost finger uses the same attribute rule to choose its target. Pre-K order is `[5, 6, 7, 11, 8, 12, 13, 14]`; school remains excluded.
