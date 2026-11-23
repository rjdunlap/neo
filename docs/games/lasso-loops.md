# Lasso Loops

<!-- generated: from src/games/lasso-loops; edit the text below the end mark (npm run game-docs) -->

**ID:** `lasso-loops` · **Land:** Counting Cove · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** grouping, counting by fives and tens, place value, equal groups, estimating

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–3 |
| pre-K | 2–4 |
| school | 3–8 |

| Level | Plays like |
| --- | --- |
| 1 | Draw loops around fireflies: each loop flies into a jar |
| 2 | Loop exactly 2 or 3 fireflies for each jar |
| 3 | Jars of 5: loop fives, then count by fives and the ones left over |
| 4 | Jars of 10: loop tens, then say the number (14, 30 or 34: tens and ones) |
| 5 | Equal groups: make 3 groups of 4, then say how many in all |
| 6 | About how many? Guess, loop one jar of 10, keep or change the guess, then loop the tens and say the number |
| 7 | Too few, too many: loop one jar of 10, tap away the numbers that cannot be right, then loop the tens and say the number |
| 8 | Make the number: catch 23 as jars of 10 and ones on the leaf, then tap the tick |

<!-- end generated -->

**Starts as:** draw a loop around fireflies: they fly into a jar

**Grows into:** loop exactly 2 or 3, jars of five and ten with the ones left over, or none (34 is three tens and four; 30 and 15 leave none; teens are one jar and some ones), equal groups ("3 groups of 4"); school level 6: freely guess, loop one benchmark ten, keep or change the guess, then count; level 7: loop one benchmark ten, tap away the number cards that cannot be right (too few or too many), then count; level 8: make a target number (13–36) from jars of ten and a leaf, then tick

## Design notes

*After Montessori golden beads, ten frames and Pokémon Ranger's capture loop.* Draw a loop around fireflies and they fly into a jar. The loop always closes back to its start, so a nearly closed loop counts; a loop around none is just explained. Levels: loop any fireflies (a seeded 6–9 in six jars); loop exactly 2 or 3 per jar; jars of five (1–3 jars, 6–19; about one round in five comes out even, 10 or 15, with no leaf and "None left over!"), then of ten (a teen: one jar and 11–19; a decade, 20 or 30, with no leaf; or 21–39), with the rest resting on a leaf, followed by "how many in all?" (the choices include the swapped tens and ones, offered only when both digits are there); and equal groups ("make 3 groups of 4", then how many). A wrong-sized loop lets the fireflies go and is a miss; two put white rings round a close group of the right size. A wrong total is counted aloud the way the jars show it (by fives, by tens and ones, by groups). School level 6 *About how many?* shows 21–39 fireflies: freely guess from three far-apart cards, loop one benchmark jar of ten, then keep or change the guess before finishing the tens-and-ones count. The pet compares the final guess with the count; neither guess counts as a miss or hint. Only wrong-sized loops and wrong total answers count, as at level 4. School spans levels 3–6; earlier bands and level IDs stay unchanged. Drawing uses its own pointer handling with palm rejection; a cancelled touch drops the loop.

**A jar's count plays over the next loop (U7 fix batch 9, 2026-11-12).** At levels 1–6 a lassoed jar's `count` plays over her next loop; only the last jar's count is heard out before `lasso.left`, `lasso.none`, the pads or the finale. At level 6 the guess card's reaction (`lasso.guessed`, `keep`, `changed`) plays while the card flies to the sign and the loops reopen. The next ask (`lasso.exact`, `lasso.change`, `lasso.benchmark`, `lasso.tens`) waits for the line, is dropped when a loop or card is judged (the jars show their numbers), and a guide tap says it (`Game.sayWaitingAsk`).

