# Pattern Train level 21: Add three, add four (definition)

**Built:** in progress on `claude/pattern-train-add-three-four`; its build is queued in [READY](../READY.md).

Defined 2026-11-28 on `claude/define-pattern-train-add-three-four` ([PR #2373](https://github.com/rjdunlap/neo/pull/2373)) as slice 9 of the [Pattern Train deep dive](../deep-dives/pattern-train.md#build-slices-in-order), from its [level 21 row](../deep-dives/pattern-train.md#new-levels-on-top). That row said "define after a child plays 19–20". The developer's delegation of 2026-10-23 replaced that: "Wonder Woods grows first, so 21 (add three, add four) may be defined now, with a child's play of 19–20 as a person check" ([decisions](../deep-dives/pattern-train.md#decisions-for-the-developer)). Every [open decision](#open-decisions) below has a default the build uses, so none waits on the developer.

**What it adds:** level 21 of `pattern-train` (`src/games/pattern-train/`). A numbered train of six cars counts on by 3 or by 4 from a start up to 20 (4, 7, 10, 13, 16, ?). She first names the rule by tapping one of three jump chips (+2, +3, +4 or +3, +4, +5). Then hop arcs marked with her rule appear between the cars, and she taps the number for the last car.

**Learning goal:** a number pattern has a rule, and the rule can be found from the cars and then used to go on. This is the first level that asks for the rule itself, as an answer, rather than only for the next number. It reaches toward Common Core 4.OA.C.5 ("generate a number or shape pattern that follows a given rule"), which is grade 4 work, and stays below it: the rule is a single "add" from a small set, and the numbers stay under 41. The band is `school` (about 6 to 8), so this is the top of that band's ladder. It makes no claim beyond that.

## Why this is not level 20 again

Level 20 (*Start anywhere*) already counts by 3 and 4 from starts that are not multiples of the step (`START_STEPS` is `[2, 3, 4, 5, 10]`), so "what comes next on a +3 train" is already a level-20 round. Level 21 adds a **second question that comes first: what is the rule?** The step is an answer she gives and the game holds her to it, with the arcs drawn from her choice. A rule test pins the difference (below), so this game does not grow another "level 10 plays like level 4" gap ([known gap 1](../deep-dives/pattern-train.md#the-game-today)).

The dive's [left out on purpose](../deep-dives/pattern-train.md#left-out-on-purpose) list excludes "a random hidden rule … a guess, not a decision … unless the rule is stated". This rule is not a guess: every gap between the five shown cars is the same step, so the rule can be read from any two neighbouring cars, and the hint shows exactly that.

## Bands and ladder

| Band | Now | After | Where it sits |
| --- | --- | --- | --- |
| `school` | `{ min: 8, max: PATTERN_PLANS.length }` (8–20) | the same expression, so 8–21 | The new top, after *Start anywhere* |
| `preschool`, `prek` | 1–6, 3–9 | unchanged | Not offered |

`LEVELS` in `logic.ts` has no `order` for any band today (the dive's windows section says `order` is "built", but no band uses it), so appending 21 needs no `order`. ID 21 is new: no saved level or pin can hold it, and nothing is renumbered. The couch stops stay at 4, 6 and 9, so trips and courses are unaffected.

## The plan

Appended to `PATTERN_PLANS`:

```ts
{
  pattern: [],
  kind: 'number',
  numberSteps: ADD_STEPS, // [3, 4]
  addRule: true,
  name: 'Add three, add four: find the rule, then the next number',
}
```

- `addRule?: boolean` is a new `PatternPlan` field: "Level 21, *Add three, add four*: she names the step first (`rule`), then fills the last car."
- `buildTrain` gains a branch before the plain numbered train: `if (plan.addRule) return addRuleTrain(plan.numberSteps, rng)`. Its return type gains `rule?: { step: number; choices: number[] }`. No other level returns `rule`.
- `ADD_CARS = 6` (the same as `START_CARS`, so the numbers stay large on a phone held upright).

## A round, step by step

One round makes one sticker, as on every Pattern Train level.

### The train (`addRuleTrain`)

1. `step = rng.pick([3, 4])`, `start = rng.int(1, 20)`. Any start is allowed, multiples of the step included: the rule question is the new part, and level 20 already covers starts off the step. The highest car is `20 + 5 × 4 = 40`, well within `NUMBER_TOP` (100).
2. `sequence = [start, start + step, …]`, six cars. The **last** car is empty (`targets: [5]`). Level 20 already moves the gap; here "the next number" keeps the rule question the only new demand.
3. **Rule chips:** `rule.choices = rng.shuffle([3, 4, rng.pick([2, 5])])`. Both 3 and 4 are offered on every round, so the set of chips never gives the answer away; the third chip is a one-off near miss.
4. **Number choices:** with steps of 3 and 4, "the last shown car plus the other step" is always the answer plus or minus 1, so it is always one choice (the wrong-step distractor the dive asks for). The second wrong number is drawn from `[last, answer + step, answer ∓ 1 on the other side]` (the car before, one step too far, one off the other way), so the answer is sometimes the smallest, sometimes the middle and sometimes the largest. `choices: [rng.shuffle([answer, last + otherStep, second])]`.

### 1. Find the rule

1. The five numbered cars and the empty sixth (`?`) roll in as on level 20. The three choice tiles under the train show the rule chips instead of numbers: `+3` in the same label style as the numbers, with a small hop arc drawn above it. The tiles are the existing 130-unit choice tiles at the existing positions, so targets stay at or above 100 units at every view.
2. Spoken (`ctx.instruct('pattern.rule', { name })`): "Each car adds the same amount, {name}. How much more is each car? Tap it." The pet repeats this until the rule is found.
3. A new `phase: 'rule'` (beside `find` and `fill`). Tapping a shown car while in it is free: it plays its bell, as today.
4. **A wrong chip** is a miss: boing, and "Count on from one car to the next. How many more?" (`pattern.ruleWrong`). After two misses on the rule (one hint, counted once): the right chip glows green, the first hop arc draws between cars 1 and 2, and the pet counts on across it: "From 4: 5, 6, 7. That is 3 more!" (`pattern.ruleHint`, slots `{from}`, `{list}`, `{step}`).
5. **The right chip:** a bell, the chips fade, and the hop arcs draw over each of the four gaps, each marked `+3`, with a fifth dashed arc onto the empty car. Spoken (`ctx.instruct('pattern.ruleRight', { step })`): "Yes! Add {step} each time. What number goes in the glowing car?" The pet repeats this from then on.

### 2. Fill the last car

1. The choice tiles now show the three numbers (`phase: 'fill'`, the existing `choose()` path).
2. A wrong number is a miss: boing and "Add {step} to {last}. Count on {step}!" (`pattern.addWrong`) in place of the general `pattern.wrong`. After two misses on the number (one hint, counted once): the existing green glow on the right number and `readTrain()`.
3. The right number drops in with a bell, then the reason (`pattern.whyAdd`): "Yes! Add {step} each time: {list}!" and `ctx.finish({ misses, hints })`.

### Accounting

`misses` is the sum of wrong rule chips and wrong numbers; `hints` is at most 2 (one per question), as on level 14 (*Fix the train*). Two smooth rounds (at most one miss, no hints) step up as usual; at the top of the ladder, that only keeps her at 21. A round where the hint named the rule is assisted completion, not independent mastery, and counts as such.

## Couplings the build touches

- **`index.ts`:** the `rule` phase and its chip tiles (reuse the choice tiles, relabelled, rather than a second set, so `resize()` positions them once); the hop arcs, drawn into one `Graphics` that is cleared on `resize()` and `destroy()`; `uprightLevels` (an explicit list ending at 20) gets 21.
- **`autotouch()` and `showMove()`:** in the `rule` phase, tap the chip whose value is `rule.step`; then the existing `wantedChoice` path.
- **`control()`** (couch) returns early in phases it does not know. The couch never reaches 21, but the `rule` phase must not dead-end there: move the ring along the chips and pick with the action button, as in `fill`.
- **`patternSaid`:** a `whyAdd` branch for the level, so the browser suite's "says why" check can include it (and level 20, which the check skips today: `level < 15 || level === 18 || level === 19`).
- **`voice.ts`:** `pattern.rule`, `pattern.ruleWrong`, `pattern.ruleHint`, `pattern.ruleRight`, `pattern.addWrong`, `pattern.whyAdd`. The slotted lines stay on device speech until a clip pass renders fixed wording, as the existing slotted lines do. Run `node scripts/content-barrels.mjs`.
- **`howto.ts`:** a bounded step line `{ from: 21, to: 21 }` ("Look at how much more each car is than the one before. Tap that jump, then tap the number for the last car.") and end line `{ from: 21, to: 21 }` ("The round ends when the number for the last car is chosen."). The level-20 lines stay `{ from: 20, to: 20 }`.
- **`scripts/browser/suites/patterns.mjs`:** `length: 21`, a level-21 screenshot, and a branch that taps two wrong rule chips (asserting one hint), then the right chip, then the existing wrong-twice number path.
- **`docs/games/pattern-train.md`** below its generated block, and `npm run game-docs`.

## Rule tests (`logic.test.ts`)

Over a few hundred seeds:

1. **Not level 20:** every level-21 round returns `rule`; no level 1–20 round does.
2. **The train is exact:** six cars, every gap equals `rule.step`, `step ∈ {3, 4}`, start in 1–20, every value at most 40 and positive; the target is the last car.
3. **Both steps occur**, and both 3 and 4 are on the chips every round; the third chip is 2 or 5, and both occur.
4. **The right chip moves:** across seeds it sits at every one of the three places.
5. **Number choices:** three distinct positive numbers, the answer exactly once, `last + otherStep` always among them; across seeds the answer is the smallest, the middle and the largest at least once each.
6. **Hints lead somewhere:** the rule hint's counted-on list ends at the second car's value; `wantedChoice` on the fill phase picks the answer.
7. **The ladder:** `LEVELS.school.max === 21` and `describeLevel(21)` is the plan name.

## Open decisions

None waits on the developer. Defaults the build uses:

1. **The gap is always the last car.** Level 20 already moves the gap; one new demand per level. A later variant could combine a moved gap with the rule question.
2. **Starts 1–20 only, values under 41.** The dive's "values to 100" is a ceiling, not a target; larger numbers would add place-value load on top of the new question.
3. **No "add 5", "add 6" or subtraction rule.** The level's name is its scope. A "what do you notice" (odd and even) step stays a sketch in the dive.

## Person checks

A child's play of 19–20 before this level is a [parked](../DEVICE-CHECKS.md) person check, not a gate.
