# Garden Grow deep dive

*ID `garden-grow` · bands lap–pre-K · levels 1–7 on 2026-10-17 · session `claude/dive-garden-grow` ([PR #530](https://github.com/rjdunlap/neo/pull/530))*

## The game today

Six soil beds sit in a row under a smiling rain cloud. A tap on a bed plants a seed with a little marker stick in its color. Rain makes the seed grow: a stem rises, a smiling flower head pops open, and a bell rings. A grown flower plays a marimba note when tapped, at any time. The game teaches cause and effect for the youngest, then color words, counting out an exact amount, two quantities at once, "one more" and a first look at an array. It lives in Color Cove (`LANDS`, `src/content/lands.ts`). The tracker's "LTP · 5" is the 2026-10-10 snapshot; levels 6–7 and the pre-K window were added the same day.

Ranges (`LEVELS` in `index.ts`): lap 1–2, toddler 2–4, preschool 3–5, pre-K 6–7. No school window, no `order` and no `entryLevels`. `planFor` indexes `PLANS` by position and clamps to the last plan.

| Level | Plan (`mode`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Tap the soil (`plant`) | L | Which bed to tap next. Each seed grows at once; six flowers end the round |
| 2 | Plant, then rain (`water`) | L, T | When to tap the cloud. Rain grows every planted seed; the round ends when all six beds bloom |
| 3 | Plant the color asked for (`color`), 4 requests | T, P | Which of three packets is the color said and shown (red, yellow or blue). The flower grows at once |
| 4 | Plant exactly 2–5 seeds (`count`), 3 requests | T, P | How many seeds, from one packet, before tapping the cloud |
| 5 | Two colors with a number of each (`mix`), 3 requests | P | Two amounts at once ("2 red and 3 yellow") from three packets |
| 6 | One more than the sign (`more`), 3 requests | K | The sign shows 1–4 flowers of a color; plant one more |
| 7 | Two rows of three (`array`), 3 requests | K | The beds stand in a 2×3 grid; plant the six flowers the sign shows |

**Content pools:** six colors (`SEEDS`); level 3 asks only red, yellow and blue; levels 4–6 ask any of the six; level 5 draws two of the first four. Packets are the wanted colors plus others, three in all (one at level 4). Requests never repeat back to back. One flower drawing (`flower()` from `src/art/shapes.ts`) in six colors; one backdrop; one cloud.

**Mistakes and hints:** a wrong packet at level 3 shakes, boings and says "Those are blue seeds. Can you find the red ones?"; rain on the wrong planting at 4–7 boings and says too few, too many or "look at the colors again". The second miss on a request counts one hint: the right packet glows at level 3; the sign and the beds still to plant glow at 4–7. Tapping a planted (not grown) seed takes it out at 4–7. Rule tests (`logic.test.ts`) cover fair requests and packets, back-to-back variety, `matches` in any order, and the demonstration's touches meeting every request with no bounce.

**Known gaps found reading the code:**
- **Fixed in slice 1 (2026-10-20, [PR #674](https://github.com/rjdunlap/neo/pull/674)):** the how-to card (level 3 no longer offers a take-out, the level 5 and 7 steps are capped, level 1 says each bed grows by itself), the bare boing on full beds (now `grow.full`), the uncounted take-out (now recounted aloud) and the level 1 global lock (other beds plant while one grows).
- **Level 7 does not test the array.** It asks for 6 flowers and there are 6 beds, so filling every bed always works, and the hint glows all six beds, which is the same answer. Its colors are not drawn: `SEEDS[out.length % SEEDS.length]` makes every round red, then yellow, then blue. Only the packet color is a decision (4). The proposed rows and columns levels below carry the array idea; 7 itself stays as it is unless decision 4 says otherwise.
- **Still open:** only a squash or poke for a tap on a growing bed or on the sky, which is [V2](../FAMILY-EXPERIENCE.md)'s touch-acknowledgment work and waits on the Animal Snack pilot's review, as in the Teddy Doctor and Sound Garden dives.
- **No science is claimed, and none should be.** The [life-science study](subjects/life-science.md) records that "current color packets and instant flowers do not establish botany or real growth rates." Rain is a compressed toy.

**Couch:** none. **Browser case:** `BROWSER_SUITE=woods WOODS_ONLY=grow FROM_LEVEL=n` (its loop is hard-coded `level <= 7` and expects the score `[2, 1]` on every request level); **demo:** `BROWSER_SUITE=fingerdemo FINGER_ONLY=garden-grow FINGER_LEVELS=…`. **Person check open:** [DEVICE-CHECKS](../DEVICE-CHECKS.md) asks whether tapping the soil and the singing flowers hold a one-year-old's attention.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Sago Mini Farm, [Common Sense Media](https://www.commonsensemedia.org/app-reviews/sago-mini-farm), [Sago Mini letter to parents](https://sagomini.com/article/farm-letter-to-parents/) (search summary) | Touch toy, ages 2–5 | None: "there are no particular activities to complete"; tap the rain cloud to grow crops, then take them to a juicer or grill | The rain-cloud tap that grows things, and a use for what grew | "Not a ton of things to do", so those wanting an app that "does something" get bored; drags that are hard to place; links out to other apps |
| Toca Nature, [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-nature); [Common Sense Education](https://www.commonsense.org/education/reviews/toca-nature) (search summary) | Touch sandbox, 4+ | No levels; the forest grows as she builds; five tree kinds, each with its own resident animal | **A planted thing invites a visitor**: a reason to come back to what she grew | Very sensitive drags; no reset; creations are not kept; cutting trees makes animals leave |
| Viva Piñata (Rare, 2006), [GamePressure plant guide](https://www.gamepressure.com/vivapinata/plants/z6877); the fan wiki's plant page (search summary; the page returned 402) | Console garden sim | New plants, fertilizer colors and visitor requirements unlock as the garden grows; flowers draw particular visitors (recalled) | **Visitors drawn by what she planted**; a garden that becomes a place | Plants that wilt or are stunted, weeds that harm, a money economy, day-and-night watering chores |
| Nico & Nor Wonder Farm (WGBH), [App Store](https://apps.apple.com/app/id1170613737) | Free iPad science toy, "made for ages 0–5" | Set conditions for seeds, then watch tomato, cabbage, bean and carrot plants change; aims to show plants need "water, light, and time" and name root, stem, leaf and fruit | A stated, simple model; plant parts named as they appear; a matching real-plant journal | — (no purchases or ads) |
| Toca Lab: Plants, [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-lab-plants) | Touch lab, 6+ | Five stations (light, water, nutrition, cloning, crossing); 35 plants to discover | **Discovering kinds to collect** | "Not always clear what needs to be done and why"; a crossed seed makes an entirely new plant, which is not botany |
| Plants HD (Sprout Labs), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/plants-hd) | Fact app with quizzes, 8+ | Three quiz levels; a life-cycle ordering game the review calls "particularly helpful" | Ordering growth stages (but Life Story Lab owns that, see below) | Text-heavy facts and quizzes, coins for right answers |
| Tenderleaf Flower Bed, [maker listing](https://www.tenderleaftoys.com/products/flower-bed) (search summary) | Wooden toy, 3+ (a reviewer's 20-month-old plays) | Ten plants at different growth stages into ten holes | **Growth stages as separate things you can see** | — |
| HABA First Orchard, [retailer listing](https://www.amightygirl.com/first-orchard) (search summary) | Cooperative board game, 2+ | Roll a color, pick that fruit; everyone wins before the raven arrives | Color-to-thing matching played together | The raven as a clock |
| Stardew Valley / Harvest Moon (recalled, not opened) | Farming sims | Daily watering, seasons, crops that die out of season | Rows of beds as a pleasing grid | Daily chores, crops lost while away, seasons that expire: everything the rules forbid |

**Learning references.** NGSS [K-LS1-1](https://www.nextgenscience.org/pe/k-ls1-1-molecules-organisms-structures-and-processes): "Use observations to describe patterns of what plants and animals … need to survive", with "the requirement of plants to have light; and, that all living things need water." 2-LS2-1 ([CA NGSS listing](https://www2.cde.ca.gov/cacs/science?c2=3&c3=3), search summary): "Plan and conduct an investigation to determine if plants need sunlight and water to grow", with assessment "limited to testing one variable at a time." These anchor only the gated comparison modes below; the current levels claim neither. CDC, [milestones by 15 months](https://www.cdc.gov/act-early/milestones/15-months.html): "Follows directions given with both a gesture and words"; its tips (blow bubbles to pop, stack blocks to knock down) are cause-and-effect play, which is what the lap levels are. Arrays are a grade 2 idea (CCSS 2.OA.C.4, recalled: total objects in rectangular arrays up to 5×5); the pre-K levels here only use rows and columns as places, not multiplication.

## What makes sense here

- **Keep the toy, fix its words.** The lap and toddler play (tap, pop, rain, a bell, a singing flower) is Sago Mini Farm's best moment without its emptiness, because the later levels add purpose. First make the how-to true and finish the small spoken gaps.
- **Growth stages as presentation.** Tenderleaf's bed and Nico & Nor both make stages visible. Garden Grow can show seed → sprout → leaves → bud → open flower as the growth animation, with no new rule and no claim about time. Ordering stages as a puzzle belongs to the life-science study's proposed **Life Story Lab** and Story Steps, so it is not proposed here.
- **Flower kinds** (the [IDEAS](../IDEAS.md) row's fresh content): a daisy, tulip, sunflower and bell-flower as well as today's round flower. Kind stays separate from color: the color levels judge color only, and a kind is never the answer. This is Toca Nature's "five tree kinds" without the forest.
- **One big flower for lap.** Sound Garden's "one big friend" and the CDC's tips point the same way: a single large target where every touch moves the flower on a stage. It has no wrong touch and no decision, and its windows are a decision.
- **Rows and columns as places.** Level 7's 2×3 grid is already drawn. The array idea becomes meaningful when the sign says *where*: a row of red over a row of yellow, then columns, then "2 in each row" with several right answers. That needs choosing a packet and then a bed, a new interaction on the existing beds.
- **What the subject studies already assigned here stays gated.** Under the Soil (life-science step 5: a roots/shoots cutaway and one matched comparison), Leaf Litter Window (ecosystems F5), Soil Window (earth materials) and Growing Conditions (genetics G8) each wait for their own definition, appended as stable IDs. They are where plant needs (K-LS1-1) and a one-variable comparison (2-LS2-1) would come in, and where a pre-K/school comparison window would open. This dive does not redefine them or add a separate "sun or rain" level. Rain Garden (the [weather-water study](subjects/weather-water.md)) owns where water goes; Garden Grow keeps only the lap cloud and must not become "another flower-count request" there.
- **Creature-world arc.** Viva Piñata and Toca Nature both make a garden a place that invites visitors. Under the [rework](../rework/README.md), a garden she grew can draw a visiting creature, flower kinds can join her packet pool permanently through play, and the journal can file the kinds she grew. All of that waits on the rework's cast and journal. Nothing wilts, needs watering while she is away, or is lost.

**Long-term arc:** lap taps that grow one big flower → lap and toddler planting and rain → toddler and preschool colors and counts → pre-K one more, rows and columns → (after their definitions) pre-K/school roots, soil and one-change comparisons.

## Experience and presentation

- **First unsupported action:** at level 1 she taps a bed and a seed pops in and grows. Proposed level 8 makes it any touch on the garden, with one large bed.
- **Touch and consequence:** touch-down pops the seed in (`sfx.pop`) with a colored marker stick; rain makes a burst of drops and a splash; growth ends in a bell. Rain on nothing still rains, harmlessly. After slice 2 the soil darkens where rain falls and dries back after the bloom, so the cause is visible with the sound off.
- **Variety without changing the rule:** colors, amounts, which packets, flower kinds (slice 3), and in levels 9–11 which colors go in which row or column.
- **Reasoning, not reading, memory or precision:** the sign shows every request in pictures, and the corner guide repeats the spoken one. Beds are 124 by 150–240 units. Nothing is read and nothing is timed. Levels 9–11 keep the sign on screen, so no layout must be remembered.
- **Supported ending:** after two misses the sign and the beds to plant glow (at 9–11, each bed glows in the color it needs), so a supported finish is always one tap away. Level 8 has no misses.
- **Co-play:** the [IDEAS](../IDEAS.md) asymmetric seat already works on one screen: one plants and the other is the weather, tapping the cloud. The how-to and co-play tip now say so (slice 1, built). Solo play is unchanged.
- **Art/feel example (code-drawn):** in `Bloom.grow`, after the stem tween, two leaf ellipses unfold (`scale.x` 0 → 1, `ease.outBack`, staggered 0.08 s), a bud (a closed `flower()` at radius 14 inside the head) swells, then the head opens to full size with today's bell. Under rain, the bed's soil ellipse is redrawn from `0x8a5a36` to a darker `0x5e3b22` with a light sheen, then tweened back after the bloom. No imported art.
- **Needs a person or device:** whether a one-year-old taps the soil again after the first flower; whether a lap player on level 8 touches the big bed or the sky; whether "top row" and "this column" are heard clearly in device speech; whether a pre-K child reads the rows sign as places or just as colors.

## Proposed ladder

### Fresh content inside existing levels

- **True how-to and spoken gaps.** Level 3's step drops "take it out" and says the flower grows at once; level 5's step becomes `{ from: 5, to: 5 }` and level 7's `{ from: 7, to: 7 }`. A packet tap on full beds says "The beds are full. Tap a seed to take it out." (new `grow.full`, no miss). Taking a seed out says the new count. At level 1 another empty bed still plants while one grows. The co-play tip names the weather seat. Rule test: a how-to case scoped to Garden Grow's card, that no step without `to` starts below the top level.
- **Growth stages and wet soil** (presentation, above). Rule test: none; the demonstration's timing is unchanged in shape, so `fingerdemo` checks it still ends.
- **Flower kinds.** Four new kinds drawn with `Graphics` (daisy, tulip, sunflower, bell-flower) beside today's. Each request draws a kind; consecutive requests differ in kind; packets show the kind and the color; `matches` still judges color and number only. Free levels 1–2 plant a random kind per bed. Rule test: kinds never repeat back to back, packets for one request share a kind, and `matches` ignores kind.

### New levels on top

Appended with stable IDs. Lap `order: [8, 1, 2]`, `entryLevels: [8]`; pre-K `order: [6, 7, 9, 10, 11]`.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | **Grow it up** | lap (order 8, 1, 2) | One big bed in the middle. Any touch on the garden moves the flower on one stage: seed in → sprout → leaves → bud → open and singing. Then the flower goes into a vase at the side and a new seed waits. Three flowers end the round | Nothing to get right: each touch makes the next thing happen | None can happen. A touch during a stage's tween finishes that tween and starts the next stage, so no touch is lost | Five stages per flower; three flowers end it; every stage is reachable from a touch anywhere on the garden's hit area; the bot's touches finish | One large bed and vase layout, the slice 2 stages reused, voice (`grow.big`), how-to step, bot (tap the bed); extend the woods case with a `[0, 0]` score |
| 9 | **Rows of colors** | pre-K | Beds in the 2×3 grid. The sign shows a row of 3 red over a row of 3 yellow. Tap a packet to choose it (it lifts with a ring, which is free), then tap beds to plant that color; tap the cloud. 3 requests; colors and which row vary | Which color goes in which row | Rain on a wrong layout: a boing and "The top row needs red." Default: a miss. After two, each wrong or empty bed glows in the color it needs | Every request is two rows of one color each, colors differ; the judge checks color by position; the hint lights exactly the beds that differ; the bot chooses a packet then beds and finishes with no miss | Choose-then-plant interaction on the existing grid (chosen-packet ring, nearest-bed taps), a 2×3 sign with rows, voice per row, how-to step, bot; extend the woods case past 7 with its score |
| 10 | **Columns of colors** | pre-K (after 9) | The same grid; the sign shows three columns of two, in two or three colors (red, yellow, red; or red, blue, yellow) | Which color goes in each column | "This column needs blue" with the column glowing. Default: a miss. Hint as at 9 | Every request has three columns of one color each, at least two colors, never the same layout twice running; judge and hint as at 9 | Same interaction; voice per column; how-to step; bot |
| 11 | **Same in every row** | pre-K (after 10) | The sign shows two rows with a number on each, "2" and "2", and empty pot outlines. Plant 2 flowers in each row, in any beds. 3 requests, 1 or 2 per row (3 per row would fill the grid, level 7's flaw) | How many in each row; where is her choice | Rain with a row short or over: "This row has 3. Each row needs 2." Default: a miss. After two, the short row's free beds or the over row's extra seeds glow | n is 1 or 2, so there are always 9 placements, and every one is accepted; the hint never lights a bed that would break a row; the pet's finishing line counts by rows ("2 and 2 makes 4") | Same interaction, a numbered row sign, voice, how-to step, bot |

### Younger-band openings

- **Lap:** level 8 is the new lap entry. Whether a toddler also gets it is decision 1.
- **Toddler:** slices 1–3 improve 2–4 without a new rule. A toddler level is not proposed: the cutaway observations (Under the Soil, Leaf Litter Window) are the planned toddler additions and wait on their definitions.

### Easier entries and levels between existing ones

Level 8 is an easier entry before 1 for lap, placed by `order` and declared in `entryLevels` so a birthday or pin lands safely. Levels 9–11 sit after 7 in pre-K's `order`. No saved level or pin is renumbered. Add a rule test that every level in every band's range maps to its own plan, so an appended ID never falls back to level 7's.

### Left out on purpose

- Wilting, weeds, pests, watering chores, plants that change while she is away, seasons that expire: neglect and obligation.
- Coins, a shop or selling the harvest (Viva Piñata, Stardew): Market Stall owns money, and the rework sets no currency.
- A growth-stage ordering puzzle: Life Story Lab and Story Steps own sequencing.
- Plant-needs claims, a sun-or-rain choice and fertilizer: wait for Under the Soil and Growing Conditions, with a reviewed model.
- Water flow and puddles: Rain Garden's.
- Multiplication or "how many in all?" quizzes on the arrays: grade 2 and Orchard Rows; level 11 only narrates the total.
- Crossing plants into new kinds (Toca Lab): not botany.
- Couch play: a planting toy has no fair face-off.

## Decisions for the developer

1. **Level 8's windows.** Default the build uses: lap only (`order: [8, 1, 2]`). Alternative: a toddler window too, after a person watches a lap player and a toddler.
2. **Levels 9–11's windows and accounting.** Defaults: pre-K only; a wrong layout or a row count is a miss; choosing a packet is free. Alternatives: a preschool window for 9 (matching color rows is spatial matching); a school window with a larger 3×4 grid, which waits until Under the Soil defines the school end of the game.
3. **Creature-world hooks** (after the rework's cast, journal and collection items). Proposed: (a) a finished garden draws a visiting creature that lands on a bloom at the finale, with no request attached; (b) a flower kind first grown in a round joins her packet pool permanently, and every level still works with the starting kinds, so nothing gates; (c) the journal files each kind she grew through `RoundResult.discoveries`, only what the round showed; (d) keeping a garden picture as a creation. Lean: (a) and (c) first; (b) only if a collection item asks for it; (d) after a creations slot type is defined. None unlocks or gates a level.
4. **Level 7.** Lean: leave it as the warm-up before rows (fill the grid, with the color chosen), and draw its colors from the pool instead of red, yellow, blue each round (slice 1 can do the colors if the developer agrees). Alternative: retune 7 to arrays smaller than the grid; that changes a level's meaning under a saved ID, so it is not the default.
5. **The subject modes' place in this ladder** (Under the Soil, Leaf Litter Window, Soil Window, Growing Conditions). Lean: define Under the Soil first, as life-science step 5 says, with appended IDs and its own windows; fold the others into it where they share the cutaway. No mode is built from this dive.

## Build slices, in order

**Routine batching (developer, 2026-10-21):** the numbered slices below are scope/dependency substeps. [READY](../READY.md) dispatches related substeps together using the [`garden-grow` batch plans](../GAME-BATCHES.md#batch-plans): one declared batch per worker/PR, prerequisite substeps first, with existing gates and special checks preserved. Do not create a new session for each numbered level in a claimed batch.

1. **True how-to and spoken gaps** (existing-game bug fix on an unchanged interaction; **built 2026-10-20, [PR #674](https://github.com/rjdunlap/neo/pull/674)**; the level 7 colors wait on decision 4): cap the level 5 and 7 steps, correct level 3's step, add `grow.full` and the count after taking a seed out, let other beds plant while one grows at level 1 (the bot must still finish: `autotouch` returns null only while `busy`), name the weather seat in the co-play tip, and a how-to test, scoped to Garden Grow's card, for uncapped steps. Checks: `npm run typecheck`, Garden Grow's rule tests and the how-to test, `BROWSER_SUITE=woods WOODS_ONLY=grow FROM_LEVEL=1`, `fingerdemo` at 1.
2. **Growth stages and wet soil** (presentation on an unchanged interaction; **built 2026-10-21, [PR #749](https://github.com/rjdunlap/neo/pull/749)**): leaves unfold, a bud swells, the head opens; the soil darkens under rain and dries back. Checks: typecheck, the woods filter at 1–2, `fingerdemo` at 1 and 7, one portrait screenshot.
3. **Flower kinds** (content in existing levels; **built 2026-10-22, [PR #851](https://github.com/rjdunlap/neo/pull/851)**): four new kinds, kind varies per request, packets show kind and color, color judged alone. Checks: typecheck, rule tests (kind variety, `matches` ignores kind), the woods filter at 3, one screenshot.
4. **Level 8 Grow it up** (new level, lap entry; **built 2026-10-22, [PR #851](https://github.com/rjdunlap/neo/pull/851)**): one big bed, five stages per touch, three flowers; `order: [8, 1, 2]`, `entryLevels: [8]`; voice, how-to, bot; the woods case extended. Checks: the new-interaction tier (one scripted play, `fingerdemo` at 8, one portrait screenshot). Slice 2, which supplies the stages, is built, so this is unblocked.
5. **Level 9 Rows of colors** (**built 2026-10-23, [PR #859](https://github.com/rjdunlap/neo/pull/859)**; new interaction: choose a packet, then a bed): position-judged layouts, per-bed hint, pre-K `order: [6, 7, 9]`; voice, how-to, bot; the woods case past 7. Checks: the new-interaction tier (first play with one wrong layout and a hint, `fingerdemo` at 9, one portrait screenshot).
6. **Level 10 Columns of colors** (**built 2026-10-23, [PR #859](https://github.com/rjdunlap/neo/pull/859)**; new level on slice 5's interaction): column layouts in two or three colors. Checks: typecheck, rule tests, one browser play at 10, `fingerdemo` at 10.
7. **Level 11 Same in every row** (**built 2026-10-23, [PR #859](https://github.com/rjdunlap/neo/pull/859)**; new level on slice 5's interaction): n per row in any beds, every placement accepted, row-count hint. Checks: typecheck, rule tests (all placements accepted, hint never breaks a row), one browser play at 11, `fingerdemo` at 11.

Gated: a squash or poke for taps on a growing bed or the sky (V2), decisions 1–5, and the subject modes.

## What was built in this session

Slice 2 (2026-10-21): `Bloom.grow` raises the stem, unfolds two leaves, swells a closed bud with a green sepal, then opens the smiling head; rain soaks a bed's dark soil at once and it dries back slowly after the bloom is up; a cloud tap at levels 1 and 3 wets a bed within 90 units. No rule, accounting, voice or how-to change. Research and ideation otherwise. Ran `node scripts/check-links.mjs` and `git diff --check`.
