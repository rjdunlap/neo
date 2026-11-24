# Market Stall levels 12–13: Can I buy it? and Trade up (definition)

**Built:** level 12 (2026-11-23, PR pending); to build level 13, read “Level 13: Trade up”.

**Level 12 as built, where it differs from the text below.** (1) The purse amount is folded into the instruction lines `shop.afford.ask` (“Your purse has {n} shells. Which one can you buy?”) and `shop.spend.ask`, so there is no separate `shop.afford.purse` line. (2) The shelf sits 40 units right of `stockX + (i−1)×150` (`SHELF.shift`) so the leftmost good stays inside the awning. (3) The purse coins on the mat are drawn at scale 1.25. (4) `LEVELS.school.order` is not added yet; it comes with level 13. Three device-free clips were rendered with Kokoro (“Pick two things.”, “That one costs more than your purse too.”, “Two things. Put one back first.”).

*Game `market-stall` · school band · defined 2026-11-21 from [dive slice 10](../deep-dives/market-stall.md#build-slices-in-order) and the dive's [new levels table](../deep-dives/market-stall.md#new-levels-on-top), with the calls the developer delegated on 2026-10-23 (the dive's [decided note](../deep-dives/market-stall.md#decisions-for-the-developer)): define both now, a first "too dear" tap is a miss and a nudge after, level 13 ships unscored, `order` places the inversions. Docs only; nothing here is built.*

**Fun action and purpose.** Level 12, *Can I buy it?*: a purse of real shell coins lies on the counter and three goods sit on the shelf with their tags. First she taps something the purse can buy; then she spends the whole purse on exactly two things. Learning goal: whether an amount covers a price (comparing numbers to 20, K.CC.C.7) and which two prices make a total (1.OA.B.4, a missing addend found from a set). Level 13, *Trade up*: a heap of 1-coins lies on the counter; she picks a few coins that together make a bigger coin and trades them for it, until the fewest coins are left, then rings the bell. Learning goal: equal value in fewer coins, ten ones as one ten (1.NBT.B.2a, the Bank Game's exchange, *Money Pieces'* trade).

**Overlap checked.** [Swap Meet](../games/swap-meet.md) trades pictured toys one for one and says a shell is a toy, never currency, so it owns no coin exchange. [Lemonade Stand](../games/lemonade-stand.md) sets prices and never asks whether a purse covers one. Level 7 (*fewest*) asks for the fewest coins when *paying*; level 13 reaches the same set by *exchanging* a heap she already holds, so the test "fewest by trades equals `fewest`" ties the two together.

## Order of building and level IDs

Both levels need pieces that the dive's slices 4–7 (levels 8–11) bring, so they are built after those, in level order:

- **Level 9 (slice 5)** brings the 10-coin into play, the ten-bar tag for prices 11–20, the raised `makeOrders` cap and a mat row spacing that fits the 88-wide 10-coin. Level 12's purses reach 14 and its prices 19; level 13 trades 5 + 5 for a 10.
- **Level 11 (slice 7)** makes `PAID` a plan field; nothing here depends on it, but saved IDs stay unbroken only in level order.

The IDs are **12** and **13** if levels 8–11 land first, as planned. If anything takes those numbers first, each takes the next free ID, and this page's numbers are read as names.

**Play order.** The school range becomes 3–13. Following the 2026-10-23 call, `LEVELS.school.order` places Trade up before Can I buy it? (13 is the easier idea, though the heavier interaction): `[…, 11, 13, 12]`. Where level 8 sits in that order is slice 4's call, not this page's. Preschool 1–2 and pre-K 2–4 are unchanged.

## Level 12: Can I buy it?

`mode: 'afford'`, coins `[1, 2, 5, 10]`, four orders: two **choose** orders, then two **spend** orders. No new interaction beyond tapping goods and the bell she already knows.

### A round, step by step

1. The stall, keeper and awning are drawn as on every level. **The foot purse row is hidden** (nothing is added at this level). Her purse for the order lies on the counter's mat: `fewest(purse, [1, 2, 5, 10])`, at most three coins (every purse from 6 to 14 is three coins or fewer), spaced 160 apart along the mat's middle row so each is its own target. The slate shows the purse's total, and the keeper says it: "Your purse has 9 shells." A tap on a purse coin says its value ("five") and bounces it; free, unscored, never moves it. The mat's take-back tap is off at this level.
2. **Choose order.** Three goods on the shelf, each with its tag. "Which one can you buy?" (`ctx.instruct`). The bell is hidden.
   - A tap on a good whose price is at most the purse: the good hops, and the keeper says "Yes! 6 is less than 9." or, for a price equal to the purse, "Yes! 9 is just enough." The order ends. Nothing is spent: the question is whether it can be bought, so no coins move and no change is modelled.
   - A tap on a good that costs more: a boing, its tag shakes, and "That costs 12, and your purse has 9." The first such tap in an order is a miss. A second too-dear tap in the same order (the same good or the other one) is the nudge: no miss, "That one costs more than your purse too", and an affordable good glows (one hint).
3. **Spend order.** A new purse and shelf. "Spend the whole purse on two things." (`ctx.instruct`). The bell is shown in its usual place.
   - A tap on a good picks it: it lifts and gains a green ring. A tap on a picked good puts it back (free undo). A third pick replaces nothing: it boings softly with "Two things. Put one back first." (not a miss).
   - The bell with fewer than two picked: "Pick two things." Not a miss.
   - The bell with two whose prices sum to the purse: the purse coins slide to the keeper with the level's usual chime, the two goods hop, and "6 and 3 make 9. You spent it all!" The order ends.
   - The bell with two that do not: a boing, "6 and 4 make 10. Your purse has 9." Each such bell is a miss. Both goods stay picked, so she can swap one rather than start again. After two misses in the order, the right pair glows and "These two make 9." (one hint, at most one per order).
4. After the fourth order the shell's `ctx.finish({ misses, hints })` ends the round.

### The model (`logic.ts`)

- `AffordOrder { kind: 'choose' | 'spend'; purse: number; prices: [number, number, number] }`, made by `makeAffordOrders(rng)` for `mode: 'afford'` (the other modes keep `makeOrders`).
- **Purses:** 6–14, never the same twice running.
- **Choose shelves:** three distinct prices in `[max(1, purse − 5), purse + 5]`, at least one at most the purse and at least one above it. Exactly one of the round's two choose shelves includes a price equal to its purse (the "just enough" case), so the boundary is met every round.
- **Spend shelves:** three distinct prices, each in `[2, purse − 2]`, with exactly one pair summing to the purse and no single price equal to it. With three distinct prices a second pair cannot also make the purse (a + b = a + c forces b = c), so the acceptance rule `spendsAll(order, picked)` checks any pair whose sum equals the purse and the uniqueness is a property of the shelf, not of the rule.
- `canBuy(order, price) = price <= order.purse`; `affordHint(order)` returns the cheapest affordable good's index; `spendHint(order)` returns the pair.
- `describeLevel(12)`: "Can I buy it? A purse of 6 to 14 shells against three prices, then spend it all on two things."

### Screen and controls

- **Goods:** three on the shelf at `stockX + (i − 1) × 150`; each good and its tag are one tap target at least 120 wide and 150 tall, the gap between them 30. The ten-bar tag from level 9 for prices 11 and up.
- **Purse coins:** on the mat, at most three, 160 apart; each tap target the coin's 115 box (`COIN_HIT`).
- **Bell:** `BELL_HIT`, where it is on every level, shown only on spend orders.
- **Upright (768 × 1024):** the shelf's leftmost good stays inside the awning (x ≥ `cx − 340` + half its box) and clear of the keeper; the build runs `upright.test.ts`, which already walks every level and five views, with the goods' boxes added as targets.

## Level 13: Trade up

`mode: 'trade'`, coins `[1, 2, 5, 10]`, three orders. **A new interaction:** selecting several coins on the mat and a TRADE button.

### A round, step by step

1. The foot purse row is hidden. Instead the foot holds three round buttons, spread like the purse (`purseFor`'s span, clear of the guide): **undo** (a back arrow), **TRADE** (a two-coins-into-one picture and the word) and the **bell**. Each is at least `BELL_HIT` across.
2. The mat holds a heap of 1-coins: **ten on the first order**, then two seeded amounts from 6 to 12, never the same twice running. At this level the mat lays coins out in two rows of six, **100 apart in both directions**, so each coin's cell is a 100 × 100 target (the mat grows to 600 × 200 for this level, centred on the counter's 680 × 200 front rather than at today's `cx − 50`; the upright test checks it against the keeper and the counter's top board). "10 shells. Can you trade them for fewer coins?" (`ctx.instruct`). The slate shows the amount, which never changes.
3. **Selecting.** A tap on the mat toggles the coin nearest the finger: a selected coin lifts and gains a white ring. Nothing is wrong to select.
4. **Trading.** TRADE glows when the selection has at least two coins and its total is a coin in the set (2, 5 or 10). A tap on the glowing TRADE slides the selected coins together into one coin of that value, with a rising pentatonic note, and names it: "Two, two and one make five." A tap on TRADE when it is not glowing says "Pick coins that make 2, 5 or 10." and nothing else (never a miss). The total on the counter never changes.
5. **Undo** takes back the last trade exactly: the bigger coin splits into the coins it came from. Undo is needed, not a nicety: trading up alone can leave a heap that cannot reach the fewest set (eight as four 2s: no group of 2s makes 5 or 10). Undo is always free.
6. **The bell.**
   - With the fewest set (`fewest(amount, coins)`): the keeper takes the coins, "10 shells in only one coin!", and the order ends.
   - Otherwise it is never a miss. The first time in an order: "Can you trade some more?" From the second time, help: if the heap can still reach the fewest set, the coins of the next useful trade glow (`nextTrade`); if it cannot (`stuck`), undo glows with "These cannot make a bigger coin. Undo a trade and try another." The glow is one hint, at most one per order.
7. After the third order, `ctx.finish({ misses: 0, hints })`.

**Unscored, as decided.** `misses` is always 0 at this level: no selection, trade or bell is wrong. The glow is help, so it still counts as a hint (at most one per order): assisted completion must not read as independent mastery, and two hinted rounds still step her down by the usual rule.

### The model (`logic.ts`)

- `TradeOrder { amount: number }` from `makeTradeOrders(rng)`; the heap starts as `amount` ones.
- `tradeTo(selection, coins)`: the coin a selection trades for, or null (null when fewer than two coins or the total is not in the set).
- `trade(heap, selection)` and `undo(history)`: pure, so the screen and the tests share them; a trade preserves the total.
- `nextTrade(heap, amount)`: the first trade of a shortest path (fewest trades) to the fewest set, found by breadth-first search over heaps (at most 12 coins, so the search is tiny), or null when `stuck`.
- `stuck(heap, amount)`: true exactly when no sequence of trades reaches the fewest set.
- `describeLevel(13)`: "Trade up: swap small coins for a bigger one until 6 to 12 shells are the fewest coins."

## Misses, hints and accounting (both levels)

| Level | Counts a miss | Counts a hint | Free |
| --- | --- | --- | --- |
| 12, choose | the first too-dear tap of an order | the second too-dear tap's glow (once per order) | tapping purse coins |
| 12, spend | each bell with a wrong pair | the pair's glow after two misses (once per order) | picking and putting back goods; the bell with fewer than two; a third pick |
| 13 | never | the bell's glow from the second early bell (once per order) | selecting, trading, undo, a dim TRADE |

Counted with `src/progress/coach.ts`. A round of level 12 has at most two misses from its choose orders, so a struggling round there is made in the spend orders, where adding is the work.

## The bot (`autotouch`)

- **12, choose:** tap the cheapest affordable good. **Spend:** tap the two goods of `spendHint`, then the bell.
- **13:** while the heap is not the fewest set, select the coins of `nextTrade` one tap at a time, then TRADE; then the bell. The scripted play's wrong answer is a too-dear tap on 12 and an early bell on 13.

## Voice lines (`voice.ts`)

New `shop.*` lines, slotted (they stay on device speech under the [voice plan](../ROADMAP.md#a-better-voice)): `afford.purse` "Your purse has {n} shells."; `afford.ask` "Which one can you buy?"; `afford.yes` "Yes! {p} is less than {n}."; `afford.just` "Yes! {n} is just enough."; `afford.dear` "That costs {p}, and your purse has {n}."; `afford.dearAgain` "That one costs more than your purse too."; `spend.ask` "Spend the whole purse on two things."; `spend.two` "Pick two things."; `spend.full` "Two things. Put one back first."; `spend.wrong` "{a} and {b} make {s}. Your purse has {n}."; `spend.hint` "These two make {n}."; `spend.yes` "{a} and {b} make {n}. You spent it all!"; `trade.ask` "{n} shells. Can you trade them for fewer coins?"; `trade.made` "{list} make {v}."; `trade.pick` "Pick coins that make 2, 5 or 10."; `trade.more` "Can you trade some more?"; `trade.stuck` "These cannot make a bigger coin. Undo a trade and try another."; `trade.yes` "{n} shells in only {k} coins!" (with "one coin" for k = 1).

## How-to card (`howto.ts`)

Bounded `LevelLine`s: level 12 "Tap what your purse can buy. Then pick two things that use the whole purse and ring the bell." with a demo of one good tapped; level 13 "Tap coins that make a bigger coin, then TRADE. Undo takes a trade back. Ring the bell when the coins are as few as can be." with a demo of two ones selected and traded. Both demos follow the input in use, as every card does.

## Co-play and off-screen

Level 12: "Give her a purse of real coins at a pretend shop with three prices: which can she buy?" Level 13: "A cup of ones and a tray: five ones become a five, two fives a ten." Both match the dive's grown-ups' table rows for 12 and 13.

## Rule tests (`logic.test.ts`)

- **12:** purses 6–14 and never the same twice running; every purse is three coins or fewer; every choose shelf has three distinct prices with at least one affordable and one too dear; exactly one choose shelf per round has a price equal to its purse, and `canBuy` accepts it; every spend shelf has exactly one pair summing to the purse and no single price equal to it; `spendsAll` accepts that pair in either order and rejects every other pair; `affordHint` is affordable; `spendHint` is the pair; a choose order earns at most one miss.
- **13:** `tradeTo` accepts any selection of at least two coins totalling 2, 5 or 10 and nothing else; a trade preserves the total; `undo` restores the exact heap; from every heap reachable by trades for amounts 6–12, `stuck` agrees with a breadth-first search, and `nextTrade` (when not stuck) leads to the fewest set; from the starting heap of ones the fewest set is reached in at most six trades (the dive's bound; four at 12); the set reached by trades equals `fewest(amount, coins)`; the first order's amount is 10.
- **Both:** `describeLevel` names 12 and 13 and does not clamp; the school `order` ends `11, 13, 12`; the how-to lines are bounded; `upright.test.ts` passes at every level with the new targets (goods, the three foot buttons, the 100-spaced mat cells).

## Build and check tier

Two build sessions, in order, each after levels 8–11:

1. **Level 12, Can I buy it?** New modes on existing taps plus the bell: typecheck, Market Stall rule tests, the upright, how-to and registry tests, one filtered scripted play at 12 (`BROWSER_SUITE=woods WOODS_ONLY=shop`, one too-dear tap, one wrong pair, one hint), `fingerdemo` at 12, one portrait screenshot. The school `max` and `order` grow here.
2. **Level 13, Trade up.** A new interaction: the same tier at 13 (an early bell, one stuck undo, the hint), plus one portrait screenshot of the foot buttons and a full mat. `npm run build` only if shared files change.

Each slice updates the game page, the README row and GAMES.md through `npm run game-docs`, the browser loop's top level and `fingerdemo`'s levels, as the dive's build-slice note asks.

## Open decisions

None for the developer: the 2026-10-23 note settled the windows, the miss-then-nudge, the unscored trade and the order. Choices made here, which a build session may revise with a note on this page: nothing is spent on a choose order; level 13's glow counts as a hint although no miss is ever counted; the shelf holds three goods on both kinds of order.
