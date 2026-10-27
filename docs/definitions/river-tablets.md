# River Tablets, levels 1–3 (definition)

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
