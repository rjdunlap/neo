# Lift It deep dive

*ID `lift-it` · bands preschool, pre-K, school · levels 1–9 on 2026-11-09 · session `claude/dive-lift-it` ([PR #1364](https://github.com/rjdunlap/neo/pull/1364))*

## The game today

A friend waits on the tree's ledge for a parcel. She hauls the crate up by dragging the rope's end in strokes, and from level 2 she drags brass wheels from a tray onto the branch hook, the crate's hook or both. The learning purpose is **what a pulley does**, under the ideal rule the definition states: a wheel on the branch turns the pull around but needs the same paws; a wheel on the crate, held by two strands, halves the ideal pull and doubles the rope. At levels 7–8, both wheels let her move the tied end to the crate to make three supporting strands and pull upward. Built 2026-10-20 ([PR #692](https://github.com/rjdunlap/neo/pull/692)) from its [definition](../definitions/lift-it.md); it lives in Rainbow Meadow (`region: 'tinker-lab'`, `challenge: 'noticing'`), music `STYLES.paint`.

| Level | Plan name (`describeLevel`) | Bands | Line (`w` stones · `h` rungs · `g` ground · `l` ledge) | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Pull! | preschool | 1 · 2 · 1 · 0, branch wheel prebuilt | When and how far to pull |
| 2 | Push or pull | preschool, pre-K | 2 · 2 · 2 · 0, one wheel, branch hook only | Push the crate (`direct`) or hang the wheel and pull down (`fixed`) |
| 3 | Too heavy | pre-K, school | 4 · 2 · 2 · 2, two wheels, both hooks | Where the wheels hang (`movable` or `both` lift it) |
| 4 | Twice the rope | pre-K, school | `w` 2–4 · `h` 1–2 · `g` 1–3 · `l` 0–2, knot counter | Which rig, and a free guess at the knots |
| 5 | Who pulls? | school | `w` 2–5 · `h` 1–3, a request names ground or ledge | A rig that lifts it and ends at the named friends |
| 6 | By the numbers | school | `w` 3–6 · `h` 2–3, request, paws and knots cards | The rig, then the paws and the knots before the haul |
| 7 | Three ropes | school | first parcel 6 · 2 · 2 · 2, knot counter | Where to hang the wheels and tie the rope |
| 8 | Three ropes by the numbers | school | first parcel 6 · 3 · 0 · 2, ledge request and both cards | Which rig reaches the requested friends, then its exact paws and knots |
| 9 | How many paws? | school | level 4's filter with `w` 2 or 4, no request, one paws card | Any rig she likes, then how many paws it needs (paw prints hidden until she answers) |

`LEVELS` is `{ preschool: 1–2, prek: 2–4, school: 3–9 }`, with school `order` `[3, 4, 9, 5, 6, 7, 8]` (level 9 sits between 4 and 5) and no `entryLevels`; pre-K stays 2–4 (school only, decision 2's default). A round is three parcels; each level's first round of a session leads with its authored line(s).

**Content pools.** Four base rigs (`direct`, `fixed`, `movable`, `both`) and `three` at levels 7–8. Eight friend kinds (bunny, duck, mouse, bear, frog, cat, dog, pig), with different kinds for the waiting friend and the pullers. Each round picks a meadow, spring, autumn or evening look. Each crate has one dot per stone and carries a parcel from its light or heavy group. Speech uses the ideal rule.

**Accounting.** Levels 1–4 record no misses; a tug on a rig that cannot lift only stretches the rope and wobbles the crate, and the knot guess at 4 is a prediction. At 5–8 the first tug per rig per parcel on a rig that cannot lift, or that ends at the wrong friends, is a miss ("We tried that one" after); at 6, 8 and 9 a wrong card is a miss and the right card lights (at 9 tugs stay free, on any rig, and the pet says the count; a one-rope rig says "One rope holds it"). Moving the knot is free. After a parcel's second miss, the game can glow the right hooks, ring or card, counting one hint per parcel. Show a hint pulls a stroke with her at 1–2 and offers guidance at 3–9. One sticker per round; nothing is filed in the journal.

**Known gaps.** (Slice 1 closed the fixed lines at 1–3, the single look and parcel, and the five friend kinds: see *What was built*.)
- The **replay** button (level 3 up) and the pet's drawn paw on the level 1–2 hint are built (slice 2); device speech of the counting and whether the button reads as "again" are open.
- The numbers step is abrupt. Level 4's guess is free; level 6 adds the request, hidden paws and two cards at once. Level 9 (slice 3) now asks only "how many paws?", with no request and no knots card.
- Levels 1–4 can only step down through hints, by design (definition decision 2).
- No toddler toy (definition decision 1), no couch entry, no journal coupling (decision 4).
- Person checks open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): whether a preschooler reads the handle as "pull me", whether the stretch reads as "too heavy" rather than "broken", whether two or three strands are distinct at drawn size, and whether a school player finds the crate ring. Nothing in [OBSERVATIONS](../OBSERVATIONS.md).

**Browser coverage.** See [the suite summary](../VERIFICATION.md#coverage-summary) for the latest checks. `liftit` at level 9 (`FROM_LEVEL=9`, 2026-11-08, slice 3: authored parcel, paws hidden until the card, a wrong card on the branch wheel counts one miss, four paws then shown, a free tug on a too-heavy rig, the crate wheel asks 2, a requested hint glows the right card once, round finished with 1 miss and 1 hint; landscape screenshot `lift-it-9-paws-card`) and `fingerdemo` at 9 (43.0 s). `liftit` was re-run 2026-11-08 after slice 2 (level 1 with a requested hint showing the paw, level 6 wrong rig plus hint, level 3 autumn portrait, level 4 portrait with the replay button tapped and nothing counted or awarded). `liftit` (`scripts/browser/suites/lift-it-play.mjs`) and `fingerdemo`, 2026-10-20: level 1 by strokes, level 6 with one wrong rig (one miss), a repeat tug free and a requested glow (one hint), then cards and haul; a level 3 portrait screenshot with two wheels.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Tinybop Simple Machines](https://tinybop.com/apps/simple-machines) (the definition's reference) | Touch science toy | One scene per machine; pulling and adding parts changes one result | Each new level adds one part and one result; the scene explains the result | Six-machine breadth; destruction scenes |
| [The Incredible Machine](https://www.mobygames.com/game/2473) (1992) and [The Even More Incredible Machine](https://www.hardcoregaming101.net/the-incredible-machine-the-even-more-incredible-machine/) | Contraption puzzle | 87, then 160 puzzles; ropes run through pulleys to connect parts at a new angle ([walkthrough](https://sierrahelp.com/Walkthroughs/TheEvenMoreIncredibleMachineWalkthrough.html)) | Routing a rope through a wheel changes where the pull comes from: Lift It's level 5 already, and the tie point at level 7 | Locked puzzle order (the 48th opens after the 47th); free-form part bins; reading puzzle text |
| [Contraption Maker](https://www.co-optimus.com/Review/1385/contraption-maker-co-op-review.html) (2014) | Contraption puzzle | 140 puzzles; ropes, rope pulleys and hooks; co-op building | Two people build one machine: one hangs, one pulls | A physics engine with timing; long chains where one slip fails |
| [LEGO Education Simple & Powered Machines, pulley lesson](https://education.lego.com/en-us/lessons/advancing-with-spm/pulley/) (grades 6–8) | Classroom build | Ten models: belts first, then lifting models with advantage 1 (direction only) and advantage 2 (half the effort, twice the string) | The same order Lift It uses (direction, then halving); the lesson names the trade: twice the string | Worksheets and force measurement |
| [LEGO Education Simple Machines, pulleys](https://education.lego.com/en-us/lessons/sm/pulleys/) (grades 1–5) | Classroom build | Principle models from one wheel to more | Confirms the school window for two strands | Building with bricks; a classroom pace |
| [Science Buddies, "Pulley'ing Your Own Weight"](https://www.sciencebuddies.org/teacher-resources/lesson-plans/pulleying-your-own-weight) (the definition's reference) | Grades 3–5 lesson | Fixed, then movable, then combined pulleys | Combined pulleys are the school top: level 7's three strands | Spring scales and newtons |
| [small foot Pulley with Bucket](https://www.small-foot.de/en/pulley-with-bucket/11905) (3+) and [Happy Hooligans, "a bucket and a rope"](https://happyhooligans.ca/a-bucket-and-a-rope/) | Physical play | None: open-ended hauling of sand and toys | The pleasure is the haul itself, again and again, and seeing what arrives: the reason for varied parcels and a toddler toy | A hoist instruction for a child (the definition keeps it out until a practical-safety reviewer is named) |
| [Wikipedia, Block and tackle](https://en.wikipedia.org/wiki/Block_and_tackle) | Reference | Gun tackle "rove to advantage": the rope's end on the moving block, the hauling part pulled the way the load moves | The drawing of level 7: rope tied to the crate, pulled up | The page is not consistent on its strand counts, so the count below is made from the drawing, with OpenStax for the rule |

**Rule source.** [OpenStax Physics 9.3](https://openstax.org/books/physics/pages/9-3-simple-machines): the ideal mechanical advantage of a pulley system is the number of rope strands supporting the load, with friction and the wheels' weight left out. This session is the mechanism reviewer by the [October 23 decision](../archive/DECISIONS-2026-10-23.md#decisions), so the three-strand rig below is counted segment by segment.

## What makes sense here

The ladder starts with direction (2), halving (3) and the extra rope (4). Counting paws at 9 leads to choosing the pullers at 5 and both number cards at 6. Early hauls vary the parcel and ledge height. At the top, moving one knot adds a third strand, so she can count the supports and check how the pull changes. A toddler toy fits the bucket-and-rope play and still awaits a decision to open that band.

Ramps, levers and wedges stay out (definition decision 5: each needs its own rule and definition). Three wheels on the branch, a grown-up mechanism puzzle and real-world friction numbers stay out (below).

## Experience and presentation

- **First unsupported action:** at level 1, dragging the big knot down. The crate rises at once with the first few units of drag, so cause and effect needs no explanation.
- **Pleasure:** the creak and the per-knot tick, the crate climbing, the parcel hopping to the friend with their animal voice. Slice 1 adds what makes the next pull wanted: a different parcel each time (a basket of apples, a pumpkin, a kite, a teapot, a stack of books, a cake), shown on the crate as it rises and held up by the friend.
- **Touch and consequence:** the handle thickens and the rope tautens on touch-down; on a rig that cannot lift, the rope stretches at most 30 units and the crate rocks, with the paw count flashing. The strands are the explanation: at level 7 three ropes visibly hold the crate.
- **Variety without changing the rule:** seeded looks per round (spring blossom on the bough, autumn leaves falling past the ledge, evening with a lantern on the ledge), seeded parcels whose picture agrees with the stones (light things on 1–2 stones, heavy things on 4–6, so the picture never contradicts the weight), eight friend kinds, varied ledge heights at 1–3.
- **Reasoning, not precision:** stroke length never matters (any downward drag counts), hooks are 120-unit circles, the cards show dots under the numeral. Reading is never needed.
- **Supported ending and replay:** every parcel arrives, with help if needed; replay (slice 2) plays the last haul again with the knots counted aloud, so she can see "twice the rope" a second time without a new parcel.
- **Co-play:** one hangs the wheels and moves the knot, the other pulls; at 7–9 one says the paws before the other pulls.
- **Art example:** the autumn look swaps `LEAF` for `swatch.orange`/`swatch.red` fills, and adds five leaf `Graphics` that drift across the ledge with `ctx.tw` from `resize()`-computed spots, untracked in `destroy()`. The pumpkin parcel is an ellipse fill with three darker arcs and a green stem, in palette colours.
- **Needs a person or a device:** whether three strands read as three at the drawn size on an iPad; whether a pre-K child counts strands on the paws card or guesses; whether a toddler keeps dragging when the crate is near the top.

## Proposed ladder

### Fresh content inside existing levels

- **Looks:** three seeded round looks (spring, autumn, evening) beside today's, drawn into the existing `Backdrop` and leaf layer; music unchanged.
- **Parcels:** six parcel drawings in two weight groups, seeded per line; the friend holds the parcel on the ledge and the sticker can show the round's last parcel only if it is rebuilt from the seed (the sticker contract rebuilds from the seed alone).
- **Friends:** cat, dog and pig from `CRITTERS`, with their `sfx.animal` voices where they exist (otherwise `squeak`).
- **Varied lines at levels 1–3** (filters widened; authored first lines unchanged):
  - level 1: `h` 2–3, still `w` 1 and `g` 1, so every haul takes more than one stroke;
  - level 2: `w` 1–2 with `g` = `w`, so pushing and pulling still need the same friends;
  - level 3: `w` 3–4, `h` 1–3, still neither `direct` nor `fixed` lifting it and both two-strand rigs working.
- **A rule test asserts:** the old authored lines are unchanged; over 500 seeds each widened filter holds, the fallback is never used, and every value in each new range appears; a parcel's weight group matches its stones.

### Three-strand levels

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Three ropes | school (about 8 and up) | Authored: `w` 6, `h` 2, `g` 2, `l` 2. With both wheels hung she can **tap the crate ring** to move the tied end from the branch to the crate. `fixed` needs 6 paws, `both` 3 with 2 ground friends, `movable` 3 with 2 ledge friends: none lifts. Tied to the crate: three strands, 2 paws, the free end rises to the ledge friends, and up it goes with six knots. | Where the wheels hang and where the rope is tied | As level 5: the first tug per rig per parcel on a rig that cannot lift is a miss; two misses glow `bestRig`'s hooks **and the ring**; one hint per parcel. Moving the knot is never a miss | A new rig `three` (both wheels, end on the crate): `ratio` 3, `pullDirection` up, `pullersAt` ledge, `paws = ceil(w / 3)`, `travel = 3h`; `paws × travel ≥ w × h`; the knot can move only with both wheels hung; each round has one parcel only `three` lifts; `bestRig` breaks a two-wheel tie toward `both` before `three` | `ratio` widens to `1 \| 2 \| 3`; new rope path and ring in `index.ts`; 100-unit crate-ring target with clearance on both iPad fixtures; voice lines `instruct-three`, `three-ropes` for the tie and haul; how-to steps; bot taps the knot |
| 8 | Three ropes by the numbers | school | Authored: `w` 6, `h` 3, `g` 0, `l` 2, request "the ledge friends pull". Only `three` works and ends at the ledge: paws cards 2, 3, 6 (answer 2), knots cards 3, 6, 9 (answer 9) | The rig and the tie, then the paws and the knots | As level 6: rig misses, a wrong card is a miss and the right one lights | Level 6's exact-card rule holds for `three`: `w % 3 === 0` whenever `three` answers the request; knots cards `h, 2h, 3h` have exactly one right card per ratio | After 7; cards, request and hidden paws reused; no new art |

Counting the level 7 drawing, segment by segment: the rope is tied to the crate's ring, runs **up** over the branch wheel (strand 1, holding the crate), **down** under the crate wheel (strand 2, holding it), then **up** to the hand (strand 3, holding it). Three strands hold the crate, so the ideal pull is a third of the weight, the rope comes three times as far, and the free end moves the way the crate moves (up), which is the block-and-tackle "rove to advantage" arrangement. Spoken lines stay on the ideal rule; no friction number is spoken.

### Younger-band openings

- **Level 10 *One big pull*** (toddler, **decision**): the level 1 tree with a 1-rung ledge, the branch wheel prebuilt, one stone and one ground friend; any downward drag of 120 units lands the parcel, and a shorter one raises it part way and leaves it there for the next. No tray, no misses, no hint glow; Show a hint pulls with her. `entryLevels` would declare it for toddler; Rainbow Meadow's toddler page must still fit (lands test). A rule test asserts one stroke always suffices and nothing else is on offer. It opens a band the definition left closed (decision 1), and whether a toddler finds the knot without the ghost finger is a person check, so it waits on the developer.

### Easier entries and levels between existing ones

- **Level 9 *How many paws?*** placed between 4 and 5 (school `order` `[3, 4, 9, 5, 6, 7, 8]`). Level 4's lines with `w` 2 or 4 only, no request and no knot guess. After she hangs the wheels the paws on the handle are hidden and she picks a paws card (from `pawsCards(rig, line)`); then she pulls to check. Building a rig that cannot lift is fine: she says its paws, tugs, and the wobble agrees with her card. **Accounting:** a wrong card is a miss and the right card lights (as at 6); tugs stay free (as at 4); two wrong cards glow the right card, one hint. **A rule test asserts:** the paws card is exact for every rig on offer (`w` even); the round holds one line a one-strand rig lifts and one only two strands lift; the authored line `w` 4, `h` 1, `g` 2, `l` 2 asks 4 for `fixed` and 2 for `movable`. Cost: a `paws` ask kind beside `knots` and `numbers`, the hidden-paws switch extended to it, voice line `instruct-paws`, a how-to step, the bot answers the card.
- Pre-K could take 9 as its top (its window is 2–4). That puts a counted miss into pre-K, which the definition's accounting keeps out, so it is a **decision**; the default is school only.

### Left out on purpose

- **Three wheels (a second branch wheel to bring a three-strand pull back to the ground):** a third hook on the branch adds clutter at 768 wide and teaches only the direction change levels 2 and 5 already teach.
- **Ramps, levers, wedges:** definition decision 5; each needs its own rule and definition.
- **Friction and real loads:** the speech stays ideal (definition decision 6); a "real rope loses some" number would need the study's reviewer.
- **A grown-up mechanism puzzle and a couch entry:** the [physics every-band table](../PHYSICS-GAMES.md#every-band) keeps it a proposal; no couch level here.
- **A hoist suggestion off screen:** stays out until a practical-safety reviewer is named.
- **Timers, haul counts, fewest-strokes scores:** never.

## Decisions for the developer

By the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S8) the definition's six defaults stand, including no journal entry. Two new calls, neither blocking slices 1–5:

1. **A toddler entry, level 10 *One big pull*?** Default: no (the definition's decision 1); if yes, it also needs a person to watch a toddler find the knot.
2. **Pre-K up to level 9 *How many paws?*?** Default: no, school only, so pre-K keeps no counted misses.

## Build slices, in order

1. **Built.** **Looks, parcels, three more friends and varied lines at 1–3** (preschool to school; typecheck, rule tests, one filtered `liftit` play at level 3 with one portrait screenshot in the autumn look; no `fingerdemo`, since the bot's actions do not change; build only if shared files change).
2. **Built.** **The replay button and the helping paw** (from the definition; level 3 up: the replay button replays the last haul with the knots counted aloud; levels 1–2: a drawn pet paw rides the handle when Show a hint pulls; typecheck, unit tests including a layout test for the button clear of the pet and shell, one browser play at level 4 that taps replay, one portrait screenshot; build because voice lines change).
3. **Built.** **Level 9 *How many paws?*** placed between 4 and 5 (new level on the existing card interaction: typecheck, rule and registry/how-to tests with the new `order`, one browser play of 9 with one wrong card, `fingerdemo` at 9, build because voice lines change).
4. **Built.** **Level 7 *Three ropes*** added the movable knot and three-strand haul.
5. **Built.** **Level 8 *Three ropes by the numbers*** adds the puller request and exact paws and knots cards to that interaction.

The [completed work record](../archive/COMPLETED-2026-10-09.md#lift-it-levels-78-three-ropes-2026-11-09) covers slices 4–5. Level 10 awaits decision 1. Ring and strand readability on iPad remain [device checks](../DEVICE-CHECKS.md).

## What was built in this session

Slice 1 (looks, parcels, three more friends, varied lines at 1–3), on branch `claude/lift-it-looks-parcels`.

- Four seeded round looks (`meadow`, `spring` blossom, `autumn` leaves drifting past the ledge, `evening` with a lantern and no sun), exposed as `game.look`.
- Six parcels in two weight groups: light (at most 2 stones) apples, kite, cake; heavy (3 or more) pumpkin, books, teapot. Seeded per line in `makeRound` and checked by `lineFits`; authored first lines keep their numbers and get parcels (level 1 apples). The parcel rides on the crate's left corner and the waiting friend keeps it on the ledge until the next line; the sticker draws a parcel from its seed.
- Cat, dog and pig added (eight friend kinds).
- Widened lines: level 1 `h` 2–3; level 2 `w` 1–2 with `g = w`; level 3 `w` 3–4, `h` 1–3 (`g` 2, `l` 2). Two level-2 voice lines reworded because level 2 can now have one friend.
- Paw prints placed by `pawSpots` (right, else left, else below the handle), clear of friends, wheels and the held parcel.
- Checks: typecheck; 21 rule tests; `BROWSER_SUITE=liftit` 2026-11-07 (level 1 by strokes, level 6 wrong rig plus hint, level 3 portrait screenshot in the autumn look). Not run: `fingerdemo` (bot unchanged), build, offline.

Slice 2 (the replay button and the helping paw), on branch `claude/lift-it-replay-paw` (PR #1424).

- Replay button from level 3 up: a round green curled-arrow button, 120 across, at `replaySpot` (x 75, y `min(440, h − 285)`, left of the crate below the top-left shell button; `REPLAY_HIT` and `counterBox` in `logic.ts`). It shows once a parcel has arrived this round and nothing is being pulled, hung or asked. It hauls the last delivered parcel again on its own wheels, one knot at a time, the pet counting each knot aloud (new voice lines `lift-it.replay` and slotted `lift-it.knot-n`); the counter shows even at level 3; then the half-twice or count-the-knots line, the crate comes down and her own parcel and wheel placements return. It never changes the line, misses or hints and never awards anything.
- Levels 1–2: Show a hint draws the pet's paw (in `swatch[pet.color]`) riding the handle and pulls the handle down with the stroke.
- Layout test per view (four views): the button is at least 100 across, inside the view and clear of the pet corner, shell buttons, tray, hooks, ground and ledge handles, counter, crate column, ring, friends and the card row. How-to card notes for levels 3–6 and the level 1–2 hint note updated.
- Checks 2026-11-08: typecheck; `npm test` (329 files, 6271 passed); `npm run build`; `BROWSER_SUITE=liftit` (level 1 with a requested hint showing the paw and counting one hint, level 6 wrong rig plus hint, level 3 autumn portrait screenshot, and new: level 4 portrait delivers one parcel, shows the button, taps replay, asserts line, misses, hints and rig unchanged and one sticker for the round; screenshot `lift-it-4-replay-portrait`). Not run: `fingerdemo` (bot's actions unchanged), offline, device speech of the counting.

Slice 3 (level 9 *How many paws?*), on branch `claude/lift-it-how-many-paws` (PR #1427).

- New plan id 9 (hooks branch and crate, tray 2, counter off, ask `paws`, no request, three lines) in `logic.ts`; school `order` is now `[3, 4, 9, 5, 6]`, pre-K unchanged. Lines use level 4's filter with `w` 2 or 4 only (`h` at most 2, `g` at least 1); `roundFits` needs one line a one-strand rig lifts and one only two strands lift (shared with level 4). Authored first line `w` 4, `h` 1, `g` 2, `l` 2 (cat waits, pig pulls, teapot); a fallback round was added.
- `index.ts`: paw prints stay hidden until she answers; tapping the handle on any rig (even one that cannot lift, or with nobody at the ledge) asks one paws card (`pawsCards`) and no knots card follows. The right card lights with a bell; a wrong card is a miss, the right card lights and the pet says the count (new line `lift-it.count-paws-one`: "One rope holds it. {w} stones: {paws} paws."). Tugs stay free (`countsMisses` false). Two wrong cards make the next card question glow the right card (one hint); Show a hint during a card glows it once (one hint). New line `lift-it.instruct-paws`.
- How-to card: wheel steps and replay note widened to levels 3–9, plus a level 9 step and accounting note.
- Tests: 28 rule tests (new: level 9 order and school-only; the authored line asks 4 for fixed and 2 for movable; the paws card is exact for every rig over 500 seeds and the round mix). `lift-it-play.mjs` gained a level 9 play (runs alone with `FROM_LEVEL=9`).
- Checks 2026-11-08: typecheck; `npm test` (329 files, 6293 passed, 1 skipped); `BROWSER_SUITE=liftit FROM_LEVEL=9`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=lift-it FINGER_LEVELS=9` (43.0 s); `npm run build`. Not run: the full `liftit` suite for levels 1–6 (code paths unchanged), offline, device speech of the new lines, a portrait screenshot of level 9.
