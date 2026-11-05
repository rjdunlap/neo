# Shape Buddies deep dive

*ID `shape-buddies` · bands pre-K, school · levels 1–6 (levels 1–3 as researched 2026-11-01) · session `claude/dive-shape-buddies`, [PR #1097](https://github.com/rjdunlap/neo/pull/1097)*

## The game today

Two paper friends start plain in their parking spots. She taps one, taps **Flat**, **Cup** or **Slope** to replace its shape, and drags it to a dock; **Try** releases a seed from a fixed chute. A bridge carries the seed over the stream and a cup at the far dock catches it; tapping the pot carries it home and grows a sprout. Learning: a shape's job depends on where it is used (NGSS K-2-ETS1-2, "the shape of an object helps it function", reused from the [inventions study](subjects/inventions.md#anchors-and-evidence-limits) via [engineering design](subjects/engineering-design.md#anchors-opened-at-their-source)), spatial planning, and testing then revising. Home land Tinker Lab. Source: `src/games/shape-buddies/` (`logic.ts` 99 lines, `index.ts` 303, 13 rule tests), [GAMES](../GAMES.md#shape-buddies), its how-to card, the [solo definition](../definitions/shape-buddies.md) and the [level 3 definition](../definitions/shape-buddies-combined.md).

| Level | Plan name | Bands whose window includes it | What she decides | Accepted constructions |
| --- | --- | --- | --- | --- |
| 1 | One gap, one seed | pre-K, school | Which shape bridges and which catches | Flat or Slope at the bridge dock, Cup at the catching dock; either friend in either role (4) |
| 2 | A step down | pre-K, school | The far bank is 50 lower: only a slope reaches | Slope at the bridge, Cup at the catch (2) |
| 3 | Two make one | pre-K, school | The gap is too wide for one: a flat near half and a cup far half hold hands as a spoon | Flat at the near half, Cup at the far half (2) |
| 4 | Down and catch | pre-K, school | Level 3's wide gap with the near half raised 50: the handle must slope down to the cup | Slope at the near half, Cup at the far half (2) |
| 5 | A cup on the ledge | pre-K, school | Level 1's gap is a rocky crack with a ledge inside it: a bridge plus a cup at the catch, or one cup on the ledge | Flat or Slope at the gap and Cup at the catch, or Cup at the gap with the other friend anything (two cups also catch, in the gap first) |
| 6 | Which way round? | school | The stream is mirrored (chute right, pot left, far bank one step lower) | A slope turned to face down toward the low bank, via a Turn button | Slope facing the low bank at the bridge, Cup at the catch (4) |
| 7 | One friend, one job | preschool, pre-K entry | Which shape catches | Cup at the catch; Flat or Slope there rolls off (1) |

**Content pools.** None beyond the two seeded friend colours (two of teal, purple, pink, blue). Geometry, the seed, the pot and the sprout are fixed, so every replay of a level is the same puzzle in different colours. The trace is a finite rule in `trace()`; the state space is tiny (four shapes, three places per friend, docks never shared), which makes exhaustive rule tests cheap.

**Accounting.** Misses are always 0: every Try is an experiment. Help, or two failed Tries for the same role, glows the useful friend, tool and dock; each role is charged at most one hint, so a round charges at most two. Adaptation therefore steps up after two unhinted rounds and steps down only after two rounds that needed both roles hinted.

**Known gaps found in the source (not fixed here):**
- Fixed: the "guidance reaches caught at every level" test now iterates `PLANS`, and `failureLine`'s joined branch takes the step into account at level 4 (`downFlat`, `downPath`), as do `run()`'s paths and the joined scenery.
- Fixed at level 5: `guidance()` finishes what she started (a bridge at the gap gets a Cup at the catch, otherwise a Cup goes to the gap) and never changes a friend already in a working role.
- The heading "A bridge, a cup, a little sprout" stays at level 2 (only level 3 changes it); harmless, since nothing requires reading.
- **Person checks open** ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): iPad drag comfort, device speech, whether a child understands changing a shape to bridge or catch, whether she notices the flat bridge stopping short, and whether the join reads as one spoon.
- **Couch:** no entry, no controller mode.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Snipperclips](https://www.commonsensemedia.org/game-reviews/snipperclips-cut-it-out-together) (Nintendo; search summary of reviews, already the game's named reference in [IDEAS](../IDEAS.md)) | Co-op shape puzzle | Two paper cutouts cut each other into shapes to carry a ball; later stages add materials (slime, water) and party modes | Two friends whose shapes matter together; carrying the object as the payoff; a two-player role split | Free cutting, precise steering, the patience-testing co-op pressure reviewers note |
| [Thinkrolls](https://apps.apple.com/us/app/917176209) (Avokiddo; App Store listing, search summary) | Logic puzzles for ages 3–8 | 207 levels; seven elements with physical properties introduced one at a time; an easy mode (3–5) and a hard mode (5–8) | One new property per step, introduced alone before it combines; two difficulty bands over the same mechanics | Its long maze chains (memory load), cookies eaten to clear paths |
| [Gravity Maze](https://thinkfun.com/products/gravity-maze/) (ThinkFun; product page, search summary) | Physical marble-run logic game, 8+ | 60 cards in four tiers; each card fixes start, target and the towers to use | A fixed set of parts and a fixed start/target per puzzle; several cards with the same pieces arranged differently | Precise multi-tower routing (that is Chain Reaction's territory) |
| [Crayon Physics Deluxe](https://en.wikipedia.org/wiki/Crayon_Physics_Deluxe) (Petri Purho; encyclopedia entry, search summary) | Drawn-physics puzzle | From a line to ramps, bridges, pulleys and weights; many levels solvable more than one way | Several valid answers to one fixed puzzle | Freehand drawing, general physics, brute-force solutions |
| [Poly Bridge 2](https://store.steampowered.com/app/1062160/Poly_Bridge_2/) (reused from the [engineering study](subjects/engineering-design.md#similar-games-apps-and-physical-play)) | Bridge-building physics | New materials and vehicles; deterministic replay | Its first-break indicator, which this game already has as "name the first unsupported role" | Budgets as a score, collapse spectacle |
| The Incredible Machine (recalled, not opened) | Contraption puzzle | More parts, more steps | Fixed parts, a deterministic run, free retries | Long chains; part routing belongs to Chain Reaction |
| Cardboard ramps and cove-molding Ramps and Pathways (reused from the engineering study, search summary) | Unplugged build–test–improve, ages 3–8 | Children change one part and test again | The off-screen card already does this; turning a ramp round is a natural next card | Its timed build windows |

**Learning anchors.** K-2-ETS1-2 (shape helps function) and K-2-ETS1-3 (compare two objects designed to solve the same problem), both reused by link from the [engineering study](subjects/engineering-design.md#anchors-opened-at-their-source); spatial orientation (which way a ramp faces) is the geometry strand's position-and-direction vocabulary, not a separately cited standard here.

## What makes sense here

**What makes a second arrangement a different problem** (the [family experience](../FAMILY-EXPERIENCE.md) row 5 question): a change in *where* a shape has to work. A step down changes which bridge works; a wide gap makes one shape too short; a ledge gives a cup something to stand on so a cup can work where a bridge was needed; a stream running the other way makes a slope's direction matter. Each keeps the game's one action, the same friend switching between supporting and containing depending on its place.

**Boundaries.** If a level reduces to "place ramps so a ball reaches a target", it is a [Chain Reaction](../GAMES.md#chain-reaction) level, not this game ([solo definition](../definitions/shape-buddies.md#purpose-and-overlap)). Welcome Ways ([engineering study](subjects/engineering-design.md#a-first-games-ladder-welcome-ways)) owns entrances shared by several users; Gadget Bench owns repairing an existing build (so *Fix one thing* is left out here); Habitat Helpers owns "include one piece per need". Shape Buddies keeps two friends, three shapes and one seed.

**Long-term arc.** Pre-K: one rule changes per level, then two combine (levels 1–5). School: a construction that has several answers, then orientation (levels 5–6). Preschool: one friend, one job (an appended entry). Co-play: two players, one friend each, taking turns ([level 8](#level-8-your-friend-my-friend-shared-roles-defined-2026-11-05)). Nothing past school; the game's ceiling is two friends and three shapes, by design.

## Experience and presentation

- **First unsupported action:** at level 1, tapping a friend and a tool already changes its shape with a pop and the tool's spoken word; dragging it to a dock and pressing Try shows the result. No adult answer is needed.
- **Pleasure:** the seed's run is the payoff, and the carry to the pot is a small parade. The sprout is the same every time today; varying what grows (slice 1) gives replay a small surprise without touching the rule.
- **Touch and consequence:** tools pop on touch-down; a failed run drops the seed onto a pink cushion with a boing and names the first role that failed; Replay returns a caught seed. Input is locked only during the run and the carry.
- **Art/feel example (slice 1):** three seeds and sprouts drawn with `Graphics` in `index.ts` beside `seedArt()`: a **bean** (a brown kidney ellipse) grows a curling vine with two round leaves; a **sunflower seed** (a striped grey teardrop) grows a stalk with a yellow `swatch.yellow` petal ring; an **acorn** (`wood` cap over a brown ellipse) grows a two-leaf oak twig. The pot tips, `sfx.sparkle()` plays as now, and the seeded kind is fixed per round.
- **Reasoning versus precision:** drops resolve to the nearest dock within a generous radius; the trace ignores drop position. Reading is never needed: tools have pictures and spoken words.
- **Supported completion:** Help and the second-failure glow lead to a caught seed in at most four edits at every level (a rule test). Planting is always her tap.
- **Co-play:** today a co-play hint only. A shared-role mode (each player owns one friend by colour, with the one-player switch kept) is defined as [level 8 *Your friend, my friend*](#level-8-your-friend-my-friend-shared-roles-defined-2026-11-05) (slice 7).
- **Needs a person:** whether a pre-K child chooses Turn without prompting (level 6); whether the ledge reads as "something under the cup" (level 5); whether a preschooler links "Cup" to "catch" without the bridge role (level 7); device speech for the new lines.

## Proposed ladder

### Fresh content inside existing levels

**What grows.** A seeded seed kind per round: bean, sunflower or acorn, each with its own code-drawn seed and sprout (above). The word "seed" stays in every line, so no voice changes. The sticker keeps its seeded colours. A rule test asserts the kind is drawn from the round's RNG after the friend colours (so colours on old seeds stay the same) and that `trace` and `guidance` ignore it. In the same slice, the "every level" guidance test iterates `Object.keys(PLANS)`.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | **Down and catch** | pre-K, school | Level 3's wide gap over level 2's step: the near half is raised 50 like level 2's bridge dock, the far half sits at the low bank | The spoon's handle must slope down; the bowl is a cup at the low end | Misses 0. New lines: `buddies.start4`, `buddies.downPath` (no path, or plain/cup path: "the seed needs a path that slopes down to the low bank") and `buddies.downFlat` (a flat path stays up high and stops short); a missing or wrong far half reuses `joinShort` and `joinCup`. Guidance suggests Slope then Cup | Enumerating every construction, exactly Slope near + Cup far is caught, in either identity (2); every other names its first failing role; guidance reaches caught within four edits | `PLANS[4] = { bridges: ['slope'], drop: 50, joined: true }`; `failureLine`'s joined branch takes `drop` into account; two new animation paths in `run()`; the joined scenery draws the step; the heading and caption lift as at level 2; `LEVELS` max 4, `DESCRIPTIONS[4]`, a `{ from: 4, to: 4 }` how-to step; the bot is unchanged (it follows `guidance`) |
| 5 | **A cup on the ledge** | pre-K, school | Level 1's narrow gap, now a rocky crack with a ledge inside it; the catching dock and the pot as at level 1 | Two ways work: a bridge plus a cup at the catch, **or** one cup standing on the ledge in the gap (the second friend free) | Misses 0. A plain or empty gap: `buddies.ledgeNeed` ("the seed falls into the crack: make a bridge over it, or a cup that sits on the ledge"); a bridge without a catch reuses `buddies.cup`. Guidance finishes the construction she started: a bridge shape at the gap leads to a Cup at the catch; otherwise a Cup to the gap | Exactly two families are caught: (Flat or Slope at the gap and Cup at the catch) or (Cup at the gap, the other friend anything); guidance never changes a friend already in a working role; the carry starts from the dock holding the seed | `PLANS[5]` gains a `ledge` flag; `trace` returns which dock caught; `carry()` starts from that dock; the scenery draws the ledge under the bridge dock (and level 1's cup over open water keeps failing because nothing holds it up; the start line says so); new lines `buddies.start5`, `buddies.ledgeNeed`, and `buddies.otherWay` spoken once after planting ("There was another way too") without asking for it |
| 6 | **Which way round?** (built 2026-11-05) | school | The stream runs the other way: the chute is on the right, the pot on the left, and the far bank on the left is one step lower | A slope must face down toward the low bank: she presses a new **Turn ↔** button for the selected friend | Misses 0. An unturned slope: `buddies.turnSlope` ("the slope goes up the wrong way; tap Turn"); a flat bridge reuses the step-down idea in `buddies.stepFlat`. Guidance: select the slope friend, then Turn. A Turn is free | Mirroring the level-2 plan, exactly a left-facing Slope plus Cup is caught; turning twice restores the state; Turn is undoable; guidance's next action from an unturned slope is Turn | `Friend` gains `facing: 1 \| -1` (default 1, so levels 1–5 are unchanged); `layout()` mirrors x for this level; `paper()` mirrors with `scale.x`; a fourth bottom button at `left + 880` (the layout test checks four views); the bot taps Turn through `autotouch()`; new lines `buddies.start6`, `buddies.turnSlope`, `buddies.turn` |

### Younger-band openings

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **One friend, one job** (built 2026-11-05) | preschool; pre-K entry | One friend in its parking spot; a fixed wooden plank already spans the gap; one catching dock and the pot | Which shape catches: she makes the friend a Cup and drags it to the catch | Misses 0. Flat or Slope at the catch: `buddies.oneRoll` ("the seed rolled off the end: make your friend a cup"); plain or empty: `buddies.cup`. Help glows Cup and the dock | With one friend, only Cup at the catch is caught; guidance takes at most two edits from any state; the plank is not a friend and cannot be selected or dragged | `PLANS[7]` with `plank: true` and one friend; `Construction` allows one friend (or a parked second friend hidden); `LEVELS` gains `preschool: { min: 7, max: 7 }`, pre-K `order: [7, 1, 2, 3, 4, 5]` and `entryLevels: [7]`; `bands` adds `preschool`; the preschool Tinker Lab page must fit; lines `buddies.start7`, `buddies.oneRoll` |

### Easier entries and levels between existing ones

Level 7 is the only appended easy entry (above). Pre-K's window becomes `order: [7, 1, 2, 3, 4, 5]` with `entryLevels: [7]`, so nothing is renumbered and a birthday from preschool lands on a level she can play. No level belongs between 1 and 2: level 2 already changes exactly one fact.

### Level 8 *Your friend, my friend*: shared roles (defined 2026-11-05)

Chunk 23's [one shared job](../FAMILY-EXPERIENCE.md#w3-one-shared-job), built on level 3. It follows the October 23 [second-seat contract](../archive/DECISIONS-2026-10-23.md#standing-rules) (S5: the second seat is anonymous and uncredited, only seat 1's play is read by `difficulty.ts`, and a role-swapped round counts as supported completion) and the [seat contract](../IDEAS.md#the-seat-contract). Like Secret Code's [*Swap seats*](secret-code.md#level-12-swap-seats-maker-and-breaker-defined-2026-11-05), the turns are sequential, so it needs no simultaneous input and no second profile.

- **Fun action and learning.** Two people each own one paper friend and build level 3's spoon together: one makes the flat handle, the other the cup at the end. When a Try fails, the line names the role that broke, so the pair learns whose job needs changing ("your job, my job", the pre-K row of [playing together](../IDEAS.md#the-seat-contract)). The learning is level 3's: a shape's job depends on where it is used, and two shapes can make one tool.
- **Why level 3.** Its wide gap needs both friends, so neither person is left without a job. Level 1 lets one person do both roles in their head, level 5 can be solved by one cup alone, level 6's Turn is school-only and a second new control, and level 7 has one friend. Level 3 also already has `buddies.together` for the payoff.
- **Plan.** `PLANS[8] = { ...PLANS[3], shared: true }`: the same geometry, accepted set (Flat at the near half, Cup at the far half, either identity) and lines as level 3. `trace`, `guidance` and `failureLine` read it exactly as level 3. Pre-K and school. Preschool keeps level 7 only.
- **Who is playing.** The round opens on two round buttons, at least 112 units each, side by side over the stream, clear of the parks, tools and the pet's corner. **Two of us** shows two figures (Secret Code's `twoArt()`, moved to `src/art/seats.ts` and imported by both games with no visual change). **Just me** shows one figure (a new `oneArt()` in the same file). `buddies.seats` asks the question aloud. The choice lasts for the round. The tools, friends and buttons stay hidden until she chooses.
- **Who owns which friend.** The device cannot tell whose finger it is, so ownership is spoken and the turn is enforced. Friend 0 (the left park) is hers and moves first; friend 1 is the other seat's. `buddies.start8` says so without a seat-2 name: "{name}, your friend goes first. Your partner has the other one. Take turns: only the glowing friend can move." The friends keep their seeded colours, and the colour is the role word the [seat contract](../IDEAS.md#the-seat-contract) asks for.
- **Turns (Two of us only).**
  - Only the turn holder's friend can be selected, tapped or dragged (`DragHandle.enabled` off for the other, and a guard in `SeedRound.select`). It carries the colour ring that already marks the selected friend; the other friend is dimmed to alpha 0.55.
  - Tools act on the selected friend, as now, so a shape change always goes to the turn holder. She can try shapes freely; **a shape change never passes the turn**.
  - **Dropping the friend passes the turn**, on a dock or back in its park, changed or not. Dropping it back where it was is how a player says "mine is fine".
  - **Try** can be pressed on either turn. After a failed Try the turn goes to `guidance(state).friend`: the friend whose role the line just named, or the parked friend. Help does the same: it glows the useful friend, tool and dock, and hands the turn to that friend.
  - Undo restores the construction and the turn holder from before the edit.
  - Tapping or picking up the dimmed friend wobbles it and repeats the turn line. It is not a miss, a boing or a hint.
  - Each new turn says the holder's colour: `buddies.turnTeal`, `buddies.turnPurple`, `buddies.turnPink` or `buddies.turnBlue` ("The teal friend's turn."). These are slot-free, so they can get clips.
  - After a catch, either person may tap the pot. Replay returns the turn to her friend.
- **Just me** (the solo switch kept; nothing new is built for it). She switches between both friends exactly as on level 3: no turns, no dimming, no turn lines. A child who steps up into 8 alone plays level 3 again, so adaptation never strands her in a mode that needs a second person.
- **Accounting.** Misses stay 0 (every Try is an experiment). Hints stay per role, at most one per role.
  - `SeedRound` records which friend each hint was charged to: the friend `guidance` names when the hint is given.
  - A **Two of us** round finishes through a pure `sharedResult(twoSeats, hintsOnHers)` in `logic.ts`. It returns `{ misses: 0, hints: Math.max(hintsOnHers, 1) }`. A hint on the partner's friend never counts against her, and the round is never smooth, so a grown-up's play cannot step her up. Two hints on her own friend still step her down. This is the same rule as Secret Code's `swapResult`. Lift it to a shared helper only when a third game needs it.
  - **Just me** passes the round's hints unchanged.
  - There is no shell change and no new `RoundResult` field.
- **Placement.** Pre-K `order` becomes `[7, 1, 2, 3, 8, 4, 5]` with max 8. School gains `order: [1, 2, 3, 8, 4, 5, 6]` with max 8; level 7 stays out of school.
  - Level 8 comes right after level 3 because it plays level 3's spoon. A two-seat mode is not harder than level 4, and a solo round at the top would be easier than the level below it.
  - It is not an entry level (`entryLevels` stays `[7]`). A pin or the how-to card's arrows take a family straight to it.
  - No ID is renumbered. Not on the couch. The "two seats" icon mark (S8) is shell work for its own slice.
- **Voice** (7 new `buddies.*` lines):
  - `buddies.seats`: "Who is building with you? Tap the two friends to build with someone, or tap one friend to build alone."
  - `buddies.start8` (above)
  - `buddies.turnTeal`, `buddies.turnPurple`, `buddies.turnPink` and `buddies.turnBlue`
  - `buddies.shared`, spoken once after planting in Two of us: "You each did a job, and together it worked!"

  Level 3's `buddies.start3`, `joinPath`, `joinSlope`, `joinShort`, `joinCup`, `together`, `plant` and `done` are reused; Just me speaks `buddies.start3`. The lines say "your partner" and never name the second seat.
- **Grown-up text.** `DESCRIPTIONS[8]`: "Your friend, my friend: two people take one friend each and take turns to build level 3's spoon (or one player switches between both)". A `{ from: 8, to: 8 }` how-to step: "Two of us: one friend each; only the glowing friend moves, and dropping it passes the turn. Just me: switch between both friends." The co-play line gains: "On Your friend, my friend, take one friend each."
- **Bot (`autotouch`).** It taps **Two of us**, then follows `guidance` under the turn lock: select, tool, drag to the dock (which passes the turn), and Try. If `guidance` names the friend that does not hold the turn, it taps Try, which hands the turn over. From the start that never happens: Flat then the near half (turn passes), Cup then the far half (turn passes), Try. The turns are sequential, so one ghost finger demonstrates both seats; the seat contract's two-finger demo gap does not arise here.
- **Rule tests.**
  - In Two of us, `select`, `edit` and a drag of the friend without the turn are refused, and in Just me they never are.
  - A shape change never passes the turn; every drop does, changed or not.
  - After a failed Try, and after Help, the turn holder is `guidance(state).friend`. Undo restores the previous turn holder.
  - Following `guidance` under the turn rule from `initial()` reaches caught in four edits and one Try with no hand-off Try. From every construction, the bot reaches caught within two Tries.
  - `sharedResult` is never smooth with two seats, ignores hints charged to friend 1, and is unchanged for Just me. A round charges at most two hints.
  - `PLANS[8]` accepts exactly level 3's set.
  - The pre-K and school `order` tests list 8 right after 3, preschool excludes it, and it is not an entry level.
  - The seat buttons are at least 112 units and overlap nothing in `layout()`, in portrait and landscape.
- **Check tier: new interaction.**
  - Typecheck and the unit tests above.
  - One scripted play of level 8 at pre-K choosing **Two of us**: one tap on the dimmed friend (a wobble, no miss), a failed Try with a plain far half that hands the turn to friend 1, then to the sticker. Confirm the finished result has `hints >= 1`.
  - One portrait screenshot of the seat question.
  - `fingerdemo` at 8.
  - One build for the voice lines and the moved art.
  - Secret Code's level 12 seat buttons share the moved art, so run one filtered Secret Code regression play of level 12 to its seat question. Do not run its full suite.
  - **Not established by the check:** whether two people at one iPad take turns this way without a grown-up policing it, and whether a pre-K child hears "your partner" as the other person. Both go to [DEVICE-CHECKS](../DEVICE-CHECKS.md) with the build.
- **Expected files:** `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, `src/art/seats.ts` (new), `src/games/secret-code/index.ts` (the import only), `src/content/voice-script.ts`, `src/content/howto.ts`, and docs.

### Left out on purpose

- **Fix one thing** (a built construction that fails once, then she changes one part): repair belongs to Gadget Bench's *Fix-It Day* in the engineering study.
- **Two bridges over a stepping stone** (no cup needed): a proposal only; it needs a third dock kind and mostly tests "count the gaps".
- A third friend or tool, free cutting or drawing, general physics, timers, scoring by fewest moves, kept creations and save fields.
- **Couch course:** no controller interaction exists; a pad mode for select, tool and dock would be a new interaction. Revisit only if the shared-role definition wants a pad seat.

## Decisions for the developer

None blocking. Under the [October 23 delegation](../archive/DECISIONS-2026-10-23.md#standing-rules) the leans stand: pre-K plays 1–5 and 7, school 1–6, preschool 7 only; Turn is school-only; level 5 accepts both families and never asks for the second; levels keep misses at 0.

## Build slices, in order

1. **What grows: three seeds and sprouts (batch shape-buddies 1; built 2026-11-03, PR #1145).** Seeded bean, sunflower or acorn with its own sprout; guidance test over every `PLANS` level. *Check:* existing-interaction tier: typecheck, the game's rule tests, one filtered regression play of level 1 to its sticker, one portrait screenshot of a non-bean sprout; bot unchanged, no `fingerdemo`.
2. **Level 4 Down and catch (batch shape-buddies 2).** Built 2026-11-04 ([PR #1244](https://github.com/rjdunlap/neo/pull/1244); [checks](../archive/VERIFICATION-2026-11-04.md#2026-11-04--shape-buddies-level-4-down-and-catch-shape-buddies-batch-2)). *Check:* new-level tier: typecheck, rule tests (the exact accepted set, the step-aware joined lines), one play of level 4 with a flat path first then to its sticker, one portrait screenshot of the raised near half, `fingerdemo` at 4, one build for the voice lines.
3. **Level 5 A cup on the ledge (batch shape-buddies 3).** Built 2026-11-05 ([PR #1248](https://github.com/rjdunlap/neo/pull/1248); [checks](../VERIFICATION.md#2026-11-05--shape-buddies-level-5-a-cup-on-the-ledge-shape-buddies-batch-3)); after batch 2 (shares `PLANS`, `LEVELS` and the joined-line changes). *Check:* new-rule tier: typecheck, rule tests (both families, guidance keeps a working friend, the carry from either dock), one play of level 5 solved with the cup on the ledge and a replay solved with bridge and cup, one portrait screenshot of the ledge, `fingerdemo` at 5, one build.
4. **Level 6 Which way round? (batch shape-buddies 4).** Built 2026-11-05 ([PR #1253](https://github.com/rjdunlap/neo/pull/1253); [checks](../VERIFICATION.md#2026-11-05--shape-buddies-level-6-which-way-round-shape-buddies-batch-4)); after batch 3. *Check:* new-interaction tier: typecheck, unit tests including the four-view layout with Turn, one scripted play with an unturned slope then Turn to the sticker, one portrait screenshot of the mirrored stream, `fingerdemo` at 6, one build.
5. **Level 7 One friend, one job, the preschool opening (batch shape-buddies 5).** Built 2026-11-05 ([PR #1256](https://github.com/rjdunlap/neo/pull/1256); [checks](../VERIFICATION.md#2026-11-05--shape-buddies-level-7-one-friend-one-job-shape-buddies-batch-5)); after batch 2 (shares `LEVELS`). *Check:* new-band tier: typecheck, unit tests including the lands, registry band and order/entry tests, one play of level 7 at preschool with a Flat friend at the catch first, `fingerdemo` at 7, the preschool Tinker Lab page screenshot.
6. **Define Shape Buddies shared roles** (docs only; chunk 23). Defined 2026-11-05: [level 8 *Your friend, my friend*](#level-8-your-friend-my-friend-shared-roles-defined-2026-11-05).
7. **Level 8 Your friend, my friend (batch shape-buddies 6),** after batch shape-buddies 5 (built; shares `LEVELS` and the pre-K `order`). Claimed 2026-11-05 on branch `claude/shape-buddies-shared-roles`. *Check:* new-interaction tier as stated in [its definition](#level-8-your-friend-my-friend-shared-roles-defined-2026-11-05).

## What was built in this session

Slice 1 (batch shape-buddies 1, 2026-11-03): art only. Build note in [the archive](../archive/COMPLETED-2026-10-09.md#shape-buddies-what-grows-three-seeds-and-sprouts-shape-buddies-batch-1-2026-11-03). Slice 2 (batch shape-buddies 2, 2026-11-04): level 4 *Down and catch*; [build note](../archive/COMPLETED-2026-10-09.md#shape-buddies-level-4-down-and-catch-shape-buddies-batch-2-2026-11-04). Slice 3 (batch shape-buddies 3, 2026-11-05): level 5 *A cup on the ledge*; [build note](../archive/COMPLETED-2026-10-09.md#shape-buddies-level-5-a-cup-on-the-ledge-shape-buddies-batch-3-2026-11-05). Slices 4–6 are not built.
