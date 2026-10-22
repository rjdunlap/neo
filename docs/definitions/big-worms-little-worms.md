# Inchworm Measure level 7: Big worms, little worms (definition)

Defined 2026-10-22 on `claude/define-big-worms` ([PR #767](https://github.com/rjdunlap/neo/pull/767)), slice M1 of the [measurement and units study](../deep-dives/subjects/measurement-units.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/measurement-units.md#first-games-proposed-ladder-big-worms-little-worms-inchworm-measure). Docs only; nothing is implemented. The build is M2, queued as an [implementation batch](../GAME-BATCHES.md#inchworm-1-big-worms-little-worms).

**What it adds:** one appended level of `inchworm` (`src/games/inchworm/`), level 7 *Big worms, little worms*: she measures the same stick twice, first with big worms and then with little ones, and says which count the little (or big) worms made. Smaller unit, bigger count; the stick did not change (2.MD.A.2).

- Levels 1–6, their IDs, pins and rules do not change. No band, land, tile, save field, journal entry, creation slot or couch entry is added.
- **Reconciling with Inchworm's own game dive.** The `inchworm` row in the [deep-dive tracker](../deep-dives/README.md) is still *not started* and its research line waits in READY's Queued. This level takes **ID 7**. Whichever of the dive and this build lands second keeps ID 7 as defined here and numbers its own levels from 8; the dive may move level 7's position in an `order`, but not its ID or rules, without a new definition.
- The study's optional third unit (three little worms long) is **dropped** from this level: the "how many times bigger" idea belongs to the study's later *Measuring Post* rows, which wait on developer decisions. It can return as a later Inchworm level after the dive.

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| prek | `{ min: 1, max: 2 }` | `{ min: 1, max: 7, order: [1, 2, 7] }` (the new top) |
| school | `{ min: 1, max: 6 }` | `{ min: 1, max: 7, order: [1, 2, 7, 3, 4, 5, 6] }` (after *pick how many worms long*, before *compare two things*) |

A pre-K save already sits at 1 or 2, so nothing moves. A level 3–6 carried into pre-K by a pin lands on the nearest listed ID through the existing `clamp` (3 and 4 land on 2, 5 and 6 on 7); a school player at 3–6 keeps their level, and stepping down from 3 now goes to 7. Two smooth rounds at 7 step a pre-K player nowhere (it is the top) and a school player up to 3.

## A round, step by step

`PLANS[6] = { mode: 'units', max: 6, rounds: 4, name: 'Measure one thing with big worms, then little worms: which number did the little worms make?' }`. `units` is not a ruler mode (`isRuler` stays false), so the worm unit `U = 88` and `x0 = 200` apply.

**The two worms.** A **little worm** is today's `wormArt()` (green, `U` long). A **big worm** is `2U` long: ten body circles of the same spacing at about 1.4 times the radius, in `swatch.orange` (fill/light/line), so size and colour both tell them apart. Its drag `hitArea` is `Rectangle(-U - 10, -46, 2U + 20, 92)`. The sticker, icon and levels 1–6 keep little worms only.

**Sticks.** Four sticks a round, seeded: the thing from `leaf`, `pencil`, `snake`, `stick` (never the same thing twice in a row); the big count `b` is 2 or 3, so the little count is `2b`, 4 or 6, and the stick is `2b × U` long (at most 528 units, the length level 3 already fits). The no-repeat rule on length is **replaced** in this mode by "never the same thing twice in a row, and never three sticks of the same length", so lengths may repeat once and replay does not settle into 4, 6, 4, 6.

**Step a, big worms.** Two copies of the stick lie one above the other at the compare layout's rows (`v.h * 0.3` and `v.h * 0.52`), both starting at `x0`. The lower one is drawn at 40% alpha until its turn. The bucket (`v.w - 170`, as today) holds three **big** worms. `ctx.instruct('worm.big', { what })`: *Measure the {what} with big worms!* Each drop snaps to the **upper** row at `x0 + worms × 2U + U`, says `count` with the new total, and refills the bucket with big worms. A drop near the faded lower row also goes to the upper row while it is unfinished (the active row takes every drop within the existing 80-unit reach), so a near miss is never punished.

**Step b, little worms.** When the upper row holds `b` worms, its count appears at its right end (`label(String(b), 46)`, also said: the last `count` already said it), the remaining big worms leave the bucket (their `DragHandle`s destroyed), the lower stick comes to full alpha and three little worms fill the bucket. `ctx.instruct('worm.little', { what })`: *Now measure the same {what} with little worms!* Drops snap to the lower row at `x0 + worms × U + U / 2`.

**Step c, which count?** When the lower row holds `2b`, its count appears too and the bucket empties (no worm can be dragged). Both rows stay on screen with their worms. After `worm.counts` (*{a} big worms. {b} little worms.*), two number pads appear on the right where levels 2–3 put theirs (`v.w - 110`, at `v.h * 0.3` and `v.h * 0.3 + 125`): the two counts, **in seeded shuffled order**, so a pad's position never tells which row it belongs to. `ctx.instruct` asks:

- sticks 1 and 2: `worm.whichlittle`, *Which number did the little worms make?*
- sticks 3 and 4: one asks `worm.whichlittle` and the other `worm.whichbig` (*Which number did the big worms make?*), the order seeded.

A right pad: sparkle, the pet cheers and says `worm.samestick` (*Same {what}! Little worms are smaller, so it takes more of them.*), then the next stick. After the fourth, the existing `finale()`.

**What she decides:** where each worm goes and when a row is full (as levels 1–2), then which count belongs to which worm size.

## Misses, hints and glow

| Event | Count | Response |
| --- | --- | --- |
| A worm dropped on a full row (it would hang off the end) | 1 miss | Existing `worm.toomany`; the worm goes home |
| A drop away from both rows | Free | The worm goes home, as today |
| The wrong pad | 1 miss | Boing; `worm.smaller` when the little count was asked (*The {what} did not change. Little worms are smaller, so it takes more of them.*), `worm.bigger` when the big count was asked (*The {what} did not change. Big worms are bigger, so it takes fewer of them.*) |
| Two misses on the same stick | 1 hint, once per stick (the existing `wrongs >= 2 && !hinting` rule) | The right pad glows as on levels 2–3; while pads show, a translucent big worm is drawn over the **first two** little worms of the lower row (alpha 0.5, `eventMode = 'none'`, removed with the row), showing one big worm covers two little ones |

The overhang miss counts toward the two-miss glow as today; during steps a–b the glow lights the active row's end mark (the existing non-ruler glow), and in step c the pad. Adaptation is unchanged: at most one miss and no hint is smooth, four misses or two hints struggle.

## Logic (`logic.ts`)

- `MeasureMode` gains `'units'`; `PLANS` gains the entry above (`planFor` already clamps to `PLANS.length`).
- `Measure` gains `ask?: 'little' | 'big'`. For `units`, `length` is the big count `b` and `other` is `{ thing: same thing, length: 2b }`, so the existing two-row code holds both rows.
- `UNIT_SIZE = [2, 1]` (in `U`) for `units` rows, exported for the drop and art: row `r` of a `units` stick is drawn `length × UNIT_SIZE[r] × U` long, which for both rows is `2b × U`.
- `makeMeasures` for `units`: draw `b` from 2–3 and the thing as above; `ask` is `little` for sticks 1–2 and a seeded `['little', 'big']` shuffle for sticks 3–4.
- `answerOf` for `units`: `ask === 'big' ? m.length : m.other!.length`. `choices` for `units` returns `rng.shuffle([m.length, m.other!.length])`.
- `measureTouch` for `units`: fill row 0 to `m.length`, then row 1 to `m.other!.length`, then `{ kind: 'answer', value: answerOf(m, 'units') }`. It already fills rows in order, so only `answerOf` needs the new case; the ghost finger needs no other change.
- `index.ts` (not rules): the active row is `rows[0]` until it is full, then `rows[1]`; drop snapping and the overhang test use the active row's `UNIT_SIZE`; `fillBucket` makes big or little worms by the active row and `destroy()` still releases every handle in the bucket.

## Rule tests (`logic.test.ts`)

1. **Generation.** Over 300 seeds, a `units` plan yields four sticks; `b ∈ {2, 3}`, the little count is exactly `2b`, both rows end at the same mark (`b × 2 = 2b × 1` in `U`) and fit the six-worm maximum; no two neighbouring sticks share a thing and no three share a length.
2. **The question.** Sticks 1–2 ask `little`; sticks 3–4 ask one `little` and one `big`. Over the seeds both orders of sticks 3–4 occur.
3. **Position does not give it away.** Over the seeds, the right answer is the first pad in some rounds and the second in others, for both `ask` values; `choices` always holds exactly the two counts.
4. **The finger.** `measureTouch` plays every seeded `units` stick as `b` worms on row 0, `2b` on row 1, then the answer, and that answer equals the asked row's count (extends the existing "demonstrates every mode" test).
5. **Unchanged below.** `makeMeasures` for levels 1–6 gives the same sticks as before for a fixed seed, so the appended level renumbers nothing.
6. **Bands.** `rangeFor` gives the two ranges above, and `levelsInOrder` the two orders.

## Voice lines (`voice-script.ts`)

New IDs: `worm.big` (`{what}`), `worm.little` (`{what}`), `worm.counts` (`{a}`, `{b}`: *{a} big worms. {b} little worms.*), `worm.whichlittle`, `worm.whichbig`, `worm.samestick` (`{what}`), `worm.smaller` (`{what}`), `worm.bigger` (`{what}`). The questions are `ctx.instruct` so the pet repeats them; the counts and feedback are `ctx.say`.

## How-to card (`howto.ts`)

- The level-6 step becomes `{ from: 6, to: 6, … }` (it is open-ended today and would otherwise claim level 7).
- Add `{ from: 7, to: 7, text: 'Measure the same thing twice: big inchworms first, then little ones. Then tap the number the little worms made (or the big worms, when the pet asks).' }`.
- `finish` stays (*The round ends when the measurement is chosen.*), true at level 7.
- Co-play suggestion (README/GAMES only, no code): before the little worms go down, guess together whether their number will be bigger.

## Build and check tier (M2)

New level on an existing interaction; the pads are levels 2–3's, so no new input. Checks: `npm run typecheck`; Inchworm rule tests and `howto.test.ts`; one filtered browser play of level 7 in portrait with one overhang drop, one wrong pad and the two-miss glow, finishing the round; `fingerdemo` filtered to `inchworm` at level 7; one portrait screenshot of step c. Build only if shared files change. Only a person can judge whether big and little worms read clearly at iPad size, and whether two rows feel like work for a five-year-old ([device checks](../DEVICE-CHECKS.md) at closeout).
