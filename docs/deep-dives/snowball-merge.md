# Snowball Merge deep dive

*ID `snowball-merge` · band grown-up · levels 1–3 on 2026-11-09 · session `claude/snowball-merge-dive` ([PR #1447](https://github.com/rjdunlap/neo/pull/1447))*

## The game today

A grown-up taps one of four arrow buttons and every snowball on a 3×3 snowfield slides toward that edge; two equal neighbours join into their doubled number, at most once per slide. Nothing new ever arrives, so the board is a finite puzzle: bring every snowball together into one that shows the target. It is the "2048 without new tiles" variant, a planning puzzle about **which pairs to join first and where to make room**, with doubling as the arithmetic underneath. It lives in Lantern Lake, touch only, with no couch entry (`src/couch/catalog.ts` and `courses.ts` never mention it); younger players reach it behind the land's signpost and play level 1.

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Make 16 · open snowfield | grown-up | Any reasonable order works: 2, 2, 4, 4, 4 on an open board, shortest route 3 slides |
| 2 | Make 32 · choose your pairs | grown-up | Which equal pairs to join first among 2s, 4s and 8s; shortest route 6 |
| 3 | Make 64 · make room first | grown-up | A nearly full board (8 of 9 cells): open a space before the big ones can meet; shortest route 8 |
| 4 | Make 128 · the big snowball | grown-up | Three 32s: work out which one waits; shortest route 10 |
| 5 | Make 64 · the ice rock | grown-up | A rock that never moves or joins: snowballs stop beside it, so choose which side a pair meets on; shortest route 11 |
| 6 | Build a snowman · keep the 16s apart | grown-up | Three 16s on a board of 48: when to stop merging, because two 16s that meet join into a 32 and nothing unjoins; shortest route 8 |

`BandLevels`: `grownup 1–6`, no `order`, no `entryLevels`.

**Content pools.** (Written before slice 1; levels 1–5 now have four frozen boards each in `boards.ts`.) One frozen board per level (`PLANS` in `logic.ts`). `makePuzzle` turns and mirrors it with the seeded RNG, but every plan board is mirror-symmetric, so the eight transforms collapse to **4 distinct boards per level**, and all four are the same puzzle turned around. The rule test's `variants.size >= 4` is met exactly. Counted for this dive with a port of `slide`/`solve`: level 1 reaches 33 states and **none** is a dead end (the round cannot go wrong); level 2 reaches 48 states, 12 of them dead ends; level 3 reaches 213, 26 dead ends.

**Rules today.** An arrow that moves nothing boings and says `snowball.still`; it counts nothing (exploration). A slide that leaves no finishing route says `snowball.stuck` and the status line suggests Undo or Start over. Hint glows the first arrow of a shortest route from the *current* board (breadth-first `solve`, rerun on every `refresh`), or Undo at a dead end; a hint already glowing is counted once. Start over counts as a hint, since it is support. Undo is free and keeps up to 100 steps. The round finishes with `ctx.finish({ misses: 0, hints })`. The ghost-finger bot taps the solver's next arrow.

**Known gaps.**
- **No automatic glow.** `misses` is always 0 and nothing lights on its own: not after repeated inert arrows, not on a dead end. The rules for every activity ask for a glow after two misses; Log Roll's glow after two refused rolls is the precedent. Here the natural trigger is reaching a dead end (glow Undo) and, separately, two inert arrows in a row (glow the route's next arrow); the first counts as a hint only once, by the existing `hinted` guard.
- **Two shades only.** Snowballs are blue below 16 and purple from 16 up, so 16, 32 and 64 look alike apart from the number; a 128 would too.
- **Snowballs teleport on merge.** Both inputs tween to the target cell, then the board redraws: there is no join moment (a squash, a puff, the doubled ball growing).
- **Fixed layout.** `cell = min(128, (v.h - 430) / 3)` and the arrow and button rows use fixed widths around the centre. Phone-upright [batch 4](../definitions/phone-portrait.md#game-batches) owns the upright pass; any larger board should derive the cell from `SIZE` in the same place so that pass stays small.
- **Replay variety** is the four turned copies above.
- **Person checks** are already listed in [DEVICE-CHECKS](../DEVICE-CHECKS.md) under "Recovered grown-up puzzles": real-iPad touch, speech, adult enjoyment and whether once-per-slide merges are understood.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [2048](https://www.wikipedia.org/wiki/2048_(video_game)) (Cirulli, 2014) | Endless slide-and-merge on 4×4 | No levels: a random 2 or 4 arrives after every move, and the score climbs until the board jams | The slide rule, once-per-slide merges, the doubling numbers | Random arrivals, the score, the board-full game over |
| [Threes!](https://en.wikipedia.org/wiki/Threes) (Sirvo, 2014) | Endless slide-and-merge | Tiles move one step, not to the wall; 1 + 2 make 3, then equal multiples of three join; the next tile is previewed | One-step slides as a later rule (it changes the whole feel), the visible preview as a planning aid | The endless arrival stream and final score screen |
| [Threes!, Fives, 1024! and 2048 are Hard](https://arxiv.org/abs/1505.04274) (Langerman and Uno, 2015) | Analysis | Shows the offline versions are NP-hard even when the arrivals are known | A reason to keep boards tiny and frozen so the solver stays exact | — |
| [2048 Without New Tiles Is Still Hard](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.FUN.2016.1) (Abdelkader, Acharya and Dasler, FUN 2016) | Analysis of exactly this variant | Proves that deciding whether a finite board (no arrivals) can reach a target is NP-complete | Confirmation that the game's rule is a real puzzle, and that difficulty comes from board size and count; hence frozen, solver-checked boards | Large boards, where an exact hint would no longer be cheap |
| [A Good Snowman Is Hard to Build](https://draknek.itch.io/a-good-snowman) (Draknek, 2015) | Calm snow puzzle | Few rules on small gardens: snowballs are pushed and stacked big, medium, small into a snowman | The theme and finish: build a snowman out of the snowballs you made (a two- or three-ball goal) | Its one-way growth (a rolled ball cannot shrink), which only Undo rescues |
| Counters on a paper 3×3 grid | Physical play | A grown-up slides a row and doubles equal neighbours | Already the game's off-screen line | — |

Snowball Merge teaches no school skill to grown-ups and the grown-ups' page claims none; doubling and planning are named as what it asks for. A school opening (below) would teach doubling facts and would need its own source check.

## What makes sense here

The solver is an exact breadth-first search over a finite state space, and it stays exact and fast only while boards are small and frozen ([FUN 2016](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.FUN.2016.1)). That orders everything:

- **Keeps the solver as it is:** more frozen 3×3 boards per level, a bigger target on 3×3 (128), a frozen ice rock that never moves and splits a line, and a snowman goal (two or three snowballs of given sizes rather than one).
- **Costs solver work:** a 4×4 field (state spaces grow sharply; solve once per board into a distance map rather than on every refresh) and Threes-style one-step slides (a different `slide`, a different feel).

So the arc is real variety inside levels 1–3, then 128 on the same field, then one new object (the ice rock), then the snowman finish, then a 4×4 field only if a person wants more. Random arrivals, scores and the jammed-board ending stay out: in this game a dead end is a moment for Undo, which the status line already says. A par may be shown after finishing as information only ("the shortest route is 8 slides"), never a star or a gate.

Searched for this dive with a port of `slide`/`solve`: random solvable 3×3 boards summing to 64 have shortest routes from 2 to 12 slides, and boards summing to 128 reach 14 (for example `8,16,2 / 4,2,32 / 0,32,32`, 135 reachable states, 36 dead ends), so a level 4 at 128 needs no model or layout change.

## Experience and presentation

- **First unsupported action:** tap any arrow. On level 1 no slide can strand her, so a newcomer learns the rule by trying.
- **Touch and consequence:** the arrow tile rings white at touch-down. Proposed: when two balls join, the pair squashes into each other over the last 0.06 s of the slide, a small `ctx.particles` puff of white flakes rises, and the doubled ball pops in at 1.15 scale and settles; the bell's pitch already rises with merges in a slide (`sfx.bell(2 + merges)`).
- **Concrete art example:** each size gets its own look from the palette (2 and 4 small pale `swatch.blue`, 8 `teal`, 16 `purple`, 32 `pink`, 64 `yellow` with a scarf stripe, 128 a little snowman face drawn with three `Graphics` dots), and the drawn radius grows a few percent with each doubling, capped so the number stays legible and the ball inside its cell.
- **Variety on replay:** several frozen boards per level, picked and turned by seed; seeded field looks (morning snow, blue dusk with drawn stars, falling flakes on a slow drift that never touch play). Varying the board never changes the level's depth band.
- **Reasoning versus precision:** no timing or aiming; the challenge is foreseeing which pairs meet. The slide counter supports that without memory load.
- **Supported ending:** Hint whenever she asks, the proposed automatic glow at a dead end, free Undo, Start over, and one sticker even when helped. The status line counts slides; nothing counts down.
- **Co-play:** one predicts which pair joins, the other taps; the current co-play line already says so. Solo play stays complete.
- **Needs a person:** whether the join animation makes "once per slide" obvious; whether level 3 and a 128 level feel satisfying or merely long; whether swiping on the field would feel better than the buttons.

## Proposed ladder

### Fresh content inside existing levels

- **Boards:** a generator script (`scripts/snowball-merge-boards.mjs`) searches seeded random boards and freezes **four boards per level** into `src/games/snowball-merge/boards.ts`, the current plan first, each solvable at the level's depth band (level 1 three to four slides with no dead end reachable; level 2 five to seven; level 3 seven to nine, with at least one dead end reachable), and at least two not mirror-symmetric, so turns give up to 8 copies each. The variants rule test rises to at least 12 per level.
- **Looks:** per-size colours and the join moment above; three seeded field looks.
- **Glow:** a dead end lights Undo and two inert arrows in a row light the route's next arrow, each counted as a hint once (the existing `hinted` guard), with tests.
- **Par line:** after finishing, the status shows the shortest route beside her slide count, as information only.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *Make 128 · the big snowball* | grown-up | A frozen 3×3 board summing to 128 with 32s on it, shortest route 10 to 14 | Which of three 32s waits while the small ones build a fourth | As today, plus the slice-1 glow | Every frozen board solves to 128, shortest route in the band, at least one dead end reachable, hint path shrinks by one per step | `PLANS`/boards entry and range 1–4; the 128 look; no voice change (`{target}` is spoken); `fingerdemo` at 4 about 6 s |
| 5 | *The ice rock* | grown-up | A 3×3 board with one frozen rock (drawn grey-blue, never moves) in a cell; snowballs pack against it | Which side of the rock each pair must meet on | A slide into the rock just stops, no miss; `snowball.rock` says "the ice rock never moves; snowballs stop beside it" | The rock never moves and never merges; a line splits at it; conservation holds; every board solvable; levels 1–4 unchanged | Model change in `slide` (a rock value, lines split into segments); rock art; one voice line and a how-to step |
| 6 | *Build a snowman* | grown-up | A board of snow summing to 48 whose goal is three 16s (built 2026-11-11; the first draft said a 32 and a 16, see the slice 4 note below) | When to stop merging: two 16s that meet join into a 32 and nothing unjoins | A join too many says `snowball.over`, lights Undo (one hint, never a miss); hints stop at the snowman | `complete` accepts exactly the goal multiset; `overshot` is never true for a one-snowball goal; levels 1–5 unchanged | `Goal` on the plan; the finish stacks the three balls into a snowman; `snowball.go.snowman`/`over`/`done.snowman` lines and a level-scoped how-to |
| 7 | *A wider field* | grown-up | A frozen 4×4 board summing to 128 | Longer plans on more room | As today | Every frozen board's distance map is exact; `SIZE`-independent slide tests pass on 3×3 and 4×4 | `SIZE` per plan, layout from board size, a distance map built once per board instead of `solve` on every refresh; after the upright batch 4 pass |

### Younger-band openings

A `school` opening (doubling facts to 16) is plausible: a 2×3 or 3×3 board of 1s, 2s and 4s with a two-slide route, a shorter spoken instruction and the target shown as dots beside the number. It needs a curriculum source check and a decision on band, land and accounting, so it waits.

### Easier entries and levels between existing ones

None for the grown-up band: level 1 cannot go wrong and is already a gentle entry. The school opening above would be appended (level 8, placed before 1 with `order` and listed in `entryLevels`) if decided.

### Left out on purpose

- Random arrivals, scores, high scores and the full-board game over (2048, Threes).
- Move limits, timers or "best" stars; the par line stays information.
- Physics drops (fruit-merging games): aiming and luck, not planning.
- Threes-style one-step slides: a second rule set the same game would teach badly; noted for a separate game if ever wanted.

## Decisions for the developer

1. **Open a school level (doubling to 16) with a short instruction, behind a source check?** Lean: later, after a child plays level 1 once; it costs a level row, `order`/`entryLevels`, a voice line and dot art.
2. **A controller or couch course for Snowball Merge?** Lean: skip; couch play retires at Lands stage E, and a d-pad only duplicates the arrows.
3. **Swipe on the field as well as the arrow buttons?** Lean: yes as an addition after a person says whether buttons feel slow; it follows the [input pitfalls](../DESIGN.md#input-and-rendering-pitfalls).

Slices 1–4 go ahead regardless.

## Build slices, in order

1. **Boards, looks, the join moment, the glow and a par line** (built 2026-11-10, PR #1483). The board generator script `scripts/snowball-merge-boards.ts` and four frozen boards per level; per-size colours and the join squash, puff and pop; three seeded field looks; the automatic glow at a dead end and after two inert arrows, counted once; the par line after finishing. Checks: existing-game change on the existing interaction: typecheck, rule tests (variants at least 12 per level, depth bands, level 1 has no reachable dead end, glow counted once), one filtered `BROWSER_SUITE=snowball` play at level 3 with one portrait screenshot in a new look, `fingerdemo` at 3 (the bot waits for the join); build only if shared files change.
2. **Level 4 *Make 128*** (built 2026-11-10, PR #1492). Frozen 3×3 boards at 128, range 1–4, the 128 look. Checks: new level on the existing interaction: typecheck, rule tests, one browser play of 4, `fingerdemo` at 4. After slice 1.
3. **Level 5 *The ice rock*** (built 2026-11-11, PR #1495). The rock in `slide`, its art, voice line and how-to step; range 1–5. Checks: model change: typecheck, rule tests with levels 1–4 unchanged, one browser play of 5 with one slide against the rock, one portrait screenshot, `fingerdemo` at 5, build.
4. **Level 6 *Build a snowman*** (built 2026-11-11, PR #1498). Goal kinds, the stacked finish, voice and how-to; range 1–6. Checks: typecheck, rule tests with levels 1–5 unchanged, one browser play of 6 with one overshoot and Undo, one portrait screenshot, `fingerdemo` at 6.
5. **Level 7 *A wider field*** (after phone-upright batch 4 has reworked the layout): per-plan size and a cached distance map. Checks: shell-free new interaction tier: typecheck, unit tests, one scripted play, one portrait screenshot, `fingerdemo` at 7, build.

The school opening, couch course and swipes (decisions 1–3) are gated and stay out of the ready list.

## What was built in this session

Design only at first (`check-links` and `git diff --check`). Slice 1 was built 2026-11-10 (PR #1483) and slice 2 the same day (PR #1492, below):

- `scripts/snowball-merge-boards.ts` freezes four boards per level into `src/games/snowball-merge/boards.ts`, the authored plan first and the rest picked, turned and mirrored by seed. Route depth: level 1 3–4 with no reachable dead end, level 2 5–7, level 3 7–9 with a reachable dead end.
- Per-size looks (2 and 4 blue, 8 teal, 16 purple, 32 pink, 64 yellow with a scarf stripe); the 128 snowman face is left for slice 2.
- Join moment: squash over 0.06 s, a white puff, the doubled ball pops in at 1.15 and settles. Three seeded field looks: morning, dusk (stars) and flurry (slow flakes that never touch play).
- Automatic glow: a slide into a dead end lights Undo and the pet says the stuck line; two inert arrows in a row light the route's next arrow. Each counts as one hint, once (`nextHelp` in `logic.ts`); asking while something glows counts nothing; Restart still counts as help.
- Par line after finishing: "N slides · the shortest route is M", information only. `howto.ts` updated.

Slice 2, level 4 *Make 128* (PR #1492):

- `PLANS` gains level 4 "Make 128 · the big snowball", authored board [32,32,32,16,8,2,2,4,0] (shortest route 10); the grown-up range is 1–4.
- `scripts/snowball-merge-boards.ts` gains a level-4 band (route 10–14, 7–8 snowballs, a reachable dead end, at least two 32s); three more frozen boards were generated, each route 10; levels 1–3 boards are unchanged.
- The 128 is a white snowball with a scarf and two coal eyes; the radius step is 1.3 per doubling (was 1.6) so 128 still grows and fits the cell (64 is 40.5, 128 is 41.8). No voice or how-to change ({target} is spoken).

Slice 3, level 5 *The ice rock* (PR #1495):

- `logic.ts`: `ROCK = -1`, a cell that never moves and never joins. `slide` splits each row or column at a rock into stretches that pack on their own, so snowballs behind it stop beside it; it returns `rocked` when a snowball ends a slide resting against a rock. `PLANS` gains level 5 "Make 64 · the ice rock", authored board [16, ROCK, 8, 0, 16, 8, 4, 8, 4] (shortest route 11); the grown-up range is 1–5.
- `scripts/snowball-merge-boards.ts` gains a level-5 band: route 8–11, 6–7 snowballs, a reachable dead end, one rock, and at least three slides of the shortest route that rest a snowball against it. Three more boards frozen (routes 8, 8 and 11; two edge rocks, one corner rock); levels 1–4 boards are unchanged byte for byte.
- **Decision: the rock is never in the centre.** Sampling showed a centre rock leaves most boards unsolvable and the rest at 3–6 slides, too short for the band.
- `index.ts`: the rock is a grey-blue ice block drawn with the field in `resize()`. The pet says `snowball.rock` ("The ice rock never moves. Snowballs stop beside it.") once per round, the first time a slide rests a snowball against it; stopping at the rock is no miss and no hint.
- `howto.ts`: step 2 is level-scoped: levels 1–4 keep the old line; level 5 says the rock never moves or joins and to choose which side a pair meets on.
- Rule tests (10): rock never moves or joins, a line splits at it, `rocked` only when a snowball rests against it, conservation along every seeded level-5 route, the shortest route rests on the rock at least 3 times, every level-5 board has a reachable dead end, one rock per board never in the centre, levels 1–4 plans and frozen boards pinned to their old values. The `snowball` browser suite gained a level-5 play at 390 × 844 (rock stays put on every slide, rock line said on the first slide against it, one sticker, 0 misses, 0 hints).

Slice 4, level 6 *Build a snowman* (PR #1498):

- `logic.ts`: a goal can be several snowballs (`Goal = number | readonly number[]`, `SNOWMAN = [16,16,16]`, `goalOf(plan)`). `complete(board, goal)` accepts exactly the goal multiset; `overshot(board, goal)` is true when, at the biggest size where field and goal differ, the field holds more (always false for a one-snowball goal); `solve` and `explore` take a goal and `makePuzzle` returns it. `PLANS` gains level 6 "Build a snowman · keep the 16s apart", target 48 (the snow on the field), authored board [4,8,2,0,2,8,16,8,0] (shortest route 8); the grown-up range is 1–6.
- **Decision: the goal is three 16s, not the dive's 32 and 16.** A goal of different sizes can never be overshot (48 as 32 + 16 is the only way it can end, and a 32 and a 16 cannot join), so "when to stop merging" would be no decision at all; sampling 6,000 boards found no overshooting slide along shortest routes for 32 + 16, 32 + 16 + 16, 32 + 32 or 16 + 16 + 8. Equal snowballs at the goal's biggest size make it real. The sum stays 48.
- `scripts/snowball-merge-boards.ts` gains a level-6 band: route 6–9, 6–7 snowballs made by halving the goal's own snowballs, a reachable dead end, and at least two slides on offer along the shortest route that would overshoot. Three more boards frozen (routes 7, 6, 6); levels 1–5 boards are unchanged byte for byte. Most reachable states of a level 6 board are dead ends, so it is a tight planning level.
- `index.ts`: title "Snowman: 16 + 16 + 16"; a join too many says `snowball.over` instead of `snowball.stuck`, the status line reads "One join too many: Undo takes it back.", and Undo lights on its own (one hint, as every dead end; never a miss). The finish rolls the three snowballs to the middle column and stacks them (drawn 1.15, 1 and 0.85 scale, coal eyes and a carrot on the top one), then `snowball.done.snowman` and one sticker.
- `voice.ts` gains `snowball.go.snowman`, `snowball.over` and `snowball.done.snowman` (no pre-rendered clip yet; device speech is the fallback). `howto.ts`: step 2 and the finish line are level-scoped for level 6 (the card stays under the 840-character limit).
- Rule tests (14 in all, 4 new): level 5 pinned as it was with one-snowball goals for levels 1–5; the snowman goal accepts exactly three 16s anywhere; `overshot` versus merely stuck, and every reachable overshot level-6 board is a dead end; every level 6 board offers the join too many along its shortest route and hints stop at the snowman. The `snowball` browser suite plays level 6 at 390 × 844 (one join too many, Undo lights and takes it back, exactly three 16s stacked in one column, one sticker, 0 misses, 1 hint).
