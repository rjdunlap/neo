# River Tablets, levels 1–6 (definition)

Levels 1–3 are defined below. Levels 4–6 (AR3) are defined in [their own section](#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree) at the end of this file.

Defined 2026-10-27 as slice AR1 of the [ancient river civilizations study](../deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order) ([packet](../deep-dives/subjects/RECOMMENDATIONS.md#ancient-river-civilizations-recommendations)), [PR #1015](https://github.com/rjdunlap/neo/pull/1015). Decisions 1–2 were taken 2026-10-23 on the developer's delegation: invented island marks on the child's screen, Story Grove if the lands test passes (else Counting Cove), and a first build of levels 1–3 only. **Nothing is built.** AR2 builds levels 1–3 as one [batch](../GAME-BATCHES.md#river-tablets-1-one-token-each-the-envelope-and-which-row); levels 4–6 (AR3), 7–8 (AR4) and Two Tablets (AR5) are separate definitions.

**Fun action and purpose:** make a clay record of real things, then open it up and see the record match the things. A sheep walks into the pen and she drops a token in the jar; tokens go into a clay ball and she presses one mark on the outside for each; goods arrive mixed and she presses each mark in the row with its picture. Every level ends by **lining the record up against the things it stands for**, one to one, and the pet counts both aloud. Learning goal: a record stands for things that are not in front of you; one mark for one thing is exact; two kinds need two rows. This is the island's first "why writing exists" activity, and it is not counting alone: Lasso Loops owns grouping fireflies into jars of five and ten, Number Trails owns the count sequence, and Picture Graph owns tallies and bars. River Tablets stays one-to-one and read-back until level 4 (a tens-mark), which is AR3's question.

## Overlap and reuse

- **Identity check** (the study's condition): a new activity is justified only if *making and using a record* is central. It is, at every level: level 1's tip-and-count, level 2's crack-and-compare and level 3's read-back each compare the record with the goods. If AR2 finds the tip, crack or read-back ending is not what holds a child, the rungs fold into Lasso Loops (count) and Story Steps (the river's year), as the study says, and this packet is withdrawn rather than built thin.
- **Letter Trails** owns tracing; River Tablets presses into cells and never draws a stroke. **Stamp Studio** owns stamping kept pictures; nothing here is kept. **Secret Code** owns deduction; nothing here is deduced. **Pet Kitchen / Little Helpers** own sharing and enough-for-everyone; level 3's two rows record kinds, they share nothing.
- Reuse `src/art/critter.ts` sheep (`CRITTERS`/`attach()`, cosmetic) and a code-drawn jar, cart and clay from `src/art/shapes.ts`/`scenery.ts`; `onTap` for every control (there is no drag, no stylus and no freehand); Duck Pond's pattern for one big tap target that reacts on touch-down; Helper House's scene-owned step player for the sheep walks and the tip, crack and read-back animations; Ferry Jam's pattern for a bot that finishes through the same inputs. No new engine, save field, render texture or shared helper.
- **History on screen:** the marks are invented island signs, "like the scribes' marks by the big rivers, long ago" (decision 1). No real cuneiform, hieroglyph, place name, king, god or river name is drawn or spoken. The one historical line (below) is checked against museum and KS2 sources in the building session, as the 2026-10-23 decision replaced the named reviewer.

## The model (`logic.ts`)

Three plans, each a finite seeded draw with `ctx.rng`. Cosmetic draws (sheep colours, meadow props, which side the pen gate opens) never change a count. No physics, no timer: every arrival waits for her.

### Level 1, One token each (`tokens`)

- **Plan:** `sheep` 3–5. State: `arrived` (sheep in the pen), `walking` (one sheep on the path, or none), `tokens` (in the jar), `tipped`.
- **Flow:** the first sheep walks in on its own. The jar is the only input. `tapJar()`: if `tokens < arrived`, a token drops in with a clink and, when more sheep remain, the next sheep starts walking; otherwise the jar wobbles and a token pops up and falls back in (no change; the pet says "That sheep has its token. Here comes the next one" or, once all are in, "Tip the jar!"). A tap while a sheep is still walking is the same no-change wobble, never a miss. Once `arrived === sheep` and `tokens === sheep` the jar glows and the pet says "Tip the jar!"; the next tap tips it: tokens roll out and line up under the sheep one to one, the pet counts both aloud ("one, two, three, four… four tokens, four sheep"), and the round finishes.
- **Invariants:** `tokens <= arrived <= sheep` always; exactly `sheep` effective taps plus one tip reach the finish from any state; nothing else is needed, so the finish is always reachable.
- **Accounting:** nothing counts. `misses` and `hints` are always 0. If no tap comes for about eight seconds while a sheep waits, the jar glows (entry guidance, as Sorting Machine level 1 and Helper House level 1 do); this records nothing, which is the "level 1 counts nothing" rule the study states and the October 23 Relay Woods decision (a toddler glow counts one hint) does not apply, because this level has no answer to reveal.
- **Rounds:** one pen of sheep per round.

### Level 2, Marks on the envelope (`envelope`)

- **Plan:** two envelopes per round, `tokens` 3–6 each (the two differ). An envelope is a clay ball with an **8-cell grid** on its face (2 rows × 4), so a count is always a whole number of marks and never a smudge.
- **Flow:** the tokens drop into the open ball one by one (she watches; nobody counts aloud), then it closes. She presses cells: an empty cell takes a wedge mark on touch-down with a soft "thup"; pressing a marked cell lifts the mark off (free). Tapping the ball itself **peeks**: it turns translucent for about two seconds and shows the tokens, as often as she likes and never counted, so remembering is optional and re-counting is the study's "free re-count." **Crack** is the one commit: a large control shaped as the pet's hands on the ball. On Crack the ball splits, the tokens roll out and line up under the marks in reading order.
- **Verdict:** `crack(marks, tokens)` returns `match`, `fewer` (marks < tokens) or `more` (marks > tokens) with the difference. `match` finishes the envelope: "Four marks, four tokens. They match!" `fewer`/`more` is one **miss**: the lineup leaves the unmatched tokens (or the extra marks) wiggling alone, the pet names it ("Three marks, but four tokens. One sheep's token has no mark"), the ball closes again with her marks kept, and she presses or erases and cracks again.
- **Help:** after the second miss on the same envelope, the fix glows and `hints++` once for that envelope: on `fewer` the next empty cell glows (one at a time, retargeting as she presses, until marks equal tokens); on `more` the last mark glows to be lifted. The glow stays until the count is exact, so following it always reaches `match`. A glow never presses for her. Asked-for help (the pet's Help button) is the same glow and the same single count per envelope; a second press repeats it free. The second envelope starts with its own counts and its own one hint.
- **Finish:** the second envelope's `match`. `ctx.finish({ misses, hints })` with the round's totals (misses are per crack, so a child who cracks early and fixes it has one miss, not one per mark).

### Level 3, Which row? (`rows`)

- **Plan:** two tablets per round. A tablet has two rows, the top headed by a sheep sign and the bottom by a jar sign (the heading is a picture of the goods, not a word), each row 4 cells. A delivery is a seeded sequence of 4–6 goods with **both kinds present, at most 4 of either**, in a mixed order: the sequence is never all of one kind then all of the other (every delivery has at least one kind change after the first switch, which the plan test proves exists for every allowed count pair).
- **Flow:** goods arrive one at a time on a cart and wait at the tablet, shown large. She presses the row it belongs in. The **row** is the target (its full height, at least 100 units); the mark lands in that row's next empty cell from the left, so a child never has to hit a particular cell. A press is the commit for that arrival: the right row takes the mark with a "thup," the good rolls into the storehouse and the next good arrives.
- **Misses and help:** a press in the wrong row is one **miss**: the mark bounces back out, the pet says "That was a jar. The jar row has the jar picture," and the good stays waiting. The tablet never keeps a wrong mark, so its rows always read back to the delivery. On the **second** wrong press for the same arrival the pet slides the mark into the right row itself, `hints++` once for that tablet (the study's "it moves to the right row after the second miss with one hint"), and the correct row's heading glows for the rest of that tablet; later wrong presses on that tablet still count misses but add no more hints. Asked-for help glows the row of the waiting good and is that tablet's one hint if not yet spent.
- **Read-back ending:** when the last good is marked, the storehouse opens and the goods line up under their rows one to one while the pet reads the tablet ("Three sheep marks, three sheep. Two jar marks, two jars"). The second tablet's read-back finishes the round.

### Bands and ranges

`BandLevels`: `preschool: { min: 1, max: 2 }`, `prek: { min: 2, max: 3 }`, `school: { min: 3, max: 3 }`. No lap, toddler or grown-up window (the study: a one-year-old has no "long ago," and the toddler rung is Stamp Studio's roller, AR6). School's single level is the deliberate start of the study's 3–8 window so that AR3 can append 4–6 without renumbering; a school child who reaches River Tablets today plays level 3 and the pin stays valid afterwards. No `order`.

## Screen and controls

- **Stage.** Landscape: the pen or the arrival lane along the top, the tablet or jar centred and large, the storehouse at the right, the pet bottom-left and corner buttons clear. Portrait stacks the lane above the tablet above the controls. Every input (jar, cell, row, ball, Crack, Help) is at least 100 logical units after scaling; cells are planned at 110 × 110, rows at 460 × 120 (a 110-unit sign plus four cells), the jar at 180 × 200, Crack at 140 × 110. Decorations (reeds, river, props) are `eventMode = 'none'`.
- **Touch-down feedback.** The jar squashes, a cell shows its mark and a row lifts on touch-down, before any rule runs; a rejected press (wrong row, wobble) still shows that it was felt.
- **Speech.** `ctx.instruct` states the level's one ask ("Tap the jar for each sheep" / "Press one mark for each token, then crack it open" / "Press each mark in its row"); the pet repeats it. Counts in the read-backs are spoken from bounded number slots (one to six), never a template with free text.
- **Feel.** A calm existing island music style (she is not making music): `STYLES.meadow` or the land's default; one pentatonic note from `src/audio/notes.ts` per token or mark, a lower one for the crack. Palette clay, river and grain colours; no sepia or texture filter. Reduced motion shows arrivals and tips without the walk.
- **The one history line**, spoken once at the start of levels 2 and 3 and printed on the card: "Long ago, by the big rivers, people pressed marks in clay to remember how many." It names no place, people or script, matches the museum pages the study opened (the token and envelope story is told as how records began, with its criticisms noted in the study), and is checked again in the building session.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 1 | nothing | nothing | every tap, the idle glow, the tip |
| 2 | each Crack whose marks do not equal the tokens | the glow after the second miss on an envelope, or asked-for help; at most one per envelope | pressing, lifting a mark, peeking, repeating the instruction |
| 3 | each press in the wrong row | the pet moving the mark after the second wrong press on one good, or asked-for help; at most one per tablet | the arrival, the read-back, the heading glow once spent |

- **Supported finish:** at levels 2–3 the glow or the moved mark always leads to the exact record, so every round finishes with one ordinary sticker through `ctx.finish({ misses, hints })`, help or not. No creation, discovery or journal entry in the first build (a kept tablet in the treehouse is a later creations question, as the study says). Leaving early owes nothing.
- **Adaptation:** level 1 is always smooth (two rounds step up to 2). At level 2 a child who cracks once wrong and fixes it is still smooth (at most one miss); two hints or four misses are struggling. Assisted completion is one sticker, not evidence of mastery. Nothing here claims a preschooler understands records; it claims she tapped, pressed, cracked and saw the lineup.

## Rule tests (`logic.test.ts`)

- **Plans:** over 300 seeds per level, level 1 draws 3–5 sheep; level 2 draws two envelopes of 3–6 tokens that differ; level 3 draws two deliveries of 4–6 goods with both kinds present, at most 4 of either, and a mixed order (not all of one kind then the other). The same seed gives the same plan.
- **Level 1 invariants:** from any reachable state `tokens <= arrived <= sheep`; a tap when caught up or while a sheep walks changes nothing; exactly `sheep` effective taps and one tip finish; `misses` and `hints` stay 0.
- **Level 2:** `crack(m, t)` is `match` iff `m === t`, with `|m − t|` named; the lineup pairs `min(m, t)` and lists the leftovers; `hintFor(state)` glows an empty cell when `fewer` and the last mark when `more`; following the glow from every state with `0..8` marks reaches `match` in `|m − t|` steps; a hint is counted at most once per envelope; eight cells hold the largest token count.
- **Level 3:** `press(row, good)` accepts iff `row === good.kind`; a rejected press leaves the tablet unchanged; after the second wrong press `autoPlace` marks the right row and the tablet's hint count is 1 at most; after every delivery the rows read back to the delivery's counts; a row never overflows four cells.
- **Layout:** `tabletLayout(level, view)` at the four views the lands test uses (landscape, portrait, two phone insets): every input at least 100 units, nothing under the bottom-left pet or corner buttons, portrait stacks rather than shrinks, rows and cells do not overlap.
- **Registry, lands, how-to and off-screen tests** pass with the new game: Story Grove 15 → 16 games (paged at `LAND_SPOTS`), the card scoped per level, no "later levels" wording.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`, `autotouch()` through the public inputs. Level 1: tap the jar once per sheep, waiting for each walk, then tap it again to tip. Level 2: tap the ball to peek, press one empty cell per token, tap Crack. Level 3: for each arrival press its kind's row. The bot never presses a wrong row and never calls finish; it reads `game.state` and the current layout after every resize.
- **How-to card** (`src/content/howto.ts`). Goal: "Make a clay record, then open it up and see it match." Steps: "Tap the jar each time a sheep comes in, then tip it" `{ from: 1, to: 1 }`; "Press one mark for each token, then crack the ball open" `{ from: 2, to: 2 }`; "Press each mark in the row with its picture" `{ from: 3, to: 3 }`. Finish: "The marks and the things line up, one for one." Note: "Pressing, lifting a mark and peeking are never counted; only cracking the ball or choosing a row is." Level 2–3 note carries the one history line.
- **Voice lines** under `rt.*`: `intro`, `instruct.1`–`instruct.3`, `history`, `token-in`, `already`, `tip`, `count.1`–`count.6`, `match`, `fewer`, `more`, `peek`, `glow`, `wrong-row.sheep`, `wrong-row.jar`, `moved`, `read-back`, `help`, `done`. Feedback names the goods and the row picture, never the cell number. `{pet}` optional.
- **Registration:** ID `river-tablets`, name "River Tablets", spoken title `game.river-tablets`, region `story-grove` (writing), home land **Story Grove** (15 games today, 16 with this one; the lands test proves the paged fit; fallback Counting Cove, 12 → 13, by decision 2). Skills `['counting', 'one-to-one', 'symbols', 'checking']`. Hub icon: a small clay tablet with three wedge marks and a sheep. Sticker: a seeded tablet with a sheep row and a jar row filled.
- **Co-play:** counter and scribe, from the study: one person counts the goods aloud as they pass, the other presses the marks, then swap after each tablet. **Off-screen:** none drafted; the play-dough tablet and Ur board cards wait on the practical review decision 2026-10-23 declined for now.
- **Couch:** none.

## Check tier (for AR2)

New-game tier: `npm run typecheck`, the rule tests above with the registry, lands, how-to and off-screen tests; one scripted play through a `browser-check.mjs` filter (level 1 to the tip, level 2 with one wrong crack and a glow, level 3 with one wrong row and the moved mark) and one portrait screenshot; `fingerdemo` at level 3; `npm run build` because the registry, lands, voice and how-to change. Record the tested commit, the filter and the server URL. Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Device checks open at the build: whether a three-year-old waits for the walk or taps ahead, whether the 8-cell face reads as "one mark per token" on an iPad, whether the read-back counts are followed, and device speech for the count slots.

## Open decisions

Each has a default the build uses; none blocks AR2.

1. **Level 1 pacing.** Default: child-paced, the next sheep walks only after the last one has its token. The alternative (sheep walk on their own and she catches up) is the study's literal reading and adds pacing pressure; it can become a later mode if someone watches a child wanting it.
2. **Peek at level 2.** Default: free and unlimited, so memory is never the obstacle. The alternative (one free peek, then counted) would make level 2 a memory rung, which the study does not ask for.
3. **School window.** Default: `school: { 3, 3 }` now, extended by AR3. The alternative of leaving school out until AR3 would still play level 3 through `playBand`'s fallback but would leave no school pin space.
4. **Land.** Default: Story Grove (16th game). Fallback by decision 2: Counting Cove.
5. **The history line.** Default: the single sentence above, source-checked in the building session (museum pages and the KS2 depth study the research opened). If the check finds the token-and-envelope story is contested enough to drop, the line becomes "Long ago, people pressed marks in clay to remember how many" with no river.

## Levels 4–6 (AR3): a ten-mark, check the delivery, two tablets disagree

Defined 2026-10-30 as slice AR3 of the [study](../deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order), [PR #1030](https://github.com/rjdunlap/neo/pull/1030). **Levels 4–5 built 2026-10-31, [PR #1044](https://github.com/rjdunlap/neo/pull/1044)** (school range now 3–5). **Level 6 built 2026-10-31, [PR #1085](https://github.com/rjdunlap/neo/pull/1085)** (school range now 3–6). The history line shipped as this definition's softer fallback, "Long ago, people used a different mark for ten." (`rt.history.tens`): the building-session source check read MacTutor (Babylonian numerals built from a unit and a ten symbol; Egyptian numerals additive, ten copies of a symbol replaced by one of the next value) and Wikipedia's Egyptian numerals, but BBC Bitesize was unreachable and the Met's Origins of Writing essay returned 429, so no museum or KS2 source was read. Decisions 1 and 2 took their defaults (no ration row; yard count free and spoken). Docs only when defined; the build is two batches: [river-tablets 2](../GAME-BATCHES.md#river-tablets-2-a-ten-mark-and-check-the-delivery) builds levels 4–5, and [river-tablets 3](../GAME-BATCHES.md#river-tablets-3-two-tablets-disagree) builds level 6 after it. Decision 7 was taken 2026-10-23 on the developer's delegation: additive tens-and-ones at school (Egyptian-style, order never matters), positional base sixty only as a note for the number-structure study. All three levels are school only. They are appended after `rows` in `PLANS` without renumbering, so open decision 3's school pin space at level 3 stays valid.

**Fun action and purpose:** level 4: a cart unloads crates and loose baskets of grain. She presses a big mark for ten and small marks for ones on the storehouse tablet, then hands it in. The crates and baskets line up under the marks while the pet reads the tablet. Level 5: the tablet was written at the farm before the cart left. The cart arrives, and she says whether it is short, right or extra, and by how many. Level 6: the farm's tablet and the storehouse's tablet record the same cart, and they disagree. She decides which one the cart agrees with, or that neither does, or that nobody can tell any more. Learning goal: a record is a promise about things that are not in front of you. A different mark for ten makes a big count short. A record can be checked against the goods, and a record can be wrong, or impossible to check. Levels 1–3 make records. Levels 4–6 make bigger ones, then **use** and **doubt** them, which is what the study means by a record being central.

### Levels 4–6: overlap and the identity check

- **Lasso Loops** owns *making* tens: a free loop around loose fireflies fills a jar of ten, and its `tens` plan asks for the number (34 is three tens and four). River Tablets never asks her to group anything. At level 4, nine of every ten baskets she sees come already packed in a crate, and a spilled crate is a pile she counts with the pet's help (below). The action is *writing the count down* with two kinds of mark and reading it back. If the build finds level 4 playing as Lasso Loops with a stamp, the study's fallback applies: the rung becomes a Lasso Loops mode and levels 5–6 still stand.
- **Picture Graph** owns tallies and bars, and **Pet Kitchen / Little Helpers** own fair shares. Level 5's "short by two" is a difference between a record and a delivery, not a share. **Secret Code** owns deduction from clues. Level 6 has no hidden code: the cart is either there to count or not.
- **Market Stall** owns coins and change. The marks here are counts of goods and are never paid.
- **Reuse:** `wedgeArt` draws the small mark. The ten-mark is a new code-drawn corner wedge, twice the size, in `art.ts` (the study's "thick short wedge and a corner wedge"). `jarGoodArt`/`cartArt`/`storeArt` cover the goods, cart and storehouse. A basket and a crate of ten are code-drawn: the crate shows ten basket rims through its slats. Level 2's `crack`/lineup step player drives every read-back. There is still no drag, no freehand, no new engine, save field, render texture or shared helper.

### Level 4, A ten is a different mark (`tens`)

- **Plan:** two tablets per round, counts `n` 12–29, different from each other.
  - Tablet 1 arrives as `floor(n / 10)` crates plus `n % 10` loose baskets (2–9).
  - Tablet 2 arrives **spilled**: one crate burst on the way. The spilled crate's ten baskets lie loose, and any whole crates stay crates. Loose baskets are 11–19 in tablet 2, crates 0–1, total 12–29.
  - Loose baskets sit in a seeded, non-overlapping scatter in the yard. They are never in rows of ten, since grouping is Lasso Loops'. They are display only (`eventMode = 'none'`).
- **The tablet** has two strips. The ten strip holds up to **3** ten-marks. The ones strip holds up to **19** small marks, drawn in two lines. Its 19-mark cap is what lets her write a spilled crate as ten small marks. Marks are display only, about 40 units wide.
- **Controls, every one at least 100 units:**
  - the **ten stamp** and the **one stamp** (about 140 × 120 each);
  - the **ten strip** and the **ones strip** (about 460 × 120 each);
  - **Hand in** (about 140 × 110, the pet's hands holding the tablet up);
  - the **yard** (the whole unloading area).
- **Pressing and lifting:** a stamp adds its mark on touch-down with a "thup", low for a ten, high for a one. A stamp press at its strip's cap wobbles the stamp and changes nothing. Tapping a strip lifts its last mark. Tapping the tablet face between the strips reads it aloud ("two big marks and three small marks: twenty-three"). Tapping the yard makes the pet count it: crates first ("ten, twenty"), then each loose basket with a bounce ("twenty-one, twenty-two, twenty-three"). Tapping a crate inside the yard opens it for about two seconds and counts its ten. **None of these is ever counted.**
- **The model:** `value(tens, ones) = 10 × tens + ones`. Marks are additive and grouped by strip, so order never matters. `shortest(n) = { tens: floor(n / 10), ones: n % 10 }`.
- **Verdict on Hand in:**
  - `value === n` in shortest form: the crates line up under the ten-marks and the baskets under the small marks. The pet says "Two big marks, three small marks. Twenty-three baskets!"
  - `value === n` in a longer form (for example 1 ten and 13 ones for 23): **accepted, no miss and no hint**. The pet says "That's right!", then shows the shorter way: ten small marks slide together into one big mark ("Ten small marks can be one big mark"). The tablet keeps the short form for the read-back.
  - `value !== n`: one **miss**. The lineup leaves unmatched goods (or empty marks) wiggling. The pet reads both sides ("Your tablet says twenty-one. The cart brought twenty-three."), and the tablet comes back with her marks kept.
- **Help:** after the second miss on a tablet, or on asked-for help, the next step glows, and `hints++` once for that tablet.
  - If `value === n`, Hand in glows.
  - Otherwise the glow leads toward `shortest(n)`: a ten to lift if `tens > T`; else the ten stamp if `tens < T`; else a one to lift if `ones > O`; else the one stamp.
  - The glow retargets after every press. It moves monotonically, so it reaches an equal reading within `|tens − T| + |ones − O|` steps. Because `T ≤ 2` it never asks for a press at a cap, and it never presses for her.

### Level 5, Check the delivery (`check`)

- **Plan:** two carts per round. The tablet for each was written at the farm in shortest form (pre-pressed, not hers to change), with count `t` 12–29. The cart brings `c = t + d`, where `d` ∈ {−3…3}. The cart shows `floor(c / 10)` crates and `c % 10` loose baskets.
- **Distribution:**
  - At least one of the two carts has `d ≠ 0`.
  - Across seeds, *short*, *right* and *extra* all occur, as do every `|d|` from 1 to 3.
  - The two tablets' counts differ.
  - A cart whose difference crosses a ten (`t` = 21, `c` = 19) is allowed, so the crate count can differ from the tablet's ten-marks. That is the point of checking.
- **Controls:**
  - three verdict buttons, each at least 120 × 120 and pictured, never worded:
    - *short*: the tablet's outline with a gap in the cart;
    - *right*: the tablet and the cart joined by a band;
    - *extra*: a basket spilling over the cart's edge;
  - for *short* and *extra*, three number buttons (one, two and three dots with the numeral).

  Each verdict button says its name on touch-down. **Right** is the commit by itself. *Short* and *extra* open the numbers beside them, and tapping a number commits the pair. Changing the verdict before a number is free.
- **Free, never counted:** tapping the tablet reads it. Tapping a crate opens it and counts its ten. The yard is **not** counted aloud at this level, because counting the cart *is* the check. The plan keeps loose baskets at 9 or fewer so that counting stays within reach.
- **Verdict:**
  - Right verdict and number: the goods line up against the marks. The pet says "The tablet says twenty-one. Nineteen came. Two short!"
  - Any wrong commit (wrong verdict, or right verdict with the wrong number) is one **miss**. The pet says the two counts side by side ("The tablet says twenty-one. Let's count the cart again."), and she answers again.
- **Help:** after the second miss on a cart, or on asked-for help, the lineup plays and holds. Crates stand under ten-marks and baskets under small marks. The uncounted goods (extra) or the empty marks (short) glow. The pet counts the glowing ones once, and `hints++` once for that cart. After the lineup the answer is in plain view, so the finish is always reachable.

### Level 6, Two tablets disagree (`disagree`)

- **Plan:** two cases per round, in seeded order. Each case has a **farm tablet** (at the left, by the field) and a **storehouse tablet** (at the right, by the storehouse door). Both are in shortest form, with counts 12–29 that **always differ**, by 1–3. So at most one tablet can match any cart. One case is always `one`. The other is drawn from `neither` and `gone`, and both occur across seeds.
  - `one`: the cart stands in the yard and matches exactly one tablet. Which tablet matches is seeded, and both sides occur.
  - `neither`: the cart stands in the yard and matches neither tablet. It differs from each by 1–3.
  - `gone`: the cart is empty. The pet says, "The baskets were already shared out before anyone counted them." There is nothing to count.
- **What "right" means:** a tablet is right if it agrees with the cart in front of her. The answer set is fixed and enumerated: `farm`, `storehouse`, `neither`, `cantTell`. `readings(case)` lists every answer consistent with what is on screen.
  - A present cart has exactly one consistent reading, out of `farm`, `storehouse` or `neither`.
  - An empty cart is consistent with all three. When more than one reading is consistent, the only accepted answer is `cantTell`.
  - So `cantTell` is accepted **only** for `gone`, and it is never a dodge. That is the study's "can't tell is a right answer."
- **Controls:**
  - each tablet, where tapping reads it aloud for free;
  - under each tablet, a **this one** button (a hand pointing at it);
  - **neither** (both tablets with a cross-wedge);
  - **can't tell** (the pet's shrug over an empty cart).

  That is six inputs, each at least 110 × 110. Tapping a crate opens it for free, as at level 5. Picking is the commit.
- **Misses:** every wrong pick is one **miss**, with a reason:
  - a wrong tablet: "That tablet says twenty-two. The cart has twenty-four.";
  - *neither* when one matches: "Look again. One tablet says twenty-four.";
  - *can't tell* when the cart is there: "The cart is here, so we can count it and tell.";
  - any tablet or *neither* for `gone`: "Nothing is left to count. Nothing here shows which tablet is right."
- **Help:** after the second miss on a case, or on asked-for help, `hints++` once for that case.
  - If the cart is present, the lineup plays against each tablet in turn, with its leftovers glowing.
  - For `gone`, the empty cart glows, and the pet says "Nothing to count. Can we tell?"

  Either way, the next answer is plain.
- **Ending:** on the right answer for `one` and `neither`, the cart's goods line up under the agreeing tablet, or under neither. For `gone`, the pet says "We can't tell. Both tablets could be wrong, and the baskets are gone." The second case's ending finishes the round.

### Levels 4–6: bands and ranges

`school: { min: 3, max: 6 }`. Preschool `{1, 2}` and pre-K `{2, 3}` are unchanged. No `order`, because the ladder is `min..max`. `describeLevel` adds:
- "A ten is a different mark: press big marks for tens and small marks for ones";
- "Check the delivery: short, right or extra, and by how many";
- "Two tablets disagree: which one matches the cart, or can we tell?"

A saved school pin of 3 stays valid. Levels 4–6 are never offered below school.

### Levels 4–6: screen and controls

- **Landscape:** the yard and the cart sit along the top, the tablet(s) centred, and stamps or answer buttons along the bottom right, clear of the pet and the corner buttons. **Portrait** stacks the yard above the tablet above the controls, and on level 6 puts the two tablets side by side, each with its own button below.
- **Planned sizes:**
  - level 4: strips 460 × 120, stamps 140 × 120, Hand in 140 × 110;
  - level 5: verdict buttons 120 × 120, number buttons 110 × 110;
  - level 6: tablets about 300 × 260, each with its button below, and *neither* and *can't tell* at 120 × 120.
- **Fit:** the ones strip's 19 display marks fit in two lines of ten inside 460 units. `tabletLayout` stacks, never shrinks. Loose baskets in the yard are about 50 units and display only.
- **Speech:** `ctx.instruct` per level:
  - "Press a big mark for each ten and a small mark for each one, then hand in the tablet";
  - "Is the cart short, right or extra? Then how many?";
  - "Which tablet matches the cart? Or can we tell?"
- **Spoken counts:** counts up to 32 are passed as numeric slots (as Lasso Loops passes `{n}`), not the 1–6 word table. Device speech says them until V3's slotted clips exist ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).
- **Music:** the game's existing style, unchanged. The ten and the one each have their own pentatonic note.
- **History line (level 4):** at most one new spoken line, printed on the card: "Long ago, scribes by the big rivers used a different mark for ten, so big numbers took fewer marks."
  - It is checked in the building session against the Egyptian and Sumerian numeral pages the study opened, plus a museum or KS2 source.
  - If the check finds it too strong, it becomes "Long ago, people used a different mark for ten."
  - Levels 5–6 add no history claim. The existing line stays on their card note.

### Levels 4–6: accounting

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 4 | each Hand in whose reading is not the count | the glow after the second miss on a tablet, or asked-for help; at most one per tablet | pressing, lifting, reading the tablet, the yard count, opening a crate, an equal longer reading |
| 5 | each committed verdict or number that is wrong | the held lineup after the second miss on a cart, or asked-for help; at most one per cart | choosing a verdict before a number, reading the tablet, opening a crate |
| 6 | each wrong pick (tablet, *neither* or *can't tell*) | the lineup or empty-cart glow after the second miss on a case, or asked-for help; at most one per case | reading a tablet, opening a crate, *can't tell* when it is the answer |

Every round finishes through `ctx.finish({ misses, hints })` for one shell-awarded sticker, with help or without. There is no new save field, journal entry or creation. Adaptation follows the shell: a longer-but-equal level 4 reading is smooth. Assisted completion is not evidence that she reads or checks records on her own.

### Levels 4–6: rule tests

- **Plans (300 seeds per level):**
  - Level 4: the counts are 12–29 and differ. Tablet 1 has 2–9 loose. Tablet 2 has 11–19 loose and 0–1 crates. `crates × 10 + loose === n`.
  - Level 5: `|d| ≤ 3`, at least one `d ≠ 0` per round, and *short*, *right* and *extra* plus each `|d|` from 1 to 3 all occur across seeds. Loose ≤ 9.
  - Level 6: the tablets always differ by 1–3. Each round has one `one` case. `neither` and `gone` both occur, as do both matching sides.
  - The same seed gives the same plan.
- **Marks:**
  - `value` equals `10 × tens + ones` and is independent of press order (every permutation of a mark sequence).
  - `shortest(n)` is the **unique** minimum of `tens + ones` among all `(tens, ones)` with `value === n`, for every `n` from 12 to 29.
  - Every equal reading within the caps (3 tens, 19 ones) is accepted.
  - Presses at a cap change nothing.
- **Level 4 hint:** from every `(tens, ones)` within the caps and every `n`, following the glow reaches `value === n` within `|tens − T| + |ones − O|` steps. It never targets a stamp at its cap. It counts at most one hint per tablet.
- **Level 5:** `verdictFor(t, c)` is `right` iff `t === c`, otherwise `short` or `extra` with `|t − c|`. Every committed pair other than the correct one is one miss. A verdict without a number commits nothing.
- **Level 6:** `readings(case)` has exactly one element for a present cart and three for `gone`. `accepts(case, answer)` is true for exactly one of the four answers in every case. `cantTell` is accepted only for `gone`.
- **Layout:** `tabletLayout` for levels 4–6 at the four views the lands test uses: every input at least 100 units, 19 ones-marks and 3 ten-marks fit, nothing under the pet or the corner buttons, and portrait stacks rather than shrinks.
- **How-to:** the how-to test passes with the level-scoped steps below.

### Levels 4–6: ghost finger, how-to card and voice

- **Ghost finger:** `autotouch()` through the public inputs.
  - Level 4: tap the yard to count, press `T` tens and `O` ones, and Hand in.
  - Level 5: read the plan's verdict and tap it, then its number.
  - Level 6: tap the accepted answer.

  It reads `game.state` and the current layout after every resize, never presses a wrong answer, and never calls finish.
- **How-to steps:**
  - "Press the big stamp for each ten and the small stamp for each one, then hand in the tablet. Tap the yard to count the cart" `{ from: 4, to: 4 }`;
  - "Is the cart short, right or extra? Tap one, then how many" `{ from: 5, to: 5 }`;
  - "Tap the tablet that matches the cart, or neither, or can't tell when the cart is empty" `{ from: 6, to: 6 }`.
- **How-to notes:**
  - Level 4: "Pressing, lifting and counting the yard are never counted; only handing in is. Ten small marks for a ten is right, and the pet shows the shorter way." Plus the level-4 history line.
  - Levels 5–6: "Only an answer counts; a wrong one is a miss and the pet says why. After two misses the goods line up, which counts as one hint."
  - Level 6 adds: "Can't tell is the right answer when nothing is left to count."
- **Voice lines** (`rt.*`, new):
  - `instruct.4`–`instruct.6`, `history.tens`;
  - `read-tablet` (`{tens}`, `{ones}`, `{n}`), `yard-count`, `crate-ten`, `tens.match`, `tens.longer`, `tens.shorter-way`, `tens.wrong`, `tens.help`;
  - `verdict.short`, `verdict.right`, `verdict.extra`, `check.right`, `check.wrong`, `check.help`;
  - `disagree.farm`, `disagree.store`, `disagree.wrong-tablet`, `disagree.wrong-neither`, `disagree.wrong-cant`, `disagree.wrong-gone`, `disagree.gone`, `disagree.cant-tell`, `disagree.help`.

  Count slots are numbers, never free text.
- **Co-play:** keep counter and scribe. At level 6, one person keeps the farm's tablet and the other the storehouse's, and they argue it out before counting the cart.

### Levels 4–6: check tier (for the builds)

Each of levels 4, 5 and 6 brings a new interaction: stamps and strips, verdict-then-number, and a four-way pick. So each batch uses the **new-interaction tier**, not the levels tier:
- typecheck and the rule tests above;
- one scripted `rivertablets` filtered play:
  - river-tablets 2: level 4 with one wrong Hand in and the glow, and level 5 with one wrong number;
  - river-tablets 3: level 6 with a *can't tell* miss and the `gone` case;
- one portrait screenshot of each new screen;
- `fingerdemo` at the batch's top level (5, then 6);
- `npm run build` because voice and how-to change.

Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. **Device checks open at the build:**
- does a six-year-old read a spilled crate as a ten, or press ten small marks every time?
- are the three verdict pictures understood without their spoken names?
- is *can't tell* heard as permission to guess?
- device speech for counts up to 32.

### Levels 4–6: open decisions

Each has a default the builds use; none blocks them.

1. **Ration row.** The study's "each worker gets two bowls" cart quietly adds counting in twos. Default: **omitted** from level 5, which keeps one question (the difference). A later mode can add it after the build.
2. **Yard count at level 4.** Default: free and spoken, so the level is about writing the count, not counting it. The alternative (silent yard) would make level 4 a counting rung.
3. **Neither versus can't tell.** Default: both answers exist, and *can't tell* only when the cart is gone. A deeper case with partial evidence (half the baskets left) waits for someone watching a child find `gone` too easy.
4. **Batches.** Default: levels 4–5 build together (shared marks and lineup), and level 6 builds after them on its own. If the 4–5 batch runs long, level 5 moves into the level 6 batch.
5. **The history line.** Default as above, source-checked in the building session.
