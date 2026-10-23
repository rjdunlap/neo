# Second Chance Shed, levels 1–4 (definition)

Defined 2026-10-22 as slice **N1** of the [nature-and-sustainability study](../deep-dives/subjects/nature-sustainability.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/nature-sustainability.md#first-games-proposed-ladder-second-chance-shed), its [overlap table](../deep-dives/subjects/nature-sustainability.md#on-the-island-today-and-overlap-decisions), its [rules to define](../deep-dives/subjects/nature-sustainability.md#rules-mistakes-help-and-proof-to-define) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#nature-and-sustainability-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build (N2) on the defaults below, with one gate.** Every open call has a default the build uses ([open decisions](#open-decisions)). The gate that is not a default is the **item table review** in [decision 1](#open-decisions). The table below is a frozen draft, with its doubtful cells marked. N2 may be built against it, but merges only after the developer's recorded review, following the [Who Am I?](who-am-i.md#open-decisions) precedent. The rule tests check consistency with the table, not real-world truth. Levels 5–6 (a friend's request, whole-plan checking with the cart bell) are the separate definition N3, because the bell check is a new interaction.

**Fun action and purpose:** used things arrive one at a time on a little cart at the shed. She drags each one to the place on the island that gives it a second life, and that place visibly makes something:
- a peel fed to the worm bin turns to soil, and a sprout pops up;
- a sturdy box on the reuse shelf becomes Bunny's nap bed;
- a cart with a lost wheel goes to the mending table and comes back rolling;
- a squashed can goes into the Remake machine and comes out as something new.

The learning goal is that **a thing's material and condition decide its next life**. Food bits rot into soil. Whole containers can be used again as they are. A toy missing one part can be mended. Things too squashed or worn down to use as they are can be made into something new. This is the solutions half of NGSS K-ESS3-3 (reuse, recycle) and England Y2's suitability of everyday materials, told as **the island's own rules**: never a real town's bin rules, and never with harm as the motive (Sobel).

## Identity and overlap

- **Critter Sort** (Barnyard) and **Shape Sorter** (Rainbow Meadow) sort by a visible attribute into containers. **Overlap test, applied to every level here:** each place plays a consequence that its own choice causes, and the consequence differs by item (the box becomes a bed, the tub becomes a planter), so the action is "give it its next life", not "match it to its bin". A level that only drops items into matching bins, with no consequence, belongs to Critter Sort and is dropped from this ladder. Levels 1–4 pass: every correct drop plays its consequence at once.
- **Gadget Bench: Fix-It Day** (proposal) keeps real repair: find the worn part and swap it. The mending table here is one drop with no diagnosis. The toy comes back mended after one beat.
- **Garden Grow** (Rainbow Meadow) keeps gardening and growth. The worm bin's sprout is a one-beat consequence, not a growth model, and the two games share no state.
- **Animal Snack** (Barnyard) keeps feeding an animal. The worm bin's munch is a place's consequence beside three other places, not a feeding game. Lap gets nothing new (study: a lone worm bin would be a smaller Animal Snack).
- **Jar Sort** (Rainbow Meadow) keeps moving coloured pieces between jars. No overlap beyond the word "jar", which is why the shelf's container is a **tub** here ([decision 1](#open-decisions)).

## The model

- **An item** is an authored record in `logic.ts`: `id`, spoken name, `place` (one of `worm`, `shelf`, `mend`, `remake`), `kind` (the reason word used in hints: `food`, `whole`, `broken`, `squashed`), `consequence` (an ID the scene plays), and `paper: boolean`.
- **The island's rule, stated once and spoken as the island's:** "On our island, food bits go to the worms. Whole things go on the shelf to be used again. A toy that lost a piece goes to the mending table. Things too squashed or worn down to use go in the Remake machine."

### The item table (frozen draft; reviewed before N2 merges)

| Item | Place | Kind | Consequence shown | Review note |
| --- | --- | --- | --- | --- |
| banana peel | worm bin | food | The worm munches, the soil darkens, a sprout pops in the pot | — |
| apple core | worm bin | food | Same, with a different sprout | — |
| carrot top | worm bin | food | Same | — |
| dry leaf | worm bin | food | Same; the leaf crunches first | EPA "browns"; spoken as food for the worms, never as "trash" |
| sturdy box | reuse shelf | whole | Bunny hops in and curls up for a nap | Cardboard could also be remade in a real town; on the island the box is whole, so it is used again ¹ |
| flowerpot tub | reuse shelf | whole | A seedling is planted in it and set on the shelf | Replaces the study's jar: a thick plastic tub, so no glass question ² |
| cloth bag | reuse shelf | whole | The pet fills it with apples and swings it | — |
| teddy with a loose button | mending table | broken | Needle taps three times; the teddy comes back buttoned and the pet hugs it | — |
| cart missing a wheel | mending table | broken | Hammer taps three times; the cart comes back and rolls across the yard | — |
| kite with a torn tail | mending table | broken | Needle taps; the kite comes back and flutters up | — |
| squashed can | Remake machine | squashed | It chugs (a rising three-note figure) and drops a shiny can-lid medal | — |
| crayon stubs | Remake machine | squashed | It chugs and drops one fat rainbow crayon, which draws a small arc | Real crayon remelting is a home craft; here it is only the island machine's ³ |
| bottle cap pile | Remake machine | squashed | It chugs and drops a little bright button | ³ |

Marked cells are **reviewer cases** ([decision 1](#open-decisions)):
1. A box could go to Remake in a real town. The island's rule makes condition decide: whole goes on the shelf. The box is always drawn whole and clean, and never flattened.
2. The tub stands in for the study's jar. If the reviewer accepts an unbroken jar, the swap is one record and one drawing.
3. Remake's things are the island's inventions. No line says a can, cap or crayon becomes that thing in a real recycling plant.

**Left out of levels 1–4, on purpose:**
- **Paper.** The study's drawn-on paper and newspaper would go to Remake, but shredded paper is also compost ("browns", EPA), and the worm bin is open at every level from 1 to 4. A rule test enforces "no round with the worm bin contains paper". Paper waits for a rung where the bin is closed (N3 decides).
- **The tin with a lid.** It is metal like the can, so at level 4 a Remake drop would be a miss, and the same drop becomes acceptable at level 5. Something wrong at one level and right at the next teaches the wrong thing. The tin arrives with N3, where it is the item with two valid places.
- **No meat, dairy, oily food, pizza box, glossy paper, paper or compostable cup, battery, glass, sharp or broken-looking thing.** Nothing is ever called rubbish or bad, and nothing ever goes to a heap at these levels.

### Rounds

`roundFor(level, rng)` returns the ordered item list and the open places. The seeded RNG chooses which reviewed items appear and their order. It never invents an item's place.
- **Open places:** level 1 `worm`; level 2 `worm`, `shelf`; level 3 adds `mend`; level 4 adds `remake`. Only open places are drawn.
- **Counts:** level 1, three worm items; level 2, four items; level 3, five; level 4, six.
- **Coverage:** every round has at least one item for each open place, so every consequence plays. Level 3 has at least one mending item, and level 4 at least one of each. No item appears twice in a round. Two items with the same place never arrive three in a row.
- **No capacity rule:** a shelf item is used on the spot and leaves (Bunny carries the box off for her nap), so nothing fills up. Sprouts gather in the worm bin's pot, up to the round's count, and are cleared with the round.
- **Judging a drop:** the drop resolves to the **nearest open place** whose drop area contains the point where the item is let go (it rides 40 units above the finger). The item's place gives **right**, another open place gives **wrong place**, and empty yard gives **no drop** (it floats back to the cart, never counted).

## Screen and controls

- **Landscape (1024×768 design area):** a sunny shed yard. The **cart** (item about 150×150) waits top-centre. The **places** sit along the bottom, each about 200×190, spread with `spread()` clear of the pet's corner (150 units, bottom-left) and the home button (top-left). Each place has its own silhouette: a wooden bin with a worm peeking and a pot beside it, a two-slot shelf, a table with a needle and a little hammer, and a round machine with a hopper and chute. A **pictured key** sits above each place: two small item drawings of its kind, so the rule is visible rather than remembered.
- **Portrait:** the cart at the top. At three or four places they stack as **two rows of two** (three: two over one, centred), not shrunk.
- **`shedLayout(view, places)`** returns every rectangle. A test asserts, at the four views (landscape and portrait, iPad and phone) and for one to four places: every target at least 100 units each way, places apart by at least 24, the pet's corner and the home button clear, everything inside `view`, and the cart's item clear of every place.
- **Drag:** `src/engine/drag.ts` `draggable` (lift 40, first finger wins, `floatHome` on refusal). Touch-down lifts the item with a wobble, and every open place breathes once. A right drop snaps the item into the place, plays its consequence, then the next item rolls in on the cart. A wrong drop plays the gentle `sfx.boing()`, the place shakes its head once, the item floats home, and the place speaks its reason.
- **Sounds:** `sfx.munch()` for the worm, `sfx.clunk()` then a soft `sfx.pop()` for the shelf, three pentatonic `sfx.tone` taps for mending, and a rising three-note `notes.ts` figure for the Remake chug. No imported audio. The game keeps the land's calm music (`STYLES.paint`), not `silenced`: she is not making music here.
- **The pet** watches from its corner (`ctx.companion()`), plays with mended toys at the edge of the yard, and repeats the instruction.

## Levels

| Level | Name | Bands (default) | Open places | What she decides | Finish |
| --- | --- | --- | --- | --- | --- |
| 1 | **Feed the worms** | toddler | worm bin | Carry each food bit to the bin; nothing to choose | Three scraps munched |
| 2 | **Two places** | toddler, preschool | worm bin, reuse shelf | Food bits or a whole thing | Four items placed |
| 3 | **Mend it** | preschool, pre-K | + mending table | Food, whole, or a toy that lost a piece | Five items placed, at least one mended |
| 4 | **Remake** | pre-K | + Remake machine | All four, read from the pictured keys | Six items placed, one at each place at least |

`BandLevels`: toddler `{ min: 1, max: 2 }`, preschool `{ min: 2, max: 3 }`, prek `{ min: 3, max: 4 }`. No lap and no school until N3 adds levels 5–6 and the school band ([decision 2](#open-decisions)). Levels 5–8 (requests, Picnic Loop) are appended above 4 later, so no saved level moves.

### First rounds

- **Level 1 (banana peel, dry leaf, apple core):** the pet: "The worms are hungry! Bring the peel to the worm bin." She drags the peel and lets go in the empty yard: it floats back, and the bin wiggles (not counted). She drops it in the bin: munch, the soil darkens, a sprout pops. The leaf and the core follow, and the third sprout sways as the round finishes.
- **Level 2 (tub, carrot top, box, apple core):** "Food bits go to the worms. Whole things go on the shelf." She drags the tub into the worm bin: boing, the worm shakes its head, and the worm says, "I only munch food bits. Where can a whole tub go?" (one miss). She tries the bin again: boing, a second miss, and the shelf glows (one hint). She puts the tub on the shelf, and a seedling is planted in it. The carrot top goes to the bin, the box to the shelf (Bunny naps), the core to the bin.
- **Level 3 (cart missing a wheel arrives first):** "This cart lost a wheel. The mending table can fix it." The table's hammer bobs. She drops the cart there: tap, tap, tap, and it rolls back across the yard while the pet chases it.

## Accounting, help and finishing

- **Never a miss:** a drop in the empty yard, picking an item up and putting it back, tapping a place or the pet, and any drop at level 1. Level 1 counts no misses and gives no glow-hints at all (study: toddler level 1 counts nothing).
- **A miss (levels 2–4):** a drop on a wrong open place. Each wrong place says its reason in the voice of that place ("I only munch food bits", "The shelf keeps whole things", "The mending table fixes toys", "The Remake machine takes squashed and worn-down things"), then the instruction for the current item repeats.
- **After two misses on the same item**, its place glows until the item is placed, and `hints++`, at most once per item. This is the [Sense Detective](sense-detective.md#accounting-help-and-finishing) rule applied per item, since items here are separate decisions. A glow is help, so it counts ([decision 4](#open-decisions)).
- **Show a hint** in the pause sheet (`Scene.pauseActions`) glows the current item's place and counts one hint, once per item. Asked again for the same item, the ghost finger carries the item there (**Show me one**), with no further hint: it never moves an item already placed. At level 1 Show a hint just glows the bin, and counts nothing.
- **Start again** rebuilds the same seeded round with nothing placed, keeping misses and hints.
- **Finish:** after the last item's consequence, a short pentatonic rise while every place plays its consequence once more in turn, then `ctx.finish({ misses, hints })` once. One ordinary sticker, even with help. Nothing is kept, saved or filed in the journal ([decision 6](#open-decisions)). No timer, no score, no counter of things placed.
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A zero-miss round at level 3–4 is evidence that she read the keys or knew the rule. It is not evidence of real-world sorting, and the grown-ups' card says so.

## Rule tests (`logic.test.ts`)

- **Table:** every item has exactly one place and one kind, every kind matches its place, and every place has at least two items (Remake has three without paper). No item is marked paper at levels 1–4. Every (wrong place, item kind) pair has a reason line.
- **Rounds, over 500 seeds per level:**
  - the counts and open places are the level's;
  - every item's place is open;
  - every open place is covered (level 3 has a mending item, level 4 one of each);
  - no duplicates, and no three in a row with the same place;
  - no round with the worm bin contains paper;
  - the tin with a lid never appears;
  - the same seed gives the same round.
- **Judging:** a drop at each open place's centre resolves to that place, a drop between two places resolves to the nearer, and a drop outside every place is no drop. Level 1 counts no miss for any drop.
- **Accounting:** a scripted level 2 round (tub to bin, tub to bin again → glow; Show a hint on the same item → no further hint; tub to shelf; the rest right) yields misses 2, hints 1. A second Show a hint carries the item and leaves hints at 1. A placed item never moves.
- **Layout:** `shedLayout` at the four views for one to four places (sizes, gaps, pet and home clearance, inside `view`, two rows of two in portrait at four).
- **Registry, lands and how-to tests** pass with the new game, its land still fitting on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` drags each item from the cart to its place, pausing on the pictured key first. It plays the level's round correctly, and the same bot drives the scripted play.
- **How-to card** (`src/content/howto.ts`). Goal: "Take each used thing to the place on the island that gives it a second life."
  - Steps:
    - "Drag the food bits to the worm bin" (all levels);
    - "Put whole things on the shelf to be used again" `{ from: 2, to: 4 }`;
    - "Take a toy that lost a piece to the mending table" `{ from: 3, to: 4 }`;
    - "Put squashed and worn-down things in the Remake machine" `{ from: 4, to: 4 }`.
  - Finish: "Every thing has found its place, and the yard shows what each one made."
  - Notes:
    - "Nothing is counted at the first level; she just feeds the worms" `{ from: 1, to: 1 }`;
    - "A drop in the wrong place counts as a miss and that place says why; after two, the right place glows, which counts as a hint" `{ from: 2, to: 4 }`;
    - "These are the island's own rules. Check what your town's recycling and compost take" (all levels).
- **Voice lines** under `shed.*`:
  - `intro`, `instruct.1`–`instruct.4` (the island rule for the open places), `item.<id>` (name lines);
  - `arrive.mend`, the reasons `reason.worm`, `reason.shelf`, `reason.mend`, `reason.remake`;
  - `hint-glow`, `made.<consequence>` (one short line each, such as "Bunny loves her new bed!"), `done`.

  `{pet}` is optional. Every rule line says "on our island", and nothing is written as text to read.
- **Registration:** ID `second-chance-shed`, name "Second Chance Shed", spoken title `game.second-chance-shed` ("Second Chance Shed"). Region (subject) `cozy-village`. Skills `['sorting', 'materials', 'cause-and-effect', 'reuse']`. Bands toddler, preschool, prek. Home land **Cozy Village** by default, its 13th game ([decision 3](#open-decisions)). Hub icon: a little shed door with a sprout pot and a can-lid medal. Sticker: a seeded consequence (a sprout pot, Bunny in the box, the mended cart or the can-lid medal).
- **Art:** code-drawn in `src/games/second-chance-shed/art.ts` with `src/art/palette.ts`: the cart, the four places and their keys, the thirteen items and their made things. Bunny is `CRITTERS.bunny` via `attach()`. No imported art or audio.
- **Co-play:** the study's **shed keeper and courier**: the grown-up names where an item goes ("I think the worms want this one"), and she checks the key and carries it; then they swap, and she tells the grown-up. Ordinary single-player accounting. **Off-screen** (spoken tip only; the printed Kitchen Sort card is N7, after review): "Find something at home that could be used again, and use it together."
- **Couch:** none.
- **Rework couplings:** nothing saved. The study's "What can we make from the shed?" adventure (N8) and remade things as home items are the rework's to define, after RW07's frame exists.

## Check tier

N2 (levels 1–4) is the **new-game tier**:
- typecheck and unit tests (the rule properties above, plus registry, lands and how-to tests);
- one scripted play through a new `browser-check.mjs` case, whose README row is part of the build: level 1 (one empty-yard drop, not counted) and level 4 (one wrong drop, one requested hint);
- one portrait screenshot at level 4 with all four places;
- `fingerdemo` at levels 1 and 4;
- `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open:
- whether a two-year-old drags into the one bin unprompted;
- whether the pictured keys read without speech;
- whether "whole" versus "squashed" reads from the drawings;
- device speech of the reason lines;
- whether a child confuses the island's Remake with a real recycling bin.

Browser automation cannot establish any of these.

## Open decisions

Each has a default the build uses. Decision 1 is the one review the study asks for before anything ships, and the rest block nothing.

1. **Who reviews the item table.** Default: the developer reviews every row above before N2's merge, the three marked cells especially, and records the check in the build's verification entry. A named reviewer ([study decision](../deep-dives/subjects/nature-sustainability.md#decisions-for-the-developer)) replaces that when one exists. The Kitchen Sort and Our Tree cards (N7) wait for that person. Alternative: the study's jar instead of the tub.
2. **Bands.** Default toddler 1–2, preschool 2–3, pre-K 3–4, and school arrives with N3's levels 5–6. Alternative: school 4 now as a single-level range, so a school player sees it before N3.
3. **Home land.** Default **Cozy Village** (12 games now, 13 with this one), which matches the seed's everyday-life theme. Puzzle Peaks already lays out 13, and `lands.test.ts` decides. The study leaned Rainbow Meadow, but it holds 11 games today (not the study's 7), and three pending definitions already default there: [Seed Travelers](seed-travelers.md), [Food Web Workshop](food-web-workshop.md) and [Sprout Shuffle](sprout-shuffle.md). Fallback if Cozy Village's layout returns null: **Treehouse** (6 games), the making land. **Note (2026-10-22):** Recipe Workshop found Cozy Village full for decoration at 12 visible games (`village.test.ts`: no hedgerow fits at pre-K landscape), so expect the same layout failure here and plan the fallback land.
4. **The two-miss glow.** Default: it counts one hint, once per item. Alternative: once per round, as Sense Detective.
5. **Level 1 misses.** Default: none counted and no glow, as the study says. Alternative: count misses from level 1 for preschool players who start there (they do not by default).
6. **Journal.** Default: nothing filed. Alternative: a discovery "worms turn peels into soil" after the first level-1 round.

**Decided 2026-10-23 (on the developer's delegation):** every default stands; decision 1 becomes the building session's source check of every item-table row (government waste and composting guidance), recorded in N2's verification entry, so N2 merges without the developer's review; the Kitchen Sort and Our Tree cards (N7) are not drafted for now.
