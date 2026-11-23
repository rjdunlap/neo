# Fence the Field, levels 1–4 (definition)

**Built:** levels 1–2 (PR #2037) and 3–4 (PR #2042): all four levels.

Documentation packet, 2026-11-22, branch `claude/define-fence-the-field`, [PR #2021](https://github.com/rjdunlap/neo/pull/2021). Study follow-up SG6 from [strategy games](../deep-dives/subjects/strategy-games.md#candidates-and-recommended-order); placement settled by the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) (Lantern Lake pages, so no capacity test is owed). Game `fence-the-field`; when this packet was written nothing was registered or implemented (levels 1–2 are built since, see the line above). Two build batches follow below.

## What you do

A small field of nine plots, three by three, is marked out by sixteen posts. The player and the pet take turns laying one fence rail between two neighbouring posts. Whoever lays the fourth rail round a plot claims it: a lantern (hers) or a paw print (the pet's) appears in the plot, and that player lays another rail. Each round starts from a field already part-fenced, with her to move, and is played to the last rail against the pet. The field says how many plots she can still claim against the pet's best play, and the round is won by claiming that many.

This is dots and boxes. The learning is looking ahead in a game where the move that scores is often the move that loses: a third rail round a plot hands it over; when every rail hands something over, give the smallest piece; at the end of a long run of plots, leave the last two so the pet has to open the next run for you. These are the chains and parity of the study's row.

Use stable level IDs 1–4 and the `grownup` band only. Use Puzzle Peaks as the learning region (the home of Shell Rows) and Logic as the challenge. Add one Lantern Lake tile through the existing land paging; it lands after the tiles already queued, on a later page, and every page keeps its targets. Use the classic round contract: level progress and one sticker. The field is round state. It carries no economy, inventory, streak or saved position. It ships upright in its first slice (`upright: true` and the upright layout test, per the 2026-11-17 record).

## Identity and overlap

- **Shell Rows** (`shell-rows`) is the island's other game against the pet, with one right move per puzzle and a *show me why* replay. Fence the Field reuses the replay idea, but the round is a whole endgame, many moves are equally good, and the score is plots, not a row. It is a different action (laying rails, claiming plots), so a new game, not a Shell Rows level.
- **Meadow Pens** (`meadow-pens`) fences pens to compare area for the younger bands. It has no opponent and no turn. The shared word "fence" is the only overlap.
- **Island Bridges** and **Lantern Lights** are solitary grown-up puzzles on Lantern Lake. Nothing here reuses their boards.
- **Not here:** a timer, a lose screen, a rating, a ladder of opponents, a two-phone match, a board larger than three by three on a phone (below), the words "beat" or "lose" in the pet's lines.

## The field, the solver and the pools

Keep the rules in `logic.ts`. The field has 24 rails (12 across, 12 down), numbered in reading order, across rails first; a position is a 24-bit set of laid rails plus the plot owners. A **plot is ready** when three of its rails are laid. Every start position has no claimed plot, so the nine plots are all still to play for.

- **Value.** `value(p)` is the net number of plots the player to move gains from the plots still open, with best play on both sides: for each open rail, the plots it completes plus `value` of the result if it completed any (the same player moves again), or minus `value` of the result if it did not. The empty-rail count of a start position is at most 12, so a memoized search from it visits at most 2¹² positions and runs in a unit test. Her **target** is `(9 + value(start)) / 2` plots.
- **Sound and unsound rails.** A rail is **sound** when laying it keeps her target; otherwise it is **unsound**, and it costs `drop` plots of target. At least one rail is always sound.
- **Kinds of rail**, used by hints and explanations, read from the position: a **claim** completes a plot; a **safe rail** completes nothing and makes no plot ready; a **give** completes nothing and makes at least one plot ready; a **leave-two** is a give laid while a claim was available, after which exactly two adjacent ready plots share the one rail still open between them.
- **Runs.** A *run* is a maximal set of open plots joined through open rails, each with exactly two rails open (a chain), or every one with two open in a ring (a loop). The hint lines name run lengths; the solver does not use them.

Each level's pool is a generated list of start positions, by symmetry class (the eight symmetries of the square), made by a repository script (`scripts/fence-the-field-pool.mjs`): it lays random rails on an empty field without completing any plot until the open-rail count is in range, solves the result, keeps the classes that meet the level's test, and writes `pools.json` with each class's representative as a 24-bit number. The rule test rechecks every listed position against its level's test with the solver, and the script prints the class counts, which the build records in this packet. Each level samples its pool with `ctx.rng`, applies a random symmetry, and never repeats the previous round's class. One position a round.

| Level | Open rails | The start position's test |
| --- | --- | --- |
| 1 · *Close it* | 6–9 | At least one plot is ready, and every sound first rail is a claim. At least one unsound rail exists |
| 2 · *Don't hand it over* | 8–12 | No plot is ready, at least one safe rail exists, every sound first rail is a safe rail, and at least one give is unsound |
| 3 · *Smallest first* | 8–12 | No plot is ready and no safe rail exists (every rail gives); every open plot is in a run (none has three or more rails open); the runs are at least two, of different lengths; the give into the middle of a shortest run is sound and some give into a longer run is unsound |
| 4 · *Leave two* | 9–12 | The pet has just given a chain (not a loop) of three or more, so a claim is available and no other plot is ready; every sequence of sound rails she can lay this turn contains a leave-two, and claiming the last two plots of the chain is unsound |

A level-1 round is short: claim what is ready, then the rest. The tests describe the first decision; the rest of the play-out is scored the same way. So that no level charges a miss for a skill it has not taught, levels 1–3 also keep only positions where no sequence of sound rails reaches a turn of hers whose only sound rails are leave-twos, and levels 1–2 only positions where none reaches a turn whose only sound rails are gives into a shortest run. Every hint kind and its line stay available at every level for the decisions a play-out does hold. **In a run of two**, giving by the middle rail and by an end rail can differ: by an end, the pet can lay the far rail and hand the pair back. A hint into a run of two names the middle rail ("Give the two by the middle rail, so they can't come back to you"), and an unsound end rail's replay shows the pet's leave-two.

## Turns, misses, hints and credit

Lay a rail by tapping between two posts. Touch-down darkens the rail at once; lifting lays it. A laid rail cannot be lifted. The pet then plays its turn at a readable pace (about 0.6 seconds a rail), always a sound rail, chosen with `ctx.rng` among the sound ones, preferring a claim when one is sound, so its play is honest and varied. A claimed plot fills with its owner's mark, shown by icon and not colour alone (a lantern for her, a paw for the pet). The score strip shows her plots, the pet's plots and her target ("You can get 5").

- **An unsound rail** is laid, then *show me why* plays the pet's best answer, rail by rail, at the same pace, up to her next turn, counting the plots it gives the pet ("That handed me three"). The field then steps back to before her rail, and the pet says what it cost ("Now you could only get 3. Try another rail."). Count **one miss per distinct unsound rail at a given position**; laying the same unsound rail again replays the reply, free. The miss sound is the gentle boing.
- **The second counted miss** in a round gives one assisted hint, and **Help** asks for one at any time. A hint glows one sound rail, preferring the level's kind (a claim at level 1, a safe rail at 2, the give into the shortest run at 3, the leave-two at 4), with its line: "Close this plot: it has three rails." / "This rail makes no plot ready." / "Every rail gives something. Give the run of one: it costs least." / "Take all but the last two, then lay the far rail. The pet must take two and open the next run for you." Repeating Help with no rail laid replays it, free. Count each new hint once.
- **Hints always lead somewhere.** A hinted rail is sound, so following hints from any position reached in a round finishes with her target. The rule test walks every pool position, laying the hinted rail at each of her turns and a sound pet rail at each of the pet's, and checks she ends on her target.
- **On the last rail** the field glows, her plots' lanterns light, the pet says the score without judging it ("Five for you, four for me"), and the game finishes once through the normal shell with the round's misses and hints. A round is complete when she reaches her target, which with only sound rails accepted is every round finished.

## Play and presentation

- **Scaffold and helpers.** Use the [new-game scaffold](../NEW-GAME.md), `onTap`, the coach helpers and Shell Rows' replay pattern.
- **Geometry.** Plots are `s` units square. Each rail's target is a square of `s / 2` centred on the rail, so neighbouring targets meet at the posts without overlapping (the upright test allows touching) and the posts themselves are not targets. A tap anywhere inside a plot picks the plot's nearest open rail, so no part of the field is dead; the test measures the squares. Upright, `s` is 200, so every target is 100 units and the field is 700 by 700 including half a target outside the border. Landscape, `s` is 180 (targets 90).
- **Upright phone first.** At 390 × 625 with captions and the active guide, top to bottom: the score strip below Home and "?", the field, then Help. Reserve the caption and guide space first; the field sits clear of the top-left column and the bottom-left guide.
- **Landscape.** The field on the left, the score strip and Help on the right.
- **Art.** Posts, rails, the grass, the lantern and paw marks and the new hub icon (a fence corner with a lantern) in palette colours with `Graphics`. Rails she laid and rails the pet laid look alike; the plot marks carry ownership. Use existing confirmation sounds and pentatonic notes (a rising step for each claimed plot).

**Voice.** Keep the lines in `voice.ts`, with the shell's Kokoro title and clip workflow. The list is finite:

- the instruction, through `ctx.instruct`: "Lay one rail each. Close a plot to claim it and go again. Get as many as you can.";
- targets "You can get *n*" for *n* 0–9, cost lines "That handed me *n*" (1–9) and "Now you could only get *n*" (0–8), and finishing scores for each split of nine;
- the four hint lines above, plus "Give the run of *n*" for *n* 1–3, the middle-rail line for a run of two, and "the loop";
- the pet's turn-pass lines ("Your turn", "My turn again").

A unit test checks that every line the pools and the play-out can produce has a voice line.

**How-to cards.** Level 1 shows closing a ready plot and laying again. Level 3 shows every rail giving and the short run going first. Level 4 shows taking all but two and the far rail. The ghost finger follows the hinted rail on the seeded position.

**Co-play and off-screen.** In co-play, the two grown-ups talk through her move before she lays it, and swap the phone after a round. Off-screen, the same game on squared paper: a three by three field of dots for a quick game, or five by five for a long one.

## Build batches

**The pool script runs first.** The counts are not derived in this packet. If any level's pool comes out empty or under about 20 classes, the building session stops before the scene, records the counts and the failing test in the [study](../deep-dives/subjects/strategy-games.md#build-slices-in-order), and leaves the level to a revised definition.

1. **`fence-the-field 1`, levels 1–2.** The new game, the field, the solver, the pet, the replay and the claim and safe-rail hints, with the pool script and its pools for all four levels (only levels 1–2 registered).

   **Checks:** typecheck and unit tests covering the solver (value against a brute-force count on small positions), the pools (every listed position passes its level's test, classes distinct under symmetry, the printed counts recorded here), sound and unsound rails, miss counting per distinct rail, the hint walk, voice coverage, the upright layout test (every rail target 100 units upright, at least 64 everywhere), registry, lands and paging. **Browser and build:** one filtered `fencethefield` play at 390 × 625 with captions through the normal grown-up route and the Lantern Lake page: finish level 1, then at level 2 lay one unsound rail (watch the replay and the step back), lay it again (no new miss), follow Help, rotate and finish with one sticker. One upright screenshot, `fingerdemo` at level 2, build with the generated voice assets.
2. **`fence-the-field 2`, levels 3–4.** The runs, the shortest-run and leave-two hints, and their pools. After batch 1.

   **Checks:** typecheck and unit tests (pools for levels 3–4, the leave-two test, the hint walk, voice coverage), one filtered play at level 4 taking the whole run once (the replay shows the pet's leave-two answer) and following one hint, one upright screenshot mid-run, `fingerdemo` at level 4, build.

Later proposals, not in these batches:
- a *Play it out* level from an empty field against a pet that sometimes misses a leave-two, completing on any finish;
- a *Count the runs* level on the long-run parity rule, with the middle-game safe rails;
- a four by four field, whose rail targets (80 units at `s` 160) fit the grown-up minimum but whose positions no longer solve quickly in a test;
- a school opening for the study's M audience, with its own wording check.

## Build notes

Batch `fence-the-field 1`, in progress on `claude/fence-the-field-1-2` ([PR #2037](https://github.com/rjdunlap/neo/pull/2037)), 2026-11-23. What the build settled, where the packet left room or could not be met:

- **Pool counts.** `node scripts/fence-the-field-pool.mjs` prints: level 1, 16,727 classes tried, 15,704 pass; level 2, 2,458 tried, 385 pass; level 3, 342 tried, 86 pass; level 4, 37,328 tried, 791 pass. It keeps the first 60 classes of each level in `pools.json`. No pool is under the 20-class floor.
- **The sampler is fitted to the level.** Rails laid at random without completing a plot almost never leave a field with no plot ready (68 of 35,542 classes), which levels 2 and 3 start from. Level 2's tries therefore never lay a plot's third rail, and level 3 (every plot with exactly two rails open) is counted in full: 2,604 positions in 342 classes.
- **The two play-out filters** read a turn as needing a skill only when it can cost a miss: some rail there is unsound, and every sound rail is a leave-two (levels 1–3) or a give into a shortest run (levels 1–2). A turn where every rail is sound is kept.
- **A leave-two** is a give laid while a plot was ready that leaves two neighbouring ready plots sharing their last open rail. **Level 4's chain** is the ready plots and the two-rail plots joined to them through open rails.
- **Hint lines.** "Every rail gives something" is only said when it is true of the position. A sound give that is not into a shortest run by the rule gets a plain line, "Give this one: it costs least." (new). A tap on a laid rail says "That rail is down already." once a round (new) and counts nothing.
- **Laying on touch-down.** `onTap` answers on touch-down, as every tap in the app does, so the rail darkens and is laid at once, not on lifting.
- **Pet's lines.** "My turn again" is said on the pet's first extra rail, "Your turn" only after a turn in which the pet laid more than one rail.
- **Upright size.** Plots are 200 units (rail targets 100, 50.8 CSS pixels at 390 × 844) on every screen tall enough for the caption strip. A short phone shows the caption as a bubble over the view, and a 700-unit field cannot sit between Home and that bubble, so there the field shrinks until its rails clear the bubble, never under 64-unit targets (at 390 × 625, plots of 177 units, targets 88). A game cannot tell a 1,206-unit strip view (a 375 × 667 phone) from a short bubble screen, so that phone gets plots of 170 units.
- **Sideways.** The caption bubble covers the left 640 units, so the field sits on the right and the strip and Help on the left above the bubble (the packet had them the other way round). On a 1024 × 768 screen there is no room for both, so the field keeps 180-unit plots and the bubble crosses its left edge while the pet speaks.

Batch `fence-the-field 2`, levels 3–4, on `claude/fence-the-field-3-4` ([PR #2042](https://github.com/rjdunlap/neo/pull/2042)), 2026-11-23. The pools, the run reading and the hint kinds came with batch 1; this batch registered the levels and settled:

- **The level-4 line.** A level-4 field opens on a claim, since the leave-two rail only appears once all but two plots are taken, so the glow is a claim on 59 of the 60 first turns. On a turn where every sound way of playing ends on a leave-two, a glowing claim says the leave-two line ("Take all but the last two...") rather than "Close this plot". This never fires at levels 1–3, whose filters exclude such turns; their hint kinds over a hinted play-out are unchanged.
- **The replay plays on to the cost.** *Show me why* now plays best play on both sides until the pet has taken a plot and it is her turn again (or the last rail). A costly claim (taking the whole run at level 4) therefore plays her own claims and the rail she must then give, then the pet's answer; batch 1 had stepped straight back. Where the pet's first answer took nothing (40 of 622 costly rails at level 2, 42 of 567 at level 3), play goes on to where the cost shows; the rest replay as before.
- **No pet leave-two in the level-4 replays.** In all 61 take-the-whole-run replays from the level-4 pool, the pet's first answer is a claim or a quiet rail, never a leave-two of its own, so the batch's play checks that the replay reaches the pet taking plots rather than a pet leave-two.

## Source check

The [Dots and Boxes article](https://en.wikipedia.org/wiki/Dots_and_boxes) (opened 2026-11-22) says:
- it was first published by Édouard Lucas, who called it *la pipopipette* (its reference is his *L'arithmétique amusante*, 1895);
- a player who completes the fourth side of a box "earns one point and takes another turn";
- in a chain, any move gives all its boxes to the opponent; the double-cross is "taking all but 2 of the boxes in the chain", and the player who first opens a long chain usually loses;
- a small board suits learning and a large one experts. It does not report any board as solved, so this packet relies on solving its own small endgames.

The field, the pools, the accounting and the lines are game rules. The pool counts are produced by the build's script and recorded here then; they are not estimated in this packet.
