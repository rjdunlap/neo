# Word Glue

<!-- generated: from src/games/word-glue; edit the text below the end mark (npm run game-docs) -->

**ID:** `word-glue` · **Land:** Story Grove · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** compound-words, vocabulary, word-meaning

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3 |
| school | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Stick them: join the only pair to make a new thing |
| 2 | What do they make? Find the two pictures that make the asked word |
| 3 | Who is it for? Join the friend who needs the thing in the middle |

<!-- end generated -->

**Starts as:** tap or drag one picture onto another and they join into a third thing that comes alive (sun and flower, dog and house), the pet saying "sun… flower… sunflower!"

**Grows into:** level 1 joins any pair of five (counts nothing); level 2 asks for a word and gives three pictures, the two parts and one that makes no word with either (a wrong pair wobbles and the pet says its word); level 3 keeps a shared head (house, box, brush) and a friend asks for it, a wrong friend briefly gets the wrong thing; two misses or Show a hint glow the right pair or friend, one hint per ask; levels 4–5 (what kind of thing, which way round) are not built

## Design notes

*Slice VW1 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md), [definition](../definitions/word-glue.md).* Pictures sit on a soft table; she drags one onto another (at the lap band a tap is enough) and they hop together into a third thing that comes alive, while the pet says "first… second… word!" Bands: lap 1, toddler 1–2, preschool 2–3, pre-K 3, school 3. Level 1, *Stick them*: five pairs, any tap or drop joins, nothing is counted. Level 2, *What do they make?*: five asked words, three pictures (the two parts and a seeded distractor that forms no listed or denied word with either part, in either order); a wrong pair wobbles with a boing and the pet says its word and parts; one miss per distinct wrong pair per ask. Level 3, *Who is it for?*: two of three heads (house, box, brush), two asks each; a friend says "I need a house!" and she drags the head onto the asking friend; a wrong friend briefly gets its real thing and the pet says what it is and who it is for (one miss). After two misses on an ask the right pair (level 2) or the asking friend (level 3) glows and counts one hint, at most once per ask; Show a hint does the same. A wrong drop after the glow and two earlier wrong drops joins the right pair with no further count. Made things go to a decorative shelf and all play their animations at the end; nothing is kept or filed. Each level's first round of a session (and the demo) is the definition's authored round. Ghost finger drags the hint pair (taps at lap level 1; touches the level 2 distractor once first). Levels 4–5 (what kind of thing, which way round) are not built.

**A join never holds the next ask (U7 fix batch 21, 2026-11-12).** The joined word (`wordglue.join`) starts and the shelf flight and the next ask follow at once; at levels 2–3 the ask waits for the join, is said by the guide, or is said at her first touch instead of the picture's word. The last ask's join is heard out.
