# Sound Garden deep dive

*ID `sound-garden` · bands lap, toddler, preschool, pre-K · levels 1–6 on 2026-10-17 · session `claude/dive-sound-garden` ([PR #521](https://github.com/rjdunlap/neo/pull/521))*

## The game today

She taps garden creatures to hear them sing, then listens to a sound from a singing bush and taps the picture that matches it: high or low, fast or slow, up or down. One level has her echo a woodpecker's knocks on a drum. The learning is listening: telling pitch, tempo and melodic direction apart, and repeating a short rhythm. The island's music loop is silenced (`silenced(STYLES.lullaby)`), so nothing plays under the sounds she is judging.

| Level | Plan (`PLANS` in `logic.ts`) | Band windows (`LEVELS`) | What she decides |
| --- | --- | --- | --- |
| 1 | `play`, 12 taps: *Tap the garden friends to hear them sing* | lap (1–1), toddler (1–2) | Which of five singers to tap (bird, frog, bunny, bell, woodpecker). Free play: no wrong answers; it ends after 12 taps |
| 2 | `highlow`, 5 questions: *High or low? Bird or frog* | toddler, preschool (2–4) | Bird tile (high) or frog tile (low) after three marimba notes |
| 3 | `fastslow`, 5: *Fast or slow? Bunny or turtle* | preschool, pre-K (3–6) | Bunny (fast) or turtle (slow) after a drum pattern |
| 4 | `updown`, 5: *Does the tune go up or down?* | preschool, pre-K | A rising or falling staircase picture after a four-note tune |
| 5 | `echo`, 4 rhythms: *Echo the woodpecker's rhythm on the drum* | pre-K | Tap the drum back with the same short and long gaps (2–4 taps) |
| 6 | `mix`, 6: *Mixed listening* | pre-K | Two questions of each kind, shuffled |

**Content pools.** The listening questions (levels 2–4 and 6) carry seeded sounds (`makeSounds` in `logic.ts`; a sound is timed notes in a span, voiced marimba, bell, pluck or drum). High/low is one instrument, a low step in −4..2 and a high step in 6..12 at least five steps apart, three repeats each; fast/slow is the same step and instrument over the same 2.0 s span, 8 beats against 4; up/down is a 3–5 note tune moving one or two steps at a time from a seeded start, down being the up tune reversed. Replays play the same notes. `makeQuestions` picks the answer, balanced so no answer comes three times running. The echo pool is 8 rhythms (`RHYTHMS`: two one-gap, three two-gap, three three-gap patterns), and `makeRhythms` starts with short ones. Free play has five singers with fixed voices (`sfx.chirp` stepping through 10–13, `croak`, the bunny plays `drum`, the bell steps through five pitches, the woodpecker `knock`s).

**Mistakes and hints.** A wrong tile or a wrong echo is a boing, "Listen again!" and the sound once more; two misses light the right tile with a glow, or draw dots spaced like the rhythm over the drum. The bush (or the woodpecker) replays the sound on a tap. Answers are always pictures (bird and frog, bunny and turtle, a staircase), and on the high/low level the bird tile sits 40 units higher than the frog's.

**Known gaps** (found reading the code; 1 and 2 fixed by slice 1, 3 partly, 6 partly):

1. **Fixed sounds (fixed, slice 1).** Every high/low round is the same two remembered sounds, so after a few rounds the question is "which of two sounds I already know", not a pitch judgment; up/down never varies its start, length or instrument. Replays never vary.
2. **Fast or slow mixes three cues (fixed, slice 1: equal span, same step, 8 beats against 4).** Fast is 8 beats over 1.28 s, slow 3 beats over 1.86 s, so "lots of drums" and "a short clip" answer it as well as tempo does.
3. **The pictures are never heard (partly fixed, slice 1: the bird and frog tiles sing the high and low note as they pop in; the turtle in free play and the unpitched croak wait for slice 2).** The bush plays a marimba, not a bird; the turtle never appears in free play, and the frog's croak (110 Hz with jitter) is not on the pentatonic scale, so "low like the frog" is told, not shown.
4. **Silent busy taps.** Tiles, bush and drum ignore taps while the sound plays or a line is spoken; level 1 ignores taps on the grass. This is the busy-window gap that [V2](../definitions/visual-identity.md) says to fix in another tap game only after a person has played the Animal Snack pilot.
5. **The echo level hides the rhythm.** The knocks leave nothing to see until two misses; one tap followed by a pause is judged a miss after 2.2 s.
6. **Mix is fixed at two of each** (the how-to card's last step is now capped `{ from: 6, to: 6 }`, done in slice 1).
7. **No school band** (pre-K tops out at 6), no couch entry, no journal entry, no off-screen card beyond the module's `offScreen` line.

**Couplings.** Level 2 is the Sound Garden step of the proposed Missing Melody story ([roadmap chunk 7](../ROADMAP.md#chunks)): fresh sounds may change what it plays, not its rule. The ghost finger taps each singer in turn (`singerToTap`), waits on `busy`, taps `tileFor(q)`, and echoes with `echoRest`; tests cover all three.

**Person and device checks.** The quiet-games row in [DEVICE-CHECKS](../DEVICE-CHECKS.md) (music loop under the garden) and the clarity row (free play satisfying, guided modes clear) are still open. Nobody has seen whether she answers high/low by the sound or by the bird's place on screen.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| **Electroplankton** (Nintendo DS, 2005; [Shacknews review](https://www.shacknews.com/article/39048/electroplankton-review), opened) | Ten creature instruments | None: each plankton is a separate toy (Hanenbow's leaves each have a pitch; Sun-Animalcule's pitch comes from screen position; Luminaria's arrows route the plankton). No goals, no saving | The game's named reference: each creature has one way of sounding that you learn by touching it. Free play stays goal-free | Its lack of an ending; Sound Garden keeps a 12-tap gentle finish |
| **Loopimal** (Yatatoy; [Common Sense review](https://www.commonsensemedia.org/app-reviews/loopimal-by-yatatoy), opened) | Toddler loop builder | Open-ended: six animals, five blocks each, up to eight slots and one, two or four layers. Everything is in C major so any mix sounds good; no words | Each animal's sound being its own motion; every combination consonant (our pentatonic rule) | No saving (reviewers' main complaint) |
| **Toca Band** (Toca Boca; [ACCM review](https://childrenandmedia.org.au/app-reviews/apps/toca-band), opened) | Arrange a stage | Sixteen characters on three stage rows; the higher row plays more boisterously; one star spot gives a solo you play by tapping. One song only | Arranging singers on a stage, a featured soloist, the band answering her | The cross-promotion and newsletter sign-up behind "Toca News"; a single song that tires adults |
| **Blob Opera** (Google Arts & Culture; [experiment page](https://experiments.withgoogle.com/blob-opera), opened) | Drag-to-sing | "Drag the blobs up and down to change pitch"; forward/back changes the vowel; the others harmonize | **Sing Higher**: dragging a singer up raises its note, snapped to pentatonic steps (IDEAS already assigns it here) | Machine-learned harmony and free pitch; we snap to `notes.ts` |
| **Chrome Music Lab: Kandinsky** ([summary from a teacher article](https://www.techlearning.com/news/learning-music-art-science-math-and-more-with-chrome-music-lab), search summary) | Draw a sound | Drawing high on the page sounds higher; shapes become voices | A drawn line as a visible contour of a tune | Free drawing as a pitch tool (Rainbow Fingers and Song Maker own drawing) |
| **Rhythm Heaven** (Nintendo DS, 2008; [Game Informer review](https://gameinformer.com/games/rhythm_heaven/b/nintendo_ds/archive/2009/09/22/review), search summary) | Call-and-response rhythm | Each minigame has a short tutorial for its one gesture, then new situations; visual cues show the pattern; you learn rhythm by feel, not notation | Showing the rhythm's shape while it plays, and a payoff animation for a good echo | Scored timing grades, "try again" ratings, speed |
| **JumpStart Music** (1998; recalled, see IDEAS) | Listening games in a story world | A belly-drum rhythm to copy; "find the sour notes"; free play on bridge strings | Listening as a world errand (fits the rework's concert project) | Collecting enemies, timers |
| **Simon** (Hasbro; recalled) | Echo a growing sequence | The sequence grows by one each time; a mistake ends the game | Echoes that grow by one tap at a time | Ending on a mistake; ever-growing memory load |
| **Classroom pre-K and K music** ([Richmond County pre-K–5 skill list](https://www.rcboe.org//cms/lib/GA01903614/Centricity/Domain/1742/Music%20Skills%20for%20each%20grade%20level.pdf), search summary; [Mehlville K rubric](https://www.mehlvilleschooldistrict.com//Userfiles/DBFiles/server_125121/202206/10514801/0_kindergarten_elementary_music_sbl_rubric_development_.pdf), search summary; [Musicplay high/low activities](https://blog.musicplay.ca/high-low-manipulatives-games-songs-and-activities), search summary) | Curriculum | Pre-K: show high, middle and low sounds; tell whether a melody goes up, down **or stays the same**; loud and quiet, fast and slow; feel and play a steady beat. K: discriminate the same pairs | The three-way up/down/same contour; contrasts introduced one at a time | Grading; the rubric warns that children confuse up/down and high/low with louder/quieter, and Musicplay notes "turn it higher" means louder at home |

**Developmental sources.**

- **Babies hear the beat and the tune's shape.** Newborns' brains expect the downbeat of a drum rhythm (Winkler et al. 2009, PNAS 106(7); [Physics Today summary](https://physicstoday.aip.org/news/newborn-babies-feel-the-beat), search summary), and six-month-olds recognize a melody moved up or down, so they hear relative pitch (Plantinga and Trainor 2005; [Trainor lab page](https://trainorlab.mcmaster.ca/publications/PlantingaTrainor2005), search summary). *Use:* a lap child can enjoy a rhythm and a contour long before she can name either; give lap and toddler repetition and contrast, not questions.
- **The words "high" and "low" for pitch come late.** Five-year-olds learning Dutch read height-pitch words in reverse, and full understanding came only at about 11; Turkish-speaking children reversed the association (Dolscheid, Hunnius and Majid 2015; Dolscheid et al. 2022, *Developmental Science*, doi 10.1111/desc.13341; [Koç University record](https://research.hub.ku.edu.tr/entities/publication/9b8f7585-c758-4fb3-9247-14035c76747d), search summary; the paper itself was not opened). *Use:* keep the creature picture as the answer, not the word or the tile's height; treat level 2's spoken "high" and "low" as vocabulary exposure, and never claim she has learned pitch words from it. The same goes for up/down, which should be tied to something concrete moving up or down.
- **No timing window for under-fives is published** (IDEAS, research notes): the echo judge's relative-gap rule stays the precedent; start wide and show the pulse.

## What makes sense here

Sound Garden owns **pure listening** (the [music](subjects/music-instruments.md) and [body/health](subjects/body-health.md) studies both say so). Song Maker owns kept melodies, Jelly Drums note echoes and "same or different?", Rhythm Neighbors call-and-response timing, Beat Builder edited scores, and the proposed Little Conductor live tempo and dynamics. So the ladder grows by **contrasts heard more fairly and in more ways**, a **creative singing mode** (Sing Higher), and a **sound she copies with her own singer**, rather than by speed or longer memory.

**Fits the rules:**

- **Fair, varied listening:** many registers, instruments and lengths, with only the asked attribute differing between the two answers. Pitch is heard relatively, so a varied register needs a reference in the same round: the bird and frog each sing their note as their tiles appear.
- **Up, down or the same**, the pre-K curriculum's three-way contour, as a new level.
- **Sing Higher** (Blob Opera, IDEAS): drag a singer up and it sings higher, snapped to steps. Creative, with no wrong answers; then a level where she copies a two- or three-note shape the bird sang, judged by direction only.
- **Echo support:** the woodpecker's knocks leave dots as they sound (Rhythm Heaven's cue, "show the pulse"), and Echo Knock's sleepy tree becomes the level 5 payoff (IDEAS says its value is the scene, not a new level).
- **Lap:** one big singer in focus, the whole screen its body (the rework's lap stage: "one creature in focus, one or two immediate toys").

**Leave out:** scored timing, a growing Simon sequence, a rhythm that must be held in memory without a replay, any listening "streak", and mixing loudness into up/down before each has stood alone (the rubric's confusion). **Loud or quiet** is the IDEAS row's level 7, but it waits: dynamics are the proposed Little Conductor's subject ([WAITING](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer), Music row), absolute loudness depends on the device's volume, and the rubric's high/loud confusion argues for a relative pair heard in one round. **Who sang?** (animal voice identification) overlaps Animal Snack's *Who's Calling?* and Peekaboo Barn's sound-first reveal, so it waits too.

**Long arc.** Lap: one singer, then five, any touch sings. Toddler: free play with the answer creatures in it, then high or low against heard references, and Sing Higher. Preschool: fast or slow, up or down, singing a shape. Pre-K: up/down/same, echoes with visible dots, copying a contour, mixed listening. School: only by decision (two attributes at once, rhythm cards). In the rework, the garden is the "how can everyone hear the concert?" project's first stop: singers she has listened to stay in her garden and chorus.

## Experience and presentation

- **First unsupported action:** a lap child's tap anywhere on the one big singer at proposed level 8; at level 1, tapping any of the singers. Pleasure comes from the singer's squash and stretch, a star puff and the sound arriving on touch-down.
- **Touch-down and consequence:** singers already squash on tap. The listening tiles answer only after the sound; the busy-window silence (gap 4) waits on V2. The consequence of a right answer should be the creature itself singing: the bird tile chirps its high step as it sparkles, the frog croaks low, the turtle plods. Then the round resets with new tiles popping in.
- **Art and sound example:** the turtle's slow answer as a `Graphics` turtle that steps once per slow drum beat, its shell bobbing on `ctx.tw` with `ease.outBack`, while the bunny tile hops eight times to the fast pattern. Both patterns last the same 2.0 s, so the eye sees the same span with more hops. A pitched `sfx.croak` variant on step −3 (`stepHz`) keeps the frog on the pentatonic scale.
- **What varies on replay without changing the rule:** register (bird and frog pairs drawn from step sets, at least five steps apart), the instrument (marimba, bell, chirp), contour length (3–5 notes) and start step, the echo rhythm, and which singers stand in the free-play garden.
- **Reasoning versus reading, memory and precision:** no reading anywhere; the bush replays on request, so nothing must be held in memory; the echo judge compares gaps with each other, not with a metronome. Up/down and high/low depend on the picture, not the word.
- **Supported ending and replay:** free play ends after its taps; listening and echo rounds always reach the end through the glow or dots. The celebration's "again" replays with fresh sounds.
- **Co-play:** the module's hint already has the grown-up sing along with a hand high for "tweet" and low for "ribbit", making the space-pitch link physical; at Sing Higher a grown-up can sing a note for her to find. Solo play needs nothing.
- **Needs a person or a device:** whether a one-year-old taps the big singer again and again (level 8); whether she picks high/low by the sound or by the tile's height (try once with the 40-unit offset off); whether fast/slow at equal length still reads on an iPad speaker; whether the echo dots help or tempt her to tap the dots.

## Proposed ladder

### Fresh content inside existing levels

- **Levels 2–4 and 6: fair, varied sounds** (slice 1). Move each question's sound into `logic.ts` as a list of notes (`{ at, step, voice }`) built from the seeded RNG: high/low picks a pair of steps at least five apart from a register table and plays the bird's and frog's own note as their tiles appear; fast/slow plays the same step and the same 2.0 s span, fast 8 beats against slow 4; up/down picks a start step, 3–5 notes and one instrument. *Rule tests:* every step is on the pentatonic scale (an integer step), the two answers of a question differ only in the asked attribute (same instrument and span), tunes strictly rise or strictly fall, high is always higher than low within a round, replays repeat the same notes.
- **Level 1: the whole cast sings its listening role** (slice 2). The turtle joins free play with a slow two-beat tock, the bunny's patter becomes quick, the frog's croak moves onto a pitched step, and a seeded pick of five from the six singers fills the garden each round, so every answer picture has been heard before level 2. The ghost finger still taps each one in turn (`singerToTap` reads the round's cast).
- **Level 5: echo you can see** (slice 4). Each knock drops a dot under the woodpecker spaced like the gap (the hint's drawing, shown from the start and fading after her first tap); the pool grows to 12 rhythms with a four-gap pattern for the last round; a good echo wakes the sleepy tree, which answers with a flourish of knocks. The hint becomes the drum lighting for each tap still to come.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Up, down or the same** | pre-K (order 3, 4, 5, 6, 7, 9, 10) | Three tiles: today's rising and falling staircases and a new flat path (no creatures, so the bunny and turtle keep their level-3 meaning); the bush plays 3–4 notes | Which of three directions | Boing, replay; glow after two misses. Same tune is one repeated step | Each answer's tune matches its direction; "same" tunes have one step; no answer three times running; three tiles at least 100 units apart and clear of the pet | One new tile picture (the flat path, Graphics); voice `sg.same`, `sg.updownsame`; how-to step; bot via `tileFor` for three |
| 8 | **One big friend** | lap entry (`entryLevels: [8]`, lap order 8, 1) | One singer fills the middle of the screen; any touch makes it sing; after four taps it waves and the next walks in | Nothing to get wrong: tap, watch, listen | None (free play; 12 taps finish) | The cast cycles through all five; every touch inside the view, outside the corner buttons and the pet's corner, is on the singer | Uses the existing singers scaled up; voice `sg.big`; ghost finger taps the middle; touches the V2 question only if it reuses level 1's busy rule |
| 9 | **Sing Higher** | preschool (order 2, 3, 4, 9) and pre-K (before 10) | The bird sits on a tall flower stem; drag it up and it sings higher, down and lower, snapped to 6 steps; the bell, frog and bunny join in on the step below | Where to put each note: creative | None. Ends after 12 notes sung (a gentle finish); nothing counted as a miss | Every drag height maps to a pentatonic step in range (`stepFromUnit`); the step shown equals the step heard; no misses or hints recorded | New interaction: a custom vertical drag with cancel and palm rejection, a `via` drag bot, how-to, voice; the module's `silenced(STYLES.lullaby)` already keeps the loop out |
| 10 | **Copy the shape** | pre-K (after 9) | The bird sings two notes going up; she drags her own singer to sing two notes that go up too | The direction of each step she sings | Wrong direction: boing, the bird sings again with its stem lighting the way; glow on the right half of the stem after two misses. Any notes with the right directions count | The judge accepts every melody with the asked directions and refuses each wrong one; three-note shapes only after two-note ones | Reuses slice 6's drag; the bot drags to a target step; after level 9 lands |

### Younger-band openings

- **Lap** gets level 8 above (one creature in focus), and level 1's richer cast. The busy-window and grass taps at level 1 ("every touch answers") wait on V2's person check.
- **Toddler** would get *Who sang?* (the bush plays the bird's chirp or the frog's croak; tap the singer). It overlaps Animal Snack's *Who's Calling?* and Peekaboo Barn's sound-first reveal: a decision. Sing Higher could open to toddler once a person has watched a preschooler drag it.

### Easier entries and levels between existing ones

- Level 8 is the appended lap entry (`entryLevels: [8]`, lap order 8, 1; toddler keeps 1–2).
- Level 9 sits inside preschool by `order` (2, 3, 4, 9) and pre-K's order runs 3, 4, 5, 6, 7, 9, 10, so a pre-K child meets the drag before copying with it. No saved level is renumbered.
- Proposed but gated: **11 Who sang?** (toddler, between 1 and 2), **12 Loud or quiet** (pre-K, a relative pair at one step, no up/down words), **13 Two at once** ("high and fast": four tiles, school window).

### Left out on purpose

Speed rounds, a Simon sequence that grows until a mistake, scored timing, a microphone (no recording or singing detection), free continuous pitch, loudness mixed with up/down, and a school band without a decision.

## Decisions for the developer

1. **Toddler *Who sang?* (11):** a Sound Garden level, or leave voice identification to Animal Snack's *Who's Calling?* and Peekaboo Barn? Lean: leave it there, and give Sound Garden's toddlers Sing Higher once watched.
2. **Loud or quiet (12):** in Sound Garden as a heard relative pair, or wait for Little Conductor to own dynamics? Lean: wait for the Music row's Little Conductor decision; if Sound Garden gets it, a device check on the iPad speaker comes first.
3. **School window:** *Two at once* (13) and rhythm cards (pick the card the woodpecker knocked) would open Sound Garden to school; they overlap Jelly Drums 11 *Same or different?* and the proposed Sour Note. Lean: no school window until Jelly Drums 11 lands.
4. **Rework hook, the garden chorus:** after a listening round, the creature she listened to stays in her free-play garden for good and she can arrange the stage (Toca Band; IDEAS *Treehouse Chorus*), as the first step of the brief's concert project. Waits on the rework's home and collection slices.

## Build slices, in order

1. **Fair, varied listening** (levels 2–4, 6; existing-game bug fix on an unchanged interaction): sound specs in `logic.ts` from the seeded RNG, equal-span fast/slow, varied register with the bird and frog as heard references, varied up/down tunes; level 2's rule unchanged for the Missing Melody. Also two guards for every later slice: `PLANS` becomes a table keyed by stable level ID (today `planFor` indexes by array position, so 8 could not land before 7), and the how-to's last step is capped at `{ from: 6, to: 6 }`. Checks: `npm run typecheck`, Sound Garden's rule tests, one filtered regression play of levels 2–4 and 6; `fingerdemo` only if the bot's wait changes. Built 2026-10-20 ([#656](https://github.com/rjdunlap/neo/pull/656)).
2. **The whole cast sings** (level 1 content): the turtle joins, pitched frog, quick bunny, seeded cast of five from six; `singerToTap` reads the cast. Checks: typecheck, rule tests (every singer heard in 12 taps), one filtered play and `fingerdemo` at level 1.
3. **Level 7 Up, down or the same** (new level on the existing tap interaction): three tiles, the flat-path picture and voice, a how-to step. Checks: typecheck, rule tests, one browser play at 7 and `fingerdemo` at 7, one portrait screenshot (three tiles).
4. **Echo you can see** (level 5): knock dots from the start, 12 rhythms, the sleepy tree's answer, a per-tap hint. Checks: typecheck, rule tests (dot spacing follows gaps, pool lengths), one filtered play at 5 and `fingerdemo` at 5.
5. **Level 8 One big friend** (new lap entry): `entryLevels`, lap order 8, 1, the big-singer layout. Checks: typecheck, unit tests (order and entry), one play at 8, `fingerdemo` at 8, one portrait screenshot.
6. **Level 9 Sing Higher** (new interaction): the vertical drag, snapped steps, creative finish, a drag bot, how-to and voice. Checks: the new-interaction tier (scripted play with first and last notes, a cancelled drag, one portrait screenshot, `fingerdemo`).
7. **Level 10 Copy the shape** (new level on slice 6's interaction): the direction judge, two-then-three-note shapes, the stem hint. Checks: typecheck, rule tests, one play at 10, `fingerdemo` at 10.

Gated: level 1's every-touch retrofit (V2's person check); levels 11, 12 and 13 and the garden chorus (decisions above).

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
