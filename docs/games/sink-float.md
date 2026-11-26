# Sink or Float

<!-- generated: from src/games/sink-float; edit the text below the end mark (npm run game-docs) -->

**ID:** `sink-float` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, prediction, sorting

| Band | Levels, easiest first |
| --- | --- |
| lap | 12, 1, 2 |
| toddler | 2–4 |
| preschool | 3–5 |
| pre-K | 4, 5, 9, 6 |
| school | 5, 6, 9, 7, 8, 11, 10 |

| Level | Plays like |
| --- | --- |
| 1 | Tap things to drop them in the water and watch |
| 2 | Drop things in and hear whether they float or sink |
| 3 | Guess float or sink, then test it (guesses are never wrong answers) |
| 4 | Sort familiar things into float and sink baskets |
| 5 | Sort things including surprises, like a floating apple |
| 6 | Guess and test surprising things |
| 7 | Make the clay float: change its shape and test it |
| 8 | Garden Raft: put floats under the pots so the raft crosses the pond |
| 9 | Big and small: watch the big one, guess the small one of the same stuff, then test it |
| 10 | Salty or fresh: compare two tanks, then test to find the salty one |
| 11 | How much can it carry? Load the boats and pick one for the pile |
| 12 | One big thing over the water: touch anywhere to drop it in |

<!-- end generated -->

**Starts as:** (lap, level 12) one big thing over the water that a touch anywhere drops in, then drop things in the water and watch

**Grows into:** guess and test, sort into baskets, fourteen things (a feather, a marble, a log, an ice cube, a paper clip among them) with surprises like a floating apple, (pre-K and school, level 9) guessing the small one after watching the big one, (school, level 7) squashing clay into a boat that floats, and (school, level 10) telling a salty tank from a fresh one by how high a duck and an egg sit

## Design notes

Things arc into a water tank; floaters bob and sinkers drift down trailing bubbles. Lap drops things in; then the voice names the result; then the child guesses before each test, and guesses never count as misses; then sorting into float and sink baskets, first with familiar things and then with surprises such as a floating apple and a sinking coin. A wrong sort is tested in the water before the thing goes to its basket. Each thing that actually goes into the water files a discovery-journal entry (a thing only sorted correctly was never tested, so it is not found).

**Things (fresh, 2026-11-03).** Fourteen: obvious floaters duck, boat, ball, feather; obvious sinkers rock, key, marble; surprises that float leaf, apple, log, ice cube; surprises that sink coin, spoon, paper clip. Levels 1–4 draw five of the seven obvious things (both kinds present, so rounds vary), levels 5–6 draw six of all fourteen; couch level 6 inherits the pool. The voice says "ice cube" and "paper clip" through the guess slot, and each thing has its own code-drawn art and journal line.

**Level 7, Make it float** (school): a lump of clay sinks, then three shape tiles appear in a seeded order (flat, boat, leaky boat). Tapping one squashes the clay into that shape and drops it in: flat sinks, leaky floats then fills through its hole and sinks, boat floats, each with its spoken explanation; a sunk shape returns to the shelf as the ball. A floating boat shows a two-pan scale ("Same clay, same weight"). Two experiments in two clay colors; the round finishes after two floating boats. Sinking trials are never misses (misses are always 0). After two sinks in one experiment the boat tile glows with "Try a hollow shape that keeps the water out" and counts one hint (at most one per experiment); the pause sheet's Show a hint does the same without double counting. No journal discoveries. Touch only on the island: the ring branch in `control()` is not reached by island keys (see the [definition](../definitions/make-it-float.md)).

