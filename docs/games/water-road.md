# Water Road

<!-- generated: from src/games/water-road; edit the text below the end mark (npm run game-docs) -->

**ID:** `water-road` · **Land:** Tinker Lab · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, prediction, spatial-reasoning, reasons

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–4 |
| school | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Keystone: tap and a stone flies onto the frame from each end in turn; the last one is the keystone; then pull the frame and the arch stands (3 stones at toddler, 5 or 7 from preschool) |
| 2 | Which one stands? pull two frames and see which ring holds (two free pairs), then on the last pair tap the one that will stand before pulling |
| 3 | Hold it up: drag the block to the side with no wall and pull the frame; a pull with nothing pushing back spreads the ring (two arches) |
| 4 | Downhill all the way: pick the channel that goes down all the way (pre-K) or set two piers with arrows (school), then open the spring (two roads) |
| 5 | Over the valley (school): arches across three or four spans and a block on each earth end, then open the spring (two valleys) |

<!-- end generated -->

**Starts as:** tap and stones lift onto a wooden frame until the keystone chimes, then pull the frame and the pet walks through, the way builders once made arches; later, set piers so water runs downhill and raise arches over a valley

**Grows into:** levels 1–3: every tap lifts a stone from the ends inward (3 stones at toddler, 5 or 7 from preschool) and the handle pulls the frame (nothing counted); pull two frames, one ring closed and one with a gap, and see which stands, then tap the frame that will stand (the open one is a miss, and the second miss glows the closed one, one hint); drag the buttress block to the side with no wall and pull the handle (a spreading arch is a miss, and the second miss on an arch glows the slot, one hint). One spoken history line and one rule line at levels 2–3. Nothing is kept. levels 4–5 (school, and pre-K level 4): water arrives. Level 4 Downhill all the way: pre-K picks one of two whole channels (one climbs), school sets two piers with up and down arrows, then Open the spring (a pooled opening is one miss and changes nothing; the second miss or Help glows the falling card or arrow, one hint per road). Level 5 Over the valley: drag arches across 3 then 3–4 spans and an abutment onto each earth end (one end usually rock); a failed opening slides only the unheld arches back (one miss), and the second miss or Help glows the empty span, earth end or abutment to move. Levels 6–8 and The Water Commissioner not built. Tinker Lab

## Design notes

*Levels 1–5 · [definition](../definitions/water-road.md) · ancient-mediterranean slices AM2 and AM3.* She helps raise a stone arch on a wooden frame, then finds which ring stands and where a push needs holding, the way builders once made arches. Toddler plays level 1, preschool levels 1–2, pre-K 2–4, school 3–5. Nothing is kept; the sticker is the round's only reward. Music is the island's.

**1 Keystone:** any tap on the stage lifts the next stone onto the frame from the ends inward (3 stones at toddler, 5 or 7 from preschool); the last is the keystone and chimes. Then the handle (any tap at toddler) pulls the frame away and the pet walks through the arch. Nothing is counted; after six idle seconds the handle glows. **2 Which one stands?:** three pairs of frames, one ring closed and one with a gap (the gap is at the keystone at preschool; at the keystone or a shoulder at pre-K and school, with 5 or 7 stones). Pairs 1 and 2 are free: she pulls either frame and the open ring tumbles while the pet names where the gap was. On pair 3 the pet asks "Which one will stand?". **3 Hold it up:** two closed arches, one at a time, with a wall at one side (at school the second arch may be walled on both sides). She drags the buttress block to a slot (free, any time), and pulling the handle is the commit: the arch stands, or spreads on the side nothing holds.

**Misses and help.** Level 1 has none. Level 2: on the asked pair, tapping the open ring is one miss (the gap blinks and the pet explains), and after the second miss the closed ring glows, one hint; tapping the closed ring pulls both, hers stands and the pet walks through. Level 3: a pull that spreads is one miss (the block floats home and the stones climb back); after the second miss on an arch the slot it needs glows, one hint per arch. Moving the block and pulling a both-walled arch are free; Help on a both-walled arch counts nothing. Level 4: a pooled opening (the channel climbs or is flat) is one miss and changes nothing; after the second miss or Help (one hint per road) the falling card, or the arrow toward the nearest falling setting, glows. Level 5: a failed opening slides only the unheld arches back to the tray (one miss); the second miss or Help glows the empty span, the earth end, or the abutment on the rock end to move.

**History and rule.** After the history line at levels 2 and 3 one rule line is spoken: "A ring that is closed and pushed back at both ends stands." The history line is "Long ago, by the middle sea, people built rings of stone like this one; some of them are still standing." No real place, people or date is on screen. Voice lines `wr.*` (title clip "Water Road!" rendered). Home land Tinker Lab (its 20th game; it pages 7/6/6 at school); skills cause-and-effect, prediction, spatial-reasoning, reasons. The ghost finger plays every level (stones, handle; both pairs and the standing ring; the buttress slot and the pull). Co-play: frame-puller and stone counter. No off-screen line and no couch version. The history line is also spoken and on the level 4–5 how-to card, source-checked against the study's aqueduct and arcade pages (Roman aqueducts carried water on a continuous gentle downward gradient and crossed valleys on arcades). The scene is `flow.ts`. Levels 6–8 (AM4) and The Water Commissioner (AM5) are not built. Rule tests: [`water.test.ts`](../../src/games/water-road/water.test.ts) (24, including layout at four views with four spans) and [`logic.test.ts`](../../src/games/water-road/logic.test.ts) (23: ring order, the stands rule, explain and hintFor, plans over 300 seeds per band, level-1 tap and pull invariants, level-2 free pulls and asked predictions with the Tally, level-3 pull and spread for every seed with the bot's placement standing, layout at landscape, portrait, phone and notch).
