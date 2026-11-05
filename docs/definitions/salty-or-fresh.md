# Salty or fresh: a Sink or Float level (definition)

Defined 2026-11-05 as slice 3 of the [Sink or Float deep dive](../deep-dives/sink-float.md#build-slices-in-order) (its *New levels on top* row 10). *Salty or fresh* is **level 10** of Sink or Float (`src/games/sink-float/`), not a new game. The tank, the splash, the duck and the float/sink motion stay the same. What is new is a second tank and a second variable: the same thing goes into two waters, and only the water differs.

**Fun action and purpose:** she shakes salt into one tank, then drops a duck into both tanks at once. The duck in the salty tank rides higher. Then an egg goes into both: it sinks in plain water and floats in the salty one. After that, one tank gets salt while she isn't looking, and she has to work out which one by testing. The learning goal is evidence over appearance. The two waters look the same, but a test tells them apart, and her answer comes from what the test showed. Levels 1–9 ask what a thing does in water. This level asks whether the water can change the answer. Anchors:
- NGSS 2-PS1-1, describing and classifying materials by their observable properties.
- NGSS 2-PS1-2, testing materials for a purpose.
- The classic floating-egg kitchen experiment.

## The stated model (true, and simplified on purpose)

The model is level 7's: water pushes up on anything in it, and a thing floats when the water it pushes aside would weigh more than the thing does. Salt mixed into water makes the same amount of water heavier, so it pushes up harder.
- A duck already floats in plain water. In salty water it needs to push aside less water to be held up, so it sits higher.
- An egg is a little heavier than the plain water it pushes aside, so it sinks. Salty water is heavier still, heavier than the egg, so the egg floats.

Spoken lines say "salt makes the water heavier, so it pushes up harder" and "salt water holds things up higher". The words *density* and *dissolve* stay out of her lines. Salt "mixes in" and nothing more is said about where it goes, because dissolving belongs to the matter study's Stir and See (the dive's *Left out on purpose*). No amounts, spoonfuls or sliders appear.

The how-to card's grown-up note says what the model leaves out:
- The duck's rise is drawn bigger than it would be, so it shows. In real, very salty water a floating toy rises only a little.
- An egg floats only in a lot of salt: several heaped spoonfuls in a glass, stirred until no grains are left.
- It has to be a fresh egg. An old egg holds a bigger air pocket and can float even in plain water. So if a home test floats in plain water, the egg is old, and the game is not wrong.

## Band, ID and order

School only, as **level 10**: `school: { min: 5, max: 10, order: [5, 6, 9, 7, 10] }`. Level 10 goes last because it builds on the floating model of level 7 and the fair test of level 9. Pre-K stays `{ min: 4, max: 9, order: [4, 5, 9, 6] }`. IDs 8 (Garden Raft) and 11 (Build a Boat) stay reserved. `SINK_PLANS` gains a keyed entry `10: { mode: 'salt', count: 4, surprises: false, name: 'Salty or fresh: compare two tanks, then test to find the salty one' }` and `SinkMode` gains `'salt'`, where `count` is the number of part 2 questions. `sinkPlan(99)` now falls to 10, so the existing clamp test changes from 9 to 10. Levels 1–9, pins and saved levels are unchanged.

## First round

The round has two parts in one scene. Which tank is salty in part 1 is seeded, left or right.

**Part 1, compare (unscored; only one target is live at a time, so there is nothing to get wrong):**
1. **Salt.** Two identical tanks of plain water stand side by side. A salt shaker stands on the counter beside one of them. "This tank gets salt. Tap the shaker!" (`sink.salt-shake`, instructed). On each tap the shaker tips over its tank and white grains fall and fade into the water. After three shakes the shaker stays beside that tank as its label for the rest of part 1.
2. **Duck.** "Tap the duck. One goes in each tank." (`sink.salt-duck-ask`, instructed). One tap on the duck on the tray drops **two identical ducks**, one into each tank, together through the existing `splash` path. Each bobs at its tank's float depth, and the salty one sits visibly higher. "The same duck sits higher in the salty water!" (`sink.salt-duck`). A thin dashed waterline mark on each duck's side makes the difference easy to compare.
3. **Egg.** The ducks lift out. "Now tap the egg." (`sink.salt-egg-ask`, instructed). One tap drops two eggs. The plain-water egg sinks and rests on the bottom, and the salty-water egg floats low with only its top showing. "The egg sinks in plain water. In salty water, it floats!" (`sink.salt-egg`), then "Salt makes the water heavier, so it pushes up harder." (`sink.salt-why`).

