# Rain Garden, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [weather-and-water study](../deep-dives/subjects/weather-water.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/weather-water.md#a-first-games-ladder-rain-garden) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#weather-and-water-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: build waits on the developer (`decision`).** The [collected decision](../WAITING-ON-DEVELOPER.md) lists a new-game registration for this subject as unapproved, and study decision 1 asks the developer to confirm the comparison action, band windows and land before registration. The packet below gives a default for every one of those, so the build (the study's slices 2–3) can start the day they are confirmed. A science reader for the spoken explanation is recommended before implementation ([decision 2](#open-decisions)); it is not a gate on this screen-only toy, and it is required before any realistic claim (soaking rates, wet ground, the water cycle).

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

**Level 4** (the study's slice 4): a two-socket downhill route where the lower bed must store 2 and the pond get at least 1, with a real Check, a causal miss and every valid arrangement accepted; define it after levels 1–3 are built. **Drop's Journey**'s first route is now eligible for its own docs-only definition (the study's slice 8), independent of this build.

## Open decisions

Each has a default the build uses; decision 1 is the developer's confirmation the registration waits on.

1. **Register Rain Garden as a new game, with these bands and land.** Default: yes, as above (toddler 1, preschool 1–2, pre-K 2–3, school 3), home Tinker Lab. Alternative: fold the comparison into a future Water Paths if the developer prefers fewer water games; the overlap section says why it is distinct.
2. **Science reader.** Default: the build proceeds with the explanation lines above as a toy model, labelled as such on the grown-ups' card; a reader (not yet named) checks those lines before release and must approve anything about real soaking, wet ground or the water cycle.
3. **Level 1's ending.** Default: a deliberate leaf tap, with the comfort nudge after three rains. Alternative: the round finishes by itself after the third rain, if watching shows toddlers rarely tap the leaf.
4. **Surfaces.** Default: stone and soil only. Alternative: a third surface (grass, capacity 1) at level 3 for more seeded variety, after the science reader's note on ordering grass between stone and garden bed.
5. **Home land.** Default Tinker Lab (full at 14 games since 2026-10-24: Gear Garden went to Painted Canyon for that reason), fallback Rainbow Meadow; `lands.test.ts` decides between them at every band and view.

**Decided 2026-10-23 (on the developer's delegation):** every default stands: register Rain Garden as a new game (toddler 1, preschool 1–2, pre-K 2–3, school 3; Tinker Lab, fallback Rainbow Meadow), and decision 2's science reader is the building session's source check against EPA/NOAA, recorded in its verification entry.
