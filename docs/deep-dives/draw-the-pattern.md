# Draw the Pattern deep dive

*ID `draw-the-pattern` · bands lap, toddler, preschool, pre-K · levels 1–9 on 2026-11-06 · session `claude/dive-draw-the-pattern` ([PR #1276](https://github.com/rjdunlap/neo/pull/1276))*

## The game today

A long paper strip lies across the screen. The pet's crayon draws the start of a line or pattern by itself, then she carries it on from a green ring with Letter Trails' tracer (`sampleStroke`, `advanceTrace`, `offTrail`). Her note climbs with each checkpoint, nothing is timed, and each finished strip rolls up and becomes part of a crayon picture. The learning purpose is the pre-writing strokes in the order they develop (lines, zigzag and wave, circle and loops, cross, square and triangle), continuing a stroke from memory (5), and continuing a repeating pattern of strokes (7–8). It was built from the [definition](../definitions/draw-the-pattern.md) ([PR #704](https://github.com/rjdunlap/neo/pull/704), 2026-10-21). Read from the code (`src/games/draw-the-pattern/logic.ts`), the ladder today is:

| Level | Plan | Bands whose window includes it | What she decides | Corridor (half-width, strip heights) |
| --- | --- | --- | --- | --- |
| 1 | Make a mark: any touch draws, four lifted touches finish a strip (3 strips) | lap, toddler | where and how to mark; nothing is wrong | none |
| 2 | A long line (the pet draws the left third), then three short down-lines from rings at the top (2 strips) | toddler | to follow the dashes from the ring | 0.18, never a miss |
| 3 | Zigzag of five units, the pet draws two; then a wave the same way (2 strips) | toddler, preschool | to turn at each peak | 0.18 |
| 4 | A circle from the top, either way round; then four loops, the pet draws one (2 strips) | preschool | which way round | 0.16 |
| 5 | Two of zigzag, wave or loops, dashes fading to stepping-stone dots (2 strips) | preschool, pre-K | how the pattern goes on without the guide | 0.15 |
| 6 | Cross, square, triangle, each stroke from its own ring in order (3 strips) | pre-K | the order of the parts | 0.15 |
| 7 | AB pattern of one up and one down unit; the pet draws four, she chooses and draws three (2 strips) | pre-K | which candidate continues the pattern | 0.15 |
| 8 | AAB or ABB of the same pairs; the pet draws six, she draws three more, units 3.2/9 wide (2 strips) | pre-K | the same, with a longer core | 0.15 |
| 9 | Slanting lines: rain from a cloud, three short `\` lines from rings, the pet draws the first; then an X (`\` then `/`) that becomes a kite or a treasure mark (2 strips) | pre-K, before 6 | where each slanting line goes; the order of the X | 0.15 |
| 10 | Dot to dot: six dots a unit apart (at least 120 units), on a long line then on a zigzag; the pet draws dot 1 to 2, the next dot shines, a tap draws the crayon there in 0.4 s, a drag along the dashes also works (2 strips) | lap, toddler | which dot comes next; taps elsewhere and stray drags are never misses | 0.18, never a miss |

`LEVELS` is lap 1–10 with `order` [1, 10] (level 10 added in [PR #1306](https://github.com/rjdunlap/neo/pull/1306); before that lap 1–1, narrowed from the definition's 1–2 in [PR #942](https://github.com/rjdunlap/neo/pull/942) after the [user-research review](../archive/USER-RESEARCH-2026-10-24.md) found that tracing along dashes needs a finger that stays down), toddler 1–10 with `order` [1, 10, 2, 3], preschool 3–5, pre-K 5–9 with `order` [5, 9, 6, 7, 8] (level 9 sits before the triangle; nothing renumbered). No school level.

**Content pools (slice 1 built, [PR #1286](https://github.com/rjdunlap/neo/pull/1286)).** Levels 1–4 and 6 now draw a seeded piece from a pool of three per stroke (`POOLS`, `SHAPE_SETS`): level 1 flowers, fish or birds (one theme per round); long line ground, washing line or road with a car; down-lines fence, rain from a cloud or candles on a cake; zigzag mountains, crocodile teeth or a crown; wave sea, snake or a kite's tail; circle sun, balloon or cart wheel; loops sheep, clouds or chimney smoke; level 6 swaps whole sets (window, house and roof; ribbon, present and bow; mast, cabin and sail), and level 5 uses the zigzag, wave and loop pools. Strokes are identical across pieces. Levels 7–8 pick two of four pairs (`hill`/`dip`, `peak`/`vee`, `peak`/`dip`, `hill`/`vee`; the definition's tall/short and loop/hill pairs were dropped because they could not keep two corridors apart) and, at 8, AAB or ABB. Each piece has one spoken line (`draw.picture.<piece>`), and 7–8 use `draw.unit.<kind>` and `draw.rule.<kind>`.

**Known gaps.** The [GAMES.md entry](../GAMES.md#draw-the-pattern) said "Lap 1–2" near its end, which `LEVELS` no longer does (resolved: it reads "Lap 1"). The [device check](../DEVICE-CHECKS.md) for levels 1–8 is open: the corridor for a two-year-old's zigzag, the crayon hiding the dashes, level 5's stones, whether level 7's candidates read as a choice, and level 8's narrow units. The strip is not saved (definition decision 2) and there is no couch play.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Pre-writing stroke sequence in paediatric OT ([Growing Hands-On Kids](https://www.growinghandsonkids.com/pre-writing-skills-checklist-kids.html); [Ambiki](https://ambiki.com/minor-tags/occupational-therapy-fine-motor-skills-pre-writing-copying-drawing)) and the Beery VMI form order ([NBCOT study guide](https://open-exam-prep.com/study-guides/nbcot-otr/ch3-standardized-assessments/pediatric-developmental-sensory-assessments)) | developmental source | vertical, horizontal, circle, cross, square, **diagonals**, then triangle; imitation before copying | the order already used, plus the diagonal step the built ladder skips (it goes from the square straight to a triangle made of diagonals) | ages as labels, any score |
| Kumon, *My First Book of Tracing*, ages 2–4 ([Rainbow Resource](https://www.rainbowresource.com/000326.html); [Where the Wild Things Are](https://wherethewildthingsare.com.au/p/my-first-book-of-tracing-kumon)) | workbook | each page a path from a picture to a picture: straight vertical lines, horizontal, then curves, zigzags, diagonals, and later lines that cross over each other | **a reason at each end of the line** (a bee to its flower), fresh pictures on every page with the same stroke, diagonals as their own step, crossing lines last | a page count to finish |
| *Harold and the Purple Crayon* iPad app ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/harold-and-the-purple-crayon); [Cool Mom Tech](https://coolmomtech.com/2011/10/harold-and-purple-crayon-ipad-app/)) | story app, 3+ | each page has a faint grey outline to trace or scribble over, and the drawn thing joins the story | the line becoming the thing it stands for, which this game already does; more things per stroke | the price and the story length |
| *Artie's World* / *Artie's Magic Pencil* ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/arties-world); [Best Apps for Kids](https://www.bestappsforkids.com/arties-magic-pencil)) | dot-to-dot drawing, 3+ | connect dots to make the shape, which then comes alive in a scene | **dot-to-dot as a tap entry**: each tap on the next dot draws the line to it, so a child who cannot hold a drag still makes the stroke | limited free content and unlocks |
| Montessori metal insets ([Guidepost Montessori](https://guidepostmontessori.com/blog/encyclopedia-metal-insets); [Montessori Academy](https://montessoriacademy.com.au/material-spotlight-metal-insets/); Montessori's [*The Montessori Method*](https://digital.library.upenn.edu/women/montessori/method/method-XX.html)) | physical material, 3–6 | trace a frame's outline, then fill it with lines far apart, then closer, then solid; horizontal, vertical, diagonal and curved fills | a shape's **fill** as a later mode: lines inside an outline, the outline keeping her in | pressing for neatness; anything rushed |
| *Handwriting Without Tears: Wet-Dry-Try* ([Common Sense Education](https://www.commonsense.org/education/reviews/handwriting-without-tears-wet-dry-try-suite-for-capitals-numbers-lowercase); [Common Sense Media](https://www.commonsensemedia.org/app-reviews/handwriting-without-tears-wet-dry-try-suite-for-capitals-numbers-lowercase)) | handwriting app, pre-K–2 | watch, trace with a wet sponge, dry it, then try alone | confirms watch-then-trace-then-alone (levels 3–5) | the reviewed failure: going off the track **restarts** the letter ("try again"); here the crayon waits |
| *Write Dance* (Ragnhild Oussoren; [Agenda Bookshop](https://agendabookshop.com/products/write-dance); [EYFS forum](https://eyfs.info/forums/topic/28330-write-dance/)) | movement programme, 4–8 | nine themes of big movements to music (circles, spirals, eights, arcades and garlands) before they shrink to paper | **spirals and the figure of eight** as the next strokes; the strip as one big movement | its music, which would compete with the land's style |
| *Writing Wizard*, *Dexteria Jr.* and *LetterSchool* (cited in the [definition](../definitions/draw-the-pattern.md#references)) | tracing apps | demonstrate, trace, then draw from memory | already taken | reports, stylus advice, rewards shop |

In-house references: **Letter Trails** (the tracer, which already follows a self-crossing path: progress is a checkpoint index, so `advanceTrace` only looks one checkpoint ahead and a crossing cannot skip it; level 4's loops cross themselves today), **Number Trails** (its 8), **Pattern Train** (patterns to continue) and **Rainbow Fingers** (free painting).

## What makes sense here

- **Fresh pictures first.** Kumon and the Harold app keep the stroke and change what it makes. Here the same five units can become many things: a zigzag is mountains, a crocodile's teeth or a crown; a wave is the sea, a snake or a ribbon; a circle is the sun, a balloon or a wheel; loops are sheep, clouds or chimney smoke. The rule, the strokes and the corridor stay; only `piece` and the picture change. This removes the biggest weakness (levels 2, 3, 4 and 6 are identical every round) at the rule-test tier.
- **Diagonals before the triangle.** Both Kumon and the Beery order put diagonal lines as their own step. Today level 6's triangle is the first diagonal she meets. An appended level of slanting lines and an X, placed before 6 in pre-K's `order`, fills the gap without renumbering.
- **A tap entry for toddlers.** Draw the Pattern 2 was flagged as drag-only; lap was cut to level 1 instead. A dot-to-dot level, where a tap on the next dot draws the crayon there (a drag along the dashes works too), gives the toddler and lap windows a real line between free marks and tracing.
- **Crossing strokes later.** Spirals and the figure of eight (Write Dance, Kumon's "lines that cross") are the natural top of the stroke ladder. The tracer handles a crossing; the question is geometry: a spiral's rings and an eight's lobes must stay two corridors apart on a strip one unit high, the same constraint that dropped the tall/short pair. They sit above pre-K's age and belong with the school-band question (decision 6).
- **Her pattern, the pet's turn.** Pattern Train asks her to continue; the inversion (she picks the strokes, the pet continues) is a creative mode with nothing wrong. It needs a definition first.
- **Left aside:** speed, accuracy scores, a "restart on a stray" rule (the reviewed failure of Wet-Dry-Try), letters (Letter Trails'), and Write Dance's music.

The long arc: lap and toddler make marks and connect dots; toddler and preschool trace lines, zigzags, waves and loops in many pictures; preschool and pre-K draw from memory and add diagonals, the cross, square and triangle; pre-K continues patterns; a later school window (if decided) adds spirals and eights, then her own patterns that the pet carries on, leading into Letter Trails' joined letters.

## Experience and presentation

- **First unsupported action.** Level 1: any touch on the paper. A new dot-to-dot entry: tapping the glowing dot next to the crayon.
- **Touch and consequence.** Touch-down puts the crayon under the finger with a soft scratch; each checkpoint climbs a pentatonic step (`tuneStep`); a finished strip squashes, rolls up and its piece appears in the picture with its spoken line. At dot-to-dot, the tap's dot pops and the crayon line draws itself to it with one rising note; the crayon then waits at that dot (the return to readiness).
- **Variety on replay.** The new piece pools: the same zigzag makes mountains one round and the crocodile's teeth the next; the pet's paper and crayon colors already rotate. The rule never changes.
- **Reasoning versus motor precision.** Levels 1–6 are motor imitation; level 5 adds memory of the shape (with stones as support); 7–8 are reasoning (which unit continues) carried out with a stroke. A wrong candidate at 7–8 is a reasoning miss; a stray is not counted as reasoning. A dot-to-dot tap on the wrong dot is not a miss: the right dot glows again.
- **Supported ending.** The glow after two misses and the paper bee fly the stretch; the round always ends in the picture.
- **Co-play.** A grown-up draws on a real paper strip the pattern she drew, or she draws the picture's missing thing on paper; at the proposed "her pattern" level the grown-up can be the one who chooses the strokes.
- **Art and feel example (code-drawn).** The crocodile for a zigzag: `drawPiece` fills under her path in `swatch.green` (as `below` does for mountains), then flips the path vertically into the slot's top half for the upper jaw, so her zigzag becomes both rows of teeth, with a `circle` eye and a `swatch.green.line` outline. No new art system.
- **Needs a person or device.** Everything in the open [device check](../DEVICE-CHECKS.md); whether a toddler under two taps the next dot or the one she likes; whether diagonals at 0.15 suit a four-year-old's finger; whether the new pictures are recognisable at the slot sizes.

## Proposed ladder

### Fresh content inside existing levels

Add a piece pool per stroke kind, chosen by seed in `stripsFor`, three pieces each, the strokes unchanged:

| Stroke | Today | Added |
| --- | --- | --- |
| long line (2) | ground | a washing line (with socks), a road (with a car) |
| down-lines (2) | fence | rain from a cloud, candles on a cake |
| zigzag (3, 5) | mountains | crocodile teeth, a crown |
| wave (3, 5) | sea | a snake, a kite's tail |
| circle (4) | sun | a balloon (with a string), a wheel on a cart |
| loops (4, 5) | sheep | clouds, chimney smoke |
| cross / square / triangle (6) | window, house, roof | a picture with a framed window, a present with a cross ribbon, a tent; or a sailing boat (square cabin, triangle sail) |

Level 6's three slots stay in place; a second set (present, ribbon, bow; or cabin, mast-cross, sail) swaps as a whole. Level 1's meadow can also become a pond (her marks become fish) or a sky (her marks become birds). Each new piece needs one `draw.picture.<piece>` line and one `drawPiece` case; the two-candidate geometry of 7–8 is untouched.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | *Slanting lines* (diagonals and X) | pre-K, placed before 6 by `order` (5, 9, 6, 7, 8) | rain slanting from a cloud: three short `\` lines, each from a ring at its top, the pet draws the first; then an X, `\` then `/`, which becomes a kite's crossed sticks (or a treasure mark) | where each slanting line goes | a stray as at 3–6 (the crayon waits, a boing, one miss per drag); glow after two | every stroke's ends differ in both x and y by at least 0.4 (a real diagonal); the X's two strokes cross once, their rings at least two ring radii apart on screen; corridor 0.15 never wider than level 6's; the bot finishes both strips | new pieces `rain`/`kite` (fresh-content pieces reused), two picture lines, an `order` for pre-K, how-to step scoped to 9, bot unchanged (single strokes) |
| 10 | *Dot to dot* (tap entry) | lap and toddler, placed between 1 and 2 by `order` (1, 10, 2, 3) | the pet draws a line from the first dot to the second; four more dots along a long line glow one at a time; a tap on the glowing dot draws the crayon there (a drag along the dashes works too); second strip, dots on a zigzag's peaks and troughs | which dot comes next (only one glows) | none: a tap anywhere else does nothing but a soft pat; no misses, no hints | every dot is at least 120 logical units from the next at the smallest layout; the dots of a strip are in left-to-right order; a tap on the glowing dot advances the crayon to its checkpoint; a tap elsewhere never counts as a miss | a new interaction (taps on a tracer stroke): new-interaction tier; bot taps dots; how-to step for 10; voice `draw.instruct.dots`; lap range changes (decision below, default given) |
| 11 | *Spiral and eight* | a school window only (decision 6) | a snail shell: a spiral of about one and a quarter turns from the outside in; then a figure of eight, which becomes a pair of glasses or a racetrack | which way the stroke turns at the crossing | as at 3–6 | rings of the spiral two corridors apart everywhere; the eight's crossing passed once by index; the bot finishes both | geometry may not fit a strip one unit high at 0.15; gated on decision 6 and the open device check |
| 12 | *Your pattern* (she picks, the pet continues) | pre-K or school | two big crayon buttons show two unit kinds; she picks four units in any order, the pet draws them, then continues her pattern | which pattern to make | nothing is wrong; if her four units are not a repeat (say AABA), the pet asks her to pick one more or continues with "the first two again" | needs a definition | needs a definition: a new interaction and the rule for continuing a non-repeating choice |

### Younger-band openings

Level 10 is the lap opening: lap would become `{ min: 1, max: 10, order: [1, 10] }` and toddler `{ min: 1, max: 10, order: [1, 10, 2, 3] }`. It answers the user-research finding without asking a lap player to hold a drag.

### Easier entries and levels between existing ones

Levels 9 and 10 are both appended IDs placed by `order`; neither renumbers anything. Saved levels keep their meaning, and `entryLevels` should list 10 for lap and toddler so a birthday into toddler lands on a level she knows. Pre-K's window becomes `{ min: 5, max: 9, order: [5, 9, 6, 7, 8] }`.

### Left out on purpose

Timers, speed and accuracy scores; restarting a stroke after a stray; letters and numerals (Letter Trails and Number Trails); music-led drawing; tall/short or loop/hill pairs at 7–8 (they cannot keep two corridors apart); narrower units at 8 until the device check says level 8's width works.

## Decisions for the developer

The definition's seven decisions stand as decided on 2026-10-23. This dive adds:

1. **Lap opening at level 10 (dot to dot).** Default: lap plays 1 and 10. The alternative is toddler only, keeping lap at level 1.
2. **A school window for spirals and eights (level 11).** This reopens definition decision 6 (no school band). Default: no school band yet; level 11 stays unbuilt.
3. **Level 12, *Your pattern*.** Whether a creative inversion belongs here or in Pattern Train.

Decision 1 has a usable default, so slice 3 stays buildable on it; 2 and 3 gate their slices.

## Build slices, in order

1. **Fresh pictures** (built, [PR #1286](https://github.com/rjdunlap/neo/pull/1286)): piece pools for levels 2, 3, 4 and 6 (and 1's pond or sky), seeded in `stripsFor`; new `drawPiece` cases and `draw.picture.*` lines. Tier: existing interaction with new content: typecheck, rule tests (each pool has three pieces, a seed sweep reaches each, strokes identical across pieces), the voice test, and one filtered play of level 3 and level 6 with one portrait screenshot of a new piece; no `fingerdemo` (the bot is unchanged); build only if shared files change. Also fix the GAMES.md "Lap 1–2" wording.
2. **Level 9, *Slanting lines*** (built, [PR #1299](https://github.com/rjdunlap/neo/pull/1299)): appended with pre-K `order` [5, 9, 6, 7, 8]. Tier: new levels on an existing interaction: typecheck, rule tests, one browser play of level 9 with one stray and one hint, `fingerdemo` at 9.
3. **Level 10, *Dot to dot*** (built, [PR #1306](https://github.com/rjdunlap/neo/pull/1306), on decision 1's default): a new tap interaction on the tracer. Tier: new interaction: typecheck, unit tests (registry, how-to, voice), one scripted play of level 10 at lap and of toddler's order step from 10 to 2, one portrait screenshot, `fingerdemo` at 10.
4. **Level 11, *Spiral and eight*** (decision 2 and the open device check): first a geometry probe in `logic.test.ts` of whether a spiral and an eight fit the strip at 0.15.
5. **Level 12, *Your pattern*** (define, then decision 3).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Checks: `node scripts/check-links.mjs` and `git diff --check`.
