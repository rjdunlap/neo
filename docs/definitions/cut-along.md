# Cut Along, levels 1–8 (definition)

**Built 2026-10-21 (levels 1–8, [PR #702](https://github.com/rjdunlap/neo/pull/702)) on every default below (no Fold & Snip, collage not saved, no lap level, the land's `STYLES.paint` music).** The home land is the craft land, now named **Painted Canyon** (land id `treehouse`, 5 games with this one); this definition calls it Paint Pier. Differences in the build: a closed shape's way round is chosen only once the cut has left the joint by more than 1.5 corridor half-widths (a pixel of wobble on the lead-in once picked a way early); the ghost-finger route is thinned to corners plus a point about every 0.15 paper units. Bands: toddler 1–2, preschool 2–5, pre-K 4–7, school 6–8.

Defined 2026-10-17 for [chunk 25](../ROADMAP.md#chunks) (dexterity: slice, cut and draw), from the [IDEAS candidate](../IDEAS.md#candidates). This is a docs-only definition: no game, ID registration, voice line or save field exists yet. **Ready to build:** each open call below has a default the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md). The IDEAS row's school **Fold & Snip** is **not** in this ladder. It reopens an approved lean, that folding and predicting the unfolded result belong to Bug Builder ([Later slice](#later-slice-fold--snip-not-in-this-build)).

**Fun action and purpose:** a sheet of bright paper shows a dashed line that starts at its edge. She puts big, round-tipped scissors on the green start ring and moves them along the line. The scissors chomp open and shut with a crisp snip, and the note climbs as she goes. When the cut reaches its end, the piece drops free and floats into the land host's paper picture: fringe becomes grass, a wave becomes the sea, a circle the sun, a triangle a sail. Three or four pieces make one collage, and the round ends with it.

The learning goal is **visual-motor path following in the order occupational therapists teach cutting**: snips, then a forward line, then curves, a circle, then corners and finally picture outlines. At level 8 she also has to **choose which outline makes the piece that fits** a gap in the picture. Levels get harder through path shape and choice. Speed never matters: nothing moves on its own and nothing is timed.

**What it does not claim:** a finger on glass does not build scissor grasp or two-handed coordination. Reviewers of fine-motor apps question whether screen practice transfers to paper ([Common Sense Media on Dexteria Jr.](https://www.commonsensemedia.org/app-reviews/dexteria-jr)). For that reason the off-screen suggestion is real child-safe scissors with a grown-up, and the grown-up's text says "following a line", not "scissor skills".

## References

| Reference | What it shows | What Cut Along takes or rejects |
| --- | --- | --- |
| Scissor-skill progressions from paediatric occupational therapy: [Growing Hands-On Kids' checklist for ages 2–6](https://www.growinghandsonkids.com/scissor-skill-development-checklist-for-ages-2-6.html); [Swansea Bay NHS scissor skills](https://sbuhb.nhs.wales/files/paediatric-occupational-therapy/scissor-skills-dcd-2020-doc/); [Oxfordshire SEN toolkit](https://m.oxfordshire.gov.uk/sites/default/files/file/information-childcare-providers-sentoolkit/scissorskills.pdf). The pages were read only through a search summary | Single snips at about 2–2½; forward cutting along a thick line at about 3; a 6-inch line, within ½ inch at about 3–3½ and within ¼ inch by 4; curves and a rough circle at about 4; a square and triangle at about 5; picture outlines at 5–6. Straight lines come before curves. Ages vary by source | The level order follows it directly. The corridor narrows with the level, as the ½-inch to ¼-inch accuracy steps do, but never below a finger-width floor. Ages set the bands loosely and are not a test |
| BinaryLabs' *Dexteria Jr.* ([App Store](https://apps.apple.com/app/id624918435), ages 2–7; [Common Sense Media review](https://www.commonsensemedia.org/app-reviews/dexteria-jr)) | Fine-motor exercises built from tap, tap-and-drag and pinch (read through a search summary of the review). Tracing is called "the most promising, if perhaps the least engaging" part, and transfer to the physical world is questioned | Takes the warning that plain tracing is dull. Every cut here produces a piece that does something. Takes the transfer caveat too. Rejects its progress tracking and reports for therapists |
| Sago Mini *Toolbox* ([Toy Insider review](https://thetoyinsider.com/sago-mini-toolbox-review/), ages 2–4; not checked in the app) | Cutting wood is a back-and-forth "sawing motion"; the cut ends with sound, music and a burst of sparkles | Takes the payoff: the cut makes something you can see and hear. Rejects the free sawing gesture. Cutting here follows a line forward |
| Toca Boca's *Toca Hair Salon* (see [Fluffy Salon](../GAMES.md#fluffy-salon), which is modeled on it; not opened for this definition) | Free snipping with virtual scissors, no instructions needed | Takes the satisfying snip sound and the scissors that go where the finger goes. The difference here is that the cut follows a printed line |
| Paper snowflakes and Barkley's 2008 online *Make-A-Flake* ([Wikipedia](https://en.wikipedia.org/wiki/Paper_snowflake); the tool itself was not opened) | The fold, cut and unfold craft, also played online | Evidence for the later Fold & Snip slice only. Nothing in levels 1–8 folds |

## Overlap

- **Letter Trails and Number Trails** own tracing a symbol that has to be formed a certain way, with a firefly to follow. Cut Along shares their tracer (below), but its path is not a symbol. It starts at the paper's edge, may be cut in either direction around a closed shape, and the result is a piece that separates. Its toddler levels sit below Letter Trails' preschool start.
- **Fruit Slice** (defined, in this chunk) owns the crossing stroke through a moving target. Here she *follows* a still line. **Dot Link** joins numbered dots, and **Lasso Loops** draws free loops around groups.
- **Fluffy Salon** owns free snipping (hair). Cut Along's scissors only cut along the dashed line.
- **Tangram Town and Shape Sorter** own naming and fitting shapes. Level 8's choice is about which outline will fit, judged by its outline. Shapes are never named as a quiz: the pet says the name as the piece lands.
- **Mirror Brush's fold** (decision) and **Bug Builder's level 10, *Fold a friend***, own folding and predicting what unfolds. Fold & Snip stays out of this ladder (decision 1).
- **Draw the Pattern** (next in this chunk) owns continuing a stroke pattern from memory. In Cut Along the line is always printed.

## The model

- **A cut** is `{ kind, path, closed, lead, piece }`. `path` is a list of points in paper units, normalized by the paper's **shorter side** (x runs 0–4/3, y 0–1, so a circle stays round and the corridor is the same width both ways), built from straight segments and sampled arcs. `lead` is the number of lead-in points from the paper's edge to a closed shape. `piece` is what the cut-out becomes in the collage. Paths are built in `logic.ts` (`cutsFor(plan, rng)`) and sampled with **Letter Trails' `sampleStroke`**. They are followed with **`advanceTrace`**, and the bot's corners come from **`traceWaypoints`**, all imported from `src/games/letter-trails/strokes.ts` exactly as Number Trails does. **The stray test is Letter Trails' `offTrail`** (`logic.ts`). No new tracer is written.
- **Every cut starts at the paper's edge**, as on a real worksheet, with a green start ring at least 110 units across. A closed shape (circle, square, triangle, picture outlines) has a short lead-in from the edge to the outline, so every cut is an open path that `advanceTrace` can follow without skipping.
- **Either direction around a closed shape.** After the lead-in there are two candidate orders, `cw` and `ccw`, as two sampled point lists that share the lead-in. The first advance past the joint chooses one, and the other is dropped for that cut. Left- and right-handed cutters go around in opposite directions, so neither direction is wrong.
- **The corridor** is `tolerance(level)` in paper units. The paper is drawn at least 560 × 420 logical units in every standard view (portrait included), so the corridor in logical units is `tolerance × shortSide`. It narrows by level: 0.11 (2), 0.09 (3–4), 0.08 (5–6), 0.075 (7), 0.072 (8). **A floor:** at the smallest paper (short side 420) that is at least 30.2 logical units, never under 30 in any standard view (a rule test). Corners keep `advanceTrace`'s rule: a checkpoint on the way back waits until the finger turns.
- **The scissors** are a code-drawn pair with rounded tips, about 120 units, parked at the current checkpoint. Between drags they are the resume target, with a hit area of at least 110 units. Lifting keeps all progress. A new touch near the scissors carries on, and a touch anywhere else does nothing.
- **Snips:** the blades open and close every 24 units of progress, with a short synthesized snip (filtered noise). Every fifth of the path plays the next pentatonic step from `src/audio/notes.ts`, which is Letter Trails' `tuneStep`.

`logic.ts` holds plain functions: `planFor(level)`, `cutsFor(plan, rng)`, `tolerance(level)`, `chooseOrder(cut, progressPoint)`, `fringeMarks(plan, rng)` (level 1), `boardFor(plan, rng)` (level 8: the gap and its two or three outlines), `judgeOutline(board, outlineIndex)` and `hintStretch(points, progress)` (which reuses `showTheWay`).

## Screen and controls

- **The paper** fills the middle of `view`, clear of the home button (top-left), the picture (top-right), and the pet corner (bottom-left). In portrait the paper sits lower and the picture shrinks above it. One cut is shown at a time, and the next sheet slides in when a piece drops out.
- **The cut layer** uses custom pointer handling on the paper only, with a `hitArea`, added last. It ignores input while `palmOnGlass()`. A drag ends on `pointerup`, `pointercancel`, `pointerupoutside`, or a lost release (no events for 0.5 s after the finger leaves the canvas). It is cleared in `destroy()`.
- **Touch-down feedback:** the scissors open at once under the finger, before any movement. A touch that misses both the ring and the scissors makes them wiggle to show where they are.
- **The cut line** turns from dashes into a clean slit behind the scissors, so finished progress is always visible.
- **The picture** (top-right, at least 200 units) is the host's paper collage, with soft outlines showing where the pieces go. Tapping it repeats the instruction.
- **Speech:** `ctx.instruct` gives each instruction, and the corner pet repeats it. Navigation never needs reading. When a piece lands, the pet says its name ("A circle, for the sun!").
- **Music:** the land's calm style keeps playing quietly under the snips (decision 5), not `silenced`, since she is not composing.

## Levels

| ID | Name (`describeLevel`) | Path | Corridor | Round |
| --- | --- | --- | --- | --- |
| 1 | Snip, snip | 5 thick marks along a strip's edge, each ~70 long; a tap or short drag on a mark snips it | n/a (mark hit area ≥ 110 × 140) | 3 strips (fringe) |
| 2 | Cut the ribbon | One thick straight line, ~300 units, edge to edge | 0.11 | 3 ribbons |
| 3 | Straight across | Longer lines, ~500 units, level and slanted | 0.09 | 4 strips |
| 4 | Zigzag and waves | Zigzags (3–4 corners), then gentle waves | 0.09 | 4 strips |
| 5 | Curves and a circle | A hill arc, an S-curve, then a circle ≥ 300 across | 0.08 | 3 pieces |
| 6 | Corners | A square and a triangle, each ≥ 260 across, each with a lead-in | 0.08 | 3 pieces |
| 7 | Picture shapes | Heart, house, leaf, fish or cloud outline, chosen by seed | 0.075 | 3 shapes |
| 8 | The piece that fits | Two or three outlines on one sheet; cut the one that fits the gap | 0.072 | 3 boards |

**Bands (`BandLevels`):** `toddler: { min: 1, max: 2 }`, `preschool: { min: 2, max: 5 }`, `prek: { min: 4, max: 7 }`, `school: { min: 6, max: 8 }`. No `order`, and no lap or grown-up levels (decision 4).

### First rounds

- **Level 1:** a yellow strip with five thick dashes coming in from its bottom edge. "Snip, snip! Snip each line." A tap on a mark, or a short drag across it, snips it with a chomp, and that fringe curls. When all five are snipped, the strip flies up to become grass in the picture. Three strips. Taps between marks make the scissors wiggle toward the nearest mark. There is no wrong touch.
- **Level 2:** a ribbon-colored sheet with one fat dashed line across it, from a green ring on the left edge to the right edge. "Put the scissors on the green ring and cut along the line." The finished ribbon becomes a kite's tail. Three ribbons.
- **Level 3:** a longer level line, then a slanted one, starting from either side by seed. Four strips become a fence.
- **Level 4:** a zigzag with three corners (the scissors pause at each corner until the finger turns), then a wave. The pieces make mountains and the sea.
- **Level 5:** a hill, an S-curve, then a big circle reached by a short lead-in from the bottom edge. The circle can be cut either way around and becomes the sun.
- **Level 6:** a square (a window) and a triangle (a sail), each with a lead-in, then one more of either.
- **Level 7:** three seeded picture outlines from heart, house, leaf, fish and cloud, each with a lead-in. They join a picture that matches them.
- **Level 8:** the picture has a gap, such as a house missing its roof. The sheet shows two outlines that differ in one feature, a triangle and a square ("pointy on top"), and later three. "Which piece fits the gap? Cut that one out." Cutting the outline that fits drops the piece into the gap.

## Accounting, help and finishing

- **Never a miss:** any touch at levels 1–2, including a stray; a touch away from the ring and scissors; lifting partway; tapping the picture; at level 8, starting the matching outline in either direction.
- **A miss (levels 3–8)** is a drag that wanders off the corridor: `offTrail` from the current checkpoint while the finger is down. This is the same rule Number Trails uses, with at most **one miss per drag**. The scissors stay at the last checkpoint and there is a gentle boing. The pet says "Come back to the scissors." Progress is never lost.
- **Level 8's choice:** cutting into an outline that does not fit is a miss once it reaches 20 % of that outline, with one miss per outline. The scissors stop, and the pet says what is different: "That one is flat on top. The gap is pointy." Its partial slit closes back up, and the right outline stays uncut, so she can choose again.
- **The two-miss glow:** at the second miss on one cut or board, and every second miss after, `hintStretch` lights the next 12 checkpoints with yellow dots. When she lifts, a small paper bee flies that stretch and back, a drawing and not the ghost finger. At level 8 the fitting outline glows. Each glow adds one to `hints`.
- **Finish:** when the round's pieces are all in place, the collage is complete. The host holds it up and the pet names what is in it. Then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. Nothing is saved or filed (decision 2).
- **Adaptation** follows the unchanged shell rule. Levels 1–2 can produce neither misses nor hints, so a toddler steps up by finishing.

## Rule tests (`logic.test.ts`)

- **Fit:** for every plan, every seed in a sample and the four standard views, every path, start ring and the paper itself lie inside `view`, clear of the home button, picture and pet corner. Each start ring is on the paper's edge and at least 110 units across.
- **Corridor floor:** `tolerance(level) × shortSide` is at least 30 logical units for every level and view, and `tolerance` never widens as the level rises.
- **No skipping:** `advanceTrace` already protects corners, so at every corner and cusp from `traceWaypoints` (zigzag points, triangle corners, the heart's cusp, the fish's tail) a straight chord from the checkpoint before the corner across to the far leg consumes no checkpoint past the corner. Away from those corners (the two sides of an S-curve, a narrow tail, a circle's far side), no two sample points more than 6 apart along the path come within `2 × tolerance` of each other. The closing joint of a closed shape, where the lead-in meets it, is exempt from both rules.
- **Completable both ways:** feeding `advanceTrace` the `traceWaypoints` route (densified to 10-unit steps) reaches the last checkpoint for every cut. For closed shapes this holds in both `cw` and `ccw`, and `chooseOrder` picks the order that the first move after the joint follows.
- **Stray rule:** a drag that leaves the corridor gives exactly one miss, levels 1–2 never give one, and progress after a stray equals progress before it.
- **Level 1 marks:** five marks, each hit area at least 110 × 140, with no overlaps.
- **Level 8 boards:** the outlines' corridors, lead-ins and start rings never overlap or cross, so one drag can only advance one outline, and the 20 % counts from that outline's own start ring. Exactly one outline fits the gap (`judgeOutline`), and every distractor differs from it in one named feature that has a voice line. Each outline is cuttable by the same tests as level 7.
- **Hint:** `hintStretch` starts at the current checkpoint and moves forward along the chosen order.
- **Seeds:** the same seed gives the same cuts and boards.
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` returns a `tap` intent on the next mark at level 1. Otherwise it returns a `trace` intent with `receiver` set to the cut layer, starting at the current checkpoint, with `via` set to the remaining `traceWaypoints` for the chosen order (the existing `trace` intent in `src/engine/ghost.ts`). It cuts circles counterclockwise (the scripted play cuts one clockwise itself), and at level 8 it cuts the fitting outline. It never demonstrates a stray or a wrong outline. The bot is the scripted play's solver.
- **How-to card** (`src/content/howto.ts`):
  - **Goal:** "Cut along the line to make pieces for the picture."
  - **Steps**, each with the levels it holds at:

    | Step | Levels |
    | --- | --- |
    | "Tap each thick line to snip it" | 1 |
    | "Start the scissors on the green ring and follow the dashes" | 2–8 |
    | "Lift any time; the scissors wait where you stopped" | 2–8 |
    | "Lines bend and turn corners" | 4–6 |
    | "Go around either way" | 5–7 |
    | "Choose the piece that fits the gap, then cut it out" | 8 |

  - **Finish:** "The picture is complete."
  - **Note:** "Nothing is timed." Plus a `LevelLine` for levels 3–8: "Wandering off the line is counted for her level."
- **Voice lines** under `cut.*`: `intro`, `instruct.snip`, `instruct.ring`, `instruct.fits`, `back-to-scissors`, `piece.<piece>` (one per piece, such as "A circle, for the sun!"), `differs.<feature>` (such as flat-top, round, no-tail), `done`.
- **Registration:**
  - ID `cut-along`, name "Cut Along", spoken title `game.cut-along`.
  - Region (subject) `treehouse`, home land **Paint Pier** (4 games today, 5 with this one; decision 3).
  - Skills `['fine-motor', 'shapes', 'spatial-reasoning']`.
  - Hub icon: round-tipped scissors on a dashed line. The sticker is a seeded paper cut-out.
- **Co-play:** a grown-up names the next piece's place in the picture, and she cuts it. **Off-screen:** with child-safe scissors and a grown-up beside her, snip a fringe along a paper strip, then cut a fat straight line. The sources above describe these first steps.
- **Couch:** none. The finger path is the point, and couch play takes no touches.
- **Rework couplings:** none required, and nothing is saved or unlocked. A cut-paper decoration fits the welcome adventure's "make a decoration" step ([rework brief](../rework/README.md#learning-belongs-in-the-story); [RW04](../rework/WORK-ITEMS.md#rw04-welcome-adventure-and-learning-packet), [RW07](../rework/WORK-ITEMS.md#rw07-welcome-adventure-and-visible-reward)). Keeping a cut-out as a creation (decision 2) is the rework's and the save layer's to define.

## Later slice: Fold & Snip, not in this build

The IDEAS row's school mode is to cut notches into folded paper, then unfold it to see a symmetric heart or snowflake, and later to predict the unfolded result first. On 2026-10-12 the developer approved leans saying the fold button and prediction belong to Bug Builder, whose level 10 is *Fold a friend*. The [Mirror Brush fold](mirror-brush-fold.md) is at `decision` for the same reason. If the developer decides that folding may appear in more than one game (decision 1), a later slice could add level 9, *Fold and snip*, at school. That level would have a half fold, a choice of printed notches cut with this tracer, then Unfold, and later a quarter fold. A level 10 would make a shown pattern, with Unfold as the check and a "tape it back" undo. None of this is in levels 1–8.

## Check tier

New-game tier, with a new interaction: a cut that separates a piece, and a closed path in either direction.

- **Unit tests:** typecheck, and the rule properties above plus the registry, lands and how-to tests.
- **Scripted play:** one through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8. It makes one stray at level 3 (counted miss) and a second stray on that cut (glow), has the bot cut one level 5 circle counterclockwise, and cuts another clockwise with a kit drag, so both directions run.
- **Screenshots and demos:** one portrait screenshot at level 6. Run `fingerdemo` at levels 1 and 7.
- **Build:** run `npm run build`, since the registry, lands, voice and how-to files change.

Device checks stay open:

- Whether the corridor floor suits a toddler's finger on an iPad.
- Whether the scissors under the finger hide the line ahead. The default is that the scissors ride just ahead of the finger, with the blades pointing along the path.
- Whether level 8's choice reads to a five-year-old.

## Open decisions

Each has a default that the build uses. None blocks it.

**Decided 2026-10-23 (on the developer's delegation):** the defaults the build used stand: no Fold & Snip here (folding and prediction stay with Bug Builder); the collage is not saved; home land Painted Canyon; no lap level; the land's calm music, not `silenced`.

1. **Fold & Snip.** Default: not in this game, which keeps the approved lean that folding and prediction stay with Bug Builder. The alternative is the later slice above, at school.
2. **Keeping the collage.** Default: nothing saved. The alternative is a `cutout` picture creation in `src/content/creations.ts`. That is a save-field change at the shell/save tier, and it is better folded into the rework's home customization ([RW06](../rework/WORK-ITEMS.md#rw06-playable-home-and-customization)).
3. **Home land.** Default: Paint Pier (the craft land, 5 games). The alternative is Story Grove beside Letter Trails, which would have 10 games.
4. **Lap entry.** Default: none; toddler level 1 is the first rung, since the sources place single snips at about 2. The alternative is a lap level 1 alone.
5. **Music.** Default: the land's calm style plays under the snips. The alternative is `silenced(STYLES.quiet)`, which would also add the game to the registry test's list.
