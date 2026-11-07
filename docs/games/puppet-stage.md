# Puppet Stage

<!-- generated: from src/games/puppet-stage; edit the text below the end mark (npm run game-docs) -->

**ID:** `puppet-stage` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** words · **Plays by:** touch · **Ghost finger:** yes

**Skills:** pretend-play, listening, character-voices, acting-a-story

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–5 |
| school | 4–6 |

| Level | Plays like |
| --- | --- |
| 1 | Pop up: touch the floor and a puppet rises there, says hello and follows her finger; nothing counted |
| 2 | Make Bunny talk: tap the puppet the pet names (preschool: then the one with the tiny or big voice) |
| 3 | Say it like: tap the sleepy, tiny or big bubble to make the puppet say its line that way |
| 4 | One scene: bring the puppet up, walk it to the place on the card and bob it |
| 5 | Two scenes: act two cards in order |
| 6 | The whole show: act three cards for three friends, who react only to what she showed |

<!-- end generated -->

**Starts as:** touch the stage floor and a stick puppet pops up there, says hello in its own voice and follows her finger; tap it and it talks or sings "la" (nothing counted; Bow after three pops or thirty seconds, and at lap the show bows by itself after six)

**Grows into:** levels 1–3: make the named puppet talk (Bunny, Bear, Duck or Cat; toddler by name, preschool two by name then two by voice, tiny or big), then say one line the sleepy, tiny or big way (a free try first, then four asks); levels 4–6 (pre-K 3–5, school 4–6): act a picture story card by bringing the right puppet up on the right mark and bobbing it (one scene, then two, then a three-card show for three friends who react only to what she showed, ending with The end). A tap on the other puppet or bubble is a miss, and the second miss on an ask glows the right one (one hint); the glow stays until the right tap, so every round reaches Bow and one sticker. Puppet voices are device-speech pitch and rate presets, never recorded; nothing is kept.

## Design notes

*lap–school (levels 1–6; lap plays 1, toddlers 1–2, preschool 2–3, pre-K 3–5, school 4–6) · after Puppet Pals and Peekaboo Barn's pop-up; [definition](../definitions/puppet-stage.md).* A little stage with a proscenium, side curtains, a floor and a front row of friends who clap. Four code-drawn stick puppets (Bunny, Bear, Duck, Cat) each have their own device-speech voice (pitch and rate presets through `ctx.sayIn`, never a rendered clip and never the pet's voice); the pet's instructions stay in the pet's voice. Music is silenced (`silenced(STYLES.hub)`).

Level 1, *Pop up* (lap and toddler): touch the floor and the nearest parked puppet rises there within a frame and says hello; while her finger stays down it follows, on release it bobs. Up to two stand at once (a third touch sends the longest-standing one down). Tapping a standing puppet bobs it and it talks again, then sings a pentatonic "la" on later taps. After three pops or thirty seconds Bow appears; at lap the show bows by itself after six pops. Nothing is counted at this level.

Level 2, *Make Bunny talk* (toddler and preschool): a seeded pair of puppets and four asks through the pet. Toddlers are asked by name; preschool gets two by name then two by voice ("Who has the tiny voice?"; voice pairs differ by at least 0.5 in base pitch, and each puppet says hello in turn first). A tap on the right puppet makes it talk and the front row claps.

Level 3, *Say it like* (preschool and pre-K): one puppet holds one of four authored lines and three bubbles (sleepy, tiny, big) say it three ways with a matching face and size. The first bubble tap is a free try; then four asks ("Say it the sleepy way"), each way at least once.

Misses and hints: at levels 2 and 3 a tap on the other puppet or bubble is a miss and the puppet says what was tapped ("I'm Bear!"); the second miss in a row on one ask glows the right one and counts one hint (at most one per ask). The glow stays until the right tap, so every round reaches Bow and one ordinary sticker, with help or without. Level 1 counts nothing. Nothing is kept.

Levels 4–6 (TP2, [definition](../definitions/puppet-stage-4-6.md); pre-K 3–5, school 4–6; skill `acting-a-story`): three authored picture story cards (a Knock knock, b The lost hat, c Surprise!), each with two places and two marks per place. Level 4, *One scene*: the pet reads one card; she brings the named puppet up on the right mark and bobs it, and it speaks its line while the front row claps. Level 5, *Two scenes*: two cards in order, a marquee card between. Level 6, *The whole show*: a live three-card premiere for three creature friends who react only to what she showed, ended by tapping The end (left of Bow, so both show after an early end; it stays until the cheer). Free bobs and early bobs speak the puppet's `ps.again.*` line. Misses: a wrong puppet, mark or order is a miss; the second miss on a scene glows the right one (one hint); The end tapped with scenes unticked counts a miss and the show goes on. Curtains close on The end only by setting state, so a tassel tap cannot leave them shut. The stand sits 80 from each curtain (the definition said 30, but a puppet on an outer mark was half hidden). Co-play: the how-to card's narrator-and-swap note; off-screen prek/school line. Browser suite `puppetstory`.
