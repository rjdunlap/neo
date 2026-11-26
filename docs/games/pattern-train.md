# Pattern Train

<!-- generated: from src/games/pattern-train; edit the text below the end mark (npm run game-docs) -->

**ID:** `pattern-train` · **Land:** Puzzle Peaks · **Ages:** preschool–school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** patterns, sequencing, listening

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–6 |
| pre-K | 3–9 |
| school | 8–19 |

| Level | Plays like |
| --- | --- |
| 1 | AB: alternate two shapes |
| 2 | AAB: two of one, then another |
| 3 | ABB: one, then two of another |
| 4 | ABC: repeat three shapes |
| 5 | Continue a pattern of animals |
| 6 | Find the missing car in the middle |
| 7 | Listen and continue two bell notes |
| 8 | Listen and continue three bell notes |
| 9 | Fill two cars in an AAB pattern |
| 10 | Count the cars in the tunnel |
| 11 | Color and shape on their own cycles |
| 12 | Count numbered cars by 2, 5, or 10 |
| 13 | Find the car that does not belong |
| 14 | Find the wrong car and fix the train |
| 15 | Find the row with the same pattern in new pieces |
| 16 | Build the same pattern in new pieces |
| 17 | Make your own pattern and watch it go round |
| 18 | Stairs: stacks that grow by one |
| 19 | Up and down: stacks that step by one or two |

<!-- end generated -->

**Starts as:** AB patterns

**Grows into:** AAB, ABB, ABC, animals, missing cars, bells, two gaps, a tunnel of hidden cars, color and shape on their own cycles, counting by 2, 5 or 10, the car that does not belong, fixing a swapped car, the same pattern in new pieces (pick the row, build it), a pattern she makes herself, and stacks of counters that grow by one

## Design notes

On a phone held upright, levels 8–19 play (`uprightLevels`; the preschool and pre-K levels below 8 do not yet). Level 10's tunnel arch is a 100-unit target (`TUNNEL_SIZE` in `logic.ts`), wide in every view; tapping it says the hidden-car count again.

Level 18 (Stairs) is a counter-stack train: four cars hold one more counter each (starting at 1 to 4), drawn as a five-frame (two rows of five rings, filled row one first) so a stack is seen, not only counted; she taps which of three stacks goes in the glowing car (the answer, the same as the last car, and one too many, in a shuffled order; nine counters at most). Tapping a car says its count, and after two misses the train counts each car aloud. It is school only for now.

Level 19 (Up and down) reuses the stack car and lets the step be one or two, up or down (stacks 1 to 10, so the five-frame's two full rows): the four cars show the step and she taps the stack for the glowing car among the answer, the step the other way and one off the answer. Its spoken reason says the step ("two fewer each time: 9, 7, 5, 3, 1!"); the first descending pattern in the game. The ladder now ends at 19; level 20 (Start anywhere) is next.

Advances from AB through AAB/ABB and ABC, animal patterns, missing middle cars, bell patterns, and two-car gaps. The three school follow-ons ask for the car that comes out of a tunnel of hidden cars, then follow color and shape on their own cycles (the color alternates while the shape holds for two cars, so the pair repeats every four; four choices are every mix of the two colors and two shapes, and a wrong pick says whether the color or the shape was right), then count numbered cars by 2, 5 or 10. Two spot-the-mistake levels follow: 13 (an extra car has crept into an AB train; tap it and it hops off) and 14 (one car of a nine-car ABC train shows a wrong piece; tap it, then choose the piece that belongs). Two levels then ask about structure rather than the next car: 15 (a model train of shapes on top and three rows of animals below; tap the row that repeats the same way, the other rows repeat other units) and 16 (build it: fill an empty train from a tray of three animals so cars that match on top match below and cars that differ differ; any animals that keep that structure are right, and each placed car lights its partners on the model). Tapping a car that fits is a gentle miss with a reason, and two misses glow the wrong car and read the train; on level 14 the tap and the choice are each their own question. Bell choices can be auditioned before confirming; tapping a shown car is always free exploration. A train shows two full repeats and then runs on part of the way into the next, so the empty car can be any place in the repeat (not always a copy of the first car); level 6's gap sits in either repeat. Numbered trains start off the step (such as 14, 16, 18…), may hide a middle car, and offer the answer among near misses (a step back, a step on, one off) in a shuffled order. Each shape round is made of shapes, fruit or flowers, and each animal round of one of four animal trios; a tapped animal car makes its own voice. After two misses the right choice glows and the train reads itself (each car lights and sounds in turn, then the repeating unit hops once). Level 11 draws two of five colors and two of three shapes each round, and its empty car is anywhere after the first. Level 10 shows two repeats, then a tunnel with a dot for each of 4 to 7 hidden cars (tap it to hear the count); she keeps the pattern going through them and picks the car that comes out, and after two misses the hidden cars roll through one by one.

**Says why at the end (2026-11-21).** The answer that ends a round at levels 1–14 is followed by one spoken line of the rule: the unit once, the bells by pitch, a numbered train's step, both cycles of a color-and-shape train, or the extra car named and the train without it (`patternSaid` in `logic.ts`). Levels 15–16 do not. The lines have slots, so they use device speech.
