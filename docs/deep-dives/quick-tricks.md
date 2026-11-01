# Quick Tricks deep dive

*ID `quick-tricks` · bands toddler, preschool, pre-K, school · levels 1–6 on 2026-11-01 · session `claude/dive-quick-tricks` ([PR #1092](https://github.com/rjdunlap/neo/pull/1092))*

## The game today

A little show after WarioWare: Touched!, made calm. Each round is one show of three tiny tricks, each a single gesture that changes something she can see, with a silly payoff; a green arrow appears after each payoff and she moves on when ready. The whole show is one round and one sticker. It lives in Puzzle Peaks (`src/content/lands.ts`), plays the `stickers` music style, and has a ghost-finger bot for both shows (`leafDrop`, `partnerSock`, `plankToPlace` in `logic.ts`; `encoreMove` in `second-logic.ts`).

The learning purpose is spatial and comparison words in action: *above* and *cover*, *same* (colour, then colour and pattern), *long enough*, then turning a shape to fit, one-to-one correspondence and making a quantity from a visible start.

Ranges (`LEVELS` in `index.ts`): toddler 1–1, preschool 1–4, pre-K 2–6, school 5–6. No `order`, no `entryLevels`.

| Level | Plan name | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | A little show: keep Bunny dry, find a sock partner, stretch a bridge | toddler, preschool | Hold one leaf above Bunny; pick the partner of two socks by colour; stretch a springy plank to the far bank (a short let-go is free) |
| 2 | Leaf up high, three socks, stretch all the way | preschool, pre-K | The same with three socks; a short stretch now counts |
| 3 | Which leaf covers two, same colour and pattern, a plank long enough | preschool, pre-K | Choose the 400-wide leaf for Bunny and Duck; four socks with a colour-only and a pattern-only decoy; one of three fixed planks (0.55, 0.8 and 1.23 of the gap) |
| 4 | A second show: turn a parcel, set three places, make four berries | preschool, pre-K | Turn a rectangle (one turn needed) to its mailbox shadow; a bowl to each of three friends; add berries to a visible start and submit four |
| 5 | Triangle parcel, four places, five berries | pre-K, school | One to three turns of a triangle; four bowls; five berries |
| 6 | Corner parcel, a partly set picnic, six berries | pre-K, school | An L-shaped parcel; four places with one already set; six berries |

**Content pools.** Socks draw from six colours and two patterns, shuffled (`makeSocks`); plank order is shuffled; the parcel's needed turn is 1–3 (`encoreRound`), and the berries already there are 1 to total − 2. Everything else is fixed: always Bunny (and Duck at level 3) under the same cloud, always the beetle crossing, always the same sock monster, always the same pink faces at the picnic. A replay of a level is the same show with different colours.

**Mistakes and hints.** Each trick counts its own wrongs; the second brings one hint (a yellow glow on the answer) and at most one hint per trick; misses are summed across the show and reported once through `ctx.finish`. Free actions: dropping a leaf or sock far from anyone, turning the parcel, dropping a bowl on a filled seat, a short stretch at level 1.

**Known gaps found while reading** (not fixed here; slice 1 takes them):

- **Toddler accounting is uneven.** At level 1 a short bridge let-go is free (`countShort: false`), but a leaf dropped *below* Bunny is a counted miss, the only toddler window there is.
- **The second show's yellow arrow at Picnic Places.** The last bowl wins by itself, yet the yellow submit arrow is visible during step 1 and a tap on it before every place is set is counted as a miss (`tricks.places-hint`). An experiment with a visible button is charged as a wrong answer.
- **The second show has no finale and no nudge.** Show one ends with the cast taking a bow and `tricks.done`; show two ends the moment the green arrow is tapped after the berries. Show one repeats `tricks.next` after ten quiet seconds on a waiting arrow; show two does not.
- **Two arrows of different meaning.** Show two puts a yellow "check" arrow top-right and a green "next" arrow bottom-right, both `arrowIcon(1)`; only colour separates them.
- **Little comic payoff in show two.** The parcel wiggles, bowls ding, the berry step just sparkles. Show one's payoffs (the flower opening its own umbrella, socks worn as ears, the bridge taking a bow) are what the IDEAS notes call the point of the format.
- **Show two's friends are generic faces**, not island critters.

**Person checks.** None recorded for this game in [DEVICE-CHECKS](../DEVICE-CHECKS.md) beyond the catalog-wide clarity rounds; no observation in [OBSERVATIONS](../OBSERVATIONS.md).

**Couch.** No couch entry. Roadmap chunk 9 (*Couch games that score on seeded boards*) still names Quick Tricks as its candidate; see [Decisions](#decisions-for-the-developer).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [WarioWare: Touched!](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_WarioWareTouched_EN.pdf) (DS) | Touch microgames | Characters each own a gesture family (rub, slide, tap); each set ends in a boss stage; three difficulty tiers raise the stakes | One gesture family per show, the scene explaining the verb, a finale per set | The fuse, the speed-up, lives, the "game over" |
| [WarioWare: Get It Together!](https://www.nintendo.com/us/store/products/warioware-get-it-together-switch/) | Microgames with characters who move differently; co-op | The same microgame played by different characters; two-player mode | Two roles in one trick for co-play (already in [IDEAS](../IDEAS.md)); the same scene with a different helper | Competitive scoring, timers |
| [Rhythm Heaven remixes](https://en.wikipedia.org/wiki/Rhythm_Heaven_(series)) | Rhythm minigames | Each set of four ends in a remix that replays the set's games inside one theme ([Kotaku on remix stages](https://kotaku.com/rhythm-heaven-s-remix-stages-are-genius-1712462339)) | A finale that *combines* what the show taught, dressed in one theme, as a celebration | Judged timing, a rank screen |
| [Busy Shapes](https://apps.apple.com/app/id722784048) (Edoki) | Piaget-inspired shape-to-hole puzzles | More shapes, sizes and colours; transformers and obstacles change the object before it fits | Change the object, then fit it; difficulty by more properties, not speed | Physics obstacles that make the fit a motor test |
| [Pok Pok Playroom](https://playpokpok.com/faqs/) | Open-ended digital toys, 2–6 | No levels; new toys are added | The toddler "toy shelf": a trick that cannot go wrong and repeats as long as she likes | Nothing to remove; it is the model for the youngest opening |
| Montessori practical life (sock pairing, table setting) | Physical play | Pairs by one property, then two; one bowl per place, then a partly set table | Already the source of Sock Gobbler and Picnic Places; one more property per step | — |
| Circle-time "magic shows" and pass-the-trick games | Physical, with a grown-up audience | The child performs, the audience reacts | The co-play hint already casts the grown-up as the audience; give the audience something to do in two-role tricks | A grown-up correcting mid-trick |

**Learning references.** Above/below and positional words: Common Core [K.G.A.1](https://www.thecorestandards.org/Math/Content/K/G/). Comparing lengths ("long enough"): [K.MD.A.2](https://www.thecorestandards.org/Math/Content/K/MD/) and ordering lengths at [1.MD.A.1](https://www.thecorestandards.org/Math/Content/1/MD/). One-to-one correspondence and counting to say how many: [K.CC.B.4–5](https://www.thecorestandards.org/Math/Content/K/CC/). Making a number from a part already there: [K.OA.A.4](https://www.thecorestandards.org/Math/Content/K/OA/). Turning a shape to fit is early mental rotation; on a touch screen with simplified demands, children from about three and a half show it, with wide individual differences ([Frick, Ferrara & Newcombe 2013; Frick, Hansen & Newcombe 2013](https://sonar.ch/documents/305957/files/FrickHansenNewcombe_CogDev13pp.pdf)), which supports keeping the turn button visible and free rather than asking for an imagined turn before the parcel moves.

## What makes sense here

Quick Tricks' value is *variety of verb inside a familiar frame*, so it should grow by more shows and by richer scenes, not by harder single tricks (those belong to the games each trick echoes: Size Parade, Shape Sorter, Little Helpers, Duck Pond). Three directions fit the rules:

1. **Make each show feel like a show** (fresh content and the show-two gaps): seeded friends and props so replay changes the scene, a bow at the end of show two, one comic payoff per show-two trick, and truthful accounting.
2. **A remix at the top** for pre-K and school: the first show's tricks done *twice at once* (two friends under two leaves, two lost socks, two gaps), which is Rhythm Heaven's remix idea without the timing. It asks her to hold two targets and match each, which is a real next decision rather than more of the same.
3. **A tiny show for the toddler band** below level 1: two tricks where any drop near the friend succeeds and nothing counts, so a toddler's first round cannot accumulate misses. The lap "toy shelf" (tap only, a one-year-old will not drag) is a band decision and stays gated.

The third show of new gestures (crank, pour, loop) from [IDEAS](../IDEAS.md#a-third-show-new-gestures) stays a definition: the crank is a new input with its own pointer handling, and the pour and loop should reuse Fill and Dump's and Lasso Loops' built handling rather than copying it.

Long-term arc: toddler tiny show → show one (1–3) → show two (4–6) → the remix (7) → a third show of new gestures (defined later), with a remix of all three shows as an eventual school finale.

## Experience and presentation

- **First unsupported action.** The leaf: it is the only movable thing on screen, the rain is visibly falling on Bunny, and holding it up stops the drops at once (the drops roll off the leaf in `updateRain`). She can succeed before understanding the word *above*.
- **Touch and consequence.** Pick-up ticks and the item rides 40 units above the finger (`drag.ts`); the payoff follows within a beat (the flower's own umbrella pops 0.8 s after the leaf lands). Show two's payoffs need the same beat: the parcel slides into the mailbox and the mailbox flag pops up; each bowl gets a friend's happy wiggle; the last berry makes the friends cheer and the bowl of berries gets eaten in one gulp.
- **Variety on replay without changing the rule.** Seed the friend under the leaf (bunny, duck, cat, pig) and its pair at level 3; the crosser (beetle, snail, ladybug); the monster's colour; show two's picnic friends from `CRITTERS`. Slot-free voice lines name the friend, so a seeded friend needs a line per critter or a friend-free wording ("Keep our friend dry!"); prefer per-critter lines, rendered as clips later.
- **Reasoning versus motor.** Drop zones are generous (a leaf is judged by the friend's column, not exact placement; the plank's let-go point has 30 units of margin). Keep it that way at level 7: two targets, never smaller ones. Nothing requires reading; the berry target is a spoken number plus a drawn row of empty berry outlines.
- **Supported ending.** One sticker per show, the glow after two misses, the green arrow always waits. Show two gets the same bow and "What a show!" ending as show one.
- **Co-play.** The grown-up is the audience (`coplayHint`). At level 7, a natural two-role version is the grown-up holding one leaf while she places the other; keep it a hint, not a requirement.
- **Art/feel example.** The mailbox for Parcel Turn: a `roundRect` box on a post with a code-drawn flag (`Graphics` rect and triangle) that rotates up with `ease.outBack` when the parcel lands, and `sfx.bell` on the pentatonic step from `notes.ts`; no new rendering system.
- **Needs a person.** Whether a toddler understands "hold it up high" without the glow; whether show two's two arrows confuse a four-year-old; whether the remix's two targets read as one trick or two; whether the yellow-arrow change (slice 1) is noticed at all.

## Proposed ladder

### Fresh content inside existing levels

Seeded cast for both shows (slice 1): the friend under the leaf and its pair at level 3 from `bunny`, `duck`, `cat`, `pig`; the bridge crosser from three small critters; the sock monster's body colour from the palette; show two's picnic friends as `Critter`s from `CRITTERS`. The rules and level numbers do not change. A rule test asserts that every seed yields a valid cast (two distinct friends at level 3) and that the judged geometry (`leavesFor`, `friendsFor`) is independent of the cast.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | *Two at once* (the remix) | pre-K 7 (range rises to 7), school 7 (range 5–7) | Show one's three tricks, each doubled: three friends under the cloud and two leaves (200 and 300 wide) that must both go up, one over the pair and one over the single friend; the monster holds two different socks and needs both partners from five; a narrow and a wide gap on one river with a long plank (reaches either), a middle plank (reaches only the narrow gap) and a short decoy | Which leaf covers which friends; which sock partners which; which plank fits which gap | A leaf over only some friends stays up (partial progress is kept, not a miss) and the pet says who is still wet; a leaf below or a wrong sock or a too-short plank is a miss as at level 3; any plank that reaches its gap is accepted; if the long plank goes on the narrow gap first, the middle plank then bumps short of the wide gap (a miss) and the pet says the long plank could move, and a placed plank can be dragged back off for free (revision, not a dead end); the glow after two misses lights the next unfilled target and its piece | Every seed has exactly one way to cover all three friends with the two leaves (or every assignment that covers them is accepted); exactly two sock partners among five; exactly one assignment of planks to gaps reaches both, a placed plank can always be lifted back, and no placement order leaves the show unfinishable; the bot's moves finish the show | Two new voice instructions and one "still wet" variant; the bot gains a two-step plan per trick; uses existing drags, art and the finale; how-to step `{ from: 7, to: 7 }` |

### Younger-band openings

**A lap toy shelf** (not ready; a band decision): tap-only versions of the three show-one scenes (tap the leaf and it floats over Bunny; tap a sock and the monster tries it on; tap the plank and it stretches), repeating while she taps, no instruction to complete. It would add `lap` to the game's bands, which is the developer's call; see [Decisions](#decisions-for-the-developer).

### Easier entries and levels between existing ones

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *A tiny show* | toddler (placed before 1 by `order`, `entryLevels: [8]`), preschool start | Two tricks only: the leaf (any drop over Bunny's column succeeds, above or in front) and the bridge stretch (any let-go past halfway snaps across) | Where to put the leaf; how far to pull | Nothing counts: no misses, no hints; the pet re-says the instruction after a quiet ten seconds | `misses` stays 0 for every drop; the bot finishes; `order` puts 8 first for toddler and the toddler range is 8 then 1 | A two-trick plan entry in `PLANS` with a `tricks` list (the show currently runs all of `TRICKS`); toddler `order`; how-to step for 8; `fingerdemo` at 8 |

The numbering (7 the remix, 8 the tiny show) is fixed here so both slices can be built in either order without renumbering.

### Left out on purpose

- Any fuse, countdown, speed-up or "faster" mode, however short: the WarioWare core is the one thing the island removes.
- Scoring a show by time or misses for grown-ups (see the couch decision).
- More socks, more planks or smaller leaves on the existing levels: that is clutter, not depth; the remix adds a second target instead.
- Device tilt, shake and microphone tricks ([IDEAS](../IDEAS.md#gestures-the-island-does-not-use-yet)).
- A general microgame framework: one show at a time, as the IDEAS notes say.

## Decisions for the developer

1. **Lap toy shelf.** Should Quick Tricks open to `lap` with tap-only, no-completion versions of show one's scenes? Adding a band to a game is a developer call.
2. **Couch chunk 9.** Roadmap chunk 9 names Quick Tricks as the next couch game that scores on seeded boards. Show one's tricks are trivial for adults and the only way to score them is speed, which the game removes. Recommend retiring Quick Tricks as chunk 9's candidate (or replacing it with a grown-up remix defined separately).

Both are added to [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

## Build slices, in order

1. **Truthful accounting, a seeded cast and a bow for the second show** (existing-game fix tier: typecheck, the game's rule tests, one filtered regression play of level 1 with a leaf dropped below Bunny (no miss) and of level 4 to its sticker, `fingerdemo` at 4 only if the bot's play changes; one build if voice lines are added). Contents: level-1 leaf-below drop is free (reuse `countShort` or a `countBelow` plan field); show two hides the yellow arrow during Picnic Places (the last bowl already wins) so no submit miss is possible there; show two's waiting arrow repeats `tricks.next` after ten quiet seconds; show two ends with a cast bow and `tricks.done`; show two's friends are `Critter`s; the mailbox flag, friend wiggle and berry gulp payoffs; seeded friend, crosser and monster colour in show one with per-critter instruction lines.
2. **Level 7, *Two at once*** (new-rule tier: typecheck, rule tests, one play of level 7 with one leaf over only two friends (kept, no miss), one wrong sock and the glow, then to the sticker, one portrait screenshot of the three friends, `fingerdemo` at 7). After slice 1 (shares `index.ts` and the cast).
3. **Level 8, *A tiny show*, the toddler entry** (new-level tier with `order`: typecheck, unit tests including the registry, lands and order/entry tests, one play of level 8 at toddler with a leaf in front of Bunny (succeeds) and a short pull past halfway, `fingerdemo` at 8). After slice 1.
4. **Define the third show** (docs only; status `define`): Wind the Music Box, Fill the Cups and Loop the Fireflies as level 9, the crank's pointer handling, which built pour and loop handling it reuses, named amounts per band, accounting (overfill spills and is never a miss), voice lines and check tier. From [IDEAS](../IDEAS.md#a-third-show-new-gestures).

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links and `git diff --check` ran.
