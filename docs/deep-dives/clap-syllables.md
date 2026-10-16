# Clap the Syllables deep dive

*ID `clap-syllables` · bands preschool, pre-K, school · levels 1–6 on 2026-10-16 · session `claude/clap-syllables-deep-dive` ([PR #301](https://github.com/rjdunlap/neo/pull/301))*

## The game today

She hears that words are made of beats: the pet says a word and claps it, she claps along, claps alone, sorts pictures into clap bins, or hears claps and finds the picture. Learning: syllable segmentation and counting (phonological awareness), with a rhythm feel. Source baseline: `origin/main` `07a3099`; inspected `src/games/clap-syllables/` (`logic.ts`, `index.ts`, `logic.test.ts`), its [GAMES.md](../GAMES.md#clap-the-syllables) entry, its how-to card and its voice lines (`clap.*`).

Band windows (`LEVELS`): preschool 1–2, pre-K 2–4, school 5–6. No lap or toddler window; no couch entry.

| Level | Plan | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | Along: 3 words, up to 2 beats | preschool | Tap the big hands once per beat; each tap lights the next bead, so it cannot go wrong |
| 2 | Solo: 3 words, up to 3 beats | preschool, pre-K | Clap by herself; 1.5 s of quiet ends the word and her claps are counted |
| 3 | Sort: 5 pictures, up to 3 | pre-K | Drag each picture to the 1-, 2- or 3-clap bin |
| 4 | Match: 4 questions, up to 3 | pre-K | Hear N claps, tap the one picture (of three) with N beats |
| 5 | Sort: 8 pictures, up to 4 | school | Four bins; long words |
| 6 | Beat train: 3 trains of 3 pictures, counts 1–4 | school | Drag each picture into the train car for its count, fewest at the back |

Content: 29 words with pictures — 16 one-beat, 6 two-beat, 5 three-beat and only **2 four-beat** (watermelon, helicopter). Rounds never repeat a word within a round, but level 5 always contains both four-beat words, so its hardest bin is the same two pictures every time.

### How it plays, from the source

- A wrong solo count: boing, `clap.try`, the pet's demonstration, another go; a second wrong shows the beads and switches to guided (each clap lights one bead, so the word can be finished), counting one hint. Sort and match misses say the word and its count and clap it out; a second miss glows the right bin or picture and counts one hint. A drop in empty space is no miss.
- A clap is a count, not a timing; there is no rhythm judge.
- After 8 s without a clap the pet shows the word again.
- Music is silenced (`STYLES.paint`) so her claps are the only beat.

### Known gaps and person checks

- Four-beat pool of two; level 5 repeats the same pictures. The cheapest real improvement is more words.
- The solo judge ends a word after 1.5 s of quiet. A small child who pauses mid-word is counted wrong, a surprise with no visible cue. Observe with a person; a visible "wait" cue costs little.
- Friends' and family names are left out (no syllable counter). The coplay hint tells the grown-up to try names, so the game suggests off-screen what it cannot do on screen.
- Words with dialect-dependent counts (family, camera, every, vegetable, chocolate) must stay out; nothing in the tests guards this yet.
- Device speech for each word is unchecked (already in the how-to note); isolated fragments ("ter", "ple") would be less clear still.
- No ghost finger or how-to gap: `touchDemo` is set and the card has per-level steps.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Classroom syllable clapping and tapping ([Reading Rockets](https://www.readingrockets.org/topics/developmental-milestones/articles/development-phonological-skills)) | Teaching practice | Counting, tapping, blending, then segmenting words into syllables | Count first, then blend and delete; use her own body as the instrument | Printed syllable cards: she is not reading yet |
| Phonological-awareness ladder ([Newcastle](https://research.ncl.ac.uk/phonologicalawareness/aboutphonologicalawareness/phonologicalawarenessdevelopment)) | Developmental reference | Words, syllables, onset and rime, then phonemes; children blend before they segment | Blending ("put the word together") as an easier sibling of segmenting; stay at syllables | Phoneme work, which Word Monsters and Letter Trails own |
| Syllable segmentation vs. phonemes ([overview](https://en.wikipedia.org/wiki/Phonological_awareness)) | Reference | Syllable analysis is easier and earlier than phoneme analysis | Keep the game's whole ladder at the syllable unit; deepen with ordering and comparing rather than smaller sounds | Moving to phonemes inside this game |
| [Teach Your Monster to Read](https://help.teachyourmonster.org/en/articles/5458453-what-does-each-game-cover) | Phonics app | Letter sounds, then blending CVC words; no syllable activities were found | Confirms the gap: syllable work is rare in the big apps | Letter-sound content |
| Rhythm Heaven (already cited by the game) | Rhythm game | Patterns repeat and get busier | Count beats by feel | Timing judgment; this game counts claps, not timing |
| Island games: Rhyme Time, Beat Builder, Critter Sort, Number Trails | In-house | Sorting by a property; ordering by a quantity | Seriation (fewest to most) is already a Number Trails idea | Rhyme and drum grids |

Coverage note: this session did a short web pass of two searches; Reading Rockets' age table did not load, so no exact age for clapping is claimed. App and listicle results are weak sources.

## What makes sense here

Keep the unit at the syllable and the verb at *count*; grow by new decisions on the same beads: order words by length, compare two words, build a word from its beats, and later use her own people's names. Do not add speed or a timer. Rounds already finish with help, so new levels keep the rule that a second miss shows the answer.

## Experience and presentation

- **First unsupported action:** at level 1 she taps the big hands and the next bead lights with a clap sound; nothing can be wrong. Level 2 asks her to do it with the beads hidden.
- **Pleasure and consequence:** the pet's mouth and the lit bead per clap. Idea: the beads ring a pentatonic step each (`src/audio/notes.ts`) so a three-beat word is a tiny rising tune; check what the sound is today before changing it.
- **Variety on replay:** the word and picture set; more words is the main lever.
- **Reasoning vs. other skills:** no reading. Memory load is low. Motor: the solo clap tolerates any pace except a 1.5 s pause, which is the one precision demand and a candidate for a visible cue.
- **Supported ending:** second miss shows the answer; rounds always finish.
- **Co-play:** the grown-up claps and says the word slowly; a solo option is unchanged. Suggested role: the grown-up picks a word from the home and she claps it.
- **Needs a person or device:** whether device speech says every word clearly, whether the 1.5 s pause feels fair, whether a child enjoys the wait-ring.

## Proposed ladder

### Fresh content inside existing levels

More words, each needing a code-drawn picture. Candidates with unambiguous counts. Two beats: tiger, rabbit, monkey, pizza, puppy, kitten, spider, rainbow, pencil, window. Three beats: dinosaur, elephant, kangaroo, tomato, pajamas, pineapple, strawberry, crocodile. Four beats: caterpillar, alligator, motorcycle. Five-beat words stay out unless a five-clap bin is ever wanted. Add a test listing excluded dialect words and asserting each word's parts spell it and fit its stated beat count.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Beat train | school (5–6), prek optional | Three pictures sit in a jumble; she lines them fewest claps to most, left to right, in cars of a train | Order by beat count | A car dropped in the wrong spot returns with the word's count said and clapped; second miss glows the car that goes next; ties (two words with the same count) are accepted either way | Generated sets have at least two distinct counts, equal-count words never form a forced order, and an authored order is a valid solution; the hint targets a correct next car | New mode; reuses drag, beads, bins' layout; ghost finger and how-to step needed; train art is new |
| 7 | Put the word together | school (5–7) | Beads for a word glow one at a time; she taps the picture whose word is being clapped from scattered "parts" bubbles, in order | Build the word in order | Out-of-order tap gently wobbles; second miss glows the next part | Parts in order spell the word; the bubble set contains exactly the parts | **Needs a device speech check**: single syllables ("ter") may be unclear; fall back to saying the whole word and lighting the part, no isolated fragments |
| 8 | Longer or shorter? | preschool opening later (see below), school | Two pictures; she taps the one with more claps, or fewer, the pet saying which | Compare counts | Same miss and hint rule as match | Pairs differ in count; "more" and "fewer" each appear | New spoken prompt only; low cost |

### Younger-band openings

- **Toddler (and lap) clap-along:** level 1 is already unfailable, so a toddler window of level 1 is plausible. Needs a person check that toddlers enjoy tapping big hands with words, and a decision (below). No other change.
- Preschool already reaches level 2; a calmer first level with only one- and two-beat words and two words per round could precede it.

### Easier entries and levels between existing ones

Appended IDs placed with `order` and `entryLevels`: **9, Clap along (short)**: two words, one and two beats only, as an easier first level for preschool and any toddler window. No renumbering of saved levels.

### Left out on purpose

Phoneme work, rhyme (Rhyme Time), a rhythm timing judge, printed syllables, and any speed or timer.

## Decisions for the developer

1. **Names:** may a grown-up type a name's syllable split in the grown-ups' page (a bounded field: "An-na", "Sam") so her own and family names become a level? Otherwise names stay off-screen.
2. **Toddler window:** open level 1 (clap along) to toddler, as a lap-adjacent early taste?
3. **Isolated syllables:** is it acceptable that level 7 depends on device speech being clear, or should it wait for the device-speech check?


## Build slices, in order

1. **More words** (built 2026-10-14; about 12–16 words, with pictures; a dialect exclusion list; spelling and count tests). Unit tests, one portrait screenshot of level 5. Check tier: new content on an existing interaction.
2. **Visible wait cue in solo** (built 2026-10-15, `claude/clap-syllables-wait-ring`, PR #374; a ring that fills over the 1.5 s pause; no rule change). Unit test on the timing constant; one filtered play. Existing-game tier.
3. **Level 6, Beat train** (built 2026-10-16, `claude/clap-beat-train`, [PR #449](https://github.com/rjdunlap/neo/pull/449)). New interaction tier: rule tests, one scripted play (first and last level, wrong drop, hint), ghost finger, how-to card.
4. **Level 8, Longer or shorter?** and **level 9, Clap along (short)** (cheap).
5. Decisions 1–3 before names, a toddler window and level 7.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links and `git diff --check` ran.

**Slice 1, More words (built 2026-10-14, `claude/clap-syllables-more-words`):** nine new words with code-drawn pictures (2 beats: pizza, rainbow, pencil, window, spider; 3: tomato, strawberry, pineapple; 4: caterpillar), 38 in all, short of the 12-16 the slice named, plus a dialect-exclusion test. Typecheck and vitest for `src/games/clap-syllables` and `src/content` passed (93 tests); one screenshot of the new pictures from a probe. Not run: a browser play of the game, a portrait screenshot, a device speech check of the words. Next: slice 2, the visible wait cue.

**Slice 2, Visible wait cue in solo (built 2026-10-15, `claude/clap-syllables-wait-ring`, PR #374):** in solo (level 2) a ring round the hands pad fills over the 1.5 s pause after her last clap, so she can see the word is about to be counted. The fill is a pure `waitFill` in `logic.ts` (unit-tested; 0 before her first clap, clamped to 1), drawn in `index.ts`; the rules are unchanged. Typecheck, `vitest src/games/clap-syllables` (15 tests) and `BROWSER_SUITE=clap` passed on the dev server. Not run: a screenshot of the ring, a portrait view, an iPad or child check. Next: slice 3, Beat train (level 6).

**Slice 3, Level 6 Beat train (built 2026-10-16, `claude/clap-beat-train`, [PR #449](https://github.com/rjdunlap/neo/pull/449)):** school now plays 5-6 (preschool 1-2 and pre-K 2-4 unchanged). Three pictures sit in a jumble above a train of three cars, engine on the right; she drags each into a car, fewest claps at the back to most by the engine, and equal counts are accepted either way round. A round is three trains of three pictures, each with at least two distinct counts, no picture twice, counts 1-4. A drop on a wrong car is a miss (boing, the word's count said and clapped); the second and later misses add a hint and glow the picture for the first empty car; a drop in empty space or on a loaded car is free. A loaded car shows beads; the full train claps each car and chugs away. Rules `fitsCar`, `nextForTrain`, `trainCounts` in `logic.ts`; the ghost finger drags the next fitting picture. The how-to gained a level-6 step and finish, and the level 4 and 5 steps (open-ended `from`) were bounded so level 5 no longer shows the level-4 line. Typecheck, vitest for `src/games/clap-syllables` and `src/content` (99 tests, four new train tests including 200-seed hint/ghost and 500-seed generation) and build passed; `BROWSER_SUITE=clap CLAP_LEVELS=6` and `fingerdemo` at level 6 passed ([proof](../VERIFICATION.md#2026-10-16--clap-the-syllables-level-6-beat-train)). Not run: levels 1-5 browser play, an iPad, device speech, a child. Next: slice 4, levels 8 and 9.
