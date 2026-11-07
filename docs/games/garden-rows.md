# Garden Rows

<!-- generated: from src/games/garden-rows; edit the text below the end mark (npm run game-docs) -->

**ID:** `garden-rows` · **Land:** Puzzle Peaks · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** logic, deduction, patterns, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| preschool | 10, 1 |
| pre-K | 1–3 |
| school | 3–9 |

| Level | Plays like |
| --- | --- |
| 1 | Plant the missing flower in each row of a 3 by 3 bed |
| 2 | Rows and columns: no flower repeats in a row or a column (3 by 3) |
| 3 | A 4 by 4 bed with a few flowers missing |
| 4 | A 4 by 4 bed with more flowers to work out |
| 5 | A 4 by 4 bed with only a few flowers planted to start |
| 6 | A 5 by 5 bed: rows and columns, five kinds of flower |
| 7 | Mend the bed: two flowers in one row swapped places; find them and swap them back (4 by 4) |
| 8 | Hedge boxes: no flower repeats in a row, a column or a 2 by 2 hedge box (4 by 4) |
| 9 | Hedge boxes with fewer flowers to start (4 by 4, ten spots empty) |
| 10 | One row of three flowers: plant the missing one (three rows in turn) |

<!-- end generated -->

**Starts as:** plant a 3 by 3 flower bed so each row has one of every flower

**Grows into:** preschool opens on level 10, One row (a single row of three spots with two planted, one empty and three packets, the gap in a different place each bed), rows and columns, 4 by 4 beds with fewer flowers to start, a 5 by 5 bed, school level 7, Mend the bed (a full bed with two flowers swapped, so two columns repeat; lift them and replant), and school levels 8–9, Hedge boxes (4 by 4 beds where each 2 by 2 hedge box also needs one of every flower); each bed draws its flowers from the seed, every planting bed has exactly one way to finish, and a flower that repeats will not stay

## Design notes

*After picture sudoku and Latin squares.* Plant a 3 by 3 flower bed so each row has one of every flower; from level 2 the columns count too, then 4 by 4 beds with fewer flowers to start, a 5 by 5 bed, at school level 7 a full bed to mend, and at levels 8–9 hedge boxes. Every planting bed has exactly one way to finish (rule-tested over many seeds per level). A flower that repeats in a row or column will not stay and counts as a miss; tapping a planted flower takes it out. The glowing spot is a hint.

**Seeded flower sets.** Each bed draws `size` of the five flowers (daisy, tulip, rose, bluebell, sunflower) from the seed (`Puzzle.kinds`, kept in palette order), so beds no longer always leave out the sunflower; the packets are redrawn per bed and the spoken flower names follow the kinds. Couch twin beds stay identical by seed.

**Levels.** 1 rows only, 3 by 3; 2 rows and columns, 3 by 3; 3 4 by 4, 6 empty; 4 4 by 4, 9 empty; 5 4 by 4, 11 empty; 6 5 by 5, 14 empty; 7 *Mend the bed*. 8 *Hedge boxes*, 4 by 4, 6 empty, two beds; 9 *Hedge boxes*, 4 by 4, 10 empty, one bed; 10 *One row*. Windows: preschool 1 and 10 (order 10, 1; the entry is level 10, carried to pre-K it lands on 1 and to school on 3), pre-K 1–3, school 3–9.

**Level 10, One row (preschool).** A single row of three spots with two flowers planted and one spot empty, three packets, three beds a round with the gap in a different place each bed. She plants the flower the row is missing; planting one that repeats is a miss with the row clash line (`rows.clash`), and after two misses the empty spot and the right packet glow (a hint). The instruction is `rows.one`. The beds are non-square (`rows` plan field, `rowsOf`). Garden Rows now shows on the preschool Puzzle Peaks page. Couch range unchanged (3–6).

**Level 7, Mend the bed (school).** A full 4 by 4 bed in which two flowers in one row have swapped, so two columns each repeat. Every flower is hers to lift (free, none is given); replanting a flower that repeats is a miss with the clash line. Any repeat-free bed blooms (when both repeats share their other row too, swapping that row's pair is also right). Dead-end misses count only the spots a planting newly closes. After two misses the glow points at a mixed-up flower (`rows.mend-hint`), then at the spot and packet (one hint). A full bed that still repeats repeats the instruction (`rows.mend`) without a miss and keeps any glow. The ghost finger lifts both, then plants both (`nextMove`/`mendTarget`). Couch range unchanged (3–6).

**Levels 8–9, Hedge boxes (school).** The 4 by 4 bed is drawn with hedges in the gaps between four 2 by 2 boxes, and each flower must also appear once in every box. Beds are box-valid with exactly one way to finish (rule-tested over 80 seeds). A repeat in a row or column clashes as before; a repeat that shares neither row nor column but sits in the same box clashes with `rows.clash-box` ("There is already a {flower} in this hedge box"), is one miss, does not stay, and both spots flash. The instruction is `rows.boxes`. The bot is unchanged (rule-generic) and couch range stays 3-6.

**On the couch.** Grown-ups play its 4 by 4 and 5 by 5 beds (levels 3 to 6) with a controller: the stick, D-pad or arrow keys move a teal ring over the bed one spot at a time; the bottom button on an empty spot opens the seed packets, the stick steps through them, and the bottom button plants the chosen flower on the ringed spot; the left button closes the packets without planting. The bottom button on a flower the player planted takes it out, as a tap does (flowers the bed started with stay), and taps and the ring share one `act(r, c)`. A clash or a dead end counts as a wrong planting; the score is wrong plantings (lower wins), so a face-off gives both players the same seeded bed. A bot walks the columns then the rows, opens the packets, steps to the right one and plants (`nextPlanting`). No course yet.
