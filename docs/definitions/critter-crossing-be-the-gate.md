# Critter Crossing level 9: Be the gate (definition)

**Built:** 2026-11-28 on `claude/critter-crossing-be-the-gate` ([PR #2378](https://github.com/rjdunlap/neo/pull/2378)). As defined, with three small choices: the four cards are always one of each kind, the wooden lid matches the sign's width, and the seven slot-free voice lines below gained her name (`{name}`) so they stay on device speech until a clip pass renders them.

Defined 2026-11-28 on `agy/docs-critter-crossing-be-the-gate` ([PR #2369](https://github.com/rjdunlap/neo/pull/2369)) as slice 7 of the [Critter Crossing deep dive](../deep-dives/critter-crossing.md#build-slices-in-order), from its [Be the gate proposal](../deep-dives/critter-crossing.md#new-levels-on-top) and the October 23 [second-seat contract](../archive/DECISIONS-2026-10-23.md#standing-rules) (S5: anonymous, uncredited second seat; only seat 1's role read by `difficulty.ts`; a role-swapped round counts as supported completion). Every [open decision](#open-decisions) below has a default the build uses, so none waits on the developer.

**What it adds:** stable level ID **9** of `critter-crossing` (`src/games/critter-crossing/`), filling the next free ID after the visible "not" entry (ID 8). The roles flip: instead of only guessing the gate's secret rule, she chooses a rule from four pictured cards and plays the **gatekeeper** (tapping **Cross** or **Wait** as critters walk up to the bridge). Playing with someone (**Two of us**) swaps seats in round 2 so she guesses their chosen rule; playing alone (**Just me**) lets the pet try critters and deduce her rule across two rounds.

**Learning goal:** move from *inferring* a hidden classification rule to *formulating and enforcing* one consistently on edge cases (`one`, `not`, `and`, `or`, including critters with hats and scarves). Knowing what makes a rule true for a group of critters (and watching how another player or the pet tests it) deepens logical deduction without reading, timers, or scoring.

## Bands and ladder

| Band | Now | After | Where it sits |
| --- | --- | --- | --- |
| `school` | `{ min: 2, max: 7 }` | `{ min: 2, max: 9, order: [2, 3, 4, 5, 6, 7, 9] }` | Top of `school`, after *Settle it* (ID 7): completes the deep dive's arc from inferring `one`/`not`/`and`/`or` rules to making and holding one |
| `preschool` | `{ min: 1, max: 1 }` | unchanged | Not offered |
| `prek` | `{ min: 1, max: 8, order: [1, 8, 2, 3] }` | unchanged | Not offered (`entryLevels` remains `[8]`) |

ID 8 is pre-K's visible `"not"` entry, so `school` must use an explicit `order` (`[2, 3, 4, 5, 6, 7, 9]`) rather than `2..9`. Existing IDs 1–8 and saved pins are untouched, and `entryLevels: [8]` continues to land on school's easiest level (`2`).

## The plan (`logic.ts`)

- `CrossMode` becomes `'visible' | 'hidden' | 'keeper'`.
- `PLANS[8]` (returned by `planFor(9)`):
  `{ name: 'Be the gate: choose a rule and let the critters across that fit it', mode: 'keeper', gates: 'mixed', critters: 6, options: 4, minTests: 3, rounds: 2, scarf: true }`.
- `scarf: true` keeps the full seven-rule pool (`ALL_RULES` plus `'scarf'`), matching levels 5–7.

### Round generation (`makeKeeperRound`)

`makeRound(plan, rng, avoid?)` delegates `'keeper'` plans to `makeKeeperRound(plan, rng, avoid?)`:

1. Deal 6 distinct `SortCritter`s via `newCritter(plan, rng)` (no duplicate `(kind, hat, scarf)` triples).
2. Draw 4 distinct `Gate` options from all four gate kinds (`'one'`, `'not'`, `'and'`, `'or'`) over `rulesFor(plan)`.
3. Enforce **universal solvability across every choice** so neither seat nor the pet can pick a dead-end rule:
   - For **every** `g` in `options`, at least one critter crosses and at least one waits (`0 < yes < critters.length`). For `'or'` options, also check `yes >= 2` when possible (at least `0 < yes < critters.length` always holds).
   - For **every** `g` in `options`, trying all 6 critters leaves `consistent(options, critters.map(c => ({ c, passed: passes(c, g) }))).length === 1` — every pair of offered cards disagrees on at least one critter in the group.
4. `avoid` is the previous round's chosen `gateKey` (or sorted options key) so round 2 offers a fresh set without repeating round 1's rule.
5. `makeRound` returns `{ gate: options[0], critters, options }` (the scene sets the active `chosenGate` once seat 1 or seat 2 taps a card).

## A match, step by step

One sticker takes two rounds (`rounds: 2`), with the seat choice made once at the start of round 1.

### 0. Who is playing (`phase = 'seats'`)

1. On round 1, the bridge, river, and grass appear while critters, sign, bulb, dots, and bank shelf stay hidden.
2. Two `RoundButton`s (radius `56`, 112 × 112 logical units, white fill) appear side by side using the shared `twoArt()` (**Two of us**) and `oneArt()` (**Just me**) from `src/art/seats.ts`.
3. Spoken (`ctx.instruct('cross.seats')`): `"Who is playing with you? Tap the two friends to play together, or one friend to play alone."`
4. Tapping either button sets `seats = 'two' | 'solo'`, hides the seat buttons, and begins round 1.

### Mode A: Two of us (`seats === 'two'`)

#### Half 1 (Round 1): she is the gatekeeper, seat 2 guesses

1. **Pick a rule (`phase = 'pick-rule'`).** The 6 critters stand on the left bank; the 4 offered rule cards appear across the top in `panel` (`layoutPanel`). Spoken (`ctx.instruct('cross.lookaway')`): `"Partner, shut your eyes! Pick a secret rule for your gate."` Tapping any card is free (never a miss).
2. **Cover the sign.** The chosen rule draws onto the sign card, and a **wooden lid** (`wood.fill`, matching `SIGN_CARD` width × 128, marked with `?`) closes over it so seat 2 cannot see the rule. Spoken (`ctx.instruct('cross.keeper-go')`): `"Open your eyes! Tap a critter to test the gate, or tap the light bulb when you know the rule."`
   - **Free peek:** tapping the covered sign toggles the wooden lid open and closed (`peek`), never counted as a miss or hint, so she can quietly double-check her rule if needed.
3. **Test and judge (`phase = 'judge'`).**
   - Seat 2 taps any waiting critter (`slot.state === 'waiting'`). It walks to `gatePoint().x - 70, gatePoint().y + 10` and pauses (`pendingSlot = slot`).
   - Two `RoundButton`s (radius `56`, 112 × 112) appear: **Cross** (green check badge/fill) and **Wait** (red X badge/fill).
   - She taps **Cross** or **Wait**:
     - **Matches `passes(slot.c, chosenGate)`:** the lid closes if open, Cross/Wait hide, the critter crosses or returns with a mark as usual (`cross.yes` / `cross.no`), the bank shelf and dots update, `wrongs = 0`, and seat 2 can test the next critter or tap the bulb.
     - **Disagrees with `passes(slot.c, chosenGate)`:** `misses++`, `wrongs++`, `sfx.boing()`, the sign wobbles, and `ctx.say('cross.check-sign')` (`"Check your rule! Tap the sign if you need a peek."`). **Rule words are never spoken aloud in `Two of us`** so seat 2 is not spoiled. After 2 wrong taps on the same critter (`wrongs >= 2 && !hinting`), `hints++`, `wrongs = 0`, and the matching Cross or Wait button glows (`hinting = { kind: 'judge', pass }`). A false answer never enters `evidence()`.
4. **Seat 2 guesses.** Once `testsDone() >= plan.minTests` (3), the light bulb wakes. Seat 2 taps the bulb (`openGuess`) and picks a card:
   - Wrong guesses give the normal `cross.cont-yes`, `cross.cont-no`, or `cross.maybe` feedback, **and never increment `misses` or `hints`** (seat 2 is unscored under S5).
   - Matching `chosenGate`: the wooden lid lifts off the sign, `reveal()` walks the remaining critters across/back, and Half 1 ends.

#### Half 2 (Round 2): swap seats — seat 2 is the gate, she guesses

1. **Seat 2 picks (`phase = 'pick-rule'`).** Spoken (`ctx.instruct('cross.swap')`): `"Swap seats! Now shut your eyes while your partner picks a rule for the gate."` Seat 2 taps one of the 4 new offered cards in `panel`; the wooden lid closes over the sign with `?`.
2. **She solves (`phase = 'solve'`).** Spoken (`ctx.instruct('cross.crackit')`): `"Open your eyes! Try critters at the gate and guess your partner’s rule."` From here, round 2 runs identically to a hidden level (levels 5–6): she tries critters (the gate enforces seat 2's chosen rule cleanly without contradiction), reads the bank shelf and dots, opens the bulb at `minTests`, and guesses. Her own contradicted guesses count as `misses` (and glow after 2 wrongs as `hints`). When she finds the rule, the lid lifts, `reveal()` finishes the bank, and the match completes.

### Mode B: Just me (`seats === 'solo'`, 2 rounds)

A child playing alone (or stepping up into level 9 without a partner) plays both rounds as the gatekeeper while the **pet** plays the detective:

1. **Pick a rule (`phase = 'pick-rule'`).** Spoken (`ctx.instruct('cross.pick-own')`): `"You are the gate! Pick a rule from the pictures for your bridge."` She taps one of the 4 cards in `panel`. Her chosen rule stays **visible on the sign** (no wooden lid).
2. **Pet tests, she judges (`phase = 'judge'`).**
   - After a brief beat (`0.4 s`), the pet picks `bestTest(round.critters, tried, round.options, evidence())` (or `waiting[0]` if decisive early), says `cross.pet-try` (`"Hmm, let me try the {who}. Does it cross or wait?"`), and that critter walks to the gate.
   - The **Cross** and **Wait** buttons appear.
   - If her tap disagrees with her visible sign: `misses++`, `wrongs++`, `sfx.boing()`, sign wobbles, and `ctx.say(shouldPass ? 'cross.gate-fits' : 'cross.gate-notfit', { who, rule: gateWords(chosenGate) })`; after 2 wrongs, `hints++` and the right Cross/Wait button glows.
   - If it matches: the critter crosses or waits, updates the bank shelf, and `wrongs = 0`.
3. **Pet guesses.** Once `testsDone() >= 2 && consistent(round.options, evidence()).length === 1` (guaranteed within at most 6 critters by `makeKeeperRound`), the pet announces `cross.pet-guess` (`"I know your rule! It is {rule}!"`), cheers, and `reveal()` walks any remaining critters across/back before round 2 (or `finale()`).

## Miss, hint and second-seat accounting

- **Free actions (never a miss):** choosing the seat button, picking any of the 4 rule cards, peeking at the covered sign in `Two of us`, and (in `Two of us` Half 2) trying critters before guessing.
- **Gatekeeper judgment:** tapping Cross/Wait against her own chosen rule counts 1 miss (gentle boing, sign wobble, and the matching button glows after 2 misses in a row as 1 hint). *Departure from the dive's one-line table note:* the dive's initial sketch wrote "not a miss", which would let a child needing glows on every critter record `0 misses, 0 hints` as smooth mastery; counting wrong gate taps honors `AGENTS.md`'s rule-accounting requirement while keeping `Just me` fair and gentle.
- **Second-seat contract (S5):**
  - Seat 2 is anonymous and uncredited (`misses`/`hints` never count seat 2's wrong guesses in Half 1).
  - `gateSwapResult(twoSeats: boolean, misses: number, hints: number): { misses: number; hints: number }` in `logic.ts` returns `twoSeats ? { misses, hints: Math.max(hints, 1) } : { misses, hints }`, passed to `ctx.finish(...)`.
  - Thus **Two of us** is never smooth (cannot step up on a partner's easy play; counts as supported completion) while still recording her own struggles; **Just me** passes her result unchanged. No `RoundResult` or shell change.

## Layout (`layout.ts` and `upright.test.ts`)

Add `seats: [Point, Point]` and `judge: [Point, Point]` to `CrossLayout`:

- `seats`: `[{ x: v.w / 2 - 80, y: v.h * 0.45 }, { x: v.w / 2 + 80, y: v.h * 0.45 }]` in both upright and sideways views (112 × 112 hit targets, center-screen while critters/sign/bulb/shelf are hidden).
- `judge` (Cross and Wait buttons, 112 × 112 hit targets):
  - Upright: `[{ x: v.w / 2 - 80, y: panelTop + 20 }, { x: v.w / 2 + 80, y: panelTop + 20 }]` (sits in the clear top sky band, right of Home/`?` at `x0 = 248 > 115`, and well above the top critter row and sign).
  - Sideways: `[{ x: v.w * 0.68 - 70, y: 110 }, { x: v.w * 0.68 + 70, y: 110 }]` (right of the sign at `x <= 520`, above the right bank at `y >= 254`).
- Extend `upright.test.ts` to check `seats` and `judge` against `uprightProblems(..., 100)` across all 5 upright views (`phone`, `small`, `tall`, `captioned`, `minimum`), plus clear of the sign and critters.

## Voice lines (`voice.ts`) and how-to card (`howto.ts`)

New `VOICE` keys (run `node scripts/content-barrels.mjs` after adding):

- `cross.seats`: `['Who is playing with you? Tap the two friends to play together, or one friend to play alone.']`
- `cross.pick-own`: `['You are the gate! Pick a rule from the pictures for your bridge.']`
- `cross.lookaway`: `['Partner, shut your eyes! Pick a secret rule for your gate.']`
- `cross.keeper-go`: `['Open your eyes! Tap a critter to test the gate, or tap the light bulb when you know the rule.']`
- `cross.judge`: `['Does the {who} cross or wait? Tap the check or the cross.']`
- `cross.pet-try`: `['Hmm, let me try the {who}. Does it cross or wait?']`
- `cross.gate-fits`: `['Look at your sign! The {who} is {rule}, so it can cross.']`
- `cross.gate-notfit`: `['Look at your sign! The {who} is not {rule}, so it has to wait.']`
- `cross.check-sign`: `['Check your rule! Tap the sign if you need a peek.']`
- `cross.pet-guess`: `['I know your rule! It is {rule}!']`
- `cross.swap`: `['Swap seats! Now shut your eyes while your partner picks a rule for the gate.']`
- `cross.crackit`: `['Open your eyes! Try critters at the gate and guess your partner’s rule.']`

In `howto.ts`: existing steps end at `to: 7` or `8..8`, so none leak into 9. Add `{ from: 9, to: 9 }` entries for `steps` (both **Two of us** and **Just me**), `finish`, and `note` (peeking is free; partner guesses never count against you). Extend `coplayHint` to mention taking turns picking the secret rule on *Be the gate*.

## Ghost finger (`autotouch`)

`autotouch()` plays **Two of us** end to end:

1. `phase === 'seats'`: `{ tap: { on: this.together }, pause: 0.6 }`.
2. `phase === 'pick-rule'`: `{ tap: { on: this.cards[0].node } }` (picks the first offered rule).
3. `phase === 'judge'`: if `pendingSlot` is set, tap `this.crossBtn` when `passes(pendingSlot.c, chosenGate)` else `this.waitBtn`; otherwise follow `nextStep(round, plan, evidence())` (either tap the `bestTest` critter as seat 2, tap `this.bulb`, or tap the matching `card.node`).
4. `phase === 'solve'` (Half 2): follow `nextStep(round, plan, evidence())` as on hidden levels.

## Rule tests (`logic.test.ts`)

1. **`makeKeeperRound` (seeds 1–300):** 6 distinct critters (`kind`, `hat`, `scarf`), 4 distinct `options` mixing `'one' | 'not' | 'and' | 'or'`; for **every** option `g` in `options`, `0 < yes < 6` and `consistent(options, allEvidence(g)).length === 1`; round 2 avoids round 1's rule.
2. **`gateSwapResult`:** `twoSeats === true` always yields `hints >= 1` (`isSmooth` is false) while preserving `misses` and higher `hints`; `twoSeats === false` leaves `{ misses, hints }` unchanged.
3. **Bot termination:** starting from any chosen option `g` of `round.options`, iteratively applying `nextStep` (answering each `'try'` with `passes(c, g)`) always reaches `{ do: 'guess', gate }` with `sameGate(gate, g) === true` within `<= 6` tries and `>= plan.minTests` tries.
4. **Ladder & scarf:** `LEVELS.school` has `order: [2, 3, 4, 5, 6, 7, 9]`, `min: 2, max: 9`; `preschool`, `prek`, `entryLevels`, and `PLANS[0..7]` are unchanged; update the existing `scarfLevels` assertion in `logic.test.ts` from `[5, 6, 7]` to `[5, 6, 7, 9]`.

## Build and check tier

**New interaction** (new role-swap seat choice, Cross/Wait gatekeeping buttons, and wooden sign lid):

- Run `npm run typecheck`, `npm run format:check`, `npm run lint`, `src/games/critter-crossing/logic.test.ts`, `src/games/critter-crossing/upright.test.ts`, `howto.test.ts`, `registry.test.ts`, `barrels.test.ts`, and `game-docs.test.ts`.
- **One filtered scripted play** of level 9 at `school` (`390 × 844` upright) choosing **Two of us**: in Half 1, pick a rule, peek at the covered sign (free), make one wrong Cross/Wait tap (`misses >= 1`), let seat 2 make one contradicted guess (assert seat 2's wrong guess does not raise `misses`), then solve Half 2 to the sticker and assert `hints >= 1`. (Optionally spot-check `Just me` through round 1 if time permits.)
- **Portrait screenshots:** one of the seat choice and one of the covered sign with the Cross/Wait buttons.
- Run `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-crossing FINGER_LEVELS=9 FINGER_BAND=school`.
- No `npm run build` unless shared files (`src/art/seats.ts`, etc.) change.

### Expected files

- Code: `src/games/critter-crossing/{logic.ts, logic.test.ts, index.ts, layout.ts, upright.test.ts, voice.ts, howto.ts}`, generated barrels (`content-barrels.mjs`), and browser fixture/suite if needed.
- Docs at closeout: `docs/games/critter-crossing.md` (`npm run game-docs`), `docs/deep-dives/critter-crossing.md`, `docs/definitions/critter-crossing-be-the-gate.md` (`**Built:**` line), `docs/ROADMAP.md` (Chunk 23), Next ten line removed, verification entry and coverage row.

## Open decisions

None needed to start the build. Defaults settled here: `school` places ID 9 at the top (`[2, 3, 4, 5, 6, 7, 9]`); wrong gatekeeper Cross/Wait taps count as misses (with a quiet `"Check your rule!"` in `Two of us` and glow after 2 wrongs) while peeking at the covered sign is free; `Two of us` swaps roles in round 2 while `Just me` plays two gatekeeper rounds with the pet guessing via `bestTest`.
