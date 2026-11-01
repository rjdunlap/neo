# Same-game implementation batches

Requested by the developer 2026-10-21: group related levels into a coherent implementation session so the game’s rules, rendering, bot and checks are loaded once. [READY](READY.md) remains the dispatch order. These plans preserve the original numbered subtask scopes and gates; they do not renumber saved levels or authorize gated additions.

## Batch contract

- One queue item, claim, worker chat, branch, PR and closeout per batch. Usually group 2–4 related original subtasks or levels from one game; keep one larger new interaction alone when it needs its own layout or proof. A batch may include supporting content/feedback that its levels share. Research still studies one game or subject at a time.
- Name every included level/content item, source slice and dependency in the claim. Implement prerequisite substeps first within that worker, keeping the same context through the whole declared batch. Do not finish a substep, merge it and open another chat for the rest. Checkpoint unfinished batches in that same worker across usage windows.
- Revalidate against current origin/main and all claims before admission. If part has already shipped or is owned elsewhere, remove that part before claiming; do not enlarge, duplicate or reimplement another worker’s scope. Preserve stable slice references for closeout. If the remaining batch is too large or a new unresolved gate appears, split at a complete playable boundary and requeue the remainder explicitly.
- Keep batches within one game and one main interaction family. Do not append unrelated work merely to keep a chat alive. Review calls, the companion misfits, rework cutover, practical-content review, new bands and other existing gates remain unchanged. Who Am I? retains its trait review before merge; Species Comeback #733 remains developer-review work.
- Verification is shared across the batch: one final typecheck and relevant unit-test run, one build when required by any included change, and the union of necessary filtered browser cases. Rule tests cover every added level. Play the hardest new level of each distinct interaction and any easier entry with materially different input/layout; include the batch’s miss/hint cases, relevant portrait view and ghost-finger checks for the new levels. Retain explicit story/couch/save/navigation checks required by a subtask. Reuse passing evidence for unchanged code; do not repeat identical checks per original slice or run a release suite just because several levels ship together. Keep the existing browser budget; if the union cannot fit, split before admission.
- One closeout updates all included substeps in the dive, READY and verification record. The study cadence counts batches, not individual levels: keep the three definition / one research places per ten queue items, and fill content places with coherent game batches. New definitions and dives should propose these batches directly.

## Batch plans

Find the named game/batch heading and read only that section plus the batch contract; do not load this whole packet for a single claim. Each heading is a routine-sized claim. Original task text below retains its level ranges, content, references, special checks and source order; where a supporting task is grouped with a dependent level, complete the support first. The game dive remains the authority for detailed rules and decisions. Built substeps should be marked in the dive and removed from READY; this packet is a scope reference, not a completed-work log.


### egg-catch 1: Gate repair and changing gates

