# Log Roll deep dive

*ID `log-roll` · band grown-up · levels 1–3 on 2026-11-07 · session `claude/dive-log-roll` ([PR #1368](https://github.com/rjdunlap/neo/pull/1368))*

## The game today

*Updated after slice 1 (PR #1402): floors, looks, the tip and the hint count below are built; the "Known gaps" list is what slice 1 closed. Levels and the grown-up range 1–3 are unchanged.* *Slice 2 then added level 4 (8×6 floors at depth 16); the grown-up range is now 1–4.*

A grown-up tips a wooden log across a pond of stepping stones with four arrow buttons and finishes by standing it upright in the dark hollow with the gold rim. A standing log tips onto two stones; tipping a lying log along its length stands it up again; rolling it sideways moves it one space. Both ends need a stone, so the puzzle is planning the log's **footprint and orientation** several moves ahead, a classic rolling-block maze. It lives in Tinker Lab, touch only (no couch entry in `src/couch/catalog.ts`), and is the `grownup` band's only orientation puzzle; younger players reach it behind the land's signpost and play level 1.

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Open stones: learn to tip and stand | grown-up | How tipping changes pose on an open 5×5 floor (start exactly 4 rolls away) |
| 2 | Two gaps: plan the log's footprint | grown-up | A route around two holes on 6×5 (exactly 8 rolls) |
| 3 | Broken path: weave around three gaps | grown-up | A 12-roll route on 7×5 where a standing log must line up for the last tips |
| 4 | The long way round: loop past the dead ends | grown-up | A 16-roll route on 8×6 (seven gaps) that loops past dead ends; each start is only 2–8 rolls away if the gaps were filled |

`BandLevels`: `grownup 1–4`, no `order`, no `entryLevels`.

**Content pools.** One frozen floor per level (`PLANS` in `logic.ts`); the hollow is always the bottom-right stone. `makePuzzle` picks an upright start at the plan's exact depth from a reverse breadth-first search of the floor. Counted for this dive with a port of `roll`: level 1 has **5** possible starts (65 reachable poses), level 2 **5** (69), level 3 only **2** (77). Replay variety is therefore close to nil: a grown-up who plays level 3 twice has a coin-flip chance of the identical puzzle.

**Rules today.** An unsupported roll stays put, boings and says `log.edge`; it counts **no miss** (exploration is free), and every second failed roll in a row lights a hint. Hint glows the arrow that starts a shortest route from the *current* pose (`solutionStep`), so it follows revisions. Undo and Start over keep the roll count and hints. Upright in the hollow finishes with `ctx.finish({ misses: 0, hints })`. The ghost-finger bot taps the solver's next arrow.

**Known gaps.**
- `showHint` adds a hint each time it runs, even when the same arrow already glows (a repeated Hint tap, or the fourth and sixth failed rolls). Marble Jump and Snowball Merge count a visible hint once. Since misses are always 0, hints alone drive difficulty here, so the double count matters more.
- The layout hard-codes five rows (`(v.h - 440) / 5`, `c * 5 + 28`, the hollow at `4.5 * c`), and `goal()` is always the bottom-right corner. Any taller floor, mirrored floor or moved hollow needs these generalised first. Phone-upright [batch 4](../definitions/phone-portrait.md#game-batches-six-games-each-ready-batch-1-built) also lists `log-roll`, so slice 1's layout work should derive from the floor size and leave the upright pass a one-line change.
- The log jumps between poses with no motion, so a newcomer has to infer what "tip" did.
- Person checks: whether a grown-up new to rolling blocks reads the standing/lying difference from the drawn rings and stripes, and whether four separate arrow buttons feel better than swiping on the board.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Bloxorz](https://www.mobygames.com/game/browser/bloxorz) (Damien Clarke, 2007) | Browser rolling-block puzzle | 33 stages adding orange fragile tiles (hold a lying block, not a standing one), soft and hard switches that open bridges, and a split into two cubes | The fragile tile as a *refusal* rather than a fall; the hard switch (only a standing block presses it) | Falling off the edge, the restart on falling, lives-like retries and the stage passcodes |
| [Bloxorz complexity paper](https://ar5iv.arxiv.org/html/1411.5951) (Utrecht, 2014) | Analysis | Shows single-use tiles alone make the puzzle NP-complete | A reason to keep each new rule one at a time on small boards | Single-use tiles: the state no longer reverses, and Undo would have to remember the floor |
| [Rolling-Block Mazes](https://logicmazes.com/rb/column.html) (Robert Abbott after Richard Tucker; GAMES Magazine 2002) | Paper logic mazes | Larger hand-made layouts whose true path goes around loops | Loops: floors where the obvious route fails and the long way round works | Nothing to cut; they are paper puzzles |
| [Rolling-block colour-zone mazes](https://clickmazes.com/roll/new-roll.htm) (Click Mazes) | Web maze variants | A block of a different size, and coloured zones that restrict which pose may enter | A goal that asks for a *lying* finish across two marked stones | Mixed block sizes in one game |
| [Edge](https://en.wikipedia.org/wiki/Edge_(video_game)) (Mobigame, iOS 2008) | Touch cube roller | Swipes roll a cube across its edges; later levels add moving platforms and an AI cube | Swipe-to-roll on the board as an optional input; the rolling motion itself as the pleasure | Its timer and time-based scoring |
| [A Monster's Expedition](https://en.wikipedia.org/wiki/A_Monster%27s_Expedition) (Draknek, 2020) | Push-the-logs puzzle | Few new components; logs flip end over end or roll sideways, and every island reuses that rule | The calm, few-mechanics island and log theme; one rule explored deeply before another arrives | Its open world and water losses (a log rolled off sinks) |
| [Stephen's Sausage Roll](https://en.wikipedia.org/wiki/Stephen%27s_Sausage_Roll) (Increpare, 2016) | Sokoban-like rolling | Very hard puzzles that turn on two-cell objects and their orientation | Two-cell orientation as the whole challenge, with a free undo | Its difficulty curve and burnt-sausage failure states |
| A shoebox on a paper grid | Physical play | A grown-up tips a box towards a pencilled square | Already the game's off-screen line | — |

Log Roll teaches no school skill and the grown-ups' page claims none; spatial orientation and planning are named as what the game asks for, not as a training benefit.

## What makes sense here

The game's solver is a reverse breadth-first search from one goal pose, and it is exact only because every roll is reversible (`logic.test.ts` checks that). That sets the order of everything below:

- **Keeps the solver as it is:** more floors per level, mirrored floors, a deeper level on bigger floors, a lying finish (the reverse search starts from that goal pose instead), and a **soft moss stone** that refuses a standing log, since a footprint that is legal one way stays legal going back.
- **Breaks it:** switches and bridges (the state gains a flag, the goal stops being a single pose and presses do not reverse), single-use stones and a split log. These need a forward search from the current state with the reversibility test scoped to the levels without the mechanic.

So the arc is: real variety inside levels 1–3 first, then one longer level, then a lying finish, then moss, then one kind of switch, each a single new idea on small boards. A split log and crumbling stones stay out. Bloxorz's falling and restarting becomes Puddle Island's "it stayed where it was", which the game already does. A par may be shown to a grown-up after finishing as plain information ("the shortest route is 12 rolls"), never a star or a gate; it is proposed in slice 1 because the solver already knows it.

## Experience and presentation

- **First unsupported action:** tap any arrow. On level 1 every first roll from the start is legal or harmlessly refused, so a newcomer learns the rule by trying it.
- **Touch and consequence:** the arrow tile already acknowledges touch-down. Proposed: the log tips over its leading edge in about 0.22 s (a `ctx.tw` rotation about the edge with a small squash on landing), with a soft wooden knock from `sfx.pop`. Taps during the tip are queued, at most one, so a quick double tap does not skip a pose. A refused roll gives a small lean towards the missing stone and back, so she sees which end lacked support.
- **Concrete art example:** stones drawn as `Graphics` ellipses in `swatch.teal.light` with a darker underside, and water ripples (two arcs) that widen under the stone the log lands on. A standing log shows its rings; a lying log shows bark stripes along its length. Looks change by seed (spring pond, autumn leaves floating between the stones, evening water with `swatch.purple`), and the rules stay the same.
- **Variety on replay:** several frozen floors per level, a left-right mirror (which moves the hollow), and every exact-depth upright start. Varying the floor never changes the level's depth.
- **Reasoning versus precision:** no timing or aiming at all. The challenge is holding two-cell footprints in mind, and the visible roll count supports that without demanding memory.
- **Supported ending:** a hint every time she asks, the glow after two refusals, Undo, Start over and one sticker even when helped. The status line counts rolls; nothing counts down.
- **Co-play:** one predicts which stones the log will cover, the other taps; the existing co-play line already says so. Solo play stays complete.
- **Needs a person:** whether the tip animation makes the rule obvious to a grown-up who has never played Bloxorz; whether level 4's 16-roll routes feel satisfying or tedious; swipe versus buttons on an iPad.

## Proposed ladder

### Fresh content inside existing levels

- **Floors:** a generator script (`scripts/log-roll-floors.mjs`) searches seeded random floors and freezes **four floors per level** (12 in all) that keep the level's size, have at least two upright starts at the exact depth, and keep the hollow reachable. Each floor holds its hollow as a `G` cell, so a mirrored floor moves it. Level 3 goes from two starts to at least eight.
- **Looks:** three seeded pond looks as above.
- **Motion:** the tip tween, the refusal lean and a short ring of ripples when the log stands in the hollow.
- **Hint count:** a hint already glowing is not counted again (the Marble Jump rule), with a test.
- **Par line:** after finishing, the status shows the shortest route next to her roll count. It is information only.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *The long way round* | grown-up | An 8×6 floor of frozen gaps, start exactly 16 rolls away. A candidate floor for this dive reaches depths 16–19 with 1–2 upright starts each, so the script needs several floors | When the obvious short line dead-ends and the loop around is the route (Abbott's loops) | As today | Every frozen floor has an upright start at depth 16, a hint path of exactly 16, and at least two starts across the level's floors | The five-row layout must be generalised first (slice 1); voice and how-to card unchanged except the level name; `fingerdemo` at 4 takes about 8 s |
| 5 | *Lay it in the cradle* | grown-up | A 6×5 floor whose goal is two cradle stones that the log must lie **across** (or along, by floor) | Arriving lying, in the right direction: the last move is a roll, not a stand | Standing on a cradle stone does not finish, and the status says "lie it across both cradle stones"; hint as today | The reverse search from a lying goal gives exact distances; standing on the cradle is never `solved` | New goal drawing (two shallow wooden cradles), `log.go`/`log.done` variants keyed by goal kind, a how-to step |
| 6 | *Soft moss* | grown-up | A 6×5 floor with three moss stones (drawn green and rounded) | Where the log may only pass lying down | Standing on moss is refused like an edge: the log leans, `log.moss` says "the moss is too soft to stand on, lie the log across it", no miss | A standing footprint on moss is never legal; every roll stays reversible; levels 1–5 floors are unchanged | Model change to `roll`'s footprint check; moss art; one voice line |
| 7 | *The stone bridge* | grown-up | A floor in two halves; a hard switch (a ringed stone) raises a bridge of two stones when the log **stands** on it | Detour to the switch first; afterwards, getting across the bridge | Lying on the switch does nothing, and the status says so; the bridge stays raised, Undo lowers it again if the press is undone | Forward search from the current state (pose plus bridge flag) gives exact hints; every start needs the switch; the reversibility test is scoped to levels without switches | Solver rewrite (memoised forward search), bridge drawing and rise tween, voice lines; after level 6 |

### Younger-band openings

Level 1 could open to `school` (6 to 10, as IDEAS proposes), which would need a two-roll easy entry (level 8 *First tips*, placed before 1 with `order` and listed in `entryLevels`) and a shorter spoken instruction, since `log.go` is three sentences long. This waits on a decision.

### Easier entries and levels between existing ones

None for the grown-up band: level 1's four-roll start is already a gentle entry. The school opening's level 8 above is the only proposed easier entry, and it is gated with that decision.

### Left out on purpose

- Falling off the edge, restarts on falling, crumbling single-use stones and timers (Bloxorz, Edge).
- A split log steered as two halves: two objects plus a control switch at once, too much for one new rule.
- Stars, grades or a par that gates anything; the par line stays information.
- The pet pushing the log (IDEAS proposes a barrel for the pet instead).

## Decisions for the developer

1. **Open level 1 to the school band, with a two-roll entry (level 8) and a shorter instruction?** Lean: yes, after a child has played level 1 once on the iPad; it costs a level row, `order`/`entryLevels` and one voice line.
2. **A controller or couch course for Log Roll?** Lean: skip; couch play retires at Lands stage E, and a d-pad would only duplicate the arrows.
3. **Swipe on the board as well as the arrow buttons?** Lean: yes as an addition, buttons kept, after a person says whether the buttons feel slow; it would follow the [input pitfalls](../DESIGN.md#input-and-rendering-pitfalls).

Slices 1–5 go ahead regardless.

## Build slices, in order

1. **Built.** **Floors, looks, a visible tip and a fair hint count.** The floor generator script and four frozen floors per level with `G` hollows and mirroring; the layout derived from the floor size; three seeded looks; the tip tween with one queued tap; the refusal lean; a hint already glowing is not counted again; the par line after finishing. Checks: typecheck, rule tests, one filtered `logroll` play at level 3 with one portrait screenshot in a new look, `fingerdemo` at 3 (the bot now waits for the tip); build only if shared files change.
2. **Built.** **Level 4 *The long way round*.** Frozen 8×6 floors at depth 16; grown-up range 1–4. Checks: new level on the existing interaction: typecheck, rule and registry/how-to tests, one browser play of 4, `fingerdemo` at 4.
3. **Built.** **Level 5 *Lay it in the cradle*.** The lying goal, its drawing and voice; range 1–5. Checks: typecheck, rule tests, one browser play of 5 with one upright stop on a cradle, `fingerdemo` at 5.
4. **Built (PR #1429).** **Level 6 *Soft moss*.** The moss stone, its refusal and voice; range 1–6. Checks: model change: typecheck, rule tests with levels 1–5 unchanged, one browser play of 6 with one refused stand on moss, one portrait screenshot, `fingerdemo` at 6, build.
5. **Built (PR #1429).** **Level 7 *The stone bridge*.** The switch state, forward-search solver and the bridge; range 1–7. After slice 4. Checks: new interaction: typecheck, unit tests, one scripted play with one lying press and one hint, one portrait screenshot, `fingerdemo` at 7, build.

The school opening, the couch course and swipes (decisions 1–3) are gated and stay out of the ready list.

## What was built in this session

Design session: research and design only (links and `git diff --check`).

**Slice 1 built (PR #1402).** `scripts/log-roll-floors.mjs` writes `src/games/log-roll/floors.ts`: four frozen floors a level (the original first; `.` stone, `G` hollow, space water), each with at least two upright starts at the exact depth (generated floors at least three). Starts per floor: level 1 5, 4, 5, 4; level 2 5, 3, 3, 4; level 3 2, 5, 4, 4, so level 3 went from 2 possible starts to 15. Each puzzle picks a floor and a seeded left-right mirror that moves the hollow: eight floor shapes a level. The layout derives from the floor's rows and columns. Three seeded pond looks (spring pond, autumn leaves, evening water) with stone undersides and floating pads or leaves. The log tips over 0.22 s (footprint stretch and fold, landing squash) with at most one queued tap; a refused roll leans toward the missing stone; ripples ring the hollow on finishing; the status reads "Finished in N rolls · the shortest route is D" as information only (no voice line added). A glowing hint is counted once (`countsAsHint` in `logic.ts`, rule-tested). The ghost-finger bot waits for the tip; the how-to card note is updated.
Ran: `npm run typecheck`; `npm test` (328 files); `BROWSER_SUITE=logroll` (levels 1 and 3, refused roll, double hint counted once, tip present and bot waits, undo, restart, one sticker each, portrait screenshot at level 3 in the spring pond on a mirrored floor, landscape screenshot); `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=3`. Not run: build, offline. Open person check: whether the tip makes the rule obvious.

**Slice 2 built.** Level 4 *The long way round*: `PLANS` gains depth 16 and `LEVELS` grownup 1–4. `scripts/log-roll-floors.mjs` now generates from `PLANS` (sizes add 8×6 with seven gaps; levels 1–3 regenerate byte-identical; level 4 has no hand-made original). Four frozen 8×6 floors with 5, 3, 5, 3 upright starts at depth 16 (16 starts, 32 with mirrors). A rule test asserts each start is 2–8 rolls away with the gaps filled (so the gaps add at least eight rolls), plus 8×6 size, depth 16 and range 1–4; the existing tests loop over every `PLANS` level. The `logroll` browser suite plays levels 1 and 4, screenshots at 4. Voice and how-to card unchanged.
Ran: `npm run typecheck`; `npm test` (329 files); `BROWSER_SUITE=logroll`; `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=4`. Not run: build, offline.

**Slice 3 built.** Level 5 *Lay it in the cradle*: grown-up range 1–5, 6×5 floors at depth 10 (the dive never set a depth; 10 is a recorded choice, below level 4's 16 because the new rule carries the difficulty, for a person to judge). Four frozen floors with 3, 4, 3, 4 upright starts, two with the cradle stones side by side ("across") and two stacked ("along"), plus mirrors; levels 1–4 regenerate byte-identical. The cradle is two stones marked 'C'; the finish is the log lying across both. Standing upright on a cradle stone says `log.cradle` and shows "Standing does not fit · lie it across both cradle stones" with no miss. New voice lines `log.go.cradle`, `log.cradle`, `log.hint.cradle`, `log.done.cradle`; heading "Lay the log in the cradle"; a level-scoped how-to step and finish.
Ran: `npm run typecheck`; `npm test` (329 files); `BROWSER_SUITE=logroll` (levels 1, 4 and 5, with an upright stop on a cradle at 5 and landscape screenshot `log-roll-cradle-stand`); `fingerdemo` with `FINGER_ONLY=log-roll FINGER_LEVELS=5` (14.4 s). Not run: build (CI), offline, portrait screenshot at 5.


**Slices 4–5 built (PR #1429).** Levels 6–7 add soft moss and a standing switch with a persistent bridge; [build note](../archive/COMPLETED-2026-10-09.md#log-roll-soft-moss-and-the-stone-bridge-2026-11-08) and [verification](../archive/VERIFICATION-2026-11-08.md#2026-11-08--log-roll-soft-moss-and-the-stone-bridge-pr-1429). School, couch and swipe decisions remain open.
