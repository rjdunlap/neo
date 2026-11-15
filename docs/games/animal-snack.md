# Animal Snack

<!-- generated: from src/games/animal-snack; edit the text below the end mark (npm run game-docs) -->

**ID:** `animal-snack` · **Land:** Barnyard · **Ages:** lap–pre-K · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** animals, words, matching, counting

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 2–4 |
| preschool | 3–5 |
| pre-K | 5–7 |

| Level | Plays like |
| --- | --- |
| 1 | One big animal: a touch anywhere gives a snack, and two friends walk in |
| 2 | Tap a snack: it floats to the animal who loves it |
| 3 | Who eats grass? or Who says moo? Tap the animal |
| 4 | Drag each snack to the animal who eats it |
| 5 | Give an animal 2 to 4 of its snack, then ring the bell |
| 6 | Who says moo? Drag its own snack to the animal that makes the sound |
| 7 | Who eats hay? There are two: tap both animals that eat it |

<!-- end generated -->

**Starts as:** one big animal; a touch anywhere gives it a snack, and two friends walk in

**Grows into:** eleven animals from level 3 (sheep, horse, hen and mouse join the first seven); snacks float to their eaters, "who eats grass?" or "who says moo?", drag each snack to its animal, give 2 to 4 with a numeral and countable dots; four seeded scenes (meadow, orchard, kitchen garden, dusk) with a far barn on the horizon

## Design notes

**A right answer never holds the next ask (U7 fix batch 1, 2026-11-10).** In *who* rounds `snack.yum` starts after the eating and the next ask follows at once (its instruction cuts the yum); on a right count the bell rings, a 0.4 s beat passes and the next ask follows, with `snack.full` no longer awaited. On the round's last ask the line is still heard out, since the closing `snack.done` would cut it. Hints (`snack.toomany`, `snack.more`) and `snack.done` stay held.

*After farm feeding toys and animal sound books.* Cow, bunny, dog, cat, duck, pig and bear, each with one favorite food (hay, grass, bone, fish, seeds, apple, honey; the bunny's grass replaced a carrot on 2026-10-22, since carrots are a sugary treat and rabbits mainly eat grass). Lap levels are cause and effect: tap an animal and it munches its snack with its own voice, or tap a snack and it floats to the animal who loves it. Then "who eats grass?" (tap the animal; at level 3 every second question asks "who says moo?" instead, with a speaker bubble that replays the sound, and the bunny's hop is never the clue), dragging each snack to its eater, and giving an animal 2–4 snacks before ringing the bell. The food sign shows the requested numeral and dots; speech counts tufts of grass, bones, fish, apples, bales of hay, handfuls of seeds and pots of honey. Idle lap play gently nudges a friend without counting a hint; overlapping animal taps choose the closest body. A wrong animal shakes its head and says what it eats instead (on a sound question it answers in its own voice, "not me", and counts as a miss); too many snacks come back. Two misses glow the right animal or the next useful thing. Each snack is eaten in three shrinking bites, with a synthesized sound per food (a crunch for apple, a swish for hay and grass, a gnaw for bone, a gulp for fish, pecks for seeds, a lick for honey), a puff of crumbs and a poke from the animal per bite; no rule changes. Each animal that eats its favorite food files a discovery-journal entry. (Level 1 once left the animals stacked off screen at the top-left; they are now laid out whenever a round creates them, and the play-through asserts it.) A tap while an animal is eating or speaking is answered, not lost: the tapped animal pokes with a tick and an uneaten snack wiggles, with no voice, food or miss. Each round's seed picks the scene: the meadow with a picnic blanket, an orchard with a falling apple and a trough, a kitchen garden with a tin tub, or the yard at dusk with a bowl; the rules and animals are the same everywhere. A small far barn stands on the horizon behind the fences, placed clear of every friend's tap circle (the orchard shows it only in wide views, where the tree leaves a gap).

**Level 1, one big animal (2026-11-12).** Lap's only level before 2, so it changed in place (the `oneBig` plan, munch mode). One big animal stands in the middle (`BIG_SCALE` 1.1 against 0.6 for friends); a layer over the whole meadow under the animals has a touch anywhere feed the nearest animal, at any distance. A touch while one eats or a friend walks in squishes it with a tick and counts nothing. The second and third friends walk in from the right after the second and fourth snacks (`friendsAfter`), each with its call, and a touch then feeds the nearest; six snacks finish the round, and the layout settles after a walk-in so a resize mid-walk leaves no animal off-screen. The line `snack.big` ("Who is hungry? Touch anywhere to give a snack!") is device speech with no rendered clip; the six-second idle nudge is unchanged. The ghost finger still taps an animal, so `fingerdemo` was not rerun.

**Level 6, Who says moo? (2026-11-14, dive slice 5).** The first pre-K level, so `bands` gains `prek` and `LEVELS.prek` is 5–6 (the decided pre-K window is 5–8; it widens as 7–8 land). The `sound` mode asks four questions; each deals three animals and their three snacks onto the blanket, plays one animal's sound (the speaker bubble replays it, free) and says `snack.givesound`, "Who says {sound}? Give it its snack!". She drags that animal its own snack. The animal is judged first: any other animal answers in its own voice ("That is the pig. Who says moo?") as a miss, even when the snack is its own favorite; the right animal with another food says `snack.notmine`, "No thank you! The cow eats hay." (a miss); its own snack is a yum. The second miss of a question glows the asked animal and the fourth glows its snack (both count as a hint). The same animal is never asked twice running and the bunny's hop is never the clue. The saved score is 2 and 1 in the play-through, as levels 3–5. The ghost finger drags the asked animal's snack to it (`snackTouch`, never a wrong animal), and the how-to card has a level 6 line.

**More animals (2026-11-14, dive slice 4).** Sheep (grass), horse (oats), hen (corn) and mouse (grain; decided 2026-10-23: grain, not cheese, since seeds are the duck's) are built once in the shared `src/art/critter.ts` (new parts wool, mane, comb, beak snout, big ears, tail and muzzle shade, all off for the first eight) and `src/audio/sfx.ts` (a baa, a neigh and a squeak; the hen reuses the cluck), so Peekaboo Barn's animals slice can reuse them. They join from level 3 up; levels 1 and 2 keep the first seven (`FIRST_ANIMALS`, `poolFor`). New snack art: oats in a red bucket, a corn cob, two ears of grain. Sheep and bunny both eat grass, so the dive's planned "a unique food across all eleven" did not hold: `dealAnimals` never deals two animals with one favorite and `eaterOf(food, present)` resolves among the animals present (rule-tested over 400 seeds per level). The sticker stays on the seven. The journal gains four `journal.snack.*` lines, forty observations in all. A new `FIRST_CAST` in `critter.ts` (the original eight, in order) pins Pet Kitchen, Hat Band, Little Conductor and Lemonade Stand, which dealt from `Object.keys(CRITTERS)`, so their seeds do not change. Checked on a phone portrait: a count round (sheep, horse, cow) and a kitchen-garden match round where grain, seeds and oats read apart. Level 8 *Who eats it too?* still needs decision 5's `EATS` table.
