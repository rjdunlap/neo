# Size Parade

<!-- generated: from src/games/size-parade; edit the text below the end mark (npm run game-docs) -->

**ID:** `size-parade` · **Land:** Puzzle Peaks · **Ages:** lap–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** comparison, measurement, ordering

| Band | Levels, easiest first |
| --- | --- |
| lap | 16, 9 |
| toddler | 9, 1, 2, 3, 4, 17 |
| preschool | 3, 4, 17, 10, 5, 6, 11 |
| pre-K | 5, 6, 11, 7, 8, 12, 15 |
| school | 7, 8, 12, 13, 14, 15 |

| Level | Plays like |
| --- | --- |
| 1 | Find the bigger of two friends |
| 2 | Find the smaller of two friends |
| 3 | Find the biggest of three friends |
| 4 | Find the smallest of four friends |
| 5 | Line up three friends, smallest first |
| 6 | Line up three friends, biggest first |
| 7 | Line up five friends, smallest first |
| 8 | Line up five friends, biggest first |
| 9 | Tap the big one, then the little one |
| 10 | Find the middle-sized friend of three |
| 11 | Tap the friend who fits the bed, chair, bowl and door |
| 12 | Put a fifth friend into its place in a line of four |
| 13 | Behind a fence, tap pairs to swap them into order, four friends then five, littlest first |
| 14 | Measure two friends on a bank and a stump with a ribbon, then tap the taller |
| 15 | Line up five friends by shade, darkest first, then lightest first |
| 16 | Tap one friend to make it bigger, then smaller |
| 17 | Line up two friends, smaller first |

<!-- end generated -->

**Starts as:** tap the bigger or smaller friend; tap one friend to make it grow and shrink; drag friends into a line

**Grows into:** tap one friend to grow and shrink it, then the big or the little of two; the biggest or smallest of two to four; order two, three, then five friends in either direction; find the middle of three; find who fits the bed, chair, bowl and door; drop a fifth friend into the gap of an ordered line; line five shades darkest or lightest first; sort four then five friends behind a fence by their boots alone, testing pairs that swap if out of order, then open the gate; pull a ribbon up beside a friend on a bank, carry it across the stream to a friend on a stump and tap the taller; the chosen friend struts past the flag and a finished line marches off, a scale in bells (eight friends)

## Design notes

