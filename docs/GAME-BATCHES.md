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

### shape-sorter 1: Sorting entry, shape pool and three sizes

- **`shape-sorter`, level 10 *Round or square*, slice 3** (new levels on an existing interaction): two plain holes by outline alone; toddler `order [9, 1, 2, 10, 3, 4, 5]`. [Dive](deep-dives/shape-sorter.md#easier-entries-and-levels-between-existing-ones)
- **`shape-sorter`, more shapes, sizes and colours, slice 4** (logic tier plus build): oval, rectangle, diamond, pentagon and trapezoid with lines, pool draws at 6–8, sizes at 6–7, a rainbow one colour, the box's property facts. [Dive](deep-dives/shape-sorter.md#fresh-content-inside-existing-levels)
- **`shape-sorter`, level 11 *Big, middle, little*, slice 5** (new levels, plus a portrait screenshot): one shape in three sizes; preschool `order [3, 4, 5, 6, 7, 11]`, pre-K `order [5, 6, 7, 11, 8]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### shape-sorter 2: Turn it to fit

- **`shape-sorter`, level 12 *Turn it to fit*, slice 6** (new interaction): tap a piece to turn it a notch, then carry it to an upright hole; pre-K `order [5, 6, 7, 11, 8, 12]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### shape-sorter 3: Corners, curves and corner counts

- **`shape-sorter`, level 13 *Corners or curves*, slice 7** (new levels; after slice 4): two mouths, curves or corners; pre-K `order […, 12, 13]`. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)
- **`shape-sorter`, level 14 *Count the corners*, slice 8** (new levels; after slice 4): holes labelled 0, 3, 4, 5, 6 with dots; pre-K top by default. [Dive](deep-dives/shape-sorter.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 1: Tool signs, helpers and numbers past ten

- **`mail-carrier`, level 10 *Which door?*, slice 3** (new levels on the existing tap: typecheck, rule tests, one play of 10 with one wrong tap and one hint, a portrait screenshot of the signs, `fingerdemo` at 10): six tool `Graphics`, `letterShows` gains `'tool'`; toddler `order [1, 2, 10]`, preschool `order [2, 10, 3, 4]`, `entryLevels: [10]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 9 *Who can help?*, slice 4** (new levels tier, after slice 3: typecheck, rule tests, one play of 9, a portrait screenshot, `fingerdemo` at 9): the problem pictures, helper hats, the six journal entries; pre-K `order [3, 4, 5, 9, 6]`, school `order [4, 5, 9, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 12 *Numbers past ten*, slice 5** (new levels tier): two-digit numerals 10–20 with the ten-and-ones spoken; pre-K `order [3, 4, 5, 9, 12, 6]`, school `order [4, 5, 9, 12, 6, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 2: Spoken map clues and both street sides

- **`mail-carrier`, level 13 *Hazel's clue*, slice 6** (new levels on the map interaction: typecheck, rule tests over 300 seeds for clue uniqueness on both map orientations, one play of 13, `fingerdemo` at 13): Hazel says a spoken clue and the carrier finds the one house it names; school `order [4, 5, 9, 12, 6, 13, 7, 8]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)
- **`mail-carrier`, level 11 *Both sides of the street*, slice 7** (new interaction tier: typecheck, rule tests, one play of 11, a portrait screenshot that decides decision 7, `fingerdemo` at 11): odd numbers on one side and even on the other, house found from the parity then the order; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 3: Compare delivery routes

- **`mail-carrier`, level 14 *Three letters, your way*, slice 8** (new levels on the route interaction, plus the free second walk: typecheck, rule tests, one play of 14 taking the second plan, `fingerdemo` at 14): plan three stops in any order, then optionally compare a second order's stone count; school `order [4, 5, 9, 12, 6, 13, 7, 8, 11, 14]`. [Dive](deep-dives/mail-carrier.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### mail-carrier 4: Make the key

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

### weather-wardrobe 2: Forecast trip, reverse matching and wind

- **`weather-wardrobe`, the trip happens** (level 6 payoff): the pet unpacks and wears each weather's things in forecast order. [Slice 5](deep-dives/weather-wardrobe.md#build-slices-in-order)
- **`weather-wardrobe`, level 9 Which sky?** (new level, after *a miss that shows why*): the outfit is the clue, tap the weather it suits; toddler and preschool, placed after 3 and 4. [Slice 6](deep-dives/weather-wardrobe.md#build-slices-in-order)
- **`weather-wardrobe`, wind** (content, after *more items* and *a miss that shows why*): a fourth weather with a kite and a windbreaker; a sun hat blows off; level-1 finish and trip pairs adjusted. [Slice 7](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### weather-wardrobe 3: Two friends, two places

- **`weather-wardrobe`, level 10 Two friends, two places** (new drag interaction): drag each item to the friend whose weather it suits; pre-K. [Slice 8](deep-dives/weather-wardrobe.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 1: Numbered buds, shot trail and board variety

Built 2026-10-22, [PR #770](https://github.com/rjdunlap/neo/pull/770); [closeout](archive/COMPLETED-2026-10-09.md#peg-garden-numbered-buds-shot-trail-shell-tray-and-board-themes-slices-2-3-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`peg-garden`, numbered buds wait their turn and the last shot stays faint** (existing-game change, levels 4–5): only the asked numeral blooms; the previous path stays as faint dots. [Slice 2](deep-dives/peg-garden.md#build-slices-in-order)
- **`peg-garden`, shell tray and board themes** (content): pearls collect in a tray and pour back; four simulated board shapes, three backdrops. [Slice 3](deep-dives/peg-garden.md#fresh-content-inside-existing-levels)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 2: Big buds

- **`peg-garden`, level 8 Big buds** (new lap entry): four huge buds, every touch blooms one; lap order 8, 1, toddler 8, 1, 2, `entryLevels: [8]`; plans keyed by ID. [Slice 4](deep-dives/peg-garden.md#younger-band-openings)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### peg-garden 3: Cup aiming and planting a bud

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

- **`little-helpers`, level 6 teams she builds** (existing-game change): tap which fruit gets the helper, nearest-helper taps; uneven teams strain. [Slice 4](deep-dives/little-helpers.md#fresh-content-inside-existing-levels)
- **`little-helpers`, level 7 Everyone helps** (new interaction): split a crowd of 4–7 between two fruits; pre-K top and school. [Slice 6](deep-dives/little-helpers.md#new-levels-on-top)
- **`little-helpers`, level 8 Strong helpers** (new interaction): big helpers count two, every exact mix right; school. [Slice 7](deep-dives/little-helpers.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### monster-munch 1: Food variety and younger sharing entries

- **`monster-munch`, foods, monsters and places** (content): five foods (two kinds at 6), monster variants, three backdrops, the sticker pool. [Slice 2](deep-dives/monster-munch.md#fresh-content-inside-existing-levels)
- **`monster-munch`, level 9 Big bites** (new lap entry): three big cookies, the monster itself feeds, the belly grows; `BandLevels`, lap order 9, 1, 2, `entryLevels: [9, 10]`. [Slice 3](deep-dives/monster-munch.md#younger-band-openings)
- **`monster-munch`, level 10 One of each** (new level, after *Big bites*): a cookie and an apple for each monster; toddler order 2, 3, 10, 4. [Slice 4](deep-dives/monster-munch.md#easier-entries-and-levels-between-existing-ones)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### monster-munch 2: Sharing two kinds and choosing group counts

- **`monster-munch`, level 12 Share two kinds** (new level, after *Big bites*): deal cookies and apples fairly, then how many of each; school order 6, 7, 12, 8. [Slice 5](deep-dives/monster-munch.md#new-levels-on-top)
- **`monster-munch`, level 11 How many friends?** (new interaction, after *Big bites*): call friends from a cave, two each, ring when no one else can have two, then how many friends and how many left; school top. [Slice 6](deep-dives/monster-munch.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### rhythm-neighbors 1: Younger turn-taking and its journal page

- **`rhythm-neighbors`, level 7 Knock, knock** (new lap entry: order and entry tests, one play, `fingerdemo` at 7, one portrait screenshot): a big tree, every knock answered by a frog a beat later, eight knocks finish; lap order `[7, 1, 2]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, level 8 My turn, your turn** (new level on the tap interaction: rule tests, one play, `fingerdemo` at 8): the bird knocks, one big frog glows and waits, one tap answers; toddler order `[2, 8, 3]`; no misses. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)
- **`rhythm-neighbors`, journal page** (small; after slice 1): "The frogs answered the woodpecker", filed from a finished turn-taking round. [Dive](deep-dives/rhythm-neighbors.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### rhythm-neighbors 2: Knock a call

- **`rhythm-neighbors`, level 9 Knock a call** (new interaction tier; after level 8): she knocks the tree two to five times and the frogs answer with the gaps reversed; toddler `[2, 8, 9, 3]`, preschool `[9, 3, 4]`, `entryLevels [7, 9]`. [Dive](deep-dives/rhythm-neighbors.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 1: Truthful support and varied weighing props

- **`seesaw-balance`, support truth, slice 1** (existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 6, `fingerdemo` at 1): a tap on a loose friend hops it to the empty tray at 1–2, the glow after two overs rings the next block on the grass when the tray is under, the how-to's levels 1–2 line says tap or drag, new voice variants; IDs and windows unchanged. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, two faces per weight, wrappings and boxes, slice 2** (logic tier, plus one filtered play of 2 and 4): a friend pool per weight with a distinct-faces test, seeded present wrappings, parcel and crate boxes at 6–7. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 2: Lap bounce and heavier-or-lighter choices

- **`seesaw-balance`, level 12 *Wheee!* with the lap band, slice 3** (new interaction tier: typecheck, units, one scripted play at lap and toddler, one portrait screenshot, `fingerdemo` at 12): the `bounce` mode, any touch on the empty tray sends a duck up; `bands` gains `lap`, lap `order [12]`, toddler `order [12, 1, 2]`, `entryLevels: [12]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 13 *Who is heavier?*, slice 4** (new interaction tier, taps on friends: typecheck, rule tests, one play of 13 with one wrong tap and one hint, `fingerdemo` at 13): tap the heavier or lighter of two tipped friends; preschool `order [2, 13, 3, 4]`, `entryLevels: [12, 13]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 3: Order weights, estimate and find the difference

- **`seesaw-balance`, level 14 *Line them up*, slice 5** (new levels on an existing interaction: typecheck, rule tests, one play of 14, `fingerdemo` at 14): three look-alike presents tested in pairs then dragged to light, middle and heavy spots; pre-K `order [3, 4, 14, 5, 6, 7]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 15 *Guess the pumpkin*, slice 6** (new levels tier, plus a portrait screenshot for the guess sign): an unscored guess, then blocks until level, then the real number; pre-K `order [3, 4, 14, 5, 6, 7, 15]`, school `order [6, 7, 15, 8, 9, 10, 11]` (without 11 until it lands). [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)
- **`seesaw-balance`, level 16 *How much heavier?*, slice 7** (new levels tier): add blocks to the light side until level, then say the difference; school `order [6, 7, 15, 16, 8, 9, 10, 11]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### seesaw-balance 4: Which way will it tip

- **`seesaw-balance`, level 17 *Which way will it tip?*, slice 8** (new interaction tier: typecheck, rule tests over 300 seeds, one play of 17 with a wrong prediction, one portrait screenshot, `fingerdemo` at 17): an unscored prediction of which side goes down or level, explained by the release; school `order [6, 7, 15, 16, 17, 8, 9, 10, 11]`. [Dive](deep-dives/seesaw-balance.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### fluffy-salon 1: Customer variety and younger styling entries

- **`fluffy-salon`, customers, rooms and start looks, slice 2** (logic tier): seeded friends in the chair with `{who}` lines, seeded wall and cape colors, five free-play start looks. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 6 *Pat the fluff*, slice 3** (new interaction): no buttons, any touch grows the fur, the floof shake and a big mirror, the round finishes by itself; lap `order [6, 1, 2]`, toddler `order [6, 1, 2]`, `entryLevels: [6]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 7 *Snip snip*, slice 4** (new levels on an existing interaction): two big buttons, grow and snip; lap and toddler `order [6, 1, 7, 2]`, `entryLevels: [6, 7]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 8 *Pink, please*, slice 5** (new levels on an existing interaction): five bottles and color-only requests, a wrong color named without a miss; toddler `order [6, 1, 7, 2, 8]`, preschool `order [2, 8, 3, 4]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### fluffy-salon 2: Two customers and comparative styling

- **`fluffy-salon`, level 9 *Two customers*, slice 6** (new interaction, plus a portrait screenshot): two friends in two chairs with a two-part card each, either order finishes; preschool `order [2, 8, 3, 4, 9]`, pre-K `order [3, 4, 5, 9]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 10 *Longer than Pip's*, slice 7** (new interaction): make the pet's fur longer or shorter than a friend's, with a comparison line drawn in the mirror; pre-K `order [3, 4, 5, 9, 10]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### fluffy-salon 3: Two colours and changed requests

- **`fluffy-salon`, level 11 *Two colors*, slice 8** (new levels): "pink and blue, please", at least 35 % of strands in each; pre-K `order [3, 4, 5, 9, 10, 11]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)
- **`fluffy-salon`, level 12 *Changed my mind*, slice 9** (new levels): a loved style is asked to be the opposite, so snip undoes grow and comb undoes curl; pre-K `order [3, 4, 5, 9, 10, 11, 12]`. [Dive](deep-dives/fluffy-salon.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 1: Parade variety and younger size entries

- **`size-parade`, the parade happens, eight friends and a seeded ground, slice 2** (fresh content): the strut after a pick, the march with the size scale after a line, five new friends, flag and bunting by seed, the round's friend on the sticker, varied dealt sizes at levels 1–4. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, levels 16 *Big duck, little duck* and 9 *Big one, little one* with the lap band, slice 3** (new interaction, plus a portrait screenshot): the size cycle under her finger, then big or little of two; `bands` gains `lap`, lap `order [16, 9]`, toddler `order [9, 1, 2, 3, 4]`, `entryLevels: [9, 16]`, the per-band accounting of decision 1. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 17 *Two in a line*, slice 4** (new levels on an existing interaction): the two-friend line plan, the first drag a toddler meets; toddler `order [9, 1, 2, 3, 4, 17]`, preschool `order [3, 4, 17, 5, 6]`, `entryLevels: [9, 16, 17]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 10 *Big, middle, little*, slice 5** (new levels on an existing interaction): the middle of three with a ringed-middle cue, at least two of four questions asking for it; preschool `order [3, 4, 17, 10, 5, 6]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 2: Who fits

- **`size-parade`, level 11 *Who fits?*, slice 6** (new interaction, plus a portrait screenshot): a bed, chair, bowl and door each fitting exactly one of three friends, too big and too little tried on screen; preschool `order [3, 4, 17, 10, 5, 6, 11]`, pre-K `order [5, 6, 11, 7, 8]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 3: Insert a friend and order shades

- **`size-parade`, level 12 *Where does this one go?*, slice 7** (new interaction, plus a portrait screenshot): a fifth friend dropped into the nearest gap of an ordered line that opens under the finger; pre-K `order [5, 6, 11, 7, 8, 12]`, school `order [7, 8, 12]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)
- **`size-parade`, level 15 *Darkest first*, slice 8** (new levels on an existing interaction, plus a device contrast check): five shades of one friend lined up darkest or lightest first; pre-K `order [5, 6, 11, 7, 8, 12, 15]`, school `order [7, 8, 12, 15]`; Shade Lineup leaves the notebook. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 4: Hidden heights

- **`size-parade`, level 13 *Hidden heights*, slice 9** (new interaction, plus a portrait screenshot): boots behind a fence, a tapped pair swaps only when out of order, a gate that opens on a sorted line, a bot that sorts by pair tests; school `order [7, 8, 12, 13, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### size-parade 5: The measuring ribbon

- **`size-parade`, level 14 *The measuring ribbon*, slice 10** (new interaction, plus a portrait screenshot): two friends on different footing compared with a ribbon that snaps to a head, a tap before measuring is a prediction and never a miss; school `order [7, 8, 12, 13, 14, 15]`. [Dive](deep-dives/size-parade.md#build-slices-in-order)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 1: Meal variety and lap tap-sharing

- **`pet-kitchen`, friends, the meal eaten, round wholes, the fraction seen and a third fruit, slice 2** (fresh content tier: typecheck, rule tests for the pie's cuts and the fruit pool, one filtered play of 2 and 7, `fingerdemo` at 7): `CRITTERS` dealt from the seed, a seeded pie or sandwich each round, the chew, the fraction bubble at 7, the banana. [Slice 2](deep-dives/pet-kitchen.md#build-slices-in-order)
- **`pet-kitchen`, level 10 *One for you, one for me* and the lap band, slice 3** (new interaction tier: typecheck, rule tests, the picnic unit test, one play of 10 with a tap off a piece, a portrait screenshot, `fingerdemo` at 10, the `picnic` suite's sandwiches step once): tap dealing; `bands` gains `lap` with `{ min: 10, max: 10 }`, toddler `order [10, 1]`, `entryLevels: [10]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 2: Fair shares, thirds and equivalent shapes

- **`pet-kitchen`, level 11 *Same or not the same?*, slice 4** (new levels on the cut-and-drag, plus the overlay: typecheck, rule tests, one play of 11 serving the lopsided pieces once, `fingerdemo` at 11): piece areas, the lopsided icon and drawing; preschool `order [1, 11, 2, 3, 4]`, pre-K `order [11, 3, 4, 5, 6]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 12 *Two pizzas, three friends*, slice 5** (new levels tier: typecheck, rule tests, one play of 12 with a halves serve, `fingerdemo` at 12): thirds of two wholes; school `order [5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)
- **`pet-kitchen`, level 14 *Different shape, same share*, slice 6** (new interaction tier, a cut per whole: typecheck, rule tests, one play of 14, a portrait screenshot of the overlay, `fingerdemo` at 14): two shapes of one share; pre-K `order [11, 3, 4, 14, 5, 6]`, school `order [14, 5, 6, 7, 8, 9, 12]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 3: Compare shares

- **`pet-kitchen`, level 13 *Who has more?*, slice 7** (new interaction tier, the question after the serve: typecheck, rule tests over the fraction pairs, one play of 13 with one wrong "more", `fingerdemo` at 13): compare two shares; school `order [14, 5, 6, 7, 8, 9, 12, 13]`, and the three journal entries land here. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

Proof: use the union of the included check tiers under the batch contract; preserve each distinct interaction and special story/device gate.

### pet-kitchen 4: Equivalent cup measures

- **`pet-kitchen`, level 15 *One cup, many ways*, slice 8** (new interaction tier per the cooking packet: typecheck, rule tests over every half-and-quarter combination, one play of 15 with an oversupply undo, a portrait screenshot, `fingerdemo` at 15): the packet's equivalent-measures round; school `order [14, 5, 6, 7, 8, 9, 12, 13, 15]`. [Dive](deep-dives/pet-kitchen.md#new-levels-on-top)

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

- **`critter-sort`, levels 12 *Like the big plant* and 13 *Same and different*** (new levels on the existing drag interaction; pre-K and school): drag little plants grown from one big plant's seeds into hoops for the big plant's leaf shape and petal marks, first one hoop (level 12), then overlapping hoops (level 13); the family is stated, never deduced, and no mechanism is taught. [Definition](definitions/same-kind-different-sprouts.md), [genetics study slice G4](deep-dives/subjects/genetics.md#build-slices-in-order)

Proof: new-level tier on an existing interaction, as the [definition's Build and check tier](definitions/same-kind-different-sprouts.md#build-and-check-tier) sets it.

### attic-finds 1: Lid and Lever

- **`attic-finds`, levels 3 *Up and down* (lap, toddler) and 4 *Peek inside* (toddler)** (a new giant-handle interaction inside the existing game; `entryLevels: [3, 4]`; 0 misses and 0 hints, nothing kept): each touch turns a giant handle half a turn so the bird (or fish) rises, then sinks; level 4 adds a peek door that shows the rod the handle pushes; a Finish picture appears after three turns and only her tap ends the round. [Definition](definitions/lid-and-lever.md), [everyday-life study slice H3](deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order)

Proof: new-interaction tier, as the [definition's Build and check tier](definitions/lid-and-lever.md#build-and-check-tier) sets it (typecheck, unit tests, an `atticlever` scripted play at levels 3–4, `fingerdemo` at both, one portrait screenshot of level 4 with the door open, one build).

### second-chance-shed 1: Levels 1–4

- **`second-chance-shed`, levels 1–4 (N2)** (a new game, one subtask; toddler 1–2, preschool 2–3, pre-K 3–4, Cozy Village by default): used things arrive one at a time on a cart and she drags each to the worm bin, reuse shelf, mending table or Remake machine, one place added per level; each place visibly makes something, and level 1 counts no misses. [Definition](definitions/second-chance-shed.md), [nature-sustainability study slice N1](deep-dives/subjects/nature-sustainability.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/second-chance-shed.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 4, `fingerdemo` at both, one portrait screenshot of level 4, one build). Review gate: merges only after the developer's item-table review ([decision 1](definitions/second-chance-shed.md#open-decisions)); the build itself may proceed.

### sand-table 1: Levels 1–3

- **`sand-table`, levels 1–3 (E2)** (a new game, one subtask; lap 1, toddler 1–2, preschool 2–3, pre-K 3, Bubble Beach by default): tap a sand tray to pour a shower of grains that settle into a heap, tap a scoop paddle to lift some back into the bucket, one bay added per level; any landscape is a finished one, and every round counts 0 misses and 0 hints. [Definition](definitions/sand-table.md), [earth-materials study slice E1](deep-dives/subjects/earth-materials.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/sand-table.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 3, one build). No review gate: the three rungs make no geology claim; the [open decisions](definitions/sand-table.md#open-decisions) all have defaults.

### adventure-walk 1: Levels 1–3

- **`adventure-walk`, levels 1–3 (AW2)** (a new game, one subtask; toddler 1, preschool 1–2, pre-K 2–3, school 3, Rainbow Meadow by default): the companion walks to a friend's picnic past three landmarks; she taps one of two glowing ways past each (over, under, through, across, around), then follows the friend's call, then two calls at once with replay. [Definition](definitions/adventure-walk.md), [movement study follow-up](deep-dives/subjects/movement-exercise.md#recommended-follow-ups-requested-2026-10-14)

Proof: new-game tier, as the [definition's check tier](definitions/adventure-walk.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 2, one build). No review gate: screen-only, the companion does the walking; any movement invitation stays on decision 4. The [open decisions](definitions/adventure-walk.md#open-decisions) all have defaults.

### sea-lift 1: Levels 1–3

Built 2026-10-22, branch `claude/sea-lift-1-3`; [closeout](archive/COMPLETED-2026-10-09.md#sea-lift-levels-13-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`sea-lift`, levels 1–3 (IN1)** (a new game; school 1–3, Bubble Beach by default): send a glass lift to friends' stops above and below the water line (zero): up or down from the water (1), rides through the water (2), deepest or highest first (3). [Definition](definitions/sea-lift.md), [integers study](deep-dives/subjects/integers.md)

Proof: new-game tier, as the [definition's check tier](definitions/sea-lift.md#check-tier) sets it (typecheck, unit tests, a new `browser-check.mjs` case at levels 1 and 3, `fingerdemo` at levels 1 and 3, one portrait screenshot of level 2, one build). No review gate: levels 1–3 use only "above/below the water"; the educator gate applies from level 4. The [open decisions](definitions/sea-lift.md#open-decisions) all have defaults.

### recipe-workshop 1: Levels 1–3

Built 2026-10-22, branch `claude/recipe-workshop-1-3`; [closeout](archive/COMPLETED-2026-10-09.md#recipe-workshop-levels-13-2026-10-22). Scope retained for dependency references; this batch is no longer eligible for dispatch.

- **`recipe-workshop`, levels 1–3 (C2–C4)** (a new game, one declared batch of three named parts; toddler 1, preschool 1–2, pre-K 2–3, Cozy Village by default): tap pots of pretend fruit mash and a white base into a bowl, mix with the spoon into one blend, add a star or leaf topper and Serve. **C2** level 1, My bowl (free); **C3** level 2, Follow the picture (one of each in either order, then mix); **C4** level 3, Bowls for two (two bowls, each with its own topper). [Definition](definitions/recipe-workshop.md), [cooking study slices C2–C4](deep-dives/subjects/cooking-recipes.md#build-slices-in-order)

Proof: as the [definition's check tier](definitions/recipe-workshop.md#check-tier) sets it: new-game tier for C2, new-interaction tier for C3, new levels plus the bowl-selection control for C4; one `browser-check.mjs` case growing across the three, `fingerdemo` at levels 1–3, one build. If the allowance cannot cover all three, stop after a complete C2 or C3 with a draft-PR checkpoint. No review gate: screen-only pretend food; the [open decisions](definitions/recipe-workshop.md#open-decisions) all have defaults.

### meadow-pens 1: Levels 1–3

- **`meadow-pens`, levels 1–3 (slice 1)** (a new game, one declared batch; school 1–3, Rainbow Meadow by default): paint squares of grass for a friend's pen while the fence builds itself from a visible stack. Level 1, Enough grass (any connected shape with the squares asked for); level 2, Rows of grass (a field that fills by rows, three cards for the total); level 3, Same grass, new fence (use every piece of a stack of 10, 12 or 14). [Definition](definitions/meadow-pens.md), [area, volume and space study slice 1](deep-dives/subjects/area-volume-space.md#build-slices-in-order)

Proof: new-game tier, as the [definition's check tier](definitions/meadow-pens.md#check-tier) sets it (typecheck, unit tests including the rule tests, a new `browser-check.mjs` case filtered to Meadow Pens at levels 1 and 3 with one wrong ring each and a requested hint, plus one wrong card at level 2, `fingerdemo` at levels 1–3, one portrait screenshot at level 3, one build). If the allowance cannot cover all three, stop after a complete level 1 (or 1–2) with a draft-PR checkpoint. Review gate: merges only after the developer approves the [level-2 card table](definitions/meadow-pens.md#level-2-card-table) ([decision 8](definitions/meadow-pens.md#open-decisions)); the build itself may proceed.

### lasso-loops 1: About how many?

- **`lasso-loops`, level 6 *About how many?* (estimation E1)** (new level on the existing loop interaction plus the guess-card tap; school 3–6): guess a meadow's fireflies from three far-apart cards (never marked), loop one benchmark ten and keep or change the guess, then play level 4's tens round (21–39 fireflies) as the check. [Definition](definitions/lasso-loops-about-how-many.md), [estimation study slice E1](deep-dives/subjects/estimation.md#build-slices-in-order)

Proof: as the [definition's check tier](definitions/lasso-loops-about-how-many.md#build-and-check-tier-e1-build) sets it (typecheck, Lasso Loops rule tests and `howto.test.ts`, one filtered portrait play at level 6 with a far-card guess, two wrong loops, a changed guess, one wrong pad and the score equal to level 4's, `fingerdemo` at level 6, one portrait screenshot of the guess sign). No review gate.
