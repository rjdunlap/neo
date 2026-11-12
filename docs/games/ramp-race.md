# Ramp Race

<!-- generated: from src/games/ramp-race; edit the text below the end mark (npm run game-docs) -->

**ID:** `ramp-race` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, fair-tests, predicting, measuring

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 1–7 |

| Level | Plays like |
| --- | --- |
| 1 | Change the ramp and roll the car: higher goes farther |
| 2 | Pick the ramp height that stops the car on the star |
| 3 | Ramp height and floor (carpet, wood, ice) together reach the star |
| 4 | Fair tests: compare two lanes, changing only one thing |
| 5 | Trial Shelf: roll two ramps, keep both cards, tap the one that went farther |
| 6 | One Change: fix the orange lane so only one thing differs, then read the cards |
| 7 | What can we tell? Read two cards: did one thing change, or both? Then make it fair |

<!-- end generated -->

**Starts as:** tap the ramp to make it taller and roll a toy car

**Grows into:** stop on a star, choose height and floor (carpet, wood, ice), fair tests comparing two lanes, Trial Shelf record cards (school 5), One Change repairs and evidence reading (school 6), What can we tell? claim tiles and a repaired fair test (school 7)

## Design notes

*After toy car ramps and classroom fair-test experiments.* Tap the ramp to change its height (three heights) and the floor to change its surface (carpet, wood, ice); press go and the car rolls down and glides to a stop. The model is deliberately simple and stated plainly: distance = height × floor glide, in floor marks. Levels: explore (four free rolls, no star and nothing to miss), choose the height that stops the car on a star (wood only), height and floor together (both three stars), and fair tests with two lanes (change only the floor, or only the ramp; three tests). At levels 2–3 a roll off the star is a gentle miss naming what to change; two misses on a star show a ghost ramp and glowing floor that would work. At level 4 an identical setup is only a nudge (no miss); pressing go when something besides the named thing differs is a miss, and the pet names what actually changed (a pair where only the other thing differs hears "that changes the ramp, not the floor", or the reverse; both changed hears the "too" line). The second such miss on a question turns on a corrective glow on the orange lane (a pulsing ghost ramp at the height to match, or the floor strip outlined, or a ring around go once the pair is fair), worked out from the lanes as they are now, so any fair pair is accepted; the next question clears it. Level 4 still counts a hint on every unfair Check from the second on (recorded, not fixed; part of the inquiry study's decision 1). The ghost finger repairs any pair in at most three taps on the orange lane. Finish lines match the level ("Four rolls!", "Three stars!", then "You tested it fairly" at level 4); the co-play tip is to guess together before each roll how far the car will go, and why.

**Level 5, *Trial Shelf* (school only; the school range is 1–7, pre-K stays 1–2).** Roll the car and its stop fills record card A (blue); the ramp is locked until then (a nudge says to roll first). She then changes the ramp, optionally drops a free paw guess on the floor before or past the blue flag (the guess is told, "right" or "new", and never counted), and rolls again; rolling the same height twice is a free nudge, not a trial. The second roll fills card B (orange). She taps the card whose car went farther: a wrong card is one miss and both cards replay; a second wrong card on the same pair rings the farther card in yellow and counts one hint. Two pairs make a round (start heights 2 and 4, in seeded order), one sticker, with help too; misses and hints come from `tally` per pair. The ghost finger covers every phase. **Level 6, *One Change*.** Two questions per round, one floor and one height in seeded order, with distinct orange starts differing in both controls. Blue stays at height3/wood; touching it gives a free spoken nudge. She repairs orange until only the named thing differs, then presses go (Check). Both fair repairs per question are accepted. An identical pair is a free nudge; an unfair Check is a miss with Q2’s truthful feedback, and the second turns on corrective help once per question. A fair run fills two aligned record cards and returns the cars to the ramp tops; only the cards answer while reading. A wrong card replays both records and counts a miss; the second rings the farther card and adds one reading hint. Each question can count at most two hints, one setup and one reading. Two supported tests finish normally with one sticker; level4’s hint accounting remains unchanged.

**Level 7, *What can we tell?* (school top; the range is 1–7, pre-K stays 1–2).** Two record cards already sit on the shelf (a seeded case, one controlled and one confounded). Three claim tiles say what differed: Floors (height 3 on carpet and ice), Ramps (2 and 4 on wood) and Both (2 on carpet, 4 on ice, with a drawn question-mark bubble). She taps a tile and presses go to check it; with no tile chosen go is a free nudge, and changing tiles is free. A wrong claim is one miss and the pet's why-line (`ramp.why.*`) pulses the part to look at on both cards (floors for the floor claims, ramps for the ramp claims); a second wrong claim on the same case also lights the right tile and counts one hint. A right claim on a controlled pair says what made the difference; on a confounded pair "we can't tell" is the right claim, and she then repairs card B into a fair test (blue locked, as at level 6): an unfair Check is a miss with the level-6 feedback, a fair one replaces card B and the pair reads again. Misses and hints are tallied per step (each claim step and each repair its own list), the same Check-only rule as level 6; the full ladder is in the [definition](../definitions/what-can-we-tell.md). The claim-tile layout is a pure `tellLayout(view)` in `logic.ts`. Lines: `ramp.tell.*`, `ramp.claim.*`, `ramp.why.*`, `ramp.same.tell`, `ramp.unfair.tell`, `ramp.done.tell`; the how-to card and ghost finger cover the level.


**A right answer's line never holds the next question (U7 fix batch 23, 2026-11-12).** Levels 2-3 `ramp.yay` starts and the next star opens at once; level 4 `fairyay` and levels 5-7's `shelf.yay`, `fairyay`, `tell.floor` and `tell.height` play over the next pair or case. Its instruction waits for the line, the guide or her first touch: Go says it instead of rolling (no miss), a ramp change, paw guess or card replay says it and still takes effect, a claim tile is chosen with the question said in place of its name. The last line is heard out. `tell.both` and `guess.*` stay held.
