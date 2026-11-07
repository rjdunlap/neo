# Critter Crossing

<!-- generated: from src/games/critter-crossing; edit the text below the end mark (npm run game-docs) -->

**ID:** `critter-crossing` · **Land:** Puzzle Peaks · **Ages:** pre-K–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** deduction, using-evidence, attributes, reasoning

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1, 8, 2, 3 |
| school | 2–7 |

| Level | Plays like |
| --- | --- |
| 1 | The gate shows its rule: send across the critters that fit |
| 2 | A secret rule: try critters, watch who crosses, then guess the rule from three pictures |
| 3 | A secret rule with four pictures to choose from and five critters to try |
| 4 | A secret rule with two parts: a critter must fit both to cross |
| 5 | A secret rule that may be "not" something or two parts: use all the evidence |
| 6 | A secret rule with "or": a critter crosses if it fits either part, so most critters cross |
| 7 | Two pictures are still standing: choose the critter who can settle which one is the rule |
| 8 | The sign shows a picture with a slash: send the critters that do not fit that picture |

<!-- end generated -->

**Starts as:** critters line up at a bridge gate; at first its rule is on the sign, then it is a secret: try critters one at a time, watch who crosses and who waits, then guess the rule

**Grows into:** rules of one picture, a visible slashed "not" picture (entry ID 8 between 1 and 2 for pre-K), hidden "not", two pictures together, or either of two (level 6); level 7 starts with two critters tried and two pictures left, and she picks who settles it; a guess only counts as a mistake if it disagrees with something you saw

## Design notes

*After Zoombinis.* A bridge gate with a rule: shown on the sign at level 1 and the appended visible **not** entry (ID 8), then a secret to work out by sending critters one at a time (each crosses or waits with a red mark) and then guessing from three or four pictures. Rules are one picture, "not" a picture, or two pictures together; school level 6, **Either one**, adds "or" gates (a hat or whiskers: a critter crosses if it fits either part), drawn on the sign with the word "or"; school level 7, **Settle it**, starts a mixed-gate round with two critters already tried (one crossed, one waited) so exactly two pictures stand (the rule and a lookalike, the only two guess cards), and she chooses which waiting critter will settle them. A round has 6 critters and at least half must cross; the pictures include the "and" twin of the true rule, a lone part, and "or" lookalikes that share a part. On hidden levels, trying a critter is never a mistake. A guess counts as a miss only if it contradicts something already seen; a fair but unproven guess says to try another critter. Rule tests check that every round has critters who cross and who wait, that trying everyone leaves exactly one picture, and that the hint's suggested test always narrows the pictures without ruling out the true one. At level 7, of the four waiting critters at least one splits the two pictures and at least one does not; choosing a critter both pictures answer alike is a free try ("they'd both say the same", line `cross.same`, never a miss), two such tries glow a splitter (counted as one hint), and the guess button wakes at 3 tries, the two pre-tried included. Crossing a splitter leaves exactly the true rule. On hidden levels (2–7) a small white **bank shelf** in the bottom-right corner keeps tiny copies (hats included) of each critter tried, in order: a crossed row under a green tick and a waited row under a red cross; level 7's two pre-tried critters and the reveal's walk-ups go on it too. It is drawing only, never takes a tap, and visible levels 1 and 8 show none. Pre-K follows `[1, 8, 2, 3]`: level 8 shows a picture with a red slash, speaks the negated rule, and finishes after the critters that do not fit the picture cross in two rounds. Sending a critter that fits the slashed picture is a gentle miss; after two misses a passing critter glows, counted as one hint. The ghost finger sends only passing critters. School remains 2–7, with level 8 declared in `entryLevels` so a saved entry or pin lands at school’s first level. Existing IDs keep their rules.
