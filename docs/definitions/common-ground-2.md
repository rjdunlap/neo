# Common Ground, level 2: A request changed (definition)

Defined 2026-11-25 as the next level of [`common-ground`](common-ground.md) (level 1 built the same day, school only), named there as "2, a request changed after the preview". Docs only: no code, ID, voice line, art or save field exists yet. Level 1's rules, counts and files are unchanged; this level adds a second phase to the same round. It follows the same idea as [Ready for Adventure, level 4](ready-for-adventure-4.md): the first answer is a draft, and the friend's *request* changes through no fault of hers.

**Fun action and purpose:** she arranges the room and presses *Visit* exactly as in level 1. The friend walks in and is about to sit, then adds, "Oh, could my basket be on a different side of the cushion?" The room is repaired, not rebuilt: she moves the basket (and may undo or move anything else), then presses *Visit* again. The learning purpose is **revising a plan when someone else's stated wish changes**: compare the room with the new wish, change only what the new wish touches, and notice that the cushion's place still keeps the first promise. Nothing here is a mistake being fixed; an unrevised room was a good room for the old request.

## Overlap

Checked against `origin/main` at `4dbfd4161`. Level 1's table stands. The only neighbour is Ready for Adventure 4, which repairs a packed bag against a changed card; here the repair is *spatial* (a side of a piece, judged by cells), and the friend, not a card, speaks the change. No other game revises an accepted answer on a floor.

## The model (`logic.ts`)

Everything stays integers on the 2×3 floor of level 1. Nothing new is compared in pixels. New names are additions beside the level-1 exports; `check`, `place`, `lift`, `beside`, `neighbours` and `hintAction` are not changed for level 1.

