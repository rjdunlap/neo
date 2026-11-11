# The toy test for lap openings (P4, the audit)

*Status: Bubble Beach's eight lap-band games are read at `origin/main` `26b91ef3`, and Music Mountain's five at `72ab89de`, both 2026-11-11. The other 44 games that list `lap` are listed by land below, not read.*

This is [P4](../POK-POK.md#p4-the-toy-test-for-lap-openings-docs-s-then-one-game-at-a-time)'s table: for each game that lists the `lap` band, five questions asked of the first level a lap player gets. It is a rule audit read from the code. It is not a claim about a child, and nothing here was played or timed.

## The five questions

1. **Touch anywhere.** Does the first touch anywhere on the screen do something she can see or hear? A big target is not "anywhere": the question is what a touch on the background does.
2. **Cannot go wrong.** Is there no wrong answer, boing, counted miss or counted hint that this level can reach? At lap there should be none.
3. **Voice off.** With speech muted, is what to do still shown? The how-to card's ghost finger counts; so does a single obvious target. A game whose first move is only named by the spoken line gets "partly".
4. **One big thing that grows.** Does it start with one big thing, with more arriving because she touched? Jelly Drums level 10, *One big jelly*, is the pattern: one enormous jelly answers a touch anywhere, and its friends wake after six touches.
5. **A silly use is answered.** Does an unexpected touch (the background, a used-up thing, a hold, a drag where a tap is meant) get a reply of its own?

A game that fails question 1 or 4 gets a line in [READY](../READY.md) for a lap level in the *One big jelly* shape, at the new-level tier. The **Voice off** column is also [P7](../POK-POK.md#p7-a-words-off-list-for-the-familys-languages-docs-s)'s words-off list.

## How it was read

- **The level.** The first level of the band's `lap` range in `logic.ts`, or the first of its `order` when it has one.
- **The reading.** That level's plan, the pointer handlers that run at it in `index.ts`, what `ctx.band === 'lap'` changes, `describeLevel`, the how-to card in `howto.ts` and the lines in `voice.ts`. Code comments were checked against the code, and two did not match (noted below).
- **What this is not.** Sizes on a real phone, how long anything takes, and whether a one-year-old finds any of it are not established.

## What the shell gives every game

Read once in `src/app/scenes/GameScene.ts`, `src/app/held-line.ts` and `src/engine/input.ts`; the rows below do not repeat it.

- **A card first.** With how-to cards on, the card and its ghost-finger demonstration open before the round, and the round waits for Play. Her first touch of the *game* therefore follows a grown-up's press. All thirteen games read so far set `touchDemo: true`.
- **The corner pet answers.** A tap on it pokes it, giggles and repeats the instruction. That is a reply to one silly use in every game, and it is not counted again under question 5.
- **A dead tap is mostly silent.** A board tap that made no sound gets a soft tick only while one of the game's lines is still pending. Otherwise the shell adds nothing.
- **A whole palm is ignored.** More than three pointers down is palm rejection, for `onTap` and for every game's own handlers that call `palmOnGlass()`. A flat-hand swat with four or more contacts does nothing in any game. *This cuts against question 1 at exactly this age and is the same in all 57 games; it is noted here once rather than failed per row.*
- **No opening line holds input** in the thirteen read so far: each starts its instruction with `void`.
- **A tap answers on touch-down.** `onTap` fires when the finger lands, so a hold, or a drag where a tap is meant, is one tap in every game that uses it. The rows say so only where a game does something more.

## Bubble Beach

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `bubble-pop` (15) | **Partly.** A full-screen catcher pops the bubble nearest the touch, but only one whose middle is on screen; the screen starts empty and bubbles rise in from below it, so the first touches after Play pop nothing and make no sound | **Yes.** Free play: every bubble is right; no miss or hint is counted | **Yes.** The ghost finger taps bubbles; the card says tap or pat anywhere | **No.** It starts empty; up to four bubbles arrive on a timer, and a pop only frees a place | **Partly.** A background touch pops the nearest bubble, and about three bubbles in ten drop a named friend; a hold or drag is one pop |
| `peg-garden` (8) | **Yes.** The whole screen, sea included: every touch rings bubbles at the finger and drops a pearl above it (a softer pop if one is already falling) | **Yes.** No miss is reachable; after two pearls that touch nothing the next is dropped over a waiting flower | **Yes.** The ghost finger and the card show it; stalled pearls are steered | **Partly.** Four huge buds stand from the start; pearls, blooms and stars come only from her touches, and nothing arrives on a timer | **Partly.** Sea and background touches drop a pearl; a bloomed flower still chimes; the buds themselves are not tappable |
| `bounce-back` (1) | **No.** Only the table answers; its left half returns silently, and its right half moves the paddle with no sound or mark at the finger | **No.** A ball past her paddle is a boing, "Whoops!" and a counted miss, and two in a row count a hint. The lap paddle drifts to the ball only while nobody touches it, so her touch is what makes a miss possible | **Partly.** The ghost finger slides the paddle; nothing on screen marks which half is hers | **No.** Table, two paddles, ball and pet are all there, and the ball is served on a timer | **No.** Left half, background and ball are ignored |
| `bumper-garden` (1) | **Yes.** The whole screen: a tap launches the waiting ladybug, and while it flies a tap swings the flipper on that side with a tick | **Yes.** Misses are counted only in the colour and order modes | **Yes.** The ghost finger taps the ladybug, which waits without limit; the only idle prompt is the spoken line again | **No.** Six flowers, two flippers, the pot and two side buttons are all there at the start | **Partly.** Any background tap launches or flips; a bloomed flower still chimes and wiggles |
| `sink-float` (1) | **No.** Only the five things in the tray answer; the tank, tray and background do nothing. A tapped thing moves at once, and its first sound is the splash | **Yes.** Misses and hints are counted only in the sorting and clay modes | **Partly.** The ghost finger taps a thing; in the round nothing glows or pulses, and the spoken line is the only prompt | **No.** Five things and an empty tank from the start | **No.** A dropped thing is ignored silently; the water is not touchable |
| `puddle-lens` (1) | **No.** One lens answers, and it is large (the middle of the screen); outside it nothing does | **Partly.** No miss is reachable, but the pause sheet's "Show a hint" counts a hint | **Yes.** One target, and the ghost finger taps it | **Partly.** One lens over one thing, and her tap swells it; the next thing then slides in on a timer, not by her touch | **No.** Taps while it swells, shrinks or slides are dropped silently |
| `melt-freeze` (1) | **No.** The sun, the snowflake and the ice cube answer (sound and pulse at once, a wiggle on the cube); the background does nothing | **Yes.** No miss or hint is counted; the "wrong" tool gets "It's already hard." with no boing | **Partly.** The ghost finger taps sun, then snowflake; in the round the two tools look alike, and a first tap on the snowflake changes nothing she can see | **No.** Cube, table and both tools from the start | **Partly.** The cube wiggles and a repeated tool gets its "already" line; after 14 seconds' rest the game presses the other tool itself |
| `tide-line` (1) | **No.** The sea answers a touch with a whoosh and foam, but at low tide the sea is a strip along the bottom; the four creatures tick and wobble; sand, dunes and sky do nothing | **Yes.** Wave mode counts nothing | **Partly.** The ghost finger drags the sea up and never shows the lap tap; the spoken line says "pull" at every band | **Partly.** One wide sea, but the four creatures stand from the start and nothing new arrives | **Partly.** A lap tap sends one whole wave, and a poked creature answers; taps during that wave are dropped silently |

### What the table says

- **Passes 1 and 4 well enough to leave alone:** `peg-garden`. Its level 8 was built for this and is the land's nearest thing to *One big jelly*.
- **Closest after it:** `bubble-pop` (a few empty seconds, then everything answers) and `bumper-garden` (everything answers, on a busy table).
- **Fails most:** `bounce-back`. It is the only one of the eight where a lap player can be wrong, and the only one where touching makes things worse than not touching.
- **Big target, not anywhere:** `puddle-lens`, `tide-line`, `sink-float`, `melt-freeze`. Each has a clear thing to touch and a background that says nothing back.

### Words-off list (P7)

Bubble Beach games whose first lap level plays with the voice off: `bubble-pop`, `peg-garden`, `bumper-garden`, `puddle-lens`. The other four need the spoken line, or a grown-up, for the first move.

### Lines this land adds to READY

Seven games fail question 1 or 4. Each line is one bounded lap level or opening, in the order they should be taken:

1. `bounce-back`: a lap level that cannot miss and answers anywhere.
2. `bubble-pop`: level 15 opens with one big bubble already on screen.
3. `sink-float`: one big thing over the water; a touch anywhere drops it.
4. `tide-line`: at lap a touch anywhere sends the wave, and the card shows the tap.
5. `melt-freeze`: one big ice cube; a touch anywhere warms it.
6. `puddle-lens`: at lap a touch anywhere swells the lens, and her touch brings the next thing.
7. `bumper-garden`: one big flower first; the rest wake as she launches.

### Found while reading (not part of the five questions)

- `bubble-pop`: `inReach`'s comment says a bubble rising in from below "counts as soon as it shows"; the code waits until its middle is half a radius on screen. The level's comment says a "flat palm" pops; four or more contacts are ignored (shell, above).
- `peg-garden`: the spoken line says to tap "on the big flowers"; the code accepts a touch anywhere, as the card says.
- `tide-line`: a lap tap while the sea is still sliding back restarts the wave from the bottom, so the sea may jump down. Read from the formula, not seen.
- `bounce-back`: whether the untouched lap paddle always reaches the ball in time is not established.

## Music Mountain

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `jelly-drums` (10) | **Yes.** A layer over the whole screen sings the awake jelly nearest across the stage, with its note, a wobble and a floating note at once | **Yes.** The wake level counts nothing | **Yes.** One jelly at nearly twice its size, and the ghost finger taps it | **Yes.** This is the pattern: one jelly alone in the middle, and the others wake at her 6th, 10th, 14th and 18th touch, never on a timer | **Partly.** Every touch sings and the front row hops; there is no idle nudge on this level, and touches during the closing run up the scale are dropped silently |
| `sound-garden` (8) | **Yes.** The whole screen but the two top corners and the pet's corner: the big friend sings on touch-down and squashes, and a new touch cuts in at once (no cooldown) | **Yes.** Play mode counts nothing | **Yes.** One friend fills the middle, and the ghost finger taps beside it | **Partly.** One big friend, and the next comes because she touched (every fourth touch); it takes the first one's place, so there is never more than one | **Partly.** The bird, frog and bell change their note from touch to touch; a touch on the friend and a touch on the grass get the same reply |
| `puppet-stage` (1) | **Partly.** The whole stage opening between the curtains, from the curtain tops to the floor: a puppet rises under the finger with a pop and says hello. The curtains and the tassel answer too. Below the floor and outside the arch nothing does, which in portrait is nearly half the screen | **Yes.** Nothing is counted on this level | **Yes.** The ghost finger touches the floor three times, then drags a puppet; the stage starts empty, and all of it answers | **Partly.** An empty stage rather than one big thing, but every puppet comes because she touched, two at most, and nothing arrives on a timer. At lap the show bows by itself after six pops | **Yes.** A puppet follows a drag; a tap on a standing puppet gets a new line, then a note; a curtain closes both with a whoosh; the tassel rings and turns day to night |
| `rhythm-neighbors` (7) | **No.** The tree answers (a knock, then a croak 0.45 s later) and the frog croaks with a ripple; the tree is the left part of the screen, and the pond, grass and sky do nothing | **Yes.** The knock level counts nothing; a frog tap is heard and not judged | **Partly.** The ghost finger knocks the tree. In the round, after six quiet seconds it is the frog that wiggles and croaks, and a tap on the frog does not move the round on; only the eight knocks do | **Partly.** A big tree and one big frog from the start; the frog answers only her knocks, and nothing new arrives | **Partly.** A frog tap croaks with a ripple; a ninth knock in the second before the ending song is dropped silently; the background is silent |
| `song-maker` (1) | **No.** The twelve cells of the board answer (a note, a pop and a jelly lit at once); the board is at most 600 by 450 units, and the mountains around it and the board's edge do nothing | **Yes.** Free play: any song is welcome and nothing is counted | **Yes.** The ghost finger lights jellies one by one; every cell answers, though an unlit one shows only a small seed | **No.** Twelve small seeds from the start. Each jelly on the board is one she lit, but nothing new arrives, and the round ends after twelve taps | **Partly.** A second tap on a jelly sings and puts it out, and that tap counts toward the twelve; taps after the twelfth still sing; the background is silent |

### What the table says

- **Pass 1 and 4 well enough to leave alone:** `jelly-drums` (the pattern itself) and `sound-garden`, whose level 8 was built the same way with one friend at a time. Neither needs a line.
- **Close enough to leave alone:** `puppet-stage`. Its first level was written for a touch that cannot be wrong, the touch field is the stage rather than the screen, and what she touches for arrives under her finger. It gets no line; the silent half of a portrait screen is noted below instead.
- **Big target, not anywhere:** `rhythm-neighbors` and `song-maker`. In `rhythm-neighbors` the one idle invitation also points at the thing that does not move the round on.
- **No lap player can be wrong in this land.** All five first levels count nothing.

### Words-off list (P7)

Music Mountain games whose first lap level plays with the voice off: `jelly-drums`, `sound-garden`, `puppet-stage`, `song-maker`. `rhythm-neighbors` is partly: the card shows the knock, and the round's own invitation shows the frog.

The puppets' hellos in `puppet-stage` are speech (the device's voice, pitched), so with the voice off a puppet rises with a pop and says nothing; the level still plays.

### Lines this land adds to READY

Two games fail question 1 or 4, in the order they should be taken:

1. `rhythm-neighbors`: at level 7 a touch anywhere knocks the tree, and the idle invitation is the tree's.
2. `song-maker`: a lap level that answers anywhere and starts with one big spot on the loop.

### Found while reading (not part of the five questions)

- `rhythm-neighbors`: the comment on the idle wiggle calls it "an invitation"; at level 7 it invites a tap on the frog, which `play()` returns from before anything is counted.
- `jelly-drums`: the spoken line at level 10 is the free-play line, "Tap the jellies to make music!", while one jelly stands; the card's line for the level says touch anywhere.
- `puppet-stage`: `touchFloor` returns silently when no puppet is parked. Two can stand and a lowered one is parked only when its 0.3 s descent ends, so a third fast touch in a row inside that time could find none. Read from the code, not seen.
- `song-maker`: a lap player's twelve taps include the ones that put a jelly out, so a round can end with few jellies lit; the tree house button needs two.

## The other lands (not read)

One land per session, in this order, each adding its own table, words-off list and READY lines:

| Land | Lap-band games |
| --- | --- |
| Painted Canyon (5) | `rainbow-fingers`, `fluffy-salon`, `stamp-studio`, `draw-the-pattern`, `gear-garden` |
| Barnyard (6) | `peekaboo-barn`, `duckling-parade`, `roundup`, `egg-catch`, `animal-snack`, `sing-along-barn` |
| Counting Cove (5) | `duck-pond`, `monster-munch`, `little-helpers`, `pet-kitchen`, `fill-dump` |
| Cozy Village (8) | `splish-splash`, `feelings-faces`, `weather-wardrobe`, `scoop-shop`, `mail-carrier`, `teddy-doctor`, `stop-and-go`, `pet-says` |
| Rainbow Meadow (6) | `shape-sorter`, `color-garden`, `dot-link`, `garden-grow`, `swing-pals`, `sand-table` |
| Puzzle Peaks (2) | `size-parade`, `puzzle-pals` |
| Story Grove (6) | `word-monsters`, `photo-safari`, `goodnight-room`, `opposites`, `attic-finds`, `word-glue` |
| Tinker Lab (6) | `bouncy-launch`, `seesaw-balance`, `block-tower`, `moon-window`, `vine-snip`, `far-lights` |

Lantern Lake has no lap-band game. Counted from each game's `bands` at `26b91ef3`: 13 read and 44 to read, 57 in all.
