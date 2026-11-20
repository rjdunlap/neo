# Bunny Patches levels 1–3 (definition)

**Built:** not yet; levels 1–3 are one implementation batch (`bunny-patches 1`).

Proposed touch game `bunny-patches`, PP3 of the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order). Defined 2026-11-20 in [PR #1907](https://github.com/rjdunlap/neo/pull/1907), following the [November 17 decision](../archive/DECISIONS-2026-11-17.md#games) (admitted for definition, third in its order). **Docs only:** no code or device evidence. It is the notebook's *Garden Queens* ([IDEAS](../IDEAS.md)) under its default name; Queens is LinkedIn's name and a reference only.

A meadow is cut into coloured patches. Put one bunny in every row, every column and every patch, with no two bunnies touching, not even corner to corner. The learning is elimination: a bunny in one square rules out a whole line, a patch and its neighbours, so the squares that are left show where the next bunny must go. It makes no claim about a school or reasoning outcome; a person can watch whether she starts to say "it can only go here".

## Ladder and sample boards

Squares are drawn A, B, C… by patch below; the game shows patches by colour **plus a pattern** (dots, stripes, checks, clover), never hue alone.

| Level | Band | Board and rule | Example |
| --- | --- | --- | --- |
| 1 *A bunny for every patch* | Pre-K | 4×4, four patches, **one bunny already sitting** (locked, drawn with a small flag). The reach of every bunny is shaded for her. | Rows `AAAB / DAAB / DAAB / DCCC`. With the given bunny at row 1, column 2 (A), two bunny arrangements fit the patches (rows to columns 2 4 1 3 or 3 1 4 2); the given bunny picks the first, and the rest follow. |
| 2 *Rule it out* | School | 5×5, five patches, nothing given. The reach is still shaded. | `ACCBB / ACCBB / CCDDD / EDDDD / EEEED`: the one answer puts bunnies at columns 1, 4, 2, 5, 3 of rows 1–5 (written `03142` counting from 0). |
| 3 *Where is it forced?* | School and grown-up | 6×6, six patches, nothing given, **no shading** (she can switch it on, free). She may leave paw marks ("not here") to keep her own notes. | `ACCCCB / ACCCBB / CCCDBB / CCCDBB / CCCBBE / FFFFBE`: the one answer is `041352`. |

Both the 5×5 and 6×6 boards above were found by a seeded search and checked by brute force to have exactly one solution, and the 4×4 board's two arrangements are checked too (they are the build's audited fallback boards; the generator will balance patch sizes, which these do not). One board per round. `BandLevels`: `prek: 1–1`, `school: 2–3`, `grownup: 3–3`. School's order is 2 then 3 by the usual two smooth rounds. An 8×8 grown-up rung with a par and a Lantern Lake shelf stays a later line (the [study](../deep-dives/subjects/puzzle-pages.md#an-answer-for-every-audience)); it needs 88-unit squares to fit an upright phone and is not defined here. Co-play: one person names a patch and the other finds its bunny. At a table: a 4×4 grid on paper, with coloured pencils for the patches.

## Screen, scoring and help

- **Placing.** Tap a square to put a bunny there and tap the bunny to take it back (levels 1–2). Level 3 cycles a square: empty, paw mark, bunny, empty, so her notes are free. Marks and bunnies are never judged one by one: placing and removing are exploration. A given bunny is locked and cannot be moved. Tap-down feedback is immediate and a bunny hops in.
- **Reach, the rule made visible.** On levels 1–2 a placed bunny softly tints its row, column, patch and the touching squares, and the covered squares show a faint leaf mark (drawn, not saved, never a try). Two bunnies that already touch or share a row, column or patch **wobble and sit in a ring** (shape as well as colour), at once, free: showing a clash is not a miss. Level 3 shows the reach only if she turns the lamp on (a button, free, off by default and remembered per level).
- **The miss is a full board that is wrong.** When the Nth bunny is placed and the board does not satisfy every rule, that is **one miss** (never more than one for the same board), a boing and a spoken hint that names the first clash ("two bunnies in the same row"). The clashing pair wobbles. The next judging needs a change to the board. A board with a clash that is not yet full costs nothing: she may hold a clash while she works. After two misses the squares that the solver can fill next glow.
- **Hint** is one button, counted once per press through the coach. It names and glows the next forced square by the level's solver steps (below), saying why in one phrase ("this patch has only one square left"); if her board already has a bunny that cannot be in any solution, it points at that bunny first and says to take it back. Hints always lead to the answer.
- **Completion.** The round finishes when the bunnies satisfy every rule: the patches clap, the bunnies hop in a ring, one sticker through `ctx.finish({ misses, hints })`, with or without help. No timer, no streak, no daily puzzle, no par shown in touch play; a time or count is never kept as a goal.
- **Speech:** instruction through `ctx.instruct`: "One bunny in every row, every column and every patch, and no bunnies touching." Level 1 adds "This bunny is already here. Where does the next one go?" Hints and clash lines go through `ctx.say`. No word is read from the board, so there is no reading requirement.

