# Orchard Rows, levels 4–6 (definition)

Defined 2026-10-31 as slice NS1 of the [number-structure study](../deep-dives/subjects/number-structure.md#build-slices-in-order) ([packet row](../deep-dives/subjects/RECOMMENDATIONS.md#number-structure-recommendations)), [PR #1063](https://github.com/rjdunlap/neo/pull/1063). The study's leans are adopted under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/number-structure.md#decisions-for-the-developer)): extend Orchard Rows rather than make a new game (decision 1; the queued Orchard Rows game dive numbers its own levels from 7); baskets of 12 to 24 (decision 2); *factor*, *multiple* and *composite* on the grown-up card only, *prime* spoken only in level 6's answer line (decision 3). Lunch boxes and Two frogs go to their games' dives (decision 4). One build batch follows ([batch plan](../GAME-BATCHES.md#orchard-rows-1-equal-rows-every-way-only-one-long-row)).

**Fun action and purpose:** a basket of saplings and the orchard bed. She presses an arrow to change how many rows, and the saplings jump into that many equal rows at once. Any that cannot make another full round stay in the basket, so she sees the leftover *before* anything counts. **Plant** grows the trees. Level 4: find a row count with none left over. Level 5: plant every different orchard one basket can make. Level 6: of three baskets, find the one that only makes one long row. Learning goal: *a number of things can be arranged in equal rows only in certain ways. The row counts that leave nothing over are its factors, and a number with no way but one long row is prime.* This covers division as an unknown factor (CCSS 3.OA.B.6), every factor pair to 24, and prime versus composite (4.OA.B.4), all opened by the study. Levels 1–3 count a given array; these levels ask which arrays a number allows.

## Where the study's text changes

The study's ladder was checked against the built game (`src/games/orchard-rows/index.ts`, `logic.ts`) and changes in four places. Each change is binding on the build.

1. **The orchard is a picture at levels 4–6, not 100-unit rows.** `orchardLayout` gives every row a 100-unit tap band from y 220, so six rows already pass 768, and a basket of 24 can reach 12 rows. The trees are about 58 units wide and overlap past about nine in a row. So at levels 4–6 no row or tree is a target, the bed's cell size comes from the shape (below), and the study's "then the familiar count by rows" becomes an automatic spoken count as the rows grow ("4 rows of 3 make 12 trees!"). Levels 1–3 keep their tappable rows and `orchardLayout` unchanged. Decision 2's "at the game's current tree spacing" does not hold and is replaced by the tested cell size below.
2. **Each level has its own row-count range.** Level 4 runs **2 to ⌊N/2⌋**, so "none left over" always means right and one row never needs a ruling. Level 5 runs **1 to ⌊N/2⌋**, which reaches every factor pair in at least one orientation (only the 1 and N pair needs one row). Level 6 runs **2 to ⌊N/2⌋**, because one long row is the answer button, not a try.
3. **Level 6 baskets stay 12 to 24, so the primes are 13, 17, 19 and 23.** The study's "primes from 5 to 23" contradicts its own basket lean. Small primes would also make the prime basket the obviously small one. Every set holds an odd composite (15 or 21) beside the prime, so "the odd one" is never the cue.
4. **Trying is not answering at level 6.** Tapping a basket only loads it into the bed and the arrows, which is free. A separate **One long row** button, in Plant's place, is the answer for the loaded basket. Hints at levels 4–5 glow an arrow (or Plant), not "every row count", because the control only ever shows one count.

## The accounting rule

Stated once and binding on every level:

- **Free:** pressing an arrow (including at the end of its range, where the arrow wobbles), loading a basket at level 6, and planting a shape at level 5 that has already been found. Nothing she does by trying is a miss.
- **A miss** is **Plant** with saplings left in the basket (levels 4–5), or **One long row** on a basket that has an equal shape (level 6, at most once per basket; pressing it again on a basket already shown replays its shape for free).
- **Help:** a second miss on one basket (or one set at level 6) starts a persistent glow and counts **one hint**, at most one per basket or set. At levels 4–5 the glow is on the arrow toward the nearest row count where Plant is right, moving with her until she reaches it, then on Plant. At level 6 it is on the prime basket, then on One long row once that basket is loaded. A round finished with the glow is one sticker, not evidence that she sees factors on her own.

## Overlap and reuse

- **The game.** The same scene, backdrop, `tree()` art, `tile()` controls and `onTap`; no drag. The seeded fruit colour stays, and the sapling kind (apple, pear, plum) is chosen from the seed. The turning arrow and number pads are not used at 4–6.
- **No new shared helper.** The basket, the row-count picture card and the frames are drawn in the game with `Graphics`. The deal and the growth use scene tweens (`ctx.tw`). The study's leftover-before-commit idea follows Paint Mixer's visible rows, but no code is shared.
- **Nothing saved or kept.** No save field and no render texture.

## The model (`logic.ts`)

- **Plans.** `PLANS` gains three entries with new modes `'equal'`, `'every'` and `'prime'`: 4 *Equal rows*, 5 *Every way*, 6 *Only one long row*. Levels 1–3 and their IDs are unchanged.
- **Deal.** `deal(n, rows)` returns `{ rows, each: ⌊n/rows⌋, left: n mod rows }`. The bed shows `rows × each` saplings and the basket shows `left`.
- **Range.** `rowRange(level, n)` returns `{ min: 2 | 1, max: ⌊n/2⌋ }` per the list above.
- **Right rows.** `equalRows(n, range)` lists the divisors of n inside the range.
- **Shapes.** `framesFor(n)` lists the factor pairs `[a, b]` with a ≤ b and a·b = n. `frameOf(n, rows)` normalises `{rows, n/rows}` to its pair, so 3 rows of 4 and 4 rows of 3 are one frame. The game reports "turned" when the pair is already found in the other orientation.
- **Baskets.**
  - **Level 4:** each round has two baskets. The first is **12**, opening at **5 rows** (5 rows of 2 with 2 left; 5 is the only row count from 2 to 6 that leaves some over). The second is seeded from **15, 16, 18 and 20**, opening at a seeded row count that leaves some over.
  - **Level 5:** each round has one basket, seeded from **12, 16, 18, 20 and 24**, opening at a seeded row count that leaves some over. Its frames number three, or four for 24.
  - **Level 6:** each round has two sets of three baskets. The first set is always **12, 13, 15** in seeded order. The second is seeded from the set pool, with a different prime.
- **The level 6 set pool.** Every three-basket set from 12–24 with exactly one prime (13, 17, 19, 23) and at least one of 15 or 21. That is 4 primes × 15 decoy pairs = **60 sets**, generated in `logic.ts`, never typed.
- **Wrong claim shape.** `shapeOf(n)` gives a composite's smallest row count from 2 up with none left over (15 → 3 rows of 5). The pet plants that shape in the bed when the claim is wrong.
- **Help target.** `hintTarget(level, state)` returns `'up' | 'down' | 'plant'` at levels 4–5. It chooses the nearest row count in range where Plant is right (at 5, one whose frame is still empty); on a tie it goes up. At level 6 it returns `{ basket }` and then `'claim'`.
- **The bot.** `botStep(level, state)` is the same target as the help, so the ghost never misses. It is tested by simulation.

### Bands and ranges

`LEVELS` becomes `{ school: { min: 1, max: 6 } }`; `order` is simply 1–6. No other band.

## Screen and controls

The view is logical units from `view`. The pet keeps its 200 × 205 bottom-left corner, and the corner buttons keep the top corners. `layout(view, level, shape)` is pure and returns null rather than shrink a target.

- **Landscape (1024 × 768).**
  - **Top strip** (y about 110–220, clear of the corner buttons):
    - Levels 4–5: the basket, a 150 × 90 picture of its leftover saplings.
    - Level 5: up to four shape frames of 100 × 90 beside the basket, each an outline grid of dots for its factor pair, filled when found.
    - Level 6: three basket buttons of 140 × 110 instead, each a heap picture. The loaded one sits lifted with a ring.
  - **Bed:** x 210 to w − 290, y 230 to h − 30.
  - **Controls column** (centre w − 140):
    - up arrow, 130 × 100;
    - the row-count card, 130 × 120: a stack of short bars, one per row, a picture only;
    - down arrow, 130 × 100;
    - **Plant**, 130 × 110 (at level 6, **One long row**: a single long row of dots).
- **Portrait (768 × 1024).**
  - **Top strip:** the basket (or the three baskets), with level 5's frames on a second strip beneath.
  - **Bed:** full width less 40 a side, ending above y = h − 225.
  - **Controls row**, right of the pet: down arrow, card, up arrow, then Plant, each 110 to 120 wide, at least 100 tall.
- **Cell size.** Cells are `min(bedW / each, bedH / rows, 90)`. Trees and saplings scale to the cell; they are pictures (`eventMode = 'none'`). The defining arithmetic gives the narrowest cell, at one row of 24, about 22 in landscape and 29 in portrait. At 12 rows of 2 the cell is about 42 and 38. The layout test requires every reachable shape at every basket size to be **at least 18** at the four views. If a phone-inset view fails, drop 24 from level 5's pool rather than shrink a control.
- **Feel.**
  - **Touch-down:** an arrow darkens at once.
  - **The deal:** the saplings hop from the basket into the rows one at a time, down the rows, in 0.6 s or less. A tap during a deal finishes it at once and applies the new count.
  - **Sounds:** a soft pentatonic tick per row, and a low settle under the leftover.
  - **Plant:** grows the trees row by row while the pet counts.
  - **Plant with a leftover:** the leftover saplings wobble and Plant gives a gentle boing.
  - **Music:** `STYLES.hub`, as now.
  - **Reduced motion:** the deal is instant and the trees still grow.
- **Speech.** The deal line ("4 rows of 3, none left in the basket" or "5 rows of 2, and 2 left in the basket") is spoken once the count rests for half a second. That pause uses a scene-guarded timer, so rapid taps speak only the last count. `ctx.instruct` gives each level's ask, and tapping the pet repeats it. Numbers are spoken and pictured, so nothing needs reading. The heading keeps its `rows × each` numerals for grown-ups.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint (one per basket or set) | Never counted |
| --- | --- | --- | --- |
| 4 | Plant with saplings left | the glow after a second miss | arrows, the range-end wobble |
| 5 | Plant with saplings left | the same, toward an unfound shape | arrows; a shape already found ("We have that one. Turn it and it's the same orchard", or "We have that one already") |
| 6 | One long row on a basket with an equal shape, once per basket | the glow on the prime basket after a second miss in the set | loading baskets, arrows, claiming an already-shown basket again |

- **Spoken reasons:**
  - **Plant with a leftover:** "{left} are left in the basket. Every sapling needs a place in a row."
  - **Wrong basket at level 6:** the pet plants `shapeOf(n)` in the bed: "{n} makes {rows} rows of {each}, so it makes more than one long row."
  - **Right basket at level 6:** one long row grows across the bed: "{n} only makes one long row. Numbers like that are called prime."
- **Finishing.**
  - Level 4 ends after two planted baskets.
  - Level 5 ends when every frame is filled ("Every shape for {n} saplings!").
  - Level 6 ends after two sets.
  - Each ends through `ctx.finish({ misses, hints })` with one sticker, help or not.
- **Adaptation.** Standard. A step from 3 to 4 changes the interaction, and the how-to card covers it.

## Rule tests (`logic.test.ts`)

- **Deal:** for every n from 12 to 24 and every row count in range, `each·rows + left = n` and `left < rows`.
- **Right rows:**
  - `equalRows` equals brute force.
  - Every level 4 basket has at least two right row counts.
  - Every opening row count (levels 4–5) leaves some over.
  - Level 4's first basket is 12 at 5 rows.
- **Frames:**
  - `framesFor` matches brute force.
  - Every frame is reachable inside `rowRange(5, n)`.
  - One row and N rows are the same frame.
  - There are never more than four frames for the level 5 pool (12 → 3, 16 → 3, 18 → 3, 20 → 3, 24 → 4).
- **Prime sets:**
  - The pool holds exactly 60 sets.
  - Each set has exactly one prime from {13, 17, 19, 23} and at least one of 15 or 21.
  - Every composite has a row count in 2–⌊n/2⌋ with none left over.
  - Every prime leaves some over at every row count in range.
  - `shapeOf` is right for every composite.
- **Rounds:** over 300 seeds per level:
  - the same seed gives the same baskets, openings and fruit;
  - level 6's first set is {12, 13, 15};
  - its two sets have different primes.
- **Accounting:**
  - Arrows, range-end presses, repeated shapes, basket loads and repeated claims count nothing.
  - Each Plant with a leftover, and each first wrong claim per basket, is one miss.
  - A second miss starts the glow and counts one hint; hints never exceed one per basket or set.
- **Help leads somewhere:** from every reachable state, following `hintTarget` stays in range and reaches a right Plant (at 5, an unfound frame) or the prime claim, in at most ⌊n/2⌋ steps.
- **The bot:** a simulated `botStep` finishes every level for 100 seeds with no misses.
- **Layout:**
  - `layout` is tested at the lands test's four views (landscape, portrait, two phone insets) for every level and every reachable shape.
  - Arrows, Plant, One long row and the level 6 baskets are each at least 100.
  - No two targets overlap.
  - Nothing sits in the pet's corner or under a corner button.
  - Cells are at least 18.
- **Registry, lands, how-to and off-screen tests** pass with levels 4–6.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `autotouch()` follows `botStep` through the public controls, after each instruction and deal ends, one tap per call. It reads the current layout after every resize: arrows toward the target count, then Plant; at level 6, the prime basket, then One long row. It never calls finish.
- **How-to card** (`src/content/howto.ts`):
  - **Goal:** becomes "Plant an orchard in equal rows and count its trees."
  - **Existing steps:** the unscoped count step becomes `{ to: 3 }`; the others are unchanged.
  - **New step** `{ from: 4, to: 4 }`: "Tap the arrows to change how many rows. The saplings deal into equal rows and any left over stay in the basket. Tap Plant when the basket is empty."
  - **New step** `{ from: 5, to: 5 }`: "Plant every different orchard for one basket. Each fills its frame, and the same orchard turned on its side is the same frame."
  - **New step** `{ from: 6, to: 6 }`: "Tap a basket to try it in rows. When one leaves saplings over for every number of rows, tap the one-long-row button."
  - **Finish:** "Two orchards, one basket's every shape (level 5) or two sets of baskets (level 6) make a round; one sticker."
  - **Note** (grown-up words, decision 3): "The row counts with none left over are the basket's factors; a basket with only one long row is a prime number, the others are composite."
- **Voice lines** under `orchard.*`: `equal`, `every` and `onerow` (the three instructions), `deal`, `dealeven`, `leftover`, `followglow`, `newshape`, `turnedsame`, `already`, `everydone`, `basket` ("{n} saplings in this basket", said on load), `makes`, `prime`, `done.equal`, `done.prime`. The existing `orchard.yes` serves the spoken count after Plant. *Prime* is in `orchard.prime` only. The building session checks "rows of" and the numbers against device speech.
- **Registration:**
  - ID, land (Barnyard), region `counting-cove` and the hub icon are unchanged.
  - `skills` gains `'division'` and `'factors'` (free strings in `types.ts`; no list to update).
  - `describeLevel` for 4–6: "Equal rows: choose a row count with none left over", "Every way: plant every equal orchard for one basket", "Only one long row: find the basket with no equal rows" (no claim beyond the action).
  - `coplayHint` adds: "At the new levels, guess before pressing the arrow: will any be left over?"
  - **Off-screen** stays as now; the study's grouping card (NS4) is its own later slice.
- **Couch:** none.

## Check tier (for the build)

- **Batch `orchard-rows 1` (levels 4–6), new-interaction tier:**
  - `npm run typecheck`;
  - the rule tests above, with the registry, lands, how-to and off-screen tests;
  - one scripted play through a `browser-check.mjs` filter: level 4 with Plant on a leftover, a second for the glow and its hint, then the glowing arrow to Plant; level 5 with one shape planted twice (free); level 6 with one wrong basket claimed, then the prime;
  - one portrait screenshot of level 5 at one long row of its basket;
  - `fingerdemo` at levels 4, 5 and 6;
  - `npm run build`, because voice and how-to change.
- **Stop point:** if the allowance cannot cover all three levels, stop after complete levels 4–5 with a draft-PR checkpoint. Level 6 is then its own run.
- **Not run in this docs slice:** everything but `node scripts/check-links.mjs` and `git diff --check`.
- **Person and device checks**, opened at the build (the study's):
  - Does a seven-year-old use the leftover saplings to choose the next row count, or press arrows at random?
  - Does "every way" feel like a collection to complete, or like a test?
  - Does "only one long row" carry the idea without the word *prime*?
  - Are the deal lines clear in device speech?

## Open decisions

Each has a default the build uses; none blocks the batch.

1. **Level 5 round length.** Default: one basket per round (three or four plants and any free repeats). If play shows it is short, two baskets of three frames each.
2. **The spoken count after Plant.** Default: automatic. If a person check finds she wants to count, a tappable count could return only for shapes whose rows fit the 100-unit band (at most five rows).
3. **"Prime" on every right answer.** Default: yes, in the answer line only (twice a round). The person check decides whether once a round is better.
