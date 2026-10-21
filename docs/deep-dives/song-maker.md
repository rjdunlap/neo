# Song Maker deep dive

*ID `song-maker` · bands lap–school · levels 1–7 on 2026-10-17 · session `claude/song-maker-deep-dive` ([PR #510](https://github.com/rjdunlap/neo/pull/510))*

**Research and ideation only.** Nothing under `src/`, `scripts/` or `public/` changed. This answers the [family experience](../FAMILY-EXPERIENCE.md) catalog question for Song Maker: *can a player make and revise a phrase on purpose, answer a friend and perform it?* It also turns the music study's **M4, answer the phrase** ([subject study](subjects/music-instruments.md), [roadmap row](subjects/RECOMMENDATIONS.md#music-and-instruments-recommendations)) into a defined level.

## The game today

A looping grid of jelly beads. Each column is a beat and each row a pitch, and higher on screen always sounds higher (`ROW_STEPS`). A yellow playhead follows the music clock (`music.beats()`), and lit jellies sing (`sfx.marimba`) as it passes. The island's loop is silenced (`silenced(STYLES.jelly)`), so her song is the only music. Purpose: cause and effect at lap; at older bands, copying a short tune from a picture and then by ear, and continuing a pitch pattern. Read from `src/games/song-maker/{index,logic,logic.test}.ts`, `src/content/howto.ts`, the `song.*` lines in `src/content/voice-script.ts`, `src/content/creations.ts`, `RoomScene` and [GAMES.md](../GAMES.md#song-maker), at `84e1433`.

| Level | Plan | Bands whose window holds it | What she decides | Pool |
| --- | --- | --- | --- | --- |
| 1 | `free` 4×3, ends after 12 taps | lap (1–2) | Where to tap. Nothing is wrong | Open |
| 2 | `free` 6×4, ends after 14 taps | lap, toddler (2–4) | Same, on a bigger loop | Open |
| 3 | `ghost` 3 notes on 4×3 | toddler | Which shadow to fill. The shadows show every answer | 96 songs (random columns and rows; never all on one pitch) |
| 4 | `ghost` 5 notes on 6×4 | toddler, preschool (4–6) | Same, with five shadows. **This is the Missing Melody `notes` step** ([definition](../definitions/missing-melody.md)) | 6,120 random songs |
| 5 | `card` 5 notes on 6×4 | preschool, pre-K (5–7) | Match a small wooden card: find each place on the big grid | 6,120 random songs |
| 6 | `pattern` 8×5, first bar given | preschool, pre-K, school (6–7) | What the next bar must be | 5 shapes: stairs up, stairs down, zigzag, hop, twins |
| 7 | `listen` 4 notes on 4×3, a replay button | pre-K, school | Which jelly each heard note is | 78 tunes (one note on every beat) |

**Mistakes and help today.** On copy levels (3–7), a wrong jelly sings, then a boing follows. At level 7 the column's right note also plays, so she can hear the difference. The pet says `song.wrong` or `song.again`. After two misses in a row a hint is counted, the pet says "Try the glowing jelly!" and the next note glows. Free levels (1–2) have no misses or hints. Their song can be kept on the treehouse's **tune plaque** (`RoundResult.creation`, a `TuneCreation`), where the pet sings it. Copied songs are not offered. The ghost-finger bot (`beadToTap`) lights a layered tune in free play and taps only right notes elsewhere. Song Maker has no couch entry.

**Known gaps found in source** (computed from layout code, not measured on a device):

1. **Targets under 100 at levels 5 and 6.** `resize` leaves a 175-unit left margin (pet clearance) and 40 on the right. Card mode starts the grid at 36% of `view.w`. Each bead's hit area is 2.5 × its radius (0.36 cell), so 0.9 of a cell. In the 1024×768 view, level 6 (8×5) gets a cell of (1024−215)/8 ≈ 101, so a hit area of about **91**. Level 5's card layout gets (1024−40−369)/6 ≈ 102.5, so about **92**. Portrait is the same, because `view.w` stays 1024 there. Levels 1–4 and 7 have hit areas of 121–135. The cells themselves are at least 100, so a full-cell hit area meets the rule without moving anything.
2. **Free play ends on a tap count, and un-taps count too.** After 12 or 14 taps the round finishes at the next turn of the loop, even mid-composition. If she has switched most jellies off again, the song may hold fewer than `TUNE_MIN_NOTES` (2). `cleanTune` then returns null, so no keep is offered, although the how-to note promises "a little tree house button" without a condition. The round always finishing is right, especially at lap; only the promise is untrue.
3. **Creative rounds step her up.** A free round reports 0 misses and 0 hints, so `isSmooth` holds. Two free rounds at level 2 move a toddler on to copying at level 3. The shell applies the same rule to every game (`nextLevel` in `src/progress/difficulty.ts`); whether that is right is the open accounting question already in [Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) for music.
4. **The levels are an inline function**, not a `BandLevels` table read with `rangeFor`. The first slice that appends a level and places it with `order` converts it. The saved IDs 1–7 do not change.
5. **On copy levels, trying a jelly is a miss.** A tap on a non-target jelly sings and counts. That fits an explicit copying goal, but it means there is nowhere to audition. The proposed composing levels below separate the two.
6. **No grid has sol or re.** The rows are 3 = C5 E4 C4; 4 = E5 C5 E4 C4; 5 = E5 C5 A4 E4 C4 (`stepToMidi`). Kodály teaching starts from sol–mi (G–E), which no grid offers. This is not a bug: every combination is still consonant. It is a decision, because changing `ROW_STEPS` would change how kept tunes play.
7. **The pattern's name is never spoken**, and level 6 has only five shapes.

**Person and device checks still open:** the iPad listening check for the quiet music games ([DEVICE-CHECKS](../DEVICE-CHECKS.md#needs-a-person-or-a-device), 2026-10-09). Whether a toddler connects row height to pitch, and whether a six-year-old hears "question and answer" as a relationship, are unobserved.

## Similar games

Opened 2026-10-17 unless marked. Publisher pages and reviews describe features, not learning effects. Nothing was played or heard.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Chrome Music Lab **Song Maker** (the app page returned only browser-fallback text; its settings are from a teacher's project guide, [Benoit, LMEA](https://lmeamusic.org/wp-content/uploads/2020/12/Benoit-Chrome-Music-Lab-Song-Maker-Project.pdf)) | Browser grid composer | Settings, not levels: length (4 bars by default), beats per bar, split beats, scale (major, pentatonic, chromatic), start note, range. Benoit's plan grows by teaching: *experiment* ("Make a mess!"), then *arrange* a folk song, then *compose*, then *perform* printed color copies on Boomwhackers | The teacher's constraints: "Teacher provides the start and/or end of the melody, and the student completes it", "Limit pitch range", "Limit intervals". Also the order *experiment → arrange → compose → perform* | Settings panels, chromatic scales, link sharing |
| **Mario Paint** music composer ([Wikipedia](https://en.wikipedia.org/wiki/Mario_Paint)) | Stamp-on-a-staff composer (SNES) | No ladder. 15 icon instruments on a treble clef, quarter notes only, up to 24 bars of 4/4. Songs are reused in the animation and coloring modes | A song made in one place is *used* somewhere else (our plaque, a creature's greeting) | Staff reading, dense icon palette |
| **LOOPIMAL** ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/loopimal-by-yatatoy); [jelly-drums dive](jelly-drums.md)) | Loop toy | Layouts of one, two or four layers. Blocks go into up to eight slots under a looping cursor. No levels, and it cannot save | A looping bar that always sounds good, and a character that performs it | Unsaveable work. We already keep tunes |
| **Toca Band** (search-result summaries of [Gamezebo](https://www.gamezebo.com/reviews/toca-band-review/) and [ACCM](https://childrenandmedia.org.au/app-reviews/apps/toca-band); **not opened**) | Band toy | Where a character stands on stage changes its part; a "star" spot gives one solo. Reviews say every arrangement shares one chord loop | A visible performer for the finished song | Ads and the in-app-purchase news feed. Pre-made loops instead of her own notes |
| **Animal Crossing town/island tune** ([Nookipedia](https://nookipedia.com/wiki/Tune)) | Composition inside a life sim | Up to 16 notes, with a rest, a hold and a random note. Edited at the town hall (Isabelle sings a preview in New Leaf and New Horizons). It plays when villagers greet you, on the hour, at doors, and when happy villagers sing it | **Creation reuse**: the world performs what she wrote. Settles the "unclear" flag on the notebook's [Doorbell Tune](../IDEAS.md#arcade-classics-and-the-animal-crossing-nes-shelf-2026-10-11) row: the player does compose the tune | Hourly chimes and progression gates (Resident Services) |
| **BANDIMAL** and **Incredibox** (opened in the [music study](subjects/music-instruments.md#similar-games-tools-and-unplugged-play), 2026-10-14, not re-opened) | Pentatonic composition; layered avatars | Arrangement, speed and percussion layers; mute/solo | Pitch-safe choices and a performer for each part | Combo unlocks, voting and rankings, public mixes |
| **Orff pentatonic barred instruments** ([Percussion Play](https://www.percussionplay.com/the-pentatonic-scale-for-early-years/); [Wikipedia: Orff Schulwerk](https://en.wikipedia.org/wiki/Orff_Schulwerk), from a search summary only) | Classroom/physical | Remove F and B so the notes "naturally sound good in any order"; free improvisation first, then shaped pieces | Our grid already does this: free play can never sound wrong. Composing levels should keep "nothing wrong" for free choices | The publisher's unsupported benefit claims |
| **Kodály melodic sequence** ([MRA Music Place](https://mramusicplace.net/2014/07/29/what-are-the-best-pitch-combinations-for-teaching-our-youngest-children-singing/)) | Singing pedagogy | sol–mi, then la, then do and re. The article argues a major-key culture may start from the tonic chord instead | Short motifs built from steps and repeats, with home (do) as the base | A sol–mi requirement, since our grids lack sol (gap 6) |
| **Beat Builder** (this island; [its dive](beat-builder.md)) | Step sequencer | Free composing with a **green check**: at least three sounds and two loop returns since the last edit. Then repair, sections, and ABA | The deliberate-finish precedent for composing, without a tap counter | Its rhythm rows. Song Maker owns melody |

**Learning references.** The [National Core Arts Standards, Music at a Glance](https://www.nationalartsstandards.org/sites/default/files/Music%20at%20a%20Glance%20rev.pdf) (2014; text extracted from the PDF):

- **MU:Cr1.1.1a**, grade 1: "With limited guidance, create musical ideas (such as answering a musical question) for a specific purpose."
- **MU:Cr2.1.2a**, grade 2: "Demonstrate and explain personal reasons for selecting patterns and ideas for their music."
- **Anchor 3** asks "How do musicians improve the quality of their creative work?"

The PDF's pre-K and kindergarten columns came out jumbled in extraction, so they are not quoted or paraphrased here. This is a selective mapping, not coverage. No source here shows that grid composing improves general cognition.

## What makes sense here

**Three kinds of round, kept apart.** The family review asked for *free/composed mode separation*. Song Maker should hold three clearly different contracts:

- **Toy** (levels 1–2). Auto-ending free play for lap and toddler, where nothing is wrong and the song can be kept.
- **Copy** (levels 3–7). There is a right song; misses and hints count.
- **Compose** (proposed 8–10). Her choices are never wrong, she finishes deliberately with a check, and the result can be kept. A structured compose round fixes only *structure*: one jelly on every beat, or a given start. It never asks for one right melody.

Revision against a stated request (proposed 12–13) is a fourth, school kind, kept separate because it can fail and so needs an accounting decision.

**Answer the phrase belongs here.** The music study and the roadmap's M4 row both put melodic answers in Song Maker, not a new game. NCAS grade 1 names exactly this task. The grid, the loop and the plaque already exist. What is new is a question the pet sings and an answer area with one jelly per beat.

**Phrase content, not random notes.** Today's copy songs are random columns and rows, so they leap about and rarely sound like tunes. Benoit's "limit intervals, stepwise or thirds" and the Kodály motif idea point to an **authored pool of short pentatonic motifs** of steps, repeats and one leap. The same pool supplies the pet's questions and Finish my song's openings. Level 4's shape stays exactly as the Missing Melody uses it.

**Replay and performance.** The loop already replays continuously. Composing levels add a short performance at the finish: the pet sings the question and a friend critter sings her answer. The plaque already reuses kept tunes. Creature-world reuse (her tune as a new friend's greeting) is RW04's. The [name and story packet](../rework/NAME-AND-STORY.md) says her actual tune is kept and replayed. The [Welcome a New Friend packet](../rework/WELCOME-ADVENTURE.md#3-a-song-to-say-hello-song-maker) recommends playing **level 2** as a stated story exception, and names "a Song Maker compose level inside both ranges" as its alternative. Proposed level 8, *My song*, is that alternative: it sits in the preschool and pre-K windows and keeps a tune. **Level 2 stays `mode: 'free'`**, because RW04's exception test relies on it. This dive does not define the story's result.

**Left to other games.** Tempo and dynamics belong to Little Conductor, independent parts and instruments to Hat Band, rhythm to Beat Builder, high-or-low questions to Sound Garden, and short note echoes to Jelly Drums.

**Long arc.** Lap taps a toy that always sings. Toddler fills shadows. Preschool copies from a card and finishes a song the pet began. Pre-K continues patterns, picks notes by ear and composes a whole loop. School answers a musical question, brings it home, and revises a tune to a request. Older (proposed, not a band) work would be longer forms like ABA, which Beat Builder already covers for rhythm.

## Experience and presentation

- **First unsupported action:** at every band, tapping any jelly makes it sing and bounce (`Bead.pop`), with a burst of note particles in its row's color. No answer is needed for that to be fun.
- **Touch and consequence:** touch-down sings immediately (the `onTap` cooldown is 150 ms). A lit jelly gets a face, and the playhead's next pass sings it back. That is the consequence, and the loop returning is the "ready again". In compose levels, tapping a second jelly in the same beat moves the note there, with a short slide tween. That reads as "this beat's note changed", not "wrong".
- **Variety on replay without changing the rule:** a different authored motif, pattern, question or opening each round, seeded and drawn without repeats inside a short window (Beat Builder's phrase rule).
- **Reasoning versus reading, memory and precision:**
  - Card and pattern levels are visual matching and rule continuation.
  - Level 7 and the proposed ear entry are listening. Level 7's replay button keeps memory load optional.
  - Composing is choice, with nothing to remember.
  - No level needs reading.
  - Precision: full-cell targets of at least 100 (slice 1).
- **Supported ending and replay:** copy levels finish with help through the glow. Compose levels finish with a check, which appears only when the loop has played her whole song once since her last change, so she has always heard what she is finishing. The celebration's green *again* repeats the level. Stopping mid-round loses nothing.
- **Co-play:** the existing tip is to sing high and low with the jellies. For answer levels: the grown-up sings the question and the child taps the answer, then they swap and the child sings the question (off-screen). One device, no seats.
- **Concrete art and feel example (Answer my song):**
  - The 8×4 board is drawn as two hills. The left four beats, the pet's question, sit on a pale purple tint, and their jellies wear a white ring (as `given` does today). The right four, her answer, sit on cream, with a dashed empty seed per beat until she picks.
  - When the playhead crosses into her half, the pet (bottom left) sings along (`ctx.pet.setMood('sing')`; `ctx.pet` is a `Critter`) and a critter from `CRITTERS` beside the check, in the control row under the board, bobs on her beats. It takes no touches.
  - On the check, the full eight beats play once while each lit jelly's note particle floats up to the critter.
  - All of it uses `Graphics`, `swatch` tints, `sfx.marimba` and the existing critter moods. No new rendering system.
- **Needs a person or device:** whether a four-year-old finds the moving one-per-beat note natural. Whether a six-year-old hears the answer as a reply. Whether the check appears too early or too late for a child still composing. Marimba loudness on the iPad speaker.

## Proposed ladder

### Fresh content inside existing levels

- **Level 6 patterns: 5 → 10, each spoken before play.** New shapes on the 5-row grid (rows top 0 to bottom 4):
  - arch [4,2,0,2]
  - valley [0,2,4,2]
  - climb and rest [4,3,2,2]
  - big leap [4,0,4,0]
  - step back [4,3,4,2]

  Each name gets a voice line, as in "This one goes like a zigzag." The bot is unchanged. *Test:* every shape uses at least two rows, all rows are under 5, the row sequences are distinct and the names unique, and the existing continuation test passes for every shape.
- **Levels 3–5 songs from an authored motif pool** instead of random rows. About twelve motifs per shape: 3 notes over 4 beats on 3 rows, and 5 over 6 beats on 4 rows. They are built from steps, repeats and at most one leap, and many end on the bottom (home) row. The columns stay as authored, including rests. *Test:* one note per column, more than one pitch, level 3 has exactly 3 notes on 4×3, and levels 4 and 5 have exactly 5 notes on 6×4 (**level 4's Missing Melody shape is frozen**). Selection is seeded without repeats across a few rounds, and the bot still finishes every motif with right taps. The Missing Melody's stated ending song may come from this pool, but that is the story build's choice.

### New levels on top

Proposed IDs follow the slice order. None is approved yet; see the decisions below. Every compose level stays inside the plaque's bounds (`cleanTune`: at most 8 columns, 3–5 rows, at least 2 notes), so no save change is needed.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **My song** (compose; RW04's in-range alternative) | preschool, pre-K, school | 6×4 empty loop and an inactive check at the right (at least 100, in the margin Listen uses) | Any jellies on any beats, changed at will | None possible; no hints. The check wakes once at least 3 jellies are lit and the loop has played round once since her last change. A tap on it plays the song once more with the pet singing, then finishes | Check readiness under any tap sequence; the bot (`freeSong` then the check) reaches it; every finishable song passes `cleanTune` | Check button (Beat Builder's art/pattern), 2 voice lines, a how-to `LevelLine`, bot, kept tune. Converts `levels` to a `BandLevels` table |
| 9 | **Answer my song** (M4) | school (pre-K later, after a person check) | 8×4 (see the layout note below); the pet sings a 4-note question on beats 1–4 (given, white rings), then "Your turn. Answer my song!" | One jelly on each of beats 5–8. A tap in a beat with a note moves the note | None possible: every complete answer is accepted, including an echo of the question (a parallel answer is real music). The check wakes when all 4 answer beats are filled and the full 8 beats have played once since the last change | Questions: 4 notes, one per beat 1–4, more than one pitch, 8 authored. One-per-beat invariant under any taps; all 256 answers finishable; the bot's answer is accepted | One-per-beat move interaction (new), question bank, the two-hill board, critter performer, voice, how-to, bot. Needs slice 1's full-cell targets (cell ≈ 101 on 8×4 with the 40-unit right margin). RW04 may choose it for the hello song |
| 10 | **Finish my song** | preschool, pre-K | 4×3; beats 1–2 given from the motif pool, the pet sings them | Beats 3 and 4, one jelly each | None possible; the check as in level 9. "Teacher provides the start" (Benoit) | Openings from the pool; all 9 endings finishable; one per beat | Reuses level 9's interaction on the 4×3 grid; voice, how-to |
| 11 | **Two to choose** (ear entry) | pre-K, before 7 | Level 7's heard tune, but each beat shows two shadows: the right one and one other | Which of two jellies each heard note is | As level 7: boing, then the right note; glow after two. Counts misses and hints | Each beat has exactly two candidates in distinct rows, one of them right; the bot taps right; the candidate rows vary | Reuses ghost drawing and listen mode; cheap after slice 1 |
| 12 | **Bring it home** | school | As level 9; the questions start on the home (bottom) jelly and end off it. Spoken rule: "End your answer on the home jelly" | Beats 5–7 are free; beat 8 must be home | A check with another last note: the pet sings her answer, then the same answer ending home, and says "Hear how this one sounds finished?" Glow on the home jelly in beat 8 after two. **Miss accounting is a decision (D4).** Labeled as this game's rule, not a law of music | Questions start home, end elsewhere; acceptance = all filled and last = home; all 64 accepted answers finishable; the explanation differs from hers only at beat 8 | Shares level 9's build; voice, how-to |
| 13 | **Change one thing** (revise) | school | The pet's 8-beat tune plays; a pictured request: *end higher*, *make beat 4 match beat 1*, *go down at the end*, or *add a quiet beat* | Which note to move or remove; a "before" button replays the original | Check against the request; accounting as D4. Hint: glow one beat whose change would satisfy it | Every request is false on its tune and true for at least 3 single edits; a hint edit exists; the bot finds a minimal edit | Request art, before/after replay, tap-to-remove, the most voice. Last |

**Layout note for the 8-beat compose boards (9, 12, 13).** The extra controls cannot go in a side margin. With Listen's 130-unit right margin an 8-beat cell is (1024 − 175 − 130)/8 ≈ 90, under the floor. A 5-row board leaves only about 93 units of vertical slack, so a 100-unit control does not fit above or below it either. An **8×4** board (`ROW_STEPS[4]`, within `cleanTune`) keeps the 40-unit right margin, so the cell is about 101, and leaves about 194 units under the board. The check, the performing critter and level 13's before button go in that row, at the right, clear of the pet. All figures are computed from `resize`, not measured. Level 8 (6×4) can use Listen's right margin, because its cell stays about 120.

**Proposed windows, with stable IDs and `order`:**

- lap 1–2 and toddler 2–4: unchanged.
- preschool: `{ min 4, max 10, order [4, 10, 5, 6, 8] }`
- pre-K: `{ min 5, max 11, order [5, 10, 6, 11, 7, 8] }`
- school: `{ min 6, max 13, order [6, 7, 8, 9, 12, 13] }`

`entryLevels`: [10, 11], so a birthday or pin landing outside a band starts that band at its easiest level.

### Younger-band openings

None proposed. Level 1 is already a lap toy that cannot go wrong; a smaller grid would only shrink the song. The toddler window keeps its free-then-shadows start. The lap and toddler finish stays automatic, with a guard in slice 1 so a keepable song exists. A toddler Done check is decision D6, not proposed by default.

### Easier entries and levels between existing ones

Level 10 (Finish my song) is preschool's easiest composing, placed after 4. Level 11 (Two to choose) sits before 7 in pre-K. Both are appended IDs placed with `order` and declared in `entryLevels`. Saved levels 1–7, pins and the Missing Melody's level 4 keep their IDs and meaning.

### Left out on purpose

- Tempo and loudness controls (Little Conductor), instrument choice and parts (Hat Band), a rhythm lane (Beat Builder).
- Major or chromatic scales: the pentatonic contract means free choices are never dissonant.
- Staff notation, which no band needs here.
- Songs longer than 8 beats (plaque bounds and memory load), and a random-note button.
- Microphone input or recording, and public sharing.
- Any score or rating of how good her song is, and any timer or speed.
- A copy level where exploring is free. Copying has a right answer by design; the compose levels are where exploring lives.

## Decisions for the developer

1. **D1, appended levels and windows.** Approve levels 8–13 and the windows above (Song Maker is not in the 2026-10-12 approved "levels on top" list). Lean: approve 8–11 now, and 12–13 after D4.
2. **D2, creative accounting.** A compose round reports 0 misses and 0 hints, so two of them step her up (gap 3). Lean: keep today's rule, as Stamp Studio, Beat Builder 1 and free levels 1–2 do. A non-adaptive creative round would be a cross-game contract.
3. **D3, keeping a co-made song.** Levels 9, 10 and 12 mix the pet's notes with hers. Lean: offer the keep as an ordinary `TuneCreation`, and have the voice line say "our song", not "your song". The plaque draws every note alike, because the tune record has no field marking the pet's notes. Showing them differently there would need a save-field change, which is not proposed.
4. **D4, can a rule check miss?** For Bring it home and Change one thing, lean: a failed check counts as a miss, like Beat Builder's wrong checks, because the rule is spoken first. Trying jellies before the check never counts. The alternative is no miss on the first failed check.
5. **D5, a grid with sol (G4).** Kodály's first interval is absent (gap 6). Lean: not now. If wanted, add a separately keyed scale for new grids and never change `ROW_STEPS`, which kept tunes play through.
6. **D6, toddler finish.** Lean: level 2 keeps its automatic finish, with slice 1's keepable-song guard. A toddler check would follow Beat Builder 1's gentler version only after a person check.
7. **Later (rework), editing a kept tune.** Should the plaque, or RW03's library, open Song Maker with her kept tune loaded to revise? That needs a route and creation contract and belongs with RW03/RW04, not this game.

## Build slices, in order

1. **Support truth (built).**
   - Full-cell hit areas, with a `logic.ts` layout function and a test that every level's cell is at least 100 in 1024×768, portrait 1024×1365 and a wide phone view (gap 1). Later compose slices extend the same test to their controls (the check and the before button).
   - The level 1–2 how-to note becomes conditional ("if at least two jellies are lit, a tree house button…"), so it matches the keep rule (gap 2). The round still always finishes on its tap count: a guard that waited for two lit jellies could strand a lap child tapping one jelly on and off.
   - IDs and accounting are unchanged.

   *Tier: existing-game bug fix.* Typecheck, Song Maker's rule tests, one filtered play at levels 1 and 6, and `fingerdemo` at level 6 because tap targets changed.
2. **Ten spoken patterns at level 6 (claimed: branch `claude/song-maker-spoken-patterns`).** Content inside an existing level, plus 10 voice lines. *Tier: content.* Typecheck, rule tests, one screenshot.
3. **Authored motifs for levels 3–5 (ready).** Level 4's shape is frozen for the Missing Melody. *Tier: content.* Typecheck, rule tests, one screenshot at level 4. `fingerdemo` only if the bot changes.
4. **My song, level 8 (gated: D1, D2).** Adds the `BandLevels` conversion and the check button. *Tier: new interaction.*
5. **Answer my song, level 9, the M4 build (gated: D1, D3).** *Tier: new interaction*, with a portrait screenshot of the 8×4 board.
6. **Finish my song, level 10 (gated: D1, D3).** *Tier: new levels on an existing interaction* (reuses slice 5).
7. **Two to choose, level 11 (gated: D1).** *Tier: new levels.*
8. **Bring it home, level 12 (gated: D1, D4).** *Tier: new levels.*
9. **Change one thing, level 13 (gated: D1, D4).** *Tier: new interaction.*

Each slice updates the how-to card (`LevelLine`s), GAMES.md, the README row, voice lines and a VERIFICATION entry, as AGENTS.md requires.

## What was built in this session

Deep dive session: research and ideation only (`node scripts/check-links.mjs`, `git diff --check`).

**Slice 1, support truth** ([PR #628](https://github.com/rjdunlap/neo/pull/628), commit 72d2b51f): each bead's hit area is its whole grid cell (levels 5–6 were about 91–92 units, now at least 101 in 1024×768); `songLayout(plan, view)` in `logic.ts` holds the placement that `resize` used, and a test asserts every level's cell is at least 100 and the grid stays within its margins in 1024×768, 1024×1365 portrait and 1660×768; the levels 1–2 how-to note now says a tree house button hangs the song if at least two jellies are lit at the end (`TUNE_MIN_NOTES = 2`). The round still always finishes on its tap count. IDs, levels and miss/hint accounting unchanged. Checks in [VERIFICATION](../archive/VERIFICATION-2026-10-20.md#2026-10-20--song-maker-support-truth-slice-1); the old-rule failing proof and a device touch check were not run.
