# Frog Hop

<!-- generated: from src/games/frog-hop; edit the text below the end mark (npm run game-docs) -->

**ID:** `frog-hop` · **Land:** Counting Cove · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** number-line, adding, taking-away, counting-on, fractions

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–4 |
| school | 3–10 |

| Level | Plays like |
| --- | --- |
| 1 | Hop to a number on the line, 0 to 8 |
| 2 | One more or one less: hop to the next number up or back |
| 3 | Start at a number and hop 1 to 4 more: where does the frog land? |
| 4 | Hop back 1 to 4: taking away on the line |
| 5 | How many hops from one number to another? Choose a number card |
| 6 | A longer line to 20: hop on or back up to 6 |
| 7 | Hop to 10 first, then hop the rest of a sum that crosses 10 |
| 8 | Hop back to 10 first, then hop the rest of a take-away that crosses 10 |
| 9 | Quarter and half hops along one whole: where does the frog land? |
| 10 | Two hop sizes, one lily: how many hops of the other size reach the same place? |

<!-- end generated -->

**Starts as:** hop to a number on the lily pads

**Grows into:** one more and one less, adding and taking away as hops, how many hops between two numbers, a line to 20, then splitting a shown sum or take-away across 10 with spoken support and one hint per question, then fractions as places on one whole (quarter and half hops, then two hop sizes to one lily) for ages 6–8

## Design notes

*After number-line hopping games and Frogger.* A number line of lily pads. Levels: find a number; one more and one less; add by hopping; take away by hopping back; how many hops between two numbers (number cards); a line to 20 that slides to keep the start and answer in view; then split a shown sum that crosses ten by first choosing the hops to 10 and then landing the rest; level 8 is the mirror, a take-away from 11 to 16 (taking away 4 to 8) that first chooses the hops back to 10 and then lands the rest. At level 7 the sign first shows the whole sum (such as `8 + 5`), then the split (`8 + 2 + 3`); level 8 reads `13 − 5` and then the split the same way; the pet explains the total and each part. A sign shows the sum (`4 + 3`, `7 − 3`, `3 → 8`). Wrong-way hops and one-too-many or one-too-few hops get specific spoken feedback. Two misses bring a counted demonstration, the frog hopping and counting aloud, then the answer glows. Each question records at most one hint even when both stages at ten need help. On card questions, the second pad tap prompts and bounces the cards for free. Five answered questions finish the round for one sticker, including with help.

**Fraction Landings (levels 9–10, school only, skill `fractions`).** Level 9 `frac-hop` (quarter and half hops along one whole): the sign gives a start and a hop size, and she taps the pad where the frog lands; only 0, 1 and 2 are labelled, and answers can be mixed numbers. A wrong pad is a named miss (`fracMiss`), the one-whole bracket shows the size, and a hint counts once per question. Level 10 `frac-match` (two hop sizes, one lily): the frog lands with one size and plants a flag, goes back to zero, and she picks the card for how many hops of the other size reach the flag (the first question is always ½ × 2 → ¼). A wrong card (`matchMiss`) falls through to "Count the {size} hops from zero to the flag" (`hop.frac.flag`), then the usual two-miss glow. Both levels are appended to the school ladder (now 3–10, no `order`) and are not couch stops (the couch is unchanged). [Definition](../definitions/frog-hop-fraction-landings.md).

**A right answer never holds the next question (U7 fix batch 8, 2026-11-12).** At every level the right answer's line (`hop.yay`, level 9's `hop.frac.also`, level 10's `hop.frac.same`) starts and the next question follows at once: the frog's leap (and the window's slide) play over the line and input opens with the sign showing. The question's spoken ask (`hop.find` and the rest, `hop.frac`, `hop.frac.match`) waits for the line to end, or is said at her first pad or card tap; tapping the guide meanwhile says that waiting ask (`Game.sayWaitingAsk`), not the last question's. The fraction lines play over the next leap rather than being dropped. The last question's line is heard out before `hop.done`.
