# Animal Snack

<!-- generated: from src/games/animal-snack; edit the text below the end mark (npm run game-docs) -->

**ID:** `animal-snack` · **Land:** Barnyard · **Ages:** lap–preschool · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** animals, words, matching, counting

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 2–4 |
| preschool | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | One big animal: a touch anywhere gives a snack, and two friends walk in |
| 2 | Tap a snack: it floats to the animal who loves it |
| 3 | Who eats grass? or Who says moo? Tap the animal |
| 4 | Drag each snack to the animal who eats it |
| 5 | Give an animal 2 to 4 of its snack, then ring the bell |

<!-- end generated -->

**Starts as:** tap an animal and it munches its favorite snack

**Grows into:** snacks float to their eaters, "who eats grass?" or "who says moo?", drag each snack to its animal, give 2 to 4 with a numeral and countable dots; four seeded scenes (meadow, orchard, kitchen garden, dusk) with a far barn on the horizon

## Design notes

**A right answer never holds the next ask (U7 fix batch 1, 2026-11-10).** In *who* rounds `snack.yum` starts after the eating and the next ask follows at once (its instruction cuts the yum); on a right count the bell rings, a 0.4 s beat passes and the next ask follows, with `snack.full` no longer awaited. On the round's last ask the line is still heard out, since the closing `snack.done` would cut it. Hints (`snack.toomany`, `snack.more`) and `snack.done` stay held.

*After farm feeding toys and animal sound books.* Cow, bunny, dog, cat, duck, pig and bear, each with one favorite food (hay, grass, bone, fish, seeds, apple, honey; the bunny's grass replaced a carrot on 2026-10-22, since carrots are a sugary treat and rabbits mainly eat grass). Lap levels are cause and effect: tap an animal and it munches its snack with its own voice, or tap a snack and it floats to the animal who loves it. Then "who eats grass?" (tap the animal; at level 3 every second question asks "who says moo?" instead, with a speaker bubble that replays the sound, and the bunny's hop is never the clue), dragging each snack to its eater, and giving an animal 2–4 snacks before ringing the bell. The food sign shows the requested numeral and dots; speech counts tufts of grass, bones, fish, apples, bales of hay, handfuls of seeds and pots of honey. Idle lap play gently nudges a friend without counting a hint; overlapping animal taps choose the closest body. A wrong animal shakes its head and says what it eats instead (on a sound question it answers in its own voice, "not me", and counts as a miss); too many snacks come back. Two misses glow the right animal or the next useful thing. Each snack is eaten in three shrinking bites, with a synthesized sound per food (a crunch for apple, a swish for hay and grass, a gnaw for bone, a gulp for fish, pecks for seeds, a lick for honey), a puff of crumbs and a poke from the animal per bite; no rule changes. Each animal that eats its favorite food files a discovery-journal entry. (Level 1 once left the animals stacked off screen at the top-left; they are now laid out whenever a round creates them, and the play-through asserts it.) A tap while an animal is eating or speaking is answered, not lost: the tapped animal pokes with a tick and an uneaten snack wiggles, with no voice, food or miss. Each round's seed picks the scene: the meadow with a picnic blanket, an orchard with a falling apple and a trough, a kitchen garden with a tin tub, or the yard at dusk with a bowl; the rules and animals are the same everywhere. A small far barn stands on the horizon behind the fences, placed clear of every friend's tap circle (the orchard shows it only in wide views, where the tree leaves a gap).
