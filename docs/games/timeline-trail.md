# Timeline Trail

<!-- generated: from src/games/timeline-trail; edit the text below the end mark (npm run game-docs) -->

**ID:** `timeline-trail` · **Land:** Barnyard · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** sequencing, then-and-now, cause-and-effect

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 1–4 |
| school | 2–6 |

| Level | Plays like |
| --- | --- |
| 1 | Long ago or now? |
| 2 | Hang it between |
| 3 | Grow the line |
| 4 | A clue inside |
| 5 | Still here |
| 6 | We can’t tell |

<!-- end generated -->

**Starts as:** hang pictures of one island place on the pet's clothesline between a long-ago post and a now post, then watch the place grow as a flipbook

**Grows into:** levels 1–5: tap (or drag to its post) the older of two pictures, drag a loose third picture into the right one of three gaps, then grow a line of four from the first stage. Places: a shore, a tree and the pet's nest; stages are told by what the picture shows, never by numbers or dates. A wrong gap slides back with a spoken reason from the picture; after two misses on a card its gap glows (one hint). At level 4 the shore and the tree share one line and each card carries a little round picture of the other place at the same time, the only clue that orders one place's card against the other's. At level 5 two later places, a village green and a bread oven, grow a line of four, and she pins what never changed to a "still here" ribbon with one of three picture chips. Nothing is kept. Barnyard

## Design notes

*Levels 1–5 · [definition](../definitions/timeline-trail.md), [levels 5–7](../definitions/timeline-trail-5-7.md) · time-and-change slices T2, T3 and T4a.* The pet's clothesline runs between a long-ago post (left, a faded sepia picture of the place's first stage) and a now post (right, the bright last stage). Three made-up island places have four stages each: a shore (empty shore with one rock, little dock, dock with a boat shed, dock with a boat and a lantern), a tree (sapling, young tree, big tree, big tree with a swing) and a nest (egg, hatchling, young pet with a first scarf, the pet now at the treehouse door, drawn from her companion). Places come from a shuffled bag, so all three appear before any repeats. No number, date or time word appears; stages are told by what the picture shows.

**1 Long ago or now?** (preschool, pre-K): two pictures of one place, at least one stage apart, wait in the tray. Tap the older one, or drag it to the left post (dragging the newer one to the right post also counts); the other flies to the other post. **2 Hang it between** (preschool, pre-K, school): two of three stages already hang; drag the loose one (first, middle or last) into the right one of three gaps. **3 Grow the line** (pre-K, school): the first stage hangs and the other three wait in a seeded order; each drop is judged against the cards already hung, so there is exactly one valid gap per card. A finished line plays as a flipbook in a big frame (each stage turns in on a rising pentatonic marimba), the pet cheers, and the round gives one sticker. Nothing is kept or filed. **4 A clue inside** (pre-K, school): the shore and the tree share one clothesline. A card's number is its time 0–3 on that line; one place's two cards hang at two seeded times and the other place's two cards wait loose at the other two times. Every card shows a small round inset ("the little picture") of the other place at the same stage, and only that inset orders one place's card against the other's; a solver (`fittingGaps`, `compareFaces`) decides the gap. The posts show the hung place at its first and last stage, each with the same little picture, so long ago and now show both places. A wrong gap slides back with a reason read from the little picture ("In the little picture, the shore already has the boat shed, so this comes after the little dock on the shore."). Tapping a loose card says its caption and its clue (free). The flipbook plays the merged line in time order, both places interleaved with each card's inset. Misses and hints count as at levels 2–3 (a glow after two misses on a card is one hint). Reasons no longer read "the an empty shore" (a caption loses its article after "the"). **5 Still here** (school only, for now): a village green (big rock and sapling; a grand merry-go-round; a plain bench by a taller tree; the bench with a flower bed and a big tree) or a bread oven (stone oven and vine shoot; a fancy stall with striped awning, sign and bunting; a plain table; a cat asleep on top). These two later places have their own bag and appear only here. A round builds a line of four as at level 3; when it is full the gaps go away, the four cards stand in one row, a "still here" ribbon lies under them and three chips appear where the tray was: the thing in every picture (big rock, stone oven), the grand thing (merry-go-round, striped awning) and one plainer thing (bench or flower bed, table or sleeping cat). Tap a chip or drag it to the ribbon. The right chip pins there and the flipbook plays with a sparkle on that thing in every picture. The growing thing (tree, vine) is never a chip, since she could fairly call it still here. The grand thing is a trap for "more in the picture means later": the newest picture is not always the fanciest, and rule tests prove that guess misplaces a card in every round.

**Misses and help.** A card dropped in a wrong gap slides back with a boing and a reason from what the picture shows ("This picture already has the boat shed, so it comes after the little dock on the shore"). One miss per distinct wrong drop; the same card in the same wrong gap again repeats the reason and counts nothing more. After two misses on one card its valid gap glows and `hints` goes up (at most once per card); the pause sheet's Show a hint lights the gap for the card in hand (or the oldest loose one), the same single hint per card. At level 1 the only miss is calling the newer picture "long ago". At level 5 a wrong chip is a miss with a spoken reason ("The merry-go-round is only in one picture."), the same wrong chip again counts nothing, after two misses or Show a hint the right chip glows (one hint at most), and a chip let go away from the ribbon is free. Free: tapping a loose card to hear its caption (levels 2–3), releasing a card away from every gap (it floats home, nothing said) and the pet's tap. Start again restores the round's first state, keeping misses and hints. Ordinary adaptation. Co-play: while she hangs a picture, ask what changed between this picture and that one. Off-screen: look at a baby photo and a recent photo of the same person, or plant a seed, and talk about what looks different. No couch version.
