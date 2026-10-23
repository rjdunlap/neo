# Sand Table, levels 1–3: dry play (definition)

Defined 2026-10-22 as slice **E1** of the [earth-materials study](../deep-dives/subjects/earth-materials.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/earth-materials.md#first-games-proposed-ladder-sand-table), its [small dry model](../deep-dives/subjects/earth-materials.md#a-small-inspectable-dry-model), its [overlap table](../deep-dives/subjects/earth-materials.md#on-the-island-today) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#earth-materials-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-10-23 (E2; levels 1–3 on the defaults below, except the home land: Rainbow Meadow, see open decision 2).** Original status: ready to build with no review gate. These three rungs make no geology claim: the grains follow an invented toy rule, and the how-to card says so. The study's geology/model reviewer is needed before the sediment rungs (E3 onward), and its practical reviewer before any real sand, soil or field card; neither blocks E2. Every open call has a default ([open decisions](#open-decisions)).

**Fun action and purpose:** a warm tray of dry sand sits under a bucket. She taps the tray, and a short shower of grains pours down, lands and slides into a heap. She taps a scoop paddle and a scoopful lifts back into the bucket, and the heap slumps. The landscape stays as she left it, so the next tap builds on what is there. The learning is **early spatial cause and effect**: where I pour is where it grows, a tall heap spreads at its sides, taking some away lowers it, and the sand never disappears (it is in the bucket, the tray or the spill pail). Rung 3 adds deliberately shaping a landscape to show.

## Identity and overlap

- **Fill and Dump** (Counting Cove, lap–preschool) owns filling and tipping a container of discrete, countable pieces, and measured pouring. **Overlap test, applied to every rung here:** the thing she changes is the *shape of a surface that stays*, not how full a container is. Nothing here is counted, filled to a line or emptied as a goal. A rung that only fills the bucket back up, or counts scoops, belongs to Fill and Dump and is dropped.
- **IDEAS row "Sand Table"** (the falling-sand seed: sand, water, seeds and sun). This packet narrows it to **dry grains only**. Water, seeds and sprouting stay later scope, defined separately: water routing belongs to the proposed Rain Garden, and growth to Garden Grow. Nothing is discarded.
- **Splish Splash** keeps scrubbing to reveal, and **Fossil Dig** (built 2026-10-21) its brushing and recording. Nothing is buried or uncovered here.
- **Mole Mine** (proposal) keeps digging with falling-rock rules. Sand Table makes no puzzle of falling.
- **Block Garden** and **Block Tower** keep stacking rigid pieces. A grain is never placed, picked up or dragged one by one.

## The model

An invented two-dimensional toy, held in `logic.ts` and fully deterministic. It is not a measured angle of repose, and nothing says it is.

- **The tray** has **12 columns** between two walls. Each column holds a height from 0 to its **rim of 6** grains.
- **Tokens:** every round has **48 grains**, each always in exactly one of three places: the **bucket** (the hopper), the **tray** (the columns) or the **spill pail**. `bucket + sum(heights) + pail = 48` after every action.
- **Adding one grain to column c:** `h[c] += 1`, then **settle**, then **spill**, repeating settle and spill until neither changes anything.
  - **Settle:** scan the adjacent pairs `(i, i+1)` from left to right. If `h[i] − h[i+1] ≥ 2`, move one grain from `i` to `i+1`. If `h[i+1] − h[i] ≥ 2`, move one from `i+1` to `i`. Repeat whole passes until a pass moves nothing. The walls stop sideways movement, so nothing leaves the tray at its ends.
  - **Spill:** any column above the rim of 6 sends its extra grains over the rim into the spill pail. After settling, this can only happen where the neighbours are already at the rim, so a heap pressed against a full one spills, and a lone peak slides down its sides instead.
- **A pour** is a batch of **three grains**, added one at a time to the bay's pour columns (below), each fully settled before the next. If the bucket runs out partway, the batch stops there.
- **A scoop** takes up to **three grains** from the bay, one at a time. Each grain comes off the bay's tallest column (ties: the leftmost) and goes back to the bucket, settling after each. A bay whose columns are all 0 yields nothing.
- **The pail:** a tap on it pours every grain it holds back into the bucket. It shows only while it holds grains.
- **Termination:** a settle move from height `h` to `l` (`h − l ≥ 2`) changes the sum of squared heights by `−2(h − l − 1) ≤ −2`. The sum is a non-negative integer, so settling must stop. A spill removes a grain from the tray, and there are only 48. A quick simulation of this rule (12 columns, rim 6, 48 grains) moved at most 12 grains in one batch's settling, so a batch's animation stays short.
- **No queue:** a tap resolves the model **at once**. The view then animates from the old picture to the new one, retargeting if another tap lands mid-animation. Every tap therefore changes the model and shows its own touch-down response. No touch is ever silently ignored, and nothing waits.
- **Overflow is reachable:** the same simulation, pouring only into one side bay at level 3 from the flat start, filled three columns to the rim and spilled its first grain into the pail on the ninth batch.

### Bays and starting trays

| Level | Bays (columns) | Pour columns for a batch | Scoop paddles | Starting tray (sum) | Bucket |
| --- | --- | --- | --- | --- | --- |
| 1 | one bay, the whole tray (0–11) | 5, 6, 5 | one, centred | flat, all 1 (12) | 36 |
| 2 | left 0–5, right 6–11 | left 2, 3, 2; right 8, 9, 8 | one under each bay | flat, all 1 (12) | 36 |
| 3 | left 0–3, middle 4–7, right 8–11 | `4b+1, 4b+2, 4b+1` for bay `b` | one under each bay | seeded from four authored trays (below) | 48 − tray |

The level-3 authored trays, each with every neighbour within one: **flat** `1×12` (12); **left rise** `3,3,2,2,1,1,1,1,1,1,1,1` (18); **right rise**, its mirror (18); **little dip** `2,2,2,1,1,0,0,1,1,2,2,2` (16). The seeded RNG chooses the start and the tray's decorated rim (shells, pebbles or a driftwood edge). It never changes the rule.

## Screen and controls

- **Landscape (1024×768 design area):** a beach table. The **bucket** hangs top-centre over the tray, as decoration with a visible fill level (not a target). The **tray** is about 860 wide and 6 grain rows tall (about 60 units a row), centred, its top near y 200. Under the tray, one **scoop paddle** per bay (about 180×110, centred under its bay). The **spill pail** (130×130) and the **flag** button (130×130) sit bottom-right. The pet keeps the bottom-left corner.
- **Portrait:** the tray spans `view.w − 80` and keeps its height. The paddles stay in a row under their bays, and the pail and flag move to a row below them, right-aligned. Nothing shrinks.
- **`sandLayout(view, bays)`** returns every rectangle. A test asserts, at the four views (landscape and portrait, iPad and phone) and for one to three bays:
  - every target (each bay's tap area, each paddle, the pail and the flag) is at least 100 units each way;
  - targets are at least 24 apart and inside `view`;
  - the pet's corner and the home button are clear;
  - each paddle lies under its own bay's columns.
- **Pouring:** a tap anywhere on a bay pours a batch into it; at level 1, anywhere on the tray. On touch-down the bucket tips toward that bay with a soft *shh*, the grains fall at once, and each lands with a pentatonic pluck pitched by the height where it lands (higher heap, higher note; `src/audio/notes.ts`). A grain sliding down a side makes a fainter tick.
- **Scooping:** a tap on a paddle dips a scoop into its bay, lifts it with a soft scrape, and the grains arc back into the bucket.
- **Neutral answers, never silent:**
  - Pouring with an empty bucket tips it, and a few last specks fall but land nowhere. A hollow knock plays (not the miss *boing*), the paddles wiggle, and the pet says "The bucket is empty. Scoop some sand back!"
  - Scooping an empty bay scrapes the bare tray with a soft scrape and "Nothing to scoop here."
  - A spill tips grains over the rim into the pail with a little tinkle, and the first spill of a round says "Over the edge! It's in the pail."
- **No drags, holds, swipes, shaking or two fingers.** Every action is a tap with `onTap`. Rapid taps are welcome: each is a batch.
- **Idle invitation:** after six seconds with no touch and sand in the bucket, the middle bay sparkles once. It counts nothing (as Fill and Dump's idle wiggle).
- **The flag (finish):** hidden until her first pour or scoop that moves at least one grain, then it rises with a chime and stays. It never appears from the starting tray alone.
- **Drawing:** code-drawn Graphics with `src/art/palette.ts`. The surface is a filled sand shape smoothed through the column tops, with seeded speckles, and falling or sliding grains are small dots tweened between cells. About 72 cells need no render texture. No imported sprites or audio. Music is Bubble Beach's own, not `silenced`: she is not making music, and the landing plucks are pentatonic.
- **The pet** watches from its corner (`ctx.companion()`), cheers a first heap, repeats the instruction, and at level 3 walks the landscape.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Make a mound** | lap, toddler | Whether to pour more or scoop some away; one bay | The flag, after any change |
| 2 | **Two little hills** | toddler, preschool | Which side to build up or lower | The flag, after any change |
| 3 | **A landscape to show** | preschool, pre-K | Where to make it tall, flat or hilly, from a seeded start and a pictured invitation | **Show:** the pet walks it, then the round finishes |

`BandLevels`: lap `{ min: 1, max: 1 }`, toddler `{ min: 1, max: 2 }`, preschool `{ min: 2, max: 3 }`, prek `{ min: 3, max: 3 }`. **IDs 4–6 are reserved** for the study's sediment rungs (4 *Where did it go?*, 5 *Same breeze, one change*, 6 *Keep a path, build a dune*), each with its own definition (E3 onward), so no saved level moves. School arrives with level 4.

`describeLevel`: 1 "Pour and scoop one sand heap", 2 "Build or lower two hills", 3 "Shape a landscape and show it".

### First rounds

- **Level 1 (flat tray):** the pet says, "Tap the sand table to pour!" She taps near the left edge, and the shower still lands in the middle: three plucks, a small bump. Four more taps make a heap that slides down its sides into a wide hill. She taps the paddle: the scoop lifts three grains and the hill slumps. The flag rises. She can keep going for as long as she likes, then tap it.
- **Level 2:** "Tap a side to pour. Tap a scoop to take some away." She pours the right side five times, then scoops the left until the left paddle scrapes bare ("Nothing to scoop here"). Nothing is wrong. The flag is up after her first tap.
- **Level 3 (left rise, invitation *two hills*):** a small picture card above the bucket shows two hills, and the pet says, "Can you make two hills?" She makes one tall hill in the middle instead and taps Show. The pet walks from the left, up and over the top and down, and says "What a tall hill!" The round finishes. The invitation is a suggestion only: it is never checked, and any landscape is a finished one.

### What the pet says at Show

`describeLandscape(heights)` picks one line, taking the first that holds:

1. **flat**, when the highest and lowest columns differ by at most one: "Nice and flat, a sandy road!"
2. **hills**, when two or more peaks are separated by a column lower than both: "Up one hill and down, and up another!"
3. **tall**, when the highest column is 5 or more: "What a tall hill!"
4. **bumpy**, otherwise: "Bumpy, bumpy, what a fun walk!"

Every tray gets a kind line, and none of them is praise for matching the invitation.

## Accounting, help and finishing

- **There are no wrong actions at any rung.** Every round finishes with `ctx.finish({ misses: 0, hints: 0 })`. Pouring anywhere, scooping anywhere, emptying the bucket, spilling into the pail, ignoring the invitation and finishing at once are all play.
- **Show a hint** (pause sheet, `Scene.pauseActions`) plays the ghost finger through one useful action and **counts nothing**: a pour into the bay with the lowest column, or, with the bucket empty, a scoop from the tallest bay (or the pail if it holds the sand). The demonstration is real: the grains it pours stay.
- **Start again** (pause sheet) restores the round's seeded starting tray and full bucket instantly. This is the study's "Return all".
- **Finish:**
  - At levels 1–2, the flag plays a short pentatonic rise while the sand sparkles, then `ctx.finish` once.
  - At level 3 it is the **Show** flag: the pet walks the surface left to right along the column tops (each column's top as a stepping point, at an easy walk), says its `describeLandscape` line, then `ctx.finish` once.
  - One ordinary sticker. Nothing is kept: no saved sandbox, no creation slot, no journal entry ([decision 5](#open-decisions)).
- **Adaptation (the study's creative-mode question):** default, the ordinary shell rule. A 0/0 round is smooth (`isSmooth` in `src/progress/difficulty.ts`), so two finished rounds at a level climb her one level within her band's range. This follows existing creative play: Stamp Studio's levels 1–6 and Feelings Faces' calm ending also finish 0/0. It is acceptable here because each rung is a complete toy with one more bay and a starting shape, never a harder test, and the band range clamps it (lap stays at 1). The grown-ups' card says finishing is not mastery. The alternative is a module flag that records a round without adapting, a shell change for its own slice ([decision 1](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Conservation and bounds,** over 2,000 seeded sequences of 60 random actions (pour into any bay, scoop any paddle, tap the pail, Start again) at each level:
  - `bucket + tray + pail = 48` after every action;
  - every height stays within 0–6;
  - after every action, neighbouring columns differ by at most one;
  - the bucket and pail are never negative.
- **Termination:** each settle finishes within the sum-of-squares bound, and in practice within about a dozen moves for one batch (the test asserts the bound and logs the worst case).
- **Determinism:** the same seed and the same actions give the same tray, bucket and pail, and the same animation event list.
- **Pours and scoops:**
  - a pour lands in its bay's pour columns;
  - a scoop takes from the bay's tallest column (leftmost on a tie) and never from another bay;
  - pouring from an empty bucket, and scooping an empty bay, change nothing and return `empty`;
  - a partial batch stops when the bucket empties.
- **Spill:** the scripted side-bay sequence at level 3 reaches the pail, and a pail tap returns every spilled grain to the bucket.
- **Recoverable:** from any reached state, at most three pail taps and twenty scoops leave the bucket able to pour again. Start again restores the seeded start exactly.
- **Starts:** each authored tray has neighbours within one and sums as listed, with the bucket holding the rest of the 48. Each level's seed chooses only among its own starts.
- **Show lines:** `describeLandscape` returns each of its four kinds for a known tray, and some kind for every reachable tray.
- **Flag:** it is not shown at the start; it shows after the first action that moved a grain, and stays shown after Start again.
- **Layout:** `sandLayout` at the four views for one to three bays (sizes, gaps, the pet's corner and the home button, inside `view`, paddles under their bays).
- **Registry, lands and how-to tests** pass with the new game, its land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` plays a short round that ends with a visible change, then the flag. The same bot drives the scripted play.
  - Level 1: four pours, one scoop, the flag.
  - Level 2: three pours on the left, one on the right, one scoop on the left, the flag.
  - Level 3: follows the invitation, then Show. For *tall*, five pours in the middle. For *two hills*, three on the left and three on the right. For *flat*, scoops from the highest bay until the tray is within one, then pours into the lowest bay.
- **How-to card** (`src/content/howto.ts`). Goal: "Pour and scoop sand to shape a little landscape."
  - Steps:
    - "Tap the sand to pour a shower of grains" (all levels);
    - "Tap a scoop to lift some sand back into the bucket" (all levels);
    - "Tap a side to choose where the sand goes" `{ from: 2, to: 3 }`;
    - "Make it tall, flat or hilly, then tap Show and watch the pet walk it" `{ from: 3, to: 3 }`.
  - Finish: "Tap the flag whenever you like the sand" `{ from: 1, to: 2 }`; "Tap Show whenever you like the sand" `{ from: 3, to: 3 }`.
  - Notes:
    - "Nothing she does here is wrong, and finishing is not a test" (all levels);
    - "The sand follows a made-up toy rule; real sand behaves differently" (all levels);
    - "The picture is an idea to try, never a target" `{ from: 3, to: 3 }`.
- **Voice lines** under `sand.*`:
  - `intro`, `instruct.1`–`instruct.3`;
  - `invite.tall`, `invite.hills`, `invite.flat`;
  - `empty`, `nothing-here`, `spill`, `pail`;
  - `show.flat`, `show.hills`, `show.tall`, `show.bumpy`;
  - `first-heap`, `done`.

  `{pet}` is optional. Nothing is written as text to read.
- **Registration:** ID `sand-table`, name "Sand Table", spoken title `game.sand-table` ("Sand Table"). Region (subject) `tinker-lab`, the science subject, as Domino Run. Skills `['cause-and-effect', 'spatial', 'materials', 'making']`. Bands lap, toddler, preschool, prek. Home land **Rainbow Meadow** as built (planned Bubble Beach, its 10th game; [decision 2](#open-decisions)). Hub icon: a sand pail beside a little mound with a scoop in it. Sticker: a seeded little sand landscape with a shell on top.
- **Art:** code-drawn in `src/games/sand-table/art.ts`: the table, tray, bucket, paddles, pail, flag, invitation cards and rims. No imported art or audio.
- **Co-play:** the study's **maker and observer**: one taps a change, the other says (or points to) what changed, then they swap. Ordinary single-player accounting.
- **Off-screen:** none in E2. The study's paper layer picture and any real-sand idea wait for the practical reviewer.
- **Couch:** none.
- **Rework couplings:** nothing saved. A kept landscape (a creation slot or a home item) is the rework's to define.

## Check tier

E2 (levels 1–3) is the **new-game tier**:
- typecheck and unit tests (the rule properties above, plus registry, lands and how-to tests);
- one scripted play through a new `browser-check.mjs` case, with its README row as part of the build. At level 1, a pour, a scoop and the flag. At level 3, an empty-bucket pour and a spill to the pail and back, then Show a hint and Show. The case asserts misses 0 and hints 0. There is no wrong answer to script, so the case covers the neutral responses instead.
- one portrait screenshot at level 3 with three bays and the pail showing;
- `fingerdemo` at levels 1 and 3;
- `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open:
- whether a lap or toddler player connects her tap to the heap;
- whether the paddles read as "take away" without speech;
- Graphics redraw cost on an iPad during rapid taps;
- device speech of the Show lines.

Browser automation cannot establish any of these.

## Open decisions

Each has a default the build uses; none blocks E2.

1. **Creative adaptation.** Default: the ordinary rule, so two finished rounds climb one level within the band ([accounting](#accounting-help-and-finishing)). Alternative: a `GameModule` flag that records a round without moving the level. It is a shell change (`GameScene.finish`, `store.recordRound`), defined in its own slice, and would also serve Stamp Studio's invitation levels.
2. **Home land.** *Built in Rainbow Meadow:* adding the game to Bubble Beach and to Treehouse each failed those lands' `src/app/scenes/*.test.ts` decor counts; Barnyard and Rainbow Meadow passed, and Rainbow Meadow was chosen. Original default **Bubble Beach**, at 9 games today and 10 with this one. No pending definition defaults there (Domino Run and Fruit Slice, which did, are built), and it is the beach. `lands.test.ts` decides. Fallback: **Treehouse** (6 games, the making land). Tinker Lab has 12, and [Sense Detective](sense-detective.md) is pending there.
3. **Bands.** Default lap 1, toddler 1–2, preschool 2–3, pre-K 3, with school arriving with level 4. Alternative: school 3 now as a single-level range, so a school player sees it before E3–E4.
4. **Show a hint.** Default: a real demonstration action that counts nothing. Alternative: count one hint, which would stop that round from being smooth.
5. **Keeping a landscape.** Default: nothing kept, as the study says. Alternative: a creation snapshot in the treehouse, which needs a new `creations.ts` kind and belongs to a later slice.
6. **Review.** None for E2, since there is no geology claim and the card names the toy rule. The sediment rungs (E3) need the study's geology/model reviewer before their transport table is frozen.
