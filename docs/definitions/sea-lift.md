# Sea Lift, levels 1–3 (definition)

Defined 2026-10-22 as slice IN1 of the [integers study](../deep-dives/subjects/integers.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/integers.md#a-first-games-ladder-sea-lift) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#integers-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build (the study's slice 2, "Build Sea Lift 1–3") on the defaults below.** No reviewer gates levels 1–3: they use only "above the water" and "below the water", no number cards, no expression and no equals sign. The mathematics educator ([study decision 8](../deep-dives/subjects/integers.md#decisions-for-the-developer)) gates the level-4 card distractors and levels 6–7, which this packet does not define.

**Fun action and purpose:** a tall glass lift runs up and down a pier, from a cliff ledge in the sky to the sea floor, and the island's own sea crosses the shaft halfway. Friends wait at stops above and below the water, or ride in the lift and ask to go somewhere. She taps a landing; the lift glides there stop by stop with a tick at each one and a splash as it passes the water, and the friend gets on or off. The learning purpose is **numbers below zero with a meaningful zero**: the water line is 0, stops are counted from it in both directions (level 1), a ride can pass through it (level 2, England Year 4–5: "count backwards through 0"), and lower is less even when the number looks bigger (level 3, CCSS 6.NS.C.7.a–b: the documented mistake that −5 is above −2). Order is drawn as **height**, to scale, so a wrong answer is visibly wrong rather than wrong by a rule.

## Identity and overlap

- **Frog Hop** (Counting Cove) owns whole-number arithmetic on a horizontal line. Its dive's G3 *Below zero* is a sketch, not a build; this packet does not touch Frog Hop, and whether G3 retires is [decision 1](#open-decisions).
- **Weather Wardrobe** keeps its picture thermometer; nothing here puts a number below zero on a thermometer (study decision 3).
- **Sink or Float** and **Opposites** own above and below the water as words and consequences, with no numbers.
- **Treasure Map** keeps the first quadrant; no coordinates here.
- Stops are **stops above and below the water**, never floors of a building (the ground-floor convention differs between families), and every height is fictional: no metres, feet or real sea zones (`oceans` owns those).

## The model (`logic.ts`)

- **Stops** are the integers −5 to +5. Stop 0 is the **dock** at the water line, a real landing. A stop's spoken name is "the water" (0), "N above the water" or "N below the water", with N a spelled number word; its numeral shows `+`-less for above (`3`), `−3` for below, and `0` at the dock.
- **A ride** is `{ friend, from, to }`; its **path** is every stop from `from` to `to` in order, and `crossesZero(ride)` is true when `from` and `to` have opposite signs.
- **Level 1 request:** the lift waits at 0; a friend at the dock asks for `n` stops up or down, `n` 1–5. Answer: stop `±n`. A round is five requests, drawn so that both directions occur at least twice and no two consecutive requests ask for the same stop.
- **Level 2 request:** the lift starts at a friend's stop `s` with `1 ≤ |s| ≤ 4`, and the friend asks for `d` stops the other way with `|d| > |s|` and `s + d` within −5..5 and not 0, so every ride passes through the water and ends on the other side. A round is five rides, at least two starting above the water and at least two below. Answer: stop `s + d`. The request names only the count and the direction ("five down, please"), never the end stop.
- **Level 3 case:** three friends at three different stops, at least two below the water, with at least one below-the-water pair whose larger magnitude is the **lower** stop (always true for two negatives; the test states it so the case can never be all-above). The mode is `deepest` (lowest first) or `highest` (highest first). A round is three cases: at least one of each mode, and at least one case with a friend above the water.
- **Check** `check(state, stop)` returns `right`, `wrong` (with the right stop and, for level 3, the friend who should come first), or `ignore` for an empty landing at level 3 or a stop already visited this case.
- **Hint** `hintFor(state)` returns the right landing.
- **Cases** are seeded from `ctx.rng` within these rules; the first round of each level is authored (below) so the how-to card and demonstration open on the same story.

## Screen and controls

- **The shaft** stands right of centre, a vertical glass tube on a pier. Stops are drawn **to scale**: one even pitch `p` from +5 at the top to −5 at the bottom, the water line across the shaft at 0, sky above, sea below (darkening a little with depth, with a seabed under −5).
- **Landings zig-zag.** Eleven stops at 100-unit pitch do not fit a 768-unit landscape height, so the pitch stays small and the **landings alternate sides**: even stops (0, ±2, ±4) on the left of the shaft, odd stops (±1, ±3, ±5) on the right. Each landing is a ledge, rock or dock at least 110×110 logical units with its numeral; stops below the water also carry a bubble mark, so the minus sign is never the only cue. Landings on one side are `2p` apart. In landscape `p` is about 60 (shaft span 600), so same-side landings are 120 apart and never overlap; in portrait `p` grows to fill the height (capped at 90). Taps resolve to the **nearest landing** (AGENTS' rule for close targets), so the zig-zag never lets a touch land on the wrong stop. `shaftLayout(view)` returns the pitch, every landing's rectangle and the lift's car rectangle; a test runs it at the four views the lands test uses and asserts every landing at least 100 units each way, no overlap between landings, the home button and the guide's bottom-left corner clear, everything inside `view`, and an even pitch (the scale is the point). If a view cannot give `p ≥ 56` the layout returns null rather than shrink, and the test fails.
- **The lift car** is a small glass box that moves along the shaft; a friend inside is visible through the glass. It is not a target.
- **Friends** stand on their landings (levels 1 and 3) or ride in the car (level 2). Above the water: the duck, cat, bunny and pig from `CRITTERS`; below: fish in several colours, the turtle and the penguin (`src/art/animals.ts`). A friend's request is a speech bubble beside the car with an up or down arrow and one dot per stop, so the count can be seen as well as heard. Tapping a friend replays their line, free.
- **A tap on a landing:** touch-down squashes the landing at once. The car glides through every stop on the path (about 0.25 s a stop), a soft pentatonic `marimba` tick at each, rising going up and falling going down, and a `splash` as it passes 0. The friend then gets on or off and says where they are ("Three below the water. Bubbly!"). Taps during a ride are ignored. Nothing is timed.
- **Pause sheet:** Start again (the same seeded round from its first request, keeping misses and hints) and Show a hint (`Scene.pauseActions`).
- **Music:** Bubble Beach's style keeps playing underneath (she is not making music); the ticks are pentatonic steps from `src/audio/notes.ts`.

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Up or down?** | school | Which stop is `n` from the water, and which way | Five requests |
| 2 | **Through the water** | school | Where a ride that crosses the water ends | Five rides |
| 3 | **Deepest first** | school | The order of three friends' heights across the water | Three pick-up cases |

### First rounds

- **Level 1 (authored):** the car waits at the dock with the duck beside it. Duck: "Take me three above the water!" (arrow up, three dots). She taps the landing marked 3: the car ticks up three stops, Duck hops off. Then a fish at the dock: "Two below the water, please!" She taps −1: the car ticks down one stop and splashes; boing, and the fish counts from the water, "One below. I need two below!" (one miss). She taps −2. Then four up, five below and one below, ending with the sticker.
- **Level 2 (authored):** the bunny rides from 2. "Five down, please!" (arrow down, five dots). She taps −3: two ticks, a splash, three more; the bunny swims off to a rock. Then a turtle rides from −1: "Four up!" She taps 3. Three more rides follow, at least one more starting below.
- **Level 3 (authored):** the fish waits at −5, the penguin at −2 and the cat at 3. "Pick up the deepest friend first!" She taps −2: the car goes to −2, and the fish below it waves, "I'm deeper, down here!" (one miss; the penguin stays put). She taps −5, then −2, then 3, and the three ride up together. Then a "highest first" case, then one more.

## Accounting, help and finishing

- **A miss** is a tap on a landing that is not the answer, counted once per wrong stop per request. At levels 1–2 the car rides there (the ride is the explanation), the friend counts the stops from the water or along the ride aloud ("one, two, the water, three below: I wanted five down") and the car returns to where it started. At level 3 the car rides to the wrong friend, who stays put, and the friend who should come first says where they are, visibly **below** (deepest) or **above** (highest) the car.
- **Never a miss:** tapping a friend, the car, the water, the sky or the sea; tapping an empty landing at level 3; tapping a stop already visited this case; taps during a ride; replays.
- **After two misses on one request** the right landing glows and `hints++`, at most once per request. Show a hint in the pause sheet does the same, still at most once per request.
- **Supported finish:** a third miss on a request after its glow sends the car to the right stop by itself, counting aloud, with no further count, so every round can finish.
- **Finish:** after the last request or case, the friends wave from their stops and `ctx.finish({ misses, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept or filed ([decision 5](#open-decisions)).
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A smooth round shows she found the stops in this toy; it says nothing yet about temperature, money or written negatives.

## Speech (`voice-script.ts`)

Lines under `sealift.*`, every number spelled out and never a bare sign: `intro`, `instruct.updown`, `instruct.through`, `instruct.deepest`, `instruct.highest`, `ask.up` and `ask.down` (with `{n}`: "Take me {n} above the water!", "{n} below the water, please!"), `ride.up` and `ride.down` (level 2, with `{n}`: "{n} up, please!"), `at` (with `{where}`: "three below the water", "the water"), `count` (the stop-by-stop count, built from `{n}` words and "the water"), `miss.updown`, `miss.through`, `miss.deeper`, `miss.higher`, `hint`, `done`. The spoken name of a stop below zero is **"N below the water"** at all three levels ([decision 3](#open-decisions)); "minus" and "negative" do not appear. Friend names reuse existing animal words.

## Rule tests (`logic.test.ts`)

- **Stops:** every requested or ending stop is within −5..5; every stop's spoken name and numeral agree (0 is "the water", negatives say "below").
- **Level 1, over 500 seeds:** answers are ±1..±5; both directions occur at least twice per round; no two consecutive requests share a stop.
- **Level 2, over 500 seeds:** every ride crosses zero and ends off 0 and in range; at least two rides start above and two below; the answer is `from + d`; the request carries only the count and direction.
- **Level 3, over 500 seeds:** three distinct stops, at least two below the water; at least one below-the-water pair orders by magnitude opposite to height; both modes and a friend above the water occur across each round; `check` accepts exactly the next friend in the mode's order.
- **Authored first rounds** match the stories above.
- **Hints:** `hintFor` is the right landing in every state; a scripted level-1 request (wrong, the same wrong again, another wrong, Show a hint twice, a third wrong) counts one miss per distinct wrong stop, one hint, and ends with the supported finish.
- **Layout:** `shaftLayout` at the four views: landings at least 100 units, no overlap, even pitch of at least 56, home and guide corners clear, everything inside `view`; nearest-landing resolution maps every landing's centre to its own stop.
- **Registry, lands and how-to tests** pass with the new game, including Bubble Beach on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` taps the solver's landing for each request (`hintFor`), and at level 3 the friends in order. Level 1's demonstration also taps the duck once to show the free replay.
- **How-to card** (`src/content/howto.ts`). Goal: "Run the sea lift: take friends to their stops above and below the water."
  - Steps: "A friend asks to go some stops above or below the water; tap that stop" `{ from: 1, to: 1 }`; "A friend in the lift asks to go some stops up or down; the ride goes through the water, so tap where it ends" `{ from: 2, to: 2 }`; "Pick up the friends in order, deepest or highest first, as asked" `{ from: 3, to: 3 }`; "Tap a friend to hear them again" (all levels).
  - Finish: "Every friend is where they wanted to be."
  - Notes: "The water line is zero; stops below it are numbers below zero, said as 'below the water'" (all levels); "A wrong stop is one miss: the lift goes there and the friend counts it out; after two misses the right stop glows, which counts as a hint" (all levels); "Hearing a friend again or watching a ride never counts" (all levels).
- **Registration:** ID `sea-lift`, name "Sea Lift", spoken title `game.sea-lift` ("Sea lift"). Region (subject) `counting-cove`, the numbers subject. Skills `['negative-numbers', 'number-line', 'counting-back', 'ordering']`. Bands: school 1–3 only ([decision 2](#open-decisions)). Home land **Bubble Beach** ([decision 4](#open-decisions)). Hub icon: a glass lift on a pier with the water line across it. Sticker (page `sea`): a seeded friend in the glass car, above or below the water line.
- **Art:** code-drawn in `src/games/sea-lift/art.ts` with `src/art/palette.ts`: the pier and shaft, the car, ledges, rocks and the dock, bubble marks, the seabed. Friends from `CRITTERS` and `src/art/animals.ts`. No imported art or audio.
- **Co-play:** caller and driver: the grown-up calls a ride ("four below the water!") and she drives; then swap. **Off-screen** (spoken tip): "Tape a line on the floor with a zero in the middle, and take turns calling 'two below' and hopping there."
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. The stop friends could later be her creatures and file journal meetings; the [rework brief](../rework/README.md) decides that.

## Check tier

Sea Lift 1–3 is the new-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 (one wrong stop, one hint) and level 3 (a deepest-first case with the −2-before-−5 miss); one portrait screenshot at level 2 showing the zig-zag landings and the car mid-shaft; `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: how the iPad's speech says the lines ("below the water" should never be read as a sign); whether a six-year-old reads the zig-zag landings as one line of stops; whether the splash at zero is noticed; whether a grown-up takes the caller's part. Browser automation establishes none of these.

## What comes next

**Sea Lift 4–5 (IN2 in the recommendation row; define and build after this lands):** *How far?* (number cards for the interval across zero, with the difference-of-magnitudes card as a distractor, after the educator's read of the distractors) and *Twin stops* (opposites; the dock is its own twin). **Levels 6–7** wait on study decisions 2 and 8. **Lift Rounds** waits on the Lantern Lake capacity test.

## Open decisions

Each has a default the build uses; none blocks the build.

1. **New game or Frog Hop's G3.** Default: a new game, as the study leans; Frog Hop's G3 sketch stays unbuilt until the developer says whether it retires.
2. **Bands.** Default school 1–3. A pre-K window at level 1 waits on a person watching a five-year-old with a grown-up (study decision 4).
3. **Words for below zero.** Default "N below the water" at levels 1–3 (study decision 6); the mathematical word joins no earlier than level 4.
4. **Home land.** Default **Bubble Beach** (9 games today; 10 if [Sand Table](sand-table.md) lands there first on its default, so 10 or 11 with this one; Counting Cove already lays out 12). `lands.test.ts` decides. Fallback: Counting Cove (12 today, 13).
5. **Journal.** Default: nothing filed. Alternative: a page for the deep friends she met, after the rework decides how stop friends relate to the collection.
6. **Zig-zag landings.** Default: alternate sides at an even small pitch, so all eleven stops are on one screen. Alternative: one column at 100-unit pitch with the shaft scrolling to follow the car, which keeps a single straight column but hides stops; the study's "scrolling a little in portrait" is replaced by the zig-zag because it never hides a stop.
