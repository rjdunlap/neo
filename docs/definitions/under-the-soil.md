# Garden Grow levels 14–15: Under the Soil (definition)

Defined 2026-11-26 on `claude/define-under-the-soil` as step 5 of the [life-science study](../deep-dives/subjects/life-science.md) ("Define Under the Soil in Garden Grow"), with the [ecosystems study](../deep-dives/subjects/ecosystems.md)'s F5 *Leaf Litter Window* absorbed as the second window, as the [Garden Grow dive's 2026-10-23 decision](../deep-dives/garden-grow.md#decisions-for-the-developer) asks. Status: defined, not built. It is built **after** [Growing Conditions](growing-conditions.md) (levels 12–13), whose `growthHeight` table and two-bed screen it reuses.

**What it adds:** two appended levels of `garden-grow` (`src/games/garden-grow/`). Level 14 *Lift the soil* is an unjudged look inside the ground: lift a pictured window in a bed, see the **roots below and the shoot above** on the same plant, tap each part, let rain grow both together, then choose a second window under a leaf and watch it crumble in three pictured steps. Level 15 *Above and below* puts Growing Conditions' two matched beds under that window: she lifts both, reads one ruler above the soil and one below, and answers "which bed has the **longer roots**?" or "which has the **taller shoot**?"

**Learning goal:** a plant has two parts that grow together, the shoot we usually see and the roots we usually do not; roots stay in the soil, so a window is how we see them. Level 15 ties that to the matched comparison (NGSS K-LS1-1's plant needs, 2-LS2-1's matched trials, read at a pictured level): in this toy garden the bigger plant has the longer roots too. Level 14's leaf window adds only that fallen leaves are **slowly broken down by tiny creatures in the soil**, shown as a replayable picture, never as a lesson to recite.

## Ownership and overlap

| Game or packet | Its action | Fit |
| --- | --- | --- |
| **Garden Grow** (levels 1–11) | Plant, rain, rows | **Chosen**, as the study and dive assign. The cloud, soil and the five growth stages are the whole cast; the younger flower toy is unchanged |
| **[Growing Conditions](growing-conditions.md)** (12–13) | Same seeds, one difference; the fair test | Owns the `growthHeight` table, the condition cards and the two-bed screen. Level 15 reuses them as they are; **no second table** |
| **Leaf Litter Window** (ecosystems F5) | Reveal and replay decomposer activity | Absorbed as level 14's second window. Not a separate game or ID |
| **Soil Window** (earth-materials mode) | Inspect a root/soil cutaway | Absorbed: it is the same cutaway art. No soil layers, horizons or rock/mineral naming (the earth-materials study's own limit) |
| **Rain Garden**, **Sprout Shuffle**, **Critter Sort 12–13** | Water movement; passing copies; visible likeness | Unchanged and not touched: nothing here moves water, passes anything between plants or sorts a family |
| **Life Story Lab** (proposed) | Time toy with a life cycle | The leaf window's three steps are a picture, not a clock or a life cycle: no days, no weeks, no timer |

## The model (`logic.ts`)

There is **one table**, Growing Conditions' `growthHeight(setup)` (2, 3, 4 or 5 ruler steps). Under the Soil adds one function and one fixed sequence:

- `rootDepth(setup) = growthHeight(setup)`: the root ruler below the soil line reads the **same number of steps** as the shoot ruler above it. "In this toy garden a bigger plant has longer roots too" is the only claim. It says nothing about roots seeking water, going deeper in dry soil, where roots are in a real plant of any named kind, or how many there are. The drawing is one stylised root system (a main root and a few branches whose length follows `rootDepth`), the same in every bed apart from its length.
- `LEAF_STEPS = ['whole', 'holey', 'crumbs']`: three pictured snapshots of one leaf under the soil, with a worm and a few tiny bugs in the second and third. Tap advances one step; tap on the last step returns to the first. There is **no time scale and no number** (not "days" or "weeks"; at most the spoken words "a long, long time later"). Creatures are shown only as small friendly pictures: nothing is picked up, fed or collected, and no creature is ever hurt, hungry or dead.

Every plant stays **healthy and in flower** at every height, exactly as in Growing Conditions. Soil is never called food. Nothing grows over real time or while she is away, nothing is kept between rounds, and there is no compost or garden to look after.

## Bands and ranges

Levels 14 and 15 are appended (IDs 12 and 13 are Growing Conditions'); nothing is renumbered, so saved levels and pins hold.

| Band | Now (after Growing Conditions) | After |
| --- | --- | --- |
| `lap` | `order: [8, 1, 2]` | unchanged (the lap bed stays one big bed and a cloud) |
| `toddler` | `{ min: 2, max: 4 }` | `{ min: 2, max: 4, order: [2, 3, 4, 14] }` |
| `preschool` | `{ min: 3, max: 5 }` | `{ min: 3, max: 5, order: [3, 4, 5, 14] }` |
| `prek` | `{ min: 6, max: 12, order: [6, 7, 9, 10, 11, 12] }` | `order: [6, 7, 9, 10, 11, 12, 14]` |
| `school` | `{ min: 12, max: 13 }` | `{ min: 12, max: 15, order: [12, 13, 15] }` |

Level 14 is an observation: it never counts a miss, so a smooth round steps toward it from the top of a younger ladder and nothing steps down from it; a grown-up can pin it. Level 15 is school only, after the fair test (13). The 3×4 school grid that the dive once tied to this packet is **not** proposed here (see [decision 3](#open-decisions)). The registry and lands tests, `rangeFor` and the age-place checks must run on the changed windows, and the build must check what a school player on today's fallback sees once the Growing Conditions school window exists.

## A round, step by step

Level 14 plays **two rounds** and level 15 **two rounds**; one sticker per level, as today.

### Level 14 *Lift the soil*

1. **Round 1, the root window.** One bed with a flower in it, drawn big, with a lid-shaped "window" band in the soil. The pet says "Lift the soil." (`grow.soil.lift`). Tapping the window slides it up and reveals the roots; tapping it again lowers it (free, both ways).
2. **Look and tap.** The pet says "Roots down here. Shoot up here." (`grow.soil.parts`). Tapping the roots wiggles them and says "Roots." (`grow.soil.root`); tapping the shoot sways it and says "Shoot." (`grow.soil.shoot`). The prompt "Tap the roots" is a nudge only: **any tap names the part she touched** ("That is the shoot. Roots are down here.") and is never a miss.
3. **Rain.** Tapping the cloud grows the plant one stage, shoot **and** roots together, up to five (the existing stages), with both rulers gaining a step. It replays free. The round finishes once the window has been lifted and the plant has grown once (any order of parts).
4. **Round 2, the leaf window.** A leaf lies on the soil with a second window beneath it. Tap lifts it and shows `LEAF_STEPS[0]`; each tap of the leaf advances one step and says "The leaf is whole." / "Little bugs and a worm are eating tiny holes." / "Now it is crumbs, and the soil is richer." (`grow.leaf.0` to `grow.leaf.2`; the wording is part of the content check). The round finishes once all three steps have been seen; further taps loop for free.

There is no wrong order, no wrong tap and no timer, so toddlers may skip around; the unseen-card exploration rule applies. Because nothing can be missed, `misses` and `hints` are 0 and the `finish` call carries nothing else.

### Level 15 *Above and below*

1. Two beds from the **same seed packet** side by side, as at Growing Conditions 12, with the **same condition cards** under each (exactly one pair differs). Both beds have a closed soil window. The pet asks the round's question (`grow.under.ask`), seeded between "Which bed has the longer roots?" and "Which bed has the taller shoot?"
2. **Lift both windows** (free). For the roots question she must lift **both** windows before an answer is taken: tapping a bed first says "Lift the soil to see the roots." and is not a miss.
3. **Grow.** The same cloud-sun token as 12 grows both beds at once, shoot and roots together; both end at their heights, with a ruler above the soil line and one below.
4. **Answer.** She taps the bed with the longer roots (or taller shoot). A right tap rings: "Longer roots, taller shoot. In this toy garden a bigger plant has longer roots too." (`grow.under.result`, naming the changed condition: "The bed with more sun grew more roots and more shoot."). A wrong tap is one miss: "Count the steps below: this one is 3 and that one is 4." (`grow.under.count`).
5. The next round changes the asked part, the differing condition and the taller side from the last (`avoid`).

Both beds' heights always differ (a single changed condition moves the height by 1 or 2), so there is exactly one right answer and no prediction is asked; a **guess first** touch before growing is free and recorded nowhere.

## Accounting, help and finishing

- **Level 14:** nothing is judged: 0 misses, 0 hints, `ctx.finish({ misses: 0, hints: 0 })` after the last window.
- **Level 15 misses:** a wrong bed tap at the answer step. **Free:** lifting or lowering a window, guessing first, replaying the growth, and any tap before both windows are lifted. **Hint:** the second miss glows the correct bed, counted once per round as in the other Garden Grow levels. A hinted completion still finishes and earns the sticker and is not recorded as independent success.
- **Adaptation:** the shared ladder in `src/progress/difficulty.ts` applies unchanged. Level 15 is the school ladder's top; level 14 is the top of the toddler, preschool and pre-K ladders and never steps anyone down.
- No stickers, saves or celebration from the game, no timer, no losing, no wilted or unhealthy plant, no obligation to return, and no new `SaveData` field.

## Logic (`logic.ts`)

- `rootDepth(s: Setup): number` as above; `LEAF_STEPS` and `nextLeafStep(i)` (wraps).
- `makeUnder(rng, avoid?): { kind; color; a: Setup; b: Setup; changed: 'light' | 'water'; ask: 'roots' | 'shoot' }` built on Growing Conditions' `makeCompare`, adding only `ask`; `answerUnder(round): 'a' | 'b'` returns the bed with the larger `growthHeight` (identical for `rootDepth`).
- `GARDEN_MODES` gains `'look'` and `'under'`; `PLANS` gains two entries (indexes 13 and 14: `requests` 2 each; the look plan has two windows, the under plan two rounds). `planFor` clamps as today, so nothing in 1–13 moves.

## Rule tests (`logic.test.ts`)

1. **One table.** For all four setups `rootDepth` equals `growthHeight` and takes the values 2, 3, 4, 5; no separate table exists in the module.
2. **Level 15 has one right answer.** For seeds 0–199 the two beds differ in exactly one condition, their heights differ, `answerUnder` is the taller bed for either `ask`, and `avoid` changes the asked part, the condition or the side between rounds.
3. **Both parts are asked.** Over seeds 0–199 both `ask` values occur and neither exceeds 70 % of rounds.
4. **Leaf steps.** `LEAF_STEPS` has three distinct entries, `nextLeafStep` visits each once and wraps, and none carries a number of days or a duration field.
5. **Ladder.** `rangeFor` for `toddler`, `preschool`, `prek` and `school` returns the orders above; every earlier level keeps its relative order; levels 1–13's plans and tests are unchanged; the guard that no band lists an unknown level passes.

## Screen and controls

Portrait first, as the rest of the game. Level 14 draws one bed at least 320 units wide with the soil window band at least **110 units** tall (the target after scaling), the cloud at least 120 units, and the roots and shoot each a tap target above 100 units; the pet's corner stays clear. At level 15 the two beds and condition cards are Growing Conditions' (each bed at least 220 units wide, cards at least 110), with a lift handle on each bed at least 110 units; rulers sit on either side of the soil line. Landscape places the two beds side by side as in portrait. Taps use `onTap`; the window may also be dragged up with `drag.ts`, but a tap is always enough. No part of the screen requires reading.

## Speech, how-to and ghost finger

Voice IDs in `voice.ts` under `grow.soil.*`, `grow.leaf.*` and `grow.under.*`, in plain words (*soil, roots, shoot, longer, taller, tiny bugs, a worm, crumbs*), none saying *needs*, *food*, *dies*, *hungry*, *best* or *because*. Level-scoped how-to lines in `howto.ts` for 14 and 15 (the earlier levels' lines stay scoped to their own levels, audited by the how-to test) carry the note "This is a toy garden: it shows one made-up plant, not every plant", a co-play prompt ("What do you think is under your feet?") and an off-screen activity (digging a small hole in a safe spot or a pot with a grown-up and looking at the soil and the roots of a weed or seedling, then putting it back; wash hands after). `autotouch()` at 14 lifts the window, taps the roots and shoot, taps the cloud, then taps the leaf three times; at 15 it lifts both windows, taps the token and taps the taller bed.

## Content check (before the build ships)

Per the genetics and life-science studies' 2026-10-23 decisions (no outside reviewer), the **building session checks the following against reputable sources** (museums, universities, government science agencies, established curricula) and records them in the game's page and its verification entry: (1) roots anchor a plant and take in water (a primary-grade statement); (2) a bigger plant above ground generally has more root below it, kept as a **toy** claim and not a rule; (3) the three leaf pictures and their spoken lines (a leaf is slowly broken down by worms, fungi and tiny bugs, and what it leaves enriches the soil, with no time scale). Anything the check cannot support is cut from the lines, not softened.

## Build and check tier

**Two new levels with new interactions (window lift, leaf steps) on a school window that Growing Conditions creates.** Run `npm run typecheck`, Garden Grow's rule tests plus the how-to, registry and lands tests, `node scripts/content-barrels.mjs`, one filtered scripted play of levels 14 and 15 (`BROWSER_SUITE=woods WOODS_ONLY=grow`, extended for the new levels) including one wrong answer and one hint at 15, `fingerdemo` at 14 and 15 (`FINGER_ONLY=garden-grow`), one portrait screenshot of each level, and `npm run game-docs`. `npm run build` only if shared files or art change. No world, couch, story or offline suite. Children's reading of the windows and device speech are [parked](../DEVICE-CHECKS.md).

**Expected files:** `src/games/garden-grow/{logic.ts, logic.test.ts, index.ts, voice.ts, howto.ts}` (new cutaway drawing code in a new `cutaway.ts` beside `kinds.ts`) and the browser case. At closeout: `docs/games/garden-grow.md` (via `npm run game-docs`), this packet's status line, the Garden Grow dive, the life-science and ecosystems rows, VERIFICATION and READY.

## Open decisions

Each has a default the build uses; none waits on the developer.

1. **Build order.** Default: Growing Conditions (12–13) first, then this (14–15), because 15 reuses its screen and table and the IDs are fixed by that order. Alternative: this first, which would renumber nothing but would put the observation levels before the school window exists.
2. **Windows.** Default: observation (14) for toddler, preschool and pre-K as an appended optional last level; comparison (15) for school only. Alternatives: lap gets a version of 14 (a lift-only bed) after a person watches a lap player; pre-K gets 15 as a reading-only level like 12.
3. **School 3×4 grid.** The dive tied a larger school grid to this packet. Default: **not proposed here**: the school window is the comparison levels, and a 3×4 grid stays a separate option on the dive if wanted. Nothing built waits on it.
4. **Journal and creatures.** Default: none. A journal entry for roots or the leaf's visitors waits on the rework's journal and `RoundResult.discoveries`, and no creature is collected from the leaf window.
5. **Out of scope on purpose:** compost or garden care, feeding worms, handling bugs, soil layers or types, real species, root depth that depends on water or sun, and any time scale for decomposition.
