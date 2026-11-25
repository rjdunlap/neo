# Jelly Drums

<!-- generated: from src/games/jelly-drums; edit the text below the end mark (npm run game-docs) -->

**ID:** `jelly-drums` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** cause-effect, rhythm, sequence-memory

| Band | Levels, easiest first |
| --- | --- |
| lap | 10, 1, 2, 3 |
| toddler | 1, 2, 3, 14 |
| preschool | 14, 4, 5, 6, 7 |
| pre-K | 5, 6, 7, 8, 9, 11, 12, 13 |
| school | 8, 9, 11, 12, 13 |

| Level | Plays like |
| --- | --- |
| 1 | Free play, 24 notes |
| 2 | Free play, 32 notes |
| 3 | Free play, 40 notes |
| 4 | Copy a 2-note tune, 4 tunes |
| 5 | Copy a 3-note tune, 4 tunes |
| 6 | Copy a 3-note tune, 5 tunes |
| 7 | Copy a 4-note tune, 4 tunes |
| 8 | Copy a 4-note tune, 5 tunes |
| 9 | Copy a 5-note tune, 5 tunes |
| 10 | One big jelly, then friends wake, any touch sings, 24 notes |
| 11 | Copy a 3-note tune backwards, 5 tunes (the last is 4 notes) |
| 12 | Are two 3-note songs the same or different? 5 pairs |
| 13 | Line up 4 jellies from lowest to highest, 3 line-ups |
| 14 | Listen to one note and tap which jelly sang, 6 sounds |

<!-- end generated -->

**Starts as:** free play on five notes (lap starts with one big jelly that wakes its friends)

**Grows into:** copy a tune of 2 to 5 notes, play a tune backwards, say whether two songs are the same or different, then line up equal-sized jellies from lowest to highest by ear alone

## Design notes

Its jellies and hub stand read their colours from `pitchColor` in `src/audio/notes.ts` (red is the big, low jelly, blue the little, high one), the table Song Maker and the treehouse tune plaque share.

Free play on five notes, then copying tunes of two to five notes. In the echo levels a yellow listen-again button (a music note, above the stage) replays the whole tune from the first note whenever it is her turn (slowly, with the first jelly glowing, once she has needed help); it counts no miss or hint, and is hidden in couch play. On four- and five-note tunes a wrong jelly counts one miss, replays the tune and lets her carry on from her place (`placeAfterMiss`, `RESUME_FROM_LENGTH = 4` in `logic.ts`) rather than from the first note; a row of dots above the jellies ticks the notes she has right, listen again keeps her place, and the help glow goes to the jelly she should tap next. Two- and three-note tunes still restart. Level 10, *One big jelly* (lap only, placed first with `order`), is the easiest way in: one enormous red low jelly stands alone and a touch anywhere on the stage sings the nearest awake one; the little blue high jelly wakes after 6 touches, then the others at 10, 14 and 18, and 24 touches finish, with no miss and no hint. The island's background loop is silenced here (the jellies still bob to its quiet clock), so nothing competes with the notes she plays. In the echo levels (4–9 and 11) a round never plays the same tune twice, and tunes have shapes: a staircase up or down, a hop or a wiggle, and (levels 5–6 Hot Cross Buns; level 9 also Mary Had a Little Lamb and Jingle Bells) songs whose title is spoken first; it never draws the kind it just played. In free play (levels 1–3) after 8 seconds without a touch the last-touched jelly wiggles and glows; nothing is counted. Free play also names a jelly now and then ("Red! Big and low.": at most one in eight taps, never the same jelly twice running, never over a fan's answer or the finale) and, once a round, after she has played both the biggest and the littlest, says "Big jellies sing low. Little jellies sing high." At level 2 every fourth note a front-row fan (duck, bunny, cat, pig in turn) hops and answers in its own voice with a note in the jelly's color; at level 3 three neighbouring jellies in order, up or down, send a rainbow star burst across the jellies and twinkle the garland (a run counts once). None of this counts a miss, and level 1 stays plain.

**Backwards (level 11).** Pre-K 5–9 and 11 and school 8, 9 and 11 (placed with `order`). The plan is `{mode:'echo', goal:5, length:3, reverse:true, lastLength:4}`: four three-note tunes, then one of four, each played back last note first. `answerOf` gives the notes she must tap (the tune reversed), `tuneLength` the round's length and `twistsOf` the level's twist flags in `logic.ts`; a tune that reads the same backwards is never drawn. A purple rewind arrow sits beside the yellow listen-again button; the lines are `jelly.echo.back` (instruction) and `jelly.back`. A wrong jelly counts one miss: the tune replays, then plays the answer backwards slowly with each jelly glowing; two misses glow the next jelly to tap. Three-note tunes restart after a miss and the four-note one keeps her place (the resume rule above). Browser check: `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly`, `fingerdemo` with `FINGER_LEVELS=11`.

