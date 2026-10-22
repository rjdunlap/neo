# Meadow Pens, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [area, volume and space study](../deep-dives/subjects/area-volume-space.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/area-volume-space.md#a-first-games-ladder-meadow-pens) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#area-volume-and-space-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build on the defaults below, with one merge gate.** The level-2 card table ([below](#level-2-card-table)) is the study's distractor set, and the study's [decision 8](../deep-dives/subjects/area-volume-space.md#decisions-for-the-developer) asks for a mathematics review of it: the build merges only after the developer approves that table (or names someone who does; see the standing reviewer question in [WAITING](../WAITING-ON-DEVELOPER.md)). The table is complete here so it can be approved before the build starts. Levels 1 and 3 have no review gate. Whether to register a new game at all is [decision 1](#open-decisions). Levels 4–5 (more grass or more fence; two parts) are a separate later packet, and 6–7 wait on the study's decisions 4 and 5.

**Fun action and purpose:** a friend at a meadow gate asks for a pen: "I need six squares of grass!" She paints squares of grass on a meadow grid, and **the fence builds itself** around whatever she paints, one piece per grass edge, each piece leaving a visible stack beside the meadow with a wooden tick. She rings the gate's bell and the friend walks in. The learning purpose is **area as a count of unit squares and perimeter as a count of edges around them, two different counts of one shape** (CCSS 3.MD.C.5–6 and D.8; 2.G.A.2 for rows and columns at level 2; the study's [anchors](../deep-dives/subjects/area-volume-space.md#anchors-opened-at-their-source)). Level 3 is the documented area–perimeter confusion turned into a puzzle: the same six squares need ten, twelve or fourteen fence pieces depending on the shape. No level shows a formula, an equation or a unit name.

## Identity and overlap

Rechecked 2026-10-22 against the catalog and the notebook, as the study's decision 1 asked:

- **Pixel Pictures** (Treehouse) also taps grid squares, but copies a picture; the decision there is *which picture square*, here it is *a shape that meets a size and fence request*, and the fence model is new. Scale stays with Pixel Pictures' *big picture* (ratio study).
- **Garden Grow, Tangram Town, Shape Buddies, Bug Builder** cover planting, composing shapes, naming shapes and symmetry; none counts covered squares or edges. Capacity stays with **Fill and Dump**.
- **Pen Planner** (notebook, Shikaku) gives the areas as numbers and asks her to split a whole grid into rectangles: a logic puzzle over areas already known. Meadow Pens never splits a field and never shows a number to satisfy on the grid; she builds one pen from a request. Pen Planner remains a later school-top and grown-up rung after Meadow Pens has taught counting squares and rows.
- **Meadow Fence** (notebook, Qix) closes off a share of a meadow with straight cuts and estimates the fraction claimed: fractions and percent, not unit squares.

**Name:** keep **Meadow Pens** for this game. The two notebook proposals keep their names as proposals, but when either is defined it takes a name without "Meadow" or "Pen" (suggested: *Field Planner* for the Shikaku board, *Butterfly Field* for the Qix one), so three games never share a word on one map; [decision 1](#open-decisions).

## The model (`logic.ts`)

- **Grid:** a fixed model grid of **6 columns × 4 rows** (24 cells). In portrait the board is drawn transposed (model cell `(x, y)` drawn at column `y`, row `x`, giving 4 columns × 6 rows). Transposing is a reflection, so area, fence count, connectivity and every request are unchanged; `resize()` only redraws, and a rotation mid-round keeps every painted cell and the fence. Spoken "rows" at level 2 always mean the rows as drawn.
- **Painted set and pen:** `painted` is a set of cells. The **pen** is the largest side-connected group of painted cells (ties: the group holding the earliest-painted cell still painted). Every other painted cell is a **flower**: drawn as a little flower, not grass, with no fence, never counted. A flower that comes to touch the pen side by side turns to grass; corner-only touching does not join. Lifting a cell that splits the pen leaves the larger part as the pen and turns the rest into flowers. Flowers in a finished pen stay as decoration.
- **Fence:** one piece on **every edge between a pen cell and anything that is not a pen cell** (the meadow's border, an unpainted cell, a flower). A pen that rings an unpainted cell (possible from 7 squares) fences that hole too, drawn as a little pond inside the pen, so the fence count is always `4n − 2 × shared edges` for the pen's `n` cells.
- **Fence stack:** at levels 1–2 a heap of 20 pieces that shrinks as pieces leave and is topped up by a little cart whenever it falls below 6, so it never limits free play and shows no number. At level 3 a **counted stack** of exactly the requested pieces, with a dot per piece; if the pen needs more, the missing edges show as dashed gaps and the stack is empty; spare pieces stay on the stack.
- **Requests:** level 1 `{ squares: n }`, `n` in 3–8; level 2 `{ field: [rows, cols] }` from the card table below; level 3 `{ squares: 6, fence: f }`, `f` in 10, 12, 14.
- **`check(pen, request)`** returns `ok` or the first failing reason: `empty` (no pen), `squares(have, want)`, then (level 3) `fence(have, want)`. Flowers never affect it.
- **`targetFor(pen, request, grid)`** returns the pen the hint glows: a valid pen inside the grid keeping as many of her pen's cells as possible (ties in a fixed enumeration order). Level 1: grow by adding a side neighbour of the pen, or shrink by lifting a non-cut cell (every connected set has one), until the size matches. Level 3: the best-overlap placement among every connected six-cell set in the grid with the requested fence count (an enumeration of a few thousand placements).
- **Authored first round** for each level so the how-to card and its demonstration open on the same meadow; later rounds are seeded from `ctx.rng`.

## Levels

| Level | Name | Bands (default) | What she decides | A round |
| --- | --- | --- | --- | --- |
| 1 | **Enough grass** | school | Any connected shape with the squares asked for | Three pens |
| 2 | **Rows of grass** | school | How many squares cover a fenced field, counted by rows | Five fields |
| 3 | **Same grass, new fence** | school | A six-square shape whose fence uses every piece on the stack | Three pens |

`BandLevels`: `school: { min: 1, max: 3 }` only. A pre-K window at level 1 waits for a person check ([decision 6](#open-decisions)); no lap, toddler, preschool or grown-up window.

### First rounds

- **Level 1:** an open meadow; a rabbit-like critter friend at the gate asks for **four** squares (authored). Any connected four passes: a line, an L, a square, a T. *Variation:* the second and third pens ask for a seeded `n` from 3–8 (never the same twice in a round), and the friend is seeded from `CRITTERS`.
- **Level 2:** a fenced **2 × 3** field outline (authored) on the meadow; the first row and the first column paint themselves, a row's squares lighting one by one with a count. "How many squares of grass will cover the whole field?" Three number cards: 6, 9 and 10. *Variation:* the other four fields are seeded, without repeats, from the table's remaining sizes.
- **Level 3:** "Six squares of grass, and use every fence piece!" with a counted stack of **10** (authored): only a 2 × 3 or 3 × 2 pen does it. The second and third pens are 12 and 14 in a seeded order, so one round meets the same grass with all three fence counts.

### Level-2 card table

Every field's three cards are the right total, the **fence count** around the field (the documented area–perimeter confusion; the fence is visibly there), and one more documented slip: **rows plus columns** (the sides added) or **a row off** (one row too few or too many, the slip of counting rows). The third card is chosen so the right total is sometimes the smallest card, sometimes the middle and once the largest; card positions are shuffled by the seed.

| Field (rows × cols, as drawn in landscape) | Right | Fence | Third card | Why the third |
| --- | --- | --- | --- | --- |
| 2 × 3 | 6 | 10 | 9 | a row too many |
| 2 × 4 | 8 | 12 | 6 | rows plus columns |
| 2 × 5 | 10 | 14 | 15 | a row too many |
| 3 × 3 | 9 | 12 | 6 | a row too few |
| 3 × 4 | 12 | 14 | 16 | a row too many |
| 3 × 5 | 15 | 16 | 10 | a row too few |
| 4 × 5 | 20 | 18 | 15 | a row too few |

**4 × 4 is excluded:** its fence count (16) equals its area, so the confusion card would be the right answer. 3 × 3's third card, 6, is both rows-plus-columns and a row too few.

## Gestures and accounting

**Inputs:** custom pointer handling on the grid (a paint gesture, not an object drag). Touch-down on a cell paints or lifts it at once: a turf puff and a rising pentatonic step per new grass square, a soft pluck when lifting. A drag continues the mode it started with: started on an unpainted cell, it paints each cell it enters; started on a painted one, it lifts. One finger only (the first pointer; later pointers are ignored, the palm rule), `pointercancel` handled on `window` in capture and removed in `destroy()`; leaving the screen ends the stroke. At level 2 the field's cells can also be tapped to paint them, each saying its running number: a free counting aid. The **bell** on the gate rings the check; a tap on the friend or the request bubble replays the request.

Only a ringing that fails (levels 1 and 3) or a wrong card (level 2) is a mistake:

| Gesture | Result | Counts |
| --- | --- | --- |
| Paint, lift, drag-paint, repaint | Grass and fence change; pieces leave or return to the stack, one tick each | Nothing |
| A square that touches no grass (or only at a corner) | It sprouts a flower that asks to join: "Join me to the grass!" | Nothing |
| Tap the friend or the request | The request again | Nothing |
| Ring with no pen | The invitation again ("Paint some grass, then ring the bell.") | Nothing, every level |
| Ring, wrong number of squares (1, 3) | The friend counts the pen's squares aloud, a tap of light on each: "Five. I need six." The pen stays | **1 miss** |
| Ring, right squares, wrong fence (3) | The fence counts itself aloud, piece by piece; spare pieces wiggle on the stack, or the gaps blink: "Twelve pieces. Two are left on the stack." | **1 miss** |
| Ring, right pen | The gate opens, the friend hops in and plays, flowers bloom | Nothing |
| Wrong card (2) | The field fills row by row, each row counted aloud ("three, six"), and stops on the right total; the card set stays | **1 miss** |
| Right card (2) | The field fills and the friend hops in | Nothing |
| Watch a count replay, rotate the device | Nothing changes | Nothing |

**Help:** two misses on one pen or field glow `targetFor`'s outline (level 2: the right card) and count **1 hint**. The glow follows her painting until the pen is done. **Show a hint** (pause sheet) starts the same glow and counts 1 hint if that pen has not counted one; asking again repeats the speech and counts nothing. **Each pen or field counts at most one hint.** **Supported finish:** while a glow shows, ringing the bell (or tapping the glowing outline) paints the glowing pen by itself, lifting extra cells, cell by cell with the fence building, and the pen completes with no further miss; at level 2 the glowing card is tapped as usual. A supported round always finishes.

**Finishing:** after the round's last pen or field, all the round's friends play in their pens with a little bell tune, about four seconds; a tap skips to the end pose. `ctx.finish({ misses, hints })` runs once (a `finished` guard). One shell sticker, with or without help. Adaptation follows the shell's rule.

**Pause sheet:** Start again (clears the current pen's grass and flowers, keeping the round's misses and hints) and Show a hint (`Scene.pauseActions`).

## Screen and controls

- **Meadow grid:** cells **at least 100 logical units** (target 105), 6 × 4 in landscape, 4 × 6 in portrait, with a 6-unit gap so a cell's edge is clear. Clear of the guide's bottom-left corner and the Home button.
- **Gate, friend and bell:** the gate on the grid's right edge (landscape) or bottom edge (portrait); the friend beside it with a request bubble at least 220 × 120 (a picture of grass squares with dots, and from level 3 fence pieces with dots); the bell at least 120 × 120.
- **Fence stack:** a column at least 120 wide beside the grid (landscape) or a row under it (portrait); at level 3 its dots are at least 24 units apart. The stack is not a touch target.
- **Cards** (level 2): three cards at least 130 × 130, at least 30 units apart, in a column beside the grid (landscape) or a row under it (portrait), replacing the stack.
- **Companion:** `ctx.companion()` stands by the gate's side clear of the guide corner; it cheers when a friend hops in and wiggles on a miss.
- **Sound:** synthesized only: a rising pentatonic step per new grass square (resetting per pen), a wooden tick per fence piece, a gate bell, a soft count chime. The island style keeps playing.

`meadowLayout(view, level)` returns every rectangle (grid origin and cell size, gate, friend, bubble, bell, stack or cards, companion spot). A test runs it at the four views the lands test uses for each level and asserts cells at least 100 units, every other target at least its stated size, no overlaps, at least 30 units between neighbouring targets, the Home button and the guide corner clear, and everything inside `view`; it returns null rather than shrink, and the test fails on null.

### Layout sketches

**Landscape (1024 × 768), level 3:**

```
+------------------------------------------------------------+
| [Home]        [ bubble: 6 grass · 10 fence ]               |
|                                                            |
|      +--+--+--+--+--+--+        [stack]   friend           |
|      |  |  |  |  |  |  |        [ ··· ]   [gate]           |
|      +--+--+--+--+--+--+        [ ··· ]   (bell)           |
|      |  |  |  |  |  |  |        [ ··· ]                    |
|      +--+--+--+--+--+--+                  companion        |
|      ... 4 rows                                            |
|  pet                                                       |
+------------------------------------------------------------+
```

**Portrait (768 × 1024):** the bubble, then the 4 × 6 grid centred, then the stack (or the three cards) in a row with the gate, friend and bell at its right; the companion beside the gate. The view's spare height goes between the grid and the row below it.

## Speech (`voice-script.ts`)

"Squares of grass" and "fence pieces" only; "area" and "perimeter" are not spoken in this build ([decision 3](#open-decisions)). Every request is pictured as well as spoken. Instructions use `ctx.instruct`; everything else `ctx.say`.

- `meadow.instruct.1`: "Paint squares of grass for a pen. Make it as big as your friend asks, then ring the bell."
- `meadow.instruct.2`: "How many squares of grass will cover the whole field? Count the rows, then tap a card."
- `meadow.instruct.3`: "Paint the squares of grass, and use every fence piece on the stack. Then ring the bell."
- `meadow.ask.<n>` (3–8): "I need six squares of grass!"; `meadow.ask3.<f>` (10, 12, 14): "Six squares of grass, and use all ten fence pieces!"
- `meadow.flower`: "Join me to the grass!"; `meadow.empty`: "Paint some grass, then ring the bell."
- `meadow.count.<have>.<want>`: "Five. I need six." (the count itself is spoken square by square with `meadow.num.<k>`)
- `meadow.fence.left.<k>`: "Two are left on the stack."; `meadow.fence.more.<k>`: "The fence needs two more pieces."
- `meadow.field.ask`: "How many squares of grass will cover the whole field?"; `meadow.rows.<k>`: "Three. Six." (row totals during a fill)
- `meadow.hint.1` / `.3`: "Try the glowing pen."; `meadow.hint.2`: "Count the rows: try the glowing card."
- `meadow.in`: "Thank you! What a lovely pen!"; `meadow.all`: "Everyone has a pen!"

No line says to fence a real animal in or names an animal as kept.

## Rule tests (`logic.test.ts`)

1. **Pen and flowers:** for every painted set up to 8 cells reached by a seeded paint/lift walk, the pen is the largest side-connected group (with the stated tie rule), corner-only cells are flowers, and a flower joins on touching side by side.
2. **Fence count:** for every connected set of 1–8 cells in the 6 × 4 grid (enumerated), the counted fence edges equal `4n − 2 × shared edges`, including every holed set (the 3 × 3 ring of 8, the 7-cell rings).
3. **Level 1 accepts exactly the right size:** every connected set of size `n` in the grid passes `{ squares: n }` for every `n` in 3–8, and no set of another size does; flowers never change the result.
4. **Level 3 fence cases:** among connected six-cell sets in the grid, fence counts are exactly 10, 12 and 14; `{6, 10}` accepts only the 2 × 3 and 3 × 2 rectangles; `{6, 12}` and `{6, 14}` each have solutions; a pen with the right squares and wrong fence gives `fence(have, want)`.
5. **Card table:** for every field, the three cards are distinct, exactly one equals rows × columns, one equals the fence count `2 × (rows + cols)`, and the third is rows + columns or a row off; 4 × 4 is absent; every field fits the grid in both orientations; the authored first field is 2 × 3.
6. **Hints lead somewhere:** from every set reached by the seeded walks, `targetFor` returns a set that passes `check`, lies inside the grid, is connected, and keeps at least as many of her pen's cells as any other passing set (level 3: checked against the full enumeration).
7. **Accounting:** only a failed non-empty ring or a wrong card counts a miss; empty rings, paint, lift, flowers, replays and rotation count nothing; two misses give one glow and one hint; a pen never counts a second hint; the supported finish completes without a further miss.
8. **Orientation:** transposing a painted set keeps its pen, fence count and `check` result for every request.
9. **Seeded rounds:** level 1 never repeats `n` in a round; level 2 never repeats a field; level 3's round holds 10, 12 and 14 once each, 10 first.
10. **Layout:** `meadowLayout` at the four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` at the current level: level 1 paints a solver's pen cell by cell (a drag across a row, then single taps), lifts one extra square to show lifting is free, then rings; level 2 taps two cells of the second row to show counting, then the right card; level 3 paints a 2 × 3 for ten pieces (for 12 or 14 a `targetFor` shape) and rings. It waits for each pen's finish, so `fingerdemo` proves each level.
- **How-to card** (`src/content/howto.ts`). Goal: "Paint squares of grass for a friend's pen; the fence builds itself around them."
  - Steps: "Tap or drag to paint grass; tap a square again to lift it" (all levels); "Paint as many squares as your friend asks, any shape, then ring the bell" `{ from: 1, to: 1 }`; "Count the field's rows and tap the card for the whole field" `{ from: 2, to: 2 }`; "Paint six squares so the fence uses every piece on the stack, then ring" `{ from: 3, to: 3 }`.
  - Finish: "When every friend has a pen, it's done" `{ from: 1, to: 1 }`; "After five fields, it's done" `{ from: 2, to: 2 }`; "When every friend has a pen, it's done" `{ from: 3, to: 3 }`.
  - Notes: "Painting and lifting are free; only a bell ring with the wrong pen counts as a miss, and two light up a pen that works" `{ from: 1, to: 1 }`; same with "the wrong fence" `{ from: 3, to: 3 }`; "A wrong card fills the field row by row; two light up the right card" `{ from: 2, to: 2 }`; "Grass is the area and the fence is the perimeter; the game says only squares of grass and fence pieces" (all levels).
- **Registration (default, [decision 1](#open-decisions)):** ID `meadow-pens`, name "Meadow Pens", spoken title `game.meadow-pens` ("Meadow pens"). Region (subject) `rainbow-meadow` (shapes). Skills `['area', 'perimeter', 'arrays', 'spatial-reasoning']` (free strings). Bands `school: { min: 1, max: 3 }`. Home land Rainbow Meadow ([decision 2](#open-decisions)). Hub icon: a 2 × 3 grass patch inside a little fence. Sticker (page `meadow`): a seeded pen shape with its fence and a flower.
- **Art:** code-drawn in `src/games/meadow-pens/art.ts` with `src/art/palette.ts`: turf cells, fence pieces (post and rail per edge), the stack and cart, gate and bell, request bubble pictures, flowers, a pond for a hole, number cards. Friends from `CRITTERS`. No imported art or audio.
- **Co-play:** one person names a number and the other paints a pen that size; then swap, and the other counts the fence. **Off-screen** (spoken tip): "Cover a placemat with sticky notes and count them, then run a finger round the edge and count the sides you pass."
- **Couch:** none. **Journal:** nothing filed in this build (a pen entry waits for a journal line the data can check). **Creations:** none.
- **Rework couplings:** uses `ctx.companion()`; friends can become her creatures when the rework provides them; a finished pen is a place a friend visits, never a home it must stay in, and nothing accrues.

## Check tier

The build is one declared same-game batch, [meadow-pens 1](../GAME-BATCHES.md#meadow-pens-1-levels-13), in one worker and PR: the new-game tier (typecheck, unit tests including the rule tests above, one new `browser-check.mjs` case filtered to Meadow Pens covering levels 1 and 3 with one wrong ring each and a requested hint, plus one wrong card at level 2, `fingerdemo` at levels 1–3, one portrait screenshot at level 3, and `npm run build` for the registry, lands, voice and how-to files). If the allowance cannot cover all three levels, stop after a complete level 1 (or 1–2) with a draft-PR checkpoint. **Merge gate:** the developer's approval of the [level-2 card table](#level-2-card-table).

## Open decisions

Each has a default the build uses; only the card-table review gates the merge.

1. **New game and name.** Default: a new game named **Meadow Pens** (the identity section says why it is not a Pixel Pictures or Bug Builder mode); the notebook's Pen Planner and Meadow Fence take different names when defined. Alternative: Pixel Pictures' top levels, if the developer judges the paint gesture too close.
2. **Land.** Default: Rainbow Meadow (11 games today; 12 with this; 13 if [Adventure Walk](adventure-walk.md) lands there first, as Puzzle Peaks already lays out; 14 if [Sprout Shuffle](sprout-shuffle.md) also does). `lands.test.ts` decides at build time; if the layout returns null, the fallback is **Counting Cove** (12 games, the counting land), the region staying `rainbow-meadow`.
3. **Names for the counts.** Default: "squares of grass" and "fence pieces" only. Later, after a device speech check of "area" and "perimeter", they can join from level 3 (a voice-line swap).
4. **The hay loft** (level 7) stays with the study; nothing here depends on it.
5. **Where levels 6–7 live** stays with the study; nothing here depends on it.
6. **A pre-K window at level 1.** Default: school only, until a person watches a five-year-old play it with a grown-up.
7. **Four quadrants** stay with Treasure Map (study).
8. **Review.** Default gate: the developer approves the level-2 card table before merge (or names a mathematics reviewer); levels 4–5's comparison pairs get the same review at their definition.
