# Egg Catch level 13: Sorting gate (definition)

**Built:** level 13 (PR #1961); nothing further is defined here. The build's departures and miss/hint rules are in [the game page](../games/egg-catch.md#design-notes).

*Game `egg-catch` · school band · defined 2026-11-21 from [dive slice 9](../deep-dives/egg-catch.md#build-slices-in-order) and the level 13 row of the dive's [new levels table](../deep-dives/egg-catch.md#new-levels-on-top). Docs only; nothing here is built. The dive's decisions 2–5 are about other levels and stay as the dive records them.*

**Fun action and purpose.** A new gate joins the run: a **sorting gate** with a brown face and a white face that reads each egg's shell and sends brown one way and white the other. Four mixed eggs wait at the top. She puts the sorting gate on one of the three junctions, turns it, sets the two plain gates once, and taps the green arrow; all four eggs then roll in turn with no touches between, brown to the basket and white to the nest. Learning goal: **where a condition belongs in a route**. The sorting gate only helps where the brown road and the white road part: at the top when the basket and the nest are on different sides, on the lower junction of their side when they share one. This is the "if" placed inside a sequence, after levels 10 (debug a visible run) and 11 (a gate with state).

**Overlap checked.** [Sorting Machine](../games/sorting-machine.md) asks *which* sensor a sign needs (choose the condition) on a fixed machine; here the condition is fixed (shell colour) and the question is *where* on the route it goes. Level 5 (*sort*) and 7 (*pair*) send brown and white to different places by setting plain gates per egg or per pair; neither has a gate that reads the egg, so neither has a placement. Level 11's spring gate changes by itself after each egg; the sorting gate has no state, so egg order never matters, which keeps the one new idea alone.

## Level ID and play order

`mode: 'sorter'`, appended to `PLANS` as **level 13** (level 12 is lap's *One big hen*). If another level takes 13 first, this takes the next free ID and this page's number is read as a name. `LEVELS.school` becomes `{ min: 4, max: 13, order: [4, 5, 6, 7, 10, 11, 13] }`; no other band lists it, and no saved level or pin is renumbered. It is touch only: the couch catalog's Egg Catch rungs are unchanged.

`describeLevel(13)`: "Sorting gate: put the gate that reads shells where brown and white part, then four eggs roll with no touches between."

## A round, step by step

1. **Three boards** (`eggs: 3` in the plan, counting boards as levels 7, 10 and 11 count pairs and boards). The run is the usual three-gate board from `geo()`: the entry, gate 0 at the top, gates 1 and 2 below it, four exits and their bins. One bin is the basket, one the nest, two are hay.
2. **The waiting eggs.** Four eggs sit in a short queue at the entry, two brown and two white in a seeded order, so she sees the mix before she plans. They never move until the arrow.
3. **The sorting gate** waits on its peg beside the entry, drawn as a gate disc split in two: a brown half with a small brown egg and an arrow, a white half (the level-3 shell colour, `SHELL.white`) with a white egg and the opposite arrow. "This gate reads each egg. Brown rolls one way, white rolls the other. Put it where brown and white part, set the other gates, then tap the green arrow!" (`egg.sorter`, `ctx.instruct`).
4. **Placing.** She drags the sorting gate onto a junction (`draggable` from `src/engine/drag.ts`, with `tapToPlace` while it is on its peg, so a tap on it and then a tap on a junction works too). A drop within 140 of a junction snaps there; anywhere else it floats home. On a junction it covers the plain gate, whose setting is kept and comes back when the sorting gate moves on. Dragging it to another junction or back to the peg is free.
5. **Turning.** A still tap on the placed sorting gate swaps its faces (brown now points the other way), with the gate's usual flip sound. Plain gates flip with a tap as on every routing level.
6. **Rolling.** The green arrow with the sorting gate still on its peg says "Put the sorting gate on the run first." (`egg.sorterfirst`); not a miss. Otherwise the gates and sorting gate lock and the four eggs roll in queue order, each starting when the one before reaches its exit chute. At the sorting gate an egg pauses a quarter second while the matching face lights and a pentatonic note plays (`src/audio/notes.ts`: brown a low step, white a high one), so the reading is visible and audible.
7. **A sorted run.** All four in place: the eggs settle in the basket and nest, sparkle, and the next board is dealt with the sorting gate back on its peg. After the third board the basket hatches as on every level and the shell's `ctx.finish({ misses, hints })` ends the round.
8. **A run that misses.** Any egg in the wrong bin hatches safely in the hay (as on every routing level) and the chick hops off; the right ones settle for a moment and return to the queue. A fresh egg of the same shell takes each hatched egg's place, so the same four shells wait in the queue in the same order. The board, the sorting gate's place and every gate stay as she left them, so she revises rather than starts again. "Some eggs took the wrong road. Find where brown and white need to part." (`egg.sortermiss`).

## Misses and hints

- **A miss** is one failed run, however many of its four eggs went wrong. An arrow tap with the sorting gate on its peg, moving it, turning it and flipping gates are never misses.
- **After two misses on a board** the hint turns on (one hint for the board, the existing `hinting` flag and `hints++`), and glows one thing at a time, from `sorterHint`: the junction where the sorting gate belongs while it is anywhere else, with "The sorting gate goes here, where the brown road and the white road part." (`egg.sorterhere`); once it is there and turned the wrong way, its brown face pulses; once it is right, the first plain gate an egg still needs, as `wanted()` glows today. The green arrow pulses once the board sorts, as it does for a hinted route. The hint clears when the board is sorted.
- Misses and hints feed `difficulty.ts` as on every level; a hinted round is assisted, not independent mastery.

## The model (`logic.ts`)

- `SorterBoard { basket: number; nest: number; eggs: ('brown' | 'white')[]; gates: [boolean, boolean, boolean] }`, made by `sorterBoards(rng, count)`.
  - `basket` and `nest` are different exits. **The kinds alternate:** the first board is a *top* board (basket and nest on different branches, so the sorting gate goes at gate 0), the second a *low* board (both on one branch, so it goes on that branch's lower gate), the third either, seeded. Every round therefore needs both placements. The basket's exit never repeats three boards running.
  - `eggs`: two brown and two white, seeded order.
  - `gates`: the plain gates dealt at random; with the sorting gate on its peg no board can sort (both shells take one road and `basket !== nest`), so nothing is dealt solved.
- `SorterSetup { at: 0 | 1 | 2 | null; brownRight: boolean; gates: [boolean, boolean, boolean] }`; `at: null` is the peg.
- `sorterExit(setup, shell)`: walks the board as `exitFor` does, except that at junction `at` the direction is `brownRight` for brown and `!brownRight` for white.
- `sorts(board, setup)`: every egg reaches the basket (brown) or the nest (white).
- `sorterAnswer(board)`: `at` is the junction where the two roads part, 0 when `basket < 2 !== nest < 2`, else 1 or 2 by the shared branch; `brownRight` points brown toward the basket from there; `needs` lists the plain gates an egg passes (for a top board the lower gate of each branch, set for the basket and the nest; for a low board gate 0, set toward the shared branch).
- `sorterHint(board, setup)`: `{ place: junction }`, `{ turn: true }`, `{ gate: i }` or null when `sorts` holds, in that order, as described under hints.

**Why the placement is unique.** A brown and a white egg that end in different bins must split at some junction, and only the sorting gate sends the two shells different ways; so it must sit on both roads at the junction where they part. Its direction is then forced, and so is every plain gate an egg passes. The one gate no egg passes (on a low board, the other branch's lower gate) is free, exactly as `gatesFor` already leaves "the gate on the other branch" free.

### Rule tests

- For seeded rounds, a brute force over all 48 setups (`at` in 0–2, both turns, eight gate settings) finds that `sorts` holds only at `sorterAnswer(board).at` with its `brownRight`. Counting setups that differ only in the covered junction's plain setting as one, exactly one sorts on a top board and exactly two on a low board (the free gate either way).
- No setup with `at: null` sorts any dealt board.
- Each round has at least one top board and one low board, and the first two differ; the basket never sits on one exit three boards running; each board has two eggs of each shell.
- Following `sorterHint` from the dealt setup (sorting gate on its peg) reaches a sorting setup in at most four steps, and a hint never points at the free gate.
- Egg order never changes the result: `sorts` is the same for every permutation of `eggs` (the gate has no state).

## Screen and controls

- **Junction targets:** the existing gates' 160-wide hit circles at `geo().gate`; a drop snaps to the nearest junction within 140.
- **The sorting gate:** a 160-wide disc like a plain gate, its peg at `(cx − 250, top + 20)` left of the entry, clear of gate 1's hit circle (about 209 apart) and of the green arrow at the top right. Touch-down lifts it at once (the drag helper's feedback).
- **The egg queue:** four eggs side by side above the entry, 70 apart, not targets.
- **Upright (phone portrait):** the build checks with `upright.test.ts`'s walk of every level that the peg and the queue stay inside the view and clear of the guide and the far barn's strip (`farBarnAt` already reads the routing board's left edge; the peg sits right of that edge, so the build either confirms it stays clear or moves the peg above gate 1's circle).

## Words and help

- **Voice lines** in `voice.ts`: `egg.sorter`, `egg.sorterfirst`, `egg.sortermiss`, `egg.sorterhere`. `egg` is a rendered clip prefix, so the build renders the four new clips with `scripts/voice-clips/render.mjs` (the clips test fails otherwise) and records the size added.
- **How-to card** (`howto.ts`, `from: 13, to: 13`): "Drag the sorting gate onto a junction, or tap it and then the junction. Tap it to turn its brown face. Set the other gates, then tap the green arrow: four eggs roll with no touches between." A details line: "A run that misses counts once and keeps the board. Two misses light where the sorting gate belongs, then which way it turns, then the gate still to set." And the goal line for the level: "Sort three boards, then watch twelve eggs hatch."
- **Ghost finger** (`autotouch()`): drag the sorting gate to `sorterAnswer(board).at`, tap it if `brownRight` is wrong, flip each gate in `needs` still wrong, then the arrow; it reads the same functions the hint does.

## Build checks

New interaction tier: typecheck; unit tests (the rule tests above, plus the difficulty, how-to and registry tests that walk levels); one filtered scripted play of level 13 (`BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=13 TO_LEVEL=13`, after the `eggs` case in `scripts/browser-check.mjs` learns the placement) with one wrong placement on a low board and one hint; one portrait screenshot; `fingerdemo` at 13; the offline check, because clips are added.
