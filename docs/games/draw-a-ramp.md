# Draw a Ramp

<!-- generated: from src/games/draw-a-ramp; edit the text below the end mark (npm run game-docs) -->

**ID:** `draw-a-ramp` · **Land:** Tinker Lab · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** cause-and-effect, prediction, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–3 |
| school | 2–3 |

| Level | Plays like |
| --- | --- |
| 1 | Bridge the gap: draw one sloped ramp that rolls the marble to the star balloon |
| 2 | Over the block: draw one or two ramps that carry the marble over a wooden block to the balloon |
| 3 | Turn it around: send the marble past a shelf, then bank it back under the shelf to the balloon |

<!-- end generated -->

**Starts as:** draw a rainbow ramp with a finger, tap Go, and a marble rolls down it to pop a star balloon

**Grows into:** levels 1–3: one ramp across a gap, one or two ramps over a wooden block, then a ramp past a shelf and a second ramp that banks the marble back underneath it

## Design notes

*After Physics Playground, Crayon Physics and Line Rider; Tinker Lab; levels 1–3 built ([definition](../definitions/draw-a-ramp.md)).* A marble waits above a shelf, a star balloon floats across a meadow board, and she drags a line on the board to draw a ramp, then taps Go. A missed run is a free experiment: it leaves a faint dotted trail, the marble hops back to the chute, and the guide says where it went wrong. After two missed runs, or on Hint, a pulsing dashed ramp shows one that works (counted as one hint per puzzle). Nothing is a miss and one sticker follows both puzzles.

The rules are in `logic.ts`: a handwritten fixed-step (1/240 s) circle-against-capsule solver, with no physics library, serves both her ramps and the fixed wooden pieces. A round is the authored puzzle and its mirror image, in an order the seed picks. Reference ramps were found by a grid search and are tested to still pop the balloon when either end moves 15 units; strokes are thinned to one point every 20 units and clipped around the chute and balloon so she cannot wall either in. Undo and Clear cancel a roll without penalty; at level 1 a new stroke replaces the old one (Undo brings it back) so there is never a silent stroke limit.

The board is a fixed 720 × 540 box that is never scaled, so it lays out the same sideways and upright (`rampLayout`); the Go, Undo, Clear and Hint buttons are 100+ units. The ghost finger draws the next reference ramp, then presses Go.