## Generation and the human gate

Seeded rules in `logic.ts` (`ctx.rng`); nothing random in `index.ts`.

- **Boards.** Pick a seeded placement with one bunny per row and column and none touching; grow N connected patches outward from the N bunny squares until the grid is covered (random frontier growth); retry within a bounded budget. Patch sizes stay between 2 and about `2N − 2` so none is a lone square or a huge one (the examples above are rougher than that).
- **Exactly one solution.** An exhaustive solver (row by row with column, patch and touching checks) must find exactly one answer. At level 1 the given bunny must **decide**: the board has more than one arrangement without it and exactly one with it (the 4×4 example). A 4×4 has only two arrangements without a patch rule, so the patches matter at level 1 mainly to make the given bunny count.
- **The human gate.** A rule-only solver must finish the board with no trial and error, or the board is rejected. Levels 1–2 allow: a patch, row or column with one open square takes a bunny there; a bunny rules out its row, column, patch and touching squares. Level 3 adds: if *k* patches have all their squares inside *k* rows (or columns), no other patch may use those rows (columns). The steps this solver takes are the hints and the ghost-finger route.
- **Variety and fallback.** The seeds give different boards for the same level; a bounded retry falls back to the audited boards in the table, so a round always starts.
- **Tests:** exactly one solution on every generated board for a fixed seed set; the human solver finishes each; each patch is connected and holds one answer square; a given bunny at level 1 decides the board; every hint square is right in the solution; a clash is reported for a touching pair, a shared row, a shared column and a shared patch; a full wrong board counts one miss and a repeated judging without an edit counts none.

## Layout, bands and upright

Ships `upright: true` and a pure `layout.ts` (layout is a function of `view`, level and screen, per the [upright batches](phone-portrait.md#game-batches)), with a per-level test over the landscape view (1024 × 768) and the upright views (768 × 1024 to 768 × 1700). Squares are at least 100 units: the 4×4 is 400 wide, the 5×5 500 and the 6×6 600, so each fits an upright 768 view with room for the buttons (hint, lamp on level 3). The whole board stays visible and clear of the pet and the corner buttons. A `grownup` level 3 uses the same squares (the band minimum is 64; a larger square is allowed). The test records the smallest target in [`grownup-thumbs.test.ts`](../../src/games/grownup-thumbs.test.ts) for the grown-up band's level.

## Land and sources

**Home land: Puzzle Peaks**, which holds Domino Pond, Mossy Path and Secret Code, with `prek` its lowest band here and the signpost for older players. At this definition Puzzle Peaks lists 17 registered games; the build session counts the pages on every band with the lands test (`landLayout` returns null rather than shrink a target) and, if a side would need more than the existing paging allows, applies the [catalog-overflow decision](../IDEAS.md): a new fitting land, never smaller targets. Lantern Lake is the fallback only for a school-and-older game and cannot hold the pre-K level, so an overflow is a land decision, not a quiet move.

Sources: the rules follow Star Battle and LinkedIn's Queens, written here as one bunny per row, column and patch with no two touching, with a rules check against a [documented no-backtracking solver](https://mspiegel.github.io/queens-without-backtracking/QUEENS.html) as the model for the human gate. The learning purpose is stated as elimination only; no outcome claim.

## Overlap

- **Mossy Path** finds a way on a board and **Domino Pond** lays stones to a count; neither asks her to rule squares out. **Secret Code** and **Logic Grid** also use elimination, over colours and clue cards, not squares and lines.
- **Sudoku-style games** are not on the island; this game does not turn into one (no numbers, no reading).
- **Garden Rows** (flowers in rows) is a different rule and stays separate.

## Build checks

Start from the [new-game scaffold](../NEW-GAME.md) (`--band prek` for the lowest band). Rule tests above, the human solver over a seeded sweep, and the layout test per level and view. Typecheck and unit tests; **one** filtered scripted play of level 1 and of level 3 (one wrong full board, one hint) and one portrait screenshot of each band; `fingerdemo` at level 1 (the ghost finger places the next forced bunny); `npm run build` once for the shared voice lines and the land change. Say which checks were not run. Expected files: `src/games/bunny-patches/` (`index.ts`, `logic.ts`, `layout.ts`, `voice.ts`, `howto.ts`, tests), `src/content/lands.ts`, generated barrels, the thumb table, a browser-check case, `docs/games/bunny-patches.md`.

## Settled and open

**Settled here:** `bunny-patches`; levels 1 (pre-K 4×4, one given), 2 (school 5×5) and 3 (school and grown-up 6×6 with paw marks and the lamp off); a wrong full board is the one miss and clashes are shown for free; a human-solver gate over a unique solution; Puzzle Peaks; upright from the first slice.

**Open, not blocking:** the 8×8 and larger grown-up rungs with a par (needs its own definition and a shelf); whether the lamp helps or hides the learning (a playtest answers it); a younger 3×3 opening; more patch art.
