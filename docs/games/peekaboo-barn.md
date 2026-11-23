# Peekaboo Barn

<!-- generated: from src/games/peekaboo-barn; edit the text below the end mark (npm run game-docs) -->

**ID:** `peekaboo-barn` · **Land:** Barnyard · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** object-permanence, animal-words, memory

| Band | Levels, easiest first |
| --- | --- |
| lap | 16, 1, 2, 17 |
| toddler | 1, 2, 17, 3, 4, 5 |
| preschool | 4–8 |
| pre-K | 6–13 |
| school | 9–15 |

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
| 9 | "Who is sleepy?" "Who has spots?" Find the one a clue describes, 3 animals |
| 10 | "Whose ears?" Find the one asked for from the top of its head, 3 animals |
| 11 | "Whose ears?" Find the one asked for from the top of its head, 4 animals |
| 12 | "Switcheroo!" Follow a house as two trade places, 3 houses |
| 13 | "Switcheroo!" Follow a house as houses trade 2 times places, 3 houses |
| 14 | "Switcheroo!" Follow a house as houses trade 3 times places, 4 houses |
| 15 | "Guess who!" Find the animal that fits both clues, four animals |
| 16 | One big house: touch anywhere to see who pops out |
| 17 | "Where did it go?" Watch an animal hop behind one of two hiding places, then tap where it went |

<!-- end generated -->

**Starts as:** tap barnyard, garden, beach or bedroom covers that swing, part, shake or lift

**Grows into:** touch anywhere to open one door, hear animal and cover names (some animals sleepy, surprised or singing), find a named animal, remember hiding places, find the one a clue describes (sleepy, singing, spots, ears), then tell who is who from the top of the head alone, follow a house through one to three swaps (Switcheroo) and find the one animal that fits two spoken clues (Guess who!). The sheep, horse, hen and mouse join the hiding pool from level 4

## Design notes

**One word in European Portuguese (WL2, 2026-11-22).** With the setting on, the pet adds the animal's or cover's word after the English line when an animal is found or felt in free play and One door (`peek.found`, `peek.feel`) and after a correct find (`peek.yes`) in the find, remember, top and swap modes; pairs, clue answers and *went* add none, the farm four (sheep, horse, hen, mouse) have no word and stay English, and misses, hints and the sticker do not change. The word table is `src/content/words/pt-PT.ts`; the setting is *A word in another language* on the grown-ups' page, per profile, off by default, and only a local pt-PT voice speaks it. See [the definition](../definitions/additional-languages.md#as-built-2026-11-22).

Each round’s seed chooses a barnyard, garden, beach or bedroom. The garden has a flowerpot, sunflower, wheelbarrow and rock against a flower-lined fence; the beach has an umbrella, sandcastle, bucket and towel on sand beside a sea band and sailboat; the bedroom has a blanket, toy box, curtain and bed on a peach rug against a lilac wall with a moon-and-star window; the barnyard keeps its haystack, bush, door and crate. Tap a hiding place to see who is behind it: doors swing, hay parts, a bush shakes and sheds a leaf, and a crate lid lifts, each with a soft synthesized sound. The animal and its cover are named aloud. Level 16 (One door, the lap entry placed first) is one big house: a touch anywhere opens it for a new animal each time (never the same twice running) and six touched reveals finish the round with no misses or hints; if nothing is touched for six seconds it opens by itself, and that self-opening does not count. Levels 1–2 finish after eight or twelve reveals; after six quiet seconds a hidden cover wiggles and sounds, without revealing an animal, counting help or earning a reward. Later, find a named animal, then remember who hid where. A wrong answer reveals its animal with a gentle boing and spoken reminder; two misses wiggle the right cover and count one hint. Overlapping touches choose the nearest cover, and four-cover rounds leave room for the pet. In free play (levels 1–2), about one reveal in three pops the animal out sleepy, surprised or singing, never the same feeling twice running, and the voice says it with the animal and cover ("A sleepy cow, behind the haystack!"); a sleepy friend yawns and a singing one hops with two notes. Sad is left out of a lap toy. The sticker and map-icon animal pool stays pinned to its original seven.

