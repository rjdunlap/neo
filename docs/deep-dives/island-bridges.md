# Island Bridges deep dive

*ID `island-bridges` · band grown-up · levels 1–4 on 2026-10-31 · session `claude/dive-island-bridges`, [PR #1077](https://github.com/rjdunlap/neo/pull/1077)*

## The game today

A grown-up logic puzzle after Nikoli's Hashiwokakero. Numbered islands sit in a sea; she (here, a grown-up) joins them with plank bridges, one or two between a pair, straight along a row or column, so each island ends with its number, no bridge crosses another and every island is in one group. By touch, a tap on the water between two facing islands lays a plank (a third, a crossing or a full island bumps and costs nothing); **Take off** is a switch, **Hint** and **Start over** are buttons. On the couch the stick moves a highlight between islands and the bottom or left button arms laying or lifting. An island turns green when it has its planks, and its outline turns red when its number can no longer be reached (`trouble`, judged from the numbers and room, never from the answer). **Purpose:** deduction and planning, a constraint puzzle whose finish is a connected network. Home: Lantern Lake (`src/content/lands.ts`), `region: 'puzzle-peaks'`, `bands: ['grownup']`, [GAMES entry](../GAMES.md#island-bridges).

| Level | Plan name (`PLANS` in `logic.ts`) | Band window | What the player decides | Puzzles |
| --- | --- | --- | --- | --- |
| 1 | A 7 by 7 sea with a handful of islands | grown-up | Which facing pairs carry one or two planks; counting alone finishes it (`bycounting`) | 1 (7–9 islands) |
| 2 | A 9 by 9 sea | grown-up | The same, more islands; counting alone finishes it | 1 (11–14) |
| 3 | A busier 9 by 9 sea, where counting is not always enough | grown-up | Unique, but may need a trial or the connectivity rule | 1 (15–18) |
| 4 | A big 11 by 11 sea | grown-up | The same at 11 by 11 | 1 (19–24) |

`LEVELS = { grownup: { min: 1, max: 4 } }`, no `order`. **Content pool:** every sea is generated (`makePuzzle` grows islands and planks together, keeps a layout only if `solve` finds exactly one answer and, at levels 1–2, if propagation alone finishes it). Nothing varies but the layout: one look, one sea per round. **Accounting** (decided 2026-10-23): a plank beyond the answer is exploration, never a miss; only hints adapt the level. **Help:** `hintFor` names a plank to take off, else an edge one island fully decides (its number equals its room), else any plank the answer needs. **Couplings:** a ghost-finger `autotouch` and a couch `autoplay` both lay the answer's planks; the couch trip stop plays levels 1–3 (face-off `twin`, planks over par); the frozen **Island Hopping** course (`course.ts`, version 1, par 120) sits on the puzzle shelf. **Not built** (GAMES): a replay of the best way, a 13 by 13 size, hints that teach a named technique. **Person checks:** none open in [DEVICE-CHECKS](../DEVICE-CHECKS.md) for this game.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Nikoli, *Hashiwokakero* ([Wikipedia](https://en.wikipedia.org/wiki/Hashiwokakero), opened) | Paper pencil puzzle, since 1990 | Hand-set puzzles graded by the deduction they need; solvers mark finished islands and avoid "short circuits" (closed groups) | The connectivity rule as a named step: a bridge that would close a group off is wrong unless it finishes the sea (**level 6**) | — |
| Simon Tatham's *Bridges* ([manual](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/bridges.html), opened) | Free desktop/web puzzle collection | Width, height, difficulty, **max bridges per direction** (1–4), *allow loops*, island density, *expansion factor* | Max bridges as a level parameter (**level 7**, up to three planks); the faint possible-bridge lines (already built as dots); red marking of closed groups | A non-bridge marker and island locking (note-taking tools; see *Left out*) |
| Frozax, *Hashi Extreme Puzzles* ([App Store](https://apps.apple.com/app/id605682835), opened) | iOS app, 1,120 levels | Packs: Classic, Extreme, *More Bridges*, *More Directions*; free unlimited hints | *More Bridges* confirms three planks as a known variant; free hints | Video ads, paid packs, a star per level, diagonals |
| Conceptis, *Hashi: Bridges* ([App Store](https://apps.apple.com/us/app/-/id567583852), search description) | iOS app | Very easy to extremely hard, a weekly bonus puzzle | A very easy entry below the current 7 by 7 (**level 5**) | A weekly drop (a reason to come back on a schedule) |
| Linkdoku, *Hashi* ([App Store](https://apps.apple.com/us/app/hashi-linkdoku-bridges-puzzle/id1638725709), search description) | iOS app | Grids from 6 by 9 to 14 by 21 | Bigger seas exist, but only with pan or zoom; noted, not proposed now | Bonus-puzzle unlocks |
| Malik et al., *Solving Hashiwokakero with Hashi solving techniques and DFS* ([BEEI](https://journal.beei.org/index.php/EEI/article/view/227), search description) | Paper | Five named techniques: Just Enough Neighbor, One Unsolved Neighbor, Few Neighbor, Leftovers, Isolation; DFS for the rest | Plain-language names for the hints the solver already applies (**batch 1**) and for isolation (**batch 2**) | — |
| Andersson, *Hashiwokakero is NP-complete* (Information Processing Letters 109(19), 2009, via Wikipedia) | Complexity result | — | Why the generator keeps a guess-free filter for easy levels rather than promising every level is guess-free | — |
| Dots joined on paper (the game's own off-screen card) | Physical | Any number of dots | Already the off-screen suggestion | — |

No learning standard applies to a grown-up puzzle; AGENTS' rule that grown-up wording never claims a brain-training benefit holds for every line below.

## What makes sense here

The game is complete and fair; what it lacks is a way in, a reason for the hint to teach, and one new rule. Four things fit the built tap and stick actions:

- **A gentler first sea.** The ideas notebook already asks for "a 5 by 5 sea" offered first to a new player (the "Levels for what is already built" note in [IDEAS](../IDEAS.md)); appended easy entries now work through `order` and `entryLevels`, so this no longer needs renumbering.
- **Hints that say why.** The solver already reasons with "just enough room" and "one short of full"; saying the reason turns a hint into a technique the player can reuse.
- **Keep them joined.** Levels 1–2 never need the connectivity rule and levels 3–4 may need a trial; a level whose seas need exactly the isolation step (and no guessing) makes the rule the puzzle.
- **Three planks.** Tatham's max-bridges option and the *More Bridges* packs show it is a recognised variant; numbers run to twelve and the counting changes.

Owned elsewhere or deferred: Islands and Sea (Nurikabe) is a separate candidate reusing this game's grid ([IDEAS](../IDEAS.md)); the resilience case "one bridge washes out" is a Relay Cases puzzle ([networks study](subjects/networks-citizenship.md)); lettered **molecule seas** wait on the chemistry study's own definition ([chemistry](subjects/chemistry.md)). A school opening and a 13 by 13 sea each need their own definition (below).

**Long-term arc:** a grown-up opens on a 5 by 5 sea, learns the named counting steps, meets the connectivity rule as its own level, then the bigger seas and three-plank seas; couch play gets a frozen course of joined seas; a school opening may follow if its definition measures a fit at 100 units.

## Experience and presentation

- **First unsupported action:** a tap on the dotted water between two islands; on the 5 by 5 sea at least one island is a corner 1 or 2 with only one neighbour, so the first tap is a sure one.
- **Touch and consequence:** the plank pops in at once at a pitch set by the edge (`sfx.pop(4 + edge % 6)`), the island counts change, an island turns green when full. A bump (a crossing, a third plank, a full island) is a soft boing with nothing laid. Readiness returns immediately; there is no animation lock.
- **Variety without changing the rule:** seeded layouts already; batch 1 adds nothing cosmetic. A later dressing (a lighthouse on the island with the most planks, gulls on finished islands) is noted, not queued.
- **Reasoning versus motor:** every stretch of water is a cell at least 64 units across, and the 5 by 5 sea draws bigger; the thinking is in the counts, not the aim.
- **Supported ending:** Hint is always there and counts only as help; Start over clears without changing the count; one sticker per finished sea.
- **Co-play:** the built coplay hint ("ask which island has only one way to finish its number") gains spoken names from batch 1, so one person can point and the other say the reason.
- **Art example:** level 7's triple bridge is the existing plank drawing at three offsets (−9, 0, +9 units across the line) with the same `wood` rope strokes; batch 2's isolation hint rings the group that would close off with a dashed `Graphics` outline in `swatch` amber, drawn from the group's island centres, under the hint glow.
- **Needs a person or device:** whether a grown-up new to Hashi finishes the 5 by 5 sea without the card; whether the spoken technique names help or slow a practised player; whether two-digit numbers (10–12) read at 64-unit cells on an iPad.

## Proposed ladder

### Fresh content inside existing levels

**Named hints (batch 1).** `hintFor` gains the reason for a forced edge, using the solver's own propagation rather than the answer:

- `full`: the island's number equals the room it has left, so every open bridge carries all it can (the built `forced` case, now named *just enough room*; Malik's Just Enough Neighbor).
- `every-way`: the number is one short of the room (a 3 in a corner, a 5 on an edge, a 7 anywhere), so every open neighbour needs at least one plank (*one short of full*; the Few Neighbor case).
- `last-way`: one open neighbour is left, so the rest of the number goes there (*one way left*; One Unsolved Neighbor).

Each has its own voice line naming the ringed island and the lit bridge. A rule test asserts, on 300 seeds per level, that a named hint's condition holds on the board when given (the arithmetic, not just the solution), and the built test that following every hint from an empty sea lays exactly the answer still passes. Applies at every level; no bot change.

### New levels on top

| Level | Name | Band window | First round | What the player decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | A small sea to start | grown-up entry (order `[5, 1, 2, 3, 4]`, `entryLevels: [5]`) | 5 by 5, 4–6 islands, counting finishes it, at least one island with a single neighbour | Which pairs carry one or two planks | As built: bumps cost nothing, a stray plank is not a miss, hints count as help | Every level-5 sea has one answer, is `bycounting`, has 4–6 islands and a one-neighbour island; the sea draws with cells ≥ 64 (larger than level 1's) in portrait and landscape | A `PLANS` row and the order; `describeLevel`; how-to card step scope unchanged. Couch trip (levels 1–3) and course unchanged |
| 6 | Keep them joined | grown-up, after 2 (order `[5, 1, 2, 6, 3, 4]`) | 9 by 9, 12–15 islands; counting stalls, and one step of "this bridge would close a group off" unblocks it | Which bridge must stay empty (or carry the other way) so no finished group is sealed off | As built; the hint can now be `isolation`: the would-be closed group is ringed and the pet says a bridge there would cut those islands off | Every level-6 sea is not `bycounting` but is finished by counting plus isolation with no guessing (`byreasoning`); the isolation hint names an edge whose plank would close a full group short of every island | Solver: an isolation step in `propagate` behind a flag; generator filter (if 600 attempts rarely yield such a sea, fall back to authored seas checked by the solver, as `course.ts` does); one voice line; the dashed group ring. Couch untouched |
| 7 | Up to three planks | grown-up, after 6 (order `[5, 1, 2, 6, 7, 3, 4]`) | 9 by 9, 11–14 islands, up to three planks a pair, numbers 1–12, counting finishes it | One, two or three planks on each pair | A fourth plank bumps; otherwise as built | With `maxPlanks: 3`, the solver agrees with a brute force over every assignment on small layouts; every level-7 sea has one answer, is `bycounting`, uses at least one triple; `MAX_PLANKS` stays 2 for levels 1–6 | `maxPlanks` on the plan threaded through `layoutOf`/`canAdd`/`solve`/`trouble`/`hintFor`; triple-plank drawing; two-digit numbers at 64-unit cells; the couch controls already allow a third push. Couch trip unchanged |

### Younger-band openings

A **school opening** (about 9–12, by standing rule S2's "older content at the top of school") would need 100-unit cells (a 5 by 5 sea is 500 units, a 7 by 7 is 700 of the 768-unit short side before the buttons), a home land in Wonder Woods without moving the grown-up game out of Lantern Lake (a game is in exactly one land), a sticker and level-scoped how-to steps, and an accounting check against the island's "mistakes teach" rule (a stray plank stays exploration). That is a definition, not a build: queued as **define Island Bridges school opening** (docs only). Nothing younger.

### Easier entries and levels between existing ones

Level 5 is the appended easy entry (stable ID, placed first by `order`, declared in `entryLevels`). Level 6 sits between 2 and 3 by `order`. No saved level or pin moves; no decision is open.

### Left out on purpose

- **Diagonal bridges** (*More Directions*): new crossing geometry and diagonal stretches narrower than 64 units on a square cell.
- **A no-loops rule** (Tatham's *allow loops* off): rarely visible to the player, and it would change what "one answer" means for the frozen course.
- **A non-bridge marker and island locking** (Tatham): note-taking tools that add a third touch mode beside Take off; revisit only if a person check shows grown-ups want them.
- **A 13 by 13 sea**: 13 cells at 64 units is 832, past the short side, so it needs pan or zoom that does not steal taps from the water; it needs its own definition and is not queued.
- **Stars, timers, weekly drops, ads, paid packs** from the apps.
- **Molecule seas**: the chemistry study's definition, not this dive's.

## Decisions for the developer

None. The school opening is a definition under S2/S8, not a developer call; the 13 by 13 sea is deferred to a definition.

## Build slices, in order

1. **A small sea to start and named hints (batch island-bridges 1).** Level 5 (order `[5, 1, 2, 3, 4]`, `entryLevels: [5]`) and the `full`, `every-way` and `last-way` hints with their voice lines. *Check:* new level on the existing interaction: typecheck, the game's rule tests, one browser play of level 5 with one hint (its named line), `fingerdemo` at 5.
2. **Level 6, Keep them joined (batch island-bridges 2),** after batch 1 (shares `hintFor`'s kinds and the order). The isolation step, generator filter, `isolation` hint and its ring. *Check:* typecheck, rule tests, one play of level 6 asking for hints until the isolation one (ring and line), then to the sticker; one portrait screenshot of the ring; `fingerdemo` at 6.
3. **Level 7, Up to three planks (batch island-bridges 3),** after batch 2 (shares the order). *Check:* new rule on the existing tap: typecheck, rule tests including the brute force at three, one play of level 7 with a third plank tap and a fourth that bumps, to the sticker; one portrait screenshot of a triple bridge; `fingerdemo` at 7; `BROWSER_SUITE=couchgames` filtered to Island Bridges, since the shared rules change.
4. **Couch course *Joined Seas* (batch island-bridges 4),** after batch 2: five frozen level-6 seas (each with one answer, none `bycounting`) as a second `course.ts` entry, version 1, beside Island Hopping. *Check:* couch catalog tier: typecheck, course tests, `BROWSER_SUITE=couchgames` filtered to Island Bridges.
5. *Define:* **Island Bridges school opening** (docs only; see *Younger-band openings*). *Not queued:* a 13 by 13 sea (needs its own definition).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
