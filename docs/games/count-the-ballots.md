# Count the Ballots

<!-- generated: from src/games/count-the-ballots; edit the text below the end mark (npm run game-docs) -->

**ID:** `count-the-ballots` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** counting, comparing, rules and fairness

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Sort nine ballots by first choice, then move the smallest pile on to its next choice |
| 2 | Sort the ballots, then say whether the most first choices found the ride most villagers can live with |

<!-- end generated -->

**Starts as:** nine villagers have each ranked three fairground rides on a ballot. She taps a ballot, then the pile of the ride it likes best (level 1, *Count first choices*). No pile reaches five, so the smallest pile is out and its ballots come back to the hand, each now marking its next choice still standing; she moves them, and the ride with five is built. The learning is a counting procedure with a rule that can change the answer.

**Grows into:** level 2, *Does the first count tell the truth?*, deals hands where the ride with the most first choices is not the one that wins the run-off, then asks which ride a first count alone would pick. The voice says what each rule found and never calls one fairer. Level 3 (a fourth ride, twelve ballots) is only named in the [definition](../definitions/count-the-ballots.md).

## Design notes

- Rules in `logic.ts`: the 2,002 deals of nine ballots over six rankings are enumerated; 360 have no first-round majority and a unique largest and smallest pile (always 4-3-2); 240 have the run-off winner equal to the first-count winner (level 1) and 120 do not (level 2). A seed picks the deal, the ride trio from six and the hand order; tests pin the counts and an independent brute-force run-off.
- Every ride has its own colour and badge shape, so a ballot never reads by colour alone. A ballot is tapped and then a pile, or dragged to a pile (`engine/drag.ts`; a wrong drop floats home as a miss); keys: arrows walk the hand, 1–3 pick a pile, Enter moves, Backspace undoes. Undo (one step, never across a count) and Restart (the same seed, earned misses and hints kept) are round buttons beside Help and are never counted. The cards and piles are at least 100 units on every checked view, so the school band's minimum holds as well as the grown-up 64. Home is Lantern Lake, with school levels 1–2 reached through its signpost.
- Misses: a ballot put in the wrong pile (it stays in the hand with a spoken hint), and a wrong first-count tap at level 2. After two misses on one ballot the right pile glows, one hint; Help glows it and counts once per ballot; the level-2 question glows the biggest pile after one wrong tap. Picking up, deselecting and counting are free.
- Differs from the definition: the eliminated pile's ballots return to their own hand slots rather than staying in the tray.
