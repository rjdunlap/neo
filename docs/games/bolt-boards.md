# Bolt Boards

<!-- generated: from src/games/bolt-boards; edit the text below the end mark (npm run game-docs) -->

**ID:** `bolt-boards` · **Land:** Barnyard · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, planning, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 1–4 |
| pre-K | 2, 3, 4, 5, 8, 6 |
| school | 4, 5, 8, 6, 7, 9 |

| Level | Plays like |
| --- | --- |
| 1 | One bolt each |
| 2 | Two bolts hold a board |
| 3 | Boards on top |
| 4 | Watch it swing |
| 5 | Find the friend |
| 6 | Every bolt needs a hole |
| 7 | Holes and a friend |
| 8 | Plenty of holes |
| 9 | Put it back |

<!-- end generated -->

**Starts as:** tap a bolt and a board on the barn wall swings or slides down, and a fruit peeks out and hops into the basket

**Grows into:** two bolts hold a board, one makes it swing and hang, a covered bolt waits, a friend to uncover, then open holes to park each bolt in (and, at level 8, plenty of them, where a swing can hide one), with a free undo and a hint that shortens the solution; at level 9 the boards start on the woodpile and she bolts them back up to match a picture, back boards first

## Design notes

*After screw-pin puzzle apps; [definition](../definitions/bolt-boards.md).* Wooden boards hang on the barn's pegboard wall on big bolts, with a fruit or a peeking friend behind. She taps a bolt and it spins out with a ratchet click: a board with two bolts left stays put, with one it swings and hangs like a picture on a nail, with none it slides softly down to the woodpile and the fruit hops into the basket. Poses are computed exactly (no physics). A bolt under another board is covered and waits. Boards are frozen, solver-checked shapes (20 per level, mirrored and re-dressed by seed with six fruits and seven friends); one sticker per round, with or without help.

**Level 9, *Put it back* (school).** The other half of the toy: all the boards start on a woodpile in the bottom strip and a picture card (right of the wall, above it in portrait) shows the finished wall, with a tick for each board that matches. She picks a board from its slot (or taps a hanging board's body when it is on top), then taps its glowing holes: the first bolt swings the board up, the second pins it. Back boards go up first; bolting a front board early can cover a hole for good, which is a dead end, not a miss: undo pulses and the pet names the covering board. A tap on a covered hole of the picked board is one miss while the wall can still be finished (free at a dead end); the glow after two misses counts one hint (the board's slot or body, then its hole), and at a dead end the hint is the uncounted undo pulse. Undo only, no taking boards out, no wander hint. Two scenes per round, drawn from the level 3 and level 4 board lists (the session's first round is an authored board of two small boards under one big one), mirrored by seed.

Levels: 1 one bolt per board, all hanging; 2 two bolts hold a board; 3 boards lying on top of others; 4 swings that cover a free bolt; 5 a friend to uncover (other boards may stay up); 6 every bolt needs an open hole to be parked in, open holes lit; 7 holes and a friend, holes unlit; 8 *Plenty of holes*, every board has to come down and each bolt has to go in a lit hole, three or four open at the start, two scenes. Toddler plays 1–2, preschool 1–4, pre-K 2–8 (order 2, 3, 4, 5, 8, 6), school 4–8 (order 4, 5, 8, 6, 7). At levels 6–8 she taps a bolt, then an open hole (or drags it), putting it back is free and so is undo, and the pet says "Stuck!" when no bolt can move. No misses at 1–3 (a covered tap only wobbles the board above and names it); from level 4 a covered tap is one miss, and at levels 7–8 a covered hole is one miss at 7 and free at 8 (free at 6 too). The two-miss glow and, at 6–7, a wander hint show the first move of a shortest solution; levels 1–5 can never dead-end. Level 6's first board is authored: one order of taking the upper board's bolts leaves her stuck, the other opens the hole. Level 8 has no par and so no wander hint (the two-miss glow still shows a bolt on the top board and an open hole, chosen without a search since every move there is progress), and a covered bolt is one miss; no board can leave her stuck, and every board has a swing that covers one open hole, so she meets the covered-hole rule early. Its first board in a session is authored: two side-by-side boards with two bolts each over three open holes, where either bolt of the left board swings it fully over one hole. 20 boards from a third generator seed; the instruction is "Take a bolt out, then put it in a glowing hole."
