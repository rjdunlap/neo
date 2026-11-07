# Maker Lane

<!-- generated: from src/games/maker-lane; edit the text below the end mark (npm run game-docs) -->

**ID:** `maker-lane` · **Land:** Cozy Village · **Ages:** toddler–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** where things come from, how things are made, plant or animal, cause and effect

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–3 |
| school | 2–3 |

| Level | Plays like |
| --- | --- |
| 1 | Along the lane |
| 2 | Who can use it now? |
| 3 | Where did it begin? |

<!-- end generated -->

**Starts as:** carry a bundle along a lane of makers' stalls where it changes form (fleece to yarn to a scarf for the pet), or trace a finished thing back to where it began

**Grows into:** level 1 (toddler, preschool): tap the waving maker or drag the bundle to it and the bundle changes; a maker who is not waving says it is not their turn (free); the product goes to the pet. Level 2 (preschool, pre-K, school): three makers 2–4 in an order that is not the chain; a maker who cannot use the form yet shows a thought bubble of the form they need (one miss, free to resend); two misses on a bundle glow the right maker (one hint, shared with Show me). Level 3 (pre-K, school): three things and three beginning cards (a sheep, a cotton plant, a tree, a wheat field, a cow, a hen, the factory); a wrong card dims, walks its own lane and its product sits beside the thing asked about (one miss); two misses glow the right card. Four chains: wool, cotton, wheat, tree. Made-up island makers; nothing is saved. Cozy Village

## Design notes

*Levels 1–3 · after the food-and-fiber study; [definition](../definitions/maker-lane.md).* A lane of island makers' stalls (shearer, washer, spinner, weaver; the cotton, wheat and tree chains have their own makers) where a carried bundle changes form: fleece to yarn to a scarf, cotton to a sock, wheat to a loaf, a tree to a box. Four chains; the product goes to the pet and nothing is saved. Art is code-drawn in `src/games/maker-lane/art.ts`; the sheep and hen drawings moved to `src/art/animals.ts` (`sheepArt`, `henArt`) and River Tablets and Keep House use them too. The makers are made-up island makers.

Levels: 1 "Along the lane" (toddler 1, preschool 1): tap the waving maker, or drag the bundle to it, and the bundle changes; a tap on a maker who is not waving says it is not their turn and counts nothing. 2 "Who can use it now?" (preschool 2, pre-K 2, school 2): the harvest plays itself, then three makers 2–4 in an order that is not the chain's; send the bundle to the maker who can use its form now. 3 "Where did it begin?" (pre-K 3, school 3): three things and three beginning cards (a sheep, a cotton plant, a tree, a wheat field, a cow, a hen, the factory); tap where each came from.

Misses and hints: level 1 has none and no Show me. At level 2 a maker who cannot use the form yet refuses with a thought bubble of the form they need (one miss; resending to a bubbled maker is free); two misses on one bundle glow the right maker (one hint, shared with Show me). At level 3 a wrong card is one miss: the card dims, walks its own lane, and its product (milk or an egg for the cow and hen, nothing for the factory) sits beside the thing asked about; two misses on one thing glow the right card (one hint, shared with Show me). One sticker per round. Voice lines `makerlane.*`, marked REVIEW in the voice script for a named agricultural-literacy or textile review (title clip `game.maker-lane` rendered). Cozy Village is its home land (the 21st game), fallback Painted Canyon. The ghost finger plays levels 1–3. Co-play (maker and carrier) and off-screen lines are on the grown-ups' page. Not built: the grown-ups' "Where did it begin?" label card (FS3, `src/parent/panel.ts`) and Maker Lane 4–5 (FS2). Open: the person and device checks and the educator review in DEVICE-CHECKS.
