# Orchard Rows deep dive

*ID `orchard-rows` · bands school · levels 1–9 on 2026-11-03 · session `ccr-73906eb2-r3nm6v`, [PR #1133](https://github.com/rjdunlap/neo/pull/1133)*

## The game today

She plants and counts trees in equal rows. The learning purpose is multiplication as equal groups: a rectangular array counted by rows, then the same array turned (commutativity), then, from level 4, which arrays a number allows (factors and primes). Levels 4–6 came from the [number-structure study](subjects/number-structure.md) ([definition](../definitions/orchard-rows.md), built 2026-11-02, [PR #1121](https://github.com/rjdunlap/neo/pull/1121)); that study left this dive to number its own levels from 7. The game sits in Barnyard (`LANDS`, `src/content/lands.ts`), subject `counting-cove`, school only (`LEVELS = { school: { min: 1, max: 6 } }`), music `STYLES.hub`, with a ghost-finger bot for every level and no couch entry.

| Level | Plan | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | Plant equal rows and count by rows | school | Which row to plant or count next (free), then the total on a number pad |
| 2 | Count by rows, then turn and count by columns | school | The total by rows; after the turn, the total by columns ("Still 12 trees!") |
| 3 | Find the missing row, then count two ways | school | How many trees fill the empty row (pad), then both totals |
| 4 | Equal rows | school | A row count with none left over in the basket (arrows, then Plant) |
| 5 | Every way | school | Each different orchard one basket can make (fill every frame) |
| 6 | Only one long row | school | Which of three baskets only makes one long row (prime) |

**Content pools** (`src/games/orchard-rows/logic.ts`):

- Levels 1–3 draw two different shapes from small fixed lists: level 1 from 2×3, 3×2 and 3×3; level 2 from 2×4, 3×4 and 2×5; level 3 from 3×5, 4×5, 5×4 and 5×5. Three shapes make only three possible pairs at levels 1 and 2, and every pair shares a shape with every other. Number pads use `choicesFor` (the answer, one more, one fewer, and the row count at level 3).
- Level 4: the first basket is always 12 at five rows, the second from 15, 16, 18 and 20. Level 5: one basket from 12, 16, 18, 20 and 24. Level 6: the first set is 12, 13 and 15, the second from 60 generated sets.
- Fruit: levels 1–3 use the seeded red or orange tree; levels 4–6 seed apple, pear or plum.

**Accounting.** Levels 1–3: every wrong pad is one miss; two on a question glow the answer and count one hint. Levels 4–6 follow the [definition's rule](../definitions/orchard-rows.md#the-accounting-rule): arrows, basket loads and repeats are free; Plant with a leftover or a first wrong claim per basket is a miss; a second miss glows the way (one hint per basket or set).

**Known gaps and person checks.** No child has played it ([OBSERVATIONS](../OBSERVATIONS.md) has no entry). [DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#orchard-rows-46-number-structure-study-2026-10-31-built-2026-11-02) holds the levels 4–6 questions and the older whole-row and turned-orchard check. Reduced-motion dealing is unbuilt (the app has no setting). The how-to `note` for the basket levels is `{ from: 4 }` with no upper bound.

**What the island does not teach yet.** The number-structure study audited equal groups, sharing, factors and place value. The one multiplication idea no game reaches is **splitting an array into two you know**: 7 rows of 6 is 5 rows of 6 and 2 more rows of 6 (the distributive property, CCSS 3.OA.B.5 and 3.MD.C.7c), and its grade 4 use, 3 rows of 14 as 3 rows of 10 and 3 rows of 4 (4.NBT.B.5). A search of the docs for *distributive*, *partial product* and *break apart* finds only a grade 6 mention in the [additional subjects](subjects/additional-subjects.md) list. [Meadow Pens](../GAMES.md#meadow-pens) 5 adds the areas of an L-shaped field split into two rectangles (3.MD.C.7d, additive area), which is the nearest neighbour: it splits a shape that is not a rectangle, and it never asks her to use one part she knows to find another.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Math Learning Center *Number Pieces* ([App Store](https://apps.apple.com/us/app/number-pieces-by-math-learning/id605433778), [MLC on arrays](https://www.mathlearningcenter.org/blog/array-model-multiplication-and-division); listing and post opened) | Free iPad manipulative | Small arrays in *Number Frames*, then larger arrays of tens and ones with an edge "measuring tape" and a partial-product finder for double-digit products | The array split at the ten, each part labelled by its own size | An open canvas with no goal; three-digit products |
| MLC *Number Frames* and *Geoboard* ([MLC apps](https://www.mathlearningcenter.org/apps); search summary) | Free iPad manipulatives | Counters in frames for simple arrays; a pegboard for area | Arrays small enough to count before they are split | No feedback, no ending |
| Montessori multiplication bead board and bead bars ([bead board lesson](https://montessorimom.com/lesson-day-78-multiplication-bead-board/), search summaries; introduced about age 5 to 8) | Classroom material | Bars of one colour laid in rows ("3 taken 4 times"), then the bead board for each table | One colour per row length, so rows are seen as equal before they are counted | Table-by-table drill as the goal |
| [Prime Climb](https://mathforlove.com/games/prime-climb/) (Math for Love; opened; 10+, or 8+ with an adult) | Board game | Each number coloured by its factors; dice arithmetic on the way to 101 | Colour that shows what a number is made of (two parts of an orchard in two shades) | Knocking players back; racing |
| NRICH *Factors and Multiples*, *The Factor Game* (cited in the [number-structure study](subjects/number-structure.md#similar-games-apps-and-physical-play)) | Paper and classroom games, 7–16 | Chains and scoring over factors | Already used for levels 4–6 | Losing as the end |
| Times-tables drill apps (recalled; for example Times Tables Rock Stars) | App | Speed tiers, leaderboards | Nothing | Timers, ranks, streaks; recall from memory is not this game's goal |
| Egg cartons, muffin tins and a fork on a sheet of stickers (recalled) | Off screen | Fill a carton in rows; lay a fork across to split it | The split itself: "two rows of six and four rows of six" | — |

**Learning references.**

- CCSS 3.OA ([opened](https://www.thecorestandards.org/Math/Content/3/OA/)): 3.OA.A.1, "interpret 5 × 7 as the total number of objects in 5 groups of 7 objects each"; 3.OA.B.5, "Apply properties of operations as strategies to multiply and divide"; 3.OA.C.7, fluency within 100 by strategies.
- CCSS 3.MD.C.7c ([opened](https://www.thecorestandards.org/Math/Content/3/MD/)): "Use tiling to show in a concrete case that the area of a rectangle with whole-number side lengths a and b + c is the sum of a × b and a × c. Use area models to represent the distributive property in mathematical reasoning."
- CCSS 4.NBT.B.5 ([opened](https://www.thecorestandards.org/Math/Content/4/NBT/)): multiply "a whole number of up to four digits by a one-digit whole number" and "Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models."
- England's national curriculum ([opened](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)): Year 4, "solve problems involving multiplying and adding, including using the distributive law"; Year 5, "recognise and use square numbers" and "recall prime numbers up to 19".
- Barmby, Harries, Higgins and Suggate, *The array representation and primary children's understanding and reasoning in multiplication*, Educational Studies in Mathematics 70(3), 2009 ([repository record](https://dro.dur.ac.uk/5458); **abstract through search summary only**): children using on-screen arrays showed both benefits and difficulties; the related paper notes England's 2006 framework recommended arrays for introducing the distributive law. *Use:* an array is not self-explaining, so the split is drawn as a visible path and spoken, not left for her to see.

## What makes sense here

- **Fits as levels 7–9: a path through the orchard.** The array she already plants is the area model in trees. A path laid across the orchard splits it into two smaller orchards; she counts each part by rows, as at level 1, and adds them. The new action is small (read two parts, then the whole), the learning is specific (a big array is two arrays she knows), and it closes the ladder from equal groups (1) through commutativity (2), unknown factor (3–4), factors and primes (5–6) to the distributive property (7–8) and place-value multiplication (9).
- **Choosing where the path goes** is the meaningful decision once the fixed path is understood: 7 rows can split as 5 and 2, or 4 and 3, or 6 and 1. Every split is right; the reasoning is choosing one whose parts she can count. That is a free choice, never a miss.
- **Products stay under 100.** The number-structure study found no hundreds on the island and gave them to NS6 *Hundred crates*. Levels 7–8 stay within 3.OA.C.7 (within 100); level 9 stays at 2 to 5 rows of 11 to 19 (at most 95).
- **Reuse, not a new scene.** Levels 7–9 reuse the basket levels' picture bed and arrows (`BasketOrchard`, `basketLayout`, `cellSize`) and the number pads of levels 1–3. No new shared helper, no save field, nothing kept.
- **Fresh content in levels 1–4** is cheap and makes replay vary: levels 1–2 have only three possible rounds each.
- **Does not fit here:** timed fact recall; square numbers as their own level (a cheap copy of level 6, but it teaches a name, not a structure; a sketch below); multiplicative comparison ("3 times as many", the [ratio study](subjects/ratio-proportion.md)); hundreds and two-digit by two-digit products (NS6 and beyond 100).

**Long-term arc.** School 6–8: count arrays by rows and columns (1–3). About 8–9: unknown factors, factors and primes (4–6), then a split at five (7). Upper school, 9–12: choose the split (8) and the split at ten (9), the bridge to written multiplication.

## Experience and presentation

- **First unsupported action** at level 7: tap the sign of the top part and hear "5 rows of 4" counted, then choose its total. The path is already laid, so the only new idea is that the orchard has two parts.
- **Touch-down and consequence.** A pad darkens at touch-down; a right part total lights that part's trees in one shade (top part green, bottom part gold) and writes its number on a wooden sign beside it; the whole lights both. At level 8 each arrow press slides the path one row with a soft pentatonic tick and the two part shades follow it, so the split is seen before it is chosen.
- **Art example.** The path is a `Graphics` strip of sandy brown (`wood` tones from `src/art/palette.ts`) between two rows, with three round stepping stones and a tiny wheelbarrow at its end; each part's sign is a rounded wooden board with a stake, drawn as the basket levels draw the row-count card. The two-shade trees reuse `tree(fruit)` with a tinted ground disc under each.
- **Replay variety without a rule change.** Seeded orchard sizes, the fruit (apple, pear, plum), which end the wheelbarrow stands, and at level 9 whether the ten is on the left or the right.
- **Reasoning versus reading and precision.** Totals are spoken and pictured; the pads show numerals, as at levels 1–3, and every pad press speaks its number. Nothing needs a precise touch: the trees are pictures, and the signs, arrows and pads are at least 100 units.
- **Supported ending.** Two orchards make a round, one sticker, with help or without. Tapping a sign always re-counts its part by rows for free.
- **Co-play.** *Path chooser and counter*: at level 8 the grown-up chooses where the path goes and the child counts the parts, then they swap. Solo play is unchanged.
- **For a person to judge.** Whether an eight-year-old adds the two parts or recounts the whole orchard tree by tree; whether she chooses the five split when free, or a random one; whether "rows of 10 and rows of 4" reads as one orchard or two.

## Proposed ladder

### Fresh content inside existing levels

Every shape stays within 5 rows and 5 columns (CCSS 2.OA.C.4, cited in [IDEAS](../IDEAS.md)), so `orchardLayout`'s 100-unit row bands are unchanged.

- **Level 1:** add 2×2 and 4×2 (pool 2×2, 2×3, 3×2, 3×3, 4×2; totals 4 to 9).
- **Level 2:** add 4×3 and 5×2 (pool 2×4, 3×4, 2×5, 4×3, 5×2). A round's two orchards are never turns of each other (3×4 and 4×3 never together), and level 2 holds no square, since a turned square shows no change.
- **Level 3:** add 4×4 and 5×3 (pool 3×5, 4×5, 5×4, 5×5, 4×4, 5×3). On a square (4×4, like the existing 5×5) `choicesFor` drops the row-count decoy because the row count equals the answer; the builder keeps 4×4 and accepts that, as 5×5 already does, or swaps it for 4×3.
- **Level 4:** the second basket also draws 14 and 21. Each has two right row counts in its range (14: 2 and 7; 21: 3 and 7), as every level 4 basket must, and their seven-row deals pass the 18-unit cell test.

Rule tests: every pool shape is at most 5×5; level 2's round pairs are never turns and never squares; every level 4 basket has at least two right row counts and a leftover opening; the cell size stays at least `MIN_CELL` for every reachable deal at the four test views. Cost: `logic.ts` and its tests only; no voice, art, how-to or bot change (the bot reads the same rules).

### New levels on top

The [definition](../definitions/orchard-rows-path.md#where-the-dives-text-changes) supersedes details below: the levels get their own scene `PathOrchard` instead of the basket scene, level 7 uses rows 7–9, the whole's forgotten-part decoy is the larger part alone, and cell sizes are corrected.

All three run in the basket scene's picture bed (rows are pictures, not targets) with two part signs, and finish after two orchards through `ctx.finish`.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *A path at five* | school, about 8–9 | 7 rows of 4 with a path after the fifth row. Pads: the top part (20), then the bottom part (8), then the whole (28) | Each part's total, then the whole | A wrong pad is one miss with a spoken reason ("5 rows of 4: 4, 8, 12, 16, 20"); two on one question glow the answer (one hint, as at levels 1–3). Tapping a sign re-counts its part for free | Orchards are 6 to 9 rows of 3 to 9, product at most 81; the top part is always 5 rows; part decoys are one row more and one row fewer (`total ± each`), never the answer; the whole's decoys include **the top part alone** (the forgotten small part) and the whole plus or minus one row | `isBasketLevel` (`level >= 4`) opens `BasketOrchard` for 7+, so the scene needs a path mode; `makeRound`'s last branch treats every level other than 4 and 5 as the prime level and must become `level === 6`; pads move into `basketLayout`; new `orchard.path*` voice lines; how-to steps and the `{ from: 4 }` note bounded to `to: 6`; `LEVELS` school max, `describeLevel`, `coplayHint`; the bot answers pads from the rule |
| 8 | *Choose the path* | school top, upper school | 7 rows of 6, the path after row 1. Arrows move it (1 to 6); *Path here* (the act button) lays it; then pads for each part and the whole | Where to split (free), then the three totals | Moving the path is free and any split is right. Pads as at 7. A hint never chooses the split for her | Orchards 6 to 9 rows of 6 to 9 (at most 81); every split from 1 to rows − 1 gives parts that add to the whole; the arrows' range never leaves an empty part; the bot's split (five where possible) finishes every seed with no miss | Reuses the row-count control and card (the card shows the two part heights); one new act label picture (a path); a co-play role |
| 9 | *A path at ten* | upper school, about 9–10 | 3 rows of 14, a path down the orchard after the tenth tree. Pads: the tens part (30), the ones part (12), the whole (42) | The two parts' totals, then the whole | As at 7; the reason counts the tens part by tens ("10, 20, 30") | 2 to 5 rows of 11 to 19, product at most 95; the path is always after ten; decoys as at 7 (the tens part alone is a whole decoy) | A vertical path; cells at 19 across are about 27 units landscape and 36 portrait, above `MIN_CELL`; the layout test runs every reachable size |

Hints and the bot follow levels 1–3's pad rule (glow the answer after two misses). Levels 7–9 add no save field. Couch: none (no couch entry today).

### Younger-band openings

None proposed; see *Left out on purpose*.

### Easier entries and levels between existing ones

None. Level 1 is already a gentle entry for school, and the level 4 opening at 12 is the easiest basket. If a later observation finds the step from 6 to 7 too large, an appended *two orchards side by side* (a 5-row and a 2-row orchard of the same width, then pushed together) could sit between them with `order`; it is a sketch, not a slice.

### Left out on purpose

- **A pre-K opening.** Opening a band is a developer decision, the land page must fit at every band, and pre-K already builds equal groups in [Little Helpers](../GAMES.md#little-helpers) 6 and loops jars of an exact size in [Lasso Loops](../GAMES.md#lasso-loops). Not proposed.
- **Count a patch** ([estimation study](subjects/estimation.md) E4, "a Lasso Loops or Orchard Rows mode, decided at definition"). Orchard Rows counts exact arrays; estimating from a sample would blur that rule. Left to its definition, which should prefer Lasso Loops; if it chooses Orchard Rows it appends after 9.
- **Square orchards** (England Year 5 square numbers): a level 6 copy with `isSquare`. A sketch only; it names a set rather than teaching a structure.
- **Hundreds, two-digit by two-digit, written methods.** NS6 *Hundred crates* owns hundreds; nothing here crosses 99.
- **Speed, timers, streaks.** As everywhere.

## Decisions for the developer

None blocking. Under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) this dive adopts its leans: levels 7–9 extend Orchard Rows (the same action of reading rows of trees); products stay under 100; no pre-K opening. Person checks join [DEVICE-CHECKS](../DEVICE-CHECKS.md) when 7–9 are built.

## Build slices, in order

1. **Fresh orchards and baskets** (batch `orchard-rows 2`; built 2026-11-03): the level 1–4 pool additions above, in `logic.ts` and its tests. Check tier: game rules, so `npm run typecheck` and the Orchard Rows rule tests only.
2. **Define levels 7–9, *a path through the orchard*** (defined 2026-11-03, [definition](../definitions/orchard-rows-path.md), [PR #1178](https://github.com/rjdunlap/neo/pull/1178)): the path picture and its layout with pads in `basketLayout` at the four views, part signs, the pad decoys, accounting, voice lines, how-to steps (and bounding the level 4–6 note), the bot, the `makeRound` and `isBasketLevel` couplings, rule tests and the check tier.
3. **Build levels 7–9** (batch `orchard-rows 3`, [definition](../definitions/orchard-rows-path.md) and [batch](../GAME-BATCHES.md#orchard-rows-3-a-path-through-the-orchard); new-interaction tier: typecheck, unit tests, one scripted play of levels 7 and 9 with one wrong pad and one hint, one portrait screenshot, `fingerdemo` at 7, 8 and 9). **Built 2026-11-03** ([PR #1183](https://github.com/rjdunlap/neo/pull/1183)); build note in the [archive](../archive/COMPLETED-2026-10-09.md#orchard-rows-levels-79-a-path-through-the-orchard-2026-11-03).

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
