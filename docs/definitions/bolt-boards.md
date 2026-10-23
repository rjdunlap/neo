# Bolt Boards, levels 1–7 (definition)

**Built 2026-10-20 ([PR #681](https://github.com/rjdunlap/neo/pull/681)), levels 1–7, on every default in [Open decisions](#open-decisions); [build note](../archive/COMPLETED-2026-10-09.md#bolt-boards-levels-17-2026-10-20).** Deviations: Barnyard lists 9 games, not 7 (it already held 8); there is no `bolt.intro` line; the how-to note says "counts as a mistake" and level 6's step merges the glowing holes into "tap a glowing empty hole"; the toolbox sits in the strip beside undo and the basket; the wall shifts right of the pet's corner where they would meet.

Defined 2026-10-17 for [chunk 26](../ROADMAP.md#chunks) (gaps against popular mobile games), from the [IDEAS candidate](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default the build can use, and none needs a content reviewer. They are listed in [Open decisions](#open-decisions) and in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** wooden boards hang on the barn's pegboard wall, held up by big bolts. She taps a bolt and it spins out with a ratchet click. A board with two bolts left stays put. A board with one bolt left swings round and hangs from it like a picture on a nail. A board with none slides softly down to the woodpile, and the fruit or the friend peeking out from behind it hops into the basket. The learning goal starts as **cause and effect through a fastener** (the bolt is what holds the board) and **support** (two bolts hold a board, one makes it a hinge, none lets it go). It grows into **taking things apart in order**: a bolt under another board cannot turn until the board above it is gone, and a board that swings can cover a bolt or uncover a hole. At levels 6–7 every bolt needs an open hole to go into. Then the order she chooses can leave her stuck, a free undo takes it back, and real planning starts.

Nothing is trapped and nothing breaks. The friends are playing peekaboo, and fallen boards land softly on the woodpile.

## References

| Reference | What it shows | What Bolt Boards takes or rejects |
| --- | --- | --- |
| Screw-pin puzzle apps: [Nuts And Bolts Wood Puzzle](https://apps.apple.com/us/app/id6469052078) ("unlock the screw holes in the correct order so the wood plate falls"), [Wood Nuts: Nuts & Bolts](https://apps.appfollow.io/ios/wood-nuts-nuts-bolts/6503027819?country=mo) (move bolts into empty holes until every bar is down) and [Nuts Bolts ASMR - Wood Nuts](https://apps.apple.com/app/id6502181051) (4.9 from about 5.6K ratings; the click and drop sounds are the selling point). Store listings, weighted lightly | Layered plates held by screws; a plate pinned by one screw pivots under gravity; a removed screw goes into an empty hole, so holes are the scarce resource; satisfying click and drop | Takes the layered plates, the one-bolt pivot, the empty-hole rule (levels 6–7 only) and the sound feel. Rejects physics-engine plates (poses here are computed exactly, below), limited moves, boosters, extra-hole purchases, lives and ads |
| [Screw Jam](https://apps.apple.com/us/app/-/id6471490579) (Rollic, 4.6 from about 49K US ratings; store listing, weighted lightly) | Color-matched screws go into color boxes, with rotating platforms and sliding pins | Rejects the color-box sort and its overflowing buffer: Jar Sort and Pile Match already cover sorting into limited storage |
| Willatts (1984), [*The stage-IV infant's solution of problems requiring the use of supports*](https://discovery.dundee.ac.uk/en/publications/the-stage-iv-infants-solution-of-problems-requiring-the-use-of-su/) (abstract page only) | Nine-month-olds pulled the support that would bring them a new toy, not a familiar one, so they were treating the support as a means to an end. Six-month-olds chose at random | Level 1 is one means (a bolt) for one end (the fruit), with nothing between them. Each later level adds one more step between the tap and the reward |
| Baillargeon, [*Infants' understanding of the physical world*](https://labs.psychology.illinois.edu/infantlab/articles.old/baillargeon1998.PDF) (1998) | Infants' expectations about support start as "contact or no contact" and are refined in steps, through type and amount of contact, to center of mass | Background only, not an age claim for this game. It is why the hanging pose is drawn exactly where a center of mass would hang, and why a board's support is a count she can see (2, 1 or 0 bolts) |
| Tower of Hanoi with preschoolers: Klahr and Robinson (1981), as summarized in [Voelter and Call (2014)](https://research-repository.st-andrews.ac.uk/bitstream/10023/8634/1/Voelter_and_Call_2014_Cognition_AM.pdf) (also cited by [Jar Sort](jar-sort.md#references)) | Most 4-year-olds planned at least one move ahead; about a third did not | Levels 1–5 can be cleared one free bolt at a time (see [the model](#the-model)). Only levels 6–7, in pre-K and school, can dead-end, with lit holes at 6 and free undo throughout |
| [Pile Match](pile-match.md) and [Jar Sort](jar-sort.md) (this repository, ready definitions) | A top-only freedom rule and limited storage; frozen solver-checked boards, free undo and a bounded hint search | Copies the frozen-list, undo and bounded-hint shapes. Differs in what is constrained (below) |

## Overlap

- **Pile Match** lets her lift any thing that lies on top of the heap. Here she never lifts a board. She removes the **fasteners**, and what a board does depends on how many are left: it stays pinned, it hangs, or it falls. A swing can *cover* things, which never happens in Pile Match, where the rule is monotone.
- **Jar Sort** parks pieces in a spare jar. Here the parking spots are **holes in the wall that boards cover and uncover**, so where the space is depends on the boards' poses, not on a count. Jar Sort's definition already names Bolt Boards as "the order things come off". The three ready chunk-26 puzzles share "limited room can leave you stuck, so undo is free"; Bolt Boards uses it only at levels 6–7.
- **Peekaboo Barn** (lap) reveals an animal behind a door with one tap. Bolt Boards level 1 is the same reward behind a fastener, and its ladder moves on to support and order.
- **Chain Reaction**, **Domino Run** and **Block Tower** are physics-flavored cause and effect. Here there is no simulation: every pose is computed exactly.
- The IDEAS **Vine Snip** sketch (cut ropes) is waiting on a physics decision. Bolt Boards does not need one.

## The model

- **Wall, boards and bolts.** Boards are authored in a 700 × 560 **wall space**. A board is a rectangle `{ w, h }` with its own layer `z`, and every board has a different `z`. Bolts sit at fixed wall points, and each bolt belongs to one board. Holes (levels 6–7) are fixed wall points too. Every bolt sits in a hole, and some holes are empty.
- **Board state is discrete.** A board is **pinned** (2 or more bolts in it, in its authored pose), **hanging** from bolt `b` (exactly one bolt in it), or **down** (no bolts). A hanging board rotates about `b` so that its center lies directly below `b`. For a bolt at local offset `(bx, by)` from the center, the rotation is the one that takes `(−bx, −by)` to `(0, |b|)`. Authoring keeps every bolt at least 40 units from its board's center, so a hanging pose is always defined. A board authored with one bolt **starts hanging**. A single bolt cannot hold a board level.
- **The swing** is only a tween from the old pose to the new one: about 0.6 s with two small overshoots, purely for show. The state changes at once. Taps that land on a board while it swings are ignored. **Down** is a soft slide off the wall's bottom edge onto the woodpile, behind the basket strip. Boards never collide, because each has its own layer.
- **Covered.** A bolt is **free** when no board on a higher layer, in its current pose, overlaps the bolt head's circle (radius 30). Only free bolts turn. A covered bolt's head is drawn so that part of it shows past the edge of the board above it, which is what a covered bolt looks like.
- **Levels 1–5, the toolbox.** A tapped free bolt flies into the toolbox. The toolbox has no limit. **These levels can never dead-end:** a bolt on the highest remaining board can never be covered, so taking free bolts in any order always gets every board down. A rule test asserts this. The only "order" at these levels is that a covered bolt waits.
- **Levels 6–7, holes.** A lifted free bolt has to go into an **open** hole. A hole is open when it is empty and no board in its current pose overlaps the hole's circle (radius 30). A parked bolt pins nothing and stays parked. A swing or a fall can uncover holes, including the hole the bolt came from, and a swing can also cover one. Here the order she chooses decides which holes open, and a state can be stuck: no free bolt has an open hole to go to.
- **Goals.** At **all boards** levels, the round is finished when every board is down. At **friend** levels (5 and 7), it is finished when no board overlaps the friend's circle. Other boards may stay up, and taking them down too is never wrong.

`logic.ts` holds plain functions: `pose(board, boltsIn)`, `covered(state, bolt)`, `openHoles(state)`, `remove(state, bolt, hole?)` (returns the new state or a refusal reason, `covered`, `no-hole` or `hole-closed`), `done(state, goal)`, `mustGo(state, friend)` (the boards over the friend, plus whatever covers their bolts, transitively), `solve(state, cap)` (breadth-first search over bolt positions, for levels 6–7), `hintMove(state, history)`, `planFor(level)` and `boardLayout(view)`. Boards are a frozen list in `puzzles.ts`. A round picks one with `ctx.rng` and applies a seeded **mirror** (a horizontal flip, which keeps every pose, cover and solution length) and a seeded choice of fruit and friend.

## Screen and controls

- **Fit.** The wall sits below a 120-unit header, above a 150-unit basket strip and right of the pet's corner. `boardLayout` scales the 700 × 560 wall space uniformly to fit. At 1024 × 768 landscape, the scale is about 0.89. In portrait at 768 wide, it is about 1.0, limited by width. Bolt hit circles are radius 60 in wall space, so at least 53 on screen, a 106-unit target. Bolts are at least 120 apart (at least 107 on screen), so no two hit circles overlap. Holes use the same sizes. The basket strip carries the basket at bottom right and the undo arrow.
- **Touch.** On touch-down, a free bolt's head brightens and starts to turn. On a tap (`onTap`), it spins out with rising pentatonic ticks (`src/audio/notes.ts`). A touch resolves to the **nearest free** bolt within its radius. Only if none is in range does it go to the nearest covered bolt. That way a near miss beside a covered bolt is never counted.
- **Levels 6–7, two taps.** Tap a free bolt to lift it, then tap an open hole. At **level 6** open holes glow while a bolt is lifted. Tapping the lifted bolt again, or bare wall, puts it back for free. Dragging a bolt onto a hole (`src/engine/drag.ts`, riding 40 units above the finger) does the same as the two taps. Cancelling, leaving the screen, resizing and a lost release all put a lifted bolt back.
- **Covered tap.** The board above it wobbles once, a gentle boing plays and the pet names it: "The blue board is on top. Its bolts come first." That board's free bolts shimmer once.
- **Undo** is Ferry Jam's round arrow (`RoundButton`, radius 54), unlimited and free. It is shown at every level, so a board can be put back up to look again. **Start again** is in the pause sheet. Neither counts for anything.
- **Speech:** `ctx.instruct` gives the instruction, and the corner pet repeats it. Navigation never needs reading.
- **Feel:** a calm existing music style, not `silenced`. Bolts, boards (wood grain, a color per board so the pet can name it, plus a stripe or spot pattern so color is never the only cue), holes, fruit and friends are Pixi `Graphics`; friends use `src/art/critter.ts`. The ratchet, the swing creak and the soft thump are synthesized in `sfx.ts`.

## Levels

Par is the shortest number of bolt removals. It selects boards and sets the wander threshold at levels 6–7, and **it is never shown to her.**

| ID | Name (`describeLevel`) | Boards · layers · bolts per board | Goal | Holes | Scenes per round |
| --- | --- | --- | --- | --- | --- |
| 1 | One bolt each | 3 side by side · 1 · 1 (hanging) | all boards | — | 2 |
| 2 | Two bolts hold a board | 2–3 side by side · 1 · 2 | all boards | — | 2 |
| 3 | Boards on top | 3–4 · 2 · 1–2 | all boards | — | 2 |
| 4 | Watch it swing | 4–5 · 3 · 2 | all boards | — | 1 |
| 5 | Find the friend | 5–6 · 3 · 1–3 | friend | — | 1 |
| 6 | Every bolt needs a hole | 3–4 · 2–3 · 2 | all boards | 1–2 open at the start, lit | 1 |
| 7 | Holes and a friend | 4–5 · 3 · 1–3 | friend | 1 open at the start, unlit | 1 |

**Bands (`BandLevels`):** `toddler: { min: 1, max: 2 }`, `preschool: { min: 1, max: 4 }`, `prek: { min: 2, max: 6 }`, `school: { min: 4, max: 7 }`. There is no `order`, and no lap or grown-up band.

### First rounds

- **Level 1, scene 1 (authored, always first):** three boards hang side by side from one bolt each, at the top middle. Behind each one an apple, a pear or a plum peeks out. "Tap a bolt." Each tap drops a board, and its fruit hops into the basket. Scene 2 is seeded: three hanging boards, each with its bolt off-center, so it hangs at a tilt.
- **Level 2:** two or three level boards, each with two bolts. The first tap makes the board swing and hang. The second sends it down. "Two bolts hold it up. Take them both."
- **Level 3:** a big board lies across the top of two small ones, and the small ones' bolts peek out from under its edges. Removing the big board's bolts first lets the small ones go.
- **Level 4:** at least one board, once it hangs, covers a bolt that was free. The frozen-list test checks that each level-4 board has a reachable state where a swing covers a previously free bolt.
- **Level 5:** a friend (one of the barn critters, seeded) peeks out from behind two or three boards, and two more boards hang where they are not in the way. "Who's hiding? Help them out." The round finishes as soon as nothing covers the friend.
- **Level 6, first board (authored):** two boards, one on top of the other, and one open hole. Taking the upper board's bolts in one order swings it clear of a hole, which then opens for its second bolt. The other order swings it across the only open hole, and she is stuck. The authored board's test asserts both outcomes. Undo shows her the difference.
- **Level 7:** seeded frozen boards with a friend and one open hole at the start.

## Accounting, help and finishing

- **Never a miss:** any free bolt removed, including bolts on boards that are not in the way; putting a lifted bolt back; undo; Start again; repeating the instruction. Taking boards down that she did not need to is exploring.
- **A covered tap** gets the wobble and the spoken reason above. It is **never a miss at levels 1–3**, because these levels are where she learns what "on top" means. **From level 4 it is one miss**.
- **A closed hole** (levels 6–7: full, or under a board) springs the bolt back with a boing and "That hole is covered." It is free at level 6, where open holes glow, and one miss at level 7.
- **The two-miss glow:** at a scene's second miss, and every second miss after that, the hint bolt (and, at 6–7, its hole) glows until she makes a move. Each glow counts `hints++` once.
- **The hint at levels 1–5** is a free bolt on a board that has to go: any board at all-boards levels, a `mustGo` board at level 5. The highest such board is chosen, so the hint never points at a covered bolt. There is **no wander hint** at 1–5. Every removal is progress, because bolts only come out.
- **The hint at levels 6–7** is the first move of a shortest solution from the current state, from `solve`, capped at 50,000 states (the frozen boards are far below this; the test records the worst case). The **wander hint**, as in Ferry Jam: after `max(6, 2 × par)` removals since the scene began or since the last hint, without finishing, the hint glows and `hints++`. Couch play never offers it.
- **Stuck (levels 6–7 only):** when no free bolt has an open hole, or `solve` proves there is no solution from here, the pet says, "Stuck! Let's take one back," and the undo arrow pulses. That is never a miss and never a hint. If the search only ran out of states, nothing is claimed and the hint falls back to undo, as in Jar Sort.
- **Finish:** when every scene is done, the boards and fruit go into the host's cart, and the friend at 5 and 7 waves and runs off. Then `ctx.finish({ misses, hints })` gives one ordinary sticker, with or without help. No creation, discovery or journal entry is filed.
- **Adaptation** follows the unchanged shell rule. Levels 1–3 can give hints but no misses, the same as other free-error levels. That counts toward adaptation, not mastery.

## Rule tests (`logic.test.ts`)

- `pose`: a board with 2 or more bolts is in its authored pose. With one bolt, its center is directly below that bolt (the x values agree within 0.01 and the center is lower). With none, it is down. A one-bolt authored board starts hanging. No bolt is within 40 of its board's center.
- `covered` and `openHoles` agree with a direct polygon/circle overlap check on sampled states. Removing a bolt never changes any lower board's pose.
- **No dead end at levels 1–5:** for every frozen board at levels 1–5, 200 seeded random sequences of free-bolt removals always finish. At each step at least one free bolt exists until the goal is met.
- **The frozen list:** every board is well formed (distinct layers, every bolt inside its board, bolts at least 120 apart, holes at least 120 from bolts and from each other). Every board is solvable, and at 6–7 its shortest solution is inside the plan's par range. Level 4 boards have a swing that covers a free bolt. Level 5 and 7 boards have at least one board that does not need to go. Level 6 and 7 boards have at least one reachable stuck state, so holes really matter there. Each plan has at least 10 boards, except level 1, which has its authored first scene plus at least 9.
- **Mirror and seed:** mirroring keeps every pose, cover, `mustGo` set and solution length. The same seed gives the same scene.
- `hintMove`: at 1–5 it is always a free bolt on a board in `mustGo` (or any board). At 6–7, from many reachable states, it is legal and lowers the solution length by exactly one, or it is undo at a proven dead end. The worst case stays under the cap and is timed on Node (the target is under 100 ms).
- **Layout:** `boardLayout` at the four standard views. For every frozen board, **every reachable pose** (each board pinned, hanging from each of its bolts) stays inside the wall rectangle and out of the pet's corner. Bolt and hole hit circles are at least 50 on screen and do not overlap one another.
- **Registry, lands and how-to tests** pass with the new game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true` and `autotouch()` tap the hint bolt each time, from the current state: highest-first at 1–5, and at 6–7 the solver's path, bolt then hole. It never demonstrates a covered tap or a closed hole. The bot also does the scripted play's solve.
- **How-to card** (`src/content/howto.ts`). Goal: "Take out the bolts so the boards come down." Steps: "Tap a bolt to take it out" (all levels); "Two bolts hold a board up; with one, it swings; with none, it comes down" `{ from: 2, to: 7 }`; "A bolt under another board waits until that board is gone" `{ from: 3, to: 7 }`; "Tap a bolt, then tap an empty hole for it" `{ from: 6, to: 7 }`; "Glowing holes are open" `{ from: 6, to: 6 }`. Finish: "Every board is down" `{ from: 1, to: 4 }` and `{ from: 6, to: 6 }`; "Nothing covers the friend" `{ from: 5, to: 5 }` and `{ from: 7, to: 7 }`. Note: "The round arrow puts a bolt back, as often as you like." Plus `{ from: 4, to: 7 }`: "Tapping a bolt that is under a board is counted for her level," and `{ from: 7, to: 7 }`: "So is putting a bolt in a covered hole."
- **Voice lines** under `bolt.*`: `intro`, `instruct`, `instruct-two`, `instruct-friend`, `instruct-holes`, `on-top.<color>` (one per board color, so device speech never fills in a template), `hole-closed`, `swing`, `down`, `friend-free`, `stuck`, `hint`, `done`. `{pet}` is optional.
- **Registration:** ID `bolt-boards`, name "Bolt Boards", spoken title `game.bolt-boards`, region (subject) `tinker-lab`, home land **Barnyard** (the barn wall). Barnyard has 6 games today and none pending, so it reaches 7. The alternatives are full: Tinker Lab has 13, Rainbow Meadow has 7 with up to 10 pending (Jar Sort, Sprout Shuffle, Block Garden), Bubble Beach has 4 with 6 pending (Fruit Slice, Domino Run) and Counting Cove has 11 with 12 pending (Pile Match). Skills `['cause-and-effect', 'planning', 'spatial-reasoning']`. The hub icon is a plank with two bolt heads and a plum peeking out. The sticker is a seeded bolt and plank.
- **Co-play:** a grown-up says which board is on top, and she takes its bolts out. **Off-screen:** a toy toolbench or take-apart truck, unscrewing big plastic bolts. Or stack books and take them off top-first.
- **Couch:** none in the first build. A later candidate uses `src/couch/focus.ts` over the bolts and holes, with confirm to remove and confirm to place.
- **Rework couplings:** none required. The level 5 and 7 friend is a natural meeting point for the rework's [creature collection](../rework/WORK-ITEMS.md#rw05-creature-collection-and-active-companion), for example a creature met by freeing it. RW05 and RW10 own that, and this slice saves and unlocks nothing.

## Check tier

New-game tier. Run typecheck and unit tests (all the rule properties above, plus the registry, lands and how-to tests). Then one scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 7, with one covered tap at level 4 or above, one closed hole at 7 and one hint. Take one portrait screenshot at level 6. Run `fingerdemo` at level 5 (one tap per move) and at level 7 (bolt then hole). Run `npm run build`, because the registry, lands, voice and how-to files change. Device checks stay open: whether a toddler connects the bolt to the drop, whether a partly covered bolt head reads as covered on an iPad, and whether undo is found at level 6.

## Open decisions

Each has a default that the build uses. None blocks it.

**Decided 2026-10-23 (on the developer's delegation):** the defaults the build used stand (wooden boards on the barn's pegboard wall; Barnyard; covered-bolt taps free at 1–3, one miss from 4; toddler 1–2; holes at level 6, lit; couch play later).

1. **Theme.** Default: wooden boards on the barn's pegboard wall, with fruit and peeking friends. The alternative is toy-box lids in the treehouse.
2. **Home land.** Default: Barnyard (7 games). The alternative is Tinker Lab with the `tinker-lab` subject, at 14 games, more than `lands.test.ts` has covered.
3. **Covered-tap accounting.** Default: free at levels 1–3, one miss from 4. The alternative is never a miss, with help only through the glow after a struggle.
4. **Toddler entry.** Default: toddler levels 1–2. The alternative is preschool and up only, until a person has watched a 2-year-old play level 1.
5. **Holes in pre-K.** Default: level 6 is in pre-K's range, with lit holes. The alternative is holes for school only (pre-K `{ 2, 5 }`).
6. **Couch play** later, as above. It is not part of this build.
