# Garden Rows deep dive

*ID `garden-rows` · bands pre-K, school · levels 1–6 on 2026-10-31 · session `claude/dive-garden-rows`, [PR #1072](https://github.com/rjdunlap/neo/pull/1072)*

## The game today

She chooses a flower packet and taps an empty spot to plant it. The bed must have one of each flower in every row, and from level 2 in every column too. This is a Latin square drawn as a flower bed, after picture sudoku. The learning purpose is deduction from structure: she looks along a row and a column to see what is missing and what is ruled out (CCSS Mathematical Practice 1, make sense and persevere, and 7, look for and make use of structure). Puzzle Peaks is its land. `src/games/garden-rows/logic.ts` holds every rule.

| Level | Plan (`describeLevel`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Plant the missing flower in each row of a 3 by 3 bed (2 beds, 3 empty spots, rows only) | pre-K | Which flower is missing from a row |
| 2 | Rows and columns, 3 by 3 (2 beds, 4 empty spots) | pre-K | A spot whose row and column together leave one flower |
| 3 | 4 by 4, 6 empty spots (2 beds) | pre-K, school | The same, with four kinds |
| 4 | 4 by 4, 9 empty spots (2 beds) | school | Chains of forced spots |
| 5 | 4 by 4, 11 empty spots (1 bed) | school | Longer chains, with fewer flowers to start from |
| 6 | 5 by 5, five kinds, 14 empty spots (1 bed) | school | The same, on five kinds |

Windows: pre-K 1–3 and school 3–6. **Content pools:** each bed is generated from the seed. A rows-and-columns bed is a shuffled cyclic Latin square with flowers removed one at a time, and a removal is kept only while exactly one way to finish remains. The flowers are always the first `size` of the five (daisy, tulip, rose, bluebell, sunflower), so every 3 by 3 bed is daisy, tulip and rose, and every 4 by 4 bed leaves out the sunflower.

**Mistakes and help.** A planting that repeats a flower in its row or column will not stay. It counts as a miss, both clashing spots flash red, and the pet names the flower and whether the clash is in the row or the column. A planting that fits but leaves an empty spot with nothing that fits (`deadEnds`) also counts as a miss: the dead spot flashes orange and the pet says to take one out. After two misses `hintFor` glows either one of her flowers that does not belong (a fix) or the tightest empty spot together with its packet. Taking out one of her own flowers is always free; the flowers the bed started with stay.

**Couch.** Grown-ups play levels 3–6 with a ring cursor. Turns are a twin face-off scored on wrong plantings, and the bot plants with `nextPlanting`. There is no couch course. **Known gaps:** no person has watched a pre-K child play it. The roadmap's "Garden Rows' boxes" row has been undefined since 2026-10-10, waiting on the island forms of couch puzzles. That condition has since been met: Sudoku Garden got its touch form on 2026-10-13 (see [What makes sense here](#what-makes-sense-here)).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Picture sudoku for early years ([TES dinosaurs and cupcakes 4×4](https://www.tes.com/en-nz/teaching-resource/exclusive-picture-sudoku-game-4x4-logic-puzzles-dinosaurs-and-cupcakes-for-young-learners-13370038), [butterflies, preschool cut-outs](https://www.tes.com/teaching-resource/butterflies-sudoku-fun-early-years-logic-and-maths-game-13266842), [candy, 4 levels](https://www.tes.com/teaching-resource/candy-sudoku-hands-on-logic-puzzles-13573495)) | Printable and hands-on | 4×4 with 2×2 blocks is the beginner grid; the levels are fewer givens; laminated picture tiles are moved by hand | 4×4 picture boxes as the next rule after rows and columns, and fresh picture sets | Worksheets with no feedback |
| [Math Equals Love seasonal 4×4 picture sudoku](https://mathequalslove.net/winter-sudoku-4x4-puzzles-with-pictures) | Classroom printables | New themes on the same 4×4 box rule | Theme variety keeps a fixed rule fresh | — |
| [Picture sudoku 3×3 to 6×6 pack](https://payhip.com/b/5AP2S) | Paid printable | Grows the grid from 3×3 to 6×6 | A 3×3 rows-only start matches level 1 | Above 4×4 boxes, the island already has grown-up Sudoku Garden |
| Sudoku Garden (the island's grown-up game, [GAMES.md](../GAMES.md#sudoku-garden)) | 6×6 and 9×9 with boxes | Technique tiers | Its box rule and conflict display | Numbers and the grown-up sizes |
| KenKen ([Davis, Berkeley Math Circle](https://mathcircle.berkeley.edu/sites/default/files/archivedocs/2009_2010/lectures/0910lecturespdf/kenken_tom_davis.pdf), [Breiter, NCTM](https://webpages.charlotte.edu/~hbreiter/NCTM.pdf)) | Latin square with arithmetic cages | 3×3 and 4×4 first; single-cell cages are free | A shape constraint other than rows (boxes, here) | Arithmetic: it would turn deduction into sums, and Counting Cove does that |
| Futoshiki ([Brown handout](https://www.math.brown.edu/dkatz/futoshiki-handout.pdf)) | Latin square with < and > signs | Fewer givens, more signs | Nothing now | Inequality symbols are a reading load at 6–8 |
| Skyscrapers ([UK Puzzle Association guide](https://www.ukpuzzles.org/ukpl/library/Skyscrapers%20Puzzle%20Guide.pdf)) | Latin square of heights with "how many visible" edge clues | 4×4 first; a clue of N or 1 gives a whole line | A possible future level: flowers of four heights, and a bee at the gate counts the ones it sees | It needs ordered heights; noted as a proposal only |
| Takuzu / Binairo / LinkedIn Tango (already an [IDEAS row](../IDEAS.md#new-candidates-for-parents-and-older-kids), *Two-flower beds*) | Two symbols, equal counts per line | 6×6 and larger for the no-three rule | Two packets and the equal-count rule, at 4×4 | The no-three-in-a-row rule, which first bites at 6×6 (grown-up) |
| LinkedIn Queens ([rules](https://queensultimate.com/blog/how-to-play-queens)) | One per row, column and coloured region, no touching | Grid size | Coloured regions as a visible box shape | Placing one per region is a different game |

Learning references: CCSS Standards for Mathematical Practice MP1 and MP7 ([TERC handout](https://invcourse.terc.edu/sml/documents/s0/SML_PDF_O.1_CCSS_MP.pdf)). The grown-up card names what a game asks of her ("looking along a row and a column"), and never claims a school or attention benefit.

## What makes sense here

- **Fresh flower sets.** Beds are always the first `size` flowers, so a 3×3 bed is always daisy, tulip and rose. Choosing the kinds from all five, seeded, makes replay look new without changing the rule. The same seed still gives the same couch twin beds.
- **Revision is the missing older mode.** Every level today fills empty spots. AGENTS lets older puzzles require revision with an explanation of what happened. **Mend the bed** shows a full bed with two flowers swapped. Removal is already free, so it uses the existing interaction.
- **Boxes at 4×4 are the classic next rule** for 6–8. Sudoku Garden is numbers at 6×6 and 9×9 for grown-ups, so a picture 4×4 with hedged 2×2 boxes does not duplicate it; it is the step before it. The 2026-10-23 rule S8 adopts the lean for identity questions: Garden Rows' boxes are a Garden Rows level, not a Sudoku Garden band.
- **Two-flower beds at 4×4** (the existing IDEAS proposal) change what she counts. At 4×4 the rule is two of each flower per line and no two rows alike, which is a counting rule rather than a "one of each" rule.
- **A younger opening.** The rows-only 3×3 at pre-K level 1 asks "which one is missing?", which preschoolers already do with one row. A single-row entry (ID 10) opens preschool; under S8 this follows the lean (open it).
- **Left as a proposal:** Skyscrapers-style "the bee counts tall flowers" (ordered heights are a new concept and a visibility rule; better as a later study), arithmetic cages, and inequality signs.

The long arc: rows (pre-K) → rows and columns → bigger beds → mending a bed (revision) → boxes → two-flower counting beds. After that the grown-up Sudoku Garden takes over at 6×6.

## Experience and presentation

- **First unsupported action:** at level 1 she plants the one missing flower in a row whose other two are visible. At the preschool entry she does the same in a single row.
- **Touch and consequence:** the packet lifts and rings on touch-down. A planting pops in with a pitched pop, and a clash flashes both spots red with a soft boing and the named reason. A full bed blooms row by row on bell notes. The bed is ready again as soon as the flash fades; nothing locks.
- **Variety on replay:** the seeded flower set (from 5 kinds), the bed, the empty spots, and in Mend the bed which pair is swapped. The rule never changes within a level.
- **Reasoning versus reading, memory and precision:** everything is visible on the bed. No memory is required, and the spoken line repeats the rule. Spots are 100 units at every size; a 5×5 bed is 500 units wide and already fits.
- **Supported ending:** after two misses the glow shows a fix or a spot and packet, and every bed can be finished with help; one sticker per round.
- **Co-play:** one person points at a row and the other plants (the existing coplay hint). For boxes: "Which flowers are already inside this hedge?" Solo works throughout.
- **Art/feel example (code-drawn):** box edges are drawn as a low green hedge, a rounded `Graphics` strip with `swatch.green.fill` and a darker line on the 2×2 boundaries, over the soil, so the boxes read as garden beds without new art. Mend the bed's swapped flowers droop slightly (rotated 8° and scaled to 0.92) only after the first miss, never at the start, so seeing the clash stays her job.
- **Person/device checks:** does a four-year-old read "missing from this row" without the voice? Does a six-year-old see the hedge boxes as a rule and not as decoration? Does Mend the bed read as "fix it" or as "it's broken, I did something wrong"?

## Proposed ladder

### Fresh content inside existing levels

- **F1 Seeded flower sets:** `fullBed`/`makePuzzle` choose `size` kinds from the five with the round's RNG, and the packets show only those kinds in palette order. A rule test asserts: every bed uses exactly `size` distinct kinds from 0–4; the same seed gives the same kinds and bed; across 50 seeds every kind appears at 3×3; uniqueness and the hint tests still pass. Couplings: the packet layout reads the bed's kinds, not `0..size-1`; `FLOWER_NAMES` already covers all five; the couch twin beds stay identical by seed. The bot's `nextPlanting` uses packet indices, so map them through the kinds.

### New levels on top

IDs are appended and never renumbered; the school window grows from 3–6 to 3–9 (`order` is not needed, since 7–9 sit above 6 in play order).

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Mend the bed** | school | A full 4×4 bed in which two flowers in one row have swapped places, so two columns each hold a repeat. Every flower is hers to lift (none is given). Pet: "Two flowers got mixed up! Find them and swap them back." Two beds | Which two flowers are in the wrong place. She lifts them (free) and replants | Lifting any flower is free. Replanting a clash is a miss, as today. A finished bed with no repeat blooms, and **any** valid full bed is accepted. After two misses the glow points at one swapped flower (`hint-fix`), then at its spot and packet | The start bed has exactly two cells differing from a Latin square, both in one row, and exactly two column clashes; swapping them back solves it; `isSolved` accepts any valid repair; the hint from any reachable state leads to a solved bed (a hint target is `solve` of the bed with clashing flowers cleared, else the original solution) | Existing interaction. Needs a `given` all-false start and a full-bed start (today a full bed triggers `bloom`, so guard the start). New voice: `rows.mend`, `rows.mend-hint`. Bot: lift both, replant both. How-to step `{ from: 7, … }`. No couch change |
| 8 | **Hedge boxes** | school | 4×4 with hedges around four 2×2 boxes; 6 empty spots, 2 beds. Pet: "One of each flower in every row, every column and every hedge box." | A spot whose row, column and box together leave one flower | A box repeat is a clash with a new line, `rows.clash-box` ("There is already a {flower} in this hedge box"); both spots flash. Dead ends and hints are unchanged | `Rule` gains `'boxes'`; every bed is a valid 4×4 sudoku with exactly one solution and the planned blanks; `candidates`/`clash` respect boxes; `fullBed` makes box-valid squares (cyclic shifts 0, 2, 1, 3); hint/bot tests are reused | New rule in `logic.ts`, hedge drawing, 1 instruction and 1 clash line. Bot unchanged (`nextPlanting` is rule-generic). Couch: may be added later to the trip's range, not in this slice |
| 9 | **Hedge boxes, fewer to start** | school | 4×4 boxes, 10 empty spots, 1 bed | Longer forced chains across rows, columns and boxes | As level 8 | As level 8 with 10 blanks; generation never fails over 300 seeds | Plan row only |

### Younger-band openings

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | **One row** | preschool (entry), placed before 1 by `order` | One row of three spots, two planted and one empty; three packets; three rounds in one go, the empty spot moving | Which flower is missing | A repeat is a miss with the clash line; the glow shows the spot and packet after two. No columns | A one-row bed has exactly one empty spot and exactly one fitting flower; `entryLevels: [10]`; preschool `order [10, 1]`, range 10/1 | Adds the `preschool` band to `bands` and a preschool row to `LEVELS` with `order`. Lands: Garden Rows starts showing at preschool in Puzzle Peaks (paging is allowed). Needs the decision below. How-to step scoped to 10 |

### Easier entries and levels between existing ones

Only One row (ID 10, above). Pre-K keeps 1–3; no other between-levels are needed, since 3×3 to 4×4 is already stepped by blank counts.

### Left out on purpose

- **Two-flower beds (Takuzu at 4×4).** A counting rule that suits the game. Kept in IDEAS as a later slice after Hedge boxes, because it changes the packet count and the win rule. It could be a level 11 after the boxes are played.
- **Skyscrapers ("the bee counts tall flowers"), arithmetic cages, inequality signs.** New concepts, or a reading load; filed as an IDEAS proposal only.
- **6×6 boxes.** That is Sudoku Garden's grown-up range.
- **Timers or a speed mode** (forbidden).

## Decisions for the developer

None are new. Under the 2026-10-23 standing rule S8, the identity, band and land leans are adopted: Hedge boxes is a Garden Rows level, and One row opens preschool. They are recorded here, not in WAITING-ON-DEVELOPER. Person checks are listed under Experience and presentation and belong in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md) once a slice is built.

## Build slices, in order

1. **Batch garden-rows 1: F1 seeded flower sets + level 7 Mend the bed** (existing interaction, new level). Checks: typecheck; Garden Rows rule tests (the F1 and Mend the bed assertions above); one browser play of level 7 with one wrong replant and the glow, and level 3 with a non-default flower set; `fingerdemo` at 7. **Ready.**
2. **Batch garden-rows 2: levels 8–9 Hedge boxes** (new rule on the existing interaction, new drawing). Checks: typecheck; rule tests; one play of level 8 with a box clash and one of level 9 to its sticker; one portrait screenshot of the hedges; `fingerdemo` at 9. **Ready after slice 1** (they share `PLANS` and the school range).
3. **Batch garden-rows 3: level 10 One row (preschool opening)** (new band). Checks: typecheck; unit tests including the lands and registry band tests; one play of level 10 at preschool; `fingerdemo` at 10; the preschool Puzzle Peaks page screenshot. Ready after slice 1 (it adds `order`/`entryLevels` to the same `LEVELS`).
4. Later, after 2 is played: Two-flower beds (4×4) as level 11, needing its own definition.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
