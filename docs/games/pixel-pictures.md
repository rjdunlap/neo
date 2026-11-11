# Pixel Pictures

<!-- generated: from src/games/pixel-pictures; edit the text below the end mark (npm run game-docs) -->

**ID:** `pixel-pictures` · **Land:** Painted Canyon · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spatial-reasoning, symmetry, logic, art

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1, 9, 2 |
| pre-K | 1, 9, 2, 3, 10 |
| school | 3, 4, 5, 6, 7, 8, 11, 12, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Copy a small picture on a 4 by 4 grid |
| 2 | Copy a two-color picture: pick a color, then tap squares |
| 3 | Finish the other half: make both sides match like a mirror |
| 4 | Picture logic: the numbers say how many squares in a row are filled |
| 5 | Bigger picture logic: 6 by 6, with numbers for runs like "2 1" |
| 6 | Two-color picture logic: each run has its own color |
| 7 | Both ways: copy a quarter across two mirror lines |
| 8 | Twice as big: copy a little picture at double size |
| 9 | Two colors, small: pick a color, then copy a 4 by 4 picture |
| 10 | My own picture: color any squares, then tap Done |
| 11 | Ones and zeros: flip four cards to write one row of squares |
| 12 | Ones and zeros, a whole picture: write each row with four cards |

<!-- end generated -->

**Starts as:** copy a small picture square by square

**Grows into:** two colors (a small 4×4 one for the youngest), finishing a mirror half, picture-logic puzzles with row and column numbers and two-color clues, copying a quarter across two mirror lines, copying at double size, a free "My own picture" on a blank 5×5, writing a row of squares from four ones-and-zeros cards, then a whole 4×4 picture one row at a time; keep the last finished design in the treehouse

## Design notes

*After Picross and Mario Paint.* Tap squares to copy a small picture (4×4, then 5×5 with two colors from a palette), finish a mirror half (the left half is drawn), then solve picture-logic puzzles (nonograms) from run numbers along rows and columns. Level 7 *Both ways* draws one 3×3 quarter of a 6×6 picture (snowflake, window, flower, gem, target or sparkle; two per round) with two dashed mirror lines, and she copies it into the other three quarters; level 8 *Twice as big* shows a 3×3 model (plus, cross, arrow, corner or smile; two per round) beside the 6×6 board, where each model square becomes a 2×2 block (faint block lines), and the reveal says it is twice as wide and twice as tall. Level 9 *Two colors, small* is a 4×4 two-color copy (ladybird, carrot, apple or little chick; three per round) placed by `order` right after level 1 for preschool (1, 9, 2) and pre-K (1, 9, 2, 3); `entryLevels: [9]` means a birthday or pin carrying her into school lands on 3, not 8, and level 1 is still every younger band's first level. Level 10 *My own picture* (pre-K and school, last in each band's `order`: pre-K 1, 9, 2, 3, 10, school 3–8, 10) is a free level: a blank 5×5 with four paints (red, yellow, blue, green) in a column beside the board; a tap paints an empty square and a tap on a coloured one empties it; nothing is a miss or a hint. A green check Done button (radius 60) pops in once four squares are coloured and hides again below four, so a design needs at least four squares; Done says `pixel.mine` and finishes with the design as the round's creation (the usual `size`/`pixels` picture, size 5), which can be kept for the treehouse picture board. Co-play: take turns, one names something to draw and the other colours it; the ghost finger draws a red heart, clearing stray squares first, then presses Done. Level 6 gives each run clue its own color, so both the length and color of every run matter. Earlier single-color puzzles use only pictures that row-and-column logic alone can solve (rule-tested); level 6 pictures must be solvable by colour line logic (`colorLineSolvable`: same-color runs need a gap, different colors may touch). Pools are larger than the pictures shown (level 2 draws 3 of 6, level 9 draws 3 of 4, level 6 shows 2 of 5), so rounds vary. A square that should stay empty is a gentle miss and, on logic levels, gets a gray cross. At levels 7–8 a wrong square is a gentle miss (`pixel.notmirror2`, `pixel.notbig`); two misses glow the open square nearest her last tap at 7 and every open square of the block nearest her last tap at 8, one hint either way. Two misses on the other levels glow a useful square: levels 4–5 one the numbers settle, level 6 one the colored numbers settle (keeping the color in hand where it can, nearest her last touch) and select its color; on the two-color copy levels 2 and 9 the glowing square also selects its color; the ghost finger follows the same squares. The finished picture shows in its colors and is named; after the round, the final design can be kept on the treehouse picture board.

Level 11 *Ones and zeros* (`bits.ts`, rules in `logic.ts`) is a different action: four bit cards (120 × 140) flip between 0 and 1; a free yellow arrow reads them left to right into her row of squares (a 0 shows a hollow outline); the green check reads, then compares the row with the one to make, under a key card (1 filled, 0 empty). Three seeded distinct rows per round (never 0000), each in a seeded one-colour paint; a right row slides to a shelf with its digits printed beside it. A failed check is one miss and every second failed check on a row is one hint: the first differing card glows, or, if it is still glowing, is flipped for her (the check stays hers). Flips and the arrow never count. One ordinary sticker, no creation to keep. The game says only "ones and zeros", "cards", "row" and "key" (never byte, binary or code). The school order is 3, 4, 5, 6, 7, 8, 11, 10; the ghost finger flips the needed cards, presses the arrow, then the check. The game is not upright-flagged, so at 390 × 844 the level is laid out on the 1024-wide area. The new voice lines use device speech until a clip run includes them. The school order is now 3, 4, 5, 6, 7, 8, 11, 12, 10 (see below).

Level 12 *A whole picture* (`bitsPicture` in `bits.ts`; `bitRowsOf` and the level-12 `bitsLayout` in `logic.ts`) uses the same four cards to write a 4×4 one-colour picture one row at a time, top to bottom, beside a preview board (squares 64–100 units) with the digits beside it and the picture to write where the shelf was. Two of five pictures per round, eight rows; the cards return to 0000 after each row, and an empty row is right as it stands (no flip needed). Failed checks count as at level 11 (a miss, every second one a hint). After row 4 the existing `pixel.reveal` names the picture, then `pixel.bits.same` says the squares and the digits are the same picture; the last picture is the kept creation (the usual 4×4 `size`/`pixels` shape). New voice lines `pixel.bits.picture`, `.emptyrow` and `.same`; the ghost finger and how-to cover level 12.
