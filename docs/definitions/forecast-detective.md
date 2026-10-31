# Forecast Detective, levels 1–2 (definition)

Defined 2026-10-31 as slice 9 of the [weather-and-water study](../deep-dives/subjects/weather-water.md#build-slices-in-order) (one Forecast Detective case), from its [candidate row](../deep-dives/subjects/weather-water.md#candidates-and-recommended-order) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#weather-and-water-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: built 2026-10-31** ([PR #1069](https://github.com/rjdunlap/neo/pull/1069); levels 1–2, batch forecast-detective 1; deviations are listed in [GAMES](../GAMES.md#forecast-detective)). Originally ready to build as one same-game batch (levels 1–2, new-game tier). Registration, bands and land take the defaults below under standing rule S8, and the explanation lines take the building session's source check under S1 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)); neither waits on the developer. It depends on no other unbuilt game. The tween and parent appeal the study asks about is a person check, not a build gate.

**Fun action and purpose:** a little harbour town sits between two neighbour islands, Hill Isle to the west and Lighthouse Isle to the east. A friend asks what the sky will bring tomorrow. Four covered clues wait on a noticeboard: the town's wind vane, a postcard from each island showing its sky today, and the town thermometer. She lifts a flap to see a clue (the pet says it aloud), works out which weathers are still possible, and answers with one weather card, or with *Can't tell yet* when the clues she has cannot decide. Then night falls and tomorrow's sky arrives on the wind. The learning purpose is **evidence narrows the possibilities; some clues matter and some do not; and when the clues cannot decide, saying so is the right answer** (NGSS [MS-ESS2-5](https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems), weather changes and predictions with uncertainty, as the far horizon; [3-ESS2-1](https://www.nextgenscience.org/pe/3-ess2-1-earths-systems) uses weather data to describe what is expected). It is a deduction inside a **disclosed pretend rule**, never a claim that one clue guarantees real weather.

## Identity and overlap

Rechecked 2026-10-31 against the catalog and the open proposals:

- **Sense Detective** (Tinker Lab, built) owns using a second sense when one clue cannot decide, with a free "not yet" Check. Forecast Detective borrows that accounting shape, but its clues combine through a rule (wind *and* postcard *and* temperature), some clues are irrelevant, and the insufficient-evidence answer is a real finish rather than a prompt to look again.
- **Lost Layers** (Bubble Beach, built) owns *Can't tell* between two rock stories. Here the possibilities are four weathers, each clue removes some, and *Can't tell yet* is correct only when every available clue is open.
- **Rain Garden** level 8 ([definition](rain-garden.md), proposed) is an evidence case about two toy *soil* rules; it never forecasts. **Drop's Journey** ([definition](drops-journey.md), queued) follows water between places and draws no forecast.
- **Household Casebook** (H5, daily-life-long-ago, to be defined) is a fictional evidence case about the past from objects and documents; nothing about weather or a rule that combines clues.
- **Lemonade Stand** uses a disclosed forecast as an economic input; the forecast is given, never reasoned out. **Day by Day** (including Weather Window) keeps weather *records* and their summaries; **Weather Wardrobe** keeps dressing for weather. None asks what tomorrow brings from clues.
- **Picture Logic** (Lantern Lake, grown-up) is a nonogram, not a possibility set.

## The model (`logic.ts`)

- **Skies:** `sun`, `cloud`, `rain`. **Weathers (the answer cards):** `sunny`, `cloudy`, `rainy`, `snowy`.
- **A case** is `{ wind: 'west' | 'east', west: Sky, east: Sky, temp: 'freezing' | 'warm', missing?: ClueId }`, where `ClueId` is `'wind' | 'west' | 'east' | 'temp'`. The four values are the truth; `missing` (level 2 only) names the one clue whose flap shows "didn't come" and cannot be opened.
- **The valley's two rules** (shown on the rule card and spoken at the start of every round; they are the pretend model, not facts about real weather):
  1. **The wind brings the sky.** Tomorrow the town gets today's sky from the island the wind blows *from*.
  2. **Freezing turns rain to snow.** If the thermometer shows freezing, rain arrives as snow. Sun and cloud stay sun and cloud.
- `tomorrow(case)`: the upwind island's sky, with `rain` + `freezing` giving `snowy`, else `sun → sunny`, `cloud → cloudy`, `rain → rainy`.
- **The thermometer has only two readings:** `freezing` (the column at the bottom, a snowflake, blue) and `warm` (the column well up, a sun, at least 5 °C in the art's scale). It never shows a reading just above freezing, because real snow can still fall there ([NSIDC](https://nsidc.org/learn/parts-cryosphere/snow/science-snow)); the model's "warm means no snow" holds only because "warm" is drawn well clear of it.
- **Worlds:** all 36 combinations of wind (2) × west sky (3) × east sky (3) × temperature (2). `possible(case, open: ClueId[])` returns the set of `tomorrow(w)` over every world `w` that agrees with the case on each open clue. This is the whole evidence model: **clues only rule weathers out; no weather is ever given a likelihood, percentage or "probably".**
- `decided(case, open)` is `possible(...).size === 1`. `available(case)` is the four clues minus `missing`. `canTell(case)` is `decided(case, available(case))`.
- Every level-1 case is decidable with all four clues open (a test checks all 36). Over the 36 worlds the fewest clues that decide is 2 (24 worlds: the wind and the upwind postcard when that sky is sun or cloud) or 3 (12 worlds: rain upwind, so the thermometer matters too); the downwind postcard never matters once the wind is known.
- **Check** takes the selected answer (`Weather` or `'cant-tell'`) and the open clues and returns one of:
  - `right`: a weather equal to the only possible one; or *Can't tell yet* when every available clue is open and more than one weather is possible.
  - `ruled-out` (a miss): a weather not in `possible(case, open)`; the result names one open clue that rules it out (`ruledOutBy`: the first open clue, in the order wind, upwind postcard, temperature, downwind postcard, whose addition removed it).
  - `not-yet` (free): a weather still possible alongside others while an available clue is still closed; or *Can't tell yet* while an available clue is still closed and the open clues do not yet decide.
  - `overclaim` (a miss): a weather still possible alongside others when every available clue is open (it claims more than the evidence holds); or *Can't tell yet* when the open clues already decide (whether or not other flaps are closed).
- `usefulClue(case, open)` (the hint): the closed available clue whose opening leaves the fewest possible weathers in the true case, ties broken in the order wind, upwind postcard, temperature, downwind postcard; `null` when none reduces the set.

### Remaining weathers after every clue: the authored cases

**Level 1 authored case:** wind from the west, Hill Isle (west) rain, Lighthouse Isle (east) sun, warm. Tomorrow: rainy. All 16 sets of open clues (the order she opens them does not matter; computed from the 36 worlds):

| Open clues | Still possible |
| --- | --- |
| none | sunny, cloudy, rainy, snowy |
| wind | sunny, cloudy, rainy, snowy |
| west | sunny, cloudy, rainy, snowy |
| east | sunny, cloudy, rainy, snowy |
| temp | sunny, cloudy, rainy |
| wind + west | rainy, snowy |
| wind + east | sunny, cloudy, rainy, snowy |
| wind + temp | sunny, cloudy, rainy |
| west + east | sunny, rainy, snowy |
| west + temp | sunny, cloudy, rainy |
| temp + east | sunny, cloudy, rainy |
| wind + west + temp | **rainy** (decided; the east postcard is not needed) |
| wind + west + east | rainy, snowy |
| wind + temp + east | sunny, cloudy, rainy |
| west + temp + east | sunny, rainy |
| all four | **rainy** |

**Level 2 authored case:** Lighthouse Isle's postcard didn't come (`missing: 'east'`); wind from the east, Hill Isle sun, warm; the late postcard (the hidden truth) shows cloud. All 8 sets of the three available clues:

| Open clues | Still possible |
| --- | --- |
| none | sunny, cloudy, rainy, snowy |
| wind | sunny, cloudy, rainy, snowy |
| west | sunny, cloudy, rainy, snowy |
| temp | sunny, cloudy, rainy |
| wind + west | sunny, cloudy, rainy, snowy |
| wind + temp | sunny, cloudy, rainy |
| west + temp | sunny, cloudy, rainy |
| all three | sunny, cloudy, rainy: **Can't tell yet** is the answer |

Both tables are rule tests verbatim.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Which way is the wind?** | school | Which clues to open and which weather the open clues leave | A right Check |
| 2 | **A postcard didn't come** | school | The same, with one clue unavailable: one weather when the rest still decide, *Can't tell yet* when they cannot | A right Check |

One case per round. Level 2's how-to note says "about 10 and up" (S2); nothing gates it.

### Rounds

- **Level 1:** the authored case first; later rounds are seeded from `ctx.rng` among the 24 worlds whose two postcards differ (so the wind always matters), with the 12 rain-upwind worlds (thermometer matters) drawn at least one round in three. No `missing`. *Can't tell yet* is not on the board.
- **Level 2:** the authored case first; later rounds seed a world from all 36 and a `missing` clue from the four, then keep the pair only if it alternates with the previous round between `canTell` true and false (so she meets both kinds; a test checks that over 300 seeds both occur and no two "can't tell" rounds run back to back). A missing wind vane is allowed: when both postcards show the same sky it still decides. The *Can't tell yet* card is always on the board.

## Screen and controls

- **The scene:** sea across the middle, the harbour town centre-bottom with its wind vane on the tower and the thermometer on the harbour wall; Hill Isle at the left edge, Lighthouse Isle at the right. Today's sky over the town is plain pale blue: it gives nothing away.
- **The noticeboard** across the top, below the Home button: four **clue flaps** (at least 150×150 logical units), each with its picture on the cover so no reading is needed: a vane, a hill postcard, a lighthouse postcard, a thermometer. A tap lifts the flap (touch-down tilts it at once) and the clue shows: the vane arrow points *into* the wind, toward the island it blows from, with wind streaks drawn from that island across the sea; a postcard shows its island under a sun, a cloud or rain; the thermometer shows the freezing (snowflake, blue) or warm (sun, red) reading. The pet speaks each clue as it opens ("The wind is blowing from Hill Isle"). An open flap stays open; tapping it again repeats the line. A missing clue (level 2) is a flap with a little boat that never arrived and a question mark; tapping it says "This postcard didn't come."
- **The rule card** (a small board at the left of the noticeboard, at least 110×110, a picture of wind carrying a cloud and of a snowflake over a thermometer) replays the two rules aloud. Never required; counts nothing.
- **Answer cards** along the bottom: sunny, cloudy, rainy, snowy (and *Can't tell yet*, a card showing two clouds with a question mark, at level 2), each at least 150×170. A tap selects one (it lifts and outlines; a second card replaces the selection). **Check**, a large green button (at least 130×130), stands right of the cards and is active once a card is selected.
- **No automatic crossing-out.** She works out the possibilities herself; crossing out the ruled-out cards is what help does (below).
- **Tomorrow** (the reveal, after a right Check): the sky darkens to night with a moon (about 2 s), then morning: at level 2 the late postcard's boat arrives first and its flap opens; then the upwind island's sky slides across the sea to the town with the wind streaks (sun, cloud, rain or snow falling on the roofs). Taps are ignored during the reveal (about 5 s), then the shell's finish follows.
- **Sound:** a paper flick for a flap, a soft chime for the rule card, a pentatonic rise for a right Check (`src/audio/notes.ts`), `boing` for a miss, gentle synthesized patter for rain or a high twinkle for snow at the reveal. No thunder, sirens or storm sounds. The island style keeps playing (default `STYLES.quiet`).
- **Pause sheet:** Start again (the same case, flaps closed, keeping misses and hints) and Show a hint (`Scene.pauseActions`).

`forecastLayout(view, level)` returns every rectangle: islands, town, flaps, rule card, answer cards, Check. A test runs it at the four views the lands test uses and asserts every target (flaps, rule card, cards, Check) at least 100 units each way and at its stated minimum, no overlap between targets, the Home button and the guide's bottom-left corner clear, and everything inside `view`. In portrait the flaps go two by two and the five level-2 cards go three over two; if that fails, the layout returns null and the test fails rather than shrink.

### Layout sketches

**Landscape (1024×768 design area):**

```
+--------------------------------------------------------------+
| [Home] [rule] [vane flap] [hill pc] [lighthouse pc] [thermo] |
|                                                              |
|  Hill Isle  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  Lighthouse    |
|   /\/\      ~~~~~~~~~  town  ^vane ~~~~~~~~~~     Isle  |>   |
|            ~~~~~~~~~  [] [] [] thermo ~~~~~~~~               |
|                                                              |
|  pet  [sunny] [cloudy] [rainy] [snowy] [can't tell]  [Check] |
+--------------------------------------------------------------+
```

**Portrait (768×1024 design area, upright iPad):**

```
+----------------------------------+
| [Home] [rule]  [vane]  [hill pc] |
|               [lighthouse] [thermo]
|                                  |
| Hill Isle ~~~~~~~~~ Lighthouse   |
|   /\/\  ~~ town ^ ~~~   Isle |>  |
|         [] [] [] thermo          |
|                                  |
|     [sunny] [cloudy] [rainy]     |
|  pet  [snowy] [can't tell] [Check]
+----------------------------------+
```

At level 1 (no *Can't tell yet*) the four cards and Check share one row in both orientations.

## Accounting, help and finishing

- **Free, never a miss:** opening a flap, tapping a missing flap, the rule card, selecting or changing a card, a `not-yet` Check (the pet says "It could be. Could it be something else too? Open another clue." and bobs the closed flaps). Pressing Check again with nothing changed repeats the line and counts nothing.
- **A miss** is a Check that claims what the open clues rule out (`ruled-out`: "The wind is from Hill Isle, and Hill Isle has rain, so it can't be sunny.") or more than they hold (`overclaim`: "It could be cloudy, but it could be sunny or rainy too. These clues can't tell." for a weather; "Look again: these clues do tell." for *Can't tell yet*). Each is a gentle `boing`; the selection stays.
- **Two misses** in a round cross out every answer card the open clues rule out and glow the right card (or *Can't tell yet*), and if a closed clue would still help, bob that flap; the shell counts **one hint**, once per round.
- **Show a hint** opens `usefulClue` if there is one (the pet says why it helps: "The wind tells us which island's sky is coming"); when no closed clue helps, it crosses out the ruled-out cards instead. Each requested hint counts **1 hint**. The idle cue repeats the instruction and counts nothing.
- **Assisted ending:** hints always lead to a right Check: opening the useful clues in turn reaches `decided` or, at level 2, every available clue, and the glow then marks the answer. Finishing with help earns the ordinary one sticker.
- **Finishing:** after the reveal, `ctx.finish({ misses, hints })`, once (`finished` guards a second Check).
- **Adaptation:** a smooth round shows she reasoned inside the valley's rule; it is not evidence that she can forecast real weather, and the how-to card says so.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the pet repeats them); everything else uses `ctx.say`. Under S1 the building session checks each line against the sources below and records the check in its verification entry; any line it cannot support is cut or reworded before merge.

- `forecast.instruct.1`: "What will the sky bring tomorrow? Open the clues, then pick the weather."
- `forecast.instruct.2`: "One clue didn't come. Pick the weather, or Can't tell yet if the clues can't decide."
- `forecast.rules`: "In our pretend valley, tomorrow's sky comes on the wind from the island it blows from. And if it's freezing, rain comes down as snow."
- Clue lines: `forecast.wind` "The wind is blowing from {island}."; `forecast.postcard` "{island} has {sun | clouds | rain} today."; `forecast.freezing` "It's freezing."; `forecast.warm` "It's warm."; `forecast.missing` "This postcard didn't come."
- `forecast.notyet`: "It could be. Could it be something else too? Open another clue."
- `forecast.notyet.cant`: "Open the other clues first. One of them might tell."
- `forecast.ruledout` with forms by clue: "The wind is from {island}, and {island} has {sky}, so it can't be {weather}." / "It's warm, so it can't snow." / "It's freezing, so rain would come as snow, not rain."
- `forecast.overclaim`: "It could be {weather}, but it could be {others} too. These clues can't tell." `forecast.overclaim.cant`: "Look again: these clues do tell."
- `forecast.hint`: "The {clue} could help." with a reason form per clue ("The wind tells us which island's sky is coming." / "That island's postcard shows what's coming." / "The thermometer tells us if rain would be snow.").
- `forecast.right`: "Yes! Only {weather} fits every clue." `forecast.right.cant`: "Yes! It could be {list}. Saying the clues can't tell is good detective work."
- `forecast.reveal`: "Here comes tomorrow!" then `forecast.reveal.cant` (level 2 can't-tell rounds): "It was {weather} this time. With that clue missing, it could have been something else."
- `forecast.real` (once per session, after the first reveal): "Real weather is trickier. Forecasters use lots of measurements and computer models, and forecasts are still sometimes wrong."

None of these says weather always comes from the west, that one clue guarantees real weather, any chance or percentage, anything about storms, floods or safety, or that a real thermometer reading just above freezing rules out snow. The grown-ups' card carries the model's limits.

**Sources for the build's check** (opened 2026-10-31; open them again in the building session): NOAA JetStream [Air masses](https://www.noaa.gov/jetstream/synoptic/air-masses) (air masses move and carry and change their properties; their motion follows the upper-air flow; the page gives no prevailing compass direction, so the valley's wind rule stays a disclosed pretend rule); NSIDC [the science of snow](https://nsidc.org/learn/parts-cryosphere/snow/science-snow) (snow forms at or below freezing, can reach the ground slightly above freezing, and generally will not form at 5 °C or more, hence the two readings); NOAA JetStream [Weather models](https://www.noaa.gov/jetstream/upper-air-charts/weather-models) (models take radiosonde, satellite, surface and other observations; generally accurate out to about four days, with growing differences beyond); the study's NOAA [weather and climate explainer](https://www.noaa.gov/explainers/what-s-difference-between-climate-and-weather); NGSS [MS-ESS2-5](https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems) and [3-ESS2-1](https://www.nextgenscience.org/pe/3-ess2-1-earths-systems) for the anchors. Tried and not used: the SciJinks forecast-reliability page (host did not resolve), an NWS forecast-uncertainty PDF and the JetStream fronts and forecast-uncertainty URLs (404).

## Rule tests (`logic.test.ts`)

1. **Tomorrow:** `tomorrow` over all 36 worlds: the upwind sky, rain plus freezing gives snowy, nothing else gives snowy, and the downwind sky never changes the result.
2. **Possible sets:** the two authored tables above, row for row; `possible` always contains the truth's `tomorrow`; opening a clue never adds a weather (monotone); opening every clue of a level-1 case decides it (all 36).
3. **No likelihoods:** `possible` returns a set only (type-level and a shape check); no API in `logic.ts` returns a number per weather.
4. **Check results:** for every world, every subset of open clues and every answer, the result follows the four rules in [The model](#the-model-logicts); a `right` result exists in every state that has all available clues open; `ruledOutBy` names an open clue whose presence removes that weather.
5. **Can't tell:** at level 2, *Can't tell yet* is `right` exactly when every available clue is open and `canTell` is false; over 300 seeds level 2 produces both kinds and never two can't-tell rounds in a row.
6. **Hints lead somewhere:** following `usefulClue` from any state reaches either `decided` or all available clues open, in at most three hints; the clue it picks strictly shrinks the set whenever any closed clue would.
7. **Accounting:** `not-yet` never counts; `ruled-out` and `overclaim` count one miss each; repeating a Check with nothing changed counts nothing; two misses give exactly one glow hint per round; misses never block a right Check.
8. **Seeded rounds:** the first round of each level is the authored case; level-1 cases always have differing postcards and include a rain-upwind case at least one round in three over 300 seeds; the same seed gives the same round.
9. **Layout:** `forecastLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the case from the scene and plays like a detective: opens the wind vane, then the upwind postcard, then the thermometer only if the upwind sky is rain; at level 2 it opens each available clue in that order and then any remaining available one; it selects the only possible weather, or *Can't tell yet* when more than one is possible with every available clue open, and presses Check. `fingerdemo` at levels 1 and 2 (the authored level-2 case ends on *Can't tell yet*) proves both finishes.
- **How-to card** (`src/content/howto.ts`). Goal: "Work out tomorrow's weather from clues, or say when the clues can't tell."
  - Steps: "Tap a flap to see a clue: the wind vane, a postcard from each island, the thermometer" (all levels); "Tomorrow's sky comes on the wind from one island; freezing turns rain to snow" (all levels); "Pick a weather and press Check" `{ from: 1, to: 1 }`; "One clue didn't come: pick a weather if the others still decide, or Can't tell yet if they don't" `{ from: 2, to: 2 }`.
  - Finish: "A right Check shows tomorrow's sky arriving" (all levels).
  - Notes: "Opening clues is never wrong, and not every clue is needed" (all levels); "Picking a weather the clues rule out, or one when the clues can't decide, is a miss; two misses cross out the impossible ones, which counts as help" (all levels); "About 10 and up" `{ from: 2, to: 2 }`; "A pretend valley with one simple rule. Real forecasts use many measurements and are still sometimes wrong; this game never claims one clue tells real weather" (all levels); "Rounds without hints move her up, which means she reasoned with the valley's rule, not that she can forecast real weather" (all levels).
- **Registration (default under S8):** ID `forecast-detective`, name "Forecast Detective", spoken title `game.forecast-detective` ("Forecast detective"). Region (subject) `tinker-lab`. Skills `['weather', 'evidence', 'deduction', 'uncertainty']` (free strings). Bands (`BandLevels`): school 1–2 only. No pre-K (the study's audience starts at S) and no grown-up range yet (S2: a harder Lantern Lake case would be its own grown-up definition). Home land **Tinker Lab**, the science land (20 games today, 21 if Drop's Journey lands first; it pages at `LAND_SPOTS` rather than shrink), fallback **Cozy Village** beside Weather Wardrobe and Day by Day; `lands.test.ts` decides. Hub icon: a magnifying glass over a small cloud with a wind streak. Sticker (page `meadow`): the harbour town under a seeded weather with the vane.
- **Art:** code-drawn in `src/games/forecast-detective/art.ts` with `src/art/palette.ts`: islands, town, vane, thermometer, postcards, flaps, answer cards, the night-and-morning reveal. Weathers differ by shape (sun disc, cloud puffs, rain lines, six-point flakes) as well as colour. No imported art or audio.
- **Co-play:** one person is the reporter (opens the flaps and says each clue), the other is the forecaster (says which weathers are left, then picks); swap next round. Solo, the pet reads the clues. **Off-screen** (spoken tip): "Look out of the window together: which way are the trees bending, and what are the clouds doing? Guess tomorrow's sky, and see tomorrow." Looking only; no daily task, record or safety advice.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The friend asking could later be one of her creatures, as the [rework brief](../rework/README.md) decides.

## Check tier

One same-game batch: levels 1–2 share the model, scene, flaps and cards. New-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 with one `not-yet` Check, one `ruled-out` Check, a second miss for the glow and its hint, then the right card to the sticker, and level 2's authored case with an overclaimed weather, then *Can't tell yet*; one portrait screenshot at level 2 with the missing flap and five cards; `fingerdemo` at levels 1 and 2; `npm run build`, because the registry, lands, voice and how-to files change. The building session's source check of every line in [Speech](#speech-voice-scriptts) goes in its verification entry. If the allowance cannot cover both, stop after a complete level 1 with a draft-PR checkpoint.

Person and device checks stay open: whether a school-age child opens clues on purpose or all of them every time; whether *Can't tell yet* feels like a win or a dodge; whether iPad speech says "Lighthouse Isle" clearly; and the study's tween and parent appeal of the case. Browser automation establishes none of these.

## What comes next

Later levels, each needing its own definition: **fewest clues** (a friend can only send two flaps; choose which to open, with any deciding pair accepted), **a third island** (the wind can blow from three directions, so two postcards may be missing and still decide), and a **grown-up Lantern Lake case** with three rules and several days, at the 64-unit minimum. Any step toward real forecast language (fronts, pressure, chances of rain) needs its own sourced definition and must still avoid numbers without a reviewed model. Substance Mystery (the Lantern Lake deduction in the study packets) waited on this first case and can now be considered for its own definition.

## Open decisions

Each has a default the build uses; none waits on the developer (S1, S8).

1. **Register Forecast Detective as a new game,** school 1–2, home Tinker Lab, fallback Cozy Village. Alternative: a Day by Day mode; not chosen, because Day by Day is about records of days that happened and this is reasoning about one that hasn't.
2. **The overclaim miss.** Default: picking one still-possible weather when every available clue is open counts a miss, because recognising that the evidence cannot decide is the level's lesson. Alternative: make it a free `not-yet`; then level 2 could be finished by guessing until the glow, which removes the point.
3. **Snow in the model.** Default: kept, with only two thermometer readings drawn well apart. Alternative: drop the thermometer and snowy for a three-clue case; not chosen, because the thermometer is the clue that matters only sometimes, which is the useful-evidence lesson.
