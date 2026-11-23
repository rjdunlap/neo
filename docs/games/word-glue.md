# Word Glue

<!-- generated: from src/games/word-glue; edit the text below the end mark (npm run game-docs) -->

**ID:** `word-glue` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** compound-words, vocabulary, word-meaning

| Band | Levels, easiest first |
| --- | --- |
| lap | 4, 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3 |
| school | 3, 5, 6 |

| Level | Plays like |
| --- | --- |
| 1 | Stick them: join the only pair to make a new thing |
| 2 | What do they make? Find the two pictures that make the asked word |
| 3 | Who is it for? Join the friend who needs the thing in the middle |
| 4 | One big picture: a touch anywhere flies its partner in to stick on, and the new thing joins the shelf (5 things) |
| 5 | What kind of thing? Tap the part the made thing really is (5 asks) |
| 6 | Which way round? Tap the thing the pet names (4 asks) |

<!-- end generated -->

**Starts as:** tap or drag one picture onto another and they join into a third thing that comes alive (sun and flower, dog and house), the pet saying "sun… flower… sunflower!" (lap opens one step earlier, on one big picture)

**Grows into:** level 1 joins any pair of five (counts nothing); level 2 asks for a word and gives three pictures, the two parts and one that makes no word with either (a wrong pair wobbles and the pet says its word); level 3 keeps a shared head (house, box, brush) and a friend asks for it, a wrong friend briefly gets the wrong thing; two misses or Show a hint glow the right pair or friend, one hint per ask; level 4 (lap only, first in lap's order) is one big picture and a touch anywhere sticks its partner on; level 5 (school, after 3) asks "Is a doghouse a dog or a house?" and she taps the part the made thing is; level 6 asks her to hear which thing the pet names, such as a houseboat or a boathouse

## Design notes

*Slice VW1 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md), [definition](../definitions/word-glue.md).* Pictures sit on a soft table; she drags one onto another (at the lap band a tap is enough) and they hop together into a third thing that comes alive, while the pet says "first… second… word!" Bands: lap 1, toddler 1–2, preschool 2–3, pre-K 3, school 3. Level 1, *Stick them*: five pairs, any tap or drop joins, nothing is counted. Level 2, *What do they make?*: five asked words, three pictures (the two parts and a seeded distractor that forms no listed or denied word with either part, in either order); a wrong pair wobbles with a boing and the pet says its word and parts; one miss per distinct wrong pair per ask. Level 3, *Who is it for?*: two of three heads (house, box, brush), two asks each; a friend says "I need a house!" and she drags the head onto the asking friend; a wrong friend briefly gets its real thing and the pet says what it is and who it is for (one miss). After two misses on an ask the right pair (level 2) or the asking friend (level 3) glows and counts one hint, at most once per ask; Show a hint does the same. A wrong drop after the glow and two earlier wrong drops joins the right pair with no further count. Made things go to a decorative shelf and all play their animations at the end; nothing is kept or filed. Each level's first round of a session (and the demo) is the definition's authored round. Ghost finger drags the hint pair (taps at lap level 1; touches the level 2 distractor once first).

**Level 4, One big picture (lap's first, 2026-11-13).** One big picture (300 units) in the open; a layer over the whole view takes every touch. A touch anywhere flies its partner in from the right edge to stick on, the made thing (300) appears and goes to the shelf along the top, and the next big picture rolls in from the left. Five things (a session's first round is sunflower, doghouse, cupcake, beehive, sailboat). Nothing can be a miss: Show a hint glows the picture and says "Touch anywhere to stick them together!" (`wordglue.instruct.big`, also the instruction) and counts nothing. A touch during a join hops the big picture rather than being swallowed. The join line never holds the next picture (it opens about 2.2 s into a 4 s stretched line); the last is heard out. The ghost finger taps the grass beside the picture. Lap's order is `[4, 1]` and the level is an entry level: a saved 4 carried into toddler starts at toddler's level 1.

**A join never holds the next ask (U7 fix batch 21, 2026-11-12).** The joined word (`wordglue.join`) starts and the shelf flight and the next ask follow at once; at levels 2–3 the ask waits for the join, is said by the guide, or is said at her first touch instead of the picture's word. The last ask's join is heard out.

**Level 5, What kind of thing? (school, batch `word-glue 2`, 2026-11-22).** School plays levels 3, 5 and 6 in that order. Nine compounds carry the tag 5; no new art. A made thing sits above its two parts (`kindLayout`; the parts side by side in every view). Touch-down lifts a part and says its word; lifting the finger on it answers, sliding off is free, and tapping the made thing repeats the question. Rules are separate functions (`tap`, `checkTap`, `rightChoice`), not an overload of level 3's `check`/`hintFor`. Each wrong tap is a miss (two at most per ask); the second glows the right part and counts one hint; Show a hint glows it and repeats the question, once per ask; a wrong tap after two misses plays the right answer, uncounted. The three new lines (`wordglue.instruct.kind`, `wordglue.kind.right`, `wordglue.kind.wrong`) have slots but no clips yet, so they use device speech. The how-to card has a step about sliding off and tapping the thing; its note reads "this question works in English only". Check: `BROWSER_SUITE=wordglue WORDGLUE_ONLY=kind` and `FINGER_LEVELS=5`.


**Level 6, Which way round? (school, batch `word-glue 3`).** Four pairs contrast houseboat and boathouse, pancake and cake pan, racehorse and horse race, and sled dog and dog sled. Two asks choose each word order, and two correct pictures appear in each position. The pet speaks the whole word, names the other drawing after a wrong choice, and names both when the right one comes alive. Touch a picture and slide off to hear its name for free. The level shares level 5's two-miss and one-hint rules, and the ghost finger starts with a free slide-off. Both drawings go to the shelf after each answer. The 210-unit cards stack upright and sit side by side in landscape. The how-to card flags the US terms, and 32 generated clips cover the two words, prompts and feedback for all four pairs. [Definition](../definitions/word-glue-5-6.md#level-6-which-way-round)
