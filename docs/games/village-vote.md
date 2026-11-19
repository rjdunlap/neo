# Village Vote

<!-- generated: from src/games/village-vote; edit the text below the end mark (npm run game-docs) -->

**ID:** `village-vote` · **Land:** Cozy Village · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** counting, comparing, group-decisions

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–3 |
| school | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Two choices — count two groups and choose more |
| 2 | Your pet votes too — choose freely, then count |
| 3 | Three choices — compare tallies and choose most |

<!-- end generated -->

**Starts as:** count pictured toy preferences, then everyone plays

**Grows into:** levels 1–3: two groups; one free pet vote that can lose; three tallies including 3–2–2. Replay counts, capped help, shared-play finish; Cozy Village

## Design notes

One election chooses a slide, swing or sandpit and everyone tries it. Level1 counts two groups (3–1 or4–2). Level2 first lets the pet freely choose either toy, then counts the four friends plus exactly one pet vote (NPC families3–1 or4–0). Its preference can lose; the pet still plays first. Level3 compares seven friends across three tallies (4–2–1 or3–2–2). Preschool1–2, pre-K1–3, school3. Families, toy slots and NPC assignments are seeded; every election has one unique largest group.

Tap a whole friend/paw panel to count it once; repeating it or tapping its tally board replays the current partial count. Marks/numerals show only counted friends. Tap a toy picture to declare the actual winner, with no counting prerequisite. Only a deliberate wrong declaration counts a miss; feedback recounts without naming the answer. After two misses the answer glows and assistance is recorded. Hint counts all groups and explains the comparison; another Hint demonstrates the winning tap. All support stays capped at1 for this single decision, including after resize and phase changes. Counts, replay, free preference, cancelled/outside release and stale/busy input are free. Down feedback is immediate; a matching inside release commits the action. Automatic shared play finishes once through the shell for one sticker, including with help. No persistent toy, Keep, unlock or later tie/run-off levels. Voice, level-scoped card and public-input finger demos included; device/child evidence remains open.

On upright phones the layout in `logic.ts` takes an upright branch: three toys at x 144, 384 and 624 (two at 290 and 558), their tallies and paws beneath (paw rows 125 apart), the help button at the bottom right (90 × 100), and the whole scene dropped by `max(0, height - 1024)` so it hangs up from the bottom edge on a tall phone, leaving sky at the top. A new pure `playLayout` places the sharing scene in a row of four centred on 768. The sideways layout is unchanged and pinned by `upright.test.ts`, which covers every level, vote family, pet choice and five views.