**Part 2, find the salt (four questions, scored):**

4. **Hide.** The things lift out and the shaker slides off-screen. "I mixed salt into one tank." Each question's salty side is seeded. The two tanks are drawn **identically**: same water color, no grains, no shaker. Nothing on screen shows which tank is salty.
5. **Test first.** "Tap the egg to test them." (`sink.salt-test-egg`, instructed), or "Tap the duck to test them." (`sink.salt-test-duck`) for the duck question. One tap drops one into each tank, as in part 1. **The tanks are not tap targets until both things have settled.** A tap on a tank before then is ignored, with no sound, so her answer is always an inference from what she saw, never a blind guess.
6. **Answer.** "Which tank has the salt?" (`sink.salt-which`, instructed). She taps a tank.
   - A right tank sparkles. The shaker pops up beside it ("Yes! The salt holds it up.", `sink.salt-right`), the things lift out and the next question starts.
   - Questions 1–3 test with the egg, which floats or sinks. Question 4 tests with the duck: both ducks float, and she compares their heights. That is the harder look, with the same margin as part 1.

The round finishes through `ctx.finish` after the fourth right answer: one sticker, help or no help.

## Mistakes, hints and accounting

- **Part 1 has no misses and no hints.** Only the current target responds.
- **Part 2: a wrong tank is a miss.** It gets the existing gentle boing and the question's evidence line:
  - egg: "Salt water holds things up. The egg sinks in this one." (`sink.salt-wrong-egg`)
  - duck: "Salt water holds things up higher. This duck sits lower." (`sink.salt-wrong-duck`)

  The things stay in the water so she can look again. This counts as a miss because the evidence was already on screen: she is reading a test she has just watched, not predicting. Guesses on levels 3, 6 and 9 stay unscored because they come before the test.
