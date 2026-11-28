# Village Planner

<!-- generated: from src/games/village-planner; edit the text below the end mark (npm run game-docs) -->

**ID:** `village-planner` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, dependency reasoning

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Two stops, one bench: 4 village jobs, one bench and one cart, 4 steps |
| 2 | Share the bench, save a trip: 5 village jobs, one bench and one cart, 5 steps |
| 3 | Six jobs, tight steps: 6 village jobs, one bench and one cart, 5 steps |

<!-- end generated -->

**Starts as:** two stops on the island, Baker's Hill and Creek Mill, a shared Bench in the Yard and one Cart. She drags (or taps, then taps a step) pictured job tiles onto a board: Bench jobs on the top row, cart jobs on the bottom row, one job per slot. A job that needs another must sit in a later step; its tile shows the needed job as a small picture. Run plan acts the plan out step by step and stops at the first job that came too soon.

**Grows into:** level 1 *Two stops, one bench* (four jobs; every working plan takes two cart trips), level 2 *Share the bench, save a trip* (five jobs; a working plan takes two or three trips) and level 3 *Six jobs, tight steps* (six jobs in five steps; two to four trips). `school` plays levels 1–2 and `grownup` 1–3. A plan that works always finishes the round; when it took more trips than the fewest, a Trace Card shows the trip order beside **Done** and **Try fewer trips**.

## Design notes

- **Definition:** [village-planner](../definitions/village-planner.md), slice 4 of the [routines and self-care study](../deep-dives/subjects/routines-self-care.md#build-slices-in-order). Rules are in `logic.ts` (a handwritten backtracking `solve`, no library); the tests enumerate every plan and match the definition's counts exactly (12; 50 with 36 at two trips and 14 at three; 32 with 3, 15 and 14).
- **Misses and hints.** Only Run plan on a complete board that fails a prerequisite is a miss, once per distinct board (running the same failing board again replays the explanation free). A wrong-row drop, a full slot, Run plan with jobs still waiting, Undo, Clear, Try fewer trips and tapping a tile for its name never count. Hint is counted when it names a placement or a job to send back; "this plan works" is free. Every second counted miss shows a hint by itself. Following hints from sampled boards (empty, partly placed, jammed) always reaches a plan that runs within `2 × jobs + 1` steps.
- **Input.** Tiles use `draggable` with `tapToPlace`, so a drag and tap-then-tap both work; dropping a tile over the tray's paper returns it. The ghost finger drags each job into the fewest-trips plan and taps Run plan.
- **Seeded variety.** `ctx.rng` shuffles only the tray's starting order; the dependency graph and the plan counts never change.
- **Shape and picture cues.** Bench tiles are square-cornered with a bench-and-hammer emblem, Hill tiles have a peak emblem and Creek Mill tiles a waterwheel; colour (yellow, green, blue) is a second cue.
- **Layout.** Upright and sideways targets are all at least 100 units (slots 108, tiles 104, buttons 100); `upright.test.ts` checks the five upright views and sideways.
- **Not here:** no real clock or calendar, no timer, no score penalty, no saved schedule, nothing withheld for using more trips.
- **Phone check.** `VILLAGE_PLANNER_PHONE=1 BROWSER_SUITE=villageplanner` plays the suite in a touch phone context.
