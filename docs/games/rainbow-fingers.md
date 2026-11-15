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
| school | 5–12 |

| Level | Plays like |
| --- | --- |
| 1 | Rainbow painting |
| 2 | Paint pots: pick a color and hear its name |
| 3 | Coloring page: "paint the sun yellow", 2 pictures |
| 4 | Coloring page: "paint the sun yellow", 3 pictures |
| 5 | Coloring page: "paint the apple" (remember its color), 3 pictures |
| 6 | Mixing colors: red and yellow make orange |
| 7 | Paint the pumpkin: remember orange, then mix red and yellow |
| 8 | Color wheel: mix each empty petal from the two colors beside it |
| 9 | Make it pink: mix red and white, 2 pictures |
| 10 | Brown from all three: pour red, yellow and blue, 2 pictures |
| 11 | Mix it from memory: 3 pictures, at least one pink or brown, the recipe not told |
| 12 | Match a paint card by how many drops of each |

<!-- end generated -->

**Starts as:** rainbow or color-pot finger painting (any touch counts: pat, hold or drag; a pat splats a flower; an idle nudge)

**Grows into:** marked 104-unit paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl, then remembering a pumpkin’s orange, pouring red and yellow into the bowl and painting it, then finishing a color wheel (school level 8: a six-petal flower with red, yellow and blue painted, and she mixes the orange, green and purple petals from the two colors beside each; then school level 9, where a white pot joins and red and white make pink for a pig, flamingo, cupcake or tulip; then school level 10, where the bowl takes three pours and red, yellow and blue together make brown for a bear, acorn or owl; then school level 11, where she mixes from memory: three pages of different recipes, the recipe never told before a second miss), then matching paint shades by the proportion of drops from two pots (school level 12); about half of the level-2 pot pages are a fold page (a dashed crease and a fold button that prints the wet paint mirrored)

## Design notes

Finger painting that grows into coloring and mixing: rainbow or color-pot painting, paint pots that say their color, coloring pages ("paint the sun yellow", then "what color is an apple?"), mixing colors in a bowl, then remembering that a pumpkin is orange, pouring red and yellow into the bowl and painting it. Both mixing modes use the same bowl rule: two pours mix; a third starts over, and tapping the bowl empties it for a free retry. Any color is welcome in free painting. At levels 1–2 every lifted touch counts toward the frame (pat, hold or drag; a pat splats a palm-sized flower), and after a few quiet seconds a blank spot sparkles and the pet hops (never a hint). Pots are 104 across and each carries a mark (dot, stripe, star, heart, swirl, ring) so color is not the only cue. Lap play includes the second, unjudged free-play mode (color pots). A painting from either open-ended level can be kept on the treehouse picture board (bounded, normalized marks, never a bitmap); guided coloring pages offer nothing to keep.

