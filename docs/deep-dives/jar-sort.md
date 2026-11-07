# Jar Sort deep dive

*ID `jar-sort` · bands preschool, pre-K, school · levels 1–8 on 2026-11-07 · session `claude/dive-jar-sort` ([PR #1361](https://github.com/rjdunlap/neo/pull/1361))*

## The game today

She taps a jar to lift its top fruit and taps another jar to drop it, or drags it across. A fruit may go onto the same fruit or into an empty jar with room, one piece per move (the ball-sort rule). A full jar of one kind gets a lid, and a finished board turns to jam and slides off. The learning purpose is **spatial planning in stacking order**: only the top piece moves, a spare jar is a place to park, and the later boards need a move that looks worse before it gets better. Built 2026-10-20 ([PR #651](https://github.com/rjdunlap/neo/pull/651)) from its [definition](../definitions/jar-sort.md); it lives in Puzzle Peaks (`region: 'puzzle-peaks'`, not the definition's Rainbow Meadow default).

| Level | Plan name (`describeLevel`) | Bands | Board (jars × capacity, kinds, par) | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Two kinds, two jars to fill | preschool | 3 × 2, 2 kinds, par 2–3; lit jars | Which top fruit to move first; the lit jars show where it fits |
| 2 | Two kinds, taller jars | preschool, pre-K | 3 × 3, 2 kinds, par 3–5; lit jars | The same with three in a jar, so one piece has to be dug out |
| 3 | Three kinds, one spare jar | preschool, pre-K | 4 × 3, 3 kinds, par 4–7 | Where to park while digging; no lit jars from here |
| 4 | Three kinds, two spare jars | pre-K, school | 5 × 4, 3 kinds, par 6–9 | Which of two parking places keeps both useful |
| 5 | Four kinds | pre-K, school | 6 × 4, 4 kinds, par 9–13, one board | Order of four digs |
| 6 | Four kinds, one spare jar: plan ahead | school | 5 × 4, 4 kinds, par 10–15 | A board the obvious same-kind-first player cannot finish (`greedy` fails) |
| 7 | Five kinds | school | 7 × 4, 5 kinds, par 12–18, two rows | Order across seven jars |
| 8 | Every fruit has its jar | school | 6 × 4, 4 kinds on picture mats, par 10–16 | Each kind must end on its own mat; a full jar of the wrong fruit waits for its lid |

`LEVELS` is `{ preschool: 1–3, prek: 2–5, school: 4–8 }`, with no `order` or `entryLevels`. A round is two boards at levels 1–4 and one board from 5.

**Content pools.** Boards are frozen and solver-checked in `puzzles.ts`: level 1 is four authored pairs (seed picks one); levels 2–8 hold 20 boards each. `present` renames the kinds from seven fruits (renamed at level 1 too, jar order kept) and shuffles jar order from the seed elsewhere, which keeps par. Seven fruits (strawberry, blueberry, orange, pear, plum, cherries, lemon) with distinct silhouettes; one glass jar drawing; jam colours per fruit. A code-drawn pantry backdrop in three seeded looks with lid colours red, blue, purple (slice 1). Music `STYLES.paint`; each fruit lands on its own marimba step.

**Accounting.** A refused move (full, or a different fruit on top) springs back with a boing and a spoken reason ("Pear goes on pear, or in an empty jar."). It is free at levels 1–2 (`lit`) and one miss from level 3; every second miss on a board lights the hint move's two jars (one hint). After `max(8, 2 × par)` legal moves since the last hint, the hint lights too. The hint is a breadth-first search capped at 200,000 states, falling back to "take some back" on the round arrow. A dead end ("Stuck! Let's take one back.") is never a miss or a hint. Undo is free and unlimited; legal wandering, set-downs and undo never count.

**Known gaps.**
- Closed by slice 1 (2026-11-07, PR #1365): level 1 now has four authored pairs and every round has one of three pantry looks and seven fruits.
- The step from level 2 to 3 changes three things at once for pre-K and preschool: a third kind, a spare jar to plan with, and the end of lit jars together with refusals becoming misses.
- The sticker's fruit is from the seed, not from the round.
- Capacity is one number per level (`plan.cap`); every jar on a board is the same height, so "where to park" is never "which smaller place".
- Layout: two rows fit up to six jars a row at capacity 4 on the 1024 × 768 upright view; capacity 5 in two rows would not fit (`2 × 296 + 40 + 120 > 728`). Any taller-jar level needs a layout probe first.
- No couch entry (definition decision 6: later) and no journal coupling.
- Person checks open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): fruit legibility at capacity 4, whether a preschooler reads lit jars, whether undo is found unprompted. Nothing in [OBSERVATIONS](../OBSERVATIONS.md).

**Browser coverage.** `jarsort` (`scripts/browser/suites/jar-sort-play.mjs`): level 1's authored boards (a free refused move, a ground set-down), level 3 (two refused moves light one hint, a drag, undo), a level 7 upright screenshot, level 8 mats solved by taps.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Water Sort and Ball Sort apps (the definition's [Water Sort Color Pouring Game](https://apps.apple.com/us/app/id1571446860) and [Water Bottle Sort](https://apps.apple.com/us/app/-/id1644091216)) | Tube sort | More colours, more tubes, fewer spares; the water rule pours a whole same-colour run | A level where a move carries the whole run on top (fewer moves, planning in groups) | Limited undos, bought or earned extra tubes, ads, stars, move counters |
| [Ball Sort: Color Puzzle Master](https://apps.apple.com/us/app/id6445972302) | Ball sort | Tubes of different capacity (one to seven) and "mystery" question-mark balls | A small spare jar on a board of tall ones: parking with less room | Question-mark balls (see Left out); 17+ rating and in-app purchases |
| [Mega Sort](https://apps.apple.com/us/app/id1551197535) and [Ball sort! magic sorting](https://apps.apple.com/us/app/ball-sort-magic-sorting-game/id6749308119) | Ball sort | Hidden balls revealed as they reach the top; covered tubes | Nothing directly; it confirms the hidden-piece staple is a genre habit, not a planning step | Hidden pieces, covers, levels gated behind each other |
| Tower of Hanoi (wooden ring sets such as [Jaques' Tower of Hanoi](https://jaqueslondon.co.uk/products/lets-play-tower-of-hanoi); the definition's preschool studies via [Voelter and Call 2014](https://research-repository.st-andrews.ac.uk/bitstream/10023/8634/1/Voelter_and_Call_2014_Cognition_AM.pdf)) | Physical stacking puzzle | More rings; the rule (no big on small) never changes | Already the root of the top-only rule; boards stay short at preschool | Ring counts that make the solution long and rote |
| Tower of London (Shallice 1982; [Millisecond's task notes](https://www.millisecond.com/library/toweroflondon)) | Planning task | Three balls on pegs of height 3, 2 and 1; harder problems come from a different start and **goal picture**, needing more moves | A level where a picture card shows how the cups should end, any fruit on any fruit, pegs of different height | Timing planning, scoring by move count, "test" framing |
| Rush Hour Jr. through [Ferry Jam](../GAMES.md#ferry-jam) | Sliding planning | Frozen solver-checked cards, longer pars | Frozen boards, free undo, wander-triggered hint (already used) | — |
| Montessori colour sorting into bowls, and the definition's off-screen cups-and-pom-poms | Physical sort | Free sorting first, then rules | The off-screen suggestion stays | — |

The Tower of London is a standard child planning measure from about age 4 (Krikorian, Bartok and Gay 1994; Anderson, Anderson and Lajoie 1996, both cited in the task notes above): difficulty rises with the moves a goal needs and with goal moves that must be made out of order. That gives a principled ladder for a goal-picture level, sized like Jar Sort's pars. It is not a learning standard; nothing here claims an attention or school benefit.

## What makes sense here

- **Variety first, at no cost to the rule.** A fresh look, two more fruits in the naming pool and more level 1 boards make repeats feel new without changing a single par.
- **A softer bridge for the youngest.** A new easier level between 2 and 3 adds the third kind and the spare jar while the lit jars and free refusals stay, so only one thing changes at each step. It goes in the preschool and pre-K windows by `order`.
- **New kinds of planning on top, not more of the same.** Seven jars at capacity 4 is already the school top; adding kinds or rows is clutter. Three new modes each ask a different planning question: *which smaller place* (a little jar), *build a picture in order* (a goal card, the Tower of London), and *move in groups* (a scoop that carries the whole run).
- **Long arc.** Preschool: two kinds with lit jars, then the bridge. Pre-K: spare jars and four kinds. School: plan ahead, mats, a little jar, the goal picture and the scoop. Couch play stays later (definition decision 6).

## Experience and presentation

- **First unsupported action.** Level 1's first board is two moves; the lit jars show where the lifted fruit can go, so a three-year-old can finish without a grown-up naming the move.
- **Touch and consequence.** Touch-down lifts the fruit 30 units at once; the hop is a short arc and lands on its own marimba step, so a sorted jar plays one repeated note. A full one-kind jar gets a bell and a lid. A refused move shakes the target jar and says why.
- **Variety on replay.** Seeded renaming and jar order already vary boards; slice 1 adds a kitchen shelf and window backdrop in three seeded looks and two more fruits in the pool, so a level 3 board can be pears, cherries and lemons.
- **Reasoning, not motor precision.** Hit boxes are 120 wide over 104-unit jars; drag is optional. Reading is never needed: refusal reasons and mats are spoken and pictured. The goal card (level 11) is a picture, not words.
- **Supported ending.** Every board can be finished with the hint or the round arrow; one sticker per round with help. A one-board round from level 5 keeps stopping points short.
- **Co-play.** The existing hint ("One of you says which fruit to move, and the other moves it") suits the goal card best: one reads the picture, the other digs.
- **Art and feel example.** The backdrop is a code-drawn pantry: a wooden shelf (`wood` from the palette) under a window whose pane changes with the look (morning sun disc, rain streaks drawn as short teal lines, a warm evening lamp circle), with a striped cloth under the jars. Lids take one of three palette colours from the look. No new rendering system.
- **Needs a person.** Whether the bridge level is the right step for a 3–4-year-old; whether a small jar reads as "holds less" before she is told; whether a goal card is read as the target rather than a decoration.

## Proposed ladder

### Fresh content inside existing levels

- **Two more fruits:** cherries (a pair on joined stems, red with a dark line, so not a strawberry) and a lemon (pointed oval, yellow). `present` renames from a pool of seven instead of five; kinds on screen stay at most five per board. New refusal and wrong-jar lines for the two fruits; jam colours for each.
- **More level 1 boards:** three more authored pairs, each still two moves then three; the seed picks a pair, so level 1 still opens with a two-move board.
- **A pantry backdrop** with three seeded looks (morning, rain, evening) and look-coloured lids.
- **More boards** per level 2–8 from the same seeded deal (14 → 20), filtered as before.

A rule test asserts: every name pool rename keeps par; each new authored level 1 pair has par 2 then 3; every fruit has refusal and wrong-jar voice lines; new boards pass the level's existing filters (par range, `greedy` fails at level 6, mats solvable at 8).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Three kinds, bright jars | preschool and pre-K, placed between 2 and 3 by `order` | 4 jars × 3, three kinds, one spare; par 4–6; two boards | Where to park while digging, with lit jars still showing where a fruit fits | As levels 1–2: refusals free, lit jars; wander hint after `max(8, 2 × par)` | Every board solvable within par 4–6; `lit` is true; preschool order `[1, 2, 9, 3]`, pre-K `[2, 9, 3, 4, 5]`; levels 1–8 boards unchanged | Plan row, 14 boards, `order` in `LEVELS`, how-to card line for "bright jars" widened to 9; bot unchanged |
| 10 | A little jar to park in | school | Four tall jars (capacity 4) of three kinds plus one little jar of capacity 2; par 8–12 | Which two fruit the little jar should hold, and when | Refused "full" on the little jar says "The little jar holds two." One miss, every second lights the hint, as from level 3 | Every board solvable; every shortest solution uses the little jar; `legal` and `solved` respect per-jar capacity; a solved board leaves the little jar empty (each kind fills a tall jar) | Model change: `cap` becomes per-jar `caps` (default all equal, so levels 1–9 are unchanged); `canonical` keys capacity; layout bases jars of mixed height on one line; one voice line |
| 11 | Like the picture | school | Three cups of height 3, 2 and 1 holding three fruit; a picture card above shows how they should end; par 2–5, two boards | The order to move fruit so each cup matches the card, any fruit on any fruit | Only "full" refusals; one miss each; a match lights each finished cup; hint glows the next move toward the card; a wander hint as elsewhere | Every start/goal pair solvable within par; goals are never the start; boards include ones where a goal fruit must be placed out of bottom-up order (par 4–5); the ball rule is off only on this level | New interaction (goal card, any-on-any rule): `rule: 'any'` and `goal` on the plan; solver keyed on the goal; card drawn from `fruitArt` at half size; two voice lines (instruct, cup done); bot follows the solver |
| 12 | Scoop the run | school | Five jars × 4, four kinds, one spare; a move carries every same fruit on top, as many as fit; par 6–10 | Building runs so a single scoop moves several at once | As from level 3; refusal reasons unchanged; the hint glows the next scoop | Every board solvable under the scoop rule; a scoop never moves more than the target's room; scoop par is at most ball par for each board; levels 1–11 unchanged | Model change: `rule: 'scoop'` in `move` and the solver; pieces hop one after another; one voice line in the instruction |

### Younger-band openings

None. A toddler cannot yet hold a "lift, then choose" plan, and dropping each fruit by kind is Critter Sort and Shape Sorter's ground. Left at preschool.

### Easier entries and levels between existing ones

Level 9 is the between-level, appended with a stable ID and placed by `order`. No `entryLevels` change: preschool still enters at 1 and pre-K at 2. Decided here by the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules): level 11 stays school only; a pre-K placement waits for a person watching a five-year-old with it.

### Left out on purpose

- **Hidden or question-mark pieces.** They make the move a guess instead of a plan, and the solver's hint would know what she cannot see.
- **More kinds, rows or capacity 5.** Clutter and a layout that does not fit the upright view.
- **Move counters, stars, par shown to her, limited undos.** Pressure; the genre's monetized parts.
- **Fill and Dump's *Two jugs*** stays there (definition decision 5).

## Decisions for the developer

None new. Couch play stays "later" as decided on 2026-10-23.

## Build slices, in order

1. **Built 2026-11-07 (PR #1365).** **Fresh content: pantry looks, two more fruits, more level 1 boards and more boards** (preschool to school; typecheck, rule tests, one filtered `jarsort` play at level 3 with one portrait screenshot in the rain look, build because voice lines change; no `fingerdemo`).
2. **Level 9 *Three kinds, bright jars*** placed between 2 and 3 (new level on the existing interaction: typecheck, rule and registry/how-to tests, one browser play of 9, `fingerdemo` at 9, build).
3. **Level 10 *A little jar to park in*** (model change on the existing interaction: typecheck, rule tests with levels 1–9 unchanged, one browser play of 10 with one refused move on the little jar, `fingerdemo` at 10, build).
4. **Level 11 *Like the picture*** (new interaction: typecheck, unit tests, one scripted play with one refused move and one hint, one portrait screenshot, `fingerdemo` at 11, build).
5. **Level 12 *Scoop the run*** (model change on the existing interaction: typecheck, rule tests, one browser play of 12, `fingerdemo` at 12, build).

## What was built in this session

Research and ideation (PR #1361). **Slice 1 built 2026-11-07 (PR #1365):** a code-drawn pantry backdrop (window pane per look: morning sun, rain, evening lamp; shelf with striped cloth under each row) in three seeded looks with lid colours red, blue, purple (`LOOKS`, `LID_COLOR` in `logic.ts`); cherries and lemon (`FRUITS` now 7, board kinds still at most five; jam pink and yellow; marimba steps 6 and 10; four new voice lines, not rendered, so device speech); level 1 is four authored pairs picked by seed (level 1 renames fruit but keeps jar order; pairs differ in where fruit stand, since a 3×2 two-kind board has only two puzzles of each length); levels 2–8 hold 20 solver-checked boards each. Sticker unchanged. Checks in [VERIFICATION](../VERIFICATION.md).
