# Goodnight Room deep dive

*ID `goodnight-room` · bands lap, toddler, preschool · levels 1–4 on 2026-10-10 · session `claude/sweet-babbage-zq5bz6` ([PR 84](https://github.com/rjdunlap/neo/pull/84))*

## The game today

A cosy bedroom at bedtime: a lamp, a wall clock, a fishbowl, and a teddy, a kitten and a puppy. She taps a friend to say goodnight. It gets sleepy eyes, a "z" floats up, a bell note rises one step, the room darkens a little and three more stars come out in the window. When every friend is asleep, four soft bells play, the pet falls sleepy, and the round ends. The moon and window are the only scenery that changes.

Levels 1–2 are **tap everyone** (no wrong answer, so no misses and no hints). Levels 3–4 are **listen and tap**: the voice names one friend, or two in order. A wrong friend, or the right two the wrong way round, is a boing and a spoken hint and counts as a miss; a second miss in a row makes the right friend glow (one hint). Tapping a friend who is already asleep is a soft tick, never a miss. In "named" mode five of the six are asked and the last one falls asleep with the finale; in "two in order" the three pairs cover all six.

| Level | Plan (`PLANS`) | Mode | Bands whose window includes it | What she decides |
| --- | --- | --- | --- | --- |
| 1 | the first four things (lamp, teddy, kitten, clock), no requests | all | lap (1–2) | nothing wrong is possible: tap a friend, see it fall asleep |
| 2 | all six (adds puppy, fish) | all | lap, toddler (2–4) | the same, with more to find |
| 3 | six things, five requests of one | named | toddler, preschool (3–4) | which friend is "the kitten" |
| 4 | six things, three requests of two | two | toddler, preschool | two names, in the order said |

**What a round draws from.** Almost nothing. The six things are a fixed list (`THINGS`), level 1 is always the first four, and each thing sits at a fixed place in the room (`spot()` maps the name to a fraction of the screen). The only seeded part is the order of the requests at levels 3–4. A level-1 round is therefore identical every time, and level 2 is the same room with two more friends.

**Couplings.** A how-to card (three `LevelLine`s) and a ghost-finger bot (`autotouch()`, built on `thingToTap`). Voice lines `night.all`, `night.goodnight`, `night.named`, `night.two`, `night.notthat`, `night.order`, `night.done`. Home land: Story Grove. Music: `STYLES.lullaby`. No couch entry, no journal entry, no picnic step, no creation. The pet sleeps at the finale. The browser suite `night` plays levels 1–4.

**Known gaps.**
- **One room, one picture.** A round at level 1 never changes; a child who loves the game sees the same four friends in the same places.
- **The stars shrink at the end.** Each friend adds three stars, so a six-friend room reaches 18, then the finale resets the sky to 12. (`this.stars = 12` in `finale()`.) A small bug on levels 2–4.
- **Levels 1–2 can never be wrong, and offer no nudge** if she is waiting. The pet repeats the instruction on tap; nothing in the room invites her.
- **No sound of its own for each friend.** Every goodnight is a rising bell note; the kitten does not yawn.
- **Two names in order at level 4 sits in the toddler window.** Sources disagree about whether two-year-olds follow two-step requests (see Similar games). It has a supported miss path and a glow, so it is a person check rather than a change.
- **Ambiguous friends.** The teddy is the `bear` critter. A real bear cannot join its room, and a request for "the animals" would be unfair to a teddy (see level 5 below).
- Person checks still open: whether a one-year-old holds a 160-unit tap target, and the real iPad ([roadmap](../ROADMAP.md#checks-that-need-a-person-or-device)).

## Similar games

The genre is the bedtime picture-book app: a calm scene, one tap per friend, and a rewarding settle. None of them has a difficulty ladder, which is the gap this game can fill. Dates and prices on store listings change; check before relying on a detail.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Goodnight Moon* (Margaret Wise Brown's book; the Loud Crow app, [Horn Book review](https://hbook.com/story/goodnight-moon-app-review), [School Library Journal](https://slj.com/review/goodnight-moon)) | book and app | No levels: one room with many touchable things (the store listing counts over two hundred, [listing](https://www.bluestacks.com/campaign/com.loudcrow.goodnightmoon/es)); the book's "goodnight" to each object in turn is the pattern this game is named for | **a roll call of objects as the whole game**; the Horn Book's praise of "just enough" interaction for young children | the Horn Book also doubts the app is a true bedtime app (a screen is not a wind-down), so grown-up copy here must **not claim the game helps her sleep** |
| *Nighty Night!* (Fox & Sheep; [Horn Book review](https://www.hbook.com/story/nighty-night-app-review), [App Store](https://apps.apple.com/gb/app/id434756152)) | app, ages about 1–4 | A farm of stalls and houses; tap a switch to turn off a light and the animal yawns and settles; more animals sold as in-app purchases | **a farm at night** (our *barn* room) and **a different sound and motion per animal** (yawn, snore) | extra animals as purchases; its ending, where the narrator says someone is still awake and sends the child to bed (this app has no bedtime scene since 2026-10-09; play limits belong to the device) |
| *Goodnight Mo* (StoryToys; [listing](https://appgoblin.info/apps/706000131)) | app, 18 months and up | Eight pop-up scenes; animals are sent to sleep by touch | **a handful of themed scenes** (our rooms) of the same rule | pop-up scene transitions |
| *Good Night Bo* ([listing](https://apps.apple.com/us/app/id1455604118)) | app, ages 2–6 | An audio story that counts to five as Bo says goodnight to his animal friends; tap, pull and drag | **counting the sleepers aloud** (our "how many?" level) | reading and story pages |
| *Tap to Sleep: Bedtime Stories* ([listing](https://apps.apple.com/app/id6470200980)) | app, ages 2–5 | "Goodnight Zoo": help named zoo animals settle down one by one; calm, minimal animation | **one at a time, named by the voice** (our levels 3–4) | subscription stories |
| *Baby Tina – Bedtime Story* ([listing](https://apps.apple.com/app/id1041947973)) | app | Make the bed, then find toy animals and put them into it | **a hunt for the ones still out** (our "still awake" start) | grooming minigames; its listing declares no privacy details |
| *Goodnight, Gorilla* (Peggy Rathmann; [Nemours reading list for 3-year-olds](https://prelaunch-assets.nemours.org/reading-brightstart/recommended-books/3-year-olds/good-night-gorilla.html)) | picture book | Every animal says goodnight in turn while a small follower collects more of them | **a gentle surprise that rewards looking** (a friend who is still awake) | the mischief that wakes the keeper |
| *The Going to Bed Book* (Sandra Boynton) and *Time for Bed* (Mem Fox) ([a bedtime book list](https://happiestbaby.com/blogs/toddler/bedtime-books)) | board books | The first runs a fixed routine (bath, pajamas, brushing teeth); the second repeats one soothing rhyme for each animal | **the routine's order** (but see below) and a **repeated, rhymed goodnight** | the ship setting |
| Pretend play with a doll or animal ([California infant-toddler framework](https://www.cde.ca.gov/SP/cd/re/itf09cogdevfdsym.asp), [UNC handout](https://www.med.unc.edu/healthsciences/asap/wp-content/uploads/sites/443/2023/08/SymbolicPlay2.pdf)) | real play | A doll told "night-night" in house play appears in the 19–35 month range; a three-step routine (bath, pajamas, sleep) by about 3 | the **order of the routine** and the child as the caregiver; **tuck-in** as an action | the routine's steps themselves (they belong to Story Steps) |

**Developmental and learning sources.**
- **Bedtime routines.** A nightly routine reduced sleep problems and improved mothers' mood in infants (7–18 months) and toddlers (18–36 months) in [Mindell and colleagues' 2009 study of 405 mothers](https://aasm.org/study-shows-institution-of-a-consistent-nightly-bedtime-routine-improves-sleep-in-infants-and-toddlers-as-well-as-maternal-mood/) ([full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC2675894/)). That is about real routines, so it supports the **off-screen suggestion** (say goodnight to the room together), not a claim about the game.
- **Two steps at age two.** The CDC's 2022 milestones list "follows two-step instructions" for about 24 months ([as summarized by Understood](https://www.understood.org/en/articles/developmental-milestones-for-typical-2-year-olds)); a [University of Michigan health page](https://uofmhealth.org/health-library/ue5313) says two-year-olds usually manage simple requests but not two steps. Sources disagree, which is why level 4's toddler placement stays a person check.
- **Sorting by an attribute.** Kindergarten math asks children to classify objects into given categories by color, size, shape or use (CCSS K.MD.B.3, [standard text](https://webnew.ped.state.nm.us/wp-content/uploads/2020/07/K.MD_.B.pdf), [an attribute lesson](https://www.georgiastandards.org/Georgia-Standards/Documents/K-Math-Attributes-Rule-Lesson-Plan.pdf)). That is levels 5 and 8. Searches turned up nothing on "everything except" negation in early childhood, so level 9 has no source behind it, only its own tests.

## What makes sense here

- **Fresh content first.** Round one repeats today, which is why this game is in wave 1. A seeded draw of which friends appear, friends who start asleep, more rooms (a barn, a tent, a boat cabin) and a different yawn for each friend add hours of play with no new rule. The developer's direction of 2026-10-10 is more quantity, and this is the cheapest of it.
- **A reason to grow past preschool.** The audit said to wait for a reason before growing this ladder. The reason is the developer's 2026-10-10 direction ("a lot more quantity… across age bands") and the round-three row that opens a pre-K window. The new levels keep the game calm: they add *what the voice can ask for*, never speed or loss.
- **Every new request is a listening skill, not a quiz.** Sorting by kind or color, counting, a rule with a reason, leaving one friend up. Misses are gentle boings with a hint, as at levels 3–4; counting and free-choice rounds cannot be wrong.
- **Fairness.** A teddy bear is a toy and a bear. Category rounds therefore never include an ambiguous friend (a test asserts it), and nothing ever treats a reasonable answer as wrong.
- **The finale never tells her to go to bed.** *Nighty Night!* ends by sending the child off; this app has no bedtime scene, and the grown-ups' page says play limits belong to the device.
- **Overlaps.** Doing a routine in order (bath, pajamas, story) is Story Steps' "the pet's bedtime"; do not build it here. Matching each friend to its own bed overlaps Habitat Helpers and Animal Snack. Counting is Duck Pond and Market Stall's job; here it only rides the goodnight.
- **Long-term arc.** Lap: one tap puts a friend to sleep. Toddler: find the named friend. Preschool: two names, then "the animals". Pre-K: a kind, a rule with a reason, a count, a color, an exception, and a walk through three rooms. School is not served; Story Steps and the picnic carry that age.

## Proposed ladder

### Fresh content inside existing levels

- **A different room each time (slice 1, built).** Level 1 draws four of the six friends with the seeded RNG instead of always the first four, in the same places, so the room changes between rounds. Levels 3–4 use all six, so only the order changes there.
- **Friends already asleep (slice 1, built).** At level 2 up to two friends start asleep (eyes shut, a few stars up) and at least two stay awake. The instruction is unchanged; she finds the ones still awake. Tapping a sleeper is still a soft tick. Rule tests: the awake count is at least two, sleepers are in the room, level 1 never starts anyone asleep.
- **The stars never shrink (slice 1, built).** The finale keeps the sky at least as full as it was.
- **A yawn, not a hint (proposal).** In tap-everyone levels, a friend still awake stretches and yawns if she has waited a while. It is an invitation, not a timer: no round ends, nothing counts as a hint. Each friend gets its own sleepy sound (`sfx.animal` for the critters, a soft tick-tock fade for the clock).
- **Each friend a note.** Instead of a note that rises with the count, each friend has its own pentatonic step, so a round plays a small tune in the order she chose. The finale keeps its falling bells. (Voice and notes follow `src/audio/notes.ts`.)
- **More rooms, each a data row (slice 2 onward).** A room is a backdrop, a window, six slots (four on the floor, one on the wall, one on a shelf) and six friends. Rooms:
  - **Barn at night**: cow, pig, duck, bunny and a barn cat in the loft, with a hanging lantern. Every animal is an existing critter; the lantern and backdrop are the only new art. The cheapest room, and the closest to *Nighty Night!*.
  - **Tent**: bear, bunny, dog, a campfire that banks down, a lantern, and a flashlight or a toasting pot. New art for the campfire and flashlight.
  - **Boat cabin**: duck, cat, a fishbowl, a lamp and a ship's clock, with a porthole. The fishbowl and clock are already drawn.
  A room's six friends must have distinct names and critter kinds (the teddy is the `bear`, so the tent's bear and the bedroom's teddy never meet), and each room has one light.

### New levels on top

None of these renumbers a saved level. All are proposals except the fresh content above. Preschool's window widens to 3–5 and a **pre-K window 5–10** opens, so the game's bands become lap, toddler, preschool and pre-K. Levels run in difficulty order. The order and the zero-miss levels are decision 1 and 3 below.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | **Goodnight to the animals** | preschool (top), pre-K | "Say goodnight to the animals!" in the bedroom (kitten, puppy, fish) among a lamp and a clock | a kind, in any order | A lamp or clock is a boing and "The lamp is not an animal. Which ones are?"; a glow on a missing animal after two misses. Everyone left falls asleep in the finale | the animals asked for number two to four and the others at least two; **no ambiguous friend (the teddy) is in the room for a kind round**; every member really is of that kind | `kind` on each friend; `NAMES` for the kind; two voice lines; `LevelLine` fix on level 4 (see Cost below); the bot taps the members |
| 6 | **The light goes last** | pre-K | Every friend is awake; the voice says "Say goodnight to everyone, and the lamp last." | an order rule with a reason: the light helps us see | Tapping the lamp early is a gentle boing: "The lamp helps us see. Let the others go to sleep first."; glow on any awake friend after two | the room has a light; the solution puts the light last and any order of the rest works | `kind: light` on lamp and lantern; two voice lines; the bot taps the light last |
| 7 | **How many?** | pre-K | "Say goodnight to three friends!" Each goodnight is counted aloud, "one… two… three", and the rest stay awake | counting out a quantity of 2 to 4 | No wrong answer: she cannot go past the count, and any friends are right. A counting voice is the support | the target never exceeds the friends in the room; the count is spoken for each goodnight | a number voice for 1–6; no misses by design (decision 3) |
| 8 | **The color** | pre-K | "Say goodnight to the brown ones!" (teddy and puppy) | an attribute, color | A wrong color is a boing and "That one is orange. Which are brown?"; glow after two | each asked color has two or three members in the room and at least two non-members; every friend's color is one named hue | `color` on each friend; color voice lines; a legibility look at the lamp's yellow and the kitten's orange |
| 9 | **Everyone but the one** | pre-K | "Say goodnight to everyone but the lamp. It is our night-light." The lamp stays up with a warm glow | an exception | Tapping the one that stays up is a gentle boing, "The lamp stays awake."; glow after two | the excluded friend is in the room and at least three others remain | an awake glow for the excluded friend as the final picture; `night.except` lines |
| 10 | **Goodnight, everywhere** | pre-K | A big arrow takes her from the bedroom to the barn to the tent; each room asks for everyone, then the stars fill the sky | a longer, calm round across three rooms | No wrong answers; the arrow needs no reading | a tour uses distinct rooms; every room's friends are all reachable | needs at least three rooms (slice 8); one sticker for the whole tour |

The **cost on level 5**, which a build must not forget: the how-to card's level-4 step is open-ended (`{ from: 4, text: 'Tap the two things in the order they are named.' }`), so it must become `{ from: 4, to: 4, … }` or it appears on level 5's card; the howto test does not catch it. The browser suite `night` loops `level <= 4` and the registry test lists the game's ranges, so both change with the first new level, and `fingerdemo` plays the new top level.

### Younger-band openings

**None to add.** The game already serves lap from level 1, which is the youngest band. The two choices that make level 1 easier or harder for a one-year-old are in the next section.

### Levels below level 1 (waiting on the level-order decisions)

Both wait on [how levels are ordered for a band](../ROADMAP.md#waiting-on-the-developer) and on whether a band's range may skip.

- **One friend.** A single large sleepy friend in an almost empty room: one tap, the whole settle, the sticker. Rule test: exactly one thing, no requests, no misses. Cost: a plan row and a bigger hit area.
- **Any tap puts the next friend to sleep.** For a child who cannot yet aim, a tap anywhere sends the next friend off. Rule test: every tap on the room advances; the round ends after the last friend. Cost: a mode and a bot.
- **Tuck-in (a drag).** Drag a blanket onto each friend, which is a fine-motor step for a two-year-old and echoes pretend play. Uses `src/engine/drag.ts`; the target is the friend, with a nearest-target rule. It is easier than level 3 but would sit above level 9 unless the order changes.

### Left out on purpose

- **Three in order**: extra memory load, and level 4 already holds two.
- **Purchased animals and a "now you go to bed" ending**: the rules and the 2026-10-09 decision exclude both.
- **A routine in order (bath, pajamas, story, hug)**: that is Story Steps' "the pet's bedtime"; point it there.
- **Matching a friend to its bed**: overlaps Habitat Helpers and Animal Snack.
- **Timers, a "sleeping" meter that rewards speed, a score**: no pressure here.
- **A couch entry**: a calm solo game that two people on a sofa share by whispering, which the co-play tip already says.
- **A journal entry, a treehouse object or a picnic step**: none is needed; a barn visit could file an entry later if the journal wants one.

## Decisions for the developer

1. **Level order of 5–10 and the new windows.** Lean: 5 animals, 6 light last, 7 how many, 8 color, 9 everyone but, 10 a tour; preschool 3–5, pre-K 5–10. If you want the youngest bands to keep it simple, preschool could stay 3–4.
2. **The teddy is not "an animal".** Lean: keep ambiguous friends out of kind rounds (a test asserts it) rather than counting a teddy as a free tap.
3. **Levels with no way to be wrong (7 and 10) climb at once.** Two smooth rounds step her up, so she reaches 10 quickly. Lean: accept it, since they are the reward levels, or add a "how many are asleep now?" question before the finale.
4. **The toddler window includes level 4 (two names in order).** Lean: keep it; it has a glow and no penalty. A person check on a two-year-old decides.
5. **Levels below level 1 and tuck-in** wait on the existing level-order and range-skip rows in [Waiting on the developer](../ROADMAP.md#waiting-on-the-developer); no new row.

## Build slices, in order

Each is sized for one session. A slice that adds a level is built in level order so the saved IDs stay unbroken.

1. **A different room each time** (ready, **built in this session**): the seeded draw, friends who start asleep, the finale's stars. Tier: typecheck, the game's rule tests, one `BROWSER_SUITE=night` pass.
2. **Slot-based rooms and the barn** (ready): rooms as data (`spot()` becomes slot-based; `makeRequests` and `thingToTap` already take the drawn room after slice 1), a lantern, a window variant, `NAMES` for each new friend, and a pool test that every room fits every level. Tier: rule tests, one browser play, one portrait screenshot.
3. **Level 5, the animals, and the pre-K window** (ready after 2): `kind`, the band row, the level-4 `LevelLine` bound, registry tests, the browser loop, `fingerdemo`. Tier: new level on an existing interaction.
4. **Level 6, the light goes last** (ready).
5. **Level 7, how many?** (ready; decision 3).
6. **Level 8, the color** (ready).
7. **Level 9, everyone but the one** (ready).
8. **Tent and boat cabin rooms** (ready, new art).
9. **Level 10, goodnight everywhere** (ready after 8).
10. **Yawn nudge and a note per friend** (ready, any time; sound only).
11. **Levels below level 1 and tuck-in** (waits on the level-order decisions).

## What was built in this session

See the end of this file once slice 1 is recorded.
