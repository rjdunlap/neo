# Lasso Loops level 6: About how many? (definition)

Defined 2026-10-22 on `claude/define-lasso-about-how-many` ([PR #800](https://github.com/rjdunlap/neo/pull/800)). This is slice E1 of the [estimation study](../deep-dives/subjects/estimation.md#build-slices-in-order), taken from its [proposed ladder](../deep-dives/subjects/estimation.md#first-games-proposed-ladder-lasso-loops-6-and-7) and its [recommendation](../deep-dives/subjects/RECOMMENDATIONS.md#estimation-recommendations). Docs only: nothing is built yet.

**What it adds:** one new level at the end of `lasso-loops` (`src/games/lasso-loops/`), level 6 *About how many?*. She looks at a meadow of fireflies and makes a free guess from three far-apart number cards. She loops one jar of ten as a benchmark and may then keep or change her guess. Then she plays level 4's tens round as the check: loop the tens, put the ones on the leaf, and choose how many in all. At the end the pet compares her guess with the count out loud. The new idea is using a known set (one jar of ten) to adjust a guess about a collection (CCSS MP5 and MP8, and the counting side of 2.MD.A.3). No built or planned rung covers it.

- Levels 1–5 keep their IDs, pins and rules. This adds no band, land, tile, save field, journal entry, creation slot, couch entry or asset.
- **Reconciling with Lasso Loops' own game dive.** The `lasso-loops` row in the [deep-dive tracker](../deep-dives/README.md) is still *not started*. This level takes **ID 6**. Whichever of the dive and this build lands second keeps ID 6 as defined here and numbers its own levels from 7. The study's level 7 *Too few, too many* (E2) waits on its decision 2 and a child's play of level 6. If the dive lands first, its own level 7 takes priority and E2 takes the next free ID.
- Fixed here, against the study's table: the tens round makes **21–39** fireflies (`rng.int(2, 3)` tens and `rng.int(1, 9)` ones; never 20 or 30). The school window becomes **3–6**, not 3–7, because level 7 is not defined.

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| preschool | `{ min: 1, max: 3 }` | unchanged |
| prek | `{ min: 2, max: 4 }` | unchanged |
| school | `{ min: 3, max: 5 }` | `{ min: 3, max: 6 }` (the new top; the ladder is still plain `min..max`, so no `order`) |

No saved level moves. A school player at 5 now steps up to 6 after two smooth rounds. A pre-K player never reaches 6: the how-to arrows stay inside the band's range. A grown-up at the school band can open it with those arrows.

## A round, step by step

`PLANS[5] = { mode: 'tens', guess: true, name: 'About how many? Guess, loop one jar of 10, keep or change the guess, then loop the tens and say the number' }`.

`LassoPlan` gains an optional `guess?: boolean`. Level 6 is a **flag on the `tens` mode, not a new `LassoMode`**. That way `makeRound`, `choices`, `countAloud`'s by-tens branch, the `intro()` switch and the existing tens rule tests all apply to it unchanged. `planFor` already clamps to `PLANS.length`.

**Step a: look and guess.** The round is level 4's: 21–39 fireflies scattered on the 5-row grid, and 2 or 3 jars of ten. The jars are hidden (`visible = false`). Three **guess cards** sit in the jar row instead, so no card covers the meadow she is estimating. `ctx.instruct('lasso.guess')`: *Look at all the fireflies! About how many? Make a guess!*

- Each guess card is a wooden sign shape, 130 × 110 units, with the numeral at size 52. It is unlike the purple round answer pads, so the two questions never look alike. The touch area is `Rectangle(-75, -65, 150, 130)`.
- The cards sit in ascending order left to right at `spread(3, 190, v.w - 40, 160)`, y = `v.h - 100`. That keeps them clear of the corner pet, as the jars are.
- A tap uses `onTap` with the built pad's dip and a `sfx.bell`. The pet says `lasso.guessed` (*About {g}! Let's see!*), the same warm words for every card. The card flies to the **guess sign**, and the other two shrink away.

**The guess sign** is a wooden board about 170 × 90 at (`v.w - 110`, 58), top right.

- It stays clear of home and help (top left, x 62) and of the co-play tip (top centre). It overlaps at most the top 10 units of the meadow area, which starts at y 96.
- Its numeral is `label(String(g), 44)` next to a small drawn firefly, so it reads "about this many fireflies" without words.
- It sets `eventMode = 'none'`, so loops drawn under it still reach the sky layer. It stays up until the round ends.

**Step b: the benchmark jar.** The first jar alone appears in the jar row at its usual spot (`spread`'s first x) and glows. `ctx.instruct('lasso.benchmark')`: *Loop ten fireflies for the first jar.* Looping works exactly as on level 4. A loop of the wrong size is a miss, two of them ring a group of ten (one hint), and the catch counts the fireflies into the jar.

**Step c: keep or change.** When the first jar holds ten, the three guess cards come back in the jar row to the right of the full jar, at `spread(3, jarX + 150, v.w - 40, 160)`. The other jars stay hidden. The card for her current guess wears a white ring, like a ringed firefly. `ctx.instruct('lasso.change', { g })`: *Ten in one jar. You guessed about {g}. Keep it, or tap a new guess.*

- Tapping the ringed card keeps the guess: `lasso.keep` (*Keep about {g}!*).
- Tapping another card changes it: `lasso.changed` (*Now about {g}!*), and the sign's numeral changes.
- There is no separate keep button and no waiting timer. The cards leave, the other jars appear, and `ctx.instruct('lasso.tens')` is said (the level-4 line, still true).

**Step d: the check.** Level 4's round, unchanged: loop the remaining jars, the ones fly to the leaf (`lasso.left`), and three purple pads ask `lasso.total`. The choices are level 4's `choices()`: tens-and-ones swaps and ten more or ten less. A wrong pad is a miss and is counted aloud by tens (`lasso.count-tens`). After two wrongs the right pad glows. **No pad is marked, ringed or glowed for her guess.** A pad may show the same number as a guess card (an answer of 21 with a distractor of 20), and that is fine.

**Step e: the comparison.** After `lasso.right`, the jars and the sign bounce together, and the pet compares her **final** guess (kept or changed) with the count:

| Final guess `g` vs count `n` | Line |
| --- | --- |
| `|g - n| < 10` | `lasso.guess-close`: *You guessed about {g}. There are {n}. Close!* |
| `g < n` (otherwise) | `lasso.guess-more`: *You guessed about {g}. There are {n}, more than your guess!* |
| `g > n` (otherwise) | `lasso.guess-fewer`: *You guessed about {g}. There are {n}, fewer than your guess!* |

The study's "a bit more / a bit less" is changed to "more / fewer than your guess". A far card is at least 11 away, so "a bit" would not be true. Then the existing `finale()`. Nothing is ranked or kept: no closest-guess record, no streak, and nothing about the guess goes in the save.

**What she decides:** a guess; whether the jar of ten changes it; then level 4's loops and count.

## Guess cards (`logic.ts`)

`guessCards(n: number, rng: Rng): { cards: number[]; near: number }`, used only when `plan.guess`:

- **Near card:** the nearest ten to `n`, rounding a 5 up: `10 * Math.floor((n + 5) / 10)`. For 21–39 that is 20 (21–24), 30 (25–34) or 40 (35–39), always within 5 of `n`.
- **Far cards:** two distinct tens from 10–90 that are each at most `n / 2` or at least `2n`. A seeded pick decides between {10 and one high ten} and {two high tens}. For 21–39 the only low ten is 10, and the high tens are `ceil(2n / 10) * 10` to 90. At least two always exist (for 39, that is 80 and 90). Each far card is therefore 11 or more away from `n`.
- `cards` holds all three in ascending order, which is the left-to-right layout.
- `compareGuess(g, n): 'close' | 'more' | 'fewer'` follows the table above.

## Misses, hints and glow

| Event | Count | Response |
| --- | --- | --- |
| Any first guess, any keep, any change | **Free**: never a miss or a hint, and the `wrongs` counter is untouched | Spoken back; the sign shows it |
| A loop of the wrong size (benchmark or later jars) | 1 miss | Level 4's `lasso.wrong`; two in a row ring a group of ten (1 hint, once per round), as today |
| A loop around nothing | Free | `lasso.empty`, as today |
| A wrong count pad | 1 miss | Counted by tens; after two wrongs the right pad glows (the shared hint), as today |

Adaptation is unchanged: a smooth round has at most one miss and no hint; a struggling one has four misses or two hints. A far guess never makes a round struggle.

## The bot (`autotouch`)

- While guess cards show (step a), tap the near card.
- In step c, tap the card equal to her current guess (keep).
- Otherwise use level 4's route: `demoLoop` for each jar, then tap the right pad.

The ghost finger therefore shows "guess, keep, loop, count" without any wrong move. Two taps add only a few seconds to level 4's demonstration, well inside the finger-demo limit. `autotouch` returns null while busy, as today.

## Voice lines (`voice-script.ts`)

New IDs:

- `lasso.guess`, `lasso.benchmark`, `lasso.change` (`{g}`): `ctx.instruct`, so the pet repeats the step she is on.
- `lasso.guessed` (`{g}`), `lasso.keep` (`{g}`), `lasso.changed` (`{g}`), `lasso.guess-close`, `lasso.guess-more`, `lasso.guess-fewer` (each `{g}`, `{n}`): `ctx.say`.

Nine lines, wording as above. The numbers are spoken as numbers ("about thirty"); the cards show numerals only. Whether "about thirty" is understood when spoken is a person check.

## How-to card (`howto.ts`)

- The level-5 step `{ from: 5, text: 'Make the groups asked for, …' }` becomes `{ from: 5, to: 5, … }`. It is open-ended today and would otherwise show at level 6.
- Add three level-6 steps:
  - `{ from: 6, to: 6, text: 'Tap a number card to guess about how many fireflies there are. Any guess is fine.' }`
  - `{ from: 6, to: 6, text: 'Loop ten fireflies for the first jar, then keep your guess or tap a new one.' }`
  - `{ from: 6, to: 6, text: 'Loop the rest ten at a time and say how many in all; the pet compares it with your guess.' }`
- The two plain steps (draw a loop; close it) hold at 6. `finish` stays as it is, and is true at 6 because the jars are counted.
- `describeLevel(6)` is the plan name above.
- `skills` gains `'estimating'`.
- The existing `offScreen` line stays. README/GAMES may add "guess first, then bundle" as a co-play idea; the study's E6 tip and E7 Jar guess card are separate slices.

## Rule tests (`logic.test.ts`)

1. **Unchanged rounds.** `PLANS[5]` has `mode: 'tens'` and `guess: true`, so the existing "every plan" test already runs the tens assertions on it: 10 per jar, `answer = 10 × jars + ones`, ones 1–9, and three distinct `choices` that include the answer. Add: over 300 seeds, level 6's fireflies are 21–39. For a fixed seed, `makeRound` and `choices` give the same results for levels 1–5 as before (nothing renumbered).
2. **Guess cards.** Over every `n` in 21–39 and 50 seeds each:
   - there are three distinct tens, each from 10 to 90, in ascending order;
   - exactly one is within 9 of `n` (the near card, within 5);
   - each other card is `≤ n / 2` or `≥ 2n`.
   Over the seeds, the near card is sometimes the middle card and sometimes the lowest, so its position does not give it away.
3. **The comparison.** `compareGuess` is `close` exactly for the near card and `more` or `fewer` for the far cards, on the correct side. It is never anything else.
4. **Bands.** `rangeFor(LEVELS, 'school')` is `{ min: 3, max: 6 }`, and preschool and pre-K are unchanged. This is a registry/ranges check if `LEVELS` stays in `index.ts`.

The claim that "a guess is never a miss" is about game state, not about `logic.ts`, so the browser check proves it (below).

## Build and check tier (E1 build)

New level on an existing interaction, plus the guess-card tap. Checks:

- `npm run typecheck`; Lasso Loops rule tests and `howto.test.ts`.
- One filtered browser play (`BROWSER_SUITE=shortlist SHORTLIST_ONLY=lasso FROM_LEVEL=6`) in portrait. Extend the lasso case in `scripts/browser-check.mjs`, which stops at `level <= 5`, to level 6:
  - Tap a **far** card first and assert misses and hints are still `[0, 0]`.
  - Draw two wrong-sized loops on the benchmark jar (rings shown), then the right loop.
  - At step c, tap the near card (a change) and assert the sign shows it.
  - Finish the loops, tap one wrong pad, then the right one.
  - Assert the score is `[3, 1]`, the same as level 4 with the same mistakes. That equality is the proof that the guesses cost nothing.
- `fingerdemo` filtered to `lasso-loops` at level 6.
- One portrait screenshot of the guess sign at step c.

Run `npm run build` only if shared files change (they should not). For person checks, add these to [device checks](../DEVICE-CHECKS.md) at closeout:

- whether a six-year-old changes a guess after seeing the jar of ten;
- whether "about thirty" is understood when spoken;
- whether the sign reads clearly on an iPad in portrait.

## Open decisions

None block the build. The study's decision 1 (append to school, 3–6 now) uses its lean as the default. Its decision 2 (level 7's miss rule) and the person checks belong to E2, which is defined only after a child has played level 6. There is no review gate: the content is invented fireflies and numbers, with no small objects and no reviewer table.
