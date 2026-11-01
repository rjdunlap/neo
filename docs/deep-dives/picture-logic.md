# Picture Logic deep dive

*ID `picture-logic` · band grown-up · levels 1–4 on 2026-11-01 · session `claude/dive-picture-logic`, [PR #1089](https://github.com/rjdunlap/neo/pull/1089)*

## The game today

A grown-up nonogram (Picross) puzzle in Lantern Lake, built on Pixel Pictures' logic levels. A square grid hides a picture; the numbers beside each row and above each column give the runs of filled squares in that line, in order. She (here, a grown-up) fills what the numbers allow and crosses out what they rule out; when exactly the picture's squares are filled, the picture shrinks into view, takes its colours row by row and is named ("It is a sailboat!"). By touch: a tap fills or empties a square, a drag paints a run along its row or column; **Fill**, **Cross** and (when the picture is bigger than its window) **Slide** are tools, **Hint** and **Start over** are buttons; every square and button is at least 64 units, so the 10 and 15 across pictures slide under pinned clue strips. On the couch a stick moves a cursor and the held bottom or left button paints a run. A line's clue turns grey when its runs match and red when nothing it allows fits the marks, judged from the clue alone ([GAMES.md](../GAMES.md#picture-logic)).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What the player decides | Pool |
| --- | --- | --- | --- | --- |
| 1 | A small 6 by 6 picture | grown-up | Which squares the run numbers force, line by line | Pixel Pictures' 6 by 6 pictures that line logic solves (up to 7) |
| 2 | A 10 by 10 picture with a few passes of logic | grown-up | The same, with clues that need two or three passes | `EASY_10`: 5 pictures |
| 3 | A 10 by 10 picture that needs more care | grown-up | More passes, more crossing to unlock a line | `HARD_10`: 5 pictures |
| 4 | A big 15 by 15 picture | grown-up | Long lines, sliding the picture | `BIG_15`: 3 pictures |

One picture a round; a seed picks it. **Accounting:** a filled square outside the picture is never refused, shown or counted (decided 2026-10-23, [GAMES.md](../GAMES.md#picture-logic)), so `misses` is always 0 and only hints adapt the level. Every fill counts toward the couch score (fills over the picture's squares); crosses and emptying are free.

**Rules and tests (`logic.ts`, `logic.test.ts`):** `deductions` finds every square one line decides from what is known (reusing Pixel Pictures' `placements`); `hintFor` names a wrong mark first, otherwise such a square, preferring a fill and the square nearest the cursor, and says *"In row 4, the clue 6, 2 leaves only one way to fit."*; `solvableByLines` admits a picture only if line logic alone finishes it (so its answer is unique); `passesNeeded` separates the easier and harder 10 by 10 banks. Tests cover each of these, the brushes, the touch frame at 64 units in every view, strokes and the demonstration's `headStart`.

**Couch:** a trip stop (`twin` face-off) on the 6 and 10 across levels; two frozen courses in `course.ts`, *Pond Pictures* (level 3, par 182) and *The Big Pictures* (level 4, par 230), pinned by a clue test and a `version`.

**Known gaps:** level 4 has three pictures and levels 2–3 five each, so a regular player sees repeats within a week; the hint names the line but not *why* the clue decides the square, so it does not teach a reusable step; there is no gentler way in than a 6 by 6 (the [IDEAS](../IDEAS.md) "Levels for what is already built" note asks for a 5 by 5 picture); the notebook's "colored Picture Logic puzzles" and the GAMES entry's "not built" list (a replay of the best way, pictures she draws, colored puzzles, 20 by 20) are open. Person checks: none recorded for this game beyond the shared grown-up touch checks.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Nintendo/Jupiter, *Mario's Picross* (1995) and *Picross DS* (2007) | Handheld nonograms | 5 by 5 tutorials up to 15 by 15, larger grids in DS; a start-of-puzzle hint that reveals a row and a column | A 5 by 5 opening (**level 5**) | A timer that subtracts time for wrong fills; refusing a wrong fill |
| Jupiter, *Picross S* series ([Wikipedia](https://en.wikipedia.org/wiki/Picross_S), opened via search) | Switch nonograms | Four modes: classic, **Mega Picross** (some clues span two lines), **Color Picross** (S3 on: each clue number has a colour; runs of different colours may touch), **Clip Picross** (a large picture assembled from small grids, unlocked by progress) | Colour clues as a level of their own (**level 6**); a bigger, harder 15 by 15 bank (**level 7**) | Mega clues (see *Left out*); Clip pieces unlocked by completing other puzzles |
| Simon Tatham's *Pattern* ([manual](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/pattern.html), opened via search) | Free desktop/web puzzle collection | Width and height only; every generated grid is solvable | Confirms size alone is a sufficient ladder for a plain mode | — |
| Ucdevs, *Nonograms Katana* ([App Store](https://apps.apple.com/app/id1037710023); [fan wiki tips](https://nonograms-katana.fandom.com/wiki/Tips_for_solving), search descriptions) | iOS app | Thousands of puzzles, black and white then colour, up to very large grids; a player puzzle maker | "Solve one colour first" as the colour level's hint wording; a maker exists in the genre (see *pictures she draws*, below) | Ads, paid hints, answer purchases |
| Conceptis, *Pic-a-Pix* (logic-art puzzles) | Print and app | Graded by technique; colour Pic-a-Pix; named solving techniques in its tutorials | Naming the technique a hint uses (**batch 1**) | Paid packs |
| [Wikipedia, *Nonogram*](https://en.wikipedia.org/wiki/Nonogram) | Reference | Lists the standard line techniques: simple boxes (the overlap of a run's leftmost and rightmost places), simple spaces, forcing, glue, joining and splitting, punctuating, and that colour nonograms drop the gap between different colours | The four plain techniques that the built `deductions` already covers, by name (**batch 1**) | Multi-line contradiction and guessing techniques (the game admits only line-solvable pictures) |
| Ueda and Nagao, *NP-completeness results for nonogram via parsimonious reductions* (1996, via Wikipedia) | Complexity result | — | Why the banks stay authored and filtered by `solvableByLines` rather than generated | — |
| Squared paper (the game's own off-screen card) | Physical | Any size | Already the off-screen suggestion | — |

No learning standard applies to a grown-up puzzle; AGENTS' rule that grown-up wording never claims a brain-training benefit holds for every line below.

## What makes sense here

The game is complete, fair and well tested; it lacks **variety** (thirteen authored 10 and 15 across pictures), **a way in** (a 5 by 5), **a hint that teaches** and **one new rule** (colour). All four fit the built tap, drag and stick actions:

- **More pictures** are pure data: each new drawing passes the existing tests (square, palette letters, named, line-solvable, not a scatter) and sorts into a bank by `passesNeeded`.
- **Named hints** reuse `deductions`: the reason a line decides a square can be read from the line's placements and what is known, so the hint can say "the run is long enough that it covers this square however it sits" instead of only "one way to fit".
- **A 5 by 5 entry** answers the IDEAS note and the AARP finding that many older players want a gentler start; appended easy entries now work through `order` and `entryLevels`.
- **Two colours** is the genre's best-known second rule (Picross S3 on, Katana, Pic-a-Pix). Pixel Pictures already has `colorClues`/`colorRuns`, and its batch 1 adds `colorLineSolvable`, so the solver is shared rather than rewritten.

Owned elsewhere: younger nonograms are [Pixel Pictures](pixel-pictures.md) (preschool–school, its logic and colour-clue levels and its queued bigger and two-colour levels), so this game does not open a school band.

**Long-term arc:** a new grown-up starts on a 5 by 5 picture, learns the four named line steps from hints, moves through the 6, 10 and 15 across banks with enough pictures not to repeat in a week, meets colour clues as their own level, and the couch shelf can later take a harder 15 by 15 course.

## Experience and presentation

- **First unsupported action:** on a level-5 picture at least one line is forced from empty (a full line, a 0 line, or a run more than half the line), so the first drag is certain; the named hint says which.
- **Touch and consequence:** a filled square pops in at once (as built), a run paints along under the finger, a line's clue goes grey when it matches. Readiness returns at once; no animation lock.
- **Variety without changing the rule:** new pictures (a snail, a teapot, a whale, a kite, an owl, a cactus; 15 across: a windmill, a ship, a giraffe) on the same rules; nothing cosmetic beyond the picture itself.
- **Reasoning versus motor:** 64-unit squares at every size; the 5 by 5 draws at the 96-unit cap. The thinking is in the clues; colour adds one tap to choose a pot, not precision.
- **Supported ending:** Hint is always there and only counts as help; Start over clears without touching the count; one sticker per finished picture. A grown-up stops when a picture is named.
- **Co-play:** the built coplay hint ("ask which row or column has a clue that leaves only one way to fit") gains the technique names, so one person can point at a line and the other say why. *Pictures she draws* (below) would give the child a role, after Pixel Pictures' own kept designs exist.
- **Art example:** level 6's colour pots are two 72-unit rounded `Graphics` swatches in the existing button column (Fill becomes the selected pot, drawn with `swatch[colour].fill` and a white ring when chosen); a colour clue number is drawn in its `swatch[colour].dark` ink on the same paper, so the clue strips need no new layout.
- **Needs a person or device:** whether a grown-up new to nonograms finishes the 5 by 5 without the card; whether the named hints read as help or as lecturing to a practised solver; whether two-colour clue numbers are distinguishable on the iPad (red and orange are the risky pair, so level 6 uses blue with one warm colour).

## Proposed ladder

### Fresh content inside existing levels

**More pictures (batch 1).** `EASY_10` 5 → 8, `HARD_10` 5 → 8, `BIG_15` 3 → 5, each a new named drawing in `pictures.ts`; the existing tests already assert every picture is valid, line-solvable and that the harder bank needs more passes than the easier. Add one test that every `EASY_10` picture needs fewer passes than every `HARD_10` one (not only on average, if that is what the built test checks; the building session reads it) and that no two pictures share a name. Pictures used by a course stay unchanged; new ones join banks only.

**Named hints (batch 1).** `hintFor`'s fill and cross hints gain a `why`, computed from the line's placements against what is known (never from the answer):

- `full`: the clue plus its gaps fills the line exactly, so every square is decided (*the clue fills the whole row*).
- `zero`/`done`: the clue is 0, or the line already holds its runs, so the rest is empty (*row 3 already has its runs; the rest stays empty*).
- `overlap`: the line has no other known squares and the run is long enough that every place it can sit covers this square (*simple boxes*: *a run of 7 in 10 squares always covers the middle four*).
- `fits`: anything else, the built sentence (*the clue leaves only one way to fit*).

Each kind has its own voice line in `voice-script.ts` (device speech until clips render). A rule test asserts, on every bank picture and many partly-solved states, that a named hint's condition holds on the line when given (the arithmetic: clue sum plus gaps equals the size for `full`; run length more than half the free stretch for `overlap`), and the built test that following every hint from an empty grid finishes with exactly the par still passes. Applies at every level; no bot change (the bot paints from the solution).

### New levels on top

| Level | Name | Band window | First round | What the player decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | A small 5 by 5 to start | grown-up entry (order `[5, 1, 2, 3, 4]`, `entryLevels: [5]`) | One 5 by 5 picture; at least one line decided from empty | The same fills and crosses on a grid that shows whole at 96-unit cells | As built: no misses, hints count as help; the first hint is a named `full`/`zero`/`overlap` | Every level-5 picture is 5 by 5, line-solvable in at most 3 passes and has a line decided from empty; the touch frame draws it whole, cells larger than level 1's, in portrait and landscape | `PLANS.size` admits 5; a pool from Pixel Pictures' 5 by 5 pictures that line logic solves (5) plus new ones if fewer than four pass; `describeLevel`; how-to card step scopes shift (`from: 2, to: 4` stays, the order puts 5 first). Couch trip and courses unchanged |
| 6 | Two colours | grown-up, after 3 (order `[5, 1, 2, 3, 6, 4]` once level 7 exists: `[5, 1, 2, 3, 6, 4, 7]`) | A 10 by 10 picture in blue and one warm colour; clue numbers drawn in their colour | Which colour each run is, and that runs of different colours may touch with no gap | As built; a wrong-colour fill is a wrong mark for the hint (named first) but not a miss; the hint wording "solve one colour first" when a colour's lines alone decide | Every level-6 picture uses exactly two colours and is solved by colour line logic alone (`colorLineSolvable`, from Pixel Pictures batch 1); `deductions` on colour clues matches the picture from many partly-solved states; following hints from empty finishes at par | New interaction: Fill becomes two colour pots; marks hold a colour; `lineStatus` and `isSolved` by colour; clue numbers in `swatch[c].dark`; the bot picks a pot before a run; how-to step scoped to 6. Couch: kept off the trip and courses until a controller colour switch is defined |
| 7 | A 15 by 15 that needs more care | grown-up top (order ends `…, 4, 7]`) | One 15 by 15 picture from a new `HARD_15` bank | Long lines needing several crossing passes | As built | Every `HARD_15` picture is line-solvable and needs more passes than every `BIG_15` picture | Data and a `PLANS` row; `poolFor` picks the bank by level. A later couch course from this bank is possible (version 1, frozen) but not queued |

### Younger-band openings

None. The IDEAS row "touch forms of the couch puzzles, school about 8–9" is answered for nonograms by [Pixel Pictures](pixel-pictures.md), which already plays clue and colour-clue pictures at 100-unit cells for preschool–school and has bigger and two-colour levels queued; a school opening here would duplicate it and could not fit a 10 by 10 at 100 units with its clue strips.

### Easier entries and levels between existing ones

Level 5 is the appended easy entry (stable ID, placed first by `order`, declared in `entryLevels`). Level 6 sits between 3 and 4 by `order`; level 7 goes on top. No saved level or pin moves; no decision is open.

### Left out on purpose

- **Mega Picross clues** (a number spanning two lines): the clue strip would need two-line brackets at 64-unit cells, and the rule is hard to say aloud; revisit only if a person check asks for more variety after colour.
- **Clip Picross** (a big picture from small grids unlocked by progress): an unlock earned by finishing puzzles; the creature-world rework's permanent unlocks may later want a form of it, but that is a rework definition, not this dive's.
- **20 by 20**: 1,280 units of squares before clues, so most of the picture is always out of view; it needs pinch-zoom that does not steal paints, and its own definition.
- **A replay of the line-logic solve** ("watch the lines solve it") after the reveal: attractive, but it changes the finish flow; noted for a later definition after named hints show whether grown-ups want the reasoning shown.
- **Pictures she draws**: a child's kept Pixel Pictures design (its level 10, *My own picture*, not yet built) set as a grown-up puzzle when it is line-solvable, giving her a maker's role. A sketch, after Pixel Pictures batch 4; it would need the treehouse picture board's shape and a solvability check at keep time.
- **Timers, time penalties for wrong fills, refusing a wrong fill, hint roulette at the start, daily puzzles, ads and paid packs** from the references.

## Decisions for the developer

None. The colour level keeps the 2026-10-23 accounting (only hints adapt); pictures she draws and the solve replay are sketches, not calls.

## Build slices, in order

1. **Fresh pictures and named hints (batch picture-logic 1).** Eight easier and eight harder 10 by 10 pictures, five 15 by 15; the `why` on fill and cross hints with four voice lines. *Check:* existing-interaction tier: typecheck, the game's rule tests, one filtered regression play at level 2 asking for one hint (its named line); bot unchanged, no `fingerdemo`.
2. **Level 5 a small 5 by 5 to start and level 7 a 15 by 15 that needs more care (batch picture-logic 2),** after batch 1 (shares `pictures.ts` and the bank tests). Order `[5, 1, 2, 3, 4, 7]`, `entryLevels: [5]`. *Check:* new levels on the existing interaction: typecheck, rule tests (order, entry, the 5 by 5 frame), one browser play of level 5 and of level 7 with one hint, `fingerdemo` at 5 and 7, one portrait screenshot of level 5.
3. **Level 6 Two colours (batch picture-logic 3),** after batch 2 (shares the order) and after [Pixel Pictures batch 1](pixel-pictures.md#build-slices-in-order) (its `colorLineSolvable`). *Check:* new-interaction tier: typecheck, rule tests, one play of level 6 with one wrong-colour fill and a hint naming it, then to the sticker; one portrait screenshot of the colour pots and clues; `fingerdemo` at 6; one build. The building session confirms the couch trip keeps to its built levels.
4. *Not queued:* a couch course from `HARD_15`, the solve replay, Mega clues, 20 by 20 and pictures she draws (each needs its own definition).

## What was built in this session

Nothing: a deep dive session is research and ideation only (links and `git diff --check` ran).