- **A side** is the direction of the basket from the cushion: `left`, `right`, `above` or `below`, from the cells' row and column (`sideOf(cushionCell, basketCell)`; null when the two cells are not beside each other, so a diagonal has no side).
- **The preview:** phase 1 is level 1 exactly. When its `check` is `ok`, the round records the **previewed side** `s0 = sideOf(cushion, basket)`. The friend walks in and starts to sit.
- **The change:** the second request replaces the first bubble's second half: the basket must be beside the cushion **on a side other than `s0`**. The first request (the cushion is in the fixture's row) is unchanged and still hard. One change kind only at this level (an open decision names the other).
- **`check2(room, fixture, s0)`:** `unplaced`, then `ok`, or `cushion` (not in the fixture's row), `basket` (not beside the cushion), `same` (beside, but on side `s0`), or the first failing of cushion-then-basket-then-same when more than one fails. A second Visit is accepted only on `ok`. The plant is ignored, as in level 1.
- **Always solvable from where she stands:** every cell has at least two neighbours, so for every cushion cell in the fixture's row and every `s0` there is at least one other side with a cell on the floor, and the preview's own cushion cell is among the accepted cushion cells only when a different side exists for it. The tests prove this exhaustively (below); a change that left no legal arrangement is a bug.
- **Counts the tests re-derive** (window; the door is the mirror image, `above` for `below`): the accepted cushion-and-basket pairs after the change are 5 for `s0 = right`, 5 for `left` and 4 for `below` (the cushion in the top row, the basket on any other side that exists on the floor), each times the plant omitted or on one of the 4 free cells, so 25, 25 and 20 accepted arrangements.
- **The preview stays on screen.** The previewed basket cell is kept as a dashed outline (the *ghost of the old place*) so she can see what changed; the ghost is drawing only and never changes a verdict.
- **Undo:** the second phase keeps a stack of her moves since the change. `undo(room, stack)` pops one move; at the bottom the room is the previewed arrangement. It is a drawing aid; nothing is judged by it.
- **`hintAction2(room, fixture, s0)`:** one legal move toward `ok`, never the only answer and never undoing a kept request: the cushion not in the row moves into the row along its column; otherwise the basket moves to the first cell beside the cushion, in reading order, whose side is not `s0` (an empty cell before one holding the plant). Null once `ok`.
- **Seeded appearance only,** as level 1, and one more draw: nothing about the change is seeded beyond `s0`, which the player chose.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 1 | *A place for you: arrange two things so a friend’s two requests are kept* | Unchanged |
| 2 | *A request changed: the friend asks for the basket on a different side, so revise the room* | Level 1's round, then one changed request |

`school` only, `LEVELS = { school: { min: 1, max: 2 } }`. Two smooth rounds of level 1 step up to level 2 through `difficulty.ts`; two struggling rounds step down; grown-ups can pin it with `store.pin`. A round is one visit and still gives **one sticker** after the second Visit; level 2 is not two rounds. Saved levels and pins are not renumbered.

### First round

The window, the bunny. She puts the cushion top-left and the basket on its right (`s0 = right`; the cell below the cushion is free) and presses *Visit*; the bunny walks to the cushion. "Oh, could my basket be on a different side of the cushion?" The dashed outline marks the old place. She drags the basket to the cell below the cushion, presses *Visit*, and the bunny sits and reads.

## Screen and controls

Everything in level 1's screen applies. Added:

- **The changed bubble:** the second request bubble is replaced by a new one: the basket beside the cushion with the previewed side crossed out in a soft colour and a small arrow to "any other side". Tapping it replays the new words. It carries the same green tick when its rule holds. The first bubble is untouched and keeps its tick.
- **Undo** is a large button (at least 100 units, with the 10-unit pad) beside *Visit*, visible only in phase 2, disabled at the bottom of the stack. *Visit* behaves as in level 1.
- No new drag rules: a drop is never wrong, and a swap on an occupied cell is the same swap as level 1.

## Accounting, help and finishing

- **Phase 1** is level 1: a Visit that is not `ok` is one miss, moves are free, hints as in level 1.
- **Phase 2:** a Visit that is not `ok` is one miss and names the one unmet part (`cushion` first, then `basket`, then `same`). Help, or the glow after two misses in the *round* so far counting phase 2 alone, plays `hintAction2`. Using it is a hint. After two hints in the round a third is carried out by the pet, so the round can always finish; it is supported, not independent, as everywhere.
- **Adaptation:** misses and hints count across both phases, as one round, through `ctx.finish({ misses, hints })`. A preview that was `ok` on the first Visit with no miss does not make the change a miss.
- **Finish:** after the friend has read a moment the voice says the finishing line and the shell awards the sticker. The sticker is the final room (the revised side), seeded as level 1's. Nothing is saved; no creation is kept.

## Speech (`voice.ts`)

`{name}` is her name. The friend only states what the friend asks for; nothing blames a placement or a change of mind, and no feeling is left for her to guess. New lines carry `{name}` or `{fixture}` so they stay on device speech; no voice clip is rendered in the build slice.

| Moment | Line |
| --- | --- |
| The change (`ctx.instruct`) | "Oh, {name}, could my basket be on a different side of the cushion?" |
| Visit with the basket on the old side | "My basket is still on the same side, {name}." |
| Visit with the basket not beside the cushion | "My basket is not beside my cushion yet, {name}." (level 1's line) |
| Visit with the cushion misplaced | level 1's line |
| Hint | level 1's line |
| Revised room is `ok` | "That is a better side. Thank you, {name}!" |
| Finish | level 1's finish line |

## Rule tests (`logic.test.ts`)

1. `sideOf` over all 30 ordered neighbouring pairs gives the four sides and null for every diagonal and non-neighbour.
2. For both fixtures and every `s0` a level-1 `ok` arrangement can produce, `check2` over all complete arrangements returns `ok` for exactly 25, 25 and 20 (right, left, below; the door mirrors) and the right reason code for the rest; every preview's own arrangement is `same` when only the basket's side is wrong, never `ok`.
3. Always solvable: for every fixture, `s0` and level-1 `ok` arrangement, some `ok` arrangement exists, and repairing the preview needs at most two moves (a basket move; at most one more if the plant is in the way).
4. The plant and the ghost never change a verdict.
5. `hintAction2` from every reachable incomplete state is a legal move, reaches `ok` in at most three moves, and never moves a piece that already satisfies a request.
6. `undo` restores the previewed arrangement exactly when the stack is emptied, for any sequence of moves.
7. Level 2 is `school` only; level 1's tests and counts still pass unchanged; `describeLevel` has both levels.

## Ghost finger, how-to card and registration

- **How-to card:** a level-2 card in `howto.ts`: the friend's changed bubble, a finger dragging the basket to another side of the cushion, then *Visit*.
- **Ghost finger:** `autotouch()` at level 2 plays phase 1 by `hintAction`, adds the plant some of the time, presses *Visit*, then follows `hintAction2` and presses *Visit*. A unit test runs 50 seeds with every one reaching `ok` in both phases with no miss. `fingerdemo` plays level 2 once.
- **Files:** `src/games/common-ground/` (`logic.ts`, `logic.test.ts`, `index.ts`, `howto.ts`, `voice.ts`, `art.ts` for the ghost and the crossed bubble), `docs/games/common-ground.md` (the Grows into line, `npm run game-docs`), the social-emotional study's build line, and a verification entry. No new land, ID or band.

## Check tier

New interaction on an existing game: typecheck, rule tests, one filtered scripted play of level 2 (a Visit on the old side, a hint and its assisted drag, then a kept revision with Undo used once), one portrait screenshot, and `fingerdemo` at level 2; `npm run build` only if shared files change. Whether a six-to-eight-year-old finds the change fun and fair stays a person check, not a gate.

## Open decisions

1. **Change kind.** Default: one kind, "a different side". Later levels may add "the friend now wants the door instead" (the fixture row changes and both pieces may move), which would need its own definition.
2. **The ghost outline.** Default: shown in phase 2. If it reads as the answer's opposite, hide it; the rule tests do not change.
3. **Undo depth.** Default: the whole stack back to the preview. A one-step undo is the fallback if the stack proves confusing.
4. **Pre-K.** Default: none, as level 1.
