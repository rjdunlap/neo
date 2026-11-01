# Sing-Along Barn deep dive

*ID `sing-along-barn` · bands lap, toddler, preschool, pre-K · levels 1–6 on 2026-11-01 · session `claude/dive-sing-along-barn`, [PR #1098](https://github.com/rjdunlap/neo/pull/1098)*

## The game today

Any touch anywhere plays the next note of a known song on the marimba; a farm friend trots out of the barn for each verse and answers in its own voice on the verse's answer note, then settles on the bottom row. Learning: song order, animal words and making choices; there are no wrong answers (`misses` and `hints` are always 0). Home land Barnyard. No couch form. It is the second game in the lap/toddler Little surprises Mix pool (Bubble Pop → Sing-Along Barn → Fill and Dump, `src/app/mix-flow.test.ts`) and level 3 is the `friends` step of the proposed Missing Melody story ([definition](../definitions/missing-melody.md)).

| Level | Plan (`PLANS` in `logic.ts`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | One friend, seeded tune and friend | lap, toddler | Nothing but when to tap (25 taps for short Old MacDonald) |
| 2 | Two friends | lap, toddler, preschool | When to tap |
| 3 | `invite`: she taps two of five friends before the song | toddler, preschool, pre-K | Who comes, in what order |
| 4 | `each`: three verses, she picks the next friend at each verse end | pre-K | Who sings next, three times |
| 5 | `chooseTune`: eight tune cards first, then as level 4 | pre-K | Which song, then who sings |
| 6 | `full`: two friends, the whole Old MacDonald verse (47 notes a friend) | pre-K | As level 5 |

**Content pools.** Eight tunes (`TUNES`): Old MacDonald (short; full form at level 6), Hot Cross Buns, Mary Had a Little Lamb, Au Clair de la Lune, Rain Rain Go Away, The Itsy Bitsy Spider (first line only), Bounce High Bounce Low and Ring Around the Rosie. All use only the pentatonic steps C D E G A; the tests say "no exception" for each. Five friends (`ANIMALS`: cow, pig, duck, cat, dog) with synthesized voices; `AnimalSound` also has `cluck`, but there is no hen critter. The seeded draws are the tune (below level 5) and the friends (levels 1–2).

**Known gaps.** [GAMES.md](../GAMES.md#sing-along-barn) said "six songs" though eight are built (corrected by this dive's closeout). The **pentatonic exception** decided 2026-10-23 ([record](../archive/DECISIONS-2026-10-23.md)) is not built: `stepToMidi` only knows pentatonic steps, so Twinkle, Wheels on the Bus and Itsy's second line ("Down came the rain", which needs fa) cannot be written yet. The level 5–6 chooser holds eight cards in one row at scale 0.5 (110 by 100 logical), so a ninth tune needs a second row. The how-to demonstration at level 6 cannot show the moo-moo lines inside 75 seconds. Every melody was written from a tune's standard form, not a printed score, and the long songs' hold on a child are unchecked ([DEVICE-CHECKS](../DEVICE-CHECKS.md)). The [roadmap chunk 18](../ROADMAP.md#next-up) asks for "a repeated-phrase mode, or another pentatonic tune"; the [poetry-wordplay study](subjects/poetry-wordplay.md) proposes **PW2 Finish the line** as a mode here.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Wheels on the Bus](https://apps.apple.com/app/id303076295) (Duck Duck Moose; [Common Sense](https://www.commonsensemedia.org/app-reviews/wheels-on-the-bus), [BridgingApps](https://bridgingapps.org/?p=24093)) | Interactive song book | One song, a page per verse with a touch toy; content variety by language and instrument (violin, cello, piano, kazoo) and a recorded voice | A verse = one friend doing its thing; the friend's sound in the lyric ("the cow on the bus says moo") | Recording a child's voice (the island keeps no recorded audio); one song only, which reviewers say bores over-twos |
| [Magic Piano](https://www.commonsensemedia.org/app-reviews/magic-piano) (Smule; [Macworld](https://www.macworld.com/article/204625/magicpiano.html)) | Tap-to-advance melody | A song is a guide; each tap plays the next pitch-perfect note at her tempo; a "tap anywhere" setting means you cannot miss | Confirms the barn's core: the tune picks the pitch, the child owns rhythm and tempo | Scored song mode, coins, a store |
| [Toca Band](https://www.commonsense.org/education/app/toca-band) ([Horn Book](https://www.hbook.com/story/toca-band-app-review)) | Character band | 16 characters on a stage, each a loop; drag them on and off | Characters who each own a sound; joining one at a time | One song, no save; "Toca News" promotion |
| Fisher-Price Laugh & Learn toys ([parent review](https://motherandbaby.com/reviews/baby-toys/fisher-price-laugh-and-learn-sing-n-learn-shopping-tote)) | Button-press song toys | A press plays a song or phrase; levels by toy, not inside one | A press at nine months already means "song"; clear words a toddler sings along to | Fixed recordings, no pacing by the child |
| Pause-and-finish singing ([PC TALK *Fill in* handout](https://talk.ku.edu/wp-content/uploads/2024/08/Fill-in-PC-TALK-Strategy-Handouts.pdf), University of Kansas) | Adult strategy | The adult pauses before a familiar word, waits 3–5 seconds, accepts any response, then says the word and carries on | The shape of level 7: pause, wait, accept anything, finish the line together | Any judgment of what she says |
| Kodály sequence ([Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method); [MSU Texas](https://msutexas.edu/academics/finearts/music/kodaly/what-is.php); [teacher's sequence](https://mramusicplace.net/2014/07/29/what-are-the-best-pitch-combinations-for-teaching-our-youngest-children-singing/)) | Classroom method | Sol-mi first, then la, do, re (the pentatone); fa and ti only after these are secure | Why the pentatonic tunes came first, and why fa/ti tunes come as a stated exception rather than replacing them | Solfège drill or hand signs as a game goal |
| Head Start music guidance ([*Let's Talk About Music*](https://headstart.gov/video/lets-talk-about-music)); Vermont early learning standards ([VELS](https://vels.education.vermont.gov/node/129)) | Developmental framing | Infants make sound with objects; older toddlers make up simple songs; preschoolers explore instruments | Adapting a known song to the child (a friend's name in the verse); making up simple songs | Claims of school readiness from singing |

The ELOF's own creative-arts indicators were not opened (search summaries only), as in the poetry study.

## What makes sense here

The barn's strength is that a known tune turns any tap into music and a grown-up can sing along. Depth should keep that: **more songs she knows**, then **a moment where the song waits for her** (finishing a line, then choosing the word that rhymes). Speed, scoring a tap's timing, judging her singing voice and recording audio stay out. A tap that comes "early" is never wrong.

The arc: lap and toddler tap to move a song and meet friends (1–2), toddler and preschool finish a familiar line (new level 7), preschool and pre-K choose the rhyming picture that finishes it (new level 8), pre-K chooses songs and friends (4–6). The `school` band stays with Song Maker, Jelly Drums and Sound Garden; the barn does not open it.

## Experience and presentation

- **First unsupported action:** touching the screen anywhere at level 1; the next note sounds at touch-down with a rainbow note particle at the finger and the singing friend hopping. Nothing waits on speech.
- **Consequence and readiness:** the bead row fills one bead per syllable, so a grown-up can see where the line is; at a verse end the friend settles on the row and the next one comes out. At the new levels the song pauses with the last bead breathing and the picture wobbling at the door until she touches it.
- **Art and feel example:** at level 7's pause, reuse the tune's chooser-card drawing (the cow, bun, lamb, moon, cloud, spider, ball, roses) at about 1.4 times the card size beside the door, with a `ctx.tw` wobble every 1.2 seconds and the final note's marimba pitch played softly on each wobble; the touch sings the word, the picture flies into the bead row as its last bead, and the friend answers.
- **Variety without changing the rule:** the seeded tune and friends now; the seeded gap verse and the side of the right picture at level 8.
- **Reasoning, memory, motor:** levels 1–6 ask only for timing and free choices. Level 7 asks for recall of a well-known word with the picture as support. Level 8 asks her to hear which picture's word rhymes with the line before, a phonological skill (RF.K.2 via the poetry study), not memory of the verse: both pictures are named aloud when touched.
- **Supported completion and stopping:** every round ends with one sticker; at level 8 two misses glow the rhyming picture and the pet sings the line with it. The round is a few verses; Home is always available.
- **Co-play:** the grown-up sings and pauses at the gap, the "fill in" strategy above; the child supplies the word by voice or by touch. Solo play loses nothing.
- **Person and device questions:** does a pause read as "your turn" to a two-year-old or as the game stopping; do exception tunes with fa and ti sound right on the iPad marimba; does a pre-K child hear the rhyme between two pictures from the pet's speech; does a 30-note Wheels on the Bus verse hold a toddler.

## Proposed ladder

### Fresh content inside existing levels

- **Tunes with their own notes (the 2026-10-23 exception).** Add an optional semitone field to a phrase, or a separate `midi` path to `sfx.marimba`, so a tune may sound fa and ti. A rule test guards the exception: only tunes on an allow-list in `logic.ts` (`twinkle`, `wheels`) may contain a non-pentatonic note, and every other tune still passes the existing pentatonic tests; free taps elsewhere and Jelly Drums stay five-note. Tunes:
  - **Twinkle, Twinkle, Little Star** (`twinkle`): opening "Twinkle, twinkle, little star, how I wonder what you are" (do do sol sol la la sol, fa fa mi mi re re do; [Hoffman Academy](https://www.hoffmanacademy.com/blog/how-to-play-twinkle-twinkle-little-star-on-the-piano)); each friend's verse "Up above the world so high, like a diamond in the sky" (sol sol fa fa mi mi re ×2), answering on "sky". 14 notes, then 14 a friend.
  - **The Wheels on the Bus** (`wheels`): short form like Old MacDonald's: an opening "The wheels on the bus go round and round, all through the town", then for each friend "The cow on the bus says moo, moo, moo, all through the town". The friend's name sits mid-line, so the phrase model needs a name placeholder (for example `@`) beside the existing `~` sound placeholder; the friend sounds on each "moo". The notes need sol below do and ti, written from a printed score in the building session ([Musicnotes C major listing](https://www.musicnotes.com/marketplace/sheetmusic/MK0095481), [singing-bell chart](https://singing-bell.com/the-wheels-on-the-bus-glockenspiel-xylophone-letters-notes-chart-sheet-music)); the search found no reliable note list, and one claimed C pentatonic, which is doubtful.
  - **Chooser:** ten cards do not fit one row at 110 units; lay them out in two rows of five (a star card and a bus card), checked at the four views. No card shrinks.
- **Itsy Bitsy's second line** ("Down came the rain and washed the spider out"), after the exception exists; source-checked from a score. Small, a later slice.
- **A hen friend** (`cluck` already exists): a new `CRITTERS` spec with a comb and wattle. Art and a critter-spec change; a later slice once a person has judged the five current friends.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *Finish the line* | toddler, preschool (by `order`) | One seeded tune, one friend. She taps through the opening; at the verse's last word the song pauses, the beads stop and the word's picture wobbles beside the door; a touch anywhere sings the word and the friend answers. Two friends | When to finish the line (and, with a grown-up, saying the word) | None: no wrong touch. A touch in the first 0.8 s of the pause wobbles the picture and plays its soft note instead of skipping it, so mashing still meets the picture; then any touch sings. `misses`/`hints` 0 | Every level-7 tune has a gap verse whose gap is the verse's last sung syllable and has a picture; Au Clair (French) is excluded; mashing finishes the song | A `gap` table in `logic.ts` (tune → word, picture); pictures reuse the chooser drawings plus a sky and a spout; voice lines `barn.finish` and the instruction; bot taps once per note and waits out the pause; no couch, journal or picnic change |
| 8 | *Which one finishes it?* | preschool, pre-K (by `order`) | Rain, Rain: "Rain, rain, go away, we want to …"; two pictures, a ball (*play*) and an apple; touching either names it aloud; the rhyming one finishes the line | Which picture's word rhymes with the line before | The non-rhyming picture bounces back with a gentle boing and the pet says the rhyme: "Away … play! They sound the same at the end." Counts a miss; two misses glow the right picture. Free replays of the line by tapping the bead row | Each gap (in the verse, or the opening for Ring's *posies*) has exactly one rhyming picture whose rime matches the earlier line's end word (play/away, sky/high, posies/rosie), the distractor does not rhyme and is a different picture, the right side is seeded and both sides occur, a hint leads to the rhyme | Three rhyme verses at first (Rain, Twinkle, Ring); `misses` begin to count in this game, so adaptation applies here only; the bot picks the right picture after one wrong pick at the demonstration's second gap; voice `barn.rhyme.*` |

Level 7 sits between 3 and 4 for toddler and preschool through `order` (toddler `[1, 2, 3, 7]`, preschool `[2, 3, 7, 8]`, pre-K `[3, 8, 4, 5, 6]` or after 6; the building session chooses pre-K's place by whether level 8's choice feels easier than choosing three friends). The IDs are appended, never renumbered.

### Younger-band openings

None. Lap already starts at level 1; the poetry study's lap rung is the grown-up's pause, which levels 1–2 already allow.

### Easier entries and levels between existing ones

None needed: levels 7 and 8 are placed with `order`, not as entries. No `entryLevels` change.

### Left out on purpose

- **Up or down?** (a pitch-direction choice on Bounce High's *high*/*low*, Kodály's first concept): kept as an idea, not a slice, until a person has seen whether a four-year-old hears direction in the marimba; it would also be the first judged musical answer.
- Judging her voice, timing scores, a tempo target, recorded audio, a school band, a couch form.
- Owned creatures as the singers: the Oct 23 creature rule keeps the farm friends where the word is the role ("he had a cow"), as here.

## Decisions for the developer

None blocking. Under the October 23 standing rules, verse and rhyme content takes the building session's source check (S1), which answers the poetry study's decision 2 for PW2. Leans taken: level 8 counts a non-rhyming pick as a miss (a recall answer, not an experiment or a free choice); the exception is test-guarded to an allow-list of tunes.

## Build slices, in order

1. **Tunes with their own notes: Twinkle and Wheels on the Bus (batch sing-along-barn 1).** The test-guarded exception, the two tunes, the name placeholder, the two-row chooser and the voice lines; the notes source-checked from a score and cited in GAMES. *Check:* existing-interaction tier plus layout: typecheck, the game's rule tests (exception allow-list, one note per syllable, answers, the placeholder), one filtered play at level 5 choosing Twinkle and at level 1 on a Wheels seed, one portrait screenshot of the ten-card chooser, `fingerdemo` at 5, one build for the voice lines and `sfx` change.
2. **Level 7 *Finish the line* (batch sing-along-barn 2),** after batch 1 (Twinkle's gap word). *Check:* new-level tier with `order`: typecheck, unit tests including order, lands and the gap table, one play of level 7 at toddler mashing through the pause, one portrait screenshot of the picture at the door, `fingerdemo` at 7, one build.
3. **Level 8 *Which one finishes it?* (batch sing-along-barn 3),** after batch 2. *Check:* new-interaction tier: typecheck, rule tests for the rhyme table and seeded side, one play of level 8 with one wrong picture, a second for the glow, then the rhyme, one portrait screenshot, `fingerdemo` at 8.
4. **Itsy Bitsy's second line**, after batch 1 (fresh content; score source check, rule tests, one filtered play). Not queued until batch 1 lands.
5. **A hen friend** (sketch: a `CRITTERS` spec change and art; after a person check of the current friends).

## What was built in this session

Nothing: research and ideation only. Links and `git diff --check` ran.
