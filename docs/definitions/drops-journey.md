# Drop's Journey, levels 1–3 (definition)

Defined 2026-10-31 as slice 8 of the [weather-and-water study](../deep-dives/subjects/weather-water.md#build-slices-in-order) (the first route), from its [candidate row](../deep-dives/subjects/weather-water.md#candidates-and-recommended-order) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#weather-and-water-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build** as one same-game batch (levels 1–3, new-game tier). Registration, bands and land take the defaults below under standing rule S8, and the explanation lines take the building session's source check under S1 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)); neither waits on the developer. It does not depend on Rain Garden being built.

**Fun action and purpose:** a little water drop with two dots for eyes sits in the sea under a big sun. She taps a picture card to choose where it goes next: the sun warms it and it rises, drawn as a dotted ghost because water vapour cannot be seen, into a cloud; it falls as rain on the river, or as snow on the cold mountain top; it runs downhill to the sea; it soaks into the ground under the hill and waits there. Every stop goes onto a postcard strip, and *Play my story* replays the whole trip with the pet telling it. The learning purpose is **water moves between places and between liquid, ice and invisible vapour along several possible paths: the sun's warmth lifts it, and it comes down and runs downhill** (NGSS [2-ESS2-3](https://www.nextgenscience.org/pe/2-ess2-3-earths-systems) water is found in places and as liquid or solid; [MS-ESS2-4](https://www.nextgenscience.org/pe/ms-ess2-4-earths-systems) multiple pathways driven by sunlight and gravity, as the far horizon). Younger play names places; older play names what made the water move. There is no single right loop: the drop never has to return to where it started.

## Identity and overlap

Rechecked 2026-10-31 against the catalog and the open proposals:

- **Rain Garden** ([definition](rain-garden.md), not built) owns what happens to rain on ground she changes; it shows no evaporation, cloud forming or freezing and hands those to this game. Drop's Journey has no surfaces to change and no storage counters: it follows **one** parcel between places.
- **Melt and Freeze** (Bubble Beach, built) owns state change on a tabletop with a sun and a snowflake button, and draws no steam, cloud or rain. Here melting and freezing happen only as moves between places (snow melting into the river; a cloud's water falling as snow), never as a tabletop experiment, and there is no heat dial.
- **Water Road** (Tinker Lab, built) owns *building* a downhill channel so water reaches a town. Here every route is already drawn; she chooses a move, never builds one. Both say water runs downhill; that shared rule is the point, not an overlap.
- **Tide Line** ([definition](tide-line.md), queued) owns the sea's rise and fall. The sea here never moves.
- **Weather Wardrobe** and **Day by Day** keep clothing and weather records; no weather symbol, forecast or calendar is drawn.
- **Water Paths** and **Puddle Pipes** (IDEAS proposals) are about connecting a source to a target by drawing or turning pieces. Nothing here is connected or drawn by her.
- **Drift Cards** (oceans study, define after this packet) sends a bottle on a current map; it can reuse this game's sea, not its graph.

## The model (`logic.ts`)

- **Places** (five; level 1 uses three): `sea`, `cloud`, `river`, `snow` (the mountain top) and `ground` (under the hill). Each has a fixed **height** on the picture: `cloud` 4, `snow` 3, `ground` 2, `river` 1, `sea` 0. The river runs from just below the snow down to the sea; the hill and its ground water sit beside the river's upper part, above it, and nowhere touch the sea.
- **States:** the parcel is `liquid` in `sea`, `river` and `ground`, `ice` in `snow`, and `cloud` (tiny droplets or ice bits) in `cloud`. `vapour` is never a place: it exists only **during** a rising move and is drawn as dots (below).
- **Drivers:** every move has one: `warm` (the sun's warmth lifts it as vapour, or melts it), `cold` (it falls as snow where it is cold), or `down` (gravity: it falls or runs downhill).
- **Moves (the whole lawful table).** `MOVES: Record<Place, Move[]>`, each `{ to, process, driver }`. *Stay* (storage) is lawful everywhere and is listed separately.

  | From | To | Process (`process`) | Driver |
  | --- | --- | --- | --- |
  | sea | cloud | evaporates, then cools into a cloud droplet (`evaporate`) | warm |
  | river | cloud | evaporates (`evaporate`) | warm |
  | river | sea | flows downhill (`flow`) | down |
  | ground | river | seeps out slowly into the river (`seep`) | down |
  | snow | river | melts and runs downhill (`melt`) | warm |
  | snow | cloud | turns straight into vapour (`sublimate`) | warm |
  | cloud | sea | rains (`rain`) | down |
  | cloud | river | rains (`rain`) | down |
  | cloud | ground | rains and soaks in (`rainsoak`) | down |
  | cloud | snow | falls as snow on the cold mountain top (`snowfall`) | cold |

- **Can't-go cards (level 3 only).** `CANT: Record<Place, CantMove[]>`, each `{ to, reason }`, lists the **only** unlawful destinations ever offered, chosen because they are wrong in any reasonable picture of this land: `sea → river` (`uphill`), `sea → snow` (`uphill`), `river → snow` (`uphill`), `ground → snow` (`uphill`). Every other pair not in `MOVES` (for example `snow → sea`, `ground → cloud`, `ground → sea`, `sea → ground`, `river → ground`) is **never offered** at any level, because real water can sometimes do it (glaciers reach the sea, wet soil dries, ground water seeps to coasts, rivers lose water into their banks); the model neither allows nor forbids it.
- **Gravity rule:** every `down` move goes to a lower place; a move to a higher place is always `warm` and always to `cloud` (as vapour); `melt` is `warm` and runs downhill; `cold` is only `cloud → snow`. Every can't-go destination is higher than its start and is not `cloud`, so the reason is always the same: *liquid water can't run uphill; to go up, it has to rise as vapour first.*
- **A journey** is `{ start, stops: Stop[] }` where a `Stop` is `{ place, via: process | 'stay' }`. `step(journey, choice)` returns a new journey for a lawful move or a stay, and `{ wrong: reason }` (journey unchanged) for a can't-go card. One parcel only: it is never split, lost or created, and it is always in exactly one place.
- **Every place is finishable:** from any place, at least two lawful choices exist (stay plus at least one move; the table gives `sea` 1 move, `ground` 1, `river` 2, `snow` 2, `cloud` 4), and no level's finish condition requires returning to `start`.
- **Round state** and `canFinish(state)`:
  - level 1: true once the journey has **3 stops** after the start (stays count);
  - level 2: true once the parcel **reaches the postcard's place** (any route, any length, stays allowed);
  - level 3: true once **4 moves** have been made after the start (stays do not count here, so the strip shows a real trip).
- **Authored first round** for each level (below); later rounds are seeded from `ctx.rng` within each level's variation. No board can fail: every offered card set holds at least two lawful choices.

## Levels

| Level | Name | Bands (default) | What she decides | Finish available |
| --- | --- | --- | --- | --- |
| 1 | **Where can the drop go?** | preschool, pre-K | Which of the offered places the drop goes next (three places: sea, cloud, river) | After 3 stops |
| 2 | **Send it to the snow** (a postcard request) | pre-K, school | A route from the start to the postcard's place, across all five places | When the drop reaches the postcard's place |
| 3 | **Can it go there?** | school | Whether each offered card is a move water can really make, then which to take | After 4 moves |

### First rounds

- **Level 1:** places `sea`, `cloud`, `river` only (snow and ground are drawn as scenery without cards). The drop starts in the sea. Cards offered are exactly the lawful moves inside these three places plus *Stay*: at the sea, *cloud* and *stay*; at the cloud, *sea*, *river* and *stay*; at the river, *sea*, *cloud* and *stay*. Authored path for the demo: sea → cloud → river → sea. *Variation:* the start is seeded among sea and river; nothing else changes.
- **Level 2:** all five places. A friend (a seeded critter on a postcard pinned top-right) asks for the drop at one place: authored first round *start sea, postcard snow* (shortest route sea → cloud → snow, two moves). Only lawful cards are offered. Any route counts; if she wanders (say sea → cloud → river → sea), the postcard stays pinned and the pet repeats the request. *Variation:* seeded `(start, goal)` pairs with a shortest route of two or three moves, from the five authored pairs: sea → snow (sea → cloud → snow), snow → ground (snow → cloud → ground), ground → snow (ground → river → cloud → snow), sea → ground (sea → cloud → ground) and river → snow (river → cloud → snow). A test fixes the list and each pair's shortest length at 2 or 3.
- **Level 3:** all five places. At each stop three cards are offered: lawful moves (and *Stay*) drawn from `MOVES`, plus exactly one can't-go card **when the current place has one in `CANT`** (sea, river, ground). At the snow and the cloud all three cards are lawful (there is nothing clearly impossible to offer, and nothing is invented to be wrong). Authored first round: start in the sea, cards *cloud*, *river* (can't-go: uphill) and *stay*. *Variation:* the start is seeded among sea, river and ground; the cards' order is seeded; when a place has more lawful moves than fit, they are seeded among them.

## Screen and controls

- **The land** fills the board: sea bottom-right, river winding from below the snowy peak (top-left) down to the sea, a green hill beside the river's upper bend with a soil cutaway showing ground water as a few blue dots between stones, a big cloud top-centre and the sun top-right. Each place has a **place ring** (a soft halo, at least 120 units) where the drop rests. The drop is about 70 units, a blue drop with a dark outline and two dot eyes.
- **States by shape as well as colour:** liquid is the blue drop; ice is the same drop drawn white with a six-point star edge; in the cloud it is a small drop inside a puff of tiny dots; while rising as vapour it is **only a ring of dots in the drop's outline with no fill**, and the pet says once a round "We draw dots so you can follow it. Real water vapour is invisible." No white puff, no steam, no bubbles, no kettle: evaporation is never drawn or said as boiling.
- **Drivers drawn:** `warm`: the sun's rays brighten and a warm glow rims the drop as it lifts; `cold`: a blue cold band hangs at the mountain top and the drop turns white as it falls; `down`: a big down-arrow chevron under the drop while it falls or runs, and the drop follows the drawn river or rain lines. Each move takes about 1.5 s with `ctx.tw`; taps during a move are ignored.
- **Choice cards** run along the bottom edge: two to four cards, each at least 150×130 logical units, a picture of the destination place (or a nest for *Stay*). Touch-down squashes at once. Tapping a lawful card plays the move. A card is the only target; place rings are not tappable (one way to choose, so the bot and the hint point at one thing).
- **The postcard strip** runs across the top below the Home button: one small card per stop (place picture plus a process badge: sun for warm, snowflake for cold, arrow for down, nest for stay), at most six shown with older ones sliding off left. Not a target.
- **Play my story** (a book button, at least 110×110, beside the strip) replays the journey: the drop jumps back to the start (drawn as a page turn, not a move) and retraces every stop at double speed while the pet says each stop's line. It is never required and counts nothing.
- **The leaf button** (Finish), at least 120×120, top-right, appears when `canFinish` is true. At level 2 the postcard flips into the leaf when the goal is reached.
- **Sound:** a rising pentatonic run (`src/audio/notes.ts`) for a warm rise, a falling run for rain or flow, a soft high chime for snowfall, a low hum for stay; `boing` for a can't-go card. No thunder, rain recording or kettle hiss. The island style keeps playing (default `STYLES.bubbles`).
- **Pause sheet:** Start again (the same start, empty strip, keeping hints) and Show a hint (`Scene.pauseActions`).

`journeyLayout(view, level)` returns every rectangle: places, rings, cards, strip, book, leaf, postcard. A test runs it at the four views the lands test uses and asserts every target (cards, book, leaf) at least 100 units each way and the cards at their 150×130 minimum, no overlap between targets, the Home button and the guide's bottom-left corner clear, everything inside `view`, and every place ring at least 100 units. Four cards that cannot fit one row in portrait wrap to two rows; if two rows fail, the layout returns null and the test fails rather than shrink.

### Layout sketches

**Landscape (1024×768 design area):**

```
+------------------------------------------------------------+
| [Home] [strip: sea>cloud>river ...] [book]   [postcard/leaf]|
|   /\ snow (o)          .-----------.          \ | /          |
|  /  \~~ cold          (  cloud (o)  )        - sun -         |
| /    \__                '-----------'         / | \          |
|/  hill  \__river (o)                                         |
|  [ground (o)]   \______                                      |
|                        \_______      ~~~~ sea (o) ~~~~       |
|  pet   [card]   [card]   [card]   [card]                     |
+------------------------------------------------------------+
```

**Portrait (768×1024 design area, upright iPad):**

```
+----------------------------------+
| [Home] [strip ...]  [book] [leaf]|
|      .------------.     \ | /    |
|     ( cloud  (o)   )   - sun -   |
|      '------------'     / | \    |
|   /\ snow (o)                    |
|  /  \__                          |
| / hill \__ river (o)             |
| [ground (o)]  \____              |
|                    \___          |
|          ~~~~~ sea (o) ~~~~~     |
|      [card]   [card]   [card]    |
|  pet          [card]             |
+----------------------------------+
```

The postcard (level 2) sits under the leaf position in both orientations and becomes the leaf. In portrait the cards keep the pet's corner clear by starting right of it on the last row.

## Accounting, help and finishing

- **Levels 1–2: no misses.** Only lawful cards are offered, so every tap is a real move or a stay; `misses: 0`. A level-2 detour is exploring, not a mistake.
- **Level 3: a can't-go card is one miss.** Tapping it plays a short **try**: the drop starts up the slope, slides back with a `boing`, and the pet says the reason line (below); the card greys and stays on screen, the journey is unchanged and the other cards stay live. Two misses in the same round make the lawful cards glow with the sun or arrow badge of their driver (the causal glow), and the shell counts one hint for that glow. A can't-go card is never shown again after it is tapped in that stop.
- **Hint:** Show a hint (pause sheet) or two idle cues in a row make the pet point at a lawful card and say why it works ("The sun can warm it up into the cloud"); at level 2 it points at the next card on a shortest route from where the drop is, so the hint always leads to the postcard. A requested hint counts **1 hint**. The idle cue only repeats the instruction and counts nothing.
- **Comfortable stopping:** at level 1, after the sixth stop the leaf glows and the pet says "Tap the leaf when you're all done." At level 3 the same after the sixth move. Not a hint, counts nothing.
- **Assisted ending:** the hint can always take her to the finish (at level 3 by pointing only at lawful cards); finishing with hints earns the ordinary one sticker.
- **Finishing:** `ctx.finish({ misses, hints })`, once (`finished` guards a second tap).
- **Adaptation:** levels 1–2 are always "smooth" without hints, so two rounds step her up; that signals she joined in, not that she understands the water cycle, and the how-to card says so.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the pet repeats them); results use `ctx.say`. These lines are the game's whole scientific claim. Under S1 the building session checks each one against the sources below and records the check in its verification entry; any line it cannot support is cut or reworded before merge.

- `drop.instruct.1`: "Where can the drop go? Tap a picture."
- `drop.instruct.2`: "Our friend wants the drop at the {place}. Tap pictures to get it there."
- `drop.instruct.3`: "Can water really go there? Tap a place it can go."
- `drop.vapour`: "We draw dots so you can follow it. Real water vapour is invisible."
- One line per process, said as the move plays (levels 1–2 the short form, level 3 and *Play my story* the long form):
  - `drop.evaporate`: "Up it goes!" / "The sun warmed it. It rose as invisible vapour, cooled, and became a tiny drop in the cloud."
  - `drop.rain`: "Rain!" / "The cloud's drops grew heavy and fell as rain."
  - `drop.rainsoak`: "Rain on the hill!" / "It rained on the hill and soaked into the ground."
  - `drop.snowfall`: "Snow!" / "Up on the cold mountain, it fell as snow."
  - `drop.melt`: "Drip, drip!" / "The sun melted the snow, and the water ran down into the river."
  - `drop.sublimate`: "Up it goes!" / "In sun and wind, a little snow can turn straight into vapour."
  - `drop.flow`: "Down the river!" / "Water runs downhill. The river carried it to the sea."
  - `drop.seep`: "Back to the river!" / "Water in the ground slowly seeps back out into the river."
  - `drop.stay` with place forms: sea, snow and ground "It can stay here a long, long time."; cloud and river "It stays a little while."
- `drop.uphill` (level 3 reason): "Water can't run uphill. To go up, the sun has to warm it into vapour first."
- `drop.glow`: "The glowing ones are places it really can go."
- `drop.postcard`: "You got it to the {place}! Our friend is happy."
- `drop.done`: "Tap the leaf when you're all done."

None of these says the water boils, that evaporation needs hot weather, that clouds are made of vapour or steam, that every drop goes round in one fixed circle, how long water stays anywhere in years, or anything about drinking water, floods or storms. The grown-ups' card carries the model's limits.

**Sources for the build's check** (the study's opened sources; open them again in the building session): the [USGS water cycle for schools (advanced)](https://water.usgs.gov/edu/watercycle-kids-adv.html) diagram for the places and processes, including sublimation, snowmelt runoff, infiltration, groundwater seepage and storage in oceans, ice and snow, and groundwater; the USGS [condensation page](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle/) for invisible vapour cooling into cloud droplets; NGSS [2-ESS2-3](https://www.nextgenscience.org/pe/2-ess2-3-earths-systems) and [MS-ESS2-4](https://www.nextgenscience.org/pe/ms-ess2-4-earths-systems) for the anchors. The USGS runoff pages the study tried returned errors and are not used.

## Rule tests (`logic.test.ts`)

1. **Table shape:** every place has at least one move and *Stay*; every move's `to` is a different place; the level-1 subset (sea, cloud, river) gives every one of its places at least two choices including *Stay*.
2. **Drivers agree with heights:** every `down` move goes to a lower height; every move to a higher height is `warm` and ends in `cloud`; `melt` goes lower; `cold` is only `cloud → snow`.
3. **Can't-go cards are really impossible and never lawful:** `CANT` and `MOVES` share no pair; every can't-go destination is higher than its start and is not `cloud`; no pair outside `MOVES ∪ CANT` is ever offered at any level (enumerate every offered set over 300 seeds per level).
4. **One parcel:** after any sequence of lawful steps the parcel is in exactly one place; a can't-go step leaves the journey unchanged.
5. **No forced loop:** from every place, at levels 1 and 3, `canFinish` is reachable without visiting `start` again; level 2's goal is reachable from every place by lawful moves (BFS).
6. **Level 2 pairs:** the authored pair list is fixed, each shortest route is 2 or 3 moves, and the hint's next card always lies on a shortest route from the current place to the goal (follow hints from every place: reaches the goal in the BFS distance).
7. **Level 3 cards:** each offered set holds at least two lawful choices; exactly one can't-go card at sea, river and ground, none at snow and cloud; a tapped can't-go card counts one miss and is not offered again in that stop; misses never block finishing.
8. **Finish:** `canFinish` false before its condition at every level; true at 3 stops (level 1), on the goal (level 2), at 4 moves with stays not counted (level 3); a second Finish is ignored.
9. **Seeded rounds:** starts and pairs come from each level's listed variation; the first round of each level equals the authored one.
10. **Layout:** `journeyLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` reads the offered cards from the scene and taps lawful ones: level 1 taps cloud, river, sea, then the leaf; level 2 follows the hint's shortest route to the postcard, then taps the leaf; level 3 taps a lawful card at each stop (never the can't-go card) for 4 moves, then the leaf. Every demonstration ends on the leaf, so `fingerdemo` proves Finish at the first and top level.
- **How-to card** (`src/content/howto.ts`). Goal: "Follow a water drop as it moves between the sea, the sky, the mountain, the river and the ground."
  - Steps: "Tap a picture to choose where the drop goes next; dots show it rising, because real water vapour is invisible" (all levels); "Three places: the sea, the cloud and the river" `{ from: 1, to: 1 }`; "A friend's postcard shows where to send the drop; any way there counts" `{ from: 2, to: 2 }`; "One picture is a place water can't reach from here; pick the places it really can go" `{ from: 3, to: 3 }`; "The book button replays the whole trip with the pet telling it" (all levels).
  - Finish: "Tap the leaf; it appears after three stops" `{ from: 1, to: 1 }`, "…when the drop reaches the postcard's place" `{ from: 2, to: 2 }`, "…after four moves" `{ from: 3, to: 3 }`.
  - Notes: "No wrong answers here: every picture shown is a real move" `{ from: 1, to: 2 }`; "Picking a place water can't reach counts as a miss; two make the right ones glow, which counts as help" `{ from: 3, to: 3 }`; "A pretend model with five places. Real water takes many more paths, can stay in one place for a very long time, and never has to come back where it started" (all levels); "Rounds without hints move her up, which means she joined in, not that she knows the water cycle" (all levels).
