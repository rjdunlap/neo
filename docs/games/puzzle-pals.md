# Puzzle Pals

<!-- generated: from src/games/puzzle-pals; edit the text below the end mark (npm run game-docs) -->

**ID:** `puzzle-pals` · **Land:** Puzzle Peaks · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-reasoning, part-whole, fine-motor

| Band | Levels, easiest first |
| --- | --- |
| lap | 8, 1, 2 |
| toddler | 2–4 |
| preschool | 4–6 |
| pre-K | 5, 6, 7, 9, 10 |
| school | 6, 7, 9, 10, 11, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Finish a picture: one half is already in place |
| 2 | Put two halves together over a faint picture |
| 3 | Three strips over a faint picture |
| 4 | Four pieces over a faint picture |
| 5 | Six pieces: an empty frame and a small picture on the box lid |
| 6 | Nine pieces: an empty frame and a small picture on the box lid |
| 7 | Twelve pieces: an empty frame and a small picture on the box lid |
| 8 | One big piece at a time: a touch anywhere hops it into a two- or three-piece picture |
| 9 | Turn it round: tap an upside-down piece to turn it, then put six pieces together |
| 10 | Two pictures, one tray: sort eight pieces onto two faint pictures |
| 11 | Mend the picture: two pieces have swapped places, so tap one and then the other to swap them back |
| 12 | Quarter turns: twelve square pieces, five of them on their side or upside down, so tap to turn each the right way up |

<!-- end generated -->

**Starts as:** at lap, one big piece beside the frame that a touch anywhere hops into place, then the next piece of a two- or three-strip picture; at toddler, tap or carry a piece to finish a two-piece picture

