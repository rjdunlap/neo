# Little Conductor deep dive

*ID `little-conductor` · bands toddler, preschool, pre-K · levels 1–3 on 2026-11-20 · session `claude/little-conductor-dive` ([PR #1899](https://github.com/rjdunlap/neo/pull/1899))*

## The game today

Three friends stand on a bandstand and play one four-beat pentatonic tune over and over. Two 180-unit pads sit below them, a turtle (60 beats a minute) and a rabbit (90). She taps one and the band changes pace at the next beat, with a pending ring and clock until it lands; the notes and their order never change. Four beat marks under the playing pad fill as a whole phrase goes by, and the green Done stays dim until she has heard the tune whole at the pace she chose. It is in Music Mountain, touch only, with a ghost finger and no couch entry; nothing is saved. The grown-ups' how-to card says that moving up a level means she is ready for the next thing to try, not that she can tell tempos apart. The [game page](../games/little-conductor.md) and [definition](../definitions/little-conductor.md) hold the details.

| Level | Plan name | Band window | What she decides |
| --- | --- | --- | --- |
| 1 | Lead a little band | toddler, preschool | Which pace, and when to change it |
| 2 | Two ways to play | toddler, preschool, pre-K | Hear the tune both ways, then which version to finish with |
| 3 | Two pictured requests | preschool, pre-K | Which pace the listener's sign asks for, for each half of the tune, then Check |

**What a round draws from.** `makeRound` picks one of three authored motifs (`hop`, `slide`, `wave`) and, at level 3, which half is slow. Nothing else varies: the paces, the three voices and the friends' instruments are fixed per build.

**Accounting.** Levels 1–2 never miss and never hint (`finish({ misses: 0, hints: 0 })`), so the difficulty system moves a toddler up after two rounds whatever she did. At level 3 only a Check that does not match the sign counts as a miss; two wrong Checks on one half glow the requested pad, which counts one hint per half.

**Known gaps.**

- **Upright layout (built, slice 1).** `upright: true`: upright views hang the pads up from the bottom edge, and level 3's sign sits in a right-hand column beside a narrower bandstand (friends spacing 140), because 768 wide has no room under it. Before this the game showed the turn prompt on a phone held upright.
- **One property, one pair of values.** All three levels are about pace, and the pace is always one of two values. After level 3 she has met the idea fully; nothing new is asked of her, so the older end of the band has no reason to come back.
- **No way to make a change of her own.** She chooses between two prepared performances. She never makes a pace that is not 60 or 90, and she never decides when a part comes in, how strongly it plays, or what a friend plays.
- **The performance is not kept.** The finish is a bow and a sticker; the tune she chose vanishes. That is the default by [decision 7](../definitions/little-conductor.md#open-decisions), and the rework's creation slots are the place to revisit it.
- **Only toddlers to pre-K.** There is no school window, because plans 4–8 were never defined.
- **Waiting for the beat is the whole delay.** At 60 beats a minute a tap can wait nearly a second. That is correct for a score that never skips a beat, and the pending ring explains it, but only a person watching a two-year-old can say whether it reads as "wait" or as "broken".
- **One timbre set.** The same marimba, pluck and drum sound at every level, and the sound with the quiet drum is never contrasted with the melody.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Conducting](https://en.wikipedia.org/wiki/Conducting) | The craft itself | A conductor's duties are setting the tempo, cueing entries and shaping the sound by gesture | The three duties are the ladder's three properties: pace, entrances, strength | Baton patterns and beat-by-beat gesture training |
| [Tempo](https://en.wikipedia.org/wiki/Tempo) and [Dynamics](https://en.wikipedia.org/wiki/Dynamics_%28music%29) | Musical terms | Pace and loudness are separate dials; a loudness mark means something different in each piece | Fixed pace and gain *ids* instead of exact numbers; the same notes heard two ways | The words themselves on the card (it says *slow*, *fast*, *loud*, *gentle* only after review) |
| [Dalcroze eurhythmics](https://en.wikipedia.org/wiki/Dalcroze_Eurhythmics) | Music education through movement | Feeling rhythm and structure in the body before naming them | Pace as something that happens to friends who sway in time, so a child can feel it | Movement instruction or any claim that the game does the teaching |
| [Orff Schulwerk](https://en.wikipedia.org/wiki/Orff_Schulwerk) | Music education through play | Speech, movement, drama and simple instruments, with children as makers | Play first, naming later; a band of roles that answer the leader | Any imported repertoire or specific classroom exercise without a named review |
| [Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method) | Music education | Singing first, small intervals, then reading and writing | Pentatonic material, so no choice sounds wrong | The solfège and staff reading |
| [Peter and the Wolf](https://en.wikipedia.org/wiki/Peter_and_the_Wolf) | Orchestral tale for children | Each character has an instrument and a theme | Each friend is one voice, so she can hear what the pace changes in each | A narrator, the story and the recorded orchestra |
| [Wii Music](https://en.wikipedia.org/wiki/Wii_Music) and the existing [GameSpot hands-on](https://www.gamespot.com/articles/e3-06-wii-music-orchestra-hands-on/1100-6150659/) | Console conducting | A remote as a baton; tempo and loudness follow motion | The band follows at once and visibly | Tempo from motion and loudness from force as a first control, as the definition already decided |
| [Fantasia: Music Evolved](https://en.wikipedia.org/wiki/Fantasia:_Music_Evolved) | Motion-controlled rhythm game | Players shape a famous piece with gestures, with rising difficulty and scoring | Shaping a performance that is already sounding | Gesture scoring, a camera and licensed recordings |
| [Rhythm Heaven](https://en.wikipedia.org/wiki/Rhythm_Heaven) | Nintendo rhythm minigames | Each game has its own rules, with a rating at the end | Many tiny rule sets, each with a clear visible picture | The rating, the timing judgement and the pass mark |
| [Toca Band](https://www.hbook.com/story/toca-band-app-review) and [BANDIMAL](https://alternativeto.net/software/bandimal) (read for the [definition](../definitions/little-conductor.md#references)) | Toddler band toys | Characters on a stage each loop a part; any mix stays in tune | Every friend visible, any combination pleasant | Placing players (Hat Band's job) |
| [Tempo discrimination in 3- and 4-year-olds](https://hal-univ-paris10.archives-ouvertes.fr/hal-01645042v1) (Droit-Volet et al.; abstract read, already in the definition) | Developmental research | Preschoolers tell tempos apart, improving within months | Paces a half apart, far above the reliably noticed difference | Any claim that a child judges tempo |

Every web link was already in the definition or is a standard encyclopedia page whose summary line was read on 2026-11-20. No school standard applies to a toddler to pre-K music game; the card names *slow*, *fast*, *tune* and *band* only, and a later level that names a musical property gets the source check the [2026-10-23 decision](../definitions/little-conductor.md#open-decisions) allows.

## What makes sense here

The references agree on three things a conductor does: set the pace, cue who plays and shape how strongly. Little Conductor has the first only. Growing along the other two fits the rules, because each can be a visible, audible consequence of one tap with the same finish (hear it whole, then Done) and no wrong answer. What does not fit is anything the references measure: a rating, a pass mark, tapping on the beat, a gesture score or a baton as the only control.

So the arc is one property at a time, with tapping first and the gesture, if ever, as an alternative: **pace** (built), then **strength** (the same tune played gently or strongly at a fixed pace), then **who plays** (cue one friend in or out of a fixed accompaniment), then a round that combines two properties and asks her to **make one contrast and keep the other the same**, then a revision for a listener. The earlier ladder proposals in the [music study](subjects/music-instruments.md#first-games-proposed-ladder-little-conductor) are kept, with two changes this dive makes: each new property gets a **seeded second motif family** so a replay is not the same tune, and the **school window starts at the combined-property level**, not at the first strength level, because a seven-year-old gets nothing from "which is louder?" on its own.

Hat Band keeps arranging by roles and sections. Little Conductor keeps one tune whose *performance* she shapes. Beat Builder keeps which beats sound; Song Maker keeps the notes; Sound Garden keeps judging a sound she hears. None of those lets her control a performance that is already playing, which stays this game's identity.

## Experience and presentation

**First action.** She taps a pad and the band answers within a beat: the pad lifts and glows, the animal hops, three friends change how they sway. The pleasure is control at no risk, because every choice sounds good. The pending ring is the only moment of waiting, and it counts the beat left so waiting is visible.

**Return to readiness.** After a change lands, the active pad stays lit and the other dims; nothing resets and nothing is lost, so she can change again at any time.

**Concrete art and sound.** The existing marimba, pluck and drum are enough. For a strength level the same friends play with bigger or smaller props and a wider or narrower sway (code-drawn scale, no new asset), and the quiet side is a gain table, never device volume. For a cue level a friend steps forward onto a spotlight pad when invited and steps back when released.

**What varies on replay.** The motif (three today; a second family of three for each new property), the order of requests, and the friends. The rule never changes.

**Separate the thinking from the reading and the motor skill.** Nothing here needs reading: pads are pictures, signs are the same pictures, and requests are spoken by the pet. Nothing needs precise taps either: any tap inside a pad counts, and a change always waits for a beat.

**Supported completion and stopping.** A round finishes by hearing the performance, with a sticker, whatever she chose. At the request levels a hint glows the requested pad and plays it once, then the round finishes with help like any other. She can leave at any moment and return to the same home.

**Co-play and sound off.** One person conducts and the other says "slow" or "fast" and then "gently" or "strongly"; at the cue level the grown-up chooses who plays. Sound-off play stays possible through the pictures and the sway, but a hearing question cannot be answered without sound, so the how-to card says so.

**Questions only a person can answer** (parked with the other [device checks](../DEVICE-CHECKS.md), not open work): whether 60 and 90 sound clearly different on a phone speaker; whether a toddler reads the pending ring as "wait a moment"; whether the drum hides the melody at the chosen gains; whether any child hears fast as winning; whether *gently* and *strongly* sound different enough through a phone speaker at the same device volume.

## Proposed ladder

### Fresh content inside existing levels

A second motif family: three more four-beat pentatonic tunes, rotated by seed with the first three, so a level repeats less. It needs only a new table and tests that every tune is pentatonic and four beats, plus the existing pace-independence test over all six. Small, and also a good first slice because it moves no save.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Strong or gentle | preschool, pre-K | The same tune, two cards: a small drum and a big drum; the pace stays fixed | Which strength to play, and when to change it | No misses; hearing both, then the chosen one whole, is the gate (as level 2) | Pitch, order and timing are identical at both strengths; only gain differs, and never above the device volume; gate resets on a strength change | New `strength` field in `Score`, gain table, two pad pictures; no save change |
| 5 | Two ways, one tune | preschool, pre-K, school | Pick pace and strength together, two dials, four combinations | Which of four performances she likes, after hearing all four | No misses; every combination heard whole is not required, only the chosen one | All four combinations produce the same events; heard gate follows the latest change of either dial | Needs a four-cell hearing mark; pad layout changes |
| 6 | Invite a friend | pre-K, school | Three friends, one accompaniment; tap a friend to ask them in or out | Who plays, with the rest steady | No misses; an empty stage simply invites a player; changes land on a boundary, so no missed entrance | Every cue lands on a whole beat; a friend never plays half a note; the score never skips or repeats | Cue state in `Score`; spotlight pads; layout of three friend targets of at least 100 units |
| 7 | One change | school | A sign asks for one contrast across two phrases: the second phrase must differ in one property and match in the other | Which property to change, and to what | A Check that fails says which property failed; two fails glow the property, counted as one hint per phrase | For every property and request, there is a satisfying setting; the Check names only the failing property; helped success reaches the finish | New request model from level 3; a visible property card |
| 8 | Revise for a listener | school | Hear two prepared versions, choose what to change, hear the revision | A deliberate audible change | No app score; the revision gate is hearing it, with an optional spoken explanation to a person | Revision always differs from the original in the chosen property; undo restores the original | Reuses level 7's model; no new save |

Baton (drag up and down to choose a pace) is a separate optional slice after level 3, not a level: a broad drag area whose estimated pace is smoothed and snapped to the nearest pad with hysteresis, never from pressure, never required. Cancelling returns to the last stable pace. It needs the [input and rendering pitfalls](../DESIGN.md#input-and-rendering-pitfalls) read first.

### Younger-band openings

Lap stays with Jelly Drums and Sing-Along Barn, as the study found. Toddlers keep levels 1–2; a toddler never meets a hearing question.

### Easier entries and levels between existing ones

None needed. If a toddler window is later added for level 4, append it by the built `order` and `entryLevels` support; no level is renumbered, and no pin changes.

### Left out on purpose

Tempo from touch pressure or accelerometer motion; loudness from force; any score of how well she kept time; a daily or timed mode; recorded music or licensed pieces; naming the property with a musical term on the child's screen; a leaderboard; and a baton as the only way to play.

## Decisions for the developer

None blocks the first two slices. Defaults are what a build uses.

1. **Phone first.** Default: give levels 1–3 an `upright` layout before any new level, because the phone is the current focus and the portrait branch already exists. Alternative: leave music games for the batch that is queued.
2. **New levels' order.** Default: strength (4), then two dials (5), then cues (6), then the request levels (7–8). Alternative: cues before strength, since the player's role (who plays) is easier to hear than gain on a small speaker.
3. **Strength's wording.** Default: *gentle* and *strong* with a small and a big drum picture, with no loud or quiet on screen. Alternative: *soft* and *loud*. Settle by the source check against established music curricula, per the 2026-10-23 decision.
4. **Strength and device volume.** Default: strength is a gain table relative to the island's setting and never raises it. Alternative: a narrower ratio if a phone speaker cannot show the contrast.
5. **School window.** Default: school starts at level 5 or 7. Alternative: none, leaving the game to the young bands.
6. **Keeping a performance.** Default: nothing is saved, as decided. Alternative: a single kept "my tune" slot in the rework's creation pool, owned by RW06, not here.

## Build slices, in order

1. **Built: upright layout for levels 1–3** (new-levels tier, typecheck, `layout` test over the four views, one portrait scripted play at level 3 with one wrong Check and one hint, a portrait screenshot, and `fingerdemo` for the changed layout): set `upright`, add a test that every target is at least 100 units, inside the view and clear of the pet's corner, and the sign clears the pads.
2. **Built: a second motif family** (rule tests only): three more tunes, the same pace-independence and event tests over all six.
3. **Built: level 4, strength** (new-interaction tier: typecheck, unit tests, one filtered scripted play at level 4, a portrait screenshot, and `npm run build` only if shared files change): strength as a gain table, the pictured pair, the heard gate over the latest change.
4. **Level 5, two dials** (new levels tier; claimed 2026-11-25, `claude/conductor-two-dials`).
5. **Level 6, invite a friend** (new-interaction tier; the largest slice, since cues need boundary-safe state).
6. **Levels 7–8, one change and revise** (new-interaction tier, after the request model from level 3 is shared).
7. **A baton, optional** (new-interaction tier; only after the developer asks for it).

## What was built in this session

Nothing: a deep dive session is research and ideation only. What ran: `node scripts/check-links.mjs` and `git diff --check`; the references' summary lines were read from the public encyclopedia pages on 2026-11-20.
