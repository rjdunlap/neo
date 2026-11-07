# Sink or Float

<!-- generated: from src/games/sink-float; edit the text below the end mark (npm run game-docs) -->

**ID:** `sink-float` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, prediction, sorting

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 2–4 |
| preschool | 3–5 |
| pre-K | 4, 5, 9, 6 |
| school | 5, 6, 9, 7, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Tap things to drop them in the water and watch |
| 2 | Drop things in and hear whether they float or sink |
| 3 | Guess float or sink, then test it (guesses are never wrong answers) |
| 4 | Sort familiar things into float and sink baskets |
| 5 | Sort things including surprises, like a floating apple |
| 6 | Guess and test surprising things |
| 7 | Make the clay float: change its shape and test it |
| 9 | Big and small: watch the big one, guess the small one of the same stuff, then test it |
| 10 | Salty or fresh: compare two tanks, then test to find the salty one |

<!-- end generated -->

**Starts as:** drop things in the water and watch

**Grows into:** guess and test, sort into baskets, fourteen things (a feather, a marble, a log, an ice cube, a paper clip among them) with surprises like a floating apple, (pre-K and school, level 9) guessing the small one after watching the big one, (school, level 7) squashing clay into a boat that floats, and (school, level 10) telling a salty tank from a fresh one by how high a duck and an egg sit

## Design notes

Things arc into a water tank; floaters bob and sinkers drift down trailing bubbles. Lap drops things in; then the voice names the result; then the child guesses before each test, and guesses never count as misses; then sorting into float and sink baskets, first with familiar things and then with surprises such as a floating apple and a sinking coin. A wrong sort is tested in the water before the thing goes to its basket. Each thing that actually goes into the water files a discovery-journal entry (a thing only sorted correctly was never tested, so it is not found).

**Things (fresh, 2026-11-03).** Fourteen: obvious floaters duck, boat, ball, feather; obvious sinkers rock, key, marble; surprises that float leaf, apple, log, ice cube; surprises that sink coin, spoon, paper clip. Levels 1–4 draw five of the seven obvious things (both kinds present, so rounds vary), levels 5–6 draw six of all fourteen; couch level 6 inherits the pool. The voice says "ice cube" and "paper clip" through the guess slot, and each thing has its own code-drawn art and journal line.

**Level 7, Make it float** (school): a lump of clay sinks, then three shape tiles appear in a seeded order (flat, boat, leaky boat). Tapping one squashes the clay into that shape and drops it in: flat sinks, leaky floats then fills through its hole and sinks, boat floats, each with its spoken explanation; a sunk shape returns to the shelf as the ball. A floating boat shows a two-pan scale ("Same clay, same weight"). Two experiments in two clay colors; the round finishes after two floating boats. Sinking trials are never misses (misses are always 0). After two sinks in one experiment the boat tile glows with "Try a hollow shape that keeps the water out" and counts one hint (at most one per experiment); the pause sheet's Show a hint does the same without double counting. No journal discoveries. Touch only on the island: the ring branch in `control()` is not reached by island keys (see the [definition](../definitions/make-it-float.md)).

**Level 9, Big and small** (pre-K and school; pre-K plays 4, 5, 9, 6 and school 5, 6, 9, 7 through `order`; level ID 8 stays reserved for Garden Raft, and `SINK_PLANS` is a table keyed by level ID). Three pairs of one stuff at two sizes in seeded order: a log and a twig (wood floats), a rock and a pebble (stone sinks), a big and a little ball (a ball full of air floats). The pair sits on the right shelf, big above small. The big one goes in alone ("Watch the big log!"), then she taps float or sink for the small one; it is tested, then "You guessed it" or "Surprise", then always the material line ("Big or small, wood floats"). Only the pair under test is in the tank; the last pair fades out. Guesses are never misses, so misses and hints are always 0, and nothing is filed in the journal. The twig and pebble have their own art (`smallArt`); the little ball is the ball at a smaller scale (sizes 1.3/0.75, ball 1.4/0.6, at least 1.6 times apart). Couch control and the bot work through the guess buttons.

**Level 10, Salty or fresh** (school only; order 5, 6, 9, 7, 10; code in `salt.ts`, model in `logic.ts`: `SALT_DEPTHS`, `floatsIn`, `saltRoundFor`). Two tanks, one with a salt shaker beside it that she shakes in. Part 1 is unscored: the same duck goes in both and sits higher in the salty one (its dashed plain-water mark rides above the surface there), then an egg sinks in the plain tank and floats in the salty one. Part 2 asks four scored questions, "which tank has the salt?", with the egg and the duck; a wrong tank plays its evidence line ("Salt water holds things up higher"), counts one miss per look (further wrong taps while the line plays count nothing), and two misses glow the right tank for a hint if the same question is still open. Taps before the eggs settle are ignored; a light water wash tints what sits under the surface. Touch and `control()` (two-tank ring). The how-to note carries the model; the off-screen raw-egg safety sentence was left out (the card is at its 840-character limit) and waits on the dive's band-keyed `offScreenFor` work. Fifteen `sink.salt-*` voice lines.
