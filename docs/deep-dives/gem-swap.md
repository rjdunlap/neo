# Gem Swap deep dive

*ID `gem-swap` · band grown-up · levels 1–4 on 2026-11-07 · session `claude/dive-gem-swap` ([PR #1367](https://github.com/rjdunlap/neo/pull/1367))*

## The game today

A grown-up clears a finite tray of coloured shapes by swapping two occupied neighbours into a row or column of three or more matching gems. Every line that forms disappears at once, the gems above fall straight down, and any line made by the fall clears as a visible cascade wave. **No gems refill the tray** and nothing is timed, so every tray is a small finite puzzle: the question is not "find any match" but "which match leaves the rest clearable". The tally shows gems left, swaps made and the tray's exact shortest route ("best"). The purpose is **planning with gravity**: predicting where gems land after a line goes and ordering the swaps so nothing gets stranded. It was built for roadmap step 8b ([build note](../archive/COMPLETED-2026-10-09.md#gem-swap-2026-10-12), PR #235), lives in Lantern Lake (`region: 'puzzle-peaks'`, `challenge: 'space'`) and is one of the couch catalog's grown-up games.

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Six gems: one swap clears two lines | grown-up | The one swap that makes a line and lets a second line fall into place (4×4, par 1) |
| 2 | Twelve gems: plan two swaps and falling lines | grown-up | Which of several legal swaps keeps the second line possible (4×4, par 2) |
| 3 | Fifteen gems: plan three swaps through the gaps | grown-up | A three-swap order on a 5×5 tray, with dead-end swaps available (par 3) |
| 4 | Eighteen gems: plan four swaps and cascades | grown-up | A four-swap order where cascades do part of the work (5×5, par 4) |

`BandLevels`: `grownup 1–4`, no `order`, no `entryLevels`.

**Content pools.** `boards.ts` holds **three frozen trays per level** (twelve in all), each tested for no starting match, settled gravity, the stated gem count and an exact par checked by an independent breadth-first search (`logic.test.ts`). `makePuzzle` picks one, mirrors it left/right half the time and permutes the six shape/colour kinds (`RAINBOW` colours with matching `SHAPES`, so colour is never the only cue). Mirroring and recolouring change how a tray looks but not its structure: a frequent player meets the **same six layouts** a level and will start recognising them within a session or two. The tray has **one look** (light purple cells) and one sound pair (`sfx.pop(2)` on the swap, `pop(3)` on each wave).

**Rules today.** A swap must be between occupied neighbours of different kinds and must make a line at once; otherwise it stays put, boings, says `gem-swap.miss` and counts a miss. Two rejected swaps in a row show one hint. Hint outlines the first swap of a shortest route from the *current* board (`solve`, a memoised exact search), so it follows alternative routes and revisions. When no clearing route remains, the line says so and offers Undo or Restart; Hint then restarts. Undo is free and unlimited; Restart counts as help. `finish` reports misses, hints and `score = swaps − par`.

**Couch.** `COUCH_INFO['gem-swap']`: turns, twin face-off on identical seeded trays, lower "swaps over the best route" wins, trip stops map to levels 2–4, demo at 2. There is no frozen course, which the roadmap's [step 8b](../ROADMAP.md) still lists as a proposal beside a "Zen refill mode".

**Known gaps.**
- **Variety:** six layouts a level, one look, cascades that blink in place rather than fall.
- **A short ladder:** four levels, the last only 18 gems on 5×5. A grown-up who enjoys it reaches the top in one sitting.
- **The fall is not shown.** `draw()` pulses the removed gems' alpha, then the next wave's board simply replaces the last. The game is about predicting the fall, and the fall itself is invisible.
- **Solver budget.** `solve` explores every accepted swap with memoisation. That is instant at 18 gems on 5×5; larger trays need the par frozen offline and the hint search shown to stay bounded from every reachable state.
- **Layout.** Cells are `min(108, (w − 180)/size, (h − 290)/size)`: 108 units on 4×4 and about 95 on 5×5 at 1024×768; a 6×6 tray would be about 80 (fine for grown-up's 64, not for a child's 100).
- **No person has judged it:** device speech, enjoyment and real controllers are open, as for every Lantern Lake puzzle.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Shariki](https://en.wikipedia.org/wiki/Shariki) (1994) | The first swap-three game | Endless refill, score | The bare rule: swap two neighbours, three in a line clear | Endless scoring |
| [Bejeweled 3](https://en.wikipedia.org/wiki/Bejeweled_3) (PopCap, 2010) | Refilling match-three | Classic ends when moves run out; Zen is endless and "impossible to run out of moves"; Lightning has a one-minute limit; Quest has 40 set challenges | Set challenges with one twist each (Quest); a calm untimed tone | The timer (Lightning), endless refill as the main game, points as the goal |
| [Candy Crush Saga](https://en.wikipedia.org/wiki/Candy_Crush_Saga) (King, 2012) | Saga of goal levels | Fixed move limits; goals (collect candies, bring ingredients down, clear jelly under candies); blockers such as licorice locks and chocolate | Goals other than "clear everything"; a cell feature that changes the order of play (jelly, locks) | Move limits that fail a level, five lives that regenerate every half-hour, bought moves and boosters, friend requests |
| [Tetris Attack](https://en.wikipedia.org/wiki/Tetris_Attack) / Panel de Pon (1995–96) | Swap-to-match, puzzle mode | Puzzle Mode: clear all blocks of a "preset block arrangement" within a set number of moves, and the blocks do not rise | **The closest model**: a fixed arrangement, clear it all, a move count. Ours shows the count as a par instead of a limit | Rising stacks, the versus garbage, a move limit that fails |
| [Puyo Puyo](https://en.wikipedia.org/wiki/Puyo_Puyo) (Nazo Puyo, Mission mode) | Set-up boards with goals | Each puzzle sets a board and a goal (the page does not list them; the series is known for chain goals) | A goal stated as a cascade: "make the fall clear a second line" | Falling-piece timing |
| [Zoo Keeper](https://en.wikipedia.org/wiki/Zoo_Keeper_(video_game)) (Robot Communications, 2003) | Timed swap-three | Quotas per animal under a timer | Pictures that read without colour (our shapes do this) | The timer |
| Physical: counters on a grid | Off-screen version | — | Already the game's `offScreen` line: exchange neighbours, slide counters into gaps | — |

No school skill is claimed. The grown-up's page names what it asks ("plan swaps and predict falling gems") and makes no brain-training claim; that stays.

## What makes sense here

The finite, no-refill tray is already the right core: it is Panel de Pon's puzzle mode without the move limit, and it makes every swap a plan rather than a lucky find. Growth should keep the tray finite and add **one new thing to reason about per level**:

- **Bigger trays** (6×6) for longer plans. Frozen offline, since the live solver is only proven on 5×5.
- **Long lines and crossings**: the rules already clear runs of four or five and an L or T crossing in one swap, but no tray needs one. A level whose every shortest route uses one teaches that a single swap can do more.
- **Stones that do not fall** (fixed ledges). Gems above a stone rest on it, so a column splits into two stacks. This is the most meaningful new rule: it changes the gravity prediction itself. It is a model change to `fall`.
- **Iced gems**: an iced gem cannot be picked until a line clears beside it, which thaws it. This is Candy Crush's lock without the pressure: it forces an order. Also a model change.
- **A frozen couch course** of the hardest trays, matching the other grown-up puzzles' courses.

What does **not** fit: move limits that fail a tray (par stays a target, never a wall), lives, boosters, timers, endless refill as the main game, and points for big combos (cascades are pleasant, but the score stays swaps over par). A **Zen refill mode** is left out on purpose (below) and kept as a developer decision because the roadmap names it.

**Long-term arc.** Grown-up only today. Levels 1–2 are 4×4 trays at 108-unit cells, a size and a rule (one or two swaps, no reading) that suit the school band. Opening 1–2 to school would give 6–8-year-olds a planning puzzle beside Fruit Sums and Mossy Path. That is a band decision for the developer, and level 3's 95-unit cells keep it out of a school window unless its layout changes.

## Experience and presentation

**First unsupported action.** At level 1 the tray has six gems and exactly one swap that clears. A grown-up taps a gem (blue ring at once, `sfx.tick`), then its neighbour, and the line goes. The second line falls into place and clears on its own: the "oh, it does that" moment the level is named for.

**Touch and consequence.** Touch-down on a gem rings it immediately; a rejected swap leaves both gems in place with a boing and a spoken reason. The weak point is the consequence: removed gems pulse, then the board jumps to its settled state. **Concrete art and feel example:** in `update()`, tween each surviving gem's `picture.y` from its old row to its new one over 0.25 s with `ctx.tw` (the wave already holds both boards, so the moves are derivable per column), give each landing a 3-unit squash (`scale.y` 0.9 → 1), and play the waves on rising pentatonic steps (`sfx.pop(3 + wave)`), so a three-wave cascade sounds like a little run up the scale. The tray cell colour comes from a seeded **look**: lantern night (indigo cells, yellow rims), autumn (warm orange), first snow (pale blue), all from `swatch` in `src/art/palette.ts`.

**Variety without changing the rule.** More frozen layouts (20 a level from a generator script), mirroring, recolouring and the looks. Rule and par stay fixed per level.

**Reasoning, not reading or precision.** The board never needs reading (the tally is for the grown-up and the couch score). Cells are 95–108 units with taps, not drags, so precision is not tested. Memory load is low: the whole tray is visible and Undo is free.

**Supported ending and replay.** Hint always leads to a clearing swap from the current board; a dead end is named and fixed by Undo or Restart. The round ends on a cleared tray with one sticker and the shell's celebration, whatever the swap count. Comparing with "best" is an invitation, never a gate.

**Co-play.** On the couch two players take turns on twin trays. On touch, the existing `coplayHint` (predict which gems fall; compare two swaps before choosing) gives a watcher a role: say where the gems will land, then swap and see.

**For a person or device.** Whether the falling tween reads at a glance; whether stones and ice are clear without words; enjoyment over several sessions; real controllers and device speech.

## Proposed ladder

### Fresh content inside existing levels

- **20 frozen trays a level at 1–4** (from 3), written by a new `scripts/gem-swap-trays.mjs` that builds trays by search and keeps one only when the independent breadth-first par equals the level's par, it has no starting match, it is settled, and at least one accepted first swap is a dead end at levels 2–4 (so planning matters). The existing three stay first in each pool, so the trays already reviewed keep their place (boards are never saved, so no save depends on the order).
- **Three looks**, seeded per round, plus the falling tween and rising cascade steps above.

Rule test: every pooled tray passes the existing checks; ≥ 20 per level; at levels 2–4 each tray has a dead-end first swap and a cascade on some shortest route; at least 30 distinct boards over 60 seeds (already asserted; raise to 60 distinct over 120 seeds).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Six by six: five swaps | grown-up | A 6×6 tray of 24 gems, par 5 | A five-swap order across a wider tray | As today | Each frozen tray's par by independent breadth-first search; `solve` from every state reachable on the stored route finishes under a node budget (counted, asserted); no starting match | Cells about 80 units at 1024×768; a tray generator run; couch trip mapping may move stop 4 to 5 (catalog `level`), a couch-catalog check |
| 6 | One swap, a long line | grown-up | A 5×5 tray, 18–21 gems, par 3–4, where every shortest route uses a swap that clears four or five in a row or an L/T crossing | To look for the swap that does two lines' work | As today; Hint shows that swap when it is next | For every tray, every shortest route (enumerated) contains a swap whose first wave removes ≥ 4 cells; routes avoiding it are longer | Content only: no rule change, since `matches` already handles runs and crossings |
| 7 | Stones that stay | grown-up | A 5×5 tray with two grey stones (cells that never move or clear); gems above a stone rest on it | Where gems land when a column is split by a stone | A swap with a stone is refused like a hole, without a miss (it is not a swap she could make); hints as today | `fall` with stones keeps each segment's order and never moves a stone; levels 1–6 trays give identical `fall`/`swap` results; pars exact | Model change in `logic.ts` (a stone value, e.g. −2); drawing a stone; voice line; how-to card; the couch bot is unchanged (it follows `solve`) |
| 8 | Iced gems | grown-up | A 5×5 tray with two iced gems; a line clearing next to (orthogonally beside) an iced gem thaws it | Which line to clear first so the iced gem can move | Tapping an iced gem gives a short spoken reason ("Clear a line beside it first") and counts no miss; hint as today | An iced gem never moves in a swap; it falls normally (ice moves with the gem); thawing happens exactly when a removed cell is beside it; pars exact under the new rule | Model change (an ice flag per cell carried through `fall`); drawing frost; a new interaction message; how-to card |

All four append; IDs 1–4 keep their meaning, so the grown-up range becomes `1–8` with no `order`.

### Younger-band openings

**School at 1–2** (a decision). Both are 4×4 at 108-unit cells, tap only, with spoken instruction and hint. The cost is voice wording for a child ("neighbour" is fine, "clearing route" is not; `gem-swap.stuck` would need a child form), a school entry in `LEVELS` (`school: { min: 1, max: 2 }`) and a Wonder Woods subject listing, as Lantern Lights and Island Bridges do. Level 3 stays out unless its cells reach 100.

### Easier entries and levels between existing ones

None needed for grown-ups: 6 → 12 → 15 → 18 gems is already a gentle slope. If school opens, an easier entry could be appended (e.g. level 9 *One line* with three to five gems and one swap that makes one line, placed first with `order` and declared in `entryLevels`), but levels 1–2 are probably small enough; decide after a child plays them.

### Left out on purpose

- **A Zen refill mode.** Refill makes the tray endless and random, removes the par, and turns planning into searching. That is the opposite of this game's reason to exist and of "comfortable stopping". Bejeweled's Zen proves the calm tone is liked; the finite tray already has it.
- Move limits, lives, boosters, big-combo points and timers (Candy Crush, Lightning, Zoo Keeper).
- Special gems made by four- or five-lines (Bejeweled's flame and star gems): they add a second rule set and make exact pars much harder to prove; level 6 gives long lines a purpose without them.
- Saving an unfinished tray: rounds are a few minutes; the shell's normal exit is enough.

## Decisions for the developer

1. **Open levels 1–2 to the school band?** Lean: yes, after a child plays them once on the iPad; it costs one voice pass and a `LEVELS` line.
2. **Keep the roadmap's Zen refill proposal or drop it?** Lean: drop it (reasons above); the course (slice 4) gives the grown-up who wants "more" a finite set instead.

## Build slices, in order

1. **More trays, looks and a visible fall.** The tray generator script and 20 frozen trays a level at 1–4; three seeded looks; the falling tween, landing squash and rising cascade steps. Checks: typecheck, rule tests, one filtered `gemswap` play at level 4 with one portrait screenshot in a new look; no `fingerdemo` (the bot's actions do not change); build only if shared files change.
2. **Level 5 *Six by six: five swaps*.** Frozen 6×6 trays with offline pars, the node-budget test, grown-up range 1–5 and the couch trip mapping. Checks: new level on the existing interaction: typecheck, rule and registry/how-to tests, one browser play of 5, `fingerdemo` at 5; `couchgames` filtered for the catalog change.
3. **Level 6 *One swap, a long line*.** Content-tagged trays and the enumerated-route test; range 1–6. Checks: typecheck, rule tests, one browser play of 6, `fingerdemo` at 6.
4. **A frozen couch course, *The Big Trays*.** Five frozen trays from levels 4–6 in `src/couch/courses.ts`, following the Lantern Lights course pattern, scored as swaps over par. Checks: typecheck, unit tests (courses), `couchcourse` filtered, build. After slice 2.
5. **Level 7 *Stones that stay*.** The stone model, drawing and voice; range 1–7. Checks: model change: typecheck, rule tests with levels 1–6 unchanged, one browser play of 7 with one refused stone tap, one portrait screenshot, `fingerdemo` at 7, build.
6. **Level 8 *Iced gems*.** The ice model; range 1–8. Checks: new interaction: typecheck, unit tests, one scripted play with one iced-gem tap and one hint, one portrait screenshot, `fingerdemo` at 8, build. After slice 5.

The school opening is gated on decision 1 and stays out of the ready list.

## What was built in this session

Nothing: research and design only. Ran `node scripts/check-links.mjs` and `git diff --check`.
