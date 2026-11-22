# Shell Rows

<!-- generated: from src/games/shell-rows; edit the text below the end mark (npm run game-docs) -->

**ID:** `shell-rows` · **Land:** Puzzle Peaks · **Ages:** pre-K–school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, prediction, logic

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 1–5 |

| Level | Plays like |
| --- | --- |
| 1 | Finish the row: set the third shell |
| 2 | Stop the row: block the pet's two pebbles |
| 3 | Win first: make her own row rather than block |
| 4 | Two ways to win: set a shell that makes two rows at once |
| 5 | Play it out: a whole game with the pet; a tie is a good ending |

<!-- end generated -->

**Starts as:** she and the pet take turns setting shells and pebbles on a 3 by 3 grid in wet sand; one move from a match under way

**Grows into:** level 1 (pre-K, school): two shells in a row and a gap, set the third to finish the row. Level 2 (pre-K, school): the pet has two pebbles in a row, set a shell in its gap to stop it. Level 3 (school): both a win and a block are on the board, take the win. Level 4 (school): a fork puzzle, set a shell that makes two rows at once (any fork square counts). Level 5 (school): a whole match with the pet, a tie is a good ending; a pet three is one miss and rewinds to her turning point. Levels 1–4 are three positions a round: an authored first one, then two drawn from the level's pool (39, 69 and 81 classes). A wrong empty square is a miss and the pet plays its honest reply (takes her gap, completes its row, or takes the three she could have had); the deciding row glows with the spoken reason, then the board rewinds. A second miss on a position glows the right square (one hint); Show me glows it, asked again the ghost sets it (still one hint). Occupied squares and taps during the replay count nothing. Puzzle Peaks

## Design notes

*Levels 1–3 · after the strategy-games study; [definition](../definitions/shell-rows.md).* A 3 by 3 grid drawn in wet sand with a match already under way: her shells against the pet's pebbles, her turn. She sets one shell; the pet then plays its honest reply when she is wrong. Three positions a round: the first is the authored straight-row opening under a seeded symmetry, the other two are drawn from the level's pool (39, 69 and 81 classes, recounted by the rule tests). Shell colours are seeded from pink, orange, purple, teal and blue.

Levels: 1 "Finish the row" (pre-K 1, school 1): two shells in a row and a gap; set the third. 2 "Stop the row" (pre-K 2, school 2): the pet has two pebbles in a row; set a shell in its gap. 3 "Win first" (school 3): both a win and a block are on the board; take the win. No preschool range.

Misses and hints: a wrong empty square is one miss, and the pet plays its honest reply (takes her gap, completes its own row, or takes the three she could have had); the deciding row glows with the spoken reason, then the board rewinds. A second miss on a position glows the right square (one hint). Show me glows it; asked again, the ghost sets it (still one hint). Occupied squares and taps during the replay count nothing. One sticker per round. Shells are set on touch-down. The ghost finger plays levels 1 and 3. The co-play line asks "What will the pet do if you go there?"; the off-screen idea is noughts and crosses on paper. Levels 4–5 are below.

*Levels 4–5 · batch `shell-rows 2`, 2026-11-22, PR #2000; [definition](../definitions/shell-rows-4-5.md).* Level 4 "Two ways to win" (school 4): fork puzzles drawn from a pool of 24 classes (17 with exactly one fork square); any fork square is accepted. A wrong square gets the pet's honest reply (the counts recounted by the rule tests: 48 stopped-one, 19 took-best, 9 look-two). Level 5 "Play it out" (school 5): a whole match from an empty board, she goes first. The pet takes a win, else blocks, else plays a hashed quiet move (no planning, so her forks work); against that pet a rule-follower wins about 31%, ties 51.5% and loses 17.4%. A pet three is one miss and rewinds to her turning point; a second loss glows once per match; a tie is a good ending; a full-square tap restarts the six-second "Your turn!" wait. Best (win-seeking) play wins 92.7%; the minimax-best forks-first player the ghost uses wins 58.3% and ties 41.7%, never losing. Ten new `sr.*` voice lines, nine new clips (184 KB; "Your turn!" reuses one), and a level-scoped how-to card. The `shellrows` browser suite plays levels 4 and 5 behind `SHELL_LEVELS` (for example `SHELL_LEVELS=4,5`; default plays all). The grown-up seat (batch `shell-rows 3`) is not built.

**Upright on a phone (2026-11-18, upright batch 10):** every level plays upright, tested on the existing `layout`. One change: in portrait the board now sits in the middle of the room between the piles' strip and the pet's row; it used to hug the top, under Home and over the sun, far from a thumb on a tall phone. This also moves it 85 units down on a 768 × 1024 tablet held upright. Layout test: `upright.test.ts`.
