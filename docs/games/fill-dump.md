# Fill and Dump

<!-- generated: from src/games/fill-dump; edit the text below the end mark (npm run game-docs) -->

**ID:** `fill-dump` · **Land:** Counting Cove · **Ages:** lap–preschool · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** containment, counting, cause-effect, capacity

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 1, 2, 6, 3, 4 |
| preschool | 1, 2, 6, 3, 4, 5, 7 |

| Level | Plays like |
| --- | --- |
| 1 | Tip out 3 and scoop them back |
| 2 | Tip out 4 and scoop them back, 2 times |
| 3 | Put 1 to 3 in the container, then check (5 to pick from) |
| 4 | Put 3 to 5 in the container, then check (7 to pick from) |
| 5 | Tip the jug to fill three cups to their lines; catch and reuse spills |
| 6 | Full and empty: 4 times, tip out the full basket or fill the empty one |
| 7 | Guess which holds more, pour to test, then answer from the evidence: three pairs |

<!-- end generated -->

**Starts as:** tap the container or grass and the pieces tumble out with a chime each; tap it back in (levels 1–2); an idle wiggle invites the next touch

**Grows into:** seeded fruit/basket, balls/bucket, blocks/toy box or ducks/tub at levels 1–4; tip it out twice, count identical pieces (a dot card shows the number asked for), a tip-or-fill choice between a full and an empty basket (level 6), then tip a jug to fill three cups to their lines; level 7 guesses, pours and answers which of two containers holds more over three pairs; spills can be reused

## Design notes

*After water-table and bath-toy play.* Levels 1–4 choose one seeded set per round: fruit in a basket, balls in a bucket, blocks in a toy box or bath ducks in a tub. Tip-out uses distinct designs (at least four available in each set); counting repeats one identical design. Speech names the current container and pieces, and each set has a different pentatonic landing pitch. Tap the big container and it tips over, the pieces tumbling out one by one with a chime each and landing on the grass; tap a piece (or the container again, which scoops the nearest one) and it hops back in. At levels 1–2, open grass also tips a full basket or scoops the outside piece nearest the touch. After six idle seconds while ready for input, the container or the piece nearest it wiggles; the invitation changes no misses or hints. Counting and pouring ignore ground taps and have no idle invitation. Taps only, since a one-year-old will not drag. Levels: 1 tip out three and scoop them back (nothing can go wrong); 2 four pieces, tipped out twice (the container is full again between, and the voice says so); 3 put in the number asked, one to three, from five identical pieces on the grass; 4 three to five from seven. At levels 3–4 a card left of the container shows one hollow dot per piece asked for (up to three a row); a dot fills in the pieces’ own color as each piece lands, and a piece beyond the number hangs below the card as an extra filled dot, so "too many" shows without sound or color (decoration only; the check and accounting are unchanged). Counting levels: each piece that goes in is counted aloud, a tap on the container takes the latest back out (a free undo), and the green check says "that is enough". A wrong check is the one miss (the check with nothing in yet is only the instruction again); every second miss glows what leads somewhere (a piece to add, the container to take one out of, or the check itself) and counts one hint. Landing places are seeded, in separate grid cells at least 128 units apart (tap circles 120 across), clear of the pet, and recomputed on resize. Toddler and preschool add level 6, *Full and empty*, placed after level 2 (toddler order 1, 2, 6, 3, 4; preschool 1, 2, 6, 3, 4, 5, 7; lap unchanged): two baskets stand apart, one with three fruit peeking over the rim, one empty, with a pile of three fruit on the grass between them. Four requests alternate between "Tip out the full one!" (it tips, the fruit tumbling out in front) and "Fill the empty one!" (the pile hops in), the first and the side of the full basket seeded, each request dealing a fresh pair. The wrong basket gets a boing, a head shake and "Nothing in there to tip!" or "No room, it is full!" and is one miss; the second miss on a request glows the right basket and counts one hint (once per request). Grass and pile taps are free. Preschool adds level 5: pull a jug right to pour into three cups, first to a halfway line, then quarter and three-quarter lines in seeded order. The furthest displacement in a gesture controls the amount (240 units per full cup); lifting stops, moving back rights the jug without pouring again. A check within six hundredths of a cup of the line accepts it. Overflow is caught in the tray; tapping the cup empties it into the tray, and tapping the tray returns all its water to the jug. Spills, emptying and recovery are free experiments. An empty check repeats the instruction; other incorrect checks count misses, with a persistent glow after two misses per cup and at most one hint per cup. Three checked cups finish with one sticker. Pointer cancellation, leaving the view, resizing and lost release stop the gesture. The ghost finger pours, recovers and checks through those same controls. Preschool top level 7, *Which holds more?*, sets out three distinct pairs: full bowl → small cup first, then cup → bucket and bucket → mug in seeded order. Straight-sided capacities differ by at least 1.6×; height is volume divided by width. Tap either container to make a free prediction, pull the left one right with the same 240-units-per-cup gesture to pour it all into the right, then tap the check. A partial check repeats the instruction without scoring. Overflow in the tray means the source holds more; room left means the receiver holds more. Tap the larger container to answer. Only a smaller-container answer after evidence counts a miss; after two, the spill or empty space glows (one hint per pair). Tap the tray to return all water and re-pour freely; during pouring, the right container also returns the water. Predictions, spills, partial pours and re-pours never score. All water stays in source, receiver or tray within each experiment; each next pair sets out its own full source. Three answered pairs finish with one sticker. The ghost finger guesses, pours, checks and answers through the same controls. Co-play: tip it out together, count the pieces aloud; off-screen: a tub of soft toys or dry beans and a big bowl.
