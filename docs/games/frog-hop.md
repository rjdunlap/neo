# Frog Hop

<!-- generated: from src/games/frog-hop; edit the text below the end mark (npm run game-docs) -->

**ID:** `frog-hop` · **Land:** Counting Cove · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** number-line, adding, taking-away, counting-on, fractions

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–4 |
| school | 3–14 |

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
| 11 | Count up to take away: 13 − 9 is the hops from 9 to 13. Choose a number card |
| 12 | Over ten, your way: a sum or take-away across 10, with a stop at 10 if she chooses |
| 13 | Hop by tens: pads 0, 10, 20 … 100, start at 10 to 70 and hop 1 to 4 tens on or back |
| 14 | Big hops and little hops: tens and ones from one number to another, on a line with no pads |

<!-- end generated -->

On upright phones `hopLayout` (pure, in `logic.ts`; guard `view.upright` and height over 1.1 × width) folds the nine pads into a row of five (pads 0–4) and a row of four (5–8) at a 140 pitch, left-aligned like text and 250 units apart so the fraction line's "one whole" bracket fits under row one; the six number cards go in two rows of three beside the guide at a 124 pitch; cards, rows and sign hang up from the bottom edge, so a tall phone's spare height is sky at the top. The scene's single pad baseline became `padPos`/`frogY`, so `leap`, `hopCount` and `hopBy` tween the frog's y to the landing pad's row. The sideways plan is unchanged and still tested; `logic.test.ts` runs every one of the 13 plans over five upright views (768×1024, 390×844, 390×700, 430×932, 360×780) and checks rows, order and the bracket gap.

**Starts as:** hop to a number on the lily pads

**Grows into:** one more and one less, adding and taking away as hops, how many hops between two numbers, a line to 20, then splitting a shown sum or take-away across 10 with spoken support and one hint per question, then fractions as places on one whole (quarter and half hops, then two hop sizes to one lily), then take-away as the distance between two numbers (13 − 9 as the hops from 9 up to 13), then going over ten her own way (stop at 10 or land directly), then hopping by tens along a line of 0 to 100, then a line with no pads where a big lily hops ten and a small lily hops one from a number to a flag, for ages 6–8

## Design notes

*After number-line hopping games and Frogger.* A number line of lily pads. Levels: find a number; one more and one less; add by hopping; take away by hopping back; how many hops between two numbers (number cards); a line to 20 that slides to keep the start and answer in view; then split a shown sum that crosses ten by first choosing the hops to 10 and then landing the rest; level 8 is the mirror, a take-away from 11 to 16 (taking away 4 to 8) that first chooses the hops back to 10 and then lands the rest. At level 7 the sign first shows the whole sum (such as `8 + 5`), then the split (`8 + 2 + 3`); level 8 reads `13 − 5` and then the split the same way; the pet explains the total and each part. A sign shows the sum (`4 + 3`, `7 − 3`, `3 → 8`). Wrong-way hops and one-too-many or one-too-few hops get specific spoken feedback. Two misses bring a counted demonstration, the frog hopping and counting aloud, then the answer glows. Each question records at most one hint even when both stages at ten need help. On card questions, the second pad tap prompts and bounces the cards for free. Five answered questions finish the round for one sticker, including with help.

**Fraction Landings (levels 9–10, school only, skill `fractions`).** Level 9 `frac-hop` (quarter and half hops along one whole): the sign gives a start and a hop size, and she taps the pad where the frog lands; only 0, 1 and 2 are labelled, and answers can be mixed numbers. A wrong pad is a named miss (`fracMiss`), the one-whole bracket shows the size, and a hint counts once per question. Level 10 `frac-match` (two hop sizes, one lily): the frog lands with one size and plants a flag, goes back to zero, and she picks the card for how many hops of the other size reach the flag (the first question is always ½ × 2 → ¼). A wrong card (`matchMiss`) falls through to "Count the {size} hops from zero to the flag" (`hop.frac.flag`), then the usual two-miss glow. Both levels are appended to the school ladder (now 3–10, no `order`) and are not couch stops (the couch is unchanged). [Definition](../definitions/frog-hop-fraction-landings.md).

**Say the numbers, dots and flowers (dive slice 2, 2026-11-14).** On levels 3, 4 and 6 a counted hop says the pad it lands on and a tally dot rises over the frog per hop; a right answer says `hop.landed` and the frog croaks. Levels 5, 7, 8 and the fraction levels keep counting 1, 2, 3. Levels 1–2 draw dots under each numeral (fives grouped) and level 1's sign shows the target's dots; landmark flowers sit on 5, 10, 15 and 20 from level 3, never on 0 or the fraction line. Dots and flowers are a scene layer, so the sticker, icon and hit areas are unchanged.

