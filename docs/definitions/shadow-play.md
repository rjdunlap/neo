# Shadow Play, levels 1–4 (definition)

**Built:** levels 1–2 (PR #2035); to build level 3, read “Build batches” (batch 2).

Documentation packet, 2026-11-23, branch `claude/define-shadow-play`, [PR #2027](https://github.com/rjdunlap/neo/pull/2027). Study follow-up TP6 from [theatre and puppetry](../deep-dives/subjects/theatre-puppetry.md#candidates-and-recommended-order); placement settled by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed). Game `shadow-play`: levels 1–2 are built (batch 1); levels 3–4 are batch 2 below.

## What you do

On Lantern Night the islanders put on a shadow show. A lamp stands on a table at one end, a cloth screen at the other, and three flat cut-outs on sticks stand between them, each on its own rail. The screen shows the outline of tonight's backdrop: a row of rooftops, tents and domes joined into one skyline. Slide each cut-out toward the lamp or away from it, and at higher levels turn it on its stick and choose which rail it stands on, until the shadow fills the outline exactly. Then the skyline's windows light up and the show begins.

The learning is how a point of light makes a shadow. A cut-out nearer the lamp casts a bigger shadow, and the size follows one rule: the shadow is the cut-out multiplied by the screen's distance divided by the cut-out's distance. A cut-out turned on its stick casts a narrower shadow of the same height. Reading a joined outline back into its three parts, some of whose edges are hidden behind a neighbour, is the puzzle.

Use stable level IDs 1–4 and the `grownup` band only. Use Tinker Lab as the learning region, the home of Light Lab, and Space as the challenge. Add one Lantern Lake tile through the existing land paging; it lands on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. An arrangement is round state. It carries no economy, inventory, streak or saved puzzle.

The gesture follows the [Spark AI Games review](../reviews/SPARK-AI-GAMES.md#p5-turn-the-shadow-the-interaction-for-an-existing-sketch-m), which recommended starting from turning flat plates rather than from free placement in space. The study's sketch (a point lamp, flat cut-outs, shadow size by distance) supplies the sliding.

## Identity and overlap

- **Light Lab** (`light-lab`) bounces a beam off mirrors to a target. It has no shadows and no sizes. Shadow Play shares only its region.
- **Peekaround Island** (`peekaround-island`) asks what a scene looks like from another seat. Shadow Play keeps one fixed view and changes distance and turn.
- **Puppet Stage** (`puppet-stage`) is performing with stick puppets for an audience. Shadow Play borrows the stick and the Lantern Night setting and nothing else: there is no story, voice or performance to judge.
- **Shadow Stage** (the [notebook](../IDEAS.md#candidates) seed for ages 4–8) waits on this light model. It stays in the notebook; a younger form is a later proposal below.
- **Not here:** wayang, Chinese shadow play or any named tradition (cultural framing belongs to a cultures study under the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules)); hand shadows; a free-moving lamp; colours of light; timers; a mistake cap; daily puzzles.

## The light model

Keep the model in `logic.ts`. It is deliberately small and exact.

- **The table.** The lamp is a point at table height. The screen stands 12 marks from the lamp. Each rail runs straight from the lamp to its own spot on the screen, so a cut-out sliding along its rail keeps its shadow centred on that spot. Each rail has four marks where a cut-out can stand: **2, 3, 4 and 6**.
- **Scale.** A cut-out at mark *d* casts a shadow 12 ÷ *d* times its size: ×6 at mark 2, ×4 at mark 3, ×3 at mark 4 and ×2 at mark 6.
- **The screen.** The screen is a grid 24 squares wide and 12 tall. The three spots are at 6, 12 and 18 squares from the left edge, on the bottom line. Every shadow stands on the bottom line, because the lamp and the cut-outs' feet are at table height.
- **The cut-outs.** There are three shapes: a **block** (a rectangle), a **tent** (a triangle with its point up) and a **dome** (half an ellipse). Each comes 1 or 2 squares wide and 1 or 2 squares tall, which makes twelve cut-outs.
- **The turn.** A cut-out is **face-on** or **turned**. A turned cut-out stands at 60° to the screen, so its shadow is half as wide and just as tall.
- **A shadow part.** A cut-out of width *w* and height *h* at mark *d* casts a part of width *W* = *w* × 12 ÷ *d* (halved when turned) and height *H* = *h* × 12 ÷ *d*, centred on its spot. A block's part has height *H* across its width. A tent's part falls in a straight line from *H* at the centre to nothing at each edge. A dome's part is the upper half of an ellipse.
- **The shadow.** The whole shadow is the three parts together. At every point along the bottom line its height is the tallest part there.
- **Two shadows are the same** when they cover the same region of the screen. The rule code compares the shadow's height at the middle of each quarter-square along the bottom line (96 columns), rounded to four decimal places.

An **arrangement** is, for each rail, a cut-out, a mark and a turn. An arrangement is **accepted** when its shadow is the same as the outline, whichever arrangement made it. A **board** is one arrangement, its *solution*, whose shadow is drawn as the outline. Every board in every pool passes two filters:

- **Whole squares.** Every part's width and height is a whole number of squares, so every edge sits on a grid line.
- **One answer.** No other arrangement open to the player at that level casts the same shadow. Two cut-outs of the same shape and size count as one.

Two more words describe a board. It is **apart** when neither neighbouring pair of parts touches (the two widths add to less than 12). It is **joined** when both neighbouring pairs touch or overlap (each pair's widths add to 12 or more).

## Levels and pools

Brute-force enumeration over the model above gives the pools below. Use these exact numbers as rule-test totals. A pool counts ordered boards: the same three cut-outs on different rails are different boards.

| Level | Lamp | The player sets | Pool filter | Boards |
| --- | --- | --- | --- | --- |
| 1 · *Near and far* | Lit: the shadow moves as the cut-outs slide | Each rail's mark | Face-on, apart | 44,496 |
| 2 · *Lamp out* | Out until **Light** | Each rail's mark | Face-on, joined, one answer among the 64 face-on arrangements | 30,516 of the 30,672 joined face-on boards |
| 3 · *Turn it* | Out until **Light** | Each rail's mark and turn | Joined, at least one cut-out turned, one answer among the 512 arrangements | 51,627 of 52,056 |
| 4 · *Which goes where?* | Out until **Light** | Each rail's cut-out, mark and turn | Joined; three different cut-outs, at least two of one shape; one answer among the 3,072 arrangements | 38,050 of 41,976 |

At levels 1–3 each cut-out starts on its solution rail and stays there. At level 4 the seeded RNG deals the three cut-outs onto the rails in an order that is not the solution's. At every level each cut-out starts face-on at a seeded mark that is not its solution mark. Every apart face-on board has one answer, because no edge is hidden. The 156 joined face-on boards left out of level 2 each hide a part's width behind its neighbours.

A level-1 round is two boards. Levels 2–4 are one board a round. Each level samples its pool with `ctx.rng`, never repeating the previous round's board. Redisplay the same board and arrangement, and the lamp's state, through resize and rotation.

**What each level asks.**
- **Level 1** teaches the rule by play. Nearer is bigger, and the shadow at mark 3 is twice the shadow at mark 6.
- **Level 2** asks for the same rule worked out in the dark. The outline is 6 squares tall here, this tent is 2 tall, 6 is three times 2, and 12 ÷ 3 is mark 4.
- **Level 3** adds a second reading. Height fixes the mark, and then a part half as wide as its mark would give must be turned. A part's hidden edge is found from its visible one, since every part is centred on its spot.
- **Level 4** adds the assignment. Two cut-outs of one shape can each reach some sizes and not others: a part 12 squares tall can only come from a cut-out 2 tall at mark 2.

## Sliding, turning, Light, feedback and credit

Each rail is a row with the lamp at one end and the screen at the other, the four marks drawn at their true distances, and its cut-out as a handle on the rail. The grid numbers the marks. The cut-out's size is drawn on the handle as squares (for example a tent 2 wide and 2 tall) and is spoken when the handle is first touched.

- **Slide.** Drag the handle along its rail, and it snaps to the nearest mark on release. Tapping a mark moves the cut-out there. Both use `src/engine/drag.ts` and `onTap`.
- **Turn** (levels 3–4). Tap the handle to switch between face-on and turned. The handle draws narrower when turned.
- **Swap** (level 4). Each rail has a chip at its lamp end showing its cut-out. Tap one chip and then another, and the two cut-outs change rails, each keeping its own mark and turn. Tapping the same chip twice clears the choice.
- **Free moves.** Sliding, turning, swapping and re-hearing a size are always free, and nothing is refused.

**Level 1** has no Light button. The shadow follows every move, and the board finishes by itself when the shadow fills the outline. Nothing at level 1 can be a miss.

**Levels 2–4** start with the lamp out. The outline stays on the screen and no shadow shows. **Help** and **Light** sit below the rails.

- **Light on a wrong arrangement** lights the lamp and shows the real shadow over the outline. Shadow outside the outline and outline left uncovered both read by hatching as well as colour. The explanation names the first rail from the left whose part differs, in terms of what is on screen: "The left shadow is too short. This dome is 1 tall at mark 6, so its shadow is 2 tall. The outline there is 4 tall." A wrong arrangement always has such a rail at these levels, because only the solution casts the outline. The lamp goes out again at the next move. Count **one miss per distinct wrong arrangement** within a round. Lighting the same arrangement again replays the explanation, free. The miss sound is the gentle boing.
- **Why a miss counts here.** Lighting the lamp checks a worked answer: the grid, the marks and the cut-out sizes are all on screen and settle the arrangement before the lamp is lit. It is the same step as Check in Picture Logic or Cross in Truth Bridge. It is not a guess about an unknown outcome, which the island never counts as wrong.
- **The second counted miss** gives one assisted hint, and **Help** asks for one at any time, at level 1 too. The hint takes the rails from the left and, on each, the cut-out (level 4), then the mark, then the turn (levels 3–4). It stops at the first one that differs from the solution, highlights that rail and the part of the outline it answers to, and says the working:
  - cut-out: "The right outline is a dome. Only the dome 2 tall can make a shadow 12 tall. Swap it onto the right rail."
  - mark: "The middle outline is 6 tall. This tent is 2 tall. 6 is 3 times 2, and 12 divided by 3 is 4. Slide it to mark 4."
  - turn: "At mark 4 this block's shadow would be 6 wide. The outline is 3 wide. Turn it."

  Repeating the current hint with no change replays it, free. Count each new hint once.
- **Hints always lead somewhere.** Following a hint sets one more value to the solution's and never unsets one. The rule test walks sampled arrangements of sampled boards at every level and checks that a chain of hints reaches the solution in at most the number of values the level lets the player set (3, 3, 6 and 9).
- **On acceptance** the lamp glows, the shadow fills the outline, small windows light in the skyline one part at a time on pentatonic notes, and the game finishes once through the normal shell with the round's misses and hints.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md) and the existing `onTap`, drag, coach and round helpers.
- **Upright phone first.** At 390 × 625 with captions and the active guide, set out the following, top to bottom:
  - the screen, the full width, with its grid, the outline and the shadow;
  - the three rail rows, each with its chip, lamp end, marks and handle;
  - Help and Light.
- **Rails.** A rail is drawn to scale, so marks 2 and 3 are the closest pair. A layout test checks that neighbouring marks are at least 24 logical units apart at 390 wide and that a handle at mark 2 does not cover the chip. The handle and every tap target meet the grown-up minimum of 64 logical units, aiming for 100.
- **The screen.** Grid lines are faint, with a stronger line every 6 squares and a tick at each spot. The outline is a dashed line and the shadow a soft dark fill. Outline and shadow read apart by line style, never by colour alone.
- **Landscape.** Put the screen on the left and the rails, Help and Light on the right.
- **Captions and the guide.** Reserve their space first.
- **Art.** Draw the table, lamp, cloth screen, sticks, cut-outs, skyline windows and the new hub icon (a lamp throwing a tent's shadow on a screen) with palette colours in Pixi `Graphics`. Use existing confirmation sounds or pentatonic notes.

**Voice.** Keep the voice lines in `voice.ts`, and use the shell's Kokoro title and clip workflow. The spoken lines are a finite list, because the cut-outs, marks and grid sizes are closed:

- **Sizes.** One per cut-out: 12 ("A tent, 2 wide and 2 tall").
- **Miss explanations.** One per rail and fault (too tall, too short, too wide, too narrow, the wrong shape), followed by the working for that cut-out, mark and outline size. Generate only the combinations the pools can produce, and list them in `voice.ts` from the logic module at build time.
- **Hint lines.** One per rail and step, with the working as above, generated the same way.

A unit test checks that every size, miss and hint the pools can produce has a voice line. If the generated list passes 600 lines, speak the rail and the fault and leave the numbers to the caption, and say so on the game's page. The instruction is `ctx.instruct`: at level 1, "Slide the cut-outs until the shadow fills the outline"; at levels 2–4, "Set the cut-outs, then light the lamp."

**How-to cards.**
- Level 1 shows sliding a tent from mark 6 to mark 3 while its shadow doubles.
- Level 2 shows the board with a dome 2 wide and 1 tall, a tent 2 by 2 and a block 2 by 2, whose outline parts are 4, 6 and 6 squares tall: the dome goes to mark 3 and the tent and block to mark 4, then Light.
- Level 3 shows a tap turning a block so its shadow halves in width.
- Level 4 shows a swap of two chips.

The ghost finger follows the hint order on the seeded board and, at levels 2–4, taps Light.

**Co-play and off-screen.** In co-play, one person reads the outline's sizes aloud from the grid and the other sets the rails; they swap after a round. Off-screen, hold a paper shape between a torch and a wall, find where its shadow is twice as tall, and measure how far the shape is from the torch and from the wall.

## Build batches

1. **`shadow-play 1`, levels 1–2** (**built 2026-11-23**, PR #2035)**.** This is the new game, the light model, the rails and the Light check.

   **Checks:** typecheck and unit tests, which cover:
   - the scale at each mark and each shape's part;
   - the pool counts above (44,496 and 30,516) and that every pooled board passes both filters;
   - that the solution is the only accepted arrangement of a sampled board, and that a wrong arrangement always names a rail;
   - the hint walk;
   - miss counting per distinct arrangement, and none at level 1;
   - the rail layout test;
   - voice coverage;
   - registry, lands and paging.

   **Browser and build:** one filtered `shadowplay` play at 390 × 625 with captions, reaching Lantern Lake through the normal grown-up route and its page. Finish level 1, then at level 2 light a wrong arrangement, light it again (no new miss), follow Help, rotate and finish with one sticker. Take one upright screenshot, run `fingerdemo` at level 2, and build with the generated voice assets.
2. **`shadow-play 2`, levels 3–4.** Claimed on `codex/neo-ready-shadow-play-3-4`. This adds the turn, the swap and their hints after batch 1. Expected changes are the Shadow Play rules, scene, layout, voice and how-to card, focused tests and scripted play, generated voice and game metadata, and the corresponding study, READY and verification records.

   **Checks:** typecheck and unit tests (pool counts 51,627 and 38,050, the turn in the light model, the swap, the hint walk over cut-out, mark and turn, voice coverage), one filtered play at level 4 with one swap, one wrong lighting and one hint, one upright screenshot with a turned cut-out, `fingerdemo` at level 4, and a build. The batch runs after batch 1.

Later proposals, not in these batches:
- picture silhouettes (an animal or a boat that comes alive), which need authored cut-out sets and their own one-answer check;
- a second lamp, or a lamp that slides, from the review's later rungs;
- a school opening at the top of `school`, with whole-number scales only and the lamp lit;
- a younger form of the notebook's Shadow Stage ("turn it until you see the bunny"), which the review places beside Peekaround Island.

## Source check

Nothing new was opened for this packet. The study's own sources stand as it recorded them: the shadow-theatre family activity and the grade-1 unit were read through search summaries, and the Spark AI Games shadow game was reviewed from its page.

The model rests on similar triangles: light from a point travels in straight lines, so a flat shape parallel to the screen casts a shadow enlarged by the screen's distance over the shape's distance, and a flat shape turned by an angle is foreshortened by that angle's cosine (one half at 60°) along the turning direction. A real turned cut-out's near edge throws a slightly larger shadow than its far edge; the model leaves that out, and the grown-ups' wording must not call the game a physics simulation.

The marks, the grid, the twelve cut-outs, the filters and the accounting are game rules. The pool counts come from a brute-force enumeration made while writing this packet. The building session's rule tests re-derive them. They are not taken on trust.
