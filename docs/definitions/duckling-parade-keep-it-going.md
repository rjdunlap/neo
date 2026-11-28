# Duckling Parade level 12: Keep it going (definition)

**Built:** not yet; its build is queued in [READY](../READY.md).

Defined 2026-11-28 on `claude/define-duckling-parade-12` ([PR #2374](https://github.com/rjdunlap/neo/pull/2374)) as slice 5 of the [Duckling Parade deep dive](../deep-dives/duckling-parade.md#build-slices-in-order), from its [level 12 row](../deep-dives/duckling-parade.md#new-levels-on-top). The developer's delegation of 2026-10-23 approved "continuation 12 with a permanently visible reference and a one-step reveal counted as help" ([decisions](../deep-dives/duckling-parade.md#decisions-for-the-developer)). Every [open decision](#open-decisions) below has a default the build uses, so none waits on the developer.

**What it adds:** level 12 of `duckling-parade` (`src/games/duckling-parade/`). The card at the top shows a short duck pattern, two full units of it (yellow, blue, yellow, blue, or pink, pink, red, pink, pink, red). Beside it are four empty, colorless slots. She leads Mama Duck to the four ducklings that carry the pattern on, in order, then takes them to the pond. The future colors are never drawn, so she has to read the unit from the card and carry it forward.

**Learning goal:** a repeating pattern can be extended: find the unit that repeats, then say what comes next and after that. Levels 7–11 show every color of the line she builds (the full target card), so they ask her to match a shown order. Level 12 asks her to continue one: extending a pattern, as distinct from copying it, is the next step in early pattern work. The band is `school` (about 6–8), the top of this game's ladder. It makes no claim beyond that.

## Why this is not level 11 again

At 7–11, `drawCard` draws every slot of the six-duck pattern at 30% opacity before she starts, and `parade.pattern` / `parade.spare` read the whole pattern aloud. The miss line `parade.next` ("Next comes {want}!") names the answer. Every level so far can therefore be played by matching the next faint dot. Level 12 removes all three:

1. **The card:** the reference is drawn at full color and never changes; the four continuation slots are neutral rings with no color until filled (or revealed by a counted hint).
2. **The instruction** speaks only the reference.
3. **The miss line** sends her back to the card without naming the color. Only the counted hint names it.

A rule test pins the first point (below): no level 12 round exposes a continuation color anywhere a level 7–11 round exposes its pattern.

## Bands and ladder

| Band | Now | After | Where it sits |
| --- | --- | --- | --- |
| `school` | `{ min: 9, max: 11 }` | `{ min: 9, max: 12 }` | The new top, after *ABB parade* |
| `lap`, `toddler`, `preschool`, `prek` | 1, 1–3, 2–6, 4–8 | unchanged | Not offered |

`LEVELS` has no `order`, so appending 12 needs none. ID 12 is new: no saved level or pin can hold it, and nothing is renumbered. The game has no couch entry, `control()` or `uprightLevels`, so no couch trip, course or upright phone layout changes; level 12 lays out on the usual 1024 × 768 area like 1–11 (see [open decisions](#open-decisions)).

## The plan

Appended to `PLANS`:

```ts
{
  mode: 'pattern',
  ducklings: 6,
  colors: 2,
  continuation: 4,
  units: ['ab', 'aab', 'abb'],
  name: 'Keep the pattern going: bring the next four ducklings',
}
```

- `continuation?: number` and `units?: ('ab' | 'aab' | 'abb')[]` are new `ParadePlan` fields: "Level 12, *Keep it going*: the card shows two units of `reference`; she brings the next `continuation` ducklings." No other plan sets them.
- `Round` gains `reference?: ColorName[]`. On level 12, `round.pattern` holds **only the four-duck continuation**, so `canJoin`, `nextInPattern`, `needed`, `readyForPond`, `arrive` and `nextStop` work unchanged: the line is checked against `pattern`, the pond takes it at four, and the ghost finger already knows the way. The reference is card art only, never meadow ducklings, so no reference duck can be counted toward the trip.
- `planFor` clamps to `PLANS.length`, so it reaches 12 with no change.

### The round (`makeRound`)

1. `kind = rng.pick(plan.units)`; `[a, b] = rng.shuffle(DUCK_COLORS).slice(0, 2)`; the unit is `[a, b]`, `[a, a, b]` or `[a, b, b]`.
2. `reference` = the unit twice (4 or 6 colors). Two full units, so the repeat is always visible.
3. `pattern` = the next four: `unit[(reference.length + i) % unit.length]` for `i` in 0–3. Because the reference ends on a whole unit, that is `ABAB`, `AABA` or `ABBA`. On the two three-long units the fourth duck starts a third unit, so she carries the pattern past a single copy of the unit.
4. **The meadow:** the four continuation colors plus one spare of each color, six ducklings, shuffled (`ABAB` gives 3 + 3; `AABA` gives 4 A + 2 B; `ABBA` gives 3 + 3). At every step both colors are still waiting, so no step is decided by the supply, and the last duck is a real choice. The two spares stay in the meadow at the end; as on level 10, no one has to fetch them.

## A round, step by step

One round makes one sticker, as on every Duckling Parade level.

1. **The card** (`drawCard`, a `round.reference` branch): the reference dots at full color, with a 14-unit gap between its two units so the repeat reads as groups. Then an arrow or a wider gap, then four slots drawn as rings in the card's existing border color (`0xb9c6d1`, no fill). The next slot keeps the existing dark ring. A filled slot takes the duckling's color at full alpha. Width: (6 + 4) × 54 + 26 + the gaps is about 620 units at most, inside the 1024-unit stage at every view; the card stays at `(v.w / 2, 60)`.
2. **The instruction** (`ctx.instruct('parade.keepgoing', { pattern })`, a branch in `start()` before the existing pattern one): "Here is a duck pattern: {pattern}. Keep it going! Bring the next four ducklings, then go to the pond." `{pattern}` is the reference joined with commas, as today. The pet repeats this.
3. **A right duckling** joins as today: hop, quack, `color.<name>` spoken, the slot fills.
4. **A wrong duckling she aimed at** (the existing `refuse` rules: aimed, nearest-joinable and the three-second cooldown) is a miss: boing and `parade.keepnext`: "Quack! I'm {color}. Look at the card: what comes after {last}?" `{last}` is the color before the empty slot (the last reference color for the first slot). A duckling Mama only walks past is still free, as today.
5. **The hint, a one-step reveal:** after two misses, or 15 seconds without progress (the existing triggers), the **next slot only** shows its color at 30% alpha, the waiting ducklings that fit glow (the existing `drawGlows`), and the pet says `parade.next` ("Next comes {want}!"). The reveal ends when that slot is filled (`hinting = false` on join, as today), so the slot after it is a ring again.
6. **Four in the line:** `parade.home` and the pond glow, as today. A partial line still cannot unload.
7. **At the pond** the four swim in, then the reason (`parade.kept`, before `parade.done`): "{pattern}, and it keeps going: {more}!" (`{more}` the four she brought). Then `ctx.finish({ misses, hints })`.

### Accounting

- `misses`: each aimed wrong duckling, with the existing cooldown. Passing by is never a miss.
- `hints`: each reveal counts one, at most one per slot, so at most four per round. `wrongs` is reset at each reveal (as today), and also **when a slot is filled**, so two misses mean two on the same slot, not one each on two slots. This is the one behaviour change to shared code in the game, and it applies to levels 7–11 too. There, `wrongs` counting across slots was not a deliberate rule (no test pins it), and per-slot is the fairer reading of "a glow after two misses". The build names this change in its PR.
- An idle reveal counts as a hint, as on every level here. A round with two reveals is a struggling round under `src/progress/difficulty.ts`; at the bottom of the school window that keeps her at 9, never below it.
- Supported completion stays complete: glows, the pond glow and the sticker are the same with or without reveals.

## Couplings the build touches

- **`logic.ts`:** the plan, the `ParadePlan` and `Round` fields, the `makeRound` branch, `LEVELS.school.max = 12`.
- **`index.ts`:** the `start()` branch; the `drawCard` reference branch with neutral slots and the one-slot reveal; `refuse` choosing `parade.keepnext` when `round.reference` is set; `showHint` saying `parade.next` on level 12; `join` resetting `wrongs`; the `parade.kept` line in `homecoming`/`finale`. `autotouch()` and `showMove()` need nothing (they read `nextStop`).
- **`voice.ts`:** `parade.keepgoing`, `parade.keepnext`, `parade.kept`. The slotted lines stay on device speech until a clip pass, as the existing slotted lines do. Run `node scripts/content-barrels.mjs`.
- **`howto.ts`:** the level-11 step becomes `{ from: 11, to: 11 }`, and a new `{ from: 12 }` step: "Look at the duck pattern on the card and keep it going: bring the next four ducklings in order, then go to the pond. The spare ducklings can stay in the meadow." The finish line is unchanged.
- **`support.test.ts`:** the how-to loop runs to 12; `levels('school')` is `{ min: 9, max: 12 }`; `spare` is expected at 10 and 12.
- **`scripts/browser/suites/arcade.mjs`:** the default level list length 12 and the `n <= 12` filter; on 12, aim once at a wrong duckling (one miss, the `parade.keepnext` line, no color named), and assert the card's continuation slots carry no color before they are filled.
- **`docs/games/duckling-parade.md`** below its generated block, and `npm run game-docs`.

Tier: *new interaction* (the card and the reveal are new; walking and collecting are not): typecheck, the game's rule and support tests, one filtered play (`BROWSER_SUITE=arcade ARCADE_ONLY=parade ARCADE_LEVELS=9,12`, with one wrong aim and one reveal on 12), `fingerdemo` filtered to `duckling-parade` at 12, and one portrait screenshot. No build unless shared files change.

## Rule tests (`logic.test.ts`)

Over a few hundred seeds:

1. **Only level 12 has a reference:** every level-12 round has `reference`; no level 1–11 round does.
2. **Two full units:** `reference.length` is 4 or 6, it equals the unit twice, the unit has exactly two colors, and all three unit kinds occur.
3. **The continuation follows:** `pattern` has four colors and `reference.concat(pattern)` repeats the unit throughout (every color equals the one a unit earlier).
4. **Supply:** the meadow is the continuation plus one spare of each color (six ducklings, two colors), and after every prefix of the continuation is removed, both colors are still waiting.
5. **The rule is the continuation:** `canJoin` accepts only `pattern[line.length]`; the hint's color (`nextInPattern`) is that accepted color; `readyForPond` is true only at four.
6. **The card hides the future:** a pure helper `cardSlots(round, line, revealed)` (extracted from `drawCard` so it can be tested) gives the reference at full color and the continuation slots as `null` (no color) except filled slots and, when `revealed`, the next one.
7. **The ladder:** `LEVELS.school.max === 12` and `describeLevel(12)` is the plan name. The existing every-plan `nextStop` loop finishes every level-12 round.

## Open decisions

None waits on the developer. Defaults the build uses:

1. **Units AB, AAB and ABB, not AB alone.** AB alone would sit below ABB at 11 in the ladder. With all three, the continuation is new and the units are already familiar. ABC is left out: three colors would need a third spare and widen the card.
2. **The reference always ends on a whole unit.** A reference that stops mid-unit is a harder later variant, not this level.
3. **One spare per color.** Exactly four ducklings would decide the last step by supply.
4. **Landscape layout only.** The game has no upright phone layout today; adding one is its own READY line, not part of this level.
5. **Per-slot miss counting for the reveal** at every pattern level (see [accounting](#accounting)).
