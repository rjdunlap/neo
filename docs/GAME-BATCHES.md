# Same-game implementation batches

Requested by the developer 2026-10-21: group related levels into a coherent implementation session so the game’s rules, rendering, bot and checks are loaded once. [READY](READY.md) remains the dispatch order. These plans preserve the original numbered subtask scopes and gates; they do not renumber saved levels or authorize gated additions.

## Batch contract

- A plan's "README row" and "`docs/GAMES.md`" (in Files expected and closeouts) now mean the game's page `docs/games/<id>.md` plus `npm run game-docs`, which writes the README tables and the GAMES.md index ([where each doc update goes](SESSION-GUIDE.md#where-each-doc-update-goes)); a branch started before then moves its row and entry edits into the page before regenerating.
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

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### feelings-faces 1: Helping and explaining happenings

Built 2026-10-21, [PR #766](https://github.com/rjdunlap/neo/pull/766); [closeout](archive/COMPLETED-2026-10-09.md#feelings-faces-helping-and-explaining-happenings-2026-10-21). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`feelings-faces`, toddler 10 *Hug or pillow*** (new level on the help interaction): two helper cards for sad, sleepy or hungry; toddler `[2, 10, 3, 4]`. [Slice 3](deep-dives/feelings-faces.md#new-levels-on-top)
- **`feelings-faces`, level 11 *Two friends, one happening*** (new interaction): one happening, two friends with two different faces, a question for each; pre-K top and the school entry. [Slice 4](deep-dives/feelings-faces.md#new-levels-on-top)
- **`feelings-faces`, level 13 *What happened?*** (new level; after 11): a face and a leftover clue, three happening cards; school. [Slice 5](deep-dives/feelings-faces.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### sound-garden 1: Listening direction and visible echoes

Built 2026-10-22, [PR #779](https://github.com/rjdunlap/neo/pull/779); [closeout](archive/COMPLETED-2026-10-09.md#sound-garden-listening-direction-and-visible-echoes-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sound-garden`, level 7 Up, down or the same** (new level): staircases and a flat path at pre-K top. [Slice 3](deep-dives/sound-garden.md#new-levels-on-top)
- **`sound-garden`, echo you can see** (level 5): knock dots from the start, 12 rhythms, the sleepy tree answers. [Slice 4](deep-dives/sound-garden.md#fresh-content-inside-existing-levels)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### sound-garden 2: One big friend

Built 2026-10-22, [PR #784](https://github.com/rjdunlap/neo/pull/784); [closeout](archive/COMPLETED-2026-10-09.md#sound-garden-one-big-friend-2026-10-22). No longer eligible for dispatch.

- **`sound-garden`, level 8 One big friend** (new lap entry): one screen-filling singer, `entryLevels`, lap order 8, 1. [Slice 5](deep-dives/sound-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### sound-garden 3: Pitch drawing and copying

- **`sound-garden`, level 9 Sing Higher** (new interaction): drag a singer up to sing higher on pentatonic steps, creative finish; preschool order 2, 3, 4, 9, and pre-K. [Slice 6](deep-dives/sound-garden.md#new-levels-on-top)
- **`sound-garden`, level 10 Copy the shape** (new level; after *Sing Higher*): sing back a two- then three-note direction; pre-K. [Slice 7](deep-dives/sound-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### teddy-doctor 1: Choose a patient and order a check-up

Built in [#798](https://github.com/rjdunlap/neo/pull/798); [build note](archive/COMPLETED-2026-10-09.md#teddy-doctor-batch-1-patient-choice-and-check-up-rules-2026-10-22).

- **`teddy-doctor`, level 7 Who needs help?** (new level): two friends, tap the one with a boo-boo, then bandage it; toddler order 1, 7, 2, 3, `entryLevels: [7]`. [Slice 3](deep-dives/teddy-doctor.md#new-levels-on-top)
- **`teddy-doctor`, level 8 Before and after** (new level on the existing drag): a check-up with a stated order rule, every order that keeps it accepted; school 5, 6, 8. [Slice 4](deep-dives/teddy-doctor.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### scoop-shop 1: Younger scoop and customer entries

- **`scoop-shop`, lap entry 10 Any scoop** (new level on the existing interaction, with `order`/`entryLevels`): one tap, one scoop, one munch; lap order 10, 1. [Slice 3](deep-dives/scoop-shop.md#younger-band-openings)
- **`scoop-shop`, toddler 11 Who wanted pink?** (new interaction): tap the customer whose picture matches the scoop already on the cone; toddler order 1, 2, 11, 3. [Slice 4](deep-dives/scoop-shop.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### scoop-shop 2: Count-on and mixed-colour orders

- **`scoop-shop`, level 12 Fill it up** (new level on the existing interaction): count on from scoops already on the cone; pre-K and school. [Slice 5](deep-dives/scoop-shop.md#new-levels-on-top)
- **`scoop-shop`, level 13 Three pink and two blue** (new level): two colours with a count each, any order; pre-K and school. [Slice 6](deep-dives/scoop-shop.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### scoop-shop 3: Change and reverse

- **`scoop-shop`, level 8 Change of mind**: exactly one bottom/middle/top replacement before input; final-order peek and accounting.
- **`scoop-shop`, level 9 Top first**: reverse a spoken distinct triple; upright peek.

**Built 2026-11-03 ([PR #1176](https://github.com/rjdunlap/neo/pull/1176)).** EF1b first batch, school only, [canonical EF1 requirements](deep-dives/scoop-shop.md#ef1-build-ready-definition-2026-10-25). Retain built IDs/order; separate admission and building-session review/placement/layout/person gates. Proof: typecheck, rule tests, filtered top-level9 play, demos8/9; other checks only at the applicable tier. No level7 implementation in this batch.

### scoop-shop 4: Two cones

- **`scoop-shop`, level 7 Two cones** (**built 2026-11-03, [PR #1194](https://github.com/rjdunlap/neo/pull/1194)**): after batch3 and built11; one pair, three scoops total, free cone selection distinct from friend peek, independent state/accounting and both service orders.

Standalone EF1b new interaction, [canonical EF1 requirements](deep-dives/scoop-shop.md#ef1-build-ready-definition-2026-10-25). Separate admission, current source/contract review, actual full-size layout/placement, rules, filtered wrong-scoop/peek/completion play, portrait and two-order demo; shared-file/asset build tier as applicable.

### shape-sorter 1: Sorting entry, shape pool and three sizes

Built 2026-10-22, [PR #817](https://github.com/rjdunlap/neo/pull/817); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-1-round-or-square-shape-pool-sizes-and-big-middle-little-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 10 *Round or square*, slice 3** (new levels on an existing interaction): two plain holes by outline alone; toddler `order [9, 1, 2, 10, 3, 4, 5]`. [Dive](deep-dives/shape-sorter.md#easier-entries-and-levels-between-existing-ones)
- **`shape-sorter`, more shapes, sizes and colours, slice 4** (logic tier plus build): oval, rectangle, diamond, pentagon and trapezoid with lines, pool draws at 6–8, sizes at 6–7, a rainbow one colour, the box's property facts. [Dive](deep-dives/shape-sorter.md#fresh-content-inside-existing-levels)
- **`shape-sorter`, level 11 *Big, middle, little*, slice 5** (new levels, plus a portrait screenshot): one shape in three sizes; preschool `order [3, 4, 5, 6, 7, 11]`, pre-K `order [5, 6, 7, 11, 8]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### shape-sorter 2: Turn it to fit

Built 2026-10-22, [PR #822](https://github.com/rjdunlap/neo/pull/822); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-2-turn-it-to-fit-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 12 *Turn it to fit*, slice 6** (new interaction): tap a piece to turn it a notch, then carry it to an upright hole; pre-K `order [5, 6, 7, 11, 8, 12]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### shape-sorter 3: Corners, curves and corner counts

Built 2026-10-22, [PR #842](https://github.com/rjdunlap/neo/pull/842); [closeout](archive/COMPLETED-2026-10-09.md#shape-sorter-batch-3-corners-curves-and-corner-counts-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`shape-sorter`, level 13 *Corners or curves*, slice 7** (new levels; after slice 4): two mouths, curves or corners; pre-K `order […, 12, 13]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)
- **`shape-sorter`, level 14 *Count the corners*, slice 8** (new levels; after slice 4): holes labelled 0, 3, 4, 5, 6 with dots; pre-K top by default. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### mail-carrier 1: Tool signs, helpers and numbers past ten

Built 2026-10-22, [PR #850](https://github.com/rjdunlap/neo/pull/850); [closeout](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-1-tool-signs-helpers-and-numbers-past-ten-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`mail-carrier`, level 10 *Which door?*, slice 3** (new levels on the existing tap: typecheck, rule tests, one play of 10 with one wrong tap and one hint, a portrait screenshot of the signs, `fingerdemo` at 10): six tool `Graphics`, `letterShows` gains `'tool'`; toddler `order [1, 2, 10]`, preschool `order [2, 10, 3, 4]`, `entryLevels: [10]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 9 *Who can help?*, slice 4** (new levels tier, after slice 3: typecheck, rule tests, one play of 9, a portrait screenshot, `fingerdemo` at 9): the problem pictures, helper hats, the six journal entries; pre-K `order [3, 4, 5, 9, 6]`, school `order [4, 5, 9, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 12 *Numbers past ten*, slice 5** (new levels tier): two-digit numerals 10–20 with the ten-and-ones spoken; pre-K `order [3, 4, 5, 9, 12, 6]`, school `order [4, 5, 9, 12, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### mail-carrier 2: Spoken map clues and both street sides

Built 2026-10-23 in [#856](https://github.com/rjdunlap/neo/pull/856); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-2-spoken-map-clues-and-both-street-sides-2026-10-23).

- **`mail-carrier`, level 13 *Hazel's clue*, slice 6** (new levels on the map interaction: typecheck, rule tests over 300 seeds for clue uniqueness on both map orientations, one play of 13, `fingerdemo` at 13): Hazel says a spoken clue and the carrier finds the one house it names; school `order [4, 5, 9, 12, 6, 13, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 11 *Both sides of the street*, slice 7** (new interaction tier: typecheck, rule tests, one play of 11, a portrait screenshot that decides decision 7, `fingerdemo` at 11): odd numbers on one side and even on the other, house found from the parity then the order; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### mail-carrier 3: Compare delivery routes

Built 2026-10-23 in [PR #874](https://github.com/rjdunlap/neo/pull/874); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-3-compare-delivery-routes-2026-10-23). Scope retained for dependency references; no duplicate dispatch.

- **`mail-carrier`, level 14 *Three letters, your way*, slice 8** (new levels on the route interaction, plus the free second walk: typecheck, rule tests, one play of 14 taking the second plan, `fingerdemo` at 14): plan three stops in any order, then optionally compare a second order's stone count; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11, 14]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### mail-carrier 4: Make the key

Built and verified 2026-10-23 in [PR #881](https://github.com/rjdunlap/neo/pull/881); [build note](archive/COMPLETED-2026-10-09.md#mail-carrier-batch-4-make-the-key-2026-10-23). Scope retained for dependency references; no duplicate dispatch.

- **`mail-carrier`, level 15 *Make the key*, slice 9** (new interaction tier: typecheck, rule tests, one play of 15, a portrait screenshot of the wet key, `fingerdemo` at 15): match each sign row to its house to fill Hazel's key, then deliver two letters; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11, 14, 15]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### garden-grow 1: Flower variety and the lap growth entry

- **`garden-grow`, flower kinds** (content, levels 1–7): daisy, tulip, sunflower and bell-flower; kind varies per request, color alone is judged. [Slice 3](deep-dives/garden-grow.md#fresh-content-inside-existing-levels)
- **`garden-grow`, level 8 Grow it up** (new level, after slice 2): one big bed, every touch grows the next stage, three flowers; lap `order: [8, 1, 2]`, `entryLevels: [8]`. [Slice 4](deep-dives/garden-grow.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### garden-grow 2: Rows, columns and equal rows

- **`garden-grow`, level 9 Rows of colors** (new interaction): choose a packet, then beds, to match a sign of two colored rows; judged by position; pre-K after 7. [Slice 5](deep-dives/garden-grow.md#new-levels-on-top)
- **`garden-grow`, level 10 Columns of colors** (new level, after level 9 *Rows of colors*): three columns in two or three colors. [Slice 6](deep-dives/garden-grow.md#new-levels-on-top)
- **`garden-grow`, level 11 Same in every row** (new level, after level 9 *Rows of colors*): n flowers in each row in any beds, every placement accepted. [Slice 7](deep-dives/garden-grow.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### stop-and-go 1: Go car, stop car

- **`stop-and-go`, lap entry 9 Go car, stop car** (new interaction): a looping car, two huge lamps, no misses; lap order 9, 1, `entryLevels: [9]`. [Slice 3](deep-dives/stop-and-go.md#younger-band-openings)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### stop-and-go 2: Whose light and the busy crossing

- **`stop-and-go`, level 5 Whose light? and the pre-K window** (new level): two lanes with their own lights, send the one whose light is green; preschool 2–5, pre-K 3–5. [Slice 4](deep-dives/stop-and-go.md#new-levels-on-top)
- **`stop-and-go`, level 6 Busy crossing** (new level): cars arrive on both roads, she hands over one road at a time; an idle point helps level 4 too; pre-K 3–6. [Slice 5](deep-dives/stop-and-go.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### weather-wardrobe 1: Visible consequences and the lap fitting entry

- **`weather-wardrobe`, a miss that shows why** (existing-game change): a wrong item goes on for a moment, shows its cold, hot, wet or blown consequence and hops back; accounting unchanged. [Slice 3](deep-dives/weather-wardrobe.md#build-slices-in-order)
- **`weather-wardrobe`, lap entry 8 Try it on** (new level, after *a miss that shows why*): anything goes on, the fitting item stops the weather, no misses; lap order 1, 8, 2, `entryLevels: [8]`. [Slice 4](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### weather-wardrobe 2: Wind (built)

Built 2026-10-26 ([PR #994](https://github.com/rjdunlap/neo/pull/994)): slice 7 (a fourth weather with a kite, a windbreaker and a hat with a strap, the `blown` misfit, level-1 finish and trip pairs adjusted). Nothing remains in this batch. [Slice 7](deep-dives/weather-wardrobe.md#build-slices-in-order)

### weather-wardrobe 3: Two friends, two places

Built 2026-10-26, [PR #987](https://github.com/rjdunlap/neo/pull/987); [closeout](archive/COMPLETED-2026-10-09.md#weather-wardrobe-two-friends-two-places-level-10-2026-10-26). Retained for scope references; no longer eligible for dispatch.

- **`weather-wardrobe`, level 10 Two friends, two places** (new drag interaction): drag each item to the friend whose weather it suits; pre-K. [Slice 8](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### peg-garden 1: Numbered buds, shot trail and board variety

Built 2026-10-22, [PR #770](https://github.com/rjdunlap/neo/pull/770); [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-numbered-buds-shot-trail-shell-tray-and-board-themes-slices-2-3-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, numbered buds wait their turn and the last shot stays faint** (existing-game change, levels 4–5): only the asked numeral blooms; the previous path stays as faint dots. [Slice 2](deep-dives/peg-garden.md#build-slices-in-order)
- **`peg-garden`, shell tray and board themes** (content): pearls collect in a tray and pour back; four simulated board shapes, three backdrops. [Slice 3](deep-dives/peg-garden.md#fresh-content-inside-existing-levels)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### peg-garden 2: Big buds

Built 2026-10-23; [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-level-8-big-buds-slice-4-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, level 8 Big buds** (new lap entry): four huge buds, every touch blooms one; lap order 8, 1, toddler 8, 1, 2, `entryLevels: [8]`; plans keyed by ID. [Slice 4](deep-dives/peg-garden.md#younger-band-openings)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### peg-garden 3: Cup aiming and planting a bud

Built 2026-10-24, [PR #923](https://github.com/rjdunlap/neo/pull/923); [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-levels-6-into-the-cup-and-7-plant-a-bud-slices-5-6-2026-10-24). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, level 6 Into the cup** (new interaction): aim the pearl into the cup with that many dots; every cup reachable with margin; pre-K top. [Slice 5](deep-dives/peg-garden.md#new-levels-on-top)
- **`peg-garden`, level 7 Plant a bud** (new interaction, after level 6 *Into the cup*): drag a bud onto a marked place so the pearl reaches the cup, run, revise; pre-K. [Slice 6](deep-dives/peg-garden.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### little-helpers 1: Visible quantities, carrying variety and the full-team whistle

Built 2026-10-22, [PR #804](https://github.com/rjdunlap/neo/pull/804); [closeout](archive/COMPLETED-2026-10-09.md#little-helpers-batch-1-rings-that-fill-things-to-carry-and-the-full-team-whistle-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`little-helpers`, the badge fills, needs vary, level 2 opens to lap** (existing-game change, levels 2–6): rings fill as helpers grab on, the gap named at 5, no 1, 2, 1, 2 rounds, lap window 1–2. [Slice 2](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, things to carry and three places** (content): pumpkin, watermelon, acorn, pinecone, toy boat; orchard, beach and woods. [Slice 3](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, level 9 Whistle when it's full** (new level, after *the badge fills*): rings say when, no misses; toddler order 1, 2, 9, preschool 2, 9, 3, 4; plans keyed by ID. [Slice 5](deep-dives/little-helpers.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### little-helpers 2: Build teams, share helpers and count strong helpers

Built 2026-10-23, [PR #863](https://github.com/rjdunlap/neo/pull/863); [closeout](archive/COMPLETED-2026-10-09.md#little-helpers-batch-2-teams-she-builds-everyone-helps-and-strong-helpers-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`little-helpers`, level 6 teams she builds** (existing-game change): tap which fruit gets the helper, nearest-helper taps; uneven teams strain. [Slice 4](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, level 7 Everyone helps** (new interaction): split a crowd of 4–7 between two fruits; pre-K top and school. [Slice 6](deep-dives/little-helpers.md#new-levels-on-top)
- **`little-helpers`, level 8 Strong helpers** (new interaction): big helpers count two, every exact mix right; school. [Slice 7](deep-dives/little-helpers.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### monster-munch 1: Food variety, monsters and places (complete)

All three subtasks are built (slice 2 on 2026-10-24); nothing remains in this batch.

Built (reference only, do not recreate):

- **`monster-munch`, foods, monsters and places** (content): five foods (two kinds at 6), monster variants, three backdrops, the sticker pool. [Slice 2](deep-dives/monster-munch.md#fresh-content-inside-existing-levels)
- **`monster-munch`, level 9 Big bites** (new lap entry): three big cookies, the monster itself feeds, the belly grows; `BandLevels`, lap order 9, 1, 2, `entryLevels: [9, 10]`. [Slice 3](deep-dives/monster-munch.md#younger-band-openings)
- **`monster-munch`, level 10 One of each** (new level, after *Big bites*): a cookie and an apple for each monster; toddler order 2, 3, 10, 4. [Slice 4](deep-dives/monster-munch.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### monster-munch 2: Sharing two kinds and choosing group counts

Built 2026-10-26, [PR #989](https://github.com/rjdunlap/neo/pull/989); [closeout](archive/COMPLETED-2026-10-09.md#monster-munch-batch-2-two-kinds-and-how-many-friends-2026-10-26). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`monster-munch`, level 12 Share two kinds** (new level, after *Big bites*): deal cookies and apples fairly, then how many of each; school order 6, 7, 12, 8. [Slice 5](deep-dives/monster-munch.md#new-levels-on-top)
- **`monster-munch`, level 11 How many friends?** (new interaction, after *Big bites*): call friends from a cave, two each, ring when no one else can have two, then how many friends and how many left; school top. [Slice 6](deep-dives/monster-munch.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### rhythm-neighbors 1: Younger turn-taking and its journal page

Built 2026-10-22, [PR #853](https://github.com/rjdunlap/neo/pull/853); [closeout](archive/COMPLETED-2026-10-09.md#rhythm-neighbors-batch-1-knock-knock-my-turn-your-turn-and-the-frogs-journal-page-slices-2-3-and-8-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`rhythm-neighbors`, level 7 Knock, knock** (new lap entry: order and entry tests, one play, `fingerdemo` at 7, one portrait screenshot): a big tree, every knock answered by a frog a beat later, eight knocks finish; lap order `[7, 1, 2]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, level 8 My turn, your turn** (new level on the tap interaction: rule tests, one play, `fingerdemo` at 8): the bird knocks, one big frog glows and waits, one tap answers; toddler order `[2, 8, 3]`; no misses. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, journal page** (small; after slice 1): "The frogs answered the woodpecker", filed from a finished turn-taking round. [Dive](deep-dives/rhythm-neighbors.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### rhythm-neighbors 2: Knock a call

Built 2026-10-24, [PR #925](https://github.com/rjdunlap/neo/pull/925); [closeout](archive/COMPLETED-2026-10-09.md#rhythm-neighbors-level-9-knock-a-call-slice-4-2026-10-24). Scope retained below.

- **`rhythm-neighbors`, level 9 Knock a call** (new interaction tier; after level 8): she knocks the tree two to five times and the frogs answer with the gaps reversed; toddler `[2, 8, 9, 3]`, preschool `[9, 3, 4]`, `entryLevels [7, 9]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### seesaw-balance 1: Truthful support and varied weighing props

Built 2026-10-23, [PR #858](https://github.com/rjdunlap/neo/pull/858); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-1-truthful-support-and-varied-weighing-props-slices-12-2026-10-23).

- **`seesaw-balance`, support truth, slice 1 (built)** (existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 6, `fingerdemo` at 1): a tap on a loose friend hops it to the empty tray at 1–2, the glow after two overs rings the next block on the grass when the tray is under, the how-to's levels 1–2 line says tap or drag, new voice variants; IDs and windows unchanged. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, two faces per weight, wrappings and boxes, slice 2 (built)** (logic tier, plus one filtered play of 2 and 4): a friend pool per weight with a distinct-faces test, seeded present wrappings, parcel and crate boxes at 6–7. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### seesaw-balance 2: Lap bounce and heavier-or-lighter choices

Built 2026-10-26, [PR #991](https://github.com/rjdunlap/neo/pull/991); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-2-lap-bounce-and-heavierlighter-slices-34-2026-10-26). Scope retained below.

- **`seesaw-balance`, level 12 *Wheee!* with the lap band, slice 3** (new interaction tier: typecheck, units, one scripted play at lap and toddler, one portrait screenshot, `fingerdemo` at 12): the `bounce` mode, any touch on the empty tray sends a duck up; `bands` gains `lap`, lap `order [12]`, toddler `order [12, 1, 2]`, `entryLevels: [12]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 13 *Who is heavier?*, slice 4** (new interaction tier, taps on friends: typecheck, rule tests, one play of 13 with one wrong tap and one hint, `fingerdemo` at 13): tap the heavier or lighter of two tipped friends; preschool `order [2, 13, 3, 4]`, `entryLevels: [12, 13]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### seesaw-balance 3: Order weights, estimate and find the difference

Built 2026-10-26, [PR #993](https://github.com/rjdunlap/neo/pull/993); [closeout](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-3-order-estimate-and-difference-slices-57-2026-10-26). Scope retained below.

- **`seesaw-balance`, level 14 *Line them up*, slice 5** (new levels on an existing interaction: typecheck, rule tests, one play of 14, `fingerdemo` at 14): three look-alike presents tested in pairs then dragged to light, middle and heavy spots; pre-K `order [3, 4, 14, 5, 6, 7]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 15 *Guess the pumpkin*, slice 6** (new levels tier, plus a portrait screenshot for the guess sign): an unscored guess, then blocks until level, then the real number; pre-K `order [3, 4, 14, 5, 6, 7, 15]`, school `order [6, 7, 15, 8, 9, 10, 11]` (without 11 until it lands). [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 16 *How much heavier?*, slice 7** (new levels tier): add blocks to the light side until level, then say the difference; school `order [6, 7, 15, 16, 8, 9, 10, 11]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### seesaw-balance 4: Which way will it tip

Built: level17 prediction/release, slice8 ([PR #1000](https://github.com/rjdunlap/neo/pull/1000)); [build note](archive/COMPLETED-2026-10-09.md#seesaw-balance-batch-4-predict-the-tip-slice-8-2026-10-26). No open implementation subtask.

### fluffy-salon 1: Customer variety and younger styling entries

Status 2026-10-26: built. Slices 3 and 4 (levels 6 and 7) landed 2026-10-23 ([PR #864](https://github.com/rjdunlap/neo/pull/864)); slices 2 and 5 landed 2026-10-26 ([PR #995](https://github.com/rjdunlap/neo/pull/995)).

- **`fluffy-salon`, customers, rooms and start looks, slice 2** (logic tier): seeded friends in the chair with `{who}` lines, seeded wall and cape colors, five free-play start looks. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 6 *Pat the fluff*, slice 3** (new interaction): no buttons, any touch grows the fur, the floof shake and a big mirror, the round finishes by itself; lap `order [6, 1, 2]`, toddler `order [6, 1, 2]`, `entryLevels: [6]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 7 *Snip snip*, slice 4** (new levels on an existing interaction): two big buttons, grow and snip; lap and toddler `order [6, 1, 7, 2]`, `entryLevels: [6, 7]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 8 *Pink, please*, slice 5** (new levels on an existing interaction): five bottles and color-only requests, a wrong color named without a miss; toddler `order [6, 1, 7, 2, 8]`, preschool `order [2, 8, 3, 4]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### fluffy-salon 2: Two customers and comparative styling

Built 2026-10-26: slices 6–7, levels 9–10 ([PR #1002](https://github.com/rjdunlap/neo/pull/1002)); [build note](archive/COMPLETED-2026-10-09.md#fluffy-salon-batch-2-two-customers-and-comparative-styling-slices-67-2026-10-26). No open implementation subtask.

- **`fluffy-salon`, level 9 *Two customers*, slice 6** (new interaction, plus a portrait screenshot): two friends in two chairs with a two-part card each, either order finishes; preschool `order [2, 8, 3, 4, 9]`, pre-K `order [3, 4, 5, 9]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 10 *Longer than Pip's*, slice 7** (new interaction): make the pet's fur longer or shorter than a friend's, with a comparison line drawn in the mirror; pre-K `order [3, 4, 5, 9, 10]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### fluffy-salon 3: Two colours and changed requests

Built 2026-10-26: slices 8–9, levels 11–12 ([PR #1009](https://github.com/rjdunlap/neo/pull/1009)); [build note](archive/COMPLETED-2026-10-09.md#fluffy-salon-batch-3-two-colors-and-changed-requests-slices-89-2026-10-26). No open implementation subtask.

- **`fluffy-salon`, level 11 *Two colors*, slice 8** (new levels): "pink and blue, please", at least 35 % of strands in each; pre-K `order [3, 4, 5, 9, 10, 11]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 12 *Changed my mind*, slice 9** (new levels): a loved style is asked to be the opposite, so snip undoes grow and comb undoes curl; pre-K `order [3, 4, 5, 9, 10, 11, 12]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### size-parade 1: Parade variety and younger size entries

- **`size-parade`, the parade happens, eight friends and a seeded ground, slice 2** (landed 2026-10-26) (fresh content): the strut after a pick, the march with the size scale after a line, five new friends, flag and bunting by seed, the round's friend on the sticker, varied dealt sizes at levels 1–4. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, levels 16 *Big duck, little duck* and 9 *Big one, little one* with the lap band, slice 3** (landed 2026-10-26) (new interaction, plus a portrait screenshot): the size cycle under her finger, then big or little of two; `bands` gains `lap`, lap `order [16, 9]`, toddler `order [9, 1, 2, 3, 4]`, `entryLevels: [9, 16]`, the per-band accounting of decision 1. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 17 *Two in a line*, slice 4** (landed 2026-10-23; slice 3 then added 9 and `entryLevels` [9, 16, 17]) (new levels on an existing interaction): the two-friend line plan, the first drag a toddler meets; toddler `order [9, 1, 2, 3, 4, 17]`, preschool `order [3, 4, 17, 5, 6]`, `entryLevels: [9, 16, 17]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 10 *Big, middle, little*, slice 5** (landed 2026-10-23) (new levels on an existing interaction): the middle of three with a ringed-middle cue, at least two of four questions asking for it; preschool `order [3, 4, 17, 10, 5, 6]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### size-parade 2: Who fits

- **`size-parade`, level 11 *Who fits?*, slice 6** (landed 2026-10-28) (new interaction, plus a portrait screenshot): a bed, chair, bowl and door each fitting exactly one of three friends, too big and too little tried on screen; preschool `order [3, 4, 17, 10, 5, 6, 11]`, pre-K `order [5, 6, 11, 7, 8]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### size-parade 3: Insert a friend and order shades

- **`size-parade`, level 12 *Where does this one go?*, slice 7** (landed 2026-10-30, PR #1031) (new interaction, plus a portrait screenshot): a fifth friend dropped into the nearest gap of an ordered line that opens under the finger; pre-K `order [5, 6, 11, 7, 8, 12]`, school `order [7, 8, 12]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 15 *Darkest first*, slice 8** (landed 2026-10-30, PR #1031) (new levels on an existing interaction, plus a device contrast check): five shades of one friend lined up darkest or lightest first; pre-K `order [5, 6, 11, 7, 8, 12, 15]`, school `order [7, 8, 12, 15]`; Shade Lineup leaves the notebook. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### size-parade 4: Hidden heights

- **`size-parade`, level 13 *Hidden heights*, slice 9** (landed 2026-11-01, PR #1083) (new interaction, plus a portrait screenshot): boots behind a fence, a tapped pair swaps only when out of order, a gate that opens on a sorted line, a bot that sorts by pair tests; school `order [7, 8, 12, 13, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### size-parade 5: The measuring ribbon

- **`size-parade`, level 14 *The measuring ribbon*, slice 10** (landed 2026-11-02, PR #1118) (new interaction, plus a portrait screenshot): two friends on different footing compared with a ribbon that snaps to a head, a tap before measuring is a prediction and never a miss; school `order [7, 8, 12, 13, 14, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### pet-kitchen 1: Meal variety and lap tap-sharing

Built 2026-10-23, [PR #860](https://github.com/rjdunlap/neo/pull/860); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-1-meal-variety-and-lap-tap-sharing-slices-2-3-2026-10-23). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, friends, the meal eaten, round wholes, the fraction seen and a third fruit, slice 2** (fresh content tier: typecheck, rule tests for the pie's cuts and the fruit pool, one filtered play of 2 and 7, `fingerdemo` at 7): `CRITTERS` dealt from the seed, a seeded pie or sandwich each round, the chew, the fraction bubble at 7, the banana. [Slice 2](deep-dives/pet-kitchen.md#build-slices-in-order)
- **`pet-kitchen`, level 10 *One for you, one for me* and the lap band, slice 3** (new interaction tier: typecheck, rule tests, the picnic unit test, one play of 10 with a tap off a piece, a portrait screenshot, `fingerdemo` at 10, the `picnic` suite's sandwiches step once): tap dealing; `bands` gains `lap` with `{ min: 10, max: 10 }`, toddler `order [10, 1]`, `entryLevels: [10]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### pet-kitchen 2: Fair shares, thirds and equivalent shapes

**Part A built 2026-10-23** (slices 4-5, levels 11 and 12; [PR #879](https://github.com/rjdunlap/neo/pull/879), `claude/pet-kitchen-same-or-not`; [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-2-part-a-same-or-not-the-same-and-two-pizzas-three-friends-slices-4-5-2026-10-23)). **Part B built 2026-10-26** (slice 6, level 14, a cut per whole; [PR #998](https://github.com/rjdunlap/neo/pull/998), `claude/pet-kitchen-different-shape`; [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-2-part-b-different-shape-same-share-slice-6-2026-10-26)). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, level 11 *Same or not the same?*, slice 4 (built)** (new levels on the cut-and-drag, plus the overlay: typecheck, rule tests, one play of 11 serving the lopsided pieces once, `fingerdemo` at 11): piece areas, the lopsided icon and drawing; preschool `order [1, 11, 2, 3, 4]`, pre-K `order [11, 3, 4, 5, 6]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 12 *Two pizzas, three friends*, slice 5 (built)** (new levels tier: typecheck, rule tests, one play of 12 with a halves serve, `fingerdemo` at 12): thirds of two wholes; school `order [5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 14 *Different shape, same share*, slice 6 (built)** (new interaction tier, a cut per whole: typecheck, rule tests, one play of 14, a portrait screenshot of the overlay, `fingerdemo` at 14): two shapes of one share; pre-K `order [11, 3, 4, 14, 5, 6]`, school `order [14, 5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### pet-kitchen 3: Compare shares

Built 2026-10-30, [PR #1032](https://github.com/rjdunlap/neo/pull/1032); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-3-level-13-who-has-more-slice-7-2026-10-30). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`pet-kitchen`, level 13 *Who has more?*, slice 7 (built)** (new interaction tier, the question after the serve: typecheck, rule tests over the fraction pairs, one play of 13 with one wrong "more", `fingerdemo` at 13): compare two shares; school `order [14, 5, 6, 7, 8, 9, 12, 13]`, and the three journal entries land here. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

### pet-kitchen 4: Equivalent cup measures

Built 2026-10-31, [PR #1084](https://github.com/rjdunlap/neo/pull/1084); [closeout](archive/COMPLETED-2026-10-09.md#pet-kitchen-batch-4-level-15-one-cup-many-ways-slice-8-2026-10-31). Scope retained for dependency references; this batch is not requeued.

- **`pet-kitchen`, level 15 *One cup, many ways*, slice 8 (built)** (new interaction tier per the cooking packet: typecheck, rule tests over every half-and-quarter combination, one play of 15 with an oversupply undo, a portrait screenshot, `fingerdemo` at 15): the packet's equivalent-measures round; school `order [14, 5, 6, 7, 8, 9, 12, 13, 15]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story gate.

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

### attic-finds 3: Two sources and What can we tell?

**Built 2026-11-02 ([PR #1116](https://github.com/rjdunlap/neo/pull/1116)).** Both levels shipped; see the [archive note](archive/COMPLETED-2026-10-09.md#attic-finds-levels-78-two-sources-and-what-can-we-tell-h5-2026-11-02). Level 9 is batch attic-finds 4 below.

- **`attic-finds`, levels 7 *Two sources* and 8 *What can we tell?*** (school only; a new paper-copy drag into claim slots plus a two-stamp interaction inside the existing game, one invented bird-box case; school `{2, 8, order [2,5,6,7,8]}`): drag a copy of the paper that shows each claim (level 7), then stamp each claim *The papers show it* or *Can't tell*, where no paper from a house is no proof it had no bird box (level 8); a free read is not a miss. [Definition](definitions/household-casebook.md), [everyday-life study slice H5](deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/household-casebook.md#build-and-check-tier) sets it (typecheck, unit tests, an `atticcase` scripted play at levels 7–8, `fingerdemo` at both, one portrait screenshot of level 8, one build). Expected files: `src/games/attic-finds/` (`logic.ts`, a new `cases.ts` and its tests, `index.ts`), its `howto.ts`, its `voice.ts`, `scripts/browser-check.mjs`, README, `docs/GAMES.md`, `docs/VERIFICATION.md`.

### attic-finds 4: Mend the exhibit

**Built 2026-11-03 ([PR #1161](https://github.com/rjdunlap/neo/pull/1161)).** Level 9 shipped; see the [archive note](archive/COMPLETED-2026-10-09.md#attic-finds-level-9-mend-the-exhibit-h5-2026-11-03).

- **`attic-finds`, level 9 *Mend the exhibit*** (school only; caption strips and a question slot on the same case, after batch attic-finds 3; school `{2, 9, order [2,5,6,7,8,9]}`): swap each of three over-claiming captions for one the papers support, then pick the new paper that could answer a question the papers leave open. [Definition](definitions/household-casebook.md), [everyday-life study slice H5](deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/household-casebook.md#build-and-check-tier) sets it (typecheck, unit tests, an `atticcase` scripted play of level 9, `fingerdemo` at level 9, one portrait screenshot with a strip open, one build). Expected files: as attic-finds 3.

### second-chance-shed 1: Levels 1–4

Built 2026-10-24, [PR #930](https://github.com/rjdunlap/neo/pull/930); [closeout](archive/COMPLETED-2026-10-09.md#second-chance-shed-levels-1-4-slice-n2-2026-10-24). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`second-chance-shed`, levels 1–4 (N2)** (a new game, one subtask; toddler 1–2, preschool 2–3, pre-K 3–4, Cozy Village by default): used things arrive one at a time on a cart and she drags each to the worm bin, reuse shelf, mending table or Remake machine, one place added per level; each place visibly makes something, and level 1 counts no misses. [Definition](definitions/second-chance-shed.md), [nature-sustainability study slice N1](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/second-chance-shed.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 4, `fingerdemo` at both, one portrait screenshot of level 4, one build). Review gate: the session's source check replaced the developer review (decided 2026-10-23); recorded in VERIFICATION.

### second-chance-shed 2: Someone needs it

Built 2026-10-31, [PR #1057](https://github.com/rjdunlap/neo/pull/1057); [closeout](archive/COMPLETED-2026-10-09.md#second-chance-shed-levels-5-6-slice-n3-2026-10-31). Scope retained for dependency reference; defined 2026-10-31 (nature-sustainability N3).

- **`second-chance-shed`, levels 5–6 (N3)** (new interaction on the built game; school {4–6}): everything is laid out on the cart at once, a friend's picture bubble asks for something (pencils a pot, Bunny a nap), she plans every place and the friend's gift, then rings the cart bell; level 6 has two friends and one thing that fits both, and the tempting plan fails. One miss per failed ring, never per thing. [Definition](definitions/second-chance-shed-5-6.md), [nature-sustainability study slice N3](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/second-chance-shed-5-6.md#check-tier) sets it (typecheck and rule tests with the registry, lands and how-to tests; a filtered `browser-check.mjs` play at level 5 with the tin to Remake, a failing ring, a repeated ring counting nothing, then the tin to the friend, and at level 6 with the tempting plan, two failed rings and the glow, one Show me one and the finish; one portrait screenshot at level 6; `fingerdemo` at 5 and 6; one build). Review gate: the building session's source check of the new item and its fits, recorded in VERIFICATION.

### second-chance-shed 3: Picnic Loop

Built 2026-11-09, [PR #1445](https://github.com/rjdunlap/neo/pull/1445) (nature-sustainability N4); both levels shipped in the one batch. Scope retained for dependency reference; this batch is no longer eligible.

- **`second-chance-shed`, levels 7–8 (N4)** (new interaction on the built game; school range to {4–8}): a day of picnics for the friends, each needing a cup at every picnic, with a few washable cups, a wash tub that washes two between picnics and one-use cups that go to the Last Heap; level 7 is the loop (target 2) and level 8 three picnics with two authored cases (target 5). The big mug replaces the study's jar. [Definition](definitions/second-chance-shed-7-8.md), [nature-sustainability study slice N4](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/second-chance-shed-7-8.md#check-tier) sets it (typecheck and rule tests with the registry, lands and how-to tests; one filtered `browser-check.mjs` play at levels 7 and 8; one portrait screenshot of level 8; `fingerdemo` at 7 and 8; one build). Review gate: the building session's source check of the picnic set, recorded in VERIFICATION.

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

Built 2026-11-02, [PR #1134](https://github.com/rjdunlap/neo/pull/1134); [completed scope and proof](archive/COMPLETED-2026-10-09.md#lasso-loops-teens-decades-and-a-fresh-meadow-lasso-loops-batch-2-2026-11-02). The original scope follows.

- **`lasso-loops`, teens, decades and a fresh meadow (dive slice 1)** (fresh content on the existing interaction; preschool, pre-K, school): level 1's seeded 6–9 fireflies; level 3's 1–3 jars with an occasional no-ones round; level 4's teen, decade and 21–39 mix; the no-ones voice lines and pad choices. Level 6 unchanged. [Dive](deep-dives/lasso-loops.md#build-slices-in-order)

Files expected: `src/games/lasso-loops/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts` only if a step's wording changes, the README row and `docs/GAMES.md`.

Proof: fresh content on the existing interaction: typecheck, the game's rule tests (every plan's fireflies fit one per cell; a teen, a decade and a 21–39 round all occur at level 4 within a few hundred seeds; level 6 still 21–39; pads stay three distinct positive numbers including the answer; no leaf when there are no ones), one filtered regression play of level 4 on a decade seed with one wrong total, `fingerdemo` at 4 (the bot meets a round with no leaf).

### light-lab 1: Fair starts, nearest hints and a sun on either side

*Built 2026-11-02 ([PR #1132](https://github.com/rjdunlap/neo/pull/1132)).*

- **`light-lab`, fair starts, nearest hints and a sun on either side (dive slice 1)** (existing interaction; pre-K, school): the generator stops handing out nearly solved starts at levels 4–7, the hint follows the nearest solution rather than the built path, and the sun can sit on either side. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts` (reads the sun's side), `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests (starts are not nearly solved at 4–7, the hint always leads to a nearest solution, either sun side is solvable), one filtered regression play at level 6 with a right-hand sun and one hint; `fingerdemo` at 6 only if the bot's play changes.

### light-lab 2: Couch course Sunbeam Run

- **`light-lab`, couch course Sunbeam Run (dive slice 2)**, (built 2026-11-04, [PR #1218](https://github.com/rjdunlap/neo/pull/1218); couch catalog; batch 1 is built): a par course of frozen boards with par from batch 1's minimum, the remaining Light Lab par course of roadmap chunk 8. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/couch/` catalog and course entries, the course tests, `docs/COUCH-PLAY.md`.

Proof: couch catalog tier: a frozen board list, course tests, `BROWSER_SUITE=couchgames` filtered to Light Lab.

### light-lab 3: Levels 8–9 Place a mirror and Two to place

- **`light-lab`, levels 8–9 *Place a mirror* and *Two to place* (dive slice 3)** (new interaction; school): she drops a mirror from a tray onto the board so the beam reaches the target, then two mirrors; the school range rises to 9. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 8 with a drop off the board, a missed shine and the glowing cell, level 9 to its sticker, one portrait screenshot with the tray, `fingerdemo` at 8 and 9; stop after 8 if the allowance cannot cover 9.

### light-lab 4: Level 10 Where's the mirror?

- **`light-lab`, level 10 *Where's the mirror?* (dive slice 4)** (built 2026-11-04, [PR #1221](https://github.com/rjdunlap/neo/pull/1221)), after batch 3 (the school range rises past 9): a cloud hides one mirror and she chooses its cell from where the beam goes. [Dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play with one wrong cell and its ghost beam, a second for the glow, then the right cell, one portrait screenshot of the cloud, `fingerdemo` at 10.

### light-lab 5: Level 11 Through, bounce or stop?

- **`light-lab`, level 11 *Through, bounce or stop?* (dive slice 5)** (built 2026-11-04, [PR #1225](https://github.com/rjdunlap/neo/pull/1225)), after batch 4 (pre-K order [1,2,3,4,11], school order [2,3,4,11,5..10]): a picture object sits on the beam; three free guesses, then two judged choices. [Definition](definitions/light-lab-materials.md), [dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests, one scripted play of level 11 with a mismatched free guess, one wrong choice, a second for the glow, then the right choice, one portrait screenshot, `fingerdemo` at 11.

### light-lab 6: Level 12 Split the sunbeam

- **`light-lab`, level 12 *Split the sunbeam* (dive slice 6)** (built 2026-11-04, [PR #1229](https://github.com/rjdunlap/neo/pull/1229)), after batch 5 (school order [2,3,4,11,5..10,12]; school top only): a half-mirror sends the beam both straight on and turned, so she tilts mirrors to light both arms. [Definition](definitions/light-lab-split.md), [dive](deep-dives/light-lab.md#build-slices-in-order)

Files expected: `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: existing-interaction tier with a beam-drawing change: typecheck, rule tests, one scripted play of level 12 with a missed shine, a second miss for the glow, then the solve to the sticker, one portrait screenshot mid-shine with both arms, `fingerdemo` at 12.

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

Built 2026-10-27, [PR #1019](https://github.com/rjdunlap/neo/pull/1019); [definition](definitions/river-tablets.md), [archived build note](archive/COMPLETED-2026-10-09.md#river-tablets-levels-13-ancient-river-civilizations-ar2-2026-10-27). Whole three-level new-game batch. Levels 4–6 are defined (AR3) as batches river-tablets 2 and 3.

### river-tablets 2: A ten-mark and check the delivery

Built 2026-10-31, [PR #1044](https://github.com/rjdunlap/neo/pull/1044) (defined 2026-10-30, [PR #1030](https://github.com/rjdunlap/neo/pull/1030)); both levels in one worker, branch and PR; [archived build note](archive/COMPLETED-2026-10-09.md#river-tablets-levels-45-ancient-river-civilizations-ar3-first-part-2026-10-31). The withdraw clause did not apply: level 4 does not play as Lasso Loops with a stamp.

- **`river-tablets`, levels 4–5 (the build of study slice AR3, first part)** (two new interactions on an existing game; school only, `school: { min: 3, max: 5 }` for this batch, appended after `rows` without renumbering): hand in a clay tablet written with a big ten-mark and small ones-marks for crates and loose baskets, any equal longer reading accepted and then shown the shorter way, the yard count and tablet reading free (level 4); say whether a cart is short, right or extra against a tablet written at the farm, then by how many (level 5). Marks are invented island signs; nothing is paid. Files: `src/games/river-tablets/` (logic, art, scene, rule tests), voice lines `rt.*`, the how-to card, the `rivertablets` browser case. Withdraw clause: if level 4 plays as Lasso Loops with a stamp, it becomes a Lasso Loops mode and level 5 still stands. [Definition](definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree), [study build slices](deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/river-tablets.md#levels-46-check-tier-for-the-builds) sets it (typecheck, rule tests, one scripted `rivertablets` play of level 4 with one wrong Hand in and the glow and of level 5 with one wrong number, a portrait screenshot of each, `fingerdemo` at level 5, one build because voice and how-to change).

### river-tablets 3: Two tablets disagree

Built 2026-10-31, [PR #1085](https://github.com/rjdunlap/neo/pull/1085) (defined 2026-10-30, [PR #1030](https://github.com/rjdunlap/neo/pull/1030)); one worker, branch and PR; [archived build note](archive/COMPLETED-2026-10-09.md#river-tablets-level-6-ancient-river-civilizations-ar3-second-part-2026-10-31).

- **`river-tablets`, level 6 (the build of study slice AR3, second part)** (a new interaction on an existing game; school only, `school: { min: 3, max: 6 }`): a farm tablet and a storehouse tablet record the same cart and disagree; pick the one that matches, neither, or can't tell, and can't tell is right only when the cart is empty (`gone`). Files: `src/games/river-tablets/` (logic, scene, rule tests), voice lines `rt.*`, the how-to card, the `rivertablets` browser case. Depends on river-tablets 2 for the marks and the lineup. [Definition](definitions/river-tablets.md#levels-46-ar3-a-ten-mark-check-the-delivery-two-tablets-disagree), [study build slices](deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/river-tablets.md#levels-46-check-tier-for-the-builds) sets it (typecheck, rule tests, one scripted `rivertablets` play of level 6 with a can't-tell miss and the `gone` case, a portrait screenshot, `fingerdemo` at level 6, one build).

### caravan-days 1: Kneel and load, can we reach it, and day by day

Built 2026-10-27, [PR #1020](https://github.com/rjdunlap/neo/pull/1020); [definition](definitions/caravan-days.md), [archived build note](archive/COMPLETED-2026-10-09.md#caravan-days-levels-13-china-india-and-the-silk-road-cs2-2026-10-27). Whole three-level new-game batch. Levels 4–5 are defined (CS3) as batch caravan-days 2.

### caravan-days 2: Swap at the stop and worth more far away

Built 2026-10-30, [PR #1037](https://github.com/rjdunlap/neo/pull/1037) (defined in [PR #1029](https://github.com/rjdunlap/neo/pull/1029)); [archived build note](archive/COMPLETED-2026-10-09.md#caravan-days-levels-45-china-india-and-the-silk-road-cs3-2026-10-30). One worker, branch and PR for both levels.

- **`caravan-days`, levels 4–5 (the build of study slice CS3)** (two new interactions on an existing game; school only, `school: { min: 3, max: 5 }`, no renumbering): give the camel the good the next stop's bubble wants, one pick of two offers per oasis on a one-way road, Go walks there or back (level 4); tap two three-bale loads to count their shells at the named stop and send the one that brings more, the better load reversing between the far city and the near oasis (level 5). Shells are counters for one case only; nothing accrues. Files: `src/games/caravan-days/` (logic, art, scene, rule tests), voice lines `cd.*`, the how-to card, the `caravandays` browser case. Withdraw clause: if level 4 plays as Swap Meet 4 with a camel, it goes to Swap Meet instead. [Definition](definitions/caravan-days.md#levels-45-cs3-swap-at-the-stop-worth-more-far-away), [study build slices](deep-dives/subjects/china-india-silk-road.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/caravan-days.md#levels-45-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play per level with one miss and asked-for help, a portrait screenshot of each, `fingerdemo` at level 5, one build).

### caravan-days 3: Mountains or sand and a well every day's walk

Defined 2026-10-31 in [PR #1074](https://github.com/rjdunlap/neo/pull/1074); built 2026-11-01, [PR #1106](https://github.com/rjdunlap/neo/pull/1106) (both levels, one worker); [archived build note](archive/COMPLETED-2026-10-09.md#caravan-days-levels-67-china-india-and-the-silk-road-cs4-2026-11-01).

- **`caravan-days`, levels 6–7 (the build of study slice CS4)** (two new interactions on an existing game; school only, `school: { min: 3, max: 7 }`, no renumbering): two roads to one city, the pass road (3–5 one-sun legs plus a drawn snow day, the coat a visible cost) or the sand road (4–6 days), either accepted, she sets a day card (3–7) before Go and a wrong count is the miss (level 6, `pass`); tap sites on a switchback road so no stretch between water exceeds a day's walk of four hoofprint marks, the fewest wells by search, every minimal placement accepted, extra wells accepted (not a miss) with a minimal set ghosted, the hint glowing the farthest site within a day of the first too-long stretch (level 7, `wells`). Files: `src/games/caravan-days/` (logic, art, scene, rule tests), voice lines `cd.*`, the how-to card, the `caravandays` browser case. [Definition](definitions/caravan-days.md#levels-67-cs4-mountains-or-sand-a-well-every-days-walk), [study build slices](deep-dives/subjects/china-india-silk-road.md#build-slices-in-order)

Proof: new-interaction tier (typecheck, rule tests, `caravandays` filtered play of levels 6 and 7, a portrait screenshot of each, `fingerdemo` at levels 6 and 7, one build).

### welcome-ways 1: Levels 1–4

Built; [batch record](archive/COMPLETED-2026-10-09.md#welcome-ways-levels-14-2026-10-24). Levels 5–7 need their own definition.

### little-loom 1: Levels 1–3 (VA2)

Built; [build note](archive/COMPLETED-2026-10-09.md#little-loom-levels-13-va2-2026-10-25). Later levels remain separate.


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

Built 2026-10-27, [PR #1021](https://github.com/rjdunlap/neo/pull/1021); [definition](definitions/keep-house.md), [archived build note](archive/COMPLETED-2026-10-09.md#keep-house-levels-14-medieval-life-ml2-2026-10-27). Whole four-level new-game batch. Levels 5–6 are built as batch keep-house 2.

### keep-house 2: Read the ruin and stone or timber

Built 2026-10-31, [PR #1038](https://github.com/rjdunlap/neo/pull/1038) (defined 2026-10-30, [PR #1034](https://github.com/rjdunlap/neo/pull/1034)); [archived build note](archive/COMPLETED-2026-10-09.md#keep-house-levels-56-medieval-life-ml3-2026-10-31). Both levels in one worker, branch and PR.

- **`keep-house`, levels 5–6 (the build of study slice ML3)** (two new interactions on an existing game; school only, `school: { min: 4, max: 6 }`, no renumbering): drag picture labels onto the roofless rooms of a 3 × 3 ruin by their remains, four rooms and five labels, a hearth or drain shared by two rooms so a deciding clue decides, a wrong label is a miss (level 5); build a lord's hall in timber (2 bags, lasts 15 years, rebuilt) or stone (5 bags, 8 years, stands) for a purse and a stay, the years play out and a choice is never a miss, in level 3's Keep it grammar (level 6). Bags are counters; nothing accrues. Files: `src/games/keep-house/` (logic, art, scene, rule tests), voice lines `kh.*`, the how-to card, the `keephouse` browser case. Withdraw clause: if level 6 plays as a worksheet, it goes to Household Casebook instead. [Definition](definitions/keep-house.md#levels-56-ml3-read-the-ruin-stone-or-timber), [study build slices](deep-dives/subjects/medieval-life.md)

Proof: new-interaction tier, as the [definition's check tier](definitions/keep-house.md#levels-56-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play per level with misses and Keep it twice and the glow, a portrait screenshot of each, `fingerdemo` at levels 5 and 6, one build).

### water-road 1: Keystone, which one stands and hold it up

Built 2026-10-27, [PR #1022](https://github.com/rjdunlap/neo/pull/1022); [definition](definitions/water-road.md), [archived build note](archive/COMPLETED-2026-10-09.md#water-road-levels-13-greece-and-rome-am2-2026-10-27). Whole three-level new-game batch. Levels 4–5 are defined (AM3) as batch water-road 2.

### water-road 2: Downhill all the way and over the valley

Built 2026-10-31, [PR #1043](https://github.com/rjdunlap/neo/pull/1043) (defined in [PR #1035](https://github.com/rjdunlap/neo/pull/1035)); both levels in one worker, branch and PR. [Archived build note](archive/COMPLETED-2026-10-09.md#water-road-levels-45-greece-and-rome-am3-2026-10-31).

- **`water-road`, levels 4–5 (the build of study slice AM3)** (two new interactions on an existing game; `prek: { min: 2, max: 4 }`, `school: { min: 3, max: 5 }`, no renumbering): pre-K picks one of two whole channels and school sets two piers with up and down arrows, then **Open the spring** is the commit and a pooled opening is one miss (level 4); school drags arches across 3–4 spans with an abutment on each earth end, one end usually rock, under the arcade rule (level 5). Files: `src/games/water-road/` (logic, art, scene, rule tests), voice lines, the how-to card, the `waterroad` browser case. Rain Garden and Welcome Ways boundaries are recorded in the [definition](definitions/water-road.md#levels-45-am3-downhill-all-the-way-over-the-valley). [Definition](definitions/water-road.md#levels-45-am3-downhill-all-the-way-over-the-valley), [study build slices](deep-dives/subjects/ancient-mediterranean.md)

Proof: new-interaction tier, as the [definition's check tier](definitions/water-road.md#levels-45-check-tier-for-the-build) sets it (typecheck, rule tests, one scripted play covering pre-K level 4, school level 4 and level 5 with their misses and hints, a portrait screenshot of level 5, `fingerdemo` at levels 4 and 5, one build).

### paint-mixer 1: Copy the row and twice as much

- **`paint-mixer`, levels 1–2 (study slice 2)** (**built 2026-10-27**, PR #1026; a new game, one declared batch; school 1–2, Counting Cove by decision 3 if the lands test passes, else Rainbow Meadow): tap a pot to pour a drop into the bucket and copy the sample jar's row of drops (1:1, 1:2, 2:1 of an authored pair; level 1), then make twice as much as two rows of the sample (level 2; "more, the same way" is not a miss). Pots, the mean-colour rule and its measured distances, the drop rows, Undo, Tip out, Check, one glow and ghost pour per bucket. [Definition](definitions/paint-mixer.md), [ratio and proportion study slice 2](deep-dives/subjects/ratio-proportion.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/paint-mixer.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Paint Mixer with one wrong Check and the glow at level 1 and "more, the same way" then a match at level 2, `fingerdemo` at level 2, one portrait screenshot, one build). The "for every" wording is source-checked in the building session. If the allowance cannot cover both, stop after a complete level 1 with a draft-PR checkpoint. No review gate.

### paint-mixer 2: Fill to the line and any amount

- **`paint-mixer`, levels 3–4 (study slice 3)** (**built 2026-11-01**, [PR #1107](https://github.com/rjdunlap/neo/pull/1107); after batch `paint-mixer 1`; school 3–4): fill the bucket to a line two or three batches deep while the ratio table fills a column per complete batch and the pet says "for every 1 red, 2 yellow" (level 3, a stray pot on screen), then any whole multiple of the sample and the same colour again at a different amount (level 4; "the same way" is not a miss). [Definition](definitions/paint-mixer.md), [study slice 3](deep-dives/subjects/ratio-proportion.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of levels 3–4 with the table filling, one wrong Check, a first way, the same way again and a second way, `fingerdemo` at level 4, one portrait screenshot of level 3, one build for the card and voice). Levels 5–6 (RP2) are defined in [their own definition](definitions/paint-mixer-5-6.md) (batch `paint-mixer 3`). Built notes: [definition](definitions/paint-mixer.md#built-levels-34-2026-11-01).

### paint-mixer 3: Three pots and which jars match

- **`paint-mixer`, levels 5–6 and the journal paint shelf (study slice 4, RP2)** (**built 2026-11-02**, [PR #1135](https://github.com/rjdunlap/neo/pull/1135); defined in [PR #1117](https://github.com/rjdunlap/neo/pull/1117); after batch `paint-mixer 2`; school top): three pots (1:2:1 peach, 8 or 12 drops) at level 5, then which lidded jars match the sample from their labels alone (2:3, 4:6, 3:5, 6:9) at level 6, where a lid is one hint and an opened lid shows its label against the sample's table; the paint shelf in the journal. [Definition](definitions/paint-mixer-5-6.md), [study slice 4](deep-dives/subjects/ratio-proportion.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's batches section](definitions/paint-mixer-5-6.md#build-batches-and-check-tiers) sets it (typecheck, rule tests with the journal and how-to tests, a filtered play of level 5 with one wrong Check and a match and level 6 with a wrong set twice, the lid reveal, then the right set, `fingerdemo` at levels 5 and 6, one portrait screenshot of level 6 with a lid open, one build). If the allowance cannot cover both, stop after a complete level 5 with its shelf, checkpointed in the draft PR.

### paint-mixer 4: Palette unlock

- **`paint-mixer`, the palette unlock (decision 7)** (status: batch `paint-mixer 3` is built; still waits on RW10's packet if that is defined first; not a routine pick yet): a mixed colour as a permanent palette unlock. [Definition](definitions/paint-mixer-5-6.md#the-palette-unlock-decision-7-a-separate-later-batch)

Proof: shell/save tier, as the definition sets it; to be confirmed when the batch is picked.

### spinner-fair 1: Spin, see and pick

**Status: built 2026-10-31, PR #1058.**

- **`spinner-fair`, levels 1-3 (chance-statistics study slice CS1)** (a new game, one declared batch; preschool 1-2, pre-K 2-3, school 3-5; Counting Cove, 13 games becoming 14, so the land now pages): tap a big spinner and a critter's block drops on its bar, six spins with nothing counted (level 1), then which came up most (level 2), then pick the spinner that gives the pet the better chance and watch ten spins; a spin is never a miss and the better spinner may lose (level 3). [Definition](definitions/spinner-fair.md), [study build slices](deep-dives/subjects/chance-statistics.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/spinner-fair.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Spinner Fair with level 1 to its sticker and level 3 with one wrong pick, the glow on the second and ten spins, one portrait screenshot of level 3, `fingerdemo` at level 3, one build). Levels 4-5 are batch `spinner-fair 2`; levels 6-10 need their own definitions.

### spinner-fair 2: Sure, maybe, no way and make it fair

**Status: built 2026-11-01, PR #1111.**

- **`spinner-fair`, levels 4-5 (chance-statistics study slice CS1)** (after batch `spinner-fair 1`; pre-K and school ranges as the definition sets): drag cards onto *sure*, *maybe* and *no way* spinners (level 4), then hand wedges from one critter to the other to make an unfair race fair, with a wrong *fair* and an uneven Check answered gently and the race run honestly (level 5). [Definition](definitions/spinner-fair.md), [study build slices](deep-dives/subjects/chance-statistics.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 4 with one card on the wrong spinner and level 5 with a wrong *fair*, an uneven Check, two wedge moves and the race, one portrait screenshot of level 5, `fingerdemo` at levels 4 and 5, one build for the card and voice).

### tide-line 1: Come in, go out and stop at the line

**Built 2026-10-31** ([PR #1059](https://github.com/rjdunlap/neo/pull/1059)); levels 3-4 are batch `tide-line 2` (built 2026-11-01).

- **`tide-line`, levels 1-2 and the shore art kit (oceans study slice 1)** (a new game, one declared batch; lap 1, toddler 1-2, preschool 2; Bubble Beach, 12 games becoming 13, fallback Counting Cove only if the lands test fails): pull the big wave up the sand and let it slide back while the shore answers, with nothing wrong (level 1); then drag a pail above the seaweed line and only then watch the sea come in, a floated pail fetched back by the pet (level 2). The shared `src/art/shore.ts` creatures, `sfx.wave` and `sfx.gull` ship here. [Definition](definitions/tide-line.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/tide-line.md#check-tier-for-the-builds) sets it (typecheck, rule tests for levels 1-2 with the registry, lands, how-to, off-screen and `beach.test.ts`, a `browser-check.mjs` case filtered to Tide Line with level 1 to its sticker and level 2 with one pail below the line, the float and fetch, a second miss and the glow, then a dry pail, one portrait screenshot of level 2, `fingerdemo` at level 2, one build). Levels 3-4 are batch `tide-line 2`; levels 5-7 need their own definition.

### tide-line 2: Read the line and in, out, in, out

**Status: built 2026-11-01, [PR #1112](https://github.com/rjdunlap/neo/pull/1112).**

- **`tide-line`, levels 3-4 (oceans study slice 1)** (batch `tide-line 1` built; preschool 2-3 and pre-K 3-4 ranges as the definition sets): with the sea out, read the seaweed line to place a pail, a flag and a towel and tap the wave, the second round with a higher windy-day line that the sea reaches (level 3); then complete a four-picture strip of in, out, in, out from three cards, one the in-between picture (level 4). [Definition](definitions/tide-line.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 3 round 2 with a thing between the lines and level 4 with one wrong card and the glow, one portrait screenshot of level 4, `fingerdemo` at levels 3 and 4, build only if shared files change).

### rule-machine 1: The hat machine and one more goes in

**Status: built 2026-11-01, PR #1091.**

- **`rule-machine`, levels 1-2 (algebra-balance study slice AB1)** (a new game, one declared batch; pre-K 1, school 2; Puzzle Peaks, 13 games becoming 14, so the land now pages): creatures go into a hat machine and come out wearing a hat, and she taps what the fourth will look like from three pictures (level 1); then cars with counters go in and come out with one or two more, and she taps the count on the pads once two rows show; feeding is never a miss and a first wrong prediction on a new rule is free (level 2). [Definition](definitions/rule-machine.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/rule-machine.md#check-tier-for-the-builds) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `browser-check.mjs` case filtered to Rule Machine with level 1 given a free wrong picture and then two wrong on the second prediction and the glow, level 2 to its sticker with one wrong pad after two rows, one portrait screenshot of level 2, `fingerdemo` at level 2, one build). Levels 3-4 are batch `rule-machine 2`; levels 5–6 are [defined](definitions/rule-machine-5-6.md) (batches `rule-machine 3` and `4`) and 7–8 need their own definition.

### rule-machine 2: The rule shelf and the covered machine

**Status: built 2026-11-02, PR #1120.**

- **`rule-machine`, levels 3-4 (algebra-balance study slice AB1)** (after batch `rule-machine 1`; school range as the definition sets): name the machine's rule from a shelf of three cards after three rows (+2, +3, -1; level 3), then with the machine covered choose which cars to feed so the table tells the cards apart, with Peek as a requested hint, a trap car that tells nothing new and a ruled-out card counted gently (level 4). [Definition](definitions/rule-machine.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, rule tests, a filtered play of level 3 with a wrong card and level 4 with a trap car first, a still-open card tap that counts nothing, a ruled-out card, Peek and the last prediction, one portrait screenshot of level 4, `fingerdemo` at levels 3 and 4, one build for the card and voice).

### rule-machine 3: Backwards

**Status: built 2026-11-11, [PR #1502](https://github.com/rjdunlap/neo/pull/1502).**

- **`rule-machine`, level 5 *Backwards* (algebra-balance study slice AB2)** (after batch `rule-machine 2`; school): the card hangs on the machine and a wanted car has already come out; she sends the car that went in, and a wrong car runs, is written into the table and counts one miss (counts stay 0–12). [Definition](definitions/rule-machine-5-6.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-level tier, as the [definition's check tier](definitions/rule-machine-5-6.md#check-tier-for-the-builds) sets it (typecheck, level-5 rule tests with the registry and how-to tests, one filtered scripted play of level 5 to its sticker with two wrong cars on one wanted car and the glow, `fingerdemo` at level 5, one build for the voice and card).

### rule-machine 4: Two machines

**Status: built 2026-11-11, [PR #1505](https://github.com/rjdunlap/neo/pull/1505).**

- **`rule-machine`, level 6 *Two machines* (algebra-balance study slice AB2)** (after batch `rule-machine 3`; school): watch a pair of machines and predict the output on the pads, then build the watched pair reversed from a shelf of four cards for a wanted in → out; the first pair run per target is free. [Definition](definitions/rule-machine-5-6.md), [study build slices](deep-dives/subjects/algebra-balance.md#build-slices-in-order)

Proof: new-interaction tier, as the definition sets it (typecheck, level-6 rule tests, one filtered play with a wrong pad, the watched order as the free first pair, a second pair that does not fit, the glow followed to a fitting pair and the sticker, one portrait screenshot of level 6 while building, `fingerdemo` at level 6, one build).

### puppet-stage 1: Pop up, make Bunny talk and say it like

**Built 2026-10-30** (PR #1028): levels 1–3 of `puppet-stage`; levels 4–6 (TP2) were built in [puppet-stage 2](#puppet-stage-2-story-cards-and-the-premiere).

- **`puppet-stage`, levels 1–3 (study slice 2)** (a new game, one declared batch; lap 1, toddler 1–2, preschool 2–3, pre-K 3; Music Mountain by decision 2, six games becoming seven, one page): touch the stage floor and a stick puppet rises there, says hello in its own voice and follows her finger, a tap bobs it and talks again (level 1, nothing counted); the pet names a puppet or a voice and she makes that one talk (level 2, by name, then by voice); one puppet holds a line and she chooses the sleepy, tiny or big way to say it (level 3, a free try first). Puppet voices are device-speech `pitch`/`rate` presets through a new `voice.sayIn`/`ctx.sayIn`, the one small shared change; nothing is kept. [Definition](definitions/puppet-stage.md), [study build slices](deep-dives/subjects/theatre-puppetry.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/puppet-stage.md#check-tier-for-the-build) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, a `sayIn` unit test, a `browser-check.mjs` case filtered to Puppet Stage covering levels 1–3 with one wrong puppet and the glow, `fingerdemo` at level 3, one portrait screenshot, one build). The listening judgement is a device check on the built game, not a build blocker. Levels 4–6 are batch puppet-stage 2.

### puppet-stage 2: Story cards and the premiere

**Built 2026-11-03** ([PR #1159](https://github.com/rjdunlap/neo/pull/1159)): levels 4–6 as defined (stand 80 from each curtain, not 30; [GAMES.md](GAMES.md#puppet-stage)). Defined 2026-11-03 ([PR #1156](https://github.com/rjdunlap/neo/pull/1156)), after batch puppet-stage 1.

- **`puppet-stage`, levels 4–6 (study slice 3, TP2)** (new levels with a new interaction; prek {3,5}, school {4,6}): three authored story cards (a Knock knock, b The lost hat, c Surprise!), two places per card with two marks each, bob-only scenes, peeks in the apron, marquee cards, and at level 6 a live shown-only premiere that ends with The end; 33 voice lines, a bot, a how-to card with the director's-chair note. [Definition](definitions/puppet-stage-4-6.md), [study build slices](deep-dives/subjects/theatre-puppetry.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/puppet-stage-4-6.md#check-tier-for-the-build) sets it (typecheck, rule tests with the registry, lands, how-to and off-screen tests, one filtered `puppetstage` play of levels 4–6, one portrait screenshot of level 6, `fingerdemo` at 4, 5 and 6, one build).

Expected files: `src/games/puppet-stage/{logic,logic.test,art,index}.ts`, its `howto.ts`, its `voice.ts`, `scripts/browser-check.mjs`, README and GAMES docs.

## Relay Woods 1: levels 1–4 (NC2)

- **Scope:** [NC1 packet](definitions/relay-woods.md), one worker/branch/PR for Pass it along1, Two ways2, Fallen log3, The short way4; finite seeded templates and five picture payloads, hop/backtrack/log/long-arrival/reset rules, capped support, voice/how-to/BFS bot. Toddler1–2, preschool1–4, pre-K2–4, school4.
- **Admission:** separate from docs NC1; current contract/source review and overlap required. Cozy Village after actual current full-size capacity/layout checks, else existing Story Grove with its own checks; no count increment before build. Existing optional picture Keep, no mailbox/save architecture.
- **Proof:** independent rule tests/typecheck; filtered first/top wrong/help play plus branch/log recovery, all4 demos and dense portrait screenshot; build for shared catalog/card/voice. Relevant Keep/backup/offline and world proof for actual persistence/navigation changes. Record tested commit/filter/URL; stop servers. Person/device recognition/reach/speech/child response remains unestablished.
- **Out:** NC3+, pieces, privacy, locks, resilience, Relay Cases, story, practical family card, real network/contact/safety. No outside reviewer approval invented; October23 source-check rule applies.

### drops-journey 1: Where can the drop go, send it to the snow and can it go there

- **`drops-journey`, levels 1-3 (weather-water study slice 8)** (**built 2026-10-31**, [PR #1066](https://github.com/rjdunlap/neo/pull/1066), branch `claude/drops-journey-1-3`; a new game, one declared batch; preschool 1, pre-K 1-2, school 2-3; Tinker Lab): tap a picture card to send a water drop to a lawful next stop among five places, finishing after three stops (level 1); reach a postcard goal such as the snow by any lawful route, with the pet replaying the story (level 2); then one uphill can't-go card is a miss, with a glow after two (level 3). [Definition](definitions/drops-journey.md), [study build slices](deep-dives/subjects/weather-water.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/drops-journey.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 to its sticker and level 3 with one can't-go card, the glow and its hint, then Finish, one portrait screenshot of level 2 mid-move, `fingerdemo` at levels 1 and 3, one build). The building session's source check of the speech lines goes in its verification entry. All three levels shipped; proof is in [VERIFICATION](archive/VERIFICATION-2026-10-31.md#2026-10-31--drops-journey-levels-13-weather-water-slice-8).

### sprout-shuffle 1: which pairs always make spotted

- **`sprout-shuffle`, level 4 *which pairs always make spotted?*** (**built 2026-11-01**, [PR #1093](https://github.com/rjdunlap/neo/pull/1093), branch `claude/sprout-shuffle-4`; new level on the existing interaction; school; the first build of Hidden Sprouts, genetics G5, whose levels 5 and 6 follow as later complete parts): choose which parent pairs guarantee a spotted sprout and keep every explanation compatible with what was seen. Scope, rules and the school range are in the [definition](definitions/hidden-sprouts.md); depends on Sprout Shuffle levels 1–3, built 2026-10-30.

Proof: new-levels tier, as the [definition's checks](definitions/hidden-sprouts.md#checks-for-the-builds) set it (typecheck, the rule tests, one browser play of level 4, `fingerdemo` at 4). Level 4 shipped; proof is in [VERIFICATION](archive/VERIFICATION-2026-11-01.md#2026-11-01--sprout-shuffle-level-4-which-pairs-always-make-spotted-genetics-g5).

### sprout-shuffle 2: Patchwork Conservatory

- **`sprout-shuffle`, levels 7–8 Patchwork Conservatory** (genetics G7; a new interaction on the same game, school and up; level 7 one accepted pair with a trap plant, level 8 two accepted plans plus a free "Another way?"): plan a cross guaranteed to satisfy a two-trait planting brief over two explicitly independent toy loci. [Definition](definitions/patchwork-conservatory.md). **Built 2026-11-03**, [PR #1184](https://github.com/rjdunlap/neo/pull/1184), branch `claude/sprout-shuffle-conservatory` (levels 7 and 8 together); [closeout](archive/COMPLETED-2026-10-09.md#sprout-shuffle-levels-78-patchwork-conservatory-genetics-g7-2026-11-03).

Proof: new-interaction tier, as the [definition's checks](definitions/patchwork-conservatory.md#checks-for-the-builds) set it (typecheck; unit tests for the rule properties, how-to and registry; one filtered scripted play of level 7 with a Check on `AA bb` × `Aa Bb`, a second miss and the glow, then the accepted pair, and of level 8 with both plans found; one portrait screenshot with a lens open; `fingerdemo` at 7 and 8; build).

### forecast-detective 1: Which way is the wind and a postcard didn't come

- **`forecast-detective`, levels 1-2 (weather-water study slice 9)** (**built 2026-10-31**, [PR #1069](https://github.com/rjdunlap/neo/pull/1069), branch `claude/forecast-detective-1-2`; a new game, one declared batch; school 1-2; Tinker Lab, fallback Cozy Village): lift covered flaps on a wind vane, two island postcards and a thermometer, work out which weathers a disclosed pretend wind rule still allows, and answer with one weather card (level 1); then one clue is missing, so she names the weather when the rest still decide or taps *Can't tell yet* when they cannot (level 2). [Definition](definitions/forecast-detective.md), [study build slices](deep-dives/subjects/weather-water.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/forecast-detective.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 using one not-yet Check, one ruled-out Check, a second miss for the glow and its hint, then the right card to the sticker, and level 2's authored case with an overclaimed weather then *Can't tell yet*, one portrait screenshot of level 2 with the missing flap and five cards, `fingerdemo` at levels 1 and 2, one build). The building session's source check of the speech lines goes in its verification entry. Both levels shipped; proof is in [VERIFICATION](archive/VERIFICATION-2026-10-31.md#2026-10-31--forecast-detective-levels-12-weather-water-slice-9).

### drift-cards 1: Where will it wash up and send it to a friend

- **`drift-cards`, levels 1–2 (oceans study slice 6)** **built 2026-10-31**, [PR #1078](https://github.com/rjdunlap/neo/pull/1078), branch `claude/drift-cards-1-2`; a new game, one declared batch; school 1–3; Bubble Beach, fallback Tinker Lab): predict which beach each of three numbered wooden cards reaches as it rides the arrows of a pretend current map (level 1); then choose which boat to drop from so the card reaches the asked friend (level 2). [Definition](definitions/drift-cards.md), [study build slices](deep-dives/subjects/oceans.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/drift-cards.md#check-tier) sets it (typecheck, rule tests with registry, lands and how-to, a `browser-check.mjs` case with level 1 using the free first card wrong, one counted wrong beach, a second miss for the glow, then the right beach, and level 2 with one wrong boat then a right boat, one portrait screenshot of level 2 mid-drift, `fingerdemo` at level 2, one build). The building session's source check of the speech lines goes in its verification entry. If the allowance cannot cover both levels, stop after a complete level 1 with a draft-PR checkpoint.

### drift-cards 2: Find the hidden current

- **`drift-cards`, level 3 (oceans study slice 6)** (a new interaction on the same game, school 1–3): a fogged patch of the sea and two or three returned cards; choose which of three patches fills the fog so every card lands where it was found, with a replay. [Definition](definitions/drift-cards.md). **Built 2026-11-02**, [PR #1119](https://github.com/rjdunlap/neo/pull/1119), branch `claude/drift-cards-3`; school 1–3 (the cards and Check sit in a row under the sea in every orientation, a deviation from the definition's side column in landscape). Depends on batch drift-cards 1, built.

Proof: new-interaction tier, as the [definition's check tier](definitions/drift-cards.md#check-tier) sets it (typecheck; rule tests 6–9; one filtered play of the authored case with option B, option C and the glow, then option A and the replay; one portrait screenshot with the fog and three patch cards; `fingerdemo` at level 3; a build for the card and voice).

### not-always 1: Not all of them, Every one? and Say it better

**Built 2026-11-01** (levels 1–3 together; [build note](archive/COMPLETED-2026-10-09.md#not-always-levels-13-philosophy-reasoning-pr1-not-always-1-2026-11-01)).

- **`not-always`, levels 1–3 (philosophy-reasoning study slice 1, PR1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Story Grove, fallback Puzzle Peaks): a friend on a crate makes a claim about a row of picture cards; tap the card that breaks it (level 1); tap a breaker or stamp *Every one!* when nothing breaks the claim (level 2); break the claim, then pick the mended claim true of every card (level 3). [Definition](definitions/not-always.md), [study build slices](deep-dives/subjects/philosophy-reasoning.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/not-always.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands and how-to, a `browser-check.mjs` case with its README row: level 1 with one fitting card then a second for the glow and the breaker, level 2 with a false stamp then a true claim stamped, level 3 with one false mend then the true one, one portrait screenshot of level 2, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

### notice-board 1: Who made it, who saw it, to tell or to sell

**Built 2026-11-01** (levels 1–3 together, [PR #1113](https://github.com/rjdunlap/neo/pull/1113); [build note](archive/COMPLETED-2026-10-09.md#notice-board-levels-13-media-literacy-ml1-notice-board-1-2026-11-01)).

- **`notice-board`, levels 1–3 (media-literacy study slice 1, ML1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Cozy Village, fallback Tinker Lab): island friends pin made-up picture posters to a village board; tap the friend whose badge matches the poster's stamp (level 1); tap the friend who actually saw it and their photo settles the poster (level 2); sort each poster into *Here's what happened* or *Come and get some!* (level 3, school only). [Definition](definitions/notice-board.md), [study build slices](deep-dives/subjects/media-literacy.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/notice-board.md#check-tier) sets it (typecheck, rule tests 1–7 with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case with its README row: level 1 with two wrong friends for the glow then the maker, level 2 with the heard-it friend (a miss) then the witness through one stretched and one true poster, level 3 with one wrong basket then the right one, one portrait screenshot of level 2 with the memory bubbles and the photo, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

### shell-rows 1: Finish the row, stop the row, win first

**Built 2026-11-01** ([PR #1115](https://github.com/rjdunlap/neo/pull/1115), branch `claude/shell-rows-1-3`): all of batch shell-rows 1, levels 1–3. Checks are in [VERIFICATION](archive/VERIFICATION-2026-11-01.md#2026-11-01--shell-rows-levels-13-strategy-games-sg1).

- **`shell-rows`, levels 1–3 (strategy-games study slice 1, SG1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Puzzle Peaks, paging, fallback Bubble Beach): a 3 by 3 grid in wet sand with a match already under way; set one shell to finish her row (level 1), to stop the pet's row (level 2), or to win first when both rows are on the board (level 3); a wrong square is answered by the pet's honest reply, then the board rewinds. [Definition](definitions/shell-rows.md), [study build slices](deep-dives/subjects/strategy-games.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/shell-rows.md#check-tier-for-the-build) sets it (typecheck, rule tests with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case: level 1 with one wrong square then a second for the glow and its hint then the right square to the next position, level 3 with the block then the right square to its sticker, one portrait screenshot of level 3 mid-replay, `fingerdemo` at levels 1 and 3, one build).

### orchard-rows 1: Equal rows, every way, only one long row

**Built 2026-11-02 ([PR #1121](https://github.com/rjdunlap/neo/pull/1121)):** levels 4, 5 and 6 together; checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--orchard-rows-levels-46-number-structure-ns1-batch-orchard-rows-1).

- **`orchard-rows`, levels 4–6 (number-structure study slice 2, the build of NS1)** (extends the built game, new-interaction tier; school 4–6, Barnyard unchanged; Counting Cove / Puzzle Peaks as the game already sits): a basket of 12 to 24 saplings and a row-count control; the saplings deal into equal rows at once and the leftover stays in the basket; find a row count with none left over (level 4), plant every different orchard one basket can make (level 5), find the one of three baskets that only makes one long row (level 6, a separate *One long row* button as the answer). [Definition](definitions/orchard-rows.md), [study build slices](deep-dives/subjects/number-structure.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's check tier](definitions/orchard-rows.md#check-tier-for-the-build) sets it (typecheck, the rule tests with registry, lands, how-to and off-screen tests, a `browser-check.mjs` filter: level 4 with Plant on a leftover, a second for the glow and its hint, then the glowing arrow to Plant; level 5 with one shape planted twice (free); level 6 with one wrong basket claimed, then the prime; one portrait screenshot of level 5 at one long row of its basket; `fingerdemo` at levels 4, 5 and 6; one build). If the allowance cannot cover all three levels, stop after complete levels 4–5 with a draft-PR checkpoint; level 6 is then its own run.

### thought-bubbles 1: What does she want, Where will he look, How do we know

**Built 2026-11-02 (PR #1122):** levels 1–3 shipped in one session; the claim stays here only as the plan.

- **`thought-bubbles`, levels 1–3 (literature-meaning study slice 1, LM1)** (a new game, one declared batch; pre-K 1–2, school 1–3; Story Grove, paging, fallback Cozy Village): a tiny picture story plays on a cottage stage, then she drags one of three picture cards into a friend's empty thought bubble and the friend acts on it; what the friend wants (level 1), where he will look from what he saw (level 2, away or watching stories), why he did it and where the picture shows it (level 3). [Definition](definitions/thought-bubbles.md), [study build slices](deep-dives/subjects/literature-meaning.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/thought-bubbles.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands and how-to, a `browser-check.mjs` case with its README row: level 1 with one wrong card, a second for the glow, then the right card; level 2 with the actual place in an away story then the right card, and a watching story answered right; level 3 with one wrong reason then the right one, one free region tap, then the clue; one portrait screenshot of level 2, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint.

### maker-lane 1: Along the lane, who can use it now, where did it begin

**Built 2026-11-02 (PR #1123):** levels 1–3 shipped in one session; the claim stays here only as the plan. The grown-ups' "Where did it begin?" card (FS3) was not built and is the next follow-up.

- **`maker-lane`, levels 1–3 (food-fiber-systems study slice 1, FS1)** (a new game, one declared batch; toddler 1, preschool 1–2, pre-K 2–3, school 2–3; Cozy Village, fallback Painted Canyon): a bundle changes form at each maker's stall until it is a scarf, a sock, a loaf or a box; she sends it along and the maker works (level 1), chooses which maker can use the bundle now, a maker who cannot showing the form they need (level 2), then starts from a finished thing and picks where it began, a wrong beginning run down the lane to the different thing it makes (level 3). [Definition](definitions/maker-lane.md), [study build slices](deep-dives/subjects/food-fiber-systems.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/maker-lane.md#check-tier) sets it (typecheck, rule tests 1–8 with registry, lands, how-to and off-screen tests, a `browser-check.mjs` case with its README row: level 1 with a tap on a maker who is not waving (free) then the waving makers to the pet; level 2 with two refused makers on the first bundle then the right makers; level 3 with one wrong card then the right one; one portrait screenshot of level 2 with a thought bubble up, `fingerdemo` at levels 2 and 3, one build). If the allowance cannot cover level 3, stop after complete levels 1–2 with a draft-PR checkpoint. Person, device and review checks stay open.

### lemonade-stand 1: Two lemon boats

**Built 2026-11-02 ([PR #1124](https://github.com/rjdunlap/neo/pull/1124)):** level 5 and the co-play hint; checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--lemonade-stand-level-5-two-lemon-boats-lemonade-stand-batch-1).

- **`lemonade-stand`, level 5 Two lemon boats, with the co-play hint (dive slice 1)** (extends the built game, new-interaction tier; school; Cozy Village unchanged): each morning two boats offer lemons with the same lemons or the same shells ("2 for 1" vs "2 for 2", "4 for 2" vs "2 for 2"); she taps the cheaper boat, then chooses a batch and a price as level 4 does, at the chosen boat's lemon price. A dearer boat is a gentle boing, a spoken "for 2 lemons" comparison and one counted miss; two misses that morning glow the cheaper boat and count one hint, and a day counts at most one hint whether from the glow or the lightbulb. Batch and price stay experiments. `batchCost`, `bestChoice` and `forecastChoice` take a lemon price; `helps()` gains a boat line and `insight()` the savings; voice lines `lemon.boat.*`; adds the game's `coplayHint` (weather reporter and first friend). [Dive](deep-dives/lemonade-stand.md#build-slices-in-order), [ladder](deep-dives/lemonade-stand.md#proposed-ladder)

Files expected: `src/games/lemonade-stand/logic.ts`, `logic.test.ts`, `index.ts`, `art.ts`, its `voice.ts`, its `howto.ts` (a step scoped `{ from: 5 }`), `scripts/browser/suites/woods-batch.mjs`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier, as the [dive's slice 1](deep-dives/lemonade-stand.md#build-slices-in-order) sets it (typecheck; unit tests for the offer pool, no-loss and affordability with the cheaper boat, true comparisons and the savings insight; one scripted play `BROWSER_SUITE=woods WOODS_ONLY=lemon` at level 5 with one wrong boat, a second for the glow, then the right boat, and the lightbulb on a different day, so the round pays 2 misses and 2 hints; one portrait screenshot of the jetty; `fingerdemo` at level 5). Build only if shared files change.

### pixel-pictures 1: Fresh pictures and colour logic

**Built 2026-11-02 ([PR #1125](https://github.com/rjdunlap/neo/pull/1125)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--pixel-pictures-fresh-pictures-and-colour-logic-pixel-pictures-batch-1); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-fresh-pictures-and-colour-logic-pixel-pictures-1-2026-11-02).

- **`pixel-pictures`, fresh pictures and colour logic (dive slice 1)** (extends the built game; preschool to school, no new level): level 2 pool 3 → 6 two-colour 5×5 pictures (strawberry, duckling, mushroom) and level 6 pool 2 → 5 two-colour 6×6 pictures (sun, frog, fish), each accepted only if `colorLineSolvable` solves it (same-colour runs need a gap, different colours may touch, matching `colorRuns`); the level-6 hint and ghost finger use the colour deduction as levels 4–5 use `deduce`; a strict pool-larger-than-shown test. A picture that fails the check leaves the level-6 pool and a new one replaces it. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#proposed-ladder)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `scripts/browser/suites/woods-batch.mjs` only if the level-6 case needs an update, and `docs/GAMES.md`.

Proof: typecheck and the game's rule tests (pool sizes, solvability, hint leads to a settled square); one filtered regression play of level 6 (the `woods` suite's Pixel Pictures 6 case) and `fingerdemo` at 6.

### pixel-pictures 2: Both ways and Twice as big

**Built 2026-11-03 ([PR #1166](https://github.com/rjdunlap/neo/pull/1166)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--pixel-pictures-levels-7-both-ways-and-8-twice-as-big-pixel-pictures-batch-2); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-both-ways-and-twice-as-big-pixel-pictures-2-2026-11-03).

- **`pixel-pictures`, level 7 Both ways and level 8 Twice as big (dive slice 2, after the built batch 1)** (new levels on an existing interaction; school): level 7 copies a drawn 6×6 quarter across two mirror lines into the other three (`PixelMode` gains `mirror2`; `pixel.notmirror2`, hint glows an open square whose mirror is drawn); level 8 copies a 3×3 model at double size into 2×2 blocks (`scaleUp(p, 2)`; `pixel.notbig`, hint glows one block). Authored four-fold pictures and five 3×3 models; how-to steps scoped from 7; bot through `pixelTouch`. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#proposed-ladder)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the suite case, the README row and `docs/GAMES.md`.

Proof: new levels tier: typecheck and rule tests (symmetry, quarter determines the rest, aligned blocks, hint and bot never wrong); one browser play of level 8 with one wrong square and the glow, a level-7 case in the same filtered run, `fingerdemo` at 7 and 8, one portrait screenshot of level 8. Stop after level 7 if the allowance cannot cover 8.

### pixel-pictures 3: Two colours, small

**Built 2026-11-04 ([PR #1203](https://github.com/rjdunlap/neo/pull/1203)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-04.md#2026-11-04--pixel-pictures-level-9-two-colours-small-pixel-pictures-batch-3); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-level-9-two-colours-small-pixel-pictures-3-2026-11-04).

- **`pixel-pictures`, level 9 Two colours, small (dive slice 3, after batch 2)** (new level; preschool and pre-K, placed between 1 and 2 by `order`: 1, 9, 2, …): four new 4×4 two-colour pictures (ladybird first), picked as level 2 picks (`pixel.notcolor`); per-band `order` lists every ID once, `entryLevels` unchanged (built with `entryLevels: [9]`, see the dive). [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#easier-entries-and-levels-between-existing-ones)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests (4×4 with exactly two colours, `order` complete, entry level 1); one browser play of level 9 and `fingerdemo` at 9.

### pixel-pictures 4: My own picture

**Built 2026-11-04 ([PR #1212](https://github.com/rjdunlap/neo/pull/1212)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-04.md#2026-11-04--pixel-pictures-level-10-my-own-picture-pixel-pictures-batch-4); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-level-10-my-own-picture-pixel-pictures-4-2026-11-04).

- **`pixel-pictures`, level 10 My own picture (dive slice 4, after batch 3)** (new interaction; pre-K and school, last in each band's order as a free level): a blank 5×5 with four swatches, a tap on a filled square empties it, a Done button (at least 100 units) appears after four squares; no misses or hints; the kept creation uses the existing pixel shape; adds a `coplayHint`; the demo shows the bot drawing a heart. [Dive](deep-dives/pixel-pictures.md#build-slices-in-order), [ladder](deep-dives/pixel-pictures.md#easier-entries-and-levels-between-existing-ones)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests (fewer than four squares cannot finish, kept creation equals the board); one scripted play to Done with a kept design, one portrait screenshot, `fingerdemo` at 10; the `creations` suite filtered to Pixel Pictures only if the kept shape changes.

### pixel-pictures 5: Ones and zeros

**Built 2026-11-11 ([PR #1503](https://github.com/rjdunlap/neo/pull/1503)):** checks in [VERIFICATION](VERIFICATION.md#2026-11-11--pixel-pictures-level-11-ones-and-zeros-h7-batch-pixel-pictures-5-pr-1503); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-level-11-ones-and-zeros-2026-11-11). Level 12 follows as batch 6.

- **`pixel-pictures`, level 11 Ones and zeros (H7 of the how-computers-work study; [definition](definitions/picture-bytes.md), after the built batch 4)** (new interaction on an existing game; school, after 8 and before the free level 10, so the order becomes [3, 4, 5, 6, 7, 8, 11, 10]): four large bit cards flip between 0 and 1, a free arrow shows the row they make, and a check compares it with a reference row under a key card (1 filled, 0 empty, left to right); three seeded rows per round, a failed check is one miss, every second one is a hint that glows the first differing card, one ordinary sticker, no creation; adds `bitsLayout`, a `coplayHint` sentence and a ghost finger that flips the needed cards, presses the arrow, then the check. [Definition](definitions/picture-bytes.md#the-levels), [dive](deep-dives/pixel-pictures.md#build-slices-in-order)

Files expected: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `voice.ts`, `howto.ts`, `docs/games/pixel-pictures.md`.

Proof: new-interaction tier ([definition](definitions/picture-bytes.md#slices-and-check-tier)): typecheck; unit tests (the rule tests, with the registry, lands and how-to tests); one filtered scripted play of level 11 to its sticker with one failed check and the glow (the `woods` suite's Pixel Pictures cases); one upright screenshot at 390 × 844; `fingerdemo` at 11; `npm run build`, since voice, how-to and the level table change.

### pixel-pictures 6: A whole picture

**Built 2026-11-11 ([PR #1506](https://github.com/rjdunlap/neo/pull/1506)):** checks in [VERIFICATION](VERIFICATION.md#2026-11-11--pixel-pictures-level-12-a-whole-picture-batch-pixel-pictures-6-pr-1506); [build note](archive/COMPLETED-2026-10-09.md#pixel-pictures-level-12-a-whole-picture-2026-11-11). No longer eligible for dispatch. Scope retained for reference.

- **`pixel-pictures`, level 12 A whole picture (after batch 5; [definition](definitions/picture-bytes.md))** (new level on the interaction batch 5 builds; school, order [3, 4, 5, 6, 7, 8, 11, 12, 10]): the same four cards write a 4×4 picture one row at a time, top to bottom, beside its model; a right row stays on the board with its digits, an empty row is a real case, and after the fourth row the existing reveal names the picture; two of five one-colour pictures per round; the kept creation is the existing 4×4 pixel shape. [Definition](definitions/picture-bytes.md#the-levels)

Files expected: the same files as batch 5, plus the `woods` suite case only if it needs a level-12 branch.

Proof: new-level tier: typecheck, the rule tests, one browser play of level 12 with an empty row and a kept picture, `fingerdemo` at 12.

### ferry-jam 1: Fair hints and fuller harbors

**Built 2026-11-02 ([PR #1127](https://github.com/rjdunlap/neo/pull/1127)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--ferry-jam-fair-hints-and-fuller-harbors-ferry-jam-batch-1); [build note](archive/COMPLETED-2026-10-09.md#ferry-jam-fair-hints-and-fuller-harbors-ferry-jam-1-2026-11-02). No longer eligible for dispatch. Scope retained for reference.

- **`ferry-jam`, fair hints and fuller harbors (dive slice 1)** (existing interaction; pre-K and school, no new level): the progress-based `stuck` hint replaces the raw slide count, harbors fill each plan's range (the pools now sit at the bottom of it) with a strict pool test, and a `coplayHint` adopts the Penguin Slide/Ferry Jam co-play split. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, `docs/GAMES.md`.

Proof: typecheck and the game's rule tests; one filtered regression play of level 6 that wanders (a loop of slides earns one hint) and one that progresses on a longer route (no hint). The bot is unchanged, so no `fingerdemo`.

### ferry-jam 2: Rocks in the harbor

**Built 2026-11-03 ([PR #1169](https://github.com/rjdunlap/neo/pull/1169)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--ferry-jam-level-7-rocks-in-the-harbor-ferry-jam-batch-2); [build note](archive/COMPLETED-2026-10-09.md#ferry-jam-level-7-rocks-in-the-harbor-ferry-jam-2-2026-11-03). No longer eligible for dispatch. Scope retained for reference.

- **`ferry-jam`, level 7 Rocks in the harbor (dive slice 2)** (new level on the existing drag; school): rocks that never move share the harbor; every rock must matter and `focusPath` must still reach every boat; a rounded grey `Graphics` boulder with a foam ring drawn from existing palette colours. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new level tier: typecheck, rule tests (every rock matters, `focusPath` reaches every boat); one browser play of level 7 with a drag on a rock, `fingerdemo` at 7, one portrait screenshot.

### ferry-jam 3: Two ferries

**Built 2026-11-03 ([PR #1195](https://github.com/rjdunlap/neo/pull/1195)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--ferry-jam-level-8-two-ferries-ferry-jam-batch-3); [build note](archive/COMPLETED-2026-10-09.md#ferry-jam-level-8-two-ferries-ferry-jam-3-2026-11-03). No longer eligible for dispatch. Scope retained for reference.

- **`ferry-jam`, level 8 Two ferries (dive slice 3, after batch 2)** (new rule on the existing drag; school): two ferries leave by two docks, so the plan serves both; shares the `Harbor` and `parse` changes with batch 2. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new rule tier: typecheck and rule tests; one play of level 8 to its sticker with the yellow ferry sailing first, `fingerdemo` at 8, one portrait screenshot of the bottom dock.

### ferry-jam 4: Pre-K entry and who's in the way

**Built 2026-11-04 ([PR #1204](https://github.com/rjdunlap/neo/pull/1204)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-04.md#2026-11-04--ferry-jam-levels-9-and-10-pre-k-entry-and-whos-in-the-way-ferry-jam-batch-4); [build note](archive/COMPLETED-2026-10-09.md#ferry-jam-levels-9-and-10-pre-k-entry-and-whos-in-the-way-ferry-jam-4-2026-11-04). No longer eligible for dispatch. Scope retained for reference.

- **`ferry-jam`, levels 9 and 10 Pre-K entry and Who's in the way (dive slice 4)** (level 9 an easier entry with one slide; level 10 a new tap step naming the boat in the way; pre-K and school): per-band `order` and `entryLevels` as the dive sets them, and level 10's blocker question with its glow after two wrong taps. [Dive](deep-dives/ferry-jam.md#build-slices-in-order)

Files expected: `src/games/ferry-jam/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests (order, entry and landing); one scripted play of level 9 and of level 10 with one wrong tap, a second for the glow, then the blocker; `fingerdemo` at 9 and 10; one portrait screenshot of level 10's question.

### garden-rows 1: Seeded flower sets and Mend the bed

**Built 2026-11-02 ([PR #1126](https://github.com/rjdunlap/neo/pull/1126)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--garden-rows-seeded-flower-sets-and-level-7-mend-the-bed-garden-rows-batch-1); [build note](archive/COMPLETED-2026-10-09.md#garden-rows-seeded-flower-sets-and-level-7-mend-the-bed-garden-rows-1-2026-11-02). No longer eligible for dispatch. Scope retained for reference.

- **`garden-rows`, seeded flower sets and level 7 Mend the bed (dive slice 1)** (existing interaction, new level; school): F1 seeded flower sets and level 7 Mend the bed as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck and Garden Rows rule tests (the F1 and Mend the bed assertions in the dive); one browser play of level 7 with one wrong replant and the glow, and level 3 with a non-default flower set; `fingerdemo` at 7.

### garden-rows 2: Hedge boxes

**Built 2026-11-03 ([PR #1167](https://github.com/rjdunlap/neo/pull/1167)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--garden-rows-levels-89-hedge-boxes-garden-rows-batch-2); [build note](archive/COMPLETED-2026-10-09.md#garden-rows-levels-8-9-hedge-boxes-garden-rows-2-2026-11-03). No longer eligible for dispatch. Scope retained for reference.

- **`garden-rows`, levels 8–9 Hedge boxes (dive slice 2, after batch 1)** (new rule on the existing interaction, new drawing; school): shares `PLANS` and the school range with batch 1, as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests; one play of level 8 with a box clash and one of level 9 to its sticker; one portrait screenshot of the hedges; `fingerdemo` at 9.

### garden-rows 3: One row

**Built 2026-11-03 ([PR #1171](https://github.com/rjdunlap/neo/pull/1171)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--garden-rows-level-10-one-row-garden-rows-batch-3); [build note](archive/COMPLETED-2026-10-09.md#garden-rows-level-10-one-row-garden-rows-3-2026-11-03). No longer eligible for dispatch. Scope retained for reference.

- **`garden-rows`, level 10 One row, preschool opening (dive slice 3, after batch 1)** (new band; adds `order`/`entryLevels` to the same `LEVELS`), as written in the [dive](deep-dives/garden-rows.md#build-slices-in-order).

Files expected: `src/games/garden-rows/logic.ts`, `logic.test.ts`, `index.ts`, `src/content/lands.ts` or registry tests as needed, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck and unit tests including the lands and registry band tests; one play of level 10 at preschool; `fingerdemo` at 10; the preschool Puzzle Peaks page screenshot.

### habitat-helpers 1: Equivalent pieces and pooled gardens

**Built 2026-11-02 ([PR #1128](https://github.com/rjdunlap/neo/pull/1128)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-02.md#2026-11-02--habitat-helpers-equivalent-pieces-and-pooled-gardens-habitat-helpers-batch-1); [build note](archive/COMPLETED-2026-10-09.md#habitat-helpers-equivalent-pieces-and-pooled-gardens-habitat-helpers-1-2026-11-02). Level 4's pool is four gardens, not six (only four two-piece gardens welcome exactly one visitor). No longer eligible for dispatch. Scope retained for reference.

- **`habitat-helpers`, equivalent pieces and pooled prediction gardens (dive slice 1)** (existing interaction; preschool to school, no new level): four new pieces so each role has two pictured options, seeded per-role picks at levels 1–3, and pooled level-4 gardens (four, not six). [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck and the game's rule tests; one filtered regression play at level 3 and level 4 with a non-default seed (the new cards visible, one incomplete test) and one portrait screenshot of level 3. The bot rule is unchanged, so `fingerdemo` only if its play changes; one build for the new art.

### habitat-helpers 2: Something changed

**Built 2026-11-03 ([PR #1170](https://github.com/rjdunlap/neo/pull/1170)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--habitat-helpers-level-7-something-changed-habitat-helpers-batch-2); [build note](archive/COMPLETED-2026-10-09.md#habitat-helpers-level-7-something-changed-habitat-helpers-2-2026-11-03). No longer eligible for dispatch. Scope retained for reference.

- **`habitat-helpers`, level 7 Something changed (dive slice 2)** (new interaction; school 4–7): a working garden loses one need and she names which need is missing and restores it; the need question is the game's first counted miss; satisfies the ecosystems study's F3 definition. [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck and rule tests; one scripted play of level 7 with one wrong need, a second for the glow, then the right need, one non-restoring card and the right one; one portrait screenshot with the before card; `fingerdemo` at 7; one build. Level 7 at pre-K stays a person check.

### habitat-helpers 3: The rocky shore

**Built 2026-11-04 ([PR #1216](https://github.com/rjdunlap/neo/pull/1216)):** checks in [VERIFICATION](archive/VERIFICATION-2026-11-04.md#2026-11-04--habitat-helpers-levels-89-the-rocky-shore-habitat-helpers-batch-3); [build note](archive/COMPLETED-2026-10-09.md#habitat-helpers-levels-89-the-rocky-shore-habitat-helpers-3-2026-11-04). No longer eligible for dispatch. Scope retained for reference.

- **`habitat-helpers`, levels 8–9 The rocky shore (dive slice 3, after batch 2)** (new interaction; school 4–9): who lives high and who lives low on a rocky shore, decided by needs rather than trivia; shares the level table and the bot rule with batch 2. [Dive](deep-dives/habitat-helpers.md#build-slices-in-order)

Files expected: `src/games/habitat-helpers/logic.ts`, `logic.test.ts`, `art.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck and rule tests; one scripted play of level 8 with the anemone on the high rock first and level 9 to its sticker; one portrait screenshot of the shore; `fingerdemo` at 8 and 9; one build.

### inchworm 1: Fresh things and the broken ruler

Built 2026-11-02, [PR #1129](https://github.com/rjdunlap/neo/pull/1129), branch `claude/inchworm-1`; [closeout](archive/COMPLETED-2026-10-09.md#inchworm-fresh-things-the-long-jump-and-level-8-the-broken-ruler-inchworm-batch-1-2026-11-02). Scope retained for dependency references; this batch is no longer eligible.

- **`inchworm`, fresh things and the broken ruler (dive slice 1)** (existing interaction; school): five new things with voice words, the long-jump round at level 3, and level 8 *The broken ruler* (school order `[1, 2, 7, 3, 4, 8, 5, 6]`, school max 8). [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 with the end-mark pad, a second miss for the glow, then the right pad; one level-3 play with a long-jump round; `fingerdemo` at 8; one portrait screenshot of the broken ruler; one build for the new art.

### inchworm 2: One worm, hop by hop

Built 2026-11-03, [PR #1172](https://github.com/rjdunlap/neo/pull/1172), branch `claude/inchworm-hop-by-hop`; [closeout](archive/COMPLETED-2026-10-09.md#inchworm-level-9-one-worm-hop-by-hop-inchworm-batch-2-2026-11-03). Scope retained for dependency references; this batch is no longer eligible.

- **`inchworm`, level 9 One worm, hop by hop (dive slice 2, after batch 1)** (new interaction; school): shares the order and the `THINGS` list with batch 1; school order `[1, 2, 7, 9, 3, 4, 8, 5, 6]`; batch 1 is built. [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests, one play of level 9 with one wrong count, a second for the glow, then the right pad; one portrait screenshot mid-hop; `fingerdemo` at 9.

### inchworm 3: Longer than the ruler

Built 2026-11-04, [PR #1198](https://github.com/rjdunlap/neo/pull/1198), branch `claude/inchworm-longer-than-ruler`; [closeout](archive/COMPLETED-2026-10-09.md#inchworm-level-10-longer-than-the-ruler-inchworm-batch-3-2026-11-04). Scope retained for dependency references; this batch is no longer eligible.

- **`inchworm`, level 10 Longer than the ruler (dive slice 3, after batch 1)** (new interaction; school top). [Dive](deep-dives/inchworm.md#build-slices-in-order)

Files expected: `src/games/inchworm/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests, one play of level 10 with one drop away from the slot (no miss), the second-part pad (a miss), a second for the glow, then the answer; one portrait screenshot with the chalk mark; `fingerdemo` at 10.

### island-bridges 1: A small sea to start and named hints

Built 2026-11-02, [PR #1130](https://github.com/rjdunlap/neo/pull/1130), branch `claude/island-bridges-1`; [closeout](archive/COMPLETED-2026-10-09.md#island-bridges-a-small-sea-to-start-and-named-hints-island-bridges-batch-1-2026-11-02). Scope retained for dependency references.

- **`island-bridges`, a small sea to start and named hints (dive slice 1)** (new level on the existing interaction; grown-up): level 5 (order `[5, 1, 2, 3, 4]`, `entryLevels: [5]`) and the `full`, `every-way` and `last-way` hints with their voice lines. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new level on the existing interaction: typecheck, the game's rule tests, one browser play of level 5 with one hint (its named line), `fingerdemo` at 5.

### island-bridges 2: Keep them joined

Built 2026-11-03, [PR #1180](https://github.com/rjdunlap/neo/pull/1180), branch `claude/island-bridges-2`; [closeout](archive/COMPLETED-2026-10-09.md#island-bridges-level-6-keep-them-joined-island-bridges-batch-2-2026-11-03). Scope retained for dependency references.

- **`island-bridges`, level 6 Keep them joined (dive slice 2, after batch 1)** (new rule on the existing interaction; grown-up): shares `hintFor`'s kinds and the order with batch 1; the isolation step, generator filter, `joined` hint (built name; the dive called it `isolation`) and its ring. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: typecheck, rule tests, one play of level 6 asking for hints until the isolation one (ring and line), then to the sticker; one portrait screenshot of the ring; `fingerdemo` at 6.

### island-bridges 3: Up to three planks

Built 2026-11-03, [PR #1185](https://github.com/rjdunlap/neo/pull/1185), branch `claude/island-bridges-three-planks`; [closeout](archive/COMPLETED-2026-10-09.md#island-bridges-level-7-up-to-three-planks-island-bridges-batch-3-2026-11-03). Scope retained for dependency references.

- **`island-bridges`, level 7 Up to three planks (dive slice 3, after batch 2)** (new rule on the existing tap; grown-up): shares the order with batch 2. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/games/island-bridges/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`. The shared rules change, so the couch suite follows.

Proof: new rule on the existing tap: typecheck, rule tests including the brute force at three, one play of level 7 with a third plank tap and a fourth that bumps, to the sticker; one portrait screenshot of a triple bridge; `fingerdemo` at 7; `BROWSER_SUITE=couchgames` filtered to Island Bridges.

### island-bridges 4: Joined Seas course

Built 2026-11-04, [PR #1202](https://github.com/rjdunlap/neo/pull/1202), branch `claude/island-bridges-joined-seas`; [closeout](archive/COMPLETED-2026-10-09.md#island-bridges-couch-course-joined-seas-island-bridges-batch-4-2026-11-04). Scope retained for dependency references.

- **`island-bridges`, couch course *Joined Seas* (dive slice 4, after batch 2)** (couch catalog; grown-up): five frozen level-6 seas (each with one answer, none `bycounting`) as a second `course.ts` entry, version 1, beside Island Hopping. [Dive](deep-dives/island-bridges.md#build-slices-in-order)

Files expected: `src/couch/` course and catalog files (`course.ts` and its tests), `src/games/island-bridges/logic.ts`, `docs/COUCH-PLAY.md`, the README row and `docs/GAMES.md`.

Proof: couch catalog tier: typecheck, course tests, `BROWSER_SUITE=couchgames` filtered to Island Bridges.

### island-bridges 5: School opening

Built 2026-11-04, [PR #1199](https://github.com/rjdunlap/neo/pull/1199), branch `claude/island-bridges-school`; [closeout](archive/COMPLETED-2026-10-09.md#island-bridges-school-opening-levels-5-and-1-at-child-size-island-bridges-batch-5-2026-11-04). Scope retained for dependency references.

- **`island-bridges`, school opening: levels 5 and 1 at child size (dive slice 5, defined 2026-11-04)** (new entry with a layout change; school): `school` joins `bands` playing existing levels 5 then 1 (order `[5, 1]`), home stays Lantern Lake (Wonder Woods lists it by subject), 100-unit cells and buttons at school only, accounting as built plus the `bridges.trouble` and `bridges.done-school` voice lines, how-to note. [Definition](definitions/island-bridges-school-opening.md)

Files expected: `src/games/island-bridges/index.ts`, `logic.ts` (or `layout.ts`) and their tests, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new entry with a layout change: typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 5 with a stray plank and one hint, then level 1 to the sticker, one portrait screenshot of the 7 by 7 sea, a logged 1024 × 768 layout check (cells and buttons at least 100), `fingerdemo` at school level 1.

### lantern-lights 1: A 6 by 6 pond

Built 2026-11-02, [PR #1131](https://github.com/rjdunlap/neo/pull/1131), branch `claude/lantern-lights-1`; [closeout](archive/COMPLETED-2026-10-09.md#lantern-lights-a-6-by-6-pond-lantern-lights-batch-1-2026-11-02).

- **`lantern-lights`, a 6 by 6 pond (dive slice 1)** (new levels on the existing interaction; grown-up): levels 7–8 (`PLANS` rows, grown-up max 8) and the portrait counts fix: when the room beside the pond is under about 260 units, the two counts sit in one line above it, clear of the top corner buttons. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new levels on the existing interaction: typecheck, the game's rule tests, one browser play of level 8 (a hint, then to the sticker), one portrait screenshot of level 8 with the counts, `fingerdemo` at 8. Trips stop at level 5 and the course is pinned at 6, so no couch suite.

### lantern-lights 2: Named hints and a short way

Built 2026-11-04, [PR #1207](https://github.com/rjdunlap/neo/pull/1207), branch `claude/lantern-lights-named-hints`; [closeout](archive/COMPLETED-2026-10-09.md#lantern-lights-named-hints-and-show-me-a-short-way-lantern-lights-batch-2-2026-11-04).

- **`lantern-lights`, named hints and Show me a short way (dive slice 2)** (new interaction; grown-up): `hintFor` kinds and two voice lines; the after-pond buttons and replay on touch only. Shares the `index.ts` layout with batch 1. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests (hint kinds by `ways`/`best` count; the replay reaches all-lit in `par`), one play at level 3 with one hint (its named line), lighting the pond and the replay, one portrait screenshot mid-replay, `fingerdemo` at 3 (the bot must press Next pond).

### lantern-lights 3: Lily-pad ponds

Built 2026-11-04, [PR #1217](https://github.com/rjdunlap/neo/pull/1217), branch `claude/lantern-lights-lily-pads`; [closeout](archive/COMPLETED-2026-10-09.md#lantern-lights-lily-pad-ponds-level-9-lantern-lights-batch-3-2026-11-04).

- **`lantern-lights`, lily-pad ponds, level 9 (dive slice 3)** (new rule on the existing tap; grown-up): masked `footprint`/`solve`/`parsePond`, authored shapes, pad art and `lantern.pads`. Shares `PLANS` and the max with batch 1. [Dive](deep-dives/lantern-lights.md#build-slices-in-order)

Files expected: `src/games/lantern-lights/logic.ts`, `logic.test.ts`, `index.ts`, `src/games/lantern-lights/course.test.ts` (since `parsePond` changes), its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`. The shared rules change, so the couch suite follows.

Proof: new rule: typecheck, rule tests including the brute force on every shape and the free-dimension cap, one play of level 9 with a tap on a pad (nothing counted) and a hint, to the sticker; one portrait screenshot; `fingerdemo` at 9; `BROWSER_SUITE=couchgames` filtered to Lantern Lights.

### lantern-lights 4: School opening

Built 2026-11-04, [PR #1200](https://github.com/rjdunlap/neo/pull/1200), branch `claude/lantern-lights-school`; [closeout](archive/COMPLETED-2026-10-09.md#lantern-lights-school-opening-levels-1-and-2-lantern-lights-batch-4-2026-11-04).

- **`lantern-lights`, school opening: levels 1 and 2 (dive slice 4, defined 2026-11-04)** (new band entry on the existing interaction, no layout change; school): `school` joins `bands` playing the two 3 by 3 levels (range 1-2, no `order`), home stays Lantern Lake (Wonder Woods lists it by subject), misses stay 0 with a once-a-pond `lantern.stuck-school` nudge toward Hint, a child's `lantern.go-school` instruction, no footprint preview, co-play and how-to step fixes. [Definition](definitions/lantern-lights-school-opening.md)

Files expected: `src/games/lantern-lights/index.ts`, `logic.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new band entry, no layout change: typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 1 with one hint and the stuck nudge, then level 2 to the sticker, one portrait screenshot, a logged 1024 × 768 check (cells and buttons at least 100), `fingerdemo` at school level 2.

### peekaround-island 1: Truthful support and real choices

- **`peekaround-island`, truthful support and real choices (dive slice 1)** (**built 2026-11-02**, [PR #1136](https://github.com/rjdunlap/neo/pull/1136); existing-game fix; all bands): a level-scoped how-to, the level-2 hint on the hider when visible, level 4's three shore friends, level 5's pair rule so the turn always names someone, and `lap` dropped from `LEVELS` and the repeated guard. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, its `voice.ts`, `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, rule tests (every request leaving a wrong spot, all three words at level 4, behind in level 5's first pair, the level-2 hint target), one filtered regression play at levels 2 and 5, `fingerdemo` at 5.

### peekaround-island 2: Level 5 Who will be in front?

- **`peekaround-island`, level 5 *Who will be in front?* (dive slice 2)** (**built 2026-11-04**, [PR #1219](https://github.com/rjdunlap/neo/pull/1219); existing level, new tap): she guesses who will be in front, from a picture card, before the half turn; any guess is free, not a miss. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: typecheck, rule tests, one play of level 5 with one wrong prediction (no miss) and one right, `fingerdemo` at 5.

### peekaround-island 3: Level 6 Who can't see it?

- **`peekaround-island`, level 6 *Who can't see it?* (dive slice 3)**, after batch 1 (new interaction; pre-K and school): she taps the friend who cannot see the pictured spot from where they stand; a wrong friend turns to show it can see; pre-K max 6, school max 6. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 6 with one wrong friend (the turn shows it can see), a second for the glow, then the right friend, one portrait screenshot with the picture card, `fingerdemo` at 6.

### peekaround-island 4: Level 7 What does the duck see?

- **`peekaround-island`, level 7 *What does the duck see?* (dive slice 4)** (**built 2026-11-04**, [PR #1227](https://github.com/rjdunlap/neo/pull/1227); new interaction, after batch 3): she chooses which of three picture cards shows what the duck sees from where it stands; pre-K and school max 7; the cards are live mini scenes (Containers), not render textures. [Dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 7 with one wrong card and its turn, a second for the glow, then the right card, one portrait screenshot of the three cards, `fingerdemo` at 7, one build for the render textures.

### peekaround-island 5: Level 8 From the sky

- **`peekaround-island`, level 8 *From the sky* (dive slice 5)** (**built 2026-11-04**, [PR #1231](https://github.com/rjdunlap/neo/pull/1231)), after batch 4 (school only, school range 4–8, pre-K unchanged at 7; new interaction): she chooses which of three top-down maps shows the island from above (friends as coloured dots around the tree). [Definition](definitions/peekaround-from-the-sky.md), [dive](deep-dives/peekaround-island.md#build-slices-in-order)

Files expected: `src/games/peekaround-island/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one scripted play of level 8 with a mirror map (a miss), a turned map (a miss, the island turns and back), the ring, then the right map, one portrait screenshot of the three maps, a logged check at a 1024×768 view that the crown's top clears the cards and the shadow ends above the bottom edge, `fingerdemo` at 8. No build needed.

### picture-graph 1: Fair meadows and a visible first pick

Built 2026-11-03, [PR #1138](https://github.com/rjdunlap/neo/pull/1138); [closeout](archive/COMPLETED-2026-10-09.md#picture-graph-fair-meadows-a-visible-first-pick-and-hints-that-show-why-picture-graph-batch-1-2026-11-03). Scope retained for dependency references (batch picture-graph 4 follows it); no longer eligible for dispatch.

- **`picture-graph`, Fair meadows, a visible first pick and hints that show why (dive slice 1)** (existing-game fix; pre-K and school): the placement fixes for levels 1–3 and 7, a visible first pick on every level, hints that show why, the `bear` critter and two seeded backdrops. [Dive](deep-dives/picture-graph.md#build-slices-in-order)

Files expected: `src/games/picture-graph/logic.ts`, `logic.test.ts`, `index.ts`, `src/art/`, its `voice.ts`, `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, rule tests including the placement sweep for levels 1–3 and 7 and the "how many more" distractor, one filtered regression play at levels 4 and 7 with a double tap on one bar and two wrong "how many more" answers; `fingerdemo` only if the bot's taps change.

### picture-graph 2: Level 8 Line them up

Built 2026-11-03, [PR #1181](https://github.com/rjdunlap/neo/pull/1181); [closeout](archive/COMPLETED-2026-10-09.md#picture-graph-level-8-line-them-up-picture-graph-batch-2-2026-11-03). Scope retained for dependency references (batch picture-graph 3 follows it); no longer eligible for dispatch.

- **`picture-graph`, Level 8, *Line them up* (dive slice 2)** (new interaction; pre-K and school): she lines real things (shells, stones, driftwood, feathers; never litter) in rows by kind and reads which row has more; first in pre-K's `order`, declared in `entryLevels`, second-tier in school's order after level 2. [Dive](deep-dives/picture-graph.md#build-slices-in-order)

Files expected: `src/games/picture-graph/logic.ts`, `logic.test.ts`, `index.ts`, `src/art/`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including order, entry and lands, one scripted play at pre-K and one at school with one wrong row and the matching-lines hint, one portrait screenshot of the tray, `fingerdemo` at 8, one build for the art and voice.

### picture-graph 3: Level 9 A key of five

Built 2026-11-03, [PR #1188](https://github.com/rjdunlap/neo/pull/1188); [closeout](archive/COMPLETED-2026-10-09.md#picture-graph-level-9-a-key-of-five-picture-graph-batch-3-2026-11-03). Scope retained for dependency references (batch picture-graph 4 follows batch 1); no longer eligible for dispatch.

- **`picture-graph`, Level 9, *A key of five* (dive slice 3)**, after batch picture-graph 2 (independent except for the level number) (new level on an existing interaction): a keyed graph where one mark stands for five, with a one-per-mark bar and the blocks answer; school. [Dive](deep-dives/picture-graph.md#build-slices-in-order)

Files expected: `src/games/picture-graph/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-level tier: typecheck, rule tests, one play of level 9 with a one-per-mark bar and the blocks answer, `fingerdemo` at 9, one portrait screenshot.

### picture-graph 4: Level 10 Two pictures, one meadow

Built 2026-11-03, [PR #1193](https://github.com/rjdunlap/neo/pull/1193); [closeout](archive/COMPLETED-2026-10-09.md#picture-graph-level-10-two-pictures-one-meadow-picture-graph-batch-4-2026-11-03). Scope retained for dependency references (batch picture-graph 5 follows); no longer eligible for dispatch.

- **`picture-graph`, Level 10, *Two pictures, one meadow* (dive slice 4)**, after batch picture-graph 1 (the first-pick lift) (new interaction): she compares two different-looking pictures of one meadow and picks the pair that show the same counts, with a trap picture that does not. [Dive](deep-dives/picture-graph.md#build-slices-in-order)

Files expected: `src/games/picture-graph/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play with the trap then the right pair, one portrait screenshot, `fingerdemo` at 10.

### picture-graph 5: Level 11 What the graph can say

Built 2026-11-04, [PR #1201](https://github.com/rjdunlap/neo/pull/1201); [closeout](archive/COMPLETED-2026-10-09.md#picture-graph-level-11-what-the-graph-can-say-picture-graph-batch-5-2026-11-04). Scope retained for dependency references; no longer eligible for dispatch.

- **`picture-graph`, Level 11, *What the graph can say* (dive slice 5)**, after batch picture-graph 4 (built) (new interaction): every claim is decided by what is on the screen; she stamps a claim as what the graph says or what it can't say (it does not measure that), never a guess about another meadow. [Dive](deep-dives/picture-graph.md#build-slices-in-order)

Files expected: `src/games/picture-graph/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play with one wrong can't-say stamp and the glow, one portrait screenshot, `fingerdemo` at 11, one build for the voice. A person check stays open.

### picture-logic 1: Fresh pictures and named hints

- **`picture-logic`, Fresh pictures and named hints (dive slice 1)** (**built 2026-11-03**, [PR #1139](https://github.com/rjdunlap/neo/pull/1139); extends the built game; grown-up, no new level): eight easier and eight harder 10 by 10 pictures and five 15 by 15 pictures, and a `why` on fill and cross hints with four voice lines. [Dive](deep-dives/picture-logic.md#build-slices-in-order)

Files expected: `src/games/picture-logic/logic.ts`, `pictures.ts`, `logic.test.ts`, `index.ts`, its `voice.ts` and `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests, one filtered regression play at level 2 asking for one hint (its named line); bot unchanged, no `fingerdemo`.

### picture-logic 2: A small 5 by 5 to start and a harder 15 by 15

- **`picture-logic`, Level 5 a small 5 by 5 to start and level 7 a 15 by 15 that needs more care (dive slice 2)** (**built 2026-11-04**, [PR #1220](https://github.com/rjdunlap/neo/pull/1220)), after batch picture-logic 1 (shares `pictures.ts` and the bank tests) (new levels on an existing interaction; grown-up): order `[5, 1, 2, 3, 4, 7]` with `entryLevels: [5]`. [Dive](deep-dives/picture-logic.md#build-slices-in-order)

Files expected: `src/games/picture-logic/logic.ts`, `pictures.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-level tier: typecheck, rule tests (order, entry, the 5 by 5 frame), one browser play of level 5 and of level 7 with one hint, `fingerdemo` at 5 and 7, one portrait screenshot of level 5.

### picture-logic 3: Two colours

- **`picture-logic`, Level 6, *Two colours* (dive slice 3)** (**built 2026-11-04**, [PR #1224](https://github.com/rjdunlap/neo/pull/1224)), after batch picture-logic 2 (shares the order) and [Pixel Pictures batch 1](#pixel-pictures-1-fresh-pictures-and-colour-logic) (its `colorLineSolvable`) (new interaction; grown-up): colour pots and colour clues, a wrong-colour fill and a hint naming it. [Dive](deep-dives/picture-logic.md#build-slices-in-order)

Files expected: `src/games/picture-logic/logic.ts`, `pictures.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests, one play of level 6 with one wrong-colour fill and a hint naming it, then to the sticker; one portrait screenshot of the colour pots and clues; `fingerdemo` at 6; one build. The building session confirms the couch trip keeps to its built levels.

### pond-conga 1: Duck-friendly food and a seeded bank

- **`pond-conga`, Duck-friendly food and a seeded bank (dive slice 1)** (**built 2026-11-03**, [PR #1140](https://github.com/rjdunlap/neo/pull/1140); extends the built game; grown-up, no new level): `foodArt(kind)` with peas, sweetcorn and oats, one kind per pond by seed; reeds on one seeded bank edge; voice, how-to and couch catalog wording without bread. [Dive](deep-dives/pond-conga.md#build-slices-in-order)

Files expected: `src/games/pond-conga/index.ts`, `logic.ts`, `logic.test.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md` and `docs/COUCH-PLAY.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests (kind is seeded; pond unchanged; Crumb Trail par unchanged), one filtered regression play at level 1; bot unchanged, no `fingerdemo`; one build for the art.

### pond-conga 2: Choose the order

- **`pond-conga`, Level 7, *Choose the order* (dive slice 2)** (**built 2026-11-04**, [PR #1223](https://github.com/rjdunlap/neo/pull/1223); builds on the built food art) (new rule on the existing interaction; grown-up): groups of food eaten in an order she chooses, par over orders, a group-aware demo pond and a hint to a best-order item. [Dive](deep-dives/pond-conga.md#build-slices-in-order)

Files expected: `src/games/pond-conga/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-rule tier: typecheck, rule tests (par over orders, group-aware demo pond, hint to a best-order item), one play of level 7 eating a group in a longer order then with one hint, `fingerdemo` at 7, one portrait screenshot of a group of three.

### pond-conga 3: Step by step

- **`pond-conga`, Level 8, *Step by step* (dive slice 3)** (**built 2026-11-04**, [PR #1226](https://github.com/rjdunlap/neo/pull/1226); new interaction; grown-up, easy entry): the conga moves one step per input, with no movement without input. [Dive](deep-dives/pond-conga.md#build-slices-in-order)

Files expected: `src/games/pond-conga/index.ts`, `logic.ts`, `logic.test.ts`, its `voice.ts`, its `howto.ts`, `scripts/browser-check.mjs` if a case is needed, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests (order, entry, no movement without input), one scripted play of level 8 to its sticker with one bonk, one portrait screenshot, `fingerdemo` at 8, `BROWSER_SUITE=couchgames` filtered to Pond Conga (the controller path changes).

### pond-conga 4: A long conga

- **`pond-conga`, Level 9, *A long conga* (dive slice 4)** (**built 2026-11-04**, [PR #1230](https://github.com/rjdunlap/neo/pull/1230)), after batch pond-conga 2 (shares the level table and `order`) (new level; grown-up): a longer tail on a pond that rewards planning. [Dive](deep-dives/pond-conga.md#build-slices-in-order)

Files expected: `src/games/pond-conga/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-level tier: typecheck, rule tests, one play of level 9 with a tail bonk, `fingerdemo` at 9, one portrait screenshot.

### pond-conga 5: School opening

Defined 2026-11-04; after batch pond-conga 3 (shares `index.ts`, `PLANS`, `LEVELS` and `entryLevels` with batches 2–4, so whichever lands later rebases).

- **`pond-conga`, school opening: levels 10 and 11 step by step (dive slice 5, defined 2026-11-04)** (**built 2026-11-04**, [PR #1233](https://github.com/rjdunlap/neo/pull/1233)) (new band entry with a layout change and a school-only input rule; school): `school` joins `bands` playing two 4-row step-by-step ponds (7 by 4 at 100-unit cells), a swipe or tap-toward step moves the line one cell and it waits otherwise, a bump leaves the line in place with `conga.bonk-school`, the dots appear on the second bump without counting a hint, home stays Lantern Lake, a child's instruction, level-scoped how-to steps and co-play. [Definition](definitions/pond-conga-school-opening.md)

Files expected: `src/games/pond-conga/index.ts`, `logic.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new band entry with a layout change and a school-only input rule: typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 10 with one bump (the line stays put), a second bump (the dots appear, no hint counted), then a tap-toward step and the sticker, then level 11 to its sticker, one portrait screenshot of the 7 by 4 pond, the logged 1024 × 768 sizes, `fingerdemo` at school level 11, one build for the voice lines. `couchgames` is not needed.

### quick-tricks 1: Truthful accounting, a seeded cast and a bow

- **`quick-tricks`, Truthful accounting, a seeded cast and a bow for the second show (dive slice 1)** (**built 2026-11-03**, [PR #1141](https://github.com/rjdunlap/neo/pull/1141); extends the built game; no new level): a leaf dropped below Bunny is free in level 1, show two hides the yellow arrow during Picnic Places and repeats `tricks.next` after ten quiet seconds, ends with a cast bow and `tricks.done`, its friends are `Critter`s, payoffs for the mailbox flag, friend wiggle and berry gulp, and a seeded friend, crosser and monster colour in show one with per-critter instruction lines. [Dive](deep-dives/quick-tricks.md#build-slices-in-order)

Files expected: `src/games/quick-tricks/index.ts`, `logic.ts`, `logic.test.ts`, its `voice.ts`, its `howto.ts` and `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, the game's rule tests, one filtered regression play of level 1 with a leaf dropped below Bunny (no miss) and of level 4 to its sticker; `fingerdemo` at 4 only if the bot's play changes; one build if voice lines are added.

### quick-tricks 2: Two at once

- **`quick-tricks`, Level 7, *Two at once* (dive slice 2)** (**built 2026-11-04**, [PR #1228](https://github.com/rjdunlap/neo/pull/1228); shares `index.ts` and the cast; new rule on the existing interaction): two tricks asked at once across three friends. [Dive](deep-dives/quick-tricks.md#build-slices-in-order)

Files expected: `src/games/quick-tricks/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-rule tier: typecheck, rule tests, one play of level 7 with one leaf over only two friends (kept, no miss), one wrong sock and the glow, then to the sticker, one portrait screenshot of the three friends, `fingerdemo` at 7.

### quick-tricks 3: A tiny show, the toddler entry

- **`quick-tricks`, Level 8, *A tiny show*, the toddler entry (dive slice 3)** (**built 2026-11-04**, [PR #1232](https://github.com/rjdunlap/neo/pull/1232)), after batch quick-tricks 1 (new level with `order`): an easy toddler opening. [Dive](deep-dives/quick-tricks.md#build-slices-in-order)

Files expected: `src/games/quick-tricks/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-level tier with `order`: typecheck, unit tests including the registry, lands and order/entry tests, one play of level 8 at toddler with a leaf in front of Bunny (succeeds) and a short pull past halfway, `fingerdemo` at 8.

### quick-tricks 4: The third show

- **`quick-tricks`, Level 9, *The third show* (dive slice 5)** (**built 2026-11-04**, [PR #1235](https://github.com/rjdunlap/neo/pull/1235)), after batch quick-tricks 1 (independent of batches 2 and 3): music box crank, fill the cups, loop the fireflies. [Dive](deep-dives/quick-tricks.md#build-slices-in-order), [definition](definitions/quick-tricks-third-show.md)

Files expected: `src/games/quick-tricks/third-logic.ts`, `third-logic.test.ts`, `third-show.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests, one scripted play of level 9 at pre-K with a crank released mid-turn, one overfilled cup tipped out (no miss), two wrong loops then the glow, to the sticker, one portrait screenshot of the music box mid-turn, `fingerdemo` at 9, one build for the voice lines.

### read-do 1: Fresh words and pictures

Built 2026-11-03, [PR #1142](https://github.com/rjdunlap/neo/pull/1142); [build note](archive/COMPLETED-2026-10-09.md#read--do-fresh-words-and-pictures-read-do-batch-1-2026-11-03). No longer eligible for dispatch.

- **`read-do`, Fresh words and pictures (dive slice 1)** (extends the built game; no new level): level 1's five-colour pool, level 2's seeded animal and third round, level 3's seeded pair, *green, pink, pig, dog* voice lines, and the GAMES.md entry moved under Story Grove. [Dive](deep-dives/read-do.md#build-slices-in-order)

Files expected: `src/games/read-do/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts` and `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests, one filtered regression play at level 3 on a seed with a pig or dog, one build for the voice lines; bot unchanged, no `fingerdemo`.

### read-do 2: Capital and stop

Built 2026-11-04, [PR #1234](https://github.com/rjdunlap/neo/pull/1234); [build note](archive/COMPLETED-2026-10-09.md#read--do-capital-and-stop-levels-46-read-do-batch-2-2026-11-04). No longer eligible for dispatch.

- **`read-do`, Levels 4–6, *Capital and stop* (dive slice 2; SS1 A–C)**, after batch read-do 1 (adds *pig* and *dog*; new interaction): capital, full stop, Send and Show it, *jumps/sleeps* and pre-K's `order`. [Dive](deep-dives/read-do.md#build-slices-in-order), [definition](definitions/read-do-capital-stop.md#build-order-for-the-dive)

Files expected: `src/games/read-do/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, a `scripts/browser-check.mjs` case, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests, one filtered `readdo` play of level 4 and level 6 with one failed Send and one hint, one portrait screenshot, `fingerdemo` at 4, 5 and 6.

### read-do 3: Make the sign

Built 2026-11-04, [PR #1241](https://github.com/rjdunlap/neo/pull/1241); [build note](archive/COMPLETED-2026-10-09.md#read--do-make-the-sign-level-7-read-do-batch-3-2026-11-04). No longer eligible for dispatch.

- **`read-do`, level 7 *Make the sign* (dive slice 3; WC3)**, after batch read-do 2 (new interaction): a friend's wish card, a tray of word tiles dragged into the sign row, Show it and Send. [Dive](deep-dives/read-do.md#build-slices-in-order), [definition](definitions/read-do-make-the-sign.md#build-order-and-check-tier)

Files expected: `src/games/read-do/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, a `readdo` case in the browser check script, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including registry, lands, how-to and layout, one filtered `readdo` play of level 7 with one failed Send and a second to raise the glow, one portrait screenshot of the tray, `fingerdemo` at 7, one build for the voice lines. The definition asks this build not to hard-code what levels 8–9 change: words that start in the sign with home tray slots, `signLayout(view, level)` taking the level, and drop resolution through one function a swap zone can extend ([couplings](definitions/read-do-mend-the-sign.md#build-order-and-check-tier)).

### read-do 4: Mend the sign

Built 2026-11-05, [PR #1247](https://github.com/rjdunlap/neo/pull/1247); [build note](archive/COMPLETED-2026-10-09.md#read--do-levels-89-mend-the-sign-read-do-batch-4-2026-11-05). No longer eligible for dispatch.

- **`read-do`, levels 8–9 *Mend the sign* (dive slice 4; KE1)**, after batch read-do 3 (level 8 new levels on level 7's interaction; level 9 a new interaction): the printed sign acted out, one insert or delete at level 8, one swap at level 9. [Dive](deep-dives/read-do.md#build-slices-in-order), [definition](definitions/read-do-mend-the-sign.md#build-order-and-check-tier)

Files expected: `src/games/read-do/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, a `readdo` case in the browser check script, the README row and `docs/GAMES.md`.

Proof: typecheck, unit tests including registry, lands, how-to and layout, one filtered `readdo` play of level 8 with a Send of the unchanged sign then a second failed Send to raise the glow, then level 9 to its sticker via one swap, one portrait screenshot of the swap preview, `fingerdemo` at 8 and 9, one build for the voice lines; stop after 8 with a checkpoint if the allowance cannot cover 9.

### rhyme-time 1: Fresh families: bug, sock and snail

Built 2026-11-03, [PR #1143](https://github.com/rjdunlap/neo/pull/1143); [build note](archive/COMPLETED-2026-10-09.md#rhyme-time-fresh-families-bug-sock-and-snail-rhyme-time-batch-1-2026-11-03). No longer eligible for dispatch.

- **`rhyme-time`, Fresh families: bug, sock and snail (dive slice 1)** (extends the built game; no new level): nine pictures (seven new drawings in `pictures.ts`, `rock` and `pail` from `src/art/shore.ts`), the `ug`, `ock` and `ail` families, the reviewed meaning tags, the re-pinned riddle pool and the GAMES.md counts (38 pictures in fifteen families). [Dive](deep-dives/rhyme-time.md#build-slices-in-order)

Files expected: `src/games/rhyme-time/logic.ts`, `logic.test.ts`, `pictures.ts`, `index.ts` and `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests with the re-pinned riddle pool, one filtered regression play at level 4 on a seed showing a new family; bot unchanged, no `fingerdemo`.

### rhyme-time 2: Level 8 Silly pairs

Built 2026-11-04, [PR #1236](https://github.com/rjdunlap/neo/pull/1236); [build note](archive/COMPLETED-2026-10-09.md#rhyme-time-level-8-silly-pairs-rhyme-time-batch-2-2026-11-04). No longer eligible for dispatch.

- **`rhyme-time`, Level 8 *Silly pairs* (dive slice 2)**, after batch rhyme-time 1 (its three new pairs; new interaction): a place in the middle and three riders below, the one that rhymes hops in; pre-K `order: [1, 8, 2, 3, 5]`, school `order: [2, 8, 3, 4, 5, 6, 7]`. [Dive](deep-dives/rhyme-time.md#build-slices-in-order)

Files expected: `src/games/rhyme-time/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the browser harness's Rhyme Time case, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including order and entry, one scripted play of level 8 with one wrong rider and a second for the glow then the rider, one portrait screenshot of a scene, `fingerdemo` at 8, one build for the voice lines.

### rhyme-time 3: Level 9, the preschool opening

Built 2026-11-04, [PR #1242](https://github.com/rjdunlap/neo/pull/1242); [build note](archive/COMPLETED-2026-10-09.md#rhyme-time-level-9-silly-pairs-two-to-choose-rhyme-time-batch-3-2026-11-04). No longer eligible for dispatch.

- **`rhyme-time`, Level 9, *Silly pairs, two to choose* (dive slice 3; chunk 18 preschool entry)**, after batch rhyme-time 2 (new band): level 8's scenes with two choices and three scenes per round; preschool `{ min: 8, max: 9, order: [9, 8] }`, `entryLevels: [9]`; Rhyme Time joins Story Grove's preschool page. [Dive](deep-dives/rhyme-time.md#build-slices-in-order)

Files expected: `src/games/rhyme-time/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the lands and registry band tests, the README row and `docs/GAMES.md`.

Proof: new-band tier: typecheck, unit tests including the lands and registry band tests, one play of level 9 at preschool, `fingerdemo` at 9, the preschool Story Grove page screenshot.

### rhyme-time 4: Level 10 Rhyme baskets

Built 2026-11-04, [PR #1239](https://github.com/rjdunlap/neo/pull/1239); [build note](archive/COMPLETED-2026-10-09.md#rhyme-time-level-10-rhyme-baskets-rhyme-time-batch-4-2026-11-04). No longer eligible for dispatch.

- **`rhyme-time`, Level 10 *Rhyme baskets* (dive slice 4)**, after batch rhyme-time 1 (new interaction): drag each picture into the basket whose key picture it rhymes with; school range 2–10. [Dive](deep-dives/rhyme-time.md#build-slices-in-order)

Files expected: `src/games/rhyme-time/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the browser harness's Rhyme Time case, the README row and `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests, one scripted play with a wrong basket, a second for the glow and an empty-space drop, one portrait screenshot, `fingerdemo` at 10.

### secret-code 1: Fair rows, a hint that keeps up and three doors

Built 2026-11-03, [PR #1144](https://github.com/rjdunlap/neo/pull/1144); [build note](archive/COMPLETED-2026-10-09.md#secret-code-fair-rows-a-hint-that-keeps-up-and-three-doors-secret-code-batch-1-2026-11-03). No longer eligible for dispatch.

- **`secret-code`, Fair rows, a hint that keeps up and three doors (dive slice 1)** (extends the built game; no new level): misses counted only from tries on screen, the refreshed hint, the "no more of that stone" line and three seeded doors. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, the game's rule tests including the hidden-row case and the refreshed hint, one filtered regression play of level 5 in landscape with seven tries and a stone ruled out only by a hidden row (no miss), one portrait screenshot of the gate; bot unchanged, no `fingerdemo`.

### secret-code 2: Level 8 Four slots, a repeat

Built 2026-11-04, [PR #1238](https://github.com/rjdunlap/neo/pull/1238); [build note](archive/COMPLETED-2026-10-09.md#secret-code-level-8-four-slots-a-repeat-secret-code-batch-2-2026-11-04). No longer eligible for dispatch.

- **`secret-code`, Level 8 *Four slots, a repeat* (dive slice 2)**, after batch secret-code 1 (shares the plan table and the visible-rows rule; new level): four slots with a repeated colour. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-level tier: typecheck, rule tests, one play of level 8 to its sticker, `fingerdemo` at 8.

### secret-code 3: Level 9 Be the door

Built 2026-11-05, [PR #1246](https://github.com/rjdunlap/neo/pull/1246); [build note](archive/COMPLETED-2026-10-09.md#secret-code-level-9-be-the-door-secret-code-batch-3-2026-11-05). School only (pre-K stays 1–3, following the dive). No longer eligible for dispatch.

- **`secret-code`, Level 9 *Be the door* (dive slice 3)**, after batch secret-code 1 (new interaction): she chooses the code and marks the pet's tries with gray, yellow and green discs; pre-K and school `order` gain 9. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including `order`, one scripted play of level 9 with a made code, one wrong mark and a second for the glow, then to the sticker, one portrait screenshot with the mark discs, `fingerdemo` at 9.

### secret-code 4: Level 10 One slot, the preschool opening

Built 2026-11-05, [PR #1249](https://github.com/rjdunlap/neo/pull/1249); [build note](archive/COMPLETED-2026-10-09.md#secret-code-level-10-one-slot-secret-code-batch-4-2026-11-05). No longer eligible for dispatch.

- **`secret-code`, Level 10 *One slot*, the preschool opening (dive slice 4; chunk 18 preschool entry)**, after batch secret-code 1 (new band): one slot, a tap and the key give a green or a crossed-out gray at once; Secret Code joins Puzzle Peaks' preschool page. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-band tier: typecheck, unit tests including the lands and registry band tests, one play of level 10 at preschool with one crossed-out stone tried, `fingerdemo` at 10, the preschool Puzzle Peaks page screenshot.

### secret-code 5: Level 11 A bigger detective door

Built 2026-11-04, [PR #1243](https://github.com/rjdunlap/neo/pull/1243); [build note](archive/COMPLETED-2026-10-09.md#secret-code-level-11-a-bigger-detective-door-secret-code-batch-5-2026-11-04). No longer eligible for dispatch.

- **`secret-code`, Level 11 *A bigger detective door* (dive slice 5)**, after batch secret-code 2 (shares the order; new level): a larger deduction door built on level 8's four slots. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-level tier with a layout check: typecheck, rule tests (uniqueness and the time bound), one play of level 11 with one contradicting try, one portrait screenshot of four shown rows, `fingerdemo` at 11.

### secret-code 6: Couch course The Code Doors

Built 2026-11-05, [PR #1255](https://github.com/rjdunlap/neo/pull/1255); [build note](archive/COMPLETED-2026-10-09.md#secret-code-couch-course-the-code-doors-secret-code-batch-6-2026-11-05). No longer eligible for dispatch.

- **`secret-code`, Couch course *The Code Doors* (dive slice 6)**, after batch secret-code 1 (couch catalog): five frozen codes at levels 4–6, par from the fixed reference solver (`nextMove`) per the October 23 rule. [Dive](deep-dives/secret-code.md#build-slices-in-order)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, `src/couch/course.ts`, the couch catalog, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: couch catalog tier: course tests, `BROWSER_SUITE=couchgames` filtered to Secret Code.

### secret-code 7: Level 12 Swap seats

Built 2026-11-05, [PR #1258](https://github.com/rjdunlap/neo/pull/1258); [build note](archive/COMPLETED-2026-10-09.md#secret-code-level-12-swap-seats-secret-code-batch-7-2026-11-05). No longer eligible for dispatch.

- **`secret-code`, Level 12 *Swap seats* (dive slice 8)**, after batch secret-code 3 (built; reuses level 9's mark discs; new interaction): school only; a seat question (Two of us / Just me), she makes a code and marks a grown-up's tries under a lid, then swaps and breaks the grown-up's code with levels 3–6 rules; Just me puts the pet in seat 2; two-seat rounds finish through `swapResult` with at least one hint (supported completion); school `order` becomes [2,3,4,9,12,5,6,7,8,11]; seven new `code.*` voice lines. [Dive](deep-dives/secret-code.md#level-12-swap-seats-maker-and-breaker-defined-2026-11-05)

Files expected: `src/games/secret-code/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including `swapResult` never smooth with two seats and `order`, one scripted Two of us play of level 12 with one wrong mark and one ignored clue to the sticker, portrait screenshots of the seat question and the lid, `fingerdemo` at 12.

### shape-buddies 1: What grows

- **`shape-buddies`, What grows: three seeds and sprouts (dive slice 1; built 2026-11-03, PR #1145)** (extends the built game; no new level): a seeded bean, sunflower or acorn with its own code-drawn sprout, and the guidance test over every `PLANS` level. [Dive](deep-dives/shape-buddies.md#build-slices-in-order)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, the game's rule tests, one filtered regression play of level 1 to its sticker, one portrait screenshot of a non-bean sprout; bot unchanged, no `fingerdemo`.

### shape-buddies 2: Level 4 Down and catch

Built 2026-11-04, [PR #1244](https://github.com/rjdunlap/neo/pull/1244); [build note](archive/COMPLETED-2026-10-09.md#shape-buddies-level-4-down-and-catch-shape-buddies-batch-2-2026-11-04). No longer eligible for dispatch.

- **`shape-buddies`, Level 4 *Down and catch* (dive slice 2)** (new level): the near half is raised like level 2's bridge dock and the far half sits at the low bank, so the handle must slope down to a cup. [Dive](deep-dives/shape-buddies.md#build-slices-in-order)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-level tier: typecheck, rule tests (the exact accepted set, the step-aware joined lines), one play of level 4 with a flat path first then to its sticker, one portrait screenshot of the raised near half, `fingerdemo` at 4, one build for the voice lines.

### shape-buddies 3: Level 5 A cup on the ledge

Built 2026-11-05, [PR #1248](https://github.com/rjdunlap/neo/pull/1248); [build note](archive/COMPLETED-2026-10-09.md#shape-buddies-level-5-a-cup-on-the-ledge-shape-buddies-batch-3-2026-11-05). No longer eligible for dispatch.

- **`shape-buddies`, Level 5 *A cup on the ledge* (dive slice 3)** (batch shape-buddies 2 built; shares `PLANS`, `LEVELS` and the joined-line changes; new rule): a rocky crack with a ledge, solved by a bridge plus a cup or by one cup on the ledge. [Dive](deep-dives/shape-buddies.md#build-slices-in-order)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-rule tier: typecheck, rule tests (both families, guidance keeps a working friend, the carry from either dock), one play of level 5 solved with the cup on the ledge and a replay solved with bridge and cup, one portrait screenshot of the ledge, `fingerdemo` at 5, one build.

### shape-buddies 4: Level 6 Which way round

Built 2026-11-05, [PR #1253](https://github.com/rjdunlap/neo/pull/1253); [build note](archive/COMPLETED-2026-10-09.md#shape-buddies-level-6-which-way-round-shape-buddies-batch-4-2026-11-05). No longer eligible for dispatch.

- **`shape-buddies`, Level 6 *Which way round?* (dive slice 4)**, after batch shape-buddies 3 (new interaction): the stream runs the other way and she presses a new Turn button so a slope faces down toward the low bank; school only. [Dive](deep-dives/shape-buddies.md#build-slices-in-order)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including the four-view layout with Turn, one scripted play with an unturned slope then Turn to the sticker, one portrait screenshot of the mirrored stream, `fingerdemo` at 6, one build.

### shape-buddies 5: Level 7 One friend, one job, the preschool opening

Built 2026-11-05, [PR #1256](https://github.com/rjdunlap/neo/pull/1256); [build note](archive/COMPLETED-2026-10-09.md#shape-buddies-level-7-one-friend-one-job-shape-buddies-batch-5-2026-11-05). No longer eligible for dispatch.

- **`shape-buddies`, Level 7 *One friend, one job*, the preschool opening (dive slice 5)** (batch shape-buddies 2 built; shares `LEVELS`; new band): one friend, a fixed plank over the gap and a cup at the catch; Shape Buddies joins Tinker Lab's preschool page and pre-K gains `order: [7, 1, 2, 3, 4, 5]` with `entryLevels: [7]`. [Dive](deep-dives/shape-buddies.md#build-slices-in-order)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, and the lands and registry band tests only if their expectations change.

Proof: new-band tier: typecheck, unit tests including the lands, registry band and order/entry tests, one play of level 7 at preschool with a Flat friend at the catch first, `fingerdemo` at 7, the preschool Tinker Lab page screenshot.

### shape-buddies 6: Level 8 Your friend, my friend

Built 2026-11-05, [PR #1265](https://github.com/rjdunlap/neo/pull/1265); [build note](archive/COMPLETED-2026-10-09.md#shape-buddies-level-8-your-friend-my-friend-shape-buddies-batch-6-2026-11-05). No longer eligible for dispatch.

- **`shape-buddies`, Level 8 *Your friend, my friend* (dive slice 7)** (batch shape-buddies 5 built; shares `LEVELS` and the pre-K `order`; new interaction): a seat question, then level 3's spoon built by two people taking turns with one friend each (a drop passes the turn, a failed Try hands it to the friend whose role broke); **Just me** is level 3's solo switch. Pre-K `order: [7, 1, 2, 3, 8, 4, 5]`, school `order: [1, 2, 3, 8, 4, 5, 6]`. [Definition](deep-dives/shape-buddies.md#level-8-your-friend-my-friend-shared-roles-defined-2026-11-05)

Files expected: `src/games/shape-buddies/logic.ts`, `logic.test.ts`, `index.ts`, `src/art/seats.ts` (new, Secret Code's `twoArt()` moved), `src/games/secret-code/index.ts` (the import only), its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, unit tests including the turn rule, `sharedResult` and both orders, one play of level 8 at pre-K in Two of us with a tap on the dimmed friend and a failed Try that hands the turn over, then to the sticker, one portrait screenshot of the seat question, `fingerdemo` at 8, one build, one filtered Secret Code play of level 12 to its seat question.

### sing-along-barn 1: Tunes with their own notes

- **`sing-along-barn`, Twinkle and Wheels on the Bus (dive slice 1)** (**built 2026-11-03**, branch `claude/sing-along-barn-1`, PR #1146; extends the built game; two new tunes): the test-guarded exception for tunes with their own notes, the two tunes, the name placeholder, the two-row chooser and the voice lines; the notes source-checked from a score and cited in GAMES. [Dive](deep-dives/sing-along-barn.md#build-slices-in-order)

Files expected: `src/games/sing-along-barn/logic.ts`, `logic.test.ts`, `index.ts`, `src/audio/sfx.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: existing-interaction tier plus layout: typecheck, the game's rule tests (exception allow-list, one note per syllable, answers, the placeholder), one filtered play at level 5 choosing Twinkle and at level 1 on a Wheels seed, one portrait screenshot of the ten-card chooser, `fingerdemo` at 5, one build for the voice lines and `sfx` change.

### sing-along-barn 2: Level 7 Finish the line

- **`sing-along-barn`, Level 7 *Finish the line* (dive slice 2)** (**built 2026-11-05**, branch `claude/sing-along-barn-finish-line`, PR #1259), after batch sing-along-barn 1 (shares the tune tables; Twinkle's gap word; new level): the tune stops before the rhyming word and a picture waits at the door; any touch sings it. [Dive](deep-dives/sing-along-barn.md#build-slices-in-order)

Files expected: `src/games/sing-along-barn/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, and the lands and registry tests only if their expectations change.

Proof: new-level tier with `order`: typecheck, unit tests including order, lands and the gap table, one play of level 7 at toddler mashing through the pause, one portrait screenshot of the picture at the door, `fingerdemo` at 7, one build.

### sing-along-barn 3: Level 8 Which one finishes it?

- **`sing-along-barn`, Level 8 *Which one finishes it?* (dive slice 3)** (**built 2026-11-05**, branch `claude/sing-along-which-finishes`, PR #1264), after batch sing-along-barn 2 (shares `LEVELS` and the gap table; new interaction): two pictures at the pause, only the rhyming word finishes the line, a non-rhyming pick is a miss. [Dive](deep-dives/sing-along-barn.md#build-slices-in-order)

Files expected: `src/games/sing-along-barn/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests for the rhyme table and seeded side, one play of level 8 with one wrong picture, a second for the glow, then the rhyme, one portrait screenshot, `fingerdemo` at 8.

### sink-float 1: Fresh things

- **`sink-float`, Fresh things (dive slice 1)** (**built 2026-11-03**, branch `claude/sink-float-fresh-things`, PR #1147) (extends the built game; fresh content in levels 1–4 and 6): feather, marble, wooden log, ice cube and paperclip with `thingArt`, journal lines and ordering, and property tests replacing the pinned-draws test. [Dive](deep-dives/sink-float.md#build-slices-in-order)

Files expected: `src/games/sink-float/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, the journal source and tests, `docs/GAMES.md`.

Proof: existing-interaction tier plus art: typecheck, the game's rule tests and the journal tests, one filtered regression play of level 4 on a seed with a new thing and of level 6 with a new surprise, one portrait screenshot of the new art in the tank, one build (journal and voice lines are shared). Bot unchanged.

### sink-float 2: Big and small

- **`sink-float`, Level 9 *Big and small* (dive slice 2)** (**built 2026-11-05**, branch `claude/sink-float-big-small`, PR #1261), after batch sink-float 1 (the log and pebble art; converts the plans to a table keyed by level ID and moves the bands to `order`; level ID 8 stays reserved for Garden Raft; new level): three pairs of one material at two sizes; the big one is tested, then she guesses the small one, then tests it; guesses are never misses. [Dive](deep-dives/sink-float.md#build-slices-in-order)

Files expected: `src/games/sink-float/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, and the lands and registry tests only if their expectations change.

Proof: new-level tier with `order`: typecheck, unit tests including order, lands and the keyed-plan clamp, one play of level 9 at school with a surprise guess, `fingerdemo` at 9, one portrait screenshot.

### sink-float 3: Salty or fresh

- **`sink-float`, Level 10 *Salty or fresh* (dive slice 3)** (**built 2026-11-05**, branch `claude/sink-float-salty-or-fresh`, PR #1285), after batch sink-float 2 (built; new interaction, school only, order `[5, 6, 9, 7, 10]`): a new salt mode with two tanks; part 1 unscored, part 2 four scored questions. [Definition](definitions/salty-or-fresh.md), [dive](deep-dives/sink-float.md#build-slices-in-order)

Files expected: `src/games/sink-float/logic.ts`, `logic.test.ts`, `index.ts`, `art.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, and the registry and lands tests only if their expectations change.

Proof: new-interaction tier: typecheck, unit tests including the registry, lands, how-to and voice tests, one play of school level 10 through part 1, two wrong tanks on one egg question, the duck question, to the sticker, one portrait and one landscape screenshot, `fingerdemo` at 10, one direct `control()` call for the two-tank ring, one build; no `couchgames`.

### sudoku-garden 1: A 4 by 4 bed to start

- **`sudoku-garden`, level 7 A 4 by 4 bed to start (dive slice 1)** (built 2026-11-03; new level on the existing interaction; grown-up): `Size` 4, per-size box width, the plan, `order` `[7, 1, 2, 3, 4, 5, 6]` and `entryLevels: [7]`. [Dive](deep-dives/sudoku-garden.md#build-slices-in-order)

Files expected: `src/games/sudoku-garden/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new level on the existing interaction: typecheck, the game's rule tests, one play of level 7 with one wrong number and one hint, to the sticker; one portrait screenshot of the 4 by 4 bed; `fingerdemo` at 7.

### sudoku-garden 2: Fill marks on big beds

- **`sudoku-garden`, Fill marks on big beds (dive slice 2)** (built 2026-11-05; new interaction; grown-up): the button, its layout on 9 by 9 beds and its sweep. [Dive](deep-dives/sudoku-garden.md#build-slices-in-order)

Files expected: `src/games/sudoku-garden/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, unit tests (marks equal candidates; button only on 9 by 9 plans), one scripted play of level 4 with Fill marks then a placement that clears its peers' marks; one portrait and one landscape screenshot of the tray; bot unchanged, no `fingerdemo`.

### sudoku-garden 3: A crossing pair of rows

- **`sudoku-garden`, level 8 A crossing pair of rows (dive slice 3)** (built 2026-11-05; new rule on the existing tap; grown-up): shares the `order` with the built level 7 (batch 1); tier 4, the `xwing` step, generator or authored list, the hint and its lines. [Dive](deep-dives/sudoku-garden.md#build-slices-in-order)

Files expected: `src/games/sudoku-garden/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new rule on the existing tap: typecheck, rule tests, one play of level 8 asking for hints until the X-Wing one (rings and line), then to the sticker; one portrait screenshot of the hint; `fingerdemo` at 8.

### sudoku-garden 4: Patchwork beds

- **`sudoku-garden`, level 9 Patchwork beds (dive slice 4)** (built 2026-11-05; new bed drawing; grown-up): shares the `order` and the per-size geometry with the built level 7 (batch 1); patch layouts in `geometry`, the borders and tints, the patch hint wording. [Dive](deep-dives/sudoku-garden.md#build-slices-in-order)

Files expected: `src/games/sudoku-garden/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`. The shared geometry changes, so the couch suite follows.

Proof: new-interaction tier: typecheck, unit tests including order, one play of level 9 with one wrong number and one hint naming a patch; one portrait screenshot; `fingerdemo` at 9; `BROWSER_SUITE=couchgames` filtered to Sudoku Garden.

### sudoku-garden 5: Cage beds

- **`sudoku-garden`, level 10 A 6 by 6 bed with sums in the cages (dive slice 5)** (built 2026-11-05; new interaction; grown-up): cages on `Puzzle`, cage-aware `search`, `cage-last` and `cage-sets`, `makeCageBed` (or its authored fallback), the dashed outlines, sum labels and moved marks, two hint lines, the instruction and the wrong-sum line; 9 by 9 cages are left out. [Dive](deep-dives/sudoku-garden.md#build-slices-in-order), [definition](deep-dives/sudoku-garden.md#cage-beds-level-10-definition-2026-11-03)

Files expected: `src/games/sudoku-garden/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new interaction: typecheck, rule tests, one play of level 10 with one wrong number and one cage hint, to the sticker; one landscape and one portrait screenshot; `fingerdemo` at 10; one build for the voice lines.

### treasure-map 1: Fresh maps and true hints

- **`treasure-map`, Fresh maps and true hints (dive slice 1)** (built 2026-11-03; existing-game fix): seeded level 1 headers from a pool of seven pictures and shuffled colours via `headersFor(plan, rng)`, seeded map dressing, level 5's own `map.cluehint`, level 4's hint lighting the first leg, and the how-to level-3 step as a tap.** [Dive](deep-dives/treasure-map.md#build-slices-in-order)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: existing-game fix tier: typecheck, rule tests, one filtered regression play of levels 1 and 4 with two wrong digs each; one portrait screenshot of level 1; one build for the voice lines; bot unchanged, no `fingerdemo`.

### treasure-map 2: Write the card

- **`treasure-map`, Level 6 *Write the card* (dive slice 2, after batch 1)** (built 2026-11-04; new interaction; school): a two-slot card of number and arrow tiles beside the map, footprints as she sets it, Go walks it and a miss names the leg that was off; shares the footprints and the step hint with batch 1. Not on the couch.** [Dive](deep-dives/treasure-map.md#build-slices-in-order)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests; one scripted play with one card whose up leg is one too many, a second wrong card for the glow, then the right card; one portrait screenshot of the card tiles; `fingerdemo` at 6.

### treasure-map 3: How far?

- **`treasure-map`, Level 7 *How far?* (dive slice 3, after batch 1)** (built 2026-11-05; new rule on the same tap; school): footprint stacks and a spoken distance after each dig on a 4 by 4 map; the still-fits set; ruled-out digs are misses with a reason. Shares the footprints with batch 1. Not on the couch.** [Dive](deep-dives/treasure-map.md#build-slices-in-order)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-rule tier: typecheck, rule tests including the five-dig bound for fitting digs over every hiding square; one play of level 7 with two fitting digs, a ruled-out dig, then to the sticker; `fingerdemo` at 7; one portrait screenshot of the footprints.

### treasure-map 4: Slide it

- **`treasure-map`, Level 8 *Slide it* (dive slice 4, after batch 1)** (built 2026-11-05; new interaction; school): a three-square raft slides by a vector, she taps where the flag lands, then picks the slid outline among three cards. Not on the couch.** [Dive](deep-dives/treasure-map.md#build-slices-in-order)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`.

Proof: new-interaction tier: typecheck, rule tests; one play with one wrong square and one wrong outline (named reason), then right; one portrait screenshot of the outline cards; `fingerdemo` at 8.

### treasure-map 5: One line

- **`treasure-map`, Level 9 *One line*, the preschool opening (dive slice 5, after batches 1–4)** (built 2026-11-05; new band; preschool): a 3 by 3 map where any square in the named row or column is right; `order` 9, 1, 2, …, 8 and `entryLevels: [9]`, Treasure Map on the preschool Rainbow Meadow page. Shares the headers with batch 1 and follows ID 8 (IDs stay contiguous).** [Dive](deep-dives/treasure-map.md#build-slices-in-order)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, the README row, and the lands and registry tests.

Proof: new-band tier: typecheck, unit tests including the lands, registry band and order/entry tests; one play of level 9 at preschool with one wrong line then two right; `fingerdemo` at 9; the preschool Rainbow Meadow page screenshot.

### treasure-map 6: Across the river

- **`treasure-map`, Levels 10–11 *Across the river* and *Mirror twin* (dive slice 7, after batches 1–5)** (built 2026-11-05; new interaction; school): a river and a road as the axes with squares named in words, then the mirror across either; IDs follow 9. [Dive](deep-dives/treasure-map.md#levels-1011-across-the-river-defined-2026-11-05)

Files expected: `src/games/treasure-map/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`, the README row.

Proof: new-interaction tier: typecheck, rule, registry, lands and how-to tests; one school play of level 10 with one wrong-side and one wrong-count dig, then right, to the sticker; one play of level 11 with one same-side tap; screenshots of level 10 at 1024 by 768 and 1024 by 1365; `fingerdemo` at 10 and 11; one build for the voice lines; no `couchgames`.

### word-search 1: Fresh themes and root families

- **`word-search`, Fresh themes and root families (dive slice 1)** (built 2026-11-03; existing-game content; the root line became `wordsearch.root-port` and `wordsearch.root-spect`, SPECTATE and ASPECT replaced EXPECT): six new everyday themes of at least twelve plain words, two root-family themes (*Words that carry*, *Words that look*) drawn only for plans they can fill, the pet's one-line root meaning (`wordsearch.root`), and RAIN removed from `weather`. [Dive](deep-dives/word-search.md#build-slices-in-order)

Files expected: `src/games/word-search/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, `docs/GAMES.md`.

Proof: existing-interaction tier: typecheck, rule tests (no theme word contains another, every eligible theme makes a grid, root themes only for eligible plans, block list, course grids still parse); one filtered regression play of level 1 with a root theme forced by seed; one build for the voice line; bot unchanged, no `fingerdemo`. The root lists need an ordinary content review.

### word-search 2: A small grid to start

- **`word-search`, Level 5 *A small grid to start* (dive slice 2)** (built 2026-11-04; grown-up entry): a 6 by 6 grid, four words of three to six letters, across and down only, at the largest square the view allows (at least 96 units); `order` `[5, 1, 2, 3, 4]` and `entryLevels: [5]`. [Dive](deep-dives/word-search.md#build-slices-in-order)

Files expected: `src/games/word-search/logic.ts`, `logic.test.ts`, `index.ts`, its `howto.ts`, `docs/GAMES.md`, the README row.

Proof: new-level tier: typecheck, rule tests including order and entry; one play of level 5 with one wrong line and one hint; one portrait and one landscape screenshot; `fingerdemo` at 5.

### word-search 3: A message in the leftovers

- **`word-search`, Level 6 *A message in the leftovers* (dive slice 3, after batch 2)** (built 2026-11-05): an 8 by 8 grid of nine words with at most eight stones; the unused letters spell a short themed sentence revealed when the last word is found. Appends ID 6; `order` becomes `[5, 1, 2, 3, 4, 6]`. [Dive](deep-dives/word-search.md#build-slices-in-order)

Files expected: `src/games/word-search/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`. `makeGrid` changes, so the couch suite follows.

Proof: new-rule tier: typecheck, rule tests (leftovers in reading order equal the message, stones at most eight and never in a word, every word once, no blocked word readable, messages pass the block list); one play of level 6 with one wrong line and one hint, then to the message reveal; one portrait screenshot of the revealed message; `fingerdemo` at 6; `BROWSER_SUITE=couchgames` filtered to Word Search.

### word-search 4: Just the theme

- **`word-search`, Level 7 *Just the theme* (dive slice 4, after batch 3)** (built 2026-11-05, [PR #1279](https://github.com/rjdunlap/neo/pull/1279)): a 10 by 10 grid, six hidden words shown only as a theme and blanks with lengths; a non-theme line is free ("Not one of the hidden words"); a two-step hint (first letter, then ring the start). Appends ID 7; `order` becomes `[5, 1, 2, 3, 4, 6, 7]`. [Dive](deep-dives/word-search.md#build-slices-in-order)

Files expected: `src/games/word-search/logic.ts`, `logic.test.ts`, `index.ts`, its `voice.ts`, its `howto.ts`, `docs/GAMES.md`. The couch trip stays on levels 1–3.

Proof: new-interaction tier: typecheck, rule tests (no other theme word readable in the grid, blanks match lengths, hint letter correct, the free-line rule never adds a miss); one play of level 7 with a free non-theme line and two hints on one word, then to the sticker; one portrait screenshot of the blanks; `fingerdemo` at 7.

### word-search 5: School opening

- **`word-search`, School opening, level 8 (dive slice 6, after batch 2)** (built 2026-11-05, [PR #1288](https://github.com/rjdunlap/neo/pull/1288)): a 6 by 6 grid with four picture words across, one a row, picture themes outside `THEMES`, pictures from Pond Typing's `typingPicture`; home stays Lantern Lake. Appends ID 8 for school. [Dive](deep-dives/word-search.md#build-slices-in-order), [definition](definitions/word-search-school-opening.md)

Files expected: `src/games/word-search/index.ts`, `logic.ts`, `words.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), its `voice.ts`, its `howto.ts`, the README row and `docs/GAMES.md`.

Proof: new band entry with a layout change and a new list drawing: typecheck, rule tests and the registry, lands and how-to tests, one scripted school play of level 8 with two wrong lines (the second shows the ring without counting a hint), a tile tap, one Hint, to the sticker; one portrait screenshot; logged 1024×768 and 1024×1365 sizes; `fingerdemo` at school 8; one build; no `couchgames`.

### orchard-rows 2: Fresh orchards and baskets

**Built 2026-11-03 ([PR #1158](https://github.com/rjdunlap/neo/pull/1158)):** dive slice 1; checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--orchard-rows-fresh-orchards-and-baskets-batch-orchard-rows-2).

- **`orchard-rows`, fresh orchards and baskets (dive slice 1)** (existing-game content): level 1 adds 2×2 and 4×2, level 2 adds 4×3 and 5×2 (never a shape with its turn in one round, no square), level 3 adds 4×4 and 5×3, all within 5×5 so the 100-unit row bands are unchanged; level 4's second basket also draws 14 and 21 (two right row counts each). [Dive](deep-dives/orchard-rows.md#fresh-content-inside-existing-levels)

Files expected: `src/games/orchard-rows/logic.ts`, `logic.test.ts`, `docs/GAMES.md`.

Proof: game rules tier: `npm run typecheck` and the Orchard Rows rule tests (every pool shape at most 5×5, level 2 pairs never turns or squares, every level 4 basket has two right row counts and a leftover opening, cells at least `MIN_CELL` for every reachable deal at the four views). No browser play; the bot reads the same rules.

### orchard-rows 3: A path through the orchard

**Built 2026-11-03 ([PR #1183](https://github.com/rjdunlap/neo/pull/1183)):** levels 7, 8 and 9 together; checks in [VERIFICATION](archive/VERIFICATION-2026-11-03.md#2026-11-03--orchard-rows-levels-79-a-path-through-the-orchard-batch-orchard-rows-3).

- **`orchard-rows`, levels 7–9 (dive slice 3, the build of the path definition)** (extends the built game, new-interaction tier; school 7–9, Barnyard unchanged, Counting Cove as the game already sits): a path splits a grown orchard into two parts she counts, then the whole; 7 *A path at five* (the path after row 5), 8 *Choose the path* (she slides the path with arrows and lays it, any split is right), 9 *A path at ten* (the path down the orchard after ten trees in a row). A new scene `PathOrchard`; the built 4–6 code stays unchanged. [Definition](definitions/orchard-rows-path.md), [dive](deep-dives/orchard-rows.md#build-slices-in-order)

Files expected: `src/games/orchard-rows/logic.ts`, `logic.test.ts`, `path.ts` (new), `baskets.ts` (exported arrow and card helpers), `index.ts`, its `howto.ts`, its `voice.ts`, a `scripts/browser-check.mjs` case, `README.md` row, `docs/GAMES.md`.

Proof: new-interaction tier, as the [definition's check tier](definitions/orchard-rows-path.md#check-tier-for-the-build) sets it (typecheck, the rule tests with registry, lands, how-to and off-screen tests, a filtered scripted play: level 7 with one wrong part pad, a second for the glow and its hint, then the glowing pad and a sign tap; level 8 with an arrow at the range end and the path laid at 2; level 9 to its sticker; one portrait screenshot of level 9 with both signs; `fingerdemo` at 7, 8 and 9; one build). Stop point: levels 7 and 9 share the fixed path and pads and level 8's moving path is the separable part; if the allowance cannot cover all three, finish 7 and 9 (level 8 skipped through `order`) with a draft-PR checkpoint, and level 8 is then its own run.

### sorting-machine 1: Both badges

Built 2026-11-10, [PR #1491](https://github.com/rjdunlap/neo/pull/1491). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sorting-machine`, level 3 *Both badges*** (**built 2026-11-10, [PR #1491](https://github.com/rjdunlap/neo/pull/1491)**; H3, [definition](definitions/sorting-machine.md#the-model-logicts); extends the built game, new-interaction tier; school, range becomes `{ min: 1, max: 3 }`): `P` and `Q` sensors fixed, one gate slot (AND or OR) she chooses, three briefs (one per pair), Send, Check and the persistent per-fixture marks. [Slice H3](deep-dives/subjects/how-computers-work.md#build-slices-in-order)

Files expected: `src/games/sorting-machine/logic.ts`, `logic.test.ts`, `index.ts`, `howto.ts`, `voice.ts`, `docs/games/sorting-machine.md`.

Proof: new-interaction tier as the [definition's check tier](definitions/sorting-machine.md#check-tier) sets it (typecheck, unit tests with registry, lands and how-to tests, one filtered scripted play of level 3 with a failed Check and a Help, one portrait screenshot, `fingerdemo` at 3, build because voice and how-to change).

### sorting-machine 2: Festival Signals

Built 2026-11-11, [PR #1497](https://github.com/rjdunlap/neo/pull/1497). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sorting-machine`, levels 8–9 *Festival Signals* and *Fix the lantern*** (**built 2026-11-11, [PR #1497](https://github.com/rjdunlap/neo/pull/1497)**; H5, [definition](definitions/festival-signals.md); new interaction, batch 1 is built; grown-up range `order: [3, 9, 8]`, school unchanged): a flat four-slot machine with an overview and a selected-slot inspector, a lantern that lights for exactly one of two badges, and at level 9 a repair with a movable lantern wire. [Slice H5](deep-dives/subjects/how-computers-work.md#build-slices-in-order)

Files expected: `src/games/sorting-machine/logic.ts`, `logic.test.ts` (and the checked-in accepted list), `index.ts`, `art.ts`, `voice.ts`, `howto.ts`, `docs/games/sorting-machine.md`.

Proof: new-interaction tier as the [definition's slices and check tier](definitions/festival-signals.md#slices-and-check-tier) sets it (typecheck, unit tests with registry, lands and how-to tests, one filtered scripted play of levels 9 and 8 at the grown-up band with a failed Check and a Help, one upright screenshot at 390 × 844, `fingerdemo` at 8, build). If it grows past one session, level 8 ships first with `order: [3, 8]` and level 9 follows.

### memory-desk 1: Keep and show

- **`memory-desk`, level 1 *Keep one*** (H8, [definition](definitions/memory-desk.md#the-model-logicts); a new game, new-game tier; school, Tinker Lab by default; range `{ min: 1, max: 1 }` until batch 2): a pictured tray, a drawer and a window; she puts a token on the tray, presses Keep to copy it into the drawer, swaps the tray, presses Show and sees the old token in the window, then Done; a try-out round on the ordinary adaptation rule with no Check, one sticker per round. [Slice H8](deep-dives/subjects/how-computers-work.md#build-slices-in-order)

Files expected: `src/games/memory-desk/logic.ts`, `logic.test.ts`, `index.ts`, `art.ts`, `voice.ts`, `howto.ts`, `src/content/lands.ts` and the content barrels (`node scripts/content-barrels.mjs`), a `scripts/browser-check.mjs` case, `docs/games/memory-desk.md`, and the README and `docs/GAMES.md` rows through `npm run game-docs`.

Proof: new-game tier as the [definition's check tier](definitions/memory-desk.md#check-tier-for-the-builds) sets it (typecheck, unit tests with registry, lands, how-to and off-screen tests, one filtered scripted play of level 1 with a dim Done, an empty Keep, the contrast, a requested Help and the sticker, one portrait screenshot, `fingerdemo` at 1, build because the registry, lands and voice change). Before the spoken lines merge, check "keep", "copy" and "toy desk" against the study's cited sources.

### memory-desk 2: The hatch

- **`memory-desk`, levels 2–3 *Open or shut* and *Fix the desk*** (H8, [definition](definitions/memory-desk.md#the-model-logicts); new interaction, after batch 1; range becomes `{ min: 1, max: 3 }`): at level 2 each step of a short queue has a hatch she opens or shuts, Step runs the queue and Check compares the window with the brief, with the first untouched Check a free look; at level 3 a desk with one wrong hatch starts with a stated token in the drawer and she finds and fixes it from two trace rows. [Slice H8](deep-dives/subjects/how-computers-work.md#build-slices-in-order)

Files expected: `src/games/memory-desk/logic.ts`, `logic.test.ts`, `index.ts`, `art.ts`, `voice.ts`, `howto.ts`, `docs/games/memory-desk.md` (Grows into line and notes) and its generated README and GAMES rows through `npm run game-docs`.

Proof: new-interaction tier as the [definition's check tier](definitions/memory-desk.md#check-tier-for-the-builds) sets it (typecheck, the rule tests, one filtered play of level 2 with an untouched Check, a failed Check, a second for the glow and both briefs passed, and level 3 with a Help followed to the sticker; a portrait screenshot of level 3 with both trace rows; `fingerdemo` at 2 and 3; build).

### tile-pairs 1: A fresh pairing and a visible uncovering

- **`tile-pairs`, a different pairing each round and a pair that shows what it uncovers** (dive slice 1, [dive](deep-dives/tile-pairs.md#build-slices-in-order); existing-game tier; grown-up, levels 1–6 unchanged): make the route in `makeBoard` seeded so the same layout clears by a different pairing each round, with property tests replacing the frozen hash for levels 1–3 (same position sets, 100 seeds clear); a removed pair lifts and fades, the tiles it uncovers pulse, and the tally shows "pairs open".

Files expected: `src/games/tile-pairs/logic.ts`, `logic.test.ts`, `index.ts`, `docs/games/tile-pairs.md` (Grows into line and notes) and the dive's "What was built" section.

Proof: existing-game tier (typecheck, the rule tests, one filtered `tilepairs` play at level 3 with a portrait screenshot; no `fingerdemo`, since the bot's actions do not change; build only if a shared file changes).

### tile-pairs 2: Peek under the stack

- **`tile-pairs`, Peek** (dive slice 2, [dive](deep-dives/tile-pairs.md#build-slices-in-order); new interaction, after batch 1; dive slice 3 *Two more looks*, two seeded picture sets with the distinctness test, may ride with it if the session is small): a fourth button that fades every covering tile to a quarter strength so the pictures below show; tapping Peek or any tile returns to the solid view. It is information, not a hint: never counted and no effect on the face-off score. Gets a key, a couch control read from `COUCH_INFO` (a pause-menu entry beside Hint if no button is free), a how-to step and a voice line.

Files expected: `src/games/tile-pairs/logic.ts`, `logic.test.ts`, `index.ts`, `voice.ts`, `howto.ts`, `src/couch/catalog.ts`, `docs/games/tile-pairs.md` and the dive's "What was built" section.

Proof: new-interaction tier (typecheck, unit tests, one filtered `tilepairs` play at level 5 that peeks, pairs, takes one wrong answer and one hint, a portrait screenshot of the see-through view, `fingerdemo` only if the card's demonstrated action changes, `couchgames` filtered to Tile Pairs if a pad button is mapped, build; one screenshot per new look if slice 3 rides along).
