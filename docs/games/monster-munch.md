# Monster Munch

<!-- generated: from src/games/monster-munch; edit the text below the end mark (npm run game-docs) -->

**ID:** `monster-munch` · **Land:** Counting Cove · **Ages:** lap–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** counting, one-to-one, sharing

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1, 2 |
| toddler | 2, 3, 10, 4 |
| preschool | 4–6 |
| pre-K | 5–7 |
| school | 6, 7, 12, 8, 11 |

| Level | Plays like |
| --- | --- |
| 1 | Tap cookies (or the monster) to feed it while it counts them |
| 2 | Feed three, then five cookies while the monster counts them |
| 3 | Give each monster one cookie |
| 4 | Feed 1 to 4 of one food (number and dots), then ring the bell |
| 5 | Feed 3 to 7 of one food (number only), then ring the bell |
| 6 | Feed two foods at once, like "2 carrots and 1 apple" |
| 7 | Share one food fairly, then say how many each monster got |
| 8 | Share fairly when it does not come out even: how many each, and how many left over? |
| 9 | Tap three big cookies (or the monster) and its belly grows |
| 10 | Give each monster a cookie and an apple |
| 11 | Call friends for groups of 2 or 3 cookies, then count friends and leftovers (including zero) |
| 12 | Share cookies and apples fairly, then count how many of each per monster |

<!-- end generated -->

**Starts as:** tap food (or the monster) into a hungry monster; five foods, five monster colours, three places

**Grows into:** big bites that grow its belly (lap entry, level 9), count along, one cookie each, one cookie and one apple each (toddler, level 10), feed exactly N then ring the bell, cookies and apples, fair sharing, sharing with leftovers, share both kinds fairly (school 12), call friends for groups of 2–3 and count friends/leftovers including zero (school 11)

## Design notes

A code-drawn monster gapes, chews, burps, and shows eaten food in a tummy window. It complements Duck Pond rather than repeating it: lap levels feed by tapping, toddler levels count along and give one cookie to each monster, and preschool levels ask for an exact order (cookies, or cookies and apples) that the child completes by ringing a bell, deciding for herself when to ring. A full monster refuses another of that food, which counts as a miss. Pre-K shares cookies fairly among two or three monsters; unequal shares hand the extras back to the tray, then the child says how many each monster got. Lap level 9 (*Big bites*, the lap entry before level 1) is two rounds of three big cookies: a tap on a cookie or on the monster feeds the next one, the belly grows with each bite, and nothing can be missed. Toddler level 10 (*One of each*, after level 3) gives two, then three, monsters a cookie and an apple each; a second of the same food to a monster is refused and counts as a miss. **Foods, monsters and places.** Levels 4–5 and 7–8 pick one food per round from a pool of five (cookie, apple, carrot, strawberry, cracker; never the same first food twice running); level 6 picks two that do not look alike (never cookie with cracker, or apple with strawberry); levels 1–3 and 9 stay cookies and levels 10 and 12 stay cookie and apple; level 11 stays cookies. Each monster is one of five colours (green, purple, orange, blue, pink; distinct within a round) with horns or a fuzzy crest and one big eye or two. A visit is set on the beach, at a cave mouth or on a picnic blanket, and the sticker draws its look and food from the same pools. The spoken sharing and leftover lines name the food. Level 8 (leftovers): the tray holds one or two more cookies than share evenly, and the bell says "I think it's fair". Uneven shares hand the extras back; ringing while everyone could still have one more is a gentle miss. Then two questions: how many each, and how many left over (those go to the pet). **Counting and answers.** Levels 1 and 2 play two rounds (4 then 6 cookies; 3 then 5). Level 1 counts each bite aloud, and a tap on the monster feeds it the next cookie; levels 4–6 count each bite of its kind ("2 cookies!"). A wrong number pad counts one monster's tummy together, ringing each icon as it is counted; at level 8's leftover question it counts the cookies on the tray. The hint line follows the glow (a cookie, the bell, a monster or a pad). A drop short of any monster is still no miss: it says "Hm?" and the nearest monster leans toward it. The level-7 card no longer mentions a bell, since the tray emptying triggers the fairness check. Whether per-bite counting keeps pace with quick feeding on device speech is unjudged.

School order is `[6, 7, 12, 8, 11]`, with existing IDs and pins retained. **Level 12, Share two kinds:** two monsters receive both cookies and apples fairly (1–3 of each per monster, at most ten foods). The first tray has four cookies and two apples. When the tray empties, each overfull kind comes back; an unequal share is one miss. Then two pads ask how many cookies each, and how many apples each; a wrong pad counts only that kind in one tummy. **Level 11, How many friends?:** one monster waits beside a tappable cave and a number/dots sign asks for 2 or 3 cookies each. Call up to four friends and deal whole shares, then ring when another whole share is impossible; answer how many friends ate, then how many cookies remain (zero included). The first tray is seven for two each. Calls reserve food still owed to friends already outside; a friend called without enough looks at the tray and goes inside, freely. An incomplete bell or a refused extra counts a miss, preserving partial groups for retry; two misses glow the next hungry friend, cave, bell or correct pad. Wrong friend-count pads count the visible friends, and wrong remainder pads count the tray (including zero). The ghost finger calls/deals without overfeeding and answers both questions. Four friends keep 145.6-unit circular targets; younger layouts stay as before. No companion-leftover scene, unlock, level 13 or level-5 overfeeding change is included.