**A right find never holds the next question (U7 fix batch 7, 2026-11-12).** At the find levels (3–5) `peek.yes` starts and the look, the hiding and the next deal follow at once; the places open with the ask waiting for the line, or said at her first tap, which only says the ask and is not judged (the spot wiggles, no miss). The last find's line is heard out before the finale, and the ghost finger waits for the line and the ask. The remember levels (6–8) still wait for `peek.yes` before the show-and-tell, because its own `peek.look` would cut it.

**Level 9, Who has…? (2026-11-14).** The three animals stand fully out over their covers, not peeking, so body parts show. Each question is a clue that fits exactly one: a feeling (sleepy yawns; singing hops with two marimba notes every 3 s, only while nothing is being said; never surprised, since every critter pops up surprised) or a part (spots, horns, whiskers, wings, a bill, a round pink snout, long, pointy, floppy or round ears), redealt until one animal has it. Questions run feeling, part, part, feeling, part, and the ask never names the animal. A wrong tap boings, squishes the animal and says a true fact about it before the clue again; two misses wiggle the right cover. It opens the school band (school 9 only).

**Levels 10–11, Whose ears? (2026-11-15).** Only the top of each head shows over its cover (the `top` pose, critter y −48): ears, horns, a tuft, a mane, a comb, wool and the head colour, never the eyes, behind a 150-tall cover. She is asked by name ("Where is the bunny?") among three, then four, and no two tops in a deal look alike. A wrong tap raises that animal, which says hello and sinks back; two misses wiggle the right one and raise it to a full peek for 1.4 s (one hint). The beach sandcastle's wall is as high as its towers so no face shows between them. Pre-K 6–11, school 9–11.

**Levels 12–14, Switcheroo (2026-11-15).** Three animals show and hide as in remember mode, "Switch!" is said, and houses trade places one pair at a time (1, 2, then 3 swaps; levels 12–13 have three houses, 14 has four, goal 5). The front house lifts in a low arc (50 units × scale, so its grass strip never shows a bottom edge) and passes in front of the rest while the other slides along the ground behind; a swap takes 1.1 s. `dealSwaps` never repeats a pair back to back and picks an answer whose house ends somewhere new. Positions come from `slots` in `update`, so a phone rotation mid-swap lands houses in their new places. A wrong tap pops that house's animal out, says hello and hides it; two misses (one hint) glow the right house, fade all houses back to the start order, show the friend ("Watch the cow again!") and replay the swaps at 1.6 s each before asking again. Bands: pre-K 6–13, school 9–14.

**Level 15, Guess who! (2026-11-15).** Four animals stand out over their covers for each of five questions. The answer has both features, one other animal has the first feature, one has the second, and one has neither. Clues describe visible parts and white or brown coats. A wrong tap gets a gentle boing and explains which feature the animal has and which it lacks, or repeats both clues when the animal has neither. Two misses on a question make the answer glow and count as one hint. The guide repeats the clues. Portrait arranges the animals in two rows, and the ghost finger taps the visible animal. The school range is 9–15.

**Level 17, Where did it go? (2026-11-16).** Two houses, four questions, the first seven animals. One animal trots in from the right along the front, calls, hops over a house and drops behind it, and she taps where it went. A tap on the empty house counts one miss and opens on nobody ("Nobody home!"); the second miss counts one hint, wiggles the right house and sounds the animal again. The same animal never comes twice running and the same side never three times (`dealWent`). Lap plays 16, 1, 2, 17 and toddler 1, 2, 17, 3, 4, 5 by `order`; no saved level moves.

**More animals (level 4 and up, 2026-11-15).** The sheep, horse, hen and mouse (already drawn in `critter.ts` and voiced in `sfx.animal` for Animal Snack) join the hiding pool from level 4 through `poolFor(level)` (`NEWCOMER_LEVEL = 4`); levels 1–3 and level 16 (One door) keep the first seven animals and deal as before. Sounds and words: Baa, Neigh, Cluck cluck, Squeak squeak (`VOICES` now lives in `logic.ts`). Level 9 clues gained wool, a mane and a red comb; the mouse's big ears count as round ears (drawn as circles), so bear and mouse together never make "round ears" unique, and there is no beak clue because a duck's bill is a beak too. At levels 10–11 all eleven tops differ (tested over every 3- and 4-subset). Stickers and the map icon stay on the original seven.
