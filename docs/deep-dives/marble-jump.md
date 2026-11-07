# Marble Jump deep dive

*ID `marble-jump` · band grown-up · levels 1–6 on 2026-11-07 · session `claude/dive-marble-jump` ([PR #1369](https://github.com/rjdunlap/neo/pull/1369))*

## The game today

A grown-up plays peg solitaire on a wooden 15-hole triangle. She taps a marble, then taps an empty hole two spaces away in a straight line. The marble jumps over its neighbour, and the neighbour comes off. The round ends when one marble is left. The puzzle is **planning a route that does not strand marbles**. Most legal moves are fine at first, but a careless sequence leaves two marbles that can never meet. The game lives in Puzzle Peaks and is touch only (no entry in `src/couch/catalog.ts`). Along with Log Roll, Island Bridges, Snowball Merge and Tile Pairs, it is one of the `grownup` band's planning puzzles ([executive-function study](subjects/executive-function.md)). Younger players reach it behind the land's signpost and play level 1.

| Level | Plan name (`describeLevel`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | 3 marbles on a triangular board; leave one | grown-up | Which of two jumps comes first |
| 2 | 5 marbles | grown-up | A four-jump route; a few first jumps are traps |
| 3 | 7 marbles | grown-up | A six-jump route in the middle of a game |
| 4 | 9 marbles | grown-up | An eight-jump route |
| 5 | 11 marbles | grown-up | A ten-jump route that starts nearly full |
| 6 | 14 marbles | grown-up | The classic game: a full triangle with one hole |

`BandLevels`: `grownup 1–6`, no `order`, no `entryLevels`.

**Content pools.** `makeBoard` picks one of the 15 single-hole full triangles (all 15 can be cleared). It then plays the solver's **first** route forward until the level's marble count is reached. The solver is a depth-first search that always tries jumps in the same order, so each start gives one fixed board per level. I counted this for the dive with a port of `logic.ts`: level 1 has only **4** distinct boards, and they are all one board under the triangle's six rotations and reflections. Levels 2–5 have 7–10 boards (6–9 up to symmetry), and level 6 has 15 (the four classic start classes). Many more boards are possible. Counting only boards that a legal game from one of the 15 starts can reach and that can still be cleared, there are 72 three-marble boards (12 shapes up to symmetry), and 36 of them have a first jump that dead-ends. The same count gives 456 five-marble, 1,002 seven-marble, 765 nine-marble and 192 eleven-marble boards. Most of these have a trap first jump (378, 933, 723 and 177). Of the 15 full starts, 6 have one. The unit test's `variety > 20` counts all six levels together, so it does not catch level 1 repeating.

**Rules today.** Tapping a marble selects it. Tapping it again cancels, and tapping another marble switches. Tapping an empty hole that is not a legal landing for the selected marble boings, says `marble.miss` and **counts a miss**. Two misses in a row light a hint. Legal jumps are free exploration, even into a dead end. When a route can no longer clear, the status line says so and `marble.revise` offers Undo or Hint. Hint outlines the first jump of an exact solution from the current board. On a dead end it first takes back jumps to the nearest earlier board that can still clear (`recovery`). A hint already showing is not counted again. Undo and Start over keep misses and hints. One marble left calls `ctx.finish({ misses, hints })`. The ghost-finger bot taps the solver's next jump.

**Known gaps.**
- **Level 1 is always the same puzzle**, and levels 2–5 repeat often (above). This is the main replay problem.
- **A marble changes colour when it lands.** `marbleArt(i)` picks the colour from the *hole* index, so the marble that jumped is redrawn in the landing hole's colour. That breaks the "this marble moved" reading.
- **No motion.** The jumping marble and the removed one swap state in a single redraw. A newcomer has to infer which marble left from the six-spark burst.
- A Hint tap while a hint is already showing does nothing silently. It should at least repeat `marble.hint`.
- The layout hard-codes five rows (102-unit spacing, a 263-unit tray half-width, `top = (view.h - 410) / 2`). Phone-upright [batch 4](../definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built) lists `marble-jump`, and any larger board needs this derived from the row count.
- Person checks ([device checks](../DEVICE-CHECKS.md)): real-iPad touch and speech, whether blocked-route recovery is understood, and adult enjoyment.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Peg solitaire](https://en.wikipedia.org/wiki/Peg_solitaire) (English 33-hole, European 37-hole, 15-hole triangle) | Classic board puzzle | Same rule, bigger boards; **alternate goals** (start with a hole in one place, finish with the last peg in another); **fewest moves**, where a chain of jumps by one peg counts as one move (9 moves from a midside hole on the triangle, 10 from a corner) | A finishing hole as a new goal; the fewest-moves count as an information line | Nothing harmful; the English board needs more than 32 bits for its board |
| Cracker Barrel's table triangle (in the same article) | Restaurant peg game | One board; a printed scale grades how many pegs are left, from "genius" for one down to insults for many | The same 15-hole board, which is already here | Ranking a person's intelligence by pegs left |
| [Hoppers](https://en.wikipedia.org/wiki/Hoppers_(game)) (ThinkFun) | Frog peg solitaire on a pond grid, 40 challenge cards | Cards numbered by difficulty; later editions add a **red frog that must be the last one left**; Hoppers Jr. is for ages 5–7 with a larger board, fewer frogs and easier cards | A **gold marble that must stay**, a constraint layered on the same rule; the idea of a junior board | Card numbers shown as a grade |
| [Solitaire Chess](https://legacy.thinkfun.com/products/solitaire-chess-magnetic-travel-puzzle/) (ThinkFun) | Capture-every-move puzzle | 120 challenges in four tiers from beginner to expert; every move must capture and one piece stays | A curated ladder in small steps; worked solutions as support | Chess movement rules, which add a separate thing to learn |
| [Pegs](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/pegs.html) in Simon Tatham's Portable Puzzle Collection | Free digital peg solitaire | Cross and Octagon boards of any size, plus a **Random** shape that is always known to be solvable | Generated shapes guaranteed solvable, as `makeBoard` does now, from a much wider pool | Square-lattice boards only (no triangle) |
| [Bell, "Solving Triangular Peg Solitaire"](https://cs.uwaterloo.ca/journals/JIS/VOL11/Bell/bell2.html) (*Journal of Integer Sequences* 11, 2008) | Mathematics | Necessary and sufficient conditions for clearing triangles of any size, a solving algorithm, and a comparison of three simple strategies on the 15-hole board | The bigger triangles (6 rows, 21 holes) as a later level; the finishing-hole variant on the 15-hole board | — |
| Berlekamp, Conway and Guy, *Winning Ways*, ch. 23 "Purging Pegs Properly" | Mathematics | Pagoda functions and position classes, which prove that some boards cannot be cleared | Nothing on screen; it explains why the solver's dead-end warning is exact | A lecture inside a game |
| Chinese checkers | Family board game | Chained hops across a star board, racing an opponent | The look of a chain of hops | Racing and a competitor |

This is not a school skill, so there is no learning standard. The skill is the planning and revision the [executive-function study](subjects/executive-function.md) lists for the grown-up band. The game's wording must not claim any brain-training benefit (AGENTS).

## What makes sense here

Marble Jump's rule is complete and its solver is exact. The best gains come from **variety and feel** first, then from **goals that change the plan without a new movement rule**: a finishing hole, then a marble that must stay. A bigger triangle comes last, once the layout scales. The arc for a grown-up runs from a two-jump warm-up (level 1) to the classic full board (6), then to the same board with a constraint (7–8), then to a bigger board (9).

Two references are left out. A marble-count grade (Cracker Barrel) is a pressure the island does not use. A move limit ("clear it in 9 moves") is a target she could miss, which reads as failing, so the fewest-moves count stays an information line after finishing. Square-lattice boards (English, French) are a different board model, a different lattice and a heavier search; IDEAS already says they need frozen offline results. They wait on a decision.

A younger opening is plausible: Hoppers Jr. targets ages 5–7. But school-band targets must be at least 100 units, and today's holes are 78 across, so it needs a larger-hole, smaller board. That is a decision.

## Experience and presentation

- **First unsupported action:** on level 1 she can tap any marble and any hole. Nothing she tries breaks the board, and a non-jump only boings. With the 72 reachable three-marble boards instead of the single one used today, half the level 1 boards carry a real trap on the first jump. Undo makes that safe to discover.
- **Touch and consequence:** the selected marble rises (scale 1.08, a soft shadow) at touch-down. A legal landing sends it along a low arc over its neighbour in about 0.3 s with a pentatonic `bell(5)`. The jumped marble then drops into a **pocket groove** along the tray's lower edge, where taken marbles sit in a row. The groove is drawn with `wood.line` and `wood.light`. A refused landing tilts the selected marble towards the tapped hole and back, then boings. Each marble keeps its colour for the whole round, so she can follow one marble's journey. Taps during a jump are queued once, as in Log Roll's tip plan.
- **Sound:** each jump rises one pentatonic step from the last, so a clean run climbs a little tune, and Undo steps back down one note. This is the "rising tune" idea from the Number Trails dive, applied to a route.
- **Variety without a rule change:** a wider board pool (above), rotated and mirrored, and three tray looks picked by seed: oak with teal, blue and purple glass (today), slate with sea-glass greens, and birch with sunset marbles. All use palette swatches.
- **Reasoning versus memory and motor:** the targets are large and still, and nothing is timed. The challenge is foreseeing which marbles will end up isolated. Hints show one jump, not a route, so she still plans the rest.
- **Supported ending:** a hint can recover from any dead end, and the round always ends with one marble and a sticker. After finishing, a quiet status line gives the moves she used and the fewest possible, counting a chain by one marble as one move. It grades nothing.
- **Co-play:** two grown-ups take turns, one jump each, and both share the goal. A solo player keeps the same game. Taking turns makes "don't strand my partner" a nice spoken plan; it needs no code beyond the existing coplay hint.
- **Off-screen:** the existing offScreen line (fifteen circles on paper and counters) stays.
- **Needs a person:** whether the arc and the pocket make the jump rule obvious to someone who has never played peg solitaire; whether level 6 feels classic or tedious on an iPad; whether the gold marble (level 8) reads as "keep this one" without reading.

## Proposed ladder

### Fresh content inside existing levels

- **Board pool.** `makeBoard` draws from every solvable board with the level's marble count that sits on some clearing route from a single-hole full triangle. These are enumerated once with a forward search from the 15 starts, which takes milliseconds over 2^15 boards. On levels 2–5, a board must have at least one first jump that dead-ends, so there is a real plan to make (the pools above stay large). Level 1 draws from all 72 three-marble boards, half of them with a trap. Level 6 stays the 15 classic starts and is exempt, since a corner start's two first jumps mirror each other and both clear. A rule test asserts that levels 1–5 have at least 12 distinct boards over 80 seeds, level 1 at least 6 up to symmetry, and that every level 2–5 board has a trap first jump. Existing level numbers and descriptions do not change.
- **Colours follow marbles.** Each marble carries its colour index in the game state, not the hole index.
- **Motion and the pocket groove**, as above.
- **Looks:** three seeded tray looks.
- **Hint tap repeats the line** when a hint is already showing (still counted once).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *Finish in the star hole* | grown-up | A full triangle with one hole and a star-marked hole elsewhere. The last marble must stop in the star. The start and finish pair is one the solver clears, such as the classic same-hole finish, which 12 of 15 starts allow (the three inner holes cannot finish where they started) | A route whose last jump lands on the star, so the endgame is planned from the start | One marble left elsewhere is not a finish. The status says "one marble, not on the star: Undo to try another route", `marble.star` says the same, and Hint recovers as today. No miss for a legal route | The solver with a goal hole gives exact hints and recovery; every seeded start-and-star pair clears onto the star; levels 1–6 boards unchanged | `solve` and `recovery` take a goal mask (one hole or any); star drawing in the hole; one voice line; how-to step; `autotouch` unchanged |
| 8 | *The gold marble* | grown-up | Nine marbles, one of them gold, which must be the last one left (the Hoppers red frog) | Which marbles the gold one should take, and keeping it from being jumped | Choosing a landing that would jump the gold marble is refused like any illegal jump (boing, `marble.gold`: "The gold marble stays. Jump a different one."). It counts a miss, as other refused jumps do. Hint as today | The state is board plus gold hole (15 × 2^15, small); no hint or bot move ever jumps gold; every seeded board clears with gold last | Gold art (`swatch.yellow` with a cream glint); the solver state widens; one voice line; how-to step; after level 7, which brings in goal-aware solving |
| 9 | *A bigger triangle* | grown-up | A six-row, 21-hole triangle, full but for one hole (20 marbles). By this dive's port, all 21 single-hole starts clear, and a first-route search touches only about 3,200 boards | The classic game at a size where early choices matter much more | As today | The 21-hole lattice has the expected jump count; every frozen or seeded start clears; recovery from a dead end returns within a test time budget | Layout derived from the row count (the slice 1 layout work) with holes still at least 78 across; the board stays under 31 bits; a worst-case dead-end recovery could visit many more boards, so measure it and freeze the start list if needed; `fingerdemo` at 9 is about 19 jumps |

### Younger-band openings

Levels 1–2 could open to `school`, as Hoppers Jr. does for ages 5–7. That needs targets of at least 100 units. A new easy entry (level 10 *Little triangle*, a four-row, 10-hole board with three or four marbles and larger holes) would come before level 1, using `order` and `entryLevels`, with a shorter instruction. `marble.go` is four sentences today. This waits on a decision.

### Easier entries and levels between existing ones

None for the grown-up band: level 1 is already a two-jump warm-up. Level 10 above is the only proposed easier entry, and it is gated with the school opening.

### Left out on purpose

- Grading by marbles left (Cracker Barrel), stars, or a move limit to beat. The fewest-moves line stays information only.
- Timed rounds or "no undo" modes.
- A two-player capture game (Konane-style). A competitor changes what the game is for, and couch play is retiring.
- Showing the solver's full route as a hint. One jump at a time keeps the planning hers.

## Decisions for the developer

1. **Open levels 1–2 to the school band, with a larger-hole 10-hole entry (level 10) and a shorter instruction?** Lean: yes, after a school-age child plays level 1 once on the iPad. It costs a board model for smaller triangles, `order`/`entryLevels`, 100-unit holes and one voice line.
2. **Square-lattice boards (the English 33-hole cross, the French 37-hole board)?** Lean: later, and only if a grown-up asks for more after level 9. They need a board wider than 32 bits and frozen offline search results, as IDEAS notes.
3. **A controller or couch course for Marble Jump?** Lean: skip. Couch play retires at Lands stage E, and moving a cursor between 15 holes is slower than tapping.

Slices 1–4 go ahead regardless.

## Build slices, in order

1. **Board pool, colours that follow marbles, a visible jump and looks.** The wider seeded pool with a trap on levels 2–5, colours kept per marble, the arc tween with one queued tap, the refusal tilt, the pocket groove, the rising jump notes, three seeded tray looks, and the repeated hint line. Derive the layout from the row count so slice 4 and the upright batch need only small changes. Checks: typecheck, rule tests (pool variety per level, a trap on every level 2–5 board, marble counts unchanged), one filtered `marblejump` play at level 2 with one portrait screenshot in a new look, `fingerdemo` at 1 (the bot now waits for the jump); build only if shared files change.
2. **Level 7 *Finish in the star hole*, and the fewest-moves line.** The goal-aware solver and recovery, the star drawing, `marble.star`, and a how-to step. After finishing, the status shows the moves used and the fewest possible, counting a chain by one marble as one move, by an exact search over the 15-hole board. Grown-up range 1–7. Checks: model change: typecheck, rule tests with levels 1–6 unchanged, one browser play of 7 with one finish off the star, one portrait screenshot, `fingerdemo` at 7, build.
3. **Level 8 *The gold marble*.** The gold state, refusal and voice; range 1–8. After slice 2. Checks: typecheck, rule tests (no hint jumps gold), one browser play of 8 with one refused jump over gold and one hint, `fingerdemo` at 8.
4. **Level 9 *A bigger triangle*.** The 21-hole board and its layout, with a measured recovery cost; range 1–9. After slice 1. Checks: new level with a layout change: typecheck, rule tests, a layout check that every hole is at least 78 units across at 768×1024 and 1024×768, one browser play of 9, one portrait screenshot, `fingerdemo` at 9, build.

The school opening, square boards and a couch course (decisions 1–3) are gated and stay out of the ready list.

## What was built in this session

Nothing: research and design only. Board counts came from a scratch port of `logic.ts` outside the repository. Ran `node scripts/check-links.mjs` and `git diff --check`.