- **`egg-catch`, level 10 Fix the run** (new interaction): repair one gate from a visible trace; school. [Slice 6](deep-dives/egg-catch.md#new-levels-on-top)
- **`egg-catch`, level 11 Flip-flop gate** (new interaction; after *Fix the run*): a gate that flips itself, two eggs, one setting; school. [Slice 7](deep-dives/egg-catch.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### feelings-faces 1: Helping and explaining happenings

Built 2026-10-21, [PR #766](https://github.com/rjdunlap/neo/pull/766); [closeout](archive/COMPLETED-2026-10-09.md#feelings-faces-helping-and-explaining-happenings-2026-10-21). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`feelings-faces`, toddler 10 *Hug or pillow*** (new level on the help interaction): two helper cards for sad, sleepy or hungry; toddler `[2, 10, 3, 4]`. [Slice 3](deep-dives/feelings-faces.md#new-levels-on-top)
- **`feelings-faces`, level 11 *Two friends, one happening*** (new interaction): one happening, two friends with two different faces, a question for each; pre-K top and the school entry. [Slice 4](deep-dives/feelings-faces.md#new-levels-on-top)
- **`feelings-faces`, level 13 *What happened?*** (new level; after 11): a face and a leftover clue, three happening cards; school. [Slice 5](deep-dives/feelings-faces.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### sound-garden 1: Listening direction and visible echoes

Built 2026-10-22, [PR #779](https://github.com/rjdunlap/neo/pull/779); [closeout](archive/COMPLETED-2026-10-09.md#sound-garden-listening-direction-and-visible-echoes-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sound-garden`, level 7 Up, down or the same** (new level): staircases and a flat path at pre-K top. [Slice 3](deep-dives/sound-garden.md#new-levels-on-top)
- **`sound-garden`, echo you can see** (level 5): knock dots from the start, 12 rhythms, the sleepy tree answers. [Slice 4](deep-dives/sound-garden.md#fresh-content-inside-existing-levels)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### sound-garden 2: One big friend

Built 2026-10-22, [PR #784](https://github.com/rjdunlap/neo/pull/784); [closeout](archive/COMPLETED-2026-10-09.md#sound-garden-one-big-friend-2026-10-22). No longer eligible for dispatch.

- **`sound-garden`, level 8 One big friend** (new lap entry): one screen-filling singer, `entryLevels`, lap order 8, 1. [Slice 5](deep-dives/sound-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### sound-garden 3: Pitch drawing and copying

- **`sound-garden`, level 9 Sing Higher** (new interaction): drag a singer up to sing higher on pentatonic steps, creative finish; preschool order 2, 3, 4, 9, and pre-K. [Slice 6](deep-dives/sound-garden.md#new-levels-on-top)
- **`sound-garden`, level 10 Copy the shape** (new level; after *Sing Higher*): sing back a two- then three-note direction; pre-K. [Slice 7](deep-dives/sound-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### teddy-doctor 1: Choose a patient and order a check-up

Built in [#798](https://github.com/rjdunlap/neo/pull/798); [build note](archive/COMPLETED-2026-10-09.md#teddy-doctor-batch-1-patient-choice-and-check-up-rules-2026-10-22).

- **`teddy-doctor`, level 7 Who needs help?** (new level): two friends, tap the one with a boo-boo, then bandage it; toddler order 1, 7, 2, 3, `entryLevels: [7]`. [Slice 3](deep-dives/teddy-doctor.md#new-levels-on-top)
- **`teddy-doctor`, level 8 Before and after** (new level on the existing drag): a check-up with a stated order rule, every order that keeps it accepted; school 5, 6, 8. [Slice 4](deep-dives/teddy-doctor.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### scoop-shop 1: Younger scoop and customer entries

- **`scoop-shop`, lap entry 10 Any scoop** (new level on the existing interaction, with `order`/`entryLevels`): one tap, one scoop, one munch; lap order 10, 1. [Slice 3](deep-dives/scoop-shop.md#younger-band-openings)
- **`scoop-shop`, toddler 11 Who wanted pink?** (new interaction): tap the customer whose picture matches the scoop already on the cone; toddler order 1, 2, 11, 3. [Slice 4](deep-dives/scoop-shop.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### scoop-shop 2: Count-on and mixed-colour orders

- **`scoop-shop`, level 12 Fill it up** (new level on the existing interaction): count on from scoops already on the cone; pre-K and school. [Slice 5](deep-dives/scoop-shop.md#new-levels-on-top)
- **`scoop-shop`, level 13 Three pink and two blue** (new level): two colours with a count each, any order; pre-K and school. [Slice 6](deep-dives/scoop-shop.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### scoop-shop 3: Change and reverse

- **`scoop-shop`, level 8 Change of mind**: exactly one bottom/middle/top replacement before input; final-order peek and accounting.
- **`scoop-shop`, level 9 Top first**: reverse a spoken distinct triple; upright peek.

EF1b first batch, school only, [canonical EF1 requirements](deep-dives/scoop-shop.md#ef1-build-ready-definition-2026-10-25). Retain built IDs/order; separate admission and building-session review/placement/layout/person gates. Proof: typecheck, rule tests, filtered top-level9 play, demos8/9; other checks only at the applicable tier. No level7 implementation in this batch.

### scoop-shop 4: Two cones

- **`scoop-shop`, level 7 Two cones**: after batch3 and built11; one pair, three scoops total, free cone selection distinct from friend peek, independent state/accounting and both service orders.

Standalone EF1b new interaction, [canonical EF1 requirements](deep-dives/scoop-shop.md#ef1-build-ready-definition-2026-10-25). Separate admission, current source/contract review, actual full-size layout/placement, rules, filtered wrong-scoop/peek/completion play, portrait and two-order demo; shared-file/asset build tier as applicable. Person/device gates stay open.

### shape-sorter 1: Sorting entry, shape pool and three sizes

Built 2026-10-22, [PR #817](https://github.com/rjdunlap/neo/pull/817); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-1-round-or-square-shape-pool-sizes-and-big-middle-little-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 10 *Round or square*, slice 3** (new levels on an existing interaction): two plain holes by outline alone; toddler `order [9, 1, 2, 10, 3, 4, 5]`. [Dive](deep-dives/shape-sorter.md#easier-entries-and-levels-between-existing-ones)
- **`shape-sorter`, more shapes, sizes and colours, slice 4** (logic tier plus build): oval, rectangle, diamond, pentagon and trapezoid with lines, pool draws at 6–8, sizes at 6–7, a rainbow one colour, the box's property facts. [Dive](deep-dives/shape-sorter.md#fresh-content-inside-existing-levels)
- **`shape-sorter`, level 11 *Big, middle, little*, slice 5** (new levels, plus a portrait screenshot): one shape in three sizes; preschool `order [3, 4, 5, 6, 7, 11]`, pre-K `order [5, 6, 7, 11, 8]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### shape-sorter 2: Turn it to fit

Built 2026-10-22, [PR #822](https://github.com/rjdunlap/neo/pull/822); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-2-turn-it-to-fit-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 12 *Turn it to fit*, slice 6** (new interaction): tap a piece to turn it a notch, then carry it to an upright hole; pre-K `order [5, 6, 7, 11, 8, 12]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### shape-sorter 3: Corners, curves and corner counts

Built 2026-10-22, [PR #842](https://github.com/rjdunlap/neo/pull/842); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-3-corners-curves-and-corner-counts-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 13 *Corners or curves*, slice 7** (new levels; after slice 4): two mouths, curves or corners; pre-K `order […, 12, 13]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)
- **`shape-sorter`, level 14 *Count the corners*, slice 8** (new levels; after slice 4): holes labelled 0, 3, 4, 5, 6 with dots; pre-K top by default. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 1: Tool signs, helpers and numbers past ten

Built 2026-10-22, [PR #850](https://github.com/rjdunlap/neo/pull/850); [closeout](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-1-tool-signs-helpers-and-numbers-past-ten-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`mail-carrier`, level 10 *Which door?*, slice 3** (new levels on the existing tap: typecheck, rule tests, one play of 10 with one wrong tap and one hint, a portrait screenshot of the signs, `fingerdemo` at 10): six tool `Graphics`, `letterShows` gains `'tool'`; toddler `order [1, 2, 10]`, preschool `order [2, 10, 3, 4]`, `entryLevels: [10]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 9 *Who can help?*, slice 4** (new levels tier, after slice 3: typecheck, rule tests, one play of 9, a portrait screenshot, `fingerdemo` at 9): the problem pictures, helper hats, the six journal entries; pre-K `order [3, 4, 5, 9, 6]`, school `order [4, 5, 9, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 12 *Numbers past ten*, slice 5** (new levels tier): two-digit numerals 10–20 with the ten-and-ones spoken; pre-K `order [3, 4, 5, 9, 12, 6]`, school `order [4, 5, 9, 12, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 2: Spoken map clues and both street sides

Built 2026-10-23 in [#856](https://github.com/rjdunlap/neo/pull/856); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-2-spoken-map-clues-and-both-street-sides-2026-10-23).

- **`mail-carrier`, level 13 *Hazel's clue*, slice 6** (new levels on the map interaction: typecheck, rule tests over 300 seeds for clue uniqueness on both map orientations, one play of 13, `fingerdemo` at 13): Hazel says a spoken clue and the carrier finds the one house it names; school `order [4, 5, 9, 12, 6, 13, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 11 *Both sides of the street*, slice 7** (new interaction tier: typecheck, rule tests, one play of 11, a portrait screenshot that decides decision 7, `fingerdemo` at 11): odd numbers on one side and even on the other, house found from the parity then the order; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 3: Compare delivery routes

Built 2026-10-23 in [PR #874](https://github.com/rjdunlap/neo/pull/874); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-3-compare-delivery-routes-2026-10-23). Scope retained for dependency references; no duplicate dispatch.

- **`mail-carrier`, level 14 *Three letters, your way*, slice 8** (new levels on the route interaction, plus the free second walk: typecheck, rule tests, one play of 14 taking the second plan, `fingerdemo` at 14): plan three stops in any order, then optionally compare a second order's stone count; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11, 14]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 4: Make the key

Built and verified 2026-10-23 in [PR #881](https://github.com/rjdunlap/neo/pull/881); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-4-make-the-key-2026-10-23). Scope retained for dependency references; no duplicate dispatch.

- **`mail-carrier`, level 15 *Make the key*, slice 9** (new interaction tier: typecheck, rule tests, one play of 15, a portrait screenshot of the wet key, `fingerdemo` at 15): match each sign row to its house to fill Hazel's key, then deliver two letters; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11, 14, 15]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### garden-grow 1: Flower variety and the lap growth entry

- **`garden-grow`, flower kinds** (content, levels 1–7): daisy, tulip, sunflower and bell-flower; kind varies per request, color alone is judged. [Slice 3](deep-dives/garden-grow.md#fresh-content-inside-existing-levels)
- **`garden-grow`, level 8 Grow it up** (new level, after slice 2): one big bed, every touch grows the next stage, three flowers; lap `order: [8, 1, 2]`, `entryLevels: [8]`. [Slice 4](deep-dives/garden-grow.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### garden-grow 2: Rows, columns and equal rows

- **`garden-grow`, level 9 Rows of colors** (new interaction): choose a packet, then beds, to match a sign of two colored rows; judged by position; pre-K after 7. [Slice 5](deep-dives/garden-grow.md#new-levels-on-top)
- **`garden-grow`, level 10 Columns of colors** (new level, after level 9 *Rows of colors*): three columns in two or three colors. [Slice 6](deep-dives/garden-grow.md#new-levels-on-top)
- **`garden-grow`, level 11 Same in every row** (new level, after level 9 *Rows of colors*): n flowers in each row in any beds, every placement accepted. [Slice 7](deep-dives/garden-grow.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### stop-and-go 1: Go car, stop car

- **`stop-and-go`, lap entry 9 Go car, stop car** (new interaction): a looping car, two huge lamps, no misses; lap order 9, 1, `entryLevels: [9]`. [Slice 3](deep-dives/stop-and-go.md#younger-band-openings)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### stop-and-go 2: Whose light and the busy crossing

- **`stop-and-go`, level 5 Whose light? and the pre-K window** (new level): two lanes with their own lights, send the one whose light is green; preschool 2–5, pre-K 3–5. [Slice 4](deep-dives/stop-and-go.md#new-levels-on-top)
- **`stop-and-go`, level 6 Busy crossing** (new level): cars arrive on both roads, she hands over one road at a time; an idle point helps level 4 too; pre-K 3–6. [Slice 5](deep-dives/stop-and-go.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### weather-wardrobe 1: Visible consequences and the lap fitting entry

- **`weather-wardrobe`, a miss that shows why** (existing-game change): a wrong item goes on for a moment, shows its cold, hot, wet or blown consequence and hops back; accounting unchanged. [Slice 3](deep-dives/weather-wardrobe.md#build-slices-in-order)
- **`weather-wardrobe`, lap entry 8 Try it on** (new level, after *a miss that shows why*): anything goes on, the fitting item stops the weather, no misses; lap order 1, 8, 2, `entryLevels: [8]`. [Slice 4](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### weather-wardrobe 2: Wind (built)

Built 2026-10-26 ([PR #994](https://github.com/rjdunlap/neo/pull/994)): slice 7 (a fourth weather with a kite, a windbreaker and a hat with a strap, the `blown` misfit, level-1 finish and trip pairs adjusted). Nothing remains in this batch. [Slice 7](deep-dives/weather-wardrobe.md#build-slices-in-order)

### weather-wardrobe 3: Two friends, two places

Built 2026-10-26, [PR #987](https://github.com/rjdunlap/neo/pull/987); [closeout](archive/COMPLETED-2026-10-09.md#weather-wardrobe-two-friends-two-places-level-10-2026-10-26). Retained for scope references; no longer eligible for dispatch.

- **`weather-wardrobe`, level 10 Two friends, two places** (new drag interaction): drag each item to the friend whose weather it suits; pre-K. [Slice 8](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 1: Numbered buds, shot trail and board variety

Built 2026-10-22, [PR #770](https://github.com/rjdunlap/neo/pull/770); [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-numbered-buds-shot-trail-shell-tray-and-board-themes-slices-2-3-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, numbered buds wait their turn and the last shot stays faint** (existing-game change, levels 4–5): only the asked numeral blooms; the previous path stays as faint dots. [Slice 2](deep-dives/peg-garden.md#build-slices-in-order)
- **`peg-garden`, shell tray and board themes** (content): pearls collect in a tray and pour back; four simulated board shapes, three backdrops. [Slice 3](deep-dives/peg-garden.md#fresh-content-inside-existing-levels)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 2: Big buds

Built 2026-10-23; [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-level-8-big-buds-slice-4-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, level 8 Big buds** (new lap entry): four huge buds, every touch blooms one; lap order 8, 1, toddler 8, 1, 2, `entryLevels: [8]`; plans keyed by ID. [Slice 4](deep-dives/peg-garden.md#younger-band-openings)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 3: Cup aiming and planting a bud

Built 2026-10-24, [PR #923](https://github.com/rjdunlap/neo/pull/923); [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-levels-6-into-the-cup-and-7-plant-a-bud-slices-5-6-2026-10-24). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, level 6 Into the cup** (new interaction): aim the pearl into the cup with that many dots; every cup reachable with margin; pre-K top. [Slice 5](deep-dives/peg-garden.md#new-levels-on-top)
- **`peg-garden`, level 7 Plant a bud** (new interaction, after level 6 *Into the cup*): drag a bud onto a marked place so the pearl reaches the cup, run, revise; pre-K. [Slice 6](deep-dives/peg-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### little-helpers 1: Visible quantities, carrying variety and the full-team whistle

Built 2026-10-22, [PR #804](https://github.com/rjdunlap/neo/pull/804); [closeout](archive/COMPLETED-2026-10-09.md#little-helpers-batch-1-rings-that-fill-things-to-carry-and-the-full-team-whistle-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`little-helpers`, the badge fills, needs vary, level 2 opens to lap** (existing-game change, levels 2–6): rings fill as helpers grab on, the gap named at 5, no 1, 2, 1, 2 rounds, lap window 1–2. [Slice 2](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, things to carry and three places** (content): pumpkin, watermelon, acorn, pinecone, toy boat; orchard, beach and woods. [Slice 3](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, level 9 Whistle when it's full** (new level, after *the badge fills*): rings say when, no misses; toddler order 1, 2, 9, preschool 2, 9, 3, 4; plans keyed by ID. [Slice 5](deep-dives/little-helpers.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### little-helpers 2: Build teams, share helpers and count strong helpers

Built 2026-10-23, [PR #863](https://github.com/rjdunlap/neo/pull/863); [closeout](archive/COMPLETED-2026-10-09.md#little-helpers-batch-2-teams-she-builds-everyone-helps-and-strong-helpers-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`little-helpers`, level 6 teams she builds** (existing-game change): tap which fruit gets the helper, nearest-helper taps; uneven teams strain. [Slice 4](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, level 7 Everyone helps** (new interaction): split a crowd of 4–7 between two fruits; pre-K top and school. [Slice 6](deep-dives/little-helpers.md#new-levels-on-top)
- **`little-helpers`, level 8 Strong helpers** (new interaction): big helpers count two, every exact mix right; school. [Slice 7](deep-dives/little-helpers.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### monster-munch 1: Food variety, monsters and places (complete)

All three subtasks are built (slice 2 on 2026-10-24); nothing remains in this batch.

Built (reference only, do not recreate):

- **`monster-munch`, foods, monsters and places** (content): five foods (two kinds at 6), monster variants, three backdrops, the sticker pool. [Slice 2](deep-dives/monster-munch.md#fresh-content-inside-existing-levels)
- **`monster-munch`, level 9 Big bites** (new lap entry): three big cookies, the monster itself feeds, the belly grows; `BandLevels`, lap order 9, 1, 2, `entryLevels: [9, 10]`. [Slice 3](deep-dives/monster-munch.md#younger-band-openings)
- **`monster-munch`, level 10 One of each** (new level, after *Big bites*): a cookie and an apple for each monster; toddler order 2, 3, 10, 4. [Slice 4](deep-dives/monster-munch.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### monster-munch 2: Sharing two kinds and choosing group counts

Built 2026-10-26, [PR #989](https://github.com/rjdunlap/neo/pull/989); [closeout](archive/COMPLETED-2026-10-09.md#monster-munch-batch-2-two-kinds-and-how-many-friends-2026-10-26). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`monster-munch`, level 12 Share two kinds** (new level, after *Big bites*): deal cookies and apples fairly, then how many of each; school order 6, 7, 12, 8. [Slice 5](deep-dives/monster-munch.md#new-levels-on-top)
- **`monster-munch`, level 11 How many friends?** (new interaction, after *Big bites*): call friends from a cave, two each, ring when no one else can have two, then how many friends and how many left; school top. [Slice 6](deep-dives/monster-munch.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### rhythm-neighbors 1: Younger turn-taking and its journal page

Built 2026-10-22, [PR #853](https://github.com/rjdunlap/neo/pull/853); [closeout](archive/COMPLETED-2026-10-09.md#rhythm-neighbors-batch-1-knock-knock-my-turn-your-turn-and-the-frogs-journal-page-slices-2-3-and-8-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`rhythm-neighbors`, level 7 Knock, knock** (new lap entry: order and entry tests, one play, `fingerdemo` at 7, one portrait screenshot): a big tree, every knock answered by a frog a beat later, eight knocks finish; lap order `[7, 1, 2]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, level 8 My turn, your turn** (new level on the tap interaction: rule tests, one play, `fingerdemo` at 8): the bird knocks, one big frog glows and waits, one tap answers; toddler order `[2, 8, 3]`; no misses. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, journal page** (small; after slice 1): "The frogs answered the woodpecker", filed from a finished turn-taking round. [Dive](deep-dives/rhythm-neighbors.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### rhythm-neighbors 2: Knock a call

Built 2026-10-24, [PR #925](https://github.com/rjdunlap/neo/pull/925); [closeout](archive/COMPLETED-2026-10-09.md#rhythm-neighbors-level-9-knock-a-call-slice-4-2026-10-24). Scope retained below.

- **`rhythm-neighbors`, level 9 Knock a call** (new interaction tier; after level 8): she knocks the tree two to five times and the frogs answer with the gaps reversed; toddler `[2, 8, 9, 3]`, preschool `[9, 3, 4]`, `entryLevels [7, 9]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 1: Truthful support and varied weighing props

Built 2026-10-23, [PR #858](https://github.com/rjdunlap/neo/pull/858); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-1-truthful-support-and-varied-weighing-props-slices-12-2026-10-23).

- **`seesaw-balance`, support truth, slice 1 (built)** (existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 6, `fingerdemo` at 1): a tap on a loose friend hops it to the empty tray at 1–2, the glow after two overs rings the next block on the grass when the tray is under, the how-to's levels 1–2 line says tap or drag, new voice variants; IDs and windows unchanged. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, two faces per weight, wrappings and boxes, slice 2 (built)** (logic tier, plus one filtered play of 2 and 4): a friend pool per weight with a distinct-faces test, seeded present wrappings, parcel and crate boxes at 6–7. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 2: Lap bounce and heavier-or-lighter choices

Built 2026-10-26, [PR #991](https://github.com/rjdunlap/neo/pull/991); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-2-lap-bounce-and-heavierlighter-slices-34-2026-10-26). Scope retained below.

- **`seesaw-balance`, level 12 *Wheee!* with the lap band, slice 3** (new interaction tier: typecheck, units, one scripted play at lap and toddler, one portrait screenshot, `fingerdemo` at 12): the `bounce` mode, any touch on the empty tray sends a duck up; `bands` gains `lap`, lap `order [12]`, toddler `order [12, 1, 2]`, `entryLevels: [12]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 13 *Who is heavier?*, slice 4** (new interaction tier, taps on friends: typecheck, rule tests, one play of 13 with one wrong tap and one hint, `fingerdemo` at 13): tap the heavier or lighter of two tipped friends; preschool `order [2, 13, 3, 4]`, `entryLevels: [12, 13]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 3: Order weights, estimate and find the difference

Built 2026-10-26, [PR #993](https://github.com/rjdunlap/neo/pull/993); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-3-order-estimate-and-difference-slices-57-2026-10-26). Scope retained below.

- **`seesaw-balance`, level 14 *Line them up*, slice 5** (new levels on an existing interaction: typecheck, rule tests, one play of 14, `fingerdemo` at 14): three look-alike presents tested in pairs then dragged to light, middle and heavy spots; pre-K `order [3, 4, 14, 5, 6, 7]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 15 *Guess the pumpkin*, slice 6** (new levels tier, plus a portrait screenshot for the guess sign): an unscored guess, then blocks until level, then the real number; pre-K `order [3, 4, 14, 5, 6, 7, 15]`, school `order [6, 7, 15, 8, 9, 10, 11]` (without 11 until it lands). [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 16 *How much heavier?*, slice 7** (new levels tier): add blocks to the light side until level, then say the difference; school `order [6, 7, 15, 16, 8, 9, 10, 11]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 4: Which way will it tip

Built: level17 prediction/release, slice8 ([PR #1000](https://github.com/rjdunlap/neo/pull/1000)); [build note](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-4-predict-the-tip-slice-8-2026-10-26). No open implementation subtask; person/device acceptance stays open.

### fluffy-salon 1: Customer variety and younger styling entries

Status 2026-10-26: built. Slices 3 and 4 (levels 6 and 7) landed 2026-10-23 ([PR #864](https://github.com/rjdunlap/neo/pull/864)); slices 2 and 5 landed 2026-10-26 ([PR #995](https://github.com/rjdunlap/neo/pull/995)).

- **`fluffy-salon`, customers, rooms and start looks, slice 2** (logic tier): seeded friends in the chair with `{who}` lines, seeded wall and cape colors, five free-play start looks. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 6 *Pat the fluff*, slice 3** (new interaction): no buttons, any touch grows the fur, the floof shake and a big mirror, the round finishes by itself; lap `order [6, 1, 2]`, toddler `order [6, 1, 2]`, `entryLevels: [6]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 7 *Snip snip*, slice 4** (new levels on an existing interaction): two big buttons, grow and snip; lap and toddler `order [6, 1, 7, 2]`, `entryLevels: [6, 7]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 8 *Pink, please*, slice 5** (new levels on an existing interaction): five bottles and color-only requests, a wrong color named without a miss; toddler `order [6, 1, 7, 2, 8]`, preschool `order [2, 8, 3, 4]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### fluffy-salon 2: Two customers and comparative styling

Built 2026-10-26: slices 6–7, levels 9–10 ([PR #1002](https://github.com/rjdunlap/neo/pull/1002)); [build note](archive/COMPLETED-2026-10-09.md#fluffy-salon-batch-2-two-customers-and-comparative-styling-slices-67-2026-10-26). No open implementation subtask; person/device acceptance stays open.

- **`fluffy-salon`, level 9 *Two customers*, slice 6** (new interaction, plus a portrait screenshot): two friends in two chairs with a two-part card each, either order finishes; preschool `order [2, 8, 3, 4, 9]`, pre-K `order [3, 4, 5, 9]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 10 *Longer than Pip's*, slice 7** (new interaction): make the pet's fur longer or shorter than a friend's, with a comparison line drawn in the mirror; pre-K `order [3, 4, 5, 9, 10]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### fluffy-salon 3: Two colours and changed requests

Built 2026-10-26: slices 8–9, levels 11–12 ([PR #1009](https://github.com/rjdunlap/neo/pull/1009)); [build note](archive/COMPLETED-2026-10-09.md#fluffy-salon-batch-3-two-colors-and-changed-requests-slices-89-2026-10-26). No open implementation subtask; person/device acceptance stays open.

- **`fluffy-salon`, level 11 *Two colors*, slice 8** (new levels): "pink and blue, please", at least 35 % of strands in each; pre-K `order [3, 4, 5, 9, 10, 11]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 12 *Changed my mind*, slice 9** (new levels): a loved style is asked to be the opposite, so snip undoes grow and comb undoes curl; pre-K `order [3, 4, 5, 9, 10, 11, 12]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 1: Parade variety and younger size entries

- **`size-parade`, the parade happens, eight friends and a seeded ground, slice 2** (landed 2026-10-26) (fresh content): the strut after a pick, the march with the size scale after a line, five new friends, flag and bunting by seed, the round's friend on the sticker, varied dealt sizes at levels 1–4. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, levels 16 *Big duck, little duck* and 9 *Big one, little one* with the lap band, slice 3** (landed 2026-10-26) (new interaction, plus a portrait screenshot): the size cycle under her finger, then big or little of two; `bands` gains `lap`, lap `order [16, 9]`, toddler `order [9, 1, 2, 3, 4]`, `entryLevels: [9, 16]`, the per-band accounting of decision 1. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 17 *Two in a line*, slice 4** (landed 2026-10-23; slice 3 then added 9 and `entryLevels` [9, 16, 17]) (new levels on an existing interaction): the two-friend line plan, the first drag a toddler meets; toddler `order [9, 1, 2, 3, 4, 17]`, preschool `order [3, 4, 17, 5, 6]`, `entryLevels: [9, 16, 17]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 10 *Big, middle, little*, slice 5** (landed 2026-10-23) (new levels on an existing interaction): the middle of three with a ringed-middle cue, at least two of four questions asking for it; preschool `order [3, 4, 17, 10, 5, 6]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 2: Who fits

- **`size-parade`, level 11 *Who fits?*, slice 6** (landed 2026-10-28) (new interaction, plus a portrait screenshot): a bed, chair, bowl and door each fitting exactly one of three friends, too big and too little tried on screen; preschool `order [3, 4, 17, 10, 5, 6, 11]`, pre-K `order [5, 6, 11, 7, 8]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 3: Insert a friend and order shades

- **`size-parade`, level 12 *Where does this one go?*, slice 7** (landed 2026-10-30, PR #1031) (new interaction, plus a portrait screenshot): a fifth friend dropped into the nearest gap of an ordered line that opens under the finger; pre-K `order [5, 6, 11, 7, 8, 12]`, school `order [7, 8, 12]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 15 *Darkest first*, slice 8** (landed 2026-10-30, PR #1031) (new levels on an existing interaction, plus a device contrast check): five shades of one friend lined up darkest or lightest first; pre-K `order [5, 6, 11, 7, 8, 12, 15]`, school `order [7, 8, 12, 15]`; Shade Lineup leaves the notebook. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 4: Hidden heights

- **`size-parade`, level 13 *Hidden heights*, slice 9** (landed 2026-11-01, PR #1083) (new interaction, plus a portrait screenshot): boots behind a fence, a tapped pair swaps only when out of order, a gate that opens on a sorted line, a bot that sorts by pair tests; school `order [7, 8, 12, 13, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 5: The measuring ribbon

- **`size-parade`, level 14 *The measuring ribbon*, slice 10** (new interaction, plus a portrait screenshot): two friends on different footing compared with a ribbon that snaps to a head, a tap before measuring is a prediction and never a miss; school `order [7, 8, 12, 13, 14, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 1: Meal variety and lap tap-sharing

Built 2026-10-23, [PR #860](https://github.com/rjdunlap/neo/pull/860); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-1-meal-variety-and-lap-tap-sharing-slices-2-3-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, friends, the meal eaten, round wholes, the fraction seen and a third fruit, slice 2** (fresh content tier: typecheck, rule tests for the pie's cuts and the fruit pool, one filtered play of 2 and 7, `fingerdemo` at 7): `CRITTERS` dealt from the seed, a seeded pie or sandwich each round, the chew, the fraction bubble at 7, the banana. [Slice 2](deep-dives/pet-kitchen.md#build-slices-in-order)
- **`pet-kitchen`, level 10 *One for you, one for me* and the lap band, slice 3** (new interaction tier: typecheck, rule tests, the picnic unit test, one play of 10 with a tap off a piece, a portrait screenshot, `fingerdemo` at 10, the `picnic` suite's sandwiches step once): tap dealing; `bands` gains `lap` with `{ min: 10, max: 10 }`, toddler `order [10, 1]`, `entryLevels: [10]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 2: Fair shares, thirds and equivalent shapes

**Part A built 2026-10-23** (slices 4-5, levels 11 and 12; [PR #879](https://github.com/rjdunlap/neo/pull/879), `claude/pet-kitchen-same-or-not`; [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-2-part-a-same-or-not-the-same-and-two-pizzas-three-friends-slices-4-5-2026-10-23)). **Part B built 2026-10-26** (slice 6, level 14, a cut per whole; [PR #998](https://github.com/rjdunlap/neo/pull/998), `claude/pet-kitchen-different-shape`; [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-2-part-b-different-shape-same-share-slice-6-2026-10-26)). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, level 11 *Same or not the same?*, slice 4 (built)** (new levels on the cut-and-drag, plus the overlay: typecheck, rule tests, one play of 11 serving the lopsided pieces once, `fingerdemo` at 11): piece areas, the lopsided icon and drawing; preschool `order [1, 11, 2, 3, 4]`, pre-K `order [11, 3, 4, 5, 6]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 12 *Two pizzas, three friends*, slice 5 (built)** (new levels tier: typecheck, rule tests, one play of 12 with a halves serve, `fingerdemo` at 12): thirds of two wholes; school `order [5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 14 *Different shape, same share*, slice 6 (built)** (new interaction tier, a cut per whole: typecheck, rule tests, one play of 14, a portrait screenshot of the overlay, `fingerdemo` at 14): two shapes of one share; pre-K `order [11, 3, 4, 14, 5, 6]`, school `order [14, 5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 3: Compare shares

Built 2026-10-30, [PR #1032](https://github.com/rjdunlap/neo/pull/1032); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-3-level-13-who-has-more-slice-7-2026-10-30). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, level 13 *Who has more?*, slice 7 (built)** (new interaction tier, the question after the serve: typecheck, rule tests over the fraction pairs, one play of 13 with one wrong "more", `fingerdemo` at 13): compare two shares; school `order [14, 5, 6, 7, 8, 9, 12, 13]`, and the three journal entries land here. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 4: Equivalent cup measures

Built 2026-10-31, [PR #1084](https://github.com/rjdunlap/neo/pull/1084); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-4-level-15-one-cup-many-ways-slice-8-2026-10-31). Scope retained for dependency references; this batch is not requeued.

- **`pet-kitchen`, level 15 *One cup, many ways*, slice 8 (built)** (new interaction tier per the cooking packet: typecheck, rule tests over every half-and-quarter combination, one play of 15 with an oversupply undo, a portrait screenshot, `fingerdemo` at 15): the packet's equivalent-measures round; school `order [14, 5, 6, 7, 8, 9, 12, 13, 15]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### ribbon-workshop 1: First ribbons

Built 2026-10-22, branch `claude/ribbon-workshop`; [closeout](archive/COMPLETED-2026-10-09.md#ribbon-workshop-levels-1-3-fractions-r2-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`ribbon-workshop`, levels 1–3 *A whole ribbon*, *Snip a half*, *Three quarters*** (new game, new interaction; school): tap ribbon pieces onto a bench to match a gift tag's length of one declared whole, then snip a half into two quarters; every composition that makes the length is accepted. [Definition](definitions/ribbon-workshop.md#levels), [study slice R1](deep-dives/subjects/fractions.md#build-slices-in-order)

Proof: new-game tier under the batch contract, as the [definition's check tier](definitions/ribbon-workshop.md#check-tier) sets it (unit tests and build, `BROWSER_SUITE=ribbon`, one portrait screenshot, `fingerdemo` and `smoke` filtered to the game).

### inchworm 1: Big worms, little worms

Built 2026-10-22, branch `claude/inchworm-big-worms`; [closeout](archive/COMPLETED-2026-10-09.md#inchworm-level-7-big-worms-little-worms-measurement-m2-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`inchworm`, level 7 *Big worms, little worms*** (new level on the existing worm-laying and number-pad interaction; pre-K top and school after level 2): measure one stick with big worms then little worms, then tap the number the little (or big) worms made. [Definition](definitions/big-worms-little-worms.md), [study slice M2](deep-dives/subjects/measurement-units.md#build-slices-in-order)

Proof: new-level tier on an existing interaction, as the [definition's Build and check tier (M2)](definitions/big-worms-little-worms.md#build-and-check-tier-m2) sets it (typecheck, Inchworm rule tests and `howto.test.ts`, one filtered portrait play of level 7, `fingerdemo` at it, one portrait screenshot).

### stamp-studio 1: Trace Prints

Built 2026-10-22, [PR #777](https://github.com/rjdunlap/neo/pull/777); [closeout](archive/COMPLETED-2026-10-09.md#stamp-studio-levels-8-9-trace-prints-deep-time-d3-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`stamp-studio`, levels 8 *Leaf prints* (lap) and 9 *Two feet* (toddler)** (a new `TracePrints` interaction inside the existing game: a mud tray where a leaf, a duck foot or a cat paw leaves its own fresh print; 0 misses and 0 hints, nothing kept): pat the mud with one big leaf (eight pats finish it), then choose between two feet and print both. [Definition](definitions/trace-prints.md), [deep-time D3](deep-dives/subjects/deep-time.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/trace-prints.md#build-and-check-tier) sets it (typecheck, unit tests, the `creative` stamps loop at levels 8–9, `fingerdemo` at both, one portrait screenshot of level 9, one build).

### critter-sort 1: Same Kind, Different Sprouts

Built 2026-10-23, [PR #865](https://github.com/rjdunlap/neo/pull/865); [closeout](archive/COMPLETED-2026-10-09.md#critter-sort-levels-12-13-same-kind-different-sprouts-genetics-g4-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`critter-sort`, levels 12 *Like the big plant* and 13 *Same and different*** (new levels on the existing drag interaction; pre-K and school): drag little plants grown from one big plant's seeds into hoops for the big plant's leaf shape and petal marks, first one hoop (level 12), then overlapping hoops (level 13); the family is stated, never deduced, and no mechanism is taught. [Definition](definitions/same-kind-different-sprouts.md), [genetics study slice G4](deep-dives/subjects/genetics.md#build-slices-in-order)

### attic-finds 1: Lid and Lever

- **`attic-finds`, levels 3 *Up and down* (lap, toddler) and 4 *Peek inside* (toddler)** (a new giant-handle interaction inside the existing game; `entryLevels: [3, 4]`; 0 misses and 0 hints, nothing kept): each touch turns a giant handle half a turn so the bird (or fish) rises, then sinks; level 4 adds a peek door that shows the rod the handle pushes; a Finish picture appears after three turns and only her tap ends the round. [Definition](definitions/lid-and-lever.md), [everyday-life study slice H3](deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/lid-and-lever.md#build-and-check-tier) sets it (typecheck, unit tests, an `atticlever` scripted play at levels 3–4, `fingerdemo` at both, one portrait screenshot of level 4 with the door open, one build).

### attic-finds 2: Same job and right for the job

**Built 2026-10-31 ([PR #1045](https://github.com/rjdunlap/neo/pull/1045)).** Both levels shipped; see the [archive note](archive/COMPLETED-2026-10-09.md#attic-finds-levels-56-same-job-and-right-for-the-job-h4-2026-10-31).

- **`attic-finds`, levels 5 *Same job* (pre-K, school) and 6 *Right for the job* (school)** (a new tap-to-try plus drag-into-a-three-slot-cart interaction inside the existing game; pre-K {1,5, order [1,2,5]}, school {2,6, order [2,5,6]}): try each old thing, then put every one that does the job into the cart (level 5), then choose the right tool for a job where one fails (level 6); a free failing try is not a miss. [Definition](definitions/same-job.md), [everyday-life study slice H4](deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/same-job.md#build-and-check-tier) sets it (typecheck, unit tests, an `atticjobs` scripted play at levels 5–6, `fingerdemo` at both, one portrait screenshot of level 6, one build).

### second-chance-shed 1: Levels 1–4

Built 2026-10-24, [PR #930](https://github.com/rjdunlap/neo/pull/930); [closeout](archive/COMPLETED-2026-10-09.md#second-chance-shed-levels-1-4-slice-n2-2026-10-24). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`second-chance-shed`, levels 1–4 (N2)** (a new game, one subtask; toddler 1–2, preschool 2–3, pre-K 3–4, Cozy Village by default): used things arrive one at a time on a cart and she drags each to the worm bin, reuse shelf, mending table or Remake machine, one place added per level; each place visibly makes something, and level 1 counts no misses. [Definition](definitions/second-chance-shed.md), [nature-sustainability study slice N1](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/second-chance-shed.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 4, `fingerdemo` at both, one portrait screenshot of level 4, one build). Review gate: the session's source check replaced the developer review (decided 2026-10-23); recorded in VERIFICATION.

### second-chance-shed 2: Someone needs it

Built 2026-10-31, [PR #1057](https://github.com/rjdunlap/neo/pull/1057); [closeout](archive/COMPLETED-2026-10-09.md#second-chance-shed-levels-5-6-slice-n3-2026-10-31). Scope retained for dependency reference; defined 2026-10-31 (nature-sustainability N3).

- **`second-chance-shed`, levels 5–6 (N3)** (new interaction on the built game; school {4–6}): everything is laid out on the cart at once, a friend's picture bubble asks for something (pencils a pot, Bunny a nap), she plans every place and the friend's gift, then rings the cart bell; level 6 has two friends and one thing that fits both, and the tempting plan fails. One miss per failed ring, never per thing. [Definition](definitions/second-chance-shed-5-6.md), [nature-sustainability study slice N3](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/second-chance-shed-5-6.md#check-tier) sets it (typecheck and rule tests with the registry, lands and how-to tests; a filtered `browser-check.mjs` play at level 5 with the tin to Remake, a failing ring, a repeated ring counting nothing, then the tin to the friend, and at level 6 with the tempting plan, two failed rings and the glow, one Show me one and the finish; one portrait screenshot at level 6; `fingerdemo` at 5 and 6; one build). Review gate: the building session's source check of the new item and its fits, recorded in VERIFICATION.

### sand-table 1: Levels 1–3

Built 2026-10-23; [build note](archive/COMPLETED-2026-10-09.md#sand-table-levels-13-e2-2026-10-23). Home land is Rainbow Meadow (see the note). No longer eligible for dispatch.

- **`sand-table`, levels 1–3 (E2)** (a new game, one subtask; lap 1, toddler 1–2, preschool 2–3, pre-K 3, Bubble Beach by default): tap a sand tray to pour a shower of grains that settle into a heap, tap a scoop paddle to lift some back into the bucket, one bay added per level; any landscape is a finished one, and every round counts 0 misses and 0 hints. [Definition](definitions/sand-table.md), [earth-materials study slice E1](deep-dives/subjects/earth-materials.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/sand-table.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 3, one build). No review gate: the three rungs make no geology claim; the [open decisions](definitions/sand-table.md#open-decisions) all have defaults.

### adventure-walk 1: Levels 1–3

Built 2026-10-23; [build note](archive/COMPLETED-2026-10-09.md#adventure-walk-levels-13-aw2-2026-10-23). Home land is Barnyard (see the note). No longer eligible for dispatch.

- **`adventure-walk`, levels 1–3 (AW2)** (a new game, one subtask; toddler 1, preschool 1–2, pre-K 2–3, school 3, Rainbow Meadow by default): the companion walks to a friend's picnic past three landmarks; she taps one of two glowing ways past each (over, under, through, across, around), then follows the friend's call, then two calls at once with replay. [Definition](definitions/adventure-walk.md), [movement study follow-up](deep-dives/subjects/movement-exercise.md#recommended-follow-ups-requested-2026-10-14)

Proof: new-game tier, as the [definition's check tier](definitions/adventure-walk.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 2, one build). No review gate: screen-only, the companion does the walking; any movement invitation stays on decision 4. The [open decisions](definitions/adventure-walk.md#open-decisions) all have defaults.

### sea-lift 1: Levels 1–3

Built 2026-10-22, branch `claude/sea-lift-1-3`; [closeout](archive/COMPLETED-2026-10-09.md#sea-lift-levels-13-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sea-lift`, levels 1–3 (IN1)** (a new game; school 1–3, Bubble Beach by default): send a glass lift to friends' stops above and below the water line (zero): up or down from the water (1), rides through the water (2), deepest or highest first (3). [Definition](definitions/sea-lift.md), [integers study](deep-dives/subjects/integers.md)

Proof: new-game tier, as the [definition's check tier](definitions/sea-lift.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 2, one build). No review gate: levels 1–3 use only "above/below the water"; the educator gate applies from level 4. The [open decisions](definitions/sea-lift.md#open-decisions) all have defaults.

### sea-lift 2: Levels 4–5

Built 2026-10-27, branch `claude/sea-lift-4-5`, [PR #1005](https://github.com/rjdunlap/neo/pull/1005); [closeout](archive/COMPLETED-2026-10-09.md#sea-lift-levels-45-2026-10-27). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sea-lift`, levels 4–5 (IN2)** (new levels with one new interaction, number cards; school, upper-school content): How far? (number cards for the interval across zero, the magnitude and both-ends mistakes as distractors) at level 4, Twin stops (the opposite across the water; the dock is its own twin) at level 5. [Definition](definitions/sea-lift-4-5.md), [integers study](deep-dives/subjects/integers.md)

Proof: typecheck and unit tests (the properties above plus registry and how-to tests); one scripted play through `browser-check.mjs`'s `sea-lift` case extended to level 4 (one wrong card, one hint, the dimmed card) and level 5 (the dock case, one wrong stop); one portrait screenshot of level 4's card column beside the shaft; `fingerdemo` at levels 4 and 5; `npm run build`, because the voice and how-to files change. [Check tier](definitions/sea-lift-4-5.md#check-tier).

### recipe-workshop 1: Levels 1–3

Built 2026-10-22, branch `claude/recipe-workshop-1-3`; [closeout](archive/COMPLETED-2026-10-09.md#recipe-workshop-levels-13-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`recipe-workshop`, levels 1–3 (C2–C4)** (a new game, one declared batch of three named parts; toddler 1, preschool 1–2, pre-K 2–3, Cozy Village by default): tap pots of pretend fruit mash and a white base into a bowl, mix with the spoon into one blend, add a star or leaf topper and Serve. **C2** level 1, My bowl (free); **C3** level 2, Follow the picture (one of each in either order, then mix); **C4** level 3, Bowls for two (two bowls, each with its own topper). [Definition](definitions/recipe-workshop.md), [cooking study slices C2–C4](deep-dives/subjects/cooking-recipes.md#build-slices-in-order)

Proof: as the [definition's check tier](definitions/recipe-workshop.md#check-tier) sets it: new-game tier for C2, new-interaction tier for C3, new levels plus the bowl-selection control for C4; one `browser-check.mjs` case growing across the three, `fingerdemo` at levels 1–3, one build. If the allowance cannot cover all three, stop after a complete C2 or C3 with a draft-PR checkpoint. No review gate: screen-only pretend food; the [open decisions](definitions/recipe-workshop.md#open-decisions) all have defaults.

### meadow-pens 1: Levels 1–3

Built 2026-10-24, [PR #932](https://github.com/rjdunlap/neo/pull/932); [closeout](archive/COMPLETED-2026-10-09.md#meadow-pens-levels-1-3-slice-1-2026-10-24). No longer eligible for dispatch.

- **`meadow-pens`, levels 1–3 (slice 1)** (a new game, one declared batch; school 1–3, Rainbow Meadow by default): paint squares of grass for a friend's pen while the fence builds itself from a visible stack. Level 1, Enough grass (any connected shape with the squares asked for); level 2, Rows of grass (a field that fills by rows, three cards for the total); level 3, Same grass, new fence (use every piece of a stack of 10, 12 or 14). [Definition](definitions/meadow-pens.md), [area, volume and space study slice 1](deep-dives/subjects/area-volume-space.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/meadow-pens.md#check-tier) sets it (typecheck, unit tests including the rule tests, a new `browser-check.mjs` case filtered to Meadow Pens at levels 1 and 3 with one wrong ring each and a requested hint, plus one wrong card at level 2, `fingerdemo` at levels 1–3, one portrait screenshot at level 3, one build). If the allowance cannot cover all three, stop after a complete level 1 (or 1–2) with a draft-PR checkpoint. Review gate: merges only after the developer approves the [level-2 card table](definitions/meadow-pens.md#level-2-card-table) ([decision 8](definitions/meadow-pens.md#open-decisions)); the build itself may proceed.

### gadget-bench 1: Levels 1–3

Built 2026-10-27, [PR #1012](https://github.com/rjdunlap/neo/pull/1012). No longer eligible for dispatch. Scope retained for reference.

- **`gadget-bench`, levels 1–3 (slice I2)** (a new game, one declared batch; preschool 1, pre-K 1–3, school 2–3, Treehouse by default): a wooden cart with big sockets, a neighbor's pictured need and a short path to Try. Level 1, Which one works? (two finished gadgets differing in one part; try both, give one); level 2, Change one part (the pet's shown cart, a new neighbor, swap or add one part); level 3, Build it (two open sockets, a tray of four, a path of two conditions; position matters). [Definition](definitions/gadget-bench.md), [inventions study slice 2](deep-dives/subjects/inventions.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/gadget-bench.md#check-tier) sets it (typecheck, unit tests including the rule tests, a new `browser-check.mjs` case filtered to Gadget Bench at levels 1–3 with a wrong Give, a free failing Try, a swapped placement and a requested hint, `fingerdemo` at levels 1–3, one portrait screenshot at level 3, one build). If the allowance cannot cover all three, stop after a complete level 1 (or 1–2) with a draft-PR checkpoint. No review gate; the home land is [decision 1](definitions/gadget-bench.md#open-decisions).

### lasso-loops 1: About how many?

Built; [completed scope and proof](archive/COMPLETED-2026-10-09.md#2026-10-22--lasso-loops-about-how-many-estimation-e1).

### lasso-loops 2: Teens, decades and a fresh meadow

- **`lasso-loops`, teens, decades and a fresh meadow (dive slice 1)** (fresh content on the existing interaction; preschool, pre-K, school): level 1's seeded 6–9 fireflies; level 3's 1–3 jars with an occasional no-ones round; level 4's teen, decade and 21–39 mix; the no-ones voice lines and pad choices. Level 6 unchanged. [Dive](deep-dives/lasso-loops.md#build-slices-in-order)

Files expected: `src/games/lasso-loops/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts` only if a step's wording changes, the README row and `docs/GAMES.md`.

Proof: fresh content on the existing interaction: typecheck, the game's rule tests (every plan's fireflies fit one per cell; a teen, a decade and a 21–39 round all occur at level 4 within a few hundred seeds; level 6 still 21–39; pads stay three distinct positive numbers including the answer; no leaf when there are no ones), one filtered regression play of level 4 on a decade seed with one wrong total, `fingerdemo` at 4 (the bot meets a round with no leaf).

### light-lab 1: Fair starts, nearest hints and a sun on either side

- **`light-lab`, fair starts, nearest hints and a sun on either side (dive slice 1)** (existing interaction; pre-K, school): the generator stops handing out nearly solved starts at levels 4–7, the hint follows the nearest solution rather than the built path, and the sun can sit on either side. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts` (reads the sun's side), `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests (starts are not nearly solved at 4–7, the hint always leads to a nearest solution, either sun side is solvable), one filtered regression play at level 6 with a right-hand sun and one hint; `fingerdemo` at 6 only if the bot's play changes.

### light-lab 2: Couch course Sunbeam Run

- **`light-lab`, couch course Sunbeam Run (dive slice 2)**, after batch 1 (couch catalog): a par course of frozen boards with par from batch 1's minimum, the remaining Light Lab par course of roadmap chunk 8. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/couch/` catalog and course entries, the course tests, `docs/COUCH-PLAY.md`.

Proof: couch catalog tier: a frozen board list, course tests, `BROWSER_SUITE=couchgames` filtered to Light Lab.

### light-lab 3: Levels 8–9 Place a mirror and Two to place

- **`light-lab`, levels 8–9 *Place a mirror* and *Two to place* (dive slice 3)** (new interaction; school): she drops a mirror from a tray onto the board so the beam reaches the target, then two mirrors; the school range rises to 9. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 8 with a drop off the board, a missed shine and the glowing cell, level 9 to its sticker, one portrait screenshot with the tray, `fingerdemo` at 8 and 9; stop after 8 if the allowance cannot cover 9.

### light-lab 4: Level 10 Where's the mirror?

- **`light-lab`, level 10 *Where's the mirror?* (dive slice 4)**, after batch 3 (the school range rises past 9): a cloud hides one mirror and she chooses its cell from where the beam goes. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play with one wrong cell and its ghost beam, a second for the glow, then the right cell, one portrait screenshot of the cloud, `fingerdemo` at 10.

### look-it-up 1: Levels 1–3

- **`look-it-up`, levels 1–3 (IR1)** (a new game, one subtask; toddler 1, preschool 1–2, pre-K 2–3, school 3, Barnyard by default): a picture guide of seven real animals (cow, pig, duck, rabbit, brown bear, common frog, African penguin), each page with a fact box of *Eats*, *Where* and *Baby*; touch labels to hear them (level 1), find a hungry visitor's page by its tab and feed it (level 2), find the asked row and help it there (level 3). Turning pages is free; only a wrong food or place given to the animal is a miss. [Definition](definitions/look-it-up.md), [informational-reading study slice IR1](deep-dives/subjects/informational-reading.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/look-it-up.md#check-tier) sets it (typecheck, unit tests including two sources per fact, a new `browser-check.mjs` case at levels 1 and 3 with one wrong food and one hint, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 3, one build). No review gate: the developer chose real animal facts and the table carries its sources.

Built 2026-10-22 (PR #830); see the [build note](archive/COMPLETED-2026-10-09.md#look-it-up-levels-13-2026-10-22).

### photo-safari 1: Tell me which and Tell me both

Built; [completed scope and proof](archive/COMPLETED-2026-10-09.md#photo-safari-batch-1-tell-me-which-and-tell-me-both-2026-10-22).

### timeline-trail 1: Levels 1–3

- **`timeline-trail`, levels 1–3 (T2)** (a new game, one declared batch; preschool 1–2, pre-K 1–3, school 2–3, Barnyard by default): a clothesline between a "long ago" post and a "now" post; level 1 taps the older of two pictures, level 2 drags a third picture into the right of three gaps, level 3 builds a line of four one card at a time; a finished line plays as a flipbook of the place growing. Level 4 (a clue inside the picture) is a later batch on the same game. [Definition](definitions/timeline-trail.md), [time-and-change study slice 2](deep-dives/subjects/time-change.md#build-slices-in-order)

Proof: new-game tier, as the [definition's Check tier](definitions/timeline-trail.md#check-tier) sets it (typecheck, unit tests, one scripted play at levels 2–3, `fingerdemo` at levels 1–3, one portrait screenshot of level 3, one build).

### river-tablets 1: One token each, the envelope and which row

Built 2026-10-27, [PR #1019](https://github.com/rjdunlap/neo/pull/1019); [definition](definitions/river-tablets.md), [archived build note](archive/COMPLETED-2026-10-09.md#river-tablets-levels-13-ancient-river-civilizations-ar2-2026-10-27). Whole three-level new-game batch. Device checks remain; levels 4–6 are defined (AR3) as batches river-tablets 2 and 3.

### river-tablets 2: A ten-mark and check the delivery

Built 2026-10-31, [PR #1044](https://github.com/rjdunlap/neo/pull/1044) (defined 2026-10-30, [PR #1030](https://github.com/rjdunlap/neo/pull/1030)); both levels in one worker, branch and PR; [archived build note](archive/COMPLETED-2026-10-09.md#river-tablets-levels-45-ancient-river-civilizations-ar3-first-part-2026-10-31). The withdraw clause did not apply: level 4 does not play as Lasso Loops with a stamp.

- **`river-tablets`, levels 4–5 (the build of study slice AR3, first part)** (two new interactions on an existing game; school only, `school: { min: 3, max: 5 }` for this batch, appended after `rows` without renumbering): hand in a clay tablet written with a big ten-mark and small ones-marks for crates and loose baskets, any equal longer reading accepted and then shown the shorter way, the yard count and tablet reading free (level 4); say whether a cart is short, right or extra against a tablet written at the farm, then by how many (level 5). Marks are invented island signs; nothing is paid. Files: `src/games/river-tablets/` (logic, art, scene, rule tests), voice lines `rt.*`, the how-to card, the `rivertablets` browser case. Withdraw clause: if level 4 plays as Lasso Loops with a stamp, it becomes a Lasso Loops mode and level 5 still stands. [Definition](definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree), [study build slices](deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/river-tablets.md#levels-46-check-tier-for-the-builds) sets it (typecheck, rule tests, one scripted `rivertablets` play of level 4 with one wrong Hand in and the glow and of level 5 with one wrong number, a portrait screenshot of each, `fingerdemo` at level 5, one build because voice and how-to change).

### river-tablets 3: Two tablets disagree

Ready now that river-tablets 2 is built (defined 2026-10-30, [PR #1030](https://github.com/rjdunlap/neo/pull/1030)). One worker, branch and PR. **Claimed 2026-10-31, branch `claude/river-tablets-disagree`** (files: `src/games/river-tablets/`, the voice script, the how-to card, the `rivertablets` browser case).

- **`river-tablets`, level 6 (the build of study slice AR3, second part)** (a new interaction on an existing game; school only, `school: { min: 3, max: 6 }`): a farm tablet and a storehouse tablet record the same cart and disagree; pick the one that matches, neither, or can't tell, and can't tell is right only when the cart is empty (`gone`). Files: `src/games/river-tablets/` (logic, scene, rule tests), voice lines `rt.*`, the how-to card, the `rivertablets` browser case. Depends on river-tablets 2 for the marks and the lineup. [Definition](definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree), [study build slices](deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/river-tablets.md#levels-46-check-tier-for-the-builds) sets it (typecheck, rule tests, one scripted `rivertablets` play of level 6 with a can't-tell miss and the `gone` case, a portrait screenshot, `fingerdemo` at level 6, one build).

### caravan-days 1: Kneel and load, can we reach it, and day by day

Built 2026-10-27, [PR #1020](https://github.com/rjdunlap/neo/pull/1020); [definition](definitions/caravan-days.md), [archived build note](archive/COMPLETED-2026-10-09.md#caravan-days-levels-13-china-india-and-the-silk-road-cs2-2026-10-27). Whole three-level new-game batch. Device checks remain; levels 4–5 are defined (CS3) as batch caravan-days 2.

### caravan-days 2: Swap at the stop and worth more far away

Built 2026-10-30, [PR #1037](https://github.com/rjdunlap/neo/pull/1037) (defined in [PR #1029](https://github.com/rjdunlap/neo/pull/1029)); [archived build note](archive/COMPLETED-2026-10-09.md#caravan-days-levels-45-china-india-and-the-silk-road-cs3-2026-10-30). One worker, branch and PR for both levels.

- **`caravan-days`, levels 4–5 (the build of study slice CS3)** (two new interactions on an existing game; school only, `school: { min: 3, max: 5 }`, no renumbering): give the camel the good the next stop's bubble wants, one pick of two offers per oasis on a one-way road, Go walks there or back (level 4); tap two three-bale loads to count their shells at the named stop and send the one that brings more, the better load reversing between the far city and the near oasis (level 5). Shells are counters for one case only; nothing accrues. Files: `src/games/caravan-days/` (logic, art, scene, rule tests), voice lines `cd.*`, the how-to card, the `caravandays` browser case. Withdraw clause: if level 4 plays as Swap Meet 4 with a camel, it goes to Swap Meet instead. [Definition](definitions/caravan-days.md#levels-45-cs3-swap-at-the-stop-worth-more-far-away), [study build slices](deep-dives/subjects/china-india-silk-road.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/caravan-days.md#levels-45-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play per level with one miss and asked-for help, a portrait screenshot of each, `fingerdemo` at level 5, one build).

### caravan-days 3: Mountains or sand and a well every day's walk

Defined 2026-10-31 in [PR #1074](https://github.com/rjdunlap/neo/pull/1074); not built. One worker, branch and PR for both levels.

- **`caravan-days`, levels 6–7 (the build of study slice CS4)** (two new interactions on an existing game; school only, `school: { min: 3, max: 7 }`, no renumbering): two roads to one city, the pass road (3–5 one-sun legs plus a drawn snow day, the coat a visible cost) or the sand road (4–6 days), either accepted, she sets a day card (3–7) before Go and a wrong count is the miss (level 6, `pass`); tap sites on a switchback road so no stretch between water exceeds a day's walk of four hoofprint marks, the fewest wells by search, every minimal placement accepted, extra wells accepted (not a miss) with a minimal set ghosted, the hint glowing the farthest site within a day of the first too-long stretch (level 7, `wells`). Files: `src/games/caravan-days/` (logic, art, scene, rule tests), voice lines `cd.*`, the how-to card, the `caravandays` browser case. [Definition](definitions/caravan-days.md#levels-67-cs4-mountains-or-sand-a-well-every-days-walk), [study build slices](deep-dives/subjects/china-india-silk-road.md#build-slices-in-order)

Proof: new-interaction tier (typecheck, rule tests, `caravandays` filtered play of levels 6 and 7, a portrait screenshot of each, `fingerdemo` at levels 6 and 7, one build).

### welcome-ways 1: Levels 1–4

Built; [batch record](archive/COMPLETED-2026-10-09.md#welcome-ways-levels-14-2026-10-24). Levels 5–7 need their own definition.

### little-loom 1: Levels 1–3 (VA2)

Built; [build note](archive/COMPLETED-2026-10-09.md#little-loom-levels-13-va2-2026-10-25). Later levels and person/device gates remain separate.


### swap-meet 1: Levels 1–4 (ME2)

Source: [ME1 packet](definitions/swap-meet.md), money-economy ME2; one declared four-level new-game batch after separate admission.

- Level1 Give it: three sequential authored requests, two basket slots, both objects cross, zero misses.
- Level2 Two friends: either order of two simultaneous requests and visible returned objects.
- Level3 Swap!: two reciprocal pairs among four friends, both pair orders/drag directions.
- Level4 Chain of two: both authored basket/goal chains, exactly two forward exchanges.
- Shared bounded exact Undo, all-reachable-state BFS/recovery/shortest-action hints, intentional offers and capped support, voice/card/four demos, Graphics art/sticker and unique Cozy Village registration with current paged capacity and actual full-size geometry.

Toddler1–2, preschool2–3, prek3–4, school4. No lap/grownup, levels5–6, persistent currency/unlocks/inventory, other money games or practical cards. Preserve source/contract review before code, all-state rule proof, filtered first/top/miss/help/Undo plus levels2/3 layout and all demo coverage, portrait screenshot and build for shared registry/voice/land changes. Actual land/control layouts and person/device acceptance are separate evidence. Split into named complete parts before claiming if the whole batch cannot fit; never silently drop a level.

### village-vote 1: Levels 1–3 (CC4)

Built2026-10-26, [PR #983](https://github.com/rjdunlap/neo/pull/983); [packet](definitions/village-vote.md), [archived build note](archive/COMPLETED-2026-10-09.md#village-vote-levels-13-cc4-2026-10-26). Whole three-level new-game batch. Person/device checks and CC5 play gate remain.

### keep-house 1: Who's at the door, who works where, the cook's walk and fit the household

Built 2026-10-27, [PR #1021](https://github.com/rjdunlap/neo/pull/1021); [definition](definitions/keep-house.md), [archived build note](archive/COMPLETED-2026-10-09.md#keep-house-levels-14-medieval-life-ml2-2026-10-27). Whole four-level new-game batch. Device checks remain; levels 5–6 are built as batch keep-house 2.

### keep-house 2: Read the ruin and stone or timber

Built 2026-10-31, [PR #1038](https://github.com/rjdunlap/neo/pull/1038) (defined 2026-10-30, [PR #1034](https://github.com/rjdunlap/neo/pull/1034)); [archived build note](archive/COMPLETED-2026-10-09.md#keep-house-levels-56-medieval-life-ml3-2026-10-31). Both levels in one worker, branch and PR. Device checks remain.

- **`keep-house`, levels 5–6 (the build of study slice ML3)** (two new interactions on an existing game; school only, `school: { min: 4, max: 6 }`, no renumbering): drag picture labels onto the roofless rooms of a 3 × 3 ruin by their remains, four rooms and five labels, a hearth or drain shared by two rooms so a deciding clue decides, a wrong label is a miss (level 5); build a lord's hall in timber (2 bags, lasts 15 years, rebuilt) or stone (5 bags, 8 years, stands) for a purse and a stay, the years play out and a choice is never a miss, in level 3's Keep it grammar (level 6). Bags are counters; nothing accrues. Files: `src/games/keep-house/` (logic, art, scene, rule tests), voice lines `kh.*`, the how-to card, the `keephouse` browser case. Withdraw clause: if level 6 plays as a worksheet, it goes to Household Casebook instead. [Definition](definitions/keep-house.md#levels-56-ml3-read-the-ruin-stone-or-timber), [study build slices](deep-dives/subjects/medieval-life.md)

Proof: new-interaction tier, as the [definition's check tier](definitions/keep-house.md#levels-56-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play per level with misses and Keep it twice and the glow, a portrait screenshot of each, `fingerdemo` at levels 5 and 6, one build).

### water-road 1: Keystone, which one stands and hold it up

Built 2026-10-27, [PR #1022](https://github.com/rjdunlap/neo/pull/1022); [definition](definitions/water-road.md), [archived build note](archive/COMPLETED-2026-10-09.md#water-road-levels-13-greece-and-rome-am2-2026-10-27). Whole three-level new-game batch. Device checks remain; levels 4–5 are defined (AM3) as batch water-road 2.

### water-road 2: Downhill all the way and over the valley

Built 2026-10-31, [PR #1043](https://github.com/rjdunlap/neo/pull/1043) (defined in [PR #1035](https://github.com/rjdunlap/neo/pull/1035)); both levels in one worker, branch and PR. [Archived build note](archive/COMPLETED-2026-10-09.md#water-road-levels-45-greece-and-rome-am3-2026-10-31).

- **`water-road`, levels 4–5 (the build of study slice AM3)** (two new interactions on an existing game; `prek: { min: 2, max: 4 }`, `school: { min: 3, max: 5 }`, no renumbering): pre-K picks one of two whole channels and school sets two piers with up and down arrows, then **Open the spring** is the commit and a pooled opening is one miss (level 4); school drags arches across 3–4 spans with an abutment on each earth end, one end usually rock, under the arcade rule (level 5). Files: `src/games/water-road/` (logic, art, scene, rule tests), voice lines, the how-to card, the `waterroad` browser case. Rain Garden and Welcome Ways boundaries are recorded in the [definition](definitions/water-road.md#levels-45-am3-downhill-all-the-way-over-the-valley). [Definition](definitions/water-road.md#levels-45-am3-downhill-all-the-way-over-the-valley), [study build slices](deep-dives/subjects/ancient-mediterranean.md)

Proof: new-interaction tier, as the [definition's check tier](definitions/water-road.md#levels-45-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play covering pre-K level 4, school level 4 and level 5 with their misses and hints, a portrait screenshot of level 5, `fingerdemo` at levels 4 and 5, one build).

### paint-mixer 1: Copy the row and twice as much

- **`paint-mixer`, levels 1–2 (study slice 2)** (**built 2026-10-27**, PR #1026; a new game, one declared batch; school 1–2, Counting Cove by decision 3 if the lands test passes, else Rainbow Meadow): tap a pot to pour a drop into the bucket and copy the sample jar's row of drops (1:1, 1:2, 2:1 of an authored pair; level 1), then make twice as much as two rows of the sample (level 2; "more, the same way" is not a miss). Pots, the mean-colour rule and its measured distances, the drop rows, Undo, Tip out, Check, one glow and ghost pour per bucket. [Definition](definitions/paint-mixer.md), [ratio and proportion study slice 2](deep-dives/subjects/ratio-proportion.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/paint-mixer.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Paint Mixer with one wrong Check and the glow at level 1 and "more, the same way" then a match at level 2, `fingerdemo` at level 2, one portrait screenshot, one build). The "for every" wording is source-checked in the building session. If the allowance cannot cover both, stop after a complete level 1 with a draft-PR checkpoint. No review gate.

### paint-mixer 2: Fill to the line and any amount

- **`paint-mixer`, levels 3–4 (study slice 3)** (after batch `paint-mixer 1`; school 3–4): fill the bucket to a line two or three batches deep while the ratio table fills a column per complete batch and the pet says "for every 1 red, 2 yellow" (level 3, a stray pot on screen), then any whole multiple of the sample and the same colour again at a different amount (level 4; "the same way" is not a miss). [Definition](definitions/paint-mixer.md), [study slice 3](deep-dives/subjects/ratio-proportion.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of levels 3–4 with the table filling, one wrong Check, a first way, the same way again and a second way, `fingerdemo` at level 4, one portrait screenshot of level 3, one build for the card and voice). Levels 5–6 (RP2) need their own definition.

### spinner-fair 1: Spin, see and pick

**Status: built 2026-10-31, PR #1058.**

- **`spinner-fair`, levels 1-3 (chance-statistics study slice CS1)** (a new game, one declared batch; preschool 1-2, pre-K 2-3, school 3-5; Counting Cove, 13 games becoming 14, so the land now pages): tap a big spinner and a critter's block drops on its bar, six spins with nothing counted (level 1), then which came up most (level 2), then pick the spinner that gives the pet the better chance and watch ten spins; a spin is never a miss and the better spinner may lose (level 3). [Definition](definitions/spinner-fair.md), [study build slices](deep-dives/subjects/chance-statistics.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/spinner-fair.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Spinner Fair with level 1 to its sticker and level 3 with one wrong pick, the glow on the second and ten spins, one portrait screenshot of level 3, `fingerdemo` at level 3, one build). Device checks stay open. Levels 4-5 are batch `spinner-fair 2`; levels 6-10 need their own definitions.

### spinner-fair 2: Sure, maybe, no way and make it fair

- **`spinner-fair`, levels 4-5 (chance-statistics study slice CS1)** (after batch `spinner-fair 1`; pre-K and school ranges as the definition sets): drag cards onto *sure*, *maybe* and *no way* spinners (level 4), then hand wedges from one critter to the other to make an unfair race fair, with a wrong *fair* and an uneven Check answered gently and the race run honestly (level 5). [Definition](definitions/spinner-fair.md), [study build slices](deep-dives/subjects/chance-statistics.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 4 with one card on the wrong spinner and level 5 with a wrong *fair*, an uneven Check, two wedge moves and the race, one portrait screenshot of level 5, `fingerdemo` at levels 4 and 5, one build for the card and voice).

### tide-line 1: Come in, go out and stop at the line

**Built 2026-10-31** ([PR #1059](https://github.com/rjdunlap/neo/pull/1059)); levels 3-4 are batch `tide-line 2`.

- **`tide-line`, levels 1-2 and the shore art kit (oceans study slice 1)** (a new game, one declared batch; lap 1, toddler 1-2, preschool 2; Bubble Beach, 12 games becoming 13, fallback Counting Cove only if the lands test fails): pull the big wave up the sand and let it slide back while the shore answers, with nothing wrong (level 1); then drag a pail above the seaweed line and only then watch the sea come in, a floated pail fetched back by the pet (level 2). The shared `src/art/shore.ts` creatures, `sfx.wave` and `sfx.gull` ship here. [Definition](definitions/tide-line.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/tide-line.md#check-tier-for-the-builds) sets it (typecheck, rule tests for levels 1-2 with the registry, lands, how-to, off-screen and `beach.test.ts`, a `browser-check.mjs` case filtered to Tide Line with level 1 to its sticker and level 2 with one pail below the line, the float and fetch, a second miss and the glow, then a dry pail, one portrait screenshot of level 2, `fingerdemo` at level 2, one build). Device checks stay open. Levels 3-4 are batch `tide-line 2`; levels 5-7 need their own definition.

### tide-line 2: Read the line and in, out, in, out

- **`tide-line`, levels 3-4 (oceans study slice 1)** (batch `tide-line 1` built; preschool 2-3 and pre-K 3-4 ranges as the definition sets): with the sea out, read the seaweed line to place a pail, a flag and a towel and tap the wave, the second round with a higher windy-day line that the sea reaches (level 3); then complete a four-picture strip of in, out, in, out from three cards, one the in-between picture (level 4). [Definition](definitions/tide-line.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 3 round 2 with a thing between the lines and level 4 with one wrong card and the glow, one portrait screenshot of level 4, `fingerdemo` at levels 3 and 4, build only if shared files change).

### rule-machine 1: The hat machine and one more goes in

- **`rule-machine`, levels 1-2 (algebra-balance study slice AB1)** (a new game, one declared batch; pre-K 1, school 2; Puzzle Peaks, 13 games becoming 14, so the land now pages): creatures go into a hat machine and come out wearing a hat, and she taps what the fourth will look like from three pictures (level 1); then cars with counters go in and come out with one or two more, and she taps the count on the pads once two rows show; feeding is never a miss and a first wrong prediction on a new rule is free (level 2). [Definition](definitions/rule-machine.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/rule-machine.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Rule Machine with level 1 given a free wrong picture and then two wrong on the second prediction and the glow, level 2 to its sticker with one wrong pad after two rows, one portrait screenshot of level 2, `fingerdemo` at level 2, one build). Device checks stay open. Levels 3-4 are batch `rule-machine 2`; levels 5-8 need their own definitions.

### rule-machine 2: The rule shelf and the covered machine

- **`rule-machine`, levels 3-4 (algebra-balance study slice AB1)** (after batch `rule-machine 1`; school range as the definition sets): name the machine's rule from a shelf of three cards after three rows (+2, +3, -1; level 3), then with the machine covered choose which cars to feed so the table tells the cards apart, with Peek as a requested hint, a trap car that tells nothing new and a ruled-out card counted gently (level 4). [Definition](definitions/rule-machine.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 3 with a wrong card and level 4 with a trap car first, a still-open card tap that counts nothing, a ruled-out card, Peek and the last prediction, one portrait screenshot of level 4, `fingerdemo` at levels 3 and 4, one build for the card and voice).

### puppet-stage 1: Pop up, make Bunny talk and say it like

**Built 2026-10-30** (PR #1028): levels 1–3 of `puppet-stage`; levels 4–6 (TP2) need their own definition.

- **`puppet-stage`, levels 1–3 (study slice 2)** (a new game, one declared batch; lap 1, toddler 1–2, preschool 2–3, pre-K 3; Music Mountain by decision 2, six games becoming seven, one page): touch the stage floor and a stick puppet rises there, says hello in its own voice and follows her finger, a tap bobs it and talks again (level 1, nothing counted); the pet names a puppet or a voice and she makes that one talk (level 2, by name, then by voice); one puppet holds a line and she chooses the sleepy, tiny or big way to say it (level 3, a free try first). Puppet voices are device-speech `pitch`/`rate` presets through a new `voice.sayIn`/`ctx.sayIn`, the one small shared change; nothing is kept. [Definition](definitions/puppet-stage.md), [study build slices](deep-dives/subjects/theatre-puppetry.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/puppet-stage.md#check-tier-for-the-build) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `sayIn` unit test, a `browser-check.mjs` case filtered to Puppet Stage covering levels 1–3 with one wrong puppet and the glow, `fingerdemo` at level 3, one portrait screenshot, one build). The listening judgement is a device check on the built game, not a build blocker. Levels 4–6 (TP2) need their own definition.

## Relay Woods 1: levels 1–4 (NC2)

- **Scope:** [NC1 packet](definitions/relay-woods.md), one worker/branch/PR for Pass it along1, Two ways2, Fallen log3, The short way4; finite seeded templates and five picture payloads, hop/backtrack/log/long-arrival/reset rules, capped support, voice/how-to/BFS bot. Toddler1–2, preschool1–4, pre-K2–4, school4.
- **Admission:** separate from docs NC1; current contract/source review and overlap required. Cozy Village after actual current full-size capacity/layout checks, else existing Story Grove with its own checks; no count increment before build. Existing optional picture Keep, no mailbox/save architecture.
- **Proof:** independent rule tests/typecheck; filtered first/top wrong/help play plus branch/log recovery, all4 demos and dense portrait screenshot; build for shared catalog/card/voice. Relevant Keep/backup/offline and world proof for actual persistence/navigation changes. Record tested commit/filter/URL; stop servers. Person/device recognition/reach/speech/child response remains unestablished.
- **Out:** NC3+, pieces, privacy, locks, resilience, Relay Cases, story, practical family card, real network/contact/safety. No outside reviewer approval invented; October23 source-check rule applies.

### drops-journey 1: Where can the drop go, send it to the snow and can it go there

- **`drops-journey`, levels 1-3 (weather-water study slice 8)** (**built 2026-10-31**, [PR #1066](https://github.com/rjdunlap/neo/pull/1066), branch `claude/drops-journey-1-3`; a new game, one declared batch; preschool 1, pre-K 1-2, school 2-3; Tinker Lab): tap a picture card to send a water drop to a lawful next stop among five places, finishing after three stops (level 1); reach a postcard goal such as the snow by any lawful route, with the pet replaying the story (level 2); then one uphill can't-go card is a miss, with a glow after two (level 3). [Definition](definitions/drops-journey.md), [study build slices](deep-dives/subjects/weather-water.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/drops-journey.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 to its sticker and level 3 with one can't-go card, the glow and its hint, then Finish, one portrait screenshot of level 2 mid-move, `fingerdemo` at levels 1 and 3, one build). The building session's source check of the speech lines goes in its verification entry. All three levels shipped; proof is in [VERIFICATION](archive/VERIFICATION-2026-10-31.md#2026-10-31--drops-journey-levels-13-weather-water-slice-8). Device checks stay open.

### sprout-shuffle 1: which pairs always make spotted

- **`sprout-shuffle`, level 4 *which pairs always make spotted?*** (new level on the existing interaction; school; the first build of Hidden Sprouts, genetics G5, whose levels 5 and 6 follow as later complete parts): choose which parent pairs guarantee a spotted sprout and keep every explanation compatible with what was seen. Scope, rules and the school range are in the [definition](definitions/hidden-sprouts.md); depends on Sprout Shuffle levels 1–3, built 2026-10-30.

Proof: new-levels tier, as the [definition's checks](definitions/hidden-sprouts.md#checks-for-the-builds) set it (typecheck, the rule tests, one browser play of level 4, `fingerdemo` at 4). Device and person checks stay open there.

### sprout-shuffle 2: Patchwork Conservatory

- **`sprout-shuffle`, levels 7–8 Patchwork Conservatory** (genetics G7; a new interaction on the same game, school and up; level 7 one accepted pair with a trap plant, level 8 two accepted plans plus a free "Another way?"): plan a cross guaranteed to satisfy a two-trait planting brief over two explicitly independent toy loci. [Definition](definitions/patchwork-conservatory.md). Depends on Sprout Shuffle level 6 (Hidden Sprouts, [definition](definitions/hidden-sprouts.md)) being built.

Proof: new-interaction tier, as the [definition's checks](definitions/patchwork-conservatory.md#checks-for-the-builds) set it (typecheck; unit tests for the rule properties, how-to and registry; one filtered scripted play of level 7 with a Check on `AA bb` × `Aa Bb`, a second miss and the glow, then the accepted pair, and of level 8 with both plans found; one portrait screenshot with a lens open; `fingerdemo` at 7 and 8; build). Device and person checks stay open there.

### forecast-detective 1: Which way is the wind and a postcard didn't come

- **`forecast-detective`, levels 1-2 (weather-water study slice 9)** (**built 2026-10-31**, [PR #1069](https://github.com/rjdunlap/neo/pull/1069), branch `claude/forecast-detective-1-2`; a new game, one declared batch; school 1-2; Tinker Lab, fallback Cozy Village): lift covered flaps on a wind vane, two island postcards and a thermometer, work out which weathers a disclosed pretend wind rule still allows, and answer with one weather card (level 1); then one clue is missing, so she names the weather when the rest still decide or taps *Can't tell yet* when they cannot (level 2). [Definition](definitions/forecast-detective.md), [study build slices](deep-dives/subjects/weather-water.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/forecast-detective.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 using one not-yet Check, one ruled-out Check, a second miss for the glow and its hint, then the right card to the sticker, and level 2's authored case with an overclaimed weather then *Can't tell yet*, one portrait screenshot of level 2 with the missing flap and five cards, `fingerdemo` at levels 1 and 2, one build). The building session's source check of the speech lines goes in its verification entry. Both levels shipped; proof is in [VERIFICATION](archive/VERIFICATION-2026-10-31.md#2026-10-31--forecast-detective-levels-12-weather-water-slice-9). Device checks stay open.

### drift-cards 1: Where will it wash up and send it to a friend

- **`drift-cards`, levels 1–2 (oceans study slice 6)** **built 2026-10-31**, [PR #1078](https://github.com/rjdunlap/neo/pull/1078), branch `claude/drift-cards-1-2`; a new game, one declared batch; school 1–3; Bubble Beach, fallback Tinker Lab): predict which beach each of three numbered wooden cards reaches as it rides the arrows of a pretend current map (level 1); then choose which boat to drop from so the card reaches the asked friend (level 2). [Definition](definitions/drift-cards.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/drift-cards.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 using the free first card wrong, one counted wrong beach, a second miss for the glow, then the right beach, and level 2 with one wrong boat then a right boat, one portrait screenshot of level 2 mid-drift, `fingerdemo` at level 2, one build). The building session's source check of the speech lines goes in its verification entry. If the allowance cannot cover both levels, stop after a complete level 1 with a draft-PR checkpoint. Device checks stay open.

### drift-cards 2: Find the hidden current

- **`drift-cards`, level 3 (oceans study slice 6)** (a new interaction on the same game, school 1–3): a fogged patch of the sea and two or three returned cards; choose which of three patches fills the fog so every card lands where it was found, with a replay. [Definition](definitions/drift-cards.md). Depends on batch drift-cards 1 being built.

Proof: new-interaction tier, as the [definition's check tier](definitions/drift-cards.md#check-tier) sets it (typecheck; rule tests 6–9; one filtered play of the authored case with option B, option C and the glow, then option A and the replay; one portrait screenshot with the fog and three patch cards; `fingerdemo` at level 3; a build for the card and voice). Device and person checks stay open there.

### not-always 1: Not all of them, Every one? and Say it better

- **`not-always`, levels 1–3 (philosophy-reasoning study slice 1, PR1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Story Grove, fallback Puzzle Peaks): a friend on a crate makes a claim about a row of picture cards; tap the card that breaks it (level 1); tap a breaker or stamp *Every one!* when nothing breaks the claim (level 2); break the claim, then pick the mended claim true of every card (level 3). [Definition](definitions/not-always.md), [study build slices](deep-dives/subjects/philosophy-reasoning.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/not-always.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands and how-to, a `browser-check.mjs` case with its README row: level 1 with one fitting card then a second for the glow and the breaker, level 2 with a false stamp then a true claim stamped, level 3 with one false mend then the true one, one portrait screenshot of level 2, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint. Person and device checks stay open.

### notice-board 1: Who made it, who saw it, to tell or to sell

- **`notice-board`, levels 1–3 (media-literacy study slice 1, ML1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Cozy Village, fallback Tinker Lab): island friends pin made-up picture posters to a village board; tap the friend whose badge matches the poster's stamp (level 1); tap the friend who actually saw it and their photo settles the poster (level 2); sort each poster into *Here's what happened* or *Come and get some!* (level 3, school only). [Definition](definitions/notice-board.md), [study build slices](deep-dives/subjects/media-literacy.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/notice-board.md#check-tier) sets it (typecheck, rule tests 1–7 with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case with its README row: level 1 with two wrong friends for the glow then the maker, level 2 with the heard-it friend (a miss) then the witness through one stretched and one true poster, level 3 with one wrong basket then the right one, one portrait screenshot of level 2 with the memory bubbles and the photo, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint. Person and device checks stay open.

### shell-rows 1: Finish the row, stop the row, win first

- **`shell-rows`, levels 1–3 (strategy-games study slice 1, SG1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Puzzle Peaks, paging, fallback Bubble Beach): a 3 by 3 grid in wet sand with a match already under way; set one shell to finish her row (level 1), to stop the pet's row (level 2), or to win first when both rows are on the board (level 3); a wrong square is answered by the pet's honest reply, then the board rewinds. [Definition](definitions/shell-rows.md), [study build slices](deep-dives/subjects/strategy-games.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/shell-rows.md#check-tier-for-the-build) sets it (typecheck, rule tests with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case: level 1 with one wrong square then a second for the glow and its hint then the right square to the next position, level 3 with the block then the right square to its sticker, one portrait screenshot of level 3 mid-replay, `fingerdemo` at levels 1 and 3, one build). Person and device checks stay open.

### orchard-rows 1: Equal rows, every way, only one long row

- **`orchard-rows`, levels 4–6 (number-structure study slice 2, the build of NS1)** (extends the built game, new-interaction tier; school 4–6, Barnyard unchanged; Counting Cove / Puzzle Peaks as the game already sits): a basket of 12 to 24 saplings and a row-count control; the saplings deal into equal rows at once and the leftover stays in the basket; find a row count with none left over (level 4), plant every different orchard one basket can make (level 5), find the one of three baskets that only makes one long row (level 6, a separate *One long row* button as the answer). [Definition](definitions/orchard-rows.md), [study build slices](deep-dives/subjects/number-structure.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/orchard-rows.md#check-tier-for-the-build) sets it (typecheck, the rule tests with registry, lands, how-to and off-screen tests, a `browser-check.mjs` filter: level 4 with Plant on a leftover, a second for the glow and its hint, then the glowing arrow to Plant; level 5 with one shape planted twice (free); level 6 with one wrong basket claimed, then the prime; one portrait screenshot of level 5 at one long row of its basket; `fingerdemo` at levels 4, 5 and 6; one build). If the allowance cannot cover all three levels, stop after complete levels 4–5 with a draft-PR checkpoint; level 6 is then its own run. Person and device checks stay open.

### thought-bubbles 1: What does she want, Where will he look, How do we know

- **`thought-bubbles`, levels 1–3 (literature-meaning study slice 1, LM1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Story Grove, paging, fallback Cozy Village): a tiny picture story plays on a cottage stage, then she drags one of three picture cards into a friend's empty thought bubble and the friend acts on it; what the friend wants (level 1), where he will look from what he saw (level 2, away or watching stories), why he did it and where the picture shows it (level 3). [Definition](definitions/thought-bubbles.md), [study build slices](deep-dives/subjects/literature-meaning.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/thought-bubbles.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands and how-to, a `browser-check.mjs` case with its README row: level 1 with one wrong card, a second for the glow, then the right card; level 2 with the actual place in an away story then the right card, and a watching story answered right; level 3 with one wrong reason then the right one, one free region tap, then the clue; one portrait screenshot of level 2, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint. Person and device checks stay open.

### maker-lane 1: Along the lane, who can use it now, where did it begin

- **`maker-lane`, levels 1–3 (food-fiber-systems study slice 1, FS1)** (a new game, one declared batch; toddler 1, preschool 1–2, pre-K 2–3, school 2–3; Cozy Village, fallback Painted Canyon): a bundle changes form at each maker's stall until it is a scarf, a sock, a loaf or a box; she sends it along and the maker works (level 1), chooses which maker can use the bundle now, a maker who cannot showing the form they need (level 2), then starts from a finished thing and picks where it began, a wrong beginning run down the lane to the different thing it makes (level 3). [Definition](definitions/maker-lane.md), [study build slices](deep-dives/subjects/food-fiber-systems.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/maker-lane.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case with its README row: level 1 with a tap on a maker who is not waving (free) then the waving makers to the pet; level 2 with two refused makers on the first bundle then the right makers; level 3 with one wrong card then the right one; one portrait screenshot of level 2 with a thought bubble up, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint. Person, device and review checks stay open.

### lemonade-stand 1: Two lemon boats

- **`lemonade-stand`, level 5 Two lemon boats, with the co-play hint (dive slice 1)** (extends the built game, new-interaction tier; school; Cozy Village unchanged): each morning two boats offer lemons with the same lemons or the same shells ("2 for 1" vs "2 for 2", "4 for 2" vs "2 for 2"); she taps the cheaper boat, then chooses a batch and a price as level 4 does, at the chosen boat's lemon price. A dearer boat is a gentle boing, a spoken "for 2 lemons" comparison and one counted miss; two misses that morning glow the cheaper boat and count one hint, and a day counts at most one hint whether from the glow or the lightbulb. Batch and price stay experiments. `batchCost`, `bestChoice` and `forecastChoice` take a lemon price; `helps()` gains a boat line and `insight()` the savings; voice lines `lemon.boat.*`; adds the game's `coplayHint` (weather reporter and first friend). [Dive](deep-dives/lemonade-stand.md#build-slices-in-order), [ladder](deep-dives/lemonade-stand.md#proposed-ladder)

Files expected: `src/games/lemonade-stand/logic.ts`, `logic.test.ts`, `index.ts`, `art.ts`, `src/content/voice-script.ts`, `src/content/howto.ts` (a step scoped `{ from: 5 }`), `scripts/browser/suites/woods-batch.mjs`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier, as the [dive's slice 1](deep-dives/lemonade-stand.md#build-slices-in-order) sets it (typecheck; unit tests for the offer pool, no-loss and affordability with the cheaper boat, true comparisons and the savings insight; one scripted play `BROWSER_SUITE=woods WOODS_ONLY=lemon` at level 5 with one wrong boat, a second for the glow, then the right boat, and the lightbulb on a different day, so the round pays 2 misses and 2 hints; one portrait screenshot of the jetty; `fingerdemo` at level 5). Build only if shared files change. Person and device checks stay open.

### pixel-pictures 1: Fresh pictures and colour logic

- **`pixel-pictures`, fresh pictures and colour logic (dive slice 1)** (extends the built game; preschool to school, no new level): level 2 pool 3 → 6 two-colour 5×5 pictures (strawberry, duckling, mushroom) and level 6 pool 2 → 5 two-colour 6×6 pictures (sun, frog, fish), each accepted only if `colorLineSolvable` solves it (same-colour runs need a gap, different colours may touch, matching `colorRuns`); the level-6 hint and ghost finger use the colour deduction as levels 4–5 use `deduce`; a strict pool-larger-than-shown test. A picture that fails the check leaves the level-6 pool and a new one replaces it. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#proposed-ladder)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `scripts/browser/suites/woods-batch.mjs` only if the level-6 case needs an update, and `docs/GAMES.md`.

Proof: typecheck and the game's rule tests (pool sizes, solvability, hint leads to a settled square); one filtered regression play of level 6 (the `woods` suite's Pixel Pictures 6 case) and `fingerdemo` at 6. Person and device checks stay open.

### pixel-pictures 2: Both ways and Twice as big

- **`pixel-pictures`, level 7 Both ways and level 8 Twice as big (dive slice 2, after batch 1)** (new levels on an existing interaction; school): level 7 copies a drawn 6×6 quarter across two mirror lines into the other three (`PixelMode` gains `mirror2`; `pixel.notmirror2`, hint glows an open square whose mirror is drawn); level 8 copies a 3×3 model at double size into 2×2 blocks (`scaleUp(p, 2)`; `pixel.notbig`, hint glows one block). Authored four-fold pictures and five 3×3 models; how-to steps scoped from 7; bot through `pixelTouch`. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#proposed-ladder)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the suite case, the README row and `docs/GAMES.md`.

Proof: new levels tier: typecheck and rule tests (symmetry, quarter determines the rest, aligned blocks, hint and bot never wrong); one browser play of level 8 with one wrong square and the glow, a level-7 case in the same filtered run, `fingerdemo` at 7 and 8, one portrait screenshot of level 8. Stop after level 7 if the allowance cannot cover 8.

### pixel-pictures 3: Two colours, small

- **`pixel-pictures`, level 9 Two colours, small (dive slice 3, after batch 2)** (new level; preschool and pre-K, placed between 1 and 2 by `order`: 1, 9, 2, …): four new 4×4 two-colour pictures (ladybird first), picked as level 2 picks (`pixel.notcolor`); per-band `order` lists every ID once, `entryLevels` unchanged. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#easier-entries-and-levels-between-existing-ones)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests (4×4 with exactly two colours, `order` complete, entry level 1); one browser play of level 9 and `fingerdemo` at 9.

### pixel-pictures 4: My own picture

- **`pixel-pictures`, level 10 My own picture (dive slice 4, after batch 3)** (new interaction; pre-K and school, last in each band's order as a free level): a blank 5×5 with four swatches, a tap on a filled square empties it, a Done button (at least 100 units) appears after four squares; no misses or hints; the kept creation uses the existing pixel shape; adds a `coplayHint`; the demo shows the bot drawing a heart. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#easier-entries-and-levels-between-existing-ones)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests (fewer than four squares cannot finish, kept creation equals the board); one scripted play to Done with a kept design, one portrait screenshot, `fingerdemo` at 10; the `creations` suite filtered to Pixel Pictures only if the kept shape changes. Person and device checks stay open.

### ferry-jam 1: Fair hints and fuller harbors

- **`ferry-jam`, fair hints and fuller harbors (dive slice 1)** (existing interaction; pre-K and school, no new level): the progress-based `stuck` hint replaces the raw slide count, harbors fill each plan's range (the pools now sit at the bottom of it) with a strict pool test, and a `coplayHint` adopts the Penguin Slide/Ferry Jam co-play split. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, `docs/GAMES.md`.

Proof: typecheck and the game's rule tests; one filtered regression play of level 6 that wanders (a loop of slides earns one hint) and one that progresses on a longer route (no hint). The bot is unchanged, so no `fingerdemo`. Person and device checks stay open.

### ferry-jam 2: Rocks in the harbor

- **`ferry-jam`, level 7 Rocks in the harbor (dive slice 2)** (new level on the existing drag; school): rocks that never move share the harbor; every rock must matter and `focusPath` must still reach every boat; a rounded grey `Graphics` boulder with a foam ring drawn from existing palette colours. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new level tier: typecheck, rule tests (every rock matters, `focusPath` reaches every boat); one browser play of level 7 with a drag on a rock, `fingerdemo` at 7, one portrait screenshot.

### ferry-jam 3: Two ferries

- **`ferry-jam`, level 8 Two ferries (dive slice 3, after batch 2)** (new rule on the existing drag; school): two ferries leave by two docks, so the plan serves both; shares the `Harbor` and `parse` changes with batch 2. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new rule tier: typecheck and rule tests; one play of level 8 to its sticker with the yellow ferry sailing first, `fingerdemo` at 8, one portrait screenshot of the bottom dock.

### ferry-jam 4: Pre-K entry and who's in the way

- **`ferry-jam`, levels 9 and 10 Pre-K entry and Who's in the way (dive slice 4)** (level 9 an easier entry with one slide; level 10 a new tap step naming the boat in the way; pre-K and school): per-band `order` and `entryLevels` as the dive sets them, and level 10's blocker question with its glow after two wrong taps. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests (order, entry and landing); one scripted play of level 9 and of level 10 with one wrong tap, a second for the glow, then the blocker; `fingerdemo` at 9 and 10; one portrait screenshot of level 10's question. Person and device checks stay open.

### garden-rows 1: Seeded flower sets and Mend the bed

- **`garden-rows`, seeded flower sets and level 7 Mend the bed (dive slice 1)** (existing interaction, new level; school): F1 seeded flower sets and level 7 Mend the bed as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck and Garden Rows rule tests (the F1 and Mend the bed assertions in the dive); one browser play of level 7 with one wrong replant and the glow, and level 3 with a non-default flower set; `fingerdemo` at 7. Person and device checks stay open.

### garden-rows 2: Hedge boxes

- **`garden-rows`, levels 8–9 Hedge boxes (dive slice 2, after batch 1)** (new rule on the existing interaction, new drawing; school): shares `PLANS` and the school range with batch 1, as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests; one play of level 8 with a box clash and one of level 9 to its sticker; one portrait screenshot of the hedges; `fingerdemo` at 9. Person and device checks stay open.

### garden-rows 3: One row

- **`garden-rows`, level 10 One row, preschool opening (dive slice 3, after batch 1)** (new band; adds `order`/`entryLevels` to the same `LEVELS`), as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/lands.ts` or registry tests as needed, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck and unit tests including the lands and registry band tests; one play of level 10 at preschool; `fingerdemo` at 10; the preschool Puzzle Peaks page screenshot. Person and device checks stay open.

### habitat-helpers 1: Equivalent pieces and pooled gardens

- **`habitat-helpers`, equivalent pieces and pooled prediction gardens (dive slice 1)** (existing interaction; preschool to school, no new level): four new pieces so each role has two pictured options, seeded per-role picks at levels 1–3, and six pooled level-4 gardens. [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck and the game's rule tests; one filtered regression play at level 3 and level 4 with a non-default seed (the new cards visible, one incomplete test) and one portrait screenshot of level 3. The bot rule is unchanged, so `fingerdemo` only if its play changes; one build for the new art.

### habitat-helpers 2: Something changed

- **`habitat-helpers`, level 7 Something changed (dive slice 2)** (new interaction; school 4–7): a working garden loses one need and she names which need is missing and restores it; the need question is the game's first counted miss; satisfies the ecosystems study's F3 definition. [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck and rule tests; one scripted play of level 7 with one wrong need, a second for the glow, then the right need, one non-restoring card and the right one; one portrait screenshot with the before card; `fingerdemo` at 7; one build. Level 7 at pre-K stays a person check.

### habitat-helpers 3: The rocky shore

- **`habitat-helpers`, levels 8–9 The rocky shore (dive slice 3, after batch 2)** (new interaction; school 4–9): who lives high and who lives low on a rocky shore, decided by needs rather than trivia; shares the level table and the bot rule with batch 2. [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck and rule tests; one scripted play of level 8 with the anemone on the high rock first and level 9 to its sticker; one portrait screenshot of the shore; `fingerdemo` at 8 and 9; one build.

### inchworm 1: Fresh things and the broken ruler

- **`inchworm`, fresh things and the broken ruler (dive slice 1)** (existing interaction; school): five new things with voice words, the long-jump round at level 3, and level 8 *The broken ruler* (school order `[1, 2, 7, 3, 4, 8, 5, 6]`, school max 8). [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 with the end-mark pad, a second miss for the glow, then the right pad; one level-3 play with a long-jump round; `fingerdemo` at 8; one portrait screenshot of the broken ruler; one build for the new art.

### inchworm 2: One worm, hop by hop

- **`inchworm`, level 9 One worm, hop by hop (dive slice 2, after batch 1)** (new interaction; school): shares the order and the `THINGS` list with batch 1; school order `[1, 2, 7, 9, 3, 4, 8, 5, 6]`. [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests, one play of level 9 with one wrong count, a second for the glow, then the right pad; one portrait screenshot mid-hop; `fingerdemo` at 9.

### inchworm 3: Longer than the ruler

- **`inchworm`, level 10 Longer than the ruler (dive slice 3, after batch 1)** (new interaction; school top). [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests, one play of level 10 with one drop away from the slot (no miss), the second-part pad (a miss), a second for the glow, then the answer; one portrait screenshot with the chalk mark; `fingerdemo` at 10.

### island-bridges 1: A small sea to start and named hints

- **`island-bridges`, a small sea to start and named hints (dive slice 1)** (new level on the existing interaction; grown-up): level 5 (order `[5, 1, 2, 3, 4]`, `entryLevels: [5]`) and the `full`, `every-way` and `last-way` hints with their voice lines. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new level on the existing interaction: typecheck, the game's rule tests, one browser play of level 5 with one hint (its named line), `fingerdemo` at 5.

### island-bridges 2: Keep them joined

- **`island-bridges`, level 6 Keep them joined (dive slice 2, after batch 1)** (new rule on the existing interaction; grown-up): shares `hintFor`'s kinds and the order with batch 1; the isolation step, generator filter, `isolation` hint and its ring. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests, one play of level 6 asking for hints until the isolation one (ring and line), then to the sticker; one portrait screenshot of the ring; `fingerdemo` at 6.

### island-bridges 3: Up to three planks

- **`island-bridges`, level 7 Up to three planks (dive slice 3, after batch 2)** (new rule on the existing tap; grown-up): shares the order with batch 2. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`. The shared rules change, so the couch suite follows.

Proof: new rule on the existing tap: typecheck, rule tests including the brute force at three, one play of level 7 with a third plank tap and a fourth that bumps, to the sticker; one portrait screenshot of a triple bridge; `fingerdemo` at 7; `BROWSER_SUITE=couchgames` filtered to Island Bridges.

### island-bridges 4: Joined Seas course

- **`island-bridges`, couch course *Joined Seas* (dive slice 4, after batch 2)** (couch catalog; grown-up): five frozen level-6 seas (each with one answer, none `bycounting`) as a second `course.ts` entry, version 1, beside Island Hopping. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/couch/` course and catalog files (`course.ts` and its tests), `src/games/island-bridges/logic.ts`, `docs/COUCH-PLAY.md`, the README row and `docs/GAMES.md`.

Proof: couch catalog tier: typecheck, course tests, `BROWSER_SUITE=couchgames` filtered to Island Bridges.

### lantern-lights 1: A 6 by 6 pond

- **`lantern-lights`, a 6 by 6 pond (dive slice 1)** (new levels on the existing interaction; grown-up): levels 7–8 (`PLANS` rows, grown-up max 8) and the portrait counts fix: when the room beside the pond is under about 260 units, the two counts sit in one line above it, clear of the top corner buttons. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 (a hint, then to the sticker), one portrait screenshot of level 8 with the counts, `fingerdemo` at 8. Trips stop at level 5 and the course is pinned at 6, so no couch suite.

### lantern-lights 2: Named hints and a short way

- **`lantern-lights`, named hints and Show me a short way (dive slice 2, after batch 1)** (new interaction; grown-up): `hintFor` kinds and two voice lines; the after-pond buttons and replay on touch only. Shares the `index.ts` layout with batch 1. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests (hint kinds by `ways`/`best` count; the replay reaches all-lit in `par`), one play at level 3 with one hint (its named line), lighting the pond and the replay, one portrait screenshot mid-replay, `fingerdemo` at 3 (the bot must press Next pond).

### lantern-lights 3: Lily-pad ponds

- **`lantern-lights`, lily-pad ponds, level 9 (dive slice 3, after batch 1)** (new rule on the existing tap; grown-up): masked `footprint`/`solve`/`parsePond`, authored shapes, pad art and `lantern.pads`. Shares `PLANS` and the max with batch 1. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, `src/games/lantern-lights/course.test.ts` (since `parsePond` changes), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`. The shared rules change, so the couch suite follows.

Proof: new rule: typecheck, rule tests including the brute force on every shape and the free-dimension cap, one play of level 9 with a tap on a pad (nothing counted) and a hint, to the sticker; one portrait screenshot; `fingerdemo` at 9; `BROWSER_SUITE=couchgames` filtered to Lantern Lights.

### peekaround-island 1: Truthful support and real choices

- **`peekaround-island`, truthful support and real choices (dive slice 1)** (existing-game fix; all bands): a level-scoped how-to, the level-2 hint on the hider when visible, level 4's three shore friends, level 5's pair rule so the turn always names someone, and `lap` dropped from `LEVELS` and the repeated guard. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/howto.ts`, `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, rule tests (every request leaving a wrong spot, all three words at level 4, behind in level 5's first pair, the level-2 hint target), one filtered regression play at levels 2 and 5, `fingerdemo` at 5.

### peekaround-island 2: Level 5 Who will be in front?

- **`peekaround-island`, level 5 *Who will be in front?* (dive slice 2)**, after batch 1 (existing level, new tap): she predicts who will be in front after the turn before it happens; a wrong prediction is exploration, not a miss. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `docs/GAMES.md`.

Proof: typecheck, rule tests, one play of level 5 with one wrong prediction (no miss) and one right, `fingerdemo` at 5.

### peekaround-island 3: Level 6 Who can't see it?

- **`peekaround-island`, level 6 *Who can't see it?* (dive slice 3)**, after batch 1 (new interaction; pre-K and school): she taps the friend who cannot see the pictured spot from where they stand; a wrong friend turns to show it can see; pre-K max 6, school max 6. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 6 with one wrong friend (the turn shows it can see), a second for the glow, then the right friend, one portrait screenshot with the picture card, `fingerdemo` at 6.

### peekaround-island 4: Level 7 What does the duck see?

- **`peekaround-island`, level 7 *What does the duck see?* (dive slice 4)**, after batch 3 (shares the turn-to-viewer helper; new interaction): she chooses which of three picture cards shows what the duck sees from where it stands; pre-K and school max 7. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 7 with one wrong card and its turn, a second for the glow, then the right card, one portrait screenshot of the three cards, `fingerdemo` at 7, one build for the render textures.
