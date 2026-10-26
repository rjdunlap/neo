# Meadow Pens: levels 1–5 built

Built 2026-10-25: `codex/meadow-pens-compare-parts`, [PR #972](https://github.com/rjdunlap/neo/pull/972), delivers slice 3, levels 4–5 together: finite grass/fence comparisons and two-part L fields. The [source check](#building-session-curriculum-source-check-2026-10-25) meets the decided curriculum gate; [verification](../archive/VERIFICATION-2026-10-25.md#2026-10-25--meadow-pens-levels-45-area-volume-space-slice-3) records implementation proof. No levels 6–7, persistence, assets or navigation changes.

Defined 2026-10-22 as slice 1 of the [area, volume and space study](../deep-dives/subjects/area-volume-space.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/area-volume-space.md#a-first-games-ladder-meadow-pens) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#area-volume-and-space-recommendations). The original packet was docs only; levels 1–3 are now implemented. Levels 4–5 are now implemented under the extension below; levels 6–7 remain gated.

**Status: built 2026-10-24 as levels 1–3 ([PR #932](https://github.com/rjdunlap/neo/pull/932)); the merge gate below was met by the build's source check of the card table (recorded in [VERIFICATION](../archive/VERIFICATION-2026-10-24.md#2026-10-24--meadow-pens-levels-13-area-volume-space-slice-1)). Original status: ready to build on the defaults below, with one merge gate.** The level-2 card table ([below](#level-2-card-table)) is the study's distractor set, and the study's [decision 8](../deep-dives/subjects/area-volume-space.md#decisions-for-the-developer) asks for a mathematics review of it: the build merges only after the developer approves that table (or names someone who does; see the standing reviewer question in [WAITING](../WAITING-ON-DEVELOPER.md)). The table is complete here so it can be approved before the build starts. Levels 1 and 3 have no review gate. Whether to register a new game at all is [decision 1](#open-decisions). Levels 4–5 (more grass or more fence; two parts) have a separate [definition below](#levels-45-definition-2026-10-25-slice-3), and 6–7 wait on the study's decisions 4 and 5.

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

**Decided 2026-10-23 (on the developer's delegation):** the level-2 card table is approved subject to the building session's source check against established curricula (recorded in the build's verification entry), which replaces the merge gate, and levels 4–5 get the same check; the other defaults stand (a new game named Meadow Pens; Rainbow Meadow, fallback Counting Cove; "squares of grass" and "fence pieces" until a device speech check; school only until a person watches a five-year-old play level 1).

## Levels 4–5 definition (2026-10-25, slice 3)

**Built 2026-10-25 ([PR #972](https://github.com/rjdunlap/neo/pull/972)); original definition:** worker `01a171d7-c22d-7e23-97e3-744d68311bf1`, `codex/meadow-pens-4-5-definition`, [PR #957](https://github.com/rjdunlap/neo/pull/957). This packet extends the built school-only game in place. Levels 1–3 and their saved numbers/pins stay unchanged; the build extends school to `{ min: 1, max: 5 }`. No new band, registration, land, save field, journal claim or reward. Levels 6–7 and the study's decisions 4–5 remain outside this packet. Earlier sections describe the original 1–3 packet; this section governs only 4–5.

**Fun action:** help friends choose between two finished pens, then count the grass in a bent field by watching its two rectangular parts fill. A correct choice opens the gate for a visiting friend. Learning purpose: compare covered squares separately from boundary edges, including equal counts; then compose an L's area from two non-overlapping rectangles (the study's CCSS 3.MD.D.8 and 3.MD.C.7.d anchors). No written formula, equation, side-length arithmetic or new terminology in child play. These are fixed fields, not paint requests: painting/erasing and the submit bell are absent at 4–5. Counting exploration stays free.

### Building-session curriculum source check (2026-10-25)

Opened the [primary CCSS grade-3 Measurement and Data standard](https://www.thecorestandards.org/Math/Content/3/MD/) in this build session. Standard 3.MD.D.8 supports comparing rectangles with equal area and different perimeter, or equal perimeter and different area; 3.MD.C.5–6 supports counting covered unit squares; 3.MD.C.7.d supports adding the areas of non-overlapping rectangular parts. This is a source/implementation check, not evidence of child understanding or device speech.

Checked every authored row independently: C1–C5 have grass pairs (6,6), (6,8), (5,8), (4,4), (5,6) and fence pairs (14,10), (14,12), (12,12), (10,8), (12,10). C1/C4 give equal grass, C3 equal fence; C2/C5 reverse the grass/fence ordering. The equality card prevents forcing a false greater-than answer. Both pens use identical square sizes and independent boundary counts.

L1–L6 have disjoint part counts (6,2), (8,2), (9,1), (8,4), (10,3), (12,6), whole counts 8,10,10,12,13,18, and boundary counts 12,14,14,16,16,20. Both possible rectangular splits cover the same L exactly once; the authored split stays fixed. Each card triple has exactly one whole-area answer. The perimeter distractor deliberately contrasts edge counting with square counting; the third represents filling the absent corner or omitting a part (L4), and is not a diagnosis. Spoken explanations name the material, count the two parts with the whole count continuing, and state the exact sum in words. The dashed internal seam is never a fence. Rule enumeration verifies these facts and reflection/transpose invariants. Tables needed no changes. This satisfies the building-session source gate for levels 4–5; the person/device and 6–7 decisions remain open.

### Level 4 — More grass, or more fence?

Two independently fenced pens share one meadow, with the same cell scale. Choose the pictured pen-A card, pen-B card, or **the same** card. A/B are documentation labels only: each pen and its card share a unique flower badge and matching outline pattern, so choice needs neither reading nor colour discrimination. The same card pictures two matching piles of the requested material; its spoken label is always replayable. There are no number answers at this level: this refines the study's generic card wording into two pen choices plus equality.

These are the complete comparison families; dimensions below are model width × height. Counts are author data, not printed equations. Placement may swap A/B and translate/reflect the pair while preserving the separating gap. Do not substitute random shapes, change cell scale, or add an unreviewed pair.

| Pair | A | Grass A/B | Fence A/B | B | More grass | More fence | Purpose |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | 6 × 1 | 6 / 6 | 14 / 10 | 3 × 2 | same | A | Same grass, different fence; authored opening |
| C2 | 6 × 1 | 6 / 8 | 14 / 12 | 4 × 2 | B | A | More grass can need less fence |
| C3 | 5 × 1 | 5 / 8 | 12 / 12 | 4 × 2 | B | same | Same fence, different grass |
| C4 | 4 × 1 | 4 / 4 | 10 / 8 | 2 × 2 | same | A | Smaller same-grass case |
| C5 | 5 × 1 | 5 / 6 | 12 / 10 | 3 × 2 | B | A | Second opposing comparison |

**Canonical placements:** A begins at `(0,0)`; B at `(0,2)` on the 6 × 4 model grid. Row 1 is empty: fences never join, share an edge, or count the other pen. Each shape is a separate set; never call the original largest-component `penOf` over their union. Transpose both together in portrait, keeping counts, badge identity and choice. Side-by-side spoken counts refer to badges, not fixed left/right/top/bottom names.

**A round is five questions.** Authored sequence: C1 grass, C1 fence, C3 grass, C3 fence, C2 grass. Reuse the first pair for its second question without moving it. Later rounds choose C1 or C4 for the first two questions, C3 for the next two, and C2 or C5 for the last; seed the starting material, alternate grass/fence throughout, and seed badge assignment/card order once per pair. This guarantees both kinds of equality every round and opposing comparisons across replays; it does not claim both questions about every pair in a single round. Never reseed on a retry, replay, hint or resize.

The question bubble pictures grass squares or fence rails and the pet speaks the full question. Touching a pen, its badge on the meadow, or the pictured material in the question replays a count: grass squares light one by one, or boundary edges tick one by one. These do not submit. Only a response card submits. Each wrong choice is one miss; the requested material counts in both pens in badge order, then the friend says which has more or that both have the same. Keep the pair and cards for a retry. Grass and fence have distinct textures and motions as well as colours. Fence counting includes every outside edge, not a pen's visual bounding box or the gap between pens.

### Level 5 — Two parts

An L-shaped field has one dashed internal split into **two disjoint rectangles**. Grass along that split has no internal fence. Each cell belongs to exactly one rectangle; the two together cover the L once. Touch either part to fill/count its rows freely. Choose among three number cards for the whole field. Each card is one answer target; touching a part never submits. The gate opens on the correct total; no second question asks for a formula or perimeter.

**Exact construction:** in a W × H bounding rectangle starting at `(0,0)`, remove the top-right `w × h` corner. A vertical split gives left `(W−w) × H` and bottom-right `w × (H−h)`; a horizontal split gives bottom `W × (H−h)` and top-left `(W−w) × h`. These formulas define author data only. Mirror the entire field and split together if seeded; portrait transposes both. Parts get different textures plus a shared grass colour; the notch stays visibly empty. The dashed seam means "two parts", never another length to add.

| Case | W × H; removed w × h | Split | Part totals, in count order | Right card | Fence distractor | Third card and meaning |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | 3 × 3; 1 × 1 | vertical | 6, 2 | 8 | 12 | 9, filling the missing corner (whole bounding box) |
| L2 | 4 × 3; 2 × 1 | horizontal | 8, 2 | 10 | 14 | 12, whole bounding box |
| L3 | 4 × 3; 1 × 2 | vertical | 9, 1 | 10 | 14 | 12, whole bounding box |
| L4 | 4 × 4; 2 × 2 | vertical | 8, 4 | 12 | 16 | 8, omitting the smaller part; bounding-box 16 would duplicate fence |
| L5 | 5 × 3; 2 × 1 | horizontal | 10, 3 | 13 | 16 | 15, whole bounding box |
| L6 | 6 × 4; 3 × 2 | horizontal | 12, 6 | 18 | 20 | 24, whole bounding box |

The fence distractor deliberately revisits grass versus fence; the third addresses counting absent grass or leaving out a part. None is a claimed diagnosis of a child's thinking. Every row has three distinct positive cards and exactly one correct total. Use only this finite table until reviewed. A round is five fields: L1 first (authored), then four different cases selected without replacement from L2–L6; later rounds seed five distinct cases, order, card order and field reflection. Do not seed different cut sizes or subdivisions. The authored L1 cards are 8, 12, 9 before seeded shuffling in later fields.

A wrong card is one miss. Fill/count the first rectangle by its **drawn rows**, then the second, keeping the first visible: "Six squares here. Two more here. Eight squares altogether." The running whole count continues from six to seven/eight; the second part's local count can replay separately. Never count a square twice or count the empty notch. Portrait changes row groupings but preserves part membership, totals and accepted answer. A fence distractor may then replay the L's outer edges with "Those are fence pieces. We are counting squares of grass." No added miss for watching the explanation. At L3's one-cell part, it must still be a visible, full-sized square and a legal counting target.

### Accounting, help and completion at 4–5

- One accepted pointer gesture on a wrong response card counts **one miss**; lock answer handling through its feedback and release before accepting another gesture. Pointer-down gives immediate visual feedback; a held finger, animation callback or replay cannot count again. Keep unanswered choices available after feedback. Correct answers add no miss.
- Empty meadow/background taps, free counts, request/pet replay, pause, resize and all cancelled gestures count nothing. These fixed fields have no empty-pen check. A request replay never answers for her.
- After **two misses on the current question**, glow its correct card and count **one hint**. Show a hint starts the same support and counts one hint if this question has not already counted one. Further help/replays count nothing; no separate automatic/manual hint budgets. Once support is active, wrong cards stop submitting; touching any response card completes via the correct card with the count explanation and no additional miss. Thus assisted completion stays available without requiring another precise choice; the how-to note must explain this action.
- Start again replays the current fixed question, preserving round misses, counted hint, support state, seed and completed-question index. It cannot erase help or award the same question twice. A new question resets its own miss/help state only. The five-question round accumulates shell accounting and calls `ctx.finish({ misses, hints })` once, after the short skippable friends/bell ending; exactly one shell sticker even with help. No additional game-owned award, timer or independent-mastery claim. Existing adaptation applies.
- Reuse `onTap` for cards/count targets and the existing speech/scene timing; no new custom drag input. Track/untrack highlights, guard feedback and transition callbacks, end animations/listeners on destroy, and preserve the fixed case and current step on resize. Demo input goes through the same targets.

### Speech, how-to and demonstration requirements

All proposed IDs below belong in `voice-script.ts` during the build. Instructions use `ctx.instruct`, which the pet repeats; feedback/counts use `ctx.say`. This packet adds no voice code or clips. Use full spoken words for quantities and reuse existing number lines where appropriate. Requests remain pictured; no navigation or answer requires reading. Keep "squares of grass" / "fence pieces"; introducing "area" / "perimeter" still requires the decided device speech check.

| Proposed line family | Required wording/example |
| --- | --- |
| `meadow.instruct.4` | "Look at both pens. Listen for grass or fence, then choose a pen, or choose the same." |
| `meadow.ask4.grass` / `.fence` | "Which pen has more squares of grass?" / "Which pen needs more fence pieces?" |
| `meadow.choice4.*` | Badge-specific "The pen with the daisy" / "The pen with the tulip", and "Both have the same"; speak on request/count replay, not as an extra answer gesture |
| `meadow.compare4.*` | "Six squares here. Six squares there. Both have the same grass." / "Fourteen fence pieces here. Ten there. The daisy pen needs more fence pieces." Generate only the finite table's actual badge/count/material combinations |
| `meadow.instruct.5` / `meadow.ask5` | "The bent field has two parts. Count the squares in both parts, then choose a card for all the grass." / "How many squares of grass cover the whole field?" |
| `meadow.parts5.*` | "Six squares here. Two more here. Eight squares altogether." One exact part-total/whole line per table case, including one-square grammar |
| `meadow.fence5` | "Those are fence pieces. We are counting squares of grass." |
| `meadow.hint.4` / `.5` | "Watch the count. The glowing card works. Touch a card and I will help." |
| completion | Reuse the built visiting-friend thanks and round ending if they describe the shown scene accurately |

**How-to:** scope the original paint/lift step to 1–3, preserving its existing level-specific notes. For 4 only: "Listen for grass or fence; compare both pens; choose a pen or the same." For 5 only: "Touch each part to count it; choose the card for all the grass." Finish at 4 and 5: "After five questions, it's done." Notes for each: only wrong answer cards miss, count replay is free, two misses or Show a hint glow a correct answer, then touching a card lets the game complete it with help. Plain grown-up description names comparing area/perimeter or adding rectangular areas without a learning-benefit claim.

**Ghost finger:** retain `touchDemo: true`. Level 4's authored opening touches each pen to count grass, taps same, waits for the unchanged C1 fence question, replays both edge counts and chooses the 6 × 1 pen, then solves the remaining three questions from the same comparison rule. Level 5 touches both L1 parts, waits for counts, taps 8, then solves the remaining four from union cell counts. Do not hardcode display positions or guess a numerical card index. Wait for feedback/question transitions, survive resize, and end only at shell completion. Supported play is a separate browser check; a flawless demo is not proof of hint accounting.

### Layout and implementation gates

Reuse one **6 × 4 board**, transposed to 4 × 6 in the tall portrait layout, with unit cells at least 100 logical units (including final scaling). Level 4 fits both pens within that board with a full empty row between them; it does not put two full grids beside each other. All three response cards are at least 130 × 130, 30 units apart, in the built level-2 card lane; each pen's badge/count replay target and each level-5 part must have at least one unambiguous 100 × 100 target. At level 4 the badge on the board counts while its matching response card answers: keep those regions separate and visually mark the response lane. Same needs a recognisable matching-piles picture and spoken support. Hide inactive bell/paint handlers and stack to avoid overlapping actions. Reuse the bubble/friend replay area, guide clearance and Home clearance; show count summaries beside the badges or above the cards without covering either. Portrait counts and split rectangles follow the actual drawn rows. The built layout transposes only when `h > w && h >= 1150` in logical view units, so do not infer grid orientation from physical screen dimensions; test the actual `View` transformation and both branches.

Extend `meadowLayout(view, level)` and its actual safe-view geometry tests to levels 4 and 5: cards, count regions, longest speech bubble/count labels, badge patterns, notch and seam, with no overlaps or shrink-to-fit fallback. Null is a build failure to resolve, not permission to reduce target size. A paper arrangement is **not verified capacity**; check actual portrait/landscape rendering, how-to fit, pet clearance and route back from the current Rainbow Meadow placement. No new catalog entry is proposed, but extending the school range must preserve current land paging, pins, launch band and return origin. Relocation, if genuinely needed, follows the existing decided placement process; this definition chooses no new land.

**Review gate:** the developer's October23 decision above replaces the old named-educator approval gate with a **building-session source check against established curricula** for levels 4–5. Before implementation merges, record a primary-source check of the entire comparison/card table, equality cases, disjoint coverage, distractor rationale and spoken explanations against the study's 3.MD.D.8 / 3.MD.C.7.d anchors; correct/review any change to these tables. The original docs review checked internal arithmetic only; the [building-session source check](#building-session-curriculum-source-check-2026-10-25) now satisfies this gate. It appoints no reviewer and decides no open study question.

**Required build proof**, in one separately admitted same-game batch for 4–5:

1. Typecheck and focused rule tests: enumerate every pair, both materials, badge/card permutations and transpose/reflection; unique accepted choice, including both equality kinds and reversed grass/fence ordering. Enumerate each L's cells, both construction splits (the authored split remains fixed per row), connectedness, two disjoint rectangular parts covering the exact L, no internal fence, boundary-edge count, three distinct cards/exactly one answer and every seeded five-question schedule. Hints must derive the correct card from these rules. Tests cover repeated/manual/automatic help caps, retries, restart after help, fifth-question finish-once, resize and destroyed callbacks.
2. One filtered browser play **per new interaction** (4 and 5): authored opening and largest field L6, one wrong answer, two-miss automatic hint and requested-hint replay/support; verify capped totals and the five-question finish. For 4 cover same grass, same fence and opposing ordering across the finite cases; use rules tests for arithmetic. Inspect one portrait screenshot at each distinct layout, including L3's one-cell part through a small layout assertion. No broad suite replay.
3. `fingerdemo` at 4 and 5; meaningful counts and both C1 questions must be demonstrated. Build if shared how-to/voice/catalog files change, as expected. Browser work stays within AGENTS' budget; record any unrun cases. No offline suite unless implementation changes persistence/assets/navigation.

**Person/device gates stay open:** real iPad speech for the new comparisons, same choice, part/whole counts and hint action; comfortable full-size targets and distinguishable badges/textures in both orientations; whether a child understands grass versus fence and two-part counting, with co-play as needed. Chrome and this definition cannot establish those. The existing pre-K/person, terminology/device, levels 6–7 placement and hay-loft decisions remain intact. Co-play can alternate who counts grass and fence; off-screen, arrange two patches of sticky notes with the same number, compare their outside edges, then cover an L placemat in two blocks and count all notes. No new practical animal-care instructions or obligation for a visiting friend.
