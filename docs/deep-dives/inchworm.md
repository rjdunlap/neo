# Inchworm Measure deep dive

*ID `inchworm` · bands pre-K, school · levels 1–7 on 2026-10-31 · session `claude/dive-inchworm`, [PR #1076](https://github.com/rjdunlap/neo/pull/1076)*

## The game today

She drags inchworms from a bucket onto a leaf, pencil, snake or stick; they snap end to end, so gaps and overlaps cannot happen, and a worm that would hang off the end is a gentle miss. Later she reads a picture ruler instead of laying worms. **Learning purpose:** length is a count of equal units laid end to end, then read from a ruler as the spaces a thing covers (CCSS 1.MD.A.2, 2.MD.A.1, 2.MD.A.2, 2.MD.A.4, 2.MD.B.6). Tinker Lab (`region: 'tinker-lab'`, [GAMES entry](../GAMES.md#inchworm-measure)).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What she decides | Rounds |
| --- | --- | --- | --- | --- |
| 1 | Lay inchworms end to end along a leaf, and count them | pre-K, school | Where each worm goes; the pet counts | 3 (2–4 worms) |
| 2 | Measure with worms, then pick how many worms long | pre-K, school | The count, from three pads | 3 (2–6) |
| 7 | Big worms, then little worms: which number did the little worms make? | pre-K top, school (after 2) | Which of two counts came from the smaller unit | 4 (2–3 big, 4–6 little) |
| 3 | Measure two things: which is longer, and by how many worms? | school | The difference | 3 (2–6 each) |
| 4 | Read a ruler, even when the pencil does not start at 0 | school | Spaces covered, not the end mark (every other round starts at 1–3) | 4 (2–8 on a 0–10 ruler) |
| 5 | Two things on one ruler, starting at different marks: how much longer? | school | The difference of the lengths, not of the ends | 4 |
| 6 | Two things end to end on the ruler: how long together? | school | The sum, not where the first stops | 4 |

Ranges (`LEVELS` in `index.ts`): pre-K 1–7 with `order [1, 2, 7]`; school 1–7 with `order [1, 2, 7, 3, 4, 5, 6]`. The deep-dive tracker listed the top as 6 (its 2026-10-10 snapshot); level 7 was built 2026-10-22 from the [measurement study](subjects/measurement-units.md) ([definition](../definitions/big-worms-little-worms.md)), and this dive numbers its own levels from 8.

**Content pools.** Four things (`THINGS`: leaf, pencil, snake, stick), seeded lengths, seeded ruler starts on a fixed 0–10 ruler (74 units a space on the ruler levels, 88 for worms). The things are the thinnest part: every round is one of four objects, and every ruler is the same whole ruler with 0 showing. **Wrong answers** at the pads offer the likely mistake (`temptingReading`: the end mark, the gap between the ends, where the first thing stops) and a spoken explanation for it; two misses glow the right pad, the thing's end, the ruler spaces or the extra part. **Couplings:** a ghost-finger bot (`measureTouch`) that lays every row and taps the answer; how-to card steps per level; no journal entries, no couch entry, no story use. No observation in [OBSERVATIONS](../OBSERVATIONS.md). Study handoffs that name this game: the measurement study (level 7, built), the ancient-Mediterranean study's *Long jump* (AM7, "one Inchworm Measure mode with a sand pit"), the deep-time study's note that dinosaur length cards belong here only if a reference scale is the whole interaction, the fractions notebook's "a 6–8 mode for Inchworm" (Slice to Fit), and the roadmap's chunk 18 preschool opening.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Classroom Secrets Kids, *Measure Lengths Using Non-standard Units*](https://kids.classroomsecrets.co.uk/resource/year-1-measure-lengths-using-non-standard-units-game/) and [*Measure Lengths*](https://kids.classroomsecrets.co.uk/resource/year-1-measure-lengths-game/) (search descriptions) | UK Year 1 classroom games | Lolly sticks, cubes and blocks as units, then centimetres | Many different everyday things measured with the same unit | Worksheet framing, subscription gate |
| [SplashLearn, *How Many Inches Longer?*](https://www.splashlearn.com/s/math-games/how-many-inches-longer) and [*Selecting the Right Unit*](https://www.splashlearn.com/s/math-games/select-the-right-unit) (search descriptions) | Web/app drill catalogue | Grade 2 rulers, inches and centimetres, "measure by subtracting" at grade 3 | The difference question (already built as level 5); choosing a unit stays with Measuring Post | Reward currency, sign-up, a worksheet per skill |
| The **broken ruler task** ([CRDG facilitator materials, University of Hawaiʻi](https://crdg.hawaii.edu/developing-teacher-expertise-mathematics/modules/facilitator-resources/facilitator-geometric-measurement-resources/Session1/resources/s01_p7_cca1-length.docx); search description) | Classroom assessment item | A rod under a ruler whose start is missing; a later item asks which number goes where a ruler's number is hidden | **Level 8**: a ruler with no 0 at all, so counting spaces is the only way | Paper-test framing |
| Clements and Sarama's length learning trajectory ([ZDM 2011 abstract](https://researchconnect.buffalo.edu/en/publications/evaluation-of-a-learning-trajectory-for-length-in-the-early-years/); [CRDG session 2 summary](https://crdg.hawaii.edu/developing-teacher-expertise-mathematics/modules/facilitator-resources/geometric-measurement/Session2/Part05/index.html)) | Research-based progression | End-to-end length measurer, then *length unit relater and repeater* (one unit moved along), then consistent length measurer | **Level 9** repeats one worm; level 8 tests the consistent measurer's "spaces, not marks" | A precise age per level (not established) |
| Cuisenaire rods and Montessori red rods (**recalled**, classroom materials) | Physical rods | Rods compared, then trains of rods matched to a longer rod | A train of short pieces equal to a long one (already level 7's idea) | Colour-number coding to memorise |
| Leo Lionni, *Inch by Inch* (**recalled**, picture book, 1960) | Picture book | An inchworm measures birds' tails and necks, then "measures" a song by inching away | The inchworm literally inching along as the unit (level 9's hop) | — |
| Elinor Pinczes, *Inchworm and a Half* (**recalled**, picture book) | Picture book | Whole worms leave a gap; a half worm, then a third, measures the rest | A leftover piece that whole worms cannot say | Fraction units here (Ribbon Workshop owns fractional lengths; see *Left out*) |
| [Kids Academy length games](https://www.kidsacademy.mobi/games/length) (search description) | App, 5+ | Inches, feet, yards | Standard units at the top, once decided | Customary-unit trivia |
| A tape measure laid twice along a long table (household practice, **recalled**) | Home | A short ruler moved along to measure something longer than it | **Level 10**: slide a short ruler and add | — |

No source establishes that a tap game teaches length; standards are curriculum evidence and the trajectory supports the order only.

## What makes sense here

The game already climbs from end-to-end units to a ruler. Three trajectory steps are missing and each fits the built drag-snap and pad actions: **repeating one unit** (one worm inching along, which is also the game's name), **reading a ruler with no 0** (the broken ruler, the clearest test of counting spaces) and **measuring something longer than the tool** (moving a short ruler and adding). The things need variety more than anything: four objects across seven levels.

Owned elsewhere, so not proposed: indirect comparison with a ribbon (Size Parade 14), choosing the tool or attribute and different-unit comparisons (Measuring Post), estimation before measuring (the `estimation` study), fractional lengths (Ribbon Workshop), placing numbers on a line (Frog Hop). Standard units (cm) are decided for school top levels (measurement study decision 2), but a picture ruler on an iPad is not true to scale; that is decision 2 below, so no cm level is ready.

**Long-term arc:** pre-K lays and counts worms and sees a smaller worm makes a bigger count; school repeats one worm, reads whole and broken rulers, finds differences and sums, and measures past the ruler's end; a later cm top waits on the decision.

## Experience and presentation

- **First unsupported action:** dragging a worm onto the leaf; it snaps end to end with a squish and a count chime. On level 9 it is a tap on the worm, which hops one length and leaves a chalk tick.
- **Touch and consequence:** every worm ticks as it lifts (`draggable`), each snap pops a step higher than the last (`sfx.pop(3 + worms)`), and a finished row sparkles. The ruler ticks that matter light as the hint. A tap on a pad presses in at once; a right answer sparkles and the pet says the length.
- **Variety without changing the rule:** new things (a crayon, a carrot, a rope, a paintbrush, a feather), a sand-pit long jump for comparing two jumps at level 3, a broken ruler snapped at a seeded mark, a seeded short ruler length at level 10.
- **Reasoning versus motor:** the drag targets snap generously (a drop near the row goes to the next slot), the pads are 120 units, the ruler stays at 74 units a space; the thinking is in the count, never in placing precisely.
- **Supported ending:** two misses glow the spaces or the pad; the round completes with help and one sticker; replay draws new things and lengths.
- **Co-play:** one person measures in the game while the other guesses aloud first (the measurement study's *Guess and measure*); the existing off-screen card (LEGO bricks or spoons) covers the home version. At level 10, measuring a table with a short ruler moved twice.
- **Art example:** the broken ruler is the existing `drawRuler` with its left end cut by a jagged `Graphics` edge over the yellow face, a few splinter strokes in `wood.line`, and the first visible number at the break; the hop is a two-tween scrunch (scale x 0.6, scale y 1.3) and stretch to the next slot, leaving a short white `Graphics` tick under the thing.
- **Needs a person or device:** whether a five-year-old counts ticks or hops on level 9, whether the broken ruler reads as broken rather than odd at iPad size, and whether sliding the ruler at level 10 is comfortable in portrait.

## Proposed ladder

### Fresh content inside existing levels

- **More things.** Add five things to `THINGS`: crayon, carrot, rope, paintbrush and feather, each a code-drawn `thingArt` branch that stretches to any whole length (the crayon and brush like the pencil, the rope like the snake with a twist pattern, the carrot tapering with leaves at the start, the feather with a central quill). Voice words for each (`THING_WORDS`); seeded picks never repeat a thing in two consecutive rounds. Levels 1–7 keep their rules, lengths and answers.
- **Long jump at level 3 (AM7).** One round in three at level 3 compares two jumps in a sand pit: a take-off board at the left, two footprint marks, and two jump tracks (a dashed line from the board to each footprint) measured with worms. The question is unchanged ("which is longer, and by how many worms?"); the voice names "Bunny's jump" and "Duck's jump". No history claim and no Olympic naming, so the ancient-Mediterranean study's reviewer gates do not apply.
- *Rule test:* every thing has art and a word; no thing repeats in consecutive rounds; levels 1–7 still produce the same answers for the same lengths (choices and tempting readings unchanged); a long-jump round has two different lengths.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **The broken ruler** | school (after 4) | A crayon on a ruler snapped at 3: the crayon starts at 4 and ends at 9; pads 5, 9 and 6 | How many spaces it covers when no 0 is there | The end mark: "That is where it ends. The ruler starts at {n}; count the spaces it covers." Marks counted (length + 1): "Count the spaces, not the marks." Two misses light the spaces under it (the level-4 `hintSpans`) | Break at 2–5; the thing starts at or after the break and ends by 10; the answer, the end mark and length + 1 are three different pads; never two rounds with the same answer | `logic.ts` mode `broken` (counts as a ruler level in `isRuler`); `drawRuler` from the break; two voice lines and an instruction; how-to step; the bot is unchanged (`measureTouch` taps the answer) |
| 9 | **One worm, hop by hop** | school (after 7); pre-K is a person check | One worm on the left end of a 4-long stick; tap it and it inches one length, leaving a chalk tick | When it has reached the end, how many hops (ticks) long the stick is | The worm stops at the end by itself (no hang-off miss); the pads appear; a wrong count: "Count the chalk marks again." Two misses glow the pad and number the ticks | Lengths 3–8, never the same twice running; exactly `length` hops end at the thing's end; the answer is the hop count; the bot taps the worm `length` times and then the pad | New tap-to-hop interaction and a tick layer; reuses `wormArt`; one instruction, one miss line; bot change; `fingerdemo` |
| 10 | **Longer than the ruler** | school top | A rope 8 long and a short ruler 0–5; she drags the ruler to the rope's start (it snaps), a chalk mark appears at 5, then drags it again to start at the mark | How long the rope is: 5 and the rest read on the second lay | A drop away from the next slot slides back (not a miss). A wrong pad: the second reading alone ("That is the second part. Add the first 5.") or near ("Count the spaces: 5, then the rest"). Two misses light both parts and the chalk mark | Ruler length 4–6; thing length from ruler + 1 to 2 × ruler; the second reading is never the answer; three distinct pads; the bot drags to the start, then to the mark, then taps | New ruler drag (a 300+ unit target); `logic.ts` mode `slide`; voice and how-to lines; bot change; `fingerdemo` |

School order after all three: `[1, 2, 7, 9, 3, 4, 8, 5, 6, 10]` (each batch appends its ID to the order and the range max; no renumbering, so saves and pins keep their meaning). Pre-K stays `[1, 2, 7]`.

### Younger-band openings

**Preschool, *Cover the leaf*** (roadmap chunk 18): a short leaf takes two or three worms; she drags them on and the pet counts; no pads, no number to choose, and the round ends when the leaf is covered. It would be a new level ID (11) placed first in a preschool `order`, with `entryLevels` so a birthday lands on it. Gated: chunk 18 batches openings together with the band audit and a device fit check, and only a person can say whether a three-year-old drags a worm end to end at all. Write-up only.

### Easier entries and levels between existing ones

Level 9 sits between 7 and 3 at school by `order`. Level 8 sits after 4, where the whole ruler has just taught the end-mark mistake. No other easier entry is needed: pre-K's ladder already starts at the simplest drag.

### Left out on purpose

- **Fractional worms** (*Inchworm and a Half*, the fractions notebook's Slice to Fit mode): Ribbon Workshop owns fractional lengths; a half worm here would repeat it.
- **A ribbon to compare two things that cannot meet** (indirect comparison): Size Parade 14.
- **Which tool or unit to use**, and counts in different units: Measuring Post.
- **Guess first, then measure** as a scored rung: the `estimation` study; a guess is only the co-play tip here.
- **Dinosaur length cards** (deep-time study): screen drawings are not true relative sizes; not proposed.
- **Missing numbers on a ruler** (the broken-ruler task's second item): it is a number-line question, and Frog Hop's number-line levels own that.
- Timers, scores for speed, and any ruler that requires reading tiny ticks below 74 units a space.

## Decisions for the developer

1. **Preschool opening** (*Cover the leaf*, level 11): built with roadmap chunk 18's preschool batch, after its band audit and device fit check. Lean: yes, in that batch. Nothing else here waits on it.
2. **Centimetres on a picture ruler.** The measurement study decided metric at school top levels, but an iPad picture ruler is not true to scale. Lean: allow "cm" on a picture ruler only with a grown-up note that the pictures are not life size, and only after Measuring Post has a cm level, so units arrive in one place first. Alternative: keep island units (worms and ruler spaces) in this game for good. No level is proposed until this is answered.

## Build slices, in order

1. **Fresh things and the broken ruler (batch inchworm 1).** Five new things with voice words, the long-jump round at level 3, and level 8 *The broken ruler* (school order `[1, 2, 7, 3, 4, 8, 5, 6]`, school max 8). *Check:* new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 with the end-mark pad, a second miss for the glow, then the right pad; one level-3 play with a long-jump round; `fingerdemo` at 8; one portrait screenshot of the broken ruler; one build for the new art.
2. **Level 9, One worm, hop by hop (batch inchworm 2),** after batch 1 (shares the order and the `THINGS` list). School order `[1, 2, 7, 9, 3, 4, 8, 5, 6]`. *Check:* new interaction: typecheck, rule tests, one play of level 9 with one wrong count, a second for the glow, then the right pad; one portrait screenshot mid-hop; `fingerdemo` at 9.
3. **Level 10, Longer than the ruler (batch inchworm 3),** after batch 1. School top. *Check:* new interaction: typecheck, rule tests, one play of level 10 with one drop away from the slot (no miss), the second-part pad (a miss), a second for the glow, then the answer; one portrait screenshot with the chalk mark; `fingerdemo` at 10.
4. *Gated:* level 11 *Cover the leaf* (decision 1, with chunk 18); a cm level (decision 2); level 9 at pre-K (a person check after slice 2).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
