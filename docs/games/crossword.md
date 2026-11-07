# Crossword

<!-- generated: from src/games/crossword; edit the text below the end mark (npm run game-docs) -->

**ID:** `crossword` · **Land:** Story Grove · **Ages:** pre-K–grown-up · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spelling, letters, vocabulary

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 2–4 |
| grown-up | 5–6 |

| Level | Plays like |
| --- | --- |
| 1 | One letter, two words |
| 2 | Two crossings |
| 3 | Picture criss-cross |
| 4 | Say what it is |
| 5 | Written clues |
| 6 | The mini |

<!-- end generated -->

**Starts as:** drag letters into a little crossword of picture words; one letter can serve two words

**Grows into:** level 1 (pre-K): three 4 by 4 puzzles of two crossing three-letter picture words, only the crossing square blank, a bank of the right letter and two decoys; level 2 (pre-K, school): two puzzles of three words in a chain (23 picture words), the crossings and each first letter blank; tap a picture to hear its word, a full wrong word is one miss, wrong tiles hop back with a spoken spelling, two misses glow the next square and tile, Help is a hint; level 3 (school): one themed grid of four crossing words (6 by 6 at most), every letter blank, a bank of the word's missing letters plus two decoys, the theme named at the start; level 4 (school): one free criss-cross of four of 15 drawn picture words (6 by 6 at most), every letter blank, the same bank, a speaker in each clue square that says a riddle (free), and a Show me eye that reveals the picture and says the word (one hint, once per word); level 5 (grown-up): *Written clues*, one free criss-cross of 7–8 of 44 farm, kitchen and garden words (8 by 8 at most, 64-unit squares), each with one written clue read in a clue bar (a speaker key reads it aloud), typed on A–Z keys (a hardware keyboard works while the game is live), judged only when every square is filled (a wrong check is one miss and circles the wrong squares), Help reveals one right letter (a hint); level 6 (grown-up): *The mini*, one of six frozen, fully checked 5 by 5 minis with block squares and 10 clues

## Design notes

*Levels 1–6 built · Story Grove · [definition](../definitions/crossword.md).* She drags letters into a small crossword of picture words, where one letter serves two words. Pre-K plays levels 1–2, school levels 2–4, grown-up levels 5–6. Skills: spelling, letters, vocabulary. Every picture clue square (Pond Typing's `typingPicture` art, an arrow showing the direction) taps to say the word and make it the active word; tapping a square or crossing again switches word.

**1 One letter, two words:** three 4 by 4 puzzles a round, each two crossing three-letter picture words (Pond Typing's 13); only the crossing square is blank, and the bank is the right letter plus two decoys (no decoy spells a level-1 word). **2 Two crossings:** two puzzles of three words in a chain (23 drawn picture words, no pip) on at most 5 by 5; the blanks are the crossings and each word's first letter, and the bank is the active word's missing letters plus one decoy (at most 4 tiles). **3 Picture criss-cross** (school): one themed grid of four words, each crossing an earlier one, at most 6 by 6 with clue squares; every letter square is blank and the bank is the active word's missing letters plus two decoys (at most 6 tiles; two columns beside the grid in landscape, two rows of three under it upright). The theme name is said first (`cw.theme`). Word Search's Animal friends and By the pond are too small to cross four words in 6 by 6, so they are widened with drawn level-2 picture words; Animal friends yields only 2 distinct grids. **4 Say what it is** (school): 15 already-drawn picture words (cow, pig, hen, duck, cat, dog, fox, frog, bee, sun, moon, rain, tree, boat, cake; no new art), each with a spoken riddle (`cw.riddle.<word>`, mostly animal-sound clues). One free criss-cross of four words at most 6 by 6 (five do not fit with this set), every letter blank, the bank the missing letters plus two decoys; about 33 distinct grids per 100 seeds. Each clue square shows a speaker: tapping it picks the word and says the riddle (free), and the first word's riddle is read after the instruction `cw.four`. **Show me** (an eye above Help) reveals the active word's picture and says the word: one hint, once per word; pressed again it repeats the word for free. A solved word's speaker becomes its picture. A wrong full word is one miss: "That spells X. The riddle is about Y."

**Misses and help.** Tiles drag in and out; a tile dropped on an occupied square sends the old one back. A full wrong word is one miss (a crossing is judged once), the wrong tiles hop back and the pet says "That spells X. The picture is Y."; two misses on a word glow its next square and tile, free. Help (?) clears wrong tiles in the words through its square and places one right letter, preferring a crossing: one hint, never a miss. One sticker per puzzle round, with help. Rules and the word sets are in `src/games/crossword/logic.ts` (rule tests include level 4's riddle set and grid properties); voice lines are `cw.*`; the how-to card has a ghost-finger demonstration.

**5 Written clues** (grown-up): one free criss-cross of 7–8 words from one of three Word Search everyday themes (farm 14, kitchen 14, garden 16 words, each with one written clue), the theme named at the start (`cw.five`); at most 8 by 8 at 64-unit squares (the definition said 9 by 9; 8 keeps the keyboard beside the grid at 1024 x 768), words may cross more than one placed word, standard crossword numbers, no clue squares. A clue bar above the grid shows "N Across/Down: clue" and a speaker key reads it aloud (`cw.clue`, free). **6 The mini** (grown-up, `cw.six`): one of six frozen, fully checked 5 by 5 minis (koala, toast, haven, trend, limit, opera), each 10 words, rotationally symmetric dark blocks in three patterns; a round picks one with the seeded RNG ("not the last one" is not built: no new save field). **Typing and judging.** Tap a square to select it and its across word, again for its down word; A–Z keys (64 units; four columns of seven right of the grid in landscape, seven columns of four bottom-right upright), backspace and Help; a hardware keyboard (letters, Backspace) works only while the game is live (not paused, under the how-to card, in the demo copy, behind the grown-ups' page or in a form field). Nothing is judged until every square is filled; a wrong check is one miss and circles the wrong squares (still editable), and the grid is checked again only once every circled square has changed, so fixing costs at most one more miss (`cw.circled`; `cw.solved`). Help reveals one right letter of the selected word, preferring a crossing (locked, blue): one hint each. One sticker per round. Rules, the 44 clued words and the minis are in `src/games/crossword/grown.ts` and `clues.ts`, the scene in `grownup.ts`; the ghost finger taps the next wrong square then its key. Not built: the couch.
