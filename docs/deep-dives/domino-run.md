# Domino Run deep dive

*ID `domino-run` · bands toddler, preschool, pre-K, school · levels 1–10 on 2026-11-07 · build slices 1–3 built ([PR #1360](https://github.com/rjdunlap/neo/pull/1360), [#1386](https://github.com/rjdunlap/neo/pull/1386), [#1392](https://github.com/rjdunlap/neo/pull/1392)) · session `claude/dive-domino-run` ([PR #1357](https://github.com/rjdunlap/neo/pull/1357))*

## The game today

She drags dominoes from a tray into the sockets of a sandy lane, taps the green starter, and the line clacks down with a rising pentatonic note per domino until the last one rings a bell. The purpose is **cause and effect with a stated spacing rule**: a falling domino reaches as many slots as its size (small 1, tall 2, giant 3) and can push a piece at most one size bigger. The bell counts as size 1, and the gong as size 4, so only a giant rings the gong. A stalled chain is an experiment, never a miss. The fallen dominoes stand back up, the gap gets a pulsing ring, and the pet names the reason ("Too far to reach!" or "Too big to push!"). It was built 2026-10-20 from its [definition](../definitions/domino-run.md) ([PR #659](https://github.com/rjdunlap/neo/pull/659)). Its home land is Bubble Beach and its region is `tinker-lab`.

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Tip the line | toddler | Nothing: tap any domino and the whole pinned line falls (3 lines) |
| 2 | One missing | toddler, preschool | Put one small domino in the glowing gap (a tap hops it there), then tap the starter (3 lines) |
| 3 | Fill the gaps | preschool, pre-K | Which of 2–3 sockets need a small domino; exactly one solution |
| 4 | Tall ones reach farther | preschool, pre-K, school | Where a tall domino reaches over an empty slot, with fewer pieces than sockets |
| 5 | Two bells | pre-K, school | A fork: fill the gaps in both lanes from one tray of smalls |
| 6 | Growing dominoes | school | Climb small → tall → giant to ring the gong; a wrong order stalls "too heavy" |
| 7 | Just enough | school | The tray holds the fewest pieces that work, bell or gong, so every piece has to count |
| 8 | Two bells, one tray | school | A fork with a bell and a gong: share three mixed pieces unevenly between the lanes |
| 9 | Where will it stop? | school | Guess which domino the line stops at (tap it), watch it run, then fix the line with one piece (stalls too far or too heavy) |

`BandLevels`: toddler 1–2, preschool 2–4, pre-K 3–5, school 4–9. There is no `order`, no `entryLevels`, and no lap or grown-up range (the kept default in the [October 23 record](../archive/DECISIONS-2026-10-23.md)).

**Content pools.** Each level has one authored first line (`FIRST`) and seeded lines after it: a lane of 3–6 slots (sockets at most 5, tray at most 3), six line colours (`LINE_COLORS`), three sizes and two ends. The lane is always the same sandy strip on the plain game background, and pinned dominoes are always the same brown. The generator builds a lane backward from a random chain (`randomChain`, `chainLane`) and accepts it only through the plan filter (`passes`). A test asserts that 500 seeds per plan never need the fallback.

**Built 2026-11-07 (slice 1, PR #1360).** Every empty slot that is neither pinned nor a socket is a puddle (`puddles(lane)`; two neighbours make one wide puddle). A drop on one splashes and springs back, never a miss or hint. Each round has one of three beach moods (`MOODS`: morning, sunset, low tide) drawn from `ctx.rng` after the lines, and each lane's end has a cosmetic `EndLook` (`LOOK_END`, `looksFor`, spoken via `LOOK_LINE`): bell, chime, horn are bell-sized; gong, drum are gong-sized.

**Known gaps.**
- **Puddles on a real iPad:** whether a puddle reads as "nothing can stand here" without speech is a person check (below).
- **School stops at level 9,** and the ladder's newest idea is level 9's predict-then-fix guess.
- **The level 9 flag and ring on a real iPad:** whether the orange guess flag and the ring on the real last domino read clearly is a person check (below); the new voice lines have no rendered clips.
- **The stalled-chain accounting** is hints-only (misses are always 0). That is a kept default, not a gap.
- **Nothing is saved, and there is no couch play.**
- **The device check is still open** in [DEVICE-CHECKS](../DEVICE-CHECKS.md): tap-to-hop at level 2, whether the stall ring reads as "here is the gap", and whether the dot faces tell sizes apart (puddles to be added).
- **IDEAS has no ladder-audit rows to repoint:** the 2026-10-09 audit predates the game, and the IDEAS "Dominoes" and "Domino Pond" rows are unrelated tile games.

## Similar games

Listings and reviews below were found by search this session, not played. The definition's references (Domino Cascade, Domino Physics, Domino Rally, PythagoraSwitch, Whitehead's 1983 amplification paper, van Leeuwen's "The Domino Effect") stand and are not repeated.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| ThinkFun *Domino Maze* ([ThinkFun](https://legacy.thinkfun.com/products/domino-maze), [instructions](https://legacy.thinkfun.com/wp-content/uploads/2019/04/Domin-1012-Instructions.pdf), [GeekDad review](https://geekdad.com/2019/09/new-logic-game-domino-maze-is-a-topplingly-good-time/), [Casual Game Revolution](https://casualgamerevolution.com/node/2119)) | Physical logic puzzle, 8+ | 60 challenge cards in four difficulties: a fixed grid with a start domino, targets to topple in order, blockers, stairs and pivots, then a second, upper grid | **A fixed obstacle the chain must get past** (level 10's wide puddle, level 11's low pier), one obstacle kind per level; a card that is solved by placing a few pieces among fixed ones, as levels 3–8 already are | Stairs whose timing matters, ordered targets, a second grid, and the fiddliness reviewers name (pieces that knock the set-up over) |
| *Simple Machines* by Tinybop ([Common Sense Education](https://www.commonsense.org/education/app/simple-machines-by-tinybop), [148Apps](https://www.148apps.com/kids/simple-machines-review)) | Open physics toy, 4–6+ | No levels; each machine can be altered and tested | The reviewers' point that kids need help to *analyse* what happened: the stall ring and the spoken reason already do this, and level 9's prediction makes her say what she expects first | Free play with no question to answer |
| *Crazy Machines* series ([SuperKids review](https://superkids.com/aweb/pages/reviews/problem/05/crazymachines/merge.shtml), [SuperKids, 1.5](https://mail.superkids.com/aweb/pages/reviews/problem/09/CrazyMachines1-5/merge.shtml)) | Rube Goldberg puzzle, 8+ | Hundreds of goals with a growing parts catalogue; reviewers say younger children stall as parts multiply | One new part per level range, never a catalogue | A big parts list, a full physics engine, the steep curve reviewers warn about |
| LEGO Education *STEAM Park*, "Chain Reaction" ([lesson](https://education.lego.com/en-us/lessons/preschool-steam-park/chain-reaction)) | Pre-K–K classroom lesson | Children predict what a push will do, build a chain, then name the first cause and the last effect | **Predict, then watch** (level 9); the co-play prompt "what made it stop?" | — |
| Domino spacing experiments ([Inspiration Laboratories](https://inspirationlaboratories.com/?p=11800), [Science Buddies "Domino Theory"](https://www.sciencebuddies.org/science-fair-projects/project-ideas/ApMech_p034/mechanical-engineering/domino-theory)) | Home and school science | Vary the gap, then predict the best spacing for taller or shorter dominoes and test it | That taller dominoes allow wider gaps is the real variable, which the toy rule keeps | Measuring speed or a "best" spacing: the island's rule is whole slots |
| Automatic domino train toys ([Target listing](https://www.target.com/p/-/A-1003946493)) | Toy, about 3+ | None: the train lays a line and the child knocks it down | The toddler pleasure is watching a long line fall, which levels 1–2 already give | Loud, uncontrollable noise and set-ups that fail on their own (buyers' complaints) |
| Penguin Slide and Robot Path (this repository, [GAMES](../GAMES.md#penguin-slide)) | Predict-then-watch levels | A tap marks where she thinks it stops; then it plays out | **The accounting and marker pattern for level 9**: a prediction is never a miss or a hint, a right guess sparkles, a wrong one keeps her marker and shows where it really stopped | — |

**Learning reference.** Cause and effect with a push matches NGSS kindergarten [K-PS2-1](https://www.nextgenscience.org/pe/k-ps2-1-motion-and-stability-forces-and-interactions), which compares the effects of different strengths of pushes. This is cited for the grown-ups only. The game claims no standard and keeps "a game rule, not exact physics" on its card.

## What makes sense here

- **Make the lane readable before adding levels.** An empty non-socket slot becomes a small **puddle** (it is Bubble Beach). That makes the existing reach rule visible, "the tall one reaches over the puddle", and changes no rule. Seeded **beach moods** (morning, sunset, low tide with shells) and **more ends** that are a bell or a gong in disguise (a shell chime and a toy boat's horn for size 1, a big beach drum for size 4) vary every replay. Each new end maps to `END_SIZE` exactly; a new end size would be a rule change and is not proposed.
- **Predict, then watch (level 9, school).** The line is already standing, with one problem. She taps the domino where she thinks the chain will stop, watches, and then fixes it with one tray piece. This puts the rule in her head before the clack, the way the LEGO lesson and the definition's co-play prompt do. It reuses Penguin Slide's prediction accounting.
- **A wide puddle (level 10, school).** A two-slot puddle on a **bell** lane: only a giant reaches over it, and a giant can only be pushed by a tall. She has to grow the chain for the gap's sake, not for the end, which level 6 never asks.
- **Under the pier (level 11, school).** A low boardwalk socket fits only a small domino. The chain has to stay small to get under it, then grow to ring a gong. Because a small can push at most a tall, all the growth has to happen after the pier, in order.
- **Not here:** a physics engine; timing or speed (Domino Maze's stairs); ordered targets; a colour or tune pattern rule (Pattern Train owns patterns; the definition's decision 4); a 2D turn or branching board (Chain Reaction owns direction); fewest-pieces scoring; a parts catalogue; the couch; a lap or grown-up level (kept defaults, below).

**The long arc.** Toddler taps a line and watches it fall, then fills one glowing gap (1–2). Preschool and pre-K fill gaps by the reach rule, use tall dominoes and run a fork (3–5). School climbs sizes to a gong, spends just enough pieces and splits a tray (6–8). It then predicts where a chain stops (9), crosses a wide puddle by growing on purpose (10), and plans its growth around a low pier (11).

## Experience and presentation

- **First unsupported action:** at level 1 a toddler taps any domino and the whole line falls. At level 2 she taps the tray domino and it hops into the glowing gap. Neither can go wrong.
- **Touch and consequence:**
  - Today a drag lifts the domino 40 units above the finger with a shadow at the nearest socket, and a tap on the starter starts the clack.
  - A domino dropped on a puddle springs back with a small splash (a short filtered-noise burst). The puddle shows *why* it was refused, so the pet need not explain.
  - At level 9 her tap plants a little flag above the domino; the clack runs; the flag sparkles if the chain stops there.
  - At level 11 a tall domino carried over the pier socket shows its shadow bumping the boardwalk, and on release it springs back with "Too tall to fit under the pier". That is never a miss.
- **Variety on replay:** three beach moods, two ends of each size, puddles wherever the generator leaves a non-socket slot, and the existing six line colours. None of this changes a rule.
- **Concrete art example:** a puddle is a `Graphics` ellipse, 70 × 14, on the sand at the slot's x, filled `swatch.blue.light` at alpha 0.8 and stroked `swatch.blue.fill`, with one white arc for a highlight. A wide puddle is 170 × 16 across two slots. It is drawn into `laneLayer` with `eventMode: 'none'`, so it never steals the slot column's hit area, and gets a slow 2-unit ripple scale tween owned by `ctx.tw`. The sunset mood is a sky band behind the lane in `swatch.orange.light` fading to `swatch.pink.light`, two rectangles at alpha 0.5, drawn once.
- **Reasoning versus precision:** sockets stay 100 × 180 columns and the snap stays nearest-within-0.6. Every new level is harder through the rule (where it stops, what spans the puddle, what fits under the pier), never through placement precision or more pieces: the tray stays at most three and the lane at most six slots.
- **Supported ending and replay:** a stall stays an experiment, with the glow after two stalls counting one hint, and **Show a hint** as today. A prediction is never a miss or a hint. The round ends with the parade and one sticker, help included.
- **Co-play:** today one stands the dominoes and the other says where it will stop. Level 9 turns that into the game: one taps the flag, the other fixes the gap. Solo play is unchanged.
- **For a person or device to judge:** whether a puddle reads as "nothing can stand here" without speech; whether a six- or seven-year-old's level 9 prediction is a real guess or a random tap (if random, the flag could wait for a second tap to confirm); whether the pier's height limit is visible enough before a drag; plus the open device check.

## Proposed ladder

### Fresh content inside existing levels

- **Puddles** on every empty non-socket slot (levels 4 and 6–8 today). The art covers both; `Lane` needs no new field, since a puddle is `!fixed[s] && !sockets.includes(s)`. A rule test asserts that every generated non-socket empty slot is drawn as a puddle (a pure `puddles(lane)` helper) and that no puddle is ever a socket.
- **Beach moods:** morning, sunset and low tide, seeded per round from `ctx.rng`, with the backdrop only.
- **More ends:** size 1 (bell) is a bell, a shell wind chime or a toy boat's horn; size 4 (gong) is a gong or a big beach drum. `End` stays `'bell' | 'gong'` for the rule, and a cosmetic `look` picks the art and the ringing line (`domino-run.ring-chime`, `ring-horn`, `gong-drum`). Each sound is synthesized on a pentatonic step from `src/audio/notes.ts`.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Where will it stop? | school | `SS_SSB` pinned with a tray of one small: the chain from the starter stalls at slot 2 (too far). She taps the domino she thinks falls last; the clack runs; then she places the small and runs again | Which domino falls last, by reading reach and size before the run; then the one placement that fixes it | The prediction is never a miss or a hint (Penguin Slide's rule): a right guess sparkles (`domino-run.predict-right`), a wrong one keeps her flag and the real stopping domino gets the ring. The fix then follows levels 3–8: glow after two stalls, one hint each | Every pre-built line stalls exactly once, at least two pieces in, with a reason; a too-heavy stall appears in at least a third of 500 seeds; exactly one tray piece fixes it; the stall domino is a tappable column (≥ 100 units) | **New interaction** (the prediction tap and flag). Voice: `predict`, `predict-right`, `predict-here`. How-to step `{ from: 9, to: 9 }`. The bot taps the true stall, then places and runs. School range 4–9 |
| 10 | Over the puddle | school | `S__~~B`, where `~~` is a two-slot puddle and `_` a socket, with a tray of tall and giant: the pinned small pushes the tall, the tall pushes the giant, and the giant reaches over the puddle to the bell | That the gap, not the end, needs the giant, so she grows the chain for the puddle's sake | A stall at the puddle says `too-far` with the ring at the puddle's near edge; a giant straight after the starter stalls `too-heavy`. Glow after two stalls, one hint each | Every line has one two-wide puddle and ends in a bell; every solution stands a giant directly before the puddle; no solution exists with the giant removed from the tray; the tray holds at most three, with at most one decoy | Generation: a puddle-first chain builder (`randomChain` with a forced reach-3 step). Art: the wide puddle. Voice: `puddle`. How-to step. `fingerdemo` at 10. School range 4–10 |
| 11 | Under the pier | school | `SSP__O`, where `P` is a low socket under a boardwalk, with a tray of small, tall and giant. The one solution is the small under the pier, the tall after it and the giant last, which reaches the gong. A tall can never skip the pier, because the pinned small before it reaches only one slot | Stay small to get under the pier, then grow after it: which size goes where on each side of a fixed limit | A tall or giant dropped on `P` springs back with `domino-run.too-tall` (never a miss). Stalls as today, glow after two stalls | `Lane` gains `low: number[]` (sockets capped at size 1); `solutions()`, the generator and `hintPlacement` never stand a piece bigger than small in a low socket; every solution stands a small at `P` (no line where a tall skips the pier passes the filter) and climbs to a giant after it; following the hint never asks for a refused drop | **Model change** (the cap on `Lane`, enforced in the drop handler and in `solutions`). Pier art with `eventMode: 'none'`, so it cannot steal the socket's column. Voice: `pier`, `too-tall`. How-to step. `fingerdemo` at 11. School range 4–11 |

### Younger-band openings

None proposed. The lap opening ("tap and watch", which level 1 nearly is) stays out under the kept default of 2026-10-23 ([decision 1](../definitions/domino-run.md#open-decisions)). If the developer reopens it, the slice would be a lap range of `{ min: 1, max: 1 }` with level 1's taps accepted anywhere on the lane, plus a lap device check.

### Easier entries and levels between existing ones

None needed. Toddler's step from 2 (one glowing gap) to preschool's 3 (two or three gaps, unglowed) is softened by level 3's exactly-one-solution filter and the glow after two stalls. Pre-K's top at 5 (the fork with smalls) is already an easier fork than 8. The three new levels are school-only and appended, so no `order` or `entryLevels` change is needed; school's range grows from `{ 4, 8 }` one level per slice.

### Left out on purpose

Stairs and anything timed (Domino Maze); ordered targets; colour patterns or a played tune as a rule; 2D turns and branching boards beyond the existing fork; scoring by fewest pieces; a parts catalogue; real physics; a lap or grown-up level (kept default); the couch rung (the definition's later candidate, not proposed until a couch session wants it); counting stalls as misses (kept default).

## Decisions for the developer

No new decisions. The kept 2026-10-23 defaults stay as recorded: no lap or grown-up level, stalls never a miss, Bubble Beach, and no colour patterns. Each is the developer's to reopen. Slices 1–4 below use those defaults and need no reviewer.

## Build slices, in order

1. **Puddles, beach moods and more ends** (built 2026-11-07, PR #1360). Tier: typecheck and the game's rule tests (a puddle on every non-socket empty slot and never on a socket; every end look maps to bell or gong size), one filtered `dominorun` play at level 6 with one portrait screenshot in the sunset mood, `npm run build` (voice). No `fingerdemo`: the bot is unchanged.
2. **Level 9 *Where will it stop?*** (built 2026-11-07, PR #1386). Tier: new interaction. Typecheck and unit tests (one stall per pre-built line, too-heavy share, one-piece fix, layout of the flag), one scripted `dominorun` play of level 9 with one wrong prediction and one requested hint, one portrait screenshot, `fingerdemo` at 9, build (voice, how-to).
3. **Level 10 *Over the puddle*** (built 2026-11-07, PR #1392). Tier: new level on the existing drag interaction. Typecheck, rule tests (a giant before every puddle, no giantless solution, 500 seeds without fallback), one browser play of level 10, `fingerdemo` at 10, build.
4. **Level 11 *Under the pier*** (ready; slices 1–3 built). Tier: model change on the existing interaction. Typecheck and rule tests (low sockets in `solutions`, the generator and `hintPlacement`; levels 1–10's first lines and solution counts unchanged), one scripted play of level 11 with one refused tall drop, one portrait screenshot, `fingerdemo` at 11, build.

## What was built in this session

Research and ideation only (the dive, PR #1357). Checked with the link checker and `git diff --check`.

### Slice 1, puddles, beach moods and more ends (PR #1360)

Built as defined; rules unchanged and authored first lines have no puddles (seeded lines at levels 4 and 6–8 can). Puddles ripple from `update()`; the three moods draw a backdrop band above the lanes (low tide adds wet sand and shells); the five end looks have their own art, pentatonic ring and voice line (new ids `domino-run.ring-chime`, `ring-horn`, `gong-drum`; no rendered clips). Four new rule tests (21 domino-run tests). The `dominorun` suite now plays level 6 upright in the sunset mood with a drag onto a puddle (misses 0, hints 0).

### Slice 2, level 9 Where will it stop? (PR #1386)

Plan 9 (`predict: true`); first line `SS_SSB` with tray S (stops at slot 2, too far). Seeded lines are about 55% too heavy (a tall reaching over an empty socket to the gong; a giant fixes it) and about 45% too far (one chain piece removed); the tray holds one or two pieces (35% chance of one decoy) with exactly one solution using one piece. New helpers `stopsAt` and `standing`. Each line opens with a guess: the tray is disabled with no paw pulse and the instruct line is `domino-run.predict`. Tapping the starter or a pinned domino (the whole 100×180 column) plants an orange flag, the line runs as it stands, the real last domino gets a ring, then `predict-right` sparkles or `predict-here` says where, then the stall reason, then she builds as at levels 3–8. A guess is never a miss, hint or counted stall; a hint asked during the guess waits until she builds. The bot taps the true stop. New voice ids `domino-run.predict`, `predict-right`, `predict-here` (no rendered clips). How-to has a level 9 step and note. Four new rule tests (25 domino-run tests). The `dominorun` suite also plays level 9 upright (wrong guess on the starter, waiting hint shows once building, 0 misses, 1 hint, sticker). `fingerdemo` at 9 passed (11.5 s).

### Slice 3, level 10 Over the puddle (PR #1392)

Plan 10 (school, so `LEVELS.school` is 4–10); two lines, first line `S__~~B` (pinned small, two sockets, a two-wide puddle at slots 4–5, bell) with tray tall and giant, whose only solution is tall at 2 and giant at 3. `lane()` reads `~` as a puddle. `passes` case 10: bell end, exactly one puddle two wide, the slot just before it (new helper `puddleGiantSlot`) a socket every solution fills with the tray's one giant, no solution without the giant, tray of at most three with at most one decoy. The generator goes puddle-first (giant at 2 or 3, then the puddle, then a bell or one more pinned piece and the bell; a small plus tall or tall plus tall before the giant; 35% chance of one small or tall decoy); 500 seeds never fall back and give at least six distinct pictures. A tall just before the puddle stalls too far with the ring at the puddle's first slot; a giant straight after the small says the existing too-heavy line. New voice id `domino-run.puddle` (no rendered clip). How-to steps 3–9, 2–9 and 6–9 reach 10 and a new level 10 step explains the puddle. Six new rule tests (27 domino-run tests). The `dominorun` suite gained a `DOMINO_LEVELS` filter and plays level 10 upright (wide puddle drawn at the start, a giant right after the small stalls as a stall not a miss, a requested hint, the fix; 0 misses, 1 hint, sticker; screenshot `domino-run-10-portrait`). `fingerdemo` at 10 passed (10.0 s).
