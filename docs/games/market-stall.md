# Market Stall

<!-- generated: from src/games/market-stall; edit the text below the end mark (npm run game-docs) -->

**ID:** `market-stall` · **Land:** Cozy Village · **Ages:** preschool–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** counting, money, adding, counting-on

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1–2 |
| pre-K | 2–4 |
| school | 3–7 |

| Level | Plays like |
| --- | --- |
| 1 | Count out 1 to 4 shell coins for the price |
| 2 | Pay 2 to 6 with ones and twos |
| 3 | Pay 3 to 9 with ones, twos and fives |
| 4 | Two things to buy: add the prices, then pay |
| 5 | Pay the same price two different ways |
| 6 | Keep the stall: a customer pays 10, give the change |
| 7 | Pay 4 to 10 with as few shell coins as possible |

<!-- end generated -->

**Starts as:** count out shell coins at fruit, flower or balloon stalls

**Grows into:** ones and twos, fives, adding two prices, paying two different ways, giving change from 10 by counting up, paying with the fewest shells; named payment slips and one hint per order

## Design notes

*After Neopets shops and pretend shops.* Tap shell coins worth 1, 2 and 5 onto the mat; tap one on the mat to take it back (the nearest coin to the finger); ring the bell. Price tags show the numeral and dots. Running totals are said aloud except where adding up is the puzzle (two items, giving change). At levels 1, 2, 3, 5 and 7, the levels where the voice counts on, the total of the coins on the counter is also drawn on a small white slate on the counter's edge beside the bell (`drawTotal()`; `showsTotal`, `totalShown` and `TOTAL_SLATE` in `logic.ts`): it appears with the first coin, follows every coin put down or taken back, is hidden while the counter is empty, never changes colour (the bell is still the check) and is not drawn at levels 4 and 6 (the ten strip already counts up the change). The same `showsTotal` rule decides the spoken total, so a coin named for the first time says its name and the slate shows the total. Later levels pay two prices together, pay the same price a second, different way, give change from a customer's 10, then pay prices from 4 to 10 with the fewest shells. An exact but longer payment at that last step stays on the mat with an invitation to swap; repeating the invitation counts as a miss. Wrong amounts get a boing and a specific spoken explanation: coin values rather than coin count, one shell off, one of two prices, returning the price instead of change, or a coin bigger than the amount. Other totals get a too-much/too-little comparison. Two misses show faint coins; help counts once per order, even if both ways of paying need support. A full counter speaks a free invitation to swap coins. At levels 2 and 3 the first tap of a coin that is new at that level (the 2 at level 2, the 5 at level 3) has the pet name it instead of counting ("That is a two. It is worth two.") and the purse coin pulses; this happens once per game start and is neither a miss nor a hint. At levels 1–3 every coin (purse, mat and faint hint coins) also shows one ink pip per shell of value, five to a row, under a smaller numeral, on a Market Stall layer only, so the pips can be matched to the tag's dots; the hub icon, sticker and Lemonade Stand's coins are unchanged. At mix (3), ways (5) and fewest (7) the two-miss hint first says a strategy line ("Try the biggest coin that fits first, then fill up what is left.", or on a ways level's second payment "Try different coins: swap a big coin for smaller ones, or smaller ones for a big one.", since biggest-first could repeat the first way), then shows the faint coins as before; still one hint per order. Each round seeds a fruit, flower or balloon stall with its own awning and keeper. Flowers and balloons are named by color so two-item orders stay distinct; coins, tags, mat and payment rules are shared. The sticker keeps its original six-fruit recipe.

Level 6 counts up the change: each change coin says its value, then the shopkeeper counts up from the price ("2. 7… 8, 9"; the count line is templated, so it uses device speech), and a ten strip under the price tag shows price cells green and change cells yellow, with a red edge when too much change is on the mat. The rules are `countsUp`, `countUpWords`, `countUpText`, `countUpSaid` and `tenStrip` in `logic.ts`.

**What the guide repeats (level 5).** In the `ways` mode, "Thank you! Now buy another one, and pay a different way!" (`shop.again`) is an instruction (`ctx.instruct`), because paying the same way again is a miss and the standing instruction does not say to change; the next order instructs its own line. `shop.fewer`, `shop.full`, coin names, counts and hints stay `say`.
