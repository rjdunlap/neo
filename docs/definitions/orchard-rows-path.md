# Orchard Rows, levels 7–9: a path through the orchard (definition)

**Status: defined 2026-11-03, docs only ([PR #1178](https://github.com/rjdunlap/neo/pull/1178)); not built.** Slice 2 of the [Orchard Rows dive](../deep-dives/orchard-rows.md#build-slices-in-order), which proposes the levels ([new levels on top](../deep-dives/orchard-rows.md#new-levels-on-top)) and adopts its leans under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules): the levels extend Orchard Rows, products stay under 100, and there is no pre-K opening. One build batch follows ([batch plan](../GAME-BATCHES.md#orchard-rows-3-a-path-through-the-orchard)).

**Fun action and purpose:** a grown orchard has a dirt path running through it, splitting it into two parts on differently coloured ground. She finds how many trees are in each part, then in the whole orchard. At level 8 she first slides the path to wherever she likes and lays it. Learning goal: *an array split into two arrays you know adds back to the whole*. Seven rows of 4 is 5 rows of 4 and 2 more rows of 4 (the distributive property, CCSS 3.OA.B.5 and 3.MD.C.7c). At level 9, 3 rows of 14 is 3 rows of 10 and 3 rows of 4 (4.NBT.B.5). No other game asks this (dive, *What the island does not teach yet*).

## Where the dive's text changes

- **Its own scene, not the basket scene.** The dive put 7–9 in `BasketOrchard` with pads in `basketLayout`. This definition gives them their own scene, `PathOrchard` in `src/games/orchard-rows/path.ts`, and their own pure model and layout in `logic.ts`.
  - **Why:** `BasketOrchard` and its state machine branch on `level === 6` in many places:
    - in the model, `startPlay`, `advance`, `step` and `makeRound`'s last branch;
    - in the scene, `begin()`'s instruction, `end()`, `buildControls` and `drawCard`;
    - in the tests, the layout test's `level === 6 ? 3 : 1` basket count.
  - **Result:** Levels 7–9 share none of the basket, deal or leftover. A separate model leaves the built 4–6 code and tests unchanged.
  - **Reuse:** the path scene takes the drawing helpers it shares from the basket scene: `tree()` is already exported, and the arrow tile and the card become small exported functions.
- **Level 7's orchards have 7 to 9 rows, not 6 to 9.** With 6 rows the bottom part is one row, which needs no multiplying. Its "one row fewer" decoy would also be 0, and the top part alone (5 rows) would equal the whole minus a row.
- **"The top part alone" becomes "the larger part alone"** as the whole's forgotten-part decoy. That is the same thing at levels 7 and 9: five rows always outnumber the two to four below, and ten trees always outnumber the 1 to 9 after the path. At level 8 she may lay the path anywhere.
- **Level 9's cells:** the dive's "36 portrait" used the wrong view. The logical views from `computeView` are landscape 1024 × 768, portrait 1024 × 1365, phone about 1662 × 768 and phone insets about 1561 × 768. The arithmetic is below.

## The model (`logic.ts`)

- **Routing.** `isBasketLevel` becomes `level >= 4 && level <= 6`; a new `isPathLevel = level >= 7`. `create` routes 7–9 to `PathOrchard`. `makeRound`'s last branch becomes an explicit `level === 6`; anything else throws, so a wrong route fails loudly in tests.
- **Plans.** `Mode` gains `'path' | 'choosepath' | 'pathten'`. `PLANS` gains three entries with empty `shapes`, so `planFor` and `describeLevel` reach 7–9:
  - "A path at five: count each part, then the whole";
  - "Choose the path: split the orchard, count each part and the whole";
  - "A path at ten: rows of ten and the rest, then the whole".
- **Tasks.** `PathTask { rows, columns, split }`:
  - Levels 7 and 8: `split` is the rows above the path.
  - Level 9: `split` is the trees left of the path in every row.
  - `across(level)` is true at 7 and 8, where the path runs between rows; at 9 it runs down between columns.
- **Pools and rounds.** `makePathRound(level, rng)` returns `{ level, fruit, tasks }`:
  - two different orchards;
  - fruit seeded from `SAPLINGS`;
  - the first orchard fixed as the worked example, the second drawn from the pool.

| Level | Pool | Split | First orchard |
| --- | --- | --- | --- |
| 7 | 7–9 rows of 3–9 (21 shapes, at most 81) | always 5 | 7 rows of 4 |
| 8 | 6–9 rows of 6–9 (16 shapes, at most 81) | opens at 1; she moves it, 1 to rows − 1 | 7 rows of 6 |
| 9 | 2–5 rows of 11–19 (36 shapes, at most 95) | always 10 | 3 rows of 14 |

- **Parts.** `partsOf(level, task)` returns `[a, b]`:
  - Levels 7 and 8: `[split·columns, (rows − split)·columns]`.
  - Level 9: `[rows·10, rows·(columns − 10)]`.
  - In both, `a + b = rows·columns`. `unitOf(level, task, part)` is the trees in one row of that part: `columns` at 7–8, and 10 or `columns − 10` at 9.
- **Questions.** In order: `'first'` (top, or the ten side), `'second'` and `'whole'`. `answerOf(state)` returns a, b or a + b.
- **Pads.** `pathChoices(answer, kind, task, level, rng)` always returns **three distinct pads in 1–99, the answer among them**, shuffled. A candidate counts only if it is above 0, below 100, not the answer and not already taken. Candidates come in this order:
  - **A part** (unit u): `a − u` and `a + u` (one row fewer and one more), then the fallbacks `a + 2u`, `a + 1` and `a − 1`.
  - **The whole** (W, a row of `columns` trees):
    - the larger part alone, max(a, b), always first (she forgot the small part);
    - then one of `W − columns` and `W + columns`, seeded;
    - then the other;
    - then the fallbacks `W + 1` and `W − 1`.
  - **Known collisions, which the fallbacks handle:**
    - Level 9, 3 rows of 15: the ten side alone (30) equals the whole minus a row (2 × 15).
    - Level 8: a one-row part makes `a − u` zero, and a one-row bottom makes the larger part equal `W − columns`.
    - Level 9: `W + columns` can pass 99; at 5 rows of 19 it is 114.
- **State.** `PathState { level, tasks, index, split, laid, question, wrongs, glowing, misses, hints, done }`:
  - `laid` starts true at 7 and 9 and false at 8.
  - `wrongs` and `glowing` reset with each question.
- **Actions.** `pathStep(state, action)` returns `{ state, outcome }`.

| Action | When it counts | Outcome |
| --- | --- | --- |
| `up` / `down` | level 8, path not laid | `moved` (▲ moves the path up, one row fewer above; ▼ one more), or `end` at 1 or rows − 1 (free) |
| `lay` | level 8, path not laid | `laid` (any split is right; free) |
| `sign` (part 0 or 1) | its part answered, path laid | `recount` (free); before its part is answered, `ask` (free; the scene repeats the question) |
| `pad` (n) | path laid | `right` (next question, or next orchard, or `done`), or `wrong` (one miss each time, including the same wrong pad again; the second on this question lights the glow and counts its one hint) |

Anything else, or any action after `done`, is `ignored`.

- **Help and the bot.**
  - `pathHint(state)` is the answer pad while the glow is on. At level 8 there is no hint before the path is laid: a hint never chooses the split.
  - `pathBot(state)` moves the arrows toward a split of 5 (always reachable, since rows ≥ 6), then lays the path, then taps each answer.
- **Speech helper.** `skipCount(rows, each)` gives the spoken count, such as "4, 8, 12, 16, 20".

## Screen and controls

Positions are logical units from `view`. The pet keeps its 200 × 205 bottom-left corner and the corner buttons keep `TOP_CLEAR`. `pathLayout(view, level)` is pure and returns null rather than shrink a target. The layout does not depend on the orchard, so the tests can sweep every shape.

- **The orchard** is a picture: trees use `eventMode = 'none'`. The cell is `min((bedW − gapW) / columns, (bedH − gapH) / rows, 90)`, where the 40-unit path takes the gap across the bed at 7–8 (`gapH`) and down it at 9 (`gapW`). The path is a brown strip with stepping stones. The first part stands on light yellow ground and the second on light blue, each a rounded panel just larger than its trees.
- **Signs** are two buttons of 120 × 110 in the colour of their part's ground, at fixed positions.
  - **Picture:** before her answer, a sign shows a small grid of dots for its part's rows; after it, the part's total as a numeral.
  - **Tap:** once its part is answered, a tap lights that part's rows one at a time (0.4 s each, a pentatonic marimba note per row) while the pet counts "5 rows of 4: 4, 8, 12, 16, 20". That is free support for the whole question.
  - **Default** (open decision 1): before its part is answered, a sign only repeats the question. Tapping it never speaks the answer for free.
- **Landscape (1024 × 768; the phones are wider and the same height).**
  - **Levels 7–8:**
    - Bed: x 210 to w − 430, y 125 to h − 30 (384 × 613).
    - Sign column: x w − 420 to w − 300. The first sign is at y 125, the second at y h − 140.
    - Controls column, centred on w − 140 as at 4–6: ▲ 130 × 100, the card 130 × 120, ▼ 130 × 100, and *Path here* 130 × 110 (level 8 only).
    - Pads, 130 × 110 each, take the column's first three slots. At level 8 they replace the arrows, card and *Path here* once the path is laid.
  - **Level 9:**
    - Bed: x 210 to w − 300, y 125 to h − 150 (514 × 493).
    - Signs: below the bed at y h − 140, the ten side's at x 210 and the other at x w − 420.
    - Pads: in the column.
- **Portrait (1024 × 1365).**
  - **Levels 7–8:**
    - Bed: x 40 to w − 180, y 125 to h − 225.
    - Sign column: x w − 160 to w − 40, with signs at y 125 and h − 335.
    - Controls row at y h − 160, as at 4–6: ▲ at 230, the card at 370, ▼ at 510 and *Path here* at 670.
    - Pads: 120 × 110 in the first three slots.
  - **Level 9:**
    - Bed: x 40 to w − 40, y 125 to h − 345.
    - Signs: at y h − 335, ending 20 above the pet corner's top, at x 40 and w − 160.
- **Level 8's arrows point up and down in both orientations**, since the path moves up and down. This differs from 4–6's portrait left and right.
- **The card** at level 8 shows the two parts' heights: bars for the rows above, a brown line, then bars for the rows below. It is a picture only.
- **Narrowest cells.** The test floor is `MIN_CELL` (18).

| Level | Shape | Landscape | Portrait |
| --- | --- | --- | --- |
| 7–8 | 9 columns (the widest) | 384 / 9 ≈ 42.7 | 804 / 9 ≈ 89 |
| 7–8 | 9 rows (the tallest) | (613 − 40) / 9 ≈ 63.7 | (1015 − 40) / 9 ≈ 108, capped at 90 |
| 9 | 19 columns | (514 − 40) / 19 ≈ 24.9 | (944 − 40) / 19 ≈ 47.6 |

- **Feel.**
  - **Touch-down:** buttons darken at once.
  - **New orchard:** it grows row by row (as `grow` does at 4–6) and the path draws across.
  - **Level 8:** the path slides one row per arrow press in 0.15 s, and the parts' grounds follow. The range end is the 4–6 soft tick and arrow wobble. *Path here* tamps the path down with a settle sound.
  - **Right pad:** a sparkle; the part's rows light while the pet says its count.
  - **Wrong pad:** a gentle boing, then the reason.
  - **Music:** `STYLES.hub`.
- **Speech and reading.** `ctx.instruct` asks each question, and tapping the pet repeats it. The asked part's ground pulses softly, so the question is also pictured. The pads are numerals, as at levels 1–3 (school band). The heading builds the equation for grown-ups: "7 × 4 = 5 × 4 + 2 × 4", then "= 20 + 8 = 28".

## Accounting, help and finishing

| Counts a miss | Counts a hint | Never counted |
| --- | --- | --- |
| every wrong pad, including the same wrong pad again (as at levels 1–3) | the glow on the answer pad after a second miss on one question; at most one per question, three per orchard | arrows, the range-end wobble, *Path here* and where she lays it, sign taps, tapping the pet |

- **Spoken reasons** (the reason gives the count, as `orchard.totalhint` does at 1–3; the glow is the counted help):
  - **A wrong part:** that part's rows light while the pet counts: "{rows} rows of {each}: {count}." For a one-row part: "One row of {each}: {each} trees."
  - **A wrong whole:** "{a} trees on one side of the path and {b} on the other. {a} and {b} more make {total}."
  - **After the glow starts:** `orchard.followglow`.
- **Finishing.**
  - A round is two orchards, each with three questions.
  - The second orchard's whole ends with "Two orchards split by a path! Two parts you know make the whole." The round then ends through `ctx.finish({ misses, hints })`: one sticker, with help or without.
- **Adaptation.** Standard. A step from 6 to 7 changes the interaction, which the how-to card covers.

## Rule tests (`logic.test.ts`)

- **Pools:**
  - every level 7 shape has 7–9 rows of 3–9 and a split of 5;
  - every level 8 shape has 6–9 rows of 6–9;
  - every level 9 shape has 2–5 rows of 11–19 and a split of 10;
  - every whole is below 100.
- **Rounds, over 300 seeds per level:**
  - the same seed gives the same orchards and fruit;
  - the two orchards differ;
  - the first is the fixed example.
- **Parts:** for every shape, and at level 8 every split from 1 to rows − 1:
  - `a + b` is the whole;
  - both parts are above 0;
  - at levels 7 and 9 the first part is the larger.
- **Pads:** for every shape, split and question over 50 seeds:
  - exactly three distinct pads in 1–99, the answer among them;
  - part pads never 0;
  - the whole's pads include the larger part alone;
  - the named collisions (3 rows of 15, one-row parts, 5 rows of 19) still give three.
- **Arrows:** the split never leaves 1..rows − 1, and the range ends are free `end`s.
- **Accounting:**
  - a wrong pad is one miss every time;
  - a second miss on one question counts one hint, and hints never exceed one per question;
  - arrows, `lay`, sign taps (`ask` or `recount`) and actions after `done` count nothing;
  - at level 8 every split is accepted.
- **Help leads somewhere:** while the glow is on, `pathHint` names the answer pad, and following it answers the question.
- **The bot:** a simulated `pathBot` finishes every level for 100 seeds with no miss, and lays level 8's path at 5.
- **Routing:**
  - `isBasketLevel(7..9)` is false and `isPathLevel(7..9)` true;
  - `planFor(7..9)` gives the new names;
  - `makeRound(7)` throws;
  - the 4–6 tests pass unchanged.
- **Layout:** `pathLayout` at the four views for levels 7, 8 and 9:
  - arrows, *Path here*, pads and signs each at least 100;
  - no two targets overlap, including signs with pads;
  - nothing in the pet's corner, above `TOP_CLEAR` or outside the view;
  - the bed overlaps no target;
  - every reachable shape's cell is at least `MIN_CELL`.
- **Registry, lands, how-to and off-screen tests** pass with levels 1–9.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `autotouch()` follows `pathBot` through the public controls, one tap per call, after each instruction and animation ends. It reads the current layout after every resize.
  - **Level 8:** ▼ four times from the opening split of 1, then *Path here*.
  - **Then:** the answer pad for each question.
  - It never calls finish.
- **How-to card** (`src/content/howto.ts`):
  - **Step `{ from: 7, to: 9 }`:** "A path splits the orchard into two parts. Choose how many trees are in each part on the number buttons, then how many in the whole orchard. After a part is answered, tap its sign to hear it counted again."
  - **Step `{ from: 8, to: 8 }`:** "First tap the up and down arrows to move the path between rows, then tap the path button to lay it there. Anywhere works."
  - **Finish `{ from: 7, to: 9 }`:** "Two orchards split and counted make a round; one sticker."
  - **The existing note** `{ from: 4 }` becomes `{ from: 4, to: 6 }`.
  - **New note `{ from: 7, to: 9 }`:** "Each wrong number is a miss; a second on one question glows the answer. Arrows, where the path goes and sign taps are free. Two parts that make the whole is the distributive property: 7 × 4 = 5 × 4 + 2 × 4, and at level 9, 3 × 14 = 3 × 10 + 3 × 4."
- **Voice lines** under `orchard.*`:
  - **Instructions:**
    - `pathtop`: "A path splits this orchard. How many trees are above the path? Tap that number."
    - `pathbottom`: "How many trees are below the path? Tap that number."
    - `pathten`: "A path runs down the orchard after ten trees in every row. How many trees are on the side with ten in each row? Tap that number."
    - `pathones`: "How many trees are on the other side of the path? Tap that number."
    - `pathwhole`: "How many trees are in the whole orchard? Tap that number."
    - `choosepath`: "Here are {rows} rows of {each}. Tap the arrows to move the path, then tap the path button to split the orchard where you like."
  - **Other lines:**
    - `pathlaid`: "{above} rows above the path and {below} rows below."
    - `partcount`: "{rows} rows of {each}: {count}."
    - `partone`: "One row of {each}: {each} trees."
    - `wholehint`: the wrong-whole reason above.
    - `pathjoin`: "{a} and {b} make {total}. {rows} rows of {each} make {total} trees!"
    - `done.path`: the finishing line above.
  - **Reused:** `orchard.yes` after a right part (with the part's rows and each) and `orchard.followglow`.
  - **Speech check:** the building session checks "rows of" and the spoken counts against device speech.
- **Registration:**
  - `LEVELS` becomes `{ school: { min: 1, max: 9 } }`.
  - `describeLevel` reads the new plan names.
  - `skills` gains `'distributive property'`.
  - `coplayHint` adds: "At the path levels, count the part you know first, then add the other."
  - Unchanged: the ID, Barnyard, region `counting-cove`, `challenge: 'numbers'`, the hub icon and the sticker.
  - Off-screen stays as is.
- **Couch:** none. **Save:** no new field.

## Check tier (for the build)

- **Batch `orchard-rows 3` (levels 7–9), new-interaction tier:**
  - `npm run typecheck`;
  - the rule tests above, with the registry, lands, how-to and off-screen tests;
  - one scripted play through a `browser-check.mjs` filter (`ORCHARD_LEVELS=7,8,9` or the case's existing filter):
    - level 7 with one wrong part pad, a second for the glow and its hint, then the glowing pad, and a sign tap after the first part;
    - level 8 with an arrow at the range end and the path laid at 2;
    - level 9 to its sticker;
  - one portrait screenshot of level 9 with both signs;
  - `fingerdemo` at 7, 8 and 9;
  - `npm run build`, because voice and how-to change.
- **Stop point:** levels 7 and 9 share the fixed path and pads, and level 8's moving path is the separable part. If the allowance cannot cover all three, finish 7 and 9 (with `LEVELS` max 9 and level 8 temporarily skipped through `order`), or 7 alone, with a draft-PR checkpoint. Level 8 is then its own run.
- **Not run in this docs slice:** everything except `node scripts/check-links.mjs` and `git diff --check`.
- **Person and device checks**, opened at the build:
  - Does an eight-year-old count the five rows by rows, or tree by tree?
  - At level 8, does she choose a split she knows (5, or a square), or leave the path where it starts?
  - Does "on the side with ten in each row" carry level 9 without the words *tens* and *ones*?
  - Are the skip counts clear in device speech?

## Open decisions

Each has a default the build uses; none blocks the batch.

1. **Signs before her answer.** Default: a sign re-counts its part only after that part is answered, so it never gives a question away. If play shows she wants to count a part first, the sign could light the rows one at a time silently and let her count.
2. **Level 8 hint.** Default: none for the split, and the answer glow after two misses. If she freezes at the arrows, the pet could say "Five rows is a good place" after a few seconds without counting a hint.
3. **Three questions per orchard.** Default: part, part, whole, twice. If the parts feel repetitive by the second orchard, the second orchard could ask only the whole, with the parts' signs already showing.
