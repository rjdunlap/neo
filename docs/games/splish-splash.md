# Splish Splash

<!-- generated: from src/games/splish-splash; edit the text below the end mark (npm run game-docs) -->

**ID:** `splish-splash` · **Land:** Cozy Village · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fine-motor, body-parts

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1, 2 |
| toddler | 1–4 |
| preschool | 3–7 |
| pre-K | 5–8 |

| Level | Plays like |
| --- | --- |
| 1 | Scrub all the mud off |
| 2 | Scrub all the mud off |
| 3 | Wash one body part at a time: tummy, ears, head |
| 4 | Wash one body part at a time: tummy, ears, head, cheeks |
| 5 | Wash 4 body parts in a different order each round |
| 6 | Wash 5 body parts in a different order each round |
| 7 | Two body parts at once: "wash my ears and my nose" |
| 8 | Two-step directions in order: "first your nose, then your ears" |
| 9 | Pat anywhere: each touch washes a bit of mud off, nothing to aim |

<!-- end generated -->

**Starts as:** scrub mud off the pet

**Grows into:** pat anywhere and the nearest mud patch comes off (lap starts here), then scrub, named body parts in a shuffled order, two at once, then "first … then …"

## Design notes

Scrub mud off the pet; nine levels. Level 9, *Pat the bubbles*, is the lap entry and is placed first (`order` [9, 1, 2], `entryLevels` [9]): any touch anywhere is a splash that takes a third off the nearest of four mud patches (tummy, head, two cheeks; at most 12 pats), with no misses or hints, and a patch sparkles after six idle seconds (an invitation, not a hint). The rest grow into named body parts in a shuffled order, two at once, then "first … then …". Washing the wrong part just makes the pet giggle and repeats the request; a finger that is still within reach of a patch it scrubbed in the same touch is not told off for brushing a neighbor on the way (the ears reach into the head's patch), but sliding on to another part still is. Levels 1–2 scrub with a palm-sized brush (1.6 times the usual reach, also used by the bot). Free levels 1–2 and the pat level name each part at its first touch ("My cheeks!", once per round, at least 2.5 s apart, never over the opening instruction) and as it goes clean ("Clean tummy!", except the last part, which has the finale's "Squeaky clean!"); parts levels 3–8 say "Clean ears!" before the next question. Wrong touches on a pair say "Those are my cheeks!". On levels 1–2, after 8 s with no touch the next muddy splotch sparkles and the pet wiggles (never a hint). Lines take whole phrases from a word-and-plural table, so a pair reads "Wash my ears and my nose!".

Per species (RW05 slice 2b): the mud rides each part of the companion rig. The sprout is asked for tummy, head, cheeks and ears with smaller splotches (its nose is never asked: it lies inside a cheek's and an ear's reach); the side-on river and glider are asked for tummy and head only, so their levels 3-8 hold two parts and level 7 is one paired ask with no wrong part to touch.
