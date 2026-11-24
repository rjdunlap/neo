# Brain Break

<!-- generated: from src/games/brain-break; edit the text below the end mark (npm run game-docs) -->

**ID:** `brain-break` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Visual search, Number order, Adding and taking away, Counting by steps, Comparing numbers, Alternating number and letter order

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–12 |

| Level | Plays like |
| --- | --- |
| 1 | Find 1 to 9 on nine shuffled stones |
| 2 | Find 1 to 16 on sixteen shuffled stones |
| 3 | Find 1 to 25 on twenty-five shuffled stones |
| 4 | Find the sums that make 1 to 9, in order |
| 5 | Find the sums that make 1 to 16, in order |
| 6 | Find sums and take-aways that make 1 to 25, in order |
| 7 | Count by twos, threes, fives or tens |
| 8 | Count by harder steps, up or back |
| 9 | Any sixteen numbers, smallest first |
| 10 | Numbers below zero, smallest first |
| 11 | Two trails: 1, A, 2, B |
| 12 | Two trails: 1, L, 2, K |

<!-- end generated -->

**Starts as:** find and light 1 to 9 on a shuffled pond of numbered stones

**Grows into:** bigger boards, sums and take-aways, counting by steps, sorting numbers including below zero, and alternating between number and letter trails

## Design notes

*Touch/mouse only · visual search, ordering, and adding and taking away.* Light pond stones in order on a shuffled board. Labels stay visible. The sign and spoken cues guide each move. Completed stones stay in place with a check. The final stone finishes one round through the shell for one sticker, including with help.

Every level shuffles the stones with a seeded permutation. Levels 1–3 are numbers on 3×3 (1–9), 4×4 (1–16) and 5×5 (1–25) boards. Levels 4–6, *Sums in order*, use the same three sizes but each stone shows a short sum instead of its number (such as 3+4, either order; total 1 is 1+0), and the sign reads "Make 7"; level 6 mixes sums and take-aways such as 12−3 (at least ten of each). A lit stone changes its label to its total, so only unsolved sums remain to work out. A wrong stone says what it makes and counts one miss; the outline and spoken hint name the target. Each stone is a 100-unit target. Tapping another unfinished number gives a gentle boing, repeats the target and counts one miss. Two consecutive misses outline the next stone and count one hint; each requested Hint counts help too. A correct choice clears the outline and consecutive-miss count. Tapping a checked stone is free. The how-to ghost finger finds every stone through the same taps. Co-play takes turns, or one person calls while the other finds; off-screen play shuffles numbered paper squares.

This slice practices the search task without claims about general cognition. There is no timer, speed goal or saved personal best. Every tap squashes the stone a little and a wrong stone nudges side to side. After the last stone a yellow ribbon through the stones in the order they lit replays with a travelling dot and pentatonic bells (about 2 s) before the finishing line. Each round draws one of three seeded pond looks (day, dusk, moss) after the board, so boards, rules and miss/hint accounting are unchanged. A color-word mode remains a proposal (untimed, it reduces to reading); no controller or couch course is built. Levels 7–8, *Count by*, use a `Trail` model in `logic.ts` (`makeTrail`, `trailValue`, `ruleSign`): the board still holds ranks 1..n, and a stone shows k·rank, or k·(n+1−rank) when counting back, so levels 1–6 draw the same boards for the same seeds. The sign names a rule, never a rank ("Count by 3 · start at 3", then "after 12"). Level 7 is 4×4 with steps 2, 3, 5, 10; level 8 is 5×5 with steps 4, 6, 7, 8, 9 and half the rounds back. A wrong stone says its own number and how to count on, never the answer, and counts one miss; the outline and hint say the target value. The browser suite checks labels fit inside the stones. Levels 9–10, *Smallest first* and *Below zero*, reuse the rank model: the board still holds ranks, and `makeValues` gives the sorted values for a rank (drawn after the look and trail, so levels 1–8 boards are unchanged). Level 9 is 4×4 with sixteen different numbers 1–99, always including one swapped-digit pair (such as 37 and 73); the sign says "Smallest first", then "After 37". Level 10 is 5×5 with twenty-five different whole numbers from −20 to 20, at least eight each side of zero and one n/−n pair; labels use a true minus sign and are spoken "minus twelve". A wrong stone says its own number and that a smaller one is still unlit ("That one is 52. A smaller one is still unlit."), never the answer, and counts one miss. Both start lines have rendered clips.

Levels 11–12, *Two trails*, also use the same ranks. Level 11 alternates 1–8 with A–H on a 4×4 board. Level 12 counts up 1–13 while the letters go back from L to A on a 5×5 board. The sign shows which trail comes next and up to two recently lit labels. The spoken cue points back to the last stone on that trail or tells the player where to start. A wrong tap reads the stone and gives the cue, and Hint says and outlines the next stone. In co-play, one person finds the numbers and the other finds the letters. The level range ends at 12. The [deep dive](../deep-dives/brain-break.md#build-slices-in-order) plans the next levels.
