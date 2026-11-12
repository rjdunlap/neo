# Peekaboo Barn

<!-- generated: from src/games/peekaboo-barn; edit the text below the end mark (npm run game-docs) -->

**ID:** `peekaboo-barn` · **Land:** Barnyard · **Ages:** lap–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** object-permanence, animal-words, memory

| Band | Levels, easiest first |
| --- | --- |
| lap | 16, 1, 2 |
| toddler | 1–5 |
| preschool | 4–8 |
| pre-K | 6–8 |

| Level | Plays like |
| --- | --- |
| 1 | Tap to find who's hiding, 3 hiding places |
| 2 | Tap to find who's hiding, 4 hiding places |
| 3 | "Where's the cow?" with 2 animals peeking |
| 4 | "Where's the cow?" with 3 animals peeking |
| 5 | "Where's the cow?" with 4 animals peeking |
| 6 | Remember who hid where, 2 hiding places |
| 7 | Remember who hid where, 3 hiding places |
| 8 | Remember who hid where, 4 hiding places |
| 16 | One big house: touch anywhere to see who pops out |

<!-- end generated -->

**Starts as:** tap barnyard, garden, beach or bedroom covers that swing, part, shake or lift

**Grows into:** touch anywhere to open one door, hear animal and cover names (some animals sleepy, surprised or singing), find a named animal, then remember hiding places

## Design notes

Each round’s seed chooses a barnyard, garden, beach or bedroom. The garden has a flowerpot, sunflower, wheelbarrow and rock against a flower-lined fence; the beach has an umbrella, sandcastle, bucket and towel on sand beside a sea band and sailboat; the bedroom has a blanket, toy box, curtain and bed on a peach rug against a lilac wall with a moon-and-star window; the barnyard keeps its haystack, bush, door and crate. Tap a hiding place to see who is behind it: doors swing, hay parts, a bush shakes and sheds a leaf, and a crate lid lifts, each with a soft synthesized sound. The animal and its cover are named aloud. Level 16 (One door, the lap entry placed first) is one big house: a touch anywhere opens it for a new animal each time (never the same twice running) and six touched reveals finish the round with no misses or hints; if nothing is touched for six seconds it opens by itself, and that self-opening does not count. Levels 1–2 finish after eight or twelve reveals; after six quiet seconds a hidden cover wiggles and sounds, without revealing an animal, counting help or earning a reward. Later, find a named animal, then remember who hid where. A wrong answer reveals its animal with a gentle boing and spoken reminder; two misses wiggle the right cover and count one hint. Overlapping touches choose the nearest cover, and four-cover rounds leave room for the pet. In free play (levels 1–2), about one reveal in three pops the animal out sleepy, surprised or singing, never the same feeling twice running, and the voice says it with the animal and cover ("A sleepy cow, behind the haystack!"); a sleepy friend yawns and a singing one hops with two notes. Sad is left out of a lap toy. The sticker and map-icon animal pool stays pinned to its original seven.

**A right find never holds the next question (U7 fix batch 7, 2026-11-12).** At the find levels (3–5) `peek.yes` starts and the look, the hiding and the next deal follow at once; the places open with the ask waiting for the line, or said at her first tap, which only says the ask and is not judged (the spot wiggles, no miss). The last find's line is heard out before the finale, and the ghost finger waits for the line and the ask. The remember levels (6–8) still wait for `peek.yes` before the show-and-tell, because its own `peek.look` would cut it.
