# Duck Pond

<!-- generated: from src/games/duck-pond; edit the text below the end mark (npm run game-docs) -->

**ID:** `duck-pond` · **Land:** Counting Cove · **Ages:** lap–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** counting, number-sense, adding

| Band | Levels, easiest first |
| --- | --- |
| lap | 13, 12, 1, 2 |
| toddler | 12, 1, 2, 3, 4, 5 |
| preschool | 3–7 |
| pre-K | 5–9 |
| school | 8, 9, 10, 11, 14, 15 |

| Level | Plays like |
| --- | --- |
| 1 | Count along as 3 ducks hop in |
| 2 | Count along as 5 ducks hop in |
| 3 | Put 1 to 3 ducks in the pond (number and dots) |
| 4 | Put 2 to 5 ducks in the pond (number and dots) |
| 5 | Put 3 to 6 ducks in the pond (number only) |
| 6 | How many ducks? 0 to 5, dice or rows, dotted pads |
| 7 | How many ducks? 0 to 8, dice, rows or scattered, dotted pads |
| 8 | Adding, up to 5 |
| 9 | Adding and taking away, up to 10 |
| 10 | Make ten: how many more ducks fill the pond to 10? |
| 11 | Part and whole: how many ducks hide under the bridge? |
| 12 | Wave bye-bye as each of five ducks swims off, then count them back |
| 13 | One big duck: a touch anywhere brings a friend, up to five |
| 14 | Doubles: 1 + 1 to 5 + 5 across the bridge, then one more on a side; how many in all? |
| 15 | Ten and some more: a full pond of ten and 1 to 9 more; how many in all (11 to 19), or how many past ten? |

<!-- end generated -->

**Starts as:** count along as illustrated ducks hop in

**Grows into:** touch anywhere and one big duck quacks and brings a friend swimming in, up to five (lap level 13, first in lap's order); put N in, how many?, adding and taking away, how many more make ten, then find the ducks hiding under the bridge, then doubles across a footbridge (level 14, school); level 12 (Bye-bye ducks, lap and toddler) is a song: tap a duck to wave it off, the voice counts down, then all five swim back; hidden ducks paddle into view and answered stories show a spoken number sentence

## Design notes

Duck Pond alone uses the prepared R22 illustrated duck, with frame-driven bob/squash and unchanged touch circles (other games retain their drawings). Count along as ducks hop in; then put N in, how many?, adding and taking away. The dots beside a number are there to count. Level 10 (make ten): 3–9 ducks swim in. "How many more to make 10?" is answered on lily pads. The missing ducks then swim in to fill the pond's ten places ("7 and 3 make 10!"). A wrong pad counts on aloud from the ducks already there. Level 11 (hiding ducks): the sign gives a whole from 5 to 10, some ducks paddle beneath a code-drawn bridge, and the child finds the hidden part on the lily pads. A wrong pad counts on from the visible ducks to the whole. A right answer brings the hidden ducks out one by one, counted aloud, into separate pond seats. At levels 8–11 the sign then shows the addition or subtraction sentence and the pet reads it; reading is not needed to answer. Level 12 (Bye-bye ducks, ID 12; lap and toddler entry, placed first in their order): five ducks swim on the pond, and tapping one makes it wave and swim off while the voice counts down ("Bye-bye! 4 left"). After the last, the mother duck calls and all five swim back, counted up. One song is one round; there are no questions, so no misses or hints are possible. A departing duck takes no further taps.

Levels 6–7 (how many?) deal each round a dice face or two rows of five (level 7 also a scatter), counted back row first, so a number is not always the same picture. A pond may be empty once in a level (never first; the pads then read 0, 1, 2 and the voice says "None!"), and the pads carry their dots in fives under the numeral. The starting ponds of levels 8–9 keep the old fixed places.

Seating for the school levels still to come: 11 to 20 ducks sit in two ten-frames side by side on a widened pond (small ducks, the left ten filled first). Answer pads can reach 20, with dots kept at 10 or fewer. Only the footbridge split is used so far (level 14).

Level 14, **Doubles**, appended after the lap openings (ids 12 and 13), so the school window is 8–14 with order `[8, 9, 10, 11, 14]`. The footbridge splits the pond: three rounds of equal sides (1 + 1 up to 5 + 5), then two near doubles (one more on a side), never the same total twice running. The left side swims in from the left and the right from the right, each bobbing as the instruction names it ("1 duck" when it is one). She taps the pad with the total (pads 1–10). A wrong pad says "4 on this side, and 4 more" and counts on across the bridge; a right one is counted aloud and the sign writes "4 + 4 = 8". The finale ducks sit either side of the bridge. At every pad level (6–11, 14) the right pad glows from a question's second miss and the question counts one hint, however many more misses follow.

Level 13, **Friends**, is lap's first level (order `[13, 12, 1, 2]`; `entryLevels` `[12, 13]`). One big duck (2.4 times the size) is on the pond from the start and a layer over the whole screen takes every touch: the big duck quacks and cheers and a friend swims in from alternating sides, with the count spoken and shown on the sign with dots, up to five. Nothing holds the first touch (the instruction line is not awaited, and a touch during a swim-in brings the next); after the fifth a touch only quacks with a splash. After four quiet seconds the big duck hops, counting nothing. The round ends with a quack chorus, "Five friends…" and confetti, and no miss or hint can be reached. The ghost finger touches the water away from the duck. New lines `duck.friends` and `duck.friendsAll` have rendered clips. A touch in the bottom-left of the screen lands on the shell's pet corner, so the browser suite's touch spots avoid it.
