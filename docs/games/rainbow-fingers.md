# Rainbow Fingers

<!-- generated: from src/games/rainbow-fingers; edit the text below the end mark (npm run game-docs) -->

**ID:** `rainbow-fingers` · **Land:** Painted Canyon · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fine-motor, creativity

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 1–3 |
| preschool | 2–5 |
| pre-K | 3–6 |
| school | 5–7 |

| Level | Plays like |
| --- | --- |
| 1 | Rainbow painting |
| 2 | Paint pots: pick a color and hear its name |
| 3 | Coloring page: "paint the sun yellow", 2 pictures |
| 4 | Coloring page: "paint the sun yellow", 3 pictures |
| 5 | Coloring page: "paint the apple" (remember its color), 3 pictures |
| 6 | Mixing colors: red and yellow make orange |
| 7 | Paint the pumpkin: remember orange, then mix red and yellow |

<!-- end generated -->

**Starts as:** rainbow or color-pot finger painting (any touch counts: pat, hold or drag; a pat splats a flower; an idle nudge)

**Grows into:** marked 104-unit paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl, then remembering a pumpkin’s orange, pouring red and yellow into the bowl and painting it; about half of the level-2 pot pages are a fold page (a dashed crease and a fold button that prints the wet paint mirrored)

## Design notes

Finger painting that grows over seven levels: rainbow or color-pot painting, paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl, then remembering that a pumpkin is orange, pouring red and yellow into the bowl and painting it. Both mixing modes use the same bowl rule: two pours mix; a third starts over, and tapping the bowl empties it for a free retry. Any color is welcome in free painting. At levels 1–2 every lifted touch counts toward the frame (pat, hold or drag; a pat splats a palm-sized flower), and after a few quiet seconds a blank spot sparkles and the pet hops (never a hint). Pots are 104 across and each carries a mark (dot, stripe, star, heart, swirl, ring) so color is not the only cue. Lap play includes the second, unjudged free-play mode (color pots). A painting from either open-ended level can be kept on the treehouse picture board (bounded, normalized marks, never a bitmap); guided coloring pages offer nothing to keep.

**Fold pages (level 2).** About half the *Paint pots* pages (seeded `pageKind`) are a fold page: a dashed crease and two faint wing outlines. New paint stays wet on its own layer. After her first mark a 104-unit fold button pops in on the crease just above the pot row; tapping it swings the right half over, squishes, and prints the wet paint mirrored about the crease at 0.85 alpha (`paint.folded`, three lines). The print is then dry, so a second fold prints only new paint, and a fold with nothing wet changes nothing. A fold that printed paint counts as one of the five touches for the frame. There are no misses or hints; an 8-second nudge wiggles the button when wet paint waits, and hanging up or a resize mid-fold presses the print first. A kept painting gains the mirror copies as ordinary marks (marks within their radius of the crease are not copied; the painting's usual halving caps them). Other levels never draw a fold page. The bot paints the left half, folds after four strokes (or as soon as the frame shows), then hangs up. Crease pages (a live mirror, no button) are not built yet.

**Words and fairness.** Every picture is spoken by a name table (`THING_NAMES`) that never equals a color word, so no line reads a raw id. At the recall level (5) only, apples and grapes painted green count with no miss and fill green, and the voice says "Green apples are real too!" in place of praise; the told answer (red, purple) stays the first one for the hint glow and the bot, and every other level accepts only the named color. At levels 1–2 a lifted drag says its color (the pot's name, or the nearest rainbow name of its last hue) and a pat's splat names its flower, at most once every six seconds, never over the opening instruction and not on the fold's own lifts; picking a pot restarts that clock. Start, done, finished and a paint praise each have three wordings, and level 7's prompt names no color or recipe. Co-play at toddler: say each color as it is painted, then find something that color in the room. Off-screen ideas by band: yogurt finger paint, a color hunt, play-dough mixing and a fold-and-press butterfly print.

**Pictures and the draw.** The coloring pages draw from 21 pictures: yellow sun, banana, chick, lemon; red apple, strawberry, ladybug, cherries; green leaf, frog, turtle, broccoli; blue blueberry, whale, puddle; purple grapes, plum, eggplant; and orange pumpkin, carrot, basketball. Levels 3–5 pick distinct colors first, then one picture of each, so a page never repeats a color and a color with more pictures is not asked more often. Level 7 (the pumpkin) is unchanged; each new picture accepts only its own color. The puddle is named-only: recall pages (level 5) never deal it, since a four-year-old would not give one color for a puddle, but named pages may ask to paint it blue; the mixing pages draw from three orange, four green and three purple pictures.
