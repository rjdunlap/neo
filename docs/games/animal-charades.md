# Animal Charades

<!-- generated: from src/games/animal-charades; edit the text below the end mark (npm run game-docs) -->

**ID:** `animal-charades` · **Land:** Barnyard · **Ages:** preschool–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** animal words, movement words, watching

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1 |
| pre-K | 1 |

| Level | Plays like |
| --- | --- |
| 1 | Who is moving?: watch how it moves and name the animal. The pet or a friend acts; then, once, she acts for the pet |

<!-- end generated -->

**Starts as:** the pet (or a friend on the same device) acts out an animal with a plain shape that hops, waddles, swishes, flaps, slides or stomps; she watches and taps the animal she thinks it is. A wrong card is a soft boing and "A duck waddles. Watch again!"; after two misses the right card glows. The animal then slides forward and moves its own way. Once, she can act for the pet, which guesses with *Yes!* and *Not yet*.

**Grows into:** later levels are separate definitions: an animal with an action, a four-animal round and a grown-up family mode. Toddler and lap are not included until a phone has shown the guessing turn reads.

## Design notes

[Definition](../definitions/animal-charades.md). The pet's motion is a pure pose function in `motion.ts` (tested to be pairwise different), with a short pentatonic phrase per motion that never says a name. The two-person seat has a silent pictured Peek card with a closed-eye cue; nothing is spoken or played while it is open. A wrong card is a miss; the acting turn, Peek and the reveal never are. No camera, no microphone and no judging of anyone's acting. Whether a preschooler can tell hop from flap and swish from slide stays a phone playtest question.
