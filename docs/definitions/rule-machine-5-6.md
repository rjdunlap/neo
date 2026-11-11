# Rule Machine, levels 5–6 (definition)

**Defined 2026-11-11; level 5 built 2026-11-11 (PR #1502, batch rule-machine 3); level 6 (batch rule-machine 4) not built.** Slice AB2 of the [algebra and balance study](../deep-dives/subjects/algebra-balance.md#build-slices-in-order) ([packet row](../deep-dives/subjects/RECOMMENDATIONS.md#algebra-and-balance-recommendations)). It extends the [levels 1–4 definition](rule-machine.md), which is built and stays binding: its accounting rule, its `a × in + b` rule model, its cars, pads, table and help are reused here and only what changes is written down. Two build batches follow ([batch plans](../GAME-BATCHES.md#rule-machine-3-backwards)). Levels 7–8 (AB3) still wait on the band decision and a mathematics educator's read.

**Fun action and purpose.** At level 5 the machine wears its card and a car has *already come out*: she finds the car that went in, and the machine proves it by running it. At level 6 two small machines stand in a row: she says what the pair will make, then builds a pair herself for a wanted in → out, and finds that the same two cards the other way round make something else. Learning goals: *a rule can be run backwards: what came out tells you what went in*; and *two rules in a row make one new rule, and their order matters.* Robot Path teaches order with steps she writes; no island game undoes a rule or chains two.

## What departs from the study

- **Counts stay 0–12 at both levels**, not the study's 0–30, so the built car (counters in rows of five), the pads and the voice's count slots serve unchanged. Larger numbers wait for level 7.
- **Level 5's wrong car runs.** The study has the pet correct a wrong car in words. Here the machine never refuses an input (the levels 1–4 rule), so a wrong car goes through and its true output lands beside the wanted one; every pool rule is increasing, so the pet can always say which way to go ("try a car with more").
- **Level 6's build target is the watched pair reversed, on the same car.** The study asks for "at least one case per round where the reverse order fails". Here every build is that case: she has just watched ×2 then +1 turn 3 into 7 and is asked to make 3 come out as 8, so the order she watched is the natural first try and its answer is the lesson.
- **The first pair she runs for a build target is free**, as a first prediction on a new rule is (the accounting rule below). The study counts every pair that does not fit.

## The accounting rule, extended

The [levels 1–4 rule](rule-machine.md#the-accounting-rule) holds. Added:

- **Level 5: every wrong car counts one miss.** The card hangs on the machine, so this is level 4's last prediction in another form: the rule is known. The wrong car still runs, and its row is written.
- **Level 6's prediction counts** (both cards hang), after one car has gone through by itself.
- **Level 6's build: the first pair run for a target is free; each later pair that does not make the target is one miss.** A pair is only run when both slots are full; placing, lifting and swapping cards is never a miss.
- **A counted wrong gets a retry, the glow comes after two counted misses on one question, and a second ask makes the move as a ghost**, exactly as at 1–4. Hints are counted at most once per machine (level 6: per pair).
- **No "=" anywhere**; the table still writes *in → out*.

## The model (`logic.ts`)

Rules stay `{ kind: 'num', a: 1 | 2 | 3, b: number }` and `apply` stays the only place a rule acts. Nothing in levels 1–4 changes and no level is renumbered.

| Level | ID | Window | A round | Rule pool and inputs | The question (only places a miss can happen) |
| --- | --- | --- | --- | --- | --- |
| 5 Backwards | `back` | school | Two machines, two different rules, each wearing its card from the start. On each, two **wanted** cars in turn: the output stands at the chute's end and the table's open column reads *? → 11*. A fresh tray of five cars rolls in for each | +2, +3, +4, −1, −2, ×2, ×3; every tray car's output is within 0–12; the answer and the wanted output are both at least 1 | Send the car that went in. A wrong car runs, is written into the table and rolls away; the tray keeps the rest |
| 6 Two machines | `chain` | school | Two **pairs**, each one times card (×2, ×3) and one add or take card (+1, +2, +3, −1), in a seeded order; the second pair uses a different add or take card and the other order (times first, then add first, or the reverse). For each pair: one car goes through by itself, one car is predicted on pads, then the cards drop to a shelf of four and she builds a pair for a wanted in → out | Cars 1–6; every middle count and output within 1–12 | The pads (once per pair); each pair she runs after the first |

### Level 5: trays and wanted cars

- **Valid inputs** of a rule are the counts 0–12 whose output is within 0–12 (+3: 0–9; −2: 2–12; ×2: 0–6; ×3: 0–4).
- **A wanted car** is `apply(rule, n)` for a seeded valid `n` with `n ≥ 1` and output at least 1; a machine's two wanted cars have different answers.
- **The tray** is five distinct valid inputs, shown in rising order: the answer; the car whose count is the wanted output itself, when that is a valid input (the "it looks the same" trap: for *11 came out* of +3 there is no 11 car, for *5 came out* of +3 there is a 5 car); then the answer's nearest valid neighbours (one below, one above, two below, …) until there are five. Every pool rule has at least five valid inputs (×3 has exactly 0–4), so the tray always fills.
- **Exactly one tray car is right.** Every pool rule is strictly increasing, so no two counts share an output.
- **`direction(rule, car, wanted)`** is `'more'` when the car's output is below the wanted one and `'fewer'` when above; because the rules are increasing, the answer always lies that way. It is the wrong car's spoken reason and never a hint.
- A wrong car leaves the tray; at most four can go wrong before the answer is the only car left.

### Level 6: pairs, predictions and builds

- **`chain(first, second, n)`** returns `{ mid, out }`: `apply(first, n)` then `apply(second, mid)`.
- **A case** is a times card `t`, an add or take card `s`, an order, a watched car `n` and a predicted car `m ≠ n`, such that the watched order on `n`, the reversed order on `n` and the watched order on `m` all keep `mid` and `out` within 1–12. By enumeration there are 51 such `(t, s, order, n)` (for example ×2 then +1 on cars 1–5; ×3 then +3 only on car 1); the one combination with no second car to predict (+3 then ×3 on car 1) is left out.
- **The watched and the wanted outputs always differ.** ×a then +b makes `a·n + b`; +b then ×a makes `a·n + a·b`; they differ whenever `a > 1` and `b ≠ 0`, which is every case.
- **The build's target** is the watched car `n` and the *reversed* order's output. **The shelf** is four cards in seeded order: ×2, ×3, the pair's add or take card, and one other add or take card chosen so the two add or take cards alone do not make the target (their sum is not `out − n`). Every case has at least two such cards to choose from. So **every pair that fits uses a times card**, and for it the order matters.
- **`fitting(shelf, n, out)`** lists every ordered pair of two different shelf cards whose chain turns `n` into `out` with `mid` within 0–12. It always contains the reversed pair and never the watched order; by enumeration it holds one to four pairs. **Every pair in it is accepted.**
- **`nextCard(shelf, slots, n, out)`** (the hint and the bot): if the placed cards cannot be completed to a fitting pair, it names the placed card to lift (the second slot's first); otherwise the reversed pair's card for the first empty slot.
- **Pads** are the built `pads(right)`: the right output and its neighbours within 0–12.

### Rounds, finishing and ranges

A round is two machines (5) or two pairs (6) and ends in `ctx.finish({ misses, hints })` with one ordinary sticker; every question ends right by her own move, after the glow, or by the ghost. `Plan` gains the two rows and whatever fields the builds need (`wanted: 2` at 5; `pair: true` at 6); `Plan['id']` gains `'back'` and `'chain'`.

`BandLevels`: the first batch sets `school: { min: 2, max: 5 }`, the second `{ min: 2, max: 6 }`; `prek` stays `{ min: 1, max: 1 }`. No `order`; pins stay valid. Stepping is the usual rule: two smooth rounds at 4 reach 5.

## Screen and controls

**Level 5 uses level 2's layout unchanged** (table strip, machine, tray; no pads and no shelf), so `layout(view, 5)` adds no box. What is drawn differently:

- the rule's card hangs on the machine's front from the start, as it does at level 3 once chosen; touching it speaks it;
- the **wanted car** stands at the chute's end (`layout.out`) with its numeral, outlined and softly pulsing, and the table's next free column shows a "?" car above the arrow and the wanted car below. A wrong car's output lands beside the wanted one for a beat, then both the wrong car and its output roll to the siding and its row stays in the table. The table shows the current machine's newest four rows and the open column; older rows slide off the left;
- when the right car runs, its output rolls onto the wanted outline, the "?" fills in, and the next tray rolls in.

**Level 6 has its own machine row** and no tray:

- **The pair:** hopper 130 × 130, first body 160 × 180, a link 70 wide, second body 160 × 180, chute 130 wide: 650 across, so it fits the 700-wide portrait view with margins. Each body's front holds a **slot** of 120 × 120 where its card hangs; the slot centres are 230 apart. The car pauses on the link, drawn in front of the bodies, with its middle count showing.
- **Cars wait at the hopper by themselves** (as level 1's creatures do); she taps the waiting car or the hopper to send the watched one, and the predicted car goes when a pad is answered.
- **The bottom row**, right of the pet in landscape and above the pet's row in portrait, holds the three pads (120 × 120) while a prediction is open and the **shelf of four cards** (120 × 120, 16 apart: 528 across) while she builds.
- **Building.** A tapped shelf card hops to the first empty slot; a tapped slot card hops back to the shelf. A card can also be dragged (`src/engine/drag.ts`): it resolves to a slot when released within 120 units of it, swaps with the card already there, and otherwise returns. Touch-down squashes the card at once. **The pair runs when both slots are full**, after a 0.4-second beat; while it runs, cards ignore taps. After a pair that does not make the target, both cards stay in their slots and wiggle, the car is back at the hopper, and what it made is a row in the table beside the wanted column.
- **The table** at level 6 holds the watched row, the predicted row, then the wanted column (*3 → 8*, outlined) with each built pair's row before it; newest four and the wanted column, as at 5.
- **Budgets.** Landscape 1024 × 768: table strip 150, gap 20, machine 180, gap 30, bottom row 150, as at level 2. Portrait: table, machine, bottom row, stacked as level 2 stacks them. Nothing is under 100 units, and nothing shrinks to fit.
- **Layout audit.** `layout(view, 6)` is pure and joins the existing test at the four views (1024 × 768, 768 × 1024, 1024 × 700, 700 × 1024): the hopper, both slots, the three pads and the four shelf cards are at least 100 units, clear of the pet, the corner buttons and each other.
- **Feel.** `STYLES.hub` as before. Level 6's chug plays two phrases, the second a pentatonic step above the first; a card landing in a slot clicks; the wanted car chimes when the output rolls onto it. Reduced motion halves the runs and holds the middle pause at 0.4 seconds.

## Speech

`ctx.instruct`: level 5 "The card says what the machine does. Find the car that went in." Level 6 "Two machines in a row. Say what comes out, then build your own." The pet repeats it on a tap.

| When | Line (slots are counts 0–12) |
| --- | --- |
| A wanted car appears (5) | "Eleven came out. Which car went in?" |
| A wrong car has run (5) | "Six went in and nine came out. We want eleven. Try a car with more." (or "with fewer") |
| The right car has run (5) | "Eight went in and eleven came out!" |
| The watched car runs (6) | "Three went in. Twice as many makes six. Plus one makes seven." |
| The prediction opens (6) | "Four goes in. How many will come out of the second machine?" |
| A counted wrong pad (6) | The car runs the first machine and stops on the link: "Twice as many makes eight. Now plus one." The pads stay |
| The build opens (6) | "Three went in and seven came out. Now make three come out as eight." |
| A pair that does not fit (6) | "Twice as many makes six. Plus one makes seven. We want eight." After the watched order: "…Try the cards the other way round." |
| A pair that fits (6) | "Plus one makes four. Twice as many makes eight!" |

New lines under `rm.*`: `instruct.5`, `instruct.6`, `back.ask`, `back.want`, `back.more`, `back.fewer`, `back.right`, `chain.step.plus`, `chain.step.take`, `chain.step.twice`, `chain.step.three` (each "… makes {n}"), `chain.goes-in`, `chain.build`, `chain.want`, `chain.other-way`, `card.take-two`; `card.plus` already takes a count slot and now also speaks 1. Nothing needs reading: a card speaks itself on touch. The wording ("what went in", "twice as many", "the other way round") gets the building session's source check against CCSS 3.OA.D.9, 4.OA.C.5 and 5.OA.A.1–2 and England's Year 2 inverse-operations statement, as the October 23 rule requires.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint (at most one per machine or pair) | Never counted |
| --- | --- | --- | --- |
| 5 | each wrong car | the glow on the right car after two wrong cars for one wanted car, or *Show me* | touching the card; anything about the table |
| 6 | each wrong pad; each pair run for a target after the first that does not make it | the glow after two counted misses on one question, or *Show me* | sending the watched car; the first pair run for a target; placing, lifting or swapping cards |

- **Help.** Level 5 glows the right car. Level 6 glows the right pad, or, while building, `nextCard`: a placed card to lift, or the shelf card for the next empty slot; the glow moves on as she follows it. Asked again while the glow is on, the ghost finger makes that move (level 6: one card per ask until the pair runs). Still one hint per machine or pair.
- **Finishing.** One sticker per round, help or not; nothing is kept or filed.
- **Adaptation.** A round at 5 has four wanted cars; a round at 6 has two predictions and two builds. A smooth round is at most one miss and no hint, so at 6 the free first pair keeps a child who tries the watched order once on each build smooth, and one who then needs a third pair on both is not. Assisted completion is one sticker, not evidence of mastery. The game claims she found the input for an output and built a pair for a wanted in → out; it does not claim she understands inverses or composition.

## Rule tests (`logic.test.ts`)

- **Level 5 pool and trays (by enumeration and over 300 seeds):** every pool rule is strictly increasing on 0–12 and has at least five valid inputs; every tray is five distinct valid inputs in rising order and holds the answer; every tray car's output is within 0–12; exactly one tray car makes the wanted output; the tray holds the car whose count is the wanted output whenever that count is a valid input; a machine's two wanted cars have different answers and the round's two rules differ; the same seed gives the same round.
- **Direction:** for every rule, wanted car and wrong tray car, `direction` points from the wrong car's count toward the answer's.
- **Level 6 cases (by enumeration):** every case keeps `mid` and `out` within 1–12 on the watched car in both orders and on the predicted car in the watched order; `m ≠ n`; the watched and wanted outputs differ in every case; the count of `(t, s, order, n)` combinations is 51; a round's two pairs use different add or take cards and opposite orders.
- **Shelf and fitting:** the shelf is ×2, ×3 and two different add or take cards including the pair's own; `fitting` contains the reversed pair, never the watched order and never a pair of two add or take cards; every pair it lists does turn `n` into `out`; it is never empty.
- **Help:** from every slot state (empty, one card, two cards, right or wrong), following `nextCard` reaches a fitting pair in at most four moves; the level-5 glow names the answer car.
- **Accounting:** a wrong car at 5 counts from the first and leaves the question open; at 6 the first pair run for a target never counts and the second does; a wrong pad counts; a second counted miss on one question raises the glow; hints count at most once per machine or pair; a round always reaches its end.
- **Layout:** `layout(view, 5)` equals level 2's boxes; `layout(view, 6)` at the four views as above.
- **Registry, how-to and band tests** pass with `school`'s ceiling at 5, then 6, and a `describeLevel` line for each.

## Ghost finger and how-to card

- **Ghost finger** (`autotouch()`, through the public inputs, reading `game.state` and the layout after every resize; it never calls finish). Level 5: drag the answer car to the hopper for each wanted car. Level 6: tap the waiting car; tap the pad `chain` gives; tap the two shelf cards `nextCard` names, in order.
- **How-to card** (`howto.ts`). Steps: "A car has already come out: send in the car that made it" `{ from: 5, to: 5 }`; "Say what two machines in a row will make, then hang two cards to make the wanted car" `{ from: 6, to: 6 }`. Notes: `{ from: 5, to: 5 }` "A wrong car still goes through, so she can see what it makes; it counts as one miss. After two, the right car glows." `{ from: 6, to: 6 }` "The first pair she tries for a wanted car is never a mistake: the machines show what it makes. The same two cards the other way round make something different, which is the point." The goal and finish lines are unchanged.
- **`describeLevel`:** 5 "Backwards: find the car that went in"; 6 "Two machines: say what they make, then build a pair".
- **Co-play:** at 5, one person covers the tray and asks "what went in?" before she looks; at 6, each person hangs one card. **Off-screen:** the game's *Guess my rule* card gains one line: "then play it backwards: say what came out and ask what went in".
- **Registration, land, skills, music, couch:** unchanged (`rule-machine`, Puzzle Peaks, no couch form). No new save field, engine or shared helper.

## Check tier (for the builds)

- **Batch `rule-machine 3` (level 5), new-level tier:** `npm run typecheck`; the level-5 rule tests with the registry and how-to tests; one filtered scripted play of level 5 to its sticker with two wrong cars on one wanted car and the glow; `fingerdemo` at 5; `npm run build` because the voice and how-to change. Record the tested commit, filter and server URL.
- Level 5's build: source check 2026-11-11 of "what went in / came out" and the inverse framing against CCSS 4.OA.C.5 and England's Year 2 statutory statement (3.OA.D.9 and 5.OA not re-fetched). One departure: the take-away rule icon (`ruleIcon`) draws one crossed counter per counter taken, because −1 and −2 drew the same picture. The game's `coplayHint` does not yet carry the level-5 co-play suggestion.
- **Batch `rule-machine 4` (level 6), new-interaction tier** (the pair, slots and card placing): typecheck; the level-6 rule tests; one filtered scripted play (a wrong pad; the watched order as the free first pair; a second pair that does not fit; the glow followed to a fitting pair; the sticker); one portrait screenshot of level 6 while building; `fingerdemo` at 6; `npm run build`.
- Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. The case counts above were enumerated by a throwaway script while writing; the builds' rule tests are the proof.

## Open decisions

Each has a default the build uses; none blocks the first batch.

1. **Level 5's wrong car.** Default: it runs and counts one miss. If a playtest note says the miss feels unfair when the machine has just "accepted" the car, the first wrong car per wanted car could be free, a one-line change in `counted`.
2. **Level 6's first pair.** Default: free. The study's stricter reading (every non-fitting pair counts) is the same one-line change the other way.
3. **Running the pair.** Default: it runs when both slots are full. A *Go* lever would let her look before running, at the cost of one more control on a phone.
4. **Level 6's pool.** Default: ×2, ×3 with +1, +2, +3, −1. −2 and +4 join only if the 1–12 range is widened, which belongs with level 7.
5. **Two targets per machine at 5.** Default: two (four per round, about as long as level 3). Three would suit a child who finds it quick; it is a `Plan` number.
