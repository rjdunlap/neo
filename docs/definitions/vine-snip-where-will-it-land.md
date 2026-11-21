# Vine Snip level 6: Where will it land? (definition)

*Game `vine-snip` · school band · defined 2026-11-21 from [dive slice 1](../deep-dives/vine-snip.md#build-slices-in-order) and the level 6 row of the dive's [new levels table](../deep-dives/vine-snip.md#new-levels-on-top). Docs only; nothing here is built. The build takes the dive's three [decisions](../deep-dives/vine-snip.md#decisions-for-the-developer) at their defaults: compare the same release point in opposite directions, release with an intentional Snip button at the marked pose, and treat every guess as free exploration.*

**Fun action and purpose.** An orange swings on one vine. It swings down to a ring at the bottom of its swing and holds there, with a dotted trail showing where it came from. She taps the leaf she thinks it will land on, then presses Snip. The orange flies off, and a leaf curls around it. The vine regrows with a new orange that swings through the same ring the other way, and she guesses again. Learning goal: **a released thing keeps going the way it was moving**. Height, speed, gravity and the release point stay the same, so the only change is direction, and the two landings sit on opposite sides. This is the prediction half of what levels 3–5 ask, without the timing: a child who knows where the fruit is heading can show it here even if her taps are late on level 3.

**Overlap checked.** [Swing Pals](../games/swing-pals.md) compares rope lengths and beats; this compares directions through one point and never changes the length. [Bouncy Launch](../games/bouncy-launch.md)'s school levels predict a landing distance after a shown pull or under two gravities; here the speed and gravity are fixed and only the direction flips, so the two games share the predict-then-reveal shape but not the question. Levels 3–5 of Vine Snip already let a mid-swing release "keep going" toward a friend, but they score the timing; level 6 scores nothing about the guess.

## Level ID and play order

`mode: 'where'`, appended to `PLANS` as **level 6**, `{ level: 6, name: 'Where will it land?', mode: 'where', lines: 1, counts: true }`. If another level takes 6 first, this takes the next free ID and this page's number is read as a name. `LEVELS.school` becomes `{ min: 3, max: 6 }`, with no `order` (the ladder is simply 3..6). No other band lists it, and no saved level or pin is renumbered. There is no couch entry, journal discovery or save change.

A round is **one pair**: two passes through the same ring, one in each direction, then Replay or Finish. It is a short round (about 25 seconds without a replay), which suits a prediction you want her to repeat.

## A round, step by step

1. **Approach.** The fruit starts at one end of its swing, nudged by a breeze, as level 3's does. It swings a quarter beat (0.62 s) down to the **release ring** at the bottom of the swing. A short dotted trail (the last 0.25 s of its path) follows it.
2. **Hold.** At the ring the picture holds, like a paused video: the fruit sits at the ring with its trail behind it and a soft arrowhead at the trail's front. The pet says the instruction (`ctx.instruct`). The fruit is not at rest; the model keeps the swing's velocity at the ring for the release.
3. **Guess.** Both leaves take a touch. Touch-down presses the leaf and puts the pet's paw print on it. Tapping the other leaf moves the paw print. The Snip button lights up once a leaf holds the paw print. Pressing Snip before she has picked a leaf gives a soft boop and "Pick a leaf first." This is not a miss.
4. **Snip.** Snip cuts the vine at the ring, and the fruit leaves with the swing's velocity at that point. It follows `arcAt` until it reaches the leaf line, 0.58 s later. The leaf it reaches curls around it with a pentatonic note from `src/audio/notes.ts`. The pass's friend (seeded from the six) pops up from behind that leaf and munches it, as the friends do on levels 1–5. The pet names the direction: "It kept going right!" (or left). If the paw print is on the other leaf, it stays there. The pet says the same line either way and never says "wrong".
5. **Second pass.** The vine regrows with a new fruit of the same kind at the other end of the swing. It swings through the same ring heading the other way. The first landing's paw print stays faintly on its leaf for comparison. "Now it's going the other way. Where will it land?" Steps 2–4 repeat.
6. **Compare.** After the second landing, both leaves show their landings and paw prints. The pet says "Same ring, opposite ways, opposite leaves." Two large buttons appear: **Replay** plays both passes again straight through, without holds or input, with the paw prints shown. It is free and can be repeated. **Finish** calls `ctx.finish({ misses: 0, hints })` for one ordinary sticker.

The authored first round sends an orange to the right first. Later rounds are seeded: fruit kind, the two friends, and which direction comes first. The geometry stays the authored pair on every round, so a pass changes only the direction.

## Misses and hints

- **No misses.** A guess is a prediction, and either leaf is welcome. `misses` is always 0 at level 6. There is no boing, glow-after-two-misses or float-back, since the fruit always lands on a leaf.
- **Show a hint** (the pause sheet's existing `askForHint`) replays the current pass's approach to the hold, with the trail drawn brighter. The pet says "Watch which way it's moving at the ring." It never points at a leaf. It counts `hints++` **at most once per pass** (so at most two in a round), and only during a hold before Snip. Asking at other moments repeats the current instruction and counts nothing. Two hints in a round makes it a struggling round in `src/progress/difficulty.ts`, which is deliberate: she asked for the motion to be shown both times.
- **Replay counts nothing**, and neither do changed guesses or a press of Snip without a guess.

## The model (`logic.ts`)

No new physics. Level 6 uses the shipped `beat`, `posAt`, `velocityAt`, `fallTime` and `arcAt` with `G = 1600`, landing on `LEAF_Y = 560` instead of the mouth line.

**The authored pair** (computed with the shipped functions on 2026-11-21):

| | Pass heading right | Pass heading left |
| --- | --- | --- |
| Swing | anchor x 360, vine 250, start angle −30° (`swingFrom` of the left end) | anchor x 360, vine 250, start angle +30° |
| Beat `T` | 2.484 s | 2.484 s |
| Ends of the swing | x 235.0 and 485.0, y 256.5 | same |
| Release at the ring (`t = T/4`) | (360, 290), velocity (+331.2, 0) | (360, 290), velocity (−331.2, 0) |
| Fall to the leaf line | 0.581 s | 0.581 s |
| Landing | x **552.4** | x **167.6** |

The landings are 384.8 units apart, mirror images about the anchor.

**New pure functions:**

- `wherePass(dir: 1 | -1): Swing` returns the authored swing for a direction. `ringTime(s)` returns `T/4`, the first time the swing crosses the ring.
- `whereLanding(dir)` returns `{ from, v, time, x }`, using `fallTime` to `LEAF_Y` and the shared arc. It has no friend and no catch band.
- `whereLayout()` returns, in board units, the two leaf targets, the Snip box, the ring, and Replay and Finish (below).
- `makeLine` for `mode: 'where'` returns a `Line` whose `where` field holds `{ first: 1 | -1, kind, friends: [FriendKind, FriendKind] }`. The authored first line is `{ first: 1, kind: 'orange', friends: ['bunny', 'duck'] }`. Seeding picks the rest from the shared pools.

### Rule tests

- **Same point, opposite directions.** For both passes, the ring position is (360, 290) within 0.5 units, the vertical velocity at the ring is 0 within 0.01, and the horizontal velocities are equal and opposite within 0.5.
- **Same solver.** Each landing equals `arcAt(from, v, fallTime(from, v, LEAF_Y))`. Mirroring the pass mirrors the landing about x 360 within 0.5.
- **Distinct leaves.** The landings are at least 300 apart. Each landing, with the fruit's 48-unit radius, sits inside its own leaf target and never touches the other.
- **Clear flight.** Sampled at 1/240 s, every arc and the whole swing stay inside the board (x 0–720) above the leaf line until landing. The fruit's circle stays at least 40 units from the Snip box (computed: 52.9).
- **The guess has no effect.** Whichever leaf the paw print is on, or with the paw print changed, the release, landing and timing are identical.
- **Every path finishes.** For each of the four guess combinations, with or without one Show a hint per pass and any number of Replays, a simulated round reaches Finish exactly once. `misses` is 0 and `hints` is at most 2.
- **Generation.** Over 500 seeds, `where` lines are well formed. The first direction takes both values, the two friends differ, and the authored first line is as stated.
- **Band and ladder.** `LEVELS.school.max` is 6, no other band reaches it, and `describeLevel(6)` is "Where will it land?". The registry, lands and how-to tests pass.

## Screen and controls

Board units, on the shipped 720 × 600 board that is never scaled. `whereLayout()` returns:

| Thing | Box (board units) | Notes |
| --- | --- | --- |
| Left leaf target | x 58–278, y 485–635 (220 × 150), centred on landing x 167.6 | A drawn leaf at `LEAF_Y` inside it |
| Right leaf target | x 442–662, y 485–635, centred on 552.4 | |
| Snip button | x 300–420, y 500–620 (120 × 120) | 22 units clear of each leaf target |
| Release ring | centre (360, 290), radius 60 | Drawn only; takes no touch |
| Replay, Finish | each 160 × 110, centred at (270, 380) and (450, 380) | Shown only after the second landing, when nothing is in flight |

Grow back is hidden at level 6, since there is nothing to undo. The paw print and the curled leaf stay inside the leaf targets.

**Envelope, computed with `computeView`, `captionPlace` and `boardOrigin`.** Vine Snip is not upright-ready, so a phone plays it sideways. Every sideways phone has a 768-unit-tall view:

- **667 × 375 phone, words shown (rail):** view 1366 × 768 at 0.488 CSS px per unit. The game keeps 1066 units right of the 300-unit rail. The board is at screen x 473–1193, y 124–724. The leaf targets are 107 × 73 CSS px and Snip is 59 px, so the 100-unit minimum holds, and the rail is clear of everything.
- **844 × 390 phone, words shown:** view 1662 × 768, board x 621–1341. Leaves 112 × 76 px.
- **568 × 320 (smallest checked):** view 1363 × 768 at 0.417. Leaves 92 × 63 px, Snip 50 px, still 100 units each.
- **1024 × 768 with words shown (bubble):** the board is at x 152–872, y 124–724. The bubble's space is x 0–640, y 343–583. It ends 26 units above the leaf targets (screen y 609) and 41 above Snip (624), so it never covers a control. It does cover the ring (screen 512, 414) while it shows. The hold lasts until she acts, so the trail is visible again once the bubble goes, and the build must not start a pass's hold timer under the bubble. The phone's rail has no such overlap.
- **Pet corner and shell buttons:** the board starts at screen x 152 or more, right of the pet corner (x < 150). The board's top (y 124) is below the 120-unit corner buttons at every view.

The build's layout test checks these at the four standard views and the three sideways phone views: every target is at least 100 units, none overlap, each is inside the board, and nothing is under the pet corner, the shell buttons or the caption band.

## Words and help

- **Voice lines** (new, under `vine-snip.*`): `instruct-where` "Where will it land? Tap a leaf, then press Snip." (`ctx.instruct`), `where-again` "Now it's going the other way. Where will it land?", `pick-leaf` "Pick a leaf first.", `kept-right` "It kept going right!", `kept-left` "It kept going left!", `hint-where` "Watch which way it's moving at the ring.", `where-done` "Same ring, opposite ways, opposite leaves." and `where-end` "Watch again, or finish?". Device speech covers them until the next voice-clip batch generates their clips.
- **How-to card** (`howto.ts`): steps 2–5's `to` stays 5. A new step `{ from: 6, to: 6 }`: "Watch which way the fruit is moving at the ring, tap the leaf you think it will land on, then press Snip. It swings back the other way for a second guess." A note `{ from: 6, to: 6 }`: "Any guess is fine and nothing counts as a miss. Show a hint replays the swing and counts once per guess. Replay is always free. The swing and the fall follow simple toy rules (slow gravity, no air), close to real motion but not exact." The game-wide goal and finish lines stay true, since a friend eats each fruit.
- **Ghost finger** (`autotouch()` at level 6): at a hold with no paw print, it taps the leaf `whereLanding` names. With a paw print and Snip lit, it taps Snip. After the second landing, it taps Finish. Every step waits for the scene to be ready, and none needs timing, so `fingerdemo` cannot miss a window.
- **Co-play:** one of you guesses the leaf and the other presses Snip, then swap for the second pass. **Off screen:** roll a soft ball across a low table each way over the same mark and watch where it reaches the floor. `offScreen` is game-wide, so the shipped sock-swing line stays, and the ball roll goes in the game page's design notes.
- **Replay and Finish** hide while a replay is playing and come back when it ends, so they never sit over a fruit in flight.

## Build checks

New-interaction tier: typecheck and the rule tests above, plus the registry, lands and how-to tests. One filtered `vinesnip` scripted play at level 6: guess the left leaf on the rightward pass and the right leaf on the leftward pass, one Show a hint, one Snip pressed before a guess, one Replay, then Finish with exactly one sticker, `misses` 0 and `hints` 1. One screenshot at the hold on a sideways phone view (844 × 390) with the words shown, and `fingerdemo` at level 6. Run `npm run build`, since the voice script and how-to barrels change. Then update the game page (`npm run game-docs`) and the dive's built line.
