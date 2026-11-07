# Habitat Helpers

<!-- generated: from src/games/habitat-helpers; edit the text below the end mark (npm run game-docs) -->

**ID:** `habitat-helpers` · **Land:** Rainbow Meadow · **Ages:** preschool–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** habitats, living-things, prediction, systems-thinking

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–3 |
| pre-K | 2–5 |
| school | 4–9 |

| Level | Plays like |
| --- | --- |
| 1 | Place Bunny's food, water and shelter, then open the garden |
| 2 | Build an obvious three-piece habitat for Bunny, then Duck |
| 3 | Choose food, water and shelter from pieces for both visitors |
| 4 | Inspect a prepared habitat and predict which visitor will come |
| 5 | Use a multipurpose piece to fit each habitat into two spaces |
| 6 | Build one three-piece habitat that welcomes Bunny and Duck together |
| 7 | Something changed: name the need a working garden lost, then restore it |
| 8 | High rock or rock pool? Place shore friends so each has what it needs when the sea goes out |
| 9 | Who lives where? Three shore places, and the rock pool has room for one |

<!-- end generated -->

**Starts as:** place Bunny's food, water and shelter, then open the garden gate

**Grows into:** choose among distractors for Bunny and Duck, predict who a prepared garden invites, use multipurpose pieces in fewer spaces, then make one garden work for both, and at school notice which need a changed garden lost and repair it (level 7), then sort friends between a high rock, a rock pool and seaweed rocks on a rocky shore by what each needs (levels 8–9); tests and predictions are free experiments, a wrong need counts as a miss

## Design notes

*After nature gardens and simple habitat models.* Bunny and Duck visit a garden when it supplies food, water and shelter that work for them. The request sign always shows those three needs, and every garden feature has a fixed role in the game's deliberately small model. Levels: place Bunny's three obvious pieces; build obvious gardens for both visitors; choose the right three among distractors; inspect a prepared two-piece habitat (the sign shows a `?`, never the visitor; touching a piece says what it gives) and predict who will come; fit each visitor's needs into two spaces with a multipurpose berry hedge or pond with reeds; then make one three-piece garden that welcomes both. The last answer uses the hedge for Bunny's food and shelter, seed grass for Duck's food, and the pond with reeds for shared water and Duck's shelter.

The green gate tests a garden. An incomplete test and an unmatched prediction are observations, not mistakes; the pet names the first missing need, and after two incomplete tests the pieces from an arrangement that works glow and one hint is recorded (with only two spaces, that is the multipurpose piece rather than everything that meets some need). Each role has two pictured pieces, one chosen per round from the seed (Bunny food clover or dandelions, Bunny shelter brush pile or log burrow, Duck food seed grass or pond weed, Duck shelter tall reeds or reed island; water is always the shallow pool), so levels 1–3 do not look the same twice; level 3's two distractors are the other visitor's food and shelter, still five cards with exactly one working set. Level 4 draws its prepared gardens from a pool of four two-piece gardens (Bunny: berry hedge with shallow pool, or with pond with reeds; Duck: pond with reeds with seed grass, or with pond weed), the repeated visitor getting both of its gardens so none repeats in a play; a test enumerating every two-piece garden finds only these four welcome exactly one visitor. Every generated round has a rule-tested solution inside its capacity, prediction gardens welcome exactly the visitor they reveal, and the compact levels require their multipurpose pieces. A completed round files only the Bunny and Duck need observations it actually showed in the discovery journal. The how-to card's ghost finger (a mouse pointer on a desktop) places the fewest pieces that work, or picks the visitor the prepared garden welcomes, and then taps the gate; a test plays that rule against every generated round. The model says that real animals need food, drinking water and somewhere to shelter; it does not claim those are their only needs.

Level 7, *Something changed* (school only; school range 4–7): two rounds. The working garden welcomes its visitor, then one piece changes to a dry, flat or bare drawing (the pool dries, a storm flattens the reeds, the clover is finished for the year, the seed grass has no seeds in winter), the goal sign becomes a before card (the visitor and the old garden) and the visitor leaves. The first round is always the dried pool (Bunny); the second is drawn from the other three authored cases. She taps food, water or shelter for what is missing. A wrong need is a counted miss, the game's first (a boing, "Look at the before picture. What is different?", the before card pulses); two wrong needs glow the right need and count one hint. The right need opens a two-card repair tray, a fourth empty space and the gate: a repair test that does not restore the garden is free, two such tests glow the restoring card (one hint). A restored garden brings the visitor back and finishes the round. No new journal entry. Spoken lines are device speech (no clips yet). The ghost finger names the need, removes a non-restoring card, places the restoring one and opens the gate.

Levels 8–9, *The rocky shore* (school only; school range now 4–9, pre-K 2–5): a separate shore scene, a rocky shore with a tray of sea friends on the sand and the blue wave button. She taps a friend, then a place (or taps the sand to take a friend back); with no friend picked, tapping a place says what it gives. Level 8 *High rock or rock pool?* has two rounds with two places (high rock and rock pool, two friends each): an anemone and a barnacle, then an anemone and two barnacles. The blue wave button lets the sea go out, and that is the test. A failed test is free and never counted: an anemone left dry pulls in tight ("up here the rock dries out", or "these rocks dry out" on the seaweed rocks), and a crab on bare rock or in the pool scuttles behind a rock to wait (never caught); the sea then comes back in. Two failed tests glow one friend and a good place for it, or the sand when a blocker must go back (one hint). Level 9 *Who lives where?* has three places (rock pool with room 1, seaweed rocks with room 2, high rock with room 2): a barnacle, a crab and an anemone, then a second barnacle. The anemone needs the pool (wet), the crab needs the seaweed rocks (hiding), and a barnacle fits anywhere; the model is stated in the spoken lines and the how-to card (the high rock dries, the pool stays wet, seaweed hides a crab). A full place gives a boing and the "no more room" line, which is not a miss. Misses are always 0 on these levels; only hints count. The rules (`shore.ts` scene, `shoreTouch`/`shoreHint` bot built on the nearest accepted arrangement) are tested against hand-listed accepted sets, that the hint reaches an accepted shore from every reachable start, and that the bot finishes every seed. Spoken lines (`habitat.shore*`) are device speech (no clips yet). No journal entry for the shore friends.
