# Second Chance Shed, levels 5–6: someone needs it (definition)

Defined 2026-10-31 as slice **N3** of the [nature-and-sustainability study](../deep-dives/subjects/nature-sustainability.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/nature-sustainability.md#first-games-proposed-ladder-second-chance-shed) and [rules to define](../deep-dives/subjects/nature-sustainability.md#rules-mistakes-help-and-proof-to-define), on top of the built [levels 1–4](second-chance-shed.md) (N2, [PR #930](https://github.com/rjdunlap/neo/pull/930)) and read against its code (`src/games/second-chance-shed/`). Docs only: no level, item, voice line or save field below exists yet.

**Status: ready to build** as batch [second-chance-shed 2](../GAME-BATCHES.md#second-chance-shed-2-someone-needs-it), at the new-interaction tier ([check tier](#check-tier)). Every open call has a default ([open decisions](#open-decisions)). The one gate is the same as N2's: the building session source-checks the new item and its request fits and records the check in its verification entry.

**Fun action and purpose:** a friend comes to the shed yard with a picture bubble: pencils with nowhere to stand, or Bunny with nowhere to nap. Everything on the cart is laid out at once. She plans where each thing goes, moves things about as often as she likes, gives the friend something that fits, then rings the cart bell. When the plan works, every place makes its thing in turn and the friend uses the gift.

The learning goal is that **a thing can have more than one good next life, and a need decides between them**. The tin with a lid is metal like the squashed can, so on our island the Remake machine would take it. A whole tin is also good as it is, and a friend needs a pencil pot, so using it again is the better choice here (the study's "reuse first because someone asked", a preference, not a law). At level 6 two friends need things and one thing fits both, so she plans who gets what before she rings. This is the solutions half of NGSS K-ESS3-3 (reduce, reuse) at school age, plus planning a whole arrangement against several conditions (CCSS mathematical practice 1).

## Identity and overlap

- **Levels 1–4** judge each drop at once. Levels 5–6 are a different interaction: a laid-out cart, free rearranging, friends as targets and one claim, the bell. That is why they are a separate definition, and why the build is new-interaction tier.
- **Critter Sort / Shape Sorter overlap test** ([N1](second-chance-shed.md#identity-and-overlap)) still passes: every place plays its consequence at the bell, and each friend visibly uses what she gave (the pencils stand in the tin, Bunny curls up in the box). Nothing here is matching to a bin without a result.
- **Lunch Line, Swap Meet, Market Stall** match a thing to a person's request one at a time. Here a request is one condition inside a whole plan, and the tempting item has a second accepted place, so the choice is between two good next lives, not between right and wrong.
- **Paint Mixer, Village Vote** have no overlap.

## The model (additions to `logic.ts`)

**One new item record, `tin`:**

| Item | Island place | Also accepted (from level 5) | Kind | Consequence | Request fits |
| --- | --- | --- | --- | --- | --- |
| tin with a lid | reuse shelf | Remake machine (it is metal, like the can) | whole | On the shelf: the pet keeps buttons in it. In Remake: it chugs and drops a can-lid medal, like the can | pencils |

The tin is drawn whole, with a rolled rim and a fitted lid: no sharp edge, no label, no food. It is the only item with an accepted place besides its own, and it never appears at levels 1–4.

**Request fits for the existing whole things** (the shelf items):

| Item | Fits | Why it reads from the picture |
| --- | --- | --- |
| tin with a lid | pencils | Small and stands up; a bed is too big for it, and it has no hole for a plant to drink |
| sturdy box | pencils, bed | Big enough for Bunny to curl up in; pencils stand in a corner of it |
| flowerpot tub | pencils, seedling | Has the drainage hole the seedling needs; pencils stand in it |
| cloth bag | — | Floppy: pencils fall over, Bunny would slide out, soil would leak |

Food bits, broken toys and squashed things fit no request.

**Three requests**, each a friend from the shared critters (`src/art/critter.ts`, via `attach()`) with a picture bubble and a spoken line:
- `pencils`: a friend holding a fistful of pencils, bubble of pencils standing in a pot. "On our island, I need something to stand my pencils in."
- `bed`: Bunny (`CRITTERS.bunny`), sleepy, bubble of a bunny curled in a bed. "I need something big enough to nap in."
- `seedling`: a friend holding a seedling, bubble of a seedling in a pot. "My seedling needs a pot with a hole for its water."

**Code traps the build must handle** (read against the current `logic.ts` and `index.ts`):
1. **Keep the tin out of levels 1–4.** `roundFor` pools by `ITEMS[id].place` over every `ITEM_IDS` entry, so a `tin` record with `place: 'shelf'` would start appearing at levels 2–4. Give `Item` a `from?: number` (the tin's is 5) and filter on it in the level 1–4 pool. The existing "the tin with a lid never appears" test stays, scoped to levels 1–4.
2. **One item, more than one accepted place.** `Item.place`, `judge()`, `KIND_OF_PLACE` and the "every item has exactly one place" test assume one place each. Add `also?: Place[]` (the tin's is `['remake']`) and `fits: RequestId[]` (empty by default). The level 1–4 invariants still hold for every item those levels can draw, and `judge()` keeps its single-place rule for levels 1–4.
3. **A separate tally.** `ShedTally` counts per item, which is right for levels 1–4 and must not change. Levels 5–6 get their own `PlanTally` (below), so the level 1–4 accounting tests stay as they are.
4. **A drag handle on every thing.** Today only the cart's current item has a handle, destroyed on accept. At levels 5–6 every thing keeps its `draggable` handle wherever it sits (cart, place or friend), and `destroy()` releases all of them.
5. **The ghost finger rings the bell.** `TouchIntent` already has `{ tap: Spot }`, so `autotouch()` can drag things and then tap the bell with no change to `types.ts`.

**A plan** is a map from each thing in the round to where it sits: `cart`, one of the four places, or a request (one friend). **`checkPlan(round, plan)`** returns the first unmet condition, in this order, or `ok`:
1. `onCart`: something is still on the cart (not a claim; see [accounting](#accounting-help-and-finishing)).
2. `misplaced(item, at)`: a thing is in a place that does not accept it (its own place or its `also`), or with a friend it does not fit. Earliest in the cart's left-to-right order first.
3. `unmet(request)`: a friend has nothing. Friends in screen order.

A friend holds one thing. A second thing dropped on a friend who already holds one swaps: the first goes back to the cart row (free, never counted).

**`solutions(round)`** enumerates every accepted plan (each thing to an accepted place or a friend it fits, every friend holding exactly one fitting thing). The checker accepts by `checkPlan`, never by comparing with a stored answer, so any accepted pairing finishes.

## Levels

| Level | Name | Bands (default) | On the cart | What she decides | Finish |
| --- | --- | --- | --- | --- | --- |
| 5 | **Someone needs it** | school | Five things: the tin, the cloth bag, and one each of food, broken and squashed, seeded from the table | One friend asks for something to stand pencils in. The tin is the only thing on the cart that fits; Remake and the shelf would also take it, and only the friend's need makes the gift the plan | The bell rings with every thing in an accepted place and the pencils standing in the tin |
| 6 | **Two friends** | school | Five things: one of the two authored request cases below, its two candidates, and three of food, broken, squashed and the bag (never a third candidate) | Two friends ask. One candidate fits both requests and the other only one, so the both-fit thing must go to the friend the other cannot help | The bell rings with both requests filled and every other thing in an accepted place |

**Level 6's two authored cases** (the seeded RNG picks one and the friends' left-to-right order):

| Case | Friends | Candidates | The only accepted pairing | The tempting plan |
| --- | --- | --- | --- | --- |
| A | pencils, bed | box (pencils, bed), tin (pencils) | box to Bunny, tin to the pencils | box to the pencils: Bunny has nothing that fits |
| B | pencils, seedling | tub (pencils, seedling), tin (pencils) | tub to the seedling, tin to the pencils | tub to the pencils: the seedling has nothing that fits |

**Greedy, defined exactly** for the rule test: take the friends in screen order and give each the first fitting thing on the cart in left-to-right order. The round generator places the both-fit candidate on the cart before the tin, so in each case greedy fails whenever the pencils friend stands first. When the other friend stands first, greedy succeeds; that order still teaches (the bed or seedling friend has only one choice), so it stays, but **at least half of the seeds per case** put the pencils friend first, and the test asserts that proportion over 500 seeds.

`BandLevels`: school `{ min: 4, max: 6 }`. A new school player starts at 4, the last one-thing-at-a-time level, and steps up through the ordinary rule; a struggling level 5 steps back to 4. Toddler, preschool and pre-K ranges are unchanged ([decision 1](#open-decisions)). The ladder appends 5–6 above 4, so no saved level moves; Picnic Loop (N4) appends 7–8 later.

**Paper stays out** (N1 left this to N3): the worm bin is open at levels 5–6, and the "no paper with the worm bin" rule holds.

### First rounds

- **Level 5 (tin, banana peel, kite with a torn tail, bottle caps, cloth bag):** the pencils friend walks into the yard, bubble up. The pet: "Plan where every thing goes. Someone needs something today. Ring the bell when you're ready." She drags the peel to the worm bin, the kite to the mending table, the caps and then the tin into the Remake machine (each settles with a soft tick, no judgement), and the bag onto the shelf. She rings the bell: one miss. The friend's bubble bobs and the friend says, "I still need something to stand my pencils in." She drags the tin out of the Remake machine to the friend and rings again. The worm munches and a sprout pops, the kite flutters, the caps become a bead, the pet swings the bag, then the friend stands the pencils in the tin and the round finishes.
- **Level 6, case A (box first on the cart, then the tin; pencils friend on the left):** she gives the box to the pencils friend, places the other three things, and rings: one miss. Bunny yawns: "I need something big enough to nap in." She tries the tin on Bunny and rings: a second miss. Bunny says, "That's too small for me", and the glow comes on: the tin and the pencils friend, where the only accepted plan puts it. She drops the tin on the pencils friend (the box swaps back to the cart), gives the box to Bunny, rings, and the round finishes with misses 2, hints 1.

## Screen and controls

Built on the level 1–4 yard ([N1 screen](second-chance-shed.md#screen-and-controls)); the 1024×768 design area is the binding view, since every view contains it.
- **Cart row** across the top: the five things, each about 120×120 (at least 100), with gaps of at least 20, clear of the home button. In portrait the row is the same; the view is wider than the design area there, never narrower.
- **The bell**, at least 120×120, on the cart's right end. `onTap`; touch-down dings softly and the bell swings, even when it will not finish.
- **Friends** in the band between the cart row and the places, at the right in landscape (about 170×210 each, with the bubble inside that box) and in a row above the two rows of places in portrait.
- **Places** as at level 4: four along the bottom in landscape, two rows of two in portrait.
- **Things in a place** sit fanned on it, newest on top, each at least 100×100. Only the top one in a place is picked up, so even if she drops all five in one place, the one under her finger is always at least 100 units and grabbable; lifting it reveals the next.
- **Dropping** resolves to the nearest place, friend or the cart row (nearest-target rule, as `placeAt`), with `DROP_PAD` around each. The empty yard floats the thing back to where it was picked up. Nothing judges a drop at levels 5–6: a soft tick, the place breathes, the thing settles.
- **`shedLayout`** gains the cart row, the bell and the friends. Its test, at the existing five views and for one and two friends: every target at least 100 units each way (things at least 100, the bell at least 120), the cart row clear of the home button, the pet's corner clear, everything inside `view`, and no two drop areas overlapping after `DROP_PAD` (friend and place, friend and friend, friend and bell, the cart row and everything).

## Accounting, help and finishing

A `PlanTally` (not `ShedTally`) keeps the round's misses and hints.
- **Never a miss:** any drop or move, taking something back to the cart (Undo is dragging it back), swapping a friend's gift, Start again, and ringing with something still on the cart (the cart rattles, the pet says "Find a place for everything first", and the things left there wiggle).
- **A miss:** a ring of the bell whose plan fails `checkPlan`. One miss per unsuccessful ring, never one per wrong thing. The first unmet condition speaks:
  - a misplaced thing wiggles where it is (it is not moved: the plan is hers) and its place says its reason line from levels 1–4 (`shed.reason.<place>`), or a friend it does not fit says why (`shed.nofit.<request>`, such as "That's too small for me");
  - an empty friend says what they still need (`shed.need.<request>`).
- **Ringing again on an unchanged failed plan** repeats that line and counts nothing (the tally remembers the last failed plan's signature). Only a changed plan can earn a new miss. A rule test covers it.
- **After two misses** the glow comes on for the first unmet condition, read against the nearest accepted plan: the misplaced thing and where that plan puts it, or the empty friend and the thing that plan gives it. The automatic glow counts **one hint, once per round** (the round is one plan; this is the Sense Detective rule, not levels 1–4's per-item rule).
- **Show a hint** (pause sheet) turns on the same glow and counts that same once-per-round hint if it has not been counted. Asked again, **Show me one**: the ghost finger moves one thing toward the **nearest accepted plan** (the one keeping the most of her placements; ties broken by the cart's left-to-right order), counting one hint each time. It never moves a thing the nearest plan keeps where it is. When it moves a both-fit thing away from a friend, the friend it now goes to says why (`shed.only.<request>`: "Only the box is big enough for Bunny"). It never rings the bell; she does.
- **Supported finish:** repeated Show me one reaches an accepted plan; her ring then finishes the round, with every hint counted. One sticker, even with help.
- **Finish:** a successful ring disables the bell (a repeated ring cannot finish twice), then every place plays its consequence for the things in it, in place order, then each friend uses the gift (`shed.filled.<request>`), then the level 1–4 rise and `ctx.finish({ misses, hints })` once. No timer, score, star or optimality rating; nothing saved.
- **Start again** puts every thing back on the cart in its first order and clears the friends, keeping misses and hints and the counted-hint flag.
- **Adaptation:** the ordinary rule. Two rings that fail twice each (four misses) is a struggling round. A zero-miss level 6 round is evidence she planned the pairing or got the friend order where greedy works; the grown-ups' card says so.

## Rule tests (`logic.test.ts`, written when building)

- **Table:** levels 1–4 invariants unchanged, and no level 1–4 round contains the tin (500 seeds per level). The tin is the only item with `also`; its `also` is Remake; only whole things have fits; the bag fits nothing.
- **Level 5, 500 seeds:** five things; the tin and the bag are present; the tin is the only thing on the cart that fits the request; one of each of food, broken and squashed; no paper; at least one accepted plan, and in every accepted plan the tin is with the friend; a plan with the tin in Remake (and everything else accepted) fails with `unmet(pencils)`.
- **Level 6, 500 seeds:** the case's two candidates and no other thing with a fit to either request (so the bag is the only other whole thing allowed); exactly one accepted pairing; the both-fit candidate sits before the tin on the cart; greedy (as defined above) fails whenever the pencils friend stands first, and that happens in at least half the seeds of each case.
- **`checkPlan`:** the order of conditions (cart, misplaced, unmet) and the left-to-right and screen tie-breaks; the tin accepted on the shelf, in Remake and with the pencils friend, and refused by Bunny and the seedling friend.
- **Accounting (scripted level 6 case A):** box to pencils, ring (miss 1); same plan, ring (still 1); tin to Bunny, ring (miss 2, glow, hints 1); Show a hint (still 1); Show me one (hints 2; it moves the tin to the pencils friend, the swap sends the box back to the cart, and nothing correctly placed moves); the box to Bunny and a ring finish; finish once; a second successful ring does nothing. Ringing with a thing on the cart never counts.
- **Help leads somewhere:** from any plan of every seeded round, repeated Show me one reaches an accepted plan; each move reduces the distance to the nearest accepted plan by at least 1 and never moves a thing that plan keeps in place.
- **Layout:** the extended `shedLayout` test above.
- **Registry, lands and how-to tests** pass with school added to the bands and the card's new ranges.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `autotouch()` at levels 5–6 asks the same next-move function as Show me one, drags that thing, and when the plan is accepted taps the bell (`{ tap }`). The scripted play drives the same bot. Levels 1–4 keep their bot.
- **How-to card** (`src/content/howto.ts`), extended:
  - existing steps' ranges grow: shelf `{ from: 2, to: 6 }`, mending `{ from: 3, to: 6 }`, Remake `{ from: 4, to: 6 }`;
  - new steps `{ from: 5, to: 6 }`: "Move every thing from the cart to a place, or give it to a friend who needs it." "A friend's bubble shows what they need; give them something that fits." "Ring the bell when your plan is ready.";
  - `{ from: 6, to: 6 }`: "Two friends need things, and one thing fits both: plan who gets what.";
  - notes `{ from: 5, to: 6 }`: "Moving things is free. Only a ring of the bell that doesn't work counts as a miss, and the friend or place says what is still missing; after two, the glow shows one fix, which counts as a hint." The "island's own rules" note's range grows to 6.
- **Voice lines** under `shed.*`: `instruct.5`, `instruct.6`, `item.tin`, `request.<pencils|bed|seedling>`, `need.<request>`, `nofit.<request>`, `only.<request>`, `filled.<request>`, `bell.cart`, `made.buttons` (the tin on the shelf). Every rule line says "on our island"; nothing is written to read.
- **Registration:** bands gain `school`; `describeLevel` names 5 "Someone needs it" and 6 "Two friends"; skills gain `planning`. Region, land (Cozy Village), icon, sticker and music unchanged. No save field.
- **Art:** in `art.ts`, code-drawn: the tin with its lid, the bell, the three request bubbles, the pencils standing in the tin, the seedling in the tub and Bunny curled in the box. Friends are existing critters.
- **Sounds:** the bell's ding is `sfx.bell` on a pentatonic step; a failed ring adds the gentle `sfx.boing()`; settles reuse `sfx.tick()`. No imported audio.
- **Co-play:** the study's shed keeper and courier, at school age: the grown-up is a third friend asking out loud ("I need something for my buttons"), and she decides whether the plan can still work.

## Weighed: Beach Day Pack-up

The [oceans study](../deep-dives/subjects/oceans.md#candidates-and-recommendations) handed *Beach Day Pack-up* (pack the picnic so nothing is left behind: take home, reuse, worm bin; toddler to kindergarten) to this definition. **Decision: not part of levels 5–6, and not a new level.** Its decision is levels 2–4's one-thing-at-a-time sort with a picnic item set, a "take home" basket in place of the shelf and a Bubble Beach backdrop; it adds no new rule for a school child, and it would reach younger bands than these levels serve. It stays a proposal: a **picnic set** for levels 2–4, as a later dressing of the same rounds (items and a backdrop, no new interaction), after its own item review, with "nothing is left on the sand" shown as a tidy blanket, never a litter scene. It is recorded in the [study's slice list](../deep-dives/subjects/nature-sustainability.md#build-slices-in-order).

## Check tier

The build is the **new-interaction tier** (the laid-out cart, free moves, friends and the bell are new):
- typecheck and the rule tests above, with the registry, lands and how-to tests;
- one scripted play through the game's `browser-check.mjs` case, filtered: level 5 (tin to Remake, a ring that fails with the pencils line, a repeated ring on the unchanged plan counting nothing, then the tin to the friend and the finish) and level 6 (the tempting plan, two failed rings and the glow, one Show me one, the finish);
- one portrait screenshot at level 6 with both friends and every thing placed;
- `fingerdemo` at levels 5 and 6;
- `npm run build`, because the voice script and how-to file change.

Open for a person or device, not established by automation: whether a school child reads a friend's bubble without the line; whether "give it to a friend" reads as better than Remake without being told it is a rule; whether the tempting plan feels fair at level 6; device speech of the new lines.

## Open decisions

Each has a default the build uses; none blocks it.
1. **School's range.** Default `{ min: 4, max: 6 }`, so a new school player meets one level of the per-thing sort first. Alternative: `{ min: 5, max: 6 }`.
2. **Glow accounting.** Default once per round (the round is one plan). Alternative: once per unmet condition.
3. **A misplaced thing at a failed ring.** Default: it stays and wiggles. Alternative: it hops back to the cart row.
4. **Show me one's count.** Default one hint per use, as the study says. Alternative: one per round.
5. **The tin's shelf consequence.** Default: the pet keeps buttons in it. Alternative: a little seed tin on the windowsill.