Four levels ask for the biggest or smallest friend across four short questions. Level 16 *Big duck, little duck* (lap first) shows one friend in the middle of the ground at 2.6 times its smallest size: each tap makes it one size bigger with a drum ("Bigger!", "Biggest!"), then one smaller with a squeak ("Smaller!", "Littlest!"), a cycle of littlest, middle, biggest, middle; three cycles (12 taps) end the round with "What a big little friend!", with no misses or hints, and a tap elsewhere only hops it. Level 9 *Big one, little one* (lap second, toddler first) shows two friends far apart (a 2.4 ratio) and asks "Tap the BIG one!", then "Tap the little one!", then big again, three rows, with two circles, the asked one ringed, as the cue; the right one drums (big) or squeaks (little). Level 10 *Big, middle, little* (preschool) shows three friends with the middle three ringed as a cue and asks for the middle one in at least two of four questions (the others biggest or smallest); a wrong pick says the middle line. Level 11 *Who fits?* (preschool top, pre-K) stands a bed, then a chair, a bowl and a door above three friends, each prop sized to fit exactly one ("Who fits this bed? Tap the friend."); the tapped friend tries it, lying on the bed, sitting on the chair or in the bowl, standing in the doorway: too big thumps and hangs over then fades ("Too big! That friend hangs right over the bed. Who fits it?"), too little sinks in and fades ("Too little! ..."), the fitting one settles ("Just right!"). The fitting friend is never the same rank twice running and every rank fits once; four props end the round with one sticker. Level 12 *Where does this one go?* (pre-K top, school first) stands four friends in size order on the ground (two of four questions smallest first, two biggest first) with a fifth waiting above; she drags it and the line slides apart to open the nearest of the five gaps under it. Right: the line of five marches off with a bell each. A wrong gap is a miss, the friend goes home and wiggles, the one friend beside the gap that shows the error hops and the pet says "It's bigger (smaller) than this one, so it goes after (before) it"; the second wrong in a row glows the right gap (one hint). A drop away from the line is free ("Put it in the line!", at most once every three seconds), as is a touch on a line friend, which hops it. Level 13 *Hidden heights* (school) stands four friends, then five, behind a picket fence with only same-size boots showing (five seeded boot colours, so nothing leaks height); the line starts at least two swaps from sorted. She taps one friend (held, teal ring; tap again lets go) and then another: the pair swaps places only if the left one is the bigger, otherwise both wiggle where they stand. A pair test is never a miss, and the meaning of a swap or a stay is spoken once per line. A gate card opens only on a littlest-first line: the fence drops, the friends show (still in boots) and march off in order with bells. A tap on the gate with a mixed-up line keeps it shut and counts a miss ("Some neighbours are still mixed up"); the second shut gate in a line counts one hint, glows and wiggles the first mixed-up neighbours, and from then on only that hint line is spoken. A littlest-first cue (small circle to big circle) and two progress circles; four then five friends end the round with one sticker. The ghost finger bubble-sorts by neighbour pair tests without looking behind the fence (at most n(n-1)/2 tests), then taps the gate. Level 14 *The measuring ribbon* (school) puts two friends on different footing, one on a grassy bank (left) and one on a tree stump across a stream (right), so they cannot stand together and the higher footing can make the shorter friend's head look higher (in two of four pairs it shows 22 to 40 units higher; true heights differ by 14 to 30; two different animals per pair, never Pip; the taller side is seeded). She pulls a ribbon straight up beside the bank friend (vertical drag only) until it snaps within 12 units to the top of its visible head, ears included, and a red mark appears; she carries the ribbon to the stump friend's lane (a drop anywhere else floats home) and taps the taller friend. A tap before measuring is a spoken guess, never a miss, and a right guess is acknowledged; after measuring, a wrong tap is a miss ("The ribbon says the {friend} is shorter") and the second in a pair counts one hint and glows the taller friend. A ribbon let go short of the head stays where it was with a throttled reminder, no miss. Four pairs end the round with one sticker; the ghost finger pulls, carries and taps the taller friend. Level 15 *Darkest first* (pre-K top, school) lines up five friends of one kind and size in five shades of blue, purple or red (lightness 0.30 to 0.78 in even steps, neighbours kept at least 1.35 contrast apart), darkest first and then the same five lightest first in one round, with a shade strip and arrow as the cue; a wrong friend is a miss ("That one's lighter (darker) than the one still waiting") and the second glows the right friend. Level 17 *Two in a line* (toddler and preschool, an entry level) drags two friends into a line, the first drag a toddler meets. Four later levels ask the child to drag three or five friends into an ascending or descending line. Windows: lap order 16, 9; toddler 9, 1, 2, 3, 4, 17; preschool 3, 4, 17, 10, 5, 6, 11; pre-K 5, 6, 11, 7, 8, 12, 15; school 7, 8, 12, 13, 14, 15; entry levels 9, 16, 17. Friends share an appearance and baseline, so size determines the answer; positions are shuffled. A fixed large hit area keeps the smallest friend easy to select.

The parade happens: after a right pick the chosen friend struts across the ground past a flag and off (six hops, direction seeded per round); a finished line marches off in line order, each friend setting off 0.18 s after the last with its bell (biggest lowest) and a low drum on each landing, so the line sounds like a scale, and the round waits for the last marcher before it ends. Eight friends (duck, bunny, cat, pip, cow, pig, bear, dog) come one per round; a flag on a pole and bunting along the back of the ground take seeded colours, each friend has a shadow scaled with it, and the sticker shows a seeded friend in three sizes. At the pick levels the first row keeps the even spread and later rows draw sizes from the five-step scale (two friends at least two steps apart; three or four friends keep the asked one clearly bigger or smaller than each neighbour, the middle one from both); line levels keep the even spread.

Words and touches: with two friends the pet says bigger or smaller, with more biggest or smallest; a wrong pick says "Look at their sizes. Which friend is bigger?" (or the level's word). At level 9 a wrong tap makes the other friend wiggle and say its own word ("That's the little one! Where's the big one?"). A tap on the sky or ground hops the waiting friends and repeats the ask (at most once every three seconds), never a miss. In the line levels a friend dropped on any spot but the glowing one hears "This spot first!" with a tick and a pulse of the glowing spot, never a miss; a wrong friend on the glowing spot is still a miss. The chime for a right pick is low for the biggest friend and high for the smallest.

Misses and hints at level 9: on the lap band the first wrong touch in a row is free and the second glows the asked friend and counts one hint; at toddler each wrong tap is a miss and the second glows the asked friend (a hint), as at level 1. Level 16 counts nothing. At level 11 a wrong try (too big or too little) is a miss and the second wrong in a row glows the fitting friend (one hint); a tap on the sky or ground is free. Level 13 counts a gate tap on a mixed-up line as a miss and the second one in a line as a hint; pair tests are free.
