# Down We Go, levels 1–4 (definition)

**Built:** levels 1–4 (PRs #1909, #1918); no later level is defined, so a builder reads “What comes next”.

Defined 2026-11-18 as slice 5 of the [oceans study](../deep-dives/subjects/oceans.md#build-slices-in-order), from its [candidate row](../deep-dives/subjects/oceans.md#candidates-and-recommended-order) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#oceans-recommendations). The slice's condition, Tide Line's shore art, is built. Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: levels 1–4 built (batches `down-we-go 1` and `2`; see the [game page](../games/down-we-go.md) for where level 3–4 departs from this definition).** Registration, bands and land take the defaults below under standing rule S8, and every explanation line takes the building session's source check under S1 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)); nothing waits on the developer. It depends on no unbuilt game.

**Fun action and purpose:** a little boat sits on a calm sea with a lantern on a knotted rope. She pulls the lantern down, knot by knot. At every knot a **sun dial** on the rope opens as many petals as there is daylight left, the water round the lantern turns a deeper blue, and a rock ledge comes into the lantern's glow. Then she plants a seaweed sprout on the deepest ledge where it can still grow. The learning purpose is **daylight fades as the sea gets deeper, and seaweed can only live where enough of it reaches** (NOAA Ocean Literacy concepts 5e, a three-dimensional ocean, and 5f, habitats set by light among other factors, as the [study](../deep-dives/subjects/oceans.md#anchors-opened-at-their-source) read them). The school levels add that cloudy water stops the light sooner, and that the fading multiplies (each knot leaves half) rather than taking away a fixed amount.

**Two lights, kept apart.** The study's row says "the deep is dark so the lantern is the light". The lantern is *her* light: it lets her see the ledge and keeps the deep friendly. The sun dial reads only **daylight from above** and ignores the lantern (it faces up, under a little shade). The game never asks whether lantern light could grow seaweed, and no line says it can or cannot.

**Seaweed, not "plants".** The study's phrase was "because plants need light". The source check below found NOAA calls kelp "large brown algae" and seaweed "marine plants and algae", so no line calls seaweed a plant. The lines say **seaweed makes its food with sunlight**, which both pages support.

## Identity and overlap

Rechecked 2026-11-18 against the catalog and the open proposals:

- **Sea Lift** (Bubble Beach) owns depth as a number line: stops above and below the water as integers. Here the knots are never numbered as heights, nothing is added or subtracted, and the variable is *light*.
- **Tide Line** owns where the sea reaches on the shore and when. Nothing here moves the waterline. Its seaweed is a line the tide left; here seaweed is alive and growing.
- **Light Lab** (Tinker Lab) steers a beam with mirrors, and its level 11 asks what a thing does to a beam (through, bounce, stop). Nothing here is steered; the water dims the light by itself and she reads how much is left.
- **Far Lights** owns brightness against *distance from a lamp* ("which looks brighter?"). Here the source is the sky and the cause of dimming is the water in between; level 3's clear and cloudy water has no counterpart there.
- **Habitat Helpers** levels 8–9 (designed in its [dive](../deep-dives/habitat-helpers.md)) ask which shore friend's needs a place meets. Down We Go has one need (light) and one living thing (seaweed), and the place is measured, not given.
- **Food Web Workshop** owns feeding, so nothing here eats anything; **Puddle Lens** owns plankton, so the sea's drifting algae are not shown.
- **Garden Grow** grows flowers with rain at lap to pre-K; it has no light variable.

**Identity test.** Down We Go earns a separate game because its decision is **how far down the light reaches, read from a measurement she makes**, which is a threshold on a fading quantity. If a build finds the rounds are only "lower the lantern and look", it stops and the game becomes a Sea Lift level instead (decision 1).

## The model (`logic.ts`)

- **Petals** are the light unit: a sun dial has 8 petals and shows `0..8` open. Petals are a **pretend unit**: no metres, no percentages, no zone boundary (the study's rule, kept because the sources below disagree on depths).
- **A dive** is `{ light: number[], need: number, water: 'clear' | 'cloudy' }`. `light[k]` is the reading at knot `k` (knot 0 is just under the boat), never rising with depth. `need` is how many petals this sprout needs, from `{1, 2, 4}`.
- `canGrow(dive, k)`: `dive.light[k] >= dive.need`.
- `deepest(dive)`: the largest `k` with `canGrow`. Every generated dive has one (knot 0 always reads 8) and has **at least one knot too dark**, so the answer is never simply the bottom.
- **Levels 1–2** use any non-rising list that starts at 8, drawn from `{8, 4, 2, 1, 0}` (a rope whose knots are not evenly spaced; nothing is claimed about the rule of fading).
- **Levels 3–4** use the two fading rules on an evenly knotted rope of five knots: `fade('clear')` is `[8, 4, 2, 1, 0]` (each knot leaves half; under one petal the dial stays shut) and `fade('cloudy')` is `[8, 2, 0, 0, 0]` (each knot leaves a quarter).
- `compare(a, b)` (level 3): `'deeper' | 'same' | 'shallower'`, the second dive's `deepest` against the first's. For the two fading rules and every `need` it is never `'same'` (a test checks it), so the prediction always has something to find.
- **A dial question** (level 4) is `{ shown: (number | null)[], at: number, options: [number, number, number], answer: number }` on the clear rope: the readings she can see, the knot whose dial is covered, and three dials to choose from. `halfOf(n)` gives the rule's step for the hint.

### The authored dives

These are rule tests verbatim.

| Level | Light by knot (top first) | Need | Deepest ledge | Too-dark ledges |
| --- | --- | --- | --- | --- |
| 1, first dive | 8, 4, 0 | 2 | knot 1 (the middle) | knot 2 |
| 1, second dive | 8, 1, 0 | 2 | knot 0 (the top) | knots 1 and 2 |
| 1, third dive (four knots) | 8, 4, 2, 0 | 2 | knot 2 | knot 3 |
| 2, first dive | 8, 8, 4, 1, 0 | 4 | knot 2 | knots 3 and 4 |
| 3, clear then cloudy | 8, 4, 2, 1, 0 then 8, 2, 0, 0, 0 | 2 | knot 2, then knot 1 | "shallower" |

The three level-1 answers are the middle, the top and the third knot, so "always the top" and "always the middle" both fail inside the first round.

**Level 4's question pool** (clear rope, `8, 4, 2, 1, 0`):

| Question | Shown | Answer | The two wrong dials, and the mistake each one is |
| --- | --- | --- | --- |
| Next reading | 8, 4, ? | 2 | 0 (took four away again), 4 (no change) |
| Next reading | …, 4, 2, ? | 1 | 0 (took two away again), 2 (no change) |
| The covered dial | 8, ?, 2 | 4 | 5 (halfway between), 2 (no change from below) |
| The covered dial | 4, ?, 1 | 2 | 3 (halfway between, rounded up), 1 (no change from below) |

A round draws three of the four, a "next reading" first. The pool is small on purpose: a larger one needs a dial with more petals, which is a later definition.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Down we go** | pre-K | After riding the lantern down past every knot, the deepest ledge where the sprout can grow | The third sprout planted |
| 2 | **Measure first** | pre-K, school | Which knots to measure on a five-knot rope, then the deepest ledge; the sprout's need changes each dive | The third sprout planted |
| 3 | **Clear water, cloudy water** | school | Whether the seaweed will live deeper or not as deep in the next cove, then its deepest ledge there | Both coves planted |
| 4 | **Half each knot** | school | Which dial fits a covered knot, from the rule that each knot leaves half | The third dial uncovered |

`BandLevels`: pre-K 1–2, school 2–4. Level 4's how-to note says "about 8 and up"; nothing gates it.

### Rounds

- **Level 1:** three dives, the authored three first; later rounds are seeded (three or four knots, need 2, a different answer knot on at least two of the three dives). Each dive opens with **the ride**: she drags the lantern down past every knot once (or taps each knot), every dial opens and stays open, and only then do the ledges wake. So nothing has to be remembered.
- **Level 2:** three dives of five knots, the authored one first; `need` is drawn so a round uses at least two different needs. No ride: dials open only at knots she lowers the lantern to. She may plant at any time.
- **Level 3:** one pair of coves on the evenly knotted rope, the same sprout in both; which water comes first is seeded (the authored round is clear then cloudy). She measures and plants the first cove as at level 2, predicts for the second, then measures and plants it. The first cove's dials stay on a small logbook strip beside the rope.
- **Level 4:** three dial questions from the pool. After each answer the cover lifts and the lantern drops to that knot so the real dial shows.

## Screen and controls

- **The scene:** sky and the boat along the top; below it the sea as one tall column, the rope down its left-centre with a knot at each stop, a rock wall down the right with a ledge at every knot, and the pet's bottom-left corner clear. The water is drawn in bands that deepen from light blue to a deep blue-violet, **never black**, and the lantern always carries a warm circle of light. Each knot's band is at least 112 logical units tall (five knots fit 4:3 landscape under the boat; the layout returns null rather than squeeze them).
- **The lantern** (at least 110 × 110) drags down and up the rope with `src/engine/drag.ts` and snaps to the nearest knot on release; tapping a knot sends it there. Touch-down makes it swing and glow. Each knot it reaches plays one pentatonic step from `src/audio/notes.ts`, lower with depth, and a bubble plip.
- **The sun dial** sits on the rope at each knot (display, at least 96 units across): eight petals round a centre, open petals raised and filled, shut ones flat outlines, so the count reads by shape and not by colour alone. A measured knot keeps its dial open for the rest of the dive.
- **The need card** (display) beside the boat shows the sprout and a dial with its `need` petals open, so a ledge's dial can be matched against it by eye.
- **Ledges** (targets, at least 110 × 110) are tapped with `onTap` to plant. Touch-down lifts the sprout toward the ledge. A ledge outside the lantern's circle still shows as a pale outline, so every target is always visible.
- **Friends** make the deep kind: a fish near the top (`fishArt`), a turtle passing in the middle (`turtleArt`), and at the darkest knot a small fish that glows by itself, drawn new in the game's `art.ts`. They wave or blink at the lantern, never chase, hide or startle, and nothing has teeth.
- **Level 3's prediction:** two answer plates (at least 150 × 130), **Deeper** and **Not as deep**, each a picture of the sprout on a lower or higher ledge with an arrow; the pet speaks both.
- **Level 4's dials:** the rope with one knot's dial under a shell cover, and three dial cards (at least 150 × 150) beside it (right in landscape, below in portrait).
- **Sound:** bubbles, a soft rope creak, pentatonic steps, a chime when a sprout roots and sways, `boing` for a miss. No sonar pings, no ominous drone, no storm. Music is `STYLES.bubbles`, as Tide Line.
- **Pause sheet:** Start again (the same dive, keeping misses and hints) and Show a hint (`Scene.pauseActions`).

`downLayout(view, level)` returns every rectangle: the boat strip, the rope and knots, dials, ledges, the need card, the logbook strip, the answer plates and dial cards. A test runs it at the four views the lands test uses and asserts every target at least 100 units each way and at its stated minimum, no overlap between targets, the Home button and the guide's bottom-left corner clear, and everything inside `view`; it returns null rather than shrink.

### Layout sketch

**Landscape (1024 × 768), level 2, lantern at knot 2:**

```
+--------------------------------------------------------------+
| [Home]     ~~~ boat ~~~      [sprout needs: dial 4]           |
|              |                                                |
|   (dial 8)   o  knot 0                    [ ledge 0 ]=====wall|
|   (dial 8)   o  knot 1                    [ ledge 1 ]=====wall|
|   (dial 4)  (L) knot 2  <- lantern        [ ledge 2 ]=====wall|
|   (shut)     o  knot 3                    [ ledge 3 ]=====wall|
|  pet (shut)  o  knot 4                    [ ledge 4 ]=====wall|
+--------------------------------------------------------------+
```

**Portrait (768 × 1024):** the same column with taller bands; at level 4 the three dial cards sit in one row under the rope.

## Accounting, help and finishing

The repository rule is that experimental predictions are never wrong answers, and that a claim the visible evidence already decides is counted.

- **Free, never a miss:** moving the lantern, in any order and as often as she likes; planting on a ledge that has enough light but is not the deepest (the sprout roots, sways, and the pet asks "It can grow here. Can it live deeper still?"; the sprout lifts when she taps a lower ledge); planting on a ledge whose knot she has **not measured** (a prediction: the lantern drops there, the dial opens, and the sprout either roots or floats back up to the boat with "Not enough light there. Now we know."); level 3's Deeper or Not as deep; the **first dial question** of a level-4 round.
- **Counted, one miss and a gentle `boing`:** planting on a ledge whose open dial shows fewer petals than the need card (the sprout droops and floats back to the boat, and the pet points at the dial: "Only one petal here. It needs two."); a wrong dial at level 4 from the second question on (the cover lifts halfway, the pet shows the dial above: "Half of four is two").
- **Two misses on the same dive or question** glow the right ledge or dial card; the shell counts **one hint**, once per dive or question.
- **Show a hint** counts **1 hint** each: levels 1–3 send the lantern to the deepest ledge's knot and wiggle its dial beside the need card ("Count the petals here"); if that knot is already measured, the pet also shows the knot below is too dark. Level 4 opens the dial above the cover and splits its petals in two.
- **Assisted ending:** every dive and question finishes through her own tap after the glow, and finishing with help earns the ordinary one sticker. At level 1 the ride measures every knot, so every wrong ledge there is counted and a smooth round is evidence she compared the dials.
- **Finishing:** after the last sprout roots (levels 1–3) or the last cover lifts (level 4), the lantern rides back up with the friends waving, then `ctx.finish({ misses, hints })`, once. The game guards its own ride timers against a destroyed scene.
- **Adaptation:** a smooth round shows she read the pretend dial against the pretend need; the how-to card says it is not evidence about real seaweed or real depths.

## Speech (`voice.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Under S1 the building session opens the sources below again, checks each explanation line against them and records the check in its verification entry; a line it cannot support is cut or reworded before merge.

- `down.instruct.1`: "Pull the lantern down. Then tap the deepest ledge where the seaweed can grow."
- `down.instruct.2`: "This seaweed needs {need} petals of light. Measure with the lantern, then plant it as deep as it can live."
- `down.instruct.3a`: "Find how deep the seaweed can live in this cove." `down.instruct.3b`: "This cove's water is {water}. Will the seaweed live deeper here, or not as deep?"
- `down.instruct.4`: "Each knot leaves half the light. Which dial is hiding?"
- `down.knot` (first time at each kind of knot): "Lots of light up here." / "Less light now." / "No daylight here. Our lantern keeps it cosy."
- `down.rooted`: "It's growing! There is enough light here." `down.deeper`: "It can grow here. Can it live deeper still?"
- `down.wrong`: "Only {n} here. It needs {need}." `down.unmeasured`: "Not enough light there. Now we know."
- `down.hint`: "Count the petals here." `down.hint.4`: "Half of {n} is {half}."
- `down.predict.right`: "You were right: {water} water lets the light go {how}." `down.predict.other`: "Look, it was {how}. {Water} water lets less light through."
- `down.why` (once per session, after the first finish): "Seaweed makes its food with sunlight, so it lives where the light reaches."
- `down.glow` (once per session, the first time the lantern meets the glowing fish): "Some animals in the dark sea make their own light."
- `down.cloudy` (once per session at level 3): "Cloudy water is full of tiny bits that block the light."
- `down.limits` (once per session at level 4): "This is a pretend rope. The real sea is far deeper, and its light fades in this same halving way."

None of these gives a depth in metres, a percentage, a zone boundary or a species name, calls seaweed a plant, says the dark is dangerous, or says what causes cloudy water beyond "tiny bits" (no mud spill, no pollution; tone decision 5 of the study).

## Source check (S1, this session)

Each page was read on 2026-11-18 through a fetch that returns quoted passages, not by reading the full page; the building session opens them again.

| Claim the game makes | Source and what it says |
| --- | --- |
| Daylight fades with depth, and there is a depth below which there is none | NOAA Ocean Service, [How far does light travel in the ocean?](https://oceanservice.noaa.gov/facts/light_travel.html): "there is rarely any significant light beyond 200 meters"; "The aphotic zone exists in depths below 1,000 meters" |
| Seaweed needs that light to make food, so it lives in the lit water | The same page: beyond 200 metres "photosynthesis is no longer possible". NOAA Ocean Service, [What is a kelp forest?](https://oceanservice.noaa.gov/facts/kelp.html): "Because of their dependency upon light for photosynthesis, kelp forests form in shallow open waters" |
| Seaweed is not simply "a plant" | The kelp page: "Kelp are large brown algae". NOAA Ocean Service, [What is seaweed?](https://oceanservice.noaa.gov/facts/seaweed.html): "the common name for countless species of marine plants and algae" |
| Cloudy water stops the light sooner | NOAA Ocean Service, [What is turbidity?](https://oceanservice.noaa.gov/facts/turbidity.html): particles "such as sediment, plankton, or organic by-products", called "light-blocking particles". University of Hawai‘i, [Exploring Our Fluid Earth: Light in the Ocean](https://manoa.hawaii.edu/exploringourfluidearth/physical/ocean-depths/light-ocean): "In clear tropical waters, the euphotic zone may extend to a depth of 80 meters", while "Turbid, muddy waters may have a euphotic zone only a few centimeters in depth" |
| Some deep animals make their own light | NOAA Ocean Exploration, [What is bioluminescence?](https://oceanexplorer.noaa.gov/facts/bioluminescence.html): "light produced by an organism using a chemical reaction", "most common among fish, squid" and gelatinous animals |
| The fading multiplies (level 4) | **Only partly supported.** The Hawai‘i page says "Within the first 10 m, water absorbs more than 50 percent of the visible light energy" and that about 1 percent reaches 100 m in clear tropical water, which fits a multiplying rule but does not state one. The building session must open a source that states the rule (exponential attenuation) before `down.limits` keeps its last clause; otherwise the line ends at "The real sea is far deeper." |

**Why still no metres.** The two sources above give different depths for the lit layer (200 metres on the NOAA page, up to 80 metres in clear tropical water on the Hawai‘i page), on top of the disagreement the study found. Petals and knots stay the only units.

**Not supported, so not in the game:** a different light need for each kind of seaweed (the toy needs of 1, 2 and 4 petals belong to "this sprout", and the how-to card says they are pretend), red seaweeds living deeper than green, any named animal at any named depth, and anything about what lantern light does for seaweed.

## Rule tests (`logic.test.ts`)

1. **Authored dives:** the table above, light for light and answer for answer, and the level-4 pool with its options.
2. **Every dive is fair:** over 300 seeds per level, light starts at 8 and never rises with depth, `deepest` exists, at least one knot is too dark, and `canGrow` is true exactly for the knots at or above `deepest`.
3. **Level 1 rounds:** the first round is the authored three; seeded rounds have at least two different answer knots; the same seed gives the same round.
4. **Level 2 rounds:** five knots, at least two different needs in a round, and the answer is neither always the top nor ever the bottom.
5. **Level 3:** `compare` is never `'same'` for either order of the two waters and every need; the second cove's answer differs from the first's.
6. **Level 4:** every question has exactly one option equal to the rule's value, three distinct options, and no answer below one petal; a round starts with a "next reading" and never repeats a question.
7. **Accounting:** an unmeasured ledge never counts; a measured too-dark ledge counts one; a shallow-but-lit ledge counts nothing and does not finish the dive; the first level-4 question never counts; two misses give exactly one glow hint per dive or question; misses never block the right answer.
8. **Hints lead somewhere:** the hint's knot is `deepest`; the glowed ledge or dial card is the right one.
9. **Layout:** `downLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the dive from the scene. Levels 1–3: it drags the lantern to each knot from the top until a dial shows fewer petals than the need card, then taps the ledge one knot above. Level 3's prediction: it taps the plate matching the water named. Level 4: it taps the dial card showing half of the dial above the cover. `fingerdemo` runs at levels 2 and 4.
- **How-to card** (`howto.ts`). Goal: "Lower the lantern to see how much daylight reaches each knot, and plant the seaweed as deep as it can still grow."
  - Steps: "Drag the lantern down the rope, or tap a knot; the sun dial opens a petal for the daylight there" (all levels); "Tap the deepest ledge whose dial shows at least as many petals as the seaweed needs" `{ from: 1, to: 3 }`; "Say whether the seaweed will live deeper or not as deep in the second cove, then find out" `{ from: 3, to: 3 }`; "Tap the dial that fits the covered knot: each knot leaves half the light" `{ from: 4, to: 4 }`.
  - Finish: "The round ends when the last seaweed is growing" `{ from: 1, to: 3 }`; "The round ends when the third dial is uncovered" `{ from: 4, to: 4 }`.
  - Notes: "Moving the lantern is always free, and so is planting on a ledge she has not measured yet" (all levels); "A ledge with light that is not the deepest is not a miss; the pet asks if it can live deeper" `{ from: 1, to: 3 }`; "The guess about the second cove is free" `{ from: 3, to: 3 }`; "About 8 and up" `{ from: 4, to: 4 }`; "The dial reads daylight only, not the lantern" (all levels); "Petals and needs are pretend numbers on a pretend rope. In the real sea, seaweed lives in the lit water near the top and the deep sea has no daylight" (all levels); "Rounds without hints move her up, which means she read the dial, not that she knows real ocean depths" (all levels).
- **Registration (default under S8):** ID `down-we-go`, name "Down We Go", spoken title `game.down-we-go` ("Down we go"). Region `tinker-lab` and `challenge: 'noticing'`, as Tide Line. Skills `['ocean', 'light', 'measuring', 'evidence']`. Hub icon: a lantern on a knotted rope against deepening blue. Sticker (page `sea`): a seaweed sprout swaying on a ledge in the lantern's glow.
- **Home land: Bubble Beach,** measured this session at 14 games on `main` (`src/content/lands.ts`), so Down We Go is its 15th. `landPages` already pages the school side (host and 14 games pass `LAND_SPOTS`, 13); with 15 games it stays two pages (8 and 7). **The pre-K side is the cost:** today it is exactly one full page (host, eleven games, signpost), and a twelfth pre-K game makes it two pages of six. Lap, toddler and preschool sides do not change (the game sits behind their signpost). Nothing shrinks, and the build's lands test decides. Fallback if that test fails: Tinker Lab, which already pages. See decision 2.
- **Art:** code-drawn in `src/games/down-we-go/art.ts` with `src/art/palette.ts`: the boat, rope and knots, the lantern and its glow, the sun dial, the water bands, the rock wall and ledges, the sprout (rooted, drooping, floating), the glowing fish, the shell cover. The fish and turtle reuse `src/art/animals.ts`; the seaweed should match the strands in Tide Line's `art.ts` (lift a shared drawing into `src/art/` only if the build needs the same shape twice). No imported art or audio.
- **Co-play:** one person is the diver (moves the lantern and counts the petals aloud), the other is the gardener (says "deeper" or "stop" and plants); swap each dive. Solo, the pet counts. **Off-screen** (spoken tip): "Shine a torch through one sheet of paper, then two, then three. How many sheets before you can't see the light?" Paper and a torch only; no water play and no shore advice.
- **Couch:** none. **Journal:** nothing filed in this definition (a "glowing fish" entry would need its own sourced line). **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The friends at the knots could later be her creatures, as the [rework brief](../rework/README.md) decides.

## Check tier

- **Batch `down-we-go 1` (levels 1–2), new-game tier:** typecheck and unit tests (tests 1–4, 7–9 plus the registry, lands and how-to tests); one filtered scripted play through a new `browser-check.mjs` case (and its README row) at level 1 with one too-dark ledge, a second miss for the glow, a shallow-but-lit ledge and then the right one, and at level 2 with an unmeasured ledge, a hint and the right ledge; one portrait screenshot at level 2 with the lantern at the darkest knot (the check that the dark stays readable); `fingerdemo` at level 2; `npm run build`, because the registry, lands, voice and how-to files change. If the allowance cannot cover both levels, stop after a complete level 1 with a draft-PR checkpoint.
- **Batch `down-we-go 2` (levels 3–4), new-interaction tier:** typecheck, rule tests 5–9, one filtered play of the authored coves with the other prediction first, and of level 4 with the free first question wrong, one counted wrong dial and the right ones; one portrait screenshot of level 4's cards; `fingerdemo` at level 4; a build for the voice lines. The S1 check of `down.limits` is this batch's.

What a phone playtest could answer later, without holding the build: whether the deepest knot reads as cosy or gloomy, and whether "deepest ledge that still works" is understood without the pet's follow-up.

## What comes next

Later levels, each needing its own definition and sources: **who glows** (the friends of the dark knots and their own light, from the bioluminescence page), **red, green and brown** (different seaweeds at different depths, only with a source for each), **colours fade too** (red light goes first; the Hawai‘i page mentions blue reaching deepest), a **sixteen-petal dial** so level 4 has a larger pool and the cloudy rule, and a **grown-up Lantern Lake case** that plans the fewest measurements. Zone names (sunlight, twilight, midnight) may be spoken once a single source is chosen for them; they are not used here.

## Open decisions

Each has a default the build uses; none waits on the developer (S1, S8).

1. **Register Down We Go as a new game,** pre-K 1–2 and school 2–4. Alternative: a Sea Lift level; not chosen, because Sea Lift's decision is arithmetic on heights and this one is a measured threshold on light.
2. **Home land Bubble Beach,** accepting a second page on the pre-K side. Alternatives: Tinker Lab (already pages, but the boat and seaweed belong by the sea), or starting the bands at school so the pre-K beach stays one page; not chosen, because the READY line and the study give it to pre-K and the land rule is to page rather than leave a game out.
3. **What is counted.** Default: only a ledge whose open dial already shows too little light, and level-4 dials after the first. Alternative: count every ledge that is not the deepest; not chosen, because a lit ledge is a true place for seaweed and the follow-up question teaches more than a boing.
4. **Petals, not zones.** Default: no metres, percentages or zone names. Alternative: the three zone names without depths; held until one source is chosen, as the study asked.
5. **Seaweed, not plants.** Default: "seaweed makes its food with sunlight". Alternative: the study's "plants need light"; not chosen after the source check.