**Grows into:** two pieces with nothing in place, then three to twelve pieces, first over a faint picture, then an empty frame with marked outer edges, a box lid and spoken spatial hints, half-turn upside-down pieces at level 9, quarter-turn pieces on a square-celled crop at level 12 (school); two faint pictures sorted from one mixed tray of eight pieces at level 10; visible landmarks in every piece built ([PR #292](https://github.com/rjdunlap/neo/pull/292))

## Design notes

**Quarter turns (level 12, built 2026-11-24, [PR #2155](https://github.com/rjdunlap/neo/pull/2155)).** `school` only (`6, 7, 9, 10, 11, 12` via `order`). A 4×3 puzzle of twelve 140-unit square cells cut from the middle 560×420 of the 600×420 picture (`plan.crop`, read through `pictureBox`; the frame, the lid, the pieces and the glow all use it, so the 20 units at each side of the picture are left out), with the box lid and outer rims. Five pieces arrive on their side or upside down (`Turn` is now 0–3 quarter turns clockwise, dealt by `dealTurns(..., quarter)`); a tap turns a piece a quarter turn (`quarterTurn`), free and never a miss, so one to three taps set it right (`tapsToUpright`). Dropping a turned piece in its own place hops it back with the level 9 words, "Turn it round!", and is not a miss; a wrong place is a miss, and two misses glow the piece and its place, the arrow pulsing if it still needs turning. Square cells mean a turned piece takes the same room in the tray (100 units sideways, more upright). When the round ends the live picture shows clipped to the crop. No new voice lines: it reuses `puzzle.turn` and `puzzle.turnItRound`, so no clips are needed. Rule tests: the crop is 140 square cells and keeps a readable, distinct feature in every cell in all twelve scenes over 25 seeds each; four taps restore a piece; the bot's taps equal the shortest way round; layouts at phone and iPad sizes.

**Mend the picture (level 11, built 2026-11-24, [PR #2153](https://github.com/rjdunlap/neo/pull/2153)).** A finished 3×3 picture sits in the frame with two pieces in each other's places, in `school` only (`6, 7, 9, 10, 11` via `order`). No lid, rims or tray: the pieces themselves are the clue. `dealMend` picks the two from pieces whose visible features differ (`cellFeatures`), so they can be found by looking. She taps one piece (a yellow ring shows it is picked; tapping it again puts it down, free) and then another. `judgeSwap` mends only when the two end up home; any other swap glides across and straight back with a boing, one miss ("Hmm, that piece goes somewhere else…"), and the second miss glows the two odd pieces ("Try the glowing spot!"). Pieces take taps only (`drag.enabled` is off), and a touch area is exactly the piece. `mendLayout` makes the frame as big as the view allows, sideways and upright. When the pair is home the picture comes alive as at every level. `autotouch()` taps the two odd pieces in turn. Not built: spoken words of its own ("Two pieces are mixed up! Tap one, then the other", and miss and hint lines that name the pair); a new line needs a rendered clip, so the round opens silently and the how-to card carries the instruction, and the two existing lines serve the miss and hint.

**Two pictures, one tray (level 10, built 2026-11-24, [PR #2150](https://github.com/rjdunlap/neo/pull/2150)).** Two 2×2 faint pictures side by side and eight pieces mixed in one tray, in `prek` (`5, 6, 7, 9, 10`) and `school` (`6, 7, 9, 10`) via `order`. `dealScenePair` picks two scenes with different friend, sky and ground, so every piece shows its picture by colour as well as by friend (a test runs 200 seeds). The round holds a `BoardView` per picture (scene, texture, frame, ghost); each piece knows its board. `judgeTwinDrop` takes the nearest empty place on either board: its own place is placed, another place on its own board is a miss ("Hmm, that piece goes somewhere else…"), and a place on the other picture is a miss too (`otherPicture`), spoken with the same "Hmm, that piece goes somewhere else. Look at its picture!"; off both frames is free. After two misses the piece she is holding glows with its own place on its own picture ("Try the glowing spot!"). The level opens with the faint-picture line (`puzzle.ghost`). Both friends come alive when all eight are in ("You made {a} and {b}!"). `twinLayout` puts the frames side by side (sideways and upright) over the tray; tray pieces keep the 100-unit hit rule. The box lid is not shown (the faint pictures are the guide). Not built: dedicated words for the other-picture miss and a per-scene-name line (new slot-free lines need rendered clips, which this run did not render), a per-picture finish before the second.

**Turn it round (level 9, built 2026-11-24, [PR #2113](https://github.com/rjdunlap/neo/pull/2113)).** A 3×2 puzzle with the box lid and outer rims in `prek` (`5, 6, 7, 9`) and `school` (`6, 7, 9`), placed via `order` so lap's level 8 is skipped without renumbering saved levels. Three pieces arrive upside down (`dealTurns`, never empty and never all), and every unplaced piece carries a small turn arrow badge (hidden once placed). Tapping a piece flips it half a turn (`flipTurn`), free and never a miss; dropping an upside-down piece on its own place hops it back with "Turn it round!" (`puzzle.turnItRound`), never a miss. Dropping on any wrong place is a miss; after two misses the place glows and, if the hinted piece still needs turning, its arrow pulses. `autotouch()` taps an upside-down piece first, then drags it into its place.

Level **8, One big piece at a time** (built 2026-11-13, lap's first; lap order 8, 1, 2, entry level 8) sets one piece at the frame's own size beside the frame (right of it sideways, under it upright). A touch anywhere (the piece, the frame, the background, a placed piece or any let-go of a drag) hops it into its place, and the next piece of a two- or three-strip picture (the seeded RNG picks) slides in from the right edge. Nothing can be a miss or a hint. Levels 1 and 2 are toddler's from here, and their opening line says "Tap a piece, and it hops onto the picture where it matches!" (`puzzle.lap`, `puzzle.tap`) instead of "Drag".

Twelve code-drawn scenes (a cow on the farm, a duck in the pond, a pig in the mud, a cat at night, a dog in the rain, and so on) are rendered once into a texture and cut into 2 to 12 pieces. Faint pictures guide the early levels; later ones show only an empty frame. On the one- and two-piece pictures (levels 1–2, the lap levels) a piece that is tapped, picked up and let go where it was, hops into its place by itself (2026-10-24, [PR #942](https://github.com/rjdunlap/neo/pull/942)); bigger puzzles keep the carry. At levels 5–7, thick flat rims mark outer sides (two at a corner). Dropping off the frame is exploration; a wrong place is a gentle miss. After two misses, the same waiting piece and destination glow while the pet names its position: corner first, then an edge beside a placed piece, then another adjacent piece. A successful placement clears the hint; each two-miss run charges one hint. The finished picture comes alive and the animal says hello. A round draws any of the twelve; stickers and the map icon always show one of the first six, so a saved sticker never changes picture.

**Built 2026-10-14 ([PR #292](https://github.com/rjdunlap/neo/pull/292)):** all twelve play scenes add seeded kites, different middle-edge landmarks and different foreground silhouettes; moon and rainy scenes also have a sky bird. Every piece at existing levels 1–7 has a distinct set of substantial filled visual cues, checked without counting empty drawing bounds. Saved sticker and map-icon art stays unchanged. The box lid was a separate slice, built below ([build note](../archive/COMPLETED-2026-10-09.md#puzzle-pals-visible-cues-and-fairness-2026-10-14)).

**Box lid (built 2026-11-24, [PR #2108](https://github.com/rjdunlap/neo/pull/2108)).** Levels 5–7 (`plan.lid`) show a 170×119 copy of the finished picture in a wood border, drawn from the same render the pieces are cut from, so it cannot disagree with them; it takes no touches. `lidLayout`: sideways it sits in the left strip under the `?` button; upright that strip is too narrow, so it sits top right above the frame. It makes these levels easier than "an empty frame" reads; whether they are fair without it is a person check, not a gate. A level-bounded how-to step names it.

**Upright (2026-11-17).** Pure `puzzleLayout` and `oneAtATimeLayout`: the frame sits under the corner buttons across the width and the tray fills the height below it in as many rows as keep the pieces biggest (160+ units; levels 3, 5 and 6 measured 83–98 before, and level 4 had a piece over the guide and one off the right edge); level 8's frame starts below Home. Sideways layouts are unchanged. Layout test: `src/games/upright-batch-7.test.ts`.
