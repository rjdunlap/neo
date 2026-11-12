# Vine Snip

<!-- generated: from src/games/vine-snip; edit the text below the end mark (npm run game-docs) -->

**ID:** `vine-snip` · **Land:** Tinker Lab · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, patterns-of-motion, prediction, planning

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 1–3 |
| pre-K | 2–4 |
| school | 3–5 |

| Level | Plays like |
| --- | --- |
| 1 | Snip! |
| 2 | Two vines |
| 3 | Wait for the swing |
| 4 | Which vine stays? |
| 5 | Two friends |

<!-- end generated -->

**Starts as:** tap a vine and the fruit falls or swings into a friend's mouth

**Grows into:** level 1 a tap anywhere snips the one vine; level 2 two vines (the first snip swings the fruit, the second lets it drop, and the friend scoots so every drop is caught); level 3 one vine already swinging, snip as it swings toward the friend; a missed drop is one miss, floats back and grows back, two misses on a line glow the dotted arc with golden stretches (one hint), Show a hint in the pause sheet is one hint per request, Grow back is free; level 4 *Which vine stays?* shows one fruit on two or three vines and you snip the others, keeping the one that swings it to the friend; level 5 *Two friends* has two fruits on two vines each, a friend for each; a keep that could never feed the friend is a miss (spoken as the wrong side, or that a straight-above vine drops straight down), two misses glow the vine to keep and the vines to snip, and Grow back regrows every uneaten fruit free; in Tinker Lab

## Design notes

*Levels 1–5 built · after Cut the Rope's cut-so-it-falls idea; [definition](../definitions/vine-snip.md).* Fruit hangs from vines on a leafy branch and a hungry friend waits below. A tap snips a vine (a touch-down within 70 units of a live vine snips at once) and the fruit drops or swings into the friend's mouth with a munch and a pentatonic note. Motion is a closed-form model in `logic.ts` (toy gravity 1600 units/s², a small-swing pendulum, a falling arc, a 200-unit-wide catch band), with no physics engine.

Levels (lap 1, toddler 1–2, preschool 1–3, pre-K 2–4, school 3–5): 1 *Snip!*: a tap anywhere snips the one vine and the fruit drops to the friend. 2 *Two vines*: the first snip swings the fruit, the second lets it drop, and the friend scoots so every drop is caught. 3 *Wait for the swing*: one vine is already swinging; snip as the fruit swings toward the friend. The generator places the friend to maximise the catch window (about 0.44 s, at least 0.433 over 500 seeds) so that a top-of-swing snip feeds, while the start turnaround and both bottom crossings miss. 4 *Which vine stays?*: one fruit hangs on two or three vines (the first line is a lemon on left, straight-above and right vines with the friend on the right); snip the others and keep the one whose swing feeds the friend. The friend's side is right on line 1, left on line 2, seeded on line 3; exactly one keep has a catch window of at least 0.4 s (the authored line's is 0.417 s). 5 *Two friends*: two lines of two fruits on two vines each, a friend for each (Dog left, Cat right on the first); each fruit keeps its own side's vine, no landing of either fruit can reach the other friend, and the fruits' swings never meet. The inner vines are nearly upright, so keeping them barely swings the fruit, and the fruits hang at different heights.

Misses and hints: levels 1–2 have none. From level 3 a missed drop is one miss; the fruit floats back and the vine grows back. Two misses on a line glow the dotted arc with golden stretches (one hint); Show a hint in the pause sheet is one hint per request. Grow back is free and never counts. At levels 4–5 a keep that could never feed the friend is a miss, spoken as `wrong-side`, or as `straight` when the still straight-above vine was kept; two misses (or a requested hint) glow the vine to keep yellow and the vines to snip orange, then the golden arc, and a hint on a wrong keep regrows that fruit first. Grow back regrows every uneaten fruit. Snipping waits while any fruit falls, is eaten or floats back. The ghost finger taps the vines to snip, then times the kept vine.

Deviations from the definition: levels 4–5 space vines 100 units apart (at 0.15 and 0.3 of the way down) instead of 140, which cannot fit three vines or two two-vine fruits on the 720-wide board with both swings on screen (level 2 keeps 140); the timing fairness at 4–5 is the top on the friend's side feeds and the start misses (level 3's straight-below rule is dropped); the bot taps rather than swipes the vines to snip; early and late are judged by timing within the beat, not by landing side; the friend's eyes follow the finger (the Critter gaze), not the fruit. One voice clip is rendered (`game.vine-snip`). In Tinker Lab; the new `vinesnip` browser suite covers it.

**The first fruit's munch never holds the other (U7 fix batch 26, 2026-11-12).** Level 5 (two fruits a line): the line's first fed fruit is marked `fed` as its `vine-snip.munch` starts, with `busy` never set, so the other fruit can be snipped at once (its own munch cuts the first line if it lands sooner). The line's last fed fruit's munch is still heard out before the next line or `vine-snip.done`.
