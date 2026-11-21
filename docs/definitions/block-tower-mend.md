# Block Tower level 7: Mend the leaning tower (definition)

*Game `block-tower` · school band · defined 2026-11-21 from [dive slice 6](../deep-dives/block-tower.md#build-slices-in-order) and the level 7 row of the dive's [new levels table](../deep-dives/block-tower.md#new-levels-on-top), under the decisions the developer delegated on 2026-10-23 (the dive's [decided paragraph](../deep-dives/block-tower.md#decisions-for-the-developer)). Docs only; nothing here is built. Levels 8 (counterweight) and 9 (safe removal) stay as the dive records them.*

**Fun action and purpose.** A tower leans so far that it would tumble, and ropes from a beam hold it up. She drags the **top block** sideways along the block below it, tries **Let go**, and watches: the tower stands, or it tumbles with the same fallen outlines and middle line that level 5 shows. Two mended towers finish. Learning goal: **change one thing so the middle of the blocks above sits over the block below.** Level 5 asked her to *predict* which tower stands and level 6 to *build* out to a star; here she *revises* a plan that fails, one controlled change at a time, and sees both ways to get it wrong: not far enough back (the upper pair still hangs past the bottom block) and too far back (the top block slides off its own support).

**Overlap checked.** [Block Topple](../games/block-topple.md) knocks blocks down; nothing there edits a support. Level 5 (*Which will stand?*) uses the same rule and the same release, but she only chooses; level 6 (*Reach the star*) places blocks freely and each one settles at once. No other game in [GAMES.md](../GAMES.md) or [IDEAS.md](../IDEAS.md) asks for a repair under temporary supports. Level 8 later reuses the ropes, the release and the result screen built here.

## Level ID and play order

`mode: 'mend'`, appended to `PLANS` as **level 7**, `rounds: 2`. If another level takes 7 first, this takes the next free ID and this page's number is read as a name. Per the 2026-10-23 decision (the school window grows toward 5–9, easier modes placed with `order`), mending one block is easier than level 6's open build, so `LEVELS.school` becomes `{ min: 5, max: 7, order: [5, 7, 6] }`: predict, then mend, then build out to the star. A new school player still starts at 5 (`firstLevel` in `difficulty.ts` takes the first of the order); a saved level or pin at 5 or 6 is still listed and is not renumbered. No other band lists 7. Block Tower has no couch rungs, so nothing changes there.

`describeLevel(7)` (the plan's `name`): "Mend the leaning tower: move the top block so it stands, then let the ropes go".

## A round, step by step

1. **Two tasks.** The first is a three-block tower, the second a four-block one (see *the model* below). One leans right and the other left, in a seeded order, as level 6's reach does.
2. **Held by ropes.** The tower stands on the floor at `towerX(v, false)`, every block drawn where the task puts it, with a rope from the beam to each block. "This tower leans too far, so the ropes hold it. Drag the top block to mend it, then tap the green button to let go." (`tower.mend`, `ctx.instruct`).
3. **Moving the top block.** Only the top block takes a drag (`draggable` from `src/engine/drag.ts`); the blocks under it are frozen and show no touch response. It slides along the block below, snapping to whole eighths of a block width inside its domain, with the level 6 drop ghost showing where it will rest. A drop outside the domain lands on the nearest end of the domain; a cancelled drag, or a drop on the slot it came from, puts it back where it was and records no move. Each recorded move goes on the task's move list.
4. **Undo.** A round button with a back arrow (`undo`) returns the top block to the slot before its latest move, one move per tap, down to the dealt slot; at the dealt slot it is hidden. Undo is free.
5. **Let go.** A round green button (`letGo`, two rope ends parting). With the top block back at its dealt slot (never moved, or undone all the way), it repeats "Move the top block first, then let go." (`tower.mend-move`) and nothing is released; this is not a trial. Otherwise the drag, undo and let go lock, the ropes slacken and lift away, and the tower settles.
6. **It stands.** The tower stays up, a green line runs down the middle of the upper blocks onto the block that holds them, a sparkle and "It stands! The middle of the blocks on top is over the block below." (`tower.mend-stands`). After a short wait the next task is dealt; after the second, the shell's `ctx.finish({ misses, hints })` ends the round. The second task's tower is drawn fresh, held by ropes again.
7. **It tumbles.** The blocks from the one that lost support (`topples(xs, null)`) fall in the level 5 cartoon, their outlines stay with the middle line of the falling group and a red line at the edge of the block below, and "Tip! The middle of the top blocks was past the edge of the block below." (`tower.fell-block`, the existing line). Then two buttons in the same two places: **Watch again** (the existing round arrow) replays the same fall, free and unlimited; **Try again** (a rope loop) puts the ropes back and the tower back exactly as she let it go, top block where she left it, so she revises from her own attempt rather than from the start. "Round arrow: watch again. Rope: hold the tower again and try a new place." (`tower.mend-try`). This was one unsuccessful trial.

## Misses and hints

The 2026-10-23 decision makes failed releases and topples at levels 6–9 **unscored experiments** with one counted hint after two unsuccessful trials.

- **No misses at 7.** A tumble, a let go before any move, a drag, undo, Watch again and Try again never add a miss. `ctx.finish` always reports `misses: 0` at 7.
- **After two unsuccessful trials on a task** the hint turns on, once for the task (the `hinted` flag and `hints++`, at most one per task, so at most two per round): the hint slot glows as level 6's drop place glows, and "Try a block on the glowing place." (`tower.reach-hint`, the existing line). The glow stays until the task stands and returns after Try again. A let go before any move is not a trial and never brings the hint closer.
- **What `difficulty.ts` sees.** An unhinted round reports `{ misses: 0, hints: 0 }`, read as smooth, as level 5's observations are; two hinted tasks in a round make it struggling. A hinted round is assisted, not independent mastery.
- **Level 6 is not changed here.** The same decision makes level 6's topples and short full stacks unscored too, but the level 6 code still counts them as misses (`settled()` in `index.ts`); that is its own existing-game change and gets its own READY line, not part of this build.

## The model (`logic.ts`)

Positions are eighths of a block width from the bottom block's middle, canonical lean to the right, as on levels 5 and 6. The floor holds the bottom block (`topples(xs, null)`), so only the blocks above can fall.

- `MEND_TASKS`, authored (every number below was enumerated with the existing `topples` while writing this page; the build's rule tests recheck them):

| ID | Dealt tower | Falls from | Top block's domain | Slots that stand | Hint slot | Too far back falls from | Too far out falls from |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | `[0,3,6]` | block 1 | −4 to 10 | 0 to 4 | 2 | block 2 (top) | block 1 |
| T2 | `[0,2,6]` | block 1 | −5 to 9 | −1 to 5 | 2 | block 2 | block 1 |
| T3 | `[0,4,5]` | block 1 | −3 to 11 | 1 to 3 | 2 | block 2 | block 1 |
| Q1 | `[0,2,5,7]` | block 1 | −2 to 12 | 2 to 4 | 3 | block 3 (top) | block 1 |
| Q2 | `[0,2,4,8]` | block 1 | −3 to 11 | 1 to 5 | 3 | block 3 | block 1 |
| Q3 | `[0,3,4,7]` | block 1 | −3 to 11 | 1 to 4 | 2 | block 3 | block 1 |

  Every dealt tower falls from block 1: the upper group's middle is past the bottom block, which is what the mend fixes. Every task has failing slots on both sides of its window, so pushing the block all the way back is not a strategy, and the second task's windows are narrower or equal.
- `mendDomain(task)`: the integer slots `x` with `|x − b| ≤ 7`, where `b` is the block below the top one; inside it the top block always rests on that block.
- `mendRepairs(task)`: the domain slots where `topples([...base, x], null) === -1`.
- `mendHint(task)`: the middle of `mendRepairs` (the lower middle, toward the base, when the count is even), the slot with the most room either side; it is deterministic per task and never names a frozen block.
- `makeMendRounds(rng)`: one T task then one Q task, each drawn from its three, with directions `rng.shuffle([1, -1])` (one each side) and a seeded block colour start as level 5 deals; frozen like `makeReachRounds`. A mirrored task multiplies every position, domain slot and hint by its direction.
- `MendTrial` (a small state class like `StandObservation`): `phase: 'held' | 'releasing' | 'result' | 'stood'`, `top`, `moves`, `failed`, `hinted`; `move(x)` (records only a change inside the domain), `undo()`, `letGo()` (false at the dealt slot), `settle(stands)` (counts a failure), `watchAgain()`, `tryAgain()` (back to `held` with `top` kept), and `hintDue` (true once `failed >= 2`).

### Rule tests

- Every task: the dealt tower falls from block 1; the base without the top block stands; at least two slots stand; the dealt slot is not among them; there is a failing slot below and above the window; the hint slot stands and is in the domain.
- Mirroring: for both directions every slot's result is the same as its canonical slot's, and the hint mirrors.
- `makeMendRounds` over 200 seeds: two tasks, one three-block then one four-block, one leaning each way, every task ID reachable.
- `MendTrial`: a let go at the dealt slot releases nothing and counts nothing; undo walks back move by move to the dealt slot; a cancelled or same-slot move records nothing; Try again keeps her slot; Watch again changes nothing; the hint is due after exactly two failures and counts once per task, so a round reports at most two hints and never a miss.
- The ghost finger's plan (drag to `mendHint`, then let go) stands for every task in both directions.

## Screen and controls

- **The top block** keeps the level 6 block size (`BW` 104 × `BH` 62) with the level 6 hit area (`TRAY_HIT`, 124 × 102); one eighth is 13 units, so the narrowest window (T3 and Q1, three slots) is 39 units wide, with the drop ghost showing the snapped slot before the finger lifts.
- **Buttons:** `undo` and `letGo` take level 5's two button places (`watchAgain` and `continueStand` in `layout.ts`, radius `BUTTON_R`), and in a result Watch again and Try again take the same two places, so the two spots never hold two buttons at once. Both sit 410 above the floor, clear of a four-block tower's top block and its hit area (about 270 up).
- **Ropes and beam:** the existing level 5 beam (`beamY`); ropes are drawing only, never targets.
- **Upright (phone portrait):** the build adds the mend mode to `upright.test.ts`'s walk, checking on the upright phone views that a four-block tower leaning to either side, its whole top-block domain and both buttons stay inside the view, clear of the guide's corner and of each other.

## Words and help

- **Voice lines** in `voice.ts`: new `tower.mend`, `tower.mend-move`, `tower.mend-stands`, `tower.mend-try`; reused `tower.fell-block` and `tower.reach-hint`. `tower` is a rendered clip prefix (`scripts/voice-clips/clips.mjs`), so the build renders the four new clips with `scripts/voice-clips/render.mjs` (the clips test fails otherwise) and records the size added.
- **How-to card** (`howto.ts`, `from: 7, to: 7`): "Drag the top block along the block below it, then tap the green button to let the ropes go. Two mended towers finish." and "A tumble is an experiment, never a miss: the round arrow watches it again, the rope holds the tower again where she left it, and the back arrow undoes a move. After two tumbles a place that works glows." The card's goal line grows to name mending: "Explore tower height and balance by stacking, comparing, predicting and mending."
- **Ghost finger** (`autotouch()`): drag the top block to `mendHint(task)`, then tap `letGo`; on a result after a stand it waits for the next task. It reads the same function the hint does.
- **Sticker:** unchanged; the sticker's own seeded drawing is not touched, and the round's draws come from `ctx.rng`.

## Build checks

New interaction tier: typecheck; unit tests (the rule tests above, plus the difficulty, how-to, registry, lands and `upright.test.ts` walks that read every level); one filtered scripted play of level 7 (`BROWSER_SUITE=shortlist SHORTLIST_ONLY=tower FROM_LEVEL=7 TO_LEVEL=7`, after the suite's `tower` case, which stops at 6 by default and branches by level, learns the mend: one let go before a move, two failed releases, the hint, then a stand) and one portrait screenshot; `fingerdemo` at 7; `npm run build` and the offline check, because clips are added.