**Over ten, your way (level 12, school only, mode `your-way`).** No number cards: a sum or take-away across 10, forward from 5–9 or back from 11–15 by 4–8 (two of five go back; no landing or split repeats twice running). A tap on 10 is a free stop: the frog counts the hops there and the sign reads e.g. `8 + 2 + ?`; a second tap on 10 is a squeak. A tap on the landing answers directly. A wrong landing is named (measured from 10 after a stop) and, after her stop, "From 10, {n} more." Two misses: the frog hops to 10, says "{a} to ten, {n} more.", hops the rest, returns, and glows the landing. The ghost finger and couch bot stop at 10, then land. The right answer says "8 plus 6 is 14."

**Hop by tens (level 13, school only, mode `tens`).** Pads read 0, 10 … 100 and the sign shows `30 + 20`; questions stay in pad-index space and `padValue` multiplies only what is shown or said. Starts 10–70, 1–4 tens on or back (two of five go back; never the same landing twice running); every round slides the line to show 100 at least once. The ask is "Start at 30. Hop 2 tens." (separate "one ten" lines); counted hops say the tens ("forty… fifty") with a tally dot, and the landing line names the value. Wrong side and off by one ten are named misses; two misses demonstrate and glow, as at levels 3–4. Flowers fall on 50 and 100, and the "100" label fits its pad at four views. Device speech of the tens words is unchecked.

**Big hops and little hops (level 14, school only, mode `hops`, [definition](../definitions/frog-hop-big-and-little-hops.md)).** An open line with no pads: only the frog's number and the flag's are written. A big lily (+10), a small lily (+1) and a back lily hop the frog; every hop says its landing, leaves a faint arc (long for ten, short for one, to scale) and is free until the frog lands exactly on the flag. The scene is its own class, `HopsLine` in `hops-scene.ts`, chosen by `create`; `logic.ts` holds `hopsQuestions` (start 12–58 and distance 11–45, neither a multiple of ten, flag at most 100, the first question 47 → 72, four questions), `routeLanding`, `overshoots`, `shortestRoute`, `routeWords`, `openLine` (the window, shrunk to fit the board) and `hopsLayout`. A hop past the flag lands, is one miss (two charged a question) and lights Back; going past the end of the line is a free squeak. A second overshoot or Show a hint plays the fewest-hops route from where she stands (from the start if she is past the flag) and counts one hint; ten little hops on a question pulse the big lily once, free. The closing line names her own route. Not a couch stop. The browser step is in `woods-batch.mjs` (`WOODS_ONLY=hop HOP_LEVELS=14`).

**Scenes (dive slice 6, 2026-11-14).** Each round draws one of four scenes after the questions are made, so a seed's questions are unchanged: the lily pond, stepping stones in a brook, a flower path (white daisies, so the pink landmark blooms on 5, 10, 15 and 20 still stand out) and an evening pond (dusk sky, light ground so numerals read, drifting fireflies). Art only: `hopLayout` places pads, sign and number cards the same in every scene, clear of the guide corner at four views. The sticker and hub icon keep the lily pad.

**Count up to take away (level 11, school only, mode `count-up`).** The sign shows `13 − 9`; the frog stands on the smaller number, a flag marks the bigger, and she taps a number card 1–6 for the hops between. Big number 11–20, difference 1–6; three of five rounds cross ten, and no difference or flag repeats twice running. A wrong card names one too many (counting the starting pad) or one missing; two misses count the hops aloud and glow the card. The right answer says "4 hops! 13 take away 9 is 4."

**A right answer never holds the next question (U7 fix batch 8, 2026-11-12).** At every level the right answer's line (`hop.yay`, level 9's `hop.frac.also`, level 10's `hop.frac.same`) starts and the next question follows at once: the frog's leap (and the window's slide) play over the line and input opens with the sign showing. The question's spoken ask (`hop.find` and the rest, `hop.frac`, `hop.frac.match`) waits for the line to end, or is said at her first pad or card tap; tapping the guide meanwhile says that waiting ask (`Game.sayWaitingAsk`), not the last question's. The fraction lines play over the next leap rather than being dropped. The last question's line is heard out before `hop.done`.

**On the couch.** Its six trip stops play levels 3, 5, 7, 8, 11 and 12 (add, gap, make ten, back over ten, count up and your way); the ring moves to a pad or card and the bottom button chooses, and the spoken lines say "Move to …, then press the bottom button" instead of "Tap…". The fraction, tens and scene-only work stays touch.
