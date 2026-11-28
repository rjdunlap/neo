# Critter Crossing

<!-- generated: from src/games/critter-crossing; edit the text below the end mark (npm run game-docs) -->

**ID:** `critter-crossing` · **Land:** Puzzle Peaks · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** deduction, using-evidence, attributes, reasoning

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1 |
| pre-K | 1, 8, 2, 3 |
| school | 2, 3, 4, 5, 6, 7, 9 |

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
| 9 | Be the gate: choose a rule and let the critters across that fit it |

<!-- end generated -->

**Starts as:** critters line up at a bridge gate; at first its rule is on the sign, then it is a secret: try critters one at a time, watch who crosses and who waits, then guess the rule

**Grows into:** rules of one picture, a visible slashed "not" picture (entry ID 8 between 1 and 2 for pre-K), hidden "not", two pictures together, or either of two (level 6); level 7 starts with two critters tried and two pictures left, and she picks who settles it; a guess only counts as a mistake if it disagrees with something you saw; level 9, *Be the gate*, flips the roles: she picks the rule and answers Cross or Wait for each critter, with a partner (who then swaps seats) or with the pet as the detective

## Design notes

*After Zoombinis.* A bridge gate with a rule: shown on the sign at level 1 and the appended visible **not** entry (ID 8), then a secret to work out by sending critters one at a time (each crosses or waits with a red mark) and then guessing from three or four pictures. Rules are one picture, "not" a picture, or two pictures together; school level 6, **Either one**, adds "or" gates (a hat or whiskers: a critter crosses if it fits either part), drawn on the sign with the word "or"; school level 7, **Settle it**, starts a mixed-gate round with two critters already tried (one crossed, one waited) so exactly two pictures stand (the rule and a lookalike, the only two guess cards), and she chooses which waiting critter will settle them. A round has 6 critters and at least half must cross; the pictures include the "and" twin of the true rule, a lone part, and "or" lookalikes that share a part. On hidden levels, trying a critter is never a mistake. A guess counts as a miss only if it contradicts something already seen; a fair but unproven guess says to try another critter. Rule tests check that every round has critters who cross and who wait, that trying everyone leaves exactly one picture, and that the hint's suggested test always narrows the pictures without ruling out the true one. At level 7, of the four waiting critters at least one splits the two pictures and at least one does not; choosing a critter both pictures answer alike is a free try ("they'd both say the same", line `cross.same`, never a miss), two such tries glow a splitter (counted as one hint), and the guess button wakes at 3 tries, the two pre-tried included. Crossing a splitter leaves exactly the true rule. On hidden levels (2–7) a small white **bank shelf** in the bottom-right corner keeps tiny copies (hats included) of each critter tried, in order: a crossed row under a green tick and a waited row under a red cross; level 7's two pre-tried critters and the reveal's walk-ups go on it too. It is drawing only, never takes a tap, and visible levels 1 and 8 show none. Pre-K follows `[1, 8, 2, 3]`: level 8 shows a picture with a red slash, speaks the negated rule, and finishes after the critters that do not fit the picture cross in two rounds. Sending a critter that fits the slashed picture is a gentle miss; after two misses a passing critter glows, counted as one hint. The ghost finger sends only passing critters. School plays `[2, 3, 4, 5, 6, 7, 9]`, with level 8 declared in `entryLevels` so a saved entry or pin lands at school’s first level. Existing IDs keep their rules. Levels 5–7 and 9 add a third look: some critters wear a blue **scarf** (a `scarf` flag on the shared `SortCritter`, drawn by `scarfArt()`), and "wearing a scarf" joins the rules a gate may use there; levels 1–4 and 8 never deal one, so they play as before. Rule tests check the larger pool stays fair (critters cross and wait, all different, trying everyone leaves one picture).

**Be the gate (level 9, school's top, [definition](../definitions/critter-crossing-be-the-gate.md)).** Before round 1 she taps **Two of us** or **Just me** (the shared seat buttons). Each round deals six critters and four rule cards, one of each kind ("one", "not", "and", "or"); whichever card is picked, some critters cross and some wait, and every two cards disagree about at least one critter, so the detective can always find it. She picks a card and becomes the gate: when a critter walks up, she taps the green check (**Cross**) or the red cross (**Wait**). An answer against her own rule is a gentle miss (with a partner, a quiet "check your rule", never the rule's words; alone, the rule is spoken back), and two misses glow the right button as one hint. **Two of us:** the partner shuts their eyes while she picks; a wooden lid covers the sign, and tapping it is a free peek. The partner tries critters and guesses with the light bulb; their wrong guesses get the usual explanation but never count. In round 2 the seats swap: the partner picks, and she solves it as on a secret-rule level, with her own guesses counted. A two-seat match always records at least one hint (`gateSwapResult`), so a partner's play never steps her up. **Just me:** her rule stays on the sign, the pet sends the most telling critter each time (`bestTest`), and it names her rule once only one card fits, two rounds. The ghost finger plays Two of us end to end.

On upright phones the layout is the pure `crossLayout` in `layout.ts` (with `CROSS_HIT`), and the sideways plan is pinned identical by test. The old fractions of the view put the bank columns 92 apart (under 100-unit taps) and the guess bulb on the evidence shelf. Upright, the bank columns sit at a 120 pitch (left x 120 and 240, right 525 and 645), three rows of critters 140 apart hang up from the bottom edge (the bridge gate at the middle row), the guess bulb sits at x 250 between the guide and the shelf with the dots above it, guess cards hang just above the top row (`panelTop = max(130, h - 890)`), and the grass top is `max(0.32h, h - 700)` so a tall phone's spare height is sky. `upright.test.ts` covers every plan's critter count in five views.
