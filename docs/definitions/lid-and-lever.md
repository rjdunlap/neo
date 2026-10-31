# Attic Finds levels 3–4: Lid and Lever (definition)

Defined 2026-10-22 on `claude/define-lid-and-lever` ([PR #773](https://github.com/rjdunlap/neo/pull/773)), slice **H3** of the [everyday-life-long-ago study](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order), from step **A** of its [proposed ladder](../deep-dives/subjects/daily-life-long-ago.md#first-games-proposed-ladder-attic-finds) and its [candidate row](../deep-dives/subjects/daily-life-long-ago.md#candidates-and-overlap-decisions). **Built 2026-10-23** on `claude/attic-lid-lever` ([PR #870](https://github.com/rjdunlap/neo/pull/870)): lap 3, toddler 3–4, `entryLevels` [3, 4]; the peek door is 220 units wide (not ~240) at `DOOR_AT` (-40, 30); Finish after three turns; 0 misses and 0 hints. Device checks below stay open in [DEVICE-CHECKS](../DEVICE-CHECKS.md). Originally docs only. The build is queued as an [implementation batch](../GAME-BATCHES.md#attic-finds-1-lid-and-lever).

**What it adds:** two appended levels of the built `attic-finds` game (`src/games/attic-finds/`, levels 1–2, [definition](attic-finds.md)) that open it to lap and toddler:

- **Level 3, *Up and down*** (lap, toddler): one giant crank toy. A touch turns the big handle half a turn and the bird rises out of the box; the next touch turns it again and the bird sinks back.
- **Level 4, *Peek inside*** (toddler): the same toy with a little door on its front. Opening the door shows the rod that the handle pushes, so she sees *why* the bird moves, not only *that* it moves.

**Fun action and purpose:** touching a big handle and watching something happen because of it. The goal is **cause and effect** with its words (*up*, *down*, *turn*, *push*, *inside*): my touch turns the handle, the handle moves the rod, the rod lifts the bird. It prepares level 1's "try it and watch" for preschool. There is no question, no prediction, no evidence claim and no history: like the rest of Attic Finds, the toy is invented for the island, and nothing here says *old*, *long ago* or a date.

- Levels 1–2, their IDs, rules, pins and how-to wording at those levels do not change. No band, land, save field, journal entry, creation, couch entry or new game registration is added (the study's gate: "a younger Attic Finds opening, not a second registration").
- **Numbering.** These levels take **IDs 3 and 4**, the next free IDs, placed below level 1 by the lap and toddler ranges and listed in `entryLevels`. The study's later steps (Same need, Context: H4; Two sources onward: H5) were planning labels "3–7"; H4 is now [defined](same-job.md) as levels 5–6 and H5 numbers from **7**. The [Attic Finds definition's](attic-finds.md#levels) note that H4 "appends 3–4" is updated to match.
- **The study's gates.** A gentle, chosen finish after three activations (Finish never gated on anything else); 0 misses and 0 hints at every touch; a ghost-finger demonstration; no historical claim. Its decision 1 ("decide whether such rounds should drive adaptive stepping") gets a default under [Bands and ranges](#bands-and-ranges) and stays open in [Open decisions](#open-decisions).

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| lap | not supported | `{ min: 3, max: 3 }` |
| toddler | not supported | `{ min: 3, max: 4 }` |
| preschool | `{ min: 1, max: 1 }` | unchanged |
| pre-K, school | `{ min: 1, max: 2 }`, `{ min: 2, max: 2 }` | unchanged |

`bands` becomes `['lap', 'toddler', 'preschool', 'prek', 'school']`. `entryLevels: [3, 4]`, so a saved 3 or 4 carried by a birthday or a pin into preschool, pre-K or school lands on that band's easiest level (`landing`), never on its hardest. A new lap or toddler player starts at 3. Neither range needs an `order` (both run `min..max` easiest first).

**Adaptation (default).** Every round reports `{ misses: 0, hints: 0 }`, which is smooth, so two finished rounds step a toddler from 3 to 4, where she stays; lap stays at 3. Each step lands on another free level, never an assessed one, and `describeLevel` never calls either level mastered. A grown-up's pin holds her where they choose. No shared difficulty change.

**Land.** Attic Finds stays in **Story Grove**. Lap now sees 5 of its games there (was 4) and toddler 7 (was 6), both fewer than preschool's 9, which already fits; the lands test confirms every band in all four views.

## The screen

The same attic as levels 1–2 (roof line, round window, the shelf across the top), with one toy filling the middle and no Turn button, detail window, cards, claim or chips.

| | Level 3, *Up and down* | Level 4, *Peek inside* |
| --- | --- | --- |
| The toy | Seeded per round: the **bird box** or the **fish churn** from levels 1–2, front side, drawn at 1.45× (landscape) / 1.3× (portrait), so the handle reads as giant. The first round of a session is the bird box (authored) | Always the **bird box** (decision 5), front side, at the same size. Its front face has a **peek door**, a hinged wooden flap about 240 × 200 screen units with a round knob, covering the rod |
| The handle | The existing crank, drawn at the toy's scale, with a **220-unit** screen hit circle around its knob and shaft | Same |
| What a touch does | **Anywhere** in the attic (except the Finish picture and the shell's buttons) turns the handle: a lap swat always works | The handle or the box body turns the handle; the peek door opens or closes; a touch on the empty attic puffs a little dust (`eventMode` on the floor only), nothing more |
| The motion | Each turn is a **half turn** of the handle (two notch clicks, 0.6 s). It lifts the mover to the top and holds it there; the next half turn lowers it to rest. The mover peeps (bird) or bloops (fish) at the top | Same, and with the door open the rod is visible sliding up and down with the mover |
| The door | None | A tap swings it open (0.3 s, a wooden creak); a tap on the open door closes it. Free, any time, counted for nothing. The first time a turn plays with the door open, the pet says `attic-finds.peek` once per round |

**Touch-down feedback.** The handle dips 6° the instant a finger lands, before the half turn starts; the door's knob brightens on touch-down.

**Quick touches.** A touch during a half turn queues **one** more (a second touch during the same turn is dropped), so cause and effect stay one-to-one and a swat never makes the bird jitter. More than three touches at once are a palm and ignored (the existing palm rejection). A cancelled or lost touch does nothing; leaving the scene mid-turn stops the motion with the scene, so nothing is left moving.

**Idle.** After 6 s with no touch the handle wiggles once (the existing `IDLE_WIGGLE` invitation). It is never a hint.

**Speech.** The pet says `attic-finds.up` / `attic-finds.down` (with `{mover}`) for a turn **only when it is not already speaking**, so a run of fast touches gets sounds without a pile of words. Pitched sounds stay on pentatonic steps: a rising pair for up, a falling pair for down.

**The Finish picture.** After the **third** half turn she caused (bot turns and the idle wiggle do not count), a **140-unit** round button slides in, showing the toy on a shelf with a green tick, with a chime and `attic-finds.finish-ready`. It sits bottom-right in landscape (`v.w − 100`, `v.h − 100`) and below the toy, right of centre, in portrait, clear of the pet's corner and the toy's handle. It pulses once as it arrives and then waits; it is never a glow and never counts. Free play continues: the handle and door keep working for as long as she likes, and nothing ends the round by itself (decision 3).

**Ending.** Tapping Finish freezes input, shrinks the toy onto the first shelf spot with the existing chime, bobs the mover once, says `attic-finds.lever-done`, and calls `ctx.finish({ misses: 0, hints: 0 })`: one sticker from the shell, nothing kept, no journal entry.

**Portrait.** The toy sits in the upper middle (its handle at least 100 units from either edge), the Finish picture below it right of centre, and the pet keeps its corner. `atticLayout(view, level)` returns the toy's centre and scale, the handle hit circle, the door rectangle (level 4) and the Finish centre for levels 3–4.

## Accounting and help

Every touch is play: **0 misses and 0 hints**, whatever she does. There is no wrong place, no wrong order and no glow. The pause sheet's **Show a hint** at levels 3–4 wiggles the handle and repeats the instruction; it counts nothing, because there is nothing to get wrong. Start again rebuilds the same seeded round. The how-to card is not a hint.

## Logic (`logic.ts`)

- `Plan` becomes `{ id: 1 | 2 | 3 | 4; name; mode: 'try' | 'prove' | 'lever' | 'peek' }`, and `PLANS` gains:
  - `{ id: 3, name: 'Up and down: tap the big handle and the bird or fish goes up, then down', mode: 'lever' }`
  - `{ id: 4, name: 'Peek inside: open the little door and watch the rod lift the bird', mode: 'peek' }`
- `planFor(level)` finds the plan by `id` (today it clamps by index, which would turn level 3 into level 2's plan). An unknown level falls back to level 1.
- `LeverState = { up: boolean; turns: number; queued: boolean; turning: boolean; doorOpen: boolean; peeked: boolean; done: boolean }` and pure steps over it: `press(s)` (starts a half turn, or queues one if turning and none is queued, else no change), `turnEnded(s)` (flips `up`, counts the turn, starts the queued one), `toggleDoor(s)` (level 4 only), `canFinish(s)` (`turns >= 3 && !done`) and `finishLever(s)`. A bot or idle wiggle never calls `press`.
- `makeLeverRound(level, rng, first)`: the object (`bird-box` at level 4 and on an authored first round, else seeded between the two), and the mover's palette colour from a small seeded list; the causal rule never varies with the seed.
- `atticLayout` gains the level-3/4 rectangles above; levels 1–2 keep their plan unchanged.

## Rule tests (`logic.test.ts`)

- **Plans:** `planFor(3).mode === 'lever'`, `planFor(4).mode === 'peek'`, `planFor(1)` and `planFor(2)` unchanged, an unknown level gives plan 1; every plan has a non-empty name.
- **Toggle:** from rest, `press` then `turnEnded` gives `up: true`; again gives `up: false`; `turns` counts each ended turn exactly once.
- **Queue:** while turning, a first `press` queues, a second changes nothing; `turnEnded` starts the queued turn, so N presses during one turn produce at most two turns.
- **Finish:** `canFinish` is false for 0–2 turns and true from the third turn onwards, for any interleaving of presses and door toggles; it stays true however many more turns follow; after `finishLever` further presses change nothing.
- **Accounting:** over 500 random input sequences (presses, door toggles, finish attempts) at both levels, the round's result is `{ misses: 0, hints: 0 }`, and the round can always be finished within three presses of any state.
- **Door:** `toggleDoor` alternates `doorOpen` at level 4 and does nothing at level 3; it never changes `turns` or `canFinish`.
- **Rounds:** the same seed gives the same round; level 4 is always the bird box; level 3 shows both objects across 200 seeds; the authored first round is the bird box.
- **Bands:** the module's lap range is `{3,3}`, toddler `{3,4}`, preschool/pre-K/school unchanged; `entryLevels` is `[3, 4]`; `landing(4, prekRange, entryLevels)` is 1 and `landing(3, preschoolRange, entryLevels)` is 1.
- **Layout:** at the four views for levels 3 and 4, the handle circle is at least 100 units across and inside `view`, the door (level 4) and Finish are at least 100 units, Finish overlaps neither the handle circle, the pet's corner nor the shell buttons, and the door does not overlap the handle circle.
- **Registry, lands and how-to tests** pass with the new bands, including Story Grove fitting at lap and toddler in every view, and no "later levels" wording on the card.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()`): level 3 taps the handle three times, waiting for each half turn to end, then taps Finish. Level 4 taps the handle once, taps the door open, taps the handle twice more (the rod shows), then taps Finish. It always aims at the handle, even at level 3 where anywhere works, so the demonstration shows what causes the motion. The same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). The card's plain strings that are not true at levels 3–4 become level lines:
  - Goal (whole ladder, with no level wording, which the how-to test rejects): "Crank an attic thing, watch what it does, and find what makes it move."
  - Steps: the existing "Tap the parts to see them up close. Tap Turn to see the back." becomes `{ from: 1, to: 2 }`; add `{ from: 3, to: 3, text: 'Tap anywhere, or the big handle. The bird or fish goes up; tap again and it comes down.' }`, `{ from: 4, to: 4, text: 'Tap the big handle: the bird goes up, then down. Tap the little door to open it and see the rod inside.' }`; "Crank it again any time to watch." stays plain.
  - Finish: `{ from: 1, to: 2, text: 'Both things sit on the shelf.' }`, `{ from: 3, to: 4, text: 'After three turns of the handle a shelf picture appears; she taps it when she is ready, and the toy goes onto the shelf.' }`.
  - Note `{ from: 3, to: 4 }`: "Every touch is play: nothing is ever counted as a miss or a hint, and the round ends only when she taps the shelf. Everything in the attic is made up for the island; nothing here is a real old thing."
- **Voice lines** (`voice-script.ts`, all with an optional `{pet}`):
  - `attic-finds.instruct-lever`: "A big handle! Tap it and watch."
  - `attic-finds.instruct-peek`: "Tap the big handle. Then open the little door and peek inside!"
  - `attic-finds.up`: "Up goes the {mover}!"
  - `attic-finds.down`: "Down goes the {mover}!"
  - `attic-finds.peek`: "Look inside! The handle pushes the rod, and the rod lifts the {mover}."
  - `attic-finds.finish-ready`: "All done? Tap the shelf when you're ready. Or keep turning!"
  - `attic-finds.lever-done`: "Onto the shelf! Up and down, up and down."
  - `ctx.instruct` uses the level's instruction line, so the corner pet repeats it when tapped.
- **Registration:** the module's `bands`, `levels`, `entryLevels` and `describeLevel` change as above; ID, name, title line, region (`story-grove`), skills, music (`STYLES.paint`, not silenced), hub icon and sticker do not. The co-play hint gains no level text (it stays true: one cranks, one watches). Couch: none.
- **Rework couplings:** none. Nothing is saved; the shelf stays a round's picture, not a possession.

## Build and check tier

New-interaction tier (a new input inside an existing game), as the study's H3 row sets it: typecheck and unit tests (the rule properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (`atticlever`, with its README row) at levels 3 and 4 that taps fast enough to exercise the queue, opens and closes the door, checks Finish is absent before the third turn and present after, and finishes with `{ misses: 0, hints: 0 }`; one portrait screenshot at level 4 with the door open; `fingerdemo` at levels 3 and 4; `npm run build`, because the how-to and voice files are shared.

### Expected files

`src/games/attic-finds/logic.ts`, `logic.test.ts`, `index.ts`; `src/content/howto.ts`; `src/content/voice-script.ts`; `scripts/browser-check.mjs`; README (the inventory row's bands and the browser-check row), `docs/GAMES.md` (the Attic Finds entry), `docs/VERIFICATION.md`.

Device checks stay open: whether a one-year-old's swat reads the handle as the cause (rather than "the screen makes it go"); whether a two-year-old finds and opens the door unprompted; whether the Finish picture is tapped on purpose or by accident; device speech of the new lines.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** all seven defaults stand as the build uses them: the ordinary 0/0 step-up from 3 to 4, preschool level 1 only, only her Finish tap ends a round, any attic touch turns the handle at level 3, the bird box at level 4, home Story Grove, and the pet never says *lever*, *old* or *long ago*.

Each has a default the build uses. None blocks it.

1. **Adaptation.** Default: rounds report 0/0 and step a toddler from 3 to 4 after two rounds, as every free level does. Alternative: hold her at the level until a grown-up moves it, which needs a shared "do not adapt" rule that does not exist yet.
2. **Preschool entry.** Default: preschool keeps level 1 only. Alternative: preschool `{ min: 1, max: 4, order: [4, 1] }` so a just-turned-three player starts by peeking inside.
3. **Ending.** Default: Finish appears after three turns and only her tap ends the round. Alternative: also end by itself after 24 turns, as Jelly Drums' *One big jelly* does, for a lap player who never taps the picture.
4. **Anywhere at level 3.** Default: any touch in the attic turns the handle, so a swat works. Alternative: only the toy, which makes the handle's role clearer but leaves a lap player's off-target touches doing nothing.
5. **Level 4's toy.** Default: the bird box only, with a front peek door. Alternative: the fish churn too, with a cloth cover over the jar (new art, and a second door rule).
6. **Land.** Default: Story Grove, as levels 1–2. Alternative: the Treehouse, as the Attic Finds definition's decision 3 already offers; unchanged here.
7. **Words.** Default: *up*, *down*, *handle*, *rod*, *inside*; never *lever* aloud (the name is for grown-ups), never *old* or *long ago*. Alternative: the pet says "lever" at level 4.
