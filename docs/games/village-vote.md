# Village Vote

<!-- generated: from src/games/village-vote; edit the text below the end mark (npm run game-docs) -->

**ID:** `village-vote` · **Land:** Cozy Village · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** counting, comparing, group-decisions

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–3 |
| school | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Two choices — count two groups and choose more |
| 2 | Your pet votes too — choose freely, then count |
| 3 | Three choices — compare tallies and choose most |
| 4 | A tie — move the fewest group's votes to their next choice, then choose most |
| 5 | Everyone can use it — find who the built toy leaves out, then choose a fix |

<!-- end generated -->

**Starts as:** count pictured toy preferences, then everyone plays

**Grows into:** levels 1–3: two groups; one free pet vote that can lose; three tallies including 3–2–2; level 4 a tie between the top two with a run-off; level 5 finding who the built tall slide's high first step leaves out, then choosing a fix. Replay counts, capped help, shared-play finish; Cozy Village

## Design notes

One election chooses a slide, swing or sandpit and everyone tries it. Level1 counts two groups (3–1 or4–2). Level2 first lets the pet freely choose either toy, then counts the four friends plus exactly one pet vote (NPC families3–1 or4–0). Its preference can lose; the pet still plays first. Level3 compares seven friends across three tallies (4–2–1 or3–2–2). Preschool1–2, pre-K1–3, school3. Families, toy slots and NPC assignments are seeded; every election has one unique largest group.

Tap a whole friend/paw panel to count it once; repeating it or tapping its tally board replays the current partial count. Marks/numerals show only counted friends. Tap a toy picture to declare the actual winner, with no counting prerequisite. Only a deliberate wrong declaration counts a miss; feedback recounts without naming the answer. After two misses the answer glows and assistance is recorded. Hint counts all groups and explains the comparison; another Hint demonstrates the winning tap. All support stays capped at1 for this single decision, including after resize and phase changes. Counts, replay, free preference, cancelled/outside release and stale/busy input are free. Down feedback is immediate; a matching inside release commits the action. Automatic shared play finishes once through the shell for one sticker, including with help. No persistent toy, Keep or unlock; level 6 is not built. Voice, level-scoped card and public-input finger demos included; device/child evidence remains open.

On upright phones the layout in `logic.ts` takes an upright branch: three toys at x 144, 384 and 624 (two at 290 and 558), their tallies and paws beneath (paw rows 125 apart), the help button at the bottom right (90 × 100), and the whole scene dropped by `max(0, height - 1024)` so it hangs up from the bottom edge on a tall phone, leaving sky at the top. A new pure `playLayout` places the sharing scene in a row of four centred on 768. The sideways layout is unchanged and pinned by `upright.test.ts`, which covers every level, vote family, pet choice and five views.

**Level 4, *A tie* (batch `village-vote 2`; school 3–4).** Three pictures whose top two groups tie (families 3–3–2, 3–3–1, 2–2–1). Tapping either tied picture after counting says "It's a tie!" and is no miss; the fewest group's picture dims and its friends show a 48-unit second-choice badge. She taps a friend, then the badge's toy, to move its vote; moved friends count in their new group. Misses: tapping the fewest picture before the tie, sending a friend to the other tied toy, declaring the smaller group after the run-off. Hints: at most one per decision (the run-off, the final choice), so 0–2 a round; help before the tie counts as the final choice's hint. Upright layout at level 4 puts pairs at ±62 and fills the left column right-first so a five-vote left column's third-row friend stays clear of the guide (levels 1–3 unchanged). New voice lines (tie, runoff, recount, not-next, closed, nudge) with one rendered clip for the untemplated recount line. Tests: `tie.test.ts` (rules, independent instant run-off), level-4 cases in `play.test.ts` and `upright.test.ts` (every seeded round and winner slot). The browser suite's `VILLAGE_VOTE_ONLY=tie` runs the level-4 play alone on a touch phone context.

**Level 5, *Everyone can use it* (batch `village-vote 3`; school 3–5).** The vote opens already counted (tall slide 5–3 or 4–2 against the swing or sandpit, either slot; the plain slide is never the other toy) and the voice says "The tall slide won, five to three. Let's build it!" while taps wait. Then the built tall slide stands over the friends in rows of four (`accessLayout`): friends who can use it sit on a small slide; one to three friends from the other toy's group stand on the ground, drawn smallest, beside a ladder whose first rung is above them. She taps each one (a hop, "The first step is too high", a tick); a found friend again replays the line, free. Tapping a friend on the slide is the one miss ("This friend is on the slide!"). When all are found, two fix cards appear (*add a step*, *a lower slide*; 210 × 150, upright in a row at y 880 between the guide and the Hint, sideways beside the toy); either one is built, the voice names what each takes, and everyone plays. Hint: the first glows the friends still left out and says the step line, the second sends the ghost to one, so at most one hint; Hint at the fix cards only repeats the choice and records nothing. Wording keeps the problem on the step, never the friends or how they voted. A resize during the opening line skips to the built slide. Seven voice lines, six rendered clips (the opening line is templated). `tall-slide` is a level-5-only option: `OPTIONS` stays the three toys, so levels 1–4's seeded rounds are unchanged. Friends now keep the same animal (by ID) in the sharing scene, which used to reassign them by position. Tests: `access.test.ts` (rules), level-5 cases in `play.test.ts` and `upright.test.ts` (every seed, both phases, sideways and tablet too); `VILLAGE_VOTE_ONLY=access` runs the level-5 play alone on a touch phone.
