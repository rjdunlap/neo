# Ribbon Workshop

<!-- generated: from src/games/ribbon-workshop; edit the text below the end mark (npm run game-docs) -->

**ID:** `ribbon-workshop` · **Land:** Counting Cove · **Ages:** school–grown-up · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fractions, equivalent-fractions, measurement

| Band | Levels, easiest first |
| --- | --- |
| school | 1, 2, 3, 6, 7 |
| grown-up | 6, 7 |

| Level | Plays like |
| --- | --- |
| 1 | A whole ribbon: a whole from halves and quarters |
| 2 | Snip a half: a half, then a quarter that needs the scissors |
| 3 | Three quarters: ¾ as ½ + ¼, then from two halves with a snip |
| 6 | Whole Switch: one ribbon is a half of the short spool and a quarter of the long one; choose the whole, then name the part |
| 7 | Ribbon Cases: two gifts share one tray; make three quarters twice, then repair it when the order changes to a whole and a half |

<!-- end generated -->

**Starts as:** tap ribbon pieces (halves and quarters of one whole) onto a bench to match a gift tag's length, then bow it

**Grows into:** two gifts a round; the scissors snip a half into two quarters from level 2; every combination that makes the length is accepted, and a too-long or too-short check shows the gap or overhang

## Design notes

Level 6 *Whole Switch* ([definition](../definitions/whole-switch.md), its own scene in `switch.ts`): one 6-tick ribbon never changes. She taps a spool card (the short 12-tick or the long 24-tick) to make it the whole, taps a name card (¼, ½, ¾) and taps the bow. Tag 1 accepts either true statement (a half of the short spool, a quarter of the long one); tag 2 accepts only the other; repeating tag 1's statement on tag 2 is "same" and free. A wrong check is one miss, puts the name card back and plays a measure (a ghost of the ribbon steps along the whole, 2 or 4 steps, a mark and note each; any tap skips it). The second miss on a tag glows one hint, which points at the spool the chosen name is already true for, else the first accepted spool. An empty check or a tap on the ribbon counts nothing; undo steps back through every change. Touch only.

Level 7 *Ribbon Cases* ([definition](../definitions/ribbon-cases.md), its own scene in `cases.ts`; school and `grownup`): two gifts share one tray of a half and four quarters, and both ask for ¾ (shown as a dashed outline, its end line and the tag on the gift). She taps a gift to work on it, taps pieces onto its bench, snips a half if she wants, and taps the bow when both are right. Three sharings are accepted (the half on either gift, or all quarters after a snip). Then one order card changes the requests to a whole and a half (which gift grows is seeded) and she moves a quarter from one gift back through the tray to the other. A wrong check is one miss; the second miss on a tag glows the next step from a shortest-route solver (fewest touches), which the ghost finger also follows. An empty check, a refused overfull place and a tap on the "1 whole" card or order card count nothing. Supplies reset each round; no saved inventory. Touch only.

*After the fractions study; [definition](../definitions/ribbon-workshop.md).* A gift waits on the workbench and its tag asks for a ribbon of one length of a declared whole (the spool above the bench). She taps halves and quarters in the tray and each unrolls onto the bench end to end; tapping a bench piece sends it back to the tray, and undo takes back the last place, return or snip. When she thinks the length is right she taps the bow: the pieces join and tie around the gift. A round is two gifts and earns one sticker, with or without help. Every combination that makes the length is accepted (a rule test checks the accepted compositions against brute force), so one amount shows several names.

Levels 1–3 (school; level 6 is above): 1 a whole from halves and quarters (two halves, a half and two quarters, or four quarters); 2 the scissors appear and gift 1 asks for a half (including a tray of only quarters), while gift 2 asks for a quarter from two halves and cannot be made without a snip; 3 three quarters, whose second gift tempts two halves (a whole, too long) until she returns one, snips the other half and uses a quarter. The scissors snip a tray half into two quarters in place. The bench holds six quarter-ticks (one and a half wholes); a place past that is refused with a shake and "no more room".

Misses and hints: Check on an empty bench is free, and so is a refused overfull place. A non-empty bench that is the wrong length is one miss, and the gap (too short) or the overhang (too long) flashes. The second miss glows the solver-led next step (a place, a return or a snip) as one hint; the pause sheet's "Show a hint" counts one unless the glow is already up. The ghost finger follows the same hint path, and the demonstration plays one gift (the snip gift at levels 2–3). Touch only; no couch play.
