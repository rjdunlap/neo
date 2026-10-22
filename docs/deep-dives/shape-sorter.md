# Shape Sorter deep dive

*ID `shape-sorter` · bands toddler, preschool, pre-K (a `lap` row sits in its levels table but not in `bands`) · levels 1–8 on 2026-10-18 · session `claude/dive-shape-sorter` ([PR #594](https://github.com/rjdunlap/neo/pull/594))*

Research and ideation only: nothing under `src/` changed. Shape Sorter is the island's shape-posting toy: a wooden box with a face eats the shapes she drags onto its holes. This dive keeps the box and the drag and grows what the holes ask for: a tap rung for the smallest hands, a shape-only rung with two shapes, sizes, turning, and two sorting rules (corners or curves, how many corners) that kindergarten geometry actually uses, plus a wider shape pool so replay is not the same six pieces.

## The game today

**What she does.** Pieces wait in a row on the floor (`src/games/shape-sorter/index.ts`); the box sits above them with its holes in the lid. Picking a piece up ticks and the pet names it ("Circle!"); dropping it within 100 units of a hole (`holeAt`, the nearest hole wins) asks the box. A match snaps to the hole, shrinks away with a clunk, a pentatonic bell step and a star burst; the box gulps and every third piece makes the pet cheer. A miss boings, the box shakes its head, and (at most once every three seconds) the pet says "That's the square hole. Try another one!" A drop far from every hole just floats home (`draggable`'s `floatHome`), silently. When the floor is empty the box bounces and bursts confetti, then `finish`.

**Learning purpose.** Shape matching and naming, then shape properties (corners, points, equal sides), with the fine-motor drag of a shape-posting toy. Skills `shapes`, `fine-motor`, `spatial`; land Rainbow Meadow; music `STYLES.stickers`.

**The ladder** (`PLANS` in `logic.ts`; windows toddler 1–5, preschool 3–7, pre-K 5–8; a `lap: { min: 1, max: 1 }` row that `bands` never lists; no `order` or `entryLevels`):

| Level | Plan | Bands whose window holds it | What she decides |
| --- | --- | --- | --- |
| 1 | one circle hole, 3 circles, coloured rim | toddler (the dead lap row) | Nothing can be wrong: carry a circle to the one hole and let go |
| 2 | circle and square, 4 pieces, coloured rims | toddler | Which of two holes; the rim's colour matches the piece, so colour or shape both answer |
| 3 | circle, square, triangle, 6 pieces, coloured rims | toddler, preschool | Which of three, still colour-coded |
| 4 | four shapes (plus star), 6 pieces, coloured rims | toddler, preschool | Which of four, still colour-coded |
| 5 | four shapes, 6 pieces, plain rims | toddler, preschool, pre-K | The first shape-only match: the rims are wood, so only the piece's outline tells |
| 6 | five shapes (plus heart), 7 pieces, one colour | preschool, pre-K | The same, with the piece's colour removed as a memory cue |
| 7 | all six shapes (plus hexagon), 8 pieces, one colour, tilted | preschool, pre-K | A turned shape is the same shape; the drop sets the rotation to 0 by itself |
| 8 | *The feely bag*: six shapes, six pieces, a spoken property clue | pre-K | Which piece has "no corners", "three corners", "five points", "four equal sides", "six corners", "a curved top and a point at the bottom" |

**Content pools.** Six shape kinds (`SHAPES` in `src/art/shapes.ts`: circle, square, triangle, star, heart, hexagon), each with one fixed colour while colours help (`SHAPE_COLOR`); three one-colour choices (teal, purple, blue). `pieceKinds` deals one piece per hole and fills the rest from the plan's holes, shuffled; the clue level asks for every shape once in a seeded order. The lid lays holes out in rows of up to four (three when there are more than four). Replay varies the shuffle and, at 6–7, the single colour; nothing else.

**Mistakes and help.** A wrong hole is one miss and a head shake; the spoken line names the hole, not the piece. After two wrongs *on the same piece* that piece's hole glows for four seconds (one hint); at level 8 the count is per clue. There is no idle hint. The ghost finger (`autotouch`) carries the next waiting piece to the hole of its kind, or the asked piece at level 8.

**Known gaps** (write-up findings, not fixes):

1. **A lap row with no lap band.** `LEVELS.lap` exists, but `bands` is `['toddler', 'preschool', 'prek']`, so a lap child's home spot never shows the game and the row is dead code. The tracker's band column (TPK) is right; the table is misleading.
2. **Level 1 answers only a lifted piece.** *(closed 2026-10-20, slice 1; see the build note.)* A tap on the box, the floor or the lid does nothing, and a piece let go far from the hole floats home without a word. A one-year-old's first touches land mostly there.
3. **Colour does the work until level 5.** Through level 4 the rim is the piece's colour, so a toddler can finish four levels without looking at outlines; the first shape-only rung is then four shapes and six pieces at once. There is no two-shape shape-only rung, which is where the toddler trajectory starts (Shape Matcher, below).
4. **Hints can never come.** *(closed 2026-10-20, slice 1; see the build note.)* The glow needs two wrongs on one piece; a child who tries a different wrong piece each time collects six misses and no hint, and the three-second throttle makes every second miss silent.
5. **Orientation only, never size.** K.G.A.2 says a shape's name survives its size and its orientation; level 7 varies the tilt and nothing varies the size.
6. **A pool bound to the constant.** *(closed 2026-10-20, slice 1; see the build note.)* Levels 7 and 8 use `holes: SHAPES`, so adding one shape kind to `src/art/shapes.ts` silently widens both levels to seven holes and breaks the lid's three-per-row layout assumptions; any content slice must pin them first.
7. **Replay is a shuffle.** Six shapes, one colour each, three one-colour choices, the same box; a round at level 6 differs from the last by order alone.
8. **Level 8's honest drop bounces.** *(closed 2026-10-20, slice 1; see the build note.)* A square carried to the square hole while the clue asked for the triangle *fits*, but it boings and counts a miss as if it did not; the spoken line ("Listen again…") never says what she did right.
9. **No journal, no couch, no story use**; the sticker is three random shapes.
10. **Person checks never recorded:** whether a one-year-old's drag survives the 40-unit lift (the piece rides above the finger), whether the box's head shake reads as "no" or as "sad", whether "That's the square hole" is heard as a correction or a name.

Couch: none, and none proposed. A pad could move a ring over holes and confirm (Light Lab's pattern), but the pleasure here is the drag and the clunk; a couch version would be a different game.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Fisher-Price Baby's First Blocks](https://www.kohls.com/product/prd-7158229/fisher-price-babys-first-blocks-shape-sorting-toy.jsp) (6 months+) | Physical sorter: a bucket lid with holes, ten blocks | None by itself: a grown-up takes the lid off for dumping, puts it on for posting; the circle is the first a baby manages | The dumping-and-posting pair as a lap rung (a tap that posts, no lid to defeat); the circle first | Nothing |
| [Oombee Cube](https://www.friendsofk.com/products/fat-brain-toys-oombee-cube) (Fat Brain Toys, 10 months+) | Physical sorter with six tethered silicone shapes (triangle, square, oval, circle, pentagon, double circle) | The tethers keep pieces found; each fits one cutout | Oval and pentagon as shapes a sorter can hold early; pieces that never get lost (ours float home) | Nothing |
| [Melissa & Doug Shape Sorting Cube](https://www.schoolspecialty.com/melissa-doug-shape-sorting-cube-024962) (about 2 years+) | Physical sorter, twelve shapes on six faces | Twelve kinds at once, including ones that need turning (rectangle, trapezoid, hexagon) | A wider pool (rectangle, diamond, trapezoid, oval, pentagon); the fact that a square has four ways in and a trapezoid one | Twelve holes on one screen (the lid holds six) |
| [Montessori geometric cabinet, presentation tray](https://montessorimom.com/geometric-cabinet/) | Insets in frames: circle, square, equilateral triangle first, then drawers of circles by size, rectangles, triangles, polygons, curvilinear figures, quadrilaterals | Three shapes in isolation, then one family per drawer varied by one attribute (six circles by diameter; triangles by angle); cards from filled to thick outline to thin outline | The *one family, three sizes* drawer as level 11; the two-finger trace of the edge as an idea for the hint (the glow traces the hole's outline) | Thirty-five insets; the cabinet's silence (ours names and explains) |
| [Busy Shapes](https://www.commonsensemedia.org/app-reviews/busy-shapes) (Edoki Academy, 2+) | Touch: drag a shape to its hole; 112 short levels | More holes, moving holes, obstacles, holes that fit nothing, "transformer" spots that change a piece's shape or colour; no direction and no help; later levels judged luck-like by [one review](https://hbook.com/story/busy-shapes-app-review) | Holes that fit nothing as a later distractor (not proposed here: the box's holes should always be honest); the wordless first level | Obstacles, transformers, puzzle levels whose goal is unclear, the privacy "Warning" rating |
| [Busy Shapes & Colors](https://www.commonsensemedia.org/app-reviews/busy-shapes-colors) (Edoki, 3+) | Three games: shape sorter with extra holes, colour sorter where the fit is right but the colour wrong, a combined one; a "focus" mode on one shape or colour | 150 incremental levels, then shape-and-colour at once | The grown-up's *focus* switch is what our level picker already is; a round that asks for shape **and** colour is Color Garden's *Color or kind*, not this game | A second attribute on the hole (colour is the scaffold here, never the rule) |
| [Perfection](https://en.wikipedia.org/wiki/Perfection_(board_game)) (Lakeside 1973, Hasbro) | Fit 24–26 shapes into a tray before the timer pops them out | A dial for time, two-colour sets, team play | The *many shapes in one tray* feeling at the top (six holes, all one colour, turned); the satisfying "all in" | The timer and the pop, which are the whole game and exactly what the island forbids |
| [Tiggly Shapes](https://www.laptopmag.com/articles/tiggly-helps-toddlers-explore-the-world-through-shapes) (18 months–4) | Physical square, circle, triangle, star on an iPad; apps Safari, Stamp, Draw | Easy mode: the shape touching anywhere counts; hard mode: it must land inside the marked outline; placed shapes become animal parts | The two tolerances as a lesson for level 12 (anywhere near, then lined up); shapes that *become* something (the box could grow a face from the pieces) | Physical pieces; the unlock-by-matching gate at launch |
| [Shape Builder](https://www.commonsensemedia.org/app-reviews/shape-builder-the-preschool-learning-puzzle-game) (Murtha Design, 3–6) | Drag 5–10 pieces onto a silhouette; the picture appears and a therapist's voice names it | 173 puzzles across instruments, fruit, animals, letters, numbers; pieces click in when close | Click-in when close (our `SNAP` already does); the spoken word on completion | Silhouette puzzles are Tangram Town and Puzzle Pals, not this box |
| JumpStart Pre-K, Airport (recalled through the [IDEAS row](../IDEAS.md#jumpstart-title-by-title-2026-10-11); year and details not checked) | Fly through the clouds whose shape **differs** from the dashboard's | The odd one out as a steering target | The *odd one out* idea for a later clue variant ("which one is not a triangle?") | Steering (that row maps it to Duckling Parade) |

**Learning references.** Clements and Sarama's [2D shapes learning trajectory](https://www.learningtrajectories.org/math/learning-trajectories/2d-shapes) puts *Shape Matcher* (same size and orientation; circle, square, typical triangle) at about one to two years, *Shape Recognizer—Typical* (names a circle and square, less often a triangle) at two to three, *Shape Matcher—More shapes, sizes and orientations* at about three, *Shape Recognizer—Circles, Squares and Triangles+* (less typical squares and triangles) at about four, then [*Side Recognizer*](https://www.learningtrajectories.org/math/2d-shapes/side-recognizer) (sides and corners as objects with attributes), the ages read from the trajectory's own pages and summaries. The age placement of Side Recognizer and Shape Identifier was not confirmed. Kindergarten standards [K.G.A.2](https://achievethecore.org/content/upload/K.G.A.2_NWEA.pdf) (name shapes regardless of orientation or overall size) and [K.G.B.4](https://thecorestandards.org/Math/Content/K/G/) (analyze and compare shapes in different sizes and orientations, using informal language about sides, corners and equal lengths) are levels 7, 12, 13 and 14 here. A [child-development summary](https://scienceinsights.org/when-do-babies-learn-to-put-shapes-in-holes/) (one website, typical rather than official) puts the first posting of a circle at twelve to fourteen months and squares and triangles, which need lining up, at eighteen to twenty-four months, which is why a tap rung and a circle-only level open the ladder and turning waits for pre-K.

All references were read through search summaries, store listings and reviews, none played or handled in this session.

## What makes sense here

Shape Sorter's identity is the hungry box and the clunk of a piece going in. Every proposal keeps that and changes only *what the hole asks*: nothing at the lap rung (a tap posts the piece), the outline alone at two shapes for a toddler, then size, then the turn a real sorter needs, then the two attribute sorts kindergarten names (curved or straight sides; how many corners). The trajectory says a one-year-old matches a circle, a two-year-old matches circle and square by outline, a four-year-old sees sides and corners; the current ladder jumps from colour-coded rims to four plain shapes and never reaches sides and corners except through spoken clues at 8. New shape kinds give the one-colour levels real replay and are what the sorting levels need.

Timers and pops (Perfection), obstacles and transformers (Busy Shapes), a second attribute on the hole (Busy Shapes & Colors) and holes that fit nothing stay out: the box's holes are always honest, help always arrives, and colour stays a scaffold that fades, never a rule. Rotating by a two-finger twist stays out too; a tap turns the piece a notch, which a four-year-old can do with one finger.

Rework hooks (proposed, not built): the box is the obvious home for a creature once [PET-INTEGRATION](../rework/PET-INTEGRATION.md) settles casting (a creature's toy chest, or a creature whose mouth is the hole); a shape she posts could be a thing her creature keeps. Neither changes a level here.

## Experience and presentation

**First unsupported action.** At the proposed level 9 a child who touches any piece sees it hop into the box by itself and hears its name; at level 1 a child who lifts the circle anywhere near the hole hears the clunk. Neither needs an adult to supply an answer.

**Touch acknowledgment and consequence.** Pick-up ticks and names; the piece rides above the finger; the drop either clunks, shrinks and rings a pentatonic step while the box gulps and stars burst, or boings and shakes while the piece floats home. The return to readiness is the floor row, which stays where it was so she never hunts for the next piece. Proposed: a drop far from every hole gets a soft "plop" and the box leaning toward it, so a near-miss is answered too.

**A concrete art and sound example (existing tools).** Level 11's three sizes are `shapePath(g, kind, r)` at `r = 32, 48, 64`, the holes at `HOLE_R` 36, 54, 72, laid out by a widened `holeLayout` that spaces by the largest radius; the box's lid is already drawn from `layout.w`. The size name on swallow is `sfx.bell` at three pentatonic steps (low for big, high for little) before the usual clunk, so the sizes have pitches. Level 13's two mouths are a `roundRect` with a round `arc` lip and a `poly` zigzag lip in `wood.line`, each with its own sign (a small circle; a small triangle) drawn with `shapePath`.

**Variety on replay without changing the rule.** The shuffle (today); the one colour drawn from the rainbow rather than three; the holes drawn from a pool of eleven kinds at 6–8 (always including at least one curve and one corner shape); pieces at 0.85–1.15 size at 6–7 so "a little triangle is a triangle"; the clue chosen from two phrasings per shape. The box's face can vary its brow and mouth by seed without any rule change.

**Reasoning versus motor precision.** Matching by outline, size and attribute is the reasoning; the drag's 100-unit snap and the nearest-hole rule keep motor precision low. Level 12's turning is deliberately the one motor-and-mental step, placed at pre-K, with a tap per notch rather than a twist, a tolerance of ±15°, and the piece turning itself after two misses. Reading is never required; the level-8 clues and the proposed level-14 numerals carry dots.

**Supported ending and replay.** Every level ends when the floor is empty; the glow (proposed: after two wrongs in a row anywhere) and the self-turning piece make every round finishable. The celebration's green *again* replays the level and orange plays the next; a toddler who tires can leave mid-round with nothing lost.

**Solo and co-play.** Solo is the design. The co-play card line (name each shape as she lifts it) stands; a proposed role at level 8: a grown-up may say the clue instead of the pet (the card's note), with the game still saying it after a pause so a solo child is never stuck.

**What a person or device still needs to judge.** Whether a one-year-old's finger reaches a piece on the floor row in portrait with the pet in the corner; whether a 40-unit lift makes the piece feel attached or lost; whether the head shake reads as "no"; whether the tap-per-notch turn is understood from the demonstration alone; whether "Too big for that hole" at level 11 is heard as about the piece or about her.

## Proposed ladder

### Fresh content inside existing levels

- **Every touch answers at level 1** (built, slice 1). A tap on the box makes it gulp and giggle (`sfx.giggle` or a short bell run); a tap on the floor wiggles the nearest piece and names it; a drop far from every hole plops and the box leans. No miss, no hint. Part of build slice 1, needed by the lap entry as well.
- **A hint that arrives** (built, slice 1, as a glow on every second miss since the last glow). Glow after two wrongs in a row (any piece), not two on one piece; the rule test asserts that six misses always produce at least one glow. The three-second throttle keeps speech calm but the shake and boing always happen (they do today).
- **Level 8 names what she did** (built, slice 1). A right-shape-but-not-asked drop says "That's the square! We're looking for the one with three corners" (`shape.find.notyet.{kind}` or an argument on the existing line). Whether it should also go in is decision 3; by default it bounces and counts a miss, as today.
- **Pin the pool** (built, slice 1). Levels 7 and 8 use a named `CLASSIC` six-list instead of `SHAPES`, so the shape pool can grow (slice 4) without widening lids; `holeLayout` gets a test that every plan fits a lid above the floor in the four test views.
- **More shapes** (slice 4): `oval`, `rectangle`, `diamond`, `pentagon`, `trapezoid` join `ShapeKind` in `src/art/shapes.ts` (the exhaustive `shapePath` switch gains five cases; the other users call `shapePath` with a literal kind and are unaffected), each with a colour in `SHAPE_COLOR`, a name line, a clue and a hint line for level 8 ("two long sides and two short sides"; "a stretched circle with no corners"; "four corners and four equal sides, standing on a point"; "five corners"; "four sides, two of them slanting"). Levels 6, 7 and 8 draw their holes per seed: 6 takes five from the pool with circle and square always in; 7 and 8 take six with at least one curve and at least two straight-sided kinds. The level-4 and level-5 four stay the classic four. Rule test: every dealt hole kind has clue lines; no level deals more holes than the lid holds; the diamond and the square never share a lid at 5–7 (a turned square *is* a diamond; they meet only at 12, where turning is the point, and 14, where both have four corners).
- **Sizes that do not matter** (slice 4): at levels 6 and 7 each piece is drawn at a seeded 0.85–1.15 scale; the hole takes any size of its kind; the box says "Big or little, a star is a star" once per round when a small and a large piece of one kind both go in. K.G.A.2 content, no decision.
- **A wider one colour:** the one-colour pool becomes the rainbow minus the floor's orange and the lid's tan.
- **The box talks properties** from level 5 up, on a swallow and not every time (one in three, never at level 8, where the clue already says it): "Three corners, yum!" (`shape.fact.{kind}`, one or two lines each). A free fact, not a question.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | *Tap and in it goes* | lap `[9]`; toddler entry (`order [9, 1, 2, 10, 3, 4, 5]`, `entryLevels [9]`) | One circle hole, three circles on the floor; the box smiles and the pet says "Tap a shape!" | Which circle to touch next; a drag to the hole also works | None possible: a tap on a piece arcs it into the hole with "Circle!" and a clunk; a tap on the box gulps; a tap on the floor wiggles the nearest piece; misses and hints stay 0 | Every tap on a piece, the box or the floor is answered; the round finishes after three piece taps from any seed; the bot's `{ tap }` intent lands on a piece | New interaction: a tap path beside the drag (the existing `draggable` must not swallow a short touch, or the game uses `onTap` with a hold threshold), `bands` gains `lap`, lands test for Rainbow Meadow at lap, card step and voice lines, `autotouch` returns a tap |
| 10 | *Round or square* | toddler, between 2 and 3 in its order | Circle and square holes with plain rims; four pieces in their own colours | Which of two holes by outline alone (the rim no longer matches) | A wrong hole boings and names it; glow after two wrongs in a row | Pieces are only circles and squares, both dealt; the plan is `coded: false`; its first-round deal has at least one of each | Plan row, card lines, `describeLevel`, one filtered play; no art or voice |
| 11 | *Big, middle, little* | preschool top (`order [3, 4, 5, 6, 7, 11]`), pre-K (`order [5, 6, 7, 11, 8, 12, 13, 14]`) | One shape kind (circle first), three holes of three sizes in a row, three pieces of matching sizes shuffled | Which hole is the piece's size; the shape is the same so size is the only cue | A big piece on a small hole: "Too big for that one!", boing, miss; a little piece on a big hole: by default (decision 2) "Too little, it would rattle! Find the little hole", miss; glow on the right-size hole after two wrongs in a row | Exactly one hole per size; `holeAt` with sized holes still picks the nearest; pieces and holes have the same multiset of sizes; every kind in the pool draws at three sizes | Logic: a `size` on holes and pieces, `holeLayout` spacing by the largest radius; three pitched bells; voice lines `shape.size.*`; card lines; `fingerdemo` at 11 |
| 12 | *Turn it to fit* | pre-K | Four one-colour pieces arrive turned (square, triangle, hexagon, star; circle joins for contrast on some seeds, heart never); the holes' rims are upright | Tap a piece to turn it 30° a notch, then carry it; a circle needs no turning | A right-shape drop whose angle is off by more than 15° from a symmetric fit sits on the hole and jiggles with "Turn it!" (one miss); after two such misses the piece turns itself to fit (one hint); a wrong hole behaves as today | Symmetric angles: square 90°, triangle 120°, hexagon 60°, star 72°, circle any; a piece turned notch by notch always reaches a fitting angle within a bounded number of taps; the bot taps then drags | New interaction: a tap-to-turn on a draggable piece, orientation on the hole rims, `autotouch` returning `{ tap }` until aligned then `{ drag }`; card and demonstration at 12; a portrait screenshot |
| 13 | *Corners or curves* | pre-K, after 12 (slice 4 first) | Two wide mouths, one round-lipped with a small circle sign, one zigzag-lipped with a small triangle sign; six one-colour pieces from circle, oval, square, triangle, hexagon, star, rectangle, diamond, pentagon, trapezoid (heart never) | Whether the piece has corners or only curves | A curve into the corner mouth: "An oval is all curves, no corners. The round mouth!", boing, miss; glow on the right mouth after two wrongs in a row | Every pool kind classifies unambiguously; both classes are dealt every round; the heart is excluded | Two mouths instead of holes (a second `Box` face layout), voice `shape.attr.*`, card lines, `fingerdemo` at 13 |
| 14 | *Count the corners* | pre-K top by default; school window is decision 1 | Holes labelled 0, 3, 4, 5, 6 with dots and a numeral; seven one-colour pieces: circle, oval (0), triangle (3), square, rectangle, diamond, trapezoid (4), pentagon (5), hexagon (6); the star is left out (five points, ten corners) | Which numbered hole takes the piece: several kinds share a hole, which is the point ("both have four corners") | A wrong count: "A rectangle has four corners, one, two, three, four", boing, miss; the hole's corners light one by one as the hint | `holeFor` maps by corner count; every dealt kind has a hole; at least two kinds share the 4 hole each round; the star never deals | New rule in `logic.ts` (hole by attribute, not kind), dot-and-numeral signs (Animal Snack's), corner-lighting hint art, voice counting lines, card, `fingerdemo` at 14 |

Within a band the levels are played in `order`; IDs never move. Pre-K's proposed order is `[5, 6, 7, 11, 8, 12, 13, 14]`.

### Younger-band openings

**Lap:** level 9 alone (`lap: { min: 9, max: 9, order: [9] }`), with `'lap'` added to `bands` so her home spot and Rainbow Meadow show the game at lap; the lands layout test must still fit Rainbow Meadow at lap with one more game. **Toddler:** `order [9, 1, 2, 10, 3, 4, 5]` with `entryLevels: [9]`, so a toddler who has never played starts at the tap rung and a birthday from lap lands at toddler's start, never "above the top".

### Easier entries and levels between existing ones

Level 10 is the between-level (after the colour-coded two shapes, before the colour-coded three); level 9 is the entry. Both are appended IDs placed by `order`; no saved level or pin is renumbered. No remaining band blocker: Color Garden's `order [9, 1, …]` and `entryLevels: [9]` are the built pattern.

### Left out on purpose

- **A timer or a pop** (Perfection), **lives**, and **holes that fit nothing** (Busy Shapes): the box is honest and nothing is lost.
- **Colour as a second rule on the hole** (Busy Shapes & Colors): that is Color Garden's *Color or kind*; here colour only scaffolds and fades.
- **Obstacles, moving holes and transformers**: the fun is the clunk, not a route.
- **A two-finger twist**: a tap per notch is the one-finger version.
- **A twelve-hole lid**: six is the screen's honest maximum at 100-unit targets; more kinds come from the pool, not from more holes at once.
- **A couch entry** and **journal entries**: no fit yet; a shape journal belongs to the rework's collection, not to this game.
- **Reading**: numerals at 14 carry dots; nothing requires a word.

## Decisions for the developer

Each has a default the build uses; none blocks slices 1–7.

1. **A school window.** Default: none; 14 is pre-K's top. Alternative: `school: { min: 13, max: 14, order: [13, 14] }` so a five-year-old meets the two attribute sorts from Wonder Woods (K.G.B.4 is a kindergarten standard).
2. **Level 11's little piece on a big hole.** Default: it does not go in ("it would rattle"), a miss like the other direction, so size is matched exactly. Alternative: it goes in, as a real sorter would, and when the last piece has only a too-small hole left the box coughs the wrong one back up with "Biggest first!" (a planning puzzle; one extra rule and animation).
3. **Level 8's right shape, wrong clue.** Default: it bounces and counts a miss, with the new line naming what she dropped. Alternative: it goes in (it fits), counts a miss for listening, and the clue queue drops that shape.
4. **The box and her creature.** Default: the wooden box stays. Alternative, after PET-INTEGRATION's casting call: a creature's toy chest, or a creature whose mouth is the hole, with posted shapes kept at home.

## Build slices, in order

**Routine batching (developer, 2026-10-21):** the numbered slices below are scope/dependency substeps. [READY](../READY.md) dispatches related substeps together using the [`shape-sorter` batch plans](../GAME-BATCHES.md#batch-plans): one declared batch per worker/PR, prerequisite substeps first, with existing gates and special checks preserved. Do not create a new session for each numbered level in a claimed batch.

1. **Support truth** (built 2026-10-20, PR #669; existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 8): every touch at level 1 answered (box giggle, floor wiggle, far-drop plop), a glow on every second miss since the last glow (not literally "two in a row": a success-reset streak could pass six misses without a glow), the level-8 line naming the dropped shape, `CLASSIC` pinning 7–8 with a lid-fits test, the how-to note. IDs and windows unchanged. Build note in the [completed-work archive](../archive/COMPLETED-2026-10-09.md#shape-sorter-slice-1-support-truth-2026-10-20).
2. **Level 9 *Tap and in it goes* and the lap band** (built 2026-10-21, PR #738; new interaction tier: typecheck, units including the lands layout at lap, one scripted play of 9 at lap and toddler, one portrait screenshot, `fingerdemo` at 9): `bands` gains `lap`, `lap [9]`, toddler `order [9, 1, 2, 3, 4, 5]`, `entryLevels: [9]`, the tap path, card and voice. Build note in the [completed-work archive](../archive/COMPLETED-2026-10-09.md#shape-sorter-slice-2-level-9-tap-and-in-it-goes-2026-10-21).
3. **Level 10 *Round or square*** (new levels on an existing interaction: typecheck, rule tests, one play of 10, `fingerdemo` at 10): toddler `order [9, 1, 2, 10, 3, 4, 5]`.
4. **More shapes, sizes and colours** (logic tier plus `fingerdemo` at 8 and one play of 6): five new kinds with lines and colours, pool draws at 6–8, sizes at 6–7, the rainbow one colour, the box's property facts. Run `npm run build` (shared `src/art/shapes.ts` changes).
5. **Level 11 *Big, middle, little*** (new levels tier, plus a portrait screenshot for the three-size lid): preschool `order [3, 4, 5, 6, 7, 11]`, pre-K `order [5, 6, 7, 11, 8]`.
6. **Level 12 *Turn it to fit*** (new interaction tier: typecheck, units, one scripted play of 12, one portrait screenshot, `fingerdemo` at 12): pre-K `order [5, 6, 7, 11, 8, 12]`.
7. **Level 13 *Corners or curves*** (new levels tier; after slice 4): pre-K `order […, 12, 13]`.
8. **Level 14 *Count the corners*** (new levels tier; after slice 4): pre-K `order […, 13, 14]`; a school window only if decision 1 says so.

Gated: a school window (decision 1); the creature box (decision 4, and the rework's casting).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`; no code, tests, build, browser or device checks.
