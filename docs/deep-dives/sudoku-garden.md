# Sudoku Garden deep dive

*ID `sudoku-garden` · band grown-up · levels 1–6 on 2026-11-01 · session `claude/dive-sudoku-garden`, [PR #1102](https://github.com/rjdunlap/neo/pull/1102)*

## The game today

A grown-up number-place puzzle (sudoku): fill a bed so every row, column and box holds each number once. Each square's number sits on a blossom in that number's colour, so a bed reads by colour as well as by digit. By touch (Lantern Lake), tap a square and then a number in the tray; **Marks** pencils instead, **Erase** takes a number or its marks out, **Hint** and **Start over** are buttons, every target at least 64 units. On the couch the stick moves a cursor and the bottom button opens the number tray. A clash turns both squares red with a boing; a square with nothing left that fits turns orange, the first time with a spoken line. Choosing a square also rings every other square holding the same number. **Purpose:** deduction and planning, using techniques a person can name. Home: Lantern Lake (`src/content/lands.ts`), `region: 'puzzle-peaks'`, `bands: ['grownup']`, [GAMES entry](../GAMES.md#sudoku-garden).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What the player decides | Bed |
| --- | --- | --- | --- | --- |
| 1 | A 6 by 6 bed with a few numbers to find | grown-up | Which number is the only one that fits a square (`lone`) | 6 by 6, 14 blanks, grade 1 |
| 2 | A 6 by 6 bed with half of it to find | grown-up | The same with fewer givens | 6 by 6, 21 blanks, grade 1 |
| 3 | A 6 by 6 bed that needs the only-place-left trick | grown-up | Where a number's only square in a house is (`place`) | 6 by 6, 24 blanks, grade 2 |
| 4 | A 9 by 9 bed with plenty of numbers to start | grown-up | Lone numbers on a big bed | 9 by 9, 42 blanks, grade 1 |
| 5 | A 9 by 9 bed that needs the only-place-left trick | grown-up | Only places on a big bed | 9 by 9, 52 blanks, grade 2 |
| 6 | A 9 by 9 bed with a pair or a pointing line to find | grown-up | A naked pair or a pointing (locked) line that rules numbers out | 9 by 9, 55 blanks, grade 3 |

`LEVELS = { grownup: { min: 1, max: 6 } }`, no `order`. **Content pool:** every bed is generated (`makePuzzle` grows a random full bed, removes numbers while the bed stays unique and workable up to the plan's tier, and keeps it only at exactly the plan's blanks and grade). One bed a round. Nothing varies but the numbers; the box shape is always 2 by 3 or 3 by 3. **Accounting** (decided 2026-10-23): a number wrong against the solution is a miss with a boing, a red ring and the spoken `sudoku.wrong` line (at most every four seconds); a hint counts as help; erasing and marks are free. **Help:** `hintFor` first names a placed number that cannot be right, else the next number the techniques place with its reason (lone, only place, or the pair or pointing line that left one number), else the square with the fewest choices. **Couplings:** a ghost-finger `autotouch` (the how-to card plays a bed shortened to ten blanks by `shortBed`) and a couch `autoplay`; the couch trip stop plays levels 1–3 (face-off `twin`, entries over par); two frozen courses, **Six Beds** (par 124) and **Three Big Beds** (par 149), in `course.ts`, version 1. **Not built** (GAMES): a keyboard digit fallback, a daily or random bed on the shelf, 4 by 4 or 12 by 12 beds, killer or other variants. **Person checks open** ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): the stick tray's speed and the blossoms on a TV; the island pause sheet with a real controller; the wrong-number line on an iPad.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Simon Tatham's *Solo* ([manual](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/solo.html), opened) | Free desktop/web collection | Box size (2 by 2 up to letters past 9), difficulty Trivial → Basic → Intermediate → Unreasonable (guessing), plus **Jigsaw** (random block shapes), **X** (both diagonals) and **Killer** (cages with sums) modes | Jigsaw blocks as a garden of irregular patches (**level 9**); small boxes (2 by 2) as an entry (**level 7**); killer cages as a later definition | The Unreasonable grade (guessing and backtracking) |
| Zach Gage and Jack Schlesinger, *Good Sudoku* ([Pocket Gamer](https://www.pocketgamer.com/articles/083617/good-sudoku-aims-to-achieve-the-impossible-by-teaching-me-how-to-play-and-enjoy-sudoku/), [Vice](https://www.vice.com/en/article/good-sudoku-is-making-me-good-at-sudoku), [Tools and Toys](https://toolsandtoys.net/good-sudoku-for-ios-by-zach-gage-and-jack-schlesinger/), search excerpts) | iOS app | Difficulties tied to named techniques; hints that show the next logical move and why; technique practice outside puzzles; automatic notes to cut busywork | Hints that teach a named technique (already built here); automatic marks on big beds (**Fill marks**, batch 2) | Arcade (timed) mode; a paid unlock |
| NYT Games *Sudoku* ([help centre](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/30467696592148-Sudoku), search excerpt) | Web and app | Easy, medium, hard daily puzzles; a Candidate mode toggled beside Normal | Pencil marks as a mode switch (already built as Marks) | A daily puzzle that sets a reason to return on a schedule |
| SudokuWiki strategy families ([page](https://www.sudokuwiki.org/Strategy_Families), opened) | Solver and reference | Basic (naked and hidden candidates, intersection removal) → Tough (X-Wing first, then Swordfish, Y-Wing…) → Diabolical → Extreme | The next named step after the built tier 3: hidden pairs (still Basic) and the **X-Wing** (first Tough) as a fourth tier (**level 8**) | Chains, forcing nets and the exotic tiers |
| Mainstream mistake-limit apps (e.g. *Sudoku Online*, [App Store](https://apps.apple.com/app/id6502346045), search excerpt: 3, 2 or 0 mistakes allowed by difficulty) | iOS apps | Difficulty by fewer givens and fewer mistakes allowed | — | Mistake limits ending a puzzle, timers, ads, streaks |
| Nikoli's number place and Latin squares ([LibreTexts, Latin squares and sudokus](https://math.libretexts.org/Bookshelves/Combinatorics_and_Discrete_Mathematics/Combinatorics_(Morris)/04%3A_Design_Theory/16%3A_Latin_Squares/16.01%3A_Latin_Squares_and_Sudokus), search excerpt) | Paper puzzles and the maths behind them | A 4 by 4 sudoku is a Latin square with 2 by 2 blocks; larger orders add symbols | The 4 by 4 bed as the smallest true sudoku | — |
| Pencil and paper (the game's own off-screen card) | Physical | Any size | Already the off-screen suggestion | — |

No learning standard applies to a grown-up puzzle; the rule that grown-up wording never claims a brain-training benefit holds for every line below. The killer-cage notes (small cages with extreme sums have one digit set, e.g. two squares making 3) came from low-quality search pages and are only a pointer for the definition below, not evidence.

## What makes sense here

The game is fair and already teaches through its hints; what it lacks is a gentler first bed, a next technique above tier 3, a bed whose shape varies, and relief from writing marks on a 9 by 9. Four things fit the built tap-then-number action:

- **A 4 by 4 bed to start.** The ideas notebook asks for "a 4 by 4 bed" offered first to a new player ("Levels for what is already built", [IDEAS](../IDEAS.md)); appended easy entries now work through `order` and `entryLevels`, so no renumbering.
- **Fill marks on big beds.** Good Sudoku and NYT both treat candidates as a tool, not a skill; on a 9 by 9, writing every mark is clerical work, not reasoning. Marks only state what the rules already show, never the answer.
- **The X-Wing.** The first "Tough" technique, a natural fourth tier above pairs and pointing lines; the solver's step and hint machinery extend to it.
- **Patchwork beds.** Jigsaw blocks make the garden theme literal (irregular flower patches) and change where the only-place-left trick looks, on the same geometry code with an authored patch layout.

Owned elsewhere: picture sudoku for children is Garden Rows (standing rule S8: Garden Rows' boxes are a Garden Rows level, not a Sudoku Garden band; [Garden Rows dive](garden-rows.md)). The shared-cursor co-op is the couch roadmap's step 12 ([ROADMAP](../ROADMAP.md)) and an [IDEAS](../IDEAS.md) row, not this dive's.

**Long-term arc:** a grown-up opens on a 4 by 4 bed, climbs the 6 by 6 and patchwork beds, meets the 9 by 9 beds with Fill marks, then the X-Wing; killer cages follow if their definition measures a fit at 64 units.

## Experience and presentation

- **First unsupported action:** on the 4 by 4 bed, tapping an empty square and a number; with ten of sixteen squares open, at least one square has a lone number from its first look.
- **Touch and consequence:** as built, the number pops in with a pitch by square and a few dots in its colour; a wrong number boings and rings red; readiness returns at once, nothing locks. Fill marks writes every mark in a short sweep row by row (one `sfx.pop` a row), so it reads as the garden being labelled, not as an answer.
- **Variety without changing the rule:** patch layouts vary the bed's shape (level 9); the seeded numbers already vary. Nothing cosmetic is added.
- **Reasoning versus motor:** every square stays at least 64 units (a 4 by 4 draws at up to 96); the work is in the reasoning.
- **Supported ending:** Hint is always there and counts only as help; Start over keeps the entry count; one sticker a finished bed.
- **Co-play:** the built coplay hint (ask which number has one place left in a row, column or box) gains "which patch" on level 9; one person can name the X-Wing's two rows while the other places.
- **Art example:** a patchwork bed draws its patch borders as the existing 6-unit `wood.line` strokes, but only along edges between squares of different patches (one stroke per such edge), with each patch's soil a faint tint from `swatch` (green, yellow, brown light at alpha 0.25) under the blossoms so the patches read without counting borders. The X-Wing hint marks its four squares with the built `pattern` ring and draws two `swatch.yellow` lines through its rows.
- **Needs a person or device:** whether a grown-up new to sudoku starts the 4 by 4 without the card; whether Fill marks feels like help or like the game playing for them; whether patch borders read on an iPad at 64-unit squares.

## Proposed ladder

### Fresh content inside existing levels

**Fill marks (batch 2).** A **Fill marks** button on 9 by 9 beds (levels 4–6 and 8) pencils every candidate (`candidates()`) into every empty square that has no marks of her own; marks stay hers to erase, and placing a number already clears that number from its peers' marks (built). It is free and not help: it uses only the rules on the board, never the solution, the way a clash's red ring does. It is not offered on 4 by 4 or 6 by 6 beds, where marks would read the lone numbers out for her. Touch only; the couch tray is unchanged. A unit test asserts that after Fill marks each empty square's marks equal `candidates()` and that the button exists only on 9 by 9 plans; the touch layout keeps every target at 64 units with a third button row beside the bed and under it on a tall view.

### New levels on top

| Level | Name | Band window | First round | What the player decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | A 4 by 4 bed to start | grown-up entry (order `[7, 1, 2, 3, 4, 5, 6]`, `entryLevels: [7]`) | 4 by 4, 2 by 2 boxes, 10 blanks, lone numbers finish it | The only number that fits each square | As built: a wrong number is a miss with the boing and line; hints as built | Every level-7 bed over 300 seeds has one solution, exactly 10 blanks and grade 1 (the build lowers blanks to 9 only if 400 attempts miss on any seed); `geometry(4)` has 12 houses of 4; the bed draws with squares ≥ 64 (up to 96) in portrait and landscape | `Size` gains 4 with per-size box width (`bc` is 3 today for both sizes); the tray's four tiles; `describeLevel`; how-to steps unchanged (no level wording). Couch trip (1–3) and courses unchanged |
| 8 | A 9 by 9 bed with a crossing pair of rows | grown-up top (order ends `…, 6, 8]`) | 9 by 9, about 55 blanks, needs an X-Wing (and may use pairs and pointing lines) | Which number's two rows (or columns) share the same two columns, ruling it out of the rest of those columns | As built; the hint is `rules-out` via the X-Wing: the four squares are ringed, the two rows lit, and the pet says the number has to sit in those corners, so it cannot go elsewhere in those columns | The `xwing` step is sound against the solution (nothing ruled out is the answer) on 300 seeds; every level-8 bed is grade 4 (tier 3 alone fails) with one solution; tiers 1–3 grades of levels 1–6 unchanged; follow-the-hints finishes | A tier 4 and an `xwing` technique in `techniqueSolve`, `TIER`, `gradeOf`; generator filter (if grade-4 beds are rare in 400 attempts, an authored list checked by the solver, as `course.ts` does); one voice line; the row lines. Couch untouched |
| 9 | Patchwork beds | grown-up, after 3 (order `[7, 1, 2, 3, 9, 4, 5, 6, 8]`) | 6 by 6, irregular patches of six squares from an authored list of at least six layouts, about 20 blanks, lone numbers and only places | Where a number's only square in a patch is | As built; hints name a "patch" for the box house | Every authored layout has six connected patches of six and admits a full bed (`randomBed` succeeds); every level-9 bed over 300 seeds has one solution, its blanks and grade ≤ 2; `houseName` says patch; peers come from the patch, not a 2 by 3 box | `geometry` takes a patch layout (a `boxOf` array) instead of computing boxes; borders drawn between patches; the tinted soil; one voice line variant. Courses unchanged |

### Younger-band openings

None. Children's sudoku is Garden Rows (pre-K–school, picture beds, and its queued *Hedge boxes*), by standing rule S8; Sudoku Garden stays grown-up.

### Easier entries and levels between existing ones

Level 7 is the appended easy entry (stable ID, first in `order`, declared in `entryLevels`). Level 9 sits between 3 and 4 by `order`; level 8 goes on top. No saved level or pin moves; no decision is open.

### Left out on purpose

- **Killer cages** (Solo's Killer mode): a sum per cage, a dashed cage outline and a sum label inside a 64-unit square, cage-combination hints, and arithmetic as a new demand; queued only as a definition (**Define Sudoku Garden cage beds**).
- **X (diagonal) beds**: two extra houses that change little in the reasoning a player does; not queued.
- **12 by 12 or letter beds**: 12 squares at 64 units is 768, the whole short side before the tray; needs pan or zoom.
- **The Unreasonable grade** (guessing) and chains past the X-Wing: the game promises a bed the named techniques finish.
- **Mistake limits, timers, daily puzzles, streaks, ads and paid unlocks** from the apps.
- **A keyboard digit fallback**: a couch/laptop input change, not a level; it stays in GAMES' not-built list.

## Decisions for the developer

None. Fill marks' accounting (free, not help) follows the 2026-10-23 rule that only what the game shows counts; a person check judges how it feels.

## Build slices, in order

1. **Level 7, A 4 by 4 bed to start (batch sudoku-garden 1).** `Size` 4, per-size box width, the plan, `order` `[7, 1, 2, 3, 4, 5, 6]` and `entryLevels: [7]`. *Check:* new level on the existing interaction: typecheck, the game's rule tests, one browser play of level 7 with one wrong number and one hint, one portrait screenshot of the 4 by 4 bed, `fingerdemo` at 7.
2. **Fill marks on big beds (batch sudoku-garden 2).** The button, its layout on 9 by 9 beds and its sweep. *Check:* new interaction: typecheck, unit tests (marks equal candidates; button only on 9 by 9 plans), one scripted play of level 4 with Fill marks then a placement that clears its peers' marks, one portrait and one landscape screenshot of the tray; bot unchanged, no `fingerdemo`.
3. **Level 8, A crossing pair of rows (batch sudoku-garden 3),** after batch 1 (shares the `order`). Tier 4, the `xwing` step, generator or authored list, the hint and its lines. *Check:* new rule on the existing tap: typecheck, rule tests, one play of level 8 asking for hints until the X-Wing one (rings and line), then to the sticker, one portrait screenshot of the hint, `fingerdemo` at 8.
4. **Level 9, Patchwork beds (batch sudoku-garden 4),** after batch 1 (shares the `order` and the geometry change). Patch layouts in `geometry`, the borders and tints, the patch hint wording. *Check:* new-interaction tier (a new bed drawing): typecheck, unit tests including order, one play of level 9 with one wrong number and one hint naming a patch, one portrait screenshot, `fingerdemo` at 9; `BROWSER_SUITE=couchgames` filtered to Sudoku Garden, since the shared geometry changes.
5. *Define:* **Sudoku Garden cage beds** (docs only; status `define`): cage generation and uniqueness, the outline and sum label at 64 units, combination hints, accounting and the check tier.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
