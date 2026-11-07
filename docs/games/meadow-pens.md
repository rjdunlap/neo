# Meadow Pens

<!-- generated: from src/games/meadow-pens; edit the text below the end mark (npm run game-docs) -->

**ID:** `meadow-pens` · **Land:** Rainbow Meadow · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** area, perimeter, arrays, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| school | 1–5 |

| Level | Plays like |
| --- | --- |
| 1 | Enough grass: paint a pen with as many squares as a friend asks (3 to 8), any shape |
| 2 | Rows of grass: count a fenced field by its rows and tap the card for the whole field |
| 3 | Same grass, new fence: six squares whose fence uses every piece on the stack (10, 12 or 14) |
| 4 | More grass, or more fence? Compare two pens, including equal counts |
| 5 | Two parts: count all the grass in a bent field made of two rectangles |

<!-- end generated -->

**Starts as:** a friend asks for a pen: paint squares of grass on a meadow grid and the fence builds itself around the biggest connected group (other squares are flowers, a ring of grass round a hole is a pond), then ring the bell to check

**Grows into:** level 1 asks for 3 to 8 squares of grass; level 2 fills each field row by row and she picks the total from three cards (rows times columns, the fence count, or rows plus columns); level 3 gives a stack of 10, 12 or 14 fence pieces and asks for six squares of grass using every piece; level 4 compares two pens for more grass or more fence, including the same; level 5 counts an L-shaped field in two rectangular parts; a wrong ring is one gentle miss (the squares or the fence pieces are counted aloud), an empty ring is free, and two misses or Show a hint glow a pen that works; levels 4–5 have five questions, free count replays and one hint per question, after which any answer card supports completion

## Design notes

*After unit-square area models and fence-and-field word problems; [definition](../definitions/meadow-pens.md).* A friend stands at the meadow gate and asks for a pen. She paints squares of grass on a 6 by 4 grid (drawn 4 by 6 in portrait) and **the fence builds itself** around the biggest connected group of painted squares, one piece per grass edge. Painted squares that do not touch the pen are flowers that ask to join; a ring of grass around an empty square makes that square a pond. A heap or counted stack of fence pieces sits under the grid, topped up by a cart. She rings the bell to check: ringing an empty meadow is free. **Built: levels 1–5** (school 1–5).

**Levels.** Level 1 *Enough grass*: three pens; the first asks for 4 squares, then 3 to 8 in a seeded order without repeats; any connected shape with that many squares works, and the fence heap is free. Level 2 *Rows of grass*: five fenced fields from the card table (the first 2 by 3); the first row and column paint themselves with a count, any cell can be tapped to count on, and she picks the total from three cards: the right one (rows times columns), the fence count (perimeter), and rows plus columns or a row off. 4 by 4 is left out because its perimeter equals its area. Level 3 *Same grass, new fence*: six squares of grass using every piece of a counted stack of 10, then 12 and 14 in a seeded order; missing pieces show dashed. Level 4 *More grass, or more fence?*: five questions comparing two fixed pens, with two pen answer cards and a matching-piles same card; the authored opening compares a 1 by 6 and a 2 by 3 for grass, then fence. Both equality kinds and opposite grass/fence ordering occur. Level 5 *Two parts*: five L-shaped fields split into two disjoint rectangles; touch each part to count it, then choose the whole grass total from three cards (the correct total, a documented part/perimeter error, and a bounding-box or omitted-part error). Later rounds use seeded schedules.

**Misses and help.** A wrong ring or wrong card is one miss. At levels 1 and 3 the squares are counted aloud, or the fence ticks piece by piece, then says "{have} pieces. {k} are left on the stack" or "The fence needs {k} more pieces." At level 2 a wrong card fills the field row by row, counting each row's total. Two misses glow a pen that works (it keeps most of her squares) and count one hint; Show a hint does the same, counted once per pen; while the glow shows, ringing paints the glowing pen by itself, a supported finish. Start again clears the current pen at levels 1–3. At levels 4–5 only an incorrect answer card counts a miss; count/replay taps are free. Two wrong answers or Show a hint count one hint per question, reveal the count and glow the correct card; any answer card then gives a supported completion without another miss. Restart keeps the question index, support and round totals. An unaided correct answer opens the gate promptly, while the count stays replayable. At levels 1–3 the finale brings every friend of the round out to play with a bell tune; at 4–5 the visiting friend cheers with stars and a short thank-you that an answer-card tap can skip. The pet is `ctx.companion()`. **Ghost finger.** Paints the target pen square by square and rings the bell; at level 2 it taps the right card; at level 4 it demonstrates both opening comparisons and count replays, and at level 5 both parts, then answers all five questions. **Simplifications against the original levels 1–3 definition:** the wrong-ring fence count ticks piece by piece rather than being spoken per piece; the stack and cards sit under the grid in landscape too; the finale has no tap to skip and the friends play on the meadow rather than in kept pens; level 1's ghost finger taps squares rather than showing a drag and a free lift. Pre-K waits on a person check ([decision 6](../definitions/meadow-pens.md#open-decisions)).