**Fold pages (level 2).** About half the *Paint pots* pages (seeded `pageKind`) are a fold page: a dashed crease and two faint wing outlines. New paint stays wet on its own layer. After her first mark a 104-unit fold button pops in on the crease just above the pot row; tapping it swings the right half over, squishes, and prints the wet paint mirrored about the crease at 0.85 alpha (`paint.folded`, three lines). The print is then dry, so a second fold prints only new paint, and a fold with nothing wet changes nothing. A fold that printed paint counts as one of the five touches for the frame. There are no misses or hints; an 8-second nudge wiggles the button when wet paint waits, and hanging up or a resize mid-fold presses the print first. A kept painting gains the mirror copies as ordinary marks (marks within their radius of the crease are not copied; the painting's usual halving caps them). Other levels never draw a fold page. The bot paints the left half, folds after four strokes (or as soon as the frame shows), then hangs up. Crease pages (a live mirror, no button) are not built yet.

**Words and fairness.** Every picture is spoken by a name table (`THING_NAMES`) that never equals a color word, so no line reads a raw id. At the recall level (5) only, apples and grapes painted green count with no miss and fill green, and the voice says "Green apples are real too!" in place of praise; the told answer (red, purple) stays the first one for the hint glow and the bot, and every other level accepts only the named color. At levels 1–2 a lifted drag says its color (the pot's name, or the nearest rainbow name of its last hue) and a pat's splat names its flower, at most once every six seconds, never over the opening instruction and not on the fold's own lifts; picking a pot restarts that clock. Start, done, finished and a paint praise each have three wordings, and level 7's prompt names no color or recipe. Co-play at toddler: say each color as it is painted, then find something that color in the room. Off-screen ideas by band: yogurt finger paint, a color hunt, play-dough mixing and a fold-and-press butterfly print.

**Pictures and the draw.** The coloring pages draw from 21 pictures: yellow sun, banana, chick, lemon; red apple, strawberry, ladybug, cherries; green leaf, frog, turtle, broccoli; blue blueberry, whale, puddle; purple grapes, plum, eggplant; and orange pumpkin, carrot, basketball. Levels 3–5 pick distinct colors first, then one picture of each, so a page never repeats a color and a color with more pictures is not asked more often. Level 7 (the pumpkin) is unchanged; each new picture accepts only its own color. The puddle is named-only: recall pages (level 5) never deal it, since a four-year-old would not give one color for a puddle, but named pages may ask to paint it blue; the mixing pages draw from three orange, four green and three purple pictures.

**Color wheel (level 8).** A six-petal flower in rainbow order (red at the top, clockwise) with red, yellow and blue painted; the empty orange, green and purple petals are each asked once, in seeded order. She pours the two neighbouring primaries into the same bowl and paints the petal; the neighbours show the recipe and it is never said before success. A wrong color, a single primary included, is a miss with a boing and "Look at its neighbors" or "Its neighbors are two colors" and a pulse on the neighbouring petals; two misses glow the two pots (a hint). A dab with no paint in the bowl only reminds, and the bowl empties after each petal. Known: the wheel is laid out once and is not re-laid out if the view changes mid-round.

**Make it pink (level 9).** A white pot (marked with a cloud) joins red, yellow and blue. Red and white mix pink in the bowl; the page is two different pictures from four pinks (pig, flamingo, cupcake, tulip). The prompt says the recipe ("Paint the pig pink! Mix red and white."); a wrong color is a miss with a boing that tells the recipe, and two misses glow the red and white pots (a hint). Cupcake and tulip are told-only (not dealt by a later recall level), pinks never appear on levels 3–8, and a single pour shows a rim so white is visible in the bowl.

**Brown from all three (level 10).** The bowl holds three pours and a fourth starts it over. `mix` matches the set of distinct pours to a recipe, so order and repeats do not matter: two different primaries plus a repeat give their secondary, and all three different give brown (`RECIPES.brown`). The page is two different pictures from three browns (bear, acorn, owl; 24 pictures in all), shown on level 10 only. Prompt "Paint the bear brown! Pour red, yellow and blue."; a wrong dab boings and tells the three-color recipe, and two misses glow the three pots (a hint). `nextPour` is the shared next-move rule for the ghost finger and the tests.

**Mix it from memory (level 11).** Three pages of three different recipes drawn from orange, green, purple, pink and brown (`MEMORY_POOL`; the puddle, cupcake, tulip and grapes are left out as told-only or ambiguous), at least one pink or brown so it is never level 7 made longer. The ask names neither the color nor the recipe ("Paint the frog! What color is it?"). The bowl takes three pours and the white pot is present. The first miss names the color only ("The frog is green!"); the second tells the recipe and glows the pots (a hint) (`tellsRecipe`). Voice lines `paint.memory`, `paint.memory.mix` and `paint.memory.is`; a level-11 how-to line. Known: the first-miss wording was checked by tests, not heard on speech.

**Match the sample (level 12).** Tap either marked pot to add a drop and watch the bowl's color change. The paint card shows a shade made from two primaries. Two drops of one and one of the other can match, and so can other close proportions. The check mark compares the bowl with the card, and a nearby shade counts. A far check suggests more of one paint or a fresh bowl. After two far checks the helpful control glows. Tapping a pot when the bowl already holds six drops makes it wobble and lights Start again. Each card with a glow counts as one hint. Checking a blend never counts as a miss. Three matches finish a round. This level plays upright on a phone.
