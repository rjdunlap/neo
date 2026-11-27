# Toy Drawer: Make it Fit, levels 1–4 (definition)

Defined 2026-11-27 on `claude/define-toy-drawer`, from the [routines and self-care study's follow-up](../deep-dives/subjects/routines-self-care.md#toy-drawer-follow-up-make-it-fit) (the developer's 2026-10-14 "inventory Tetris" direction), its [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#routines-and-self-care-recommendations) and the [IDEAS row](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build** for levels 1–3 (slice 1); level 4 is defined here and **built 2026-11-27 as slice 2** (five authored cases, each with a starting arrangement; `Case.start`, `startState`). Every open call has a default under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4 deterministic handwritten solver, S8 identity, land, band and accounting); none needs a reviewer or the developer. Proposed game ID `toy-drawer`.

**Fun action and purpose:** a pretend toy drawer is open on the screen and a tray of toys waits beside it: a long train, a big bear, a little ball. She drags each toy into the drawer (a faint footprint shows which cells it would fill), moves them around, takes them out, and when every toy is in she taps a big **Close drawer** and the drawer slides shut with a happy toy jingle. The learning goal is **spatial reasoning with area**: things of different sizes share a limited space, a toy can go in more than one place, and when one will not fit you can move the others (and, from level 3, turn it). There is no single right layout: every arrangement that keeps the toys inside the drawer without overlapping is accepted, and empty cells are fine. No timer, lives, score, par or star rating.

## References

None was played; pages were read (the study opened them). The first three below are first-party descriptions of the mechanic, not tested for toddlers or preschoolers.

| Reference | What it shows | What Toy Drawer takes or rejects |
| --- | --- | --- |
| [Diablo II inventory basics](https://classic.battle.net/DIABLO2EXP/ITEMS/basics.shtml) | A limited grid where items of different footprints compete for space | The finite grid and footprints. Rejects loot, weight, currency and any persistent inventory |
| [Backpack Hero](https://thejaspel.itch.io/backpack-hero) | Bag organization with rotating held items | The quarter-turn button (level 3). Rejects combat, item synergies and run structure |
| [Save Room](https://store.steampowered.com/app/1955330/Save_Room__Organization_Puzzle/) | Inventory organization as a stand-alone puzzle | Packing as the whole game, many accepted layouts. Rejects its scoring and tight bonus fits |
| A Little to the Left (via [IDEAS](../IDEAS.md#candidates)) | Cozy tidying where several arrangements are right | No single correct layout; a gentle nudge, not a verdict |

## Overlap

- **[Tangram Town](../games/tangram-town.md)** fills authored picture silhouettes with fixed pieces; the target shape is the answer. Toy Drawer has no target picture: any non-overlapping layout inside the drawer is right, and spare cells are expected.
- **[Block Garden](../games/block-garden.md)** places blocks and clears lines. Toy Drawer clears nothing and has no pressure to fill every cell.
- **[Keep House](../games/keep-house.md)** places room tiles to meet spoken needs; Toy Drawer's constraint is capacity, not needs. **Ready for Adventure** keeps order-of-preparation; **Pack the Wagon** (choosing among goods for a pictured manifest) is a later, separate definition; stacking and Find it Again are not defined here.
- The pet's treehouse is a personal creation space; Toy Drawer saves nothing.

## The model (`logic.ts`)

Pure, Pixi-free, seeded, testable in Node.

- **Cells.** A drawer is `cols × rows` cells, row-major `(r, c)`, up to **5 × 4**. `blocked` cells (none in slice 1) are reserved for later dividers. A **toy** is a set of cells normalized so its minimum row and column are 0, plus a `kind` (picture) and a stable `id`. Slice 1 toys are rectangles: train 3×1, bear 2×2, ball 1×1, car 2×1, book 2×1, blocks box 2×2, plus a tall 1×3 ladder (level 3).
- **Placement.** `{ toy, turns (0–3), anchor: [r, c] }`: the toy's turned cells shifted so its top-left cell sits at `anchor`. `legal(board, placed, toy, turns, anchor)` is true when every cell is inside the drawer, not blocked and not covered. `turn(cells)` rotates a quarter-turn clockwise and re-normalizes to the origin (area preserved; two turns of a rectangle returns the same footprint set).
- **Turning pivot.** The turned toy keeps its **top-left cell** where it is; if that makes it overlap or leave the drawer, the nearest legal anchor within one cell is used, else the turn is refused with a gentle bump and the toy stays as it was (never a miss).
- **Solver.** `solve(puzzle, placed, canTurn)` is an exhaustive backtracking search (at most 6 toys on at most 20 cells, so instant) returning a complete legal packing that **keeps as many of the current placements as it can**, or `null`. `nextHint(puzzle, state)` returns `{ kind: 'place', toy, turns, anchor }` when the current layout can be completed without moving anything, otherwise `{ kind: 'take-out', toy }` naming the placed toy whose removal (smallest set, ties by id) makes a completion possible. It is therefore never a glow on an impossible empty space, even after a blocking legal arrangement.
- **Completion.** `complete(puzzle, placed)` is every required toy legally placed. **Close drawer** is enabled only then; pressing it early gives a gentle spoken nudge (`toy-drawer.not-yet`) and pulses the toy tray, never a miss.
- **Generation.** Each level has a hand-authored list of cases; the seeded RNG picks a case, mirrors it left-right or top-bottom, and draws the toy pictures. Generation never invents a case: every authored case is proved by the tests below.

## Screen and controls

- **Scene.** A wooden drawer with a lit floor of cells, a tray of loose toys, the controls and the pet corner. Pixi `Graphics` from `src/art/palette.ts`; toys are chunky, flat-coloured, each filling its footprint cells with its picture (bear's face, train's three cars), so a toy's cells are clear without a grid shown on it. Original art; no imported asset.
- **Cell size.** **120 logical units**, never shrunk: the 5 × 4 cap is 600 × 480, which fits a 768-wide upright view; the board is capped, not scaled. Every toy is as large as its cells, so the smallest child target is a 1×1 ball at 120 × 120. A 1×3 or 3×1 toy's drag hit area is its full footprint.
- **Layout (`drawerLayout`, tested at every standard landscape and upright view).** Landscape: drawer left of centre, tray at its right, controls in a row along the bottom. Upright: drawer at the top, the tray in up to two rows below it, controls in one row **up from the bottom edge**, clear of the top shell buttons and the bottom-left pet corner. The round-ending **Close drawer** sits with the controls, at least 100 × 100.
- **Drag a toy.** Custom pointer handling through `src/engine/drag.ts` with palm rejection; immediate touch-down feedback (the toy lifts and tilts), a footprint preview snapped to the **nearest legal anchor within one cell** of the toy's top-left cell, green when it would fit. Releasing over a legal anchor places it with a soft wooden thump and a pentatonic note from `src/audio/notes.ts`; releasing anywhere else (outside, or no legal anchor near) slides it back to where it came from with a gentle bump. Pointer cancel, leaving the screen and `destroy()` end the drag cleanly and put the toy back.
- **Tap to select, tap to place.** Tapping a toy selects it (ring); tapping a cell then places it at the nearest legal anchor to that cell; tapping a placed toy picks it up; tapping the tray takes a selected toy out. Same rules as dragging, for players who tap better than drag.
- **Why a drop failed.** When a release finds no legal anchor, the cells it would have covered that are already full flash briefly, and the toy returns. The pet says a short line (`toy-drawer.full`) at most once per toy per round.
- **Turn (levels 3+).** A **Turn** button (100 × 100) beside the tray turns the selected toy a quarter-turn (see the pivot above); the button is absent at levels 1–2 so a child there never meets rotation. A toy in the tray can be turned before it is placed.
- **Undo and Start over.** **Undo** (100 × 100) reverses the last place, take-out or turn, any number of times. **Start over** returns every toy to the tray (not at level 4, where it returns to the round's starting arrangement). Neither counts anything.
- **Sound and feel.** A soft wooden *thump* on placing, a hollow *pop* when a toy comes out, a gentle *boing* on a bounce, a toy-box jingle and a drawer-slide on Close. Island music keeps playing.
- **Speech.** `ctx.instruct` repeats the level's instruction from the corner pet; navigation never needs reading. Lines live in `voice.ts`.

## Levels

Misses are not counted at any level (see below). Bands: **preschool 1–2, prek 1–3, school 2–4**; no lap or toddler levels (independent fitting is not established for that audience; free put-in and take-out stays in the existing lap and toddler games) and no grown-up levels. Slice 1 builds levels 1–3.

| Level | Band | Drawer | Toys | New decision |
| --- | --- | --- | --- | --- |
| 1 Roomy packing | preschool, prek | 4 × 3 | three, **at least 4 spare cells** (the study's round: train 3×1, bear 2×2, ball 1×1, spare 4) | Put each toy somewhere it fits; no outlines, no rule, no need to fill every cell |
| 2 A snug drawer | preschool, prek, school | 4 × 3 or 5 × 3 | four or five rectangles already in the right orientation, **1–3 spare cells** | The first toy placed can block a later one, so some arrangements must be moved |
| 3 Turn it to fit | prek, school | 4 × 3, 3 × 4 or 5 × 3 | three to five, **at least one toy that cannot fit unturned in any packing** | The **Turn** button (a tall 1×3 in a wide drawer) |
| 4 Make room for one more (slice 2) | school | 4 × 3 or 4 × 4 | three toys are already in the drawer as a legal arrangement in which the fourth, arriving in the tray, **has no legal place**; turning is on | Take a placed toy out, move it and fit the newcomer; every toy can return to the tray |

Each level's `describeLevel` line states its drawer and what is new. Two smooth rounds step up and two struggling rounds step down through `src/progress/difficulty.ts` as for every game. Pinned levels, saved levels and the save format are untouched (there is no save field).

## Accounting, help and finishing

- **Free experiments (`misses = 0`, always).** Moving, turning, taking out and a toy that will not fit are experiments, never misses; Close drawer pressed early is a nudge. The round cannot be lost.
- **Hints (`hints`).** The **Hint** button (100 × 100, in the pause sheet too) shows `nextHint`: a dashed ghost of the toy in a legal place, or, when the current arrangement blocks completion, the placed toy to take out (it pulses, with a spoken "try moving this one"), never a ghost on an impossible place. **Hints count once per round**: asking again in the same round (or after two bounced drops of one toy, when the ghost fades in by itself, counted once) adds nothing, so help repeated for one drawer is one hint and a round with any hint is **assisted completion**, not independent mastery. Level 1 gives the automatic ghost after two bounces; levels 2–4 give it only on request or after three bounced drops of one toy.
- **Finish.** Close drawer calls `ctx.finish({ misses: 0, hints })` through the shell: one ordinary sticker per round, with or without help. No creation or discovery entry is filed (nothing in the round is a creation worth keeping); the game saves nothing.

## Rule tests (`logic.test.ts`)

For every authored case at every level and every mirror: a complete packing exists (`solve` is not `null`) and `complete` is true for it; **every** legal single placement is accepted and every overlapping, off-board or blocked one refused; `turn` preserves the area and four turns return the original cells; unturned `solve` is `null` for at least one toy in each level 3 case and a turned solution exists; spare-cell counts match the table for levels 1–2; undo restores the exact prior state after place, take-out and turn; `nextHint` returns a `place` that, applied, keeps the layout completable, and from every legal blocking arrangement of every case (all arrangements enumerated) returns a `take-out` whose removal makes completion possible, so repeated hints reach a full packing; the level 4 starting arrangements leave the fourth toy with no legal placement and are completable by moving at least one toy; the toys' tap sizes at 120 units are at least 100 at every layout view.

## Ghost finger, how-to card, voice and registration

- **`autotouch()`** drags each toy from the tray to its place in `solve`'s packing (level 3: tap the toy, tap **Turn**, drag), then taps **Close drawer**; its strokes are clamped to the view.
- **`touchDemo`** on the how-to card shows one toy dragged into the drawer; the card is level-scoped (levels 3–4 also show **Turn**, level 4 the take-out) with the note that nothing here is ever wrong.
- **Registration.** `src/games/toy-drawer/index.ts`: `region: 'cozy-village'` (as `keep-house` does), `challenge: 'space'`, skills `spatial-reasoning`, `area`, bands above, `upright: true`, `autotouch`, one land: **Cozy Village** (everyday routines). A full land pages, so the build runs the lands test and checks the Cozy Village page at every band; if it would not fit, it moves to Rainbow Meadow beside Tangram Town. Co-play: "Pack a real shoebox or lunch box together and talk about what goes where." Off-screen: tidy a real toy basket and let her choose the layout. Run `node scripts/content-barrels.mjs` after `voice.ts` and `howto.ts`; no Kokoro run is needed to ship (device speech is the fallback).

## Build slices

1. **Levels 1–3 as a registered game (new-game tier):** `logic.ts`, `logic.test.ts`, `layout.ts` (`drawerLayout`) with its per-level, five-view test, `index.ts`, `art.ts`, `voice.ts`, `howto.ts`, registry and land entry, a `browser-check.mjs` case, the game page (`npm run game-docs`), and a verification entry.
2. **Level 4, make room for one more (existing-game tier):** the arrival of a fourth toy, the starting arrangements, take-out hinting and Start-over-to-start, with their tests.

Later, each its own definition: irregular shapes and compartments (L-shaped footprint, a visible divider, `blocked` cells), **Pack the Wagon** (choosing cargo for a pictured manifest), and an optional **Find it Again** retrieval mode.

## Check tier

- **Slice 1:** `npm run typecheck`, `npm run format:check`, `npm run lint`, targeted unit tests (`logic.test.ts`, layout, registry, lands, barrels, game-docs, how-to), one filtered scripted play (`toy-drawer` level 1 and level 3 with one bounced drop, one hint and Close drawer), `fingerdemo` at levels 1 and 3, one portrait screenshot (`390 × 844`), and `npm run build` only if shared files change. The full `npm test` is PR CI's.
- **Slice 2:** typecheck, the game's rule tests and one filtered play of level 4.
- **Not claimed:** device, finger-size and child checks are [parked](../DEVICE-CHECKS.md); packing's appeal, preschool success with footprints and older appeal are unestablished until someone plays.

## Decisions (defaults the build uses)

1. **Bands and rotation:** rotation first appears at level 3, so preschool never meets it; no toddler or lap levels.
2. **One drawer per round, one sticker per round,** assisted rounds count as finished and as helped.
3. **Cell size 120, board cap 5 × 4,** capped rather than shrunk; a bigger drawer is a later layout decision, not a smaller cell.
4. **Solver-backed help:** exhaustive backtracking in `logic.ts`, no library; `take-out` hints for blocked layouts.
5. **Land:** Cozy Village, with Rainbow Meadow as the fallback if the land page would not fit.
6. **No persistence:** nothing is saved or collected; no creation or journal kind.