- **The glow comes after two misses on one question.** The salty tank's rim gets the existing yellow `glow` stroke, and the voice says "Look for the egg that floats." (`sink.salt-hint-egg`) or "Look for the duck that sits higher." (`sink.salt-hint-duck`). This counts as **one hint**, at most one per question.
- **Asking for help.** `askForHint()` (the pause sheet's Show a hint) shows the same glow and line during part 2 once the things have settled, and counts the hint if that question's glow has not been counted yet. During part 1 or before the test it replays the current instruction and counts nothing.
- **Adaptation.** A binary choice guessed at random over four questions misses about twice, which is above the one-miss smooth limit. So two smooth rounds (at most one miss, no hints) show she is reading the evidence. A struggling round is four or more misses or two hints. Level 10 is the top of school, so smooth rounds step nothing up. Two struggling rounds step her back to 7, the level before 10 in school's `order`, through the existing clamp.

## Layout and targets

The logical width is never below 1024. Landscape is about 1024×768 and portrait about 1024×1365.
- **Tanks.** Two tanks share the span from `l = 190`, which keeps the bottom-left pet clear, to `v.w - 40`, with a 30-unit gap: each is `(v.w - 260) / 2` wide, about 380 at 1024. The top stays at 150, and the bottom is the counter (`v.h * 0.74`, as now). In portrait the extra height makes deeper tanks, and the surface stays 80 units under each tank's top, as now. Each tank is a tap target with an explicit rectangular hit area in local units, about 380×420 in landscape. That keeps them far above the 100-unit minimum, and the gap keeps the targets apart.
- **Tray.** The duck or egg to tap waits on a small tray centred between the tanks at `v.h - 85`, about 590 across. That is clear of the pet and the corner buttons. It is the existing guess-button-sized node with a 170×150 hit area. The float and sink guess buttons stay hidden on this level.
- **Shaker.** In part 1 the shaker stands on the counter at its tank's outer side, about 130×150 with the same 170×150 hit area. It slides off-screen for part 2.
- `resize()` lays out the two tanks, the waterline marks and the settled things from `view` in both orientations. A thing settled in a tank keeps its depth relative to that tank's surface.

## Controller and couch

`sinkFloat` sets `liveController`, so level 10 needs a controller path in island play, as level 7 has. `control()` at level 10 is:
- **Before the test:** the action button presses the live target (the shaker, then the duck or egg on the tray).
- **Answering:** left and right move the existing `ring` between the two tanks, and the action button picks the ringed tank. The ring logic gets a third layout, two tanks, beside the guess buttons and level 7's tiles.

`autoplay()` and the ghost finger's `autotouch()` press the live target, then pick the salty tank once both things have settled.

Couch trips and courses name their levels and never use 10, so the couch catalog, `COUCH_IDS`, the unlock tiers and the courses do not change. Like level 7, the island-key path is reached only through `controllerLevels`, which couch play never sets to 10. The build verifies the ring by calling `control()` directly and records that a real island key press was not run.

## Couplings the build must handle

- **Keep the egg and the shaker out of `THINGS`.** A new `Thing` would change `ALL_THINGS`, and with it the seeded pools for levels 1–6, `SINK_LINES` in `src/content/journal.ts` and the journal count of thirty-six. The level-7 clay and the level-9 small members set this precedent. The duck reuses `thingArt('duck')`. The egg and shaker get their own art functions in `art.ts`.
- **Discoveries.** Level 10 files none. The duck already has its page, and the egg is not a `Thing`. A journal entry ("an egg floats in salty water") is a later candidate that needs its own journal line and test.
- **The model in `logic.ts`, so the rules are testable:**
  - `type Water = 'fresh' | 'salty'` and `type SaltTest = 'duck' | 'egg'`.
  - `SALT_DEPTHS: Record<SaltTest, Record<Water, number | null>>` holds how far each thing sits under the surface in logical units, or `null` for sinks: duck `{ fresh: 26, salty: 6 }`, egg `{ fresh: null, salty: 40 }`.
  - `floatsIn(test, water)` returns whether it is not `null`.
  - `saltRoundFor(plan, rng)` returns `{ shown: 'left' | 'right', questions: { salty: 'left' | 'right', test: SaltTest }[] }`. Questions 1 to `count - 1` use the egg and the last uses the duck. Each round has both sides salty at least once, and never three of the same side in a row.
- **The constructor.** Salt mode skips `thingsFor` and `pairsFor`. It builds the two tanks' second set of `Graphics` (one `tankBack`/`tankFront` pair per tank, or a second pair), the shaker, the tray item and the tank hit areas. The existing `thingsFor` tests that loop over plans must skip `'salt'`, as they skip `'shape'` and `'pair'`.
- **Cleanup.** Every new display object is a stage child or tracked. Any timers that drive the shaker grains or the hide step go through `ctx.tw` or are guarded against a destroyed scene.

## What the build adds

- Voice lines in `src/content/voice-script.ts`, all slot-free so a later clip render covers them:
  - `sink.salt-shake`, `sink.salt-duck-ask`, `sink.salt-egg-ask`, `sink.salt-test-egg`, `sink.salt-test-duck` and `sink.salt-which` (all six instructed, so the pet repeats them)
  - `sink.salt-duck`, `sink.salt-egg`, `sink.salt-why`, `sink.salt-hide` ("I mixed salt into one tank.") and `sink.salt-right`
  - `sink.salt-wrong-egg`, `sink.salt-wrong-duck`, `sink.salt-hint-egg` and `sink.salt-hint-duck`
- `describeLevel(10)` comes from the plan name.
- Sink or Float's how-to card in `src/content/howto.ts` gets lines scoped `{ from: 10, to: 10 }`:
  - steps: "Shake salt into one tank, then drop a duck and an egg into both and compare." and "Then a tank gets salt in secret: tap the egg or duck to test, and tap the tank that has the salt."
  - finish: "The round ends when she has found the salty tank four times."
  - note: "Part one is watched, never scored. In part two a wrong tank counts as a miss, because she has already seen the test; after two on one question the salty tank glows (one hint). The model: salt makes the water heavier, so it pushes up harder. The duck's rise is drawn bigger than in real life. At home it takes a fresh egg and a lot of salt (an old egg can float even in plain water). Nothing new goes in the journal."
- Off-screen: the current `offScreen` is a single bath-time sentence for every band. The floating egg (a fresh egg in a tall glass of tap water, salt stirred in a spoonful at a time until it rises, with a grown-up handling the raw egg and hands washed afterwards) goes in the how-to note above for now. A school-band `OffScreenLines` sentence belongs to the band-keyed `offScreenFor` work the dive already names, not to this slice.
- The ghost finger's `autotouch()` at level 10, as above. `fingerdemo` plays the first and last level, and level 10 becomes school's last, so this bot is required.
- Art in `art.ts`, drawn with `Graphics` and `palette.ts` swatches:
  - the egg (a cream oval with a soft highlight) and the salt shaker (a white body, a grey cap with holes)
  - falling grains, made with `ctx.particles` in white with a short life
  - the dashed waterline mark
- Sounds come from the existing `sfx` set: a shake (a short tick per shake), the splash, the clunk on the bottom, the sparkle and the boing. Music stays `STYLES.bubbles`.
- The README row, the GAMES.md entry and a VERIFICATION entry.

## Rule tests (`logic.test.ts`)

- `floatsIn('egg', 'fresh')` is false and `floatsIn('egg', 'salty')` is true. The duck floats in both.
- For every floating test, the salty depth is smaller than the fresh depth by at least 16 units, so the margin is visible.
- `saltRoundFor`: there are `count` questions, the last uses the duck and the rest use the egg. Each round has both sides salty, with no three-in-a-row. Over many seeds, both sides occur as the first answer and both occur for part 1's shown tank.
- Every `sink.salt-*` line the level names exists in the voice script.
- `sinkPlan(10).mode === 'salt'`, `sinkPlan(99)` clamps to 10, and `sinkPlan(8)` still falls to 7.
- School's `order` is `[5, 6, 9, 7, 10]` and lists only built IDs. The registry, lands and how-to tests pass with school `{ min: 5, max: 10 }`.
- Levels 1–6: `thingsFor` still draws only from `THINGS`, and `ALL_THINGS` has fourteen entries, so the egg stayed out.

## Check tier for the build

New interaction tier:
- Typecheck, then the unit tests: Sink or Float's rule tests, the registry, lands, how-to and voice tests.
- **One** scripted play at school level 10 through a filter. It goes through part 1, then one wrong tank on an egg question, then a second wrong tank on the same question (the glow, one hint), then the duck question, through to the sticker. It also checks that a tank tap before the eggs settle is ignored.
- One portrait screenshot (1024×1365) with the eggs settled in part 2, and one landscape screenshot (1024×768), because the two-tank layout is new.
- `fingerdemo` with `FINGER_ONLY=sink-float`, which covers level 10 as the last level.
- Call `control()` directly once for the two-tank ring.
- `npm run build`, because the voice script and how-to are shared.
- Do not run `couchgames`, because the couch levels' `control()` paths must not change. If they do, run it filtered to Sink or Float.

## Ownership and what is left out

- **Left out of this level:**
  - salt amounts, a "how much salt" slider or a spoon count
  - layered water, with fresh water poured over salty so an egg hangs in the middle
  - the sea against a lake, or the Dead Sea
  - the words *density* and *dissolve*
  - other liquids (oil, syrup)
  - a guess before the test (her part 2 answer already comes after the evidence)
- **Owned elsewhere:**
  - Dissolving and where the salt goes belong to the matter study's Stir and See.
  - A floating egg's journal page is a later candidate (see above).
  - How much a boat carries belongs to level 11, *Build a Boat*, defined after Garden Raft.
