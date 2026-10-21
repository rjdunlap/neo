# Egg Catch deep dive

*ID `egg-catch` · bands lap, toddler, preschool, pre-K, school · levels 1–7 on 2026-10-17 · session `claude/dive-egg-catch` ([PR #517](https://github.com/rjdunlap/neo/pull/517))*

## The game today

Hens on a shelf lay eggs. At first she taps a hen and the egg rolls into a basket; then she slides the basket under slow falls, catches only brown eggs, and from level 4 flips gates so an egg rolls down a tree of chutes to the basket (or, for white eggs, the nest). Missed eggs land in soft hay and hatch, so nothing breaks. Purpose: tracking and hand-eye control, a colour rule, then reading a deterministic route and planning one arrangement for two paths (`skills: tracking, hand-eye, colors, prediction`). Land: the Barnyard (`src/content/lands.ts`). Couch: a team game on the two catching levels (`src/couch/catalog.ts`: preschool band, levels 2–3, both controllers steer one basket).

| Level | Plan (`mode`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Tap a hen; her egg rolls into the basket (`tap`, 5 eggs) | lap, toddler | Which hen to tap; the basket glides under the egg by itself, so nothing can go wrong |
| 2 | Slide the basket under falling eggs (`catch`, 6, 3.6 s fall) | toddler, preschool | Where to hold the basket; one egg in the air at a time |
| 3 | Catch only the brown eggs (`brown`, 5, 3.2 s) | preschool, pre-K | Under the brown one, away from the white one; up to two in the air |
| 4 | Flip the gates so the egg rolls into the basket (`route`, 4) | preschool, pre-K, school | Which of the two gates on the egg's path to flip |
| 5 | Brown to the basket, white to the nest (`sort`, 5) | pre-K, school | Same, with the target set by the shell |
| 6 | The gates are set: tap where the egg will land (`predict`, 5) | school | Read three locked gates and name the bin |
| 7 | Set it once for two eggs (`pair`, 3 pairs) | school | One arrangement of three gates that sends brown to the basket and white (entering the other branch) to the nest, then the green arrow |

Ranges (`LEVELS` in `index.ts`): lap 1, toddler 1–2, preschool 2–4, pre-K 3–5, school 4–7; no `order`, no `entryLevels`. The IDEAS round-two row still reads "6 · 4–6" and proposes 7 *Set it once*; that level is built, so the row is history and now points here.

**Content pools.** Four hens (the duck critter in white with a red comb), two shell colours, one sunset `Backdrop` (horizon 0.72), four hay piles. Catch levels draw a 30-egg seeded stream (`makeEggs`: lanes never repeat twice running, never three whites in a row). Route levels have one fixed board: an entry, gate 0 splitting into gates 1 and 2, four exits (`exitFor`); `targetsFor` moves the basket (and nest) between exits, never the same basket exit twice running. Predict deals gate settings that never land in the same exit twice running; pair deals boards that start unsolved with one solution (`pairBoards`). Voice: 12 `egg.*` lines plus `count`.

**Known gaps** (written down, not fixed; this session changes no code):

- **Fixed (slice 1): levels 4–5 rolled on a clock.** `nextRoute` waits 3.5 s for the first egg and 2 s for the rest, then rolls the egg whether she has decided or not; a gate still wrong when the egg reaches it is a miss (`egg.wrongway`). Gates can be flipped mid-roll, but a preschooler who is still looking loses the egg to time. That is the speed pressure "depth before pressure" excludes, and level 4 sits in the preschool window. Level 7 already solved it with the green arrow.
- **Fixed (slice 2): a missed brown egg on level 2 was nearly silent.** It counts a miss with no line and no boing; the "hint" after two misses only slows the fall 1.4×, with no glow (the brown-egg glow exists only at level 3). The house rule is a boing, a spoken hint and a glow after two misses.
- **Fixed (slice 2): the hens kept laying when nobody plays.** At levels 2–3 eggs spawn on a timer regardless of touch, so a toddler who looks away for ten seconds collects misses that step her down. The round never ends on time, but the miss count does.
- **Level 1's taps go silent while an egg is in the air** (`lay` returns early), and ground taps do nothing. This is the busy-window gap that the [V2 rule](../definitions/visual-identity.md) says to fix in one other tap game only after a person has played the Animal Snack pilot.
- **Level 6 counts a wrong prediction as a miss.** Sink or Float, Chain Reaction's "which bell?" and Light Lab's proposed 7 do not. Egg Catch's case differs (the gates are visible and the answer follows from them), so it is a decision below, not a gap to fix.
- `hatch()` picks the chick's run direction with `Math.random()`, not `ctx.rng`, and the browser suite's `eggs` loop (`BATCH_ONLY=eggs`) stops at level 5, so levels 6–7 are covered only by their rule tests and `fingerdemo`.
- Person checks already open: [DEVICE-CHECKS](../DEVICE-CHECKS.md) lists Egg Catch's physical play (motion slow enough, forgiving catches).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Big Bird's Egg Catch](https://www.atariage.com/2600/manuals_old/big_bird.html) (Atari 2600, Children's Computer Workshop, 1983; manual opened) | Catch under chutes, ages 3–7 | Ten games: Game 1 has two wide chutes and Big Bird *zooms* to the next chute on each press; then straight, zigzag and criss-cross chutes; a golden egg; invisible eggs where you watch the hen stand up to lay; chutes that shrink away | **Zooming between lanes** as a toddler rung before free steering; **watch the hen** as the signal of which lane; criss-crossing chutes as a reading problem | Hens laying faster over time, a broken-egg limit that ends the game, points lost per drop |
| [Kaboom!](https://www.mocagh.org/forsale/kaboom-manual.pdf) (Activision, 1981; [Giant Bomb](https://www.giantbomb.com/games/3030-9094/); both via a search summary, the manual scan OCR-garbled; StrategyWiki refused the fetch) | Paddle catch | Bomb groups that fall faster; a miss costs a bucket and drops you back a group; difficulty switches halve the bucket width | A visible, kind handicap (a wider basket) instead of speed; dropping back a step after a miss is what the adaptive ladder already does gently | Speed as the only progression, lost buckets, explosions |
| [Game & Watch *Egg*](https://www.mariowiki.com/Egg_(Game_%26_Watch)) (Nintendo, 1981; page opened) | Four-position catch | Game A three ramps, Game B four; eggs slide faster; three misses end it; a chick hatches from a broken egg for half a miss while the hen watches | Four fixed positions; the **hatching chick as consolation** (already here, and kinder: no miss count shown) | Misses as lives, speed-up, score thresholds that clear misses |
| [Turing Tumble](https://techcrunch.com/2017/05/30/the-turing-tumble-lets-you-and-your-kids-build-real-mechanical-computers/) (2017; article opened) | Marble computer | A bit flips each time a marble passes (left 0, right 1); gear bits flip together; a book of 51–60 puzzles from simple routing to logic gates | **A gate that flips itself** each time an egg passes: state, predicted over two eggs in a row | Small parts, reading-heavy comic puzzles |
| [Gravity Maze](https://store.smm.org/products/gravity-maze) (ThinkFun; retailer listing via search summary) | Marble-path puzzle cards, 8+ | 60 cards in four tiers; a start and a target are fixed, she places towers so the marble gets there; later cards need towers turned or upside down | One fixed start and target per card, with a hand-made, guaranteed-solvable board | Cards as the only feedback; she checks the solution in the booklet |
| [GraviTrax Junior](https://galaxus.nl/en/s5/product/ravensburger-gravitrax-junior-starter-set-l-jungle-marble-runs-30044758) and Power Switch (Ravensburger; listings via search summary) | Physical marble run | Junior (3+) is free building and watching; switches and triggers that change tracks arrive in sets for 8+ | Watching the run is itself the reward for the youngest; the age split matches this ladder (watch → steer → switch) | Small parts |
| [Pipe Mania / Pipe Dream](https://www.gamesradar.com/pipe-mania-2/) (1989; review via search summary) | Route puzzle | Flow starts on a countdown (recalled); pieces arrive in random order | Nothing beyond "a route is built from parts" | The countdown is exactly the pressure levels 4–5's auto-roll resembles |
| Ball-drop and ramp toys ([a ball-drop toy listing](https://www.safariltd.com/products/the-ball-drop), marketing only) and Plinko-style boards (recalled) | Physical, under 2 | Drop a ball in a hole, watch it come out; then ramps with a choice | The lap joy is cause, disappearance and return; let her start every egg | Small balls (the `offScreen` card already says a ball and a tube) |

**Learning references.** The CDC's 1-year milestones include "puts something in a container" and "looks for things they see you hide" ([CDC](https://www.cdc.gov/ncbddd/actearly/milestones/milestones-1yr.html)), which is what levels 1 and 8 ask. Routing a ball by direction matches NGSS K-PS2-1's "pushing or pulling … can change the speed or direction of its motion" ([CA NGSS](https://www2.cde.ca.gov/cacs/id/web/28972)) only loosely (a gate is a redirection, not a force study), so no science claim is made. The school levels serve CSTA 1A-AP-14, "debug (identify and fix) errors in an algorithm or program that includes sequences and simple loops" ([CSTA K-2 via KIPR](https://www.kipr.org/wp-content/uploads/2020/07/CSTA.pdf)), and the roadmap's [elementary row for Robot Path, Egg Catch and Mail Carrier](../ROADMAP.md#how-familiar-games-keep-growing): repair one wrong command, compare routes, then simple conditions and debugging a visible trace.

## What makes sense here

Every reference grows by speed and loses by limits. Puddle Island keeps the opposite: the fall stays slow, and depth comes from **reading a machine**. The arc across bands is: *start an egg* (lap) → *move under it* (toddler) → *catch by a rule* (preschool) → *set a gate* (preschool to pre-K) → *read a set route* → *plan one arrangement for two eggs* → *repair a wrong run* → *a gate with memory* → *a gate that tests a condition* (school). That is the same egg, chute and basket throughout, which is why it stays one game.

The catching levels should stay few and gentle (two levels, plus a toddler bridge). They are the couch's team game and a real hand-eye skill, but they are the part most like the references' pressure, so they get **fewer misses that are not hers** (hens wait when nobody plays) rather than more variants. The routing levels hold the growth.

**Rework fit.** In the creature world the hens and chicks are Barnyard locals, not collectible creatures. A hatched chick comes from a *missed* egg, so it must never become a collectible or the game would pay her for missing. Any collection or journal hook belongs to *finishing* a round (the basket of eggs hatching into a family, the egg colours a breed lays), and waits on the rework's journal and collection items (decision 5).

## Experience and presentation

- **First unsupported action.** Level 1: tap a hen; she cheers and lays, the egg wobbles down and the basket slides under it. No adult supplies the answer because there is none.
- **Pleasure.** The roll-and-plop: an egg's wobble, a squish into the basket and the count spoken; at the gates, the tick as the egg passes each junction and a star burst at the right bin. The chick hatching in the hay is the funniest moment in the game, which is why it must stay a consolation, not a goal.
- **Touch and consequence.** Gates flip on touch-down with a tick and a note; the basket follows the finger at 900 units a second. The gaps above are where a touch gets nothing (level 1 mid-fall) or a consequence arrives without a decision (levels 4–5's clock).
- **Art/feel example (code-drawn).** Give each of the four hens her own pentatonic note from `src/audio/notes.ts` when she lays (`sfx.pop` with the lane's step), so tapping hens at level 1 plays a little tune, and draw the flip-flop gate at level 11 as the existing purple gate with a small spring coil (two `Graphics` arcs) that bounces when an egg passes and the gate flips.
- **Variety on replay.** Lanes, shells, basket and nest exits, pair boards and (proposed) broken runs and egg colours vary by seed; the rule does not.
- **Reasoning versus motor.** Levels 1–3 are motor and attention; 4 onward is reading and planning, and should demand no timing at all (the clock fix). Nothing needs reading text.
- **Supported ending.** Every level finishes: catch levels keep laying until enough are caught, route levels keep dealing eggs, pair keeps its board for revision. The finished basket hatches into a little line of peeping chicks, a clear stopping point before the celebration (slice 3).
- **Co-play.** Today's tip is "point and say here it comes". A proposed **Pitch and catch** (after Kaboom!'s two-player ports): at levels 2–3 a grown-up's finger on the shelf chooses which hen lays, and the child's finger below steers. The grown-up can make it easy or a gentle game of chase; solo play is unchanged (decision 4). Cost note: steering tracks one `pointer` and honours `palmOnGlass()`, so a second finger needs its own region and pointer handling.
- **Needs a person.** Whether a one-year-old taps a hen on purpose; whether a toddler can drag at all, or only tap a lane (level 8 exists for that answer); whether 3.6 s falls feel slow on a real iPad; whether a preschooler reads gate directions without the auto-roll.

## Proposed ladder

### Fresh content inside existing levels

- **Roll when ready (levels 4–5).** The egg waits at the top until she taps the green arrow, the same button and lines as level 7; gates still work mid-roll, so the late fix stays possible. Removes the clock; misses and hints are unchanged. Bot: flip the gates, then tap the arrow. Rule test: the ghost-finger route test plays with no wait; a route level never rolls an egg before the arrow. (Slice 1, built.)
- **A miss that teaches (levels 2–3) and hens that wait.** A missed brown egg gets a soft boing and a line ("Peep! Slide under the next one"); after two, the lane of the next brown egg glows on the hay while the slower fall continues. Hens lay only while someone is playing: after an egg lands with no touch (or couch input) since it was laid, they settle until the next touch, so a look-away costs nothing. Rule test: a seeded idle run lays at most one egg; a missed-egg pair produces a hint and the glow lane equals the next brown egg's lane. (Slice 2.)
- **Each hen her own note (levels 1–3)**: pentatonic steps by lane. **Egg colours at levels 1–2**: speckled brown and blue-green beside brown, all catchable (no cream: level 3's white shell, `0xfffdf6`, is effectively cream, and a catchable near-white would muddy the one colour rule) (hens of different breeds lay differently coloured shells, a true and simple fact); levels 3, 5 and 7 keep brown and white only, so the rule is unchanged. **The basket hatches** at the end of every level: the caught eggs crack into chicks who line up and peep, then the celebration. Rule test: levels 1–2 streams use only catchable colours, none near the white shell; rule levels use only brown and white. (Slice 3.)
- **Every touch answers at level 1** (gated on [V2's person check](../definitions/visual-identity.md)): a ground tap lays from the nearest hen; a tap while an egg falls makes the tapped hen bob and cluck. (Slice 8.)

### New levels on top

Appended with stable IDs; `order` places 8 and 9 earlier, and `entryLevels: [8, 9]` keeps birthdays and pins safe in bands that do not list them.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **Under the hen** | toddler (order 1, 8, 2) | Four hens; one fluffs up and clucks. A tap anywhere in a lane makes the basket hop there (Big Bird's zoom); when it is under the clucking hen, she lays straight in. 5 eggs | Which lane is the hen's: the move-under idea without continuous steering | A wrong lane: the basket hops there, no egg comes, and the hen clucks "here, under me!"; that counts a miss; after two, her lane glows on the hay | The clucking hen changes lane every egg; a tap resolves to the nearest lane; no egg falls unless the basket is under its hen | New mode in `PLANS`; lane-tap targets 190 wide; one voice line; bot taps the hen's lane; the how-to step |
| 9 | **One gate** | preschool (order 2, 3, 9, 4), pre-K (order 3, 9, 4, 5) | One gate, two exits: the basket on one side, hay on the other. The egg waits; she flips the gate, then taps the arrow. 4 eggs | Which way the one gate points | A wrong way: boing, `egg.wrongway`, the egg hatches; after two misses the gate glows the needed way | The basket side never repeats three times running; one flip always suffices; the hint glows the needed direction | A two-exit board in `geo()`; reuses slice 1's arrow; bot as route |
| 10 | **Fix the run** | school | The pet set the gates and rolled one egg; its path stays drawn as a dotted trace into the hay. She flips one gate and taps the arrow to roll again. 4 boards (brown to the basket, later boards white to the nest) | Which gate made the egg go wrong: debugging a visible trace | A rerun that misses counts one miss and keeps the board; after two, the first junction where the trace leaves the needed path glows | Every dealt board misses; exactly one single-gate flip fixes it, and that gate lies on the trace; the hint gate is it | Trace drawing (a dotted `Graphics` path); one voice line; bot flips the hint gate then the arrow |
| 11 | **Flip-flop gate** | school | The top gate has a spring: it flips itself every time an egg passes. A brown egg then a white egg roll with one setting; brown to the basket, white to the nest | The starting direction of the flip-flop and the two lower gates, knowing the second egg goes the other way | A pair that misses counts one miss, keeps the board; after two, the needed starting directions glow, and the flip after egg one is shown with an arrow | `simulate` with the toggle: dealt boards are unsolved and have exactly one working start; basket and nest are on different branches | Spring gate art; two voice lines; reuses pair's arrow and bot shape |
| 12 | **Sorting gate** (define) | school | A gate with a brown face and a white face reads each shell. Four mixed eggs roll in turn without her touching anything between them; she places the sorter at one junction and sets the plain gates once | Where a condition belongs in the route | To define: a rerun with a miss as in 10 | Every board has exactly one placement and setting that sorts all four | A placement interaction; a definition session first |

### Younger-band openings

Lap keeps level 1 only. Its work is slices 3 and 8 (notes, colours, the hatching basket, every touch answering) rather than a new rung, because level 1 already asks nothing she can get wrong. Level 8 is the toddler bridge; whether lap also lists it waits for a person to watch her tap a lane on purpose (decision 2).

### Easier entries and levels between existing ones

Level 8 sits between 1 and 2 (toddler), level 9 between 3 and 4 (preschool and pre-K), both through `order` and `entryLevels: [8, 9]`. No saved level is renumbered. The school window grows to `order: [4, 5, 6, 7, 10, 11]` (12 after its definition). Preschool and pre-K tops are unchanged.

### Left out on purpose

- Faster falls, more eggs in the air, invisible chutes, shrinking chutes and a golden egg worth points (the references' progression is speed and score).
- Lives, broken eggs or a miss counter on screen.
- Chicks hatched from missed eggs as collectibles or a count.
- A tilt-to-steer basket: motion controls are unreliable for small hands and on a lap.
- Crossing chutes (Big Bird's criss-cross) as a separate level: fixing the run (10) and the flip-flop (11) teach more with the same board.

## Decisions for the developer

1. **Level 6 accounting.** Keep a wrong prediction as a miss (the gates are visible, so it is a deduction) or make it an unpenalized prediction like Sink or Float. Lean: keep the miss; it is reading a deterministic machine, and the hint shows the path.
2. **Lap window for level 8**, after a person watches her tap a lane on purpose. Lean: toddler only until then.
3. **Couch.** Whether level 8's lane hop becomes a couch rung (left/right hops one lane) for a very young player beside a grown-up. Lean: no until it is built and played on touch.
4. **Pitch and catch** two-finger co-play at levels 2–3 (and on the couch, the second controller chooses the hen). Lean: try it on touch first; it is a small mode.
5. **Rework hooks**: a journal entry for egg colours by breed, and whether a finished basket's chicks can visit the creature home. Lean: only at round finish, after the rework's journal and collection items define the shape; never from a missed egg.

Not developer decisions but gates: slice 8 waits on V2's person check; level 12 needs a definition session.

## Build slices, in order

Each slice that adds a level updates `PLANS`, `LEVELS`/`order`/`entryLevels`, `describeLevel`, the how-to card (bounding level-7 lines to `to: 7` where needed), voice lines, the README row, [GAMES.md](../GAMES.md), the `eggs` case in `scripts/browser-check.mjs` and the `fingerdemo` levels.

1. **Roll when ready at levels 4–5** (built). It adds a required arrow tap, so it also changes the level 4–5 how-to steps, the `egg.route` and `egg.sort` lines, the GAMES.md entry and the `eggs` case in `scripts/browser-check.mjs` (which today waits for the egg to roll by itself). Tier: new interaction: typecheck, unit tests (the ghost-finger route test updated), one filtered play (`BROWSER_SUITE=batch BATCH_ONLY=eggs FROM_LEVEL=4 TO_LEVEL=5`) with one wrong way and one hint, one portrait screenshot, `fingerdemo` at 4 and 5.
2. **A miss that teaches and hens that wait at levels 2–3** (built). Tier: typecheck, rule tests, `BATCH_ONLY=eggs FROM_LEVEL=2 TO_LEVEL=3` once; the couch team game is untouched but its `control()` input must count as play (check `BROWSER_SUITE=couchgames` filtered to `egg-catch` once).
3. **Notes, egg colours and the hatching basket** (built; [PR #740](https://github.com/rjdunlap/neo/pull/740)). Tier: content: typecheck, rule tests, one portrait screenshot of level 2 and of the ending.
4. **Level 8, Under the hen** (ready). Tier: new interaction: typecheck, unit tests (difficulty and how-to included), one scripted play of level 8 with a wrong lane and a hint, one portrait screenshot, `fingerdemo` at 8.
5. **Level 9, One gate** (ready). Tier: new level on an existing interaction: rule tests, one browser play of level 9, `fingerdemo` at 9.
6. **Level 10, Fix the run** (ready). Tier: new interaction: unit tests, one scripted play (one miss, one hint), one portrait screenshot, `fingerdemo` at 10. Also extends the `eggs` loop to levels 6–7.
7. **Level 11, Flip-flop gate** (ready, after slice 6). Same tier as slice 6.
8. **Every touch answers at level 1** (after V2's person check). Tier: rule tests, a rapid-tap regression play at level 1, `fingerdemo` at 1.
9. **Define level 12, Sorting gate** (docs only), then decisions 2–5.

## What was built in this session

Slice 1 (roll when ready at levels 4–5) landed 2026-10-20 on `claude/egg-catch-roll-when-ready` (PR #652); the build note is in [the archive](../archive/COMPLETED-2026-10-09.md) and the checks in [VERIFICATION](../archive/VERIFICATION-2026-10-20.md#2026-10-20--egg-catch-roll-when-ready-at-levels-45). The research session itself changed no code. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.

Slice 2 (a miss that teaches and hens that wait, levels 2–3) landed 2026-10-21 on `claude/egg-catch-miss-teaches` ([PR #720](https://github.com/rjdunlap/neo/pull/720)); the build note is in [the archive](../archive/COMPLETED-2026-10-09.md) and the checks in [VERIFICATION](../archive/VERIFICATION-2026-10-21.md#2026-10-21--egg-catch-a-miss-that-teaches-and-hens-that-wait-slice-2).

Slice 3 (notes, egg colours and the hatching basket) built 2026-10-21 on `codex/egg-catch-colours` ([PR #740](https://github.com/rjdunlap/neo/pull/740)); the [build note](../archive/COMPLETED-2026-10-09.md#egg-catch-notes-colours-and-hatching-basket-2026-10-21) and [checks](../VERIFICATION.md#2026-10-21--egg-catch-notes-colours-and-hatching-basket-slice-3) record the content-only scope.
