# Jar Clues

<!-- generated: from src/games/jar-clues; edit the text below the end mark (npm run game-docs) -->

**ID:** `jar-clues` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** estimating an amount by eye, applying a number clue to a whole board, odd, even and digits

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | First clues: three clues about ranges, odd and even, counting by fives and last digits, then choose by the jar |
| 2 | Digit clues: four clues, at least one about what the digits add to or which digit is bigger |
| 3 | Multiples and primes: four clues with no ten line on the jar, at least one about multiples, primes or squares |
| 4 | One of two: five clues, one of them two statements of which exactly one is true |

<!-- end generated -->

**Starts as:** a jar of lake pebbles nobody has counted and a board of the numbers 1 to 60. Tap a number to plant a first guess, then the clues arrive one at a time ("fewer than 35", "an even number", "it ends in 2"): cross off every number each one rules out, by tapping or sweeping along a row, and press Next clue. At level 1 (*First clues*) three clues about ranges, odd and even, counting by fives or tens and last digits leave two or three numbers at least ten apart; choose the one the jar holds by eye, with a ten line etched on the glass, and the jar pours out into rows of ten and is counted.

**Grows into:** level 2 (*Digit clues*), four clues with at least one about what the digits add to or which digit is bigger (a one-digit number has tens digit 0), leaving numbers at least nine apart. Level 3 (*Multiples and primes*) takes the ten line off the glass and adds "a multiple of *m*", "not a multiple of *m*", "a prime number" and "a square number" ("ends in" leaves the pool). Level 4 (*One of two*) has five clues, one of them "Exactly one of these is true:" with two clues of different kinds (a range, odd or even, counting by, or a multiple), so a number where both are true or neither is gets crossed off.

## Design notes

- [Definition](../definitions/jar-clues.md). The clue kinds, the generator (redraws until a board is valid; about three or four draws), the check, the fault, the row hint, the jar's pile and the ghost finger's sweep are in `logic.ts`; the layout is in `layout.ts`. Every board comes from the round's seed; nothing is saved but the round's result.
- The guess, crossing off, bringing back, sweeping and re-hearing a clue (tap the clue card) are free. Next clue (Last look after the last clue) checks the board against every clue shown: one that does not hold is a boing, the lowest wrong number ringed and one miss per distinct wrong board at that clue (the same board again replays the explanation, free). The explanation reads the same whether or not the number is the count. The second counted miss brings one row hint; Help gives one at any time (a new hint counts once; the same board again is free; a board that holds says so, free). The last choice is a judgement and never a miss.
- **The note is fuller than the speech.** Spoken lines have no slots, so every one is a rendered clip: a fault speaks "A number the clue rules out is still standing." and then the clue. The note under the clue card carries the working with the numbers ("23 is still standing. The clue says an even number, and 23 is odd."; "The clue says fewer than 35. In this row 35 to 40 are not fewer than 35. Cross them off."), and at the end "Your first guess was 30. You chose 34. The jar holds 34." The reveal speaks "The jar holds this many." while the tray and the note carry the number.
- The jar's pile stands at the count's share of the brim (30 half fills it), within one pebble's height, drawn as a packed overlapping pile; the last numbers are at least nine sixtieths of the jar apart. The building session's capture of jars at counts nine apart (12 to 60) read apart clearly at the upright strip's size, so the gaps of 10 and 9 stand.
- Upright: the jar left of a strip (clear of Home) with the clue card and the note to its right; the note lists the earlier clues one per line until a fault or a hint puts its working there, and tapping the clue card brings the list back; the board ten across and six down; Help and Next clue beneath, all above the caption bubble at 390 × 625. The last look's cards replace the clue card beside the jar. Sideways the board is on the left and the jar, clues and buttons on the right; the cards stand over the faded board.
- **One of two** (level 4): the card prints both halves on one line ("Exactly one of these is true: more than 20, a multiple of 3"); the speech is the lead line "Exactly one of these is true." and then each half's own clip, and anything said meanwhile stops the halves still to come. A plain clue never repeats a half of it. A fault on it says which case: "24 is still standing. It is more than 20 and a multiple of 3: both are true, and the clue says exactly one." (or "neither is true"), spoken as "For this number both are true, or neither is." and then the clue.
- Smallest target at 390 × 844: a number cell, 74 units (37.6 CSS px), the definition's ten-across board at the grown-up minimum or above; ten across cannot reach 44 px on a 390 px screen, so the board stays and a **lens** eases it (2026-11-24): while a finger is down, its number shows large in a ring above the thumb (red and struck through when crossed off), follows the finger and goes on lift. The thumbs test still records the 37.6 and lists the game as lensed, not as an open fix. Sweeping a row remains the main way to cross many numbers; if a playtest note says single taps still miss, try commit-on-lift.
