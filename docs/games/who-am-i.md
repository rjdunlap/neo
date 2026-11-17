# Who Am I?

<!-- generated: from src/games/who-am-i; edit the text below the end mark (npm run game-docs) -->

**ID:** `who-am-i` · **Land:** Barnyard · **Ages:** pre-K–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** animals, attributes, classification, logic

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 2–5 |

| Level | Plays like |
| --- | --- |
| 1 | One clue: tap the friend it fits, 3 friends |
| 2 | Turn them over: 2 clues, 4 friends |
| 3 | Groups by features: 3 clues, 6 friends |
| 4 | Surprises: the penguin and the bat, 3 clues, 6 friends |
| 5 | Which group? The clue is a bird or a mammal, 6 friends |

<!-- end generated -->

**Starts as:** a clue in words and a picture sign ("I have feathers"); level 1 taps the friend it fits, later levels turn over every friend the clue rules out until one jumps out

**Grows into:** three friends and one clue, then four friends and two clues, then six friends from at least four groups and three clues (covering, babies, breathing), then level 4's surprises: the penguin and the bat in every gallery, where flying or feathers stop meaning "bird", then level 5 (school): the first clue is the answer's group ("I'm a bird!" or "I'm a mammal!") and the penguin can be the answer

## Design notes

*Slices Z3 and Z4 of the [zoo-animals study](../deep-dives/subjects/zoo-animals.md), [definition](../definitions/who-am-i.md).* Friends stand on the barn's stage; the pet gives a clue, spoken and shown as a picture sign ("I have feathers"). Level 1 (pre-K 1, school 2): three friends, one clue, and she taps the friend the clue fits. Level 2 (pre-K 2): four friends and two clues; she turns over every friend a clue rules out (it half-lifts and ducks behind its card) and the last one jumps out. Level 3 (school 3): six friends from at least four groups and three clues, at least two of them from covering, babies and breathing. The cast is the six mammal critters, duck, owl, penguin, frog, turtle and fish. Misses: at level 1 a friend the clue does not fit; at levels 2–3 a face-up friend the clue keeps (its card half-turns back and the reason is spoken). After two misses (per round at level 1, per clue at levels 2–3) the answer glows or the ruled-out friends shimmer, one hint; the pause sheet's "Show a hint" does the same and counts once. Tapping the sign or a clue thumbnail, and peeking at a face-down card, are free. Taps are held while a clue changes. Ghost finger at every level; no journal entry. With the allowed features the level 2 answer is always a mammal, frog or turtle (a bird or the fish is picked out by its first clue) and the level 3 answer is always the frog or the turtle; a rule test brute-forces this. Level 4 (school 4, Z4 "Surprises"): six friends that always include the penguin and the bat, three clues from the level 3 set plus `fly`, at least 3 groups in the gallery, at least one clue that defines a group and at least one surprise step (`fly` while the penguin stands; `feathers` or `eggs` while the bat stands; `milk` while the bat and a bird stand). After a surprise step's flips the pet explains it once per round ("Penguin has feathers, so Penguin is a bird. Penguin just can't fly!" or "Bat can fly, but Bat feeds its babies milk, so Bat is a mammal."); the explanation counts no miss or hint. The bat is a mammal with `fur`, `wings`, `two-legs`, `milk` and `fly`, drawn by `batArt()` in `src/art/animals.ts` (a `Critter` with pointy ears and the new `wings: 'membrane'` option in `src/art/critter.ts`); its wing sign is the shared yellow `wings` sign. The level 4 answer can only be the duck, the owl, the frog, the turtle or the bat (a four-legged mammal has at most two useful clues because fur and milk rule out the same friends, and the penguin and the fish are picked out too fast; a rule test proves it), even though the penguin is in every gallery. Levels 1–3 still draw from the twelve earlier friends and the sticker still picks among those twelve, so seeded rounds and saved stickers did not change.

Level 5 (school 5, Z10 "Which group?"): the first clue is the answer's group, spoken "I'm a bird!" or "I'm a mammal!" on a rosette sign with the group's word under it; the gallery of six always has the penguin and the bat and at least three groups. She turns over everyone not in the group with the level 2–4 action; if more than one friend still stands, one feature clue follows. The kind of answer is drawn first with equal chances (flying bird, penguin, bat, four-legged mammal); the frog, turtle and fish are never the answer. A tap on a kept friend at the group clue is a miss with the reason ("Penguin has feathers, so Penguin is a bird. Penguin stays!"). The hint (two misses on the group clue, or the pause sheet) shows what the group means with feature signs beside the rosette and counts one hint; the clue is then judged and explained as its feature clue (feathers or milk), and two more misses shimmer the ruled-out friends with no further count. The surprises are explained once each, free. Levels 1–4 are unchanged.

*Levels 6–7 are defined, not built* (slice Z9; builds Z11–Z12): you ask (a tray of yes/no questions) and make a riddle (true clue cards). See the [definition](../definitions/who-am-i.md#levels-57-z9-defined-2026-11-17).
