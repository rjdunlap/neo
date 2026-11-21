# Sum Crates levels 1–3 (definition)

**Built:** not yet; levels 1–3 are one implementation batch (`sum-crates 1`), claimed 2026-11-20 on `claude/sum-crates-1-3`.

Proposed touch game `sum-crates`, PP5 of the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order) (the Kakuro genre; Kakuro is a reference only). Defined 2026-11-20 in the [PR for this definition](https://github.com/rjdunlap/neo/pull/1916), following the [November 17 decision](../archive/DECISIONS-2026-11-17.md#games). **Docs only:** no code or device evidence.

A stack of fruit crates is laid out in short rows and columns. Each row of crates and each column of crates has a number sign: the fruit in that line must add up to it, and no fruit may appear twice in the same line. Crates where a row and a column cross belong to both lines, so one fruit has to satisfy two sums. The learning is partitions of a number (which fruit pairs and triples make 7?) and using a second line to decide between them: K.OA.A.3 and 1.OA.C.6 are the standards the study names, and no outcome claim is made beyond that. A person can watch whether she starts to say "it has to be a 3, because 3 and 4 make 7 and this one is already 4".

## What it adds to Fruit Sums

[Fruit Sums](../games/fruit-sums.md) (Counting Cove, school, seven levels) has her choose two or three numbered fruit from a tray so they add to **one** sum on a sign, and any way that works counts. Sum Crates is a different action and a different skill: there is no choice among many right answers; the board has **exactly one** answer, found by reasoning across crossing lines. The shared parts are only the fruit art, the numbered-fruit look and the "makes N" read-back, and the build reuses Fruit Sums' draw helpers rather than copying them. It does not change Fruit Sums, and no Fruit Sums level is retired.

## Ladder and sample boards

Digits are drawn as numbered fruit with the matching dots on them (never the numeral alone), so a younger school player can count. `#` is a gap in the stack. Each board below was found by a seeded search, checked by brute force to have exactly one solution, and finished by the rule-only solver described under [the human gate](#generation-and-the-human-gate) with no trial and error.

| Level | Band | Board and rule | Example (the answer is shown; the game shows only the signs) |
| --- | --- | --- | --- |
| 1 *Two lines cross* | School | Four to five crates, every line two crates long, fruit 1–5. | A 2×2 block: rows `5 1 / 2 3`. The signs read: row one 6, row two 5, column one 7, column two 4. Fruit 1–5, no repeat in a line. Column two's 4 can only be 1 and 3, and the 3 belongs to row two, whose 5 then needs a 2 beside it. |
| 2 *A longer line* | School | Six to seven crates, lines of two or three, fruit 1–6. | Rows `# 2 3 # / 6 1 5 # / 5 # 1 #`: signs 5 (row one, two crates), 12 (row two, three crates), 11 (column one, two), 3 (column two, two), 9 (column three, three crates). |
| 3 *Nine and no repeats* | School and grown-up | Ten crates in a 5×5 stack, lines of two to four, fruit 1–9. | Rows `# 1 4 # # / # # 3 2 # / # # # 6 1 / # # # 3 5 / # # # 1 2`: across signs 5, 5, 7, 8 and 3 (one per row), down signs 7, 12 (four crates) and 8 (three crates). |

One board per round. `BandLevels`: `school: 1–2`, `grownup: 3–3`; school's order is 1 then 2 by the usual two smooth rounds; level 3 is the one grown-up level, so adaptation has nowhere to move there. A 6×6 grown-up stack with a par is a later rung and is not defined here. Co-play: one person reads the sign, the other finds the fruit; or each takes a direction (rows, columns) and calls out what the other needs. At a table: a grid on paper with the signs written in the margins, one pencil.

## Screen, scoring and help

- **Placing.** Tap a crate to select it (it lifts and a ring shows), then tap a numbered fruit in the tray to put it there; tap a filled crate and the fruit hops back to the tray. Dragging a fruit onto a crate works the same (`src/engine/drag.ts`, with the usual cancellation and cleanup). The tray has one of each of the level's fruit and **never runs out**; the same number may sit in different lines. Placing and removing are exploration and are never judged one at a time.
- **The line says what it made.** When a line is full its sign reads back what it made, free: a right sum glows, a different sum shows the made number ("this makes 9; we need 7"), and a repeated fruit in the line wobbles both copies and rings them (shape as well as colour). This is the same read-back Fruit Sums gives, so she can fix a line without a miss.
- **The miss is a full board that is wrong.** When the last crate is filled and some line is wrong, that is **one miss** (never more than one for the same board), a boing and a spoken hint naming the first wrong line ("the 7 across needs a different pair"). The wrong lines stay lit. Judging again needs at least one change. A line that is wrong while the board is not full costs nothing. After two misses the crate the solver can fill next glows and stays on.
- **Hint** is one button, counted once per press through the coach. It names and glows the next forced crate by the level's solver steps and says why in one phrase ("a 4 across needs 1 and 3, and the 1 is taken"); if a fruit she has placed cannot be in any answer it points at that fruit first and says to take it back. Hints always lead to the answer.
- **Completion.** The round finishes when every line adds to its sign with no repeat: the crates are loaded onto a cart, one sticker through `ctx.finish({ misses, hints })`, with or without help. No timer, no streak, no daily puzzle, no par shown in touch play.
- **Speech.** Instruction through `ctx.instruct`: "Fill the crates so every row and every column adds up to its number. Never use the same fruit twice in one line." Tapping a sign reads it ("seven across"), free. Hints and "this makes N" go through `ctx.say`. Numerals are spoken as numbers, so there is no reading requirement beyond numerals.

## Generation and the human gate

Seeded rules in `logic.ts` (`ctx.rng`); nothing random in `index.ts`.

- **Boards.** Grow a connected shape of the level's crate count on its grid, requiring every crate to sit in at least one line of two or more and at least two crates to sit in two lines; give each a seeded fruit so that no line repeats one; read the signs off the fruit. Bounded retry within a budget.
- **Exactly one solution.** An exhaustive search (each crate in order, partial sums and repeats checked as it goes) must find exactly one fill with fruit 1 to the level's maximum.
- **The human gate.** A rule-only solver must finish the board with no trial and error or the board is rejected. Its one rule: for every line, the fruit sets that can still make the sign (distinct fruit, each crate's remaining possibilities) rule out any fruit no set uses, repeated until nothing changes. The build sets a cap on the number of passes per level from a seeded sweep (the three example boards finished in 10, 17 and 34 elimination passes in the search script); a longer board is rejected so no level needs a leap she cannot see. Its steps are the hints and the ghost-finger route. A board whose first step needs a combination of three or more fruit is allowed only at levels 2 and 3.
- **Variety and fallback.** Seeds give different boards for the same level; a bounded retry falls back to the audited boards in the table, so a round always starts.
- **Tests:** exactly one solution on every generated board for a fixed seed set; the human solver finishes each within its pass cap; no line repeats a fruit in the answer; every line has two or more crates; every crate is in a line and at least two cross; every hint crate is right in the solution; a wrong full board counts one miss and judging again without an edit counts none; a placed fruit that fits no answer is the hint's first target.

## Layout, bands and upright

Ships `upright: true` and a pure `layout.ts` (layout is a function of `view`, level and screen, per the [upright batches](phone-portrait.md#game-batches)), with a per-level test over the landscape view (1024 × 768) and the upright views (768 × 1024 to 768 × 1700). Crates and tray fruit are at least 100 units: the 5×5 stack is 500 wide with the signs in the gaps (small signs use 36-unit numerals), and the tray (up to nine fruit) is two rows at the foot. The whole board stays visible and clear of the pet and the corner buttons. The grown-up level uses the same sizes (the band minimum is 64). The test records the smallest target in [`grownup-thumbs.test.ts`](../../src/games/grownup-thumbs.test.ts).

## Land and sources

**Home land: Lantern Lake.** It is a grown-up game that opens a small level to school, the same rule [Word Code](word-code.md#land-and-sources) and Lantern Lights followed, so with `school` its lowest band it also shows to school players beside the signpost and in Wonder Woods by subject. At this definition Lantern Lake shows **6 games at school** (one page; 7 with Sum Crates, plus host and signpost, which fits) and **14 on the grown-up side** (7 + 7), which becomes 15 (8 + 7) with this game, still within the 13-spot rule on each page ([location capacity](location-capacity.md)). The build confirms the counts with the lands tests. **Fallback: Counting Cove** (numbers, beside Fruit Sums; it already pages 7 + 7 at school and grown-up, 8 + 7 with this game) if a Lantern Lake scene test fails; Puzzle Peaks is the second fallback, though Bunny Patches is queued there. A fallback is a land decision named in the PR, never a smaller target.

Sources: the genre's rules (runs summing to a clue, no repeats within a run) are the standard cross-sums rules; the learning purpose is stated as partitions of a number only. The boards are generated here, not copied from any puzzle page.

## Overlap

- **Fruit Sums** is described above. **Domino Pond** also adds to counts, but by laying a stone on a patch; **Number Trails** and **Pile Match** are counting games with no crossing lines.
- **Bunny Patches** and **Logic Grid** are elimination over squares and clue cards; Sum Crates eliminates over fruit values in lines. They share the "one answer, the miss is a full wrong board" rule, not code.
- **Garden Rows'** Latin squares (a number in each row and column once) are a different rule; Sum Crates has no 'once per row of the whole board', only per line.

## Build checks

Start from the [new-game scaffold](../NEW-GAME.md) (`--band grownup`, for the upright stub; add `school` to `bands`). Rule tests above, the human solver over a seeded sweep, and the layout test per level and view. Typecheck and unit tests; **one** filtered scripted play of level 1 and of level 3 (one wrong full board, one hint) and one portrait screenshot of each band; `fingerdemo` at level 1 (the ghost finger places the next forced fruit); `npm run build` once for the shared voice lines and the land change. Say which checks were not run. Expected files: `src/games/sum-crates/` (`index.ts`, `logic.ts`, `layout.ts`, `voice.ts`, `howto.ts`, `art.ts`, tests), `src/content/lands.ts`, generated barrels, the thumb table, a browser-check case, `docs/games/sum-crates.md`.

## Settled and open

**Settled here:** `sum-crates`; level 1 (school, 2×2-ish, two-crate lines, fruit 1–5), level 2 (school, lines to three, fruit 1–6), level 3 (school and grown-up, 5×5, lines to four, fruit 1–9); a full wrong board is the one miss and a full line reads back what it made for free; the tray never runs out; a unique-solution search plus a rule-only human gate; Lantern Lake with Counting Cove as the fallback; upright from the first slice.

**Open, not blocking:** a 6×6 grown-up rung with a par and a shelf (its own definition); a younger opening with two-fruit lines and counters; whether the fruit's dots help or crowd the numerals (a playtest answers it); a "must contain" pencil-mark for a fruit she suspects (kept out so the first slice stays small).
