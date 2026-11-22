# Campsite

<!-- generated: from src/games/campsite; edit the text below the end mark (npm run game-docs) -->

**ID:** `campsite` · **Land:** Puzzle Peaks · **Ages:** school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Reasoning from constraints: row and column counts and the no-touching rule rule squares out until each tree has one place left for its tent

| Band | Levels, easiest first |
| --- | --- |
| school | 1 |

| Level | Plays like |
| --- | --- |
| 1 | Pitch the tents: 4×4 camp, three trees, a tent beside each tree, row and column counts, no tents touching |

<!-- end generated -->

**Starts as:** one authored 4×4 camp with three trees: she pitches a tent beside each tree so every row and column matches its count sign and no two tents touch, even at a corner, then taps Check camp. The counts and the corner rule rule squares out until each tree has one place left.

**Grows into:** nothing yet. Larger camps, a school ladder and a grown-up band need their own definition ([definition](../definitions/campsite.md)).

## Design notes

- The board, the checks and the hint order live in `logic.ts`; the one answer (R1C2, R3C3, R1C4) is proved by trying all 286 ways to pitch three tents. Pairing each tree with its own tent is a matching, so a tent beside two trees serves one and placement order never matters.
- Check camp judges in a fixed order and says the first reason: tents touching, a wrong row or column count, then trees without their own tent (outlined in red). Fewer than three tents says how many are left, free. Each new full wrong camp counts one miss once per round, however often it is checked; every second miss shows the hint by itself.
- Hints pack up the first stray tent in row order with the reason she can see (a zero sign, no tree beside it, or in another tree's way); otherwise they glow the next square of the authored deductions, ringing the tree it serves and, for the first and third, the row sign the reason leans on.
- A tree tap lights the grass beside it and says so, free; the opening lights the top-left tree's sides. A fourth tent is refused with "Pack up a tent to move it". Touching tents wobble in a red ring.
- Layout (`layout.ts`): supply and column signs above the camp, row signs on its right, Check camp and Hint at the bottom beside the guide upright and in a column on the right sideways; squares at least 100 units on every phone view (`upright.test.ts`).
