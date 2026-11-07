# Brain Break

<!-- generated: from src/games/brain-break; edit the text below the end mark (npm run game-docs) -->

**ID:** `brain-break` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** Visual search, Number order, Adding and taking away

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–6 |

| Level | Plays like |
| --- | --- |
| 1 | Find 1 to 9 on nine shuffled stones |
| 2 | Find 1 to 16 on sixteen shuffled stones |
| 3 | Find 1 to 25 on twenty-five shuffled stones |
| 4 | Find the sums that make 1 to 9, in order |
| 5 | Find the sums that make 1 to 16, in order |
| 6 | Find sums and take-aways that make 1 to 25, in order |

<!-- end generated -->

**Starts as:** find and light 1 to 9 on a shuffled pond of numbered stones, then of stones showing sums and take-aways

**Grows into:** six untimed boards: numbers on 3×3 (1–9), 4×4 (1–16), 5×5 (1–25); levels 4–6 show sums (6 adds take-aways) on the same three sizes, a lit stone showing its total; visible next number, checked stones stay put, automatic and requested hints; touch/mouse only

## Design notes

*Touch/mouse only · visual search, number order, and adding and taking away.* Light the pond stones in numerical order on a shuffled board. All numbers stay visible; the sign names the next one, and spoken support gives the target at the start and after a correct selection. Completed stones stay in place with a check. The final number finishes one round through the shell for one sticker, including with help.

Six levels use seeded permutations. Levels 1–3 are numbers on 3×3 (1–9), 4×4 (1–16) and 5×5 (1–25) boards. Levels 4–6, *Sums in order*, use the same three sizes but each stone shows a short sum instead of its number (such as 3+4, either order; total 1 is 1+0), and the sign reads "Make 7"; level 6 mixes sums and take-aways such as 12−3 (at least ten of each). A lit stone changes its label to its total, so only unsolved sums remain to work out. A wrong stone says what it makes and counts one miss; the outline and spoken hint name the target. Each stone is a 100-unit target. Tapping another unfinished number gives a gentle boing, repeats the target and counts one miss. Two consecutive misses outline the next stone and count one hint; each requested Hint counts help too. A correct choice clears the outline and consecutive-miss count. Tapping a checked stone is free. The how-to ghost finger finds every number through the same taps. Co-play takes turns, or one person calls while the other finds; off-screen play shuffles numbered paper squares.

This slice practices the search task without claims about general cognition. There is no timer, speed goal or saved personal best. A color-word mode remains a proposal (untimed, it reduces to reading); no controller or couch course is built.
