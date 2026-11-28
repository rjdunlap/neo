# Market Stall: the sell stall *Is it enough?* and the bakery (definition)

*Game `market-stall` · defined 2026-11-28 on `claude/define-market-stall-sell-bakery` from the dive's [sketches](../deep-dives/market-stall.md#new-levels-on-top) and [build slice 12](../deep-dives/market-stall.md#build-slices-in-order). Docs only: no code, no save field. Two builds, each its own session: the sell stall is a new level; the bakery is a fourth stall skin on every level and changes no level.*

**Fun action and purpose.** *Is it enough?* turns the game round: she keeps the stall and a customer pays her. The customer's shells land on the counter beside a tagged good; she counts what they are worth and either **sells** (taps the good, which hops to the customer) or **asks for more** (taps the open-purse button, and the customer counts on with the shells still missing). Learning goal: counting a handful of mixed coins and comparing the amount with a price, equal or less (2.MD.C.8's counting of coins, K.CC.C.7's comparing; the shopkeeper's check that the payment covers the price). The bakery is a new stall with its own awning, keeper and four baked goods, so every level gets fresh stock to buy.

**Overlap checked.** Level 8 (*How much is in the purse?*) counts a purse and names the total on a card; here the count is a step towards a decision against a price, and the answer is one of two actions, not a number. Level 12 (*Can I buy it?*) compares her own purse with three prices as the buyer; here she judges someone else's payment against one price as the seller. Levels 6 and 11 give change when a customer overpays; the sell stall never overpays, so it stays a yes-or-more judgement and change keeps its own levels. [Lemonade Stand](../games/lemonade-stand.md) forecasts cups and sets prices and never counts a payment; [Swap Meet](../games/swap-meet.md) has no coins. "The shop's mirror, no fees" (the dive's sketch, after Animal Crossing's drop-off box): she is paid the price, nothing is deducted, and **nothing accrues**: the shells go into the stall's till at the end of each order and are gone at the next, never into a saved balance or the [progression loop](progression-loop.md)'s shells.

## Numbering and play order

`PLANS` ends at level 14 (*Which coin?*) on `origin/main`. *Which costs more?* and G1 *Odd coins* are queued ahead of this level, so the sell level takes **the next free ID when it is built** (15 today; 16 or 17 if those land first), appended to `PLANS` and named by a constant `SELL_LEVEL` in `logic.ts`, as `WHICH_LEVEL` is. Nothing is renumbered ([2026-10-23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules)); this page calls it by its name.

- **Bands:** school only. It follows level 8 (counting a purse) and comes before level 9 (the ten-shell coin), since it uses coins 1, 2 and 5 and totals up to 12: `LEVELS.school.order` becomes `[3, 4, 5, 6, 7, 8, SELL_LEVEL, 9, 10, 11, 13, 12]` (plus whatever the queued levels add) and `school.max` becomes `SELL_LEVEL`.
- **Check while raising `max`:** with `max` above 14, the window `3..max` contains *Which coin?* (14), an entry level that the school `order` does not list. The build confirms that `rangeFor` and `describeLevel` read `order` (so 14 is not offered to school), that `ENTRY_LEVELS` still carries a saved 14 to the school band's easiest level, and that the registry and difficulty tests pass; if they do not, `order` is the fix, never a renumbering.

## Level *Is it enough?*: a round, step by step

`mode: 'sell'`, coins `[1, 2, 5]`, prices 4–12, four orders.

1. The stall, awning and keeper are drawn as on every level, and the keeper critter stays drawn where it is, as on levels 6 and 11 (which already say "You keep the stall!" and change nothing about the critter); at this level it speaks as **the customer**, the good hops towards it on a sale, and the paid coins slide into the till rather than to it. The foot purse row is hidden: in its place, centred where the purse coins stand, is one **More, please** button: an open shell purse with a plus beside it (`plusIcon` from `src/ui/icons.ts`), a tap target at least 140 × 140, said aloud on touch-down ("More, please?") as every control is.
2. A good and its tag stand on the stock as on a one-item level. The customer's payment lies on the counter's mat at once, largest first, as on level 8: two to six coins, at least one worth more than 1. "I would like the cupcake. Here are my shells. Is it enough?" (`ctx.instruct`, so the pet repeats it). There is **no total slate and no spoken total**: counting the coins is the puzzle, as on levels 4, 6 and 8. A tap on a coin on the mat says its own value ("five") and bounces it; free, unscored, never moves it, as on level 8. The mat's take-back tap is off.
3. **She taps the good (sell).**
   - If the payment equals the price: the good hops to the customer, the coins slide into the till with the level's chime, and the customer says a thank-you from `shop.thanks`. The order ends.
   - If it is short: a boing, the tag shakes, and "Those shells make 7. The cupcake costs 9." A miss.
