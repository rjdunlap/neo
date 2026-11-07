# Look It Up

<!-- generated: from src/games/look-it-up; edit the text below the end mark (npm run game-docs) -->

**ID:** `look-it-up` · **Land:** Barnyard · **Ages:** toddler–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** text-features, informational-reading, animal-facts

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–3 |
| school | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Talking labels: touch a word on the page to hear it |
| 2 | Find the page: tap the visitor's tab, then give it the food |
| 3 | The fact box: find the page and the row, then help |

<!-- end generated -->

**Starts as:** touch a picture label to hear it, or tap an animal's face on the guide's tabs and give it the food its page shows

**Grows into:** seven real animals (cow, pig, duck, rabbit, brown bear, frog, African penguin) with an *Eats*, *Where* and *Baby* row each from opened zoo and wildlife sources; level 1 touches talking labels (nothing to get wrong), level 2 finds a hungry visitor's page and feeds it, level 3 finds the *Eats* or *Where* row and leads the animal to its food or place; turning pages is free and only a wrong food or place is a miss

## Design notes

*After picture-guide and first-non-fiction books; [definition](../definitions/look-it-up.md).* A picture guide of seven real animals (cow, pig, duck, rabbit, brown bear, frog and African penguin) stands open on a book stand with a picture tab for each visitor; every page has a fact box with *Eats*, *Where* and *Baby* rows. The pet reads each sentence aloud, and every fact in `src/games/look-it-up/logic.ts` carries two opened zoo or wildlife sources (the pig's line leaves out corn; the rabbit's baby is "a kitten, or kit"; narrow facts name their kind, such as brown bear and African penguin). Level 1, **Talking labels**: touch a label tag (name, food, baby) or its picture and it lights and speaks; when all three have spoken the pet reads the page and the next animal's page turns in. Nothing can go wrong. Level 2, **Find the page**: "Cow is hungry. What does a cow eat? Let's look it up!" She taps the animal's face on a tab, the page turns and reads, and she gives the visitor the food its page shows from a basket of the three tab animals' foods (drag or tap). Level 3, **The fact box**: each visitor asks for its *Eats* or *Where* row; she finds the page, touches the row, then drags or taps the right food or place in the scene. Tabs never repeat a picture the round could confuse (cow and rabbit share grass, duck and frog share a pond, so they are never tabs together at the levels that need it).

Misses and hints: turning to any page, re-reading a row or label, tapping the visitor and a drop on empty ground are free. A wrong food or place given to the visitor is one miss per distinct wrong choice, with a kind "Those are seeds. Ducks eat seeds. Let's look in the guide for the cow." and a walk there and back for a wrong place. After two misses on one visitor the right tab, then the right row, then the right picture glows (one hint at most per visitor); a further wrong try lets the pet give the answer so the round finishes. One sticker per round, with or without help.

Bands: toddler 1, preschool 1–2, pre-K 2–3, school 3. Home land Barnyard; subject Story Grove. Known gaps (2026-10-22): the first round of each level is seeded-random, not the authored cow/duck/bear round; baby pictures are the parent critter scaled small rather than distinct baby art, and the duck and rabbit are not tinted mallard or brown; choices are drag-or-tap (a drop that barely moves counts as a tap), so level 3 foods move like places; the level 2 demonstration does not first tap another tab; the supported finish fires after four wrong tries, not three; there is no Start again pause action.
