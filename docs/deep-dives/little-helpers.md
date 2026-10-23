# Little Helpers deep dive

*ID `little-helpers` · bands lap, toddler, preschool, pre-K, school · levels 1–6 on 2026-10-17 · session `claude/dive-little-helpers` ([PR #546](https://github.com/rjdunlap/neo/pull/546))*

## The game today

A fruit drops onto the meadow; tapping it sends the nearest of seven leaf-topped helpers running to hold it. Bigger fruit needs more helpers. When the team is right the fruit is lifted ("Heave ho!") and carried to a basket, the helpers walk home and the next fruit drops. After Pikmin's carrying rule. The learning purpose is one-to-one correspondence and cardinality at the bottom (one tap, one helper, the last number said is how many), then exact quantity from dots or a numeral, counting on, and equal groups at the top. Code: `src/games/little-helpers/` (`logic.ts` for plans, fruit generation, `tryLift` and the bot's `helperTouch`; `index.ts` for the scene). Its land is Counting Cove. It has no couch entry and no story step.

| Level | Plan (`PLANS`, by array position) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `tap`: 5 fruits, each needs 1 | lap 1–2, toddler 1–2 | Nothing to judge: tap the fruit, one helper carries it |
| 2 | `two`: 4 fruits, need 1–2, rings that fill (no 1, 2, 1, 2 swap) | lap, toddler, preschool | Keep tapping until the fruit lifts by itself; it cannot be wrong |
| 3 | `count`: 4 fruits, need 2–4, dots, whistle | preschool, pre-K | How many to send before blowing the whistle; too few strain, extras walk back |
| 4 | `numeral`: 4 fruits, need 2–5, a numeral | preschool, pre-K | The same, from a written number |
| 5 | `more`: 4 fruits, need 3–6, 1 to need−1 already holding, empty rings are the gap | pre-K, school | Send the rest (a short whistle names the gap; the pet counts on) |
| 6 | `groups`: 4 bunches from 2×2, 3×2, 2×3, each once first | pre-K, school | The total for a bunch of same-size fruits; teams line up under each fruit |
| 9 | `whistle`: 4 things, need 1–3, rings fill | toddler order 1, 2, 9; preschool order 2, 9, 3, 4 | Blow the whistle when every ring is full; an early whistle or an extra helper is free, never a miss |

**Content pools.** Fruits (`FRUIT_FOR`: apple, orange, lemon, pear, grapes) plus a pumpkin, watermelon, acorn, pinecone, blueberries and toy boat, each with a need range (`CARRY_NEEDS`). A seeded place per round (`dressRound`): orchard (basket), beach (rowing boat) or woods (bucket), each with its own scenery. Seven helpers in seven colours. Plans are keyed by level (`planFor`); badge rings fill as helpers arrive.

**Accounting.** Levels 1–2 and 9 have no misses. From 3, a whistle with too few or too many is a miss (`boing`, a spoken line naming the need; at 6 a skip count, "Count by 2: 2, 4, 6"); two misses on one fruit draw yellow rings where the team should stand (one hint per fruit). Tapping a holding helper sends it home freely (except helpers who were already there at 5). Spoken support: the pet counts each arrival (`count` with the new total, so level 5 counts on), and each bunch ends "3 groups of 2 make 6".

**Bot.** `autotouch()` taps the fruit (the middle fruit of a bunch) until `helperTouch` says the team is complete, then taps the whistle. A rule test walks every seeded fruit at every level with it.

**Known gaps found reading the code.** Gaps 1, 6 and 7 are fixed (slice 1), 3, 4, 5, 8 and 10 (batch 1, slices 2, 3 and 5; all built); 2, 9 (the double-tap part), 11 and 12 stay open.

1. **Many touches get no answer at the lap and toddler levels.** `send()` returns while `busy`, which covers the fruit's drop-in, the whole lift and carry (about three seconds) and the praise line; taps on the sky and grass have no listener; a tap on a waiting helper reaches `recall()`, which needs `slot >= 0`, so nothing happens. At level 1 a one-year-old's taps between fruits are mostly silent.
2. **Level 6 asks for a total, not groups.** Every tap on the bunch fills the next slot, and `slotAt()` assigns teams by index, so the teams are always equal by construction; she can never make an unequal team, and the ghost finger's choice of fruit means nothing. The equal-groups claim lives in the drawing, not in her action.
3. **Level 5 never asks "how many more" as a number.** The badge shows the total need, not the gap, so counting all from one works as well as counting on; nothing marks which places are still empty.
4. **The dots never fill.** The badge is a static picture of the need; arriving helpers do not light a dot, which is the cheapest one-to-one cue there is (Pikmin's carrying/needed counter does exactly this).
5. **Predictable needs at level 2.** `makeFruits` redraws a need equal to the previous one; with a range of 1–2 that makes every level 2 round alternate 1, 2, 1, 2.
6. **Only one fruit of a bunch reaches the basket.** `lift()` moves `children[0]` into the pile; the other fruits of a bunch vanish when the next fruit clears `fruitNode`.
7. **An empty crowd sounds like a mistake.** *Fixed (slice 1):* with all seven sent, a fruit tap makes the helpers shrug and the pet say `helpers.busy`; it was a `boing`, the same sound as a wrong whistle.
8. **The 2→3 step changes three things at once:** the whistle appears, extras become misses, and the range widens to 4.
9. **Accounting edge cases (decisions, not defects):** a whistle with no helpers at all counted as a miss (now a nudge, `helpers.whistle.empty`, decision 2's default, built in slice 1); quick double taps at level 2 can send one more than needed and the fruit still lifts.
10. **Plans are indexed by array position.** `planFor()` clamps any unknown level to 6, so a level placed by `order` needs the plans keyed by ID first.
11. **Helper hit areas overlap.** Each helper's hit circle has radius 50, at 58-unit spacing in the carrying row and 62 in the crowd, so which helper a recall tap reaches depends on draw order. Harmless while helpers are interchangeable; it matters once a team means something (level 6 teams she builds, two fruits at 7), so nearest-helper resolution comes with those slices.
12. **Pet-corner clearance is unchecked.** The waiting crowd stands at x 190–420, y `h − 210` and `h − 120`; check it in a portrait screenshot when a slice touches the layout (no assertion exists).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Pikmin series ([Carry](https://www.pikminwiki.com/Carry), [Lift](https://www.pikminwiki.com/Lift), Pikmin Wiki; opened) | Real-time strategy, carrying | Heavier objects need more strength; a two-number counter shows carriers and weight (fraction-like from Pikmin 3); too few "stand in place and periodically try to pull"; a carrier cap of about twice the weight (that extras go faster is recalled, not on the page); Purple Pikmin count 10 | The counter that fills as they grab on; the strain when short; stronger helpers counting as more than one | Day timer, losses, combat; extras being *welcome* (here extras are the exact-count lesson, so they walk back gently) |
| Pikmin Bloom expeditions (search summary of the Pikmin Wiki) | Walking app | Rock Pikmin carry 3, Purple 5: composing a weight from mixed strengths | A strong helper who counts as two | Steps, stamina, purchases |
| Hi Ho! Cherry-O ([Wikipedia](https://en.wikipedia.org/wiki/Hi_Ho!_Cherry-O); opened) | Board game, 3+ | Spin 1–4 cherries from tree to basket; a dog, bird or spilled basket puts cherries back | The fruit-to-basket picture and counting each piece in | The spinner's luck and the spill that takes progress away |
| Count Your Chickens (Peaceable Kingdom; search summary of retailer and review pages) | Cooperative board game, 3+ | Gather 40 chicks to the coop together; a fox sends one back; reviewers say the ceiling is low | Cooperation: everyone helps carry, nobody loses | The fox setback; the low ceiling is the warning for a ladder that stops at counting |
| Montessori spindle box (search summary of Montessori blogs and a state alignment) | Physical material | Bundle the right number of spindles into compartments 0–9; the empty 0 compartment teaches zero | Bundling a counted group into its place; a compartment that is visibly full | A fixed 45-piece check; worksheets |
| Lemmings ([Wikipedia](https://en.wikipedia.org/wiki/Lemmings_(video_game)); opened) | Puzzle | A fixed allotment of each skill to assign; save a quota; Fun → Mayhem tiers | Assigning a limited crowd to jobs, so splitting the crowd is the decision | Countdown timer, lemmings lost |
| Moose Math, Duck Duck Moose ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/moose-math-by-duck-duck-moose); opened; the Horn Book review was a search summary, its page refused) | Touch app, 3–7 | Juice recipes as addition, later removing extras; dot-to-dot by 1s, 2s, 5s, 10s; each level unlocks a town feature | Removing extras as a later step; a permanent, chosen town item for playing (matches the rework) | Reports framed as mastery from assisted play |
| Numberblocks World (App Store listing; search summary) | Touch app | Counting by 1s, then 2s, 5s and 10s; subitising games | Counting by a team size, seeing a group at a glance | Subscription, trial |
| Khan Academy Kids (Khan Academy blog; search summary) | Touch app | Tap-to-count each scoop for one-to-one | Tap one, hear the number, see it light | — |

**Learning references (opened, [Common Core](https://www.thecorestandards.org/Math/Content/K/OA/)).** K.OA.A.3: "Decompose numbers less than or equal to 10 into pairs in more than one way, e.g., by using objects or drawings". K.OA.A.4: "For any number from 1 to 9, find the number that makes 10 when added to the given number". [3.OA.A.1](https://www.thecorestandards.org/Math/Content/3/OA/): "interpret 5 × 7 as the total number of objects in 5 groups of 7 objects each"; 3.OA.A.2: a quotient as "the number of objects in each share" when partitioned equally. K.CC.B.4 (one-to-one pairing, the last number names the count) is from secondary reproductions (search summary). The roadmap's [elementary horizon](../ROADMAP.md#later-horizons-elementary) for this family is "compose and decompose small totals; explain how many more are needed"; [IDEAS](../IDEAS.md) adds "split a visible group two ways".

## What makes sense here

The [short-ladder audit](../archive/IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md#short-ladder-audit-2026-10-09) left this game alone ("equal groups is the right end"), because remainders belong to Monster Munch and Lasso Loops and rows and columns to Orchard Rows. This dive keeps those boundaries and still proposes levels, as the Teddy Doctor dive did, because the documented horizon (compose, decompose, how many more) is exactly what a crowd of helpers models and nothing else on the island does it with a team you split yourself:

- **Fix what the top claims first.** Level 6 should be teams she builds (gap 2) and level 5 should show the empty places (gap 3) before anything is stacked on them.
- **Decompose with the crowd.** Two fruits and exactly enough helpers for both: every helper goes, so "nobody left, nobody short" checks itself (K.OA.A.3, IDEAS' "split a visible group two ways").
- **Make ten** (K.OA.A.4) is already Duck Pond's level 10 ("How many more to make 10?", answered on lily pads). Here she would assemble the missing part from bodies instead of picking a numeral, which is a thin difference, so it waits on a decision rather than going to Ready.
- **What 7 adds over the arithmetic games.** Duck Pond's *hiding ducks* and Bubble Pop's pairs to ten ask her to name a missing part; at 7 she *makes* both parts herself from one visible crowd, and the empty crowd is the check.
- **Compose with a strong helper.** After Pikmin Bloom's strengths: a big helper counts as two, so 6 can be three bigs, two bigs and two smalls, and so on. Several right answers, the pet counting "2, 4, 5, 6". This is close to Fruit Sums' "two different ways", but there the parts are numerals; here they are bodies, counted by twos and ones, which is the bridge to skip counting.
- **Partition without remainders** (3.OA.A.2) is a natural next step, but it reaches into the division that Monster Munch and Pet Kitchen share; it waits on a decision.
- **Younger.** The lap level is already right in kind; it needs every touch to answer (gap 1). The real younger gap is the toddler-to-preschool step (gap 8), so an easier whistle level sits between 2 and 3.

**Long-term arc:** one tap, one helper (lap) → keep sending until it lifts (lap and toddler) → the whistle means "done" with dots that fill (toddler/preschool) → exactly *n* from dots, then a numeral (preschool) → counting on to *n* (pre-K) → equal teams she builds, two fruits from one crowd (pre-K/school) → strong helpers (school) → make ten and sharing a crowd equally (school, gated).

**Rework fit (proposals, gated on RW05+).** The helpers are the obvious place for collected creatures to appear: a favourite creature joining the crowd as a helper (always one strength, never a shortcut), a strong helper as a creature's *useful talent* (RW11), and what was carried filling a project's store (a picnic basket, a harbour dock load) as a visible result. Carried fruit is never a currency, never spent and never lost. Nothing here builds before the collection and project items land.

## Experience and presentation

- **First unsupported action:** tap the fruit; a helper runs over and the fruit is carried home. At level 2 she keeps tapping until it lifts, which needs no instruction beyond the first.
- **What makes it pleasurable:** the scramble of a little body running to the fruit, the strain-and-heave, and the fruit swinging into a basket that fills. Each arrival is a pentatonic pop rising with the count (`sfx.pop(5 + n)`), so a full team is a little rising tune.
- **Touch-down and consequence:** every tap should answer (slice 1): during a carry, a tap makes a waiting helper hop and chirp; on the grass a helper waves; with nobody left, the crowd shrugs and the pet says everyone is busy, not a boing. A wrong whistle shows why on the spot: short, the empty dots and places blink while the team strains; too many, the extras' dots appear outside the badge before they walk back.
- **Code-drawn example:** a badge of hollow rings that fill green as each helper grabs on (the spindle-box compartment, the Pikmin counter), and at 9 a ten-frame of two rows of five. A watermelon or pumpkin drawn with `Graphics` for the heavy needs.
- **Variety without changing the rule:** what is carried (fruit, pumpkins, a watermelon, acorns and pinecones, a toy boat), where (orchard, beach, woods backdrops, after the 2026-10-16 habitat-kits decision that scenery varies), helper leaf-tops, and seeded needs that do not alternate.
- **Reasoning versus memory and motor:** the targets are big (a fruit's hit circle is 76–156 units; helpers 100 across); nothing is timed or moving. The thinking is how many; nothing must be remembered once the badge is shown.
- **Supported ending and replay:** two misses draw the rings where the team stands; a round always ends with every fruit in the basket and the finale line. The full basket at the end is the stopping picture.
- **Co-play:** one person taps, the other counts aloud and calls "heave ho!" (the existing tip). At 8, each person can send the team for one of the two fruits.
- **Needs a person or device:** whether a one-year-old notices that her tap sent the helper (the run takes 0.35 s); whether rapid counting speech stays clear when she taps fast; whether the whistle reads as "go" without the spoken line; whether a ten-helper crowd is still easy to tap on an iPad held upright.

## Proposed ladder

### Fresh content inside existing levels

- **Fill-as-they-arrive badge (levels 2–6).** Hollow rings fill as each helper grabs on; at 5 the helpers already holding are filled when the fruit lands, so the empty rings *are* "how many more", and at 4 a row of small rings under the numeral fills too. Extras show as rings outside the frame. The spoken short line at 5 names the gap ("4 are here. It needs 6. Two more!").
- **Needs that do not alternate.** Draw from a seeded shuffle of the range (each value once before repeats, no repeat across the join) so level 2 is not 1, 2, 1, 2; test the property.
- **Things to carry.** Add code-drawn pumpkin, watermelon, acorn, pinecone and a toy boat beside the five fruits, the heavier needs drawing the bigger things; three seeded backdrops (orchard, beach, woods) with a basket, a bucket or a boat as the destination. The whole bunch reaches the basket at 6.
- **Level 6 teams she builds.** Tapping a fruit in a bunch sends a helper to *that* fruit's team; a full fruit's team does not take another (a hop and "this one has 2"). The whistle lifts only when every team is the asked size; an uneven bunch tips toward the light fruit and the short team strains, and the line names it ("This one has 1. Each needs 2."). The plan, its bunches and the "groups of" lines stay; only the action becomes the decision. The bot taps the fruit with the fewest helpers.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Everyone helps** | pre-K top, school | A crowd of 5 and two fruits needing 2 and 3; tap a fruit to send a helper to it, then the whistle lifts both | How to split the crowd between two fruits; when every helper is holding and both are right, nobody is left | Whistle with one fruit short or over: that fruit strains or its extra walks back; a miss; two misses ring both teams' places. Crowds 4–7, pairs seeded so the same total comes back split another way | Every pair sums to the crowd; over a round at least two different splits of one total appear; the bot sends each fruit's need and the crowd is empty at the whistle | Two fruit spots in one layout (pet clearance); voice lines for the split ("2 and 3 make 5"); bot routing per fruit |
| 8 | **Strong helpers** | school | A fruit needing 6; the crowd has four small helpers and three big ones wearing a "2" leaf | Any mix that makes the need: bigs count two, smalls one; the pet counts "2, 4, 5, 6" | Wrong total at the whistle: strain or extras, as now; a miss; two misses ring one valid team. Every exact mix is right | Every need 4–8 has at least two valid mixes within the crowd; the bot's mix is exact; the counting line follows the order sent | A big helper drawing; strength-aware `tryLift`; ten seconds of new voice; overlap note with Fruit Sums (parts as bodies here, numerals there) |

The pre-K window would become 3–7 with level 7 at its top; school 5–8.

**Gated levels (no number until decided):**

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | **Make ten** (gated: overlaps Duck Pond 10) | school | A watermelon needing 10, with 1–9 already holding (6 at first) and a waiting crowd of the gap plus two, so sending everyone is never the answer; a ten-frame badge | How many more make ten | Short or over at the whistle; a miss; the line names the pair ("6 and 4 make 10"); two misses ring the empty places | Every starting count is 1–9, each different within a round; the waiting crowd always exceeds the gap; the bot sends exactly 10 − start | Up to eleven helpers on screen need nearest-helper resolution for recall taps (their 100-unit circles overlap at 62 spacing); a ten-frame badge; portrait layout check |
| — | **Share the crowd** (gated) | school | Six helpers and two (or three) same-size fruits whose need is hidden; send everyone so every fruit has the same team | The size of each share | Unequal teams tip as at 6; a miss; never a remainder (crowds are always a multiple) | Crowds divide evenly; the bot's shares are equal | Decision: division ownership with Monster Munch and Pet Kitchen, and overriding the audit's "leave" this far |


### Younger-band openings

Level 1 is already the right lap rung in kind; it needs answers (slice 1): a touch anywhere sends the next helper to the fruit, a touch during a carry makes a waiting helper hop and squeak, and taps on the grass make a helper wave. Five fruits stay the round.

**A second lap rung: open level 2 to lap** (lap window 1–2, the default the build uses; decision 3). Level 2 cannot be wrong, needs one or two helpers and lifts by itself, so once every touch sends a helper (slice 1) and the rings fill as they arrive (slice 2) it is the lap's first "keep going until it's done": two taps, two rings, heave ho. It moves in slice 2. Toddler keeps 1–2 and gains 9.

### Easier entries and levels between existing ones

| Level | Name | Band window and order | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | **Whistle when it's full** | toddler `order: [1, 2, 9]`; preschool `order: [2, 9, 3, 4]` | A fruit needing 2 with two hollow rings; each helper fills a ring; when both are full the whistle wiggles | When to blow: the rings say when | No misses (default for the build): a whistle early strains and the empty rings blink; a helper past full bounces off and walks back | Needs 1–3, never alternating; `helperTouch` with the rings; the round always finishes | Needs plans keyed by ID (gap 10) and the fill badge; no `entryLevels` (neither band starts on it) |

This separates the whistle from exactness (gap 8): at 9 the whistle means "done" and nothing counts against her; at 3 extras and early whistles start to count.

### Left out on purpose

- **Remainders** (helpers left over who cannot make a team): Monster Munch and Lasso Loops own them; IDEAS keeps "remainders as friends to redistribute" for 8–10.
- **Rows and columns of helpers as arrays:** Orchard Rows.
- **Speed for extra helpers** (Pikmin's faster carry, recalled), a day clock, enemies, losses, a fox or spill that undoes work.
- **Crowds past ten** at once: clutter; bigger numbers go to strong helpers or a different game.
- **A couch version:** no reason yet; carrying is a solo touch action.

## Decisions for the developer

**Decided 2026-10-23 (on the developer's delegation):** the leans are adopted and the built defaults kept: *Share the crowd* waits until levels 7–8 have been played (a device check) and *Make ten* stays with Duck Pond; level 9 counts no misses, a whistle with no helpers is a nudge, quick double taps keep lifting; windows lap 1–2, level 7 in pre-K 3–7, level 8 school only; rework hooks wait on RW05 and RW11, never fruit as a currency.

1. **The gated levels.** *Share the crowd*: build partition without remainders here, or leave sharing to Monster Munch and Pet Kitchen (lean: wait until levels 7–8 have been played). *Make ten*: build it beside Duck Pond's level 10, or leave make-ten there (lean: leave it there).
2. **Accounting defaults the build uses:** level 9 counts no misses; a whistle with no helpers at 3–9 is not a miss (only a nudge), since nothing was tried; quick double taps at 2 keep lifting.
3. **Windows (defaults the build uses):** lap 1–2 (level 2 opened to lap); level 7 in pre-K 3–7; level 8 school only.
4. **Rework hooks (wait on RW05 and RW11):** a collected creature joining the crowd, a strong helper as a creature talent, what was carried filling a project store; never fruit as a currency.

## Build slices, in order

**Routine batching (developer, 2026-10-21):** the numbered slices below are scope/dependency substeps. [READY](../READY.md) dispatches related substeps together using the [`little-helpers` batch plans](../GAME-BATCHES.md#batch-plans): one declared batch per worker/PR, prerequisite substeps first, with existing gates and special checks preserved. Do not create a new session for each numbered level in a claimed batch.

1. **Built (2026-10-21): Every touch answers and the empty crowd shrugs** (existing-game bug fix tier: typecheck, rule tests, one filtered regression play, `fingerdemo` at level 1): level 1 whole-screen send, hop/squeak on taps while busy, grass wave, the no-helpers shrug instead of `boing`, a zero-helper whistle as a nudge (decision 2's default), the whole bunch into the basket. Gaps 1, 6, 7. Built: a full-screen `field` layer sends a helper at level 1; while busy any touch hops and squeaks the nearest helper; at levels 2–6 a sky or grass tap makes the nearest waiting helper wave; a fruit tap with no helpers left shrugs and says `helpers.busy`; a zero-helper whistle is a nudge, not a miss (`fieldTouch`, `whistleFor`/`whistleMisses`, `pileSpot`, `BASKET_HALF` in `logic.ts`, three rule tests); every fruit of a bunch lands in the basket. How-to step and notes updated. Still open: whether a one-year-old notices the hop and wave, and whether the shrug reads (device check).
2. **Built (2026-10-22, [PR #804](https://github.com/rjdunlap/neo/pull/804), batch 1): The badge fills, needs vary, and level 2 opens to lap** (existing-game change, rule tests, one screenshot, `fingerdemo` at 2): fill-as-they-arrive rings at 2–6, the gap named at 5, extras outside the frame, seeded non-alternating needs, lap window 1–2. Gaps 3, 4, 5.
3. **Built (2026-10-22, PR #804, batch 1): Things to carry and three places** (content tier: rule tests, one screenshot per backdrop): pumpkin, watermelon, acorn, pinecone, toy boat; orchard, beach and woods with their destinations.
4. **Level 6 teams she builds** (existing-game change on a changed interaction: nearest-helper taps, rule tests, one filtered play at 6, `fingerdemo` at 6, how-to step update). Gaps 2, 11.
5. **Built (2026-10-22, PR #804, batch 1): Level 9 Whistle when it's full** (new level; after slice 2: plans keyed by ID, `order` for toddler and preschool, rule tests, a level-9 play, `fingerdemo` at 9, how-to and voice). Gaps 8, 10.
6. **Level 7 Everyone helps** (new interaction: two fruit spots, a crowd size per plan (the existing test's one-spare rule becomes per plan), rule tests, one scripted play first and last level with a wrong whistle and a hint, portrait screenshot, `fingerdemo`).
7. **Level 8 Strong helpers** (new interaction: strength-aware lift, big helper art, rule tests, scripted play, `fingerdemo`).

Gated: *Make ten* and *Share the crowd* (decision 1) and the rework hooks (decision 4).

## What was built in this session

Batch 1 (slices 2, 3, 5) is built in PR #804 (see the [build note](../archive/COMPLETED-2026-10-09.md#little-helpers-batch-1-rings-that-fill-things-to-carry-and-the-full-team-whistle-2026-10-22)); the dive itself was research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
