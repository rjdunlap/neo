# Build a Boat (How much can it carry?): a Sink or Float level (definition)

Defined 2026-11-25 as the reserved row 11 of the [Sink or Float deep dive](../deep-dives/sink-float.md#new-levels-on-top), after [Garden Raft](garden-raft.md) (level 8, built), whose load model it reuses. Status: built 2026-11-26 ([PR #2209](https://github.com/rjdunlap/neo/pull/2209)); the boat cell is drawn at most 96 units wide and shrinks only as far as the three-boat row needs beside the pet (88 at 1024 wide). *How much can it carry?* is **level 11** of Sink or Float (`src/games/sink-float/`), not a new game. The tank, the water, the splash and the marble stay the same. What is new is a **measured** question: does a wider boat carry more, and how many marbles does a boat hold before water comes over the side?

**Fun action and purpose:** two foil boats cut from one sheet sit in the tank, one wide and one narrow. She guesses which carries more, then loads each one marble at a time and watches it sit lower and lower until water spills in. Then she picks, from three boats, one that can carry a pile of marbles. The learning goal is that a boat's size decides its load (capacity grows with width), and that a prediction is something to test by counting. Anchors:
- NGSS K-2-ETS1-3, comparing two tests of an object to see which works better.
- NGSS 2-PS1-2, testing different materials (here, shapes of one material) for how well they suit a purpose.
- It is the Sink or Float row's second "design" level, kept small: she chooses a boat, she does not cut one.

## The stated model (true, and simplified on purpose)

One rule, one spoken line and one picture, the same rule the raft uses, with a hull in place of floats.
- **A wider boat pushes aside more water, so it holds more.** Every boat is one row of cells, each cell the width of one float. Each cell holds up two marbles (`RAFT_HOLD`), so a boat's capacity is `cells × 2`. A boat carries a load when the marbles do not outnumber its capacity, and water comes over the side on the marble after that.
- The boat sits lower by one equal step per marble, so she can *see* the waterline climb to the rim. The waterline height is `marbles / capacity` of the way up the wall; a full boat is exactly at the rim and the next marble spills.
- All boats have the same wall height (a foil tray one marble tall) and are cut from the same foil. Only the width differs. There is no tipping here: the marbles pile in the middle and the boat stays level (balance is Garden Raft's lesson).

Spoken lines say "a wider boat pushes aside more water" and "each part of the boat holds up two marbles". The words *displacement*, *volume* and *buoyancy* stay out of her lines. The how-to card's grown-up note says what the model leaves out:
- Real boats also gain capacity from tall walls and a deep hull, not only width. Here every boat has the same wall height, so width is the only difference.
- Marbles are all the same weight, and the boat never tips or the marbles roll.
- It is a good first measurement lesson (guess, count, compare). It is not a boat-design course.

## Band, ID and order

School only, as **level 11**: `school: { min: 5, max: 11, order: [5, 6, 9, 7, 8, 11, 10] }`. Level 11 goes after Garden Raft (8), whose load rule it reuses, and before Salty or fresh (10), which keeps its place as the top of the ladder. Pre-K and the other bands are unchanged. `SINK_PLANS` gains a keyed entry `11: { mode: 'boat', count: 3, surprises: false, name: 'How much can it carry? Load the boats and pick one for the pile' }` (`count` rounds), and `SinkMode` gains `'boat'`. Once 11 is a plan key, the clamp comment (`only 11 is reserved`) and `sinkPlan`'s unbuilt-ID doc are updated and `sinkPlan(11)` returns the plan; the existing test that expects `sinkPlan(11)` to clamp to 10 changes. The build checks how `levels()` and `rangeFor` read school's `max` (it is 10 today with an explicit `order`), so a saved pin of 10 stays valid and Salty or fresh remains the step-up target of 8 and 11. A saved school level or pin of 11 was previously clamped to 10; it now plays this level, which is the intent of the reserved ID. Levels 1–10, 12, saves and pins are unchanged.

## The model in `logic.ts` (testable, exact integers)

- **Share the raft's low rule, do not copy it.** The build extracts `holdsLoad(holders: number, load: number): boolean` (`holders × RAFT_HOLD >= load`) from `raftVerdict`'s first check and has `raftVerdict` call it, so the two levels cannot drift. `raftVerdict`'s behaviour and its existing tests do not change.
- `HULL_CELLS = [1, 2, 3, 4]` is the cell widths a boat can have. `hullCapacity(cells) = cells × RAFT_HOLD` and `hullVerdict(cells, marbles)` returns `{ kind: 'ok'; freeboard }` or `{ kind: 'over' }`, with `freeboard = capacity − marbles` (0 is "at the rim"). Loading is monotonic: a boat that carries `n` marbles carries every `m < n`.
- **Rounds** (`BOAT_ROUNDS`, a fixed table; the seed only mirrors left and right so a position is not memorised, and picks the foil colour):

  | Round | Name | Boats (cells) | What she does | Capacities | What it teaches |
  | --- | --- | --- | --- | --- | --- |
  | 1 | Wide and narrow | wide 4, narrow 2 | Guesses which carries more (unscored), then loads each marble by marble until water comes over | 8 and 4 | Wide holds more; the waterline climbs one step per marble. |
  | 2 | A pile of four | 1, 2, 3 | Picks a boat for a pile of 4 marbles, then loads it | 2, 4, 6 | A boat that is too narrow sinks when loaded; two boats carry it (2 and 3). |
  | 3 | A pile of seven | 2, 3, 4 | Picks a boat for a pile of 7 marbles, then loads it | 4, 6, 8 | Only the widest carries 7; the middle one spills on the seventh by one. |

  Round 1 has no load to meet; rounds 2 and 3 have, so each has at least one accepted boat (`capacity >= load`): round 2 has two, round 3 has one. The build's tests recompute these so a changed table fails them.
- `boatRoundFor(plan, rng)` returns the three rounds with the boat order mirrored by the seed.

## First round

Three scenes in one tank, in this order.

1. **Wide or narrow.** "Two boats from one sheet. Which one carries more marbles?" (`sink.boat-ask`, instructed). She taps the wide or the narrow boat. This is unscored: either choice just sets what she expects, no boing and no cost.
2. **Load them.** A bowl of marbles sits on the near bank. Each tap on the bowl drops one marble into the chosen boat, which sits one step lower with a small splash; the waterline mark climbs. It continues on the other boat afterwards (the bowl then loads the second boat). When the marble after the last seat arrives, water comes over the rim, the boat dips and bobs up, and the marbles hop back to the bowl. "The wide boat held eight." (`sink.boat-count`, spoken with the count as a number of marble dots, not a numeral to read).
3. **The answer.** The two counts appear as stacks of marbles beside the boats. If her guess matched, "You guessed it: a wider boat carries more." (`sink.boat-right`); if not, "A wider boat pushes aside more water, so it holds more." (`sink.boat-wide`). No miss either way.

Rounds 2 and 3 repeat the loading with a pile shown in a second bowl. She taps one of the three boats to carry the pile, then taps the pile's marbles in one at a time. A boat that carries the pile floats happily; a boat that does not spills at its capacity ("This boat holds four. The pile is seven. Try a wider boat." `sink.boat-over`), the marbles hop back, and she picks again. No limit on picks.

The level finishes through `ctx.finish` after the third pile is carried: one sticker, help or no help.

## Mistakes, hints and accounting

- **A boat that spills is an observation, never a miss** (the Try-is-free rule of Garden Raft). It gets no boing, only the explanation line. The round always reports `misses: 0`, and the round 1 guess is unscored.
- **The glow comes after two spills in a round.** The smallest boat that carries the pile glows (the existing yellow `glow` stroke) and the voice says "Try this one." (`sink.boat-hint`). This counts as **one hint**, at most one per round.
- **Asking for help.** `askForHint()` (the pause sheet's Show a hint) shows the same glow and line, counting it if the round's hint has not been counted. In round 1 it replays the instruction and counts nothing.
- **Adaptation.** There are no misses, so the coach reads hints only, as Garden Raft does. A smooth round has no hints; two smooth rounds step her up (to 10, the next level in `order`); two struggling rounds (two or more hints each) step her down to 8.

## Layout and targets

The logical width is never below 1024. Landscape is about 1024×768 and portrait about 1024×1365.
- **Boats.** Each boat is a tap target whose rectangle is at least `(cells × 96)` wide, never below 200 wide and 150 tall, laid out in one row in landscape and one row in portrait with the extra height going to sky and water, not to scaled targets. Boats keep an explicit rectangular hit area.
- **The bowl.** A 170×150 bowl on the near bank (the guess-button size) in the corner clear of the pet. Each tap drops one marble; there is no hold or drag.
- **Waterline and stacks.** The waterline mark and the count stacks are decoration drawn from `view` in `resize()`, never targets.

## Controller and couch

`sinkFloat` sets `liveController`, so level 11 needs a controller path in island play, as 7, 8 and 10 have. `control()` at level 11 moves a ring over the boats and the bowl (left and right), and the action button picks a boat or drops a marble. This reuses the `ring` field widened for the bowl stop. `autoplay()` picks the smallest accepted boat and taps the bowl to the capacity. Couch trips and courses never use 11, so the couch catalog does not change; the island-key path is reached only through `controllerLevels`, which couch play never sets to 11. The build verifies the ring with a direct `control()` call and records that a real island key press was not run.

## Couplings the build must handle

- **Keep boats out of `THINGS`.** The foil boat and its waterline get their own art in `art.ts`. The marble already exists in `THINGS`, so the build reuses its art and does not add a `Thing`, so `ALL_THINGS` (fourteen), the seeded pools for levels 1–6 and the journal count are unchanged. The `thingsFor` loops add `'boat'` to the modes they skip.
- **Discoveries.** Level 11 files none; a journal line ("a wider boat holds more") is a later candidate that needs its own line and test.
- **The constructor.** Boat mode skips `thingsFor`, `pairsFor` and the guess and sort buttons, as raft mode does.
- **Cleanup.** Every marble and boat is a stage child or tracked, and tween chains use `ctx.tw` or are guarded against a destroyed scene.
- **`order` and clamps.** Inserting 11 before 10 changes level 10's step-down target from 8 to 11. The tests on `SINK_LEVELS`, `sinkPlan` and `rangeFor` change accordingly.

## What the build adds

- Voice lines in `src/content/voice-script.ts`, each carrying the `{name}` slot (built so, because CI requires a rendered clip for every slot-free line): `sink.boat-ask` (instructed), `sink.boat-count`, `sink.boat-right`, `sink.boat-wide`, `sink.boat-over`, `sink.boat-hint` and `sink.boat-next` ("Now a pile of marbles!").
- `describeLevel(11)` comes from the plan name.
- Sink or Float's how-to card gets lines scoped `{ from: 11, to: 11 }`:
  - steps: "Pick the boat you think carries more. Tap the bowl to load it one marble at a time." and "If water comes over, pick a wider boat."
  - finish: "The round ends when three piles have been carried."
  - note: the three limits of the stated model above, and "At home, float a foil tray in a tub and add pennies one at a time; then try a wider tray."
- The ghost finger's `autotouch()` at level 11: picks the smallest accepted boat and taps the bowl through the load.
- Art in `art.ts`, drawn with `Graphics` and `palette.ts`: the foil boat in cell widths, the waterline mark, the bowl and the count stacks.
- Sounds from the existing `sfx` set (splash, bob, thunk, sparkle). Music stays `STYLES.bubbles`.
- The README row, the GAMES.md entry and a verification entry.

## Rule tests (`logic.test.ts`)

- `holdsLoad` is the raft's low rule: `raftVerdict` still returns `low` exactly when `holdsLoad` is false (a table of loads and float counts).
- `hullVerdict` is monotonic in marbles and in cells, and `freeboard` is `capacity − marbles`.
- Round 1's capacities are 8 and 4. Rounds 2 and 3 each have at least one boat with `capacity >= load`; round 2 has two and round 3 has one, and the second-widest boat in round 3 carries six, one short.
- Mirroring a round by any seed keeps the same capacities per boat.
- Every `sink.boat-*` line the level names exists in the voice script.
- `sinkPlan(11).mode === 'boat'` and `sinkPlan(12)` is unchanged. School's `order` is `[5, 6, 9, 7, 8, 11, 10]` and lists only built IDs. The registry, lands and how-to tests pass.
- Levels 1–6: `thingsFor` still draws only from `THINGS`, and `ALL_THINGS` has fourteen entries.

## Check tier for the build

New interaction tier:
- Typecheck, then the unit tests: Sink or Float's rule tests, the registry, lands, how-to and voice tests.
- **One** scripted play at school level 11 through a filter: round 1 with the unscored guess and both loads, round 2 with one wrong boat then a second spill (the glow, one hint), the fix, and round 3 to the sticker.
- One portrait screenshot (1024×1365) with a boat at the rim, and one landscape screenshot (1024×768), because the three-boat layout is new.
- `fingerdemo` with `FINGER_ONLY=sink-float`, run at level 11 explicitly, because `fingerdemo` plays only a game's first and last level and 11 may not be either.
- Call `control()` directly once for the ring.
- `npm run build`, because the voice script and how-to are shared.
- Do not run `couchgames`, because the couch levels' `control()` paths must not change.

## Left out and owned elsewhere

- **Left out of this level:** cutting or folding a boat, wall height as a choice, boats of different materials, marbles of different weights, balance and tipping, numbers to read, and a "most marbles" score.
- **Owned elsewhere:** balance and where to put floats belong to level 8, Garden Raft; a budget for materials belongs to the engineering-design study's later Plaza Cases; salt water holding more belongs to level 10.
