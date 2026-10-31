# Drift Cards, levels 1–3 (definition)

Defined 2026-10-31 as slice 6 of the [oceans study](../deep-dives/subjects/oceans.md#build-slices-in-order), from its [candidate row](../deep-dives/subjects/oceans.md#candidates-and-recommended-order) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#oceans-recommendations), after [Drop's Journey](drops-journey.md) was defined. Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build** as two same-game batches: `drift-cards 1` (levels 1–2, new-game tier) and `drift-cards 2` (level 3, new-interaction tier, after batch 1). Registration, bands and land take the defaults below under standing rule S8, and the explanation lines take the building session's source check under S1 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)); neither waits on the developer. It depends on no other unbuilt game; Tide Line's shore art is not needed.

**Fun action and purpose:** a boat at the harbour wall drops a little numbered wooden card into a sea painted with current arrows. The card rides the arrows, cell by cell, until it washes up on a beach where a friend finds it and waves it back. She first predicts where a card will land, then chooses where to drop one so it reaches a friend, then does what real drift-card studies do: works out an unknown patch of the sea from where returned cards were found. The learning purpose is **moving water carries floating things along set paths that can be read from a map, and where things wash up is evidence about the currents** (NOAA Ocean Literacy concept 1c, one circulation system driven by wind and other forces; NGSS MS-ESS2-6, models of ocean circulation, as the far horizon; 4-ESS2-2, reading patterns from maps). The arrows are a **disclosed pretend sea**: real currents shift with wind, tides and seasons, and the game never claims a fixed map of a real ocean.

**Why cards, not bottles.** The study's row said "a bottle". A bottle thrown into the sea reads as litter, which the study's tone decision 5 keeps off the child's island. Real drift-card studies use small biodegradable wooden cards that finders report (opened: [NatureBridge's 2015 Elwha drift-card study](https://naturebridge.org/blog/2016-01-01-olympics-2015-drift-card-study), "4x6 inch piece of orange plywood", nearly 1,000 released and about 100 reported). The game's card is that: wooden, numbered, and always found. The 1992 toy-spill story and its disputed counts are **not used** anywhere in the game or the grown-up card.

## Identity and overlap

Rechecked 2026-10-31 against the catalog and the open proposals:

- **Penguin Slide** (Puzzle Peaks) and **Ferry Jam**: she chooses each move and the ice or the boats stop it. Here she moves nothing; the sea decides every step, and her decisions are *where it will end* and *where to start*. The study's identity test ("more than move the water") is met by prediction and the inverse choice.
- **Robot Path**: she writes a program of arrows. Here the arrows are already in the sea and she reads them; she never edits a current at levels 1–2.
- **Treasure Map** reads coordinates and directions on a grid; it has no field that carries something. **Sea Lift** owns sea level as integers.
- **Drop's Journey** ([definition](drops-journey.md), queued) moves water between places in the water cycle by its drivers; it has no map of currents. Drift Cards reuses no part of its graph, as that definition asked; the two can share a sea colour from `src/art/palette.ts` only.
- **Forecast Detective** ([definition](forecast-detective.md), queued) and **Rule Machine** levels 3–4 ([definition](rule-machine.md), queued) choose a model from evidence. Level 3 here is the same reasoning kind but a **spatial inverse problem** (which arrows fill a fogged patch so that every returned card ends where it was found), grounded in how real drift-card data are used. It has **no *Can't tell yet* answer**: that stays Forecast Detective's, and every level-3 case here is decided by its returns.
- **Tide Line** ([definition](tide-line.md), queued) owns the sea coming in and going out; nothing here moves the waterline.

## The model (`logic.ts`)

- **The sea** is a grid of `cols × rows` cells, row 0 at the top under the harbour wall. Each cell holds one current, `Dir = 'e' | 's' | 'w'` (east, south, west). **No current points north**, toward the wall: the sea flows away from the harbour. Two neighbours never face each other (`e` immediately left of `w`). These two rules make every drift finite; a test checks it on every generated sea.
- **Beaches** surround the other three sides. Level 1 has three: **West** (leaving any cell westward), **South** (leaving the bottom row) and **East**. Levels 2–3 have four: West, **South-west** (leaving the bottom row from the left half of the columns), **South-east** (the right half) and East. Each beach has one friend (the turtle, frog, penguin and duck from `src/art/animals.ts` and the critter drawing; no new cast needed).
- **Boats** sit on the harbour wall above chosen columns; a card dropped from a boat enters row 0 of that column.
- `drift(sea, col)` returns `{ path: Cell[], beach }`: start at `(0, col)`, step one cell along the current until a step leaves the grid; the side it leaves by names the beach. Every path in every sea is at most **10 cells** (the generator rejects longer), which also caps the drift at about 3.5 s.
- **No crossing.** Drifts from the wall can merge but never cross, so landings keep the boats' order around the coast (west, south, east). The game never asks for a landing that breaks this, and a rule test proves it on every seed. This is a real property of the model, not a puzzle trick; the how-to card does not mention it.
- `predict(sea, col, beach)` (level 1): right when `drift(sea, col).beach === beach`.
- `boatsFor(sea, boats, beach)` (level 2): the boats whose drift reaches `beach`. **Any of them is right**; alternatives are accepted.
- **A patch case** (level 3) is `{ sea, patch: Cell[] (a 2×2 block, never in row 0), options: Dir[4][3], answer: 0 | 1 | 2, returns: { col, beach }[] }`. Each return is a card dropped from boat `col` and found on `beach` in the true sea. `fits(case, option)` fills the patch with that option and checks every return lands where it was found. `contradictedBy(case, option)` names the first return (in boat order) that lands elsewhere, and where.
- **Guarantees per patch case:** every option keeps the two no-cycle rules; exactly one option `fits`; every wrong option is contradicted by at least one return; every return's true path passes through the patch; and **no single return decides** (each return alone leaves at least two options fitting), so she must use all of them.
- `nextStep(sea, cell)` (the hint): the current at that cell and the next cell, for the pet's traced line.

### The authored seas

Arrows are written row by row, top first (→ east, ↓ south, ← west). These are rule tests verbatim.

**Level 1** (5 × 4, boats over columns 0, 2 and 4; beaches West, South, East):

```
↓ ↓ ↓ ↓ ←
→ ↓ ↓ → →
↓ ↓ → → ↓
← ← ← ← ↓
```

| Card | Boat | Path (row, column) | Washes up |
| --- | --- | --- | --- |
| 1 | column 0 | (0,0) (1,0) (1,1) (2,1) (3,1) (3,0) | West |
| 2 | column 2 | (0,2) (1,2) (2,2) (2,3) (2,4) (3,4) | South |
| 3 | column 4 | (0,4) (0,3) (1,3) (1,4) | East |

Card 2 starts straight down and turns east, and card 3 first drifts west, so following the arrows matters; card 1 doubles back west along the bottom.

**Level 2, first request** (6 × 4, boats over columns 1, 3 and 5; South-west is columns 0–2, South-east 3–5): "Send a card to the frog on the South-west beach."

```
← ↓ ← ← ↓ ↓
↓ ↓ → → ↓ ↓
↓ → ↓ ← ← →
↓ ↓ ← ↓ ← →
```

| Boat | Path | Washes up | For the frog |
| --- | --- | --- | --- |
| column 1 | (0,1) (1,1) (2,1) (2,2) (3,2) (3,1) | South-west | right |
| column 3 | (0,3) (0,2) (0,1) (1,1) (2,1) (2,2) (3,2) (3,1) | South-west (joins boat 1's path) | right |
| column 5 | (0,5) (1,5) (2,5) | East | a miss |

**Level 3 authored case** (6 × 4; the fogged patch is rows 1–2, columns 2–3; returns: card 1 from column 1 found South-west, card 2 from column 4 found South-east). The true sea:

```
→ ↓ → → ↓ ↓
← ↓ → ↓ ← ←
→ → ↓ → ↓ ↓
↓ ↓ ↓ → ↓ →
```

| Option (patch cells (1,2) (1,3) / (2,2) (2,3)) | Card 1 (column 1) | Card 2 (column 4) | Result |
| --- | --- | --- | --- |
| A: → ↓ / ↓ → | South-west ✓ | South-east ✓ | **fits** (the answer) |
| B: → ↓ / → → | South-east ✗ (via (2,2) (2,3) (2,4) (3,4)) | South-east ✓ | contradicted by card 1 |
| C: → ↓ / ↓ ← | South-west ✓ | South-west ✗ (via (1,3) (2,3) (2,2) (3,2)) | contradicted by card 2 |

Each wrong option differs from the answer in one cell, and each is ruled out by a different card, so neither card alone decides. The options' order on screen is seeded.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Where will it wash up?** | school | Which beach each of three cards will reach | The third card found |
| 2 | **Send it to a friend** | school | Which boat to drop from so the card reaches the asked friend | The third friend's card found |
| 3 | **Find the hidden current** | school | Which of three patches fills the fog so every returned card lands where it was found | A right Check and the replay |

Level 3's how-to note says "about 9 and up" (the study's U audience); nothing gates it.

### Rounds

- **Level 1:** one sea, three cards from three boats in order (left, middle, right). The first round is the authored sea. Later seas are seeded from `ctx.rng` (5 × 4): the three landings cover at least two beaches, every path has at least three cells, and at least one path has two or more sideways steps.
- **Level 2:** three requests, each on its own sea (the first is the authored one). Seeded seas are 6 × 4 with boats over columns 1, 3 and 5; the asked friend is reached by at least one boat and missed by at least one; across a round, at least one request has two right boats.
- **Level 3:** one patch case. The first is authored; seeded cases are 6 × 4 with a 2×2 patch in rows 1–2 (any columns), two returns at first and three when a seeded sea allows, under the guarantees above. Seeds that cannot meet them are rejected (a test checks that 300 seeds each yield a case within a bounded number of tries).

## Screen and controls

- **The scene:** a calm sea framed by the harbour wall along the top, the beaches as sand strips on the other three sides (a friend waving on each), and a soft shimmer that runs along each arrow so the currents look like moving water. Cells are **display, not targets**: at least 72 logical units so an arrow (a broad chevron) reads clearly; the layout returns null rather than draw them smaller.
- **Boats** sit on the wall above their columns (each target at least 110 × 110; boats are never over neighbouring columns, so targets never overlap). **Beach plates** (levels 1 and 3's readout) are the sand strips, each at least 110 units deep and as long as its edge (South-west and South-east split the bottom).
- **Tracing is free and always available:** she can touch any cell and a dotted line follows the current **two cells ahead** from it, fading after two seconds; it counts nothing. Two cells help her keep her place without answering for her (a full trace from a boat's cell would answer level 1 for free); the whole drift is the counted hint. The build may lengthen the free trace only if the scripted play shows two cells are unreadable (decision 3).
- **Level 1:** the next boat bobs with a card held up; she taps a beach plate to predict (touch-down lifts the plate, the friend looks up). The card drops and drifts (about 0.35 s a cell, a soft pentatonic step per cell from `src/audio/notes.ts`), the friend on the landing beach picks it up and waves it, and the pet says where it landed.
- **Level 2:** the friend asking holds up an empty hand and the pet speaks the request; she taps a boat, and that tap drops the card at once (touch-down lifts the boat). The card drifts and whoever finds it waves.
- **Level 3:** the fog sits over the patch; three **patch cards** (at least 160 × 160, each showing its four arrows large) wait beside the sea (right in landscape, below in portrait). Each return shows as a numbered boat flag on the wall and the same number on a card in the finder's hand on its beach. Tapping a patch card lays its arrows into the fog (free; the previous one lifts out). **Check** (a large green button, at least 130 × 130) is active once a patch is in. A right Check replays both returns' drifts through her patch, each landing in its finder's hand.
- **Sound:** a wooden plop for a drop, a soft water swish under the drift, pentatonic steps per cell, a gull-free chime when a friend finds a card, `boing` for a miss. No storm sounds. The island style keeps playing (default `STYLES.quiet`).
- **Pause sheet:** Start again (same sea, keeping misses and hints) and Show a hint (`Scene.pauseActions`).

`driftLayout(view, level)` returns every rectangle: the wall and boats, the grid and its cell size, the beach plates, the patch cards and Check. A test runs it at the four views the lands test uses and asserts every target at least 100 units each way and at its stated minimum, cells at least 72, no overlap between targets, the Home button and the guide's bottom-left corner clear, and everything inside `view`; it returns null rather than shrink.

### Layout sketches

**Landscape (1024 × 768), level 3:**

```
+--------------------------------------------------------------+
| [Home]         [boat 1]        [boat 4]                       |
|        ===================harbour wall===============         |
|  W  |  →  ↓  →  →  ↓  ↓  |  E      [patch A]                 |
|  e  |  ←  ↓ [fog ] ←  ←  |  a      [patch B]                 |
|  s  |  →  → [fog ] ↓  ↓  |  s      [patch C]                 |
|  t  |  ↓  ↓  ↓  →  ↓  →  |  t                                |
|  pet   [ South-west ][ South-east ]           [Check]         |
+--------------------------------------------------------------+
```

**Portrait (768 × 1024), level 3:** the same sea centred (6 × 80 = 480 wide plus two 110-unit side beaches), the bottom beaches under it, then the three patch cards in one row and Check at the right of that row, the pet's corner kept clear.

## Accounting, help and finishing

The repository rule is that experimental predictions are not wrong answers. Drift Cards follows [Rule Machine](rule-machine.md)'s split (from Chain Reaction 8 and Seesaw 15): a prediction made before she has seen this sea carry a card is free; a claim the visible arrows already decide is counted.

- **Free, never a miss:** tracing; the **first card of every level-1 round**, whichever beach she picks (the drift answers it, and the pet says "It went this way. Follow the arrows with it next time."); laying a patch card into the fog; pressing Check again with nothing changed (repeats the last line).
- **Counted:** a wrong beach for the second or third card of a level-1 round; a boat at level 2 whose drift misses the asked friend; a patch at level 3 that a return contradicts. Each is one miss and a gentle `boing`.
- **A counted wrong gets a retry, so help can reach her.** Level 1: the card does not drop; the pet traces the first two cells from the boat ("It goes down, then this way") and she picks again. Level 2: the card does drift (the drop was the choice) to whoever finds it, who waves it back to the boat; the request stays. Level 3: the contradicting return replays through her patch and lands beside its finder, who shakes their head ("Card 1 would wash up here, but the turtle found it there"); the patch stays in for her to change.
- **Two misses on the same card, request or case** glow the right beach, a right boat or the right patch card; the shell counts **one hint**, once per card, request or case.
- **Show a hint** counts **1 hint** each: level 1 traces the whole drift from the boat; level 2 glows one right boat; level 3 names the return that rules out the patch now in the fog (or, with none in, dims one wrong option and names its return).
- **Assisted ending:** every card, request and case reaches its finish through her tap after the glow; finishing with help earns the ordinary one sticker. Level 1 always has at least two counted predictions per round, so a smooth round is evidence she read the arrows.
- **Finishing:** after the last card is found (levels 1–2) or the replay (level 3), `ctx.finish({ misses, hints })`, once.
- **Adaptation:** a smooth round shows she followed and reversed the pretend sea's arrows; the how-to card says it is not evidence about real ocean currents.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct`; everything else uses `ctx.say`. Under S1 the building session checks each explanation line against the sources below and records the check in its verification entry; any line it cannot support is cut or reworded before merge.

- `drift.instruct.1`: "The arrows show which way the sea is moving. Where will the card wash up? Tap a beach."
- `drift.instruct.2`: "{friend} wants a card. Which boat should drop it?"
- `drift.instruct.3`: "Some of the sea is foggy. The cards came back from these beaches. Which arrows fit both?"
- `drift.landed`: "{friend} found it on the {beach} beach!" `drift.first`: "It went this way. Follow the arrows with it next time."
- `drift.wrong.1`: "Not there. Follow the arrows: it goes {dir}, then {dir}." `drift.wrong.2`: "That one reached {friend2}. Which boat's arrows lead to {friend}?" `drift.wrong.3`: "With these arrows, card {n} would wash up here, but {friend} found it there."
- `drift.hint.1` (with the traced line): "Follow it all the way." `drift.hint.2`: "Try this boat." `drift.hint.3`: "Card {n} can't land where it was found with this one."
- `drift.right.3`: "Yes! These arrows send every card to the beach where it was found."
- `drift.real` (once per session, after the first finish): "Scientists drop wooden drift cards into the sea and ask the people who find them to say where. That shows where the water went."
- `drift.limits` (once per session at level 3, after the replay): "Real currents change with the wind and the seasons, so scientists drop cards again and again."

None of these names a real ocean, a spill, rubbish, a danger, a return rate, or a claim that one map shows how the sea always moves. "Downhill", "pulled" and "pushed by the Moon" are not used.

**Sources for the build's check** (opened 2026-10-31; open them again in the building session): NOAA Ocean Service [What is a current?](https://oceanservice.noaa.gov/facts/current.html) ("Ocean currents are driven by wind, water density differences, and tides"; "Winds drive currents that are at or near the ocean's surface"); NOAA Ocean Exploration [What causes ocean currents?](https://oceanexplorer.noaa.gov/facts/currents.html) ("Surface currents in the ocean are driven by global wind systems"; paths also depend on Earth's rotation and landforms); [NatureBridge, Elwha drift-card study 2015](https://naturebridge.org/blog/2016-01-01-olympics-2015-drift-card-study) (plywood cards, finders report where; most cards found east of the river mouth "suggesting that there was a westerly flow"); the study's NOAA [Ocean Literacy principles](https://repository.library.noaa.gov/view/noaa/39086) (1c); NGSS MS-ESS2-6 and 4-ESS2-2 as read in the [oceans study](../deep-dives/subjects/oceans.md#anchors-opened-at-their-source). **Search summary only, not used in any line:** a Texas A&M Gulf of Mexico drift-card release (an open-ocean return rate of about 2 percent) and a NOAA Hawaii drift-card study noting that winds and currents shift with the seasons. **Tried and failed:** the Texas A&M AgriLife article (404) and the NOAA CoRIS Barber's Point record (500).

## Rule tests (`logic.test.ts`)

1. **Finite drifts:** over 300 seeds per level, every generated sea has no north current, no facing pair, and every cell (not only the boats') reaches a beach within 10 cells.
2. **Authored seas:** the three tables above, path for path and beach for beach.
3. **No crossing:** for every sea, landings of boats taken left to right never go backwards along West, South (or South-west, South-east), East.
4. **Level 1 rounds:** the first round is the authored sea; seeded rounds meet the [Rounds](#rounds) conditions; the same seed gives the same round.
5. **Level 2 requests:** every request has at least one right and one wrong boat; `boatsFor` accepts every right boat; across 300 seeds every round has a request with two right boats.
6. **Level 3 cases:** the authored table; over 300 seeds, every case has exactly one fitting option, every wrong option has a `contradictedBy` return, every return's true path enters the patch, no single return decides, and every option keeps the no-cycle rules.
7. **Accounting:** the first level-1 card never counts; later wrong beaches, wrong boats and contradicted patches count one each; repeated Checks count nothing; two misses give exactly one glow hint per card, request or case; misses never block the right answer.
8. **Hints lead somewhere:** the level-1 hint's traced line ends on the right beach; the level-2 glowed boat is in `boatsFor`; the level-3 hint names a return that really contradicts the patch in the fog.
9. **Layout:** `driftLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the sea from the scene. Level 1: it traces each card's drift with the finger, then taps the beach it ended on. Level 2: it traces from each boat in turn until one reaches the friend, then taps that boat. Level 3: it lays each patch card in turn, traces each return through it, and presses Check on the first that fits. `fingerdemo` runs at levels 2 (batch 1) and 3 (batch 2).
- **How-to card** (`src/content/howto.ts`). Goal: "Read the sea's current arrows to say where a floating card will wash up, and work back from where cards were found."
  - Steps: "The arrows show which way the water moves; a card follows them until it reaches a beach" (all levels); "Tap the beach where the card will wash up" `{ from: 1, to: 1 }`; "Tap the boat that should drop the card so it reaches the friend" `{ from: 2, to: 2 }`; "Lay a patch of arrows into the fog and press Check: it fits if every returned card would land where it was found" `{ from: 3, to: 3 }`.
  - Finish: "The round ends when every card has been found" (all levels).
  - Notes: "Tracing the arrows with a finger is always free" (all levels); "The first card of each round is a free guess; after that a wrong beach is a miss" `{ from: 1, to: 1 }`; "Any boat that reaches the friend is right" `{ from: 2, to: 2 }`; "About 9 and up" `{ from: 3, to: 3 }`; "A pretend sea whose currents stay still. Real currents change with wind, tides and seasons; scientists really do learn about them from drift cards that finders report" (all levels); "Rounds without hints move her up, which means she read the pretend sea, not that she knows real ocean currents" (all levels).
- **Registration (default under S8):** ID `drift-cards`, name "Drift Cards", spoken title `game.drift-cards` ("Drift cards"). Region (subject) `tinker-lab`, as Lost Layers. Skills `['ocean', 'currents', 'maps', 'evidence']` (free strings). Bands (`BandLevels`): school 1–3 only (the study's audience is U and up; no pre-K, no grown-up range yet). Home land **Bubble Beach** (12 games on `main` today; Tide Line is queued as its 13th, so Drift Cards would be its 13th or 14th; a full land pages at `LAND_SPOTS` rather than shrink), fallback **Tinker Lab**; `lands.test.ts` decides. Hub icon: a small wooden card with a number riding a curved arrow. Sticker (page `sea`): a friend on a beach holding up a numbered card.
- **Art:** code-drawn in `src/games/drift-cards/art.ts` with `src/art/palette.ts`: sea and arrow chevrons (shape and a slow shimmer, never colour alone), the wall and boats, sand strips, the wooden card, fog, patch cards. Friends reuse `src/art/animals.ts` and the critter drawing. No imported art or audio.
- **Co-play:** one person is the sea (traces the arrows aloud with a finger, "down, down, across"), the other predicts or picks the boat; swap each card. Solo, the pet traces when asked. **Off-screen** (spoken tip): "Draw a sea on paper with arrows in every square. Put a button at the top and take turns moving it along the arrows. Where does it wash up?" Paper only; no water play and no shore advice.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required. The finders could later be her creatures, as the [rework brief](../rework/README.md) decides.

## Check tier

- **Batch `drift-cards 1` (levels 1–2), new-game tier:** typecheck and unit tests (tests 1–5, 7–9 plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 with the free first card wrong, one counted wrong beach, a second miss for the glow, then the right beach, and level 2 with one wrong boat (the card reaching another friend) then a right boat; one portrait screenshot at level 2 mid-drift; `fingerdemo` at level 2; `npm run build`, because the registry, lands, voice and how-to files change. If the allowance cannot cover both levels, stop after a complete level 1 with a draft-PR checkpoint.
- **Batch `drift-cards 2` (level 3), new-interaction tier:** typecheck, rule tests 6–9, one filtered play of the authored case with option B (card 1 contradicted), option C (card 2 contradicted, the glow), then option A and the replay; one portrait screenshot with the fog and three patch cards; `fingerdemo` at level 3; a build for the card and voice.

The building session's S1 check of every line in [Speech](#speech-voice-scriptts) goes in its verification entry. Person and device checks stay open: whether a school-age child reads arrows cell by cell or guesses from the boat's nearest beach; whether the two-cell trace helps or frustrates; whether level 3 feels like detective work or trial and error; whether iPad speech says "South-west" clearly. Browser automation establishes none of these.

## What comes next

Later levels, each needing its own definition: **the wind changes** (two seasons' seas on one map; a card dropped in each lands differently, reading the study's seasonal note once it is opened at source), **an island in the sea** (a land cell that splits a current, with a second shore), **fewest cards** (choose which two boats to drop from so their returns decide the fog, the experiment-design step), and a **grown-up Lantern Lake case** at the 64-unit minimum with a larger fog. Any real ocean (a gyre, a named current) needs its own sourced definition and must still avoid spills and rubbish.

## Open decisions

Each has a default the build uses; none waits on the developer (S1, S8).

1. **Register Drift Cards as a new game,** school 1–3, home Bubble Beach, fallback Tinker Lab. Alternative: a Penguin Slide or Robot Path mode; not chosen, because in those she makes each move, and here the sea moves and she predicts and reverses it.
2. **What is counted.** Default: the first level-1 card of a round is a free prediction; later beaches, every level-2 boat and every level-3 Check are counted, because the visible arrows decide them. Alternative: every prediction free, as Seesaw 17; not chosen, because level 1 would then have no evidence of reading the arrows.
3. **Tracing length.** Default: a finger trace shows two cells ahead from the touched cell; the full drift is a counted hint. Alternative: a full free trace; not chosen, because tracing from the boat's cell would answer level 1 for free.
4. **Cards, not bottles.** Default: wooden numbered cards, as in real studies, always found by a friend. Alternative: a message in a bottle; not chosen, under the study's tone decision 5.
