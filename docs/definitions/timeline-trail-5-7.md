# Timeline Trail, levels 5–7 (definition)

Defined 2026-11-16 as the T4–T5 definition of the [time-and-change study](../deep-dives/subjects/time-change.md#build-slices-in-order) (slices 4 and 5), on the built levels 1–4 of the [levels 1–4 definition](timeline-trail.md). Its rules, accounting and the "everything is the island's own made-up past" limit carry over unless a section here says otherwise. Three build slices follow ([below](#build-slices-and-check-tiers)); Island Archive (study level 8), the page cards and the real-object rung stay in the study and wait on its decisions.

**Fun action and purpose:** level 5 grows a village green and a bread-oven stall across their made-up past and pins what never changed to a "still here" ribbon; level 6 hangs a misty picture that honestly fits two places, and the pet says "we can't tell, both fit"; level 7 builds a line, then the picture grows big and she taps the part that proves where it goes. Learning goal: *some things stay the same while others change; newer is not always grander; a picture can leave its time undecided; a claim about when rests on a part of the picture you can point at.* Standards the study names: D2.His.2.6-8 (change and continuity), D2.His.10.6-8 (the limits of evidence), D2.His.16.3-5 (claim from evidence), and Barton's warning against "newer means fancier".

## Changes from the study's ladder

| Study | Here | Why |
| --- | --- | --- |
| Level 5: the ribbon takes "the big rock, the bread oven"; "one round's older merry-go-round is grander than the bench that replaced it" | Two **new places** used only from level 5 on, `green` (rock, merry-go-round, then a bench) and `oven` (stone oven, a fancy stall, then a plain table). **Every** level-5 round has a grander-then-plainer pair | The failing-heuristic test must fail in every round, not one; the three built places only ever add things |
| Level 6: "one card fits two gaps because nothing in it tells" | A **misty picture**: a stage drawn with the one element that would tell it from the stage before hidden by sea mist or leaves. It always fits exactly two gaps | Stripping level 4's insets cannot make a two-gap card: the hung cards' own insets still decide it (checked against `compareFaces`) |
| Level 7: "tap the part of the picture that proves the place" | One proof question a round, on the enlarged **flipbook frame**, about a card whose proof is something that **only grows** (a tree, a vine, the pet); never the shore | A 150 card cannot hold several 100-unit spots; the shore's proofs are all "something was added", which is the very heuristic level 5 teaches her to distrust |

## Overlap and reuse

- **Levels 1–4** supply everything except the new places, the ribbon, the mist and the proof spots: the clothesline, `lineLayout`, drag and pegging, `reasonFor`, `Tally`, the flipbook and the posts. Levels 5–7 are single-place lines (level 4's insets do not appear).
- **Story Steps** owns ordering one story's events; a level here that only ordered cards would belong there. Each new level adds a decision about **evidence** instead (what stays, what cannot be told, what proves it).
- **Attic Finds** taps glowing spots on an object to hear about it, all free. Level 7's spots are not glowing and one of them is the answer to a question; looking before the question stays free.
- **New, in the game's own files:** two places' code-drawn stages, a mist and leaves overlay, a ribbon, chip art, proof spot rectangles. No engine piece, render texture, save field or journal entry.

## The model (`logic.ts`)

**Stages gain `shows`.** Every stage of every place lists the named elements its picture draws, `shows: string[]` (the shore's 3: `['rock', 'dock', 'shed']`). A stage's **detail** is `shows.length`. An element in every stage of a place is **still here**. The built three places get their lists without any art change.

**Two new places**, kept out of `PLACE_IDS` so levels 1–3's three-place bag and its test do not change (`LATER_PLACES = ['green', 'oven']`, their own bag):

| Place | Stage 0 | 1 | 2 | 3 | Still here |
| --- | --- | --- | --- | --- | --- |
| `green` | grass, the big rock, a sapling | a **grand merry-go-round** with flags beside a young tree | the merry-go-round gone, a **plain bench** where it stood, the tree taller | the bench, a flower bed, a big tree | the big rock |
| `oven` | a stone bread oven, a vine shoot at its foot | a **fancy stall** round the oven (striped awning, painted sign, bunting); the vine at its knee | the stall gone, a **plain table** beside the oven; the vine halfway up | the vine over the oven's top, a cat asleep on it | the stone oven |

Details: green 2, 4, 3, 4; oven 2, 5, 3, 4. In both, stage 1 is more detailed than stages 2 and 3, and the `changes` element of stage 2 is the growing thing (`taller tree`, `longer vine`), never the bench or table. Captions avoid every number, date and unit of time, as before.

**Plans.** `PLANS` gains `{ level: 5, name: 'Still here', cards: 4, hungAtStart: 1 }`, `{ level: 6, name: 'We can’t tell', cards: 4, hungAtStart: 2 }` and `{ level: 7, name: 'Show me why', cards: 4, hungAtStart: 1 }`. `LEVELS.school` becomes `{ min: 2, max: 7 }`; preschool and pre-K are unchanged, no level is renumbered and no `order` is needed.

### Level 5, Still here

A round takes the next of `green` and `oven` from their bag, all four stages, the first hung and three loose (level 3's shape). When the line is full, the tray shows **three chips**, each a small drawing of one element: the still-here element and two that are in some pictures but not all (one of them always the grand thing: the merry-go-round or the awning). The pet: "What is still here in every picture?" She **taps a chip or drags it to the ribbon** under the line (two ways, as at level 1). The right one pins on the ribbon, then the flipbook plays with that element given a soft sparkle in every stage.

### Level 6, We can't tell

A round takes the shore or the tree (`MIST_PLACES`) and a misty stage `k`:

- the **shore**, `k` ∈ {0, 1, 2}: stage `k + 1` drawn with sea mist over the end of the dock where its new element would be (the dock, the shed, the boat and lantern);
- the **tree**, `k` = 2 only: stage 3 with leaves hiding the branch where the swing would hang.

The misty card's face can be stage `k` or `k + 1`: `could: [k, k + 1]`. The line uses the other three stages (all but `k`): the pet hangs two, one waits loose, and **the misty card comes last** (it waits in the pet's paws, not the tray, until the other is hung). `fittingGaps` gains could-sets: a card fits a gap when **some** stage in `could` is no older than every card before the gap and no newer than every card after it. A misty card hung last therefore fits **exactly two** gaps (for `k = 1`: either side of the shed card), every ordinary card still exactly one.

**The line keeps her order.** `place()` today sorts the line by stage and takes only the first valid gap. From level 6, the line is the cards **in the order she hung them**, `place()` accepts **any** gap in the fitting set, a wrong gap's reason is measured from the nearest fitting gap, and the flipbook plays her order. For levels 1–5 and 7 that order equals stage order, so nothing visible changes there; `validGaps`'s "exactly one at every level" comment changes to say so.

### Level 7, Show me why

A round takes the next of `tree`, `nest`, `green` and `oven` (its own bag; never the shore) and builds a line of four as at level 3. Then one hung card at index 1–3, seeded among the cards whose proof **only grows**, flies up into the flipbook frame, the card before it beside it small, and the pet asks "What in this picture shows it comes after the {caption}?"

- Each `(place, stage)` that can be asked has **two or three spots**, rectangles in card units over named elements in `shows`, with `proves` naming the accepted ones (more than one where honest). Proofs: tree 1–2 the tree, nest 1–3 the pet, green 1–3 the tree, oven 1–3 the vine; green 3 also accepts the flower bed, because it grows from nothing. Oven 3's cat does not prove anything: a cat could nap there on any day. Tree 3 (the swing) is never asked.
- The other spots are honest distractors: the still-here element ("the rock is in every picture, so it can't tell us when") and, on green and oven, the built thing ("a bench can be built any time; the tree shows when").
- `proofSpots(place, stage, frame)` returns screen rectangles at the frame's scale; at the frame's smallest size (360 in landscape) every spot is at least 100 units and spots do not overlap. The line under the frame dims and takes no input during the question.

## Screen and controls

- **Level 5's ribbon** is a strip drawn along the bottom edge of the line's last row, inside the line's own area, so it adds no row: in portrait the four-card line already wraps into two rows, and the ribbon sits under the second one, above the tray. The chips use the tray's rectangles (the tray is empty once the line is full) and are at least `CARD` size; the drop target is the whole ribbon. `lineLayout` gains `ribbon` and returns null rather than shrink it.
- **Level 6's** misty card is drawn with a soft white-and-sea-blue mist (or leaves) over its telling element; tapping it says its caption and "the mist hides the end of the dock" (free).
- **Level 7's** frame is `lineLayout`'s `frame` (360 landscape, 420 portrait). The card before it sits beside or above it at card size, and is tappable to hear it (free).
- The posts, pegs, how a card lifts and sways, the flipbook and the music are unchanged.

## Accounting, help and finishing

- **Never a miss:** everything free at levels 1–4; at level 5, tapping the ribbon or dragging a chip and releasing it away from the ribbon; at level 6, hanging the misty card in **either** fitting gap (the pet: "We can't tell! Both places fit."); at level 7, tapping a part of the frame that is not a spot (the question repeats gently), the small card or the pet.
- **A miss** (with a boing and the reason, as at levels 2–4): a card in a gap no stage of it fits; at level 5 a chip that is not in every picture ("the merry-go-round is only in one picture"); at level 7 a spot that does not prove it, with its spot's reason. The same wrong choice again repeats the reason and counts nothing.
- **Hints:** after two misses on one card, chip set or question, its answer glows (both gaps for the misty card, the right chip, the proving spots) and `hints++`, at most once for each. Show a hint does the same.
- **Finish:** `ctx.finish({ misses, hints })` after the flipbook (level 7: after the question is answered, then the flipbook). One sticker, help or not. Nothing saved or filed.

## Rule tests (`logic.test.ts`)

- **Table:** every stage's `shows` includes its `changes` element's name; each place's still-here elements are exactly those in every stage; green and oven captions carry no number, date or time unit; `PLACE_IDS` is still the three built places.
- **Level 5, over 500 seeds:** every round has one still-here chip and two others, each in at least one picture and not all; **a progress-only heuristic fails** (place each loose card by `detail` among the hung cards, more detail later) at least one placement in **every** round; any legal build order fills the line.
- **Level 6, over 500 seeds:** the misty card hung last fits exactly two gaps and every other card exactly one; hiding the misty overlay (its face as stage `k + 1`) makes it fit exactly one; either fitting gap is accepted, counts nothing and keeps her order; a third gap is a miss with a reason from the nearest fitting gap.
- **Level 7, over 500 seeds:** the asked card is never the shore's and never index 0; every askable stage has at least one proving and one non-proving spot, each a named element in its `shows`; at the four views the lands test uses, every spot is at least 100 units and inside the frame, and no two overlap.
- **Hints:** a scripted round per level (wrong, the same wrong again, a second wrong, Show a hint) counts two misses and one hint, and the glow lands on the answer.
- **Layout:** `lineLayout` at levels 5–7 at the four views, including phone portrait, with the ribbon and chips at full size; registry, lands and how-to tests pass.

## Ghost finger, how-to card and voice

- **Ghost finger:** level 5 builds the line in stage order, then drags the still-here chip to the ribbon; level 6 hangs the misty card in the earlier of its two gaps; level 7 builds the line and taps the first proving spot.
- **How-to steps:** "Hang the pictures, then find what is still here in every picture and pin it to the ribbon" `{ from: 5, to: 5 }`; "Some pictures hide what would tell; when two places fit, either is right" `{ from: 6, to: 6 }`; "Tap the part of the big picture that shows when it is from" `{ from: 7, to: 7 }`. The note adds: "The newest picture is not always the fanciest."
- **Voice:** `trail.instruct.5`–`.7`, `trail.card.green-0`–`3` and `oven-0`–`3`, `trail.still-ask`, `trail.still-yes` (with `{thing}`), `trail.still-no` (with `{reason}`), `trail.mist` (tapping the misty card), `trail.both-fit`, `trail.proof-ask` (with `{caption}`), `trail.proof-yes`, `trail.proof-no` (with `{reason}`) and `trail.proof-again`. The words "fancy", "grand" and "plain" may be spoken; "old" and "new" are not used to describe a thing's look.

## Build slices and check tiers

Each is one level, one session, in order:

1. **T4a, level 5 Still here** (a new interaction, the ribbon: new-interaction tier): typecheck, rule tests, one filtered scripted play at level 5 (one wrong gap, one wrong chip, a hint), one portrait screenshot with the ribbon and chips, `fingerdemo` at 5, `npm run build` (voice and how-to change).
2. **T4b, level 6 We can't tell**, after T4a (the same drag; new-levels tier, but `place()` changes for every level): typecheck, all the game's rule tests, one browser play at level 6 hanging the misty card in its later gap and one wrong gap, a regression play at level 4, `fingerdemo` at 6, `npm run build`.
3. **T5, level 7 Show me why**, after T4b (tapping a spot: new-interaction tier): typecheck, rule tests, one scripted play at 7 (one wrong spot, one off-spot tap, the hint), one portrait screenshot of the frame and its spots, `fingerdemo` at 7, `npm run build`.

Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Not established: whether a school-age player reads mist as "can't tell" rather than "broken picture"; whether the merry-go-round makes her doubt "newer is fancier"; whether the proof spots read on a phone.

## Open decisions

Each has a default the builds use; none blocks T4a.

1. **Level 5's ribbon action.** Default: tap or drag a chip, with a wrong chip a miss. Alternative: all three chips free to try, as exploration, if play shows the question reads as a guess.
2. **Level 6's two gaps.** Default: both accepted, neither a miss, and the flipbook plays her order. Alternative: the pet asks her afterwards "could it go anywhere else?" and she taps the other gap (free).
3. **Level 7's wrong spot.** Default: a miss with its reason (the study said only that it "repeats the question gently"; that is kept for taps off every spot). Alternative: every tap free and 0/0, if play shows the frame invites poking.
4. **Level 7 and the shore.** Default: never asked, because its proofs are things being added. Alternative: ask it with "the dock has to be built before a shed can stand on it", a dependency rather than progress, after a reviewer reads the wording.
5. **Bands.** Default: levels 5–7 school only. Pre-K stays 1–4.
