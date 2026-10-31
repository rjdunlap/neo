# Ferry Jam deep dive

*ID `ferry-jam` · bands pre-K, school · levels 1–6 on 2026-10-31 · session `claude/dive-ferry-jam-2`, [PR #1073](https://github.com/rjdunlap/neo/pull/1073)*

## The game today

Drag boats along their lanes in a small harbor so the red ferry reaches the dock on the right, in Puzzle Peaks (`region: 'puzzle-peaks'`; the [GAMES entry](../GAMES.md#ferry-jam)). A boat lying sideways slides left and right, an upright one up and down, and a held boat stops at the next boat or the wall. **Learning purpose:** planning a sequence of slides: seeing which boat is in the way, which boat is in *its* way, and doing them in order. Grown-up wording stays at "planning a sequence of slides".

| Level | Plan name | Band window | What she decides | Board, boats, fewest slides (plan) | Harbors per round |
| --- | --- | --- | --- | --- | --- |
| 1 | Move a boat or two out of the ferry's way | pre-K | Which boat clears the ferry's row | 4×4, 2–3 boats, 2–3 | 2 |
| 2 | A 4 by 4 harbor that takes a few more slides | pre-K | A boat that must move before the blocker can | 4×4, 3–4, 4–6 | 2 |
| 3 | A 5 by 5 harbor with more boats | pre-K, school | The same on a bigger board | 5×5, 4–6, 5–7 | 1 |
| 4 | A busier 5 by 5 harbor: plan the slides in order | pre-K, school | A longer chain of blockers | 5×5, 5–7, 8–11 | 1 |
| 5 | A 6 by 6 harbor | school | The same on the Rush Hour-sized board | 6×6, 6–8, 8–12 | 1 |
| 6 | A crowded 6 by 6 harbor: a long way to the dock | school | Long plans with boats parked out of the way and moved again | 6×6, 7–10, 13–18 | 1 |

Ranges (`LEVELS` in `index.ts`): pre-K 1–4, school 3–6. Cells are 100 units (`CELL`).

**What a round draws from** (measured by running `solve` over the frozen `HARBORS` outside the test runner on this date): every level has 14 harbors, so repetition is not a gap. But each pool sits at the bottom of its plan's range, because `makeHarbor` accepts the first harbor inside the range:

| Level | Plan fewest | Fewest slides of the 14 frozen harbors |
| --- | --- | --- |
| 1 | 2–3 | thirteen 2, one 3 |
| 2 | 4–6 | thirteen 4, one 5 (no 6) |
| 3 | 5–7 | seven 5, seven 6 (no 7) |
| 4 | 8–11 | eleven 8, two 9, one 10 (no 11) |
| 5 | 8–12 | six 8, four 9, one 10, one 11, two 12 |
| 6 | 13–18 | ten 13, two 14, one 16, one 18 |

**Accounting today** (source reading):

- **Nothing is ever a miss.** `this.misses` starts at 0 and is never incremented, so `ctx.finish` always reports 0 misses. That is right for free sliding (experimenting is not wrong), but it means adaptation runs on hints alone: a round without a hint is smooth (`isSmooth`), two hints is a struggle.
- **The hint fires on a raw slide count, not on lack of progress.** `maybeHint` glows the solver's next slide once `sinceHint ≥ max(8, 2 × fewest)` slides have been made since the last hint, whether or not those slides brought the ferry closer. The [GAMES entry](../GAMES.md#ferry-jam) and the how-to card say "after many slides without getting closer", which the code does not check. A child working steadily on an 18-slide harbor by a longer, sensible route is charged a hint at slide 36; a child who wanders in a loop on a 2-slide harbor waits 8 slides. Undo does not reduce the count.
- **The ghost finger plays the solver's way out** (`autotouch` → `solve(...)[0]`), so the demonstration is always perfect.

**Size ceiling:** the design area is 1024×768 and always fits (`src/engine/view.ts`; portrait adds height, not width). The board sits at `x ≥ 150`, `y ≥ 100`, and the dock sticks out about 110 units to the right: a 6×6 harbor uses 150 + 600 + 110 = 860 across and 100 + 600 = 700 down. A 7×7 harbor (800 down) does not fit landscape at 100-unit cells, so **bigger boards are a dead end**; depth must come from new rules on the same drag.

**Couch:** Harbor Rush plays levels 3–6 through `src/couch/catalog.ts`, which lists its levels explicitly (`[3, 4, 4, 5, 5, 6]`), plus the frozen **Busy Harbors** course (`course.ts`, version 1). New level IDs do not reach couch play unless someone adds them there. `boatToward` and `focusPath` are tested against every harbor in the game.

**Already pointed here:** the [co-play split](../IDEAS.md) idea for Penguin Slide and Ferry Jam (one player owns the sideways boats, the other the upright ones); the executive-function study's [Pancake Stack](subjects/executive-function.md) argument, which owns rearranging toward a pictured goal state (this game must not grow a "make this picture of boats" level); the food-fiber study's *FS6 Made far away* sketch (goods arrive by ferry; a sketch, nothing to build here); Maker Harbor in the [roadmap's zone list](../ROADMAP.md) (proposed only).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Rush Hour](https://en.wikipedia.org/wiki/Rush_Hour_(puzzle)) (Nob Yoshigahara, ThinkFun, US 1996) | Sliding-block puzzle | A fixed 6×6 board; 40 cards from Beginner to Expert, then card sets and a Deluxe edition adding Grand Master; new vehicles arrive with expansion sets. Spin-offs named on the page: Rush Hour Jr., Safari Rush Hour, Railroad Rush Hour, Rush Hour Shift (their mechanics not opened this session) | Depth on a fixed board, not bigger boards; a new piece as the step between sets | Nothing harmful; the card numbering as a visible rank |
| [Rush Hour Jr.](https://www.lakeshorelearning.com/products/games/logic-games/rush-hour-jr-game/s/FG503) (ThinkFun) | The same for ages 5+ | 40 cards in four levels (Easy, Medium, Hard, Super Hard; retailer listings) | The age window matches pre-K and early school; easy cards need few moves | — |
| [Unblock Me](https://www.commonsensemedia.org/app-reviews/unblock-me) (Kiragames) | Touch app of the same rule | Thousands of puzzles by difficulty; a hint ration (a hint given each day you open the app, per its listing) | The drag-along-a-lane gesture is the same as ours | Hints as a daily ration, ads, endless levels as the hook |
| [Klotski](https://en.wikipedia.org/wiki/Klotski) (Pennant Puzzle 1909; Huarong Dao) | Sliding blocks that move in any direction | One famous layout, minimum 81 moves | — | Free two-way movement: it loses the lane rule that makes the plan readable |
| [Tower of London](https://dspace.library.uvic.ca/items/f35e93c3-c1ef-4c5e-ab60-f3e93cb4b49d) (planning task used with preschoolers) | Research task | Problems grow by the moves needed and by whether a sub-goal must be set aside first | Difficulty by the number of slides that must be *planned*, and "park a boat out of the way, then move it again" as the hard step | A scored test; the goal-picture form belongs to Pancake Stack |
| [Penguin Slide](../GAMES.md#penguin-slide), [Robot Path](../GAMES.md#robot-path), [Pond Conga](../GAMES.md#pond-conga) (this island) | Grid planners | — | Penguin Slide's rocks that never move; the solver-backed hint pattern | Penguin Slide's slide-until-it-hits rule (a different game) |

**Learning references:** no grade standard names sliding-block puzzles. The closest is the Common Core [Mathematical Practice 1](https://www.thecorestandards.org/Math/Practice/) (make sense of problems: analyse constraints and goals and plan a solution pathway rather than jumping in), cited for the grown-up wording only. Tower of London studies with preschool children ([UVic thesis, 2015](https://dspace.library.uvic.ca/items/f35e93c3-c1ef-4c5e-ab60-f3e93cb4b49d); [Towers of London and Hanoi in young children](https://experts.arizona.edu/en/publications/a-comparison-of-performance-on-the-towers-of-london-and-hanoi-in-/); [planning from 6 to 13](https://ri.conicet.gov.ar/handle/11336/51458)) support grading by moves to plan and by sub-goal conflicts; read as abstracts only. No attention, executive-function or school claim is made.

## What makes sense here

The game's strength is that **the harbor is both the puzzle and the check**: a slide either clears water in front of the ferry or visibly does not, and nothing she does is wrong. Depth should come from **new things in the harbor that change the plan** (a rock that never moves; a second ferry that has to leave by another dock) and from **naming the blocker** at pre-K, not from boards bigger than 6×6, timers or a visible par.

Before adding levels, the hint should match its promise: help when she is stuck, not when she is slow. And the frozen pools should actually reach the top of each plan's range, so stepping up feels like a step.

**Long-term arc:** pre-K names the boat in the way (10), clears one boat (9, the new entry), then the built 4×4 and 5×5 harbors → school plans around rocks (7) and gets two ferries out by two docks (8) → Harbor Rush on the couch keeps 3–6.

## Experience and presentation

- **First unsupported action:** level 1's first harbor has one boat across the ferry's row; she drags it up or down and the water in front of the ferry opens. Level 9 (proposed) makes that the whole first harbor: one slide and the ferry sails.
- **Touch feedback and consequence:** touch-down picks the boat up (a `sfx.pop` pitched by boat), it follows the finger only along its lane and stops at a boat or the wall, a marimba note plays on a new position, and the ferry's sail-off (`sfx.whoosh`, a foam burst, the pet cheering) is the reward. Rocks (level 7) answer a drag with a short shake and a low wooden tock, never a miss.
- **Art and feel example:** a rock is a rounded grey `Graphics` boulder (`swatch.white.line` body, `swatch.white.light` highlight ellipses; the palette has no grey swatch) with a white foam ring drawn as three short arcs that drift in alpha, so it reads as sitting in the water rather than floating like a boat. The second ferry (level 8) reuses `boatArt` rotated upright in `swatch.yellow` with the same cabin and flag, and the bottom dock is the right-hand dock's planks rotated.
- **Variety without changing the rule:** the seeded harbor order from 14-harbor pools, hull colours, and (slice 1) fewest-slide counts spread through each plan's range.
- **Reasoning versus reading, memory and motor:** no reading; the whole harbor is on screen (no memory load); every boat is at least 100 units wide and the lane constraint means an imprecise drag still lands on a cell.
- **Supported ending:** undo takes back any slide; the hint glows the solver's next slide and its outline; every frozen harbor is solvable, so every round ends with the ferry sailing.
- **Co-play:** the [IDEAS co-play split](../IDEAS.md) works on one iPad without code: one person moves the sideways boats, the other the upright ones, and they must talk to plan. Slice 1 makes that the `coplayHint`. Solo stays complete.
- **Needs a person or device:** whether a four-year-old sees "which boat is in the way" without the question (level 10's reason to exist); whether rocks read as fixed before she tries one; whether two ferries reads as one task or two at once.

## Proposed ladder

### Fresh content inside existing levels

- **Fill each plan's range:** add frozen harbors from `makeHarbor` with a range target so each level's pool reaches its plan's top (level 2 gains 5 and 6, level 3 gains 7, level 4 gains 10 and 11, level 6 gains 15–17), keeping 14 or more per level. A rule test asserts each pool includes a harbor at the plan's maximum and that at least a third sit above the plan's minimum.
- **Hint on lack of progress:** a pure `stuck(distances, fewest)` in `logic.ts`, fed the solver distance after each slide: the hint glows once the distance has not gone below its best for `max(6, fewest)` slides (undo is not counted). A steady but longer route never earns a hint; a loop does. The `hintSlide` it shows is unchanged. GAMES.md and the how-to note then become true.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Rocks in the harbor | school (range 3–7) | A 5×5 with one rock beside the ferry's row and four boats, fewest 6–9 | Where a boat can wait when a rock takes the space it would use | A drag on a rock shakes it: not a miss. The stuck hint as above | `parse` reads `x` as a rock; rocks never appear in `slides` and never move; every level-7 harbor is solvable within its plan; **every rock matters** (the fewest slides change, or the harbor becomes unsolvable, when its rocks are removed) | `Harbor` gains `rocks` (kept out of `boats`, so `encode`, `boatToward` and `focusPath` are untouched); `grid` marks rock cells; rock art; `PLANS[6]` and `HARBORS[7]`; how-to step scoped to 7; the bot is unchanged (it follows `solve`) |
| 8 | Two ferries | school (range 3–8) | A 5×5 with the red ferry (right dock) and an upright yellow ferry (bottom dock), each one slide from its dock except for the other ferry | Which ferry goes first, and which boats free both | None; each ferry sails off and leaves the harbor when it reaches its dock, freeing its cells. The stuck hint shows the next slide toward both | `parse` reads `y` as the upright ferry; a sailed ferry leaves the grid; the round is solved only when both have sailed; the fewest slides are within the plan; in at least half the harbors the fewest way sails one ferry first to free the other | The board must be 5×5: a bottom dock adds about 110 units below a 6×6 board (100 + 600 + 110 = 810 > 768). A goal per ferry in `atDock`; the solver's state lets a sailed ferry sit at position `size` (base-8 `encode` still fits); second ferry art and a bottom dock; `ferry.both` voice line; the bot follows `solve` |

### Younger-band openings

**Push the boat out (preschool, decision):** a 3×3 harbor with one boat across the ferry's row; any drag of it sails the ferry. Adds `preschool` to the game's bands, so it waits on the developer (decision 1).

### Easier entries and levels between existing ones

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | One boat in the way | pre-K entry; first in pre-K's `order` | A 4×4 with one boat across the ferry's row and one other boat | Which boat to slide, and which way it has room | None (free sliding); the stuck hint after `max(6, fewest)` slides | Every level-9 harbor has exactly one boat in the ferry's row and fewest exactly 1; `order` lists every pre-K ID once; `entryLevels` holds 9 and 10, and a school landing on either starts at 3 | `PLANS[8]`, `HARBORS[9]` (14 harbors), `order` and `entryLevels` on the module; describeLevel; the how-to step "slide the one boat" scoped to 9 |
| 10 | Who's in the way? | pre-K; after 1 in pre-K's `order` (9, 1, 10, 2, 3, 4) | A 4×4 where one boat sits across the ferry's row and another boat stops it moving; the pet asks "Which boat is in the ferry's way?" before any slide | Tap the boat in the ferry's row; then slide as usual | A tap on a boat outside the ferry's row is a miss: boing and `ferry.notway` ("Look along the water in front of the ferry"); two misses glow the blocker (one hint). The slides afterwards are free | `blockers(h)` is the set of boats with a cell in the ferry's row ahead of it; each level-10 harbor has exactly one, which cannot reach clear water in one slide (fewest 2–3); the glow is always a blocker | A tap step before dragging (`onTap` on boats, drags held until answered); `ferry.who`, `ferry.notway` lines; the bot taps the blocker, then follows `solve`; the how-to step scoped to 10 |

With `order`, pre-K's window is `[9, 1, 10, 2, 3, 4]` and school's stays `min..max` (3–8, with 7 and 8 appended). Levels 9 and 10 are easy IDs above school's top, so they are `entryLevels` and a birthday carries a saved 9 or 10 to school's level 3.

### Left out on purpose

- Boards larger than 6×6 (they do not fit at 100-unit cells); pinch-zoom.
- A slide counter, a par shown before she plays, stars per harbor, timers. `ferry.best` already praises the fewest way after the ferry sails; nothing is lost for a longer way.
- Free two-way blocks (Klotski) and slide-until-it-hits (Penguin Slide's rule).
- "Make this picture of boats" goal states: Pancake Stack's identity, still a decision in its study.
- New levels on the couch: the catalog keeps 3–6 and the Busy Harbors course stays at version 1.

## Decisions for the developer

1. **A preschool opening** (*Push the boat out*): add `preschool` to Ferry Jam's bands with a one-slide 3×3 level, or keep the game at pre-K and up. Lean: not yet; build level 9 (the one-slide pre-K entry) first and decide after a person sees a three-year-old try it.

## Build slices, in order

1. **Fair hints and fuller harbors (batch ferry-jam 1).** The progress-based `stuck` hint, the range-filling harbors, the strict pool test, and the co-play `coplayHint`. *Check:* existing-game fix on an unchanged interaction: typecheck, the game's rule tests, one filtered regression play of level 6 that wanders (a loop of slides earns one hint) and one that progresses on a longer route (no hint). The bot is unchanged, so no `fingerdemo`.
2. **Level 7, rocks in the harbor (batch ferry-jam 2).** *Check:* new level on the existing drag: typecheck, rule tests (including every rock matters and `focusPath` still reaching every boat), one browser play of level 7 with a drag on a rock, `fingerdemo` at 7, one portrait screenshot.
3. **Level 8, two ferries (batch ferry-jam 3),** after batch 2 (shares the `Harbor` and `parse` changes). *Check:* new rule on the existing drag: typecheck, rule tests, one play of level 8 to its sticker with the yellow ferry sailing first, `fingerdemo` at 8, one portrait screenshot of the bottom dock.
4. **Levels 9 and 10, pre-K entry and who's in the way (batch ferry-jam 4).** Level 10 is a new tap step. *Check:* new interaction: typecheck, unit tests (order, entry and landing), one scripted play of level 9 and of level 10 with one wrong tap, a second for the glow, then the blocker; `fingerdemo` at 9 and 10; one portrait screenshot of level 10's question.
5. *Gated:* Push the boat out (decision 1).

## What was built in this session

Nothing: research and ideation only. Links and `git diff --check` ran.
