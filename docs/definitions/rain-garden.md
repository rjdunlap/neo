# Rain Garden, levels 1–3 (definition)

**Built:** levels 1–7 (levels 1–3 PR #1303, level 4 PR #1316, level 5 PR #2069, level 6 PR #2077, level 7 PR #2090); level 8 (evidence and hypothesis) is not defined yet, see the [build slices](../deep-dives/subjects/weather-water.md#build-slices-in-order). Level 7 departs from [its section](#level-7-one-garden-for-two-rains-definition) as the [game page](../games/rain-garden.md) records: no separate leaf button, a card pick clears settled drops, the hold-sign tick waits for a settled rain.

**Admitted to the build queue 2026-11-05** ([READY](../READY.md#queued)): the developer asked for the recommendations to be made without waiting, so the build uses this packet's defaults (settled in the [October 23 record](../archive/DECISIONS-2026-10-23.md#decisions)). Its source check and the lands test still run at build time.

Defined 2026-10-22 as slice 1 of the [weather-and-water study](../deep-dives/subjects/weather-water.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#weather-and-water-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-11-06 (levels 1–3, one batch, [PR #1303](https://github.com/rjdunlap/neo/pull/1303); [build note](../archive/COMPLETED-2026-10-09.md#rain-garden-levels-1-3-weather-water-slices-2-3-2026-11-06)).** Deviations are recorded in [GAMES.md](../GAMES.md#rain-garden). Science source check (decision 2's reader): EPA CADDIS ["Urbanization – stormwater runoff"](https://www.epa.gov/caddis/urbanization-stormwater-runoff) (hard surfaces reduce infiltration and increase surface runoff) and the USGS Water Science School runoff and infiltration pages (soil is like a sponge: some water soaks in and some runs off; saturated or paved ground sends water downhill). They support the toy model, and the grown-ups' card says real soaking is slower and depends on how wet the ground is. Level 4 is [defined](#level-4-two-socket-downhill-route-definition) (2026-11-06) and ready to build.

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

**Level 4** (the study's slice 4) is [defined below](#level-4-two-socket-downhill-route-definition) and built. **Level 5** is [defined below](#level-5-three-beds-downhill-definition) (2026-11-23: three beds, six authored boards) and built. **Level 6** is [defined below](#level-6-rain-again-on-wet-ground-definition) (2026-11-23: rain again on wet ground) and ready to build. **Drop's Journey**'s first route is now eligible for its own docs-only definition (the study's slice 8), independent of this build.

## Open decisions

Each has a default the build uses; decision 1 is the developer's confirmation the registration waits on.

1. **Register Rain Garden as a new game, with these bands and land.** Default: yes, as above (toddler 1, preschool 1–2, pre-K 2–3, school 3), home Tinker Lab. Alternative: fold the comparison into a future Water Paths if the developer prefers fewer water games; the overlap section says why it is distinct.
2. **Science reader.** Default: the build proceeds with the explanation lines above as a toy model, labelled as such on the grown-ups' card; a reader (not yet named) checks those lines before release and must approve anything about real soaking, wet ground or the water cycle.
3. **Level 1's ending.** Default: a deliberate leaf tap, with the comfort nudge after three rains. Alternative: the round finishes by itself after the third rain, if watching shows toddlers rarely tap the leaf.
4. **Surfaces.** Default: stone and soil only. Alternative: a third surface (grass, capacity 1) at level 3 for more seeded variety, after the science reader's note on ordering grass between stone and garden bed.
5. **Home land.** Default Tinker Lab (full at 14 games since 2026-10-24: Gear Garden went to Painted Canyon for that reason), fallback Rainbow Meadow; `lands.test.ts` decides between them at every band and view.

**Decided 2026-10-23 (on the developer's delegation):** every default stands: register Rain Garden as a new game (toddler 1, preschool 1–2, pre-K 2–3, school 3; Tinker Lab, fallback Rainbow Meadow), and decision 2's science reader is the building session's source check against EPA/NOAA, recorded in its verification entry.

## Level 4, *two-socket downhill route* (definition)

Defined 2026-11-06 as the weather-and-water study's [slice 4](../deep-dives/subjects/weather-water.md#build-slices-in-order), from the [ladder's level-4 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and its concrete check. **Built 2026-11-06** ([PR #1316](https://github.com/rjdunlap/neo/pull/1316); deviations in the [build note](../archive/COMPLETED-2026-10-09.md#rain-garden-level-4-two-socket-downhill-route-weather-water-slice-4-2026-11-06)). One build session, new-interaction tier ([Level 4 check tier](#level-4-check-tier)).

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

## Level 5, *three beds downhill* (definition)

**Built 2026-11-23 ([PR #2069](https://github.com/rjdunlap/neo/pull/2069)).** Deviations: level 4 was folded into the same board model (`RouteBoard`, `board4`) with behaviour unchanged; level 4's "check" how-to step now reads "each marked bed" and covers levels 4–5, while level 5 has its own shorter how-to note (the card-length test caps cards at 840 characters and widening level 4's note overflowed); at level 5 the shower runs at 0.7 pace and each drop leaves the cloud 0.45 s after the last, so six drops through three beds do not drag; after review, a narration chain stops when she flips a bed, taps a fixed socket, asks Show me or starts again, so it never talks over the newer line; the browser fixture runs the `raingarden` suite on a touch phone when `FROM_LEVEL` is 5 or more, so level 5 lays out upright. 21 new voice lines are rendered to clips; the school band is now levels 3–5.

**Built 2026-11-23 (PR #2090); deviations on the [game page](../games/rain-garden.md).** Defined 2026-11-23 as the weather-and-water study's [slice 5](../deep-dives/subjects/weather-water.md#build-slices-in-order), from the [ladder's level-5 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden). One build session, new-level tier: the interaction is level 4's (tap a bed to flip its ground, try with the cloud, judge with the Check) on a longer slope ([Level 5 check tier](#level-5-check-tier)).

**Fun action and purpose:** three beds step down a slope to the pond, and each board marks one or two of them with a sign showing two dashed drops. She flips beds between stone and soil, tries the rain as often as she likes and checks. The learning purpose is level 4's, **reasoning from where water should end up to what the ground uphill must do**, stretched to a budget: every soil bed keeps two of the cloud's drops, so she has to leave enough for the beds below and some for the pond. Boards change what is fixed and how much rain falls, so no single pattern ("make the marked ones soil") answers every board.

**Overlap, rechecked:** as at level 4, the arrows stay fixed and she never draws a route, so Water Paths and Puddle Pipes keep routing. Nothing carries water between showers (level 6) or asks one layout to meet two rain cards (level 7).

### The model, level 5

- **A chain of three sockets:** `top` (0), `middle` (1), `low` (2), then the pond: `ROUTE5 = [{ down: 1 }, { down: 2 }, { down: 'pond' }]`, run by level 4's `runRoute`. With one cloud over socket 0 and one `down` per socket, every reachable board is a single chain, so "route variants" here are boards that differ in **which sockets are fixed, which beds are marked and how much rain falls**, not in branching. A test proves every socket is reachable from socket 0 and no route skips one.
- **Surfaces:** stone (0) and soil (2) only, as at levels 1–4. A socket is either **tappable** (flips stone ↔ soil) or **fixed**: the **tree's bed** (always soil, drawn with a small tree; it keeps two) or the **stone path** (always stone, drawn as stepping stones). Fixed sockets are as large as beds; tapping one says a line and changes nothing, never a miss or hint. No third surface (decision 4 stays deferred).
- **The shower** is the board's `units`, **6** or **4**, drawn on the cloud as that many dashed drops before it rains, so it is never a hidden variable. Every stored amount and pond count is even (0, 2, 4 or 6), so narration needs no odd numbers.
- **Needs:** one or two **marked** tappable beds, each storing **exactly 2**; with two, the **uphill** one carries a **leaf** marker and the lower one a **flower** (A: middle leaf, low flower; B: top leaf, low flower); a lone marked bed carries the leaf. The pond needs **at least 1**. `meets(trial, board)` returns `{ beds: boolean[]; pond: boolean }` and the Check passes when all are true. The Check judges the pictured bounds, never a stored answer key.
- **Cause:** a failed Check names one cause: `dry` (the uphill-most marked bed that did not keep two; its marker picks the line) before `pond`.

### The six boards

Seeded rounds pick a board uniformly from all six (A included), then a starting arrangement uniformly among its failing ones, and the pond friend. Each table lists every arrangement (fixed sockets in brackets), what each socket kept, the pond, and why it fails. Every board has a solution, every failing arrangement fails for a reason on the screen, and the tables are the rule tests' expected values.

**A, *Leaf and flower below*** (authored first board; 6 drops; middle and low marked; starts soil / soil / stone). One answer: the top bed is stone.

| Top / middle / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 6 | middle and low dry |
| stone / stone / soil | 0, 0, 2 | 4 | middle dry |
| stone / soil / stone | 0, 2, 0 | 4 | low dry |
| **stone / soil / soil** | 0, 2, 2 | 2 | **passes** |
| soil / stone / stone | 2, 0, 0 | 4 | middle and low dry |
| soil / stone / soil | 2, 0, 2 | 2 | middle dry |
| soil / soil / stone | 2, 2, 0 | 2 | low dry (the authored start) |
| soil / soil / soil | 2, 2, 2 | 0 | pond got none |

**B, *Top and bottom*** (6 drops; top and low marked). One answer: the middle is stone.

| Top / middle / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 6 | top and low dry |
| stone / stone / soil | 0, 0, 2 | 4 | top dry |
| stone / soil / stone | 0, 2, 0 | 4 | top and low dry |
| stone / soil / soil | 0, 2, 2 | 2 | top dry |
| soil / stone / stone | 2, 0, 0 | 4 | low dry |
| **soil / stone / soil** | 2, 0, 2 | 2 | **passes** |
| soil / soil / stone | 2, 2, 0 | 2 | low dry |
| soil / soil / soil | 2, 2, 2 | 0 | pond got none |

**C, *The tree's bed*** (6 drops; the middle is the tree's bed; low marked). One answer: the tree always keeps two, so the top must be stone.

| Top / [tree] / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / [soil] / stone | 0, 2, 0 | 4 | low dry |
| **stone / [soil] / soil** | 0, 2, 2 | 2 | **passes** |
| soil / [soil] / stone | 2, 2, 0 | 2 | low dry |
| soil / [soil] / soil | 2, 2, 2 | 0 | pond got none |

**D, *The stone path*** (6 drops; the middle is the stone path; low marked). Two answers: the top may be either.

| Top / [path] / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / [stone] / stone | 0, 0, 0 | 6 | low dry |
| **stone / [stone] / soil** | 0, 0, 2 | 4 | **passes** |
| soil / [stone] / stone | 2, 0, 0 | 4 | low dry |
| **soil / [stone] / soil** | 2, 0, 2 | 2 | **passes** |

**E, *One bed in the middle*** (6 drops; middle marked). Three answers: the middle is soil and at most one other bed is.

| Top / middle / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 6 | middle dry |
| stone / stone / soil | 0, 0, 2 | 4 | middle dry |
| **stone / soil / stone** | 0, 2, 0 | 4 | **passes** |
| **stone / soil / soil** | 0, 2, 2 | 2 | **passes** |
| soil / stone / stone | 2, 0, 0 | 4 | middle dry |
| soil / stone / soil | 2, 0, 2 | 2 | middle dry |
| **soil / soil / stone** | 2, 2, 0 | 2 | **passes** |
| soil / soil / soil | 2, 2, 2 | 0 | pond got none |

**F, *The small cloud*** (**4** drops; low marked). One answer: stone / stone / soil (pond 2). This is the board where water **runs out**: soil / soil / soil keeps 2, 2, 0 and the low bed gets nothing, and soil / stone / soil or stone / soil / soil fill the low bed but leave the pond none.

| Top / middle / low | Kept | Pond | Result |
| --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | low dry |
| **stone / stone / soil** | 0, 0, 2 | 2 | **passes** |
| stone / soil / stone | 0, 2, 0 | 2 | low dry |
| stone / soil / soil | 0, 2, 2 | 0 | pond got none |
| soil / stone / stone | 2, 0, 0 | 2 | low dry |
| soil / stone / soil | 2, 0, 2 | 0 | pond got none |
| soil / soil / stone | 2, 2, 0 | 0 | low dry |
| soil / soil / soil | 2, 2, 0 | 0 | low dry (no water reached it) |

- **Solver:** `solutions(board)` enumerates the tappable sockets' arrangements (two or three sockets, so four or eight) and returns every one meeting all needs. `nearest(sockets, board)` returns the solution differing in the fewest tappable sockets; **ties go to the first in enumeration order** (top socket first, stone before soil), so the glow never jumps between equal answers. `stepBed` returns the uphill-most tappable socket that differs from `nearest`; fixed sockets never glow and are never flipped by Show me.
- **Round state** is level 4's `RouteState` unchanged; `RouteRound` gains the board (`sockets` with fixed entries, `marked` with markers, `units`) and loses `mirror` at level 5 (below).

### Screen and controls, level 5

- **Sizes:** beds and fixed sockets 300×130 (at least 240×130, as at level 4), the cloud 260×140 over the top bed, the pond tray about 400 wide with **six** slots (56 each, 62 apart), need signs 140×110, the Check 120×120 top-right. Pockets, slots and drop outlines at least 48.
- **Signs:** each marked bed's sign stands beside it with two dashed drops over its marker (leaf or flower), and the same small marker stands on the bed itself, so a sign and its bed match without reading; the pond sign is level 4's. Outlines fill as drops settle; a met need gets a tick.
- **Upright on a phone** (the 768×1024 frame hung from the bottom edge; frame coordinates, centers): cloud (260, 200); top bed (260, 350); middle bed (548, 505); low bed (260, 660); pond (548, 862). The slope zig-zags so the arrows are short diagonals. Signs: top bed's (568, 350), middle bed's (220, 505), low bed's (568, 660), pond's (262, 862).
- **Landscape** (1024×768 frame, centered): a staircase descending right, cloud (270, 115); top (270, 260); middle (530, 405); low (790, 550); pond (770, 700). Signs: top's (570, 250), middle's (840, 390), low's (500, 560), pond's (470, 700). Portrait's logical view is 1024 wide and uses this frame, as at levels 1–4.
- **These coordinates were checked on 2026-11-23** with a scratch script applying level 4's layout-test rules at its eight views (landscape, portrait, phone, notch, and four upright) for every marked-bed set: every target at least 100 and inside the view, no target overlap, signs and pond overlap no target, Home's corner (120×215) and the guide's corner clear. The builder copies them into `routeLayout` and extends the level-4 layout test to level 5 (three beds, six slots, one sign per marked bed beside it, the cloud over the top bed, each bed lower than the one before); a view that cannot hold the board returns null rather than shrink.
- **No mirroring at level 5:** reflecting the staircase would put the pond in the guide's corner; variety comes from the boards.
- **Why three sockets, not the study's "up to six":** the upright frame holds the cloud, three 130-tall beds with their arrows, the pond and the Check at full size and no more. Six sockets would need scrolling or smaller targets; neither is worth it for this level.

```
upright (phone)                         landscape
+------------------------+              +--------------------------------------------+
| [Home]        [Check]  |              | [Home]                            [Check]  |
|                        |              |   ( cloud ::: )                            |
|  ( cloud ::: )         |              |   [ top bed ]  [sign]                      |
|  [ top bed  ] [sign]   |              |          \__ [ middle bed ] [sign]         |
|        \__ [ middle  ] |              |       [sign]     \__ [ low bed ]           |
|  [sign]    [  bed    ] |              |  pet         [o+]     [pond . . . . . .]   |
|  [ low bed ] [sign]    |              +--------------------------------------------+
|        \__             |
| pet [o+] [pond ......] |
+------------------------+
```

### Accounting, help and finishing, level 5

Level 4's rules unchanged: cloud runs, flips, fixed-socket taps, Start again and listening are free; a failed Check counts 1 miss and checking the same arrangement again counts nothing; after the second failed Check the bed to change glows (`stepBed`), counting 1 hint once a round and following the arrangement after flips; Show me flips `stepBed`'s bed (1 hint) or, when the arrangement passes, points at the Check. At most **three** worked steps reach a solution (two on boards with a fixed socket), so assisted completion is always available; finishing with help earns the ordinary one sticker. Smooth and struggling rounds adapt as for any game; school's range becomes 3–5.

### Speech, level 5 (`voice.ts`)

- `rain.instruct.5`: "Each bed with a sign needs two drops, and the pond needs some too. Tap a bed to change its ground. Tap the cloud to try it, then tap the check."
- **Cloud narration is built from short clips said in turn** (as `route.ts` already chains a miss line and a route line), never one line per arrangement: one clip per socket from the top while water reaches it, then one pond clip. Socket clips, for `top`, `middle` and `low`: `rain.bed.<pos>.kept` "The top bed kept two." / `rain.bed.<pos>.stone` "The top bed is stone, so the water ran past." / `rain.bed.<pos>.none` "No water reached the low bed." (said once, for the first socket the water never reached, and then the sockets below are skipped). Fixed sockets: `rain.tree.kept` "The tree's bed kept two."; `rain.path.past` "The stone path kept none, so the water ran on."; `rain.tree.none` and `rain.path.none` "No water reached the tree." / "No water reached the path." Pond clips: `rain.pond.0` "None reached the pond." `rain.pond.2` "Two reached the pond." `rain.pond.4` "Four reached the pond." `rain.pond.6` "All six reached the pond."
- Failed Check: `rain.miss.dry` (level 4's leaf line) or `rain.miss.dry.flower` "Boing. The flower bed didn't keep two. Look where the water stayed.", or level 4's `rain.miss.pond`, each followed by the narration.
- Fixed taps: `rain.fixed.tree` "The tree lives here, so this ground stays soil." `rain.fixed.path` "This is the stone path. It stays stone."
- Pass: `rain.check.yes` on one-marked boards; `rain.check.yes.both` "The leaf bed and the flower bed kept two, and the pond got some. Every need met!" on two-marked boards. `rain.glow`, `rain.hint.flip` and `rain.hint.check` are reused.

No line says soil drinks it all, that a plant needs the water, or how real slopes behave; "kept" and "ran past" stay the toy's words.

### Rule tests, level 5 (`logic.test.ts`)

1. **Boards are well formed:** every socket is reachable from socket 0 and the chain ends in the pond; every marked socket is tappable; the uphill marked bed carries the leaf and a second marked bed the flower; `units` is 4 or 6.
2. **Conservation:** for every board and arrangement, after every step `released = sum(stored) + pond`; each path starts at socket 0 and passes a socket only when it is stone or full.
3. **Outcome tables:** the six tables above exactly (kept, pond, cause).
4. **Judge accepts every valid arrangement:** for each board the Check passes exactly the arrangements `solutions` lists, which is non-empty; D lists two and E three.
5. **Seeded rounds:** every seeded start is a failing arrangement of its board, fixed sockets keep their surface, and the authored round is board A from soil / soil / stone.
6. **Hints preserve a solution:** from every arrangement of every board, flipping `stepBed`'s socket strictly reduces the distance to the nearest solution, never names a fixed socket, and at most three steps (two with a fixed socket) reach a pass; `nearest` breaks ties by enumeration order.
7. **Accounting:** level 4's accounting test at level 5, plus a fixed-socket tap changes nothing and counts nothing.
8. **Narration:** the clip sequence for every arrangement of every board ends with the pond clip matching the trial, never names a socket below the first one water missed, and every clip id exists in `voice.ts`.
9. **Layout:** level 5 at the eight views, as above.

### Code the builder must widen

`RouteRound.level` is the literal `4`; `meets`, `solutions`, `nearest`, `stepBed`, `check` and `routeLayout` take `bed: 0 | 1`; `ARRANGEMENTS` is the fixed two-socket list; `runRoute`'s caller assumes `SHOWER` drops; the layout returns one `bedSign` and four slots; `route.ts` draws two beds and one sign and narrates with `rain.route.<arrangement>`. Level 5 needs a board (sockets with fixed entries, marked beds with markers, units) that level 4's round also expresses (two tappable sockets, one marked, 4 units), so one code path serves both rather than a second scene. `LEVELS` school becomes `{ min: 3, max: 5 }` (no grown-up band yet) and `PLANS` gains "Three beds downhill: leave enough rain for every marked bed and some for the pond". Level 4's fixed route lines stay for level 4.

### Ghost finger, how-to card and registration, level 5

- **Ghost finger** on board A: tap the cloud (the low stone stays dry), tap the top bed (to stone), tap the low bed (to soil), tap the cloud, tap the Check. Level 4's `routeNext` rule produces this unchanged; `fingerdemo` at level 5 must end on the passing Check.
- **How-to card**, `{ from: 5, to: 5 }`: "Three beds step down to the pond; each bed with a sign needs two drops, and the pond some"; "Every soil bed keeps two, so leave enough for the beds below; the tree's bed and the stone path can't change". The level-4 try and check steps and finish widen to `to: 5`, and the level-4 note widens to `to: 5`.
- **Bands:** school 3–5; Tinker Lab, unchanged.
- **Co-play:** one person counts the drops on the cloud and says how many beds can be soil; the other taps them.

### Level 5 check tier

New-level tier on level 4's interaction: typecheck and the rule tests above (plus the how-to test); one scripted play of the `rain-garden` browser case at level 5 (board A: one wrong Check, one requested hint, then the passing Check, asserting `misses` 1 and `hints` at least 1); `fingerdemo` at level 5; one upright phone screenshot after a wrong Check, since the layout is new. `npm run build`, because voice lines and the how-to card change. Levels 1–4's passing evidence is reused.

### Level 5 decisions

None waits on the developer. Defaults set here: three sockets rather than six (upright capacity, measured); free flips, as at level 4, rather than placing two tiles; six authored boards rather than random generation, so every board's proof is a table; a four-drop board so water can run out; leaf and flower markers for two marked beds; no mirroring at level 5. Source check: level 4's EPA and USGS pages cover the direction (rain that hard ground does not hold runs downhill to what lies below); the tree's bed and the stone path add no new claim, since they are labelled soil and stone of the toy.

## Level 6, *rain again on wet ground* (definition)

Defined 2026-11-23 as the weather-and-water study's [slice 6](../deep-dives/subjects/weather-water.md#build-slices-in-order), from the [ladder's level-6 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and its accounting paragraph (levels 1–3 and 6 are exploration). One build session, new-interaction tier ([Level 6 check tier](#level-6-check-tier)): the stateful two-shower trial and the optional prediction are new; the board and its flips are level 4's.

**Fun action and purpose:** two garden beds step down to the pond, as at level 4. She taps the cloud: the first rain falls on dry ground and the soil keeps what it can. The beds stay wet, the cloud fills again with the same rain, and she may tap a picture to guess what the second rain will do. She taps the cloud again: this time the full soil holds nothing more, so the water runs past it, and the pond's two rows show the first rain's water and the second's side by side. The learning purpose is **comparing the same rain on dry and on already-wet ground** (one changed starting condition, the next step after level 3's one changed surface): ground that already holds water can keep less of the next rain, so more runs off. Nothing is a wrong answer: a guess that does not come true is an experiment.

**Overlap, rechecked:** level 3 changes the ground between two fresh trials; level 6 keeps the ground and changes only how wet it starts, so the two comparisons are distinct. The beds never dry while she waits and drops never rise to the cloud, so nothing here is evaporation (Drop's Journey owns the water cycle). The carried-storage rule is told and shown, never inferred: telling two hidden rules apart from a trace is level 8. Day by Day keeps weather records; no rain here is "yesterday's". Water Paths and Puddle Pipes keep routing: the arrows stay fixed.

### The model, level 6

- **The board** is level 4's two-socket chain on `RouteBoard`: `board6(units)` = `{ id: 'wet' + units, route: ROUTE4, fixed: [null, null], marked: [], units }`. Both beds are tappable (stone or soil, capacities 0 and 2); no bed is marked, there is no need sign, no pond sign and no Check. Never mirrored (as at level 5: the measured layout below has one orientation per frame).
- **The shower** is the board's `units`, **4** or **2**, the same for both rains of a round and drawn on the cloud as that many dashed drops before each rain.
- **Carried storage:** `runRoute(sockets, route, units, start)` gains a `start: number[]` argument (default all zero, so levels 4–5 are unchanged), with `0 ≤ start[i] ≤ capacity(sockets[i])`. A unit stays in a socket while `stored < capacity`, counting what was already there. Conservation for one shower becomes levels 1–3's identity again: `units + sum(start) = sum(stored) + pond`, after every step.
- **The two-shower trial:** `runTwo(sockets, board)` returns `[first, second]`: `first = runRoute(…, zeros)` and `second = runRoute(…, first.stored)`. Each trial's `pond` counts **that shower's** water only (the scene draws them in two rows). Across the sequence `2 × units = sum(second.stored) + first.pond + second.pond`.
- **All outcomes**, the whole table (kept is per bed after that shower, top then low; the comparison is of the two pond rows):

  | Top / low | Drops | First rain kept | First pond | Second rain kept | Second pond | Comparison |
  | --- | --- | --- | --- | --- | --- | --- |
  | **soil / soil** (authored) | 4 | 2, 2 | 0 | 2, 2 | 4 | more |
  | stone / soil | 4 | 0, 2 | 2 | 0, 2 | 4 | more |
  | soil / stone | 4 | 2, 0 | 2 | 2, 0 | 4 | more |
  | stone / stone | 4 | 0, 0 | 4 | 0, 0 | 4 | same (stone) |
  | soil / soil | 2 | 2, 0 | 0 | 2, 2 | 0 | same, ran further |
  | stone / soil | 2 | 0, 2 | 0 | 0, 2 | 2 | more |
  | soil / stone | 2 | 2, 0 | 0 | 2, 0 | 2 | more |
  | stone / stone | 2 | 0, 0 | 2 | 0, 0 | 2 | same (stone) |

  In every row a soil bed gains 0 or 2 in a shower, never 1, and the second pond is never smaller than the first: carried storage only ever leaves less room. `compareWet(first, second)` returns `{ pond: 'more' | 'same', further: boolean }`, where `further` is true when both pond rows are equal and the second rain reaches a socket the first never reached (only soil / soil with 2 drops).
- **Round state** (`WetState`): `sockets`, `first: RouteTrial | null`, `second: RouteTrial | null`, `prediction: 'more' | 'same' | null`, `sequences` (settled two-shower trials this round), `hints`, `pointing`, `finished`. The phase is derived: fresh (no `first`), wet (`first` but no `second`), done (both).
  - `wetRain(s, round)`: fresh → runs the first rain from zero; wet → runs the second from `first.stored` and adds one to `sequences`; done → resets to fresh on the same arrangement (the cloud shows the rewind badge), keeping `sequences` and `hints`.
  - `wetFlip(s, i)`: flips bed `i` and resets to fresh (both trials and the prediction cleared), as level 4's flip does. Allowed in any phase; it is how she starts a new experiment.
  - `predict(s, p)`: allowed only in the wet phase; sets or changes `prediction`. It never changes the trials, misses or hints, and the cloud never waits for it.
  - `wetRestart(round)`: the round's starting arrangement, fresh, keeping `hints` and `sequences` (Start again, as at levels 1–3).
  - `canFinish(s)`: `sequences ≥ 1`. `wetNext(s)`: the cloud (fresh or wet phase), then the leaf.
- **Nothing changes without a tap:** storage changes only in `wetRain`; no timer dries, drains or refills a bed, and a new round, Start again, a flip and the done-phase cloud tap all start from zero. Nothing carries between rounds.
- **Authored first round:** soil / soil, 4 drops, frog (the clearest contrast: none to the pond, then all four). **Seeded rounds:** drops 4 or 2 (even chance), a starting arrangement uniformly among the four, the pond friend. Every seeded round is valid; stone / stone is kept as a round because "stone holds none, wet or dry" is its own finding.

### Screen and controls, level 6

- **The board** is level 4's: the cloud (260×140) over the top bed, beds 300×150 with two dashed pockets (stone draws none), fixed arrows, the pond friend at the tray's far end. Drops stored by the first rain **stay in their pockets**, and a bed holding water draws its soil one shade darker with a ripple line, so the changed starting condition is pictured before the second rain falls.
- **The pond tray has two rows** of four slots (56 each, 58 apart), one per rain, each with a small picture badge at its left end (56×56, not a target): a cloud with one dot for the first rain, a cloud with two dots for the second. The rows line up, so "more" reads as a longer second row without counting.
- **Prediction pictures** (two targets, 120×120 each), shown only in the wet phase: **more** (a pond with a short top row and a long bottom row) and **same** (two equal rows). Touch-down squashes; tapping one lifts it and lights it, tapping the other moves the light. No third "less" picture ([decision](#level-6-decisions)). Navigation never requires reading.
- **The cloud** shows its drops as dashed outlines, plus the one-dot or two-dot badge of the rain it will drop next; in the done phase it shows level 1's rewind badge, and tapping it plays the fresh-garden wipe. Taps during a shower are ignored; nothing is timed.
- **The leaf** (120×120, where the Check sits at levels 4–5) appears once `canFinish` is true, as at levels 1–3.
- **Built coordinates (frame centers, `wetLayout`):**
  - Landscape (1024×768 frame, centered): cloud (300, 110), top bed (300, 260), low bed (798, 465), pond tray (823, 662), prediction pictures (660, 230) and (800, 230).
  - Upright on a phone (768×1024 frame hung from the bottom edge): cloud (220, 300), top bed (220, 470), low bed (548, 523), pond tray (548, 918), prediction pictures (470, 300) and (610, 300).
  - The 320×148 tray has rows at its y ∓ 31, slots centered at tray x + 30 + k × 58 (k = −1.5 … 1.5), and badges centered at tray x − 130. The leaf uses the view's top-right box, as the Check does at levels 4–5.
- **Caption clearance:** on short upright phones the beds sit above the bubble and the tray sits below it. Sideways, the high bed sits above the bubble and the low bed to its right. Layout tests cover targets, both pond rows, badges, Home and guide clearance across eight views. A view that cannot hold the layout returns null.

### Accounting, help and finishing, level 6

- **No misses at level 6.** Every rain, flip, guess, replay and Start again is a valid experiment; `misses: 0` always, and no boing plays. A guess that does not come true is answered with the surprise line, never "wrong", and counts nothing.
- **Hint:** Show me (pause sheet) has the pet do the next useful action from `wetNext`: tap the cloud (fresh or wet) or point at the leaf; **1 hint** per requested hint (pointing counts only if newly pointed, as at levels 1–3). There is no causal glow. Two idle cues in a row repeat the instruction and count nothing.
- **Leaf nudge (not a hint):** after the second settled two-shower trial the leaf glows and the pet says `rain.done`.
- **Finish:** the leaf ends the round through `ctx.finish({ misses: 0, hints })`, once. Finishing with help earns the ordinary one sticker.
- **Adaptation:** a hint-free round is smooth to the shell; that means she joined in, not that she understands saturation, and the grown-ups' note says so (as at levels 1–3). School's range becomes 3–6; level 6 is its top, so stepping up clamps there.

### Speech, level 6 (`voice.ts`)

- `rain.instruct.6`: "Tap the cloud to rain on the garden. Then rain again on the wet ground, and see where the water goes."
- **Each rain is narrated with level 5's clip chain**, one clip per socket from the top while water reaches it, then the pond clip, with two changes: the sockets are named `top` and `low` (level 5's `POSITION` maps index 1 to `middle`, so a two-socket board needs its own names), and a soil bed that was **already full when this rain began** says a new clip instead of `kept`: `rain.bed.top.full` "The top bed was already full, so the water ran past." / `rain.bed.low.full` "The low bed was already full, so the water ran on." Reused: `rain.bed.top.kept`, `rain.bed.low.kept`, `rain.bed.top.stone`, `rain.bed.low.stone`, `rain.bed.low.none`, `rain.pond.0`, `rain.pond.2`, `rain.pond.4` (`rain.pond.6` can never fire: one rain is at most four drops).
- `rain.wet.ready` (after the first rain settles): "Time to rain on the same ground again. Will the second rain send more to the pond, or the same? Tap a picture if you like, then tap the cloud."
- Before the second rain's narration, if she guessed: `rain.guess.more` "You thought more would run to the pond." or `rain.guess.same` "You thought it would be the same." After the comparison line: `rain.guess.yes` "Just as you thought." or `rain.guess.surprise` "A surprise! That's what experiments are for."
- **Comparison** (after the second rain, from `compareWet`): `rain.wet.more` "The soil was already full of water, so more ran down to the pond the second time." / `rain.wet.stone` "Stone holds none, wet or dry, so the pond got the same both times." / `rain.wet.further` "The pond got none both times, but the second rain ran further down, because the top bed was already full."
- Reused: `rain.again` (the wipe to a fresh garden), `rain.done`, `rain.hint.cloud`.

No line says the soil "drinks", that it "can't drink any more", that a plant needs the water, how long real ground stays wet, or anything about floods; "kept", "full" and "ran past" stay the toy's words. 11 new lines in all, rendered to clips by the build.

### Rule tests, level 6 (`logic.test.ts`)

1. **Carried conservation:** for all four arrangements and both shower sizes, after every step of each rain `released + sum(start) = sum(stored) + pond`; across the sequence `2 × units = sum(second.stored) + first.pond + second.pond`; each rain has `units` steps and each unit appears once.
2. **Outcome table:** the eight rows above exactly (kept, both ponds, comparison).
3. **Bounds:** carried storage never exceeds a socket's capacity; the first rain always starts at zero; a socket gains 0 or 2 per rain; `runRoute` with the default `start` gives levels 4–5's results unchanged.
4. **Never less:** for every row the second pond is at least the first; `compareWet` returns `more` or `same` as tabled, and `further` only for soil / soil with 2 drops.
5. **Fresh starts and no leak:** a flip in any phase, the done-phase cloud tap, Start again and a new round each start every socket at zero with both pond rows empty; no state function except `wetRain` changes storage; a seeded round never inherits the previous round's storage.
6. **Guesses:** `predict` is ignored outside the wet phase, never changes trials, misses or hints, can be changed before the second rain, and is cleared by any reset; the second rain runs with no guess.
7. **Accounting:** `misses` stays 0 through every action sequence of a bounded search (rains, flips, guesses, restarts, hints); a requested hint counts 1 and performs `wetNext`; `canFinish` is false until a second rain has settled; Finish happens once.
8. **Narration:** for every row, each rain's clip chain ends with the pond clip matching that rain's pond, says `.full` exactly for a soil socket full at that rain's start, never names a socket below the first one water missed, and never `rain.pond.6`; every clip id exists in `voice.ts`.
9. **Seeded rounds:** drops are 2 or 4, any arrangement, the friend from `FRIENDS`; the authored round is soil / soil with 4 drops and the frog.
10. **Layout:** level 6 at the eight views, as measured above.

### Code the builder must widen

`runRoute` hard-codes `stored = sockets.map(() => 0)` and needs the `start` argument. `RouteRound.level` is `4 | 5` and `makeRoute`, `planFor` (clamps at 5) and the scene's level dispatch stop at 5; level 6 needs its own round and state (`WetState`) rather than level 4's Check state, since nothing is judged. `routeLayout` reads `b.marked[0].socket` for every two-socket board, which a board with no marked bed breaks, so level 6 gets its own branch. `narration`'s `POSITION` is three-socket only. `route.ts` draws one pond row, need signs and a Check: level 6 draws two rows with badges, no signs, the prediction pictures, the darker wet soil and the leaf. `LEVELS` school becomes `{ min: 3, max: 6 }` (no grown-up band yet) and `PLANS` gains "Rain twice: see where the second rain goes when the ground is already wet". The browser fixture's upright switch (`FROM_LEVEL` 5 or more) already covers 6.

### Ghost finger, how-to card and registration, level 6

- **Ghost finger** on the authored round: tap the cloud (both beds keep two), tap the **more** picture, tap the cloud (all four run to the pond), tap the leaf. `fingerdemo` at level 6 must end on the leaf. The demonstration guesses so the picture's use is shown; `wetNext` itself never requires a guess.
- **How-to card**, `{ from: 6, to: 6 }` steps: "Tap the cloud: the first rain falls on dry ground and the soil keeps what it can"; "Tap the cloud again: the same rain on wet ground; the pond's two rows show both rains side by side"; "Before the second rain she can tap a picture to guess; a guess is never wrong". Finish: "Tap the leaf when she's done; it appears after both rains." Note: "Every choice is fine here: no misses. A pretend model: soil holds two drops, stone none, and the ground stays wet only between these two rains. Real ground that is already wet soaks up less of the next rain, so more runs off; real ground also drains and dries over time. Show me counts as help. Rounds without hints move her up, which means she joined in." The builder keeps the card under the how-to test's 840-character cap, shortening the note before any step.
- **Bands:** school 3–6. Tinker Lab, unchanged; no new game, so no lands change.
- **Co-play:** one person guesses with a picture and says why; the other taps the cloud; then swap.

### Level 6 check tier

New-interaction tier, one build session: typecheck and the rule tests above (plus the how-to, voice and layout tests); one scripted play of the `raingarden` browser case filtered to level 6 on an upright phone (`FROM_LEVEL=6`): the first rain, a guess, the second rain, a flip that resets (assert empty pockets and both pond rows empty), one requested hint and the leaf, asserting `misses` 0 and `hints` at least 1. Like levels 1–3 it has **no wrong answer to fabricate**; the guess that does not come true is the one to exercise. One upright phone screenshot after the second rain (both rows and the wet beds). `fingerdemo` at level 6. `npm run build` and the offline check, because voice lines and their clips are added. Levels 1–5's passing evidence is reused.

Device and person checks stay parked: whether a school child reads the darker soil and filled pockets as "still wet", and whether "already full" is clear in phone speech.

### Level 6 decisions

None waits on the developer. Defaults this definition sets:

- **Two sockets, not level 5's three:** level 4's measured board leaves room for the second pond row and the two pictures on an upright phone; three beds and two rows would not fit at full size. "On level 5's board model" is kept as the shared `RouteBoard` and its clip narration.
- **The wet condition comes only from a rain she watched:** no round starts pre-wet, because ground that is wet for a reason she did not see is a hidden variable.
- **Two guess pictures, no "less":** in this toy wet ground never takes more, so "less" could never come true; offering it would be a choice the model always refuses. The note to grown-ups carries the real-world caveat instead.
- **Two rains, then the rewind:** a third rain would show nothing new (the beds are already full after the second at most); the sequence replays from fresh.
- **Shower size 2 or 4, shown on the cloud:** the two-drop rounds make the "ran further" and "pond got two the second time" cases, so "make everything soil" is not one answer to remember.
- **Source:** the [USGS runoff page](https://www.usgs.gov/water-science-school/science/runoff-surface-and-overland-water-runoff) recorded at level 4 says earlier rain's soil moisture changes runoff; that supports the direction of the comparison line ("already full, so more ran to the pond"), not the capacities. The building session reopens it and records the check in its verification entry, as decision 2 asks.

## Level 7, *one garden for two rains* (definition)

Defined 2026-11-23 as the weather-and-water study's [slice 7](../deep-dives/subjects/weather-water.md#build-slices-in-order), from the [ladder's level-7 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden). (Defined as docs only; now built.) One build session, new-level tier ([Level 7 check tier](#level-7-check-tier)): the interaction is level 5's (flip beds, rain, Check) with a second rain on the same board, and the two rain cards are new.

**Fun action and purpose:** the three-bed slope of level 5, but two rain cards hang beside it: a **light shower** (four drops) and a **big storm** (six drops). Each card has its own signs: which beds must keep two, and for the storm what the pond must get. She flips beds, taps a card to see that rain fall on her garden, and checks. The Check runs **both** rains, each on dry ground, and marks each card with a tick or a cross. The learning purpose is **designing for two conditions at once**: a garden that is right for the light shower can be wrong for the storm and the other way round, and the answer is the one layout both cards accept. Revising after a cross on one card, without breaking the other, is the skill; no single rule ("make the marked beds soil") answers every board.

**Overlap, rechecked:** level 6 keeps the ground wet between two showers; at level 7 **every rain starts on dry ground** and nothing carries over (the ladder's "each from a fresh state"), so the two levels stay distinct, and evaporation and drying are still not modeled (Drop's Journey). Level 5 has one rain and one set of needs; here the rain and the needs change with the card. The arrows stay fixed and she never draws a route (Water Paths and Puddle Pipes keep routing). Telling two hidden rules apart from a trace is level 8, and nothing here is hidden: both cards' needs can be read on screen at any time.

### The model, level 7

- **The board** is level 5's three-socket chain (`ROUTE5`) with **all three beds tappable** (stone ↔ soil, capacities 0 and 2): no tree's bed, no stone path, no mirroring. Fixed sockets are left out on purpose: with a fixed bed the two-card boards collapse to one forced answer or to nested cards (every candidate was enumerated; the [decisions](#level-7-decisions) say why).
- **Two cards**, always the same two rains: `light` (**4** drops) and `storm` (**6**). Each card carries its needs: `marked` (one or two beds that must keep **exactly 2**, with level 5's markers: a lone marked bed carries the leaf, two carry the leaf uphill and the flower below) and a **pond rule**:
  - `any` (the light shower always): the pond has no need; four drops cannot flood anything, and no pond sign is drawn.
  - `reach`: the pond gets **at least 1** (level 4–5's rule, its sign as built).
  - `hold`: the pond gets **at most 2** ("the garden holds back the storm"; its sign shows the pond's first two slots outlined and a bar across the tray after the second).
  The storm's pond rule is `reach` on boards A–C and `hold` on D–F.
- **Judging:** `meets(trial, card)` extends level 5's with the pond rule (`pondOk(rule, pond)`); level 4–5 boards keep `reach`, so their results do not change. `checkCards(sockets, board)` runs each card fresh with `runBoard` (the same `runRoute` from zero storage) and returns `{ light, storm }`, each `{ trial, beds: boolean[], pond: boolean }`.
- **Solutions:** `solutions7(board)` is the **intersection**: every arrangement of the three beds that meets both cards. `nearest` and `stepBed` are level 5's over that set (fewest flips; ties go to the first in enumeration order, top socket first, stone before soil; fixed sockets do not exist, so every bed can glow).
- **Cause:** a failed Check names the **first failing card** (light before storm) and one cause on it: `dry` (the uphill-most marked bed that did not keep two), then `pond` (the pond got none, a `reach` card), then `over` (the pond got more than two, a `hold` card). The other card's tick or cross still shows.
- **Round state** (`TwoRainState`): `sockets`, `active: 'light' | 'storm'`, `trials: [RouteTrial | null, RouteTrial | null]` (previews since the last flip), `verdicts: [boolean | null, boolean | null]` (the last Check's ticks), `current` busy flag as level 4, `checked` (arrangement key of the last failed Check), `misses`, `hints`, `glow`, `glowShown`, `pointing`, `passed`.
  - `pickCard(s, id)`: sets `active`; free, allowed at any time, never touches sockets, trials or counts.
  - `previewRain(s)`: runs the active card from dry ground and stores its trial. Previews are unlimited and never carry storage from the other card or from an earlier preview.
  - `flip(s, i)`: flips bed `i`, clears both trials and both ticks (a changed garden has no stale verdict) and keeps `active`.
  - `check(s, round)`: runs both cards, sets `verdicts`; pass when both pass; on a miss the first failing card becomes `active` and its rain plays as the trace. Miss counting is level 4–5's: one miss per failed Check on an arrangement not already counted; checking it again counts nothing; from the second miss the glow shows `stepBed`, counting one hint the first time.
- **Nothing carries:** no state function except `flip` changes sockets; the cards' rains never share storage; a new round, Start again and a flip all clear previews and ticks.

### The six boards

All six use the light shower (4) and the storm (6). Each table lists **every one of the eight arrangements**, what each bed kept in each rain, the pond, and why it fails; they are the rule tests' expected values (generated by enumerating the model, then read back by hand). Counting from the statistics below: seven or six arrangements fail on every board, and on every board **some arrangements fail only the light card and some only the storm card**, so a layout that pleases one rain is never automatically right.

| Board | Light needs | Storm needs | Answers | Fails light only / storm only / both | Most flips from a failing start |
| --- | --- | --- | --- | --- | --- |
| **A**, *Top for the light* (authored) | top | middle, pond reach | soil / soil / stone | 2 / 3 / 2 | 3 |
| **B**, *Skip the middle* | low | top, pond reach | soil / stone / soil | 2 / 2 / 3 | 3 |
| **C**, *Middle then low* | middle | low, pond reach | stone / soil / soil | 2 / 3 / 2 | 3 |
| **D**, *Hold back the storm* | top | low, pond hold | soil / stone / soil; soil / soil / soil | 1 / 2 / 3 | 2 |
| **E**, *Middle and top* | middle | top, pond hold | soil / soil / stone; soil / soil / soil | 1 / 2 / 3 | 2 |
| **F**, *Leaf and flower in the light* | top and middle | low, pond hold | soil / soil / soil | 2 / 1 / 4 | 3 |

"Kept" lists the top, middle and low bed in that order; "ok" is a met need.

**A, *Top for the light*** (authored first board; **starts soil / soil / soil**: the light shower passes, the storm's pond gets none, and flipping the low bed to stone fixes it). One answer.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | top dry | 0, 0, 0 | 6 | middle dry | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | top dry | 0, 0, 2 | 4 | middle dry | fails both |
| stone / soil / stone | 0, 2, 0 | 2 | top dry | 0, 2, 0 | 4 | ok | fails light |
| stone / soil / soil | 0, 2, 2 | 0 | top dry | 0, 2, 2 | 2 | ok | fails light |
| soil / stone / stone | 2, 0, 0 | 2 | ok | 2, 0, 0 | 4 | middle dry | fails storm |
| soil / stone / soil | 2, 0, 2 | 0 | ok | 2, 0, 2 | 2 | middle dry | fails storm |
| **soil / soil / stone** | 2, 2, 0 | 0 | ok | 2, 2, 0 | 2 | ok | **passes** |
| soil / soil / soil | 2, 2, 0 | 0 | ok | 2, 2, 2 | 0 | pond got none | fails storm |

**B, *Skip the middle*** (light: low bed; storm: top bed and pond some). One answer.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | low dry | 0, 0, 0 | 6 | top dry | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | ok | 0, 0, 2 | 4 | top dry | fails storm |
| stone / soil / stone | 0, 2, 0 | 2 | low dry | 0, 2, 0 | 4 | top dry | fails both |
| stone / soil / soil | 0, 2, 2 | 0 | ok | 0, 2, 2 | 2 | top dry | fails storm |
| soil / stone / stone | 2, 0, 0 | 2 | low dry | 2, 0, 0 | 4 | ok | fails light |
| **soil / stone / soil** | 2, 0, 2 | 0 | ok | 2, 0, 2 | 2 | ok | **passes** |
| soil / soil / stone | 2, 2, 0 | 0 | low dry | 2, 2, 0 | 2 | ok | fails light |
| soil / soil / soil | 2, 2, 0 | 0 | low dry | 2, 2, 2 | 0 | pond got none | fails both |

**C, *Middle then low*** (light: middle bed; storm: low bed and pond some). One answer.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | middle dry | 0, 0, 0 | 6 | low dry | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | middle dry | 0, 0, 2 | 4 | ok | fails light |
| stone / soil / stone | 0, 2, 0 | 2 | ok | 0, 2, 0 | 4 | low dry | fails storm |
| **stone / soil / soil** | 0, 2, 2 | 0 | ok | 0, 2, 2 | 2 | ok | **passes** |
| soil / stone / stone | 2, 0, 0 | 2 | middle dry | 2, 0, 0 | 4 | low dry | fails both |
| soil / stone / soil | 2, 0, 2 | 0 | middle dry | 2, 0, 2 | 2 | ok | fails light |
| soil / soil / stone | 2, 2, 0 | 0 | ok | 2, 2, 0 | 2 | low dry | fails storm |
| soil / soil / soil | 2, 2, 0 | 0 | ok | 2, 2, 2 | 0 | pond got none | fails storm |

**D, *Hold back the storm*** (light: top bed; storm: low bed, and the pond gets **at most 2**). Two answers: the middle may be either.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | top dry | 0, 0, 0 | 6 | low dry, pond over | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | top dry | 0, 0, 2 | 4 | pond over | fails both |
| stone / soil / stone | 0, 2, 0 | 2 | top dry | 0, 2, 0 | 4 | low dry, pond over | fails both |
| stone / soil / soil | 0, 2, 2 | 0 | top dry | 0, 2, 2 | 2 | ok | fails light |
| soil / stone / stone | 2, 0, 0 | 2 | ok | 2, 0, 0 | 4 | low dry, pond over | fails storm |
| **soil / stone / soil** | 2, 0, 2 | 0 | ok | 2, 0, 2 | 2 | ok | **passes** |
| soil / soil / stone | 2, 2, 0 | 0 | ok | 2, 2, 0 | 2 | low dry | fails storm |
| **soil / soil / soil** | 2, 2, 0 | 0 | ok | 2, 2, 2 | 0 | ok | **passes** |

**E, *Middle and top*** (light: middle bed; storm: top bed, pond at most 2). Two answers: the low bed may be either.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | middle dry | 0, 0, 0 | 6 | top dry, pond over | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | middle dry | 0, 0, 2 | 4 | top dry, pond over | fails both |
| stone / soil / stone | 0, 2, 0 | 2 | ok | 0, 2, 0 | 4 | top dry, pond over | fails storm |
| stone / soil / soil | 0, 2, 2 | 0 | ok | 0, 2, 2 | 2 | top dry | fails storm |
| soil / stone / stone | 2, 0, 0 | 2 | middle dry | 2, 0, 0 | 4 | pond over | fails both |
| soil / stone / soil | 2, 0, 2 | 0 | middle dry | 2, 0, 2 | 2 | ok | fails light |
| **soil / soil / stone** | 2, 2, 0 | 0 | ok | 2, 2, 0 | 2 | ok | **passes** |
| **soil / soil / soil** | 2, 2, 0 | 0 | ok | 2, 2, 2 | 0 | ok | **passes** |

**F, *Leaf and flower in the light*** (light: top bed (leaf) and middle bed (flower); storm: low bed, pond at most 2). One answer, and it is every bed: this is where "more soil" is right because the storm must be held.

| Top / middle / low | Light kept | Light pond | Light | Storm kept | Storm pond | Storm | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stone / stone / stone | 0, 0, 0 | 4 | top dry, middle dry | 0, 0, 0 | 6 | low dry, pond over | fails both |
| stone / stone / soil | 0, 0, 2 | 2 | top dry, middle dry | 0, 0, 2 | 4 | pond over | fails both |
| stone / soil / stone | 0, 2, 0 | 2 | top dry | 0, 2, 0 | 4 | low dry, pond over | fails both |
| stone / soil / soil | 0, 2, 2 | 0 | top dry | 0, 2, 2 | 2 | ok | fails light |
| soil / stone / stone | 2, 0, 0 | 2 | middle dry | 2, 0, 0 | 4 | low dry, pond over | fails both |
| soil / stone / soil | 2, 0, 2 | 0 | middle dry | 2, 0, 2 | 2 | ok | fails light |
| soil / soil / stone | 2, 2, 0 | 0 | ok | 2, 2, 0 | 2 | low dry | fails storm |
| **soil / soil / soil** | 2, 2, 0 | 0 | ok | 2, 2, 2 | 0 | ok | **passes** |

Every light-shower pond is 4, 2 or 0 and never needs a rule: the light card's pond line is `any` by design. On the light shower the third bed in a chain of soils gets nothing (soil / soil / soil keeps 2, 2, 0): the water runs out, as at level 5's board F. Seeded rounds pick a board uniformly from all six, then a starting arrangement uniformly among that board's failing ones, so the authored start (A, soil / soil / soil) is one of A's seven.

### Screen and controls, level 7

- **Level 5's board, unchanged:** beds 300×130, cloud 260×140 over the top bed, the pond tray (six slots), need signs 140×110 beside the beds the **active card** marks, the pond sign only when the active card has a pond rule, the Check 120×120 top-right. Changing the card redraws the signs and the cloud's dashed drops (4 or 6) in place; the beds' ground and any previews stay.
- **Two card buttons**, 120×120 each, as new targets: the **light shower** (a small pale cloud with four dashed drops) and the **big storm** (a dark cloud with six). Under the cloud each card shows its needs as small pictures (the leaf and flower markers, and for the storm the pond rule's mark), so the card not being shown is still readable; these pictures are not targets. Touch-down squashes a card; the active one lifts and lights. After a Check each card wears a tick or a cross (24 px, not a target).
- **Built coordinates, frame centers, measured 2026-11-23** by a scratch test applying level 5's layout-test rules at its eight views (landscape, portrait, phone, notch, and four upright), with the real level 5 layout and every mark set that appears on the boards (one or two marked beds at any sockets):
  - Upright on a phone (768×1024 frame hung from the bottom edge): light card (470, 200), storm card (610, 200). They sit right of the cloud (which ends at x = 390) and below the Check (the view's top-right corner box), clear of every sign position and of Home's and the guide's corners.
  - Landscape (1024×768 frame, centered): light card (620, 115), storm card (760, 115), right of the cloud, left of the Check, above the top bed's sign.
  - Result of that run: **no overlap, nothing outside the view and both corners clear, at all eight views and every mark set.** The builder copies the numbers into `routeLayout`'s three-bed branch for the two-card boards and extends level 5's layout test to level 7 (two card targets, at least 100 each, no overlap with any target, sign or the pond; signs for every mark set), and a view that cannot hold the board returns null rather than shrink.
- **The leaf** (120×120, where the Check sits) appears after a passing Check, as at levels 4–5.
- **Pace:** the storm's six drops use level 5's pace (0.7, each drop leaving the cloud 0.45 s after the last); the light shower's four use level 4's. Taps during a rain are ignored; nothing is timed.

### Accounting, help and finishing, level 7

- **Previews, card picks, flips and Start again are free**; a card pick during a rain is ignored, not queued. No automatic stop and no timer.
- **A failed Check counts one miss** (a gentle boing, then the card's line and the trace of the first failing card's rain with the failing sign wobbling); checking the same arrangement again counts nothing. **From the second miss** the bed to change glows (`stepBed` over the intersection), counting one hint the first time it lights, and the glow follows the arrangement after flips.
- **Show me** (pause sheet) does the next useful step: flip `stepBed`'s bed (1 hint per request), or point at the Check once the garden passes (counting only if newly pointed, as at levels 1–5). At most **three** worked steps reach an answer (boards D and E need at most two), so assisted completion is always available; finishing with help earns the ordinary one sticker.
- **Finish:** the leaf ends the round through `ctx.finish({ misses, hints })`, once. School's range becomes 3–7, so level 7 is its top and stepping up clamps there. A struggling round is four or more misses or two hints, as in the shell; a smooth round (at most one miss, no hints) means she managed both cards, and the grown-ups' note says that a hint-free round is not mastery of designing for conditions.

### Speech, level 7 (`voice.ts`)

Each rain is narrated with level 5's clip chain (one clip per bed from the top while water reaches it, then the pond clip); no new bed or pond clip is needed (`rain.pond.6` fires for the storm's all-stone case). New lines (10, rendered to clips by the build; none has a slot):

- `rain.instruct.7`: "A light shower and a big storm are both coming. Change the beds so one garden works for both. Tap a card to see its rain, then tap the check."
- `rain.card.light`: "The light shower: four drops." / `rain.card.storm`: "The big storm: six drops." (said when she picks a card, once per pick, and before a trace.)
- After a failed Check, the boing, then a line for what failed: `rain.miss7.light` "This garden doesn't work for the light shower yet." / `rain.miss7.storm` "This garden doesn't work for the big storm yet." / `rain.miss7.both` "Neither rain works yet. Look at each card." For `both` the first failing card (light) is traced and named by its cause line.
- The cause (of the first failing card): `rain.cause.dry` "A bed this card needs stayed dry. Look where the water stayed." / `rain.cause.pond` "The pond got none. The beds kept every drop." / `rain.cause.over` "Too much ran into the pond. The garden needs to hold back more of the storm."
- `rain.check.yes.cards`: "Both rains work in this garden. Every need met!"
- Reused: `rain.glow`, `rain.hint.flip`, `rain.hint.check`, `rain.done`, `rain.again`, `rain.hint.cloud`.

No line says that gardens "drink", that real gardens work this way, how storms should be handled, or anything about flooding safety; "kept", "stayed dry", "held back" and "ran into the pond" stay the toy's words.

### Rule tests, level 7 (`logic.test.ts`)

1. **Tables:** for all six boards and all eight arrangements, `checkCards` returns the tables' kept lists, ponds and per-card results exactly; the answer sets are exactly as tabled (`solutions7`), and all six answers are valid under both cards' `meets`.
2. **Conservation:** for every arrangement, card and step, `released = sum(stored) + pond`; each rain has its card's units steps; each unit appears once; every stored amount and pond count is even.
3. **Both rains matter:** on every board some arrangement fails only the light card and some only the storm card; no board's answer set is empty, and the intersection is a proper subset of each card's own answer set.
4. **Fresh every time:** a card's trial starts from zero storage whatever ran before; previews of both cards in any order give identical results to a fresh `checkCards`; `flip` clears both trials and both ticks; Start again and a new round clear previews, ticks, glow and counts as at level 5.
5. **Pond rules:** `pondOk` is true for `any` always, for `reach` iff pond ≥ 1 and for `hold` iff pond ≤ 2; levels 4–5's boards give unchanged `meets` results.
6. **Causes:** `dry` is the uphill-most failing marked bed on the first failing card, then `pond`, then `over`; the light card is judged first; a pass has no cause.
7. **Accounting:** a failed Check counts one miss; the same arrangement again counts none; the glow appears from the second miss and counts one hint once; `stepBed` over the intersection always names a bed that moves toward a nearest answer; from any failing arrangement at most three flips reach an answer (two on D and E); picks, previews and flips never count.
8. **Narration and lines:** each rain's chain ends with the pond clip matching its pond and never names a bed below the first one the water missed; every new line id exists in `voice.ts` and every clip id used exists.
9. **Seeding:** the authored round is board A starting soil / soil / soil; seeded rounds draw a board from all six and a starting arrangement from its failing ones; every seeded round is solvable and starts failing.
10. **Layout:** level 7 at the eight views, as measured above.

### Code the builder must widen

`meets` and `Verdict` assume one `board.marked` and a pond need of "at least 1": level 7 needs the per-card pond rule (`any`, `reach`, `hold`) and the `over` cause. `RouteRound.level` is `4 | 5` (and level 6 has its own state), so level 7 gets its own round and `TwoRainState` rather than level 4's Check state. `routeLayout`'s three-bed branch needs the card targets (`cards` in `RouteLayout`, null on other levels) and the level-7 layout must keep returning null instead of shrinking. `route.ts` draws one set of signs for one rain: level 7 redraws the signs, the pond sign and the cloud's drops when the active card changes, and draws card buttons with tick and cross badges. `planFor` and `LEVELS` stop at 6: `PLANS` gains "Two rains: change the beds so one garden works for both a light shower and a big storm", and `LEVELS` school becomes `{ min: 3, max: 7 }`. The browser fixture's upright switch (`FROM_LEVEL` 5 or more) already covers 7.

### Ghost finger, how-to card and registration, level 7

- **Ghost finger** on the authored round (A, starting soil / soil / soil): tap the **storm** card, tap the cloud (all six run through: the pond gets none), tap the **low** bed (flip to stone), tap the cloud (the pond gets two), tap the **light** card, tap the cloud (the top two beds keep two), tap the Check (both ticks), tap the leaf. `fingerdemo` at level 7 must end on the leaf.
- **How-to card**, `{ from: 7, to: 7 }` steps: "Two rains are coming, a light shower and a big storm. Tap a card to see its rain fall on the garden and what that card needs."; "Tap a bed to change its ground. Try both rains, then tap the check: it tries both and marks each card."; "A cross on one card says which need failed. A change that fixes one rain can break the other." Finish: "Tap the leaf when both cards are ticked." Note: "A pretend model: soil holds two drops, stone none, and each rain starts on dry ground. Real rain gardens vary; this only compares two rains. The first failed check counts one miss; Show me counts as help." The builder keeps the card under the how-to test's 840-character cap, shortening the note before any step.
- **Bands:** school 3–7 (no grown-up band: [decision](#level-7-decisions)). Tinker Lab, unchanged; no new game, so no lands change.
- **Co-play:** one person picks a card and says what it needs; the other flips a bed; then swap and check together.

### Level 7 check tier

New-level tier, one build session: typecheck and the rule tests above (plus the how-to, voice and layout tests); one scripted play of the `raingarden` browser case filtered to level 7 on an upright phone (`FROM_LEVEL=7`): the authored round, one preview of each card, one wrong Check (a cross on the storm card, assert `misses` 1 and the ticks), a second wrong Check on a different arrangement (assert the glow and `hints` 1), one requested hint, then the passing Check and the leaf, asserting `misses` and `hints` as counted. One upright phone screenshot with a tick and a cross on the cards. `fingerdemo` at level 7. `npm run build` and the offline check, because voice lines and their clips are added. Levels 1–6's passing evidence is reused.

Device and person checks stay parked: whether a school child reads the two rain cards and ticks as "one garden, two conditions", and whether "hold back" is clear in phone speech.

### Level 7 decisions

None waits on the developer. Defaults this definition sets:

- **Three free beds, no fixed bed:** every free-and-fixed variation was enumerated, and with a tree's bed or a stone path the cards either force one arrangement for both rains or one card's answers contain the other's, so there is nothing to reconcile. The six boards are the ones where each card has answers the other rejects.
- **The light shower has no pond rule:** a four-drop rain with a marked bed cannot send more than two to the pond, so a rule there would never bind; the storm carries the pond rule (`reach` or `hold`), where it does.
- **Hold means at most two, the toy's invented bound:** it is not a design standard, a capacity of a real garden or flood-safety advice; the grown-ups' note and the unchanged "pretend model" wording say so. The [EPA green-infrastructure guide](https://www.epa.gov/green-infrastructure/types-green-infrastructure) recorded at level 4 supports only the direction (a garden holds back some runoff); the building session reopens it and records the check in its verification entry.
- **Fresh ground every time:** the two cards never share storage, so the wet-ground comparison stays level 6's and "which rain is first" can never matter.
- **No grown-up band yet:** the ladder's "grown-up 7–8" window waits for a grown-up band decision; level 7 joins the school window like levels 4–6.
- **Light before storm:** when both cards fail, the light card is traced first because its need is the simpler one to read; the storm's cross still shows.

## Level 8, *the mystery patch* (definition)

Defined 2026-11-25 as the weather-and-water study's [slice 7](../deep-dives/subjects/weather-water.md#build-slices-in-order), second half, from the [ladder's level-8 row](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and its accounting paragraph. One build session, new-interaction tier ([Level 8 check tier](#level-8-check-tier)): choosing a test, reading a trace and a "both still fit" answer are new, the cloud, soil and pond are the earlier levels'.

**Fun action and purpose:** a covered garden patch sits under the cloud and nobody says how it behaves. It follows one of two pretend rules, shown as two cards: **empties between rains** (the patch is emptied before each new rain) or **stays full** (water kept from one rain is still there for the next). She builds a test from two slots (each empty, a **small** rain of two drops or a **big** rain of four), taps the cloud, and watches only the pond, because the cover hides the patch. Then she marks every card that still fits the water she saw and taps the check. The learning purpose is **choosing a test that can tell two ideas apart, and saying "both still fit" when it cannot**: one rain looks the same either way, so only a second rain in a row can decide, and a first row of the pond never decides anything. Nothing is a forced guess: "both still fit" is a right answer to a one-rain test.

**Overlap, rechecked:** level 6 *tells* her the carried-storage rule and shows the pockets filling; at level 8 the pockets are hidden and the rule is what she is finding out, so it needs level 6 first (the ladder's order) and does not repeat it. Level 3 changes the ground and level 7 designs for two rains; here the garden never changes, only the test does. Every test starts on a fresh patch, nothing dries, and no weather record is kept (Drop's Journey and Day by Day keep those). Forecast Detective already owns clue-by-clue deduction for older players; this is a single toy mechanism, not a case file.

### The model, level 8

- **The patch** is one soil bed, capacity 2 (the toy's invented number, as in every level), hidden under a cover. **The truth** is `rule: 'reset' | 'keep'`, fixed for the round and never changed by anything she does.
- **A test plan** is `Size[]` with `Size` in `{ 2, 4 }` (small, big) and length 1 or 2. Slots compact: a plan never has an empty first slot with a filled second (clearing slot 1 moves slot 2 up).
- **`runPlan(rule, plan)`** runs each shower with levels 1–3's `runShower` on one patch, starting each plan from `stored = 0`. Under `keep` the patch carries `stored` into the next shower; under `reset` it is emptied before each shower. It returns `{ rule, plan, rains: { units, kept, pond }[] }`. Conservation, checked after every step: `units + stored at start = stored + pond`.
- **All outcomes**, the whole table (pond per rain, in order):

  | Plan | `reset` | `keep` | Fits |
  | --- | --- | --- | --- |
  | small | 0 | 0 | both |
  | big | 2 | 2 | both |
  | small, small | 0, 0 | 0, 2 | one |
  | small, big | 0, 2 | 0, 4 | one |
  | big, small | 2, 0 | 2, 2 | one |
  | big, big | 2, 2 | 2, 4 | one |

  The first rain's row is the same under both rules in every plan (a fresh patch); only the second row can differ, and in every two-rain plan it does.
- **Evidence** is the latest run only: `{ plan, ponds }`, the water in the pond tray now. `fits(evidence)` returns the rules whose `runPlan` ponds equal `ponds`: both for a one-rain plan, exactly one (the truth) for a two-rain plan. The truth is always in `fits`, so no run can contradict the hidden rule. Check judges the evidence on screen: an earlier run does not count once a newer run replaces it, and the how-to says so.
- **Marks** are the cards she has lit: `marks: Rule[]`. Toggling a card is free at any time, including before any run (a prediction before testing is never judged), and marks stay across runs and are cleared only by Start again and a new round.
- **Check** exists once a run has settled. `judge(marks, evidence)` returns `ok` when `marks` equals `fits(evidence)` as a set, and otherwise one cause: `over` (she lit one card but both fit), `wrong` (she lit only a card that does not fit) or `under` (she lit both but one does not fit). No marked card, no Check.
- **Reveal:** an `ok` Check whose `fits` has one rule lifts the cover (the patch's two pockets show how full it ended, and the rule's card stays lit) and `canFinish` becomes true. An `ok` Check on a one-rain run is supported but does not finish: the pet says both still fit and suggests a test that could separate them, and the leaf stays away until a rule is named ([decision](#level-8-decisions)).
- **Round state** (`MysteryState`): `truth`, `plan`, `evidence` (null until the first run), `runs`, `marks`, `busy` (a rain is falling), `checked` (key of the last failed `marks` plus the run number), `misses`, `hints`, `ghosts` (the cards' predicted rows are showing), `ghostsShown`, `revealed`, `pointing`, `finished`.
  - `setSlot(s, i)`: cycles slot `i` empty → small → big → empty, then compacts. Free, ignored while `busy`; it never changes `truth`, `evidence` or `marks`, and the evidence rows stay until the next run.
  - `run(s)`: needs a non-empty plan (an empty plan is ignored and the pet says `rain.m.pick`); runs `runPlan(truth, plan)` on a fresh patch, sets `evidence`, adds one to `runs` and hides `ghosts`.
  - `toggleMark(s, rule)`: free; changes only `marks`.
  - `check(s)`: `judge`; `ok` as above; a failed Check counts one miss unless the same key was already counted, and from the second miss `ghosts` turns on and counts one hint the first time it is shown (once per round).
  - `restart(round)`: the round's starting plan and an empty evidence, same `truth`, keeping `misses`, `hints` and `runs`, as Start again does at levels 1–7.
- **Nothing carries:** the patch is fresh at the start of every run; no state function but `run` produces water; a new round draws a new truth; nothing persists between rounds.
- **Authored first round:** `keep`, the frog, starting plan big. **Seeded rounds:** `truth` uniform over the two rules, the pond friend from `FRIENDS`, the starting plan one small or big rain (a one-rain start, so the first move is always a test that cannot decide). Both rules are always available and every round is solvable in at most two runs.

### Screen and controls, level 8

- **Layout reuses level 6's measured footprints**, every new target placed where a level 6 target or bed was already measured clear, at the same two orientations: the cloud (260×140) over the covered patch (300×150, drawn as soil with a cloth and a question mark; no pockets while covered), the level-6 pond tray (320×148, two rows of four, row badges at its left end showing the rain that made the row: a cloud with two or four dashed drops), and a fixed arrow from the patch to the tray.
- **Two plan slots** (120×120 each): the picture shows nothing, two small drops or four big ones; touch-down squashes and a tap cycles. Where level 6 had its two guess pictures: upright (470, 300) and (610, 300), landscape (660, 230) and (800, 230).
- **Two idea cards** (120×120 each): **empties between rains** (a patch with a wipe arrow under it) and **stays full** (a patch with a water mark that stays), lit when marked. Where level 6's low bed stood: upright (470, 510) and (610, 510), landscape (740, 465) and (880, 465). A lit card shows a bright rim and a tick, so it reads without colour.
- **The check** (120×120, top-right) appears after the first settled run; after a rule is named the **leaf** takes its place, as at levels 4–7.
- **The cloud** shows the first dashed rain of the plan and is tapped to run it; it is inert for an empty plan and during a rain. Between the plan's two rains the cloud refills and the first pond row is complete before the second rain starts; pace as level 6 (0.45 s between drops). A rain's drops go into the covered patch and disappear; the water that comes out appears in that rain's row. No pocket is drawn while covered, so the evidence is the tray alone.
- **Ghost rows (from the second miss):** each idea card shows a small two-row picture of what its rule would have left in the pond for the current plan, drawn as dots in the same four-slot rows with a different mark (ring for `reset`, square for `keep`), so she can lay each card's rows against the real tray. The cards stay the same size.
- **Frame sketch** (portrait, upright; one orientation each, the builder measures):
  - Upright 768×1024: cloud (220, 300), patch (220, 470), slots (470, 300) and (610, 300), cards (470, 510) and (610, 510), tray (548, 918), badges at tray x − 130, check or leaf in the view's top-right box.
  - Landscape 1024×768: cloud (300, 110), patch (300, 260), slots (660, 230) and (800, 230), cards (740, 465) and (880, 465), tray (823, 662).
  - A scratch overlap test of these boxes against each other (not yet against the view corners, Home or the guide) found none. The builder measures all eight views with level 6's layout-test rules, and a view that cannot hold the layout returns null rather than shrink.

### Accounting, help and finishing, level 8

- **Slot taps, runs, mark toggles and Start again are free.** A run never counts as a miss (a one-rain test is a fine experiment), and a mark before any run is a prediction, never judged.
- **A failed Check counts one miss** (a gentle boing, then the cause line), and checking the same marks on the same run again counts nothing. A supported "both still fit" Check counts nothing. **From the second miss** the ghost rows show on both cards, counting one hint the first time (once per round).
- **Show me** (pause sheet) does the next useful step through `mystNext`: no run yet, or the latest run is a one-rain test and she has not named a rule: fill the plan with big, big and run it (**1 hint** for the whole worked test); a two-rain run settled and the marks differ from `fits`: set the marks to `fits` (1 hint); marks correct: tap the check (1 hint); revealed: point at the leaf (counts only if newly pointed). At most **four** worked steps reach the end, so assisted completion is always available and earns the ordinary one sticker.
- **Finish:** the leaf ends the round through `ctx.finish({ misses, hints })`, once. School's range becomes 3–8, so level 8 is its top and stepping up clamps there. A smooth round (at most one miss, no hints) means she found a deciding test and read it; the grown-ups' note says that it is not a measure of reasoning.

### Speech, level 8 (`voice.ts`)

Each rain's narration is the pond clip only (`rain.pond.0`, `rain.pond.2` or `rain.pond.4`, never `.6`: a rain is at most four drops), said after that rain's drops settle; the covered patch is never described. New lines (14, rendered to clips by the build; none has a slot):

- `rain.instruct.8`: "This patch is hiding how it works. Pick some rain, tap the cloud, then tap the idea that fits the water you saw."
- `rain.m.reset`: "Empties between rains: the patch is emptied before each new rain." / `rain.m.keep`: "Stays full: water left in the patch is still there for the next rain." (said once when a card is lit.)
- `rain.plan.small`: "A small rain: two drops." / `rain.plan.big`: "A big rain: four drops." (said when a slot changes.)
- `rain.m.pick`: "Pick a rain first, then tap the cloud."
- `rain.m.both.ok`: "Right, both ideas still fit this water. What test could tell them apart?"
- Failed Check: `rain.m.over` "Both ideas still fit this water. One more test could tell them apart." / `rain.m.under` "One of those ideas doesn't fit the water you saw. Compare the second row with the first." / `rain.m.wrong` "That idea doesn't fit this water. Look at the pond rows again."
- Reveal: `rain.m.reveal.reset` "It empties between rains: the second rain acted just like the first." / `rain.m.reveal.keep` "It stays full: the second rain found a full patch, so more ran to the pond."
- Hints: `rain.hint.test` "Try two rains in a row, then tap the cloud." / `rain.hint.mark` "Which idea fits? Tap its card."
- Reused: `rain.hint.check`, `rain.done`, `rain.again`, `rain.pond.0/2/4`.

No line says the soil "drinks", that the patch "knows", that a real garden does either, or anything about drainage, flooding or how long real ground stays wet; "empties", "stays full" and "ran to the pond" are the toy's words.

### Rule tests, level 8 (`logic.test.ts`)

1. **Outcome table:** the six plans under both rules give the table's ponds exactly, and each rain has `units` steps with each unit once.
2. **Conservation:** for every plan and rule, after every step `units + stored at start = stored + pond`; every stored and pond amount is even.
3. **Only the second row decides:** for every plan the first pond row is equal under both rules; every two-rain plan has different second rows, and every one-rain plan has equal rows.
4. **Fits:** `fits` is both rules for each one-rain plan and exactly `[truth]` for each two-rain plan; the truth is always in `fits`; a deciding test exists for both truths (all four two-rain plans).
5. **Judge:** over every plan, truth and `marks` subset: `ok` iff `marks` equals `fits`; `over` only on a one-rain run with one card lit; `under` only with both lit on a two-rain run; `wrong` only with the non-fitting card alone; the empty marks never reach `judge`.
6. **Reveal and finish:** `canFinish` is true only after an `ok` Check on a two-rain run; an `ok` one-rain Check never finishes; the cover lifts exactly then.
7. **Fresh every run:** a run's evidence equals a fresh `runPlan` whatever ran before; a second run with the same plan gives the same ponds; `setSlot` never changes evidence, marks or `truth`; slot clearing compacts as specified.
8. **Marks and predictions:** `toggleMark` changes only `marks`, works before any run, and a Check needs a run; a mark made before a run is not counted anywhere.
9. **Accounting:** a failed Check counts one miss, the same marks on the same run count none, a new run or new marks count again; a supported both-fit Check counts none; `ghosts` appear from the second miss and count one hint once; a bounded search over every action sequence ends with `misses` equal to the number of distinct failed Checks; from any state at most four `mystNext` steps finish.
10. **Narration and lines:** each rain's narration is exactly one `rain.pond.*` clip matching its pond; every new line id exists in `voice.ts` and every clip id used exists.
11. **Seeding:** the authored round is `keep`, the frog, a big rain; seeded rounds draw the truth uniformly, a friend from `FRIENDS`, and a one-rain start.
12. **Layout:** level 8 at the eight views, as measured against the layout rules.

### Code the builder must widen

Level 8 is not a `RouteBoard` and has no sockets, so it gets its own `MysteryState`, `runPlan`, `fits`, `judge` and `mystNext` in `logic.ts` and its own scene in `route.ts` or a sibling file, rather than level 4's Check state. `runShower` (levels 1–3) is reused; `runRoute` is not. `routeLayout` gains a `mystery` branch (slots, cards, tray, null on other levels) and its layout test extends to level 8. The tray needs two row badges for two rain sizes (level 6's badges show first and second rain, not size). `planFor` and `LEVELS` stop at 7: `PLANS` gains "A hidden patch: pick a test and decide which idea the water fits, or that both still do", and `LEVELS` school becomes `{ min: 3, max: 8 }`. The browser fixture's upright switch (`FROM_LEVEL` 5 or more) already covers 8.

### Ghost finger, how-to card and registration, level 8

- **Ghost finger** on the authored round: tap slot 1 twice (a big rain), tap the cloud (pond 2), tap both cards, tap the check (the supported "both fit", no reveal), tap slot 2 twice, tap the cloud (the second row is 4), tap the `reset` card to unlight it, tap the check (the cover lifts), tap the leaf. `fingerdemo` at level 8 must end on the leaf.
- **How-to card**, `{ from: 8, to: 8 }` steps: "Tap a slot to pick a small or big rain, then tap the cloud. The patch is covered, so watch the pond."; "Light every idea card that still fits the water you saw, then tap the check."; "One rain can look the same either way. Two rains in a row can tell the ideas apart." Finish: "Tap the leaf when the cover lifts." Note: "A pretend model: soil holds two drops, and the hidden rule is empties between rains or stays full. The check looks at the water in the pond now. Real ground drains slowly and dries over time; this is only two simple ideas. A wrong check counts one miss and Show me counts as help." The builder keeps the card under the how-to test's 840-character cap, shortening the note before any step.
- **Bands:** school 3–8 (no grown-up band: [decision](#level-8-decisions)). Tinker Lab, unchanged; no new game, so no lands change.
- **Co-play:** one person picks the test and says what each idea would show; the other lights the cards; then swap and check together.

### Level 8 check tier

New-interaction tier, one build session: typecheck and the rule tests above (plus the how-to, voice and layout tests); one scripted play of the `raingarden` browser case filtered to level 8 on an upright phone (`FROM_LEVEL=8`): a one-rain test with one card lit and the check (`over`, assert `misses` 1), the other card lit and the check (a second miss, assert the ghost rows and `hints` 1), a supported both-lit Check on the one-rain run (assert no miss added and no leaf), a two-rain test, a `wrong` or `under` Check once, then the correct card and the reveal and leaf, asserting `misses` and `hints` as counted. One upright phone screenshot after the cover lifts. `fingerdemo` at level 8. `npm run build` and the offline check, because voice lines and their clips are added. Levels 1–7's passing evidence is reused.

Device and person checks stay parked: whether a school child or a grown-up reads the covered patch, the two rows and the ghost dots as "test, then compare", and whether the idea cards' names are clear in phone speech.

### Level 8 decisions

None waits on the developer. Defaults this definition sets:

- **Two rules, one patch, thin variety on purpose:** the ladder's level 8 is two toy rules and a choice of test. A larger pool of mystery rules waits for the ladder's "observe older-family appeal before a larger pool"; the per-round variety here is the hidden truth, the friend and the starting plan.
- **A third rule (slow drain) is left out:** it would give odd drop counts, break the "every amount is even" invariant of levels 1–7 and start modelling drying, which Drop's Journey owns.
- **The capacity is known and fixed at two:** an unknown capacity would make the same trace fit `keep` with a bigger bed, so "both still fit" would depend on a number she cannot see. The grown-ups' note names the invented number.
- **Evidence is the latest run, shown on screen:** judging an earlier, no longer visible run would be a hidden rule about the Check. If she runs a one-rain test after finding the answer, the Check treats it as the one-rain evidence it is.
- **"Both fit" is right but does not finish the round:** the study allows it as a valid answer and forbids a forced guess; it does not promise a sticker for a test that cannot decide. She is never forced to guess: Show me runs the deciding test, one worked step, and a supported finish is always available. If playtest shows the missing leaf feels like a wall, the change is one line in `canFinish`.
- **Ghost rows live on the cards:** the board has no room for four tray rows; the card face carries each rule's predicted rows in a second mark shape so the comparison does not depend on colour.
- **No grown-up band yet:** the ladder's "grown-up 7–8" window waits for a grown-up band decision, as at level 7; level 8 joins the school window.
- **Source:** the [USGS runoff page](https://www.usgs.gov/water-science-school/science/runoff-surface-and-overland-water-runoff) recorded at level 4 and the [EPA green-infrastructure guide](https://www.epa.gov/green-infrastructure/types-green-infrastructure) support only the direction that wetter ground keeps less of the next rain; neither says ground empties between rains, which is why the card says this is two simple ideas and calls "empties between rains" a pretend rule. The building session reopens them and records the check in its verification entry, as decision 2 of the study asks.
