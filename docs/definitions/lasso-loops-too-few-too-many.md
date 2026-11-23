# Lasso Loops level 7: Too few, too many (definition)

**Built:** level 7 (PR #2010); nothing in this definition is unbuilt. Levels 8 and 9 are built (PR #2025, #2033); the next level to build is the dive's [“New levels on top”](../deep-dives/lasso-loops.md#new-levels-on-top) (none queued). Two as-built departures from “Layout (`lassoLayout`)” below: the shelf runs to `v.w - 40` in every orientation (not `v.w - 210` sideways), because at 768 wide four jars at `v.w - 210` were only 92 apart, narrower than a jar (the leaf is not out while the shelf shows); and sideways the five cards stand over the field's width only when the field is at least 5 × 130 wide, otherwise they span the view from 40 to `v.w - 40`, because over a 768-wide field they were 112 apart and their 130-unit touch areas overlapped. A sideways test in `upright.test.ts` covers 1024×768, 1662×768, 1366×1024 and 768×1024.

Defined 2026-11-22 on `claude/define-lasso-loops-7` ([PR #2004](https://github.com/rjdunlap/neo/pull/2004)). This is slice E2 of the [estimation study](../deep-dives/subjects/estimation.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/estimation.md#first-games-proposed-ladder-lasso-loops-6-and-7). It builds on level 6 *About how many?* ([definition](lasso-loops-about-how-many.md)), which is built. Built (see the line below).

**What it adds:** one new level at the end of `lasso-loops` (`src/games/lasso-loops/`), level 7 *Too few, too many*. She loops one jar of ten beside a shelf with room for three more jars. Five number cards come up, and she taps away every number that cannot be right: too few (a jar of ten is already full and fireflies are still out) or too many (more than four jars' worth). One card stays: a sensible guess. Then level 4's tens round checks it. Level 6 asks for a free guess; level 7 asks her to *rule guesses out* from evidence on the screen, which is the idea of a sensible range (CCSS MP3 and MP5, and the bounding side of K.CC.B.5 to 1.NBT).

- Levels 1–6 keep their IDs, pins, rules and seeded rounds. This adds no band, land, tile, save field, journal entry, creation slot, couch entry or asset.
- **Why now.** The study's decision 2 said to define level 7 only after a child had played level 6. The [decisions of 2026-11-17](../archive/DECISIONS-2026-11-17.md#games) replaced that wait: "Levels waiting on play" are defined now on each study's lean, Lasso Loops 7 among them. So decision 2 takes its lean here: tapping away a card that *could* be right is one miss, with a reason shown.
- **Level ID.** Level 7 was reserved for E2 by the [game dive](../deep-dives/lasso-loops.md#new-levels-on-top), which numbers its own levels from 8. Once this is built, the dive's levels 8–9 can be queued.

## Fixed here, against the study's table

- **"Impossible" is exact and readable from the screen.** The study's "the meadow holds fewer than three more jars" is replaced by a fixed **shelf**: the full jar plus **three empty jar outlines on every round**. Drawing the round's real jars as outlines would give away the count. So:
  - **too few:** a card of **10 or less** (one full jar is out and fireflies are still in the meadow);
  - **too many:** a card **above 40** (one jar plus three more is at most 40);
  - **could be right:** anything from 11 to 40. Exactly one card in that range is shown: level 6's near ten (20, 30 or 40).
- **Cards show numbers, not "about".** Ruling a card out is exact reasoning ("Can there be 10?"), so the lines for this level never say "about" for a card she taps away. The card that stays is called a sensible guess.
- **No free first guess.** Level 6 already has one. Level 7 opens with the benchmark jar, because every card's fate depends on it.
- **No close/more/fewer comparison at the end.** The card that stays is always within 5 of the count, so level 6's comparison would always say "close". The end line names the range instead.

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| preschool | `{ min: 1, max: 3 }` | unchanged |
| prek | `{ min: 2, max: 4 }` | unchanged |
| school | `{ min: 3, max: 6 }` | `{ min: 3, max: 7 }` (the new top; still plain `min..max`, no `order`) |

No saved level moves. A school player at 6 steps up to 7 after two smooth rounds; a grown-up can reach it with the how-to arrows.

## A round, step by step

`PLANS[6] = { mode: 'tens', range: true, name: 'Too few, too many: loop one jar of 10, tap away the numbers that cannot be right, then loop the tens and say the number' }`.

`LassoPlan` gains an optional `range?: boolean`, a flag on `tens` like level 6's `guess`, so `choices`, `countAloud`'s by-tens branch, the `intro()` switch and the tens rule tests apply unchanged. `makeRound` gives a `range` plan level 6's round (21–39 fireflies, 2 or 3 jars, 1–9 ones): the branch reads `if (plan.guess || plan.range)` and draws in the same order, so level 6's seeded rounds do not change. `planFor` already clamps to `PLANS.length`.

**Step a: the benchmark jar.** The fireflies scatter as on level 6. Only the **shelf** shows: the first jar, glowing, and three dotted jar outlines beside it (pictures, not targets; they never glow, fill or take a loop). `ctx.instruct('lasso.benchmark')`, level 6's line: *Loop ten fireflies for the first jar.* Looping is level 4's: a wrong-sized loop is a miss, two ring a group of ten (one hint, once per round), and the catch fills the jar.

**Step b: tap away.** When the jar holds ten, five **range cards** come up in ascending order. `ctx.instruct('lasso.range')`: *One jar holds ten, and there is room for three more jars. Some numbers can't be right. Tap them away!*

- A range card is level 6's wooden sign shape, made smaller so five fit: about 120 × 110 drawn, numeral 48, touch area `RANGE_HIT = { w: 130, h: 130 }` (over the 100-unit rule). Touch-down dips it and chimes, as level 6's cards do.
- **Too few, tapped:** the card shrinks away with a soft pop. `lasso.too-few` (`{g}`): *Not {g}! One jar already holds ten, and more fireflies are left.*
- **Too many, tapped:** the card shrinks away. `lasso.too-many` (`{g}`): *Not {g}! That needs more jars than the shelf holds.*
- **Could be right, tapped:** one miss. The card stays, wobbles with the shared boing, and the full jar and the three outlines bounce once. `lasso.could-be` (`{g}`): *{g} could be right! It's more than one jar and fits on the shelf.*
- After **two** such misses the cards still to go glow (`lasso.range-hint`: *The glowing numbers can't be right.*). That is one hint, once per round.
- Loops are off while cards show, as on level 6 (`down()` already returns while `guessCards` is non-empty).

**Step c: the sensible guess.** When only the near card is left, it flies to level 6's guess sign by itself. `lasso.sensible` (`{g}`): *Only {g} is left. That's a sensible guess! Let's check.* The outlines fade, the full jar moves from its shelf spot to its round spot, the round's other jars appear, and `ctx.instruct('lasso.tens')` (level 4's line) is said.

**Step d: the check.** Level 4's round, unchanged: loop the remaining jars, the ones fly to the leaf, three purple pads ask `lasso.total`, a wrong pad is counted aloud by tens, and two wrongs glow the right pad. No pad is marked for the sign's number.

**Step e: the range line.** After `lasso.right`, the jars and the sign bounce together. `lasso.range-end` (`{n}`, `{g}`): *{n} fireflies: more than ten, and not more than forty. {g} was sensible!* Then the existing `finale()`. Nothing about the cards is saved.

**What she decides:** which numbers the jar and the shelf rule out, then level 4's loops and count.

## Range cards (`logic.ts`)

`rangeCards(n: number, rng: Rng): { cards: number[]; possible: number }`, used only when `plan.range`, drawn after `makeRound`:

- **Possible:** `near = 10 * Math.floor((n + 5) / 10)` (20, 30 or 40 for 21–39; the same rule as `guessCards`).
- **Too few:** one or both of {5, 10}; **too many:** the rest from {50, 60, 70, 80, 90}. A seeded `rng.int(1, 2)` sets how many low cards; the high cards are a seeded pick of `4 − low`. Always five distinct cards, at least one on each side.
- `cards` is ascending, which is the left-to-right layout. The possible card is therefore the second or third card, so its place does not give it away.
- `rangeSide(g: number): 'few' | 'many' | 'possible'` is `few` for `g ≤ 10`, `many` for `g > 40`, else `possible`. The scene and the bot read only this.

## Layout (`lassoLayout`)

`lassoLayout` gains, for a `range` round, `shelf: Point[]` (four jar feet: the benchmark jar and three outlines) and `rangeCards: Point[]` (five card middles). The field is computed as for level 6 (pass the same flag), so the fireflies do not move between steps.

- **Upright:** the shelf is `row(4, 190, v.w - 40, 140)` on the jar line (four fit: 134 apart at 768 wide, wider than `JAR_W` 108). The cards stand in level 6's keep-or-change row above it, `row(5, 40, v.w - 40, 170)` at level 6's `reviseY` (about 138 apart at 768 wide, wider than the 130 touch area).
- **Sideways:** a phone held sideways is 1366–1660 units wide and 768 tall, and the field cannot lose another card row. The shelf is `row(4, 190, v.w - 210, 140)` on the jar line, and the cards stand over the field at the answer pads' height, `row(5, field.x, field.x + field.w, 180)`, on a soft dusk band so they read as a layer above the meadow. Loops are off while they show, and most fireflies stay in sight around them.
- The upright test (`upright.test.ts`) adds level 7's shelf and card spots on every upright view (cards apart from each other, from the shelf and from the guide corner; shelf jars apart and in view). The sideways test adds 1024 × 768 and a 1662 × 768 phone: cards at least 130 apart and inside the field's width, shelf jars apart. If a view fails, the build changes the arrangement and records why, not the touch area.

## Misses, hints and glow

| Event | Count | Response |
| --- | --- | --- |
| Tap a too-few or too-many card | Free | The card leaves; the reason is said |
| Tap the possible card | 1 miss | It stays; `lasso.could-be`; two of these glow the remaining impossible cards (1 hint, once per round) |
| Wrong-sized loop | 1 miss | Level 4's; two in a row ring a group of ten (1 hint, once per round) |
| Loop around nothing | Free | `lasso.empty` |
| Wrong count pad | 1 miss | Counted by tens; two wrongs glow the right pad |

The scene keeps a separate `rangeMisses` counter for the tap-away step. The loop counter `wrongs` and its ring-a-group hint stay as they are, so a range miss can never trigger a loop hint. Adaptation is unchanged: a smooth round has at most one miss and no hint; a struggling one has four misses or two hints.

## The bot (`autotouch`)

- While range cards show, tap the lowest card whose `rangeSide` is not `possible`. It never taps the possible card.
- Otherwise use level 4's route: `demoLoop` for each jar, then the right pad.

Four taps add a few seconds to level 4's demonstration, inside the finger-demo limit.

## Voice lines (`voice.ts`)

New IDs: `lasso.range` (`ctx.instruct`); `lasso.too-few`, `lasso.too-many`, `lasso.could-be` (each `{g}`), `lasso.range-hint`, `lasso.sensible` (`{g}`) and `lasso.range-end` (`{n}`, `{g}`) (`ctx.say`). Seven lines, wording as above; `lasso.benchmark` and `lasso.tens` are reused. The two slot-free lines (`lasso.range`, `lasso.range-hint`) need Kokoro clips rendered with `scripts/voice-clips/clips.mjs` or marked as falling back, so the clip test stays green; the slotted ones stay on device speech.

## How-to card (`howto.ts`)

Three level-7 steps, inside the four-step limit with the universal loop step:

- `{ from: 7, to: 7, text: 'Loop ten fireflies for the first jar. The shelf has room for three more jars.' }`
- `{ from: 7, to: 7, text: 'Tap away the numbers that cannot be right: too few or too many. One sensible number stays.' }`
- `{ from: 7, to: 7, text: 'Loop the rest ten at a time and say how many in all.' }`

`describeLevel(7)` is the plan name above. `skills` already has `'estimating'`. The study's E6 co-play tip (say a surely-too-low and a surely-too-high guess first) fits this level as a co-play line if E6 is built; it is not part of this slice.

## Rule tests (`logic.test.ts`)

1. **Unchanged rounds.** For fixed seeds, `makeRound` and `choices` for levels 1–6 give the same results as before. `PLANS[6]` has `mode: 'tens'`, `range: true` and no `guess`; the "every plan" test runs the tens assertions on it. Over 300 seeds, level 7's fireflies are 21–39 with 2 or 3 jars and 1–9 ones.
2. **Range cards.** For every `n` in 21–39 and 50 seeds each: five distinct cards in ascending order; exactly one is `possible`, and it equals the near ten and is within 5 of `n`; at least one card is `few` and at least one `many`; every `few` card is in {5, 10} and every `many` card in {50, …, 90}. Over the seeds, the possible card is sometimes second and sometimes third.
3. **The shelf rule is true.** For every `n` in 21–39, `10 < n ≤ 40`, so no card ruled out is ever the count's ten, and the possible card's side is `possible`.
4. **Bands.** `rangeFor(LEVELS, 'school')` is `{ min: 3, max: 7 }`; preschool and pre-K are unchanged.
5. **Layout.** As above, in `upright.test.ts`.

## Build and check tier

New level on an existing interaction (the tap is level 6's card tap). Checks:

- `npm run typecheck`; Lasso Loops rule and layout tests, `howto.test.ts`, the voice clip test.
- One filtered browser play (`BROWSER_SUITE=shortlist SHORTLIST_ONLY=lasso`) extended to level 7 in portrait: loop the benchmark; tap the possible card once (a miss; it stays); tap the impossible cards; finish the loops; tap the right pad. Assert the score is `[1, 0]` and that the sign shows the near ten.
- `fingerdemo` filtered to `lasso-loops` at level 7.
- One portrait screenshot of the tap-away step.

`npm run build` only if shared files change; they should not.

## Open decisions

None block the build. Decision 1 (school window) takes its lean, 3–7. Decision 2 takes its lean as the 2026-11-17 record directs. There is no review gate: the content is invented fireflies and numbers.
