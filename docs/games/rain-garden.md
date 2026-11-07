# Rain Garden

<!-- generated: from src/games/rain-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `rain-garden` · **Land:** Tinker Lab · **Ages:** toddler–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** observation, comparing, fair-test, water

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–2 |
| pre-K | 2–3 |
| school | 3–4 |

| Level | Plays like |
| --- | --- |
| 1 | Rain on the garden: tap the cloud and watch where four drops go |
| 2 | Two gardens, same rain: pick stone or soil for each, then rain on both |
| 3 | Change it and try again: the first rain is kept on a card to compare |
| 4 | Two beds downhill: change the ground so the leaf bed gets two drops and the pond some |

<!-- end generated -->

**Starts as:** toddler–school

**Grows into:** tap a cloud over a little garden and watch the four drops soak into the ground or roll down into a pond; change the ground and rain again to compare

## Design notes

*Levels 1–3 · after the weather and water study; [definition](../definitions/rain-garden.md).* A fat cloud hangs over a little garden on a slope. She taps it and four drops fall one at a time: on soil two tuck into the ground and two roll down the arrow into a pond where a friend (frog, duck or turtle) hops and sounds; on stone all four roll. Then she changes the ground and rains again. The action is comparing what happens under the same rain when one thing changes. A toy model: stone holds none, soil holds two, the rest runs downhill. The invented capacities say nothing about real soaking, which is slower and depends on how wet the ground already is.

Levels (toddler 1, preschool 1-2, pre-K 2-3, school 3-4): 1 "Rain on the garden": soil, rain, then rain again on fresh ground; a leaf ends the round (a tap during a shower is ignored). 2 "Two gardens, same rain": two boards side by side (also in portrait, whose logical view is 1024 wide, so no stacking), a ground tile under each, one wide cloud; flipping either tile resets both gardens, so the pair stays a fair comparison. 3 "Change it and try again": the first rain is kept on a bookmark card, the tiles are stone and soil, and the leaf waits for a rain on different ground, with a spoken comparison (including soil to stone, `rain.compare.back`). 4 "Two beds downhill" (school, its own scene `route.ts`): two beds on a terraced slope, the top bed's overflow running into the low bed and the low bed's into the pond; she taps each bed to make it stone or soil (four arrangements, the markings authored on the first board and seeded after), taps the cloud to try it, then the Check. The low bed (or, in the seeded variant, the marked bed) must store exactly two drops, shown by dashed drops on its sign, and the pond needs at least one; the Check passes only when both hold. Dry, ran past (too many for the bed) and pond-dry arrangements each get a spoken cause line (`rain.route.*`, `rain.miss.dry`, `rain.miss.pond`). Any arrangement that works counts, not one answer. Start from a failing board, with seeded friend and mirrored layout (mirrored about x=525 so the pond clears the pet; levels 1–3 keep their own layout).

Misses and hints: levels 1–3 have no misses; level 4 counts one miss per new failing arrangement at the Check (the same arrangement checked again counts nothing and flipping back to an already-judged arrangement re-checks free), and from the second miss the glow on the beds follows the arrangement and counts one hint once. Show me at level 4 flips one bed to a strictly closer arrangement (one hint) or, when the board already works, points at the Check (counted once); taps are allowed while the pet explains a miss; Start again keeps the round's misses and hints. Levels 1–3: Show me points at the next action (cloud, tile or leaf), one hint per newly pointed action. The leaf nudge "Tap the leaf when you're all done" comes after the third rain (level 1) or the second pair or comparison (levels 2-3) and counts nothing. Start again is the same board fresh, with the bookmark and trial counts cleared. Nothing is kept. Tinker Lab's 26th game; challenge `noticing`; music `STYLES.bubbles`; one title voice clip rendered.

Deviations from the definition: one generic hint line per action kind (`rain.hint.cloud`, `rain.hint.tile`); the pond friend reacts with its sound and a hop rather than a spoken `rain.friend` line; no idle-triggered demonstration (the shell's instruction repeat only); `rain.compare.back` added for soil to stone.
