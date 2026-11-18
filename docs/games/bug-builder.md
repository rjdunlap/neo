# Bug Builder

<!-- generated: from src/games/bug-builder; edit the text below the end mark (npm run game-docs) -->

**ID:** `bug-builder` · **Land:** Tinker Lab · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, symmetry, visual-matching, counting

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 2, 3, 4, 5, 8 |
| pre-K | 4, 5, 8, 9, 6, 7, 10, 11 |
| school | 6, 7, 10, 11 |

| Level | Plays like |
| --- | --- |
| 1 | Decorate two spots with matching colors |
| 2 | Match four colored shape outlines |
| 3 | Copy four spots from a model bug |
| 4 | Copy six spots from a model bug |
| 5 | Mirror two spots onto the other wing |
| 6 | Mirror three spots onto the other wing |
| 7 | Mirror six spots, matching both shape and color |
| 8 | Count the spots: give a bare bug the number on the sign |
| 9 | Count a kind: give the bug the number of spots of one color or one shape |
| 10 | Fold a friend: predict which finished bug the folded wing will make |
| 11 | Mend the wing: find the spot that differs from its twin and fix it |

<!-- end generated -->

**Starts as:** decorate matching shape outlines

**Grows into:** copy a model, then mirror six spots using shape and color; matching wings fold and open together; then counting, where a bare bug is given the number on a sign, then counting only one kind of stamp; then predicting which finished bug a folded wing will make, then mending the one flawed place on a wing that should mirror

## Design notes

Two guided levels show pale matching shape outlines; two copy levels use a separate small model; three mirror levels ask for matching wings, ending with two columns and six spots. Reusable stamps return to the tray. The final palette contains repeated shapes and colors, requiring both attributes to match. Drops outside a spot are exploration, not mistakes. The tokens come from a pool of twelve, drawn by seed, so a round's colors are distinct (plans of four or fewer also keep every shape and color different), and a copy board is never symmetric. On the second wrong drop the hint glows the matching spot and also rings the twin across the line (mirror levels, with the line "Look across the line at its friend.") or the same place on the little model bug (copy levels). On completion at levels 5–7, both wings and their stamps fold across the middle together, meet their twins and open again; a faint model wing stays visible. This uses the existing finish wait and does not change misses or hints. Level 8 (count mode) is a bare bug with six open places, three per wing, and a sign showing a numeral (2–5 by seed) with hollow dots that fill as stamps land; extras hang below the card. Any of the three tray stamps goes in any place and the count is said as each lands. A tap on a stamped place lifts the stamp off. Exactly the sign's number on a green check finishes. One stamp too many is never a miss ("That's four. We wanted three. Tap one to take it off."); a check with the wrong number is a miss that says what the bug has against what is wanted. One hint per round, on the second over-count or second wrong check, after which the glow shows the next useful move (the extra stamp, an open place and a tray stamp, or the check). Preschool meets it last (after levels 2–5) and pre-K between levels 5 and 6. Level 9 (count a kind, pre-K) uses the same board, with a sign of one color or one shape beside the numeral and a tray of four stamps, two of the kind and two not. Only the kind counts: a wrong-kind stamp goes back to the tray with a boing, a miss, and a line naming what was put ("That's a pink circle. We wanted hearts!"). Over-counts are still free and a wrong check is a miss; one hint per round also glows a tray stamp of the kind. One attribute per sign; a two-part sign ("two red spots and one heart") would be a later level. Pre-K order is 4, 5, 8, 9, 6, 7, 10. Level 10 (fold a friend, pre-K and school; school order 6, 7, 10) is a prediction, not a puzzle: the left wing has three spots, the right wing is pale and empty, and three finished bugs are offered, the true fold, the wing slid across (inner and outer columns swap) and the true fold with two stamps swapped, the true one in a seed-chosen place. Tapping any card is never wrong: the left wing folds across the line (1 s), the true card glows, and the pet says "You saw it!" or "Look! The fold made this one." then "Each spot lands across the line, just as far from the middle." It always finishes with 0 misses and 0 hints, so level 10 never steps the difficulty down (deliberate); the ghost finger taps the true fold. Cards sit in a row under the bug, stacked and larger in a tall view. Level 11 (mend mode) gives a bug whose right wing mirrors the left except one place, wrong in color, wrong in shape (a look-alike) or missing. She taps the flaw (its stamp comes off and it rings blue), then drags the twin's stamp from a four-stamp tray (the left wing's three plus the look-alike, or a near look-alike when one is missing). A tap on a matching place is a miss with a boing and a blue ring on it and its twin; a wrong stamp on the flaw is a miss; the second miss brings the round's one hint (glow on the flaw, then on the tray stamp as well). The twin stamp mends the flaw even if she did not tap it first; a tap on the left wing gets a gentle line and is never a miss; ignored drops still tick. Both wings fold across the middle and open to finish, as on the mirror levels.

**Upright on a phone (2026-11-18, upright batch 9):** every level plays upright. Layout moved into `bugLayout` and `foldLayout` in `logic.ts`. The bug is drawn larger (1.18 to 1.3 times); level 7's six stamps take two rows of three (in one row they were 91 apart with 110-unit touch circles); the copy levels 3–4 put the model card above the bug with an arrow; level 11's places have 132-unit tap circles. A stamped place measures as its touch circle (`stampedPlace` in `art.ts`), not its drawn stamp (64–82 units). Layout test: `upright.test.ts`.
