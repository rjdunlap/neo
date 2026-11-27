# Dream Cards

<!-- generated: from src/games/dream-cards; edit the text below the end mark (npm run game-docs) -->

**ID:** `dream-cards` · **Land:** Story Grove · **Ages:** school · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** perspective, vocabulary, listening

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Dream clues: give one clue and read another’s |
| 2 | Two clues: say more, then look again |

<!-- end generated -->

**Starts as:** the pet (or a second person on the same device) gives one pictured clue (*quiet*, *high up*, *cozy*, *floating*, *glowing* or *tiny*) about one of three dream pictures, hidden under a cloud. She points to the picture the clue makes her think of, the chosen picture turns over, and they look at both picks together. Swap lets her give a clue and the pet or friend point. The purpose is that one clue can mean different things to different people and a clue is a way of sharing what you see; nothing is wrong, nothing is scored.

**Grows into:** levels 1 and 2, school band. Level 2 ([definition](../definitions/dream-cards-two-clues.md)) adds a second clue for the same picture and a second look where she keeps her point or moves it. Level 3, *Make your own dream picture* ([definition](../definitions/dream-cards-own-picture.md)), has her build a stamp from three parts and give its clue. A couch mode is another later level in the [level 1 definition](../definitions/dream-cards.md#the-level). Pre-K waits for a phone to show the cloud and clues read for a younger child.

## Design notes

- Rules in `logic.ts`: six original pictures, six clues, a fit table (every picture fits three clues, every clue three pictures), 28 valid deals of 400. The fit table only guides the pet and the Help glow; it is never a scoring key. `revealKind` only chooses what is said (`same`, `both-fit`, `new-view`).
- Privacy: the giver's pick lives in state and the scene only; no card draw reads it until the reveal (`visible()`), and the pet's pick is never drawn.
- No misses: `ctx.finish({ misses: 0, hints })`. Help glows a fitting picture (listener, never the hidden one) or a fitting clue (giver) and counts one hint. *Show me* reveals without pointing.
- Every voice line carries a slot, so all stay on device speech. The reveal has pet, she-gave and two-person wordings.
- Seat chooser: *Me and the pet* or *Two of us*; a second person gets no credit or seat record.
- Not built: levels 2 and 3, pre-K, a couch mode, the unit test that runs `autotouch()` over 50 seeds (the filtered browser play and `fingerdemo` cover it once).