- **Registration (default under S8):** ID `drops-journey`, name "Drop's Journey", spoken title `game.drops-journey` ("Drop's journey"). Region (subject) `tinker-lab`. Skills `['water', 'states-of-matter', 'cause-and-effect', 'sequencing']` (free strings). Bands (`BandLevels`): preschool 1–1, prek 1–2, school 2–3; no lap or toddler (the study's audience starts at P), no grown-up yet (S2; a later Lantern Lake case would need its own definition). Home land **Tinker Lab**, the science land (20 games today; it pages at `LAND_SPOTS` rather than shrink), fallback **Bubble Beach** beside Melt and Freeze; `lands.test.ts` decides. Hub icon: a drop with dot eyes under a cloud, a dotted arc from a wave up to it. Sticker (page `meadow`): the drop on a seeded stop (cloud, snow or river) with the stop's badge.
- **Art:** code-drawn in `src/games/drops-journey/art.ts` with `src/art/palette.ts`: land, places and rings, the drop in its four looks (liquid, ice, cloud droplet, vapour dots), driver marks (rays, cold band, chevron), cards, strip, book, postcard, leaf. Postcard friends reuse `src/art/animals.ts` and `CRITTERS`. No imported art or audio.
- **Co-play:** one person chooses the card, the other tells what made the drop move (the sun, the cold, or downhill); then swap. **Off-screen** (spoken tip): "After rain, look for where the water went: puddles, a wet path drying in the sun, water running downhill." Looking only: no water-play, kettle, boiling or storm instructions.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's ordinary round history.
- **Rework couplings:** none required; the drop is not a creature and never becomes one. The postcard friend could later be one of her creatures, as the [rework brief](../rework/README.md) decides.

## Check tier

One same-game batch: levels 1–3 share the model, land, cards and art. New-game tier: typecheck and unit tests (the properties above plus registry, lands and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 to its sticker and level 3 with one can't-go card, then a second one for the glow and its hint, then Finish; one portrait screenshot at level 2 mid-move (the vapour dots rising); `fingerdemo` at levels 1 and 3; `npm run build`, because the registry, lands, voice and how-to files change. The building session's source check of every line in [Speech](#speech-voice-scriptts) goes in its verification entry. If the allowance cannot cover all three levels, stop after complete levels 1–2 with a draft-PR checkpoint.

Device and person checks stay open: whether a four-year-old follows the dotted drop and reads it as "still the drop"; whether "vapour" is said clearly by iPad speech; whether a school-age child explains *why* a can't-go card is wrong or only remembers it. Browser automation establishes none of these.

## What comes next

Later levels, each needing its own definition: **many routes** (count two different routes to the same postcard, the second shown beside the first), **where it waits** (sort stops by how long water stays, a comparison without numbers of years), and plants (water taken up by roots and given off by leaves), which needs its own source check and a biology overlap review with Garden Grow and Sprout Shuffle. A grown-up or upper-school case could follow Forecast Detective. **Drift Cards** (oceans study) is now eligible for its own docs-only definition.

## Open decisions

Each has a default the build uses; none waits on the developer (S1, S8).

1. **Register Drop's Journey as a new game** with these bands (preschool 1, pre-K 1–2, school 2–3) and home Tinker Lab, fallback Bubble Beach. Alternative: fold level 1 into Melt and Freeze if watching shows the preschool round is too abstract; the overlap section says why it is distinct.
2. **Sublimation** at levels 2–3. Default: kept (`snow → cloud`), because the USGS diagram shows it and leaving it out would let a child think it impossible. Alternative: offer it only at level 3.
3. **The level-3 wrong cards.** Default: only the four uphill pairs. Alternative: none at all and a different check (say, *why did it move?* picking the driver); not chosen, since the driver question is the long-form line already.
