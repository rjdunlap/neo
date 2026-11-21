# Lift It

<!-- generated: from src/games/lift-it; edit the text below the end mark (npm run game-docs) -->

**ID:** `lift-it` · **Land:** Rainbow Meadow · **Ages:** toddler–school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** cause-and-effect, simple-machines, force-and-distance, prediction, numbers

| Band | Levels, easiest first |
| --- | --- |
| toddler | 10 |
| preschool | 1–2 |
| pre-K | 2–4 |
| school | 3, 4, 9, 5, 6, 7, 8 |

| Level | Plays like |
| --- | --- |
| 1 | Pull! |
| 2 | Push or pull |
| 3 | Too heavy |
| 4 | Twice the rope |
| 5 | Who pulls? |
| 6 | By the numbers |
| 7 | Three ropes |
| 8 | Three ropes by the numbers |
| 9 | How many paws? |
| 10 | One big pull |

<!-- end generated -->

**Starts as:** one big pull: the rope is already over the branch wheel, one stone waits for one friend on a 1-rung ledge, and a single 120-unit downward stroke lands the parcel (toddler); at preschool, drag the rope's end in strokes to haul a crate up to a friend on the tree's ledge; a crate that is held never slides back

**Grows into:** counted strokes up taller ledges, wheels hung on the branch hook or the crate's hook (push, fixed, movable, both), why two strands halve the paws and double the knots, who pulls from the ground or the ledge, then moving the knot for three supporting strands and counting paws and knots; every round has one of four looks (meadow, spring, autumn, evening) and a parcel (apples, kite, cake light; pumpkin, books, teapot heavy) matched to the stones, with eight friend kinds

## Design notes

**Level 10, One big pull (toddler entry, 2026-11-20).** Plan id 10: the level 1 tree with a prebuilt fixed rope, a 1-rung ledge, one stone and one ground friend, no tray. One downward stroke of 120 units lands the parcel; a shorter pull raises it part way and the crate stays there for the next. Nothing is a miss. Show a hint sends the pet's paw to pull and counts one hint. `LEVELS.toddler` is 10 to 10 with `entryLevels` [10]; the line is `lift-it.instruct-one-pull`. A rule test asserts one stroke always suffices and nothing else is on offer.

The first six levels come from the [original definition](../definitions/lift-it.md). Drag from the rope handle to raise the crate in strokes. A held crate stays at its height between pulls. Hang a wheel on the branch to change the pull direction or a wheel on the crate to share the load between two strands. With both wheels hung in levels 7–8, tap the crate ring to move the tied end between branch and crate. Tying to the crate makes three supporting strands and moves the pull to the ledge. The ideal rule uses paws = ceil(stones / strands) and knots = rungs × strands. [Deep dive](../deep-dives/lift-it.md#the-game-today).

Level 4 invites a free guess at the knot count. Level 9 asks for paws before the tug. Level 5 names the pullers, and level 6 adds both number cards. In level 7 the first crate needs two paws and six knots on the three-strand rig. Level 8 asks who pulls and which exact paws and knots cards match the rig. Every working arrangement that reaches the requested friends is accepted.

A rig that cannot lift stretches and wobbles. The first tug on each unsuitable rig counts as a miss in levels 5–8, and moving the tied end is free. A wrong number card counts as a miss and lights the answer. After two misses the pet can glow the right hooks, ring or card, with one counted hint per parcel. In levels 1–2, Show a hint puts the pet's paw on the handle for a helping stroke.

From level 3, the round arrow replays the previous delivery with its own wheels and tie position while the pet counts the knots aloud. It restores the current parcel and rig afterward and leaves misses, hints and rewards alone. Each completed round earns one sticker. In co-play, one player hangs the wheels or moves the knot while the other pulls. Away from the screen, look for a pulley on a flagpole or crane and notice which way the rope and load move.

**A guess card never holds the pull (U7 fix batch 15, 2026-11-12).** At level 4 a card's `lift-it.guess-heard` starts with the cards cleared and the handle free; `now-pull` is said when the echo ends or by the guide, and dropped once she has grabbed the handle.

**What the guide repeats.** Who wants to pull (levels 5, 6 and 8) is an instruction (`ctx.instruct`) that follows the level's instruction on the first parcel, rather than cutting it off; the card questions at level 4, the guess's echo ("{n} knots? Pull and count!") and "now pull" after an answered card are instructions too. At levels 4 and 9 each parcel after the first says the level's instruction again. The waiting "now pull" behind the echo and on Show a hint, the reasons, counts and replay narration stay `say`.

**Upright on a phone (2026-11-19).** `liftLayout` in `logic.ts` stretches the rungs up a tall phone (cap 330 units, stopping so the top rung's ledge handle clears the top-right button); the knot-moving level 9 sits at x 300 upright with its ground friends right of the crate (left they were under the guide and the waiting friend was drawn past the 768 edge); the knot counter sits below the Home and help column; the autotouch bot's downward stroke stops short of the view bottom. `upright.test.ts` covers every level and six upright views (targets, friends, counter, cards). Sideways is unchanged.
