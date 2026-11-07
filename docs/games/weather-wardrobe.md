# Weather Wardrobe

<!-- generated: from src/games/weather-wardrobe; edit the text below the end mark (npm run game-docs) -->

**ID:** `weather-wardrobe` · **Land:** Cozy Village · **Ages:** lap–pre-K · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** reasoning, vocabulary, everyday-life

| Band | Levels, easiest first |
| --- | --- |
| lap | 1, 8, 2 |
| toddler | 2, 9, 3, 4 |
| preschool | 3, 9, 4, 5 |
| pre-K | 4, 5, 10, 6, 7 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the sky to change the weather; the pet dresses itself |
| 2 | Pick the one thing to wear, out of two |
| 3 | Pick the one thing to wear, out of three |
| 4 | Find both things to wear, out of four |
| 5 | Find everything to wear, out of five |
| 6 | Pack for a trip with two kinds of weather |
| 7 | Take off clothes that do not fit the new weather, then dress for it |
| 8 | Try things on in the weather: the one that fits stops it (no mistakes) |
| 9 | See what the pet is wearing and pick the weather it is dressed for |
| 10 | Drag four items to two friends in different weather |

<!-- end generated -->

**Starts as:** tap the sky to change the weather (four weathers)

**Grows into:** try things on at lap (the fitting item stops the weather), dress the pet for sun, rain, snow or wind, pack for two kinds of weather and watch the trip unpack, name the sky from an outfit (Which sky?), drag clothes to two friends in different weather (pre-K 10), then change outfits when the weather changes (pre-K)

## Design notes

Sun, rain, snow and wind fill the sky (wind added 2026-10-26: a low sun, drifting clouds, leaves streaming sideways and bent grass, and the pet leaning into it). At lap, tapping the sky changes the weather and the pet dresses itself, and a touch on the grass answers the weather where it lands (a puddle splash in rain, a snow crunch, a flower popping up in sun, a scatter of leaves in wind with a whoosh) and a touch on a worn item wiggles the nearest one and says its name ("Mittens!"); neither changes the weather, counts toward the finish or is a miss. Free play steps the sky sunny, rainy, snowy, windy and ends after seven sky taps once all four weathers have shown. Later the child picks one item, then every item that fits, then packs a suitcase for a two-weather trip. Pre-K level 7 starts with an outfit for one weather, changes the forecast, and asks the child to remove each item that no longer fits before dressing the pet for the new weather. There are fifteen items, each belonging to exactly one weather (sunny: sun hat, sunglasses, sandals; rainy: rain hat, raincoat, umbrella, boots; snowy: beanie, earmuffs, scarf, puffy coat, mittens; windy: a kite held in the hand, a green windbreaker with a hood and drawstrings, and an orange hat with a chin strap), and an outfit takes one item per slot (head, eyes, neck, body, hands, feet, held), so it never doubles a slot: snowy picks the beanie or the earmuffs for the head, and a coat is layered under the other worn items. Level 5 always asks for three slot-distinct items (windy has exactly three, one per slot), a trip packs two slot-distinct items per weather, and level 7 uses one outfit per weather for the whole game, so what she takes off is exactly what she just put on. Stickers draw from the original eight items and the original three weathers only (`STICKER_WEATHERS`), so a seed's sticker looks as before. A wrong choice says which weather the item is for, and at levels 2–7 the item first goes on the pet for about a second and shows its consequence (sunny gear in the rain or snow is wet or cold, a snowy coat in the sun makes sweat drops; the pet looks hot, wet or shivers, with a three-note bell descent; a wrong item in wind is blown: three wind curls stream past, the pet looks surprised and the piece lifts off, tumbles up and away and fades, with a rising three-note bell) before it hops back to its tile; the tile ignores taps while that plays, and the miss and hint counts are unchanged. Lap level 8, *Try it on* (lap order `[1, 8, 2]`, `entryLevels: [8]`), shows two tiles, one item that suits the weather (sun hat, umbrella or puffy coat) and one misfit from another weather, over three rounds of different weathers with no misses or hints: the misfit plays its consequence and hops back, the fitting item stops the weather with bouncing sparks (the windbreaker stops the wind with green sparks), and after six idle seconds the fitting tile wiggles (not a hint). At level 6 the trip now happens: after the suitcase is packed it unpacks, and for each weather in forecast order the scene changes and the pet puts on that weather's two packed items; the two weathers are drawn from all four, so there are six pairs. Level 9, *Which sky?* (toddler order `[2, 9, 3, 4]`, preschool `[3, 9, 4, 5]`, `entryLevels: [8, 9]`), shows a grey weatherless scene where the pet wears two items of one weather; the child taps one of three weather cards (the answer plus two of the other three weathers, so the answer is always on offer). A wrong sky plays over the pet with its misfit consequence (blown, for a windy sky) and then clears (one miss); after a second miss the right card glows (one hint). Clothing is drawn in critter body coordinates and attached, so it hops with the pet. The pet is the star, so tapping the big pet repeats the instruction.

Per species (RW05 slice 2b): the same code-drawn clothes hang on the companion's parts (earmuffs on the ears, one piece per point for boots, mittens and sandals), and a species is offered only items it can wear. The river has no mittens, raincoat or puffy coat; the glider has no scarf, mittens, boots, sandals, raincoat or puffy coat; every weather keeps at least one item (glider snow: beanie or earmuffs). The umbrella and the kite are held in the sprout's hand and stand on the back of the river and glider. The river and glider cannot wear the windbreaker, for the same reasons as the raincoat; they keep the kite and the hat with a strap. Both pieces of a worn pair answer a touch.

Pre-K level 10, *Two friends, two places*, shows a cat and bear beneath different weather signs. Drag four clothes tiles to the friend whose weather each suits; each friend receives two slot-distinct items, which stay on its body. Three pairs complete one round and earn one shell sticker. A wrong friend returns the item and explains its weather (one miss); two misses in a pair glow an item and its friend (one hint per pair, persisting for the remaining items). Empty-space and cancelled drops are free, and touching a friend repeats the instruction. The companion stays in its guide corner; these upright friends use the full wardrobe independently of companion anatomy. Pre-K order is `[4, 5, 10, 6, 7]`, with existing IDs and pins preserved.