**Upright on a phone (2026-11-18, upright batch 8):** every level plays upright. The layout moved from `index.ts` to `lassoLayout` in `logic.ts` (the sideways numbers are pinned by a test). Upright, level 1's six jars stand in two rows of three; level 6's keep-or-change signs get their own row above the jar; the firefly field at levels 2–5 ends 24 units higher and its grid turns tall. Layout test: `upright.test.ts` in the game folder.

**Level 7, *Too few, too many* (estimation E2, PR #2010):** she loops one jar of ten on a shelf that also shows three dotted empty jar outlines. Five number cards come up (one or two of 5 and 10, the near ten, the rest from 50–90) and she taps away every card that cannot be right. Tapping the possible card is one miss with a spoken reason (the card stays); two such misses glow the impossible cards (one hint). The last card flies to the guess sign, then level 4's tens round runs and `lasso.range-end` closes. Seven voice lines; Kokoro clips exist for the two slot-free ones (`lasso.range`, `lasso.range-hint`). The bot taps away impossible cards and never the possible one. Two departures from [the definition](../definitions/lasso-loops-too-few-too-many.md): the shelf runs to `v.w - 40` in every orientation (four jars at `v.w - 210` were only 92 apart on a 768-wide tablet held upright, narrower than a jar; the leaf is not out while the shelf shows), and sideways the five cards stand over the field only when it is at least 5 × 130 wide, otherwise they span 40 to `v.w - 40` so their 130-unit touch areas do not overlap. Both are pinned by the sideways test in `upright.test.ts`.

**Level 8, *Make the number* (school top, PR #2025):** a wooden sign shows a target 13–36; the meadow holds the target plus 3–7 fireflies (never more than 39); three jars of ten; the leaf is out from the start with nine hollow places; a green tick button. A loop of more than ten is let go with "That loop went around 11. A jar holds ten. Try a smaller loop." (free, not a miss). Exactly ten fill the next empty jar; fewer rest on the leaf, and when the leaf would reach ten the first ten fly into the next jar ("Ten on the leaf! They fly into a jar.") and the rest settle. Tapping a full jar or the leaf lets its fireflies fly home (free undo, "Back to the meadow they go."). The tick is right when jars and leaf make the number (three praise lines by shape: tens only, one jar and ones, jars and ones), then the finale and one sticker. A wrong tick is one miss, counted aloud by one of six lines fitted to what is held ("2 jars of ten make 20, and 5 more make 25. We want 23."). From the second wrong tick the part to change glows with a spoken step, one hint a round: short by ten or more, the next empty jar; short by fewer, the leaf ("You need 3 more for 23. Loop 3 more."); over by ten or more (or over with an empty leaf), the last full jar; otherwise the leaf, to be let go. Rules in `logic.ts`: `makeLoop`, `makeHint`, `makeNext`, `makeCountLine`, `hasLeaf`, `leafSlot`. 17 voice lines (`lasso.make…`; Kokoro clips for the 5 slot-free ones) and two how-to steps scoped to level 8; the ghost finger loops the tens, then the ones, then taps the tick. `lassoLayout` gained a `make` flag and a `done` point: on a view at least about 980 units wide and not upright the tick stands on the jar line between the jars and the leaf and the field is unchanged; on a narrower or upright view it stands above the leaf and the field ends above it. Jars, leaf and tick are tap targets below the loop layer (jar 108 × 150, leaf 180 × 104, tick 140). Departures from [the dive's row](../deep-dives/lasso-loops.md#new-levels-on-top): 17 voice lines (not three) so no line says "1 jars", a tick instead of a *Done* word, and target plus 3–7 fireflies instead of 30. **Fixed on the way:** at levels 3, 4, 6 and 7 the fireflies resting on the leaf were not re-placed when the screen turned (now tracked in `leafFlies` and laid out in `resize`); fireflies in flight to a jar or the leaf when the screen turned ended at the old place (now settled after the flight); `catch` is split into `intoJar`/`ontoLeaf`, shared by all levels. **Open design question:** each wrong tick is one miss with no cap, as the dive specifies; whether a capped count is kinder is for a phone playtest to show.
