# Rain Garden, levels 1–3 (definition)

**Admitted to the build queue 2026-11-05** ([READY](../READY.md#queued)): the developer asked for the recommendations to be made without waiting, so the build uses this packet's defaults (settled in the [October 23 record](../archive/DECISIONS-2026-10-23.md#decisions)). Its source check and the lands test still run at build time.

Defined 2026-10-22 as slice 1 of the [weather-and-water study](../deep-dives/subjects/weather-water.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#weather-and-water-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-11-06 (levels 1–3, one batch, [PR #1303](https://github.com/rjdunlap/neo/pull/1303); [build note](../archive/COMPLETED-2026-10-09.md#rain-garden-levels-1-3-weather-water-slices-2-3-2026-11-06)).** Deviations are recorded in [GAMES.md](../GAMES.md#rain-garden). Science source check (decision 2's reader): EPA CADDIS ["Urbanization – stormwater runoff"](https://www.epa.gov/caddis/urbanization-stormwater-runoff) (hard surfaces reduce infiltration and increase surface runoff) and the USGS Water Science School runoff and infiltration pages (soil is like a sponge: some water soaks in and some runs off; saturated or paved ground sends water downhill). They support the toy model, and the grown-ups' card says real soaking is slower and depends on how wet the ground is. Level 4 is the next definition.

**Fun action and purpose:** a fat cloud hangs over a little garden on a slope. She taps it; four big drops fall one at a time with a plink, some tuck into the ground and the rest roll down a visible arrow into a pond where a frog waits. Then she changes the ground, stone or garden soil, and rains again. The learning purpose is **comparing what happens under the same rain when one thing changes** (NGSS K-ESS2-1 observing patterns; 4-ESS3-2 comparing designs, as a far horizon): the same four drops always start the trial, every drop is always somewhere she can see, and the only difference between two trials is the ground she chose. Every experiment is valid; nothing at levels 1–3 is a wrong answer.

## Identity and overlap

Rechecked 2026-10-22 against the catalog and the open proposals:

- **Garden Grow** (Rainbow Meadow, lap–pre-K) owns tapping a cloud to make flowers grow. Rain Garden never grows a flower from rain and never asks for a count of flowers; its rain falls on ground she chose and the outcome is *where the water stayed*. Lap keeps Garden Grow (no lap band here).
- **Water Paths** and **Puddle Pipes** (IDEAS proposals, not built) route a source to a target by drawing or turning pipe pieces: success is connection. Rain Garden's routes are **fixed** arrows she never edits at levels 1–3; she changes a surface, not a path. If a later level's decision became "connect the cloud to the flower", it would belong in those proposals instead (the study's own test). Levels 1–3 pass it.
- **Sand Table** ([definition](sand-table.md), dry grains only) owns pouring and reshaping material; it explicitly leaves water routing to Rain Garden. Nothing here moves sand or soil; a surface is a whole tile that flips.
- **Sink or Float** owns unpenalized predictions about objects in water. Rain Garden asks for no prediction at levels 1–3.
- **Weather Wardrobe** and **Day by Day** keep clothing and weather records; Rain Garden draws no weather symbol, forecast or calendar.
- **Drop's Journey** (study candidate, defined after this packet) owns a water parcel's path through places and states. Rain Garden shows no evaporation, cloud forming, freezing or any cycle; this is why its replay never sends drops back up (see [Replay](#replay-and-fresh-starts)).

## The model (`logic.ts`)

- **Surfaces** are `stone` (capacity 0) and `soil` (garden soil, capacity 2). The capacities are invented teaching numbers: not litres, rainfall depth, a soaking rate or a claim that all soil holds the same. No other surface exists at levels 1–3.
- **A patch** is `{ surface, stored }` with `0 ≤ stored ≤ capacity(surface)`. A **pond** is `{ water }`, unbounded within a round.
- **A shower** is exactly **4 units** at levels 1–3, released one at a time.
- **`runShower(patch, pond, units)`** returns the new states plus an ordered list of **steps**, one per unit: `{ unit, to: 'patch' | 'pond' }`. A unit goes into the patch while `stored < capacity`, otherwise along the arrow to the pond. A unit is never split, lost or created.
- **Conservation**, checked after every step: `units released + stored at start = stored + pond water`.
- **Outcomes** from a fresh (dry, empty) start, the whole table for levels 1–3:

  | Surface | Stored in the patch | In the pond |
  | --- | --- | --- |
  | stone | 0 | 4 |
  | soil | 2 | 2 |

- **A trial** is `{ surface, steps, stored, pond }`. Every trial starts **fresh**: patch empty, pond empty. Fresh-versus-already-wet ground is level 6, not here.
- **Level 2 pair:** two patches `left` and `right`, each with its own pond and the same 4-unit shower, so `runPair(left, right)` is two independent `runShower` calls with equal input and equal route. Changing one patch's surface changes only that patch.
- **Level 3 bookmark:** `bookmark` holds the round's **first** trial and is set once; later trials replace only `current`. `compare(bookmark, current)` returns `{ sameSurface, storedDiff, pondDiff }` for the spoken comparison.
- **Round state** per level, with `canFinish(state)`:
  - level 1: true once one trial has settled;
  - level 2: true once one pair has settled (any surfaces, including two the same);
  - level 3: true once a trial has settled after the bookmark with a **different** surface from it.
- **Authored first round** for each level (below), so the how-to card and demonstration open on the same board; later rounds are seeded from `ctx.rng` within the variation listed for each level. No board can fail: every surface choice has an outcome in the table above.

## Levels

| Level | Name | Bands (default) | What she decides | Finish available |
| --- | --- | --- | --- | --- |
| 1 | **Rain on the garden** | toddler, preschool | When to rain, and whether to rain again | After the first settled trial |
| 2 | **Two gardens, same rain** | preschool, pre-K | Which ground each patch has, then rain on both at once | After one settled pair |
| 3 | **Change it and try again** | pre-K, school | What to change the patch to, after a first trial is kept | After a second trial on different ground |

### First rounds

- **Level 1:** one soil patch, empty pond, the frog on its lily pad. Tap the cloud: drop 1 tucks into slot 1, drop 2 into slot 2, drops 3 and 4 roll down the arrow into pond slots 1 and 2. Result 2 stored, 2 in the pond. *Variation:* none in the ground (soil only); the pond friend is seeded among frog, duck and turtle, and the cloud's side (left or right, with the arrow running the other way).
- **Level 2:** left patch stone, right patch soil, both ponds empty, one wide cloud over both. Tap the cloud: drops fall in pairs, one on each patch at the same moment. Result left 0/4, right 2/2. She may then tap a patch's **ground tile** to flip it (stone ↔ soil); flipping resets both patches and ponds to fresh (both, so the pair stays a fair comparison) and the cloud waits. *Variation:* which side starts stone; both may start stone or both soil in a seeded round (still a valid comparison: the same ground gives the same result, which is its own finding).
- **Level 3:** one stone patch. Tap the cloud: 0 stored, 4 in the pond. The trial shrinks into a **bookmark card** (a picture of that patch and pond with its dots) beside the board, and the patch is fresh again. The two big ground tiles under the board light; she taps soil (tapping stone again is allowed and gives the same result, narrated as "the same ground, the same rain"). Tap the cloud: 2 stored, 2 in the pond, shown beside the bookmark. *Variation:* the starting surface (stone or soil) is seeded; the bookmark always keeps the first trial.

## Replay and fresh starts

Replay restores the starting state; it is not a model event. To keep that honest the reset is drawn as **a fresh, dry patch sliding in over the old one** (a short wipe from the side with a soft `whoosh`), and the pond tray tips into a drain cap under the board, both labelled by a **rewind badge** on the cloud. Drops **never rise back into the cloud**: to a child that reads as evaporation and condensation, which this kernel leaves out and Drop's Journey owns. Nothing dries out by itself, nothing floods, and nothing happens while she waits.

## Screen and controls

- **The board** is a soil cutaway on a gentle slope: grass line on top, cream-and-brown soil below with **two storage pockets** drawn as dashed ovals (stone draws **no** pockets, a hard grey slab with a dark outline, so capacity 0 is visible before it rains). A wide blue **downhill arrow** runs from the patch's low edge to the **pond tray**, which has four dashed slots. A unit is a big blue drop with a dark outline; where it is is always told by **position and shape** as well as colour: in a pocket (drop inside a dashed oval), on the arrow (drop with motion lines), in the pond (drop in a slot with a ripple ring).
- **The cloud** overhangs the patch (level 2: one wide cloud over both), at least 220×140 logical units, a target. Touch-down squashes it at once. Taps during a shower are ignored. Nothing is timed.
- **Ground tiles** (levels 2–3) are big squares, at least 120×120, under each patch (level 2: the patch's own tile flips on tap) or as a pair under the board (level 3: stone and soil side by side; tapping one sets the patch). Touch-down squashes; the patch changes with a soft `clunk` (stone) or `squish` (soil).
- **The leaf button** (Finish), at least 120×120, appears top-right of the board once `canFinish` is true, with a gentle bob. Tapping it ends the round through `ctx.finish`.
- **Sound:** each drop's landing is a pentatonic `marimba` step from `src/audio/notes.ts`, rising for pocket landings and a lower step for pond landings, plus a soft `splash` when a drop reaches the pond. No thunder, no lightning, no rain recording. The island style keeps playing (she is not making music); default `STYLES.bubbles`.
- **Pause sheet:** Start again (the same board from fresh, keeping hints) and Show a hint (`Scene.pauseActions`).

`rainLayout(view, level)` returns every rectangle: cloud, patch(es), pockets, arrow, pond tray(s), ground tiles, leaf and bookmark. A test runs it at the four views the lands test uses and asserts: every target (cloud, tiles, leaf) at least 100 logical units each way; no overlap between targets; the Home button (top-left) and the guide's bottom-left corner clear; everything inside `view`; a pocket and a pond slot at least 48 units (they are not targets but must read on an iPad). If a view cannot fit level 2's two boards at those sizes, the layout returns null and the test fails rather than shrink.

### Layout sketches

**Landscape (1024×768 design area):**

```
+------------------------------------------------------------+
| [Home]                                            [leaf]   |
|            .--------------.                                 |
|           (    cloud       )   (bookmark, L3: 200x150)      |
|            '--------------'                                 |
|      ~~~~~grass~~~~~~~~~                                    |
|      | soil  (o)  (o)  |\                                   |
|      |_________________| \  arrow                           |
|                           \____>  [ pond . . . . ]  frog    |
|  pet                [stone]  [soil]   (L3 tiles)            |
+------------------------------------------------------------+
```

Level 2 in landscape puts the two boards side by side (each about 400 wide), each with its own arrow and pond below-right and its own ground tile under it; one wide cloud spans both.

**Portrait (768×1024 design area, upright iPad):**

```
+----------------------------------+
| [Home]                   [leaf]  |
|      .------------------.        |
|     (      cloud         )       |
|      '------------------'        |
|   ~~~~~~grass~~~~~~~~            |
|   | soil (o)  (o)    |\          |
|   |__________________| \ arrow   |
|                         \__>     |
|        [ pond . . . . ]  frog    |
|   (bookmark, L3)                 |
|        [stone]   [soil]          |
|  pet                             |
+----------------------------------+
```

Level 2 in portrait keeps the boards side by side (each about 330 wide, pockets and slots shrinking to their 48-unit floor, tiles staying 120); the cloud spans both. If that fails the layout test, stack the two boards vertically with the cloud split into two clouds that both rain on one tap (still one shower, equal input); the test decides, never a smaller target.

## Accounting, help and finishing

- **No misses at levels 1–3.** Every tap of the cloud, every ground change and every replay is a valid experiment; `misses: 0` always. There is no wrong-answer boing in these levels.
- **Hint:** Show a hint (pause sheet) or two idle cues in a row make the pet demonstrate the next useful action: tap the cloud (no trial yet), flip a tile (level 2 after a pair, level 3 after the bookmark) or point at the leaf (`canFinish`). A requested hint counts **1 hint**. The idle cue is a spoken reminder of the instruction only and counts nothing.
- **Leaf nudge (not a hint):** at level 1, after the third trial, the leaf glows and the pet says "Tap the leaf when you're all done." This is a comfortable-stopping cue, not help with the task, and counts nothing. At levels 2–3 the same nudge follows the second completed pair or comparison.
- **Assisted ending:** a grown-up or the pet's hint can always take her to the leaf; finishing with hints earns the ordinary one sticker.
- **Finishing:** `ctx.finish({ misses: 0, hints })`, once (`finished` guards a second tap).
- **Adaptation:** a hint-free round is "smooth" to the shell, so two of them step her up. That signals supported participation in an all-valid toy, not mastery of fair testing; the how-to card says so plainly. No change to the shell's rule.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the pet repeats them); results use `ctx.say`. The explanation lines are the model's whole scientific claim and are the lines a science reader should see ([decision 2](#open-decisions)):

- `rain.instruct.1`: "Tap the cloud to make it rain on the garden."
- `rain.instruct.2`: "Pick the ground for each garden, then tap the cloud. Both get the same rain."
- `rain.instruct.3`: "Tap the cloud. Then change the ground and rain again."
- `rain.soil`: "The garden soil held two drops. The other two ran down to the pond."
- `rain.stone`: "Stone can't hold any rain. All four drops ran down to the pond."
- `rain.pair`: "Same rain on both. The soil kept some; the stone kept none."
- `rain.pair.same`: "Same ground, same rain, same result."
- `rain.compare`: "Before, with stone, the pond got four. Now, with soil, it got two. The ground made the difference." (and its reverse for soil → stone)
- `rain.compare.same`: "The same ground, the same rain. It came out the same."
- `rain.again`: "Fresh, dry garden. Ready for more rain."
- `rain.done`: "Tap the leaf when you're all done."
- `rain.friend.*`: the pond friend's cheer when water reaches it ("Splash!" with the friend's animal voice from `sfx.animal`).

None of these says the soil "drinks", "soaks it all up", that plants need this water to grow, or how real ground behaves after a lot of rain. The grown-ups' how-to note carries the model's limit.

## Rule tests (`logic.test.ts`)

1. **Conservation:** for every surface and every fresh start, after every step, `released + initial stored = stored + pond`; the step list has exactly 4 entries and each unit appears once.
2. **Outcome table:** stone gives 0/4 and soil gives 2/2 from fresh; `stored` never exceeds capacity.
3. **Order:** with soil, the first two steps go to the patch and the last two to the pond; with stone, all four go to the pond.
4. **Fresh start:** a replay's starting state equals the round's starting state (patch empty, pond empty) whatever the previous trial left.
5. **Level 2 fairness:** both patches receive exactly 4 units in the same trial; flipping one tile changes only that patch's surface and resets both to fresh; the same surface on both sides gives identical results.
6. **Level 3 bookmark:** the first trial is kept; later trials, replays and tile changes never alter it; `canFinish` stays false until a settled trial on a surface different from the bookmark's, then true.
7. **Finish once:** `canFinish` is false before the first settled trial at every level; a second Finish is ignored.
8. **Seeded rounds:** every seeded round's starting surfaces come from the two-surface set and the round is finishable (a different surface exists at level 3).
9. **Layout:** `rainLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` at level 1 taps the cloud, waits for the shower to settle and taps the leaf; at level 2 taps the cloud, flips the left tile, taps the cloud again and taps the leaf; at level 3 taps the cloud, taps the other ground tile, taps the cloud and taps the leaf. Every demonstration ends on the leaf, so `fingerdemo` proves Finish at the first and top level.
- **How-to card** (`src/content/howto.ts`). Goal: "Rain on a little garden and see where the water goes when the ground changes."
  - Steps: "Tap the cloud: four drops fall, some stay in the ground and the rest run to the pond" (all levels); "Tap the cloud again to rain on a fresh, dry garden" `{ from: 1, to: 1 }`; "Tap a ground tile to make that garden stone or soil; both gardens get the same rain" `{ from: 2, to: 2 }`; "The first rain is kept on a card; change the ground and rain again to compare" `{ from: 3, to: 3 }`.
  - Finish: "Tap the leaf when she's done; it appears after one rain" `{ from: 1, to: 1 }`, "…after one rain on both gardens" `{ from: 2, to: 2 }`, "…after rain on two different grounds" `{ from: 3, to: 3 }`.
  - Notes: "Every choice is fine here: there are no wrong answers and no misses" (all levels); "A pretend model: soil holds two drops and stone holds none. Real ground soaks rain in more slowly, and how much depends on how wet it already is" (all levels); "Show a hint has the pet show the next step and counts as help; finishing with help still earns the sticker" (all levels); "Rounds without hints move her up, which means she joined in, not that she has learned fair tests" (all levels).
- **Registration (default, waiting on [decision 1](#open-decisions)):** ID `rain-garden`, name "Rain Garden", spoken title `game.rain-garden` ("Rain garden"). Region (subject) `tinker-lab`, the science subject. Skills `['observation', 'comparing', 'fair-test', 'water']` (free strings). Bands (`BandLevels`): toddler 1–1, preschool 1–2, prek 2–3, school 3–3; no lap (Garden Grow), no grown-up (levels 7–8 later). Home land **Tinker Lab** (12 games today, 13 with this; Puzzle Peaks already lays out 13; `lands.test.ts` decides). Fallback: **Rainbow Meadow** beside Garden Grow (11 today; [Food Web Workshop](food-web-workshop.md) also defaults there). Hub icon: a cloud over a soil cutaway with two drops tucked in and an arrow to a pond. Sticker (page `meadow`): a seeded pond friend under a cloud, with one or two drops.
- **Art:** code-drawn in `src/games/rain-garden/art.ts` with `src/art/palette.ts`: cloud, soil cutaway and pockets, stone slab, arrow, pond tray, drops, ripple rings, bookmark card, rewind badge, leaf button. Pond friends from `src/art/animals.ts` (frog, turtle) and `CRITTERS` (duck). No imported art or audio.
- **Co-play:** one person chooses the ground, the other taps the cloud and says what happened; then swap. **Off-screen** (spoken tip): "Next time it rains, look out the window together: where does the water go on the path, and where on the grass?" A window conversation only: no water-play, drainage or storm-watching instructions.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The pond friend could later be one of her creatures; the [rework brief](../rework/README.md) decides that.

## Check tier

The build is one same-game batch: level 1 (the study's slice 2) and levels 2–3 (slice 3) in one worker and PR, since they share the model, board and art. New-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 and level 3, covering a requested hint and Finish. **Levels 1–3 have no wrong-answer step**, so the play exercises no wrong answer and must not fabricate one; it does check that a tile change and a replay leave `misses` at 0. One portrait screenshot at level 2 (the two boards side by side, mid-shower). `fingerdemo` at levels 1 and 3. `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a two-year-old taps the cloud again or reaches for the leaf; whether a four-year-old reads the bookmark as "before"; how iPad speech says "can't"; whether the sliding fresh patch reads as a restart and not as weather. Browser automation establishes none of these.

## What comes next

**Level 4** (the study's slice 4) is [defined below](#level-4-two-socket-downhill-route-definition) and ready to build in one session. **Level 5** (up to six sockets, two marked beds, seeded boards with solver witnesses) needs its own docs-only definition after level 4 is built. **Drop's Journey**'s first route is now eligible for its own docs-only definition (the study's slice 8), independent of this build.

## Open decisions

Each has a default the build uses; decision 1 is the developer's confirmation the registration waits on.

1. **Register Rain Garden as a new game, with these bands and land.** Default: yes, as above (toddler 1, preschool 1–2, pre-K 2–3, school 3), home Tinker Lab. Alternative: fold the comparison into a future Water Paths if the developer prefers fewer water games; the overlap section says why it is distinct.
2. **Science reader.** Default: the build proceeds with the explanation lines above as a toy model, labelled as such on the grown-ups' card; a reader (not yet named) checks those lines before release and must approve anything about real soaking, wet ground or the water cycle.
3. **Level 1's ending.** Default: a deliberate leaf tap, with the comfort nudge after three rains. Alternative: the round finishes by itself after the third rain, if watching shows toddlers rarely tap the leaf.
4. **Surfaces.** Default: stone and soil only. Alternative: a third surface (grass, capacity 1) at level 3 for more seeded variety, after the science reader's note on ordering grass between stone and garden bed.
5. **Home land.** Default Tinker Lab (full at 14 games since 2026-10-24: Gear Garden went to Painted Canyon for that reason), fallback Rainbow Meadow; `lands.test.ts` decides between them at every band and view.

**Decided 2026-10-23 (on the developer's delegation):** every default stands: register Rain Garden as a new game (toddler 1, preschool 1–2, pre-K 2–3, school 3; Tinker Lab, fallback Rainbow Meadow), and decision 2's science reader is the building session's source check against EPA/NOAA, recorded in its verification entry.

## Level 4, *two-socket downhill route* (definition)

Defined 2026-11-06 as the weather-and-water study's [slice 4](../deep-dives/subjects/weather-water.md#build-slices-in-order), from the [ladder's level-4 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and its concrete check. Docs only: nothing below exists in code yet. One build session, new-interaction tier ([Level 4 check tier](#level-4-check-tier)).

**Fun action and purpose:** two garden beds sit one above the other on a terraced slope, with a fixed arrow from the top bed to the low bed and another from the low bed to the pond. A sign by the low bed shows what it needs, two drops, and the pond friend's sign shows it needs at least one. She taps each bed to make it stone or soil, taps the cloud to try it as often as she likes, then taps the Check. The learning purpose is **reasoning backwards from where water should end up to what the ground uphill must do** (4-ESS3-2, comparing designs, as the horizon): a garden low on a slope gets the water the ground above it could not hold. This is the idea behind real rain gardens, which [EPA](https://www.epa.gov/green-infrastructure/types-green-infrastructure) describes as collecting rainwater from rooftops, sidewalks and streets. The level asks her to revise: when the Check fails, the narration says *where the water stayed*, never "try the other one".

**Overlap, rechecked:** the arrows stay fixed and she never draws or turns a pipe, so success is still a distribution of water from a surface choice, not a connection (Water Paths and Puddle Pipes keep routing). Sand Table keeps moving material; Gadget Bench keeps multi-condition parts paths with mechanical parts, not water. Nothing here runs a second shower or carries wet ground (level 6).

### The model, level 4

- **Sockets:** the board has two sockets in a fixed chain, `top` (index 0) and `low` (index 1). Each holds a whole surface, `stone` or `soil`, with the capacities of levels 1–3 (0 and 2). No socket is ever empty and no third surface exists. She sets each socket independently by tapping it, as at level 2, so **four arrangements** exist: the board does not hand her one soil tile to place. This is a deliberate widening of the study's "one garden tile" so the pond's need can fail too.
- **The route:** `ROUTE4 = [{ down: 1 }, { down: 'pond' }]`. The shower falls on the top socket only (the cloud hangs over it).
- **`runRoute(sockets, route, units = 4)`** moves one unit at a time: it enters socket 0; at each socket it stays while `stored < capacity`, otherwise follows that socket's `down`; past the last it lands in the pond. Steps are `{ unit, path: (0 | 1 | 'pond')[] }`, the places the unit visited in order, so the scene animates a drop rolling past a full or stone bed. A unit is never split, lost or created. Write it for a route array (each socket naming its `down`) so level 5's six-socket boards reuse it; level 4 only needs the two-socket chain.
- **Conservation**, checked after every step: `units released = top.stored + low.stored + pond` (every trial starts fresh).
- **Needs:** a round names a **marked bed** (`bed: 0 | 1`), which must store **exactly 2**, and the pond, which must get **at least 1**. `meets(trial, round)` returns `{ bed: boolean, pond: boolean }`; the Check passes only when both are true. The Check judges these two pictured bounds, never a stored answer key, so any arrangement that meets them passes.
- **All outcomes**, from fresh, low bed marked (the authored board and half the seeded ones):

  | Top | Low | Top kept | Low kept | Pond | Low needs 2 | Pond needs 1+ | Why it fails |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | stone | soil | 0 | 2 | 2 | yes | yes | (passes) |
  | soil | stone | 2 | 0 | 2 | no | yes | The top soil kept two; the other two ran past the stone to the pond |
  | soil | soil | 2 | 2 | 0 | yes | no | The top kept two and the low bed kept two; nothing was left for the pond |
  | stone | stone | 0 | 0 | 4 | no | yes | Stone can't hold any; all four ran past both beds to the pond |

  With the **top bed marked** (the other seeded variant), only soil-over-stone passes (2, 0, 2); soil-over-soil fails the pond (2, 2, 0), and both stone-topped arrangements leave the top bed dry. Each variant has exactly one passing arrangement out of four, and each failing one fails for a reason she can see.
- **Solver:** `solutions(round)` enumerates the four arrangements and returns every one that meets both needs; `nearest(state, round)` returns the solution differing from the current arrangement in the fewest sockets (each level-4 variant has exactly one; level 5 needs this rule with several).
- **Round state** adds `sockets: Surface[]`, `current: Trial | null` (the settled run of the current arrangement), `checked: string | null` (the arrangement last judged, as `'stone/soil'`), `misses`, `glowShown`, and `passed`.
- **Authored first round:** low bed marked, top **soil**, low **stone** (the study's concrete failing case), frog. **Seeded rounds:** which bed is marked (low or top, even chance); the starting arrangement is one of that variant's three failing ones; the pond friend; mirror (cloud and top bed on the right, arrows running left), as at level 1. Every seeded round starts failing, so she always changes something, and always has a solution.

### Screen and controls, level 4

- **The board:** two terraces in the 1024×768 frame. The **top bed** (about 300×150) sits high on the uphill side under the cloud; the **low bed** (about 300×150) sits one terrace down and across; the pond tray (four slots) sits at the bottom of the downhill side. Both arrows are drawn as in levels 1–3. Beds draw as at levels 1–3: soil with two dashed pockets, stone as a grey slab with none, so capacity is visible before it rains.
- **Need signs** (pictures, not targets, each at least 130×100): a stake beside the marked bed holding **two dashed drop outlines over a small leaf marker**, and a sign on the pond friend's lily pad holding **one dashed drop outline with a plus**. As drops settle the outlines fill; a met need gets a tick, an unmet one stays dashed. The leaf marker shows which bed is marked; it never grows a plant. Navigation never requires reading.
- **Targets:** the cloud (at least 220×140), each bed (tap flips stone ↔ soil with the `clunk`/`squish` of levels 2–3; the bed itself is the target, at least 240×130), and the **Check** button (a big tick on a wooden sign, 120×120, top-right where the leaf sits at levels 1–3). There is no leaf at level 4: a passing Check ends the round. Touch-down squashes every target at once; taps during a shower are ignored; nothing is timed.
- **Trying versus checking:** tapping the cloud runs the shower on the current arrangement and narrates where each drop went; it is free and unscored, as often as she likes. Tapping the Check runs the shower first if the arrangement has not settled yet, then judges the two needs. Flipping a bed resets both beds and the pond to fresh with the level-1 wipe (never drops rising to the cloud). Flipping back is the undo.
- **Layout:** `rainLayout(view, 4, mirror)` returns cloud, two boards' beds and pockets, both arrows, pond and slots, the two need signs, the Check and no tiles or bookmark. The existing layout test extends to level 4 at the four views: every target at least 100 each way, no target overlap, need signs overlapping no target, Home and the guide's corner clear, everything inside `view`, pockets and slots at least 48. As at levels 1–3 the frame is 1024×768 in both orientations (portrait's logical view is 1024 wide), so the same sketch serves both; if a view cannot hold it, the layout returns null and the test fails rather than shrink.

```
+------------------------------------------------------------+
| [Home]                                           [Check]   |
|     .-------------.                                         |
|    (    cloud      )                                        |
|     '-------------'                                         |
|    | top bed (o)(o) |\                                       |
|    |________________| \   [o o] need sign + leaf marker     |
|                     |  low bed (o)(o) |\                     |
|                     |_________________| \                   |
|                                          \__> [pond . . . .]|
|  pet                                     [o+] sign   frog   |
+------------------------------------------------------------+
```

Mirrored rounds flip the sketch left to right. With the top bed marked, the need sign stands by the top bed instead.

### Accounting, help and finishing, level 4

- **Free:** cloud runs, bed flips, Start again and listening are never misses.
- **A failed Check** counts **1 miss**: a gentle boing, the unmet need sign wobbles, and the pet says the cause line for that arrangement (below). The settled trial stays on the board so she can see where the water stayed until she flips a bed. **Checking the same arrangement again** (nothing changed since its last judgement) repeats the cause line and counts nothing.
- **Causal glow:** after the second failed Check, the bed whose ground has to change glows (a socket where the arrangement differs from `nearest`; when both differ, the top bed, where the water first stopped or ran past). It counts **1 hint** the first time it lights in a round, and it moves to the right bed after later failed Checks without counting again. The glow never blocks a tap (it is drawn under the bed's hit area).
- **Requested hint** (Show me on the pause sheet): the pet flips one bed toward `nearest`, a worked step, **1 hint**; with the arrangement already passing, the pet points at the Check instead (counted only if newly pointed, as at levels 1–3). At most two worked steps reach a solution from any start, so assisted completion is always available.
- **Finish:** a passing Check plays the drops filling both signs, the friend's hop and the pass line, then `ctx.finish({ misses, hints })` once. Finishing after hints earns the ordinary one sticker.
- **Adaptation:** a round with at most one failed Check and no hints is smooth, as for any game. School's range becomes 3–4.

### Speech, level 4 (`voice-script.ts`)

- `rain.instruct.4`: "The leaf bed needs two drops, and the pond needs some too. Tap a bed to change its ground. Tap the cloud to try it, then tap the check."
- Cloud-run narration, one fixed line per arrangement (no number slots): `rain.route.stone-soil` "The stone kept none, so all four ran down. The low soil kept two, and two reached the pond."; `rain.route.soil-stone` "The top soil kept two. The other two ran past the stone to the pond."; `rain.route.soil-soil` "The top soil kept two and the low soil kept two. None reached the pond."; `rain.route.stone-stone` "Stone can't hold any. All four ran past both beds to the pond."
- Failed Check, one cause line per need: `rain.miss.dry` "Boing. The leaf bed stayed dry. Look where the water stayed." followed by that arrangement's route line; `rain.miss.pond` "Boing. The pond got none. The beds kept every drop." followed by its route line.
- `rain.glow`: "Look at the glowing bed. Try the other ground there."
- `rain.check.yes`: "The leaf bed kept two, and the pond got some. Both needs met!"

No line says soil "drinks" or "soaks it all up", that the leaf bed's plant needs this water to grow, or how real slopes behave in a storm; "ran past" and "kept" are the toy's words.

### Rule tests, level 4 (`logic.test.ts`)

1. **Conservation along the route:** for all four arrangements, after every step `released = top + low + pond`; four steps, each unit's path starts at socket 0 and ends where it is counted.
2. **Outcome table:** the table above exactly, for both marked-bed variants.
3. **Order:** a unit passes a socket only when that socket is full or stone; with stone on top every path starts `[0, 1, …]`.
4. **Judge accepts every valid arrangement:** for each variant, the Check passes exactly the arrangements `solutions` enumerates, and `solutions` is non-empty.
5. **Seeded rounds:** every seeded start is a failing arrangement of its own variant and has a solution; the authored round is soil over stone with the low bed marked.
6. **Hints preserve a solution:** from every arrangement, applying `nearest`'s worked step strictly reduces the distance to a solution, and at most two steps reach one.
7. **Accounting:** a failed Check adds one miss; the same arrangement checked again adds none; cloud runs and flips add none; the glow counts one hint once a round; a passing Check sets `passed` and a second Check is ignored.
8. **Fresh starts:** a flip resets beds and pond to empty; Start again restores the round's starting arrangement.
9. **Layout:** level 4 at the four views, as above.

### Code the builder must widen

The level-1–3 code assumes three levels: `Plan.level` is typed `1 | 2 | 3`, `planFor` clamps to 3, and `canFinish`, `enough` and `nextAction` treat anything that is not level 3 as level 1 or 2; in `index.ts` the tile and narration branches do the same. Level 4 needs its own branches (or a level-4 round type) rather than falling through. `LEVELS` gains school `{ min: 3, max: 4 }` and `PLANS` a fourth entry: "Two beds downhill: change the ground so the leaf bed gets two drops and the pond some".

### Ghost finger, how-to card and registration, level 4

- **Ghost finger** at level 4 (authored round): tap the cloud (watch two run past the stone), tap the top bed (to stone), tap the low bed (to soil), tap the cloud, tap the Check. `fingerdemo` at level 4 must end on the passing Check.
- **How-to card:** steps `{ from: 4, to: 4 }`: "Tap a bed to make it stone or soil; the rain falls on the top bed and what it can't hold runs down"; "Tap the cloud to try as often as she likes; trying is never wrong"; "Tap the check when the leaf bed should get two drops and the pond at least one". Finish `{ from: 4, to: 4 }`: "The round ends when the check finds both needs met." The current single-string note must become level-scoped: the "no wrong answers and no misses" and "rounds without hints move her up" sentences `{ to: 3 }`; for level 4, "Trying and changing the ground are free; a check that misses counts one miss and says where the water stayed; after two, the bed to change glows and counts as help." The pretend-model sentence stays at every level, adding "hard ground uphill sends its rain to the garden below, which is why real rain gardens sit low".
- **Bands:** toddler 1, preschool 1–2, pre-K 2–3, school 3–4. No grown-up band (levels 7–8 later). Tinker Lab, unchanged; no new game, so no lands change.
- **Co-play:** one person says which bed needs to change and why, the other taps it; then swap. **Off-screen:** the existing window tip stands.

### Level 4 check tier

New-interaction tier, one build session: typecheck and the rule tests above (plus the how-to test); one scripted play through the `rain-garden` browser case filtered to level 4, covering one cloud run, one wrong Check (the authored soil-over-stone), one requested hint and the passing Check, asserting `misses` 1 and `hints` at least 1; one portrait screenshot at level 4 after a wrong Check (the dashed sign and the settled drops); `fingerdemo` at level 4. `npm run build`, because the voice script and how-to card change. Levels 1–3's passing evidence is reused for their unchanged branches.

Device and person checks: whether a six-year-old reads the dashed drops as "needs two" without the voice; whether "ran past" is clear in iPad speech; whether school children flip at random or reason from the cause line. Browser automation establishes none of these.

### Level 4 decisions

None is waiting on the developer. Defaults this definition sets: free flips on both beds (four arrangements) rather than one movable soil tile, so the pond's need can fail; a seeded marked-bed variant; no leaf at level 4 (the passing Check finishes). Source check (2026-11-06): [EPA's green-infrastructure types](https://www.epa.gov/green-infrastructure/types-green-infrastructure) (bioretention "collects rainwater from rooftops, sidewalks, and streets"; it can temporarily pond, then soak in or flow through an underdrain) and the [USGS runoff page](https://www.usgs.gov/water-science-school/science/runoff-surface-and-overland-water-runoff) (rain that does not soak in moves downhill by gravity; hard surfaces reduce infiltration; earlier rain's soil moisture changes runoff, which stays out until level 6). They support the toy's direction (hard ground uphill feeds a garden below), not its capacities.
