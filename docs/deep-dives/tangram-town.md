# Tangram Town deep dive

*ID `tangram-town` · bands toddler, preschool, pre-K, school · levels 1–6 on 2026-10-10 · session `claude/eager-babbage-wexkzg` ([PR 79](https://github.com/rjdunlap/neo/pull/79))*

## The game today

She drags large flat shapes onto their shadows to build a picture. Rotation arrives at level 3 (a round arrow turns the chosen piece a quarter turn), two triangles fill a square at level 4, four pieces at level 5, and level 6 shows a silhouette with no outlines until the yellow help button reveals them. Off-board drops and turning are exploration; a drop on the picture that fits nothing is a miss with a spoken hint, and two misses make the right place glow (the help button counts as a hint).

The pieces are five shapes: square (140), roof (a 180-wide isosceles triangle), right triangle (140-unit legs), rectangle (200×100) and hull (a trapezoid, 200 wide on top, 120 below). `targetFor` accepts any piece of the same shape and turn on a free slot within 76 units, so the two triangles of a cottage wall and symmetric turns of a square or rectangle are interchangeable.

| Level | What it asks | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Two big shapes, already the right way up | toddler (1–2) | which shadow takes which shape |
| 2 | Hull and sail | toddler, preschool (2–4) | the same, with a shape that has a top and a bottom |
| 3 | The same, but pieces arrive turned | preschool, pre-K (3–6) | how many quarter turns fit |
| 4 | Three pieces; two triangles make a square | preschool, pre-K | that two triangles can be one square |
| 5 | Four pieces | pre-K, school (5–6) | order and fit across four shadows |
| 6 | Silhouette, outlines on request | pre-K, school | what the shadow is made of, unaided |

**What a round draws from.** Until this session every level drew one fixed picture (house, boat, house, cottage, rocket, cottage), so six levels held five different pictures and a replayed level was identical. Since slice 1 (below) each level draws from a pool of 2–5 pictures through the seeded round generator: 11 pictures in all.

**Couplings.** A how-to card (steps scoped from level 3 and 6) and a ghost-finger bot (`autotouch`, which turns each piece with the real button, then carries it). No couch entry, journal entry or picnic step. The how-to steps and `describeLevel` read at the level, not the picture, so they were safe to extend. Voice: "Build a {picture}!" is spoken at the start, so a picture name must begin with a consonant ("a owl" would be wrong); a test now asserts it.

**Known gaps.** The tray holds the pieces in one row spread across `v.w - 65`, so portrait with four pieces already puts a 200-wide rectangle and an 180-wide roof closer than their widths. Four is the ceiling. No spoken shape names. The levels end at a flat silhouette; nothing asks her to change what she built. A one-year-old at level 1 is untried (a person check).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Osmo Tangram](https://www.commonsense.org/education/app/osmo-tangram) ([review](https://www.schoollibraryjournal.com/story/ipad-games-blend-with-the-physical-world-slj-reviews-osmo)) | physical pieces and a camera | Each design has several tries: pieces shown in colour, then grey, then a plain black silhouette; Easy, Medium and Hard tiers | colour then silhouette per picture is already level 6's idea; a *same picture, fewer clues* ladder | bought hints, achievements for puzzles in a row or with no hints, a locked harder tier |
| [Pattern Shapes](https://www.mathlearningcenter.org/apps/pattern-shapes) (Math Learning Center, pre-K to grade 4) | free pattern-block tool | Seven shapes dragged and rotated onto built-in outlines, or any design she makes; blank, triangle-grid or square-grid backgrounds | the **free build** mode (a plain board and a grid), and the same app serving a wide age range through the *outline* choice | 15-degree rotation (a [review](https://techlearning.com/resources/pattern-shapes) calls it picky to snap); fine rotation is wrong for her hands |
| [TanGROW](https://apps.apple.com/hn/app/tangrow-tangram/id6738077712) | tangram app | Hundreds of puzzles, ranks (Iron, Bronze, Gold), optional shadow reveals | many silhouettes per difficulty; hints that reveal the shadow (as the yellow button does) | ranks, volume as the aim |
| [Tangram Mania](https://apps.apple.com/us/app/-/id6499522005) | tangram app | Stars for accuracy and speed unlock levels | a stated finish: all pieces fill the picture | star scoring by speed and accuracy, unlock gating, which break the no-timer, no-gate rules |
| [Puzzle Shapes: Toddlers & Kids](https://www.commonsensemedia.org/app-reviews/puzzle-shapes-toddlers-app) | toddler shape puzzles | 2D and 3D shapes, colours, dot counts; the review warns the youngest may struggle at higher levels | one piece, one shadow as the first thing for a very young child; a quiet ceiling for younger bands | in-app purchases |
| [Montessori constructive triangles](https://montessorimom.com/lesson-day-58-constructive-triangles/) ([Guidepost](https://www.guidepostmontessori.com/constructive-triangles-2)) | physical material, ages about 4–5 | First box: right triangles with guide lines on the edges that should meet (two make a square, rectangle or parallelogram); next box: equilateral triangles with no guide lines | the **guide line → no guide line** step at level 4 and 6; making a square from two triangles is already level 4; a parallelogram from two triangles | none; it is unpressured |
| [Katamino](https://www.hachetteboardgames.com/products/katamino) | board game | A slider sets the board size, adding one piece per step, from a 4×5 rectangle to 12×5 with all twelve | *add one piece at a time* is a clean ladder; the same board with a different set of pieces | 500 challenge cards of near-identical pentomino fits; those belong to a separate game |
| Pattern blocks and wooden shape puzzles (physical) | classroom manipulatives | Cover an outline; then cover it a second, different way | *same shape, fewer pieces* (level 7 below) | none |

**Developmental sources.** Levine, Ratliff, Huttenlocher and Cannon followed 53 children from 26 to 46 months and found that early puzzle play predicted later spatial transformation skill (rotating and translating shapes), after accounting for income, parental education and language input; causation is not established ([study summary](https://www.sciencedaily.com/releases/2012/02/120217101906.htm), [journal entry](https://journals.sagepub.com/doi/10.1177/0956797614563338)). The evidence therefore sits with children from about two years, so a first opening for a one-year-old is a judgment, not research-backed. Clements and Sarama's trajectory for composing shapes names levels such as "Picture Maker" and "Shape Composer" ([ERIC full text, not reachable from this session](https://files.eric.ed.gov/fulltext/ED594902.pdf); a [slide listing](https://stemie.fpg.unc.edu/wp-content/uploads/7-Learning-Trajectories-Shape-Composition-2D-and-3D-STEMIEFest-compressed.pdf) confirms those two names only; this write-up does not cite finer levels). The Common Core standard K.G.6, "compose simple shapes to form larger shapes", has the example "Can you join these two triangles with full sides touching to make a rectangle?", which is level 4's idea ([K.G.6](https://www2.cde.ca.gov/cacs/id/web/279), [Illustrative Mathematics](https://tasks.illustrativemathematics.org/content-standards/K/G/B/6.html)).

## What makes sense here

- **Quantity first.** The developer's direction of 2026-10-10 is more quantity. The cheapest quantity in this game is the picture pool: each level's decision stays the same (see the rule tests below) and a replay is a new picture.
- **A new decision, not a bigger board.** Pieces stop at four because the tray stops at four. What she can decide next is *which way* (done), *with fewer pieces*, *which direction after a flip*, and *what is wrong*. Each is a rule with a test, not a harder tray.
- **Montessori and Osmo agree on one step:** the guide that lets a child succeed fades (colour → grey → silhouette; guide line → none). Puddle Island's version is already optional: the yellow button brings the outline back, and it costs no sticker.
- **Free build** (Pattern Shapes) suits her best as a creative mode with a gentle ending, and it needs the treehouse's picture slot (a decision below). Edge snapping between pieces is a new model, not an extension.
- **Left out of a toddler's first level:** more pieces, rotation, any reading.
- **Long-term arc:** toddler places a piece, preschool turns it, pre-K builds a picture from several pieces and sees that two triangles can be a square, school finds more than one way and notices a flip.

## Proposed ladder

### Fresh content inside existing levels

**Built in slice 1 (this session).** Eleven pictures drawn per level with the round's seeded RNG: house, tree, boat, sailboat, flag, cottage, truck, tower, ferry, rocket, houseboat.

| Level | Pool |
| --- | --- |
| 1 | house, tree |
| 2 | boat, sailboat, flag |
| 3 | house, tree, flag, sailboat |
| 4 | cottage, truck, tower, ferry |
| 5 | rocket, houseboat |
| 6 | cottage, truck, tower, ferry, houseboat |

Each pool keeps its level's decision: levels 1–3 are two pieces, level 4 is three pieces and always holds a pair of triangles that can only make a square, level 5 is four pieces, level 6 hides the outlines. Tests assert that no picture overlaps itself (a separating-axis check), that it stays within ±210 horizontally and −220…200 vertically (clear of the turn and help buttons at the narrowest portrait width and above the tray), that every slot is reachable in any order, and that every picture starts with a consonant.

**Next content slices** (ready, small):

- **More pictures.** Aim for six to eight per level. A new picture is a few lines of slots in `PICTURES` and one line in a pool, and the tests above cover it. Candidates built from the same five shapes: a tent and a flag (roof and triangle), a fish (roof body with a triangle tail), a lamp post, a barn (a pair of triangles and a roof), a bridge (rectangle and two hulls), a pine tree of two roofs. Check the new picture reads as itself at 0.4 viewing distance.
- **Spoken shape names.** On picking a piece up, say "a triangle" once per piece, per round, at toddler, preschool and pre-K bands (the how-to and the `tangram.try` line already name no shape). Voice lines only; check on a device.
- **Avoid the same picture twice in a row.** A pool of two repeats half the time. The shell does not keep round history for a game; leave it, or pass the previous picture through the stored `stats` in a later slice.
- **Colour per picture.** Colours are by tray slot today, not by role; a roof that is always a roof colour would make the picture readable as a picture.

### New levels on top

None of these renumber saved levels. The school band's window is `{ min: 5, max: 6 }` today; extending it is part of each slice. These are proposals, not built.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Fewer pieces** | school (pre-K top, if wanted) | The tray holds a square, two triangles and a roof; the silhouette is a house. The wall can be one square or two triangles | the same picture two ways; the round ends when any valid cover fills it, with a spoken "you used two pieces; is there a way with fewer?" | A drop that covers no part is a miss; either cover finishes, neither is wrong; the hint points at the larger piece first | every picture has authored cover sets, each of which exactly covers the silhouette with no overlap; the tray of four holds every piece of every cover; the hint never picks a cover that blocks the other | A **stated model is needed first**: slot sets, not fixed slots. `targetFor`, `hintFor`, `bestTarget`, the autotouch bot and the browser case all work on fixed slots. One slice to write the cover-set type and its tests, one to build |
| 8 | **Fix the picture** | school | A built picture has one piece the wrong way or wrong shape. She taps it, turns it or swaps it | revision: notice what does not match, with a spoken "what changed?" | An older puzzle may require revision with an explanation; no miss counts for taking a piece back; the glow points at the odd piece after two attempts | in every picture exactly one placed piece differs from its slot; the fix is reachable by turns or one swap | Placed pieces are locked (`drag.enabled=false`) today, so they need to be re-pickable; the bot learns a repair step |
| 9 | **Flip it** | school | A parallelogram in the tray whose slot is the mirror of the way it comes | the choice between *turn* and *flip* | The flip button is a second control; a wrong side is a miss with the hint "try flipping"; two misses glow | the parallelogram's mirror is a different orientation from every turn; `sameOrientation` accepts it only after a flip; the bot flips at most once | Needs a **chiral piece** (the five shapes are all mirror-symmetric, so a flip with them is a no-op) and a flip button. This is a decision for the developer below |
| 10 | **Build and keep** | school (and any band that wants a creative finish) | A plain board and the tray; she builds any picture and taps the green arrow | what to make; nothing is wrong | Nothing is wrong; a gentle ending rule is needed | a built picture saves bounded and repaired; pieces snap along edges with exactly stated tolerances | **Sketch only.** New edge-snap model, a creation slot for a picture (`src/content/creations.ts`), a how-to. Costly; see the decisions below |

The "fewer pieces" level and the "fix the picture" level can both stay at the school band because each needs a rule she has not met (alternatives, revision). Neither raises the number of pieces or adds a clock.

### Younger-band openings

- **Toddler** already holds levels 1–2. With the new pools, a toddler's two levels now offer five pictures. No further opening.
- **Lap.** The game does not serve the lap band. A one-year-old is below the age range of the supporting research (26 to 46 months). If the developer wants the opening, it is **level 0 below** (next section) and its first fit is a person check, not an automatic claim. It overlaps Shape Sorter and Puzzle Pals, so check whether Tangram Town is the right home.

### Levels below level 1 (waiting on the level-order decisions)

These wait on [how levels are ordered for a new band](../ROADMAP.md#waiting-on-the-developer): appended easier levels would make "step up" run backwards.

- **One piece home.** The house's roof is already placed; the square waits. One shadow, one piece, a snap radius of about 110, no wrong place to drop it. Rule test: with one slot, any drop within 110 of it places the piece; there is no miss. For a child under about two. A tap-to-place variant (tap the piece and it flies home) needs no drag at all and is the lap candidate.
- **Pick the missing piece.** The picture is built but one slot is empty; the tray has the right piece and one wrong one. Rule test: the wrong piece never fits that slot.

### Left out on purpose

- Timers, par times and star ratings (Tangram Mania), bought hints and run-based achievements (Osmo), ranks (TanGROW), locked packs: none fits the rules.
- The classic seven-piece tangram: the tray stops at four pieces at 100-unit targets; seven would need a scrolling tray or smaller pieces.
- Memory silhouettes (show the picture, then hide it): adds memory load.
- Fine, free rotation (Pattern Shapes' 15-degree steps): quarter turns are what her hands can do reliably.
- Katamino-style board fills: a separate game, not a mode.

## Decisions for the developer

1. **Add a chiral piece (a parallelogram) for a flip level?** Without one a flip level cannot exist. It needs new art, a flip button and a mirror-aware orientation rule. Lean: yes, but after "fewer pieces" and "fix the picture".
2. **Does a built picture belong in the treehouse?** "Build and keep" needs a picture slot in `creations.ts`. A decision on whether Tangram Town gets one or only the Stamp Studio does.
3. **Lap.** Does Tangram Town open to lap with a one-piece level 0, or does lap keep to Shape Sorter and Puzzle Pals? Waits on the level-order decisions in any case.
4. **How many pictures per level is enough?** Six to eight is proposed; more is a few lines each, with no change to the tests.

## Build slices, in order

1. **Picture pool for levels 1–6** — **built this session.** Rule tests and typecheck, and one scripted play (`BROWSER_SUITE=creative CREATIVE_ONLY=tangram`).
2. **More pictures** (ready): six to eight per level, `logic.ts` data only. Rule tests, one screenshot per new picture.
3. **Spoken shape names** (ready): voice lines and a pickup call. Typecheck and the registry/voice tests; the speech itself is a device check.
4. **Level 7, fewer pieces** (needs a stated model): first a cover-set type with tests, then the level. New-level tier: `fingerdemo` at the new top level and a play.
5. **Level 8, fix the picture** (ready after 4's re-pickable placed pieces).
6. **Level 9, flip it** (waits on decision 1).
7. **Level 10, build and keep** (waits on decision 2).
8. **One piece home / pick the missing piece** (waits on the level-order decisions).

## What was built in this session

Slice 1: `logic.ts` now holds `PICTURES` (11), `PLANS` as level rules with a picture `pool`, and `buildFor(level, rng)`; `index.ts` draws the round's picture from the pool and builds the tray from it, so every other piece of the game (hints, the ghost finger, voice, saved round) is unchanged. `describeLevel` names no single picture. Checks: `npm run typecheck`, `npx vitest run` on the game, content and registry tests (8 and 80 tests, including a separating-axis overlap check proved to fail when a slot is moved), and one pass of `BROWSER_SUITE=creative CREATIVE_ONLY=tangram` over levels 1 to 6 with a portrait view at level 5. Not run: a screenshot review of every picture, `fingerdemo`, a device, a child.
