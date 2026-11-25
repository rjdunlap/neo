# Last Pebble, levels 3–5 (definition)

Defined 2026-11-24 as slice **SG3b** of the [strategy-games study](../deep-dives/subjects/strategy-games.md#build-slices-in-order), the follow-up named in the [levels 1–2 definition](last-pebble.md#build-batch-last-pebble-1-levels-12) (built, [game page](../games/last-pebble.md)). **Docs only:** no code, voice line or clip exists yet. It freezes three new ideas, one per level, in two build batches. The READY line asked for levels 3–4 covering going first or second, changing the take and misère; three ideas do not fit two levels without stacking two new rules at once ("depth before pressure"), so **level 5 (misère) is its own batch**. Same game, same land, same board, same bands (`school`, `grownup`, "about 10 and up", never a gate); stable level IDs `3`, `4`, `5` extend the table to `1..5`.

## The three ideas

| Level | Name | New idea | Take | Winning rule she can discover |
| --- | --- | --- | --- | --- |
| 3 | **Who goes first?** | She picks who lays the first stone, then plays the crossing. | `1..2` (as levels 1–2) | A stream whose length is a multiple of 3 is won by *letting the pet go first*; any other length is won by going first. |
| 4 | **Bigger steps** | The take changes per crossing, `1..3` or `1..4`, shown before the choice. | `m ∈ {3, 4}` | Stepping stones are `m + 1` apart; the first-or-second rule becomes "is `T` a multiple of `m + 1`?". |
| 5 | **Last stone loses** | Misère: laying a stone on the far-bank whirlpool spot `T` *loses*. | `m ∈ {2, 3}` | Aim for spot `T - 1`, then count back in `m + 1`s; the whirlpool is the one spot nobody wants. |

Levels 3 and 4 share one batch (`last-pebble 2`), level 5 a second (`last-pebble 3`, after batch 2 merges). Learning goal as before: Common Core **MP7** (discern structure) and **MP1**; level 3 is NRICH *Got It*'s question "when is it better to go first and when is it better to let the computer go first?" and level 4 is its "try a different target and take" extension.

`describeLevel` (extend `describeLevel` in `logic.ts`, `LEVELS` becomes `1..5` for `school` and `grownup` when each batch lands; a batch only lists the levels it builds):
- 3: `"Who goes first? choose to start or let the pet start, then reach the far bank (about 10 and up)"`
- 4: `"Bigger steps: lay up to 3 or 4 stones at a time, and choose who goes first (about 10 and up)"`
- 5: `"Last stone loses: do not be the one to land on the whirlpool (about 10 and up)"`

## Model changes in `logic.ts`

Everything stays pure and seeded. The existing helpers already take `maxTake`; the batch widens their types and adds three small pieces.

- **Move type.** `Move = 1 | 2 | 3 | 4` replaces `1 | 2` in `bestMove`, `legalMoves`, `petMove` and `MoveRecord`; `legalMoves(pos, target, maxTake)` returns `1..min(maxTake, target - pos)`. `bestMove(pos, target, maxTake)` returns `((target - pos) % (maxTake + 1))` as before (unique, never above `maxTake`).
- **Misère reduces to normal play.** Landing on `T` loses, so the mover who lands on `T - 1` wins (the other must step onto `T`). `effectiveTarget(target, misere) = misere ? target - 1 : target`; every winning-set call receives `effectiveTarget`. From `pos = T - 1` in misère `bestMove` is null and the only legal move is `+1` onto `T`. The pet in misère plays the same `petMove` over `effectiveTarget` and, when forced, steps onto `T` (it never walks off a won position). `finishedBy(pos, target, misere, mover)` names the winner: the mover who lands on `T` wins in normal play and loses in misère.
- **Going first or second.** `goFirstWins(target, maxTake, misere)` is `!isSteppingStone(0, effectiveTarget(target, misere), maxTake)`: starting at `pos = 0`, the first player wins exactly when `0` is not a stepping stone. `bestChoice(...)` returns `'first'` or `'second'` from it. Her choice is recorded as the first entry of the round's `moves` as `{ player: 'her', kind: 'choice', pick }`.
- **Turning point with a choice.** `turningPoint` still finds her last missed winning move. When none exists because the choice itself was wrong (`bestChoice !== pick`), it returns the choice record, and the rewind goes back to the choice screen, not mid-crossing. Mathematical guarantee for the tests: if the pet reaches the winning end, either one of her moves left a stepping stone available (`turningPoint` finds it) or her choice was wrong.
- **Pet starts.** When she picks second, the pet lays the first stone with `petMove(0, …)`: the best move if one exists (so a wrong "second" on a non-multiple stream loses at once, truthfully), a seeded `1..m` otherwise.

## Level 3, Who goes first?

- **Round.** Three crossings, each on a new stream with `maxTake = 2`: one with `T % 3 === 0` (`6`, `9` or `12`, where *second* wins), one with `T % 3 === 1` and one with `T % 3 === 2` (`7, 10` and `8, 11`; *first* wins), seeded order, so every round shows both answers. No crossing repeats a length.
- **Choose.** Before each crossing two large buttons (`≥ 200 × 160` units, well above the 100-unit school minimum, mirrored picture and word: a stone-laying paw hand-off icon plus "I go first" / "Pet goes first") sit under the stream; the stream is drawn empty with the far-bank lantern lit. The choice is a real move, not a quiz: it starts play and she hears `lp3.go-first` or `lp3.pet-first` as the pet confirms.
- **Play** is level 2's: any legal move lands at once, the pet answers at a readable pace, a pet win rewinds. If the pet won because of her choice, the rewind goes to the choice screen with the stream reset and `lp3.choice-why` ("This stream counts in threes to the bank. Zero is a stepping stone, so let me go first and I run out of safe spots." or the mirror line for a non-multiple, chosen by `T % 3`); the lantern pulses the spots `0, 3, 6, …` (or the `T`-based stones) once, so she *sees* the stepping stones before choosing again.
- **Accounting.** A pet win counts one miss (`missEvery`), glowing the right button after every second miss on a crossing (one hint); `Show me` glows the right button on the choice screen, or `pos + bestMove` mid-crossing, exactly as level 2; a second tap plays it for her through `autotouch`. Free-play taps on laid or out-of-reach spots stay free. A win after a wrong choice is impossible against this pet except through her own correct play from a pet-handed position, which is welcome and counted as usual.
- **Finish.** `ctx.finish(tally(t))` after the third crossing reaches `T` for her; one sticker, with or without help.

## Level 4, Bigger steps

- **Round.** Two crossings: the take is stated on the board before the choice ("lay 1 to 3" or "lay 1 to 4", drawn as a stack of up to four stone icons beside the near bank) and spots lit as `+1…+m` ripples. Pool `(T, m)`: `m = 3` with `T ∈ {9, 10, 11, 12, 13}` and `m = 4` with `T ∈ {10, 12, 13, 14, 15, 16}`, one crossing of each take per round, at least one with `T % (m + 1) === 0`, at least one without (seeded).
- **Choose, play, rewind** as level 3, generalised: `bestChoice` and `bestMove` use `m`, and the choice reply `lp4.choice-why` names the count ("spaces of 4 here: `T` is a multiple of 4, so let me go first" and the mirror).
- **Controls.** Tapping any of the next `1..m` spots lays that many stones; spots beyond `pos + m` wobble as in levels 1–2. Targets stay at least `128` units.
- **Layout.** `streamLayout` extends from `3` to `4` rows (`T ≤ 16`: height `4 × 128 + 3 × 44 = 644` units). The build checks every view in `UPRIGHT_VIEWS`, `short`, `shortPhone` and the four landscape views; if a landscape view cannot hold four rows clear of Home/`?`, cap `T` at `13` there rather than shrink a spot (the layout returns the cap, never a smaller target).
- **Accounting and finish** as level 3, two crossings, one sticker.

## Level 5, Last stone loses (misère)

- **Rules she meets.** The far bank becomes a whirlpool (`T`, drawn with a swirl and a *no-landing* ring; the lantern theme moves to the safe spot `T - 1`, which glows softly once she is within reach of it). "Whoever lays a stone on the whirlpool falls in." The take is `2` on `T ∈ {7, 8, 10, 11}`, `3` on `T ∈ {9, 10, 12, 13}`; first/second is still hers to choose, now with `goFirstWins` computed on `effectiveTarget`.
- **Round.** One crossing at take `2`, then one at take `3` (the reversal is the new idea; the `m` change is already known from level 4). One sticker.
- **Reasoning aids.** After a miss the replay lights `T - 1`, then the count back in `m + 1` steps, and the pet says `lp5.whirlpool-why`. `Show me` follows `hintSpot` over `effectiveTarget` and says `lp5.hint-safe` (landing on the safe stone) or `lp5.hint-forced` (when only the whirlpool is left, the position is already lost: rewind to the turning point, as level 2).
- **Not a loss screen.** Falling in plays the pet's gentle splash and "the whirlpool took me, let us step back", never a failure sound; the same rewind and miss accounting as level 3.

## Voice, how-to card, ghost finger and co-play

- **Voice lines (static strings, so Kokoro can render every clip; generate clips only in the batch that adds the lines).** Batch 2: `lp3.intro`, `lp3.instruct.3`, `lp3.instruct.4`, `lp3.go-first`, `lp3.pet-first`, `lp3.choice-why` (two variants by `T % (m + 1)`), `lp4.take-1-3`, `lp4.take-1-4`, `lp4.choice-why`, `lp.hint-choice`. Batch 3: `lp5.intro`, `lp5.instruct`, `lp5.whirlpool-why`, `lp5.hint-safe`, `lp5.hint-forced`, `lp5.splash`. Instructions use `ctx.instruct`, feedback `ctx.say`.
- **How-to cards** are level-scoped additions to `howto.ts`: level 3 "First pick who starts: tap I go first or Pet goes first. Then count back in threes from the far bank."; level 4 "The take is on the board: lay up to 3 or 4 stones. Stepping stones are one more apart than the take."; level 5 "Do not land on the whirlpool. Aim for the stone just before it, then count back." Notes explain the choice rewind and that taps on laid or out-of-reach spots never count.
- **Ghost finger.** `autotouch()` taps the winning choice button on the choice screen, then `pos + bestMove` on every later turn over `effectiveTarget`; it never calls `finish`.
- **Co-play and off-screen additions.** `coplayHint`: "Before the first stone, ask: is this stream a multiple of three? Who should start?" `offScreen`: "Line up 10 spoons, take turns picking 1 to 3; try letting the other person start, then try 'whoever takes the last one loses'."

## Build batches and checks

**`last-pebble 2` (levels 3–4), tier new levels plus a new interaction (the choice screen, a four-row board):**
- `npm run typecheck`, `npx vitest run src/games/last-pebble src/content/barrels.test.ts src/content/game-docs.test.ts`.
- `logic.test.ts` additions: `goFirstWins`/`bestChoice` against an exhaustive game solve for `T ∈ 6..16`, `m ∈ 2..4`; `petMove` optimality for `m = 3, 4`; the `turningPoint` guarantee including the choice case; every pool entry satisfies both-answers-appear; `streamLayout` up to `T = 16` at every view; hint walk from every reachable state, with the choice screen, always wins.
- One filtered browser play on the upright phone viewport (the existing last-pebble suite): level 3 first crossing with a wrong choice (rewind to the choice screen), then the right choice and a finish; level 4 one crossing; `fingerdemo` at levels 3 and 4; one portrait screenshot of the four-row board. Build only if shared files changed.

**`last-pebble 3` (level 5):** the same tier; add an exhaustive misère solve test (`effectiveTarget` equivalence for `T ∈ 6..14`, `m ∈ 2..3`), the forced-whirlpool rewind, and one filtered play of level 5 with `fingerdemo`.

## Not here

Multi-pile Nim, a variable *start* stone count she sets, scores or ratings, timers, any lose screen, or a setting that lets the pet play badly on purpose. Choosing second is never withheld or hinted before she chooses; hints only appear after two misses or on `Show me`.

## Source check

- **NRICH, *Got It*, teachers' notes** (opened in the [study](../deep-dives/subjects/strategy-games.md#anchors-opened-at-their-source)): go-first-or-second question and changing the target and the take; the multiple-of-`k + 1` rule is standard Nim arithmetic.
- **Misère reduction** (`T - 1` as the effective target) is proved above in one line and exhaustively tested in the build batch; no external source is needed.
- Choice screen, whirlpool and level split are original island design.

## Build claim

2026-11-24: `claude/last-pebble-3-4` is building batch `last-pebble 2` (levels 3–4); expected files `src/games/last-pebble/*`, `scripts/browser/suites/` (last-pebble play), `docs/games/last-pebble.md`.
