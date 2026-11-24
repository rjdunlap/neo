# Jelly Drums

<!-- generated: from src/games/jelly-drums; edit the text below the end mark (npm run game-docs) -->

**ID:** `jelly-drums` · **Land:** Music Mountain · **Ages:** lap–school · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** cause-effect, rhythm, sequence-memory

| Band | Levels, easiest first |
| --- | --- |
| lap | 10, 1, 2, 3 |
| toddler | 1–3 |
| preschool | 4–7 |
| pre-K | 5–9 |
| school | 8–9 |

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

<!-- end generated -->

**Starts as:** free play on five notes (lap starts with one big jelly that wakes its friends)

**Grows into:** copy a tune of 2 to 5 notes

## Design notes

Its jellies and hub stand read their colours from `pitchColor` in `src/audio/notes.ts` (red is the big, low jelly, blue the little, high one), the table Song Maker and the treehouse tune plaque share.

Free play on five notes, then copying tunes of two to five notes. In the echo levels a yellow listen-again button (a music note, above the stage) replays the whole tune from the first note whenever it is her turn (slowly, with the first jelly glowing, once she has needed help); it counts no miss or hint, and is hidden in couch play. On four- and five-note tunes a wrong jelly counts one miss, replays the tune and lets her carry on from her place (`placeAfterMiss`, `RESUME_FROM_LENGTH = 4` in `logic.ts`) rather than from the first note; a row of dots above the jellies ticks the notes she has right, listen again keeps her place, and the help glow goes to the jelly she should tap next. Two- and three-note tunes still restart. Level 10, *One big jelly* (lap only, placed first with `order`), is the easiest way in: one enormous red low jelly stands alone and a touch anywhere on the stage sings the nearest awake one; the little blue high jelly wakes after 6 touches, then the others at 10, 14 and 18, and 24 touches finish, with no miss and no hint. The island's background loop is silenced here (the jellies still bob to its quiet clock), so nothing competes with the notes she plays. In the echo levels (4–9) a round never plays the same tune twice, and tunes have shapes: a staircase up or down, a hop or a wiggle, and (levels 5–6 Hot Cross Buns; level 9 also Mary Had a Little Lamb and Jingle Bells) songs whose title is spoken first; it never draws the kind it just played. In free play (levels 1–3) after 8 seconds without a touch the last-touched jelly wiggles and glows; nothing is counted. Free play also names a jelly now and then ("Red! Big and low.": at most one in eight taps, never the same jelly twice running, never over a fan's answer or the finale) and, once a round, after she has played both the biggest and the littlest, says "Big jellies sing low. Little jellies sing high." At level 2 every fourth note a front-row fan (duck, bunny, cat, pig in turn) hops and answers in its own voice with a note in the jelly's color; at level 3 three neighbouring jellies in order, up or down, send a rainbow star burst across the jellies and twinkle the garland (a run counts once). None of this counts a miss, and level 1 stays plain.

**What the guide repeats.** In the copy-the-tune levels "Listen!" is an instruction (`ctx.instruct`) while the jellies play, and "Your turn!" is said again as an instruction after Listen again and after a wrong note's replay, so the guide and caption no longer keep "Your turn!" while the tune plays. Song titles, names and replies stay `say`.

**Sound sets and stages.** A round's instrument comes from its seed (`soundSetFor(rng)` in `logic.ts`): the marimba on Music Mountain by day (the look it always had), bells on a moon stage at night (dark sky, stars, crescent moon, pale garland string), or a soft held hum (`sfx.hum`, `hum` in `src/audio/instruments.ts`) on a beach bandstand (sea, low dunes, sun). All three play the same five pentatonic steps (`SET_STEPS`), so a tune is the same tune on any set. Stage looks and drawing are in `stages.ts` (`STAGES`, `drawBackdrop`, `crescent`). The hub icon and sticker stay on Music Mountain. Whether the bells and hum sound good on a phone speaker is for a phone playtest to tell us. Browser check: `BROWSER_SUITE=originals ORIGINALS_ONLY=jellysets`.
