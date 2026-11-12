# Cut Along

<!-- generated: from src/games/cut-along; edit the text below the end mark (npm run game-docs) -->

**ID:** `cut-along` · **Land:** Painted Canyon · **Ages:** toddler–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fine-motor, shapes, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2–5 |
| pre-K | 4, 5, 6, 7, 11 |
| school | 6–11 |

| Level | Plays like |
| --- | --- |
| 1 | Snip, snip: tap each thick mark to snip a fringe |
| 2 | Cut the ribbon: one thick straight line |
| 3 | Straight across: longer lines, level and slanted |
| 4 | Zigzag and waves: lines that turn corners and bend |
| 5 | Curves and a circle, cut either way round |
| 6 | Corners: three of a square, a triangle, a door and a kite |
| 7 | Picture shapes: three of heart, house, leaf, fish, cloud, star and moon |
| 8 | The piece that fits: choose the outline for the gap, then cut it |
| 9 | Round and round: spirals for a snail, a snake and a curly tail |
| 10 | Cut it in two: choose the line that makes the two pieces the picture needs, then cut it edge to edge |
| 11 | My own picture: choose a shape to cut, then put it anywhere in the picture |

<!-- end generated -->

**Starts as:** tap each thick mark and a pair of big scissors snips it, or put the scissors on the green ring and move them along a dashed line, and the cut piece floats into the host's paper picture

**Grows into:** one thick straight line, longer lines, zigzags and waves, curves and a circle (either way round), a square, triangle, door and kite, then heart, house, leaf, fish, cloud, star and moon outlines, choosing which outline fits a gap, then spirals (a snail's shell, a snake, and a cat's curly tail or a snake turning the other way), then choosing which line cuts a sheet into the pair a picture needs; each play of levels 1–5 and 7 picks one of a few pictures (hedgehog, gift, raft, river, night, garland); a drag that leaves the line stops the scissors with a boing, no clock

## Design notes

*After paediatric scissor-skill progressions and Dexteria Jr.; [definition](../definitions/cut-along.md).* Big round-tipped scissors snip along a dashed line on bright paper, and the finished piece floats into the host's paper picture. The cut is a trace: she puts the scissors on the green ring at the paper's edge and moves them along the line with Letter Trails' tracer (`sampleStroke`, `advanceTrace`, `offTrail`), a note climbing with each checkpoint; nothing moves on its own and there is no clock. Levels: 1 Snip, snip (tap each thick mark; any touch near it snips, and the level never misses), 2 Cut the ribbon (one thick straight line), 3 Straight across (longer, level and slanted lines), 4 Zigzag and waves, 5 Curves and a circle, 6 Corners (a square and a triangle), 7 Picture shapes (heart, house, leaf, fish or cloud), 8 The piece that fits (two or three outlines are offered for a gap in the picture; choose one, then cut it), 9 Round and round (a straight lead-in up from the paper's bottom edge into a spiral: a snail's shell of 1½ turns, a snake of 2 turns, then by seed a cat's tail of 1 turn or a second snake mirrored to turn the other way; turns are 0.17 of the paper apart and the corridor stays 0.072, so a straight swipe can never cut across to the next turn in; its one picture, a garden, shows a snail, flowers, a path and, when the tail is wanted, a cat), 10 Cut it in two (a sheet with two or three crossing lines, each with a ring at both ends; choose the line whose cut leaves the pair the picture needs: two triangles for sails, two squares for windows or two strips for fence boards; a line that makes the wrong pair is one miss, closes its slit and gets a spoken hint, two misses glow the right line; the picture is a house, two boats and a fence, and both halves fly into its two gaps), 11 My own picture (three small filled tiles show three of level 7's shapes; a tap on a tile chooses it and a tap between tiles chooses nothing, neither a miss; the chosen shape is cut at level 7's size, either way round, and the piece then lifts so she can carry it anywhere into an empty sky-and-ground picture; a drop is kept where she let go, clamped so the whole piece shows, and a drop off the picture floats to the middle; three pieces end the round; the picture is the biggest up to 280 units that keeps the paper at least 420, about 244 on a landscape iPad) A closed shape can be cut either way round: the way is chosen only once the cut has clearly left the joint (more than 1.5 corridor half-widths), because a pixel of sideways wobble on the lead-in once picked a way before the finger had. Toddler 1–2, preschool 2–5, pre-K 4–7 then 11 (`order` 4, 5, 6, 7, 11), school 6–11; no lap level. A miss is a drag from the scissors that leaves the corridor (levels 3–11, one per drag; the scissors wait where they stopped, a boing, and the pet says it, and progress is kept); at level 8 it is also cutting a fifth of an outline that does not fit, and at level 10 cutting a fifth into a line that makes the wrong pair (one miss per outline or line: it stops, the pet says what differs and the slit closes). Levels 1–2 never miss. Every second miss lights the next 12 checkpoints and a paper bee flies them on lift (levels 3–7, 9, 10 and 11); at level 11 choosing and carrying never miss, and the pause sheet's hint only repeats the instruction there, or glows the fitting outline (level 8); each glow is one hint, and the pause sheet's "Show a hint" gives the same. Fit and corridor are at least 30 units in the four standard views; level 1 marks are at least 110×140 with no overlap. The ghost-finger route is thinned to the corners plus a point about every 0.15 paper units. One sticker per round; the collage (level 11's included) is not saved, there is no couch play, and the music is the land's `STYLES.paint`. Off-screen: child-safe scissors with a grown-up beside her, a fringe along a paper strip, then a fat straight line.

**A finished piece never holds the next sheet (U7 fix batch 6, 2026-11-12).** At every level the piece's line starts as it lands in the picture and the next sheet opens at once; the sheet's instruction is said when the line ends, or at her first touch, hint or picture tap (level 11's placed piece the same). The last piece's line is heard out before the closing line.
