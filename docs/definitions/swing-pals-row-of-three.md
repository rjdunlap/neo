# Swing Pals level 10: A row of three (definition)

*Game `swing-pals` · school · defined 2026-11-22 from [dive slice 4](../deep-dives/swing-pals.md#build-slices-in-order) and the dive's [pendulum-wave reference](../deep-dives/swing-pals.md#similar-games), after the `swingLayout` probe below. It extends the [levels 1–6 definition](swing-pals.md) and the built levels 7 and 8, whose model, riders and tap-a-friend target it reuses unchanged unless a line below says otherwise.*

**Fun action and purpose.** Three friends sit in a row on three swings: one on a short rope, one on a middle rope, one on a long rope. All three are pulled back to the mittens and let go together. They drift out of step, and then they come back together. Before they go, the pet points at one friend and asks which of the other two will be back at the mittens *at the same moment* as that friend first. She taps a friend to guess, then watches the row play out: every return taps its friend's note, a pair that meets at the back claps, and after a while all three are back together with a chord. Learning goal: **a pattern of motion predicts when two swings will line up again** (NGSS [3-PS2-2](https://thewonderofscience.com/3ps22), using a pattern to predict future motion). The short rope comes back twice for every long-rope swing, so the slow long rope meets the quick short rope sooner than the middle rope does. That surprise is the level's point. It is not level 7, where the question is only who comes back first. It is not level 8, where she matches a 2 : 1 beat by choosing a hook. Here the hooks are fixed and she reasons about when two beats coincide.

**Overlap checked.** Level 7 (*Who comes back first?*) asks for one swing's first return. Level 8 (*Twice as quick*) asks her to make one swing come back twice for each of the pet's. Level 9 (*Paint the beat*) records one swing's beat on paper. No other game times two repeating motions against each other. [Planet Hop](../games/planet-hop.md)'s orbits are the nearest relative: its predictions are unscored, as here.

## The `swingLayout` probe (2026-11-22)

The dive gated this level on a probe: three arcs inside every view, targets at least 100 units, the pet's corner clear. The probe was a throwaway vitest file. It applied the rules of today's `swingLayout(2, view)` to three swings and checked the probe's own boxes, but it did not check every rule the `logic.test.ts` layout tests enforce. It was not committed; the build slice turns it into a real rule test. The views were the four standard ones (landscape and portrait tablet, a landscape phone with and without insets) and the upright phone views from `upright-check.ts` plus the short one the swing's `upright.test.ts` adds. The numbers below come from the layout code, not from a device.

- **Three equal columns fail.** `swingLayout` splits the width into equal columns, one per swing, and each column must hold the long rope's whole arc. With three, an upright phone (768 units wide, seat raised) gets a long-rope scale of 166 at 18° and 247 at 12°. Today's layout test requires more than 300. That is why the dive asked for the probe.
- **A fitted row passes.** The row needs no hook choice: each swing keeps one rope (short, middle, long). So each column only has to be as wide as its own swing's arc, `2 × (rope × sin(height) + FRIEND_HALF + 10)`. The short rope's column is much narrower than the long rope's. The scale is the largest that fits `(x1 − x0 − 3 × 140) / (2 × sin(height) × 1.8125)`, where 1.8125 is the sum of the three rope lengths as fractions of the long rope (¼ + 9⁄16 + 1). As today, it is capped at 460 and at `seatY − 60`.
- **At 12° every view passes**: the long-rope scale is 409 on every upright phone view (raised seat), 460 on the landscape and portrait tablet views and both landscape phone views. The short rope is then 102 to 115 units, at least as long as today's two-swing short rope on the same view: 99 upright and 104 on a landscape tablet. So the short-hook rider rule (no rider rises further above the short hook than the first five do) holds as it does today. Every friend box from −12° to +12° stays inside the view, clear of the pet's corner and the shell's buttons.
- **At 15° and 18° it fails**: on upright phones the scale drops to 328 and 275, and the short rope falls to 82 and 69. At 18° the scale is below the 300 floor.
- **What the row looks like.** On an upright phone the width, not the angle, sets how far the swings travel sideways: about ±21 units for the short rope, ±48 for the middle and ±85 for the long. A wider angle would only shorten the ropes. The short swing therefore looks like a quick tick rather than a sweep. The mittens at the back points, each friend's note and the claps carry "together", not the sideways drift alone. Whether that reads well on a phone is a question for a phone playtest (see [Open decisions](#open-decisions)).

## Level ID and play order

- **ID 10**, name *A row of three*, plan `mode: 'row'`, three swings.
- **Bands** (`LEVELS` in `logic.ts`): school `{ min: 4, max: 10 }`. The ladder is still simply 4 to 10, so it needs no `order`. Preschool and pre-K keep 9 as their top. Lap and toddler are unchanged. `entryLevels` stays unset: a birthday from pre-K at 9 lands on school's 9, which school still lists.
- **Placement is intended.** It comes after level 8 (the 2 : 1 beat she made herself) and 9 (the beat on paper), so she has seen "twice for every one" before she has to use it to predict. Like level 7 it has no misses: a round without hints is smooth, so two of them complete the ladder rather than step past it. Grown-ups can pin it.

## The model

Everything in the [levels 1–6 model](swing-pals.md#the-model) holds: hooks 1.0, 1.5 and 2.0 s, `period(hook)` takes nothing but the hook. Weight and height never change the beat.

- **The row.** Three swings, one per hook, always short, middle and long. The row runs short to long from left to right, or mirrored (seeded per line), so the answer is not always on one side. Each swing has its own seeded friend from the full rider pool. All three are released together from the back at `BELL_ROW` = 12° and swing without settling for the whole watch.
- **Together** means two swings at their back points at the same moment, as at levels 4–6. The release itself does not count. Back times are whole multiples of each period, so the pairs meet first at the least common multiple of their periods: short and long at **2 s** (the long rope's first return, the short rope's second); short and middle at **3 s**; middle and long at **6 s**. All three meet at **6 s**: the short rope's sixth return, the middle's fourth and the long's third. (The dive said "after the long rope's two swings"; it is three, and the dive is corrected.)
- **The question.** Each line names one friend, the *pointed* friend, and asks which of the other two meets it at the back first. `firstMeet(row, pointed)` returns the other friend whose pairing comes sooner:

  | Pointed | Choices (first meeting) | Answer |
  | --- | --- | --- |
  | long | short (2 s), middle (6 s) | short |
  | middle | short (3 s), long (6 s) | short |
  | short | middle (3 s), long (2 s) | **long** |

  The third line is the tempting one: the slowest swing meets the quick one first, because the short rope comes back twice for every long swing. Every round holds it.
- **The watch** lasts until all three are together (6 s), then holds the line-up for a beat. Every return taps that friend's pentatonic note. Each pair's first meeting claps over the two mittens. The meeting the question asked about claps brighter, and the pet names it. At 6 s a three-note chord plays and the pet says "All three together again!".
- `logic.ts` gains plain functions: `rowLayout(view)` (the fitted row above, built from the same constants as `swingLayout`, with the seat raised upright), `meetTime(a, b)` (the least common multiple of two periods), `firstMeet(row, pointed)`, `rowWatch(row)` (6 s plus the hold) and the round maker for `mode: 'row'`.

## Screen and controls

- **Layout** from `rowLayout(view)`: three hooks on one bough, three ropes, three seats at one height (`seatY` as `swingLayout` sets it, raised upright). The hooks are pictures here, not targets. Each swing's mitten sits at its back point, as at levels 4–8.
- **Targets.** The two friends she may choose, held at the back at their release height, as at level 7: each friend's box (120 × 167 units) is the target. The pointed friend wears a small paw marker over its head (`markerAt`) and is not a target. A tap on it only says the question again. Friends' boxes never overlap: the narrowest column, the short rope's, is about 182 units wide upright.
- **Touch-down feedback.** The tapped friend bounces at once and a guess marker (a second paw, in her colour) sits over it. "Ready… go!" follows after a short beat, so a second tap before go simply moves the marker.
- **Upright on a phone.** The level plays upright, by the probe above: the swing's `upright.test.ts` gains level 10 (both friend targets inside the view at their release heights and clear of Home, "?" and the guide; the marker, mittens and finish row in view).
- Pixi `Graphics` only, colours from `palette.ts`. Music as the swing's other levels: she is not making the music.

## First round

The round has three lines.

- **Line 1, authored:** short rope on the left with the mouse, middle rope with the duck, long rope on the right with the bear. The paw points at the bear. "Who will come back with the bear at the same time first? Tap a friend." She taps; "Ready… go!"; all three swing. At 2 s the mouse and the bear clap together at their mittens: "The mouse and the bear came back together!" At 6 s all three meet with the chord.
- **Lines 2–3, seeded:** different friends, seeded mirroring, and the two other questions (pointed middle and pointed short) in seeded order. So every round holds the tempting line, where the long rope's friend is the answer.
- **After the tempting line** the pet says it once per round: "The short rope comes back twice for every long swing, so they meet first."

## Accounting, help and finishing

- **Never a miss**, as at level 7: this is a prediction made before watching. A guess that did not meet first is shown and named ("The bear and the mouse came back together first"), never a boing. A guess that did: "You guessed it!".
- **Show a hint** in the pause sheet, before she taps: the answer's friend glows and the pet says why in one line ("The short rope comes back twice for every long swing"). Counts `hints++` once per line. No automatic glow: there are no misses to count toward one.
- **Finish:** after the third line's line-up, the friends hop, the round ends through `ctx.finish({ misses: 0, hints, discoveries })`, and one ordinary sticker is given, with or without help.
- **Journal.** Nothing new is filed. `swing-pals:longer-slower` already files from levels 3, 7 and 9; this level shows the same rule and is left out of `showsSlower` so the entry's trigger stays as built.
- **Leaving early** keeps nothing and owes nothing, as every round.

## Rule tests (`logic.test.ts`)

- **Meetings are the beat.** `meetTime` is 2 s for short and long, 3 s for short and middle, 6 s for middle and long. All three are first together at 6 s. In the swing model, two swings are at their back points together at exactly those times and at no earlier time after release, with any friends.
- **The question.** `firstMeet` returns short for pointed long and pointed middle, and long for pointed short. It never returns the pointed friend. Over 500 seeds every round holds all three questions once, line 1 is the authored one, and mirroring varies.
- **The watch** lasts at least 6 s and ends after the all-three meeting.
- **Layout, from the probe.** `rowLayout` at the four standard views and the upright views: the long-rope scale is above 300. The short rope is at least as long as `swingLayout(2, view)`'s, so the short-hook rider rule holds. Every friend box from −12° to +12° is inside the view and clear of the pet's corner and the shell's buttons. Both orders, plain and mirrored, pass. The two friend targets at the back are at least 100 units and never overlap. Every mitten is clear of the pet's corner and the buttons.
- **Bands.** School's window is 4–10. Registry, lands, how-to and voice tests pass.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()` at level 10): taps the `firstMeet` friend on each line and waits for the line-up. The same bot drives the scripted play.
- **How-to card** steps `{ from: 10, to: 10 }`: "Three friends swing in a row: short, middle and long ropes"; "The paw points at one friend. Tap the friend you think will be back with it at the same time first"; "Watch: a short rope comes back twice for every long swing". Note `{ from: 10, to: 10 }`: "A guess is never wrong here; the swings show the answer."
- **Voice lines** under `swing-pals.*`: `instruct-row` ("Who will come back with {friend} at the same time first? Tap a friend."), `row-met` ("{friend} and {other} came back together!"), `row-all` ("All three together again!"), `row-twice` (the tempting line's explanation, also the hint). The existing `first-yes` serves "You guessed it!". The clip renderer picks them up through the `swing-pals` prefix.
- **Describe level:** `describeLevel(10)` "A row of three: three ropes swing together; she predicts which pair comes back together first. The long rope meets the short one before the middle one."
- **Co-play:** each player picks a friend and claps every time it comes back; count claps until all three meet. **Off-screen:** three strings with a washer each, cut short, middle and long (in the lengths 1 : 2¼ : 4), tied to a broom handle across two chairs; let go together and watch them drift apart and meet again.
- **Rework couplings:** none.

## Check tier

New level on the existing tap-a-friend interaction, with a new layout: typecheck and unit tests (the rule tests above, plus registry, lands, how-to, voice and the swing's upright test). One browser play of level 10 through the existing Swing Pals browser case, with one guess that does not meet first and one requested hint; one upright portrait screenshot of the row mid-watch. `fingerdemo` at 10. `npm run build`, because the voice and how-to files change. Then `npm run game-docs` for the page's generated block.

## Open decisions

None block the build; each has a default.

1. **Where 10 plays.** Default: school only, after 9. Alternative: also pre-K's top. Left out because pre-K has just met "short comes back first", and this asks for "twice for every one".
2. **Mirroring.** Default: a seeded mirror per line, so the answer is not always on the left. Alternative: always short to long left to right, the classic pendulum-wave picture.
3. **The short rope's small sweep.** About ±21 units upright. Default: the mittens, notes and claps carry the beat. A phone playtest note in [OBSERVATIONS](../OBSERVATIONS.md) is what would change it. One alternative is a small dot trail behind each seat; another is landscape-only play, which phone-first rules out.
