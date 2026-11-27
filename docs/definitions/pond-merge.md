# Pond Merge, levels 1–3 (definition)

Defined 2026-11-27 for [chunk 27](../ROADMAP.md#chunks) (physics games), from [PHYSICS-GAMES](../PHYSICS-GAMES.md) and its [IDEAS row](../IDEAS.md#candidates) (merge-by-physics, after *Suika Game*). **Ready to build:** every call below has a default the build uses under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4: a small deterministic handwritten solver in `logic.ts`, no physics library; S8: identity, land, band and accounting). None needs a content reviewer or the developer. Proposed game ID `pond-merge`.

**Fun action and purpose:** a row of sleepy eggs waits above a round pond. She slides along the top, lets one go, and it plops, bobs and settles among the others. When two of the same kind touch they pop together into the next size up: two eggs make a chick, two chicks a duckling, and so on until a swan glides out and the round ends with a flourish. The learning goal is **ordering by size and planning where things settle:** equal things combine, so she watches what is already in the pond, chooses where the next one should land, and changes her mind from what she saw. There is no end line, no score, no lives, no clock and no wrong drop.

## What changed from the idea row

- **No fail line.** The source game ends when a fruit stays over the top line. Here a full pond **gently lifts** (below): the smallest friends float away as bubbles and the round goes on. Nothing is lost, nobody loses.
- **A goal and a sticker.** The island round ends when the goal size appears, with one ordinary sticker, with or without help. "Largest size reached" is not shown in the pond; a grown-ups-window personal best is a later, separate slice.
- **A free take-back.** The last drop can always be taken back, because the solver is deterministic and the round is a drop log.
- **No physics library, and `src/engine/` unchanged.** `ball.ts` collides circles with pegs and walls, not with each other; the circle-pile solver lives in `src/games/pond-merge/logic.ts`. [Roll Table](../IDEAS.md#candidates) may later reuse it, and that is when it moves to a shared file, not before.

## References

| Reference | What it shows | What Pond Merge takes or rejects |
| --- | --- | --- |
| *Suika Game* and its browser ancestor *Merge Big Watermelon* (via [IDEAS](../IDEAS.md#candidates)) | Drop fruit; equal ones merge into the next size; a pile you plan | Takes drop-and-merge and the size chain. **Rejects** the fail line, the score and the quick-drop pressure. |
| [Snowball Merge](../games/snowball-merge.md) (built) | Slide numbered snowballs together on a grid (grown-up) | Different action and age: a grid slide with numbers. Pond Merge is falling, settling and size, with no numerals. |
| [Draw a Ramp](draw-a-ramp.md) (defined) and [Block Topple](block-topple.md) (built) | Fixed-step deterministic solver in `logic.ts`; unscaled board; free experiments | Reuses the fixed `1/120` s step pattern, the unscaled board, `upright: true` and free-experiment accounting. |
| [Duck Pond](../games/duck-pond.md) (built) | The pond and ducklings as a familiar place | Reuses the cast and palette; adds no new story. |

## Overlap

- **Snowball Merge** (Lantern Lake, grown-up) merges numbers on a grid; Pond Merge drops circles under gravity for the younger bands, with sizes shown as pictures.
- **Bubble Pop** and **Peg Garden** are touch-and-bounce toys with no combining.
- **Sort and size games** (Size Parade) order given pictures; here she makes the next size by combining, so the learning action differs.

## The model (`logic.ts`)

All lengths are in **board units**. The board is a fixed **420 × 560** box translated inside `view` and **never scaled**, so board units equal logical screen units in landscape and upright. `y` grows downward; time is in seconds.

- **The chain** (`SIZES`, radius in units): egg `22`, chick `30`, duckling `40`, duck `52`, goose `66`, swan `82`. Two of size `k` merge into one of size `k + 1`; a swan merges with nothing. Each size has a mass `r²`.
- **The pond:** walls at `x = 0` and `x = 420`, a floor at `y = 540` (a gently rounded bottom is only drawn; the solver uses a flat floor). **The drop line** is at `y = 60`; the player's held piece hangs there.
- **Constants:** `GRAVITY = 900` units/s², `STEP = 1/120` s, `RESTITUTION = 0.15`, `WALL_FRICTION = 0.2`, `LINEAR_DRAG = 0.6` per second, `PUSH_ITERATIONS = 4` positional correction passes per step, `STILL_SPEED = 8` units/s, `STILL_TIME = 0.5` s, `MAX_PIECES = 60`.
- **Step (fixed order, no randomness):**
  1. Integrate velocity and position for every piece in id order.
  2. For `PUSH_ITERATIONS` passes, resolve every pair `(i, j)` with `i < j` in id order: if `hypot < ri + rj`, push apart along the normal in proportion to the other piece's mass, and exchange the normal velocity with `RESTITUTION`; then the walls and floor the same way.
  3. **Merge pass.** Collect touching pairs of equal size (`hypot <= ri + rj + 1`) in id order; each piece joins at most one merge per step (the lower id pair wins). A merged piece takes the next size, sits at the mass-weighted midpoint, keeps the mass-weighted velocity plus a small upward nudge of `40` units/s so it visibly pops, gets the lower id, and counts a `merge` event for sound and sparkles. A chain reaction continues on the following steps.
  4. Mark a piece still when its speed has stayed under `STILL_SPEED` for `STILL_TIME`.
- **The drop:** a piece appears at `(x, 60)` with zero velocity, `x` clamped so it stays inside the walls. A drop is accepted after the previous piece has fallen below `y = 130` (about `0.35` s), so drops are never blocked for long, and never by a settling pile.
- **The lift (no fail):** if any still piece has its top above the drop line (`y - r < 60`) for `LIFT_TIME = 1.2` s, every piece of the **smallest size present** floats up and is removed as bubbles (a `lift` event), and the round continues. It repeats if the pond is still too full. It is never counted as a miss, never loses the goal piece, and never removes the largest size present.
- **The round:** `makeRound(plan, rng)` returns the seeded **drop sequence** (`items: SizeIndex[]`, `goal: SizeIndex`, `dropsSoft: number`). The sequence is built in **pairs**: every size in the drop set appears an even number of times in each block of six, shuffled by the seeded RNG, so equal neighbours can always be made. Fully deterministic; a round is `(plan, seed, drops: number[])` where `drops` are the `x` positions, and replaying them gives the same pond bit for bit, which is how take-back, the hint check and `autotouch()` work.
- **Public pure API in `logic.ts`:**
  - `planFor(level)` → `{ level, dropSet, goal, containerWidth }`.
  - `makeRound(plan, rng)` → the sequence above.
  - `emptyPond()`, `drop(pond, size, x)`, `step(pond)`, `settle(pond, maxSeconds)` → advance to stillness or `maxSeconds`, returning the events (`merge`, `lift`, `goal`).
  - `reachedGoal(pond, goal)`.
  - `hintDrop(pond, size)` → the `x` that lands the piece on or beside the nearest still piece of the same size (or the wall side of a still smaller pile if none): the same rule `autotouch()` uses.
  - `pondLayout(view)` → pure layout of the `420 × 560` board and the bottom row (**Take back**, **Hint**, each at least 100 units) inside `view` for `1024 × 768`, `768 × 1024`, `390 × 844` and `375 × 601`, clear of the top shell buttons and the pet corner.

## Screen and controls

- **The scene:** a round pond with lily pads, a soft sky, the held piece swaying gently above the pond at the drop line, a faint dotted guide below it, a small picture strip at the side showing the chain egg → chick → duckling → duck → goose → swan with the goal ringed, and the next piece peeking. Pixi `Graphics` only, colours from `palette.ts`; every size is a different shape and colour, so size is never colour alone.
- **Controls:** drag along the top to slide the held piece (a tap anywhere above the pond also moves it), and **let go to drop** (`src/engine/input.ts` and `drag.ts`, with palm rejection and cancel handling). The hit area is the whole pond width. **Take back** returns to the pond before the last drop by replaying `drops.slice(0, -1)`; it is always available and never counted. **Hint** shows a pulsing ghost drop. Nothing waits on a timer.
- **Sound:** a soft plop on a drop and a rising pentatonic note on a merge, one step higher per size (`src/audio/notes.ts`); a quiet bubble sound on a lift; the swan gets the cheer. With sound off, merges are read by the new picture and a sparkle.

## Levels

| ID | Name (`describeLevel`) | Drop set | Goal | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Make a duck | egg, chick | duck (size 4) | Where to put each one so two equal ones touch |
| 2 | Make a goose | egg, chick, duckling | goose (size 5) | Which size to wait for and where to keep room |
| 3 | Make a swan | egg, chick, duckling | swan (size 6) | Plan a pile over many drops; use take-back to try another way |

**Bands (`BandLevels`):** `prek: { min: 1, max: 1 }`, `school: { min: 1, max: 3 }`; a preschool entry is not in this slice because it needs a [phone playtest](../OBSERVATIONS.md) of the drop gesture first. No lap or toddler levels. No `order`.

### First rounds

- **Level 1:** the pond is empty; the first two eggs drop side by side and pop into a chick; one more chick and a duck is only a few drops away. Ghost hint after eight drops with no merge in a row.
- **Level 2:** the drop set adds duckling; a chick beside a chick makes the duckling that must sit near a second duckling.
- **Level 3:** same drop set, a longer chain; the lift will happen once or twice on a careless pile and is the lesson in stacking sensibly, not a penalty.

## Accounting, help and finishing

- **No misses.** Every drop is a free experiment: `misses = 0` always, including a lift. Take-back is free.
- **Hints (`hints++`):** the Hint button counts one hint per press that shows a ghost drop for the held piece; after eight drops in a row with no merge the ghost drop appears on its own and counts once per round. An assisted completion is not independent mastery ([`src/progress/coach.ts`](../../src/progress/coach.ts)).
- **Finish:** when `reachedGoal` is true, the new piece swells, the pond sparkles and `ctx.finish({ misses: 0, hints })` awards one ordinary sticker with or without help. No creation or discovery entry is filed.
- **Difficulty:** two smooth rounds (zero hints) step up; two rounds with at least two hints step down, within the band's range, as for other games.

## Rule tests (`logic.test.ts`)

- **Determinism:** the same `(plan, seed, drops)` gives bit-identical pond state and events across repeated runs, and replaying `drops.slice(0, -1)` equals the pond before the last drop (take-back).
- **Stable numerics:** no `NaN`, `Infinity` or overlap greater than `2` units after `settle`, for 500 seeds with random drop positions; piece count never exceeds `MAX_PIECES`.
- **Merge rule:** two equal still pieces in contact become exactly one piece of the next size at the weighted midpoint; unequal pieces never merge; a swan never merges; each piece joins at most one merge per step.
- **Chain reaction:** a prepared pond of four equal pieces in a square resolves to two next-size pieces, then one, in the same number of steps on every run.
- **Lift is not a fail:** a deliberately overfull pond lifts the smallest size, keeps the goal piece, and still allows the goal to be reached afterwards.
- **Sequence fairness:** across 500 seeds, each block of six items has every size of the drop set an even number of times.
- **Solvability within the measured cap:** a greedy bot using `hintDrop` for every piece reaches the goal within `MAX_DROPS` per level (set at build from the measured median plus a wide margin; **if the bot fails on any seed, the build widens the pond or lowers the goal**, it never ships a level the bot cannot finish). Zero drops never reaches the goal.
- **Layout:** `pondLayout(view)` at the four views keeps the board and both buttons inside `view`, non-overlapping and clear of the pet corner and shell buttons.
- **Registry, lands, upright and how-to tests** pass with `pond-merge`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` drags the held piece to `hintDrop(pond, size)` and releases; it returns `null` while the pond is still settling.
- **How-to card** (`howto.ts`): goal `"Drop friends so two the same pop into a bigger one."`; steps `"Slide a friend along the top, then let go"` `{ from: 1, to: 1 }` and `"Two the same make the next size up"` `{ from: 1, to: 3 }`, and `"Take back is always free"`; finish `"Make the goal friend to finish."`; note `"A full pond never ends the round: the smallest friends just float away."`
- **Voice lines** (`voice.ts`, `pond-merge.*`): `intro`, `instruct-1` to `instruct-3`, `plop`, `pop`, `lift`, `hint`, `take-back`, `done`. The title line is slotted in text so no voice clip has to be rendered for it.
- **Registration:** ID `pond-merge`, name `"Pond Merge"`, spoken title `game.pond-merge`. Challenge `'space'`. Skills `['ordering', 'planning', 'revision']`. `upright: true`, `touchDemo: true`. Home land **Tinker Lab** (physics games live there), and if the lands test reports that page full the build moves it to **Counting Cove** beside Duck Pond. Hub icon: a duckling above a swan on a pond. Sticker: a seeded swan on a pond.
- **Co-play:** `"Guess which two will touch before you let go."` **Off-screen:** `"Sort a handful of coins, buttons or blocks from smallest to biggest, then line up what two of each would make."`

## Build slices

1. **Levels 1–3 as a registered game (new-game tier, `batch pond-merge 1`):** `logic.ts` (solver, sequence, hint, layout), `logic.test.ts`, `index.ts` (scene, drag input, buttons, sound, `autotouch()`), `voice.ts`, `howto.ts`, registry and land entry, `browser-check.mjs` case, game page and README tables.

## Check tier

- **Slice 1:** typecheck, the game's unit tests plus registry, lands, upright and how-to tests, one filtered scripted play (level 1 and level 3 with one take-back and one hint), `fingerdemo` at levels 1 and 3, one portrait screenshot, and `npm run build` only if shared files change. Not claimed: how the drop gesture feels on a phone to a child ([parked](../DEVICE-CHECKS.md)).

## Decisions (defaults the build uses)

1. **Solver:** a handwritten fixed-step circle-pile solver in `src/games/pond-merge/logic.ts`; no library; `src/engine/` unchanged.
2. **No fail line:** a full pond lifts the smallest friends; the round is never lost.
3. **Bands:** `prek: 1`, `school: 1–3`; a preschool entry waits on a phone playtest of the drop.
4. **Accounting:** no misses; take-back free; hints counted; one sticker, with or without help.
5. **Home land:** Tinker Lab, upright from slice 1.
6. **Progress and personal best:** none filed in slice 1; a grown-ups-window best size is a later, separate line.