4. **She taps More, please.**
   - If it is short: the customer adds the missing amount in the fewest coins, one at a time, counting on aloud from the payment to the price ("7 … 8, 9"; the spoken numbers of `shop.countup`, as level 6's count-up). The mat now holds the price, and the customer asks again: "Is it enough now?" She sells by tapping the good. Asking for more on a short payment is the right answer, never a miss.
   - If it is already exact: a boing and "Count what each shell is worth, then look at the price again." A miss. This is the classic slip of counting coins as ones (four coins, 5 + 2 + 1 + 1, read as "four, not enough"), so the line names coin values.
5. **Help.** After two misses on an order: the coins on the mat are counted aloud largest first ("5, 7, 9"), the total appears on the slate beside the tag for that order, and the right target glows (the good or More, please). One hint, at most one per order, as level 8's.
6. After the fourth order the shell's `ctx.finish({ misses, hints })` ends the round.

Overpaying is left out on purpose: a customer who gives too much needs change, and change already has levels 6 and 11 with their own count-up strip.

## The model (`logic.ts`)

- `SellOrder = Order & { sell: { paid: number[]; more: number[] } }`, made by `makeSellOrders(plan, rng)` for `mode: 'sell'` (other modes keep `makeOrders`). `prices` holds the one price; `paid` is the customer's first payment, largest first; `more` is `[]` on an exact order and otherwise the fewest coins (from `[1, 2, 5]`) for `price − sum(paid)`, largest first.
- **A round:** four orders, two exact and two short, in a seeded shuffle (two of each kind means never three of one kind running; a longer round would keep that rule). Prices are never the same twice running.
- **Payments:** two to six coins (`PURSE_MAX`), at least one worth more than 1, so the coin count is always below the total and a child who counts coins as ones always undercounts. A short payment is 1 to 5 under the price; together with `more` it is at most 9 coins, inside the mat's twelve.
- `sellAnswer(order): 'sell' | 'more'` is `'more'` exactly when `sum(paid) < price`. `sellCountUp(order)` returns the spoken numbers as each `more` coin lands, strictly increasing from `sum(paid)` and ending on the price.
- `describeLevel(SELL_LEVEL)`: "Is it enough? Count what the customer paid, then sell or ask for more."

## Screen and controls

- **Payment coins** use the purse level's counter layout (`purseFor`-style homes on the mat, `COIN_HIT` boxes, rows of six). The added `more` coins fill the next places.
- **The good** is one tap target with its tag, at least 120 × 150, where a one-item level stands it.
- **More, please** sits in the purse row's place at the foot, clear of the pet and Home at every view. The upright test (`upright.test.ts`, every level, five upright views and 360 × 800) gains the button and the good as targets.

## Misses, hints and the bot

Misses: each sell on a short payment and each ask on an exact one (step 3 and 4). Free and never counted: coin value taps, the count-on after a right ask, the second question on the same order. Hint: the counted-aloud total and glow, once per order (`src/progress/coach.ts`). Two smooth rounds step up, two struggling rounds step down, as everywhere. The ghost-finger `autotouch()` taps the target `sellAnswer` gives, and after a `more` waits for the count-on, then taps the good; the how-to card's demo shows one short order (ask, count on, sell).

## Voice lines (`voice.ts`)

New: `shop.sell.ask` ("I would like the {fruit}. Here are my shells. Is it enough?"), `shop.sell.again` ("Is it enough now?"), `shop.sell.more` ("More, please?", the button's touch-down name), `shop.sell.short` ("Those shells make {t}. The {fruit} costs {n}."), `shop.sell.enough` ("Count what each shell is worth, then look at the price again."), `shop.sell.hint` ("Count them, biggest first: {n}."; may reuse `shop.purse.hint` if the build finds the words fit). Reused: `shop.countup`, `shop.thanks`, `shop.done`. Run `node scripts/content-barrels.mjs` after the edit; device speech covers the new lines until a voice batch renders them.

## How-to card and co-play

A `LevelLine` for the level: "Count the customer's shells. Enough? Tap the good. Not enough? Tap the purse for more." Co-play: "Be the customer: pay with real coins or buttons, sometimes too few, and let her tell you." Off-screen: at a real shop counter or a pretend one, she counts what you hand over before giving the item.

## Rule tests (`logic.test.ts`)

For seeds 0–199: every order's price is 4–12; `paid` has 2–6 coins, at least one above 1, largest first, and its sum is the price (exact) or 1–5 below it (short); each round has two exact and two short; prices never repeat back to back; `more` is empty on an exact order and is the fewest coins for the gap on a short one, and `paid` plus `more` never exceeds 12 coins and sums to the price; `sellAnswer` agrees with the comparison; `sellCountUp` strictly increases and ends on the price; the coin count of `paid` is always below its total. Plus the level constants: `SELL_LEVEL` equals the plan's index, school `order` places it after 8 and before 9, and `describeLevel` names it.

## The bakery stall (a skin, every level)

A fourth entry in `STALL_IDS` and `STALLS` (`index.ts`): `bakery`, **orange** awning, **dog** keeper (the other stalls use red/pig, purple/cat and teal/bear), and four goods, each a new `PropKind` in `src/art/props.ts`, drawn in code at fruit size (about 90 across) and passed through the paper look like every prop ([ART-STYLE](../ART-STYLE.md)):

| Kind | Name (spoken) | Colour | Shape |
| --- | --- | --- | --- |
| `loaf` | loaf of bread | orange | a long domed loaf with three diagonal slashes |
| `bun` | bun | yellow | a round bun with a sprinkle of seeds (dots) |
| `cupcake` | cupcake | pink | a pleated wrapper with a swirl of icing and a cherry |
| `cookie` | cookie | orange | a round cookie with darker chips; if [Monster Munch](../games/monster-munch.md)'s `foodArt('cookie')` already draws this, move that drawing into `props.ts` unchanged and have both games call it, rather than drawing a second cookie |

- **What stays the same.** `GOODS` (the six fruit) remains the sticker's recipe, so the pinned sticker snapshot for seeds 0–99 and the `coinArt` drawings do not change; coins, tags, mat and rules are shared by every stall. Which stall a seeded round draws changes (four choices instead of three), which is round scenery only: no save, pin or sticker depends on it.
- **Names in lines.** Every name reads after "a" in `shop.pair` ("A {a} for {n}…") and after "the" elsewhere. An incidental found while defining this: the fruit stall's **orange** already reads "A orange for 4" or "and a orange for 3" on the pair levels. The bakery build fixes both slots, `{a}` and `{b}`, with an article chosen from the name (`an` before a vowel sound), tested in both slots over every stall's goods, and keeps all four bakery names starting with a consonant regardless.
- **Placement.** Goods stand where fruit stands (`goodPlacement`'s `y: -10`); none hangs like a balloon. The stall test already asks that every stall lays out clear of the pet at four views and has enough distinct names for paired orders; it gains the bakery by reading `STALL_IDS`.
- **Tests.** The existing "seeds every stall reproducibly, with distinct awnings, keepers and enough named goods" test covers the new entry; add the article test above, and keep the sticker snapshot unchanged (a changed snapshot fails the build). The swatch book (`/?paper`) is not changed; the props are checked in the stall itself.

## Build and check tier

Two build sessions, either order (they touch different parts of `index.ts`; build the bakery first if both are picked the same day, so the sell level's screenshot shows four possible stalls):

1. **Bakery stall.** Shared art (`src/art/props.ts`) changes, so: typecheck, Market Stall rule tests (stalls, sticker snapshot, the article), the upright test, Monster Munch's tests if its cookie moves, `npm run build`, and one portrait screenshot of the bakery stall at level 1 (a filtered play, `BROWSER_SUITE=woods WOODS_ONLY=shop`, with a seed that draws the bakery). Cost: S–M (four code-drawn props and one table row).
2. **Is it enough?** A new interaction (the More, please button and the two-way choice): typecheck, Market Stall rule tests, the upright, how-to and registry tests, one filtered scripted play at the new level (one wrong sell, one wrong ask, one hint), `fingerdemo` at it, one portrait screenshot. `npm run build` only if shared files change. Cost: M (one mode, one button drawing, six voice lines, a bot rule, the order and `max` change). Update the game page, README row and GAMES.md through `npm run game-docs`, and the browser loop's top level and `fingerdemo`'s levels, as the dive's build-slice note asks.

## Open decisions

None for the developer. Choices made here, which a build session may revise with a note on this page: the keeper critter plays the customer where it already stands, as on levels 6 and 11 (no second critter drawn); overpaying is left to the change levels; the level sits after 8 in the school order; the bakery uses the dog keeper and an orange awning.