**Level 8, Garden Raft** (school only; order 5, 6, 9, 7, 8, 10; code in `raft.ts`, model in `logic.ts`: `raftVerdict`, `RAFT_ROUNDS`, `raftRoundFor`, `raftFix`; [definition](../definitions/garden-raft.md), built 2026-11-25). Three pallets of garden pots cross the pond. She taps a slot under the pallet to put a float in (tap it again to lift it out, or tap the tray for the next free slot), then taps Launch. Each float holds up two stones (the pots show their weight as stones in a basket) and the raft tips toward the side that has too much weight; the balance point must sit strictly between the outermost floats. A launch crosses (the raft glides off to the garden, a plumb bob showed the balance point), sits too low (water washes over, a spoken reason) or tips (the pots slide off and hop back, with the side named); sitting low is checked first so each launch explains one thing. A failed launch is a test, never a miss (misses are always 0); after two failed launches in a row for the same reason the slot where one change would help glows with "Try a float here" and counts one hint (at most one per pallet; the pause sheet's Show a hint does the same without double counting). Round 3 starts with a raft already in the water (floats at two slots, level for the herbs) that glides across by itself, then a heavy pumpkin arrives and she revises. Rounds are mirrored by the seed. Pots, floats and the plumb bob are not `THINGS`, so the pools of levels 1 to 6 and the journal are unchanged; no discoveries are filed. Touch and `control()` (a ring over the six slots and Launch); the island-key path is not reached by island keys at this level (the ring was verified by direct `control()` calls).

**Level 9, Big and small** (pre-K and school; pre-K plays 4, 5, 9, 6 and school 5, 6, 9, 7 through `order`; level 8, Garden Raft, sits between 7 and 10 through `order` too, and `SINK_PLANS` is a table keyed by level ID). Three pairs of one stuff at two sizes in seeded order: a log and a twig (wood floats), a rock and a pebble (stone sinks), a big and a little ball (a ball full of air floats). The pair sits on the right shelf, big above small. The big one goes in alone ("Watch the big log!"), then she taps float or sink for the small one; it is tested, then "You guessed it" or "Surprise", then always the material line ("Big or small, wood floats"). Only the pair under test is in the tank; the last pair fades out. Guesses are never misses, so misses and hints are always 0, and nothing is filed in the journal. The twig and pebble have their own art (`smallArt`); the little ball is the ball at a smaller scale (sizes 1.3/0.75, ball 1.4/0.6, at least 1.6 times apart). Couch control and the bot work through the guess buttons.

**Level 10, Salty or fresh** (school only; order 5, 6, 9, 7, 10; code in `salt.ts`, model in `logic.ts`: `SALT_DEPTHS`, `floatsIn`, `saltRoundFor`). Two tanks, one with a salt shaker beside it that she shakes in. Part 1 is unscored: the same duck goes in both and sits higher in the salty one (its dashed plain-water mark rides above the surface there), then an egg sinks in the plain tank and floats in the salty one. Part 2 asks four scored questions, "which tank has the salt?", with the egg and the duck; a wrong tank plays its evidence line ("Salt water holds things up higher"), counts one miss per look (further wrong taps while the line plays count nothing), and two misses glow the right tank for a hint if the same question is still open. Taps before the eggs settle are ignored; a light water wash tints what sits under the surface. Touch and `control()` (two-tank ring). The how-to note carries the model; the off-screen raw-egg safety sentence was left out (the card is at its 840-character limit) and waits on the dive's band-keyed `offScreenFor` work. Fifteen `sink.salt-*` voice lines.

**Level 11, How much can it carry?** (school only; order 5, 6, 9, 7, 8, 11, 10; code in `boat.ts`, model in `logic.ts`: `holdsLoad` (shared with the raft), `hullVerdict`, `BOAT_ROUNDS`, `boatRoundFor`, `boatAccepted`; [definition](../definitions/build-a-boat.md), built 2026-11-26). Foil boats of different widths sit in the tank, each cell holding up two marbles. Round 1 (wide and narrow) asks which carries more (an unscored guess), then she taps the bowl to drop marbles one at a time into each boat in turn: it sits one step lower per marble until the marble after the last seat sends water over the rim, the marbles hop back, and the count shows as dots. Rounds 2 and 3 give a pile of four and of seven: she picks one of three boats, then loads it; a boat that cannot carry it spills with the explaining line and she picks again, with no limit. A spill is never a miss (misses stay 0); two spills in a round glow the narrowest boat that carries the pile (one hint, at most one per round). Three piles carried finish the level. A boat's tap target is as wide as its cells (up to 96 units a cell), never under 200 wide, and the cell width shrinks only as far as needed to fit the three-boat row beside the pet. Controller ring over the boats and the bowl by `control()`; boats are kept out of `THINGS`. Nothing goes in the journal.

**Level 12, One big thing** (lap entry level; lap plays 12, 1, 2 through `order` and `entryLevels: [12]`; ID 11 stays reserved; mode `hold`, `HOLD_LEVEL`). One big thing (scale 2.6) waits over a lowered tank, swaying, and never drops by itself. A full-screen catcher (`onTap`, touch-down) drops it at once with a whoosh wherever she touches; it falls straight in and shrinks. The next of five familiar things (always some floaters and some sinkers) grows in only when the dropped one meets the water, so nothing waits on her. A touch on the water splashes under the finger; a touch off the water while nothing is held, or after the round, gets a pop and bubbles. Nothing is counted (misses and hints 0); discoveries are filed as in levels 1–2. Voice line `sink.hold`; the how-to card has lines from level 12.

**A guess never holds the next thing (U7 fix batch 3, 2026-11-11).** `sink.right` or `sink.surprise` starts and, after a 0.4 s beat, the next thing appears and its ask cuts the reaction. The water's own line (`sink.floats`, `sink.sinks`) and the pair's rule stay held, and the reaction is still heard out for a big-and-small pair's item (the held rule line follows it and would cut it) and on the last thing. At level 9 `sink.salt-right` plays over the lift-out and the shaker's exit, and is heard out after the last question.
