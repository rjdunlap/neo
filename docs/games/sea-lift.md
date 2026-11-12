# Sea Lift

<!-- generated: from src/games/sea-lift; edit the text below the end mark (npm run game-docs) -->

**ID:** `sea-lift` · **Land:** Bubble Beach · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** negative-numbers, number-line, counting-back, ordering, distance, opposites

| Band | Levels, easiest first |
| --- | --- |
| school | 1–5 |

| Level | Plays like |
| --- | --- |
| 1 | Up or down? Stops from the water |
| 2 | Through the water: rides that cross zero |
| 3 | Deepest first: order heights across the water |
| 4 | How far? Count the stops between two friends across the water |
| 5 | Twin stops: the same distance from the water on the other side |

<!-- end generated -->

**Starts as:** tap the stop a friend asks for on a glass lift whose zero is the water line: three up, two below the water; the lift rides there and the friend counts it out

**Grows into:** rides that cross the water, picking up friends deepest or highest first, number cards for how many stops between two friends across the water (the magnitude and both-ends mistakes as distractors), and the twin stop the same distance on the other side (landings zig-zag either side of the shaft at an even pitch, to scale); a wrong stop is a miss with the lift riding there, two misses glow the right stop, and a third sends the lift there by itself

## Design notes

*school (6–8) · after number-line and elevator-floor work on integers; [definition](../definitions/sea-lift.md).* A glass lift runs up a pier from a cliff ledge to the sea floor, with the water line as stop zero and stops from −5 to 5; landings zig-zag either side of the shaft at an even pitch, to scale, so every stop is on one screen. A friend's request shows on a fixed card left of the shaft (an arrow and one dot per stop). She taps the landing she thinks it names and the lift rides there, ticking each stop and splashing as it passes the water, and the friend counts it out ("two below the water"; speech never says minus or negative). A round is five rides (level 3: three pick-up cases) and earns one sticker, with or without help. The first round of each level in a session is authored; the demonstration always opens on it, shortened to two rides or one case. Nothing is saved or filed in the journal.

Levels (school only, 1–5): 1 *Up or down?* five requests from the dock, n stops above or below the water; 2 *Through the water* five rides that cross zero, the request naming only a count and a direction; 3 *Deepest first* three pick-up cases, deepest or highest first with at least two friends below the water, picked up by tapping the landing (or the friend, which counts as that landing); the friend card or the car replays the request; 4 *How far?* two friends at two stops, usually on opposite sides of the water (at most one case a round with both below, never first), the first-named friend riding in the lift and the other waiting on its landing; three number cards in a column below a shortened request card (the answer |a−b|, the magnitude mistake with the numerals subtracted across the water or added on one side, and the both-ends mistake, answer + 1), five cases a round with no two consecutive equal answers; 5 *Twin stops* a friend rides at stop s and asks for its twin at −s, one friend a round waiting at the dock as its own twin (never first), at least two above and two below with four different distances; the twin appears on its landing once found (a land friend in a diving bubble below the water, a sea friend in a little water bowl above it). Skills include distance and opposites.

Misses and hints: one miss per distinct wrong stop per request; the lift rides there and the friend counts it out, then it returns. Two misses glow the right stop (one hint, once per request; "Show a hint" in the pause sheet does the same); a third distinct wrong stop sends the lift there by itself, a supported finish. Level 4: a wrong card is one miss (the lift rides it out, the friend counts it in two parts, "three stops to the water, and four more", or the plain count on one side, then the lift returns and the card dims); two misses glow the right card (one hint; Show a hint does the same); only the right card is left, so no supported finish is needed; landing taps, the friend or car and the request card are free. Level 5: a wrong stop is one miss (the lift rides there, two brackets from the water show the friend's distance and the tapped one, and the friend says both), two misses glow the twin's landing with two equal brackets (one hint), and a third wrong stop rides there itself (supported finish); the friend's own stop is free ("I'm here already"). Never a miss: the stop the lift is already at, an empty landing, a picked-up friend at level 3, and replays. The pause sheet offers Start again and Show a hint. Touch only; no couch play.

**A right stop never holds the next friend (U7 fix batch 3, 2026-11-11).** The friend's thanks (`sealift.at`, `sealift.howfar.right`, `sealift.twin.right`) starts, the fade follows a 0.35 s hop beat rather than the line, and the next friend's ask follows (after level 1's glide back to the water) and cuts the thanks. `sealift.aboard` plays over the hop, the 0.6 s wait and the ride up. On the last friend each line is heard out before `sealift.done`. The miss lines stay held.
