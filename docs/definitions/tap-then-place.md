# Tap the piece, then the place (P3, definition)

Status: defined 2026-11-11 (docs only); slices 1 (P3a, the engine path and Hat Band) and 2 (P3b, Block Garden) built 2026-11-11, slice 3 open; see [As built (P3a)](#as-built-p3a-2026-11-11) and [As built (P3b)](#as-built-p3b-2026-11-11). Proposal: [Pok Pok review, P3](../POK-POK.md#p3-a-tap-can-do-what-a-drag-does-a-question-now-a-definition-later). Defaults below were decided under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules); say if any is wrong.

A grown-up thumb on an upright phone is the island's small hand today, and a thumb hides the place it is dragging to. This definition gives `src/engine/drag.ts` one shared, opt-in second way to move a piece: tap it, it shows it is held, then tap the place and it glides there. A game takes it with one option on its existing `draggable()` call and no pointer code of its own; the game's own drop rule decides what the put-down means, exactly as it decides a drag's. No playtest note has named a drag yet (see [OBSERVATIONS](../OBSERVATIONS.md)); READY queued the definition ahead of one.

## What is there today (`origin/main` at `d80b14e9`)

- `draggable(obj, tw, opts)` (`src/engine/drag.ts`, about 100 lines) lifts a piece 40 units above the finger, lets one finger drag at a time (a module-level `active` lock freed on the window's `pointerup`), ignores a palm (`palmOnGlass()`), and on release calls `opts.onDrop(x, y)`; a refused drop floats home. `onPick` fires on touch-down. A still tap therefore reaches the game today as `onPick` then `onDrop` at the piece's own home.
- 66 game folders call `draggable()`; 7 of them are upright-ready (`animal-snack`, `block-garden`, `crossword`, `far-lights`, `hat-band`, `size-parade`, `stamp-studio`).
- **Hat Band already hand-rolls this path** (`src/games/hat-band/index.ts`): `HatPiece` measures the finger's travel from touch-down (not the hat's, since the hat lifts 40 units at once) and a release under 24 units is a tap. A tapped rack hat is `selected` and glows; a tap on a friend's spot (`tapFriend`, an `onTap` target) puts it on; a tap on the lifted hat again puts it down; its bot (`autotouch`) plays tap-the-hat, tap-the-friend. It is the precedent and the regression check.
- **A still tap already means something else in five places**, so the path cannot be on by default: Timeline Trail speaks the card (`timeline-trail`, travel under 14), Rule Machine feeds the car (`rule-machine`, a drop within 24 of home counts as a tap), and Attic Finds looks at a clue or reads a paper (`attic-finds`, three handlers, travel under 18). Tangram Town's level 8 selects and turns a placed piece in place.
- The ghost finger (`src/engine/ghost.ts`) does not hit-test: it emits `pointerdown`/`pointerup` straight into the object named by the intent's spot (or `receiver`). Its touches never reach `window`, which is why `drop()` frees the lock itself.
- Couch play drives games through `Game.control()`, which never goes through `draggable()`; `Game.touchReturned()` tells a game a finger came back after a pad.

## Requirements

### R1. Opt-in, one option

`DragOptions` gains `tapToPlace?: boolean` (default false). Nothing changes for a `draggable()` that does not set it: every game above that gives a still tap its own meaning keeps it. A game sets it per piece, so a game may take the path at some levels only (Tangram Town not at level 8).

### R2. What counts as a tap

A release whose **finger** travelled less than `TAP_TRAVEL = 24` units (in the parent's space, measured from touch-down, as Hat Band does) is a tap; anything further is an ordinary drag, unchanged. No time limit: a slow still press is still a tap. Exported from `drag.ts` so later games stop defining their own.

### R3. How a held piece shows it is held

On a tap the piece is **held**: `onDrop` is not called, the piece stays where it is (at its home; there is no lift, since no finger is over it), keeps the pick-up's 1.12 scale and breathes between 1.12 and 1.2 of its rest scale about once a second, and the game's own `onPick` feedback (Hat Band's glow) stays on. Nothing else changes on screen and nothing is said by the engine. One piece is held at a time, across all games' handles (the same module-level rule as the drag lock). A hold never times out: nothing expires.

### R4. Putting it down

While a piece is held, the next single touch-down that reaches a **place** puts it down there: the piece glides (about 0.22 s) so its anchor (its position, as during a drag) lands on the tapped point, `onMove(x, y)` is called once on arrival, then `onDrop(x, y)` exactly as at the end of a drag; a refusal floats it home. Places are:

- **the play area**: on holding, the engine puts a transparent catcher at the bottom of the held piece's parent (index 0, a very large hit area), so a tap on empty ground or on any non-interactive drawing reaches it, while every interactive sibling above it still gets its own taps; and
- **any `onTap` target the game marks as a place** (`onTap(obj, fn, { place: true })`): a touch-down there puts the held piece down at that point first, then runs `fn` as usual. Hat Band's friend spots become places.

The catcher is exposed while held (`heldPlace()` returns it, or null), so a game's `autotouch` can aim the put-down with `{ tap: spot, receiver: heldPlace() }`; the ghost finger needs no change.

### R5. Cancelling: what a still tap does today

A hold ends without a put-down by calling `onDrop` at the piece's home, which is what the same still tap reaches the game as today, so a game's carrying state always clears and every game that already copes with a still tap copes with a cancel. (A game may pass `onCancel` instead when its drop rule would treat its own home as an answer, as Rule Machine's does; such a game does not take the path until it does.) The hold is cancelled by:

- a tap on the held piece itself (it settles back; the game's pick sound is enough);
- a touch-down on another `draggable()` piece: the held one is cancelled first, then the new one is picked as usual (switching pieces is one tap);
- a tap on any `onTap` target that is not a place (Done, the speaker, a star, Home's sheet): the hold is cancelled and the button acts in the same touch, so a hold never swallows a tap ([U7](never-swallow-a-tap.md));
- the page hidden (`visibilitychange`), the game's `touchReturned()` (it calls the handle's `cancel()`), and `GameScene` covering the round with a card or sheet (it calls the engine's `cancelHeld()`).

`destroy()` clears a hold without calling the game, which is going.

### R6. Palm, fingers and mouse

A put-down is ignored while `palmOnGlass()` is true, and while another finger holds the drag lock; the piece stays held. A mouse click is a tap; the same path serves the desktop.

### R7. Accounting

A put-down the game refuses is accounted exactly as the same drop at the end of a drag (a non-fitting piece in Block Garden is a miss only where a non-fitting drag is). A cancel is free. The path is never a way to avoid a miss or a new source of one.

### R8. The how-to card and couch

The card keeps demonstrating the drag wherever a level's action is a drag (the [input in use](../DESIGN.md#reuse-map) is a finger either way); a game shows tap-then-tap only where its dive makes it the level's main action, as Hat Band's bot does now, using `heldPlace()` as the receiver. Couch controls are untouched: `control()` never reaches `draggable()`, and a hold is cancelled when a finger comes back after a pad (R5).

## What the rule tests assert (`src/engine/drag.test.ts`)

1. Without `tapToPlace`, a still tap still ends in `onDrop` at home (today's behaviour, unchanged).
2. With it, a release under `TAP_TRAVEL` of finger travel holds the piece and calls no `onDrop`; 24 or more is an ordinary drag.
3. A touch-down on the catcher glides the piece to that point and calls `onMove` then `onDrop` with it; a refusal floats home.
4. A tap on the held piece, on another draggable, or on a non-place `onTap` target cancels with exactly one `onDrop` at home (or `onCancel`), and the button's own handler still runs.
5. A place `onTap` target puts the piece down at the tap point before its handler runs.
6. Palm on glass and a second finger holding the lock leave the piece held; `cancelHeld()`, `visibilitychange` and `destroy()` end the hold (destroy without a game call).
7. Only one piece is held across handles; `heldPlace()` is null when nothing is held.

## Slices and check tier

1. **P3a, the engine path, with Hat Band moved onto it** (built 2026-11-11; shell tier: typecheck, unit tests, build, one filtered Hat Band play that lifts a hat by tap and puts it on a friend, by drag and by tap, plus `fingerdemo` filtered to Hat Band since its bot's put-down target moves; `couchgames` filtered to Hat Band only if its pad path is touched). `drag.ts` and `input.ts` per R1–R8 with the tests above; `GameScene` calls `cancelHeld()` when it covers a round; Hat Band sets `tapToPlace`, marks its friend spots as places and deletes `HatPiece`'s travel tracking and its own `selected` tap logic where the engine now does it (its glow can read the handle's held state). Hat Band plays the same before and after.
2. **P3b, Block Garden** (built 2026-11-11; existing-game tier: typecheck, its rule tests, one filtered upright play at the top grown-up level placing pieces by tap, one wrong place, a portrait screenshot). It is upright-ready, grown-up and played on phones daily, and its pieces are carried over a bed the thumb covers. Two per-game points: `pick` adds its own lift and `drop`'s in-slot test adds `liftFor`, which a tap-place (no lift) must skip; and its shadow preview comes from its own `globalpointermove`, which never fires on a tap, so the put-down computes the landing square from the tapped point (as `drop` already calls `carry`). The tapped point is the piece's middle, as during a drag.
3. **P3c, Tangram Town's youngest levels** (existing-game tier: typecheck, rule tests, one filtered `creative` play (`CREATIVE_ONLY=tangram`) at level 1 by tap; `fingerdemo` only if the card changes): levels 1–3 (toddler and preschool) set `tapToPlace`; level 8's in-place select and turn keeps its still tap. The dive's *One piece home* level (tap the piece and it flies home, no place tap) waits on the level-order decisions and is not part of this.

Later games take it one at a time, when a playtest note names their drag or their dive asks; a game whose still tap means something (the five above) takes it only after its dive decides which meaning wins.

**Not this path:** tap-to-fill on a coloring page is a fill tool beside a brush, not a piece carried to a place. The TotoLogic review first asked the Rainbow Fingers dive to consider it and withdrew that once the app was played ([P6](../TOTOLOGIC.md#p6-tap-to-fill-withdrawn)); if a phone-width coloring page ever asks, it is a question for the [Rainbow Fingers dive](../deep-dives/rainbow-fingers.md), not for this path.

## As built (P3a, 2026-11-11)

Where the engine differs from R1–R8 as written:

- **R4, the catcher alone is not enough.** Pixi lets a non-interactive drawing (eventMode auto or passive, such as a full-screen backdrop) occlude what is under it in the hit test, so a tap on the backdrop reaches the root stage and never a catcher at index 0. The catcher stays (it guarantees an event on truly empty ground and is the ghost finger's `receiver`), and while a piece is held the engine also listens for `pointerdown` on the root of the piece's display tree: a touch-down that reaches the root, with a target that is not an interactive (static or dynamic) object, is a tap on the ground. An interactive control that is not an `onTap` button keeps its touch and the piece stays held.
- **R5, a touch on the held piece** picks it up again: `onPick` fires, a still release is the cancel (one `onDrop` at home), and a drag from there is an ordinary drag.
- **R1, the option and handle.** `tapToPlace` may be a function, asked at each release. The handle exposes `held`, `placing` (gliding to a tapped place; `dragging` is true then too), `tapped` (the release now reaching `onDrop` was a still tap; false for a put-down or cancel) and `cancel()`; `DragOptions` also has `onCancel`. Hat Band reads `tapped` so a still tap on a worn hat still takes it off.
- **R4, timing.** A place button's handler runs after the hold has ended and the glide has started; `onDrop` arrives when the piece lands 0.22 s later (ended by the scene clock).
- **R5, shell cancels.** `GameScene` cancels a hold when the card opens over a round and when a finger returns after a pad, for every game, so a game's `touchReturned()` need not; `App` cancels it when the pause sheet opens.
- **Hat Band edge.** With a rack hat held, starting a drag on a worn hat now puts the held hat on that friend (the touch reaches the friend's spot) rather than dragging the worn hat off. While a hat is held, worn hats are `eventMode 'none'` so a tap on one reaches the friend under it and the held hat swaps in, as before.


## As built (P3b, 2026-11-11)

- **Option.** Block Garden's tray pieces set `tapToPlace` as a function, `hold(i)`, which refuses when the round is busy or finished or the carry was cancelled. A still tap on a tray piece holds it in its own slot at the tray's size (the engine's breathing is the held look; no shadow shows while held). The next tap on the bed glides it there and plants it.
- **Landing square.** The shadow preview comes from the game's own pointer-move, which never fires on a tap, so `drop()` computes the landing square at put-down from the tapped point (as the piece's middle) via `carry`. Its in-slot test skips `liftFor` for a tap-place, by a per-slot `lifted` flag.
- **Cancel, not a drop at home.** A hold that ends without a place (a tap on the held piece, another tray piece, the undo or round-arrow button, a faded next-tray piece) returns the piece through the engine's `onCancel`. A cancel arriving while the piece is still settling from its lift could otherwise be read by `onDrop` as a drop over the bed on an upright phone, where the tray sits right under the bed.
- **Accounting unchanged.** A tap on a place where the piece cannot go (no room, or the snail's line) is refused exactly as the same drag is: a miss from level 3, where refusals count. Holding, letting go and switching are free. Dragging is unchanged; the how-to card and ghost-finger bot still demonstrate the drag (R8); couch controls are untouched.
- **Check.** `blockgarden` with `GARDEN_LEVELS=tap` plays level 12 at 390×844 by taps.

## Defaults (no open decisions)

- Opt-in per piece, never the default (R1).
- 24 units of finger travel, Hat Band's measure (R2).
- A breathing scale is the held look; no ring, no wiggle (rotation belongs to games that turn pieces) (R3).
- A non-place button cancels and acts in one touch (R5).
- The card demonstrates the drag unless the level's main action is tap-then-tap (R8).
