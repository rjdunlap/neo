# Jar Sort, levels 1–8 (definition)

**Built 2026-10-20 ([PR #651](https://github.com/rjdunlap/neo/pull/651)), levels 1–8, on every default in [Open decisions](#open-decisions); [build note](../archive/COMPLETED-2026-10-09.md#jar-sort-levels-18-2026-10-20).** Deviations: the jars slide off screen at the end (the land's host does not carry them); the portrait arithmetic assumed a 768-wide view but the upright logical view is 1024 wide, so rows match landscape (seven jars, two rows); the how-to note's level-3-on line reads "a fruit dropped where it cannot go counts as a mistake" (the card test forbids the word "level"). Text below is the definition as written.

Defined 2026-10-17 for [chunk 26](../ROADMAP.md#chunks) (gaps against popular mobile games), from the [IDEAS candidate](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default that the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** lift the top fruit off a jar and drop it into another jar until each jar holds one kind of fruit. Each full jar gets a lid and turns into jam. The learning goal is **spatial planning in stacking order**: only the top item can move, it can go only onto the same kind or into an empty jar, and a spare jar is a place to park something while she digs. Older levels need a few moves planned in order, and some need a move that makes things look worse for a while. It is not a rule sort like Critter Sort, not a measurement game like Fill and Dump, and not a sliding puzzle like Ferry Jam.

## References

| Reference | What it shows | What Jar Sort takes or rejects |
| --- | --- | --- |
| Water Sort and Ball Sort apps, e.g. [Water Sort Color Pouring Game](https://apps.apple.com/us/app/id1571446860) and [Water Bottle Sort](https://apps.apple.com/us/app/-/id1644091216) (store listings, weighted lightly) | Tap a tube, then tap another; a pour works only onto the same top color or into an empty tube, and only with room. Undo is often a limited resource. The listings say there is no timer | Takes the tap-tap control and the top-match rule. Rejects limited undos, extra tubes sold or earned, ads, stars and move counters |
| Ito et al., [*Sorting Balls and Water: Equivalence and Computational Complexity*](https://arxiv.org/abs/2202.09495) (FUN 2022; TCS 2023) | Ball sort and water sort are equivalent in whether an instance can be solved, and both are NP-complete in general | The two rules agree on solvability but not on move counts, so this definition picks **one piece per move** (ball rule) and writes par and tests against it. General hardness is why boards come from a frozen, solver-checked list, as Ferry Jam's do |
| Tower of Hanoi studies with preschoolers: Klahr and Robinson (1981), as summarized in [Voelter and Call (2014)](https://research-repository.st-andrews.ac.uk/bitstream/10023/8634/1/Voelter_and_Call_2014_Cognition_AM.pdf) | Most 4-year-olds planned at least one move ahead, but about a third did not look past the current move | Preschool puzzles can be solved one good move at a time. The first board takes two moves, and lit jars show where the lifted fruit can go |
| [Cerchiaro-Ceballos et al. (2023)](https://journal.sipsych.org/index.php/IJP/article/view/1804), Tower of Hanoi as a web game, ages 4–6 | Repeated attempts showed different planning styles regardless of age; the path she takes says more than pass or fail | Wandering is never a miss. Help depends on her moves since the last hint, not on a clock |
| ThinkFun's Rush Hour Jr., through [Ferry Jam](../GAMES.md#ferry-jam) | Frozen solver-checked boards, a free unlimited undo, and a hint after a long wander | Copies the frozen list, the undo button, the wander threshold and the bot pattern |

## Overlap

- **Critter Sort** sorts by stated rules (hoops, signs). **Shape Sorter** matches shape to hole. **Size Parade** orders by size. **Ferry Jam** is planned sliding. **Bolt Boards** ([IDEAS](../IDEAS.md#candidates)) is about the order things come off. Only Jar Sort is about the order things are stacked in.
- **Fill and Dump** keeps the continuous pour, where the distance pulled sets the amount, and its *Two jugs* measuring puzzle (see [decision 5](#open-decisions)). Jar Sort's moves are discrete. It reuses only the tip-and-stream look of `src/games/fill-dump/pour.ts`, not its gesture.

## The model

- **Jars and fruit.** A board has `n` jars of capacity `c`. There are `k` kinds of fruit, each with exactly `c` pieces, and `n − k` jars start empty or partly empty. A jar is a bottom-to-top list.
- **A move** takes the **top piece** of one jar and puts it on another jar. It is legal when the target has room and is empty or has the same kind on top. That is the ball rule, one piece per move.
- **Solved:** every jar is empty, or full with one kind. With `c` pieces of each kind, that means each kind is in a single jar.
- **Kinds are pictures, not only colors.** Strawberry (red), blueberry (blue), orange (orange), pear (green) and plum (purple), drawn in `palette.ts` colors with distinct silhouettes so color is never the only cue. Spoken names come from the voice script.

`logic.ts` holds plain functions: `legal(board, from, to)`, `move(board, from, to)`, `solved(board)`, `canonical(board)` (jar order sorted for search), `solve(board, cap)` (breadth-first over canonical states; returns a shortest move list or `null`), `hintMove(board, history)` and `planFor(level)`. Boards are a frozen list in `puzzles.ts`. A round picks one with `ctx.rng` and applies a seeded permutation of kinds and of jar order. Both preserve the shortest solution length.

## Screen and controls

- **Jar size.** A jar is drawn 104 units wide, with a hit area 120 wide by its full height. A piece is 52 units tall, and the rim is 36, so a jar of capacity 4 is 244 units tall. The jars are the only targets, so every target is at least 120 × 140 units (a capacity-2 jar).
- **Layout function** `jarLayout(n, c, view)` in `logic.ts`, tested at the four standard views. The jars spread over `spread(n, 150, view.w - 40, gap)` in one row when the pitch is at least 130 units. Otherwise they use two rows, `ceil(n / 2)` above. At 1024 × 768 landscape, the usable width is 834. Six jars give a pitch of 139, so one row. Seven jars give 119, so two rows (4 + 3). Two rows of 244-unit jars with a 60-unit gap take 548 units, below a 120-unit header, which fits in 768. In portrait at 768 wide, the usable width is 578, so four jars fit in one row (144) and five or more take two. The test asserts that hit areas never overlap, that every hit area is at least 120 wide, that nothing enters the pet's corner and that everything stays inside `view`.
- **Lift and drop.** Pressing a jar lights it and lifts its top piece 30 units at once, on touch-down. Tapping a second jar moves the piece: a short arc, a soft pop and a pentatonic note for that kind (`src/audio/notes.ts`). Tapping the lifted jar again, or empty ground, sets the piece back down for free. Dragging a jar's top piece onto another jar with `src/engine/drag.ts` does the same as the two taps. The drag rides 40 units above the finger, as usual. Taps during the 0.35 s move animation are ignored. Cancelling, leaving the screen, resizing and a lost release all put the lifted piece back.
- **Legal targets light up at levels 1–2.** While a piece is lifted, jars that could take it brighten. From level 3 they do not.
- **A full one-kind jar** gets a lid with a chime. It stays a jar and can still be opened, because a full jar of one kind can never accept anything, and moving from it is allowed.
- **Undo** is Ferry Jam's round arrow (`RoundButton`, radius 54), at bottom right. It is unlimited, free and dim when there is nothing to take back. **Start again** is in the pause sheet. Neither counts for anything.
- **Speech:** `ctx.instruct` gives the instruction, and the corner pet repeats it. Navigation never needs reading.
- **Feel:** a calm existing music style, not `silenced`, because she is not making music. Jars, fruit, lids and jam are drawn with Pixi `Graphics`. The finished jars go to the land's host, who carries them off. That is decoration, and nothing is saved.

## Levels

Par is the solver's shortest move count. It selects boards and sets the wander threshold, and **it is never shown to her.**

| ID | Name (`describeLevel`) | Jars `n` · capacity `c` · kinds `k` | Par range | Boards per round | Lit targets |
| --- | --- | --- | --- | --- | --- |
| 1 | Two kinds, two jars to fill | 3 · 2 · 2 | 2–3 | 2 | yes |
| 2 | Two kinds, taller jars | 3 · 3 · 2 | 3–5 | 2 | yes |
| 3 | Three kinds, one spare jar | 4 · 3 · 3 | 4–7 | 2 | no |
| 4 | Three kinds, two spare jars | 5 · 4 · 3 | 6–9 | 2 | no |
| 5 | Four kinds | 6 · 4 · 4 | 9–13 | 1 | no |
| 6 | Four kinds, one spare jar: plan ahead | 5 · 4 · 4 | 10–15 | 1 | no |
| 7 | Five kinds | 7 · 4 · 5 | 12–18 | 1 | no |
| 8 | Every fruit has its jar | 6 · 4 · 4, four jars labelled | 10–16 | 1 | no |

**Bands (`BandLevels`):** `preschool: { min: 1, max: 3 }`, `prek: { min: 2, max: 5 }`, `school: { min: 4, max: 8 }`. There is no `order`, and no lap, toddler or grown-up band.

### First rounds

Jars are listed bottom → top. S is strawberry, B is blueberry, O is orange.

- **Level 1, board 1 (authored, always first; level 1 has only these two boards):** `[S, B]`, `[B]`, `[S]`. "Put each fruit in its own jar." Lift the blueberry and drop it on the blueberry. Then lift either strawberry onto the other. Done in 2 moves. **Board 2:** `[B, S]`, `[S, B]`, `[]`, done in 3 moves (S to the empty jar, B onto B, the last S onto S).
- **Level 2:** two seeded boards from the frozen list, with capacity 3 and one empty jar. Lit targets show where each lifted piece can go.
- **Level 3:** the first level without lit targets. Three kinds and one empty spare jar, e.g. `[S, B, O]`, `[O, S, B]`, `[B, O, S]`, `[]`.
- **Levels 4–7:** seeded frozen boards. In level 6's boards, at least one shortest solution has to put a piece somewhere it does not belong for a while. The frozen-list test checks that no greedy move-onto-same-kind-first solver finishes those boards.
- **Level 8:** four jars stand on picture labels (a strawberry mat, a blueberry mat, and so on), and two spare jars have none. Solved means every kind ends in **its** labelled jar. A kind finished in an unlabelled jar is not done yet. The pet says, "The pears go in the pear jar," and the lid waits. `solved` takes an optional labels argument, and the solver searches with it.

## Accounting, help and finishing

- **Never a miss:** any legal move, including moves away from the solution; setting a piece back; undo; Start again; and repeating the instruction. Wandering is exploration.
- **A refused move** (the target is full, or a different kind is on top) springs the piece back with a gentle boing and a spoken reason: "Strawberry goes on strawberry, or in an empty jar," or "That jar is full." At **levels 1–2 it is never a miss**, because lit targets are showing the rule. From **level 3 it is one miss**.
- **The two-miss glow:** at a board's second miss, and every second miss after that, the hint move's two jars glow until she makes a move. Each glow counts `hints++` once.
- **The wander hint**, as in Ferry Jam: after `max(8, 2 × par)` legal moves since the board began or since the last hint, without the board being solved, the hint move's two jars glow and `hints++`. Couch play never offers this hint.
- **The hint move** (`hintMove`) is a legal move to a state whose shortest solution is one move shorter than the current state's. The search runs a bounded breadth-first `solve` from the current board, capped at 200,000 canonical states. If the cap is hit, it falls back to **undo**: it steps back through her own history to the most recent state with a known solution, and the undo arrow glows.
- **Stuck:** when no legal move exists, or the bounded search proves there is no solution from here, the pet says, "Stuck! Let's take one back," and the undo arrow pulses. This is never a miss and never a hint. If the search only ran out of states, nothing is claimed.
- **Finish:** once every board in the round is solved, the jars become jam and the host carries them off. Then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed.
- **Adaptation** follows the unchanged shell rule. Levels 1–2 can produce hints but not misses. That counts as adaptation, not evidence of mastery, the same as other free-error levels.

## Rule tests (`logic.test.ts`)

- `legal` and `move`: only the top piece moves; the target needs room and an empty jar or the same kind on top; a move never changes the piece count; `move` then undo restores the exact board.
- `solved`: holds exactly when every jar is empty or full with one kind, and, with labels, when every labelled kind sits on its mat.
- **The frozen list:** every board in `puzzles.ts` is well formed (each kind exactly `c` pieces, `n` jars, no jar already full with one kind at the start). Every board is solvable, and its shortest solution is inside its plan's par range. There are at least 12 boards per plan, except level 1, which has exactly its two authored boards. Level 6 boards defeat the greedy solver. Level 8 boards are solvable with labels.
- **Seeded presentation:** permuting kinds and jars keeps the shortest length. The same seed gives the same board.
- `hintMove`: from many states reachable on each plan's boards, the move is legal and lowers the shortest solution length by exactly one, or the result is undo at a proven dead end. The worst top-level case runs under the 200,000-state cap in a stated time on Node (the test records it; the target is under 150 ms). Exceeding the cap returns the history fallback, never nothing.
- **Dead end:** a constructed stuck board reports stuck, and undo leads back to a solvable state.
- **Layout:** `jarLayout` at the four views for every plan, against the size assertions above.
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true` and `autotouch()` tap the source jar, then the target, along the solver's path from the current board. It takes no other action, ever. A refused move is never demonstrated. The bot also stands in for the scripted play's solve.
- **How-to card** (`src/content/howto.ts`). Goal: "Move the fruit one at a time until every jar holds one kind." Steps: "Tap a jar to lift its top fruit, then tap another jar to drop it there" (all levels); "A fruit can go on the same fruit or into an empty jar" (all levels); "Bright jars show where it can go" `{ from: 1, to: 2 }`; "Each fruit has its own labelled jar" `{ from: 8, to: 8 }`. Finish: "Every jar is one kind of fruit." Note: "The round arrow takes back a move, as often as you like. Moving fruit around is never counted against her." Plus a `LevelLine` from 3 to 8: "A fruit dropped where it cannot go is counted for her level."
- **Voice lines** under `jar.*`: `intro`, `instruct`, `instruct-labels`, `refuse-kind.<fruit>` (one per kind, so device speech never fills in a template), `refuse-full`, `lid`, `wrong-jar.<fruit>` (level 8), `stuck`, `hint`, `done`. `{pet}` is optional.
- **Registration:** ID `jar-sort`, name "Jar Sort", spoken title `game.jar-sort`, region (subject) `puzzle-peaks`, home land **Rainbow Meadow** (7 games today, 8 with this one, and 9 if Sprout Shuffle also lands there, within the 13 that `lands.test.ts` already covers). Skills `['planning', 'sorting', 'spatial-reasoning']`. The hub icon is a jar with three stacked fruits. The sticker is a seeded jam jar.
- **Co-play:** one person says which fruit to move, and the other moves it. **Off-screen:** stack two colors of blocks or pom-poms in cups or a cardboard tube and sort them so only the top one moves.
- **Couch:** none in the first build. It is a later candidate using Ferry Jam's focus ring and `control()`, with a confirm to lift and a confirm to drop.
- **Rework couplings:** none required. A finished round's jam is a natural object for a later project, such as sharing food in the [welcome adventure](../rework/README.md#learning-belongs-in-the-story), but nothing is saved or unlocked by this slice. Any such use is the rework's to define.

## Check tier

New-game tier. Run typecheck and unit tests (all the rule properties above, plus the registry, lands and how-to tests). Then make one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 8, with one refused move at level 3 or above and one hint. Take one portrait screenshot at level 7 (two rows), run `fingerdemo` at level 8, and run `npm run build`, because the registry, lands, voice and how-to files change. Device checks stay open: piece legibility at capacity 4 on an iPad, whether a preschooler reads lit jars, and whether undo is discovered unprompted.

## Open decisions

Each has a default that the build uses. None blocks it.

**Decided 2026-10-23 (on the developer's delegation):** the defaults the build used stand (fruit into jam jars; refused moves free at 1–2, one miss from 3; preschool 1–3 with lit targets at 1–2; Rainbow Meadow; Fill and Dump keeps *Two jugs*; couch play later).

1. **Theme.** Default: fruit into jam jars, which ties to Fill and Dump's fruit and gives a picture for each kind. The alternatives are paint pots for creature customization, or glow bugs into lanterns.
2. **Refused-move accounting.** Default: free at levels 1–2, one miss from level 3. The alternative is Ferry Jam's rule, never a miss, with help only after a wander.
3. **Preschool entry.** Default: preschool levels 1–3, with lit targets at 1–2. The alternative is pre-K and up only, until a person has watched a 3–4-year-old play level 1.
4. **Home land.** Default: Rainbow Meadow. Puzzle Peaks fits the subject but would reach 14 games, more than `lands.test.ts` has covered.
5. **Fill and Dump's *Two jugs*** (its decision 4). Recommendation: it stays with Fill and Dump. Measuring with a 3 and a 5 is measurement, not stacking order, so Jar Sort does not take it.
6. **Couch play** later, as above. It is not part of this build.
