# Make it float: a Sink or Float level (definition)

Defined 2026-10-16 for [chunk 2](../ROADMAP.md#short-ladders-in-order) (the short-ladders row *Sink or Float's make-it-float experiment*), from the [longer-ladder audit](../IDEAS.md#round-two-the-longer-ladders-2026-10-10) and the [research shortlist](../FAMILY-EXPERIENCE.md#research-sessions-worth-doing). **Docs only: nothing here is built.** *Make it float* is level 7 of Sink or Float (`src/games/sink-float/`), not a new game. The tank, the water and the splash stay the same. What is new is the first thing she changes herself.

**Fun action and purpose:** a lump of clay plops in and sinks. "Can you make it float?" She picks a new shape for the same clay: a flat pancake, a hollow boat or a boat with a hole. Then she watches it go in. The pancake sinks, the leaky boat fills and sinks, and the boat bobs on top. The learning goal is the first fair test. Change one thing (the shape), keep everything else (the same clay, the same weight) and see what the change does. Levels 1 to 6 ask which things float. This level asks what you can change to make something float. Some anchors:
- NGSS K-2-ETS1-2, a sketch or model that shows how an object's shape helps it work.
- NGSS 2-PS1-2, testing which materials suit a purpose.
- The classic clay-boat classroom activity.

**The stated model (true, and simplified on purpose):** a thing in water pushes some water out of the way. The water pushes back up. When the water pushed aside would weigh more than the thing, the thing floats.
- A clay ball only pushes aside a little water, about its own size, and clay is heavier than that much water, so it sinks.
- Pressed into a hollow boat, the same clay holds air inside. It pushes aside much more water while weighing exactly the same, so the water holds it up.
- A flat pancake is still solid clay with no air in it, so it sinks.
- A boat with a hole lets the water in instead of keeping it out, so it sinks.

The rule also explains the game's existing surprises. The apple floats because it holds air inside, and the coin sinks because it is small and solid. Spoken lines say "pushes away lots of water" and "the water holds it up". The word *density* and Archimedes' name stay out of her lines.

The how-to card's grown-up note says what the model leaves out:
- Real clay boats need thin walls, and a deep, tippy one can roll over.
- A real boat can still sink if it carries too much or if waves come over the side. That is [Build a Boat](#ownership-and-what-is-left-out)'s question, not this level's.

**Band and ID:** school only, as **level 7**: `school: { min: 5, max: 7 }`. The plan table is appended, never renumbered, and `sinkPlan` already clamps, so levels 1–6, pins and saved levels are unchanged. Pre-K stays `{ min: 4, max: 6 }`. Opening level 7 to pre-K would be a later one-line band change, after school has been played, and would go on [DEVICE-CHECKS](../DEVICE-CHECKS.md). No `order` is needed, because the ladder stays `min..max`.

**One variable.** Only the shape changes between trials. The clay's color and size, the tank and the water stay the same. Taking weights off a loaded boat ("the first fair-test variable" in the [IDEAS row](../IDEAS.md#round-two-the-longer-ladders-2026-10-10)) is a different variable. It is left for a later slice.

## First round

Two experiments. The second uses a different clay color (seeded from two `palette.ts` swatches), the same model and freshly seeded tile positions.

1. **The lump.** A clay ball sits on the tray. "This clay sinks. Watch!" It arcs in through the existing `splash` path, sinks and comes back to the tray. This first drop is shown to her, not chosen. It reminds her what the clay does before she changes it.
2. **Change the shape.** "Can you make it float? Change its shape!" Three shape tiles appear in a row above the tray:
   - **flat** (a pancake),
   - **boat** (a hollow bowl with a rim),
   - **leaky boat** (the same bowl with a visible hole and a crack line).

   Their left-to-right order is seeded. Tapping a tile squashes the clay into that shape with a squish sound and a short morph tween, then the clay goes into the water. There is no separate Go button, because one tap is one trial.
3. **Watch and hear why.**
   - *Flat* sinks slowly, level: "Flat clay is still solid clay, so it sinks."
   - *Leaky boat* floats for a moment. Then water rises inside it, a bubble trail comes out of the hole, and it sinks: "The water came in through the hole, so it sank."
   - *Boat* settles at the surface and bobs, using the existing `update()` bob: "A hollow boat pushes away lots of water. The water holds it up!"

   A sunken shape lifts out and comes back to the tray as the ball, so the next tile starts from the same lump.
4. **Same clay.** When the boat floats, the sunken ball outline sits beside it on a small two-pan scale icon, level. "Same clay, same weight. Only the shape changed!" Then the next experiment starts, or the round finishes.

The round finishes through `ctx.finish` after two floating boats: one sticker, help or no help.

**Targets and layout:** each tile is the existing guess-button size, a 150×130 tile with a 170×150 hit area. Three tiles with gaps fit in 600 units, laid out with `spread(3, 150, view.w - 40, gap)` so the bottom-left pet stays clear in portrait and landscape. The float and sink guess buttons stay hidden. The tray, tank and slot positions are reused.

## Mistakes, hints and accounting

- **A sinking trial is an experiment, never a miss.** Choosing *flat* or *leaky* is how she finds out, the same rule as the unscored predictions on levels 3 and 6 and Chain Reaction's runs. There is no boing. The explanation line plays instead. The round always reports `misses: 0`.
- **Help after two sinking trials.** After two sinking trials in one experiment, the boat tile glows (the existing yellow `glow` stroke) and the voice says "Try a hollow shape that keeps the water out." This counts as **one hint** for adaptation, at most one per experiment. It follows Bouncy Launch's rule that two misses count one preview hint.
- **Asking for help.** `askForHint()` (the pause sheet's Show a hint) shows the same glow and line. If the glow for that experiment has not been counted yet, this counts it. Otherwise it is free.
- **Adaptation.** A round where she finds the boat in both experiments without the glow is smooth. A round with two glows counts as struggling. Level 7 is the top of school, so smooth rounds step nothing up. Two struggling rounds step her down to 6, the existing clamp.

## Controller and couch

`sinkFloat` sets `liveController`, so level 7 needs a controller path in island play. `control()` at level 7 moves a ring over the three tiles: left and right move it and the action button tries the ringed shape. This reuses the existing `ring` and `pick` fields, widened from two choices to three. `autoplay()` steers to the boat and presses.

Couch trips and courses name their levels and never use 7, so the couch catalog, `COUCH_IDS`, the unlock tiers and the courses do not change.

## Couplings the build must handle

- **Keep clay out of `THINGS`.** A new `Thing` would change `ALL_THINGS`, which would change the seeded pools `thingsFor` draws for levels 1–6. It would also force a `SINK_LINES` journal line (`Record<Thing, LineId>` in `src/content/journal.ts`). Put the shapes in their own table in `logic.ts` instead:
  - `CLAY_SHAPES = { flat: { floats: false, line }, boat: { floats: true, line }, leaky: { floats: false, line } }`
  - `type ClayShape`
  - `shapesFor(rng)`, which seeds the tile order and the clay color for the two experiments
- **Plans and modes.** Add `'shape'` to `SinkMode` and append `{ mode: 'shape', count: 2, surprises: false, name: 'Make the clay float: change its shape and test it' }`. Here `count` is the number of experiments.
- **The constructor.** Today it calls `thingsFor` and builds float and sink buttons for every plan. Shape mode must skip `thingsFor`. The existing `thingsFor` tests loop over every plan and expect a mix of floaters and sinkers, so they must loop over the thing modes only.
- **Discoveries.** Shape mode files none, because clay is not a `Thing`. A journal entry ("the same clay floats as a boat") is a later candidate that needs its own journal line and test.

## What the build adds

- Voice lines in `src/content/voice-script.ts`:
  - `sink.clay-sinks`
  - `sink.clay-ask` (instructed, so the pet repeats it)
  - `sink.clay-flat`
  - `sink.clay-leaky`
  - `sink.clay-boat`
  - `sink.clay-same`
  - `sink.clay-hint`
- `describeLevel(7)` comes from the plan name.
- Sink or Float's how-to card in `src/content/howto.ts` gets `LevelLine` steps scoped `{ from: 7, to: 7 }`: "Tap a shape for the clay; it goes in the water." and "Find the shape that floats." It also gets the grown-up model note above, scoped the same way.
- The ghost finger's `autotouch()` at level 7 taps the boat tile once the tiles are ready. `fingerdemo` plays the first and last level, so this bot is required.
- Clay art drawn in `art.ts` with `Graphics` and `palette.ts` swatches:
  - the ball, flat, boat and leaky shapes
  - a water-fill tween for the leaky boat, with a bubble trail from `ctx.particles`
  - the two-pan scale icon
- Sounds come from the existing `sfx` set: a squish (a short low pentatonic tone) and the existing splash. Music stays `STYLES.bubbles`.
- The README row, the GAMES.md entry and a VERIFICATION entry.

## Rule tests (`logic.test.ts`)

- Exactly one of the three shapes floats, and it is the boat. Flat and leaky sink.
- Every shape's explanation line exists in the voice script.
- `shapesFor` gives two experiments with all three tiles in each. Over many seeds every position holds the boat sometimes, and the two clay colors differ.
- Levels 1–6: `sinkPlan(l)` is unchanged and `thingsFor` draws the same things for a fixed seed as before. A pinned snapshot over a few seeds proves the clay stayed out of the pools.
- `sinkPlan(7).mode === 'shape'` and `sinkPlan(99)` clamps to 7.
- The registry tests still pass with school `{ min: 5, max: 7 }`.

## Check tier for the build

New interaction tier:
- typecheck, then the unit tests (Sink or Float's rule tests, the registry tests and the how-to tests);
- **one** scripted play at level 7 through a filter: one flat trial, one leaky trial (which lights the glow and counts one hint), the boat, the second experiment through a controller key press, and the finish;
- one portrait screenshot;
- `fingerdemo` with `FINGER_ONLY=sink-float`, which covers level 7 as the last level.

Run `npm run build` only if shared files change. Run `couchgames` only if `control()` changes for the couch's levels; the ring widening must leave the couch's two-choice levels as they are.

## Ownership and what is left out

- **Build a Boat** ([PHYSICS-GAMES](../PHYSICS-GAMES.md), the cargo mode of Sink or Float) stays a separate later level. It is about how much a hull carries: wide against deep, loading cargo until it sinks, comparing two boats. This level owns only "the same material floats when you change its shape". Build a Boat's model can extend this one: the boat sinks when the cargo and the clay together weigh more than the water the hull can push aside.
- Also left out:
  - taking weights off a loaded boat (the next fair-test variable)
  - other materials (a foil ball's float depends on how tightly it is squashed, so it would not give a truthful fixed result)
  - a guess before each trial (her chosen shape is already her hypothesis)
  - free-form sculpting
  - salt water
  - a kept creation