**Same or different? (level 12).** Pre-K and school, last in the order after Backwards (`[… 9, 11, 12]`). The plan is `{mode:'compare', goal:5, length:3}`: five pairs of three-note songs. The voice names each ("Song 1!", then "Song 2!") while its jellies light and sing, then asks "Is song 2 the same as song 1?"; she taps one of two big picture buttons (60-unit radius, level with the listen-again button): two matching dots for same, a round and a square dot for different. `sameFlags` makes two or three of the five pairs the same, shuffled; `drawPair` makes a different pair by changing exactly one note to a jelly at least two steps away in the first two pairs and at least one step later (`minStepAt`), played changed-tune-first or second at random, and never reuses a base tune in a round. A wrong button is a miss: both songs replay slowly and the changed jelly glows hard in each; the second miss on a pair also counts a hint and rings the right button. The listen-again button replays both songs free. A tap on a jelly while listening is only music. The ghost finger uses `verdictToTap`. The new voice lines (`jelly.compare`, `jelly.song.n`, `jelly.compare.ask`) carry `{a}`, `{b}` or `{n}` slots, so they stay on device speech and need no rendered clip; fixed-wording clips are a later voice pass.

**What the guide repeats.** In the copy-the-tune levels "Listen!" is an instruction (`ctx.instruct`) while the jellies play, and "Your turn!" is said again as an instruction after Listen again and after a wrong note's replay, so the guide and caption no longer keep "Your turn!" while the tune plays. Song titles, names and replies stay `say`.

**Sound sets and stages.** A round's instrument comes from its seed (`soundSetFor(rng)` in `logic.ts`): the marimba on Music Mountain by day (the look it always had), bells on a moon stage at night (dark sky, stars, crescent moon, pale garland string), or a soft held hum (`sfx.hum`, `hum` in `src/audio/instruments.ts`) on a beach bandstand (sea, low dunes, sun). All three play the same five pentatonic steps (`SET_STEPS`), so a tune is the same tune on any set. Stage looks and drawing are in `stages.ts` (`STAGES`, `drawBackdrop`, `crescent`). The hub icon and sticker stay on Music Mountain. Whether the bells and hum sound good on a phone speaker is for a phone playtest to tell us. Browser check: `BROWSER_SUITE=originals ORIGINALS_ONLY=jellysets`.

**Lowest to highest (level 13).** Pre-K and school, last in the order after Same or different? (`[… 9, 11, 12, 13]`). The plan is `{mode:'order', goal:3, length:4}`: three line-ups of four equal-sized jellies (`ORDER_HW = 68`) in shuffled colors and positions, while the fifth jelly sleeps to the side. `drawLineups` picks four distinct pitches and independently shuffles all five `PITCH_COLORS` (guarding against starting already sorted ascending or with every jelly wearing its pitch's default color). She taps any jelly freely to hear its voice (never a miss) and drags the lowest remaining jelly onto the lit slot on the shelf above. A wrong drop on the lit slot slides the jelly back and speaks a direction (`orderDirection` through `'jelly.order.dir'`); two misses on one slot count a hint and glow the right jelly. Dropping onto an unlit slot ticks and pulses the lit slot without a miss. Once three jellies are placed, the fourth hops into the last slot (`orderChoicesNeeded(4) === 3`) and all four sing in ascending order before the next line-up. Placed jellies remain tappable to listen. The slotted voice lines (`jelly.order`, `jelly.order.next`, `jelly.order.dir`) stay on device speech until a clip pass renders fixed wording. The ghost finger uses `orderToDrag` to drag each lowest remaining jelly to the lit slot. Browser checks: `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly`, `BROWSER_SUITE=fingerdemo FINGER_ONLY=jelly-drums FINGER_LEVELS=13`, `abandon-cards.mjs`.

**Journal entries (2026-11-25, [PR #2165](https://github.com/rjdunlap/neo/pull/2165)).** A finished round files `jelly-drums:low-high` once she has tapped both the biggest (red) and the littlest (blue) jelly in it; `JournalWatch` in `logic.ts` keeps it and `ctx.finish` passes it as `discoveries`, so a round that did not show it files nothing. It speaks the existing `jelly.lowhigh` line (its clip is already rendered) and the card draws the game's own jellies (`jellyJournalPicture` in `jelly.ts`). The scale entry (level 3's sparkle) is not built: its journal line needs a rendered voice clip.

**Which jelly sang? (level 14, 2026-11-25, [PR #2172](https://github.com/rjdunlap/neo/pull/2172)).** Placed between levels 3 and 4 (`toddler` order `[1, 2, 3, 14]`, `preschool` order `[14, 4, 5, 6, 7]`, and `entryLevels: [10, 14]` so `lap`, `prek`, and `school` still start at their own easiest level on aging up or pinning). The plan is `{mode:'which', goal:6, length:1}`: `whichAwake` wakes `[0, 4]` (biggest and littlest) for the first two sounds, `[0, 2, 4]` for the next two (all early pairs at least two steps apart), and all five jellies for the last two. `drawWhich` picks an awake jelly without repeating back-to-back. The mystery note plays by ear with a neutral overhead sparkle burst (`playWhichNote`) so the singing jelly does not animate or glow prematurely. Tapping a wrong jelly sings its own note, replays the mystery sound and wiggles (`Jelly.wiggle`) the right jelly; a second miss on the same sound counts a hint and also glows the right jelly. The listen-again button replays the sound free, and `autotouch` reads `jellyToTap(..., whichTarget)`. Browser checks: `BROWSER_SUITE=originals ORIGINALS_ONLY=jelly` and `BROWSER_SUITE=fingerdemo FINGER_ONLY=jelly-drums FINGER_LEVELS=14`.
