# Number Trails deep dive

*ID `number-trails` · bands preschool, pre-K · levels 1–3 on 2026-11-06 · session `claude/dive-number-trails` ([PR #1343](https://github.com/rjdunlap/neo/pull/1343))*

## The game today

A firefly sits on the start of a numeral's first stroke. She drags it along a faint trail from a green ring, in the direction of a small arrow; it only moves forward through ordered checkpoints (Letter Trails' `advanceTrace`), and a yellow dot runs ahead to show the way. A numeral of two parts (4, 5, 9) takes two touches. When the numeral is done, that many things come out and are counted aloud: "That is 4 stars!". The learning purpose is writing the numerals 0 to 9 the way they are formed and joining each written numeral to the amount it stands for.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | 1 to 5, then watch that many appear | preschool | Where the trail goes (motor), nothing after it |
| 2 | 0 to 9, then watch that many appear | preschool, pre-K | The same; zero ends with "Zero! There are no ducks." and no things |
| 3 | 0 to 9, then tap to wake that many from a group three bigger | pre-K | Which sleepers to wake; the round ends by itself at the numeral |

`LEVELS`: preschool 1–2, pre-K 2–3. **Content pools:** 10 numerals (`DIGITS` in `digits.ts`: one stroke for 0–3 and 6–8, two for 4, 5 and 9, every stroke starting at the top); 3 things (duck, apple, star, one kind a round, drawn in `index.ts`); one arrangement (rows of at most five, `thingSpots`, 128 units apart with 120-unit tap circles, at most 12 things); 7 voice lines (`nt.start`, `nt.stroke`, `nt.wrong`, `nt.count`, `nt.made`, `nt.zero`, `nt.wake`). Corridor 0.1 of the box at level 1, 0.085 after; the box is `min(view.h − 260, view.w − 360, 520)`. A wandering drag is one miss with a boing and "Come back to the firefly"; the second on one stroke counts one hint and rings the firefly. The sticker is the seed's numeral drawn from `DIGITS`. No couch entry, no journal entries, a ghost-finger bot that traces and wakes.

**Known gaps, read from the code (nothing was played or run).**

1. **The hint adds nothing.** At two wanders the ring goes around the firefly, which is parked at the last checkpoint, exactly where she is already told to go. Letter Trails had the same gap and fixed it in [PR #442](https://github.com/rjdunlap/neo/pull/442): `showTheWay`, `hintDue` and `tuneStep` are exported from `src/games/letter-trails/logic.ts` (the firefly flies the next stretch by itself, leaving dots, and comes back), with trail looks (`pickLook`, `LOOKS`) and a rising tune along the stroke. Number Trails has none of it, so every round is the same teal line and the same silence.
2. **The stroke forms are recorded as interim, but the convention is decided.** `digits.ts` and the [GAMES.md entry](../GAMES.md#number-trails) say the convention is open. The Letter Trails dive records it as [decided 2026-10-23](letter-trails.md#decisions-for-the-developer): Handwriting Without Tears, and a building session checks Number Trails' interim digits against its published chart. No session has. Two things the chart check should settle: 1 starts at (0.3, 0.16) with a lead-in flag, while the search summaries below say HWT starts 1 to 7 in the top-left "starting corner"; and 4 is drawn closed (a diagonal and a bar, then the stem) as one of two common forms.
3. **The sticker is the stroke table.** `sticker()` draws its numeral from `DIGITS`, so a chart fix redraws every saved sticker's numeral (the same as Letter Trails gap 11). Acceptable under the development-save exception; the chart slice says so.
4. **One arrangement.** Things always sit in tidy rows. K.CC.4b's "the number of objects is the same regardless of their arrangement" and K.CC.5's line, array, circle and scatter are never met, and three kinds of thing repeat quickly.
5. **Nothing after the trace asks anything.** Levels 1–2 are watched; level 3 ends by itself at the numeral, so no tap can be wrong (deliberate in the first definition: stopping is a choice). The only misses in any round are wandering drags, so level 3 adapts on the same signal as level 2.
6. **The numeral is always given.** The game goes from numeral to amount only. K.CC.3's other half, "represent a number of objects with a written numeral" (0 for none), the direction a child needs to write down a count, is not played.
7. **The how-to is unbounded above 3.** Its steps use `{ from: 3 }` with no `to` (waking), so any later level of another kind would read false; the howto test only catches "later levels" wording. A slice that adds a level bounds them.
8. **Teen numbers cannot fit.** `MAX_THINGS = 12`, and `thingSpots` returns null (the game throws) when a group does not fit at tap size; portrait holds four across. Ten and more needs a different layout, not a bigger number.
9. **Device speech says the numbers.** `nt.count` is a bare `{n}`; whether iPad speech says "zero" and the single digits clearly, without clips, is unchecked.
10. **No rule covers the instructions' order of play** beyond what `logic.test.ts` holds (draws, group sizes, spots, plural, sticker); the trace itself is covered by Letter Trails' `strokes.test.ts`. Fine for today; each slice below names its tests.

## Similar games

**Opened** means I read the page; **search summary only** means I saw a search result's summary.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| **Handwriting Without Tears** number formation ([LWT](https://www.lwtears.com/node/1539), [the Letter Trails dive's teaching-order sheet](https://legacyd7.lwtears.com/files/HWT-TEACHING-ORDER-PRINT.pdf); **search summary only** for numbers) | classroom programme | "All numbers start at the top"; start, then sequence; the HWT-based handouts start 1 to 7 in the top-left starting corner, 8, 9 and 0 at the top centre or their own spot | The convention already decided; checking each digit against the free chart before encoding | A grade-tied sequence |
| *New Zealand digit formation guide* ([Brookby School PDF](https://www.brookby.school.nz/uploads/1/1/7/5/117534472/digit_formation_guide.pdf), opened but returned no readable text) | school handout | 5 in two parts: down to half height, round, then the top bar | Confirms 5's two strokes and the order the table already uses | — |
| *Montessori sandpaper numerals* ([Montessori Academy](https://montessoriacademy.com.au/material-spotlight-sandpaper-numbers), [Montessori Mom](https://montessorimom.com/lesson-day-107-sandpaper-numerals/), **search summary only**) | classroom material, from about 3 | Trace 0–9 with two fingers in the writing direction while the name is said; then number rods and the spindle box, where zero is an empty compartment | Touch-and-say; zero as an empty container, not a missing round | — |
| *Montessori cards and counters* ([Guidepost](https://www.guidepostmontessori.com/blog/encyclopedia-cards-and-counters), [Rising Tide](https://rising-tide-montessori.squarespace.com/numbers-from-0-to-10/cards-and-counters), **search summary only**) | classroom material | Numeral cards 1–10 laid in order, counters in pairs beneath; a miscount shows as too few or some left over; odd and even read from the pairs later | The pairs arrangement as one of the layouts; self-checking by what is left | Odd and even here (it belongs to a later counting game) |
| *123 Numbers – Count & Tracing* ([App Store](https://apps.apple.com/us/app/id1210356444), **search summary only**) | tablet app | Arrow-guided tracing, a separate tap-to-count game, numbers to 50 | Arrow guides (already here) | Separate minigames that never join the numeral to the count |
| *Writing Wizard* ([App Store](https://apps.apple.com/qa/app/writing-wizard-handwriting/id1305242235), [Reading Rockets](https://readingrockets.org/resources/literacy-apps/writing-wizard), **search summary only**; the Letter Trails dive read its listing too) | tablet app | Letters, numbers and words; "5 Stars" traces one five times with less help each time; 50+ animated trace stickers | Support that fades over tries; a different trail look each round | Star ratings and accuracy scores |
| *LetterSchool* (the [Letter Trails dive](letter-trails.md#similar-games), search summary only) | tablet app | Tap the dots to learn the start, trace, then write from memory; a grown-up picks the style | Start-only as the last support step | Writing from memory scored for accuracy |
| **Island games:** Letter Trails, Fill and Dump, Duck Pond, Puddle Gobble, Bubble Pop | in-house | See "Who owns what" | The tracer and its hint (Letter Trails); count-out checking (Fill and Dump) | Re-teaching counting out here |

**References for the school skill.** Common Core kindergarten ([K.CC, opened](https://www.thecorestandards.org/Math/Content/K/CC/)): K.CC.3 "Write numbers from 0 to 20. Represent a number of objects with a written numeral 0-20 (with 0 representing a count of no objects)"; K.CC.4b "the last number name said tells the number of objects counted. The number of objects is the same regardless of their arrangement"; K.CC.5 "how many?" for up to 20 in a line, array or circle, or 10 scattered. The Head Start ELOF's preschool maths items cover number names, small sets and numbers-to-quantities ([headstart.gov](https://headstart.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five), **search summary only**). **Reversals:** a 2020 study ([Fischer and Luxembourger, Education Sciences](https://hal.univ-lorraine.fr/hal-02950498), **search summary only**) reports Western children's written reversals mostly in 1, 2, 3, 7 and 9, and an NHS therapy page ([Somerset FT](https://www.somersetft.nhs.uk/children-and-young-peoples-therapy-service/letter-and-number-reversals/), **search summary only**) lists 2, 3, 5, 7 and 6 for 9, common up to about 7. Reversal is normal at these ages: it is a reason to trace those digits often, never something to mark wrong. Standards are a reference, not a gate.

## What makes sense here

**Who owns what.** Letter Trails owns letters and the tracer. Fill and Dump 3–4 owns "put in the number asked" with a check, Puddle Gobble (its dive's level 10) owns counting dots, Duck Pond and Bubble Pop own reading a numeral and finding that many. Number Trails owns **writing the numerals** and the **written numeral as the record of a count**, in both directions. So its ladder grows by (a) better support while writing (the hint, fading guides), (b) writing the numeral that tells how many, and later (c) ten and the teens; it does not grow a counting-out check that the other games already have.

**The long arc.** Preschool: the first numerals, one stroke each, then 1 to 5. Pre-K: 0 to 9, wake that many, write how many is here, then the same numeral with less help. School (decision 1): ten in a ten-frame, then the teens as "ten and some more" written 1 then the digit, to K.CC.3's 20. Not here: speed, scores, writing from memory judged for neatness, reversal tests.

## Experience and presentation

- **First unsupported action:** putting a finger on the firefly and pulling; the ring, the arrow and the running dot show the start and the way without a word.
- **Touch and consequence:** the firefly answers on touch-down (a bell); the ink follows behind it. Today the finished numeral simply turns into things. Better (slice 1): the ink takes one of four looks (teal, rainbow, gold glitter, sand, from `LOOKS`), a rising pentatonic tune climbs as the stroke fills (`tuneStep`), and the stuck hint flies the next stretch for her. **Art example:** the finished numeral's ink lifts off as a short line of glowing firefly dots that drift down into the pile area and become the things, one dot per thing, so the numeral visibly *is* that many (a `Graphics` circle per dot tweened with `ctx.tw`; zero's ink fades to an empty basket drawn with `pail` from `src/art/shore.ts`).
- **Variety without changing the rule:** the numeral, the kind of thing (slice 2's larger pool), the arrangement (row, two rows, pairs, ring, scatter), the look and the tune.
- **Reasoning versus precision:** the trace is mostly motor; the corridor is wide and cannot be failed, only wandered from. The reasoning sits after it (which sleepers, how many are here). Nothing is read: the numeral is shown and spoken.
- **Supported ending:** every round ends with the count said aloud and one sticker; wanders and hints never stop a round.
- **Co-play:** one person traces in the air while she traces on the glass; a grown-up counts the things aloud with her. Solo works unchanged.
- **Needs a person:** whether a three-year-old keeps the firefly inside 0.1 of the box in portrait; whether the iPad says "zero" and each digit clearly; whether the flying hint reads as help; whether a dotted and a start-only trail are clear to a four-year-old.

## Proposed ladder

### Fresh content inside existing levels

- **The flying hint, looks and a tune** (all levels; slice 1): port Letter Trails' `showTheWay`/`hintDue`/`tuneStep`/`pickLook`, drawing the look *after* the numeral and the thing so a seed keeps its round. Same miss/hint accounting (one hint at the second wander on a stroke).
- **More things and arrangements** (all levels; slice 2): about eight kinds, reusing `prop()` in `src/art/props.ts` (orange, lemon, pear, balloon) and `shell`, `crab`, `star` in `src/art/shore.ts` beside the duck and apple, each with a plural; and a seeded arrangement among row, two rows, pairs (cards-and-counters) and ring, every spot at least 128 units apart and inside the room at every view. Scatter waits for a seeded non-overlap layout with the same spacing test.
- **The chart check** (slice 3): open HWT's number formation chart and compare each of the ten tables; change only what the chart contradicts, update the `digits.ts` comment and GAMES.md, and note that stickers redraw.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *First numbers* (entry) | preschool, placed first: order 4, 1, 2; `entryLevels: [4]` | Trace 1 (one straight stroke), then watch one duck | Only the trail; draws 1, 2, 3 and 7, the one-stroke numerals | As today | Draws only 1, 2, 3, 7; every one is a single stroke; landing from 4 in pre-K goes to pre-K's first level | `PLANS` row, `LEVELS.preschool.order`, how-to line; `fingerdemo` at 4 |
| 5 | *Write how many* | pre-K, after 3: order 2, 3, 5, 6 | Three apples in a ring; tap each (counted aloud, free, never wrong); three numeral cards appear: 3, its neighbour 2 or 4, and one more (a reversal-prone digit when it fits); she taps 3 and traces it | Which numeral tells how many; zero rounds show an empty basket and the 0 card | A wrong card is one miss: a boing, the pet recounts touching each thing ("one, two, three: three!"); the second miss on the round glows the right card (one hint); counting taps, recounts and the trace's own wanders keep today's rules | The group's size is among the cards exactly once; cards are distinct, 0–9, at least 100 units and apart at every view; the glow names the right card; zero has no things | New phase before the trace (cards via `onTap`); voice lines for "How many?", the recount and the card; bot taps each, then the right card, then traces |
| 6 | *Less help each time* | pre-K | The round's numeral three times: solid trail, then dotted, then only the start ring and arrow | Where the trail goes with less shown | Same corridor and checkpoints every try; one miss per wandering drag and at most one hint per try (the flying hint shows the way even on the start-only try); the things come once at the end | Three tries of one numeral; the corridor is identical across tries; misses capped per try as stated | Outline drawing modes only; shared idea with Letter Trails' planned level 9 *Three times* (build whichever comes first as a helper both can use); `fingerdemo` at 6 |
| 7 | *Ten, and some more* | school (decision 1) | 10: trace 1 then 0 (the 1 slides left as a finished mark), ten things fill a ten-frame; later rounds 11–19 are ten in the frame and some more beside it | Writing a two-digit numeral left to right; seeing ten and some more | As today for each digit | Ten-frame spots inside the room at every view; teen rounds are 10 plus 1–9; digit order left to right | A layout probe first (display-only things may be smaller than tap targets, since nothing is tapped); `MAX_THINGS` and `thingSpots` change; how-to lines; a school band entry |

### Younger-band openings

None. Toddler pre-writing belongs to Draw the Pattern, Rainbow Fingers and Letter Trails' planned Shape Trails; numerals mean little before about three. Level 4 is the gentler preschool start.

### Easier entries and levels between existing ones

Level 4 *First numbers* is the appended easy entry (stable ID 4, preschool `order: [4, 1, 2]`, `entryLevels: [4]`), so a birthday into pre-K lands on pre-K's first level. Levels 5 and 6 are placed after 3 in pre-K's order; no ID is renumbered.

### Left out on purpose

- **"Which one is backwards?"** Reversals are normal to about seven; the game traces those digits more, it never marks a mirror form wrong.
- **A counting-out check after waking** (wake too many and press done): Fill and Dump 3–4 and Duck Pond own it.
- **Odd and even pairs as a question:** a later counting game; here pairs are only an arrangement.
- **Writing from memory judged for shape, speed or neatness.**
- **Numbers past 20, or number lines:** Frog Hop and Bubble Pop own counting on.

## Decisions for the developer

1. **A school window.** Lean: open school at level 7 (*Ten, and some more*) after a layout probe, school 5–7; or keep Number Trails pre-K and leave teens to another game.
2. **Journal entries for the numerals.** Lean: ten entries `number-trails:0`–`9`, filed when the numeral was traced and its things shown (Letter Trails did the same for letters), journal total +10; or none.

## Build slices, in order

Each is sized for one session. A slice that adds a level is built in level order, extends `PLANS`, `LEVELS` (with `order`/`entryLevels` where stated), `describeLevel`, bounded how-to `LevelLine`s, the README row and [GAMES.md](../GAMES.md).

1. **The flying hint, looks and a rising tune** (ready). Reuse Letter Trails' exported helpers; draw the look after the numeral and the thing. Tier: typecheck, rule tests (hint due at the second wander, the shown stretch moves forward, a seed's numeral unchanged by the look), `fingerdemo` at 1 and 3.
2. **More things and arrangements** (ready). Tier: typecheck, rule tests (every kind has a plural and fits its 120-unit circle; every arrangement at every supported view keeps 128-unit gaps inside the room), one portrait screenshot of a ring of nine.
3. **Check the digits against the HWT chart** (ready once the chart is opened; decided 2026-10-23). Tier: `digits.test.ts`, `fingerdemo` at 2; note sticker redraws.
4. **Level 4, *First numbers*** (ready). Tier: typecheck, rule tests (draws, order, landing), browser play of 4 and `fingerdemo` at 4.
5. **Level 5, *Write how many*** (ready; a new interaction). Tier: typecheck, unit tests, one scripted play (a ring of three, one wrong card, the glow, zero), one portrait screenshot.
6. **Level 6, *Less help each time*** (ready; coordinate with Letter Trails level 9 if in flight). Tier: rule tests, one play of three tries with one wander, `fingerdemo` at 6, one screenshot of the dotted try.
7. **Level 7, *Ten, and some more*** (decision 1, then a layout probe).
8. **Journal entries** (decision 2).

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
