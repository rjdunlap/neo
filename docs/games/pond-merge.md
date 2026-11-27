# Pond Merge

<!-- generated: from src/games/pond-merge; edit the text below the end mark (npm run game-docs) -->

**ID:** `pond-merge` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** ordering, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1 |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Make a duck |
| 2 | Make a goose |
| 3 | Make a swan |

<!-- end generated -->

**Starts as:** drop sleepy friends into a round pond; two of the same size that touch pop into the next size up, from egg to chick to duckling to duck

**Grows into:** levels 1–3: make a duck from eggs and chicks, a goose with ducklings added, then a swan with a longer pile to plan (levels 1 for pre-K, 1–3 for school)

## Design notes

*After Suika Game; Tinker Lab; levels 1–3 built ([definition](../definitions/pond-merge.md)).* A row of friends waits above the pond; she slides the one at the top along the line and lets go. There is no fail line, score, clock or wrong drop: a full pond **lifts** (the smallest friends float away as bubbles; the biggest are never removed) and the round goes on. The round ends when the goal size appears, with one ordinary sticker, with or without help.

The rules are in `logic.ts`: a handwritten fixed-step (1/120 s) circle-pile solver with no physics library and `src/engine/` unchanged. Three details beyond the definition: a piece with something under it loses most of its downward speed each step (a tall pile otherwise keeps sinking a little and never counts as still); two touching pieces each give way by at least a quarter of an overlap, so a small friend under a big one is not crushed; and the sweeps over pairs alternate bottom-up and top-down. The seeded drop sequence comes in blocks of six with every size an even number of times, so equal neighbours can always be made; the first two are always the smallest size. **Take back** restores a snapshot of the pond before the last drop, so it is exact and free. A greedy player that follows `hintDrop` finishes every level on every tested seed within `MAX_DROPS` (40, 50 and 80), and never needs a lift.

Misses are always 0. Hints count one per press of the lightbulb (the ghost drop), and once per round when eight drops in a row make no merge. The board is a fixed 420 × 560 box that is never scaled, so it lays out the same sideways and upright (`pondLayout`); both buttons are 130 × 100 units and the chain strip (egg to swan, goal ringed) sits beside the board sideways and above it upright. The ghost finger slides the held friend to the hint's `x` and lets go; it waits until the pile is still. Sound is a plop on a drop and a pentatonic note one step higher per size on a merge.

Not yet: a preschool entry (it waits on a phone playtest of the drop gesture), a grown-ups' window best size, and Roll Table, which may later share the solver.
