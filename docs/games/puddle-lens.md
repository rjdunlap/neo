# Puddle Lens

<!-- generated: from src/games/puddle-lens; edit the text below the end mark (npm run game-docs) -->

**ID:** `puddle-lens` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** observation, magnification, scale, science

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–4 |
| school | 4–8 |

| Level | Plays like |
| --- | --- |
| 1 | Look closer: tap the lens and each thing looks bigger |
| 2 | Lens over: slide a hand lens over three things |
| 3 | Anyone there? Turn the dial to find swimmers in a drop |
| 4 | Just enough: set the dial to just the view asked for |
| 5 | Alive or can't tell yet: look closer, then say if the ringed speck is alive |
| 6 | One cell or many: look closer, then sort each slide into one cell, many cells or not cells |
| 7 | Wall clue: look closer, then say plant cells, animal cells or can't tell yet; the wall is the clue, not the colour |
| 8 | Why green? Look closer, then say if the green is tiny living things, all through the water, or can't tell yet |

<!-- end generated -->

**Starts as:** tap the big lens and a leaf, a drop and a pinch of sand each swell into view; slide a hand lens over three things beside a same-size paw; turn a four-stop dial on a drop until swimmers appear; then set the dial to just the view a question needs

**Grows into:** level 1 three swells; level 2 three things, 0.6 s within 50 units each; level 3 three drops (No swimmers is free before stop 3, a miss only on a populated drop at stops 3–4); level 4 three questions on one sample, Show judged too small or too close, accepted stops glow after two misses; one hint per question; level 5 three drops with one speck asked each, answered alive, not alive or can't tell yet (free below the deciding stop, a miss only at or above it, with an evidence line); level 6 four slides sorted into one cell, many cells or not cells trays (free below the deciding stop); level 7 onion skin, leaf and cheek cells (prepared slide): plant cells, animal cells or can't tell yet, decided by wall or soft edge, never colour; level 8 green threads, green balls or green-coloured water: tiny green living things, green all through the water or can't tell yet (free below the deciding stop; threads and balls drift slowly with the water); two misses glow the answer, one hint per speck, slide or drop; in Bubble Beach

## Design notes

*After hand lenses, pond dips and science-centre microscopes; [definition](../definitions/puddle-lens.md).* A big round hand lens hangs over a slide on a little puddle-side table. Level 1: tap the lens and each of a leaf, a drop and a pinch of sand swells to the lens view with a chime, holds two seconds and shrinks. Level 2: drag the lens over three things; the glass shows the table twice as big through a circular mask, held 0.6 s within 50 units of each, while the pet's paw beside them stays its size ("Same paw!" once). Level 3: four stop buttons without numbers on three drops; a drop looks empty until the third stop, and swimmers appear there. Level 4: the pet asks three questions of one sample and she sets the dial and presses Show. Level 5: three drops, one of each reviewed pair (a swimmer with a mud speck, a swimmer with a bubble, a green ball with silt) in a shuffled order, with at least one alive and one not-alive ring; the pet's dashed ring wraps the asked speck (hidden at stop 1) and she answers with three picture buttons, alive (a seed), not alive (a pebble) or can't tell yet (a lens with a curl), each speaking its name on touch-down. Level 6: four slides (every class, always the green ball, no repeats) and three picture trays, one cell, many cells and not cells, that show the slides sorted into them. Level 7 *Wall clue*: an onion skin, a leaf and cheek cells (a prepared slide) one at a time, the dial starting at stop 2; she answers plant cells, animal cells or can't tell yet, and the evidence is a `wall` (firm straight edge) or a `soft-edge`, never the colour. Level 8 *Why green?*: green threads (decided at stop 3), green balls (stop 4) and green-coloured water (stop 4, colour all through, no edges); she answers tiny green living things, green all through the water or can't tell yet. Threads and balls drift with the water (at most 30 screen units a second, still while a finger is down). Three samples a round in seeded order, authored first rounds. No cup is drawn beside the green water, since a cup beside only that drop would give the answer away at stop 1.

**Levels.** Level 1 *Tap the lens* (lap, toddler). Level 2 *Slide the lens* (toddler, preschool). Level 3 *Find the swimmers* (preschool, pre-K). Level 4 *Just enough view* (pre-K, school). Level 5 *Alive or can't tell yet*, level 6 *One cell or many*, level 7 *Wall clue* and level 8 *Why green?* (school). Bands: lap 1, toddler 1–2, preschool 2–3, pre-K 3–4, school 4–8.

**Misses and help.** Levels 1–2 count no misses. At level 3 "No swimmers" before stop 3 is free; a miss is a tap on a populated drop at stop 3 or 4 that does not fit, and the stop 3 button glows after two misses. At level 4 Show judged too small or too close is a miss, and accepted stops glow after two misses; Show a hint gives one counted hint per question. At level 5 every answer is free below the speck's deciding stop (alive and not alive share one line); at or above it, can't tell yet or the false verdict is one miss with a spoken evidence line. At level 6 a wrong tray is free below the slide's deciding stop and a miss at or above it, with a see.* line. At level 7 an answer below the deciding stop is free (the same line for true and false); at or above it a wrong kind or can't tell yet is a miss with a spoken `lens.wall.*` evidence line. Level 8 works the same way with `lens.green.*` lines, and the green water is judged at stop 4 even though its colour is plain at stop 1. At all of these, two misses glow the right answer (the deciding stop glows below it), there is one hint per speck, slide or drop (Show a hint turns the dial to the deciding stop and speaks the evidence line), and the ghost finger follows the hint then taps the right choice. Start again keeps misses and hints. Code-drawn art; the title has a Kokoro clip, other lines use device speech. Not built: the level-5 co-play pointing ("Slide and lens") and its off-screen tip, since a game has one co-play and one off-screen string for every level; a visitor critter, and a separate dial knob (the dial is the brass ring with a pointer and stop marks).
