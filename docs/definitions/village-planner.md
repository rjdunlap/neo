# Village Planner, levels 1–3 (definition)

Defined 2026-11-27 as slice **4** of the [routines and self-care study](../deep-dives/subjects/routines-self-care.md#build-slices-in-order) ([recommendations packet](../deep-dives/subjects/RECOMMENDATIONS.md#routines-and-self-care-recommendations), [PR #2295](https://github.com/rjdunlap/neo/pull/2295), branch `agy/docs-village-planner`). Docs only: no code, no registration, no save field. Under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) and the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games), fictional island errand planning proceeds without a separate person or capacity gate. Game id `village-planner`; grown-up name *Village Planner*; spoken title "Village Planner".

**Fun action and purpose.** Two island stops—**Baker's Hill** and **Creek Mill**—each need errands done, and your **Yard** holds one shared **Workbench**. One **Cart** carries you between the Yard, the Hill and the Mill. You place pictured job tiles onto a step-by-step planning board (a **Bench** row and a **Cart** row) so every job runs in prerequisite order without putting two jobs on the same Bench or sending the Cart to two places in one step. Then tap **Run plan** to watch the Bench worker and the Cart act it out step by step: if a prerequisite is not ready yet, the Cart halts right at that step and shows why; when every job finishes cleanly, any feasible plan completes the round, and an optional comparison shows when another legal order takes fewer Cart trips. The learning is dependency ordering and shared-resource constraint planning: separating necessary prerequisites from free order choices, spotting resource bottlenecks, and revising a schedule from a trace.

## Identity, overlap and placement

- **Ready for Adventure** (`ready-for-adventure`) is a child-facing parade-prop assembly game (`toddler`–`school`, Cozy Village): attach a part and pack props in a bag, with one workbench conflict at level 5. Village Planner is an older-family schedule puzzle across two destinations, one cart and one bench, with multi-step parallel slots, counted cart journeys and an optional fewer-journeys comparison.
- **Harbor Orders** (`harbor-orders`, Lantern Lake) counts how many mornings each workshop spends on each good; morning order never matters. Here **order is the puzzle**: prerequisites and back-to-back destination stops determine both feasibility and journey count.
- **Maker Lane** (`maker-lane`) carries one bundle through a fixed chain of stalls, **Helper House** (`helper-house`) sequences robot rule cards, and **Day by Day** (`day-by-day`) keeps pretend-week weather counts.
- **Not here:** no real clock, hours or calendar; no household chore chart or real hygiene/care routine; no timer, countdown or score penalty; no saved schedule between rounds; and no minimum-journey gate that withholds completion.
- **Placement and bands.** Home land **`lantern-lake`** (`src/content/lands.ts`, appended after `two-tablets`); learning region **`cozy-village`** (`RegionId`); `challenge: 'logic'`; `skills: ['planning', 'dependency reasoning']`; `upright: true`. Bands: **`school`** levels 1–2 (`rangeFor` min 1, max 2) and **`grownup`** levels 1–3 (min 1, max 3). `Lantern Lake` [pages rather than shrinks](location-capacity.md), and a grown-up puzzle whose simpler levels open to `school` keeps `lantern-lake` as its home (`Wonder Woods` lists it by subject). Because `school` plays levels 1–2, every board cell and control keeps **≥ 100 logical units** on screen (exceeding both the child 100-unit rule and the grown-up 64-unit minimum).

## The model (`logic.ts`)

- **Resources and places.** Every job has `place: 'bench' | 'hill' | 'mill'` and `requires: readonly JobId[]` (an acyclic DAG).
  - `'bench'` jobs run on the **Bench** row at the Yard.
  - `'hill'` (**Baker's Hill**) and `'mill'` (**Creek Mill**) jobs run on the **Cart** row.
- **Board.** A fixed number of step columns `maxSteps` (4 at level 1; 5 at levels 2–3). Each step `t` (`0 .. maxSteps - 1`) holds at most **one** `'bench'` job in the Bench slot and at most **one** `'hill'` or `'mill'` job in the Cart slot. Every job in the level appears **at most once** on the board; unplaced jobs wait in the tray.
- **Feasibility.** A complete board (all jobs placed) is **feasible** when for every job `j` and every prerequisite `p` in `j.requires`, `step(p) < step(j)` (strictly earlier step: a prerequisite finished in step `t` is ready at step `t + 1`). Resource-capacity rules (at most 1 Bench job per step, at most 1 Cart job per step, and `'bench'` vs `'hill'|'mill'` row matching) are structural invariants of the slots.
- **Cart journeys (`countJourneys`).** The Cart begins at the `'yard'`. Scanning steps `0 .. maxSteps - 1` in order, ignore steps whose Cart slot is empty (`null`: the Cart stays parked at its current location while the Bench runs). Whenever a step's Cart job is at a place `p !== currentPlace`, increment `journeys` by 1 and set `currentPlace = p`. Doing two `'hill'` jobs consecutively (even with a Bench-only step between them) stays at `'hill'` and costs 0 extra trips; alternating `'hill' -> 'mill' -> 'hill'` costs 3 trips.
- **Solver (`solve(puzzle, partial)`).** Deterministic backtracking search over the level's small job set (4–6 jobs, `maxSteps <= 5`), returning all feasible completions extending `partial` (or `[]` if `partial` already violates a prerequisite or blocks every completion), ordered by fewest Cart journeys first, then fewest used steps.

## Levels (exhaustive counts verified)

Every case below is an authored acyclic DAG whose exact feasible-schedule counts were verified by exhaustive enumeration in Node when writing this definition:

| Level | Name | Jobs (`place` · `requires`) | `maxSteps` | Verified feasible plans | Journey distribution |
| --- | --- | --- | --- | --- | --- |
| **1** | *Two stops, one bench* | `mill` (`mill` · `—`), `dough` (`bench` · `mill`), `bake` (`hill` · `dough`), `crates` (`bench` · `—`) | 4 | **12** feasible plans | All 12 use **2** trips (min steps: 3) |
| **2** | *Share the bench, save a trip* | `cut` (`hill` · `—`), `wheel` (`bench` · `cut`), `grind` (`mill` · `—`), `mix` (`bench` · `grind`), `loaf` (`hill` · `mix`) | 5 | **50** feasible plans | **36** use **2** trips; **14** use **3** trips (min steps: 3) |
| **3** | *Six jobs, tight steps* | `wood` (`hill` · `—`), `frame` (`bench` · `wood`), `grain` (`mill` · `—`), `flour` (`bench` · `grain`), `oil` (`mill` · `—`), `oven` (`hill` · `frame, flour`) | 5 | **32** feasible plans | **3** use **2** trips; **15** use **3** trips; **14** use **4** trips (min steps: 4) |

**Reference plans (verified):**
- **Level 1 (2 trips, 3 steps):** Step 1: Bench `crates`, Cart `mill` (Mill); Step 2: Bench `dough`; Step 3: Cart `bake` (Hill).
- **Level 2 (3 trips, naive Hill-first):** Step 1: Cart `cut` (Hill); Step 2: Bench `wheel`, Cart `grind` (Mill); Step 3: Bench `mix`; Step 4: Cart `loaf` (Hill).
- **Level 2 (2 trips, 3 steps):** Step 1: Cart `grind` (Mill); Step 2: Bench `mix`, Cart `cut` (Hill); Step 3: Bench `wheel`, Cart `loaf` (Hill).
- **Level 3 (2 trips, 5 steps):** Step 1: Cart `grain` (Mill); Step 2: Bench `flour`, Cart `oil` (Mill); Step 3: Cart `wood` (Hill); Step 4: Bench `frame`; Step 5: Cart `oven` (Hill).

**Seeded variation.** `ctx.rng` swaps the visual pairing/palette accents or initial tray order of independent jobs without altering the dependency graph or journey counts, so every round at a level keeps the exact proved schedule counts.

## Screen, controls and replay

- **Upright phone first (`768 × 1024` upright area, `390 × 844` phone with caption and guide)** and **landscape (`1024 × 768`)**:
  - Top: compact **Goal & Prerequisite strip** showing the job icons with small directional arrows (`Mill -> Dough -> Bake`) and a live **Cart trips** counter badge.
  - Center: the **Planning Grid** with a left resource-label column (120 units wide: **Bench** icon on top row, **Cart** icon on bottom row) and `maxSteps` columns (4 columns of `116 × 116` at level 1; 5 columns of `108 × 108` at levels 2–3, fitting `120 + 5 × 108 = 660 <= 768` with wide margins). Every slot is **≥ 108 × 108** logical units.
  - Bottom: the **Job Tray** (remaining unplaced tiles, each ≥ 104 × 104) and the action row (**Undo**, **Clear**, **Hint**, **Run plan**), all placed above the caption band and clear of the lower-left pet guide.
- **Shape and icon cues (never colour alone).** Bench jobs carry a hammer-bench corner badge and square frame; Hill jobs carry a peak-and-roof emblem; Mill jobs carry a waterwheel emblem. Prerequisite links draw directional arrows on tap/selection and during replay. Colours come from `src/art/palette.ts`.
- **Interactions (`onTap` and `src/engine/drag.ts`).** Both tap-select/tap-place and drag-to-slot work identically:
  - Dragging or tapping a job into a matching empty slot places it immediately with a soft pentatonic chime.
  - Dropping a Bench job onto the Cart row (or vice versa) gently bounces it back to its previous place and speaks *"That job uses the cart."* / *"That job needs the bench."* (0 misses).
  - Dropping onto an **already occupied** slot gently shakes both tiles, plays the soft boing, and explains the resource conflict without replacing or counting a miss (*"One job on the bench at a time."* / *"The cart visits one place per step."*). Tapping a placed tile returns it to the tray (or selects it to move to another empty slot).
  - **Free edits:** placing, moving, removing, Undo, Clear, and tapping any job tile to hear its name and prerequisites are all free.
- **Run plan & conflict trace.**
  - Pressing **Run plan** before all jobs are placed speaks *"Place all the jobs first."* (0 misses) and pulses the remaining tray tiles.
  - When all jobs are placed, **Run plan** locks edits briefly and animates the schedule step `0 .. maxSteps - 1` (about 0.45 s per step, skippable/interruptible by Back):
    - **Prerequisite conflict:** as soon as step `t` reaches a job `j` whose prerequisite `p` is at `step(p) >= t`, the animation pauses at step `t`, highlights `j` and `p` with a red wobble link, plays the gentle boing, and speaks: *"Wait! [Job] needs [Prereq] done first."* The board stays editable so she fixes it directly.
    - **Feasible finish:** every job checks off on pentatonic steps while the Cart drives from stop to stop and increments the **Cart trips** counter (`1`, `2`, `3`).
- **All-feasible ending & optional fewer-journeys comparison.**
  - If the feasible plan already matches the level's minimum trips (every Level 1 plan, or a 2-trip plan at Levels 2–3), the round finishes immediately via `ctx.finish({ misses, hints })` (*"Great plan! Two cart trips."*).
  - If the feasible plan uses **more than the minimum trips** (e.g., 3 trips at Level 2 or 3–4 trips at Level 3), an in-round **Trace Card** appears over the tray area showing the completed trip sequence (e.g., *Hill -> Mill -> Hill · 3 trips*) beside *"Done in 3 trips — a 2-trip plan also works!"* with two ≥ 100-unit buttons:
    - **Done** (primary green check): finishes the round immediately via `ctx.finish({ misses, hints })` and awards the sticker. Completion is **never withheld**.
    - **Try fewer trips** (optional secondary button): closes the Trace Card and keeps the current plan on the board so she can rearrange for fewer trips with 0 misses and 0 penalty; she can also press **Done** on the next run or use a **Finish now** action once a feasible plan has run.

## Accounting, hints and rule tests

- **Misses (`src/progress/coach.ts`).** Only pressing **Run plan** with a **complete board that fails a prerequisite** counts a miss (**1 miss per distinct failing board**, so pressing **Run plan** again without changing the board replays the conflict explanation free). Row-mismatch drops, occupied-slot nudges, incomplete **Run plan** taps, Undo, Clear, and exploring **Try fewer trips** after a feasible run **never** count a miss.
- **Hints (`hint(puzzle, placed)`).** Triggered manually via **Hint** or automatically after **two counted misses** in a round:
  1. If `solve(puzzle, placed)` is non-empty:
     - If all jobs are placed, glow **Run plan** and say *"This plan works! Tap Run plan."* (free, 0 hints counted).
     - Otherwise pick the first feasible completion in `solve(puzzle, placed)` (minimum journeys first), highlight the earliest-step unplaced job `j` and its target slot, and say *"Put [Job] in Step [t + 1]."* (1 hint counted per new suggestion).
  2. If `solve(puzzle, placed)` is empty (placed tiles already block every completion): find a minimal subset of conflicting placed jobs whose removal yields a non-empty `solve`, highlight the first such placed job to return to the tray or move earlier, and say *"Move [Job] back so [Prereq] can go first."* (1 hint counted). Repeated hints therefore always converge to a valid complete plan in finite steps.
- **Rule tests (`src/games/village-planner/logic.test.ts`).**
  - Each level's DAG is acyclic and every job has a valid `place`.
  - Exhaustive schedule counts match the table above (L1: 12 feasible, all 2 trips; L2: 50 feasible, 36 at 2 trips / 14 at 3 trips; L3: 32 feasible, 3 at 2 trips / 15 at 3 trips / 14 at 4 trips).
  - `countJourneys` ignores empty Cart steps (`null`) while preserving the Cart's current location, and counts `Yard -> Mill -> Mill` as 1 trip and `Hill -> Mill -> Hill` as 3 trips.
  - Prerequisite failures always identify the earliest failing step and an unmet prerequisite `step(p) >= step(j)`.
  - `hint` never suggests an illegal slot, handles dead-end partial boards by recommending a blocking-job removal, and repeatedly applying `hint` from any sampled partial state (empty, partial valid, or conflicted) reaches a feasible completion within `2 * jobs.length` steps.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch()`).** Taps (or drags) each job from the tray into the level's minimum-journey reference schedule in step order, then taps **Run plan**.
- **How-to card (`howto.ts`, level-scoped).**
  - Goal: *"Schedule every village job in order using one bench and one cart."*
  - Steps: level 1–3 *"Tap a job, then tap a matching Bench or Cart step. Do needed jobs in an earlier step."* + level 2–3 *"Group stops at the same place in a row to save cart trips."*
  - Finish: *"Tap Run plan when every job is placed."*
  - Note: level 2–3 *"Any working plan finishes the round; saving cart trips is optional."*
- **Voice lines (`voice.ts`).** `ctx.instruct`: *"Put each job on the bench or cart in order, then run your plan."* Short spoken cues for resource mismatch, occupied slot, missing prerequisite, feasible finish (*"Every job is done!"*), and optional trip comparison (*"Plan worked! You can finish now or try fewer cart trips."*). Run `node scripts/content-barrels.mjs` after adding `voice.ts` and `howto.ts`.
- **Registration & art.** `src/games/village-planner/index.ts`, hub icon (a wooden handcart beside a tiny workbench), sticker art (a woven village map ribbon with a cart wheel), Pixi `Graphics` using `src/art/palette.ts`, pentatonic confirmation/step tones (`src/audio/notes.ts`), no external audio.
- **Co-play and off-screen.** Co-play: *"One person places the bench jobs and the other schedules the cart stops, then check whether any job waits on another."* Off-screen (`school` & `grownup`): *"Pick two errands in different rooms or shops and one tool you have to share—decide which order makes the fewest back-and-forth trips."*
- **Couch play.** None (touch/mouse island puzzle).

## Check tier (for the build)

New-game tier ([verification budget](../../AGENTS.md#verification-budget)): `npm run typecheck`, `npm test` (including `logic.test.ts` and `lands.test.ts` for `lantern-lake` paging/targets at every band), **one** filtered scripted play covering level 1 and level 3 (one prerequisite miss, one hint, and an optional-comparison completion), one portrait phone (`390 × 844`) screenshot, `fingerdemo` at level 3, `npm run game-docs`, and `npm run build` (because shared registry/lands/content barrels change). Close out with `docs/games/village-planner.md`, `docs/STUDY-BACKLOG.md`, `docs/deep-dives/subjects/routines-self-care.md`, and a verification entry.

## Open decisions (with defaults to build on)

- **Whether `school` gets levels 1–2 or `grownup` only.** Default: `school` levels 1–2 and `grownup` levels 1–3 (keeps every interactive target ≥ 104 units so both bands fit comfortably). If `school` feels too dense on a first phone playtest, narrowing `bands` to `['grownup']` is a one-line change.
- **Whether Level 2+ shows the fewer-trips Trace Card immediately or only via a toggle.** Default: show the non-blocking **Done / Try fewer trips** Trace Card whenever a feasible plan uses more than the minimum trips, with **Done** as the primary button so completion is never delayed by more than one tap.
