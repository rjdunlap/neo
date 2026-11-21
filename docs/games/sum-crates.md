# Sum Crates

<!-- generated: from src/games/sum-crates; edit the text below the end mark (npm run game-docs) -->

**ID:** `sum-crates` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Partitions of a number: which fruit pairs and triples make a sign, and using a crossing line to decide between them

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Two lines cross: four or five crates, every line two crates long, fruit 1 to 5 |
| 2 | A longer line: six or seven crates, lines of two or three, fruit 1 to 6 |
| 3 | Nine and no repeats: ten crates in a 5×5 stack, lines of two to four, fruit 1 to 9 |

<!-- end generated -->

**Starts as:** a small stack of wooden crates with a number sign at the start of each row and column: she taps a crate and then a numbered fruit (or drags one in) so every line adds up to its sign with no fruit twice in the same line; the board has exactly one answer, found by using the crossing line to choose between the pairs that make a sign.

**Grows into:** lines of up to three crates and fruit 1 to 6 (level 2), then ten crates in up to a 5×5 stack with lines of up to four and fruit 1 to 9 (level 3, the grown-up band's own level). A 6×6 grown-up stack with a par, a younger two-fruit opening and a "must contain" pencil mark are not defined.

## Design notes

Built from [the definition](../definitions/sum-crates.md), levels 1-3, upright from the first slice.

- **Boards** are generated in `logic.ts` from the seeded RNG: a connected shape of the level's crate count, a fruit for every crate with no repeat in a line, signs read off the fruit, kept only if an exhaustive search finds exactly one fill and a rule-only solver finishes it within a per-level cap on line eliminations (12, 24 and 40; a seeded sweep measured at most 7, 17 and 25). The solver is position-aware: for each line it keeps, in every crate, only the fruit that some way of making the sign with distinct fruit still allows. Its steps are the hints and the ghost finger's route. The stack is trimmed to its own bounding grid, so a level 1 board of four crates is a 2×2 and one of five is a 3×3.
- **Placing:** tap a crate (a ring shows) and then a fruit; tap a filled crate and its fruit goes back and the crate is chosen; a fruit tapped with no crate chosen chooses the first empty crate. Dragging a fruit onto a crate works the same and the dragged fruit always glides home, so the tray never runs out. Placing and removing are never judged.
- **Read-back:** a line that is full and wrong shows the number it made under its sign and says "this makes N, we need M" once; a repeated fruit wobbles and is ringed. Both are free.
- **Misses and hints:** a full stack with a wrong line is one miss; the identical stack judged again is free and a changed one counts again; after two misses the glow hint appears (counted as a hint) and the Hint button counts once per press. A fruit that is not in the answer is the hint's first target ("take it back").
- **Fruit art:** `fruit()` from Fruit Sums (exported, with a new `dots` option that shows the number as dots under a smaller numeral) with one colour for each number 1 to 9.
- **Layout:** `layout.ts` is pure. Upright, the heading, stack and tray stack from the top, Hint sits at the foot right clear of the guide, and when the caption comes as a bubble the stack and tray stay above it. Crates and tray fruit are 100 units or more at school; on the shortest captioned phone the grown-up level shrinks them together, never below 64. The thumbs table records 50.8 px for tray fruit and the button.
- **Finish:** the loaded crates hop in a wave, one sticker through `ctx.finish`. The definition's cart is not drawn.
- **Not built yet:** tapping a sign to hear it read ("seven across"): a sign is a 50-unit badge and a larger hit area would take taps from the crates beside it.
- **Checks:** the `sumcrates` browser suite (`SUMCRATES_ONLY=upright` for the 390×844 phone check) and the ghost-finger demo (`FINGER_ONLY=sum-crates`).
