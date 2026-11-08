# Block Garden deep dive

*ID `block-garden` · bands pre-K, school, grown-up · levels 1–8 on 2026-11-07 · session `claude/dive-block-garden` ([PR #1366](https://github.com/rjdunlap/neo/pull/1366))*

## The game today

She drags a shaped seed piece from the tray onto a square garden bed. A shadow shows where the piece would land. A row or column planted all the way across blooms and empties, and every sleeping bud on the bed has to bloom. Level 8 asks her to empty the whole bed instead. Pieces never turn. Nothing falls and nothing is timed, every garden is solvable, and an unlimited free undo takes back any planting. The learning purpose is **spatial planning with fixed shapes**: seeing which gap a shape fills, choosing between shapes, and planting in an order that leaves room. It was built from its [definition](../definitions/block-garden.md) (PR #655) and lives in Puzzle Peaks (`region: 'puzzle-peaks'`).

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Finish one row | pre-K | Which end of the one striped line the domino or tromino fills (the first garden is authored) |
| 2 | Rows and columns | pre-K, school | One row and one column, each one piece short; one spare piece |
| 3 | Two lines with one piece | pre-K, school | A corner gap where a row and a column cross. Stripes stop, and a refused drop starts to count |
| 4 | Pick the right pieces | school | Which tray piece is a decoy (it is in no shortest solution) |
| 5 | Make room first | school, grown-up | Order: one piece fits nowhere until a clear opens room for it |
| 6 | Two trays | school, grown-up | Six pieces arrive three at a time; she needs pieces from both trays |
| 7 | The big garden | grown-up | An 8×8 bed at 72 units, nine pieces in three trays, pentominoes and 3×3 pieces |
| 8 | Clear the whole garden | grown-up | 8–16 starting stones and no buds; empty the bed |
| 9 | Corner with stripes | pre-K, school | Level 3's corner gap with the bud-line stripes on and refused drops free |
| 10 | See what comes next | school, grown-up | Level 6's two trays, but the next tray's pieces are shown faded; a tap on one says it comes next |

`BandLevels`: `prek` `order [1, 2, 9, 3]`, `school` `{min 2, max 10, order [2, 9, 3, 4, 5, 10, 6]}`, `grownup` `{min 5, max 10, order [5, 10, 6, 7, 8]}`, and `ENTRY_LEVELS` `[9]`.

**Content pools.** There are 14 shape families (35 oriented shapes once mirrors and turns are counted), each with one colour and one pattern drawn in `seedSquare`. Levels 1–4 are generated at runtime from one template per level (`lineGarden`, `crossGarden`, `cornerGarden`, `blockGarden`), shown under one of the square's eight symmetries, with one authored fallback per level. Levels 5–8 draw on **14 frozen gardens each** in `puzzles.ts`, written by `scripts/block-garden-gardens.mjs`. A round is 2 gardens at levels 1–5 and 1 garden at 6–8. The bed has **one look**: brown soil, grey stones, pink sleeping buds, green seedlings. Flowers are picked as a five-colour petal burst with a pentatonic marimba run up each line, and the basket on the side fills with flowers.

**Known gaps.**
- **Variety.** Slice 1 added four looks, four flower kinds, 24 gardens a level at 5–8 and three-garden rounds at levels 1–2; repeats at 5–8 are rarer but still come eventually, and the tray at 6–8 and the pre-K range are unchanged.
- **The tray at 6–8 is blind (level 10 now shows it first).** Level 10 puts a visible next tray before level 6. The packets under the tray count the pieces still to come but do not show them. That is a big jump from level 5, where every piece is visible, to level 6, where she has to plan for pieces she cannot see.
- **The pre-K range ends at 3.** Level 3 already counts refused drops and drops the stripes, so a four-year-old who struggles at 3 has only levels 1–2, which are two short gardens each.
- **No younger opening.** Preschool has no level, though the first garden (a striped row, one gap, a domino) is a preschool-sized task.
- **Hint cap.** The definition named a 200,000-state hint search; the build uses `SEARCH_CAP = 30_000` and falls back to stepping back (a recorded deviation). Any new 8×8 level has to keep the stored solution as the hint's main source.
- **Phone upright.** Block Garden is in [batch 2 of the upright phone work](../definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built); new layout here should keep `gardenLayout` the single source of the slot and bed rectangles so that batch has one place to change.
- **Couch.** Block Garden has no couch entry (`src/couch/catalog.ts`); the definition left couch play for later.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Block Blast!](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025) (Hungry Studio) and look-alikes such as [Block Blast: Gem Puzzle](https://apps.apple.com/us/app/id6771656026) | Touch, three-piece tray | Endless mode; an Adventure mode whose stages set a goal, often gems sitting in blocks that are freed by clearing their line (the look-alike listings describe it; the original's details are not sourced) | The **goal on the board** is already ours (buds are its gems). Stage dressing that changes as stages go by: a reason to vary the garden's looks | Endless game-over, scores, combos, boosters, ads, a stage map that gates |
| [1010!](https://apps.apple.com/us/app/-/id911793120) (Gram Games) | Touch, the genre's origin | None: one 10×10 board until nothing fits | The calm, plain board and the three-piece tray | Play until stuck; the score |
| [Woodoku](https://apps.apple.com/app/1496354836) (Tripledot) | Touch, block sudoku | One 9×9 board where rows, columns and 3×3 squares all clear; combo points for several at once | A third kind of line (the 3×3 box) is a real new rule, not just a bigger board | Combo scores, ads, game-over; the 9×9 board's small squares on a child band |
| [Katamino](https://www.hachetteboardgames.com/products/katamino) (Gigamic; [rules](https://foxmind.co.il/wp-content/uploads/2021/10/GIGAMIC_KATAMINO_RULES_web.pdf)) | Wooden pentomino board | A slider shortens the board; "Penta 3" fills it with three named pentominoes, "Penta 4" with four, and so on, in 500 graded challenges. Katamino Family uses colour-graded cards from beginner to expert | **Growing one dimension at a time**: the same rule with one more piece. A short board with the pieces named is a good younger entry | Its solutions-not-included frustration (we always have a hint) |
| [IQ Puzzler Pro](https://gamesbysmart.com/en/iq-puzzler-pro.html) (SmartGames) | Solo pegboard puzzle, ages 6+ | 120 challenges from starter to expert; the easy ones place most pieces for you and leave a few to fit | **Pre-placed pieces** as the easy end: a board mostly done, with one or two gaps, is our level 1 already, and a strong preschool shape | The 3D mode; the booklet's small pictures |
| Tetris, through [Okagaki and Frensch (1994)](https://cdgr.ucsb.edu/node/730) | Falling blocks | Speed rises | Already taken by the definition: the shapes, without the falling | Speed, pressure, line-score chasing |
| Pattern blocks and tangrams on a table | Physical play | Outline cards from filled-in to outline-only | A **picture to fill** is a different goal from clearing a line, and needs its own game (Tangram Town covers it) | Nothing to borrow here beyond the outline-to-plain progression, which our stripes already follow |

**Learning references.** Filling a rectangle with rows and columns of squares is the Common Core grade 2 geometry standard [2.G.A.2](https://www.thecorestandards.org/Math/Content/2/G/) (partition a rectangle into rows and columns of same-size squares and count them), and area by tiling with unit squares is [3.MD.C.5–6](https://www.thecorestandards.org/Math/Content/3/MD/). Composing shapes from shapes is [K.G.B.6](https://www.thecorestandards.org/Math/Content/K/G/). Levine and colleagues (2012), already cited in the definition, support early puzzle play and parents' spatial talk. None of this licenses a claim of a general spatial gain; the grown-ups' card should keep naming the board skill: seeing which gap a shape fills and planning which line to finish.

## What makes sense here

The game's core is already the right one: a finite garden with a goal, a solution and free undo. Its ladder grows best along the axes the references use without pressure:

1. **More to see on replay** (looks, flower kinds, more frozen gardens) without changing a rule.
2. **One more thing to plan for at a time**, as Katamino adds one piece: a visible next tray before the blind one, then a square she must keep, then (only if the developer opens it) the 3×3 box as a third kind of line.
3. **A gentler pre-K floor and a preschool door**, in the IQ Puzzler sense of a bed that is nearly done.

Left out: scores, combos, endless play to a game-over, boosters and a reshuffle (decided 2026-10-23), rotation (decided: none), timers, and a board smaller than its squares allow on the child bands.

Long-term arc: a preschooler fills one striped gap in a nearly full bed; pre-K finishes two lines and meets the corner piece; school picks pieces, makes room and reads the next tray; a grown-up plans a big garden around a square she must not pick.

## Experience and presentation

- **First unsupported action.** At level 1 she lifts the only piece that matters; the shadow shows the gap, the stripe says which line, and the drop blooms the bud. No adult needs to supply the answer, since the square piece also finishes the row.
- **Touch and consequence.** Lifting a piece already pops and raises it, the shadow shimmers the lines it would fill, and the bloom runs a marimba run along the line. The new looks should add one visible consequence per look without slowing the bloom (taps are ignored for `BLOOM = 0.5` s): in the **autumn** look the picked line's flowers become falling leaves that drift to the basket; in **rain** each bloom shakes droplets off the petals; in the **evening** look the bloomed buds glow like little lanterns for a moment before they are picked.
- **Art and feel example.** An autumn bed: the soil border drawn as a low woven fence (two `Graphics` strokes in `swatch.brown`), stones with a moss cap (a `swatch.green.light` half-ellipse), the bud drawn closed in `swatch.orange` instead of pink, and the picked flowers as five-point maple leaves in `swatch.orange`, `swatch.red` and `swatch.yellow`, falling with `ctx.particles` set to a small gravity and a slow spin. The marimba run stays the same pentatonic steps; the evening look may drop it an octave.
- **What varies on replay.** The look (morning, autumn, rain, evening), the flower kind that blooms from a bud (tulip, daisy, poppy, sunflower), the garden itself and its symmetry. None changes the rule or the solution.
- **Reasoning versus reading, memory and motor.** No reading is needed. The stripe and the shadow carry the reasoning load at 1–2. The blind tray at 6 adds a memory and prediction load that the proposed level 10 removes by showing the next tray. Motor precision is low: `nearestAnchor` snaps within 0.6 of a square, and squares are 100 units on every child band.
- **Supported completion and stopping.** Two misses glow the hint piece and its shadow; the wander hint glows after `max(4, 2 × par)` plantings; a stuck bed pulses the undo arrow and is never a miss. A round ends with one sticker, with or without help, and Start again is in the pause sheet. Nothing carries over, so stopping mid-round loses nothing she owns.
- **Co-play.** The existing line ("One of you points at a gap, and the other finds the shape that fills it") gives each player a role; the visible next tray at level 10 adds a natural second role: one plays the tray in front, the other says which coming piece needs room.
- **For a person or device to judge.** Whether a four-year-old reads the stripe as "this line" without being told; whether the next tray's faded pieces at level 10 read as "coming later" rather than "use these now"; whether the leaf, droplet and lantern effects read as the same bloom on an iPad; and whether a preschooler can carry a piece without dropping it early (only if the preschool door is opened).

## Proposed ladder

### Fresh content inside existing levels

- **Four garden looks** chosen per round with `ctx.rng`: morning (today's look), autumn, rain and evening. Each changes the border, the stone cap, the bud colour and the picked-flower effect as above. Pure drawing in `index.ts`, plus a `LOOKS` list and a `lookFor(rng)` in `logic.ts` so a rule test can assert every look is reachable and none changes the garden.
- **Flower kinds.** A bud blooms into one of four flower kinds drawn by `flowerArt` (today's round flower, a tulip cup, a daisy ring, a sunflower disc). The basket fills with the kinds she woke. Drawing only.
- **More frozen gardens at 5–8.** Run `scripts/block-garden-gardens.mjs` for more seeds until each level has **at least 24** distinct gardens (today 14). The script and the frozen-garden tests already check par, filter and every symmetry, so only the minimum in `logic.test.ts` changes.
- **A third garden at level 1 and 2** (rounds of three instead of two), so a pre-K round is not over in two drops. `gardens: 3` for plans 1 and 2; the first garden stays authored.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | *See what comes next* | school (placed between 5 and 6), grown-up | A 6×6 bed, six pieces in two trays; the second tray shows faded in the packets row instead of plain packets, and cannot be lifted | Which tray piece to plant now so a coming piece still has room | As level 6: a refused drop is a miss; two misses glow the hint piece; an attempt to lift a faded piece wiggles it with "That one comes next," never a miss | Every garden has par 4–6, needs both trays, and at least one shortest solution from the start would be blocked if a named first-tray placement were made first (the visible tray matters); 24 frozen gardens | New frozen list (level 6's generator with that filter), the faded-tray drawing in the packets area, `order` for school `[2, 9, 3, 4, 5, 10, 6, 11]` (levels 9 and 11 join it) and grown-up `[5, 10, 6, 7, 8, 11, 12]`, one voice line, how-to step, bot: none new (the bot already drags from the tray). Layout probe at 768×1024 for the faded row |
| 11 | *Mind the snail* | school (last in its `order`), grown-up | A 6×6 bed with one snail on a stone; the snail's row has a gap that would be easy to fill, and its buds sit in other lines | Which lines to finish, and which one never to fill: the snail's stone must not be picked | A drop that would complete a line through the snail is refused with "That would pick the snail's house," a gentle boing, and counts as a miss as other refusals do from level 3; while a carried piece would finish the snail's line, the shadow shows a small worried snail on that line instead of the yellow shimmer | Every garden is solvable without clearing a snail square; at least one shortest solution of the same bed *without* the snail clears it (the snail changes the plan); `fits` stays the same and a new `allowed` refuses a snail clear; levels 1–8 gardens unchanged | Model change: a `keep` mask on `Bed`, `place` reports, `placements`/`search` skip snail clears, encoder gains one marker; frozen list; voice lines; hint unchanged (it reads the plan). Snail art in `Graphics` |
| 12 | *Mind the snails* | grown-up | An 8×8 bed at 72 units with two snails, nine pieces in three trays | As 11, with more lines to plan around | As 11 | As 11 at 8×8, par 7–9, the stored solution keeps the hint inside `SEARCH_CAP` | Frozen list only, after 11 |
| 13 | *Box garden* | grown-up | A 9×9 bed of 3×3 boxes at 64 units; a box planted full blooms too | Rows, columns and boxes | As 8 | Every box clear is counted once with lines; solutions exist | **Gated:** box clears stay a proposal under the [October 23 record](../archive/DECISIONS-2026-10-23.md#decisions) (the definition's decision 5); not reopened here (see [Decisions](#decisions-for-the-developer)) |

### Younger-band openings

- **Level 14 *One little gap*** (preschool, would be `entryLevels` for preschool and pre-K's new floor): a 4×4 bed at 110 units, three of a row's four squares stone with a bud, and one piece in the tray, a monomino or a domino matched to the gap. The stripe is on, nothing counts as a miss, and the round is three gardens. A rule test asserts one placement solves it and the piece fits only at the gap or in places that leave the stripe unchanged. **Gated**: adding preschool to `bands` is a band decision ([Decisions](#decisions-for-the-developer)).

### Easier entries and levels between existing ones

- **Level 10** is placed between 5 and 6 with the school `order`, so the blind tray at 6 comes after she has seen a tray coming.
- **A gentler pre-K step between 2 and 3: level 9 *Corner with stripes*** — level 3's corner gardens with the stripes still on and refused drops still free. Placed with the pre-K `order` `[1, 2, 9, 3]`, and school's order puts it after 2 as well; no new garden generator (it reuses `cornerGarden` with `tinted: true, refusalCounts: false`). A rule test asserts its gardens pass level 3's filter. This needs no decision: it is an easier level inside a band the game already serves.
- No ID is renumbered; new IDs are appended and placed with `order`, and a saved pin on 1–8 keeps its meaning.

### Left out on purpose

- Scores, combos and a counter of lines; an endless run to a game-over; a reshuffle (decided); rotation (decided none); a timer or a moving piece.
- A free-plant creative mode: planting with nothing to finish has no learning purpose beyond what Stamp Studio already gives, and the lines emptying makes a picture impossible to keep.
- Gems, coins or anything that collects across rounds.

## Decisions for the developer

1. **A preschool door (level 14 *One little gap*).** Open `preschool` on Block Garden with a 4×4 bed and one piece, or keep the game at pre-K and up (default: keep pre-K and up until a person sees a four-year-old play level 1 on an iPad).
Decision 1 is added to [Waiting on the developer](../WAITING-ON-DEVELOPER.md). Box clears (level 13 *Box garden*) are not a new decision: the October 23 record already keeps them a proposal, so level 13 stays a sketch until the developer reopens it.

## Build slices, in order

1. **Built.** **Looks, flower kinds, more gardens and a longer pre-K round** (four looks, four flower kinds, at least 24 frozen gardens at 5–8, three gardens a round at 1–2; typecheck, rule tests, one filtered `blockgarden` play at level 5 with one portrait screenshot in the autumn look; no `fingerdemo`, since the bot's actions do not change; build only if shared files change).
2. **Built.** **Level 9 *Corner with stripes*** placed between 2 and 3 for pre-K and school (new level on the existing interaction: typecheck, rule and registry/how-to tests with the new pre-K `[1, 2, 9, 3]` and school `order`, one browser play of 9, `fingerdemo` at 9).
3. **Built.** **Level 10 *See what comes next*** placed between 5 and 6 for school (new presentation of the tray: layout probe at 768×1024 first, typecheck, rule and registry/how-to tests with the school `order`, one browser play of 10 with one tap on a faded piece, one portrait screenshot, `fingerdemo` at 10, build because voice lines change).
4. **Built.** **Level 11 *Mind the snail*** (model change, the `keep` mask: typecheck, unit tests with levels 1–10 gardens unchanged, one scripted play with one refused snail clear and one hint, one portrait screenshot, `fingerdemo` at 11, build).
5. **Level 12 *Mind the snails*** after slice 4 (new level on the slice-4 model: typecheck, rule tests including the hint inside the cap, one browser play of 12, `fingerdemo` at 12).

Gated: level 14 (decision 1). Not planned: level 13 (box clears stay a proposal).

## What was built in this session

Slice 1 (2026-11-07, PR #1390): four garden looks per round (morning, autumn, rain, evening) picked with `ctx.rng` after the gardens so a look never changes a garden; four flower kinds (poppy, tulip, daisy, sunflower) by bud place via `flowerAt`, with woken flowers peeking out of the basket (newest 7); frozen gardens at levels 5–8 raised from 14 to 24 each (`PER_LEVEL` 24 in `scripts/block-garden-gardens.mjs`, the first 14 unchanged); levels 1–2 are three gardens a round.

Slice 2 (2026-11-07): level 9 *Corner with stripes* is level 3's corner gardens (same generator and filter, via `like: 3` and `kindOf`) with the bud-line stripes on and refused drops free; pre-K `order` `[1, 2, 9, 3]`, school `[2, 9, 3, 4, 5, 6]`, `entryLevels: [9]` (a grown-up lands at 5); how-to lines for 9 and a level-9 section in the `blockgarden` browser suite. Slices 4–5 are not built.

Slice 3 (2026-11-08, PR #1421): level 10 *See what comes next* is level 6's two trays and six pieces (par 4–6) via `like: 6` and a new `preview: true` flag: the next tray is drawn faded in three cards (landscape: a column left of the bed below the shell's ?, 136×124 at 1024×768; upright: a row of 180×110 cards under the tray) instead of seed packets, and a tap or try to lift a faded piece wiggles it and says `block-garden.comes-next` ("That one comes next."), never a miss; refused drops are misses as at 6. 24 frozen gardens, none repeating a level 6 bed (`scripts/block-garden-gardens.mjs` now also writes level 10; levels 5–8 regenerated byte-identical), with a `nextTrap` filter (a first-tray planting must not leave a coming piece no room and make the garden longer than par or impossible). School `{min 2, max 10, order [2, 9, 3, 4, 5, 10, 6]}`, grown-up `{min 5, max 10, order [5, 10, 6, 7, 8]}`; `ENTRY_LEVELS` stays `[9]`. `gardenLayout` gains `next: Rect[]` and its test checks clearance of the shell's ?. How-to step, finish and note for 10; the `blockgarden` suite has a level 10 section (`GARDEN_LEVELS=10` runs it alone). The planned orders that list 12 belong to slice 5.

Slice 4 (2026-11-08, PR #1426): level 11 *Mind the snail* adds the `keep` mask: `Bed.keep` (an optional snail mask, `s` in the encoded bed), `place` reports `snails`, and a new `allowed()` (fits, and no snail in a filled line) gates drops; `placements` (so search, hint, `noRoom` and `nextTrap`) skip snail clears only when the bed has a snail, so levels 1–10 search exactly as before. Plan: 6×6, cell 100, six pieces in trays of 3, buds 3–4, par 4–6, MID families, `snails: 1`; the generator `snailGarden` is level 6's two-tray block plus one other row of stones with a straight domino or I3 gap and a snail on a stone whose column has no bud, one extra replaced by the gap piece. The case-11 filter keeps one snail on a plain stone with no bud in its row or column, par above the tray size, a first-tray piece that fits somewhere it is not allowed (the temptation), and a shortest solution that would empty the snail's stone without the snail. 24 frozen gardens (`scripts/block-garden-gardens.mjs` now also writes 11; levels 5–8 and 10 regenerated byte-identical). A drop that fails `allowed` goes home with a boing and `block-garden.snail` ("That would pick the snail's house."), counted as a miss like other refusals (the second lights the hint); a carried or hinted shadow over the snail's line shows the line cool blue and the snail on a pale ring shaking worried instead of the yellow shimmer; the snail is drawn in Graphics on its stone. School `{min 2, max 11, order [2, 9, 3, 4, 5, 10, 6, 11]}`, grown-up `{min 5, max 11, order [5, 10, 6, 7, 8, 11]}`. How-to tray and snail steps for 11, finish for 9–11, a note for 11; the `blockgarden` suite has a level 11 section (`GARDEN_LEVELS=11` runs it alone). Slice 5 (level 12 *Mind the snails*) is next.
