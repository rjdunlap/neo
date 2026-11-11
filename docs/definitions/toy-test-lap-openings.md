# The toy test for lap openings (P4, the audit)

*Status: Bubble Beach's eight lap-band games are read at `origin/main` `26b91ef3`, Music Mountain's five at `72ab89de`, Painted Canyon's five at `8d4acdf0`, Barnyard's six at `c891905a`, Counting Cove's five at `892834eb`, Cozy Village's eight at `7f12c562` and Rainbow Meadow's six at `bd67aa66`, all 2026-11-11. The other 14 games that list `lap` are listed by land below, not read.*

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

- **A card first.** With how-to cards on, the card and its ghost-finger demonstration open before the round, and the round waits for Play. Her first touch of the *game* therefore follows a grown-up's press. All forty-three games read so far set `touchDemo: true`.
- **The corner pet answers.** A tap on it pokes it, giggles and repeats the instruction. That is a reply to one silly use in every game that shows it, and it is not counted again under question 5. A game with a large pet of its own hides the corner one (four of Cozy Village's eight do; their rows say what repeats the instruction instead).
- **A dead tap is mostly silent.** A board tap that made no sound gets a soft tick only while one of the game's lines is still pending. Otherwise the shell adds nothing.
- **A whole palm is ignored.** More than three pointers down is palm rejection, for `onTap` and for every game's own handlers that call `palmOnGlass()`. A flat-hand swat with four or more contacts does nothing in any game. *This cuts against question 1 at exactly this age and is the same in all 57 games; it is noted here once rather than failed per row.*
- **Two opening lines hold input** in the forty-three read so far: `duck-pond` and `teddy-doctor` wait for their first line before a touch counts (their rows). The other forty-one open input before the line or without waiting for it. One more opening holds input without a line: `draw-the-pattern` begins every strip with the pet's turn (its row).
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

## Painted Canyon

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `rainbow-fingers` (1) | **Yes.** The page is the whole screen but an 18-unit rim: touch-down lays paint under the finger with a bell, for several fingers at once (the shell's palm rule stops a fourth) | **Yes.** Free painting: any mark is welcome and nothing is counted | **Yes.** The ghost finger paints, and every part of the page answers; the frame that ends the round pops in with a sparkle and rocks | **Partly.** A blank page rather than one big thing, but every mark on it is hers. The frame comes after her fifth touch (or one touch and 25 seconds) and then waits without limit | **Yes.** A quick pat splats a flower, a hold leaves a blot, a drag paints a line that changes colour and rings a note as it climbs; after eight quiet seconds a blank spot sparkles and the pet wiggles |
| `fluffy-salon` (6) | **Partly.** A field over the pet answers every touch: fur grows under the finger with a bell, and a touch off the fur (cape, chair, wall) gets a giggle and a wobble. Outside it, a strip 160 units wide on the left, 140 on the right and 130 along the bottom does nothing | **Yes.** Pat mode counts nothing | **Yes.** One pet with short fuzz and no buttons; the ghost finger strokes the fur. The mirror that ends the round wiggles, and the pet looks in it by itself after 20 quiet seconds | **Yes.** One big pet whose fur grows only where she touches; the shake and the big mirror come because the fur got fluffy, never on a timer | **Yes.** An off-fur touch has its own reply (the giggle); a drag strokes fur along its path; fur goes on growing after the shake |
| `stamp-studio` (7) | **No.** The paper answers (a star 170 units across and a pop at once, no cooldown); it is the middle of the screen, about 674 by 478 units on the 1024 by 768 area, and the teal around it does nothing | **Yes.** Every picture finishes with nothing counted | **Yes.** The ghost finger pats the paper in eight places; the eighth pat finishes by itself | **Partly.** A blank sheet rather than one big thing, and every star is hers. A star button stands below it from the start, and a green arrow and a back arrow appear at her first pat | **Partly.** A pat on a star already there presses another over it; a hold or a drag is one pat; the back arrow takes her latest star away with only a tick; the background is silent |
| `draw-the-pattern` (1) | **No.** The paper strip answers (a dot and a brush sound on touch-down, flowers and a bell on lifting); it is a band across the middle, about 850 by 250 units on the 1024 by 768 area, and the cream around it does nothing. Each strip also opens with 1.6 seconds of the pet's turn in which every touch is dropped | **Yes.** No touch is wrong at level 1; "Show a hint" only says the line again | **Yes.** The ghost finger draws a short wave on the paper, a crayon lies in its middle, and all of the strip answers | **Partly.** An empty strip and a small picture with three pale places rather than one big thing; every mark and flower is hers, and a strip joins the picture after her fourth touch, never on a timer | **Partly.** A pat is a dot and a drag is a line, and both grow flowers; a tap on the picture has the pet take its turn again; a second finger while one is down, and any touch while a strip flies to the picture, is dropped silently |
| `gear-garden` (1) | **No.** The machine's panel answers anywhere on it (the handle presses in, a ratchet sounds, both gears and the bud turn), and so does the round arrow; the garden around them does nothing | **Partly.** Nothing is wrong and no miss is reachable, but the pause sheet's "Show a hint" turns the handle once and counts a hint | **Yes.** One machine, and the ghost finger taps it | **Partly.** One machine of a handle, two gears and a bud, with the round arrow beside it; her taps open the bud a step at a time, the fourth blooms it, and the next machine comes only then | **Partly.** Fast taps queue one more turn rather than vanish; the round arrow turns it the other way and still opens the bud; taps from the bloom until its spoken line ends are dropped silently |

### What the table says

- **Pass 1 and 4 well enough to leave alone:** `rainbow-fingers` (the whole page answers, and several fingers can paint at once) and `fluffy-salon`, whose level 6 was built for a pat that cannot be wrong. The salon's touch field stops short of the screen's sides and bottom; that is noted below rather than given a line.
- **Big target, not anywhere:** `stamp-studio`, `draw-the-pattern` and `gear-garden`. Each has one clear thing to touch and a surround that says nothing back. `draw-the-pattern` has the smallest field of the five and is the only one that drops touches at the start.
- **No lap player can be wrong in this land.** No first level can count a miss; the one counted hint is the pause sheet's in `gear-garden`.

### Words-off list (P7)

Painted Canyon games whose first lap level plays with the voice off: all five. Each shows its first move with the ghost finger and has one thing to touch; none needs the spoken line.

### Lines this land adds to READY

Three games fail question 1, in the order they should be taken:

1. `draw-the-pattern`: at level 1 a touch anywhere draws, and a touch during the pet's turn is answered.
2. `stamp-studio`: at level 7 a touch anywhere presses a star, with no arrows to end or undo it.
3. `gear-garden`: at lap a touch anywhere turns the handle, and the pause sheet's hint is not counted.

### Found while reading (not part of the five questions)

- `stamp-studio`: at level 7 the green arrow shows from the first pat, so a touch on it ends the picture with fewer than eight stars, and the back arrow removes her latest star. The card's finish line for level 7 names only the eighth pat.
- `draw-the-pattern`: between strips input is held through the strip's flight, a spoken line that is awaited, and the pet's turn again. How long that is with a slow voice is not established.
- `fluffy-salon`: the touch field's width is the view's less 300 units, so on a narrow view the silent strips are a larger share of the screen. Not measured on a phone.
- `rainbow-fingers`: at lap the round ends only by a touch on the frame; nothing finishes it for her, and the frame sits in the top right corner of the page she is patting. Whether that ends rounds early is not established.
- `gear-garden`: the panel's size comes from `gearLayout` and was not worked out for any view.

## Barnyard

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `peekaboo-barn` (16) | **Yes.** A layer over the whole screen: any touch opens the one big house, with a wiggle and the animal's call at once | **Yes.** Free play: nothing is counted, and the house opening by itself is not a reveal | **Yes.** One house at one and a half times its size, and the ghost finger taps it; after six quiet seconds it opens by itself | **Yes.** One big house; each friend comes out because she touched, and a new one moves in when it hides. There is never more than the one house, as `sound-garden` has one friend | **Partly.** A touch while the friend is out wiggles the house and it calls again; a hold is one tap; touches in the second and a half after the sixth reveal are dropped silently |
| `duckling-parade` (1) | **Partly.** A layer over the whole screen: touch-down puts a fading ring on the meadow and Mama Duck walks to it. Nothing sounds at the finger; the first sound is the quack when a duckling joins, and a touch on the sky is moved down onto the meadow | **Partly.** No miss is reachable (every duckling joins, and Mama leads the full line to the pond herself), but fifteen seconds without a duckling joining counts a hint, by waiting alone | **Yes.** The ghost finger taps a duckling and Mama walks there; the waiting ducklings glow after fifteen quiet seconds, and the pond glows when the line is full | **No.** Mama, three ducklings and the pond are all there at the start; her line grows as she walks, and nothing new arrives | **Partly.** A finger kept down leads Mama as a drag does; the newest finger takes over; touches while the ducklings hop into the pond are dropped silently |
| `roundup` (1) | **Yes.** A tapped animal hops to its pen with a whoosh; a tap on the grass or a pen makes the nearest loose animal cheer and call; the pen's sign says who lives there | **Partly.** No miss is reachable, but waiting is counted: fifteen seconds without an animal going home counts a hint (the waiting ones glow), and at thirty the nearest trots home by itself as another, for each animal | **Yes.** Three animals and one pen; the ghost finger taps an animal, and a touch beside one makes it hop | **No.** Three animals and the pen from the start, and nothing new arrives. Level 10 already brings its animals out one at a time | **Yes.** The grass and the sign each have their own reply; a tap on an animal already in the pen, and any background tap while the last one is hopping home, get nothing |
| `egg-catch` (1) | **No.** Only the four hens along the top answer (each about 170 units across; a pop on her own note, a cheer and an egg at once). The barn, the hay, the basket and everything else below the hens do nothing | **Yes.** No hen lays a white egg and the basket goes under the egg by itself, so the miss and the hint cannot be reached | **Partly.** The ghost finger taps a hen and any hen is right; in the round nothing glows or moves to invite a touch, and the spoken line is the only prompt | **No.** Four hens and the basket from the start; nothing new arrives | **No.** A tap on any hen while an egg falls (2.4 seconds) is dropped silently, each hen also waits 0.9 seconds between taps, and the basket and background are not touchable |
| `animal-snack` (1) | **No.** The three animals answer (each circle about 230 units across; a snack appears and she munches it with bites, then her call); the meadow, sky and picnic spot do nothing | **Yes.** The munch level counts nothing | **Yes.** The ghost finger taps an animal and any animal is right; after six quiet seconds one squishes with a sparkle at its mouth | **No.** Three animals from the start; each snack comes because she touched, and no friend arrives or changes | **Partly.** A tap on an animal while another eats gets a squish and a tick; the six-second invitation goes round the three; the background is silent |
| `sing-along-barn` (1) | **Yes.** A layer over the whole screen: every touch plays the song's next note, with a floating note at the finger and a bounce of the barn (a 90 ms gap is the only wait) | **Yes.** Singing counts nothing | **Yes.** The ghost finger taps; a row of beads shows where the song is, and the next one breathes | **Yes.** One big barn; a friend comes to its door for its verse because her taps carried the song there, and answers with its own call | **Partly.** Wherever a touch lands it is the next note, so the barn, the friend and the sky all reply alike; there is no idle invitation, and touches during the closing cheer are dropped silently |

### What the table says

- **Pass 1 and 4 well enough to leave alone:** `peekaboo-barn`, whose level 16 (*One door*) was built to this pattern, and `sing-along-barn`, where every touch anywhere is the next note.
- **Answers anywhere, on a full field:** `roundup` (its grass and its sign each reply) and `duckling-parade` (the whole screen steers, without a sound). Both start with everything on screen.
- **Big target, not anywhere:** `egg-catch` and `animal-snack`. `egg-catch` has the smallest field of the six, a row of hens along the top, and is the only one that drops a touch on its own target.
- **Waiting is counted in two games.** No lap player can be wrong in this land, but `duckling-parade` and `roundup` count a hint when nothing has happened for fifteen seconds. They are the first two of the twenty-four read where doing nothing reaches the round's numbers.

### Words-off list (P7)

Barnyard games whose first lap level plays with the voice off: `peekaboo-barn`, `duckling-parade`, `roundup`, `animal-snack`, `sing-along-barn`. `egg-catch` is partly: the card shows the tap on a hen, and nothing in the round invites one.

`sing-along-barn`'s song is notes, not speech, so it plays in full with the voice off; the words to sing are on the card for the grown-up. The animals' calls in all six are sounds, not the voice.

### Lines this land adds to READY

Four games fail question 1 or 4, in the order they should be taken:

1. `egg-catch`: a lap level with one big hen; a touch anywhere has her lay.
2. `animal-snack`: level 1, which only lap plays, opens with one big animal and a touch anywhere feeds it.
3. `duckling-parade`: at lap a touch quacks, the ducklings come out one at a time, and waiting is not counted.
4. `roundup`: at lap one animal at a time, and waiting is not counted. It passes question 1 already, so it is last.

### Found while reading (not part of the five questions)

- `duckling-parade`, `roundup`: the idle hint is counted at the lap level as it is at every other. `roundup`'s comment on the trot home says "Help, not her own move: it counts as a hint", which is the intent for older levels; at level 1 it means a lap player who only watches finishes with up to six hints. Lap's range in `duckling-parade` is the one level, so there the count cannot move her level; in `roundup` lap has two.
- `peekaboo-barn`: the instruction at level 16 is the free-play line, "Who is hiding? Tap to find out!"; the card's line says touch anywhere.
- `egg-catch`: `HEN_SHELLS` gives the four hens brown, speckled, blue-green and brown eggs, so the white-egg miss in `land` cannot be reached at level 1. Whether the basket (900 units a second) always arrives under a 2.4-second egg on a very wide view was read from the numbers, not seen.
- `animal-snack`: level 1 is in lap's range only (`toddler` starts at 2), so a change to it reaches no other band.
- `sing-along-barn`: how many touches the opening takes before the friend comes out depends on the seeded song and was not counted.

## Counting Cove

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `duck-pond` (12) | **No.** Only the five ducks answer (each circle 106 units across; a cheer, a quack and it swims off at once); the pond, the bank and the sky do nothing. The opening also holds her: the ducks swim in one after another for about three seconds and the first line is waited for, and a tap on a duck before then is dropped | **Yes.** Waving bye-bye counts nothing; the miss and the hint belong to the lily-pad levels | **Partly.** The ghost finger taps a duck and any duck is right; in the round nothing glows or moves to invite a touch, and the count down ("4 left") is only spoken | **No.** Five ducks from the start, and each touch takes one away; they all swim back by themselves after the last | **No.** A duck swimming off cannot be touched, the water is silent, and nothing answers while the ducks are called back, swim in and are counted |
| `monster-munch` (9) | **No.** The big monster and the three big cookies answer (a tap on either feeds it: two munches, crumbs, a bigger belly and the count); the room around them does nothing | **Yes.** A tap can only feed; the boing and the glow belong to the dragging and number levels | **Yes.** The monster stands with its mouth open beside three cookies, the ghost finger taps a cookie, and the monster and every cookie are right | **Partly.** One big monster whose belly grows with each bite she gives; its three cookies are on the tray from the start, and the second monster and its cookies come after the burp, not on her touch | **Partly.** A tap on the monster while it burps gets a beam and a giggle; the background is silent and there is no idle invitation |
| `little-helpers` (1) | **Yes.** A layer over the whole screen: a touch anywhere sends the nearest helper running to the thing with a pop, and one helper is enough to lift it | **Yes.** There is no whistle at this level, and nothing else is counted | **Yes.** One thing to carry and a crowd of helpers; the ghost finger taps the thing, and every touch sends a helper | **Partly.** One thing at a time, and the next drops in only after hers is carried home, so the basket fills because she touched; the seven helpers and the basket stand there from the start, and the thing is the smallest size | **Yes.** While a thing is being lifted or the next one drops in, a touch makes the nearest waiting helper hop and squeak; a tap on a waiting helper sends one |
| `pet-kitchen` (10) | **Partly.** A layer over the whole counter: a touch away from a piece wiggles the nearest loose piece, without a sound and without dealing it. Only a touch on a piece (a tap circle of 75 units' radius) deals it, with a bell | **Yes.** No touch is wrong, and the round ends with nothing counted | **Yes.** Two or four pieces and two friends with plates; the ghost finger taps a piece, and after six quiet seconds a loose piece wiggles | **No.** The pieces, both friends and both plates are there from the start, and nothing new arrives. The round is two or four taps long | **Partly.** A tap on a dealt piece wiggles it and a tap on the counter wiggles the nearest loose one, both silent; nothing answers while the friends eat |
| `fill-dump` (1) | **Partly.** The container and the grass (the lower half of the screen) answer: a full container tips out with a clunk and a run of bells, and afterwards any such touch scoops the nearest piece back in with a tick and a note. The sky around the container does nothing | **Yes.** The tip-out levels have no wrong move, and the six-second wiggle is not a hint | **Yes.** One container, and the ghost finger taps it; after six quiet seconds the container, or the next piece to scoop, wiggles | **Yes.** One big container; its three pieces hop out because she touched it, and go back in one touch at a time | **Partly.** The grass has its own rule (tip, or scoop the nearest piece); touches during the tip-out, about two seconds, are dropped silently |

### What the table says

- **Pass 1 and 4 well enough to leave alone:** `little-helpers`, the land's one game where a touch anywhere is the move, and `fill-dump`, where the container and half the screen answer and everything that happens comes from her touch.
- **Big targets, not anywhere:** `monster-munch` (a very big monster and big cookies, and a belly that grows) and `duck-pond` (five ducks on a pond that says nothing back).
- **Answers anywhere, but not with the move:** `pet-kitchen`. A touch on the counter wiggles a piece without a sound; only a touch on a piece deals it.
- **Nobody can be wrong in this land,** and no waiting is counted: `pet-kitchen`'s and `fill-dump`'s six-second wiggles count nothing.
- **`duck-pond` is the first of the twenty-nine read whose opening line holds input.**

### Words-off list (P7)

Counting Cove games whose first lap level plays with the voice off: `monster-munch`, `little-helpers`, `pet-kitchen`, `fill-dump`. `duck-pond` is partly: the card shows the tap on a duck, and nothing in the round invites one.

The number words are only spoken in three of them. `duck-pond` counts down, and `monster-munch` and `little-helpers` count up, in the voice alone: at these levels there is no sign, no tummy dots and no badge. With the voice off the play is whole and the counting is not there. `pet-kitchen`'s "one for you, one for me" is also only said, but the pieces going to each plate in turn show it.

### Lines this land adds to READY

Three games fail question 1 or 4, in the order they should be taken:

1. `duck-pond`: a lap level with one big duck; a touch anywhere brings a friend in with a quack, and no opening holds her.
2. `pet-kitchen`: at lap a touch anywhere deals a piece, and the pieces come one at a time.
3. `monster-munch`: level 9, which only lap plays, feeds on a touch anywhere. Its targets are already the biggest in the land, so it is last.

`little-helpers` and `fill-dump` get no line.

### Found while reading (not part of the five questions)

- `duck-pond`: at level 12 `nextRound` keeps `busy` set while the five ducks swim in (0.65 seconds each) and then awaits `ctx.instruct('duck.byeTap')`, so input opens only when the line has ended. Levels 1 and 2 await their line the same way. None of the other twenty-eight games read waits for its line before taking a touch. Level 12 is also toddler's first level, so a change to it in place reaches toddler.
- `monster-munch`: level 9 is in lap's `order` only (toddler's `order` is 2, 3, 10, 4), so a change to it reaches no other band. A lap player who steps up goes to level 1, where the cookies and the belly are the ordinary size.
- `little-helpers`: a touch on the field sends a helper at level 1 only (`fieldTouch`). At level 2, lap's other level, the same touch makes a helper wave and only a touch on the thing sends one, so two smooth rounds change what a touch anywhere does. The card for level 1 says "Tap anywhere"; the spoken line says "Tap it!".
- `pet-kitchen`: whether the round has two pieces or four is drawn from the seed (`dealCut`), so some rounds end on her second touch. The counter's own `pointerdown` handler does not call `palmOnGlass()`; at this level it only wiggles a piece. Level 10 is toddler's first level too.
- `fill-dump`: the grass is the lower half of the view and the container stands in the upper half, so most of the sky that does not answer is beside the container. Level 1 is also the first level at toddler and preschool.

## Cozy Village

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `splish-splash` (9) | **Yes.** One layer over the whole screen: a pat anywhere takes a third off the nearest patch of mud, with a squeak, bubbles at the finger and a squish of the pet. Only the rubber duck (110 units across) does something else: it repeats the instruction | **Yes.** Pat mode has no part to get wrong; the miss and the seven-second hint belong to the named-part levels | **Yes.** One muddy pet in a tub; the ghost finger pats a patch, and after six quiet seconds the next patch sparkles | **Partly.** One big pet, and every change comes from her pat; the patches of mud are all there from the start and fade away, and nothing arrives | **Partly.** A hold or a rub is one pat, and the duck answers; once the last patch is clean a touch does nothing for the rinse and the two seconds after it |
| `feelings-faces` (9) | **No.** Only the big pet answers (a circle at least 300 units across; each tap shows the next feeling with its sound, a hop and its picture); the room around it does nothing | **Yes.** Six taps end the round with nothing counted | **Yes.** One big pet alone on the screen, and the ghost finger taps it; the feeling words are only spoken, and the faces and their pictures show without them | **Partly.** One big pet alone; every face, rain cloud and heart comes from her touch, and nothing stays or adds up | **Partly.** No tap on the pet is dropped during the round, and a sad pet's next tap is a hug; the room is silent, nothing invites a touch after a quiet spell, and the pet does not answer for about three seconds after the sixth tap |
| `weather-wardrobe` (1) | **Yes.** The sky changes the weather and the pet dresses for it, the grass splashes, crunches, scatters leaves or grows a flower where she touched, the pet giggles and a worn thing wiggles and is named | **Yes.** Seven taps on the sky end the round with nothing counted | **Yes.** The ghost finger taps the sky, and every part of the screen answers; the weather and clothes words are only spoken | **Partly.** One big pet; the weather and its clothes arrive because she touched the sky, and are swapped for the next rather than added | **Yes.** Sky, grass, pet and clothes each answer in their own way. Only the last two seconds, after the seventh sky tap, are silent |
| `scoop-shop` (10) | **No.** The four tubs answer (each tap circle 144 units across; one scoop flies to the cone), the customer giggles and asks again, and the cone wobbles without a sound; the shop around them does nothing | **Yes.** Any flavor is right and one scoop is the order; the boing belongs to the other levels | **Yes.** A customer, an empty cone and four tubs; the ghost finger taps a tub and any tub is right | **No.** Four tubs, a customer and a cone from the start, none of them big. Each customer eats and leaves after her one scoop, and the next walks in | **Partly.** A tub tapped while a scoop flies or a customer walks in squashes, pops and wobbles; the shop is silent and nothing invites a touch |
| `mail-carrier` (1) | **Partly.** A layer over the whole screen: a touch off the houses wiggles the letter and waves the nearest mailbox's flag, without a sound and without posting. Only a touch on a house (a circle 220 units across) posts the letter | **Yes.** Every mailbox is right, and the six-second invitation counts nothing | **Yes.** A letter and four houses; the ghost finger taps a house, and after six quiet seconds the nearest flag waves | **No.** Four houses, the cart and the letter are there from the start. A new letter comes out of the bag after each one she posts, six in all, and the street stays the same | **Partly.** The street has its own silent reply (the wiggle and the flag); a touch while the cart rolls or a neighbor says thank you waves a flag at most |
| `teddy-doctor` (1) | **No.** Only the patient answers (about 440 by 490 units: the nearest boo-boo gets a bandage with a giggle); the room does nothing. The opening also holds her: each of the two patients hops in and the first line is waited for, and a tap on the patient before it ends is dropped | **Yes.** A tap can only bandage; the boing belongs to the dragging and named-part levels | **Yes.** One big patient with three boo-boos; the ghost finger taps it, and anywhere on it is right | **Partly.** One big patient at a time, and the bandages go on and stay because she touched; the three boo-boos are there from the start, and the second patient comes after the first is better | **Partly.** A tap on a bandaged place goes to the nearest boo-boo that is left, so no tap on the patient is wasted during the round; the room is silent, and nothing answers during the opening line or while the patient says thank you |
| `stop-and-go` (9) | **No.** The two lamps (each drawn 160 units across, with a touch circle of 184) and the car answer; the road and the sky do nothing | **Yes.** Either lamp and the car count toward the eight touches, and nothing else is counted | **Yes.** A green lamp with a play triangle and a red lamp with a stop bar; the ghost finger taps the one the car is not obeying, and the car goes or brakes | **No.** Two lamps and one car from the start, and nothing arrives; the round is eight touches long | **Partly.** The same lamp twice still rings and counts, and the car toots; the road is silent and nothing invites a touch |
| `pet-says` (13) | **No.** Only the big pet answers (its body and a margin around it; each pat brings the next of five moves, named aloud); the meadow does nothing | **Yes.** There is no arrow and nothing to copy on the screen; five pats end the round | **Yes.** One big pet, and the ghost finger pats it; after ten quiet seconds the pet squishes. The move words are only spoken | **Partly.** One big pet alone; every move comes from her pat, and nothing arrives or stays | **Partly.** A pat during a move squishes the pet and is not saved up; the meadow is silent |

### What the table says

- **Pass 1 and 4 well enough to leave alone:** `splish-splash`, where a pat anywhere is the move, and `weather-wardrobe`, the land's one game where every part of the screen has a reply of its own.
- **One big pet, not anywhere:** `feelings-faces` and `pet-says` are already a single big friend that answers every touch on it; only the space around the pet is silent. `teddy-doctor` is the same shape with an opening that holds her.
- **Answers anywhere, but not with the move:** `mail-carrier`, as `pet-kitchen` does in Counting Cove. A touch on the street waves a flag without a sound; only a touch on a house posts.
- **Several small targets from the start:** `scoop-shop` (four tubs) and `stop-and-go` (two lamps). Both levels are played by lap only.
- **Nobody can be wrong in this land,** and no waiting is counted: the sparkle in `splish-splash`, the flag in `mail-carrier` and the squish in `pet-says` count nothing.
- **`teddy-doctor` is the second of the thirty-seven read whose opening line holds input,** after `duck-pond`.

### Words-off list (P7)

Cozy Village games whose first lap level plays with the voice off: all eight. Each shows its move on the card and has one obvious thing, or everything, to touch.

What only the voice carries: the feeling words (`feelings-faces`), the weather and clothes words (`weather-wardrobe`), the body-part words (`splish-splash` and `teddy-doctor`), the move words (`pet-says`), "green" and "red" in the opening line (`stop-and-go`; its lamps also carry a shape) and the count of the one scoop (`scoop-shop`). With the voice off the play is whole and the naming is not there. `feelings-faces` and `pet-says` suggest making the face or the move together, which a grown-up can do in any language.

### Lines this land adds to READY

Six games fail question 1 or 4, in the order they should be taken:

1. `teddy-doctor`: input opens before the first line, and at lap a touch anywhere bandages the nearest boo-boo.
2. `scoop-shop`: level 10 opens with one big tub; a touch anywhere scoops, and the other flavors arrive as she serves.
3. `stop-and-go`: level 9 becomes one big lamp; a touch anywhere turns it, green to go and red to stop.
4. `mail-carrier`: at lap a touch off the houses posts to the nearest mailbox, with a sound.
5. `feelings-faces`: at level 9 a touch anywhere is the poke.
6. `pet-says`: at level 13 a touch anywhere is the pat.

The last two are the smallest changes and their targets are already the biggest in the land, so they are last. `splish-splash` and `weather-wardrobe` get no line.

### Found while reading (not part of the five questions)

- **The corner pet is hidden in four of the eight.** `splish-splash`, `feelings-faces`, `weather-wardrobe` and `pet-says` set `ctx.pet.visible = false` for a large pet of their own. The instruction is repeated by the rubber duck in `splish-splash` and by a tap on the pet in `weather-wardrobe`; in `feelings-faces` level 9 and `pet-says` level 13 a tap on the pet is the move, so nothing on the screen repeats the instruction (in `pet-says` the pet asks again by itself after ten quiet seconds).
- `splish-splash`: the scrub layer uses its own `pointerdown` handler and does not call `palmOnGlass()`, so here a flat hand is not rejected: each contact that lands is a pat. That suits this level; it is noted because the shell section above says otherwise. How many patches there are depends on the pet's species (`STAR`), and each takes three pats. Level 9 is in lap's `order` only.
- `feelings-faces`: level 9 is in lap's `order` only. The cycle is fixed (happy, surprised, sleepy, sad, the hug, surprised), so every round is the same six taps.
- `weather-wardrobe`: level 1 is also the first level at toddler. The round needs seven sky taps; touches on the grass, the pet and the clothes answer and do not move it on, so a child who only pats the grass never finishes, and nothing invites a touch on the sky after a quiet spell.
- `scoop-shop`: level 10 is in lap's `order` only. `busy` starts true and is cleared when each customer has walked in (about 0.7 seconds), before the order is spoken; a tub tapped earlier still pops and wobbles.
- `mail-carrier`: the street layer's own `pointerdown` handler does not call `palmOnGlass()`; at this level it only waves a flag. `nearestHouse` already finds the mailbox nearest a touch, for the flag. Level 1 is also toddler's first level, so a change to it in place reaches toddler.
- `teddy-doctor`: `next` sets `busy`, waits half a second and then awaits `ctx.instruct('doctor.play')` for each of the two patients, so input opens only when the line has ended. The card for level 1 says "Tap the patient anywhere"; the spoken line says "Tap them", the boo-boos. Level 1 is also toddler's first level.
- `stop-and-go`: level 9 is in lap's `order` only, and its plan sits outside `PLANS`. The lamps sit low and centred, 240 units apart.
- `pet-says`: level 13 is in lap's `order` only. A lap player who steps up goes to level 1, where a grown-up taps an arrow and the moves are done away from the screen.

## Rainbow Meadow

| Game (first lap level) | 1. Touch anywhere | 2. Cannot go wrong | 3. Voice off | 4. One big thing that grows | 5. Silly use answered |
| --- | --- | --- | --- | --- | --- |
| `shape-sorter` (9) | **Partly.** The wall and the floor answer: the nearest waiting circle wiggles, ticks and is named, and does not go in. The box (324 by 270 units) gulps and giggles. Only a touch on a piece (a touch circle 112 units across, drawn 96) puts one in | **Yes.** One round hole and three circles, so every piece fits; there is no idle hint and nothing is counted | **Yes.** Three red circles and a red-rimmed round hole; the ghost finger taps the next waiting piece. Nothing invites a touch after a quiet spell | **No.** The box and all three pieces are there from the start. Each piece shrinks into the box, and nothing arrives | **Partly.** Box, floor and wall each have a reply of their own, and a piece held for 0.4 seconds or more and let go away from the hole plops and floats home; a floor tap while the last piece flies in is silent, and so is everything through "All in!" and about two seconds after it |
| `color-garden` (9) | **No.** Only the four fruit answer (each tap circle 120 units across: a tick, the color named and a hop into its own basket); the tree, the baskets and the garden behind them do nothing | **Yes.** A tapped fruit goes to its own color's basket; the boing and the hint belong to the dragging levels | **Yes.** Four fruit on a tree over two baskets; the ghost finger taps a fruit, and any fruit is right. Nothing invites a touch after a quiet spell | **No.** Four fruit, two baskets and the tree from the start, none of them big. The fruit leave the tree, and nothing arrives | **Partly.** A hold or a drag on a fruit is one tap; a fruit in flight or in its basket is silent, as are the tree, the baskets and the background, and nothing answers for about 2.3 seconds after the fourth fruit lands |
| `dot-link` (1) | **No.** Only the twenty dots answer (each drawn 68 units across and caught within a circle of about 97); the gaps between them are silent, and the meadow around the 540 by 432 board has no handler | **Partly.** Every dot is right and nothing boings; after twelve quiet seconds two dots bob, and that is counted as one hint | **Yes.** A board of dots; the ghost finger taps one and any dot is right | **No.** Twenty small dots from the start. Each pop drops one replacement in from the top, so the board never grows | **Partly.** A hold or a drag is one pop; a tap during the half second of pop and refill is dropped, the gaps and the meadow are silent, and the only invitation is the counted bob |
| `garden-grow` (8) | **Yes.** One layer over the whole view: a touch anywhere grows the flower one step, with a squash of the bed and a pop, a splash or a bell | **Yes.** Fifteen touches end the round with nothing counted; there is no boing and no idle hint | **Yes.** One bed of soil and an empty vase; the ghost finger taps the bed, and anywhere is right | **Yes.** One bed about 270 units wide that opens bare. Seed, sprout, leaves, bud and bloom each come from a touch, and the three finished flowers collect in the vase | **Partly.** A hold or a drag is one touch, and a fast second touch is not lost; nothing answers for about two seconds and the closing line after the fifteenth touch, and nothing invites a touch after a quiet spell |
| `swing-pals` (1) | **Yes.** One layer covers the view below the top 130 units: a touch anywhere on it is the push (the mitten pops out, a whoosh, and the one swing goes a quarter of the way higher). Only the strip beside the shell's buttons does nothing | **Yes.** A tap is never a miss; the boing belongs to the hook levels, and there is no idle hint | **Yes.** One friend on one swing with a bell in front; the ghost finger taps the middle, and any spot is right. Nothing invites a touch after a quiet spell | **Partly.** One swing with one friend, and it climbs because she touched until the fourth push rings the bell. The bell is there from the start, and the three friends come one after another rather than gathering | **Partly.** A hold or a drag is one push; nothing answers while a friend's bell line is spoken, during the 1.4-second changeover or during the finale |
| `sand-table` (1) | **No.** The tray answers (up to 860 units wide by 288, or 360 upright: a touch pours three grains from the bucket with a whoosh and a pluck for each) and so does the scoop paddle (180 by 100); the sky, the bucket and the wooden frame do nothing | **Yes.** An empty bucket or an empty scoop is answered without a boing or a count, and the six-second sparkle counts nothing | **Yes.** One tray of sand under a bucket; the ghost finger pours four times, scoops once and taps the flag, and after six quiet seconds the tray sparkles while the bucket has sand | **Partly.** One big tray, and the heap grows because she touched; the flag (130 units) arrives after her first grain and the pail after the first spill. The scoop paddle is there from the start | **Partly.** An empty bucket gets a knock, a wiggle of the paddle and a line, and an empty scoop still brushes; the background is silent, and every touch after the flag is dropped |

### What the table says

- **Pass 1 and 4:** `garden-grow`, the fourth of the forty-three read that answers yes to both, after `jelly-drums`, `peekaboo-barn` and `sing-along-barn`. Its level 8 is already the *One big jelly* shape: one bare bed, a touch anywhere is the move, and everything on the screen came from her touch.
- **Passes 1 well enough to leave alone:** `swing-pals`, where a touch anywhere below the buttons is the push and the swing climbs because of it.
- **Answers anywhere, but not with the move:** `shape-sorter`, as `mail-carrier` and `pet-kitchen` do. A touch on the floor or the wall wiggles and names the nearest circle; only a touch on a piece puts it in.
- **One big thing, not anywhere:** `sand-table`. The tray is most of the screen and the heap is hers, and the round ends only by a tap on a 130-unit flag.
- **Several small targets from the start:** `color-garden` (four fruit) and `dot-link` (twenty dots, the smallest targets in the land).
- **One game counts something at lap:** `dot-link` counts a hint when she waits twelve seconds. Nobody can be wrong in this land.
- **No opening line holds input here,** and the corner pet shows in all six.

### Words-off list (P7)

Rainbow Meadow games whose first lap level plays with the voice off: all six. Each shows its move on the card, and in each any target is right.

What only the voice carries: "circle" (`shape-sorter`), the color words (`color-garden`), the friend's name and the bell (`swing-pals`), and "pour", "scoop" and the empty bucket's "scoop some sand back" (`sand-table`). In `dot-link` and `garden-grow` nothing is named during play; `garden-grow`'s stage words (seed, sprout, leaves, bud, bloom) are on the card only. With the voice off the play is whole and the naming is not there. `sand-table` is the one to watch: once the bucket is empty, the way on is to scoop or to tap the flag, and with the voice off only the knock and the paddle's wiggle say so.

### Lines this land adds to READY

Four games fail question 1 or 4, in the order they should be taken:

1. `dot-link`: a lap level that opens with one big dot; a touch anywhere pops the nearest dot, more drop in because she popped, and waiting counts no hint.
2. `color-garden`: at lap one big fruit on the tree; a touch anywhere sends it hopping to its basket, and the next fruit grows because she touched.
3. `sand-table`: at lap a touch anywhere pours onto the one heap, the bucket does not run dry, and the round finishes without a tap on the flag.
4. `shape-sorter`: at lap one big circle beside the box; a touch anywhere hops the nearest piece in, and the next rolls out because she touched.

`shape-sorter` already answers a touch anywhere, so it is last. All four levels are also toddler's first, so each line is a lap-only level or a lap-only branch, and toddler's opening stays as it is. `garden-grow` and `swing-pals` get no line.

### Found while reading (not part of the five questions)

- **Four of the six open lap on toddler's first level.** `shape-sorter` 9, `color-garden` 9, `dot-link` 1 and `sand-table` 1 are first for toddler too, as is `swing-pals` 1; only `garden-grow` 8 is lap's alone. None of `shape-sorter`, `sand-table` or `swing-pals` reads `ctx.band`, so a lap player gets exactly toddler's level.
- `shape-sorter`: a tap answers on release, since the hop is decided when the drag ends, and a still press of 0.4 seconds or more does not hop the piece in: it plops and floats home. The round cannot finish by floor, wall or box touches, or by long presses alone. Three comments in `index.ts` say "level 1" for the floor, wall and box replies, which run at every level that sets `everyTouch`, level 9 among them. The card's note for level 9 leaves out the far-drop plop that level 1's note has.
- `color-garden`: the fruit sit 118 units apart with tap circles of 120, so neighbours overlap by 2 units. The two colors are dealt at random with one fruit of each guaranteed, so a round can be three and one.
- `dot-link`: the idle hint is built for linking. At level 1 it lights two same-color neighbours and counts one hint; only a judged link clears it, and tap mode never judges, so the two places bob for the rest of the round whatever dots fall into them, and one hint at most is counted. The catch circle is about 97 units at full board scale, under the 100-unit rule, and the board shrinks on a small view. The card's goal line says "Link dots of the same color" at a level with no linking. The game's own `pointerdown` handler calls `palmOnGlass()`.
- `garden-grow`: at stage 2 the splash drops fall from where the cloud would be, and at level 8 the cloud is hidden and not positioned, so they start at the top of the screen. A lap player who steps up goes to level 1, six beds where only the beds answer. A comment in `logic.ts` says levels 2–3 use the two-by-three grid; the grid levels are 7 and 9–11. Whether the full-view tap layer sits over the corner pet's own tap area was not established.
- `swing-pals`: twelve pushes finish the round (three friends, four each), and any touch below the top strip counts. After a friend's fourth push and before the bell (about 0.75 seconds), a tap pops the mitten without a sound and without a push. The ground layer's own handler calls `palmOnGlass()`. After the session's first round the goal may be chimes, an apple or a nest, named only aloud.
- `sand-table`: the round ends only by a tap on the flag (130 units, bottom right), and nothing points at it but its entrance bell and one line. Twelve pours empty the bucket (counted by re-running the pour rule, not by play); after that every pat on the tray gets the knock and "Scoop some sand back!", and the sparkle stops, since it needs sand in the bucket. So a child who only pats the sand never finishes, as in `weather-wardrobe`. The comment "Every tap answers: nothing waits and nothing is ignored" holds for the tray, the paddle and a filled pail only.

## The other lands (not read)

One land per session, in this order, each adding its own table, words-off list and READY lines:

| Land | Lap-band games |
| --- | --- |
| Puzzle Peaks (2) | `size-parade`, `puzzle-pals` |
| Story Grove (6) | `word-monsters`, `photo-safari`, `goodnight-room`, `opposites`, `attic-finds`, `word-glue` |
| Tinker Lab (6) | `bouncy-launch`, `seesaw-balance`, `block-tower`, `moon-window`, `vine-snip`, `far-lights` |

Lantern Lake has no lap-band game. Counted from each game's `bands` at `26b91ef3`: 43 read and 14 to read, 57 in all.
