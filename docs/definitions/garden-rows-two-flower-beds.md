# Garden Rows level 12 — Two-flower beds

Defined 2026-11-28 for [dive slice 5](../deep-dives/garden-rows.md#build-slices-in-order). This is one school touch level in the existing Puzzle Peaks game (`garden-rows`), and it comes from the IDEAS row *Two-flower beds* (Takuzu, Binairo, LinkedIn's Tango) at 4×4. Append ID 12. Give school the window 3–12 and the order `[3, 4, 5, 6, 7, 8, 9, 11, 12]`. It goes after the bee, not between 9 and 11, so the existing steps and any level she has reached stay as they are. Pre-K stays 1–3, and preschool still opens at 10 (`order [10, 1]`). Couch play is not part of this slice: the couch range stays 3–6.

## What she does

The bed is 4×4 with only **two** flower packets. The rule is **two of each flower in every row and every column**. Her action is the familiar Garden Rows one: pick a packet, tap an empty spot, and tap one of her own flowers to lift it. What changes is what she counts. Earlier levels ask "which one is missing?". This one asks "how many of this kind does the line have already?" The forcing move is short and can be said aloud: when a line already has two daisies, every empty spot left in it is a tulip. This is still CCSS Mathematical Practice 7 (look for and make use of structure), now through counting within a line.

The instruction (`rows.pairs`, said through `ctx.instruct`): "Two of each flower in every row and every column! Pick a flower packet, then tap an empty spot."

## The rule, and what is left out

- **Only counts.** A row or column may hold at most two of each flower, and a full bed is solved when every row and column has exactly two of each. A planting is refused when its row (checked first) or its column already has two of that flower.
- **No "no two rows alike" rule.** The IDEAS row and the dive suggested one. It is dropped because the counting rule alone already gives every generated bed exactly one solution, and line counting alone finishes it (measured below). The extra rule would never decide a spot, yet it would ask her to compare whole rows from memory. A solution may happen to repeat a row, and nothing checks for it.
- **No-three-in-a-row** cannot come up at 4×4 when each line has two of each flower, so it needs no code, voice or how-to text.

## One round

There are 2 beds per round, each with **8 empty spots**. The plan row is `{ name: 'Two-flower beds: two of each flower in every row and column (4 by 4)', size: 4, kinds: 2, rule: 'pairs', blanks: 8, beds: 2 }`.

- **Solutions.** `fullBed(4, 'pairs', rng)` picks one of the 90 balanced 4×4 beds (each row and column has two 0s and two 1s) with the round's RNG. Listing and drawing from them is cheap.
- **Blanks.** `makePuzzle` uses its existing loop: take flowers out in shuffled order, and keep a removal only while `countSolutions(start, 'pairs') === 1`. A scratch run of the same greedy loop over 2,000 random beds never stopped below 10 blanks, so 8 is always reached on the first attempt. Line counting finished every 6-, 8- and 10-blank bed the run made.
- **Kinds.** `chooseKinds(plan.kinds ?? plan.size, rng)` picks two of the five flowers in palette order, so a replay often shows a new pair.

## Mistakes, hints and finishing

This uses the existing accounting, with no new kind of miss.

- **Clash.** A planting whose row already has two of that flower is refused. It counts as one miss, with a gentle boing, and all three spots flash red: the new spot and the two that are already there. The line is `rows.clash-pairs-row`, "This row already has two of that flower. Try the other one!", and `rows.clash-pairs-col` is the same for a column. The lines name no flower, so they need no plurals: `FLOWER_NAMES` stays singular, and the two-packet bed makes "the other one" clear. Row before column, as `clash` already orders them.
- **Dead end.** A planting that fits but leaves an empty spot where neither flower fits is a miss, as today. That happens when the spot's row already has two of one flower and its column two of the other. The spot flashes orange with the existing `rows.stuck` line.
- **Hint.** After two misses, `hintFor` works without change. A planted flower that is not in the solution is glowed as a fix first. Otherwise it glows the empty spot with the fewest candidates, together with its packet. Line counting always leaves at least one empty spot with a single candidate in any bed that agrees with the solution, so the glowed spot is always one she could have worked out. The `rows.hint-plant` line stands.
- **Finish.** A full bed blooms row by row as today. Taking out her own flowers is free, and the flowers the bed started with stay. After the second bed the round ends through `ctx.finish({ misses, hints })` with one sticker.

## Code couplings the build must change

- **Kinds are not the size.** Add `kinds?: number` to `RowsPlan`, read as `kindsOf(plan) = plan.kinds ?? plan.size`. Each of these reads `plan.size` as the packet count today and must read `kindsOf` instead: `chooseKinds` in `makePuzzle`; the packet loop and `get n` in `index.ts` (`n` is also the bed width, so split it into `cols` and `packetCount`); couch packet stepping (unused at 12, but keep it correct); `gardenLayout`'s packet list; and the upright test's target count (`plan.size * rows + kindsOf(plan)`).
- **Rule `'pairs'`.** `candidates` keeps a flower while its row and its column each hold fewer than `size / 2` of it. `clash` for `'pairs'` returns `{ by, r, c }` for the first of the two in the line, plus an `also` spot for the second, which the scene flashes too. The other rules leave `also` unset. `isSolved`, `deadEnds`, `countSolutions`, `solve`, `hintFor`, `nextPlanting` and `nextMove` are already generic over `candidates` and `clash`. `fullBed` gains the `'pairs'` branch described under One round.
- **Scene.** `rows.pairs` as the instruction, and a clash line key for `'pairs'`. There is no hedge drawing and no bee view.
- **How-to.** The current `from: 11` steps, finish and note must become `from: 11, to: 11`. Add `from: 12` text. Steps: "Each row and each column needs two of each flower." Note: "When a line already has two of one flower, the empty spots left in it take the other. A third of the same flower will not stay; the glowing spot is a hint." The finish is "The round ends when every bed is full and right" (widen its `to: 10` scope). The card's `goal` ("no flower repeats") does not fit 11 or 12. `goal` is one plain string for every level, so reword it to "Plant a flower bed that follows the rule for its rows and columns."
- **Ghost finger.** The existing `autotouch()` walks `nextMove`, which reads packet indices. A two-packet bed works once `n` is split. The demo plants the forced spot of a line that already has two of one flower.
- Run `node scripts/content-barrels.mjs` after `voice.ts` and `howto.ts` change.

## Phone layout (the four views and landscape)

The bed is 400 units square, made of 100-unit spots, with 2 packets of 104 units drawn and a 128-unit touch area each. On the three upright phones and the captioned upright view (`UPRIGHT_VIEWS`: phone, small, tall, captioned), and on the extra short view the test already checks, `gardenLayout`'s upright branch puts the bed centred and the two packets in a row below it. The total height is 400 + 104 + 150 = 654 units, the same as levels 3–9 except that the packet row has two packets instead of four, so it can only gain room. In landscape the two packets stand in a column to the right of the bed, `PACKET * 2 + 10` apart. Every spot and packet keeps at least 100 logical units of touch area, clear of Home, Help, the guide and captions. A rotation keeps the bed, the selected packet, any glow and the accounting. The two flowers differ in shape as well as colour (the existing `flowerArt`), so the rule never relies on colour alone.

## Rule tests the build adds

- Plan and bands: ID 12 has `size 4`, `kinds 2`, `rule 'pairs'`. School steps from 11 to 12 and the window is 3–12. Pre-K 1–3 and preschool `[10, 1]` are unchanged, and the plans for levels 1–11 are byte-identical.
- `fullBed(4, 'pairs')` over 300 seeds: each row and column has exactly two of each flower. Across the seeds more than one bed appears.
- `makeBeds` for level 12 over 300 seeds never throws. Each bed has exactly 8 empty spots, `countSolutions(start, 'pairs') === 1`, and `solve` returns the stored solution. `kinds` holds two distinct flowers from 0–4 in palette order, and across 300 seeds every one of the ten pairs appears. The same seed gives the same kinds and beds.
- Line counting alone finishes every generated bed. Repeat until stuck: in any line with two of one flower, fill its empties with the other. This runs on the real `makePuzzle` output.
- `candidates` and `clash`: a third flower in a row is refused, `by: 'row'`, with `r/c` and `also` naming the two already there. The same holds in a column. Row is named before column when both are full. A bed with one of each in a line accepts either flower.
- `isSolved` accepts the solution and refuses a full bed with a line of three of one flower.
- `deadEnds` flags a spot whose row has two of one flower and whose column has two of the other.
- Hint convergence: from 200 reachable states (random legal partial plantings, some with a planted flower that differs from the solution), following `hintFor` (lift on `fix`, plant on `plant`) reaches `isSolved` within 16 steps, and every `plant` hint is the only candidate for its spot.
- `upright.test.ts` includes level 12 on every view (its "covers levels" list grows to include 12, and the bee stays filtered out). The target count uses `kindsOf`.

## Build proof (new-interaction tier)

Typecheck, Garden Rows rule tests including the upright test, `content-barrels`, and the game-docs test. Run one filtered `gardenrows` scripted play of level 12. It should show one clash, with the three-spot flash and the line, one hint after two misses, both beds to the sticker, and one portrait screenshot. Run `fingerdemo` filtered to Garden Rows at 12. Build only if shared files change. Then update the game page, `npm run game-docs`, add a verification entry, and record a person check in DEVICE-CHECKS: does a six-year-old count the two-of-a-kind lines, or guess?
