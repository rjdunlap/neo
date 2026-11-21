# Bunny Patches

<!-- generated: from src/games/bunny-patches; edit the text below the end mark (npm run game-docs) -->

**ID:** `bunny-patches` · **Land:** Puzzle Peaks · **Ages:** pre-K–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Ruling squares out: a bunny covers its row, column, patch and neighbours, so what is left shows where the next one goes

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1 |
| school | 2–3 |
| grown-up | 3 |

| Level | Plays like |
| --- | --- |
| 1 | A bunny for every patch: 4×4 meadow, one bunny already sitting, reach shown |
| 2 | Rule it out: 5×5 meadow, reach shown |
| 3 | Where is it forced?: 6×6 meadow, paw marks, reach lamp off until she turns it on |

<!-- end generated -->

**Starts as:** a 4×4 meadow of coloured patches with one bunny already sitting: she taps squares to put one bunny in every row, column and patch, and the shaded reach of each bunny shows what it rules out.

**Grows into:** a 5×5 meadow where the reach is shown, then a 6×6 meadow (school and grown-up) with paw marks to cross out squares and a reach "Lamp" that starts off and is hers to turn on. Larger grown-up rungs with a par are not defined.

## Design notes

Built from [the definition](../definitions/bunny-patches.md), levels 1-3 (PR #1915), upright from the first slice.

- **Patches** are drawn by colour plus a pattern, never hue alone. Level 1 locks its given bunny (a flag on the board).
- **Misses and hints:** a wrong full board is one miss; judging the identical board again is free, and a changed wrong board counts again. Clashes wobble and ring free. A glow hint comes after every second miss (counted as a hint), and the Hint button counts once per press.
- **Level 3 marks:** a tap cycles empty, paw, bunny, empty. The reach Lamp is off by default and remembered per level in `localStorage`.
- **Layout:** `layout.ts` is pure; squares are at least 100 units on every upright view, and a wide board slides right of the Home column. The thumbs table records 50.8 px for the button.
- **Departures from the definition:**
  1. The definition gated levels 1-2 on a basic solver. Over 3000 seeded 5×5 attempts, 77 had a unique answer and none of them was finished by the basic rules alone (22 by the advanced rule). So levels 2 and 3 both use the advanced rule ("k patches inside k rows or columns") as the human gate; level 1 uses the basic rule only.
  2. The definition's sample 5×5 and 6×6 boards are not solvable by the human solver, so the audited fallbacks (`FALLBACK` in `logic.ts`) are two new balanced boards found by seeded search.
  3. Seeded generation at level 3 needs up to about 12000 bounded attempts (about 25 ms per round on the author's Mac).
- **Checks:** the `bunnypatches` browser suite (`BUNNY_ONLY=upright` for the 390×844 phone check) and the level 1 ghost-finger demo; see the [verification entry](../verification/2026-11-20-bunny-patches-levels-1-3.md).
