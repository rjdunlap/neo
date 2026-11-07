# Measuring Post

<!-- generated: from src/games/measuring-post; edit the text below the end mark (npm run game-docs) -->

**ID:** `measuring-post` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** measurement, choose-a-tool, unit-size

| Band | Levels, easiest first |
| --- | --- |
| school | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | Which tool? Pick the tool for how long, how heavy or how much |
| 2 | Whose unit was smaller? The same thing measured in big and little units |
| 3 | Measure them the same way: remeasure two things in one unit, then compare |
| 4 | How many little ones? One kilogram balances 1000 grams; fill the table |

<!-- end generated -->

**Starts as:** school

**Grows into:** pick the tool a friend's question needs (rope for how long, balance for how heavy, cup for how much), watch it measure in four little units and send the answer; then measure with a big and a little unit and tap who used the smaller; measure two objects in one common unit and compare; fill a kilograms-to-grams table from what the balance showed

## Design notes

*Levels 1–4 · [definition](../definitions/measuring-post.md) · measurement slices M3–M4.* Three friends at a post ask a question and she taps the tool that answers it: the rope (how long), the balance (how heavy) or the cup (how much). Level 1 "Which tool?": the ribbon is always the first question, then the parcel and the jug; the chosen tool measures in 4 little units while taps are inert, and she sends the answer with a paper plane. Level 2 "Whose unit was smaller?": after picking the tool, a strip shows one big unit equals two little ones, both friends measure (6 and 3 worms, 4 and 2 blocks, 6 and 3 cups), and she taps the friend whose units were smaller; the last task asks who used the bigger. A correct row sends automatically. Level 3 "Measure them the same way": three tasks (ribbon, parcel, jug; seeded order and sides). After the tool, she watches two friends' records in different units (3 big and 5 little worms, 2 big and 5 little blocks, 3 big and 6 little cups), then taps a big or little unit token to remeasure both. Big leaves the ribbon and parcel between marks: explained, no miss, little offered with a non-counting glow; big on the jugs is exact (3:3) and accepted. The raw records stay on the board, dimmed, beside the common-unit counts, both objects at one scale. Then three pads (left friend, two equal bars for "the same", right friend). Level 4 "How many little ones?": two tasks. One 1 kg weight balances four 250 g weights, grouped as 1000 g, then 2 kg against two groups; the table rows 1 kg = 1000 g and 2 kg = 2000 g fill as seen. She fills 3 kg = ? from 1000, 3000 or 4000 (seeded pad order), presses the tick (Check), then Send; the second task is 4 kg = ? from 2000, 4000 or 5000 with 3 kg already filled.

Rules (`src/games/measuring-post/logic.ts`, 23 rule tests): the tool must match the attribute asked; the larger count always belongs to the smaller unit; level 3 records are exact multiples or between marks as designed; level 4 totals are groups of 250 g. School band 1–4 (default 1).

Misses and help: a wrong tool (levels 1–4), a wrong row or a wrong comparison (level 3, hint naming the counts) or a wrong Check (level 4; repeating Check on the same wrong choice is not another miss) is a miss with a boing, a shake and a spoken reason ("The balance tells how heavy. We need how long."); after two misses on a task the useful control glows (counts as that step's hint). Help points and explains first (one hint per step: tool, answer; level 3 tool, little units, comparison; level 4 glows the right pad and names the groups, again chooses it, again points at Check); pressing again does the step. Changing a level-4 choice, or tapping the chosen pad again to take it back, is never a miss. Send is not a counted step. The speaker replays the question or result. Challenge `numbers`, music `STYLES.quiet`; touch demonstration on the how-to card. In Tinker Lab.

Deviations from the definition: a wrong tool does not animate measuring its own attribute; levels 3 (common-unit comparison) and 4 (conversion table) are not built.
