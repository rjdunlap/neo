# Shape Buddies level 3: Two make one (defined 2026-10-17)

**Definition of ready, docs only.** Stable ID `shape-buddies`; roadmap [chunk 5](../ROADMAP.md#next-up); levels 1–2 are [defined and built](shape-buddies.md). This adds one appended level on the existing interaction: the "two useful shapes combined" proposal left open there. Nothing is renumbered.

## Purpose and overlap

**Fun action:** the gap is too wide for one friend. Two paper friends hold hands across it: a flat friend makes the handle and a cupped friend makes the bowl, so together they form a **spoon** that reaches over the water and catches the seed. Then both friends carry the spoon to the pot together.

**Learning goal:** the game's own goal, that a shape's function depends on where it is used, now applied to parts of one whole. Two shapes combined make a tool neither makes alone. The order matters: the path comes first and the bowl at the end. The containing half of the goal stays visible, because the cup is part of the combination, not a separate station.

**Why it is a real next decision.** The real step is against level 2, the level she arrives from. There only Slope reached the low bank. Here the banks are level again and the gap is wide, so a slope in the near half dips into the water halfway, and Flat works again. A child who learned "slope is the answer" has to look at the place again. The rule itself is level 1's (a flat bridge then a cup), so level 3's accepted constructions are a subset of level 1's. What is new is presentation that carries the idea: the two friends visibly join into one spoon over the water, and they carry it to the pot together. That shows two parts making one tool. Flat followed by flat still rolls the seed across and away, so the end of the spoon has to be a cup.

**Overlap checked.** [GAMES](../GAMES.md#shape-buddies), the [idea notebook](../IDEAS.md#candidates) and the deep-dive tracker (Shape Buddies not started) were checked. Chain Reaction fills sockets with ramps to route a marble. Here the two positions need *different* shapes, and the joined pair is one object that holds the seed and is carried, so it is not socket routing. Bug Builder composes matching body parts with no function test. Two Friends (Fireboy and Watergirl, IDEAS) is a cooperative-seat proposal; this level stays solo with one player moving both friends. Silly Describer's shared scarf (IDEAS) is word play, not construction.

## References

| Game | What it lends |
| --- | --- |
| [Snipperclips](https://www.nintendo.com/us/store/products/snipperclips-cut-it-out-together-switch/) (Nintendo, 2017) | Two characters overlap to make one shape neither can make alone. We keep predefined shapes and one player, with no cutting and no second seat. |
| [Thinkrolls 1](https://apps.apple.com/app/id917176209) (Avokiddo) | A preschool easy mode (3–5) where object properties combine in a set order to clear a path; spoken, picture-led, no fail screen |
| [The Incredible Machine](https://www.mobygames.com/game/2473) (Sierra, 1993) | Limited parts combined around fixed pieces; run the machine, watch the first failing step and revise. We use a finite trace, not a simulation. |
| [Crayon Physics Deluxe](https://store.steampowered.com/app/26910/) (Kloonigames, 2009) | Bridging a gap that one shape cannot span, and seeing the result immediately. We use no freehand drawing or physics engine. |

## Level 3: the wide gap

**Arrangement.** The banks are level, as at level 1 (`drop: 0`). The stream is wider: the left bank and chute end at about `left + 290`, and the far bank begins at about `left + 690`. The two docks sit side by side over the water as one **joining dock** with a near half and a far half. They reuse the existing `bridge` and `receiver` dock IDs, so `Dock`, `Failure`, `failures` and per-role hint de-duplication keep their keys.

| Box (180 or 120 wide × 110 tall unless noted) | Centre | Extent x | Extent y |
| --- | --- | --- | --- |
| Near half (`bridge`) | `left + 380, 300` | 290–470 | 245–355 |
| Far half (`receiver`), **180 wide at level 3** (110 at levels 1–2) | `left + 580, 300` | 490–670 | 245–355 |
| Pot (120×120) | `left + 870, 300` | 810–930 | 240–360 |
| Parks, tools, buttons | unchanged from level 1 | | |

The near and far halves are 20 units apart. Drops already resolve to the nearest dock within its radius, so the two halves split cleanly. No box shrinks, every target stays at least 100 units, and the bottom-left pet corner stays clear, as at level 1. A friend placed in the far half uses the 180-wide friend hit area, the same width the bridge dock uses today. A thin dashed outline joins the two halves to show they make one thing. When both halves are filled, the friends are drawn holding hands: the flat friend's end overlaps the far friend's near edge by about 10 units. These are drawings only, and both drawings set `eventMode = 'none'`.

**First round:** both friends start plain and parked, as at every level. She chooses a friend, taps Flat, drags it to the near half, chooses the other friend, taps Cup, drags it to the far half, taps Try, and the seed rolls along the handle into the bowl. Tap the pot: both friends lift the spoon together and walk it to the pot. The far friend tips the seed in, a sprout grows, and the round finishes through `ctx.finish({ misses, hints })` once, for one shell sticker.

**What she decides:** which shape each friend takes, and which friend goes in which half. Order is part of the decision.

## Outcomes, all from the finite trace

At level 3, `trace()` is unchanged in form: the bridge (near half) must be one of the level's `bridges`, then the receiver (far half) must be `scoop`.

| Near half | Far half | Result | Spoken |
| --- | --- | --- | --- |
| flatten | scoop | caught in the spoon's bowl; tap the pot | `buddies.plant` (unchanged) |
| slope | anything | dips into the water halfway (`bridge`) | `buddies.joinSlope` |
| empty, plain or scoop | anything | falls into the near water (`bridge`) | `buddies.joinPath` |
| flatten | empty | one friend can't reach; rolls off its end (`receiver`) | `buddies.joinShort` |
| flatten | plain, flatten or slope | rolls across and away past the pot (`receiver`) | `buddies.joinCup` |

There are two accepted constructions: friend A flat in the near half with B cupped in the far half, or the two friends swapped. Accept the visible outcome and never compare to a stored answer. A failed run drops the seed onto a cushion in the stream (or past the pot, onto the far bank's cushion, for `joinCup`) with a soft boing.

**Misses, hints and glow** are unchanged in policy. Choosing, reshaping, parking and failed trials are exploration, so **misses stay 0**. After two unsuccessful runs for the same role, or explicit Help, the role's friend, tool and half-dock glow. Each role counts at most one hint across the round. At level 3 the near half's useful tool is **Flat** and the far half's is **Cup**. Undo, Replay, occupied-dock rejection, the run and carry lock, and completion once are unchanged.

## Rules in `logic.ts`

- Add `3: { bridges: ['flatten'], drop: 0, joined: true }` to `PLANS`. Levels 1 and 2 have `joined` absent or false, and their plans, traces, guidance, layout and voice stay byte-for-byte as they are.
- Add a pure `failureLine(s, level)` that returns the voice ID for the scene to speak. At levels 1–2 it returns today's IDs (`buddies.bridge`, `buddies.stepFlat`, `buddies.stepBridge`, `buddies.cup`), moving the scene's current choice into tested code. At level 3 it returns the four `join*` IDs from the table.
- `guidance(s, 3)` suggests Flat for the bridge and Scoop for the receiver. It picks the friend already in the failing dock, otherwise the parked friend. With two friends and two docks, a failing empty dock always leaves a parked friend: if one friend is placed elsewhere, the other is parked. A test asserts that the result is never `-1` at any level.
- `layout(w, h, 3)` moves the bridge dock to `left + 380` and the receiver to `left + 580`, and reports the far half's width (180) so the scene draws the box and hit area from it.
- `SeedRound` takes the level as it does now. No new state, save field or intent type is needed.

## Ladder, IDs and description

`LEVELS` becomes `prek: { min: 1, max: 3 }`, `school: { min: 1, max: 3 }`, with no `order`. Pre-K (about 4–5) gets it because it is one visible change with spoken support, as level 2 was. The usual two-smooth-rounds step-up applies. `describeLevel(3)`: "Two make one: a flat friend and a cup friend make a spoon; test and plant one seed".

## Speech and how-to

New lines in `src/content/voice-script.ts`:

- `buddies.start3` (the level-3 `ctx.instruct`, repeated by the corner pet): "The gap is too wide for one friend. Make them hold hands: a flat path, then a cup at the end. Choose a friend, change its shape, and drag it to a dock."
- `buddies.joinPath`: "The seed needs a path from our bank. Make the first friend flat and drag it to the near half."
- `buddies.joinSlope`: "The slope dips into the water in the middle. Here the path needs to stay flat."
- `buddies.joinShort`: "One friend can't reach across. Put the other friend at the far half, holding hands."
- `buddies.joinCup`: "The seed rolled right across and away. Make the friend at the end a cup to hold it."
- `buddies.together` (said once as the carry starts, through `ctx.say`): "Together you made a spoon!"

In `src/content/howto.ts`, add the step `{ from: 3, to: 3, text: 'Drag one friend to each half of the wide gap. A flat path and a cup at the end make a spoon.' }` beside the existing level-1 and level-2 dock steps. The goal, the other steps, the finish and the note hold at all levels ("Either friend can do either job" stays true). Counted with `howto.test.ts`'s formula (`describeLevel` + goal + steps + finish + note), the level-3 card is **803** characters, under the 840 cap. Level 2 is 819. A first draft of the line and description came to 883, so keep these shorter wordings.

Co-play prompt: "What did the two friends make together?" Off-screen activity: lay a flat book across two cushions with a bowl at the far end, and roll a large soft ball along it into the bowl. Use no small objects.

## Ghost finger, art, rework and couch

- **Ghost finger:** `autotouch()` already follows `guidance()`. With the level it selects a friend, taps Flat, drags to the near half, does the same with Cup and the far half, then Try and the pot. It uses the same handlers and adds no intent type.
- **Art:** the existing silhouettes are reused. New drawings are only the wider stream, the dashed joining outline, the hand-holding overlap and the two-friend carry pose. All are Graphics with the palette and seeded colors, and synthesized sounds (a soft "clasp" chime when both halves fill, on a pentatonic step).
- **Rework coupling:** no unlock, collection item, save field or journal entry. If the creature rework later restyles the paper friends (RW02 onward), these roles carry over unchanged. A future adventure request such as "make a spoon" may reference this level once RW07's project rules exist, but nothing here waits on it.
- **Couch:** none. There is no controller mode and no second seat.

## Check tier: new levels on an existing interaction

Tools, drags, docks, Try, Undo, Replay, Help and the pot are the same handlers. Only the dock positions, the far-half width and the roles' meaning change.

- Typecheck.
- Shape Buddies rule tests:
  - Both accepted level-3 constructions catch. Every other table row gives its failure and its `failureLine`.
  - Flat-then-flat fails `receiver` at level 3, while flat-and-scoop still passes at levels 1–2. All earlier accepted constructions are unchanged.
  - `failureLine` at levels 1–2 returns today's IDs.
  - Exhaustive guidance: from every reachable construction at levels 1–3 (four shapes × three places per friend, with no shared dock), repeatedly applying `guidance` reaches `caught` within four edits, and it never returns `-1`.
  - Per-role hint de-duplication holds at level 3.
  - The level-3 layout boxes do not overlap, stay at least 100 units, and keep levels 1–2 identical.
- Registry and how-to tests: the ranges, `describeLevel(3)`, the level-3 `LevelLine` and the card length.
- One browser play at level 3 in the `buddies` suite: a flat-then-flat run fails with `buddies.joinCup`, Help glows the far half, Cup succeeds, then plant, finishing with misses 0, hints 1 and one sticker. Also one portrait screenshot at level 3.
- `fingerdemo` with `FINGER_ONLY=shape-buddies` at level 3.
- Build only if shared files beyond the game, voice script and how-to change.

Device speech, iPad touch and a child's reaction stay human checks.

## Open developer decisions (none blocking; the build uses the defaults)

1. **Pre-K window:** the default is pre-K and school both 1–3. The alternative is school only at level 3.
2. **Is the join enough to count as "combined"?** The trace is level 1's rule. The new things are the joined drawing, the carry together and the flip from level 2. A stronger variant is defined only as level 4 below.
3. **A level 4 "Down and catch":** combining level 2's step down with level 3's join (slope near half, cup far half at the low bank) stays a proposal, not part of this slice.

**Excluded:** a third friend or tool, more than two halves, free placement or cutting, general physics, kept creations, save fields, controller or couch modes, and cooperative seats.
