# Puddle Gobble deep dive

*ID `puddle-gobble` · bands toddler, preschool, pre-K, school · levels 1–9 on 2026-11-07 · session `claude/dive-puddle-gobble` ([PR #1342](https://github.com/rjdunlap/neo/pull/1342))*

## The game today

A smiling rain puddle sits on the beach. She leads it with a finger (a drag, or a tap where it should go; the whole screen steers) and it soaks up whatever fits inside it, growing as it goes, so what fits depends on what she has already soaked. The learning purpose is **size comparison against a moving reference**, then seriation, then comparing and adding numbers, and at the top an exact total that needs planning and undo. Built 2026-10-21 from its [definition](../definitions/puddle-gobble.md) ([PR #687](https://github.com/rjdunlap/neo/pull/687)); home land Bubble Beach (14 games).

| Level | Plan name | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Soak it up | toddler | where to lead the puddle; everything fits, no growth |
| 2 | Too big yet | toddler, preschool | the toy boat waits until two soaks have grown the puddle |
| 3 | Bigger and bigger | preschool, pre-K | two growth steps: the tier-3 thing needs four soaks first |
| 4 | Count to grow | preschool, pre-K | a three-drop meter; the tier-3 thing is the last that can go |
| 5 | Smallest first | pre-K, school | a stated order: five pictured things, tiers 1–4, smallest first (a bigger one aimed while a smaller is out is a miss) |
| 6 | Bigger number | pre-K, school | numerals 1–10 on alike pebbles; the puddle gains 1 per soak |
| 7 | Add to grow | school | numerals 1–20; the puddle gains each number, a sum strip along the top |
| 8 | Just right | school | land exactly on the pail's number (12–20); an overshoot is refused (a miss when aimed); a strip token lets a thing go, free |
| 9 | Smallest number first | school | a stated order on numerals: six distinct numbers 1–20 on pebbles, shells, starfish, sea glass or buttons, soaked smallest to biggest; the puddle is 20 and never grows (a bigger number aimed while a smaller is left is a miss) |
| 10 | Count the dots | pre-K, school | five distinct numbers 1–6 with a die-style dot card under each numeral and a dot card on the puddle (starts at 2, +1 per soak); a too-big touch is never a miss, and a glow after two too-big tries counts one hint |
| 11 | Too full | school | every thing starts in the puddle (authored: 24 against a pail of 14); tap strip tokens to let go (free) until the puddle is exactly the pail's number; going under is allowed, a soak back past the pail is an aimed miss |

`BandLevels`: toddler 1–2, preschool 2–4, pre-K 3–10 with `order` [3,4,5,10,6], school 5–11 with `order` [5,10,6,7,8,9,11]; no other `order`, no `entryLevels`, no lap or grown-up range.

**Content pools.** Seventeen code-drawn kinds by tier (`KINDS_BY_TIER` in `logic.ts`, art in `art.ts`): tier 1 shell, pebble, leaf, feather; tier 2 pinecone, toy boat, seaweed, starfish; tier 3 beach ball, driftwood stick, bucket, sun hat, sand spade; tier 4 floaty ring, kite, closed beach umbrella, rolled towel. Numbered levels draw pebbles, shells, starfish, sea glass and buttons (`NUMBER_KINDS`, all at tier 2's size). Each round takes one of three seeded beach moods (`moodFor`: morning, midday, evening; drawn from a separate RNG stream after the board and layout, so a seed's board never changes; each level's authored first round stays midday). Boards are seeded from each plan and kept only if they pass its filter (50 tries, then the authored board, which a test shows is never needed); each level's first round is authored once per session. Morning has a pale sky, teal sea and mist along the water; evening a purple-to-orange sky, purple sea, a low half sun with glints and a warm sheen on the sand. No host friend is drawn (the finish line is "Thank you! The beach is clean.").

**Known gaps.** Levels 8 and 11 are the exact-total levels and the ladder stops at 11 for school (six to eight); the second pail is defined ([level 12 *Two pails*](../definitions/puddle-gobble-two-pails.md)) but not built (slice 6). Pre-K now meets dot cards at level 10 before bare numerals at 6. No lap entry. Nothing is saved, nothing goes into the journal, no couch play. Device checks open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): tap-to-lead for a toddler, tier 1 versus tier 2 with dots on an iPad, and whether "Too big yet" while steering feels like a scold.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Hole.io](https://appsamurai.com/blog/mobile-app-success-story-hole-io/) (Voodoo, 2018) | grow-by-swallowing arcade | bigger city objects become reachable as the hole grows; new cities | the visible "now it fits" moment | two-minute matches, rival holes, swallowing people and buildings |
| [Donut County](https://store.epicgames.com/p/donut-county) (Ben Esposito, 2018) | authored puzzle levels around one growing hole | each level adds one twist (catapult things out, fire, water) and ends on its biggest object | one new twist per level on a fixed mechanic; things that come back out (our let-go) | swallowing friends' homes |
| [Katamari Damacy](https://en.wikipedia.org/wiki/Katamari_Damacy) (Namco, 2004) | grow-by-rolling | stages raise the target size; small things stick, big ones are hurdles until you grow | the moving threshold; different stage *places* with the same rule | the timer and collisions that knock things off |
| Feeding Frenzy (PopCap, 2004; recalled) | eat-smaller-to-grow | new seas and fish | "smaller than you" as the rule | being eaten; lives |
| [DragonBox Numbers](https://www.commonsensemedia.org/app-reviews/dragonbox-numbers) (Kahoot! DragonBox) | number characters that eat and split | Nooms combine (3 eats 5 and becomes 8) and slice apart; puzzle, ladder and sandbox modes | the number *is* the body: adding is growing, letting go is taking apart; a free sandbox mode beside the puzzles | subscription, parent-report upsell |
| [Osmo Numbers](https://playosmo.zendesk.com/hc/en-us/articles/115010324547-What-is-the-Osmo-Numbers-game) (Tangible Play) | tiles summed to pop bubbles | dots first, numerals later; add by more tiles, subtract by removing; ages 3–10 | **dots before numerals** for the youngest numbered level; removing to subtract | the timed bubble pops |
| [Shut the Box](https://en.wikipedia.org/wiki/Shut_the_box) (traditional) | exact-sum tile game | close tiles that sum to the roll; choosing which tiles matters for later rolls | several ways to make a total, and a choice now that spoils a later total (our level 8 dead end) | the dice luck and the score as loss |
| Montessori [Pink Tower](https://montessoriacademy.com.au/montessori-at-home/toddler-resources/montessori-pink-tower/) and nesting cups | physical seriation | from a few widely spaced sizes to ten close ones | ordering widely spaced sizes before close ones | — |

**Learning references.** Common Core [K.MD.A.2](https://www.thecorestandards.org/Math/Content/K/MD/) (compare two objects, "more of"/"less of") and [1.MD.A.1](https://www.thecorestandards.org/Math/Content/1/MD/) (order three objects by length) for levels 1–5; [K.CC.C.7](https://www.thecorestandards.org/Math/Content/K/CC/) (compare two numerals 1–10) for level 6; [1.OA.C.6](https://www.thecorestandards.org/Math/Content/1/OA/) (add and subtract within 20, making ten, relating addition and subtraction) for 7–8 and the proposed "too full" level; [2.NBT.A.4](https://www.thecorestandards.org/Math/Content/2/NBT/) (compare numbers) for ordering numerals to 20. The Stanford pre-K seriation summary cited in the definition still sets the pace: a few widely spaced sizes before many close ones.

## What makes sense here

The game's one action, steering a body whose size is a number, carries two directions it does not yet use: **ordering numbers** (seriation moved from pictures to numerals, the natural partner of level 5) and **taking away** (the puddle too full, letting things go until it is just right, the subtraction side of level 8). Both reuse what is built: `order` mode's refusal and hint already work for any `size`, and `letGo` plus `hintTarget`'s let-go search already solve a board that starts full. A dot-card numbered level gives pre-K the Osmo-style bridge from tiers with dots to bare numerals. Fresh kinds and a few beach moods fix the most visible repetition without touching rules.

Left for decisions or later definitions: a lap entry (decision 1 of the definition left it out), a doubling rain cloud (multiplication is outside the game's skills), two pails in one round (planning across two totals; probed and defined as level 12, not yet built), and filing the tidy row in the journal. The long arc: toddler soaks and sees "too big yet" turn into "fits now"; preschool and pre-K count growth and order sizes, then meet numbers through dots; school compares, orders, adds and takes away within 20, ending on planning an exact total from either side.

## Experience and presentation

- **First unsupported action:** touching the sand anywhere; the puddle glides there and the nearest shell slides in with a plop. No adult has to give an answer.
- **Pleasure and feedback:** touch-down draws the fading destination ring at once; a soak is a 0.35 s slide with a pentatonic plop (bigger things sing lower); a growth step swells the body and empties the drop meter; a too-big thing wobbles on top of the water and re-arms 30 units away, so steering back and forth never nags.
- **Variety without changing the rule:** new kinds per tier and a seeded beach mood (morning mist, midday, pink evening: backdrop tint, a low sun, wet-sand sheen) change what a replay looks like; the plan filter, not the art, decides solvability.
- **Reasoning versus precision:** the decisions are *which thing next* and, at 8 and 11, *which set*; contact is a whole-puddle overlap, at least 100 units, with no aiming precision. Numerals are read aloud on touch, so the numbered levels are not reading tests; the dot level makes count-to-compare possible without numeral knowledge.
- **Supported ending and replay:** the glow after two too-big tries or misses, "Show a hint" on the pause sheet, the free let-go; every board finishes, every finish washes the things into the smallest-to-biggest row. Replay is a fresh seeded beach.
- **Co-play:** one steers, the other names the next target ("Can it soak the ball yet?"); at the exact-total levels, one says the number they need and the other finds it. Solo stays the default.
- **Art and feel example:** a *pink evening* mood is a `Backdrop` tint plus one code-drawn half sun on the horizon and a 20 % warmer `WET_SAND` sheen under the puddle's trail; the puddle's body picks up a faint pink rim stroke. All `Graphics`, palette colors, no new texture.
- **Needs a person or device:** whether a toddler finds tap-to-lead; whether dot cards and numerals read on an iPad at tier-2 size; whether "too full" (letting things go) reads as subtraction or as undoing a mistake; whether five-year-olds enjoy level 5's order or find it a scold.

## Proposed ladder

### Fresh content inside existing levels

- **More kinds** so every tier has at least four: tier 3 adds a sun hat and a sand spade; tier 4 adds a beach umbrella (closed) and a rolled towel. Numbered levels add sea glass and a button to `NUMBER_KINDS` (drawn at tier 2's size, numeral badge as now). Never a critter, a friend's home or a friend's belonging, as the definition rules. Each gets a `NAMES` entry for "The {thing} is smaller."
- **Beach moods:** morning, midday, evening, seeded per round; the authored first round stays midday.
- Rule tests: every tier has at least four kinds; every kind has a name; `thingArt` draws every kind at 70–220 without throwing; level-5 boards over 500 seeds show at least three different tier-4 kinds; the mood is seeded and leaves the board unchanged.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | *Smallest number first* | school (after 8; school 5–9) | puddle `P` = 20, no growth; six pebbles 3, 8, 11, 14, 17, 19 | soak numerals in order, smallest to biggest, within 20 | aiming at a bigger number while a smaller is still out: a miss (aimed, as level 5), a boing and "{v} is smaller. Soak it first."; the glow after two misses names the smallest left | every value fits from the start; values distinct; the only refusals are `order`; the hint is always the smallest left; filter over 500 seeds never falls back | `order` mode with numerals (a `numeric` flag on the plan rather than a new mode); one new voice line (`gobble.smaller-first-number`) and an instruction (`gobble.instruct-order-number`); bot unchanged (it follows `hintTarget`); how-to step scoped 9–9 |
| 10 | *Count the dots* | pre-K (placed between 5 and 6 by `order`), school | `P` = 2, `+1` per soak; five pebbles 1, 2, 3, 4, 6 with dots under each numeral; the puddle shows its dots too | compare by counting dots or by numeral, soak what is not more than the puddle | a too-big touch is never a miss (as 6); "{v}. The puddle is {p}: too big yet."; glow after two too-big tries, counting one hint from this level as at 4 | values distinct within 1–6; at least two too big at the start; greedy clears; dots shown equal the value; the puddle's dots equal `P` | dot card under the badge (reuse `tierDots` at a fixed small size); a `dots` flag on the plan; pre-K `order` becomes 3, 4, 5, 10, 6; school `order` 5, 10, 6, 7, 8, 9 (school can meet it once, cheap); no new voice; bot unchanged |
| 11 | *Too full* | school (school 5–11) | the puddle already holds 4, 9, 3, 6 (sum strip shows 2 + 4 + 9 + 3 + 6 = 24 from a start of 2); the pail says 14; the sand is empty (letting go 4 and 6 makes 14; no single let-go does) | which things to let go so what stays makes exactly the pail's number | letting go is free and never a miss; going under the pail is not refused: the line says "Now the puddle is {p}. The pail wants {t}." and she can soak a thing back (an overshoot on re-soak is refused as at 8); the glow points at a strip token to let go | at least one subset of held things whose removal makes the pail; no single let-go solves it (two or more); `hintTarget` reaches the pail within six steps from every reachable state; start total ≤ 40 | `Board` gains `held` (ids soaked at the start; `startState` puts them in `soaked`); the hint already searches let-go subsets; strip of up to six 100-unit tokens checked at four views; instruction line `gobble.instruct-too-full`; bot taps tokens as at 8; how-to step 11–11 |

Band windows after slices 2–4: school 5–11 with `order` 5, 10, 6, 7, 8, 9, 11 once 10 lands (the next band up begins where school's window starts, so nothing renumbers); pre-K 3–6 with `order` 3, 4, 5, 10, 6.

### Younger-band openings

A lap entry (the puddle splashes toward any touch, three shells beside it, no growth, no voice beyond the plop) is close to level 1 but changes the game's band list and the lap land page; the definition left it out. **Decision**, below.

### Easier entries and levels between existing ones

Level 10 *Count the dots* is the between-level: appended ID 10, placed by pre-K's `order` between 5 and 6. No `entryLevels` change is needed, since pre-K's first level stays 3. No saved level is renumbered.

### Left out on purpose

- **Rain that doubles the puddle** (multiplication by 2): outside the game's skills and the school band's 1.OA focus; a decision if the developer wants a multiplication strand here.
- **Two pails in one round** (two exact totals from one beach): genuine planning. Its layout probe passed at four views and it is now defined as level 12 *Two pails* ([definition](../definitions/puddle-gobble-two-pails.md)); only the build remains (slice 6).
- **A rival puddle, a timer, a shrinking-in-the-sun clock, "biggest puddle" scores:** pressure the rules forbid.
- **Soaking critters or friends' things:** the theme rule from the definition stands.
- **Free sandbox puddle** (DragonBox's sandbox): pleasant, but an endless beach has no gentle finish; revisit only with a defined stopping point.

## Decisions for the developer

1. **Lap entry.** Open lap with an appended level 13 *Splash* (lap 13, `entryLevels` [13]; level 12 is the defined *Two pails*)? Default: no, as the definition left it.
2. **Journal.** File the finish's tidy row (the things she soaked, smallest to biggest) as a journal discovery the first time each kind is soaked? Default: no, nothing is filed.

Both are added to [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

## Build slices, in order

1. **More kinds and beach moods** (built 2026-11-07, PR #1374). Tier: existing interaction with new content: typecheck, the game's rule tests (the content tests above), one filtered play of level 5 with one portrait screenshot in the evening mood; no `fingerdemo` (bot unchanged); `npm run build` only if `palette.ts` or the shared scenery changes.
2. **Level 9 *Smallest number first*** (built 2026-11-07, PR #1378). Tier: new level on the existing interaction: typecheck, rule tests, one browser play of level 9 with one aimed out-of-order touch, `fingerdemo` at 9; build (voice and how-to change).
3. **Level 10 *Count the dots*** (built 2026-11-07, PR #1384; school's `order` was written once). Tier: new level on the existing interaction: typecheck, rule tests (plus the `order` and registry tests), one browser play of level 10 and pre-K's step from 5 to 10 to 6, `fingerdemo` at 10; build.
4. **Level 11 *Too full*** (built 2026-11-07, PR #1384). Tier: new level on the existing let-go interaction: typecheck, rule tests (the held-start state, hint reach, strip fits), one browser play of level 11 with one under-shoot and one requested hint, `fingerdemo` at 11; build.
5. **Two pails, probe and definition** (defined 2026-11-07, PR #1406; docs and one probe test only): a `beachLayout` and strip probe in `logic.test.ts` at four views, then the [definition](../definitions/puddle-gobble-two-pails.md).
6. **Level 12 *Two pails*** (next; school 5–12, order adds 12): pour by leading onto a matching pail, tip a full pail back. Tier: new interaction: typecheck, unit tests (rule, registry, lands, how-to), one scripted play of 12 via `BROWSER_SUITE=puddlegobble` with one refused overshoot, one lead onto the wrong pail, one tip back and one hint, one portrait screenshot at 1024×1365, `fingerdemo` at 12, build.
7. **Lap entry** (now level 13) and **journal**: decisions 1 and 2.

## What was built in this session

The dive session built nothing: research and ideation only (checks: `node scripts/check-links.mjs` and `git diff --check`).

Slice 1 (PR #1374): tier 3 gained `hat` and `spade`, tier 4 `umbrella` and `towel`, and `NUMBER_KINDS` gained `seaglass` and `button` (levels 6–8, tier 2 size with the numeral badge); `NAMES` moved to `logic.ts` and `thingArt` to `art.ts`. Seeded moods (`moodFor`, with `setMood` for the browser check) leave the board unchanged. 25 rule tests (every tier has at least four kinds with none in two tiers; every kind is named and draws at 70–220; level 5 shows at least three tier-4 kinds over 500 seeds; levels 6–8 use every number kind; the mood is seeded and leaves the board and layout seed alone). Ran: typecheck, the rule tests and `BROWSER_SUITE=puddlegobble` (level 5 upright step with a portrait screenshot in the evening look). Not run: `fingerdemo` (bot unchanged), build.

Slice 2 (PR #1378): level 9 *Smallest number first* (school, window now 5–9) is the `order` plan with a `numbers: true` flag: numerals on alike number kinds, a puddle at 20 that never grows, six distinct numbers 1–20 (authored first round 3, 8, 11, 14, 17, 19). Steering onto a bigger number while a smaller is left is an aimed miss with "{v} is smaller. Soak it first." (`gobble.smaller-first-number`); the glow after two misses shows the smallest left and counts one hint; new instruction `gobble.instruct-order-number`; no number line on a soak at 9. Two fixes found while checking: in the `order` mode (5 and 9) a soak now re-arms every thing on the sand (a number refused for the order could stay inert while the puddle stayed near it), and the ghost finger taps the goal instead of dragging when the straight way is blocked and no detour is clear (its drag through bigger numbers counted as aimed misses). Rule tests cover the authored board and plan and, over 500 seeds, that every value fits, values are distinct, the only refusal is the order and the hint is the smallest left. Ran: typecheck, `npm test` (325 files, 6061 passed, 1 skipped), `BROWSER_SUITE=puddlegobble` (levels 1, 8, 9, 4 upright, 5 evening upright; at 9 one aimed bigger-number touch is one miss, then played to its sticker), `fingerdemo` for `puddle-gobble` at 4, 5, 8, 9 (9 finished in 14.0 s, clean), build. Not run: offline, world, any iPad check; no screenshot.

Slices 3 and 4 (PR #1384, one batch): level 10 *Count the dots* is the `plus` plan with `dots: true`: the puddle starts at 2 and gains 1 per soak, five distinct numbers 1–6 carry a die-style dot card (`dotSpots`, 1–9) under the numeral and the puddle shows a dot card of its number (to 7); a too-big touch is never a miss and the glow after two such tries counts one hint (as at 6); it reuses `gobble.instruct-number`. `LEVELS` now pre-K {3–10, order 3,4,5,10,6} and school {5–11, order 5,10,6,7,8,9,11}. Level 11 *Too full* is the `pail` mode with `Board.held`: everything starts in the puddle (authored start 2 + 4, 9, 3, 6 = 24, pail 14; only letting go 4 and 6 together fits); strip tokens let go for free, going under the pail is allowed (`gobble.under-pail`), a soak back past the pail is refused as an aimed miss, and a let-go that lands on the pail finishes the round (level 8 too). New instruction `gobble.instruct-too-full`. **Rule decision:** at 11 a soak is never refused as too big, unlike the dive's sketch, because everything came out of the puddle and the fit check would dead-end the dive's own board (letting the 9 go first meant it could never return, needing puddle ≥9 and ≤5). Seeded boards: 4–5 distinct numbers 1–9, pail 10–20, start total ≤40, 1–3 let-go ways of two or more things, no single let-go solves. Strip geometry moved into logic (`STRIP`, `stripSpan`, `stripToken`). 41 rule tests, including an exhaustive search that the hint reaches the pail within six steps from every reachable state on the authored board and 200 seeds. Ran: typecheck, `npm test` (325 files, 6081 passed, 1 skipped), `BROWSER_SUITE=puddlegobble` (levels 10 and 11 added), `fingerdemo` at 10 and 11 clean, build. Not run: offline, world, any iPad check; no portrait screenshot of 10 or 11.

Slice 5 (PR #1406, define): no game code changed. A probe test in `logic.test.ts` (*the beach layout* › *two pails probe*) places eight numbered things clear of two side-by-side 170-unit pail boxes, the pet corner and the puddle's start on 300 seeds at four views, and checks the five-token strip stays above both pails; it passed, so the [definition](../definitions/puddle-gobble-two-pails.md) for level 12 *Two pails* (authored start 3, pails 9 and 11, numbers 1, 2, 3, 4, 5, 7) was written. Ran: typecheck, `npx vitest run src/games/puddle-gobble` (38 passed), `node scripts/check-links.mjs`, `git diff --check`. Not run: full `npm test`, build, browser suites.
