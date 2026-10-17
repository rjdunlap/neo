# Fruit Slice, levels 1–8 (definition)

Defined 2026-10-17 for [chunk 25](../ROADMAP.md#chunks) (dexterity: slice, cut and draw), from the [IDEAS candidate](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default that the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md). The halves-and-quarters levels from the IDEAS row are **not** part of this ladder: they wait on the fractions study (see [Later slice](#later-slice-fractions-not-in-this-build)).

**Fun action and purpose:** big fruit is tossed up slowly from a basket and hangs near the top of its arc; she swipes across it and it splits apart with a juicy pop, a spray of drops and a rising pentatonic note. The motor goal is the **crossing stroke**: a controlled finger movement through a moving target, the step before Cut Along's guided line and Letter Trails' strokes. The thinking goal grows with the ladder: **choose which ones** (one kind of fruit, then fruit and not other things), then **how many** (stop at the number on the sign and send the basket), then **which straight line** goes through exactly that many hanging fruit, and finally **pieces by twos**. Levels get harder by adding choices, never by adding speed, more fruit in the air or a shorter hang.

**Physics:** none from an engine. Each toss is a closed-form arc in `logic.ts` (`arcAt(toss, t)`: a parabola with a slowed apex), with no `ball.ts` and no solver, so the chunk's open physics-approach decision (Vine Snip, Block Topple) does not gate this game.

## References

| Reference | What it shows | What Fruit Slice takes or rejects |
| --- | --- | --- |
| Halfbrick's *Fruit Ninja* ([App Store listing](https://apps.apple.com/app/403858572), rated 4+ with in-app purchases; [Common Sense Media review](https://www.commonsensemedia.org/app-reviews/fruit-ninja), rated 7+, which notes no bombs in Zen mode) | Fruit lofts into view and a swipe slices it with a trail; Classic ends when bombs are hit or fruit is dropped, and Zen has no bombs but a 90-second clock ([fan description](https://www.chess.com/blog/AaronChu1/fruit-ninja-zen-mode); not checked in the app) | Takes the lofted arc, the swipe trail and the juicy split. Rejects bombs, dropped-fruit strikes, the round clock, combos for score, speed-ups and purchases. A missed fruit drifts back into the basket and is tossed again |
| Halfbrick and Krome's *Fruit Ninja Academy: Math Master* ([press release](https://halfbrick.com/press/halfbrick-launches-fruit-ninja-academy-math-master/), 2015, ages 5–7) | Slicing as the way to answer Grade 1 maths (numbers, skip counting, sequences) | Supports slicing as an answer gesture for school-age counting. Fruit Slice keeps the answer to *which* and *how many*, and leaves sums to Fruit Sums. Its unlock-for-performance rewards are not copied |
| Toca Boca's *Toca Kitchen 2* ([parent page](https://tocaboca.com/for-parents/toca-kitchen-2-ios)) | The cutting board "slices the food items by swiping them"; the designer's note says part of the fun is "how it sounds when you slice it"; tools in any order | Takes the sound as a main reward: every slice has a note and a pop. Free, rule-less slicing stays at levels 1–2 |
| Aziz et al., *Selection of touch gestures for children's applications* (2013 conference paper and 2014 repeat, [Loughborough repository](https://repository.lboro.ac.uk/articles/journal_contribution/Selection_of_touch_gestures_for_children_s_applications_repeated_experiment_to_increase_reliability/9402956); only a search summary of the abstracts was read, the pages returned 403) | Tap and drag/slide are the basic gestures; many two-year-olds struggled with drag-and-drop, some three-year-olds with two of the seven gestures, and four-year-olds managed all seven | A tap slices at level 1, so a two-year-old succeeds before she can swipe. The swipe becomes the required gesture only at level 2, and no level asks her to hold and carry a fruit |
| [Bubble Pop](../GAMES.md#bubble-pop) and [Egg Catch](../GAMES.md#egg-catch) (this repository) | Slow rising targets that never punish a miss; a moving target with no clock deciding | Copies the no-loss pacing and the "it comes back" rule; see Overlap for where it differs |

## Overlap

- **Bubble Pop** already does slow rising targets for lap–school with one-color, number-order and counting modes. Level 1 here (a tap slices) is close to it, which is why this ladder **starts at toddler, not lap** (decision 1): the difference that matters is the swipe, which arrives at level 2. The kinds-and-counting levels differ from Bubble Pop's by the stop-and-send decision (levels 5–6) and the straight line (7), neither of which Bubble Pop has.
- **Fruit Sums** owns adding numbered fruit; **Monster Munch** and **Little Helpers** own feeding and helper counts; **Pet Kitchen** owns cutting into equal shares (halves, quarters, thirds). Level 8 counts pieces by twos and never names a half.
- **Cut Along** (next in this chunk) owns following a drawn line; level 7 here chooses a line, it does not follow one. **Lasso Loops** owns drawn loops around groups.

## The model

- **A toss** is `{ kind, x0, apexX, apexY, launchAt }`. `arcAt(toss, t)` returns the position: it rises over 1.0 s, **hangs within 40 units of its apex for at least 1.6 s** (a slowed parabola), then sinks back into the basket over 1.2 s. Apexes sit in the band from 25 % to 55 % of `view.h`, inside `view`, clear of the home button (top-left), the sign (top-right) and the pet's corner. A fruit that is not sliced lands back in the basket with a soft plop and is tossed again later. Nothing is lost or counted.
- **Aloft at once:** one at level 1, two at level 2, three from level 3 (enough for a choice), never more. Launches are spaced so no two apexes are within 180 units.
- **Kinds** are `prop()` kinds from `src/art/props.ts` (apple, orange, lemon, pear, blueberries, grapes, and balloon and flower as not-fruit), drawn 110 units across with distinct silhouettes, so color is never the only cue. The hit radius is 75 (drawn radius plus 20).
- **A stroke** is one touch from down to lift. The slice test is **swept**: each pair of consecutive pointer samples is a segment, tested against each fruit's circle at that frame (`sliceHits(a, b, fruits)` with `distToSegment`, as in Duckling Parade's logic), so a quick swipe cannot skip a fruit between frames. A fruit is cut at most once per stroke.
- **A slice needs movement** from level 2: the stroke has to travel at least 30 units through the circle. A touch-down that stays still on a fruit makes it wobble with a giggle and the pet says "Swipe across it!"; that is never a miss. At level 1 a tap (touch-down inside the circle) slices.
- **No grabbing:** a fruit never follows the finger. A stroke that starts on a fruit and keeps going slices it.

`logic.ts` holds plain functions: `planFor(level)`, `tossesFor(plan, rng, view)`, `arcAt`, `sliceHits`, `lineHits(a, b, fruits)` (level 7), `boardsFor(plan, rng, view)` (level 7–8 hanging boards), `judge(state, kinds)` (which cut fruit count, which bounce, and whether the stroke is a miss) and `hintTarget(state)`.

## Screen and controls

- **Full-screen slice layer** with custom pointer handling, added last, with a `hitArea` over the play area only (not the home button, sign or basket). It ignores input while `palmOnGlass()`; it ends the stroke on `pointerup`, `pointercancel`, `pointerupoutside` and a lost release (no pointer events for 0.5 s after the finger left the canvas), and clears its trail on resize and `destroy()`.
- **Trail from touch-down:** a soft sparkle ribbon, never a knife or blade. It fades over 0.3 s.
- **A slice:** the fruit splits into two halves along the stroke's direction, which tumble into the bowl at the bottom; juice drops from `ctx.particles`; the note steps up the pentatonic scale (`src/audio/notes.ts`) with each slice in the round.
- **A refused cut** (wrong kind, a not-fruit, a basket already full): the item bounces aside whole with a gentle boing and its spoken reason, then drifts back into the basket.
- **The sign** (top-right, levels 3–8) pictures what to slice: one fruit kind, a "fruit" sign (an apple, pear and grapes together), dots plus a numeral for a count, or a two-row sign for two kinds. It is at least 120 units, and tapping it repeats the instruction.
- **The send button** (levels 5, 6, 8): the bowl at the bottom right of the tossing basket (the pet keeps the bottom-left), at least 140 units across. When the sign's count is met, the bowl gets a lid and a glow and the pet says "That's 4! Tap the bowl to send it." Tossing continues, so stopping is her decision.
- **Speech:** `ctx.instruct` gives each instruction and the corner pet repeats it. Navigation never needs reading.
- **Music:** the land's calm style keeps playing quietly under the slice notes (decision 4), not `silenced`, since she is not composing.

## Levels

| ID | Name (`describeLevel`) | What she decides | Aloft | Round |
| --- | --- | --- | --- | --- |
| 1 | Touch the fruit | Nothing to choose: any touch slices | 1 | 6 slices |
| 2 | Swipe across | Move the finger through the fruit | 2 | 8 slices |
| 3 | Only the apples | One kind among others | 3 | 6 of the kind |
| 4 | Only fruit | Fruit, not balloons and flowers | 3 | 6 fruit |
| 5 | Just enough | Stop at the number (3–6), then send | 3 | 3 signs |
| 6 | Two kinds, two numbers | Count two kinds at once (each 1–4) | 3 | 3 signs |
| 7 | One straight swipe | Pick a line through exactly N (2–4) still fruit | still board | 4 boards |
| 8 | Pieces by twos | Every fruit makes 2 pieces; reach the sign (6–12) | 3, or a still board | 3 signs |

**Bands (`BandLevels`):** `toddler: { min: 1, max: 2 }`, `preschool: { min: 2, max: 4 }`, `prek: { min: 3, max: 6 }`, `school: { min: 5, max: 8 }`. No `order`, and no lap or grown-up levels (decision 1).

### First rounds

- **Level 1:** one apple rises from the basket and hangs. "Touch the fruit!" A tap or a swipe splits it. Six slices and the bowl is full. Kinds cycle through the six fruit.
- **Level 2:** two fruit at a time. "Swipe across the fruit!" A still tap makes it wobble; the pet says "Swipe across it!" and a drawn arrow sweeps across that fruit once (the first time in a round; a drawing, not the ghost finger, which only plays on the how-to card). Eight slices.
- **Level 3:** the sign shows one kind, chosen from the six by seed. Three aloft, at least one of them the kind and at least one not. "Slice only the apples." Six apples.
- **Level 4:** the sign shows the fruit group; balloons and flowers are tossed with the fruit (one of three aloft at most). "Slice the fruit. Leave the balloons and flowers." Six fruit.
- **Level 5:** the sign shows 3 (dots and a numeral), any kind. The bowl counts each slice aloud ("one, two, three") and lids at 3; she taps it to send it to the host. Then 4, then 5 or 6.
- **Level 6:** a two-row sign, e.g. 2 apples and 3 pears; each row ticks down separately. Other kinds bounce. Three signs.
- **Level 7:** four to six fruit hang still (a bob of at most 6 units) on a seeded board. The sign shows 3. Touching down starts a straight line from that point that follows her finger; lifting cuts every fruit the line crosses. Lifting within 40 units of the start cancels for free. First board N = 2, then 3, 3, 4.
- **Level 8:** each slice drops two pieces into the bowl, and the bowl counts them by twos ("two, four, six"). Signs of 6, 8 and 10 or 12. On the last sign the fruit hangs still in pairs and she cuts with level 7's straight-line tool (a free swipe could curve through every pair), so one line through two gives four pieces.

## Accounting, help and finishing

- **Never a miss:** any stroke that cuts nothing, including a level 7 or 8 line that crosses no fruit; a still tap; a cancelled line; fruit that falls back; repeating the instruction; tapping the bowl before it is full (the pet says how many more). **Levels 1–2 have no misses at all.**
- **A miss** is one refused cut: the wrong kind (3, 6), a not-fruit (4), a cut after the bowl is full or a kind's row is done (5, 6, 8), or a level 7 line through a number other than N. One stroke counts **at most one miss**, and in a stroke that cuts both a right and a wrong fruit the right ones still count. **A stroke that crosses more than the sign still needs** (5, 6, 8) cuts fruit in the order the stroke reached them (for a line, from its start) until the sign is met; the rest bounce, and that is one miss. A level 8 cut that would pass the sign is refused the same way.
- **Level 7 line feedback:** a wrong line flashes, the crossed fruit wobble and stay whole, and the pet says what it crossed: "That line went through 2. Find a line through 3."
- **The two-miss glow:** at the second miss on a sign or board, and every second miss after that, `hintTarget` glows: the next right fruit aloft (3–6, 8), the bowl when it is full, or a faint dashed solution line (7). Each glow is `hints++` once and lasts until her next cut.
- **Finish:** when the round's slices, signs or boards are done, the bowl of fruit goes to the land's host, who has a snack (decoration only). Then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. Nothing is saved or filed.
- **Adaptation** follows the unchanged shell rule; levels 1–2 can produce neither misses nor hints, so a toddler steps up by finishing.

## Rule tests (`logic.test.ts`)

- **Arcs:** for every plan and the four standard views, every toss's whole path is inside `view`, apexes avoid the home button, sign and pet corner, no two simultaneous apexes are within 180 units, and the hang (within 40 units of the apex) lasts at least 1.6 s. **The hang is longer than the bot's stroke:** the ghost travels to its start point beside the apex during the rise and waits there (`when`), so only the press and the carry through the fruit (`GhostFinger`'s carry speed, 420 units/s, about 0.6 s for 240 units) must fit inside the 1.6 s hang; the test computes that from `ghost.ts`'s constants rather than a fixed number.
- **Swept hits:** a fast stroke whose sample points both lie outside a fruit but whose segment crosses it is a hit; a segment passing 76 units from the center is not; a fruit is cut once per stroke.
- **Movement rule:** at level 1 a still touch inside the circle slices; from level 2 a stroke with under 30 units of travel inside the circle does not.
- **Judging:** wrong kind, not-fruit, full bowl and done row are refused; a mixed stroke counts the right fruit and exactly one miss; a stroke crossing more than needed cuts in stroke order up to the sign, refuses the rest and counts one miss; a line through no fruit is free; levels 1–2 never return a miss.
- **Choice exists:** at levels 3–6 every set of fruit aloft that has a wrong item also has a right one within the next two tosses, and the right kind keeps coming until the sign is met (no round can stall).
- **Level 7 boards:** for each board, `lineHits` finds at least one straight line, at least 150 units long with both ends inside `view`, crossing exactly N fruit; the board also has lines crossing N − 1 and N + 1, so which line she picks matters; the dashed hint line crosses exactly N. Same seed, same board.
- **Level 8:** each sign is even and reachable; the paired board has a line through two.
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true` and `autotouch()` return a `trace` intent with `receiver` set to the slice layer. It picks a right fruit as it rises, travels to a start point 120 units to one side of its apex, waits with `when` until the fruit enters its hang, then traces through the apex to 120 units beyond (the fruit moves under 40 units meanwhile, inside the hit radius). At 5, 6 and 8 it taps the bowl when lidded. At 7 and on level 8's still board it traces the solution line from end to end. It never demonstrates a wrong cut. The bot is the scripted play's solver.
- **How-to card** (`src/content/howto.ts`). Goal: "Slice the fruit as it floats up." Steps: "Touch the fruit to slice it" `{ from: 1, to: 1 }`; "Swipe a finger across the fruit" `{ from: 2, to: 6 }` and `{ from: 8, to: 8 }`; "The sign shows which ones to slice" `{ from: 3, to: 6 }`; "When the bowl has enough, tap it to send it" `{ from: 5, to: 6 }` and `{ from: 8, to: 8 }`; "Draw one straight line: it cuts every fruit it crosses" `{ from: 7, to: 7 }`; "Each fruit makes two pieces; on the last sign, draw a straight line through two" `{ from: 8, to: 8 }`. Finish: "The bowl is full." Note: "Fruit that falls just comes back. Nothing is timed." Plus a `LevelLine` from 3 to 8: "Slicing something the sign does not ask for is counted for her level."
- **Voice lines** under `slice.*`: `intro`, `instruct.touch`, `instruct.swipe`, `instruct.only.<kind>` (one per fruit, so device speech never fills a template), `instruct.fruit`, `instruct.enough`, `instruct.two`, `instruct.line`, `instruct.pieces`, `swipe-across`, `not-kind.<kind>`, `not-fruit.balloon`, `not-fruit.flower`, `full`, `send`, `more.<n>`, `line-count.<n>` with `line-want.<n>`, and `done`. Counting uses the existing number lines.
- **Registration:** ID `fruit-slice`, name "Fruit Slice", spoken title `game.fruit-slice`, region (subject) `bubble-beach`, home land **Bubble Beach** (4 games today, 5 with this one and 6 if Domino Run lands there too). Skills `['fine-motor', 'sorting', 'counting', 'spatial-reasoning']`. Hub icon: an apple split in two with drops. The sticker is a seeded sliced fruit.
- **Co-play:** one person names the fruit to slice, the other slices it. **Off-screen:** cut a banana or soft fruit with a child-safe knife at snack time and count the pieces.
- **Couch:** none. The swipe is the point, and couch play takes no touches. It is not a candidate for the couch catalog.
- **Rework couplings:** none required. A bowl of sliced fruit is a natural thing to share in the [welcome adventure](../rework/README.md#learning-belongs-in-the-story) ("share food"), but this slice saves and unlocks nothing; any such use is the rework's to define.

## Later slice: fractions, not in this build

The IDEAS row's school idea (the swipe direction makes halves, a second cut makes quarters, then summing the pieces) overlaps Pet Kitchen's equal shares and the fractions subject study in open PR #480. It waits until that study lands and says whether a slicing fraction rung belongs here, in Pet Kitchen, or nowhere (decision 3). Nothing in levels 1–8 names a half or a quarter.

## Check tier

New-game tier, with a new interaction (the swept slice and the straight line). Run typecheck and unit tests (the rule properties above, plus registry, lands and how-to). Then make one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8, with one wrong-kind cut at level 3 and one glow, and one level 7 board solved by the bot. Take one portrait screenshot at level 7, run `fingerdemo` at levels 2 and 7, and run `npm run build`, since registry, lands, voice and how-to files change. Device checks stay open: whether a toddler's swipe registers on an iPad (palm and wrist contact), whether 1.6 s of hang feels calm or slow, and whether the straight line reads to a six-year-old.

## Open decisions

Each has a default that the build uses. None blocks it.

1. **Lap entry.** Default: none; toddler 1–2 first, because a lap-level tap-to-slice is Bubble Pop with fruit. The alternative is lap level 1 alone, if the developer wants a fruit version for her now.
2. **Home land.** Default: Bubble Beach (senses and feel; 5 games, or 6 with Domino Run). The alternative is Counting Cove, which would reach 12 games.
3. **Fractions rung.** Default: none in this game until the fractions study (#480) lands; see the later slice.
4. **Music.** Default: the land's calm style plays under the slice notes. The alternative is `silenced(STYLES.quiet)`, letting the rising notes be the only music (and adding it to the registry test's list).
5. **Level 7's line.** Default: a straight line from touch-down that follows the finger and cuts on lift, cancel by lifting near the start. The alternative is a free swipe with a cap of one stroke, which a curved path makes trivial.
