# Tile Pairs deep dive

*ID `tile-pairs` · band grown-up · levels 1–6 on 2026-11-11 · session `claude/dive-tile-pairs` ([PR #1508](https://github.com/rjdunlap/neo/pull/1508)); second pass on a longer ladder and puzzle challenges the same day, session `claude/tile-pairs-puzzle-research` ([PR #1516](https://github.com/rjdunlap/neo/pull/1516))*

## The game today

A grown-up clears a small layered stack of picture tiles by removing matching pairs. A tile can be taken only when nothing lies on top of it and its left or right side is open on its own layer; free tiles are bright and blocked ones muted. Tap one free tile, then its match; tap a selected tile again to put it back. Nothing is timed and nothing is lost: Undo restores the last pair or shuffle, Hint rings a pair that lies on a clearing route, and Shuffle lays whatever is left in open rows that can always be paired off. The purpose is **spatial planning after Mahjong solitaire**: seeing which tiles a pair uncovers and choosing, among several copies of a picture, the pair that keeps the rest clearable. It was built in October for roadmap step 8b (PRs #229 and #232), lives in Lantern Lake (`region: 'puzzle-peaks'`, `challenge: 'noticing'`), is upright-ready on a phone and is one of the couch catalog's grown-up games.

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Open rows · 12 tiles | grown-up | Which free end tile to pair, on one flat layer of 4 × 3 with six pictures, two of each |
| 2 | A raised square · 20 tiles | grown-up | When to take the four raised tiles; 4 × 4 with a 2 × 2 square on top, six pictures |
| 3 | Three layers · 24 tiles | grown-up | Which two of four copies to pair, with a second 2 × 2 square on the first |
| 4 | Long bridge · 24 tiles | grown-up | Which end to open first on a 6 × 3 base with a raised row of four and two on top |
| 5 | Twin terraces · 24 tiles | grown-up | Which terrace to work down; 6 × 2 with two stepped terraces, five pictures (some six times) |
| 6 | Crown · 24 tiles, six of each picture | grown-up | Which of fifteen possible pairs of a picture to take; a 6 × 3 base without its four corners, four pictures |

`BandLevels`: `grownup 1–6`, no `order`, no `entryLevels`.

**What a round draws from.** There is no frozen pool. `makeBoard` builds the level's fixed layout, finds one geometric clearing route with `solve(tiles, mask, true)`, and deals shuffled pictures onto that route's pairs, so every board is solvable without rerolling. The pictures are the six `SHAPES` in the six `RAINBOW` colours, one colour per shape. A board lives in a 32-bit mask (`1 << tiles.length`), and `solve` is an exhaustive memoised search; both are sized for 24 tiles.

**Rules today.** A mismatch removes nothing, boings, says `tile-pairs.mismatch` and counts a miss; two since the last match show a hint. A blocked tile squeaks and explains itself, and is not a miss. After each pair the scene re-solves the remainder: when no route is left it says so (`tile-pairs.stuck`) and the help line changes; Hint then shuffles first (one shuffle, one help) and rings a pair. `finish` reports misses, hints and `score = undos + shuffles`.

**Couch.** `COUCH_INFO['tile-pairs']`: stick between free tiles, bottom to choose, left to undo, hint and shuffle in the pause menu; face-off on identical seeded boards, lower undos plus shuffles wins. There is no frozen course.

**Measured difficulty** (second pass; a copy of `logic.ts` run under Node outside the test runner, 40 seeds a level). A *losing pair* is a legal matching pair after which no clearing route is left. The *random-play clear rate* is the share of play-outs that clear when every turn takes a uniformly random legal pair: a crude stand-in for a player who does not plan, and so a measure of how much planning a deal asks for. "Seeded routes" deals each board along a randomised geometric route (what slice 1 proposes) instead of the fixed one.

| Level | Covered at start | Matching pairs open at start | Losing first pairs today | Random play clears today | Seeded routes: median clear | Seeded routes: hardest of 40 | Seeded deals with a losing first pair |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 3 | 0 | 100% | 100% | 100% | 0 of 40 |
| 2 | 4 | 12 | 0 | 100% | 98% | 40% | 3 of 40 |
| 3 | 8 | 12.5 | 0 | 100% | 77% | 32% | 5 of 40 |
| 4 | 6 | 8.4 | 0 | 100% | 82% | 37% | 4 of 40 |
| 5 | 12 | 7.2 | 0 | 93% | 60% | 7% | 9 of 40 |
| 6 | 10 | 12.3 | 0 | 83% | 75% | 22% | 1 of 40 |

**Known gaps** (each read from the code on 2026-11-11, not from a playtest):

- **Levels 1–4 cannot be lost, and no level has a losing first pair** (measured above). With today's fixed route every pair taken in any order clears levels 1–4, so the choices the level table names ("which two of four copies", "which end to open first") have no wrong answer yet, and Hint, Undo and the stuck line never come into play there. Only levels 5 and 6 can strand a careless player, and only late (about the ninth or tenth pair). The ladder's difficulty is in its deals, not its layouts: the same layouts dealt along seeded routes range from no planning at all to boards where most random play-outs strand.
- **The same pairing every round.** The geometric search is deterministic, so a level's route is always the same list of position pairs, and the seed only decides which picture each route pair gets. At level 1 (six pairs, six pictures) the board is the same six pairs of positions every time with the pictures swapped round; at levels 2–6 the positions that share a picture are always unions of the same fixed pairs. A returning player can learn where a tile's partner sits.
- **Covered tiles are invisible.** A raised tile is drawn 6 units up and across on a 108-unit face, so the tile beneath shows only a sliver of its edge and none of its picture. From level 2 on, 4, 8, 6, 12 and 10 of the tiles start hidden (levels 2–6). The solver and the hint see them; she cannot. Choosing "which two of four copies" is then partly a guess, and `tile-pairs.stuck` can announce a dead end that no visible information predicted. The learning purpose is planning, so this is the gap that matters most.
- **A pair just vanishes.** Removal is one frame and a pop: nothing shows which tiles it freed, though that consequence is the thing to notice.
- **One look.** Six shapes in six colours on a cream tile, every round.
- **A short, flat top.** Levels 3–6 are all 24 tiles on three layers; the ladder ends where the first definition stopped.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Mahjong solitaire](https://en.wikipedia.org/wiki/Mahjong_solitaire) (Brodie Lockard's *Mah-Jongg* on PLATO, 1981; Activision's *Shanghai*, 1986) | The original: 144 tiles in the four-layer "turtle" | More layouts, alternative tile sets, sometimes wild tiles; most versions deal only winnable boards and offer undo and a reshuffle | The open-left-or-right rule (already here), many layouts, deals that are always winnable, tile sets | 144 tiles at this target size; time limits and score |
| [Mahjong by Microsoft](https://apps.apple.com/app/id1486892969) | The mainstream modern version | Easy-to-expert puzzles, and daily challenges: a classic board, *Golden Tiles* (uncover and match hidden special pairs, untimed), and the timed *Lightning Tiles*, *Score Attack* and *Match Attack* | *Golden Tiles* as a goal that points at specific buried tiles without a clock | The three timed modes, coins, monthly badges and daily streaks |
| [Vita Mahjong](https://apps.apple.com/us/app/vita-mahjong/id6468921495) | A large-tile version sold to older players | Its listing leads with big clear tiles, no timer, and hint, undo and shuffle | Confirmation that big tiles and no clock are the appeal for a relaxed grown-up | Its reviews say hints and shuffles are rationed behind adverts; help here stays free |
| [Mahjongg Dimensions](https://arkadium.com/games/mahjongg-dimensions) (Arkadium) | The same rule on a cube she turns | Rotation reveals tiles on other faces; rounds race a clock | The idea that looking around the stack is part of play | The clock; a 3D cube of small tiles |
| Triple-tile games ([3 Tiles](https://apps.apple.com/lc/app/3-tiles-tile-matching-puzzle/id1525211513) and many like it) | Tap tiles into a seven-slot tray; three alike clear | Bigger heaps; the level is lost when the tray fills | Nothing: the tray is a loss condition | The tray, the loss, the boosters |
| [Shisen-Sho](https://en.wikipedia.org/wiki/Shisen-Sho) | Flat tiles joined by a path with at most two turns | Bigger grids, gravity variants | Nothing here: it is a different rule and would be a different game | — |

**On solvability.** Michiel de Bondt's [paper](https://arxiv.org/pdf/1203.6559) shows that clearing a board is NP-complete even when the player may look under tiles ("peeking"), and his [solver page](https://www.math.ru.nl/~debondt/mjsolver.html) reports that about 3% of 10 million random turtle deals cannot be cleared even with peeking. Two things follow for this game. Random deals are unfair, so dealing along a known route (as `makeBoard` does) is right. And a board is only a planning puzzle when the player has the information the solver has; without peeking it is a memory-and-luck game with a plan-shaped surface. At 24 tiles the exact search is instant, so this game can afford to give her that information.

## What makes sense here

The rule is settled and good. What the game lacks is honesty about information, a visible consequence, and variety; new levels come after those. In order of value:

1. **Let her see under the stack.** A free look turns levels 2–6 from guessing into planning and makes the "no clearing route" line something she could have foreseen.
2. **Deal a different pairing each round**, so replay is a new puzzle rather than a remembered one.
3. **Show what a pair uncovers.**
4. **Then grow the stack**: taller first (where looking under matters most), then a matching rule with more freedom, then more tiles within what the exact solver can still prove.

A timer, a score, a tray that fills, daily streaks and rationed help all conflict with the project rules and are left out. The long-term arc stays inside the grown-up band: a handful of calm, always-solvable stacks whose difficulty is the depth of the plan, not the count of tiles.

**Second pass: where "much more" comes from.** The measurements above change the order of the growth. Bigger stacks alone do not add puzzle: levels 3 and 4 have 24 tiles and no wrong move. Three sources of new challenge stand out, each kept untimed and always clearable:

- **Deals chosen by a measured target.** Every level gets a band of random-play clear rate, and the round's deal is the first of a few seeded candidates inside it. This is the cheapest lever (about a millisecond a candidate) and it is also a correction slice 1 needs: seeded routes alone make level 5 much harder on average than today (median 60% against 93%) and leave level 1 unchanged.
- **Designed puzzles that teach one idea each.** Random dealing almost never produces a board with one right opening (1 in 5,000 seeded deals on levels 2–6), so these are frozen, hand-made boards checked by the solver, as Ferry Jam's harbours are. They are the "puzzle challenges" proper: short, all-visible boards where the trap is the lesson.
- **New geometry and rule variants** taken from the long history of the genre: half-step bricks, a wild family, lock tiles, three-alike rounds, and larger stacks once the mask is widened (measured feasible to 48 tiles).


## Experience and presentation

**First action.** Tap a bright tile, then another bright tile with the same picture; level 1 has no layers, so the first pair needs no explanation beyond the bright and muted contrast. That already works.

**What should feel good and does not yet.** Touch-down outlines the tile in blue and ticks (built). A matched pair should lift, drift apart and fade over about 0.2 s while the tiles it freed brighten with a short pulse, one soft pentatonic step higher per tile freed, before the board is ready again; today the pair is simply gone. The tally can say how many pairs are open now ("3 pairs open") beside the tiles left, which is the number a planner watches.

**Looking under.** A fourth button, **Peek**, toggles a see-through view: every tile that covers another fades to a quarter strength so the pictures below show, with a thin outline keeping each stack readable; tapping Peek again, or any tile, returns to the solid view. It is information, not an answer, so it is not a hint, is never counted and does not touch the face-off score. Four 160-unit buttons at 180 spacing fit the 768-unit upright width and the landscape row. On the island with keys and on the couch it needs one free button; the build reads `COUCH_INFO` and takes the top button if it is free, otherwise a pause-menu entry beside Hint.

**What varies on replay without changing the rule.** The pairing (slice 1), the pictures' places, and a seeded look: the current shapes, a second set of six from the other shapes in `src/art/shapes.ts` (`MORE_SHAPES` has five, so one more is drawn), and one of small island pictures if the [reuse map](../DESIGN.md#reuse-map) has six that differ in outline as well as colour. A look is chosen by the round's seed and never changes mid-round.

**Reasoning apart from reading, memory and motor skill.** No reading is needed to play; the tally and help line are extra. Peek removes the memory load. Targets stay 108 units through level 9.

**Supported completion and stopping.** Unchanged: Hint, Undo and Shuffle always lead to a clear stack and one sticker; a round is a few minutes and nothing is kept between rounds.

**Two people.** One chooses the first tile and the other finds its partner, or one plays and the other calls what a pair will uncover before it goes. The existing co-play line covers it; solo play needs nothing else.

**Needs a person, not a bot** (questions for whoever next plays it on a phone, none of them a gate on the slices below): whether the see-through view is readable at phone size, whether the uncovering pulse is noticed, and whether level 6 feels harder than level 4 or only busier.

## Proposed ladder

### Fresh content inside existing levels

- **A different pairing each round.** Make the geometric route seeded: at each step choose among the free position pairs with `ctx.rng` instead of taking the first, keeping the guarantee that the route clears (a randomised depth-first search over the same memo, or building the route backwards). Layouts, tile counts and picture counts do not change. The test that freezes levels 1–3 by hash is replaced on purpose by property tests: the layouts are the same sets of positions as before, 100 seeds a level all clear, and across those seeds each level produces many distinct pairings (level 1 at least ten). Nothing saved refers to a board, and the couch face-off still deals both players the same board from one seed.
- **A deal dial** (second pass). Each plan gains a target band for its random-play clear rate, and `makeBoard` deals up to 40 seeded-route candidates and keeps the first inside the band (the closest if none is), so the seed still decides the board and the face-off still shares it. Proposed bands, from the measured spreads: levels 1–2 at least 95%; levels 3–4 between 60% and 95%; levels 5–6 between 30% and 80%; new levels state their own. The measure is 60 seeded play-outs, about 1 ms a 24-tile candidate on a Mac (40 candidates for every level took 24–48 ms), so even the worst case is a fraction of a second on a phone, spent once before the board is drawn (not measured on a phone); a test asserts that 100 seeds a level land inside the band and that no level's candidate loop exhausts on more than 5 of them. This rides with slice 1, because seeding the route without it silently changes each level's difficulty.
- **Looks.** Two more picture sets as above, each test-checked for six pictures that differ pairwise in shape and in colour.

### New levels on top

IDs are appended; levels 1–6 keep their meaning and the grown-up range grows to `1–9` with no `order`.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *Tall tower · four layers* | grown-up | 24 tiles: a 4 × 3 base, a 2 × 3 block on it, a 2 × 2 on that and two on top; six pictures, four of each | The order to take a deep stack apart when most of it starts covered; Peek does real work here | As today | Every raised tile is supported; 100 seeds clear; at least 10 tiles start covered; some legal first pair on some seed leaves no route (so the choice matters) | New `layout: 'tower'` branch in `makeBoard`; a fourth layer shifts the top tile 18 units, so `tilePairsLayout` is checked in both orientations. After Peek |
| 8 | *Flower friends* | grown-up | The crown layout with five pictures and one family of four flower tiles that look different but share a petal frame | That any two flowers pair, so four tiles give six possible pairs with different consequences | Two unlike ordinary pictures still boing; a flower with a non-flower gets its own line saying flowers go with flowers | `matches(a, b)` is symmetric, pairs each ordinary picture only with itself and any flower with any flower; the solver and hint use it; 100 seeds clear; levels 1–7 deal no flowers | `kind ===` becomes `matches` in `pairs` and the scene; four flower drawings with a shared frame; one voice line and a level-scoped how-to step; `reshuffle` keeps flowers in twos |
| 9 | *Wide stack · 30 tiles* | grown-up | 30 tiles on a 6 × 3 base with eight raised and four on top, six pictures | A longer plan at the same target size | As today | 30 distinct supported positions; 100 seeds clear; a counted node budget for `solve` holds over random play-outs to a dead end (as Gem Swap's hint budget does); the mask stays a positive 32-bit integer | The last size the present mask and exact search hold. If the budget fails at 30, ship 28 and say so in the plan name |

### Younger-band openings

A **school** window at levels 1–2 is possible on paper: 108-unit tap targets, one rule, spoken instruction and hint. It would need child wording for `tile-pairs.stuck` and `tile-pairs.hint`, a `LEVELS` line, and the lands test to place it. It is a decision, below, and is not built by default.

### Easier entries and levels between existing ones

None. Twelve open tiles is already a gentle start for a grown-up, and 12 → 20 → 24 is an even slope.

### Left out on purpose

- **Timed and scored modes** (Lightning Tiles, Score Attack, Match Attack, the Dimensions clock): round-ending timers and pressure.
- **The seven-slot tray** of triple-tile games: a loss screen by another name.
- **A full 144-tile turtle.** At 108 units it cannot fit, and at the grown-up minimum of 64 it would need a scrolling board on a phone, a wider mask and a search that can no longer prove "no route" exactly. A 36-tile board is the honest next step and is a decision, below.
- **Rationed or earned hints and shuffles**, daily challenges, badges and streaks.
- **A Golden Tiles goal.** Attractive and untimed, but it adds a second finish condition to a game whose single goal is clear; revisit only if a playtest note asks for a shorter round.
- **Random deals.** About 3% of real turtle deals are unwinnable even with peeking; every board here stays dealt along a route.

## Decisions for the developer

1. **A 36-tile board (level 10)?** It needs the mask widened (two words or a `BigInt`), a search that is bounded rather than exhaustive, and tiles near 96 units in landscape. Lean: wait until levels 7–9 have been played; build only if 30 tiles feels too short.
2. **Open levels 1–2 to the school band?** Lean: not now; the grown-up game is the audience, and Memory Match and Pile Match already serve matching for children.
3. **A frozen couch course?** Couch play retires at Lands stage E, so the default is no.

None of these blocks a slice below.

## Build slices, in order

1. **A different pairing each round, and a pair that shows what it uncovers.** The seeded route in `makeBoard` with the property tests above; the lift-and-fade removal, the uncovering pulse and "pairs open" in the tally. Existing-game tier: typecheck, the rule tests, one filtered `tilepairs` play at level 3 with a portrait screenshot; no `fingerdemo` (the bot's actions do not change); build only if a shared file changes.
2. **Peek.** The see-through view, its button, its key and couch control, a how-to step and a voice line; uncounted. New-interaction tier: typecheck, unit tests, one filtered `tilepairs` play at level 5 that peeks, pairs, takes one wrong answer and one hint, a portrait screenshot of the see-through view, `fingerdemo` only if the card's demonstrated action changes, `couchgames` filtered to Tile Pairs if a pad button is mapped, build.
3. **Two more looks.** Seeded picture sets with the distinctness test. Existing-game tier with one screenshot per new look; can ride with slice 2 if that session is small.
4. **Level 7 *Tall tower · four layers*.** New level on the existing interaction: typecheck, rule and registry tests, one browser play of 7, `fingerdemo` at 7. After slice 2.
5. **Level 8 *Flower friends*.** A rule change: typecheck, rule tests with levels 1–7 unchanged, one filtered play of 8 with a flower-and-other mismatch and a hint, a portrait screenshot, `fingerdemo` at 8, build (voice and how-to change).
6. **Level 9 *Wide stack · 30 tiles*.** New level on the existing interaction, with the node-budget test: typecheck, rule tests, one browser play of 9, `fingerdemo` at 9.

Slices 1 and 2 are queued as [batch 1](../GAME-BATCHES.md#tile-pairs-1-a-fresh-pairing-and-a-visible-uncovering) and [batch 2](../GAME-BATCHES.md#tile-pairs-2-peek-under-the-stack). The three decisions stay out of the ready list.

## What was built in this session

Nothing: research and design only. The game's code, tests and page were read; no game was run. Checks: links (`node scripts/check-links.mjs`) and `git diff --check`.
