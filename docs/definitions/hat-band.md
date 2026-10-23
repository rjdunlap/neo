# Hat Band, levels 1–3 (definition)

Defined 2026-10-22 as slice **M5** of the [music and instruments study](../deep-dives/subjects/music-instruments.md#build-slices-in-order), [PR #840](https://github.com/rjdunlap/neo/pull/840), branch `claude/define-hat-band`. It uses the study's [Hat Band case](../deep-dives/subjects/music-instruments.md#hat-band-one-older-family-case) (the creative pair only), its [candidates table](../deep-dives/subjects/music-instruments.md#candidates-and-overlap-decisions), the [IDEAS row](../IDEAS.md#candidates) and the WAITING [Music row](../archive/DECISIONS-2026-10-23.md#decisions). **Docs only; no game, registration, code, audio or device evidence.** The rules are a proposal. Build waits on the gates under [Open decisions](#open-decisions) (above all decision 1, identity beside Beat Builder and Little Conductor). The older three-role arrangement brief is **M6** and stays out of this packet.

**Fun action and purpose:** two friends stand on a little stage with a rack of hats beside them. Each hat is a musical job. She puts a hat on a friend and that friend starts playing the hat's part, over and over; she takes it off and the part stops; she swaps it for another hat and the part changes. A **drum hat** gives the friend a beat; a **tune hat** gives them notes. Putting both on makes a band. The learning goal is **musical roles and texture**: a band is made of different parts, the same part sounds different alone than with others, and she decides who plays what. Nothing she does sounds wrong: every part is authored on the pentatonic scale, so any hat on any friend fits. No composing, no rhythm-tapping accuracy, no instrument-name quiz: the words are *hat*, *drum*, *tune*, *alone*, *together* and *band*.

## References

Nothing new was played for this packet. These are the same pages the [Little Conductor definition](little-conductor.md#references) already read, restated for what Hat Band takes; Incredibox, the IDEAS row's inspiration, was **not newly verified** and carries no claim here.

| Reference | What it shows | What Hat Band takes or rejects |
| --- | --- | --- |
| [Toca Band review, Horn Book](https://www.hbook.com/story/toca-band-app-review) and the [Zooglobble review](https://www.zooglobble.com/ios-apps/2013/11/6/toca-band-toca-boca) | Characters on a stage each play a loop; a star spot lets one perform alone; no wrong placement | **A visible stage where every friend is seen making their sound, a per-friend spotlight to hear one alone, and no wrong placement.** Rejects a 16-character cast, a record button and placing many players |
| [BANDIMAL (Yatatoy) in School Library Journal](https://www.schoollibraryjournal.com/story/yatatoy-at-it-again-touch-go) | A loop toy whose animals move with their sounds; any combination stays harmonious | **Pentatonic material so every mix is musical.** Rejects effects menus and a fixed song |
| [Musical Me! (Duck Duck Moose), Common Sense Media](https://www.commonsensemedia.org/app-reviews/musical-me-by-duck-duck-moose) | Ages 2–6; rhythm and notes as separate activities | **Rhythm and tune as separate, nameable jobs.** Rejects recorded songs and tapping in rhythm |

## Overlap

- **Beat Builder** owns deciding *which beats sound*: its squares are the composition, and its toddler Done and its section levels (7–9) already cover editing, copying and arranging parts of a percussion grid. Hat Band edits **no beat**. Its parts are fixed, authored and pictured; the choices are *who plays which job* and *what is playing together*. The distinct value is the **difference between a pitched tune and an unpitched beat** and what dropping either one does to the band. A test makes that difference inspectable ([Rule tests](#rule-tests-logictestts)); whether it is *audible* on a device speaker is a [device check](#device-and-person-checks), and decision 1 is the honest question whether this earns a game or belongs in Beat Builder.
- **Little Conductor** (built) owns *pace* on one fixed motif; nothing is added or removed. Hat Band keeps pace fixed and changes **who plays what**. They share an engine approach, a pure score advanced in `update(dt)` with changes landing on a beat, and nothing else.
- **Song Maker** owns composing a melody on a grid; Hat Band's tunes are given. **Jelly Drums** and **Rhythm Neighbors** own free notes and call-and-response taps. **Sound Garden** owns judging what she hears. **Sing-Along Barn** advances a known song.
- **Cue Studio / Dance Workshop** (proposals) are pet behavior and movement; the friends are not a choreography editor.

## The model

- **Roles and hats.** `Role ∈ {drum, tune}`. A `Hat` is `{ id, role, loop }`. `loop` is four beats, each `null` (rest) or an event: a drum loop is `boolean[4]`; a tune loop is `(PentatonicStep | null)[4]`, steps from `src/audio/notes.ts` within one octave. A tune hat always carries a pitch; a drum hat never does.
- **The authored loops** (four, two per role; a round puts two or four on the rack):

  | Hat `id` | Role | Loop | Shape |
  | --- | --- | --- | --- |
  | `steady` | drum | hit, rest, hit, rest | even and calm |
  | `skippy` | drum | hit, rest, hit, hit | a little skip at the end |
  | `cuckoo` | tune | 7, 4, 7, rest | two notes that call back and forth |
  | `rain` | tune | 2, 4, 7, 4 | up, then back down |

- **Fixed pace** 80 beats per minute. A bar (one loop) is 3 seconds. Pace is not a decision here; it belongs to Little Conductor.
- **The score clock** is the game's own, as in Little Conductor: the game registers `music: silenced(STYLES.jelly)` only to keep the island's loop quiet and the engine's clock alive, and advances a pure `Band` in `update(dt)`. `Band` holds `{ beat (fractional, global), worn: [HatId | null, HatId | null], solo: 0 | 1 | null, pending, heard… }`. `advance(band, dt)` returns `{ band, events }`: it moves `beat`, applies any `pending` change at the first beat boundary it crosses (a placement is **visible at once** and **audible at the next beat**, at most 0.75 s away), and emits each whole beat's events exactly once. A hat's loop index is `beat mod 4` (global), so a hat that joins mid-bar enters in step with the others instead of restarting. Events are voiced in `index.ts` (`sfx.drum()` for drum hits at a gain below the melody; `sfx.marimba(step)` for tune notes); the model never touches Web Audio.
- **Wearing.** A hat is worn by at most one friend and a friend wears at most one hat, so `rack ∪ worn` is always the whole round's hat set. Putting a hat on an occupied friend **replaces** the old hat, which returns to the rack. Two hats of the same role may be worn at once on the four-hat rack (level 2 and up): both play, and the band is still never wrong.
- **Solo (spotlight).** `solo` is a friend or none. With a solo, only that friend's events are emitted (the others stay dressed and dim); toggling it off, or any change of hats, returns to the full band. Solo changes are audible at the next beat like hat changes.
- **Heard gates.** `heardMix` counts whole beats since the last change to what is audible; `mixes` is the set of distinct audible mixes heard for a whole loop (four beats). `heardAlone: Record<HatId, boolean>` records a hat heard solo for a whole loop while worn. `canFinish(band, level)`:
  - **1:** the band is nonempty and `heardMix ≥ 4`.
  - **2:** the band is nonempty, `heardMix ≥ 4` and `mixes.size ≥ 2` (she has heard two different versions and finishes with the one she last chose, heard whole).
  - **3:** both friends wear a hat, `heardMix ≥ 4`, and every worn hat has `heardAlone` since it was put on (alone, then together).
- **A round** is a seeded choice of which hats are on the rack and which friends stand on stage; nothing else varies. Level 1: one drum and one tune hat. Levels 2–3: both of each role. The seed fixes the cast and the hat positions on the rack, so a replayed round never changes its materials.

## Levels

| Level | Name | Bands (proposed) | Rack | Round |
| --- | --- | --- | --- | --- |
| 1 | *Put on a hat* | preschool, pre-K | 2 hats (one drum, one tune) | Put a hat on a friend and hear their part; add the other, take one off; Done after the band has played one whole loop |
| 2 | *Swap a hat* | preschool, pre-K, school | 4 hats (two drum, two tune) | Replace or remove hats, spotlight a friend to hear one alone, hear two different versions, then finish with the one she likes |
| 3 | *Alone, then together* | pre-K, school | 4 hats | Both friends play; hear each one alone with the spotlight, then the two together, then Done |

`rangeFor` lists `preschool` 1–2, `prek` 1–3 and `school` 2–3 (the default for a band is the lowest level it holds, so school starts at 2). Lap and toddler stay with Jelly Drums and Little Conductor ([decision 2](#open-decisions)). Levels 4 and up are unassigned; the older three-role arrangement (M6) will append new IDs and must not renumber 1–3. Nothing gates.

## Screen and controls

- **Landscape (1024×768 design area):** a stage across the upper half with **two friends** (`CRITTERS`, seeded, the Music Mountain host bear excluded) 220 apart, each in a 160-wide spot. Below the stage a **hat rack** of 120×120 hats in a row with 24-unit gaps (2 or 4 hats, at most 552 wide), centered. Each hat carries a pictured badge so role is not color alone: a small drum on the drum hats, a note on the tune hats. Under each friend a **spotlight button** (a 100-unit round star, shown from level 2). At the right edge, **Done** (a 120-unit green check, dim until the heard gate opens). The pet keeps the bottom-left corner clear (`spread(n, 150, view.w - 40, gap)` for the rack).
- **Placing a hat.** Drag a hat (`src/engine/drag.ts`) onto a friend. **Tap-select then tap-place is a full alternative:** tapping a hat lifts and glows it; tapping a friend puts it on; tapping the hat again puts it down. A drop away from a friend returns the hat freely. Tapping a **worn hat** takes it off and returns it to the rack. Touch-down feedback is immediate; a small pending ring counts the beat left before the part joins the band, and a static clock icon and the friend's open mouth/prop make pending versus playing readable without color or motion alone.
- **The friends play with the hat.** The part's voice is the hat's, not the friend's, so swapping which friend wears it changes nothing but where it appears. A friend wearing a hat bobs on its beat and its prop flashes on each note; with no hat a friend stands ready. A solo dims the other friend. The band is silent until the first hat is on; after a bar's worth of silence at the start, nothing prompts her ([decision 7](#open-decisions) keeps the idle invitation off).
- **Done.** Dim before the gate; tapping it dim makes the pet say what remains (put a hat on, hear it a bit longer, hear another way, or hear each one alone) and shows it with a glow on the next step; nothing is counted. Lit: the band plays the current mix one more bar as the **performance**, the friends bow, and the round finishes.
- **Portrait:** the stage takes the top third, the rack in a 2×2 grid below it (120-unit hats, 24-unit gaps), the spotlight buttons under the friends, Done at the bottom-right and the pet's corner clear. `hatBandLayout(view, level)` returns every rectangle and a test asserts all targets are at least 100 units, the pet corner is clear and nothing overlaps at the four views.
- **Speech and the band.** The intro and the level's instruction play before the band starts. Feedback lines during play (an early Done, the finish) duck the band to half gain while spoken and restore it; the clock is not stopped and heard beats still count ([decision 6](#open-decisions)).
- **Sound.** Two synthesized voices from the existing helpers: `sfx.drum` and `sfx.marimba`, one short tick on a hat press, `sfx.tada` on the bow. One fixed gain per voice with the drum below the melody. No imported audio. No device volume above the island's setting.

## Accounting, help and finishing

- **Nothing is wrong.** Every hat on every friend, every order, removal, replacement, an empty stage and a repeat are free and never a miss. Preview and listening are free and never a hint. There is no Check at these levels, so the round has no wrong-answer or hint path; the supported finish is the heard gate itself, which the pet explains and glows toward.
- **Completion:** when the gate opens and she taps Done, one sticker per completed round through `ctx.finish({ misses: 0, hints: 0 })`. No timer, no lives, no streak, no scoring of the mix. An empty band simply invites a player.
- **Adaptation:** the shell's two-smooth-up rule applies unchanged, so two creative rounds at a level step up inside the band's range. The how-to note states this as interface progression, not evidence of musical understanding. A grown-up's pin stays put. Assisted completion is not evidence of independent knowledge; a heard gate is guidance, not a test.
- **Sound-off play.** The visuals (bobbing friends, flashing props, hat badges) let a round be completed without sound, but that completion is **not** evidence that she heard a difference between roles.
- **Keeping a mix:** nothing is saved; the performance is transient ([decision 5](#open-decisions)). A kept mix needs its own bounded schema, repair, backup and playback definition, folded into the rework (RW06), never a possession that wears out or waits.

## Rule tests (`logic.test.ts`)

Put the rules in `src/games/hat-band/logic.ts`, seeded with `ctx.rng`, and test the properties instead of driving the browser:

- Every loop has four beats; every tune step is in `PENTATONIC` range within one octave; no drum loop carries a pitch and no tune loop is all rests; the four loops are distinct.
- Each round's rack has both roles (and two of each at levels 2–3), no hat appears twice, and `rack ∪ worn` is always the full hat set after any sequence of moves (no hat is lost or duplicated).
- Enumerate every legal state of the four-hat rack (each of two friends wears none or one of four hats, no hat on both: 5 + 4 × 4 = 21 states) and assert each is reachable from the empty stage and is neither wrong nor stuck. Replace returns the old hat.
- `advance` emits each audible event exactly once and in loop order; a change takes effect only at a beat boundary and never skips or repeats an event; a hat joining mid-bar enters at its global `beat mod 4` phase; solo emits only the soloed friend's events and does not change `worn`; any hat change clears solo.
- **The role difference is inspectable:** with only a drum hat worn, no emitted event has a pitch; with only a tune hat worn, every emitted event has one; removing the tune hat from the two-hat mix leaves a pitchless band.
- The heard gates: `canFinish` is false for an empty band, true at level 1 after four beats of a nonempty mix, false at level 2 until two distinct mixes have each been heard for four beats, and at level 3 false until both friends wear hats and each worn hat has been heard alone; a hat change resets `heardMix` and the `heardAlone` flag of any hat put on after it was heard alone; replacing the hat loses nothing for hats already heard.
- A seeded round is deterministic (same seed, same cast, rack order and hats); the layout function returns non-overlapping rectangles of at least 100 units at the four views with the pet corner clear; the registry tests list the game among the silenced-music games.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` uses the tap-select/tap-place path (no hidden answer is read). Level 1: tap the drum hat, tap the first friend, wait for the pending ring to clear and four beats to play, tap the tune hat, tap the second friend, wait for the gate, tap Done. Level 2: the same, then tap a worn hat to take it off, tap another hat and a friend (a second version), wait for the gate, tap Done. Level 3: wear both, tap each spotlight and wait for its whole loop, tap the spotlight off, wait for the gate, tap Done. The bot waits by polling the public `Band` state, not by fixed sleeps. It never taps a dim Done.
- **How-to card** (`src/content/howto.ts`). Goal: "Put hats on the friends to make a band: each hat plays its own part."
  - Steps: "Drag a hat onto a friend, or tap the hat and then tap the friend" (all levels); "Tap a worn hat to take it off" (all levels); `{ from: 1, to: 1 }` "Listen to your band play the whole loop, then tap Done"; `{ from: 2, to: 2 }` "Swap hats, tap a friend's star to hear just them, hear two different bands, then tap Done"; `{ from: 3, to: 3 }` "Put a hat on both friends, tap each friend's star to hear them alone, then hear them together and tap Done".
  - Finish: "The band plays your tune once more and takes a bow."
  - Notes: "Every hat on every friend sounds good; nothing is a mistake" (all levels); `{ from: 2, to: 3 }` "The tune hats play notes; the drum hats play a beat"; "Moving up a level here means she is ready for the next thing to try, not that she can tell parts apart" (all levels).
- **Voice lines** under `hat-band.*`: `intro`, `instruct-1`, `instruct-2`, `instruct-3`, `drum`, `tune` (said on a hat press: "the drum hat", "the tune hat"), `empty` (the invitation), `hear-whole`, `hear-other`, `hear-alone`, `solo-on`, `solo-off`, `bow`, `done`. `{pet}` and `{name}` are optional in each. The words are *hat*, *drum*, *tune*, *band*, *alone* and *together*; no line says "rhythm", "melody", "texture" or an instrument's name beyond *drum*.
- **Registration:** ID `hat-band`, name "Hat Band", spoken title `game.hat-band`. Region (subject) `music-mountain`. Skills `['listening', 'musical roles', 'texture', 'cause and effect']` (free strings). Bands preschool 1–2, pre-K 1–3, school 2–3. `music: silenced(STYLES.jelly)`, listed with the other silenced games in the registry test. Home land **Music Mountain** ([decision 4](#open-decisions)). Hub icon: a stage with two hats. Sticker: a seeded friend in a hat with a small drum or note beside it.
- **Co-play:** one person puts a hat on the first friend and the other on the second, then swap hats; a grown-up can ask "which friend plays the beat?". **Off-screen** (a concept only; the study's *Our Little Band* card keeps its named-review requirement): with a willing grown-up, one hums a steady "boom, boom" and the other hums a tune over it, then swap; listening and declining are fine.
- **Couch:** none. **Rework couplings:** none required and nothing saved; the two friends are a natural place for **her creatures** ([PET-INTEGRATION](../rework/PET-INTEGRATION.md)).

## Check tier

New-game tier at build time: typecheck, unit tests (the rules above plus registry, lands and how-to tests), then one scripted play through a new `browser-check.mjs` case (its README row is part of the build) filtered to level 1 and the top level, with one early Done, one replace and one spotlight, plus one portrait screenshot at level 3; `fingerdemo` at levels 1–3. `npm run build`, because registry, lands, voice and how-to files change. The scripted play does not claim a wrong-answer or hint path, which does not exist here. Run nothing from this definition now: docs only, links and `git diff --check`.

## Device and person checks

Open in [DEVICE-CHECKS](../DEVICE-CHECKS.md#needs-a-person-or-a-device) once built: whether the drum and tune hats are clearly different on an iPad speaker and whether the drum masks the tune at the chosen gains; whether a four-year-old reads a hat as "mine to put on" and a pending ring as "wait a moment"; whether a one-beat wait feels responsive; speech of "drum hat" and "tune hat"; whether a school child still enjoys it (the likely reason to ship M6); and whether it feels like more than Beat Builder. A music educator reading of *drum*, *tune* and *alone/together* is recommended before any claim about musical roles; it does not block the screen-only build.

## Open decisions

Each has a default the build uses. None blocks a definition review.

1. **Identity.** Default: a new game, because the action (assigning a pitched or unpitched part to a friend and hearing the band change) is not an edit of Beat Builder's squares or a pace choice in Little Conductor. Alternative: fold it into Beat Builder as hats on its rows, which keeps one music editor but loses the bandstand. This is the study's decision 1; confirm after the role-difference test and a device listen.
2. **Bands.** Default preschool 1–2, pre-K 1–3, school 2–3. Alternatives: preschool 1 only (a 3-year-old may find swapping crowded), or school 3 only until M6 exists.
3. **Hat count and roles.** Default two roles and two hats each. Alternative: a third bass hat, which is M6's third role and would change level 3's gate; deferred on purpose.
4. **Home land.** Default Music Mountain; it lists six games today and the land layout test decides whether a seventh still fits at every band. Alternative: none sensible.
5. **Keeping a mix.** Default: transient. Alternative: a `tune`-style creation slot, folded into RW06.
6. **Speech during play.** Default: duck the band to half gain, keep the clock. Alternative: hold at the next beat and resume from the bar start.
7. **Idle invitation.** Default: none (Little Conductor's turtle pulse was a case of a bare screen; here the rack is plainly full of hats). Alternative: the pet points at a hat after six seconds, never counted.
8. **Pace.** Default 80 beats per minute, fixed. Alternative: 72 or 90 (a one-line change); a pace control stays in Little Conductor.
9. **Cast.** Default: two friends seeded from `CRITTERS` without the bear. Alternative: fixed friends for a familiar first screen.
10. **Adaptation.** Default: the shell rule stands; two smooth rounds step up and the how-to note says that is interface progression. Alternative: pin level 1 by default for preschool.
