# Second Chance Shed, levels 7–8: Picnic Loop (definition)

Defined 2026-11-09 as slice **N4** of the [nature-and-sustainability study](../deep-dives/subjects/nature-sustainability.md#build-slices-in-order). It is drawn from the study's [proposed ladder](../deep-dives/subjects/nature-sustainability.md#first-games-proposed-ladder-second-chance-shed) and [rules to define](../deep-dives/subjects/nature-sustainability.md#rules-mistakes-help-and-proof-to-define), and sits on top of the built [levels 5–6](second-chance-shed-5-6.md) (N3, [PR #1057](https://github.com/rjdunlap/neo/pull/1057)). It was read against the current code in `src/games/second-chance-shed/`. Docs only: no level, vessel, voice line or save field below exists yet.

**Status: ready to build**, as batch [second-chance-shed 3](../GAME-BATCHES.md), at the new-interaction tier ([check tier](#check-tier)). Every open call has a default ([open decisions](#open-decisions)). The one gate is the same as N2's and N3's: the building session source-checks the picnic set (cups, mug, wash tub) and records the check in its verification entry.

**Fun action and purpose:** friends come to the shed yard for a day of picnics: breakfast and lunch at level 7, then supper too at level 8. Every friend needs a cup at every picnic. The shed has a few good washable cups, a wash tub that washes only two between picnics, and a stack of one-use cups that go to the Last Heap after one drink. She plans the whole day on one board: which cup each friend drinks from at each picnic, and which used cups go in the tub. Then she rings the cart bell. When the plan works, the day plays through: friends sip, cups splash in the tub, one-use cups stack neatly on the Last Heap, and its counter stays within the day's target.

The learning goal is that **reuse is a plan across time, limited by what can be cleaned and when**. A washed cup can come back, but the tub's two places are the bottleneck, so what she does at breakfast decides what lunch can look like. Saving the good cups for later can do as well as using them first, and reaching for four one-use cups at the start does worse. This is the solutions half of NGSS K-ESS3-3 (reduce, reuse) at the top of school age. It also involves scheduling a resource over steps against several constraints (CCSS mathematical practice 1 and 4, modelling with a small table). The target is a puzzle constraint, not a moral one.

## Identity and overlap

- **Levels 5–6** plan where each thing goes once. Picnic Loop plans the same things **over time**: each cup can serve more than once, and the board has a column per picnic. The bell, free rearranging, one claim per ring and the once-per-round glow carry over. The board, the tub and the cups' routes are new, so the build is new-interaction tier.
- **Lemonade Stand** also has cups across days, but cups there are a cost in shells and the purse carries over. Its decision is how much to make against a forecast. Here nothing is bought or sold and there is no chance: the decision is which cup serves which friend when, and nothing is scored beyond the stated target.
- **Lunch Line, Market Stall, Swap Meet** serve one request at a time with no carry-over. **Pet Kitchen** shares food fairly at one sitting. Neither has reuse across steps.
- **The Critter Sort overlap test** ([N1](second-chance-shed.md#identity-and-overlap)) still passes. Every choice plays a consequence: a sip, a wash or a cup on the heap.

## The picnic set (new art and records, no level 1–6 item)

The study's "three washable cups and a jar" predates the build. N1 replaced the jar with the flowerpot tub (no glass that could look broken), and `logic.ts` has no jar. Its job here, a fourth washable vessel that level 8 can promise to a friend, goes to **the big mug**.

| Vessel | How many | Drawn as | Rules |
| --- | --- | --- | --- |
| Washable cup | 3 (red, blue, yellow from `palette.ts`) | A sturdy beaker with a thick rim | Starts clean; one drink makes it used; a used cup must go through a wash tub before anyone drinks from it again |
| The big mug | 1 | A chunky enamel mug with a handle | As a washable cup. At level 8 it is promised to the painter friend, clean, at a set time |
| One-use cup | As many as she takes (a stack of 12) | Thin, pleated, plain white with one stripe | One drink, then it goes to the Last Heap. It cannot be washed |

The one-use cups' material is never named. No paper, plastic or compostable claim is made, so no real bin rule is implied.

**The wash tub** stands between two picnics. It has two slots and washes the cups in them before the next picnic. **The Last Heap** is the study's neutral, tidy pile. It shows its count as stacked cups beside a **pictured target**: dashed cup outlines, one per cup the target allows. Cups beyond the outlines stack beside them, with no colour change, sad face or smell.

None of these appear at levels 1–6. They are a separate record (`VESSELS`), not entries in `ITEMS`, so the level 1–6 pools and table tests are unchanged.

## Levels

| Level | Name | Bands (default) | The day | Target | Finish |
| --- | --- | --- | --- | --- | --- |
| 7 | **Picnic Loop** | school | Four friends, breakfast and lunch; one tub between them | At most **2** to the Last Heap | The bell rings with every seat served, every reused cup washed in between, and the heap within its outlines |
| 8 | **Three picnics** | school | The same four friends at breakfast, lunch and supper; a tub after breakfast and one after lunch, two slots each. The painter friend needs the big mug, clean, at a set time (case below) and keeps it after that | At most **5** to the Last Heap | As level 7, and the painter friend holding the clean mug |

**Level 8's two authored cases** (the seeded RNG picks one; the painter stands at the handover's place on the board):

| Case | Handover | Accepted plans, ordered vessels / up to swapping the three cups | A tempting plan and the limit it breaks |
| --- | --- | --- | --- |
| A | After lunch: "After lunch I'm painting. I need the big mug, clean, for my brush water." | 312 / 61 | The mug at all three picnics, washed after breakfast and lunch: 4 to the heap, but the mug is at supper after it was promised. Or the mug used at lunch and given unwashed (the lunch tub washes two cups instead): 4 to the heap, but the mug goes dirty |
| B | After breakfast: "After breakfast I'm painting…" | 93 / 19 | The mug used at breakfast and given unwashed, the tub washing two cups instead: under target, but the mug goes dirty. The simplest accepted way is never to use the mug at all |

**Why these targets.** An exact enumeration over the four vessels gives these results:
- Level 7's smallest possible heap is 2. The tub washes only two, so two of the eight drinks always come from a one-use cup.
- Level 8 without a promise can reach 4. The promise costs a wash slot or a vessel, so the smallest heap is 5 in both cases.

Each target is the minimum. It is reachable in several ways, and it cannot be met by ignoring a limit, because each tempting plan above beats it only by breaking one.

**Level 7's accepted plans** come to 24 when the vessels are told apart, and 3 when all four are treated alike. They differ by how many one-use cups go out at breakfast:
- **None.** All four washables at breakfast, two washed, two at lunch with two one-use.
- **One.** Three washables at breakfast, the clean fourth plus two washed at lunch with one one-use.
- **Two, "saving the good cups".** Two washables at breakfast, both washed, all four at lunch.

**Level 7's tempting plans** are close to these:
- Four one-use cups at breakfast to keep the good ones clean gives 4.
- One one-use at breakfast and only one cup washed gives 3.
- A used cup carried to lunch without the tub breaks the wash rule.

Every count is a rule-test fact the build re-derives with `schedules()`. It is never stored.

`BandLevels`: school `{ min: 4, max: 8 }`. The ladder appends 7–8 above 6, so no saved level moves. A school player reaches 7 through the ordinary step-up from 6, and a struggling 7 steps back to 6. Other bands are unchanged ([decision 1](#open-decisions)). The cart and the four sort places are **not on screen** at 7–8. Only cups are planned, so the new decision arrives without the old clutter.

### First rounds

**Level 7.** The four friends sit in the breakfast and lunch columns. The pet: "Plan the cups for the whole day. The tub washes two between picnics. Today's puzzle: send at most two to the Last Heap. Ring the bell when you're ready."
- She puts the red, blue and yellow cups and the mug at breakfast, then drags the red cup straight from breakfast to a lunch seat. She fills the rest of lunch with one-use cups and rings.
- One miss. The red cup wiggles at lunch and the pet says, "On our island, a used cup goes through the wash tub before anyone drinks from it again." She drags red into the tub, and its breakfast ring stays where it served.
- From the tub she drags red back to the lunch seat it left. She sends blue through the tub the same way, onto a lunch seat in place of a one-use cup, and rings.
- The heap has two in its outlines. Breakfast plays, the tub splashes, lunch plays, and the round finishes with misses 1, hints 0.

**Level 8, case A.** She puts all four washables at breakfast, washes the yellow cup and the mug after breakfast and after lunch, uses both at lunch and supper, fills the other seats with one-use cups (four on the heap), and rings.
- One miss. The painter: "The big mug is mine after lunch." She drags the mug from supper back into the lunch tub, so it is washed and kept out of supper. Its supper seat is empty now. She rings.
- That ring is free, because a seat is empty: "Every friend needs a cup first." She puts a one-use cup there, and the heap shows five, within its outlines. She rings.
- A second miss: the painter still has nothing ("After lunch I'm painting. I need the big mug, clean, for my brush water."). The glow comes on: the mug in the lunch tub and the painter, as the nearest accepted plan has it.
- She drops the washed mug on the painter and rings. The round finishes with misses 2, hints 1.

## The board and controls

The 1024×768 design area is the binding view, as at levels 5–6, since every view contains it. Portrait uses the same board in a larger view. Picnic Loop uses **its own drop pad**: `PICNIC_PAD = 16` around each target, and drops resolve by the nearest-target rule. The board has to fit up to 12 seats, so the levels 5–6 `DROP_PAD` of 30 would not fit at level 8.

Level 8 geometry, in design units:
- **Top row,** from x 126, clear of the 110×110 home corner, at y 20–140:
  - the three cups and the mug, 100×100 each, on a shelf;
  - the one-use stack, 100×100: dragging from it takes a new cup, and dropping one back on it returns it;
  - the bell, 120×120, at the right end.
  - Gaps are 24, and the row ends at about x 880.
- **Picnic headers** at y 160–204 show a sun low on the left, high or setting on the right. They are not targets.
- **The board,** from x 176, clear of the pet's 160×170 corner, at y 216–728. It has five columns of 104, with gaps of 32:
  - breakfast seats at 176;
  - tub 1 at 312;
  - lunch seats at 448;
  - tub 2 at 584;
  - supper seats at 720.
  - Each picnic column has four seats of 104×104 with gaps of 32 (y 216–728). Each seat is one friend, the same friend across a row, drawn sitting with a cup spot. Rows are friends, and columns are times.
  - Each tub column has two slots of 104×104, stacked in its middle (y 352–592), inside the drawn tub.
- **The right column,** x 856–1004:
  - at level 8, the painter, about 148×220, with a bubble of a brush in a mug, at y 216–436;
  - the Last Heap, 148×260, with its outlines, at y 468–728.
- **Level 7** drops the supper column and tub 2. It centres the remaining three board columns, and moves the heap up to the painter's place.

**Moving a cup is moving it through the day.** A washable cup has one token, which sits at the latest stop on its **route**. A route is a list of stops in time order: at most one seat per picnic, at most one slot per tub, and at level 8, for the mug only, the painter. Each earlier seat on the route keeps a **ring** in the cup's colour, so the seat shows as served. Rings are marks, not handles. The drop rules:
- **On a seat, tub slot or the painter:** the route keeps its stops before that time, drops any at or after it, and ends there.
  - Breakfast → tub → lunch is three drops of the same token.
  - Dragging a token back to an earlier time takes back its later trips.
- **On the shelf:** the route clears.
- **On an occupied seat or slot:** the two swap. The cup already there is cut back to its route before that stop: its token returns to its previous stop, or to the shelf, or a one-use cup goes back to the stack. A swap is free and never counted.
- **A one-use cup** has a single stop. It is placed from the stack and moved as itself, and it cannot serve twice by construction.

The tub's capacity is its two slots, so capacity is never a miss.

**The Last Heap counts live:** every one-use cup on a seat adds a ghost cup to it. She can see the target while she plans, and the bell checks the rest. Nothing judges a drop: each drop is a soft tick, and the target breathes.

**`picnicLayout`** gets a test like `planLayout`'s, at the existing five views and for levels 7 and 8:
- every target at least 100 units each way, and the bell at least 120;
- the top row clear of the home corner, and the board clear of the pet's corner;
- everything inside `view`;
- no two drop areas overlapping after `PICNIC_PAD`.

## Rules (`logic.ts`, new `picnic` section)

**A day** (`PicnicDay`) holds:
- the picnics (2 or 3) and the seats per picnic (4);
- the tubs (one between each pair of picnics, 2 slots each);
- the vessels (three cups and the mug);
- the target;
- at level 8, the promise: the mug, and the gap after which it is handed over (`after: 0` is after breakfast, `after: 1` is after lunch).

**A plan** (`PicnicPlan`) is what the board shows: per seat, the vessel serving it (a washable id, `oneUse`, or empty), and per tub slot, a washable id or empty, and the painter's holding. Its **schedule** is the per-washable route read from it: the picnics it serves, the tubs it is in, and whether it ends with the painter. The schedule is what the rules and help reason about. Seats within a picnic are interchangeable, since no friend prefers a cup.

**`checkPicnic(day, plan)`** returns the first unmet condition, in this order, or `ok`:
1. **`emptySeat`.** A friend has no cup. This is not a claim, like `onCart`. The cart bell rattles, the pet says "Every friend needs a cup first", and the empty seats wave.
2. **`unwashed(vessel, picnic)`.** A washable serves a picnic after an earlier one with no tub stop between. Earliest picnic first, then the vessel order red, blue, yellow, mug. The cup wiggles at that seat: "On our island, a used cup goes through the wash tub before anyone drinks from it again."
3. **`oneUseInTub`.** A one-use cup sits in a tub slot. "The tub can't wash a one-use cup. It goes to the Last Heap after one drink."
4. **Level 8: `promise`.** One of these:
   - something other than the mug is with the painter ("That's a cup. I asked for the big mug");
   - the mug serves a picnic after the handover ("The big mug is mine after lunch", or "after breakfast");
   - the mug reaches the painter used and unwashed ("The big mug needs a wash before I take it").
5. **Level 8: `unmet`.** The painter has no mug. The painter says the request again.
6. **`overTarget`.** The heap holds more than the target. The pet points to the outlines: "This plan sends more than two to the Last Heap. Can it send fewer?" There is a line per target, so it needs no number slot. Sending a cup to the heap is never called bad. The target is the day's puzzle.

Two cases are **accepted**:
- **A tub slot holding a clean, unused cup** (shelf → tub). Washing changes nothing; it only uses a slot.
- **A cup left on the shelf.**

`schedules()` enumerates without clean washes. Its counts are the canonical ones above, and the checker accepts by `checkPicnic` alone, never by comparing with a stored answer.

**`schedules(day)`** enumerates every accepted schedule. For each washable, every pattern of picnics served and tubs used that keeps the wash rule and the promise, with each picnic's washables at most 4 and each tub's at most 2, and the heap (seats minus washable drinks) at most the target. It also takes a `target` override, so the tests can prove each minimum by showing the enumeration is empty one below it.

## Accounting, help and finishing

**`PicnicTally`.** Generalise `PlanTally` so `ring` takes a check result and a plan signature, rather than adding a second class. Its rules are those of levels 5–6:
- **Never a miss:**
  - any drop, swap or return to the shelf or stack;
  - Start again;
  - a ring with an empty seat.
- **A miss:** a ring whose plan fails `checkPicnic`. One per ring, never one per wrong cup. The first unmet condition speaks, and the thing it is about wiggles where it is (it is not moved; the plan is hers).
- **Ringing again on an unchanged failed plan** repeats the line and counts nothing. The signature is the seat-and-slot map.
- **After two misses** the glow comes on: the thing the first unmet condition is about, and the move the nearest accepted schedule makes for it. It counts **one hint, once per round**.
- **Show a hint** turns on the same glow (the same once-per-round hint). Asked again, it is **Show me one**, one hint each.

**Show me one and the ghost finger** share `nextPicnicMove(day, plan)`:
1. Read her schedule.
2. Find the **nearest accepted schedule**: the fewest differing route stops, where a stop is a picnic served, a tub used or the handover, plus one per empty seat. Ties go to the vessel order (red, blue, yellow, mug) and then the earliest time.
3. Make **one drag** that fixes the first stop where her schedule and that one differ, in time order, then vessel order:
   - **Adding a stop** moves that vessel's token there. At a picnic it takes a seat held by a one-use cup, which goes back to the stack, or else the first empty seat. It never displaces a washable the nearest schedule keeps.
   - **Removing a stop** moves the token back to its previous stop, or to the shelf. The freed seat is empty, so the next fix may place a one-use cup.
   - **An empty seat the nearest schedule fills with a one-use cup** gets one from the stack.

Each move reduces the distance to the nearest accepted schedule by one. It never removes a stop that schedule keeps, and it never rings the bell; she does.

**Supported finish:** repeated Show me one reaches an accepted plan, and her ring then finishes, with every hint counted. One sticker, even with help.

**Finish:**
1. A successful ring disables the bell, so a repeated ring cannot finish twice.
2. The day plays through. Picnic by picnic, the friends sip in seat order, with a pentatonic clink each. After each picnic, used one-use cups hop onto the heap, and the tub's cups splash and come out shining.
3. At level 8, the painter takes the mug at the handover and later dips a brush in it.
4. The level 1–6 rise, then `ctx.finish({ misses, hints })` once.

There is no timer, score, star or "best plan" rating. Meeting the target with fewer cups on the heap is not praised over meeting it exactly. Nothing is saved.

**Start again** clears the board: every token goes back to the shelf and the one-use cups to the stack. It keeps the misses, hints and the counted-hint flag.

**Adaptation:** the ordinary rule. A zero-miss level 8 round is strong evidence she planned the washes across the day, and the grown-ups' card says so without claiming more.

## Code traps the build must handle

Read against the current `logic.ts`, `plan.ts` and `index.ts`:
1. **Dispatch.** `create()` picks `PlanShed` for every `plan.level > SORT_MAX`, and `planRoundFor` treats every level above 5 as level 6. Add `PLAN_MAX = 6` and a third scene, `PicnicShed` in a new `picnic.ts`, for `plan.level > PLAN_MAX`. Keep `planRoundFor` for 5–6 only, and add `picnicDayFor(level, rng)`.
2. **`PLANS`, `MAX_LEVEL`, `LEVELS.school`.** Append the two `Plan` rows. Their `open` and `count` are unused at 7–8: give them `open: []` and `count: 0`, or make the fields optional. Check that the level 1–4 `roundFor` callers never reach them. Change school's `max` from 6 to 8. `describeLevel` reads `planFor(level).name`, so it updates itself.
3. **`Spot` and `PlanMap` cannot express a schedule.** They map each thing to one spot. Leave them for 5–6, and give the picnic its own `PicnicPlan` and schedule types rather than widening `Spot`.
4. **Tally.** Generalise `PlanTally.ring` as above, so levels 5–6's accounting tests still pass unchanged.
5. **Drag handles.** Every token keeps its `draggable` handle wherever it sits. The one-use stack is a source: a drag from it creates a token and its handle. `destroy()` releases them all and untracks tokens removed early (returned to the stack).
6. **Ghost finger.** `TouchIntent`'s drags and `{ tap }` suffice: no change to `types.ts`.

## Rule tests (`logic.test.ts`, written when building)

- **Table:**
  - no level 1–6 round contains a vessel (500 seeds per level);
  - levels 1–6 invariants and the levels 5–6 accounting tests unchanged.
- **Enumeration:**
  - **Level 7:** `schedules` gives 24, and 3 up to swapping all four vessels. The minimum is 2: target 1 gives none.
  - **Level 8 case A:** 312 schedules, 61 up to swapping the three cups. Case B: 93, and 19.
  - **Level 8 without the promise:** the minimum is 4, so the promise costs one in each case. Each case's minimum is 5, so target 4 gives none.
- **Tempting plans fail exactly one limit, by name:**
  - level 7's four one-use cups at breakfast give `overTarget`;
  - level 7's cup carried without the tub gives `unwashed`;
  - case A's mug at all three picnics gives `promise`, with the heap at 4, under target;
  - case B's mug given unwashed gives `promise`, under target.
- **`checkPicnic`:**
  - the order of conditions and their tie-breaks;
  - a clean-wash slot and an unused cup accepted;
  - a one-use cup in a tub refused.
- **Routes:**
  - drop semantics: breakfast → tub → lunch keeps all three stops;
  - an earlier drop truncates the later stops;
  - a swap cuts back the displaced cup;
  - the shelf clears a route;
  - a one-use cup is never on two seats.
- **Accounting (scripted level 8 case A, as in the first round):**
  - the mug at every picnic, ring: miss 1 (`promise`);
  - the same plan, ring: still 1;
  - the mug back into the lunch tub, ring: free (`emptySeat`);
  - a one-use cup on that seat, ring: miss 2 (`unmet`), glow, hints 1;
  - Show a hint: still 1;
  - Show me one: hints 2, and it moves the mug to the painter and nothing else;
  - a ring then finishes, once;
  - a second successful ring does nothing.
- **Help leads somewhere:** from the empty board and from 200 random plans per case:
  - repeated `nextPicnicMove` reaches an accepted plan;
  - each move reduces the distance by at least 1;
  - no move removes a stop the nearest schedule keeps.
- **Layout:** the `picnicLayout` test above.
- **Registry, lands and how-to tests** pass with the new ranges.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `autotouch()` at levels 7–8 drags by `nextPicnicMove` from the current board until it is accepted, then taps the bell. The scripted play drives the same bot. Levels 1–6 keep theirs.
- **How-to card** (`howto.ts`):
  - the bell step's range grows to `{ from: 5, to: 8 }`;
  - new steps `{ from: 7, to: 8 }`:
    - "Give every friend a cup at every picnic."
    - "A used cup goes through the wash tub before it comes back. The tub washes two."
    - "One-use cups go to the Last Heap. Keep it within its outlines.";
  - `{ from: 8, to: 8 }`: "The painter needs the big mug, clean, at the time on the board.";
  - the notes' "moving things is free" range grows to 8;
  - a new note `{ from: 7, to: 8 }`: "The target is today's puzzle, not a rule about real rubbish."
- **Voice lines** (`voice.ts`, under `shed.picnic.*`), every rule line saying "on our island" and nothing written to read:
  - `instruct.7`, `instruct.8`;
  - `seats`, `wash`, `oneuse`;
  - `heap.2`, `heap.5`;
  - `paint.after0`, `paint.after1`, `paint.notmug`, `paint.later.after0`, `paint.later.after1`, `paint.dirty`, `paint.thanks`;
  - `done`.
- **Registration:**
  - `describeLevel` names 7 "Picnic Loop" and 8 "Three picnics";
  - skills already include planning;
  - region, land (Cozy Village), icon, sticker and music unchanged;
  - no save field.
- **Art** (`art.ts`, code-drawn): the cups, the mug, the one-use cup and its stack, the wash tub with two slots and suds, the Last Heap with its dashed outlines, the seat rings, the three sun headers, and the painter's bubble. Friends are existing critters.
- **Sounds:** clinks on pentatonic steps from `notes.ts`, a soft splash (filtered noise) for the tub, `sfx.bell`, `sfx.boing()` on a failed ring, and `sfx.tick()` on settles. No imported audio.
- **Co-play and off-screen:**
  - plan a real family picnic's cups together: count the people, the washable cups and when the washing-up happens;
  - the grown-up plays the dishwasher who can only wash two.
  - Nothing is checked or tracked.

## Check tier

The build is the **new-interaction tier**. The board, cup routes and tubs are new, even though the bell and accounting carry over:
- typecheck, and the rule tests above with the registry, lands and how-to tests;
- one scripted play, filtered, through the game's `browser-check.mjs` case:
  - level 7: the unwashed carry, a failed ring, an unchanged ring counting nothing, then the fix and the finish;
  - level 8: case A's first round as written, two misses, the glow, one Show me one, the finish;
- one portrait screenshot at level 8 with the board full;
- `fingerdemo` at 7 and 8;
- `npm run build`, since the voice and how-to files change.

Open for a person or device, not established by automation:
- whether a school child reads rows as friends and columns as picnics without being told;
- whether the route rings read as "this cup was already used";
- whether "save the good cups" is discovered;
- device speech of the new lines.

## Open decisions

Each has a default the build uses; none blocks it.
1. **School's range.** Default `{ min: 4, max: 8 }`. Alternative: keep school at `{ min: 4, max: 6 }` and give 7–8 to a later `school` sub-range, once the study's "top of school through 12" placement has players to read.
2. **The live heap count.** Default: live, so the target is visible while planning. Alternative: counted only at the bell, which is harder.
3. **Level 8's case choice.** Default: seeded, half each. Alternative: case B first (its simplest accepted plan, not using the mug, is easier), then A.
4. **The fourth vessel.** Default: the big mug. Alternative: a fourth cup in green, with level 8's promise moved to one of the cups.
5. **Clean washes.** Default: allowed and harmless. Alternative: the tub refuses a clean cup, floating it back.
