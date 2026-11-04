# Light Lab — Through, bounce or stop? (level 11): what a material does to the beam

Definition, 2026-11-03, branch `claude/define-light-lab-materials`. This is dive slice 5 of the [Light Lab dive](../deep-dives/light-lab.md#build-slices-in-order). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the materials table checked against its source, the toy rule for translucent, the level's number and place in each band, the round, the accounting, the art, the voice IDs, the rule tests, the bot and the check tier.

## Scope and identity

**Fun action.** An everyday thing stands on a little stand in the sunbeam: a glass jar, a sheet of wax paper, a cardboard square, a shiny tin lid. She taps one of three big pictures to guess what the light will do (go **through**, **bounce**, or **stop**), then watches the sun shine. After three guesses, she uses what she saw: she picks the thing that wakes a flower, shades a sleepy owl, or bounces the light up to a flower.

**Learning purpose.** [NGSS 1-PS4-3](https://www.nextgenscience.org/pe/1-ps4-3-waves-and-their-applications-technologies-information-transfer): investigate what happens when objects made of different materials are placed in a beam of light. The game already covers mirrors (reflective) and rocks (opaque); this level names transparent and translucent and puts all four side by side, with a guess before each shine.

**What it is.** Level 11 of `light-lab`, for pre-K and school. It adds no new game, land or band. It is built **after batch light-lab 4**, so that IDs 8–10 (*Place a mirror*, *Two to place*, *Where's the mirror?*) keep the numbers their batches already use. `PLANS` is indexed by level, so it cannot have gaps.

## Source check

Checked 2026-11-03 against the NGSS page:

- **Performance expectation:** "Plan and conduct investigations to determine the effect of placing objects made with different materials in the path of a beam of light."
- **Clarification statement:** "Examples of materials could include those that are transparent (such as clear plastic), translucent (such as wax paper), opaque (such as cardboard), and reflective (such as a mirror)."
- **Core idea, PS4.B:** "Some materials allow light to pass through them, others allow only some light through and others block all the light and create a dark shadow on any surface beyond them, where the light cannot reach. Mirrors can be used to redirect a light beam."
- **Boundary:** no speed of light.

| Material (code name) | Child's word, spoken | NGSS term (grown-up text only) | Pool of things (seeded) | What the beam does |
| --- | --- | --- | --- | --- |
| `clear` | clear | transparent | glass jar, clear plastic cup, window pane | Goes through, just as bright |
| `cloudy` | cloudy | translucent | wax paper, tissue paper, frosted bottle | Goes through, dimmer |
| `solid` | blocks the light | opaque | cardboard square, wooden block, book | Stops; a shadow lies behind it |
| `shiny` | shiny | reflective | shiny tin lid, kitchen foil | Bounces a quarter turn, like a mirror |

The dive listed a **spoon**; it is dropped. A spoon is curved, so it scatters light or flips it upside down rather than turning a beam neatly, and the game would be teaching a rule that a real spoon breaks. A hand mirror is also left out of the pool, since the board's mirrors already are one.

## The toy rule

This is a stated toy rule, like pink glass. Real materials partly pass, partly reflect and partly absorb light; the game shows each thing's main effect. The grown-ups' level description says so.

- **New thing kind:** `{ kind: 'object'; x; y; material: Material; tilt: Tilt; name: ThingName }`. `tilt` is used only by `shiny`. Objects are locked: tapping one does nothing.
- **`trace` changes:**
  - `clear` passes the beam unchanged.
  - `cloudy` passes it and sets `dim: true` on every later cell (`Trace['cells']` gains `dim`). Dimming does not stack, because a board holds one object.
  - `solid` ends the trace like a rock (`end: 'rock'`), so `whyNot`, `beamEnd` and the shine animation need no new ending.
  - `shiny` turns the beam with `reflect(dir, tilt)`, as a mirror does. It never sends the beam straight back. A head-on bounce would retrace the sun's row and meet `trace`'s loop check, so it is left out.
- **A dim beam still wakes a flower.** Some light gets through, so the flower wakes, drawn half-open with a paler glow. Wax paper is a "through" thing, never a "stop" thing. No flower or goal needs bright light, which keeps dim-versus-bright out of every judged answer.
- **The shadow.** For `solid` only, cells beyond the object in the beam's direction (up to the board's edge) get a grey wash, so a shadow appears "on any surface beyond them".
- **The prediction answer** is `outcome(material)`: `through` for `clear` and `cloudy`, `bounce` for `shiny`, `stop` for `solid`.

## The board

The board is 6 columns by 4 rows, so a 100-unit `CELL` fits portrait and leaves landscape room for the picture row. The sun always stands on the left (`eitherSide: false`). Every board has the same simple shape, because the decision is the material, not the path.

- **Sun:** row 1 or 2 (seeded), column 0, shining right.
- **Stand:** a little wooden stand at column 2 or 3 (seeded) in the sun's row. The object, when there is one, stands on it.
- **Far flower:** in the sun's row at column 5.
- **Bounce flower:** in the stand's column, at row 0 when a `shiny` object (or answer) tilts up, at row 3 when it tilts down. The tilt is seeded and must point toward a row with a cell to spare; a sun row of 1 tilts down, a sun row of 2 tilts up.
- **Nothing else:** no mirrors, rocks or glass. In Part 1, the far flower and the bounce flower are always both drawn, so that "which flower wakes?" is itself what she watches. In Part 2, the board shows only the goal's target: the far flower, the owl, or the bounce flower.

## The round

The round has three guesses, then two choices, then one sticker. The plan is `{ mode: 'materials', puzzles: 5 }`; `LightMode` gains `'materials'`.

### Part 1: three guesses (never a miss)

1. A thing stands in the beam. Three picture buttons sit under the board, each about 150 by 130 units with a gap between: **through** (an arrow passing a pane), **bounce** (an arrow turning up off a slanted bar), **stop** (an arrow meeting a wall, with a grey shadow). Each says its word when touched. She taps one; it lifts and glows (immediate touch-down feedback).
2. The sun shines along the existing beam animation. Clear: the far flower wakes. Cloudy: the beam goes on paler and the far flower wakes softly. Solid: the beam stops and the shadow fades in behind; both flowers sleep. Shiny: the beam turns and the bounce flower wakes.
3. The pet says what happened in plain words (`light.mat.*`, below). It adds "Just as you guessed!" when her guess matched, and otherwise just names what happened, never "wrong". A guess is an experiment: no boing, no miss, no hint.
4. A next arrow, or a short pause, brings the next thing.

The three guesses use **three different materials**, drawn from the four by seeded shuffle, with one seeded thing from each pool.

### Part 2: two choices (judged)

The stand is empty, and the three picture buttons are replaced by a tray of three things (the same 150 by 130 units). The pet asks for one goal; the two goals in a round differ.

| Goal (`ChoiceGoal`) | Asked for | Board | Tray | The one right thing |
| --- | --- | --- | --- | --- |
| `wake` | "Wake the far flower. Which thing lets the light through?" | far flower | one through-thing, one `solid`, one `shiny` | the `clear` or `cloudy` thing |
| `shade` | "The owl wants to sleep. Make a shadow for it." | the sleepy owl (`owlArt` from `src/art/animals.ts`) sits where the far flower would | one `solid`, one `clear`, one `cloudy` | the `solid` thing |
| `bounce` | "Send the light up (down) to the flower." | bounce flower | one `shiny` (its tilt shown on its picture), one `clear`, one `solid` | the `shiny` thing |

- **Why the trays look like this.** `shade` never offers the shiny thing, because a lid that turns the beam away would also leave the owl in the dark. `wake` offers exactly one through-thing, so "clear or cloudy" never has two right answers. A rule test asserts the one-answer property with `trace` itself, rather than with the table.
- **Fairness.** Each goal's answer material must be one of the three shown in Part 1, or for `wake`, a through-material whose outcome was shown. The two goals are drawn from those that meet this.
- **One tap per try.** She taps a tray thing; it slides onto the stand and the sun shines right away. There is no drag at pre-K, so this needs no `drag.ts`.
- **Right:** the flower wakes, or the owl snuggles down in the shadow; `light.yay` or `light.mat.owl.yay`.
- **Wrong:** a gentle boing, the beam shows what really happened, and the pet names it with a teaching line (`light.mat.miss.*`, below). The thing slides back to the tray. **One miss.**
- **Two misses on one choice:** the right tray thing glows (`light.mat.hint`). **One hint.** Following the glow always finishes.

### Accounting

- Misses come only from wrong tray picks in Part 2; guesses never count. A round has at most a few misses, so adaptation reads the choices.
- Smooth (at most one miss, no hint) and struggling (four or more misses, or two hints) follow the shared rule.
- The round ends after the second choice, then one sticker.

## Level number and band orders

| Band | Today | After batch 4 | With this level |
| --- | --- | --- | --- |
| pre-K | `{ min: 1, max: 4 }` | unchanged | `{ min: 1, max: 11, order: [1, 2, 3, 4, 11] }` |
| school | `{ min: 2, max: 7 }` | `{ min: 2, max: 10 }` | `{ min: 2, max: 11, order: [2, 3, 4, 11, 5, 6, 7, 8, 9, 10] }` |

- **Why after level 4 in school.** Level 5's pink glass already assumes that light goes through glass; this level names that first. It asks no planning, so it does not belong above the planning ladder.
- **Why pre-K gets it now, despite "Left out on purpose".** The dive leaves out "a pre-K window above 4 until the new school modes are seen played". That rule is about raising pre-K into the multi-mirror planning levels (5–10). This level adds no planning: one fixed beam, one thing, a three-picture tap. It is the dive's own "pre-K top" placement, and the standard it practices is first grade's. The order lists only 11 above 4, so no planning level enters the pre-K window. If the person check below shows four-year-olds tapping the pictures at random, the pre-K order drops 11 again. No save renumbers, since `order` handles a level that is not listed.
- **No `entryLevels`.** Level 11 is in both orders, so a birthday that carries it into school lands on 11 itself.
- **Couch:** it stays out of the couch route and courses. Couch plays levels 4–6, and a free guess has no par.

## Art (code-drawn, `Graphics`, palette colors)

- **Glass jar:** a rounded rectangle with a pale blue 0.25-alpha fill and a white highlight stroke, plus a lid band.
- **Plastic cup:** a tapered cup outline in the same fill.
- **Window pane:** a wood-colored frame with four clear panes.
- **Wax paper / tissue paper:** a sheet with a wavy top edge, white at 0.6 alpha, with a few faint creases.
- **Frosted bottle:** a bottle shape in white at 0.6 alpha.
- **Cardboard square:** a `wood`-family brown rectangle with a corrugation line and a folded-corner triangle.
- **Wooden block:** the existing block colors.
- **Book:** two covers and a page edge.
- **Shiny tin lid / foil:** a silver ellipse or a crinkled sheet, with two white glints. It is drawn slanted at its tilt, so that its turn is visible before the shine.
- **Stand:** a short wooden plinth.
- **Choice pictures:** through, bounce and stop as described in Part 1, each with a 120-unit-plus hit area.
- **Shadow wash:** grey at 0.25 alpha over the cells behind a solid thing.
- **Owl:** `owlArt` with closed eyes, which turn open-and-blinking when the light hits it.

## Voice (planned IDs, not yet in `voice-script.ts`)

`{thing}` is the seeded thing's spoken name, filled from a small table ("glass jar", "wax paper" …). Device speech covers slotted lines until the voice work's slotted pass (V3).

| ID | Line |
| --- | --- |
| `light.materials` | "Something is in the sunbeam! Will the light go through, bounce, or stop? Tap your guess, then watch." (instruction; the pet repeats it) |
| `light.mat.through` / `.bounce` / `.stop` | "Through." / "Bounce." / "Stop." (the picture buttons, on touch) |
| `light.mat.clear` | "The light went right through the {thing}. Clear things let light through." |
| `light.mat.cloudy` | "Some light got through the {thing}, but it's dimmer. Cloudy things let a little light through." |
| `light.mat.solid` | "The {thing} blocked the light. Look, a shadow behind it!" |
| `light.mat.shiny` | "The light bounced off the shiny {thing}, like a mirror!" |
| `light.mat.guessed` | "Just as you guessed!" |
| `light.mat.ask.wake` | "Wake the flower. Which thing lets the light through?" |
| `light.mat.ask.shade` | "The owl wants to sleep. Which thing makes a shadow?" |
| `light.mat.ask.bounce` | "Send the light to the flower. Which thing can bounce it?" |
| `light.mat.miss.through` | "The light went through, so there's no shadow. Which thing blocks light?" (the `shade` goal, given a clear or cloudy pick) |
| `light.mat.miss.block` | "That one blocked the light. Which thing lets light through?" or, for `bounce`, "Which thing is shiny?" |
| `light.mat.miss.bounce` | "The shiny lid sent the light away. Which thing lets it go straight?" |
| `light.mat.miss.straight` | "The light went straight past. Which thing can bounce it?" |
| `light.mat.hint` | "Try the glowing one." |
| `light.mat.owl.yay` | "Shh. The owl is snug in the shadow." |
| `light.mat.done` | "You tested them all! Clear, cloudy, shiny, and blocking." |

The miss line is chosen by `whyNotMaterial(goal, picked)` in `logic.ts`, so tests can check that every wrong pick has a line naming what its material did.

## Layout and presentation

- **Board:** 600 by 400 units, at the existing `resize` position (top at least 110). The picture row or tray sits 30 units under the board.
  - Portrait 768 wide: three 150-unit buttons with 60-unit gaps make 570 units, so they fit.
  - Landscape 768 tall: 110 + 400 + 30 + 130 = 670, which leaves room for the bottom edge.
  - Keep the bottom-left pet and the corner buttons clear: the row is centred under the board, and its left button's left edge must clear the pet's corner at every view (a layout test, as at level 8's tray).
- **Shine:** the existing beam animation, with a paler, thinner stroke for `dim` cells and the shadow wash fading in at the end.
- **Mid-shine taps:** taps are ignored while the beam travels, so a fast second tap cannot count twice.

## Co-play, off-screen, how-to and bot

- **Co-play:** before each guess, a grown-up asks "What do you think?", and the child says it aloud before tapping.
- **Off-screen:** shine a torch through a glass, a sheet of baking paper, a piece of cardboard and a foil lid onto a wall. This becomes a level-scoped addition to the game's `offScreen` line if that line can vary; otherwise it goes in the GAMES entry.
- **How-to (level-scoped).** Existing steps written `{ from: 7 }` must become `{ from: 7, to: 10 }`, and `{ to: 6 }` already excludes 11. New steps for `{ from: 11, to: 11 }`:
  - "Tap through, bounce or stop to guess what the light will do, then watch the sun shine."
  - "Then tap the thing that wakes the flower, shades the owl, or bounces the light."
  - Finish: "The round ends after three guesses and two choices." Note: "Guesses never count as misses; a wrong choice is just another try, and the glowing thing is a hint."
- **Bot (`autotouch`).** On a guess, it taps the button for the true outcome; the demonstration only needs the verb, and a tap on any button is valid. On a choice, it taps `answerIndex(choice)` in the tray.
- **`describeLevel(11)`:** "Through, bounce or stop: guess what a clear, cloudy, blocking or shiny thing does to the beam, then pick one to wake a flower or shade an owl (a toy rule: each thing shows its main effect)".

## Rule tests the build needs

In `logic.test.ts`, over 400 seeds:

1. **`trace` per material.** `clear` and `cloudy` reach the far flower and wake it (and `cloudy` marks every later cell `dim`). `solid` ends with `end: 'rock'` at the stand and wakes nothing. `shiny` wakes the bounce flower, and only that flower.
2. **Outcome table.** `outcome` maps the four materials to through, through, stop and bounce, and the beam's actual effect agrees with it on every generated board.
3. **Guesses.** There are three per round, with three distinct materials. The sun row and the shiny tilt always point at a row inside the board.
4. **One right answer.** For every choice, exactly one tray thing meets the goal when traced: the flower woken, or the owl's cell unlit. Every other thing fails, and `whyNotMaterial` gives a line for each.
5. **Fairness.** Each choice's answer material (or, for `wake`, a through-material) was among the round's guesses. The round's two goals differ.
6. **Hint.** `hintThing` returns the answer index from any state.
7. **Ladder.** `rangeFor` gives pre-K `[1, 2, 3, 4, 11]` and school `[2, 3, 4, 11, 5 … 10]`. Stepping up from 4 reaches 11, and from 11 reaches 5 at school. `planFor(11).mode === 'materials'`.

The existing tests for levels 1–10 must stay green, since `trace` gains a thing kind that no earlier board uses.

## Settled and open

**Settled here:**
- the materials table and its source
- translucent as dim-but-through, with a dim beam waking flowers
- solid as rock-like
- shiny as a fixed-tilt mirror, with no head-on bounce
- the spoon dropped
- level 11 after batch 4, with the orders above
- guesses unscored and choices judged
- the one-answer tray rule
- the owl from `owlArt`
- no couch

**Left out:**
- bright-versus-dim goals
- colour (Level 5 owns it)
- a second object on one board
- dragging things onto the stand
- writing the results into the discovery journal (a later slice may file "clear, cloudy, blocking, shiny" as discoveries once the journal's contract is checked)

## Device and person checks

These go in [DEVICE-CHECKS](../DEVICE-CHECKS.md) once the level is built:

- Whether a four-year-old's guesses look considered rather than random. This decides whether pre-K keeps 11.
- Whether the dim beam reads as "some light" on an iPad screen.
- Whether device speech says "wax paper" and "tin lid" clearly.

## Build order and check tier

**One build slice: "`light-lab`, level 11 *Through, bounce or stop?*", after batch light-lab 4.**

New-interaction tier:
- typecheck
- unit tests, including the rule tests above and the registry and how-to tests
- one scripted play of level 11, with one guess that differs from the outcome (no miss), then on a choice one wrong pick, a second for the glow, then the right thing to the sticker
- one portrait screenshot of a guess mid-shine with the shadow or dim beam showing
- `fingerdemo` at 11

Files expected:
- `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`
- `src/content/voice-script.ts`, `src/content/howto.ts`
- the README row, `docs/GAMES.md`

Run `npm run build` only if a shared file beyond those changes.
